import { Router } from 'express';
import { getCategories, createCategory } from '../controllers/categoryController';
import { authenticateToken, requireRoles } from '../middlewares/authMiddleware';
import { cacheMiddleware, clearCacheByPrefix } from '../middlewares/cacheMiddleware';

const router = Router();

router.get('/', cacheMiddleware(60), getCategories);
router.post('/', authenticateToken, requireRoles('admin_store', 'superadmin'), (req, res) => {
  clearCacheByPrefix('/api/categories');
  createCategory(req, res);
});

export default router;
