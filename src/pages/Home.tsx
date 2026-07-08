import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { generateSpeakableSchema, generateLocalBusinessSchema } from "@/utils/schemas";
import { CinematicHero } from "@/components/home/CinematicHero";
import { KineticManifesto } from "@/components/home/KineticManifesto";
import { FourSystemsSection } from "@/components/home/FourSystemsSection";
import { HowAEOWorksSection } from "@/components/home/HowAEOWorksSection";
import { HowWeWorkSection } from "@/components/home/HowWeWorkSection";
import { CitationAuditSection } from "@/components/home/CitationAuditSection";
import { PeopleSection } from "@/components/home/PeopleSection";
import { TeamTestimonialsSection } from "@/components/home/TeamTestimonialsSection";
import { BottomCTASection } from "@/components/home/BottomCTASection";

const Home = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ANAMECHI Marketing",
    "url": "https://anamechimarketing.com",
    "logo": "https://anamechimarketing.com/media/logo.png",
    "slogan": "We install the system. Then we run it.",
    "sameAs": [
      "https://www.linkedin.com/company/anamechi-marketing",
      "https://www.instagram.com/anamechimarketing",
      "https://www.facebook.com/ANAMECHIMarketing",
      "https://www.linkedin.com/in/deannaromulus",
      "https://x.com/anamechi",
      "https://www.youtube.com/@ANAMECHI"
    ],
    "founder": {
      "@type": "Person",
      "name": "Dr. Deanna Romulus",
      "honorificSuffix": "EdD, MBA",
      "jobTitle": "Founder, ANAMECHI Marketing",
      "sameAs": ["https://www.linkedin.com/in/deannaromulus"],
      "hasCredential": {
        "@type": "EducationalOccupationalCredential",
        "name": "Certified Artificial Intelligence Consultant",
        "recognizedBy": {
          "@type": "Organization",
          "name": "International Association of Artificial Intelligence Consultants"
        }
      }
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://anamechimarketing.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://anamechimarketing.com/search?q={query}",
      "query-input": "required name=query"
    }
  };

  return (
    <>
      <SEO
        title="Done-For-You AI + Marketing Systems for Service Businesses"
        description="We install the system. Then we run it. ANAMECHI Marketing designs, builds, and operates the four systems every company needs: lead generation, sales, delivery, and retention, connected by one AI and automation stack."
        canonical="/"
        structuredData={[organizationSchema, websiteSchema, generateLocalBusinessSchema(), generateSpeakableSchema("https://anamechimarketing.com/", ['h1', '.speakable-summary'])]}
      />

      <CinematicHero />
      <KineticManifesto />
      <FourSystemsSection />
      <HowAEOWorksSection />
      <HowWeWorkSection />
      <CitationAuditSection />
      <PeopleSection />
      <TeamTestimonialsSection />
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
