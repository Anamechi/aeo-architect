import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function ContentUpdates() {
  const { data: blogPosts } = useQuery({
    queryKey: ['blog-posts-updates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, updated_at, published_at, status')
        .eq('status', 'published')
        .order('updated_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: qaArticles } = useQuery({
    queryKey: ['qa-articles-updates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qa_articles')
        .select('id, question, slug, updated_at, published_at, status')
        .eq('status', 'published')
        .order('updated_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const getContentAge = (updatedAt: string) => {
    const days = differenceInDays(new Date(), new Date(updatedAt));
    return days;
  };

  const getAgeBadge = (days: number) => {
    if (days > 180) return { variant: 'destructive' as const, label: 'Outdated', icon: AlertTriangle };
    if (days > 90) return { variant: 'secondary' as const, label: 'Needs Review', icon: RefreshCw };
    return { variant: 'default' as const, label: 'Fresh', icon: TrendingUp };
  };

  const allContent = [
    ...(blogPosts?.map(p => ({ ...p, type: 'blog', title: p.title })) || []),
    ...(qaArticles?.map(q => ({ ...q, type: 'qa', title: q.question })) || [])
  ].sort((a, b) => getContentAge(b.updated_at) - getContentAge(a.updated_at));

  const stats = {
    total: allContent.length,
    outdated: allContent.filter(c => getContentAge(c.updated_at) > 180).length,
    needsReview: allContent.filter(c => {
      const days = getContentAge(c.updated_at);
      return days > 90 && days <= 180;
    }).length,
    fresh: allContent.filter(c => getContentAge(c.updated_at) <= 90).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Content Updates Dashboard</h1>
        <p className="text-muted-foreground">Monitor content freshness and schedule updates</p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Content</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fresh (&lt;90 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">{stats.fresh}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Needs Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-500">{stats.needsReview}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outdated (&gt;180 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-500">{stats.outdated}</p>
          </CardContent>
        </Card>
      </div>

      {/* Content List */}
      <Card>
        <CardHeader>
          <CardTitle>Content by Update Priority</CardTitle>
          <CardDescription>Oldest content listed first - prioritize updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allContent.map((content) => {
              const age = getContentAge(content.updated_at);
              const badge = getAgeBadge(age);
              const BadgeIcon = badge.icon;
              
              return (
                <div key={`${content.type}-${content.id}`} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {content.type === 'blog' ? 'Blog' : 'Q&A'}
                      </Badge>
                      <Badge variant={badge.variant} className="gap-1">
                        <BadgeIcon className="h-3 w-3" />
                        {badge.label}
                      </Badge>
                    </div>
                    <h3 className="font-semibold mb-1">{content.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Last updated {format(new Date(content.updated_at), 'MMM d, yyyy')}
                      </span>
                      <span className="text-xs">({age} days ago)</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                    <Button size="sm">
                      Update
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Update Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Content Freshness Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Fresh (0-90 days):</strong> Content is current and performing well. Monitor for engagement.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <RefreshCw className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Needs Review (90-180 days):</strong> Check for accuracy, update statistics, refresh examples.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Outdated (180+ days):</strong> Priority update needed. Refresh data, add new insights, update CTAs.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
