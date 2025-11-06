import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText, Edit, Trash2, Search, Plus, Eye, Calendar, Target, Upload, Link2, CheckCircle, UserCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type FunnelStage = 'TOFU' | 'MOFU' | 'BOFU';
type ContentStatus = 'draft' | 'published' | 'archived' | 'review';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  reading_time: number | null;
  status: ContentStatus;
  funnel_stage: FunnelStage | null;
  category: string | null;
  tags: string[];
  seo_score: number | null;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  featured_image_url: string | null;
}

export default function BlogPosts() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');
  const [funnelFilter, setFunnelFilter] = useState<FunnelStage | 'all'>('all');

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [posts, searchTerm, statusFilter, funnelFilter]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      toast.error('Failed to load blog posts');
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...posts];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(post => post.status === statusFilter);
    }

    // Funnel stage filter
    if (funnelFilter !== 'all') {
      filtered = filtered.filter(post => post.funnel_stage === funnelFilter);
    }

    setFilteredPosts(filtered);
  };

  const handlePublish = async (id: string, title: string) => {
    if (!confirm(`Publish "${title}"? This will make it visible on your website.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Blog post published successfully!');
      fetchPosts();
    } catch (error: any) {
      toast.error('Failed to publish blog post');
      console.error('Error publishing post:', error);
    }
  };

  const handleUnpublish = async (id: string, title: string) => {
    if (!confirm(`Unpublish "${title}"? This will remove it from your website.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          status: 'draft',
          published_at: null
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Blog post unpublished');
      fetchPosts();
    } catch (error: any) {
      toast.error('Failed to unpublish blog post');
      console.error('Error unpublishing post:', error);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Blog post deleted successfully');
      fetchPosts();
    } catch (error: any) {
      toast.error('Failed to delete blog post');
      console.error('Error deleting post:', error);
    }
  };

  const handleSetDefaultAuthor = async () => {
    if (!confirm('Set Dr. Deanna Romulus as author for all posts missing an author?')) {
      return;
    }

    try {
      // First, get Dr. Deanna Romulus's ID
      const { data: authorData, error: authorError } = await supabase
        .from('authors')
        .select('id')
        .eq('name', 'Dr. Deanna Romulus, MBA')
        .single();

      if (authorError || !authorData) {
        toast.error('Could not find Dr. Deanna Romulus in authors');
        return;
      }

      // Update all posts without an author
      const { error } = await supabase
        .from('blog_posts')
        .update({ author_id: authorData.id })
        .is('author_id', null);

      if (error) throw error;

      toast.success('Author updated for all posts!');
      fetchPosts();
    } catch (error: any) {
      toast.error('Failed to update authors');
      console.error('Error updating authors:', error);
    }
  };

  const getStatusBadge = (status: ContentStatus) => {
    const variants: Record<ContentStatus, 'default' | 'secondary' | 'outline'> = {
      draft: 'secondary',
      published: 'default',
      archived: 'outline',
      review: 'outline'
    };
    
    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getFunnelBadge = (stage: FunnelStage | null) => {
    if (!stage) return null;
    
    const colors = {
      TOFU: 'bg-blue-100 text-blue-800',
      MOFU: 'bg-purple-100 text-purple-800',
      BOFU: 'bg-green-100 text-green-800'
    };
    
    return (
      <Badge variant="outline" className={colors[stage]}>
        {stage}
      </Badge>
    );
  };

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    draft: posts.filter(p => p.status === 'draft').length,
    review: posts.filter(p => p.status === 'review').length,
    archived: posts.filter(p => p.status === 'archived').length,
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Blog Posts
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage all your blog content in one place
          </p>
        </div>
        
        <div className="flex gap-2">
          {posts.some(p => !p.author_id) && (
            <Button onClick={handleSetDefaultAuthor} variant="outline" size="lg">
              <UserCheck className="h-5 w-5 mr-2" />
              Set Default Author
            </Button>
          )}
          <Button onClick={() => navigate('/admin/blog/new')} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            New Blog Post
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Posts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <div className="text-sm text-muted-foreground">Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
            <div className="text-sm text-muted-foreground">Drafts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.review}</div>
            <div className="text-sm text-muted-foreground">In Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.archived}</div>
            <div className="text-sm text-muted-foreground">Archived</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="review">In Review</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={funnelFilter} onValueChange={(v) => setFunnelFilter(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by funnel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="TOFU">TOFU - Awareness</SelectItem>
                <SelectItem value="MOFU">MOFU - Consideration</SelectItem>
                <SelectItem value="BOFU">BOFU - Decision</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            {posts.length === 0 ? (
              <>No blog posts yet. Click "New Blog Post" to create your first one!</>
            ) : (
              <>No posts match your filters. Try adjusting your search criteria.</>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Featured Image Thumbnail */}
                  {post.featured_image_url && (
                    <div className="flex-shrink-0">
                      <img 
                        src={post.featured_image_url} 
                        alt={post.title}
                        className="w-32 h-24 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-3">
                    {/* Title and Badges */}
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {post.title}
                      </h3>
                      
                      {/* Excerpt */}
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {post.excerpt}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2">
                        {getStatusBadge(post.status)}
                        {getFunnelBadge(post.funnel_stage)}
                        {post.category && (
                          <Badge variant="outline">{post.category}</Badge>
                        )}
                        {post.reading_time && (
                          <Badge variant="secondary" className="gap-1">
                            {post.reading_time} min read
                          </Badge>
                        )}
                        {post.seo_score && (
                          <Badge 
                            variant={post.seo_score >= 80 ? 'default' : post.seo_score >= 50 ? 'secondary' : 'outline'}
                            className="gap-1"
                          >
                            <Target className="h-3 w-3" />
                            SEO: {post.seo_score}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Created: {new Date(post.created_at).toLocaleDateString()}
                      </div>
                      {post.published_at && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          Published: {new Date(post.published_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {/* Publish/Unpublish Button */}
                    {post.status === 'draft' ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handlePublish(post.id, post.title)}
                        className="w-full"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Publish
                      </Button>
                    ) : post.status === 'published' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUnpublish(post.id, post.title)}
                        className="w-full"
                      >
                        Unpublish
                      </Button>
                    ) : null}
                    
                    <div className="flex gap-2">
                      {/* Quick Actions */}
                      {!post.featured_image_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                          className="flex-1"
                          title="Add image"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                        className="flex-1"
                        title="Manage citations"
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        disabled={post.status !== 'published'}
                        className="flex-1"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                        className="flex-1"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(post.id, post.title)}
                        className="text-destructive hover:text-destructive flex-1"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results Count */}
      {filteredPosts.length > 0 && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Showing {filteredPosts.length} of {posts.length} posts
        </div>
      )}
    </div>
  );
}
