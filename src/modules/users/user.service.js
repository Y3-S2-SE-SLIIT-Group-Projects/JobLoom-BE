import User from './user.model.js';
import jwt from 'jsonwebtoken';
import envConfig from '../../config/env.config.js';
import smsService from '../../utils/sms.service.js';

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

  const userExists = await User.findOne({
    $or: [{ email }, { phone: userData.phone }],
  });

  if (userExists) {
    throw new Error('User with this email or phone already exists');
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const user = await User.create({
    ...userData,
    otp,
    otpExpiry,
    isVerified: false,
  });

  if (user) {
    // Send OTP via SMS
    try {
      await smsService.sendOTP(user.phone, otp);
    } catch (error) {
      console.error('Failed to send OTP SMS during registration:', error);
      // We still return success for user creation, they can resend OTP
    }

    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      // We don't return token yet as user is not verified
    };
  } else {
    throw new Error('Invalid user data');
  }
};

/**
 * Verify OTP
 * @param {string} phone
 * @param {string} otp
 * @returns {Object} { user, token }
 */
export const verifyOTP = async (phone, otp) => {
  const user = await User.findOne({
    phone,
    otp,
    otpExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error('Invalid or expired OTP');
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpiry = null;
  await user.save();

  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  };
};

/**
 * Forgot Password - Send OTP
 * @param {string} phone
 */
export const forgotPassword = async (phone) => {
  const user = await User.findOne({ phone });

  if (!user) {
    throw new Error('No user found with this phone number');
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  user.otp = otp;
  user.otpExpiry = otpExpiry;
  await user.save();

  // Send OTP via SMS
  await smsService.sendPasswordResetOTP(user.phone, otp);

  return { message: 'OTP sent successfully' };
};

/**
 * Reset Password
 * @param {string} phone
 * @param {string} otp
 * @param {string} newPassword
 */
export const resetPassword = async (phone, otp, newPassword) => {
  const user = await User.findOne({
    phone,
    otp,
    otpExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error('Invalid or expired OTP');
  }

  user.password = newPassword;
  user.otp = null;
  user.otpExpiry = null;
  await user.save();

  return { message: 'Password reset successful' };
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
  verifyOTP,
  forgotPassword,
  resetPassword,
};
