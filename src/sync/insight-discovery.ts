import { supabase } from "../lib/supabase.js";
import { callClaude } from "../lib/claude.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "..", "insights");
const HISTORY_PATH = join(OUTPUT_DIR, "history.json");
const HISTORY_RETENTION_DAYS = 30;

type HistoryEntry = {
  date: string;
  title: string;
  keywords: string[];
  evidence_titles: string[];
};

function loadHistory(): HistoryEntry[] {
  if (!existsSync(HISTORY_PATH)) return [];
  try {
    const raw = JSON.parse(readFileSync(HISTORY_PATH, "utf-8"));
    const cutoff = new Date(Date.now() - HISTORY_RETENTION_DAYS * 86400_000).toISOString().slice(0, 10);
    return (raw as HistoryEntry[]).filter(h => h.date >= cutoff);
  } catch { return []; }
}

function saveHistory(history: HistoryEntry[]): void {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), "utf-8");
}

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

const SOFTWARE_KEYWORDS = [
  // Network software
  "SDN controller", "network OS", "SONiC", "VRP", "ONOS", "OpenDaylight",
  "network orchestration", "service mesh", "CNI", "Cilium", "Calico",
  // System software
  "eBPF", "XDP", "DPDK", "kernel", "P4", "programmable switch",
  "container network", "Kubernetes", "cloud native", "microservice",
  // AI engineering
  "MLOps", "model serving", "inference framework", "vLLM", "TensorRT",
  "AI agent framework", "LLM serving", "model deployment", "ONNX",
  "distributed training", "pipeline parallel", "tensor parallel",
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
  networkHits: string[]; aiHits: string[]; softwareHits: string[]; europeHits: string[];
  isNetworkAI: boolean; score: number;
} {
  const text = `${title} ${abstract ?? ""}`;
  const networkHits = hasKeywordMatch(text, NETWORK_KEYWORDS);
  const aiHits = hasKeywordMatch(text, AI_KEYWORDS);
  const softwareHits = hasKeywordMatch(text, SOFTWARE_KEYWORDS);
  const europeHits = hasKeywordMatch(text, EUROPE_KEYWORDS);
  const isNetworkAI = networkHits.length > 0 && aiHits.length > 0;

  let score = 0;
  if (isNetworkAI) score += 5;
  else if (networkHits.length > 0) score += 2;
  else if (aiHits.length > 0) score += 1;
  if (europeHits.length > 0) score += 3;
  if (softwareHits.length > 0) score += 3;
  if (networkHits.length > 0 && softwareHits.length > 0) score += 2;
  score += Math.min(networkHits.length, 3);
  score += Math.min(aiHits.length, 2);
  score += Math.min(softwareHits.length, 2);

  return { networkHits, aiHits, softwareHits, europeHits, isNetworkAI, score };
}

async function fetchRecentPapers(days = 14): Promise<CandidatePaper[]> {
  const sinceDate = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const sinceTs = new Date(Date.now() - days * 86400_000).toISOString();
  const fields = "id, title, abstract, authors, venue, url, relevance_score, companies, created_at";

  const [byPublished, byCreated] = await Promise.all([
    supabase.from("papers").select(fields)
      .gte("published_date", sinceDate)
      .order("relevance_score", { ascending: false }).limit(200),
    supabase.from("papers").select(fields)
      .gte("created_at", sinceTs)
      .order("relevance_score", { ascending: false }).limit(200),
  ]);

  const seen = new Set<string>();
  const result: CandidatePaper[] = [];
  for (const p of [...(byPublished.data ?? []), ...(byCreated.data ?? [])]) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    result.push(p as CandidatePaper);
  }
  result.sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0));
  return result.slice(0, 300);
}

async function fetchRecentNews(days = 14): Promise<CandidateNews[]> {
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
  softwareHits: string[];
  europeHits: string[];
  isNetworkAI: boolean;
  score: number;
};

