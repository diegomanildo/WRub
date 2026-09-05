import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { EditorContent } from "@tiptap/react";
import { Music2 } from "lucide-react";
import { getSharedProject } from "../services/projects";
import { useDocumentEditor } from "../components/projects/useDocumentEditor";
import MusicPlayerBar from "../components/player/MusicPlayerBar";
import { useMusicPlayer } from "../components/player/MusicPlayerContext";
import { EditorSkeleton } from "../components/ui/Skeleton";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

/**
 * Monta el editor de solo lectura. Separado de `SharedProject` a propósito:
 * `useDocumentEditor`/`useEditor` crean la instancia UNA sola vez al montar
 * y no la vuelven a crear si cambia la prop `content` (no hay deps de por
 * medio) — si este hook se llamara directamente en `SharedProject` antes de
 * que termine de cargar, el editor arrancaría con contenido vacío ("") y se
 * quedaría así para siempre aunque el fetch después traiga el HTML real
 * (la hoja en blanco que reportó Diego). Por eso este componente recién se
 * monta cuando `SharedProject` ya tiene `project` cargado — mismo motivo
 * por el que en `pages/Project.jsx` el `<DocumentEditor>` tampoco se monta
 * hasta después del `if (loading) return ...`.
 */
function SharedDocument({ project }) {
  const editor = useDocumentEditor({
    content: project.content,
    editable: false,
  });
  // El editor se crea una sola vez (ver comentario de arriba): cuando el
  // sondeo automático de `SharedProject` trae contenido nuevo (el dueño
  // guardó cambios), hay que empujarlo a mano acá.
  const lastContentRef = useRef(project.content);

  useEffect(() => {
    if (!editor || project.content === lastContentRef.current) return;
    lastContentRef.current = project.content;

    // setContent reemplaza el DOM del editor entero; sin esto el scroll
    // volvería siempre al principio de la hoja después de actualizar.
    const scrollY = window.scrollY;
    editor.commands.setContent(project.content || "");
    requestAnimationFrame(() => window.scrollTo(0, scrollY));
  }, [editor, project.content]);

  return (
    <div className="editor-page-wrap">
      <EditorContent editor={editor} className="editor-content editor-content-readonly" />
    </div>
  );
}

/**
 * Vista de solo lectura para el link de "compartir" (amigos leen el
 * documento con la música por párrafo, sin poder editarlo ni ver el resto
 * de "Mis proyectos"). Ruta pública `/compartir/:token`, fuera de
 * `AppLayout` a propósito: no tiene topbar ni buscador, es una página
 * standalone.
 *
 * Reusa `useDocumentEditor` con `editable: false` en vez de escribir un
 * renderer de HTML aparte: así el marcador de música (NodeView de
 * `MusicParagraph`, con su click-to-play) funciona idéntico a la vista de
 * edición, sin duplicar ese código. Ver comentario en `useDocumentEditor.js`
 * y en `SharedDocument` de arriba (por qué el editor vive en un componente
 * separado que solo se monta con el contenido ya cargado).
 */
function SharedProject() {
  const { token } = useParams();
  const music = useMusicPlayer();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // El objeto entero, no solo `updated_at`, para poder compararlo tal cual
  // llega del sondeo sin depender de que el shape no cambie con el tiempo.
  const projectRef = useRef(null);

  // "— Compartido" de más para distinguir esta pestaña de la de edición
  // cuando el dueño tiene las dos abiertas a la vez.
  useDocumentTitle(project?.name ? `${project.name} — Compartido` : null);

  useEffect(() => {
    let cancelled = false;

    getSharedProject(token)
      .then((data) => {
        if (cancelled) return;
        projectRef.current = data;
        setProject(data);
      })
      .catch(() => {
        if (cancelled) return;
        setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Sondeo en segundo plano: quien tiene el link abierto ve los cambios
  // solos, sin recargar ni tocar nada. El disparador real es el botón
  // "Actualizar" de SharePopover (fuerza el guardado del lado del dueño);
  // acá solo hace falta pedir de nuevo cada tanto y comparar `updated_at`
  // para no reemplazar el editor si no cambió nada.
  useEffect(() => {
    if (notFound) return;

    const interval = setInterval(() => {
      getSharedProject(token)
        .then((data) => {
          if (data.updated_at === projectRef.current?.updated_at) return;
          projectRef.current = data;
          setProject(data);
        })
        .catch(() => {
          // Se desactivó/rotó el link mientras alguien lo tenía abierto:
          // recién ahí se corta, no en cada poll fallido por una red floja.
          setNotFound(true);
        });
    }, 4000);

    return () => clearInterval(interval);
  }, [token, notFound]);

  // Al salir de la página, cortar la música (mismo criterio que Project.jsx).
  useEffect(() => {
    return () => music.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (loading) {
    return (
      <div className="doc-page shared-page">
        <EditorSkeleton />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="page shared-page">
        <div className="empty-state">
          <p className="empty-state-title">Este enlace no está disponible</p>
          <p className="empty-state-text">
            Puede que se haya desactivado o que la dirección esté mal escrita.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-page shared-page">
      <div className="doc-header shared-header">
        <div className="doc-header-main">
          <h1 className="doc-title shared-title">{project.name}</h1>
          <div className="doc-subline shared-subline">
            <Music2 size={14} />
            Solo lectura — hacé clic en un párrafo con nota musical para escucharlo
          </div>
        </div>
      </div>

      <div className="editor-scroll">
        <SharedDocument project={project} />
      </div>

      <MusicPlayerBar />
    </div>
  );
}

export default SharedProject;
