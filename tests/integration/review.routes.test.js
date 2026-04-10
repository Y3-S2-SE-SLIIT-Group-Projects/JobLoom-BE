import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/server.js';
import User from '../../src/modules/users/user.model.js';
import Job from '../../src/modules/jobs/job.model.js';
import Application from '../../src/modules/applications/application.model.js';
import Review from '../../src/modules/reviews/review.model.js';
import RatingStats from '../../src/modules/reviews/rating-stats.model.js';

/**
 * Integration Tests for Review Routes
 * Testing complete API workflows
 *
 * Prerequisites:
 * 1. Start MongoDB: docker-compose -f docker-compose.test.yml up -d
 * 2. Run tests: npm run test:integration
 * 3. Stop MongoDB: docker-compose -f docker-compose.test.yml down
 */

describe('Review Routes - Integration Tests', () => {
  let employerToken;
  let jobSeekerToken;
  let employerId;
  let jobSeekerId;
  let jobId;
  let applicationId;

  const createUserAndLogin = async ({ firstName, lastName, email, role, phone }) => {
    const password = 'password123';

    const user = await User.create({
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

    return { token: loginRes.body.token, userId: user._id.toString() };
  };

  // Setup: Connect to test database
  beforeAll(async () => {
    const testDbUri = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/jobloom-test';
    console.log('Connecting to test database:', testDbUri);
    await mongoose.connect(testDbUri);
  }, 10000);

  // Cleanup: Clear database and disconnect
  afterAll(async () => {
    await User.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
    await Review.deleteMany({});
    await RatingStats.deleteMany({});
    await mongoose.connection.close();
  });

  // Setup: Create test users, job, and application
  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
    await Review.deleteMany({});
    await RatingStats.deleteMany({});

    // Create verified users and login
    const employer = await createUserAndLogin({
      firstName: 'John',
      lastName: 'Employer',
      email: 'employer@test.com',
      role: 'employer',
      phone: '94770000011',
    });

    employerToken = employer.token;
    employerId = employer.userId;

    const jobSeeker = await createUserAndLogin({
      firstName: 'Jane',
      lastName: 'Worker',
      email: 'worker@test.com',
      role: 'job_seeker',
      phone: '94770000012',
    });

    jobSeekerToken = jobSeeker.token;
    jobSeekerId = jobSeeker.userId;

    // Create job
    const job = await Job.create({
      employerId,
      title: 'Farm Helper Needed',
      description: 'Need help with harvesting',
      status: 'open',
    });
    jobId = job._id;

    // Create accepted application
    const application = await Application.create({
      jobId,
      jobSeekerId,
      employerId,
      status: 'accepted',
    });
    applicationId = application._id;
  });

  describe('POST /api/reviews', () => {
    test('should successfully create review with accepted application', async () => {
      const reviewData = {
        revieweeId: employerId,
        jobId,
        reviewerType: 'job_seeker',
        rating: 5,
        comment: 'Great employer, paid on time!',
        workQuality: 5,
        communication: 5,
        paymentOnTime: 5,
      };

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${jobSeekerToken}`)
        .send(reviewData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.review).toHaveProperty('_id');
      expect(res.body.data.review.rating).toBe(5);
    });

    test('should fail without authentication', async () => {
      const reviewData = {
        revieweeId: employerId,
        jobId,
        reviewerType: 'job_seeker',
        rating: 5,
      };

      const res = await request(app).post('/api/reviews').send(reviewData);

      expect(res.status).toBe(401);
    });

    test('should fail for duplicate review', async () => {
      const reviewData = {
        revieweeId: employerId,
        jobId,
        reviewerType: 'job_seeker',
        rating: 5,
      };

      // Create first review
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${jobSeekerToken}`)
        .send(reviewData);

      // Try to create duplicate
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${jobSeekerToken}`)
        .send(reviewData);

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already reviewed');
    });

    test('should fail without accepted application', async () => {
      // Change application status to pending
      await Application.findByIdAndUpdate(applicationId, { status: 'pending' });

      const reviewData = {
        revieweeId: employerId,
        jobId,
        reviewerType: 'job_seeker',
        rating: 5,
      };

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${jobSeekerToken}`)
        .send(reviewData);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('worked with');
    });

    test('should fail for self-review', async () => {
      const reviewData = {
        revieweeId: jobSeekerId, // Reviewing self
        jobId,
        reviewerType: 'job_seeker',
        rating: 5,
      };

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${jobSeekerToken}`)
        .send(reviewData);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('yourself');
    });

    test('should derive reviewerType from authenticated role and ignore client-provided value', async () => {
      const reviewData = {
        revieweeId: employerId,
        jobId,
        reviewerType: 'employer',
        rating: 5,
      };

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${jobSeekerToken}`)
        .send(reviewData);

      expect(res.status).toBe(201);
      expect(res.body.data.review.reviewerType).toBe('job_seeker');
    });
  });

  describe('GET /api/reviews/:id', () => {
    test('should retrieve review by ID', async () => {
      // Create review
      const review = await Review.create({
        reviewerId: jobSeekerId,
        revieweeId: employerId,
        jobId,
        reviewerType: 'job_seeker',
        rating: 5,
      });

      const res = await request(app).get(`/api/reviews/${review._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.review._id).toBe(review._id.toString());
    });

    test('should return 404 for non-existent review', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/reviews/${fakeId}`);

      expect(res.status).toBe(404);
    });

    test('should return 400 for invalid review id format', async () => {
      const res = await request(app).get('/api/reviews/not-a-valid-id');

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/reviews/:id', () => {
    test('should update own review within 24 hours', async () => {
      // Create review
      const review = await Review.create({
        reviewerId: jobSeekerId,
        revieweeId: employerId,
        jobId,
        reviewerType: 'job_seeker',
        rating: 4,
        comment: 'Good',
      });

      const updateData = {
        rating: 5,
        comment: 'Actually excellent!',
      };

      const res = await request(app)
        .put(`/api/reviews/${review._id}`)
        .set('Authorization', `Bearer ${jobSeekerToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.data.review.rating).toBe(5);
      expect(res.body.data.review.comment).toBe('Actually excellent!');
    });

    test("should fail to update someone else's review", async () => {
      // Create review by job seeker
      const review = await Review.create({
        reviewerId: jobSeekerId,
        revieweeId: employerId,
        jobId,
        reviewerType: 'job_seeker',
        rating: 4,
      });

      const updateData = { rating: 5 };

      // Try to update with employer token
      const res = await request(app)
        .put(`/api/reviews/${review._id}`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send(updateData);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('own reviews');
    });

    test('should fail to update own review after 24-hour window when not reported', async () => {
      const review = await Review.create({
        reviewerId: jobSeekerId,
        revieweeId: employerId,
        jobId,
        reviewerType: 'job_seeker',
        rating: 4,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      });

      const res = await request(app)
        .put(`/api/reviews/${review._id}`)
        .set('Authorization', `Bearer ${jobSeekerToken}`)
        .send({ rating: 5 });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('within 24 hours');
    });

    test('should allow update after 24-hour window if review has been reported', async () => {
      const review = await Review.create({
        reviewerId: jobSeekerId,
        revieweeId: employerId,
        jobId,
        reviewerType: 'job_seeker',
        rating: 2,
        comment: 'Old content',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      });

      await request(app)
        .post(`/api/reviews/${review._id}/report`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send({ reason: 'This is offensive and misleading content' });

      const res = await request(app)
        .put(`/api/reviews/${review._id}`)
        .set('Authorization', `Bearer ${jobSeekerToken}`)
        .send({ rating: 4, comment: 'Updated after report' });

      expect(res.status).toBe(200);
      expect(res.body.data.review.rating).toBe(4);
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    test('should delete own review', async () => {
      const review = await Review.create({
        reviewerId: jobSeekerId,
        revieweeId: employerId,
        jobId,
        reviewerType: 'job_seeker',
        rating: 4,
      });

      const res = await request(app)
        .delete(`/api/reviews/${review._id}`)
        .set('Authorization', `Bearer ${jobSeekerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');

      // Verify soft delete
      const deletedReview = await Review.findById(review._id).select('+isDeleted');
      expect(deletedReview.isDeleted).toBe(true);
    });

    test('should fail to delete after 24-hour window when review is not reported', async () => {
      const review = await Review.create({
        reviewerId: jobSeekerId,
        revieweeId: employerId,
        jobId,
        reviewerType: 'job_seeker',
        rating: 4,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      });

      const res = await request(app)
        .delete(`/api/reviews/${review._id}`)
        .set('Authorization', `Bearer ${jobSeekerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('within 24 hours');
    });

    test('should allow admin to delete old reviews outside 24-hour window', async () => {
      const admin = await createUserAndLogin({
        firstName: 'Alice',
        lastName: 'Admin',
        email: 'admin@test.com',
        role: 'admin',
        phone: '94770000013',
      });

      const review = await Review.create({
        reviewerId: jobSeekerId,
        revieweeId: employerId,
        jobId,
        reviewerType: 'job_seeker',
        rating: 4,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      });

      const res = await request(app)
        .delete(`/api/reviews/${review._id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');
    });
  });

  describe('GET /api/reviews/user/:userId', () => {
    test('should retrieve all reviews for a user', async () => {
      // Create multiple reviews
      await Review.create([
        {
          reviewerId: jobSeekerId,
          revieweeId: employerId,
          jobId,
          reviewerType: 'job_seeker',
          rating: 5,
        },
        {
          reviewerId: jobSeekerId,
          revieweeId: employerId,
          jobId: new mongoose.Types.ObjectId(),
          reviewerType: 'job_seeker',
          rating: 4,
        },
      ]);

      const res = await request(app).get(`/api/reviews/user/${employerId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reviews).toHaveLength(2);
      expect(res.body.data.pagination).toBeDefined();
    });

    test('should filter reviews by reviewer type', async () => {
      const res = await request(app)
        .get(`/api/reviews/user/${employerId}`)
        .query({ reviewerType: 'job_seeker' });

      expect(res.status).toBe(200);
    });

    test('should return 400 for invalid reviewer type query', async () => {
      const res = await request(app)
        .get(`/api/reviews/user/${employerId}`)
        .query({ reviewerType: 'invalid_role' });

      expect(res.status).toBe(400);
    });

    test('should return 400 for invalid user ID format', async () => {
      const res = await request(app).get('/api/reviews/user/not-a-valid-id');

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/reviews/stats/:userId', () => {
    test('should return rating statistics with badge', async () => {
      // Create reviews to build stats
      await Review.create([
        {
          reviewerId: jobSeekerId,
          revieweeId: employerId,
          jobId,
          reviewerType: 'job_seeker',
          rating: 5,
        },
        {
          reviewerId: jobSeekerId,
          revieweeId: employerId,
          jobId: new mongoose.Types.ObjectId(),
          reviewerType: 'job_seeker',
          rating: 4,
        },
      ]);

      // Stats are auto-updated by post-save hooks via RatingStats collection.
      // Allow hooks to complete before querying.
      await new Promise((resolve) => setTimeout(resolve, 500));

      const res = await request(app).get(`/api/reviews/stats/${employerId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.stats).toHaveProperty('averageRating');
      expect(res.body.data.stats).toHaveProperty('totalReviews');
      expect(res.body.data.stats).toHaveProperty('trustScore');
      expect(res.body.data.stats).toHaveProperty('badge');
    });

    test('should bucket decimal ratings into nearest star distribution', async () => {
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${jobSeekerToken}`)
        .send({
          revieweeId: employerId,
          jobId,
          rating: 4,
          workQuality: 4,
          communication: 5,
        });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const res = await request(app).get(`/api/reviews/stats/${employerId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.stats.averageRating).toBe(4.3);
      expect(res.body.data.stats.totalReviews).toBe(1);
      expect(res.body.data.stats.ratingDistribution['4']).toBe(1);
      expect(res.body.data.stats.ratingDistribution['5']).toBe(0);
    });
  });

  describe('GET /api/reviews/sent/:userId', () => {
    test('should return reviews authored by the given user', async () => {
      await Review.create({
        reviewerId: jobSeekerId,
        revieweeId: employerId,
        jobId,
        reviewerType: 'job_seeker',
        rating: 5,
      });

      const res = await request(app).get(`/api/reviews/sent/${jobSeekerId}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.reviews)).toBe(true);
      expect(res.body.data.reviews).toHaveLength(1);
      const reviewerId =
        res.body.data.reviews[0].reviewerId?._id || res.body.data.reviews[0].reviewerId;
      expect(reviewerId.toString()).toBe(jobSeekerId.toString());
    });

    test('should return 400 for invalid user ID format', async () => {
      const res = await request(app).get('/api/reviews/sent/not-a-valid-id');

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/reviews/employer/:employerId and /jobseeker/:jobSeekerId', () => {
    test('should retrieve employer reviews alias endpoint', async () => {
      await Review.create({
        reviewerId: jobSeekerId,
        revieweeId: employerId,
        jobId,
        reviewerType: 'job_seeker',
        rating: 5,
      });

      const res = await request(app).get(`/api/reviews/employer/${employerId}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.reviews)).toBe(true);
    });

    test('should retrieve job seeker reviews alias endpoint', async () => {
      await Review.create({
        reviewerId: employerId,
        revieweeId: jobSeekerId,
        jobId,
        reviewerType: 'employer',
        rating: 4,
      });

      const res = await request(app).get(`/api/reviews/jobseeker/${jobSeekerId}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.reviews)).toBe(true);
    });

    test('should return 400 for invalid employer ID format', async () => {
      const res = await request(app).get('/api/reviews/employer/not-a-valid-id');

      expect(res.status).toBe(400);
    });

    test('should return 400 for invalid job seeker ID format', async () => {
      const res = await request(app).get('/api/reviews/jobseeker/not-a-valid-id');

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/reviews/:id/report', () => {
    test('should report a review', async () => {
      const review = await Review.create({
        reviewerId: jobSeekerId,
        revieweeId: employerId,
        jobId,
        reviewerType: 'job_seeker',
        rating: 1,
        comment: 'Inappropriate content',
      });

      const reportData = {
        reason: 'This review contains false information and inappropriate language',
      };

      const res = await request(app)
        .post(`/api/reviews/${review._id}/report`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send(reportData);

      expect(res.status).toBe(200);
      expect(res.body.data.reportCount).toBe(1);
    });

    test('should fail for duplicate report from same user', async () => {
      const review = await Review.create({
        reviewerId: jobSeekerId,
        revieweeId: employerId,
        jobId,
        reviewerType: 'job_seeker',
        rating: 1,
      });

      const reportData = {
        reason: 'This review is inappropriate',
      };

      // First report
      await request(app)
        .post(`/api/reviews/${review._id}/report`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send(reportData);

      // Second report from same user
      const res = await request(app)
        .post(`/api/reviews/${review._id}/report`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send(reportData);

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already reported');
    });

    test('should return 400 when report reason is too short', async () => {
      const review = await Review.create({
        reviewerId: jobSeekerId,
        revieweeId: employerId,
        jobId,
        reviewerType: 'job_seeker',
        rating: 1,
      });

      const res = await request(app)
        .post(`/api/reviews/${review._id}/report`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send({ reason: 'too short' });

      expect(res.status).toBe(400);
    });
  });
});
