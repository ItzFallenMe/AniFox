const assert = require("node:assert/strict")
const test = require("node:test")
const mangadex = require("./mangadex")
const mangapill = require("./mangapill")
const asura = require("./asura")
const comick = require("./comick")
const tcb = require("./tcbscans")
const mangaSources = require("./sources")
const adapters = { mangadex, mangapill, asura, comick, tcb }

test("source registry only advertises implemented operations", () => {
    assert.deepEqual(mangaSources.sources.map(({ id }) => id), ["mangadex", "mangapill", "asura", "comick", "tcb"])
    assert.ok(mangaSources.sources[0].capabilities.includes("catalog"))
    assert.ok(!mangaSources.sources[1].capabilities.includes("catalog"))
    assert.match(mangaSources.sourceGuide, /MeManga\/blob\/4268b38a7cab2ea7e5a5d0612a5c15d05befb8b8\/docs\/SUPPORTED_SOURCES\.md$/)
})

test("combined search keeps each source's namespaced IDs", async () => {
    const original = Object.fromEntries(Object.entries(adapters).map(([id, adapter]) => [id, adapter.search]))
    for (const [id, adapter] of Object.entries(adapters)) {
        adapter.search = async () => ({ mangaList: [{ id: `${id}-id`, source: id }] })
    }
    try {
        const result = await mangaSources.search({ query: "sample", page: 1 })
        assert.deepEqual(result.mangaList.map(({ id }) => id), ["mangadex-id", "mangapill-id", "asura-id", "comick-id", "tcb-id"])
        assert.deepEqual(result.sources, ["mangadex", "mangapill", "asura", "comick", "tcb"])
        assert.deepEqual(result.unavailableSources, [])
    } finally {
        for (const [id, adapter] of Object.entries(adapters)) adapter.search = original[id]
    }
})

test("combined search returns partial results when one source is down", async () => {
    const original = Object.fromEntries(Object.entries(adapters).map(([id, adapter]) => [id, adapter.search]))

    mangadex.search = async () => ({ mangaList: [{ id: "dex-id", source: "mangadex" }] })
    mangapill.search = async () => { throw new Error("provider unavailable") }
    asura.search = async () => ({ mangaList: [] })
    comick.search = async () => ({ mangaList: [] })
    tcb.search = async () => ({ mangaList: [] })
    try {
        const result = await mangaSources.search({ query: "sample", page: 1 })
        assert.equal(result.mangaList.length, 1)
        assert.deepEqual(result.unavailableSources, ["mangapill"])
    } finally {
        for (const [id, adapter] of Object.entries(adapters)) adapter.search = original[id]
    }
})

test("MangaPill search is omitted on pages it does not paginate", async () => {
    const original = Object.fromEntries(Object.entries(adapters).map(([id, adapter]) => [id, adapter.search]))
    let pillSearchCalls = 0

    mangadex.search = async () => ({ mangaList: [{ id: "dex-page-2" }] })
    mangapill.search = async () => {
        pillSearchCalls += 1
        return { mangaList: [{ id: "mangapill-duplicate" }] }
    }
    asura.search = async () => ({ mangaList: [] })
    comick.search = async () => ({ mangaList: [] })
    tcb.search = async () => ({ mangaList: [] })
    try {
        const result = await mangaSources.search({ query: "sample", page: 2 })
        assert.deepEqual(result.mangaList.map(({ id }) => id), ["dex-page-2"])
        assert.equal(pillSearchCalls, 0)
    } finally {
        for (const [id, adapter] of Object.entries(adapters)) adapter.search = original[id]
    }
})
