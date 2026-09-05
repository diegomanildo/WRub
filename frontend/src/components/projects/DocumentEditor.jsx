import { createPortal } from "react-dom";
import Toolbar from "./Toolbar";
import { useDocumentEditor } from "./useDocumentEditor";
import DocumentSheet from "./DocumentSheet";
import DocumentStats from "./DocumentStats";
import { useZoom } from "../../hooks/useZoom";

/**
 * Crea el editor y renderiza la hoja (`EditorContent`) acá mismo, pero la
 * toolbar se "teletransporta" con un portal al `toolbarSlot` que le pasa el
 * padre (un <div> en el header del documento, junto al título). Todo vive
 * en el mismo componente para que la instancia de `editor` sea una sola,
 * sin necesidad de levantarla a un estado en el padre — eso fue lo que
 * rompía la edición: el estado levantado quedaba desincronizado / en null
 * y la toolbar no llegaba a aparecer.
 *
 * La hoja en sí (y el paginado, que necesita la misma instancia de
 * `editor`) la dibuja `DocumentSheet`, compartido con la vista de solo
 * lectura del link para compartir.
 *
 * El zoom vive acá por el mismo motivo que la toolbar y el contador: lo
 * necesitan dos hijos que están en ramas distintas del árbol (el selector,
 * portado al header; la hoja, más abajo), así que el dueño tiene que ser el
 * ancestro común. Es solo visual: escala la hoja, no cambia el documento ni
 * el paginado (ver `usePagination`).
 */
export default function DocumentEditor({ content, onSave, onDirty, placeholder, toolbarSlot, statsSlot, saveNowRef }) {
  const editor = useDocumentEditor({ content, onSave, onDirty, placeholder, saveNowRef });
  const { zoom, scale, setZoom, step } = useZoom();

  return (
    <>
      {toolbarSlot
        ? createPortal(
            <Toolbar
              editor={editor}
              zoom={zoom}
              onZoomChange={setZoom}
              onZoomStep={step}
            />,
            toolbarSlot,
          )
        : null}
      {/* El contador se porta al header por el mismo motivo que la toolbar:
          necesita `editor` y no tiene sentido levantarlo al padre. */}
      {statsSlot ? createPortal(<DocumentStats editor={editor} />, statsSlot) : null}
      <DocumentSheet editor={editor} scale={scale} />
    </>
  );
}
