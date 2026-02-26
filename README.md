# JobLoom Backend API

A complete MERN stack backend application with a modular, scalable architecture featuring Winston logging, HTTP interceptors, exception filters, and environment configuration.

## Features

- **ES Modules**: Modern JavaScript with ES6+ import/export syntax
- **MongoDB with Mongoose**: MongoDB database integration with Mongoose ODM
- **JWT Authentication**: Secure token-based authentication system
- **User Management**: Complete user registration, login, and profile management
- **Job Management**: Job posting and search functionality (basic)
- **Application Management**: Job application system with:
  - Apply for jobs with cover letter and resume
  - Status lifecycle (pending → reviewed → shortlisted → accepted/rejected)
  - Application withdrawal with reason tracking
  - Status audit trail (statusHistory)
  - Employer notes and interview scheduling
  - Role-based access control (job seekers vs employers)
  - Application statistics for employer dashboard
  - Soft-delete support
- **Review & Rating System**: Comprehensive trust and quality system with:
  - Multi-criteria ratings (work quality, communication, punctuality, payment)
  - Weighted rating calculations
  - Trust score algorithm
  - Badge system (Elite, Top Rated, Trusted, Rising Star)
  - Review moderation and reporting
  - Automatic user rating statistics updates
- **Winston Logger**: Advanced logging with multiple transports and log levels
- **HTTP Interceptor**: Request/response logging with unique request IDs
- **Exception Filters**: Global error handling with custom exception classes
- **Environment Configuration**: Centralized configuration service with validation
- **Security**: Helmet for security headers, CORS configuration, password hashing
- **Modular Architecture**: Clean separation of concerns with controllers, services, and models
- **Comprehensive Testing**: Unit, integration, and performance tests with Jest, Supertest, and k6
- **SMS Gateway Integration**: OTP-based user verification and password reset via Text.lk API

## Project Structure

```
src/
├── config/
│   ├── database.js              # MongoDB connection configuration
│   ├── env.config.js            # Environment configuration service
│   └── logger.config.js         # Winston logger setup
├── middleware/
│   ├── http-interceptor.js      # Request/response interceptor
│   ├── error-handler.js         # Global exception filter
│   ├── async-handler.js         # Async error wrapper
│   ├── auth.middleware.js       # JWT authentication middleware
│   ├── role.middleware.js       # Role-based access control
│   └── validation.middleware.js # Request validation middleware
├── models/
│   └── http-exception.js        # Custom exception classes
├── modules/
│   ├── users/                   # User Management Module
│   │   ├── user.model.js
│   │   ├── user.controller.js
│   │   ├── user.service.js
│   │   ├── user.routes.js
│   │   └── user.validation.js
│   ├── jobs/                    # Job Management Module (Basic)
│   │   ├── job.model.js
│   │   └── job.routes.js
│   ├── applications/            # Application Management Module (COMPLETE)
│   │   ├── application.model.js
│   │   ├── application.controller.js
│   │   ├── application.service.js
│   │   ├── application.routes.js
│   │   └── application.validation.js
│   └── reviews/                 # Review & Rating Module (COMPLETE)
│       ├── review.model.js
│       ├── review.controller.js
│       ├── review.service.js
│       ├── review.routes.js
│       └── review.validation.js
├── routes/
│   ├── index.js                # Main router
│   └── hello/
│       ├── hello.controller.js
│       └── hello.service.js
├── utils/
│   ├── response.utils.js       # Standardized response helpers
│   ├── jwt.utils.js            # JWT token utilities
│   └── rating.utils.js         # Rating calculation utilities
└── server.js                   # Main application entry point

tests/
├── unit/
│   └── review.service.test.js  # Unit tests for rating logic
└── integration/
    └── review.routes.test.js   # Integration tests for API
```

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd JobLoom-BE
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` and update the values:

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/jobloom
   MONGO_TEST_URI=mongodb://localhost:27017/jobloom-test
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   BCRYPT_ROUNDS=10
   LOG_LEVEL=debug
   ```

