import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export const pageBreaksKey = new PluginKey("pageBreaks");

/**
 * Extensión "tonta" a propósito: NO mide nada, solo guarda la lista de
 * cortes que le manda `usePagination` (vía meta de una transacción) y la
 * dibuja como widgets de decoración.
 *
 * Cada corte es `{ pos, height }`: un <div> vacío insertado justo antes del
 * bloque `pos`, de `height` px, que empuja ese bloque al comienzo de la hoja
 * siguiente. Al ser una decoración no toca el documento — no ensucia el
 * HTML que se guarda, ni el historial de undo, ni dispara el autoguardado.
 *
 * Quién mide y quién dibuja está separado (mismo criterio que el resto del
 * editor: un solo dueño de cada cosa) porque la medición necesita el layout
 * ya asentado y React, y esto necesita el ciclo de ProseMirror.
 */
function buildDecorations(doc, breaks) {
  if (!breaks.length) return DecorationSet.empty;

  const decorations = breaks
    .filter((brk) => brk.pos >= 0 && brk.pos <= doc.content.size)
    .map((brk) =>
      Decoration.widget(
        brk.pos,
        () => {
          const el = document.createElement("div");
          el.className = "page-break-spacer";
          el.style.height = `${brk.height}px`;
          el.setAttribute("aria-hidden", "true");
          el.contentEditable = "false";
          return el;
        },
        {
          // side -1: el espaciador va ANTES del bloque, no después del
          // anterior (importante si los dos comparten posición).
          side: -1,
          // La key incluye el alto para que ProseMirror recree el widget
          // cuando el corte se mueve, en vez de reusar el <div> viejo.
          key: `page-break-${brk.pos}-${brk.height}`,
          ignoreSelection: true,
        },
      ),
    );

  return DecorationSet.create(doc, decorations);
}

export const PageBreaks = Extension.create({
  name: "pageBreaks",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: pageBreaksKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const breaks = tr.getMeta(pageBreaksKey);
            if (breaks) return buildDecorations(tr.doc, breaks);
            // Mientras no llegue una medición nueva, se mapean los cortes
            // vigentes sobre el documento nuevo: así al tipear no
            // desaparecen y vuelven a aparecer (eso era parte del
            // "temblor"), simplemente se corrigen en el próximo frame.
            return old.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return pageBreaksKey.getState(state);
          },
        },
      }),
    ];
  },
});

export default PageBreaks;
