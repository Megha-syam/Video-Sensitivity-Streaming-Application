import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { videoAPI } from '../services/api.service';
import type { Video } from '../types';
import './Library.css';

const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'mine' | 'shared'>('all');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadVideos();
  }, [filter, page]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const response = await videoAPI.getLibraryVideos(filter, page, 12);
      setVideos(response.data.videos);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      console.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      processing: { emoji: '⏳', text: 'Processing', color: '#ff9800' },
      safe: { emoji: '✅', text: 'Safe', color: '#4caf50' },
      flagged: { emoji: '⚠️', text: 'Flagged', color: '#f44336' },
    };
    return badges[status as keyof typeof badges] || badges.processing;
  };

  const handleVideoClick = (videoId: string) => {
    navigate(`/dashboard/video/${videoId}`);
  };

  return (
    <div className="library-page">
      <h1>Video Library</h1>

      <div className="filter-buttons">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => { setFilter('all'); setPage(1); }}
        >
          All
        </button>
        <button
          className={filter === 'mine' ? 'active' : ''}
          onClick={() => { setFilter('mine'); setPage(1); }}
        >
          Mine
        </button>
        <button
          className={filter === 'shared' ? 'active' : ''}
          onClick={() => { setFilter('shared'); setPage(1); }}
        >
          Shared
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading videos...</div>
      ) : videos.length === 0 ? (
        <div className="empty-state">No videos found</div>
      ) : (
        <>
          <div className="video-grid">
            {videos.map((video) => {
              const statusBadge = getStatusBadge(video.status);
              return (
                <div 
                  key={video._id} 
                  className="video-card" 
                  onClick={() => handleVideoClick(video._id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="video-thumbnail">🎥</div>
                  <div className="video-info">
                    <h3>{video.videoName}</h3>
                    <p>{video.videoDescription || 'No description'}</p>
                    <div className="video-meta">
                      <span className="status-badge" style={{ color: statusBadge.color }}>
                        {statusBadge.emoji} {statusBadge.text}
                      </span>
                      {video.tags.length > 0 && (
                        <span className="tags">🏷️ {video.tags.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                ← Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LibraryPage;
