FROM node:24-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_LOGO_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_LOGO_URL=$VITE_LOGO_URL

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Fuori da conf.d di proposito: nginx include da sé ogni conf.d/*.conf nel blocco http, e
# questo file va incluso solo dove serve, non anche come configurazione a sé stante.
COPY security-headers.conf /etc/nginx/security-headers.conf

EXPOSE 80