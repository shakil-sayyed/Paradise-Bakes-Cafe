# Use official Node.js LTS image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/
RUN cd backend && npm ci --production

# Copy backend source
COPY backend/src ./backend/src

# Build backend
RUN cd backend && npm run build

# Expose port
EXPOSE 5000

# Start the backend server
CMD ["node", "backend/dist/server.js"]

