import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/server.js';
import User from '../../src/modules/users/user.model.js';
import Job from '../../src/modules/jobs/job.model.js';
import Application from '../../src/modules/applications/application.model.js';
import Review from '../../src/modules/reviews/review.model.js';

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
    await mongoose.connection.close();
  });

  // Setup: Create test users, job, and application
  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
    await Review.deleteMany({});

    // Register employer
    const employerRes = await request(app).post('/api/users/register').send({
      firstName: 'John',
      lastName: 'Employer',
      email: 'employer@test.com',
      password: 'password123',
      role: 'employer',
    });

    employerToken = employerRes.body.data.token;
    employerId = employerRes.body.data.user._id;

    // Register job seeker
    const jobSeekerRes = await request(app).post('/api/users/register').send({
      firstName: 'Jane',
      lastName: 'Worker',
      email: 'worker@test.com',
      password: 'password123',
      role: 'job_seeker',
    });

    jobSeekerToken = jobSeekerRes.body.data.token;
    jobSeekerId = jobSeekerRes.body.data.user._id;

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
  });

  describe('PUT /api/reviews/:id', () => {
    test('should update own review within 7 days', async () => {
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

      // Update user stats (normally done by hooks)
      await User.findByIdAndUpdate(employerId, {
        'ratingStats.averageRating': 4.5,
        'ratingStats.totalReviews': 2,
      });

      const res = await request(app).get(`/api/reviews/stats/${employerId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.stats).toHaveProperty('averageRating');
      expect(res.body.data.stats).toHaveProperty('totalReviews');
      expect(res.body.data.stats).toHaveProperty('trustScore');
      expect(res.body.data.stats).toHaveProperty('badge');
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
  });
});
