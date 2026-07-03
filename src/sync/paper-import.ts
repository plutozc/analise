import { inferCompanies } from "../lib/companies.js";
import { supabase } from "../lib/supabase.js";
import type { ImportedPaper, CategoryStat } from "../types/index.js";

type VenueRule = [RegExp, string];
const VENUE_RULES: VenueRule[] = [
  [/SIGCOMM/i,       "SIGCOMM"],
  [/NSDI/i,          "NSDI"],
  [/IMC\b/i,         "IMC"],
  [/OSDI/i,          "OSDI"],
  [/SOSP/i,          "SOSP"],
  [/CoNEXT/i,        "CoNEXT"],
  [/INFOCOM/i,       "INFOCOM"],
  [/ICNP/i,          "ICNP"],
  [/HOTNETS|HotNets|Hotnets/i, "HOTNETS"],
  [/MOBICOM|MobiCom/i, "MOBICOM"],
  [/SIGMETRICS/i,    "SIGMETRICS"],
  [/EuroSys/i,       "EuroSys"],
  [/ASPLOS/i,        "ASPLOS"],
  [/CCS\b/i,         "CCS"],
  [/S&P|SP\b/i,      "S&P"],
  [/USENIX.*Security|Security.*USENIX/i, "USENIX Security"],
  [/\bATC\b/i,       "ATC"],
  [/\bFAST\b/i,      "FAST"],
  [/PPoPP/i,         "PPoPP"],
  [/\bISCA\b/i,      "ISCA"],
  [/\bMICRO\b/i,     "MICRO"],
  [/\bHPCA\b/i,      "HPCA"],
  [/APNet/i,         "APNet"],
  [/\bANCS\b/i,      "ANCS"],
  [/\bPAM\b/i,       "PAM"],
  [/\bTMA\b/i,       "TMA"],
  [/Middleware/i,    "Middleware"],
  [/SenSys/i,        "SenSys"],
  [/MobiSys/i,       "MobiSys"],
];

function journalRefToVenue(journalRef: string | null): string {
  if (!journalRef) return "arXiv";
  for (const [re, name] of VENUE_RULES) {
    if (re.test(journalRef)) return name;
  }
  return "arXiv";
}

export type InsertedPaper = { id: string; title: string; abstract: string | null; companies: string[] };

// ── arXiv ──

function parseArxivXml(xml: string): ImportedPaper[] {
  const papers: ImportedPaper[] = [];
  const entries = xml.split("<entry>").slice(1);
  for (const entry of entries) {
    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/\s+/g, " ").trim();
    if (!title) continue;
    const authors: string[] = [];
    for (const m of entry.matchAll(/<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g)) {
      authors.push(m[1].trim());
    }
    const url = entry.match(/<id>(.*?)<\/id>/)?.[1]?.trim() ?? null;
    const published = entry.match(/<published>(.*?)<\/published>/)?.[1]?.trim() ?? null;
    const abstract = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.replace(/\s+/g, " ").trim() ?? null;
    const categories: string[] = [];
    for (const m of entry.matchAll(/category term="([^"]+)"/g)) categories.push(m[1]);

    // Extract journal_ref (which conference published this paper)
    const journalRef = entry.match(/<arxiv:journal_ref>([\s\S]*?)<\/arxiv:journal_ref>/)?.[1]?.trim() ?? null;
    const venue = journalRefToVenue(journalRef);

    papers.push({
      title,
      authors,
      venue,
      url,
      published_date: published ? published.slice(0, 10) : null,
      abstract,
      topics: [],
      companies: inferCompanies(`${title} ${abstract ?? ""}`),
      citation_count: undefined,
      source: "arxiv",
    });
  }
  return papers;
}

export const ARXIV_CATEGORIES = ["cs.NI", "cs.AI", "cs.DC", "cs.PF", "cs.LG", "cs.CR"] as const;

async function fetchArxiv(url: string, category: string): Promise<{ papers: ImportedPaper[]; stat: CategoryStat }> {
  const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000) });
  if (!res.ok) return { papers: [], stat: { category, status: "error", count: 0, error: `HTTP ${res.status}` } };
  const xml = await res.text();
  const papers = parseArxivXml(xml);
  return { papers, stat: { category, status: "ok", count: papers.length } };
}

