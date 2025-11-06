import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, MapPin, Linkedin, Twitter, Youtube, Clock } from "lucide-react";

const Contact = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      if (data) setSettings(data);
    } catch (error) {
      console.error('Error loading business settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic values from settings or defaults
  const businessName = settings?.business_name || 'ANAMECHI Marketing';
  const email = settings?.email || 'info@anamechimarketing.com';
  const phoneTollFree = settings?.phone_toll_free || '866-752-7370';
  const phoneLocal = settings?.phone_local || '215-709-2159';
  const address = settings ? `${settings.address_street}, ${settings.address_city}, ${settings.address_state} ${settings.address_zip}` : '101 Lindenwood Dr STE 225, Malvern, PA 19355';
  const hoursMonFri = settings?.hours_monday_friday || '9:00 AM - 6:00 PM EST';
  const hoursSat = settings?.hours_saturday || '9:00 AM - 6:00 PM EST';
  const hoursSun = settings?.hours_sunday || 'Closed';

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://home.anamechimarketing.com/" },
      { "@type": "ListItem", "position": 2, "name": "Contact", "item": "https://home.anamechimarketing.com/contact/" }
    ]
  };

  const localBusinessSchema = settings ? {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": businessName,
    "url": "https://home.anamechimarketing.com",
    "telephone": phoneTollFree,
    "email": email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": settings.address_street,
      "addressLocality": settings.address_city,
      "addressRegion": settings.address_state,
      "postalCode": settings.address_zip,
      "addressCountry": "US"
    },
    "sameAs": [
      settings.linkedin_url,
      settings.twitter_url,
      settings.youtube_url
    ].filter(Boolean)
  } : null;

  return (
    <>
      <SEO
        title={`Contact ${businessName} - Get Your Marketing Strategy`}
        description={`Ready to transform your marketing? Contact ${businessName} for marketing automation, CRM setup, and digital strategy services.`}
        canonical="/contact"
        structuredData={localBusinessSchema ? [breadcrumbsSchema, localBusinessSchema] : [breadcrumbsSchema]}
      />

      <div className="container mx-auto px-4 py-12">
        <Breadcrumbs items={[{ name: "Contact", href: "/contact" }]} />

        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            Let's Transform Your Marketing
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Ready to automate smarter and scale with systems? Book a consultation to discuss your marketing strategy.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact Form */}
          <Card className="lg:col-span-2 border-border">
            <CardContent className="p-8">
              <form className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Dr. Jane Smith" className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="jane@example.com" className="mt-2" />
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="service">Service Interested In</Label>
                    <Input id="service" placeholder="AEO Strategy Audit" className="mt-2" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="message">Tell Us About Your Goals</Label>
                  <Textarea 
                    id="message" 
                    placeholder="I want to improve my brand's visibility in AI-powered search results..." 
                    className="mt-2 min-h-[150px]"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  Request Consultation
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6">
            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Get in Touch</h2>
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="space-y-3 text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Email</p>
                        <a href={`mailto:${email}`} className="text-sm hover:text-primary">
                          {email}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Phone</p>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-xs text-muted-foreground">Toll-Free: </span>
                            <a href={`tel:${phoneTollFree.replace(/[^0-9]/g, '')}`} className="hover:text-primary">
                              {phoneTollFree}
                            </a>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Local: </span>
                            <a href={`tel:${phoneLocal.replace(/[^0-9]/g, '')}`} className="hover:text-primary">
                              {phoneLocal}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Office</p>
                        <p className="text-sm">{address}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {!loading && (settings?.linkedin_url || settings?.twitter_url || settings?.youtube_url) && (
              <Card className="border-border bg-gradient-subtle">
                <CardContent className="p-6">
                  <h3 className="mb-4 text-lg font-semibold text-foreground">Connect With Us</h3>
                  <div className="flex gap-4">
                    {settings?.linkedin_url && (
                      <a 
                        href={settings.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                    )}
                    {settings?.twitter_url && (
                      <a 
                        href={settings.twitter_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                    {settings?.youtube_url && (
                      <a 
                        href={settings.youtube_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Youtube className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="mb-3 text-lg font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Office Hours (EST)
                </h3>
                {loading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Monday - Friday: {hoursMonFri}</p>
                    <p>Saturday: {hoursSat}</p>
                    <p>Sunday: {hoursSun}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
