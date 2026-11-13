const dataValidation = (req, res, next) => {

    ["category", "type", "state"].forEach((key) => {
        const options = req.metaData?.[key] || []
        const requested = req.query[key]
        const match = options.find((option) => option.name === requested)
        req.query[key] = match?.name || options[0]?.name || "None"
    })

    next()
}

module.exports = dataValidation
