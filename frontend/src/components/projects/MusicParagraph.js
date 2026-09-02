import Paragraph from "@tiptap/extension-paragraph";
import { ReactNodeViewRenderer } from "@tiptap/react";
import MusicParagraphView from "./MusicParagraphView";
import { INDENT_STEP_PX, MAX_INDENT_LEVEL } from "../../utils/indent";

/**
 * Paragraph con atributos de música: asocia una canción (YouTube o archivo
 * subido) a un párrafo puntual. Los atributos se persisten como data-* en
 * el HTML del documento (columna `content`), no hace falta tabla nueva.
 * También agrega sangría de párrafo (Tab / Shift+Tab, ver abajo).
 */
const MusicParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      musicType: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-music-type"),
        renderHTML: (attrs) =>
          attrs.musicType ? { "data-music-type": attrs.musicType } : {},
      },
      musicSrc: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-music-src"),
        renderHTML: (attrs) =>
          attrs.musicSrc ? { "data-music-src": attrs.musicSrc } : {},
      },
      musicTitle: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-music-title"),
        renderHTML: (attrs) =>
          attrs.musicTitle ? { "data-music-title": attrs.musicTitle } : {},
      },
      // Nivel de sangría del párrafo (0 = sin sangría). Se persiste como
      // data-indent + un margin-left inline, así el HTML guardado ya trae
      // el estilo aplicado (útil también para la futura exportación a PDF).
      indent: {
        default: 0,
        parseHTML: (el) => {
          const value = parseInt(el.getAttribute("data-indent"), 10);
          return Number.isFinite(value) && value > 0 ? value : 0;
        },
        renderHTML: (attrs) => {
          if (!attrs.indent) return {};
          return {
            "data-indent": attrs.indent,
            style: `margin-left: ${attrs.indent * INDENT_STEP_PX}px`,
          };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MusicParagraphView);
  },

  // Por default, ProseMirror copia los atributos del nodo al partirlo con
  // Enter: un párrafo con música pasaba esa música a todos los párrafos
  // siguientes que se creaban a partir de él. Acá se pisa el Enter solo
  // cuando el párrafo actual tiene música asociada: se hace el split de
  // siempre y después se limpian los atributos de música en el párrafo
  // nuevo (donde queda el cursor), para que la canción se quede únicamente
  // en el párrafo original.
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        if (!this.editor.isActive(this.name)) {
          return false;
        }

        const { musicType } = this.editor.getAttributes(this.name);
        if (!musicType) {
          return false;
        }

        return this.editor
          .chain()
          .splitBlock()
          .updateAttributes(this.name, {
            musicType: null,
            musicSrc: null,
            musicTitle: null,
          })
          .run();
      },

      // Sangría de párrafo: Tab la aumenta, Shift+Tab la disminuye. Se
      // "traga" la tecla siempre que el cursor esté en un párrafo (devuelve
      // true igual cuando ya se llegó al tope/piso) para que el foco nunca
      // se escape del editor hacia el siguiente elemento de la página, que
      // es el comportamiento por default del navegador y lo que hacía
      // parecer que el tabulado "no funcionaba".
      Tab: () => {
        if (!this.editor.isActive(this.name)) {
          return false;
        }

        const { indent = 0 } = this.editor.getAttributes(this.name);
        if (indent >= MAX_INDENT_LEVEL) {
          return true;
        }

        return this.editor
          .chain()
          .focus()
          .updateAttributes(this.name, { indent: indent + 1 })
          .run();
      },

      "Shift-Tab": () => {
        if (!this.editor.isActive(this.name)) {
          return false;
        }

        const { indent = 0 } = this.editor.getAttributes(this.name);
        if (indent <= 0) {
          return true;
        }

        return this.editor
          .chain()
          .focus()
          .updateAttributes(this.name, { indent: indent - 1 })
          .run();
      },

      // Backspace al principio de un párrafo con sangría: primero saca un
      // nivel de sangría (como Word/Docs), recién en el próximo Backspace
      // (ya sin sangría) borra/junta con el párrafo anterior como siempre.
      // Si hay selección, el cursor no está al principio del párrafo, o no
      // hay sangría, se deja pasar el Backspace normal (return false).
      Backspace: () => {
        if (!this.editor.isActive(this.name)) {
          return false;
        }

        const { empty, $from } = this.editor.state.selection;
        if (!empty || $from.parentOffset !== 0) {
          return false;
        }

        const { indent = 0 } = this.editor.getAttributes(this.name);
        if (indent <= 0) {
          return false;
        }

        return this.editor
          .chain()
          .focus()
          .updateAttributes(this.name, { indent: indent - 1 })
          .run();
      },
    };
  },
});

export default MusicParagraph;
