import { useEffect } from "react";

/** Cambia el título de la pestaña según la página/documento actual. */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — WRub` : "WRub";
  }, [title]);
}
