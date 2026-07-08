import { useEffect, useRef, useState } from "react";

/**
 * Kinetic manifesto: each scroll beat slams one word on screen:
 * STRUCTURE. BEFORE. SCALE. Then it resolves to INSTALLED. RUNNING. MAINTAINED.
 * All words are real DOM text (crawlable); scroll only toggles visibility.
 * MAINTAINED. is one of the three green moments allowed site-wide.
 */
const BOUNDS: Array<[number, number]> = [
  [0.02, 0.22],
  [0.24, 0.44],
  [0.46, 0.66],
  [0.68, 1.01],
];

export const KineticManifesto = () => {
  const trackRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(-1);
  const [lineOn, setLineOn] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduceMotion(true);
      return;
    }
    const track = trackRef.current;
    if (!track) return;

    let raf = 0;
    const loop = () => {
      const rect = track.getBoundingClientRect();
      const total = track.offsetHeight - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      const active = BOUNDS.findIndex(([a, b]) => p >= a && p < b);
      setStep(active);
      setLineOn(p >= 0.8);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const wordClass = (i: number) =>
    `absolute inset-x-0 text-center font-bold leading-none tracking-[.02em] text-white ` +
    `text-[clamp(3rem,11vw,11rem)] transition-all duration-300 [transition-timing-function:cubic-bezier(.16,1,.3,1)] ` +
    (step === i ? "opacity-100 scale-100" : "opacity-0 scale-[2.4] pointer-events-none");

  if (reduceMotion) {
    return (
      <section className="bg-[hsl(var(--indigo-deep))] px-[6vw] py-[14vh] text-center" aria-label="Our philosophy">
        <h2 className="sr-only">Structure before scale. Installed, running, maintained.</h2>
        <p className="text-[clamp(2.2rem,7vw,6rem)] font-bold text-white">STRUCTURE. BEFORE. SCALE.</p>
        <p className="mt-6 text-[clamp(1.8rem,5vw,4.5rem)] font-bold text-white">
          INSTALLED. RUNNING. <span className="text-[hsl(var(--green))]">MAINTAINED.</span>
        </p>
        <p className="mt-10 text-[clamp(1rem,1.8vw,1.35rem)] text-[hsl(var(--pale))]/90">
          Predictable revenue is built through systems, not effort.
        </p>
      </section>
    );
  }

  return (
    <section ref={trackRef} className="relative h-[520vh] bg-[hsl(var(--indigo-deep))]" aria-label="Our philosophy">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,hsl(245_66%_38%/.55)_0%,transparent_70%)]">
        <h2 className="sr-only">Structure before scale. Installed, running, maintained.</h2>
        <p className={wordClass(0)}>STRUCTURE.</p>
        <p className={wordClass(1)}>BEFORE.</p>
        <p className={wordClass(2)}>SCALE.</p>
        <div
          className={`absolute inset-x-0 flex flex-col items-center gap-[1vh] transition-all duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)] ${
            step === 3 ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[6vh] opacity-0"
          }`}
        >
          <p className="text-[clamp(2rem,6.5vw,6rem)] font-bold leading-[1.05] tracking-[.04em] text-white">INSTALLED.</p>
          <p className="text-[clamp(2rem,6.5vw,6rem)] font-bold leading-[1.05] tracking-[.04em] text-white">RUNNING.</p>
          <p className="text-[clamp(2rem,6.5vw,6rem)] font-bold leading-[1.05] tracking-[.04em] text-[hsl(var(--green))]">MAINTAINED.</p>
        </div>
        <p
          className={`absolute inset-x-0 bottom-[9vh] px-[6vw] text-center text-[clamp(1rem,1.8vw,1.35rem)] text-[hsl(var(--pale))] transition-opacity delay-150 duration-500 ${
            lineOn ? "opacity-90" : "opacity-0"
          }`}
        >
          Predictable revenue is built through systems, not effort.
        </p>
      </div>
    </section>
  );
};
