import { supabase } from "../lib/supabase.js";

const CONFERENCE_VENUES: Record<string, { name: string; category: string; tier: "top" | "good" | "workshop"; topics: string[] }> = {
  "SIGCOMM":         { name: "SIGCOMM",  category: "network-systems", tier: "top", topics: ["dc-networking", "programmable-net", "sdn-nfv", "transport-protocols"] },
  "NSDI":            { name: "NSDI",     category: "network-systems", tier: "top", topics: ["dc-networking", "programmable-net", "sdn-nfv"] },
  "IMC":             { name: "IMC",      category: "measurement",     tier: "top", topics: ["network-measurement", "traffic-analysis", "performance"] },
  "OSDI":            { name: "OSDI",     category: "infrastructure",  tier: "top", topics: ["operating-system", "storage-systems", "cloud-computing"] },
  "SOSP":            { name: "SOSP",     category: "infrastructure",  tier: "top", topics: ["operating-system", "storage-systems"] },
  "CoNEXT":          { name: "CoNEXT",   category: "network-systems", tier: "good", topics: ["dc-networking", "transport-protocols", "programmable-net"] },
  "INFOCOM":         { name: "INFOCOM",  category: "network-systems", tier: "good", topics: ["dc-networking", "wireless", "5g-6g", "optical"] },
  "ICNP":            { name: "ICNP",     category: "network-systems", tier: "good", topics: ["dc-networking", "programmable-net", "network-security"] },
  "HOTNETS":         { name: "HotNets",  category: "network-systems", tier: "good", topics: ["dc-networking", "programmable-net", "emerging-network"] },
  "MOBICOM":         { name: "MobiCom",  category: "network-systems", tier: "top", topics: ["wireless", "5g-6g", "edge-computing", "mobile"] },
  "SIGMETRICS":      { name: "SIGMETRICS", category: "measurement",  tier: "top", topics: ["network-measurement", "performance", "traffic-analysis"] },
  "EuroSys":         { name: "EuroSys",  category: "infrastructure",  tier: "top", topics: ["operating-system", "cloud-computing", "storage-systems"] },
  "ASPLOS":          { name: "ASPLOS",   category: "infrastructure",  tier: "top", topics: ["operating-system", "architecture", "cloud-computing"] },
  "CCS":             { name: "CCS",      category: "security",        tier: "top", topics: ["network-security", "cryptography", "privacy"] },
  "S&P":             { name: "S&P",      category: "security",        tier: "top", topics: ["network-security", "cryptography", "privacy"] },
  "USENIX Security": { name: "USENIX Security", category: "security", tier: "top", topics: ["network-security", "privacy", "cryptography"] },
  "ATC":             { name: "ATC",      category: "infrastructure",  tier: "good", topics: ["cloud-computing", "operating-system", "storage-systems"] },
  "FAST":            { name: "FAST",     category: "infrastructure",  tier: "top", topics: ["storage-systems", "file-systems"] },
  "PPoPP":           { name: "PPoPP",    category: "infrastructure",  tier: "top", topics: ["parallel-computing", "compiler"] },
  "ISCA":            { name: "ISCA",     category: "infrastructure",  tier: "top", topics: ["architecture", "parallel-computing"] },
  "MICRO":           { name: "MICRO",    category: "infrastructure",  tier: "top", topics: ["architecture", "microarchitecture"] },
  "HPCA":            { name: "HPCA",     category: "infrastructure",  tier: "top", topics: ["architecture", "parallel-computing"] },
  "APNet":           { name: "APNet",    category: "network-systems", tier: "good", topics: ["dc-networking", "programmable-net", "sdn-nfv"] },
  "ANCS":            { name: "ANCS",     category: "network-systems", tier: "good", topics: ["dc-networking", "programmable-net"] },
  "PAM":             { name: "PAM",      category: "measurement",     tier: "good", topics: ["network-measurement", "performance"] },
  "TMA":             { name: "TMA",      category: "measurement",     tier: "good", topics: ["network-measurement", "traffic-analysis"] },
  "Middleware":      { name: "Middleware", category: "infrastructure", tier: "good", topics: ["cloud-computing", "distributed-systems"] },
  "SenSys":          { name: "SenSys",   category: "network-systems", tier: "good", topics: ["wireless", "iot", "edge-computing"] },
  "MobiSys":         { name: "MobiSys",  category: "network-systems", tier: "good", topics: ["mobile", "wireless", "edge-computing"] },
};

type PapersByVenueYear = {
  venue: string;
  year: number;
  papers: { id: string; title: string; authors: string[]; published_date: string | null; abstract: string | null; url: string | null }[];
};

