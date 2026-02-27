import envConfig from '../../config/env.config.js';

/**
 * Hello Service
 * Business logic for hello endpoints
 */
class HelloService {
  /**
   * Get hello world message
   */
  getHelloWorld() {
    return {
      message: 'Hello World!',
      timestamp: new Date().toISOString(),
      environment: envConfig.env,
      version: '1.0.0',
    };
  }

  /**
   * Get personalized greeting
   * @param {string} name - Name to greet
   */
  getPersonalizedGreeting(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Invalid name parameter');
    }

    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

    return {
      message: `Hello, ${capitalizedName}!`,
      greeting: `Welcome to JobLoom API, ${capitalizedName}!`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get API health status
   */
  getHealthStatus() {
    return {
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: envConfig.env,
      nodeVersion: process.version,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    };
  }
}

export default new HelloService();
