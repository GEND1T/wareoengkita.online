import { Router } from 'express';
import { getUsers, createUserByAdmin, updateUserByAdmin, deleteUserByAdmin } from '../controllers/userController';
import { authenticateToken, requireRoles } from '../middlewares/authMiddleware';

const router = Router();

// Protect ALL user management routes: ONLY authenticated Superadmin can access
router.use(authenticateToken, requireRoles('superadmin'));

router.get('/', getUsers);
router.post('/', createUserByAdmin);
router.put('/:id', updateUserByAdmin);
router.delete('/:id', deleteUserByAdmin);

export default router;
