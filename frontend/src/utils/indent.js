/**
 * Configuración compartida de la sangría de párrafo (Tab / Shift+Tab en el
 * editor). Vive en su propio archivo para que la extensión de Tiptap
 * (MusicParagraph.js) y su NodeView (MusicParagraphView.jsx) usen el mismo
 * valor sin generar un import circular entre ambos.
 */

// Cuánto se corre el párrafo por cada nivel de sangría.
export const INDENT_STEP_PX = 40;

// Tope de niveles: evita que alguien deje "Tab" apretado y el párrafo se
// vaya de la hoja.
export const MAX_INDENT_LEVEL = 8;

// Cuánto vale 1 unidad CSS en píxeles. Google Docs (y Word) exportan la
// sangría en puntos (`margin-left: 36pt`), no en px, así que hay que
// convertir. em/rem se aproximan con el tamaño base del navegador: la
// sangría se redondea a niveles igual, no hace falta ser exactos.
const CSS_UNIT_TO_PX = {
  px: 1,
  pt: 96 / 72,
  pc: 16,
  in: 96,
  cm: 96 / 2.54,
  mm: 96 / 25.4,
  em: 16,
  rem: 16,
};

// Convierte una longitud CSS ("36pt", "1.5cm", "48px") a px. Devuelve 0 si
// está vacía o usa una unidad que no se puede resolver sin el layout (%).
export function cssLengthToPx(value) {
  if (!value) return 0;

  const match = String(value).trim().match(/^(-?[\d.]+)\s*([a-z%]*)$/i);
  if (!match) return 0;

  const amount = parseFloat(match[1]);
  if (!Number.isFinite(amount)) return 0;

  const factor = CSS_UNIT_TO_PX[(match[2] || "px").toLowerCase()];
  return factor ? amount * factor : 0;
}

// Sangrías muy chicas (los márgenes de 1-2px que mete cualquier editor) no
// son sangría de verdad: por debajo de un cuarto de paso se ignoran.
const MIN_INDENT_PX = INDENT_STEP_PX / 4;

// px -> nivel de sangría. Redondea al nivel más cercano, pero nunca a 0 si
// había sangría real: 36pt (48px, la sangría de Docs) cae en el nivel 1.
export function indentLevelFromPx(px) {
  if (!Number.isFinite(px) || px < MIN_INDENT_PX) return 0;
  return Math.min(Math.max(Math.round(px / INDENT_STEP_PX), 1), MAX_INDENT_LEVEL);
}

/**
 * Nivel de sangría de un elemento pegado. Primero `data-indent` (HTML
 * nuestro, ida y vuelta exacta) y si no está, el estilo inline que traen
 * Google Docs / Word / cualquier otro editor.
 */
export function parseIndentLevel(el) {
  const own = parseInt(el.getAttribute("data-indent"), 10);
  if (Number.isFinite(own)) {
    return own > 0 ? Math.min(own, MAX_INDENT_LEVEL) : 0;
  }

  const px = cssLengthToPx(el.style?.marginLeft) || cssLengthToPx(el.style?.paddingLeft);
  return indentLevelFromPx(px);
}

// Tope de la sangría de primera línea, para que un valor raro del portapapeles
// no empuje el texto fuera de la hoja.
const MAX_FIRST_LINE_INDENT_PX = INDENT_STEP_PX * MAX_INDENT_LEVEL;

/**
 * Sangría de primera línea (`text-indent`) en px. A diferencia del nivel de
 * sangría se guarda el valor tal cual porque puede ser negativo: así es como
 * Docs escribe la sangría francesa (margin-left positivo + text-indent
 * negativo), y redondearla a niveles la rompería.
 */
export function parseFirstLineIndentPx(el) {
  const own = parseFloat(el.getAttribute("data-first-line-indent"));
  const px = Number.isFinite(own) ? own : cssLengthToPx(el.style?.textIndent);

  if (!Number.isFinite(px) || Math.abs(px) < MIN_INDENT_PX) return 0;

  return Math.round(
    Math.min(Math.max(px, -MAX_FIRST_LINE_INDENT_PX), MAX_FIRST_LINE_INDENT_PX),
  );
}
