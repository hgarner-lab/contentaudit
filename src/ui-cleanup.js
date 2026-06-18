import { contentAssets, initialSources, taxonomy } from "./data.js";

const AUDIT_KEY = "content-atlas-audit-mode";
const RAIL_KEY = "content-atlas-detail-rail-collapsed";
const CAMPAIGN_KEY = "content-atlas-campaign-selected";
const SOURCE_KEY = "content-atlas-sources";
const OVERRIDE_KEY = "content-atlas-asset-overrides";
let queued = false;
let filterOpen = false;
let auditBypass = false;

const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const text = (node) => node?.textContent?.trim() ?? "";
const setText = (node, value) => { if (node && node.textContent !== String(value)) node.textContent = String(value); };
const setHtml = (node, value) => { if (node && node.innerHTML !== value) node.innerHTML = value; };

function getAssets() {
  const overrides = readJson(OVERRIDE_KEY, {});
  return contentAssets.map((asset) => ({ ...asset, ...(overrides[asset.id] ?? {}) }));
}
function getSources() {
  return readJson(SOURCE_KEY, initialSources);
}
function selectedIds() {
  return readJson(CAMPAIGN_KEY, []);
}
function saveSelected(id) {
  if (!id) return;
  writeJson(CAMPAIGN_KEY, [...new Set([...selectedIds(), id])]);
}
function removeSelected(id) {
  writeJson(CAMPAIGN_KEY, selectedIds().filter((item) => item !== id));
}
function activeAsset() {
  const selectedId = document.querySelector(".result-card.selected")?.dataset.selectDetail;
  if (selectedId) return getAssets().find((asset) => asset.id === selectedId) ?? null;
  const title = text(document.querySelector(".detail-rail .rail-body h2"));
  return title ? getAssets().find((asset) => asset.title === title) ?? null : null;
}
function dateValue(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
function daysBetween(later, earlier) {
  const a = new Date(later);
  const b = new Date(earlier);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.floor((a - b) / 86400000);
}
function assetDate(asset) {
  return dateValue(asset.created_at || asset.published_date || asset.last_seen_date || asset.last_crawled_date);
}
function latestAssetDate(items = getAssets()) {
  const values = items.flatMap((asset) => [asset.created_at, asset.updated_at, asset.last_seen_date, asset.last_crawled_date, asset.published_date]).map(dateValue).filter(Boolean);
  return values.length ? new Date(Math.max(...values.map((item) => item.getTime()))) : new Date();
}
function formatLabel(asset) {
  if (asset.format?.includes("Video")) return "Video";
  if (asset.format?.includes("Report") || asset.format?.includes("White")) return "Report";
  if (asset.format?.includes("Product") || asset.format?.includes("Solution")) return "Website";
  if (asset.format?.includes("Social")) return "Social";
  return "Article";
}
function isSocialAsset(asset) {
  return /social|linkedin|x\.com|twitter|youtube|instagram|video/i.test([asset.format, asset.source_type, asset.platform, asset.url].join(" "));
}
function meaningfulCounts() {
  const items = getAssets();
  const latest = latestAssetDate(items);
  const dayCounts = Array.from({ length: 7 }, (_, index) => {
    const target = new Date(latest);
    target.setDate(latest.getDate() - (6 - index));
    return items.filter((asset) => {
      const d = assetDate(asset);
      return d && daysBetween(target, d) === 0;
    }).length;
  });
  const byFormat = items.reduce((acc, asset) => {
    const label = formatLabel(asset);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  return { items, dayCounts, byFormat, social: items.filter(isSocialAsset).length };
}
function sparkline(counts) {
  const max = Math.max(1, ...counts);
  const points = counts.map((count, i) => `${6 + i * 21},${42 - (count / max) * 34}`);
  return `<svg class="sparkline" viewBox="0 0 140 48" role="img" aria-label="New assets by day"><path d="M${points.join(" L")}"/></svg><span class="metric-note">Last 7 crawled days</span>`;
}
function formatDonut(byFormat) {
  const entries = Object.entries(byFormat).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1;
  const colors = ["#2563eb", "#ff3b18", "#16a34a", "#ff8a00", "#8b5cf6", "#14b8a6"];
  let start = 0;
  const gradient = entries.map(([label, count], i) => {
    const end = start + (count / total) * 100;
    const part = `${colors[i % colors.length]} ${start}% ${end}%`;
    start = end;
    return part;
  }).join(", ");
  const top = entries.slice(0, 3).map(([label, count]) => `${label} ${count}`).join(" | ");
  return `<div class="donut" style="background: conic-gradient(${gradient})" aria-hidden="true"></div><span class="metric-note">${esc(top)}</span>`;
}
function crawlerSourceConfig() {
  return {
    sources: getSources()
      .filter((source) => source.url)
      .map((source) => ({
        id: source.id,
        label: source.label,
        cadence: String(source.cadence || "daily").toLowerCase(),
        enabled: source.enabled !== false,
        urls: [source.url],
      })),
  };
}
function download(filename, content, type = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function toast(message) {
  document.querySelector(".ui-toast")?.remove();
  const div = document.createElement("div");
  div.className = "ui-toast";
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 1800);
}

function styles() {
  if (document.querySelector("#ui-cleanup-styles")) return;
  const s = document.createElement("style");
  s.id = "ui-cleanup-styles";
  s.textContent = `
    .user-card,.ui-hidden{display:none!important}.topic-actions{display:none!important}.ui-topic-select{border:0;background:transparent;font:inherit;font-size:1.95rem;font-weight:800;letter-spacing:-.04em;color:#0c111d;max-width:520px;padding:0 26px 0 0;appearance:auto}.topic-hero h1{display:flex;align-items:center;gap:8px}.filter-chip[data-ui-action],.filter-chip.strong{border:1px solid #dce3ed;background:#fff;border-radius:999px}.ui-filter-drawer{display:grid;gap:12px;margin:-14px 0 24px;padding:16px;border:1px solid #e6eaf0;border-radius:18px;background:#fff;box-shadow:0 18px 48px rgba(15,23,42,.06)}.ui-filter-drawer strong{color:#0c111d}.ui-filter-actions{display:flex;gap:10px;flex-wrap:wrap}.ui-filter-actions button,.rail-reopen,.source-export-card button,.saved-proof-card button{border:1px solid #dce3ed;background:#fff;border-radius:12px;padding:9px 11px;font:inherit;font-weight:800;cursor:pointer}.ui-filter-actions button.primary,.source-export-card button.primary,.saved-proof-card button.primary{border-color:#ff3b18;background:#ff3b18;color:#fff}.atlas-workbench.rail-collapsed{grid-template-columns:minmax(0,1fr)!important}.atlas-workbench.rail-collapsed .detail-rail{display:none}.rail-reopen{margin:0 0 18px;background:#fff7f3;border-color:rgba(255,59,24,.2);color:#ff3b18}.rail-nav .ghost-button{font-weight:800}.metadata-row em.ai-suggested{background:#fff1ed;color:#ff3b18}.metadata-row em.human-approved,.metadata-row em.human-edited{background:#ecfdf3;color:#11803b}.metric-note{display:block!important;margin-top:6px!important;color:#647084!important;font-size:.74rem!important}.audit-mode-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 18px}.audit-mode-tabs button{border:1px solid #dce3ed;background:#fff;border-radius:999px;padding:8px 11px;font:inherit;font-weight:800;color:#344054;cursor:pointer}.audit-mode-tabs button.active{border-color:#ff3b18;background:#fff1ed;color:#ff3b18}.source-export-card,.saved-proof-card{border:1px solid #e6eaf0;border-radius:18px;background:#fff;padding:16px;margin:0 0 16px;box-shadow:0 12px 30px rgba(15,23,42,.04)}.source-export-card h2,.saved-proof-card h2{margin:0 0 6px;font-size:17px}.source-export-card p,.saved-proof-card p{margin:0 0 12px;color:#647084;line-height:1.45}.source-export-actions,.saved-proof-list{display:flex;gap:10px;flex-wrap:wrap}.saved-proof-pill{display:grid;gap:4px;text-align:left;max-width:240px}.saved-proof-pill span{font-size:12px;color:#647084}.ui-toast{position:fixed;right:24px;bottom:24px;z-index:20000;background:#0c111d;color:#fff;border-radius:14px;padding:12px 14px;font-weight:800;box-shadow:0 16px 40px rgba(15,23,42,.22)}.social-readiness{border-color:rgba(37,99,235,.18);background:linear-gradient(135deg,#fff,#f7fbff)}@media(max-width:1100px){.ui-topic-select{font-size:1.5rem}.topic-hero{grid-template-columns:48px 1fr}.topic-icon{width:48px;height:48px}.topic-actions{display:none}}
  `;
  document.head.appendChild(s);
}

function removeStaticControls() {
  document.querySelector(".user-card")?.remove();
  document.querySelectorAll(".nav-button").forEach((button) => {
    const label = text(button);
    if (["Saved Views", "Settings"].some((item) => label.includes(item))) button.remove();
  });
  document.querySelectorAll(".filter-chip").forEach((button) => {
    const label = text(button);
    if (label === "Date Range" || label.startsWith("More")) button.remove();
  });
  document.querySelector(".topic-actions")?.remove();
  document.querySelector('.topbar .icon-button[aria-label="Help"]')?.remove();
}

function patchTopicSwitcher() {
  const hero = document.querySelector(".topic-hero");
  const h1 = hero?.querySelector("h1");
  if (!hero || !h1) return;
  const input = document.querySelector("#global-search");
  const current = input?.value || "Cybersecurity";
  if (!h1.querySelector(".ui-topic-select")) {
    const options = taxonomy.topics.map((topic) => `<option ${topic === current ? "selected" : ""}>${esc(topic)}</option>`).join("");
    setHtml(h1, `<select class="ui-topic-select" data-ui-topic>${options}</select>`);
  }
  const select = h1.querySelector(".ui-topic-select");
  if (select && select.value !== current && taxonomy.topics.includes(current)) select.value = current;
  const copy = hero.querySelector("p");
  setText(copy, `All English-language Mastercard content tagged to ${current}`);
  const crumb = document.querySelector(".breadcrumb strong");
  setText(crumb, current);
}

function patchAllFilters() {
  const bar = document.querySelector(".filter-bar");
  const button = [...document.querySelectorAll(".filter-chip.strong")].find((item) => text(item).includes("All Filters"));
  if (!bar || !button) return;
  button.dataset.uiAction = "toggle-filters";
  let drawer = document.querySelector(".ui-filter-drawer");
  if (!filterOpen) {
    drawer?.remove();
    return;
  }
  if (!drawer) {
    drawer = document.createElement("div");
    drawer.className = "ui-filter-drawer";
    bar.after(drawer);
  }
  const selects = [...document.querySelectorAll("[data-filter]")].map((select) => `${select.dataset.filter.replaceAll("_", " ")}: ${select.value}`).join(" | ");
  setHtml(drawer, `<strong>Active filters</strong><span>${esc(selects || "No filters set")}</span><div class="ui-filter-actions"><button class="primary" data-ui-reset-filters>Reset filters</button><button data-ui-audit-mode="review">Open review queue</button><button data-ui-audit-mode="broken">Broken links</button><button data-ui-export-current>Export current results</button></div>`);
}

function patchAlerts() {
  const alertButton = document.querySelector('.topbar .icon-button[aria-label="Alerts"]');
  if (alertButton) alertButton.dataset.uiAuditMode = "review";
  document.querySelectorAll(".nav-button").forEach((button) => {
    const label = text(button);
    if (label.includes("Alerts")) button.dataset.uiAuditMode = "review";
  });
}

function setAuditMode(mode) {
  localStorage.setItem(AUDIT_KEY, mode);
}
function goAudit(mode) {
  setAuditMode(mode);
  const auditButton = [...document.querySelectorAll(".nav-button")].find((button) => text(button).includes("Content Audit"));
  if (!auditButton) return;
  auditBypass = true;
  auditButton.click();
  auditBypass = false;
}
function auditMode() {
  return localStorage.getItem(AUDIT_KEY) || "all";
}
function patchAuditMode() {
  const panel = document.querySelector(".page-panel");
  const heading = panel?.querySelector(".page-heading h1");
  if (!panel || text(heading) !== "Content Audit") return;
  const mode = auditMode();
  const labels = { all: "Content Audit", review: "Review Queue", gaps: "Content Gaps", duplicates: "Duplicate Finder", broken: "Broken Links" };
  setText(heading, labels[mode] || "Content Audit");
  let tabs = panel.querySelector(".audit-mode-tabs");
  if (!tabs) {
    tabs = document.createElement("div");
    tabs.className = "audit-mode-tabs";
    panel.querySelector(".page-heading")?.after(tabs);
  }
  setHtml(tabs, [
    ["all", "All audit items"], ["review", "Review queue"], ["gaps", "Content gaps"], ["duplicates", "Duplicates"], ["broken", "Broken links"]
  ].map(([id, label]) => `<button class="${mode === id ? "active" : ""}" data-ui-audit-mode="${id}">${label}</button>`).join(""));
  let visible = 0;
  panel.querySelectorAll(".finding-card").forEach((card) => {
    const type = text(card.querySelector("span"));
    const show = mode === "all" ||
      (mode === "gaps" && /limited sales activation|gap/i.test(type)) ||
      (mode === "duplicates" && /duplicate|overlap/i.test(type)) ||
      (mode === "broken" && /broken|inaccessible/i.test(type)) ||
      (mode === "review" && !/duplicate/i.test(type));
    card.style.display = show ? "" : "none";
    if (show) visible += 1;
  });
  const sub = panel.querySelector(".page-heading p");
  setText(sub, `${visible} items for marketing review`);
}

function patchRail() {
  const workbench = document.querySelector(".atlas-workbench");
  if (!workbench) return;
  const collapsed = localStorage.getItem(RAIL_KEY) === "true";
  workbench.classList.toggle("rail-collapsed", collapsed);
  const close = document.querySelector('.detail-rail .icon-button[aria-label="Close"]');
  if (close) close.dataset.uiRail = "collapse";
  const back = document.querySelector(".detail-rail .ghost-button");
  if (back) {
    back.dataset.uiRail = "collapse";
    setText(back, "Hide details");
  }
  let reopen = document.querySelector(".rail-reopen");
  if (collapsed && !reopen) {
    reopen = document.createElement("button");
    reopen.className = "rail-reopen";
    reopen.dataset.uiRail = "open";
    reopen.textContent = "Show detail rail";
    document.querySelector(".content-stage")?.prepend(reopen);
  }
  if (!collapsed) reopen?.remove();
}

function patchApprovedLabels() {
  const asset = activeAsset();
  if (!asset) return;
  document.querySelectorAll(".detail-rail .metadata-row em").forEach((em) => {
    const status = asset.metadata_status || "AI suggested";
    setText(em, status);
    em.className = status.toLowerCase().replaceAll(" ", "-");
  });
}

function patchMetrics() {
  const { items, dayCounts, byFormat, social } = meaningfulCounts();
  const totalMetric = [...document.querySelectorAll(".metric")].find((m) => text(m.querySelector("span")) === "Total Assets");
  const newMetric = [...document.querySelectorAll(".metric")].find((m) => text(m.querySelector("span")) === "New This Week");
  const formatMetric = [...document.querySelectorAll(".metric")].find((m) => text(m.querySelector("span")) === "Formats");
  if (totalMetric) {
    setText(totalMetric.querySelector("strong"), items.length);
    setHtml(totalMetric.querySelector("small"), `<span class="up">+${dayCounts.reduce((a, b) => a + b, 0)}</span> from crawler window`);
  }
  if (newMetric) {
    setText(newMetric.querySelector("strong"), dayCounts.reduce((a, b) => a + b, 0));
    setHtml(newMetric.querySelector("small"), sparkline(dayCounts));
  }
  if (formatMetric) {
    setText(formatMetric.querySelector("strong"), Object.keys(byFormat).length);
    setHtml(formatMetric.querySelector("small"), formatDonut(byFormat));
  }
  [...document.querySelectorAll(".content-tabs button")].forEach((button) => {
    if (text(button).startsWith("Social")) setHtml(button, `Social <span>(${social})</span>`);
  });
}

function patchSourceRegistry() {
  const panel = document.querySelector(".page-panel");
  const heading = panel?.querySelector(".page-heading h1");
  if (!panel || text(heading) !== "Source Registry") return;
  if (!panel.querySelector(".source-export-card")) {
    const card = document.createElement("section");
    card.className = "source-export-card";
    card.innerHTML = `<h2>Make added sources crawlable</h2><p>Sources added in this browser are saved locally. The scheduled crawler reads <code>crawler/sources.json</code>, so export this config and commit it to make new sources part of the daily crawl.</p><div class="source-export-actions"><button class="primary" data-ui-source-copy>Copy crawler config</button><button data-ui-source-download>Download crawler/sources.json</button></div>`;
    panel.querySelector(".source-layout")?.before(card);
  }
  if (!panel.querySelector(".social-readiness")) {
    const card = document.createElement("section");
    card.className = "source-export-card social-readiness";
    card.innerHTML = `<h2>Social ingestion status</h2><p>Manual social URLs can be tracked here, but automated LinkedIn ingestion should use the official API with approved organization/member permissions. Public page scraping is not reliable enough for the scheduled crawler.</p>`;
    panel.querySelector(".source-layout")?.before(card);
  }
}

function patchCampaignSavedAssets() {
  const rail = document.querySelector(".flow-proof");
  if (!rail) return;
  const saved = selectedIds().map((id) => getAssets().find((asset) => asset.id === id)).filter(Boolean);
  let card = rail.querySelector(".saved-proof-card");
  if (!saved.length) {
    card?.remove();
    return;
  }
  if (!card) {
    card = document.createElement("section");
    card.className = "saved-proof-card";
    rail.prepend(card);
  }
  setHtml(card, `<h2>Saved campaign assets</h2><p>Bookmark/Add to Campaign now feeds this proof shortlist.</p><div class="saved-proof-list">${saved.map((asset) => `<button class="saved-proof-pill" data-ui-use-proof="${esc(asset.id)}"><strong>${esc(asset.title)}</strong><span>${esc(asset.primary_topic)} | ${esc(asset.format)}</span></button><button data-ui-remove-proof="${esc(asset.id)}">Remove</button>`).join("")}</div>`);
}
function playForAsset(asset) {
  const topics = [asset.primary_topic, ...(asset.secondary_topics || [])].join(" ").toLowerCase();
  if (/scam/.test(topics)) return "scams";
  if (/identity/.test(topics)) return "identity";
  if (/authentication/.test(topics)) return "auth";
  if (/token|data/.test(topics)) return "token";
  if (/threat/.test(topics)) return "threat";
  if (/resilience/.test(topics)) return "resilience";
  if (/ai/.test(topics)) return "ai";
  if (/small/.test(topics)) return "smb";
  if (/quantum/.test(topics)) return "pqc";
  if (/risk/.test(topics)) return "risk";
  return "fraud";
}
function useSavedProof(id) {
  const asset = getAssets().find((item) => item.id === id);
  if (!asset) return;
  const visible = [...document.querySelectorAll(".proof-option")].find((button) => text(button.querySelector("strong")) === asset.title);
  if (visible) {
    visible.click();
    toast("Proof selected");
    return;
  }
  const topic = document.querySelector('[data-flow-input="topic"]');
  if (topic) {
    topic.value = playForAsset(asset);
    topic.dispatchEvent(new Event("change", { bubbles: true }));
    setTimeout(() => {
      const next = [...document.querySelectorAll(".proof-option")].find((button) => text(button.querySelector("strong")) === asset.title);
      next?.click();
      toast(next ? "Proof selected" : "Topic switched; choose proof on the right");
    }, 80);
  }
}

function patch() {
  styles();
  removeStaticControls();
  patchTopicSwitcher();
  patchAllFilters();
  patchAlerts();
  patchAuditMode();
  patchRail();
  patchApprovedLabels();
  patchMetrics();
  patchSourceRegistry();
  patchCampaignSavedAssets();
}
function queue() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    patch();
  });
}

