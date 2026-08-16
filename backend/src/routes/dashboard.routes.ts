import { Router } from 'express';
import { DashboardController, NotificationController, AuditLogController, FraudRuleController } from '../controllers/dashboard.controller';
import { FuelTransactionController } from '../controllers/fuelTransaction.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

// Dashboard routes
export const dashboardRoutes = Router();
dashboardRoutes.use(authenticate);
dashboardRoutes.get('/summary', authorize(UserRole.OWNER), DashboardController.getSummary);
dashboardRoutes.get('/fuel-cost', authorize(UserRole.OWNER), DashboardController.getFuelCost);
dashboardRoutes.get('/vehicle-usage', authorize(UserRole.OWNER), DashboardController.getVehicleUsage);
dashboardRoutes.get('/driver-usage', authorize(UserRole.OWNER), DashboardController.getDriverUsage);
dashboardRoutes.get('/station-usage', authorize(UserRole.OWNER), DashboardController.getStationUsage);
dashboardRoutes.get('/risk-distribution', authorize(UserRole.OWNER), DashboardController.getRiskDistribution);
dashboardRoutes.get('/consumption-trend', authorize(UserRole.OWNER), DashboardController.getConsumptionTrend);
dashboardRoutes.get('/driver-summary', authorize(UserRole.DRIVER), DashboardController.getDriverDashboard);

// Fraud routes
export const fraudRoutes = Router();
fraudRoutes.use(authenticate, authorize(UserRole.OWNER));
fraudRoutes.get('/', FuelTransactionController.getFraudAlerts);
fraudRoutes.get('/rules', FraudRuleController.getAll);
fraudRoutes.patch('/rules/:id', FraudRuleController.update);

// Notification routes
export const notificationRoutes = Router();
notificationRoutes.use(authenticate);
notificationRoutes.get('/', NotificationController.getAll);
notificationRoutes.patch('/:id/read', NotificationController.markRead);
notificationRoutes.patch('/read-all', NotificationController.markAllRead);

// Audit routes
export const auditRoutes = Router();
auditRoutes.use(authenticate, authorize(UserRole.OWNER));
auditRoutes.get('/', AuditLogController.getAll);
auditRoutes.get('/:id', AuditLogController.getById);
