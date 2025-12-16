import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, ArrowDown, Loader2, Sparkles, Zap, GitBranch, PieChart, BarChart3, Copy, Check, Download } from 'lucide-react';
import mermaid from 'mermaid';
import { toast } from 'sonner';

export default function Diagrams() {
  const [renderedSvg, setRenderedSvg] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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

  const copyCode = async () => {
    await navigator.clipboard.writeText(diagramCode);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const exportSvg = () => {
    if (!renderedSvg) return;
    const blob = new Blob([renderedSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.svg';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('SVG exported successfully');
  };

  // Initialize mermaid with custom theme
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: 'hsl(262, 83%, 58%)',
        primaryTextColor: '#fff',
        primaryBorderColor: 'hsl(262, 83%, 48%)',
        lineColor: 'hsl(262, 30%, 60%)',
        secondaryColor: 'hsl(45, 93%, 47%)',
        tertiaryColor: 'hsl(262, 83%, 95%)',
        fontFamily: 'system-ui, sans-serif',
      },
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
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 p-8 border border-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
              <Network className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Diagram Studio
            </h1>
          </div>
          <p className="text-muted-foreground max-w-lg">
            Create stunning visual diagrams with Mermaid syntax. Perfect for funnels, workflows, and process documentation.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editor */}
        <Card className="border-primary/10 shadow-xl shadow-primary/5 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-lg">Code Editor</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyCode}
                className="h-8 px-2 hover:bg-primary/10"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <CardDescription>Write or customize your Mermaid diagram code</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="template" className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-secondary" />
                Quick Templates
              </Label>
              <Select onValueChange={(value) => loadTemplate(value as keyof typeof templates)}>
                <SelectTrigger className="bg-muted/30 border-border/50 hover:border-primary/30 transition-colors">
                  <SelectValue placeholder="Choose a template to start" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="funnel">
                    <span className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      Marketing Funnel
                    </span>
                  </SelectItem>
                  <SelectItem value="workflow">
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-secondary" />
                      Lead Workflow
                    </span>
                  </SelectItem>
                  <SelectItem value="timeline">
                    <span className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-green-500" />
                      Project Timeline
                    </span>
                  </SelectItem>
                  <SelectItem value="process">
                    <span className="flex items-center gap-2">
                      <PieChart className="h-4 w-4 text-blue-500" />
                      Content Process
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagram-code" className="text-sm font-medium">Mermaid Code</Label>
              <Textarea 
                id="diagram-code" 
                value={diagramCode}
                onChange={(e) => setDiagramCode(e.target.value)}
                rows={14}
                className="font-mono text-sm bg-muted/20 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all resize-none"
                placeholder="Enter your Mermaid diagram code here..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                onClick={exportSvg}
                disabled={!renderedSvg}
                className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/25 transition-all hover:shadow-primary/35"
              >
                <Download className="h-4 w-4 mr-2" />
                Export SVG
              </Button>
              <Button 
                variant="outline" 
                disabled={!renderedSvg}
                className="flex-1 border-primary/20 hover:bg-primary/5 hover:border-primary/30"
              >
                <ArrowDown className="h-4 w-4 mr-2" />
                Export PNG
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="border-primary/10 shadow-xl shadow-primary/5 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-secondary/10">
                <Network className="h-4 w-4 text-secondary" />
              </div>
              <CardTitle className="text-lg">Live Preview</CardTitle>
            </div>
            <CardDescription>Your diagram renders in real-time as you type</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative rounded-xl border border-border/50 bg-gradient-to-br from-background via-muted/5 to-muted/10 min-h-[400px] flex items-center justify-center overflow-auto p-6">
              {/* Decorative grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:20px_20px] opacity-50" />
              
              <div className="relative z-10 w-full">
                {isRendering ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                      <div className="relative p-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">Rendering diagram...</span>
                  </div>
                ) : renderError ? (
                  <div className="text-center p-6 rounded-xl bg-destructive/5 border border-destructive/20">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <p className="font-semibold text-destructive mb-1">Syntax Error</p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">{renderError}</p>
                  </div>
                ) : renderedSvg ? (
                  <div 
                    className="w-full flex justify-center animate-fade-in [&_svg]:max-w-full [&_svg]:h-auto"
                    dangerouslySetInnerHTML={{ __html: renderedSvg }} 
                  />
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mx-auto mb-4">
                      <Network className="h-8 w-8 text-primary/50" />
                    </div>
                    <p className="text-muted-foreground font-medium">Enter Mermaid code to see preview</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Select a template to get started</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documentation */}
      <Card className="border-primary/10 shadow-xl shadow-primary/5 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-lg">Syntax Reference</CardTitle>
          </div>
          <CardDescription>Quick examples for different diagram types</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="flowchart" className="w-full">
            <TabsList className="bg-muted/30 p-1 mb-6">
              <TabsTrigger value="flowchart" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <GitBranch className="h-4 w-4 mr-2" />
                Flowchart
              </TabsTrigger>
              <TabsTrigger value="sequence" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Zap className="h-4 w-4 mr-2" />
                Sequence
              </TabsTrigger>
              <TabsTrigger value="gantt" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="h-4 w-4 mr-2" />
                Gantt
              </TabsTrigger>
              <TabsTrigger value="pie" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <PieChart className="h-4 w-4 mr-2" />
                Pie Chart
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="flowchart" className="space-y-3 animate-fade-in">
              <h4 className="font-semibold text-foreground">Flowchart Syntax</h4>
              <pre className="text-xs bg-gradient-to-br from-muted/50 to-muted/30 p-4 rounded-xl border border-border/50 overflow-x-auto font-mono">
{`flowchart TD
    A[Rectangle] --> B{Diamond}
    B -->|Yes| C[Rectangle]
    B -->|No| D[Rectangle]`}
              </pre>
            </TabsContent>

            <TabsContent value="sequence" className="space-y-3 animate-fade-in">
              <h4 className="font-semibold text-foreground">Sequence Diagram Syntax</h4>
              <pre className="text-xs bg-gradient-to-br from-muted/50 to-muted/30 p-4 rounded-xl border border-border/50 overflow-x-auto font-mono">
{`sequenceDiagram
    Client->>Server: Request
    Server->>Database: Query
    Database->>Server: Response
    Server->>Client: Data`}
              </pre>
            </TabsContent>

            <TabsContent value="gantt" className="space-y-3 animate-fade-in">
              <h4 className="font-semibold text-foreground">Gantt Chart Syntax</h4>
              <pre className="text-xs bg-gradient-to-br from-muted/50 to-muted/30 p-4 rounded-xl border border-border/50 overflow-x-auto font-mono">
{`gantt
    title Project Schedule
    dateFormat YYYY-MM-DD
    section Phase 1
    Task 1 :a1, 2024-01-01, 30d
    Task 2 :after a1, 20d`}
              </pre>
            </TabsContent>

            <TabsContent value="pie" className="space-y-3 animate-fade-in">
              <h4 className="font-semibold text-foreground">Pie Chart Syntax</h4>
              <pre className="text-xs bg-gradient-to-br from-muted/50 to-muted/30 p-4 rounded-xl border border-border/50 overflow-x-auto font-mono">
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
