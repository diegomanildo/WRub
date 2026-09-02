import { useEffect, useState } from "react";
import { PAGE_HEIGHT_PX } from "../../utils/pagination";

/**
 * Cuenta cuántas "hojas" ocupa el contenido actual del editor, para que
 * `PaginationOverlay` sepa cuántas líneas de corte dibujar.
 *
 * Mide `editor.view.dom.scrollHeight` (la altura real del contenido, no la
 * del contenedor con scroll) y la divide por PAGE_HEIGHT_PX.
 *
 * Importante para evitar el "temblor" al recalcular en cada tecla: la
 * medición NO corre sincrónicamente en cada `update` de Tiptap. Se dispara
 * con requestAnimationFrame (deja que el DOM asiente el layout de esa
 * transacción antes de medir) y además se debe evitar setState si el
 * pageCount no cambió — si no, cada update dispara un re-render del
 * overlay, que puede a su vez alterar el layout y retrigger otro ciclo.
 *
 * También se observa el contenedor con ResizeObserver, para capturar
 * cambios de altura que no vienen de un `update` de Tiptap (carga de
 * fuentes, imágenes, cambio de zoom, etc).
 */
export function usePagination(editor) {
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    if (!editor) return;

    let rafId = null;

    function measure() {
      if (rafId !== null) return; // ya hay una medición pendiente, no duplicar
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const dom = editor.view?.dom;
        if (!dom) return;
        const next = Math.max(1, Math.ceil(dom.scrollHeight / PAGE_HEIGHT_PX));
        // Evita setState si no cambió: corta el loop de re-render/reflow
        // que causaba el temblor visual al escribir o pasar de página.
        setPageCount((prev) => (prev === next ? prev : next));
      });
    }

    measure();
    editor.on("update", measure);

    let resizeObserver = null;
    const dom = editor.view?.dom;
    if (dom && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(dom);
    }

    return () => {
      editor.off("update", measure);
      if (rafId !== null) cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
    };
  }, [editor]);

  return { pageCount };
}
