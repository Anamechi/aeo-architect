import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Users, TrendingUp, ArrowRight } from "lucide-react";

const benefits = [
  "Featured in AI chat responses and answer boxes",
  "Structured data implementation across all pages",
  "EEAT-focused content that builds authority",
  "Technical SEO and performance optimization",
  "Regular content audits and freshness updates",
  "Full-funnel marketing automation",
];

export const WhyANAMECHISection = () => {
  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4 md:text-4xl">
              Why Service Businesses Choose ANAMECHI
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              We don't just optimize for search engines — we optimize for the AI models and answer engines that are reshaping how people discover experts and services.
            </p>
            <ul className="space-y-4 mb-8">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start">
                  <CheckCircle2 className="mr-3 h-5 w-5 shrink-0 text-accent mt-0.5" />
                  <span className="text-foreground text-sm">{benefit}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground">
              <Link to="/about">
                Discover Our Approach
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            {/* Founder credential block */}
            <div className="mt-12 border-t border-border pt-8">
              <p className="uppercase tracking-[0.15em] text-[10px] text-muted-foreground mb-4">
                About the Founder
              </p>
              <div className="flex gap-6 items-start flex-col md:flex-row">
                {/* PLACEHOLDER: Replace with Dr. Romulus headshot (circular, 200px) */}
                <div className="h-28 w-28 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center shrink-0 mx-auto md:mx-0">
                  <span className="text-2xl font-bold text-primary">DR</span>
                </div>
                <div>
                  <p className="text-foreground font-bold">Dr. Deanna Romulus, EdD, MBA</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Founder, ANAMECHI Marketing | AI Strategist | Revenue Systems Architect
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Dr. Deanna Romulus holds an EdD in Educational Leadership and an MBA —
                    credentials she applies directly to how ANAMECHI builds client authority
                    systems. She is an active member of the AI Power Circle Mastermind and
                    holds CAAL certification in applied AI leadership. Her methodology — the
                    DDS Framework™ (Diagnose, Design, Scale) — is the structural backbone
                    of every ANAMECHI engagement.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  EEAT Authority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Build Experience, Expertise, Authoritativeness, and Trustworthiness with structured content, credentials, and citations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <TrendingUp className="mr-2 h-5 w-5 text-accent" />
                  Measurable Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Track your citation health, featured snippets, and AI mentions with our comprehensive monitoring and reporting.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
