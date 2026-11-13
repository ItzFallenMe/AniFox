const mangaController = require("../controllers/mangaController")
const chapterController = require("../controllers/chapterController")

const manga = require("express").Router()

manga.get("/:id", mangaController)
manga.get("/:id/:ch", chapterController)

module.exports = manga
