# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package dependency manifests
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application source code
COPY src/ ./src/
COPY index.js ./

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user and group
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy artifacts from builder stage with appropriate permissions
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/index.js ./index.js
COPY --from=builder --chown=nodejs:nodejs /app/src ./src

# Run as non-root user
USER nodejs

# Expose default application port
EXPOSE 5000

# Start server
CMD ["node", "index.js"]
