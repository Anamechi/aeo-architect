import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactMarkdown from "react-markdown";

const SITE = "https://anamechimarketing.com";

const QAArticle = () => {
  const { slug } = useParams();
  const [qa, setQa] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) fetchQA();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchQA = async () => {
    try {
      setLoading(true);
      setNotFound(false);
      const { data, error } = await supabase
        .from("qa_articles")
        .select("id, slug, question, answer, meta_description, tags, funnel_stage, published_at, updated_at")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error || !data) {
        setNotFound(true);
        return;
      }
      setQa(data);

      const tags: string[] = Array.isArray(data.tags) ? data.tags : [];
      if (tags.length) {
        const { data: rel } = await supabase
          .from("qa_articles")
          .select("id, slug, question")
          .eq("status", "published")
          .neq("id", data.id)
          .overlaps("tags", tags)
          .limit(4);
        if (rel) setRelated(rel);
      }
    } catch (e) {
      console.error("Error fetching Q&A:", e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (notFound || !qa) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive">
          <AlertDescription>
            Answer not found. <Link to="/faq" className="underline">Return to the FAQ</Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const description =
    qa.meta_description || String(qa.answer || "").replace(/\s+/g, " ").slice(0, 160).trim();

  const qaSchema = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: qa.question,
      text: qa.question,
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        text: qa.answer,
        url: `${SITE}/faq/${qa.slug}`,
      },
    },
  };

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "FAQ", item: `${SITE}/faq/` },
      { "@type": "ListItem", position: 3, name: qa.question, item: `${SITE}/faq/${qa.slug}/` },
    ],
  };

  const tags: string[] = (Array.isArray(qa.tags) ? qa.tags : []).filter(
    (t: string) => !["TOFU", "MOFU", "BOFU"].includes(String(t).toUpperCase()),
  );

  return (
    <>
      <SEO
        title={qa.question}
        description={description}
        canonical={`/faq/${qa.slug}`}
        type="article"
        structuredData={[qaSchema, breadcrumbsSchema]}
      />

      <article className="container mx-auto px-4 py-12">
        <Breadcrumbs
          items={[
            { name: "FAQ", href: "/faq" },
            { name: qa.question, href: `/faq/${qa.slug}` },
          ]}
        />

        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-3xl font-bold text-foreground md:text-4xl">{qa.question}</h1>

          <div className="faq-answer prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
            <ReactMarkdown>{qa.answer}</ReactMarkdown>
          </div>

          {tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <Separator className="my-10" />

          {related.length > 0 && (
            <div className="mb-10">
              <h2 className="mb-4 text-xl font-semibold text-foreground">Related questions</h2>
              <ul className="space-y-2">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link to={`/faq/${r.slug}`} className="text-primary hover:underline">
                      {r.question}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mb-10">
            <Link to="/faq" className="text-primary hover:underline">
              &larr; Back to all questions
            </Link>
          </p>

          <Card className="border-border bg-gradient-primary">
            <CardContent className="p-8 text-center">
              <h2 className="mb-4 text-2xl font-bold text-primary-foreground">Still have questions?</h2>
              <p className="mb-6 text-primary-foreground/90">
                Book a fit call to see how ANAMECHI builds your AI-citable authority.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
              >
                Contact Us
              </Link>
            </CardContent>
          </Card>
        </div>
      </article>
    </>
  );
};

export default QAArticle;
