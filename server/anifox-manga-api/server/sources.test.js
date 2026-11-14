const assert = require("node:assert/strict")
const test = require("node:test")
const mangaSources = require("./sources")
const mangadex = require("./mangadex")

test("only MangaDex Safe-rated content is advertised", async () => {
    assert.deepEqual(mangaSources.sources.map(({ id }) => id), ["mangadex"])
    assert.deepEqual(mangaSources.sources[0].capabilities, [
        "catalog",
        "search",
        "details",
        "chapters",
        "pages",
    ])
    assert.equal(mangaSources.sources[0].contentRating, "safe")

    const listing = await mangaSources.listSources()
    assert.equal(listing.safeOnly, true)
})

test("all-source search is limited to MangaDex and reports the safe-only policy", async () => {
    const original = mangadex.search
    mangadex.search = async () => ({
        mangaList: [{ id: "safe-title", source: "mangadex" }],
        metaData: { totalStories: 1, totalPages: 1, page: 1 },
    })
    try {
        const result = await mangaSources.search({ query: "sample", page: 1 })
        assert.deepEqual(result.mangaList.map(({ id }) => id), ["safe-title"])
        assert.deepEqual(result.sources, ["mangadex"])
        assert.deepEqual(result.unavailableSources, [])
        assert.equal(result.safeOnly, true)
    } finally {
        mangadex.search = original
    }
})

test("other source requests and legacy provider IDs are rejected", async () => {
    await assert.rejects(
        mangaSources.search({ query: "sample", source: "mangapill" }),
        { status: 400 },
    )
    await assert.rejects(
        mangaSources.details("mangapill-old-id"),
        { status: 404 },
    )
})
