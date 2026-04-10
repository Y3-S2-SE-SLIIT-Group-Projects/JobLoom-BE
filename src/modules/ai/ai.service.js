import Job from '../jobs/job.model.js';
import User from '../users/user.model.js';
import { generateCompletion } from '../../utils/llm.client.js';

const SUPPORTED_OUTPUT_LANGUAGES = {
  en: 'English',
  si: 'Sinhala',
  ta: 'Tamil',
};

const LANGUAGE_SCRIPT_REGEX = {
  si: /[\u0D80-\u0DFF]/,
  ta: /[\u0B80-\u0BFF]/,
};

function normalizeLanguage(inputLanguage) {
  if (!inputLanguage || typeof inputLanguage !== 'string') return 'en';
  const base = inputLanguage.toLowerCase().split('-')[0];
  return SUPPORTED_OUTPUT_LANGUAGES[base] ? base : 'en';
}

function looksLocalized(text, language) {
  if (!text || typeof text !== 'string') return false;
  if (language === 'en') return true;
  const scriptRegex = LANGUAGE_SCRIPT_REGEX[language];
  return scriptRegex ? scriptRegex.test(text) : true;
}

function getLocalizedRatio(items, language) {
  if (!Array.isArray(items) || items.length === 0) return 1;
  const localizedCount = items.filter((item) => looksLocalized(item, language)).length;
  return localizedCount / items.length;
}

function isResultLocalized(result, language) {
  if (language === 'en') return true;

  const summaryOk = looksLocalized(result.summary, language);
  const missingRatio = getLocalizedRatio(result.missingSkills, language);
  const recommendedRatio = getLocalizedRatio(result.recommendedSkills, language);

  // Require summary and most skill labels in the requested script.
  return summaryOk && missingRatio >= 0.8 && recommendedRatio >= 0.8;
}

function buildTranslationPrompt(result, languageName, strict = false) {
  console.log('result', result);
  const strictRules = strict
    ? `
- IMPORTANT: Every summary sentence MUST be in ${languageName}
- IMPORTANT: Every skill label MUST be in ${languageName} (do not keep English-only labels)
`
    : '';

  return `Translate ALL text values in the following JSON into ${languageName}. Every single string must be rewritten in ${languageName} script.

Return ONLY valid JSON:
{
  "missingSkills": [<string>, ...],
  "recommendedSkills": [<string>, ...],
  "summary": "<string>"
}

Rules:
- Translate EVERY string value into ${languageName} — do NOT leave any value in English
- If a technical term has no direct translation, transliterate it into ${languageName} script${strictRules}
- Respond ONLY with JSON, no markdown fences

Input JSON:
${JSON.stringify(
  {
    missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills : [],
    recommendedSkills: Array.isArray(result.recommendedSkills) ? result.recommendedSkills : [],
    summary: result.summary || '',
  },
  null,
  2
)}`;
}

function repairTruncatedJson(text) {
  let fixed = text;

  const openBraces = (fixed.match(/{/g) || []).length;
  const closeBraces = (fixed.match(/}/g) || []).length;
  const openBrackets = (fixed.match(/\[/g) || []).length;
  const closeBrackets = (fixed.match(/]/g) || []).length;

  const inString = (fixed.match(/"/g) || []).length % 2 !== 0;
  if (inString) fixed += '"';

  for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += ']';
  for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}';

  return fixed;
}

async function localizeAnalysisResult(result, language, languageName) {
  if (language === 'en') return result;

  if (isResultLocalized(result, language)) return result;

  let current = result;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const translationPrompt = buildTranslationPrompt(current, languageName, attempt === 1);

    try {
      const localizedRaw = await generateCompletion(translationPrompt, {
        max_tokens: 1500,
        temperature: 0.05,
        timeout: 60_000,
      });

      const cleaned = localizedRaw
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      const localized = JSON.parse(cleaned);
      current = {
        ...current,
        missingSkills: Array.isArray(localized.missingSkills)
          ? localized.missingSkills
          : current.missingSkills,
        recommendedSkills: Array.isArray(localized.recommendedSkills)
          ? localized.recommendedSkills
          : current.recommendedSkills,
        summary: localized.summary || current.summary,
      };

      if (isResultLocalized(current, language)) {
        return current;
      }
    } catch {
      // Try one more strict translation pass.
    }
  }

  return current;
}

/**
 * Analyze skill gap between a job posting and a candidate's CV.
 * Returns structured JSON with match score, missing/recommended skills, and summary.
 */
export async function analyzeSkillGap(jobId, cvId, userId, language = 'en') {
  const responseLanguage = normalizeLanguage(language);
  const responseLanguageName = SUPPORTED_OUTPUT_LANGUAGES[responseLanguage];

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

  const languageInstruction =
    responseLanguage === 'en'
      ? ''
      : `

CRITICAL LANGUAGE REQUIREMENT:
You MUST write ALL output text in ${responseLanguageName} (language code: ${responseLanguage}).
This applies to EVERY string value: summary, every skill in missingSkills, and every skill in recommendedSkills.
Do NOT write any of these values in English. Use ${responseLanguageName} script only.
If a technical term has no ${responseLanguageName} equivalent, transliterate it into ${responseLanguageName} script.`;

  const prompt = `You are a career analyst. Analyze the skill gap between a job posting and a candidate CV.${languageInstruction}

JOB:
Title: ${job.title}
Role: ${job.jobRole || job.title}
Category: ${job.category || 'N/A'}
Experience Level: ${job.experienceRequired || 'none'}${skillsList}
Description: ${job.description}

CV:
Name: ${cv.name}
URL: ${cv.url}

Return ONLY valid JSON, no markdown fences or extra text:
{
  "matchScore": <number 0-100>,
  "missingSkills": [<string>, ...],
  "recommendedSkills": [<string>, ...],
  "summary": "<2-3 sentence summary>"
}

Rules:
- matchScore is an integer from 0 to 100
- missingSkills: skills the job requires but the CV likely lacks
- recommendedSkills: additional skills that would strengthen the candidate
- summary: concise and actionable${responseLanguage !== 'en' ? `\n- EVERY string value (summary, each skill name) MUST be written in ${responseLanguageName}. No English.` : ''}`;

  let raw;
  try {
    raw = await generateCompletion(prompt, {
      max_tokens: 1500,
      temperature: 0.3,
      timeout: 60_000,
    });
  } catch (aiErr) {
    console.error('[Skill Gap Analysis] AI call failed:', aiErr.message);
    const err = new Error('AI service unavailable. Please try again later.');
    err.status = 503;
    throw err;
  }

  console.log('[Skill Gap Analysis] Raw AI response:', raw);

  try {
    let cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      cleaned = repairTruncatedJson(cleaned);
      result = JSON.parse(cleaned);
    }

    const normalizedResult = {
      matchScore: Number(result.matchScore) || 0,
      missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills : [],
      recommendedSkills: Array.isArray(result.recommendedSkills) ? result.recommendedSkills : [],
      summary: result.summary || '',
      language: responseLanguage,
    };

    const finalResult = await localizeAnalysisResult(
      normalizedResult,
      responseLanguage,
      responseLanguageName
    );
    console.log('[Skill Gap Analysis] Final result:', finalResult);
    return finalResult;
  } catch (parseErr) {
    console.error('[Skill Gap Analysis] Failed to parse AI response:', parseErr.message);
    const err = new Error('AI returned an invalid response. Please try again.');
    err.status = 502;
    throw err;
  }
}
