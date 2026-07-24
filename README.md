# masso-web

Applicazione full stack per la gestione di un laboratorio, composta da:
- frontend React + Vite
- backend Node.js + Express
- database PostgreSQL

## Prerequisiti

Sviluppo locale:
- Docker con supporto a Docker Compose
- Porte libere: `80` (frontend shared), `3000` (backend), `5433` (db in dev), `5173` (frontend dev)

Produzione (VM Proxmox): vedi [Installazione su Proxmox VM (prima volta)](#installazione-su-proxmox-vm-prima-volta).

In alternativa, produzione su CT Proxmox: vedi [Installazione su Proxmox CT (LXC, alternativa alla VM)](#installazione-su-proxmox-ct-lxc-alternativa-alla-vm).

## Installazione su Proxmox VM (prima volta)

1. **Crea la VM** su Proxmox: Debian 13 o Ubuntu Server (consigliato Debian 13), rete in bridge sulla LAN, risorse minime indicative 2 vCPU / 4 GB RAM / 20 GB disco.

2. **Installa i prerequisiti sulla VM** (fuori da qualunque container):

	```bash
	sudo apt update
	sudo apt install -y git jq ca-certificates curl
	# Docker Engine + plugin compose (repo ufficiale Docker):
	curl -fsSL https://get.docker.com | sudo sh
	```

3. **Clona il repository** sulla VM, ad es. in `/opt/masso-web`:

	```bash
	sudo git clone https://github.com/ivanerricis/masso-web.git /opt/masso-web
	cd /opt/masso-web
	```

	Il repository è **pubblico**, quindi basta l'URL HTTPS: non serve alcuna autenticazione (né deploy key SSH né token), sia per il clone iniziale sia per `git fetch`/`git reset` eseguiti da systemd durante gli aggiornamenti.

4. **Configura l'ambiente**:

	```bash
	cp .env.example .env
	./scripts/edit-env.sh --configure-ufw
	```

5. **Primo avvio**:

	```bash
	docker compose up --build -d
	# oppure:
	./scripts/start-server.sh
	```

	L'app è raggiungibile su `http://<IP_VM>`.

	Al primissimo avvio viene creato automaticamente un utente amministratore (`admin`) con una password casuale sicura, necessaria per accedere all'app. Per recuperarla:

	```bash
	docker compose logs backend | grep -A3 "Utente amministratore"
	```

	La password viene stampata una sola volta nei log, al momento della creazione. Se te la sei persa (log ruotati, container riavviato dopo, ecc.), è comunque salvata in un file dentro il volume `backend_data`:

	```bash
	docker cp backend:/app/data/initial-admin-password.txt .
	```

	Dopo il primo accesso, cambia subito la password da Impostazioni > Utenti (o dal badge utente in alto a destra) e crea eventuali altri utenti da lì.

6. **Abilita l'aggiornamento da interfaccia web** (opzionale ma consigliato):

	```bash
	sudo ./scripts/install-updater.sh
	```

	Vedi [Aggiornamento applicazione](#aggiornamento-applicazione) per i dettagli.

## Installazione su Proxmox CT (LXC, alternativa alla VM)

In alternativa alla VM, puoi usare un **container LXC (CT)** Proxmox: meno overhead (nessuna virtualizzazione hardware, boot più rapido, meno RAM/disco), ma isolamento più debole (kernel condiviso con l'host) e la necessità di eseguire Docker "annidato" dentro il CT.

1. **Crea il CT** su Proxmox:
	- Template: Debian 13 (consigliato, come per la VM).
	- **Unprivileged**: sì, lascia l'impostazione di default.
	- **Opzioni avanzate → Features**: abilita `nesting=1` e `keyctl=1` (necessari per far girare Docker dentro il CT). Dalla shell del nodo Proxmox:

		```bash
		pct set <CTID> --features nesting=1,keyctl=1
		```

	- Rete in bridge sulla LAN, risorse minime indicative 2 vCPU / 4 GB RAM / 10-15 GB disco (un CT richiede meno disco della VM equivalente perché condivide il kernel dell'host).

2. **Installa i prerequisiti sul CT** (stessi comandi della VM):

	```bash
	sudo apt update
	sudo apt install -y git jq ca-certificates curl
	curl -fsSL https://get.docker.com | sudo sh
	```

	Con `nesting=1,keyctl=1` su un host Proxmox con kernel recente (8.x+), Docker gira senza ulteriori modifiche (storage driver `overlay2`). Se `docker compose up` fallisce con errori di permessi/storage, verifica con `docker info` che il nesting sia effettivamente attivo sul CT.

3. **Da qui in poi i passaggi sono identici alla VM**: clona il repo, configura `.env`, primo avvio, updater — vedi i punti 3-6 di [Installazione su Proxmox VM](#installazione-su-proxmox-vm-prima-volta). Anche [`configure-static-ip.sh`](scripts/configure-static-ip.sh) funziona invariato nel CT (rileva netplan/NetworkManager/ifupdown allo stesso modo).

Nota: se preferisci non annidare Docker nel CT, l'alternativa è eseguire i processi Node/Postgres nativamente nel CT senza Docker — ma è un cambio di architettura più profondo, non supportato dagli script/Dockerfile attuali di questo repo.

## Configurazione ambiente

1. Copia il file di esempio:

```bash
cp .env.example .env
```

2. Aggiorna i valori in `.env` secondo il tuo ambiente.

Per modificare il file in modo interattivo puoi usare:

```bash
./scripts/edit-env.sh --configure-ufw
```

`--configure-ufw` è opzionale e apre le porte 80/3000 con `ufw`, se presente.

Al termine, `edit-env.sh` chiede anche se impostare un **IP statico** per la VM. Se confermi, viene eseguito `scripts/configure-static-ip.sh`, che:
- rileva l'interfaccia di rete e i valori attuali (IP, gateway, DNS) come default;
- fa scegliere il nuovo IP/prefisso (es. `192.168.1.50/24`), gateway e DNS;
- rileva automaticamente se la VM usa netplan, NetworkManager o ifupdown (`/etc/network/interfaces`) e scrive la configurazione corrispondente (con backup del file esistente per ifupdown);
- chiede sempre conferma esplicita prima di applicare la modifica, perché un valore errato interrompe subito la connessione SSH alla VM.

Puoi anche eseguirlo da solo, in qualunque momento:

```bash
./scripts/configure-static-ip.sh
```

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

## Modalita 2: Condivisione / Server (VM Proxmox)

Il server di produzione gira su una **VM Proxmox** (Debian/Ubuntu, systemd) con Docker Engine nativo, non su Docker Desktop. Prerequisiti sulla VM (fuori da qualunque container): `git`, `docker` (Docker Engine + plugin `docker compose`), `jq` (usato dallo script di aggiornamento).

Clona il repo sulla VM, configura `.env` (`scripts/edit-env.sh`), poi avvia:

```bash
docker compose up --build -d
```

In alternativa puoi usare lo script dedicato:

```bash
./scripts/start-server.sh
```

Servizi disponibili:
- frontend (nginx): http://<IP_SERVER>
- backend (accessibile anche direttamente): http://<IP_SERVER>:3000/api

Lo script di avvio stampa automaticamente gli indirizzi IP locali della macchina con gli URL di collegamento.

Comportamento rete:
- il frontend usa path relativi (`/api`, `/assets`)
- nginx inoltra `/api` e `/assets` al backend interno
- non serve ricompilare il frontend quando cambia IP LAN del server

Nota sicurezza: l'app richiede login (utenti gestiti da Impostazioni > Utenti), ma il cookie di sessione viaggia in chiaro perché non c'è terminazione TLS, e la funzione di aggiornamento esegue codice preso da `origin/main` sull'host — tieni la VM raggiungibile solo dalla LAN, non esporla su internet.

## Arresto servizi

Per fermare i container della modalita in uso:

```bash
docker compose down
```

Oppure, per la modalita dev:

```bash
docker compose -f docker-compose.dev.yml down
```

## Restore database

Per ripristinare un dump SQL nel database Postgres usa lo script dedicato.

```bash
./scripts/restore-db.sh --dump-path /path/to/db-dump-YYYYMMDD-HHMMSS.sql
```

Se non passi il percorso del dump, lo script prova a usare l'ultimo `.sql` trovato nella directory backup configurata in `.env` tramite `BACKUP_HOST_DIR`, oppure in `backups/` se la variabile non è presente.

Opzione distruttiva (svuota prima lo schema `public` nel database target):

```bash
./scripts/restore-db.sh --dump-path /path/to/db-dump.sql --reset-database
```

## Reset password utente

Se un utente perde la password e non riesce più ad accedere (tipicamente: unico utente rimasto, quindi nessun altro può rigenerargliela da Impostazioni > Utenti), usa lo script dedicato per rigenerarla direttamente sul database, senza toccare il resto dei dati.

```bash
./scripts/reset-admin-password.sh
```

Per default agisce sull'utente `admin`; per un altro utente passa `--username nomeutente`. Lo script stampa una sola volta la nuova password generata casualmente: al primo accesso verrà richiesto di impostarne una propria, ed eventuali sessioni attive di quell'utente vengono disconnesse.

## Aggiornamento applicazione

Sulla VM Proxmox, la pagina **Impostazioni > Aggiornamenti** permette di verificare e applicare gli aggiornamenti (`git fetch`/`reset --hard origin/main` + rebuild Docker) direttamente dall'interfaccia web, senza accesso SSH.

Il backend gira in un container senza accesso a `git`/Docker (scelta di sicurezza): quando si clicca "Aggiorna adesso", il backend scrive solo un file trigger in una cartella condivisa (`ops/update/`); sull'host, un **systemd path unit** osserva quel file ed esegue realmente l'aggiornamento. Un timer periodico (ogni 30 minuti) controlla in background se è disponibile un nuovo commit su `origin/main`.

**Setup una tantum sulla VM** (dopo il primo `docker compose up --build -d`):

```bash
sudo ./scripts/install-updater.sh
```

Lo script installa ed abilita le unit systemd in `ops/systemd/` (`masso-update.path`, `masso-check-updates.path`, `masso-check-updates.timer`), installa `jq` se mancante e imposta i permessi sulla cartella `ops/update/`.

Da quel momento, in Impostazioni > Aggiornamenti sono disponibili:
- **Verifica aggiornamenti**: esegue un `git fetch` e mostra se è disponibile un nuovo commit, senza modificare nulla.
- **Aggiorna adesso**: applica l'aggiornamento e ricostruisce i container. L'app risulta brevemente irraggiungibile durante il rebuild; la pagina ripropone lo stato non appena il backend torna online.

**Rollback manuale** (nessun rollback automatico in caso di crash post-deploy): sulla VM,

```bash
cd /percorso/del/repo
git log --oneline -5        # individua il commit precedente funzionante
git reset --hard <sha>
docker compose up --build -d
```

Log dettagliati dell'ultima esecuzione: `journalctl -u masso-update.service` (aggiornamento) o `journalctl -u masso-check-updates.service` (verifica).

Ogni aggiornamento esegue anche `docker builder prune -f --filter until=24h`, per evitare che la cache di build si accumuli indefinitamente sulla VM ad ogni rebuild.

## Spazio su disco

Alcuni accorgimenti per limitare lo spazio occupato su una VM di produzione a lungo termine:

- **Immagini**: backend e frontend usano Dockerfile multi-stage su basi Alpine (più leggere delle equivalenti Debian).
- **Cache di build**: `scripts/update-server.sh` esegue `docker builder prune` ad ogni aggiornamento (mantiene solo la cache delle ultime 24h, utile per rebuild ravvicinati).
- **Backup database**: i dump creati da Impostazioni > Backup vengono conservati automaticamente solo per gli ultimi 14, i più vecchi vengono eliminati ad ogni nuovo dump.
- **Log dei container**: `docker-compose.yml` limita i log di ogni servizio a 3 file da 10 MB (driver `json-file`), per evitare crescita illimitata su container sempre attivi (`restart: always`).

## Struttura configurazioni Docker

- `docker-compose.yml`: configurazione shared/server
- `docker-compose.dev.yml`: configurazione sviluppo locale
- `backend/Dockerfile`: backend produzione
- `backend/Dockerfile.dev`: backend sviluppo
- `frontend/Dockerfile`: frontend produzione (build statico + nginx)
- `frontend/Dockerfile.dev`: frontend sviluppo (vite)
- `frontend/nginx.conf`: reverse proxy frontend verso backend
- `ops/systemd/`: unit systemd (template) usate da `scripts/install-updater.sh` sulla VM Proxmox per l'aggiornamento da UI
- `ops/update/`: cartella condivisa (bind mount, non versionata) tra backend e host per il meccanismo di aggiornamento