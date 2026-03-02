import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'express-async-errors';

// Import configurations
import envConfig from './config/env.config.js';
import logger from './config/logger.config.js';
import database from './config/database.js';
import { SERVER_CONFIG, getServerHost, getServerUrl } from './config/server.config.js';

// Import middleware
import configureSecurityMiddleware from './middleware/security.middleware.js';
import configureCorsMiddleware from './middleware/cors.middleware.js';
import configureBodyParser from './middleware/body-parser.middleware.js';
import configureRequestLogger from './middleware/request-logger.middleware.js';
import httpInterceptor from './middleware/http-interceptor.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

// Import routes
import healthRoutes from './routes/health.routes.js';
import routes from './routes/index.js';

// Import Swagger
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger/swagger.config.js';

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Module-level state
let server = null;
let isShuttingDown = false;

/**
 * Create Express Application
 */
const app = express();

/**
 * Configure Middleware
 */
configureSecurityMiddleware(app);
configureCorsMiddleware(app);
configureBodyParser(app);
configureRequestLogger(app);
app.use(httpInterceptor);

/**
 * Configure API Documentation
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

/**
 * Serve Uploaded Files (profile images, CVs)
 */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * Configure Routes
 */
app.use('/', healthRoutes); // Health check routes (/, /health, /healthz, /ready)
app.use('/api', routes); // API routes

/**
 * Error Handlers (must be last)
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Initialize Application
 * Setup logs directory and other prerequisites
 */
const initializeApp = () => {
  try {
    const logsDir = path.join(__dirname, '../logs');

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      logger.info('Logs directory created');
    }
  } catch (error) {
    logger.error('Failed to initialize application:', {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Connect to Database
 * Handles connection with appropriate error handling based on environment
 */
const connectDatabase = async () => {
  try {
    logger.info('Connecting to MongoDB...');
    await database.connect();
    logger.info('Database connected successfully');
  } catch (dbError) {
    if (envConfig.isDevelopment) {
      logger.warn('MongoDB connection failed - continuing without database', {
        message: dbError.message,
      });
      logger.warn('Some features requiring database will not be available');
    } else {
      logger.error('Database connection failed in production', {
        message: dbError.message,
        stack: dbError.stack,
      });
      throw dbError;
    }
  }
};

/**
 * Start Server
 * Initializes and starts the Express server
 */
const startServer = async () => {
  try {
    // Initialize application
    initializeApp();

    // Connect to database
    await connectDatabase();

    // Start listening
    const PORT = envConfig.port;
    const HOST = getServerHost();

    server = app.listen(PORT, HOST, () => {
      const serverUrl = getServerUrl(PORT);

      logger.info('Server started successfully', {
        host: HOST,
        port: PORT,
        environment: envConfig.env,
        nodeVersion: process.version,
        pid: process.pid,
        database: database.isConnected ? 'Connected' : 'Not Connected',
      });
      logger.info(`API available at ${serverUrl}`);
      logger.info(`Health check: ${serverUrl}/health`);
      logger.info(`API documentation: ${serverUrl}/api-docs`);
    });

    // Configure server timeouts
    server.timeout = SERVER_CONFIG.REQUEST_TIMEOUT;
    server.keepAliveTimeout = SERVER_CONFIG.KEEP_ALIVE_TIMEOUT;
    server.headersTimeout = SERVER_CONFIG.HEADERS_TIMEOUT;

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
      } else if (error.code === 'EACCES') {
        logger.error(`Port ${PORT} requires elevated privileges`);
      } else {
        logger.error('Server error:', {
          message: error.message,
          code: error.code,
          stack: error.stack,
        });
      }
      process.exit(1);
    });

    // Log when server is closing
    server.on('close', () => {
      logger.info('Server closed');
    });

    // Setup process event handlers
    setupProcessHandlers();

    return server;
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
 * Properly closes all connections and resources
 */
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} signal received. Starting graceful shutdown...`);

  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, ignoring signal');
    return;
  }

  isShuttingDown = true;

  // Create shutdown timeout
  const shutdownTimer = setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded, forcing exit');
    process.exit(1);
  }, SERVER_CONFIG.SHUTDOWN_TIMEOUT);

  try {
    // Stop accepting new connections
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            logger.error('Error closing HTTP server:', {
              message: err.message,
            });
            reject(err);
          } else {
            logger.info('HTTP server closed - no longer accepting connections');
            resolve();
          }
        });
      });
    }

    // Close database connection
    if (database.isConnected) {
      await database.disconnect();
      logger.info('Database connection closed');
    }

    clearTimeout(shutdownTimer);
    logger.info('Graceful shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    clearTimeout(shutdownTimer);
    logger.error('Error during graceful shutdown:', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

/**
 * Setup Process Event Handlers
 * Registers handlers for various process events
 */
const setupProcessHandlers = () => {
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
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString(),
    });
    gracefulShutdown('UNHANDLED_REJECTION');
  });

  // Handle warning events
  process.on('warning', (warning) => {
    logger.warn('Process warning:', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
    });
  });
};

/**
 * Check if this module is the main entry point
 */
const isMainModule = () => {
  // For ES modules, check if this file was run directly
  const runPath = process.argv[1];
  if (!runPath) return false;

  const modulePath = fileURLToPath(import.meta.url);
  return runPath === modulePath || path.resolve(runPath) === modulePath;
};

// Start the server only when running directly (not when imported by tests)
if (isMainModule()) {
  startServer();
}

// Export app and shutdown function for testing
export default app;
export { startServer, gracefulShutdown };
