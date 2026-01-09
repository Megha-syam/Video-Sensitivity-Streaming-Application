import mongoose, { Document, Schema } from 'mongoose';

export type VideoStatus = 'processing' | 'safe' | 'flagged';
export type UserType = 'user' | 'organization';
export type AccessRole = 'viewer' | 'editor' | 'admin';

export interface IGroupAccess {
  group: mongoose.Types.ObjectId;
  role: AccessRole;
}

export interface IOrganizationAccess {
  enabled: boolean;
  role: AccessRole;
}

export interface IVideoMetaInfo extends Document {
  filename: string;
  filePath: string;
  videoType: string;
  videoName: string;
  videoDescription: string;
  status: VideoStatus;
  uploadedBy: mongoose.Types.ObjectId;
  userType: UserType;
  organizationAccess: IOrganizationAccess;
  groupAccess: IGroupAccess[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const VideoMetaInfoSchema = new Schema<IVideoMetaInfo>(
  {
    filename: {
      type: String,
      required: [true, 'Filename is required'],
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },
    videoType: {
      type: String,
      required: [true, 'Video type is required'],
    },
    videoName: {
      type: String,
      required: [true, 'Video name is required'],
      trim: true,
    },
    videoDescription: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['processing', 'safe', 'flagged'],
      default: 'processing',
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userType: {
      type: String,
      enum: ['user', 'organization'],
      required: true,
    },
    organizationAccess: {
      enabled: {
        type: Boolean,
        default: false,
      },
      role: {
        type: String,
        enum: ['viewer', 'editor', 'admin'],
        default: 'viewer',
      },
    },
    groupAccess: [
      {
        group: {
          type: Schema.Types.ObjectId,
          ref: 'Group',
          required: true,
        },
        role: {
          type: String,
          enum: ['viewer', 'editor', 'admin'],
          default: 'viewer',
        },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IVideoMetaInfo>('VideoMetaInfo', VideoMetaInfoSchema);
