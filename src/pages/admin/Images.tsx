import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Download, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface GeneratedImage {
  id: string;
  filename: string;
  storage_url: string | null;
  alt_text: string | null;
  prompt_used: string | null;
  tool_used: string | null;
  used_in_posts: string[];
  created_at: string;
}

export default function Images() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: images, isLoading } = useQuery({
    queryKey: ['generated-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as GeneratedImage[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (imageData: any) => {
      const { data, error } = await supabase
        .from('generated_images')
        .insert([imageData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-images'] });
      toast({ title: 'Image added successfully' });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Error adding image', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('generated_images')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-images'] });
      toast({ title: 'Image deleted successfully' });
    },
  });

  const handleGenerateImage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const prompt = formData.get('prompt')?.toString() || '';
    
    setGeneratingImage(true);
    
    // In production, this would call an AI image generation API
    // For now, we'll simulate it
    setTimeout(() => {
      const imageData = {
        filename: `generated-${Date.now()}.png`,
        alt_text: formData.get('alt_text')?.toString() || null,
        prompt_used: prompt,
        tool_used: 'DALL-E',
        storage_url: 'https://placeholder.svg?height=512&width=512',
      };
      
      createMutation.mutate(imageData);
      setGeneratingImage(false);
    }, 2000);
  };

  const handleUploadImage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const imageData = {
      filename: formData.get('filename')?.toString() || '',
      storage_url: formData.get('url')?.toString() || null,
      alt_text: formData.get('alt_text')?.toString() || null,
      tool_used: 'Manual Upload',
    };

    createMutation.mutate(imageData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Image Generator & Library</h1>
          <p className="text-muted-foreground">Generate AI images or manage uploaded images for content</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Image</DialogTitle>
              <DialogDescription>Generate an AI image or upload an existing one</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* AI Generation Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Generate with AI
                  </CardTitle>
                  <CardDescription>Create unique images using AI</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGenerateImage} className="space-y-4">
                    <div>
                      <Label htmlFor="prompt">Image Prompt *</Label>
                      <Textarea 
                        id="prompt" 
                        name="prompt" 
                        required
                        rows={3}
                        placeholder="A professional hero image showing diverse entrepreneurs collaborating on marketing strategies, modern office setting, bright colors..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="gen-alt-text">Alt Text *</Label>
                      <Input 
                        id="gen-alt-text" 
                        name="alt_text" 
                        required
                        placeholder="Diverse entrepreneurs collaborating on marketing strategies"
                      />
                    </div>
                    <Button type="submit" disabled={generatingImage}>
                      {generatingImage ? (
                        <>Generating...</>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Image
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Manual Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upload Existing Image</CardTitle>
                  <CardDescription>Add an image URL from external source</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUploadImage} className="space-y-4">
                    <div>
                      <Label htmlFor="filename">Filename *</Label>
                      <Input 
                        id="filename" 
                        name="filename" 
                        required
                        placeholder="hero-image-marketing.jpg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="url">Image URL *</Label>
                      <Input 
                        id="url" 
                        name="url" 
                        type="url"
                        required
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="upload-alt-text">Alt Text *</Label>
                      <Input 
                        id="upload-alt-text" 
                        name="alt_text" 
                        required
                        placeholder="Descriptive alt text for SEO"
                      />
                    </div>
                    <Button type="submit">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Image
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Images Grid */}
      {isLoading ? (
        <div className="text-center py-12">Loading images...</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {images?.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {image.storage_url ? (
                  <img 
                    src={image.storage_url} 
                    alt={image.alt_text || image.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No preview available
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-sm truncate">{image.filename}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {image.alt_text || 'No alt text'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {image.prompt_used && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      Prompt: {image.prompt_used}
                    </p>
                  )}
                  {image.tool_used && (
                    <Badge variant="outline" className="text-xs">
                      {image.tool_used}
                    </Badge>
                  )}
                  {image.used_in_posts && image.used_in_posts.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Used in {image.used_in_posts.length} post(s)
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    {image.storage_url && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        asChild
                      >
                        <a href={image.storage_url} download={image.filename}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this image?')) {
                          deleteMutation.mutate(image.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
