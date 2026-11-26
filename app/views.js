// StatAtlas views — every page of the atlas, rendered from the data.
import { COUNTRIES, DATA_VINTAGE, HIST_YEARS } from "./data.js";
import { INDICATORS, IND_BY_KEY, fmtValue, fmtShort } from "./indicators.js";
import { lineChart, duelBars, miniBar } from "./charts.js";
import { worldMap, ranked, rankOf } from "./map.js";

const byCode = Object.fromEntries(COUNTRIES.map((c) => [c[0], c]));
const REGION_ORDER = ["South Asia", "East Asia & Pacific", "Europe & Central Asia", "Middle East, North Africa, Afghanistan & Pakistan", "Sub-Saharan Africa", "Latin America & Caribbean", "North America"];

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function link(code) {
  const c = byCode[code];
  return `<a class="country-link" href="#/country/${code}">${esc(c ? c[1] : code)}</a>`;
}
function yearTag(c, i) {
  return c[6][i] ? `<span class="muted small">${c[6][i]}</span>` : `<span class="muted small">—</span>`;
}

/** World totals the atlas can state honestly, computed from the rows. */
export function worldTotals() {
  const pop = COUNTRIES.reduce((s, c) => s + (c[5][0] || 0), 0);
  const gdp = COUNTRIES.reduce((s, c) => s + (c[5][1] || 0), 0);
  const lives = COUNTRIES.map((c) => c[5][3]).filter((v) => v !== null);
  const medianLife = lives.slice().sort((a, b) => a - b)[Math.floor(lives.length / 2)];
  return { countries: COUNTRIES.length, figures: COUNTRIES.length * INDICATORS.length, pop, gdp, medianLife };
}

/* ---------------- home ---------------- */
const MAP_INDICES = [0, 2, 3, 9, 5, 7]; // pop, GDP pc, life, internet, urban, inflation

export function homeView(indIndex) {
  const ind = INDICATORS[indIndex];
  const t = worldTotals();
  const top10 = ranked(COUNTRIES, indIndex, 10, true);
  const topCodes = top10.map((c) => c[0]);
  const chips = MAP_INDICES.map((i) =>
    `<button class="chip${i === indIndex ? " active" : ""}" data-map-ind="${i}">${INDICATORS[i].short}</button>`).join("");
  const rows = top10.map((c, i) => {
    const v = c[5][indIndex];
    return `<tr><td class="rank">#${i + 1}</td><td>${link(c[0])}</td><td class="num"><b>${fmtShort(ind, v)}</b></td><td class="num muted">${c[6][indIndex]}</td></tr>`;
  }).join("");
  const surprises = surpriseFindings().slice(0, 3);
  const regions = regionCards();
  return `
  <section class="page-head">
    <p class="kicker">World Bank data · 1960–2024</p>
    <h1>Every country, every number that matters.</h1>
    <p>StatAtlas ranks and compares <b>${t.countries} countries</b> across <b>${INDICATORS.length} indicators</b> — ${t.figures.toLocaleString("en-US")} real figures, each with its source and year. Pick an indicator, colour the world, then click any country to open its full profile.</p>
  </section>
  <div class="stat-strip">
    <div class="stat"><b>${t.countries}</b><span>countries ranked</span></div>
    <div class="stat"><b>${INDICATORS.length}</b><span>indicators per country</span></div>
    <div class="stat"><b>${t.figures.toLocaleString("en-US")}</b><span>figures, all sourced</span></div>
    <div class="stat"><b>${(t.pop / 1e9).toFixed(2)}B</b><span>people covered (2024)</span></div>
  </div>
  <div class="grid grid-main">
    <section class="card map-panel" aria-label="World map">
      <div class="controls"><label>Colour the map by</label><span class="chip-row" id="map-chips">${chips}</span></div>
      <div id="map-holder">${worldMap(COUNTRIES, indIndex, topCodes)}</div>
    </section>
    <section class="card">
      <h2>Top 10 — ${esc(ind.name)}</h2>
      <p class="muted small">${esc(ind.blurb)} Source: World Bank WDI ${esc(ind.code)}.</p>
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Country</th><th class="num">${esc(ind.short)}</th><th class="num">Year</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <p><a class="btn ghost" href="#/rankings?ind=${ind.key}">See all ${t.countries} →</a></p>
    </section>
  </div>
  <div class="section-title"><h2>The atlas of surprises</h2><span class="muted">Findings computed from the data — nothing invented. <a href="#/surprises">All 8 →</a></span></div>
  <div class="grid grid-3">
    ${surprises.map((s) => surpriseCard(s)).join("")}
  </div>
  <div class="section-title"><h2>Browse by region</h2><span class="muted">Every region in the atlas</span></div>
  <div class="grid grid-3">${regions}</div>
  <div class="section-title"><h2>Start exploring</h2></div>
  <div class="grid grid-3">
    <section class="card"><h3>Biggest countries</h3><p class="muted small">By population, 2024.</p><p>${ranked(COUNTRIES, 0, 5, true).map((c) => link(c[0])).join(" · ")}</p><p><a href="#/rankings?ind=pop">Full ranking →</a></p></section>
    <section class="card"><h3>Longest lives</h3><p class="muted small">Life expectancy at birth.</p><p>${ranked(COUNTRIES, 3, 5, true).map((c) => link(c[0])).join(" · ")}</p><p><a href="#/rankings?ind=life">Full ranking →</a></p></section>
    <section class="card"><h3>Richest per person</h3><p class="muted small">GDP per capita, current US$.</p><p>${ranked(COUNTRIES, 2, 5, true).map((c) => link(c[0])).join(" · ")}</p><p><a href="#/rankings?ind=gdppc">Full ranking →</a></p></section>
  </div>`;
}

