import { EditorContent } from "@tiptap/react";
import Toolbar from "./Toolbar";
import { useDocumentEditor } from "./useDocumentEditor";

/**
 * Wrapper simple con toolbar + hoja juntas. `pages/Project.jsx` no usa esto:
 * usa `useDocumentEditor` y `Toolbar` por separado para poder ubicar la
 * toolbar en el header del documento, junto al título.
 */
export default function TextEditor({ content, onSave, onDirty, placeholder }) {
  const editor = useDocumentEditor({ content, onSave, onDirty, placeholder });

  return (
    <div className="editor-wrapper">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}
