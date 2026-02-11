import * as userService from './user.service.js';
import { sendSuccess } from '../../utils/response.utils.js';

/**
 * User Controller
 * HTTP request handlers for user endpoints
 */

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = async (req, res) => {
  const result = await userService.registerUser(req.body);

  sendSuccess(res, 'User registered successfully', result, 201);
};

/**
 * @route   POST /api/users/login
 * @desc    Login user
 * @access  Public
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  const result = await userService.loginUser(email, password);

  sendSuccess(res, 'Login successful', result);
};

/**
 * @route   GET /api/users/me
 * @desc    Get current authenticated user
 * @access  Private
 */
export const getMe = async (req, res) => {
  const user = await userService.getCurrentUser(req.user.userId);

  sendSuccess(res, 'User retrieved successfully', { user });
};

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Public
 */
export const getUserById = async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  sendSuccess(res, 'User retrieved successfully', { user });
};

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  const user = await userService.updateUserProfile(req.user.userId, req.body);

  sendSuccess(res, 'Profile updated successfully', { user });
};

export default {
  register,
  login,
  getMe,
  getUserById,
  updateProfile,
};
