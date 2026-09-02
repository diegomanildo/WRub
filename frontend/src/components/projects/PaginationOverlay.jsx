import { PAGE_HEIGHT_PX } from "../../utils/pagination";

/**
 * Capa puramente decorativa (pointer-events: none) que se dibuja ENCIMA de
 * `.editor-content` — no necesita medir nada del DOM: los cortes caen
 * siempre a múltiplos fijos de PAGE_HEIGHT_PX (ver utils/pagination.js), le
 * alcanza con `pageCount`.
 *
 * Una línea punteada + etiqueta cada PAGE_HEIGHT_PX, medido desde el borde
 * superior de la hoja (así se corresponde con dónde cortaría una hoja
 * física real). El contenido no se toca, por eso el texto puede quedar
 * cruzando la línea — es la limitación esperada de este modo.
 */
function PaginationOverlay({ pageCount }) {
  if (pageCount <= 1) return null;

  const breaks = Array.from({ length: pageCount - 1 }, (_, i) => i);

  return (
    <div className="pagination-overlay" aria-hidden="true">
      {breaks.map((i) => {
        const top = (i + 1) * PAGE_HEIGHT_PX;
        return (
          <div key={i} className="pagination-cut-line" style={{ top }}>
            <span className="pagination-page-label pagination-page-label-line">
              Página {i + 2}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default PaginationOverlay;
