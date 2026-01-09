// User types
export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  mobile_number?: string;
  organization?: string | Organization;
  groups: string[];
  userType: 'user';
}

// Organization types
export interface Organization {
  _id: string;
  name: string;
  description: string;
  orgId: string;
  email: string;
  address: string;
  mobile: string;
}

// Group types
export interface Group {
  _id: string;
  group_name: string;
  description: string;
  users: User[];
  created_by: string | User;
  createdAt: string;
  updatedAt: string;
}

// Video types
export type VideoStatus = 'processing' | 'safe' | 'flagged';
export type AccessRole = 'viewer' | 'editor' | 'admin';

export interface GroupAccess {
  group: string | Group;
  role: AccessRole;
}

export interface OrganizationAccess {
  enabled: boolean;
  role: AccessRole;
}

export interface Video {
  _id: string;
  filename: string;
  filePath: string;
  videoType: string;
  videoName: string;
  videoDescription: string;
  status: VideoStatus;
  uploadedBy: string | User;
  userType: 'user' | 'organization';
  organizationAccess: OrganizationAccess;
  groupAccess: GroupAccess[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface LoginCredentials {
  email?: string;
  orgId?: string;
  password: string;
}

export interface RegisterUserData {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  organization?: string;
  mobile_number?: string;
}

export interface RegisterOrganizationData {
  name: string;
  orgId: string;
  description: string;
  email: string;
  password: string;
  confirmPassword: string;
  address: string;
  mobile: string;
}

export interface AuthResponse {
  message: string;
  user?: User;
  organization?: Organization;
  token: string;
}

export interface MeResponse {
  accountType: 'user' | 'organization';
  data: User | Organization;
}
