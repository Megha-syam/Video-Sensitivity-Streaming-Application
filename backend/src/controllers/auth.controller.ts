import { Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Organization from '../models/Organization';
import { AuthRequest } from '../middleware/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Validation rules
export const registerUserValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
];

export const registerOrganizationValidation = [
  body('name').trim().notEmpty().withMessage('Organization name is required'),
  body('orgId').trim().notEmpty().withMessage('Organization ID is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
];

export const loginUserValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const loginOrganizationValidation = [
  body('orgId').trim().notEmpty().withMessage('Organization ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Register User
export const registerUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, username, email, password, organization, mobile_number } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      res.status(400).json({ message: 'User with this email or username already exists' });
      return;
    }

    // Create new user
    const user = new User({
      name,
      username,
      email,
      password,
      mobile_number,
      organization: organization || null,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, accountType: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict',
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (error: any) {
    console.error('Register user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Register Organization
export const registerOrganization = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, orgId, description, email, password, address, mobile } = req.body;

    // Check if organization already exists
    const existingOrg = await Organization.findOne({ $or: [{ email }, { orgId }] });
    if (existingOrg) {
      res.status(400).json({ message: 'Organization with this email or ID already exists' });
      return;
    }

    // Create new organization
    const organization = new Organization({
      name,
      orgId: orgId.toUpperCase(),
      description,
      email,
      password,
      address,
      mobile,
    });

    await organization.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: organization._id, accountType: 'organization' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    });

    res.status(201).json({
      message: 'Organization registered successfully',
      organization: {
        id: organization._id,
        name: organization.name,
        orgId: organization.orgId,
        email: organization.email,
      },
      token,
    });
  } catch (error: any) {
    console.error('Register organization error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login User
export const loginUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, accountType: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        organization: user.organization,
      },
      token,
    });
  } catch (error: any) {
    console.error('Login user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login Organization
export const loginOrganization = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orgId, password } = req.body;

    // Find organization
    const organization = await Organization.findOne({ orgId: orgId.toUpperCase() });
    if (!organization) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isMatch = await organization.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: organization._id, accountType: 'organization' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    });

    res.json({
      message: 'Login successful',
      organization: {
        id: organization._id,
        name: organization.name,
        orgId: organization.orgId,
        email: organization.email,
      },
      token,
    });
  } catch (error: any) {
    console.error('Login organization error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user/organization
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.accountType === 'user') {
      const user = await User.findById(req.user._id).select('-password').populate('organization');
      res.json({ accountType: 'user', data: user });
    } else {
      const organization = await Organization.findById(req.organization._id).select('-password');
      res.json({ accountType: 'organization', data: organization });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Logout
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};
