import { Router } from 'express';
import helloController from './hello/hello.controller.js';
import userRoutes from '../modules/users/user.routes.js';

const router = Router();

// Register route modules
router.use('/hello', helloController);
router.use('/users', userRoutes);

// Export combined router
export default router;
