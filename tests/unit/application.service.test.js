import { jest } from '@jest/globals';
import mongoose from 'mongoose';

/**
 * Unit Tests for Application Service
 * Tests business logic with mocked Mongoose models
 */

// ── Helpers ──────────────────────────────────────────────────────────
const oid = () => new mongoose.Types.ObjectId();

// Fixed IDs reused across tests
const seekerId = oid();
const employerId = oid();
const jobId = oid();
const applicationId = oid();

// ── Mock factories ───────────────────────────────────────────────────

/** Build a fake Job document returned by Job.findById */
const makeJob = (overrides = {}) => ({
  _id: jobId,
  title: 'Node.js Developer',
  status: 'open',
  employerId,
  ...overrides,
});

/** Build a fake Application document with save / populate stubs */
const makeApplication = (overrides = {}) => {
  const app = {
    _id: applicationId,
    jobId,
    jobSeekerId: seekerId,
    employerId,
    status: 'pending',
    isActive: true,
    statusHistory: [],
    save: jest.fn().mockResolvedValue(undefined),
    populate: jest.fn().mockResolvedValue(undefined),
    toObject: jest.fn().mockReturnValue({
      _id: applicationId,
      jobId,
      jobSeekerId: { _id: seekerId },
      employerId: { _id: employerId },
      status: 'pending',
      isActive: true,
    }),
    ...overrides,
  };
  return app;
};

// ── Module-level mocks ───────────────────────────────────────────────
// We must use unstable_mockModule because the project is ESM.

const mockApplicationModel = {
  create: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
};

const mockJobModel = {
  findById: jest.fn(),
};

jest.unstable_mockModule('../../src/modules/applications/application.model.js', () => ({
  default: mockApplicationModel,
}));

jest.unstable_mockModule('../../src/modules/jobs/job.model.js', () => ({
  default: mockJobModel,
}));

// Import service AFTER mocks are registered
const {
  applyForJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
} = await import('../../src/modules/applications/application.service.js');

// ── Test suites ──────────────────────────────────────────────────────

