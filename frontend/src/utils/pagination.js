/**
 * Medidas del paginado del editor. Coherentes con la "hoja" carta de
 * `.editor-content` (styles/editor-sheet.css): 816px de ancho (8.5in a
 * 96dpi), 1056px de alto (11in) y 72px de padding vertical.
 *
 * A diferencia de la versión anterior (una línea punteada dibujada encima
 * del contenido), acá el paginado es real: `usePagination` mide los bloques
 * y `PageBreaks` inserta un espaciador antes del bloque que no entra, de
 * forma que el contenido arranca limpio en la hoja siguiente. El fondo
 * (`DocumentSheet`) dibuja una hoja por página, separadas por PAGE_GAP_PX.
 *
 *   ┌──────────┐  <- top de la hoja i          = i * PAGE_STRIDE_PX
 *   │  padding │  72px
 *   │  texto   │  PAGE_CONTENT_HEIGHT_PX
 *   │  padding │  72px
 *   └──────────┘
 *      gap        PAGE_GAP_PX
 *   ┌──────────┐  <- top de la hoja i+1
 *
 * En coordenadas del contenido (y = 0 en el primer renglón de la hoja 1) la
 * caja de texto de la hoja i va de `i * PAGE_STRIDE_PX` a
 * `i * PAGE_STRIDE_PX + PAGE_CONTENT_HEIGHT_PX`, y el espaciador que hay
 * que insertar entre dos hojas mide PAGE_BREAK_GAP_PX (padding de abajo +
 * gap + padding de arriba).
 */
export const PAGE_WIDTH_PX = 816; // 8.5in a 96dpi
export const PAGE_HEIGHT_PX = 1056; // 11in a 96dpi
export const PAGE_PADDING_Y_PX = 72;
export const PAGE_GAP_PX = 24; // separación gris entre hoja y hoja

/** Alto útil de texto de una hoja. */
export const PAGE_CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - PAGE_PADDING_Y_PX * 2;

/** Salto de una hoja a la siguiente (top de hoja i -> top de hoja i+1). */
export const PAGE_STRIDE_PX = PAGE_HEIGHT_PX + PAGE_GAP_PX;

/** Alto del espaciador que "salta" el borde de dos hojas. */
export const PAGE_BREAK_GAP_PX = PAGE_PADDING_Y_PX * 2 + PAGE_GAP_PX;

/**
 * Debajo de este ancho la hoja no entra en pantalla: el CSS muestra el
 * documento como un bloque continuo (sin hojas ni gaps) y `usePagination`
 * apaga los cortes. Tiene que coincidir con los @media de
 * styles/editor-sheet.css y styles/pagination.css.
 */
export const SMALL_SCREEN_QUERY = "(max-width: 720px)";

/** Alto total de N hojas apiladas, incluyendo los gaps intermedios. */
export function documentHeightPx(pageCount) {
  return pageCount * PAGE_HEIGHT_PX + Math.max(0, pageCount - 1) * PAGE_GAP_PX;
}
