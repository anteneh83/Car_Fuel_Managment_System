import { Router } from 'express';
import { FuelRequestController } from '../controllers/fuelRequest.controller';
import { authenticate, authorize } from '../middleware/auth';
import { uploadReceipt } from '../middleware/upload';
import { UserRole } from '../types';

const router = Router();
router.use(authenticate);

// List all fuel requests (Owner/Admin)
router.get('/', authorize(UserRole.OWNER), FuelRequestController.getAll);

// List monitor's own fuel requests
router.get('/my', authorize(UserRole.MONITOR), FuelRequestController.getMyRequests);

// Submit new Phase 1 fuel request (Monitor) - odometerImage is mandatory
router.post(
  '/',
  authorize(UserRole.MONITOR),
  uploadReceipt.single('odometerImage'),
  FuelRequestController.create
);

// Get single fuel request detail
router.get('/:id', FuelRequestController.getById);

// Approve fuel request (Owner/Admin)
router.patch('/:id/approve', authorize(UserRole.OWNER), FuelRequestController.approve);

// Reject fuel request (Owner/Admin)
router.patch('/:id/reject', authorize(UserRole.OWNER), FuelRequestController.reject);

export default router;
