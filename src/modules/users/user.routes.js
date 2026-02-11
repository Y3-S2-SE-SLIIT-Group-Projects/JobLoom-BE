import express from 'express';
import * as userController from './user.controller.js';
import * as userValidation from './user.validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';

const router = express.Router();

/**
 * User Routes
 */

// Public routes
router.post('/register', userValidation.registerValidation, validate, userController.register);

router.post('/login', userValidation.loginValidation, validate, userController.login);

router.get('/:id', userValidation.getUserValidation, validate, userController.getUserById);

// Protected routes
router.get('/me', authenticate, userController.getMe);

router.put(
  '/profile',
  authenticate,
  userValidation.updateProfileValidation,
  validate,
  userController.updateProfile
);

export default router;
