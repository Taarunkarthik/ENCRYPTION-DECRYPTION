# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker-runtime-config.sh /docker-entrypoint.d/10-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/10-runtime-config.sh
# Copy custom nginx config if needed, but default is usually fine for simple SPA
# If using React Router, we need to handle 404s by redirecting to index.html
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
