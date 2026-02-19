import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import { 
  Bot, 
  Search, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Target,
  Zap
} from "lucide-react";
import { generateSpeakableSchema, generateLocalBusinessSchema } from "@/utils/schemas";

const Home = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ANAMECHI Marketing",
    "url": "https://home.anamechimarketing.com",
    "logo": "https://home.anamechimarketing.com/assets/logo.png",
    "sameAs": [
      "https://www.linkedin.com/in/deannaromulus",
      "https://x.com/anamechi",
      "https://www.youtube.com/@ANAMECHI"
    ],
    "founder": {
      "@type": "Person",
      "name": "Dr. Deanna Romulus",
      "jobTitle": "Founder, Visionary Strategist",
      "sameAs": ["https://www.linkedin.com/in/deannaromulus"]
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://home.anamechimarketing.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://home.anamechimarketing.com/search?q={query}",
      "query-input": "required name=query"
    }
  };

  const services = [
    {
      icon: Bot,
      title: "AI Engine Optimization (AEO)",
      description: "Get your brand cited by ChatGPT, Gemini, Perplexity, and other AI models with structured content that LLMs love."
    },
    {
      icon: Search,
      title: "SEO & Content Strategy",
      description: "Rank in search engines and AI overviews with EEAT-focused content, schema markup, and technical optimization."
    },
    {
      icon: Zap,
      title: "Marketing Automation",
      description: "Scale your operations with GoHighLevel CRMs, workflow automation, and attribution systems that drive results."
    },
    {
      icon: Target,
      title: "Brand Visibility",
      description: "Build authority through strategic content, digital PR, and community engagement that establishes you as the expert."
    }
  ];

  const stats = [
    { value: "3x", label: "Avg. Citation Increase" },
    { value: "150+", label: "Clients Served" },
    { value: "95%", label: "Client Satisfaction" },
    { value: "24/7", label: "AI Monitoring" }
  ];

  const benefits = [
    "Featured in AI chat responses and answer boxes",
    "Structured data implementation across all pages",
    "EEAT-focused content that builds authority",
    "Technical SEO and performance optimization",
    "Regular content audits and freshness updates",
    "Full-funnel marketing automation"
  ];

  return (
    <>
      <SEO
        title="AI Engine Optimization & Digital Marketing for Service Businesses"
        description="Position your brand as an AI-citable authority. Get recommended by ChatGPT, Gemini, and search engines with AEO-optimized content and strategic marketing automation."
        canonical="/"
        structuredData={[organizationSchema, websiteSchema, generateLocalBusinessSchema(), generateSpeakableSchema("https://home.anamechimarketing.com/", ['h1', '.speakable-summary'])]}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-32">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6 bg-accent/10 text-accent hover:bg-accent/20 border-accent/20">
              <Sparkles className="mr-1 h-3 w-3" />
              AI-Citable Marketing Authority
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-primary-foreground md:text-6xl">
              Get Your Brand Cited by AI Models & Search Engines
            </h1>
            <p className="mb-8 text-xl text-primary-foreground/90 md:text-2xl">
              Position your service business as a trusted authority that ChatGPT, Gemini, Perplexity, and Google recommend in answers and overviews.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="bg-accent hover:bg-accent-hover text-accent-foreground">
                <Link to="/contact">
                  Start Your AEO Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/about">Learn Our Method</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
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
              <Card key={service.title} className="border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <service.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{service.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button asChild size="lg" variant="outline">
              <Link to="/services">
                View All Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gradient-subtle py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4 md:text-4xl">
                Why Service Businesses Choose ANAMECHI
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We don't just optimize for search engines—we optimize for the AI models and answer engines that are reshaping how people discover experts and services.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start">
                    <CheckCircle2 className="mr-3 h-6 w-6 shrink-0 text-success" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-8 bg-gradient-primary">
                <Link to="/about">
                  Discover Our Approach
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5 text-primary" />
                    EEAT Authority
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Build Experience, Expertise, Authoritativeness, and Trustworthiness with structured content, credentials, and citations.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5 text-success" />
                    Measurable Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Track your citation health, featured snippets, and AI mentions with our comprehensive monitoring and reporting.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="border-border bg-gradient-primary shadow-glow">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold text-primary-foreground mb-4 md:text-4xl">
                Ready to Become an AI-Citable Authority?
              </h2>
              <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                Let's build a marketing strategy that gets your brand recommended by AI models and search engines.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="bg-accent hover:bg-accent-hover text-accent-foreground">
                  <Link to="/contact">Schedule a Consultation</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  <Link to="/blog">Read Our Blog</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Discreet Admin Access */}
      <div className="py-4 text-center">
        <Link 
          to="/admin" 
          className="text-xs text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
        >
          •
        </Link>
      </div>
    </>
  );
};

export default Home;
