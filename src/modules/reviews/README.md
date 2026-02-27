# Reviews Module

## Overview

The Reviews & Ratings module enables **employers** and **job seekers** to leave mutual reviews after completing a job engagement. It enforces eligibility rules (both parties must have an accepted application), prevents duplicate reviews, supports detailed multi-criteria ratings, and automatically maintains aggregated rating statistics and trust badges per user.

---

## Module Structure

```
src/modules/reviews/
├── review.routes.js          # Express route definitions
├── review.controller.js      # HTTP request handlers
├── review.service.js         # Business logic
├── review.repository.js      # Database access layer
├── review.validation.js      # Request validation schemas
├── review.model.js           # Mongoose Review schema
├── rating-stats.model.js     # Mongoose RatingStats schema
└── rating-stats.service.js   # Stats aggregation logic
```

Related utilities:

- `src/utils/rating.utils.js` — weighted rating calculation, trust score, badge logic

---

## Data Models

### Review

| Field            | Type     | Required | Description                                                 |
| ---------------- | -------- | -------- | ----------------------------------------------------------- |
| `jobId`          | ObjectId | Yes      | Reference to the Job                                        |
| `reviewerId`     | ObjectId | Yes      | User submitting the review (set from JWT)                   |
| `revieweeId`     | ObjectId | Yes      | User being reviewed                                         |
| `reviewerType`   | String   | Yes      | `job_seeker` or `employer`                                  |
| `rating`         | Number   | Yes      | Overall rating 1–5 (auto-computed if criteria are provided) |
| `comment`        | String   | No       | Free-text feedback (max 1000 chars)                         |
| `workQuality`    | Number   | No       | Criteria rating 1–5                                         |
| `communication`  | Number   | No       | Criteria rating 1–5                                         |
| `punctuality`    | Number   | No       | Criteria rating 1–5                                         |
| `paymentOnTime`  | Number   | No       | Criteria rating 1–5 (employer-relevant)                     |
| `wouldRecommend` | Boolean  | No       | Default `true`                                              |
| `isVerified`     | Boolean  | —        | Internal verification flag, default `false`                 |
| `isDeleted`      | Boolean  | —        | Soft-delete flag, hidden from queries by default            |
| `reportedBy`     | Array    | —        | List of `{ userId, reason, reportedAt }` report entries     |
| `createdAt`      | Date     | —        | Auto-generated timestamp                                    |
| `updatedAt`      | Date     | —        | Auto-generated timestamp                                    |

**Unique constraint:** `(jobId, reviewerId, revieweeId)` — prevents duplicate reviews for the same job pair.

---

### RatingStats

Stored in a separate collection, recalculated automatically on every review save/delete.

| Field                | Type     | Description                         |
| -------------------- | -------- | ----------------------------------- |
| `userId`             | ObjectId | Reference to User — unique          |
| `averageRating`      | Number   | Aggregate average (0–5)             |
| `totalReviews`       | Number   | Total non-deleted reviews received  |
| `ratingDistribution` | Object   | Count per star: `{ 1, 2, 3, 4, 5 }` |
| `lastCalculated`     | Date     | When stats were last recalculated   |

---

## Rating System

### Weighted Rating

When any detailed criteria are provided, the overall `rating` field is automatically replaced with the **average of all supplied criteria values** (rounded to 1 decimal place).

Criteria taken into account: `rating`, `workQuality`, `communication`, `punctuality`, `paymentOnTime`.

### Trust Score

```
trustScore = (averageRating × 20) + min(totalReviews × 0.5, 10)
```

Maximum achievable score: **110** (5 stars × 20 + capped review bonus of 10).

### Badges

| Badge           | Condition                                        |
| --------------- | ------------------------------------------------ |
| **Elite**       | averageRating ≥ 4.8 **and** totalReviews ≥ 20    |
| **Top Rated**   | averageRating ≥ 4.5 **and** totalReviews ≥ 10    |
| **Trusted**     | averageRating ≥ 4.0 **and** totalReviews ≥ 5     |
| **Rising Star** | averageRating ≥ 4.0 **and** 2 ≤ totalReviews < 5 |
| _(none)_        | All other cases                                  |

