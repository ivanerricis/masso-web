#!/bin/sh
# Prepares the mounted paths, then drops privileges before starting the app.
#
# Node runs as the unprivileged `node` user, not as root: a flaw in the backend (say an
# injection into one of the external commands it spawns) must not hand out root inside
# the container.
#
# This script itself has to start as root, because the mounted paths belong to root: the
# named volumes created before this change, and the bind mounts coming from the host (the
# backups directory and ops/update). Without this step the app could no longer write
# data/, logs/ or backups/, and the automatic update would quietly break installations
# that already exist.
set -e

for dir in /app/data /app/logs /app/backups /app/update-signal; do
    mkdir -p "$dir"
    # Recurse only when ownership is actually wrong: on a backups directory holding many
    # archives, chown -R on every boot would be pure waste.
    if [ "$(stat -c %u "$dir")" != "$(id -u node)" ]; then
        chown -R node:node "$dir"
    fi
done

# `exec` matters: SIGTERM must reach Node, not this script — that is what makes the clean
# shutdown in src/index.ts happen at all.
exec su-exec node "$@"
