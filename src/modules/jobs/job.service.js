import Job from './job.model.js';
import { BadRequestException, NotFoundException } from '../../models/http-exception.js';
import logger from '../../config/logger.config.js';

/**
 * Job Service
 * Business logic for job management
 */

/**
 * Create a new job posting
 * @param {Object} jobData - Job information
 * @param {String} employerId - ID of the employer creating the job
 * @returns {Promise<Object>} Created job
 */
export const createJob = async (jobData, employerId) => {
  try {
    // Deep clean coordinates - remove if empty or invalid
    if (jobData.location) {
      // Check and clean coordinates
      if (jobData.location.coordinates) {
        const coords = jobData.location.coordinates.coordinates;
        // Remove coordinates if:
        // - coordinates array doesn't exist
        // - coordinates is not an array
        // - coordinates array is empty
        // - coordinates array doesn't have exactly 2 elements
        // - coordinates are not numbers
        // - coordinates are NaN
        // - coordinates are out of valid range
        if (
          !coords ||
          !Array.isArray(coords) ||
          coords.length === 0 ||
          coords.length !== 2 ||
          typeof coords[0] !== 'number' ||
          typeof coords[1] !== 'number' ||
          isNaN(coords[0]) ||
          isNaN(coords[1]) ||
          coords[0] < -180 ||
          coords[0] > 180 ||
          coords[1] < -90 ||
          coords[1] > 90
        ) {
          // Completely remove invalid coordinates
          delete jobData.location.coordinates;
        }
      }

      // Also check if coordinates object exists but is malformed
      if (
        jobData.location.coordinates &&
        (!jobData.location.coordinates.coordinates ||
          !Array.isArray(jobData.location.coordinates.coordinates) ||
          jobData.location.coordinates.coordinates.length === 0)
      ) {
        delete jobData.location.coordinates;
      }

      // Remove empty location fields
      if (
        !jobData.location.village &&
        !jobData.location.district &&
        !jobData.location.province &&
        !jobData.location.fullAddress &&
        !jobData.location.coordinates
      ) {
        delete jobData.location;
      }
    }

    // Final safety check: ensure coordinates are completely removed if invalid
    // This is the LAST line of defense before creating the Mongoose model
    if (jobData.location && jobData.location.coordinates) {
      const finalCoords = jobData.location.coordinates.coordinates;
      // Remove if: missing, not array, empty array, wrong length, or invalid values
      if (
        !finalCoords ||
        !Array.isArray(finalCoords) ||
        finalCoords.length === 0 ||
        finalCoords.length !== 2 ||
        typeof finalCoords[0] !== 'number' ||
        typeof finalCoords[1] !== 'number' ||
        isNaN(finalCoords[0]) ||
        isNaN(finalCoords[1])
      ) {
        // Force remove coordinates completely - use multiple methods
        jobData.location.coordinates = undefined;
        delete jobData.location.coordinates;
        // Also remove from the location object entirely
        if (
          jobData.location.coordinates === undefined ||
          (jobData.location.coordinates &&
            jobData.location.coordinates.coordinates &&
            jobData.location.coordinates.coordinates.length === 0)
        ) {
          delete jobData.location.coordinates;
        }
      }
    }

    // Log before creating model to debug
    if (jobData.location && jobData.location.coordinates) {
      logger.warn('WARNING: Coordinates still present before model creation:', {
        coordinates: jobData.location.coordinates,
      });
    }

    // ULTIMATE FINAL CHECK: Remove coordinates with empty array
    // This is the absolute last check before creating the Mongoose model
    if (jobData.location) {
      if (jobData.location.coordinates) {
        const coordsArray = jobData.location.coordinates.coordinates;
        // If coordinates array is empty, remove the entire coordinates object
        if (Array.isArray(coordsArray) && coordsArray.length === 0) {
          logger.error('CRITICAL: Found empty coordinates array, removing:', {
            coordinates: jobData.location.coordinates,
          });
          delete jobData.location.coordinates;
          jobData.location.coordinates = undefined;
        }
      }
    }

    // Log skills data before creating model
    logger.info('Job data before model creation:', {
      hasSkillsRequired: !!jobData.skillsRequired,
      skillsRequired: jobData.skillsRequired,
      skillsRequiredType: Array.isArray(jobData.skillsRequired)
        ? 'array'
        : typeof jobData.skillsRequired,
      skillsRequiredLength: Array.isArray(jobData.skillsRequired)
        ? jobData.skillsRequired.length
        : 'N/A',
    });

    // Add employer ID to job data
    const job = new Job({
      ...jobData,
      employerId,
    });

    // Save to database
    await job.save();

    // Log after save to verify skills were saved
    logger.info('Job saved with skills:', {
      jobId: job._id,
      skillsRequired: job.skillsRequired,
      skillsRequiredLength: job.skillsRequired?.length || 0,
    });

    logger.info(`Job created successfully: ${job._id}`, {
      jobId: job._id,
      employerId,
      title: job.title,
    });

    return job;
  } catch (error) {
    logger.error('Error creating job:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      jobData: {
        hasLocation: !!jobData.location,
        hasCoordinates: !!(jobData.location && jobData.location.coordinates),
        locationKeys: jobData.location ? Object.keys(jobData.location) : [],
      },
    });
    throw error;
  }
};