export async function syncArxivPapers(year: number): Promise<{ stats: CategoryStat[]; inserted: InsertedPaper[] }> {
  const stats: CategoryStat[] = [];
  const inserted: InsertedPaper[] = [];
  const seen = new Set<string>();

  for (const cat of ARXIV_CATEGORIES) {
    const query = `cat:${cat}+AND+submittedDate:[${year}01010000+TO+${year}12312359]`;
    const url = `https://export.arxiv.org/api/query?search_query=${query}&start=0&max_results=200&sortBy=submittedDate&sortOrder=descending`;
    try {
      const { papers, stat } = await fetchArxiv(url, cat);
      stats.push(stat);
      let imported = 0;
      for (const p of papers) {
        const key = p.title.toLowerCase().trim();
        if (seen.has(key)) continue;
        seen.add(key);
        const r = await upsertPaper(p);
        if (r) { imported++; inserted.push(r); }
      }
      stats.push({ category: `${cat}_imported`, status: "ok", count: imported });
    } catch (err) {
      stats.push({ category: cat, status: "error", count: 0, error: err instanceof Error ? err.message : "unknown" });
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return { stats, inserted };
}

// ── Semantic Scholar ──

export const S2_VENUES = [
  "SIGCOMM", "NSDI", "IMC", "OSDI", "SOSP", "CoNEXT",
  "INFOCOM", "ICNP", "HOTNETS", "MOBICOM", "SIGMETRICS",
  "EuroSys", "ASPLOS", "CCS", "S&P", "USENIX Security",
  "ATC", "FAST", "PPoPP", "ISCA", "MICRO", "HPCA",
  "APNet", "ANCS", "PAM", "TMA", "Middleware", "SenSys", "MobiSys",
] as const;
const S2_FIELDS = "title,authors,venue,year,citationCount,url,abstract,externalIds";

type S2Paper = {
  paperId: string;
  title: string; authors: { name: string }[]; venue: string | null;
  year: number | null; citationCount: number | null; url: string | null;
  abstract: string | null; externalIds: Record<string, string> | null;
};

function parseS2Papers(data: S2Paper[], venue: string): ImportedPaper[] {
  return data.map((p) => ({
    title: p.title,
    authors: p.authors.map((a) => a.name),
    venue,
    url: p.externalIds?.ArXiv ? `https://arxiv.org/abs/${p.externalIds.ArXiv}` : p.url,
    published_date: p.year ? `${p.year}-01-01` : null,
    abstract: p.abstract?.slice(0, 2000) ?? null,
    topics: [],
    companies: inferCompanies(`${p.title} ${p.abstract ?? ""}`),
    citation_count: p.citationCount ?? undefined,
    source: "semantic-scholar",
  }));
}

export async function syncS2Papers(year: number): Promise<{ stats: CategoryStat[]; inserted: InsertedPaper[] }> {
  const raw = process.env.SEMANTIC_SCHOLAR_API_KEY || "";
  const apiKey = raw && !raw.startsWith("xxx") ? raw : "";
  const stats: CategoryStat[] = [];
  const inserted: InsertedPaper[] = [];
  const seen = new Set<string>();
  const headers: Record<string, string> = {};
  if (apiKey) headers["x-api-key"] = apiKey;

  const S2_QUERIES: Record<string, string> = {
    "SIGCOMM": "network", "NSDI": "system", "IMC": "measurement",
    "OSDI": "system", "SOSP": "system", "CoNEXT": "network",
    "INFOCOM": "network", "ICNP": "protocol", "HOTNETS": "network",
    "MOBICOM": "mobile", "SIGMETRICS": "performance",
    "EuroSys": "system", "ASPLOS": "architecture",
    "CCS": "security", "S&P": "security", "USENIX Security": "security",
    "ATC": "system", "FAST": "storage", "PPoPP": "parallel",
    "ISCA": "architecture", "MICRO": "architecture", "HPCA": "architecture",
    "APNet": "network", "ANCS": "network", "PAM": "measurement",
    "TMA": "traffic", "Middleware": "middleware",
    "SenSys": "sensor", "MobiSys": "mobile",
  };

  for (const venue of S2_VENUES) {
    const query = S2_QUERIES[venue] ?? "computer science";
    const params = new URLSearchParams({
      query, year: String(year), venue,
      fields: S2_FIELDS, limit: "100",
    });
    try {
      const res = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?${params}`, {
        headers, signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) { stats.push({ category: venue, status: "error", count: 0, error: `HTTP ${res.status}` }); continue; }
      const json: { data: S2Paper[] } = await res.json();

      // Backfill null abstracts via single-paper detail API (much higher return rate)
      const nullAbstract = (json.data ?? []).filter(p => !p.abstract && p.paperId);
      if (nullAbstract.length > 0) {
        let filled = 0;
        for (const p of nullAbstract) {
          await new Promise((r) => setTimeout(r, 1100)); // 1 req/s rate limit
          try {
            const dr = await fetch(
              `https://api.semanticscholar.org/graph/v1/paper/${p.paperId}?fields=abstract`,
              { headers, signal: AbortSignal.timeout(10000) },
            );
            if (dr.ok) {
              const detail: { abstract: string | null } = await dr.json();
              if (detail.abstract) { p.abstract = detail.abstract; filled++; }
            }
          } catch { /* skip on timeout/network err */ }
        }
        if (filled > 0) console.log(`[s2] ${venue}: backfilled ${filled}/${nullAbstract.length} null abstracts`);
      }

      const papers = parseS2Papers(json.data ?? [], venue);
      stats.push({ category: venue, status: "ok", count: papers.length });
      let imported = 0;
      for (const p of papers) {
        const key = p.title.toLowerCase().trim();
        if (seen.has(key)) continue; seen.add(key);
        const r = await upsertPaper(p);
        if (r) { imported++; inserted.push(r); }
      }
      stats.push({ category: `${venue}_imported`, status: "ok", count: imported });
    } catch (err) {
      stats.push({ category: venue, status: "error", count: 0, error: err instanceof Error ? err.message : "unknown" });
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  return { stats, inserted };
}

