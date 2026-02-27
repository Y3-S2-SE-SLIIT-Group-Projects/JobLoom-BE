# JobLoom Backend - Project Structure

## Complete File Tree

```
JobLoom-BE/
├── src/
│   ├── config/                          # Configuration files
│   │   ├── database.js                  # MongoDB connection with Mongoose
│   │   ├── env.config.js                # Environment configuration service
│   │   └── logger.config.js             # Winston logger configuration
│   │
│   ├── middleware/                      # Middleware functions
│   │   ├── async-handler.js             # Async error wrapper utility
│   │   ├── error-handler.js             # Global exception filter
│   │   └── http-interceptor.js          # HTTP request/response interceptor
│   │
│   ├── models/                          # Data models and schemas
│   │   └── http-exception.js            # Custom HTTP exception classes
│   │
│   ├── routes/                          # API routes (controllers)
│   │   ├── hello/                       # Hello World module
│   │   │   ├── hello.controller.js      # Hello route handlers
│   │   │   └── hello.service.js         # Hello business logic
│   │   └── index.js                     # Main router (aggregates all routes)
│   │
│   ├── utils/                           # Utility functions
│   │   └── response.utils.js            # Standardized response helpers
│   │
│   └── server.js                        # Main application entry point
│
├── logs/                                # Log files (auto-generated)
│   ├── combined.log                     # All logs
│   └── error.log                        # Error logs only
│
├── node_modules/                        # Dependencies (auto-generated)
│
├── .env                                 # Environment variables (not in git)
├── .env.example                         # Environment template
├── .gitignore                           # Git ignore patterns
├── package.json                         # NPM dependencies and scripts
├── package-lock.json                    # Locked dependency versions
├── README.md                            # Project documentation
├── PROJECT_STRUCTURE.md                 # This file
└── LICENSE                              # License file
```

## Module Descriptions

### 📁 `src/config/` - Configuration Layer

**Purpose**: Centralized configuration management

#### `database.js`

- Manages MongoDB connection using Mongoose
- Handles connection events (connect, disconnect, error)
- Implements graceful shutdown
- Auto-reconnection in production mode

#### `env.config.js`

- Loads and validates environment variables
- Provides typed configuration accessors
- Validates required configuration at startup
- Environment detection (dev/prod/test)

#### `logger.config.js`

- Winston logger with multiple transports
- Console output (colorized in development)
- File logging (combined.log, error.log)
- Integrated with Morgan for HTTP logging
- Configurable log levels

### 📁 `src/middleware/` - Middleware Layer

**Purpose**: Cross-cutting concerns and request/response processing

#### `http-interceptor.js`

- Logs all incoming HTTP requests
- Logs all outgoing HTTP responses
- Generates unique request ID (UUID v4)
- Tracks request duration
- Adds X-Request-Id header to responses

#### `error-handler.js`

- Global error handling middleware
- Catches custom HttpException errors
- Handles Mongoose errors (validation, cast, duplicate)
- Handles JWT authentication errors
- Returns standardized error responses
- Includes stack traces in development mode
- Includes 404 not found handler

#### `async-handler.js`

- Utility wrapper for async route handlers
- Alternative to express-async-errors
- Catches async errors and passes to error middleware

### 📁 `src/models/` - Models Layer

**Purpose**: Data structures and business entities

#### `http-exception.js`

- Base HttpException class (extends Error)
- Pre-built exception classes:
  - BadRequestException (400)
  - UnauthorizedException (401)
  - ForbiddenException (403)
  - NotFoundException (404)
  - ConflictException (409)
  - InternalServerException (500)
- Includes error details and timestamp
- JSON serialization support

### 📁 `src/routes/` - Routes Layer

**Purpose**: API endpoints and request handling

#### `index.js`

- Main router that aggregates all route modules
- Mounts sub-routers under `/api` prefix
- Extendable for new features

#### `hello/hello.controller.js`

- HTTP request handlers for Hello endpoints
- Input validation
- Error handling
- Uses response utilities for consistent responses
- Routes:
  - `GET /api/hello` - Hello World
  - `GET /api/hello/:name` - Personalized greeting

#### `hello/hello.service.js`

- Business logic for Hello feature
- Pure functions (no HTTP concerns)
- Testable independently
- Methods:
  - `getHelloWorld()` - Returns hello message
  - `getPersonalizedGreeting(name)` - Returns personalized message
  - `getHealthStatus()` - Returns system health info

### 📁 `src/utils/` - Utilities Layer

**Purpose**: Shared helper functions

#### `response.utils.js`

- Standardized response formatters
- Functions:
  - `sendSuccess()` - Standard success response
  - `sendError()` - Standard error response
  - `sendCreated()` - 201 Created response
  - `sendNoContent()` - 204 No Content response
  - `sendPaginatedResponse()` - Paginated data response

### 📄 `src/server.js` - Application Entry Point

**Purpose**: Bootstrap and configure the Express application

**Features**:

- Express app initialization
- Middleware registration (order matters!)
- Security headers (Helmet)
- CORS configuration
- Body parsers (JSON, URL-encoded)
- Morgan HTTP logger
- Custom HTTP interceptor
- Route registration
- Error handlers (404 and global)
- Database connection
- Graceful shutdown handlers
- Process error handlers (uncaught exceptions, unhandled rejections)

**Middleware Order**:

1. Helmet (security headers)
2. CORS
3. Body parsers
4. Morgan (HTTP logger)
5. Custom HTTP interceptor
6. Routes
7. 404 handler
8. Global error handler (must be last)

## Request Flow

```
Client Request
    ↓
Helmet (security)
    ↓
CORS
    ↓
Body Parser
    ↓
Morgan + Winston (HTTP logging)
    ↓
HTTP Interceptor (request ID, logging)
    ↓
Router (routes/index.js)
    ↓
Feature Router (hello/hello.controller.js)
    ↓
Service (hello/hello.service.js)
    ↓
Response Utils (format response)
    ↓
HTTP Interceptor (response logging)
    ↓
Client Response
```

## Error Flow

```
Error Thrown
    ↓
Express-Async-Errors (catches async errors)
    ↓
Error Handler Middleware
    ↓
Identify Error Type:
  - HttpException → Extract status/message
  - Mongoose Error → Convert to 400/409
  - JWT Error → Convert to 401
  - Unknown → 500 Internal Server Error
    ↓
Log Error (Winston)
    ↓
Format Error Response
    ↓
Send to Client
```

## Adding New Features

### Step 1: Create Feature Folder

```bash
mkdir -p src/routes/feature-name
```

### Step 2: Create Service

```javascript
// src/routes/feature-name/feature.service.js
class FeatureService {
  async doSomething() {
    // Business logic here
  }
}
export default new FeatureService();
```

### Step 3: Create Controller

```javascript
// src/routes/feature-name/feature.controller.js
import { Router } from 'express';
import featureService from './feature.service.js';
import { sendSuccess } from '../../utils/response.utils.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const data = await featureService.doSomething();
    sendSuccess(res, 'Success message', data);
  } catch (error) {
    next(error);
  }
});

export default router;
```

### Step 4: Register Route

```javascript
// src/routes/index.js
import featureController from './feature-name/feature.controller.js';
router.use('/feature-name', featureController);
```

## Environment Configuration

Configuration is managed through environment variables loaded from `.env` file:

```env
NODE_ENV=development          # Environment mode
PORT=3000                     # Server port
MONGODB_URI=mongodb://...     # Database connection
LOG_LEVEL=debug               # Winston log level
```

Access configuration:

```javascript
import envConfig from './config/env.config.js';

console.log(envConfig.env); // 'development'
console.log(envConfig.port); // 3000
console.log(envConfig.isDevelopment); // true
```

## Logging Strategy

### Console Logs (Development)

- Colorized output
- Human-readable format
- All log levels

### File Logs (All Environments)

- `logs/combined.log` - All logs (info, warn, error)
- `logs/error.log` - Error logs only
- JSON format for parsing
- Automatic rotation (5MB max, 5 files)

### Log Levels

- `error` - Errors and exceptions
- `warn` - Warnings and deprecations
- `info` - General information (default)
- `debug` - Detailed debugging information

### Logging Examples

```javascript
import logger from './config/logger.config.js';

logger.info('User logged in', { userId: 123 });
logger.warn('API rate limit approaching', { usage: '95%' });
logger.error('Database connection failed', { error: err.message });
logger.debug('Request payload', { data: req.body });
```

## Testing API Endpoints

### Using cURL

```bash
# Health check
curl http://localhost:3000/

# Hello World
curl http://localhost:3000/api/hello

# Personalized greeting
curl http://localhost:3000/api/hello/YourName

# Test error handling
curl http://localhost:3000/api/nonexistent
```

### Expected Responses

**Success (200)**:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error (4xx/5xx)**:

```json
{
  "success": false,
  "message": "Error description",
  "requestId": "uuid-here",
  "stack": "..." // development only
}
```

## Key Design Patterns

1. **Singleton Pattern**: Config and service classes
2. **Factory Pattern**: Exception classes
3. **Middleware Pattern**: Express middleware chain
4. **Service Layer Pattern**: Business logic separation
5. **Repository Pattern**: Database access (to be implemented)

## Security Features

- **Helmet**: HTTP security headers
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Request parameter validation
- **Error Sanitization**: No sensitive data in errors (production)
- **Request ID Tracing**: Track requests across logs

## Performance Considerations

- **Connection Pooling**: Mongoose connection pool (10 connections)
- **Async Operations**: Non-blocking I/O
- **Graceful Shutdown**: Proper cleanup on termination
- **Log Rotation**: Prevent disk space issues
- **Error Recovery**: Auto-reconnect to database

## Future Enhancements

- [ ] Add authentication (JWT)
- [ ] Add authorization (role-based)
- [ ] Add rate limiting
- [ ] Add request validation (Joi/Zod)
- [ ] Add API documentation (Swagger)
- [ ] Add unit tests (Jest)
- [ ] Add integration tests
- [ ] Add database models
- [ ] Add data validation schemas
- [ ] Add caching layer (Redis)