describe('Application Service — Unit Tests', () => {
  // ────────────────────────────────────────────────────────────────────
  // applyForJob
  // ────────────────────────────────────────────────────────────────────
  describe('applyForJob', () => {
    test('should create an application successfully', async () => {
      const job = makeJob();
      mockJobModel.findById.mockResolvedValue(job);

      const createdApp = makeApplication();
      mockApplicationModel.create.mockResolvedValue(createdApp);

      const result = await applyForJob(seekerId, {
        jobId,
        coverLetter: 'I am a great fit',
        resumeUrl: 'https://example.com/resume.pdf',
      });

      expect(mockJobModel.findById).toHaveBeenCalledWith(jobId);
      expect(mockApplicationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId,
          jobSeekerId: seekerId,
          employerId: job.employerId,
          status: 'pending',
        })
      );
      expect(createdApp.populate).toHaveBeenCalled();
      expect(result).toBe(createdApp);
    });

    test('should throw 404 when job is not found', async () => {
      mockJobModel.findById.mockResolvedValue(null);

      await expect(applyForJob(seekerId, { jobId: oid() })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Job not found',
      });
    });

    test('should throw 400 when job is not open', async () => {
      mockJobModel.findById.mockResolvedValue(makeJob({ status: 'closed' }));

      await expect(applyForJob(seekerId, { jobId })).rejects.toMatchObject({
        statusCode: 400,
        message: 'This job is no longer accepting applications',
      });
    });

    test('should throw 409 on duplicate application', async () => {
      mockJobModel.findById.mockResolvedValue(makeJob());

      const duplicateError = new Error('Duplicate');
      duplicateError.code = 11000;
      mockApplicationModel.create.mockRejectedValue(duplicateError);

      await expect(applyForJob(seekerId, { jobId })).rejects.toMatchObject({
        statusCode: 409,
        message: 'You have already applied for this job',
      });
    });

    test('should throw 400 when seeker is the employer', async () => {
      // The seeker ID matches the job's employerId
      mockJobModel.findById.mockResolvedValue(makeJob({ employerId: seekerId }));

      await expect(applyForJob(seekerId, { jobId })).rejects.toMatchObject({
        statusCode: 400,
        message: 'You cannot apply to your own job posting',
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // withdrawApplication
  // ────────────────────────────────────────────────────────────────────
  describe('withdrawApplication', () => {
    test('should withdraw a pending application successfully', async () => {
      const app = makeApplication({ status: 'pending' });
      mockApplicationModel.findById.mockResolvedValue(app);

      const result = await withdrawApplication(applicationId, seekerId, 'Found another job');

      expect(app.status).toBe('withdrawn');
      expect(app.withdrawalReason).toBe('Found another job');
      expect(app.save).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Application withdrawn successfully' });
    });

    test('should throw 403 when requester is not the applicant', async () => {
      const app = makeApplication({ status: 'pending' });
      mockApplicationModel.findById.mockResolvedValue(app);

      const otherUser = oid();

      await expect(withdrawApplication(applicationId, otherUser)).rejects.toMatchObject({
        statusCode: 403,
        message: 'You are not authorized to withdraw this application',
      });
    });

    test('should throw 400 when application is already accepted', async () => {
      const app = makeApplication({ status: 'accepted' });
      mockApplicationModel.findById.mockResolvedValue(app);

      await expect(withdrawApplication(applicationId, seekerId)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    test('should throw 400 when application is already rejected', async () => {
      const app = makeApplication({ status: 'rejected' });
      mockApplicationModel.findById.mockResolvedValue(app);

      await expect(withdrawApplication(applicationId, seekerId)).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // updateApplicationStatus
  // ────────────────────────────────────────────────────────────────────
  describe('updateApplicationStatus', () => {
    test.each([
      ['pending', 'reviewed'],
      ['pending', 'shortlisted'],
      ['pending', 'accepted'],
      ['pending', 'rejected'],
      ['reviewed', 'shortlisted'],
      ['reviewed', 'accepted'],
      ['reviewed', 'rejected'],
      ['shortlisted', 'accepted'],
      ['shortlisted', 'rejected'],
    ])('should allow valid transition from %s → %s', async (from, to) => {
      const app = makeApplication({ status: from });
      mockApplicationModel.findById.mockResolvedValue(app);

      const result = await updateApplicationStatus(applicationId, employerId, to);

      expect(app.status).toBe(to);
      expect(app.save).toHaveBeenCalled();
      expect(app.populate).toHaveBeenCalled();
      expect(result).toBe(app);
    });

    test.each([
      ['accepted', 'pending'],
      ['accepted', 'reviewed'],
      ['rejected', 'pending'],
      ['rejected', 'accepted'],
      ['withdrawn', 'pending'],
    ])('should reject invalid transition from %s → %s', async (from, to) => {
      const app = makeApplication({ status: from });
      mockApplicationModel.findById.mockResolvedValue(app);

      await expect(updateApplicationStatus(applicationId, employerId, to)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    test('should throw 403 when requester is not the employer', async () => {
      const app = makeApplication({ status: 'pending' });
      mockApplicationModel.findById.mockResolvedValue(app);

      const otherUser = oid();

      await expect(
        updateApplicationStatus(applicationId, otherUser, 'reviewed')
      ).rejects.toMatchObject({
        statusCode: 403,
        message: 'You are not authorized to update this application',
      });
    });

    test('should set reviewedAt on first review', async () => {
      const app = makeApplication({ status: 'pending', reviewedAt: undefined });
      mockApplicationModel.findById.mockResolvedValue(app);

      await updateApplicationStatus(applicationId, employerId, 'reviewed');

      expect(app.reviewedAt).toBeInstanceOf(Date);
    });

    test('should save employerNotes when provided', async () => {
      const app = makeApplication({ status: 'pending' });
      mockApplicationModel.findById.mockResolvedValue(app);

      await updateApplicationStatus(applicationId, employerId, 'reviewed', 'Great candidate');

      expect(app.employerNotes).toBe('Great candidate');
    });

    test('should throw 404 when application is not found', async () => {
      mockApplicationModel.findById.mockResolvedValue(null);

      await expect(
        updateApplicationStatus(applicationId, employerId, 'reviewed')
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // getMyApplications
  // ────────────────────────────────────────────────────────────────────
  describe('getMyApplications', () => {
    test('should return paginated applications with defaults', async () => {
      const apps = [makeApplication(), makeApplication({ _id: oid() })];

      // Build a fluent query chain mock
      const chainMock = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(apps),
      };

      mockApplicationModel.find.mockReturnValue(chainMock);
      mockApplicationModel.countDocuments.mockResolvedValue(2);

      const result = await getMyApplications(seekerId);

      expect(mockApplicationModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ jobSeekerId: seekerId, isActive: true })
      );
      expect(chainMock.skip).toHaveBeenCalledWith(0); // page 1
      expect(chainMock.limit).toHaveBeenCalledWith(20); // default limit
      expect(result.applications).toHaveLength(2);
      expect(result.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 20,
        pages: 1,
      });
    });

    test('should apply status filter when provided', async () => {
      const chainMock = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      mockApplicationModel.find.mockReturnValue(chainMock);
      mockApplicationModel.countDocuments.mockResolvedValue(0);

      await getMyApplications(seekerId, { status: 'pending', page: 2, limit: 5 });

      expect(mockApplicationModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
      expect(chainMock.skip).toHaveBeenCalledWith(5); // (page 2 - 1) * 5
      expect(chainMock.limit).toHaveBeenCalledWith(5);
    });

    test('should calculate correct number of pages', async () => {
      const chainMock = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      mockApplicationModel.find.mockReturnValue(chainMock);
      mockApplicationModel.countDocuments.mockResolvedValue(23);

      const result = await getMyApplications(seekerId, { page: 1, limit: 10 });

      expect(result.pagination.pages).toBe(3); // ceil(23/10)
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // getJobApplications
  // ────────────────────────────────────────────────────────────────────
  describe('getJobApplications', () => {
    test('should return applications when employer owns the job', async () => {
      mockJobModel.findById.mockResolvedValue(makeJob());

      const apps = [makeApplication()];
      const chainMock = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(apps),
      };

      mockApplicationModel.find.mockReturnValue(chainMock);
      mockApplicationModel.countDocuments.mockResolvedValue(1);

      const result = await getJobApplications(jobId, employerId);

      expect(result.applications).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    test('should throw 403 when requester is not the job employer', async () => {
      mockJobModel.findById.mockResolvedValue(makeJob());

      const otherUser = oid();

      await expect(getJobApplications(jobId, otherUser)).rejects.toMatchObject({
        statusCode: 403,
        message: 'You are not authorized to view applications for this job',
      });
    });

    test('should throw 404 when job does not exist', async () => {
      mockJobModel.findById.mockResolvedValue(null);

      await expect(getJobApplications(oid(), employerId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Job not found',
      });
    });
  });
});
