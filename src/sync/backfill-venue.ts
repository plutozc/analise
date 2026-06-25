import { supabase } from "../lib/supabase.js";

type VenueRule = [RegExp, string];
const VENUE_RULES: VenueRule[] = [
  [/SIGCOMM/i,       "SIGCOMM"],
  [/NSDI/i,          "NSDI"],
  [/IMC\b/i,         "IMC"],
  [/OSDI/i,          "OSDI"],
  [/SOSP/i,          "SOSP"],
  [/CoNEXT/i,        "CoNEXT"],
  [/INFOCOM/i,       "INFOCOM"],
  [/ICNP/i,          "ICNP"],
  [/HOTNETS|HotNets/i, "HOTNETS"],
  [/MOBICOM/i,       "MOBICOM"],
  [/SIGMETRICS/i,    "SIGMETRICS"],
  [/EuroSys/i,       "EuroSys"],
  [/ASPLOS/i,        "ASPLOS"],
  [/CCS\b/i,         "CCS"],
  [/S&P|SP\b/i,      "S&P"],
  [/USENIX.*Security/i, "USENIX Security"],
  [/\bATC\b/i,       "ATC"],
  [/\bFAST\b/i,      "FAST"],
  [/PPoPP/i,         "PPoPP"],
  [/\bISCA\b/i,      "ISCA"],
  [/\bMICRO\b/i,     "MICRO"],
  [/\bHPCA\b/i,      "HPCA"],
  [/APNet/i,         "APNet"],
  [/\bANCS\b/i,      "ANCS"],
  [/\bPAM\b/i,       "PAM"],
  [/\bTMA\b/i,       "TMA"],
  [/Middleware/i,    "Middleware"],
  [/SenSys/i,        "SenSys"],
  [/MobiSys/i,       "MobiSys"],
];

function journalRefToVenue(journalRef: string | null): string | null {
  if (!journalRef) return null;
  for (const [re, name] of VENUE_RULES) {
    if (re.test(journalRef)) return name;
  }
  return null;
}

function extractArxivId(url: string): string | null {
  const m = url.match(/arxiv\.org\/abs\/(\d+\.\d+)/i);
  return m ? m[1] : null;
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

  console.log(`[backfill-venue] ${papers.length} papers to check`);

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

        if (venue) {
          const { error: updErr } = await supabase
            .from("papers")
            .update({ venue })
            .eq("id", paper.id);

          if (updErr) {
            console.error(`[backfill-venue] Update error for ${entryId}: ${updErr.message}`);
            errors++;
          } else {
            updated++;
          }
        }
      }

      console.log(`[backfill-venue] Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(papers.length / batchSize)}: ${updated} updated so far`);
    } catch (err) {
      console.error(`[backfill-venue] Batch error:`, err instanceof Error ? err.message : err);
      errors += batch.length;
    }

    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`[backfill-venue] Done: ${papers.length} checked, ${updated} updated, ${errors} errors`);
  return { checked: papers.length, updated, errors };
}

const isMain = process.argv[1]?.includes("backfill-venue");
if (isMain) {
  const batchArg = process.argv[2] ? parseInt(process.argv[2], 10) : 100;
  backfillVenues(batchArg).then(r => {
    console.log(JSON.stringify(r));
    process.exit(0);
  });
}
