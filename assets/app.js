import { libraries, categories, frameworks, stylings, featureLabels } from "../data/libraries.js";

const $ = (sel) => document.querySelector(sel);
const MAX_COMPARE = 4;
const FOUNDATION_CATS = ["css-framework", "tailwind-kit", "component-library", "headless", "web-components", "mobile"];

const state = {
  q: "",
  category: new Set(),
  framework: new Set(),
  styling: new Set(),
  features: new Set(),
  design: "",
  license: "",
  sort: "category",
  compare: new Set(),
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const hue = (id) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const initials = (name) => name.replace(/\(.*\)/, "").split(/[\s.\-/]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const byId = new Map(libraries.map((l) => [l.id, l]));
const uniq = (arr) => [...new Set(arr)].sort((a, b) => a.localeCompare(b));
const count = (pred) => libraries.filter(pred).length;

// ── Build filter controls ─────────────────────────────────────────
function buildFilters() {
  $("#f-category").innerHTML = Object.entries(categories)
    .map(([k, v]) => `<label class="chip"><input type="checkbox" name="category" value="${k}"><span>${esc(v)}</span></label>`)
    .join("");

  const checks = (entries, name, pred) =>
    entries.map(([k, v]) => `<label class="check"><input type="checkbox" name="${name}" value="${k}"> ${esc(v)} <span class="n">${count((l) => pred(l, k))}</span></label>`).join("");
  $("#f-framework").innerHTML = checks(Object.entries(frameworks), "framework", (l, k) => l.frameworks.includes(k));
  $("#f-styling").innerHTML = checks(Object.entries(stylings), "styling", (l, k) => l.styling === k);
  $("#f-features").innerHTML = checks(Object.entries(featureLabels), "features", (l, k) => l.features.includes(k));

  const designs = uniq(libraries.map((l) => l.designLanguage).filter((d) => d !== "None"));
  $("#f-design").insertAdjacentHTML("beforeend", designs.map((d) => `<option>${esc(d)}</option>`).join(""));
  $("#f-license").insertAdjacentHTML("beforeend", uniq(libraries.map((l) => l.license)).map((d) => `<option>${esc(d)}</option>`).join(""));

  $("#w-framework").insertAdjacentHTML("beforeend", Object.entries(frameworks).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join(""));
  $("#w-design").insertAdjacentHTML("beforeend", designs.filter((d) => !["Custom", "Unstyled", "Themeable"].includes(d)).map((d) => `<option>${esc(d)}</option>`).join(""));
}

// ── URL hash <-> state ────────────────────────────────────────────
function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  state.q = p.get("q") ?? "";
  for (const k of ["category", "framework", "styling", "features", "compare"]) {
    state[k] = new Set((p.get(k) ?? "").split(",").filter(Boolean));
  }
  state.compare = new Set([...state.compare].filter((id) => byId.has(id)).slice(0, MAX_COMPARE));
  state.design = p.get("design") ?? "";
  state.license = p.get("license") ?? "";
  state.sort = p.get("sort") ?? "category";
}

function writeHash() {
  const p = new URLSearchParams();
  if (state.q) p.set("q", state.q);
  for (const k of ["category", "framework", "styling", "features", "compare"]) if (state[k].size) p.set(k, [...state[k]].join(","));
  if (state.design) p.set("design", state.design);
  if (state.license) p.set("license", state.license);
  if (state.sort !== "category") p.set("sort", state.sort);
  const h = p.toString().replace(/%2C/g, ",");
  history.replaceState(null, "", h ? `#${h}` : location.pathname + location.search);
}

function syncControls() {
  $("#search").value = state.q;
  $("#sort").value = state.sort;
  $("#f-design").value = state.design;
  $("#f-license").value = state.license;
  for (const k of ["category", "framework", "styling", "features"]) {
    document.querySelectorAll(`#filter-form input[name="${k}"]`).forEach((el) => (el.checked = state[k].has(el.value)));
  }
}

// ── Filtering ─────────────────────────────────────────────────────
function matches(lib) {
  if (state.category.size && !state.category.has(lib.category)) return false;
  if (state.framework.size && !lib.frameworks.some((f) => state.framework.has(f))) return false;
  if (state.styling.size && !state.styling.has(lib.styling)) return false;
  for (const f of state.features) if (!lib.features.includes(f)) return false;
  if (state.design && lib.designLanguage !== state.design) return false;
  if (state.license && lib.license !== state.license) return false;
  if (state.q) {
    const hay = [lib.name, lib.description, lib.bestFor, lib.designLanguage, categories[lib.category], ...lib.tags, ...lib.frameworks.map((f) => frameworks[f])]
      .join(" ").toLowerCase();
    if (!state.q.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t))) return false;
  }
  return true;
}

