import { supabase } from "../lib/supabase.js";
import { TECH_KEYWORDS } from "../lib/tech-keywords.js";

type Signal = {
  signal_type: "surge" | "emerging" | "company-shift";
  severity: number; title: string; description: string;
  topic_slug: string; keyword_label: string;
  company_slugs: string[]; evidence: Record<string, any>;
};

export async function analyzeTechSignals(): Promise<number> {
  const signals: Signal[] = [];
  const now = new Date();
  const recentCut = new Date(now.getTime() - 7 * 86400 * 1000).toISOString().slice(0, 10);
  const prevCut = new Date(now.getTime() - 14 * 86400 * 1000).toISOString().slice(0, 10);
  const fetchCut = new Date(now.getTime() - 30 * 86400 * 1000).toISOString().slice(0, 10);

  // Fetch papers
  const allPapers: any[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data: page } = await supabase.from("papers")
      .select("id, title, abstract, companies, published_date")
      .not("published_date", "is", null).gte("published_date", fetchCut)
      .order("published_date", { ascending: false }).range(offset, offset + 999);
    if (!page?.length) break;
    allPapers.push(...page);
    if (page.length < 1000) break;
  }
  if (!allPapers.length) { console.log("[tech-signals] No papers"); return 0; }

  // Fetch news
  const allNews: any[] = [];
  for (let off = 0; ; off += 1000) {
    const { data: page } = await supabase.from("news_items")
      .select("id, title, snippet, companies, pub_date, ai_topics")
      .not("pub_date", "is", null).gte("pub_date", fetchCut)
      .order("pub_date", { ascending: false }).range(off, off + 999);
    if (!page?.length) break;
    allNews.push(...page);
    if (page.length < 1000) break;
  }

  // Keyword counts
  const counts = new Map<string, { r: number; p: number; topic: string; label: string }>();
  for (const kw of TECH_KEYWORDS) counts.set(kw.keyword, { r: 0, p: 0, topic: kw.topic, label: kw.label });
  const companyMap = new Map<string, Map<string, { r: number; p: number }>>();

  for (const paper of allPapers) {
    const d = paper.published_date ?? "";
    if (d < prevCut) continue;
    const isRecent = d >= recentCut;
    const text = `${paper.title ?? ""} ${paper.abstract ?? ""}`.toLowerCase();
    for (const kw of TECH_KEYWORDS) {
      if (!new RegExp(kw.keyword, "i").test(text)) continue;
      const c = counts.get(kw.keyword)!;
      if (isRecent) c.r++; else c.p++;
      for (const co of (paper.companies ?? [])) {
        if (!companyMap.has(co)) companyMap.set(co, new Map());
        const cm = companyMap.get(co)!;
        if (!cm.has(kw.keyword)) cm.set(kw.keyword, { r: 0, p: 0 });
        const ce = cm.get(kw.keyword)!;
        if (isRecent) ce.r++; else ce.p++;
      }
    }
  }

  for (const news of allNews) {
    const d = news.pub_date ?? "";
    if (d < prevCut) continue;
    const isRecent = d >= recentCut;
    const text = `${news.title ?? ""} ${news.snippet ?? ""}`.toLowerCase();
    for (const kw of TECH_KEYWORDS) {
      if (!new RegExp(kw.keyword, "i").test(text)) continue;
      const c = counts.get(kw.keyword)!;
      if (isRecent) c.r++; else c.p++;
      for (const co of (news.companies ?? [])) {
        if (!companyMap.has(co)) companyMap.set(co, new Map());
        const cm = companyMap.get(co)!;
        if (!cm.has(kw.keyword)) cm.set(kw.keyword, { r: 0, p: 0 });
        const ce = cm.get(kw.keyword)!;
        if (isRecent) ce.r++; else ce.p++;
      }
    }
  }

  // Generate signals
  for (const [, d] of counts) {
    if (d.r < 3) continue;
    const pct = d.p > 0 ? Math.round((d.r / d.p - 1) * 100) : 999;
    if (d.p < 2 && d.r >= 5) {
      signals.push({ signal_type: "emerging", severity: Math.min(10, 5 + Math.floor(d.r / 10)),
        title: `🌱 ${d.label} — 新热点`, description: `近7天 ${d.r} 篇涉及 ${d.label}（此前${d.p}篇），热度骤起。`,
        topic_slug: d.topic, keyword_label: d.label, company_slugs: [],
        evidence: { recent: d.r, previous: d.p, keyword: d.label } });
    } else if (pct >= 50 && d.r >= 5) {
      signals.push({ signal_type: "surge", severity: Math.min(10, Math.round(5 + pct / 50)),
        title: `📈 ${d.label} +${pct}%`,
        description: `"${d.label}" 近7天 ${d.r} 篇，环比增长 ${pct}%（上期 ${d.p} 篇）。主题：${d.topic}。`,
        topic_slug: d.topic, keyword_label: d.label, company_slugs: [],
        evidence: { recent: d.r, previous: d.p, pct, keyword: d.label } });
    }
  }

  for (const [company, km] of companyMap) {
    for (const [keyword, d] of km) {
      if (d.r < 2) continue;
      const kd = TECH_KEYWORDS.find(x => x.keyword === keyword);
      if (!kd) continue;
      if ((d.p < 2 && d.r >= 3) || (d.p >= 2 && d.r / d.p >= 2.5)) {
        const pct = d.p > 0 ? Math.round((d.r / d.p - 1) * 100) : 999;
        signals.push({ signal_type: "company-shift", severity: d.p < 2 ? 7 : 6,
          title: d.p < 2 ? `🎯 ${company} 进入${kd.label}` : `🔥 ${company} ${kd.label}+${pct}%`,
          description: d.p < 2 ? `${company} 近7天 ${d.r} 篇涉及 ${kd.label}（此前无），值得关注。` : `${company} ${kd.label}方向产出增长${pct}%（${d.p}→${d.r}篇）。`,
          topic_slug: kd.topic, keyword_label: kd.label, company_slugs: [company],
          evidence: { recent: d.r, previous: d.p, company, keyword: d.label } });
      }
    }
  }

  signals.sort((a, b) => b.severity - a.severity);

  let inserted = 0;
  for (const sig of signals) {
    const { data: existing } = await supabase
      .from("tech_signals").select("id, severity").eq("title", sig.title).eq("status", "new").maybeSingle();
    if (existing) {
      if (sig.severity > existing.severity) await supabase.from("tech_signals").update({ severity: sig.severity }).eq("id", existing.id);
      continue;
    }
    await supabase.from("tech_signals").insert({
      signal_type: sig.signal_type, severity: sig.severity, title: sig.title,
      description: sig.description, topic_slug: sig.topic_slug,
      company_slugs: sig.company_slugs, evidence: sig.evidence, status: "new",
    });
    inserted++;
  }

  console.log(`[tech-signals] ${signals.length} signals: ${signals.filter(s => s.signal_type === "surge").length} surges, ${signals.filter(s => s.signal_type === "emerging").length} emerging, ${signals.filter(s => s.signal_type === "company-shift").length} company (${inserted} new)`);
  return inserted;
}
