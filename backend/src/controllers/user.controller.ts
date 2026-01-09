import { Response } from 'express';
import { body } from 'express-validator';
import User from '../models/User';
import Organization from '../models/Organization';
import { AuthRequest } from '../middleware/auth.middleware';

// Get all users (for group creation)
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('name username email organization');
    res.json({ users });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all organizations (for user registration)
export const getAllOrganizations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const organizations = await Organization.find().select('name orgId description');
    res.json({ organizations });
  } catch (error: any) {
    console.error('Get organizations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user profile
export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;
    const { name, username, email, mobile_number } = req.body;

    // Check if email or username already exists (excluding current user)
    if (email || username) {
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        $or: [
          ...(email ? [{ email }] : []),
          ...(username ? [{ username }] : []),
        ],
      });

      if (existingUser) {
        res.status(400).json({ message: 'Email or username already in use' });
        return;
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...(name && { name }),
        ...(username && { username }),
        ...(email && { email }),
        ...(mobile_number !== undefined && { mobile_number }),
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error: any) {
    console.error('Update user profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update organization profile
export const updateOrganizationProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.organization._id;
    const { name, description, email, address, mobile } = req.body;

    // Check if email already exists (excluding current organization)
    if (email) {
      const existingOrg = await Organization.findOne({
        _id: { $ne: orgId },
        email,
      });

      if (existingOrg) {
        res.status(400).json({ message: 'Email already in use' });
        return;
      }
    }

    const organization = await Organization.findByIdAndUpdate(
      orgId,
      {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(email && { email }),
        ...(address !== undefined && { address }),
        ...(mobile && { mobile }),
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Organization profile updated successfully', organization });
  } catch (error: any) {
    console.error('Update organization profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
