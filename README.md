# JobLoom Backend API

A complete MERN stack backend application with a modular, scalable architecture featuring Winston logging, HTTP interceptors, exception filters, and environment configuration.

## Features

- **ES Modules**: Modern JavaScript with ES6+ import/export syntax
- **MongoDB with Mongoose**: MongoDB database integration with Mongoose ODM
- **JWT Authentication**: Secure token-based authentication system
- **User Management**: Complete user registration, login, and profile management
- **Job Management**: Full job posting, search, filtering, AI-powered description generation, and geospatial nearby search
- **Application Management**: Job application system with:
  - Apply for jobs with cover letter and resume
  - Status lifecycle (pending → reviewed → shortlisted → accepted/rejected)
  - Application withdrawal with reason tracking
  - Status audit trail (statusHistory)
  - Employer notes and interview scheduling (Jitsi integration)
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
- **Admin Dashboard**: User and job management with platform-wide statistics
- **Winston Logger**: Advanced logging with multiple transports and log levels
- **HTTP Interceptor**: Request/response logging with unique request IDs
- **Exception Filters**: Global error handling with custom exception classes
- **Environment Configuration**: Centralized configuration service with validation
- **Security**: Helmet for security headers, CORS configuration, password hashing
- **Modular Architecture**: Clean separation of concerns with controllers, services, and models
- **Comprehensive Testing**: Unit, integration, and performance tests with Jest, Supertest, and k6
- **SMS Gateway Integration**: OTP-based user verification and password reset via Text.lk API
- **Third-Party Integrations**: Cloudinary (file uploads), Cohere AI (job descriptions), Nodemailer (email), Jitsi (video interviews)

## Project Structure

