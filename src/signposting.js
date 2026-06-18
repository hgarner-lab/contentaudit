import { clientConfig, contentAssets, initialSources } from "./data.js";

const overridesKey = "content-atlas-asset-overrides";
let queued = false;

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const assets = () => {
  const overrides = read(overridesKey, {});
  return contentAssets.map((asset) => ({ ...asset, ...(overrides[asset.id] ?? {}) }));
};
const date = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const dayDiff = (later, earlier) => {
  const a = new Date(later);
  const b = new Date(earlier);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.floor((a - b) / 86400000);
};
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const needsReview = (asset) => asset.metadata_status === "AI suggested" || asset.url_status !== "Accessible";

function latestDate(items = assets()) {
  const values = [
    clientConfig.lastSeededAt,
    ...initialSources.map((source) => source.last_checked),
    ...items.flatMap((asset) => [asset.created_at, asset.updated_at, asset.last_seen_date, asset.last_crawled_date]),
  ].map(date).filter(Boolean);
  return values.length ? new Date(Math.max(...values.map((item) => item.getTime()))) : null;
}

function relative(value) {
  const parsed = date(value);
  if (!parsed) return "pending crawl";
  const diff = dayDiff(new Date(), parsed);
  if (diff <= 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff} days ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(parsed);
}

function newThisWeek(items = assets()) {
  const reference = latestDate(items) ?? new Date();
  return items.filter((asset) => {
    const seen = date(asset.created_at || asset.published_date || asset.last_seen_date);
    if (!seen) return false;
    const diff = dayDiff(reference, seen);
    return diff >= 0 && diff <= 7;
  }).length;
}

function activeAsset() {
  const items = assets();
  const selectedId = document.querySelector(".result-card.selected")?.dataset.selectDetail;
  if (selectedId) return items.find((asset) => asset.id === selectedId) ?? null;
  const title = document.querySelector(".detail-rail .rail-body h2")?.textContent?.trim();
  return title ? items.find((asset) => asset.title === title) ?? null : null;
}

function styles() {
  if (document.querySelector("#atlas-signposting-styles")) return;
  const tag = document.createElement("style");
  tag.id = "atlas-signposting-styles";
  tag.textContent = `
    .next-action-coach{display:grid;grid-template-columns:minmax(0,1fr)auto;gap:18px;align-items:center;margin:8px 0 24px;padding:16px 18px;border:1px solid rgba(255,59,24,.18);border-radius:22px;background:linear-gradient(135deg,#fff 0%,#fff8f5 58%,#fff 100%);box-shadow:0 18px 48px rgba(255,59,24,.06)}
    .next-action-copy{display:flex;gap:14px;align-items:flex-start}.coach-orb{width:38px;height:38px;border-radius:16px;display:grid;place-items:center;background:#fff1ed;color:#ff3b18;font-weight:900;flex:0 0 auto}
    .next-action-coach span,.review-coach-card span{color:#647084}.next-action-coach h3,.review-coach-card h3{margin:0;color:#0c111d}.next-action-coach p,.review-coach-card p{margin:4px 0 0;color:#526078;line-height:1.45}.coach-actions,.coach-link-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
    .coach-button{border:1px solid #dce3ed;background:#fff;border-radius:12px;padding:10px 12px;font:inherit;font-weight:700;color:#0c111d;cursor:pointer}.coach-button.primary{border-color:#ff3b18;background:#ff3b18;color:#fff;box-shadow:0 10px 22px rgba(255,59,24,.18)}
    .review-coach-card{margin:0 0 18px;padding:16px;border:1px solid #e6eaf0;border-radius:18px;background:linear-gradient(180deg,#fff 0%,#fbfcfe 100%)}.review-coach-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.review-coach-head em{border-radius:999px;background:#fff1ed;color:#ff3b18;padding:5px 9px;font-size:11px;font-style:normal;font-weight:800;white-space:nowrap}
    .coach-step-list{display:grid;gap:9px;margin:14px 0}.coach-step{display:grid;grid-template-columns:26px minmax(0,1fr)auto;gap:10px;align-items:start;padding:10px;border:1px solid #edf0f5;border-radius:14px;background:#fff}.coach-step strong{color:#0c111d;display:block;margin-bottom:2px}.coach-step small{color:#647084;line-height:1.35}.coach-step-number{width:24px;height:24px;border-radius:10px;display:grid;place-items:center;background:#f3f6fa;color:#526078;font-size:12px;font-weight:900}.coach-state{border-radius:999px;padding:4px 7px;background:#ecfdf3;color:#11803b;font-size:11px;font-weight:800;white-space:nowrap}.coach-state.warn{background:#fff1ed;color:#ff3b18}
    @media (max-width:1100px){.next-action-coach{grid-template-columns:1fr}.coach-step{grid-template-columns:26px minmax(0,1fr)}.coach-state{grid-column:2;width:max-content}}
  `;
  document.head.appendChild(tag);
}

