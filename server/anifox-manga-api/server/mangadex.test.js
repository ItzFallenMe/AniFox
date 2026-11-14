const assert = require("node:assert/strict")
const test = require("node:test")
const sourceUtils = require("./source-utils")

test("manga source HTTP utilities retry transient failures and bound response reads", async () => {
    const originalFetch = global.fetch
    let attempts = 0
    global.fetch = async () => {
        attempts += 1
        return attempts === 1
            ? new Response("temporarily unavailable", { status: 503 })
            : new Response("ready", { status: 200 })
    }

    try {
        const response = await sourceUtils.fetchWithRetry("https://manga.example", {
            retries: 1,
            retryDelayMs: 0,
        })
        assert.equal(await sourceUtils.readResponseText(response), "ready")
        assert.equal(attempts, 2)
    } finally {
        global.fetch = originalFetch
    }

    await assert.rejects(
        sourceUtils.readResponseText(new Response("too large"), 3),
        /oversized/,
    )
})

test("MangaDex rejects unclassified or non-safe title ratings", () => {
    const { isSafeManga } = require("./mangadex")._test
    assert.equal(isSafeManga({ attributes: { contentRating: "safe" } }), true)
    assert.equal(isSafeManga({ attributes: { contentRating: "suggestive" } }), false)
    assert.equal(isSafeManga({ attributes: { contentRating: "erotica" } }), false)
    assert.equal(isSafeManga({ attributes: {} }), false)
})

test("MangaDex catalog and search request only Safe titles and filter untrusted results", async () => {
    const originalFetch = global.fetch
    const requested = []
    const safeTitle = {
        id: "safe-title",
        attributes: {
            title: { en: "Safe title" },
            contentRating: "safe",
        },
        relationships: [],
    }
    const unsafeTitle = {
        id: "suggestive-title",
        attributes: {
            title: { en: "Suggestive title" },
            contentRating: "suggestive",
        },
        relationships: [],
    }

    global.fetch = async (input) => {
        requested.push(new URL(input))
        return Response.json({ data: [safeTitle, unsafeTitle], total: 2 })
    }

    try {
        const catalog = await require("./mangadex").list({ page: 777 })
        const search = await require("./mangadex").search({
            query: "safe test",
            page: 778,
        })

        assert.deepEqual(catalog.mangaList.map(({ id }) => id), ["safe-title"])
        assert.deepEqual(search.mangaList.map(({ id }) => id), ["safe-title"])
        assert.deepEqual(
            requested.map((url) => url.searchParams.getAll("contentRating[]")),
            [["safe"], ["safe"]],
        )
    } finally {
        global.fetch = originalFetch
    }
})

test("MangaDex checks the parent title rating before returning chapter pages", async () => {
    const originalFetch = global.fetch
    const requested = []
    global.fetch = async (input) => {
        const url = new URL(input)
        requested.push(url)
        if (url.pathname === "/chapter/chapter-id") {
            return Response.json({
                data: {
                    id: "chapter-id",
                    attributes: { pages: 10 },
                    relationships: [{ id: "suggestive-parent", type: "manga" }],
                },
            })
        }
        return Response.json({
            data: {
                id: "suggestive-parent",
                attributes: { contentRating: "suggestive" },
            },
        })
    }

    try {
        await assert.rejects(
            require("./mangadex").pages("suggestive-parent", "chapter-id"),
            { status: 404 },
        )
        assert.equal(requested.length, 2)
        assert.match(requested[0].pathname, /\/chapter\/chapter-id$/)
        assert.match(requested[1].pathname, /\/manga\/suggestive-parent$/)
    } finally {
        global.fetch = originalFetch
    }
})

