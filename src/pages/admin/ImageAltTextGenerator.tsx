import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Image, Sparkles, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BlogPost {
  id: string;
  title: string;
  featured_image_url: string | null;
  schema_data: any;
}

interface AltTextResult {
  postId: string;
  title: string;
  success: boolean;
  altText?: string;
  error?: string;
  length?: number;
}

export default function ImageAltTextGenerator() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<AltTextResult[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, featured_image_url, schema_data')
      .not('featured_image_url', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (data) {
      setPosts(data);
    }
    setLoading(false);
  };

  const togglePostSelection = (postId: string) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  };

  const selectAll = () => {
    setSelectedPosts(new Set(posts.map(p => p.id)));
  };

  const deselectAll = () => {
    setSelectedPosts(new Set());
  };

  const generateAltText = async () => {
    if (selectedPosts.size === 0) {
      toast({ title: 'No posts selected', description: 'Please select posts to generate alt text for' });
      return;
    }

    setGenerating(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-image-alt-text', {
        body: { postIds: Array.from(selectedPosts) }
      });

      if (error) throw error;

      setResults(data.results || []);
      
      toast({ 
        title: 'Alt text generation complete', 
        description: `${data.successful} succeeded, ${data.failed} failed` 
      });

      // Refresh posts to show updated alt text
      await fetchPosts();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setGenerating(false);
    }
  };

  const hasAltText = (post: BlogPost) => {
    return post.schema_data?.image_alt_text ? true : false;
  };

  const getAltText = (post: BlogPost) => {
    return post.schema_data?.image_alt_text || 'No alt text';
  };

  const stats = {
    total: posts.length,
    withAltText: posts.filter(hasAltText).length,
    withoutAltText: posts.filter(p => !hasAltText(p)).length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Image Alt Text Generator</h1>
        <p className="text-muted-foreground mt-1">
          Automatically generate SEO-optimized alt text for blog post images using AI
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Images</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>With Alt Text</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.withAltText}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Missing Alt Text</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats.withoutAltText}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Generate Alt Text</CardTitle>
          <CardDescription>
            Select blog posts and generate AI-powered alt text for their featured images
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button onClick={selectAll} variant="outline" size="sm">
              Select All
            </Button>
            <Button onClick={deselectAll} variant="outline" size="sm">
              Deselect All
            </Button>
            <Button 
              onClick={generateAltText} 
              disabled={generating || selectedPosts.size === 0}
              className="ml-auto"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Alt Text ({selectedPosts.size})
                </>
              )}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-semibold mb-2">Generation Results</h3>
              {results.map((result) => (
                <div key={result.postId} className="flex items-start gap-2 text-sm">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{result.title}</div>
                    {result.success ? (
                      <div className="text-muted-foreground">
                        {result.altText} <span className="text-xs">({result.length} chars)</span>
                      </div>
                    ) : (
                      <div className="text-red-600">{result.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Posts with Images</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No blog posts with images found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedPosts.has(post.id)}
                    onChange={() => togglePostSelection(post.id)}
                    className="mt-1"
                  />
                  
                  {post.featured_image_url && (
                    <img
                      src={post.featured_image_url}
                      alt={getAltText(post)}
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{post.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {hasAltText(post) ? (
                        <>
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Alt text exists
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate">
                            "{getAltText(post)}"
                          </span>
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <XCircle className="h-3 w-3 mr-1" />
                          Missing alt text
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
