import axios from 'axios';
import type {
  User,
  Organization,
  Group,
  Video,
  LoginCredentials,
  RegisterUserData,
  RegisterOrganizationData,
  AuthResponse,
  MeResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  registerUser: (data: RegisterUserData) =>
    api.post<AuthResponse>('/auth/register/user', data),
  
  registerOrganization: (data: RegisterOrganizationData) =>
    api.post<AuthResponse>('/auth/register/organization', data),
  
  loginUser: (data: LoginCredentials) =>
    api.post<AuthResponse>('/auth/login/user', data),
  
  loginOrganization: (data: LoginCredentials) =>
    api.post<AuthResponse>('/auth/login/organization', data),
  
  getMe: () => api.get<MeResponse>('/auth/me'),
  
  logout: () => api.post('/auth/logout'),
};

// Video API
export const videoAPI = {
  uploadVideo: (formData: FormData) => {
    return api.post<{ message: string; video: Video }>('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  uploadVideoWithProgress: (formData: FormData, onProgress: (progressEvent: any) => void) => {
    return api.post<{ message: string; video: Video }>('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    });
  },
  getLibraryVideos: (filter: 'all' | 'mine' | 'shared', page = 1, limit = 12) =>
    api.get<{ videos: Video[]; pagination: any }>('/videos/library', {
      params: { filter, page, limit },
    }),
  
  getVideoById: (id: string) =>
    api.get<{ video: Video; userRole: string }>(`/videos/${id}`),
  
  updateVideo: (id: string, data: Partial<Video>) =>
    api.put<{ message: string; video: Video }>(`/videos/${id}`, data),
  
  deleteVideo: (id: string) => api.delete(`/videos/${id}`),
  
  getStreamUrl: (id: string) => `${API_BASE_URL}/videos/${id}/stream`,
};

// Group API
export const groupAPI = {
  getGroups: () => api.get<{ groups: Group[] }>('/groups'),
  
  createGroup: (data: { group_name: string; description: string; users: string[] }) =>
    api.post<{ message: string; group: Group }>('/groups', data),
  
  getGroupById: (id: string) => api.get<{ group: Group }>(`/groups/${id}`),
  
  updateGroup: (id: string, data: Partial<Group>) =>
    api.put<{ message: string; group: Group }>(`/groups/${id}`, data),
  
  deleteGroup: (id: string) => api.delete(`/groups/${id}`),
};

// User API
export const userAPI = {
  getAllUsers: () => api.get<{ users: User[] }>('/users'),
  
  getAllOrganizations: () => api.get<{ organizations: Organization[] }>('/organizations'),
  
  updateUserProfile: (data: Partial<User>) =>
    api.put<{ message: string; user: User }>('/profile', data),
  
  updateOrganizationProfile: (data: Partial<Organization>) =>
    api.put<{ message: string; organization: Organization }>('/organization/profile', data),
};

export default api;
