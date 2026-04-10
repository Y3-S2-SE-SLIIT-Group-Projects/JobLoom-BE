/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrative management APIs
 */

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
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
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalUsers: { type: number }
 *                         totalJobs: { type: number }
 *                         totalApplications: { type: number }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all users with pagination and filtering
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [job_seeker, employer, admin] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of users retrieved
 *       403:
 *         description: Forbidden - Admin role required
 */

/**
 * @swagger
 * /admin/users/{userId}:
 *   put:
 *     summary: Update user details as an administrator
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role: { type: string, enum: [job_seeker, employer, admin] }
 *               isActive: { type: boolean }
 *               isVerified: { type: boolean }
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
export default {};
