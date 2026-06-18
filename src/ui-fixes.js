import { contentAssets, taxonomy } from "./data.js";

const OVERRIDES = "content-atlas-asset-overrides";
const TOPIC = "content-atlas-current-topic";
let queued = false;

const readJson = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const assets = () => {
  const overrides = readJson(OVERRIDES, {});
  return contentAssets.map((asset) => ({ ...asset, ...(overrides[asset.id] || {}) }));
};
const byId = () => new Map(assets().map((asset) => [asset.id, asset]));
const txt = (node) => node?.textContent?.trim() || "";
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const dateValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const assetDate = (asset) => dateValue(asset.created_at || asset.updated_at || asset.last_seen_date || asset.last_crawled_date || asset.published_date);
const dayDiff = (later, earlier) => {
  const a = new Date(later);
  const b = new Date(earlier);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.floor((a - b) / 86400000);
};
const relative = (date) => {
  if (!date) return "Needs date";
  const diff = dayDiff(new Date(), date);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
};
const currentTopic = () => localStorage.getItem(TOPIC) || document.querySelector(".ui-topic-select")?.value || "Cybersecurity";
const topicMatches = (asset, topic = currentTopic()) => {
  if (!topic) return true;
  const values = [asset.primary_topic, ...(asset.secondary_topics || []), asset.title, asset.summary, asset.raw_text].join(" ").toLowerCase();
  const needle = topic.toLowerCase();
  if (needle === "cybersecurity") return /cyber|fraud|identity|auth|risk|trust|scam|token|threat|quantum|security/.test(values);
  return values.includes(needle) || (needle === "scams" && values.includes("scam"));
};

function style() {
  if (document.querySelector("#ui-fixes-style")) return;
  const tag = document.createElement("style");
  tag.id = "ui-fixes-style";
  tag.textContent = `
    .result-tools [data-toggle-select]{display:none!important}.source-registry-note{border:1px solid #e6eaf0;border-radius:16px;background:#fff;padding:14px 16px;margin:0 0 16px;color:#647084}.source-registry-note strong{display:block;color:#0c111d;margin-bottom:4px}.metric[data-content-use="true"] .donut{box-shadow:inset 0 0 0 1px rgba(15,23,42,.06)}
  `;
  document.head.appendChild(tag);
}

function patchTopicSwitching() {
  const select = document.querySelector(".ui-topic-select");
  if (!select) return;
  const stored = currentTopic();
  if (stored && [...select.options].some((option) => option.value === stored)) select.value = stored;
  const input = document.querySelector("#global-search");
  if (input && input.value !== select.value && taxonomy.topics.includes(select.value)) {
    input.value = select.value;
  }
  document.querySelectorAll(".breadcrumb strong").forEach((node) => { node.textContent = select.value; });
  const heroCopy = document.querySelector(".topic-hero p");
  if (heroCopy) heroCopy.textContent = `All English-language Mastercard content tagged to ${select.value}`;
}

function filterAndSortCards() {
  const list = document.querySelector(".result-list");
  if (!list) return;
  const map = byId();
  const topic = currentTopic();
  const cards = [...list.querySelectorAll(".result-card[data-select-detail]")];
  let visible = 0;
  cards.forEach((card) => {
    const asset = map.get(card.dataset.selectDetail);
    const show = !asset || topicMatches(asset, topic);
    card.style.display = show ? "" : "none";
    if (show) visible += 1;
    const age = card.querySelector(".result-meta span:last-child");
    if (asset && age) age.textContent = relative(assetDate(asset));
  });
  cards.sort((a, b) => {
    const ad = assetDate(map.get(a.dataset.selectDetail))?.getTime() || 0;
    const bd = assetDate(map.get(b.dataset.selectDetail))?.getTime() || 0;
    return bd - ad;
  }).forEach((card) => list.appendChild(card));
  const allTab = [...document.querySelectorAll(".content-tabs button")].find((button) => txt(button).startsWith("All Content"));
  if (allTab) allTab.innerHTML = `All Content <span>(${visible})</span>`;
}

