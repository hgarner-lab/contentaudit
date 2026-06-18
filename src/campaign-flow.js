import { contentAssets, taxonomy } from "./data.js";

const KEY = "content-atlas-flow-builder";
let queued = false;

const plays = [
  ["identity", "Identity & verification", "identity and verification", ["Identity", "Authentication", "Trust", "Data protection"], ["Banks", "Issuers", "Fintechs", "Merchants", "Public sector"], ["good customers face too much friction before they can prove who they are", "fraudsters exploit weak identity signals", "authentication has to feel safe without slowing the journey"], "identity journey pressure test"],
  ["scams", "Scam prevention", "scam prevention", ["Scams", "Fraud prevention", "Trust"], ["Banks", "Issuers", "Consumers", "Public sector"], ["customers are harder to protect once scams move off-platform", "trust breaks when fraud feels personal", "teams need earlier warning signals"], "scam-risk pressure test"],
  ["fraud", "Fraud prevention", "fraud prevention", ["Fraud prevention", "Risk", "Threat intelligence", "Cybersecurity"], ["Banks", "Issuers", "Acquirers", "Merchants"], ["false positives create customer friction", "fraud patterns shift faster than static controls", "teams need clearer signals without more manual review"], "fraud-friction review"],
  ["risk", "Risk decisioning", "risk decisioning", ["Risk", "Fraud prevention", "AI security"], ["Banks", "Issuers", "Acquirers", "Merchants", "Enterprises"], ["risk teams need faster decisions without losing explainability", "AI signals need to be trusted", "manual review creates operational drag"], "risk decisioning reality check"],
  ["threat", "Threat intelligence", "threat intelligence", ["Threat intelligence", "Cybersecurity", "Risk"], ["Enterprises", "Banks", "Issuers", "Public sector"], ["teams see more signals than they can act on", "threat insight needs to become a useful next step", "market noise makes priorities harder to judge"], "threat-signal review"],
  ["resilience", "Cyber resilience", "cyber resilience", ["Cyber resilience", "Cybersecurity", "Risk", "Trust"], ["Enterprises", "Banks", "Merchants", "Public sector"], ["resilience is hard to prove until something goes wrong", "teams need to show preparedness without creating alarm", "risk, operations and trust often split apart"], "resilience readiness review"],
  ["ai", "AI security", "AI-era security", ["AI security", "Cybersecurity", "Threat intelligence", "Risk"], ["Enterprises", "Banks", "Issuers", "Policymakers"], ["AI changes the speed and scale of the security problem", "automation can create a new trust gap", "teams need to separate useful AI signals from vague claims"], "AI security pressure test"],
  ["token", "Tokenization & data security", "tokenization and data security", ["Tokenization", "Data protection", "Trust", "Cybersecurity"], ["Merchants", "Banks", "Issuers", "Fintechs"], ["sensitive data needs to move without becoming easier to expose", "security layers must not make the experience harder", "trust is won by reducing what must be stored or handled"], "data-exposure pressure test"],
  ["auth", "Authentication & passkeys", "authentication and passkeys", ["Authentication", "Identity", "Trust"], ["Banks", "Issuers", "Merchants", "Fintechs"], ["customers want fewer login hurdles but not weaker protection", "password fatigue creates experience and risk problems", "secure authentication has to feel almost invisible"], "authentication friction review"],
  ["crime", "Financial crime prevention", "financial crime prevention", ["Fraud prevention", "Risk", "Scams", "Threat intelligence"], ["Banks", "Issuers", "Acquirers", "Public sector"], ["bad actors move across channels faster than teams connect signals", "compliance and experience can feel like competing priorities", "teams need early warnings without more manual work"], "financial crime signal review"],
  ["smb", "Small business cybersecurity", "small business cybersecurity", ["Small business security", "Cyber resilience", "Scams"], ["Small businesses", "Banks", "Merchants", "Public sector"], ["small businesses face enterprise-level threats without enterprise-level resources", "security advice only helps if it is practical", "trust is damaged quickly when a small business feels exposed"], "small-business security checklist"],
  ["pqc", "Post-quantum security", "post-quantum security", ["Post-quantum security", "Data protection", "Cyber resilience"], ["Enterprises", "Banks", "Issuers", "Public sector"], ["long-term data risk is hard to prioritise against today’s urgent threats", "teams need a practical migration path", "security leaders need to prepare before timelines compress"], "post-quantum readiness check"],
  ["trust", "Customer trust & safety", "customer trust and safety", ["Trust", "Fraud prevention", "Identity", "Cybersecurity"], ["Consumers", "Banks", "Issuers", "Merchants"], ["customers remember when security feels unclear", "trust depends on feeling protected without being slowed down", "one bad security moment can make a good experience feel risky"], "trust-moment review"],
].map(([id, label, use, topics, audiences, frictions, review]) => ({ id, label, use, topics, audiences, frictions, review }));

