import fs from "node:fs/promises";
import { Buffer } from "node:buffer";

const today = new Date().toISOString().slice(0, 10);
const now = new Date().toISOString();
const userAgent = "MastercardContentAtlasPrototype/1.0";
const maxPages = Number(process.env.CRAWL_MAX_PAGES || 35);

const sourceConfig = JSON.parse(await fs.readFile("crawler/sources.json", "utf8"));
const dataSource = await fs.readFile("src/data.js", "utf8");
const data = await import(`data:text/javascript;base64,${Buffer.from(dataSource).toString("base64")}`);

const clean = (value = "") => String(value).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const attr = (tag, name) => tag?.match(new RegExp(`${name}=["']([^"']+)`, "i"))?.[1] || "";
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}[^>]*>`, "gi"))].map((m) => m[0]);
const meta = (html, needle) => attr(tags(html, "meta").find((tag) => tag.toLowerCase().includes(needle)), "content");

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, { headers: { "user-agent": userAgent, accept: "text/html" }, signal: controller.signal });
    return { url, status: res.status, ok: res.ok, html: await res.text() };
  } finally {
    clearTimeout(timeout);
  }
}

function pageTitle(html) {
  return clean(meta(html, "og:title") || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "Untitled Mastercard page");
}

function canonical(html, url) {
  const link = tags(html, "link").find((tag) => tag.toLowerCase().includes("canonical"));
  try { return new URL(attr(link, "href") || url, url).toString(); } catch { return url; }
}

function published(html, url) {
  const found = tags(html, "meta").map((tag) => attr(tag, "content")).find((value) => /^20\d\d-\d\d-\d\d/.test(value));
  if (found) return found.slice(0, 10);
  return url.match(/\/(20\d\d)\//)?.[1] ? `${url.match(/\/(20\d\d)\//)[1]}-01-01` : null;
}

function links(html, base) {
  return [...new Set([...html.matchAll(/<a\s[^>]*href=["']([^"']+)/gi)].map((m) => {
    try { const u = new URL(m[1], base); u.hash = ""; return u.toString(); } catch { return null; }
  }).filter(Boolean).filter((url) => /mastercard\.com/.test(url)).filter((url) => /(cyber|fraud|security|token|passkey|identity|risk|scam|threat|quantum|small-business|Insights|stories)/i.test(url)).filter((url) => !/\.(jpg|png|gif|webp|svg|pdf|zip|mp4)$/i.test(url)))]
}

function classify(text, url) {
  const h = `${text} ${url}`.toLowerCase();
  const pairs = [
    ["AI security", ["agentic", " ai ", "artificial intelligence"]], ["Small business security", ["small business", "sme"]],
    ["Post-quantum security", ["post-quantum", "quantum"]], ["Threat intelligence", ["threat intelligence"]],
    ["Tokenization", ["tokenization", "tokenized"]], ["Authentication", ["passkey", "authentication"]],
    ["Identity", ["identity", "verification"]], ["Scams", ["scam"]], ["Fraud prevention", ["fraud", "financial crime"]],
    ["Cyber resilience", ["resilience", "riskrecon"]], ["Risk", ["risk"]], ["Cybersecurity", ["cyber", "security"]]
  ];
  const topics = pairs.filter(([, words]) => words.some((word) => h.includes(word))).map(([topic]) => topic);
  return { primary: topics[0] || "Cybersecurity", secondary: [...new Set(topics.slice(1))].slice(0, 4) };
}

function format(url, title) {
  const h = `${url} ${title}`.toLowerCase();
  if (h.includes("white-paper")) return "White paper";
  if (h.includes("insights")) return "Report";
  if (h.includes("what-is")) return "Explainer article";
  if (h.includes("stories")) return "Perspective article";
  if (h.includes("business/cybersecurity-fraud-prevention/cybersecurity/")) return "Product page";
  if (h.includes("business/cybersecurity-fraud-prevention")) return "Solution page";
  return "Website page";
}

function buildAsset(page) {
  const title = pageTitle(page.html);
  const description = clean(meta(page.html, "description") || meta(page.html, "og:description"));
  const text = clean(page.html).slice(0, 1400);
  const topics = classify(`${title} ${description} ${text}`, page.url);
  const pageFormat = format(page.url, title);
  const id = `mc-crawled-${new URL(page.url).pathname.split("/").filter(Boolean).pop()?.replace(/\.html$/i, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase() || Date.now()}`;
  return {
    id, title, url: page.url, canonical_url: canonical(page.html, page.url),
    source_type: pageFormat === "Report" || pageFormat === "White paper" ? "Mastercard insights" : pageFormat.includes("article") ? "Mastercard newsroom" : "Mastercard website page",
    platform: new URL(page.url).hostname.replace("www.", ""), format: pageFormat, language: "English", region: page.url.includes("/us/") ? "US" : "Global",
    published_date: published(page.html, page.url), last_seen_date: today, last_crawled_date: today, raw_text: text,
    summary: description || `${title} was detected by the scheduled Mastercard Content Atlas crawler and needs review.`,
    primary_topic: topics.primary, secondary_topics: topics.secondary, audience: ["Marketing teams"],
    business_area: topics.primary === "Identity" ? "Digital identity" : topics.primary === "Tokenization" ? "Tokenization" : "Cyber and intelligence",
    funnel_stage: ["Report", "White paper"].includes(pageFormat) ? "Proof" : pageFormat.includes("page") ? "Consideration" : "Education",
    key_claims: [description || title], proof_points: [`Detected during scheduled crawl on ${today}.`, `Source URL: ${page.url}`],
    suggested_use: "Review for inclusion in the cybersecurity content inventory and campaign planning pack.",
    suggested_sales_enablement_use: "Review manually before using in client conversations.",
    linkedin_copy_recommendations: { executive: `${title}. Source: ${page.url}`, sales: `Potential client follow-up: ${title}. Source: ${page.url}`, launch: `New content candidate: ${title}. Source: ${page.url}`, short: `${title}. Source: ${page.url}` },
    related_asset_ids: [], ai_confidence_score: 0.72, metadata_status: "AI suggested", content_usefulness: "Background reading", url_status: page.status === 200 ? "Accessible" : "Needs review", duplicate_group: null,
    created_at: now, updated_at: now, page_views: null, search_clicks: null, search_impressions: null, social_engagements: null, video_views: null, source_performance_platform: null
  };
}

const seedUrls = [...new Set(sourceConfig.sources.filter((s) => s.enabled !== false).flatMap((s) => s.urls))];
const seedPages = [];
const errors = [];
for (const url of seedUrls) { try { const p = await fetchHtml(url); p.ok ? seedPages.push(p) : errors.push({ url, status: p.status }); } catch (e) { errors.push({ url, error: e.message }); } }
const discovered = [...new Set(seedPages.flatMap((page) => links(page.html, page.url)))].filter((url) => !seedUrls.includes(url)).slice(0, maxPages);
const discoveredPages = [];
for (const url of discovered) { try { const p = await fetchHtml(url); p.ok ? discoveredPages.push(p) : errors.push({ url, status: p.status }); } catch (e) { errors.push({ url, error: e.message }); } }

const existingByUrl = new Map(data.contentAssets.map((asset) => [asset.canonical_url || asset.url, asset]));
const discoveredAssets = [...seedPages, ...discoveredPages].map(buildAsset);
for (const asset of discoveredAssets) {
  const existing = existingByUrl.get(asset.canonical_url || asset.url);
  existingByUrl.set(asset.canonical_url || asset.url, existing ? { ...existing, last_seen_date: today, last_crawled_date: today } : asset);
}
const nextSources = data.initialSources.map((source) => source.enabled ? { ...source, last_checked: today } : source);
const out = [
  ["clientConfig", { ...data.clientConfig, lastSeededAt: today }], ["taxonomy", data.taxonomy], ["contentAssets", [...existingByUrl.values()]], ["topicClusters", data.topicClusters], ["initialSources", nextSources]
].map(([name, value]) => `export const ${name} = ${JSON.stringify(value, null, 2)};\n`).join("\n");
await fs.writeFile("src/data.js", out);
await fs.writeFile("data.js", out);
const report = { lastRunAt: now, seedUrlCount: seedUrls.length, discoveredUrlCount: discovered.length, fetchedPageCount: seedPages.length + discoveredPages.length, assetCount: existingByUrl.size, newCandidateCount: Math.max(0, existingByUrl.size - data.contentAssets.length), errors };
await fs.writeFile("crawl-report.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));