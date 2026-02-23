import userService from './user.service.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Register a new user
 * @route   POST /api/users/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await userService.registerUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Auth user & get token
 * @route   POST /api/users/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const user = await userService.loginUser(email, password);
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile/:id
 * @access  Private
 */
export const getUserProfile = async (req, res) => {
  try {
    const user = await userService.getUserProfile(req.params.id);
    // Ensure user can only access their own profile unless admin?
    // The requirement says "Get user profile by ID", protected route.
    // Usually /profile or /me returns own profile, but this is /profile/:id.
    // The requirement also says "Role-based data filtering" but detailed requirement for /profile/:id is sketchy.
    // However, there is GET /api/users/me for current authenticated user.
    // I will implement /me separately or alias it.

    res.json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
export const getMyProfile = async (req, res) => {
  try {
    const user = await userService.getUserProfile(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res) => {
  // Handle file uploads if present
  const updates = { ...req.body };
  if (req.files) {
    if (req.files.cv) updates.cv = req.files.cv[0].path;
    if (req.files.profileImage) updates.profileImage = req.files.profileImage[0].path;
  }

  try {
    const updatedUser = await userService.updateUserProfile(req.user, updates);
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/users/account
 * @access  Private
 */
export const deleteUser = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete account' });
    }
    await userService.deleteUser(req.user._id, password);
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Verify OTP
 * @route   POST /api/users/verify-otp
 * @access  Public
 */
export const verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;
  try {
    const data = await userService.verifyOTP(phone, otp);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Forgot Password - Send OTP
 * @route   POST /api/users/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  const { phone } = req.body;
  try {
    const data = await userService.forgotPassword(phone);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Reset Password
 * @route   POST /api/users/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  const { phone, otp, newPassword } = req.body;
  try {
    const data = await userService.resetPassword(phone, otp, newPassword);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export default {
  registerUser,
  loginUser,
  getUserProfile,
  getMyProfile,
  updateUserProfile,
  deleteUser,
  verifyOTP,
  forgotPassword,
  resetPassword,
};