function regionCards() {
  const groups = {};
  for (const c of COUNTRIES) groups[c[2]] = groups[c[2]] || [];
  for (const c of COUNTRIES) groups[c[2]].push(c);
  const order = [...REGION_ORDER, ...Object.keys(groups).filter((r) => !REGION_ORDER.includes(r))];
  return order.filter((r) => groups[r]).map((r) => {
    const cs = groups[r];
    const lives = cs.map((c) => c[5][3]).filter((v) => v !== null).sort((a, b) => a - b);
    const med = lives.length ? lives[Math.floor(lives.length / 2)].toFixed(1) : "—";
    const biggest = cs.slice().sort((a, b) => (b[5][0] || 0) - (a[5][0] || 0))[0];
    return `<section class="card"><h3>${esc(r)}</h3>
      <p class="muted small">${cs.length} countries · median life expectancy ${med} years (2024)</p>
      <p>Largest: ${link(biggest[0])} — ${fmtShort(IND_BY_KEY.pop, biggest[5][0])} people.</p>
      <p>${cs.slice().sort((a, b) => (b[5][0] || 0) - (a[5][0] || 0)).slice(0, 4).map((c) => link(c[0])).join(" · ")}</p></section>`;
  }).join("");
}

/* ---------------- surprises ---------------- */
export function surpriseFindings() {
  const f = [];
  const lifeTop = ranked(COUNTRIES, 3, 1, true)[0];
  f.push({ tone: "teal", big: `${lifeTop[5][3].toFixed(1)} years`, small: `in ${lifeTop[1]}`,
    title: "The longest lives on Earth", body: `${lifeTop[1]} tops the atlas for life expectancy — ${lifeTop[5][3].toFixed(1)} years at birth, ${lifeTop[6][3]}. The top five are all in East Asia and Western Europe.`, code: lifeTop[0], ind: 3 });
  const lowIncome = COUNTRIES.filter((c) => c[5][2] !== null && c[5][2] < 5000 && c[5][3] !== null)
    .sort((a, b) => b[5][3] - a[5][3])[0];
  f.push({ tone: "", big: `${lowIncome[5][3].toFixed(1)} years`, small: `in ${lowIncome[1]}`,
    title: "Long life on a small income", body: `${lowIncome[1]} lives ${lowIncome[5][3].toFixed(1)} years on just $${Math.round(lowIncome[5][2]).toLocaleString("en-US")} of GDP per person (${lowIncome[6][2]}) — proof that money is not the whole story of health.`, code: lowIncome[0], ind: 3 });
  const shrink = COUNTRIES.filter((c) => c[5][15] !== null).sort((a, b) => a[5][15] - b[5][15])[0];
  f.push({ tone: "gold", big: `${shrink[5][15].toFixed(1)}% a year`, small: `in ${shrink[1]}`,
    title: "The fastest-shrinking country", body: `${shrink[1]}'s population is falling ${Math.abs(shrink[5][15]).toFixed(1)}% a year (${shrink[6][15]}). ${shrink[1]} also has one of the world's oldest populations — ${shrink[5][11].toFixed(1)}% are 65 or older.`, code: shrink[0], ind: 15 });
  const urbanTop = ranked(COUNTRIES, 5, 1, true)[0];
  f.push({ tone: "blue", big: `${urbanTop[5][5].toFixed(1)}% urban`, small: `in ${urbanTop[1]}`,
    title: "A country that is one city", body: `${urbanTop[5][5].toFixed(1)}% of ${urbanTop[1]}'s people live in urban areas (${urbanTop[6][5]}) — the most urban country in the atlas.`, code: urbanTop[0], ind: 5 });
  const fertile = ranked(COUNTRIES, 4, 1, true)[0];
  f.push({ tone: "", big: `${fertile[5][4].toFixed(2)} children`, small: `per woman in ${fertile[1]}`,
    title: "The highest fertility on Earth", body: `Women in ${fertile[1]} have on average ${fertile[5][4].toFixed(2)} children (${fertile[6][4]}). Its population grows ${fertile[5][15] !== null ? fertile[5][15].toFixed(1) + "% a year" : "fast"} — and its median age is among the world's youngest.`, code: fertile[0], ind: 4 });
  const forestTop = ranked(COUNTRIES, 10, 1, true)[0];
  f.push({ tone: "teal", big: `${forestTop[5][10].toFixed(1)}% forest`, small: `in ${forestTop[1]}`,
    title: "Almost entirely forest", body: `${forestTop[5][10].toFixed(1)}% of ${forestTop[1]} is forest (${forestTop[6][10]}) — the greenest country in the atlas by land cover.`, code: forestTop[0], ind: 10 });
  const netTop = ranked(COUNTRIES, 9, 1, true)[0];
  f.push({ tone: "gold", big: `${netTop[5][9].toFixed(1)}% online`, small: `in ${netTop[1]}`,
    title: "The most connected country", body: `${netTop[5][9].toFixed(1)}% of people in ${netTop[1]} use the internet (${netTop[6][9]}). The atlas median is far lower — most countries sit between 50% and 90%.`, code: netTop[0], ind: 9 });
  const poorBig = COUNTRIES.filter((c) => c[5][2] !== null && c[5][2] < 2000 && c[5][0] !== null)
    .sort((a, b) => b[5][0] - a[5][0])[0];
  f.push({ tone: "blue", big: `${fmtShort(IND_BY_KEY.pop, poorBig[5][0])} people`, small: `in ${poorBig[1]}`,
    title: "Huge, and still poor per person", body: `${poorBig[1]} has ${fmtShort(IND_BY_KEY.pop, poorBig[5][0])} people but only $${Math.round(poorBig[5][2]).toLocaleString("en-US")} of GDP per person (${poorBig[6][2]}) — the largest country in the atlas earning under $2,000 a head.`, code: poorBig[0], ind: 2 });
  return f;
}

