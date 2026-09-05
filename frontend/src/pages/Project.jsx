import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, CloudOff, Loader2, Pencil } from "lucide-react";
import { getProject, updateProject } from "../services/projects";
import { ROUTES } from "../routes/paths";
import DocumentEditor from "../components/projects/DocumentEditor";
import SharePopover from "../components/projects/SharePopover";
import MusicPlayerBar from "../components/player/MusicPlayerBar";
import { useMusicPlayer } from "../components/player/MusicPlayerContext";
import { EditorSkeleton } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/ToastProvider";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { formatFull, getUpdatedAt } from "../utils/format";

function SaveStatus({ status, updatedAt }) {
  if (status === "saving") {
    return (
      <span className="save-status save-status-saving">
        <Loader2 size={14} className="spin" />
        Guardando...
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="save-status save-status-saved">
        <Check size={14} />
        Guardado
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="save-status save-status-error">
        <CloudOff size={14} />
        Sin guardar: {status}, check console
      </span>
    );
  }

  if (status === "dirty") {
    return (
      <span className="save-status save-status-saving">
        <Pencil size={14} />
        Cambios sin guardar
      </span>
    );
  }

  return <span className="save-status">Modificado {formatFull(updatedAt)}</span>;
}

function Project() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const music = useMusicPlayer();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);

  const [status, setStatus] = useState("idle"); // idle | dirty | saving | saved | error

  // Nodo del DOM donde <DocumentEditor/> va a "teletransportar" (portal) la
  // toolbar, para que aparezca en el header junto al título. Se usa estado
  // (no un ref) porque el nodo no existe en el primer render y hace falta
  // re-renderizar cuando aparece.
  const [toolbarSlot, setToolbarSlot] = useState(null);

  // Guardado inmediato expuesto por useDocumentEditor (ver ese archivo):
  // lo usa el botón "Actualizar" de SharePopover para saltar el debounce del
  // autoguardado antes de que el sondeo de la vista compartida lo levante.
  const saveNowRef = useRef(null);

  useDocumentTitle(project?.name);

  useEffect(() => {
    let cancelled = false;

    getProject(id)
      .then((data) => {
        if (cancelled) return;
        setProject(data);
        setName(data.name);
      })
      .catch((error) => {
        console.error(error);
        if (cancelled) return;
        setNotFound(true);
        toast.error("No se pudo cargar el proyecto");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, toast]);

  // Al salir del proyecto (o cambiar a otro) se corta la música: no tiene
  // sentido que siga sonando en la página de "Mis proyectos".
  useEffect(() => {
    return () => music.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleNameBlur() {
    setEditingName(false);

    const trimmed = name.trim();
    if (trimmed === "" || trimmed === project.name) {
      setName(project.name);
      return;
    }

    try {
      setStatus("saving");
      const updated = await updateProject(id, {
        name: trimmed,
        description: project.description,
        content: project.content,
      });
      setProject(updated);
      setStatus("saved");
    } catch (error) {
      console.error(error);
      setName(project.name);
      setStatus("error");
      toast.error("No se pudo renombrar el proyecto");
    }
  }

  async function handleContentSave(html) {
    if (html === project.content) {
      setStatus("saved");
      return;
    }

    try {
      setStatus("saving");
      const updated = await updateProject(id, {
        name: project.name,
        description: project.description,
        content: html,
      });
      setProject(updated);
      setStatus("saved");
    } catch (error) {
      console.error(error);
      setStatus("error");
      toast.error("No se pudo guardar el contenido");
    }
  }

  if (loading) {
    return (
      <div className="doc-page">
        <div className="doc-header">
          <div className="doc-header-row">
            <span className="icon-btn" />
            <div className="doc-header-main">
              <div className="skeleton" style={{ width: 240, height: 22 }} />
            </div>
          </div>
        </div>
        <EditorSkeleton />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="page">
        <div className="empty-state">
          <p className="empty-state-title">No encontramos este proyecto</p>
          <p className="empty-state-text">
            Puede que se haya eliminado o que el enlace sea incorrecto.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(ROUTES.PROJECTS)}
          >
            Volver a mis proyectos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-page">
      <div className="doc-header">
        <div className="doc-header-row">
          <button
            type="button"
            className="icon-btn"
            onClick={() => navigate(ROUTES.PROJECTS)}
            aria-label="Volver a mis proyectos"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="doc-header-main">
            {editingName ? (
              <input
                className="doc-title-input"
                value={name}
                autoFocus
                aria-label="Nombre del proyecto"
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.target.blur();
                  if (e.key === "Escape") {
                    setName(project.name);
                    setEditingName(false);
                  }
                }}
              />
            ) : (
              <h1
                className="doc-title"
                title="Hacé clic para renombrar"
                onClick={() => setEditingName(true)}
              >
                {project.name}
              </h1>
            )}

            <div className="doc-subline">
              <SaveStatus status={status} updatedAt={getUpdatedAt(project)} />
            </div>
          </div>

          <SharePopover project={project} onProjectChange={setProject} saveNowRef={saveNowRef} />
        </div>

        {/* La toolbar vive junto al título para ahorrar espacio vertical:
            antes tenía su propia barra sticky separada. <DocumentEditor/>
            la porta hasta acá. */}
        <div ref={setToolbarSlot} />
      </div>

      <div className="editor-scroll">
        <DocumentEditor
          content={project.content}
          onSave={handleContentSave}
          onDirty={() => setStatus("dirty")}
          toolbarSlot={toolbarSlot}
          saveNowRef={saveNowRef}
        />
      </div>

      {/* Solo vive acá: en la página de proyectos no tiene sentido que suene música. */}
      <MusicPlayerBar />
    </div>
  );
}

export default Project;
