import { ChevronDown, Check } from "lucide-react";
import { useDismissable } from "../../hooks/useDismissable";

/**
 * Fuentes elegidas a propósito entre las que existen en casi todos los
 * sistemas: el documento termina exportándose a PDF y una fuente que el
 * equipo no tenga instalada se sustituye y rompe el diseño.
 */
export const FONTS = [
  // Arial es la fuente base del documento y se aplica desde el CSS de la hoja,
  // así que su `value` es null: elegirla quita el override en vez de escribir
  // un span. El HTML queda más limpio y hay una sola fuente de verdad para
  // la exportación a PDF.
  { label: "Arial", value: null, stack: "Arial, Helvetica, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
  { label: "Trebuchet MS", value: '"Trebuchet MS", Helvetica, sans-serif' },
  { label: "Times New Roman", value: '"Times New Roman", Times, serif' },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Garamond", value: "Garamond, Georgia, serif" },
  { label: "Courier New", value: '"Courier New", Courier, monospace' },
  { label: "Comic Sans MS", value: '"Comic Sans MS", "Comic Sans", cursive' },
];

function FontFamilyPicker({ editor, currentFont }) {
  const { open, setOpen, ref } = useDismissable();

  const active =
    FONTS.find((f) => f.value && f.value === currentFont) ?? FONTS[0];

  function apply(font) {
    setOpen(false);
    const chain = editor.chain().focus();
    if (font.value) {
      chain.setFontFamily(font.value).run();
    } else {
      chain.unsetFontFamily().run();
    }
  }

  return (
    <div className="menu-anchor" ref={ref}>
      <button
        type="button"
        className="editor-select"
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Fuente"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span
          className="editor-select-label"
          style={{ fontFamily: active.stack || active.value }}
        >
          {active.label}
        </span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="menu menu-fonts" role="listbox">
          {FONTS.map((font) => {
            const isActive = font.label === active.label;
            return (
              <button
                key={font.label}
                type="button"
                role="option"
                aria-selected={isActive}
                className="menu-item"
                style={{ fontFamily: font.stack || font.value }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => apply(font)}
              >
                <span className="menu-item-check">
                  {isActive && <Check size={15} />}
                </span>
                {font.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FontFamilyPicker;