4. **Start MongoDB**

   Make sure MongoDB is running on your system:

   ```bash
   # macOS (with Homebrew)
   brew services start mongodb-community

   # Linux (systemd)
   sudo systemctl start mongod

   # Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

## Running the Application

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check

npm run l```
GET /
GET /health
GET /healthz (liveness probe)
GET /ready (readiness probe)

```

Returns API health status and system information.

---

## Authentication & User Management

### Register User

```

POST /api/users/register

````

Register a new user account.

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "job_seeker",
  "phone": "+94771234567"
}
````

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "job_seeker",
      "ratingStats": {
        "averageRating": 0,
        "totalReviews": 0
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login

```
POST /api/users/login
```

Login to existing account.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** Same as register (user + token)

### Get Current User

```
GET /api/users/me
Authorization: Bearer <token>
```

Get authenticated user profile.

### Verify Registration (OTP)

```
POST /api/users/verify-registration
```

Verify user registration using the OTP sent via SMS.

**Request Body:**

```json
{
  "phone": "94712345678",
  "otp": "123456"
}
```

### Forgot Password (OTP)

```
POST /api/users/forgot-password
```

Send an OTP to the user's phone for password reset.

**Request Body:**

```json
{
  "phone": "94712345678"
}
```

### Verify Password Reset (OTP)

```
POST /api/users/verify-password-reset
```

Verify the OTP for password reset and receive a temporary reset token.

**Request Body:**

```json
{
  "phone": "94712345678",
  "otp": "123456"
}
```

### Reset Password

```
POST /api/users/reset-password
```

Reset the user's password using the temporary reset token.

**Request Body:**

```json
{
  "phone": "94712345678",
  "resetToken": "...",
  "password": "newpassword123"
}
```

### Get User by ID

```
GET /api/users/:id
```

Get public user profile (for displaying reviewee info).

### Update Profile

```
PUT /api/users/profile
Authorization: Bearer <token>
```

Update own user profile.

---

## Job Application Management (Member 3's Component)

### Apply for a Job

```
POST /api/applications
Authorization: Bearer <token>
```

Submit a job application. **Requires job_seeker role.**

**Request Body:**

```json
{
  "jobId": "job_id_to_apply_for",
  "coverLetter": "I am very interested in this position...",
  "resumeUrl": "https://example.com/my-resume.pdf"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "application": {
      "_id": "...",
      "jobId": { "title": "Farm Worker", "category": "farming", "status": "open" },
      "jobSeekerId": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "skills": []
      },
      "employerId": { "firstName": "Jane", "lastName": "Smith", "email": "jane@example.com" },
      "status": "pending",
      "coverLetter": "I am very interested in this position...",
      "resumeUrl": "https://example.com/my-resume.pdf",
      "statusHistory": [{ "status": "pending", "changedAt": "2026-02-13T..." }],
      "isActive": true,
      "appliedAt": "2026-02-13T...",
      "createdAt": "2026-02-13T..."
    }
  }
}
```

**Business Rules:**

- Job must exist and have status `open`
- Cannot apply to your own job posting
- Cannot apply twice for the same job (409 Conflict)
- `employerId` is auto-populated from the Job document

### Get Application by ID

```
GET /api/applications/:id
Authorization: Bearer <token>
```

Get single application details. **Accessible by the job seeker who applied, the employer who owns the job, or an admin.**

**Note:** If the requester is the job seeker, `employerNotes` is stripped from the response.

### Get My Applications (Job Seeker)

```
GET /api/applications/my-applications?status=pending&page=1&limit=20
Authorization: Bearer <token>
```

Get all applications for the authenticated job seeker. **Requires job_seeker role.**

**Query Parameters:**

- `status` (optional): Filter by status (pending, reviewed, shortlisted, accepted, rejected, withdrawn)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sort` (optional): Sort field (default: -createdAt)

**Response:**

```json
{
  "success": true,
  "message": "Applications retrieved successfully",
  "data": {
    "applications": [...],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
}
```

### Get Job Applications (Employer)

```
GET /api/applications/job/:jobId?status=pending&page=1&limit=20
Authorization: Bearer <token>
```

Get all applications for a specific job. **Requires employer role.** The employer must own the job.

**Query Parameters:**

- `status` (optional): Filter by status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sort` (optional): Sort field (default: -createdAt)

### Update Application Status (Employer)

```
PATCH /api/applications/:id/status
Authorization: Bearer <token>
```

Update the status of an application. **Requires employer role.**

**Request Body:**

```json
{
  "status": "reviewed",
  "employerNotes": "Strong candidate, good experience in farming"
}
```

**Allowed Status Values:** `reviewed`, `shortlisted`, `accepted`, `rejected`

**Status Transition Rules:**

| Current Status | Can Transition To                         |
| -------------- | ----------------------------------------- |
| `pending`      | reviewed, shortlisted, accepted, rejected |
| `reviewed`     | shortlisted, accepted, rejected           |
| `shortlisted`  | accepted, rejected                        |
| `accepted`     | _(final — no further transitions)_        |
| `rejected`     | _(final — no further transitions)_        |
| `withdrawn`    | _(final — no further transitions)_        |

**Business Rules:**

- Only the employer on the application can update the status
- Invalid transitions return 400 with a descriptive error message
- Each status change is recorded in `statusHistory` with timestamp and user ID
- `reviewedAt` is automatically set on first transition to `reviewed`

### Withdraw Application (Job Seeker)

```
PATCH /api/applications/:id/withdraw
Authorization: Bearer <token>
```

Withdraw a submitted application. **Requires job_seeker role.**

**Request Body:**

```json
{
  "withdrawalReason": "I accepted another position"
}
```

**Business Rules:**

- Only the job seeker who applied can withdraw
- Can only withdraw from `pending`, `reviewed`, or `shortlisted` status
- Cannot withdraw after being `accepted` or `rejected`

### Check Application Eligibility

```
GET /api/applications/check/:jobId/:userId
```

Check if a user has an accepted application for a job. **Public endpoint** used by the Review module for eligibility checks.

**Response:**

```json
{
  "success": true,
  "message": "Application check completed",
  "data": {
    "hasAcceptedApplication": true,
    "application": { ... }
  }
}
```

---

## Review & Rating System (Member 4's Component)

### Create Review

```
POST /api/reviews
Authorization: Bearer <token>
```

Submit a review after job completion. **Requires accepted application**.

**Request Body:**

```json
{
  "revieweeId": "user_id_being_reviewed",
  "jobId": "job_id",
  "reviewerType": "job_seeker",
  "rating": 5,
  "comment": "Excellent employer, highly recommended!",
  "workQuality": 5,
  "communication": 5,
  "punctuality": 4,
  "paymentOnTime": 5,
  "wouldRecommend": true
}
```

**Business Rules:**

- Can only review users you've worked with (accepted application required)
- One review per job per user
- Cannot review yourself
- Rating is auto-calculated from criteria if multiple provided

### Get Review by ID

```
GET /api/reviews/:id
```

Get single review details.

### Update Review

```
PUT /api/reviews/:id
Authorization: Bearer <token>
```

Update own review.

**Restrictions:**

- Can only edit within 7 days of creation
- Cannot change rating after 24 hours
- Can only edit own reviews

### Delete Review

```
DELETE /api/reviews/:id
Authorization: Bearer <token>
```

Delete own review (soft delete).

### Get Reviews for User

```
GET /api/reviews/user/:userId?reviewerType=job_seeker&page=1&limit=20
```

Get all reviews for a specific user (reviewee).

**Query Parameters:**

- `reviewerType` (optional): Filter by reviewer type (job_seeker, employer)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

### Get Reviews for Job

```
GET /api/reviews/job/:jobId
```

Get all reviews related to a specific job.

### Get User Rating Statistics

```
GET /api/reviews/stats/:userId
```

Get comprehensive rating statistics for a user.

**Response:**

```json
{
  "success": true,
  "data": {
    "stats": {
      "averageRating": 4.5,
      "totalReviews": 12,
      "ratingDistribution": {
        "5": 6,
        "4": 4,
        "3": 2,
        "2": 0,
        "1": 0
      },
      "trustScore": 95,
      "badge": "Top Rated"
    }
  }
}
```

**Badge System:**

- **Elite**: 4.8+ rating with 20+ reviews
- **Top Rated**: 4.5+ rating with 10+ reviews
- **Trusted**: 4.0+ rating with 5+ reviews
- **Rising Star**: 4.0+ rating with 2-4 reviews

**Trust Score Algorithm:**

```
trustScore = (averageRating * 20) + min(totalReviews * 0.5, 10)
Maximum: 110 (5 stars * 20 + 10 bonus points)
```

### Report Review

```
POST /api/reviews/:id/report
Authorization: Bearer <token>
```

Report inappropriate review.

**Request Body:**

```json
{
  "reason": "This review contains false information and inappropriate language"
}
```

**Note:** Reviews with 3+ reports are automatically flagged for moderation.

### Get Employer Reviews

```
GET /api/reviews/employer/:employerId
```

Get all reviews for an employer (alias endpoint).

### Get Job Seeker Reviews

```
GET /api/reviews/jobseeker/:jobSeekerId
```

Get all reviews for a job seeker (alias endpoint).

---

## Jobs & Applications (Basic Endpoints)

### Get Job by ID

```
GET /api/jobs/:id
```

### Get All Jobs

```
GET /api/jobs
```

### Check Application Eligibility

```
GET /api/applications/check/:jobId/:userId
```

Check if user has accepted application for job (used for review eligibility).

---

### Health Check (Original)

```
GET /
```

Returns API health status and system information.

**Response:**

```json
{
  "success": true,
  "message": "JobLoom API is running",
  "data": {
    "status": "OK",
    "uptime": 123.45,
    "timestamp": "2026-02-11T...",
    "environment": "development",
    "nodeVersion": "v18.0.0",
    "memory": {
      "used": 45,
      "total": 100,
      "unit": "MB"
    },
    "apiDocs": "/api"
  }
}
```

### Hello World

```
GET /api/hello
```

Returns a Hello World message with metadata.

**Response:**

```json
{
  "success": true,
  "message": "Hello World!",
  "data": {
    "message": "Hello World!",
    "timestamp": "2026-02-11T...",
    "environment": "development",
    "version": "1.0.0"
  }
}
```

### Personalized Greeting

```
GET /api/hello/:name
```

Returns a personalized greeting message.

**Parameters:**

- `name` (string, required): Name to greet (max 50 characters)

**Response:**

```json
{
  "success": true,
  "message": "Greeting generated successfully",
  "data": {
    "message": "Hello, John!",
    "greeting": "Welcome to JobLoom API, John!",
    "timestamp": "2026-02-11T..."
  }
}
```

## Error Handling

The API uses standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "field": "fieldName",
    "message": "Detailed error message"
  },
  "requestId": "uuid-v4",
  "stack": "Error stack (development only)"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate entries)
