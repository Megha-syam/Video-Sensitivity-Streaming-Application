import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  uploadVideo,
  getLibraryVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  streamVideo,
  uploadVideoValidation,
} from '../controllers/video.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// Configure multer for video upload
// Use Cloudinary in production, local storage in development
import { storage as cloudinaryStorage } from '../config/cloudinary.config';

const isDevelopment = process.env.NODE_ENV !== 'production';

const storage = isDevelopment
  ? multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/');
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
      },
    })
  : cloudinaryStorage;

const fileFilter = (req: any, file: any, cb: any) => {
  // Accept video files only
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
});

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/videos/upload:
 *   post:
 *     summary: Upload a new video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - video
 *               - videoName
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file (max 500MB)
 *               videoName:
 *                 type: string
 *                 example: My Awesome Video
 *               videoDescription:
 *                 type: string
 *               tags:
 *                 type: string
 *                 example: family,vacation,2024
 *               organizationAccess:
 *                 type: string
 *                 example: '{"enabled": true, "role": "viewer"}'
 *               groupAccess:
 *                 type: string
 *                 example: '[{"group": "507f1f77bcf86cd799439011", "role": "editor"}]'
 *     responses:
 *       201:
 *         description: Video uploaded successfully
 *       400:
 *         description: Invalid file or validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/upload', upload.single('video'), validate(uploadVideoValidation), uploadVideo);

/**
 * @swagger
 * /api/videos/library:
 *   get:
 *     summary: Get video library with filtering
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [all, mine, shared]
 *           default: all
 *         description: Filter videos by ownership
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *     responses:
 *       200:
 *         description: List of videos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 videos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Video'
 *                 pagination:
 *                   type: object
 */
router.get('/library', getLibraryVideos);

/**
 * @swagger
 * /api/videos/{id}:
 *   get:
 *     summary: Get video by ID
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 video:
 *                   $ref: '#/components/schemas/Video'
 *                 userRole:
 *                   type: string
 *       403:
 *         description: Access denied
 *       404:
 *         description: Video not found
 */
router.get('/:id', getVideoById);

/**
 * @swagger
 * /api/videos/{id}:
 *   put:
 *     summary: Update video metadata
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoName:
 *                 type: string
 *               videoDescription:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Video updated successfully
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:id', updateVideo);

/**
 * @swagger
 * /api/videos/{id}:
 *   delete:
 *     summary: Delete a video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *       403:
 *         description: Only owner can delete
 */
router.delete('/:id', deleteVideo);

/**
 * @swagger
 * /api/videos/{id}/stream:
 *   get:
 *     summary: Stream video content
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       206:
 *         description: Video stream (partial content)
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/stream', streamVideo);

export default router;
