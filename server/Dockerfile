FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Buat direktori data untuk database SQLite
RUN mkdir -p /app/data

ENV PORT=4000
ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "src/index.js"]
