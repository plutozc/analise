import { supabase } from "../lib/supabase.js";
import { callClaude } from "../lib/claude.js";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "..", "bulletins");

// Key vendors in scope for data-comm + AI infra
const KEY_VENDORS = new Set([
  "huawei", "cisco", "nokia", "ericsson", "broadcom", "nvidia", "intel", "amd",
  "marvell", "microsoft", "aws", "google", "meta", "alibaba", "tencent",
  "bytedance", "ibm", "oracle", "qualcomm",
  "zhipu", "baichuan", "moonshot", "deepseek", "minimax", "openai", "anthropic",
]);

// Urgent event keywords
const EVENT_KEYWORDS =
  /财报|earnings|revenue|收购|acqui|merger|发布|launch|release|投资|capex|capital\s*expend|破纪录|record|数据中心|data\s*center|交换机|switch|路由器|router|芯片|chip|asic|gpu|rdma|roce|5g|6g|ran\b|oran|ai\s*infra|算力|hbm|液冷|cooling|dpu|smartnic|大模型|llm|glm|gpt|claude|开源模型|open.?source.*model|ai\s*agent|推理引擎|inference|训练框架|training|sdk|api|平台|platform|自动化|automat|编排|orchestrat|ansible|terraform|kubernetes|k8s/i;

const SOFTWARE_KEYWORDS =
  /大模型|llm|glm|gpt|claude|开源模型|sdk|api|ai\s*agent|推理引擎|inference|训练框架|training|自动化|automat|编排|orchestrat|ansible|terraform|kubernetes|k8s|平台|platform|发布.*版本|release.*version/i;

const CLOUD_CAPEX_KEYWORDS =
  /云.*营收|cloud.*revenue|季度.*财报|quarterly.*earning|capex.*增长|capex.*grow|资本支出.*增|capital.*expend|云.*市场份额|cloud.*market\s*share/i;

// Score whether a news item is in scope (data-comm + AI infra)
function isInScope(title: string, snippet: string | null, companies: string[]): boolean {
  const text = `${title} ${snippet ?? ""}`.toLowerCase();
  const hasKeyVendor = companies.some(c => KEY_VENDORS.has(c));
  const hasInfraKeyword = EVENT_KEYWORDS.test(text);
  return hasKeyVendor || hasInfraKeyword;
}

type NewsRow = {
  id: string;
  title: string;
  snippet: string | null;
  source: string | null;
  link: string | null;
  relevance_score: number | null;
  coverage_count: number | null;
  companies: string[];
  created_at: string;
  ai_topics: string[] | null;
};

type EventCluster = {
  representative: NewsRow;
  items: NewsRow[];
  coverageTotal: number;
  maxScore: number;
  words: Set<string>;
};

// ─── Text clustering (adapted from feeds.ts) ──────────────────────
const STOP = new Set([
  "the", "this", "that", "with", "from", "have", "will", "said", "says",
  "after", "before", "report", "over", "cross", "also", "more", "than",
  "into", "their", "they", "them", "what", "when", "been", "still",
  "billion", "million", "crore",
]);

function coreWords(t: string): Set<string> {
  const cjkRuns = t.match(/[一-鿿]+/g) ?? [];
  const cjkTokens: string[] = [];
  for (const run of cjkRuns) {
    for (let i = 0; i < run.length - 1; i++) cjkTokens.push(run.slice(i, i + 2));
  }
  const words = t
    .replace(/[—–\-–].+$/, "")
    .replace(/^[A-Za-z]+\s*:\s*/, "")
    .toLowerCase()
    .replace(/[一-鿿]/g, " ")
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOP.has(w))
    .map(w => w.replace(/s$/, "").replace(/ed$/, ""));
  return new Set([...words, ...cjkTokens]);
}

function isDup(a: Set<string>, b: Set<string>): boolean {
  if (a.size < 2 || b.size < 2) return false;
  const smaller = a.size <= b.size ? a : b;
  const larger = a.size <= b.size ? b : a;
  const contained = [...smaller].filter(w => larger.has(w));
  return contained.length >= 2 && contained.length / smaller.size >= 0.4;
}

function itemWords(item: NewsRow): Set<string> {
  const titleWords = coreWords(item.title);
  const snippetWords = coreWords((item.snippet ?? "").slice(0, 200));
  return new Set([...titleWords, ...snippetWords]);
}

