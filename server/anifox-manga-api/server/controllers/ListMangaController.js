const mangadex = require("../mangadex")

const ListManga = async (req, res) => {
    try {
        const result = await mangadex.list({
            page: req.query.page,
            type: req.query.type,
            state: req.query.state,
            category: req.query.category,
        })
        res.json(result)
    } catch (_) {
        res.status(502).json({ error: "The manga provider catalog is unavailable." })
    }
}

module.exports = ListManga
