#!/usr/bin/env bash
# For the Proxmox VM (production/LAN mode).
# Usage: scripts/restore-db.sh [--dump-path /path/to/backup.tar.gz] [--reset-database]
#
# Accepts both backup formats:
#   db-backup-<ts>.tar.gz  current: dump.sql + data/ (email, backup and logo settings)
#   db-dump-<ts>.sql       legacy: database only
set -euo pipefail

DUMP_PATH=""
RESET_DATABASE=false

while [ $# -gt 0 ]; do
    case "$1" in
        --dump-path)
            DUMP_PATH="$2"
            shift 2
            ;;
        --reset-database)
            RESET_DATABASE=true
            shift
            ;;
        *)
            echo "Argomento sconosciuto: $1" >&2
            exit 1
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_PATH="$REPO_ROOT/.env"
COMPOSE_FILE="$REPO_ROOT/docker-compose.yml"

declare -A ENV_VALUES=()
if [ -f "$ENV_PATH" ]; then
    while IFS='=' read -r key value; do
        [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
        ENV_VALUES["$key"]="$value"
    done < "$ENV_PATH"
fi

POSTGRES_USER_VALUE="${ENV_VALUES[POSTGRES_USER]:-masso}"
POSTGRES_DB_VALUE="${ENV_VALUES[POSTGRES_DB]:-masso_db}"
BACKUP_DIR="${ENV_VALUES[BACKUP_HOST_DIR]:-$REPO_ROOT/backups}"

if [ -z "$DUMP_PATH" ]; then
    if [ ! -d "$BACKUP_DIR" ]; then
        echo "Directory backup non trovata: $BACKUP_DIR" >&2
        exit 1
    fi

    DUMP_PATH="$(find "$BACKUP_DIR" -maxdepth 1 \( -name '*.tar.gz' -o -name '*.sql' \) -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -n1 | cut -d' ' -f2-)"

    if [ -z "$DUMP_PATH" ]; then
        echo "Nessun backup (.tar.gz o .sql) trovato in $BACKUP_DIR" >&2
        exit 1
    fi
fi

if [ ! -f "$DUMP_PATH" ]; then
    echo "Dump non trovato: $DUMP_PATH" >&2
    exit 1
fi

WORK_DIR=""
cleanup() {
    [ -n "$WORK_DIR" ] && rm -rf "$WORK_DIR"
}
trap cleanup EXIT

SETTINGS_DIR=""

case "$DUMP_PATH" in
    *.tar.gz)
        WORK_DIR="$(mktemp -d)"
        tar -xzf "$DUMP_PATH" -C "$WORK_DIR"
        SQL_FILE="$WORK_DIR/dump.sql"

        if [ ! -f "$SQL_FILE" ]; then
            echo "Archivio non valido: manca dump.sql" >&2
            exit 1
        fi

        [ -d "$WORK_DIR/data" ] && SETTINGS_DIR="$WORK_DIR/data"
        ;;
    *)
        SQL_FILE="$DUMP_PATH"
        ;;
esac

echo ""
echo "Restore database"
echo "Compose file: $COMPOSE_FILE"
echo "Backup: $DUMP_PATH"
echo "Database: $POSTGRES_DB_VALUE"
if [ -n "$SETTINGS_DIR" ]; then
    echo "Impostazioni incluse: si (email, backup, logo)"
else
    echo "Impostazioni incluse: no (solo database)"
fi
echo ""

read -r -p "Digita RESTORE per continuare: " confirmation
if [ "$confirmation" != "RESTORE" ]; then
    echo "Restore annullato."
    exit 1
fi

if [ "$RESET_DATABASE" = true ]; then
    echo "Reset schema public e drizzle prima del restore..."
    docker compose -f "$COMPOSE_FILE" exec -T db psql -v ON_ERROR_STOP=1 \
        -U "$POSTGRES_USER_VALUE" -d "$POSTGRES_DB_VALUE" \
        -c 'DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;'
fi

echo "Esecuzione restore..."
docker compose -f "$COMPOSE_FILE" exec -T db psql -v ON_ERROR_STOP=1 \
    -U "$POSTGRES_USER_VALUE" -d "$POSTGRES_DB_VALUE" < "$SQL_FILE"

if [ -n "$SETTINGS_DIR" ]; then
    echo "Ripristino impostazioni applicazione..."

    for entry in email-settings.json backup-settings.json logo; do
        [ -e "$SETTINGS_DIR/$entry" ] || continue
        # Rimuove la voce esistente: senza, `docker compose cp` di una cartella
        # unirebbe il contenuto invece di sostituirlo.
        docker compose -f "$COMPOSE_FILE" exec -T backend rm -rf "/app/data/$entry"
        docker compose -f "$COMPOSE_FILE" cp "$SETTINGS_DIR/$entry" "backend:/app/data/$entry"
    done

    # Il backend tiene le impostazioni in cache in memoria: senza riavvio
    # continuerebbe a usare quelle precedenti al restore.
    echo "Riavvio backend per rileggere le impostazioni..."
    docker compose -f "$COMPOSE_FILE" restart backend
fi

echo ""
echo "Restore completato con successo."

if [ -n "$SETTINGS_DIR" ]; then
    echo ""
    echo "ATTENZIONE: le password sono cifrate con data/secret.key, che di proposito"
    echo "non e inclusa nei backup. Se questo non e il server che ha generato il backup,"
    echo "vanno reinserite a mano dall'interfaccia:"
    echo "  - Impostazioni > Email  > password SMTP"
    echo "  - Impostazioni > Backup > password NAS"
    echo "Il pannello Backup elenca quali risultano illeggibili."
fi
