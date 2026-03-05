import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

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
    cvs: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        isPrimary: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    skills: {
      type: [String],
      default: [],
    },
    experience: [
      {
        title: { type: String },
        company: { type: String },
        duration: { type: String },
        description: { type: String },
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    verificationOtp: {
      type: String,
      default: null,
    },
    verificationOtpExpires: {
      type: Date,
      default: null,
    },
    passwordResetOtp: {
      type: String,
      default: null,
    },
    passwordResetOtpExpires: {
      type: Date,
      default: null,
    },
    calendly: {
      accessToken: { type: String, default: null },
      refreshToken: { type: String, default: null },
      tokenExpiresAt: { type: Date, default: null },
      calendlyUri: { type: String, default: null },
      schedulingUrl: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

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
