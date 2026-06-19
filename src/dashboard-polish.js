import { contentAssets } from "./data.js";

const OVERRIDE_KEY = "content-atlas-asset-overrides";
let queued = false;
let crawlReport = null;

const readJson = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const assets = () => {
  const overrides = readJson(OVERRIDE_KEY, {});
  return contentAssets.map((asset) => ({ ...asset, ...(overrides[asset.id] || {}) }));
};
const text = (node) => node?.textContent?.trim() || "";
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

fetch("./crawl-report.json", { cache: "no-store" })
  .then((response) => response.ok ? response.json() : null)
  .then((report) => { crawlReport = report; queue(); })
  .catch(() => {});

function funnelStageLabel(asset) {
  return asset.funnel_stage || "Unassigned";
}
function formatLabel(asset) {
  const value = [asset.format, asset.source_type].join(" ").toLowerCase();
  if (/solution|product|website|page|hub/.test(value)) return "Solution pages";
  if (/report|whitepaper|research|study/.test(value)) return "Reports";
  if (/news|press|article|story|insight|blog/.test(value)) return "Articles/news";
  if (/video|webinar|podcast/.test(value)) return "Video/audio";
  if (/social|linkedin/.test(value)) return "Social";
  return asset.format || "Other";
}
function isLiveAsset(asset) {
  return !/broken|inaccessible|archived|removed/i.test(asset.url_status || "");
}
function relativeDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Recently";
  const diff = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}
function newThisWeekCount() {
  if (crawlReport && Number.isFinite(Number(crawlReport.newCandidateCount))) return Number(crawlReport.newCandidateCount);
  const now = Date.now();
  return assets().filter((asset) => {
    const date = asset.created_at ? new Date(asset.created_at) : null;
    return date && !Number.isNaN(date.getTime()) && (now - date.getTime()) <= 7 * 86400000;
  }).length;
}

function styles() {
  if (document.querySelector("#dashboard-polish-styles")) return;
  const tag = document.createElement("style");
  tag.id = "dashboard-polish-styles";
  tag.textContent = `
    .filter-chip.strong,
    .ui-filter-drawer { display: none !important; }
    .filter-bar { gap: 12px !important; }
    .metric[data-live-assets="true"] small,
    .metric[data-funnel-stage="true"] small,
    .metric[data-crawl-status="true"] small {
      display: block !important;
      margin-top: 6px !important;
    }
    .metric[data-live-assets="true"] { min-height: 160px; }
    .metric[data-funnel-stage="true"] {
      min-height: 205px;
      overflow: visible !important;
    }
    .metric[data-funnel-stage="true"] .donut {
      width: 62px;
      height: 62px;
      margin: -44px 4px 0 auto;
    }
    .format-breakdown,
    .funnel-stage-legend {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px 12px;
      margin-top: 14px;
      padding-right: 4px;
      color: #647084;
      font-size: 12px;
      line-height: 1.25;
    }
    .format-breakdown span,
    .funnel-stage-legend span {
      display: inline-flex !important;
      align-items: flex-start;
      min-width: 0;
      color: #647084 !important;
      font-size: 12px !important;
      white-space: normal;
      overflow-wrap: anywhere;
    }
    .format-breakdown b {
      color: #0c111d;
      margin-left: 4px;
    }
    .funnel-stage-legend i {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      flex: 0 0 auto;
      margin: 4px 6px 0 0;
    }
    .crawl-status {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px;
      margin-top: 10px !important;
    }
    .crawl-status span {
      display: block !important;
      padding: 8px 9px;
      border: 1px solid #edf0f5;
      border-radius: 12px;
      background: #fbfcfe;
      color: #647084 !important;
      font-size: 11px !important;
      line-height: 1.2;
    }
    .crawl-status b {
      display: block;
      color: #0c111d;
      font-size: 13px;
      margin-bottom: 2px;
    }
    .new-week-note {
      display: block !important;
      margin-top: 8px;
      color: #647084 !important;
      font-size: 13px !important;
      line-height: 1.35;
    }
    @media (max-width: 1180px) {
      .format-breakdown,
      .funnel-stage-legend,
      .crawl-status { grid-template-columns: 1fr; }
      .metric[data-funnel-stage="true"] { min-height: 225px; }
    }
  `;
  document.head.appendChild(tag);
}