const ctas = [
  ["choice", "Reply 1/2/3", "Even a 1, 2 or 3 reply is useful."],
  ["checklist", "Send a checklist", "Happy to send a short checklist if useful."],
  ["review", "15-minute review", "I think we could make 15 minutes useful if this is live."],
  ["test", "Pressure-test one example", "Worth pressure-testing one live example?"],
].map(([id, label, ask]) => ({ id, label, ask }));

const base = { topic: "identity", audience: "Banks", friction: "", length: 5, cta: "choice", proof: 0, mode: {} };
const read = () => { try { return { ...base, ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch { return { ...base }; } };
const save = () => localStorage.setItem(KEY, JSON.stringify(state));
let state = read();

const esc = (v) => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const play = () => plays.find((p) => p.id === state.topic) || plays[0];
const cta = () => ctas.find((c) => c.id === state.cta) || ctas[0];
const friction = () => play().frictions.includes(state.friction) ? state.friction : play().frictions[0];

function score(asset, p = play()) {
  const topics = [asset.primary_topic, ...(asset.secondary_topics || [])];
  const topicScore = topics.filter((t) => p.topics.includes(t)).length * 10;
  const text = [asset.title, asset.summary, asset.raw_text, asset.format, asset.business_area].join(" ").toLowerCase();
  const wordScore = p.label.toLowerCase().split(/\s|&|\//).filter((w) => w.length > 3 && text.includes(w)).length * 3;
  return topicScore + wordScore + Math.min((asset.proof_points || []).length * 2, 6) + (asset.url_status === "Accessible" ? 3 : 0);
}
function matches(p = play()) {
  const list = contentAssets.map((a) => ({ a, s: score(a, p) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.a);
  return list.length ? list : contentAssets.slice(0, 8);
}
const asset = () => matches()[Math.min(Number(state.proof) || 0, matches().length - 1)] || contentAssets[0];
const proof = () => (asset()?.proof_points || []).find((p) => !/^Detected during/i.test(p)) || asset()?.summary || asset()?.title || "Proof point needs review.";
const touches = () => Number(state.length) === 3 ? [1, 2, 4] : Number(state.length) === 4 ? [1, 2, 3, 4] : [1, 2, 3, 4, 5];

function msg(n, mode = "standard") {
  const p = play(), a = asset(), f = friction(), choices = p.frictions, ask = cta().ask;
  const short = mode === "short", human = mode === "human";
  const open = human ? "Hi [First name] - quick one." : "Hi [First name],";
  const m = {
    1: [`Question on ${p.use}`, `${open}\n\nOne thing that keeps coming up in ${p.use} is that the hard part is not always the obvious one.\n\nIt is often that ${f}, and that can create real pressure for ${state.audience.toLowerCase()} teams.\n\n${short ? "Does that feel familiar?" : "It made me wonder whether this is becoming a live conversation on your side too.\n\nDoes that feel familiar?"}\n\nBest,\n[BD name]`, "Make the issue feel familiar and worth replying to.", "Email or DM"],
    2: ["One signal worth pressure-testing", `${open}\n\nOne Mastercard source I found useful here is ${a?.title}.\n\nThe signal I would take from it is: ${proof()}\n\n${short ? "Is that showing up in your conversations?" : `That made me think ${p.use} may be less about broad messaging and more about reducing uncertainty in the moments that matter.\n\nIs that live for your team right now?`}\n\nBest,\n[BD name]`, "Give one useful proof point without creating extra work.", "Email"],
    3: [`Quick question on ${p.use}`, `${open}\n\nWhen ${p.use} comes up, which tends to create the most noise?\n\n1. ${choices[0]}\n2. ${choices[1]}\n3. ${choices[2]}\n\n${ask}\n\nBest,\n[BD name]`, "Turn passive interest into an easy reply signal.", "Email or DM"],
    4: [`Worth doing a short ${p.review}?`, `${open}\n\nIf one of those issues is live, I think we could make 15 minutes useful.\n\n${short ? "The point would be to pressure-test one real example and send back a short note on where the friction seems to sit." : "Bring one real customer journey, risk scenario or recurring internal question, and we can pressure-test where the issue seems to sit: customer friction, signal quality or operational follow-up.\n\nAfterwards, I can send back a short note with the main takeaways and what I would look at next."}\n\nBest,\n[BD name]`, "Turn engagement into a concrete conversation.", "Email"],
    5: ["Should I leave this with you?", `${open}\n\nI’ll leave this with you after this note.\n\nThe pattern we are seeing around ${p.use} is that it usually shows up in one of three places: ${choices[0]}, ${choices[1]}, or ${choices[2]}.\n\nIf that is live for your team, happy to do a short ${p.review} and send back a practical read-out afterwards.\n\nShould I leave it there, or would that be useful?\n\nBest,\n[BD name]`, "Get a clear yes, no, not now or wrong-priority signal.", "Email"],
  }[n];
  return { subject: m[0], body: m[1], job: m[2], channel: m[3] };
}

function select(name, label, options, value) {
  return `<label class="flow-field"><span>${esc(label)}</span><select data-flow-input="${esc(name)}">${options.map((o) => {
    const v = typeof o === "string" ? o : o.value, l = typeof o === "string" ? o : o.label;
    return `<option value="${esc(v)}" ${String(value) === String(v) ? "selected" : ""}>${esc(l)}</option>`;
  }).join("")}</select></label>`;
}

function markdown() {
  const p = play(), a = asset();
  return `# ${p.label} nurture flow\n\nAudience: ${state.audience}\nFriction: ${friction()}\nProof source: ${a?.title || ""}\nSource URL: ${a?.url || ""}\n\n${touches().map((t, i) => {
    const m = msg(t, state.mode?.[t] || "standard");
    return `## Touch ${i + 1}: ${m.subject}\n\nJob: ${m.job}\nChannel: ${m.channel}\n\n${m.body}`;
  }).join("\n\n---\n\n")}\n\n## Guardrails\n- Use one proof point.\n- Do not overclaim or guarantee outcomes.\n- Do not imply private account knowledge.\n- Make one human edit before sending.\n- Keep the ask low-friction.\n`;
}

function render() {
  const p = play();
  if (!p.frictions.includes(state.friction)) state.friction = p.frictions[0];
  if (!p.audiences.includes(state.audience)) state.audience = p.audiences[0];
  save();
  const list = matches(p), a = asset();
  return `<section class="page-panel nurture-builder"><div class="page-heading flow-heading"><div><span class="eyebrow">Campaign planner</span><h1>Nurture Flow Builder</h1><p>Build a 3-5 touch flow from Mastercard topics, proof points and tone guardrails.</p></div><div class="flow-actions"><button class="button" data-flow-action="copy-all">Copy full flow</button><button class="button hot" data-flow-action="export">Export Markdown</button></div></div><div class="flow-shell"><aside class="flow-setup"><b>Set up the flow</b>${select("topic", "Topic", plays.map((x) => ({ value: x.id, label: x.label })), state.topic)}${select("audience", "Audience", [...new Set([...p.audiences, ...(taxonomy?.audiences || [])])], state.audience)}${select("friction", "Buyer friction", p.frictions, friction())}${select("length", "Flow length", [{ value: 3, label: "3 touches" }, { value: 4, label: "4 touches" }, { value: 5, label: "5 touches" }], state.length)}${select("cta", "CTA style", ctas.map((x) => ({ value: x.id, label: x.label })), state.cta)}<div class="flow-note"><strong>Process</strong><span>Human opener -> useful proof -> friction choice -> named ask -> close-the-loop.</span></div><button class="flow-btn primary full" data-flow-action="reset">Regenerate flow</button></aside><main class="flow-stack"><div class="flow-title"><div><span class="eyebrow">${esc(p.label)}</span><h2>${touches().length}-touch nurture flow</h2></div><p>Plain, proof-led drafts that should still get one human edit.</p></div>${touches().map((t, i) => { const m = msg(t, state.mode?.[t] || "standard"); return `<article class="flow-card" data-touch="${t}"><div class="flow-card-head"><div><span>Touch ${i + 1} - ${esc(m.channel)}</span><h3>${esc(m.subject)}</h3><p>${esc(m.job)}</p></div><em>${esc(state.mode?.[t] || "Draft")}</em></div><pre>${esc(m.body)}</pre><div class="flow-card-actions"><button class="flow-btn primary" data-flow-action="copy" data-touch="${t}">Copy</button><button class="flow-btn" data-flow-action="short" data-touch="${t}">Shorter</button><button class="flow-btn" data-flow-action="human" data-touch="${t}">More human</button><button class="flow-btn" data-flow-action="standard" data-touch="${t}">Reset</button></div></article>`; }).join("")}</main><aside class="flow-proof"><b>Proof + guardrails</b><section class="selected-proof"><span>Selected source</span><h2>${esc(a?.title)}</h2><p>${esc(proof())}</p><a href="${esc(a?.url)}" target="_blank" rel="noreferrer">Open source</a></section><div class="proof-list">${list.slice(0, 6).map((x, i) => `<button class="proof-option ${x.id === a?.id ? "selected" : ""}" data-flow-action="proof" data-proof="${i}"><strong>${esc(x.title)}</strong><span>${esc(x.primary_topic)} - ${esc(x.format)}</span></button>`).join("")}</div><button class="flow-btn full" data-flow-action="swap">Swap proof point</button><section class="guardrails"><h2>Tone guardrails</h2><ul><li>Use one proof point, not a list.</li><li>Say “may be worth pressure-testing”, not “will solve”.</li><li>Do not imply private customer knowledge.</li><li>Make one human edit before sending.</li><li>Keep the ask easy to answer.</li></ul></section><section class="guardrails"><h2>Safer language</h2><p>Use: “The pattern we are seeing...”</p><p>Use: “A useful question might be...”</p><p>Avoid guaranteed outcomes, named customers or uncleared market claims.</p></section></aside></div></section>`;
}

function styles() {
  if (document.querySelector("#campaign-flow-styles")) return;
  const s = document.createElement("style");
  s.id = "campaign-flow-styles";
  s.textContent = `.flow-heading{align-items:flex-start}.flow-actions{display:flex;gap:10px;flex-wrap:wrap}.flow-shell{display:grid;grid-template-columns:280px minmax(420px,1fr)330px;gap:18px;align-items:start}.flow-setup,.flow-proof,.flow-card{border:1px solid #e6eaf0;border-radius:22px;background:#fff;box-shadow:0 18px 48px rgba(15,23,42,.05)}.flow-setup,.flow-proof{padding:18px;position:sticky;top:86px}.flow-setup>b,.flow-proof>b{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#647084;margin-bottom:14px}.flow-field{display:grid;gap:7px;margin-bottom:12px}.flow-field span{font-size:13px;color:#526078;font-weight:700}.flow-field select{width:100%;border:1px solid #dce3ed;border-radius:12px;padding:11px 12px;background:#fff;font:inherit}.flow-note{display:grid;gap:5px;margin:16px 0;padding:13px;border-radius:16px;background:#fff7f3;border:1px solid rgba(255,59,24,.14)}.flow-note span{color:#647084;line-height:1.4}.flow-btn{border:1px solid #dce3ed;background:#fff;border-radius:12px;padding:10px 12px;font:inherit;font-weight:800;color:#0c111d;cursor:pointer}.flow-btn.primary{border-color:#ff3b18;background:#ff3b18;color:#fff}.full{width:100%}.flow-stack{display:grid;gap:14px}.flow-title{display:flex;align-items:end;justify-content:space-between;gap:18px}.flow-title h2{margin:2px 0 0;font-size:24px}.flow-title p{margin:0;color:#647084}.flow-card{padding:18px}.flow-card-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}.flow-card-head span{color:#647084;font-weight:700;font-size:13px}.flow-card-head h3{margin:3px 0}.flow-card-head p{margin:0;color:#647084;line-height:1.4}.flow-card-head em{border-radius:999px;background:#fff1ed;color:#ff3b18;padding:5px 9px;font-style:normal;font-size:11px;font-weight:900;text-transform:capitalize}.flow-card pre{white-space:pre-wrap;margin:0;padding:16px;border-radius:16px;background:#fbfcfe;border:1px solid #edf0f5;color:#0c111d;font:14px/1.55 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.flow-card-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:13px}.selected-proof{padding:14px;border-radius:16px;background:#0c111d;color:#fff;margin-bottom:12px}.selected-proof span{color:#aeb8c8;font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:800}.selected-proof h2{font-size:18px;margin:6px 0;color:#fff}.selected-proof p{color:#dbe3ef;line-height:1.45}.selected-proof a{color:#fff;font-weight:800}.proof-list{display:grid;gap:8px;margin:12px 0}.proof-option{text-align:left;border:1px solid #e6eaf0;background:#fff;border-radius:14px;padding:11px;cursor:pointer}.proof-option.selected{border-color:#ff3b18;background:#fff7f3}.proof-option strong{display:block;color:#0c111d;margin-bottom:3px}.proof-option span{color:#647084;font-size:12px}.guardrails{margin-top:14px;border-top:1px solid #e6eaf0;padding-top:14px}.guardrails h2{font-size:16px;margin:0 0 8px}.guardrails ul{margin:0;padding-left:18px;color:#526078;line-height:1.55}.guardrails p{margin:7px 0;color:#526078;line-height:1.4}.flow-toast{position:fixed;right:24px;bottom:24px;background:#0c111d;color:#fff;border-radius:14px;padding:12px 14px;font-weight:800;box-shadow:0 16px 40px rgba(15,23,42,.22);z-index:10000}@media(max-width:1280px){.flow-shell{grid-template-columns:1fr}.flow-setup,.flow-proof{position:static}.flow-title{display:block}}`;
  document.head.appendChild(s);
}

function isCampaign() {
  return [...document.querySelectorAll(".page-panel .eyebrow")].some((n) => n.textContent.trim().toLowerCase() === "campaign planner");
}
function patch() {
  const panel = document.querySelector(".page-panel");
  if (!panel || !isCampaign() || panel.classList.contains("nurture-builder")) return;
  styles();
  panel.outerHTML = render();
}
function queue() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; patch(); });
}
function rerender() { const panel = document.querySelector(".nurture-builder"); if (panel) panel.outerHTML = render(); }
function toast(t) { document.querySelector(".flow-toast")?.remove(); const d = document.createElement("div"); d.className = "flow-toast"; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 1500); }
async function copy(text) { await navigator.clipboard?.writeText(text); toast("Copied"); }
function exportMd() { const url = URL.createObjectURL(new Blob([markdown()], { type: "text/markdown" })); const a = document.createElement("a"); a.href = url; a.download = `${play().id}-nurture-flow.md`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

document.addEventListener("change", (e) => {
  const input = e.target.closest("[data-flow-input]");
  if (!input) return queue();
  const k = input.dataset.flowInput;
  state = { ...state, [k]: k === "length" ? Number(input.value) : input.value };
  if (k === "topic") { const p = play(); state.friction = p.frictions[0]; state.audience = p.audiences[0]; state.proof = 0; state.mode = {}; }
  save(); rerender();
}, true);

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-flow-action]");
  if (!b) return queue();
  e.preventDefault(); e.stopPropagation();
  const act = b.dataset.flowAction, t = Number(b.dataset.touch);
  if (act === "copy-all") copy(markdown());
  if (act === "export") exportMd();
  if (act === "reset") { state.mode = {}; save(); rerender(); }
  if (act === "swap") { state.proof = (Number(state.proof) + 1) % matches().length; save(); rerender(); }
  if (act === "proof") { state.proof = Number(b.dataset.proof) || 0; save(); rerender(); }
  if (act === "copy" && t) copy(msg(t, state.mode?.[t] || "standard").body);
  if (["short", "human", "standard"].includes(act) && t) { state.mode = { ...(state.mode || {}) }; if (act === "standard") delete state.mode[t]; else state.mode[t] = act; save(); rerender(); }
}, true);

new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
queue();
