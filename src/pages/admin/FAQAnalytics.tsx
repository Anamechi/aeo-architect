import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, TrendingUp, HelpCircle, Search } from "lucide-react";
import { Link } from "react-router-dom";

interface FAQStats {
  totalFaqs: number;
  publishedFaqs: number;
  draftFaqs: number;
  totalViews: number;
}

interface FAQView {
  id: string;
  question: string;
  views: number;
  status: string;
  funnel_stage: string;
}

const FAQAnalytics = () => {
  const [stats, setStats] = useState<FAQStats>({
    totalFaqs: 0,
    publishedFaqs: 0,
    draftFaqs: 0,
    totalViews: 0,
  });
  const [topFaqs, setTopFaqs] = useState<FAQView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch all FAQs
      const { data: faqs, error } = await supabase
        .from('qa_articles')
        .select('id, question, status, funnel_stage');

      if (error) throw error;

      const published = faqs?.filter(f => f.status === 'published').length || 0;
      const draft = faqs?.filter(f => f.status === 'draft').length || 0;

      setStats({
        totalFaqs: faqs?.length || 0,
        publishedFaqs: published,
        draftFaqs: draft,
        totalViews: 0, // Will be populated when we implement view tracking
      });

      // Mock top FAQs for now (will be based on actual view tracking later)
      setTopFaqs(
        faqs
          ?.filter(f => f.status === 'published')
          .slice(0, 5)
          .map(f => ({ ...f, views: 0 })) || []
      );
    } catch (error) {
      console.error('Error fetching FAQ analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FAQ Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track performance and engagement of your FAQs
          </p>
        </div>
        <Link to="/admin/faq-manager">
          <Badge variant="outline" className="cursor-pointer hover:bg-accent">
            Manage FAQs →
          </Badge>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total FAQs</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFaqs}</div>
            <p className="text-xs text-muted-foreground">
              All FAQ entries in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.publishedFaqs}</div>
            <p className="text-xs text-muted-foreground">
              Live on public site
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Badge variant="secondary">{stats.draftFaqs}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.draftFaqs}</div>
            <p className="text-xs text-muted-foreground">
              Not yet published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">
              Coming soon with tracking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top FAQs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Published FAQs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topFaqs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No published FAQs yet</p>
              <Link to="/admin/faq-manager" className="text-primary hover:underline text-sm">
                Create your first FAQ →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {topFaqs.map((faq, index) => (
                <div 
                  key={faq.id} 
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm mb-1 truncate">{faq.question}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {faq.funnel_stage || 'N/A'}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Search className="h-3 w-3" />
                        {faq.views} views
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funnel Stage Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>FAQ Distribution by Funnel Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['TOFU', 'MOFU', 'BOFU'].map(stage => {
              const count = topFaqs.filter(f => f.funnel_stage === stage).length;
              const percentage = topFaqs.length > 0 ? (count / topFaqs.length) * 100 : 0;
              
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{stage}</span>
                    <span className="text-sm text-muted-foreground">{count} FAQs</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FAQAnalytics;
