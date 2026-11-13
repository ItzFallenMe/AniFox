const httpReq = require("request-promise")
const cheerio = require("cheerio")
const { providerUrl, providerImageUrl } = require("../provider")

const ListManga = (req, res) => {
    const categoryId = req.metaData.category.find((item) => item.name === req.query.category)?.id || "None"
    const page = Math.max(1, Number(req.query.page) || 1)
    const type = String(req.query.type || "Latest").replace("Top read", "topview").toLowerCase()
    const state = req.query.state || "None"
    const query = `?type=${encodeURIComponent(type)}&category=${encodeURIComponent(categoryId)}&state=${encodeURIComponent(state)}&page=${page}`

    httpReq(providerUrl(`/manga_list${query}`))
        .then((html) => {
            const $ = cheerio.load(html)
            const mangaList = []

            $(".truyen-list .list-truyen-item-wrap").each((_index, val) => {
                const target = $(val)
                const href = target.find("a:first").attr("href") || ""
                const id = href.split("/").filter(Boolean).at(-1)
                const image = target.find("a:first img").attr("data-src") || target.find("a:first img").attr("src")
                const title = target.find("h3 a").text().trim()
                if (!id || !title) return

                mangaList.push({
                    id,
                    url: href,
                    image: providerImageUrl(image),
                    title,
                    chapter: target.find(".list-story-item-wrap-chapter").text().trim(),
                    view: target.find(".aye_icon").text().trim(),
                    description: target.find("p").text().replace("More.\n", " … \n").trim(),
                })
            })

            res.json({ mangaList, metaData: req.metaData })
        })
        .catch(() => {
            res.status(502).json({ error: "The manga provider catalog is unavailable." })
        })
}

module.exports = ListManga
