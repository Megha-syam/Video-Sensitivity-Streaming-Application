import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, organization, accountType, logout, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user && !organization) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user ? user.name : organization?.name || '';

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>VideoConnect+</h2>
          <div className="user-info">
            <p className="user-name">{displayName}</p>
            <p className="user-type">{accountType === 'user' ? 'User' : 'Organization'}</p>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/dashboard/upload" className="nav-item">
            📤 Upload Video
          </Link>
          <Link to="/dashboard/library" className="nav-item">
            📚 Library
          </Link>
          <Link to="/dashboard/groups" className="nav-item">
            👥 Groups
          </Link>
          <Link to="/dashboard/settings" className="nav-item">
            ⚙️ Settings
          </Link>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
