import { useEffect, useState } from "react";
import { History, Loader2, RotateCcw, X } from "lucide-react";
import { getVersions, getVersion, restoreVersion } from "../../services/projects";
import { useDismissable } from "../../hooks/useDismissable";
import { useToast } from "../ui/ToastProvider";
import { formatFull, formatRelative, htmlToText } from "../../utils/format";

/**
 * Contenido del panel del historial. El backend guarda un snapshot como
 * mucho cada 5 minutos de edición (ver project.service.js), así que la
 * lista es corta y se carga entera al abrir. Lo que NO trae es el contenido
 * de cada versión: el texto de la vista previa se pide aparte al
 * seleccionar una, para no bajar el documento completo N veces solo para
 * pintar el panel.
 *
 * Es un componente aparte, y no el cuerpo de un `if` dentro de
 * `VersionHistory`, para que se monte recién al abrir: así su estado
 * arranca limpio en cada apertura (versiones sin cargar, nada
 * seleccionado) sin tener que resetearlo a mano al cerrar.
 */
function HistoryPanel({ project, onProjectChange, saveNowRef, onClose }) {
  // null = todavía cargando; [] = cargó y no hay versiones.
  const [versions, setVersions] = useState(null);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const toast = useToast();

  useEffect(() => {
    let cancelled = false;

    // Se fuerza el guardado pendiente antes de listar: si no, lo que se
    // acaba de escribir todavía no llegó al backend y el historial se abre
    // sin el snapshot que lo incluye.
    saveNowRef?.current?.();

    getVersions(project.id)
      .then((data) => {
        if (!cancelled) setVersions(data);
      })
      .catch((error) => {
        console.error(error);
        if (cancelled) return;
        setVersions([]);
        toast.error("No se pudo cargar el historial");
      });

    return () => {
      cancelled = true;
    };
  }, [project.id, toast, saveNowRef]);

  async function handleSelect(version) {
    setSelected(version);
    setPreview(null);

    try {
      const full = await getVersion(project.id, version.id);
      setPreview(htmlToText(full.content).slice(0, 400) || "(documento vacío)");
    } catch (error) {
      console.error(error);
      setPreview("No se pudo cargar la vista previa");
    }
  }

  async function handleRestore() {
    if (!selected) return;

    try {
      setRestoring(true);
      const updated = await restoreVersion(project.id, selected.id);
      onProjectChange(updated);
      onClose();
      toast.success("Se restauró la versión — recargá la página para verla en el editor");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo restaurar la versión");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="menu menu-history" role="dialog" aria-label="Historial de versiones">
      <div className="menu-share-header">
        <span>Historial de versiones</span>
        <button
          type="button"
          className="icon-btn icon-btn-sm"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </div>

      {versions === null ? (
        <p className="menu-share-hint">
          <Loader2 size={14} className="spin" /> Cargando...
        </p>
      ) : versions.length === 0 ? (
        <p className="menu-share-hint">
          Todavía no hay versiones guardadas. Se guarda una automáticamente
          cada tanto mientras escribís.
        </p>
      ) : (
        <ul className="history-list">
          {versions.map((version) => (
            <li key={version.id}>
              <button
                type="button"
                className={`history-item${selected?.id === version.id ? " is-active" : ""}`}
                onClick={() => handleSelect(version)}
              >
                <span className="history-item-date" title={formatFull(version.created_at)}>
                  {formatRelative(version.created_at)}
                </span>
                <span className="history-item-name">{version.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="history-preview">
          <p className="history-preview-text">
            {preview === null ? "Cargando vista previa..." : preview}
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleRestore}
            disabled={restoring}
          >
            <RotateCcw size={15} />
            {restoring ? "Restaurando..." : "Restaurar esta versión"}
          </button>
        </div>
      )}
    </div>
  );
}

function VersionHistory({ project, onProjectChange, saveNowRef }) {
  const { open, setOpen, ref } = useDismissable();

  return (
    <div className="history-wrap" ref={ref}>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Historial de versiones"
        aria-expanded={open}
        title="Historial de versiones"
      >
        <History size={20} />
      </button>

      {open && (
        <HistoryPanel
          project={project}
          onProjectChange={onProjectChange}
          saveNowRef={saveNowRef}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

export default VersionHistory;
