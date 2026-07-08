import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const PREF_KEY = "anamechi_sound";
const TRACK_SRC = "/media/ambient.mp3";
const TARGET_VOLUME = 0.35;

/**
 * Opt-in ambient soundtrack. Browsers block autoplaying audio and forced
 * music hurts conversion, so the track only starts from a real user choice.
 * The preference persists; returning visitors who opted in get the music
 * back on their first interaction with the page (a valid autoplay gesture).
 */
export const SoundToggle = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<number | null>(null);
  const [available, setAvailable] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Only render the toggle if the track actually exists. SPA hosting returns
  // index.html (200) for missing files, so require an audio content-type.
  useEffect(() => {
    fetch(TRACK_SRC, { method: "HEAD" })
      .then((r) => {
        const type = r.headers.get("content-type") || "";
        setAvailable(r.ok && type.startsWith("audio"));
      })
      .catch(() => setAvailable(false));
  }, []);

  useEffect(() => {
    if (!available) return;
    const audio = new Audio(TRACK_SRC);
    audio.loop = true;
    audio.preload = "none";
    audio.volume = 0;
    audioRef.current = audio;

    // Returning visitor who opted in: resume on their first interaction
    let armed = false;
    try {
      armed = localStorage.getItem(PREF_KEY) === "on";
    } catch {
      /* private browsing */
    }
    const resume = () => {
      if (armed && audioRef.current?.paused) start();
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
    if (armed) {
      window.addEventListener("pointerdown", resume, { once: true });
      window.addEventListener("keydown", resume, { once: true });
    }
    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
      audio.pause();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available]);

  const fadeTo = (target: number, onDone?: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fadeRef.current) cancelAnimationFrame(fadeRef.current);
    const step = () => {
      const diff = target - audio.volume;
      if (Math.abs(diff) < 0.02) {
        audio.volume = target;
        onDone?.();
        return;
      }
      audio.volume = audio.volume + diff * 0.08;
      fadeRef.current = requestAnimationFrame(step);
    };
    fadeRef.current = requestAnimationFrame(step);
  };

  const start = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio
      .play()
      .then(() => {
        setPlaying(true);
        fadeTo(TARGET_VOLUME);
        try {
          localStorage.setItem(PREF_KEY, "on");
        } catch { /* private browsing */ }
      })
      .catch(() => { /* browser refused; user can tap again */ });
  };

  const stop = () => {
    setPlaying(false);
    try {
      localStorage.setItem(PREF_KEY, "off");
    } catch { /* private browsing */ }
    fadeTo(0, () => audioRef.current?.pause());
  };

  if (!available) return null;

  return (
    <button
      type="button"
      onClick={playing ? stop : start}
      aria-pressed={playing}
      aria-label={playing ? "Turn sound off" : "Turn sound on"}
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold shadow-lg transition-all duration-300 ${
        playing
          ? "bg-[hsl(var(--teal))] text-white shadow-[0_8px_30px_hsl(179_100%_35%/.4)]"
          : "bg-[hsl(var(--indigo))]/90 text-[hsl(var(--pale))] backdrop-blur hover:bg-[hsl(var(--indigo))]"
      }`}
    >
      {playing ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      {playing ? "Sound on" : "Sound"}
    </button>
  );
};
