# Testing Guide

JobLoom Backend uses a comprehensive testing strategy covering unit, integration, and performance testing.

## Test Stack

| Tool                      | Purpose                                   |
| ------------------------- | ----------------------------------------- |
| **Jest**                  | Unit and integration test runner          |
| **Supertest**             | HTTP assertion for integration tests      |
| **mongodb-memory-server** | In-memory MongoDB for isolated unit tests |
| **Playwright**            | E2E API quality gate tests                |
| **k6**                    | Performance and load testing              |

## Quick Start

```bash
# Unit tests (no external dependencies required)
npm run test:unit

# Integration tests (requires MongoDB)
npm run test:integration

# All tests with coverage
npm test

# Performance tests (requires k6 installed)
npm run test:performance
```

## Unit Tests

Unit tests validate individual service functions in isolation using mocked dependencies.

**Location:** `tests/unit/`

| File                                    | Module       | What is tested                           |
| --------------------------------------- | ------------ | ---------------------------------------- |
| `user.service.test.js`                  | Users        | Registration, login, profile logic       |
| `job.service.test.js`                   | Jobs         | Job CRUD, filtering, employer operations |
| `application.service.test.js`           | Applications | Apply, status transitions, withdrawal    |
| `application.interview.service.test.js` | Applications | Interview scheduling, Jitsi context      |
| `review.service.test.js`                | Reviews      | Rating calculations, trust score, badges |
| `jitsiRoom.test.js`                     | Utils        | Room name generation utility             |

```bash
# Run unit tests only
npm run test:unit

# Run in watch mode during development
npm run test:watch
```

Unit tests use `mongodb-memory-server` so no external MongoDB instance is required.

## Integration Tests

Integration tests verify complete API request/response flows using Supertest against the real Express app with a live MongoDB connection.

**Location:** `tests/integration/`

| File                         | Module       | What is tested                                         |
| ---------------------------- | ------------ | ------------------------------------------------------ |
| `user.routes.test.js`        | Users        | Registration, login, profile, password reset endpoints |
| `job.routes.test.js`         | Jobs         | Job CRUD, employer routes, filtering, pagination       |
| `application.routes.test.js` | Applications | Apply, status updates, withdrawal, eligibility check   |
| `review.routes.test.js`      | Reviews      | Create, update, delete, reporting, stats endpoints     |

### MongoDB Setup

Integration tests require a running MongoDB instance.

**Option 1: Local MongoDB**

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Run tests
npm run test:integration
```

**Option 2: Docker**

```bash
# Start test database
npm run test:setup

# Run integration tests
npm run test:integration

# Stop test database
npm run test:teardown

# Or all-in-one
npm run test:docker
```

**Option 3: MongoDB Atlas**

Set `MONGO_TEST_URI` in your `.env` to point to a dedicated test database:

```env
MONGO_TEST_URI=mongodb+srv://user:pass@cluster.mongodb.net/jobloom-test
```

### Test Environment Configuration

The test setup file (`tests/setup.js`) configures:

- `NODE_ENV=test`
- In-memory MongoDB via `mongodb-memory-server` (fallback when `MONGO_TEST_URI` is unset)
- JWT secret for test tokens
- SMTP redirection to prevent real emails during tests
- Automatic database cleanup between test suites

## Performance Tests

Performance tests evaluate API throughput and latency under concurrent load using **k6**.

**Location:** `tests/performance/`

| File           | Scenarios                                                                     |
| -------------- | ----------------------------------------------------------------------------- |
| `user.load.js` | Login endpoint under sustained 20-user load                                   |
| `job.load.js`  | Job listing, creation, single fetch, employer endpoints under load/spike/soak |

### Prerequisites

Install k6: https://grafana.com/docs/k6/latest/set-up/install-k6/

```bash
# macOS
brew install k6

# Windows
winget install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D68
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

### Running Performance Tests

```bash
# Start the server first
npm run dev

# Run all performance tests
npm run test:performance

# Run individual test suites
npm run test:performance:jobs
npm run test:performance:users

# Custom base URL
k6 run -e BASE_URL=http://localhost:3000/api tests/performance/job.load.js

# Spike test scenario
k6 run -e SCENARIO=spike tests/performance/job.load.js

# Soak test scenario
k6 run -e SCENARIO=soak tests/performance/job.load.js
```

### Performance Thresholds

| Metric                        | Threshold |
| ----------------------------- | --------- |
| 95th percentile response time | < 500ms   |
| Job listing success rate      | > 95%     |
| Job creation success rate     | > 90%     |
| Overall HTTP failure rate     | < 5%      |

### Generating Reports

```bash
# JSON output for analysis
k6 run --out json=result.json tests/performance/job.load.js
```

## E2E Tests (API Quality Gate)

Playwright-based smoke tests that verify the API is functional.

**Location:** `tests/e2e/`

```bash
npm run test:e2e
```

Tests verify:

- Swagger UI is accessible at `/api-docs`
- Health endpoint returns valid response
- 404 routes return proper JSON errors

## Coverage

Coverage is collected automatically when running `npm test`. Reports are generated in the `coverage/` directory.

```bash
# Run with coverage
npm test

# View HTML report
open coverage/lcov-report/index.html
```

## CI/CD Integration

Tests run automatically in GitHub Actions (`.github/workflows/ci.yml`):

1. **Unit tests** run on every push
2. **Integration tests** run against MongoDB 7 and Redis 7 service containers
3. **Coverage** is uploaded to Codecov

## npm Scripts Reference

| Command                          | Description                                   |
| -------------------------------- | --------------------------------------------- |
| `npm test`                       | Run all tests with coverage                   |
| `npm run test:unit`              | Unit tests only (no MongoDB required)         |
| `npm run test:integration`       | Integration tests (requires MongoDB)          |
| `npm run test:e2e`               | Playwright E2E API smoke tests                |
| `npm run test:performance`       | k6 load tests (requires k6 installed)         |
| `npm run test:performance:jobs`  | k6 job API load test only                     |
| `npm run test:performance:users` | k6 user API load test only                    |
| `npm run test:watch`             | Jest watch mode                               |
| `npm run test:docker`            | Start test DB, run integration tests, stop DB |
| `npm run test:setup`             | Start test MongoDB in Docker                  |
| `npm run test:teardown`          | Stop test MongoDB container                   |
