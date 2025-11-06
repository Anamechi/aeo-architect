import { useState, useEffect } from 'react';
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
import { Sparkles, FileText, Target, TrendingUp, Plus, X, Wand2, Loader2, Lightbulb, Link2, ExternalLink, Image, CheckCircle, AlertCircle, RefreshCw, Eye, Edit, Upload, RotateCcw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ContentPreviewPanel } from '@/components/admin/ContentPreviewPanel';

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
  const [citationValidation, setCitationValidation] = useState<any>(null);
  const [validatingCitations, setValidatingCitations] = useState(false);
  
  // Author selection
  const [selectedAuthorId, setSelectedAuthorId] = useState('');
  const [authors, setAuthors] = useState<any[]>([]);
  
  // Image generation
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  
  // AI Reoptimization
  const [reoptimizationSuggestions, setReoptimizationSuggestions] = useState('');
  const [reoptimizing, setReoptimizing] = useState(false);
  
  // SEO Score (calculated)
  const [seoScore, setSeoScore] = useState(0);
  
  // AI Generation
  const [aiTopic, setAiTopic] = useState('');
  const [aiKeywords, setAiKeywords] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  // Cluster Generation
  const [clusterTopic, setClusterTopic] = useState('');
  const [clusterGenerating, setClusterGenerating] = useState(false);
  const [clusterProgress, setClusterProgress] = useState<Array<{stage: FunnelStage; status: 'pending' | 'generating' | 'complete' | 'error'; title?: string}>>([]);
  
  // Funnel Linking
  const [linkSuggestions, setLinkSuggestions] = useState<any[]>([]);
  const [linkingStrategy, setLinkingStrategy] = useState('');
  const [loadingLinks, setLoadingLinks] = useState(false);
  
  // Internal Link Suggestions
  const [internalLinkSuggestions, setInternalLinkSuggestions] = useState<any[]>([]);
  const [loadingInternalLinks, setLoadingInternalLinks] = useState(false);
  const [insertedLinks, setInsertedLinks] = useState<Set<string>>(new Set());
  
  // Preview and editing
  const [showPreview, setShowPreview] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [uploadingCustomImage, setUploadingCustomImage] = useState(false);
  
  const [loading, setLoading] = useState(false);

  // Fetch authors on mount
  useEffect(() => {
    const fetchAuthors = async () => {
      const { data, error } = await supabase
        .from('authors')
        .select('id, name, title, expertise_areas')
        .order('name');
      
      if (error) {
        console.error('Error fetching authors:', error);
        return;
      }
      
      setAuthors(data || []);
    };
    
    fetchAuthors();
  }, []);

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

  const generateWithAI = async (action: 'outline' | 'full-content' | 'optimize') => {
    if (!aiTopic && action !== 'optimize') {
      toast.error('Please enter a topic first');
      return;
    }

    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: {
          topic: action === 'optimize' ? content : aiTopic,
          keywords: aiKeywords,
          funnelStage,
          action
        }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.message?.includes('402')) {
          toast.error('AI credits depleted. Please add funds to continue.');
        } else {
          throw error;
        }
        return;
      }

      const generatedContent = data.content;

      if (action === 'outline') {
        toast.success('Outline generated! Review and edit as needed.');
        setContent(generatedContent);
      } else if (action === 'full-content') {
        setContent(generatedContent);
        setShowPreview(true); // Auto-show preview
        
        // Auto-fill title and meta if they're empty
        if (!title && generatedContent.includes('# ')) {
          const titleMatch = generatedContent.match(/# (.+)/);
          if (titleMatch) handleTitleChange(titleMatch[1]);
        }
        
        toast.success('Full content generated! Generating featured image...');
        
        // Auto-generate featured image
        try {
          const imagePrompt = `Blog post featured image for: ${title || aiTopic}. ${funnelStage === 'TOFU' ? 'Educational and informative visual' : funnelStage === 'MOFU' ? 'Comparison or evaluation focused visual' : 'Decision and action oriented visual'}`;
          
          const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-blog-image', {
            body: { prompt: imagePrompt, style: 'professional' }
          });

          if (!imageError && imageData?.imageUrl) {
            setFeaturedImageUrl(imageData.imageUrl);
            setGeneratedImages([...generatedImages, imageData.imageUrl]);
            toast.success('Featured image generated successfully!');
          }
        } catch (imgError) {
          console.error('Image generation failed:', imgError);
          toast.info('Content generated successfully (image generation failed)');
        }
      } else if (action === 'optimize') {
        setAiSuggestions(generatedContent.split('\n').filter((s: string) => s.trim()));
        toast.success('Optimization suggestions generated!');
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error(error.message || 'Failed to generate content');
    } finally {
      setAiGenerating(false);
    }
  };

  const suggestFunnelLinks = async () => {
    if (!category && tags.length === 0) {
      toast.error('Please add a category or tags first to get relevant link suggestions');
      return;
    }

    setLoadingLinks(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-funnel-links', {
        body: {
          currentFunnelStage: funnelStage,
          category,
          tags,
          currentSlug: slug
        }
      });

      if (error) throw error;

      setLinkSuggestions(data.suggestions || []);
      setLinkingStrategy(data.strategy || '');
      
      if (data.suggestions?.length > 0) {
        toast.success(`Found ${data.suggestions.length} strategic link suggestions`);
      } else {
        toast.info('No relevant articles found. Try publishing more content in different funnel stages.');
      }
    } catch (error: any) {
      console.error('Link suggestion error:', error);
      toast.error(error.message || 'Failed to generate link suggestions');
    } finally {
      setLoadingLinks(false);
    }
  };

  const copyLinkMarkdown = (title: string, slug: string) => {
    const markdown = `[${title}](/blog/${slug})`;
    navigator.clipboard.writeText(markdown);
    toast.success('Link markdown copied to clipboard!');
  };

  const generateImage = async () => {
    if (!imagePrompt) {
      toast.error('Please enter an image prompt');
      return;
    }

    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-image', {
        body: { prompt: imagePrompt, style: 'professional' }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error('Rate limit exceeded. Please try again later.');
        } else if (error.message?.includes('402')) {
          toast.error('AI credits depleted. Please add funds.');
        } else {
          throw error;
        }
        return;
      }

      setGeneratedImages([...generatedImages, data.imageUrl]);
      toast.success('Image generated! Copy or download to use in your article.');
      setImagePrompt('');
    } catch (error: any) {
      console.error('Image generation error:', error);
      toast.error(error.message || 'Failed to generate image');
    } finally {
      setGeneratingImage(false);
    }
  };

  const validateCitations = async () => {
    if (citations.length === 0) {
      toast.error('Add citations first to validate them');
      return;
    }

    setValidatingCitations(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-citations', {
        body: { citations }
      });

      if (error) throw error;

      setCitationValidation(data);
      
      const { summary } = data;
      if (summary.broken > 0 || summary.error > 0) {
        toast.warning(`Found ${summary.broken + summary.error} broken/error citations`);
      } else {
        toast.success(`All ${summary.valid} citations are valid!`);
      }
    } catch (error: any) {
      console.error('Citation validation error:', error);
      toast.error(error.message || 'Failed to validate citations');
    } finally {
      setValidatingCitations(false);
    }
  };

  const reoptimizeContent = async () => {
    if (!content || !title) {
      toast.error('Add content and title first to reoptimize');
      return;
    }

    setReoptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('reoptimize-blog-content', {
        body: {
          postId: null, // New post, no ID yet
          currentContent: content,
          optimizationGoals: 'Improve SEO score, readability, and AI crawler visibility'
        }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error('Rate limit exceeded. Please try again later.');
        } else if (error.message?.includes('402')) {
          toast.error('AI credits depleted. Please add funds.');
        } else {
          throw error;
        }
        return;
      }

      setReoptimizationSuggestions(data.suggestions);
      toast.success('Optimization suggestions generated!');
    } catch (error: any) {
      console.error('Reoptimization error:', error);
      toast.error(error.message || 'Failed to generate optimization suggestions');
    } finally {
      setReoptimizing(false);
    }
  };

  const generateCluster = async () => {
    if (!clusterTopic) {
      toast.error('Please enter a topic for the cluster');
      return;
    }

    setClusterGenerating(true);
    
    // Initialize progress tracking: 3 TOFU, 2 MOFU, 1 BOFU
    const stages: FunnelStage[] = ['TOFU', 'TOFU', 'TOFU', 'MOFU', 'MOFU', 'BOFU'];
    setClusterProgress(stages.map(stage => ({ stage, status: 'pending' })));

    const results = [];

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      
      // Update status to generating
      setClusterProgress(prev => prev.map((item, idx) => 
        idx === i ? { ...item, status: 'generating' } : item
      ));

      try {
        // Generate content
        const { data, error } = await supabase.functions.invoke('generate-blog-content', {
          body: {
            topic: clusterTopic,
            keywords: '',
            funnelStage: stage,
            action: 'full-content'
          }
        });

        if (error) throw error;

        const generatedContent = data.content;
        
        // Extract title from generated content
        const titleMatch = generatedContent.match(/# (.+)/);
        const extractedTitle = titleMatch ? titleMatch[1] : `${clusterTopic} - ${stage} ${i + 1}`;
        
        // Generate slug
        const generatedSlug = extractedTitle
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/--+/g, '-')
          .trim();

        // Generate image for the blog post
        let featuredImageUrl = null;
        try {
          const imagePrompt = `Blog post featured image for: ${extractedTitle}. ${stage === 'TOFU' ? 'Educational and informative visual' : stage === 'MOFU' ? 'Comparison or evaluation focused visual' : 'Decision and action oriented visual'}`;
          
          const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-blog-image', {
            body: { prompt: imagePrompt, style: 'professional' }
          });

          if (!imageError && imageData?.imageUrl) {
            featuredImageUrl = imageData.imageUrl;
          }
        } catch (imageError) {
          console.error('Failed to generate image, continuing without it:', imageError);
        }

        // Save as draft
        const { error: saveError } = await supabase
          .from('blog_posts')
          .insert({
            title: extractedTitle,
            slug: `${generatedSlug}-${Date.now()}`, // Add timestamp to ensure uniqueness
            content: generatedContent,
            funnel_stage: stage,
            status: 'draft',
            author_id: selectedAuthorId || null,
            category: category || null,
            featured_image_url: featuredImageUrl,
          } as any);

        if (saveError) throw saveError;

        results.push({ stage, title: extractedTitle, success: true });
        
        // Update status to complete
        setClusterProgress(prev => prev.map((item, idx) => 
          idx === i ? { ...item, status: 'complete', title: extractedTitle } : item
        ));

      } catch (error: any) {
        console.error(`Error generating ${stage} blog ${i + 1}:`, error);
        results.push({ stage, success: false, error: error.message });
        
        // Update status to error
        setClusterProgress(prev => prev.map((item, idx) => 
          idx === i ? { ...item, status: 'error' } : item
        ));
      }

      // Add delay between requests to avoid rate limiting
      if (i < stages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Increased to 3s for image generation
      }
    }

    setClusterGenerating(false);
    
    const successCount = results.filter(r => r.success).length;
    toast.success(`Cluster generation complete! ${successCount}/6 blogs created with images.`);
  };

  // Calculate word count and reading time
  const calculateReadingStats = () => {
    const words = content.trim().split(/\s+/).length;
    const readingTime = Math.ceil(words / 200); // Avg 200 words per minute
    return { wordCount: words, readingTime };
  };

  // Handle content editing
  const startEditing = () => {
    setEditedContent(content);
    setIsEditingContent(true);
  };

  const saveEdits = () => {
    setContent(editedContent);
    setIsEditingContent(false);
    setHasUnsavedChanges(true);
    toast.success('Content updated! Remember to save/publish.');
  };

  const cancelEditing = () => {
    setEditedContent('');
    setIsEditingContent(false);
  };

  // Regenerate featured image
  const regenerateFeaturedImage = async () => {
    if (!title && !aiTopic) {
      toast.error('Add a title or topic first');
      return;
    }

    setGeneratingImage(true);
    try {
      const imagePrompt = `Blog post featured image for: ${title || aiTopic}. ${funnelStage === 'TOFU' ? 'Educational and informative visual' : funnelStage === 'MOFU' ? 'Comparison or evaluation focused visual' : 'Decision and action oriented visual'}`;
      
      const { data, error } = await supabase.functions.invoke('generate-blog-image', {
        body: { prompt: imagePrompt, style: 'professional' }
      });

      if (error) throw error;

      setFeaturedImageUrl(data.imageUrl);
      setGeneratedImages([...generatedImages, data.imageUrl]);
      toast.success('Featured image regenerated!');
    } catch (error: any) {
      console.error('Image generation error:', error);
      toast.error(error.message || 'Failed to regenerate image');
    } finally {
      setGeneratingImage(false);
    }
  };

  // Handle custom image upload
  const handleCustomImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingCustomImage(true);
    try {
      // For now, just use a data URL (in production, upload to storage)
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setFeaturedImageUrl(dataUrl);
        toast.success('Custom image uploaded!');
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingCustomImage(false);
    }
  };

  // Suggest internal links
  const suggestInternalLinks = async () => {
    if (!content || content.length < 200) {
      toast.error('Add more content first (at least 200 characters) to get link suggestions');
      return;
    }

    setLoadingInternalLinks(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-internal-links', {
        body: {
          content,
          title,
          funnelStage,
          currentSlug: slug
        }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error('Rate limit exceeded. Please try again later.');
        } else if (error.message?.includes('402')) {
          toast.error('AI credits depleted. Please add funds.');
        } else {
          throw error;
        }
        return;
      }

      setInternalLinkSuggestions(data.suggestions || []);
      
      if (data.suggestions?.length > 0) {
        toast.success(`Found ${data.suggestions.length} strategic internal link opportunities!`);
      } else {
        toast.info(data.message || 'No suitable internal links found. Try publishing more content first.');
      }
    } catch (error: any) {
      console.error('Internal link suggestion error:', error);
      toast.error(error.message || 'Failed to generate link suggestions');
    } finally {
      setLoadingInternalLinks(false);
    }
  };

  // Insert suggested link into content
  const insertInternalLink = (suggestion: any) => {
    const linkMarkdown = `[${suggestion.anchorText}](/blog/${suggestion.targetSlug})`;
    
    // Try to find the context snippet in the content to insert near it
    const contextIndex = content.indexOf(suggestion.contextSnippet);
    
    let newContent;
    if (contextIndex !== -1) {
      // Insert the link right after the context snippet
      const insertPosition = contextIndex + suggestion.contextSnippet.length;
      newContent = content.slice(0, insertPosition) + ' ' + linkMarkdown + content.slice(insertPosition);
    } else {
      // If context not found, append at the end of the content
      newContent = content + '\n\n' + linkMarkdown;
    }
    
    setContent(newContent);
    setHasUnsavedChanges(true);
    
    // Mark as inserted
    setInsertedLinks(prev => new Set([...prev, suggestion.targetSlug]));
    
    toast.success(`Link to "${suggestion.targetTitle}" inserted!`);
  };

  // Copy link markdown to clipboard
  const copyInternalLinkMarkdown = (suggestion: any) => {
    const linkMarkdown = `[${suggestion.anchorText}](/blog/${suggestion.targetSlug})`;
    navigator.clipboard.writeText(linkMarkdown);
    toast.success('Link markdown copied to clipboard!');
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side - Blog Form */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3 bg-gradient-primary bg-clip-text text-transparent">
                <Sparkles className="h-10 w-10 text-primary" />
                AI Blog Generator
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Create SEO-optimized content with automatic images and smart linking
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <Badge variant="destructive" className="animate-pulse">
                  Unsaved Changes
                </Badge>
              )}
              <Badge 
                variant={seoScore >= 80 ? 'default' : seoScore >= 50 ? 'secondary' : 'destructive'}
                className="text-base px-4 py-2"
              >
                SEO Score: {seoScore}/100
              </Badge>
              <Button onClick={calculateSEOScore} variant="outline" size="lg" className="shadow-md hover:shadow-lg transition-all">
                <Target className="h-5 w-5 mr-2" />
                Check Score
              </Button>
            </div>
          </div>

          <Tabs defaultValue="ai-generate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8 text-xs">
          <TabsTrigger value="ai-generate">
            <Wand2 className="h-4 w-4 mr-1" />
            AI Generate
          </TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="internal-links">
            <Link2 className="h-4 w-4 mr-1" />
            Internal Links
          </TabsTrigger>
          <TabsTrigger value="funnel-links">Funnel</TabsTrigger>
          <TabsTrigger value="media">
            <Image className="h-4 w-4 mr-1" />
            Media
          </TabsTrigger>
          <TabsTrigger value="citations">Citations</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-generate" className="space-y-6">
          {/* Cluster Generation Card */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Cluster Generation (6 Blogs)
              </CardTitle>
              <CardDescription>
                Generate a complete content cluster: 3 TOFU, 2 MOFU, 1 BOFU blogs at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cluster-topic">Main Topic / Theme *</Label>
                  <Input
                    id="cluster-topic"
                    placeholder="e.g., Marketing Automation, AI in Business, Content Strategy"
                    value={clusterTopic}
                    onChange={(e) => setClusterTopic(e.target.value)}
                    disabled={clusterGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    AI will create 6 related blogs covering different angles and funnel stages
                  </p>
                </div>

                <Button
                  onClick={generateCluster}
                  disabled={clusterGenerating || !clusterTopic}
                  className="w-full"
                  size="lg"
                >
                  {clusterGenerating ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5 mr-2" />
                  )}
                  {clusterGenerating ? 'Generating Cluster...' : 'Generate 6-Blog Cluster'}
                </Button>

                {clusterProgress.length > 0 && (
                  <div className="space-y-2 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-3">Progress:</p>
                    {clusterProgress.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        {item.status === 'pending' && (
                          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                        )}
                        {item.status === 'generating' && (
                          <Loader2 className="h-4 w-4 text-primary animate-spin" />
                        )}
                        {item.status === 'complete' && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {item.status === 'error' && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                        <Badge variant={item.status === 'complete' ? 'default' : 'outline'} className="text-xs">
                          {item.stage}
                        </Badge>
                        {item.title && (
                          <span className="text-xs text-muted-foreground truncate flex-1">{item.title}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                Single Blog Generator
              </CardTitle>
              <CardDescription>
                Generate individual blog content - from outline to full article
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ai-topic">Topic / Main Question *</Label>
                  <Input
                    id="ai-topic"
                    placeholder="e.g., How to optimize website speed for better SEO"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai-keywords">Target Keywords (optional)</Label>
                  <Input
                    id="ai-keywords"
                    placeholder="e.g., website speed, page load time, SEO optimization"
                    value={aiKeywords}
                    onChange={(e) => setAiKeywords(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai-funnel">Funnel Stage</Label>
                  <Select value={funnelStage} onValueChange={(v) => setFunnelStage(v as FunnelStage)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOFU">TOFU - Awareness Content</SelectItem>
                      <SelectItem value="MOFU">MOFU - Consideration Content</SelectItem>
                      <SelectItem value="BOFU">BOFU - Decision Content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-3 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Generation Options:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Button
                    onClick={() => generateWithAI('outline')}
                    disabled={aiGenerating || !aiTopic}
                    className="w-full"
                    variant="outline"
                  >
                    {aiGenerating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Generate Outline
                  </Button>
                  <Button
                    onClick={() => generateWithAI('full-content')}
                    disabled={aiGenerating || !aiTopic}
                    className="w-full"
                  >
                    {aiGenerating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate Full Article
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Start with an outline to review structure, or generate the full article directly.
                </p>
              </div>

              {content && (
                <div className="space-y-3">
                  <Button
                    onClick={() => generateWithAI('optimize')}
                    disabled={aiGenerating}
                    variant="secondary"
                    className="w-full"
                  >
                    {aiGenerating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Lightbulb className="h-4 w-4 mr-2" />
                    )}
                    Get AI Optimization Suggestions
                  </Button>

                  {aiSuggestions.length > 0 && (
                    <Alert>
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription>
                        <strong className="block mb-2">AI Suggestions:</strong>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {aiSuggestions.slice(0, 7).map((suggestion, i) => (
                            <li key={i}>{suggestion}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                <Label htmlFor="author">Author (E-E-A-T)</Label>
                <Select value={selectedAuthorId} onValueChange={setSelectedAuthorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an author..." />
                  </SelectTrigger>
                  <SelectContent>
                    {authors.map(author => (
                      <SelectItem key={author.id} value={author.id}>
                        {author.name} {author.title && `- ${author.title}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Boost E-E-A-T by assigning a credentialed author
                </p>
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

        <TabsContent value="internal-links" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                Smart Internal Linking
              </CardTitle>
              <CardDescription>
                AI analyzes your content and suggests strategic places to link to other blog posts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong className="block mb-1">How it works:</strong>
                  AI analyzes your content and finds natural opportunities to link to relevant articles. 
                  Each suggestion includes anchor text, placement context, and SEO reasoning.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={suggestInternalLinks}
                  disabled={loadingInternalLinks || !content || content.length < 200}
                  className="w-full shadow-md hover:shadow-lg transition-all"
                  size="lg"
                >
                  {loadingInternalLinks ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {loadingInternalLinks ? 'Analyzing Content...' : 'Generate Link Suggestions'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Write at least 200 characters of content first for best results
                </p>
              </div>

              {internalLinkSuggestions.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-t pt-4">
                    <h3 className="text-sm font-semibold">
                      {internalLinkSuggestions.length} Link Suggestions
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {insertedLinks.size} Inserted
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {internalLinkSuggestions.map((suggestion: any, index: number) => {
                      const isInserted = insertedLinks.has(suggestion.targetSlug);
                      
                      return (
                        <Card key={index} className={`border-2 transition-all ${isInserted ? 'border-green-200 bg-green-50/50' : 'border-border hover:border-primary/30'}`}>
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs">
                                      {suggestion.placement || 'General'}
                                    </Badge>
                                    {isInserted && (
                                      <Badge className="text-xs bg-green-600">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Inserted
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <h4 className="font-semibold text-sm mb-1">
                                    Link to: {suggestion.targetTitle}
                                  </h4>
                                  
                                  <div className="bg-muted p-2 rounded text-xs font-mono mb-2">
                                    [{suggestion.anchorText}](/blog/{suggestion.targetSlug})
                                  </div>

                                  {suggestion.contextSnippet && (
                                    <div className="text-xs text-muted-foreground mb-2 p-2 bg-background rounded border">
                                      <strong>Context:</strong> ...{suggestion.contextSnippet}...
                                    </div>
                                  )}
                                  
                                  <p className="text-xs text-muted-foreground mb-2">
                                    <strong>Why link here:</strong> {suggestion.reasoning}
                                  </p>

                                  {suggestion.funnelStrategy && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400">
                                      <strong>Funnel Strategy:</strong> {suggestion.funnelStrategy}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-2 border-t">
                                <Button
                                  size="sm"
                                  onClick={() => insertInternalLink(suggestion)}
                                  disabled={isInserted}
                                  className="flex-1 shadow-sm hover:shadow-md transition-all"
                                >
                                  {isInserted ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Inserted
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4 mr-2" />
                                      Insert Link
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyInternalLinkMarkdown(suggestion)}
                                  className="flex-1"
                                >
                                  Copy Markdown
                                </Button>
                                <a
                                  href={`/blog/${suggestion.targetSlug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1 px-3"
                                >
                                  Preview <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Pro Tip:</strong> Click "Insert Link" to automatically place the link in context, 
                      or copy the markdown and manually place it where you think it fits best. Aim for 3-7 internal links per article.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {internalLinkSuggestions.length === 0 && !loadingInternalLinks && (
                <Alert>
                  <AlertDescription className="text-sm">
                    No suggestions yet. Write your content and click "Generate Link Suggestions" to get AI-powered internal linking recommendations.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel-links" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                TOFU-MOFU-BOFU Strategic Linking
              </CardTitle>
              <CardDescription>
                Get AI-powered suggestions for internal links that guide readers through your funnel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong className="block mb-1">Current Stage: {funnelStage}</strong>
                  {funnelStage === 'TOFU' && 'Guide readers from awareness to consideration with MOFU links'}
                  {funnelStage === 'MOFU' && 'Provide context with TOFU links and guide to decision with BOFU links'}
                  {funnelStage === 'BOFU' && 'Add supporting detail with MOFU links'}
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={suggestFunnelLinks}
                  disabled={loadingLinks || (!category && tags.length === 0)}
                  className="w-full"
                >
                  {loadingLinks ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4 mr-2" />
                  )}
                  Analyze & Suggest Strategic Links
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Add category and tags first for best results
                </p>
              </div>

              {linkSuggestions.length > 0 && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2 text-sm">{linkingStrategy}</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Found {linkSuggestions.length} strategic link opportunities
                    </p>
                  </div>

                  <div className="space-y-3">
                    {linkSuggestions.map((suggestion, index) => (
                      <Card key={suggestion.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {suggestion.funnelStage}
                                </Badge>
                                {suggestion.category && (
                                  <Badge variant="secondary" className="text-xs">
                                    {suggestion.category}
                                  </Badge>
                                )}
                                <Badge className="text-xs">
                                  Score: {suggestion.relevanceScore}
                                </Badge>
                              </div>
                              
                              <h4 className="font-semibold text-sm leading-tight">
                                {suggestion.title}
                              </h4>
                              
                              <p className="text-xs text-muted-foreground">
                                {suggestion.linkReason}
                              </p>
                              
                              {suggestion.metaDescription && (
                                <p className="text-xs text-muted-foreground italic line-clamp-2">
                                  "{suggestion.metaDescription}"
                                </p>
                              )}
                              
                              <div className="flex items-center gap-2 pt-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyLinkMarkdown(suggestion.title, suggestion.slug)}
                                  className="text-xs h-7"
                                >
                                  Copy Link Markdown
                                </Button>
                                <a
                                  href={`/blog/${suggestion.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                  Preview <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Pro Tip:</strong> Copy the markdown and paste it into your content where contextually relevant. 
                      Use 2-4 internal links per article for optimal SEO and user experience.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {linkSuggestions.length === 0 && !loadingLinks && linkingStrategy && (
                <Alert>
                  <AlertDescription>
                    No relevant articles found yet. Publish more content across different funnel stages to enable strategic linking.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                AI Image Generation
              </CardTitle>
              <CardDescription>
                Generate professional images for your blog article using AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image-prompt">Image Description</Label>
                  <Textarea
                    id="image-prompt"
                    placeholder="E.g., A modern workspace with a laptop showing analytics dashboard, professional lighting, clean design"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={generateImage}
                  disabled={generatingImage || !imagePrompt}
                  className="w-full"
                >
                  {generatingImage ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Image className="h-4 w-4 mr-2" />
                  )}
                  Generate Professional Image
                </Button>
              </div>

              {generatedImages.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <Label>Generated Images ({generatedImages.length})</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {generatedImages.map((imgUrl, index) => (
                      <div key={index} className="space-y-2">
                        <img 
                          src={imgUrl} 
                          alt={`Generated ${index + 1}`}
                          className="w-full rounded-lg border"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = imgUrl;
                              link.download = `blog-image-${index + 1}.png`;
                              link.click();
                            }}
                          >
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={() => {
                              navigator.clipboard.writeText(imgUrl);
                              toast.success('Image URL copied!');
                            }}
                          >
                            Copy URL
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Pro Tip:</strong> Download and upload images to your own hosting for better SEO. 
                      Add descriptive alt text when inserting into your article.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={reoptimizeContent}
                  disabled={reoptimizing || !content}
                  variant="secondary"
                  className="flex-1"
                >
                  {reoptimizing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  AI Content Reoptimization
                </Button>
              </div>

              {reoptimizationSuggestions && (
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong className="block mb-2">Reoptimization Suggestions:</strong>
                    <div className="text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                      {reoptimizationSuggestions}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
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

                <div className="flex gap-2">
                  <Button
                    onClick={validateCitations}
                    disabled={validatingCitations || citations.length === 0}
                    variant="secondary"
                    className="flex-1"
                  >
                    {validatingCitations ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Validate All Citations
                  </Button>
                </div>

                {citationValidation && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong className="block mb-2">Validation Results:</strong>
                      <div className="flex gap-4 text-xs">
                        <span className="text-green-600">✓ Valid: {citationValidation.summary.valid}</span>
                        {citationValidation.summary.broken > 0 && (
                          <span className="text-red-600">✗ Broken: {citationValidation.summary.broken}</span>
                        )}
                        {citationValidation.summary.slow > 0 && (
                          <span className="text-yellow-600">⚠ Slow: {citationValidation.summary.slow}</span>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label>Added Citations ({citations.length})</Label>
                  {citations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No citations added yet</p>
                  ) : (
                    <div className="space-y-2">
                      {citations.map((citation, index) => {
                        const validation = citationValidation?.results?.find(
                          (r: any) => r.url === citation.url
                        );
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{citation.title}</p>
                                {validation && (
                                  <Badge 
                                    variant={validation.status === 'valid' ? 'default' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {validation.status === 'valid' ? (
                                      <><CheckCircle className="h-3 w-3 mr-1" /> Valid</>
                                    ) : (
                                      <><AlertCircle className="h-3 w-3 mr-1" /> {validation.status}</>
                                    )}
                                  </Badge>
                                )}
                              </div>
                              <a 
                                href={citation.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                {citation.url}
                              </a>
                              {validation && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {validation.message}
                                </p>
                              )}
                            </div>
                            <Button 
                              onClick={() => removeCitation(index)} 
                              variant="ghost" 
                              size="icon"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
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
        <Button onClick={handleSaveDraft} variant="outline" size="lg" disabled={loading || !title || !content} className="shadow-md hover:shadow-lg transition-all">
          Save Draft
        </Button>
        <Button onClick={handlePublish} size="lg" disabled={loading || !title || !content || !metaDescription} className="bg-gradient-primary shadow-md hover:shadow-xl transition-all">
          <Sparkles className="h-5 w-5 mr-2" />
          Publish
        </Button>
      </div>
    </div>

    {/* Right side - Preview Panel */}
    <div>
      <ContentPreviewPanel
        content={content}
        isGenerating={aiGenerating}
        featuredImageUrl={featuredImageUrl}
        onEdit={(newContent) => {
          setContent(newContent);
          setHasUnsavedChanges(true);
        }}
        onRegenerateImage={regenerateFeaturedImage}
        onUploadCustomImage={handleCustomImageUpload}
        generatingImage={generatingImage}
      />
    </div>
  </div>
</div>
  );
}
