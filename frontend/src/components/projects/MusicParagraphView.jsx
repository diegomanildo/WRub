import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { Music4 } from "lucide-react";
import { useMusicPlayer } from "../player/MusicPlayerContext";
import { resolveAudioUrl } from "../../services/audio";
import { INDENT_STEP_PX } from "../../utils/indent";

/**
 * NodeView del párrafo: si tiene música asociada, muestra un marcador
 * (círculo con nota) antes del texto. Es un botón real con
 * contentEditable=false, así que no interfiere con la edición del texto
 * ni depende de heurísticas de coordenadas de click.
 */
export default function MusicParagraphView({ node }) {
  const { musicType, musicSrc, musicTitle, indent } = node.attrs;
  const { play, current, playing } = useMusicPlayer();

  const hasMusic = Boolean(musicType && musicSrc);
  const playableSrc = musicType === "file" ? resolveAudioUrl(musicSrc) : musicSrc;

  const isThisPlaying =
    playing && current?.type === musicType && current?.src === playableSrc;

  function handlePlay() {
    if (!hasMusic) return;
    play({ type: musicType, src: playableSrc, title: musicTitle });
  }

  return (
    <NodeViewWrapper
      as="p"
      className={`music-paragraph ${hasMusic ? "has-music" : ""} ${
        isThisPlaying ? "is-playing" : ""
      }`}
      style={indent ? { marginLeft: `${indent * INDENT_STEP_PX}px` } : undefined}
    >
      {hasMusic && (
        <button
          type="button"
          className="music-paragraph-marker"
          contentEditable={false}
          title={musicTitle ? `Reproducir "${musicTitle}"` : "Reproducir música"}
          aria-label={musicTitle ? `Reproducir ${musicTitle}` : "Reproducir música"}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handlePlay}
        >
          <Music4 size={12} />
        </button>
      )}
      <NodeViewContent as="span" />
    </NodeViewWrapper>
  );
}
