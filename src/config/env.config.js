import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Environment Configuration Service
 * Centralized configuration management with validation
 */
class EnvConfig {
  constructor() {
    this.validateRequiredEnvVars();
  }

  /**
   * Validate that all required environment variables are set
   */
  validateRequiredEnvVars() {
    const required = ['MONGODB_URI'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}\n` +
          'Please check your .env file.'
      );
    }
  }

  /**
   * Get environment (development, production, test)
   */
  get env() {
    return process.env.NODE_ENV || 'development';
  }

  /**
   * Check if running in development mode
   */
  get isDevelopment() {
    return this.env === 'development';
  }

  /**
   * Check if running in production mode
   */
  get isProduction() {
    return this.env === 'production';
  }

  /**
   * Check if running in test mode
   */
  get isTest() {
    return this.env === 'test';
  }

  /**
   * Get server port
   */
  get port() {
    return parseInt(process.env.PORT, 10) || 3000;
  }

  /**
   * Get MongoDB URI
   */
  get mongodbUri() {
    return process.env.MONGODB_URI;
  }

  /**
   * Get log level
   */
  get logLevel() {
    return process.env.LOG_LEVEL || 'info';
  }

  /**
   * Get JWT Secret
   */
  get jwtSecret() {
    return process.env.JWT_SECRET || 'your_jwt_secret';
  }

  /**
   * Get JWT Expiration
   */
  get jwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || '7d';
  }

  /**
   * Get SMS API Base URL
   */
  get smsApiBaseUrl() {
    return process.env.TEXT_LK_API_BASE_URL || 'https://app.text.lk/api/v3/';
  }

  /**
   * Get SMS API Token
   */
  get smsApiToken() {
    return process.env.TEXT_LK_API_TOKEN;
  }

  /**
   * Get SMS Sender ID
   */
  get smsSenderId() {
    return process.env.TEXT_LK_SENDER_ID || 'TextLKDemo';
  }

  /**
   * Get all configuration as an object
   */
  getAll() {
    return {
      env: this.env,
      isDevelopment: this.isDevelopment,
      isProduction: this.isProduction,
      isTest: this.isTest,
      port: this.port,
      mongodbUri: this.mongodbUri,
      logLevel: this.logLevel,
      smsApiBaseUrl: this.smsApiBaseUrl,
      smsApiToken: this.smsApiToken,
      smsSenderId: this.smsSenderId,
    };
  }
}

// Export singleton instance
export default new EnvConfig();
