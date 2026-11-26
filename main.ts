// StatAtlas hand-in program (Node 22, standard library only).
//
// The entry is the static site in app/ plus the screenshots/ renders of
// it. This program copies both into the output directory and writes
// dossier.json there, using the kit's vendored library so the scorer can
// rebuild the same dossier byte for byte. vendor/makefun-frontend.ts is
// the kit's copy, unchanged.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for
// /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Fail fast with a plain message when the entry is incomplete, instead of
// letting a copy or the dossier builder fail halfway through.
function fail(message) {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

const appDir = join(repoRoot, "app");
const shotsDir = join(repoRoot, "screenshots");
if (!existsSync(join(appDir, "index.html"))) fail("app/index.html is missing — nothing to hand in.");
if (!existsSync(shotsDir)) fail("screenshots/ is missing — take the site's screenshots first.");
const shotFiles = readdirSync(shotsDir).filter((f) => !f.startsWith(".") && statSync(join(shotsDir, f)).isFile());
if (shotFiles.length === 0) fail("screenshots/ holds no image — the first is the cover.");

mkdirSync(outDir, { recursive: true });
cpSync(appDir, join(outDir, "app"), { recursive: true });
mkdirSync(join(outDir, "screenshots"), { recursive: true });
cpSync(shotsDir, join(outDir, "screenshots"), { recursive: true });

const dossierPath = join(outDir, "dossier.json");
writeFileSync(
  dossierPath,
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);

// Read the dossier back: a hand-in that cannot be parsed is no hand-in.
let dossier;
try {
  dossier = JSON.parse(readFileSync(dossierPath, "utf8"));
} catch {
  fail("dossier.json was written but does not parse.");
}
const appFiles = readdirSync(join(outDir, "app")).length;
console.log(
  `StatAtlas handed in: ${outDir} — ${appFiles} files in app/, ${shotFiles.length} screenshots, ` +
  `dossier ${statSync(dossierPath).size} bytes, ${Object.keys(dossier).length} top-level keys.`,
);
