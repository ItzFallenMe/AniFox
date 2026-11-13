const USER_AGENT = "AniFox/1.0 (+https://github.com/ItzFallenMe/AniFox)"
const REQUEST_TIMEOUT_MS = 12_000
const MAX_RESPONSE_BYTES = 6 * 1024 * 1024
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504])

async function fetchWithRetry(url, options = {}) {
    const {
        timeoutMs = REQUEST_TIMEOUT_MS,
        retries = 1,
        retryDelayMs = 200,
    } = options
    let lastError

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        let response
        try {
            response = await fetch(url, {
                ...options,
                timeoutMs: undefined,
                retries: undefined,
                retryDelayMs: undefined,
                signal: AbortSignal.timeout(timeoutMs),
            })
        } catch (error) {
            lastError = error
            if (attempt === retries) throw error
            await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)))
            continue
        }

        if (response.ok || !RETRYABLE_STATUS.has(response.status) || attempt === retries) {
            return response
        }

        const retryAfter = Number(response.headers.get("retry-after"))
        await response.body?.cancel()
        const delay = Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.min(1000, retryAfter * 1000)
            : retryDelayMs * (attempt + 1)
        await new Promise((resolve) => setTimeout(resolve, delay))
    }

    throw lastError || new Error("Manga source request failed")
}

async function readResponseText(response, maxBytes = MAX_RESPONSE_BYTES) {
    if (!response.body) return ""

    const contentLength = Number(response.headers.get("content-length"))
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
        throw new Error("Manga source returned an oversized response")
    }

    const reader = response.body.getReader()
    const chunks = []
    let byteLength = 0
    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            byteLength += value.byteLength
            if (byteLength > maxBytes) {
                await reader.cancel()
                throw new Error("Manga source returned an oversized response")
            }
            chunks.push(Buffer.from(value))
        }
    } finally {
        reader.releaseLock()
    }
    return Buffer.concat(chunks, byteLength).toString("utf8")
}

async function request(url, {
    accept = "application/json",
    headers = {},
    referer,
    maxBytes = MAX_RESPONSE_BYTES,
    ...options
} = {}) {
    const response = await fetchWithRetry(url, {
        ...options,
        headers: {
            Accept: accept,
            "User-Agent": USER_AGENT,
            ...(referer ? { Referer: referer } : {}),
            ...headers,
        },
    })
    if (!response.ok) {
        await response.body?.cancel()
        throw new Error(`Manga source responded with ${response.status}`)
    }

    return {
        response,
        text: await readResponseText(response, maxBytes),
    }
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
    fetchWithRetry,
    readResponseText,
    request,
    getJson,
    getHtml,
    encodeReference,
    decodeReference,
    safeSourceUrl,
    safeImageUrl,
    numericChapter,
}
