FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and lockfile
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm run build

# Expose port
EXPOSE 3000

# Start the application and run migrations if needed (or assume it's done during deploy phase)
CMD ["pnpm", "run", "start:prod"]
