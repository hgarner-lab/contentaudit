import { contentAssets } from "./data.js";

const toneCycle = ["executive", "sales", "launch"];
let currentAssetId = null;
let currentToneIndex = 0;

function getActiveAsset() {
  const title = document.querySelector(".detail-rail .rail-body h2")?.textContent?.trim();
  if (!title) return null;
  return contentAssets.find((asset) => asset.title === title) ?? null;
}

function setLinkedInCopy(asset, tone) {
  const copyBox = document.querySelector(".linkedin-card .copy-box");
  const copy = asset?.linkedin_copy_recommendations?.[tone];
  if (!copyBox || !copy) return;
  copyBox.textContent = copy;
}

function refreshToneState(asset) {
  if (!asset) return;
  if (asset.id !== currentAssetId) {
    currentAssetId = asset.id;
    currentToneIndex = 0;
  }
}

document.addEventListener(
  "click",
  (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const label = button.textContent.trim().toLowerCase();
    const asset = getActiveAsset();
    if (!asset) return;
    refreshToneState(asset);

    if (label.includes("alternative tone")) {
      event.preventDefault();
      currentToneIndex = (currentToneIndex + 1) % toneCycle.length;
      setLinkedInCopy(asset, toneCycle[currentToneIndex]);
    }

    if (label.includes("shorter version")) {
      event.preventDefault();
      currentToneIndex = -1;
      setLinkedInCopy(asset, "short");
    }

    if (label.includes("copy all")) {
      const copyBox = document.querySelector(".linkedin-card .copy-box");
      if (!copyBox) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      navigator.clipboard?.writeText(copyBox.textContent.trim());
    }
  },
  true,
);
