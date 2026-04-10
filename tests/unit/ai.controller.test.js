import { jest } from '@jest/globals';

const mockAnalyzeSkillGap = jest.fn();
const mockSendSuccess = jest.fn();
const mockSendError = jest.fn();

jest.unstable_mockModule('../../src/modules/ai/ai.service.js', () => ({
  analyzeSkillGap: mockAnalyzeSkillGap,
}));

jest.unstable_mockModule('../../src/utils/response.utils.js', () => ({
  sendSuccess: mockSendSuccess,
  sendError: mockSendError,
}));

const { analyzeSkillGapController } = await import('../../src/modules/ai/ai.controller.js');

describe('AI Controller - Unit Tests', () => {
  const res = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 400 when jobId or cvId is missing', async () => {
    const req = {
      body: { jobId: 'job-1' },
      user: { _id: { toString: () => 'user-1' } },
    };

    await analyzeSkillGapController(req, res);

    expect(mockSendError).toHaveBeenCalledWith(res, 'jobId and cvId are required', 400);
    expect(mockAnalyzeSkillGap).not.toHaveBeenCalled();
  });

  test('should call service and return success response', async () => {
    const result = {
      matchScore: 80,
      missingSkills: ['Skill A'],
      recommendedSkills: ['Skill B'],
      summary: 'Test summary',
      language: 'en',
    };

    mockAnalyzeSkillGap.mockResolvedValue(result);

    const req = {
      body: { jobId: 'job-1', cvId: 'cv-1', language: 'si' },
      user: { _id: { toString: () => 'user-1' } },
    };

    await analyzeSkillGapController(req, res);

    expect(mockAnalyzeSkillGap).toHaveBeenCalledWith('job-1', 'cv-1', 'user-1', 'si');
    expect(mockSendSuccess).toHaveBeenCalledWith(res, 'Skill gap analysis completed', result);
  });

  test('should map service errors with explicit status', async () => {
    const err = new Error('CV not found');
    err.status = 404;
    mockAnalyzeSkillGap.mockRejectedValue(err);

    const req = {
      body: { jobId: 'job-1', cvId: 'cv-1' },
      user: { _id: { toString: () => 'user-1' } },
    };

    await analyzeSkillGapController(req, res);

    expect(mockSendError).toHaveBeenCalledWith(res, 'CV not found', 404);
  });

  test('should use fallback message and status 500 for unknown errors', async () => {
    mockAnalyzeSkillGap.mockRejectedValue({});

    const req = {
      body: { jobId: 'job-1', cvId: 'cv-1' },
      user: { _id: { toString: () => 'user-1' } },
    };

    await analyzeSkillGapController(req, res);

    expect(mockSendError).toHaveBeenCalledWith(res, 'Failed to analyze skill gap', 500);
  });
});