- `500` - Internal Server Error

## Logging

The application uses Winston for logging with the following features:

- **Console logging**: Colorized output for development
- **File logging**: Separate files for all logs and errors
- **Log levels**: error, warn, info, debug
- **Request logging**: All HTTP requests and responses are logged

Log files are stored in the `logs/` directory:

- `combined.log` - All log levels
- `error.log` - Error logs only

## Architecture Patterns

### Controllers

Handle HTTP requests/responses and input validation. Controllers should be thin and delegate business logic to services.

### Services

Contain business logic and data operations. Services are reusable and testable independently.

### Models

Define data schemas, custom error classes, and database models.

### Middleware

Cross-cutting concerns like logging, authentication, error handling, and request processing.

### Utilities

Helper functions and shared utilities used across the application.

## Custom Exception Classes

The application provides several pre-built exception classes:

```javascript
import {
  BadRequestException, // 400
  UnauthorizedException, // 401
  ForbiddenException, // 403
  NotFoundException, // 404
  ConflictException, // 409
  InternalServerException, // 500
} from './models/http-exception.js';

// Usage
throw new BadRequestException('Invalid input data');
throw new NotFoundException('User not found');
```

## Environment Variables

| Variable          | Description                               | Default                                        |
| ----------------- | ----------------------------------------- | ---------------------------------------------- |
| `NODE_ENV`        | Environment (development/production/test) | development                                    |
| `PORT`            | Server port                               | 3000                                           |
| `MONGODB_URI`     | MongoDB connection string                 | mongodb://localhost:27017/jobloom              |
| `MONGO_TEST_URI`  | MongoDB test database connection string   | mongodb://localhost:27017/jobloom-test         |
| `JWT_SECRET`      | Secret key for JWT token generation       | your-super-secret-jwt-key-change-in-production |
| `JWT_EXPIRES_IN`  | JWT token expiration time                 | 7d                                             |
| `BCRYPT_ROUNDS`   | Number of bcrypt hashing rounds           | 10                                             |
| `LOG_LEVEL`       | Winston log level (error/warn/info/debug) | info                                           |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated)    | \* (development), must set in production       |

