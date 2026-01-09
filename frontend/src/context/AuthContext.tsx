import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api.service';
import socketService from '../services/socket.service';
import type { User, Organization, LoginCredentials, RegisterUserData, RegisterOrganizationData } from '../types';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  accountType: 'user' | 'organization' | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials, type: 'user' | 'organization') => Promise<void>;
  registerUser: (data: RegisterUserData) => Promise<void>;
  registerOrganization: (data: RegisterOrganizationData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [accountType, setAccountType] = useState<'user' | 'organization' | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!(user || organization);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getMe();
      if (response.data.accountType === 'user') {
        const userData = response.data.data as User;
        console.log('User auth data:', userData); // Debug log
        setUser(userData);
        setAccountType('user');
      } else {
        setOrganization(response.data.data as Organization);
        setAccountType('organization');
      }
      
      // Connect socket
      socketService.connect(token);
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials, type: 'user' | 'organization') => {
    const response =
      type === 'user'
        ? await authAPI.loginUser(credentials)
        : await authAPI.loginOrganization(credentials);

    localStorage.setItem('token', response.data.token);

    if (type === 'user' && response.data.user) {
      setUser(response.data.user);
      setAccountType('user');
    } else if (type === 'organization' && response.data.organization) {
      setOrganization(response.data.organization);
      setAccountType('organization');
    }

    socketService.connect(response.data.token);
  };

  const registerUser = async (data: RegisterUserData) => {
    const response = await authAPI.registerUser(data);
    localStorage.setItem('token', response.data.token);
    if (response.data.user) {
      setUser(response.data.user);
      setAccountType('user');
      socketService.connect(response.data.token);
    }
  };

  const registerOrganization = async (data: RegisterOrganizationData) => {
    const response = await authAPI.registerOrganization(data);
    localStorage.setItem('token', response.data.token);
    if (response.data.organization) {
      setOrganization(response.data.organization);
      setAccountType('organization');
      socketService.connect(response.data.token);
    }
  };

  const logout = () => {
    authAPI.logout().catch(console.error);
    localStorage.removeItem('token');
    setUser(null);
    setOrganization(null);
    setAccountType(null);
    socketService.disconnect();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        accountType,
        loading,
        isAuthenticated,
        login,
        registerUser,
        registerOrganization,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
