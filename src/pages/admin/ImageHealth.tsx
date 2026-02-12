import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ImageOff, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ImageHealth() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['image-health'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, featured_image_url, image_alt_text, image_caption, status')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const missing = posts?.filter(p => !p.featured_image_url) || [];
  const noAlt = posts?.filter(p => p.featured_image_url && !p.image_alt_text) || [];
  const noCaption = posts?.filter(p => p.featured_image_url && !p.image_caption) || [];
  const healthy = posts?.filter(p => p.featured_image_url && p.image_alt_text) || [];

  // Detect duplicates
  const urlCounts: Record<string, number> = {};
  posts?.forEach(p => {
    if (p.featured_image_url) {
      urlCounts[p.featured_image_url] = (urlCounts[p.featured_image_url] || 0) + 1;
    }
  });
  const duplicateUrls = Object.entries(urlCounts).filter(([, count]) => count > 1);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Image Health Checker</h1>
        <p className="text-muted-foreground">Scan all posts for missing, duplicate, or incomplete images</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{healthy.length}</p>
            <p className="text-sm text-muted-foreground">Healthy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <ImageOff className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{missing.length}</p>
            <p className="text-sm text-muted-foreground">Missing Image</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{noAlt.length}</p>
            <p className="text-sm text-muted-foreground">Missing Alt Text</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{duplicateUrls.length}</p>
            <p className="text-sm text-muted-foreground">Duplicate Images</p>
          </CardContent>
        </Card>
      </div>

      {missing.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-red-600">Missing Images</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {missing.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm font-medium">{p.title}</span>
                  <Badge variant="destructive">{p.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {noAlt.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-yellow-600">Missing Alt Text</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {noAlt.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm font-medium">{p.title}</span>
                  <Badge variant="outline">No Alt</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {duplicateUrls.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-orange-600">Duplicate Images</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {duplicateUrls.map(([url, count]) => (
                <div key={url} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm truncate max-w-md">{url}</span>
                  <Badge variant="outline">Used {count}x</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
