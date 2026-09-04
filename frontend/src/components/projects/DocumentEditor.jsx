import { EditorContent } from "@tiptap/react";
import { createPortal } from "react-dom";
import Toolbar from "./Toolbar";
import { useDocumentEditor } from "./useDocumentEditor";
import { usePagination } from "./usePagination";
import PaginationOverlay from "./PaginationOverlay";

/**
 * Crea el editor y renderiza la hoja (`EditorContent`) acá mismo, pero la
 * toolbar se "teletransporta" con un portal al `toolbarSlot` que le pasa el
 * padre (un <div> en el header del documento, junto al título). Todo vive
 * en el mismo componente para que la instancia de `editor` sea una sola,
 * sin necesidad de levantarla a un estado en el padre — eso fue lo que
 * rompía la edición: el estado levantado quedaba desincronizado / en null
 * y la toolbar no llegaba a aparecer.
 *
 * El cálculo de cuántas hojas "entrarían" (`usePagination`) también vive
 * acá, por el mismo motivo: un solo dueño. `PaginationOverlay` dibuja el
 * resultado (líneas de corte) encima de la hoja.
 */
export default function DocumentEditor({ content, onSave, onDirty, placeholder, toolbarSlot, saveNowRef }) {
  const editor = useDocumentEditor({ content, onSave, onDirty, placeholder, saveNowRef });
  const { pageCount } = usePagination(editor);

  return (
    <>
      {toolbarSlot
        ? createPortal(<Toolbar editor={editor} />, toolbarSlot)
        : null}
      <div className="editor-page-wrap">
        <EditorContent editor={editor} className="editor-content" />
        <PaginationOverlay pageCount={pageCount} />
      </div>
    </>
  );
}
