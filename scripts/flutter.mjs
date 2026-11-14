import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const flutterDefines = new Set([
  "RELEASE_REPO",
  "ANILIST_CLIENT_ID",
  "ANILIST_CLIENT_SECRET",
  "MAL_CLIENT_ID",
  "MAL_CLIENT_SECRET",
  "SIMKL_CLIENT_ID",
  "SIMKL_CLIENT_SECRET",
  "TMDB_API_KEY",
  "ANIFOX_API_URL",
  "DISCORD_APPLICATION_ID",
]);

function readDotEnv(text) {
  const values = new Map();
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    let value = (match[2] ?? "").trim();
    const quote = value[0];
    if (quote === "'" || quote === '"' || quote === "`") {
      const end = value.lastIndexOf(quote);
      value = end > 0 ? value.slice(1, end) : value.slice(1);
      if (quote === '"') value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }
    values.set(match[1], value);
  }
  return values;
}

let localValues = new Map();
try {
  localValues = readDotEnv(await readFile(resolve(root, ".env"), "utf8"));
} catch {
  console.warn("No root .env found; Flutter will use only the environment and command-line values.");
}

const flutterArgs = process.argv.slice(2);
if (!flutterArgs.length) {
  console.error("Usage: npm run flutter -- <flutter command and arguments>");
  process.exit(2);
}

// Flutter only accepts Dart defines on commands that compile or execute Dart
// code. Passing them to `pub get`, `analyze`, and similar commands makes CI
// fail with an unknown-option error.
const commandsWithDartDefines = new Set(["build", "run", "test"]);
const defines = [];
if (commandsWithDartDefines.has(flutterArgs[0])) {
  for (const key of flutterDefines) {
    const value = process.env[key] ?? localValues.get(key);
    if (value !== undefined && value !== "") {
      defines.push(`--dart-define=${key}=${value}`);
    }
  }
}

const executable = process.env.FLUTTER_BIN || (process.platform === "win32" ? "flutter.bat" : "flutter");
const child = spawn(executable, [...flutterArgs, ...defines], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("error", (error) => {
  console.error(`Could not start Flutter: ${error.message}`);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
