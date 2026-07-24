#!/usr/bin/env bash
# Bash port of scripts/reset-admin-password.ps1, for the Proxmox VM (production/LAN mode).
# Rigenera la password di un utente quando nessuno riesce più ad accedere all'app
# (es. unico utente rimasto e password persa) senza toccare il resto dei dati.
# Usage: scripts/reset-admin-password.sh [--username nome]
set -euo pipefail

USERNAME="admin"

while [ $# -gt 0 ]; do
    case "$1" in
        --username)
            USERNAME="$2"
            shift 2
            ;;
        *)
            echo "Argomento sconosciuto: $1" >&2
            exit 1
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$REPO_ROOT/docker-compose.yml"

echo ""
echo "Reset password utente"
echo "Compose file: $COMPOSE_FILE"
echo "Utente: $USERNAME"
echo ""

read -r -p "Digita RESET per continuare: " confirmation
if [ "$confirmation" != "RESET" ]; then
    echo "Operazione annullata."
    exit 1
fi

docker compose -f "$COMPOSE_FILE" exec -T backend node reset-admin-password.js "$USERNAME"
