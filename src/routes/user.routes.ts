import { Router } from 'express';
import { userController } from '../controllers/user.controller';

const router = Router();

// API 1 - Create User
router.post('/', userController.createUser);

// API 6 - User Session List (separated into upcoming & completed via aggregation)
router.get('/:id/sessions', userController.getUserSessions);

export default router;
