import { useRef } from "react";
import { Link } from "react-router-dom";

interface Process {
  text: string;
  chip?: "Saves time" | "Saves money";
}

interface System {
  num: string;
  name: string;
  tagline: string;
  processes: Process[];
  crop: string; // object-position for the shared showreel clip
}

const SYSTEMS: System[] = [
  {
    num: "01",
    name: "Lead generation",
    tagline: "The system that fills the pipeline.",
    crop: "0% 0%",
    processes: [
      { text: "Content engines: social, email, and long-form publishing", chip: "Saves time" },
      { text: "Lead capture and nurture sequences that warm every inquiry" },
    ],
  },
  {
    num: "02",
    name: "Sales",
    tagline: "The system that converts without chasing.",
    crop: "100% 0%",
    processes: [
      { text: "CRM pipelines that track every contact" },
      { text: "Automated follow-up, so nothing slips through", chip: "Saves money" },
    ],
  },
  {
    num: "03",
    name: "Delivery",
    tagline: "The system that welcomes and serves every client.",
    crop: "0% 100%",
    processes: [
      { text: "AI-powered client onboarding and intake, no manual handoffs", chip: "Saves time" },
    ],
  },
  {
    num: "04",
    name: "Retention",
    tagline: "The system that keeps clients and compounds revenue.",
    crop: "100% 100%",
    processes: [
      { text: "Reporting dashboards that show what the engine is producing" },
      { text: "Revenue visibility, so decisions come from numbers", chip: "Saves money" },
    ],
  },
];

const SystemCard = ({ system }: { system: System }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const start = () => { videoRef.current?.play().catch(() => { /* hover preview is best-effort */ }); };
  const stop = () => videoRef.current?.pause();

  return (
    <article
      className="group relative flex min-h-[340px] items-end overflow-hidden rounded-[26px] bg-white shadow-[0_6px_32px_hsl(245_66%_38%/.10)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_18px_54px_hsl(245_66%_38%/.22)]"
      onMouseEnter={start}
      onMouseLeave={stop}
      onFocus={start}
      onBlur={stop}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full scale-[1.9] object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ objectPosition: system.crop }}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/media/system.mp4" type="video/mp4" />
      </video>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[hsl(246_70%_27%/.05)] to-[hsl(246_70%_27%/.78)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />

      <div className="relative z-10 p-7">
        <span className="mb-2 block text-[.85rem] font-bold tracking-[.3em] text-[hsl(var(--teal))]">{system.num}</span>
        <h3 className="mb-2 text-[clamp(1.4rem,2.2vw,1.9rem)] font-bold text-[hsl(var(--indigo))] transition-colors duration-300 group-hover:text-white">
          {system.name}
        </h3>
        <p className="text-[1.02rem] text-[hsl(var(--indigo))]/80 transition-colors duration-300 group-hover:text-[hsl(var(--pale))]">
          {system.tagline}
        </p>
        <ul className="mt-4 space-y-2.5">
          {system.processes.map((p) => (
            <li
              key={p.text}
              className="relative pl-[22px] text-[.96rem] text-[hsl(var(--indigo))]/85 transition-colors duration-300 group-hover:text-[hsl(var(--pale))] before:absolute before:left-0 before:top-[.55em] before:h-2 before:w-2 before:rounded-full before:bg-[hsl(var(--teal))]"
            >
              {p.text}
              {p.chip && (
                <span className="ml-1.5 inline-block whitespace-nowrap rounded-full bg-[hsl(var(--teal))] px-3 py-0.5 align-[1px] text-[.72rem] font-bold uppercase tracking-[.06em] text-white">
                  {p.chip}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
};

export const FourSystemsSection = () => {
  return (
    <section id="systems" className="bg-[hsl(var(--pale))] px-5 py-24 md:px-12 md:py-32" aria-label="What we install">
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <p className="mb-4 text-[.85rem] font-bold uppercase tracking-[.4em] text-[hsl(var(--teal))]">What we install</p>
        <h2 className="mb-5 text-[clamp(2.2rem,5vw,4.2rem)] font-bold leading-[1.05] text-[hsl(var(--indigo))]">
          Four systems. One revenue engine.
        </h2>
        <p className="speakable-summary text-[clamp(1.02rem,1.6vw,1.25rem)] text-[hsl(var(--indigo))]/80">
          Most business owners do not have a marketing problem. They have a structure problem. We design and
          build the four systems every company needs, then we run the processes inside them, starting
          with the ones that save you the most time and money.
        </p>
      </div>

      <div className="mx-auto grid max-w-[1180px] gap-6 md:grid-cols-2">
        {SYSTEMS.map((s) => (
          <SystemCard key={s.num} system={s} />
        ))}
      </div>

      <p className="mx-auto mt-7 max-w-[1180px] rounded-[26px] bg-[hsl(var(--indigo))] px-8 py-7 text-center text-[clamp(1rem,1.5vw,1.15rem)] text-[hsl(var(--pale))]">
        Underneath all four sits the AI and automation stack that connects them, so leads, clients,
        and numbers move without anyone pushing.{" "}
        <Link to="/services" className="font-bold text-[hsl(var(--teal))] underline-offset-4 hover:underline">
          See how each system is built
        </Link>
      </p>
    </section>
  );
};
