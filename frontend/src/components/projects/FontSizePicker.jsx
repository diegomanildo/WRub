import { ChevronDown, Check, Minus, Plus } from "lucide-react";
import { useDismissable } from "../../hooks/useDismissable";

/**
 * Tamaños en puntos, no en píxeles: el documento se exporta a PDF y el punto
 * es la unidad de la página impresa. 11pt es el tamaño base de la hoja y por
 * eso su `value` es null (elegirlo quita el override, igual que Arial en el
 * selector de fuente).
 */
export const SIZES = [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72];

export const DEFAULT_SIZE = 11;

/** "14pt" -> 14 ; null -> DEFAULT_SIZE */
export function parseSize(value) {
  if (!value) return DEFAULT_SIZE;
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? Math.round(n) : DEFAULT_SIZE;
}

function FontSizePicker({ editor, currentSize }) {
  const { open, setOpen, ref } = useDismissable();

  const active = parseSize(currentSize);

  function apply(size) {
    setOpen(false);
    const chain = editor.chain().focus();
    if (size === DEFAULT_SIZE) {
      chain.unsetFontSize().run();
    } else {
      chain.setFontSize(`${size}pt`).run();
    }
  }

  // Los pasos sueltos (+/-) se mueven por la lista, no de a un punto:
  // saltar de 48 a 49 no le sirve a nadie.
  function step(direction) {
    const i = SIZES.indexOf(active);
    if (i === -1) {
      // Tamaño personalizado que no está en la lista: buscamos el vecino.
      const next = direction > 0
        ? SIZES.find((s) => s > active)
        : [...SIZES].reverse().find((s) => s < active);
      if (next) apply(next);
      return;
    }
    const next = SIZES[i + direction];
    if (next) apply(next);
  }

  const atMin = active <= SIZES[0];
  const atMax = active >= SIZES[SIZES.length - 1];

  return (
    <div className="size-group">
      <button
        type="button"
        className="editor-btn"
        title="Reducir tamaño"
        aria-label="Reducir tamaño de fuente"
        disabled={atMin}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => step(-1)}
      >
        <Minus size={16} />
      </button>

      <div className="menu-anchor" ref={ref}>
        <button
          type="button"
          className="editor-select editor-select-size"
          aria-haspopup="listbox"
          aria-expanded={open}
          title="Tamaño de fuente"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="editor-select-label">{active}</span>
          <ChevronDown size={14} />
        </button>

        {open && (
          <div className="menu menu-sizes" role="listbox">
            {SIZES.map((size) => (
              <button
                key={size}
                type="button"
                role="option"
                aria-selected={size === active}
                className="menu-item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => apply(size)}
              >
                <span className="menu-item-check">
                  {size === active && <Check size={15} />}
                </span>
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="editor-btn"
        title="Aumentar tamaño"
        aria-label="Aumentar tamaño de fuente"
        disabled={atMax}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => step(1)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

export default FontSizePicker;
