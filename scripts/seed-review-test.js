/**
 * Seed script — Review module test data
 * Inserts: 1 employer + 1 job seeker (verified), 2 jobs, 2 accepted applications
 * Outputs:  postman/jobLoom-review-seeded.postman_collection.json  (hardcoded IDs + tokens)
 *
 * Usage:  node scripts/seed-review-test.js
 */

// ── Force Google DNS first — local ISP DNS doesn't support MongoDB SRV lookups ──
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// ─── config ───────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_TTL = process.env.JWT_EXPIRES_IN || '7d';
const PORT = process.env.PORT || 3008;
const BASE_URL = `http://localhost:${PORT}/api`;
const OUT_FILE = path.join(__dirname, '../postman/jobLoom-review-seeded.postman_collection.json');

if (!MONGO_URI) {
  console.error('MONGODB_URI missing in .env');
  process.exit(1);
}

// ─── inline schemas (avoids importing source files with side-effects) ─────────
const { Schema, model, connect, disconnect } = mongoose;

const userSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
    role: String,
    phone: String,
    location: { village: String, district: String, province: String },
    isVerified: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    skills: { type: [String], default: [] },
  },
  { timestamps: true }
);
const User = model('User', userSchema);

const jobSchema = new Schema(
  {
    employerId: Schema.Types.ObjectId,
    title: String,
    description: String,
    category: String,
    jobRole: String,
    employmentType: String,
    salaryType: String,
    salaryAmount: Number,
    currency: { type: String, default: 'LKR' },
    location: { village: String, district: String, province: String },
    experienceRequired: { type: String, default: 'none' },
    positions: { type: Number, default: 1 },
    status: { type: String, default: 'open' },
  },
  { timestamps: true }
);
const Job = model('Job', jobSchema);

const appSchema = new Schema(
  {
    jobId: Schema.Types.ObjectId,
    jobSeekerId: Schema.Types.ObjectId,
    employerId: Schema.Types.ObjectId,
    coverLetter: String,
    status: { type: String, default: 'pending' },
    statusHistory: [{ status: String, changedAt: Date, changedBy: Schema.Types.ObjectId }],
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
const Application = model('Application', appSchema);

// ─── helpers ──────────────────────────────────────────────────────────────────
const genToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_TTL });
const hash = (pw) => bcrypt.hash(pw, 10);

