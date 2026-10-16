import express from 'express';
import { requireAuth, requireAdmin } from '../services/authService.mjs';
import * as userController from '../controllers/userController.mjs';

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get('/', userController.listUsers);
router.post('/', userController.createUser);
router.put('/:id/role', userController.updateRole);
router.delete('/:id', userController.deleteUser);

export default router;
