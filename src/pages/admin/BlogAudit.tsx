import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertTriangle, XCircle, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  featured_image_url: string | null;
  funnel_stage: string | null;
  category: string | null;
}

interface AuditResult {
  postId: string;
  title: string;
  status: string;
  audit: {
    overallScore: number;
    issues: Array<{
      category: string;
      severity: string;
      description: string;
    }>;
    hasImage: boolean;
    imageQuality: string;
    wordCount: number;
    readabilityGrade: number;
    missingElements: string[];
    needsRewrite: boolean;
    suggestedImprovements: string[];
  };
}

export default function BlogAudit() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [regeneratingImages, setRegeneratingImages] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [generatingAltText, setGeneratingAltText] = useState(false);
  const [altTextProgress, setAltTextProgress] = useState(0);
  const [progress, setProgress] = useState(0);
  const [filter, setFilter] = useState<'all' | 'critical' | 'needs-images' | 'excellent'>('all');
  const [bulkOptimizing, setBulkOptimizing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, status, featured_image_url, funnel_stage, category')
      .in('status', ['published', 'draft'])
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch posts');
      console.error(error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const auditAllPosts = async () => {
    setAuditing(true);
    setProgress(0);
    const results: AuditResult[] = [];

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      try {
        const { data, error } = await supabase.functions.invoke('audit-blog-content', {
          body: { postId: post.id }
        });

        if (error) throw error;
        results.push(data);
        setProgress(((i + 1) / posts.length) * 100);
      } catch (error) {
        console.error(`Failed to audit ${post.title}:`, error);
        toast.error(`Failed to audit: ${post.title}`);
      }
    }

    setAuditResults(results);
    setAuditing(false);
    toast.success(`Audit complete! Analyzed ${results.length} posts.`);
  };

  const auditSinglePost = async (postId: string, postTitle: string) => {
    try {
      toast.info(`Auditing: ${postTitle}...`);
      
      const { data, error } = await supabase.functions.invoke('audit-blog-content', {
        body: { postId }
      });

      if (error) {
        console.error('Audit error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from audit');
      }
      
      console.log('Audit result:', data);
      
      setAuditResults(prev => {
        const filtered = prev.filter(r => r.postId !== postId);
        return [...filtered, data];
      });
      
      toast.success(`Audited: ${postTitle} (Score: ${data.audit.overallScore})`);
    } catch (error) {
      console.error('Audit failed:', error);
      toast.error(`Failed to audit: ${postTitle}`);
    }
  };

  const bulkGenerateAltText = async () => {
    if (posts.length === 0) {
      toast.error('No posts to process');
      return;
    }

    const confirmed = confirm(
      `This will generate SEO-optimized alt text for all ${posts.length} blog post images. Continue?`
    );

    if (!confirmed) return;

    setGeneratingAltText(true);
    setAltTextProgress(0);

    try {
      // Process in batches of 10 for alt text (faster than image generation)
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < posts.length; i += batchSize) {
        batches.push(posts.slice(i, i + batchSize));
      }

      let totalProcessed = 0;
      const allResults: any[] = [];

      for (const batch of batches) {
        const postIds = batch.map(p => p.id);
        
        const { data, error } = await supabase.functions.invoke('generate-image-alt-text', {
          body: { postIds }
        });

        if (error) {
          console.error('Batch failed:', error);
          toast.error(`Batch failed: ${error.message}`);
        } else if (data) {
          allResults.push(...data.results);
          totalProcessed += batch.length;
          setAltTextProgress((totalProcessed / posts.length) * 100);
          
          toast.success(
            `Batch complete: ${data.successful} alt texts generated`
          );
        }
      }

      // Summary
      const successCount = allResults.filter(r => r.success).length;
      const failureCount = allResults.filter(r => !r.success).length;

      toast.success(
        `Alt text generation complete! ${successCount} generated, ${failureCount} failed.`,
        { duration: 5000 }
      );

      // Refresh posts
      await fetchPosts();
      
    } catch (error) {
      console.error('Alt text generation failed:', error);
      toast.error('Alt text generation failed');
    } finally {
      setGeneratingAltText(false);
      setAltTextProgress(0);
    }
  };

  const bulkRegenerateImages = async () => {
    if (posts.length === 0) {
      toast.error('No posts to process');
      return;
    }

    const confirmed = confirm(
      `This will regenerate images for all ${posts.length} blog posts using ANAMECHI brand style. This may take several minutes. Continue?`
    );

    if (!confirmed) return;

    setRegeneratingImages(true);
    setImageProgress(0);

    try {
      // Process in batches of 5 to avoid overwhelming the API
      const batchSize = 5;
      const batches = [];
      for (let i = 0; i < posts.length; i += batchSize) {
        batches.push(posts.slice(i, i + batchSize));
      }

      let totalProcessed = 0;
      const allResults: any[] = [];

      for (const batch of batches) {
        const postIds = batch.map(p => p.id);
        
        const { data, error } = await supabase.functions.invoke('bulk-regenerate-images', {
          body: { postIds, brandStyle: 'anamechi' }
        });

        if (error) {
          console.error('Batch failed:', error);
          toast.error(`Batch failed: ${error.message}`);
        } else if (data) {
          allResults.push(...data.results);
          totalProcessed += batch.length;
          setImageProgress((totalProcessed / posts.length) * 100);
          
          toast.success(
            `Batch complete: ${data.successful} successful, ${data.failed} failed`
          );
        }
      }

      // Summary
      const successCount = allResults.filter(r => r.success).length;
      const failureCount = allResults.filter(r => !r.success).length;

      toast.success(
        `Bulk regeneration complete! ${successCount} images generated, ${failureCount} failed.`,
        { duration: 5000 }
      );

      // Refresh posts
      await fetchPosts();
      
    } catch (error) {
      console.error('Bulk regeneration failed:', error);
      toast.error('Bulk image regeneration failed');
    } finally {
      setRegeneratingImages(false);
      setImageProgress(0);
    }
  };

  const bulkOptimizePublished = async () => {
    const publishedPosts = posts.filter(p => p.status === 'published');
    
    if (publishedPosts.length === 0) {
      toast.error('No published posts to optimize');
      return;
    }

    const confirmed = confirm(
      `This will optimize ALL ${publishedPosts.length} published blog posts to meet ANAMECHI content guidelines (short paragraphs, proper headers, visual structure). This may take several minutes. Continue?`
    );

    if (!confirmed) return;

    setBulkOptimizing(true);
    setBulkProgress(0);

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < publishedPosts.length; i++) {
      const post = publishedPosts[i];
      
      try {
        toast.info(`Optimizing ${i + 1}/${publishedPosts.length}: ${post.title}...`);
        
        // Step 1: Audit if not already audited
        let auditResult = auditResults.find(r => r.postId === post.id);
        if (!auditResult) {
          const { data: auditData, error: auditError } = await supabase.functions.invoke('audit-blog-content', {
            body: { postId: post.id }
          });
          
          if (auditError) throw auditError;
          auditResult = auditData;
          setAuditResults(prev => [...prev, auditData]);
        }

        // Step 2: Optimize content
        const { data: optimizedData, error: optimizeError } = await supabase.functions.invoke('optimize-blog-post', {
          body: { postId: post.id, auditResults: auditResult.audit }
        });

        if (optimizeError) throw optimizeError;

        // Step 3: Generate image if missing
        let imageUrl = post.featured_image_url;
        if (!imageUrl || auditResult.audit.imageQuality === 'poor') {
          const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-blog-image', {
            body: { 
              prompt: optimizedData.suggestedImagePrompt || `Professional blog header image for: ${optimizedData.title}`,
              style: 'professional'
            }
          });

          if (!imageError && imageData?.imageUrl) {
            imageUrl = imageData.imageUrl;
          }
        }

        // Step 4: Update post
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({
            title: optimizedData.title,
            excerpt: optimizedData.excerpt,
            content: optimizedData.content,
            meta_description: optimizedData.metaDescription,
            ...(imageUrl && { featured_image_url: imageUrl }),
            updated_at: new Date().toISOString()
          })
          .eq('id', post.id);

        if (updateError) throw updateError;

        successCount++;
        toast.success(`✓ ${post.title}`);
        
      } catch (error) {
        console.error(`Failed to optimize ${post.title}:`, error);
        failureCount++;
        toast.error(`✗ ${post.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      setBulkProgress(((i + 1) / publishedPosts.length) * 100);
    }

    setBulkOptimizing(false);
    setBulkProgress(0);
    
    toast.success(
      `Bulk optimization complete! ${successCount} successful, ${failureCount} failed.`,
      { duration: 6000 }
    );

    await fetchPosts();
    await auditAllPosts();
  };

  const handlePublish = async (postId: string, publish: boolean, postTitle: string) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          status: publish ? 'published' : 'draft',
          published_at: publish ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId);

      if (error) throw error;
      toast.success(`${publish ? 'Published' : 'Unpublished'}: ${postTitle}`);
      await fetchPosts();
    } catch (e) {
      console.error('Publish toggle failed:', e);
      toast.error('Failed to change publish status');
    }
  };
  const optimizePost = async (postId: string, postTitle: string) => {
    setOptimizing(postId);
    const auditResult = auditResults.find(r => r.postId === postId);
    
    if (!auditResult) {
      toast.error('Please audit this post first');
      setOptimizing(null);
      return;
    }

    try {
      toast.info(`Optimizing: ${postTitle}...`);
      console.log('Starting optimization for:', postId, 'with audit:', auditResult.audit);
      
      // Step 1: Optimize content
      const { data: optimizedData, error: optimizeError } = await supabase.functions.invoke('optimize-blog-post', {
        body: { postId, auditResults: auditResult.audit }
      });

      if (optimizeError) {
        console.error('Optimize error:', optimizeError);
        throw optimizeError;
      }

      if (!optimizedData) {
        throw new Error('No data returned from optimization');
      }

      console.log('Optimization result:', optimizedData);

      // Step 2: Generate image if needed
      let imageUrl = null;
      if (!auditResult.audit.hasImage || auditResult.audit.imageQuality !== 'excellent') {
        toast.info('Generating new hero image...');
        
        const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-blog-image', {
          body: { 
            prompt: optimizedData.suggestedImagePrompt || `Professional blog header image for: ${optimizedData.title}`,
            style: 'professional'
          }
        });

        if (imageError) {
          console.error('Image generation error:', imageError);
          toast.error('Image generation failed, continuing without new image');
        } else if (imageData?.imageUrl) {
          imageUrl = imageData.imageUrl;
          console.log('Generated image URL:', imageUrl);
        }
      }

      // Step 3: Update post
      console.log('Updating post with optimized data...');
      
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({
          title: optimizedData.title,
          excerpt: optimizedData.excerpt,
          content: optimizedData.content,
          meta_description: optimizedData.metaDescription,
          keywords: optimizedData.keywords || [],
          ...(imageUrl && { featured_image_url: imageUrl }),
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      toast.success(`✨ ${postTitle} optimized successfully!`, { duration: 5000 });
      
      // Re-audit to show new score
      await auditSinglePost(postId, postTitle);
      await fetchPosts();
    } catch (error) {
      console.error('Optimization failed:', error);
      toast.error(`Failed to optimize: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setOptimizing(null);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-500">Excellent ({score})</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-500">Good ({score})</Badge>;
    if (score >= 50) return <Badge className="bg-orange-500">Needs Work ({score})</Badge>;
    return <Badge variant="destructive">Critical ({score})</Badge>;
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'critical') return <XCircle className="text-red-500" size={16} />;
    if (severity === 'major') return <AlertTriangle className="text-orange-500" size={16} />;
    return <AlertTriangle className="text-yellow-500" size={16} />;
  };

  const filteredResults = auditResults.filter(result => {
    if (filter === 'critical') return result.audit.overallScore < 70;
    if (filter === 'needs-images') return !result.audit.hasImage || result.audit.imageQuality === 'missing' || result.audit.imageQuality === 'poor';
    if (filter === 'excellent') return result.audit.overallScore >= 90;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Blog Audit & Optimization</h1>
          <p className="text-muted-foreground mt-1">
            Analyze and optimize all blog posts to ANAMECHI Excellence Standards
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={bulkOptimizePublished} 
            disabled={bulkOptimizing || loading || posts.filter(p => p.status === 'published').length === 0}
            variant="default"
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {bulkOptimizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Optimizing {Math.round(bulkProgress)}%...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Fix All Published Blogs
              </>
            )}
          </Button>
          <Button 
            onClick={bulkGenerateAltText} 
            disabled={generatingAltText || loading || posts.length === 0}
            variant="outline"
            size="lg"
          >
            {generatingAltText ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Alt Text...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Generate Alt Text
              </>
            )}
          </Button>
          <Button 
            onClick={bulkRegenerateImages} 
            disabled={regeneratingImages || loading || posts.length === 0}
            variant="outline"
            size="lg"
          >
            {regeneratingImages ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Regenerate All Images
              </>
            )}
          </Button>
          <Button 
            onClick={auditAllPosts} 
            disabled={auditing || loading}
            size="lg"
          >
            {auditing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Auditing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Audit All Posts
              </>
            )}
          </Button>
        </div>
      </div>

      {bulkOptimizing && (
        <Alert className="border-purple-500 bg-purple-50">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Bulk Blog Optimization in Progress</p>
              <p className="text-sm">
                Reformatting all published blogs to meet ANAMECHI guidelines:
                <br />• Short paragraphs (2-4 lines)
                <br />• Proper H2/H3 structure
                <br />• Visual breaks and white space
                <br />• SEO-optimized content
              </p>
              <Progress value={bulkProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">{Math.round(bulkProgress)}% complete</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {auditing && (
        <Card>
          <CardHeader>
            <CardTitle>Audit in Progress</CardTitle>
            <CardDescription>Analyzing {posts.length} blog posts...</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="w-full" />
          </CardContent>
        </Card>
      )}

      {generatingAltText && (
        <Card className="border-blue-500 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              AI Alt Text Generation in Progress
            </CardTitle>
            <CardDescription>
              Generating SEO-optimized, accessibility-compliant alt text for {posts.length} blog images...
              <br />
              <span className="text-blue-600 font-medium">
                80-125 characters, keyword-rich, contextually relevant
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={altTextProgress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              {Math.round(altTextProgress)}% complete - Analyzing content context for each image
            </p>
          </CardContent>
        </Card>
      )}

      {regeneratingImages && (
        <Card className="border-purple-500 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-purple-600" />
              Bulk Image Regeneration in Progress
            </CardTitle>
            <CardDescription>
              Generating brand-aligned images for {posts.length} blog posts using Nano Banana...
              <br />
              <span className="text-purple-600 font-medium">
                ANAMECHI Style: Sleek, empowering, purple-gold tones, editorial quality
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={imageProgress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              {Math.round(imageProgress)}% complete - Processing in batches to ensure quality
            </p>
          </CardContent>
        </Card>
      )}

      {auditResults.length > 0 && (
        <>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({auditResults.length})</TabsTrigger>
              <TabsTrigger value="critical">
                Critical ({auditResults.filter(r => r.audit.overallScore < 70).length})
              </TabsTrigger>
              <TabsTrigger value="needs-images">
                Needs Images ({auditResults.filter(r => !r.audit.hasImage || r.audit.imageQuality === 'missing' || r.audit.imageQuality === 'poor').length})
              </TabsTrigger>
              <TabsTrigger value="excellent">
                Excellent ({auditResults.filter(r => r.audit.overallScore >= 90).length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-4">
            {filteredResults.map((result) => (
              <Card key={result.postId}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{result.title}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        {getScoreBadge(result.audit.overallScore)}
                        <Badge variant="outline">{result.status}</Badge>
                        {!result.audit.hasImage && (
                          <Badge variant="destructive" className="gap-1">
                            <ImageIcon size={12} />
                            No Image
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => auditSinglePost(result.postId, result.title)}
                      >
                        <Sparkles className="mr-2 h-3 w-3" />
                        Re-audit
                      </Button>
                      <Button
                        onClick={() => optimizePost(result.postId, result.title)}
                        disabled={optimizing === result.postId}
                        variant={result.audit.needsRewrite ? "default" : "outline"}
                      >
                        {optimizing === result.postId ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Optimizing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            {result.audit.needsRewrite ? 'Rewrite & Optimize' : 'Optimize'}
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => (window.location.href = `/admin/blog/edit/${result.postId}`)}
                      >
                        Open Editor
                      </Button>
                      {(() => {
                        const postMeta = posts.find(p => p.id === result.postId);
                        const isPublished = postMeta?.status === 'published';
                        return (
                          <>
                            <Button
                              size="sm"
                              variant={isPublished ? 'ghost' : 'secondary'}
                              onClick={() => handlePublish(result.postId, !isPublished, result.title)}
                            >
                              {isPublished ? 'Unpublish' : 'Publish'}
                            </Button>
                            {isPublished && postMeta?.slug && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(`/blog/${postMeta.slug}`, '_blank')}
                              >
                                View
                              </Button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.audit.issues.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Issues Found:</h4>
                      <div className="space-y-2">
                        {result.audit.issues.map((issue, idx) => (
                          <Alert key={idx} variant={issue.severity === 'critical' ? 'destructive' : 'default'}>
                            <div className="flex items-start gap-2">
                              {getSeverityIcon(issue.severity)}
                              <div className="flex-1">
                                <div className="font-medium">{issue.category}</div>
                                <AlertDescription>{issue.description}</AlertDescription>
                              </div>
                            </div>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.audit.missingElements.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Missing Elements:</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.audit.missingElements.map((element, idx) => (
                          <Badge key={idx} variant="outline">{element}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.audit.suggestedImprovements.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Suggested Improvements:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {result.audit.suggestedImprovements.map((improvement, idx) => (
                          <li key={idx} className="text-sm">{improvement}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <div className="text-sm text-muted-foreground">Word Count</div>
                      <div className="font-medium">{result.audit.wordCount}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Readability Grade</div>
                      <div className="font-medium">{result.audit.readabilityGrade}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Image Quality</div>
                      <div className="font-medium capitalize">{result.audit.imageQuality}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {!loading && !auditing && auditResults.length === 0 && posts.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Ready to Audit</CardTitle>
            <CardDescription>
              You have {posts.length} blog posts ready for analysis. Click "Audit All Posts" to analyze all at once,
              or audit individual posts below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {posts.slice(0, 5).map((post) => (
                <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                  <div>
                    <h4 className="font-medium">{post.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {post.category} • {post.status}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => auditSinglePost(post.id, post.title)}
                  >
                    <Sparkles className="mr-2 h-3 w-3" />
                    Audit
                  </Button>
                </div>
              ))}
              {posts.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  + {posts.length - 5} more posts. Click "Audit All Posts" to analyze everything.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && posts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No blog posts found to audit.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
