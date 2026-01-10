import { Response } from 'express';
import { body, query } from 'express-validator';
import path from 'path';
import fs from 'fs';
import VideoMetaInfo from '../models/VideoMetaInfo';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';

// Validation rules
export const uploadVideoValidation = [
  body('videoName').trim().notEmpty().withMessage('Video name is required'),
  body('videoDescription').optional().trim(),
  body('tags').optional(),
];

// Upload Video
export const uploadVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No video file uploaded' });
      return;
    }

    const { videoName, videoDescription, tags, organizationAccess, groupAccess } = req.body;

    // Parse tags if string
    const parsedTags = typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()) : tags || [];

    // Parse organization access
    const parsedOrgAccess = organizationAccess ? JSON.parse(organizationAccess) : { enabled: false, role: 'viewer' };

    // Parse group access
    const parsedGroupAccess = groupAccess ? JSON.parse(groupAccess) : [];

    // Create video metadata
    const video = new VideoMetaInfo({
      filename: req.file.filename,
      filePath: req.file.path,
      videoType: req.file.mimetype,
      videoName,
      videoDescription: videoDescription || '',
      status: 'processing',
      uploadedBy: req.user._id,
      userType: 'user',
      organizationAccess: parsedOrgAccess,
      groupAccess: parsedGroupAccess,
      tags: parsedTags,
    });

    await video.save();

    // Emit upload complete event
    const io = req.app.get('io');
    if (io) {
      io.to(req.user._id.toString()).emit('upload:complete', {
        videoId: video._id,
        status: 'processing',
      });

      // Start sensitivity check in background
      checkVideoSensitivity(video._id.toString(), req.file.path, req.user._id.toString(), io);
    }

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: {
        id: video._id,
        videoName: video.videoName,
        status: video.status,
      },
    });
  } catch (error: any) {
    console.error('Upload video error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Background sensitivity check
async function checkVideoSensitivity(videoId: string, videoPath: string, userId: string, io: any) {
  try {
    console.log(`🔍 Starting sensitivity check for video ${videoId}`);
    
    // Import the service dynamically to avoid circular dependencies
    const { default: googleVideoIntService } = await import('../services/google-video-intelligence.service');
    
    // Emit checking status
    io.to(userId).emit('sensitivity:checking', {
      videoId,
      message: 'Analyzing video content...'
    });

    // Perform analysis
    const result = await googleVideoIntService.analyzeVideo(videoPath);

    // Update video status
    const newStatus = result.isSafe ? 'safe' : 'flagged';
    await VideoMetaInfo.findByIdAndUpdate(videoId, {
      status: newStatus,
    });

    console.log(`✅ Sensitivity check complete for ${videoId}: ${newStatus}`);

    // Notify client
    io.to(userId).emit('sensitivity:result', {
      videoId,
      status: newStatus,
      confidence: result.confidence,
      labels: result.labels,
    });
  } catch (error) {
    console.error('Sensitivity check error:', error);
    
    // Mark as safe if check fails (fail-open approach)
    await VideoMetaInfo.findByIdAndUpdate(videoId, {
      status: 'safe',
    });

    io.to(userId).emit('sensitivity:result', {
      videoId,
      status: 'safe',
      error: 'Analysis failed, marked as safe by default',
    });
  }
}

// Get Library Videos
export const getLibraryVideos = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { filter = 'all', page = 1, limit = 12 } = req.query;
    const userId = req.user._id;

    let query: any = {};

    if (filter === 'mine') {
      // Only videos uploaded by the user
      query.uploadedBy = userId;
    } else if (filter === 'shared') {
      // Videos shared with user (organization or groups)
      const user = await User.findById(userId);
      
      query = {
        uploadedBy: { $ne: userId },
        $or: [
          // Videos shared via groups
          { 'groupAccess.group': { $in: user?.groups || [] } },
          // Videos shared via organization
          ...(user?.organization ? [{ 'organizationAccess.enabled': true, uploadedBy: { $ne: userId } }] : []),
        ],
      };
    } else {
      // All accessible videos
      const user = await User.findById(userId);
      
      query = {
        $or: [
          // User's own videos
          { uploadedBy: userId },
          // Videos shared via groups
          { 'groupAccess.group': { $in: user?.groups || [] } },
          // Videos shared via organization
          ...(user?.organization ? [{ 'organizationAccess.enabled': true }] : []),
        ],
      };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const videos = await VideoMetaInfo.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('uploadedBy', 'name username')
      .populate('groupAccess.group', 'group_name');

    const total = await VideoMetaInfo.countDocuments(query);

    res.json({
      videos,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get library videos error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Video by ID
export const getVideoById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const video = await VideoMetaInfo.findById(id)
      .populate('uploadedBy', 'name username email')
      .populate('groupAccess.group', 'group_name description');

    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }

    // Check access permission
    const user = await User.findById(userId);
    const hasAccess =
      video.uploadedBy._id.toString() === userId.toString() ||
      video.groupAccess.some((ga: any) => user?.groups.some((g: any) => g.toString() === ga.group._id.toString())) ||
      (user?.organization && video.organizationAccess.enabled);

    if (!hasAccess) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    // Determine user's role
    let userRole = 'viewer';
    if (video.uploadedBy._id.toString() === userId.toString()) {
      userRole = 'admin';
    } else {
      const groupRole = video.groupAccess.find((ga: any) =>
        user?.groups.some((g: any) => g.toString() === ga.group._id.toString())
      );
      if (groupRole) {
        userRole = groupRole.role;
      } else if (user?.organization && video.organizationAccess.enabled) {
        userRole = video.organizationAccess.role;
      }
    }

    res.json({ video, userRole });
  } catch (error: any) {
    console.error('Get video error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Video
export const updateVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { videoName, videoDescription, tags } = req.body;

    const video = await VideoMetaInfo.findById(id);
    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }

    // Check if user has editor or admin role
    const user = await User.findById(userId);
    const isOwner = video.uploadedBy.toString() === userId.toString();
    
    if (!isOwner) {
      // Check group access
      const groupRole = video.groupAccess.find((ga: any) =>
        user?.groups.some((g: any) => g.toString() === ga.group.toString())
      );
      
      const hasEditPermission =
        groupRole?.role === 'editor' ||
        groupRole?.role === 'admin' ||
        (user?.organization && video.organizationAccess.enabled && ['editor', 'admin'].includes(video.organizationAccess.role));

      if (!hasEditPermission) {
        res.status(403).json({ message: 'You do not have permission to edit this video' });
        return;
      }
    }

    // Update video
    video.videoName = videoName || video.videoName;
    video.videoDescription = videoDescription || video.videoDescription;
    video.tags = tags || video.tags;

    await video.save();

    res.json({ message: 'Video updated successfully', video });
  } catch (error: any) {
    console.error('Update video error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Video
export const deleteVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const video = await VideoMetaInfo.findById(id);
    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }

    // Only owner or admin can delete
    if (video.uploadedBy.toString() !== userId.toString()) {
      res.status(403).json({ message: 'Only the video owner can delete this video' });
      return;
    }

    // Delete file
    if (fs.existsSync(video.filePath)) {
      fs.unlinkSync(video.filePath);
    }

    await VideoMetaInfo.findByIdAndDelete(id);

    res.json({ message: 'Video deleted successfully' });
  } catch (error: any) {
    console.error('Delete video error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Stream Video
export const streamVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const video = await VideoMetaInfo.findById(id);
    if (!video) {
      res.status(404).json({ message: 'Video not found' });
      return;
    }

    // Check access
    const user = await User.findById(userId);
    const hasAccess =
      video.uploadedBy.toString() === userId.toString() ||
      video.groupAccess.some((ga: any) => user?.groups.some((g: any) => g.toString() === ga.group.toString())) ||
      (user?.organization && video.organizationAccess.enabled);

    if (!hasAccess) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    // Stream video file
    const videoPath = video.filePath;
    if (!fs.existsSync(videoPath)) {
      res.status(404).json({ message: 'Video file not found' });
      return;
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': video.videoType,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': video.videoType,
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error: any) {
    console.error('Stream video error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
