import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/server.js';
import User from '../../src/modules/users/user.model.js';
import { jest } from '@jest/globals';

// Mock the SMS service to avoid real network calls
jest.mock('../../src/services/sms.service.js', () => ({
  sendOtp: jest.fn().mockResolvedValue({ success: true }),
  sendSms: jest.fn().mockResolvedValue({ success: true }),
}));

describe('User Routes - Integration Tests', () => {
  beforeAll(async () => {
    const testDbUri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/jobloom-test';
    await mongoose.connect(testDbUri);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('Registration and Verification Flow', () => {
    const userData = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@test.com',
      phone: '94712345678',
      password: 'password123',
      role: 'job_seeker',
      location: {
        village: 'Kottawa',
        district: 'Colombo',
        province: 'Western',
      },
    };

    test('should register user and then verify with OTP', async () => {
      // 1. Register
      const regRes = await request(app).post('/api/users/register').send(userData);
      expect(regRes.status).toBe(201);
      expect(regRes.body.isVerified).toBe(false);

      // Get OTP from DB (since it's mocked in SMS service)
      const user = await User.findOne({ email: userData.email });
      const otp = user.verificationOtp;
      expect(otp).toBeDefined();

      // 2. Verify OTP
      const verifyRes = await request(app)
        .post('/api/users/verify-registration')
        .send({ phone: userData.phone, otp });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.token).toBeDefined();

      const updatedUser = await User.findOne({ email: userData.email });
      expect(updatedUser.isVerified).toBe(true);
    });

    test('should fail verification with wrong OTP', async () => {
      await request(app).post('/api/users/register').send(userData);

      const res = await request(app)
        .post('/api/users/verify-registration')
        .send({ phone: userData.phone, otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid or expired OTP');
    });
  });

  describe('Forgot Password Flow', () => {
    beforeEach(async () => {
      // Create a user first
      await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        phone: '94788888888',
        password: 'password123',
        role: 'job_seeker',
        location: { village: 'A', district: 'B', province: 'C' },
        isVerified: true,
      });
    });

    test('should handle forgot password, verify OTP, and reset password', async () => {
      const phone = '94788888888';

      // 1. Forgot password
      const forgotRes = await request(app).post('/api/users/forgot-password').send({ phone });

      expect(forgotRes.status).toBe(200);

      const user = await User.findOne({ phone });
      const otp = user.passwordResetOtp;

      // 2. Verify OTP
      const verifyRes = await request(app)
        .post('/api/users/verify-password-reset')
        .send({ phone, otp });

      expect(verifyRes.status).toBe(200);
      const resetToken = verifyRes.body.resetToken;
      expect(resetToken).toBeDefined();

      // 3. Reset password
      const resetRes = await request(app)
        .post('/api/users/reset-password')
        .send({ phone, resetToken, password: 'newpassword123' });

      expect(resetRes.status).toBe(200);

      // 4. Verify login with new password
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({ email: 'john@test.com', password: 'newpassword123' });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.token).toBeDefined();
    });
  });
});
