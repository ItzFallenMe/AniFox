const httpReq = require("request-promise")
const cheerio = require("cheerio")
const { providerUrl } = require("../../provider")

const pagesValidation = (req, res, next) => {
    const categoryId = req.metaData.category.find((item) => item.name === req.query.category)?.id || "None"
    const type = String(req.query.type || "Latest").replace("Top read", "topview").toLowerCase()
    const state = req.query.state || "None"
    const url = providerUrl(`/manga_list?type=${encodeURIComponent(type)}&category=${encodeURIComponent(categoryId)}&state=${encodeURIComponent(state)}&page=99999999`)

    httpReq(url)
        .then((html) => {
            const $ = cheerio.load(html)
            const pageText = $(".panel_page_number .group_page .page_last").text()
            const totalPages = Number(pageText.match(/Last\((\d+)\)/)?.[1]) || 1
            const totalMatch = $(".panel_page_number .group_qty .page_blue").text().match(/Total:\s*([\d,]+)\s+stories/i)
            const totalStories = Number((totalMatch?.[1] || "0").replace(/,/g, "")) || 0

            req.metaData = { totalStories, totalPages, ...req.metaData }
            req.query.page = Math.min(Math.max(1, Number(req.query.page) || 1), totalPages)
            next()
        })
        .catch(() => {
            res.status(502).json({ error: "The manga provider pagination is unavailable." })
        })
}

module.exports = pagesValidation
