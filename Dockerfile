# Development Dockerfile for AIRIS Code
FROM node:25-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.21.0 --activate

# Set working directory
WORKDIR /workspace

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY turbo.json tsconfig.base.json ./

# Copy all workspace packages
COPY packages/ ./packages/
COPY apps/ ./apps/

# Install dependencies
RUN pnpm install

# Build all packages
RUN pnpm turbo run build

# Default command
CMD ["pnpm", "--filter", "@airiscode/cli", "dev"]
