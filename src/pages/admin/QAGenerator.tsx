import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';

interface QAArticle {
  id: string;
  question: string;
  answer: string;
  slug: string;
  meta_description: string | null;
  tags: string[];
  funnel_stage: 'TOFU' | 'MOFU' | 'BOFU' | null;
  status: 'draft' | 'published' | 'archived';
  author_id: string | null;
  reviewed_by: string | null;
  published_at: string | null;
  created_at: string;
}

export default function QAGenerator() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<QAArticle | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: articles, isLoading } = useQuery({
    queryKey: ['qa-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qa_articles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as QAArticle[];
    },
  });

  const { data: authors } = useQuery({
    queryKey: ['authors-for-qa'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authors')
        .select('id, name');
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (articleData: any) => {
      const { data, error } = await supabase
        .from('qa_articles')
        .insert([articleData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qa-articles'] });
      toast({ title: 'QA article created successfully' });
      setIsDialogOpen(false);
      setEditingArticle(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating article', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...articleData }: any) => {
      const { data, error } = await supabase
        .from('qa_articles')
        .update(articleData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qa-articles'] });
      toast({ title: 'QA article updated successfully' });
      setIsDialogOpen(false);
      setEditingArticle(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating article', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('qa_articles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qa-articles'] });
      toast({ title: 'Article deleted successfully' });
    },
  });

  const generateSlug = (question: string) => {
    return question
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const question = formData.get('question')?.toString() || '';
    const tags = formData.get('tags')?.toString().split(',').map(t => t.trim()).filter(t => t) || [];
    
    const articleData = {
      question,
      answer: formData.get('answer')?.toString() || '',
      slug: formData.get('slug')?.toString() || generateSlug(question),
      meta_description: formData.get('meta_description')?.toString() || null,
      tags,
      funnel_stage: formData.get('funnel_stage')?.toString() || null,
      status: formData.get('status') as 'draft' | 'published' | 'archived',
      author_id: formData.get('author_id')?.toString() || null,
      published_at: formData.get('status') === 'published' ? new Date().toISOString() : null,
    };

    if (editingArticle) {
      updateMutation.mutate({ id: editingArticle.id, ...articleData });
    } else {
      createMutation.mutate(articleData);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'archived': return 'outline';
      default: return 'secondary';
    }
  };

  const getFunnelStageColor = (stage: string | null) => {
    switch (stage) {
      case 'tofu': return 'default';
      case 'mofu': return 'secondary';
      case 'bofu': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">QA Article Generator</h1>
          <p className="text-muted-foreground">Create SEO-optimized Q&A content for featured snippets</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingArticle(null)}>
              <Plus className="h-4 w-4 mr-2" />
              New QA Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingArticle ? 'Edit QA Article' : 'Create QA Article'}</DialogTitle>
              <DialogDescription>
                {editingArticle ? 'Update article details' : 'Create a new question-answer article'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="question">Question (becomes H1) *</Label>
                <Input 
                  id="question" 
                  name="question" 
                  defaultValue={editingArticle?.question} 
                  required 
                  placeholder="How do I optimize my website for AI search engines?"
                />
              </div>
              
              <div>
                <Label htmlFor="answer">Answer (markdown supported) *</Label>
                <Textarea 
                  id="answer" 
                  name="answer" 
                  defaultValue={editingArticle?.answer} 
                  required
                  rows={10}
                  placeholder="Start with a direct answer in the first 2-3 sentences..."
                />
              </div>

              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input 
                  id="slug" 
                  name="slug" 
                  defaultValue={editingArticle?.slug} 
                  placeholder="auto-generated-from-question"
                />
              </div>

              <div>
                <Label htmlFor="meta_description">Meta Description (160 chars max)</Label>
                <Textarea 
                  id="meta_description" 
                  name="meta_description" 
                  defaultValue={editingArticle?.meta_description || ''} 
                  rows={2}
                  maxLength={160}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input 
                  id="tags" 
                  name="tags" 
                  defaultValue={editingArticle?.tags?.join(', ') || ''} 
                  placeholder="AEO, SEO, AI Marketing"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="funnel_stage">Funnel Stage</Label>
                  <Select name="funnel_stage" defaultValue={editingArticle?.funnel_stage || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tofu">TOFU (Awareness)</SelectItem>
                      <SelectItem value="mofu">MOFU (Consideration)</SelectItem>
                      <SelectItem value="bofu">BOFU (Decision)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={editingArticle?.status || 'draft'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="author_id">Author</Label>
                <Select name="author_id" defaultValue={editingArticle?.author_id || undefined}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select author" />
                  </SelectTrigger>
                  <SelectContent>
                    {authors?.map(author => (
                      <SelectItem key={author.id} value={author.id}>{author.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingArticle ? 'Update' : 'Create'} Article
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading articles...</div>
      ) : (
        <div className="grid gap-4">
          {articles?.map((article) => (
            <Card key={article.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="mb-2">{article.question}</CardTitle>
                    <CardDescription className="line-clamp-2">{article.answer}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getStatusColor(article.status) as any}>
                      {article.status}
                    </Badge>
                    {article.funnel_stage && (
                      <Badge variant={getFunnelStageColor(article.funnel_stage) as any}>
                        {article.funnel_stage.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Created {format(new Date(article.created_at), 'MMM d, yyyy')}</span>
                    {article.published_at && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Published {format(new Date(article.published_at), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setEditingArticle(article);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this article?')) {
                          deleteMutation.mutate(article.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
