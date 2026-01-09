import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api.service';
import type { Organization } from '../types';
import './Auth.css';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerUser, registerOrganization } = useAuth();
  const [userType, setUserType] = useState<'user' | 'organization'>('user');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // User form state
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization: '',
    mobile_number: '',
  });

  // Organization form state
  const [orgForm, setOrgForm] = useState({
    name: '',
    orgId: '',
    description: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    mobile: '',
  });

  React.useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const response = await userAPI.getAllOrganizations();
      setOrganizations(response.data.organizations);
    } catch (err) {
      console.error('Failed to load organizations');
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (userForm.password !== userForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await registerUser(userForm);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (orgForm.password !== orgForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await registerOrganization(orgForm);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Register for VideoConnect+</h1>
        
        <div className="user-type-toggle">
          <button
            className={userType === 'user' ? 'active' : ''}
            onClick={() => setUserType('user')}
          >
            User
          </button>
          <button
            className={userType === 'organization' ? 'active' : ''}
            onClick={() => setUserType('organization')}
          >
            Organization
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {userType === 'user' ? (
          <form onSubmit={handleUserSubmit}>
            <input
              type="text"
              placeholder="Name"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Username"
              value={userForm.username}
              onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Mobile Number (optional)"
              value={userForm.mobile_number}
              onChange={(e) => setUserForm({ ...userForm, mobile_number: e.target.value })}
            />
            <select
              value={userForm.organization}
              onChange={(e) => setUserForm({ ...userForm, organization: e.target.value })}
            >
              <option value="">No Organization</option>
              {organizations.map((org) => (
                <option key={org._id} value={org._id}>
                  {org.name}
                </option>
              ))}
            </select>
            <input
              type="password"
              placeholder="Password"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              required
              minLength={6}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={userForm.confirmPassword}
              onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOrgSubmit}>
            <input
              type="text"
              placeholder="Organization Name"
              value={orgForm.name}
              onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Organization ID"
              value={orgForm.orgId}
              onChange={(e) => setOrgForm({ ...orgForm, orgId: e.target.value })}
              required
            />
            <textarea
              placeholder="Description"
              value={orgForm.description}
              onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={orgForm.email}
              onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Mobile Number"
              value={orgForm.mobile}
              onChange={(e) => setOrgForm({ ...orgForm, mobile: e.target.value })}
              required
            />
            <textarea
              placeholder="Address"
              value={orgForm.address}
              onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              value={orgForm.password}
              onChange={(e) => setOrgForm({ ...orgForm, password: e.target.value })}
              required
              minLength={6}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={orgForm.confirmPassword}
              onChange={(e) => setOrgForm({ ...orgForm, confirmPassword: e.target.value })}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}

        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
