import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Globe, FileText } from 'lucide-react';
import { useState } from 'react';

const funnelColors: Record<string, string> = {
  TOFU: 'bg-blue-100 text-blue-800',
  MOFU: 'bg-purple-100 text-purple-800',
  BOFU: 'bg-orange-100 text-orange-800',
};

export default function ClusterDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [translateLang, setTranslateLang] = useState('');

  const { data: cluster } = useQuery({
    queryKey: ['cluster', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_clusters')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: articles, isLoading } = useQuery({
    queryKey: ['cluster-articles', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, status, funnel_stage, language, hreflang')
        .eq('group_id', id!)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: qas } = useQuery({
    queryKey: ['cluster-qas', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qa_articles')
        .select('id, question, status, language')
        .eq('group_id', id!)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const translateMutation = useMutation({
    mutationFn: async (blogPostId: string) => {
      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: { blogPostId, targetLanguage: translateLang },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cluster-articles', id] });
      queryClient.invalidateQueries({ queryKey: ['cluster-qas', id] });
      toast({ title: 'Translation complete' });
    },
    onError: (err: Error) => {
      toast({ title: 'Translation failed', description: err.message, variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/clusters"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{cluster?.topic || 'Cluster'}</h1>
          <p className="text-muted-foreground">Keyword: {cluster?.primary_keyword} · {articles?.length || 0} articles · {qas?.length || 0} QAs</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Articles</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={translateLang} onValueChange={setTranslateLang}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Language" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
          ) : !articles?.length ? (
            <p className="text-muted-foreground text-center py-6">No articles generated yet.</p>
          ) : (
            <div className="space-y-3">
              {articles.map(article => (
                <div key={article.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge className={funnelColors[article.funnel_stage || ''] || 'bg-muted'}>{article.funnel_stage || '—'}</Badge>
                    <div>
                      <Link to={`/admin/blog/edit/${article.id}`} className="font-medium hover:underline">{article.title}</Link>
                      <p className="text-xs text-muted-foreground">{article.language?.toUpperCase()} · {article.status}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {translateLang && article.language === 'en' && (
                      <Button size="sm" variant="outline" onClick={() => translateMutation.mutate(article.id)} disabled={translateMutation.isPending}>
                        <Globe className="h-3 w-3 mr-1" />Translate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {qas && qas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated QAs ({qas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {qas.map(qa => (
                <div key={qa.id} className="p-3 rounded-lg border">
                  <p className="font-medium text-sm">{qa.question}</p>
                  <p className="text-xs text-muted-foreground">{qa.language?.toUpperCase()} · {qa.status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
