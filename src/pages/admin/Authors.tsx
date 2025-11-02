import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Edit, Trash2, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface Author {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  is_reviewer: boolean;
  credentials: string[];
  expertise_areas: string[];
  created_at: string;
}

export default function Authors() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: authors, isLoading } = useQuery({
    queryKey: ['authors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authors')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Author[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (authorData: any) => {
      const { data, error } = await supabase
        .from('authors')
        .insert([authorData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      toast({ title: 'Author created successfully' });
      setIsDialogOpen(false);
      setEditingAuthor(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating author', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...authorData }: any) => {
      const { data, error } = await supabase
        .from('authors')
        .update(authorData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      toast({ title: 'Author updated successfully' });
      setIsDialogOpen(false);
      setEditingAuthor(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating author', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('authors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      toast({ title: 'Author deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting author', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const credentials = formData.get('credentials')?.toString().split('\n').filter(c => c.trim()) || [];
    const expertiseAreas = formData.get('expertise_areas')?.toString().split('\n').filter(e => e.trim()) || [];
    
    const authorData = {
      name: formData.get('name')?.toString() || '',
      title: formData.get('title')?.toString() || null,
      bio: formData.get('bio')?.toString() || null,
      photo_url: formData.get('photo_url')?.toString() || null,
      linkedin_url: formData.get('linkedin_url')?.toString() || null,
      is_reviewer: formData.get('is_reviewer') === 'true',
      credentials,
      expertise_areas: expertiseAreas,
    };

    if (editingAuthor) {
      updateMutation.mutate({ id: editingAuthor.id, ...authorData });
    } else {
      createMutation.mutate(authorData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Authors</h1>
          <p className="text-muted-foreground">Manage content authors and reviewers for E-E-A-T authority</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAuthor(null)}>
              <Plus className="h-4 w-4 mr-2" />
              New Author
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAuthor ? 'Edit Author' : 'Create Author'}</DialogTitle>
              <DialogDescription>
                {editingAuthor ? 'Update author details' : 'Add a new content author or reviewer'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" name="name" defaultValue={editingAuthor?.name} required />
              </div>
              
              <div>
                <Label htmlFor="title">Title/Position</Label>
                <Input 
                  id="title" 
                  name="title" 
                  defaultValue={editingAuthor?.title || ''} 
                  placeholder="e.g., Founder & CEO, Marketing Strategist"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  name="bio" 
                  defaultValue={editingAuthor?.bio || ''} 
                  rows={4}
                  placeholder="Author's professional background and expertise..."
                />
              </div>

              <div>
                <Label htmlFor="photo_url">Photo URL</Label>
                <Input 
                  id="photo_url" 
                  name="photo_url" 
                  defaultValue={editingAuthor?.photo_url || ''} 
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div>
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input 
                  id="linkedin_url" 
                  name="linkedin_url" 
                  defaultValue={editingAuthor?.linkedin_url || ''} 
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div>
                <Label htmlFor="credentials">Credentials (one per line)</Label>
                <Textarea 
                  id="credentials" 
                  name="credentials" 
                  defaultValue={editingAuthor?.credentials?.join('\n') || ''} 
                  rows={3}
                  placeholder="EdD - Educational Leadership&#10;MBA - Global Business&#10;Certified Marketing Professional"
                />
              </div>

              <div>
                <Label htmlFor="expertise_areas">Expertise Areas (one per line)</Label>
                <Textarea 
                  id="expertise_areas" 
                  name="expertise_areas" 
                  defaultValue={editingAuthor?.expertise_areas?.join('\n') || ''} 
                  rows={3}
                  placeholder="AI Marketing&#10;Marketing Automation&#10;Funnel Strategy"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_reviewer">Content Reviewer</Label>
                  <p className="text-sm text-muted-foreground">Can review and approve content</p>
                </div>
                <Switch 
                  id="is_reviewer"
                  name="is_reviewer"
                  defaultChecked={editingAuthor?.is_reviewer}
                  value={editingAuthor?.is_reviewer ? 'true' : 'false'}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingAuthor ? 'Update' : 'Create'} Author
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading authors...</div>
      ) : (
        <div className="grid gap-4">
          {authors?.map((author) => (
            <Card key={author.id}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={author.photo_url || undefined} alt={author.name} />
                    <AvatarFallback>{author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {author.name}
                          {author.is_reviewer && (
                            <Badge variant="secondary" className="gap-1">
                              <Award className="h-3 w-3" />
                              Reviewer
                            </Badge>
                          )}
                        </CardTitle>
                        {author.title && <CardDescription>{author.title}</CardDescription>}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingAuthor(author);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this author?')) {
                              deleteMutation.mutate(author.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {author.bio && (
                    <p className="text-sm text-muted-foreground">{author.bio}</p>
                  )}
                  
                  {author.credentials && author.credentials.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Credentials:</h4>
                      <div className="flex flex-wrap gap-2">
                        {author.credentials.map((cred, idx) => (
                          <Badge key={idx} variant="outline">{cred}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {author.expertise_areas && author.expertise_areas.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Expertise:</h4>
                      <div className="flex flex-wrap gap-2">
                        {author.expertise_areas.map((area, idx) => (
                          <Badge key={idx}>{area}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {author.linkedin_url && (
                    <a 
                      href={author.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View LinkedIn Profile →
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
