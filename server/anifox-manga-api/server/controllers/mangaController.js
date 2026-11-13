const cheerio = require("cheerio")
const { providerImageUrl } = require("../provider")

const mangaController = (req, res) => {
    const $ = cheerio.load(req.html)
    const target = $(".manga-info-top")
    const info = target.find(".manga-info-text li")
    const valueAfterColon = (index) => {
        const text = info.eq(index).text()
        const colon = text.indexOf(":")
        return colon < 0 ? text.trim() : text.slice(colon + 1).trim()
    }

    const metaData = {
        imageUrl: providerImageUrl(target.find(".manga-info-pic img").attr("src") || target.find(".manga-info-pic img").attr("data-src")),
        name: info.eq(0).find("h1").text().trim() || $("h1").first().text().trim(),
        author: info.eq(1).find("a").text().trim() || valueAfterColon(1),
        status: valueAfterColon(2),
        updated: valueAfterColon(3),
        view: valueAfterColon(5),
        description: $(".panel-story-info-description").text().trim() || $(".story-detail-info").text().trim(),
        genres: valueAfterColon(6).split(",").map((value) => value.trim()).filter(Boolean),
    }

    res.json({ ...metaData, chapterList: req.chapterList })
}

module.exports = mangaController