function sorted(list) {
  const catOrder = Object.keys(categories);
  const byName = (a, b) => a.name.localeCompare(b.name);
  if (state.sort === "name") return [...list].sort(byName);
  if (state.sort === "frameworks") return [...list].sort((a, b) => b.frameworks.length - a.frameworks.length || byName(a, b));
  return [...list].sort((a, b) => catOrder.indexOf(a.category) - catOrder.indexOf(b.category) || byName(a, b));
}

// ── Rendering ─────────────────────────────────────────────────────
function card(lib) {
  const sel = state.compare.has(lib.id);
  const full = !sel && state.compare.size >= MAX_COMPARE;
  return `<article class="card${sel ? " selected" : ""}" data-id="${lib.id}">
    <div class="card-head">
      <span class="mono" style="--h:${hue(lib.id)}" aria-hidden="true">${esc(initials(lib.name))}</span>
      <div>
        <h3><a href="${esc(lib.url)}" target="_blank" rel="noopener">${esc(lib.name)}</a></h3>
        <div class="cat">${esc(categories[lib.category])} · ${esc(stylings[lib.styling])}</div>
      </div>
    </div>
    <p>${esc(lib.description)}</p>
    <p class="best"><strong>Best for:</strong> ${esc(lib.bestFor)}</p>
    <div class="badges" aria-label="Frameworks">${lib.frameworks.map((f) => `<span class="badge fw">${esc(frameworks[f])}</span>`).join("")}</div>
    <div class="badges" aria-label="Features">
      ${lib.designLanguage !== "None" ? `<span class="badge">${esc(lib.designLanguage)}</span>` : ""}
      ${lib.features.map((f) => `<span class="badge feat">✓ ${esc(featureLabels[f])}</span>`).join("")}
    </div>
    <div class="card-foot">
      <div class="links">
        <a href="${esc(lib.url)}" target="_blank" rel="noopener">Website</a>
        ${lib.repo ? `<a href="${esc(lib.repo)}" target="_blank" rel="noopener">GitHub</a>` : ""}
        <span class="license">${esc(lib.license)}</span>
      </div>
      <label class="check"><input type="checkbox" class="cmp" value="${lib.id}" ${sel ? "checked" : ""} ${full ? "disabled" : ""}> Compare</label>
    </div>
  </article>`;
}

function render() {
  const list = sorted(libraries.filter(matches));
  let html = "";
  if (state.sort === "category") {
    let current = null;
    for (const lib of list) {
      if (lib.category !== current) {
        current = lib.category;
        html += `<h2 class="group-title">${esc(categories[current])} <small>${list.filter((l) => l.category === current).length}</small></h2>`;
      }
      html += card(lib);
    }
  } else {
    html = list.map(card).join("");
  }
  $("#grid").innerHTML = html;
  $("#empty").hidden = list.length > 0;
  $("#result-count").textContent = `Showing ${list.length} of ${libraries.length} libraries`;

  const active = state.category.size + state.framework.size + state.styling.size + state.features.size + (state.design ? 1 : 0) + (state.license ? 1 : 0);
  $("#active-count").textContent = active ? `${active} active` : "";
  renderTray();
  writeHash();
}

function renderTray() {
  const tray = $("#compare-tray");
  tray.hidden = state.compare.size === 0;
  $("#compare-list").innerHTML =
    [...state.compare].map((id) => `<span class="badge fw">${esc(byId.get(id).name)}<button type="button" data-remove="${id}" aria-label="Remove ${esc(byId.get(id).name)}">✕</button></span>`).join("") +
    `<span class="license">${state.compare.size}/${MAX_COMPARE} selected</span>`;
  $("#compare-open").disabled = state.compare.size < 2;
}

