import { supabase } from "./supabase.js";
import { callClaude } from "./claude.js";

const TOPICS = "dc-networking,transport-protocols,programmable-net,sdn-nfv,congestion-ctrl,internet-measure,traffic-analysis,dns-bgp,network-monitoring,network-observability,ddos-defense,protocol-security,privacy-anonymity,side-channels,zero-trust,sase-sse,edge-computing,network-ai,machine-learning,optimization,ai-networking,network-digital-twin,intent-based-networking,satellite-leo,quantum-networking,5g-6g,mobile-wireless,ebpf-xdp,distributed-sys,storage-net,os-network-stack,cloud-infra,hpc,high-speed-networking,parallel-computing,security,automation,observability";
const COMPANIES = "cisco,google,ericsson,nokia,aws,microsoft,openai,nvidia,meta,intel,ibm,huawei,cloudflare,apple,amd,tencent,alibaba,baidu,bytedance";

function buildClassifyPrompt(items: { title: string; abstract?: string | null }[]): string {
  const block = items.map((item, i) => {
    const clean = (item.abstract ?? "").replace(/https?:\/\/[^\s]+/g, "").slice(0, 400);
    return `[${i+1}] ${item.title}\n${clean}`;
  }).join("\n\n");
  return `Classify each item. JSON: {"results":[{"idx":1,"topics":["slug"],"summary_cn":"中文摘要","relevance_score":8,"companies":["cisco"]}]}
Topics: ${TOPICS}
Companies: ${COMPANIES}
Score:1-10(10=directly relevant to tech/networking/infrastructure/cloud/AI). Low score: non-tech (celebrity, finance, sports, politics). CN summary for tech items. Companies only if clearly mentioned.
${block}`;
}

function callClaudeClassify(prompt: string): string {
  const raw = callClaude(prompt);
  if (!raw) { console.error("[ai-debug] callClaude returned empty"); return "[]"; }
  console.log(`[ai-debug] raw response (${raw.length} chars): ${raw.slice(0, 500)}`);
  const m = raw.match(/\{[\s\S]*"results"[\s\S]*\}/);
  if (!m) { console.error("[ai-debug] No JSON match in response"); return "[]"; }
  try {
    const parsed = JSON.parse(m[0]).results ?? JSON.parse(m[0]).classifications ?? [];
    console.log(`[ai-debug] parsed ${parsed.length} items, first:`, JSON.stringify(parsed[0]));
    return JSON.stringify(parsed);
  } catch (e) { console.error("[ai-debug] JSON parse error:", e); return "[]"; }
}

type R = { idx: number; topics: string[]; summary_cn?: string; relevance_score?: number; companies?: string[] };

type PaperItem = { id: string; title: string; abstract: string | null; companies: string[] };
type NewsItem = { id: string; title: string; snippet: string | null; companies: string[] };

export type ScoredNews = {
  topics: string[];
  relevance_score: number;
  companies: string[];
};

/** Score news items without touching DB. Returns Map<1-based-index, ScoredNews>. */
export async function classifyItems(
  items: { title: string; snippet: string | null }[],
  batchSize = 50
): Promise<Map<number, ScoredNews>> {
  const result = new Map<number, ScoredNews>();
  for (let offset = 0; offset < items.length; offset += batchSize) {
    const batch = items.slice(offset, offset + batchSize);
    const raw = callClaudeClassify(buildClassifyPrompt(batch));
    let parsed: R[];
    try { parsed = JSON.parse(raw); } catch { continue; }
    for (const r of parsed) {
      result.set(r.idx + offset, {
        topics: r.topics ?? [],
        relevance_score: r.relevance_score ?? 0,
        companies: r.companies ?? [],
      });
    }
  }
  return result;
}

export async function classifyPapers(
  batchSize = 50,
  items?: PaperItem[]
): Promise<{ processed: number; updated: number }> {
  let total = 0, updated = 0, allIds: string[] = [];

  if (items) {
    // Classify only the provided items (from scheduled sync)
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      console.log(`[ai] Batch ${Math.floor(i/batchSize)+1}: ${batch.length} papers (${batch[0].title.slice(0,40)}...)`);
      const { resultCount, ids } = await processClassifyBatch(batch);
      total += batch.length;
      updated += resultCount;
      allIds.push(...ids);
    }
  } else {
    // Fallback: query unclassified from DB (manual/backfill usage)
    for (let r = 0; r < 100; r++) {
      const { data: papers, error } = await supabase.from("papers")
        .select("id,title,abstract,companies")
        .eq("ai_classified", false)
        .neq("title","test paper")
        .limit(batchSize);
      if (error || !papers?.length) {
        if (!papers?.length) console.log("[ai] No more unclassified papers");
        break;
      }
      console.log(`[ai] Batch ${r+1}: ${papers.length} papers (${papers[0].title.slice(0,40)}...)`);
      const { resultCount, ids } = await processClassifyBatch(papers);
      total += papers.length;
      updated += resultCount;
      allIds.push(...ids);
    }
  }

  if (allIds.length) await findSimilarPapers(allIds);
  return { processed: total, updated };
}

