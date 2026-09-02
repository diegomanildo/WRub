import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const MusicPlayerContext = createContext(null);

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) {
    throw new Error("useMusicPlayer debe usarse dentro de <MusicPlayerProvider>");
  }
  return ctx;
}

let youtubeApiPromise = null;

function loadYoutubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });

  return youtubeApiPromise;
}

/**
 * Reproductor global tipo Spotify: un solo audio suena a la vez, ya sea un
 * <audio> para archivos subidos o un player oculto de YouTube (solo se usa
 * el audio, el video nunca se muestra). Vive en el root de la app para que
 * la barra inferior sobreviva a la navegación entre páginas.
 */
function readStoredVolume() {
  const raw = Number(localStorage.getItem("wrub:volume"));
  return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : 0.8;
}

export function MusicPlayerProvider({ children }) {
  const [current, setCurrent] = useState(null); // { type, src, title }
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const [volume, setVolumeState] = useState(readStoredVolume);

  const audioRef = useRef(null);
  const ytContainerRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytIntervalRef = useRef(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.volume = volumeRef.current;
    audioRef.current = audio;

    function onTime() {
      setProgress({ current: audio.currentTime, duration: audio.duration || 0 });
    }
    function onEnded() {
      setPlaying(false);
    }

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onTime);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const stopYoutube = useCallback(() => {
    if (ytIntervalRef.current) {
      clearInterval(ytIntervalRef.current);
      ytIntervalRef.current = null;
    }
    ytPlayerRef.current?.stopVideo?.();
  }, []);

  const ensureYoutubePlayer = useCallback(async () => {
    if (ytPlayerRef.current) return ytPlayerRef.current;

    const YT = await loadYoutubeApi();

    return new Promise((resolve) => {
      const player = new YT.Player(ytContainerRef.current, {
        height: "0",
        width: "0",
        playerVars: { playsinline: 1 },
        events: {
          onReady: () => {
            player.setVolume(Math.round(volumeRef.current * 100));
            resolve(player);
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) setPlaying(true);
            if (event.data === YT.PlayerState.PAUSED) setPlaying(false);
            if (event.data === YT.PlayerState.ENDED) setPlaying(false);
          },
        },
      });
      ytPlayerRef.current = player;
    });
  }, []);

  const play = useCallback(
    async (track) => {
      if (!track?.src) return;

      // Un solo audio a la vez: cortar lo que estuviera sonando antes.
      audioRef.current?.pause();
      stopYoutube();

      setCurrent(track);
      setProgress({ current: 0, duration: 0 });

      if (track.type === "youtube") {
        const player = await ensureYoutubePlayer();
        player.loadVideoById(track.src);
        player.playVideo();
        setPlaying(true);

        ytIntervalRef.current = setInterval(() => {
          const p = ytPlayerRef.current;
          if (!p?.getCurrentTime) return;
          setProgress({
            current: p.getCurrentTime() || 0,
            duration: p.getDuration() || 0,
          });
        }, 500);
      } else {
        const audio = audioRef.current;
        audio.src = track.src;
        audio.currentTime = 0;
        try {
          await audio.play();
          setPlaying(true);
        } catch {
          setPlaying(false);
        }
      }
    },
    [ensureYoutubePlayer, stopYoutube],
  );

  const toggle = useCallback(() => {
    if (!current) return;

    if (current.type === "youtube") {
      const player = ytPlayerRef.current;
      if (!player) return;
      if (playing) {
        player.pauseVideo();
        setPlaying(false);
      } else {
        player.playVideo();
        setPlaying(true);
      }
      return;
    }

    const audio = audioRef.current;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [current, playing]);

  const seek = useCallback(
    (seconds) => {
      if (!current) return;

      if (current.type === "youtube") {
        ytPlayerRef.current?.seekTo?.(seconds, true);
      } else if (audioRef.current) {
        audioRef.current.currentTime = seconds;
      }
      setProgress((prev) => ({ ...prev, current: seconds }));
    },
    [current],
  );

  const close = useCallback(() => {
    audioRef.current?.pause();
    stopYoutube();
    setCurrent(null);
    setPlaying(false);
    setProgress({ current: 0, duration: 0 });
  }, [stopYoutube]);

  const setVolume = useCallback((value) => {
    const clamped = Math.min(1, Math.max(0, value));
    setVolumeState(clamped);
    localStorage.setItem("wrub:volume", String(clamped));

    if (audioRef.current) audioRef.current.volume = clamped;
    ytPlayerRef.current?.setVolume?.(Math.round(clamped * 100));
  }, []);

  useEffect(() => () => stopYoutube(), [stopYoutube]);

  const value = { current, playing, progress, volume, play, toggle, seek, close, setVolume };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      {/* Contenedor del player de YouTube: nunca se muestra, solo se usa el audio. */}
      <div
        ref={ytContainerRef}
        style={{ position: "fixed", width: 0, height: 0, overflow: "hidden", bottom: 0, left: 0 }}
        aria-hidden="true"
      />
    </MusicPlayerContext.Provider>
  );
}
