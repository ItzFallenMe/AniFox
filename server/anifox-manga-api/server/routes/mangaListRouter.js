const mangaListController = require("../controllers/ListMangaController")

const mangaList = require("express").Router()

mangaList.get("/", mangaListController)

module.exports = mangaList
