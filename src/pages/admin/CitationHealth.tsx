import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Citation } from '@/types/content';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CitationHealth() {
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    valid: 0,
    broken: 0,
    pending: 0,
    redirected: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCitations();
  }, []);

  const fetchCitations = async () => {
    const { data, error } = await supabase
      .from('citations')
      .select('*')
      .order('last_checked', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (data) {
      setCitations(data as Citation[]);
      calculateStats(data as Citation[]);
    }
  };

  const calculateStats = (data: Citation[]) => {
    setStats({
      total: data.length,
      valid: data.filter(c => c.status === 'valid').length,
      broken: data.filter(c => c.status === 'broken').length,
      pending: 0, // Not used in current schema
      redirected: data.filter(c => c.status === 'outdated').length,
    });
  };

  const checkCitation = async (citation: Citation) => {
    try {
      const response = await fetch(citation.url, { method: 'HEAD' });
      const status = response.status;
      
      let newStatus: Citation['status'] = 'valid';
      if (status >= 400) newStatus = 'broken';
      else if (status >= 300 && status < 400) newStatus = 'outdated';

      await supabase
        .from('citations')
        .update({
          status: newStatus,
          last_checked: new Date().toISOString()
        })
        .eq('id', citation.id);

      toast({ title: 'Success', description: 'Citation checked successfully' });
      fetchCitations();
    } catch (error) {
      await supabase
        .from('citations')
        .update({
          status: 'broken' as const,
          last_checked: new Date().toISOString()
        })
        .eq('id', citation.id);
      
      toast({ title: 'Warning', description: 'Citation appears to be broken', variant: 'destructive' });
      fetchCitations();
    }
  };

  const checkAllCitations = async () => {
    setLoading(true);
    
    for (const citation of citations) {
      await checkCitation(citation);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    toast({ title: 'Success', description: 'All citations checked' });
    setLoading(false);
  };

  const getStatusIcon = (status: Citation['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'broken':
        return <XCircle className="text-red-600" size={20} />;
      case 'outdated':
        return <AlertCircle className="text-yellow-600" size={20} />;
      default:
        return <AlertCircle className="text-muted-foreground" size={20} />;
    }
  };

  const getStatusColor = (status: Citation['status']) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'broken':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'outdated':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Citation Health</h1>
        <button
          onClick={checkAllCitations}
          disabled={loading}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Checking...' : 'Check All Citations'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Citations</div>
        </div>
        
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
          <div className="text-sm text-muted-foreground">Valid</div>
        </div>
        
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-red-600">{stats.broken}</div>
          <div className="text-sm text-muted-foreground">Broken</div>
        </div>
        
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-yellow-600">{stats.redirected}</div>
          <div className="text-sm text-muted-foreground">Redirected</div>
        </div>
        
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-muted-foreground">{stats.pending}</div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </div>
      </div>

      {/* Health Score */}
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Citation Health Score</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600"
                style={{ width: `${stats.total > 0 ? (stats.valid / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="text-2xl font-bold">
            {stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 0}%
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {stats.broken > 0 && (
            <span className="text-red-600 font-medium">
              ⚠️ {stats.broken} broken citation{stats.broken !== 1 ? 's' : ''} need{stats.broken === 1 ? 's' : ''} attention
            </span>
          )}
          {stats.broken === 0 && stats.valid === stats.total && stats.total > 0 && (
            <span className="text-green-600 font-medium">
              ✓ All citations are healthy!
            </span>
          )}
        </p>
      </div>

      {/* Citations List */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Last Checked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {citations.map((citation) => (
                <tr key={citation.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(citation.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(citation.status)}`}>
                        {citation.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{citation.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1 max-w-xs truncate"
                    >
                      {citation.url}
                      <ExternalLink size={12} />
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {citation.last_checked ? new Date(citation.last_checked).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => checkCitation(citation)}
                      className="text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      <RefreshCw size={14} />
                      Recheck
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {citations.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          <CheckCircle size={48} className="mx-auto mb-2 opacity-50" />
          <p>No citations found</p>
          <p className="text-sm mt-1">Citations from blog articles will appear here</p>
        </div>
      )}
    </div>
  );
}