function buildDiscoveryPrompt(candidates: ScoredItem[], history: HistoryEntry[]): string {
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
    softwareKeywords: c.softwareHits,
    europeKeywords: c.europeHits,
    isNetworkAI: c.isNetworkAI,
    relevance: c.relevance,
  }));

  return `你是华为研究所的技术情报分析员。基于以下最近两周的论文和新闻数据，发掘 3-5 个可以撰写技术洞察文章的方向。

研究范围：面向欧洲的网络 AI 技术发展与网络软件创新。优先选择以下交叉方向：
- "网络系统/协议/基础设施" × "AI 方法"
- "网络系统" × "软件工程/系统软件"
- "AI 工程软件" × "网络部署"

评估维度：
1. 技术新颖度：是否有新架构/新实验/新数据？
2. Network AI 相关性：同时包含明确的网络对象和 AI 方法（高权重）
3. 网络软件相关性：涉及网络OS、SDN控制器、eBPF/XDP数据面、可编程交换、云原生网络、服务网格、网络编排（高权重）
4. AI 工程软件相关性：涉及模型服务/部署、推理框架、分布式训练、MLOps、AI Agent 框架（中权重）
5. 欧洲连接：作者、机构、资助、标准化是否涉及欧洲？
6. 技术深度：是否有量化指标或具体技术设计？
7. 与华为研究方向关联：NCE、网络数字地图、自动驾驶网络、光网络控制、网络大模型、CloudEngine、iMaster NCE等

高优先方向：网络控制闭环、RAN 智能控制、CSI/PHY AI、网络数字孪生、AI 集群网络、分布式推理、网络可编程数据面（eBPF/P4）、云原生网络（CNI/服务网格）、网络OS演进（SONiC）、AI推理服务架构
降权方向：纯通用 AI、应用层聊天机器人、纯政策/投资信息、无网络机制的云基础设施
剔除：neural network/social network/quantum network 等非通信网络

请直接输出纯 JSON，不要用 markdown 代码块包裹，不要在 JSON 前后添加任何说明文字。JSON 字符串值中不要使用双引号（"），用单引号或书名号替代。

输出格式（JSON）：
{
  "directions": [
    {
      "title": "具体的技术方向标题（20-25字中文）",
      "summary": "150字以内技术概要",
      "evidence": ["Paper 1: 论文标题", "News 5: 新闻标题"],
      "network_object": "涉及的网络对象",
      "ai_method": "涉及的 AI 方法，无则写'无'",
      "software_stack": "涉及的软件技术栈（网络OS/控制器/数据面/云原生/推理框架等），无则写'无'",
      "europe_connection": "欧洲连接点（机构/标准/运营商/项目），无则写'无直接连接'",
      "huawei_relevance": "与华为研究方向的技术关联",
      "confidence": "high/medium/low",
      "priority": 1-5,
      "is_update": false,
      "update_reason": "仅当 is_update=true 时填写：相比上次推荐新增了什么证据"
    }
  ],
  "dropped": ["被剔除的候选及原因（简述）"]
}

${history.length > 0 ? `去重要求：以下方向已在近期推荐过，请跳过这些方向，除非本周有重要的新论文/新实验/新标准进展（不是同一批论文的不同组合）。如果某个已推荐方向确实有显著新证据，可以再次推荐，将 is_update 设为 true 并填写 update_reason。

已推荐方向：
${history.map(h => `- [${h.date}] ${h.title}（关键词: ${h.keywords.join(", ")}）`).join("\n")}

` : ""}候选数据：
${JSON.stringify(items, null, 2)}`;
}

