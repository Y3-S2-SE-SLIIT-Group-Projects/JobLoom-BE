# JobLoom Backend API

A complete MERN stack backend application with a modular, scalable architecture featuring Winston logging, HTTP interceptors, exception filters, and environment configuration.

## Features

- **ES Modules**: Modern JavaScript with ES6+ import/export syntax
- **MongoDB with Mongoose**: MongoDB database integration with Mongoose ODM
- **Winston Logger**: Advanced logging with multiple transports and log levels
- **HTTP Interceptor**: Request/response logging with unique request IDs
- **Exception Filters**: Global error handling with custom exception classes
- **Environment Configuration**: Centralized configuration service with validation
- **Security**: Helmet for security headers, CORS configuration
- **Modular Architecture**: Clean separation of concerns with controllers, services, and models

## Project Structure

```
src/
├── config/
│   ├── database.js          # MongoDB connection configuration
│   ├── env.config.js        # Environment configuration service
│   └── logger.config.js     # Winston logger setup
├── middleware/
│   ├── http-interceptor.js  # Request/response interceptor
│   ├── error-handler.js     # Global exception filter
│   └── async-handler.js     # Async error wrapper
├── models/
│   └── http-exception.js    # Custom exception classes
├── routes/
│   ├── index.js            # Main router
│   └── hello/
│       ├── hello.controller.js
│       └── hello.service.js
├── utils/
│   └── response.utils.js    # Standardized response helpers
└── server.js                # Main application entry point
```

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd JobLoom-BE
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` and update the values:

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/jobloom
   LOG_LEVEL=debug
   ```

4. **Start MongoDB**

   Make sure MongoDB is running on your system:

   ```bash
   # macOS (with Homebrew)
   brew services start mongodb-community

   # Linux (systemd)
   sudo systemctl start mongod

   # Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

## Running the Application

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check

```
GET /
```

Returns API health status and system information.

**Response:**

```json
{
  "success": true,
  "message": "JobLoom API is running",
  "data": {
    "status": "OK",
    "uptime": 123.45,
    "timestamp": "2026-02-11T...",
    "environment": "development",
    "nodeVersion": "v18.0.0",
    "memory": {
      "used": 45,
      "total": 100,
      "unit": "MB"
    },
    "apiDocs": "/api"
  }
}
```

### Hello World

```
GET /api/hello
```

Returns a Hello World message with metadata.

**Response:**

```json
{
  "success": true,
  "message": "Hello World!",
  "data": {
    "message": "Hello World!",
    "timestamp": "2026-02-11T...",
    "environment": "development",
    "version": "1.0.0"
  }
}
```

### Personalized Greeting

```
GET /api/hello/:name
```

Returns a personalized greeting message.

**Parameters:**

- `name` (string, required): Name to greet (max 50 characters)

**Response:**

```json
{
  "success": true,
  "message": "Greeting generated successfully",
  "data": {
    "message": "Hello, John!",
    "greeting": "Welcome to JobLoom API, John!",
    "timestamp": "2026-02-11T..."
  }
}
```

## Error Handling

The API uses standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "field": "fieldName",
    "message": "Detailed error message"
  },
  "requestId": "uuid-v4",
  "stack": "Error stack (development only)"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate entries)
- `500` - Internal Server Error

## Logging

The application uses Winston for logging with the following features:

- **Console logging**: Colorized output for development
- **File logging**: Separate files for all logs and errors
- **Log levels**: error, warn, info, debug
- **Request logging**: All HTTP requests and responses are logged

Log files are stored in the `logs/` directory:

- `combined.log` - All log levels
- `error.log` - Error logs only

## Architecture Patterns

### Controllers

Handle HTTP requests/responses and input validation. Controllers should be thin and delegate business logic to services.

### Services

Contain business logic and data operations. Services are reusable and testable independently.

### Models

Define data schemas, custom error classes, and database models.

### Middleware

Cross-cutting concerns like logging, authentication, error handling, and request processing.

### Utilities

Helper functions and shared utilities used across the application.

## Custom Exception Classes

The application provides several pre-built exception classes:

```javascript
import {
  BadRequestException, // 400
  UnauthorizedException, // 401
  ForbiddenException, // 403
  NotFoundException, // 404
  ConflictException, // 409
  InternalServerException, // 500
} from './models/http-exception.js';

// Usage
throw new BadRequestException('Invalid input data');
throw new NotFoundException('User not found');
```

## Environment Variables

| Variable      | Description                               | Default                           |
| ------------- | ----------------------------------------- | --------------------------------- |
| `NODE_ENV`    | Environment (development/production/test) | development                       |
| `PORT`        | Server port                               | 3000                              |
| `MONGODB_URI` | MongoDB connection string                 | mongodb://localhost:27017/jobloom |
| `LOG_LEVEL`   | Winston log level (error/warn/info/debug) | info                              |

## Scripts

| Command       | Description                                           |
| ------------- | ----------------------------------------------------- |
| `npm start`   | Start the server in production mode                   |
| `npm run dev` | Start the server in development mode with auto-reload |
| `npm test`    | Run tests (not implemented yet)                       |

## Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:3000/

# Hello World
curl http://localhost:3000/api/hello

# Personalized greeting
curl http://localhost:3000/api/hello/John

# Test 404 error
curl http://localhost:3000/api/nonexistent

# Test validation error
curl http://localhost:3000/api/hello/
```

### Using HTTPie

```bash
# Health check
http localhost:3000/

# Hello World
http localhost:3000/api/hello

# Personalized greeting
http localhost:3000/api/hello/John
```

## Development Guidelines

### Adding New Routes

1. Create a new folder in `src/routes/` for your feature
2. Create a controller file (e.g., `feature.controller.js`)
3. Create a service file (e.g., `feature.service.js`)
4. Register the route in `src/routes/index.js`

Example:

```javascript
// src/routes/users/users.controller.js
import { Router } from 'express';
import usersService from './users.service.js';
import { sendSuccess } from '../../utils/response.utils.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const users = await usersService.getAllUsers();
    sendSuccess(res, 'Users retrieved successfully', users);
  } catch (error) {
    next(error);
  }
});

export default router;

// src/routes/index.js
import usersController from './users/users.controller.js';
router.use('/users', usersController);
```

## License

ISC

## Contributors

SLIIT Group Project - Year 3 Semester 2
