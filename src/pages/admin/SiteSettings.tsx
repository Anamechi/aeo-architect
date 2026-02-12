import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2 } from 'lucide-react';

export default function SiteSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    master_prompt: '',
    brand_voice: '',
    target_audience_rules: '',
    mission_statement: '',
    eeat_authority_block: '',
    speakable_rules: '',
    faq_rules: '',
    anti_hallucination_rules: '',
    canonical_domain: 'home.anamechimarketing.com',
    enforce_hreflang: true,
    supported_languages: ['en'],
    spelling_enforcement: true,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        master_prompt: settings.master_prompt || '',
        brand_voice: settings.brand_voice || '',
        target_audience_rules: settings.target_audience_rules || '',
        mission_statement: settings.mission_statement || '',
        eeat_authority_block: settings.eeat_authority_block || '',
        speakable_rules: settings.speakable_rules || '',
        faq_rules: settings.faq_rules || '',
        anti_hallucination_rules: settings.anti_hallucination_rules || '',
        canonical_domain: settings.canonical_domain || 'home.anamechimarketing.com',
        enforce_hreflang: settings.enforce_hreflang ?? true,
        supported_languages: (settings.supported_languages as string[]) || ['en'],
        spelling_enforcement: settings.spelling_enforcement ?? true,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('site_settings')
        .update({
          ...form,
          supported_languages: form.supported_languages,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({ title: 'Settings saved successfully' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error saving settings', description: err.message, variant: 'destructive' });
    },
  });

  const updateField = (field: string, value: string | boolean | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Site Settings</h1>
          <p className="text-muted-foreground">Master Prompt, domain, and enforcement rules</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="master-prompt">
        <TabsList>
          <TabsTrigger value="master-prompt">Master Prompt</TabsTrigger>
          <TabsTrigger value="domain">Domain & Canonical</TabsTrigger>
          <TabsTrigger value="enforcement">Enforcement Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="master-prompt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Master Prompt</CardTitle>
              <CardDescription>The base system prompt injected into all AI content generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Full Master Prompt</Label>
                <Textarea rows={6} value={form.master_prompt} onChange={e => updateField('master_prompt', e.target.value)} placeholder="Base system prompt for all content generation..." />
              </div>
              <div>
                <Label>Brand Voice</Label>
                <Textarea rows={3} value={form.brand_voice} onChange={e => updateField('brand_voice', e.target.value)} placeholder="Intelligent, grounded, relatable..." />
              </div>
              <div>
                <Label>Target Audience Rules</Label>
                <Textarea rows={3} value={form.target_audience_rules} onChange={e => updateField('target_audience_rules', e.target.value)} placeholder="Business owners, coaches, consultants..." />
              </div>
              <div>
                <Label>Mission Statement</Label>
                <Textarea rows={2} value={form.mission_statement} onChange={e => updateField('mission_statement', e.target.value)} />
              </div>
              <div>
                <Label>E-E-A-T Authority Block</Label>
                <Textarea rows={4} value={form.eeat_authority_block} onChange={e => updateField('eeat_authority_block', e.target.value)} placeholder="Author credentials, expertise signals..." />
              </div>
              <div>
                <Label>Speakable Summary Rules (40-60 words)</Label>
                <Textarea rows={2} value={form.speakable_rules} onChange={e => updateField('speakable_rules', e.target.value)} />
              </div>
              <div>
                <Label>FAQ Rules (80-120 words)</Label>
                <Textarea rows={2} value={form.faq_rules} onChange={e => updateField('faq_rules', e.target.value)} />
              </div>
              <div>
                <Label>Anti-Hallucination Logic</Label>
                <Textarea rows={3} value={form.anti_hallucination_rules} onChange={e => updateField('anti_hallucination_rules', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domain" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Domain & Canonical</CardTitle>
              <CardDescription>Canonical domain and hreflang settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Canonical Domain</Label>
                <Input value={form.canonical_domain} onChange={e => updateField('canonical_domain', e.target.value)} placeholder="home.anamechimarketing.com" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.enforce_hreflang} onCheckedChange={v => updateField('enforce_hreflang', v)} />
                <Label>Enforce Hreflang Tags</Label>
              </div>
              <div>
                <Label>Supported Languages (comma-separated)</Label>
                <Input value={form.supported_languages.join(', ')} onChange={e => updateField('supported_languages', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="en, es, fr" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enforcement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enforcement Rules</CardTitle>
              <CardDescription>Quality controls applied during content generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={form.spelling_enforcement} onCheckedChange={v => updateField('spelling_enforcement', v)} />
                <Label>Spell-check Enforcement</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
