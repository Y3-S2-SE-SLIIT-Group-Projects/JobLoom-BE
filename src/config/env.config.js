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
    // Skip validation in test environment - tests use mocks
    if (process.env.NODE_ENV !== 'test') {
      this.validateRequiredEnvVars();
    }
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
   * Get Text.lk API Base URL
   */
  get textLkApiBaseUrl() {
    return process.env.TEXT_LK_API_BASE_URL || 'https://app.text.lk/api/v3';
  }

  /**
   * Get Text.lk API Token
   */
  get textLkApiToken() {
    return process.env.TEXT_LK_API_TOKEN;
  }

  /**
   * Get Text.lk Sender ID
   */
  get textLkSenderId() {
    return process.env.TEXT_LK_SENDER_ID || 'JobLoom';
  }

  /**
   * Gemini API key for job description generation
   */
  get geminiApiKey() {
    return process.env.GEMINI_API_KEY;
  }

  /**
   * Gemini API base URL
   */
  get geminiApiBaseUrl() {
    return process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
  }

  /**
   * Gemini model for job description generation
   */
  get geminiModel() {
    return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
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
      textLkApiBaseUrl: this.textLkApiBaseUrl,
      textLkApiToken: this.textLkApiToken ? '***' : undefined,
      textLkSenderId: this.textLkSenderId,
      geminiApiKey: this.geminiApiKey ? '***' : undefined,
      geminiApiBaseUrl: this.geminiApiBaseUrl,
      geminiModel: this.geminiModel,
    };
  }
}

// Export singleton instance
export default new EnvConfig();
