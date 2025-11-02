import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MessageSquare, Users, Wrench } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    blogPosts: 0,
    qaArticles: 0,
    authors: 0,
    aiTools: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [blogCount, qaCount, authorsCount, toolsCount] = await Promise.all([
      supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
      supabase.from('qa_articles').select('id', { count: 'exact', head: true }),
      supabase.from('authors').select('id', { count: 'exact', head: true }),
      supabase.from('ai_tools').select('id', { count: 'exact', head: true }),
    ]);

    setStats({
      blogPosts: blogCount.count || 0,
      qaArticles: qaCount.count || 0,
      authors: authorsCount.count || 0,
      aiTools: toolsCount.count || 0,
    });
  };

  const metrics = [
    { name: 'Blog Posts', value: stats.blogPosts, icon: FileText, color: 'text-blue-600' },
    { name: 'QA Articles', value: stats.qaArticles, icon: MessageSquare, color: 'text-green-600' },
    { name: 'Authors', value: stats.authors, icon: Users, color: 'text-purple-600' },
    { name: 'AI Tools', value: stats.aiTools, icon: Wrench, color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the ANAMECHI Marketing admin dashboard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>
            Get started with the ANAMECHI admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">1. Manage AI Tools</h3>
            <p className="text-sm text-muted-foreground">
              Add and categorize the AI tools ANAMECHI uses for content creation and optimization.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">2. Set Up Authors</h3>
            <p className="text-sm text-muted-foreground">
              Create author profiles with credentials to enhance E-E-A-T signals.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">3. Generate Content</h3>
            <p className="text-sm text-muted-foreground">
              Use the blog and QA generators to create AI-optimized, culturally aware content.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
