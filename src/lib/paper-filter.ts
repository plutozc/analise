import { TECH_KEYWORDS } from "./tech-keywords.js";

const KEYWORD_REGEXPS = TECH_KEYWORDS.map((k) => new RegExp(k.keyword, "i"));

const INFRA_PATTERNS = [
  /network/i, /routing/i, /switch/i, /router/i, /firewall/i,
  /packet/i, /bandwidth/i, /latency/i, /throughput/i,
  /data\s*center/i, /cloud/i, /infra/i,
  /distributed\s+(system|comput|train|inference)/i, /cluster/i, /replica/i,
  /gpu\s+(network|cluster|communicat|interconnect)/i, /offload/i,
  /protocol/i, /ethernet/i, /tcp/i, /udp/i,
  /wireless/i, /cellular/i, /spectrum/i, /antenna/i,
  /iot\b/i, /sensor\s+network/i,
  /container/i, /microservice/i, /orchestrat/i, /kubernetes/i,
  /telemetry/i, /observab/i,
  /cyber/i, /intrusion/i, /ddos/i, /dos\s+attack/i,
  /dns\b/i, /bgp\b/i, /vpn\b/i, /ipsec/i,
  /optical/i, /fiber/i, /dwdm/i,
  /satellite/i, /leo\b/i,
  /5g\b/i, /6g\b/i, /lte\b/i, /ran\b/i,
  /ebpf/i, /xdp\b/i, /dpdk/i, /smartnic/i, /dpu\b/i,
  /sdn\b/i, /nfv\b/i, /p4\b/i,
  /hpc\b/i, /infiniband/i, /rdma\b/i, /roce\b/i,
  /serverless/i, /edge\s+comput/i, /mec\b/i,
  /congestion/i, /qos\b/i, /load\s+balanc/i,
];

const ML_PATTERNS = [
  /deep\s+learning/i, /neural\s+network/i, /machine\s+learning/i,
  /reinforcement\s+learning/i, /transformer/i, /attention/i,
  /llm/i, /large\s+language/i, /foundation\s+model/i,
  /diffusion\s+model/i, /generative/i, /gan\b/i, /vae\b/i,
  /fine.tun/i, /pre.train/i, /few.shot/i, /zero.shot/i,
  /graph\s+neural/i, /gnn\b/i,
];

export type PaperPriority = "high" | "medium" | "low";

export interface ScoredPaper<T> {
  item: T;
  priority: PaperPriority;
}

export function scorePaper(title: string, abstract: string | null): PaperPriority {
  const text = `${title} ${abstract ?? ""}`;

  let techHits = 0;
  for (const re of KEYWORD_REGEXPS) {
    if (re.test(text)) techHits++;
  }

  const hasInfra = INFRA_PATTERNS.some((re) => re.test(text));
  const hasML = ML_PATTERNS.some((re) => re.test(text));

  // High: specific tech keyword match or infra + ML crossover
  if (techHits >= 2) return "high";
  if (techHits >= 1 && hasInfra) return "high";
  if (hasInfra && hasML) return "high";

  // Medium: infra only or single tech keyword
  if (hasInfra) return "medium";
  if (techHits >= 1) return "medium";

  // Low: ML only or no match — still keep, process later
  return "low";
}

export function splitByPriority<T extends { title: string; abstract: string | null }>(
  items: T[],
): { high: T[]; medium: T[]; low: T[] } {
  const high: T[] = [];
  const medium: T[] = [];
  const low: T[] = [];

  for (const item of items) {
    const p = scorePaper(item.title, item.abstract);
    if (p === "high") high.push(item);
    else if (p === "medium") medium.push(item);
    else low.push(item);
  }

  return { high, medium, low };
}
