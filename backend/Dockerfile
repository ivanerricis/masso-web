FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY drizzle.config.ts ./
COPY src ./src

RUN npm run build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache postgresql16-client samba-client

COPY package*.json ./
RUN npm ci --omit=dev

COPY drizzle ./drizzle
COPY public ./public
COPY migrate.js ./migrate.js
COPY --from=builder /app/dist ./dist

CMD ["npm", "run", "start"]