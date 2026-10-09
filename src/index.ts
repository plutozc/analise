#!/usr/bin/env node

import { syncAllPapers, syncArxivPapers, syncS2Papers, syncCompanyPapers } from "./sync/paper-import.js";
import { syncAllFeeds } from "./sync/feeds.js";
import { syncRFCs } from "./sync/rfcs.js";
import { classifyPapers } from "./lib/ai-classify.js";
import { supabase } from "./lib/supabase.js";
import { generateConfSummary, generateAllConfSummaries } from "./sync/conf-ai.js";
import { syncVendorIntelligence } from "./sync/vendor-intelligence.js";
import { analyzeTechSignals } from "./sync/tech-signals.js";
import { crawlConferences } from "./sync/conference-crawler.js";
import { backfillVenues } from "./sync/backfill-venue.js";
import { discoverInsightDirections } from "./sync/insight-discovery.js";
import { enrichHighScorePapers } from "./sync/ai-enrich.js";
import { generateAggregateBulletin, checkUrgentBulletin, generateFallbackBulletin } from "./sync/news-bulletin.js";
import { runCleanup } from "./sync/cleanup.js";
import { logTokenUsage } from "./lib/claude.js";

const task = process.argv[2] ?? "all";

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

async function main() {
  const start = Date.now();
  console.log(`[sync-worker] Starting task: ${task} at ${new Date().toISOString()}`);

  try {
    switch (task) {
      case "papers": {
        const year = parseInt(process.env.SYNC_YEAR ?? String(new Date().getFullYear()), 10);
        const { stats, inserted } = await syncAllPapers(year);
        console.log(`[sync-worker] Papers sync complete:`, JSON.stringify(stats));

        // AI classify & enrich disabled to reduce CLI token cost
        // Run manually: npx tsx src/index.ts classify-medium / enrich
        console.log(`[sync-worker] AI classify/enrich: skipped (disabled)`);

        // Backfill arXiv paper venues via arXiv API, then rebuild conferences
        const bfResult = await backfillVenues(100);
        console.log(`[sync-worker] Venue backfill: ${bfResult.checked} checked, ${bfResult.updated} updated`);
        const confResult = await crawlConferences(year);
        console.log(`[sync-worker] Conference crawl: ${confResult.created} created, ${confResult.sessions} sessions`);

        // Insight discovery disabled to reduce AI token cost
        // Run manually via: npx tsx src/index.ts insights
        break;
      }
      case "classify-medium": {
        // Legacy task — all papers now classified immediately on import
        console.log("[sync-worker] classify-medium deprecated — all papers classified during 'papers' task");
        break;
      }
      case "arxiv": {
        const year = parseInt(process.env.SYNC_YEAR ?? String(new Date().getFullYear()), 10);
        const { stats } = await syncArxivPapers(year);
        console.log(`[sync-worker] arXiv sync complete:`, JSON.stringify(stats));
        break;
      }
      case "s2": {
        const year = parseInt(process.env.SYNC_YEAR ?? String(new Date().getFullYear()), 10);
        const { stats } = await syncS2Papers(year);
        console.log(`[sync-worker] S2 sync complete:`, JSON.stringify(stats));
        break;
      }
      case "company-papers": {
        const year = parseInt(process.env.SYNC_YEAR ?? String(new Date().getFullYear()), 10);
        const { stats } = await syncCompanyPapers(year);
        console.log(`[sync-worker] Company papers sync complete:`, JSON.stringify(stats));
        break;
      }
      case "feeds": {
        const { stats, inserted } = await syncAllFeeds();
        console.log(`[sync-worker] Feeds sync complete:`, JSON.stringify(stats));
        console.log(`[sync-worker] ${inserted.length} high-relevance items inserted (pre-classified inline)`);
        break;
      }
      case "rfcs": {
        const stats = await syncRFCs();
        console.log(`[sync-worker] RFC sync complete:`, JSON.stringify(stats));
        break;
      }
      case "conf-summaries": {
        console.log("[sync-worker] conf-summaries: skipped (AI disabled)");
        break;
      }
      case "conf-summary": {
        console.log("[sync-worker] conf-summary: skipped (AI disabled)");
        break;
      }
      case "conferences": {
        const year = process.argv[3] ? parseInt(process.argv[3], 10) : new Date().getFullYear();
        const result = await crawlConferences(year);
        console.log(`[sync-worker] Conference crawl: ${result.created} created, ${result.sessions} sessions, ${result.skipped} skipped`);
        break;
      }
      case "backfill-venue": {
        const batch = process.argv[3] ? parseInt(process.argv[3], 10) : 100;
        const br = await backfillVenues(batch);
        console.log(`[sync-worker] Venue backfill: ${br.checked} checked, ${br.updated} updated, ${br.errors} errors`);
        break;
      }
      case "insights": {
        console.log("[sync-worker] insights: skipped (AI disabled)");
        break;
      }
      case "signals": {
        const count = await analyzeTechSignals();
        console.log(`[sync-worker] Generated ${count} tech signals`);
        break;
      }
      case "vendor-intel": {
        console.log("[sync-worker] vendor-intel: skipped (AI disabled)");
        break;
      }
      case "bulletin": {
        console.log("[sync-worker] bulletin: skipped (AI disabled)");
        break;
      }
      case "bulletin-urgent": {
        console.log("[sync-worker] bulletin-urgent: skipped (AI disabled)");
        break;
      }
      case "cleanup": {
        const cr = await runCleanup();
        console.log(`[sync-worker] Cleanup: news=${cr.newsDeleted} signals=${cr.signalsDeleted} logs=${cr.logsCleared}`);
        break;
      }
      case "all": {
        const year = parseInt(process.env.SYNC_YEAR ?? String(new Date().getFullYear()), 10);

        // Phase 1: sync data sources in parallel (papers + feeds + rfcs)
        const [papersResult, feedsResult, rfcsResult] = await Promise.allSettled([
          syncAllPapers(year),
          syncAllFeeds(),
          syncRFCs().then((s) => ({ task: "rfcs", stats: s })),
        ]);

        let paperInserted: Awaited<ReturnType<typeof syncAllPapers>>["inserted"] | null = null;

        if (papersResult.status === "fulfilled") {
          paperInserted = papersResult.value.inserted;
          console.log(`[sync-worker] papers:`, JSON.stringify(papersResult.value.stats));
        } else {
          console.error(`[sync-worker] papers sync failed:`, papersResult.reason);
        }

        if (feedsResult.status === "fulfilled") {
          console.log(`[sync-worker] feeds:`, JSON.stringify(feedsResult.value.stats));
        } else {
          console.error(`[sync-worker] feeds sync failed:`, feedsResult.reason);
        }

        if (rfcsResult.status === "fulfilled") {
          console.log(`[sync-worker] rfcs:`, JSON.stringify(rfcsResult.value.stats));
        } else {
          console.error(`[sync-worker] rfcs sync failed:`, rfcsResult.reason);
        }

        // Phase 2: AI classify disabled
        if (paperInserted && paperInserted.length > 0) {
          console.log(`[sync-worker] AI classify: skipped (disabled) — ${paperInserted.length} papers unclassified`);
        }

        try {
          const confResult = await crawlConferences(year);
          console.log(`[sync-worker] conferences:`, JSON.stringify(confResult));
        } catch (err) {
          console.error(`[sync-worker] conference crawl failed:`, err);
        }
        break;
      }
      default:
        console.error(`[sync-worker] Unknown task: ${task}`);
        console.log(`Usage: npx tsx src/index.ts <task>`);
        console.log(`Tasks: papers, arxiv, s2, company-papers, feeds, rfcs, conferences, backfill-venue, conf-summary, conf-summaries, bulletin, bulletin-urgent, cleanup, all`);
        process.exit(1);
    }
  } catch (err) {
    console.error(`[sync-worker] Fatal error:`, err);
    process.exit(1);
  }

  logTokenUsage();
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[sync-worker] Finished in ${elapsed}s`);
}

main();
