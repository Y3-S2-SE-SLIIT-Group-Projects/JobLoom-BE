# Quick Start Guide - JobLoom Backend

Get up and running with JobLoom Backend in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js version (need v18+)
node --version

# Check npm
npm --version

# Check if MongoDB is installed (optional for Hello World testing)
mongod --version
```

## Installation

### 1. Install Dependencies

```bash
npm install
```

This installs:

- express (web framework)
- mongoose (MongoDB ODM)
- winston (logger)
- helmet (security)
- cors (CORS support)
- dotenv (environment variables)
- morgan (HTTP logger)
- uuid (unique IDs)
- nodemon (dev auto-reload)

### 2. Configure Environment

The `.env` file is already created with defaults. You can modify it if needed:

```bash
# .env file (already configured)
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/jobloom
LOG_LEVEL=debug
```

## Running the Application

### Option 1: Development Mode (Recommended)

```bash
npm run dev
```

- Auto-reloads on file changes
- Detailed logging
- Works without MongoDB

### Option 2: Production Mode

```bash
npm start
```

- No auto-reload
- Requires MongoDB connection (or will fail in production mode)

## Verify It's Working

### 1. Check Server Logs

You should see:

```
2026-02-11 13:13:06 [info]: Server started successfully
2026-02-11 13:13:06 [info]: API available at http://localhost:3000
2026-02-11 13:13:06 [info]: Health check: http://localhost:3000/
2026-02-11 13:13:06 [info]: Hello World API: http://localhost:3000/api/hello
```

### 2. Test Health Check

Open browser or use curl:

```bash
curl http://localhost:3000/
```

Expected response:

```json
{
  "success": true,
  "message": "JobLoom API is running",
  "data": {
    "status": "OK",
    "uptime": 17.58,
    "timestamp": "2026-02-11T07:43:18.421Z",
    "environment": "development",
    "nodeVersion": "v22.20.0",
    "memory": {
      "used": 20,
      "total": 22,
      "unit": "MB"
    }
  }
}
```

### 3. Test Hello World

```bash
curl http://localhost:3000/api/hello
```

Expected response:

```json
{
  "success": true,
  "message": "Hello World!",
  "data": {
    "message": "Hello World!",
    "timestamp": "2026-02-11T07:43:19.140Z",
    "environment": "development",
    "version": "1.0.0"
  }
}
```

### 4. Test Personalized Greeting

```bash
curl http://localhost:3000/api/hello/Developer
```

Expected response:

```json
{
  "success": true,
  "message": "Greeting generated successfully",
  "data": {
    "message": "Hello, Developer!",
    "greeting": "Welcome to JobLoom API, Developer!",
    "timestamp": "2026-02-11T07:43:18.859Z"
  }
}
```

## Testing Features

### HTTP Interceptor (Request Logging)

Every request is logged with:

- Unique request ID
- Method and URL
- IP address
- User agent
- Response time

Check `logs/combined.log` to see logs.

### Exception Filter (Error Handling)

Test 404 error:

```bash
curl http://localhost:3000/api/nonexistent
```

Response:

```json
{
  "success": false,
  "message": "Route not found: GET /api/nonexistent",
  "requestId": "uuid-here",
  "stack": "..." // in development only
}
```

Test validation error:

```bash
curl "http://localhost:3000/api/hello/ThisNameIsWayTooLongAndExceedsFiftyCharactersLimit"
```

Response:

```json
{
  "success": false,
  "message": "Name is too long (max 50 characters)",
  "requestId": "uuid-here"
}
```

### Winston Logger

Logs are written to:

- **Console**: Colorized, human-readable
- **logs/combined.log**: All logs in JSON format
- **logs/error.log**: Only errors

View logs:

```bash
# View combined logs
tail -f logs/combined.log

# View error logs
tail -f logs/error.log
```

### Environment Config

Configuration is centralized in `src/config/env.config.js`:

```javascript
import envConfig from './config/env.config.js';

console.log(envConfig.env); // 'development'
console.log(envConfig.port); // 3000
console.log(envConfig.mongodbUri); // 'mongodb://...'
console.log(envConfig.isDevelopment); // true
console.log(envConfig.isProduction); // false
```

## MongoDB Setup (Optional)

The Hello World API works without MongoDB. To enable database features:

### Option 1: Local MongoDB

**macOS (Homebrew)**:

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian**:

```bash
sudo apt-get install -y mongodb
sudo systemctl start mongod
```

### Option 2: Docker

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Option 3: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `.env`:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobloom
```

## Project Structure Overview

```
src/
├── config/              # Configuration (database, env, logger)
├── middleware/          # Middleware (interceptor, error handler)
├── models/              # Data models (exceptions)
├── routes/              # API routes (controllers + services)
├── utils/               # Utilities (response helpers)
└── server.js            # Main entry point
```

## Common Commands

```bash
# Development with auto-reload
npm run dev

# Production
npm start

# View logs (requires tail command)
tail -f logs/combined.log

# Test API
curl http://localhost:3000/api/hello
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or change port in .env
PORT=3001
```

### MongoDB Connection Error

**Error**: `connect ECONNREFUSED 127.0.0.1:27017`

**Solutions**:

1. **Development**: Server will start without database (Hello World still works)
2. **Start MongoDB**: See MongoDB Setup section above
3. **Update Connection String**: Check `MONGODB_URI` in `.env`

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Permission Denied (Linux/Mac)

```bash
# Don't use sudo with npm
# Fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

## Next Steps

1. **Add Authentication**: Implement JWT authentication
2. **Add More Routes**: Create new features in `src/routes/`
3. **Add Database Models**: Create Mongoose schemas
4. **Add Tests**: Write unit and integration tests
5. **Add API Docs**: Implement Swagger/OpenAPI docs

## Getting Help

- **Logs**: Check `logs/combined.log` and `logs/error.log`
- **README**: See `README.md` for detailed documentation
- **Structure**: See `PROJECT_STRUCTURE.md` for architecture details

## Useful Links

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Winston Logger](https://github.com/winstonjs/winston)
- [MongoDB Documentation](https://www.mongodb.com/docs/)

---

**You're all set!** 🚀

The server is running at: http://localhost:3000
