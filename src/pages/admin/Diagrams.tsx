import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, ArrowDown, Loader2 } from 'lucide-react';
import mermaid from 'mermaid';

export default function Diagrams() {
  const [renderedSvg, setRenderedSvg] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const renderCount = useRef(0);
  const [diagramCode, setDiagramCode] = useState(`graph TD
    A[Awareness - TOFU] --> B[Interest]
    B --> C[Consideration - MOFU]
    C --> D[Intent]
    D --> E[Purchase - BOFU]
    E --> F[Loyalty]
    F --> G[Advocacy]`);

  const templates = {
    funnel: `graph TD
    A[Awareness - TOFU] --> B[Interest]
    B --> C[Consideration - MOFU]
    C --> D[Intent]
    D --> E[Purchase - BOFU]
    E --> F[Loyalty]
    F --> G[Advocacy]`,
    
    workflow: `flowchart LR
    A[Lead Captured] --> B{Qualified?}
    B -->|Yes| C[Send Email Sequence]
    B -->|No| D[Nurture Campaign]
    C --> E[Book Consultation]
    D --> F[Re-qualify]
    F --> B`,
    
    timeline: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Planning
    Research           :a1, 2024-01-01, 14d
    Strategy           :a2, after a1, 7d
    section Execution
    Content Creation   :a3, after a2, 21d
    Campaign Launch    :a4, after a3, 7d`,
    
    process: `flowchart TD
    A[Start] --> B[Define Goals]
    B --> C[Audience Research]
    C --> D[Content Strategy]
    D --> E[Create Content]
    E --> F[Publish & Distribute]
    F --> G[Measure Results]
    G --> H{Goals Met?}
    H -->|Yes| I[Scale]
    H -->|No| J[Optimize]
    J --> D`
  };

  const loadTemplate = (template: keyof typeof templates) => {
    setDiagramCode(templates[template]);
  };

  // Initialize mermaid and render diagram
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });
  }, []);

  // Render diagram when code changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (!diagramCode.trim()) {
        setRenderedSvg('');
        return;
      }

      setIsRendering(true);
      setRenderError(null);

      try {
        renderCount.current += 1;
        const id = `mermaid-${renderCount.current}`;
        const { svg } = await mermaid.render(id, diagramCode);
        setRenderedSvg(svg);
      } catch (error) {
        console.error('Mermaid render error:', error);
        setRenderError(error instanceof Error ? error.message : 'Failed to render diagram');
        setRenderedSvg('');
      } finally {
        setIsRendering(false);
      }
    };

    const debounce = setTimeout(renderDiagram, 300);
    return () => clearTimeout(debounce);
  }, [diagramCode]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Diagram Generator</h1>
        <p className="text-muted-foreground">Create visual diagrams using Mermaid syntax</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Diagram Editor
            </CardTitle>
            <CardDescription>Write or edit Mermaid diagram code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="template">Load Template</Label>
              <Select onValueChange={(value) => loadTemplate(value as keyof typeof templates)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="funnel">Marketing Funnel</SelectItem>
                  <SelectItem value="workflow">Lead Workflow</SelectItem>
                  <SelectItem value="timeline">Project Timeline</SelectItem>
                  <SelectItem value="process">Content Process</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="diagram-code">Mermaid Code</Label>
              <Textarea 
                id="diagram-code" 
                value={diagramCode}
                onChange={(e) => setDiagramCode(e.target.value)}
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button>
                <ArrowDown className="h-4 w-4 mr-2" />
                Export as SVG
              </Button>
              <Button variant="outline">
                <ArrowDown className="h-4 w-4 mr-2" />
                Export as PNG
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Live diagram preview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-6 bg-background min-h-[400px] flex items-center justify-center overflow-auto">
              {isRendering ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm">Rendering...</span>
                </div>
              ) : renderError ? (
                <div className="text-destructive text-sm text-center">
                  <p className="font-medium">Render Error</p>
                  <p className="text-xs mt-1">{renderError}</p>
                </div>
              ) : renderedSvg ? (
                <div 
                  className="w-full flex justify-center"
                  dangerouslySetInnerHTML={{ __html: renderedSvg }} 
                />
              ) : (
                <p className="text-muted-foreground text-sm">Enter Mermaid code to see preview</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Diagram Types & Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="flowchart">
            <TabsList>
              <TabsTrigger value="flowchart">Flowchart</TabsTrigger>
              <TabsTrigger value="sequence">Sequence</TabsTrigger>
              <TabsTrigger value="gantt">Gantt</TabsTrigger>
              <TabsTrigger value="pie">Pie Chart</TabsTrigger>
            </TabsList>
            
            <TabsContent value="flowchart" className="space-y-2">
              <h4 className="font-semibold">Flowchart Syntax</h4>
              <pre className="text-xs bg-muted p-3 rounded">
{`flowchart TD
    A[Rectangle] --> B{Diamond}
    B -->|Yes| C[Rectangle]
    B -->|No| D[Rectangle]`}
              </pre>
            </TabsContent>

            <TabsContent value="sequence" className="space-y-2">
              <h4 className="font-semibold">Sequence Diagram Syntax</h4>
              <pre className="text-xs bg-muted p-3 rounded">
{`sequenceDiagram
    Client->>Server: Request
    Server->>Database: Query
    Database->>Server: Response
    Server->>Client: Data`}
              </pre>
            </TabsContent>

            <TabsContent value="gantt" className="space-y-2">
              <h4 className="font-semibold">Gantt Chart Syntax</h4>
              <pre className="text-xs bg-muted p-3 rounded">
{`gantt
    title Project Schedule
    dateFormat YYYY-MM-DD
    section Phase 1
    Task 1 :a1, 2024-01-01, 30d
    Task 2 :after a1, 20d`}
              </pre>
            </TabsContent>

            <TabsContent value="pie" className="space-y-2">
              <h4 className="font-semibold">Pie Chart Syntax</h4>
              <pre className="text-xs bg-muted p-3 rounded">
{`pie title Traffic Sources
    "Organic Search" : 45
    "Direct" : 25
    "Social Media" : 20
    "Referral" : 10`}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
