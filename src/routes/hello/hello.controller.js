import { Router } from 'express';
import helloService from './hello.service.js';
import { sendSuccess } from '../../utils/response.utils.js';
import { BadRequestException } from '../../models/http-exception.js';

const router = Router();

/**
 * Get Hello World message
 * @route GET /api/hello
 * @returns {object} Hello World message with metadata
 */
router.get('/', async (req, res, next) => {
  try {
    const data = helloService.getHelloWorld();
    sendSuccess(res, 'Hello World!', data);
  } catch (error) {
    next(error);
  }
});

/**
 * Get personalized greeting
 * @route GET /api/hello/:name
 * @param {string} name - Name to greet
 * @returns {object} Personalized greeting message
 */
router.get('/:name', async (req, res, next) => {
  try {
    const { name } = req.params;

    // Validate name parameter
    if (!name || name.trim().length === 0) {
      throw new BadRequestException('Name parameter is required');
    }

    if (name.length > 50) {
      throw new BadRequestException('Name is too long (max 50 characters)');
    }

    const data = helloService.getPersonalizedGreeting(name);
    sendSuccess(res, 'Greeting generated successfully', data);
  } catch (error) {
    next(error);
  }
});

export default router;
