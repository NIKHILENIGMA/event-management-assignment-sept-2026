FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json, lockfile, and npmrc
COPY package.json pnpm-lock.yaml .npmrc* ./

# Install dependencies (ignoring scripts to bypass the strict pnpm v11 security blocks)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Explicitly rebuild the necessary native dependencies
RUN pnpm rebuild argon2 esbuild @parcel/watcher msgpackr-extract unrs-resolver

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm run build

# Expose port
EXPOSE 3000

# Start the application and run migrations if needed (or assume it's done during deploy phase)
CMD ["pnpm", "run", "start:prod"]
