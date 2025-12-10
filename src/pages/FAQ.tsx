import { useEffect, useState, useMemo } from 'react';
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
import { AlertCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { generateOrganizationSchema, generateSpeakableSchema } from "@/utils/schemas";

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaq, setSelectedFaq] = useState<string | null>(null);

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

  // Track FAQ view analytics
  const trackFAQView = async (faqId: string) => {
    try {
      // View tracking will be implemented later
      console.log('FAQ viewed:', faqId);
    } catch (err) {
      console.error('Error tracking FAQ view:', err);
    }
  };

  // Filter and search FAQs
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    
    const query = searchQuery.toLowerCase();
    return faqs.filter(faq => 
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      faq.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [faqs, searchQuery]);

  // Get autocomplete suggestions
  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    
    const query = searchQuery.toLowerCase();
    const matches = faqs
      .filter(faq => faq.question.toLowerCase().includes(query))
      .slice(0, 5);
    
    return matches;
  }, [faqs, searchQuery]);

  // Get related FAQs based on tags
  const getRelatedFaqs = (currentFaq: FAQ) => {
    return faqs
      .filter(faq => 
        faq.id !== currentFaq.id &&
        faq.tags.some(tag => currentFaq.tags.includes(tag))
      )
      .slice(0, 3);
  };

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={index} className="bg-yellow-200 dark:bg-yellow-900">{part}</mark>
        : part
    );
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

  const organizationSchema = generateOrganizationSchema();
  const speakableSchema = generateSpeakableSchema("https://home.anamechimarketing.com/faq/", ['h1', '.faq-answer']);

  return (
    <>
      <SEO
        title="Frequently Asked Questions - AEO & Digital Marketing"
        description="Common questions about AI Engine Optimization (AEO), SEO, content strategy, GoHighLevel implementation, and our marketing services answered by experts."
        canonical="/faq"
        structuredData={[faqSchema, breadcrumbsSchema, organizationSchema, speakableSchema]}
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

        {/* Search Bar */}
        <div className="mx-auto max-w-4xl mb-8 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search FAQs... (e.g., 'marketing automation', 'CRM')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-6 text-lg"
            />
          </div>
          
          {/* Autocomplete Suggestions */}
          {suggestions.length > 0 && (
            <Card className="absolute z-10 w-full mt-2 border-border shadow-lg">
              <CardContent className="p-2">
                {suggestions.map((faq) => (
                  <button
                    key={faq.id}
                    onClick={() => {
                      setSearchQuery(faq.question);
                      setSelectedFaq(faq.id);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-accent rounded-md transition-colors"
                  >
                    <p className="font-medium text-sm">{faq.question}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="mx-auto max-w-4xl mb-4">
            <p className="text-sm text-muted-foreground">
              Found {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''} for "{searchQuery}"
              {filteredFaqs.length > 0 && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-2 text-primary hover:underline"
                >
                  Clear search
                </button>
              )}
            </p>
          </div>
        )}

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
        {!loading && !error && filteredFaqs.length > 0 && (
          <Card className="mx-auto max-w-4xl border-border">
            <CardContent className="p-8">
              <Accordion 
                type="single" 
                collapsible 
                className="w-full"
                value={selectedFaq || undefined}
                onValueChange={(value) => {
                  setSelectedFaq(value);
                  if (value) trackFAQView(value);
                }}
              >
                {filteredFaqs.map((faq, index) => {
                  const relatedFaqs = getRelatedFaqs(faq);
                  return (
                    <AccordionItem key={faq.id} value={faq.id}>
                      <AccordionTrigger className="text-left text-lg font-semibold text-foreground hover:text-primary">
                        {highlightText(faq.question, searchQuery)}
                      </AccordionTrigger>
                      <AccordionContent className="text-base text-muted-foreground leading-relaxed space-y-4">
                        <div>{highlightText(faq.answer, searchQuery)}</div>
                        
                        {/* Tags - exclude funnel stage abbreviations */}
                        {faq.tags.filter(tag => !['TOFU', 'MOFU', 'BOFU'].includes(tag.toUpperCase())).length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {faq.tags.filter(tag => !['TOFU', 'MOFU', 'BOFU'].includes(tag.toUpperCase())).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Related FAQs */}
                        {relatedFaqs.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-border">
                            <h4 className="text-sm font-semibold text-foreground mb-3">
                              Related Questions:
                            </h4>
                            <div className="space-y-2">
                              {relatedFaqs.map((relatedFaq) => (
                                <button
                                  key={relatedFaq.id}
                                  onClick={() => {
                                    setSelectedFaq(relatedFaq.id);
                                    trackFAQView(relatedFaq.id);
                                  }}
                                  className="block text-left text-sm text-primary hover:underline"
                                >
                                  → {relatedFaq.question}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && filteredFaqs.length === 0 && faqs.length > 0 && (
          <Card className="mx-auto max-w-4xl border-border">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                No FAQs match your search. Try different keywords.
              </p>
            </CardContent>
          </Card>
        )}

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
