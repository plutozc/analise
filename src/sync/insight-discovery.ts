import { supabase } from "../lib/supabase.js";
import { callClaude } from "../lib/claude.js";
import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "..", "insights");

const NETWORK_KEYWORDS = [
  "O-RAN", "AI-RAN", "RIC", "xApp", "rApp", "RAN", "5G", "6G",
  "CSI", "channel prediction", "network automation", "network configuration",
  "network topology", "intent-based", "digital twin", "telemetry",
  "routing", "traffic engineering", "network slicing", "optical network",
  "T-API", "NETCONF", "YANG", "OpenConfig", "SRv6", "QoT",
  "RDMA", "RoCE", "collective communication", "DPU", "SmartNIC",
  "data center network", "BGP", "SDN", "NFV", "eBPF", "XDP",
  "QUIC", "transport protocol", "congestion control",
];

const AI_KEYWORDS = [
  "LLM", "SLM", "agent", "agentic", "reinforcement learning",
  "Bayesian optimization", "GNN", "foundation model", "contrastive learning",
  "anomaly diagnosis", "formal verification", "closed-loop",
  "transformer", "neural network", "deep learning", "federated learning",
];

const EUROPE_KEYWORDS = [
  "ETH Zurich", "EPFL", "TU Munich", "TU Berlin", "KTH", "Aalto",
  "Politecnico", "UCL", "Cambridge", "Oxford", "Imperial College",
  "Telefonica", "Deutsche Telekom", "Orange", "Vodafone", "Swisscom",
  "Telia", "Telenor", "BT", "Nokia", "Ericsson",
  "ETSI", "3GPP", "TM Forum", "EU", "Horizon", "SNS JU",
  "France", "Germany", "Sweden", "Finland", "Switzerland", "Netherlands",
  "Spain", "Italy", "UK", "Denmark", "Norway", "Belgium",
];

type CandidatePaper = {
  id: string; title: string; abstract: string | null;
  authors: string[]; venue: string | null; url: string | null;
  relevance_score: number | null; companies: string[];
  created_at: string;
};

type CandidateNews = {
  id: string; title: string; snippet: string | null;
  source: string | null; link: string | null;
  relevance_score: number | null; companies: string[];
  created_at: string;
};

function hasKeywordMatch(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter(k => lower.includes(k.toLowerCase()));
}

function scoreCandidate(title: string, abstract: string | null): {
  networkHits: string[]; aiHits: string[]; europeHits: string[];
  isNetworkAI: boolean; score: number;
} {
  const text = `${title} ${abstract ?? ""}`;
  const networkHits = hasKeywordMatch(text, NETWORK_KEYWORDS);
  const aiHits = hasKeywordMatch(text, AI_KEYWORDS);
  const europeHits = hasKeywordMatch(text, EUROPE_KEYWORDS);
  const isNetworkAI = networkHits.length > 0 && aiHits.length > 0;

  let score = 0;
  if (isNetworkAI) score += 5;
  else if (networkHits.length > 0) score += 2;
  else if (aiHits.length > 0) score += 1;
  if (europeHits.length > 0) score += 3;
  score += Math.min(networkHits.length, 3);
  score += Math.min(aiHits.length, 2);

  return { networkHits, aiHits, europeHits, isNetworkAI, score };
}

async function fetchRecentPapers(days = 7): Promise<CandidatePaper[]> {
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const { data } = await supabase
    .from("papers")
    .select("id, title, abstract, authors, venue, url, relevance_score, companies, created_at")
    .gte("created_at", since)
    .order("relevance_score", { ascending: false })
    .limit(200);
  return (data ?? []) as CandidatePaper[];
}

async function fetchRecentNews(days = 7): Promise<CandidateNews[]> {
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const { data } = await supabase
    .from("news_items")
    .select("id, title, snippet, source, link, relevance_score, companies, created_at")
    .gte("created_at", since)
    .order("relevance_score", { ascending: false })
    .limit(100);
  return (data ?? []) as CandidateNews[];
}

type ScoredItem = {
  type: "paper" | "news";
  id: string;
  title: string;
  abstract: string | null;
  url: string | null;
  source: string | null;
  venue: string | null;
  companies: string[];
  relevance: number;
  networkHits: string[];
  aiHits: string[];
  europeHits: string[];
  isNetworkAI: boolean;
  score: number;
};

function buildDiscoveryPrompt(candidates: ScoredItem[]): string {
  const items = candidates.slice(0, 30).map((c, i) => ({
    idx: i + 1,
    type: c.type,
    title: c.title,
    abstract: c.abstract?.slice(0, 300),
    venue: c.venue,
    source: c.source,
    url: c.url,
    companies: c.companies,
    networkKeywords: c.networkHits,
    aiKeywords: c.aiHits,
    europeKeywords: c.europeHits,
    isNetworkAI: c.isNetworkAI,
    relevance: c.relevance,
  }));

  return `你是华为研究所的技术情报分析员。基于以下最近一周的论文和新闻数据，发掘 3-5 个可以撰写技术洞察文章的方向。

研究范围：面向欧洲的网络 AI 技术发展。优先选择同时涉及"网络系统/协议/基础设施"和"AI 方法"的交叉方向。

评估维度：
1. 技术新颖度：是否有新架构/新实验/新数据？
2. Network AI 相关性：必须同时包含明确的网络对象和 AI 方法
3. 欧洲连接：作者、机构、资助、标准化是否涉及欧洲？
4. 技术深度：是否有量化指标或具体技术设计？
5. 与华为研究方向关联：NCE、网络数字地图、自动驾驶网络、光网络控制、网络大模型等

高优先方向：网络控制闭环、RAN 智能控制、CSI/PHY AI、网络数字孪生、AI 集群网络、分布式推理
降权方向：纯通用 AI、应用层聊天机器人、纯政策/投资信息、无网络机制的云基础设施
剔除：neural network/social network/quantum network 等非通信网络

输出格式（JSON）：
{
  "directions": [
    {
      "title": "具体的技术方向标题（20-25字中文）",
      "summary": "150字以内技术概要",
      "evidence": ["引用的论文/新闻编号和标题"],
      "network_object": "涉及的网络对象",
      "ai_method": "涉及的 AI 方法",
      "europe_connection": "欧洲连接点（机构/标准/运营商/项目），无则写'无直接连接'",
      "huawei_relevance": "与华为研究方向的技术关联",
      "confidence": "high/medium/low",
      "priority": 1-5
    }
  ],
  "dropped": ["被剔除的候选及原因（简述）"]
}

候选数据：
${JSON.stringify(items, null, 2)}`;
}

