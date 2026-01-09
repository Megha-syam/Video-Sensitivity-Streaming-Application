import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api.service';
import './Settings.css';

const SettingsPage: React.FC = () => {
  const { user, organization, accountType } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [userProfile, setUserProfile] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    mobile_number: user?.mobile_number || '',
  });

  const [orgProfile, setOrgProfile] = useState({
    name: organization?.name || '',
    description: organization?.description || '',
    email: organization?.email || '',
    address: organization?.address || '',
    mobile: organization?.mobile || '',
  });

  const handleUserUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await userAPI.updateUserProfile(userProfile);
      setMessage('✅ Profile updated successfully!');
    } catch (err: any) {
      setMessage('❌ ' + (err.response?.data?.message || 'Update failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleOrgUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await userAPI.updateOrganizationProfile(orgProfile);
      setMessage('✅ Organization updated successfully!');
    } catch (err: any) {
      setMessage('❌ ' + (err.response?.data?.message || 'Update failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      {message && <div className="message">{message}</div>}

      {accountType === 'user' ? (
        <div className="settings-card">
          <h2>User Profile</h2>
          <form onSubmit={handleUserUpdate}>
            <input
              type="text"
              placeholder="Name"
              value={userProfile.name}
              onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Username"
              value={userProfile.username}
              onChange={(e) => setUserProfile({ ...userProfile, username: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={userProfile.email}
              onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
            />
            <input
              type="text"
              placeholder="Mobile Number"
              value={userProfile.mobile_number}
              onChange={(e) => setUserProfile({ ...userProfile, mobile_number: e.target.value })}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      ) : (
        <div className="settings-card">
          <h2>Organization Profile</h2>
          <form onSubmit={handleOrgUpdate}>
            <input
              type="text"
              placeholder="Organization Name"
              value={orgProfile.name}
              onChange={(e) => setOrgProfile({ ...orgProfile, name: e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={orgProfile.description}
              onChange={(e) => setOrgProfile({ ...orgProfile, description: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={orgProfile.email}
              onChange={(e) => setOrgProfile({ ...orgProfile, email: e.target.value })}
            />
            <input
              type="text"
              placeholder="Mobile Number"
              value={orgProfile.mobile}
              onChange={(e) => setOrgProfile({ ...orgProfile, mobile: e.target.value })}
            />
            <textarea
              placeholder="Address"
              value={orgProfile.address}
              onChange={(e) => setOrgProfile({ ...orgProfile, address: e.target.value })}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Organization'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
