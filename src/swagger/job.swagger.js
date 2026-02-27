/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job postings, search, filters, and geospatial queries
 */

// ─── Public endpoints ───

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     tags: [Jobs]
 *     summary: Get all jobs with advanced filtering
 *     description: |
 *       Retrieve paginated job listings with support for:
 *       - Category filtering
 *       - Status filtering (open, closed, filled)
 *       - Salary range filtering
 *       - District/location filtering
 *       - Full-text search
 *       - Sorting and pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Results per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [agriculture, construction, delivery, retail, manufacturing, hospitality, healthcare, education, transportation, domestic_work, security, technical, skilled_labor, other]
 *         description: Filter by job category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed, filled]
 *         description: Filter by job status
 *       - in: query
 *         name: employmentType
 *         schema:
 *           type: string
 *           enum: [full_time, part_time, contract, temporary, seasonal]
 *         description: Filter by employment type
 *       - in: query
 *         name: salaryType
 *         schema:
 *           type: string
 *           enum: [hourly, daily, weekly, monthly, contract]
 *         description: Filter by salary type
 *       - in: query
 *         name: minSalary
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum salary amount
 *       - in: query
 *         name: maxSalary
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum salary amount
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *         description: Filter by district (case-insensitive)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Full-text search in title and description
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *           enum: [-createdAt, createdAt, -salaryAmount, salaryAmount, title, -title]
 *         description: Sort field (prefix with - for descending)
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Job'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     tags: [Jobs]
 *     summary: Get single job by ID
 *     description: Retrieve detailed information about a specific job including employer details, location, and requirements
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Job retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/JobDetailed'
 *       400:
 *         description: Invalid job ID format
 *       404:
 *         description: Job not found or inactive
 */

/**
 * @swagger
 * /api/jobs/nearby:
 *   get:
 *     tags: [Jobs]
 *     summary: Get nearby jobs (Geospatial search)
 *     description: |
 *       Find jobs within a specified radius using geospatial coordinates.
 *       Uses MongoDB's $geoNear aggregation for accurate distance calculation.
 *
 *       **Coordinates Format:** GeoJSON Point [longitude, latitude]
 *     parameters:
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *         description: Longitude coordinate (e.g., 79.8612)
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *         description: Latitude coordinate (e.g., 6.9271)
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 50
 *           minimum: 1
 *           maximum: 500
 *         description: Search radius in kilometers
 *     responses:
 *       200:
 *         description: Nearby jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobs:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Job'
 *                           - type: object
 *                             properties:
 *                               distance:
 *                                 type: number
 *                                 description: Distance from search center in kilometers
 *                                 example: 5.2
 *                     searchCenter:
 *                       type: object
 *                       properties:
 *                         longitude:
 *                           type: number
 *                         latitude:
 *                           type: number
 *                     radiusKm:
 *                       type: number
 *       400:
 *         description: Invalid coordinates or missing required parameters
 */

