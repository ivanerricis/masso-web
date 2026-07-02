FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY drizzle.config.ts ./
COPY src ./src

RUN npm run build

FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY drizzle ./drizzle
COPY public ./public
COPY migrate.js ./migrate.js
COPY --from=builder /app/dist ./dist

CMD ["npm", "run", "start"]