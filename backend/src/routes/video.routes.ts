import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  uploadVideo,
  getLibraryVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  streamVideo,
  uploadVideoValidation,
} from '../controllers/video.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Accept video files only
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
});

// All routes require authentication
router.use(authenticate);

// Video routes
router.post('/upload', upload.single('video'), validate(uploadVideoValidation), uploadVideo);
router.get('/library', getLibraryVideos);
router.get('/:id', getVideoById);
router.put('/:id', updateVideo);
router.delete('/:id', deleteVideo);
router.get('/:id/stream', streamVideo);

export default router;
