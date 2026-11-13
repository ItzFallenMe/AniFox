const assert = require("node:assert/strict")
const test = require("node:test")
const asura = require("./asura")
const comick = require("./comick")
const tcb = require("./tcbscans")

test("Asura Scans parsers preserve source IDs and skip locked early access", () => {
    const results = asura._test.parseSearch({ data: [
        { title: "Other title", slug: "other-title", cover: "https://cdn.asurascans.com/cover.jpg" },
        { title: "Solo Leveling", public_url: "/comics/solo-leveling-a1" },
    ] }, "solo")
    assert.equal(results[0].title, "Solo Leveling")
    assert.match(results[0].id, /^asura-/)

    const chapters = asura._test.parseChapters({ data: [
        { number: "3", title: "Three", published_at: "2025-01-03", is_premium: false },
        { number: "2", is_premium: true },
        { number: "1", is_premium: true, early_access_until: "2000-01-01T00:00:00Z" },
    ] }, "solo-leveling-a1")
    assert.deepEqual(chapters.map((chapter) => chapter.name), ["Chapter 1", "Chapter 3 — Three"])
    assert.deepEqual(asura._test.parsePages({ data: { is_locked: true, chapter: { pages: ["https://cdn.example/page.jpg"] } } }), [])
    assert.throws(() => asura._test.seriesSlug("https://attacker.example/comics/series"), /not an Asura/)
})

test("ComicK parsers deduplicate search and chapter data", () => {
    const search = comick._test.parseSearch([
        { slug: "sample", title: "Sample", md_covers: [{ b2key: "cover.jpg" }] },
        { slug: "sample", title: "Duplicate" },
    ])
    assert.equal(search.length, 1)
    assert.equal(search[0].image, "https://meo.comick.pictures/cover.jpg")
    assert.match(search[0].id, /^comick-/)

    const chapters = comick._test.parseChapters({ chapters: [
        { hid: "ch-2", chap: "2", lang: "en", up_count: 2 },
        { hid: "ch-1", chap: "1", lang: "en", up_count: 1 },
        { hid: "ch-2b", chap: "2", lang: "en", up_count: 8 },
    ] }, "sample")
    assert.equal(chapters.length, 2)
    assert.match(chapters[1].path, /ch-2b-chapter-2-en$/)
    assert.deepEqual(comick._test.parsePages({ chapter: { md_images: [{ b2key: "page-1.jpg" }] } }), [
        "https://meo.comick.pictures/page-1.jpg",
    ])
    assert.throws(() => comick._test.comicSlug("https://attacker.example/comic/sample"), /not a ComicK/)
})

test("TCB Scans HTML parsers reject external links and remove placeholder pages", () => {
    const search = tcb._test.parseSearch(`
      <a href="/mangas/one-piece"><img src="/cover.jpg">One Piece</a>
      <a href="https://attacker.example/mangas/one-piece">One Piece</a>
    `, "one piece")
    assert.equal(search.length, 1)
    assert.equal(search[0].url, "https://tcbonepiecechapters.com/mangas/one-piece")

    const chapters = tcb._test.parseChapters(`
      <a href="/mangas/one-piece/chapters/2"><div class="text-lg">Chapter 2</div></a>
      <a href="/mangas/one-piece/chapters/1"><div class="text-lg">Chapter 1</div></a>
    `, search[0].url)
    assert.deepEqual(chapters.map((chapter) => chapter.name), ["Chapter 1", "Chapter 2"])

    const pages = tcb._test.parsePages(`
      <picture><img src="/uploads/page-1.jpg"></picture>
      <picture><img src="/images/logo.png"></picture>
      <img src="/loading.gif">
    `)
    assert.deepEqual(pages.map((page) => page.image), ["https://tcbonepiecechapters.com/uploads/page-1.jpg"])
})
