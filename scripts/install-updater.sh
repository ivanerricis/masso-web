#!/usr/bin/env bash
# One-time setup on the Proxmox VM: installs the systemd units that let the
# Settings > Aggiornamenti page trigger updates. Run once with sudo after the
# first `docker compose up --build -d`.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
    echo "Esegui questo script con sudo/root." >&2
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
UNIT_SRC_DIR="$REPO_ROOT/ops/systemd"
UNIT_DEST_DIR="/etc/systemd/system"

echo "Repo: $REPO_ROOT"

mkdir -p "$REPO_ROOT/ops/update"
chmod 777 "$REPO_ROOT/ops/update"

if ! command -v jq >/dev/null 2>&1; then
    echo "jq non trovato, installazione..."
    apt-get update -y
    apt-get install -y jq
fi

command -v git >/dev/null 2>&1 || { echo "git non trovato. Installalo (apt-get install -y git) e riprova." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "docker non trovato. Installa Docker Engine e riprova." >&2; exit 1; }

chmod +x "$REPO_ROOT/scripts/update-server.sh" "$REPO_ROOT/scripts/check-updates.sh"

for unit in masso-update.path masso-update.service masso-check-updates.path masso-check-updates.service masso-check-updates.timer; do
    sed "s#__REPO_ROOT__#$REPO_ROOT#g" "$UNIT_SRC_DIR/$unit" > "$UNIT_DEST_DIR/$unit"
done

systemctl daemon-reload
systemctl enable --now masso-update.path masso-check-updates.path masso-check-updates.timer

echo ""
echo "Updater installato."
systemctl status masso-update.path masso-check-updates.path masso-check-updates.timer --no-pager || true
