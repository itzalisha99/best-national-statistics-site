// StatAtlas world map — one dot per country at its real latitude and
// longitude, sized by population and coloured by the chosen indicator.
import { INDICATORS, fmtShort } from "./indicators.js";

export const MAP_W = 1000;
export const MAP_H = 500;

const SCALE = ["#dcebe4", "#a8d0c2", "#5aa897", "#0f766e", "#0a4f49"];
const LABELS = [
  ["NORTH AMERICA", -100, 62],
  ["SOUTH AMERICA", -62, -12],
  ["EUROPE", 12, 58],
  ["AFRICA", 18, 8],
  ["ASIA", 88, 54],
  ["OCEANIA", 138, -28],
];

function project(lat, lon) {
  return [(lon + 180) / 360 * MAP_W, (90 - lat) / 180 * MAP_H];
}

/** Quintile breaks for an indicator across the countries that report it. */
export function quintiles(countries, indIndex) {
  const vals = countries.map((c) => c[5][indIndex]).filter((v) => v !== null && v !== undefined).sort((a, b) => a - b);
  if (vals.length < 5) return null;
  return [0.2, 0.4, 0.6, 0.8].map((f) => vals[Math.floor(vals.length * f)]);
}

function colourFor(value, breaks) {
  if (value === null || value === undefined || !breaks) return "#c9bda0";
  let step = 0;
  for (const b of breaks) if (value >= b) step++;
  return SCALE[step];
}

/**
 * Render the map. countries: data rows. indIndex: which indicator colours
 * the dots. highlight: ISO3 codes to ring in gold (top 5 of the indicator).
 */
export function worldMap(countries, indIndex, highlight) {
  const ind = INDICATORS[indIndex];
  const breaks = quintiles(countries, indIndex);
  const rings = new Set(highlight || []);
  const grat = [];
  for (let lon = -150; lon <= 150; lon += 30) {
    const x = ((lon + 180) / 360 * MAP_W).toFixed(1);
    grat.push(`<line x1="${x}" y1="0" x2="${x}" y2="${MAP_H}" stroke="#e3d9bd" stroke-width="1"/>`);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180 * MAP_H).toFixed(1);
    grat.push(`<line x1="0" y1="${y}" x2="${MAP_W}" y2="${y}" stroke="#e3d9bd" stroke-width="1"/>`);
  }
  const labels = LABELS.map(([t, lon, lat]) => {
    const [x, y] = project(lat, lon);
    return `<text class="map-label" x="${x.toFixed(0)}" y="${y.toFixed(0)}" text-anchor="middle">${t}</text>`;
  }).join("");
  const maxPop = Math.max(...countries.map((c) => c[5][0] || 0));
  const dots = countries.map((c) => {
    const [x, y] = project(c[3], c[4]);
    const pop = c[5][0] || 1;
    const r = 3.2 + 7.5 * Math.sqrt(pop / maxPop);
    const v = c[5][indIndex];
    const fill = colourFor(v, breaks);
    const ring = rings.has(c[0]) ? ` stroke="#a97e14" stroke-width="2"` : "";
    const valText = v === null || v === undefined ? "not reported" : `${fmtShort(ind, v)} (${c[6][indIndex]})`;
    return `<a href="#/country/${c[0]}" class="map-dot"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" fill-opacity="0.92"${ring}><title>${c[1]} — ${ind.name}: ${valText}</title></circle></a>`;
  }).join("");
  const legend = breaks
    ? SCALE.map((s, i) => {
        const lo = i === 0 ? "lowest" : fmtShort(ind, breaks[i - 1]);
        const hi = i === 4 ? "highest" : fmtShort(ind, breaks[i]);
        return `<span><span class="swatch" style="background:${s}"></span>${lo} – ${hi}</span>`;
      }).join("")
    : `<span>Dot size = population. Grey dots = not reported.</span>`;
  return `<svg viewBox="0 0 ${MAP_W} ${MAP_H}" role="img" aria-label="World map of ${ind.name} for 115 countries">
    <rect x="0" y="0" width="${MAP_W}" height="${MAP_H}" fill="#fbf7ec"/>
    ${grat.join("")}${labels}${dots}
  </svg>
  <div class="map-legend">${legend}<span>● Dot size = population · gold ring = top 5 · click a dot to open the country</span></div>`;
}

/** Top N countries for an indicator, best first (or worst first when lower is better). */
export function ranked(countries, indIndex, n, bestFirst) {
  const ind = INDICATORS[indIndex];
  const rows = countries.filter((c) => c[5][indIndex] !== null && c[5][indIndex] !== undefined);
  const dir = (bestFirst && ind.higherBetter === false) || (!bestFirst && ind.higherBetter === true) ? 1 : -1;
  rows.sort((a, b) => dir * (a[5][indIndex] - b[5][indIndex]));
  return rows.slice(0, n || rows.length);
}

/** Rank of one country (1 = best) among reporters of an indicator. */
export function rankOf(countries, code, indIndex) {
  const order = ranked(countries, indIndex, 0, true);
  const i = order.findIndex((c) => c[0] === code);
  return i === -1 ? null : { rank: i + 1, of: order.length };
}
