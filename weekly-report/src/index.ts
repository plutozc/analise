import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Missing env"); process.exit(1); }

const supabase = createClient(url, key, {
  auth: { persistSession: false },
  realtime: { transport: ws as any },
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "reports");

const since = new Date(Date.now() - 7 * 86400_000).toISOString();
const weekLabel = (() => {
  const d = new Date();
  const iso = d.toISOString().slice(0, 10);
  return iso;
})();

type Signal = {
  id: string; signal_type: string; severity: number; title: string;
  description: string; topic_slug: string; company_slugs: string[];
  evidence: Record<string, any>; created_at: string;
};

type Paper = { id: string; title: string; relevance_score: number; companies: string[]; venue: string; url: string | null; ai_summary: string | null; created_at: string };
type NewsItem = { id: string; title: string; relevance_score: number; source: string; link: string | null; companies: string[]; created_at: string };

async function fetchSignals(): Promise<{ all: Signal[]; byType: Record<string, Signal[]> }> {
  const { data } = await supabase
    .from("tech_signals")
    .select("*")
    .gte("created_at", since)
    .order("severity", { ascending: false });
  const all = (data ?? []) as Signal[];
  const byType: Record<string, Signal[]> = {};
  for (const s of all) {
    if (!byType[s.signal_type]) byType[s.signal_type] = [];
    byType[s.signal_type].push(s);
  }
  return { all, byType };
}

async function fetchTopPapers(limit = 10): Promise<Paper[]> {
  const { data } = await supabase
    .from("papers")
    .select("id, title, relevance_score, companies, venue, url, ai_summary, created_at")
    .gte("created_at", since)
    .eq("ai_classified", true)
    .gte("relevance_score", 5)
    .order("relevance_score", { ascending: false })
    .limit(limit);
  return (data ?? []) as Paper[];
}

async function fetchTopNews(limit = 10): Promise<NewsItem[]> {
  const { data } = await supabase
    .from("news_items")
    .select("id, title, relevance_score, source, link, companies, created_at")
    .gte("created_at", since)
    .gte("relevance_score", 5)
    .order("relevance_score", { ascending: false })
    .limit(limit);
  return (data ?? []) as NewsItem[];
}

type CompanyInfo = { papers: number; news: number; topPapers: Paper[]; topNews: NewsItem[] };

async function fetchCompanyStats(): Promise<Record<string, CompanyInfo>> {
  const result: Record<string, CompanyInfo> = {};
  const perCoPapers = new Map<string, Paper[]>();
  const perCoNews = new Map<string, NewsItem[]>();

  const { data: allPapers } = await supabase
    .from("papers")
    .select("id, title, relevance_score, companies, venue, url, ai_summary, created_at")
    .gte("created_at", since)
    .eq("ai_classified", true)
    .gte("relevance_score", 5)
    .order("relevance_score", { ascending: false });
  const papersList = (allPapers ?? []) as Paper[];

  const { data: allNews } = await supabase
    .from("news_items")
    .select("id, title, relevance_score, source, link, companies, created_at")
    .gte("created_at", since)
    .gte("relevance_score", 5)
    .order("relevance_score", { ascending: false });
  const newsList = (allNews ?? []) as NewsItem[];

  for (const p of papersList) {
    for (const c of (p.companies ?? []) as string[]) {
      if (!perCoPapers.has(c)) perCoPapers.set(c, []);
      perCoPapers.get(c)!.push(p);
    }
  }
  for (const n of newsList) {
    for (const c of (n.companies ?? []) as string[]) {
      if (!perCoNews.has(c)) perCoNews.set(c, []);
      perCoNews.get(c)!.push(n);
    }
  }

  const allCos = new Set([...perCoPapers.keys(), ...perCoNews.keys()]);
  for (const co of allCos) {
    result[co] = {
      papers: (perCoPapers.get(co) ?? []).length,
      news: (perCoNews.get(co) ?? []).length,
      topPapers: (perCoPapers.get(co) ?? []).slice(0, 5),
      topNews: (perCoNews.get(co) ?? []).slice(0, 5),
    };
  }

  return result;
}

function callClaude(prompt: string): string {
  const r = spawnSync("claude", ["-p", "--output-format", "json"], {
    input: prompt, encoding: "utf-8", timeout: 120_000, maxBuffer: 20 * 1024 * 1024,
  });
  if (r.error) { console.error("[claude] error:", r.error.message); return ""; }
  const lines = (r.stdout ?? "").trim().split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    try { const obj = JSON.parse(lines[i]); if (obj.type === "result") return obj.result ?? ""; } catch {}
  }
  return r.stdout?.trim() ?? "";
}

