// Native Node adapter ported from MeManga's AsuraScans scraper.
// Copyright (c) 2026 meellm; see THIRD_PARTY_NOTICES.md.
const { getJson, encodeReference, decodeReference, safeImageUrl, numericChapter } = require("./source-utils")

const BASE_URL = "https://asurascans.com"
const API_URL = "https://api.asurascans.com/api"
const MANGA_PREFIX = "asura-"
const CHAPTER_PREFIX = "asura-ch-"

function seriesSlug(value) {
    let url
    try {
        url = new URL(value)
    } catch {
        throw new Error("Invalid Asura Scans URL")
    }
    if (!new Set(["asurascans.com", "www.asurascans.com"]).has(url.hostname)) {
        throw new Error("This is not an Asura Scans URL")
    }
    const match = url.pathname.match(/^\/(?:comics|series|manga)\/([^/]+)/)
    if (!match) throw new Error("Invalid Asura Scans series URL")
    return match[1]
}

function chapterNumber(raw) {
    if (raw === null || raw === undefined || String(raw).trim() === "") return null
    const value = Number(raw)
    if (!Number.isFinite(value)) return null
    return String(value)
}

function isEarlyAccess(row) {
    if (!row?.is_premium) return false
    for (const key of ["early_access_until", "unlock_time", "available_at"]) {
        const timestamp = Date.parse(row[key] || "")
        if (Number.isFinite(timestamp)) return timestamp > Date.now()
    }
    return true
}

function chapterUrl(slug, number) {
    return `${BASE_URL}/comics/${encodeURIComponent(slug)}/chapter/${encodeURIComponent(number)}`
}

function parseSearch(payload, query) {
    const rows = Array.isArray(payload?.data) ? payload.data : []
    const needle = String(query || "").toLowerCase().trim()
    return rows
        .filter((row) => row && typeof row === "object" && (row.public_url || row.slug) && row.title)
        .sort((a, b) => Number(!String(a.title).toLowerCase().includes(needle)) - Number(!String(b.title).toLowerCase().includes(needle)))
        .slice(0, 10)
        .map((row) => {
            const url = row.public_url?.startsWith("/")
                ? new URL(row.public_url, BASE_URL).href
                : `${BASE_URL}/comics/${encodeURIComponent(row.slug)}`
            return {
                id: encodeReference(MANGA_PREFIX, url),
                url,
                source: "asura",
                title: String(row.title).trim(),
                image: safeImageUrl(row.cover, BASE_URL),
                description: "",
                chapter: null,
            }
        })
}

function parseChapters(payload, slug) {
    const rows = Array.isArray(payload?.data) ? payload.data : []
    const seen = new Set()
    return rows.flatMap((row) => {
        const number = chapterNumber(row?.number)
        if (!row || number === null || seen.has(number) || isEarlyAccess(row)) return []
        seen.add(number)
        const url = chapterUrl(slug, number)
        return [{
            id: encodeReference(CHAPTER_PREFIX, url),
            path: url,
            name: row.title ? `Chapter ${number} — ${String(row.title).trim()}` : `Chapter ${number}`,
            view: "",
            createdAt: String(row.published_at || "").slice(0, 10),
        }]
    }).sort((a, b) => numericChapter(a.name) - numericChapter(b.name))
}

function parsePages(payload) {
    if (payload?.data?.is_locked) return []
    const rows = payload?.data?.chapter?.pages
    if (!Array.isArray(rows)) return []
    return rows.flatMap((row) => {
        const value = typeof row === "string" ? row : row?.url
        const url = safeImageUrl(value, BASE_URL)
        return url ? [url] : []
    })
}

async function search({ query } = {}) {
    const url = new URL(`${API_URL}/series`)
    url.searchParams.set("search", query)
    const payload = await getJson(url, { referer: `${BASE_URL}/` })
    return { mangaList: parseSearch(payload, query) }
}

async function details(id) {
    const url = decodeReference(id, MANGA_PREFIX)
    const slug = seriesSlug(url)
    const [detailPayload, chapterPayload] = await Promise.all([
        getJson(`${API_URL}/series/${encodeURIComponent(slug)}`, { referer: `${BASE_URL}/` }),
        getJson(`${API_URL}/series/${encodeURIComponent(slug)}/chapters`, { referer: `${BASE_URL}/` }),
    ])
    const series = detailPayload?.series || {}
    return {
        name: series.title || slug.replace(/-/g, " "),
        source: "asura",
        sourceUrl: `${BASE_URL}/comics/${encodeURIComponent(slug)}`,
        imageUrl: safeImageUrl(series.cover, BASE_URL),
        author: "",
        status: "Unknown",
        updated: "",
        view: "",
        description: "",
        genres: [],
        chapterList: parseChapters(chapterPayload, slug),
    }
}

async function pages(mangaId, chapterId) {
    const mangaSlug = seriesSlug(decodeReference(mangaId, MANGA_PREFIX))
    const chapterUrlValue = decodeReference(chapterId, CHAPTER_PREFIX)
    const url = new URL(chapterUrlValue)
    if (url.hostname !== "asurascans.com") throw new Error("Invalid Asura Scans chapter URL")
    const match = url.pathname.match(/^\/comics\/([^/]+)\/chapter\/([\d.]+)$/)
    if (!match) throw new Error("Invalid Asura Scans chapter URL")
    const [, slug, number] = match
    if (slug !== mangaSlug) throw new Error("This chapter does not belong to the selected manga")
    const payload = await getJson(
        `${API_URL}/series/${encodeURIComponent(slug)}/chapters/${encodeURIComponent(number)}`,
        { referer: chapterUrlValue },
    )
    return {
        title: "",
        currentChapter: `Chapter ${number}`,
        chapterListIds: [],
        source: "asura",
        images: parsePages(payload).map((image, index) => ({ title: `Page ${index + 1}`, image })),
    }
}

module.exports = {
    search,
    details,
    pages,
    _test: { seriesSlug, parseSearch, parseChapters, parsePages, chapterUrl, isEarlyAccess, MANGA_PREFIX, CHAPTER_PREFIX },
}
