const cheerio = require("cheerio")

const chapterList = (req, res, next) => {

    const mangaChaptersList = []
    const $ = cheerio.load(req.html)

    $(".chapter-list .row").map((index, val) => {

        const target = $(val)
        const href = target.find("span a").attr("href") || ""
        const pathParts = href.split("/").filter(Boolean)
        const chapterId = pathParts[pathParts.length - 1]
        if (!chapterId) return

        mangaChaptersList[index] = {
            id: chapterId,
            path: href,
            name: target.find("span a").text().trim(),
            view: target.find("span:eq(1)").text().trim(),
            createdAt: target.find("span:eq(2)").text().trim(),
        }
    })

    req.chapterList = mangaChaptersList
    next()
}

module.exports = chapterList
