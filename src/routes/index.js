import { Router } from 'express';
import helloController from './hello/hello.controller.js';

// Import module routes
import userRoutes from '../modules/users/user.routes.js';
import jobRoutes from '../modules/jobs/job.controller.js'; // Using controller as router
import applicationRoutes from '../modules/applications/application.routes.js';
import reviewRoutes from '../modules/reviews/review.routes.js';

const router = Router();

// Register route modules
router.use('/hello', helloController);

// Module routes
router.use('/users', userRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/reviews', reviewRoutes);

// Export combined router
export default router;
