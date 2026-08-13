# ── Stage 1: compile surge ───────────────────────────────────────────────────
# Upstream publishes a binary for linux/amd64 only, so the image builds its
# own: statically linked, which is what lets a musl-built executable run in
# any of the runtime images.
FROM alpine:3.22 AS surge-builder

RUN apk add --no-cache build-base curl zlib-dev zlib-static

WORKDIR /build

ARG NAUTY_VERSION=2_9_3
RUN curl -fsSL -o nauty.tar.gz \
      "https://users.cecs.anu.edu.au/~bdm/nauty/nauty${NAUTY_VERSION}.tar.gz" \
  && tar xzf nauty.tar.gz \
  && cd "nauty${NAUTY_VERSION}" \
  && ./configure \
  && make -j"$(nproc)" nautyL1.a

ARG SURGE_VERSION=2.0
RUN curl -fsSL -o surge.tar.gz \
      "https://github.com/StructureGenerator/surge/archive/refs/tags/v${SURGE_VERSION}.tar.gz" \
  && tar xzf surge.tar.gz \
  && cd "surge-${SURGE_VERSION}/src" \
  && make surge \
       NAUTY="/build/nauty${NAUTY_VERSION}" \
       NAUTYLIB="/build/nauty${NAUTY_VERSION}" \
       CCOPT="-O3 -static" \
  && install -m 0755 surge /usr/local/bin/surge \
  && surge -S C5H12

# ── Stage 2: build the frontend ──────────────────────────────────────────────
FROM node:24-alpine AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci --workspace=frontend --ignore-scripts

COPY frontend ./frontend
RUN npm run build --workspace=frontend

# ── Stage 3: production image ────────────────────────────────────────────────
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci --workspace=backend --omit=dev --ignore-scripts

COPY backend ./backend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY --from=surge-builder /usr/local/bin/surge /usr/local/bin/surge

ENV NODE_ENV=production
ENV PORT=31228
EXPOSE 31228

USER node
WORKDIR /app/backend
CMD ["node", "--experimental-strip-types", "src/server.ts"]
