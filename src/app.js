import { clientConfig, contentAssets, initialSources, taxonomy, topicClusters } from "./data.js";

const app = document.querySelector("#app");

const storageKeys = {
  assetOverrides: "content-atlas-asset-overrides",
  sources: "content-atlas-sources",
};

const state = {
  view: "dashboard",
  query: "cybersecurity",
  filters: {
    format: "All",
    audience: "All",
    business_area: "All",
    funnel_stage: "All",
  },
  activeTab: "All",
  sort: "Recently Added",
  selectedAssetId: "mc-agentic-security",
  selectedAssetIds: new Set(["mc-agentic-security", "mc-cyber-fraud-risk", "mc-small-business-security"]),
  selectedTopicId: "fraud-prevention",
  linkedinStyle: "executive",
};

const icons = {
  home: '<svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>',
  map: '<svg viewBox="0 0 24 24"><circle cx="7" cy="6" r="2"/><circle cx="17" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8.5 7.5 11 16"/><path d="m15.5 7.5-2.5 8.5"/><path d="M9 6h6"/></svg>',
  calendar: '<svg viewBox="0 0 24 24"><path d="M7 3v4"/><path d="M17 3v4"/><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24"><path d="M6 4h12v17l-6-4-6 4z"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6z"/></svg>',
  target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
  duplicate: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></svg>',
  link: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/></svg>',
  database: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2.1 2.1-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1 1.6V21h-3v-.2a1.8 1.8 0 0 0-1-1.6 1.8 1.8 0 0 0-2 .4l-.1.1-2.1-2.1.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.6-1H4v-3h.2a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.4-2l-.1-.1 2.1-2.1.1.1a1.8 1.8 0 0 0 2 .4 1.8 1.8 0 0 0 1-1.6V3h3v.2a1.8 1.8 0 0 0 1 1.6 1.8 1.8 0 0 0 2-.4l.1-.1 2.1 2.1-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.6 1h.2v3h-.2a1.8 1.8 0 0 0-1.6 1z"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="m6 6 12 12"/><path d="m18 6-12 12"/></svg>',
  external: '<svg viewBox="0 0 24 24"><path d="M14 3h7v7"/><path d="m10 14 11-11"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></svg>',
  users: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  tune: '<svg viewBox="0 0 24 24"><path d="M4 6h10"/><path d="M18 6h2"/><circle cx="16" cy="6" r="2"/><path d="M4 12h2"/><path d="M10 12h10"/><circle cx="8" cy="12" r="2"/><path d="M4 18h12"/><path d="M20 18h0"/><circle cx="18" cy="18" r="2"/></svg>',
  share: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.4"/><path d="m8.7 13.3 6.6 4.4"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  spark: '<svg viewBox="0 0 24 24"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="m18 15 .8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"/></svg>',
};

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getAssets() {
  const overrides = readJson(storageKeys.assetOverrides, {});
  return contentAssets.map((asset) => ({ ...asset, ...(overrides[asset.id] ?? {}) }));
}

function getSources() {
  return readJson(storageKeys.sources, initialSources);
}