function removeAllFilters() {
  document.querySelectorAll(".filter-chip.strong").forEach((button) => {
    if (/All Filters/i.test(text(button))) button.remove();
  });
  document.querySelectorAll(".ui-filter-drawer").forEach((drawer) => drawer.remove());
}

function patchLiveAssets() {
  const metric = [...document.querySelectorAll(".metric")].find((item) => ["Total Assets", "Live Assets"].includes(text(item.querySelector("span"))));
  if (!metric) return;
  metric.dataset.liveAssets = "true";
  const liveAssets = assets().filter(isLiveAsset);
  const counts = liveAssets.reduce((acc, asset) => {
    const key = formatLabel(asset);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const label = metric.querySelector("span");
  const strong = metric.querySelector("strong");
  const small = metric.querySelector("small");
  if (label) label.textContent = "Live Assets";
  if (strong) strong.textContent = liveAssets.length;
  if (small) small.innerHTML = `<div class="format-breakdown">${entries.map(([name, count]) => `<span>${esc(name)} <b>${count}</b></span>`).join("")}</div>`;
}

function patchNewThisWeek() {
  const metric = [...document.querySelectorAll(".metric")].find((item) => text(item.querySelector("span")) === "New This Week");
  if (!metric) return;
  const count = newThisWeekCount();
  const strong = metric.querySelector("strong");
  const small = metric.querySelector("small");
  if (strong) strong.textContent = count;
  if (small) {
    const note = count === 0 ? "No new candidates from the latest crawl." : "New candidates surfaced by the crawler.";
    small.innerHTML = `<span class="new-week-note">${note}</span>`;
  }
}

function patchFunnelStage() {
  const metric = [...document.querySelectorAll(".metric")].find((item) => {
    const label = text(item.querySelector("span"));
    return ["Funnel Stage", "Content Uses", "Formats"].includes(label);
  });
  if (!metric) return;
  metric.dataset.funnelStage = "true";
  metric.removeAttribute("data-content-use");
  const label = metric.querySelector("span");
  const strong = metric.querySelector("strong");
  const small = metric.querySelector("small");
  if (label) label.textContent = "Funnel Stage";
  const counts = assets().reduce((acc, asset) => {
    const key = funnelStageLabel(asset);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (strong) strong.textContent = entries.length;
  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1;
  const colors = ["#ff3b18", "#2563eb", "#16a34a", "#ff8a00", "#8b5cf6", "#14b8a6", "#64748b", "#0ea5e9"];
  let start = 0;
  const gradient = entries.map(([, count], index) => {
    const end = start + (count / total) * 100;
    const item = `${colors[index % colors.length]} ${start}% ${end}%`;
    start = end;
    return item;
  }).join(", ");
  const legend = entries.map(([name, count], index) => `<span><i style="background:${colors[index % colors.length]}"></i>${esc(name)} ${count}</span>`).join("");
  if (small) small.innerHTML = `<div class="donut" style="background:conic-gradient(${gradient})" aria-hidden="true"></div><div class="funnel-stage-legend">${legend}</div>`;
}

function patchLastUpdatedSummary() {
  const metric = [...document.querySelectorAll(".metric")].find((item) => text(item.querySelector("span")) === "Last Updated");
  if (!metric) return;
  metric.dataset.crawlStatus = "true";
  const strong = metric.querySelector("strong");
  const small = metric.querySelector("small");
  const report = crawlReport || {};
  const lastRun = report.lastRunAt || report.last_run_at;
  if (strong && lastRun) strong.textContent = relativeDate(lastRun);
  if (!small) return;
  const pages = report.fetchedPageCount ?? report.fetched_page_count ?? "--";
  const candidates = report.newCandidateCount ?? report.new_candidate_count ?? "--";
  const assetsCount = report.assetCount ?? assets().length;
  small.innerHTML = `<div class="crawl-status"><span><b>${esc(pages)}</b>Pages checked</span><span><b>${esc(candidates)}</b>New candidates</span><span><b>${esc(assetsCount)}</b>Total assets</span><span><b>Daily</b>Auto crawl</span></div>`;
}

function patch() {
  styles();
  removeAllFilters();
  patchLiveAssets();
  patchNewThisWeek();
  patchFunnelStage();
  patchLastUpdatedSummary();
}
function queue() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    patch();
  });
}

new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
queue();
