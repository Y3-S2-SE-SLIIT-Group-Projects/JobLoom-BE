import { jest } from '@jest/globals';
import mongoose from 'mongoose';

const oid = () => new mongoose.Types.ObjectId();
const seekerId = oid();
const employerId = oid();
const applicationId = oid();

const withActiveChain = (value) => {
  const chain = {};
  chain.active = jest.fn().mockReturnValue(chain);
  chain.then = (resolve, reject) => Promise.resolve(value).then(resolve, reject);
  chain.catch = (fn) => Promise.resolve(value).catch(fn);
  return chain;
};

/** findById().active().populate('a').populate('b').populate('c') → doc */
const makeTriplePopulateChain = (doc) => {
  const chain = {};
  chain.active = jest.fn().mockReturnValue(chain);
  let pop = 0;
  chain.populate = jest.fn().mockImplementation(() => {
    pop += 1;
    if (pop >= 3) return Promise.resolve(doc);
    return chain;
  });
  return chain;
};

/** findById().active().populate([...]) → doc */
const makeArrayPopulateChain = (doc) => {
  const chain = {};
  chain.active = jest.fn().mockReturnValue(chain);
  chain.populate = jest.fn().mockResolvedValue(doc);
  return chain;
};

const mockApplicationModel = {
  findById: jest.fn(),
  updateOne: jest.fn(),
};

const mockJobModel = { findById: jest.fn() };

const sendInterviewScheduledEmail = jest.fn().mockResolvedValue({ sent: true });
const sendEmployerInterviewScheduledEmail = jest.fn().mockResolvedValue({ sent: true });
const sendInterviewCancelledEmail = jest.fn().mockResolvedValue({ sent: true });
const sendEmployerInterviewCancelledEmail = jest.fn().mockResolvedValue({ sent: true });
const sendApplicationDecisionEmail = jest.fn().mockResolvedValue({ sent: true });
const sendEmployerApplicationDecisionEmail = jest.fn().mockResolvedValue({ sent: true });

jest.unstable_mockModule('../../src/modules/applications/application.model.js', () => ({
  default: mockApplicationModel,
}));

jest.unstable_mockModule('../../src/modules/jobs/job.model.js', () => ({
  default: mockJobModel,
}));

jest.unstable_mockModule('../../src/services/email.service.js', () => ({
  sendInterviewScheduledEmail,
  sendEmployerInterviewScheduledEmail,
  sendInterviewCancelledEmail,
  sendEmployerInterviewCancelledEmail,
  sendApplicationDecisionEmail,
  sendEmployerApplicationDecisionEmail,
}));

const { scheduleInterview, getInterviewJoinContext, cancelInterview } =
  await import('../../src/modules/applications/application.service.js');

