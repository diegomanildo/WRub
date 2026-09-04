import { useEditorState } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
  Heading1,
  Heading2,
  Heading3,
  Code2,
} from "lucide-react";
import FontFamilyPicker from "./FontFamilyPicker";
import ColorPicker from "./ColorPicker";
import FontSizePicker from "./FontSizePicker";
import MusicPicker from "./MusicPicker";
import ImagePicker from "./ImagePicker";

function ToolbarButton({ active, disabled, onClick, label, children }) {
  return (
    <button
      type="button"
      className={`editor-btn ${active ? "editor-btn-active" : ""}`}
      disabled={disabled}
      aria-pressed={active}
      title={label}
      aria-label={label}
      // Evita que el editor pierda el foco/la selección al hacer clic.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function Toolbar({ editor }) {
  // En Tiptap v3 useEditor ya NO re-renderiza en cada transacción:
  // useEditorState es lo que mantiene los estados activos sincronizados.
  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return null;
      return {
        bold: editor.isActive("bold"),
        italic: editor.isActive("italic"),
        underline: editor.isActive("underline"),
        strike: editor.isActive("strike"),
        code: editor.isActive("code"),
        blockquote: editor.isActive("blockquote"),
        h1: editor.isActive("heading", { level: 1 }),
        h2: editor.isActive("heading", { level: 2 }),
        h3: editor.isActive("heading", { level: 3 }),
        bulletList: editor.isActive("bulletList"),
        orderedList: editor.isActive("orderedList"),
        alignLeft: editor.isActive({ textAlign: "left" }),
        alignCenter: editor.isActive({ textAlign: "center" }),
        alignRight: editor.isActive({ textAlign: "right" }),
        alignJustify: editor.isActive({ textAlign: "justify" }),
        // Atributos de la marca textStyle (fuente y color de la selección)
        fontFamily: editor.getAttributes("textStyle").fontFamily ?? null,
        color: editor.getAttributes("textStyle").color ?? null,
        fontSize: editor.getAttributes("textStyle").fontSize ?? null,
        // Música asociada al párrafo donde está el cursor.
        musicType: editor.getAttributes("paragraph").musicType ?? null,
        musicSrc: editor.getAttributes("paragraph").musicSrc ?? null,
        musicTitle: editor.getAttributes("paragraph").musicTitle ?? null,
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo(),
      };
    },
  });

  if (!editor || !state) return null;

  const chain = () => editor.chain().focus();

  return (
    <div className="editor-toolbar-bar">
      <div className="editor-toolbar" role="toolbar" aria-label="Formato de texto">
      <FontFamilyPicker editor={editor} currentFont={state.fontFamily} />

      <span className="editor-divider" />

      <FontSizePicker editor={editor} currentSize={state.fontSize} />

      <span className="editor-divider" />

      <ToolbarButton active={state.bold} label="Negrita (Ctrl+B)" onClick={() => chain().toggleBold().run()}>
        <Bold size={17} />
      </ToolbarButton>
      <ToolbarButton active={state.italic} label="Itálica (Ctrl+I)" onClick={() => chain().toggleItalic().run()}>
        <Italic size={17} />
      </ToolbarButton>
      <ToolbarButton active={state.underline} label="Subrayado (Ctrl+U)" onClick={() => chain().toggleUnderline().run()}>
        <UnderlineIcon size={17} />
      </ToolbarButton>
      <ToolbarButton active={state.strike} label="Tachado" onClick={() => chain().toggleStrike().run()}>
        <Strikethrough size={17} />
      </ToolbarButton>
      <ToolbarButton active={state.code} label="Código en línea" onClick={() => chain().toggleCode().run()}>
        <Code2 size={17} />
      </ToolbarButton>
      <ColorPicker editor={editor} currentColor={state.color} />

      <span className="editor-divider" />

      <ImagePicker editor={editor} />

      <span className="editor-divider" />

      <MusicPicker
        editor={editor}
        current={{
          musicType: state.musicType,
          musicSrc: state.musicSrc,
          musicTitle: state.musicTitle,
        }}
      />

      <span className="editor-divider" />

      <ToolbarButton active={state.h1} label="Título 1" onClick={() => chain().toggleHeading({ level: 1 }).run()}>
        <Heading1 size={17} />
      </ToolbarButton>
      <ToolbarButton active={state.h2} label="Título 2" onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <Heading2 size={17} />
      </ToolbarButton>
      <ToolbarButton active={state.h3} label="Título 3" onClick={() => chain().toggleHeading({ level: 3 }).run()}>
        <Heading3 size={17} />
      </ToolbarButton>

      <span className="editor-divider" />

      <ToolbarButton active={state.bulletList} label="Lista con viñetas" onClick={() => chain().toggleBulletList().run()}>
        <List size={17} />
      </ToolbarButton>
      <ToolbarButton active={state.orderedList} label="Lista numerada" onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered size={17} />
      </ToolbarButton>
      <ToolbarButton active={state.blockquote} label="Cita" onClick={() => chain().toggleBlockquote().run()}>
        <Quote size={17} />
      </ToolbarButton>

      <span className="editor-divider" />

      <ToolbarButton active={state.alignLeft} label="Alinear a la izquierda" onClick={() => chain().setTextAlign("left").run()}>
        <AlignLeft size={17} />
      </ToolbarButton>
      <ToolbarButton active={state.alignCenter} label="Centrar" onClick={() => chain().setTextAlign("center").run()}>
        <AlignCenter size={17} />
      </ToolbarButton>
      <ToolbarButton active={state.alignRight} label="Alinear a la derecha" onClick={() => chain().setTextAlign("right").run()}>
        <AlignRight size={17} />
      </ToolbarButton>
      <ToolbarButton active={state.alignJustify} label="Justificar" onClick={() => chain().setTextAlign("justify").run()}>
        <AlignJustify size={17} />
      </ToolbarButton>

      <span className="editor-divider" />

      <ToolbarButton disabled={!state.canUndo} label="Deshacer (Ctrl+Z)" onClick={() => chain().undo().run()}>
        <Undo2 size={17} />
      </ToolbarButton>
      <ToolbarButton disabled={!state.canRedo} label="Rehacer (Ctrl+Y)" onClick={() => chain().redo().run()}>
        <Redo2 size={17} />
        </ToolbarButton>
      </div>
    </div>
  );
}
