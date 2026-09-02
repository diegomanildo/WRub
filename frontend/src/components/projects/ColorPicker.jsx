import { useEffect, useState } from "react";
import { Baseline, Ban } from "lucide-react";
import { useDismissable } from "../../hooks/useDismissable";

/* Paleta ordenada por tono; la primera fila son grises. */
export const SWATCHES = [
  ["#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#d9d9d9", "#ffffff"],
  ["#980000", "#ff0000", "#ff9900", "#ffd966", "#00a650", "#00c2cb", "#1a73e8"],
  ["#5b0f00", "#85200c", "#bf9000", "#7f6000", "#274e13", "#0c343d", "#073763"],
  ["#4a148c", "#7b1fa2", "#c2185b", "#e91e63", "#3f51b5", "#607d8b", "#795548"],
];

const DEFAULT_COLOR = "#1f1f1f";

function ColorPicker({ editor, currentColor }) {
  const { open, setOpen, ref } = useDismissable();
  const [custom, setCustom] = useState(DEFAULT_COLOR);

  // Mantiene el input nativo sincronizado con la selección actual.
  useEffect(() => {
    if (currentColor && /^#[0-9a-f]{6}$/i.test(currentColor)) {
      setCustom(currentColor);
    }
  }, [currentColor]);

  function apply(color) {
    setOpen(false);
    editor.chain().focus().setColor(color).run();
  }

  function reset() {
    setOpen(false);
    editor.chain().focus().unsetColor().run();
  }

  return (
    <div className="menu-anchor" ref={ref}>
      <button
        type="button"
        className="editor-btn editor-btn-color"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Color del texto"
        aria-label="Color del texto"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Baseline size={17} />
        <span
          className="color-indicator"
          style={{ backgroundColor: currentColor || DEFAULT_COLOR }}
        />
      </button>

      {open && (
        <div className="menu menu-colors" role="dialog" aria-label="Elegir color">
          {SWATCHES.map((row, i) => (
            <div className="swatch-row" key={i}>
              {row.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`swatch ${
                    currentColor?.toLowerCase() === color ? "is-active" : ""
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                  aria-label={`Color ${color}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => apply(color)}
                />
              ))}
            </div>
          ))}

          <div className="menu-sep" />

          <label className="color-custom">
            <input
              type="color"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                editor.chain().focus().setColor(e.target.value).run();
              }}
            />
            <span>Color personalizado</span>
          </label>

          <button
            type="button"
            className="menu-item"
            onMouseDown={(e) => e.preventDefault()}
            onClick={reset}
          >
            <Ban size={15} />
            Quitar color
          </button>
        </div>
      )}
    </div>
  );
}

export default ColorPicker;