// ─── seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('Connecting to MongoDB Atlas (via Google DNS)...');
  await connect(MONGO_URI);
  console.log('Connected.\n');

  // ── 1. Users ─────────────────────────────────────────────────────────────
  await User.deleteOne({ email: 'seed.employer@jobloom.test' });
  await User.deleteOne({ email: 'seed.seeker@jobloom.test' });

  const employer = await User.create({
    firstName: 'Alice',
    lastName: 'Employer',
    email: 'seed.employer@jobloom.test',
    password: await hash('Test1234'),
    role: 'employer',
    phone: '+94711111111',
    location: { village: 'Kaduwela', district: 'Colombo', province: 'Western' },
    isVerified: true,
    isActive: true,
  });

  const seeker = await User.create({
    firstName: 'Bob',
    lastName: 'Seeker',
    email: 'seed.seeker@jobloom.test',
    password: await hash('Test1234'),
    role: 'job_seeker',
    phone: '+94722222222',
    location: { village: 'Nugegoda', district: 'Colombo', province: 'Western' },
    isVerified: true,
    isActive: true,
  });

  const employerToken = genToken(employer._id);
  const seekerToken = genToken(seeker._id);

  console.log('✅ Users created');
  console.log('   Employer ID :', employer._id.toString());
  console.log('   JobSeeker ID:', seeker._id.toString());

  // ── 2. Jobs ───────────────────────────────────────────────────────────────
  await Job.deleteMany({ employerId: employer._id });

  const job1 = await Job.create({
    employerId: employer._id,
    title: 'Paddy Field Harvester',
    description:
      'We need experienced paddy field harvesters for the upcoming season. Must be physically fit and able to work long hours in the field.',
    category: 'agriculture',
    jobRole: 'Harvester',
    employmentType: 'seasonal',
    salaryType: 'daily',
    salaryAmount: 1500,
    currency: 'LKR',
    location: { village: 'Polonnaruwa', district: 'Polonnaruwa', province: 'North Central' },
    experienceRequired: 'beginner',
    positions: 5,
    status: 'open',
  });

  const job2 = await Job.create({
    employerId: employer._id,
    title: 'Construction Site Helper',
    description:
      'Looking for construction site helpers to assist with brick laying, material carrying, and general site work. No prior experience needed but must be reliable.',
    category: 'construction',
    jobRole: 'Site Helper',
    employmentType: 'temporary',
    salaryType: 'daily',
    salaryAmount: 2000,
    currency: 'LKR',
    location: { village: 'Kandy', district: 'Kandy', province: 'Central' },
    experienceRequired: 'none',
    positions: 3,
    status: 'open',
  });

  console.log('\n✅ Jobs created');
  console.log('   Job 1 ID:', job1._id.toString());
  console.log('   Job 2 ID:', job2._id.toString());

  // ── 3. Applications (status: accepted) ───────────────────────────────────
  await Application.deleteMany({
    jobSeekerId: seeker._id,
    jobId: { $in: [job1._id, job2._id] },
  });

  const app1 = await Application.create({
    jobId: job1._id,
    jobSeekerId: seeker._id,
    employerId: employer._id,
    coverLetter: 'I have 3 years of experience in paddy field harvesting.',
    status: 'accepted',
    statusHistory: [
      { status: 'pending', changedAt: new Date(), changedBy: seeker._id },
      { status: 'accepted', changedAt: new Date(), changedBy: employer._id },
    ],
  });

  const app2 = await Application.create({
    jobId: job2._id,
    jobSeekerId: seeker._id,
    employerId: employer._id,
    coverLetter: 'I am physically fit and available immediately for construction work.',
    status: 'accepted',
    statusHistory: [
      { status: 'pending', changedAt: new Date(), changedBy: seeker._id },
      { status: 'accepted', changedAt: new Date(), changedBy: employer._id },
    ],
  });

  console.log('\n✅ Applications created (status: accepted)');
  console.log('   App 1 ID:', app1._id.toString());
  console.log('   App 2 ID:', app2._id.toString());

  // ── 4. Build Postman collection ───────────────────────────────────────────
  const IDS = {
    employerId: employer._id.toString(),
    jobSeekerId: seeker._id.toString(),
    job1Id: job1._id.toString(),
    job2Id: job2._id.toString(),
    app1Id: app1._id.toString(),
    app2Id: app2._id.toString(),
    employerToken,
    seekerToken,
  };

  const collection = buildCollection(IDS);
  fs.writeFileSync(OUT_FILE, JSON.stringify(collection, null, 2));

  console.log('\n✅ Postman collection written to:');
  console.log('  ', OUT_FILE);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  baseUrl      :', BASE_URL);
  console.log('  employerId   :', IDS.employerId);
  console.log('  jobSeekerId  :', IDS.jobSeekerId);
  console.log('  job1Id       :', IDS.job1Id);
  console.log('  job2Id       :', IDS.job2Id);
  console.log('  app1Id       :', IDS.app1Id);
  console.log('  app2Id       :', IDS.app2Id);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nImport postman/jobLoom-review-seeded.postman_collection.json');
  console.log('Then go straight to section 2 — Create Reviews.');

  await disconnect();
}

