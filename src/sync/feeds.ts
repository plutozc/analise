import { inferCompanies } from "../lib/companies.js";
import { classifyItems } from "../lib/ai-classify.js";
import { supabase } from "../lib/supabase.js";
import type { RSSItem, FeedStat } from "../types/index.js";

type FeedConfig = { url: string; source: string; format?: "atom" };

const NEWS_FEEDS: FeedConfig[] = [
  // --- Tech blogs & engineering ---
  { url: "https://blog.cloudflare.com/rss/", source: "Cloudflare Blog" },
  { url: "https://blog.cloudflare.com/zh-cn/rss/", source: "Cloudflare 中文" },
  { url: "https://aws.amazon.com/blogs/networking-and-content-delivery/feed/", source: "AWS Networking" },
  { url: "https://azure.microsoft.com/en-us/blog/feed/", source: "Azure Blog" },
  { url: "https://cloudblog.withgoogle.com/rss/", source: "Google Cloud Blog" },
  { url: "https://engineering.fb.com/category/networking-traffic/feed/", source: "Meta Engineering" },
  { url: "https://blogs.cisco.com/feed/", source: "Cisco Blogs" },
  { url: "https://developer.nvidia.com/blog/feed", source: "NVIDIA Developer" },
  { url: "https://netflixtechblog.com/feed", source: "Netflix Tech Blog" },
  { url: "https://www.uber.com/en-US/blog/engineering/rss/", source: "Uber Engineering" },
  // --- News & media ---
  { url: "https://feeds.arstechnica.com/arstechnica/technology-lab", source: "Ars Technica" },
  { url: "https://www.theregister.com/feed/", source: "The Register" },
  { url: "https://hnrss.org/newest?points=100&q=networking+OR+infrastructure+OR+datacenter+OR+BGP+OR+DNS+OR+CDN+OR+5G+OR+eBPF", source: "Hacker News" },
  { url: "https://www.lightreading.com/rss.xml", source: "Light Reading" },
  { url: "https://www.datacenterknowledge.com/rss.xml", source: "Data Center Knowledge" },
  // --- Networking community ---
  { url: "https://lwn.net/headlines/rss", source: "LWN.net" },
  { url: "https://blog.apnic.net/feed/", source: "APNIC Blog" },
  { url: "https://labs.ripe.net/rss/", source: "RIPE Labs" },
  { url: "https://www.potaroo.net/ispcol/recentcolumns.xml", source: "Potaroo (Geoff Huston)" },
  { url: "https://elegantnetwork.github.io/feed.xml", source: "Elegant Network" },
  { url: "https://packetpushers.net/feed/", source: "Packet Pushers" },
  // --- Chinese tech ---
  { url: "https://feeds.feedburner.com/solidot", source: "Solidot" },
  { url: "https://www.leiphone.com/feed", source: "雷锋网" },
  { url: "https://www.cnbeta.com.tw/backend.php", source: "cnBeta" },
  { url: "https://www.ruanyifeng.com/blog/atom.xml", source: "阮一峰", format: "atom" as const },
  // --- Google News Chinese ---
  { url: "https://news.google.com/rss/search?q=%E7%BD%91%E7%BB%9C+%E6%95%B0%E6%8D%AE%E4%B8%AD%E5%BF%83+when:7d&hl=zh-CN&gl=CN&ceid=CN:zh-Hans", source: "Google新闻-网络数据中心" },
  { url: "https://news.google.com/rss/search?q=%E4%BA%91%E8%AE%A1%E7%AE%97+%E7%BD%91%E7%BB%9C%E6%9E%B6%E6%9E%84+when:7d&hl=zh-CN&gl=CN&ceid=CN:zh-Hans", source: "Google新闻-云计算网络" },
  { url: "https://news.google.com/rss/search?q=SDN+OR+eBPF+OR+RDMA+OR+%E4%BA%A4%E6%8D%A2%E6%9C%BA+OR+%E8%B7%AF%E7%94%B1%E5%99%A8+when:7d&hl=zh-CN&gl=CN&ceid=CN:zh-Hans", source: "Google新闻-SDN交换机" },
  { url: "https://news.google.com/rss/search?q=%E5%8D%8E%E4%B8%BA+%E7%BD%91%E7%BB%9C+OR+5G+OR+%E6%95%B0%E6%8D%AE%E4%B8%AD%E5%BF%83+when:7d&hl=zh-CN&gl=CN&ceid=CN:zh-Hans", source: "Google新闻-华为网络" },
  { url: "https://news.google.com/rss/search?q=%E9%98%BF%E9%87%8C%E4%BA%91+OR+%E8%85%BE%E8%AE%AF%E4%BA%91+%E7%BD%91%E7%BB%9C+when:7d&hl=zh-CN&gl=CN&ceid=CN:zh-Hans", source: "Google新闻-阿里腾讯云" },
  // --- Google News company watches ---
  { url: "https://news.google.com/rss/search?q=%22Ericsson%22+network+OR+5G+OR+6G+OR+RAN+when:7d", source: "Ericsson" },
  { url: "https://news.google.com/rss/search?q=%22Nokia%22+network+OR+5G+OR+6G+OR+IP+optical+when:7d", source: "Nokia" },
  { url: "https://news.google.com/rss/search?q=OpenAI+network+OR+infrastructure+OR+distributed+OR+training+when:7d", source: "OpenAI" },
  { url: "https://news.google.com/rss/search?q=Anthropic+network+OR+infrastructure+OR+distributed+OR+training+when:7d", source: "Anthropic" },
  { url: "https://news.google.com/rss/search?q=%22Micron%22+network+OR+memory+OR+DDR5+OR+datacenter+when:7d", source: "Micron" },
  { url: "https://news.google.com/rss/search?q=%22Broadcom%22+network+OR+switch+OR+router+OR+silicon+when:7d", source: "Broadcom" },
  { url: "https://news.google.com/rss/search?q=%22Intel%22+network+OR+Ethernet+OR+datacenter+OR+IPU+OR+silicon+when:7d", source: "Intel" },
  { url: "https://news.google.com/rss/search?q=%22Apple%22+network+OR+infrastructure+OR+edge+OR+protocol+OR+wifi+when:7d", source: "Apple" },
  { url: "https://news.google.com/rss/search?q=%22AMD%22+network+OR+datacenter+OR+Pensando+OR+smart+nic+OR+DPU+when:7d", source: "AMD" },
  { url: "https://news.google.com/rss/search?q=%22IBM%22+network+OR+cloud+OR+telecom+OR+red+hat+OR+infrastructure+when:7d", source: "IBM" },
  { url: "https://news.google.com/rss/search?q=%22Huawei%22+network+OR+5G+OR+6G+OR+router+OR+datacenter+when:7d", source: "Huawei" },
  { url: "https://news.google.com/rss/search?q=%22Tencent%22+network+OR+cloud+OR+datacenter+OR+infrastructure+when:7d", source: "Tencent" },
  { url: "https://news.google.com/rss/search?q=%22Alibaba%22+network+OR+cloud+OR+datacenter+OR+infrastructure+when:7d", source: "Alibaba" },
  { url: "https://news.google.com/rss/search?q=%22Baidu%22+network+OR+cloud+OR+infrastructure+when:7d", source: "Baidu" },
  { url: "https://news.google.com/rss/search?q=%22ByteDance%22+network+OR+cloud+OR+infrastructure+OR+streaming+when:7d", source: "ByteDance" },
];

