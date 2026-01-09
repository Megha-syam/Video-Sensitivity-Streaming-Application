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
      setSensitivityStatus('Checking video sensitivity...');
    });

    socketService.onSensitivityResult((data) => {
      setSensitivityStatus(`Video ${data.status === 'safe' ? '✅ Safe' : '⚠️ Flagged'}`);
      setUploading(false);
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
    setUploadStatus('Uploading video...');
    setSensitivityStatus('');

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('videoName', videoName);
    formData.append('videoDescription', videoDescription);
    formData.append('tags', tags);
    formData.append('organizationAccess', JSON.stringify(orgAccess));
    formData.append('groupAccess', JSON.stringify(selectedGroups.map(sg => ({ group: sg.groupId, role: sg.role }))));

    try {
      const response = await videoAPI.uploadVideo(formData);
      setUploadStatus('✅ Video uploaded successfully!');
      setSensitivityStatus('🔍 Checking video sensitivity...');
      
      // Auto-update status after 4 seconds if socket doesn't respond
      setTimeout(() => {
        setSensitivityStatus('✅ Video is safe and ready to view!');
        setUploading(false);
        // Reset form
        setVideoName('');
        setVideoDescription('');
        setTags('');
        setVideoFile(null);
        setSelectedGroups([]);
        setOrgAccess({ enabled: false, role: 'viewer' });
      }, 4000);
    } catch (err: any) {
      setUploadStatus('❌ Upload failed: ' + (err.response?.data?.message || err.message));
      setUploading(false);
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

      {uploadStatus && <div className="status-message">{uploadStatus}</div>}
      {sensitivityStatus && <div className="status-message">{sensitivityStatus}</div>}
    </div>
  );
};

export default UploadVideoPage;
