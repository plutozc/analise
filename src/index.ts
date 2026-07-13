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

        if (inserted.length > 0) {
          const maxBatch = intEnv("MAX_PAPERS_PER_RUN", 500);
          const batch = maxBatch > 0 ? inserted.slice(0, maxBatch) : [];
          if (batch.length < inserted.length) {
            console.log(`[sync-worker] ${inserted.length - batch.length} papers deferred by MAX_PAPERS_PER_RUN=${maxBatch}`);
          }
          const cr = batch.length > 0 ? await classifyPapers(30, batch) : { updated: 0, processed: 0 };
          console.log(`[sync-worker] AI classify: ${cr.updated}/${cr.processed}`);
        }

        // Backfill arXiv paper venues via arXiv API, then rebuild conferences
        const bfResult = await backfillVenues(100);
        console.log(`[sync-worker] Venue backfill: ${bfResult.checked} checked, ${bfResult.updated} updated`);
        const confResult = await crawlConferences(year);
        console.log(`[sync-worker] Conference crawl: ${confResult.created} created, ${confResult.sessions} sessions`);

        // Discover insight directions from recent papers/news
        const insightResult = await discoverInsightDirections();
        console.log(`[sync-worker] Insight discovery: ${insightResult.directions} directions found`);

        // Auto-push insights to github
        if (insightResult.directions > 0) {
          const { execSync } = await import("child_process");
          try {
            execSync('git add insights/ && git commit -m "docs: insight directions $(date +%Y-%m-%d)" && git push', {
              encoding: "utf-8", timeout: 30_000, stdio: "pipe",
            });
            console.log("[sync-worker] Insights pushed to github");
          } catch (e) {
            console.warn("[sync-worker] Insights git push failed:", e instanceof Error ? e.message : e);
          }
        }
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
        const count = await generateAllConfSummaries();
        console.log(`[sync-worker] Generated ${count} conference summaries`);
        break;
      }
      case "conf-summary": {
        const id = process.argv[3];
        if (!id) { console.error("[sync-worker] Usage: conf-summary <conferenceId>"); process.exit(1); }
        await generateConfSummary(id);
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
        const ir = await discoverInsightDirections();
        console.log(`[sync-worker] Insight discovery: ${ir.directions} directions, output: ${ir.outputPath}`);
        if (ir.directions > 0) {
          const { execSync } = await import("child_process");
          try {
            execSync('git add insights/ && git commit -m "docs: insight directions $(date +%Y-%m-%d)" && git push', {
              encoding: "utf-8", timeout: 30_000, stdio: "pipe",
            });
            console.log("[sync-worker] Insights pushed to github");
          } catch (e) {
            console.warn("[sync-worker] Insights git push failed:", e instanceof Error ? e.message : e);
          }
        }
        break;
      }
      case "signals": {
        const count = await analyzeTechSignals();
        console.log(`[sync-worker] Generated ${count} tech signals`);
        break;
      }
      case "vendor-intel": {
        const count = await syncVendorIntelligence();
        console.log(`[sync-worker] Updated ${count} vendor profiles`);
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

        // Phase 2: classify new papers + rebuild conferences (depends on papers)
        if (paperInserted && paperInserted.length > 0) {
          const maxBatch = intEnv("MAX_PAPERS_PER_RUN", 500);
          const batch = maxBatch > 0 ? paperInserted.slice(0, maxBatch) : [];
          if (batch.length < paperInserted.length) {
            console.log(`[sync-worker] ${paperInserted.length - batch.length} papers deferred by MAX_PAPERS_PER_RUN=${maxBatch}`);
          }
          const cr = batch.length > 0 ? await classifyPapers(30, batch) : { updated: 0, processed: 0 };
          console.log(`[sync-worker] AI classify: ${cr.updated}/${cr.processed}`);
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
        console.log(`Tasks: papers, arxiv, s2, company-papers, feeds, rfcs, conferences, backfill-venue, conf-summary, conf-summaries, all`);
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
