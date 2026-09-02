import { useState } from "react";
import { Play, Pause, X, Music4, Volume2, VolumeX } from "lucide-react";
import { useMusicPlayer } from "./MusicPlayerContext";

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Barra inferior estilo Spotify: flota sobre el contenido, no reserva espacio en el layout. */
export default function MusicPlayerBar() {
  const { current, playing, progress, volume, toggle, seek, close, setVolume } =
    useMusicPlayer();

  // Recuerda el volumen previo al mutear, para poder restaurarlo al desmutear.
  const [volumeBeforeMute, setVolumeBeforeMute] = useState(volume || 0.8);

  if (!current) return null;

  const isMuted = volume === 0;

  function toggleMute() {
    if (isMuted) {
      setVolume(volumeBeforeMute || 0.8);
    } else {
      setVolumeBeforeMute(volume);
      setVolume(0);
    }
  }

  return (
    <div className="music-bar" role="region" aria-label="Reproductor de música">
      <div className="music-bar-info">
        <span className="music-bar-icon">
          <Music4 size={16} />
        </span>
        <span className="music-bar-title" title={current.title || "Sin título"}>
          {current.title || "Sin título"}
        </span>
      </div>

      <div className="music-bar-controls">
        <button
          type="button"
          className="music-bar-play"
          onClick={toggle}
          aria-label={playing ? "Pausar" : "Reproducir"}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <span className="music-bar-time">{formatTime(progress.current)}</span>
        <input
          type="range"
          className="music-bar-progress"
          min={0}
          max={progress.duration || 0}
          step={0.5}
          value={Math.min(progress.current, progress.duration || 0)}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Progreso de la canción"
        />
        <span className="music-bar-time">{formatTime(progress.duration)}</span>
      </div>

      <div className="music-bar-volume">
        <button
          type="button"
          className="music-bar-mute"
          onClick={toggleMute}
          aria-label={isMuted ? "Activar sonido" : "Silenciar"}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <input
          type="range"
          className="music-bar-volume-slider"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="Volumen"
        />
      </div>

      <button
        type="button"
        className="music-bar-close"
        onClick={close}
        aria-label="Cerrar reproductor"
      >
        <X color="#000" size={16} />
      </button>
    </div>
  );
}