```
src/
├── config/
│   ├── database.js              # MongoDB connection configuration
│   ├── cloudinary.js            # Cloudinary upload configuration
│   ├── env.config.js            # Environment configuration service
│   ├── logger.config.js         # Winston logger setup
│   └── server.config.js         # HTTP status codes and constants
├── middleware/
│   ├── auth/
│   │   ├── authMiddleware.js    # JWT authentication (protect)
│   │   └── roleMiddleware.js    # Role-based authorization (authorize)
│   ├── uploads/
│   │   └── fileUpload.js        # Multer file upload middleware
│   ├── http-interceptor.js      # Request/response interceptor
│   ├── error-handler.js         # Global exception filter
│   ├── auth.middleware.js       # JWT authentication (lightweight)
│   ├── role.middleware.js       # Role-based access control
│   ├── validation.middleware.js # Request validation middleware
│   ├── security.middleware.js   # Helmet security headers
│   ├── cors.middleware.js       # CORS configuration
│   ├── body-parser.middleware.js# Body parsing middleware
│   └── request-logger.middleware.js # Morgan request logging
├── models/
│   └── http-exception.js        # Custom exception classes
├── modules/
│   ├── users/                   # User Management Module
│   │   ├── user.model.js
│   │   ├── user.controller.js
│   │   ├── user.service.js
│   │   ├── user.routes.js
│   │   └── user.validation.js
│   ├── jobs/                    # Job Management Module
│   │   ├── job.model.js
│   │   ├── job.controller.js
│   │   ├── job.service.js
│   │   ├── job.routes.js
│   │   └── job.validation.js
│   ├── applications/            # Application Management Module
│   │   ├── application.model.js
│   │   ├── application.controller.js
│   │   ├── application.service.js
│   │   ├── application.routes.js
│   │   └── application.validation.js
│   ├── reviews/                 # Review & Rating Module
│   │   ├── review.model.js
│   │   ├── review.controller.js
│   │   ├── review.service.js
│   │   ├── review.repository.js
│   │   ├── review.routes.js
│   │   ├── review.validation.js
│   │   └── rating-stats.model.js
│   └── admin/                   # Admin Management Module
│       ├── admin.controller.js
│       ├── admin.service.js
│       └── admin.routes.js
├── routes/
│   ├── index.js                 # Main API router
│   ├── health.routes.js         # Health check endpoints
│   ├── upload.route.js          # File upload endpoints
│   └── hello/
│       ├── hello.controller.js
│       └── hello.service.js
├── services/
│   ├── email.service.js         # Nodemailer transactional email
│   ├── sms.service.js           # Text.lk SMS gateway
│   └── upload.service.js        # Cloudinary upload service
├── swagger/
│   ├── swagger.config.js        # OpenAPI 3.0 configuration
│   ├── user.swagger.js
│   ├── job.swagger.js
│   ├── application.swagger.js
│   ├── review.swagger.js
│   ├── admin.swagger.js
│   └── health.swagger.js
├── utils/
│   ├── response.utils.js        # Standardized response helpers
│   ├── jwt.utils.js             # JWT token utilities
│   ├── rating.utils.js          # Rating calculation utilities
│   ├── jitsiRoom.js             # Jitsi room name generator
│   └── llm.client.js            # Cohere AI client
└── server.js                    # Main application entry point

tests/
├── unit/
│   ├── user.service.test.js
│   ├── job.service.test.js
│   ├── application.service.test.js
│   ├── application.interview.service.test.js
│   ├── review.service.test.js
│   └── jitsiRoom.test.js
├── integration/
│   ├── user.routes.test.js
│   ├── job.routes.test.js
│   ├── application.routes.test.js
│   └── review.routes.test.js
├── e2e/
│   └── api-quality-gate.spec.js
├── performance/
│   ├── user.load.js             # k6 user API load test
│   └── job.load.js              # k6 job API load test
└── setup.js                     # Shared test setup
```

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn
- k6 (for performance testing — [install guide](https://grafana.com/docs/k6/latest/set-up/install-k6/))

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Y3-S2-SE-SLIIT-Group-Projects/JobLoom-BE.git
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

```
GET /              # API status and system information
GET /health        # Health status
GET /healthz       # Liveness probe (Kubernetes-ready)
GET /ready         # Readiness probe (Kubernetes-ready)
```

Returns API health status and system information.

---

## Authentication & User Management

### Register User

```
POST /api/users/register
```

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
```

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

### Get User Profile by ID

```
GET /api/users/profile/:id
Authorization: Bearer <token>
```

Get public user profile (for displaying reviewee info).

### Update Profile

```
PUT /api/users/profile
Authorization: Bearer <token>
```

Update own user profile (supports multipart for CV/image uploads).

### Delete Account

```
DELETE /api/users/account
Authorization: Bearer <token>
```

Delete authenticated user's account.

---

## Job Management

### Get All Jobs

```
GET /api/jobs?category=agriculture&status=open&search=farm&page=1&limit=20
```

List/filter jobs with full-text search, category/status filtering, sorting, and pagination.

**Query Parameters:**

- `search` (optional): Full-text search on title and description
- `category` (optional): Filter by job category
- `status` (optional): Filter by job status (open, closed, filled)
- `employmentType` (optional): Filter by type (full_time, part_time, temporary, contract)
- `salaryMin` / `salaryMax` (optional): Salary range filter
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sort` (optional): Sort field (default: -createdAt)

### Get Nearby Jobs

```
GET /api/jobs/nearby?lat=6.9271&lng=79.8612&radius=50
```

Find jobs near a location using geospatial query (Mapbox integration).

### Get Recommended Jobs

```
GET /api/jobs/recommendations
Authorization: Bearer <token>
```

Get job recommendations based on user skills (protected).

### Get Job by ID

```
GET /api/jobs/:id
```

Get single job details.

### Generate Job Description (AI)

```
POST /api/jobs/generate-description
Authorization: Bearer <token>  (Employer only)
```

Generate a job description using Cohere AI (third-party API integration).

### Create Job

```
POST /api/jobs
Authorization: Bearer <token>  (Employer only)
```

Create a new job posting.

**Request Body:**

```json
{
  "title": "Farm Worker",
  "description": "Looking for experienced farm workers...",
  "category": "agriculture",
  "employmentType": "temporary",
  "salaryAmount": 1500,
  "salaryType": "daily",
  "positions": 2,
  "location": {
    "address": "Colombo, Sri Lanka",
    "coordinates": [79.8612, 6.9271]
  }
}
```

### Get Employer's Jobs

```
GET /api/jobs/employer/my-jobs
Authorization: Bearer <token>  (Employer only)
```

List all jobs created by the authenticated employer.

### Get Employer Stats

```
GET /api/jobs/employer/stats
Authorization: Bearer <token>  (Employer only)
```

Get dashboard statistics (total jobs, open jobs, applications count).

### Update Job

```
PUT /api/jobs/:id
Authorization: Bearer <token>  (Employer only)
```

Update job details.

### Close Job

```
PATCH /api/jobs/:id/close
Authorization: Bearer <token>  (Employer only)
```

Close a job posting.

### Mark Job as Filled

```
PATCH /api/jobs/:id/filled
Authorization: Bearer <token>  (Employer only)
```

Mark a job as filled.

### Delete Job (Soft Delete)

```
DELETE /api/jobs/:id
Authorization: Bearer <token>  (Employer only)
```

Soft delete a job posting.

---

## Job Application Management

### Apply for a Job

```
POST /api/applications
Authorization: Bearer <token>  (Job Seeker only)
```

Submit a job application.

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

Get single application details. Accessible by the job seeker who applied, the employer who owns the job, or an admin.

### Get My Applications (Job Seeker)

```
GET /api/applications/my-applications?status=pending&page=1&limit=20
Authorization: Bearer <token>  (Job Seeker only)
```

Get all applications for the authenticated job seeker.

**Query Parameters:**

- `status` (optional): Filter by status (pending, reviewed, shortlisted, accepted, rejected, withdrawn)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sort` (optional): Sort field (default: -createdAt)

### Get Job Applications (Employer)

```
GET /api/applications/job/:jobId?status=pending&page=1&limit=20
Authorization: Bearer <token>  (Employer only)
```

Get all applications for a specific job. The employer must own the job.

### Update Application Status (Employer)

```
PATCH /api/applications/:id/status
Authorization: Bearer <token>  (Employer only)
```

Update the status of an application.

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

### Update Employer Notes

```
PATCH /api/applications/:id/notes
Authorization: Bearer <token>  (Employer only)
```

### Schedule Interview

```
PATCH /api/applications/:id/interview
Authorization: Bearer <token>  (Employer only)
```

### Cancel Interview

```
DELETE /api/applications/:id/interview
Authorization: Bearer <token>  (Employer only)
```

### Get Interview Join Context

```
GET /api/applications/:id/interview-join-context
Authorization: Bearer <token>
```

Get Jitsi video interview room details.

### Withdraw Application (Job Seeker)

```
PATCH /api/applications/:id/withdraw
Authorization: Bearer <token>  (Job Seeker only)
```

**Request Body:**

```json
{
  "withdrawalReason": "I accepted another position"
}
```

### Check Application Eligibility

```
GET /api/applications/check/:jobId/:userId
```

Check if a user has an accepted application for a job (public, used for review eligibility).

### Get Job Application Stats (Employer)

```
GET /api/applications/job/:jobId/stats
Authorization: Bearer <token>  (Employer only)
```

---

## Review & Rating System

### Create Review

```
POST /api/reviews
Authorization: Bearer <token>
```

Submit a review after job completion. Requires accepted application.

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

### Get Review by ID

```
GET /api/reviews/:id
```

### Update Review

```
PUT /api/reviews/:id
Authorization: Bearer <token>
```

Update own review (within 7 days of creation; rating locked after 24 hours).

### Delete Review

```
DELETE /api/reviews/:id
Authorization: Bearer <token>
```

Soft delete own review.

### Get Reviews for User

```
GET /api/reviews/user/:userId?reviewerType=job_seeker&page=1&limit=20
```

### Get Reviews for Job

```
GET /api/reviews/job/:jobId
```

### Get User Rating Statistics

```
GET /api/reviews/stats/:userId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "stats": {
      "averageRating": 4.5,
      "totalReviews": 12,
      "ratingDistribution": { "5": 6, "4": 4, "3": 2, "2": 0, "1": 0 },
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

### Report Review

```
POST /api/reviews/:id/report
Authorization: Bearer <token>
```

Report inappropriate review. Reviews with 3+ reports are automatically flagged.

### Get Employer Reviews

```
GET /api/reviews/employer/:employerId
```

### Get Job Seeker Reviews

```
GET /api/reviews/jobseeker/:jobSeekerId
```

### Get Sent Reviews

```
GET /api/reviews/sent/:userId
```

---

## Admin Management

### Get Platform Statistics

```
GET /api/admin/stats
Authorization: Bearer <token>  (Admin only)
```

### List All Users

```
GET /api/admin/users
Authorization: Bearer <token>  (Admin only)
```

### Update User

```
PUT /api/admin/users/:userId
Authorization: Bearer <token>  (Admin only)
```

### List All Jobs

```
GET /api/admin/jobs
Authorization: Bearer <token>  (Admin only)
```

### Update Job

```
PUT /api/admin/jobs/:jobId
Authorization: Bearer <token>  (Admin only)
```

---

## File Upload

### Upload File

```
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Upload file to Cloudinary (CVs, profile images, review images).

### Get Signed Download URL

```
GET /api/upload/signed-url?publicId=...
Authorization: Bearer <token>
```

---

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
- `204` - No Content
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate entries)
- `500` - Internal Server Error

## API Documentation (Swagger)

Interactive API documentation is available at:

```
GET /api-docs          # Swagger UI
GET /api-docs/swagger.json  # Raw OpenAPI 3.0 spec
```

Postman collections are also available in the `postman/` directory.

## Environment Variables

| Variable                | Description                               | Default                                |
| ----------------------- | ----------------------------------------- | -------------------------------------- |
| `NODE_ENV`              | Environment (development/production/test) | development                            |
| `PORT`                  | Server port                               | 3000                                   |
| `MONGODB_URI`           | MongoDB connection string                 | mongodb://localhost:27017/jobloom      |
| `MONGO_TEST_URI`        | MongoDB test database connection string   | mongodb://localhost:27017/jobloom-test |
| `JWT_SECRET`            | Secret key for JWT token generation       | _(must set in production)_             |
| `JWT_EXPIRES_IN`        | JWT token expiration time                 | 7d                                     |
| `BCRYPT_ROUNDS`         | Number of bcrypt hashing rounds           | 10                                     |
| `LOG_LEVEL`             | Winston log level (error/warn/info/debug) | info                                   |
| `ALLOWED_ORIGINS`       | CORS allowed origins (comma-separated)    | \* (development)                       |
| `FRONTEND_URL`          | Frontend application URL                  | http://localhost:5173                  |
| `JITSI_DOMAIN`          | Jitsi video conference domain             | meet.jit.si                            |
| `TEXT_LK_API_BASE_URL`  | Text.lk SMS API base URL                  | _(required for SMS)_                   |
| `TEXT_LK_API_TOKEN`     | Text.lk API token                         | _(required for SMS)_                   |
| `TEXT_LK_SENDER_ID`     | SMS sender ID                             | JobLoom                                |
| `COHERE_API_KEY`        | Cohere AI API key                         | _(required for AI features)_           |
| `COHERE_API_BASE_URL`   | Cohere API base URL                       | https://api.cohere.com/v2              |
| `COHERE_MODEL`          | Cohere model name                         | command-a-vision-07-2025               |
| `SMTP_HOST`             | Email SMTP host                           | smtp.gmail.com                         |
| `SMTP_PORT`             | Email SMTP port                           | 587                                    |
| `SMTP_USER`             | Email SMTP username                       | _(required for email)_                 |
| `SMTP_PASS`             | Email SMTP password                       | _(required for email)_                 |
| `SMTP_FROM_NAME`        | Email sender name                         | JobLoom                                |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                     | _(required for uploads)_               |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                        | _(required for uploads)_               |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                     | _(required for uploads)_               |

## Deployment

### Backend Deployment (Railway)

The backend API is deployed on **Render** using Docker containers.

**Platform:** [Render](https://render.com/)

**Setup Steps:**

1. Connect your GitHub repository to Render
2. Render auto-detects the `Dockerfile` and builds the production image
3. Configure environment variables in Render dashboard (all variables from `.env.example`)
4. Render provides a public URL for the deployed API

**Docker Configuration:**

- Multi-stage `Dockerfile` with optimized production build
- Non-root user for security
- Health check endpoints (`/health`, `/healthz`, `/ready`)

**Environment Variables (Railway Dashboard):**

Set all variables listed in the Environment Variables table above. Secrets like `JWT_SECRET`, `MONGODB_URI`, API keys, and SMTP credentials must be configured in the Railway dashboard — never committed to source.

**Live URLs:**

- Deployed Backend API: `https://jobloom.be.dilzhan.com`
- Swagger Documentation: `https://jobloom.be.dilzhan.com/api-docs`

### Frontend Deployment (AWS EC2)

See the [Frontend README](https://github.com/Y3-S2-SE-SLIIT-Group-Projects/JobLoom-App) for frontend deployment details.

**Live URLs:**

- Deployed Frontend: `https://jobloom.dilzhan.com`

## Scripts

| Command                          | Description                                           |
| -------------------------------- | ----------------------------------------------------- |
| `npm start`                      | Start the server in production mode                   |
| `npm run dev`                    | Start the server in development mode with auto-reload |
| `npm test`                       | Run all tests with coverage                           |
| `npm run test:unit`              | Run unit tests only                                   |
| `npm run test:integration`       | Run integration tests only                            |
| `npm run test:e2e`               | Run Playwright E2E tests                              |
| `npm run test:performance`       | Run k6 performance/load tests                         |
| `npm run test:performance:jobs`  | Run k6 job API load test                              |
| `npm run test:performance:users` | Run k6 user API load test                             |
| `npm run test:watch`             | Run tests in watch mode                               |
| `npm run test:docker`            | Run integration tests with Docker MongoDB             |
| `npm run test:setup`             | Start test MongoDB in Docker                          |
| `npm run test:teardown`          | Stop test MongoDB container                           |
| `npm run lint`                   | Run ESLint                                            |
| `npm run lint:fix`               | Fix ESLint errors automatically                       |
| `npm run format`                 | Format code with Prettier                             |
| `npm run format:check`           | Check code formatting                                 |
| `npm run seed:basic`             | Seed basic users and jobs                             |
| `npm run seed:admin`             | Seed admin user                                       |

## Testing

### Quick Start

```bash
# Unit tests only (no setup required)
npm run test:unit

# All tests (requires MongoDB)
npm test
```

### Test Pyramid

| Type        | Count          | Command                    | Dependencies                  |
| ----------- | -------------- | -------------------------- | ----------------------------- |
| Unit        | 6 test files   | `npm run test:unit`        | None (uses in-memory MongoDB) |
| Integration | 4 test files   | `npm run test:integration` | MongoDB                       |
| E2E         | 1 spec file    | `npm run test:e2e`         | Running server                |
| Performance | 2 load scripts | `npm run test:performance` | k6 + running server           |

### Running All Test Types

```bash
# 1. Unit tests (fast, no dependencies)
npm run test:unit

# 2. Integration tests (requires MongoDB)
npm run test:integration

# 3. Performance tests (requires k6 + running server)
npm run dev  # in one terminal
npm run test:performance  # in another terminal
```

### Test Coverage

Coverage is collected automatically with `npm test` and reports are generated in the `coverage/` directory.

For detailed testing documentation, see [docs/TESTING.md](docs/TESTING.md).

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

## Development Guidelines

### Adding New Routes

1. Create a new folder in `src/modules/` for your feature
2. Create model, controller, service, routes, and validation files
3. Register the route in `src/routes/index.js`

## License

ISC

## Contributors

SLIIT Group Project - Year 3 Semester 2
