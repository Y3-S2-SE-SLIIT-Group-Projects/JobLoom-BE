import mongoose from 'mongoose';
import logger from './logger.config.js';
import envConfig from './env.config.js';

/**
 * MongoDB Database Configuration
 * Handles connection, reconnection, and event listeners
 */

class Database {
  constructor() {
    this.isConnected = false;
    this.hasEventListeners = false;
  }

  /**
   * Sleep helper for retry backoff
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Determine if a MongoDB connection error is transient/retryable
   */
  isRetryableConnectionError(error) {
    const retryableCodes = ['ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED'];
    const message = (error?.message || '').toLowerCase();

    return (
      retryableCodes.includes(error?.code) ||
      message.includes('enotfound') ||
      message.includes('eai_again') ||
      message.includes('getaddrinfo') ||
      message.includes('querysrv') ||
      message.includes('server selection timed out') ||
      message.includes('timed out')
    );
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    // Mongoose connection options
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    const maxAttempts = envConfig.isProduction ? 10 : 6;
    let attempt = 0;
    let lastError;

    while (attempt < maxAttempts) {
      attempt += 1;

      try {
        await mongoose.connect(envConfig.mongodbUri, options);

        this.isConnected = true;
        logger.info('MongoDB connected successfully', {
          database: mongoose.connection.name,
          host: mongoose.connection.host,
          attempt,
        });

        if (!this.hasEventListeners) {
          this.setupEventListeners();
          this.hasEventListeners = true;
        }

        return;
      } catch (error) {
        lastError = error;
        const shouldRetry = this.isRetryableConnectionError(error) && attempt < maxAttempts;

        logger.error('MongoDB connection attempt failed:', {
          attempt,
          maxAttempts,
          message: error.message,
          code: error.code,
        });

        if (!shouldRetry) {
          throw error;
        }

        const delayMs = Math.min(15000, 1000 * 2 ** (attempt - 1));
        logger.warn(`Retrying MongoDB connection in ${Math.round(delayMs / 1000)} seconds...`);
        await this.sleep(delayMs);
      }
    }

    throw lastError;
  }

  /**
   * Setup MongoDB event listeners
   */
  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', {
        message: err.message,
      });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('MongoDB connection closed');
    } catch (error) {
      logger.error('Error closing MongoDB connection:', {
        message: error.message,
      });
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }
}

// Export singleton instance
export default new Database();