## Scripts

| Command                    | Description                                           |
| -------------------------- | ----------------------------------------------------- |
| `npm start`                | Start the server in production mode                   |
| `npm run dev`              | Start the server in development mode with auto-reload |
| `npm test`                 | Run all tests with coverage                           |
| `npm run test:watch`       | Run tests in watch mode                               |
| `npm run test:unit`        | Run unit tests only                                   |
| `npm run test:integration` | Run integration tests only                            |
| `npm run lint`             | Run ESLint                                            |
| `npm run lint:fix`         | Fix ESLint errors automatically                       |
| `npm run format`           | Format code with Prettier                             |
| `npm run format:check`     | Check code formatting                                 |

## Testing

### Quick Start

```bash
# Unit tests only (no setup required - recommended for development)
npm run test:unit

# All tests (requires MongoDB)
npm test
```

### Running Tests

```bash
# Run unit tests only (✅ Fast, no dependencies)
npm run test:unit

# Run integration tests only (⚠️ Requires MongoDB)
npm run test:integration

# Run all tests with coverage (⚠️ Requires MongoDB)
npm test

# Run tests in watch mode
npm run test:watch
```

### MongoDB Setup for Integration Tests

Integration tests require MongoDB. Choose one option:

#### Option 1: Local MongoDB (Recommended)

