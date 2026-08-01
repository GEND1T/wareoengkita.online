import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import { cacheMiddleware, clearCacheByPrefix } from '../middlewares/cacheMiddleware';

const router = Router();

router.get('/', cacheMiddleware(30), getProducts);
router.get('/:id', cacheMiddleware(30), getProductById);

router.post('/', (req, res) => {
  clearCacheByPrefix('/api/products');
  createProduct(req, res);
});

router.put('/:id', (req, res) => {
  clearCacheByPrefix('/api/products');
  updateProduct(req, res);
});

router.delete('/:id', (req, res) => {
  clearCacheByPrefix('/api/products');
  deleteProduct(req, res);
});

export default router;