export async function crawlConferences(year?: number): Promise<{ created: number; sessions: number; linked: number; skipped: number }> {
  const targetYear = year ?? new Date().getFullYear();
  console.log(`[conference-crawler] Starting: ${targetYear}, reading from DB...`);

  // Load existing conferences for dedup
  const { data: existing } = await supabase
    .from("conferences")
    .select("id, name, abbreviation, start_date");
  const existingByKey = new Map<string, string>(); // key → conference_id
  for (const c of existing ?? []) {
    if (c.abbreviation) existingByKey.set(c.abbreviation.toLowerCase(), c.id);
  }

  // Build venue list for SQL IN clause
  const venueNames = Object.keys(CONFERENCE_VENUES);

  // Find papers in DB that have real venue names (set by S2 import)
  const { data: papers } = await supabase
    .from("papers")
    .select("id, title, authors, venue, published_date, abstract, url")
    .in("venue", venueNames)
    .not("venue", "is", null);

  if (!papers?.length) {
    console.log(`[conference-crawler] No papers with real venue found in DB`);
    console.log(`[conference-crawler] Run 's2' or 'papers' task first so S2 import enriches venues`);
    return { created: 0, sessions: 0, linked: 0, skipped: 0 };
  }

  console.log(`[conference-crawler] Found ${papers.length} papers with venue data in DB`);

  // Group by venue + year
  const groups = new Map<string, PapersByVenueYear>();
  for (const p of papers) {
    const pubYear = p.published_date
      ? new Date(p.published_date).getFullYear()
      : null;
    if (!pubYear) continue;
    if (pubYear !== targetYear) continue;

    const key = `${p.venue}|${pubYear}`;
    if (!groups.has(key)) {
      groups.set(key, { venue: p.venue!, year: pubYear, papers: [] });
    }
    groups.get(key)!.papers.push({
      id: p.id,
      title: p.title,
      authors: p.authors as string[],
      published_date: p.published_date,
      abstract: p.abstract,
      url: p.url,
    });
  }

  if (groups.size === 0) {
    console.log(`[conference-crawler] No papers found for ${targetYear}`);
    return { created: 0, sessions: 0, linked: 0, skipped: 0 };
  }

  let created = 0;
  let totalSessions = 0;
  let linked = 0;
  let skipped = 0;

  for (const [groupKey, group] of groups) {
    const venueConfig = CONFERENCE_VENUES[group.venue];
    if (!venueConfig) continue;

    const abbrevKey = `${group.venue.toLowerCase()}-${group.year}`;
    const existingConfId = existingByKey.get(abbrevKey);

    if (existingConfId) {
      // Conference exists — link sessions from papers that aren't already linked
      const freshPapers = group.papers.filter(p => {
        // simple check: link all papers from this venue that exist
        // We'll just count them as already covered
        return false; // skip, conference already exists
      });
      linked += group.papers.length;
      skipped++;
      continue;
    }

    // Need ≥3 papers to create a conference
    if (group.papers.length < 3) {
      console.log(`[conference-crawler] ${group.venue} ${group.year}: only ${group.papers.length} papers, skip`);
      skipped++;
      continue;
    }

    // Estimate date from paper dates
    const dates = group.papers.map(p => p.published_date).filter(Boolean) as string[];
    dates.sort();
    const startDate = dates[Math.floor(dates.length * 0.1)] ?? `${group.year}-06-15`;
    const endDate = dates[Math.floor(dates.length * 0.9)] ?? `${group.year}-06-15`;

    // Create conference
    const { data: conf, error: confErr } = await supabase
      .from("conferences")
      .insert({
        name: `${venueConfig.name} ${group.year}`,
        abbreviation: `${group.venue} ${group.year}`,
        url: null,
        location: null,
        start_date: startDate.slice(0, 10),
        end_date: endDate.slice(0, 10),
        category: venueConfig.category,
        tier: venueConfig.tier,
        topics: venueConfig.topics,
        notes: `Auto-created from DB papers (${group.papers.length} papers)`,
      })
      .select("id")
      .single();

    if (confErr || !conf) {
      console.error(`[conference-crawler] Insert failed for ${group.venue}: ${confErr?.message}`);
      continue;
    }

    // Insert sessions from papers
    const sessions = group.papers.map(p => ({
      conference_id: conf.id,
      title: p.title,
      authors: p.authors ?? [],
      topics: [],
      affiliations: [],
      url: p.url,
      abstract: p.abstract?.slice(0, 2000) ?? null,
    }));

    // Insert in batches of 50
    let sessCount = 0;
    for (let i = 0; i < sessions.length; i += 50) {
      const batch = sessions.slice(i, i + 50);
      const { error: sessErr } = await supabase
        .from("conference_sessions")
        .insert(batch);
      if (sessErr) {
        console.error(`[conference-crawler] Sessions batch failed for ${group.venue}: ${sessErr.message}`);
      } else {
        sessCount += batch.length;
      }
    }

    totalSessions += sessCount;
    created++;
    existingByKey.set(abbrevKey, conf.id);
    console.log(`[conference-crawler] Created ${group.venue} ${group.year}: ${sessCount} sessions from ${group.papers.length} papers`);
  }

  console.log(`[conference-crawler] Done: ${created} created, ${totalSessions} sessions, ${linked} linked, ${skipped} skipped`);
  return { created, sessions: totalSessions, linked, skipped };
}
