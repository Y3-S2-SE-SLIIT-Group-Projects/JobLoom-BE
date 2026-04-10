/* global __ENV */

/**
 * k6 Performance / Load Test — Job Service
 *
 * Tests the Job API under realistic concurrent load.
 * Mirrors the user.load.js style but covers multiple job endpoints.
 *
 * Scenarios tested:
 *   1. Browse public job listings  (GET /api/jobs)
 *   2. View single job             (GET /api/jobs/:id)
 *   3. Employer creates jobs       (POST /api/jobs)  ← authenticated
 *   4. Employer lists own jobs     (GET /api/jobs/employer/my-jobs)
 *   5. Employer views stats        (GET /api/jobs/employer/stats)
 *
 * Prerequisites (Windows):
 *   1. Install k6:      winget install k6  (or download from https://k6.io/docs/getting-started/installation/)
 *   2. Start the server: npm run dev
 *   3. Run basic load:   k6 run tests/performance/job.load.js
 *   4. Custom target:    k6 run -e BASE_URL=http://localhost:3000/api tests/performance/job.load.js
 *   5. Spike test:       k6 run -e SCENARIO=spike tests/performance/job.load.js
 *
 * Generating HTML report (requires k6-reporter):
 *   k6 run --out json=result.json tests/performance/job.load.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const jobCreateErrors = new Counter('job_create_errors');
const jobListErrors = new Counter('job_list_errors');
const jobFetchErrors = new Counter('job_fetch_errors');
const authErrors = new Counter('auth_errors');

const jobCreateSuccess = new Rate('job_create_success_rate');
const jobListSuccess = new Rate('job_list_success_rate');

const jobCreateDuration = new Trend('job_create_duration', true);
const jobListDuration = new Trend('job_list_duration', true);

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';
const SCENARIO = __ENV.SCENARIO || 'load'; // 'load' | 'spike' | 'soak'

// Shared job IDs seeded during setup — updated via shared array
// (k6 does not allow shared state across VUs; IDs are created per-VU instead)

/** Load test: ramp up → steady → ramp down */
const loadStages = [
  { duration: '30s', target: 10 }, // ramp up
  { duration: '1m', target: 20 }, // steady at 20 virtual users
  { duration: '30s', target: 0 }, // ramp down
];

/** Spike test: sudden burst of traffic */
const spikeStages = [
  { duration: '10s', target: 5 }, // warm up
  { duration: '30s', target: 100 }, // spike to 100 users
  { duration: '30s', target: 5 }, // recover
  { duration: '10s', target: 0 }, // cool down
];

/** Soak test: sustained load over a longer period */
const soakStages = [
  { duration: '1m', target: 10 }, // ramp up
  { duration: '5m', target: 10 }, // sustained load
  { duration: '30s', target: 0 }, // ramp down
];

const STAGES = SCENARIO === 'spike' ? spikeStages : SCENARIO === 'soak' ? soakStages : loadStages;

export const options = {
  stages: STAGES,
  thresholds: {
    // 95% of all requests must complete within 500ms
    http_req_duration: ['p(95)<500'],

    // Custom metric thresholds
    job_list_success_rate: ['rate>0.95'], // >95% of list requests succeed
    job_create_success_rate: ['rate>0.90'], // >90% of create requests succeed

    // Error rates stay low
    job_list_errors: ['count<10'],
    job_create_errors: ['count<10'],
    http_req_failed: ['rate<0.05'], // less than 5% of all requests fail
  },
};

// Shared headers
const JSON_HEADERS = { 'Content-Type': 'application/json' };