function saveAssetPatch(assetId, patch) {
  const overrides = readJson(storageKeys.assetOverrides, {});
  overrides[assetId] = { ...(overrides[assetId] ?? {}), ...patch, updated_at: new Date().toISOString() };
  writeJson(storageKeys.assetOverrides, overrides);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function relativeSeen(asset) {
  if (asset.id === "mc-agentic-security") return "2h ago";
  if (asset.id === "mc-passkeys") return "5h ago";
  if (asset.id === "mc-cyber-fraud-risk") return "1 day ago";
  if (asset.id === "mc-small-business-security") return "3 days ago";
  return asset.published_date ? "1 week ago" : "2h ago";
}

function matchesQuery(asset, query) {
  if (!query.trim()) return true;
  const normalized = query.toLowerCase().trim();
  const securityUmbrella = new Set([
    "Cybersecurity",
    "Fraud prevention",
    "Identity",
    "Authentication",
    "Cyber resilience",
    "Trust",
    "Risk",
    "Data protection",
    "Tokenization",
    "Scams",
    "AI security",
    "Small business security",
    "Post-quantum security",
    "Threat intelligence",
  ]);
  if (["cybersecurity", "cyber security", "security"].includes(normalized)) {
    const topics = [asset.primary_topic, ...asset.secondary_topics];
    return topics.some((topic) => securityUmbrella.has(topic));
  }
  const haystack = [
    asset.title,
    asset.url,
    asset.source_type,
    asset.format,
    asset.region,
    asset.summary,
    asset.raw_text,
    asset.primary_topic,
    asset.secondary_topics.join(" "),
    asset.audience.join(" "),
    asset.business_area,
    asset.funnel_stage,
    asset.key_claims.join(" "),
    asset.proof_points.join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(normalized);
}

function getFilteredAssets() {
  const tabMap = {
    Website: ["Solution page", "Product page"],
    Newsroom: ["Perspective article", "Explainer article", "Blog article"],
    Social: ["Social post", "Video"],
    Reports: ["Report", "White paper", "White paper series"],
  };
  return getAssets()
    .filter((asset) => {
      if (!matchesQuery(asset, state.query)) return false;
      if (state.activeTab !== "All" && !(tabMap[state.activeTab] ?? []).includes(asset.format)) return false;
      return Object.entries(state.filters).every(([key, value]) => {
        if (value === "All") return true;
        const assetValue = asset[key];
        return Array.isArray(assetValue) ? assetValue.includes(value) : assetValue === value;
      });
    })
    .sort((a, b) => {
      if (state.sort === "Highest Score") return assetScore(b) - assetScore(a);
      if (state.sort === "Title") return a.title.localeCompare(b.title);
      if (state.sort === "Needs Review") return Number(b.metadata_status === "AI suggested") - Number(a.metadata_status === "AI suggested");
      return String(b.published_date ?? "").localeCompare(String(a.published_date ?? ""));
    });
}

function getAsset(id) {
  return getAssets().find((asset) => asset.id === id) ?? getAssets()[0];
}

function ageInMonths(value) {
  if (!value) return null;
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return null;
  const now = new Date("2026-06-18T12:00:00Z");
  return (now.getFullYear() - then.getFullYear()) * 12 + now.getMonth() - then.getMonth();
}

function assetScore(asset) {
  const statusBoost = asset.metadata_status === "Human approved" ? 12 : asset.metadata_status === "Human edited" ? 8 : 0;
  const proofBoost = Math.min(asset.proof_points.length * 5, 15);
  const monthsOld = ageInMonths(asset.published_date);
  const freshnessPenalty = monthsOld === null ? 4 : Math.min(monthsOld, 24) * 0.7;
  return Math.max(35, Math.round(asset.ai_confidence_score * 70 + statusBoost + proofBoost - freshnessPenalty));
}

function assetsForCluster(cluster) {
  const clusterTopics = new Set(cluster.topics);
  return getAssets().filter((asset) => [asset.primary_topic, ...asset.secondary_topics].some((topic) => clusterTopics.has(topic)));
}

function formatLabel(asset) {
  if (asset.format.includes("Video")) return "Video";
  if (asset.format.includes("Report") || asset.format.includes("White")) return "Report";
  if (asset.format.includes("Product") || asset.format.includes("Solution")) return "Website";
  return "Article";
}

function sourceDomain(asset) {
  try {
    return new URL(asset.url).hostname.replace("www.", "");
  } catch {
    return asset.platform;
  }
}

function statusClass(status) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function icon(name) {
  return `<span class="icon" aria-hidden="true">${icons[name] ?? ""}</span>`;
}

function renderPill(text, className = "") {
  return `<span class="pill ${className}">${escapeHtml(text)}</span>`;
}

function renderHeader() {
  const groups = [
    {
      label: "",
      items: [["dashboard", "Home", "home"]],
    },
    {
      label: "Discover",
      items: [
        ["inventory", "Content Explorer", "search"],
        ["map", "Topic Maps", "map"],
        ["campaign", "Campaign Planner", "calendar"],
        ["detail", "Saved Views", "bookmark"],
      ],
    },
    {
      label: "Audit",
      items: [
        ["audit", "Content Audit", "shield"],
        ["map", "Content Gaps", "target"],
        ["audit", "Duplicate Finder", "duplicate"],
        ["audit", "Broken Links", "link"],
      ],
    },
    {
      label: "Manage",
      items: [
        ["sources", "Source Registry", "database"],
        ["dashboard", "Alerts", "bell", "6"],
        ["sources", "Settings", "settings"],
      ],
    },
  ];

  return `
    <aside class="sidebar">
      <div class="brand-lockup">
        <div class="brand-mark" aria-hidden="true"><span></span><span></span></div>
        <div>
          <strong>Content Atlas</strong>
          <small>${clientConfig.clientName}</small>
        </div>
      </div>
      <nav class="nav-list" aria-label="Primary">
        ${groups
          .map(
            (group) => `
              <div class="nav-group">
                ${group.label ? `<span class="nav-label">${group.label}</span>` : ""}
                ${group.items
                  .map(
                    ([id, label, iconName, badge]) => `
                      <button class="nav-button ${state.view === id ? "active" : ""}" data-view="${id}">
                        ${icon(iconName)}
                        <span>${escapeHtml(label)}</span>
                        ${badge ? `<em>${badge}</em>` : ""}
                      </button>
                    `,
                  )
                  .join("")}
              </div>
            `,
          )
          .join("")}
      </nav>
      <div class="user-card">
        <div class="avatar">EW</div>
        <div>
          <strong>Emma Walker</strong>
          <small>Marketing Team</small>
        </div>
        <span>⌄</span>
      </div>
    </aside>
  `;
}

function renderTopbar() {
  return `
    <header class="topbar">
      <div class="search-shell">
        ${icon("search")}
        <label class="sr-only" for="global-search">Search content</label>
        <input id="global-search" type="search" value="${escapeHtml(state.query)}" placeholder="Search content, topics, formats, audience..." />
        <kbd>⌘ K</kbd>
      </div>
      <div class="topbar-actions">
        <button class="button" data-view="sources">${icon("plus")} Add Source</button>
        <button class="icon-button" aria-label="Alerts">${icon("bell")}<em>6</em></button>
        <button class="icon-button" aria-label="Help">?</button>
      </div>
    </header>
  `;
}

function renderMetric(label, value, detail, kind = "") {
  return `
    <div class="metric ${kind}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${detail}</small>
    </div>
  `;
}

function metricSparkline() {
  return '<svg class="sparkline" viewBox="0 0 140 48"><path d="M2 35 C18 28 27 40 40 34 C55 28 60 38 73 24 C82 12 90 8 99 25 C110 44 121 23 138 18"/></svg>';
}

function donut() {
  return '<div class="donut" aria-hidden="true"></div>';
}

function renderTabs(assets) {
  const counts = {
    All: assets.length,
    Website: assets.filter((asset) => ["Solution page", "Product page"].includes(asset.format)).length,
    Newsroom: assets.filter((asset) => ["Perspective article", "Explainer article", "Blog article"].includes(asset.format)).length,
    Social: 0,
    Reports: assets.filter((asset) => ["Report", "White paper", "White paper series"].includes(asset.format)).length,
  };
  return `
    <div class="content-tabs">
      ${Object.entries(counts)
        .map(
          ([name, count]) => `
            <button class="${state.activeTab === name ? "active" : ""}" data-tab="${name}">
              ${name === "All" ? "All Content" : name} <span>(${count})</span>
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderFilterBar() {
  const assets = getAssets();
  const select = (key, label, options) => `
    <label class="filter-chip">
      <span>${escapeHtml(label)}</span>
      <select data-filter="${key}">
        <option ${state.filters[key] === "All" ? "selected" : ""}>All</option>
        ${options.map((option) => `<option ${state.filters[key] === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
      </select>
    </label>
  `;

  return `
    <div class="filter-bar">
      <button class="filter-chip strong">${icon("tune")} All Filters</button>
      ${select("format", "Format", unique(assets.map((asset) => asset.format)))}
      ${select("audience", "Audience", unique(assets.flatMap((asset) => asset.audience)))}
      ${select("business_area", "Business Area", unique(assets.map((asset) => asset.business_area)))}
      ${select("funnel_stage", "Funnel Stage", unique(assets.map((asset) => asset.funnel_stage)))}
      <button class="filter-chip">Date Range</button>
      <button class="filter-chip">More ···</button>
    </div>
  `;
}

function renderWorkspace() {
  const allAssets = getAssets();
  const filteredAssets = getFilteredAssets();
  const selectedAsset = getAsset(state.selectedAssetId);

  return `
    <section class="atlas-workbench">
      <div class="content-stage">
        <div class="breadcrumb"><span>Topics</span><span>›</span><strong>Cybersecurity</strong></div>
        <section class="topic-hero">
          <div class="topic-icon">${icon("shield")}</div>
          <div>
            <h1>Cybersecurity <button class="chevron" aria-label="Change topic">⌄</button></h1>
            <p>All English-language Mastercard content</p>
          </div>
          <div class="topic-actions">
            <button class="button">${icon("bookmark")} Save View</button>
            <button class="button hot">${icon("share")} Share</button>
          </div>
        </section>
        <section class="metric-grid">
          ${renderMetric("Total Assets", allAssets.length, '<span class="up">↑ 18%</span> vs last 30 days')}
          ${renderMetric("New This Week", "12", metricSparkline(), "with-chart")}
          ${renderMetric("Formats", unique(allAssets.map((asset) => asset.format)).length, donut(), "with-donut")}
          ${renderMetric("Last Updated", "2h ago", '<span class="live-dot"></span> Live')}
        </section>
        ${renderFilterBar()}
        <div class="results-shell">
          <div class="results-head">
            ${renderTabs(allAssets)}
            <label class="sort-control">
              <span>Sort:</span>
              <select id="sort-select">
                ${["Recently Added", "Highest Score", "Needs Review", "Title"]
                  .map((option) => `<option ${state.sort === option ? "selected" : ""}>${option}</option>`)
                  .join("")}
              </select>
            </label>
          </div>
          <div class="result-list">
            ${filteredAssets.map(renderResultCard).join("")}
          </div>
        </div>
      </div>
      ${renderDetailRail(selectedAsset)}
    </section>
  `;
}

function thumbnailClass(asset) {
  if (asset.primary_topic.includes("Identity") || asset.primary_topic === "Authentication") return "identity";
  if (asset.format.includes("Report") || asset.format.includes("White")) return "report";
  if (asset.primary_topic.includes("Post")) return "quantum";
  if (asset.primary_topic.includes("Scams")) return "scam";
  return "cyber";
}

function renderThumbnail(asset, large = false) {
  return `
    <div class="asset-thumb ${thumbnailClass(asset)} ${large ? "large" : ""}">
      <div class="thumb-copy">
        <span>${escapeHtml(asset.primary_topic)}</span>
        <strong>${escapeHtml(shortTitle(asset.title, large ? 42 : 34))}</strong>
      </div>
      <div class="mini-brand"><span></span><span></span></div>
      ${asset.format.includes("Video") ? '<button class="play-dot">▶</button>' : ""}
    </div>
  `;
}

function shortTitle(title, max) {
  return title.length > max ? `${title.slice(0, max - 1)}…` : title;
}

function renderResultCard(asset) {
  const selected = asset.id === state.selectedAssetId;
  return `
    <article class="result-card ${selected ? "selected" : ""}" data-select-detail="${asset.id}">
      ${renderThumbnail(asset)}
      <div class="result-main">
        <h2>${escapeHtml(asset.title)}</h2>
        <div class="source-line">
          <span>${escapeHtml(sourceDomain(asset))}</span>
          <span>${escapeHtml(formatLabel(asset))}</span>
          <span>${formatDate(asset.published_date)}</span>
        </div>
        <p>${escapeHtml(asset.summary)}</p>
        <div class="pill-row">
          ${[asset.primary_topic, ...asset.secondary_topics.slice(0, 1)].map((topic) => renderPill(topic)).join("")}
          ${asset.secondary_topics.length > 1 ? renderPill(`+${asset.secondary_topics.length - 1}`) : ""}
        </div>
      </div>
      <div class="result-meta">
        <span>${icon("users")} ${escapeHtml(asset.audience[0] ?? "Audience")}</span>
        <span>${icon(asset.funnel_stage === "Education" ? "calendar" : "shield")} ${escapeHtml(asset.funnel_stage)}</span>
        <span>${icon("clock")} ${relativeSeen(asset)}</span>
      </div>
      <div class="result-tools">
        <button class="icon-button" data-toggle-select="${asset.id}" aria-label="Select asset">${icon("bookmark")}</button>
        <button class="icon-button" data-asset="${asset.id}" data-view="detail" aria-label="Open detail">⋮</button>
      </div>
    </article>
  `;
}

function renderDetailRail(asset) {
  const metadataRows = [
    ["Primary Topic", asset.primary_topic],
    ["Secondary Topics", `${asset.secondary_topics.slice(0, 2).join(", ")}${asset.secondary_topics.length > 2 ? ", +2" : ""}`],
    ["Audience", asset.audience.join(", ")],
    ["Business Area", asset.business_area],
    ["Funnel Stage", asset.funnel_stage],
    ["Content Use", asset.content_usefulness.replace(" asset", "")],
  ];

  return `
    <aside class="detail-rail">
      <div class="rail-nav">
        <button class="ghost-button">‹ Back to results</button>
        <button class="icon-button" aria-label="Close">${icon("close")}</button>
      </div>
      ${renderThumbnail(asset, true)}
      <div class="rail-body">
        <span class="eyebrow">${escapeHtml(formatLabel(asset))}</span>
        <h2>${escapeHtml(asset.title)}</h2>
        <div class="source-line">
          <span>${escapeHtml(sourceDomain(asset))}</span>
          <a href="${asset.url}" target="_blank" rel="noreferrer">${icon("external")}</a>
          <span>${formatDate(asset.published_date)}</span>
        </div>
        <p>${escapeHtml(asset.summary)}</p>
        <section class="metadata-card">
          <div class="mini-heading">
            <h3>AI-Generated Metadata</h3>
            <button class="button small" data-view="detail" data-asset="${asset.id}">${icon("edit")} Edit</button>
          </div>
          ${metadataRows
            .map(
              ([label, value]) => `
                <div class="metadata-row">
                  <span>${escapeHtml(label)}</span>
                  <strong>${escapeHtml(value)}</strong>
                  <em>${asset.metadata_status === "Rejected" ? "Review" : "Approved"}</em>
                </div>
              `,
            )
            .join("")}
        </section>
        <section class="linkedin-card">
          <div class="mini-heading">
            <h3>Suggested LinkedIn Post <span>Beta</span></h3>
            <button class="button small" data-action="copy-linkedin" data-asset="${asset.id}">${icon("copy")} Copy all</button>
          </div>
          <div class="copy-box">${escapeHtml(asset.linkedin_copy_recommendations[state.linkedinStyle])}</div>
          <div class="copy-actions">
            <button>${icon("spark")} Alternative tone</button>
            <button>Shorter version</button>
          </div>
        </section>
        <div class="rail-actions">
          <a class="button" href="${asset.url}" target="_blank" rel="noreferrer">View Source ${icon("external")}</a>
          <button class="button hot" data-toggle-select="${asset.id}">Add to Campaign</button>
        </div>
      </div>
    </aside>
  `;
}

function renderDetail() {
  const asset = getAsset(state.selectedAssetId);
  const related = asset.related_asset_ids.map(getAsset).filter(Boolean);
  return `
    <section class="page-panel detail-page">
      <div class="page-heading">
        <div>
          <span class="eyebrow">${escapeHtml(asset.source_type)}</span>
          <h1>${escapeHtml(asset.title)}</h1>
          <a href="${asset.url}" target="_blank" rel="noreferrer">${escapeHtml(asset.url)}</a>
        </div>
        <button class="button hot" data-action="approve-asset" data-asset="${asset.id}">Approve metadata</button>
      </div>
      <div class="detail-edit-grid">
        <section>
          <label class="edit-field">
            <span>Summary</span>
            <textarea id="edit-summary" rows="4">${escapeHtml(asset.summary)}</textarea>
          </label>
          <div class="field-card">
            <h2>Extracted text preview</h2>
            <p>${escapeHtml(asset.raw_text)}</p>
          </div>
          <div class="two-col">
            ${renderListPanel("Key claims", asset.key_claims)}
            ${renderListPanel("Proof points", asset.proof_points)}
          </div>
          <label class="edit-field">
            <span>Suggested campaign use</span>
            <textarea id="edit-use" rows="4">${escapeHtml(asset.suggested_use)}</textarea>
          </label>
        </section>
        <aside>
          <div class="field-card">
            <h2>Editable taxonomy</h2>
            ${renderEditableField("Primary topic", "primary_topic", asset.primary_topic, taxonomy.topics)}
            ${renderEditableField("Audience", "audience", asset.audience.join(", "), taxonomy.audiences, true)}
            ${renderEditableField("Business area", "business_area", asset.business_area, taxonomy.businessAreas)}
            ${renderEditableField("Funnel stage", "funnel_stage", asset.funnel_stage, taxonomy.funnelStages)}
            <label class="edit-field">
              <span>Metadata status</span>
              <select id="status-select">
                ${taxonomy.metadataStatuses.map((status) => `<option ${asset.metadata_status === status ? "selected" : ""}>${status}</option>`).join("")}
              </select>
            </label>
            <button class="button hot full" data-action="save-detail" data-asset="${asset.id}">Save edits</button>
          </div>
          <div class="field-card">
            <h2>Related content</h2>
            ${related.map((item) => `<button class="related-link" data-select-detail="${item.id}" data-view="detail">${escapeHtml(item.title)}</button>`).join("")}
          </div>
        </aside>
      </div>
    </section>
  `;
}

function renderEditableField(label, key, value, options, freeText = false) {
  return `
    <label class="edit-field">
      <span>${escapeHtml(label)}</span>
      ${
        freeText
          ? `<input data-edit-field="${key}" value="${escapeHtml(value)}" />`
          : `<select data-edit-field="${key}">${options
              .map((option) => `<option ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`)
              .join("")}</select>`
      }
    </label>
  `;
}

function renderListPanel(title, items) {
  return `
    <div class="field-card">
      <h2>${escapeHtml(title)}</h2>
      <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
  `;
}

function getAuditFindings() {
  const assets = getAssets();
  const duplicateGroups = assets.reduce((groups, asset) => {
    if (!asset.duplicate_group) return groups;
    groups[asset.duplicate_group] = [...(groups[asset.duplicate_group] ?? []), asset];
    return groups;
  }, {});
  const findings = [];

  Object.entries(duplicateGroups).forEach(([group, groupedAssets]) => {
    if (groupedAssets.length > 1) {
      findings.push({
        type: "Duplicate or overlapping content",
        severity: "Medium",
        title: `${groupedAssets.length} assets overlap in ${group.replaceAll("-", " ")}`,
        detail: groupedAssets.map((asset) => asset.title).join(" | "),
        assetIds: groupedAssets.map((asset) => asset.id),
      });
    }
  });

  assets.forEach((asset) => {
    const monthsOld = ageInMonths(asset.published_date);
    if (monthsOld === null) {
      findings.push({
        type: "Published date unavailable",
        severity: "Low",
        title: asset.title,
        detail: "Freshness cannot be inferred from page metadata. Confirm manually before campaign use.",
        assetIds: [asset.id],
      });
    } else if (monthsOld > 20) {
      findings.push({
        type: "Old or potentially stale content",
        severity: "Medium",
        title: asset.title,
        detail: `Published ${formatDate(asset.published_date)}. Confirm claims, dates and links before campaign use.`,
        assetIds: [asset.id],
      });
    }
    if (asset.proof_points.length < 2) {
      findings.push({
        type: "Thin content or weak proof points",
        severity: "Low",
        title: asset.title,
        detail: "Needs additional proof, claims or supporting assets for campaign planning.",
        assetIds: [asset.id],
      });
    }
    if (asset.url_status !== "Accessible") {
      findings.push({
        type: "Broken or inaccessible URL",
        severity: "High",
        title: asset.title,
        detail: `URL status is ${asset.url_status}. Review before exporting a content pack.`,
        assetIds: [asset.id],
      });
    }
  });

  topicClusters.forEach((cluster) => {
    const clusterAssets = assetsForCluster(cluster);
    const hasSales = clusterAssets.some((asset) => asset.funnel_stage === "Sales enablement" || asset.content_usefulness === "Sales follow-up");
    if (clusterAssets.length >= 3 && !hasSales) {
      findings.push({
        type: "Strong thought leadership, limited sales activation",
        severity: "Medium",
        title: cluster.name,
        detail: cluster.gap,
        assetIds: clusterAssets.map((asset) => asset.id),
      });
    }
  });

  return findings;
}

function renderAudit() {
  const findings = getAuditFindings();
  return `
    <section class="page-panel">
      <div class="page-heading">
        <div>
          <span class="eyebrow">Audit</span>
          <h1>Content Audit</h1>
          <p>${findings.length} items for marketing review</p>
        </div>
        <button class="button hot" data-action="export">Export CSV</button>
      </div>
      <div class="audit-list">
        ${findings
          .map(
            (finding) => `
              <article class="finding-card ${finding.severity.toLowerCase()}">
                <div>
                  <span>${escapeHtml(finding.type)}</span>
                  <h2>${escapeHtml(finding.title)}</h2>
                  <p>${escapeHtml(finding.detail)}</p>
                </div>
                <button class="button" data-asset="${finding.assetIds[0]}" data-view="detail">Review</button>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderTopicMap() {
  const max = Math.max(...topicClusters.map((cluster) => assetsForCluster(cluster).length));
  return `
    <section class="page-panel">
      <div class="page-heading">
        <div>
          <span class="eyebrow">Topic maps</span>
          <h1>Cybersecurity Coverage</h1>
          <p>Clusters, density and activation gaps across the public content set.</p>
        </div>
        <button class="button hot" data-view="campaign">Create campaign pack</button>
      </div>
      <div class="cluster-grid">
        ${topicClusters
          .map((cluster) => {
            const assets = assetsForCluster(cluster);
            const density = Math.round((assets.length / max) * 100);
            return `
              <article class="cluster-card ${cluster.id === state.selectedTopicId ? "selected" : ""}" data-topic="${cluster.id}">
                <div class="cluster-head">
                  <h2>${escapeHtml(cluster.name)}</h2>
                  ${renderPill(cluster.priority)}
                </div>
                <div class="density-bar"><span style="width:${density}%"></span></div>
                <strong>${assets.length} assets</strong>
                <p>${escapeHtml(cluster.gap)}</p>
                ${assets.slice(0, 3).map((asset) => `<button data-select-detail="${asset.id}">${escapeHtml(asset.title)}</button>`).join("")}
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderCampaign() {
  const cluster = topicClusters.find((item) => item.id === state.selectedTopicId) ?? topicClusters[0];
  const assets = assetsForCluster(cluster).sort((a, b) => assetScore(b) - assetScore(a));
  const hero = assets.find((asset) => asset.content_usefulness === "Campaign hero asset") ?? assets[0];
  const proofAssets = assets.filter((asset) => asset.proof_points.length >= 2).slice(0, 4);
  return `
    <section class="page-panel">
      <div class="page-heading">
        <div>
          <span class="eyebrow">Campaign planner</span>
          <h1>${escapeHtml(cluster.name)}</h1>
          <p>${escapeHtml(cluster.gap)}</p>
        </div>
        <label class="sort-control">
          <span>Topic</span>
          <select id="topic-select">
            ${topicClusters.map((item) => `<option value="${item.id}" ${item.id === cluster.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="campaign-grid">
        <section class="field-card">
          <h2>Recommended hero asset</h2>
          ${hero ? renderResultCard(hero) : "<p>No hero asset found.</p>"}
        </section>
        <section class="field-card">
          <h2>Supporting proof points</h2>
          ${proofAssets
            .map((asset) => `<button class="related-link" data-select-detail="${asset.id}">${escapeHtml(asset.title)} · ${asset.proof_points.length} proof points</button>`)
            .join("")}
        </section>
        <section class="field-card">
          <h2>Suggested content angles</h2>
          <ul>
            <li>Frame ${cluster.name.toLowerCase()} as an ecosystem trust issue.</li>
            <li>Lead with source-backed proof, then route to audience-specific pages.</li>
            <li>Use explainers for education and product pages for lower-funnel action.</li>
          </ul>
        </section>
        <section class="field-card">
          <h2>LinkedIn recommendation</h2>
          <p>${escapeHtml(hero?.linkedin_copy_recommendations[state.linkedinStyle] ?? "")}</p>
        </section>
      </div>
    </section>
  `;
}

function renderSources() {
  const sources = getSources();
  return `
    <section class="page-panel">
      <div class="page-heading">
        <div>
          <span class="eyebrow">Manage</span>
          <h1>Source Registry</h1>
          <p>Approved public sources for discovery, monitoring and manual seeding.</p>
        </div>
        <button class="button hot" data-action="save-source">${icon("plus")} Add source</button>
      </div>
      <div class="source-layout">
        <div class="source-list">
          ${sources
            .map(
              (source) => `
                <article class="source-card">
                  <div>
                    <span>${escapeHtml(source.type)}</span>
                    <h2>${escapeHtml(source.label)}</h2>
                    <p>${escapeHtml(source.url || "URL pending approval")}</p>
                    <small>${escapeHtml(source.notes)}</small>
                  </div>
                  <div>
                    ${renderPill(source.enabled ? "Enabled" : "Disabled", source.enabled ? "approved" : "")}
                    <button class="button small" data-toggle-source="${source.id}">${source.enabled ? "Disable" : "Enable"}</button>
                  </div>
                </article>
              `,
            )
            .join("")}
        </div>
        <aside class="field-card">
          <h2>Add monitored source</h2>
          <label class="edit-field"><span>Type</span><select id="new-source-type"><option>Mastercard domain</option><option>Sitemap URL</option><option>Newsroom URL</option><option>Report/PDF URL</option><option>Official social handle</option><option>Executive profile</option></select></label>
          <label class="edit-field"><span>Label</span><input id="new-source-label" placeholder="Example: UK newsroom" /></label>
          <label class="edit-field"><span>Public URL</span><input id="new-source-url" placeholder="https://..." /></label>
          <label class="edit-field"><span>Crawl cadence</span><select id="new-source-cadence"><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Manual</option></select></label>
          <label class="edit-field"><span>Owner</span><input id="new-source-owner" placeholder="Team or owner" /></label>
          <h2>Guardrails</h2>
          <ul>
            <li>Use public, already-published content only.</li>
            <li>Respect robots.txt and platform terms.</li>
            <li>Use official APIs for social where possible.</li>
            <li>Store source URL and crawl timestamp for every asset.</li>
          </ul>
        </aside>
      </div>
    </section>
  `;
}

function renderMain() {
  if (state.view === "detail") return renderDetail();
  if (state.view === "map") return renderTopicMap();
  if (state.view === "audit") return renderAudit();
  if (state.view === "campaign") return renderCampaign();
  if (state.view === "sources") return renderSources();
  return renderWorkspace();
}

function render() {
  app.innerHTML = `
    ${renderHeader()}
    <main class="main">
      ${renderTopbar()}
      ${renderMain()}
    </main>
  `;
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const assetId = button.dataset.asset;
      const topicId = button.dataset.topic;
      if (assetId) state.selectedAssetId = assetId;
      if (topicId) state.selectedTopicId = topicId;
      state.view = button.dataset.view;
      render();
    });
  });

  document.querySelector("#global-search")?.addEventListener("input", (event) => {
    state.query = event.target.value;
    if (!["dashboard", "inventory"].includes(state.view)) state.view = "inventory";
    render();
  });

  document.querySelectorAll("[data-filter]").forEach((select) => {
    select.addEventListener("change", () => {
      state.filters[select.dataset.filter] = select.value;
      render();
    });
  });

  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      render();
    });
  });

  document.querySelector("#sort-select")?.addEventListener("change", (event) => {
    state.sort = event.target.value;
    render();
  });

  document.querySelector("#topic-select")?.addEventListener("change", (event) => {
    state.selectedTopicId = event.target.value;
    render();
  });

  document.querySelectorAll("[data-select-detail]").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      state.selectedAssetId = item.dataset.selectDetail;
      render();
    });
  });

  document.querySelectorAll("[data-toggle-select]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const id = button.dataset.toggleSelect;
      if (state.selectedAssetIds.has(id)) state.selectedAssetIds.delete(id);
      else state.selectedAssetIds.add(id);
      render();
    });
  });

  document.querySelectorAll("[data-toggle-source]").forEach((button) => {
    button.addEventListener("click", () => {
      const sources = getSources().map((source) =>
        source.id === button.dataset.toggleSource ? { ...source, enabled: !source.enabled } : source,
      );
      writeJson(storageKeys.sources, sources);
      render();
    });
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action, button.dataset.asset));
  });
}

