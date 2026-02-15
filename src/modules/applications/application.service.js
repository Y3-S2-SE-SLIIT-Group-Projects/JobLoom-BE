import Application from './application.model.js';

/**
 * Application Service (Mock/Minimal Implementation)
 * Basic business logic for application operations
 * TODO: Expand this service when application module is fully developed
 */

/**
 * Check if an accepted application exists between two users for a job
 * Used for review eligibility validation
 * @param {ObjectId} reviewerId - ID of user giving review
 * @param {ObjectId} revieweeId - ID of user being reviewed
 * @param {ObjectId} jobId - Job ID
 * @returns {Promise<boolean>} True if accepted application exists
 */
export const hasAcceptedApplication = async (reviewerId, revieweeId, jobId) => {
  const application = await Application.findOne({
    jobId,
    $or: [
      { jobSeekerId: reviewerId, employerId: revieweeId },
      { jobSeekerId: revieweeId, employerId: reviewerId },
    ],
    status: 'accepted',
  });

  return !!application;
};

/**
 * Get application by ID
 * @param {ObjectId} applicationId - Application ID
 * @returns {Promise<Object|null>} Application or null
 */
export const getApplicationById = async (applicationId) => {
  return await Application.findById(applicationId);
};

/**
 * Find application by criteria
 * @param {Object} criteria - Search criteria
 * @returns {Promise<Object|null>} Application or null
 */
export const findApplication = async (criteria) => {
  return await Application.findOne(criteria);
};

export default {
  hasAcceptedApplication,
  getApplicationById,
  findApplication,
};
