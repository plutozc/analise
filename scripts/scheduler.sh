#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
LOG_DIR="${SYNC_LOG_DIR:-/var/log/sync-worker}"
mkdir -p "$LOG_DIR"
if [ -f .env ]; then set -a; source .env; set +a; fi
TSX="${TSX:-npx tsx}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_DIR/scheduler.log"; }
run_task() {
  local task=$1; local logfile="$LOG_DIR/${task}.log"
  log "START: $task"
  if $TSX src/index.ts "$task" >> "$logfile" 2>&1; then log "OK: $task"; else log "FAIL: $task (exit $?)"; fi
}
run_loop() {
  local task=$1 interval=$2
  while true; do run_task "$task"; log "Sleep ${interval}s until next $task..."; sleep "$interval"; done
}

declare -A INTERVALS
# Light tasks (cheap AI, high frequency)
INTERVALS[feeds]=3600
INTERVALS[rfcs]=43200
# Medium tasks
INTERVALS[papers]=21600
INTERVALS[signals]=43200
# Heavy AI tasks (rare)
INTERVALS[github]=86400
INTERVALS[conf-summaries]=2592000  # monthly
INTERVALS[vendor-intel]=2592000    # monthly

if [ "${1:-}" = "once" ]; then
  log "=== RUN ALL ONCE ==="
  for task in papers feeds github rfcs signals conf-summaries vendor-intel; do run_task $task; done
  log "=== ALL DONE ==="; exit 0
fi

if [ -n "${1:-}" ]; then
  if [ -n "${INTERVALS[${1}]:-}" ]; then run_loop "$1" "${INTERVALS[$1]}"
  else echo "Unknown task: $1"; exit 1; fi
  exit 0
fi

log "=== SCHEDULER START ==="
run_task papers; run_task feeds
for task in papers feeds github rfcs signals conf-summaries vendor-intel; do
  run_loop $task "${INTERVALS[$task]}" &
done
log "All workers launched. Waiting..."
wait
