import { useEffect, useRef, useState } from "react";

const TAGLINE = "We install the system. Then we run it.";

/**
 * Scroll-scrubbed cinematic hero: the automation-network clip plays forward
 * as the visitor scrolls through a 320vh track. Headline is real text (H1)
 * so crawlers read it; the video is decorative.
 */
export const CinematicHero = () => {
  const trackRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [typed, setTyped] = useState("");
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // typing line
    if (reduceMotion) {
      setTyped(TAGLINE);
    } else {
      let i = 0;
      let timer: number;
      const tick = () => {
        i += 1;
        setTyped(TAGLINE.slice(0, i));
        if (i < TAGLINE.length) timer = window.setTimeout(tick, 42 + Math.random() * 46);
      };
      timer = window.setTimeout(tick, 700);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const track = trackRef.current;
    if (!video || !track) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      const seek = () => { try { video.currentTime = 2; } catch { /* poster fallback */ } };
      video.addEventListener("canplay", seek, { once: true });
      return () => video.removeEventListener("canplay", seek);
    }

    let target = 0;
    let render = 0;
    let raf = 0;

    const computeProgress = () => {
      const rect = track.getBoundingClientRect();
      const total = track.offsetHeight - window.innerHeight;
      target = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
    };

    const loop = () => {
      render += (target - render) * 0.14;
      if (Math.abs(target - render) < 0.0002) render = target;
      const duration = video.duration || 0;
      if (duration && video.readyState >= 1 && !video.seeking) {
        const t = render * (duration - 0.05);
        if (Math.abs(video.currentTime - t) > 0.02) {
          try { video.currentTime = t; } catch { /* seek unsupported mid-load */ }
        }
      }
      video.style.transform = `scale(${(1.04 + render * 0.06).toFixed(3)})`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("scroll", computeProgress, { passive: true });
    window.addEventListener("resize", computeProgress);
    computeProgress();
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", computeProgress);
      window.removeEventListener("resize", computeProgress);
    };
  }, []);

  return (
    <section ref={trackRef} className="relative h-[320vh]" aria-label="Introduction">
      <div className="sticky top-0 h-screen overflow-hidden [background:var(--gradient-hero)]">
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${videoReady ? "opacity-100" : "opacity-0"}`}
          muted
          playsInline
          preload="auto"
          poster="/media/hero-poster.jpg"
          aria-hidden="true"
          onCanPlay={() => setVideoReady(true)}
          onLoadedMetadata={(e) => { e.currentTarget.pause(); try { e.currentTarget.currentTime = 0; } catch { /* not seekable yet */ } }}
        >
          <source src="/media/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(246_70%_27%/.45)] via-[hsl(245_66%_38%/.12)] to-[hsl(246_70%_27%/.55)]" aria-hidden="true" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-[4vw] text-center">
          <img
            src="/media/logo.png"
            alt="ANAMECHI Marketing logo, a lightbulb built from circuit traces and binary code"
            className="mb-[3vh] w-[clamp(100px,18vh,190px)] drop-shadow-[0_14px_44px_hsl(246_70%_27%/.55)]"
          />
          <p className="mb-[2.2vh] text-[clamp(.75rem,1.4vw,1.05rem)] uppercase tracking-[.42em] text-[hsl(var(--pale))]/90">
            Done-for-you AI + marketing systems
          </p>
          <h1 className="text-[clamp(3rem,10.5vw,12rem)] font-bold leading-[.95] tracking-[.015em] text-white [text-shadow:0_10px_80px_hsl(246_70%_27%/.6)]">
            ANAMECHI
            <span className="sr-only"> Marketing, done-for-you AI and marketing systems for service-based founders</span>
          </h1>
          <p className="mt-[3vh] min-h-[1.6em] text-[clamp(1.05rem,2.4vw,1.9rem)] text-[hsl(var(--pale))]">
            <span>{typed}</span>
            <span className="ml-1 inline-block h-[1.05em] w-[2px] animate-pulse bg-[hsl(var(--teal))] align-text-bottom" aria-hidden="true" />
            <span className="sr-only">{TAGLINE}</span>
          </p>
        </div>

        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center" aria-hidden="true">
          <span className="mx-auto mb-2 block h-11 w-[1.5px] animate-pulse bg-gradient-to-b from-[hsl(var(--teal))] to-transparent" />
          <span className="text-[.78rem] uppercase tracking-[.35em] text-[hsl(var(--pale))]/80">Scroll</span>
        </div>
      </div>
    </section>
  );
};
