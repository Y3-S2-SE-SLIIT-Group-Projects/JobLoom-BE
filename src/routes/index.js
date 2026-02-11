import { Router } from 'express';
import helloController from './hello/hello.controller.js';

const router = Router();

// Register route modules
router.use('/hello', helloController);

// Export combined router
export default router;
