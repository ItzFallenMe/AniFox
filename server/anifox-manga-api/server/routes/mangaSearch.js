const SearchManga = require("../controllers/searchMangaController")

const mangaSearch = require("express").Router()

mangaSearch.get("/:id", SearchManga)

module.exports = mangaSearch
