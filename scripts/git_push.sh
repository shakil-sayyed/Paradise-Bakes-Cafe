#!/bin/bash

# git_push.sh
# Stages all changes, commits with provided message, and pushes to origin main (configurable branch).
# Validates current branch before push.

set -euo pipefail

LOGFILE="/var/log/pbc/git_push.log"
BRANCH="${1:-main}"
COMMIT_MSG="${2:-}"

mkdir -p /var/log/pbc
touch "$LOGFILE"
chmod 600 "$LOGFILE"

log() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") $*" | tee -a "$LOGFILE"
}

if [ -z "$COMMIT_MSG" ]; then
  echo "Usage: $0 <branch> <commit-message>"
  exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  log "ERROR: Current branch is '$CURRENT_BRANCH', expected '$BRANCH'. Aborting push."
  exit 1
fi

log "Staging all changes..."
git add -A
log "Committing changes..."
git commit -m "$COMMIT_MSG"
log "Pushing to origin/$BRANCH..."
git push origin "$BRANCH"

log "Push completed successfully."
exit 0