function topTopics(signals: Signal[], limit = 10): Array<{ topic: string; signals: Signal[]; maxSeverity: number; totalSignals: number }> {
  const grouped = new Map<string, Signal[]>();
  for (const s of signals) {
    if (!grouped.has(s.topic_slug)) grouped.set(s.topic_slug, []);
    grouped.get(s.topic_slug)!.push(s);
  }
  return [...grouped.entries()]
    .map(([topic, topicSignals]) => ({
      topic,
      signals: topicSignals.sort((a, b) => b.severity - a.severity).slice(0, 5),
      maxSeverity: Math.max(...topicSignals.map(s => s.severity)),
      totalSignals: topicSignals.length,
    }))
    .sort((a, b) => (b.maxSeverity - a.maxSeverity) || (b.totalSignals - a.totalSignals))
    .slice(0, limit);
}

function topCompanySignals(companyStats: Record<string, CompanyInfo>, limit = 12): Array<{
  company: string;
  papers: number;
  news: number;
  topPapers: Paper[];
  topNews: NewsItem[];
}> {
  return Object.entries(companyStats)
    .filter(([_, v]) => v.papers + v.news > 0)
    .map(([company, info]) => ({ company, ...info }))
    .sort((a, b) => {
      const scoreA = a.topPapers.reduce((sum, p) => sum + p.relevance_score, 0) + a.topNews.reduce((sum, n) => sum + n.relevance_score, 0);
      const scoreB = b.topPapers.reduce((sum, p) => sum + p.relevance_score, 0) + b.topNews.reduce((sum, n) => sum + n.relevance_score, 0);
      return scoreB - scoreA;
    })
    .slice(0, limit)
    .map(info => ({
      ...info,
      topPapers: info.topPapers.slice(0, 3),
      topNews: info.topNews.slice(0, 3),
    }));
}

function reportContext(signals: Signal[], papers: Paper[], news: NewsItem[], companyStats: Record<string, CompanyInfo>) {
  return {
    weekEnding: weekLabel,
    generated: new Date().toISOString().slice(0, 19).replace("T", " "),
    topics: topTopics(signals, 10).map(t => ({
      topic: t.topic,
      maxSeverity: t.maxSeverity,
      signalCount: t.totalSignals,
      signals: t.signals.map(s => ({
        severity: s.severity,
        title: s.title,
        description: s.description,
        type: s.signal_type,
        companies: s.company_slugs ?? [],
      })),
    })),
    topSignals: signals.slice(0, 20).map(s => ({
      severity: s.severity,
      topic: s.topic_slug,
      type: s.signal_type,
      title: s.title,
      description: s.description,
      companies: s.company_slugs ?? [],
    })),
    companies: topCompanySignals(companyStats, 12).map(c => ({
      company: c.company,
      counts: { papers: c.papers, news: c.news },
      papers: c.topPapers.map(p => ({
        title: p.title,
        relevance: p.relevance_score,
        venue: p.venue,
        url: p.url,
        summary: p.ai_summary,
      })),
      news: c.topNews.map(n => ({
        title: n.title,
        relevance: n.relevance_score,
        source: n.source,
        link: n.link,
      })),
    })),
    topPapers: papers.map(p => ({
      title: p.title,
      relevance: p.relevance_score,
      venue: p.venue,
      url: p.url,
      companies: p.companies ?? [],
      summary: p.ai_summary,
    })),
    topNews: news.map(n => ({
      title: n.title,
      relevance: n.relevance_score,
      source: n.source,
      link: n.link,
      companies: n.companies ?? [],
    })),
  };
}

