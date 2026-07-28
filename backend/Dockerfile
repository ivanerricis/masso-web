FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# tsconfig.build.json estende tsconfig.json: servono entrambi, altrimenti
# `npm run build` fallisce con TS5058.
COPY tsconfig.json tsconfig.build.json ./
COPY drizzle.config.ts ./
COPY src ./src

RUN npm run build

FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production
# tzdata: senza questo pacchetto Alpine non conosce le regole DST dei fusi orari
# nominati (es. Europe/Rome) e Node.js ricade su UTC nonostante TZ sia impostata.
ENV TZ=Europe/Rome

RUN apk add --no-cache postgresql16-client samba-client tzdata

COPY package*.json ./
RUN npm ci --omit=dev

COPY drizzle ./drizzle
COPY public ./public
COPY migrate.js ./migrate.js
COPY reset-admin-password.js ./reset-admin-password.js
COPY --from=builder /app/dist ./dist

CMD ["npm", "run", "start"]