import User from './user.model.js';
import jwt from 'jsonwebtoken';
import envConfig from '../../config/env.config.js';

const generateToken = (id) => {
  return jwt.sign({ id }, envConfig.jwtSecret, {
    expiresIn: envConfig.jwtExpiresIn,
  });
};

/**
 * Register a new user
 * @param {Object} userData
 * @returns {Object} { user, token }
 */
export const registerUser = async (userData) => {
  const { email } = userData;

  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new Error('User already exists');
  }

  const user = await User.create(userData);

  if (user) {
    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    };
  } else {
    throw new Error('Invalid user data');
  }
};

/**
 * Authenticate user & get token
 * @param {string} email
 * @param {string} password
 * @returns {Object} { user, token }
 */
export const loginUser = async (email, password) => {
  const user = await User.findOne({ email });

  if (user && (await user.comparePassword(password))) {
    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    };
  } else {
    throw new Error('Invalid email or password');
  }
};

/**
 * Get user profile
 * @param {string} id
 * @returns {Object} user
 */
export const getUserProfile = async (id) => {
  const user = await User.findById(id).select('-password');
  if (user) {
    return user;
  } else {
    throw new Error('User not found');
  }
};

/**
 * Update user profile
 * @param {Object} user - The user object from request
 * @param {Object} updates - The updates
 * @returns {Object} updatedUser
 */
export const updateUserProfile = async (user, updates) => {
  user.firstName = updates.firstName || user.firstName;
  user.lastName = updates.lastName || user.lastName;
  user.phone = updates.phone || user.phone;
  user.location = updates.location || user.location;
  user.skills = updates.skills || user.skills;
  user.experience = updates.experience || user.experience;

  if (updates.password) {
    user.password = updates.password;
  }

  if (updates.profileImage) {
    user.profileImage = updates.profileImage;
  }

  if (updates.cv) {
    user.cv = updates.cv;
  }

  const updatedUser = await user.save();

  return {
    _id: updatedUser._id,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    email: updatedUser.email,
    role: updatedUser.role,
    token: generateToken(updatedUser._id),
  };
};

/**
 * Delete user (soft delete)
 * @param {string} id
 * @param {string} password
 */
export const deleteUser = async (id, password) => {
  const user = await User.findById(id);

  if (user) {
    if (await user.comparePassword(password)) {
      user.isActive = false;
      await user.save();
      return { message: 'User removed' };
    } else {
      throw new Error('Invalid password');
    }
  } else {
    throw new Error('User not found');
  }
};

export default {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  deleteUser,
};
