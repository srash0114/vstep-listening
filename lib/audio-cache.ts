const CACHE_NAME = "vstep-audio-v1";

/**
 * Returns a blob URL if the audio is already cached locally,
 * otherwise returns null (caller should use original URL).
 *
 * - 1st visit: returns null → audio element loads from Cloudinary normally
 * - 2nd+ visit: returns blob URL → zero Cloudinary bandwidth
 */
export async function getAudioSrc(url: string): Promise<string | null> {
  if (!url || typeof window === "undefined" || !("caches" in window)) return null;

  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url);
    if (cached) {
      const blob = await cached.blob();
      return URL.createObjectURL(blob);
    }
  } catch {}

  return null;
}

/**
 * Called after the audio element has loaded (onCanPlay).
 * At this point the file is already in the browser HTTP cache,
 * so the fetch() hits HTTP cache — NOT Cloudinary — zero extra bandwidth.
 */
export async function cacheAudioUrl(url: string): Promise<void> {
  if (!url || typeof window === "undefined" || !("caches" in window)) return;

  try {
    const cache = await caches.open(CACHE_NAME);
    const already = await cache.match(url);
    if (already) return; // already cached

    const response = await fetch(url);
    if (response.ok) await cache.put(url, response);
  } catch {}
}