function surpriseCard(s) {
  const ind = INDICATORS[s.ind];
  return `<article class="card surprise-card ${s.tone}">
    <h3>${esc(s.title)}</h3>
    <p class="big">${esc(s.big)} <small>${esc(s.small)}</small></p>
    <p>${esc(s.body)}</p>
    <p class="small"><a href="#/country/${s.code}">Open ${esc(byCode[s.code][1])} →</a> · <a href="#/rankings?ind=${ind.key}">${esc(ind.name)} ranking →</a></p>
  </article>`;
}

export function surprisesView() {
  return `
  <section class="page-head">
    <p class="kicker">Computed from the data · nothing invented</p>
    <h1>The atlas of surprises</h1>
    <p>Eight findings the data itself throws up. Each one is computed live from the 115-country dataset — open the country page to check the numbers, and the ranking to see who comes next.</p>
  </section>
  <div class="surprise-grid">${surpriseFindings().map((s) => surpriseCard(s)).join("")}</div>`;
}

/* ---------------- country ---------------- */
export function countryView(code) {
  const c = byCode[code];
  if (!c) {
    return `<section class="page-head"><h1>Country not found</h1><p>There is no <b>${esc(code)}</b> in the atlas. <a href="#/">Back to the atlas →</a></p></section>`;
  }
  const badges = [0, 2, 3, 1].map((i) => {
    const r = rankOf(COUNTRIES, code, i);
    if (!r) return "";
    return `<span class="rank-badge"><b>#${r.rank}</b> of ${r.of} by ${INDICATORS[i].short}</span>`;
  }).join("");
  const big = (i) => {
    const ind = INDICATORS[i];
    const v = c[5][i];
    return `<div class="big-stat"><div class="label">${esc(ind.name)}</div><div class="value num">${fmtValue(ind, v)}</div><div class="year">${v === null ? "Not reported to the World Bank" : "Latest: " + c[6][i] + " · World Bank WDI " + ind.code}</div></div>`;
  };
  const charts = [
    { title: "Population, 1960–2024", years: HIST_YEARS, values: c[7], ind: IND_BY_KEY.pop },
    { title: "GDP per capita, 1960–2024 (US$)", years: HIST_YEARS, values: c[8], ind: IND_BY_KEY.gdppc },
    { title: "Life expectancy, 1960–2024 (years)", years: HIST_YEARS, values: c[9], ind: IND_BY_KEY.life },
  ].map((ch) => `<section class="card"><h3>${esc(ch.title)}</h3>${lineChart({ title: ch.title, years: ch.years, values: ch.values, format: (v) => fmtShort(ch.ind, v) })}</section>`).join("");
  const maxByInd = INDICATORS.map((_, i) => Math.max(...COUNTRIES.map((x) => x[5][i] || 0)));
  const tableRows = INDICATORS.map((ind, i) => {
    const v = c[5][i];
    const r = rankOf(COUNTRIES, code, i);
    const pct = v === null || maxByInd[i] === 0 ? 0 : (Math.abs(v) / maxByInd[i]) * 100;
    return `<tr><td><a class="country-link" href="#/rankings?ind=${ind.key}">${esc(ind.name)}</a><br><span class="muted small">${esc(ind.blurb)}</span></td>
      <td class="num"><b>${fmtValue(ind, v)}</b> <span class="muted small">${esc(ind.unit)}</span></td>
      <td class="num">${v === null ? "—" : c[6][i]}</td>
      <td class="num">${r ? "#" + r.rank + " of " + r.of : "—"}</td>
      <td class="bar-cell">${miniBar(pct, r && r.rank <= 3 ? "hot" : "")}</td></tr>`;
  }).join("");
  const neighbours = COUNTRIES.filter((x) => x[2] === c[2] && x[0] !== code)
    .sort((a, b) => (b[5][0] || 0) - (a[5][0] || 0)).slice(0, 6);
  const pop1960 = c[7][0], pop2024 = c[7][3];
  const growth = pop1960 && pop2024 ? ((pop2024 - pop1960) / pop1960 * 100) : null;
  return `
  <section class="page-head">
    <p class="kicker">${esc(c[2])} · World Bank region</p>
    <div class="country-hero">
      <span class="code-tile" aria-hidden="true">${esc(code)}</span>
      <div><h1>${esc(c[1])}</h1>
      <p>${growth !== null ? `Its population grew from ${fmtShort(IND_BY_KEY.pop, pop1960)} in 1960 to ${fmtShort(IND_BY_KEY.pop, pop2024)} in 2024 — ${growth >= 0 ? "+" : ""}${growth.toFixed(0)}% in 64 years.` : "Population history is incomplete for this country."} ${badges}</p></div>
    </div>
  </section>
  <div class="big-stats">${big(0)}${big(1)}${big(2)}${big(3)}</div>
  <div class="grid grid-3">${charts}</div>
  <div class="section-title"><h2>Every indicator, with its year</h2><span class="muted">Source: World Bank World Development Indicators</span></div>
  <section class="card"><div class="table-wrap"><table>
    <thead><tr><th>Indicator</th><th class="num">Value</th><th class="num">Year</th><th class="num">World rank</th><th>Share of the world leader</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table></div></section>
  <div class="section-title"><h2>Neighbours in ${esc(c[2])}</h2><span class="muted">Largest by population</span></div>
  <section class="card"><p>${neighbours.map((n) => link(n[0])).join(" · ")}</p>
  <p><a class="btn ghost" href="#/compare/${code}/${neighbours[0] ? neighbours[0][0] : "USA"}">Compare with ${neighbours[0] ? esc(neighbours[0][1]) : "the USA"} →</a></p></section>`;
}

