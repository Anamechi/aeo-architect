import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, BookOpen, Target, Users } from "lucide-react";

const About = () => {
  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://anamechi.com/" },
      { "@type": "ListItem", "position": 2, "name": "About", "item": "https://anamechi.com/about/" }
    ]
  };

  const expertise = [
    {
      icon: Target,
      title: "AEO Pioneer",
      description: "Leading the industry in AI Engine Optimization strategies that get brands cited by LLMs and answer engines."
    },
    {
      icon: BookOpen,
      title: "Content Authority",
      description: "Creating EEAT-focused content with structured data, citations, and regular freshness updates."
    },
    {
      icon: Users,
      title: "Service Business Focus",
      description: "Specialized in consultants, coaches, and service providers who need to establish thought leadership."
    },
    {
      icon: Award,
      title: "Proven Results",
      description: "150+ successful implementations with measurable improvements in AI citations and organic visibility."
    }
  ];

  return (
    <>
      <SEO
        title="About ANAMECHI Marketing - AI Engine Optimization Experts"
        description="Meet Dr. Deanna Romulus and the ANAMECHI team. We specialize in AI Engine Optimization (AEO), helping service businesses become trusted authorities that AI models and search engines cite."
        canonical="/about"
        structuredData={[breadcrumbsSchema]}
      />

      <div className="container mx-auto px-4 py-12">
        <Breadcrumbs items={[{ name: "About", href: "/about" }]} />

        {/* Hero */}
        <div className="mb-16 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
            Experience • Expertise • Authority • Trust
          </Badge>
          <h1 className="mb-6 text-4xl font-bold text-foreground md:text-5xl">
            Building AI-Citable Authorities
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
            ANAMECHI Marketing was founded on a simple mission: help service businesses become the trusted authorities that AI models and search engines recommend in their answers.
          </p>
        </div>

        {/* Founder Section */}
        <Card className="mb-16 border-border">
          <CardContent className="p-8 md:p-12">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              <div>
                <h2 className="mb-4 text-3xl font-bold text-foreground">
                  Meet Dr. Deanna Romulus
                </h2>
                <p className="mb-4 text-lg text-foreground">
                  Founder & Visionary Strategist
                </p>
                <p className="mb-4 text-muted-foreground">
                  Dr. Deanna Romulus founded ANAMECHI Marketing after recognizing the seismic shift in how people discover experts and services. With the rise of ChatGPT, Gemini, Perplexity, and other AI models, traditional SEO was no longer enough.
                </p>
                <p className="mb-4 text-muted-foreground">
                  Drawing on years of experience in digital marketing, content strategy, and marketing automation, Dr. Romulus developed the AEO methodology—a comprehensive approach that combines structured data, EEAT principles, and citation-worthy content to position brands as AI-recommended authorities.
                </p>
                <p className="text-muted-foreground">
                  Today, ANAMECHI Marketing serves consultants, coaches, and service businesses worldwide, helping them get cited by AI models while building sustainable, authoritative online presences.
                </p>
              </div>
              <div className="space-y-4">
                <div className="rounded-lg bg-gradient-primary p-6 text-primary-foreground">
                  <h3 className="mb-2 text-xl font-semibold">Credentials & Experience</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• PhD in Strategic Communication</li>
                    <li>• 15+ years in digital marketing</li>
                    <li>• Certified GoHighLevel Expert</li>
                    <li>• Published author on AEO strategies</li>
                    <li>• Featured speaker at marketing conferences</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-accent/10 p-6 border border-accent/20">
                  <h3 className="mb-2 text-xl font-semibold text-foreground">Connect</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <a href="https://www.linkedin.com/in/deannaromulus" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LinkedIn Profile</a></li>
                    <li>• <a href="https://x.com/anamechi" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Twitter/X</a></li>
                    <li>• <a href="https://www.youtube.com/@ANAMECHI" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">YouTube Channel</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expertise Grid */}
        <div className="mb-16">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
            Our Core Expertise
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {expertise.map((item) => (
              <Card key={item.title} className="border-border">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Methodology */}
        <Card className="border-border bg-gradient-subtle">
          <CardContent className="p-8 md:p-12">
            <h2 className="mb-6 text-3xl font-bold text-foreground">
              The ANAMECHI Methodology
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">1. Foundation</h3>
                <p className="text-muted-foreground">
                  Technical infrastructure, structured data implementation, and citation hygiene to ensure AI models can discover and trust your content.
                </p>
              </div>
              <div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">2. Authority</h3>
                <p className="text-muted-foreground">
                  EEAT-focused content creation, expert reviewer network, case studies, and digital PR to establish credibility and expertise.
                </p>
              </div>
              <div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">3. Optimization</h3>
                <p className="text-muted-foreground">
                  Continuous monitoring, freshness updates, performance tracking, and citation health audits to maintain and improve AI visibility.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default About;
