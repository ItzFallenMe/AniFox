const cheerio = require("cheerio")
const { providerImageUrl } = require("../provider")

const chapterController = (req, res) => {
    const $ = cheerio.load(req.html)
    const target = $(".trang-doc")
    const breadcrumb = target.find(".breadcrumb .rdfa-breadcrumb").text()
        .replace(/\s+/g, " ")
        .split("»")
        .map((value) => value.trim())
        .filter(Boolean)
    const assets = {
        title: breadcrumb[3] || $("title").text().trim(),
        currentChapter: breadcrumb[4] || "",
        chapterListIds: target.find(".option_wrap #c_chapter option").map(function () {
            return { id: $(this).attr("value"), name: $(this).text().trim() }
        }).get().filter((chapter) => chapter.id),
        images: target.find(".vung-doc img").map(function () {
            const image = $(this)
            const url = providerImageUrl(image.attr("data-src") || image.attr("src"))
            if (!url) return null
            return { title: image.attr("title") || "", image: url }
        }).get().filter(Boolean),
    }

    res.json(assets)
}

module.exports = chapterController
