import { clientConfig, contentAssets, initialSources } from "./data.js";

const storageKeys = {
  assetOverrides: "content-atlas-asset-overrides",
};

const toneCycle = ["executive", "sales", "launch"];
let currentAssetId = null;
let currentToneIndex = 0;
let patchQueued = false;

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function getAssets() {
  const overrides = readJson(storageKeys.assetOverrides, {});
  return contentAssets.map((asset) => ({ ...asset, ...(overrides[asset.id] ?? {}) }));
}

function parseDateValue(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(later, earlier) {
  const a = new Date(later);
  const b = new Date(earlier);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.floor((a - b) / (1000 * 60 * 60 * 24));
}

function formatDate(value) {
  const date = parseDateValue(value);
  if (!date) return "Pending";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function relativeDateLabel(value) {
  const date = parseDateValue(value);
  if (!date) return "Pending";
  const diff = daysBetween(new Date(), date);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 14) return "1 week ago";
  return formatDate(value);
}

function latestCrawlDate(assets = getAssets()) {
  const assetDates = assets.flatMap((asset) => [asset.last_crawled_date, asset.last_seen_date, asset.updated_at, asset.created_at]);
  const sourceDates = initialSources.map((source) => source.last_checked);
  const dates = [clientConfig.lastSeededAt, ...assetDates, ...sourceDates].map(parseDateValue).filter(Boolean);
  return dates.length ? new Date(Math.max(...dates.map((date) => date.getTime()))) : null;
}

function newThisWeekCount(assets = getAssets()) {
  const reference = latestCrawlDate(assets) ?? new Date();
  return assets.filter((asset) => {
    const date = parseDateValue(asset.created_at || asset.published_date || asset.last_seen_date);
    if (!date) return false;
    const diff = daysBetween(reference, date);
    return diff >= 0 && diff <= 7;
  }).length;
}

function alertCount(assets = getAssets()) {
  return assets.filter((asset) => asset.metadata_status === "AI suggested" || asset.url_status !== "Accessible").length;
}

function metricByLabel(label) {
  return [...document.querySelectorAll(".metric")].find((metric) => metric.querySelector("span")?.textContent?.trim() === label);
}

function setMetric(label, value, detailHtml) {
  const metric = metricByLabel(label);
  if (!metric) return;
  const strong = metric.querySelector("strong");
  const small = metric.querySelector("small");
  if (strong) strong.textContent = String(value);
  if (small && detailHtml !== undefined) small.innerHTML = detailHtml;
}

function patchAlertBadges(count) {
  document.querySelectorAll(".nav-button").forEach((button) => {
    if (!button.textContent.includes("Alerts")) return;
    let badge = button.querySelector("em");
    if (!badge) {
      badge = document.createElement("em");
      button.appendChild(badge);
    }
    badge.textContent = String(count);
  });

  const topbarBadge = document.querySelector('.topbar .icon-button[aria-label="Alerts"] em');
  if (topbarBadge) topbarBadge.textContent = String(count);
}

function patchDashboardMetrics() {
  const assets = getAssets();
  const newThisWeek = newThisWeekCount(assets);
  const latest = latestCrawlDate(assets);
  const formatCount = new Set(assets.map((asset) => asset.format).filter(Boolean)).size;
  const alerts = alertCount(assets);

  setMetric("Total Assets", assets.length, `<span class="up">+${newThisWeek}</span> new in last 7 days`);
  setMetric("New This Week", newThisWeek);
  setMetric("Formats", formatCount);
  setMetric("Last Updated", latest ? relativeDateLabel(latest) : "Pending", '<span class="live-dot"></span> Crawl-aware');
  patchAlertBadges(alerts);
}

function queuePatch() {
  if (patchQueued) return;
  patchQueued = true;
  requestAnimationFrame(() => {
    patchQueued = false;
    patchDashboardMetrics();
  });
}

function getActiveAsset() {
  const title = document.querySelector(".detail-rail .rail-body h2")?.textContent?.trim();
  if (!title) return null;
  return contentAssets.find((asset) => asset.title === title) ?? null;
}

function setLinkedInCopy(asset, tone) {
  const copyBox = document.querySelector(".linkedin-card .copy-box");
  const copy = asset?.linkedin_copy_recommendations?.[tone];
  if (!copyBox || !copy) return;
  copyBox.textContent = copy;
}

function refreshToneState(asset) {
  if (!asset) return;
  if (asset.id !== currentAssetId) {
    currentAssetId = asset.id;
    currentToneIndex = 0;
  }
}

document.addEventListener(
  "click",
  (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const label = button.textContent.trim().toLowerCase();
    const asset = getActiveAsset();

    if (asset) {
      refreshToneState(asset);

      if (label.includes("alternative tone")) {
        event.preventDefault();
        currentToneIndex = (currentToneIndex + 1) % toneCycle.length;
        setLinkedInCopy(asset, toneCycle[currentToneIndex]);
      }

      if (label.includes("shorter version")) {
        event.preventDefault();
        currentToneIndex = -1;
        setLinkedInCopy(asset, "short");
      }

      if (label.includes("copy all")) {
        const copyBox = document.querySelector(".linkedin-card .copy-box");
        if (!copyBox) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        navigator.clipboard?.writeText(copyBox.textContent.trim());
      }
    }

    queuePatch();
  },
  true,
);

["change", "input"].forEach((eventName) => document.addEventListener(eventName, queuePatch, true));
window.addEventListener("popstate", queuePatch);
queuePatch();
