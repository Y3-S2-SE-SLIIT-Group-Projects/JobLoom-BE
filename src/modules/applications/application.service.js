import Application from './application.model.js';
import Job from '../jobs/job.model.js';
import HttpException from '../../models/http-exception.js';

/**
 * Application Service
 * Business logic for job application operations
 */

/**
 * Valid status transitions map
 * Defines which statuses a given status can transition to
 */
const STATUS_TRANSITIONS = {
  pending: ['reviewed', 'shortlisted', 'accepted', 'rejected'],
  reviewed: ['shortlisted', 'accepted', 'rejected'],
  shortlisted: ['accepted', 'rejected'],
  accepted: [], // final
  rejected: [], // final
  withdrawn: [], // final
};

/**
 * Apply for a job
 * @param {ObjectId} jobSeekerId - ID of the job seeker applying
 * @param {Object} applicationData - Application data (jobId, coverLetter, resumeUrl)
 * @returns {Object} Created application
 */
export const applyForJob = async (jobSeekerId, applicationData) => {
  const { jobId, coverLetter, resumeUrl } = applicationData;

  // Validate: the Job exists
  const job = await Job.findById(jobId);
  if (!job) {
    throw new HttpException(404, 'Job not found');
  }

  // Validate: the Job status is open
  if (job.status !== 'open') {
    throw new HttpException(400, 'This job is no longer accepting applications');
  }

  // Validate: the job seeker is not the employer who posted the job
  if (jobSeekerId.toString() === job.employerId.toString()) {
    throw new HttpException(400, 'You cannot apply to your own job posting');
  }

  // Create the application
  try {
    const application = await Application.create({
      jobId,
      jobSeekerId,
      employerId: job.employerId, // Auto-populate from Job document
      coverLetter,
      resumeUrl,
      status: 'pending',
    });

    // Populate related fields before returning
    await application.populate([
      { path: 'jobId', select: 'title category status' },
      { path: 'jobSeekerId', select: 'firstName lastName email skills' },
      { path: 'employerId', select: 'firstName lastName email' },
    ]);

    return application;
  } catch (error) {
    // Handle duplicate application error (unique index on {jobId, jobSeekerId})
    if (error.code === 11000) {
      throw new HttpException(409, 'You have already applied for this job');
    }
    throw error;
  }
};

/**
 * Get application by ID with authorization
 * @param {ObjectId} applicationId - Application ID
 * @param {ObjectId} requestingUserId - ID of user making the request
 * @param {string} requestingUserRole - Role of user making the request
 * @returns {Object} Application
 */
export const getApplicationById = async (applicationId, requestingUserId, requestingUserRole) => {
  const application = await Application.findById(applicationId)
    .active()
    .populate('jobId', 'title category status')
    .populate('jobSeekerId', 'firstName lastName email skills')
    .populate('employerId', 'firstName lastName email');

  if (!application) {
    throw new HttpException(404, 'Application not found');
  }

  // Authorization: only the job seeker, the employer, or an admin can view
  const isJobSeeker = application.jobSeekerId._id.toString() === requestingUserId.toString();
  const isEmployer = application.employerId._id.toString() === requestingUserId.toString();
  const isAdmin = requestingUserRole === 'admin';

  if (!isJobSeeker && !isEmployer && !isAdmin) {
    throw new HttpException(403, 'You are not authorized to view this application');
  }

  // If the requester is the job seeker, strip employerNotes from the response
  if (isJobSeeker && !isAdmin) {
    const applicationObj = application.toObject();
    delete applicationObj.employerNotes;
    return applicationObj;
  }

  return application;
};

/**
 * Get applications for the authenticated job seeker
 * @param {ObjectId} jobSeekerId - Job seeker's user ID
 * @param {Object} filters - Filter options (status, page, limit, sort)
 * @returns {Object} Applications and pagination metadata
 */
