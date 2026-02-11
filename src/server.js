import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';

// Import configurations
import envConfig from './config/env.config.js';
import logger from './config/logger.config.js';
import database from './config/database.js';

// Import middleware
import httpInterceptor from './middleware/http-interceptor.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

// Import routes
import routes from './routes/index.js';
import helloService from './routes/hello/hello.service.js';
import { sendSuccess } from './utils/response.utils.js';

/**
 * Create Express Application
 */
const app = express();

/**
 * Security Middleware
 */
app.use(helmet());

/**
 * CORS Configuration
 */
app.use(
  cors({
    origin: envConfig.isDevelopment ? '*' : process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  })
);

/**
 * Body Parser Middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * HTTP Request Logger (Morgan + Winston)
 */
app.use(morgan('combined', { stream: logger.stream }));

/**
 * Custom HTTP Interceptor
 */
app.use(httpInterceptor);

/**
 * Simple Health Check Endpoint (for Docker/K8s)
 * Returns 200 OK if the service is healthy
 */
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: envConfig.env,
    database: database.isConnected ? 'connected' : 'disconnected',
  };

  // Return 503 if database is not connected in production
  if (!database.isConnected && envConfig.isProduction) {
    return res.status(503).json({
      status: 'ERROR',
      ...healthCheck,
      database: 'disconnected',
    });
  }

  res.status(200).json(healthCheck);
});

/**
 * Liveness Probe (for Kubernetes)
 * Checks if the application is alive
 */
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

/**
 * Readiness Probe (for Kubernetes)
 * Checks if the application is ready to serve traffic
 */
app.get('/ready', (req, res) => {
  if (database.isConnected || envConfig.isDevelopment) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready', reason: 'database not connected' });
  }
});

/**
 * Root Route / API Info
 */
app.get('/', (req, res) => {
  const healthData = helloService.getHealthStatus();
  sendSuccess(res, 'JobLoom API is running', {
    ...healthData,
    apiDocs: '/api',
    endpoints: {
      health: '/health',
      liveness: '/healthz',
      readiness: '/ready',
    },
  });
});

/**
 * API Routes
 */
app.use('/api', routes);

/**
 * 404 Not Found Handler (must be after all routes)
 */
app.use(notFoundHandler);

/**
 * Global Error Handler (must be last middleware)
 */
app.use(errorHandler);

/**
 * Start Server
 */
const startServer = async () => {
  try {
    // Create logs directory if it doesn't exist
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const logsDir = path.join(__dirname, '../logs');

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      logger.info('Logs directory created');
    }

    // Try to connect to database (optional in development)
    try {
      logger.info('Connecting to MongoDB...');
      await database.connect();
    } catch (dbError) {
      if (envConfig.isDevelopment) {
        logger.warn('MongoDB connection failed - continuing without database', {
          message: dbError.message,
        });
        logger.warn('Some features requiring database will not be available');
      } else {
        throw dbError;
      }
    }

    // Start listening
    const PORT = envConfig.port;
    app.listen(PORT, () => {
      logger.info(`Server started successfully`, {
        port: PORT,
        environment: envConfig.env,
        nodeVersion: process.version,
        database: database.isConnected ? 'Connected' : 'Not Connected',
      });
      logger.info(`API available at http://localhost:${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/`);
      logger.info(`Hello World API: http://localhost:${PORT}/api/hello`);
    });
  } catch (error) {
    logger.error('Failed to start server:', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

/**
 * Graceful Shutdown Handler
 */
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} signal received. Starting graceful shutdown...`);

  try {
    // Close database connection
    await database.disconnect();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', {
      message: error.message,
    });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
  });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', {
    reason,
    promise,
  });
});

// Start the server
startServer();

export default app;
