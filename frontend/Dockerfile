# Stage 1: build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080

# Replace BACKEND_URL_PLACEHOLDER with actual env var at container start
CMD sh -c "sed -i \"s|BACKEND_URL_PLACEHOLDER|${BACKEND_URL}|g\" /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
