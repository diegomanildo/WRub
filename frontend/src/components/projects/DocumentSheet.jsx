import { EditorContent } from "@tiptap/react";
import { usePagination } from "./usePagination";
import {
  documentHeightPx,
  PAGE_STRIDE_PX,
  PAGE_WIDTH_PX,
} from "../../utils/pagination";

/**
 * La pila de hojas del documento. Lo usan tanto la vista de edición
 * (`DocumentEditor`) como la de solo lectura del link compartido
 * (`SharedProject`), así el documento se ve exactamente igual en las dos.
 *
 * Son dos capas superpuestas:
 *  1. `.page-backdrop`: una hoja de papel (blanca, con borde y sombra) por
 *     página, apiladas cada PAGE_STRIDE_PX. Es puro fondo, sin contenido y
 *     sin eventos.
 *  2. `.editor-content`: el contenido, transparente y con el mismo ancho,
 *     encima. `usePagination` le inserta espaciadores para que el texto
 *     nunca caiga en el gris que hay entre dos hojas.
 *
 * El alto total viaja como custom property `--doc-height` en vez de un
 * `style` en `<EditorContent>` (que no reenvía props arbitrarias al div del
 * editor) — el CSS lo usa como min-height del contenido y del fondo.
 *
 * El zoom (`scale`) es un `transform` sobre la pila entera, con un marco de
 * afuera del tamaño ya escalado: el transform no ocupa lugar en el layout,
 * así que sin ese marco el scroll y el centrado quedarían calculados sobre
 * el tamaño sin escalar. Adentro del marco todo se sigue midiendo en
 * píxeles de hoja real (816 x 1056), incluido el paginado.
 */
export default function DocumentSheet({ editor, scale = 1, readOnly = false }) {
  const { pageCount } = usePagination(editor, scale);
  const height = documentHeightPx(pageCount);

  return (
    <div
      className="editor-zoom"
      style={{ width: PAGE_WIDTH_PX * scale, height: height * scale }}
    >
      <div
        className="editor-page-wrap"
        style={{ "--doc-height": `${height}px`, transform: `scale(${scale})` }}
      >
        <div className="page-backdrop" aria-hidden="true">
          {Array.from({ length: pageCount }, (_, i) => (
            <div key={i} className="page-sheet" style={{ top: i * PAGE_STRIDE_PX }}>
              <span className="page-sheet-number">{i + 1}</span>
            </div>
          ))}
        </div>
        <EditorContent
          editor={editor}
          className={`editor-content${readOnly ? " editor-content-readonly" : ""}`}
        />
      </div>
    </div>
  );
}
