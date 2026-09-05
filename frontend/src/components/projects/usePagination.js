import { useLayoutEffect, useState } from "react";
import {
  PAGE_CONTENT_HEIGHT_PX,
  PAGE_STRIDE_PX,
  SMALL_SCREEN_QUERY,
} from "../../utils/pagination";
import { pageBreaksKey } from "./PageBreaks";

// Los altos son fraccionarios (line-height, zoom del navegador): sin este
// margen de tolerancia un bloque que termina 0.2px "pasado" abriría una hoja
// nueva de más.
const EPSILON_PX = 1;

/**
 * Paginado real del editor: decide en qué bloque corta cada hoja y cuántas
 * hojas hay.
 *
 * Cómo evita el temblor de la versión anterior (que medía `scrollHeight` del
 * editor y dividía por el alto de hoja): eso era circular — insertar un
 * corte cambiaba el alto, el alto cambiaba la cuenta, y la última hoja
 * aparecía y desaparecía sola. Acá la medición usa SOLO datos que no
 * dependen del paginado: el alto de cada bloque y el hueco que lo separa
 * del anterior (ver `measureBlocks`, que descuenta los espaciadores). El layout
 * de las hojas se simula después con esos números, así que medir dos veces
 * seguidas da exactamente el mismo resultado (es idempotente) y el ciclo se
 * corta solo.
 *
 * Además:
 *  - la medición se agenda con requestAnimationFrame (el DOM ya asentó el
 *    layout de la transacción antes de medir);
 *  - no se despacha nada si los cortes no cambiaron;
 *  - no se hace setState si el `pageCount` no cambió.
 */

/**
 * Mide, para cada bloque de primer nivel: su alto y el hueco que lo separa
 * del bloque anterior. Todo en píxeles de hoja real: `getBoundingClientRect`
 * devuelve medidas ya escaladas por el zoom (`scale`), así que se dividen
 * por él. Gracias a eso el paginado da exactamente lo mismo a cualquier
 * zoom — el zoom es solo una lupa, no cambia dónde cortan las hojas.
 *
 * El hueco se saca de las posiciones reales (top del bloque - bottom del
 * anterior), NO del `margin-top` computado: el margen que manda acá lo pone
 * el <p> de adentro del NodeView (reboot de Bootstrap), no el wrapper que
 * ve `getComputedStyle`, así que leerlo daba 12.5px cuando el hueco real es
 * 16px — y con ese error los cortes caían unos píxeles pasados del borde de
 * la hoja.
 *
 * A los huecos se les descuenta el espaciador de corte que pueda haber en
 * el medio (tiene `margin: 0`, así que su único aporte es su alto): así lo
 * que se mide es el hueco "natural", el mismo con o sin paginado. Eso es lo
 * que hace que medir dos veces dé el mismo resultado.
 */
function measureBlocks(view, scale = 1) {
  const positions = [];
  view.state.doc.forEach((node, offset) => positions.push(offset));

  const domTop = view.dom.getBoundingClientRect().top;
  const blocks = [];
  let spacerBefore = 0;
  let prevBottom = 0;

  for (const el of view.dom.children) {
    if (el.classList.contains("page-break-spacer")) {
      spacerBefore += el.getBoundingClientRect().height / scale;
      continue;
    }

    const rect = el.getBoundingClientRect();
    // Ojo: TODO lo que sale de getBoundingClientRect va dividido por `scale`,
    // incluido lo que se acumula en `prevBottom`. Mezclar un alto sin dividir
    // acá hacía que el hueco siguiente diera negativo (y quedara en 0), y con
    // huecos en 0 el paginado se iba al descuido apenas se tocaba el zoom.
    const height = rect.height / scale;
    const top = (rect.top - domTop) / scale;
    blocks.push({
      pos: positions[blocks.length] ?? 0,
      height,
      gapBefore: Math.max(0, top - prevBottom - spacerBefore),
    });
    prevBottom = top + height;
    spacerBefore = 0;
  }

  // El DOM todavía no refleja el documento (una transacción a medio aplicar):
  // no se mide con datos desparejos, se espera al próximo frame.
  if (blocks.length !== positions.length) return null;

  return blocks;
}

/**
 * Simula el flujo del documento hoja por hoja y devuelve dónde hay que
 * cortar. Todas las coordenadas son "y" desde el primer renglón de la hoja
 * 1 (ver el diagrama de utils/pagination.js).
 *
 * El corte es a nivel bloque: un párrafo nunca se parte por la mitad, se va
 * entero a la hoja siguiente (igual que Word/Docs con "conservar líneas
 * juntas"). Un bloque más alto que una hoja entera (una imagen grande) es el
 * único caso que se deja desbordar, porque partirlo no es posible sin tocar
 * el contenido.
 */
export function computeLayout(blocks) {
  const breaks = [];
  let pageStart = 0; // y donde arranca el texto de la hoja actual
  let flowBottom = 0; // y donde terminó el bloque anterior

  blocks.forEach((block, i) => {
    const gap = block.gapBefore;
    let top = flowBottom + gap;
    let target = null;

    if (top < pageStart) {
      // Venimos de un bloque gigante que desbordó: hay que reengancharse
      // con el comienzo de la hoja en la que quedamos parados.
      target = pageStart;
    } else if (i > 0 && top + block.height > pageStart + PAGE_CONTENT_HEIGHT_PX + EPSILON_PX) {
      // No entra en lo que queda de hoja: se va entero a la siguiente.
      target = pageStart + PAGE_STRIDE_PX;
    }

    if (target !== null) {
      // El espaciador tiene que dejar al bloque arrancando justo en
      // `target`; el hueco natural del bloque sigue aplicando después del
      // espaciador, así que se lo resta.
      const spacer = target - flowBottom - gap;
      if (spacer > 0) {
        breaks.push({ pos: block.pos, height: Math.round(spacer) });
        pageStart = target;
        top = target;
      }
    }

    flowBottom = top + block.height;

    // Bloque más alto que la hoja: se abren las hojas que haga falta para
    // que el contenido de abajo siga cayendo donde corresponde.
    while (flowBottom > pageStart + PAGE_CONTENT_HEIGHT_PX + EPSILON_PX) {
      pageStart += PAGE_STRIDE_PX;
    }
  });

  return { breaks, pageCount: Math.round(pageStart / PAGE_STRIDE_PX) + 1 };
}

