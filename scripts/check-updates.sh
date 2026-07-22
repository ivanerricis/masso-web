#!/usr/bin/env bash
# Checks whether an update is available: git fetch + compare local vs origin/main HEAD.
# Never touches the working tree. Triggered by masso-check-updates.path (on-demand from
# the UI) and masso-check-updates.timer (every 30 min) — see ops/systemd/.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
STATUS_DIR="$REPO_ROOT/ops/update"
STATUS_FILE="$STATUS_DIR/status.json"
CHECK_TRIGGER="$STATUS_DIR/check.trigger"

mkdir -p "$STATUS_DIR"
rm -f "$CHECK_TRIGGER"
cd "$REPO_ROOT"

current_state="idle"
if [ -f "$STATUS_FILE" ]; then
    current_state="$(jq -r '.state // "idle"' "$STATUS_FILE" 2>/dev/null || echo idle)"
fi

# Don't race with an in-progress update.
if [ "$current_state" = "running" ]; then
    exit 0
fi

git fetch --all --prune >/dev/null 2>&1 || exit 0

local_commit="$(git rev-parse --short HEAD)"
remote_commit="$(git rev-parse --short origin/main 2>/dev/null || echo "$local_commit")"
now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

update_available="false"
if [ "$local_commit" != "$remote_commit" ]; then
    update_available="true"
fi

existing="{}"
[ -f "$STATUS_FILE" ] && existing="$(cat "$STATUS_FILE")"
tmp_file="$(mktemp "$STATUS_DIR/.status.XXXXXX")"

echo "$existing" | jq \
    --arg currentCommit "$local_commit" \
    --arg remoteCommit "$remote_commit" \
    --arg now "$now" \
    --argjson updateAvailable "$update_available" \
    '. + {
        currentCommit: $currentCommit,
        remoteCommit: $remoteCommit,
        updateAvailable: $updateAvailable,
        lastCheckedAt: $now,
        state: (if (.state // "idle") == "running" then .state else "idle" end)
    }' > "$tmp_file"
mv "$tmp_file" "$STATUS_FILE"
chmod 666 "$STATUS_FILE" 2>/dev/null || true
