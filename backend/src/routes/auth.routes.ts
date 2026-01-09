import { Router } from 'express';
import {
  registerUser,
  registerOrganization,
  loginUser,
  loginOrganization,
  getMe,
  logout,
  registerUserValidation,
  registerOrganizationValidation,
  loginUserValidation,
  loginOrganizationValidation,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// Registration routes
router.post('/register/user', validate(registerUserValidation), registerUser);
router.post('/register/organization', validate(registerOrganizationValidation), registerOrganization);

// Login routes
router.post('/login/user', validate(loginUserValidation), loginUser);
router.post('/login/organization', validate(loginOrganizationValidation), loginOrganization);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;