// ─── Postman collection builder ───────────────────────────────────────────────
function buildCollection({ employerId, jobSeekerId, job1Id, job2Id, employerToken, seekerToken }) {
  const A_EMP = [{ key: 'Authorization', value: `Bearer ${employerToken}` }];
  const A_SEEK = [{ key: 'Authorization', value: `Bearer ${seekerToken}` }];
  const JSON_H = [{ key: 'Content-Type', value: 'application/json' }];
  const U = (raw) => ({ raw });
  const body = (obj) => ({ mode: 'raw', raw: JSON.stringify(obj, null, 2) });

  const testScript = (lines) => ({
    listen: 'test',
    script: { type: 'text/javascript', exec: lines },
  });

  const saveId = (varName) =>
    testScript([
      `pm.test('201 created', () => pm.response.to.have.status(201));`,
      `if (pm.response.code === 201) {`,
      `  const b = pm.response.json();`,
      `  const id = b.data?.review?._id || b.data?._id || b._id;`,
      `  pm.collectionVariables.set('${varName}', id);`,
      `  console.log('${varName}:', id);`,
      `}`,
    ]);

  return {
    info: {
      name: 'JobLoom — Review Module (Seeded)',
      description: [
        'All IDs and JWT tokens are hardcoded from the seed script.',
        `base: ${BASE_URL}`,
        '',
        'Logins (seed users):',
        '  employer : seed.employer@jobloom.test / Test1234',
        '  seeker   : seed.seeker@jobloom.test  / Test1234',
        '',
        'Applications are already status=accepted — reviews work immediately.',
        'JWT tokens expire in 7 days. Re-run seed script to refresh.',
        '',
        'Run order: 0 (verify data) → 2 (create reviews) → 3 (read) → 4 (manage) → 5 (errors)',
      ].join('\n'),
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      { key: 'review1Id', value: '', type: 'string' },
      { key: 'review2Id', value: '', type: 'string' },
    ],
    item: [
      // ── 0: Verify seeded data ─────────────────────────────────────────────
      {
        name: '0 — Verify Seeded Data',
        description: 'Confirm all seed records exist before testing reviews.',
        item: [
          {
            name: `0.1 Health Check`,
            request: { method: 'GET', header: [], url: U(`http://localhost:${PORT}/health`) },
          },
          {
            name: '0.2 Get Job 1 (agriculture)',
            request: { method: 'GET', header: [], url: U(`${BASE_URL}/jobs/${job1Id}`) },
          },
          {
            name: '0.3 Get Job 2 (construction)',
            request: { method: 'GET', header: [], url: U(`${BASE_URL}/jobs/${job2Id}`) },
          },
          {
            name: '0.4 Check Application Eligibility — Job 1',
            request: {
              method: 'GET',
              header: [],
              url: U(`${BASE_URL}/applications/check/${job1Id}/${jobSeekerId}`),
              description: 'Expect hasAcceptedApplication: true',
            },
          },
          {
            name: '0.5 Check Application Eligibility — Job 2',
            request: {
              method: 'GET',
              header: [],
              url: U(`${BASE_URL}/applications/check/${job2Id}/${jobSeekerId}`),
              description: 'Expect hasAcceptedApplication: true',
            },
          },
          {
            name: '0.6 Get Employer Profile',
            request: {
              method: 'GET',
              header: A_EMP,
              url: U(`${BASE_URL}/users/profile/${employerId}`),
            },
          },
          {
            name: '0.7 Get Job Seeker Profile',
            request: {
              method: 'GET',
              header: A_SEEK,
              url: U(`${BASE_URL}/users/profile/${jobSeekerId}`),
            },
          },
        ],
      },

      // ── 1: Login (for fresh tokens) ───────────────────────────────────────
      {
        name: '1 — Login (use if tokens expire)',
        description:
          'Tokens are already embedded in all requests. Use these only if the 7-day JWT expires.',
        item: [
          {
            name: '1.1 Login Employer',
            event: [
              testScript([
                `pm.test('200 login', () => pm.response.to.have.status(200));`,
                `if (pm.response.code===200) { const b=pm.response.json(); pm.collectionVariables.set('employerToken', b.token); }`,
              ]),
            ],
            request: {
              method: 'POST',
              header: JSON_H,
              body: body({ email: 'seed.employer@jobloom.test', password: 'Test1234' }),
              url: U(`${BASE_URL}/users/login`),
            },
          },
          {
            name: '1.2 Login Job Seeker',
            event: [
              testScript([
                `pm.test('200 login', () => pm.response.to.have.status(200));`,
                `if (pm.response.code===200) { const b=pm.response.json(); pm.collectionVariables.set('seekerToken', b.token); }`,
              ]),
            ],
            request: {
              method: 'POST',
              header: JSON_H,
              body: body({ email: 'seed.seeker@jobloom.test', password: 'Test1234' }),
              url: U(`${BASE_URL}/users/login`),
            },
          },
        ],
      },

      // ── 2: Create Reviews ─────────────────────────────────────────────────
      {
        name: '2 — Create Reviews ← START HERE',
        description: '4 reviews: both users × both jobs. All applications are pre-accepted.',
        item: [
          {
            name: '2.1 Job Seeker → Employer (Job 1) ★★★★★',
            event: [saveId('review1Id')],
            request: {
              method: 'POST',
              header: [...A_SEEK, ...JSON_H],
              body: body({
                revieweeId: employerId,
                jobId: job1Id,
                reviewerType: 'job_seeker',
                rating: 5,
                comment:
                  'Excellent employer! Paid on time, great working conditions and very communicative throughout.',
                workQuality: 5,
                communication: 5,
                punctuality: 5,
                paymentOnTime: 5,
                wouldRecommend: true,
              }),
              url: U(`${BASE_URL}/reviews`),
              description: `reviewer: ${jobSeekerId} (seeker)\nreviewee: ${employerId} (employer)\njob: ${job1Id}`,
            },
          },
          {
            name: '2.2 Employer → Job Seeker (Job 1) ★★★★',
            event: [saveId('review2Id')],
            request: {
              method: 'POST',
              header: [...A_EMP, ...JSON_H],
              body: body({
                revieweeId: jobSeekerId,
                jobId: job1Id,
                reviewerType: 'employer',
                rating: 4,
                comment: 'Hard worker, showed up on time every day. Would hire again.',
                workQuality: 4,
                communication: 4,
                punctuality: 5,
                wouldRecommend: true,
              }),
              url: U(`${BASE_URL}/reviews`),
              description: `reviewer: ${employerId} (employer)\nreviewee: ${jobSeekerId} (seeker)\njob: ${job1Id}`,
            },
          },
          {
            name: '2.3 Job Seeker → Employer (Job 2) ★★★★',
            event: [testScript([`pm.test('201 created', () => pm.response.to.have.status(201));`])],
            request: {
              method: 'POST',
              header: [...A_SEEK, ...JSON_H],
              body: body({
                revieweeId: employerId,
                jobId: job2Id,
                reviewerType: 'job_seeker',
                rating: 4,
                comment:
                  'Good employer. Site organized, safety equipment provided. Payment slightly delayed but resolved.',
                workQuality: 4,
                communication: 4,
                punctuality: 4,
                paymentOnTime: 3,
                wouldRecommend: true,
              }),
              url: U(`${BASE_URL}/reviews`),
            },
          },
          {
            name: '2.4 Employer → Job Seeker (Job 2) ★★★',
            event: [testScript([`pm.test('201 created', () => pm.response.to.have.status(201));`])],
            request: {
              method: 'POST',
              header: [...A_EMP, ...JSON_H],
              body: body({
                revieweeId: jobSeekerId,
                jobId: job2Id,
                reviewerType: 'employer',
                rating: 3,
                comment: 'Decent worker but needed guidance. Improved over time.',
                workQuality: 3,
                communication: 3,
                punctuality: 4,
                wouldRecommend: false,
              }),
              url: U(`${BASE_URL}/reviews`),
            },
          },
        ],
      },

      // ── 3: Read Reviews & Stats ───────────────────────────────────────────
      {
        name: '3 — Read Reviews & Stats',
        item: [
          {
            name: '3.1 Get Review by ID (review1Id)',
            event: [testScript([`pm.test('200', () => pm.response.to.have.status(200));`])],
            request: {
              method: 'GET',
              header: [],
              url: U(`${BASE_URL}/reviews/{{review1Id}}`),
              description: 'Populated with user + job data. Run 2.1 first.',
            },
          },
          {
            name: '3.2 All Reviews for Employer',
            request: {
              method: 'GET',
              header: [],
              url: U(`${BASE_URL}/reviews/user/${employerId}?page=1&limit=10&sort=-createdAt`),
            },
          },
          {
            name: '3.3 All Reviews for Job Seeker',
            request: {
              method: 'GET',
              header: [],
              url: U(`${BASE_URL}/reviews/user/${jobSeekerId}?page=1&limit=10&sort=-createdAt`),
            },
          },
          {
            name: '3.4 Reviews for Job 1',
            request: { method: 'GET', header: [], url: U(`${BASE_URL}/reviews/job/${job1Id}`) },
          },
          {
            name: '3.5 Reviews for Job 2',
            request: { method: 'GET', header: [], url: U(`${BASE_URL}/reviews/job/${job2Id}`) },
          },
          {
            name: '3.6 Employer Rating Stats',
            event: [
              testScript([
                `pm.test('200 stats', () => pm.response.to.have.status(200));`,
                `if (pm.response.code===200) { const s=pm.response.json().data||pm.response.json(); console.log('avgRating:',s.averageRating,'trustScore:',s.trustScore,'badge:',s.badge); }`,
              ]),
            ],
            request: {
              method: 'GET',
              header: [],
              url: U(`${BASE_URL}/reviews/stats/${employerId}`),
              description:
                'Returns: averageRating, trustScore (0-100), badge (Elite/Top Rated/Trusted/Rising Star), ratingDistribution, criteria breakdown.',
            },
          },
          {
            name: '3.7 Job Seeker Rating Stats',
            event: [
              testScript([
                `pm.test('200 stats', () => pm.response.to.have.status(200));`,
                `if (pm.response.code===200) { const s=pm.response.json().data||pm.response.json(); console.log('avgRating:',s.averageRating,'trustScore:',s.trustScore,'badge:',s.badge); }`,
              ]),
            ],
            request: {
              method: 'GET',
              header: [],
              url: U(`${BASE_URL}/reviews/stats/${jobSeekerId}`),
            },
          },
          {
            name: '3.8 Employer Reviews (alias route)',
            request: {
              method: 'GET',
              header: [],
              url: U(`${BASE_URL}/reviews/employer/${employerId}`),
            },
          },
          {
            name: '3.9 Job Seeker Reviews (alias route)',
            request: {
              method: 'GET',
              header: [],
              url: U(`${BASE_URL}/reviews/jobseeker/${jobSeekerId}`),
            },
          },
        ],
      },

      // ── 4: Manage ─────────────────────────────────────────────────────────
      {
        name: '4 — Manage Reviews',
        description: 'Run section 2 first so review1Id is populated in collection variables.',
        item: [
          {
            name: '4.1 Update Review (seeker edits review1Id)',
            event: [testScript([`pm.test('200 updated', () => pm.response.to.have.status(200));`])],
            request: {
              method: 'PUT',
              header: [...A_SEEK, ...JSON_H],
              body: body({
                rating: 5,
                comment: 'Updated: Absolutely outstanding. Best employer I have worked for.',
                workQuality: 5,
                communication: 5,
                punctuality: 5,
                paymentOnTime: 5,
              }),
              url: U(`${BASE_URL}/reviews/{{review1Id}}`),
              description: 'Only works within 7 days of creation. Must be original reviewer.',
            },
          },
          {
            name: '4.2 Report Review (employer reports review1Id)',
            event: [
              testScript([
                `pm.test('200 or 201', () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));`,
              ]),
            ],
            request: {
              method: 'POST',
              header: [...A_EMP, ...JSON_H],
              body: body({
                reason: 'This review contains inaccurate information about the payment schedule.',
              }),
              url: U(`${BASE_URL}/reviews/{{review1Id}}/report`),
              description: 'Employer reports review written by seeker. Cannot report own reviews.',
            },
          },
          {
            name: '4.3 Delete Review (seeker deletes review1Id)',
            event: [testScript([`pm.test('200 deleted', () => pm.response.to.have.status(200));`])],
            request: {
              method: 'DELETE',
              header: A_SEEK,
              url: U(`${BASE_URL}/reviews/{{review1Id}}`),
              description: 'Soft delete — review marked inactive, data preserved for moderation.',
            },
          },
        ],
      },

      // ── 5: Error Cases ────────────────────────────────────────────────────
      {
        name: '5 — Error Cases',
        item: [
          {
            name: '5.1 Duplicate Review (409) — run 2.3 first',
            event: [
              testScript([`pm.test('409 duplicate', () => pm.response.to.have.status(409));`]),
            ],
            request: {
              method: 'POST',
              header: [...A_SEEK, ...JSON_H],
              body: body({
                revieweeId: employerId,
                jobId: job2Id,
                reviewerType: 'job_seeker',
                rating: 3,
                comment: 'Second attempt for same job.',
              }),
              url: U(`${BASE_URL}/reviews`),
            },
          },
          {
            name: '5.2 Review Self (400)',
            event: [
              testScript([`pm.test('400 self-review', () => pm.response.to.have.status(400));`]),
            ],
            request: {
              method: 'POST',
              header: [...A_SEEK, ...JSON_H],
              body: body({
                revieweeId: jobSeekerId,
                jobId: job1Id,
                reviewerType: 'job_seeker',
                rating: 5,
                comment: 'Reviewing myself.',
              }),
              url: U(`${BASE_URL}/reviews`),
            },
          },
          {
            name: '5.3 No Application for Job (403)',
            event: [
              testScript([`pm.test('403 no application', () => pm.response.to.have.status(403));`]),
            ],
            request: {
              method: 'POST',
              header: [...A_SEEK, ...JSON_H],
              body: body({
                revieweeId: employerId,
                jobId: '000000000000000000000001',
                reviewerType: 'job_seeker',
                rating: 5,
                comment: 'No application for this job.',
              }),
              url: U(`${BASE_URL}/reviews`),
            },
          },
          {
            name: '5.4 Rating Out of Range (400/422)',
            event: [
              testScript([
                `pm.test('validation error', () => pm.expect(pm.response.code).to.be.oneOf([400, 422]));`,
              ]),
            ],
            request: {
              method: 'POST',
              header: [...A_SEEK, ...JSON_H],
              body: body({
                revieweeId: employerId,
                jobId: job1Id,
                reviewerType: 'job_seeker',
                rating: 10,
                comment: 'Invalid rating.',
              }),
              url: U(`${BASE_URL}/reviews`),
            },
          },
          {
            name: '5.5 No Token (401)',
            event: [
              testScript([`pm.test('401 no token', () => pm.response.to.have.status(401));`]),
            ],
            request: {
              method: 'POST',
              header: JSON_H,
              body: body({
                revieweeId: employerId,
                jobId: job1Id,
                reviewerType: 'job_seeker',
                rating: 5,
                comment: 'No auth header.',
              }),
              url: U(`${BASE_URL}/reviews`),
            },
          },
        ],
      },
    ],

    event: [
      { listen: 'prerequest', script: { type: 'text/javascript', exec: [''] } },
      { listen: 'test', script: { type: 'text/javascript', exec: [''] } },
    ],
  };
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
