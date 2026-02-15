/**
 * Jest Setup File
 * Global test configuration and mocks
 */

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Mock environment variables for tests
process.env.MONGODB_URI = 'mongodb://localhost:27017/jobloom-test';
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
