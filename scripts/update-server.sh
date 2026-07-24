#!/usr/bin/env bash
# Applies an update: git reset --hard origin/main + docker compose rebuild.
# Triggered by masso-update.path (see ops/systemd/) when ops/update/apply.trigger appears.
# Never add `git clean` here: untracked paths (.env, backend/data, backend/backups,
# ops/update) must survive an update.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
STATUS_DIR="$REPO_ROOT/ops/update"
STATUS_FILE="$STATUS_DIR/status.json"
APPLY_TRIGGER="$STATUS_DIR/apply.trigger"
LOG_FILE="$(mktemp)"

mkdir -p "$STATUS_DIR"
rm -f "$APPLY_TRIGGER"
cd "$REPO_ROOT"

write_status() {
    local state="$1"
    local last_status="$2"
    local error_msg="$3"
    local now current_commit log_tail existing tmp_file

    now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    current_commit="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
    log_tail="$(tail -c 4000 "$LOG_FILE" 2>/dev/null || true)"
    existing="{}"
    [ -f "$STATUS_FILE" ] && existing="$(cat "$STATUS_FILE")"
    tmp_file="$(mktemp "$STATUS_DIR/.status.XXXXXX")"

    echo "$existing" | jq \
        --arg state "$state" \
        --arg currentCommit "$current_commit" \
        --arg now "$now" \
        --arg lastUpdateStatus "$last_status" \
        --arg lastError "$error_msg" \
        --arg log "$log_tail" \
        '. + {
            state: $state,
            currentCommit: $currentCommit,
            lastUpdateAt: $now,
            lastUpdateStatus: (if $lastUpdateStatus == "" then (.lastUpdateStatus // null) else $lastUpdateStatus end),
            lastError: (if $lastError == "" then null else $lastError end),
            log: $log
        }
        # After a successful apply, HEAD now matches the commit we just fetched
        # from origin/main, so clear the stale "update available" flag left
        # over from the last check instead of waiting for the next timer run.
        + (if $lastUpdateStatus == "success" then { remoteCommit: $currentCommit, updateAvailable: false } else {} end)' > "$tmp_file"
    mv "$tmp_file" "$STATUS_FILE"
    chmod 666 "$STATUS_FILE" 2>/dev/null || true
}

on_exit() {
    local exit_code=$?
    if [ "$exit_code" -ne 0 ]; then
        write_status "failed" "failed" "Aggiornamento fallito (exit $exit_code). Dettagli: journalctl -u masso-update.service"
    fi
    rm -f "$LOG_FILE"
}
trap on_exit EXIT

write_status "running" "" ""

set -euo pipefail

{
    echo "=== git fetch ==="
    git fetch --all --prune
    echo "=== git reset --hard origin/main ==="
    git reset --hard origin/main
    echo "=== docker compose up --build -d --remove-orphans ==="
    docker compose up --build -d --remove-orphans
    echo "=== docker image prune -f ==="
    docker image prune -f
    echo "=== docker builder prune -f --filter until=24h ==="
    docker builder prune -f --filter until=24h
} >>"$LOG_FILE" 2>&1

write_status "success" "success" ""
