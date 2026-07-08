const ITEMS = [
  {
    title: "Retainer only",
    body: "We operate on retainer, not projects. A system needs an operator, and we stay in the seat. Installation is the beginning of the engagement, not the end.",
  },
  {
    title: "Capacity capped",
    body: "We work with a small number of retainer clients per quarter. When the roster is full, new applications wait for the next opening. Depth over volume, every time.",
  },
  {
    title: "Application based",
    body: "Fit comes first. Every engagement starts with an application and a fit call, so we only install where the system will hold. If we are not the right operators for your business, we will say so.",
  },
];

export const HowWeWorkSection = () => {
  return (
    <section id="how-we-work" className="bg-white px-5 py-24 md:px-12 md:py-32" aria-label="How we work">
      <div className="mx-auto grid max-w-[1240px] gap-12 md:grid-cols-[1fr_1.1fr] md:gap-20">
        <div>
          <p className="mb-4 text-[.85rem] font-bold uppercase tracking-[.4em] text-[hsl(var(--teal))]">How we work</p>
          <h2 className="text-[clamp(2.4rem,5.4vw,4.6rem)] font-bold leading-[1.05] text-[hsl(var(--indigo))]">
            Done-for-you.
            <br />
            Not done-with-you.
          </h2>
        </div>
        <div>
          {ITEMS.map((item) => (
            <div key={item.title} className="mb-11">
              <h3 className="mb-2.5 text-[clamp(1.25rem,2vw,1.6rem)] font-bold text-[hsl(var(--indigo))]">{item.title}</h3>
              <p className="max-w-[56ch] text-[clamp(1rem,1.45vw,1.15rem)] text-[hsl(var(--indigo))]/80">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Credibility strip: founder + certification, understated */}
      <div className="mx-auto mt-16 flex max-w-[1240px] flex-col items-center gap-8 border-t border-[hsl(245_66%_38%/.14)] pt-12 md:flex-row md:gap-12">
        <img
          src="/media/founder.jpg"
          loading="lazy"
          decoding="async"
          width={220}
          height={295}
          alt="Dr. Deanna Romulus, EdD, MBA, founder of ANAMECHI Marketing, in an editorial portrait in a bright modern office"
          className="w-[clamp(160px,18vw,220px)] flex-shrink-0 rounded-[26px] object-cover shadow-[0_14px_44px_hsl(245_66%_38%/.18)]"
        />
        <div className="text-center md:text-left">
          <p className="text-[clamp(1.3rem,2vw,1.7rem)] font-bold text-[hsl(var(--indigo))]">Dr. Deanna Romulus, EdD, MBA</p>
          <p className="mb-5 mt-1 text-[clamp(.92rem,1.3vw,1.05rem)] font-bold uppercase tracking-[.08em] text-[hsl(var(--teal))]">
            Founder, ANAMECHI Marketing
          </p>
          <div className="flex flex-col items-center gap-5 md:flex-row">
            <img
              src="/media/badge.png"
          loading="lazy"
          decoding="async"
              width={88}
              height={88}
              alt="Certified Artificial Intelligence Consultant badge issued by the International Association of Artificial Intelligence Consultants"
              className="h-[88px] w-[88px] flex-shrink-0 object-contain"
            />
            <p className="max-w-[52ch] text-[clamp(.98rem,1.4vw,1.12rem)] text-[hsl(var(--indigo))]/85">
              Led by a Certified Artificial Intelligence Consultant, International Association of
              Artificial Intelligence Consultants.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
