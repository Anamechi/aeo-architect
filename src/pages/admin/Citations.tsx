import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ExternalLink, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';

interface Citation {
  id: string;
  url: string;
  title: string | null;
  status: 'valid' | 'broken' | 'redirect' | 'slow';
  authority_score: number | null;
  last_checked: string | null;
  used_in_posts: number;
  created_at: string;
}

export default function Citations() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCitation, setEditingCitation] = useState<Citation | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: citations, isLoading } = useQuery({
    queryKey: ['citations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('citations')
        .select('*')
        .order('used_in_posts', { ascending: false });
      
      if (error) throw error;
      return data as Citation[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (citationData: any) => {
      const { data, error } = await supabase
        .from('citations')
        .insert([citationData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citations'] });
      toast({ title: 'Citation added successfully' });
      setIsDialogOpen(false);
      setEditingCitation(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error adding citation', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...citationData }: any) => {
      const { data, error } = await supabase
        .from('citations')
        .update(citationData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citations'] });
      toast({ title: 'Citation updated successfully' });
      setIsDialogOpen(false);
      setEditingCitation(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating citation', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('citations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citations'] });
      toast({ title: 'Citation deleted successfully' });
    },
  });

  const checkHealthMutation = useMutation({
    mutationFn: async (id: string) => {
      // Simulate health check - in production, this would be an edge function
      const { data, error } = await supabase
        .from('citations')
        .update({ 
          last_checked: new Date().toISOString(),
          status: 'valid' // In real implementation, actually check the URL
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citations'] });
      toast({ title: 'Health check completed' });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const citationData = {
      url: formData.get('url')?.toString() || '',
      title: formData.get('title')?.toString() || null,
      status: 'valid',
      last_checked: new Date().toISOString(),
    };

    if (editingCitation) {
      updateMutation.mutate({ id: editingCitation.id, ...citationData });
    } else {
      createMutation.mutate(citationData);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'broken': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'redirect': return <RefreshCw className="h-4 w-4 text-yellow-500" />;
      case 'slow': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'default';
      case 'broken': return 'destructive';
      case 'redirect': return 'secondary';
      case 'slow': return 'outline';
      default: return 'secondary';
    }
  };

  const healthyCount = citations?.filter(c => c.status === 'valid').length || 0;
  const brokenCount = citations?.filter(c => c.status === 'broken').length || 0;
  const totalCount = citations?.length || 0;
  const healthPercentage = totalCount > 0 ? Math.round((healthyCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Citation Health Monitor</h1>
          <p className="text-muted-foreground">Track and validate citation links for content authority</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCitation(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Citation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCitation ? 'Edit Citation' : 'Add Citation'}</DialogTitle>
              <DialogDescription>
                {editingCitation ? 'Update citation details' : 'Add a new source citation'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="url">URL *</Label>
                <Input 
                  id="url" 
                  name="url" 
                  type="url"
                  defaultValue={editingCitation?.url} 
                  required 
                  placeholder="https://example.com/article"
                />
              </div>
              
              <div>
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  name="title" 
                  defaultValue={editingCitation?.title || ''} 
                  placeholder="Article or source title"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCitation ? 'Update' : 'Add'} Citation
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Health Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Citations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Healthy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">{healthyCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Broken</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-500">{brokenCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{healthPercentage}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Citations List */}
      {isLoading ? (
        <div className="text-center py-12">Loading citations...</div>
      ) : (
        <div className="grid gap-4">
          {citations?.map((citation) => (
            <Card key={citation.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(citation.status)}
                      <CardTitle className="text-lg">{citation.title || citation.url}</CardTitle>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <a 
                        href={citation.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center gap-1"
                      >
                        {citation.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(citation.status) as any}>
                    {citation.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-4">
                      <span className="text-muted-foreground">
                        Used in <strong>{citation.used_in_posts}</strong> posts
                      </span>
                      {citation.authority_score && (
                        <span className="text-muted-foreground">
                          Authority: <strong>{citation.authority_score}/100</strong>
                        </span>
                      )}
                    </div>
                    {citation.last_checked && (
                      <span className="text-muted-foreground">
                        Last checked {format(new Date(citation.last_checked), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => checkHealthMutation.mutate(citation.id)}
                      disabled={checkHealthMutation.isPending}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Check Now
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setEditingCitation(citation);
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
                        if (confirm('Are you sure you want to delete this citation?')) {
                          deleteMutation.mutate(citation.id);
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
