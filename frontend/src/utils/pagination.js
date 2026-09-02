/**
 * Medidas del paginado visual del editor (modo "líneas de corte", el único
 * que queda). Coherente con la "hoja" carta de `.editor-content` en
 * index.css (max-width 816px, min-height 1056px = 11in a 96dpi).
 *
 * El contenido no se toca: solo se dibuja una línea punteada cada
 * PAGE_HEIGHT_PX (ver PaginationOverlay.jsx / usePagination.js), así que el
 * texto puede quedar cruzando la línea — es la limitación esperada y
 * aceptada de este modo, mucho más simple y estable que empujar contenido.
 */
export const PAGE_HEIGHT_PX = 1056; // 11in a 96dpi
