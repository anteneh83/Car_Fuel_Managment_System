import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

router.post('/login', loginLimiter, AuthController.login);
router.post('/logout', authenticate, AuthController.logout);
router.post('/change-password', authenticate, AuthController.changePassword);
router.get('/me', authenticate, AuthController.getMe);

export default router;
