import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { videoAPI } from '../services/api.service';
import type { Video } from '../types';
import ConfirmModal from '../components/ConfirmModal';
import './VideoPlayer.css';

const VideoPlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [userRole, setUserRole] = useState('viewer');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedVideo, setEditedVideo] = useState({
    videoName: '',
    videoDescription: '',
    tags: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      loadVideo();
    }
  }, [id]);

  const loadVideo = async () => {
    try {
      const response = await videoAPI.getVideoById(id!);
      setVideo(response.data.video);
      setUserRole(response.data.userRole);
      setEditedVideo({
        videoName: response.data.video.videoName,
        videoDescription: response.data.video.videoDescription,
        tags: response.data.video.tags,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
    setMessage('');
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    if (video) {
      setEditedVideo({
        videoName: video.videoName,
        videoDescription: video.videoDescription,
        tags: video.tags,
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!video) return;
    setSaving(true);
    setMessage('');
    
    try {
      await videoAPI.updateVideo(video._id, editedVideo);
      setMessage('✅ Video updated successfully!');
      setEditMode(false);
      await loadVideo(); // Reload to get updated data
    } catch (err: any) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed to update video'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!video) return;
    
    try {
      await videoAPI.deleteVideo(video._id);
      setMessage('✅ Video deleted successfully!');
      setShowDeleteConfirm(false);
      setTimeout(() => navigate('/dashboard/library'), 1500);
    } catch (err: any) {
      setMessage('❌ ' + (err.response?.data?.message || 'Failed to delete video'));
      setShowDeleteConfirm(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    const displays = {
      processing: { emoji: '⏳', text: 'Processing', color: '#ff9800' },
      safe: { emoji: '✅', text: 'Safe', color: '#4caf50' },
      flagged: { emoji: '⚠️', text: 'Flagged', color: '#f44336' },
    };
    return displays[status as keyof typeof displays] || displays.processing;
  };

  const canEdit = userRole === 'editor' || userRole === 'admin';
  const canDelete = userRole === 'admin';


  if (loading) {
    return <div className="loading-state">Loading video...</div>;
  }

  if (error || !video) {
    return (
      <div className="error-state">
        <p>❌ {error || 'Video not found'}</p>
        <button onClick={() => navigate('/dashboard/library')}>Back to Library</button>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(video.status);
  const streamUrl = videoAPI.getStreamUrl(video._id);

  return (
    <div className="video-player-page">
      <div className="header-actions">
        <button className="back-button" onClick={() => navigate('/dashboard/library')}>
          ← Back to Library
        </button>
        
        <div className="action-buttons">
          {canEdit && !editMode && (
            <button className="edit-button" onClick={handleEdit}>
              ✏️ Edit Details
            </button>
          )}
          {canDelete && !editMode && (
            <button className="delete-button" onClick={() => setShowDeleteConfirm(true)}>
              🗑️ Delete Video
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="video-container">
        <video controls className="video-player" key={streamUrl}>
          <source src={streamUrl} type={video.videoType} />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="video-details">
        <div className="video-header">
          <div>
            {editMode ? (
              <input
                type="text"
                className="edit-title"
                value={editedVideo.videoName}
                onChange={(e) => setEditedVideo({ ...editedVideo, videoName: e.target.value })}
                placeholder="Video title"
              />
            ) : (
              <h1>{video.videoName}</h1>
            )}
            <p className="video-meta-info">
              <span className="status" style={{ color: statusDisplay.color }}>
                {statusDisplay.emoji} {statusDisplay.text}
              </span>
              {' • '}
              <span className="role" style={{ 
                color: userRole === 'admin' ? '#f44336' : userRole === 'editor' ? '#ff9800' : '#4caf50' 
              }}>
                {userRole === 'admin' ? '👑 Owner' : userRole === 'editor' ? '✏️ Editor' : '👁️ Viewer'}
              </span>
              {' • '}
              <span className="date">
                {new Date(video.createdAt).toLocaleDateString()}
              </span>
            </p>
          </div>
          {editMode && (
            <div className="edit-actions">
              <button className="save-button" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save'}
              </button>
              <button className="cancel-button" onClick={handleCancelEdit}>
                ❌ Cancel
              </button>
            </div>
          )}
        </div>

        <div className="video-info-card">
          <h3>Description</h3>
          {editMode ? (
            <textarea
              className="edit-description"
              value={editedVideo.videoDescription}
              onChange={(e) => setEditedVideo({ ...editedVideo, videoDescription: e.target.value })}
              placeholder="Video description"
              rows={4}
            />
          ) : (
            <p>{video.videoDescription || 'No description provided'}</p>
          )}
        </div>

        <div className="video-info-card">
          <h3>Tags</h3>
          {editMode ? (
            <input
              type="text"
              className="edit-tags"
              value={editedVideo.tags.join(', ')}
              onChange={(e) => setEditedVideo({ 
                ...editedVideo, 
                tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
              })}
              placeholder="Comma-separated tags"
            />
          ) : video.tags.length > 0 ? (
            <div className="tags-container">
              {video.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p>No tags</p>
          )}
        </div>

        <div className="video-info-card">
          <h3>Uploaded By</h3>
          <p>
            {typeof video.uploadedBy === 'object' 
              ? `${video.uploadedBy.name} (@${video.uploadedBy.username})`
              : 'Unknown'}
          </p>
        </div>

        {video.groupAccess.length > 0 && (
          <div className="video-info-card">
            <h3>Shared with Groups</h3>
            <ul>
              {video.groupAccess.map((ga, index) => (
                <li key={index}>
                  {typeof ga.group === 'object' ? ga.group.group_name : 'Unknown'} - {ga.role}
                </li>
              ))}
            </ul>
          </div>
        )}

        {video.organizationAccess.enabled && (
          <div className="video-info-card">
            <h3>Organization Access</h3>
            <p>Shared with organization members as: {video.organizationAccess.role}</p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Video"
        message={`Are you sure you want to delete "${video.videoName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        danger={true}
      />
    </div>
  );
};

export default VideoPlayerPage;
