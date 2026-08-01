import { Router } from 'express';
import { getAnalyticsDashboard, exportOrdersCsv } from '../controllers/analyticsController';
import { authenticateToken, requireRoles } from '../middlewares/authMiddleware';

const router = Router();

router.get('/dashboard', authenticateToken, requireRoles('admin_store', 'superadmin'), getAnalyticsDashboard);
router.get('/export-csv', authenticateToken, requireRoles('admin_store', 'superadmin'), exportOrdersCsv);

export default router;
