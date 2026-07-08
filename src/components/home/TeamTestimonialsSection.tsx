const REVIEWS = [
  {
    name: "Lucy",
    source: "Google review",
    quote:
      '"Working with Dr. Romulus at ANAMECHI Marketing has been a game-changer as I transition from social work to running my own business. Despite my lack of technical background, she guided me through complex processes like setting up automation, integrating platforms, and resolving account and billing issues with patience and clarity. ... If you\'re looking to streamline your processes and grow your business, ANAMECHI Marketing is the partner you need."',
  },
  {
    name: "Wesly Romulus",
    source: "Google review",
    quote:
      '"They took the time to understand my vision and goals, then delivered a strategy that exceeded my expectations. Their communication was clear, timely, and supportive throughout the entire process. ... Their expertise in branding, social media, and marketing strategies helped me see immediate results."',
  },
];

/**
 * Real people, real proof: the team photo plus verbatim excerpts of the two
 * five-star Google reviews. No invented testimonials, ever.
 */
export const TeamTestimonialsSection = () => {
  return (
    <section id="testimonials" className="bg-[hsl(var(--pale))] px-5 py-24 md:px-12 md:py-32" aria-label="The team and client testimonials">
      <div className="mx-auto mb-11 max-w-3xl text-center">
        <p className="mb-4 text-[.85rem] font-bold uppercase tracking-[.4em] text-[hsl(var(--teal))]">The team</p>
        <h2 className="text-[clamp(2.2rem,5vw,4.2rem)] font-bold leading-[1.05] text-[hsl(var(--indigo))]">
          Real people. In the seat. Every day.
        </h2>
      </div>

      <img
        src="/media/team.jpg"
        width={1600}
        height={904}
        alt="The ANAMECHI Marketing team of five gathered in a bright modern office"
        className="mx-auto mb-16 block w-full max-w-[1180px] rounded-[32px] shadow-[0_18px_60px_hsl(245_66%_38%/.18)]"
      />

      <div className="mx-auto mb-10 max-w-3xl text-center">
        <h3 className="text-[clamp(1.7rem,3.6vw,2.9rem)] font-bold text-[hsl(var(--indigo))]">Rated 5.0 on Google.</h3>
      </div>

      <div className="mx-auto grid max-w-[1180px] gap-6 md:grid-cols-2">
        {REVIEWS.map((review) => (
          <figure key={review.name} className="flex flex-col rounded-[26px] bg-white p-8 shadow-[0_6px_32px_hsl(245_66%_38%/.08)] md:p-11">
            <p className="mb-4 text-[1.25rem] tracking-[.3em] text-[hsl(var(--teal))]" aria-label="Five out of five stars">
              ★★★★★
            </p>
            <blockquote className="flex-1 text-[clamp(1rem,1.5vw,1.14rem)] leading-[1.7] text-[hsl(var(--indigo))]">
              {review.quote}
            </blockquote>
            <figcaption className="mt-6 flex flex-col gap-0.5">
              <strong className="text-[1.05rem] font-bold text-[hsl(var(--indigo))]">{review.name}</strong>
              <span className="text-[.88rem] font-bold uppercase tracking-[.08em] text-[hsl(var(--teal))]">{review.source}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
};
