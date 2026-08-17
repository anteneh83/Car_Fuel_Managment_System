import { Response, NextFunction } from 'express';
import { FuelRequestService } from '../services/fuelRequest.service';
import { AuditLogService } from '../services/auditLog.service';
import { AuthRequest, AuditAction } from '../types';

export class FuelRequestController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await FuelRequestService.getAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await FuelRequestService.getById(req.params.id as string);
      res.json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await FuelRequestService.create({
        monitorId: req.user!.userId,
        driverId: req.body.driverId,
        vehicleId: req.body.vehicleId,
        fuelType: req.body.fuelType,
        fuelQuantity: parseFloat(req.body.fuelQuantity),
        pricePerLiter: parseFloat(req.body.pricePerLiter),
        odometerReading: parseFloat(req.body.odometerReading),
        odometerFile: req.file!,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      await AuditLogService.log({
        userId: req.user!.userId,
        userRole: req.user!.role,
        action: AuditAction.FUEL_REQUEST_CREATED,
        entityType: 'FuelRequest',
        entityId: request._id as any,
        newValue: {
          driverId: req.body.driverId,
          vehicleId: req.body.vehicleId,
          fuelQuantity: req.body.fuelQuantity,
          odometerReading: req.body.odometerReading,
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json({
        success: true,
        data: request,
        message: 'Fuel request submitted successfully for Admin review',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await FuelRequestService.getMyRequests(req.user!.userId, req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await FuelRequestService.approve(req.params.id as string, req.user!.userId);

      await AuditLogService.log({
        userId: req.user!.userId,
        userRole: req.user!.role,
        action: AuditAction.FUEL_REQUEST_APPROVED,
        entityType: 'FuelRequest',
        entityId: request._id as any,
        newValue: { status: 'APPROVED' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        data: request,
        message: 'Fuel request approved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async reject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { rejectionReason } = req.body;
      const request = await FuelRequestService.reject(
        req.params.id as string,
        req.user!.userId,
        rejectionReason
      );

      await AuditLogService.log({
        userId: req.user!.userId,
        userRole: req.user!.role,
        action: AuditAction.FUEL_REQUEST_REJECTED,
        entityType: 'FuelRequest',
        entityId: request._id as any,
        newValue: { status: 'REJECTED', rejectionReason },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        data: request,
        message: 'Fuel request rejected',
      });
    } catch (error) {
      next(error);
    }
  }
}
