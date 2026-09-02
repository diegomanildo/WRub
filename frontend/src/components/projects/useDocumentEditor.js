import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle, Color, FontFamily, FontSize } from "@tiptap/extension-text-style";
import { useEffect, useRef } from "react";
import MusicParagraph from "./MusicParagraph";

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
export function useDocumentEditor({ content, onSave, onDirty, placeholder, editable = true }) {
  const saveTimeout = useRef(null);
  const onSaveRef = useRef(onSave);
  const onDirtyRef = useRef(onDirty);
  const pendingHtmlRef = useRef(null); // último HTML sin guardar

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
        TextAlign.configure({ types: ["heading", "paragraph"] }),
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

  // Guardado inmediato con Ctrl+S / Cmd+S
  useEffect(() => {
    if (!editable) return;

    function handleShortcut(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        if (pendingHtmlRef.current !== null) {
          onSaveRef.current?.(pendingHtmlRef.current);
          pendingHtmlRef.current = null;
        }
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [editable]);

  // Al desmontar: si quedaron cambios sin guardar, guardalos ya
  useEffect(() => {
    if (!editable) return;

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      if (pendingHtmlRef.current !== null) {
        onSaveRef.current?.(pendingHtmlRef.current);
      }
    };
  }, [editable]);

  return editor;
}
