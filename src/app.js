const clientConfig = {
  clientName: "Mastercard",
  productName: "Content Atlas",
  pilotTopic: "Cybersecurity",
  language: "English-language content"
};

const assets = [
  {
    id: "mc-cyber-overview",
    title: "Cybersecurity & Fraud Prevention",
    url: "https://www.mastercard.com/us/en/business/cybersecurity-fraud-prevention.html",
    platform: "mastercard.com",
    format: "Solution page",
    region: "US",
    date: "2026-06-18",
    topic: "Cybersecurity",
    secondary: ["Fraud prevention", "Identity", "Risk"],
    audience: "Enterprises",
    businessArea: "Cyber and intelligence",
    funnel: "Awareness",
    status: "Human approved",
    usefulness: "Campaign hero asset",
    summary: "Primary landing asset for Mastercard's cybersecurity and fraud prevention proposition.",
    proof: "Positions data, AI and network expertise as core to fighting fraud and protecting digital commerce.",
    linkedin: "Security is now a growth requirement, not a back-office concern. Mastercard's cybersecurity and fraud prevention portfolio shows how data, AI and ecosystem intelligence can help protect digital commerce at scale."
  },
  {
    id: "mc-cyber-solution",
    title: "Cybersecurity solutions for a changing world",
    url: "https://www.mastercard.com/us/en/business/cybersecurity-fraud-prevention/cybersecurity.html",
    platform: "mastercard.com",
    format: "Solution page",
    region: "Global",
    date: "2026-06-14",
    topic: "Cyber resilience",
    secondary: ["Threat intelligence", "Risk", "Fraud prevention"],
    audience: "Banks",
    businessArea: "Cyber and intelligence",
    funnel: "Consideration",
    status: "AI suggested",
    usefulness: "Supporting proof point",
    summary: "Deeper solution content around cyber risk visibility, attack protection and ecosystem trust.",
    proof: "Useful for explaining how Mastercard frames cyber resilience across the payments ecosystem.",
    linkedin: "Cyber risk is not just an IT issue. It is an ecosystem trust issue. This Mastercard content is a useful starting point for teams thinking about resilience, protection and risk visibility."
  },
  {
    id: "mc-threat-intel",
    title: "Cyber-fraud integration for the new age of risk",
    url: "https://www.mastercard.com/us/en/news-and-trends/Insights/2026/cyber-fraud-integration-for-the-new-age-of-risk.html",
    platform: "Newsroom",
    format: "Article",
    region: "Global",
    date: "2026-05-29",
    topic: "Fraud prevention",
    secondary: ["Threat intelligence", "AI security"],
    audience: "Merchants",
    businessArea: "Cyber and intelligence",
    funnel: "Thought leadership",
    status: "AI suggested",
    usefulness: "Executive POV",
    summary: "Thought leadership asset connecting cyber risk and fraud risk as a single planning challenge.",
    proof: "Good for campaign narratives around converging threats and smarter risk decisioning.",
    linkedin: "Cyber and fraud risks are converging. For marketers planning trust-led campaigns, this is a useful lens: protect the transaction, the relationship and the wider ecosystem."
  },
  {
    id: "mc-small-business-security",
    title: "Helping small businesses spot scams and stay secure",
    url: "https://www.mastercard.com/news/perspectives/2026/small-business-cybersecurity.html",
    platform: "Newsroom",
    format: "Article",
    region: "UK / Europe",
    date: "2026-04-21",
    topic: "Small business security",
    secondary: ["Scams", "Consumer protection"],
    audience: "Small businesses",
    businessArea: "Small business",
    funnel: "Education",
    status: "Human edited",
    usefulness: "Social-selling asset",
    summary: "Accessible educational content for SMEs on scams, payments risk and simple security behaviours.",
    proof: "Strong candidate for sales and partner enablement because it translates security into practical business value.",
    linkedin: "For small businesses, security can feel complex. This Mastercard content makes the issue more practical: spot scams earlier, protect customer trust and keep commerce moving."
  },
  {
    id: "mc-exec-post",
    title: "Executive POV: protecting digital trust",
    url: "https://www.linkedin.com/company/mastercard/",
    platform: "LinkedIn",
    format: "Executive post",
    region: "Global",
    date: "2026-06-17",
    topic: "Trust",
    secondary: ["Cybersecurity", "Identity"],
    audience: "Enterprises",
    businessArea: "Payments",
    funnel: "Awareness",
    status: "AI suggested",
    usefulness: "Executive POV",
    summary: "Public executive-style post that can support campaign positioning around trust in digital commerce.",
    proof: "Use as a social proof layer alongside owned Mastercard content.",
    linkedin: "Trust is the infrastructure behind digital commerce. The stronger the security story, the stronger the growth story."
  }
];

