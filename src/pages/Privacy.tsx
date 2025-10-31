import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";

const Privacy = () => {
  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://anamechi.com/" },
      { "@type": "ListItem", "position": 2, "name": "Privacy Policy", "item": "https://anamechi.com/privacy/" }
    ]
  };

  return (
    <>
      <SEO
        title="Privacy Policy - ANAMECHI Marketing"
        description="Learn how ANAMECHI Marketing collects, uses, and protects your personal information. Updated October 2025."
        canonical="/privacy"
        structuredData={[breadcrumbsSchema]}
      />

      <div className="container mx-auto px-4 py-12">
        <Breadcrumbs items={[{ name: "Privacy Policy", href: "/privacy" }]} />

        <Card className="border-border">
          <CardContent className="p-8 md:p-12 prose prose-slate max-w-none">
            <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mb-8">Last Updated: October 30, 2025</p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground mb-4">
                ANAMECHI Marketing collects information you provide directly, including name, email, phone number, and business details when you:
              </p>
              <ul className="text-muted-foreground space-y-2">
                <li>Submit contact forms or consultation requests</li>
                <li>Subscribe to our newsletter or blog updates</li>
                <li>Register for webinars or download resources</li>
                <li>Engage with our services or support</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">We use your information to:</p>
              <ul className="text-muted-foreground space-y-2">
                <li>Respond to inquiries and provide requested services</li>
                <li>Send educational content, updates, and marketing communications</li>
                <li>Improve our website, content, and service offerings</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Data Sharing & Disclosure</h2>
              <p className="text-muted-foreground">
                We do not sell your personal information. We may share data with trusted service providers (email platforms, CRM systems, analytics tools) who assist in our operations, under strict confidentiality agreements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Cookies & Tracking</h2>
              <p className="text-muted-foreground">
                We use cookies and similar technologies to analyze site traffic, personalize content, and improve user experience. You can manage cookie preferences through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Your Rights</h2>
              <p className="text-muted-foreground mb-4">You have the right to:</p>
              <ul className="text-muted-foreground space-y-2">
                <li>Access, correct, or delete your personal data</li>
                <li>Opt out of marketing communications</li>
                <li>Request data portability</li>
                <li>Lodge a complaint with a supervisory authority</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Data Security</h2>
              <p className="text-muted-foreground">
                We implement industry-standard security measures to protect your information. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Contact Us</h2>
              <p className="text-muted-foreground">
                For privacy-related questions or requests, contact us at:{" "}
                <a href="mailto:privacy@anamechi.com" className="text-primary hover:underline">
                  privacy@anamechi.com
                </a>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Privacy;
