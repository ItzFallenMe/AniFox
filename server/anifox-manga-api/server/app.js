require("dotenv").config()

const cors = require("cors")
const express = require("express")
const mangaRouter = require("./routes/mangaRouter")
const mangaListRouter = require("./routes/mangaListRouter")
const mangaSearch = require("./routes/mangaSearch")

const app = express()

app.disable("x-powered-by")
app.use(cors({ origin: "*" }))
app.use(express.json())

app.get("/", (_req, res) => {
  res.json({
    name: "AniFox Manga API",
    version: "1.0.0",
    author: "ItzFallenMe",
    endpoints: ["/api/manga/:id", "/api/manga/:id/:chapter", "/api/mangaList", "/api/search/:query"],
  })
})

app.get("/health", (_req, res) => res.json({ ok: true }))
app.use("/api/manga", mangaRouter)
app.use("/api/mangaList", mangaListRouter)
app.use("/api/search", mangaSearch)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: "Internal server error" })
})

if (require.main === module) {
  const port = process.env.PORT || 3000
  app.listen(port, () => console.log(`AniFox manga API listening on ${port}`))
}

module.exports = app
