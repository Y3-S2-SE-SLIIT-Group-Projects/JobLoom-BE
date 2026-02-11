import User from './user.model.js';
import { generateToken } from '../../utils/jwt.utils.js';
import HttpException from '../../models/http-exception.js';

/**
 * User Service
 * Business logic for user operations
 */

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Object} Created user and token
 */
export const registerUser = async (userData) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new HttpException(409, 'User with this email already exists');
  }

  // Create user
  const user = await User.create(userData);

  // Generate token
  const token = generateToken({
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  return {
    user,
    token,
  };
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} User and token
 */
export const loginUser = async (email, password) => {
  // Find user with password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new HttpException(401, 'Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new HttpException(403, 'Your account has been deactivated');
  }

  // Compare password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new HttpException(401, 'Invalid email or password');
  }

  // Generate token
  const token = generateToken({
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  // Remove password from response
  user.password = undefined;

  return {
    user,
    token,
  };
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Object} User
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId).active();

  if (!user) {
    throw new HttpException(404, 'User not found');
  }

  return user;
};

/**
 * Get current authenticated user
 * @param {string} userId - User ID from token
 * @returns {Object} User
 */
export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new HttpException(404, 'User not found');
  }

  if (!user.isActive) {
    throw new HttpException(403, 'Your account has been deactivated');
  }

  return user;
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated user
 */
export const updateUserProfile = async (userId, updateData) => {
  // Don't allow updating sensitive fields
  const allowedUpdates = [
    'firstName',
    'lastName',
    'phone',
    'location',
    'skills',
    'experience',
    'profileImage',
  ];

  const updates = {};
  for (const key of allowedUpdates) {
    if (updateData[key] !== undefined) {
      updates[key] = updateData[key];
    }
  }

  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new HttpException(404, 'User not found');
  }

  return user;
};

export default {
  registerUser,
  loginUser,
  getUserById,
  getCurrentUser,
  updateUserProfile,
};
