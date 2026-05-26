FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 1. Prune the workspace
FROM base AS builder
# Set working directory
WORKDIR /app
# Install turbo globally
RUN pnpm install turbo --global
COPY . .
# Prune for api app
RUN turbo prune @repo/api --docker

# 2. Add dependencies and build
FROM base AS installer
WORKDIR /app
# First install the dependencies
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
RUN pnpm turbo run build --filter=@repo/api...

# 3. Final image
FROM base AS runner
WORKDIR /app
# Copy built application and dependencies
COPY --from=installer /app/ .

WORKDIR /app/apps/api

# Add non-root user
RUN addgroup --system --gid 1001 expressjs
RUN adduser --system --uid 1001 expressjs
USER expressjs

EXPOSE 8000
ENV PORT=8000
ENV NODE_ENV=production

CMD ["pnpm", "start"]