function buildIntelligencePrompt(context: ReturnType<typeof reportContext>): string {
  return `你是一名技术情报分析员，请基于输入的论文、新闻、公司动态、主题热度和信号分数，生成一份“网络技术情报周报”。

周报定位：
- 这是一份技术情报周报，不是某家公司内部战略报告。
- 重点是帮助读者快速理解本周网络技术领域发生了什么、哪些信号变强、哪些论文/新闻值得跟踪。
- 不需要讨论“对某家公司意味着什么”，但可以保留公司动态作为情报信号。
- 不要写成数据库 dump，也不要机械罗列所有条目。要筛选、压缩、归纳。

输出结构必须包含：

重要约束：
- 只输出最终 Markdown 报告正文。
- 不要创建文件、不要请求写入权限、不要说明你的写作选择、不要输出“drafted at”之类的状态信息。
- 不要把报告放进代码块。

1. 标题与元信息
- 标题：Weekly Tech Intelligence Report
- Week ending: ${context.weekEnding}
- Generated: ${context.generated}

2. Executive Brief
标题使用：## 🧭 Executive Brief
用 2-4 段总结本周最重要的 2-4 条技术主线。
要求：先给出一句总判断；每段围绕一条主线展开；必须引用关键论文或新闻作为证据；说明为什么这个信号重要；不要夸张，不要营销腔。

3. Signal Radar
标题使用：## 📡 Signal Radar
用 bullet list 总结热点主题。
每个主题格式：
- 图标 **topic-name**: 一句话解释本周信号、变化幅度和技术含义。
要求：不要只输出机器标签和分数；每个 topic 都要有人能读懂的一句话解释；优先保留最强、最相关的 5-8 个主题。

4. Key Themes
标题使用：## 🔎 Key Themes
选择 3-5 个本周最重要主题，每个主题包含：
- 小标题
- 1 段事实与证据
- 1 段“情报判断”
要求：“情报判断”只做技术趋势判断，不做公司内部影响分析；判断要基于输入数据，不能凭空发挥。

5. Notable Company Signals
标题使用：## 🏢 Notable Company Signals
用 5-8 条 bullet list 总结公司相关信号。
要求：每条只保留高价值公司或公司组合；说明该公司本周出现了什么技术/产业信号；不要展开成每家公司下的论文和新闻列表；不要把公司标签当成严格归因。

6. Top Papers
标题使用：## 📄 Top Papers
列出 8-10 篇最值得跟踪的论文。
每条包含：标题和链接、relevance 分数、1 句话说明其技术价值。
要求：论文标题必须使用 Markdown 链接格式 [title](url)，除非输入数据 url 为空；不要只翻译标题；解释为什么这篇论文值得跟踪；优先选择和网络、数据中心、路由、安全、自动化、5G/6G、可观测性相关的论文。

7. Top News
标题使用：## 📰 Top News
列出 8-10 条最值得跟踪的新闻。
每条包含：标题和链接、relevance 分数、来源名、1 句话说明其情报价值。
要求：新闻标题必须使用 Markdown 链接格式 [title](link)，除非输入数据 link 为空；优先官方博客、标准组织、论文原文、权威技术媒体；Google News RSS、财经转载、二次媒体可以保留，但要谨慎；对产品交付、公司合作、市场份额等新闻，提醒需要二次核验。

8. Source Notes
标题使用：## 🧾 Source Notes
最后加入 2-3 条说明：
- 哪些信源可作为早期信号，哪些需要二次确认。
- 公司标签仅作为检索辅助，不等同于严格归因。
- relevance 分数代表本周情报价值，不等同于论文质量或商业重要性。

写作风格：
- 使用中文。
- 专业、克制、信息密度高。
- 像技术情报简报，而不是新闻稿。
- 避免宣传腔、投资研报腔、公司内部汇报腔。
- 可以使用少量语义化图标提升可读性，主要用于章节标题和 Signal Radar 主题前缀；不要每句话都加图标。
- 不要输出过长的原始列表。
- 不要出现 localhost 链接。
- 不要保留明显错误标签；如发现输入数据前后不一致，应采用保守表述，或在 Source Notes 中提示需要核验。

质量标准：
- 总长度建议控制在 120-180 行 Markdown。
- Executive Brief 必须能独立阅读。
- Signal Radar 必须解释“信号含义”，不能只报数。
- Key Themes 必须有判断，不只是复述新闻。
- Top Papers / Top News 是证据索引，不应喧宾夺主。
- 最终报告应该让读者在 5 分钟内理解本周技术情报重点。

输入数据如下，所有链接均来自数据源；url/link 为空时不要编造链接：

\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\``;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function markdownLink(title: string, url: string): string {
  const label = title.replace(/\\/g, "\\\\").replace(/\[/g, "\\[").replace(/]/g, "\\]");
  return `[${label}](${url})`;
}

function renderTopPapersSection(context: ReturnType<typeof reportContext>): string {
  const lines: string[] = ["## 📄 Top Papers", ""];

  if (!context.topPapers.length) {
    lines.push("- No papers classified this week.");
    return lines.join("\n");
  }

  for (let i = 0; i < context.topPapers.length; i++) {
    const p = context.topPapers[i];
    const title = p.url ? markdownLink(p.title, p.url) : `**${p.title}**`;
    const venue = p.venue ? ` | ${p.venue}` : "";
    const summary = p.summary || "值得作为本周高相关论文继续跟踪。";
    lines.push(`${i + 1}. ${title} — relevance: ${p.relevance}/10${venue}  `);
    lines.push(`   ${summary}`);
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

function renderTopNewsSection(context: ReturnType<typeof reportContext>): string {
  const lines: string[] = ["## 📰 Top News", ""];

  if (!context.topNews.length) {
    lines.push("- No news scored this week.");
    return lines.join("\n");
  }

  for (let i = 0; i < context.topNews.length; i++) {
    const n = context.topNews[i];
    const title = n.link ? markdownLink(n.title, n.link) : `**${n.title}**`;
    lines.push(`${i + 1}. ${title} — relevance: ${n.relevance}/10 | ${n.source}  `);
    lines.push("   本条可作为早期情报信号，涉及产品、合作或市场份额时需二次核验。");
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

function replaceMarkdownSection(report: string, heading: string, replacement: string): string {
  const headingIndex = report.indexOf(heading);
  if (headingIndex === -1) return `${report.trimEnd()}\n\n${replacement}`;

  const afterHeadingIndex = headingIndex + heading.length;
  const nextHeadingMatch = report.slice(afterHeadingIndex).match(/\n## /);
  const endIndex = nextHeadingMatch ? afterHeadingIndex + nextHeadingMatch.index! : report.length;

  return `${report.slice(0, headingIndex).trimEnd()}\n\n${replacement}\n\n${report.slice(endIndex).trimStart()}`.trim();
}

function updateMarkdownSection(report: string, heading: string, transform: (section: string) => string): string {
  const headingIndex = report.indexOf(heading);
  if (headingIndex === -1) return report;

  const afterHeadingIndex = headingIndex + heading.length;
  const nextHeadingMatch = report.slice(afterHeadingIndex).match(/\n## /);
  const endIndex = nextHeadingMatch ? afterHeadingIndex + nextHeadingMatch.index! : report.length;
  const section = report.slice(headingIndex, endIndex);

  return `${report.slice(0, headingIndex)}${transform(section)}${report.slice(endIndex)}`;
}

function enforceEvidenceSections(report: string, context: ReturnType<typeof reportContext>): string {
  return replaceMarkdownSection(
    replaceMarkdownSection(report, "## 📄 Top Papers", renderTopPapersSection(context)),
    "## 📰 Top News",
    renderTopNewsSection(context),
  );
}

function isCompleteIntelligenceReport(report: string): boolean {
  const required = [
    "Weekly Tech Intelligence Report",
    "## 🧭 Executive Brief",
    "## 📡 Signal Radar",
    "## 🔎 Key Themes",
    "## 🏢 Notable Company Signals",
    "## 📄 Top Papers",
    "## 📰 Top News",
    "## 🧾 Source Notes",
  ];

  return required.every(section => report.includes(section));
}

function sourceAliases(title: string, source?: string): string[] {
  const aliases = new Set<string>();
  const lower = title.toLowerCase();
  const genericAcronyms = new Set(["AI", "BGP", "DNS", "RAN", "P4", "XDP", "NFV", "LLM", "CPU", "GPU", "SDN"]);

  aliases.add(title);
  aliases.add(title.replace(/\s+-\s+[^-]+$/, ""));

  const colonPrefix = title.split(":")[0]?.trim();
  if (colonPrefix && colonPrefix.length >= 4) aliases.add(colonPrefix);

  for (const match of title.matchAll(/\b[A-Z][A-Z0-9-]{2,}\b/g)) {
    if (!genericAcronyms.has(match[0])) aliases.add(match[0]);
  }

  if (source === "APNIC Blog") aliases.add("APNIC");
  if (source === "LWN.net") aliases.add("LWN");
  if (source === "NVIDIA Developer") aliases.add("NVIDIA Developer");

  if (lower.includes("bgp stuck route observatory")) {
    aliases.add("BGP Stuck Route Observatory");
    aliases.add("BGP Clock");
  }
  if (lower.includes("telegram founder") && lower.includes("bgp hijacks")) {
    aliases.add("Telegram-Meta");
    aliases.add("Telegram 创始人公开指控 Meta");
    aliases.add("BGP 劫持指控");
  }
  if (lower.includes("cisco catalyst sd-wan manager")) {
    aliases.add("Cisco Catalyst SD-WAN Manager");
    aliases.add("Cisco SD-WAN Manager");
    aliases.add("CVE-2026-20245");
  }
  if (lower.includes("ericsson") && lower.includes("telia") && lower.includes("5g")) {
    aliases.add("Ericsson 与 Telia");
    aliases.add("5G/6G/AI 联合测试数字平台");
    aliases.add("5G/6G/AI 数字创新区");
  }
  if (lower.includes("agentic ai") && lower.includes("core networks")) {
    aliases.add("Agentic AI 核心网");
    aliases.add("Ericsson 的 Agentic AI 核心网方案");
  }
  if (lower.includes("autonomous networks") && lower.includes("agentic ai")) {
    aliases.add("NVIDIA 的运营商自主网络指南");
    aliases.add("运营商自主网络指南");
  }
  if (lower.includes("kasan") && lower.includes("bpf")) {
    aliases.add("KASAN");
    aliases.add("JIT 编译 BPF");
    aliases.add("BPF KASAN");
  }
  if (lower.includes("howlr")) aliases.add("HOWLR");
  if (lower.includes("lolla")) aliases.add("LOLLA");

  return [...aliases].filter(alias => alias.length >= 3);
}

function evidenceLinkAliases(context: ReturnType<typeof reportContext>): Array<{ alias: string; url: string }> {
  const items: Array<{ title: string; url: string; source?: string }> = [
    ...context.topPapers
      .filter(p => p.url)
      .map(p => ({ title: p.title, url: p.url as string, source: p.venue })),
    ...context.topNews
      .filter(n => n.link)
      .map(n => ({ title: n.title, url: n.link as string, source: n.source })),
  ];

  const seen = new Set<string>();
  const aliases: Array<{ alias: string; url: string }> = [];
  for (const item of items) {
    for (const alias of sourceAliases(item.title, item.source)) {
      const key = alias.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      aliases.push({ alias, url: item.url });
    }
  }

  return aliases.sort((a, b) => b.alias.length - a.alias.length);
}

function linkAliasesInSection(section: string, aliases: Array<{ alias: string; url: string }>): string {
  return section
    .split("\n")
    .map(line => {
      if (line.includes("](")) return line;

      let linked = line;
      for (const { alias, url } of aliases) {
        if (linked.includes(`](${url})`)) continue;
        const pattern = new RegExp(escapeRegExp(alias), "u");
        linked = linked.replace(pattern, markdownLink(alias, url));
      }
      return linked;
    })
    .join("\n");
}

function enrichSummaryLinks(report: string, context: ReturnType<typeof reportContext>): string {
  const aliases = evidenceLinkAliases(context);
  return updateMarkdownSection(
    updateMarkdownSection(report, "## 🧭 Executive Brief", section => linkAliasesInSection(section, aliases)),
    "## 📡 Signal Radar",
    section => linkAliasesInSection(section, aliases),
  );
}

function restoreLinks(report: string, context: ReturnType<typeof reportContext>): string {
  const entries: Array<{ title: string; url: string }> = [
    ...context.topPapers
      .filter(p => p.url)
      .map(p => ({ title: p.title, url: p.url as string })),
    ...context.topNews
      .filter(n => n.link)
      .map(n => ({ title: n.title, url: n.link as string })),
  ];

  let linked = report;
  for (const { title, url } of entries) {
    if (linked.includes(`](${url})`)) continue;

    const exactBold = new RegExp(`\\*\\*${escapeRegExp(title)}\\*\\*`, "g");
    if (exactBold.test(linked)) {
      linked = linked.replace(exactBold, markdownLink(title, url));
      continue;
    }

    const exactPlain = new RegExp(`(^|\\n)(\\d+\\.\\s+)${escapeRegExp(title)}(?=\\n|\\r|$)`, "g");
    linked = linked.replace(exactPlain, `$1$2${markdownLink(title, url)}`);
  }

  return linked;
}

async function generateIntelligenceReport(signals: Signal[], papers: Paper[], news: NewsItem[], companyStats: Record<string, CompanyInfo>): Promise<string> {
  const context = reportContext(signals, papers, news, companyStats);
  const prompt = buildIntelligencePrompt(context);

  console.log("[claude] Generating intelligence report...");
  const result = callClaude(prompt).trim();
  if (!result) return "";
  if (!isCompleteIntelligenceReport(result)) {
    console.warn("[claude] Incomplete report returned; falling back to deterministic report.");
    return "";
  }

  return enforceEvidenceSections(enrichSummaryLinks(restoreLinks(result, context), context), context)
    .replace(/^```(?:markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/\(http:\/\/localhost:[^)]+\)/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim() + "\n";
}

function topicIcon(topic: string): string {
  const t = topic.toLowerCase();
  if (t.includes("bgp") || t.includes("dns")) return "🛡️";
  if (t.includes("dc") || t.includes("data") || t.includes("lossless")) return "🧩";
  if (t.includes("ai") || t.includes("ml") || t.includes("autonomous")) return "🤖";
  if (t.includes("5g") || t.includes("6g") || t.includes("ran")) return "📶";
  if (t.includes("p4") || t.includes("programmable") || t.includes("xdp") || t.includes("ebpf")) return "⚙️";
  if (t.includes("satellite") || t.includes("leo")) return "🛰️";
  if (t.includes("transport") || t.includes("quic")) return "🚦";
  if (t.includes("edge")) return "🌐";
  return "•";
}

function buildFallbackReport(signals: Signal[], papers: Paper[], news: NewsItem[], companyStats: Record<string, CompanyInfo>): string {
  const lines: string[] = [];
  const topics = topTopics(signals, 8);
  const companies = topCompanySignals(companyStats, 8);

  lines.push(`# Weekly Tech Intelligence Report`);
  lines.push(`**Week ending:** ${weekLabel}`);
  lines.push(`**Generated:** ${new Date().toISOString().slice(0, 19).replace("T", " ")}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  lines.push("## 🧭 Executive Brief");
  lines.push("");
  const strongest = topics[0];
  if (strongest) {
    lines.push(`本周网络技术情报最强信号集中在 **${strongest.topic}**，最高严重度 ${strongest.maxSeverity}/10。整体看，热点主要由高分论文、厂商新闻和主题信号共同驱动，后续需要结合原始论文与权威信源继续核验。`);
  } else {
    lines.push("本周网络技术情报未出现显著主题聚集，建议继续观察高相关论文与权威技术新闻。");
  }
  if (papers[0] || news[0]) {
    const p = papers[0];
    const n = news[0];
    const paperText = p ? `${p.url ? `[${p.title}](${p.url})` : p.title}` : "";
    const newsText = n ? `${n.link ? `[${n.title}](${n.link})` : n.title}` : "";
    lines.push(`证据侧，高分论文 ${paperText || "暂无"} 与高分新闻 ${newsText || "暂无"} 构成本周优先阅读入口。`);
  }

  lines.push("");
  lines.push("## 📡 Signal Radar");
  lines.push("");
  for (const t of topics) {
    const lead = t.signals[0];
    lines.push(`- ${topicIcon(t.topic)} **${t.topic}**: ${t.totalSignals} 个高分信号，最高 ${t.maxSeverity}/10；${lead?.description || lead?.title || "需继续观察后续变化。"}`);
  }

  lines.push("");
  lines.push("## 🔎 Key Themes");
  lines.push("");
  for (const t of topics.slice(0, 4)) {
    lines.push(`### ${t.topic}`);
    lines.push("");
    lines.push(t.signals.map(s => `${s.title}: ${s.description}`).join(" "));
    lines.push("");
    lines.push(`**情报判断:** ${t.topic} 本周具备持续观察价值，建议优先回查相关论文、官方博客和标准组织材料。`);
    lines.push("");
  }

  lines.push("## 🏢 Notable Company Signals");
  lines.push("");
  for (const c of companies) {
    const leadPaper = c.topPapers[0];
    const leadNews = c.topNews[0];
    const lead = leadPaper?.title || leadNews?.title || "高相关信号";
    lines.push(`- **${c.company}**: ${c.papers} 篇论文、${c.news} 条新闻进入本周样本；代表信号为 ${lead}。`);
  }
  if (!companies.length) lines.push("- No company data this week.");
  lines.push("");

  lines.push("## 📄 Top Papers");
  lines.push("");
  if (papers.length) {
    for (let i = 0; i < papers.length; i++) {
      const p = papers[i];
      const titleLink = p.url ? `[${p.title}](${p.url})` : `**${p.title}**`;
      const summary = p.ai_summary ? ` ${p.ai_summary}` : " 值得作为本周高相关论文继续跟踪。";
      lines.push(`${i + 1}. ${titleLink} — relevance: ${p.relevance_score}/10${p.venue ? ` | ${p.venue}` : ""}  `);
      lines.push(`   ${summary}`);
      lines.push("");
    }
  } else {
    lines.push("- No papers classified this week.");
  }

  lines.push("## 📰 Top News");
  lines.push("");
  if (news.length) {
    for (let i = 0; i < news.length; i++) {
      const n = news[i];
      const titleLink = n.link ? `[${n.title}](${n.link})` : `**${n.title}**`;
      lines.push(`${i + 1}. ${titleLink} — relevance: ${n.relevance_score}/10 | ${n.source}  `);
      lines.push(`   本条可作为早期情报信号，涉及产品、合作或市场份额时需二次核验。`);
      lines.push("");
    }
  } else {
    lines.push("- No news scored this week.");
  }

  lines.push("## 🧾 Source Notes");
  lines.push("");
  lines.push("- Google News RSS、财经媒体和二次转载可作为早期信号源，但正式引用前应优先回查官方公告、论文原文或权威技术媒体。");
  lines.push("- 公司标签仅作为检索辅助，不等同于严格归因。");
  lines.push("- Relevance 分数反映本周情报价值，不等同于论文质量或商业重要性。");

  lines.push("---");
  lines.push(`_Auto-generated by weekly-report. Data source: Supabase (network-sync-worker)._`);
  lines.push("");

  return lines.join("\n");
}

async function main() {
  console.log("[report] Generating weekly report...");
  const start = Date.now();

  const [signalResult, papers, news, companyStats] = await Promise.all([
    fetchSignals(),
    fetchTopPapers(10),
    fetchTopNews(10),
    fetchCompanyStats(),
  ]);
  const signals = signalResult.all;

  const aiReport = await generateIntelligenceReport(signals, papers, news, companyStats);
  const report = aiReport || buildFallbackReport(signals, papers, news, companyStats);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const filename = `weekly-${weekLabel}.md`;
  const filepath = join(OUTPUT_DIR, filename);
  writeFileSync(filepath, report, "utf-8");

  console.log(report);
  console.log(`\n[report] Written to ${filepath} (${(Date.now() - start) / 1000}s)`);
}

main().catch(console.error);
