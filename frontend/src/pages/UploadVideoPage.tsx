import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { videoAPI, groupAPI } from '../services/api.service';
import socketService from '../services/socket.service';
import type { Group, AccessRole } from '../types';
import './Upload.css';

const UploadVideoPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [videoName, setVideoName] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [tags, setTags] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<{ groupId: string; role: AccessRole }[]>([]);
  const [orgAccess, setOrgAccess] = useState({ enabled: false, role: 'viewer' as AccessRole });
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sensitivityStatus, setSensitivityStatus] = useState('');

  useEffect(() => {
    if (!loading) {
      loadGroups();
      setupSocketListeners();
    }
  }, [loading, user]); // Re-run when user data is loaded

  const loadGroups = async () => {
    try {
      const response = await groupAPI.getGroups();
      setGroups(response.data.groups);
    } catch (err) {
      console.error('Failed to load groups');
    }
  };

  const setupSocketListeners = () => {
    socketService.onUploadComplete((data) => {
      setUploadStatus(`Video uploaded! Status: ${data.status}`);
      setSensitivityStatus('🔍 Checking video sensitivity...');
      setUploadProgress(100);
    });

    socketService.onSensitivityResult((data: any) => {
      const statusText = data.status === 'safe' ? '✅ Safe' : '⚠️ Flagged';
      const confidenceText = data.confidence ? ` (${data.confidence}% confidence)` : '';
      setSensitivityStatus(`Video ${statusText}${confidenceText}`);
      setUploading(false);
      setUploadProgress(0);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setVideoName('');
        setVideoDescription('');
        setTags('');
        setVideoFile(null);
        setSelectedGroups([]);
        setOrgAccess({ enabled: false, role: 'viewer' });
        setUploadStatus('');
        setSensitivityStatus('');
        
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }, 2000);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) return;

    setUploading(true);
    setUploadStatus('Preparing upload...');
    setUploadProgress(0);
    setSensitivityStatus('');

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('videoName', videoName);
    formData.append('videoDescription', videoDescription);
    formData.append('tags', tags);
    formData.append('organizationAccess', JSON.stringify(orgAccess));
    formData.append('groupAccess', JSON.stringify(selectedGroups.map(sg => ({ group: sg.groupId, role: sg.role }))));

    try {
      // Track upload progress
      await videoAPI.uploadVideoWithProgress(
        formData,
        (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
          setUploadStatus(`Uploading... ${percentCompleted}%`);
        }
      );
      
      setUploadStatus('✅ Upload complete! Processing...');
    } catch (err: any) {
      setUploadStatus('❌ Upload failed: ' + (err.response?.data?.message || err.message));
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="upload-page">
      <h1>Upload Video</h1>
      <form onSubmit={handleSubmit} className="upload-form">
        <input
          type="text"
          placeholder="Video Title"
          value={videoName}
          onChange={(e) => setVideoName(e.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={videoDescription}
          onChange={(e) => setVideoDescription(e.target.value)}
        />
        <input
          type="text"
          placeholder="Tags (comma-separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <input type="file" accept="video/*" onChange={handleFileChange} required />

        {user?.organization && (
          <div className="access-section">
            <h3>Organization Sharing</h3>
            <label>
              <input
                type="checkbox"
                checked={orgAccess.enabled}
                onChange={(e) => setOrgAccess({ ...orgAccess, enabled: e.target.checked })}
              />
              Share with organization
            </label>
            {orgAccess.enabled && (
              <select value={orgAccess.role} onChange={(e) => setOrgAccess({ ...orgAccess, role: e.target.value as AccessRole })}>
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            )}
          </div>
        )}

        {groups.length > 0 && (
          <div className="access-section">
            <h3>Group Sharing</h3>
            {groups.map(group => (
              <div key={group._id} className="group-item">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedGroups.some(sg => sg.groupId === group._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGroups([...selectedGroups, { groupId: group._id, role: 'viewer' }]);
                      } else {
                        setSelectedGroups(selectedGroups.filter(sg => sg.groupId !== group._id));
                      }
                    }}
                  />
                  {group.group_name}
                </label>
                {selectedGroups.some(sg => sg.groupId === group._id) && (
                  <select
                    value={selectedGroups.find(sg => sg.groupId === group._id)?.role}
                    onChange={(e) => {
                      setSelectedGroups(selectedGroups.map(sg =>
                        sg.groupId === group._id ? { ...sg, role: e.target.value as AccessRole } : sg
                      ));
                    }}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        )}

        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <div className="progress-text">{uploadProgress}%</div>
        </div>
      )}

      {uploadStatus && <div className="status-message">{uploadStatus}</div>}
      {sensitivityStatus && <div className="status-message">{sensitivityStatus}</div>}
    </div>
  );
};

export default UploadVideoPage;
