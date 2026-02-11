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
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      // Mongoose connection options
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      // Connect to MongoDB
      await mongoose.connect(envConfig.mongodbUri, options);

      this.isConnected = true;
      logger.info('MongoDB connected successfully', {
        database: mongoose.connection.name,
        host: mongoose.connection.host,
      });

      // Setup event listeners
      this.setupEventListeners();
    } catch (error) {
      logger.error('MongoDB connection error:', {
        message: error.message,
        stack: error.stack,
      });

      // Retry connection after 5 seconds in production
      if (envConfig.isProduction) {
        logger.info('Retrying MongoDB connection in 5 seconds...');
        setTimeout(() => this.connect(), 5000);
      } else {
        throw error;
      }
    }
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
