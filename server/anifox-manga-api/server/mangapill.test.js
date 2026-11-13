const assert = require("node:assert/strict")
const test = require("node:test")
const { _test } = require("./mangapill")

const searchHtml = `
  <a href="/manga/123/one-piece"><img src="https://cdn.example/one-piece.jpg" alt="One Piece">One Piece</a>
  <a href="/manga/123/one-piece">Duplicate</a>
  <a href="/manga/456/naruto"><img data-src="/covers/naruto.jpg" alt="">Naruto</a>
  <a href="/manga/789/some-cool-series"><img src="/loading.gif"></a>
  <a href="https://example.org/manga/wrong-host">Not MangaPill</a>
`

const mangaHtml = `
  <h1>Sample Manga</h1>
  <meta property="og:image" content="/cover.jpg">
  <meta name="description" content="A sample story">
  <a href="/genre/action">Action</a>
  <a href="/chapters/1/sample-chapter-1">Chapter 1</a>
  <a href="/chapters/3/sample-chapter-3-5">Chapter 3.5</a>
  <a href="/chapters/2/sample-chapter-2">Chapter 2</a>
`

const chapterHtml = `
  <h1>Sample Manga Chapter 1</h1>
  <img class="js-page" data-src="https://cdn.example/page-1.jpg">
  <img class="js-page" src="https://cdn.example/page-2.jpg">
  <img class="js-page" data-src="https://cdn.example/loading.gif">
  <img src="https://cdn.example/logo.png">
`

test("search parser deduplicates and normalizes MangaPill results", () => {
    const results = _test.parseSearch(searchHtml)
    assert.equal(results.length, 3)
    assert.equal(results[0].title, "One Piece")
    assert.equal(results[1].title, "Naruto")
    assert.equal(results[2].title, "Some Cool Series")
    assert.equal(results[0].source, "mangapill")
    assert.equal(_test.pathFromId(results[0].id, "/manga/"), "/manga/123/one-piece")
})

test("chapter parser sorts numerically and retains MangaPill chapter paths", () => {
    const chapters = _test.parseChapters(mangaHtml)
    assert.deepEqual(chapters.map((chapter) => chapter.name), ["Chapter 1", "Chapter 2", "Chapter 3.5"])
    assert.equal(_test.pathFromId(chapters[0].id, "/chapters/"), "/chapters/1/sample-chapter-1")
})

test("details and page parsers return normalized data and skip placeholders", () => {
    const details = _test.parseDetails(mangaHtml, "/manga/123/sample-manga")
    assert.equal(details.name, "Sample Manga")
    assert.equal(details.description, "A sample story")
    assert.deepEqual(details.genres, ["Action"])

    const pages = _test.parsePages(chapterHtml, "/chapters/1/sample-chapter-1")
    assert.equal(pages.images.length, 2)
    assert.equal(pages.source, "mangapill")
    assert.equal(pages.currentChapter, "Sample Manga Chapter 1")
})

test("MangaPill IDs reject paths outside the source", () => {
    assert.throws(() => _test.pathFromId("mangapill-Li4uLi9zZWNyZXQ", "/manga/"), /Invalid MangaPill id/)
})