export const getMyApplications = async (jobSeekerId, filters = {}) => {
  const { status, page = 1, limit = 20, sort = '-createdAt' } = filters;

  const query = {
    jobSeekerId,
    isActive: true,
  };

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    Application.find(query)
      .populate('jobId', 'title category status')
      .populate('employerId', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Application.countDocuments(query),
  ]);

  return {
    applications,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get all applications for a specific job (employer view)
 * @param {ObjectId} jobId - Job ID
 * @param {ObjectId} employerId - Employer's user ID (for authorization)
 * @param {Object} filters - Filter options (status, page, limit, sort)
 * @returns {Object} Applications and pagination metadata
 */
export const getJobApplications = async (jobId, employerId, filters = {}) => {
  const { status, page = 1, limit = 20, sort = '-createdAt' } = filters;

  // Verify the job exists and belongs to this employer
  const job = await Job.findById(jobId);
  if (!job) {
    throw new HttpException(404, 'Job not found');
  }

  if (job.employerId.toString() !== employerId.toString()) {
    throw new HttpException(403, 'You are not authorized to view applications for this job');
  }

  const query = {
    jobId,
    isActive: true,
  };

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    Application.find(query)
      .populate('jobSeekerId', 'firstName lastName email skills ratingStats')
      .populate('jobId', 'title category status')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Application.countDocuments(query),
  ]);

  return {
    applications,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Update application status (employer action)
 * @param {ObjectId} applicationId - Application ID
 * @param {ObjectId} employerId - Employer's user ID
 * @param {string} newStatus - New status value
 * @param {string} employerNotes - Optional employer notes
 * @returns {Object} Updated application
 */
export const updateApplicationStatus = async (
  applicationId,
  employerId,
  newStatus,
  employerNotes
) => {
  const application = await Application.findById(applicationId);

  if (!application) {
    throw new HttpException(404, 'Application not found');
  }

  if (!application.isActive) {
    throw new HttpException(404, 'Application not found');
  }

  // Verify the employer making the request owns this application
  if (application.employerId.toString() !== employerId.toString()) {
    throw new HttpException(403, 'You are not authorized to update this application');
  }

  // Validate status transition
  const allowedTransitions = STATUS_TRANSITIONS[application.status] || [];
  if (!allowedTransitions.includes(newStatus)) {
    throw new HttpException(
      400,
      `Cannot transition from '${application.status}' to '${newStatus}'. Allowed transitions: ${allowedTransitions.join(', ') || 'none (final status)'}`
    );
  }

  // Update status and optional employer notes
  application.status = newStatus;
  application._statusChangedBy = employerId; // Used by pre-save hook for statusHistory

  if (employerNotes !== undefined) {
    application.employerNotes = employerNotes;
  }

  // Set reviewedAt timestamp on first review
  if (newStatus === 'reviewed' && !application.reviewedAt) {
    application.reviewedAt = new Date();
  }

  await application.save();

  // TODO: After accepting, check if accepted count equals job.positions
  // and consider updating the job status to 'filled'. This would require
  // coordination with the Job module and could be implemented as an event
  // or a post-save hook in a future enhancement.

  // Populate and return
  await application.populate([
    { path: 'jobId', select: 'title category status' },
    { path: 'jobSeekerId', select: 'firstName lastName email skills' },
    { path: 'employerId', select: 'firstName lastName email' },
  ]);

  return application;
};

/**
 * Withdraw an application (job seeker action)
 * @param {ObjectId} applicationId - Application ID
 * @param {ObjectId} jobSeekerId - Job seeker's user ID
 * @param {string} reason - Optional withdrawal reason
 * @returns {Object} Success message
 */
export const withdrawApplication = async (applicationId, jobSeekerId, reason) => {
  const application = await Application.findById(applicationId);

  if (!application) {
    throw new HttpException(404, 'Application not found');
  }

  if (!application.isActive) {
    throw new HttpException(404, 'Application not found');
  }

  // Verify the job seeker making the request is the one who applied
  if (application.jobSeekerId.toString() !== jobSeekerId.toString()) {
    throw new HttpException(403, 'You are not authorized to withdraw this application');
  }

  // Only allow withdrawal from pending, reviewed, or shortlisted
  const withdrawableStatuses = ['pending', 'reviewed', 'shortlisted'];
  if (!withdrawableStatuses.includes(application.status)) {
    throw new HttpException(
      400,
      `Cannot withdraw an application with status '${application.status}'. Withdrawal is only allowed when status is: ${withdrawableStatuses.join(', ')}`
    );
  }

  // Update status and save reason
  application.status = 'withdrawn';
  application._statusChangedBy = jobSeekerId;

  if (reason) {
    application.withdrawalReason = reason;
  }

  await application.save();

  return { message: 'Application withdrawn successfully' };
};

/**
 * Get aggregate application stats for a job (employer dashboard)
 * @param {ObjectId} jobId - Job ID
 * @param {ObjectId} employerId - Employer's user ID
 * @returns {Object} Status counts
 */
export const getApplicationStats = async (jobId, employerId) => {
  // Verify the job exists and belongs to this employer
  const job = await Job.findById(jobId);
  if (!job) {
    throw new HttpException(404, 'Job not found');
  }

  if (job.employerId.toString() !== employerId.toString()) {
    throw new HttpException(403, 'You are not authorized to view stats for this job');
  }

  const stats = await Application.aggregate([
    { $match: { jobId: job._id, isActive: true } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // Convert to a friendlier object format
  const statusCounts = {
    pending: 0,
    reviewed: 0,
    shortlisted: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
    total: 0,
  };

  for (const stat of stats) {
    statusCounts[stat._id] = stat.count;
    statusCounts.total += stat.count;
  }

  return statusCounts;
};

/**
 * Check application eligibility (used by Review module)
 * @param {ObjectId} jobId - Job ID
 * @param {ObjectId} userId - User ID
 * @returns {Object} Eligibility result
 */
export const checkApplicationEligibility = async (jobId, userId) => {
  const application = await Application.findOne({
    jobId,
    $or: [{ jobSeekerId: userId }, { employerId: userId }],
    status: 'accepted',
  });

  return {
    hasAcceptedApplication: !!application,
    application: application || null,
  };
};

export default {
  applyForJob,
  getApplicationById,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
  getApplicationStats,
  checkApplicationEligibility,
};
