import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, User, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactMarkdown from "react-markdown";

const BlogArticle = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setNotFound(false);

      // Fetch article
      const { data: articleData, error: articleError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (articleError || !articleData) {
        setNotFound(true);
        return;
      }

      setArticle(articleData);

      // Fetch author if available
      if (articleData.author_id) {
        const { data: authorData } = await supabase
          .from('authors')
          .select('*')
          .eq('id', articleData.author_id)
          .single();
        
        if (authorData) setAuthor(authorData);
      }

      // Fetch related posts (same category or funnel stage)
      const { data: related } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, category, funnel_stage, reading_time')
        .eq('status', 'published')
        .neq('id', articleData.id)
        .or(`category.eq.${articleData.category},funnel_stage.eq.${articleData.funnel_stage}`)
        .limit(3);

      if (related) setRelatedPosts(related);

    } catch (error) {
      console.error('Error fetching article:', error);
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
        <Skeleton className="h-4 w-2/3 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive">
          <AlertDescription>
            Article not found. <Link to="/blog" className="underline">Return to blog</Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.meta_description || article.excerpt,
    "datePublished": article.published_at,
    "dateModified": article.updated_at,
    "author": author ? {
      "@type": "Person",
      "name": author.name,
      "jobTitle": author.title,
    } : {
      "@type": "Person",
      "name": "ANAMECHI Marketing Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ANAMECHI Marketing",
      "logo": {
        "@type": "ImageObject",
        "url": "https://anamechimarketing.com/logo.png"
      }
    },
    "mainEntityOfPage": `https://anamechimarketing.com/blog/${article.slug}/`,
    ...(article.featured_image_url && {
      "image": {
        "@type": "ImageObject",
        "url": article.featured_image_url
      }
    }),
    ...(article.citations && Array.isArray(article.citations) && {
      "citation": article.citations.map((c: any) => c.url)
    })
  };

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://anamechimarketing.com/" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://anamechimarketing.com/blog/" },
      { "@type": "ListItem", "position": 3, "name": article.title, "item": `https://anamechimarketing.com/blog/${article.slug}/` }
    ]
  };

  return (
    <>
      <SEO
        title={article.title}
        description={article.meta_description || article.excerpt}
        canonical={`/blog/${article.slug}`}
        type="article"
        image={article.featured_image_url}
        article={{
          publishedTime: article.published_at,
          modifiedTime: article.updated_at,
          author: author?.name || "ANAMECHI Marketing Team"
        }}
        structuredData={[articleSchema, breadcrumbsSchema]}
      />

      <article className="container mx-auto px-4 py-12">
        <Breadcrumbs items={[
          { name: "Blog", href: "/blog" },
          { name: article.title, href: `/blog/${article.slug}` }
        ]} />

        {/* Article Header */}
        <div className="mx-auto max-w-4xl mb-12">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-accent/10 text-accent hover:bg-accent/20">
              {article.category}
            </Badge>
            {article.funnel_stage && (
              <Badge variant="secondary">
                {article.funnel_stage}
              </Badge>
            )}
          </div>
          <h1 className="mb-6 text-4xl font-bold text-foreground md:text-5xl">
            {article.title}
          </h1>
          {(article.excerpt || article.meta_description) && (
            <p className="text-xl text-muted-foreground mb-8">
              {article.excerpt || article.meta_description}
            </p>
          )}

          {/* Featured Image */}
          {article.featured_image_url && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img 
                src={article.featured_image_url} 
                alt={article.title}
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              <span>
                Published: {new Date(article.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              <span>{article.reading_time} min read</span>
            </div>
            {author && (
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>{author.name}</span>
              </div>
            )}
            {article.reviewed_by && (
              <div className="flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                <span>Reviewed</span>
              </div>
            )}
          </div>

          <Separator className="my-8" />
        </div>

        {/* Article Content */}
        <div className="mx-auto max-w-4xl">
          <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>

          {/* Citations */}
          {article.citations && Array.isArray(article.citations) && article.citations.length > 0 && (
            <>
              <Separator className="my-12" />
              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-xl font-semibold mb-4">Sources & Citations</h3>
                <ul className="space-y-2">
                  {article.citations.map((citation: any, index: number) => (
                    <li key={index}>
                      <a 
                        href={citation.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        {citation.title || citation.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <Separator className="my-12" />

          {/* Author Bio */}
          {author && (
            <Card className="border-border">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  {author.photo_url ? (
                    <img 
                      src={author.photo_url} 
                      alt={author.name}
                      className="h-16 w-16 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-2xl font-bold text-primary-foreground">
                      {author.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      {author.name}
                    </h3>
                    {author.title && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {author.title}
                      </p>
                    )}
                    {author.bio && (
                      <p className="text-foreground">
                        {author.bio}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <>
              <h3 className="text-2xl font-bold text-foreground mt-12 mb-6">Related Articles</h3>
              <div className="grid gap-6 md:grid-cols-3 mb-12">
                {relatedPosts.map((post) => (
                  <Card key={post.id} className="border-border hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <Badge variant="outline" className="mb-2">
                        {post.category}
                      </Badge>
                      <Link to={`/blog/${post.slug}`}>
                        <h4 className="font-semibold text-foreground hover:text-primary transition-colors mb-2 line-clamp-2">
                          {post.title}
                        </h4>
                      </Link>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {post.reading_time} min read
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* CTA */}
          <Card className="border-border bg-gradient-primary">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-primary-foreground mb-4">
                {article.funnel_stage === 'BOFU' 
                  ? 'Ready to Get Started?' 
                  : 'Want to Learn More?'}
              </h3>
              <p className="text-primary-foreground/90 mb-6">
                {article.funnel_stage === 'BOFU'
                  ? "Let's discuss how we can implement these strategies for your business."
                  : "Discover how AEO and smart marketing automation can transform your business."}
              </p>
              <Link 
                to="/contact"
                className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-sm font-medium text-accent-foreground hover:bg-accent-hover transition-colors"
              >
                {article.funnel_stage === 'BOFU' ? 'Schedule a Call' : 'Learn More'}
              </Link>
            </CardContent>
          </Card>
        </div>
      </article>
    </>
  );
};

export default BlogArticle;
