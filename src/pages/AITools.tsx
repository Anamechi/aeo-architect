import { useState } from "react";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { ExternalLink, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const UNLOCK_KEY = "anamechi_tools_unlocked";
const AUDIT_CALL_URL =
  "https://link.anamechimarketing.com/widget/booking/F2DwBw7DMNUrl1HgiooQ?utm_source=ai_tools_hub";

const AITools = () => {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return localStorage.getItem(UNLOCK_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = "Full name is required";
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Please enter a valid email";
    if (!formData.phone.trim()) e.phone = "Phone number is required";
    else if (formData.phone.replace(/\D/g, "").length < 10) e.phone = "Please enter a valid phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("submit-contact-to-ghl", {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          service: "AI Tools Access",
          message: "[AI Tools Access] Requested access to the curated tools list.",
          formId: "ai-tools-gate",
        },
      });
      if (error) throw error;
    } catch {
      // Silently handle, unlock anyway; GHL will retry on its side
    } finally {
      try {
        localStorage.setItem(UNLOCK_KEY, "1");
      } catch {
        // private browsing: session-only unlock
      }
      window.fbq?.("track", "Lead");
      setUnlocked(true);
      setIsSubmitting(false);
    }
  };

  // Records the click without blocking navigation. The link itself is a normal anchor,
  // so the affiliate URL reaches the vendor exactly as provided.
  const trackToolClick = (toolName: string, toolUrl: string) => {
    void supabase
      .from('affiliate_clicks')
      .insert({
        tool_name: toolName,
        tool_url: toolUrl,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null
      })
      .then(({ error }) => {
        if (error) console.error('Error tracking click:', error);
      });
  };
  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://anamechimarketing.com/" },
      { "@type": "ListItem", "position": 2, "name": "AI Tools", "item": "https://anamechimarketing.com/ai-tools/" }
    ]
  };

  const tools = [
    {
      name: "ChatGPT",
      category: "AI Assistant",
      description: "OpenAI's conversational AI model for content generation, research, and problem-solving.",
      url: "https://chat.openai.com",
      useCase: "Content ideation, research, copywriting",
      freePath: "The free plan covers most of this. A paid plan adds higher limits.",
      affiliate: false
    },
    {
      name: "Perplexity AI",
      category: "AI Search",
      description: "AI-powered answer engine that provides cited, sourced responses to queries.",
      url: "https://perplexity.ai",
      useCase: "Research, fact-checking, citation tracking",
      freePath: "The free plan answers most research questions with citations.",
      affiliate: false
    },
    {
      name: "Google Gemini",
      category: "AI Assistant",
      description: "Google's multimodal AI model integrated with Google Workspace and search.",
      url: "https://gemini.google.com",
      useCase: "Google integration, multimodal tasks",
      freePath: "Free with a Google account. Works well if you already live in Google Workspace.",
      affiliate: false
    },
    {
      name: "Claude",
      category: "AI Assistant",
      description: "Anthropic's AI assistant known for long-context understanding and detailed analysis.",
      url: "https://claude.ai",
      useCase: "Long-form content, analysis, research",
      freePath: "The free plan handles most writing and analysis. A paid plan adds longer sessions.",
      affiliate: false
    },
    {
      name: "GoHighLevel",
      category: "Marketing Automation",
      description: "All-in-one CRM, funnel builder, and marketing automation platform for agencies.",
      url: "https://www.gohighlevel.com/?fp_ref=anamechi-marketing42",
      useCase: "Client management, funnels, automation",
      freePath: "A spreadsheet CRM, a free form tool, and a free calendar link cover the basics. Expect more manual work and no built in automation.",
      whyUse: "It keeps leads from falling through the cracks, though it takes real setup time to do well.",
      affiliate: true
    },
    {
      name: "Ahrefs",
      category: "SEO & AEO",
      description: "Comprehensive SEO toolset for backlink analysis, keyword research, and site audits.",
      url: "https://ahrefs.com",
      useCase: "SEO research, backlink tracking, content gaps",
      freePath: "Google Search Console and Bing Webmaster Tools are free and cover the essentials for a small site.",
      affiliate: false
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

        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            The tools I actually use, and what each one is for.
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
            Pick the job first, then the tool. Each one has a free or manual option, because the system
            matters more than the software.
          </p>
          <p
            className="mx-auto mt-4 max-w-3xl text-sm text-muted-foreground"
            data-testid="affiliate-disclosure"
          >
            Some links are affiliate links. I may earn a commission if you start a paid plan. It costs you
            nothing extra.{" "}
            <Link to="/ai-tools/affiliate-disclosure" className="underline hover:text-primary">
              Details here.
            </Link>
          </p>
        </div>

        {!unlocked ? (
          <Card className="mx-auto max-w-xl border-border shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-2xl">Unlock our favorite tools</CardTitle>
              <CardDescription className="text-base">
                This is the exact stack we run client systems on, with what each tool is for and a
                free option for each. Tell us where to send updates when the list changes and it is
                yours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <Label htmlFor="tools-name">Full name</Label>
                  <Input
                    id="tools-name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="tools-email">Email</Label>
                  <Input
                    id="tools-email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@company.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="tools-phone">Phone</Label>
                  <Input
                    id="tools-phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 555-5555"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone}</p>}
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary-hover"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Unlocking...
                    </>
                  ) : (
                    "Show me the tools"
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  We send occasional updates when our stack changes. No spam, unsubscribe anytime.
                </p>
              </form>
            </CardContent>
          </Card>
        ) : (
          <>
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
                  </div>
                  <CardDescription className="mt-3">{tool.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="mb-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Good for:</p>
                      <p className="text-sm text-muted-foreground">{tool.useCase}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Free option:</p>
                      <p className="text-sm text-muted-foreground">{tool.freePath}</p>
                    </div>
                    {tool.whyUse && (
                      <div>
                        <p className="text-sm font-medium text-foreground">Why I use it:</p>
                        <p className="text-sm text-muted-foreground">{tool.whyUse}</p>
                      </div>
                    )}
                    <p className="text-xs font-medium text-muted-foreground">
                      {tool.affiliate ? "Affiliate link" : "Not an affiliate"}
                    </p>
                    {tool.affiliate && (
                      <p className="text-sm text-muted-foreground" data-testid="inline-disclosure">
                        Full disclosure: I earn a commission if you start a paid plan through this link. It
                        costs you nothing extra.
                      </p>
                    )}
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <a
                      href={tool.url}
                      target="_blank"
                      rel={tool.affiliate ? "sponsored noopener" : "noopener"}
                      onClick={() => trackToolClick(tool.name, tool.url)}
                    >
                      See the tool <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          </>
        )}

        <Card className="mt-12 border-border bg-gradient-subtle">
          <CardContent className="p-8 text-center">
            <h2 className="mb-4 text-2xl font-bold text-foreground">
              Not sure which tool fits your business?
            </h2>
            <p className="mb-6 text-muted-foreground">
              Book a free AI audit call and we will look at where AI can help in your business, and which tools you do not need.
            </p>
            <Button size="lg" asChild>
              <a href={AUDIT_CALL_URL}>Book a free AI audit call</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AITools;
