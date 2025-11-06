import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FunnelStage } from '@/types/content';
import { generateFAQSchema } from '@/utils/schema';
import { Plus, Edit, Trash2, Save, HelpCircle, ArrowUp, ArrowDown, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  funnel_stage: FunnelStage;
  keywords: string[];
  order: number;
  published: boolean;
}

export default function FAQManager() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [editingFaq, setEditingFaq] = useState<Partial<FAQ> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    const { data, error } = await supabase
      .from('qa_articles')
      .select('*')
      .order('funnel_stage', { ascending: true });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (data) {
      // Map qa_articles to FAQ format
      const mappedFaqs: FAQ[] = data.map((item, index) => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
        category: item.tags?.[0] || 'General',
        funnel_stage: item.funnel_stage as FunnelStage,
        keywords: item.tags || [],
        order: index,
        published: item.status === 'published'
      }));
      setFaqs(mappedFaqs);
    }
  };

  const saveFaq = async () => {
    if (!editingFaq || !editingFaq.question || !editingFaq.answer) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const faqData = {
        question: editingFaq.question,
        answer: editingFaq.answer,
        slug: editingFaq.question.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        tags: editingFaq.keywords || [],
        funnel_stage: editingFaq.funnel_stage || 'TOFU',
        status: (editingFaq.published ? 'published' : 'draft') as 'published' | 'draft'
      };

      if (editingFaq.id) {
        const { error } = await supabase
          .from('qa_articles')
          .update(faqData as any)
          .eq('id', editingFaq.id);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'FAQ updated successfully' });
      } else {
        const { error } = await supabase
          .from('qa_articles')
          .insert([faqData as any]);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'FAQ created successfully' });
      }

      setEditingFaq(null);
      fetchFAQs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteFaq = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;

    const { error } = await supabase
      .from('qa_articles')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'FAQ deleted' });
      fetchFAQs();
    }
  };

  const generateSchema = () => {
    const publishedFaqs = faqs.filter(f => f.published);
    const schema = generateFAQSchema(
      publishedFaqs.map(f => ({ question: f.question, answer: f.answer }))
    );
    
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    toast({ title: 'Success', description: 'FAQ Schema copied to clipboard!' });
  };

  const categories = Array.from(new Set(faqs.map(f => f.category)));
  const filteredFaqs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(f => f.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">FAQ Manager</h1>
        <div className="flex gap-2">
          <button
            onClick={generateSchema}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Generate Schema
          </button>
          <button
            onClick={() => setEditingFaq({
              question: '',
              answer: '',
              category: 'General',
              funnel_stage: 'TOFU',
              keywords: [],
              order: faqs.length,
              published: true,
            })}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus size={20} />
            New FAQ
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-lg text-sm ${
            selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
          }`}
        >
          All ({faqs.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg text-sm ${
              selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary'
            }`}
          >
            {cat} ({faqs.filter(f => f.category === cat).length})
          </button>
        ))}
      </div>

      {/* Editing Modal */}
      {editingFaq && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {editingFaq.id ? 'Edit FAQ' : 'New FAQ'}
              </h2>
              <button onClick={() => setEditingFaq(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Question</label>
                <input
                  type="text"
                  value={editingFaq.question || ''}
                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="What is marketing automation?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Answer</label>
                <textarea
                  value={editingFaq.answer || ''}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  rows={6}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Marketing automation is..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input
                    type="text"
                    value={editingFaq.category || ''}
                    onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="General, Services, Pricing..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Funnel Stage</label>
                  <select
                    value={editingFaq.funnel_stage || 'TOFU'}
                    onChange={(e) => setEditingFaq({ ...editingFaq, funnel_stage: e.target.value as FunnelStage })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="TOFU">TOFU - Awareness</option>
                    <option value="MOFU">MOFU - Consideration</option>
                    <option value="BOFU">BOFU - Conversion</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={editingFaq.keywords?.join(', ') || ''}
                  onChange={(e) => setEditingFaq({
                    ...editingFaq,
                    keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                  })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="automation, marketing, CRM"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingFaq.published ?? true}
                  onChange={(e) => setEditingFaq({ ...editingFaq, published: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm font-medium">Published</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={saveFaq}
                disabled={loading}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {loading ? 'Saving...' : 'Save FAQ'}
              </button>
              <button
                onClick={() => setEditingFaq(null)}
                className="px-4 py-2 border rounded-lg hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQs List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq) => (
          <div key={faq.id} className="bg-card p-4 rounded-lg border hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold">{faq.question}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="inline-block bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                        {faq.category}
                      </span>
                      <span className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                        {faq.funnel_stage}
                      </span>
                      {!faq.published && (
                        <span className="inline-block bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 text-xs px-2 py-1 rounded">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingFaq(faq)}
                      className="p-2 hover:bg-accent rounded"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteFaq(faq.id)}
                      className="p-2 hover:bg-destructive/10 text-destructive rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
                {faq.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {faq.keywords.map((keyword) => (
                      <span key={keyword} className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredFaqs.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          <HelpCircle size={48} className="mx-auto mb-2 opacity-50" />
          <p>No FAQs found</p>
          <p className="text-sm mt-1">Click "New FAQ" to create your first question</p>
        </div>
      )}
    </div>
  );
}
