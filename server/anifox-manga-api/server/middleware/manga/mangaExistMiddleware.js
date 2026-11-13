const httpReq = require("request-promise")
const { providerUrl } = require("../../provider")

const mangaExist = (req, res, next) => {

    const mangaUrl = providerUrl(`/manga/${encodeURIComponent(req.params.id)}`)

    httpReq(mangaUrl)
        .then((html) => {
            const httpState = false //Todo : if there is 404 text 

            if (httpState) {
                res.status(404).json({
                    state: 404,
                    message: "Manga Not Exist"
                })
            } else {
                req.html = html
                next()
            }
        })
        .catch((e) => {
            res.status(502).json({
                state: 500,
                message: "The manga provider could not load this title."
            })
        })
}

module.exports = mangaExist
