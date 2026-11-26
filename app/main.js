// StatAtlas shell — routing, search, ticker and the controls that wire
// the views together. All rendering lives in views.js; this file only
// decides which view to show and keeps the chrome (nav, search) alive.
import { COUNTRIES } from "./data.js";
import { INDICATORS, fmtShort } from "./indicators.js";
import { homeView, countryView, rankingsView, compareView, surprisesView, sourcesView, worldTotals } from "./views.js";

const view = document.getElementById("view");
const searchInput = document.getElementById("country-search");
const searchResults = document.getElementById("search-results");
const ticker = document.getElementById("ticker");

let mapInd = 2; // GDP per capita colours the map first

function setActiveNav(route) {
  document.querySelectorAll(".topnav a").forEach((a) => {
    a.classList.toggle("active", a.dataset.nav === route);
  });
}

/** Headline ticker: a few true, dated figures across the top of every page. */
function renderTicker() {
  const by = (i) => COUNTRIES.filter((c) => c[5][i] !== null && c[5][i] !== undefined);
  const top = (i) => by(i).slice().sort((a, b) => b[5][i] - a[5][i])[0];
  const pop = top(0), life = top(3), rich = top(2);
  const t = worldTotals();
  const items = [
    `<b>${(t.pop / 1e9).toFixed(2)} billion</b> people in ${t.countries} countries`,
    `<b>${pop[1]}</b> is the most populous — ${fmtShort(INDICATORS[0], pop[5][0])} (${pop[6][0]})`,
    `<b>${life[1]}</b> lives longest — ${life[5][3].toFixed(1)} years (${life[6][3]})`,
    `<b>${rich[1]}</b> is richest per person — ${fmtShort(INDICATORS[2], rich[5][2])} (${rich[6][2]})`,
    `Median life expectancy across the atlas: <b>${t.medianLife.toFixed(1)} years</b>`,
  ];
  ticker.innerHTML = items.join('<span class="dot" aria-hidden="true">◆</span>');
}

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, query] = raw.split("?");
  const parts = path.split("/").filter(Boolean);
  const params = new URLSearchParams(query || "");
  return { parts, params };
}

function render() {
  const { parts, params } = parseHash();
  const [page, arg, arg2] = parts;
  window.scrollTo(0, 0);
  if (page === "country" && arg) {
    setActiveNav("");
    view.innerHTML = countryView(arg.toUpperCase());
  } else if (page === "rankings") {
    setActiveNav("rankings");
    const indKey = params.get("ind") || "gdppc";
    const region = params.get("region") || "";
    const worst = params.get("order") === "worst";
    view.innerHTML = rankingsView(indKey, region, worst);
    wireRankings(indKey, region, worst);
  } else if (page === "compare") {
    setActiveNav("compare");
    view.innerHTML = compareView((arg || "IND").toUpperCase(), (arg2 || "CHN").toUpperCase());
    wireCompare();
  } else if (page === "surprises") {
    setActiveNav("surprises");
    view.innerHTML = surprisesView();
  } else if (page === "sources") {
    setActiveNav("sources");
    view.innerHTML = sourcesView();
  } else {
    setActiveNav("home");
    view.innerHTML = homeView(mapInd);
    wireHome();
  }
}

function wireHome() {
  document.querySelectorAll("#map-chips .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      mapInd = Number(chip.dataset.mapInd);
      render();
    });
  });
}

function wireRankings(indKey, region, worst) {
  const indSel = document.getElementById("rank-ind");
  const regSel = document.getElementById("rank-region");
  const flip = document.getElementById("rank-flip");
  const go = () => {
    const q = new URLSearchParams({ ind: indSel.value });
    if (regSel.value) q.set("region", regSel.value);
    if (flip.classList.contains("active")) q.set("order", "worst");
    location.hash = "#/rankings?" + q.toString();
  };
  indSel.addEventListener("change", go);
  regSel.addEventListener("change", go);
  flip.addEventListener("click", () => {
    flip.classList.toggle("active");
    go();
  });
}

function wireCompare() {
  const a = document.getElementById("cmp-a");
  const b = document.getElementById("cmp-b");
  const go = () => {
    if (a.value === b.value) return; // keep two different countries
    location.hash = `#/compare/${a.value}/${b.value}`;
  };
  a.addEventListener("change", go);
  b.addEventListener("change", go);
}

/* ---------------- search ---------------- */
function doSearch(q) {
  const query = q.trim().toLowerCase();
  if (query.length < 2) {
    searchResults.hidden = true;
    searchResults.innerHTML = "";
    return;
  }
  const hits = COUNTRIES.filter((c) =>
    c[1].toLowerCase().includes(query) || c[0].toLowerCase() === query
  ).slice(0, 8);
  if (!hits.length) {
    searchResults.innerHTML = `<li><a href="#/sources">No country matches “${q.trim()}” — see the sources page for coverage.</a></li>`;
  } else {
    searchResults.innerHTML = hits.map((c) =>
      `<li><a href="#/country/${c[0]}"><span>${c[1]}</span><span class="code">${c[0]} · ${c[2]}</span></a></li>`).join("");
  }
  searchResults.hidden = false;
}

searchInput.addEventListener("input", () => doSearch(searchInput.value));
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { searchResults.hidden = true; searchInput.blur(); }
  if (e.key === "Enter") {
    const first = searchResults.querySelector("a");
    if (first) { location.hash = first.getAttribute("href"); searchResults.hidden = true; searchInput.value = ""; }
  }
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".searchbox")) searchResults.hidden = true;
});
searchResults.addEventListener("click", () => {
  searchResults.hidden = true;
  searchInput.value = "";
});

renderTicker();
window.addEventListener("hashchange", render);
render();
