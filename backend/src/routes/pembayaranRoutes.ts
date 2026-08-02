import { Router } from 'express';
import {
  getPaymentMethodsDuitku,
  createPayment,
  handleCallback,
  checkPaymentStatus,
  getInvoice,
  createPaymentLink,
  getPaymentLink,
} from '../controllers/pembayaranController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Public endpoints
router.get('/methods', getPaymentMethodsDuitku);
router.post('/callback', handleCallback); // Duitku server-to-server callback
router.get('/status/:merchantOrderId', checkPaymentStatus);
router.get('/link/:token', getPaymentLink); // Public payment link

// Authenticated endpoints
router.post('/create', authenticateToken, createPayment);
router.get('/invoice/:id', authenticateToken, getInvoice);
router.post('/create-link', authenticateToken, createPaymentLink);

export default router;
