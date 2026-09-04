import { useState } from "react";
import { Image as ImageIcon, Link, Upload, Loader2 } from "lucide-react";
import { useDismissable } from "../../hooks/useDismissable";
import { uploadImage, resolveImageUrl } from "../../services/images";
import { useToast } from "../ui/ToastProvider";

function ImagePicker({ editor }) {
  const { open, setOpen, ref } = useDismissable();
  const [tab, setTab] = useState("file");
  const [link, setLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  function closeAndReset() {
    setOpen(false);
    setLink("");
    setUploading(false);
  }

  function insert(src) {
    editor.chain().focus().setImage({ src }).run();
    closeAndReset();
  }

  function applyUrl() {
    const trimmed = link.trim();
    if (!trimmed) return;
    insert(trimmed);
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadImage(file);
      insert(resolveImageUrl(result.url));
    } catch (error) {
      console.error(error);
      toast.error(error.message || "No se pudo subir la imagen");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="menu-anchor" ref={ref}>
      <button
        type="button"
        className="editor-btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Insertar imagen"
        aria-label="Insertar imagen"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((prev) => !prev)}
      >
        <ImageIcon size={17} />
      </button>

      {open && (
        <div className="menu menu-music" role="dialog" aria-label="Insertar imagen">
          <div className="music-menu-tabs">
            <button
              type="button"
              className={`music-menu-tab ${tab === "file" ? "is-active" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setTab("file")}
            >
              <Upload size={15} />
              Subir archivo
            </button>
            <button
              type="button"
              className={`music-menu-tab ${tab === "url" ? "is-active" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setTab("url")}
            >
              <Link size={15} />
              URL
            </button>
          </div>

          {tab === "file" ? (
            <div className="music-menu-panel">
              <p className="music-menu-hint">JPG, PNG, GIF, WEBP o SVG. Hasta 10&nbsp;MB.</p>
              <label className={`music-menu-upload ${uploading ? "is-disabled" : ""}`}>
                {uploading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                {uploading ? "Subiendo..." : "Elegir archivo"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={uploading}
                  onChange={handleFile}
                />
              </label>
            </div>
          ) : (
            <div className="music-menu-panel">
              <label className="music-menu-label">
                Link de la imagen
                <input
                  type="text"
                  className="music-menu-input"
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn btn-primary music-menu-apply"
                onMouseDown={(e) => e.preventDefault()}
                onClick={applyUrl}
                disabled={!link.trim()}
              >
                Insertar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ImagePicker;
