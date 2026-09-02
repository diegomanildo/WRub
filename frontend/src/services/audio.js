const API_URL = import.meta.env.VITE_API_URL;

// El backend sirve los archivos subidos desde la raíz (/uploads/...), no
// desde /api, así que hay que sacarle el sufijo /api a la base para armar
// la URL absoluta del audio.
const ASSET_BASE = API_URL.replace(/\/api\/?$/, "");

export async function uploadAudio(file) {
  const formData = new FormData();
  formData.append("audio", file);

  const response = await fetch(`${API_URL}/audio`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || "No se pudo subir el audio");
  }

  return response.json();
}

/** Convierte una ruta relativa guardada en el documento (/uploads/...) en una URL absoluta reproducible. */
export function resolveAudioUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${ASSET_BASE}${url}`;
}
