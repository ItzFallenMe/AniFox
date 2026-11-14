export function mangaImageSrc(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return `/api/image?url=${encodeURIComponent(url.href)}`;
  } catch {
    return null;
  }
}
