import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Organization from '../models/Organization';

export interface AuthRequest extends Request {
  user?: any;
  organization?: any;
  accountType?: 'user' | 'organization';
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.token;
    
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
    const decoded: any = jwt.verify(token, JWT_SECRET);

    // Check if user or organization
    if (decoded.accountType === 'user') {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        res.status(401).json({ message: 'User not found' });
        return;
      }
      req.user = user;
      req.accountType = 'user';
    } else if (decoded.accountType === 'organization') {
      const organization = await Organization.findById(decoded.id).select('-password');
      if (!organization) {
        res.status(401).json({ message: 'Organization not found' });
        return;
      }
      req.organization = organization;
      req.accountType = 'organization';
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
