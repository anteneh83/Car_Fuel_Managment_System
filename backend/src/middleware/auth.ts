import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthRequest, JWTPayload, UserRole } from '../types';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { User } from '../models/User';

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
    
    // Verify user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account is deactivated');
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to access this resource'));
    }
    next();
  };
};