/* ---------------- rankings ---------------- */
export function rankingsView(indKey, region, worstFirst) {
  const indIndex = Math.max(0, INDICATORS.findIndex((d) => d.key === indKey));
  const ind = INDICATORS[indIndex];
  const regions = [...new Set(COUNTRIES.map((c) => c[2]))].sort();
  const list = COUNTRIES.filter((c) => (!region || c[2] === region) && c[5][indIndex] !== null && c[5][indIndex] !== undefined);
  const dir = worstFirst ? (ind.higherBetter === false ? -1 : 1) : (ind.higherBetter === false ? 1 : -1);
  list.sort((a, b) => dir * (a[5][indIndex] - b[5][indIndex]));
  const maxV = Math.max(...list.map((c) => Math.abs(c[5][indIndex])), 1e-9);
  const rows = list.map((c, i) => {
    const v = c[5][indIndex];
    return `<tr><td class="rank">#${i + 1}</td><td>${link(c[0])}</td><td class="muted small">${esc(c[2])}</td>
      <td class="num"><b>${fmtShort(ind, v)}</b></td><td class="bar-cell">${miniBar((Math.abs(v) / maxV) * 100, i === 0 ? "hot" : "")}</td>
      <td class="num muted">${c[6][indIndex]}</td></tr>`;
  }).join("");
  const missing = COUNTRIES.filter((c) => (!region || c[2] === region) && (c[5][indIndex] === null || c[5][indIndex] === undefined));
  return `
  <section class="page-head">
    <p class="kicker">Full ranking · ${list.length} countries report this figure</p>
    <h1>Rankings — ${esc(ind.name)}</h1>
    <p>${esc(ind.blurb)} Source: World Bank WDI ${esc(ind.code)}. Each figure shows the year it was measured.</p>
  </section>
  <section class="card">
    <div class="controls">
      <label for="rank-ind">Indicator</label>
      <select id="rank-ind">${INDICATORS.map((d, i) => `<option value="${d.key}"${i === indIndex ? " selected" : ""}>${esc(d.name)}</option>`).join("")}</select>
      <label for="rank-region">Region</label>
      <select id="rank-region"><option value="">All regions</option>${regions.map((r) => `<option${r === region ? " selected" : ""}>${esc(r)}</option>`).join("")}</select>
      <button class="chip${worstFirst ? " active" : ""}" id="rank-flip" type="button">${worstFirst ? "Worst first ✓" : "Best first ✓"}</button>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>#</th><th>Country</th><th>Region</th><th class="num">${esc(ind.short)}</th><th></th><th class="num">Year</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    ${missing.length ? `<p class="muted small">Not reported: ${missing.map((c) => esc(c[1])).join(", ")}.</p>` : ""}
  </section>`;
}

