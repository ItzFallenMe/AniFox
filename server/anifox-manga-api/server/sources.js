const mangadex = require("./mangadex")

const sources = [
    {
        id: "mangadex",
        name: "MangaDex",
        url: "https://mangadex.org",
        capabilities: ["catalog", "search", "details", "chapters", "pages"],
        contentRating: "safe",
    },
]

function mangaSource(id) {
    if (typeof id === "string" && /^(mangapill|asura|comick|tcb)-/.test(id)) {
        const error = new Error("Only safe-rated MangaDex titles are available.")
        error.status = 404
        throw error
    }
    return "mangadex"
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

    if (source !== "all" && source !== "mangadex") {
        const error = new Error("Only safe-rated MangaDex titles are available.")
        error.status = 400
        throw error
    }

    const currentPage = Math.max(1, Number(page) || 1)
    const result = await mangadex.search({ query: normalizedQuery, page: currentPage })
    return {
        ...result,
        sources: ["mangadex"],
        unavailableSources: [],
        safeOnly: true,
    }
}

async function details(id) {
    mangaSource(id)
    return mangadex.details(id)
}

async function pages(mangaId, chapterId) {
    const mangaProvider = mangaSource(mangaId)
    const chapterProvider = mangaSource(chapterId)
    if (mangaProvider !== chapterProvider) {
        const error = new Error("Chapter and manga sources do not match")
        error.status = 400
        throw error
    }
    return mangadex.pages(mangaId, chapterId)
}

async function listSources() {
    return {
        sources,
        safeOnly: true,
        implementation: "MangaDex is the only manga provider. Catalog, search, title and chapter routes accept only MangaDex content explicitly rated safe.",
        author: "ItzFallenMe",
    }
}

module.exports = {
    sources,
    listSources,
    mangaSource,
    search,
    list: (params) => mangadex.list(params),
    details,
    pages,
}
