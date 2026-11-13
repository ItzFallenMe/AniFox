const DEFAULT_PROVIDER_URL = "https://ww6.mangakakalot.tv";

function getProviderBaseUrl() {
  const raw = (process.env.DATAPROVIDER_URL || DEFAULT_PROVIDER_URL).trim();
  const parsed = new URL(raw);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("DATAPROVIDER_URL must use HTTP or HTTPS.");
  }
  return raw.replace(/\/+$/, "");
}

function providerUrl(path = "") {
  const base = getProviderBaseUrl();
  return `${base}/${String(path).replace(/^\/+/, "")}`;
}

function providerImageUrl(value) {
  if (!value) return null;
  const image = String(value).trim();
  if (!image) return null;
  if (image.startsWith("//")) return `https:${image}`;
  try {
    return new URL(image).toString();
  } catch (_) {
    return new URL(image, `${getProviderBaseUrl()}/`).toString();
  }
}

module.exports = { getProviderBaseUrl, providerUrl, providerImageUrl };
