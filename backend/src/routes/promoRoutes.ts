import { Router } from 'express';
import { getPromos, createPromo, updatePromo, deletePromo } from '../controllers/promoController';
import { cacheMiddleware, clearCacheByPrefix } from '../middlewares/cacheMiddleware';

const router = Router();

router.get('/', cacheMiddleware(60), getPromos);
router.post('/', (req, res) => {
  clearCacheByPrefix('/api/promos');
  createPromo(req, res);
});
router.put('/:id', (req, res) => {
  clearCacheByPrefix('/api/promos');
  updatePromo(req, res);
});
router.delete('/:id', (req, res) => {
  clearCacheByPrefix('/api/promos');
  deletePromo(req, res);
});

export default router;
