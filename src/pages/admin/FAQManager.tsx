import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FunnelStage } from '@/types/content';
import { generateFAQSchema } from '@/utils/schema';
import { Plus, Edit, Trash2, Save, HelpCircle, ArrowUp, ArrowDown, X, Sparkles, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  // Bulk generation state
  const [showBulkGenerate, setShowBulkGenerate] = useState(false);
  const [bulkTopic, setBulkTopic] = useState('');
  const [bulkCount, setBulkCount] = useState(5);
  const [bulkCategory, setBulkCategory] = useState('General');
  const [bulkFunnelStage, setBulkFunnelStage] = useState<FunnelStage>('TOFU');
  const [generatingBulk, setGeneratingBulk] = useState(false);
  const [generatedFaqs, setGeneratedFaqs] = useState<any[]>([]);

  // Bulk upload state
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [uploadCategory, setUploadCategory] = useState('General');
  const [uploadFunnelStage, setUploadFunnelStage] = useState<FunnelStage>('TOFU');
  const [processingUpload, setProcessingUpload] = useState(false);

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

  const handleBulkGenerate = async () => {
    if (!bulkTopic.trim()) {
      toast({ title: 'Error', description: 'Please enter a topic', variant: 'destructive' });
      return;
    }

    setGeneratingBulk(true);
    setGeneratedFaqs([]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-bulk-faqs', {
        body: {
          topic: bulkTopic,
          count: bulkCount,
          category: bulkCategory,
          funnelStage: bulkFunnelStage
        }
      });

      if (error) throw error;

      if (data?.error) {
        toast({ 
          title: 'Error', 
          description: data.error, 
          variant: 'destructive' 
        });
        return;
      }

      if (data?.faqs && Array.isArray(data.faqs)) {
        setGeneratedFaqs(data.faqs);
        toast({ 
          title: 'Success!', 
          description: `Generated ${data.faqs.length} FAQs. Review and save them below.` 
        });
      }
    } catch (error: any) {
      console.error('Bulk generation error:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to generate FAQs', 
        variant: 'destructive' 
      });
    } finally {
      setGeneratingBulk(false);
    }
  };

  const handleSaveGeneratedFaqs = async () => {
    if (generatedFaqs.length === 0) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('qa_articles')
        .insert(generatedFaqs);

      if (error) throw error;

      toast({ 
        title: 'Success!', 
        description: `Saved ${generatedFaqs.length} FAQs` 
      });
      setGeneratedFaqs([]);
      setShowBulkGenerate(false);
      fetchFAQs();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadText.trim()) {
      toast({ title: 'Error', description: 'Please paste your FAQ content', variant: 'destructive' });
      return;
    }

    setProcessingUpload(true);

    try {
      // Parse the text - expecting format like:
      // Q: Question here?
      // A: Answer here.
      // (blank line)
      // Q: Next question?
      // A: Next answer.

      const lines = uploadText.split('\n');
      const parsedFaqs: any[] = [];
      let currentQuestion = '';
      let currentAnswer = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.match(/^Q:|^Question:/i)) {
          // Save previous FAQ if exists
          if (currentQuestion && currentAnswer) {
            parsedFaqs.push({
              question: currentQuestion,
              answer: currentAnswer,
              slug: currentQuestion.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, ''),
              tags: [uploadCategory],
              funnel_stage: uploadFunnelStage,
              status: 'draft',
              meta_description: currentAnswer.substring(0, 160)
            });
          }
          // Start new question
          currentQuestion = line.replace(/^Q:|^Question:/i, '').trim();
          currentAnswer = '';
        } else if (line.match(/^A:|^Answer:/i)) {
          currentAnswer = line.replace(/^A:|^Answer:/i, '').trim();
        } else if (line && currentAnswer) {
          // Continue building answer
          currentAnswer += ' ' + line;
        }
      }

      // Save last FAQ
      if (currentQuestion && currentAnswer) {
        parsedFaqs.push({
          question: currentQuestion,
          answer: currentAnswer,
          slug: currentQuestion.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
          tags: [uploadCategory],
          funnel_stage: uploadFunnelStage,
          status: 'draft',
          meta_description: currentAnswer.substring(0, 160)
        });
      }

      if (parsedFaqs.length === 0) {
        toast({ 
          title: 'Error', 
          description: 'No FAQs found. Use format: Q: question? A: answer.', 
          variant: 'destructive' 
        });
        return;
      }

      // Insert into database
      const { error } = await supabase
        .from('qa_articles')
        .insert(parsedFaqs);

      if (error) throw error;

      toast({ 
        title: 'Success!', 
        description: `Imported ${parsedFaqs.length} FAQs` 
      });
      setUploadText('');
      setShowBulkUpload(false);
      fetchFAQs();
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to upload FAQs', 
        variant: 'destructive' 
      });
    } finally {
      setProcessingUpload(false);
    }
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
          <Button
            onClick={() => setShowBulkGenerate(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Sparkles size={20} />
            AI Generate Bulk
          </Button>
          <Button
            onClick={() => setShowBulkUpload(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload size={20} />
            Bulk Upload
          </Button>
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

      {/* Bulk Generate Modal */}
      {showBulkGenerate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Bulk FAQ Generation
              </CardTitle>
              <CardDescription>
                Generate multiple FAQs at once using AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Topic</label>
                <Input
                  value={bulkTopic}
                  onChange={(e) => setBulkTopic(e.target.value)}
                  placeholder="e.g., Marketing Automation, CRM Setup, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Number of FAQs</label>
                  <Select value={String(bulkCount)} onValueChange={(v) => setBulkCount(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 5, 7, 10, 15, 20].map(n => (
                        <SelectItem key={n} value={String(n)}>{n} FAQs</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Input
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    placeholder="General"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Funnel Stage</label>
                <Select value={bulkFunnelStage} onValueChange={(v) => setBulkFunnelStage(v as FunnelStage)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOFU">TOFU - Awareness</SelectItem>
                    <SelectItem value="MOFU">MOFU - Consideration</SelectItem>
                    <SelectItem value="BOFU">BOFU - Conversion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {generatedFaqs.length > 0 && (
                <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                  <p className="text-sm font-medium">{generatedFaqs.length} FAQs generated:</p>
                  {generatedFaqs.map((faq, i) => (
                    <div key={i} className="text-sm border-l-2 pl-2">
                      <div className="font-medium">{faq.question}</div>
                      <div className="text-muted-foreground line-clamp-2">{faq.answer}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                {generatedFaqs.length === 0 ? (
                  <Button
                    onClick={handleBulkGenerate}
                    disabled={generatingBulk || !bulkTopic}
                    className="flex-1"
                  >
                    {generatingBulk ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate FAQs
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSaveGeneratedFaqs}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save All FAQs
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setShowBulkGenerate(false);
                    setGeneratedFaqs([]);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk FAQ Upload
              </CardTitle>
              <CardDescription>
                Paste FAQs from a document using this format:
                <pre className="mt-2 text-xs bg-muted p-2 rounded">
{`Q: What is marketing automation?
A: Marketing automation is...

Q: How much does it cost?
A: Pricing varies based on...`}
                </pre>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Paste FAQ Content</label>
                <Textarea
                  value={uploadText}
                  onChange={(e) => setUploadText(e.target.value)}
                  rows={12}
                  placeholder="Q: Your question here?&#10;A: Your answer here.&#10;&#10;Q: Another question?&#10;A: Another answer."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Input
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    placeholder="General"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Funnel Stage</label>
                  <Select value={uploadFunnelStage} onValueChange={(v) => setUploadFunnelStage(v as FunnelStage)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOFU">TOFU - Awareness</SelectItem>
                      <SelectItem value="MOFU">MOFU - Consideration</SelectItem>
                      <SelectItem value="BOFU">BOFU - Conversion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleBulkUpload}
                  disabled={processingUpload || !uploadText}
                  className="flex-1"
                >
                  {processingUpload ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import FAQs
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowBulkUpload(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
