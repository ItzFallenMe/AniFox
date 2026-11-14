#!/usr/bin/env node

const DEFAULT_BASE_URL = "https://anifox.runs-on.dev";
let BASE_URL = (process.env.ANIFOX_API_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const ORANGE = "\x1b[38;5;208m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";

function color(code, value) {
  return process.stdout.isTTY ? `${code}${value}${RESET}` : String(value);
}

function usage() {
  console.log(`
${color(BOLD, "AniFox CLI")} — browse AniFox from your terminal

Usage:
  anifox manga sources
  anifox manga catalog [--page 1] [--type latest] [--state ongoing]
  anifox manga search <query> [--page 1]
  anifox manga title <id>
  anifox manga chapter <manga-id> <chapter-id>
  anifox tmdb search <query> [--page 1]
  anifox tmdb trending [--type all|movie|tv] [--window day|week]
  anifox stream movie <tmdb-id>
  anifox stream tv <tmdb-id> <season> <episode>
  anifox stream anime <anilist-id> <episode>
  anifox --help

Options:
  --base-url <url>  Override the API origin
  --json            Print raw JSON
  --page <number>   Page number
  --type <value>    Catalog/trending type
  --state <value>   Manga state filter
  --category <value> Manga category filter
  --window <value>  Trending time window

Environment:
  ANIFOX_API_URL    API origin (default: https://anifox.runs-on.dev)

The base URL is the website origin. AniFox API paths are appended as /api/...
`);
}

function parseArgs(args) {
  const positional = [];
  const options = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (key === "json") options.json = true;
      else if (args[i + 1] && !args[i + 1].startsWith("--")) options[key] = args[++i];
      else options[key] = true;
    } else positional.push(arg);
  }
  return { positional, options };
}

function endpoint(path, params = {}) {
  const url = new URL(`${BASE_URL}/api/${path.replace(/^\/+/, "")}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url;
}

async function request(path, params = {}) {
  const url = endpoint(path, params);
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "AniFox-CLI/0.1.0" },
    signal: AbortSignal.timeout(20000),
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; }
  catch { throw new Error(`AniFox returned non-JSON data (HTTP ${response.status}).`); }
  if (!response.ok) throw new Error(data?.error || data?.message || `Request failed: HTTP ${response.status}`);
  return data;
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  for (const key of ["results", "items", "data", "manga", "titles", "chapters", "sources", "links"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return null;
}

function first(item, keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "—";
}

function printList(data, jsonMode) {
  if (jsonMode) return printJson(data);
  const items = unwrapList(data);
  if (!items) return printJson(data);
  if (!items.length) return console.log(color(DIM, "No results."));
  items.forEach((item, index) => {
    const title = first(item, ["title", "name", "titleEnglish", "titleRomaji", "titleNative"]);
    const id = first(item, ["id", "mangaId", "chapterId", "anilistId"]);
    const meta = [item.status, item.year, item.rating, item.language].filter(Boolean).join(" · ");
    console.log(`${color(ORANGE, String(index + 1).padStart(2, "0"))} ${color(BOLD, title)}  ${color(DIM, `#${id}`)}`);
    if (meta) console.log(`   ${color(DIM, meta)}`);
    const description = item.description || item.synopsis;
    if (description) console.log(`   ${String(description).replace(/\s+/g, " ").slice(0, 180)}`);
  });
  console.log(color(DIM, `\n${items.length} result(s)`));
}

async function run(argv) {
  const { positional, options } = parseArgs(argv);
  if (options["base-url"]) {
    try {
      const parsed = new URL(options["base-url"]);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      BASE_URL = parsed.origin.replace(/\/+$/, "");
    } catch {
      throw new Error("--base-url must be a valid HTTP(S) origin.");
    }
  }
  if (!positional.length || positional[0] === "help" || options.help) return usage();

  const [group, action, ...rest] = positional;
  const jsonMode = Boolean(options.json);

  if (group === "manga") {
    if (action === "sources") return printList(await request("manga/sources"), jsonMode);
    if (action === "catalog") {
      const data = await request("manga/catalog", {
        page: options.page || 1,
        type: options.type || "latest",
        state: options.state,
        category: options.category,
      });
      return printList(data, jsonMode);
    }
    if (action === "search") {
      const query = rest.join(" ").trim();
      if (!query) throw new Error("Usage: anifox manga search <query>");
      return printList(await request("manga/search", { query, page: options.page || 1, source: "all" }), jsonMode);
    }
    if (action === "title" && rest[0]) return printJsonOrList(await request(`manga/title/${encodeURIComponent(rest[0])}`), jsonMode);
    if (action === "chapter" && rest[0] && rest[1]) {
      return printJsonOrList(await request(`manga/chapter/${encodeURIComponent(rest[0])}/${encodeURIComponent(rest[1])}`), jsonMode);
    }
    throw new Error("Unknown manga command. Run: anifox --help");
  }

  if (group === "tmdb") {
    if (action === "search") {
      const query = rest.join(" ").trim();
      if (!query) throw new Error("Usage: anifox tmdb search <query>");
      return printList(await request("tmdb/search/multi", { query, page: options.page || 1 }), jsonMode);
    }
    if (action === "trending") {
      const type = options.type || "all";
      const window = options.window || "week";
      if (!["all", "movie", "tv"].includes(type) || !["day", "week"].includes(window)) {
        throw new Error("Trending type must be all|movie|tv and window must be day|week.");
      }
      return printList(await request(`tmdb/trending/${type}/${window}`), jsonMode);
    }
    throw new Error("Unknown TMDB command. Run: anifox --help");
  }

  if (group === "stream") {
    let params = {};
    if (action === "movie" && rest[0]) params = { type: "movie", tmdbId: rest[0], source: "vidly" };
    else if (action === "tv" && rest.length >= 3) params = { type: "tv", tmdbId: rest[0], season: rest[1], episode: rest[2], source: "vidly" };
    else if (action === "anime" && rest.length >= 2) params = { type: "anime", anilistId: rest[0], episode: rest[1], source: "vidly" };
    else throw new Error("Usage: anifox stream movie <tmdb-id> | tv <tmdb-id> <season> <episode> | anime <anilist-id> <episode>");

    const url = endpoint("stream", params);
    const response = await fetch(url, { redirect: "manual", headers: { "User-Agent": "AniFox-CLI/0.1.0" } });
    if (response.status < 300 || response.status >= 400) {
      const body = await response.text();
      let message = body;
      try { message = JSON.parse(body).error || body; } catch {}
      throw new Error(message || `Stream request failed: HTTP ${response.status}`);
    }
    const target = response.headers.get("location");
    if (!target) throw new Error("AniFox did not return a stream destination.");
    console.log(`${color(GREEN, "Stream URL:")} ${target}`);
    return;
  }

  usage();
}

function printJsonOrList(data, jsonMode) {
  if (jsonMode) return printJson(data);
  printJson(data);
}

run(process.argv.slice(2)).catch((error) => {
  console.error(color(RED, `Error: ${error.message}`));
  process.exitCode = 1;
});
