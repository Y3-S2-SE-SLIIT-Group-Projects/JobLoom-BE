import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import User from '../src/modules/users/user.model.js';
import Job from '../src/modules/jobs/job.model.js';

// Improve reliability for MongoDB SRV lookups on networks with unstable default DNS.
dns.setServers(['8.8.8.8', '8.8.4.4']);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index !== -1 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return undefined;
}

function getMongoUri() {
  const fromArg = getArgValue('--uri');
  return fromArg || process.env.MONGODB_URI;
}

function isRetryableConnectionError(error) {
  const retryableCodes = ['ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED'];
  const message = (error?.message || '').toLowerCase();

  return (
    retryableCodes.includes(error?.code) ||
    message.includes('enotfound') ||
    message.includes('eai_again') ||
    message.includes('getaddrinfo') ||
    message.includes('querysrv') ||
    message.includes('server selection timed out')
  );
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry(mongoUri, maxAttempts = 6) {
  let attempt = 0;
  let lastError;

  while (attempt < maxAttempts) {
    attempt += 1;

    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      return;
    } catch (error) {
      lastError = error;
      const shouldRetry = isRetryableConnectionError(error) && attempt < maxAttempts;

      console.error(`MongoDB connect attempt ${attempt}/${maxAttempts} failed: ${error.message}`);

      if (!shouldRetry) {
        throw error;
      }

      const delayMs = Math.min(15000, 1000 * 2 ** (attempt - 1));
      console.log(`Retrying in ${Math.round(delayMs / 1000)}s...`);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

async function findOrCreateUser(userData) {
  const existing = await User.findOne({ email: userData.email });
  if (existing) {
    return { user: existing, created: false };
  }

  const user = new User(userData);
  await user.save();
  return { user, created: true };
}

async function findOrCreateJob(jobData) {
  const existing = await Job.findOne({
    employerId: jobData.employerId,
    title: jobData.title,
  });

  if (existing) {
    return { job: existing, created: false };
  }

  const job = new Job(jobData);
  await job.save();
  return { job, created: true };
}

async function run() {
  const mongoUri = getMongoUri();

  if (!mongoUri) {
    console.error('MONGODB_URI is missing. Set it in .env or pass --uri "<mongo-uri>"');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await connectWithRetry(mongoUri);
    console.log('Connected.');

    const employerResult = await findOrCreateUser({
      firstName: 'Nimal',
      lastName: 'Perera',
      email: 'seed.employer.basic@jobloom.test',
      password: 'Test@1234',
      role: 'employer',
      phone: '+94770000001',
      location: {
        village: 'Maharagama',
        district: 'Colombo',
        province: 'Western',
      },
      companyName: 'Green Field Works',
      industry: 'agriculture',
      isVerified: true,
      isActive: true,
    });

    const seekerResult = await findOrCreateUser({
      firstName: 'Kasun',
      lastName: 'Silva',
      email: 'seed.seeker.basic@jobloom.test',
      password: 'Test@1234',
      role: 'job_seeker',
      phone: '+94770000002',
      location: {
        village: 'Boralesgamuwa',
        district: 'Colombo',
        province: 'Western',
      },
      skills: ['harvesting', 'packing'],
      isVerified: true,
      isActive: true,
    });

    const jobResult = await findOrCreateJob({
      employerId: employerResult.user._id,
      title: 'Farm Field Assistant',
      description:
        'Looking for a reliable field assistant for crop maintenance, harvesting support, and daily farm operations.',
      category: 'agriculture',
      jobRole: 'Field Assistant',
      employmentType: 'full-time',
      salaryType: 'monthly',
      salaryAmount: 60000,
      currency: 'LKR',
      location: {
        village: 'Homagama',
        district: 'Colombo',
        province: 'Western',
      },
      experienceRequired: 'beginner',
      positions: 2,
      status: 'open',
      isActive: true,
    });

    console.log('\nSeed complete:');
    console.log(
      `Employer: ${employerResult.user.email} (${employerResult.created ? 'created' : 'existing'}) | id=${employerResult.user._id}`
    );
    console.log(
      `Job seeker: ${seekerResult.user.email} (${seekerResult.created ? 'created' : 'existing'}) | id=${seekerResult.user._id}`
    );
    console.log(
      `Job: ${jobResult.job.title} (${jobResult.created ? 'created' : 'existing'}) | id=${jobResult.job._id}`
    );
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

run();
