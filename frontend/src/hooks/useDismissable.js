import { useEffect, useRef, useState } from "react";

/**
 * Estado abierto/cerrado para menús: cierra al hacer clic afuera o con Escape,
 * y devuelve la ref que hay que colgar del contenedor.
 */
export function useDismissable() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;

    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return { open, setOpen, ref };
}