document.addEventListener("click", async (event) => {
  const filterButton = event.target.closest('[data-ui-action="toggle-filters"]');
  if (filterButton) {
    event.preventDefault(); event.stopImmediatePropagation();
    filterOpen = !filterOpen;
    queue();
    return;
  }
  const nav = event.target.closest(".nav-button");
  if (nav && !auditBypass) {
    const label = text(nav);
    if (label.includes("Content Audit")) { event.preventDefault(); event.stopImmediatePropagation(); goAudit("all"); return; }
    if (label.includes("Content Gaps")) { event.preventDefault(); event.stopImmediatePropagation(); goAudit("gaps"); return; }
    if (label.includes("Duplicate Finder")) { event.preventDefault(); event.stopImmediatePropagation(); goAudit("duplicates"); return; }
    if (label.includes("Broken Links")) { event.preventDefault(); event.stopImmediatePropagation(); goAudit("broken"); return; }
    if (label.includes("Alerts")) { event.preventDefault(); event.stopImmediatePropagation(); goAudit("review"); return; }
  }
  const auditButton = event.target.closest("[data-ui-audit-mode]");
  if (auditButton) { event.preventDefault(); event.stopImmediatePropagation(); goAudit(auditButton.dataset.uiAuditMode); return; }
  const railButton = event.target.closest("[data-ui-rail]");
  if (railButton) {
    event.preventDefault(); event.stopImmediatePropagation();
    localStorage.setItem(RAIL_KEY, railButton.dataset.uiRail === "collapse" ? "true" : "false");
    queue(); return;
  }
  const toggle = event.target.closest("[data-toggle-select]");
  if (toggle) saveSelected(toggle.dataset.toggleSelect);
  const reset = event.target.closest("[data-ui-reset-filters]");
  if (reset) {
    event.preventDefault(); event.stopImmediatePropagation();
    document.querySelectorAll("[data-filter]").forEach((select) => { select.value = "All"; select.dispatchEvent(new Event("change", { bubbles: true })); });
    const sort = document.querySelector("#sort-select");
    if (sort) { sort.value = "Recently Added"; sort.dispatchEvent(new Event("change", { bubbles: true })); }
    filterOpen = false;
    queue(); return;
  }
  if (event.target.closest("[data-ui-export-current]")) {
    event.preventDefault(); event.stopImmediatePropagation();
    document.querySelector('[data-action="export"]')?.click(); return;
  }
  if (event.target.closest("[data-ui-source-copy]")) {
    event.preventDefault(); event.stopImmediatePropagation();
    await navigator.clipboard?.writeText(JSON.stringify(crawlerSourceConfig(), null, 2));
    toast("Crawler config copied"); return;
  }
  if (event.target.closest("[data-ui-source-download]")) {
    event.preventDefault(); event.stopImmediatePropagation();
    download("crawler-sources.json", JSON.stringify(crawlerSourceConfig(), null, 2)); return;
  }
  const useProof = event.target.closest("[data-ui-use-proof]");
  if (useProof) { event.preventDefault(); event.stopImmediatePropagation(); useSavedProof(useProof.dataset.uiUseProof); return; }
  const removeProof = event.target.closest("[data-ui-remove-proof]");
  if (removeProof) { event.preventDefault(); event.stopImmediatePropagation(); removeSelected(removeProof.dataset.uiRemoveProof); queue(); return; }
  queue();
}, true);

document.addEventListener("change", (event) => {
  const topic = event.target.closest("[data-ui-topic]");
  if (topic) {
    const input = document.querySelector("#global-search");
    if (input) {
      input.value = topic.value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
  queue();
}, true);
["input", "keyup"].forEach((eventName) => document.addEventListener(eventName, queue, true));
new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
queue();
