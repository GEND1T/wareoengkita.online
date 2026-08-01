import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  trackOrder,
  getAdminOrders,
  updateOrderStatus,
} from '../controllers/orderController';

const router = Router();

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/track/:orderNo', trackOrder);
router.get('/admin', getAdminOrders);
router.put('/admin/:id/status', updateOrderStatus);

export default router;