// ─── Protected endpoints (Employer only) ───

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     tags: [Jobs]
 *     summary: Create a new job posting
 *     description: |
 *       Create a new job posting as an employer.
 *
 *       **Requirements:**
 *       - Must be authenticated as employer
 *       - Required fields: title, description, category
 *       - Optional geospatial coordinates for location-based searches
 *
 *       **Salary Options:**
 *       - hourly, daily, weekly, monthly, contract
 *
 *       **Employment Types:**
 *       - full_time, part_time, contract, temporary, seasonal
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *                 description: Job title
 *                 example: "Rice Paddy Harvester Needed"
 *               description:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 5000
 *                 description: Detailed job description
 *                 example: "Looking for experienced workers to help with rice paddy harvesting season."
 *               category:
 *                 type: string
 *                 enum: [agriculture, construction, delivery, retail, manufacturing, hospitality, healthcare, education, transportation, domestic_work, security, technical, skilled_labor, other]
 *                 example: agriculture
 *               employmentType:
 *                 type: string
 *                 enum: [full_time, part_time, contract, temporary, seasonal]
 *                 default: full_time
 *                 example: seasonal
 *               salaryAmount:
 *                 type: number
 *                 minimum: 0
 *                 example: 1500
 *               salaryType:
 *                 type: string
 *                 enum: [hourly, daily, weekly, monthly, contract]
 *                 default: monthly
 *                 example: daily
 *               currency:
 *                 type: string
 *                 default: LKR
 *                 example: LKR
 *               positions:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 example: 5
 *               skillsRequired:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["farming", "harvesting", "irrigation"]
 *               location:
 *                 type: object
 *                 properties:
 *                   village:
 *                     type: string
 *                     example: "Horana"
 *                   district:
 *                     type: string
 *                     example: "Kalutara"
 *                   province:
 *                     type: string
 *                     example: "Western"
 *                   fullAddress:
 *                     type: string
 *                     example: "Horana, Kalutara District"
 *                   coordinates:
 *                     type: object
 *                     description: GeoJSON Point for geospatial queries
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [Point]
 *                         example: Point
 *                       coordinates:
 *                         type: array
 *                         items:
 *                           type: number
 *                         minItems: 2
 *                         maxItems: 2
 *                         example: [80.0626, 6.7153]
 *                         description: "[longitude, latitude]"
 *               requirements:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Must be physically fit. Previous farming experience preferred."
 *               benefits:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Lunch provided. Transport allowance."
 *               preferredAge:
 *                 type: object
 *                 properties:
 *                   min:
 *                     type: integer
 *                     minimum: 18
 *                     example: 25
 *                   max:
 *                     type: integer
 *                     maximum: 100
 *                     example: 50
 *               preferredGender:
 *                 type: string
 *                 enum: [male, female, any]
 *                 default: any
 *     responses:
 *       201:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Job created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Job'
 *       400:
 *         description: Validation error or invalid data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /api/jobs/employer/my-jobs:
 *   get:
 *     tags: [Jobs]
 *     summary: Get employer's own jobs
 *     description: |
 *       Retrieve all jobs created by the authenticated employer.
 *       Supports filtering by status and including inactive (deleted) jobs.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, closed, filled]
 *         description: Filter by job status
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include soft-deleted jobs
 *     responses:
 *       200:
 *         description: Employer jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Job'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /api/jobs/employer/stats:
 *   get:
 *     tags: [Jobs]
 *     summary: Get employer dashboard statistics
 *     description: |
 *       Retrieve comprehensive statistics for employer dashboard:
 *       - Total jobs posted
 *       - Open jobs
 *       - Closed jobs
 *       - Filled jobs
 *       - Total applicants across all jobs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalJobs:
 *                       type: integer
 *                       example: 10
 *                     openJobs:
 *                       type: integer
 *                       example: 6
 *                     closedJobs:
 *                       type: integer
 *                       example: 2
 *                     filledJobs:
 *                       type: integer
 *                       example: 2
 *                     totalApplicants:
 *                       type: integer
 *                       example: 45
 *                       description: Sum of applicants across all jobs
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /api/jobs/{id}:
 *   put:
 *     tags: [Jobs]
 *     summary: Update job details
 *     description: |
 *       Update job posting details. Only the job owner (employer) can update.
 *
 *       **Restrictions:**
 *       - Cannot update inactive (deleted) jobs
 *       - Cannot change employerId
 *       - Cannot change job status (use dedicated endpoints)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 5000
 *               salaryAmount:
 *                 type: number
 *                 minimum: 0
 *               salaryType:
 *                 type: string
 *                 enum: [hourly, daily, weekly, monthly, contract]
 *               positions:
 *                 type: integer
 *                 minimum: 1
 *               skillsRequired:
 *                 type: array
 *                 items:
 *                   type: string
 *               requirements:
 *                 type: string
 *               benefits:
 *                 type: string
 *           example:
 *             title: "Updated: Rice Paddy Harvester - Urgent"
 *             salaryAmount: 1800
 *             positions: 8
 *     responses:
 *       200:
 *         description: Job updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Job updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Job'
 *       400:
 *         description: Validation error or not authorized to update this job
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Job not found
 */

