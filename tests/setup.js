/**
 * Jest Setup File
 * Global test configuration and mocks
 */

import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Nodemailer: redirect all transactional recipients during Jest (unit + integration) so real inboxes are not used.
// Override with SMTP_TEST_RECIPIENT=... or SMTP_TEST_RECIPIENT= (empty) to disable redirection.
if (process.env.SMTP_TEST_RECIPIENT === undefined) {
  process.env.SMTP_TEST_RECIPIENT = 'rue06560656@gmail.com';
}

beforeAll(async () => {
  // Fall back to an in-memory MongoDB instance when no external test DB URI is provided.
  if (!process.env.MONGO_TEST_URI) {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_TEST_URI = mongoServer.getUri('jobloom-test');
  }

  process.env.MONGODB_URI = process.env.MONGO_TEST_URI;
}, 60000);

afterAll(async () => {
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = undefined;
  }
});

// Mock environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.PORT = '3001';
process.env.LOG_LEVEL = 'error'; // Reduce noise in test output

// Suppress console output during tests (optional)
// Uncomment if you want cleaner test output
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
