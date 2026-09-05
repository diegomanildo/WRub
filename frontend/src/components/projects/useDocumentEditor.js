import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle, Color, FontFamily, FontSize } from "@tiptap/extension-text-style";
import { useEffect, useRef } from "react";
import MusicParagraph from "./MusicParagraph";
import ResizableImage from "./ResizableImage";
import PageBreaks from "./PageBreaks";

/**
 * Crea el editor Tiptap del documento + autoguardado. Se separó de la UI
 * (Toolbar / EditorContent) para poder renderizar la toolbar en el header
 * del documento (junto al título) y el contenido más abajo, compartiendo
 * la misma instancia de `editor`.
 *
 * `editable = false` es lo que usa la vista de solo lectura (link para
 * compartir, `pages/SharedProject.jsx`): mismo hook, mismas extensiones
 * (así el marcador de música con su NodeView funciona igual), pero sin
 * poder tocar el contenido. Con `editable: false` no hace falta apagar el
 * autoguardado/Ctrl+S a mano: Tiptap no dispara `onUpdate` porque no hay
 * transacciones que editen el doc, así que `onSave`/`onDirty` simplemente
 * nunca se llaman.
 */
export function useDocumentEditor({
  content,
  onSave,
  onDirty,
  placeholder,
  editable = true,
  saveNowRef,
}) {
  const saveTimeout = useRef(null);
  const onSaveRef = useRef(onSave);
  const onDirtyRef = useRef(onDirty);
  const pendingHtmlRef = useRef(null); // último HTML sin guardar
  // ¿El documento tuvo contenido alguna vez en esta sesión? Arranca en true
  // si se creó con contenido. Ver el guard de `onUpdate`.
  const hadContentRef = useRef(Boolean(content && content.trim() !== ""));

  useEffect(() => {
    onSaveRef.current = onSave;
    onDirtyRef.current = onDirty;
  }, [onSave, onDirty]);

  const editor = useEditor(
    {
      // false rompía el primer render: la toolbar quedaba vacía hasta el
      // primer click en la hoja (algo forzaba el re-render recién ahí). Esta
      // app es 100% cliente (Vite, sin SSR), así que no hace falta diferirlo.
      immediatelyRender: true,
      editable,
      extensions: [
        // StarterKit v3 ya incluye Underline: importarlo aparte genera
        // "Duplicate extension names" y rompe el botón de subrayado.
        // El paragraph por defecto se apaga acá porque lo reemplaza
        // MusicParagraph (mismo nodo "paragraph", con atributos de música).
        StarterKit.configure({ paragraph: false }),
        MusicParagraph,
        // TextStyle es la marca sobre la que Color y FontFamily escriben sus
        // atributos: ninguna de las dos la registra por su cuenta.
        TextStyle,
        Color,
        FontFamily,
        FontSize,
        ResizableImage.configure({ inline: false, HTMLAttributes: { class: "doc-image" } }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        // Dibuja los cortes de página que calcula `usePagination`. No toca
        // el documento (son decoraciones), así que el HTML que se guarda es
        // el mismo con o sin paginado.
        PageBreaks,
        Placeholder.configure({
          placeholder: placeholder || "Empezá a escribir...",
        }),
      ],
      content: content || "",
      editorProps: {
        attributes: {
          role: "textbox",
          "aria-multiline": "true",
          "aria-label": "Contenido del documento",
        },
      },
      onUpdate: ({ editor }) => {
        if (!editor.isEmpty) hadContentRef.current = true;

        // Red de seguridad contra la pérdida de datos: si el editor está
        // vacío y NUNCA tuvo contenido en esta sesión, lo que hay en pantalla
        // no es "el usuario borró todo" sino un editor que se montó sin el
        // documento (contenido que no llegó, un remonte raro del componente).
        // Guardarlo pisaría el documento entero con un <p></p>. Borrar todo a
        // mano sí se guarda: ahí el documento tuvo contenido antes.
        if (editor.isEmpty && !hadContentRef.current) return;

        const html = editor.getHTML();
        pendingHtmlRef.current = html;
        onDirtyRef.current?.();

        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
          onSaveRef.current?.(html);
          pendingHtmlRef.current = null;
        }, 1200);
      },
    },
    [editable],
  );

  // Guardado inmediato: salta el debounce de 1200ms de onUpdate y guarda
  // YA el HTML pendiente. Usado por Ctrl+S, por el desmontaje y por el botón
  // "Actualizar" de SharePopover (vía `saveNowRef`) — este último para que
  // quien tiene el link de solo lectura abierto no tenga que esperar el
  // debounce para que el sondeo automático le traiga el cambio.
  function flushPendingSave() {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    if (pendingHtmlRef.current !== null) {
      onSaveRef.current?.(pendingHtmlRef.current);
      pendingHtmlRef.current = null;
    }
  }

  useEffect(() => {
    if (!editable) return;

    function handleShortcut(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        flushPendingSave();
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [editable]);

  // Expone flushPendingSave a quien haya pasado `saveNowRef` (Project.jsx,
  // para el botón "Actualizar" de SharePopover). Solo lee de refs, así que
  // no hace falta que se vuelva a correr en cada render.
  useEffect(() => {
    if (!saveNowRef) return;
    saveNowRef.current = flushPendingSave;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al desmontar: si quedaron cambios sin guardar, guardalos ya
  useEffect(() => {
    if (!editable) return;

    return () => flushPendingSave();
  }, [editable]);

  return editor;
}
