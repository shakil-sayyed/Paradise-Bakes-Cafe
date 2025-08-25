# Paradise Bakes & Cafe - Dockerfile
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Install client dependencies and build
WORKDIR /app/client
RUN npm ci
RUN npm run build

# Return to app directory
WORKDIR /app

# Create uploads directory
RUN mkdir -p uploads

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S paradise -u 1001

# Change ownership of the app directory
RUN chown -R paradise:nodejs /app
USER paradise

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["npm", "start"]
