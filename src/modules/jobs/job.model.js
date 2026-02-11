import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Job Schema
 * Represents a job posting in the system
 */
const jobSchema = new Schema(
  {
    // Employer Information (use static ID for now until user management is complete)
    employerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employer ID is required'],
      index: true,
    },

    // Basic Job Information
    title: {
      type: String,
      required: false,
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
      index: true,
    },

    description: {
      type: String,
      required: false,
      trim: true,
      minlength: [20, 'Description must be at least 20 characters long'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    // Job Category (Expanded)
    category: {
      type: String,
      required: false,
      enum: {
        values: [
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
        ],
        message: '{VALUE} is not a valid category',
      },
      index: true,
    },

    // Job Role
    jobRole: {
      type: String,
      required: false,
      trim: true,
      maxlength: [100, 'Job role cannot exceed 100 characters'],
    },

    // Employment Type
    employmentType: {
      type: String,
      required: false,
      enum: {
        values: [
          'full-time',
          'part-time',
          'contract',
          'temporary',
          'internship',
          'seasonal',
          'freelance',
        ],
        message: '{VALUE} is not a valid employment type',
      },
      index: true,
    },

    // Location Information
    location: {
      village: {
        type: String,
        required: false,
        trim: true,
      },
      district: {
        type: String,
        required: false,
        trim: true,
      },
      province: {
        type: String,
        required: false,
        trim: true,
      },
      // Mapbox coordinates (optional - can use manual location or map location)
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          required: false,
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: false,
          validate: {
            validator: function (coords) {
              // If coordinates are not provided, that's fine (optional)
              if (!coords || coords.length === 0) return true;
              // If provided, must be valid
              if (coords.length !== 2) return false;
              if (typeof coords[0] !== 'number' || typeof coords[1] !== 'number') return false;
              if (isNaN(coords[0]) || isNaN(coords[1])) return false;
              return (
                coords[0] >= -180 &&
                coords[0] <= 180 && // longitude
                coords[1] >= -90 &&
                coords[1] <= 90
              ); // latitude
            },
            message: 'Invalid coordinates format. Expected [longitude, latitude]',
          },
        },
        _id: false, // Don't create _id for subdocuments
      },
      // Full address from Mapbox (optional)
      fullAddress: {
        type: String,
        trim: true,
      },
    },

    // Salary Information
    salaryType: {
      type: String,
      required: false,
      enum: {
        values: ['daily', 'weekly', 'monthly', 'contract'],
        message: '{VALUE} is not a valid salary type',
      },
    },

    salaryAmount: {
      type: Number,
      required: false,
      min: [0, 'Salary amount cannot be negative'],
    },

    currency: {
      type: String,
      default: 'LKR',
      enum: ['LKR', 'USD'],
    },

    // Job Requirements
    skillsRequired: [
      {
        type: String,
        trim: true,
      },
    ],

    experienceRequired: {
      type: String,
      enum: ['none', 'beginner', 'intermediate', 'advanced', 'expert'],
      default: 'none',
    },

    // Positions
    positions: {
      type: Number,
      required: false,
      min: [1, 'At least 1 position is required'],
      max: [100, 'Cannot exceed 100 positions'],
      default: 1,
    },

    // Job Duration
    startDate: {
      type: Date,
      required: false,
    },

    endDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return !value || value > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },

    // Job Status
    status: {
      type: String,
      enum: ['open', 'closed', 'filled'],
      default: 'open',
      index: true,
    },

    // Applicants Counter
    applicantsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Soft delete flag
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================
// INDEXES FOR PERFORMANCE
// ============================================

// Geospatial index for nearby job search (Mapbox integration)
// TODO: Uncomment this when Mapbox integration is complete and coordinates are populated
// jobSchema.index({ 'location.coordinates': '2dsphere' });

// Compound indexes for common queries
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ employerId: 1, status: 1 });
jobSchema.index({ createdAt: -1 }); // For sorting by newest
jobSchema.index({ salaryAmount: -1 }); // For sorting by salary
jobSchema.index({ isActive: 1, status: 1 }); // For filtering active jobs

// Text index for search functionality
jobSchema.index({ title: 'text', description: 'text' });

// ============================================
// VIRTUAL FIELDS
// ============================================

// Virtual for employer details (will be populated from User model)
jobSchema.virtual('employer', {
  ref: 'User',
  localField: 'employerId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for applications (will be populated from Application model)
jobSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'jobId',
});

