import { useEffect, useState } from "react";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Blog = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [featuredPost, setFeaturedPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All Posts");
  const [categories, setCategories] = useState<string[]>(["All Posts"]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Set featured post (highest SEO score or most recent)
        const featured = data.reduce((prev, current) => 
          (current.seo_score || 0) > (prev.seo_score || 0) ? current : prev
        );
        setFeaturedPost(featured);

        // Set remaining posts (exclude featured)
        const remaining = data.filter(post => post.id !== featured.id);
        setPosts(remaining);

        // Extract unique categories
        const uniqueCategories = [...new Set(data.map(post => post.category).filter(Boolean))];
        setCategories(["All Posts", ...uniqueCategories]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = selectedCategory === "All Posts" 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://anamechimarketing.com/" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://anamechimarketing.com/blog/" }
    ]
  };

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
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <>
            <Card className="mb-16">
              <CardContent className="p-8">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-full mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* No Posts */}
        {!loading && !featuredPost && posts.length === 0 && (
          <Alert>
            <AlertDescription>
              No published blog posts yet. Check back soon for expert insights on AEO and digital marketing!
            </AlertDescription>
          </Alert>
        )}

        {/* Featured Post */}
        {!loading && featuredPost && (
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
                    {featuredPost.excerpt || featuredPost.meta_description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      {new Date(featuredPost.published_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      {featuredPost.reading_time} min read
                    </div>
                  </div>
                  <Link to={`/blog/${featuredPost.slug}`}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                      {featuredPost.category}
                    </Badge>
                  </Link>
                </div>
                {featuredPost.featured_image_url ? (
                  <img 
                    src={featuredPost.featured_image_url} 
                    alt={featuredPost.title}
                    className="rounded-lg object-cover w-full h-full max-h-96"
                  />
                ) : (
                  <div className="rounded-lg bg-gradient-primary p-12 flex items-center justify-center text-primary-foreground">
                    <div className="text-center">
                      <div className="text-6xl font-bold mb-2">AEO</div>
                      <div className="text-xl">Featured Guide</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Blog Grid */}
        {!loading && filteredPosts.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="border-border hover:shadow-lg transition-shadow">
                {post.featured_image_url && (
                  <div className="overflow-hidden rounded-t-lg">
                    <img 
                      src={post.featured_image_url} 
                      alt={post.title}
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center mb-2">
                    <Badge variant="outline" className="w-fit">
                      {post.category}
                    </Badge>
                  </div>
                  <Link to={`/blog/${post.slug}`}>
                    <CardTitle className="text-xl hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </CardTitle>
                  </Link>
                  <CardDescription className="text-base line-clamp-2">
                    {post.excerpt || post.meta_description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {new Date(post.published_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {post.reading_time} min read
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
        )}

        {/* No Filtered Results */}
        {!loading && selectedCategory !== "All Posts" && filteredPosts.length === 0 && (
          <Alert>
            <AlertDescription>
              No posts found in the "{selectedCategory}" category. Try selecting a different category.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </>
  );
};

export default Blog;
