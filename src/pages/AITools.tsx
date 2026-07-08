import { useState } from "react";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Star, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const UNLOCK_KEY = "anamechi_tools_unlocked";

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

  const handleToolClick = async (toolName: string, toolUrl: string) => {
    try {
      await supabase.from('affiliate_clicks').insert({
        tool_name: toolName,
        tool_url: toolUrl,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
    window.open(toolUrl, '_blank');
  };
  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://home.anamechimarketing.com/" },
      { "@type": "ListItem", "position": 2, "name": "AI Tools", "item": "https://home.anamechimarketing.com/ai-tools/" }
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
      url: "https://www.gohighlevel.com/?fp_ref=anamechi-marketing42",
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

        {!unlocked ? (
          <Card className="mx-auto max-w-xl border-border shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-2xl">Unlock our favorite tools</CardTitle>
              <CardDescription className="text-base">
                This is the exact stack we run client systems on, with our honest ratings and what
                each tool is best for. Tell us where to send updates when the list changes and it is
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
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleToolClick(tool.name, tool.url)}
                  >
                    Visit Tool <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
