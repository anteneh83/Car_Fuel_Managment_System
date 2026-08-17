import { Router } from 'express';
import { DriverController } from '../controllers/driver.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();
router.use(authenticate);

// Both Owner and Monitor can view active driver list for assigning fuel requests
router.get('/', authorize(UserRole.OWNER, UserRole.MONITOR), DriverController.getAll);
router.get('/:id', authorize(UserRole.OWNER, UserRole.MONITOR), DriverController.getById);

// Admin-only management operations
router.post('/', authorize(UserRole.OWNER), DriverController.create);
router.patch('/:id', authorize(UserRole.OWNER), DriverController.update);
router.patch('/:id/status', authorize(UserRole.OWNER), DriverController.updateStatus);
router.get('/:id/transactions', authorize(UserRole.OWNER), DriverController.getTransactions);

export default router;
