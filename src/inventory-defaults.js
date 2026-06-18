import { contentAssets, taxonomy } from "./data.js";

const LEGACY_TOPIC = "content-atlas-current-topic";
const MODE_KEY = "content-atlas-topic-mode";
const RESET_KEY = "content-atlas-topic-reset-v2";
let queued = false;

const text = (node) => node?.textContent?.trim() || "";
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const dateValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const assetDate = (asset) => dateValue(asset.created_at || asset.updated_at || asset.last_seen_date || asset.last_crawled_date || asset.published_date);
const topicMatches = (asset, topic) => {
  if (!topic || topic === "__all__") return true;
  const haystack = [asset.primary_topic, ...(asset.secondary_topics || []), asset.title, asset.summary, asset.raw_text].join(" ").toLowerCase();
  const needle = topic.toLowerCase();
  return haystack.includes(needle) || (needle === "scams" && haystack.includes("scam"));
};

function oneTimeReset() {
  if (localStorage.getItem(RESET_KEY) === "done") return;
  localStorage.removeItem(LEGACY_TOPIC);
  localStorage.setItem(MODE_KEY, "__all__");
  localStorage.setItem(RESET_KEY, "done");
}
function mode() {
  return localStorage.getItem(MODE_KEY) || "__all__";
}
function setMode(value) {
  localStorage.setItem(MODE_KEY, value || "__all__");
  localStorage.setItem(LEGACY_TOPIC, value && value !== "__all__" ? value : "Cybersecurity");
}
function styles() {
  if (document.querySelector("#inventory-defaults-style")) return;
  const tag = document.createElement("style");
  tag.id = "inventory-defaults-style";
  tag.textContent = `
    .nav-button span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nav-label{white-space:nowrap}.ui-topic-select option[value="__all__"]{font-weight:800}.content-stage[data-topic-mode="all"] .topic-icon{background:linear-gradient(145deg,#fff,#f5f7fb);color:#344054}
  `;
  document.head.appendChild(tag);
}
function patchSelect() {
  const select = document.querySelector(".ui-topic-select");
  if (!select) return;
  const current = mode();
  const html = [`<option value="__all__">All topics</option>`, ...taxonomy.topics.map((topic) => `<option value="${esc(topic)}">${esc(topic)}</option>`)].join("");
  if (select.dataset.inventoryDefault !== "true") {
    select.innerHTML = html;
    select.dataset.inventoryDefault = "true";
  }
  select.value = [...select.options].some((option) => option.value === current) ? current : "__all__";
  const isAll = select.value === "__all__";
  document.querySelector(".content-stage")?.setAttribute("data-topic-mode", isAll ? "all" : "topic");
  document.querySelectorAll(".breadcrumb strong").forEach((node) => { node.textContent = isAll ? "All topics" : select.value; });
  const copy = document.querySelector(".topic-hero p");
  if (copy) copy.textContent = isAll ? "All English-language Mastercard content" : `All English-language Mastercard content tagged to ${select.value}`;
}
function clearSearchForAll() {
  const input = document.querySelector("#global-search");
  if (!input || mode() !== "__all__") return;
  if (input.value) {
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
function patchCards() {
  const list = document.querySelector(".result-list");
  if (!list) return;
  const current = mode();
  const map = new Map(contentAssets.map((asset) => [asset.id, asset]));
  const cards = [...list.querySelectorAll(".result-card[data-select-detail]")];
  let visible = 0;
  cards.forEach((card) => {
    const asset = map.get(card.dataset.selectDetail);
    const show = !asset || topicMatches(asset, current);
    card.style.display = show ? "" : "none";
    if (show) visible += 1;
  });
  cards.sort((a, b) => {
    const ad = assetDate(map.get(a.dataset.selectDetail))?.getTime() || 0;
    const bd = assetDate(map.get(b.dataset.selectDetail))?.getTime() || 0;
    return bd - ad;
  }).forEach((card) => list.appendChild(card));
  [...document.querySelectorAll(".content-tabs button")].forEach((button) => {
    if (text(button).startsWith("All Content")) button.innerHTML = `All Content <span>(${visible})</span>`;
  });
  const sort = document.querySelector("#sort-select");
  if (sort && sort.value !== "Recently Added") {
    sort.value = "Recently Added";
  }
}
function patch() {
  oneTimeReset();
  styles();
  patchSelect();
  clearSearchForAll();
  patchCards();
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
  const select = event.target.closest(".ui-topic-select");
  if (!select) return queue();
  event.preventDefault();
  event.stopImmediatePropagation();
  setMode(select.value);
  const input = document.querySelector("#global-search");
  if (input) {
    input.value = select.value === "__all__" ? "" : select.value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
  queue();
}, true);

document.addEventListener("click", (event) => {
  const nav = event.target.closest(".nav-button");
  const tab = event.target.closest(".content-tabs button");
  if ((nav && text(nav).includes("Content Explorer")) || (tab && text(tab).startsWith("All Content"))) {
    setMode("__all__");
    setTimeout(queue, 0);
  }
  queue();
}, true);
["input", "keyup"].forEach((eventName) => document.addEventListener(eventName, queue, true));
new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
queue();