// ── Company-specific arXiv ──

const COMPANY_ARXIV_QUERIES: Record<string, string> = {
  cisco: "all:cisco+AND+all:(network+OR+datacenter+OR+sdn+OR+segment+routing+OR+bgp+OR+ios+xe)",
  google: 'all:"google"+AND+all:(network+OR+datacenter+OR+sdn+OR+cloud+OR+infrastructure+OR+mgcp+OR+boria)',
  nvidia: "all:nvidia+AND+all:(network+OR+datacenter+OR+gpu+OR+rdma+OR+infiniBand+OR+doca+OR+connectx)",
  meta: "all:meta+AND+all:(network+OR+datacenter+OR+sdn+OR+optical+OR+fboss+OR+wedge,marianas)",
  microsoft: "all:microsoft+AND+all:(network+OR+datacenter+OR+sdn+OR+cloud+OR+rdma+OR+sonic)",
  aws: 'all:"aws"+AND+all:(network+OR+vpc+OR+cloud+OR+datacenter+OR+sdn+OR+route+53+OR+direct+connect)',
  huawei: "all:huawei+AND+all:(network+OR+5g+OR+6g+OR+datacenter+OR+router+OR+sdn+OR+ip)",
  intel: "all:intel+AND+all:(network+OR+datacenter+OR+sdn+OR+chip+OR+ethernet+OR+tofino+OR+ipu)",
  ibm: "all:ibm+AND+all:(network+OR+cloud+OR+watson+OR+red+hat+OR+telecom+OR+nsf)",
  broadcom: "all:broadcom+AND+all:(network+OR+switch+OR+router+OR+chip+OR+silicon+OR+jericho+OR+tomahawk+OR+trident)",
  cloudflare: "all:cloudflare+AND+all:(network+OR+dns+OR+cdn+OR+ddos+OR+edge+OR+workers+OR+zero+trust)",
  apple: "all:apple+AND+all:(network+OR+icloud+OR+edge+OR+privacy+OR+protocol+OR+wifi+OR+bluetooth)",
  amd: "all:amd+AND+all:(network+OR+datacenter+OR+chip+OR+pensando+OR+xilinx+OR+fpga+OR+smartnic)",
  ericsson: "all:ericsson+AND+all:(network+OR+5g+OR+6g+OR+radio+OR+ran+OR+oranic+OR+bgp+OR+sdn)",
  nokia: "all:nokia+AND+all:(network+OR+5g+OR+6g+OR+radio+OR+ran+OR+sdn+OR+ip+optical)",
  openai: "all:openai+AND+all:(network+OR+distributed+OR+training+OR+inference+OR+datacenter+OR+gpu)",
  anthropic: "all:anthropic+AND+all:(network+OR+distributed+OR+training+OR+inference+OR+datacenter)",
};

export async function syncCompanyPapers(year: number): Promise<{ stats: CategoryStat[]; inserted: InsertedPaper[] }> {
  const stats: CategoryStat[] = [];
  const inserted: InsertedPaper[] = [];
  const seen = new Set<string>();

  for (const [slug, query] of Object.entries(COMPANY_ARXIV_QUERIES)) {
    const dateFilter = `+AND+submittedDate:[${year}01010000+TO+${year}12312359]`;
    const url = `https://export.arxiv.org/api/query?search_query=${query}${dateFilter}&start=0&max_results=50&sortBy=submittedDate&sortOrder=descending`;
    try {
      const { papers, stat } = await fetchArxiv(url, `company:${slug}`);
      stats.push(stat);
      let imported = 0;
      for (const p of papers) {
        if (!p.companies.includes(slug)) p.companies.push(slug);
        const key = p.title.toLowerCase().trim();
        if (seen.has(key)) continue; seen.add(key);
        const r = await upsertPaper(p);
        if (r) { imported++; inserted.push(r); }
      }
      stats.push({ category: `company:${slug}_imported`, status: "ok", count: imported });
    } catch (err) {
      stats.push({ category: `company:${slug}`, status: "error", count: 0, error: err instanceof Error ? err.message : "unknown" });
    }
    await new Promise((r) => setTimeout(r, 3500));
  }
  return { stats, inserted };
}

