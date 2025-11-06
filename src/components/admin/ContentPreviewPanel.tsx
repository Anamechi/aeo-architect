import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, X, Save, RotateCcw, Upload } from 'lucide-react';
import { ContentPreview, ContentSkeleton, IconBadge } from './DesignSystem';
import ReactMarkdown from 'react-markdown';

interface ContentPreviewPanelProps {
  content: string;
  isGenerating?: boolean;
  featuredImageUrl?: string;
  onEdit: (newContent: string) => void;
  onRegenerateImage: () => void;
  onUploadCustomImage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  generatingImage?: boolean;
}

export function ContentPreviewPanel({
  content,
  isGenerating = false,
  featuredImageUrl,
  onEdit,
  onRegenerateImage,
  onUploadCustomImage,
  generatingImage = false,
}: ContentPreviewPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);

  const calculateReadingStats = () => {
    const words = content.trim().split(/\s+/).length;
    const readingTime = Math.ceil(words / 200);
    return { wordCount: words, readingTime };
  };

  const stats = calculateReadingStats();

  const handleSaveEdits = () => {
    onEdit(editedContent);
    setIsEditing(false);
    setHasUnsavedEdits(false);
  };

  const handleCancelEdits = () => {
    setEditedContent(content);
    setIsEditing(false);
    setHasUnsavedEdits(false);
  };

  const handleContentChange = (newContent: string) => {
    setEditedContent(newContent);
    setHasUnsavedEdits(newContent !== content);
  };

  if (!content && !isGenerating) {
    return (
      <Card className="sticky top-4 shadow-xl border-2">
        <CardContent className="p-12 text-center">
          <Eye className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Content Yet</h3>
          <p className="text-muted-foreground">
            Generate content to see the live preview here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="sticky top-4 space-y-4">
      <Card className="shadow-xl border-2 border-primary/20">
        <CardHeader className="bg-gradient-subtle pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Live Preview
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasUnsavedEdits && (
                <Badge variant="destructive" className="animate-pulse">
                  Unsaved
                </Badge>
              )}
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  variant="outline"
                  className="shadow-sm hover:shadow-md transition-all"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Content
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveEdits}
                    size="sm"
                    className="bg-gradient-primary shadow-sm hover:shadow-md transition-all"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancelEdits}
                    size="sm"
                    variant="outline"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-3">
            <IconBadge icon={<span>📝</span>}>
              {stats.wordCount} words
            </IconBadge>
            <IconBadge icon={<span>⏱️</span>} variant="success">
              {stats.readingTime} min read
            </IconBadge>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 max-h-[80vh] overflow-y-auto">
          {/* Featured Image Section */}
          {(featuredImageUrl || generatingImage) && (
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Featured Image</h4>
                <div className="flex gap-2">
                  <Button
                    onClick={onRegenerateImage}
                    size="sm"
                    variant="outline"
                    disabled={generatingImage}
                  >
                    <RotateCcw className={`h-4 w-4 mr-2 ${generatingImage ? 'animate-spin' : ''}`} />
                    Regenerate
                  </Button>
                  <label className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onUploadCustomImage}
                    />
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Custom
                  </label>
                </div>
              </div>
              {generatingImage ? (
                <div className="aspect-video bg-muted rounded-lg animate-pulse flex items-center justify-center">
                  <p className="text-muted-foreground">Generating image...</p>
                </div>
              ) : featuredImageUrl ? (
                <img
                  src={featuredImageUrl}
                  alt="Featured"
                  className="w-full rounded-lg shadow-lg border border-border"
                />
              ) : null}
            </div>
          )}

          {/* Content Preview/Editor */}
          {isGenerating ? (
            <ContentSkeleton />
          ) : isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="min-h-[500px] font-mono text-sm"
              placeholder="Edit your markdown content here..."
            />
          ) : (
            <ContentPreview>
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-3xl font-bold mt-6 mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-2xl font-bold mt-5 mb-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xl font-semibold mt-4 mb-2">{children}</h3>,
                  p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                  code: ({ children }) => (
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{children}</code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </ContentPreview>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