describe('Application service — interview (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApplicationModel.findById.mockReset();
    mockApplicationModel.updateOne.mockResolvedValue({ acknowledged: true, modifiedCount: 1 });
    // jest resetMocks restores jest.fn() to no implementation — restore promises
    sendInterviewScheduledEmail.mockResolvedValue({ sent: true });
    sendEmployerInterviewScheduledEmail.mockResolvedValue({ sent: true });
    sendInterviewCancelledEmail.mockResolvedValue({ sent: true });
    sendEmployerInterviewCancelledEmail.mockResolvedValue({ sent: true });
    sendApplicationDecisionEmail.mockResolvedValue({ sent: true });
    sendEmployerApplicationDecisionEmail.mockResolvedValue({ sent: true });
  });

  describe('scheduleInterview', () => {
    const futureIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const baseApp = (overrides = {}) => ({
      _id: applicationId,
      employerId,
      jobSeekerId: seekerId,
      status: 'shortlisted',
      jitsiRoomName: undefined,
      interviewDate: undefined,
      interviewType: undefined,
      interviewDuration: undefined,
      interviewLocation: undefined,
      interviewLocationNotes: undefined,
      save: jest.fn().mockResolvedValue(undefined),
      populate: jest.fn().mockImplementation(async function mockPop() {
        this.jobSeekerId = {
          _id: seekerId,
          firstName: 'Jane',
          lastName: 'Seeker',
          email: 'seeker@test.com',
        };
        this.jobId = { title: 'Test Role' };
        this.employerId = {
          _id: employerId,
          firstName: 'John',
          lastName: 'Employer',
          email: 'emp@test.com',
        };
        return this;
      }),
      ...overrides,
    });

    test('virtual: sets jitsiRoomName, clears location fields, sends email', async () => {
      const app = baseApp();
      mockApplicationModel.findById.mockImplementation(() => withActiveChain(app));

      const result = await scheduleInterview(applicationId, employerId, {
        interviewDate: futureIso,
        interviewType: 'virtual',
        interviewDuration: 45,
      });

      expect(app.interviewType).toBe('virtual');
      expect(app.interviewDuration).toBe(45);
      expect(app.jitsiRoomName).toMatch(/^jobloom-[0-9a-f]{8}-[0-9a-f]{32}$/);
      expect(app.interviewLocation).toBeUndefined();
      expect(app.interviewLocationNotes).toBeUndefined();
      expect(app.save).toHaveBeenCalled();
      expect(sendInterviewScheduledEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'seeker@test.com',
          interviewType: 'virtual',
          joinUrl: expect.stringContaining(`/interview/${applicationId}`),
        })
      );
      expect(sendEmployerInterviewScheduledEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'emp@test.com',
          seekerName: 'Jane Seeker',
          employerName: 'John Employer',
          interviewType: 'virtual',
        })
      );
      expect(result).toBe(app);
    });

    test('in_person: clears jitsiRoomName, sets location, sends email', async () => {
      const app = baseApp({ jitsiRoomName: 'old-room' });
      mockApplicationModel.findById.mockImplementation(() => withActiveChain(app));

      await scheduleInterview(applicationId, employerId, {
        interviewDate: futureIso,
        interviewType: 'in_person',
        interviewDuration: 30,
        interviewLocation: '123 Galle Rd',
        interviewLocationNotes: 'Floor 5',
      });

      expect(app.interviewType).toBe('in_person');
      expect(app.jitsiRoomName).toBeUndefined();
      expect(app.interviewLocation).toBe('123 Galle Rd');
      expect(app.interviewLocationNotes).toBe('Floor 5');
      expect(sendInterviewScheduledEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          interviewType: 'in_person',
          interviewLocation: '123 Galle Rd',
        })
      );
      expect(sendEmployerInterviewScheduledEmail).toHaveBeenCalledTimes(1);
    });

    test('throws 400 when interview date is in the past', async () => {
      const app = baseApp();
      mockApplicationModel.findById.mockImplementation(() => withActiveChain(app));

      await expect(
        scheduleInterview(applicationId, employerId, {
          interviewDate: new Date(Date.now() - 60_000).toISOString(),
          interviewType: 'virtual',
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Interview date must be in the future',
      });
    });

    test('throws 403 when requester is not the employer', async () => {
      const app = baseApp();
      mockApplicationModel.findById.mockImplementation(() => withActiveChain(app));

      await expect(
        scheduleInterview(applicationId, oid(), {
          interviewDate: futureIso,
          interviewType: 'virtual',
        })
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    test('throws 400 when application is in a final status', async () => {
      const app = baseApp({ status: 'accepted' });
      mockApplicationModel.findById.mockImplementation(() => withActiveChain(app));

      await expect(
        scheduleInterview(applicationId, employerId, {
          interviewDate: futureIso,
          interviewType: 'virtual',
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    test('throws 400 when application is not shortlisted', async () => {
      const app = baseApp({ status: 'reviewed' });
      mockApplicationModel.findById.mockImplementation(() => withActiveChain(app));

      await expect(
        scheduleInterview(applicationId, employerId, {
          interviewDate: futureIso,
          interviewType: 'virtual',
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringMatching(/shortlist/i),
      });
    });
  });

  describe('getInterviewJoinContext', () => {
    const populatedVirtualApp = {
      _id: applicationId,
      interviewDate: new Date(),
      interviewType: 'virtual',
      jitsiRoomName: 'jobloom-testroom',
      jobId: { title: 'Engineer' },
      jobSeekerId: { _id: seekerId, firstName: 'S', lastName: 'One' },
      employerId: { _id: employerId, firstName: 'E', lastName: 'Boss' },
    };

    test('returns domain, roomName, displayName, role for employer', async () => {
      mockApplicationModel.findById.mockReturnValue(makeTriplePopulateChain(populatedVirtualApp));

      const ctx = await getInterviewJoinContext(applicationId, employerId);

      expect(ctx.domain).toBe(process.env.JITSI_DOMAIN || 'meet.jit.si');
      expect(ctx.roomName).toBe('jobloom-testroom');
      expect(ctx.displayName).toBe('E Boss');
      expect(ctx.role).toBe('employer');
      expect(ctx.jobTitle).toBe('Engineer');
    });

    test('returns role job_seeker for applicant', async () => {
      mockApplicationModel.findById.mockReturnValue(makeTriplePopulateChain(populatedVirtualApp));
      const ctx = await getInterviewJoinContext(applicationId, seekerId);
      expect(ctx.role).toBe('job_seeker');
      expect(ctx.displayName).toBe('S One');
    });

    test('throws 403 for unrelated user', async () => {
      mockApplicationModel.findById.mockReturnValue(makeTriplePopulateChain(populatedVirtualApp));
      await expect(getInterviewJoinContext(applicationId, oid())).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    test('throws 400 for in-person interview', async () => {
      const app = {
        ...populatedVirtualApp,
        interviewType: 'in_person',
        jitsiRoomName: undefined,
      };
      mockApplicationModel.findById.mockReturnValue(makeTriplePopulateChain(app));
      await expect(getInterviewJoinContext(applicationId, seekerId)).rejects.toMatchObject({
        statusCode: 400,
        message: 'This is an in-person interview — no video room available',
      });
    });

    test('throws 400 when no interview scheduled', async () => {
      const app = {
        ...populatedVirtualApp,
        interviewDate: undefined,
        interviewType: undefined,
      };
      mockApplicationModel.findById.mockReturnValue(makeTriplePopulateChain(app));
      await expect(getInterviewJoinContext(applicationId, seekerId)).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining('No interview'),
      });
    });
  });

  describe('cancelInterview', () => {
    test('throws 400 when no interview is scheduled', async () => {
      const app = {
        _id: applicationId,
        employerId,
        interviewDate: undefined,
      };
      mockApplicationModel.findById.mockImplementation(() => withActiveChain(app));

      await expect(cancelInterview(applicationId, employerId)).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining('No interview'),
      });
    });

    test('throws 403 when requester is not the employer', async () => {
      const app = {
        employerId,
        interviewDate: new Date(),
      };
      mockApplicationModel.findById.mockImplementation(() => withActiveChain(app));

      await expect(cancelInterview(applicationId, oid())).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    test('unsets interview fields, reloads doc, sends cancellation email', async () => {
      const updated = {
        _id: applicationId,
        employerId: {
          _id: employerId,
          firstName: 'John',
          lastName: 'Employer',
          email: 'emp-cancel@test.com',
        },
        jobSeekerId: {
          _id: seekerId,
          firstName: 'J',
          lastName: 'S',
          email: 's@test.com',
        },
        jobId: { title: 'Role' },
        interviewDate: undefined,
        interviewType: undefined,
      };

      let findCall = 0;
      mockApplicationModel.findById.mockImplementation(() => {
        findCall += 1;
        if (findCall === 1) {
          return withActiveChain({
            _id: applicationId,
            employerId,
            interviewDate: new Date(),
            interviewType: 'virtual',
          });
        }
        return makeArrayPopulateChain(updated);
      });

      const out = await cancelInterview(applicationId, employerId);

      expect(mockApplicationModel.updateOne).toHaveBeenCalledWith(
        { _id: applicationId, isActive: true },
        {
          $unset: {
            interviewDate: '',
            interviewType: '',
            jitsiRoomName: '',
            interviewLocation: '',
            interviewLocationNotes: '',
            interviewDuration: '',
          },
        }
      );
      expect(sendInterviewCancelledEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 's@test.com',
          jobTitle: 'Role',
        })
      );
      expect(sendEmployerInterviewCancelledEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'emp-cancel@test.com',
          seekerName: 'J S',
          jobTitle: 'Role',
        })
      );
      expect(out).toBe(updated);
    });
  });
});
