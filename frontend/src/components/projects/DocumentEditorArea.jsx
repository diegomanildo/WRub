import { EditorContent } from "@tiptap/react";
import { useEffect } from "react";
import { useDocumentEditor } from "./useDocumentEditor";

/**
 * Crea el editor y renderiza solo la hoja (`EditorContent`). Se separó de
 * la toolbar para poder ubicar la toolbar en el header del documento
 * (junto al título) mientras esto vive más abajo, en `.editor-scroll`.
 * Expone la instancia del editor al padre vía `onReady` para que la
 * toolbar (renderizada en otro lugar del árbol) pueda usarla.
 */
export default function DocumentEditorArea({ content, onSave, onDirty, placeholder, onReady }) {
  const editor = useDocumentEditor({ content, onSave, onDirty, placeholder });

  useEffect(() => {
    onReady?.(editor);
    return () => onReady?.(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  return <EditorContent editor={editor} className="editor-content" />;
}