function str(v: any, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function resolveEvidenceLink(e: string, urlMap: Map<number, string | null>): string {
  const nums: number[] = [];
  const patterns = [
    /^#?(Paper|News)?\s*(\d+)\s*[/／]\s*#?(\d+)/i,
    /^#?(?:Paper|News)?\s*(\d+)[.:\s]/i,
  ];
  for (const pat of patterns) {
    const m = e.match(pat);
    if (m) {
      if (m[3]) { nums.push(parseInt(m[2], 10), parseInt(m[3], 10)); }
      else { nums.push(parseInt(m[1] ?? m[2], 10)); }
      break;
    }
  }
  if (nums.length > 0) {
    const url = urlMap.get(nums[0]);
    if (url) {
      const titlePart = e.replace(/^[#]?\s*(?:Paper|News)?\s*\d+(?:\s*[/／]\s*#?\d+)?\s*[.:]\s*/i, "").replace(/^["""]|["""]$/g, "").trim();
      return `[${titlePart || e}](${url})`;
    }
  }
  return e;
}

function renderDirectionsMarkdown(
  parsed: any, rawResult: string, dateStr: string,
  paperCount: number, newsCount: number, candidateCount: number,
  evidenceUrlMap: Map<number, string | null>, scored: ScoredItem[],
): string[] {
  const lines: string[] = [];
  lines.push(`# 技术洞察方向发掘 — ${dateStr}`);
  lines.push("");
  lines.push(`数据范围：最近 14 天 | 论文 ${paperCount} 篇 | 新闻 ${newsCount} 条 | 候选 ${candidateCount} 条`);
  lines.push("", "---", "");

  if (parsed?.directions?.length) {
    for (const d of parsed.directions) {
      const priority = typeof d.priority === "number" ? d.priority : 3;
      const priorityTag = priority <= 2 ? "\u{1F534}" : priority <= 3 ? "\u{1F7E1}" : "⚪";
      const updateTag = d.is_update ? " \u{1F504}" : "";
      lines.push(`## ${priorityTag}${updateTag} ${str(d.title, "Untitled")}`);
      lines.push("");
      const meta = [`**优先级:** ${priority}/5`, `**置信度:** ${str(d.confidence, "medium")}`];
      if (d.is_update) meta.push("**更新**");
      lines.push(meta.join(" | "), "");
      lines.push(str(d.summary, "No summary"), "");
      lines.push(`- **网络对象:** ${str(d.network_object, "N/A")}`);
      lines.push(`- **AI 方法:** ${str(d.ai_method, "无")}`);
      if (d.software_stack && d.software_stack !== "无") {
        lines.push(`- **软件技术栈:** ${str(d.software_stack)}`);
      }
      lines.push(`- **欧洲连接:** ${str(d.europe_connection, "无直接连接")}`);
      lines.push(`- **华为关联:** ${str(d.huawei_relevance, "N/A")}`);
      if (d.is_update && d.update_reason) {
        lines.push(`- **\u{1F504} 更新原因:** ${str(d.update_reason)}`);
      }
      lines.push("");
      if (Array.isArray(d.evidence) && d.evidence.length > 0) {
        lines.push("**支撑证据:**");
        for (const e of d.evidence) {
          lines.push(`- ${resolveEvidenceLink(String(e), evidenceUrlMap)}`);
        }
        lines.push("");
      }
      lines.push("---", "");
    }
  } else {
    lines.push("## Claude 原始输出", "", rawResult, "");
  }

  if (parsed?.dropped?.length) {
    lines.push("## 剔除方向", "");
    for (const d of parsed.dropped) lines.push(`- ${d}`);
    lines.push("");
  }

  lines.push("## 候选数据摘要（Top 15）", "");
  lines.push("| # | 类型 | 标题 | Network AI | 分数 |");
  lines.push("|---|------|------|-----------|------|");
  for (const c of scored.slice(0, 15)) {
    const nai = c.isNetworkAI ? "✅" : "❌";
    const shortTitle = c.title.length > 50 ? c.title.slice(0, 47) + "..." : c.title;
    lines.push(`| ${c.type} | ${c.venue ?? c.source ?? "-"} | ${shortTitle} | ${nai} | ${c.score} |`);
  }
  lines.push("");

  return lines;
}

export async function discoverInsightDirections(): Promise<{ directions: number; outputPath: string }> {
  console.log("[insight-discovery] Fetching recent papers and news...");

  const [papers, news] = await Promise.all([
    fetchRecentPapers(),
    fetchRecentNews(),
  ]);

  console.log(`[insight-discovery] ${papers.length} papers, ${news.length} news in last 14 days`);

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

  const history = loadHistory();
  console.log(`[insight-discovery] ${history.length} past directions in history (${HISTORY_RETENTION_DAYS}d window)`);

  const prompt = buildDiscoveryPrompt(scored, history);
  console.log("[insight-discovery] Calling Claude for direction analysis...");
  const result = callClaude(prompt, { timeout: 300_000 });

  if (!result) {
    console.error("[insight-discovery] Claude returned empty result");
    return { directions: 0, outputPath: "" };
  }

  // Parse JSON from Claude response — handle code fences and trailing text
  let parsed: any = null;
  try {
    let json = result;
    const fenceMatch = result.match(/```(?:json)?\s*\n([\s\S]*?)```/);
    if (fenceMatch) json = fenceMatch[1];
    // Replace smart quotes with plain equivalents before extracting JSON
    json = json.replace(/[\u201c\u201d]/g, "'").replace(/[\u2018\u2019]/g, "'");
    const braceStart = json.indexOf("{");
    if (braceStart >= 0) {
      let depth = 0;
      let end = -1;
      for (let i = braceStart; i < json.length; i++) {
        if (json[i] === "{") depth++;
        else if (json[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
      }
      if (end > 0) {
        let raw = json.slice(braceStart, end + 1);
        try {
          parsed = JSON.parse(raw);
        } catch {
          // Fallback: fix unescaped quotes in string values line by line
          const fixed = raw.split("\n").map(line => {
            const m = line.match(/^(\s*"[^"]+"\s*:\s*")(.+)("\s*,?\s*)$/);
            if (!m) return line;
            return m[1] + m[2].replace(/"/g, "'") + m[3];
          }).join("\n");
          parsed = JSON.parse(fixed);
        }
      }
    }
  } catch (e) {
    console.warn("[insight-discovery] JSON parse failed:", e instanceof Error ? e.message : e);
  }

  // Build idx→url lookup for the 30 items sent to Claude
  const itemsForClaude = scored.slice(0, 30);
  const evidenceUrlMap = new Map<number, string | null>();
  for (let i = 0; i < itemsForClaude.length; i++) {
    evidenceUrlMap.set(i + 1, itemsForClaude[i].url);
  }

  // Balanced digest: max 2 directions per network_object category
  if (parsed?.directions?.length) {
    const MAX_PER_CATEGORY = 2;
    const categoryCounts = new Map<string, number>();
    const balanced: any[] = [];
    for (const d of parsed.directions) {
      const cat = (d.network_object ?? "other").split(/[,、，]/)[0].trim().slice(0, 20);
      const count = categoryCounts.get(cat) ?? 0;
      if (count < MAX_PER_CATEGORY) {
        balanced.push(d);
        categoryCounts.set(cat, count + 1);
      } else {
        console.log(`[insight-discovery] Balanced digest: dropped "${d.title}" (category "${cat}" already has ${MAX_PER_CATEGORY})`);
        if (!parsed.dropped) parsed.dropped = [];
        parsed.dropped.push(`${d.title}: 同类方向已达${MAX_PER_CATEGORY}个上限`);
      }
    }
    parsed.directions = balanced;
  }

  // Save new directions to history for dedup
  if (parsed?.directions?.length) {
    const dateStr = new Date().toISOString().slice(0, 10);
    const newEntries: HistoryEntry[] = parsed.directions.map((d: any) => ({
      date: dateStr,
      title: d.title,
      keywords: [
        ...(d.network_object ?? "").split(/[,、，]/).map((s: string) => s.trim()).filter(Boolean),
        ...(d.ai_method ?? "").split(/[,、，]/).map((s: string) => s.trim()).filter(Boolean),
      ].slice(0, 10),
      evidence_titles: (d.evidence ?? []).map((e: string) =>
        e.replace(/^[#]?\s*(?:Paper|News)?\s*\d+(?:\s*[/／]\s*#?\d+)?\s*[.:]\s*/i, "").trim()
      ),
    }));
    saveHistory([...history, ...newEntries]);
    console.log(`[insight-discovery] Saved ${newEntries.length} directions to history`);
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const filename = `directions-${dateStr}.md`;
  const filepath = join(OUTPUT_DIR, filename);

  const lines: string[] = renderDirectionsMarkdown(
    parsed, result, dateStr, papers.length, news.length, scored.length, evidenceUrlMap, scored,
  );

  writeFileSync(filepath, lines.join("\n"), "utf-8");
  console.log(`[insight-discovery] Written to ${filepath}`);

  const dirCount = parsed?.directions?.length ?? 0;
  return { directions: dirCount, outputPath: filepath };
}
