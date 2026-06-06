FROM node:22-bookworm-slim AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build

COPY tsconfig.json ./
COPY src ./src
COPY docs ./docs
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
    MCP_TRANSPORT=http \
    HOST=0.0.0.0 \
    PORT=3000 \
    MCP_PATH=/mcp \
    MCP_BEARER_TOKEN=

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends dumb-init \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 1001 mcp \
    && useradd --uid 1001 --gid mcp --home-dir /app --shell /usr/sbin/nologin mcp

COPY --from=build --chown=mcp:mcp /app/package*.json ./
COPY --from=build --chown=mcp:mcp /app/node_modules ./node_modules
COPY --from=build --chown=mcp:mcp /app/dist ./dist
COPY --from=build --chown=mcp:mcp /app/docs ./docs

USER mcp

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
