let queued = false;

const text = (node) => node?.textContent?.trim() || "";

function styles() {
  if (document.querySelector("#action-focus-styles")) return;
  const tag = document.createElement("style");
  tag.id = "action-focus-styles";
  tag.textContent = `
    .next-action-coach.action-focused{grid-template-columns:1fr;gap:16px}.action-paths{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.action-path{border:1px solid #dce3ed;background:#fff;border-radius:16px;padding:14px 15px;text-align:left;font:inherit;color:#0c111d;cursor:pointer;box-shadow:0 10px 26px rgba(15,23,42,.04)}.action-path strong{display:block;font-size:15px;margin-bottom:5px}.action-path small{display:block;color:#647084;line-height:1.35}.action-path.primary{border-color:rgba(255,59,24,.34);background:#fff7f3}.action-path.primary strong{color:#ff3b18}.browse-note{display:flex;justify-content:space-between;gap:12px;align-items:center;color:#647084;font-size:13px}.browse-note button{border:0;background:transparent;color:#ff3b18;font-weight:800;cursor:pointer}@media(max-width:900px){.action-paths{grid-template-columns:1fr}.browse-note{display:block}.browse-note button{padding:8px 0}}
  `;
  document.head.appendChild(tag);
}

function clickNav(label) {
  const button = [...document.querySelectorAll(".nav-button")].find((item) => text(item).includes(label));
  button?.click();
}

function focusActions() {
  const card = document.querySelector(".next-action-coach");
  if (!card) return;
  if (card.dataset.actionFocus === "true") return;
  card.dataset.actionFocus = "true";
  card.classList.add("action-focused");
  card.innerHTML = `
    <div class="next-action-copy">
      <div class="coach-orb">→</div>
      <div>
        <span>Next best action</span>
        <h3>Choose how to use this topic</h3>
        <p>The content list below is sorted by recently added. From here, move into campaign planning or coverage analysis.</p>
      </div>
    </div>
    <div class="action-paths">
      <button class="action-path primary" data-primary-action="campaign">
        <strong>Design a content-driven campaign for your LinkedIn feed</strong>
        <small>Build a 3-5 touch nurture/feed flow from the strongest topic proof.</small>
      </button>
      <button class="action-path" data-primary-action="coverage">
        <strong>Explore topic coverage</strong>
        <small>See where Mastercard is over- or under-indexed, then identify gaps worth activating.</small>
      </button>
    </div>
    <div class="browse-note">
      <span>Need the raw inventory first? Start with All Content below.</span>
      <button data-primary-action="content">Jump to All Content</button>
    </div>
  `;
}

function patch() {
  styles();
  focusActions();
}
function queue() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    patch();
  });
}

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-primary-action]");
  if (!action) return queue();
  event.preventDefault();
  event.stopImmediatePropagation();
  const name = action.dataset.primaryAction;
  if (name === "campaign") clickNav("Campaign Planner");
  if (name === "coverage") clickNav("Topic Maps");
  if (name === "content") document.querySelector(".results-shell")?.scrollIntoView({ behavior: "smooth", block: "start" });
}, true);

new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
queue();
