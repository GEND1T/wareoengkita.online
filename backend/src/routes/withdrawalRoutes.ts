import { Router } from 'express';
import {
  getStoreWalletInfo,
  updateBankDetails,
  requestWithdrawal,
  getWithdrawalHistory,
  getAllWithdrawals,
} from '../controllers/withdrawalController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/wallet-info', authenticateToken, getStoreWalletInfo);
router.put('/bank-details', authenticateToken, updateBankDetails);
router.post('/request', authenticateToken, requestWithdrawal);
router.get('/history', authenticateToken, getWithdrawalHistory);
router.get('/admin/all', authenticateToken, getAllWithdrawals);

export default router;
