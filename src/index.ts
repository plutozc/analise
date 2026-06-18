#!/usr/bin/env node

import { syncAllPapers, syncArxivPapers, syncS2Papers, syncCompanyPapers } from "./sync/paper-import.js";
import { syncAllFeeds } from "./sync/feeds.js";
import { syncGitHubRepos } from "./sync/github.js";
import { syncRFCs } from "./sync/rfcs.js";
import { classifyPapers } from "./lib/ai-classify.js";
import { supabase } from "./lib/supabase.js";
import { generateConfSummary, generateAllConfSummaries } from "./sync/conf-ai.js";
import { syncVendorIntelligence } from "./sync/vendor-intelligence.js";
import { analyzeTechSignals } from "./sync/tech-signals.js";
import { logTokenUsage } from "./lib/claude.js";

const task = process.argv[2] ?? "all";

async function main() {
  const start = Date.now();
  console.log(`[sync-worker] Starting task: ${task} at ${new Date().toISOString()}`);

  try {
    switch (task) {
      case "papers": {
        const year = parseInt(process.env.SYNC_YEAR ?? String(new Date().getFullYear()), 10);
        const { stats, prioritized } = await syncAllPapers(year);
        console.log(`[sync-worker] Papers sync complete:`, JSON.stringify(stats));

        if (prioritized.high.length > 0) {
          const cr = await classifyPapers(30, prioritized.high);
          console.log(`[sync-worker] AI classify (high): ${cr.updated}/${cr.processed}`);
        }
        if (prioritized.medium.length > 0) {
          console.log(`[sync-worker] ${prioritized.medium.length} medium papers queued for deferred classify`);
        }
        if (prioritized.low.length > 0) {
          console.log(`[sync-worker] ${prioritized.low.length} low papers skipped AI`);
        }
        break;
      }
      case "classify-medium": {
        const { count, error: countErr } = await supabase.from("papers")
          .select("id", { count: "exact", head: true })
          .eq("classify_priority", "medium")
          .eq("ai_classified", false);
        const pending = count ?? 0;
        if (countErr) { console.error("[sync-worker] classify-medium count error:", countErr.message); break; }
        if (pending === 0) { console.log("[sync-worker] No medium papers pending"); break; }

        // Dynamic batch: small queue → small batch, large queue → bigger batch to catch up
        // ≤20 pending: process all; ≤100: 20/batch; ≤500: 40/batch; >500: 60/batch
        const batchSize = pending <= 20 ? pending : pending <= 100 ? 20 : pending <= 500 ? 40 : 60;
        console.log(`[sync-worker] ${pending} medium papers pending, batch size: ${batchSize}`);

        const { data: papers, error } = await supabase.from("papers")
          .select("id,title,abstract,companies")
          .eq("classify_priority", "medium")
          .eq("ai_classified", false)
          .order("created_at", { ascending: true })
          .limit(batchSize);
        if (error) { console.error("[sync-worker] classify-medium query error:", error.message); break; }
        if (!papers?.length) break;
        const cr = await classifyPapers(papers.length, papers);
        console.log(`[sync-worker] AI classify (medium): ${cr.updated}/${cr.processed}, remaining: ${pending - papers.length}`);
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
      case "github": {
        const stats = await syncGitHubRepos();
        console.log(`[sync-worker] GitHub sync complete:`, JSON.stringify(stats));
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

        // Phase 1: sync data sources in parallel
        const [papersResult, feedsResult, githubResult, rfcsResult] = await Promise.allSettled([
          syncAllPapers(year),
          syncAllFeeds(),
          syncGitHubRepos().then((s) => ({ task: "github", stats: s })),
          syncRFCs().then((s) => ({ task: "rfcs", stats: s })),
        ]);

        let paperPrioritized: Awaited<ReturnType<typeof syncAllPapers>>["prioritized"] | null = null;

        if (papersResult.status === "fulfilled") {
          paperPrioritized = papersResult.value.prioritized;
          console.log(`[sync-worker] papers:`, JSON.stringify(papersResult.value.stats));
        } else {
          console.error(`[sync-worker] papers sync failed:`, papersResult.reason);
        }

        if (feedsResult.status === "fulfilled") {
          console.log(`[sync-worker] feeds:`, JSON.stringify(feedsResult.value.stats));
        } else {
          console.error(`[sync-worker] feeds sync failed:`, feedsResult.reason);
        }

        if (githubResult.status === "fulfilled") {
          console.log(`[sync-worker] github:`, JSON.stringify(githubResult.value.stats));
        } else {
          console.error(`[sync-worker] github sync failed:`, githubResult.reason);
        }
        if (rfcsResult.status === "fulfilled") {
          console.log(`[sync-worker] rfcs:`, JSON.stringify(rfcsResult.value.stats));
        } else {
          console.error(`[sync-worker] rfcs sync failed:`, rfcsResult.reason);
        }

        // Phase 2: classify high priority only (medium deferred, low skipped)
        if (paperPrioritized) {
          if (paperPrioritized.high.length > 0) {
            const cr = await classifyPapers(30, paperPrioritized.high);
            console.log(`[sync-worker] classify-papers (high): ${cr.updated}/${cr.processed}`);
          }
          if (paperPrioritized.medium.length > 0) {
            console.log(`[sync-worker] ${paperPrioritized.medium.length} medium papers queued for deferred classify`);
          }
          if (paperPrioritized.low.length > 0) {
            console.log(`[sync-worker] ${paperPrioritized.low.length} low papers skipped AI`);
          }
        }
        break;
      }
      default:
        console.error(`[sync-worker] Unknown task: ${task}`);
        console.log(`Usage: npx tsx src/index.ts <task>`);
        console.log(`Tasks: papers, arxiv, s2, company-papers, feeds, github, rfcs, conf-summary, conf-summaries, all`);
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
