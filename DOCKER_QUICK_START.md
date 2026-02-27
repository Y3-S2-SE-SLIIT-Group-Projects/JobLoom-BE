# Docker Quick Start Guide

Get the JobLoom Backend running with Docker in 5 minutes!

## Prerequisites

- Docker installed
- Docker Compose installed
- MongoDB Atlas account (free tier available)

## 🚀 Quick Start

### 1. Clone & Setup

```bash
cd JobLoom-BE

# Copy environment file
cp .env.example .env
```

### 2. Configure MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Get connection string
5. Update `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jobloom?retryWrites=true&w=majority
```

### 3. Start Development Environment

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app
```

### 4. Test the API

```bash
# Health check
curl http://localhost:3000/health

# Hello World
curl http://localhost:3000/api/hello

# Redis Commander UI
open http://localhost:8082
```

## 📦 Available Environments

### Development

```bash
docker-compose -f docker-compose.dev.yml up -d
```

- Hot reload enabled
- Redis + Redis Commander UI
- Port: 3000

### Staging

```bash
docker-compose -f docker-compose.staging.yml up -d
```

- Production-like environment
- Nginx reverse proxy
- Port: 80

### Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

- Load balanced (3 replicas)
- SSL/TLS with Nginx
- Redis caching
- Prometheus + Grafana monitoring

## 🛠️ Common Commands

```bash
# Stop services
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Rebuild after changes
docker-compose -f docker-compose.dev.yml up --build

# Execute commands in container
docker-compose -f docker-compose.dev.yml exec app sh

# Install new npm package
docker-compose -f docker-compose.dev.yml exec app npm install package-name

# Clean up everything
docker-compose -f docker-compose.dev.yml down -v
```

## 🔧 Troubleshooting

### Port 3000 already in use

```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in docker-compose.dev.yml
ports:
  - "3001:3000"
```

### MongoDB connection fails

1. Check Atlas IP whitelist (add 0.0.0.0/0 for development)
2. Verify credentials in `.env`
3. Test connection string with mongosh

### Container won't start

```bash
# Check logs
docker-compose -f docker-compose.dev.yml logs app

# Rebuild
docker-compose -f docker-compose.dev.yml up --build
```

## 📖 Full Documentation

See [docs/DOCKER.md](docs/DOCKER.md) for complete Docker and CI/CD documentation.

## 🎯 Next Steps

1. **API Development**: Add new routes in `src/routes/`
2. **Database Models**: Create Mongoose schemas
3. **Authentication**: Implement JWT auth
4. **Testing**: Write unit and integration tests
5. **CI/CD**: Push to GitHub to trigger pipeline

## 📚 Quick Links

- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Redis Commander**: http://localhost:8082
- **Grafana** (prod): http://localhost:3001

---

Happy coding! 🚀
