import { Router } from 'express';
import {
  register,
  login,
  getMe,
  registerWithWA,
  loginWithWA,
  verifyAccessLink,
} from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Standard Email Auth
router.post('/register', register);
router.post('/login', login);

// WhatsApp Auth & Verification Link
router.post('/register-wa', registerWithWA);
router.post('/login-wa', loginWithWA);
router.post('/verify-access', verifyAccessLink);

// Current User Profile
router.get('/me', authenticateToken, getMe);

export default router;
