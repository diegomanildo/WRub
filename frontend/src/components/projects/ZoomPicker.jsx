import { ChevronDown, Check, Minus, Plus } from "lucide-react";
import { useDismissable } from "../../hooks/useDismissable";
import { ZOOM_LEVELS } from "../../hooks/useZoom";

/**
 * Selector de zoom del documento. No toca el contenido (no es el tamaño de
 * fuente): escala la hoja entera, igual que el zoom de Google Docs — el
 * documento se sigue guardando y paginando en tamaño real.
 *
 * Mismo esqueleto que FontSizePicker (menos/menú/más) para que la toolbar
 * se sienta consistente.
 */
function ZoomPicker({ zoom, onChange, onStep }) {
  const { open, setOpen, ref } = useDismissable();

  const atMin = zoom <= ZOOM_LEVELS[0];
  const atMax = zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1];

  function apply(value) {
    setOpen(false);
    onChange(value);
  }

  return (
    <div className="size-group">
      <button
        type="button"
        className="editor-btn"
        title="Alejar"
        aria-label="Alejar el documento"
        disabled={atMin}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onStep(-1)}
      >
        <Minus size={16} />
      </button>

      <div className="menu-anchor" ref={ref}>
        <button
          type="button"
          className="editor-select editor-select-size editor-select-zoom"
          aria-haspopup="listbox"
          aria-expanded={open}
          title="Zoom"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="editor-select-label">{zoom}%</span>
          <ChevronDown size={14} />
        </button>

        {open && (
          <div className="menu menu-sizes" role="listbox">
            {ZOOM_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                role="option"
                aria-selected={level === zoom}
                className="menu-item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => apply(level)}
              >
                <span className="menu-item-check">
                  {level === zoom && <Check size={15} />}
                </span>
                {level}%
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="editor-btn"
        title="Acercar"
        aria-label="Acercar el documento"
        disabled={atMax}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onStep(1)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

export default ZoomPicker;
