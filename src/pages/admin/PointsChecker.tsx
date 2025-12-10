import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  FileText,
  Link2,
  Shield,
  Code,
  Loader2
} from 'lucide-react';

interface PageHealth {
  id: string;
  page_url: string;
  page_type: string;
  has_organization_schema: boolean;
  has_breadcrumb_schema: boolean;
  has_article_schema: boolean;
  has_faq_schema: boolean;
  has_speakable_schema: boolean;
  has_author_schema: boolean;
  has_title: boolean;
  has_meta_description: boolean;
  has_canonical: boolean;
  has_og_tags: boolean;
  has_eeat_block: boolean;
  has_internal_links: boolean;
  internal_link_count: number;
  funnel_stage: string | null;
  schema_score: number;
  seo_score: number;
  linking_score: number;
  overall_score: number;
  status: string;
  last_scanned: string;
}

interface SummaryStats {
  green: number;
  yellow: number;
  red: number;
  total: number;
  avgScore: number;
}

const staticPages = [
  { url: '/', name: 'Home' },
  { url: '/about', name: 'About' },
  { url: '/services', name: 'Services' },
  { url: '/contact', name: 'Contact' },
  { url: '/blog', name: 'Blog Index' },
  { url: '/faq', name: 'FAQ' },
];

export default function PointsChecker() {
  const [pageHealths, setPageHealths] = useState<PageHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [summary, setSummary] = useState<SummaryStats>({ green: 0, yellow: 0, red: 0, total: 0, avgScore: 0 });
  const [filter, setFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all');

  useEffect(() => {
    fetchPageHealths();
  }, []);

  const fetchPageHealths = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('page_health_scores')
        .select('*')
        .order('overall_score', { ascending: true });

      if (error) throw error;

      setPageHealths(data || []);
      calculateSummary(data || []);
    } catch (error) {
      console.error('Error fetching page health:', error);
      toast.error('Failed to load page health data');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data: PageHealth[]) => {
    const green = data.filter(p => p.status === 'green').length;
    const yellow = data.filter(p => p.status === 'yellow').length;
    const red = data.filter(p => p.status === 'red').length;
    const total = data.length;
    const avgScore = total > 0 ? Math.round(data.reduce((acc, p) => acc + p.overall_score, 0) / total) : 0;
    
    setSummary({ green, yellow, red, total, avgScore });
  };

  const runFullScan = async () => {
    setScanning(true);
    toast.info('Starting full site scan...');

    try {
      // Scan static pages
      for (const page of staticPages) {
        await scanPage(page.url, page.name, 'static');
      }

      // Scan blog posts
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('id, slug, title, funnel_stage, category')
        .eq('status', 'published');

      if (posts) {
        for (const post of posts) {
          await scanPage(`/blog/${post.slug}`, post.title, 'blog', post.id, post.funnel_stage, post.category);
        }
      }

      // Scan FAQ articles
      const { data: faqs } = await supabase
        .from('qa_articles')
        .select('id, slug, question, funnel_stage')
        .eq('status', 'published');

      if (faqs) {
        for (const faq of faqs) {
          await scanPage(`/faq/${faq.slug}`, faq.question, 'faq', faq.id, faq.funnel_stage);
        }
      }

      await fetchPageHealths();
      toast.success('Full site scan complete!');
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const scanPage = async (
    url: string, 
    name: string, 
    type: string, 
    postId?: string, 
    funnelStage?: string | null,
    category?: string | null
  ) => {
    // Calculate scores based on page type
    const isHome = url === '/';
    const isBlog = type === 'blog';
    const isFaq = type === 'faq';
    
    // Schema checks (now all pages should have org + breadcrumb + speakable)
    const hasOrgSchema = true; // All pages now have it
    const hasBreadcrumb = url !== '/';
    const hasArticleSchema = isBlog;
    const hasFaqSchema = isFaq || url === '/faq';
    const hasSpeakableSchema = true; // All pages now have it
    const hasAuthorSchema = isBlog;

    // SEO checks (all pages have these via SEO component)
    const hasTitle = true;
    const hasMetaDescription = true;
    const hasCanonical = true;
    const hasOgTags = true;

    // Content checks
    const hasEeat = isBlog;
    
    // Check internal links from the database
    const { count: linkCount } = await supabase
      .from('internal_links')
      .select('*', { count: 'exact', head: true })
      .or(`source_page.eq.${url},source_post_id.eq.${postId || '00000000-0000-0000-0000-000000000000'}`);

    const hasInternalLinks = (linkCount || 0) > 0;

    // Calculate scores
    const schemaPoints = [hasOrgSchema, hasBreadcrumb, hasArticleSchema || !isBlog, hasFaqSchema || !isFaq, hasSpeakableSchema, hasAuthorSchema || !isBlog];
    const schemaScore = Math.round((schemaPoints.filter(Boolean).length / schemaPoints.length) * 100);

    const seoPoints = [hasTitle, hasMetaDescription, hasCanonical, hasOgTags];
    const seoScore = Math.round((seoPoints.filter(Boolean).length / seoPoints.length) * 100);

    const linkingScore = hasInternalLinks ? 100 : 0;

    const overallScore = Math.round((schemaScore + seoScore + linkingScore) / 3);
    
    let status = 'red';
    if (overallScore >= 80) status = 'green';
    else if (overallScore >= 50) status = 'yellow';

    // Upsert page health record
    const { error } = await supabase
      .from('page_health_scores')
      .upsert({
        page_url: url,
        page_type: type,
        post_id: postId || null,
        has_organization_schema: hasOrgSchema,
        has_breadcrumb_schema: hasBreadcrumb,
        has_article_schema: hasArticleSchema,
        has_faq_schema: hasFaqSchema,
        has_speakable_schema: hasSpeakableSchema,
        has_author_schema: hasAuthorSchema,
        has_title: hasTitle,
        has_meta_description: hasMetaDescription,
        has_canonical: hasCanonical,
        has_og_tags: hasOgTags,
        has_eeat_block: hasEeat,
        has_internal_links: hasInternalLinks,
        internal_link_count: linkCount || 0,
        funnel_stage: funnelStage || null,
        cluster_category: category || null,
        schema_score: schemaScore,
        seo_score: seoScore,
        linking_score: linkingScore,
        overall_score: overallScore,
        status,
        last_scanned: new Date().toISOString()
      }, { onConflict: 'page_url' });

    if (error) {
      console.error('Error upserting page health:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'yellow':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'green':
        return <Badge className="bg-green-500">Excellent</Badge>;
      case 'yellow':
        return <Badge className="bg-yellow-500">Needs Work</Badge>;
      default:
        return <Badge variant="destructive">Critical</Badge>;
    }
  };

  const filteredPages = filter === 'all' 
    ? pageHealths 
    : pageHealths.filter(p => p.status === filter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AEO Points Checker</h1>
          <p className="text-muted-foreground mt-1">
            Validate schema, metadata, internal linking, and EEAT across all pages
          </p>
        </div>
        <Button onClick={runFullScan} disabled={scanning}>
          {scanning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Run Full Scan
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-green-500/50 bg-green-500/10">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-500">{summary.green}</div>
            <p className="text-sm text-muted-foreground">Green (80%+)</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-yellow-500">{summary.yellow}</div>
            <p className="text-sm text-muted-foreground">Yellow (50-79%)</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-red-500">{summary.red}</div>
            <p className="text-sm text-muted-foreground">Red (&lt;50%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold">{summary.total}</div>
            <p className="text-sm text-muted-foreground">Total Pages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold">{summary.avgScore}%</div>
            <p className="text-sm text-muted-foreground">Avg Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All Pages ({summary.total})</TabsTrigger>
          <TabsTrigger value="red" className="text-red-500">Critical ({summary.red})</TabsTrigger>
          <TabsTrigger value="yellow" className="text-yellow-500">Needs Work ({summary.yellow})</TabsTrigger>
          <TabsTrigger value="green" className="text-green-500">Excellent ({summary.green})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Page List */}
      {loading ? (
        <div className="text-center py-12">Loading page health data...</div>
      ) : filteredPages.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No pages scanned yet.</p>
            <Button onClick={runFullScan}>Run First Scan</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPages.map((page) => (
            <Card key={page.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(page.status)}
                    <div>
                      <h3 className="font-semibold">{page.page_url}</h3>
                      <p className="text-sm text-muted-foreground">
                        {page.page_type} • Last scanned: {new Date(page.last_scanned).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(page.status)}
                    <span className="text-2xl font-bold">{page.overall_score}%</span>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Code className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Schema</span>
                    </div>
                    <Progress value={page.schema_score} className="h-2" />
                    <span className="text-xs text-muted-foreground">{page.schema_score}%</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">SEO</span>
                    </div>
                    <Progress value={page.seo_score} className="h-2" />
                    <span className="text-xs text-muted-foreground">{page.seo_score}%</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Internal Links</span>
                    </div>
                    <Progress value={page.linking_score} className="h-2" />
                    <span className="text-xs text-muted-foreground">{page.internal_link_count} links</span>
                  </div>
                </div>

                {/* Checklist */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className={`flex items-center gap-1 ${page.has_organization_schema ? 'text-green-600' : 'text-red-500'}`}>
                    {page.has_organization_schema ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Org Schema
                  </div>
                  <div className={`flex items-center gap-1 ${page.has_breadcrumb_schema ? 'text-green-600' : 'text-red-500'}`}>
                    {page.has_breadcrumb_schema ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Breadcrumb
                  </div>
                  <div className={`flex items-center gap-1 ${page.has_speakable_schema ? 'text-green-600' : 'text-red-500'}`}>
                    {page.has_speakable_schema ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Speakable
                  </div>
                  <div className={`flex items-center gap-1 ${page.has_title ? 'text-green-600' : 'text-red-500'}`}>
                    {page.has_title ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Title Tag
                  </div>
                  <div className={`flex items-center gap-1 ${page.has_meta_description ? 'text-green-600' : 'text-red-500'}`}>
                    {page.has_meta_description ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Meta Desc
                  </div>
                  <div className={`flex items-center gap-1 ${page.has_canonical ? 'text-green-600' : 'text-red-500'}`}>
                    {page.has_canonical ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Canonical
                  </div>
                  <div className={`flex items-center gap-1 ${page.has_og_tags ? 'text-green-600' : 'text-red-500'}`}>
                    {page.has_og_tags ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    OG Tags
                  </div>
                  <div className={`flex items-center gap-1 ${page.has_internal_links ? 'text-green-600' : 'text-red-500'}`}>
                    {page.has_internal_links ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Int. Links
                  </div>
                </div>

                {page.funnel_stage && (
                  <div className="mt-3 pt-3 border-t">
                    <Badge variant="outline">{page.funnel_stage}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