/**
 * Get job by ID
 * @param {String} jobId - Job ID
 * @returns {Promise<Object>} Job details
 */
export const getJobById = async (jobId) => {
  try {
    const job = await Job.findById(jobId).where({ isActive: true });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  } catch (error) {
    if (error.name === 'CastError') {
      throw new BadRequestException('Invalid job ID format');
    }
    throw error;
  }
};

/**
 * Get all jobs with filtering, searching, sorting, and pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Jobs list with pagination
 */
export const getAllJobs = async (options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      status,
      search,
      minSalary,
      maxSalary,
      salaryType,
      district,
      province,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // Build query
    const query = { isActive: true };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by district
    if (district) {
      query['location.district'] = new RegExp(district, 'i');
    }

    // Filter by province
    if (province) {
      query['location.province'] = new RegExp(province, 'i');
    }

    // Filter by salary range
    if (minSalary || maxSalary) {
      query.salaryAmount = {};
      if (minSalary) query.salaryAmount.$gte = Number(minSalary);
      if (maxSalary) query.salaryAmount.$lte = Number(maxSalary);
    }

    // Filter by salary type
    if (salaryType) {
      query.salaryType = salaryType;
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [jobs, totalCount] = await Promise.all([
      Job.find(query).sort(sort).skip(skip).limit(Number(limit)),
      Job.countDocuments(query),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      jobs,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalCount,
        limit: Number(limit),
        hasNextPage,
        hasPrevPage,
      },
    };
  } catch (error) {
    logger.error('Error fetching jobs:', error);
    throw error;
  }
};

/**
 * Get jobs by employer ID
 * @param {String} employerId - Employer ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Employer's jobs
 */
export const getJobsByEmployer = async (employerId, options = {}) => {
  try {
    const { includeInactive = false, status } = options;

    const query = { employerId };

    if (!includeInactive) {
      query.isActive = true;
    }

    if (status) {
      query.status = status;
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });

    logger.info(`Retrieved ${jobs.length} jobs for employer: ${employerId}`);

    return jobs;
  } catch (error) {
    logger.error('Error fetching employer jobs:', error);
    throw error;
  }
};

/**
 * Get nearby jobs using geospatial query (Mapbox integration)
 * @param {Number} longitude - User's longitude
 * @param {Number} latitude - User's latitude
 * @param {Number} radiusInKm - Search radius in kilometers (default: 50km)
 * @returns {Promise<Array>} Nearby jobs
 */
export const getNearbyJobs = async (longitude, latitude, radiusInKm = 50) => {
  try {
    // Validate coordinates
    if (!longitude || !latitude) {
      throw new BadRequestException('Longitude and latitude are required');
    }

    if (longitude < -180 || longitude > 180) {
      throw new BadRequestException('Invalid longitude value');
    }

    if (latitude < -90 || latitude > 90) {
      throw new BadRequestException('Invalid latitude value');
    }

    // Convert km to meters
    const radiusInMeters = radiusInKm * 1000;

    const jobs = await Job.findNearby(longitude, latitude, radiusInMeters);

    logger.info(`Found ${jobs.length} jobs within ${radiusInKm}km radius`);

    return jobs;
  } catch (error) {
    logger.error('Error fetching nearby jobs:', error);
    throw error;
  }
};

/**
 * Search jobs by text
 * @param {String} searchText - Search query
 * @returns {Promise<Array>} Matching jobs
 */
export const searchJobs = async (searchText) => {
  try {
    if (!searchText || searchText.trim().length === 0) {
      throw new BadRequestException('Search text is required');
    }

    const jobs = await Job.searchJobs(searchText);

    logger.info(`Search "${searchText}" returned ${jobs.length} results`);

    return jobs;
  } catch (error) {
    logger.error('Error searching jobs:', error);
    throw error;
  }
};

