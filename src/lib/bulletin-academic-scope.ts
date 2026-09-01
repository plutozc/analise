export type AcademicBulletinInput = {
  title: string;
  text: string;
  source: string | null;
  topics: string[];
  venue: string | null;
};

const ACADEMIC_ORGANIZATION = /\b(university|college|institute|research\s+(?:lab|center|centre)|csail|cnrs|max\s*planck)\b|大学|高校|学院|研究院|实验室|科研团队/i;
const ACADEMIC_SOURCE = /\b(arxiv|semantic\s*scholar|academic\s*paper|research\s*paper)\b/i;
const ACADEMIC_VENUES = new Set([
  "SIGCOMM", "NSDI", "IMC", "OSDI", "SOSP", "CoNEXT", "INFOCOM", "ICNP", "HOTNETS",
  "MOBICOM", "SIGMETRICS", "EuroSys", "ASPLOS", "CCS", "S&P", "USENIX Security", "ATC",
  "FAST", "PPoPP", "ISCA", "MICRO", "HPCA", "APNet", "ANCS", "PAM", "TMA", "Middleware",
  "SenSys", "MobiSys",
]);
const ACADEMIC_TECH = /network|routing|switch|data\s*center|cloud|distributed|protocol|rdma|roce|gpu|ai\s*(?:infra|training|inference)|machine\s*learning|large\s*language|llm|5g|6g|ran|security|privacy|systems?|网络|路由|交换|数据中心|云计算|分布式|协议|算力|人工智能|大模型|机器学习|安全|隐私|通信/i;

/**
 * Academic events qualify only when they are traceably related to the
 * worker's networking, cloud, AI-infrastructure, systems, or security scope.
 */
export function isAcademicBulletinCandidate(input: AcademicBulletinInput): boolean {
  const text = `${input.title} ${input.text} ${input.source ?? ""}`;
  const hasAcademicSignal =
    ACADEMIC_ORGANIZATION.test(text) ||
    ACADEMIC_SOURCE.test(input.source ?? "") ||
    (input.venue !== null && ACADEMIC_VENUES.has(input.venue));
  const hasTrackedTopic = input.topics.length > 0;
  return hasAcademicSignal && (hasTrackedTopic || ACADEMIC_TECH.test(text));
}
