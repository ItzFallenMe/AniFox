const mangadex = require("../mangadex")

const mangaController = async (req, res) => {
    try {
        const result = await mangadex.details(req.params.id)
        res.json(result)
    } catch (_) {
        res.status(404).json({ error: "Manga details are unavailable." })
    }
}

module.exports = mangaController
