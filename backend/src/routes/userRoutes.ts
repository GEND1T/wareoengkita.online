import { Router } from 'express';
import { getUsers, createUserByAdmin, updateUserByAdmin, deleteUserByAdmin } from '../controllers/userController';

const router = Router();

router.get('/', getUsers);
router.post('/', createUserByAdmin);
router.put('/:id', updateUserByAdmin);
router.delete('/:id', deleteUserByAdmin);

export default router;
