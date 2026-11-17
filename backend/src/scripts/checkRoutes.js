// backend/scripts/checkRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Pre-deploy safety check. Catches the exact crash
//   "Route.get() requires a callback function but got a [object Undefined]"
// BEFORE it reaches Render: for every routes/*.js file it reads each
//   const { a, b } = require("../controllers/X")   (and ../middleware/Y)
// and verifies that X really exports a, b. No database, no env vars, no
// dependencies needed.
//
// Run:   node scripts/checkRoutes.js        (from the backend folder)
//        npm run check:routes
// Exit code 1 = at least one broken import (so it can block a push/deploy).
// ─────────────────────────────────────────────────────────────────────────────
const fs = require("fs");
const path = require("path");

// Works from either location: backend/scripts/ or backend/src/scripts/
const SRC = fs.existsSync(path.join(__dirname, "..", "src", "routes"))
  ? path.join(__dirname, "..", "src")
  : path.join(__dirname, "..");
const ROUTES_DIR = path.join(SRC, "routes");

const read = (p) => fs.readFileSync(p, "utf8");

// Names a module makes available, read from its source text.
function exportedNames(file) {
  const src = read(file);
  const names = new Set();

  // module.exports = { a, b: c, d, ... }
  const m = src.match(/module\.exports\s*=\s*\{([\s\S]*?)\}\s*;?\s*$/m);
  if (m) {
    m[1]
      .split(",")
      .map((s) => s.replace(/\/\/.*$/gm, "").trim())
      .filter(Boolean)
      .forEach((entry) => names.add(entry.split(":")[0].trim()));
  }
  // exports.name = ...   /   module.exports.name = ...
  for (const e of src.matchAll(/(?:module\.)?exports\.(\w+)\s*=/g)) {
    names.add(e[1]);
  }
  return names;
}

function resolveModule(fromFile, rel) {
  const base = path.resolve(path.dirname(fromFile), rel);
  for (const c of [base, base + ".js", path.join(base, "index.js")]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

let problems = 0;
let warnings = 0;
const routeFiles = fs.readdirSync(ROUTES_DIR).filter((f) => f.endsWith(".js"));

for (const rf of routeFiles) {
  const file = path.join(ROUTES_DIR, rf);
  const src = read(file);

  // Code outside the import blocks, with comments removed: this is where a
  // name must be used for an undefined import to actually crash the server.
  const stripComments = (t) =>
    t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  const body = stripComments(src).replace(
    /const\s*\{[^}]*\}\s*=\s*require\([^)]*\)\s*;?/g,
    "",
  );
  const isUsed = (name) => new RegExp(`\\b${name}\\b`).test(body);

  const re =
    /const\s*\{([^}]*)\}\s*=\s*require\(\s*["'](\.\.?\/[^"']+)["']\s*\)/g;
  for (const m of src.matchAll(re)) {
    const wanted = stripComments(m[1])
      .split(",")
      .map((s) => s.trim().split(":")[0].trim())
      .filter(Boolean);
    const target = resolveModule(file, m[2]);

    if (!target) {
      console.error(`✗ routes/${rf}: cannot find module "${m[2]}"`);
      problems++;
      continue;
    }
    const have = exportedNames(target);
    for (const name of wanted) {
      if (have.has(name)) continue;
      const where = `routes/${rf}: "${name}" is imported from ${path.relative(SRC, target)} but not exported there`;
      if (isUsed(name)) {
        console.error(`✗ ${where}  (and it IS used, so the server will crash)`);
        problems++;
      } else {
        console.warn(
          `! ${where}  (unused import, harmless; consider removing it)`,
        );
        warnings++;
      }
    }
  }
}

// ─── Check 2: wrong file pasted into the wrong place ─────────────────────
// Most files start with a comment such as  // backend/src/services/x.js
// If that comment names a DIFFERENT file than the one it sits in, the code
// was almost certainly pasted into the wrong file (this is how
// leaderboardService code ended up inside leaderboardController.js).
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" ? [] : walk(full);
    return e.name.endsWith(".js") ? [full] : [];
  });

for (const file of walk(SRC)) {
  const first = read(file).split(/\r?\n/, 1)[0];
  const m = first.match(/^\/\/\s*((?:backend\/)?src\/[\w./-]+\.js)\s*$/);
  if (!m) continue;
  const claimed = m[1].replace(/^backend\//, "");
  const actual = "src/" + path.relative(SRC, file).split(path.sep).join("/");
  if (claimed !== actual) {
    // A real mix-up only if the file named in the comment actually exists
    // as a different file. A stale comment pointing nowhere is just a warning.
    const claimedExists = fs.existsSync(path.join(SRC, "..", claimed));
    if (claimedExists) {
      console.error(
        `✗ ${actual}: first line says "${claimed}" (a different file). Wrong code pasted into this file?`,
      );
      problems++;
    } else {
      console.warn(
        `! ${actual}: first-line comment names "${claimed}", which does not exist (stale comment).`,
      );
      warnings++;
    }
  }
}

if (problems) {
  console.error(`\n${problems} broken import(s). Fix them before deploying.`);
  process.exit(1);
}
console.log(
  `✓ No crashing imports (${routeFiles.length} route files checked${warnings ? `, ${warnings} harmless warning(s)` : ""}).`,
);
