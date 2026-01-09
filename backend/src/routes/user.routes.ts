import { Router } from 'express';
import {
  getAllUsers,
  getAllOrganizations,
  updateUserProfile,
  updateOrganizationProfile,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes (for registration)
router.get('/organizations', getAllOrganizations);

// Protected routes
router.use(authenticate);

router.get('/users', getAllUsers);
router.put('/profile', updateUserProfile);
router.put('/organization/profile', updateOrganizationProfile);

export default router;
