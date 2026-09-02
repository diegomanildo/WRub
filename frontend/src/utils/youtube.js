/**
 * Extrae el ID de video de cualquier link de YouTube pegable por un usuario:
 * watch?v=, youtu.be/, /embed/ y /shorts/. Devuelve null si no matchea nada.
 */
export function extractYoutubeId(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }

      const match = parsed.pathname.match(/^\/(embed|shorts)\/([^/?]+)/);
      if (match) return match[2];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Busca el título público de un video de YouTube usando el endpoint oEmbed
 * (no requiere API key). Devuelve null si el video no existe, falla la red,
 * o se aborta por el `signal` (por ejemplo, por un timeout externo).
 */
export async function fetchYoutubeTitle(videoId, signal) {
  if (!videoId) return null;

  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const oembedUrl = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watchUrl)}`;
    const response = await fetch(oembedUrl, { signal });

    if (!response.ok) return null;

    const data = await response.json();
    return data?.title?.trim() || null;
  } catch {
    return null;
  }
}
