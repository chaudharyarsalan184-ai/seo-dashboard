# SEO Dashboard - multi-stage build
FROM node:20-alpine AS frontend
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app

# Copy server and install its deps
COPY server ./server
RUN cd server && npm ci --omit=dev
COPY --from=frontend /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "server/index.js"]
