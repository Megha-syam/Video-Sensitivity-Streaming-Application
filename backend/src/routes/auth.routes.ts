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

/**
 * @swagger
 * /api/auth/register/user:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - username
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               mobile_number:
 *                 type: string
 *                 example: "+1234567890"
 *               organization:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register/user', validate(registerUserValidation), registerUser);

/**
 * @swagger
 * /api/auth/register/organization:
 *   post:
 *     summary: Register a new organization
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - orgId
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               name:
 *                 type: string
 *                 example: TechCorp Inc.
 *               orgId:
 *                 type: string
 *                 example: TECHCORP
 *               email:
 *                 type: string
 *                 format: email
 *                 example: contact@techcorp.com
 *               password:
 *                 type: string
 *                 format: password
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               mobile:
 *                 type: string
 *     responses:
 *       201:
 *         description: Organization registered successfully
 *       400:
 *         description: Validation error
 */
router.post('/register/organization', validate(registerOrganizationValidation), registerOrganization);

/**
 * @swagger
 * /api/auth/login/user:
 *   post:
 *     summary: Login as a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login/user', validate(loginUserValidation), loginUser);

/**
 * @swagger
 * /api/auth/login/organization:
 *   post:
 *     summary: Login as an organization
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orgId
 *               - password
 *             properties:
 *               orgId:
 *                 type: string
 *                 example: TECHCORP
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login/organization', validate(loginOrganizationValidation), loginOrganization);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user/organization details
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/User'
 *                     - $ref: '#/components/schemas/Organization'
 *                 userType:
 *                   type: string
 *                   enum: [user, organization]
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/me', authenticate, getMe);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authenticate, logout);

export default router;
