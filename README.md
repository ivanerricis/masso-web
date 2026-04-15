# masso-web

Applicazione full stack per la gestione di un laboratorio, composta da:
- frontend React + Vite
- backend Node.js + Express
- database PostgreSQL

## Prerequisiti

- Docker Desktop con supporto a Docker Compose
- Porte libere:
	- `80` (frontend shared)
	- `3000` (backend)
	- `5433` (db in dev)
	- `5173` (frontend dev)

## Configurazione ambiente

1. Copia il file di esempio:

```bash
cp .env.example .env
```

2. Aggiorna i valori in `.env` secondo il tuo ambiente.

## Modalita 1: Sviluppo locale (hot reload)

Usa il compose dedicato allo sviluppo:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Servizi disponibili:
- frontend dev: http://localhost:5173
- backend api: http://localhost:3000/api
- postgres: localhost:5433

Note:
- in questa modalita frontend e backend usano volumi bind per aggiornarsi in tempo reale
- i `node_modules` sono isolati in volumi Docker dedicati

## Modalita 2: Condivisione / Server (LAN)

Usa il compose principale:

```bash
docker compose up --build -d
```

Servizi disponibili:
- frontend (nginx): http://<IP_SERVER>
- backend (accessibile anche direttamente): http://<IP_SERVER>:3000/api

Comportamento rete:
- il frontend usa path relativi (`/api`, `/assets`)
- nginx inoltra `/api` e `/assets` al backend interno
- non serve ricompilare il frontend quando cambia IP LAN del server

## Arresto servizi

Per fermare i container della modalita in uso:

```bash
docker compose down
```

Oppure, per la modalita dev:

```bash
docker compose -f docker-compose.dev.yml down
```

## Struttura configurazioni Docker

- `docker-compose.yml`: configurazione shared/server
- `docker-compose.dev.yml`: configurazione sviluppo locale
- `backend/Dockerfile`: backend produzione
- `backend/Dockerfile.dev`: backend sviluppo
- `frontend/Dockerfile`: frontend produzione (build statico + nginx)
- `frontend/Dockerfile.dev`: frontend sviluppo (vite)
- `frontend/nginx.conf`: reverse proxy frontend verso backend