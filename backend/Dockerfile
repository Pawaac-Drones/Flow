FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install dependencies
RUN npm install --workspace=backend --workspace=shared

# Copy source code
COPY shared/ ./shared/
COPY backend/ ./backend/

# Build
RUN npm run build --workspace=backend

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/shared/src ./shared/src

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "backend/dist/main.js"]
