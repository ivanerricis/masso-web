#!/usr/bin/env bash
# Bash port of scripts/start-server.ps1, for the Proxmox VM (production/LAN mode).
# Usage: scripts/start-server.sh [--no-build]
set -euo pipefail

NO_BUILD=false
if [ "${1:-}" = "--no-build" ]; then
    NO_BUILD=true
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$REPO_ROOT"

echo ""
echo "Avvio container Docker..."

if [ "$NO_BUILD" = true ]; then
    docker compose up -d
else
    docker compose up --build -d
fi

echo ""
echo "Container avviati con successo."

mapfile -t ips < <(hostname -I 2>/dev/null | tr ' ' '\n' | grep -v '^$' | grep -v '^127\.' | grep -v '^169\.254\.')

if [ "${#ips[@]}" -gt 0 ]; then
    primary_ip="${ips[0]}"
    echo "Indirizzi di collegamento:"
    echo "- Frontend: http://$primary_ip"
    echo "- Backend:  http://$primary_ip:3000/api"
else
    echo "Nessun indirizzo IPv4 trovato. Verifica l'IP della macchina manualmente."
fi