/** Clave estable para comparar dos conjuntos de cortes sin recorrerlos a mano. */
function breaksKey(breaks) {
  return breaks.map((b) => `${b.pos}:${b.height}`).join("|");
}

export function usePagination(editor, scale = 1) {
  const [pageCount, setPageCount] = useState(1);

  // useLayoutEffect y no useEffect: la primera medición tiene que correr
  // ANTES del primer pintado. Con useEffect (o esperando un
  // requestAnimationFrame) el navegador alcanzaba a dibujar un frame sin
  // paginar — una sola hoja con todo el documento encima — y se veía el
  // texto flotando sobre el gris hasta que llegaba la medición. Se notaba
  // sobre todo en la vista de solo lectura del link compartido, donde no
  // hay tecleo que dispare una corrección enseguida.
  useLayoutEffect(() => {
    if (!editor) return;

    const smallScreen = window.matchMedia(SMALL_SCREEN_QUERY);
    let rafId = null;
    let timerId = null;
    let pending = false;
    let dirty = false; // llegó un pedido mientras había una medición en vuelo
    let lastKey = null;
    let cancelled = false;

    function applyLayout() {
      if (cancelled || editor.isDestroyed) return;

      const view = editor.view;
      if (!view?.dom?.isConnected) return;

      // En pantallas chicas la hoja no entra y el CSS muestra el documento
      // como un bloque continuo: ahí no hay nada que paginar y los
      // espaciadores serían huecos sin explicación.
      let breaks = [];
      let nextCount = 1;

      if (!smallScreen.matches) {
        const blocks = measureBlocks(view, scale);
        if (!blocks) {
          // DOM y documento desparejos: reintentar en el próximo frame.
          schedule();
          return;
        }

        const layout = computeLayout(blocks);
        breaks = layout.breaks;
        nextCount = layout.pageCount;
      }

      const key = breaksKey(breaks);
      if (key !== lastKey) {
        lastKey = key;
        const tr = view.state.tr.setMeta(pageBreaksKey, breaks);
        tr.setMeta("addToHistory", false);
        view.dispatch(tr);
      }

      // Sin este chequeo cada tecla re-renderiza el fondo de hojas, y ese
      // re-render puede volver a disparar la medición: el loop que hacía
      // "temblar" la última hoja.
      setPageCount((prev) => (prev === nextCount ? prev : nextCount));
    }

    // Agenda una medición para el próximo frame (deja que el DOM asiente el
    // layout antes de medir). Si ya hay una en vuelo no se pierde el pedido:
    // queda marcado en `dirty` y se vuelve a medir apenas termina. Antes se
    // descartaba, y un cambio de alto que llegara en ese hueco (los
    // NodeViews de React montándose, una imagen cargando) quedaba sin
    // repaginar.
    //
    // Va contra un requestAnimationFrame Y un setTimeout, y gana el que
    // llegue primero: en una pestaña en segundo plano el navegador no corre
    // rAF (ni entrega ResizeObserver), así que sin el timeout el documento
    // se quedaba con la medición del primer pase — la que se toma antes de
    // que los NodeViews de React hayan pintado su contenido, con los altos
    // todavía en cero.
    function schedule() {
      if (pending) {
        dirty = true;
        return;
      }

      pending = true;

      const run = () => {
        if (!pending) return;
        pending = false;
        cancelAnimationFrame(rafId);
        clearTimeout(timerId);

        const again = dirty;
        dirty = false;
        applyLayout();
        // `applyLayout` es idempotente: este segundo pase se estabiliza y no
        // vuelve a agendar salvo que algo haya cambiado de verdad.
        if (again) schedule();
      };

      rafId = requestAnimationFrame(run);
      timerId = setTimeout(run, 120);
    }

    // Primer pase antes del pintado (ver el comentario del useLayoutEffect)
    // y segundo pase con el layout ya asentado: en el primero los NodeViews
    // de React todavía pueden no haber pintado su contenido.
    applyLayout();
    schedule();

    editor.on("update", schedule);
    smallScreen.addEventListener("change", schedule);
    window.addEventListener("resize", schedule);
    // Volver a una pestaña en segundo plano: mientras estuvo oculta el
    // navegador no corre requestAnimationFrame, así que puede haber quedado
    // una medición pendiente.
    document.addEventListener("visibilitychange", schedule);
    // Las fuentes cambian el alto de cada renglón cuando terminan de cargar.
    document.fonts?.ready?.then(schedule).catch(() => {});

    // Cambios de alto que no vienen de una edición: imágenes que terminan de
    // cargar, el contenido nuevo que empuja el sondeo del link compartido,
    // cambio de zoom o de ancho de ventana.
    let resizeObserver = null;
    const dom = editor.view?.dom;
    if (dom && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(schedule);
      resizeObserver.observe(dom);
    }

    return () => {
      cancelled = true;
      editor.off("update", schedule);
      smallScreen.removeEventListener("change", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      resizeObserver?.disconnect();
    };
    // `scale` entra en las deps porque las mediciones se dividen por él:
    // al cambiar el zoom hay que volver a medir con el valor nuevo.
  }, [editor, scale]);

  return { pageCount };
}