function renderCompare() {
  const libs = [...state.compare].map((id) => byId.get(id));
  const yes = (b) => (b ? `<span class="yes">✓</span>` : `<span class="no">—</span>`);
  const rows = [
    ["Category", (l) => esc(categories[l.category])],
    ["Frameworks", (l) => l.frameworks.map((f) => esc(frameworks[f])).join(", ")],
    ["Styling", (l) => esc(stylings[l.styling])],
    ["Design language", (l) => esc(l.designLanguage)],
    ...Object.entries(featureLabels).map(([k, v]) => [v, (l) => yes(l.features.includes(k))]),
    ["License", (l) => esc(l.license)],
    ["Best for", (l) => esc(l.bestFor)],
    ["Links", (l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">Website</a>${l.repo ? ` · <a href="${esc(l.repo)}" target="_blank" rel="noopener">GitHub</a>` : ""}`],
  ];
  $("#compare-table").innerHTML = `<table class="compare-table">
    <thead><tr><td></td>${libs.map((l) => `<th scope="col">${esc(l.name)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(([label, fn]) => `<tr><th scope="row">${esc(label)}</th>${libs.map((l) => `<td>${fn(l)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table>`;
}

// ── "Help me choose" ──────────────────────────────────────────────
function recommend({ framework, approach, design, extras }) {
  const fwOk = (l) => !framework || l.frameworks.includes(framework) || (["react", "vue", "angular", "svelte", "solid"].includes(framework) && l.frameworks.includes("html") && l.category === "css-framework");

  const foundations = libraries.filter((l) => FOUNDATION_CATS.includes(l.category) && fwOk(l)).map((l) => {
    let score = 0;
    const why = [];
    if (framework && l.frameworks.includes(framework)) { score += 3; why.push(`Supports ${frameworks[framework]}`); }
    if (approach === "ready") {
      if (["styled", "css-classes"].includes(l.styling) && l.category !== "headless") { score += 3; why.push("Polished components out of the box"); }
      else if (l.styling === "copy-paste" || l.category === "tailwind-kit") { score += 2; why.push("Ready-made designs you can tweak"); }
      if (l.category === "headless") score -= 4;
    } else if (approach === "control") {
      if (l.styling === "headless") { score += 4; why.push("Unstyled: you own every pixel"); }
      else if (l.styling === "copy-paste") { score += 4; why.push("You own the component source code"); }
      else if (l.styling === "utility-first") { score += 2; why.push("Utility classes for custom designs"); }
      if (l.features.includes("theming")) score += 1;
    } else if (approach === "css") {
      if (["css-framework", "tailwind-kit"].includes(l.category)) { score += 4; why.push("Pure CSS, works with any stack"); }
      else score -= 3;
    }
    if (design) {
      if (l.designLanguage === design) { score += 4; why.push(`Implements ${design}`); }
      else if (l.designLanguage === "Themeable") { score += 1; why.push("Themeable toward any brand"); }
      else score -= 1;
    }
    if (extras.includes("a11y") && l.features.includes("a11y")) { score += 2; why.push("Accessibility is a stated focus"); }
    if (extras.includes("dark-mode") && l.features.includes("dark-mode")) { score += 1; why.push("Dark mode support"); }
    if (l.features.includes("typescript")) score += 0.5;
    if (l.tags.includes("popular")) score += 0.5;
    return { l, score, why };
  }).sort((a, b) => b.score - a.score || a.l.name.localeCompare(b.l.name)).slice(0, 5);

  const addOns = ["animation", "icons", "data-viz"].filter((c) => extras.includes(c)).map((cat) => ({
    cat,
    picks: libraries.filter((l) => l.category === cat && (!framework || l.frameworks.includes(framework) || l.frameworks.includes("vanilla-js") || l.frameworks.includes("html")))
      .map((l) => ({ l, score: (framework && l.frameworks.includes(framework) ? 2 : 0) + l.features.length * 0.2 + l.frameworks.length * 0.1 }))
      .sort((a, b) => b.score - a.score).slice(0, 3),
  }));
  return { foundations, addOns };
}

function renderRecommendations(r) {
  const rec = ({ l, why }, i) => `<div class="rec">
    <div class="rec-head"><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.name)}</a><span class="rank">${i === 0 ? "Top pick · " : ""}${esc(categories[l.category])}</span></div>
    <div>${esc(l.bestFor)}</div>
    ${why.length ? `<ul>${why.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>` : ""}
  </div>`;
  let html = `<h3>Your UI foundation</h3>`;
  html += r.foundations.length ? r.foundations.map(rec).join("") : `<p>No foundation libraries match. Try “No preference” for the framework.</p>`;
  for (const { cat, picks } of r.addOns) {
    html += `<h3>${esc(categories[cat])}</h3>` + picks.map(({ l }, i) => rec({ l, why: [] }, i)).join("");
  }
  const ids = [...r.foundations.slice(0, 3), ...r.addOns.flatMap((a) => a.picks.slice(0, 1))].map((x) => x.l.id);
  html += `<button type="button" class="btn" id="wizard-compare" data-ids="${ids.slice(0, MAX_COMPARE).join(",")}">Compare top picks</button>`;
  $("#wizard-results").innerHTML = html;
  $("#wizard-results").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Events ────────────────────────────────────────────────────────
function bind() {
  let t;
  $("#search").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value.trim(); render(); }, 120); });
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  $("#f-design").addEventListener("change", (e) => { state.design = e.target.value; render(); });
  $("#f-license").addEventListener("change", (e) => { state.license = e.target.value; render(); });
  $("#filter-form").addEventListener("change", (e) => {
    const el = e.target;
    if (el.type !== "checkbox") return;
    state[el.name][el.checked ? "add" : "delete"](el.value);
    render();
  });
  const reset = () => {
    Object.assign(state, { q: "", design: "", license: "" });
    for (const k of ["category", "framework", "styling", "features"]) state[k].clear();
    syncControls();
    render();
  };
  $("#reset").addEventListener("click", reset);
  $("#empty-reset").addEventListener("click", reset);

  $("#grid").addEventListener("change", (e) => {
    if (!e.target.classList.contains("cmp")) return;
    state.compare[e.target.checked ? "add" : "delete"](e.target.value);
    render();
  });
  $("#compare-list").addEventListener("click", (e) => {
    const id = e.target.closest("[data-remove]")?.dataset.remove;
    if (id) { state.compare.delete(id); render(); }
  });
  $("#compare-clear").addEventListener("click", () => { state.compare.clear(); render(); });
  $("#compare-open").addEventListener("click", () => { renderCompare(); $("#compare-dialog").showModal(); });

  $("#open-wizard").addEventListener("click", () => $("#wizard-dialog").showModal());
  $("#wizard-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    renderRecommendations(recommend({ framework: fd.get("framework"), approach: fd.get("approach"), design: fd.get("design"), extras: fd.getAll("extras") }));
  });
  $("#wizard-results").addEventListener("click", (e) => {
    if (e.target.id !== "wizard-compare") return;
    state.compare = new Set(e.target.dataset.ids.split(",").filter(Boolean));
    render();
    $("#wizard-dialog").close();
    renderCompare();
    $("#compare-dialog").showModal();
  });

  document.querySelectorAll("dialog").forEach((d) => {
    d.addEventListener("click", (e) => { if (e.target === d || e.target.closest("[data-close]")) d.close(); });
  });

  $("#theme-toggle").addEventListener("click", () => {
    const root = document.documentElement;
    const isDark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = isDark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch {}
  });

  window.addEventListener("hashchange", () => { readHash(); syncControls(); render(); });

  const mq = matchMedia("(max-width: 860px)");
  const collapse = () => { $("#filters-panel").open = !mq.matches; };
  collapse();
  mq.addEventListener("change", collapse);
}

buildFilters();
readHash();
syncControls();
bind();
render();
