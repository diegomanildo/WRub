import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "wrub:theme";

/** "light" | "dark" | "system" */
function readStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "system";
  } catch {
    return "system";
  }
}

/**
 * Aplica el tema al <html>. En "system" se saca el atributo en vez de
 * escribir el valor resuelto: así manda el bloque prefers-color-scheme del
 * CSS y el tema sigue al sistema en vivo, sin escuchar el media query.
 */
function applyTheme(theme) {
  const root = document.documentElement;

  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

// Se aplica también al cargar el módulo, antes del primer render, para que
// no se vea un destello del tema claro al entrar con el oscuro elegido.
applyTheme(readStoredTheme());

export function useTheme() {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* modo privado o storage bloqueado: no es crítico */
    }
  }, [theme]);

  // Cicla claro → oscuro → sistema. El tercer estado existe para poder
  // volver a "lo que diga el sistema" después de haber elegido a mano.
  const cycleTheme = useCallback(() => {
    setTheme((current) =>
      current === "light" ? "dark" : current === "dark" ? "system" : "light",
    );
  }, []);

  return { theme, setTheme, cycleTheme };
}
