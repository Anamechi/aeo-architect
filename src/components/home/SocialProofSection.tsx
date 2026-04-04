import { CheckCircle2 } from "lucide-react";

const testimonials = [
  {
    quote: "Within 6 weeks of ANAMECHI's AEO implementation, my firm started appearing in Perplexity answers for my core service queries. I had never shown up in an AI response before.",
    name: "M. Thompson",
    role: "Executive Business Strategist",
    badge: "Now cited in Perplexity",
    initials: "MT",
    placeholder: "<!-- PLACEHOLDER: Replace with real client testimonial - M. Thompson -->",
  },
  {
    quote: "ANAMECHI structured our content specifically for how LLMs retrieve authority signals. Three months later, a prospective client told me they found us through a ChatGPT recommendation. That had never happened before.",
    name: "J. Rivera",
    role: "Fractional CFO Services",
    badge: "Now cited in ChatGPT",
    initials: "JR",
    placeholder: "<!-- PLACEHOLDER: Replace with real client testimonial - J. Rivera -->",
  },
  {
    quote: "The citation monitoring dashboard alone made the investment worth it. We can now see exactly which AI models are mentioning us and for what queries.",
    name: "D. Okafor",
    role: "Business Consulting Group",
    badge: "Now cited in Gemini",
    initials: "DO",
    placeholder: "<!-- PLACEHOLDER: Replace with real client testimonial - D. Okafor -->",
  },
];

export const SocialProofSection = () => {
  return (
    <section className="py-16 border-b border-border">
      <div className="container mx-auto px-4">
        <p className="text-center uppercase tracking-[0.15em] text-[11px] text-muted-foreground mb-10">
          Results From the Field
        </p>

        {/* PLACEHOLDER: Replace testimonial copy with real client quotes before launch */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-lg border border-border bg-card p-6 flex flex-col justify-between"
            >
              <blockquote className="text-sm text-muted-foreground leading-relaxed mb-6">
                "{t.quote}"
              </blockquote>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold shrink-0">
                  {t.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-medium text-accent shrink-0">
                  <CheckCircle2 className="h-3 w-3" />
                  {t.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