function nextActionCoach() {
  const stage = document.querySelector(".content-stage");
  const results = stage?.querySelector(".results-shell");
  if (!stage || !results) return;
  let card = stage.querySelector(".next-action-coach");
  if (!card) {
    card = document.createElement("section");
    card.className = "next-action-coach";
    results.before(card);
  }
  const items = assets();
  const review = items.filter(needsReview).length;
  const sourceIssues = items.filter((asset) => asset.url_status !== "Accessible").length;
  const fresh = newThisWeek(items);
  const latest = latestDate(items);
  const issueCopy = sourceIssues ? `${sourceIssues} source issue${sourceIssues === 1 ? "" : "s"} to check` : "No source issues flagged";
  const copy = review ? `Review ${review} AI-suggested or source-flagged item${review === 1 ? "" : "s"} before using them in planning.` : "No review queue right now. Move into gap analysis or campaign planning.";
  card.innerHTML = `
    <div class="next-action-copy">
      <div class="coach-orb">→</div>
      <div><span>Next best action · Latest crawl: ${esc(relative(latest))}</span><h3>${review ? "Review new content before activation" : "Move from inventory to activation"}</h3><p>${esc(copy)} ${fresh} new in the last 7 days · ${esc(issueCopy)}.</p></div>
    </div>
    <div class="coach-actions"><button class="coach-button primary" data-coach-action="review-candidates">Review candidates</button><button class="coach-button" data-coach-action="open-audit">Open audit</button><button class="coach-button" data-coach-action="build-campaign">Build pack</button></div>
  `;
}

const statePill = (label, good) => `<span class="coach-state ${good ? "" : "warn"}">${esc(label)}</span>`;

function reviewCoach() {
  const rail = document.querySelector(".detail-rail .rail-body");
  const metadata = rail?.querySelector(".metadata-card");
  const asset = activeAsset();
  if (!rail || !metadata || !asset) return;
  let card = rail.querySelector(".review-coach-card");
  if (!card) {
    card = document.createElement("section");
    card.className = "review-coach-card";
    metadata.after(card);
  }
  const metadataOk = asset.metadata_status === "Human approved" || asset.metadata_status === "Human edited";
  const sourceOk = asset.url_status === "Accessible";
  const ready = metadataOk && sourceOk;
  const audience = asset.audience?.slice(0, 2).join(", ") || "Audience to confirm";
  card.innerHTML = `
    <div class="review-coach-head"><div><span>Review coach</span><h3>${ready ? "Ready to activate" : "Check before using"}</h3><p>Use this as the quick human review path for the selected asset.</p></div><em>${esc(asset.metadata_status)}</em></div>
    <div class="coach-step-list">
      <div class="coach-step"><span class="coach-step-number">1</span><div><strong>Confirm the AI read</strong><small>${esc(asset.primary_topic)} · ${esc(asset.funnel_stage)} · ${esc(audience)}</small></div>${statePill(metadataOk ? "Reviewed" : "Needs review", metadataOk)}</div>
      <div class="coach-step"><span class="coach-step-number">2</span><div><strong>Check the source</strong><small>${esc(asset.url_status)} · ${esc(asset.platform || "mastercard.com")}</small></div>${statePill(sourceOk ? "Source OK" : "Check URL", sourceOk)}</div>
      <div class="coach-step"><span class="coach-step-number">3</span><div><strong>Decide the activation use</strong><small>${esc(asset.content_usefulness)} · ${esc(asset.business_area)}</small></div>${statePill(ready ? "Use now" : "Hold", ready)}</div>
    </div>
    <div class="coach-link-row"><button class="coach-button primary" data-coach-action="review-metadata">Review metadata</button><button class="coach-button" data-coach-action="add-to-campaign">Add to campaign</button><button class="coach-button" data-coach-action="open-source">Open source</button></div>
  `;
}

function patch() {
  styles();
  nextActionCoach();
  reviewCoach();
}

function queue() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    patch();
  });
}

function clickView(name) {
  document.querySelector(`[data-view="${name}"]`)?.click();
}

function handleAction(action) {
  const asset = activeAsset();
  if (action === "review-candidates") {
    const sort = document.querySelector("#sort-select");
    if (sort) {
      sort.value = "Needs Review";
      sort.dispatchEvent(new Event("change", { bubbles: true }));
    }
    setTimeout(() => {
      const candidate = assets().find(needsReview);
      const card = candidate ? document.querySelector(`[data-select-detail="${candidate.id}"]`) : null;
      card?.click();
      card?.scrollIntoView({ behavior: "smooth", block: "center" });
      queue();
    }, 0);
  }
  if (action === "open-audit") clickView("audit");
  if (action === "build-campaign") clickView("campaign");
  if (action === "review-metadata") document.querySelector(".metadata-card [data-view='detail']")?.click();
  if (action === "add-to-campaign" && asset) document.querySelector(`button[data-toggle-select="${asset.id}"]`)?.click();
  if (action === "open-source" && asset?.url) window.open(asset.url, "_blank", "noreferrer");
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-coach-action]");
  if (!button) {
    queue();
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  handleAction(button.dataset.coachAction);
  queue();
}, true);
["change", "input"].forEach((eventName) => document.addEventListener(eventName, queue, true));
queue();
