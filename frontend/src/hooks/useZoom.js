import { useCallback, useState } from "react";

const STORAGE_KEY = "wrub:zoom";

/**
 * Niveles de zoom del documento, en porcentaje. Son pasos fijos (como el
 * selector de Google Docs) y no un rango libre: saltar de 100 a 101 no le
 * sirve a nadie, y los pasos fijos hacen que los +/- sean predecibles.
 */
export const ZOOM_LEVELS = [50, 75, 90, 100, 125, 150, 200];

export const DEFAULT_ZOOM = 100;

function readStoredZoom() {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return ZOOM_LEVELS.includes(stored) ? stored : DEFAULT_ZOOM;
  } catch {
    // localStorage puede fallar (modo privado, cuota llena): el zoom
    // simplemente no se recuerda entre sesiones.
    return DEFAULT_ZOOM;
  }
}

/**
 * Zoom del documento (mismo patrón de persistencia que `wrub:theme` y
 * `wrub:view`). Devuelve el porcentaje elegido, el factor listo para usar
 * como escala y los tres comandos del selector.
 */
export function useZoom() {
  const [zoom, setZoomState] = useState(readStoredZoom);

  const setZoom = useCallback((next) => {
    if (!ZOOM_LEVELS.includes(next)) return;
    setZoomState(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // ver readStoredZoom
    }
  }, []);

  // Los pasos sueltos se mueven por la lista, igual que el +/- del tamaño
  // de fuente (ver FontSizePicker).
  const step = useCallback(
    (direction) => {
      setZoomState((prev) => {
        const next = ZOOM_LEVELS[ZOOM_LEVELS.indexOf(prev) + direction];
        if (next === undefined) return prev;
        try {
          localStorage.setItem(STORAGE_KEY, String(next));
        } catch {
          // ver readStoredZoom
        }
        return next;
      });
    },
    [],
  );

  return { zoom, scale: zoom / 100, setZoom, step };
}
