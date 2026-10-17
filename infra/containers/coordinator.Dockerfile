# Workspace packages export TypeScript source; retain the tsx runtime deliberately.
FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/coordinator ./apps/coordinator
COPY scripts/Copy-Coordinator-Migrations.mjs ./scripts/Copy-Coordinator-Migrations.mjs
RUN npm ci --workspace=@c-optiforge/coordinator --include-workspace-root=true
RUN npm run build -w @c-optiforge/coordinator

FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends gcc libc6-dev python3 openjdk-17-jdk-headless && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build --chown=node:node /app /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4100
USER node
EXPOSE 4100
CMD ["node", "--import", "tsx", "apps/coordinator/src/server.ts"]