function handleAction(action, assetId) {
  if (action === "export") exportCsv();
  if (action === "copy-linkedin") {
    const asset = getAsset(assetId);
    navigator.clipboard?.writeText(asset.linkedin_copy_recommendations[state.linkedinStyle]);
  }
  if (action === "approve-asset") {
    saveAssetPatch(assetId, { metadata_status: "Human approved" });
    render();
  }
  if (action === "save-detail") {
    const fields = {};
    document.querySelectorAll("[data-edit-field]").forEach((field) => {
      fields[field.dataset.editField] =
        field.dataset.editField === "audience" ? field.value.split(",").map((item) => item.trim()).filter(Boolean) : field.value;
    });
    fields.summary = document.querySelector("#edit-summary")?.value ?? getAsset(assetId).summary;
    fields.suggested_use = document.querySelector("#edit-use")?.value ?? getAsset(assetId).suggested_use;
    fields.metadata_status = document.querySelector("#status-select")?.value ?? getAsset(assetId).metadata_status;
    saveAssetPatch(assetId, fields);
    render();
  }
  if (action === "save-source") {
    const label = document.querySelector("#new-source-label")?.value.trim();
    const url = document.querySelector("#new-source-url")?.value.trim();
    if (!label && !url) return;
    const sources = getSources();
    sources.unshift({
      id: `source-${Date.now()}`,
      type: document.querySelector("#new-source-type").value,
      label: label || url,
      url,
      cadence: document.querySelector("#new-source-cadence").value,
      owner: document.querySelector("#new-source-owner").value.trim() || "Unassigned",
      enabled: true,
      last_checked: null,
      notes: "Added manually in prototype.",
    });
    writeJson(storageKeys.sources, sources);
    render();
  }
}

function exportCsv() {
  const columns = ["id", "title", "url", "source_type", "format", "language", "region", "published_date", "primary_topic", "audience", "business_area", "funnel_stage", "summary", "content_usefulness", "metadata_status"];
  const assets = getFilteredAssets();
  const lines = [
    columns.join(","),
    ...assets.map((asset) =>
      columns
        .map((column) => {
          const value = Array.isArray(asset[column]) ? asset[column].join("; ") : asset[column] ?? "";
          return `"${String(value).replaceAll('"', '""')}"`;
        })
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mastercard-content-atlas.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

render();
