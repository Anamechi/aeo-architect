import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, Layers, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  generating: 'bg-yellow-100 text-yellow-800',
  complete: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
};

export default function Clusters() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [keyword, setKeyword] = useState('');
  const [audience, setAudience] = useState('');

  const { data: clusters, isLoading } = useQuery({
    queryKey: ['clusters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_clusters')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('content_clusters')
        .insert({ topic, primary_keyword: keyword, target_audience: audience, status: 'draft' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
      setOpen(false);
      setTopic('');
      setKeyword('');
      setAudience('');
      toast({ title: 'Cluster created' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (clusterId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-cluster', {
        body: { clusterId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clusters'] });
      toast({ title: 'Cluster generation started' });
    },
    onError: (err: Error) => {
      toast({ title: 'Generation failed', description: err.message, variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cluster Control Center</h1>
          <p className="text-muted-foreground">Create and manage content clusters (6 articles each)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Create Cluster</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Content Cluster</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Topic</Label>
                <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Marketing Automation for Coaches" />
              </div>
              <div>
                <Label>Primary Keyword</Label>
                <Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="marketing automation" />
              </div>
              <div>
                <Label>Target Audience</Label>
                <Textarea value={audience} onChange={e => setAudience(e.target.value)} placeholder="Business owners, coaches, consultants..." rows={3} />
              </div>
              <Button onClick={() => createMutation.mutate()} disabled={!topic || !keyword || createMutation.isPending} className="w-full">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Cluster
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : !clusters?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No clusters yet. Create one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clusters.map(cluster => (
            <Card key={cluster.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{cluster.topic}</CardTitle>
                  <Badge className={statusColors[cluster.status] || ''}>{cluster.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Keyword: <span className="font-medium text-foreground">{cluster.primary_keyword}</span></p>
                <p className="text-sm text-muted-foreground">Articles: {cluster.article_count} · Language: {cluster.language}</p>
                <div className="flex gap-2">
                  {cluster.status === 'draft' && (
                    <Button size="sm" onClick={() => generateMutation.mutate(cluster.id)} disabled={generateMutation.isPending}>
                      {generateMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                      Generate
                    </Button>
                  )}
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/admin/clusters/${cluster.id}`}>View <ArrowRight className="h-3 w-3 ml-1" /></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
