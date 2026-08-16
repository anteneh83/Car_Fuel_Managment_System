import { Response, NextFunction } from 'express';
import { VehicleService } from '../services/vehicle.service';
import { AuditLogService } from '../services/auditLog.service';
import { AuthRequest, AuditAction } from '../types';

export class VehicleController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await VehicleService.getAll(req.query as any);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vehicle = await VehicleService.getById(req.params.id as string);
      res.json({ success: true, data: vehicle });
    } catch (error) { next(error); }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vehicle = await VehicleService.create(req.body);
      await AuditLogService.log({
        userId: req.user!.userId, userRole: req.user!.role,
        action: AuditAction.VEHICLE_CREATED, entityType: 'Vehicle',
        entityId: vehicle._id as any, newValue: req.body,
        ipAddress: req.ip, userAgent: req.get('User-Agent'),
      });
      res.status(201).json({ success: true, data: vehicle, message: 'Vehicle created successfully' });
    } catch (error) { next(error); }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vehicle = await VehicleService.update(req.params.id as string, req.body);
      await AuditLogService.log({
        userId: req.user!.userId, userRole: req.user!.role,
        action: AuditAction.VEHICLE_UPDATED, entityType: 'Vehicle',
        entityId: vehicle._id as any, newValue: req.body,
        ipAddress: req.ip, userAgent: req.get('User-Agent'),
      });
      res.json({ success: true, data: vehicle, message: 'Vehicle updated successfully' });
    } catch (error) { next(error); }
  }

  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vehicle = await VehicleService.updateStatus(req.params.id as string, req.body.status);
      const action = req.body.status === 'ARCHIVED' ? AuditAction.VEHICLE_ARCHIVED : AuditAction.VEHICLE_UPDATED;
      await AuditLogService.log({
        userId: req.user!.userId, userRole: req.user!.role,
        action, entityType: 'Vehicle', entityId: vehicle._id as any,
        newValue: { status: req.body.status }, ipAddress: req.ip, userAgent: req.get('User-Agent'),
      });
      res.json({ success: true, data: vehicle, message: 'Vehicle status updated' });
    } catch (error) { next(error); }
  }

  static async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await VehicleService.getHistory(req.params.id as string, req.query as any);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  static async getActive(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vehicles = await VehicleService.getActiveVehicles();
      res.json({ success: true, data: vehicles });
    } catch (error) { next(error); }
  }
}
