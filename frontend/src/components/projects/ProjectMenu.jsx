import { useEffect, useRef, useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";

/** Menú de 3 puntos reutilizable por la card y por la fila de la lista. */
function ProjectMenu({ project, onDeleteClick }) {
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

  return (
    <div className="menu-anchor" ref={ref}>
      <button
        type="button"
        className="icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Opciones de ${project.name}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div className="menu" role="menu">
          <button
            type="button"
            role="menuitem"
            className="menu-item menu-item-danger"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDeleteClick(project);
            }}
          >
            <Trash2 size={17} />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

export default ProjectMenu;
