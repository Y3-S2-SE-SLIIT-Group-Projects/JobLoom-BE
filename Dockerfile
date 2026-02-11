# Multi-stage Dockerfile for Node.js Application
# Industry-level production-ready configuration

# ==========================================
# Stage 1: Base Image
# ==========================================
FROM node:22-alpine AS base

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# ==========================================
# Stage 2: Dependencies
# ==========================================
FROM base AS dependencies

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies)
RUN npm ci --include=dev

# ==========================================
# Stage 3: Production Dependencies
# ==========================================
FROM base AS production-dependencies

# Copy package files
COPY package*.json ./

# Install only production dependencies (skip prepare scripts like husky)
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# ==========================================
# Stage 4: Development
# ==========================================
FROM base AS development

# Set NODE_ENV
ENV NODE_ENV=development

# Copy all dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Development command with nodemon
CMD ["npm", "run", "dev"]

# ==========================================
# Stage 5: Builder (for production build if needed)
# ==========================================
FROM dependencies AS builder

# Copy application code
COPY . .

# Run any build steps (if you add TypeScript or bundling later)
# RUN npm run build

# Create logs directory
RUN mkdir -p logs

# ==========================================
# Stage 6: Production
# ==========================================
FROM base AS production

# Set NODE_ENV
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies
COPY --from=production-dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create logs directory with proper permissions
RUN mkdir -p logs && \
    chown -R nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Production command
CMD ["node", "src/server.js"]

# ==========================================
# Stage 7: Testing/Staging
# ==========================================
FROM base AS testing

# Set NODE_ENV
ENV NODE_ENV=test

# Copy all dependencies (including dev for testing)
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]

# Testing command
CMD ["npm", "run", "dev"]
