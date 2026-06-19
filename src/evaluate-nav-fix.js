let queued = false;
const text = (node) => node?.textContent?.trim() || "";

function styles() {
  if (document.querySelector("#evaluate-nav-fix-styles")) return;
  const tag = document.createElement("style");
  tag.id = "evaluate-nav-fix-styles";
  tag.textContent = `
    .nav-button.quality-nav-button {
      grid-template-columns: 24px minmax(0, 1fr) !important;
      min-height: 46px !important;
      overflow: hidden !important;
    }
    .nav-button.quality-nav-button span {
      display: block !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      line-height: 1.2 !important;
    }
  `;
  document.head.appendChild(tag);
}

function cleanButton(button) {
  const icon = button.querySelector("svg")?.outerHTML || "";
  button.classList.add("quality-nav-button");
  button.dataset.view = "audit";
  button.innerHTML = `${icon}<span>Content Quality</span>`;
}

function patchEvaluateNav() {
  document.querySelectorAll(".nav-label").forEach((label) => {
    if (!["Evaluate", "Audit"].includes(text(label))) return;
    label.textContent = "Evaluate";
    const group = label.closest(".nav-group");
    if (!group) return;
    const buttons = [...group.querySelectorAll(".nav-button")];
    const quality = buttons.find((button) => /Content Quality|Content Audit/.test(text(button))) || buttons[0];
    buttons.forEach((button) => {
      if (button !== quality) button.remove();
    });
    if (quality) cleanButton(quality);
  });
}

function patch() {
  styles();
  patchEvaluateNav();
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
