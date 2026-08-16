import { Router } from 'express';
import { VehicleController } from '../controllers/vehicle.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);
router.get('/active', VehicleController.getActive);
router.get('/', authorize(UserRole.OWNER), VehicleController.getAll);
router.post('/', authorize(UserRole.OWNER), VehicleController.create);
router.get('/:id', authorize(UserRole.OWNER), VehicleController.getById);
router.patch('/:id', authorize(UserRole.OWNER), VehicleController.update);
router.patch('/:id/status', authorize(UserRole.OWNER), VehicleController.updateStatus);
router.get('/:id/history', authorize(UserRole.OWNER), VehicleController.getHistory);

export default router;
