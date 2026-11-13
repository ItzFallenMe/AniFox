const httpReq = require("request-promise")
const cheerio = require("cheerio")
const { providerUrl, providerImageUrl } = require("../provider")

const SearchManga = (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1)
    const query = `${encodeURIComponent(req.params.id)}?page=${page}`

    httpReq(providerUrl(`/search/${query}`))
        .then((html) => {
            const $ = cheerio.load(html)
            const mangaList = []

            $(".panel_story_list .story_item").each((_index, val) => {
                const target = $(val)
                const href = target.find("a:first").attr("href") || ""
                const id = href.split("/").filter(Boolean).at(-1)
                const image = target.find("a:first img").attr("src") || target.find("a:first img").attr("data-src")
                const title = target.find("h3 a").text().trim()
                if (!id || !title) return

                mangaList.push({
                    id,
                    url: href,
                    image: providerImageUrl(image),
                    title,
                    chapter: target.find(".story_item_right .story_item_chapter").text().trim() || null,
                    description: target.find("p").text().trim() || null,
                })
            })

            res.json({ mangaList, metaData: req.metaData })
        })
        .catch(() => {
            res.status(502).json({ error: "The manga provider search is unavailable." })
        })
}

module.exports = SearchManga
