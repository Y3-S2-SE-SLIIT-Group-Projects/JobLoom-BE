/**
 * Job Validation Schemas
 * Input validation rules for job-related operations
 */

// Category enum (Expanded)
export const JOB_CATEGORIES = [
  'agriculture',
  'farming',
  'livestock',
  'fishing',
  'construction',
  'carpentry',
  'masonry',
  'plumbing',
  'electrical',
  'welding',
  'manufacturing',
  'factory_work',
  'assembly',
  'food_service',
  'cooking',
  'catering',
  'hospitality',
  'retail',
  'sales',
  'customer_service',
  'transportation',
  'driving',
  'delivery',
  'logistics',
  'cleaning',
  'maintenance',
  'janitorial',
  'security',
  'guard_services',
  'tailoring',
  'textiles',
  'garment_making',
  'beauty_services',
  'salon',
  'spa',
  'education',
  'teaching',
  'tutoring',
  'healthcare',
  'nursing',
  'caregiving',
  'IT',
  'technology',
  'software',
  'general_labor',
  'manual_labor',
  'other',
];

// Employment types
export const EMPLOYMENT_TYPES = [
  'full-time',
  'part-time',
  'contract',
  'temporary',
  'internship',
  'seasonal',
  'freelance',
];

// Salary type enum
export const SALARY_TYPES = ['daily', 'weekly', 'monthly', 'contract'];

// Experience levels
export const EXPERIENCE_LEVELS = ['none', 'beginner', 'intermediate', 'advanced', 'expert'];

// Job status enum
export const JOB_STATUS = ['open', 'closed', 'filled'];

/**
 * Validate create job request
 * All fields are now optional - only validate format if provided
 */
