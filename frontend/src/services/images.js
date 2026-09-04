const API_URL = import.meta.env.VITE_API_URL;

// El backend sirve los archivos subidos desde la raíz (/uploads/...), no
// desde /api, así que hay que sacarle el sufijo /api a la base para armar
// la URL absoluta de la imagen.
const ASSET_BASE = API_URL.replace(/\/api\/?$/, "");

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_URL}/images`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || "No se pudo subir la imagen");
  }

  return response.json();
}

/** Convierte una ruta relativa (/uploads/...) en una URL absoluta mostrable. */
export function resolveImageUrl(url) {
  if (!url) return url;
  if (/^https?:\/\/|^data:/i.test(url)) return url;
  return `${ASSET_BASE}${url}`;
}
