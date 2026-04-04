import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Search, Zap, Target, ArrowRight } from "lucide-react";

const services = [
  {
    icon: Bot,
    title: "AI Engine Optimization (AEO)",
    description: "Get your brand cited by ChatGPT, Gemini, Perplexity, and other AI models with structured content that LLMs love.",
  },
  {
    icon: Search,
    title: "SEO & Content Strategy",
    description: "Rank in search engines and AI overviews with EEAT-focused content, schema markup, and technical optimization.",
  },
  {
    icon: Zap,
    title: "Marketing Automation",
    description: "Scale your operations with GoHighLevel CRMs, workflow automation, and attribution systems that drive results.",
  },
  {
    icon: Target,
    title: "Brand Visibility",
    description: "Build authority through strategic content, digital PR, and community engagement that establishes you as the expert.",
  },
];

export const ServicesSection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4 md:text-4xl">
            Strategic Marketing That AI Models Trust
          </h2>
          <p className="text-lg text-muted-foreground">
            We combine AI Engine Optimization, traditional SEO, and marketing automation to make your brand the go-to authority in your space.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <Card key={service.title} className="border-border bg-card hover:border-primary/30 transition-colors">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl text-foreground">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-muted-foreground">{service.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild size="lg" variant="outline" className="border-foreground/20 text-foreground hover:bg-foreground/5">
            <Link to="/services">
              View All Services
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            All services include GHL CRM integration, n8n workflow automation, and monthly citation reporting.
          </p>
        </div>
      </div>
    </section>
  );
};
