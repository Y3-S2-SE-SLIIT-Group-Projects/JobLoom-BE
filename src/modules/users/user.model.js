import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const ratingStatsSchema = new mongoose.Schema(
  {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    ratingDistribution: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['job_seeker', 'employer', 'admin'],
      required: true,
      default: 'job_seeker',
    },
    phone: {
      type: String,
      required: true,
    },
    location: {
      village: { type: String, required: true },
      district: { type: String, required: true },
      province: { type: String, required: true },
    },
    profileImage: {
      type: String,
      default: '',
    },
    cv: {
      type: String, // file path for job seekers
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    ratingStats: {
      type: ratingStatsSchema,
      default: () => ({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      }),
    },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Method to update rating statistics
userSchema.methods.updateRatingStats = function (stats) {
  this.ratingStats = {
    averageRating: stats.averageRating || 0,
    totalReviews: stats.totalReviews || 0,
    ratingDistribution: stats.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  };
};

// Pre-save hook for password hashing
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
