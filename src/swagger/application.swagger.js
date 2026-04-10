/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Job application workflow and status management
 */

// Public endpoints

/**
 * @swagger
 * /api/applications/check/{jobId}/{userId}:
 *   get:
 *     tags: [Applications]
 *     summary: Check application eligibility
 *     description: |
 *       Check if a user has an accepted application for a job.
 *       Used by the Review module to verify eligibility before submitting a review.
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the job
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Application check completed
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
 *                     hasApplied:
 *                       type: boolean
 *                       description: Whether the user has applied for this job
 *                     hasAcceptedApplication:
 *                       type: boolean
 *                       description: Whether the user has an accepted application (worked together)
 *                     applicationId:
 *                       type: string
 *                       nullable: true
 *                       description: Application ID if found
 *       400:
 *         description: Invalid job ID or user ID format
 */

// Protected endpoints

/**
 * @swagger
 * /api/applications:
 *   post:
 *     tags: [Applications]
 *     summary: Apply for a job
 *     description: |
 *       Submit an application to a job posting as a job seeker.
 *
 *       **Requirements:**
 *       - Job must be open and accepting applications
 *       - Cannot apply to your own job posting
 *       - One application per job per user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jobId]
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: ID of the job to apply for
 *               coverLetter:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Optional cover letter
 *               resumeUrl:
 *                 type: string
 *                 format: uri
 *                 description: Optional resume URL (HTTP/HTTPS)
 *           example:
 *             jobId: "675c9d4c8e9a1b2c3d4e5f61"
 *             coverLetter: "I have 5 years of farming experience and would love to contribute."
 *             resumeUrl: "https://example.com/resume.pdf"
 *     responses:
 *       201:
 *         description: Application submitted successfully
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
 *                   example: Application submitted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     application:
 *                       $ref: '#/components/schemas/Application'
 *       400:
 *         description: Job closed, cannot apply to own job, or validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Job seeker role required
 *       404:
 *         description: Job not found
 *       409:
 *         description: Already applied for this job
 */

/**
 * @swagger
 * /api/applications/my-applications:
 *   get:
 *     tags: [Applications]
 *     summary: Get my applications
 *     description: Retrieve paginated applications for the authenticated job seeker. Supports filtering by status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, shortlisted, accepted, rejected, withdrawn]
 *         description: Filter by application status
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
 *         description: Applications retrieved successfully
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
 *                     applications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Application'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Job seeker role required
 */

/**
 * @swagger
 * /api/applications/job/{jobId}:
 *   get:
 *     tags: [Applications]
 *     summary: Get applications for a job
 *     description: Retrieve all applications for a specific job. Employer only — job must belong to the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the job
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, shortlisted, accepted, rejected, withdrawn]
 *         description: Filter by application status
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
 *         description: Job applications retrieved successfully
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
 *                     applications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Application'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to view applications for this job
 *       404:
 *         description: Job not found
 */

/**
 * @swagger
 * /api/applications/job/{jobId}/stats:
 *   get:
 *     tags: [Applications]
 *     summary: Get application stats for a job
 *     description: Retrieve aggregate statistics (counts by status) for applications on a job. Employer dashboard.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the job
 *     responses:
 *       200:
 *         description: Application stats retrieved successfully
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
 *                     stats:
 *                       type: object
 *                       description: Counts by status (pending, reviewed, shortlisted, accepted, rejected, withdrawn)
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Employer role required or not authorized for this job
 *       404:
 *         description: Job not found
 */

/**
 * @swagger
 * /api/applications/{id}/interview-join-context:
 *   get:
 *     tags: [Applications]
 *     summary: Get virtual interview join context (Jitsi)
 *     description: |
 *       Returns domain, room name, and display name for embedding Jitsi Meet.
 *       Only the employer or the applicant on this application may call this.
 *       Requires a scheduled **virtual** interview with a `jitsiRoomName`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Join context retrieved
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
 *                   example: Interview join context retrieved
 *                 data:
 *                   type: object
 *                   properties:
 *                     domain:
 *                       type: string
 *                       example: meet.jit.si
 *                     roomName:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     jobTitle:
 *                       type: string
 *                     interviewDate:
 *                       type: string
 *                       format: date-time
 *                     interviewDuration:
 *                       type: integer
 *                     role:
 *                       type: string
 *                       enum: [employer, job_seeker]
 *       400:
 *         description: No interview scheduled, not virtual, or room not configured
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: User is neither employer nor applicant on this application
 *       404:
 *         description: Application not found
 */

/**
 * @swagger
 * /api/applications/{id}:
 *   get:
 *     tags: [Applications]
 *     summary: Get application by ID
 *     description: Retrieve a single application. Accessible by the job seeker, employer (job owner), or admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application retrieved successfully
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
 *                     application:
 *                       $ref: '#/components/schemas/Application'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to view this application
 *       404:
 *         description: Application not found
 */

