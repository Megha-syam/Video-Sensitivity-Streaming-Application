import React, { useState, useEffect } from 'react';
import { groupAPI, userAPI } from '../services/api.service';
import type { Group, User } from '../types';
import './Groups.css';

const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroups();
    loadUsers();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await groupAPI.getGroups();
      setGroups(response.data.groups);
    } catch (err) {
      console.error('Failed to load groups');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      setUsers(response.data.users);
    } catch (err) {
      console.error('Failed to load users');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await groupAPI.createGroup({
        group_name: groupName,
        description,
        users: selectedUsers,
      });
      setShowModal(false);
      setGroupName('');
      setDescription('');
      setSelectedUsers([]);
      loadGroups();
    } catch (err) {
      console.error('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setGroupName(group.group_name);
    setDescription(group.description || '');
    // Extract user IDs from populated or string users
    const userIds = group.users.map(u => typeof u === 'object' ? u._id : u);
    setSelectedUsers(userIds);
    setShowEditModal(true);
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    
    setLoading(true);
    try {
      await groupAPI.updateGroup(editingGroup._id, {
        group_name: groupName,
        description,
        users: selectedUsers as any, // User IDs as strings
      });
      setShowEditModal(false);
      setEditingGroup(null);
      setGroupName('');
      setDescription('');
      setSelectedUsers([]);
      loadGroups();
    } catch (err) {
      console.error('Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowEditModal(false);
    setEditingGroup(null);
    setGroupName('');
    setDescription('');
    setSelectedUsers([]);
  };

  return (
    <div className="groups-page">
      <div className="page-header">
        <h1>Groups</h1>
        <button className="create-btn" onClick={() => setShowModal(true)}>
          ➕ Create Group
        </button>
      </div>

      <div className="groups-list">
        {groups.length === 0 ? (
          <div className="empty-state">No groups found. Create one to get started!</div>
        ) : (
          groups.map((group) => (
            <div key={group._id} className="group-card">
              <div className="group-card-header">
                <h3>{group.group_name}</h3>
                <button 
                  className="edit-group-btn" 
                  onClick={() => handleEditGroup(group)}
                  title="Edit group"
                >
                  ✏️
                </button>
              </div>
              <p>{group.description || 'No description'}</p>
              <div className="group-members">
                👥 {group.users.length} member{group.users.length !== 1 ? 's' : ''}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Group</h2>
            <form onSubmit={handleCreateGroup}>
              <input
                type="text"
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="user-select">
                <h3>Select Members</h3>
                {users.map((user) => (
                  <label key={user._id} className="user-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user._id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                        }
                      }}
                    />
                    {user.name} (@{user.username})
                  </label>
                ))}
              </div>
              <div className="modal-buttons">
                <button type="button" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingGroup && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Group</h2>
            <form onSubmit={handleUpdateGroup}>
              <input
                type="text"
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="user-select">
                <h3>Group Members</h3>
                <p className="helper-text">Add or remove members from this group</p>
                {users.map((user) => (
                  <label key={user._id} className="user-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user._id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                        }
                      }}
                    />
                    {user.name} (@{user.username})
                  </label>
                ))}
              </div>
              <div className="modal-buttons">
                <button type="button" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsPage;
