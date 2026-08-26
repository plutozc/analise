import { supabase } from "../lib/supabase.js";
import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

const NEWS_RETAIN_DAYS = 60;
const SIGNALS_RETAIN_DAYS = 90;
const LOG_RETAIN_DAYS = 7;
const BULLETIN_LOCAL_RETAIN_DAYS = 90;

export async function runCleanup(): Promise<{ newsDeleted: number; signalsDeleted: number; logsCleared: boolean }> {
  const result = { newsDeleted: 0, signalsDeleted: 0, logsCleared: false };

  const newsCutoff = new Date(Date.now() - NEWS_RETAIN_DAYS * 86400_000).toISOString();
  const { count: newsCount, error: newsErr } = await supabase
    .from("news_items")
    .delete({ count: "exact" })
    .lt("created_at", newsCutoff);
  if (newsErr) {
    console.error("[cleanup] news_items delete failed:", newsErr.message);
  } else {
    result.newsDeleted = newsCount ?? 0;
    console.log(`[cleanup] news_items: deleted ${result.newsDeleted} rows older than ${NEWS_RETAIN_DAYS}d`);
  }

  const signalsCutoff = new Date(Date.now() - SIGNALS_RETAIN_DAYS * 86400_000).toISOString();
  const { count: sigCount, error: sigErr } = await supabase
    .from("tech_signals")
    .delete({ count: "exact" })
    .lt("created_at", signalsCutoff);
  if (sigErr) {
    console.error("[cleanup] tech_signals delete failed:", sigErr.message);
  } else {
    result.signalsDeleted = sigCount ?? 0;
    console.log(`[cleanup] tech_signals: deleted ${result.signalsDeleted} rows older than ${SIGNALS_RETAIN_DAYS}d`);
  }

  try {
    const logsDir = join(ROOT, "logs");
    execSync(`find "${logsDir}" -name "*.log" -mtime +${LOG_RETAIN_DAYS} -delete 2>/dev/null || true`, { encoding: "utf-8" });
    execSync(`find "${logsDir}" -name "*.log" -size +10M -exec truncate -s 1M {} \\; 2>/dev/null || true`, { encoding: "utf-8" });
    result.logsCleared = true;
    console.log(`[cleanup] logs: cleared files older than ${LOG_RETAIN_DAYS}d, truncated >10M`);
  } catch (e) {
    console.warn("[cleanup] log cleanup failed:", e instanceof Error ? e.message : e);
  }

  try {
    const bulletinsDir = join(ROOT, "bulletins");
    execSync(`find "${bulletinsDir}" -name "*.md" -mtime +${BULLETIN_LOCAL_RETAIN_DAYS} -delete 2>/dev/null || true`, { encoding: "utf-8" });
    console.log(`[cleanup] bulletins local: cleared files older than ${BULLETIN_LOCAL_RETAIN_DAYS}d`);
  } catch (e) {
    console.warn("[cleanup] bulletin cleanup failed:", e instanceof Error ? e.message : e);
  }

  return result;
}
