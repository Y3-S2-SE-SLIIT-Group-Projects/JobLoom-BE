import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/server.js';
import User from '../../src/modules/users/user.model.js';

describe('AI Routes - Integration Tests', () => {
  let jobSeekerToken;
  let employerToken;

  const createUserAndLogin = async ({ firstName, lastName, email, role, phone }) => {
    const password = 'password123';

    await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      location: {
        village: 'Test Village',
        district: 'Colombo',
        province: 'Western',
      },
      isVerified: true,
    });

    const loginRes = await request(app).post('/api/users/login').send({ email, password });
    return loginRes.body.token;
  };

  beforeAll(async () => {
    const testDbUri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/jobloom-test';
    await mongoose.connect(testDbUri);
  }, 10000);

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});

    jobSeekerToken = await createUserAndLogin({
      firstName: 'AI',
      lastName: 'JobSeeker',
      email: 'ai-jobseeker@test.com',
      role: 'job_seeker',
      phone: '94770000101',
    });

    employerToken = await createUserAndLogin({
      firstName: 'AI',
      lastName: 'Employer',
      email: 'ai-employer@test.com',
      role: 'employer',
      phone: '94770000102',
    });
  });

  describe('POST /api/ai/analyze-skill-gap', () => {
    test('should return 401 without authentication', async () => {
      const res = await request(app).post('/api/ai/analyze-skill-gap').send({
        jobId: new mongoose.Types.ObjectId().toString(),
        cvId: new mongoose.Types.ObjectId().toString(),
      });

      expect(res.status).toBe(401);
    });

    test('should return 403 for non-job-seeker roles', async () => {
      const res = await request(app)
        .post('/api/ai/analyze-skill-gap')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          jobId: new mongoose.Types.ObjectId().toString(),
          cvId: new mongoose.Types.ObjectId().toString(),
        });

      expect(res.status).toBe(403);
    });

    test('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/ai/analyze-skill-gap')
        .set('Authorization', `Bearer ${jobSeekerToken}`)
        .send({ jobId: new mongoose.Types.ObjectId().toString() });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('jobId and cvId are required');
    });
  });
});
