# 📝 Application Module — Complete Documentation

> **Module Path:** `src/modules/applications/`
> **Base Route:** `/api/applications`
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
11. [Status Lifecycle](#status-lifecycle)
12. [Error Handling](#error-handling)
13. [Testing](#testing)
14. [Future Enhancements](#future-enhancements)

---

## Overview

The **Application Module** manages the complete job application workflow on the JobLoom platform — from job seekers applying to jobs through employer review, shortlisting, and hiring decisions.

### Key Capabilities

| Feature                  | Description                                                            |
| ------------------------ | ---------------------------------------------------------------------- |
| **Apply for Jobs**       | Job seekers submit applications with cover letter                      |
| **Application Tracking** | Job seekers view and manage their applications                         |
| **Employer Review**      | Employers review, shortlist, accept, or reject                         |
| **Interview Scheduling** | Employers schedule interview dates                                     |
| **Status Workflow**      | `pending` → `reviewed` → `shortlisted` → `accepted`/`rejected`         |
| **Withdrawal**           | Job seekers can withdraw pending/reviewed apps                         |
| **Dashboard Stats**      | Aggregate counts by status for employer dashboard                      |
| **Review Eligibility**   | Public check endpoint for Review module integration                    |
| **Soft Delete**          | Applications are deactivated, not permanently removed                  |
| **Privacy**              | Employer notes hidden from seekers; seeker notes hidden from employers |

---

## Module Architecture

The module follows a **layered MVC architecture**:

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────────────────────┐
│              application.routes.js                  │  ← Route definitions + middleware chain
│   protect → requireJobSeeker/requireEmployer →      │
│   validate → controller                             │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│             application.controller.js               │  ← HTTP handlers, req/res only
│         Extracts params → calls service             │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              application.service.js                  │  ← Business logic, validations, rules
│      Coordinates authorization, status transitions  │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              application.model.js                    │  ← Mongoose schema, hooks, methods
│    Schema, statusHistory, query helpers              │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
                  MongoDB
```

---

## File Structure

```
src/modules/applications/
├── application.routes.js       ← Express router (11 routes)
├── application.controller.js   ← Request handlers (10 controllers)
├── application.service.js      ← Business logic (10 service functions)
├── application.model.js        ← Mongoose schema + model (123 lines)
├── application.validation.js   ← express-validator rules (8 validators)
└── README.md                   ← This file
```

### Related Files

```
tests/
├── unit/
│   └── application.service.test.js    ← 33 unit tests (Jest)
└── integration/
    └── application.routes.test.js     ← Integration tests (Supertest)

src/swagger/
└── application.swagger.js             ← OpenAPI 3.0 documentation

postman/
└── JobLoom API.postman_collection.json ← Postman collection (Applications folder)
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

| Library             | Purpose                | Used In                     |
| ------------------- | ---------------------- | --------------------------- |
| `express-validator` | Request validation     | `application.validation.js` |
| `mongoose`          | Schema, queries, hooks | `application.model.js`      |

### MongoDB Features Used

| Feature                        | How Used                                                  |
| ------------------------------ | --------------------------------------------------------- |
| **Compound unique index**      | Prevents duplicate applications (jobId + jobSeekerId)     |
| **Compound indexes**           | Fast filtering by status, jobId+status, employerId+status |
| **Aggregation (`$aggregate`)** | Stats — count by status for employer dashboard            |
| **`Promise.all`**              | Parallel queries for pagination + count                   |
| **Pre-save hooks**             | Append to statusHistory when status changes               |
| **Soft delete**                | `isActive: false` instead of removing documents           |

### Middleware Used

| Middleware         | File                       | Purpose                                                |
| ------------------ | -------------------------- | ------------------------------------------------------ |
| `protect`          | `authMiddleware.js`        | JWT authentication — verifies Bearer token             |
| `requireJobSeeker` | `role.middleware.js`       | Role-based access control (job seeker only)            |
| `requireEmployer`  | `role.middleware.js`       | Role-based access control (employer only)              |
| `validate`         | `validation.middleware.js` | Runs express-validator results, returns 400 on failure |

---

## Data Model / Schema

### Schema Fields

```javascript
const applicationSchema = new Schema({
  jobId, // ObjectId → ref: 'Job' (required)
  jobSeekerId, // ObjectId → ref: 'User' (required)
  employerId, // ObjectId → ref: 'User' (required, from Job)
  coverLetter, // String, max 1000 chars
  status, // Enum — 6 statuses (default: pending)
  appliedAt, // Date (default: Date.now)
  reviewedAt, // Date (set on first review)
  notes, // String, max 500 — job seeker's private notes
  resumeUrl, // String (optional URL)
  statusHistory, // [{ status, changedAt, changedBy }]
  employerNotes, // String, max 500 — employer's private notes
  interviewDate, // Date (optional)
  withdrawalReason, // String, max 500
  isActive, // Boolean (default: true) — soft delete flag
  createdAt, // Date (auto by timestamps)
  updatedAt, // Date (auto by timestamps)
});
```

### Application Statuses

| Status        | Description                           | Who Can Set |
| ------------- | ------------------------------------- | ----------- |
| `pending`     | Initial state after applying          | System      |
| `reviewed`    | Employer has reviewed the application | Employer    |
| `shortlisted` | Employer shortlisted for interview    | Employer    |
| `accepted`    | Employer accepted — final             | Employer    |
| `rejected`    | Employer rejected — final             | Employer    |
| `withdrawn`   | Job seeker withdrew — final           | Job Seeker  |

---

## API Endpoints

### Summary Table

| Method  | Route                                    | Access     | Description                            |
| ------- | ---------------------------------------- | ---------- | -------------------------------------- |
| `GET`   | `/api/applications/check/:jobId/:userId` | Public     | Check if user has accepted application |
| `POST`  | `/api/applications`                      | Job Seeker | Apply for a job                        |
| `GET`   | `/api/applications/my-applications`      | Job Seeker | Get own applications (paginated)       |
| `GET`   | `/api/applications/job/:jobId`           | Employer   | Get applications for a job             |
| `GET`   | `/api/applications/job/:jobId/stats`     | Employer   | Get application stats for a job        |
| `GET`   | `/api/applications/:id`                  | Private    | Get single application by ID           |
| `PATCH` | `/api/applications/:id/status`           | Employer   | Update application status              |
| `PATCH` | `/api/applications/:id/notes`            | Job Seeker | Update personal notes                  |
| `PATCH` | `/api/applications/:id/interview-date`   | Employer   | Schedule/update interview date         |
| `PATCH` | `/api/applications/:id/withdraw`         | Job Seeker | Withdraw an application                |

---

### `GET /api/applications/check/:jobId/:userId` — Check Application Eligibility

**Access:** Public | **Auth:** None required

**Purpose:** Used by the Review module to verify if a user has an accepted application for a job (i.e., worked together with employer/job seeker).

**Path Parameters:**

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `jobId`   | string | ✅       | Job ID      |
| `userId`  | string | ✅       | User ID     |

**Response:**

```json
{
  "success": true,
  "message": "Application check completed",
  "data": {
    "hasAcceptedApplication": true,
    "application": { "_id": "...", "jobId": "...", ... }
  }
}
```

---

### `POST /api/applications` — Apply for a Job

**Access:** Job Seeker only | **Auth:** JWT token required

**Request Body:**

```json
{
  "jobId": "675c9d4c8e9a1b2c3d4e5f61",
  "coverLetter": "I have 5 years of farming experience and would love to contribute.",
  "resumeUrl": "https://example.com/resume.pdf"
}
```

**Requirements:**

- Job must exist and be `open`
- Cannot apply to your own job posting
- One application per job per user (unique index)

**Response:** `201 Created` with populated application (job, jobSeeker, employer).

---

### `GET /api/applications/my-applications` — Get My Applications

**Access:** Job Seeker only | **Auth:** JWT token required

**Query Parameters:**

| Parameter | Type    | Default      | Description                                 |
| --------- | ------- | ------------ | ------------------------------------------- |
| `status`  | string  | —            | Filter by status                            |
| `page`    | integer | `1`          | Page number                                 |
| `limit`   | integer | `20`         | Results per page (max: 100)                 |
| `sort`    | string  | `-createdAt` | Sort order (e.g. `-createdAt`, `createdAt`) |

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

---

### `GET /api/applications/job/:jobId` — Get Applications for a Job

**Access:** Employer only | **Auth:** JWT token required

**Authorization:** Job must belong to the authenticated employer.

**Query Parameters:** Same as `my-applications` (`status`, `page`, `limit`, `sort`).

---

### `GET /api/applications/job/:jobId/stats` — Get Application Stats

**Access:** Employer only | **Auth:** JWT token required

**Response:**

```json
{
  "success": true,
  "message": "Application stats retrieved successfully",
  "data": {
    "stats": {
      "pending": 5,
      "reviewed": 2,
      "shortlisted": 1,
      "accepted": 2,
      "rejected": 3,
      "withdrawn": 1,
      "total": 14
    }
  }
}
```

---

### `GET /api/applications/:id` — Get Application by ID

**Access:** Job Seeker, Employer (job owner), or Admin | **Auth:** JWT token required

**Authorization:**

- Job seeker can view their own applications (employerNotes stripped)
- Employer can view applications for their jobs (notes stripped)
- Admin sees full document

---

### `PATCH /api/applications/:id/status` — Update Application Status

**Access:** Employer only | **Auth:** JWT token required

**Request Body:**

```json
{
  "status": "shortlisted",
  "employerNotes": "Strong candidate, schedule interview."
}
```

**Allowed Status Transitions:**

| From          | To                                                |
| ------------- | ------------------------------------------------- |
| `pending`     | `reviewed`, `shortlisted`, `accepted`, `rejected` |
| `reviewed`    | `shortlisted`, `accepted`, `rejected`             |
| `shortlisted` | `accepted`, `rejected`                            |
| `accepted`    | — (final)                                         |
| `rejected`    | — (final)                                         |
| `withdrawn`   | — (final)                                         |

---

### `PATCH /api/applications/:id/notes` — Update Personal Notes

**Access:** Job Seeker only | **Auth:** JWT token required

**Request Body:**

```json
{
  "notes": "Follow up in 3 days if no response."
}
```

Notes are private to the job seeker and not visible to the employer.

---

### `PATCH /api/applications/:id/interview-date` — Schedule Interview

**Access:** Employer only | **Auth:** JWT token required

**Request Body:**

```json
{
  "interviewDate": "2025-03-15T10:00:00.000Z"
}
```

**Rules:**

- Interview date must be in the future
- Cannot schedule for applications with final status (`accepted`, `rejected`, `withdrawn`)

---

### `PATCH /api/applications/:id/withdraw` — Withdraw Application

**Access:** Job Seeker only | **Auth:** JWT token required

**Request Body:**

```json
{
  "withdrawalReason": "Accepted another position."
}
```

**Rules:**

- Can only withdraw when status is `pending`, `reviewed`, or `shortlisted`
- Cannot withdraw `accepted`, `rejected`, or already `withdrawn` applications

---

## Service Layer — Business Logic

### Functions

| Function                      | Parameters                                              | Returns                                          | Description                          |
| ----------------------------- | ------------------------------------------------------- | ------------------------------------------------ | ------------------------------------ |
| `applyForJob`                 | `(jobSeekerId, applicationData)`                        | `Promise<Application>`                           | Creates application with validations |
| `getApplicationById`          | `(applicationId, requestingUserId, role)`               | `Promise<Object>`                                | Get with auth + field stripping      |
| `getMyApplications`           | `(jobSeekerId, filters)`                                | `Promise<{applications, pagination}>`            | Job seeker's applications            |
| `getJobApplications`          | `(jobId, employerId, filters)`                          | `Promise<{applications, pagination}>`            | Employer's job applications          |
| `updateApplicationStatus`     | `(applicationId, employerId, newStatus, employerNotes)` | `Promise<Application>`                           | Status transition with validation    |
| `withdrawApplication`         | `(applicationId, jobSeekerId, reason)`                  | `Promise<{message}>`                             | Withdraw with status check           |
| `updateApplicationNotes`      | `(applicationId, jobSeekerId, notes)`                   | `Promise<Object>`                                | Update seeker notes                  |
| `scheduleInterview`           | `(applicationId, employerId, interviewDate)`            | `Promise<Application>`                           | Set interview date                   |
| `getApplicationStats`         | `(jobId, employerId)`                                   | `Promise<Object>`                                | Aggregate counts by status           |
| `checkApplicationEligibility` | `(jobId, userId)`                                       | `Promise<{hasAcceptedApplication, application}>` | Review module integration            |

---

## Validation Rules

Built with **express-validator**.

### Apply for Job

| Field         | Rules                                |
| ------------- | ------------------------------------ |
| `jobId`       | **Required**, valid MongoDB ObjectId |
| `coverLetter` | Optional, max 1000 characters        |
| `resumeUrl`   | Optional, valid HTTP/HTTPS URL       |

### Update Status

| Field           | Rules                                                                   |
| --------------- | ----------------------------------------------------------------------- |
| `status`        | **Required**, one of: `reviewed`, `shortlisted`, `accepted`, `rejected` |
| `employerNotes` | Optional, max 500 characters                                            |

### Query Validation (my-applications, job applications)

| Parameter | Rules                              |
| --------- | ---------------------------------- |
| `status`  | Optional, valid application status |
| `page`    | Optional, integer ≥ 1              |
| `limit`   | Optional, integer 1–100            |

### Schedule Interview

| Parameter       | Rules                                     |
| --------------- | ----------------------------------------- |
| `interviewDate` | **Required**, ISO 8601, must be in future |

### Withdraw / Notes

| Parameter          | Rules                   |
| ------------------ | ----------------------- |
| `withdrawalReason` | Optional, max 500 chars |
| `notes`            | Optional, max 500 chars |

---

## Middleware Pipeline

### Public Route Example

```
GET /api/applications/check/:jobId/:userId
  └── checkApplicationEligibility  → controller (no validation middleware)
```

### Protected Route Example (Job Seeker)

```
POST /api/applications
  └── protect            → verify JWT token → attach req.user
  └── requireJobSeeker    → check req.user.role === 'job_seeker'
  └── applyForJobValidation → validate request body
  └── validate           → return 400 on validation errors
  └── applyForJob        → controller handler
```

### Protected Route Example (Employer)

```
PATCH /api/applications/:id/status
  └── protect            → verify JWT token
  └── requireEmployer    → check req.user.role === 'employer'
  └── updateStatusValidation → validate body
  └── validate           → return 400 on validation errors
  └── updateApplicationStatus → controller handler
```

---

## Model Features

### Query Helpers

```javascript
Application.find().active(); // where isActive: true
```

### Pre-Save Hook

When `status` is modified, the hook appends an entry to `statusHistory`:

```javascript
{
  status: 'shortlisted',
  changedAt: new Date(),
  changedBy: employerId  // from _statusChangedBy set in service
}
```

### Indexes

```javascript
// Unique: prevent duplicate applications
applicationSchema.index({ jobId: 1, jobSeekerId: 1 }, { unique: true });

// Query indexes
applicationSchema.index({ status: 1 });
applicationSchema.index({ jobSeekerId: 1 });
applicationSchema.index({ employerId: 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ employerId: 1, status: 1 });
```

---

## Status Lifecycle

```
                    ┌─────────────────────────────────────────────┐
                    │                  pending                    │
                    └─────────────────────┬───────────────────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              │                           │                           │
              ▼                           ▼                           ▼
        reviewed                    shortlisted              accepted / rejected
              │                           │                           │
              └───────────────────────────┼───────────────────────────┘
                                          │
                                          ▼
                                    withdrawn
                              (job seeker action only)
```

---

## Error Handling

All service functions use `HttpException` for typed errors:

### Exception Types

| Exception             | HTTP Code | When Thrown                                                        |
| --------------------- | --------- | ------------------------------------------------------------------ |
| `HttpException` (400) | 400       | Invalid status transition, cannot withdraw, interview date in past |
| `HttpException` (403) | 403       | Not authorized (wrong role, not owner, not applicant)              |
| `HttpException` (404) | 404       | Job or application not found                                       |
| `HttpException` (409) | 409       | Duplicate application (already applied)                            |

### Duplicate Application (MongoDB E11000)

```javascript
// In applyForJob:
if (error.code === 11000) {
  throw new HttpException(409, 'You have already applied for this job');
}
```

### Controller Error Handling

Controllers are **unwrapped** — errors bubble up to the global error handler in `server.js`.

---

## Testing

### Test Coverage

| Test Type             | File                                           | Tests | Status         |
| --------------------- | ---------------------------------------------- | ----- | -------------- |
| **Unit Tests**        | `tests/unit/application.service.test.js`       | 33    | ✅ All Passing |
| **Integration Tests** | `tests/integration/application.routes.test.js` | —     | ✅ Written     |

### Running Tests

```bash
# Run all unit tests
npm run test:unit

# Run only application service tests
npm test tests/unit/application.service.test.js

# Run integration tests (requires MongoDB)
npm run test:integration
```

### Key Unit Test Cases

| Service Function              | Scenarios Tested                                                               |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `applyForJob`                 | Success, job not found (404), job closed (400), duplicate (409), own job (400) |
| `withdrawApplication`         | Success, not applicant (403), already accepted/rejected (400)                  |
| `updateApplicationStatus`     | Success, not employer (403), invalid transition (400), reviewedAt set          |
| `getMyApplications`           | Pagination, status filter, page count                                          |
| `getJobApplications`          | Success, not employer (403), job not found (404)                               |
| `getApplicationById`          | Field stripping for seeker/employer/admin, 403, 404                            |
| `getApplicationStats`         | Correct counts, zeros, job not found (404), not owner (403)                    |
| `checkApplicationEligibility` | hasAcceptedApplication true/false, $or query                                   |

---

## Future Enhancements

### Planned Features

| Feature                    | Priority | Description                                                   |
| -------------------------- | -------- | ------------------------------------------------------------- |
| **Auto-close job on fill** | High     | When accepted count equals job.positions, update job status   |
| **Email Notifications**    | Medium   | Notify seekers on status change, employers on new application |
| **Bulk Status Update**     | Medium   | Employer shortlist/reject multiple applications at once       |
| **Application Templates**  | Low      | Save cover letter templates for job seekers                   |
| **Resume Parsing**         | Low      | Extract skills from resume URL for matching                   |

### Architectural TODOs

```javascript
// application.service.js — Line 254
// TODO: After accepting, check if accepted count equals job.positions
// and consider updating the job status to 'filled'. This would require
// coordination with the Job module and could be implemented as an event
// or a post-save hook in a future enhancement.
```

---

## API Quick Reference

```bash
# ── PUBLIC ───────────────────────────────────────────────────────
GET    /api/applications/check/:jobId/:userId   # Review eligibility check

# ── JOB SEEKER (requires Bearer token + job_seeker role) ─────────
POST   /api/applications                        # Apply for job
GET    /api/applications/my-applications        # My applications
GET    /api/applications/:id                    # Get application
PATCH  /api/applications/:id/notes              # Update notes
PATCH  /api/applications/:id/withdraw           # Withdraw

# ── EMPLOYER (requires Bearer token + employer role) ──────────────
GET    /api/applications/job/:jobId             # Job applications
GET    /api/applications/job/:jobId/stats       # Application stats
GET    /api/applications/:id                    # Get application
PATCH  /api/applications/:id/status             # Update status
PATCH  /api/applications/:id/interview-date     # Schedule interview
```

---

## Environment Variables

| Variable         | Required | Description               |
| ---------------- | -------- | ------------------------- |
| `MONGODB_URI`    | ✅       | MongoDB connection string |
| `JWT_SECRET`     | ✅       | JWT signing secret        |
| `JWT_EXPIRES_IN` | ✅       | Token expiry (e.g., `7d`) |

---

_Last Updated: February 27, 2026_
_Author: JobLoom Development Team_
