const USER_AGENT = "AniFox/1.0 (+https://github.com/ItzFallenMe/AniFox)"
const REQUEST_TIMEOUT_MS = 12_000
const MAX_RESPONSE_BYTES = 6 * 1024 * 1024

async function request(url, { accept = "application/json", headers = {}, referer } = {}) {
    const response = await fetch(url, {
        headers: {
            Accept: accept,
            "User-Agent": USER_AGENT,
            ...(referer ? { Referer: referer } : {}),
            ...headers,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`Manga source responded with ${response.status}`)

    const length = Number(response.headers.get("content-length"))
    if (Number.isFinite(length) && length > MAX_RESPONSE_BYTES) {
        throw new Error("Manga source returned an oversized response")
    }
    const data = Buffer.from(await response.arrayBuffer())
    if (data.byteLength > MAX_RESPONSE_BYTES) {
        throw new Error("Manga source returned an oversized response")
    }
    return { response, text: data.toString("utf8") }
}

async function getJson(url, options = {}) {
    const { text } = await request(url, options)
    try {
        return JSON.parse(text)
    } catch {
        throw new Error("Manga source returned invalid JSON")
    }
}

async function getHtml(url, options = {}) {
    return (await request(url, { accept: "text/html,application/xhtml+xml", ...options })).text
}

function encodeReference(prefix, value) {
    return prefix + Buffer.from(value, "utf8").toString("base64url")
}

function decodeReference(id, prefix) {
    if (typeof id !== "string" || !id.startsWith(prefix)) throw new Error("Invalid manga source id")
    const token = id.slice(prefix.length)
    if (!/^[A-Za-z0-9_-]{1,6000}$/.test(token)) throw new Error("Invalid manga source id")
    const decoded = Buffer.from(token, "base64url").toString("utf8")
    if (Buffer.from(decoded, "utf8").toString("base64url") !== token) {
        throw new Error("Invalid manga source id")
    }
    return decoded
}

function safeSourceUrl(value, baseUrl) {
    const url = new URL(value, baseUrl)
    if (url.protocol !== "https:" || url.username || url.password || url.port) {
        throw new Error("Manga source returned an invalid URL")
    }
    if (url.hostname !== new URL(baseUrl).hostname) {
        throw new Error("Manga source returned a URL on an unexpected host")
    }
    return url.href
}

function safeImageUrl(value, baseUrl) {
    if (typeof value !== "string" || !value.trim()) return null
    try {
        const url = new URL(value, baseUrl)
        if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null
        return url.href
    } catch {
        return null
    }
}

function numericChapter(value) {
    const number = Number.parseFloat(String(value ?? "").replace(/[^\d.-]/g, ""))
    return Number.isFinite(number) ? number : Number.POSITIVE_INFINITY
}

module.exports = {
    USER_AGENT,
    request,
    getJson,
    getHtml,
    encodeReference,
    decodeReference,
    safeSourceUrl,
    safeImageUrl,
    numericChapter,
}