/**
 * Get job statistics for employer dashboard
 * @param {String} employerId - Employer ID
 * @returns {Promise<Object>} Statistics
 */
export const getEmployerStats = async (employerId) => {
  try {
    const [totalJobs, openJobs, closedJobs, filledJobs, totalApplicants] = await Promise.all([
      Job.countDocuments({ employerId, isActive: true }),
      Job.countDocuments({ employerId, status: 'open', isActive: true }),
      Job.countDocuments({ employerId, status: 'closed', isActive: true }),
      Job.countDocuments({ employerId, status: 'filled', isActive: true }),
      Job.aggregate([
        { $match: { employerId: employerId, isActive: true } },
        { $group: { _id: null, total: { $sum: '$applicantsCount' } } },
      ]),
    ]);

    return {
      totalJobs,
      openJobs,
      closedJobs,
      filledJobs,
      totalApplicants: totalApplicants[0]?.total || 0,
    };
  } catch (error) {
    logger.error('Error fetching employer stats:', error);
    throw error;
  }
};

/**
 * Update job details
 * @param {String} jobId - Job ID
 * @param {String} employerId - Employer ID (for authorization)
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated job
 */
export const updateJob = async (jobId, employerId, updateData) => {
  try {
    const job = await Job.findById(jobId);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Authorization check
    if (job.employerId.toString() !== employerId) {
      throw new BadRequestException('You are not authorized to update this job');
    }

    // Business rule: Cannot update if job is not active
    if (!job.isActive) {
      throw new BadRequestException('Cannot update inactive job');
    }

    // Update fields
    Object.assign(job, updateData);

    await job.save();

    logger.info(`Job updated successfully: ${jobId}`, {
      jobId,
      employerId,
    });

    return job;
  } catch (error) {
    logger.error('Error updating job:', error);
    throw error;
  }
};

/**
 * Close a job posting
 * @param {String} jobId - Job ID
 * @param {String} employerId - Employer ID
 * @returns {Promise<Object>} Updated job
 */
export const closeJob = async (jobId, employerId) => {
  try {
    const job = await Job.findById(jobId);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.employerId.toString() !== employerId) {
      throw new BadRequestException('You are not authorized to close this job');
    }

    await job.closeJob();

    logger.info(`Job closed: ${jobId}`);

    return job;
  } catch (error) {
    logger.error('Error closing job:', error);
    throw error;
  }
};

/**
 * Mark job as filled
 * @param {String} jobId - Job ID
 * @param {String} employerId - Employer ID
 * @returns {Promise<Object>} Updated job
 */
export const markJobAsFilled = async (jobId, employerId) => {
  try {
    const job = await Job.findById(jobId);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.employerId.toString() !== employerId) {
      throw new BadRequestException('You are not authorized to update this job');
    }

    await job.markAsFilled();

    logger.info(`Job marked as filled: ${jobId}`);

    return job;
  } catch (error) {
    logger.error('Error marking job as filled:', error);
    throw error;
  }
};

/**
 * Delete a job (soft delete)
 * @param {String} jobId - Job ID
 * @param {String} employerId - Employer ID
 * @returns {Promise<Object>} Deleted job
 */
export const deleteJob = async (jobId, employerId) => {
  try {
    const job = await Job.findById(jobId);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.employerId.toString() !== employerId) {
      throw new BadRequestException('You are not authorized to delete this job');
    }

    // Check if there are applications
    if (job.applicantsCount > 0) {
      throw new BadRequestException(
        'Cannot delete job with existing applications. Please close the job instead.'
      );
    }

    // Soft delete
    job.isActive = false;
    await job.save();

    logger.info(`Job deleted (soft): ${jobId}`);

    return job;
  } catch (error) {
    logger.error('Error deleting job:', error);
    throw error;
  }
};

/**
 * Hard delete a job (admin only - for future implementation)
 * @param {String} jobId - Job ID
 * @returns {Promise<void>}
 */
export const hardDeleteJob = async (jobId) => {
  try {
    const job = await Job.findByIdAndDelete(jobId);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    logger.warn(`Job permanently deleted: ${jobId}`);

    return job;
  } catch (error) {
    logger.error('Error permanently deleting job:', error);
    throw error;
  }
};

export default {
  createJob,
  getJobById,
  getAllJobs,
  getJobsByEmployer,
  getNearbyJobs,
  searchJobs,
  getEmployerStats,
  updateJob,
  closeJob,
  markJobAsFilled,
  deleteJob,
  hardDeleteJob,
};
