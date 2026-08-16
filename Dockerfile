# Surge itself is not compiled here any more: the surge-js package carries it
# as WebAssembly, so the image is node and nothing else.
# ── Stage 1: build the frontend ──────────────────────────────────────────────
FROM node:24-alpine AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci --workspace=frontend --ignore-scripts

COPY frontend ./frontend
RUN npm run build --workspace=frontend

# ── Stage 2: production image ────────────────────────────────────────────────
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci --workspace=backend --omit=dev --ignore-scripts

COPY backend ./backend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV PORT=31228
EXPOSE 31228

USER node
WORKDIR /app/backend
CMD ["node", "--experimental-strip-types", "src/server.ts"]