function takeOverNextActions() {
  document.querySelectorAll("[data-coach-action]").forEach((button) => {
    button.dataset.uiCoachAction = button.dataset.coachAction;
    button.removeAttribute("data-coach-action");
  });
}
function triggerAudit(mode) {
  const temp = document.createElement("button");
  temp.hidden = true;
  temp.dataset.uiAuditMode = mode;
  document.body.appendChild(temp);
  temp.click();
  temp.remove();
}
function clickNav(label) {
  const button = [...document.querySelectorAll(".nav-button")].find((item) => txt(item).includes(label));
  button?.click();
}

function contentUseLabel(asset) {
  const value = asset.content_usefulness || asset.funnel_stage || "Other";
  if (/hero/i.test(value)) return "Hero";
  if (/proof|report|statistic/i.test(value)) return "Proof";
  if (/sales|follow/i.test(value)) return "Sales follow-up";
  if (/social|executive/i.test(value)) return "Social/POV";
  if (/background/i.test(value)) return "Background";
  if (/thought/i.test(asset.funnel_stage || "")) return "Thought leadership";
  return value.replace(" asset", "");
}
function patchUseDonut() {
  const metrics = [...document.querySelectorAll(".metric")];
  const metric = metrics.find((item) => txt(item.querySelector("span")) === "Formats" || txt(item.querySelector("span")) === "Content Uses");
  if (!metric) return;
  metric.dataset.contentUse = "true";
  const label = metric.querySelector("span");
  const strong = metric.querySelector("strong");
  const small = metric.querySelector("small");
  if (label) label.textContent = "Content Uses";
  const counts = assets().reduce((acc, asset) => {
    const key = contentUseLabel(asset);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (strong) strong.textContent = entries.length;
  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1;
  const colors = ["#ff3b18", "#2563eb", "#16a34a", "#ff8a00", "#8b5cf6", "#14b8a6"];
  let start = 0;
  const gradient = entries.map(([, count], index) => {
    const end = start + (count / total) * 100;
    const item = `${colors[index % colors.length]} ${start}% ${end}%`;
    start = end;
    return item;
  }).join(", ");
  const legend = entries.slice(0, 3).map(([name, count]) => `${name} ${count}`).join(" | ");
  if (small) small.innerHTML = `<div class="donut" style="background:conic-gradient(${gradient})" aria-hidden="true"></div><span class="metric-note">${esc(legend)}</span>`;
}

function simplifySourceRegistry() {
  const panel = document.querySelector(".page-panel");
  if (!panel || txt(panel.querySelector("h1")) !== "Source Registry") return;
  panel.querySelectorAll(".source-export-card").forEach((card) => {
    if (/Make added sources crawlable|Social ingestion status/i.test(txt(card))) card.remove();
  });
  panel.querySelectorAll(".source-card").forEach((card) => {
    const title = txt(card.querySelector("h2"));
    if (/LinkedIn|C-level decision-maker/i.test(title)) card.remove();
  });
  if (!panel.querySelector(".source-registry-note")) {
    const note = document.createElement("div");
    note.className = "source-registry-note";
    note.innerHTML = `<strong>Executive perspectives</strong>C-level or executive thought leadership should come through approved Mastercard newsroom, stories and blog content rather than separate public-profile monitoring.`;
    panel.querySelector(".source-layout")?.before(note);
  }
}

function patch() {
  style();
  patchTopicSwitching();
  filterAndSortCards();
  takeOverNextActions();
  patchUseDonut();
  simplifySourceRegistry();
}
function queue() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    patch();
  });
}

document.addEventListener("change", (event) => {
  const topic = event.target.closest(".ui-topic-select");
  if (topic) {
    localStorage.setItem(TOPIC, topic.value);
    const input = document.querySelector("#global-search");
    if (input) {
      input.value = topic.value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    setTimeout(queue, 0);
  }
}, true);

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-ui-coach-action]");
  if (action) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const name = action.dataset.uiCoachAction;
    if (name === "review-candidates") triggerAudit("review");
    if (name === "open-audit") triggerAudit("all");
    if (name === "build-campaign") clickNav("Campaign Planner");
    return;
  }
  queue();
}, true);

["input", "keyup"].forEach((eventName) => document.addEventListener(eventName, queue, true));
new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
queue();
