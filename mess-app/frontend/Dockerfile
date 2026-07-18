# ============================================
# STAGE 1: BUILD
# ============================================

# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent && \
    npm cache clean --force

# Copy the rest of the application
COPY . .

# Set environment variables for build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL:-http://localhost:5000}

ARG VITE_APP_NAME
# Quote default value to allow spaces in the ENV assignment
ENV VITE_APP_NAME="${VITE_APP_NAME:-Mess Manager}"

# Build the application
RUN npm run build

# ============================================
# STAGE 2: PRODUCTION
# ============================================

# Use nginx alpine for serving static files
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create a health check script
RUN echo '#!/bin/sh\n\
if curl -f http://localhost/health || exit 1; then\n\
  exit 0\n\
else\n\
  exit 1\n\
fi' > /usr/local/bin/healthcheck.sh && \
chmod +x /usr/local/bin/healthcheck.sh

# Create a custom entrypoint script
RUN echo '#!/bin/sh\n\
echo "Starting Nginx with configuration:"\n\
echo "API_URL: ${VITE_API_URL}"\n\
echo "APP_NAME: ${VITE_APP_NAME}"\n\
\n\
# Replace API URL in JS files if environment variable is set\n\
if [ -n "${VITE_API_URL}" ]; then\n\
  echo "Replacing API URL in built files..."\n\
  find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|http://localhost:5000|${VITE_API_URL}|g" {} \\;\n\
fi\n\
\n\
# Start nginx\n\
nginx -g "daemon off;"' > /docker-entrypoint.sh && \
chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh

# Set the entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]