async function processClassifyBatch(
  papers: PaperItem[]
): Promise<{ resultCount: number; ids: string[] }> {
  let resultCount = 0;
  const ids: string[] = [];
  const raw = callClaudeClassify(buildClassifyPrompt(papers.map(p => ({ title: p.title, abstract: p.abstract }))));
  let results: R[];
  try { results = JSON.parse(raw); } catch { return { resultCount: 0, ids: [] }; }
  for (const r of results) {
    const p = papers[r.idx - 1]; if (!p) continue;
    if (r.topics?.length) {
      await supabase.from("paper_topics").delete().eq("paper_id", p.id);
      await supabase.from("paper_topics").insert(r.topics.map(t => ({ paper_id: p.id, topic_slug: t })));
    }
    const d: Record<string, any> = { ai_classified: true };
    if (r.summary_cn) d.ai_summary = r.summary_cn;
    if (r.relevance_score) d.relevance_score = r.relevance_score;
    if (r.companies?.length) d.companies = [...new Set([...((p as any).companies ?? []), ...r.companies])];
    await supabase.from("papers").update(d).eq("id", p.id);
    ids.push(p.id); resultCount++;
  }
  return { resultCount, ids };
}

async function findSimilarPapers(ids: string[]): Promise<void> {
  for (const id of ids) {
    const { data: p } = await supabase.from("papers").select("id,title").eq("id", id).single();
    if (!p) continue;
    const kw = p.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4).slice(0, 5);
    if (kw.length < 2) continue;
    const { data: c } = await supabase.from("papers").select("id,title").eq("ai_classified", true).neq("id", id).or(kw.map((k: string) => `title.ilike.%${k}%`).join(",")).limit(15);
    if (!c?.length) continue;
    const raw = callClaude(`Pick 5 most similar to reference. JSON: {"ids":["id1","id2","id3","id4","id5"]}\nRef: ${p.title.slice(0, 200)}\n${c.map((x,i) => `[${i+1}] ${x.title.slice(0,200)} (${x.id})`).join("\n")}`, { timeout: 30000 });
    const m = raw.match(/\{[\s\S]*"ids"[\s\S]*\}/);
    if (m) try { const { ids } = JSON.parse(m[0]); if (ids?.length) await supabase.from("papers").update({ similar_papers: ids }).eq("id", id); } catch {}
  }
}

export async function classifyNews(
  batchSize = 50,
  items?: NewsItem[]
): Promise<{ processed: number; updated: number }> {
  let total = 0, updated = 0;

  if (items) {
    // Classify only the provided items (from scheduled sync)
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      console.log(`[ai] News batch ${Math.floor(i/batchSize)+1}: ${batch.length} items`);
      updated += await processNewsBatch(batch);
      total += batch.length;
    }
  } else {
    // Fallback: query unclassified from DB (manual/backfill usage)
    for (let r = 0; r < 100; r++) {
      const { data: dbItems, error } = await supabase.from("news_items")
        .select("id,title,snippet,companies")
        .eq("ai_classified", false)
        .limit(batchSize);
      if (error || !dbItems?.length) {
        if (!dbItems?.length) console.log("[ai] No more unclassified news");
        break;
      }
      console.log(`[ai] News batch ${r+1}: ${dbItems.length} items`);
      updated += await processNewsBatch(dbItems);
      total += dbItems.length;
    }
  }

  return { processed: total, updated };
}

async function processNewsBatch(items: NewsItem[]): Promise<number> {
  let updated = 0;
  const raw = callClaudeClassify(buildClassifyPrompt(items.map(i => ({ title: i.title, abstract: i.snippet }))));
  let results: R[];
  try { results = JSON.parse(raw); } catch { return 0; }
  for (const r of results) {
    const item = items[r.idx - 1]; if (!item) continue;
    const d: Record<string, any> = { ai_classified: true };
    if (r.topics?.length) d.ai_topics = r.topics;
    if (r.relevance_score) d.relevance_score = r.relevance_score;
    if (r.companies?.length) d.companies = [...new Set([...((item as any).companies ?? []), ...r.companies])];
    await supabase.from("news_items").update(d).eq("id", item.id);
    updated++;
  }
  return updated;
}
