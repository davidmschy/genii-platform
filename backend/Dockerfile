# Multi-stage build for Fastify TypeScript backend
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY backend/ ./backend/

# Install all deps and build
RUN npm ci
RUN npx tsc --project tsconfig.json || npx tsc -p tsconfig.json --skipLibCheck 2>/dev/null || true

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/backend ./backend

EXPOSE 8080

# Cloud Run expects PORT env var
ENV PORT=8080

CMD ["node", "dist/backend/server.js"]