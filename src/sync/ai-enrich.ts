import { supabase } from "../lib/supabase.js";
import { callClaude } from "../lib/claude.js";

type EnrichmentResult = {
  whats_new: string;
  why_it_matters: string;
  key_details: string[];
  category: string;
};

const CATEGORIES = [
  "network-ai", "network-software", "ai-infra", "6g-wireless",
  "network-security", "cloud-native", "distributed-system", "other",
] as const;

function buildEnrichPrompt(papers: { title: string; abstract: string | null }[]): string {
  const block = papers.map((p, i) => {
    const abs = (p.abstract ?? "").replace(/https?:\/\/[^\s]+/g, "").slice(0, 600);
    return `[${i + 1}] ${p.title}\n${abs}`;
  }).join("\n\n");

  return `Analyze each paper. For each, produce a structured deep analysis in Chinese.

Output JSON: {"results":[{"idx":1,"whats_new":"一句话概括核心创新点","why_it_matters":"对网络/AI/软件领域的意义（2-3句）","key_details":["技术细节1","技术细节2","技术细节3"],"category":"slug"}]}

Categories: ${CATEGORIES.join(",")}
- network-ai: network × AI (RAN intelligence, network optimization, traffic prediction)
- network-software: network OS, SDN, eBPF/XDP, P4, programmable dataplane, service mesh
- ai-infra: AI serving, distributed training, inference optimization, MLOps
- 6g-wireless: 6G, RIS, O-RAN, spectrum, wireless channel
- network-security: network intrusion, DDoS, zero-trust, protocol security
- cloud-native: Kubernetes, container networking, microservice, cloud infrastructure
- distributed-system: consensus, storage, HPC, parallel computing
- other: doesn't fit above

whats_new: one sentence, the novel contribution (Chinese, <=50 chars)
why_it_matters: 2-3 sentences on significance for networking/AI/software field (Chinese, <=150 chars)
key_details: 2-4 bullet points of technical specifics worth noting (Chinese, each <=60 chars)
category: best-fit slug from list above

${block}`;
}

export async function enrichHighScorePapers(
  batchSize = 10,
  minScore = 7,
  maxPerRun = 30,
): Promise<{ enriched: number; skipped: number }> {
  const since = new Date(Date.now() - 3 * 86400_000).toISOString();

  const { data: papers, error } = await supabase
    .from("papers")
    .select("id, title, abstract, relevance_score")
    .gte("relevance_score", minScore)
    .gte("created_at", since)
    .is("ai_enrichment", null)
    .order("relevance_score", { ascending: false })
    .limit(maxPerRun);

  if (error) {
    if (error.message?.includes("does not exist")) {
      console.log("[ai-enrich] Column ai_enrichment not found — run migration_010_ai_enrichment.sql first");
    } else {
      console.warn("[ai-enrich] Query error:", error.message);
    }
    return { enriched: 0, skipped: 0 };
  }

  if (!papers?.length) {
    console.log(`[ai-enrich] No papers to enrich (min_score=${minScore})`);
    return { enriched: 0, skipped: 0 };
  }

  console.log(`[ai-enrich] ${papers.length} papers to enrich (score >= ${minScore})`);

  let enriched = 0;
  let skipped = 0;

  for (let i = 0; i < papers.length; i += batchSize) {
    const batch = papers.slice(i, i + batchSize);
    console.log(`[ai-enrich] Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} papers`);

    const raw = callClaude(buildEnrichPrompt(batch), { timeout: 120_000 });
    if (!raw) { skipped += batch.length; continue; }

    const m = raw.match(/\{[\s\S]*"results"[\s\S]*\}/);
    if (!m) { skipped += batch.length; continue; }

    let results: (EnrichmentResult & { idx: number })[];
    try {
      results = JSON.parse(m[0]).results ?? [];
    } catch {
      skipped += batch.length;
      continue;
    }

    for (const r of results) {
      const p = batch[r.idx - 1];
      if (!p) continue;

      const enrichment = {
        whats_new: r.whats_new ?? "",
        why_it_matters: r.why_it_matters ?? "",
        key_details: r.key_details ?? [],
        category: r.category ?? "other",
        enriched_at: new Date().toISOString(),
      };

      const { error: updateErr } = await supabase
        .from("papers")
        .update({ ai_enrichment: enrichment })
        .eq("id", p.id);

      if (updateErr) {
        console.warn(`[ai-enrich] Failed to update ${p.id}: ${updateErr.message}`);
        skipped++;
      } else {
        enriched++;
      }
    }
  }

  console.log(`[ai-enrich] Done: ${enriched} enriched, ${skipped} skipped`);
  return { enriched, skipped };
}
