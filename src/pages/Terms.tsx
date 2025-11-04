import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";

const Terms = () => {
  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://home.anamechimarketing.com/" },
      { "@type": "ListItem", "position": 2, "name": "Terms of Service", "item": "https://home.anamechimarketing.com/terms/" }
    ]
  };

  return (
    <>
      <SEO
        title="Terms of Service - ANAMECHI Marketing"
        description="Review the terms and conditions for using ANAMECHI Marketing's services and website. Updated October 2025."
        canonical="/terms"
        structuredData={[breadcrumbsSchema]}
      />

      <div className="container mx-auto px-4 py-12">
        <Breadcrumbs items={[{ name: "Terms of Service", href: "/terms" }]} />

        <Card className="border-border">
          <CardContent className="p-8 md:p-12 prose prose-slate max-w-none">
            <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
            <p className="text-sm text-muted-foreground mb-8">Last Updated: October 30, 2025</p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using ANAMECHI Marketing's website and services, you accept and agree to be bound by these Terms of Service. If you do not agree, please discontinue use immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Services Provided</h2>
              <p className="text-muted-foreground">
                ANAMECHI Marketing offers AI Engine Optimization (AEO), SEO consulting, content strategy, marketing automation implementation, and related digital marketing services. Specific deliverables and timelines are defined in individual service agreements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Responsibilities</h2>
              <p className="text-muted-foreground mb-4">You agree to:</p>
              <ul className="text-muted-foreground space-y-2">
                <li>Provide accurate information when requested</li>
                <li>Use our services in compliance with applicable laws</li>
                <li>Not misuse, reverse-engineer, or redistribute our content or tools</li>
                <li>Respect intellectual property rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Intellectual Property</h2>
              <p className="text-muted-foreground">
                All content, methodologies, templates, and materials created by ANAMECHI Marketing remain our intellectual property unless otherwise specified in a written agreement. Clients receive usage licenses for deliverables as outlined in service contracts.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Payment Terms</h2>
              <p className="text-muted-foreground">
                Payment terms, refund policies, and cancellation procedures are detailed in individual service agreements. Generally, payments are due upon invoice receipt unless otherwise agreed.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                ANAMECHI Marketing provides services on an "as is" basis. While we strive for excellence, we do not guarantee specific outcomes such as search rankings, AI citations, or revenue increases. Our liability is limited to the fees paid for services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Termination</h2>
              <p className="text-muted-foreground">
                Either party may terminate services according to the terms in the service agreement. We reserve the right to refuse service or terminate access to our website for violations of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Contact Information</h2>
              <p className="text-muted-foreground">
                For questions about these Terms of Service, contact:{" "}
                <a href="mailto:legal@anamechimarketing.com" className="text-primary hover:underline">
                  legal@anamechimarketing.com
                </a>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Terms;
