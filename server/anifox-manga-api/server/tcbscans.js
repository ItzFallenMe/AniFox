// Native Node adapter ported from MeManga's TCB Scans scraper.
// Copyright (c) 2026 meellm; see THIRD_PARTY_NOTICES.md.
const cheerio = require("cheerio")
const { getHtml, encodeReference, decodeReference, safeSourceUrl, safeImageUrl, numericChapter } = require("./source-utils")

const BASE_URL = "https://tcbonepiecechapters.com"
const MANGA_PREFIX = "tcb-"
const CHAPTER_PREFIX = "tcb-ch-"

function parseSearch(html, query) {
    const $ = cheerio.load(html)
    const needle = String(query || "").toLowerCase().trim()
    const seen = new Set()
    const mangaList = []

    $("a[href*='/mangas/']").each((_index, element) => {
        const link = $(element)
        const title = link.text().replace(/\s+/g, " ").trim()
        if (!title || !title.toLowerCase().includes(needle)) return
        let url
        try {
            url = safeSourceUrl(link.attr("href"), BASE_URL)
        } catch {
            return
        }
        const path = new URL(url).pathname
        if (!path.startsWith("/mangas/") || seen.has(url)) return
        seen.add(url)
        const image = link.find("img").first()
        mangaList.push({
            id: encodeReference(MANGA_PREFIX, url),
            url,
            source: "tcb",
            title,
            image: safeImageUrl(image.attr("data-src") || image.attr("src"), BASE_URL),
            description: "",
            chapter: null,
        })
    })
    return mangaList.slice(0, 10)
}

function parseChapters(html, mangaUrl) {
    const $ = cheerio.load(html)
    const mangaPath = new URL(mangaUrl).pathname.replace(/\/$/, "")
    const seen = new Set()
    const chapters = []

    $("div.col-span-2 a.block.border, a[href*='/chapters/']").each((_index, element) => {
        const link = $(element)
        let url
        try {
            url = safeSourceUrl(link.attr("href"), BASE_URL)
        } catch {
            return
        }
        const path = new URL(url).pathname
        if (!path.startsWith(`${mangaPath}/`) || !path.includes("/chapters/") || seen.has(url)) return
        const title = link.find("div.text-lg").first().text().replace(/\s+/g, " ").trim()
        const subtitle = link.find("div.text-gray-500").first().text().replace(/\s+/g, " ").trim()
        const number = title.match(/chapter[.\s-]*(\d+(?:\.\d+)?)/i)?.[1] || title.match(/[\d.]+/)?.[0]
        if (!number) return
        seen.add(url)
        chapters.push({
            id: encodeReference(CHAPTER_PREFIX, url),
            path: url,
            name: `Chapter ${number}${subtitle ? ` — ${subtitle}` : ""}`,
            view: "",
            createdAt: "",
        })
    })
    return chapters.sort((a, b) => numericChapter(a.name) - numericChapter(b.name))
}

function parsePages(html) {
    const $ = cheerio.load(html)
    const seen = new Set()
    const images = []
    $("picture img, .chapter-content img").each((_index, element) => {
        const image = $(element)
        const value = image.attr("src") || image.attr("data-src")
        const url = safeImageUrl(value, BASE_URL)
        if (!url || /logo|placeholder|loading\.gif/i.test(url) || seen.has(url)) return
        seen.add(url)
        images.push({ title: `Page ${images.length + 1}`, image: url })
    })
    return images
}

async function search({ query } = {}) {
    const url = new URL("/projects", BASE_URL)
    return { mangaList: parseSearch(await getHtml(url, { referer: `${BASE_URL}/` }), query) }
}

async function details(id) {
    const url = decodeReference(id, MANGA_PREFIX)
    const parsed = new URL(safeSourceUrl(url, BASE_URL))
    if (parsed.hostname !== "tcbonepiecechapters.com" || !parsed.pathname.startsWith("/mangas/")) {
        throw new Error("Invalid TCB Scans manga URL")
    }
    const html = await getHtml(url, { referer: `${BASE_URL}/` })
    const $ = cheerio.load(html)
    const name = $("h1").first().text().replace(/\s+/g, " ").trim() || parsed.pathname.split("/").at(-1).replace(/-/g, " ")
    const imageUrl = safeImageUrl($("meta[property='og:image']").attr("content"), BASE_URL)
    return {
        name,
        source: "tcb",
        sourceUrl: url,
        imageUrl,
        author: "",
        status: "Unknown",
        updated: "",
        view: "",
        description: $("meta[name='description']").attr("content") || "",
        genres: [],
        chapterList: parseChapters(html, url),
    }
}

async function pages(mangaId, chapterId) {
    const mangaUrl = new URL(safeSourceUrl(decodeReference(mangaId, MANGA_PREFIX), BASE_URL))
    if (mangaUrl.hostname !== "tcbonepiecechapters.com" || !mangaUrl.pathname.startsWith("/mangas/")) {
        throw new Error("Invalid TCB Scans manga URL")
    }
    const url = decodeReference(chapterId, CHAPTER_PREFIX)
    const parsed = new URL(safeSourceUrl(url, BASE_URL))
    if (parsed.hostname !== "tcbonepiecechapters.com" || !parsed.pathname.includes("/chapters/")) {
        throw new Error("Invalid TCB Scans chapter URL")
    }
    if (!parsed.pathname.startsWith(`${mangaUrl.pathname.replace(/\/$/, "")}/`)) {
        throw new Error("This chapter does not belong to the selected manga")
    }
    const html = await getHtml(url, { referer: `${BASE_URL}/` })
    return {
        title: "",
        currentChapter: parsed.pathname.split("/").at(-1).replace(/-/g, " "),
        chapterListIds: [],
        source: "tcb",
        images: parsePages(html),
    }
}

module.exports = {
    search,
    details,
    pages,
    _test: { parseSearch, parseChapters, parsePages, MANGA_PREFIX, CHAPTER_PREFIX },
}