export async function discoverInsightDirections(): Promise<{ directions: number; outputPath: string }> {
  console.log("[insight-discovery] Fetching recent papers and news...");

  const [papers, news] = await Promise.all([
    fetchRecentPapers(7),
    fetchRecentNews(7),
  ]);

  console.log(`[insight-discovery] ${papers.length} papers, ${news.length} news in last 7 days`);

  const scored: ScoredItem[] = [];

  for (const p of papers) {
    const s = scoreCandidate(p.title, p.abstract);
    if (s.score >= 2) {
      scored.push({
        type: "paper", id: p.id, title: p.title,
        abstract: p.abstract, url: p.url, source: null,
        venue: p.venue, companies: p.companies,
        relevance: p.relevance_score ?? 0, ...s,
      });
    }
  }

  for (const n of news) {
    const s = scoreCandidate(n.title, n.snippet);
    if (s.score >= 2) {
      scored.push({
        type: "news", id: n.id, title: n.title,
        abstract: n.snippet, url: n.link, source: n.source,
        venue: null, companies: n.companies,
        relevance: n.relevance_score ?? 0, ...s,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  console.log(`[insight-discovery] ${scored.length} candidates scored (threshold >= 2)`);

  if (scored.length === 0) {
    console.log("[insight-discovery] No candidates found, skipping AI analysis");
    return { directions: 0, outputPath: "" };
  }

  const prompt = buildDiscoveryPrompt(scored);
  console.log("[insight-discovery] Calling Claude for direction analysis...");
  const result = callClaude(prompt, { timeout: 180_000 });

  if (!result) {
    console.error("[insight-discovery] Claude returned empty result");
    return { directions: 0, outputPath: "" };
  }

  // Parse JSON from Claude response
  let parsed: any = null;
  try {
    const jsonMatch = result.match(/\{[\s\S]*"directions"[\s\S]*\}/);
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
  } catch { /* fall through */ }

  const dateStr = new Date().toISOString().slice(0, 10);
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const filename = `directions-${dateStr}.md`;
  const filepath = join(OUTPUT_DIR, filename);

  const lines: string[] = [];
  lines.push(`# 技术洞察方向发掘 — ${dateStr}`);
  lines.push("");
  lines.push(`数据范围：最近 7 天 | 论文 ${papers.length} 篇 | 新闻 ${news.length} 条 | 候选 ${scored.length} 条`);
  lines.push("");
  lines.push("---");
  lines.push("");

  if (parsed?.directions?.length) {
    for (const d of parsed.directions) {
      const priorityTag = d.priority <= 2 ? "🔴" : d.priority <= 3 ? "🟡" : "⚪";
      lines.push(`## ${priorityTag} ${d.title}`);
      lines.push("");
      lines.push(`**优先级:** ${d.priority}/5 | **置信度:** ${d.confidence}`);
      lines.push("");
      lines.push(d.summary);
      lines.push("");
      lines.push(`- **网络对象:** ${d.network_object}`);
      lines.push(`- **AI 方法:** ${d.ai_method}`);
      lines.push(`- **欧洲连接:** ${d.europe_connection}`);
      lines.push(`- **华为关联:** ${d.huawei_relevance}`);
      lines.push("");
      if (d.evidence?.length) {
        lines.push("**支撑证据:**");
        for (const e of d.evidence) lines.push(`- ${e}`);
        lines.push("");
      }
      lines.push("---");
      lines.push("");
    }
  } else {
    lines.push("## Claude 原始输出");
    lines.push("");
    lines.push(result);
    lines.push("");
  }

  if (parsed?.dropped?.length) {
    lines.push("## 剔除方向");
    lines.push("");
    for (const d of parsed.dropped) lines.push(`- ${d}`);
    lines.push("");
  }

  lines.push("## 候选数据摘要（Top 15）");
  lines.push("");
  lines.push("| # | 类型 | 标题 | Network AI | 分数 |");
  lines.push("|---|------|------|-----------|------|");
  for (const c of scored.slice(0, 15)) {
    const nai = c.isNetworkAI ? "✅" : "❌";
    const shortTitle = c.title.length > 50 ? c.title.slice(0, 47) + "..." : c.title;
    lines.push(`| ${c.type} | ${c.venue ?? c.source ?? "-"} | ${shortTitle} | ${nai} | ${c.score} |`);
  }
  lines.push("");

  writeFileSync(filepath, lines.join("\n"), "utf-8");
  console.log(`[insight-discovery] Written to ${filepath}`);

  const dirCount = parsed?.directions?.length ?? 0;
  return { directions: dirCount, outputPath: filepath };
}
