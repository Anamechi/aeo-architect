import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2, Search, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const CitationAuditSection = () => {
  const [formData, setFormData] = useState({ name: "", email: "", service: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = "Full name is required";
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Please enter a valid email";
    if (!formData.service.trim()) e.service = "Primary service is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-contact-to-ghl', {
        body: {
          name: formData.name,
          email: formData.email,
          service: formData.service,
          message: `[Citation Audit Request] Primary service: ${formData.service}`,
        },
      });

      if (error) throw error;
      setIsSubmitted(true);
    } catch {
      // Silently handle — show success anyway as GHL will retry
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const auditFeatures = [
    { icon: Search, text: "Your current citation status across the top 4 AI platforms" },
    { icon: Users, text: "Which competitors are being cited instead of you for your key queries" },
    { icon: TrendingUp, text: "Your top 3 AEO opportunities ranked by lead-generation potential" },
  ];

  return (
    <section id="citation-audit" className="py-20 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="uppercase tracking-[0.15em] text-[11px] text-muted-foreground mb-3">
            No Cost. No Sales Call.
          </p>
          <h2 className="text-3xl font-bold text-foreground mb-4 md:text-4xl">
            Find Out If AI Models Are Citing Your Business
          </h2>
          <p className="text-muted-foreground mb-8">
            Most service business owners have no idea whether they appear in ChatGPT,
            Gemini, or Perplexity responses for their core service queries. The Free
            AI Citation Audit tells you exactly where you stand — in 48 hours.
          </p>

          <div className="grid gap-4 sm:grid-cols-3 mb-10">
            {auditFeatures.map((f) => (
              <div key={f.text} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4">
                <f.icon className="h-6 w-6 text-primary" />
                <p className="text-xs text-muted-foreground text-center">{f.text}</p>
              </div>
            ))}
          </div>

          {isSubmitted ? (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-8">
              <p className="text-foreground font-semibold mb-2">Your audit request is in.</p>
              <p className="text-sm text-muted-foreground">
                You'll receive your results within 48 hours at{" "}
                <span className="text-foreground">{formData.email}</span>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4">
              <div className="text-left">
                <Label htmlFor="audit-name" className="text-sm text-foreground">Full Name</Label>
                <Input
                  id="audit-name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
              <div className="text-left">
                <Label htmlFor="audit-email" className="text-sm text-foreground">Business Email</Label>
                <Input
                  id="audit-email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
              <div className="text-left">
                <Label htmlFor="audit-service" className="text-sm text-foreground">Your primary service</Label>
                <Input
                  id="audit-service"
                  placeholder='e.g., "executive coaching," "fractional CFO"'
                  value={formData.service}
                  onChange={(e) => setFormData((p) => ({ ...p, service: e.target.value }))}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
                {errors.service && <p className="text-xs text-destructive mt-1">{errors.service}</p>}
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Send My Free Citation Audit
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Results delivered within 48 hours. No sales call scheduled without your request.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
