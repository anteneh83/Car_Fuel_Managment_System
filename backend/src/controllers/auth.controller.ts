import { Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuditLogService } from '../services/auditLog.service';
import { AuthRequest, AuditAction } from '../types';
import { config } from '../config';

export class AuthController {
  static async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password required' });

      const result = await AuthService.login(username, password);

      await AuditLogService.log({
        userId: result.user._id, userRole: result.user.role,
        action: AuditAction.LOGIN_SUCCESS, entityType: 'User', entityId: result.user._id,
        ipAddress: req.ip, userAgent: req.get('User-Agent'),
      });

      res.cookie('token', result.token, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ success: true, data: { token: result.token, user: result.user, mustChangePassword: result.mustChangePassword }, message: 'Login successful' });
    } catch (error) { next(error); }
  }

  static async logout(_req: AuthRequest, res: Response) {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
  }

  static async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      await AuthService.changePassword(req.user!.userId, currentPassword, newPassword);
      await AuditLogService.log({
        userId: req.user!.userId, userRole: req.user!.role,
        action: AuditAction.PASSWORD_CHANGED, entityType: 'User', entityId: req.user!.userId,
        ipAddress: req.ip, userAgent: req.get('User-Agent'),
      });
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) { next(error); }
  }

  static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getMe(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (error) { next(error); }
  }
}
