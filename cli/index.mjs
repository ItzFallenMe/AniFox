#!/usr/bin/env node

const DEFAULT_BASE_URL = "https://anifox.runs-on.dev";
let BASE_URL = (process.env.ANIFOX_API_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
const ESC = "\x1b[";
const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  orange: "\x1b[38;5;208m", red: "\x1b[31m", green: "\x1b[32m",
  cyan: "\x1b[36m", white: "\x1b[97m", gray: "\x1b[90m",
};
const MENU = [
  { label: "Manga catalog", detail: "Browse the latest MangaDex titles", run: () => loadMangaCatalog() },
  { label: "Search manga", detail: "Find a manga by title", run: () => prompt("Search manga", (q) => loadMangaSearch(q)) },
  { label: "Manga sources", detail: "Show available manga sources", run: () => load("manga/sources", {}, "Manga sources", "manga") },
  { label: "Search movies & TV", detail: "Search TMDB metadata", run: () => prompt("Search movies & TV", (q) => load("tmdb/search/multi", { query: q }, "Search results", "tmdb")) },
  { label: "Trending movies & TV", detail: "See what's trending this week", run: () => load("tmdb/trending/all/week", {}, "Trending this week", "tmdb") },
  { label: "Resolve a stream", detail: "Build a provider URL from a media ID", run: () => streamPrompt() },
];
let state = { screen: "home", title: "AniFox", items: [], selected: 0, data: null, context: "", page: 1, busy: false, message: "Ready", input: null, scroll: 0 };
let previousScreen = "home";
let shuttingDown = false;

