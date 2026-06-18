import { contentAssets, taxonomy } from "./data.js";

const OVERRIDE_KEY = "content-atlas-asset-overrides";
const FILTER_KEY = "content-atlas-quality-filter";
let queued = false;

const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const text = (node) => node?.textContent?.trim() || "";
const readJson = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const getAssets = () => {
  const overrides = readJson(OVERRIDE_KEY, {});
  return contentAssets.map((asset) => ({ ...asset, ...(overrides[asset.id] || {}) }));
};
const tokens = (asset) => [asset.title, asset.summary, asset.raw_text, asset.suggested_use, asset.primary_topic, ...(asset.secondary_topics || []), ...(asset.key_claims || []), ...(asset.proof_points || [])].join(" ").toLowerCase();
const has = (asset, pattern) => pattern.test(tokens(asset));
const countStats = (asset) => (tokens(asset).match(/\b\d+\b|%|percent|survey|study|report|research|data|found|according/g) || []).length;
const clamp = (value) => Math.max(1, Math.min(5, value));

function scoreAsset(asset) {
  const proofCount = (asset.proof_points || []).filter((item) => !/^Detected during/i.test(item)).length;
  const claims = (asset.key_claims || []).length;
  const raw = tokens(asset);
  const proof = clamp(1 + Math.min(2, proofCount) + (countStats(asset) >= 2 ? 1 : 0) + (claims >= 2 ? 1 : 0));
  const pov = clamp(2 + (has(asset, /risk|trust|threat|shift|future|new|changing|challenge|why|need|should|protect|resilience/) ? 1 : 0) + (raw.length > 900 ? 1 : 0) + (/(perspective|insight|thought|story|report)/i.test(asset.format || "") ? 1 : 0));
  const conversation = clamp(1 + (has(asset, /problem|risk|trust|fraud|scam|identity|friction|customer|protect|security|uncertain/) ? 1 : 0) + ((asset.audience || []).length ? 1 : 0) + (proof >= 4 ? 1 : 0) + (pov >= 4 ? 1 : 0));
  const campaign = clamp(1 + (/campaign hero|supporting proof|social|executive|report/i.test(asset.content_usefulness || "") ? 2 : 0) + (proof >= 4 ? 1 : 0) + (pov >= 4 ? 1 : 0));
  const sales = clamp(1 + (/sales|follow|proof|product|consideration|sales enablement/i.test([asset.content_usefulness, asset.funnel_stage, asset.format].join(" ")) ? 2 : 0) + (conversation >= 4 ? 1 : 0) + (proof >= 3 ? 1 : 0));
  const total = proof + pov + conversation + campaign + sales;
  const labels = [];
  if (total >= 22 && campaign >= 4) labels.push("Campaign-ready");
  if (proof >= 4) labels.push("Strong proof point");
  if (conversation >= 4) labels.push("Conversation starter");
  if (sales >= 4) labels.push("BD-ready");
  if (pov <= 2) labels.push("Needs sharper POV");
  if (proof <= 2) labels.push("Needs stronger proof");
  if (total < 14) labels.push("Background only");
  if (!labels.length) labels.push("Useful support asset");
  const recommendation = recommend(asset, { proof, pov, conversation, campaign, sales, total, labels });
  return {
    proof,
    pov,
    conversation,
    campaign,
    sales,
    total,
    labels,
    recommendation,
    reasons: {
      pov: pov >= 4 ? "Has a clear point of view or market tension." : "Could use a sharper, more opinionated angle.",
      proof: proof >= 4 ? "Has usable claims, stats or evidence for activation." : "Needs stronger statistics or source-backed proof.",
      conversation: conversation >= 4 ? "Gives BD a credible topic to open with." : "May need a more obvious buyer tension.",
      campaign: campaign >= 4 ? "Can anchor or support a campaign sequence." : "Better as supporting context than a campaign anchor.",
      sales: sales >= 4 ? "Useful for account follow-up or outreach." : "Less immediately useful for BD outreach.",
    },
  };
}
function recommend(asset, score) {
  if (score.total >= 22 && score.campaign >= 4) return "Use as a campaign anchor or first proof asset in a LinkedIn/feed sequence.";
  if (score.proof >= 4 && score.sales >= 4) return "Use as the proof-led second touch in BD outreach or nurture.";
  if (score.conversation >= 4) return "Use as a conversation starter, especially for role-based posts or DMs.";
  if (score.proof <= 2) return "Do not lead with this. Pair it with a stronger proof asset before activation.";
  return "Use as background context or a supporting link after a stronger opener.";
}
function scoreClass(score) {
  if (score.total >= 22) return "high";
  if (score.total >= 16) return "medium";
  return "low";
}
function qualityFilter() {
  return localStorage.getItem(FILTER_KEY) || "all";
}
function passFilter(asset, score, filter) {
  if (filter === "all") return true;
  if (filter === "campaign") return score.campaign >= 4 || score.labels.includes("Campaign-ready");
  if (filter === "bd") return score.sales >= 4 || score.labels.includes("BD-ready");
  if (filter === "proof") return score.proof >= 4;
  if (filter === "conversation") return score.conversation >= 4;
  if (filter === "needs-work") return score.proof <= 2 || score.pov <= 2 || score.total < 14;
  return true;
}
function bar(label, value, reason) {
  return `<div class="quality-row"><span>${esc(label)}</span><div><strong>${value}/5</strong><i style="width:${value * 20}%"></i></div><small>${esc(reason)}</small></div>`;
}
function card(asset) {
  const score = scoreAsset(asset);
  return `<article class="quality-card ${scoreClass(score)}" data-quality-card="${esc(asset.id)}">
    <div class="quality-card-head">
      <div>
        <span>${esc(asset.primary_topic)} · ${esc(asset.format)}</span>
        <h2>${esc(asset.title)}</h2>
      </div>
      <strong>${score.total}/25</strong>
    </div>
    <div class="quality-labels">${score.labels.map((label) => `<em>${esc(label)}</em>`).join("")}</div>
    <p>${esc(score.recommendation)}</p>
    <div class="quality-grid">
      ${bar("Bold enough to post?", score.pov, score.reasons.pov)}
      ${bar("Strong enough to prove?", score.proof, score.reasons.proof)}
      ${bar("Likely to get people talking?", score.conversation, score.reasons.conversation)}
      ${bar("Useful for campaign planning?", score.campaign, score.reasons.campaign)}
      ${bar("Useful enough for BD?", score.sales, score.reasons.sales)}
    </div>
    <div class="quality-actions"><button data-quality-use="${esc(asset.id)}">Use in Campaign Builder</button><button data-quality-find="${esc(asset.title)}">Find in Content Explorer</button></div>
  </article>`;
}
function renderQualityPage(panel) {
  const all = getAssets().map((asset) => ({ asset, score: scoreAsset(asset) })).sort((a, b) => b.score.total - a.score.total);
  const filter = qualityFilter();
  const visible = all.filter(({ asset, score }) => passFilter(asset, score, filter));
  const counts = {
    campaign: all.filter(({ score }) => passFilter(null, score, "campaign")).length,
    bd: all.filter(({ score }) => passFilter(null, score, "bd")).length,
    proof: all.filter(({ score }) => passFilter(null, score, "proof")).length,
    work: all.filter(({ score }) => passFilter(null, score, "needs-work")).length,
  };
  panel.className = "page-panel quality-page";
  panel.innerHTML = `<div class="page-heading"><div><span class="eyebrow">Activation quality</span><h1>Content Quality</h1><p>Score every asset for marketing and BD usefulness, not web-ops hygiene.</p></div><button class="button hot" data-quality-filter="campaign">Show campaign-ready</button></div>
    <section class="quality-summary">
      <div><span>Campaign-ready</span><strong>${counts.campaign}</strong><small>Can anchor or support LinkedIn/feed activation</small></div>
      <div><span>BD-ready</span><strong>${counts.bd}</strong><small>Useful for outreach and follow-up</small></div>
      <div><span>Strong proof</span><strong>${counts.proof}</strong><small>Has usable evidence or statistics</small></div>
      <div><span>Needs work</span><strong>${counts.work}</strong><small>Weak POV, proof or activation value</small></div>
    </section>
    <div class="quality-tabs">
      ${[["all", "All assets"], ["campaign", "Campaign-ready"], ["bd", "BD-ready"], ["proof", "Strong proof"], ["conversation", "Conversation starters"], ["needs-work", "Needs work"]].map(([id, label]) => `<button class="${filter === id ? "active" : ""}" data-quality-filter="${id}">${label}</button>`).join("")}
    </div>
    <div class="quality-list">${visible.map(({ asset }) => card(asset)).join("")}</div>`;
}
function shouldReplace(panel) {
  const h1 = text(panel?.querySelector(".page-heading h1"));
  return /Content Audit|Review Queue|Duplicate Finder|Broken Links|Content Quality/i.test(h1);
}
function patchNav() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    const label = text(button);
    if (label.includes("Content Audit")) button.querySelector("span").textContent = "Content Quality";
    if (/Duplicate Finder|Broken Links|Content Gaps/.test(label)) button.remove();
    if (label.includes("Alerts")) button.remove();
  });
  document.querySelectorAll(".nav-label").forEach((label) => {
    if (text(label) === "Audit") label.textContent = "Evaluate";
  });
}
function patchDetailRail() {
  const rail = document.querySelector(".detail-rail .rail-body");
  const title = text(rail?.querySelector("h2"));
  if (!rail || !title) return;
  const asset = getAssets().find((item) => item.title === title);
  if (!asset) return;
  const score = scoreAsset(asset);
  let cardNode = rail.querySelector(".quality-rail-card");
  if (!cardNode) {
    cardNode = document.createElement("section");
    cardNode.className = "quality-rail-card";
    rail.querySelector(".metadata-card")?.before(cardNode);
  }
  cardNode.innerHTML = `<div><span>Content Quality</span><strong>${score.total}/25</strong></div><p>${esc(score.recommendation)}</p><div>${score.labels.slice(0, 3).map((label) => `<em>${esc(label)}</em>`).join("")}</div>`;
}
function styles() {
  if (document.querySelector("#content-quality-styles")) return;
  const tag = document.createElement("style");
  tag.id = "content-quality-styles";
  tag.textContent = `.quality-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:18px 0 18px}.quality-summary div,.quality-card,.quality-rail-card{border:1px solid #e6eaf0;background:#fff;border-radius:18px;box-shadow:0 12px 30px rgba(15,23,42,.04)}.quality-summary div{padding:16px}.quality-summary span,.quality-card-head span,.quality-rail-card span{display:block;color:#647084;font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:800}.quality-summary strong{display:block;margin:8px 0 4px;font-size:30px}.quality-summary small{color:#647084}.quality-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 18px}.quality-tabs button{border:1px solid #dce3ed;background:#fff;border-radius:999px;padding:9px 12px;font:inherit;font-weight:800;color:#344054}.quality-tabs button.active{border-color:#ff3b18;background:#fff1ed;color:#ff3b18}.quality-list{display:grid;gap:14px}.quality-card{padding:18px}.quality-card.high{border-color:rgba(22,163,74,.25)}.quality-card.medium{border-color:rgba(255,138,0,.25)}.quality-card.low{border-color:rgba(255,59,24,.25)}.quality-card-head{display:flex;justify-content:space-between;gap:18px}.quality-card-head h2{margin:5px 0 0;font-size:20px}.quality-card-head>strong{font-size:26px}.quality-card p{color:#526078;line-height:1.45}.quality-labels,.quality-actions,.quality-rail-card div:last-child{display:flex;gap:8px;flex-wrap:wrap}.quality-labels em,.quality-rail-card em{font-style:normal;border-radius:999px;background:#fff1ed;color:#ff3b18;padding:5px 8px;font-size:12px;font-weight:800}.quality-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:14px}.quality-row{border:1px solid #edf0f5;border-radius:14px;padding:11px;background:#fbfcfe}.quality-row span{display:block;font-weight:800;font-size:13px}.quality-row div{position:relative;height:8px;border-radius:999px;background:#e8edf5;margin:10px 0 8px}.quality-row div strong{position:absolute;right:0;top:-22px;font-size:12px}.quality-row i{display:block;height:8px;border-radius:999px;background:#ff3b18}.quality-row small{display:block;color:#647084;line-height:1.35}.quality-actions{margin-top:14px}.quality-actions button{border:1px solid #dce3ed;background:#fff;border-radius:12px;padding:9px 11px;font:inherit;font-weight:800}.quality-rail-card{padding:14px;margin-bottom:14px}.quality-rail-card div:first-child{display:flex;align-items:center;justify-content:space-between}.quality-rail-card strong{font-size:22px}.quality-rail-card p{color:#526078;margin:8px 0 10px}@media(max-width:1200px){.quality-summary,.quality-grid{grid-template-columns:1fr 1fr}}@media(max-width:760px){.quality-summary,.quality-grid{grid-template-columns:1fr}}`;
  document.head.appendChild(tag);
}
function clickNav(label) {
  const button = [...document.querySelectorAll(".nav-button")].find((item) => text(item).includes(label));
  button?.click();
}
function patch() {
  styles();
  patchNav();
  patchDetailRail();
  const panel = document.querySelector(".page-panel");
  if (panel && shouldReplace(panel) && !panel.classList.contains("quality-page")) renderQualityPage(panel);
}
function queue() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; patch(); });
}

document.addEventListener("click", (event) => {
  const filter = event.target.closest("[data-quality-filter]");
  if (filter) {
    event.preventDefault(); event.stopImmediatePropagation();
    localStorage.setItem(FILTER_KEY, filter.dataset.qualityFilter);
    const panel = document.querySelector(".quality-page");
    if (panel) renderQualityPage(panel);
    return;
  }
  const use = event.target.closest("[data-quality-use]");
  if (use) {
    event.preventDefault(); event.stopImmediatePropagation();
    clickNav("Campaign Planner");
    return;
  }
  const find = event.target.closest("[data-quality-find]");
  if (find) {
    event.preventDefault(); event.stopImmediatePropagation();
    clickNav("Content Explorer");
    setTimeout(() => {
      const input = document.querySelector("#global-search");
      if (input) { input.value = find.dataset.qualityFind; input.dispatchEvent(new Event("input", { bubbles: true })); }
    }, 60);
  }
}, true);
new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
queue();
