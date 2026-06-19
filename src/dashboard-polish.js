import { contentAssets } from "./data.js";

const OVERRIDE_KEY = "content-atlas-asset-overrides";
let queued = false;

const readJson = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const assets = () => {
  const overrides = readJson(OVERRIDE_KEY, {});
  return contentAssets.map((asset) => ({ ...asset, ...(overrides[asset.id] || {}) }));
};
const text = (node) => node?.textContent?.trim() || "";
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

function funnelStageLabel(asset) {
  return asset.funnel_stage || "Unassigned";
}

function styles() {
  if (document.querySelector("#dashboard-polish-styles")) return;
  const tag = document.createElement("style");
  tag.id = "dashboard-polish-styles";
  tag.textContent = `
    .filter-chip.strong,
    .ui-filter-drawer { display: none !important; }
    .filter-bar { gap: 12px !important; }
    .metric[data-funnel-stage="true"] { min-height: 168px; }
    .metric[data-funnel-stage="true"] small { margin-top: 6px !important; }
    .funnel-stage-legend {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 5px 12px;
      margin-top: 10px;
      color: #647084;
      font-size: 12px;
      line-height: 1.25;
    }
    .funnel-stage-legend span {
      display: inline-flex !important;
      align-items: center;
      min-width: 0;
      color: #647084 !important;
      font-size: 12px !important;
      white-space: nowrap;
    }
    .funnel-stage-legend i {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      flex: 0 0 auto;
      margin-right: 6px;
    }
    @media (max-width: 1180px) {
      .funnel-stage-legend { grid-template-columns: 1fr; }
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

function patch() {
  styles();
  removeAllFilters();
  patchFunnelStage();
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
