// StatAtlas chart helpers — plain SVG strings, no library, no network.
import { fmtShort } from "./indicators.js";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Timeline line chart for one series.
 * years: [1960, 1980, 2000, 2024], values: matching numbers (null allowed).
 * Returns an SVG string, 560 x 220 viewBox.
 */
export function lineChart({ title, years, values, format }) {
  const W = 560, H = 220, PL = 58, PR = 14, PT = 14, PB = 28;
  const pts = years.map((y, i) => ({ x: y, v: values[i] })).filter((p) => p.v !== null && p.v !== undefined);
  if (pts.length < 2) {
    return `<p class="muted">Not enough history to draw this chart — only ${pts.length} dated point${pts.length === 1 ? "" : "s"} on record.</p>`;
  }
  const minV = Math.min(...pts.map((p) => p.v));
  const maxV = Math.max(...pts.map((p) => p.v));
  const pad = (maxV - minV) * 0.12 || Math.abs(maxV) * 0.1 || 1;
  const lo = Math.min(0, minV - pad);
  const hi = maxV + pad;
  const x0 = years[0], x1 = years[years.length - 1];
  const px = (y) => PL + ((y - x0) / (x1 - x0)) * (W - PL - PR);
  const py = (v) => PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${px(p.x).toFixed(1)},${py(p.v).toFixed(1)}`).join(" ");
  const area = `${d} L${px(pts[pts.length - 1].x).toFixed(1)},${py(lo).toFixed(1)} L${px(pts[0].x).toFixed(1)},${py(lo).toFixed(1)} Z`;
  const gridVals = [0.25, 0.5, 0.75].map((f) => lo + (hi - lo) * f);
  const grid = gridVals.map((v) => {
    const y = py(v);
    return `<line class="gridline" x1="${PL}" y1="${y.toFixed(1)}" x2="${W - PR}" y2="${y.toFixed(1)}"/><text class="axis-label" x="${PL - 6}" y="${(y + 3.5).toFixed(1)}" text-anchor="end">${esc(format(v))}</text>`;
  }).join("");
  const ticks = years.map((y) => `<text class="axis-label" x="${px(y).toFixed(1)}" y="${H - 8}" text-anchor="middle">${y}</text>`).join("");
  const dots = pts.map((p) => `<circle class="dot-pt" cx="${px(p.x).toFixed(1)}" cy="${py(p.v).toFixed(1)}" r="4"><title>${p.x}: ${esc(format(p.v))}</title></circle>`).join("");
  const last = pts[pts.length - 1];
  const first = pts[0];
  const change = first.v !== 0 ? ((last.v - first.v) / Math.abs(first.v)) * 100 : 0;
  const changeText = `${change >= 0 ? "+" : ""}${change.toFixed(0)}% since ${first.x}`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}: ${esc(format(first.v))} in ${first.x} to ${esc(format(last.v))} in ${last.x}">
    <text class="axis-label" x="${W - PR}" y="${PT - 2}" text-anchor="end" font-weight="bold">${esc(changeText)}</text>
    ${grid}
    <line class="axis" x1="${PL}" y1="${H - PB}" x2="${W - PR}" y2="${H - PB}"/>
    <path class="area-path" d="${area}"/>
    <path class="line-path" d="${d}"/>
    ${dots}${ticks}
  </svg>`;
}

/**
 * One horizontal comparison bar: two values side by side on a shared scale.
 * Returns an SVG string, 560 x 64 viewBox.
 */
export function duelBars({ leftLabel, rightLabel, leftValue, rightValue, format, leftColor, rightColor }) {
  const W = 560, H = 64, PL = 8, PR = 8;
  const max = Math.max(Math.abs(leftValue || 0), Math.abs(rightValue || 0), 1e-9);
  const lw = ((Math.abs(leftValue || 0) / max) * (W - PL - PR)) / 2;
  const rw = ((Math.abs(rightValue || 0) / max) * (W - PL - PR)) / 2;
  const mid = W / 2;
  const leftIsNull = leftValue === null || leftValue === undefined;
  const rightIsNull = rightValue === null || rightValue === undefined;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(leftLabel)} ${esc(format(leftValue))} against ${esc(rightLabel)} ${esc(format(rightValue))}">
    <text class="axis-label" x="${PL}" y="14" font-weight="bold">${esc(leftLabel)}</text>
    <text class="axis-label" x="${W - PR}" y="14" text-anchor="end" font-weight="bold">${esc(rightLabel)}</text>
    <rect class="bar-rect" x="${(mid - lw).toFixed(1)}" y="22" width="${lw.toFixed(1)}" height="16" rx="3" fill="${leftColor || "#0f766e"}"/>
    <rect class="bar-rect alt" x="${mid.toFixed(1)}" y="22" width="${rw.toFixed(1)}" height="16" rx="3" fill="${rightColor || "#b3402a"}"/>
    <text class="axis-label" x="${PL}" y="56" font-weight="bold">${leftIsNull ? "not reported" : esc(format(leftValue))}</text>
    <text class="axis-label" x="${W - PR}" y="56" text-anchor="end" font-weight="bold">${rightIsNull ? "not reported" : esc(format(rightValue))}</text>
  </svg>`;
}

/** A tiny inline bar used inside table cells. pct 0..100, tone teal/vermilion/gold. */
export function miniBar(pct, tone) {
  const p = Math.max(0, Math.min(100, pct || 0));
  return `<span class="bar" aria-hidden="true"><i class="${tone || ""}" style="width:${p.toFixed(0)}%"></i></span>`;
}
