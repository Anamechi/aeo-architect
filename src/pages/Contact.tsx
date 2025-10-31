import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Linkedin, Twitter, Youtube } from "lucide-react";

const Contact = () => {
  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://anamechi.com/" },
      { "@type": "ListItem", "position": 2, "name": "Contact", "item": "https://anamechi.com/contact/" }
    ]
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "ANAMECHI Marketing",
    "url": "https://anamechi.com",
    "telephone": "+1-800-990-3623",
    "email": "contact@anamechi.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Plano",
      "addressRegion": "TX",
      "postalCode": "75025",
      "addressCountry": "US"
    },
    "sameAs": [
      "https://www.linkedin.com/in/deannaromulus",
      "https://x.com/anamechi",
      "https://www.youtube.com/@ANAMECHI"
    ]
  };

  return (
    <>
      <SEO
        title="Contact ANAMECHI Marketing - Get Your AEO Strategy"
        description="Ready to become an AI-cited authority? Contact Dr. Deanna Romulus and the ANAMECHI team for AI Engine Optimization, SEO, and marketing automation services."
        canonical="/contact"
        structuredData={[breadcrumbsSchema, localBusinessSchema]}
      />

      <div className="container mx-auto px-4 py-12">
        <Breadcrumbs items={[{ name: "Contact", href: "/contact" }]} />

        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            Let's Build Your AI-Citable Authority
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Ready to get cited by ChatGPT, Perplexity, and other AI models? Book a consultation to discuss your AEO strategy.
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
                <div className="space-y-3 text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Email</p>
                      <a href="mailto:contact@anamechi.com" className="text-sm hover:text-primary">
                        contact@anamechi.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Phone</p>
                      <a href="tel:+18009903623" className="text-sm hover:text-primary">
                        +1 (800) 990-3623
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Office</p>
                      <p className="text-sm">Plano, TX 75025</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-gradient-subtle">
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">Connect With Us</h3>
                <div className="flex gap-4">
                  <a 
                    href="https://www.linkedin.com/in/deannaromulus" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a 
                    href="https://x.com/anamechi" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a 
                    href="https://www.youtube.com/@ANAMECHI" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Youtube className="h-5 w-5" />
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="mb-3 text-lg font-semibold text-foreground">Office Hours</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Monday - Friday: 9am - 6pm CST</p>
                  <p>Saturday: By appointment</p>
                  <p>Sunday: Closed</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