/**
 * @swagger
 * /api/jobs/{id}/close:
 *   patch:
 *     tags: [Jobs]
 *     summary: Close a job posting
 *     description: |
 *       Mark a job as closed (no longer accepting applications).
 *       Only the job owner can close their jobs.
 *
 *       **Effect:**
 *       - Status changes to 'closed'
 *       - Job remains visible but not accepting applications
 *       - Existing applications remain intact
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Job closed successfully
 *                 data:
 *                   $ref: '#/components/schemas/Job'
 *       400:
 *         description: Not authorized to close this job
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Job not found
 */

/**
 * @swagger
 * /api/jobs/{id}/filled:
 *   patch:
 *     tags: [Jobs]
 *     summary: Mark job as filled
 *     description: |
 *       Mark a job as filled (position has been filled).
 *       Only the job owner can mark their jobs as filled.
 *
 *       **Effect:**
 *       - Status changes to 'filled'
 *       - Job no longer accepting applications
 *       - Typically used after hiring applicant(s)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job marked as filled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Job marked as filled successfully
 *                 data:
 *                   $ref: '#/components/schemas/Job'
 *       400:
 *         description: Not authorized to update this job
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Job not found
 */

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     tags: [Jobs]
 *     summary: Delete a job (soft delete)
 *     description: |
 *       Soft-delete a job posting. Only the job owner can delete their jobs.
 *
 *       **Restrictions:**
 *       - Cannot delete jobs with existing applications
 *       - If job has applications, close it instead
 *
 *       **Effect:**
 *       - isActive set to false
 *       - Job hidden from public listings
 *       - Data retained for records
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Job deleted successfully
 *       400:
 *         description: Cannot delete job with existing applications or not authorized
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Job not found
 */

// ─── Component schemas ───

/**
 * @swagger
 * components:
 *   schemas:
 *     Job:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "675c9d4c8e9a1b2c3d4e5f68"
 *         employerId:
 *           type: string
 *           example: "675c9d4c8e9a1b2c3d4e5f60"
 *         title:
 *           type: string
 *           example: "Rice Paddy Harvester Needed"
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum: [agriculture, construction, delivery, retail, manufacturing, hospitality, healthcare, education, transportation, domestic_work, security, technical, skilled_labor, other]
 *         employmentType:
 *           type: string
 *           enum: [full_time, part_time, contract, temporary, seasonal]
 *         status:
 *           type: string
 *           enum: [open, closed, filled]
 *           example: open
 *         isActive:
 *           type: boolean
 *           example: true
 *         salaryAmount:
 *           type: number
 *           example: 1500
 *         salaryType:
 *           type: string
 *           enum: [hourly, daily, weekly, monthly, contract]
 *           example: daily
 *         currency:
 *           type: string
 *           example: LKR
 *         positions:
 *           type: integer
 *           example: 5
 *         applicantsCount:
 *           type: integer
 *           example: 12
 *         skillsRequired:
 *           type: array
 *           items:
 *             type: string
 *           example: ["farming", "harvesting"]
 *         location:
 *           type: object
 *           properties:
 *             village:
 *               type: string
 *             district:
 *               type: string
 *             province:
 *               type: string
 *             fullAddress:
 *               type: string
 *             coordinates:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: Point
 *                 coordinates:
 *                   type: array
 *                   items:
 *                     type: number
 *                   example: [80.0626, 6.7153]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     JobDetailed:
 *       allOf:
 *         - $ref: '#/components/schemas/Job'
 *         - type: object
 *           properties:
 *             employerId:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 companyName:
 *                   type: string
 *                 ratingStats:
 *                   type: object
 *                   properties:
 *                     averageRating:
 *                       type: number
 *                     totalReviews:
 *                       type: integer
 *                     badge:
 *                       type: string
 *
 *   responses:
 *     Unauthorized:
 *       description: Not authenticated - missing or invalid token
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: Not authorized, no token
 *
 *     Forbidden:
 *       description: Forbidden - insufficient permissions
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: User role job_seeker is not authorized to access this route
 *
 *     BadRequest:
 *       description: Bad request - validation error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *               errors:
 *                 type: array
 *                 items:
 *                   type: object
 */
