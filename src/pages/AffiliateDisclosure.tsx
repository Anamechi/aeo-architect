import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";

const AUDIT_CALL_URL =
  "https://link.anamechimarketing.com/widget/booking/F2DwBw7DMNUrl1HgiooQ?utm_source=ai_tools_disclosure";

const AffiliateDisclosure = () => (
  <>
    <SEO
      title="How I Use Affiliate Links"
      description="Some tools on this site have affiliate links. Here is how that works, what it costs you, and how I decide what to list."
      canonical="/ai-tools/affiliate-disclosure"
    />
    <div className="container mx-auto px-4 py-12">
      <Breadcrumbs
        items={[
          { name: "AI Tools", href: "/ai-tools" },
          { name: "How I use affiliate links", href: "/ai-tools/affiliate-disclosure" },
        ]}
      />
      <article className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-4xl font-bold text-foreground">How I use affiliate links</h1>
        <div className="space-y-5 text-lg text-foreground">
          <p>
            Some of the tools on this site have affiliate links. If you start a paid plan through one of
            them, the company pays me a commission. It costs you nothing extra.
          </p>
          <p>
            I only list tools I use or would use in a client build. If a tool is a poor fit for your
            business, I will say so, and I will tell you what the free or manual option is.
          </p>
          <p>
            ANAMECHI Suite is my own company, so when I point you to Suite, that is my product and I will
            say so.
          </p>
          <p>Questions about any link? Book a free AI audit call and ask me directly.</p>
        </div>
        <div className="mt-8">
          <Button size="lg" asChild>
            <a href={AUDIT_CALL_URL}>Book a free AI audit call</a>
          </Button>
        </div>
        <p className="mt-10 text-xs text-muted-foreground">ANAMECHI Marketing, LLC</p>
      </article>
    </div>
  </>
);

export default AffiliateDisclosure;
