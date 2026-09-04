import { useRef } from "react";
import { NodeViewWrapper } from "@tiptap/react";

const MIN_WIDTH_PX = 60;

/**
 * NodeView de la imagen: agrega 4 manijas en las esquinas (solo cuando el
 * nodo está seleccionado y el documento es editable) para arrastrar y
 * cambiar el ancho. La altura no se toca: el <img> la calcula solo
 * (height: auto en el CSS), así el arrastre siempre mantiene la proporción
 * original, igual que en Drive/Docs.
 */
export default function ResizableImageView({ node, updateAttributes, selected, editor }) {
  const wrapperRef = useRef(null);

  function startResize(corner, e) {
    e.preventDefault();
    e.stopPropagation();

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const startX = e.clientX;
    const startWidth = node.attrs.width || wrapper.getBoundingClientRect().width;
    // Tope: que la imagen nunca se pase del ancho de la hoja.
    const sheet = wrapper.closest(".ProseMirror");
    const maxWidth = sheet ? sheet.clientWidth : Infinity;
    // Esquinas izquierdas: arrastrar hacia la izquierda agranda la imagen.
    const grows = corner === "ne" || corner === "se" ? 1 : -1;

    function onMove(moveEvent) {
      const delta = (moveEvent.clientX - startX) * grows;
      const newWidth = Math.round(
        Math.min(maxWidth, Math.max(MIN_WIDTH_PX, startWidth + delta))
      );
      updateAttributes({ width: newWidth });
    }

    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const showHandles = selected && editor.isEditable;

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className={`resizable-image ${showHandles ? "is-selected" : ""}`}
      style={node.attrs.width ? { width: `${node.attrs.width}px` } : undefined}
    >
      <img
        className="doc-image"
        src={node.attrs.src}
        alt={node.attrs.alt || undefined}
        title={node.attrs.title || undefined}
        draggable={false}
      />
      {showHandles && (
        <>
          <span className="img-resize-handle handle-nw" onMouseDown={(e) => startResize("nw", e)} />
          <span className="img-resize-handle handle-ne" onMouseDown={(e) => startResize("ne", e)} />
          <span className="img-resize-handle handle-sw" onMouseDown={(e) => startResize("sw", e)} />
          <span className="img-resize-handle handle-se" onMouseDown={(e) => startResize("se", e)} />
        </>
      )}
    </NodeViewWrapper>
  );
}
