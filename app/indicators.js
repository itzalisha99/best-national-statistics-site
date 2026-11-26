// StatAtlas indicator catalogue. Column numbers match data.js rows:
// values[i] is the latest value, years[i] its year. Every figure comes
// from the World Bank's World Development Indicators (WDI).
export const INDICATORS = [
  { key: "pop", name: "Population", short: "Population", unit: "people", code: "SP.POP.TOTL",
    group: "People", higherBetter: null, decimals: 0, big: true,
    blurb: "Everyone counted in the country, mid-year estimate." },
  { key: "gdp", name: "GDP", short: "GDP", unit: "US$", code: "NY.GDP.MKTP.CD",
    group: "Economy", higherBetter: null, decimals: 0, big: true,
    blurb: "The value of everything produced in a year, in current US dollars." },
  { key: "gdppc", name: "GDP per capita", short: "GDP per person", unit: "US$", code: "NY.GDP.PCAP.CD",
    group: "Economy", higherBetter: true, decimals: 0, big: true,
    blurb: "GDP divided by population — the average output per person." },
  { key: "life", name: "Life expectancy at birth", short: "Life expectancy", unit: "years", code: "SP.DYN.LE00.IN",
    group: "People", higherBetter: true, decimals: 1,
    blurb: "How long a newborn can expect to live if today's death rates stay the same." },
  { key: "fert", name: "Fertility rate", short: "Fertility", unit: "children per woman", code: "SP.DYN.TFRT.IN",
    group: "People", higherBetter: null, decimals: 2,
    blurb: "Children a woman would have over her life at today's birth rates." },
  { key: "urban", name: "Urban population", short: "Urban", unit: "% of population", code: "SP.URB.TOTL.IN.ZS",
    group: "People", higherBetter: null, decimals: 1,
    blurb: "Share of people living in towns and cities." },
  { key: "unemp", name: "Unemployment", short: "Unemployment", unit: "% of labour force", code: "SL.UEM.TOTL.ZS",
    group: "Economy", higherBetter: false, decimals: 1,
    blurb: "Share of the labour force without work but available and looking for it (ILO model)." },
  { key: "infl", name: "Inflation", short: "Inflation", unit: "% per year", code: "FP.CPI.TOTL.ZG",
    group: "Economy", higherBetter: false, decimals: 1,
    blurb: "How fast consumer prices rose over the year." },
  { key: "u5mort", name: "Under-5 mortality", short: "Child mortality", unit: "deaths per 1,000 births", code: "SH.DYN.MORT",
    group: "Health", higherBetter: false, decimals: 1,
    blurb: "Children who die before their fifth birthday, per 1,000 live births." },
  { key: "internet", name: "Internet users", short: "Internet users", unit: "% of population", code: "IT.NET.USER.ZS",
    group: "Society", higherBetter: true, decimals: 1,
    blurb: "Share of people who used the internet in the last three months." },
  { key: "forest", name: "Forest area", short: "Forest", unit: "% of land", code: "AG.LND.FRST.ZS",
    group: "Environment", higherBetter: null, decimals: 1,
    blurb: "Share of the land covered by forest." },
  { key: "pop65", name: "Population aged 65+", short: "Aged 65+", unit: "% of population", code: "SP.POP.65UP.TO.ZS",
    group: "People", higherBetter: null, decimals: 1,
    blurb: "Share of people aged 65 and older — how old a country is." },
  { key: "exports", name: "Exports of goods and services", short: "Exports", unit: "% of GDP", code: "NE.EXP.GNFS.ZS",
    group: "Economy", higherBetter: null, decimals: 1,
    blurb: "What a country sells abroad, as a share of its whole economy." },
  { key: "literacy", name: "Adult literacy rate", short: "Literacy", unit: "% of adults", code: "SE.ADT.LITR.ZS",
    group: "Society", higherBetter: true, decimals: 1,
    blurb: "Adults aged 15+ who can read and write a short, simple statement." },
  { key: "health", name: "Health spending", short: "Health spending", unit: "% of GDP", code: "SH.XPD.CHEX.GD.ZS",
    group: "Health", higherBetter: null, decimals: 1,
    blurb: "Current health spending by government, households and others." },
  { key: "popgrowth", name: "Population growth", short: "Population growth", unit: "% per year", code: "SP.POP.GROW",
    group: "People", higherBetter: null, decimals: 1, signed: true,
    blurb: "How fast the population is growing — or shrinking, when negative." },
  { key: "gnippp", name: "GNI per capita, PPP", short: "Income (PPP)", unit: "international $", code: "NY.GNP.PCAP.PP.CD",
    group: "Economy", higherBetter: true, decimals: 0, big: true,
    blurb: "Income per person adjusted for what money actually buys (purchasing power)." },
  { key: "enrol", name: "Primary school enrolment", short: "Primary enrolment", unit: "% of children", code: "SE.PRM.ENRR",
    group: "Society", higherBetter: true, decimals: 1,
    blurb: "Children of primary-school age who are enrolled in school." },
];

export const IND_BY_KEY = Object.fromEntries(INDICATORS.map((d) => [d.key, d]));

/** Format a raw value for display. big=true uses compact billions/millions. */
export function fmtValue(ind, value) {
  if (value === null || value === undefined) return "—";
  if (ind.big) return fmtBig(value, ind.unit === "US$" || ind.unit === "international $" ? "$" : "");
  const n = Number(value);
  if (ind.decimals === 0) return Math.round(n).toLocaleString("en-US");
  return n.toLocaleString("en-US", { minimumFractionDigits: ind.decimals, maximumFractionDigits: ind.decimals });
}

export function fmtBig(value, prefix) {
  const abs = Math.abs(value);
  const p = prefix || "";
  if (abs >= 1e12) return p + (value / 1e12).toFixed(2) + " trillion";
  if (abs >= 1e9) return p + (value / 1e9).toFixed(2) + " billion";
  if (abs >= 1e6) return p + (value / 1e6).toFixed(1) + " million";
  if (abs >= 1e3) return p + Math.round(value).toLocaleString("en-US");
  return p + String(Math.round(value));
}

/** Short compact form for tables, e.g. 1.45B, $86,170, 84.0. */
export function fmtShort(ind, value) {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (ind.key === "pop") {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    return Math.round(n).toLocaleString("en-US");
  }
  if (ind.key === "gdp") {
    if (n >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
    return "$" + (n / 1e9).toFixed(1) + "B";
  }
  if (ind.key === "gdppc" || ind.key === "gnippp") return "$" + Math.round(n).toLocaleString("en-US");
  if (ind.decimals === 0) return Math.round(n).toLocaleString("en-US");
  return n.toLocaleString("en-US", { minimumFractionDigits: ind.decimals, maximumFractionDigits: ind.decimals });
}
