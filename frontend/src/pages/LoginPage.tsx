import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [userType, setUserType] = useState<'user' | 'organization'>('user');
  const [email, setEmail] = useState('');
  const [orgId, setOrgId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const credentials = userType === 'user' ? { email, password } : { orgId, password };
      await login(credentials, userType);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Login to VideoConnect+</h1>
        
        <div className="user-type-toggle">
          <button
            className={userType === 'user' ? 'active' : ''}
            onClick={() => {
              setUserType('user');
              setError('');
            }}
          >
            User
          </button>
          <button
            className={userType === 'organization' ? 'active' : ''}
            onClick={() => {
              setUserType('organization');
              setError('');
            }}
          >
            Organization
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {userType === 'user' ? (
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          ) : (
            <input
              type="text"
              placeholder="Organization ID"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              required
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
