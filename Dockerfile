# STAGE 1: Build Expo Web
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Export web application
RUN npx expo export -p web

# STAGE 2: Serve dengan Nginx
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

# Salin hasil build dari Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Salin konfigurasi Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
