import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { FileCode, Globe, Zap } from 'lucide-react';

export default function SEOSettings() {
  const { toast } = useToast();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">SEO & Technical Settings</h1>
        <p className="text-muted-foreground">Manage robots.txt, sitemaps, IndexNow, and schema defaults</p>
      </div>

      {/* Robots.txt Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            <CardTitle>Robots.txt Configuration</CardTitle>
          </div>
          <CardDescription>Control how search engines and AI bots crawl your site</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="robots-txt">robots.txt Content</Label>
            <Textarea 
              id="robots-txt" 
              rows={12}
              defaultValue={`# Allow all AI bots and search engines
User-agent: *
Allow: /

# Specific AI bot permissions
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /

# Sitemap
Sitemap: https://anamechi.com/sitemap.xml

# LLM Corpus
llms.txt: https://anamechi.com/llms.txt`}
              className="font-mono text-sm"
            />
          </div>
          <Button>Save robots.txt</Button>
        </CardContent>
      </Card>

      {/* XML Sitemap */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>XML Sitemap</CardTitle>
          </div>
          <CardDescription>Automatically generated from published content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-generate sitemap</p>
              <p className="text-sm text-muted-foreground">Update sitemap when content is published</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex gap-2">
            <Button>Generate Now</Button>
            <Button variant="outline">View Sitemap</Button>
          </div>
        </CardContent>
      </Card>

      {/* IndexNow */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <CardTitle>IndexNow Integration</CardTitle>
          </div>
          <CardDescription>Instantly notify search engines of content changes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable IndexNow</p>
              <p className="text-sm text-muted-foreground">Auto-notify Bing, Yandex, and others on publish</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div>
            <Label htmlFor="indexnow-key">IndexNow API Key</Label>
            <Input 
              id="indexnow-key" 
              placeholder="Your IndexNow key"
              defaultValue="anamechi-2024-indexnow-key"
            />
          </div>
          <Button>Save Settings</Button>
        </CardContent>
      </Card>

      {/* Schema Defaults */}
      <Card>
        <CardHeader>
          <CardTitle>Default Schema.org Settings</CardTitle>
          <CardDescription>Organization and default author schema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="org-name">Organization Name</Label>
            <Input id="org-name" defaultValue="ANAMECHI Marketing" />
          </div>
          <div>
            <Label htmlFor="org-url">Organization URL</Label>
            <Input id="org-url" defaultValue="https://anamechi.com" />
          </div>
          <div>
            <Label htmlFor="org-logo">Logo URL</Label>
            <Input id="org-logo" placeholder="https://anamechi.com/logo.png" />
          </div>
          <div>
            <Label htmlFor="social-links">Social Media Links (JSON)</Label>
            <Textarea 
              id="social-links" 
              rows={4}
              defaultValue={`{
  "linkedin": "https://linkedin.com/company/anamechi",
  "twitter": "https://twitter.com/anamechi"
}`}
              className="font-mono text-sm"
            />
          </div>
          <Button>Save Defaults</Button>
        </CardContent>
      </Card>
    </div>
  );
}
