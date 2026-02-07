# Use the official Bun image
FROM oven/bun:1.0-slim AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the standalone binary
RUN bun run build

# Final production image
FROM debian:bookworm-slim
WORKDIR /app

# Install necessary runtime libraries (like openssl for iExec SDK)
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the binary from the build stage
COPY --from=base /app/privibase .

# Expose the webhook port
EXPOSE 3000

# Run the daemon
CMD ["./privibase"]
