#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
LOG_DIR="${SYNC_LOG_DIR:-logs}"
mkdir -p "$LOG_DIR"
if [ -f .env ]; then set -a; source .env; set +a; fi
TSX="${TSX:-npx tsx}"
PAPERS_AT="${SYNC_PAPERS_AT:-03:00}"
CLASSIFY_MEDIUM_AT="${SYNC_CLASSIFY_MEDIUM_AT:-04:00}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
run_task() {
  local task=$1; local logfile="$LOG_DIR/${task}.log"
  log "START: $task"
  if $TSX src/index.ts "$task" >> "$logfile" 2>&1; then log "OK: $task"; else log "FAIL: $task (exit $?)"; fi
}
run_loop() {
  local task=$1 interval=$2
  log "Sleep ${interval}s until first $task..."
  sleep "$interval"
  while true; do run_task "$task"; log "Sleep ${interval}s until next $task..."; sleep "$interval"; done
}
seconds_until_hhmm() {
  local hhmm=$1
  if [[ ! "$hhmm" =~ ^([01][0-9]|2[0-3]):[0-5][0-9]$ ]]; then
    echo "Invalid HH:MM time: $hhmm" >&2
    return 1
  fi
  local target_h=${hhmm%:*}
  local target_m=${hhmm#*:}
  local now_h now_m now_s now target delta
  now_h=$(date '+%H'); now_m=$(date '+%M'); now_s=$(date '+%S')
  target=$((10#$target_h * 3600 + 10#$target_m * 60))
  now=$((10#$now_h * 3600 + 10#$now_m * 60 + 10#$now_s))
  delta=$((target - now))
  if [ "$delta" -lt 0 ]; then delta=$((delta + 86400)); fi
  echo "$delta"
}
run_daily_at() {
  local task=$1 hhmm=$2 delay
  while true; do
    delay=$(seconds_until_hhmm "$hhmm")
    log "Sleep ${delay}s until next $task at $hhmm..."
    sleep "$delay"
    run_task "$task"
    sleep 1
  done
}

TASKS="papers feeds rfcs signals conf-summaries vendor-intel classify-medium"

interval_of() {
  case "$1" in
    feeds)           echo 3600;;     # hourly
    rfcs)            echo 43200;;
    papers)          echo 86400;;  # daily
    signals)         echo 43200;;
    conf-summaries)  echo 2592000;;  # monthly
    vendor-intel)       echo 2592000;;  # monthly
    classify-medium) echo 86400;;    # daily at CLASSIFY_MEDIUM_AT
    *)               echo "";;
  esac
}

if [ "${1:-}" = "once" ]; then
  log "=== RUN ALL ONCE ==="
  for task in $TASKS; do run_task $task; done
  log "=== ALL DONE ==="; exit 0
fi

if [ -n "${1:-}" ]; then
  if [ "$1" = "papers" ]; then
    run_daily_at papers "$PAPERS_AT"
  elif [ "$1" = "classify-medium" ]; then
    run_daily_at classify-medium "$CLASSIFY_MEDIUM_AT"
  else
    iv=$(interval_of "$1")
    if [ -n "$iv" ]; then
      run_loop "$1" "$iv"
    else
      echo "Unknown task: $1"
      exit 1
    fi
  fi
  exit 0
fi

log "=== SCHEDULER START ==="
for task in $TASKS; do
  if [ "$task" = "papers" ]; then
    run_daily_at "$task" "$PAPERS_AT" &
  elif [ "$task" = "classify-medium" ]; then
    run_daily_at "$task" "$CLASSIFY_MEDIUM_AT" &
  else
    run_loop "$task" "$(interval_of "$task")" &
  fi
done
log "All workers launched in wait-first mode. papers_at=$PAPERS_AT classify_medium_at=$CLASSIFY_MEDIUM_AT"
wait
