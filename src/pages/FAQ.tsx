import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  funnel_stage: string;
}

const FAQ = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublishedFAQs();

    // Set up real-time subscription for FAQ updates
    const channel = supabase
      .channel('public-faq-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'qa_articles',
          filter: 'status=eq.published'
        },
        () => {
          console.log('FAQ updated, refreshing...');
          fetchPublishedFAQs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPublishedFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('qa_articles')
        .select('id, question, answer, tags, funnel_stage')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFaqs(data || []);
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      setError('Failed to load FAQs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

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

        {/* Loading State */}
        {loading && (
          <Card className="mx-auto max-w-4xl border-border">
            <CardContent className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mx-auto max-w-4xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* FAQ Accordion */}
        {!loading && !error && faqs.length > 0 && (
          <Card className="mx-auto max-w-4xl border-border">
            <CardContent className="p-8">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={faq.id} value={`item-${index}`}>
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
        )}

        {/* Empty State */}
        {!loading && !error && faqs.length === 0 && (
          <Card className="mx-auto max-w-4xl border-border">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                No FAQs available at the moment. Check back soon!
              </p>
            </CardContent>
          </Card>
        )}

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
