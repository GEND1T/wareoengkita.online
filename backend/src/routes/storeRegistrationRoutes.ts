import { Router } from 'express';
import {
  createApplication,
  getMyApplication,
  getPendingApplications,
  getAllApplications,
  approveApplication,
  rejectApplication,
} from '../controllers/storeRegistrationController';

const router = Router();

// Public / Authenticated User Routes
router.post('/apply', createApplication);
router.get('/my-application', getMyApplication);

// Superadmin Routes
router.get('/pending', getPendingApplications);
router.get('/all', getAllApplications);
router.post('/approve/:id', approveApplication);
router.post('/reject/:id', rejectApplication);

export default router;
