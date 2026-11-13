const httpReq = require("request-promise")
const cheerio = require("cheerio")
const { providerUrl } = require("../../provider")

const pagesValidation = (req, res, next) => {
    const page = Math.max(1, Number(req.query.page) || 1)
    const url = providerUrl(`/search/${encodeURIComponent(req.params.id)}`)

    httpReq(url)
        .then((html) => {
            const $ = cheerio.load(html)
            const pageText = $(".panel_page_number .group_page .page_last").text()
            const totalPages = Number(pageText.match(/Last\((\d+)\)/)?.[1]) || 1
            req.metaData = { totalPages }
            req.query.page = Math.min(page, totalPages)
            next()
        })
        .catch(() => {
            res.status(502).json({ error: "The manga provider search is unavailable." })
        })
}

module.exports = pagesValidation
