/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Health check and monitoring endpoints
 */

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Health]
 *     summary: API root info
 *     description: Returns API status and available endpoint links.
 *     responses:
 *       200:
 *         description: API is running
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
 *                   example: JobLoom API is running
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: running
 *                     environment:
 *                       type: string
 *                       example: development
 *                     endpoints:
 *                       type: object
 *                       properties:
 *                         health:
 *                           type: string
 *                           example: /health
 *                         liveness:
 *                           type: string
 *                           example: /healthz
 *                         readiness:
 *                           type: string
 *                           example: /ready
 *                         api:
 *                           type: string
 *                           example: /api
 */

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Comprehensive health check with database status, memory usage, and uptime.
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: integer
 *                   description: Server uptime in seconds
 *                   example: 3600
 *                 environment:
 *                   type: string
 *                   example: development
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [connected, disconnected]
 *                     type:
 *                       type: string
 *                       example: MongoDB
 *                 memory:
 *                   type: object
 *                   properties:
 *                     usage:
 *                       type: number
 *                       example: 45
 *                     unit:
 *                       type: string
 *                       example: MB
 *       503:
 *         description: System is unhealthy (database disconnected in production)
 */

/**
 * @swagger
 * /healthz:
 *   get:
 *     tags: [Health]
 *     summary: Liveness probe
 *     description: Kubernetes liveness probe — returns alive if the server process is running.
 *     responses:
 *       200:
 *         description: Server is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: alive
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /ready:
 *   get:
 *     tags: [Health]
 *     summary: Readiness probe
 *     description: Kubernetes readiness probe — returns ready only if the database is connected (or in development mode).
 *     responses:
 *       200:
 *         description: Server is ready to accept traffic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ready
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Server is not ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: not ready
 *                 reason:
 *                   type: string
 *                   example: database not connected
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