function shouldMerge(itemW: Set<string>, clusterW: Set<string>, item: NewsRow, cluster: EventCluster): boolean {
  if (isDup(itemW, clusterW)) return true;
  const sharedCompanies = item.companies.filter(c => cluster.representative.companies.includes(c));
  if (sharedCompanies.length > 0) {
    const smaller = itemW.size <= clusterW.size ? itemW : clusterW;
    const larger = itemW.size <= clusterW.size ? clusterW : itemW;
    const overlap = [...smaller].filter(w => larger.has(w)).length;
    if (overlap >= 2 && overlap / smaller.size >= 0.3) return true;
  }
  return false;
}

function clusterEvents(items: NewsRow[]): EventCluster[] {
  const clusters: EventCluster[] = [];
  for (const item of items) {
    const words = itemWords(item);
    let matched = false;
    for (const c of clusters) {
      if (shouldMerge(words, c.words, item, c)) {
        c.items.push(item);
        c.coverageTotal += item.coverage_count ?? 1;
        c.maxScore = Math.max(c.maxScore, item.relevance_score ?? 0);
        for (const w of words) c.words.add(w);
        if ((item.relevance_score ?? 0) > (c.representative.relevance_score ?? 0)) {
          c.representative = item;
        }
        matched = true;
        break;
      }
    }
    if (!matched) {
      clusters.push({
        representative: item,
        items: [item],
        coverageTotal: item.coverage_count ?? 1,
        maxScore: item.relevance_score ?? 0,
        words,
      });
    }
  }
  return clusters;
}

// ─── Trigger detection ────────────────────────────────────────────

function isUrgentEvent(cluster: EventCluster): boolean {
  const { representative: r, coverageTotal, maxScore } = cluster;
  const text = `${r.title} ${r.snippet ?? ""}`;
  const hasKeyVendor = r.companies.some(c => KEY_VENDORS.has(c));
  const hasKeyword = EVENT_KEYWORDS.test(text);

  // Rule: cov>=15 AND score>=8 AND key vendor
  if (coverageTotal >= 15 && maxScore >= 8 && hasKeyVendor) return true;
  // Rule: cov>=15 AND keyword hit
  if (coverageTotal >= 15 && hasKeyword) return true;
  return false;
}

function isAggregateWorthy(cluster: EventCluster): boolean {
  const { representative: r, coverageTotal, maxScore } = cluster;
  const text = `${r.title} ${r.snippet ?? ""}`;
  const hasKeyVendor = r.companies.some(c => KEY_VENDORS.has(c));
  const hasKeyword = EVENT_KEYWORDS.test(text);
  const hasSoftware = SOFTWARE_KEYWORDS.test(text);
  const isCloudCapex = CLOUD_CAPEX_KEYWORDS.test(text);

  // Cloud capex/revenue: raise threshold — needs score>=9 AND cov>=5
  if (isCloudCapex && !hasSoftware) {
    return maxScore >= 9 && coverageTotal >= 5;
  }
  // Software/AI model: lower threshold — score>=6 AND (cov>=2 OR key vendor)
  if (hasSoftware && maxScore >= 6 && (coverageTotal >= 2 || hasKeyVendor)) return true;
  // score>=8 AND (cov>=2 OR key vendor)
  if (maxScore >= 8 && (coverageTotal >= 2 || hasKeyVendor)) return true;
  // cov>=3 AND (keyword OR key vendor)
  if (coverageTotal >= 3 && (hasKeyword || hasKeyVendor)) return true;
  // super hot
  if (coverageTotal >= 5) return true;
  return false;
}

// ─── AI generation ────────────────────────────────────────────────