// Virtual for formatted salary
jobSchema.virtual('formattedSalary').get(function () {
  // Handle optional fields - return empty string if salary data is missing
  if (!this.salaryAmount || this.salaryAmount === undefined || this.salaryAmount === null) {
    return '';
  }
  const currency = this.currency || 'LKR';
  const salaryType = this.salaryType || '';
  return `${currency} ${this.salaryAmount.toLocaleString()} / ${salaryType}`;
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Check if job is still accepting applications
 */
jobSchema.methods.isAcceptingApplications = function () {
  return this.status === 'open' && this.isActive;
};

/**
 * Close the job posting
 */
jobSchema.methods.closeJob = function () {
  this.status = 'closed';
  return this.save();
};

/**
 * Mark job as filled
 */
jobSchema.methods.markAsFilled = function () {
  this.status = 'filled';
  return this.save();
};

/**
 * Increment applicants count
 */
jobSchema.methods.incrementApplicants = function () {
  this.applicantsCount += 1;
  return this.save();
};

/**
 * Decrement applicants count
 */
jobSchema.methods.decrementApplicants = function () {
  if (this.applicantsCount > 0) {
    this.applicantsCount -= 1;
  }
  return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Find jobs by employer
 */
jobSchema.statics.findByEmployer = function (employerId, options = {}) {
  const { includeInactive = false } = options;
  const query = { employerId };

  if (!includeInactive) {
    query.isActive = true;
  }

  return this.find(query).sort({ createdAt: -1 });
};

/**
 * Find active jobs
 */
jobSchema.statics.findActive = function () {
  return this.find({ isActive: true, status: 'open' }).sort({ createdAt: -1 });
};

/**
 * Find jobs by category
 */
jobSchema.statics.findByCategory = function (category) {
  return this.find({
    category,
    isActive: true,
    status: 'open',
  }).sort({ createdAt: -1 });
};

/**
 * Search jobs by text
 */
jobSchema.statics.searchJobs = function (searchText) {
  return this.find(
    {
      $text: { $search: searchText },
      isActive: true,
      status: 'open',
    },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });
};

/**
 * Find nearby jobs using geospatial query
 * @param {Number} longitude
 * @param {Number} latitude
 * @param {Number} maxDistance - in meters (default: 50000 = 50km)
 */
jobSchema.statics.findNearby = function (longitude, latitude, maxDistance = 50000) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    },
    isActive: true,
    status: 'open',
  });
};

// ============================================
// PRE-SAVE HOOKS
// ============================================

/**
 * Pre-save hook: Clean up coordinates before saving
 * Remove coordinates if they're empty or invalid to prevent MongoDB GeoJSON errors
 */
jobSchema.pre('save', async function () {
  // Clean up coordinates - remove if empty or invalid
  if (this.location && this.location.coordinates) {
    const coords = this.location.coordinates.coordinates;

    // Remove coordinates if:
    // - coordinates array doesn't exist
    // - coordinates is not an array
    // - coordinates array is empty
    // - coordinates array doesn't have exactly 2 elements
    // - coordinates are not valid numbers
    const shouldRemove =
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
      coords[1] > 90;

    if (shouldRemove) {
      // Completely remove invalid coordinates - use multiple methods to ensure removal
      // Method 1: Set to undefined
      this.location.coordinates = undefined;
      // Method 2: Delete the property
      delete this.location.coordinates;
      // Method 3: Use Mongoose set with strict: false
      if (this.location.set) {
        this.location.set('coordinates', undefined, { strict: false });
      }
      // Method 4: Mark location as modified to ensure Mongoose processes the change
      this.markModified('location');
    }
  }

  // Double-check: if coordinates still exist with empty array, force remove
  if (
    this.location &&
    this.location.coordinates &&
    this.location.coordinates.coordinates &&
    Array.isArray(this.location.coordinates.coordinates) &&
    this.location.coordinates.coordinates.length === 0
  ) {
    this.location.coordinates = undefined;
    delete this.location.coordinates;
    if (this.location.set) {
      this.location.set('coordinates', undefined, { strict: false });
    }
    this.markModified('location');
  }

  // Validate dates
  if (this.startDate && new Date(this.startDate) < new Date()) {
    // Allow past dates for now (can be changed based on requirements)
    // this.startDate = new Date();
  }
  // No need for next() with async functions
});

// ============================================
// QUERY HELPERS
// ============================================

jobSchema.query.active = function () {
  return this.where({ isActive: true });
};

jobSchema.query.byStatus = function (status) {
  return this.where({ status });
};

jobSchema.query.byCategory = function (category) {
  return this.where({ category });
};

// ============================================
// MODEL EXPORT
// ============================================

const Job = mongoose.model('Job', jobSchema);

export default Job;
