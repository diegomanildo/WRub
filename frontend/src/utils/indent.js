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
