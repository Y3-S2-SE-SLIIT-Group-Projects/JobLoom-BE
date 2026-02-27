/**
 * Jest Configuration
 * Testing framework configuration for unit and integration tests
 */

export default {
  // Test environment
  testEnvironment: 'node',

  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // Exclude server entry point
    '!src/config/**', // Exclude config files
    '!src/routes/**', // Exclude route definitions
    '!src/middleware/**', // Exclude middleware
    '!src/**/*.routes.js', // Exclude route files
    '!src/**/*.validation.js', // Exclude validation schemas
  ],

  // Coverage thresholds - enforce only on actively tested code
  coverageThreshold: {
    // Only enforce coverage on rating utilities (what's currently tested)
    'src/utils/rating.utils.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // Ignore patterns
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],

  // Test match patterns
  testMatch: [
    '**/tests/unit/**/*.test.js', // Only run unit tests by default
    // '**/tests/integration/**/*.test.js', // Uncomment to run integration tests
  ],

  // Transform (if using ES modules)
  transform: {},

  // Module name mapper (for path aliases if needed)
  moduleNameMapper: {},

  // Setup files - runs before each test file
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Detect open handles (useful for debugging)
  detectOpenHandles: true,

  // Force exit after tests complete
  forceExit: true,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
