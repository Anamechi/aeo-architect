import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const stats = [
  { value: "3x", label: "Avg. Citation Increase", context: "Within 90 days of AEO implementation" },
  { value: "150+", label: "Clients Served", context: "Service businesses and coaches" },
  { value: "95%", label: "Client Satisfaction", context: "Based on post-engagement surveys" },
  { value: "24/7", label: "AI Monitoring", context: "Across ChatGPT, Gemini, Perplexity" },
];

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-32">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-6 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 uppercase tracking-[0.15em] text-[11px]">
            <Sparkles className="mr-1.5 h-3 w-3" />
            AI Engine Optimization
          </Badge>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Get Your Brand{" "}
            <span className="text-primary">Cited</span> by
            <br />
            AI Models & Search Engines
          </h1>

          <p className="mb-6 text-lg text-muted-foreground md:text-xl max-w-3xl mx-auto">
            Position your service business as a trusted authority that ChatGPT, Gemini,
            Perplexity, and Google recommend — before your competitors get there first.
          </p>

          {/* Founder credential line */}
          <div className="mb-8 inline-block border-l-2 border-primary pl-4 text-left">
            <p className="text-sm text-muted-foreground">
              Built by <span className="text-foreground font-medium">Dr. Deanna Romulus, EdD, MBA</span> — AI strategist and revenue systems architect
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center mb-16">
            <Button asChild size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold">
              <a href="#citation-audit">
                Get Your Free Citation Audit
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-foreground/20 text-foreground hover:bg-foreground/5">
              <a href="#how-aeo-works">See How AEO Works</a>
            </Button>
          </div>

          {/* Stats bar */}
          <div className="border-t border-border pt-10">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-foreground md:text-4xl">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                  <div className="text-[10px] text-tertiary mt-1">{stat.context}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
