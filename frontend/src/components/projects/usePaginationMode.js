import { useState } from "react";
import {
  DEFAULT_PAGINATION_MODE,
  PAGINATION_MODES,
  PAGINATION_STORAGE_KEY,
} from "../../utils/pagination";

const VALID_MODES = Object.values(PAGINATION_MODES);

/**
 * Modo de paginado elegido por el usuario ("pages" | "lines"), persistido en
 * localStorage (mismo patrón que `wrub:view`/`wrub:sort`/`wrub:volume`).
 * Devuelve [mode, setMode] como un useState normal.
 */
export function usePaginationMode() {
  const [mode, setMode] = useState(() => {
    try {
      const stored = localStorage.getItem(PAGINATION_STORAGE_KEY);
      return VALID_MODES.includes(stored) ? stored : DEFAULT_PAGINATION_MODE;
    } catch {
      return DEFAULT_PAGINATION_MODE;
    }
  });

  function updateMode(next) {
    setMode(next);
    try {
      localStorage.setItem(PAGINATION_STORAGE_KEY, next);
    } catch {
      // localStorage puede fallar (modo privado, cuota llena, etc.) — no es
      // crítico, el modo simplemente no se recuerda entre sesiones.
    }
  }

  return [mode, updateMode];
}
