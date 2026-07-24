#!/usr/bin/env bash
# For the Proxmox VM (production/LAN mode).
# Usage: scripts/restore-db.sh [--dump-path /path/to/dump.sql] [--reset-database]
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

    DUMP_PATH="$(find "$BACKUP_DIR" -maxdepth 1 -name '*.sql' -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -n1 | cut -d' ' -f2-)"

    if [ -z "$DUMP_PATH" ]; then
        echo "Nessun file .sql trovato in $BACKUP_DIR" >&2
        exit 1
    fi
fi

if [ ! -f "$DUMP_PATH" ]; then
    echo "Dump non trovato: $DUMP_PATH" >&2
    exit 1
fi

echo ""
echo "Restore database"
echo "Compose file: $COMPOSE_FILE"
echo "Dump: $DUMP_PATH"
echo "Database: $POSTGRES_DB_VALUE"
echo ""

read -r -p "Digita RESTORE per continuare: " confirmation
if [ "$confirmation" != "RESTORE" ]; then
    echo "Restore annullato."
    exit 1
fi

if [ "$RESET_DATABASE" = true ]; then
    echo "Reset schema public prima del restore..."
    docker compose -f "$COMPOSE_FILE" exec -T db psql -v ON_ERROR_STOP=1 \
        -U "$POSTGRES_USER_VALUE" -d "$POSTGRES_DB_VALUE" \
        -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;'
fi

echo "Esecuzione restore..."
docker compose -f "$COMPOSE_FILE" exec -T db psql -v ON_ERROR_STOP=1 \
    -U "$POSTGRES_USER_VALUE" -d "$POSTGRES_DB_VALUE" < "$DUMP_PATH"

echo ""
echo "Restore completato con successo."
