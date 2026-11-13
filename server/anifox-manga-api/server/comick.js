// Native Node adapter ported from MeManga's ComicK scraper.
// Copyright (c) 2026 meellm; see THIRD_PARTY_NOTICES.md.
const { getJson, encodeReference, decodeReference, safeImageUrl, numericChapter } = require("./source-utils")

const BASE_URL = "https://comick.io"
const API_URL = "https://api.comick.dev"
const IMAGE_URL = "https://meo.comick.pictures"
const MANGA_PREFIX = "comick-"
const CHAPTER_PREFIX = "comick-ch-"
const CHAPTER_PAGE_SIZE = 300
const MAX_CHAPTER_PAGES = 10

function comicSlug(value) {
    let url
    try {
        url = new URL(value)
    } catch {
        throw new Error("Invalid ComicK URL")
    }
    if (!new Set(["comick.io", "comick.dev", "www.comick.io", "www.comick.dev"]).has(url.hostname)) {
        throw new Error("This is not a ComicK URL")
    }
    const match = url.pathname.match(/^\/comic\/([^/]+)/)
    if (!match) throw new Error("Invalid ComicK comic URL")
    return match[1]
}

function coverUrl(item) {
    const cover = (item?.md_covers || []).find((candidate) => candidate?.b2key)?.b2key
    return safeImageUrl(cover ? `${IMAGE_URL}/${cover}` : item?.cover_url, IMAGE_URL)
}

function parseSearch(payload) {
    if (!Array.isArray(payload)) return []
    const seen = new Set()
    return payload.flatMap((item) => {
        const slug = String(item?.slug || "").trim()
        const title = String(item?.title || "").trim()
        if (!slug || !title || seen.has(slug)) return []
        seen.add(slug)
        const url = `${BASE_URL}/comic/${encodeURIComponent(slug)}`
        return [{
            id: encodeReference(MANGA_PREFIX, url),
            url,
            source: "comick",
            title,
            image: coverUrl(item),
            description: String(item?.desc || "").slice(0, 1000),
            chapter: null,
        }]
    })
}

function parseChapters(payload, slug) {
    const records = Array.isArray(payload?.chapters) ? payload.chapters : []
    const best = new Map()
    for (const row of records) {
        const hid = String(row?.hid || "").trim()
        const number = String(row?.chap ?? "").trim()
        if (!hid || !number) continue
        const current = best.get(number)
        const rank = (candidate) => [
            Number(!candidate?.md_chapters_groups?.some((group) => group?.md_groups?.official)),
            Number(candidate?.up_count || 0),
        ]
        const nextRank = rank(row)
        const currentRank = current ? rank(current) : [-1, -1]
        if (!current || nextRank[0] > currentRank[0] || (nextRank[0] === currentRank[0] && nextRank[1] > currentRank[1])) {
            best.set(number, row)
        }
    }

    return [...best.entries()]
        .sort(([a], [b]) => numericChapter(a) - numericChapter(b))
        .map(([number, row]) => {
            const language = row.lang || "en"
            const url = `${BASE_URL}/comic/${encodeURIComponent(slug)}/${encodeURIComponent(row.hid)}-chapter-${encodeURIComponent(number)}-${encodeURIComponent(language)}`
            return {
                id: encodeReference(CHAPTER_PREFIX, url),
                path: url,
                name: row.title ? `Chapter ${number} — ${String(row.title).trim()}` : `Chapter ${number}`,
                view: "",
                createdAt: String(row.publish_at || row.created_at || "").slice(0, 10),
            }
        })
}

function parsePages(payload) {
    const rows = payload?.chapter?.md_images
    if (!Array.isArray(rows)) return []
    const seen = new Set()
    return rows.flatMap((item) => {
        const key = typeof item === "string" ? item : item?.b2key || item?.url
        const url = safeImageUrl(typeof key === "string" && key.startsWith("http") ? key : key ? `${IMAGE_URL}/${key}` : "", IMAGE_URL)
        if (!url || seen.has(url)) return []
        seen.add(url)
        return [url]
    })
}

async function fetchChapters(hid, lang = "en") {
    const records = []
    for (let page = 1; page <= MAX_CHAPTER_PAGES; page += 1) {
        const url = new URL(`${API_URL}/v1.0/comic/${encodeURIComponent(hid)}/chapters`)
        url.searchParams.set("limit", String(CHAPTER_PAGE_SIZE))
        url.searchParams.set("page", String(page))
        if (lang) url.searchParams.set("lang", lang)
        const payload = await getJson(url, { referer: `${BASE_URL}/` })
        const batch = Array.isArray(payload?.chapters) ? payload.chapters : []
        if (!batch.length) break
        records.push(...batch)
        if (records.length >= Number(payload.total || 0) || batch.length < CHAPTER_PAGE_SIZE) break
    }
    return records
}

async function search({ query } = {}) {
    const url = new URL(`${API_URL}/v1.0/search`)
    url.searchParams.set("type", "comic")
    url.searchParams.set("page", "1")
    url.searchParams.set("limit", "20")
    url.searchParams.set("q", query)
    return { mangaList: parseSearch(await getJson(url, { referer: `${BASE_URL}/` })) }
}

async function details(id) {
    const url = decodeReference(id, MANGA_PREFIX)
    const slug = comicSlug(url)
    const payload = await getJson(`${API_URL}/comic/${encodeURIComponent(slug)}/`, { referer: `${BASE_URL}/` })
    const comic = payload?.comic
    if (!comic?.hid) throw new Error("ComicK title not found")
    let chapters = await fetchChapters(comic.hid, "en")
    if (!chapters.length) chapters = await fetchChapters(comic.hid, "")
    return {
        name: comic.title || slug.replace(/-/g, " "),
        source: "comick",
        sourceUrl: `${BASE_URL}/comic/${encodeURIComponent(slug)}`,
        imageUrl: coverUrl(comic),
        author: "",
        status: "Unknown",
        updated: "",
        view: "",
        description: String(comic.desc || "").slice(0, 4000),
        genres: [],
        chapterList: parseChapters({ chapters }, slug),
    }
}

async function pages(mangaId, chapterId) {
    const mangaUrl = decodeReference(mangaId, MANGA_PREFIX)
    const slug = comicSlug(mangaUrl)
    const chapterUrlValue = decodeReference(chapterId, CHAPTER_PREFIX)
    const url = new URL(chapterUrlValue)
    if (url.hostname !== "comick.io") throw new Error("Invalid ComicK chapter URL")
    const match = url.pathname.match(/^\/comic\/([^/]+)\/([^/]+)$/)
    if (!match || match[1] !== slug) throw new Error("This chapter does not belong to the selected manga")
    const hid = match[2].split("-chapter-")[0]
    const payload = await getJson(`${API_URL}/chapter/${encodeURIComponent(hid)}`, { referer: chapterUrlValue })
    return {
        title: "",
        currentChapter: "",
        chapterListIds: [],
        source: "comick",
        images: parsePages(payload).map((image, index) => ({ title: `Page ${index + 1}`, image })),
    }
}

module.exports = {
    search,
    details,
    pages,
    _test: { comicSlug, coverUrl, parseSearch, parseChapters, parsePages, fetchChapters, MANGA_PREFIX, CHAPTER_PREFIX },
}
