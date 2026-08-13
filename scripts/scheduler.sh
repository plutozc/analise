#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
LOG_DIR="${SYNC_LOG_DIR:-logs}"
mkdir -p "$LOG_DIR"
if [ -f .env ]; then set -a; source .env; set +a; fi
TSX="${TSX:-npx tsx}"
PAPERS_AT="${SYNC_PAPERS_AT:-03:00}"
WEEKLY_REPORT_AT="${SYNC_WEEKLY_REPORT_AT:-06:00}"
WEEKLY_REPORT_DAY="${SYNC_WEEKLY_REPORT_DAY:-1}"  # 1=Monday

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
run_weekly_report() {
  local hhmm=$1 dow=$2 delay
  while true; do
    local current_dow; current_dow=$(date '+%u')
    local now_secs=$((10#$(date '+%H') * 3600 + 10#$(date '+%M') * 60 + 10#$(date '+%S')))
    local target_secs=$((10#${hhmm%:*} * 3600 + 10#${hhmm#*:} * 60))
    if [ "$current_dow" -eq "$dow" ] && [ "$now_secs" -lt "$target_secs" ]; then
      delay=$((target_secs - now_secs))
    else
      local days_until=$(( (dow - current_dow + 7) % 7 ))
      if [ "$days_until" -eq 0 ]; then days_until=7; fi
      delay=$(( days_until * 86400 - now_secs + target_secs ))
    fi
    log "Sleep ${delay}s until next weekly-report (day=$dow at $hhmm)..."
    sleep "$delay"
    local logfile="$LOG_DIR/weekly-report.log"
    log "START: weekly-report"
    if $TSX weekly-report/src/index.ts >> "$logfile" 2>&1; then
      log "OK: weekly-report"
      git add weekly-report/reports/ && git commit -m "docs: weekly report $(date '+%Y-%m-%d')" && git push && log "OK: weekly-report pushed" || log "WARN: weekly-report git push failed"
    else
      log "FAIL: weekly-report (exit $?)"
    fi
    sleep 1
  done
}

BULLETIN_AGG_AT="${SYNC_BULLETIN_AGG_AT:-08:00}"

TASKS="papers feeds rfcs signals conf-summaries vendor-intel"

interval_of() {
  case "$1" in
    feeds)           echo 3600;;     # hourly
    rfcs)            echo 43200;;
    papers)          echo 86400;;  # daily
    signals)         echo 43200;;
    conf-summaries)  echo 2592000;;  # monthly
    vendor-intel)       echo 2592000;;  # monthly
    bulletin-urgent) echo 3600;;     # hourly check
    classify-medium) echo 86400;;    # deprecated, not scheduled
    *)               echo "";;
  esac
}

run_bulletin_aggregate() {
  local hhmm=$1
  while true; do
    local delay
    delay=$(seconds_until_hhmm "$hhmm")
    log "Sleep ${delay}s until next bulletin-aggregate at $hhmm..."
    sleep "$delay"
    run_task "bulletin"
    (cd bulletins && git add -A && git commit -m "bulletin $(date '+%Y-%m-%d %H:%M')" && git push && log "OK: bulletin pushed to bulletins repo") || true
    sleep 1
  done
}

if [ "${1:-}" = "once" ]; then
  log "=== RUN ALL ONCE ==="
  for task in $TASKS; do run_task $task; done
  log "=== ALL DONE ==="; exit 0
fi

if [ -n "${1:-}" ]; then
  if [ "$1" = "papers" ]; then
    run_daily_at papers "$PAPERS_AT"
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
  else
    run_loop "$task" "$(interval_of "$task")" &
  fi
done
run_weekly_report "$WEEKLY_REPORT_AT" "$WEEKLY_REPORT_DAY" &
run_bulletin_aggregate "$BULLETIN_AGG_AT" &
run_loop "bulletin-urgent" "$(interval_of "bulletin-urgent")" &
log "All workers launched. papers_at=$PAPERS_AT weekly_report=day${WEEKLY_REPORT_DAY}@${WEEKLY_REPORT_AT} bulletin_agg=daily@${BULLETIN_AGG_AT} bulletin_urgent=hourly"
wait
