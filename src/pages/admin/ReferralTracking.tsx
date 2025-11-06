import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { ExternalLink, TrendingUp, MousePointerClick, CheckCircle } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";

interface AffiliateClick {
  id: string;
  tool_name: string;
  tool_url: string;
  clicked_at: string;
  converted: boolean;
  converted_at: string | null;
  user_agent: string | null;
  referrer: string | null;
  notes: string | null;
}

interface ToolStats {
  tool_name: string;
  total_clicks: number;
  total_conversions: number;
  conversion_rate: number;
}

interface DailyStats {
  date: string;
  clicks: number;
  conversions: number;
}

export default function ReferralTracking() {
  const [clicks, setClicks] = useState<AffiliateClick[]>([]);
  const [toolStats, setToolStats] = useState<ToolStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = startOfDay(subDays(new Date(), timeRange));

      // Fetch all clicks
      const { data: clicksData, error: clicksError } = await supabase
        .from('affiliate_clicks')
        .select('*')
        .gte('clicked_at', startDate.toISOString())
        .order('clicked_at', { ascending: false });

      if (clicksError) throw clicksError;
      setClicks(clicksData || []);

      // Calculate tool stats
      const statsMap = new Map<string, { clicks: number; conversions: number }>();
      clicksData?.forEach(click => {
        const current = statsMap.get(click.tool_name) || { clicks: 0, conversions: 0 };
        statsMap.set(click.tool_name, {
          clicks: current.clicks + 1,
          conversions: current.conversions + (click.converted ? 1 : 0)
        });
      });

      const stats: ToolStats[] = Array.from(statsMap.entries()).map(([tool_name, data]) => ({
        tool_name,
        total_clicks: data.clicks,
        total_conversions: data.conversions,
        conversion_rate: data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0
      })).sort((a, b) => b.total_clicks - a.total_clicks);

      setToolStats(stats);

      // Calculate daily stats
      const dailyMap = new Map<string, { clicks: number; conversions: number }>();
      clicksData?.forEach(click => {
        const date = format(new Date(click.clicked_at), 'MMM dd');
        const current = dailyMap.get(date) || { clicks: 0, conversions: 0 };
        dailyMap.set(date, {
          clicks: current.clicks + 1,
          conversions: current.conversions + (click.converted ? 1 : 0)
        });
      });

      const daily: DailyStats[] = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          clicks: data.clicks,
          conversions: data.conversions
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setDailyStats(daily);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load tracking data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsConverted = async (clickId: string) => {
    try {
      const { error } = await supabase
        .from('affiliate_clicks')
        .update({ 
          converted: true, 
          converted_at: new Date().toISOString() 
        })
        .eq('id', clickId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Marked as converted"
      });

      fetchData();
    } catch (error) {
      console.error('Error marking conversion:', error);
      toast({
        title: "Error",
        description: "Failed to mark conversion",
        variant: "destructive"
      });
    }
  };

  const totalClicks = clicks.length;
  const totalConversions = clicks.filter(c => c.converted).length;
  const overallConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Referral Tracking</h1>
        <p className="text-muted-foreground">Monitor clicks and conversions from your affiliate links</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        <Button
          variant={timeRange === 7 ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeRange(7)}
        >
          7 Days
        </Button>
        <Button
          variant={timeRange === 30 ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeRange(30)}
        >
          30 Days
        </Button>
        <Button
          variant={timeRange === 90 ? "default" : "outline"}
          size="sm"
          onClick={() => setTimeRange(90)}
        >
          90 Days
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
            <p className="text-xs text-muted-foreground">Last {timeRange} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions}</div>
            <p className="text-xs text-muted-foreground">Successful referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallConversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Click to conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Click Trends</CardTitle>
          <CardDescription>Daily clicks and conversions over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="clicks" stroke="#8884d8" name="Clicks" />
              <Line type="monotone" dataKey="conversions" stroke="#82ca9d" name="Conversions" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tool Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Tool Performance</CardTitle>
          <CardDescription>Clicks and conversions by affiliate tool</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={toolStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tool_name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_clicks" fill="#8884d8" name="Clicks" />
              <Bar dataKey="total_conversions" fill="#82ca9d" name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tool Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {toolStats.map((stat) => (
              <div key={stat.tool_name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">{stat.tool_name}</h3>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{stat.total_clicks} clicks</span>
                    <span>{stat.total_conversions} conversions</span>
                    <span>{stat.conversion_rate.toFixed(1)}% rate</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Clicks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Clicks</CardTitle>
          <CardDescription>Latest affiliate link clicks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clicks.slice(0, 10).map((click) => (
              <div key={click.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{click.tool_name}</h3>
                    {click.converted && (
                      <Badge variant="default" className="bg-green-500">Converted</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(click.clicked_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                  <a
                    href={click.tool_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    {click.tool_url} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {!click.converted && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markAsConverted(click.id)}
                  >
                    Mark Converted
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