/* ---------------- compare ---------------- */
export function compareView(aCode, bCode) {
  const a = byCode[aCode] || byCode["IND"];
  const b = byCode[bCode] || byCode["CHN"];
  const opts = (sel) => COUNTRIES.slice().sort((x, y) => x[1].localeCompare(y[1]))
    .map((c) => `<option value="${c[0]}"${c[0] === sel ? " selected" : ""}>${esc(c[1])}</option>`).join("");
  let aWins = 0, bWins = 0, draws = 0;
  const rows = INDICATORS.map((ind, i) => {
    const va = a[5][i], vb = b[5][i];
    let clsA = "", clsB = "", mark = "";
    if (va !== null && vb !== null && va !== vb && ind.higherBetter !== null) {
      const aBetter = ind.higherBetter ? va > vb : va < vb;
      if (aBetter) { aWins++; clsA = "winner"; clsB = "loser"; mark = "◀ wins"; }
      else { bWins++; clsB = "winner"; clsA = "loser"; mark = "wins ▶"; }
    } else if (va === null || vb === null) { draws++; mark = "not comparable"; }
    else { draws++; mark = "tie"; }
    return `<div class="battle-row">
      <div class="side l ${clsA}">${fmtValue(ind, va)}</div>
      <div class="mid">${esc(ind.name)}<br><b>${esc(mark)}</b></div>
      <div class="side r ${clsB}">${fmtValue(ind, vb)}</div>
    </div>`;
  }).join("");
  const duel = duelBars({
    leftLabel: a[1], rightLabel: b[1],
    leftValue: a[5][0], rightValue: b[5][0],
    format: (v) => fmtShort(IND_BY_KEY.pop, v),
  });
  const verdict = aWins === bWins ? `Dead even — ${a[1]} and ${b[1]} split the indicators ${aWins}–${bWins}.`
    : aWins > bWins ? `${a[1]} takes it ${aWins}–${bWins}: stronger on ${aWins} of the ${INDICATORS.length} indicators where higher or lower clearly wins.`
    : `${b[1]} takes it ${bWins}–${aWins}: stronger on ${bWins} of the ${INDICATORS.length} indicators where higher or lower clearly wins.`;
  return `
  <section class="page-head">
    <p class="kicker">Head-to-head · ${INDICATORS.length} indicators</p>
    <h1>${esc(a[1])} <span class="muted">vs</span> ${esc(b[1])}</h1>
    <p>Every indicator, side by side. A win counts only where higher (or lower) is clearly better — population, GDP and fertility are shown but never scored.</p>
  </section>
  <section class="card">
    <div class="controls">
      <label for="cmp-a">Country A</label><select id="cmp-a">${opts(a[0])}</select>
      <span class="vs-badge" aria-hidden="true">VS</span>
      <label for="cmp-b">Country B</label><select id="cmp-b">${opts(b[0])}</select>
    </div>
    <div class="scoreboard">
      <div class="score"><b>${aWins}</b><span>${esc(a[1])} wins</span></div>
      <div class="score"><b>${draws}</b><span>ties / not comparable</span></div>
      <div class="score"><b>${bWins}</b><span>${esc(b[1])} wins</span></div>
    </div>
    <p><b>Verdict:</b> ${esc(verdict)}</p>
    <h3>Population, head to head</h3>
    ${duel}
  </section>
  <div class="section-title"><h2>All ${INDICATORS.length} indicators</h2></div>
  <section class="card">${rows}
    <p class="muted small" style="margin-top:12px">Figures: World Bank WDI, latest 2015–2024, each country's year shown on its <a href="#/country/${a[0]}">profile</a>. <a href="#/country/${a[0]}">${esc(a[1])} profile →</a> · <a href="#/country/${b[0]}">${esc(b[1])} profile →</a></p>
  </section>`;
}