/**
 * @swagger
 * /api/applications/{id}/status:
 *   patch:
 *     tags: [Applications]
 *     summary: Update application status
 *     description: |
 *       Update the status of an application. Employer only.
 *
 *       **Allowed transitions:**
 *       - pending → reviewed, shortlisted, accepted, rejected
 *       - reviewed → shortlisted, accepted, rejected
 *       - shortlisted → accepted, rejected
 *
 *       When the new status is **accepted** or **rejected**, the job seeker receives an email (if SMTP is configured), asynchronously.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [reviewed, shortlisted, accepted, rejected]
 *                 description: New status
 *               employerNotes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional internal notes
 *           example:
 *             status: "shortlisted"
 *             employerNotes: "Strong candidate, schedule interview."
 *     responses:
 *       200:
 *         description: Application status updated successfully
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
 *                   example: Application status updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     application:
 *                       $ref: '#/components/schemas/Application'
 *       400:
 *         description: Invalid status transition or validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not the job employer
 *       404:
 *         description: Application not found
 */

/**
 * @swagger
 * /api/applications/{id}/notes:
 *   patch:
 *     tags: [Applications]
 *     summary: Update application notes
 *     description: Update the job seeker's personal notes on an application. Notes are private and not visible to the employer.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 nullable: true
 *                 description: Personal notes (or null to clear)
 *           example:
 *             notes: "Follow up in 3 days if no response."
 *     responses:
 *       200:
 *         description: Application notes updated successfully
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
 *                   example: Application notes updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     application:
 *                       $ref: '#/components/schemas/Application'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not the applicant
 *       404:
 *         description: Application not found
 */

/**
 * @swagger
 * /api/applications/{id}/interview:
 *   patch:
 *     tags: [Applications]
 *     summary: Schedule or update interview
 *     description: |
 *       Set or update interview details. Employer only. Application must be **shortlisted**.
 *       Date must be in the future.
 *       For `virtual`, a stable `jitsiRoomName` is generated on first schedule.
 *       For `in_person`, `interviewLocation` is required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [interviewDate, interviewType]
 *             properties:
 *               interviewDate:
 *                 type: string
 *                 format: date-time
 *                 description: ISO 8601 date; must be in the future
 *               interviewType:
 *                 type: string
 *                 enum: [virtual, in_person]
 *               interviewDuration:
 *                 type: integer
 *                 minimum: 15
 *                 maximum: 480
 *                 description: Minutes (default 30)
 *               interviewLocation:
 *                 type: string
 *                 maxLength: 300
 *                 description: Required when interviewType is in_person
 *               interviewLocationNotes:
 *                 type: string
 *                 maxLength: 500
 *           examples:
 *             virtual:
 *               summary: Virtual interview
 *               value:
 *                 interviewDate: "2026-03-15T10:00:00.000Z"
 *                 interviewType: virtual
 *                 interviewDuration: 45
 *             inPerson:
 *               summary: In-person interview
 *               value:
 *                 interviewDate: "2026-03-15T10:00:00.000Z"
 *                 interviewType: in_person
 *                 interviewDuration: 30
 *                 interviewLocation: "123 Main St, Colombo"
 *                 interviewLocationNotes: "Reception desk, 3rd floor"
 *     responses:
 *       200:
 *         description: Interview scheduled successfully
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
 *                   example: Interview scheduled successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     application:
 *                       $ref: '#/components/schemas/Application'
 *       400:
 *         description: Validation error or invalid application state
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not the job employer
 *       404:
 *         description: Application not found
 */

/**
 * @swagger
 * /api/applications/{id}/interview:
 *   delete:
 *     tags: [Applications]
 *     summary: Cancel scheduled interview
 *     description: |
 *       Employer only. Removes interview date, type, Jitsi room, location, and duration.
 *       The applicant is notified by email (no SMS).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Interview cancelled successfully
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
 *                   example: Interview cancelled successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     application:
 *                       $ref: '#/components/schemas/Application'
 *       400:
 *         description: No interview scheduled
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not the job employer
 *       404:
 *         description: Application not found
 */

/**
 * @swagger
 * /api/applications/{id}/withdraw:
 *   patch:
 *     tags: [Applications]
 *     summary: Withdraw an application
 *     description: Withdraw an application. Job seeker only. Can only withdraw pending or reviewed applications.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               withdrawalReason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional reason for withdrawal
 *           example:
 *             withdrawalReason: "Accepted another position."
 *     responses:
 *       200:
 *         description: Application withdrawn successfully
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
 *                   example: Application withdrawn successfully
 *       400:
 *         description: Cannot withdraw — status is already final
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not the applicant
 *       404:
 *         description: Application not found
 */