// Helper: register & log in to get a token
function getAuthToken() {
  const uniqueId = Math.floor(Math.random() * 10_000_000);
  const email = `perf-employer-${uniqueId}@loadtest.com`;

  const payload = JSON.stringify({
    firstName: 'Load',
    lastName: 'Tester',
    email,
    password: 'password123',
    role: 'employer',
  });

  const regRes = http.post(`${BASE_URL}/users/register`, payload, { headers: JSON_HEADERS });

  const ok = check(regRes, {
    'register: status 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  if (!ok) {
    authErrors.add(1);
    return null;
  }

  try {
    const body = JSON.parse(regRes.body);
    return body?.data?.token || null;
  } catch {
    authErrors.add(1);
    return null;
  }
}

// Helper: create a job and return its ID
function createJob(token) {
  if (!token) return null;

  const uniqueTitle = `Load Test Job ${Math.floor(Math.random() * 1_000_000)}`;
  const payload = JSON.stringify({
    title: uniqueTitle,
    description: 'Performance test job created to benchmark API throughput under load.',
    category: 'agriculture',
    employmentType: 'temporary',
    salaryAmount: 1500,
    salaryType: 'daily',
    positions: 2,
  });

  const start = Date.now();
  const res = http.post(`${BASE_URL}/jobs`, payload, {
    headers: { ...JSON_HEADERS, Authorization: `Bearer ${token}` },
  });
  jobCreateDuration.add(Date.now() - start);

  const ok = check(res, {
    'create job: status 201': (r) => r.status === 201,
    'create job: has _id': (r) => {
      try {
        return !!JSON.parse(r.body)?.data?._id;
      } catch {
        return false;
      }
    },
  });

  jobCreateSuccess.add(ok ? 1 : 0);
  if (!ok) jobCreateErrors.add(1);

  try {
    return JSON.parse(res.body)?.data?._id || null;
  } catch {
    return null;
  }
}

// Default scenario (one iteration per VU)
export default function () {
  // Each VU gets its own token and job
  const token = getAuthToken();
  let jobId = null;

  // Group 1: Public job listing
  group('Public Job Listing', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/jobs`);
    jobListDuration.add(Date.now() - start);

    const ok = check(res, {
      'GET /jobs: status 200': (r) => r.status === 200,
      'GET /jobs: has jobs array': (r) => {
        try {
          return Array.isArray(JSON.parse(r.body)?.data?.jobs);
        } catch {
          return false;
        }
      },
      'GET /jobs: has pagination': (r) => {
        try {
          return !!JSON.parse(r.body)?.data?.pagination;
        } catch {
          return false;
        }
      },
    });

    jobListSuccess.add(ok ? 1 : 0);
    if (!ok) jobListErrors.add(1);
  });

  sleep(0.5);

  // Group 2: Filtered listing (category + status)
  group('Filtered Job Listing', () => {
    const res = http.get(`${BASE_URL}/jobs?category=agriculture&status=open&limit=10`);

    check(res, {
      'GET /jobs?filter: status 200': (r) => r.status === 200,
    });
  });

  sleep(0.5);

  // Group 3: Employer creates a job
  group('Employer Creates Job', () => {
    jobId = createJob(token);
  });

  sleep(0.5);

  // Group 4: Fetch the newly created job by ID
  if (jobId) {
    group('Fetch Single Job', () => {
      const res = http.get(`${BASE_URL}/jobs/${jobId}`);
      jobFetchErrors.add(res.status !== 200 ? 1 : 0);

      check(res, {
        'GET /jobs/:id: status 200': (r) => r.status === 200,
        'GET /jobs/:id: correct id': (r) => {
          try {
            return JSON.parse(r.body)?.data?._id === jobId;
          } catch {
            return false;
          }
        },
      });
    });

    sleep(0.5);
  }

  // Group 5: Employer lists own jobs
  if (token) {
    group("Employer's Own Jobs", () => {
      const res = http.get(`${BASE_URL}/jobs/employer/my-jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      check(res, {
        'GET /my-jobs: status 200': (r) => r.status === 200,
        'GET /my-jobs: has jobs array': (r) => {
          try {
            return Array.isArray(JSON.parse(r.body)?.data?.jobs);
          } catch {
            return false;
          }
        },
      });
    });

    sleep(0.5);
  }

  // Group 6: Employer views dashboard stats
  if (token) {
    group('Employer Stats', () => {
      const res = http.get(`${BASE_URL}/jobs/employer/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      check(res, {
        'GET /stats: status 200': (r) => r.status === 200,
        'GET /stats: has totalJobs': (r) => {
          try {
            const d = JSON.parse(r.body)?.data;
            return typeof d?.totalJobs === 'number';
          } catch {
            return false;
          }
        },
        'GET /stats: has openJobs': (r) => {
          try {
            const d = JSON.parse(r.body)?.data;
            return typeof d?.openJobs === 'number';
          } catch {
            return false;
          }
        },
      });
    });

    sleep(0.5);
  }

  sleep(1);
}
