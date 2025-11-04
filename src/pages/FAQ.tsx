import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

const FAQ = () => {
  const faqs = [
    {
      question: "What is AI Engine Optimization (AEO)?",
      answer: "AI Engine Optimization (AEO) is the practice of optimizing your content and online presence to be discovered, understood, and cited by Large Language Models (LLMs) and AI-powered answer engines like ChatGPT, Google Gemini, Perplexity, and Microsoft Copilot. AEO combines structured data, answer-first content formatting, EEAT authority signals, and citation hygiene to position your brand as a trusted source that AI models recommend."
    },
    {
      question: "How is AEO different from SEO?",
      answer: "While SEO (Search Engine Optimization) focuses on ranking in traditional search results, AEO optimizes for AI-generated answers and citations. SEO targets search engine crawlers and ranking algorithms, while AEO targets LLMs and answer engines. AEO requires more emphasis on structured data, direct answers, citation practices, and EEAT signals. However, both practices complement each other—good AEO typically improves SEO performance as well."
    },
    {
      question: "Do you implement GoHighLevel?",
      answer: "Yes! We specialize in GoHighLevel implementation including CRM setup, pipeline design, workflow automation, email and SMS campaigns, and attribution systems. We help coaches, consultants, and service businesses automate their marketing operations while maintaining a personal touch. Our GoHighLevel expertise includes custom integrations, funnel building, and comprehensive training for your team."
    },
    {
      question: "How long does it take to see results from AEO?",
      answer: "Initial AEO improvements typically appear within 2-3 months, with significant citation gains visible within 4-6 months. The timeline depends on your starting point, content volume, industry competitiveness, and implementation consistency. We track metrics like AI citations, featured snippets, AI overview presence, and organic traffic growth. AEO is an ongoing practice—consistent optimization and content freshness compound results over time."
    },
    {
      question: "What industries do you work with?",
      answer: "We specialize in service businesses including business consultants, executive coaches, marketing agencies, financial advisors, healthcare practitioners, and legal professionals. Our ideal clients are experts who need to establish thought leadership and authority in their fields. We work particularly well with businesses that rely on trust and credibility to attract clients."
    },
    {
      question: "What is EEAT and why does it matter?",
      answer: "EEAT stands for Experience, Expertise, Authoritativeness, and Trustworthiness—quality signals that search engines and AI models use to evaluate content credibility. Experience shows real-world application, Expertise demonstrates subject matter knowledge, Authoritativeness reflects industry recognition, and Trust indicates reliability. Strong EEAT signals increase the likelihood of your content being cited by AI models and featured in search results."
    },
    {
      question: "How do you measure AI citations?",
      answer: "We track AI citations through multiple methods: direct monitoring of brand mentions in ChatGPT, Gemini, and Perplexity responses; tracking featured snippets and AI overview appearances in Google; monitoring referral traffic from AI platforms; analyzing backlink profiles from authoritative sources; and measuring citation health through our proprietary audit system. We provide monthly reports showing citation trends and competitive positioning."
    },
    {
      question: "What is structured data and why is it important for AEO?",
      answer: "Structured data (JSON-LD schemas) provides explicit context about your content in a format AI models can easily parse and understand. It includes Organization schema for brand recognition, Article schema with author credentials, FAQPage for Q&A content, Breadcrumb for navigation, and Citation properties linking sources. Proper structured data implementation dramatically increases the likelihood of AI citation by making your content machine-readable and verifiable."
    },
    {
      question: "Do you offer content production services?",
      answer: "Yes! Our content production add-on includes 1 long-form article per week (1,800-2,500 words), 3 QA mini-articles per week (300-600 words), and 1 monthly case study. All content is AEO-optimized with answer-first formatting, structured data, EEAT signals, and proper citations. We also provide quarterly updates to existing content to maintain freshness and relevance."
    },
    {
      question: "What makes ANAMECHI different from other marketing agencies?",
      answer: "We're pioneers in AI Engine Optimization, not just traditional SEO. We combine technical expertise (structured data, performance optimization), content authority (EEAT-focused writing, expert reviews), strategic positioning (answer-first formatting, citation hygiene), and marketing automation (GoHighLevel expertise). Our founder, Dr. Deanna Romulus, has published extensively on AEO strategies and maintains active relationships with industry thought leaders. We focus exclusively on service businesses, allowing us to deliver specialized expertise."
    },
    {
      question: "How often should content be updated for AEO?",
      answer: "Top-performing pages should be reviewed and updated quarterly. Major guide articles need comprehensive updates every 6 months. Blog posts benefit from minor refreshness updates (statistics, examples, references) every 3-4 months. All updates should be reflected in 'Last Updated' timestamps and dateModified properties in structured data. Regular updates signal to AI models that your content remains current and authoritative."
    },
    {
      question: "Can you help with local SEO and Google Business Profile?",
      answer: "Yes! While our primary focus is AEO, we implement comprehensive local SEO strategies including Google Business Profile optimization, consistent NAP (Name, Address, Phone) across directories, location-specific landing pages, local schema markup, review management, and geographic content strategies. Local signals complement AEO by establishing regional authority and trust."
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://home.anamechimarketing.com/" },
      { "@type": "ListItem", "position": 2, "name": "FAQ", "item": "https://home.anamechimarketing.com/faq/" }
    ]
  };

  return (
    <>
      <SEO
        title="Frequently Asked Questions - AEO & Digital Marketing"
        description="Common questions about AI Engine Optimization (AEO), SEO, content strategy, GoHighLevel implementation, and our marketing services answered by experts."
        canonical="/faq"
        structuredData={[faqSchema, breadcrumbsSchema]}
      />

      <div className="container mx-auto px-4 py-12">
        <Breadcrumbs items={[{ name: "FAQ", href: "/faq" }]} />

        {/* Hero */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Everything you need to know about AI Engine Optimization, our services, and how we help service businesses build AI-citable authority.
          </p>
        </div>

        {/* FAQ Accordion */}
        <Card className="mx-auto max-w-4xl border-border">
          <CardContent className="p-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-lg font-semibold text-foreground hover:text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Card className="mx-auto max-w-2xl border-border bg-gradient-primary">
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-primary-foreground">
                Still Have Questions?
              </h2>
              <p className="mb-6 text-primary-foreground/90">
                Schedule a consultation to discuss your specific needs and learn how we can help you become an AI-citable authority.
              </p>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-foreground hover:bg-accent-hover transition-colors"
              >
                Contact Us
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default FAQ;
