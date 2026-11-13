const mangadex = require("./mangadex")
const mangapill = require("./mangapill")
const asura = require("./asura")
const comick = require("./comick")
const tcbscans = require("./tcbscans")

const SOURCE_GUIDE = "https://github.com/meellm/MeManga/blob/4268b38a7cab2ea7e5a5d0612a5c15d05befb8b8/docs/SUPPORTED_SOURCES.md"
const sources = [
    {
        id: "mangadex",
        name: "MangaDex",
        url: "https://mangadex.org",
        capabilities: ["catalog", "search", "details", "chapters", "pages"],
    },
    {
        id: "mangapill",
        name: "MangaPill",
        url: "https://mangapill.com",
        capabilities: ["search", "details", "chapters", "pages"],
    },
    {
        id: "asura",
        name: "Asura Scans",
        url: "https://asurascans.com",
        capabilities: ["search", "details", "chapters", "pages"],
    },
    {
        id: "comick",
        name: "ComicK",
        url: "https://comick.io",
        capabilities: ["search", "details", "chapters", "pages"],
    },
    {
        id: "tcb",
        name: "TCB Scans",
        url: "https://tcbonepiecechapters.com",
        capabilities: ["search", "details", "chapters", "pages"],
    },
]

const adapters = {
    mangadex,
    mangapill,
    asura,
    comick,
    tcb: tcbscans,
}

function mangaSource(id) {
    if (typeof id !== "string") return "mangadex"
    if (id.startsWith("mangapill-")) return "mangapill"
    if (id.startsWith("asura-")) return "asura"
    if (id.startsWith("comick-")) return "comick"
    if (id.startsWith("tcb-")) return "tcb"
    return "mangadex"
}

function adapterFor(source) {
    const adapter = adapters[source]
    if (!adapter) {
        const error = new Error("Unsupported manga source")
        error.status = 400
        throw error
    }
    return adapter
}

async function search({ query, page = 1, source = "all" } = {}) {
    const normalizedQuery = String(query || "").trim()
    if (!normalizedQuery) {
        const error = new Error("Enter a manga title to search for.")
        error.status = 400
        throw error
    }
    if (normalizedQuery.length > 100) {
        const error = new Error("Search titles must be 100 characters or less.")
        error.status = 400
        throw error
    }

    const currentPage = Math.max(1, Number(page) || 1)
    const selected = source === "all" ? sources.filter((entry) => entry.capabilities.includes("search")).map((entry) => entry.id) : [source]
    if (selected.some((item) => !sources.some((entry) => entry.id === item && entry.capabilities.includes("search")))) {
        const error = new Error("Unsupported manga source")
        error.status = 400
        throw error
    }

    // MangaDex exposes pagination; the HTML/JSON adapters currently return
    // their first result page only, so avoid repeating those results on later pages.
    const active = currentPage > 1 ? selected.filter((item) => item === "mangadex") : selected
    if (!active.length) {
        return {
            mangaList: [],
            metaData: { totalStories: 0, totalPages: 1, page: currentPage },
            sources: selected,
            unavailableSources: [],
            sourceGuide: SOURCE_GUIDE,
        }
    }

    const settled = await Promise.allSettled(active.map(async (item) => {
        const result = await adapterFor(item).search({ query: normalizedQuery, page: currentPage })
        return { source: item, result }
    }))
    const successful = settled.flatMap((entry) => entry.status === "fulfilled" ? [entry.value] : [])
    const unavailableSources = settled.flatMap((entry, index) => entry.status === "rejected" ? [active[index]] : [])
    if (!successful.length) {
        const error = new Error("All selected manga sources are temporarily unavailable.")
        error.status = 502
        error.unavailableSources = unavailableSources
        throw error
    }

    const mangaList = successful.flatMap(({ source: sourceId, result }) => {
        const items = Array.isArray(result) ? result : result?.mangaList || []
        return items.map((item) => ({ ...item, source: item.source || sourceId }))
    })
    const dexMetadata = successful.find(({ source: sourceId }) => sourceId === "mangadex")?.result?.metaData

    return {
        mangaList,
        metaData: {
            totalStories: dexMetadata?.totalStories ?? mangaList.length,
            totalPages: dexMetadata?.totalPages ?? 1,
            page: currentPage,
        },
        sources: active,
        unavailableSources,
        sourceGuide: SOURCE_GUIDE,
    }
}

async function details(id) {
    return adapterFor(mangaSource(id)).details(id)
}

async function pages(mangaId, chapterId) {
    const mangaProvider = mangaSource(mangaId)
    const chapterProvider = mangaSource(chapterId)
    if (mangaProvider !== chapterProvider) {
        const error = new Error("Chapter and manga sources do not match")
        error.status = 400
        throw error
    }
    const adapter = adapterFor(mangaProvider)
    return mangaProvider === "mangadex" ? adapter.pages(chapterId) : adapter.pages(mangaId, chapterId)
}

async function listSources() {
    return {
        sources,
        guide: SOURCE_GUIDE,
        implementation: "Native AniFox adapters. Only listed sources have implemented connectors; availability can change.",
        author: "ItzFallenMe",
    }
}

module.exports = {
    sources,
    sourceGuide: SOURCE_GUIDE,
    listSources,
    mangaSource,
    search,
    list: (params) => mangadex.list(params),
    details,
    pages,
}
