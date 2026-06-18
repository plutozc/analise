#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
LOG_DIR="${SYNC_LOG_DIR:-logs}"
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

TASKS="papers feeds github rfcs signals conf-summaries vendor-intel classify-medium"

interval_of() {
  case "$1" in
    feeds)           echo 3600;;
    rfcs)            echo 43200;;
    papers)          echo 86400;;  # daily
    signals)         echo 43200;;
    github)          echo 86400;;
    conf-summaries)  echo 2592000;;  # monthly
    vendor-intel)       echo 2592000;;  # monthly
    classify-medium) echo 3600;;     # hourly
    *)               echo "";;
  esac
}

if [ "${1:-}" = "once" ]; then
  log "=== RUN ALL ONCE ==="
  for task in $TASKS; do run_task $task; done
  log "=== ALL DONE ==="; exit 0
fi

if [ -n "${1:-}" ]; then
  iv=$(interval_of "$1")
  if [ -n "$iv" ]; then run_loop "$1" "$iv"
  else echo "Unknown task: $1"; exit 1; fi
  exit 0
fi

log "=== SCHEDULER START ==="
run_task papers; run_task feeds
for task in $TASKS; do
  run_loop $task "$(interval_of $task)" &
done
log "All workers launched. Waiting..."
wait
