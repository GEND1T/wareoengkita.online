import { Router } from 'express';
import {
  getStores,
  getStoreById,
  createStore,
  updateStore,
} from '../controllers/storeController';
import { authenticateToken, requireRoles } from '../middlewares/authMiddleware';
import { cacheMiddleware, clearCacheByPrefix } from '../middlewares/cacheMiddleware';

const router = Router();

router.get('/', cacheMiddleware(60), getStores);
router.get('/:id', cacheMiddleware(60), getStoreById);

router.post('/', authenticateToken, requireRoles('superadmin'), (req, res, next) => {
  clearCacheByPrefix('/api/stores');
  createStore(req, res);
});

router.put('/:id', authenticateToken, requireRoles('admin_store', 'superadmin'), (req, res, next) => {
  clearCacheByPrefix('/api/stores');
  updateStore(req, res);
});

export default router;
