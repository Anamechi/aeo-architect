import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Bot, 
  Search, 
  Zap, 
  Target, 
  CheckCircle2,
  ArrowRight,
  FileText,
  BarChart3,
  Settings
} from "lucide-react";

const Services = () => {
  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://anamechi.com/" },
      { "@type": "ListItem", "position": 2, "name": "Services", "item": "https://anamechi.com/services/" }
    ]
  };

  const coreServices = [
    {
      icon: Bot,
      title: "AI Engine Optimization (AEO)",
      description: "Position your brand for AI citation across ChatGPT, Gemini, Perplexity, and other LLMs",
      features: [
        "Structured data implementation (JSON-LD schemas)",
        "Answer-first content formatting",
        "Citation hygiene and source management",
        "LLMs.txt corpus documentation",
        "AI model submission and monitoring"
      ],
      price: "From $2,500/month"
    },
    {
      icon: Search,
      title: "SEO & Content Strategy",
      description: "Rank in traditional search engines and AI overviews with EEAT-focused content",
      features: [
        "Technical SEO audits and optimization",
        "EEAT authority building",
        "Content silo architecture",
        "Featured snippet optimization",
        "Freshness and update management"
      ],
      price: "From $1,800/month"
    },
    {
      icon: Zap,
      title: "Marketing Automation",
      description: "Scale your operations with GoHighLevel CRM and workflow automation",
      features: [
        "GoHighLevel setup and configuration",
        "CRM pipeline design",
        "Workflow automation",
        "Email and SMS campaigns",
        "Attribution and analytics"
      ],
      price: "From $1,200/month"
    },
    {
      icon: Target,
      title: "Brand Visibility",
      description: "Build authority through strategic content, PR, and community engagement",
      features: [
        "Digital PR and link building",
        "Guest posting and podcast appearances",
        "Community Q&A seeding (Reddit, Quora)",
        "Social proof and testimonial management",
        "Reputation monitoring"
      ],
      price: "From $1,500/month"
    }
  ];

  const addOns = [
    {
      icon: FileText,
      title: "Content Production",
      description: "1 long-form article/week + 3 QA posts + monthly case study",
      price: "$800/month"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Custom dashboards, citation tracking, and competitive monitoring",
      price: "$400/month"
    },
    {
      icon: Settings,
      title: "Technical Maintenance",
      description: "Performance optimization, IndexNow, sitemap management",
      price: "$300/month"
    }
  ];

  return (
    <>
      <SEO
        title="AEO & Digital Marketing Services for Service Businesses"
        description="Comprehensive AI Engine Optimization, SEO, content strategy, and marketing automation services. Get your brand cited by AI models and search engines."
        canonical="/services"
        structuredData={[breadcrumbsSchema]}
      />

      <div className="container mx-auto px-4 py-12">
        <Breadcrumbs items={[{ name: "Services", href: "/services" }]} />

        {/* Hero */}
        <div className="mb-16 text-center">
          <Badge className="mb-4 bg-accent/10 text-accent hover:bg-accent/20">
            Comprehensive Marketing Solutions
          </Badge>
          <h1 className="mb-6 text-4xl font-bold text-foreground md:text-5xl">
            Services That Build AI-Citable Authority
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
            Strategic marketing services designed to position your service business as a trusted authority that AI models and search engines recommend.
          </p>
        </div>

        {/* Core Services */}
        <div className="mb-16">
          <h2 className="mb-12 text-3xl font-bold text-foreground">Core Services</h2>
          <div className="grid gap-8 lg:grid-cols-2">
            {coreServices.map((service) => (
              <Card key={service.title} className="border-border hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <service.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{service.title}</CardTitle>
                  <CardDescription className="text-base">{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="mb-6 space-y-3">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <CheckCircle2 className="mr-2 h-5 w-5 shrink-0 text-success mt-0.5" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <span className="text-lg font-semibold text-foreground">{service.price}</span>
                    <Button variant="outline" size="sm">
                      Learn More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Add-On Services */}
        <div className="mb-16">
          <h2 className="mb-12 text-3xl font-bold text-foreground">Add-On Services</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {addOns.map((addon) => (
              <Card key={addon.title} className="border-border">
                <CardHeader>
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <addon.icon className="h-5 w-5 text-accent" />
                  </div>
                  <CardTitle className="text-xl">{addon.title}</CardTitle>
                  <CardDescription>{addon.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-lg font-semibold text-foreground">{addon.price}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Industries */}
        <Card className="mb-16 border-border bg-gradient-subtle">
          <CardContent className="p-8 md:p-12">
            <h2 className="mb-6 text-3xl font-bold text-foreground text-center">
              Industries We Serve
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {["Business Consultants", "Executive Coaches", "Marketing Agencies", "Financial Advisors", "Healthcare Practitioners", "Legal Professionals"].map((industry) => (
                <div key={industry} className="rounded-lg bg-background p-4 text-center border border-border">
                  <span className="font-medium text-foreground">{industry}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="border-border bg-gradient-primary shadow-glow">
          <CardContent className="p-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mb-8 text-lg text-primary-foreground/90 max-w-2xl mx-auto">
              Schedule a consultation to discuss your goals and create a custom AEO strategy for your business.
            </p>
            <Button asChild size="lg" className="bg-accent hover:bg-accent-hover text-accent-foreground">
              <Link to="/contact">
                Schedule Consultation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Services;
