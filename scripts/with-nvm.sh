#!/usr/bin/env bash
# Run a command with Node from .nvmrc (nvm in bash/zsh).
# CI uses the same version via actions/setup-node + node-version-file: '.nvmrc'.
# If `nvm use` fails, run `nvm install` once from the repo root, then retry.
# Usage (from repo root): ./scripts/with-nvm.sh npm ci
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
  echo "nvm not found (NVM_DIR=$NVM_DIR). Install nvm or set NVM_DIR." >&2
  exit 1
fi
# shellcheck source=/dev/null
. "$NVM_DIR/nvm.sh"
nvm use
exec "$@"
