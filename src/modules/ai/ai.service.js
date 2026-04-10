import Job from '../jobs/job.model.js';
import User from '../users/user.model.js';
import { generateCompletion } from '../../utils/llm.client.js';

/**
 * Analyze skill gap between a job posting and a candidate's CV.
 * Returns structured JSON with match score, missing/recommended skills, and summary.
 */
export async function analyzeSkillGap(jobId, cvId, userId) {
  const job = await Job.findById(jobId);
  if (!job) {
    const err = new Error('Job not found');
    err.status = 404;
    throw err;
  }

  const user = await User.findById(userId).select('cvs');
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const cv = user.cvs.id(cvId);
  if (!cv) {
    const err = new Error('CV not found');
    err.status = 404;
    throw err;
  }

  const skillsList = job.skillsRequired?.length
    ? `\nRequired Skills: ${job.skillsRequired.join(', ')}`
    : '';

  const prompt = `Compare the following job posting and candidate CV.

JOB:
Title: ${job.title}
Role: ${job.jobRole || job.title}
Category: ${job.category || 'N/A'}
Experience Level: ${job.experienceRequired || 'none'}${skillsList}
Description: ${job.description}

CV:
Name: ${cv.name}
URL: ${cv.url}

Based on the job requirements and the CV file name and context, provide a skill gap analysis.

Return ONLY valid JSON with no additional text, in this exact structure:
{
  "matchScore": <number 0-100>,
  "missingSkills": [<string>, ...],
  "recommendedSkills": [<string>, ...],
  "summary": "<2-3 sentence summary>"
}

Rules:
- matchScore is an integer from 0 to 100
- missingSkills are skills the job requires but the CV likely lacks
- recommendedSkills are additional skills that would strengthen the candidate
- summary should be concise and actionable
- Respond ONLY with the JSON object, no markdown fences or extra text`;

  const raw = await generateCompletion(prompt, {
    max_tokens: 800,
    temperature: 0.3,
    timeout: 45_000,
  });

  try {
    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    const result = JSON.parse(cleaned);

    return {
      matchScore: Number(result.matchScore) || 0,
      missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills : [],
      recommendedSkills: Array.isArray(result.recommendedSkills) ? result.recommendedSkills : [],
      summary: result.summary || '',
    };
  } catch {
    const err = new Error('AI returned an invalid response. Please try again.');
    err.status = 502;
    throw err;
  }
}
