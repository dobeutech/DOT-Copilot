# =============================================================================
# Non-Root Nginx Dockerfile
# =============================================================================
# Security-hardened nginx image running as non-root user
# Listens on port 8080 instead of privileged port 80
# =============================================================================

FROM nginx:1.25-alpine

# Create non-root user and group
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx

# Create necessary directories with proper permissions
RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp \
             /var/log/nginx \
             /var/run && \
    chown -R nginx:nginx /var/cache/nginx \
                         /var/log/nginx \
                         /var/run \
                         /etc/nginx/conf.d \
                         /usr/share/nginx/html

# Create nginx.pid file with proper permissions
RUN touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

# Set ownership of configuration files
RUN chown -R nginx:nginx /etc/nginx

# Switch to non-root user
USER nginx

# Expose non-privileged port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
