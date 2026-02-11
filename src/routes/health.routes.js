import { Router } from 'express';
import envConfig from '../config/env.config.js';
import database from '../config/database.js';
import helloService from './hello/hello.service.js';
import { sendSuccess } from '../utils/response.utils.js';
import { HTTP_STATUS, HEALTH_CONFIG } from '../config/server.config.js';

const router = Router();

/**
 * Health Check Endpoint
 * Returns comprehensive health information for monitoring and load balancers
 *
 * @route GET /health
 * @returns {Object} Health status including database, memory, and uptime
 */
router.get('/health', (req, res) => {
  const healthCheck = {
    status: database.isConnected || envConfig.isDevelopment ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: envConfig.env,
    version: process.env.npm_package_version || HEALTH_CONFIG.DEFAULT_VERSION,
    database: {
      status: database.isConnected ? 'connected' : 'disconnected',
      type: HEALTH_CONFIG.DATABASE_TYPE,
    },
    memory: {
      usage: Math.round(process.memoryUsage().heapUsed / HEALTH_CONFIG.MEMORY_DIVISOR),
      unit: HEALTH_CONFIG.MEMORY_UNIT,
    },
  };

  // Return 503 if database is not connected in production
  const statusCode =
    !database.isConnected && envConfig.isProduction
      ? HTTP_STATUS.SERVICE_UNAVAILABLE
      : HTTP_STATUS.OK;

  res.status(statusCode).json(healthCheck);
});

/**
 * Liveness Probe
 * Kubernetes liveness probe to check if the application is alive
 *
 * @route GET /healthz
 * @returns {Object} Simple alive status
 */
router.get('/healthz', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness Probe
 * Kubernetes readiness probe to check if the application is ready to serve traffic
 *
 * @route GET /ready
 * @returns {Object} Readiness status based on dependencies
 */
router.get('/ready', (req, res) => {
  const isReady = database.isConnected || envConfig.isDevelopment;

  if (isReady) {
    res.status(HTTP_STATUS.OK).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      status: 'not ready',
      reason: 'database not connected',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Root Route / API Info
 * Provides API information and available endpoints
 *
 * @route GET /
 * @returns {Object} API information and endpoint list
 */
router.get('/', (req, res) => {
  const healthData = helloService.getHealthStatus();

  sendSuccess(res, 'JobLoom API is running', {
    ...healthData,
    apiDocs: '/api',
    endpoints: {
      health: '/health',
      liveness: '/healthz',
      readiness: '/ready',
      api: '/api',
    },
  });
});

export default router;
