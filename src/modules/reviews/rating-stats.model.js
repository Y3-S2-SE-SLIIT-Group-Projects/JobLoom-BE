import mongoose from 'mongoose';

/**
 * RatingStats Model
 * Separate collection for storing user rating statistics
 * Decoupled from User model for better separation of concerns
 */
const ratingStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Average rating cannot be negative'],
      max: [5, 'Average rating cannot exceed 5'],
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: [0, 'Total reviews cannot be negative'],
    },
    ratingDistribution: {
      5: { type: Number, default: 0, min: 0 },
      4: { type: Number, default: 0, min: 0 },
      3: { type: Number, default: 0, min: 0 },
      2: { type: Number, default: 0, min: 0 },
      1: { type: Number, default: 0, min: 0 },
    },
    lastCalculated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient lookups
ratingStatsSchema.index({ averageRating: -1 });
ratingStatsSchema.index({ totalReviews: -1 });

/**
 * Static method to get or create rating stats for a user
 * @param {ObjectId} userId - User ID
 * @returns {Object} Rating stats
 */
ratingStatsSchema.statics.getOrCreate = async function (userId) {
  let stats = await this.findOne({ userId });

  if (!stats) {
    stats = await this.create({
      userId,
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    });
  }

  return stats;
};

const RatingStats = mongoose.model('RatingStats', ratingStatsSchema);

export default RatingStats;
