import { useEffect, useRef, useState } from "react";

/**
 * Ambient full-bleed section: the founder steps away while the system keeps
 * running behind her. Plays only while in view; copy is real text.
 */
export const PeopleSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) video.play().catch(() => { /* ambient only */ });
          else video.pause();
        });
      },
      { threshold: 0.25 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden bg-[hsl(var(--indigo-deep))]" aria-label="Marketing that runs without you">
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        onCanPlay={() => setReady(true)}
      >
        <source src="/media/people.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(246_70%_27%/.55)] via-[hsl(246_70%_27%/.25)] to-[hsl(246_70%_27%/.72)]" aria-hidden="true" />
      <div className="relative z-10 max-w-[980px] px-[6vw] py-[18vh] text-center">
        <h2 className="mb-6 text-[clamp(2.4rem,6.4vw,5.6rem)] font-bold leading-[1.02] text-white [text-shadow:0_8px_60px_hsl(246_70%_27%/.8)]">
          Marketing that runs without you.
        </h2>
        <p className="mx-auto max-w-[62ch] text-[clamp(1.05rem,1.8vw,1.35rem)] text-[hsl(var(--pale))]">
          The system publishes, follows up, onboards, and reports whether you are in the room or away
          from it. That is the point. You built the business. We keep the revenue engine running.
        </p>
      </div>
    </section>
  );
};