const clusters = [
  { label: "Fraud prevention", count: 32 },
  { label: "Identity", count: 18 },
  { label: "Cyber resilience", count: 24 },
  { label: "Small business", count: 12 },
  { label: "Threat intelligence", count: 19 },
  { label: "Trust", count: 23 }
];

const state = {
  query: "cybersecurity",
  format: "All",
  audience: "All",
  selectedId: assets[0].id
};

const app = document.querySelector("#app");

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function unique(key) {
  return ["All", ...Array.from(new Set(assets.map((asset) => asset[key]).filter(Boolean))).sort()];
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function matches(asset) {
  const query = state.query.toLowerCase().trim();
  const haystack = [asset.title, asset.topic, asset.summary, asset.audience, asset.format, asset.platform, ...asset.secondary].join(" ").toLowerCase();
  const queryMatch = !query || haystack.includes(query) || (query.includes("cyber") && asset.secondary.includes("Cybersecurity"));
  const formatMatch = state.format === "All" || asset.format === state.format;
  const audienceMatch = state.audience === "All" || asset.audience === state.audience;
  return queryMatch && formatMatch && audienceMatch;
}

function selectedAsset() {
  return assets.find((asset) => asset.id === state.selectedId) || assets[0];
}

function metadataRow(label, value) {
  return `<div class="metadata-row"><span>${esc(label)}</span><strong>${esc(value)}</strong><em>Approved</em></div>`;
}

function metric(label, value, delta) {
  return `<article class="metric-card"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(delta)}</small></article>`;
}

function select(id, options, selected) {
  return `<select id="${esc(id)}">${options.map((option) => `<option value="${esc(option)}" ${option === selected ? "selected" : ""}>${esc(option)}</option>`).join("")}</select>`;
}

function card(asset) {
  const active = asset.id === state.selectedId ? " asset-card--active" : "";
  return `
    <article class="asset-card${active}" data-asset-id="${esc(asset.id)}">
      <div class="asset-thumb"><span>${esc(asset.topic.slice(0, 2).toUpperCase())}</span></div>
      <div class="asset-main">
        <div class="eyebrow">${esc(asset.format)} - ${esc(asset.platform)}</div>
        <h3>${esc(asset.title)}</h3>
        <p>${esc(asset.summary)}</p>
        <div class="tag-row"><span>${esc(asset.topic)}</span><span>${esc(asset.audience)}</span><span>${esc(asset.funnel)}</span></div>
      </div>
      <div class="asset-meta"><span class="status">${esc(asset.status)}</span><strong>${esc(asset.usefulness)}</strong><small>${esc(formatDate(asset.date))}</small></div>
    </article>
  `;
}

function renderDetail(asset) {
  return `
    <aside class="detail-panel">
      <div class="detail-hero"><span class="eyebrow">Selected asset</span><h2>${esc(asset.title)}</h2><p>${esc(asset.summary)}</p></div>
      <div class="source-box"><div><span>Source URL</span><a href="${esc(asset.url)}" target="_blank" rel="noreferrer">Open source</a></div><button data-copy-url="${esc(asset.url)}">Copy URL</button></div>
      <section class="panel-section"><div class="section-heading"><h3>AI-generated metadata</h3><button>Edit</button></div>${metadataRow("Primary topic", asset.topic)}${metadataRow("Audience", asset.audience)}${metadataRow("Business area", asset.businessArea)}${metadataRow("Funnel stage", asset.funnel)}${metadataRow("Content use", asset.usefulness)}</section>
      <section class="panel-section copy-card"><div class="section-heading"><h3>Recommended LinkedIn post</h3><button data-copy-post="${esc(asset.id)}">Copy</button></div><p>${esc(asset.linkedin)}</p><a href="${esc(asset.url)}" target="_blank" rel="noreferrer">${esc(asset.url)}</a></section>
      <section class="panel-section"><h3>Campaign planning use</h3><p>${esc(asset.proof)}</p></section>
    </aside>
  `;
}

function render() {
  const filtered = assets.filter(matches);
  if (!filtered.some((asset) => asset.id === state.selectedId)) {
    state.selectedId = filtered[0]?.id || assets[0].id;
  }
  const selected = selectedAsset();
  const stats = {
    total: assets.length,
    newThisWeek: assets.filter((asset) => new Date(asset.date) > new Date("2026-06-10")).length,
    needsReview: assets.filter((asset) => asset.status === "AI suggested").length
  };

  app.innerHTML = `
    <nav class="sidebar">
      <div class="brand-lockup"><div class="mc-mark"><span></span><span></span></div><div><strong>${esc(clientConfig.productName)}</strong><small>${esc(clientConfig.clientName)}</small></div></div>
      <a class="nav-item active">Home</a><a class="nav-item">Content Explorer</a><a class="nav-item">Topic Map</a><a class="nav-item">Content Audit</a><a class="nav-item">Campaign Planner</a><a class="nav-item">LinkedIn Copy</a><a class="nav-item">Source Registry</a>
      <div class="saved-view"><span>Saved view</span><strong>Cybersecurity overview</strong><small>All English-language Mastercard content</small></div>
    </nav>
    <main class="workspace">
      <header class="topbar"><label class="search-box"><span>Search</span><input id="search" value="${esc(state.query)}" placeholder="Search content, topics, formats, audience..." /></label><button class="ghost">Save view</button><button class="primary">Add source</button></header>
      <section class="hero-strip"><div><span class="eyebrow">Topics &gt; Cybersecurity</span><h1>Cybersecurity content atlas</h1><p>Audit, map and activate public Mastercard cybersecurity content for marketing planning.</p></div><button class="share-button">Share pack</button></section>
      <section class="metric-grid">${metric("Total assets", stats.total, "+18% vs last 30 days")}${metric("New this week", stats.newThisWeek, "2 executive/social updates")}${metric("Needs review", stats.needsReview, "AI metadata approval")}${metric("Content gaps", 7, "Across key themes")}</section>
      <section class="content-grid">
        <div class="inventory-panel"><div class="section-heading"><div><h2>Content inventory</h2><p>${filtered.length} matching assets</p></div><div class="filters">${select("format", unique("format"), state.format)}${select("audience", unique("audience"), state.audience)}</div></div><div class="tabs"><button class="active">All content</button><button>Website</button><button>Newsroom</button><button>Social</button><button>Reports</button></div><div class="asset-list">${filtered.map(card).join("") || "<p class='empty'>No matching content found.</p>"}</div></div>
        <div class="right-stack"><section class="map-panel"><div class="section-heading"><h2>Topic map</h2><button>View full map</button></div><div class="cluster-map"><div class="cluster-center"><strong>Cybersecurity</strong><span>${assets.length} assets</span></div>${clusters.map((cluster, index) => `<div class="cluster cluster-${index + 1}"><strong>${esc(cluster.label)}</strong><span>${esc(cluster.count)}</span></div>`).join("")}</div></section>${renderDetail(selected)}</div>
      </section>
    </main>
  `;
  bindEvents();
}

function copyText(text, button) {
  const fallback = () => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
  };
  const done = () => {
    button.textContent = "Copied";
    setTimeout(() => render(), 700);
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => { fallback(); done(); });
  } else {
    fallback();
    done();
  }
}

function bindEvents() {
  document.querySelector("#search").addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
    const input = document.querySelector("#search");
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });
  document.querySelector("#format").addEventListener("change", (event) => { state.format = event.target.value; render(); });
  document.querySelector("#audience").addEventListener("change", (event) => { state.audience = event.target.value; render(); });
  document.querySelectorAll("[data-asset-id]").forEach((cardEl) => cardEl.addEventListener("click", () => { state.selectedId = cardEl.dataset.assetId; render(); }));
  document.querySelectorAll("[data-copy-url]").forEach((button) => button.addEventListener("click", () => copyText(button.dataset.copyUrl, button)));
  document.querySelectorAll("[data-copy-post]").forEach((button) => button.addEventListener("click", () => {
    const asset = assets.find((item) => item.id === button.dataset.copyPost);
    copyText(`${asset.linkedin}\n\n${asset.url}`, button);
  }));
}

render();
