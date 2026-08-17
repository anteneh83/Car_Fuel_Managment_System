import { Router } from 'express';
import { FuelTransactionController } from '../controllers/fuelTransaction.controller';
import { authenticate, authorize } from '../middleware/auth';
import { uploadReceipt } from '../middleware/upload';
import { UserRole } from '../types';

const router = Router();
router.use(authenticate);

router.get('/', authorize(UserRole.OWNER), FuelTransactionController.getAll);
router.get('/my', authorize(UserRole.MONITOR), FuelTransactionController.getMyTransactions);
router.post(
  '/',
  authorize(UserRole.MONITOR),
  uploadReceipt.single('receiptImage'),
  FuelTransactionController.create
);
router.get('/:id', FuelTransactionController.getById);
router.patch('/:id/review', authorize(UserRole.OWNER), FuelTransactionController.review);
router.patch('/:id/investigate', authorize(UserRole.OWNER), FuelTransactionController.investigate);
router.patch('/:id/resolve', authorize(UserRole.OWNER), FuelTransactionController.resolve);

export default router;
