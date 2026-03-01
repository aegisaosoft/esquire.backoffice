# ─── Stage 1: Build client ───
FROM node:22-alpine AS client-build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY client/package.json client/
COPY server/package.json server/
COPY tsconfig.base.json ./
RUN npm ci --workspace=client

COPY client/ client/
COPY tsconfig.base.json ./
RUN npm run build -w client

# ─── Stage 2: Build server ───
FROM node:22-alpine AS server-build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY client/package.json client/
COPY server/package.json server/
COPY tsconfig.base.json ./
RUN npm ci --workspace=server

COPY server/ server/
COPY tsconfig.base.json ./
RUN npm run build -w server

# ─── Stage 3: Production image ───
FROM node:22-alpine
WORKDIR /app

# Copy workspace root
COPY package.json package-lock.json* ./
COPY client/package.json client/
COPY server/package.json server/

# Install production dependencies only
RUN npm ci --omit=dev --workspace=server

# Copy built server
COPY --from=server-build /app/server/dist server/dist

# Copy built client
COPY --from=client-build /app/client/dist client/dist

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server/dist/index.js"]
