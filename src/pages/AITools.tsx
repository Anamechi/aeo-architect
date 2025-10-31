import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Star } from "lucide-react";

const AITools = () => {
  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://anamechi.com/" },
      { "@type": "ListItem", "position": 2, "name": "AI Tools", "item": "https://anamechi.com/ai-tools/" }
    ]
  };

  const tools = [
    {
      name: "ChatGPT",
      category: "AI Assistant",
      description: "OpenAI's conversational AI model for content generation, research, and problem-solving.",
      rating: 5,
      url: "https://chat.openai.com",
      useCase: "Content ideation, research, copywriting"
    },
    {
      name: "Perplexity AI",
      category: "AI Search",
      description: "AI-powered answer engine that provides cited, sourced responses to queries.",
      rating: 5,
      url: "https://perplexity.ai",
      useCase: "Research, fact-checking, citation tracking"
    },
    {
      name: "Google Gemini",
      category: "AI Assistant",
      description: "Google's multimodal AI model integrated with Google Workspace and search.",
      rating: 4,
      url: "https://gemini.google.com",
      useCase: "Google integration, multimodal tasks"
    },
    {
      name: "Claude",
      category: "AI Assistant",
      description: "Anthropic's AI assistant known for long-context understanding and detailed analysis.",
      rating: 5,
      url: "https://claude.ai",
      useCase: "Long-form content, analysis, research"
    },
    {
      name: "GoHighLevel",
      category: "Marketing Automation",
      description: "All-in-one CRM, funnel builder, and marketing automation platform for agencies.",
      rating: 5,
      url: "https://gohighlevel.com",
      useCase: "Client management, funnels, automation"
    },
    {
      name: "Ahrefs",
      category: "SEO & AEO",
      description: "Comprehensive SEO toolset for backlink analysis, keyword research, and site audits.",
      rating: 5,
      url: "https://ahrefs.com",
      useCase: "SEO research, backlink tracking, content gaps"
    }
  ];

  return (
    <>
      <SEO
        title="AI Marketing Tools - Curated by ANAMECHI Experts"
        description="Discover vetted AI tools, marketing automation platforms, and SEO software recommended by ANAMECHI Marketing for building AI-citable authority."
        canonical="/ai-tools"
        structuredData={[breadcrumbsSchema]}
      />

      <div className="container mx-auto px-4 py-12">
        <Breadcrumbs items={[{ name: "AI Tools", href: "/ai-tools" }]} />

        <div className="mb-12 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
            Curated & Tested
          </Badge>
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            AI & Marketing Tools We Trust
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
            Every tool listed here has been tested by our team. We use these daily to deliver AEO results, automate marketing workflows, and build authoritative content.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Card key={tool.name} className="border-border flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{tool.name}</CardTitle>
                    <Badge variant="outline" className="mt-2">
                      {tool.category}
                    </Badge>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: tool.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
                <CardDescription className="mt-3">{tool.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="mb-4">
                  <p className="text-sm font-medium text-foreground">Best For:</p>
                  <p className="text-sm text-muted-foreground">{tool.useCase}</p>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <a href={tool.url} target="_blank" rel="noopener noreferrer">
                    Visit Tool <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-12 border-border bg-gradient-subtle">
          <CardContent className="p-8 text-center">
            <h2 className="mb-4 text-2xl font-bold text-foreground">
              Need Tool Recommendations?
            </h2>
            <p className="mb-6 text-muted-foreground">
              Our team evaluates new tools monthly. Get personalized recommendations for your marketing stack.
            </p>
            <Button size="lg" asChild>
              <a href="/contact">Request Tool Audit</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AITools;
