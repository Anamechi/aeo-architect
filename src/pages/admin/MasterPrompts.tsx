import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MasterPrompt } from '@/types/content';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MasterPrompts = () => {
  const [prompts, setPrompts] = useState<MasterPrompt[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<Partial<MasterPrompt> | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    const { data, error } = await supabase
      .from('master_prompts')
      .select('*')
      .order('category', { ascending: true });
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (data) {
      setPrompts(data as MasterPrompt[]);
    }
  };

  const savePrompt = async () => {
    if (!editingPrompt) return;
    
    setLoading(true);
    
    try {
      if (editingPrompt.id) {
        const { error } = await supabase
          .from('master_prompts')
          .update(editingPrompt as any)
          .eq('id', editingPrompt.id);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Prompt updated successfully' });
      } else {
        const { error } = await supabase
          .from('master_prompts')
          .insert([editingPrompt as any]);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Prompt created successfully' });
      }
      
      setEditingPrompt(null);
      fetchPrompts();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deletePrompt = async (id: string) => {
    if (!confirm('Delete this prompt?')) return;
    
    const { error } = await supabase
      .from('master_prompts')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Prompt deleted' });
      fetchPrompts();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Master Prompt Management</h1>
        <button
          onClick={() => setEditingPrompt({ 
            name: '',
            category: 'blog',
            prompt_text: '',
            variables: [],
            is_active: true
          })}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
        >
          <Plus size={20} />
          New Prompt
        </button>
      </div>

      {/* Editing Modal */}
      {editingPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {editingPrompt.id ? 'Edit Prompt' : 'New Prompt'}
              </h2>
              <button onClick={() => setEditingPrompt(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editingPrompt.name || ''}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={editingPrompt.category || 'blog'}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, category: e.target.value as any })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="blog">Blog</option>
                  <option value="qa">Q&A</option>
                  <option value="image">Image</option>
                  <option value="diagram">Diagram</option>
                  <option value="faq">FAQ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Prompt Text</label>
                <textarea
                  value={editingPrompt.prompt_text || ''}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt_text: e.target.value })}
                  rows={10}
                  className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                  placeholder="Use {{variable}} for dynamic content..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Variables (comma-separated)
                </label>
                <input
                  type="text"
                  value={editingPrompt.variables?.join(', ') || ''}
                  onChange={(e) => setEditingPrompt({ 
                    ...editingPrompt, 
                    variables: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                  })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="topic, keywords, funnel_stage"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingPrompt.is_active ?? true}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, is_active: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm font-medium">Active</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={savePrompt}
                disabled={loading}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Prompt'}
              </button>
              <button
                onClick={() => setEditingPrompt(null)}
                className="px-4 py-2 border rounded-lg hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompts List */}
      <div className="grid gap-4">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="bg-card p-6 rounded-lg border">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold">{prompt.name}</h3>
                <span className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded mt-1">
                  {prompt.category}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingPrompt(prompt)}
                  className="p-2 hover:bg-accent rounded"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => deletePrompt(prompt.id)}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {prompt.prompt_text}
            </p>
            
            {prompt.variables.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {prompt.variables.map((variable) => (
                  <span key={variable} className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                    {variable}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MasterPrompts;