/* ---------------- sources ---------------- */
export function sourcesView() {
  const coverage = INDICATORS.map((ind, i) => {
    const reporters = COUNTRIES.filter((c) => c[5][i] !== null && c[5][i] !== undefined);
    const yrs = reporters.map((c) => c[6][i]);
    const lo = Math.min(...yrs), hi = Math.max(...yrs);
    return `<tr><td><b>${esc(ind.name)}</b><br><span class="muted small">${esc(ind.blurb)}</span></td>
      <td><code>${ind.code}</code></td><td class="num">${reporters.length} / ${COUNTRIES.length}</td>
      <td class="num">${lo}–${hi}</td></tr>`;
  }).join("");
  return `
  <section class="page-head">
    <p class="kicker">Method · vintage · honesty box</p>
    <h1>Sources &amp; method</h1>
    <p>${esc(DATA_VINTAGE)}. Every figure on this site comes from that one source, and every figure shows the year it was measured.</p>
  </section>
  <section class="card">
    <h2>How the atlas is built</h2>
    <dl class="kv">
      <dt>Source</dt><dd>World Bank World Development Indicators (WDI), the World Bank's open database of national statistics.</dd>
      <dt>Vintage</dt><dd>Downloaded 26 November 2026. For each indicator and country we take the latest non-null value from 2015–2024 and print its year beside the figure.</dd>
      <dt>Countries</dt><dd>115 countries — the largest by population that report at least 8 of the 18 indicators. Small states and territories the Bank does not report separately are not in the atlas.</dd>
      <dt>History</dt><dd>Population, GDP per capita and life expectancy are also shown for 1960, 1980, 2000 and 2024, where the Bank reports them.</dd>
      <dt>Regions</dt><dd>World Bank regions, as the Bank lists them.</dd>
      <dt>Surprises</dt><dd>Computed live from the dataset on this page's own code — the site ranks the numbers and reports the extremes. Nothing is hand-picked or invented.</dd>
      <dt>Offline</dt><dd>The atlas loads nothing from the network. All figures, code and styles are files of this site.</dd>
    </dl>
  </section>
  <div class="section-title"><h2>All ${INDICATORS.length} indicators</h2></div>
  <section class="card"><div class="table-wrap"><table>
    <thead><tr><th>Indicator</th><th>WDI code</th><th class="num">Countries reporting</th><th class="num">Years</th></tr></thead>
    <tbody>${coverage}</tbody>
  </table></div></section>
  <div class="section-title"><h2>Date check — what we left out</h2></div>
  <section class="datecheck">
    <h3>✓ Checked 26 November 2026</h3>
    <ul>
      <li><b>CO₂ per person is missing on purpose.</b> The World Bank retired its CO₂ indicators from the WDI API, so no figure is shown rather than a stale or invented one. The atlas uses the share of people aged 65+ instead.</li>
      <li><b>Adult literacy is missing for 36 countries</b> — including the United States, which does not report it to the WDI. Those cells say "not reported", never a guess.</li>
      <li><b>Years differ per figure.</b> Most figures are 2024, but some (literacy, enrolment, health spending) are 2017–2023. The year is printed next to every figure so nothing looks newer than it is.</li>
      <li><b>History is four snapshots</b> (1960, 1980, 2000, 2024) for three indicators only. No other history is claimed.</li>
      <li><b>Nothing here is a forecast.</b> Every number is a published statistic, not a prediction.</li>
    </ul>
  </section>`;
}
