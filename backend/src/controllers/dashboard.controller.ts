import { Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { NotificationService } from '../services/notification.service';
import { AuditLogService } from '../services/auditLog.service';
import { FraudRule } from '../models/FraudRule';
import { AuthRequest } from '../types';

export class DashboardController {
  static async getSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await DashboardService.getSummary(req.query as any);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
  static async getFuelCost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await DashboardService.getFuelCost(req.query as any) });
    } catch (e) {
      next(e);
    }
  }
  static async getVehicleUsage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await DashboardService.getVehicleUsage(req.query as any) });
    } catch (e) {
      next(e);
    }
  }
  static async getDriverUsage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await DashboardService.getDriverUsage(req.query as any) });
    } catch (e) {
      next(e);
    }
  }
  static async getStationUsage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await DashboardService.getStationUsage(req.query as any) });
    } catch (e) {
      next(e);
    }
  }
  static async getRiskDistribution(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await DashboardService.getRiskDistribution(req.query as any) });
    } catch (e) {
      next(e);
    }
  }
  static async getConsumptionTrend(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await DashboardService.getConsumptionTrend(req.query as any) });
    } catch (e) {
      next(e);
    }
  }
  static async getMonitorDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await DashboardService.getMonitorSummary(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export class NotificationController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.getForUser(req.user!.userId, req.query as any);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
  static async markRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await NotificationService.markAsRead(req.params.id as string, req.user!.userId);
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  }
  static async markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await NotificationService.markAllAsRead(req.user!.userId);
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }
}

export class AuditLogController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuditLogService.getAll(req.query as any);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const log = await AuditLogService.getById(req.params.id as string);
      res.json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  }
}

export class FraudRuleController {
  static async getAll(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const rules = await FraudRule.find().sort({ code: 1 });
      res.json({ success: true, data: rules });
    } catch (error) {
      next(error);
    }
  }
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const rule = await FraudRule.findByIdAndUpdate(req.params.id as string, req.body, { new: true });
      res.json({ success: true, data: rule, message: 'Fraud rule updated' });
    } catch (error) {
      next(error);
    }
  }
}
