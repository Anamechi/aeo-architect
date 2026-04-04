import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { generateSpeakableSchema, generateLocalBusinessSchema } from "@/utils/schemas";
import { HeroSection } from "@/components/home/HeroSection";
import { SocialProofSection } from "@/components/home/SocialProofSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { HowAEOWorksSection } from "@/components/home/HowAEOWorksSection";
import { WhyANAMECHISection } from "@/components/home/WhyANAMECHISection";
import { CitationAuditSection } from "@/components/home/CitationAuditSection";
import { BottomCTASection } from "@/components/home/BottomCTASection";

const Home = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ANAMECHI Marketing",
    "url": "https://home.anamechimarketing.com",
    "logo": "https://home.anamechimarketing.com/anamechi-logo.svg",
    "sameAs": [
      "https://www.linkedin.com/in/deannaromulus",
      "https://x.com/anamechi",
      "https://www.youtube.com/@ANAMECHI"
    ],
    "founder": {
      "@type": "Person",
      "name": "Dr. Deanna Romulus",
      "jobTitle": "Founder, Visionary Strategist",
      "sameAs": ["https://www.linkedin.com/in/deannaromulus"]
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://home.anamechimarketing.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://home.anamechimarketing.com/search?q={query}",
      "query-input": "required name=query"
    }
  };

  return (
    <>
      <SEO
        title="AI Engine Optimization & Digital Marketing for Service Businesses"
        description="Position your brand as an AI-citable authority. Get recommended by ChatGPT, Gemini, and search engines with AEO-optimized content and strategic marketing automation."
        canonical="/"
        structuredData={[organizationSchema, websiteSchema, generateLocalBusinessSchema(), generateSpeakableSchema("https://home.anamechimarketing.com/", ['h1', '.speakable-summary'])]}
      />

      <HeroSection />
      <SocialProofSection />
      <ServicesSection />
      <HowAEOWorksSection />
      <WhyANAMECHISection />
      <CitationAuditSection />
      <BottomCTASection />

      {/* Discreet Admin Access */}
      <div className="py-4 text-center">
        <Link
          to="/admin"
          className="text-xs text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
        >
          •
        </Link>
      </div>
    </>
  );
};

export default Home;
