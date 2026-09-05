const path = require("path");
const fs = require("fs");

const UPLOADS_ROOT = path.join(__dirname, "../../uploads");

// Rutas /uploads/... que aparecen en el HTML del documento: `src` de las
// imágenes (ResizableImage) y `data-music-src` de los párrafos con música
// (MusicParagraph). La música de YouTube guarda una URL externa, que no
// matchea y por lo tanto se ignora sola.
const UPLOAD_REF_PATTERN = /(?:src|data-music-src)="(\/uploads\/[^"]+)"/g;

function extractUploadPaths(content) {
  if (!content) return new Set();

  const paths = new Set();

  for (const match of content.matchAll(UPLOAD_REF_PATTERN)) {
    paths.add(match[1]);
  }

  return paths;
}

/**
 * Traduce una ruta pública (/uploads/images/x.jpg) al archivo real, o
 * devuelve null si se escapa de la carpeta de uploads. El content viene de
 * la DB, no de un input directo, pero igual se valida: sin este chequeo un
 * `src="/uploads/../../algo"` guardado en un documento haría que borrar el
 * proyecto borre archivos de cualquier parte del disco.
 */
function resolveUploadPath(publicPath) {
  const relative = publicPath.replace(/^\/uploads\//, "");
  const absolute = path.resolve(UPLOADS_ROOT, relative);

  if (absolute !== UPLOADS_ROOT && !absolute.startsWith(UPLOADS_ROOT + path.sep)) {
    return null;
  }

  return absolute;
}

/**
 * Borra los archivos subidos que solo usaba este contenido.
 *
 * `otherContents` son los documentos que siguen existiendo: un archivo
 * referenciado por alguno de ellos no se toca. Hace falta porque copiar y
 * pegar una imagen (o un párrafo con música) entre dos documentos duplica
 * la referencia pero no el archivo — borrar el proyecto original dejaría
 * la imagen rota en el otro.
 *
 * Nunca lanza: si un archivo ya no está o el borrado falla, se loguea y se
 * sigue. Es limpieza de disco, no puede tumbar el DELETE del proyecto.
 */
function removeUnreferencedUploads(content, otherContents) {
  const candidates = extractUploadPaths(content);

  if (candidates.size === 0) return;

  const stillReferenced = new Set();

  for (const other of otherContents) {
    for (const uploadPath of extractUploadPaths(other)) {
      stillReferenced.add(uploadPath);
    }
  }

  for (const publicPath of candidates) {
    if (stillReferenced.has(publicPath)) continue;

    const absolute = resolveUploadPath(publicPath);
    if (!absolute) continue;

    try {
      fs.rmSync(absolute, { force: true });
    } catch (error) {
      console.error(`No se pudo borrar el archivo subido ${publicPath}:`, error);
    }
  }
}

module.exports = {
  removeUnreferencedUploads,
};
