import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight } from "lucide-react";

const Blog = () => {
  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://home.anamechimarketing.com/" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://home.anamechimarketing.com/blog/" }
    ]
  };

  // Sample blog posts - in production, these would come from a CMS or database
  const featuredPost = {
    slug: "aeo-guide-2025",
    title: "The Complete Guide to AI Engine Optimization (AEO) in 2025",
    excerpt: "Learn how to position your brand for AI citation across ChatGPT, Gemini, Perplexity, and other LLMs with our comprehensive AEO guide.",
    category: "AEO Strategy",
    publishedDate: "2025-10-30",
    readTime: "12 min read",
    author: "Dr. Deanna Romulus"
  };

  const blogPosts = [
    {
      slug: "structured-data-for-ai-citation",
      title: "Implementing Structured Data for AI Citation",
      excerpt: "Master JSON-LD schemas that help AI models discover, understand, and cite your content correctly.",
      category: "Technical SEO",
      publishedDate: "2025-10-28",
      readTime: "8 min read"
    },
    {
      slug: "eeat-principles-2025",
      title: "EEAT Principles: Building Authority That AI Models Trust",
      excerpt: "How Experience, Expertise, Authoritativeness, and Trust factor into AI citation decisions.",
      category: "Content Strategy",
      publishedDate: "2025-10-25",
      readTime: "10 min read"
    },
    {
      slug: "gohighlevel-automation-playbook",
      title: "GoHighLevel Automation Playbook for Coaches",
      excerpt: "Streamline your coaching business with smart CRM workflows and automation strategies.",
      category: "Automation",
      publishedDate: "2025-10-22",
      readTime: "15 min read"
    },
    {
      slug: "citation-health-monitoring",
      title: "Monitoring Your Citation Health: A Complete Guide",
      excerpt: "Track how AI models cite your brand and optimize for better visibility across answer engines.",
      category: "AEO Strategy",
      publishedDate: "2025-10-20",
      readTime: "7 min read"
    },
    {
      slug: "content-freshness-strategy",
      title: "Content Freshness Strategy for AEO Success",
      excerpt: "Why regular updates matter for AI citation and how to maintain content freshness at scale.",
      category: "Content Strategy",
      publishedDate: "2025-10-18",
      readTime: "9 min read"
    },
    {
      slug: "perplexity-optimization",
      title: "Optimizing for Perplexity: The Answer Engine Playbook",
      excerpt: "Specific strategies to get your content cited by Perplexity's AI search engine.",
      category: "AEO Strategy",
      publishedDate: "2025-10-15",
      readTime: "11 min read"
    }
  ];

  const categories = ["All Posts", "AEO Strategy", "Content Strategy", "Technical SEO", "Automation"];

  return (
    <>
      <SEO
        title="AEO & Digital Marketing Blog - Expert Insights & Strategies"
        description="Learn AI Engine Optimization, SEO, content strategy, and marketing automation from industry experts. Get cited by AI models and search engines."
        canonical="/blog"
        structuredData={[breadcrumbsSchema]}
      />

      <div className="container mx-auto px-4 py-12">
        <Breadcrumbs items={[{ name: "Blog", href: "/blog" }]} />

        {/* Hero */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            AEO Insights & Strategies
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Expert guidance on AI Engine Optimization, content strategy, and building authority that AI models trust.
          </p>
        </div>

        {/* Categories */}
        <div className="mb-12 flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={category === "All Posts" ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Featured Post */}
        <Card className="mb-16 border-border bg-gradient-subtle hover:shadow-xl transition-shadow">
          <CardContent className="p-8 md:p-12">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <Badge className="mb-4 bg-accent/10 text-accent hover:bg-accent/20">
                  Featured Article
                </Badge>
                <Link to={`/blog/${featuredPost.slug}`}>
                  <h2 className="mb-4 text-3xl font-bold text-foreground hover:text-primary transition-colors md:text-4xl">
                    {featuredPost.title}
                  </h2>
                </Link>
                <p className="mb-6 text-lg text-muted-foreground">
                  {featuredPost.excerpt}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    {new Date(featuredPost.publishedDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    {featuredPost.readTime}
                  </div>
                </div>
                <Link to={`/blog/${featuredPost.slug}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                    {featuredPost.category}
                  </Badge>
                </Link>
              </div>
              <div className="rounded-lg bg-gradient-primary p-12 flex items-center justify-center text-primary-foreground">
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2">AEO</div>
                  <div className="text-xl">Featured Guide</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blog Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <Card key={post.slug} className="border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <Badge variant="outline" className="mb-2 w-fit">
                  {post.category}
                </Badge>
                <Link to={`/blog/${post.slug}`}>
                  <CardTitle className="text-xl hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                </Link>
                <CardDescription className="text-base">{post.excerpt}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    {new Date(post.publishedDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-1 h-3 w-3" />
                    {post.readTime}
                  </div>
                </div>
                <Link 
                  to={`/blog/${post.slug}`}
                  className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                >
                  Read Article
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};

export default Blog;