### Rating Level Labels

| Range | Label         |
| ----- | ------------- |
| ≥ 4.5 | Excellent     |
| ≥ 4.0 | Very Good     |
| ≥ 3.5 | Good          |
| ≥ 3.0 | Average       |
| ≥ 2.0 | Below Average |
| < 2.0 | Poor          |

---

## Business Rules

1. **Eligibility** — A reviewer must have an accepted application on the target job. Self-reviews are blocked.
2. **No duplicates** — One review per `(reviewer, reviewee, job)` triple.
3. **Edit window** — Reviews can be edited within **7 days** of creation. The `rating` field specifically can only be changed within **24 hours**.
4. **Soft delete** — Deleted reviews are hidden but retained in the database. Admins can delete any review; regular users can only delete their own.
5. **Report & flag** — Any authenticated user can report a review once. Reviews with **3 or more reports** are automatically flagged for moderation.
6. **Stats sync** — `RatingStats` is recalculated automatically via a Mongoose post-save hook on the Review model.

---

## API Endpoints

Base path: `/api/reviews`

### Authentication

| Symbol | Meaning                       |
| ------ | ----------------------------- |
| 🔓     | Public — no token required    |
| 🔒     | Private — Bearer JWT required |

---

### 1. Create a Review

**`POST /api/reviews`** 🔒

Submit a review for a user after a completed job engagement.

**Headers**

```
Authorization: Bearer <token>
```

**Request Body**

| Field            | Type    | Required | Description                            |
| ---------------- | ------- | -------- | -------------------------------------- |
| `revieweeId`     | String  | Yes      | MongoDB ObjectId of the user to review |
| `jobId`          | String  | Yes      | MongoDB ObjectId of the associated job |
| `reviewerType`   | String  | Yes      | `job_seeker` or `employer`             |
| `rating`         | Number  | Yes      | Overall rating 1–5                     |
| `comment`        | String  | No       | Text feedback (max 1000 chars)         |
| `workQuality`    | Number  | No       | 1–5                                    |
| `communication`  | Number  | No       | 1–5                                    |
| `punctuality`    | Number  | No       | 1–5                                    |
| `paymentOnTime`  | Number  | No       | 1–5                                    |
| `wouldRecommend` | Boolean | No       | Default `true`                         |

**Example Request**

```json
{
  "revieweeId": "665f1a2b3c4d5e6f7a8b9c0d",
  "jobId": "665f1a2b3c4d5e6f7a8b9c01",
  "reviewerType": "employer",
  "rating": 4,
  "comment": "Great work ethic and communicates well.",
  "workQuality": 5,
  "communication": 4,
  "punctuality": 4,
  "wouldRecommend": true
}
```

**Success Response** `201 Created`

```json
{
  "status": "success",
  "message": "Review submitted successfully",
  "data": {
    "review": {
      "_id": "...",
      "jobId": { "_id": "...", "title": "Backend Developer" },
      "reviewerId": { "_id": "...", "firstName": "Alice", "lastName": "Smith", "role": "employer" },
      "revieweeId": { "_id": "...", "firstName": "Bob", "lastName": "Jones", "role": "job_seeker" },
      "reviewerType": "employer",
      "rating": 4.3,
      "comment": "Great work ethic and communicates well.",
      "workQuality": 5,
      "communication": 4,
      "punctuality": 4,
      "wouldRecommend": true,
      "createdAt": "2026-02-27T10:00:00.000Z"
    }
  }
}
```

**Error Responses**

| Status | Message                                                         |
| ------ | --------------------------------------------------------------- |
| 400    | You cannot review yourself                                      |
| 403    | You can only review users you have worked with on accepted jobs |
| 404    | Job not found / Reviewee not found                              |
| 409    | You have already reviewed this user for this job                |

---

### 2. Get Review by ID

**`GET /api/reviews/:id`** 🔓

**Path Parameter**

| Param | Type   | Description                    |
| ----- | ------ | ------------------------------ |
| `id`  | String | MongoDB ObjectId of the review |

**Success Response** `200 OK`