export const validateCreateJob = (data) => {
  const errors = [];

  // Title validation (optional)
  if (data.title !== undefined && data.title !== null && data.title !== '') {
    if (typeof data.title !== 'string') {
      errors.push('Title must be a string');
    } else if (data.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long if provided');
    } else if (data.title.length > 100) {
      errors.push('Title cannot exceed 100 characters');
    }
  }

  // Description validation (optional)
  if (data.description !== undefined && data.description !== null && data.description !== '') {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else {
      const textDescription = data.description.replace(/<[^>]*>/g, '').trim();
      if (textDescription.length > 0 && textDescription.length < 20) {
        errors.push('Description must be at least 20 characters long if provided');
      } else if (data.description.length > 2000) {
        errors.push('Description cannot exceed 2000 characters');
      }
    }
  }

  // Category validation (optional)
  if (data.category !== undefined && data.category !== null && data.category !== '') {
    if (!JOB_CATEGORIES.includes(data.category)) {
      errors.push(`Category must be one of: ${JOB_CATEGORIES.join(', ')}`);
    }
  }

  // Job Role validation (optional)
  if (data.jobRole !== undefined && data.jobRole !== null && data.jobRole !== '') {
    if (typeof data.jobRole !== 'string') {
      errors.push('Job role must be a string');
    } else if (data.jobRole.trim().length < 2) {
      errors.push('Job role must be at least 2 characters long if provided');
    } else if (data.jobRole.length > 100) {
      errors.push('Job role cannot exceed 100 characters');
    }
  }

  // Employment Type validation (optional)
  if (
    data.employmentType !== undefined &&
    data.employmentType !== null &&
    data.employmentType !== ''
  ) {
    if (!EMPLOYMENT_TYPES.includes(data.employmentType)) {
      errors.push(`Employment type must be one of: ${EMPLOYMENT_TYPES.join(', ')}`);
    }
  }

  // Location validation (optional)
  if (data.location !== undefined && data.location !== null) {
    if (typeof data.location !== 'object') {
      errors.push('Location must be an object');
    } else {
      // Village, district, province are all optional
      if (data.location.village !== undefined && typeof data.location.village !== 'string') {
        errors.push('Location village must be a string');
      }
      if (data.location.district !== undefined && typeof data.location.district !== 'string') {
        errors.push('Location district must be a string');
      }
      if (data.location.province !== undefined && typeof data.location.province !== 'string') {
        errors.push('Location province must be a string');
      }

      // Coordinates validation - only validate if provided and not empty
      if (data.location.coordinates !== undefined && data.location.coordinates !== null) {
        // If coordinates is an empty object or has empty array, remove it
        if (
          !data.location.coordinates.coordinates ||
          !Array.isArray(data.location.coordinates.coordinates) ||
          data.location.coordinates.coordinates.length === 0
        ) {
          // Remove invalid coordinates
          delete data.location.coordinates;
        } else if (data.location.coordinates.coordinates.length !== 2) {
          errors.push('Coordinates must have exactly 2 values: [longitude, latitude]');
        } else {
          const [lng, lat] = data.location.coordinates.coordinates;
          if (typeof lng !== 'number' || typeof lat !== 'number') {
            errors.push('Coordinates must be numbers');
          } else if (isNaN(lng) || isNaN(lat)) {
            errors.push('Coordinates must be valid numbers');
          } else if (lng < -180 || lng > 180) {
            errors.push('Longitude must be between -180 and 180');
          } else if (lat < -90 || lat > 90) {
            errors.push('Latitude must be between -90 and 90');
          }
        }
      }
    }
  }

  // Salary type validation (optional)
  if (data.salaryType !== undefined && data.salaryType !== null && data.salaryType !== '') {
    if (!SALARY_TYPES.includes(data.salaryType)) {
      errors.push(`Salary type must be one of: ${SALARY_TYPES.join(', ')}`);
    }
  }

  // Salary amount validation (optional)
  if (data.salaryAmount !== undefined && data.salaryAmount !== null && data.salaryAmount !== '') {
    // Convert string to number if needed (from form inputs)
    const salaryAmount =
      typeof data.salaryAmount === 'string' ? parseFloat(data.salaryAmount) : data.salaryAmount;
    if (isNaN(salaryAmount) || salaryAmount < 0) {
      errors.push('Salary amount must be a positive number if provided');
    } else {
      // Replace string with number in data
      data.salaryAmount = salaryAmount;
    }
  }

  // Experience validation (optional)
  if (data.experienceRequired && !EXPERIENCE_LEVELS.includes(data.experienceRequired)) {
    errors.push(`Experience level must be one of: ${EXPERIENCE_LEVELS.join(', ')}`);
  }

  // Positions validation (optional)
  if (data.positions !== undefined && data.positions !== null && data.positions !== '') {
    // Convert string to number if needed (from form inputs)
    const positions =
      typeof data.positions === 'string' ? parseInt(data.positions, 10) : data.positions;
    if (isNaN(positions) || positions < 1 || positions > 100) {
      errors.push('Positions must be a number between 1 and 100 if provided');
    } else {
      // Replace string with number in data
      data.positions = positions;
    }
  }

  // Start date validation (optional)
  if (data.startDate !== undefined && data.startDate !== null && data.startDate !== '') {
    const startDate = new Date(data.startDate);
    if (isNaN(startDate.getTime())) {
      errors.push('Start date must be a valid date if provided');
    }
  }

  // End date validation (optional)
  if (data.endDate) {
    const endDate = new Date(data.endDate);
    if (isNaN(endDate.getTime())) {
      errors.push('End date must be a valid date');
    } else if (data.startDate) {
      const startDate = new Date(data.startDate);
      if (endDate <= startDate) {
        errors.push('End date must be after start date');
      }
    }
  }

  // Skills validation (optional)
  if (data.skillsRequired && !Array.isArray(data.skillsRequired)) {
    errors.push('Skills required must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate update job request
 */
export const validateUpdateJob = (data) => {
  const errors = [];

  // Title validation (optional)
  if (data.title !== undefined) {
    if (typeof data.title !== 'string') {
      errors.push('Title must be a string');
    } else if (data.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long');
    } else if (data.title.length > 100) {
      errors.push('Title cannot exceed 100 characters');
    }
  }

  // Description validation (optional)
  if (data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.trim().length < 20) {
      errors.push('Description must be at least 20 characters long');
    } else if (data.description.length > 2000) {
      errors.push('Description cannot exceed 2000 characters');
    }
  }

  // Category validation (optional)
  if (data.category !== undefined && !JOB_CATEGORIES.includes(data.category)) {
    errors.push(`Category must be one of: ${JOB_CATEGORIES.join(', ')}`);
  }

  // Salary type validation (optional)
  if (data.salaryType !== undefined && !SALARY_TYPES.includes(data.salaryType)) {
    errors.push(`Salary type must be one of: ${SALARY_TYPES.join(', ')}`);
  }

  // Salary amount validation (optional)
  if (data.salaryAmount !== undefined) {
    if (typeof data.salaryAmount !== 'number' || data.salaryAmount < 0) {
      errors.push('Salary amount must be a positive number');
    }
  }

  // Experience validation (optional)
  if (
    data.experienceRequired !== undefined &&
    !EXPERIENCE_LEVELS.includes(data.experienceRequired)
  ) {
    errors.push(`Experience level must be one of: ${EXPERIENCE_LEVELS.join(', ')}`);
  }

  // Positions validation (optional)
  if (data.positions !== undefined) {
    if (typeof data.positions !== 'number' || data.positions < 1 || data.positions > 100) {
      errors.push('Positions must be a number between 1 and 100');
    }
  }

  // Status validation (optional)
  if (data.status !== undefined && !JOB_STATUS.includes(data.status)) {
    errors.push(`Status must be one of: ${JOB_STATUS.join(', ')}`);
  }

  // Dates validation (optional)
  if (data.startDate !== undefined) {
    const startDate = new Date(data.startDate);
    if (isNaN(startDate.getTime())) {
      errors.push('Start date must be a valid date');
    }
  }

  if (data.endDate !== undefined) {
    const endDate = new Date(data.endDate);
    if (isNaN(endDate.getTime())) {
      errors.push('End date must be a valid date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate query parameters for job listing
 */
export const validateJobQuery = (query) => {
  const errors = [];

  // Page validation
  if (query.page !== undefined) {
    const page = Number(query.page);
    if (isNaN(page) || page < 1) {
      errors.push('Page must be a positive number');
    }
  }

  // Limit validation
  if (query.limit !== undefined) {
    const limit = Number(query.limit);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.push('Limit must be a number between 1 and 100');
    }
  }

  // Category validation
  if (query.category !== undefined && !JOB_CATEGORIES.includes(query.category)) {
    errors.push(`Category must be one of: ${JOB_CATEGORIES.join(', ')}`);
  }

  // Status validation
  if (query.status !== undefined && !JOB_STATUS.includes(query.status)) {
    errors.push(`Status must be one of: ${JOB_STATUS.join(', ')}`);
  }

  // Salary validation
  if (query.minSalary !== undefined) {
    const minSalary = Number(query.minSalary);
    if (isNaN(minSalary) || minSalary < 0) {
      errors.push('Min salary must be a positive number');
    }
  }

  if (query.maxSalary !== undefined) {
    const maxSalary = Number(query.maxSalary);
    if (isNaN(maxSalary) || maxSalary < 0) {
      errors.push('Max salary must be a positive number');
    }
  }

  // Sort validation
  if (query.sortBy !== undefined) {
    const validSortFields = ['createdAt', 'salaryAmount', 'title', 'applicantsCount'];
    if (!validSortFields.includes(query.sortBy)) {
      errors.push(`Sort by must be one of: ${validSortFields.join(', ')}`);
    }
  }

  if (query.sortOrder !== undefined) {
    if (!['asc', 'desc'].includes(query.sortOrder)) {
      errors.push('Sort order must be either "asc" or "desc"');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate nearby jobs query
 */
export const validateNearbyQuery = (query) => {
  const errors = [];

  // Latitude validation
  if (!query.lat) {
    errors.push('Latitude is required');
  } else {
    const lat = Number(query.lat);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push('Latitude must be a number between -90 and 90');
    }
  }

  // Longitude validation
  if (!query.lng) {
    errors.push('Longitude is required');
  } else {
    const lng = Number(query.lng);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push('Longitude must be a number between -180 and 180');
    }
  }

  // Radius validation (optional)
  if (query.radius !== undefined) {
    const radius = Number(query.radius);
    if (isNaN(radius) || radius < 1 || radius > 1000) {
      errors.push('Radius must be a number between 1 and 1000 km');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