// ── DB upsert ──

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

function isRealVenue(v: string | null | undefined): boolean {
  return !!v && v !== "arXiv" && v !== "arxiv" && v !== "";
}

async function upsertPaper(p: ImportedPaper): Promise<InsertedPaper | null> {
  // Check by exact title
  const { data: byTitle } = await supabase
    .from("papers")
    .select("id, citation_count, venue")
    .eq("title", p.title)
    .maybeSingle();

  if (byTitle) {
    const updates: Record<string, any> = {};
    if (p.citation_count !== undefined && byTitle.citation_count !== p.citation_count) {
      updates.citation_count = p.citation_count;
    }
    if (isRealVenue(p.venue) && !isRealVenue(byTitle.venue)) {
      updates.venue = p.venue;
    }
    if (Object.keys(updates).length > 0) {
      await supabase.from("papers").update(updates).eq("id", byTitle.id);
    }
    return null;
  }

  // Check by URL (same arXiv paper from different queries)
  if (p.url) {
    const { data: byUrl } = await supabase
      .from("papers")
      .select("id, citation_count, companies, venue")
      .eq("url", p.url)
      .maybeSingle();

    if (byUrl) {
      const updates: Record<string, any> = {};
      if (p.citation_count !== undefined && byUrl.citation_count !== p.citation_count) {
        updates.citation_count = p.citation_count;
      }
      if (isRealVenue(p.venue) && !isRealVenue(byUrl.venue)) {
        updates.venue = p.venue;
      }
      const existingCo = (byUrl.companies as string[]) ?? [];
      const merged = [...new Set([...existingCo, ...p.companies])];
      if (merged.length > existingCo.length) updates.companies = merged;
      if (Object.keys(updates).length > 0) {
        await supabase.from("papers").update(updates).eq("id", byUrl.id);
      }
      return null;
    }
  }

  // Fuzzy check: normalized title prefix match to catch "CRESS: Title" vs "Title"
  const norm = normalizeTitle(p.title);
  const words = norm.split(" ");
  if (words.length >= 4) {
    const coreWords = words.slice(0, 6).join(" ");
    const { data: fuzzy } = await supabase
      .from("papers")
      .select("id, title, venue")
      .ilike("title", `%${coreWords.slice(0, 60)}%`)
      .limit(5);

    if (fuzzy?.length) {
      for (const f of fuzzy) {
        const fNorm = normalizeTitle(f.title);
        if (fNorm === norm || fNorm.endsWith(norm) || norm.endsWith(fNorm)) {
          if (isRealVenue(p.venue) && !isRealVenue(f.venue)) {
            await supabase.from("papers").update({ venue: p.venue }).eq("id", f.id);
          }
          return null;
        }
      }
    }
  }

  const { data: inserted } = await supabase
    .from("papers")
    .insert({
      title: p.title, authors: p.authors, venue: p.venue,
      url: p.url, published_date: p.published_date, abstract: p.abstract,
      citation_count: p.citation_count ?? null, source: p.source, companies: p.companies,
    })
    .select("id");

  if (inserted && inserted.length > 0) {
    return { id: inserted[0].id, title: p.title, abstract: p.abstract, companies: p.companies };
  }
  return null;
}

// ── Master sync ──

export async function syncAllPapers(year: number): Promise<{ stats: CategoryStat[]; inserted: InsertedPaper[] }> {
  const allStats: CategoryStat[] = [];
  const allInserted: InsertedPaper[] = [];

  const ar = await syncArxivPapers(year);
  allStats.push(...ar.stats);
  allInserted.push(...ar.inserted);

  const s2 = await syncS2Papers(year);
  allStats.push(...s2.stats);
  allInserted.push(...s2.inserted);

  const co = await syncCompanyPapers(year);
  allStats.push(...co.stats);
  allInserted.push(...co.inserted);

  console.log(`[sync] ${allInserted.length} new papers imported`);

  try {
    await supabase.from("sync_meta").upsert(
      { entity: "papers", last_sync_at: new Date().toISOString(), last_result: { categoryStats: allStats } },
      { onConflict: "entity" },
    );
  } catch { /* sync_meta table might not exist */ }

  return { stats: allStats, inserted: allInserted };
}
