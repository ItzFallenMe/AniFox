const mangadex = require("../mangadex")

const chapterController = async (req, res) => {
    try {
        const result = await mangadex.pages(req.params.ch)
        res.json(result)
    } catch (_) {
        res.status(404).json({ error: "Chapter pages are unavailable." })
    }
}

module.exports = chapterController