function buildBulletinPrompt(
  cluster: EventCluster,
  recentBulletinTitles: string[],
): string {
  const r = cluster.representative;
  const eventBlock = `事件: ${r.title}
来源: ${r.source ?? "unknown"} | 覆盖: ${cluster.coverageTotal}源 | 评分: ${cluster.maxScore}/10
公司: ${r.companies.join(", ") || "无"}
摘要: ${(r.snippet ?? "").slice(0, 400)}
相关报道: ${cluster.items.slice(1, 5).map(it => it.title.slice(0, 80)).join("\n  ")}`;

  const dedupBlock = recentBulletinTitles.length > 0
    ? `\n已发布快讯（避免重复）：\n${recentBulletinTitles.map(t => `- ${t}`).join("\n")}\n`
    : "";

  return `你是数通产业和AI基础设施领域的资深分析师。请基于以下单一事件生成一篇产业快讯。

领域范围：数据通信（路由器/交换机/DPU/SmartNIC/防火墙/SD-WAN）+ AI基础设施（GPU/ASIC/数据中心/算力集群/液冷）+ AI芯片 + 云厂商Capex
不包含：光模块、CPO/NPO、光互联、光纤等光通信领域。如事件主要涉及光通信则返回"SKIP"。
目标读者：华为数通产业相关决策者

要求：
1. 标题格式："快讯：XXX"，概括此单一事件（15-30字）
2. 【快讯内容】：此事件的事实信息，包含关键数据（营收/订单量/投资额/技术参数等），150字以内
3. 【内容分析】：此事件对数通产业链的具体影响分析，要有专家判断，不是新闻复制粘贴，150字以内
4. 【应对策略/华为建议】：从战略方向层面给出华为的应对思路，点明该事件对华为意味着什么机会或威胁，以及华为应在哪个方向发力。不需要罗列具体产品型号，聚焦战略判断和竞争卡位。50字以内。
5. 总字数控制在400字以内
6. 分析内容（【内容分析】+【应对策略/华为建议】）占比必须>30%
${dedupBlock}
请直接输出，不要用markdown代码块。格式：
快讯：XXX
【快讯内容】
...
【内容分析】
...
【应对策略/华为建议】
...

${eventBlock}`;
}

function parseBulletinResponse(raw: string): ParsedBulletin | null {
  const titleMatch = raw.match(/快讯[：:]\s*(.+)/);
  const contentMatch = raw.match(/【快讯内容】([\s\S]*?)(?=【内容分析】)/);
  const analysisMatch = raw.match(/【内容分析】([\s\S]*?)(?=【应对策略[/／]华为建议】)/);
  const recMatch = raw.match(/【应对策略[/／]华为建议】([\s\S]*?)$/);

  if (!titleMatch || !contentMatch) return null;

  return {
    title: `快讯：${titleMatch[1].trim()}`,
    content: contentMatch[1].trim(),
    analysis: (analysisMatch?.[1] ?? "").trim(),
    recommendation: (recMatch?.[1] ?? "").trim(),
    sources: [],
  };
}

// ─── Cooldown check ───────────────────────────────────────────────

async function getRecentBulletins(days: number): Promise<{ id: string; title: string; source_news_ids: string[]; created_at: string; bulletin_type: string }[]> {
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const { data } = await supabase.from("news_bulletins")
    .select("id, title, source_news_ids, created_at, bulletin_type")
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  return data ?? [];
}

async function countTodayBulletins(type: string): Promise<number> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count } = await supabase.from("news_bulletins")
    .select("id", { count: "exact", head: true })
    .eq("bulletin_type", type)
    .gte("created_at", todayStart.toISOString());
  return count ?? 0;
}

// ─── Fetch candidate news ─────────────────────────────────────────

async function fetchCandidateNews(days: number): Promise<NewsRow[]> {
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const { data } = await supabase.from("news_items")
    .select("id, title, snippet, source, link, relevance_score, coverage_count, companies, created_at, ai_topics")
    .gte("created_at", since)
    .gte("relevance_score", 6)
    .order("created_at", { ascending: false })
    .limit(500);
  return (data ?? []) as NewsRow[];
}

// ─── Save bulletin ────────────────────────────────────────────────

type ParsedBulletin = { title: string; content: string; analysis: string; recommendation: string; sources: { title: string; link: string }[] };

function bulletinWordCount(p: ParsedBulletin): number {
  return (p.content + p.analysis + p.recommendation).replace(/\s/g, "").length;
}

function formatBulletinMd(p: ParsedBulletin, dateStr: string, type: string): string {
  return [
    `# ${p.title}`,
    "",
    `> 类型: ${type} | 日期: ${dateStr} | 字数: ${bulletinWordCount(p)}`,
    "",
    "## 快讯内容",
    "",
    p.content,
    "",
    "## 内容分析",
    "",
    p.analysis,
    "",
    "## 应对策略/华为建议",
    "",
    p.recommendation,
    "",
    ...(p.sources.length > 0 ? [
      "## 来源",
      "",
      ...p.sources.map(s => `- [${s.title}](${s.link})`),
      "",
    ] : []),
  ].join("\n");
}

