FROM node:22-alpine

WORKDIR /app

# Copy backend package files
COPY packages/backend/package*.json ./

# Install dependencies
RUN npm install

# Copy backend source
COPY packages/backend/ ./

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]