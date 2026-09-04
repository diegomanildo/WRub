import { useState } from "react";
import { Link2, Loader2, RefreshCw, X } from "lucide-react";
import { useDismissable } from "../../hooks/useDismissable";
import { enableShare, disableShare, rotateShare } from "../../services/projects";
import { ROUTES } from "../../routes/paths";
import { useToast } from "../ui/ToastProvider";

/**
 * Botón "Compartir" del header del documento (mismo patrón de popover que
 * FontFamilyPicker/ColorPicker: useDismissable + posicionamiento absoluto).
 * Activa/desactiva el link de solo lectura (`share_enabled`) y permite
 * copiarlo o rotarlo (invalidar el viejo y generar uno nuevo).
 *
 * `project`/`onProjectChange` son controlados por `Project.jsx` (mismo
 * dueño del estado `project` que ya tenía) para no duplicar el objeto acá.
 *
 * `saveNowRef` también viene de `Project.jsx` (lo llena `useDocumentEditor`):
 * lo usa el botón "Actualizar" de acá abajo para guardar YA el contenido
 * pendiente, sin esperar el debounce del autoguardado. La vista compartida
 * (`SharedProject.jsx`) sondea el link cada pocos segundos sola, así que en
 * cuanto este guardado termina, quien la tenga abierta la ve actualizada
 * sin tocar nada de su lado.
 */
function SharePopover({ project, onProjectChange, saveNowRef }) {
  const { open, setOpen, ref } = useDismissable();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const shareUrl = project.share_token
    ? `${window.location.origin}${ROUTES.SHARED(project.share_token)}`
    : null;

  async function handleToggle() {
    setLoading(true);
    try {
      const updated = project.share_enabled ? await disableShare(project.id) : await enableShare(project.id);
      onProjectChange(updated);
      if (updated.share_enabled) setOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar el enlace para compartir");
    } finally {
      setLoading(false);
    }
  }

  async function handleRotate() {
    setLoading(true);
    try {
      const updated = await rotateShare(project.id);
      onProjectChange(updated);
      toast.success("Se generó un enlace nuevo — el anterior dejó de funcionar");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo generar un enlace nuevo");
    } finally {
      setLoading(false);
    }
  }

  function handleUpdateNow() {
    saveNowRef?.current?.();
    toast.success("Documento actualizado — quien tenga el link abierto lo ve en unos segundos");
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Enlace copiado");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo copiar el enlace");
    }
  }

  return (
    <div className="share-popover-wrap" ref={ref}>
      <button
        type="button"
        className={`share-btn ${project.share_enabled ? "share-btn-active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Compartir"
        title="Compartir"
      >
        <Link2 size={16} />
        <span className="share-btn-label">Compartir</span>
      </button>

      {open && (
        <div className="menu menu-share">
          <div className="menu-share-header">
            <span>Enlace de solo lectura</span>
            <button type="button" className="icon-btn icon-btn-sm" onClick={() => setOpen(false)} aria-label="Cerrar">
              <X size={14} />
            </button>
          </div>

          <p className="menu-share-hint">
            Cualquiera con el enlace puede leer el documento y escuchar la música de cada
            párrafo, sin poder editarlo.
          </p>

          <label className="menu-share-toggle">
            <input
              type="checkbox"
              checked={!!project.share_enabled}
              disabled={loading}
              onChange={handleToggle}
            />
            Enlace activado
          </label>

          {project.share_enabled && shareUrl && (
            <>
              <div className="menu-share-url-row">
                <input className="menu-share-url" value={shareUrl} readOnly onFocus={(e) => e.target.select()} />
                <button type="button" className="btn btn-sm" onClick={handleCopy}>
                  Copiar
                </button>
              </div>

              <button type="button" className="btn btn-sm menu-share-update" onClick={handleUpdateNow}>
                <RefreshCw size={13} />
                Actualizar documento compartido
              </button>

              <button type="button" className="menu-share-rotate" onClick={handleRotate} disabled={loading}>
                {loading ? <Loader2 size={13} className="spin" /> : null}
                Generar enlace nuevo (invalida el actual)
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SharePopover;