function writeAggregateBulletinFile(items: ParsedBulletin[]): string {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const dateStr = new Date().toISOString().slice(0, 10);
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(11, 19);
  const filename = `快讯-${dateStr}-${ts}.md`;
  const filepath = join(OUTPUT_DIR, filename);

  const sections = items.map(p => formatBulletinMd(p, dateStr, "aggregate"));
  writeFileSync(filepath, sections.join("\n---\n\n"), "utf-8");
  console.log(`[bulletin] Written ${items.length} bulletins to ${filepath}`);
  return filepath;
}

function writeUrgentBulletinFile(parsed: ParsedBulletin): string {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const dateStr = new Date().toISOString().slice(0, 10);
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(11, 19);
  const filename = `快讯-${dateStr}-${ts}-紧急.md`;
  const filepath = join(OUTPUT_DIR, filename);

  writeFileSync(filepath, formatBulletinMd(parsed, dateStr, "urgent"), "utf-8");
  console.log(`[bulletin] Written to ${filepath}`);
  return filepath;
}

async function saveBulletinToDB(
  parsed: ParsedBulletin,
  sourceIds: string[],
  type: "aggregate" | "urgent",
): Promise<string | null> {
  const { data, error } = await supabase.from("news_bulletins").insert({
    title: parsed.title,
    content: parsed.content,
    analysis: parsed.analysis,
    recommendation: parsed.recommendation,
    source_news_ids: sourceIds,
    bulletin_type: type,
    word_count: bulletinWordCount(parsed),
  }).select("id");

  if (error) {
    console.error("[bulletin] DB insert failed:", error.message);
    return null;
  }

  return data?.[0]?.id ?? null;
}

// ─── Public API ───────────────────────────────────────────────────

const MAX_BULLETINS_PER_RUN = 5;

async function generateForCluster(
  cluster: EventCluster,
  recentTitles: string[],
): Promise<{ parsed: ParsedBulletin; sourceIds: string[] } | null> {
  const prompt = buildBulletinPrompt(cluster, recentTitles);

  const raw = callClaude(prompt, { timeout: 180_000 });
  if (!raw) { console.error("[bulletin] Claude returned empty"); return null; }

  if (raw.trim() === "SKIP" || raw.includes('"SKIP"')) {
    console.log(`[bulletin] Skipped (out of scope): ${cluster.representative.title.slice(0, 60)}`);
    return null;
  }

  const parsed = parseBulletinResponse(raw);
  if (!parsed) {
    console.error("[bulletin] Failed to parse:", raw.slice(0, 300));
    return null;
  }

  parsed.sources = cluster.items
    .filter(it => it.link)
    .map(it => ({ title: it.title.slice(0, 80), link: it.link! }));

  console.log(`[bulletin] Generated: ${parsed.title}`);
  return { parsed, sourceIds: cluster.items.map(it => it.id) };
}

