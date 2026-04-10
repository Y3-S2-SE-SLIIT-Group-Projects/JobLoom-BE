/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI-powered analysis endpoints
 */

/**
 * @swagger
 * /api/ai/analyze-skill-gap:
 *   post:
 *     tags: [AI]
 *     summary: Analyze skill gap for a CV against a job
 *     description: |
 *       Runs AI analysis to compare a selected CV with a target job and returns
 *       a skill-gap summary, missing skills, recommended skills, and match score.
 *
 *       Access is restricted to authenticated users with the job_seeker role.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jobId, cvId]
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: Target job ID
 *                 example: "675c9d4c8e9a1b2c3d4e5f68"
 *               cvId:
 *                 type: string
 *                 description: CV ID from the authenticated user's CV list
 *                 example: "675c9d4c8e9a1b2c3d4e5f69"
 *               language:
 *                 type: string
 *                 description: Optional output language (en, si, ta)
 *                 example: "en"
 *     responses:
 *       200:
 *         description: Skill gap analysis completed
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
 *                   example: Skill gap analysis completed
 *                 data:
 *                   type: object
 *                   properties:
 *                     matchScore:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 100
 *                       example: 72
 *                     missingSkills:
 *                       type: array
 *                       items:
 *                         type: string
 *                     recommendedSkills:
 *                       type: array
 *                       items:
 *                         type: string
 *                     summary:
 *                       type: string
 *                     language:
 *                       type: string
 *                       enum: [en, si, ta]
 *       400:
 *         description: Missing required request fields
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden for non job_seeker roles
 *       404:
 *         description: Job, CV, or user not found
 *       502:
 *         description: AI returned invalid response payload
 *       503:
 *         description: AI service unavailable
 */
