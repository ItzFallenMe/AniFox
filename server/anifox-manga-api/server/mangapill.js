const cheerio = require("cheerio")

const BASE_URL = "https://mangapill.com"
const ID_PREFIX = "mangapill-"
const USER_AGENT = "AniFox/1.0 (+https://github.com/ItzFallenMe/AniFox)"
const REQUEST_TIMEOUT_MS = 15_000
const MAX_HTML_BYTES = 5 * 1024 * 1024

async function request(url) {
    const response = await fetch(url, {
        headers: {
            Accept: "text/html,application/xhtml+xml",
            "User-Agent": USER_AGENT,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
        throw new Error(`MangaPill responded with ${response.status}`)
    }

    const contentLength = Number(response.headers.get("content-length"))
    if (Number.isFinite(contentLength) && contentLength > MAX_HTML_BYTES) {
        throw new Error("MangaPill returned an oversized page")
    }
    const html = await response.text()
    if (Buffer.byteLength(html) > MAX_HTML_BYTES) {
        throw new Error("MangaPill returned an oversized page")
    }
    return html
}

function pathFromHref(href, prefix) {
    const url = new URL(href, BASE_URL)
    if (url.origin !== BASE_URL || !url.pathname.startsWith(prefix)) {
        return null
    }
    return url.pathname
}

function idFromPath(path) {
    return `${ID_PREFIX}${Buffer.from(path).toString("base64url")}`
}

function pathFromId(id, prefix) {
    if (typeof id !== "string" || !id.startsWith(ID_PREFIX)) {
        throw new Error("Invalid MangaPill id")
    }

    let path
    try {
        path = Buffer.from(id.slice(ID_PREFIX.length), "base64url").toString()
    } catch {
        throw new Error("Invalid MangaPill id")
    }

    if (!path.startsWith(prefix) || path.includes("..") || path.includes("\\")) {
        throw new Error("Invalid MangaPill id")
    }
    return path
}

function absoluteImageUrl(value) {
    if (!value) return null
    try {
        const url = new URL(value, BASE_URL)
        if (url.protocol === "http:" && isImageHostAllowed(url.hostname)) {
            url.protocol = "https:"
        }
        if (url.protocol !== "https:") return null
        return url.href
    } catch {
        return null
    }
}

function isImageHostAllowed(hostname) {
    const configured = (process.env.MANGAPILL_IMAGE_HOSTS || "")
        .split(",")
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean)
    const allowed = ["mangapill.com", ...configured]
    const normalized = String(hostname || "").toLowerCase()
    return allowed.some((domain) => normalized === domain || normalized.endsWith(`.${domain}`))
}

function clientImageUrl(value) {
    const url = absoluteImageUrl(value)
    if (!url) return null

    const hostname = new URL(url).hostname.toLowerCase()
    if (isImageHostAllowed(hostname)) {
        return `/api/image?url=${encodeURIComponent(url)}`
    }
    return url
}

function textOf(node) {
    return node.text().replace(/\s+/g, " ").trim()
}

function titleFromSlug(path) {
    const slug = path.split("/").filter(Boolean).at(-1) || "Untitled manga"
    let decoded = slug
    try {
        decoded = decodeURIComponent(slug)
    } catch {
        // Keep a readable title even when a provider emits a malformed escape.
    }
    return decoded
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function parseSearch(html) {
    const $ = cheerio.load(html)
    const seen = new Set()
    const mangaList = []

    $("a[href^='/manga/']").each((_index, element) => {
        const link = $(element)
        const path = pathFromHref(link.attr("href"), "/manga/")
        if (!path || seen.has(path)) return
        seen.add(path)

        const image = link.find("img").first()
        const title = textOf(link) || image.attr("alt")?.trim() || image.attr("title")?.trim() || titleFromSlug(path)
        if (title.length < 2) return

        mangaList.push({
            id: idFromPath(path),
            url: new URL(path, BASE_URL).href,
            source: "mangapill",
            title,
            image: clientImageUrl(image.attr("data-src") || image.attr("src")),
            description: "",
            chapter: null,
        })
    })

    return mangaList.slice(0, 24)
}

function chapterNumber(value) {
    const match = String(value || "").match(/chapter[\s_-]*(\d+(?:\.\d+)?)/i)
    if (match) return match[1]
    const urlMatch = String(value || "").match(/chapter[-_](\d+(?:\.\d+)?)/i)
    return urlMatch?.[1] || ""
}

function parseChapters(html) {
    const $ = cheerio.load(html)
    const seen = new Set()
    const chapterList = []

    $("a[href*='/chapters/']").each((_index, element) => {
        const link = $(element)
        const path = pathFromHref(link.attr("href"), "/chapters/")
        if (!path || seen.has(path)) return
        seen.add(path)

        const name = textOf(link) || "Chapter"
        const number = chapterNumber(`${name} ${path}`)
        chapterList.push({
            id: idFromPath(path),
            path,
            name: number ? `Chapter ${number}${name !== `Chapter ${number}` ? ` · ${name}` : ""}` : name,
            number: number ? Number(number) : null,
            view: "",
            createdAt: "",
        })
    })

    return chapterList.sort((a, b) => {
        if (a.number === null) return b.number === null ? a.name.localeCompare(b.name) : 1
        if (b.number === null) return -1
        return a.number - b.number
    }).map(({ number: _number, ...chapter }) => chapter)
}

function parseDetails(html, mangaPath) {
    const $ = cheerio.load(html)
    const title = textOf($("h1").first()) ||
        $("meta[property='og:title']").attr("content")?.trim() ||
        titleFromSlug(mangaPath)
    const cover = $("meta[property='og:image']").attr("content") ||
        $("img").filter((_index, element) => {
            const image = $(element)
            return Boolean(image.attr("data-src") || image.attr("src"))
        }).first().attr("data-src") || $("img").first().attr("src")
    const description = $("meta[name='description']").attr("content") ||
        textOf($(".description, [itemprop='description']").first())
    const genres = $("a[href*='/genre/']").map((_index, element) => textOf($(element))).get()

    return {
        imageUrl: clientImageUrl(cover),
        name: title,
        author: "",
        status: "Unknown",
        updated: "",
        view: "",
        description,
        genres: [...new Set(genres)].filter(Boolean),
        source: "mangapill",
        sourceUrl: new URL(mangaPath, BASE_URL).href,
        chapterList: parseChapters(html),
    }
}

function parsePages(html, chapterPath) {
    const $ = cheerio.load(html)
    const title = textOf($("h1").first()) || textOf($("title").first())
    const images = []

    $("img.js-page").each((_index, element) => {
        const image = $(element)
        const url = absoluteImageUrl(image.attr("data-src") || image.attr("src"))
        if (!url || /loading\.gif(?:$|\?)/i.test(url)) return
        const hostname = new URL(url).hostname.toLowerCase()
        const imageUrl = isImageHostAllowed(hostname)
            ? `/api/image?url=${encodeURIComponent(url)}`
            : url
        images.push({ title: new URL(url).pathname.split("/").at(-1) || "", image: imageUrl })
    })

    return {
        title: "",
        currentChapter: title || chapterPath.split("/").filter(Boolean).at(-1) || "Chapter",
        chapterListIds: [],
        source: "mangapill",
        images,
    }
}

async function search({ query }) {
    const url = new URL("/search", BASE_URL)
    url.searchParams.set("q", query)
    return {
        mangaList: parseSearch(await request(url)),
    }
}

async function details(mangaId) {
    const path = pathFromId(mangaId, "/manga/")
    const html = await request(new URL(path, BASE_URL))
    return parseDetails(html, path)
}

async function pages(chapterId) {
    const path = pathFromId(chapterId, "/chapters/")
    const html = await request(new URL(path, BASE_URL))
    return parsePages(html, path)
}

module.exports = {
    search,
    details,
    pages,
    isImageHostAllowed,
    _test: { idFromPath, pathFromId, parseSearch, parseChapters, parseDetails, parsePages, clientImageUrl },
}
