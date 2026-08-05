import { Router } from 'express';
import {
  getShippingRates,
  bookCourier,
  getTracking,
  validatePickup,
  markPickupReady,
  getScheduleSlots,
  sendCodOtp,
  verifyCodOtpEndpoint,
  getCodCashRecords,
  recordCodDeposit,
  getPickupLocations,
  createPickupLocation,
  updatePickupLocation,
  deletePickupLocation,
  createScheduleSlot,
  updateScheduleSlot,
  deleteScheduleSlot,
  getBiteshipCouriers,
  toggleBiteshipCourier,
} from '../controllers/shippingController';

const router = Router();

// Rates & Booking
router.post('/rates', getShippingRates);
router.post('/book', bookCourier);

// Biteship Courier Management
router.get('/biteship/couriers', getBiteshipCouriers);
router.patch('/biteship/couriers/:id/toggle', toggleBiteshipCourier);

// Tracking
router.get('/track/:orderId', getTracking);

// Self-Pickup
router.post('/pickup/validate', validatePickup);
router.put('/pickup/:orderId/ready', markPickupReady);

// Pickup Locations CRUD
router.get('/pickup-locations', getPickupLocations);
router.post('/pickup-locations', createPickupLocation);
router.put('/pickup-locations/:id', updatePickupLocation);
router.delete('/pickup-locations/:id', deletePickupLocation);

// Scheduled Delivery
router.get('/schedule/slots', getScheduleSlots);
router.post('/schedule/slots', createScheduleSlot);
router.put('/schedule/slots/:id', updateScheduleSlot);
router.delete('/schedule/slots/:id', deleteScheduleSlot);

// COD
router.post('/cod/send-otp', sendCodOtp);
router.post('/cod/verify-otp', verifyCodOtpEndpoint);
router.get('/cod/cash-records', getCodCashRecords);
router.post('/cod/deposit', recordCodDeposit);

export default router;

