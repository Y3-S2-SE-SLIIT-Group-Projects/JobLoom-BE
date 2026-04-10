/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Review & Rating system with trust scores, badges, and moderation
 */

// Public endpoints

/**
 * @swagger
 * /api/reviews/user/{userId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get all reviews for a user
 *     description: Retrieve paginated reviews where the specified user is the reviewee. Supports filtering by reviewer type and sorting.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to get reviews for
 *       - in: query
 *         name: reviewerType
 *         schema:
 *           type: string
 *           enum: [job_seeker, employer]
 *         description: Filter by who wrote the review
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Review'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid user ID format
 */

/**
 * @swagger
 * /api/reviews/job/{jobId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get reviews for a job
 *     description: Retrieve all reviews related to a specific job from both employers and job seekers.
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the job
 *     responses:
 *       200:
 *         description: Job reviews retrieved successfully
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
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Review'
 *                     count:
 *                       type: integer
 *       400:
 *         description: Invalid job ID format
 */

/**
 * @swagger
 * /api/reviews/stats/{userId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get user rating statistics
 *     description: |
 *       Returns comprehensive rating statistics including average rating, distribution,
 *       trust score, and badge.
 *
 *       **Trust Score Formula:** (averageRating * 20) + min(totalReviews * 0.5, 10)
 *
 *       **Badges:**
 *       - Elite — 4.8+ rating, 20+ reviews
 *       - Top Rated — 4.5+ rating, 10+ reviews
 *       - Trusted — 4.0+ rating, 5+ reviews
 *       - Rising Star — 4.0+ rating, 2-4 reviews
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Rating statistics retrieved successfully
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
 *                     stats:
 *                       $ref: '#/components/schemas/RatingStats'
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/reviews/employer/{employerId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get employer reviews
 *     description: Alias endpoint — returns reviews for an employer (reviews written by job seekers about this employer).
 *     parameters:
 *       - in: path
 *         name: employerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Employer reviews retrieved successfully
 *       400:
 *         description: Invalid employer ID format
 */

/**
 * @swagger
 * /api/reviews/jobseeker/{jobSeekerId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get job seeker reviews
 *     description: Alias endpoint — returns reviews for a job seeker (reviews written by employers about this worker).
 *     parameters:
 *       - in: path
 *         name: jobSeekerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Job seeker reviews retrieved successfully
 *       400:
 *         description: Invalid job seeker ID format
 */

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get review by ID
 *     description: Retrieve a single review with populated reviewer, reviewee, and job data.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     review:
 *                       $ref: '#/components/schemas/Review'
 *       404:
 *         description: Review not found
 */

// Protected endpoints

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Create a new review
 *     description: |
 *       Submit a review after job completion.
 *
 *       **Requirements:**
 *       - Must have an accepted application linking reviewer and reviewee on this job
 *       - Cannot review yourself
 *       - One review per job per user pair
 *
 *       Rating is auto-calculated as the weighted average of provided criteria.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [revieweeId, jobId, reviewerType, rating]
 *             properties:
 *               revieweeId:
 *                 type: string
 *                 description: ID of user being reviewed
 *               jobId:
 *                 type: string
 *                 description: ID of the job
 *               reviewerType:
 *                 type: string
 *                 enum: [job_seeker, employer]
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 maxLength: 1000
 *               workQuality:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               communication:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               punctuality:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               paymentOnTime:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               wouldRecommend:
 *                 type: boolean
 *           example:
 *             revieweeId: "675c9d4c8e9a1b2c3d4e5f67"
 *             jobId: "675c9d4c8e9a1b2c3d4e5f68"
 *             reviewerType: "job_seeker"
 *             rating: 5
 *             comment: "Excellent employer! Paid on time and good working conditions."
 *             workQuality: 5
 *             communication: 5
 *             paymentOnTime: 5
 *             wouldRecommend: true
 *     responses:
 *       201:
 *         description: Review submitted successfully
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
 *                   example: Review submitted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     review:
 *                       $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation error or cannot review yourself
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: No accepted application found — haven't worked together
 *       404:
 *         description: Job or reviewee not found
 *       409:
 *         description: Duplicate review — already reviewed this user for this job
 */

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     tags: [Reviews]
 *     summary: Update own review
 *     description: |
 *       Edit your own review within time restrictions.
 *
 *       **Restrictions:**
 *       - Only the original reviewer can edit
 *       - Editable within 7 days of creation
 *       - Rating cannot be changed after 24 hours
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 maxLength: 1000
 *               workQuality:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               communication:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               punctuality:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               paymentOnTime:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               wouldRecommend:
 *                 type: boolean
 *           example:
 *             rating: 4
 *             comment: "Updated review — good experience overall."
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not the reviewer, edit window expired, or rating change window expired
 *       404:
 *         description: Review not found
 */

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete own review
 *     description: Soft-delete a review. Only the reviewer or an admin can delete. Data is retained for moderation.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted successfully
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
 *                   example: Review deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not the reviewer or admin
 *       404:
 *         description: Review not found
 */

/**
 * @swagger
 * /api/reviews/{id}/report:
 *   post:
 *     tags: [Reviews]
 *     summary: Report a review
 *     description: |
 *       Report a review for moderation. One report per user per review.
 *       Reviews with 3+ reports are auto-flagged for admin review.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: Reason for reporting
 *           example:
 *             reason: "This review contains false information and inappropriate language."
 *     responses:
 *       200:
 *         description: Review reported successfully
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
 *                   example: Review reported successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     reportCount:
 *                       type: integer
 *                       example: 1
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Review not found
 *       409:
 *         description: Already reported this review
 */
