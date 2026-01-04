FROM node:18-alpine

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy apps and packages
COPY apps/ws-backend ./apps/ws-backend
COPY packages/backend-common ./packages/backend-common
COPY packages/typescript-config ./packages/typescript-config
COPY packages/db ./packages/db

# Install pnpm
RUN npm install -g pnpm@8.15.8

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
RUN cd apps/ws-backend && pnpm run build

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "apps/ws-backend/dist/index.ts"]
