#!/usr/bin/env bash
# Bash port of scripts/edit-env.ps1, for the Proxmox VM (production/LAN mode).
# Usage: scripts/edit-env.sh [--configure-ufw]
set -euo pipefail

CONFIGURE_UFW=false
if [ "${1:-}" = "--configure-ufw" ]; then
    CONFIGURE_UFW=true
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_PATH="$REPO_ROOT/.env"

declare -a KEYS=(POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB BACKUP_HOST_DIR LAB_NAME LAB_EMAIL LAB_ADDRESS LAB_PHONE LAB_LOGO_TEXT LAB_LOGO_URL)
declare -A DEFAULTS=(
    [POSTGRES_USER]="masso"
    [POSTGRES_PASSWORD]="masso_password"
    [POSTGRES_DB]="masso_db"
    [BACKUP_HOST_DIR]="/opt/masso-web/backups"
    [LAB_NAME]="Masso"
    [LAB_EMAIL]="info@masso.local"
    [LAB_ADDRESS]="Indirizzo laboratorio"
    [LAB_PHONE]="+39 000 000 0000"
    [LAB_LOGO_TEXT]="Masso"
    [LAB_LOGO_URL]="/assets/logo.jpg"
)
declare -A CURRENT=()
declare -A NEW=()

if [ -f "$ENV_PATH" ]; then
    while IFS='=' read -r key value; do
        [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
        CURRENT["$key"]="$value"
    done < "$ENV_PATH"
fi

echo ""
echo "Editor interattivo del file .env"
echo "Percorso: $ENV_PATH"
echo ""

for key in "${KEYS[@]}"; do
    label="${CURRENT[$key]:-${DEFAULTS[$key]}}"
    read -r -p "$key [$label]: " input
    if [ -z "$input" ]; then
        NEW["$key"]="$label"
    else
        NEW["$key"]="$input"
    fi
done

{
    echo "# Shared / production-like configuration"
    for key in POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB BACKUP_HOST_DIR; do
        echo "$key=${NEW[$key]}"
    done
    echo ""
    for key in LAB_NAME LAB_EMAIL LAB_ADDRESS LAB_PHONE LAB_LOGO_TEXT LAB_LOGO_URL; do
        echo "$key=${NEW[$key]}"
    done
} > "$ENV_PATH"

echo ""
echo ".env aggiornato: $ENV_PATH"

if [ "$CONFIGURE_UFW" = true ]; then
    echo ""
    echo "Configurazione firewall (ufw)..."
    if command -v ufw >/dev/null 2>&1; then
        for port in 80 3000; do
            ufw allow "$port"/tcp || echo "Impossibile aprire la porta $port su ufw."
        done
    else
        echo "ufw non trovato. Configura manualmente il firewall della VM/Proxmox per le porte 80 e 3000."
    fi
fi
