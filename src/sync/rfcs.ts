import { supabase } from "../lib/supabase.js";
import type { FeedStat } from "../types/index.js";

const RFC_FEED = "https://datatracker.ietf.org/feed/rfc/";

export async function syncRFCs(): Promise<FeedStat[]> {
  const stats: FeedStat[] = [];

  try {
    const res = await fetch(RFC_FEED, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      stats.push({ source: "RFCs", status: "error", count: 0, error: `HTTP ${res.status}` });
      return stats;
    }
    const xml = await res.text();

    // RSS 2.0 feed — parse <item> entries
    const items = xml.split("<item>").slice(1);
    let inserted = 0;

    for (const item of items) {
      const title = extractTag(item, "title")?.trim();
      if (!title) continue;
      const idMatch = title.match(/RFC\s*(\d+)/i);
      if (!idMatch) continue;
      const rfcNumber = parseInt(idMatch[1], 10);
      const summary = extractTag(item, "description")?.trim() || null;
      const pubDate = extractTag(item, "pubDate")?.trim() || null;
      const link = extractRfcLink(item);

      const { data: existing } = await supabase
        .from("rfcs").select("id").eq("rfc_number", rfcNumber).maybeSingle();
      if (!existing) {
        await supabase.from("rfcs").insert({
          rfc_number: rfcNumber,
          title,
          summary,
          published_date: pubDate ? new Date(pubDate).toISOString().slice(0, 10) : null,
          url: link,
          is_draft: false,
        });
        inserted++;
      }
    }

    stats.push({ source: "RFCs", status: "ok", count: inserted });
  } catch (err) {
    stats.push({ source: "RFCs", status: "error", count: 0, error: err instanceof Error ? err.message : "unknown" });
  }

  await supabase.from("sync_meta").upsert(
    { entity: "rfcs", last_sync_at: new Date().toISOString(), last_result: { feedStats: stats } },
    { onConflict: "entity" },
  );

  return stats;
}

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

function extractRfcLink(xml: string): string {
  const m = xml.match(/<link[^>]*>([^<]+)/);
  return m ? m[1].trim() : "";
}
