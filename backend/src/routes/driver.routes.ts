import { Router } from 'express';
import { DriverController } from '../controllers/driver.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();
router.use(authenticate, authorize(UserRole.OWNER));

router.get('/', DriverController.getAll);
router.post('/', DriverController.create);
router.get('/:id', DriverController.getById);
router.patch('/:id', DriverController.update);
router.patch('/:id/status', DriverController.updateStatus);
router.get('/:id/transactions', DriverController.getTransactions);

export default router;