```json
{
  "status": "success",
  "message": "Review retrieved successfully",
  "data": {
    "review": { ... }
  }
}
```

---

### 3. Update a Review

**`PUT /api/reviews/:id`** 🔒

Update your own review. **Editable within 7 days of creation.** `rating` can only be changed within 24 hours.

**Path Parameter**

| Param | Type   | Description     |
| ----- | ------ | --------------- |
| `id`  | String | Review ObjectId |

**Request Body** _(all fields optional)_

| Field            | Type    | Constraints    |
| ---------------- | ------- | -------------- |
| `rating`         | Number  | 1–5            |
| `comment`        | String  | max 1000 chars |
| `workQuality`    | Number  | 1–5            |
| `communication`  | Number  | 1–5            |
| `punctuality`    | Number  | 1–5            |
| `paymentOnTime`  | Number  | 1–5            |
| `wouldRecommend` | Boolean |                |

**Success Response** `200 OK`

```json
{
  "status": "success",
  "message": "Review updated successfully",
  "data": { "review": { ... } }
}
```

**Error Responses**

| Status | Message                                              |
| ------ | ---------------------------------------------------- |
| 403    | You can only edit your own reviews                   |
| 403    | Reviews can only be edited within 7 days of creation |
| 403    | Rating cannot be changed after 24 hours              |
| 404    | Review not found                                     |

---

### 4. Delete a Review

**`DELETE /api/reviews/:id`** 🔒

Soft-deletes a review. Users can only delete their own reviews; admins can delete any review.

**Path Parameter**

| Param | Type   | Description     |
| ----- | ------ | --------------- |
| `id`  | String | Review ObjectId |

**Success Response** `200 OK`

```json
{
  "status": "success",
  "message": "Review deleted successfully",
  "data": null
}
```

---

### 5. Report a Review

**`POST /api/reviews/:id/report`** 🔒

Flag an inappropriate review for moderation. Each user can report a given review only once. Reviews with 3+ reports are automatically flagged.

**Path Parameter**

| Param | Type   | Description     |
| ----- | ------ | --------------- |
| `id`  | String | Review ObjectId |

**Request Body**

| Field    | Type   | Required | Constraints  |
| -------- | ------ | -------- | ------------ |
| `reason` | String | Yes      | 10–500 chars |

**Example Request**

```json
{
  "reason": "This review contains false information and personal attacks."
}
```

**Success Response** `200 OK`

```json
{
  "status": "success",
  "message": "Review reported successfully",
  "data": { "reportCount": 1 }
}
```

**Error Responses**

| Status | Message                               |
| ------ | ------------------------------------- |
| 409    | You have already reported this review |
| 404    | Review not found                      |

---

### 6. Get Reviews for a User

**`GET /api/reviews/user/:userId`** 🔓

Returns paginated reviews received by a specific user.

**Path Parameter**

| Param    | Type   | Description   |
| -------- | ------ | ------------- |
| `userId` | String | User ObjectId |

**Query Parameters**

| Param          | Type   | Default | Description                          |
| -------------- | ------ | ------- | ------------------------------------ |
| `reviewerType` | String | —       | Filter by `job_seeker` or `employer` |
| `page`         | Number | 1       | Page number (min 1)                  |
| `limit`        | Number | 10      | Results per page (1–100)             |
| `sort`         | String | —       | Sort order                           |

**Success Response** `200 OK`

```json
{
  "status": "success",
  "message": "Reviews retrieved successfully",
  "data": {
    "reviews": [ ... ],
    "total": 24,
    "page": 1,
    "pages": 3
  }
}
```

---

### 7. Get Reviews for an Employer

**`GET /api/reviews/employer/:employerId`** 🔓

Alias for `GET /user/:userId` pre-filtered to `reviewerType=job_seeker` (reviews left by job seekers about the employer).

**Path Parameter**

| Param        | Type   | Description         |
| ------------ | ------ | ------------------- |
| `employerId` | String | Employer's ObjectId |

**Query Parameters:** `page`, `limit` (same as above)

---

### 8. Get Reviews for a Job Seeker

**`GET /api/reviews/jobseeker/:jobSeekerId`** 🔓

