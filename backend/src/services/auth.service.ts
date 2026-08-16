import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Driver } from '../models/Driver';
import { config } from '../config';
import { JWTPayload, UserRole } from '../types';
import { UnauthorizedError, AppError } from '../utils/errors';

export class AuthService {
  static async login(username: string, password: string): Promise<{ token: string; user: any; mustChangePassword: boolean }> {
    const user = await User.findOne({ username: username.toLowerCase() }).select('+passwordHash');

    if (!user) {
      throw new UnauthorizedError('Invalid username or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated. Contact the administrator.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid username or password');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Get driver info if driver role
    let driverId: string | undefined;
    if (user.role === UserRole.DRIVER && user.driverId) {
      driverId = user.driverId.toString();
    }

    const payload: JWTPayload = {
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      driverId,
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any });

    return {
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        driverId: user.driverId,
        mustChangePassword: user.mustChangePassword,
      },
      mustChangePassword: user.mustChangePassword,
    };
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters', 400);
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    await user.save();
  }

  static async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new UnauthorizedError('User not found');

    let driverInfo = null;
    if (user.role === UserRole.DRIVER && user.driverId) {
      driverInfo = await Driver.findById(user.driverId).populate('assignedVehicleId');
    }

    return {
      _id: user._id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      lastLoginAt: user.lastLoginAt,
      driver: driverInfo,
    };
  }
}
