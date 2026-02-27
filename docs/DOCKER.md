# Docker & CI/CD Documentation

Complete guide for Docker containerization and CI/CD pipelines for JobLoom Backend.

## Table of Contents

- [Docker Setup](#docker-setup)
- [Development Environment](#development-environment)
- [Staging Environment](#staging-environment)
- [Production Environment](#production-environment)
- [CI/CD Pipeline](#cicd-pipeline)
- [MongoDB Atlas Integration](#mongodb-atlas-integration)
- [Troubleshooting](#troubleshooting)

---

## Docker Setup

### Prerequisites

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Project Structure

```
JobLoom-BE/
├── Dockerfile                      # Multi-stage Docker image
├── .dockerignore                   # Files to exclude from image
├── docker-compose.dev.yml          # Development configuration
├── docker-compose.staging.yml      # Staging configuration
├── docker-compose.prod.yml         # Production configuration
├── nginx/                          # Nginx configurations
│   ├── nginx.prod.conf
│   ├── nginx.staging.conf
│   └── README.md
└── .github/workflows/              # CI/CD pipelines
    ├── ci.yml
    ├── deploy-staging.yml
    └── deploy-production.yml
```

---

## Development Environment

### Quick Start

```bash
# 1. Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB Atlas connection string

# 2. Start development environment
docker-compose -f docker-compose.dev.yml up -d

# 3. View logs
docker-compose -f docker-compose.dev.yml logs -f app

# 4. Stop services
docker-compose -f docker-compose.dev.yml down
```

### Development Services

The development setup includes:

- **app**: Node.js application with hot reload
- **redis**: Redis cache (optional)
- **redis-commander**: Redis GUI at http://localhost:8082

### Hot Reload

Source code is mounted as a volume, so changes are reflected immediately:

```yaml
volumes:
  - ./src:/app/src:ro # Read-only mount for security
```

### Development Commands

```bash
# Start services
docker-compose -f docker-compose.dev.yml up

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose -f docker-compose.dev.yml down

# Rebuild image after dependency changes
docker-compose -f docker-compose.dev.yml up --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Execute commands in container
docker-compose -f docker-compose.dev.yml exec app sh
docker-compose -f docker-compose.dev.yml exec app npm install <package>

# Remove volumes (clean slate)
docker-compose -f docker-compose.dev.yml down -v
```

---

## Staging Environment

### Setup

```bash
# 1. Create staging environment file
cp .env.staging.example .env.staging
# Edit with staging MongoDB Atlas credentials

# 2. Start staging environment
docker-compose -f docker-compose.staging.yml up -d

# 3. Check health
curl http://localhost/health
```

### Staging Services

- **app**: Application in test mode
- **nginx**: Reverse proxy
- **redis**: Caching layer

### Staging Configuration

Key differences from development:

- Uses `testing` Docker target
- Includes Nginx reverse proxy
- Resource limits applied
- Production-like environment

---

## Production Environment

### Prerequisites

1. **MongoDB Atlas** cluster ready
2. **SSL certificates** in `nginx/ssl/`
3. **Environment secrets** configured
4. **Domain name** pointed to server

### Setup

```bash
# 1. Create production environment file
cp .env.production.example .env.production
# Edit with production credentials

# 2. Generate or add SSL certificates
# See nginx/README.md for instructions

# 3. Deploy production stack
docker-compose -f docker-compose.prod.yml up -d

# 4. Check health
curl https://yourdomain.com/health
```

### Production Services

- **app** (3 replicas): Load-balanced Node.js instances
- **nginx**: Reverse proxy with SSL/TLS
- **redis**: Session store and cache
- **prometheus**: Metrics collection
- **grafana**: Metrics visualization

### Production Features

#### 1. High Availability

- Multiple app replicas (3 by default)
- Nginx load balancing with `least_conn`
- Health checks and auto-restart

#### 2. Security

- SSL/TLS encryption
- Security headers (HSTS, CSP, etc.)
- Rate limiting
- Non-root user in container
- Secrets management

#### 3. Monitoring

- Prometheus metrics
- Grafana dashboards at port 3001
- Application health checks
- Resource usage tracking

#### 4. Performance

- Redis caching
- Gzip compression
- Connection pooling
- Resource limits

### Scaling

```bash
# Scale app instances
docker-compose -f docker-compose.prod.yml up -d --scale app=5

# Scale specific services
docker-compose -f docker-compose.prod.yml up -d --scale app=5 --scale redis=1
```

### Zero-Downtime Deployment

```bash
# 1. Pull new images
docker-compose -f docker-compose.prod.yml pull

# 2. Scale up with new version
docker-compose -f docker-compose.prod.yml up -d --no-deps --scale app=6 app

# 3. Wait for health checks
sleep 30

# 4. Scale down to desired count
docker-compose -f docker-compose.prod.yml up -d --no-deps --scale app=3 app
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

#### 1. CI Pipeline (`ci.yml`)

Runs on every push and pull request:

**Jobs:**

- **Lint**: Code quality checks
- **Security**: npm audit and Snyk scan
- **Test**: Unit and integration tests
- **Build**: Docker image build verification

**Triggers:**

```yaml
on:
  push:
    branches: [main, develop, 'feature/**']
  pull_request:
    branches: [main, develop]
```

#### 2. Staging Deployment (`deploy-staging.yml`)

Auto-deploys to staging on `develop` branch:

**Jobs:**

- **Build & Push**: Build Docker image, push to registry
- **Deploy**: Deploy to staging server via SSH
- **Health Check**: Verify deployment
- **Notify**: Slack notification

**Triggers:**

```yaml
on:
  push:
    branches: [develop]
```

#### 3. Production Deployment (`deploy-production.yml`)

Deploys to production with manual approval:

**Jobs:**

- **Build & Push**: Build production image
- **Security Scan**: Trivy vulnerability scan
- **Deploy**: Rolling update with zero-downtime
- **Smoke Tests**: Production health verification
- **Rollback**: Automatic rollback on failure

**Triggers:**

```yaml
on:
  push:
    branches: [main]
    tags: ['v*.*.*']
```

### Required GitHub Secrets

Configure these in GitHub repository settings → Secrets:

#### Development/CI Secrets

- `MONGODB_URI_TEST`: Test database connection string
- `SNYK_TOKEN`: Snyk security scanning token (optional)

#### Staging Secrets

- `STAGING_HOST`: Staging server IP/hostname
- `STAGING_USER`: SSH username
- `STAGING_SSH_KEY`: SSH private key
- `STAGING_SSH_PORT`: SSH port (default 22)
- `STAGING_URL`: Staging URL for health checks
- `MONGODB_URI_STAGING`: Staging MongoDB Atlas URI
- `ALLOWED_ORIGINS_STAGING`: Allowed CORS origins

#### Production Secrets

- `PROD_HOST`: Production server IP/hostname
- `PROD_USER`: SSH username
- `PROD_SSH_KEY`: SSH private key
- `PROD_SSH_PORT`: SSH port (default 22)
- `MONGODB_URI_PROD`: Production MongoDB Atlas URI
- `ALLOWED_ORIGINS_PROD`: Production CORS origins
- `REDIS_PASSWORD`: Redis password
- `GRAFANA_PASSWORD`: Grafana admin password
- `JWT_SECRET`: JWT signing secret
- `SLACK_WEBHOOK`: Slack webhook URL for notifications

### Branch Strategy

```
main (production)
  ↑
  merge via PR with approval
  ↑
develop (staging)
  ↑
  merge via PR
  ↑
feature/* (development)
```

### Deployment Flow

```
1. Developer pushes to feature branch
   → CI pipeline runs (lint, test, build)

2. Create PR to develop
   → CI pipeline runs
   → Code review
   → Merge to develop

3. Merge to develop
   → CI pipeline runs
   → Auto-deploy to staging
   → Slack notification

4. Create PR to main
   → CI pipeline runs
   → Code review
   → Approval required

5. Merge to main or push tag
   → CI pipeline runs
   → Build production image
   → Security scan
   → Manual approval gate
   → Deploy to production
   → Smoke tests
   → Slack notification
```

---

## MongoDB Atlas Integration

### Why Atlas Instead of Dockerized MongoDB?

1. **Managed Service**: Automated backups, monitoring, scaling
2. **High Availability**: Multi-region replication
3. **Security**: Encryption at rest and in transit
4. **Cost-Effective**: No need to manage database servers
5. **Performance**: Optimized infrastructure

### Setup MongoDB Atlas

1. **Create Account**: https://www.mongodb.com/cloud/atlas
2. **Create Cluster**: Free tier available
3. **Database Access**: Create database user
4. **Network Access**: Add IP addresses (0.0.0.0/0 for development)
5. **Get Connection String**:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/jobloom
   ```

### Connection String Format

```bash
# Development
MONGODB_URI=mongodb+srv://dev_user:password@cluster.mongodb.net/jobloom-dev?retryWrites=true&w=majority

# Staging
MONGODB_URI_STAGING=mongodb+srv://staging_user:password@cluster.mongodb.net/jobloom-staging?retryWrites=true&w=majority

# Production
MONGODB_URI_PROD=mongodb+srv://prod_user:password@cluster.mongodb.net/jobloom-prod?retryWrites=true&w=majority
```

### Best Practices

1. **Separate Clusters**: Different clusters for dev/staging/prod
2. **Strong Passwords**: Use generated passwords
3. **IP Whitelisting**: Restrict access to known IPs
4. **Database Users**: Separate users for each environment
5. **Backups**: Enable continuous backups
6. **Monitoring**: Set up Atlas alerts

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.dev.yml logs app

# Check if port is in use
lsof -ti:3000
kill -9 $(lsof -ti:3000)

# Rebuild image
docker-compose -f docker-compose.dev.yml up --build
```

### MongoDB Connection Issues

```bash
# Test connection string
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/db"

# Check application logs
docker-compose -f docker-compose.dev.yml logs app | grep -i mongo

# Verify IP whitelist in Atlas
# Atlas → Network Access → Add current IP
```

### Hot Reload Not Working

```bash
# Ensure volumes are mounted correctly
docker-compose -f docker-compose.dev.yml config

# Restart with clean volumes
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up
```

### High Memory Usage

```bash
# Check resource usage
docker stats

# Set memory limits in docker-compose
deploy:
  resources:
    limits:
      memory: 512M
```

### SSL Certificate Issues

```bash
# Test certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Renew Let's Encrypt certificate
certbot renew

# Copy to nginx directory
cp /etc/letsencrypt/live/yourdomain.com/* nginx/ssl/
```

### Health Check Failures

```bash
# Test health endpoint
curl http://localhost:3000/health
curl http://localhost:3000/healthz
curl http://localhost:3000/ready

# Check application logs
docker logs <container_id>

# Verify MongoDB connection
docker exec -it <container_id> node -e "console.log(process.env.MONGODB_URI)"
```

### CI/CD Pipeline Failures

```bash
# Check GitHub Actions logs
# Go to repository → Actions → Select workflow run

# Common issues:
# 1. Missing secrets → Add in Settings → Secrets
# 2. SSH key issues → Regenerate and update
# 3. Test failures → Fix tests locally first
# 4. Build failures → Check Dockerfile syntax
```

---

## Useful Commands

### Docker

```bash
# List running containers
docker ps

# List all containers
docker ps -a

# View container logs
docker logs <container_id>
docker logs -f <container_id>  # Follow logs

# Execute command in container
docker exec -it <container_id> sh
docker exec -it <container_id> npm install <package>

# Stop all containers
docker stop $(docker ps -aq)

# Remove all containers
docker rm $(docker ps -aq)

# Remove all images
docker rmi $(docker images -q)

# Clean up everything
docker system prune -a --volumes
```

### Docker Compose

```bash
# Start services
docker-compose up
docker-compose up -d  # Detached mode

# Stop services
docker-compose stop
docker-compose down  # Stop and remove
docker-compose down -v  # Also remove volumes

# View logs
docker-compose logs
docker-compose logs -f app  # Follow specific service

# Restart service
docker-compose restart app

# Scale service
docker-compose up -d --scale app=3

# Execute command
docker-compose exec app sh
docker-compose exec app npm test
```

### Health Checks

```bash
# Application health
curl http://localhost:3000/health
curl http://localhost:3000/healthz
curl http://localhost:3000/ready

# Docker health status
docker inspect --format='{{.State.Health.Status}}' <container_id>

# Nginx status
docker exec <nginx_container> nginx -t
```

---

## Best Practices

### 1. Security

- Never commit `.env` files
- Use secrets management
- Run containers as non-root
- Keep images updated
- Scan for vulnerabilities

### 2. Performance

- Use multi-stage builds
- Minimize image size
- Enable caching
- Use `.dockerignore`
- Set resource limits

### 3. Monitoring

- Implement health checks
- Use logging aggregation
- Monitor resource usage
- Set up alerts
- Track metrics

### 4. Deployment

- Test in staging first
- Use rolling updates
- Have rollback plan
- Document procedures
- Automate everything

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

**Questions or Issues?**
Open an issue on GitHub or contact the development team.
