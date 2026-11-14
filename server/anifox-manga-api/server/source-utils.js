const REQUEST_TIMEOUT_MS = 12_000
const MAX_RESPONSE_BYTES = 6 * 1024 * 1024
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504])

async function fetchWithRetry(url, options = {}) {
    const {
        timeoutMs = REQUEST_TIMEOUT_MS,
        retries = 1,
        retryDelayMs = 200,
        ...fetchOptions
    } = options
    let lastError

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        let response
        try {
            response = await fetch(url, {
                ...fetchOptions,
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

module.exports = {
    fetchWithRetry,
    readResponseText,
}