test("MangaDex chapter lists include only hosted pages and label each language", async () => {
    const originalFetch = global.fetch
    const mangaId = "test-dragon-ball-title"
    global.fetch = async (input) => {
        const url = new URL(input)
        if (url.pathname === `/manga/${mangaId}`) {
            return Response.json({
                data: { id: mangaId, attributes: { contentRating: "safe" } },
            })
        }
        if (url.pathname === `/manga/${mangaId}/feed`) {
            return Response.json({
                data: [
                    {
                        id: "hosted-fa",
                        attributes: {
                            chapter: "1",
                            pages: 20,
                            externalUrl: null,
                            translatedLanguage: "fa",
                        },
                    },
                    {
                        id: "hosted-vi",
                        attributes: {
                            chapter: "1",
                            pages: 20,
                            externalUrl: null,
                            translatedLanguage: "vi",
                        },
                    },
                    {
                        id: "official-external",
                        attributes: {
                            chapter: "1",
                            pages: 0,
                            externalUrl: "https://mangaplus.shueisha.co.jp/viewer/1000762",
                            translatedLanguage: "en",
                        },
                    },
                    {
                        id: "empty",
                        attributes: {
                            chapter: "2",
                            pages: 0,
                            externalUrl: null,
                            translatedLanguage: "en",
                        },
                    },
                ],
            })
        }
        throw new Error(`Unexpected MangaDex request: ${url}`)
    }

    try {
        const chapters = await require("./mangadex").chapters(mangaId)
        assert.deepEqual(chapters.map(({ id }) => id), ["hosted-fa", "hosted-vi"])
        assert.deepEqual(chapters.map(({ languageCode }) => languageCode), ["fa", "vi"])
    } finally {
        global.fetch = originalFetch
    }
})

test("MangaDex never returns externally hosted chapters as in-app pages", async () => {
    const originalFetch = global.fetch
    const mangaId = "safe-dragon-ball-title"
    global.fetch = async (input) => {
        const url = new URL(input)
        if (url.pathname === "/chapter/external-chapter") {
            return Response.json({
                data: {
                    id: "external-chapter",
                    attributes: {
                        pages: 0,
                        externalUrl: "https://mangaplus.shueisha.co.jp/viewer/1000762",
                    },
                    relationships: [{ id: mangaId, type: "manga" }],
                },
            })
        }
        if (url.pathname === `/manga/${mangaId}`) {
            return Response.json({
                data: { id: mangaId, attributes: { contentRating: "safe" } },
            })
        }
        throw new Error(`Unexpected MangaDex request: ${url}`)
    }

    try {
        await assert.rejects(
            require("./mangadex").pages(mangaId, "external-chapter"),
            /no MangaDex-hosted pages/,
        )
    } finally {
        global.fetch = originalFetch
    }
})

test("MangaDex reader uses the lower-bandwidth data-saver page set when available", async () => {
    const originalFetch = global.fetch
    const mangaId = "safe-hosted-title"
    const chapterId = "hosted-chapter"
    global.fetch = async (input) => {
        const url = new URL(input)
        if (url.pathname === `/chapter/${chapterId}`) {
            return Response.json({
                data: {
                    id: chapterId,
                    attributes: { pages: 1, externalUrl: null },
                    relationships: [{ id: mangaId, type: "manga" }],
                },
            })
        }
        if (url.pathname === `/manga/${mangaId}`) {
            return Response.json({
                data: { id: mangaId, attributes: { contentRating: "safe" } },
            })
        }
        if (url.pathname === `/at-home/server/${chapterId}`) {
            return Response.json({
                baseUrl: "https://uploads.mangadex.network",
                chapter: {
                    hash: "sample-hash",
                    data: ["full.jpg"],
                    dataSaver: ["small.jpg"],
                },
            })
        }
        throw new Error(`Unexpected MangaDex request: ${url}`)
    }

    try {
        const result = await require("./mangadex").pages(mangaId, chapterId)
        assert.equal(
            result.images[0].image,
            "https://uploads.mangadex.network/data-saver/sample-hash/small.jpg",
        )
    } finally {
        global.fetch = originalFetch
    }
})
