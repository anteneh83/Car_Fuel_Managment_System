import { Response, NextFunction } from 'express';
import { DriverService } from '../services/driver.service';
import { AuditLogService } from '../services/auditLog.service';
import { AuthRequest, AuditAction } from '../types';

export class DriverController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await DriverService.getAll(req.query as any);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const driver = await DriverService.getById(req.params.id as string);
      res.json({ success: true, data: driver });
    } catch (error) { next(error); }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await DriverService.create(req.body);
      await AuditLogService.log({
        userId: req.user!.userId, userRole: req.user!.role,
        action: AuditAction.DRIVER_CREATED, entityType: 'Driver',
        entityId: result.driver._id as any,
        newValue: { fullName: req.body.fullName, licenseNumber: req.body.licenseNumber },
        ipAddress: req.ip, userAgent: req.get('User-Agent'),
      });
      res.status(201).json({
        success: true,
        data: { driver: result.driver, credentials: result.credentials },
        message: 'Driver created successfully',
      });
    } catch (error) { next(error); }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const driver = await DriverService.update(req.params.id as string, req.body);
      await AuditLogService.log({
        userId: req.user!.userId, userRole: req.user!.role,
        action: AuditAction.DRIVER_UPDATED, entityType: 'Driver',
        entityId: driver._id as any, newValue: req.body,
        ipAddress: req.ip, userAgent: req.get('User-Agent'),
      });
      res.json({ success: true, data: driver, message: 'Driver updated successfully' });
    } catch (error) { next(error); }
  }

  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const driver = await DriverService.updateStatus(req.params.id as string, req.body.status);
      const action = req.body.status === 'INACTIVE' || req.body.status === 'SUSPENDED' ? AuditAction.DRIVER_DEACTIVATED : AuditAction.DRIVER_UPDATED;
      await AuditLogService.log({
        userId: req.user!.userId, userRole: req.user!.role,
        action, entityType: 'Driver', entityId: driver._id as any,
        newValue: { status: req.body.status }, ipAddress: req.ip, userAgent: req.get('User-Agent'),
      });
      res.json({ success: true, data: driver, message: 'Driver status updated' });
    } catch (error) { next(error); }
  }

  static async getTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await DriverService.getTransactions(req.params.id as string, req.query as any);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }
}
