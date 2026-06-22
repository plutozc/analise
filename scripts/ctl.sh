#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

LOG_DIR="${SYNC_LOG_DIR:-logs}"
mkdir -p "$LOG_DIR"
TSX="${TSX:-npx tsx}"
SVC_NAME="sync-worker"

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

Tasks: papers, feeds, github, rfcs, signals, conf-summaries, vendor-intel
EOF
  exit 1
}

log()  { echo "[$(date '+%H:%M:%S')] $*"; }
error(){ echo "[ERROR] $*" >&2; }

cmd="${1:-help}"; shift || true

case "$cmd" in
  start)
    if pgrep -f "scheduler.sh" >/dev/null 2>&1; then
      log "Scheduler already running (PID: $(pgrep -f "scheduler.sh" | head -1))"
      exit 1
    fi
    nohup bash scripts/scheduler.sh >> "$LOG_DIR/scheduler.log" 2>&1 &
    PID=$!
    log "Scheduler started (PID: $PID)"
    log "Log: $LOG_DIR/scheduler.log"
    ;;

  stop)
    ALL_PIDS=$({ pgrep -f "${SVC_NAME}" 2>/dev/null; pgrep -f "scheduler.sh" 2>/dev/null; } | sort -un || true)
    if [ -z "$ALL_PIDS" ]; then
      log "No ${SVC_NAME} or scheduler processes running"
      return 0 2>/dev/null || exit 0
    fi
    log "Stopping (PIDs: $(echo $ALL_PIDS | tr '\n' ' '))..."
    kill $ALL_PIDS 2>/dev/null || true
    for i in 1 2 3 4 5; do
      SURVIVORS=$({ pgrep -f "${SVC_NAME}" 2>/dev/null; pgrep -f "scheduler.sh" 2>/dev/null; } | sort -un || true)
      [ -z "$SURVIVORS" ] && break
      if [ "$i" -eq 2 ]; then
        log "Force killing: $(echo $SURVIVORS | tr '\n' ' ')"
        kill -9 $SURVIVORS 2>/dev/null || true
      fi
      sleep 1
    done
    if [ -n "$SURVIVORS" ]; then
      log "WARNING: processes still alive: $(echo $SURVIVORS | tr '\n' ' ')"
    fi
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
    SCHED_PID=$(pgrep -f "scheduler.sh" 2>/dev/null || true)
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
