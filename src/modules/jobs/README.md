# 📋 Job Module — Complete Documentation

> **Module Path:** `src/modules/jobs/`
> **Base Route:** `/api/jobs`
> **Version:** 1.0.0

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Module Architecture](#module-architecture)
3. [File Structure](#file-structure)
4. [Technologies & Dependencies](#technologies--dependencies)
5. [Data Model / Schema](#data-model--schema)
6. [API Endpoints](#api-endpoints)
7. [Service Layer — Business Logic](#service-layer--business-logic)
8. [Validation Rules](#validation-rules)
9. [Middleware Pipeline](#middleware-pipeline)
10. [Model Features](#model-features)
11. [Performance Indexes](#performance-indexes)
12. [Error Handling](#error-handling)
13. [Testing](#testing)
14. [Future Enhancements](#future-enhancements)

---

## Overview

The **Job Module** is the core component of the JobLoom platform. It manages the complete lifecycle of rural employment job postings — from creation by employers to discovery by job seekers.

### Key Capabilities

| Feature                   | Description                                   |
| ------------------------- | --------------------------------------------- |
| **Job Posting**           | Employers create and manage job listings      |
| **Job Discovery**         | Job seekers browse, search, and filter jobs   |
| **Geospatial Search**     | Find nearby jobs using MongoDB `$near`        |
| **Smart Recommendations** | Match jobs to user skills                     |
| **Employer Dashboard**    | Stats and analytics for employers             |
| **Soft Delete**           | Jobs are deactivated, not permanently removed |
| **Status Lifecycle**      | `open` → `closed` / `filled`                  |

---

## Module Architecture

The module follows a **layered MVC architecture**:

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────────────────────┐
│                    job.routes.js                    │  ← Route definitions + middleware chain
│   protect → authorize → validate → controller      │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                  job.controller.js                  │  ← HTTP handlers, req/res only
│         Extracts params → calls service             │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                   job.service.js                    │  ← Business logic, validations, rules
│      Coordinates cleaning, authorization checks     │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                    job.model.js                     │  ← Mongoose schema, hooks, methods
│    Schema, virtuals, statics, instance methods      │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
                  MongoDB
```

---

## File Structure

```
src/modules/jobs/
├── job.routes.js       ← Express router (11 routes)
├── job.controller.js   ← Request handlers (11 controllers)
├── job.service.js      ← Business logic (13 service functions)
├── job.model.js        ← Mongoose schema + model (527 lines)
├── job.validation.js   ← express-validator rules (7 validators)
└── README.md           ← This file
```

### Related Files

```
tests/
├── unit/
│   └── job.service.test.js          ← 48 unit tests (Jest)
├── integration/
│   └── job.routes.test.js           ← Integration tests (Supertest)
└── performance/
    └── job.load.js                  ← Load tests (k6)

src/swagger/
└── job.swagger.js                   ← OpenAPI 3.0 documentation

postman/
├── JobLoom API.postman_collection.json  ← Postman collection
└── JOB_POSTMAN_TESTING_GUIDE.md        ← Testing guide
```

---

## Technologies & Dependencies

### Core Technologies

| Technology     | Version | Purpose                                 |
| -------------- | ------- | --------------------------------------- |
| **Node.js**    | ≥18.x   | Runtime environment                     |
| **Express.js** | ^4.x    | HTTP framework and routing              |
| **MongoDB**    | ≥6.x    | Primary database (NoSQL)                |
| **Mongoose**   | ^8.x    | MongoDB ODM — schema, validation, hooks |

### Key Libraries

| Library                | Purpose                | Used In             |
| ---------------------- | ---------------------- | ------------------- |
| `express-validator`    | Request validation     | `job.validation.js` |
| `mongoose`             | Schema, queries, hooks | `job.model.js`      |
| `winston` (via logger) | Structured logging     | `job.service.js`    |

### MongoDB Features Used

| Feature                        | How Used                                                       |
| ------------------------------ | -------------------------------------------------------------- |
| **GeoJSON / 2dsphere index**   | Geospatial nearby job search                                   |
| **Text indexes**               | Full-text search on `title` and `description`                  |
| **Compound indexes**           | Fast filtering by category+status, employer+status             |
| **`$near` operator**           | Nearby job search from coordinates                             |
| **`$text` / `$search`**        | Text search across title and description                       |
| **Aggregation (`$aggregate`)** | Employer stats — sum of applicantsCount                        |
| **`Promise.all`**              | Parallel queries for pagination + count                        |
| **Virtuals**                   | Computed fields: `formattedSalary`, `employer`, `applications` |
| **Pre-save hooks**             | Coordinate validation and cleanup before saving                |
| **Soft delete**                | `isActive: false` instead of removing documents                |

### Middleware Used

| Middleware  | File                       | Purpose                                                |
| ----------- | -------------------------- | ------------------------------------------------------ |
| `protect`   | `authMiddleware.js`        | JWT authentication — verifies Bearer token             |
| `authorize` | `roleMiddleware.js`        | Role-based access control (employer only)              |
| `validate`  | `validation.middleware.js` | Runs express-validator results, returns 400 on failure |

---

## Data Model / Schema

### Schema Fields

```javascript
const jobSchema = new Schema({
  employerId, // ObjectId → ref: 'User' (required, indexed)
  title, // String, 3-100 chars
  description, // String, 20-2000 chars
  category, // Enum — 48 categories
  jobRole, // String, 2-100 chars
  employmentType, // Enum — 7 types
  location: {
    village, // String
    district, // String
    province, // String
    coordinates: {
      // GeoJSON Point (optional)
      type: 'Point',
      coordinates: [longitude, latitude],
    },
    fullAddress, // String
  },
  salaryType, // Enum: daily | weekly | monthly | contract
  salaryAmount, // Number ≥ 0
  currency, // Enum: LKR | USD (default: LKR)
  skillsRequired, // [String]
  experienceRequired, // Enum: none | beginner | intermediate | advanced | expert
  positions, // Number 1-100 (default: 1)
  startDate, // Date
  endDate, // Date (must be after startDate)
  status, // Enum: open | closed | filled (default: open)
  applicantsCount, // Number ≥ 0 (default: 0)
  isActive, // Boolean (default: true) — soft delete flag
  createdAt, // Date (auto by timestamps)
  updatedAt, // Date (auto by timestamps)
});
```

### Job Categories (48 total)

Organized by sector:

| Sector                 | Categories                                                      |
| ---------------------- | --------------------------------------------------------------- |
| **Agriculture**        | agriculture, farming, livestock, fishing                        |
| **Construction**       | construction, carpentry, masonry, plumbing, electrical, welding |
| **Manufacturing**      | manufacturing, factory_work, assembly                           |
| **Food & Hospitality** | food_service, cooking, catering, hospitality                    |
| **Commerce**           | retail, sales, customer_service                                 |
| **Transport**          | transportation, driving, delivery, logistics                    |
| **Domestic**           | cleaning, maintenance, janitorial                               |
| **Security**           | security, guard_services                                        |
| **Fashion**            | tailoring, textiles, garment_making                             |
| **Beauty**             | beauty_services, salon, spa                                     |
| **Education**          | education, teaching, tutoring                                   |
| **Healthcare**         | healthcare, nursing, caregiving                                 |
| **Technology**         | IT, technology, software                                        |
| **General**            | general_labor, manual_labor, other                              |

### Employment Types

`full-time` | `part-time` | `contract` | `temporary` | `internship` | `seasonal` | `freelance`

### Salary Types

`daily` | `weekly` | `monthly` | `contract`

### Job Status Lifecycle

```
Created
   │
   ▼
 open  ──────────────── close() ──────────────► closed
   │
   └─────────────────── markAsFilled() ──────── filled
   │
   └─────────────────── deleteJob() ───────────  isActive: false
```

### GeoJSON Location Format

```json
{
  "location": {
    "village": "Horana",
    "district": "Kalutara",
    "province": "Western",
    "fullAddress": "Horana, Kalutara District",
    "coordinates": {
      "type": "Point",
      "coordinates": [80.0626, 6.7153]
    }
  }
}
```

> ⚠️ **Note:** Coordinates must be `[longitude, latitude]` order, **not** `[latitude, longitude]`.

---

## API Endpoints

### Summary Table

| Method   | Route                        | Access   | Description                              |
| -------- | ---------------------------- | -------- | ---------------------------------------- |
| `GET`    | `/api/jobs`                  | Public   | Get all jobs with filtering & pagination |
| `GET`    | `/api/jobs/nearby`           | Public   | Geospatial nearby job search             |
| `GET`    | `/api/jobs/recommendations`  | Private  | Skill-based job recommendations          |
| `GET`    | `/api/jobs/:id`              | Public   | Get single job by ID                     |
| `POST`   | `/api/jobs`                  | Employer | Create a new job posting                 |
| `GET`    | `/api/jobs/employer/my-jobs` | Employer | Get own job listings                     |
| `GET`    | `/api/jobs/employer/stats`   | Employer | Dashboard statistics                     |
| `PUT`    | `/api/jobs/:id`              | Employer | Update job details                       |
| `PATCH`  | `/api/jobs/:id/close`        | Employer | Close job posting                        |
| `PATCH`  | `/api/jobs/:id/filled`       | Employer | Mark job as filled                       |
| `DELETE` | `/api/jobs/:id`              | Employer | Soft delete a job                        |

---

### `GET /api/jobs` — Get All Jobs

**Access:** Public | **Auth:** None required

**Query Parameters:**

| Parameter    | Type    | Default     | Description                                                   |
| ------------ | ------- | ----------- | ------------------------------------------------------------- |
| `page`       | integer | `1`         | Page number                                                   |
| `limit`      | integer | `20`        | Results per page (max: 100)                                   |
| `category`   | string  | —           | Filter by job category                                        |
| `status`     | string  | —           | `open` \| `closed` \| `filled`                                |
| `search`     | string  | —           | Full-text search in title & description                       |
| `minSalary`  | number  | —           | Minimum salary amount                                         |
| `maxSalary`  | number  | —           | Maximum salary amount                                         |
| `salaryType` | string  | —           | `daily` \| `weekly` \| `monthly` \| `contract`                |
| `district`   | string  | —           | Filter by district (regex, case-insensitive)                  |
| `province`   | string  | —           | Filter by province (regex, case-insensitive)                  |
| `sortBy`     | string  | `createdAt` | `createdAt` \| `salaryAmount` \| `title` \| `applicantsCount` |
| `sortOrder`  | string  | `desc`      | `asc` \| `desc`                                               |

**Response:**

```json
{
  "success": true,
  "message": "Jobs retrieved successfully",
  "data": {
    "jobs": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 47,
      "limit": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### `GET /api/jobs/nearby` — Nearby Jobs (Geospatial)

**Access:** Public | **Auth:** None required

**Query Parameters:**

| Parameter | Type  | Required | Description                                  |
| --------- | ----- | -------- | -------------------------------------------- |
| `lat`     | float | ✅       | Latitude (-90 to 90)                         |
| `lng`     | float | ✅       | Longitude (-180 to 180)                      |
| `radius`  | float | ❌       | Search radius in km (default: 50, max: 1000) |

**How It Works:**

1. Validates lat/lng coordinates
2. Converts radius from km to meters (`radius * 1000`)
3. Queries MongoDB using `$near` with `$geometry` GeoJSON Point
4. Returns jobs sorted by distance (nearest first)
5. Only returns `open` and `isActive: true` jobs

**Response:**

```json
{
  "success": true,
  "message": "Found 5 jobs within 50km",
  "data": {
    "jobs": [...]
  }
}
```

> ⚠️ **Important:** The geospatial index `jobSchema.index({ 'location.coordinates': '2dsphere' })` must be **enabled** for this to work efficiently.

---

### `GET /api/jobs/recommendations` — Recommended Jobs

**Access:** Private | **Auth:** JWT token required

**How It Works:**

1. Gets the authenticated user's `skills` array
2. If no skills → returns 10 latest open jobs
3. If has skills → finds jobs where `skillsRequired` contains at least one user skill (regex, case-insensitive)
4. Returns up to 20 matches sorted by newest

---

### `GET /api/jobs/:id` — Get Single Job

**Access:** Public | **Auth:** None required

**Behavior:**

- Returns only active jobs (`isActive: true`)
- Throws `400 Bad Request` for invalid MongoDB ObjectId format
- Throws `404 Not Found` if job doesn't exist or is soft-deleted

---

### `POST /api/jobs` — Create Job

**Access:** Employer only | **Auth:** JWT token (employer role)

**Request Body:**

```json
{
  "title": "Rice Paddy Harvester Needed",
  "description": "Looking for experienced workers for seasonal harvest...",
  "category": "agriculture",
  "employmentType": "seasonal",
  "salaryAmount": 1500,
  "salaryType": "daily",
  "currency": "LKR",
  "positions": 5,
  "skillsRequired": ["farming", "harvesting"],
  "experienceRequired": "beginner",
  "location": {
    "village": "Horana",
    "district": "Kalutara",
    "province": "Western",
    "fullAddress": "Horana, Kalutara District",
    "coordinates": {
      "type": "Point",
      "coordinates": [80.0626, 6.7153]
    }
  },
  "startDate": "2026-03-01",
  "endDate": "2026-04-30"
}
```

**Coordinate Cleaning Logic:**
The service performs **multi-layer coordinate validation** before saving:

1. Removes coordinates if array is missing or empty
2. Removes if not exactly `[longitude, latitude]` (2 elements)
3. Removes if values are not valid numbers or `NaN`
4. Removes if out of range (lon: -180 to 180, lat: -90 to 90)
5. Pre-save Mongoose hook performs a final cleanup pass

---

### `GET /api/jobs/employer/my-jobs` — Employer's Jobs

**Access:** Employer only | **Auth:** JWT token (employer role)

**Query Parameters:**

| Parameter         | Type    | Description                                  |
| ----------------- | ------- | -------------------------------------------- |
| `status`          | string  | Filter by `open` \| `closed` \| `filled`     |
| `includeInactive` | boolean | Include soft-deleted jobs (default: `false`) |

---

### `GET /api/jobs/employer/stats` — Dashboard Statistics

**Access:** Employer only | **Auth:** JWT token (employer role)

**Response:**

```json
{
  "success": true,
  "data": {
    "totalJobs": 10,
    "openJobs": 5,
    "closedJobs": 3,
    "filledJobs": 2,
    "totalApplicants": 47
  }
}
```

**How It Works:** Uses `Promise.all` to run 5 parallel MongoDB queries for maximum performance.

---

### `PUT /api/jobs/:id` — Update Job

**Access:** Employer only | **Auth:** JWT token (employer role)

**Business Rules:**

- Must be the job's owner (`employerId` must match)
- Job must be active (`isActive: true`)
- Cannot change `employerId`, `createdAt`
- All fields are optional (partial update supported)

---

### `PATCH /api/jobs/:id/close` — Close Job

**Access:** Employer only | **Auth:** JWT token (employer role)

- Calls `job.closeJob()` instance method
- Sets `status` to `'closed'`
- Job no longer appears in open job searches
- Existing applications are preserved

---

### `PATCH /api/jobs/:id/filled` — Mark as Filled

**Access:** Employer only | **Auth:** JWT token (employer role)

- Calls `job.markAsFilled()` instance method
- Sets `status` to `'filled'`
- Indicates all positions have been successfully filled
- Enables reviews between employer and workers

---

### `DELETE /api/jobs/:id` — Delete Job (Soft Delete)

**Access:** Employer only | **Auth:** JWT token (employer role)

**Business Rules:**

- Must be the job's owner
- **Cannot delete if `applicantsCount > 0`** — close the job instead
- Sets `isActive: false` (soft delete — data is retained)
- Job is hidden from all public searches

---

## Service Layer — Business Logic

### Functions

| Function             | Parameters                        | Returns                       | Description                                     |
| -------------------- | --------------------------------- | ----------------------------- | ----------------------------------------------- |
| `createJob`          | `(jobData, employerId)`           | `Promise<Job>`                | Creates job with multi-layer coordinate cleanup |
| `getJobById`         | `(jobId)`                         | `Promise<Job>`                | Finds active job, handles CastError             |
| `getAllJobs`         | `(options)`                       | `Promise<{jobs, pagination}>` | Filtered, paginated job listing                 |
| `getJobsByEmployer`  | `(employerId, options)`           | `Promise<Job[]>`              | Employer's own jobs                             |
| `getNearbyJobs`      | `(longitude, latitude, radiusKm)` | `Promise<Job[]>`              | Geospatial search                               |
| `searchJobs`         | `(searchText)`                    | `Promise<Job[]>`              | Full-text search                                |
| `getRecommendedJobs` | `(user)`                          | `Promise<Job[]>`              | Skill-matched recommendations                   |
| `getEmployerStats`   | `(employerId)`                    | `Promise<Object>`             | Dashboard statistics (parallel queries)         |
| `updateJob`          | `(jobId, employerId, updateData)` | `Promise<Job>`                | Update with ownership check                     |
| `closeJob`           | `(jobId, employerId)`             | `Promise<Job>`                | Close with ownership check                      |
| `markJobAsFilled`    | `(jobId, employerId)`             | `Promise<Job>`                | Mark filled with ownership check                |
| `deleteJob`          | `(jobId, employerId)`             | `Promise<Job>`                | Soft delete with applicants check               |
| `hardDeleteJob`      | `(jobId)`                         | `Promise<Job>`                | Permanent delete (admin only, future use)       |

---

## Validation Rules

Built with **express-validator**. All validations are optional unless noted.

### Create / Update Job Validation

| Field                              | Rules                                                            |
| ---------------------------------- | ---------------------------------------------------------------- |
| `title`                            | 3–100 characters                                                 |
| `description`                      | 20–2000 characters                                               |
| `category`                         | Must be from 48 valid categories                                 |
| `jobRole`                          | 2–100 characters                                                 |
| `employmentType`                   | Must be from 7 valid types                                       |
| `location.village`                 | String                                                           |
| `location.district`                | String                                                           |
| `location.province`                | String                                                           |
| `location.coordinates.coordinates` | Array of exactly 2 floats `[lng, lat]`                           |
| `salaryType`                       | `daily` \| `weekly` \| `monthly` \| `contract`                   |
| `salaryAmount`                     | Float ≥ 0                                                        |
| `currency`                         | `LKR` \| `USD`                                                   |
| `skillsRequired`                   | Array of strings                                                 |
| `experienceRequired`               | `none` \| `beginner` \| `intermediate` \| `advanced` \| `expert` |
| `positions`                        | Integer 1–100                                                    |
| `startDate`                        | ISO 8601 date                                                    |
| `endDate`                          | ISO 8601 date                                                    |

### Query Validation (GET /api/jobs)

| Parameter   | Rules                                                         |
| ----------- | ------------------------------------------------------------- |
| `page`      | Integer ≥ 1                                                   |
| `limit`     | Integer 1–100                                                 |
| `sortBy`    | `createdAt` \| `salaryAmount` \| `title` \| `applicantsCount` |
| `sortOrder` | `asc` \| `desc`                                               |

### Nearby Jobs Validation

| Parameter | Rules                           |
| --------- | ------------------------------- |
| `lat`     | **Required**, Float -90 to 90   |
| `lng`     | **Required**, Float -180 to 180 |
| `radius`  | Optional, Float 1–1000          |

---

## Middleware Pipeline

### Public Route Example

```
GET /api/jobs
  └── getJobsValidation  → express-validator rules for query params
  └── validate           → checks validation errors, returns 400 if any
  └── getAllJobs          → controller handler
```

### Protected Route Example

```
POST /api/jobs
  └── protect            → verify JWT token → attach req.user
  └── authorize('employer') → check req.user.role === 'employer'
  └── createJobValidation → validate request body
  └── validate           → return 400 on validation errors
  └── createJob          → controller handler
```

---

## Model Features

### Virtual Fields

| Virtual           | Type      | Description                                    |
| ----------------- | --------- | ---------------------------------------------- |
| `employer`        | Populated | Full employer `User` document via `employerId` |
| `applications`    | Populated | All `Application` documents for this job       |
| `formattedSalary` | Computed  | e.g., `"LKR 1,500 / daily"`                    |

### Instance Methods

| Method                      | Description                                                   |
| --------------------------- | ------------------------------------------------------------- |
| `isAcceptingApplications()` | Returns `true` if `status === 'open'` and `isActive === true` |
| `closeJob()`                | Sets `status = 'closed'` and saves                            |
| `markAsFilled()`            | Sets `status = 'filled'` and saves                            |
| `incrementApplicants()`     | Increments `applicantsCount` by 1 and saves                   |
| `decrementApplicants()`     | Decrements `applicantsCount` by 1 (min 0) and saves           |

### Static Methods

| Method                                | Description                                           |
| ------------------------------------- | ----------------------------------------------------- |
| `findByEmployer(employerId, options)` | Finds all jobs by employer, optional inactive include |
| `findActive()`                        | Finds all open and active jobs                        |
| `findByCategory(category)`            | Finds open jobs by category                           |
| `searchJobs(searchText)`              | Full-text search, sorted by relevance score           |
| `findNearby(lng, lat, maxDistance)`   | `$near` geospatial query, returns sorted by distance  |

### Query Helpers

```javascript
Job.find().active(); // where isActive: true
Job.find().byStatus('open'); // where status: 'open'
Job.find().byCategory('farming'); // where category: 'farming'
```

### Pre-Save Hook

Automatically runs before every `save()` call:

1. **Coordinate cleanup** — removes invalid/empty GeoJSON coordinates using multiple removal strategies (set undefined, delete, `markModified`)
2. **Date validation** — optional start date enforcement (configurable)

---

## Performance Indexes

```javascript
// Geospatial (enable when coordinates are populated)
// jobSchema.index({ 'location.coordinates': '2dsphere' }); // ← Currently commented out

// Text search
jobSchema.index({ title: 'text', description: 'text' });

// Compound indexes for common queries
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ employerId: 1, status: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ salaryAmount: -1 });
jobSchema.index({ isActive: 1, status: 1 });

// Single field indexes (auto)
jobSchema.index({ employerId: 1 });
jobSchema.index({ title: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ employmentType: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ isActive: 1 });
```

> ⚠️ **Action Required:** Uncomment the `2dsphere` index when location coordinates are consistently populated to enable efficient geospatial search.

---

## Error Handling

All service functions use try/catch and throw typed exceptions:

### Exception Types

| Exception             | HTTP Code | When Thrown                                                                         |
| --------------------- | --------- | ----------------------------------------------------------------------------------- |
| `BadRequestException` | 400       | Invalid coordinates, invalid ID format, ownership violation, delete with applicants |
| `NotFoundException`   | 404       | Job not found, inactive job                                                         |

### Mongoose CastError

```javascript
// In getJobById:
if (error.name === 'CastError') {
  throw new BadRequestException('Invalid job ID format');
}
```

### Controller Error Handling

All controllers are **unwrapped** — errors bubble up to the global error handler defined in `server.js`. Controllers do not have try/catch because the global handler manages all uncaught errors.

### Response Utilities

```javascript
// 200 OK
sendSuccess(res, 'Jobs retrieved successfully', data);

// 201 Created
sendCreated(res, 'Job created successfully', job);
```

---

## Testing

### Test Coverage

| Test Type             | File                                   | Tests         | Status         |
| --------------------- | -------------------------------------- | ------------- | -------------- |
| **Unit Tests**        | `tests/unit/job.service.test.js`       | 48            | ✅ All Passing |
| **Integration Tests** | `tests/integration/job.routes.test.js` | In progress   | 🔄             |
| **Performance Tests** | `tests/performance/job.load.js`        | k6 load tests | ✅ Written     |

### Running Tests

```bash
# Run all unit tests
npm run test:unit

# Run only job service tests
npm test tests/unit/job.service.test.js

# Run integration tests (requires MongoDB)
npm run test:integration

# Run all tests with coverage
npm run test:coverage
```

### Key Unit Test Cases

| Service Function     | Scenarios Tested                                                          |
| -------------------- | ------------------------------------------------------------------------- |
| `createJob`          | Success, coordinates cleanup, logger calls                                |
| `getJobById`         | Success, not found (404), invalid ID (CastError → 400)                    |
| `getAllJobs`         | Default params, category filter, salary range, text search, pagination    |
| `getNearbyJobs`      | Success, missing coordinates (400), invalid coordinates (400)             |
| `getEmployerStats`   | Returns all 5 stat fields correctly                                       |
| `updateJob`          | Success, not found (404), ownership violation (400), inactive job (400)   |
| `closeJob`           | Success, not found (404), ownership violation (400)                       |
| `markJobAsFilled`    | Success, not found (404), ownership violation (400)                       |
| `deleteJob`          | Success, not found (404), ownership violation (400), has applicants (400) |
| `getRecommendedJobs` | With skills, without skills (returns latest)                              |

### Mock Strategy

Unit tests use **ES6 class mocks** with `jest.unstable_mockModule` for Mongoose models:

```javascript
// MockJob class with proper instance methods
class MockJob {
  save = jest.fn().mockResolvedValue(this);
  closeJob = jest.fn();
  markAsFilled = jest.fn();

  static findById = jest.fn();
  static find = jest.fn();
  static countDocuments = jest.fn();
  static aggregate = jest.fn();
}
```

---

## Future Enhancements

### Planned Features

| Feature                   | Priority | Description                                                      |
| ------------------------- | -------- | ---------------------------------------------------------------- |
| **Google Maps Geocoding** | High     | Convert address text → coordinates on job creation               |
| **Enable 2dsphere Index** | High     | Uncomment geospatial index for optimal nearby search performance |
| **Job Expiry**            | Medium   | Auto-close jobs after `endDate` passes (cron job)                |
| **Job Boost / Featured**  | Medium   | Paid featured listings via PayHere integration                   |
| **AI Job Descriptions**   | Medium   | OpenAI API auto-generates job descriptions                       |
| **Push Notifications**    | Medium   | Firebase FCM alerts when matching jobs are posted                |
| **WhatsApp Alerts**       | Low      | Twilio WhatsApp job notifications                                |
| **Weather Integration**   | Low      | OpenWeatherMap for outdoor/farm job advisories                   |
| **Hard Delete (Admin)**   | Low      | `hardDeleteJob()` is implemented, needs admin route              |
| **Job Sharing**           | Low      | Share job links, QR codes for physical boards                    |
| **Multi-language**        | Low      | Google Translate for Sinhala/Tamil job posts                     |

### Architectural TODOs

```javascript
// job.model.js — Line 272
// TODO: Uncomment this when Mapbox integration is complete and coordinates are populated
// jobSchema.index({ 'location.coordinates': '2dsphere' });
```

---

## API Quick Reference

```bash
# ── PUBLIC ──────────────────────────────────────────────
GET    /api/jobs                          # List all jobs
GET    /api/jobs/nearby?lat=&lng=&radius= # Nearby jobs
GET    /api/jobs/recommendations          # Skill-matched (auth)
GET    /api/jobs/:id                      # Single job

# ── EMPLOYER (requires Bearer token + employer role) ────
POST   /api/jobs                          # Create job
GET    /api/jobs/employer/my-jobs         # My job listings
GET    /api/jobs/employer/stats           # Dashboard stats
PUT    /api/jobs/:id                      # Update job
PATCH  /api/jobs/:id/close                # Close job
PATCH  /api/jobs/:id/filled               # Mark as filled
DELETE /api/jobs/:id                      # Soft delete
```

---

## Environment Variables

| Variable                   | Required | Description                   |
| -------------------------- | -------- | ----------------------------- |
| `MONGODB_URI`              | ✅       | MongoDB connection string     |
| `JWT_SECRET`               | ✅       | JWT signing secret            |
| `JWT_EXPIRES_IN`           | ✅       | Token expiry (e.g., `7d`)     |
| `VITE_GOOGLE_MAPS_API_KEY` | Future   | Google Maps Geocoding API key |

---

_Last Updated: February 27, 2026_
_Author: JobLoom Development Team_