Alias for `GET /user/:userId` pre-filtered to `reviewerType=employer` (reviews left by employers about the job seeker).

**Path Parameter**

| Param         | Type   | Description           |
| ------------- | ------ | --------------------- |
| `jobSeekerId` | String | Job seeker's ObjectId |

**Query Parameters:** `page`, `limit` (same as above)

---

### 9. Get Reviews for a Job

**`GET /api/reviews/job/:jobId`** 🔓

Returns all reviews associated with a specific job posting.

**Path Parameter**

| Param   | Type   | Description  |
| ------- | ------ | ------------ |
| `jobId` | String | Job ObjectId |

**Success Response** `200 OK`

```json
{
  "status": "success",
  "message": "Job reviews retrieved successfully",
  "data": {
    "reviews": [ ... ],
    "count": 5
  }
}
```

---

### 10. Get User Rating Statistics

**`GET /api/reviews/stats/:userId`** 🔓

Returns aggregated rating statistics, trust score, and badge for a user.

**Path Parameter**

| Param    | Type   | Description   |
| -------- | ------ | ------------- |
| `userId` | String | User ObjectId |

**Success Response** `200 OK`

```json
{
  "status": "success",
  "message": "Rating statistics retrieved successfully",
  "data": {
    "stats": {
      "userId": "665f1a2b3c4d5e6f7a8b9c0d",
      "averageRating": 4.7,
      "totalReviews": 15,
      "ratingDistribution": {
        "5": 10,
        "4": 3,
        "3": 2,
        "2": 0,
        "1": 0
      },
      "lastCalculated": "2026-02-27T09:00:00.000Z",
      "trustScore": 101.5,
      "badge": "Top Rated"
    }
  }
}
```

---

## Route Summary

| Method | Endpoint                              | Auth | Description                           |
| ------ | ------------------------------------- | ---- | ------------------------------------- |
| POST   | `/api/reviews`                        | 🔒   | Create a review                       |
| GET    | `/api/reviews/:id`                    | 🔓   | Get review by ID                      |
| PUT    | `/api/reviews/:id`                    | 🔒   | Update own review                     |
| DELETE | `/api/reviews/:id`                    | 🔒   | Soft-delete own review                |
| POST   | `/api/reviews/:id/report`             | 🔒   | Report a review                       |
| GET    | `/api/reviews/user/:userId`           | 🔓   | Get all reviews for a user            |
| GET    | `/api/reviews/employer/:employerId`   | 🔓   | Get reviews received by an employer   |
| GET    | `/api/reviews/jobseeker/:jobSeekerId` | 🔓   | Get reviews received by a job seeker  |
| GET    | `/api/reviews/job/:jobId`             | 🔓   | Get all reviews for a job             |
| GET    | `/api/reviews/stats/:userId`          | 🔓   | Get rating stats, trust score & badge |

---

## Validation Rules

All inputs are validated using `express-validator` before reaching the controller.

| Field            | Rule                                         |
| ---------------- | -------------------------------------------- |
| `revieweeId`     | Required, valid MongoDB ObjectId             |
| `jobId`          | Required, valid MongoDB ObjectId             |
| `reviewerType`   | Required, must be `job_seeker` or `employer` |
| `rating`         | Required (create), float between 1 and 5     |
| `comment`        | Optional, max 1000 chars, HTML-escaped       |
| `workQuality`    | Optional, float 1–5                          |
| `communication`  | Optional, float 1–5                          |
| `punctuality`    | Optional, float 1–5                          |
| `paymentOnTime`  | Optional, float 1–5                          |
| `wouldRecommend` | Optional, boolean                            |
| `reason`         | Required for reports, 10–500 chars           |
| `page`           | Optional, positive integer                   |
| `limit`          | Optional, integer 1–100                      |

---

## Error Reference

| HTTP Status | Scenario                                                     |
| ----------- | ------------------------------------------------------------ |
| 400         | Self-review attempt                                          |
| 403         | No accepted application / ownership violation / edit expired |
| 404         | Review, job, or user not found                               |
| 409         | Duplicate review / already reported                          |
| 422         | Validation failure (invalid input)                           |
