import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MessageSquare, Users, Wrench, Mail } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats] = useState({
    blogPosts: 0,
    qaArticles: 0,
    authors: 0,
    aiTools: 0,
    leadsToday: 0,
    leadsThisWeek: 0,
  });
  const [dailyLeads, setDailyLeads] = useState<Array<{ date: string; count: number }>>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const now = new Date();
    const todayStart = startOfDay(now).toISOString();
    const weekStart = startOfDay(subDays(now, 7)).toISOString();

    const [blogCount, qaCount, authorsCount, toolsCount, leadsToday, leadsWeek] = await Promise.all([
      supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
      supabase.from('qa_articles').select('id', { count: 'exact', head: true }),
      supabase.from('authors').select('id', { count: 'exact', head: true }),
      supabase.from('ai_tools').select('id', { count: 'exact', head: true }),
      supabase.from('contact_submissions').select('id', { count: 'exact', head: true }).gte('submitted_at', todayStart),
      supabase.from('contact_submissions').select('id', { count: 'exact', head: true }).gte('submitted_at', weekStart),
    ]);

    setStats({
      blogPosts: blogCount.count || 0,
      qaArticles: qaCount.count || 0,
      authors: authorsCount.count || 0,
      aiTools: toolsCount.count || 0,
      leadsToday: leadsToday.count || 0,
      leadsThisWeek: leadsWeek.count || 0,
    });

    // Load daily leads for the past 7 days
    await loadDailyLeads();
  };

  const loadDailyLeads = async () => {
    const days = 7;
    const results = [];

    for (let i = 0; i < days; i++) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date).toISOString();
      const dayEnd = endOfDay(date).toISOString();

      const { count } = await supabase
        .from('contact_submissions')
        .select('id', { count: 'exact', head: true })
        .gte('submitted_at', dayStart)
        .lt('submitted_at', dayEnd);

      results.unshift({
        date: format(date, 'MMM dd'),
        count: count || 0,
      });
    }

    setDailyLeads(results);
  };

  const metrics = [
    { name: 'Leads Today', value: stats.leadsToday, icon: Mail, color: 'text-emerald-600' },
    { name: 'Leads This Week', value: stats.leadsThisWeek, icon: Mail, color: 'text-teal-600' },
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Daily Leads Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Submissions (Last 7 Days)</CardTitle>
          <CardDescription>Daily contact form submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dailyLeads.map((day) => (
              <div key={day.date} className="flex items-center gap-4">
                <div className="w-20 text-sm text-muted-foreground">{day.date}</div>
                <div className="flex-1">
                  <div className="h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded" 
                       style={{ width: `${Math.max(day.count * 10, 5)}%` }}>
                  </div>
                </div>
                <div className="w-12 text-right font-semibold">{day.count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
