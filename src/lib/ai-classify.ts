import { supabase } from "./supabase.js";
import { callClaude } from "./claude.js";

const TOPICS = "dc-networking,transport-protocols,programmable-net,sdn-nfv,congestion-ctrl,internet-measure,traffic-analysis,dns-bgp,network-monitoring,network-observability,ddos-defense,protocol-security,privacy-anonymity,side-channels,zero-trust,sase-sse,edge-computing,network-ai,machine-learning,optimization,ai-networking,network-digital-twin,intent-based-networking,satellite-leo,quantum-networking,5g-6g,mobile-wireless,ebpf-xdp,distributed-sys,storage-net,os-network-stack,cloud-infra,hpc,high-speed-networking,parallel-computing,security,automation,observability";
const COMPANIES = "cisco,google,ericsson,nokia,aws,microsoft,openai,nvidia,meta,intel,ibm,huawei,cloudflare,apple,amd,tencent,alibaba,baidu,bytedance";

function buildClassifyPrompt(items: { title: string; abstract?: string | null }[]): string {
  const block = items.map((item, i) =>
    `[${i+1}] ${item.title}\n${(item.abstract ?? "").slice(0, 400)}`
  ).join("\n\n");
  return `Classify each item. JSON: {"results":[{"idx":1,"topics":["slug"],"summary_cn":"中文摘要","relevance_score":8,"companies":["cisco"]}]}
Topics: ${TOPICS}
Companies: ${COMPANIES}
Score:1-10(10=direct net). ML→machine-learning. AIforNet→network-ai. CN summary. Companies only if clearly mentioned.
${block}`;
}

function callClaudeClassify(prompt: string): string {
  const raw = callClaude(prompt);
  if (!raw) return "[]";
  const m = raw.match(/\{[\s\S]*"results"[\s\S]*\}/);
  if (!m) { console.error("[ai] No JSON"); return "[]"; }
  try { return JSON.stringify((JSON.parse(m[0]).results ?? JSON.parse(m[0]).classifications ?? [])); } catch { return "[]"; }
}

type R = { idx: number; topics: string[]; summary_cn?: string; relevance_score?: number; companies?: string[] };

export async function classifyPapers(batchSize = 50): Promise<{ processed: number; updated: number }> {
  let total = 0, updated = 0, allIds: string[] = [];
  for (let r = 0; r < 100; r++) {
    const { data: papers, error } = await supabase.from("papers").select("id,title,abstract,companies").eq("ai_classified", false).neq("title","test paper").limit(batchSize);
    if (error || !papers?.length) { if (!papers?.length) console.log("[ai] No more unclassified papers"); break; }
    console.log(`[ai] Batch ${r+1}: ${papers.length} papers (${papers[0].title.slice(0,40)}...)`);
    const raw = callClaudeClassify(buildClassifyPrompt(papers.map(p => ({ title: p.title, abstract: p.abstract }))));
    let results: R[]; try { results = JSON.parse(raw); } catch { break; }
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
      allIds.push(p.id); updated++;
    }
    total += papers.length;
  }
  if (allIds.length) await findSimilarPapers(allIds);
  return { processed: total, updated };
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

export async function classifyNews(batchSize = 50): Promise<{ processed: number; updated: number }> {
  let total = 0, updated = 0;
  for (let r = 0; r < 100; r++) {
    const { data: items, error } = await supabase.from("news_items").select("id,title,snippet,companies").eq("ai_classified", false).limit(batchSize);
    if (error || !items?.length) { if (!items?.length) console.log("[ai] No more unclassified news"); break; }
    console.log(`[ai] News batch ${r+1}: ${items.length} items`);
    const raw = callClaudeClassify(buildClassifyPrompt(items.map(i => ({ title: i.title, abstract: i.snippet }))));
    let results: R[]; try { results = JSON.parse(raw); } catch { break; }
    for (const r of results) {
      const item = items[r.idx - 1]; if (!item) continue;
      const d: Record<string, any> = { ai_classified: true };
      if (r.topics?.length) d.ai_topics = r.topics;
      if (r.relevance_score) d.relevance_score = r.relevance_score;
      if (r.companies?.length) d.companies = [...new Set([...((item as any).companies ?? []), ...r.companies])];
      await supabase.from("news_items").update(d).eq("id", item.id);
      updated++;
    }
    total += items.length;
  }
  return { processed: total, updated };
}
