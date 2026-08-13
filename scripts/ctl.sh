#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

LOG_DIR="${SYNC_LOG_DIR:-logs}"
mkdir -p "$LOG_DIR"
TSX="${TSX:-npx tsx}"
SVC_NAME="sync-worker"
PID_FILE="$LOG_DIR/scheduler.pid"

usage() {
  cat <<EOF
Usage: ./scripts/ctl.sh <command> [task]

Commands:
  start              Start full scheduler in background
  stop               Stop all running ${SVC_NAME} processes
  restart            stop + start
  status             Show running ${SVC_NAME} processes & resource usage
  ps                 Alias for status
  run <task>         Run one task once (blocking, shows output)
  logs [task]        Tail logs (scheduler.log by default, or <task>.log)
  once               Run all tasks once (blocking, shows output)

Tasks: papers, feeds, github, rfcs, signals, conf-summaries, vendor-intel, bulletin, bulletin-urgent
EOF
  exit 1
}

log()  { echo "[$(date '+%H:%M:%S')] $*"; }
error(){ echo "[ERROR] $*" >&2; }
collect_tree() {
  local pid child
  for pid in "$@"; do
    [ -n "$pid" ] || continue
    echo "$pid"
    for child in $(pgrep -P "$pid" 2>/dev/null || true); do
      collect_tree "$child"
    done
  done
}

cmd="${1:-help}"; shift || true

case "$cmd" in
  start)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      log "Scheduler already running (PID: $(cat "$PID_FILE"))"
      exit 1
    fi
    if pgrep -f "scripts/scheduler.sh" >/dev/null 2>&1; then
      log "Scheduler already running (PID: $(pgrep -f "scripts/scheduler.sh" | head -1))"
      exit 1
    fi
    nohup bash scripts/scheduler.sh < /dev/null >> "$LOG_DIR/scheduler.log" 2>&1 &
    PID=$!
    echo "$PID" > "$PID_FILE"
    disown "$PID" 2>/dev/null || true
    log "Scheduler started (PID: $PID)"
    log "Log: $LOG_DIR/scheduler.log"
    ;;

  stop)
    BASE_PIDS=$({
      if [ -f "$PID_FILE" ]; then cat "$PID_FILE"; fi
      pgrep -f "${SVC_NAME}" 2>/dev/null
      pgrep -f "scripts/scheduler.sh" 2>/dev/null
    } | sort -un || true)
    ALL_PIDS=$(collect_tree $BASE_PIDS | sort -run || true)
    if [ -z "$ALL_PIDS" ]; then
      log "No ${SVC_NAME} or scheduler processes running"
      rm -f "$PID_FILE"
      return 0 2>/dev/null || exit 0
    fi
    log "Stopping (PIDs: $(echo $ALL_PIDS | tr '\n' ' '))..."
    kill $ALL_PIDS 2>/dev/null || true
    for i in 1 2 3 4 5; do
      SURVIVORS=$({
        pgrep -f "${SVC_NAME}" 2>/dev/null
        pgrep -f "scripts/scheduler.sh" 2>/dev/null
      } | sort -un || true)
      [ -z "$SURVIVORS" ] && break
      ALL_SURVIVORS=$(collect_tree $SURVIVORS | sort -run || true)
      if [ "$i" -ge 2 ]; then
        log "Force killing: $(echo $ALL_SURVIVORS | tr '\n' ' ')"
        kill -9 $ALL_SURVIVORS 2>/dev/null || true
      else
        kill $ALL_SURVIVORS 2>/dev/null || true
      fi
      sleep 1
    done
    rm -f "$PID_FILE"
    log "Stopped"
    ;;

  restart)
    $0 stop
    $0 start
    ;;

  status|ps)
    echo "=== ${SVC_NAME} processes ==="
    PIDS=$(pgrep -f "${SVC_NAME}" 2>/dev/null || true)
    if [ -z "$PIDS" ]; then
      echo "  (none running)"
    else
      ps -o pid,command -p $PIDS 2>/dev/null | head -30
    fi
    echo ""
    echo "=== Scheduler PID ==="
    SCHED_PID=""
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      SCHED_PID=$(cat "$PID_FILE")
    else
      SCHED_PID=$(pgrep -f "scripts/scheduler.sh" 2>/dev/null || true)
    fi
    if [ -n "$SCHED_PID" ]; then
      echo "  PID: $SCHED_PID"
    else
      echo "  (not running)"
    fi
    echo ""
    echo "=== Recent logs (last 5 lines each) ==="
    for f in "$LOG_DIR"/*.log; do
      [ -f "$f" ] || continue
      echo "  --- $(basename "$f"): $(tail -1 "$f")"
    done
    ;;

  run)
    task="${1:-}"
    if [ -z "$task" ]; then error "Specify task"; usage; fi
    logfile="$LOG_DIR/${task}.log"
    log "Running $task... (log: $logfile)"
    $TSX src/index.ts "$task" 2>&1 | tee "$logfile"
    log "Exit: ${PIPESTATUS[0]}"
    ;;

  once)
    logfile="$LOG_DIR/scheduler.log"
    log "Running all tasks once... (log: $logfile)"
    bash scripts/scheduler.sh once 2>&1 | tee "$logfile"
    log "Exit: ${PIPESTATUS[0]}"
    ;;

  logs)
    task="${1:-scheduler}"
    logfile="$LOG_DIR/${task}.log"
    if [ ! -f "$logfile" ]; then
      error "No log for '$task' (expected: $logfile)"
      exit 1
    fi
    # Use follow mode if stdout is a terminal
    if [ -t 1 ]; then
      tail -f "$logfile"
    else
      cat "$logfile"
    fi
    ;;

  help|--help|-h)
    usage
    ;;

  *)
    error "Unknown command: $cmd"
    usage
    ;;
esac
