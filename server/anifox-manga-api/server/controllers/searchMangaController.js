const mangadex = require("../mangadex")

const SearchManga = async (req, res) => {
    try {
        const result = await mangadex.search({
            query: req.params.id,
            page: req.query.page,
        })
        res.json(result)
    } catch (_) {
        res.status(502).json({ error: "The manga provider search is unavailable." })
    }
}

module.exports = SearchManga
