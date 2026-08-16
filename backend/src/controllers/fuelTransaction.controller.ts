import { Response, NextFunction } from 'express';
import { FuelTransactionService } from '../services/fuelTransaction.service';
import { AuditLogService } from '../services/auditLog.service';
import { AuthRequest, AuditAction } from '../types';

export class FuelTransactionController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await FuelTransactionService.getAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tx = await FuelTransactionService.getById(req.params.id as string);
      res.json({ success: true, data: tx });
    } catch (error) { next(error); }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tx = await FuelTransactionService.create({
        driverId: req.user!.driverId!,
        userId: req.user!.userId,
        userRole: req.user!.role,
        ...req.body,
        fuelQuantity: parseFloat(req.body.fuelQuantity),
        pricePerLiter: parseFloat(req.body.pricePerLiter),
        odometerReading: parseFloat(req.body.odometerReading),
        receiptFile: req.file,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
      res.status(201).json({ success: true, data: tx, message: 'Fuel transaction submitted successfully' });
    } catch (error) { next(error); }
  }

  static async getMyTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await FuelTransactionService.getMyTransactions(req.user!.driverId!, req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  static async review(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tx = await FuelTransactionService.review(req.params.id as string, req.user!.userId, req.body.notes);
      await AuditLogService.log({
        userId: req.user!.userId, userRole: req.user!.role,
        action: AuditAction.FUEL_TRANSACTION_REVIEWED, entityType: 'FuelTransaction',
        entityId: tx._id as any, newValue: { reviewStatus: 'REVIEWED', notes: req.body.notes },
        ipAddress: req.ip, userAgent: req.get('User-Agent'),
      });
      res.json({ success: true, data: tx, message: 'Transaction reviewed' });
    } catch (error) { next(error); }
  }

  static async investigate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tx = await FuelTransactionService.investigate(req.params.id as string, req.user!.userId, req.body.notes);
      await AuditLogService.log({
        userId: req.user!.userId, userRole: req.user!.role,
        action: AuditAction.FUEL_TRANSACTION_INVESTIGATED, entityType: 'FuelTransaction',
        entityId: tx._id as any, newValue: { reviewStatus: 'INVESTIGATED', notes: req.body.notes },
        ipAddress: req.ip, userAgent: req.get('User-Agent'),
      });
      res.json({ success: true, data: tx, message: 'Transaction under investigation' });
    } catch (error) { next(error); }
  }

  static async resolve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tx = await FuelTransactionService.resolve(req.params.id as string, req.user!.userId, req.body.notes);
      await AuditLogService.log({
        userId: req.user!.userId, userRole: req.user!.role,
        action: AuditAction.FUEL_TRANSACTION_RESOLVED, entityType: 'FuelTransaction',
        entityId: tx._id as any, newValue: { reviewStatus: 'RESOLVED', notes: req.body.notes },
        ipAddress: req.ip, userAgent: req.get('User-Agent'),
      });
      res.json({ success: true, data: tx, message: 'Transaction resolved' });
    } catch (error) { next(error); }
  }

  static async getFraudAlerts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await FuelTransactionService.getFraudAlerts(req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }
}
