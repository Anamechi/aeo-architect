import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, ExternalLink, Wrench } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AITool {
  id: string;
  name: string;
  category: string;
  description: string | null;
  url: string | null;
  rating: number | null;
  use_case: string | null;
  internal_notes: string | null;
  api_key_required: boolean;
  cost_per_month: number | null;
  status: 'active' | 'testing' | 'deprecated';
}

export default function AITools() {
  const [tools, setTools] = useState<AITool[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<AITool | null>(null);
  const { toast } = useToast();

  type ToolStatus = 'active' | 'testing' | 'deprecated';

  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    description: string;
    url: string;
    rating: number;
    use_case: string;
    internal_notes: string;
    api_key_required: boolean;
    cost_per_month: string;
    status: ToolStatus;
  }>({
    name: '',
    category: '',
    description: '',
    url: '',
    rating: 5,
    use_case: '',
    internal_notes: '',
    api_key_required: false,
    cost_per_month: '',
    status: 'active',
  });

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error loading tools',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setTools(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const toolData = {
      ...formData,
      cost_per_month: formData.cost_per_month ? parseFloat(formData.cost_per_month) : null,
    };

    if (editingTool) {
      const { error } = await supabase
        .from('ai_tools')
        .update(toolData)
        .eq('id', editingTool.id);

      if (error) {
        toast({
          title: 'Error updating tool',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Tool updated successfully' });
        loadTools();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('ai_tools')
        .insert([toolData]);

      if (error) {
        toast({
          title: 'Error creating tool',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Tool created successfully' });
        loadTools();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;

    const { error } = await supabase
      .from('ai_tools')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error deleting tool',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Tool deleted successfully' });
      loadTools();
    }
  };

  const handleEdit = (tool: AITool) => {
    setEditingTool(tool);
    setFormData({
      name: tool.name,
      category: tool.category,
      description: tool.description || '',
      url: tool.url || '',
      rating: tool.rating || 5,
      use_case: tool.use_case || '',
      internal_notes: tool.internal_notes || '',
      api_key_required: tool.api_key_required,
      cost_per_month: tool.cost_per_month?.toString() || '',
      status: tool.status,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      url: '',
      rating: 5,
      use_case: '',
      internal_notes: '',
      api_key_required: false,
      cost_per_month: '',
      status: 'active',
    });
    setEditingTool(null);
    setDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'testing': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'deprecated': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default: return '';
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Tools Manager</h1>
          <p className="text-muted-foreground mt-2">
            Manage the AI tools ANAMECHI uses to power content and optimization
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tool
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTool ? 'Edit Tool' : 'Add New Tool'}</DialogTitle>
              <DialogDescription>
                {editingTool ? 'Update the tool details below' : 'Add a new AI tool to your arsenal'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tool Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    placeholder="e.g., AI Assistant, SEO, Marketing"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="use_case">How ANAMECHI Uses It</Label>
                <Textarea
                  id="use_case"
                  placeholder="Describe how this tool fits into ANAMECHI's workflow"
                  value={formData.use_case}
                  onChange={(e) => setFormData({ ...formData, use_case: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="internal_notes">Internal Notes (Private)</Label>
                <Textarea
                  id="internal_notes"
                  placeholder="API keys, team tips, etc."
                  value={formData.internal_notes}
                  onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Cost/Month ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.cost_per_month}
                    onChange={(e) => setFormData({ ...formData, cost_per_month: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                      <SelectItem value="deprecated">Deprecated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="api_key"
                  checked={formData.api_key_required}
                  onChange={(e) => setFormData({ ...formData, api_key_required: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="api_key" className="cursor-pointer">API Key Required</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingTool ? 'Update Tool' : 'Create Tool'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Card key={tool.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                  <CardDescription>{tool.category}</CardDescription>
                </div>
                <Badge className={getStatusColor(tool.status)}>
                  {tool.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {tool.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {tool.description}
                </p>
              )}

              {tool.use_case && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">How We Use It:</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {tool.use_case}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {tool.rating && (
                  <span>⭐ {tool.rating}/5</span>
                )}
                {tool.cost_per_month && (
                  <span>${tool.cost_per_month}/mo</span>
                )}
                {tool.api_key_required && (
                  <span>🔑 API Key</span>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                {tool.url && (
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <a href={tool.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Visit
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleEdit(tool)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(tool.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tools.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No AI Tools Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start by adding the AI tools ANAMECHI uses
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Tool
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
