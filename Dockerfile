# Use the official lightweight Nginx Alpine base image
FROM nginx:alpine

# Add a label for image metadata
LABEL maintainer="Helpmefy DevOps Team <devops@helpmefy.org>"
LABEL version="1.2.0"
LABEL description="Automated Community Emergency Helping Platform Web Container"

# Copy custom Nginx virtual host configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove default static files from Nginx container
RUN rm -rf /usr/share/nginx/html/*

# Copy local application static assets into Nginx default serving root
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/

# Expose HTTP port 80
EXPOSE 80

# Run Nginx in foreground to keep container active
CMD ["nginx", "-g", "daemon off;"]
