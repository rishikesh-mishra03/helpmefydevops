
FROM nginx:alpine

LABEL maintainer="Helpmefy DevOps Team <devops@helpmefy.org>"
LABEL version="1.2.0"
LABEL description="Automated Community Emergency Helping Platform Web Container"

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN rm -rf /usr/share/nginx/html/*

COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