function parseRSSXml(xml: string, source: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link") || extractGuid(block);
    const description = extractTag(block, "description");
    const pubDate = extractTag(block, "pubDate");
    if (title && link) {
      const cleanTitle = decodeEntities(title);
      const cleanSnippet = decodeEntities(stripHtml(description || "")).slice(0, 200);
      items.push({
        title: cleanTitle,
        link,
        snippet: cleanSnippet,
        source,
        pubDate: pubDate || null,
        companies: inferCompanies(`${cleanTitle} ${cleanSnippet}`),
      });
    }
  }
  return items;
}

function extractTag(xml: string, tag: string): string {
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i"));
  if (cdataMatch) return cdataMatch[1].trim();
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

function extractGuid(xml: string): string {
  const match = xml.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
  return match ? match[1].trim() : "";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function decodeEntities(text: string): string {
  return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&#x2F;/g, "/");
}

function parseAtomXml(xml: string, source: string): RSSItem[] {
  const items: RSSItem[] = [];
  const entries = xml.split("<entry>").slice(1);
  for (const entry of entries) {
    const title = extractTag(entry, "title");
    const link = entry.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? "";
    const summary = extractTag(entry, "summary") || extractTag(entry, "content");
    const published = extractTag(entry, "published") || extractTag(entry, "updated");
    if (title && link) {
      const cleanTitle = decodeEntities(title);
      const cleanSnippet = decodeEntities(stripHtml(summary || "")).slice(0, 200);
      items.push({
        title: cleanTitle, link, snippet: cleanSnippet, source,
        pubDate: published || null,
        companies: inferCompanies(`${cleanTitle} ${cleanSnippet}`),
      });
    }
  }
  return items;
}


export type InsertedNewsItem = { id: string; title: string; snippet: string; companies: string[] };

export async function syncAllFeeds(): Promise<{ stats: FeedStat[]; inserted: InsertedNewsItem[] }> {
  const stats: FeedStat[] = [];
  const allItems: RSSItem[] = [];
  const inserted: InsertedNewsItem[] = [];

  // Fetch all feeds
  const results = await Promise.allSettled(
    NEWS_FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, { signal: AbortSignal.timeout(12000) });
        if (!res.ok) { stats.push({ source: feed.source, status: "error", count: 0, error: `HTTP ${res.status}` }); return []; }
        const text = await res.text();
        if (!text.includes("<item>") && !text.includes("<entry>")) {
          stats.push({ source: feed.source, status: "error", count: 0, error: "not RSS/XML" });
          return [];
        }
        const parsed = feed.format === "atom" || (!text.includes("<item>") && text.includes("<entry>"))
          ? parseAtomXml(text, feed.source)
          : parseRSSXml(text, feed.source);
        stats.push({ source: feed.source, status: "ok", count: parsed.length });
        return parsed;
      } catch (err) {
        stats.push({ source: feed.source, status: "error", count: 0, error: err instanceof Error ? err.message : "unknown" });
        return [];
      }
    }),
  );

  for (const r of results) {
    if (r.status === "fulfilled") allItems.push(...r.value);
  }

  const lookbackHoursRaw = Number.parseInt(process.env.FEED_LOOKBACK_HOURS ?? "6", 10);
  const lookbackHours = Number.isFinite(lookbackHoursRaw) && lookbackHoursRaw > 0 ? lookbackHoursRaw : 6;
  const minAiBatchRaw = Number.parseInt(process.env.MIN_FEED_AI_BATCH ?? "20", 10);
  const minAiBatch = Number.isFinite(minAiBatchRaw) && minAiBatchRaw >= 0 ? minAiBatchRaw : 20;

  // Keep a wider window so small hourly bursts can accumulate before AI classification.
  const cutoff = Date.now() - lookbackHours * 3600_000;
  let recent = allItems.filter(i => {
    if (!i.pubDate) return false;
    const ts = Date.parse(i.pubDate);
    return !isNaN(ts) && ts >= cutoff;
  });

  // Filter out LWN update announcements (noise like "Security updates for Friday")
  recent = recent.filter(i => !(i.source === "LWN.net" && /^Security updates|^Eight new stable kernels|^Kernel release announcement/i.test(i.title)));

  console.log(`[feeds] ${recent.length}/${allItems.length} items from last ${lookbackHours}h`);

  // Global dedup by link + title similarity
  // Title dedup: extract core words (≥4 chars, not stopwords, no numbers/punctuation)
  // Keep first item; reject later items where ≥60% of core words are contained in a kept item
  const STOP = new Set(["the","this","that","with","from","have","will","said","says",
    "after","before","report","over","cross","also","more","than","into","their",
    "they","them","what","when","been","says","still","billion","million","crore"]);
  function coreWords(t: string): Set<string> {
    const words = t
      .replace(/[—–\-–].+$/, "")        // strip publisher suffix
      .replace(/^[A-Za-z]+\s*:\s*/, "") // strip prefix
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length >= 4 && !STOP.has(w))
      .map(w => w.replace(/s$/, "").replace(/ed$/, "")); // normalize plurals/past tense
    return new Set(words);
  }
  function isDup(a: Set<string>, b: Set<string>): boolean {
    if (a.size < 2 || b.size < 2) return false;
    const smaller = a.size <= b.size ? a : b;
    const larger  = a.size <= b.size ? b : a;
    const contained = [...smaller].filter(w => larger.has(w));
    return contained.length >= 2 && contained.length / smaller.size >= 0.55;
  }

  const seenLink = new Set<string>();
  const clusters: { item: RSSItem; coverageCount: number; words: Set<string> }[] = [];
  for (const item of recent) {
    if (seenLink.has(item.link)) continue;
    seenLink.add(item.link);
    const words = coreWords(item.title);
    let matched = false;
    for (const c of clusters) {
      if (isDup(words, c.words)) {
        c.coverageCount++;
        matched = true;
        break;
      }
    }
    if (!matched) {
      clusters.push({ item, coverageCount: 1, words });
    }
  }
  console.log(`[feeds] ${recent.length} items → ${clusters.length} story clusters (total coverage: ${clusters.reduce((s, c) => s + c.coverageCount, 0)})`);

  // Check which clusters are actually new (not in DB yet)
  const links = clusters.map(c => c.item.link);
  const { data: existingRows } = await supabase
    .from("news_items").select("link").in("link", links);
  const existingLinks = new Set((existingRows ?? []).map(r => r.link));
  let newClusters = clusters.filter(c => !existingLinks.has(c.item.link));

  // Cross-batch: instead of dropping, boost existing DB entries' coverage
  if (newClusters.length > 0) {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const { data: recentDb } = await supabase.from("news_items")
      .select("id, title").gte("created_at", since).limit(500);
    if (recentDb?.length) {
      const dbWords = recentDb.map(r => ({ id: r.id, words: coreWords(r.title) }));
      const before = newClusters.length;
      const boostedIds: string[] = [];
      newClusters = newClusters.filter(c => {
        const match = dbWords.find(dw => isDup(c.words, dw.words));
        if (match) {
          boostedIds.push(match.id);
          return false;
        }
        return true;
      });
      // Increment coverage_count on matched DB entries
      if (boostedIds.length > 0) {
        const idCounts = new Map<string, number>();
        for (const id of boostedIds) idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
        for (const [id, inc] of idCounts) {
          await supabase.rpc("increment_coverage_count", { row_id: id, inc });
        }
        console.log(`[feeds] Cross-batch: ${boostedIds.length} dupes boosted ${idCounts.size} DB entries`);
      }
      const dropped = before - newClusters.length;
      if (dropped > 0) console.log(`[feeds] Cross-batch dedup: ${dropped} clusters matched recent DB entries`);
    }
  }

  // Defer AI classify if batch is below threshold
  if (newClusters.length > 0 && newClusters.length < minAiBatch) {
    console.log(`[feeds] Deferring AI classify: ${newClusters.length}/${minAiBatch} story clusters`);
    await supabase.from("sync_meta").upsert(
      { entity: "news", last_sync_at: new Date().toISOString(), last_result: { feedStats: stats, deferred: true, pending: newClusters.length } },
      { onConflict: "entity" },
    );
    return { stats, inserted };
  }

  // Pre-filter obvious financial news before AI classify (saves API cost)
  const FIN_PATTERNS = /stock|shares?\s+(rise|fall|surge|plunge|up|down|gain|rise|drop)|earnings|revenue|profit|margin|dividend|buyback|ipo|market\s*cap|rating|outperform|downgrade|upgrade|target\s*price|million\s*(share|offering|cash)|billion\s*(share|offering|cash)|(bull|bear)\s*case|analyst\s*(say|predict)|华尔街|股价|市值|财报/i;
  let finFiltered = newClusters;
  if (newClusters.length > 20) {
    const before = newClusters.length;
    finFiltered = newClusters.filter(c => !FIN_PATTERNS.test(c.item.title));
    console.log(`[feeds] Finance pre-filter: ${before} → ${finFiltered.length} story clusters`);
  }

  // Classify, then boost score by coverage, insert only representative items
  if (finFiltered.length > 0) {
    console.log(`[feeds] Classifying ${finFiltered.length} story clusters...`);
    const scores = await classifyItems(finFiltered.map(c => ({ title: c.item.title, snippet: c.item.snippet })));
    let insertedCount = 0;

    for (let i = 0; i < finFiltered.length; i++) {
      const { item, coverageCount } = finFiltered[i];
      const s = scores.get(i + 1);
      let score = s?.relevance_score ?? 0;

      // Boost by coverage: +1 per extra outlet, capped at 10
      if (coverageCount > 1) {
        const boost = Math.floor(Math.sqrt(coverageCount - 1));
        score = Math.min(10, score + boost);
        if (boost > 0) console.log(`[feeds] Coverage boost: ${item.title.slice(0, 50)}... ${coverageCount} sources → +${boost} → ${score}/10`);
      }

      if (score < 5) {
        console.log(`[feeds] Skip (${score}/10): ${item.title.slice(0, 60)}`);
        continue;
      }

      const merged = [...new Set([...item.companies, ...(s?.companies ?? [])])];
      const { data: row } = await supabase.from("news_items").insert({
        title: item.title, link: item.link,
        source: item.source, category: "news",
        pub_date: item.pubDate, snippet: item.snippet,
        companies: merged,
        ai_classified: true,
        ai_topics: s?.topics ?? [],
        relevance_score: score,
        coverage_count: coverageCount,
      }).select("id");

      if (row?.length) {
        inserted.push({ id: row[0].id, title: item.title, snippet: item.snippet ?? "", companies: merged });
        insertedCount++;
      }
    }

    console.log(`[feeds] ${insertedCount} inserted (${finFiltered.length - insertedCount} filtered out by AI relevance)`);
  }

  await supabase.from("sync_meta").upsert(
    { entity: "news", last_sync_at: new Date().toISOString(), last_result: { feedStats: stats } },
    { onConflict: "entity" },
  );

  console.log(`[feeds] ${inserted.length} new items, ${allItems.length} fetched`);
  return { stats, inserted };
}
