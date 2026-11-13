const API_BASE = process.env.MANGADEX_API_URL?.trim().replace(/\/+$/, "") || "https://api.mangadex.org"
const COVER_BASE = "https://uploads.mangadex.org/covers"
const PAGE_LIMIT = 24
const USER_AGENT = "AniFox/1.0 (+https://github.com/ItzFallenMe/AniFox)"

async function request(path, params = {}) {
    const url = new URL(`${API_BASE}${path}`)
    for (const [key, value] of Object.entries(params)) {
        if (Array.isArray(value)) {
            for (const item of value) url.searchParams.append(key, item)
        } else if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, value)
        }
    }

    const response = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    })
    if (!response.ok) {
        throw new Error(`MangaDex responded with ${response.status}`)
    }
    return response.json()
}

function titleOf(attributes) {
    return (
        attributes.title?.en ||
        Object.values(attributes.title || {})[0] ||
        "Untitled manga"
    )
}

function descriptionOf(attributes) {
    return attributes.description?.en || Object.values(attributes.description || {})[0] || ""
}

function coverFile(manga) {
    const cover = manga.relationships?.find((item) => item.type === "cover_art")
    return cover?.attributes?.fileName || null
}

function authorOf(manga) {
    const author = manga.relationships?.find((item) => item.type === "author")
    return author?.attributes?.name || ""
}

function toCard(manga) {
    const file = coverFile(manga)
    return {
        id: manga.id,
        url: `https://mangadex.org/title/${manga.id}`,
        image: file ? `${COVER_BASE}/${manga.id}/${file}.256.jpg` : null,
        title: titleOf(manga.attributes),
        chapter: null,
        view: "",
        description: descriptionOf(manga.attributes).replace(/\s+/g, " ").slice(0, 240),
    }
}

function statusOf(value) {
    const labels = {
        ongoing: "Ongoing",
        completed: "Completed",
        hiatus: "Hiatus",
        cancelled: "Cancelled",
    }
    return labels[value] || "Unknown"
}

function orderFor(type) {
    const value = String(type || "").toLowerCase()
    if (value.includes("top") || value.includes("popular")) {
        return { "order[followedCount]": "desc" }
    }
    if (value.includes("new")) {
        return { "order[createdAt]": "desc" }
    }
    return { "order[latestUploadedChapter]": "desc" }
}

async function list({ page = 1, type = "latest", state, category } = {}) {
    const currentPage = Math.max(1, Number(page) || 1)
    const params = {
        limit: PAGE_LIMIT,
        offset: (currentPage - 1) * PAGE_LIMIT,
        "includes[]": ["cover_art"],
        "contentRating[]": ["safe", "suggestive"],
        ...orderFor(type),
    }
    if (state && String(state).toLowerCase() !== "none") {
        params["status[]"] = [String(state).toLowerCase()]
    }
    if (category && category !== "None") {
        params["includedTags[]"] = [category]
    }

    const result = await request("/manga", params)
    const total = Math.max(0, result.total || 0)
    return {
        mangaList: (result.data || []).map(toCard),
        metaData: {
            totalStories: total,
            totalPages: Math.max(1, Math.ceil(total / PAGE_LIMIT)),
            page: currentPage,
            type: [
                { id: "latest", type: "Latest" },
                { id: "topview", type: "Top read" },
                { id: "newest", type: "Newest" },
            ],
            state: [
                { id: "None", type: "None" },
                { id: "ongoing", type: "Ongoing" },
                { id: "completed", type: "Completed" },
                { id: "hiatus", type: "Hiatus" },
            ],
            category: [],
        },
    }
}

async function search({ query, page = 1 } = {}) {
    const currentPage = Math.max(1, Number(page) || 1)
    const result = await request("/manga", {
        title: query,
        limit: PAGE_LIMIT,
        offset: (currentPage - 1) * PAGE_LIMIT,
        "includes[]": ["cover_art"],
        "contentRating[]": ["safe", "suggestive"],
        "order[relevance]": "desc",
    })
    const total = Math.max(0, result.total || 0)
    return {
        mangaList: (result.data || []).map(toCard),
        metaData: {
            totalStories: total,
            totalPages: Math.max(1, Math.ceil(total / PAGE_LIMIT)),
            page: currentPage,
        },
    }
}

async function chapters(mangaId) {
    const items = []
    let offset = 0

    while (offset < 2000) {
        const result = await request(`/manga/${mangaId}/feed`, {
            limit: 500,
            offset,
            "translatedLanguage[]": ["en"],
            "order[volume]": "asc",
            "order[chapter]": "asc",
            "includes[]": ["scanlation_group"],
        })
        const batch = result.data || []
        items.push(...batch)
        if (batch.length < 500) break
        offset += 500
    }

    return items
        .filter((chapter) => chapter.attributes.pages > 0 && !chapter.attributes.externalUrl)
        .map((chapter) => {
        const attributes = chapter.attributes
        const label = attributes.chapter ? `Chapter ${attributes.chapter}` : "Oneshot"
        return {
            id: chapter.id,
            path: `https://mangadex.org/chapter/${chapter.id}`,
            name: attributes.title ? `${label} — ${attributes.title}` : label,
            view: "",
            createdAt: attributes.publishAt || attributes.createdAt || "",
        }
    })
}

async function details(mangaId) {
    const result = await request(`/manga/${mangaId}`, {
        "includes[]": ["cover_art", "author", "artist"],
    })
    const manga = result.data
    if (!manga) throw new Error("Manga not found")

    const attributes = manga.attributes
    const file = coverFile(manga)
    const chapterList = await chapters(mangaId)

    return {
        imageUrl: file ? `${COVER_BASE}/${manga.id}/${file}.512.jpg` : null,
        name: titleOf(attributes),
        author: authorOf(manga),
        status: statusOf(attributes.status),
        updated: attributes.updatedAt || "",
        view: "",
        description: descriptionOf(attributes).replace(/\s+/g, " ").trim(),
        genres: (attributes.tags || [])
            .map((tag) => tag.attributes?.name?.en)
            .filter(Boolean),
        chapterList,
    }
}

async function pages(chapterId) {
    const result = await request(`/at-home/server/${chapterId}`)
    if (!result.chapter) throw new Error("Chapter pages not found")
    const base = `${result.baseUrl}/data/${result.chapter.hash}`
    return {
        title: "",
        currentChapter: "",
        chapterListIds: [],
        images: (result.chapter.data || []).map((file) => ({
            title: file,
            image: `${base}/${file}`,
        })),
    }
}

module.exports = { list, search, details, chapters, pages }
