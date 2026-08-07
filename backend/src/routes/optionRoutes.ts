import { Router } from 'express';
import {
  getShippingOptions,
  createShippingOption,
  updateShippingOption,
  deleteShippingOption,
  getPaymentOptions,
  createPaymentOption,
  updatePaymentOption,
  togglePaymentOption,
  deletePaymentOption,
} from '../controllers/optionController';

const router = Router();

// Shipping Routes
router.get('/shipping', getShippingOptions);
router.post('/shipping', createShippingOption);
router.put('/shipping/:id', updateShippingOption);
router.delete('/shipping/:id', deleteShippingOption);

// Payment Routes
router.get('/payment', getPaymentOptions);
router.post('/payment', createPaymentOption);
router.put('/payment/:id', updatePaymentOption);
router.patch('/payment/:id/toggle', togglePaymentOption);
router.delete('/payment/:id', deletePaymentOption);

export default router;