function paint(code, value) { return process.stdout.isTTY ? code + value + C.reset : String(value); }
function clean(value) { return String(value ?? "").replace(/\x1b\[[0-9;]*m/g, "").replace(/[\r\n\t]+/g, " ").trim(); }
function truncate(value, width) {
  const s = clean(value);
  if (s.length <= width) return s;
  return width > 1 ? s.slice(0, width - 1) + "…" : s.slice(0, width);
}
function titleOf(item) {
  if (typeof item === "string") return item;
  return item?.titleEnglish || item?.titleRomaji || item?.title || item?.name || item?.titleNative || item?.chapter || item?.id || "Untitled";
}
function idOf(item) {
  return item?.id ?? item?.mangaId ?? item?.anilistId ?? item?.tmdbId ?? item?.chapterId ?? "";
}
function findList(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return null;
  for (const key of ["results", "items", "data", "manga", "titles", "chapters", "sources", "links"]) {
    if (Array.isArray(data[key])) return data[key];
  }
  return null;
}
function endpoint(path, params = {}) {
  const url = new URL(`${BASE_URL}/api/${path.replace(/^\/+/, "")}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url;
}
async function api(path, params = {}, redirect = "follow") {
  const response = await fetch(endpoint(path, params), {
    redirect,
    headers: { Accept: "application/json", "User-Agent": "AniFox-TUI/0.2.0" },
    signal: AbortSignal.timeout(20000),
  });
  if (redirect === "manual") return response;
  const body = await response.text();
  let data;
  try { data = body ? JSON.parse(body) : null; }
  catch { throw new Error(`AniFox returned an unexpected response (HTTP ${response.status}).`); }
  if (!response.ok) throw new Error(data?.error || data?.message || `Request failed: HTTP ${response.status}`);
  return data;
}
function dimensions() {
  return { width: Math.max(50, process.stdout.columns || 80), height: Math.max(16, process.stdout.rows || 24) };
}
function write(lines) {
  process.stdout.write(ESC + "H" + ESC + "2J" + lines.join("\n"));
}
function frame() {
  const { width, height } = dimensions();
  const inner = width - 4;
  const line = (s = "") => "  " + truncate(s, inner).padEnd(inner, " ") + "  ";
  const out = [];
  out.push(line(paint(C.orange + C.bold, "  ▄▄▄  AniFox") + paint(C.dim, "  /  terminal media browser")));
  out.push(line(paint(C.gray, "  " + BASE_URL)));
  out.push(line("─".repeat(inner)));
  if (state.screen === "home") {
    out.push(line(paint(C.bold + C.white, "  Welcome to AniFox")));
    out.push(line(paint(C.dim, "  Browse manga, discover movies and TV, resolve stream links.")));
    out.push(line(""));
    MENU.forEach((item, i) => {
      const active = i === state.selected;
      const prefix = active ? paint(C.orange + C.bold, "  ❯ ") : "    ";
      out.push(line(prefix + paint(active ? C.white + C.bold : C.white, item.label)));
      out.push(line("      " + paint(C.dim, item.detail)));
    });
    out.push(line(""));
    out.push(line(paint(C.dim, "  API routes are called on demand. No media is hosted by this client.")));
  } else if (state.screen === "list") {
    out.push(line(paint(C.bold + C.white, "  " + state.title) + paint(C.dim, `   ·   ${state.items.length} items`)));
    out.push(line(paint(C.dim, "  ↑/↓ move   Enter open   / search   n next page   Esc back")));
    out.push(line(""));
    const visible = Math.max(1, height - 12);
    const start = Math.max(0, Math.min(state.selected - Math.floor(visible / 2), state.items.length - visible));
    for (let i = start; i < Math.min(state.items.length, start + visible); i++) {
      const item = state.items[i];
      const active = i === state.selected;
      const prefix = active ? paint(C.orange + C.bold, "  ❯ ") : "    ";
      const meta = [item?.status, item?.year, item?.media_type, item?.type, item?.language].filter(Boolean).join(" · ");
      out.push(line(prefix + paint(active ? C.white + C.bold : C.white, titleOf(item))));
      if (meta) out.push(line("      " + paint(C.dim, meta)));
    }
    if (!state.items.length) out.push(line(paint(C.dim, "  No results returned.")));
  } else if (state.screen === "detail") {
    out.push(line(paint(C.bold + C.white, "  " + state.title)));
    out.push(line(paint(C.dim, "  ↑/↓ scroll   c chapters   s stream (where supported)   Esc back")));
    out.push(line(""));
    const lines = JSON.stringify(state.data, null, 2).split("\n");
    const visible = Math.max(1, height - 11);
    for (const row of lines.slice(state.scroll, state.scroll + visible)) out.push(line(row));
  } else if (state.screen === "input") {
    out.push(line(paint(C.bold + C.white, "  " + state.input.label)));
    out.push(line(""));
    out.push(line("  " + paint(C.orange, "> ") + state.input.value + paint(C.orange, "▌")));
    out.push(line(""));
    out.push(line(paint(C.dim, "  Enter submit   Esc cancel")));
  } else if (state.screen === "loading") {
    out.push(line(paint(C.bold + C.white, "  " + state.title)));
    out.push(line(""));
    out.push(line(paint(C.orange, "  Loading AniFox API…")));
  }
  while (out.length < height - 3) out.push(line(""));
  out.push(line("─".repeat(inner)));
  out.push(line(paint(C.dim, "  ↑/↓ navigate  Enter select  Esc back  q quit") + (state.message ? paint(C.gray, "  ·  " + state.message) : "")));
  write(out.slice(0, height));
}
function redraw() { if (!shuttingDown) frame(); }
function setMessage(message) { state.message = message; }
async function load(path, params, heading, context) {
  state.screen = "loading"; state.title = heading; state.busy = true; redraw();
  try {
    const data = await api(path, params);
    state.data = data; state.items = findList(data) || [];
    state.selected = 0; state.scroll = 0; state.title = heading; state.context = context;
    state.screen = "list";
    setMessage(state.items.length ? `${state.items.length} results` : "Loaded");
  } catch (error) {
    state.screen = "home"; setMessage(error.message);
  } finally { state.busy = false; redraw(); }
}
async function loadMangaCatalog(page = 1) {
  state.page = page;
  await load("manga/catalog", { page, type: "latest" }, `Manga catalog · page ${page}`, "manga");
}
async function loadMangaSearch(query) {
  await load("manga/search", { query, page: 1, source: "all" }, `Manga search · ${query}`, "manga");
}
function prompt(label, submit) {
  previousScreen = state.screen;
  state.screen = "input"; state.input = { label, value: "", submit }; redraw();
}
function streamPrompt() {
  prompt("Stream: enter movie ID, or type tv/anime ID", async (value) => {
    const parts = value.trim().split(/\s+/);
    if (!parts[0]) return;
    if (parts[0] === "movie" && parts[1]) return resolveStream({ type: "movie", tmdbId: parts[1] });
    if (parts[0] === "tv" && parts.length >= 4) return resolveStream({ type: "tv", tmdbId: parts[1], season: parts[2], episode: parts[3] });
    if (parts[0] === "anime" && parts.length >= 3) return resolveStream({ type: "anime", anilistId: parts[1], episode: parts[2] });
    if (/^\d+$/.test(parts[0])) return resolveStream({ type: "movie", tmdbId: parts[0] });
    setMessage("Use: movie ID | tv ID season episode | anime ID episode"); redraw();
  });
}
async function resolveStream(params) {
  state.screen = "loading"; state.title = "Resolving stream"; redraw();
  try {
    const response = await api("stream", { ...params, source: "vidly" }, "manual");
    if (response.status < 300 || response.status >= 400) {
      const body = await response.text(); let message = body;
      try { message = JSON.parse(body).error || body; } catch {}
      throw new Error(message || `Stream resolution failed (HTTP ${response.status})`);
    }
    state.data = { requested: params, providerUrl: response.headers.get("location"), note: "The provider serves the playback page. AniFox does not proxy media." };
    state.title = "Stream resolved"; state.screen = "detail"; state.scroll = 0; setMessage("Provider URL ready");
  } catch (error) { state.screen = "home"; setMessage(error.message); }
  redraw();
}
async function openSelected() {
  const item = state.items[state.selected];
  if (!item) return;
  const id = idOf(item);
  if (state.context === "manga" && id) {
    state.screen = "loading"; state.title = "Loading manga details"; redraw();
    try {
      const data = await api(`manga/title/${encodeURIComponent(id)}`);
      state.data = data; state.title = titleOf(item); state.screen = "detail"; state.scroll = 0; setMessage("Manga details loaded");
    } catch (error) { state.screen = "list"; setMessage(error.message); }
    redraw(); return;
  }
  state.data = item; state.title = titleOf(item); state.screen = "detail"; state.scroll = 0; redraw();
}
async function openChapters() {
  const d = state.data;
  const id = d?.id ?? d?.mangaId ?? d?.data?.id;
  if (!id) { setMessage("No manga ID found in this detail response."); redraw(); return; }
  prompt("Enter chapter ID", async (chapterId) => {
    if (!chapterId.trim()) return;
    await load(`manga/chapter/${encodeURIComponent(id)}/${encodeURIComponent(chapterId.trim())}`, {}, "Manga chapter pages", "chapter");
  });
}
async function streamCurrent() {
  const item = state.data || {};
  const type = item.media_type || item.type;
  const tmdbId = item.tmdbId || item.tmdb_id || (type === "movie" || type === "tv" ? item.id : null);
  const anilistId = item.anilistId || item.anilist_id;
  if (tmdbId && type === "movie") return resolveStream({ type: "movie", tmdbId });
  if (tmdbId && type === "tv") return prompt("TV episode · enter season episode", async (v) => {
    const [season, episode] = v.trim().split(/\s+/);
    if (season && episode) await resolveStream({ type: "tv", tmdbId, season, episode });
  });
  if (anilistId) return prompt("Anime episode number", async (episode) => {
    if (/^\d+$/.test(episode.trim())) await resolveStream({ type: "anime", anilistId, episode: episode.trim() });
  });
  setMessage("No supported TMDB/AniList ID found on this item."); redraw();
}
function back() {
  if (state.screen === "input") { state.screen = previousScreen; state.input = null; }
  else if (state.screen === "detail") { state.screen = "list"; }
  else if (state.screen === "list" || state.screen === "loading") { state.screen = "home"; }
  else if (state.screen === "home") return;
  redraw();
}
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  process.stdin.pause();
  process.stdout.write(ESC + "?25h" + ESC + "?1049l");
  process.exit(0);
}
function handleKey(key) {
  if (key === "\u0003" || key === "q" && state.screen === "home") return shutdown();
  if (state.screen === "input") {
    if (key === "\u001b" || key === "\u0003") { state.screen = previousScreen; state.input = null; redraw(); return; }
    if (key === "\r" || key === "\n") {
      const { submit, value } = state.input;
      state.input = null; state.screen = previousScreen; redraw();
      Promise.resolve(submit(value)).catch((e) => { setMessage(e.message); redraw(); });
      return;
    }
    if (key === "\u007f" || key === "\b") state.input.value = state.input.value.slice(0, -1);
    else if (key.length === 1 && key >= " ") state.input.value += key;
    redraw(); return;
  }
  if (key === "\u001b" || key === "\u001b\u001b") return back();
  if (key === "\u001b[A" || key === "k") {
    if (state.screen === "detail") state.scroll = Math.max(0, state.scroll - 1);
    else state.selected = Math.max(0, state.selected - 1);
  } else if (key === "\u001b[B" || key === "j") {
    if (state.screen === "detail") state.scroll += 1;
    else if (state.screen === "home") state.selected = (state.selected + 1) % MENU.length;
    else state.selected = Math.min(state.items.length - 1, state.selected + 1);
  } else if (key === "\r" || key === "\n") {
    if (state.screen === "home") MENU[state.selected]?.run();
    else if (state.screen === "list") openSelected();
  } else if (key === "/" && state.screen === "list") {
    previousScreen = "list";
    if (state.context === "manga") prompt("Search manga", loadMangaSearch);
    else prompt("Search movies & TV", (q) => load("tmdb/search/multi", { query: q }, `Search · ${q}`, "tmdb"));
  } else if (key === "n" && state.screen === "list" && state.context === "manga") loadMangaCatalog(state.page + 1);
  else if (key === "p" && state.screen === "list" && state.context === "manga") loadMangaCatalog(Math.max(1, state.page - 1));
  else if (key === "c" && state.screen === "detail") openChapters();
  else if (key === "s" && (state.screen === "detail" || state.screen === "list")) {
    if (state.screen === "list") state.data = state.items[state.selected];
    streamCurrent();
  } else if (key === "q") return shutdown();
  redraw();
}
function start() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.log("AniFox TUI needs an interactive terminal. Run: node cli/index.mjs");
    process.exitCode = 1; return;
  }
  process.stdout.write(ESC + "?1049h" + ESC + "?25l");
  process.stdin.setRawMode(true); process.stdin.resume(); process.stdin.setEncoding("utf8");
  process.stdin.on("data", handleKey);
  process.stdout.on("resize", redraw);
  redraw();
}
start();
