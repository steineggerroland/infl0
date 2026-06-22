#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="${1:-quiet}"
HOST="${BDD_HOST:-127.0.0.1}"
PORT="${BDD_PORT:-4275}"
BASE_URL="${E2E_BASE_URL:-http://${HOST}:${PORT}}"
READY_URL="${BASE_URL%/}/help"
SERVER_LOG="${BDD_SERVER_LOG:-$ROOT/.output/bdd-server.log}"

mkdir -p "$(dirname "$SERVER_LOG")"

server_pid=""
cleanup() {
  if [[ -n "$server_pid" ]] && kill -0 "$server_pid" 2>/dev/null; then
    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

stop_port_owner() {
  local pids
  pids="$(lsof -ti:"$PORT" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    kill $pids 2>/dev/null || true
  fi
}

wait_for_server() {
  local waited=0
  while (( waited < 120 )); do
    if ! kill -0 "$server_pid" 2>/dev/null; then
      echo "BDD server exited before ${READY_URL} became ready." >&2
      echo "Server log: ${SERVER_LOG}" >&2
      tail -120 "$SERVER_LOG" >&2 || true
      return 1
    fi

    if curl -fsS "$READY_URL" >/dev/null 2>&1; then
      return 0
    fi

    sleep 0.5
    waited=$((waited + 1))
  done

  echo "Timed out waiting for ${READY_URL}." >&2
  echo "Server log: ${SERVER_LOG}" >&2
  tail -120 "$SERVER_LOG" >&2 || true
  return 1
}

stop_port_owner

if [[ "$MODE" == "quiet" ]]; then
  npm run build:quiet >/dev/null 2>&1
else
  npm run build
fi

NITRO_HOST="$HOST" NITRO_PORT="$PORT" node .output/server/index.mjs >"$SERVER_LOG" 2>&1 &
server_pid="$!"

wait_for_server

cucumber_args=(
  "features/**/*.feature"
  --import "features/**/*.js"
  --parallel 1
  --tags "not @pending"
)

if [[ "$MODE" == "quiet" ]]; then
  npx cucumber-js "${cucumber_args[@]}" --format progress
else
  echo "BDD server log: ${SERVER_LOG}"
  npx cucumber-js "${cucumber_args[@]}" --format pretty
fi