```bash
# Linux
sudo apt install mongodb && sudo systemctl start mongodb

# macOS
brew install mongodb-community && brew services start mongodb-community

# Then run tests
npm run test:integration
```

#### Option 2: Docker

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

#### Option 3: Skip Integration Tests

```bash
# Just run unit tests during development
npm run test:unit
```

### Test Coverage

The project includes comprehensive testing:

- ✅ **24 unit tests** - Rating calculations, trust score, badge logic
- ⚠️ **15 integration tests** - Complete API workflows (requires MongoDB)

**Coverage Target**: 70%+ for branches, functions, lines, and statements

📖 **Detailed testing guide**: See [docs/TESTING.md](docs/TESTING.md)

## Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:3000/

# Register user
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","password":"password123","role":"job_seeker"}'

# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Get current user (replace TOKEN with your JWT)
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer TOKEN"

# Create review
curl -X POST http://localhost:3000/api/reviews \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"revieweeId":"USER_ID","jobId":"JOB_ID","reviewerType":"job_seeker","rating":5,"comment":"Great!"}'

# Get user reviews
curl http://localhost:3000/api/reviews/user/USER_ID

# Get rating statistics
curl http://localhost:3000/api/reviews/stats/USER_ID
```

### Using HTTPie

```bash
# Health check
http localhost:3000/

# Hello World
http localhost:3000/api/hello

# Personalized greeting
http localhost:3000/api/hello/John
```

## Development Guidelines

### Adding New Routes

1. Create a new folder in `src/routes/` for your feature
2. Create a controller file (e.g., `feature.controller.js`)
3. Create a service file (e.g., `feature.service.js`)
4. Register the route in `src/routes/index.js`

Example:

```javascript
// src/routes/users/users.controller.js
import { Router } from 'express';
import usersService from './users.service.js';
import { sendSuccess } from '../../utils/response.utils.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const users = await usersService.getAllUsers();
    sendSuccess(res, 'Users retrieved successfully', users);
  } catch (error) {
    next(error);
  }
});

export default router;

// src/routes/index.js
import usersController from './users/users.controller.js';
router.use('/users', usersController);
```

## License

ISC

## Contributors

SLIIT Group Project - Year 3 Semester 2
