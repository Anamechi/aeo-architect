import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, FileText, Target, TrendingUp, Plus, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

type FunnelStage = 'TOFU' | 'MOFU' | 'BOFU';

export default function BlogGenerator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Basic post info
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [category, setCategory] = useState('');
  const [funnelStage, setFunnelStage] = useState<FunnelStage>('TOFU');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  
  // Content
  const [content, setContent] = useState('');
  
  // Citations
  const [citations, setCitations] = useState<Array<{ url: string; title: string }>>([]);
  const [citationUrl, setCitationUrl] = useState('');
  const [citationTitle, setCitationTitle] = useState('');
  
  // Author selection (simplified for now)
  const [selectedAuthorId, setSelectedAuthorId] = useState('');
  
  // SEO Score (calculated)
  const [seoScore, setSeoScore] = useState(0);
  
  const [loading, setLoading] = useState(false);

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
      setSlug(generatedSlug);
    }
  };

  // Calculate SEO score based on AI optimization criteria
  const calculateSEOScore = () => {
    let score = 0;
    
    // Title optimization (max 20 points)
    if (title.length > 0 && title.length <= 60) score += 10;
    if (title.includes('?') || /\d{4}/.test(title)) score += 10; // Question or year
    
    // Meta description (max 15 points)
    if (metaDescription.length >= 120 && metaDescription.length <= 160) score += 15;
    
    // Content structure (max 30 points)
    const h2Count = (content.match(/##\s/g) || []).length;
    const h3Count = (content.match(/###\s/g) || []).length;
    if (h2Count >= 3) score += 10; // Good header structure
    if (h3Count >= 2) score += 10; // Detailed sections
    if (content.length >= 800) score += 10; // Adequate content length
    
    // Citations (max 15 points)
    if (citations.length >= 3) score += 15;
    else if (citations.length > 0) score += 5;
    
    // Tags and categorization (max 10 points)
    if (tags.length >= 3) score += 5;
    if (category) score += 5;
    
    // Funnel stage defined (max 10 points)
    if (funnelStage) score += 10;
    
    setSeoScore(score);
    return score;
  };

  const addTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const addCitation = () => {
    if (citationUrl && citationTitle) {
      setCitations([...citations, { url: citationUrl, title: citationTitle }]);
      setCitationUrl('');
      setCitationTitle('');
    }
  };

  const removeCitation = (index: number) => {
    setCitations(citations.filter((_, i) => i !== index));
  };

  const generateSchema = () => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: metaDescription,
      author: selectedAuthorId ? {
        '@type': 'Person',
        '@id': selectedAuthorId
      } : undefined,
      datePublished: new Date().toISOString(),
      articleBody: content,
      ...(citations.length > 0 && {
        citation: citations.map(c => ({
          '@type': 'CreativeWork',
          name: c.title,
          url: c.url
        }))
      }),
      ...(tags.length > 0 && {
        keywords: tags.join(', ')
      })
    };
    
    return schema;
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    
    try {
      const score = calculateSEOScore();
      const schema = generateSchema();
      
      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          title,
          slug,
          meta_description: metaDescription,
          content,
          category,
          funnel_stage: funnelStage,
          tags,
          citations: citations as any,
          schema_data: schema as any,
          seo_score: score,
          author_id: selectedAuthorId || null,
          status: 'draft'
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Draft saved successfully!');
      navigate('/admin/blog-posts');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    
    try {
      const score = calculateSEOScore();
      
      if (score < 50) {
        toast.error('SEO score too low. Please optimize your content before publishing.');
        setLoading(false);
        return;
      }
      
      const schema = generateSchema();
      
      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          title,
          slug,
          meta_description: metaDescription,
          content,
          category,
          funnel_stage: funnelStage,
          tags,
          citations: citations as any,
          schema_data: schema as any,
          seo_score: score,
          author_id: selectedAuthorId || null,
          status: 'published',
          published_at: new Date().toISOString()
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Post published successfully!');
      navigate('/admin/blog-posts');
    } catch (error: any) {
      toast.error(error.message || 'Failed to publish post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI-Optimized Blog Generator
          </h1>
          <p className="text-muted-foreground mt-2">
            Create SEO and AI-crawler optimized content for maximum visibility
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={seoScore >= 80 ? 'default' : seoScore >= 50 ? 'secondary' : 'destructive'}>
            SEO Score: {seoScore}/100
          </Badge>
          <Button onClick={calculateSEOScore} variant="outline" size="sm">
            <Target className="h-4 w-4 mr-2" />
            Check Score
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
          <TabsTrigger value="citations">Citations</TabsTrigger>
          <TabsTrigger value="schema">Schema Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Post Content
              </CardTitle>
              <CardDescription>
                Use answer-first structure, clear headings (H2, H3), and conversational tone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="E.g., How to Optimize Your Website for AI Search in 2025?"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Keep under 60 characters. Include year or make it a question for better AI pickup.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  placeholder="how-to-optimize-website-ai-search-2025"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., AI Marketing, SEO, Digital Strategy"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content (Markdown) *</Label>
                <Textarea
                  id="content"
                  placeholder="## Quick Answer&#10;[Provide direct answer first]&#10;&#10;## Detailed Explanation&#10;### Why This Matters&#10;[Content]&#10;&#10;### How to Implement&#10;[Steps]"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[400px] font-mono"
                />
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <strong>AI Optimization Tips:</strong> Start with a direct answer, use question-based H2/H3 headings, 
                    include lists and tables, keep paragraphs concise (one idea each).
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO & Metadata</CardTitle>
              <CardDescription>
                Optimize for both traditional search engines and AI crawlers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description *</Label>
                <Textarea
                  id="metaDescription"
                  placeholder="Concise description with clear CTA (120-160 characters)"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">
                  {metaDescription.length}/160 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="funnelStage">Funnel Stage</Label>
                <Select value={funnelStage} onValueChange={(v) => setFunnelStage(v as FunnelStage)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOFU">TOFU - Top of Funnel (Awareness)</SelectItem>
                    <SelectItem value="MOFU">MOFU - Middle of Funnel (Consideration)</SelectItem>
                    <SelectItem value="BOFU">BOFU - Bottom of Funnel (Decision)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tags / Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button onClick={addTag} variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="citations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Citations & Sources</CardTitle>
              <CardDescription>
                Add authoritative sources to build E-E-A-T credibility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Source Title</Label>
                    <Input
                      placeholder="e.g., Google Search Central Blog"
                      value={citationTitle}
                      onChange={(e) => setCitationTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Source URL</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://..."
                        value={citationUrl}
                        onChange={(e) => setCitationUrl(e.target.value)}
                      />
                      <Button onClick={addCitation} variant="outline" size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Added Citations ({citations.length})</Label>
                  {citations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No citations added yet</p>
                  ) : (
                    <div className="space-y-2">
                      {citations.map((citation, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{citation.title}</p>
                            <a 
                              href={citation.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              {citation.url}
                            </a>
                          </div>
                          <Button 
                            onClick={() => removeCitation(index)} 
                            variant="ghost" 
                            size="icon"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>JSON-LD Schema Preview</CardTitle>
              <CardDescription>
                This structured data will be embedded in your published post
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                {JSON.stringify(generateSchema(), null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 mt-8">
        <Button onClick={handleSaveDraft} variant="outline" disabled={loading || !title || !content}>
          Save Draft
        </Button>
        <Button onClick={handlePublish} disabled={loading || !title || !content || !metaDescription}>
          <Sparkles className="h-4 w-4 mr-2" />
          Publish
        </Button>
      </div>
    </div>
  );
}
