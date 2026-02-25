# Postman Testing Guide for JobLoom API

This guide provides step-by-step instructions to test all API endpoints using Postman.

## Prerequisites

1. **Postman installed** - Download from [postman.com](https://www.postman.com/downloads/)
2. **Backend server running** - Ensure your backend is running on `http://localhost:3000`
3. **MongoDB connected** - Ensure MongoDB is running and connected

## Base URL

```
http://localhost:3000/api
```

---

## Step 1: User Registration & Authentication

### 1.1 Register an Employer Account

**Endpoint:** `POST /api/users/register`

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "employer@example.com",
  "password": "password123",
  "role": "employer",
  "phone": "0771234567",
  "location": {
    "village": "Colombo 05",
    "district": "Colombo",
    "province": "Western"
  }
}
```

**Expected Response (201):**

```json
{
  "_id": "...",
  "firstName": "John",
  "lastName": "Doe",
  "email": "employer@example.com",
  "role": "employer",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save the `token` from the response - you'll need it for authenticated requests!**

### 1.2 Login as Employer

**Endpoint:** `POST /api/users/login`

**Body (JSON):**

```json
{
  "email": "employer@example.com",
  "password": "password123"
}
```

**Expected Response (200):**

```json
{
  "_id": "...",
  "firstName": "John",
  "lastName": "Doe",
  "email": "employer@example.com",
  "role": "employer",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Save the `token` - this is your authentication token!**

---

## Step 2: Job Management (Employer Only)

### 2.1 Create a New Job

**Endpoint:** `POST /api/jobs`

**Headers:**

```
Content-Type: application/json
Authorization: Bearer <your-employer-token>
```

**Body (JSON):**

```json
{
  "title": "Farm Worker Needed",
  "description": "We are looking for an experienced farm worker to help with daily farming activities including planting, harvesting, and livestock care.",
  "category": "agriculture",
  "jobRole": "Farm Worker",
  "employmentType": "full-time",
  "location": {
    "village": "Gampaha",
    "district": "Gampaha",
    "province": "Western",
    "fullAddress": "Gampaha, Western Province, Sri Lanka"
  },
  "salaryType": "monthly",
  "salaryAmount": 50000,
  "currency": "LKR",
  "skillsRequired": ["Planting", "Harvesting", "Livestock Care"],
  "experienceRequired": "intermediate",
  "positions": 2,
  "startDate": "2024-02-01T00:00:00.000Z"
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "_id": "...",
    "title": "Farm Worker Needed",
    "description": "...",
    "employerId": "...",
    "status": "open",
    ...
  }
}
```

**Save the `_id` of the created job for later tests!**

### 2.2 Get All Jobs (Public - No Auth Required)

**Endpoint:** `GET /api/jobs`

**Query Parameters (Optional):**

- `page=1` - Page number
- `limit=20` - Items per page
- `category=agriculture` - Filter by category
- `status=open` - Filter by status
- `search=farm` - Search in title/description
- `minSalary=30000` - Minimum salary
- `maxSalary=100000` - Maximum salary
- `district=Colombo` - Filter by district
- `province=Western` - Filter by province
- `sortBy=createdAt` - Sort field
- `sortOrder=desc` - Sort order

**Example:**

```
GET /api/jobs?page=1&limit=10&category=agriculture&status=open
```

### 2.3 Get Job by ID (Public - No Auth Required)

**Endpoint:** `GET /api/jobs/:id`

**Replace `:id` with the job ID from Step 2.1**

### 2.4 Get My Jobs (Employer Only)

**Endpoint:** `GET /api/jobs/employer/my-jobs`

**Headers:**

```
Authorization: Bearer <your-employer-token>
```

### 2.5 Get Employer Statistics

**Endpoint:** `GET /api/jobs/employer/stats`

**Headers:**

```
Authorization: Bearer <your-employer-token>
```

### 2.6 Update Job

**Endpoint:** `PUT /api/jobs/:id`

**Headers:**

```
Content-Type: application/json
Authorization: Bearer <your-employer-token>
```

**Body (JSON):**

```json
{
  "title": "Updated Farm Worker Position",
  "salaryAmount": 55000
}
```

### 2.7 Close Job

**Endpoint:** `PATCH /api/jobs/:id/close`

**Headers:**

```
Authorization: Bearer <your-employer-token>
```

### 2.8 Mark Job as Filled

**Endpoint:** `PATCH /api/jobs/:id/filled`

**Headers:**

```
Authorization: Bearer <your-employer-token>
```

### 2.9 Delete Job

**Endpoint:** `DELETE /api/jobs/:id`

**Headers:**

```
Authorization: Bearer <your-employer-token>
```

---

## Step 3: Testing Error Scenarios

### 3.1 Test Unauthorized Access

Try accessing a protected endpoint without a token:

**Endpoint:** `POST /api/jobs`

**Expected Response (401):**

```json
{
  "message": "Not authorized, no token"
}
```

### 3.2 Test Wrong Role Access

Try accessing employer-only endpoint with a job_seeker token:

**Expected Response (403):**

```json
{
  "message": "User role job_seeker is not authorized to access this route"
}
```

---

## Step 4: Postman Collection Setup

### 4.1 Create Environment Variables

1. In Postman, click on **Environments** → **Create Environment**
2. Name it "JobLoom Local"
3. Add these variables:
   - `base_url`: `http://localhost:3000/api`
   - `employer_token`: (leave empty, will be set after login)
   - `job_id`: (leave empty, will be set after creating a job)

### 4.2 Setup Authorization

For protected endpoints:

1. Go to **Authorization** tab
2. Select **Bearer Token**
3. Enter `{{employer_token}}` in the Token field

### 4.3 Save Token Automatically

For login/register endpoints, add this script in **Tests** tab:

```javascript
if (pm.response.code === 200 || pm.response.code === 201) {
  const jsonData = pm.response.json();
  if (jsonData.token) {
    pm.environment.set('employer_token', jsonData.token);
  }
}
```

---

## Quick Test Sequence

1. Register Employer → Save token
2. Login Employer → Update token
3. Create Job → Save job ID
4. Get All Jobs → Verify job appears
5. Get Job by ID → Verify job details
6. Get My Jobs → Verify job appears
7. Get Employer Stats → Verify statistics
8. Update Job → Verify changes
9. Close Job → Verify status change

---

## Common Issues

- **"Not authorized, no token"** → Add Authorization header with Bearer token
- **"Token failed"** → Token expired, login again
- **"Not authorized"** → Wrong role, use employer account
- **"Job not found"** → Check job ID or if job is deleted
