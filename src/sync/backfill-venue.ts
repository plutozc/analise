import { supabase } from "../lib/supabase.js";
import { journalRefToVenue } from "../lib/venues.js";

function extractArxivId(url: string): string | null {
  const m = url.match(/arxiv\.org\/abs\/(\d+\.\d+)/i);
  return m ? m[1] : null;
}

async function backfillViaArxiv(papers: { id: string; url: string }[], batchSize: number): Promise<{ updated: number; errors: number }> {
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < papers.length; i += batchSize) {
    const batch = papers.slice(i, i + batchSize);
    const ids = batch.map(p => extractArxivId(p.url)).filter(Boolean) as string[];
    if (ids.length === 0) continue;

    const queryUrl = `https://export.arxiv.org/api/query?id_list=${ids.join(",")}&max_results=${ids.length}`;

    try {
      const res = await fetch(queryUrl, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) {
        console.error(`[backfill-venue] arXiv API HTTP ${res.status}, aborting`);
        errors += batch.length;
        break;
      }

      const xml = await res.text();
      const entries = xml.split("<entry>").slice(1);

      for (const entry of entries) {
        const idMatch = entry.match(/<id>.*?\/abs\/(\d+\.\d+)/i);
        if (!idMatch) continue;
        const entryId = idMatch[1];

        const paper = batch.find(p => extractArxivId(p.url) === entryId);
        if (!paper) continue;

        const journalRef = entry.match(/<arxiv:journal_ref>([\s\S]*?)<\/arxiv:journal_ref>/)?.[1]?.trim() ?? null;
        const venue = journalRefToVenue(journalRef);

        if (venue !== "arXiv") {
          const { error: updErr } = await supabase
            .from("papers")
            .update({ venue })
            .eq("id", paper.id);

          if (updErr) { errors++; } else { updated++; }
        }
      }
    } catch (err) {
      console.error(`[backfill-venue] arXiv batch error:`, err instanceof Error ? err.message : err);
      errors += batch.length;
    }

    await new Promise(r => setTimeout(r, 3000));
  }

  return { updated, errors };
}

export async function backfillVenues(batchSize = 100): Promise<{ checked: number; updated: number; errors: number }> {
  console.log(`[backfill-venue] Starting...`);

  const { data: papers, error } = await supabase
    .from("papers")
    .select("id, url")
    .eq("venue", "arXiv")
    .ilike("url", "%arxiv%")
    .order("published_date", { ascending: false })
    .limit(500);

  if (error || !papers?.length) {
    console.log(`[backfill-venue] No papers to process: ${error?.message ?? "empty"}`);
    return { checked: 0, updated: 0, errors: 0 };
  }

  console.log(`[backfill-venue] ${papers.length} papers to check via arXiv journal_ref`);
  const result = await backfillViaArxiv(papers, batchSize);
  console.log(`[backfill-venue] Done: ${papers.length} checked, ${result.updated} updated, ${result.errors} errors`);
  return { checked: papers.length, ...result };
}

const isMain = process.argv[1]?.includes("backfill-venue");
if (isMain) {
  const batchArg = process.argv[2] ? parseInt(process.argv[2], 10) : 100;
  backfillVenues(batchArg).then(r => {
    console.log(JSON.stringify(r));
    process.exit(0);
  });
}
