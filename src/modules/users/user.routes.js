import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  getMyProfile,
  updateUserProfile,
  deleteUser,
  verifyOTP,
  forgotPassword,
  resetPassword,
} from './user.controller.js';
import { protect } from '../../middleware/auth/authMiddleware.js';
import {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  verifyOTPValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from './user.validation.js';
import upload from '../../middleware/uploads/fileUpload.js';

const router = express.Router();

router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);
router.post('/verify-otp', verifyOTPValidation, verifyOTP);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);

// Protected routes
// Note: protect middleware attaches user to req.user

router.get('/me', protect, getMyProfile);
router.get('/profile/:id', protect, getUserProfile);
router.put(
  '/profile',
  protect,
  upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 },
  ]),
  updateProfileValidation,
  updateUserProfile
);
router.delete('/account', protect, deleteUser);

export default router;
