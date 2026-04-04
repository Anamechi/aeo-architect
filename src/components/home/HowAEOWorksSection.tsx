import { Search, Layers, BarChart3 } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Search,
    title: "Diagnose",
    subtitle: "AI Citation Audit",
    description:
      "We analyze your current footprint across ChatGPT, Gemini, Perplexity, and Google AI Overviews. You see exactly where you stand, which competitors are being cited instead of you, and which queries are your highest-value opportunities.",
  },
  {
    num: "02",
    icon: Layers,
    title: "Build",
    subtitle: "Authority Infrastructure",
    description:
      "We build EEAT-structured content targeting your highest-value queries — formatted with schema markup, citation anchors, and the specific signals that language models use to identify credible expert sources.",
  },
  {
    num: "03",
    icon: BarChart3,
    title: "Monitor",
    subtitle: "Continuous Citation Tracking",
    description:
      "Monthly reporting shows citation growth across AI platforms, featured snippet performance, and emerging query opportunities. You see the numbers. Not vanity metrics — citation volume, source attribution, and lead source data.",
  },
];

export const HowAEOWorksSection = () => {
  return (
    <section id="how-aeo-works" className="py-20 border-t border-border">
      <div className="container mx-auto px-4">
        <p className="text-center uppercase tracking-[0.15em] text-[11px] text-muted-foreground mb-3">
          The Mechanism
        </p>
        <h2 className="text-3xl font-bold text-foreground text-center mb-6 md:text-4xl">
          Why AI Models Cite Some Businesses — and Ignore Most
        </h2>
        <p className="mx-auto max-w-3xl text-center text-muted-foreground mb-16">
          AI models like ChatGPT don't surface businesses at random. They cite sources
          that demonstrate verifiable expertise, consistent authority signals, and structured
          content written in formats LLMs are trained to recognize and trust. Most service
          businesses are invisible to AI — not because they aren't good at what they do,
          but because their content isn't structured the way language models retrieve information.
          <span className="block mt-2 text-foreground font-medium">AEO fixes that at the infrastructure level.</span>
        </p>

        <div className="grid gap-8 md:grid-cols-3 mb-12">
          {steps.map((step) => (
            <div key={step.num} className="rounded-lg border border-border bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-bold text-primary">{step.num}</span>
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">{step.title}</h3>
              <p className="text-sm text-primary mb-3">{step.subtitle}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Distinction callout */}
        <div className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-6 border-l-4 border-l-primary">
          <p className="uppercase tracking-[0.15em] text-[10px] text-muted-foreground mb-2">
            Important Distinction
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="text-foreground font-medium">AEO is not SEO renamed.</span>{" "}
            Traditional SEO optimizes for keyword ranking in search results pages. AEO optimizes
            for citation in AI-generated answers — a fundamentally different retrieval mechanism
            that requires different content structure, different authority signals, and different measurement.
          </p>
        </div>
      </div>
    </section>
  );
};
