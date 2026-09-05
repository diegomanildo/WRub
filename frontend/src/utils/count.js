/**
 * Palabras y caracteres del documento, para el contador de la barra.
 *
 * Se cuenta sobre el texto plano del editor, no sobre el HTML. Los saltos
 * de bloque se separan con un espacio antes de contar: en `getText()` de
 * Tiptap dos párrafos seguidos vienen pegados con "\n\n", y sin normalizar
 * eso el último palabra de un párrafo y la primera del siguiente contarían
 * como una sola.
 */
export function countText(text) {
  const normalized = (text || "").replace(/\s+/g, " ").trim();

  return {
    words: normalized === "" ? 0 : normalized.split(" ").length,
    // Con espacios, como Word y Google Docs.
    characters: normalized.length,
    // Sin espacios: es el número que piden las consignas con límite de
    // caracteres, y no coincide con el anterior.
    charactersNoSpaces: normalized.replace(/\s/g, "").length,
  };
}
