FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY frontend/package.json ./frontend/

# Install dependencies
RUN npm install --workspace=frontend --workspace=shared

# Copy source code
COPY shared/ ./shared/
COPY frontend/ ./frontend/

# Build
RUN npm run build --workspace=frontend

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./.next/static
COPY --from=builder /app/frontend/public ./public

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]
