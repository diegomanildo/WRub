import { useState, useEffect, useRef } from "react";
import { Music2, Link, Upload, Ban, Loader2 } from "lucide-react";
import { useDismissable } from "../../hooks/useDismissable";
import { extractYoutubeId, fetchYoutubeTitle } from "../../utils/youtube";
import { uploadAudio } from "../../services/audio";
import { useToast } from "../ui/ToastProvider";

// Espera tras la última tecla antes de ir a buscar el título (evita pegarle
// a la API en cada carácter mientras el usuario todavía está escribiendo).
const TITLE_LOOKUP_DEBOUNCE_MS = 400;
// Tope de tiempo para la búsqueda del título en sí. Si YouTube no contesta
// en este lapso, se deja de esperar y se habilita el botón igual (con el
// título que haya quedado, o vacío) en vez de trabar al usuario.
const TITLE_LOOKUP_TIMEOUT_MS = 5000;

function MusicPicker({ editor, current }) {
  const { open, setOpen, ref } = useDismissable();
  const [tab, setTab] = useState("youtube");
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  // true desde que aparece un link de YouTube válido y nuevo hasta que el
  // título se resuelve (éxito, error o timeout) o el usuario lo escribe a
  // mano. Mientras está en true, "Asociar al párrafo" queda deshabilitado.
  const [titleLoading, setTitleLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const resolvedIdRef = useRef(null);

  const hasMusic = Boolean(current?.musicType);

  function closeAndReset() {
    setOpen(false);
    setLink("");
    setTitle("");
    setTitleTouched(false);
    setTitleLoading(false);
    resolvedIdRef.current = null;
  }

  // Al pegar (o terminar de tipear) un link de YouTube válido, completa el
  // título automáticamente con el título real del video, salvo que el
  // usuario ya haya escrito uno a mano. Mientras tanto, no se deja asociar
  // la canción (ver TITLE_LOOKUP_TIMEOUT_MS más arriba).
  useEffect(() => {
    const videoId = extractYoutubeId(link);

    if (!videoId || titleTouched || videoId === resolvedIdRef.current) {
      setTitleLoading(false);
      return;
    }

    let cancelled = false;
    setTitleLoading(true);

    const debounceTimer = setTimeout(() => {
      if (cancelled) return;

      const controller = new AbortController();
      const timeoutTimer = setTimeout(
        () => controller.abort(),
        TITLE_LOOKUP_TIMEOUT_MS
      );

      fetchYoutubeTitle(videoId, controller.signal)
        .then((videoTitle) => {
          if (cancelled) return;
          resolvedIdRef.current = videoId;
          if (videoTitle) {
            setTitle((prevTitle) => (titleTouched ? prevTitle : videoTitle));
          }
        })
        .finally(() => {
          clearTimeout(timeoutTimer);
          if (!cancelled) setTitleLoading(false);
        });
    }, TITLE_LOOKUP_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [link, titleTouched]);

  function applyYoutube() {
    const videoId = extractYoutubeId(link);
    if (!videoId) {
      toast.error("Ese link de YouTube no parece válido");
      return;
    }

    editor
      .chain()
      .focus()
      .updateAttributes("paragraph", {
        musicType: "youtube",
        musicSrc: videoId,
        musicTitle: title.trim() || "Canción de YouTube",
      })
      .run();

    closeAndReset();
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadAudio(file);

      editor
        .chain()
        .focus()
        .updateAttributes("paragraph", {
          musicType: "file",
          musicSrc: result.url,
          musicTitle: result.title,
        })
        .run();

      closeAndReset();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "No se pudo subir el audio");
    } finally {
      setUploading(false);
    }
  }

  function remove() {
    editor
      .chain()
      .focus()
      .updateAttributes("paragraph", {
        musicType: null,
        musicSrc: null,
        musicTitle: null,
      })
      .run();
    closeAndReset();
  }

  return (
    <div className="menu-anchor" ref={ref}>
      <button
        type="button"
        className={`editor-btn editor-btn-music ${hasMusic ? "editor-btn-active" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Música del párrafo"
        aria-label="Música del párrafo"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Music2 size={17} />
      </button>

      {open && (
        <div className="menu menu-music" role="dialog" aria-label="Agregar música al párrafo">
          <div className="music-menu-tabs">
            <button
              type="button"
              className={`music-menu-tab ${tab === "youtube" ? "is-active" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setTab("youtube")}
            >
              <Link size={15} />
              YouTube
            </button>
            <button
              type="button"
              className={`music-menu-tab ${tab === "file" ? "is-active" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setTab("file")}
            >
              <Upload size={15} />
              Subir archivo
            </button>
          </div>

          {tab === "youtube" ? (
            <div className="music-menu-panel">
              <label className="music-menu-label">
                Link de YouTube
                <input
                  type="text"
                  className="music-menu-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </label>
              <label className="music-menu-label">
                Título (opcional)
                <span className="music-menu-title-input">
                  <input
                    type="text"
                    className="music-menu-input"
                    placeholder="Nombre de la canción"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setTitleTouched(true);
                    }}
                  />
                  {titleLoading && (
                    <Loader2 size={14} className="spin music-menu-title-spinner" />
                  )}
                </span>
              </label>
              <button
                type="button"
                className="btn btn-primary music-menu-apply"
                onMouseDown={(e) => e.preventDefault()}
                onClick={applyYoutube}
                disabled={!link.trim() || titleLoading}
                title={titleLoading ? "Esperando el título del video..." : undefined}
              >
                {titleLoading ? (
                  <>
                    <Loader2 size={14} className="spin" />
                    Buscando título...
                  </>
                ) : (
                  "Asociar al párrafo"
                )}
              </button>
            </div>
          ) : (
            <div className="music-menu-panel">
              <p className="music-menu-hint">MP3, WAV, OGG o M4A. Hasta 20&nbsp;MB.</p>
              <label className={`music-menu-upload ${uploading ? "is-disabled" : ""}`}>
                {uploading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                {uploading ? "Subiendo..." : "Elegir archivo"}
                <input
                  type="file"
                  accept="audio/*"
                  hidden
                  disabled={uploading}
                  onChange={handleFile}
                />
              </label>
            </div>
          )}

          {hasMusic && (
            <>
              <div className="menu-sep" />
              <button
                type="button"
                className="menu-item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={remove}
              >
                <Ban size={15} />
                Quitar música de este párrafo
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default MusicPicker;
