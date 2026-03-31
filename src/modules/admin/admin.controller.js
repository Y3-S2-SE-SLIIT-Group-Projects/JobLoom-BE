import {
  getDashboardStats,
  getAllUsers,
  updateUserByAdmin,
  getAllJobs,
  updateJobByAdmin,
} from './admin.service.js';
import { HTTP_STATUS } from '../../config/server.config.js';
import HttpException from '../../models/http-exception.js';

/**
 * Handle dashboard stats request
 */
export const getStats = async (req, res, next) => {
  try {
    const stats = await getDashboardStats();
    res.status(HTTP_STATUS.OK).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle request for all users
 */
export const getUsers = async (req, res, next) => {
  try {
    const usersData = await getAllUsers(req.query);
    res.status(HTTP_STATUS.OK).json({ success: true, data: usersData });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle admin update user request
 */
export const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Check if user exists
    const user = await updateUserByAdmin(userId, updateData);
    if (!user) {
      throw new HttpException(HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    res.status(HTTP_STATUS.OK).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle request for all jobs
 */
export const getJobs = async (req, res, next) => {
  try {
    const jobsData = await getAllJobs(req.query);
    res.status(HTTP_STATUS.OK).json({ success: true, data: jobsData });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle admin update job request
 */
export const updateJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const updateData = req.body;

    const job = await updateJobByAdmin(jobId, updateData);
    if (!job) {
      throw new HttpException(HTTP_STATUS.NOT_FOUND, 'Job not found');
    }

    res.status(HTTP_STATUS.OK).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
};

export default {
  getStats,
  getUsers,
  updateUser,
  getJobs,
  updateJob,
};