export async function generateAggregateBulletin(): Promise<{ generated: boolean; count: number; titles: string[] }> {
  console.log("[bulletin] Checking for aggregate bulletins...");

  const news = await fetchCandidateNews(2);
  const inScope = news.filter(n => isInScope(n.title, n.snippet, n.companies));
  console.log(`[bulletin] ${news.length} candidates → ${inScope.length} in scope`);

  if (inScope.length === 0) {
    console.log("[bulletin] No in-scope news, skipping");
    return { generated: false, count: 0, titles: [] };
  }

  const clusters = clusterEvents(inScope);
  const worthy = clusters
    .filter(c => isAggregateWorthy(c))
    .sort((a, b) => (b.maxScore * 10 + b.coverageTotal) - (a.maxScore * 10 + a.coverageTotal));

  console.log(`[bulletin] ${clusters.length} clusters → ${worthy.length} aggregate-worthy`);

  if (worthy.length === 0) {
    console.log("[bulletin] No worthy events, skipping");
    return { generated: false, count: 0, titles: [] };
  }

  const recentBulletins = await getRecentBulletins(7);
  const coveredIds = new Set(recentBulletins.flatMap(b => b.source_news_ids ?? []));
  const uncovered = worthy.filter(c => !c.items.some(it => coveredIds.has(it.id)));

  if (uncovered.length === 0) {
    console.log("[bulletin] All worthy events already covered");
    return { generated: false, count: 0, titles: [] };
  }

  const recentTitles = recentBulletins.map(b => b.title);
  const results: { parsed: ParsedBulletin; sourceIds: string[] }[] = [];

  for (const cluster of uncovered.slice(0, MAX_BULLETINS_PER_RUN)) {
    console.log(`[bulletin] Processing: ${cluster.representative.title.slice(0, 60)} (cov=${cluster.coverageTotal}, score=${cluster.maxScore})`);
    const result = await generateForCluster(cluster, [...recentTitles, ...results.map(r => r.parsed.title)]);
    if (result) {
      const newWords = coreWords(result.parsed.title);
      const dupWithExisting = results.some(r => isDup(newWords, coreWords(r.parsed.title)));
      if (dupWithExisting) {
        console.log(`[bulletin] Dedup skip (similar to existing): ${result.parsed.title.slice(0, 60)}`);
      } else {
        results.push(result);
      }
    }
  }

  if (results.length > 0) {
    writeAggregateBulletinFile(results.map(r => r.parsed));
    for (const r of results) {
      await saveBulletinToDB(r.parsed, r.sourceIds, "aggregate");
    }
  }

  const titles = results.map(r => r.parsed.title);
  console.log(`[bulletin] Generated ${titles.length} bulletins`);
  return { generated: titles.length > 0, count: titles.length, titles };
}

export async function checkUrgentBulletin(): Promise<{ generated: boolean; title: string }> {
  console.log("[bulletin] Checking for urgent events...");

  const todayCount = await countTodayBulletins("urgent");
  if (todayCount >= 1) {
    console.log("[bulletin] Already generated 1 urgent bulletin today, skipping");
    return { generated: false, title: "" };
  }

  const news = await fetchCandidateNews(1);
  const inScope = news.filter(n => isInScope(n.title, n.snippet, n.companies));

  if (inScope.length === 0) {
    console.log("[bulletin] No in-scope news in last 24h");
    return { generated: false, title: "" };
  }

  const clusters = clusterEvents(inScope);
  const urgent = clusters
    .filter(c => isUrgentEvent(c))
    .sort((a, b) => b.coverageTotal - a.coverageTotal);

  if (urgent.length === 0) {
    console.log("[bulletin] No urgent events detected");
    return { generated: false, title: "" };
  }

  const recentBulletins = await getRecentBulletins(3);
  const coveredIds = new Set(recentBulletins.flatMap(b => b.source_news_ids ?? []));
  const uncovered = urgent.filter(c => !c.items.some(it => coveredIds.has(it.id)));

  if (uncovered.length === 0) {
    console.log("[bulletin] Urgent events already covered");
    return { generated: false, title: "" };
  }

  const top = uncovered[0];
  console.log(`[bulletin] Urgent event: ${top.representative.title} (cov=${top.coverageTotal}, score=${top.maxScore})`);

  const result = await generateForCluster(top, recentBulletins.map(b => b.title));
  if (!result) return { generated: false, title: "" };

  writeUrgentBulletinFile(result.parsed);
  await saveBulletinToDB(result.parsed, result.sourceIds, "urgent");

  return { generated: true, title: result.parsed.title };
}

export async function generateFallbackBulletin(): Promise<{ generated: boolean; title: string }> {
  const recent = await getRecentBulletins(14);
  if (recent.length > 0) {
    console.log(`[bulletin] ${recent.length} bulletins in last 14 days, no fallback needed`);
    return { generated: false, title: "" };
  }

  console.log("[bulletin] No bulletins in 14 days, generating fallback...");

  const news = await fetchCandidateNews(7);
  const inScope = news.filter(n => isInScope(n.title, n.snippet, n.companies));

  if (inScope.length === 0) return { generated: false, title: "" };

  const clusters = clusterEvents(inScope);
  const top = clusters
    .sort((a, b) => (b.maxScore * 10 + b.coverageTotal) - (a.maxScore * 10 + a.coverageTotal))[0];

  if (!top) return { generated: false, title: "" };

  const result = await generateForCluster(top, []);
  if (!result) return { generated: false, title: "" };

  writeAggregateBulletinFile([result.parsed]);
  await saveBulletinToDB(result.parsed, result.sourceIds, "aggregate");

  return { generated: true, title: result.parsed.title };
}
