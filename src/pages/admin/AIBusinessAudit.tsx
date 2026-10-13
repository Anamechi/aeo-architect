import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck, Plus, FileDown, Save, FlaskConical, Check, X,
  ArrowLeft, ArrowRight, Upload, Sparkles, Trash2,
} from "lucide-react";
import {
  type Workflow, type AuditFields, type Pricing,
  BLANK_FIELDS, DEFAULT_PRICING, FIELD_DEFS, NOTE_DEFS, DISCOVERY_QUESTIONS,
  PHASE_LABELS, PHASE_SUBTITLES, PHASE_COLORS,
  blankWorkflow, exampleWorkflows, EXAMPLE_FIELDS,
  computeDerived, computePricing, reportSummary, money,
} from "@/lib/audit";

// The new-table type is not in the generated Supabase types yet, so reach it loosely.
const db = supabase as any;

interface AuditRow {
  id: string;
  business_name: string | null;
  industry: string | null;
  contact: string | null;
  assessment_date: string | null;
  team_size: number | null;
  consultant: string | null;
  goals: string | null;
  tools: string | null;
  constraints: string | null;
  workflows: Workflow[];
  pricing: Partial<Pricing>;
  price_in_report: boolean;
  status: "draft" | "sent" | "won" | "lost";
  created_at: string;
  updated_at?: string;
}

const STEP_LABELS = [
  "Business assessment",
  "Opportunity scorecard",
  "30/60/90 roadmap",
  "Pricing",
  "Client report",
];

function rowToState(r: AuditRow) {
  return {
    fields: {
      businessName: r.business_name ?? "",
      industry: r.industry ?? "",
      contact: r.contact ?? "",
      date: r.assessment_date ?? "",
      teamSize: r.team_size != null ? String(r.team_size) : "",
      consultant: r.consultant ?? "ANAMECHI Marketing",
      goals: r.goals ?? "",
      tools: r.tools ?? "",
      constraints: r.constraints ?? "",
    } as AuditFields,
    workflows: (r.workflows || []).map((w) => blankWorkflow(w)),
    pricing: { ...DEFAULT_PRICING, ...(r.pricing || {}) } as Pricing,
    priceInReport: r.price_in_report ?? true,
    status: r.status ?? "draft",
  };
}

export default function AIBusinessAudit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<AuditFields>({ ...BLANK_FIELDS });
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [pricing, setPricing] = useState<Pricing>({ ...DEFAULT_PRICING });
  const [priceInReport, setPriceInReport] = useState(true);
  const [status, setStatus] = useState<AuditRow["status"]>("draft");
  const [saving, setSaving] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [intakeText, setIntakeText] = useState("");
  const [intakeMsg, setIntakeMsg] = useState("");
  const [extracting, setExtracting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Saved audits list.
  const { data: audits } = useQuery({
    queryKey: ["ai-business-audits"],
    queryFn: async () => {
      const { data, error } = await db
        .from("ai_business_audits")
        .select("id,business_name,assessment_date,created_at,status,workflows")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as AuditRow[];
    },
  });

  // Load one audit when an id is in the route.
  const { data: current } = useQuery({
    queryKey: ["ai-business-audit", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await db.from("ai_business_audits").select("*").eq("id", id).single();
      if (error) throw error;
      return data as AuditRow;
    },
  });

  useEffect(() => {
    if (current) {
      const s = rowToState(current);
      setFields(s.fields);
      setWorkflows(s.workflows);
      setPricing(s.pricing);
      setPriceInReport(s.priceInReport);
      setStatus(s.status);
    }
  }, [current]);

  const derived = useMemo(() => computeDerived(workflows, fields), [workflows, fields]);
  const pr = useMemo(
    () => computePricing(derived.selected, derived.hoursTotal, pricing),
    [derived, pricing],
  );

  const setF = (k: keyof AuditFields, v: string) => setFields((f) => ({ ...f, [k]: v }));
  const setW = (wid: number, patch: Partial<Workflow>) =>
    setWorkflows((ws) => ws.map((w) => (w.id === wid ? { ...w, ...patch } : w)));
  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function newAudit() {
    setFields({ ...BLANK_FIELDS });
    setWorkflows([]);
    setPricing({ ...DEFAULT_PRICING });
    setPriceInReport(true);
    setStatus("draft");
    go(0);
    navigate("/admin/ai-audit");
    toast({ title: "Started a new audit" });
  }

  function loadExample() {
    setFields({ ...EXAMPLE_FIELDS });
    setWorkflows(exampleWorkflows());
    setPricing({ ...DEFAULT_PRICING });
    go(0);
    toast({ title: "Loaded worked example" });
  }

  async function saveAssessment() {
    setSaving(true);
    const payload = {
      business_name: fields.businessName || null,
      industry: fields.industry || null,
      contact: fields.contact || null,
      assessment_date: fields.date || null,
      team_size: fields.teamSize ? parseInt(fields.teamSize, 10) : null,
      consultant: fields.consultant || "ANAMECHI Marketing",
      goals: fields.goals || null,
      tools: fields.tools || null,
      constraints: fields.constraints || null,
      workflows,
      pricing,
      price_in_report: priceInReport,
      status,
    };
    try {
      if (id) {
        const { error } = await db.from("ai_business_audits").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const { data, error } = await db
          .from("ai_business_audits")
          .insert({ ...payload, created_by: userData?.user?.id ?? null })
          .select("id")
          .single();
        if (error) throw error;
        navigate(`/admin/ai-audit/${data.id}`);
      }
      queryClient.invalidateQueries({ queryKey: ["ai-business-audits"] });
      toast({ title: "Assessment saved" });
    } catch (e) {
      toast({
        title: "Could not save",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  function downloadPdf() {
    go(4);
    setTimeout(() => window.print(), 400);
  }

  async function extract() {
    const t = intakeText.trim();
    if (!t) {
      setIntakeMsg("Paste notes or upload a file first.");
      return;
    }
    setExtracting(true);
    setIntakeMsg("");
    try {
      const { data, error } = await supabase.functions.invoke("audit-extract", { body: { text: t } });
      if (error) throw error;
      if (!data || data.error) throw new Error(data?.error || "Could not read those notes.");
      // Only fill empty fields; never overwrite what was typed.
      let filled = 0;
      setFields((f) => {
        const next = { ...f };
        Object.entries(data.fields || {}).forEach(([k, v]) => {
          if (k in next && !String((next as any)[k]).trim() && v) {
            (next as any)[k] = String(v);
            filled++;
          }
        });
        return next;
      });
      const have = new Set(workflows.map((w) => w.name.toLowerCase()));
      const added = (data.workflows || [])
        .filter((w: any) => w.name && !have.has(String(w.name).toLowerCase()))
        .map((w: any) =>
          blankWorkflow({
            name: String(w.name),
            owner: w.owner ? String(w.owner) : "",
            freq: w.freq ? String(w.freq) : "",
            hours: Number(w.hours) || 0,
            impact: Math.min(5, Math.max(1, Number(w.impact) || 3)),
            effort: Math.min(5, Math.max(1, Number(w.effort) || 3)),
          }),
        );
      if (added.length) setWorkflows((ws) => [...ws, ...added]);
      setIntakeMsg(
        `Filled ${filled} empty field${filled === 1 ? "" : "s"} · added ${added.length} workflow${added.length === 1 ? "" : "s"}. Nothing you typed was overwritten.`,
      );
    } catch (e) {
      setIntakeMsg(e instanceof Error ? e.message : "Could not read those notes. Try a cleaner transcript.");
    } finally {
      setExtracting(false);
    }
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const h1 = fields.businessName ? `${fields.businessName} audit` : "Your next business audit";
  const readyLabel = derived.readiness === 0 ? "Ready to send" : `${derived.readiness} to confirm`;

  return (
    <div className="space-y-6">
      {/* Print rules: show only the client report, hide all admin chrome. */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #audit-report, #audit-report * { visibility: visible !important; }
          #audit-report { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 no-print">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-primary">
            AI Business Audit &middot; Prospect engagement
          </p>
          <h1 className="text-3xl font-bold text-foreground">{h1}</h1>
          <p className="text-muted-foreground">
            Assess the business, score AI opportunities, build the 30/60/90 roadmap, send the report.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={newAudit}>
            <Plus className="mr-1 h-4 w-4" /> New audit
          </Button>
          <Button variant="outline" onClick={loadExample}>
            <FlaskConical className="mr-1 h-4 w-4" /> Worked example
          </Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={saveAssessment} disabled={saving}>
            <Save className="mr-1 h-4 w-4" /> {saving ? "Saving..." : "Save assessment"}
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={downloadPdf}>
            <FileDown className="mr-1 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Saved audits */}
      {audits && audits.length > 0 && (
        <Card className="no-print">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Saved audits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {audits.map((a) => {
              const hrs = computeDerived((a.workflows || []).map((w) => blankWorkflow(w)), BLANK_FIELDS).hoursTotal;
              return (
                <button
                  key={a.id}
                  onClick={() => navigate(`/admin/ai-audit/${a.id}`)}
                  className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted ${a.id === id ? "ring-2 ring-primary" : ""}`}
                >
                  <span className="font-semibold text-foreground">{a.business_name || "Untitled audit"}</span>
                  <span className="flex items-center gap-3 text-muted-foreground">
                    <span>{a.assessment_date || new Date(a.created_at).toLocaleDateString()}</span>
                    <Badge variant="secondary">{a.status}</Badge>
                    <span className="text-primary font-semibold">{hrs} h/mo</span>
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid gap-3 no-print" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        <StatCard label="Workflows assessed" value={pad(workflows.length)} />
        <StatCard label="Hours reclaimed per month" value={`${derived.hoursTotal}`} accent />
        <StatCard label="Selected for roadmap" value={pad(derived.selected.length)} />
        <button
          onClick={() => go(derived.readiness === 0 ? 4 : derived.missingFields.length ? 0 : 1)}
          className="text-left"
        >
          <Card className={derived.readiness === 0 ? "border-accent" : ""}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Report readiness</p>
              <p className={`text-2xl font-bold ${derived.readiness === 0 ? "text-accent" : "text-foreground"}`}>
                {readyLabel}
              </p>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Tabs */}
      <Tabs value={String(step)} onValueChange={(v) => go(Number(v))}>
        <TabsList className="no-print flex flex-wrap h-auto">
          {STEP_LABELS.map((label, i) => (
            <TabsTrigger key={i} value={String(i)}>
              {pad(i + 1)} {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Step 1: Business assessment */}
        <TabsContent value="0" className="space-y-4">
          <Card style={{ background: "#2C21A2", color: "#fff" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Fill in from an interview</p>
                  <p className="text-sm text-white/80">
                    Paste a transcript and extract the business context into empty fields only.
                  </p>
                </div>
                <Button variant="secondary" onClick={() => setIntakeOpen((o) => !o)}>
                  {intakeOpen ? "Close" : "Paste or upload"}
                </Button>
              </div>
              {intakeOpen && (
                <div className="mt-4 space-y-3">
                  <Textarea
                    value={intakeText}
                    onChange={(e) => setIntakeText(e.target.value)}
                    rows={6}
                    placeholder="Paste the interview notes or transcript here."
                    className="text-foreground"
                  />
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt,.md,.vtt,.srt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const rd = new FileReader();
                      rd.onload = () => {
                        setIntakeText(String(rd.result));
                        setIntakeMsg(`Loaded ${file.name}`);
                      };
                      rd.readAsText(file);
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                      <Upload className="mr-1 h-4 w-4" /> Upload .txt / .md
                    </Button>
                    <Button
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => !extracting && extract()}
                      disabled={extracting}
                    >
                      <Sparkles className="mr-1 h-4 w-4" />
                      {extracting ? "Reading notes..." : "Extract into empty fields"}
                    </Button>
                  </div>
                  {intakeMsg && <p className="text-sm text-white/90">{intakeMsg}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <Card>
              <CardContent className="space-y-4 p-5">
                <div>
                  <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-primary">01 / Discovery</p>
                  <h2 className="text-xl font-bold text-foreground">Understand the business</h2>
                  <p className="text-sm text-muted-foreground">
                    Capture what the business owner tells you. Use specific examples wherever possible.
                  </p>
                </div>
                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                  {FIELD_DEFS.map(([key, label, type, placeholder]) => (
                    <div key={key} className="space-y-1">
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        type={type}
                        placeholder={placeholder}
                        value={fields[key]}
                        onChange={(e) => setF(key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                {NOTE_DEFS.map(([key, label, helper]) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={key}>{label}</Label>
                    <Textarea id={key} rows={3} value={fields[key]} onChange={(e) => setF(key, e.target.value)} />
                    <p className="text-xs text-muted-foreground">{helper}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardContent className="space-y-3 p-5">
                  <h3 className="text-lg font-bold" style={{ color: "#2C21A2" }}>Ask about the last time.</h3>
                  <p className="text-sm text-muted-foreground">
                    A concrete recent task is a better starting point than a general wish to use AI.
                  </p>
                  <ol className="space-y-2">
                    {DISCOVERY_QUESTIONS.map((q, i) => (
                      <li key={i} className="flex items-baseline gap-3 text-sm">
                        <span className="text-xs font-bold text-primary">{pad(i + 1)}</span>
                        {q}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
              <div className="rounded-2xl p-5 text-white" style={{ background: "#5BA858" }}>
                <p className="font-bold">Keep observations separate from evidence.</p>
                <p className="text-sm text-white/90">
                  "Maya says proposals take forever" is an observation. "Last proposal took 3h 20m" is evidence. Score on evidence.
                </p>
              </div>
            </div>
          </div>
          <StepNav step={step} go={go} />
        </TabsContent>

        {/* Step 2: Opportunity scorecard */}
        <TabsContent value="1" className="space-y-4">
          {workflows.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">No workflows yet.</CardContent>
            </Card>
          )}
          {derived.scored.map((d) => (
            <Card key={d.w.id} style={d.w.selected ? { border: "2px solid #00B3B0" } : undefined}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Input
                    value={d.w.name}
                    placeholder="Workflow name"
                    onChange={(e) => setW(d.w.id, { name: e.target.value })}
                    className="max-w-md font-semibold"
                  />
                  <div className="flex items-center gap-2">
                    <Badge style={{ background: d.tierBg, color: d.tierColor }}>{d.tier}</Badge>
                    <span className="text-sm font-semibold text-foreground">{d.score}/100</span>
                    <Button
                      size="sm"
                      variant={d.w.selected ? "default" : "outline"}
                      className={d.w.selected ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                      onClick={() => setW(d.w.id, { selected: !d.w.selected })}
                    >
                      {d.w.selected ? <><Check className="mr-1 h-4 w-4" /> On roadmap</> : "Add to roadmap"}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setWorkflows((ws) => ws.filter((w) => w.id !== d.w.id))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                  <div className="space-y-1">
                    <Label>Owner</Label>
                    <Input value={d.w.owner} onChange={(e) => setW(d.w.id, { owner: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Frequency</Label>
                    <Input value={d.w.freq} onChange={(e) => setW(d.w.id, { freq: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Hours per month</Label>
                    <Input
                      type="number"
                      value={d.w.hours}
                      onChange={(e) => setW(d.w.id, { hours: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-6">
                  <ScaleButtons label="Impact" value={d.w.impact} onChange={(n) => setW(d.w.id, { impact: n })} />
                  <ScaleButtons label="Effort to install" value={d.w.effort} onChange={(n) => setW(d.w.id, { effort: n })} />
                  <div>
                    <Label className="mb-1 block">Automatable</Label>
                    <div className="flex gap-1">
                      {[25, 50, 75].map((p) => (
                        <Button
                          key={p}
                          size="sm"
                          variant={d.w.pct === p ? "default" : "outline"}
                          className={d.w.pct === p ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                          onClick={() => setW(d.w.id, { pct: p as 25 | 50 | 75 })}
                        >
                          {p}%
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1 block">Reclaimed</Label>
                    <p className="text-lg font-bold text-primary">{d.reclaimed} h/mo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" onClick={() => setWorkflows((ws) => [...ws, blankWorkflow()])}>
            <Plus className="mr-1 h-4 w-4" /> Add workflow
          </Button>
          <StepNav step={step} go={go} />
        </TabsContent>

        {/* Step 3: Roadmap */}
        <TabsContent value="2" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {([0, 1, 2] as const).map((phase) => {
              const items = derived.selected
                .filter((d) => d.phase === phase)
                .sort((a, b) => b.score - a.score);
              const phaseHours = items.reduce((a, d) => a + d.reclaimed, 0);
              return (
                <Card key={phase}>
                  <CardHeader className="rounded-t-xl text-white" style={{ background: PHASE_COLORS[phase] }}>
                    <CardTitle className="text-base">{PHASE_LABELS[phase]}</CardTitle>
                    <p className="text-sm text-white/90">{PHASE_SUBTITLES[phase]}</p>
                    <p className="text-sm font-semibold">{phaseHours} h/mo</p>
                  </CardHeader>
                  <CardContent className="space-y-2 p-3">
                    {items.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Nothing here yet.</p>}
                    {items.map((d) => (
                      <div key={d.w.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-foreground">{d.w.name || "Untitled"}</span>
                          <Badge style={{ background: d.tierBg, color: d.tierColor }}>{d.tier}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {d.reclaimed} h/mo &middot; {d.w.owner || "Unassigned"}
                        </p>
                        <div className="mt-2 flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={phase === 0}
                            onClick={() => setW(d.w.id, { phase: (phase - 1) as 0 | 1 | 2 })}
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={phase === 2}
                            onClick={() => setW(d.w.id, { phase: (phase + 1) as 0 | 1 | 2 })}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <StepNav step={step} go={go} />
        </TabsContent>

        {/* Step 4: Pricing */}
        <TabsContent value="3" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="space-y-5 p-5">
                <SliderRow
                  label="Hours reclaimed per month"
                  value={pricing.hoursOverride ?? derived.hoursTotal}
                  min={0} max={200} step={1}
                  onChange={(v) => setPricing((p) => ({ ...p, hoursOverride: v }))}
                />
                {pricing.hoursOverride != null && (
                  <Button variant="link" className="h-auto p-0 text-primary" onClick={() => setPricing((p) => ({ ...p, hoursOverride: null }))}>
                    Reset hours to roadmap ({derived.hoursTotal} h)
                  </Button>
                )}
                <SliderRow label="Client's loaded hourly cost" value={pricing.clientRate} min={25} max={400} step={5} prefix="$"
                  onChange={(v) => setPricing((p) => ({ ...p, clientRate: v }))} />
                <SliderRow label="Value share on install" value={pricing.valueShare} min={5} max={50} step={1} suffix="%"
                  onChange={(v) => setPricing((p) => ({ ...p, valueShare: v }))} />
                <SliderRow label="Our delivery rate" value={pricing.ourRate} min={75} max={400} step={5} prefix="$"
                  onChange={(v) => setPricing((p) => ({ ...p, ourRate: v }))} />
                <SliderRow label="Build hours per effort point" value={pricing.hrsPerEffort} min={1} max={12} step={1}
                  onChange={(v) => setPricing((p) => ({ ...p, hrsPerEffort: v }))} />
                <SliderRow label="Retainer floor" value={pricing.minRetainer} min={500} max={10000} step={250} prefix="$"
                  onChange={(v) => setPricing((p) => ({ ...p, minRetainer: v }))} />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl p-4 text-white" style={{ background: "#2C21A2" }}>
                  <p className="text-sm text-white/80">Installation &middot; one-time</p>
                  <p className="text-3xl font-bold">{money(pr.install)}</p>
                  <p className="text-xs text-white/70">Higher of cost-plus and value-based, rounded to $250.</p>
                </div>
                <div className="rounded-xl p-4 text-white" style={{ background: "#00B3B0" }}>
                  <p className="text-sm text-white/80">Retainer &middot; monthly</p>
                  <p className="text-3xl font-bold">{money(pr.retainer)}</p>
                  <p className="text-xs text-white/70">Maintenance at {pricing.maintPct}% of build, floor {money(pricing.minRetainer)}.</p>
                </div>
              </div>

              <Card>
                <CardContent className="space-y-3 p-4">
                  <p className="text-sm font-semibold text-foreground">Install fee: two methods</p>
                  <Bar label="Cost-plus" value={pr.costPlus} max={Math.max(pr.costPlus, pr.valueBased, 1)} color="#2C21A2" />
                  <Bar label="Value-based" value={pr.valueBased} max={Math.max(pr.costPlus, pr.valueBased, 1)} color="#5BA858" />
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label="Time value / month" value={money(pr.monthlyValue)} />
                <MiniStat label="Year-one investment" value={money(pr.yearOneCost)} />
                <MiniStat
                  label="Year-one return"
                  value={pr.monthlyValue ? `${(pr.annualValue / Math.max(pr.yearOneCost, 1)).toFixed(1)}x` : "0x"}
                  color={pr.annualValue >= pr.yearOneCost ? "#5BA858" : "#c0392b"}
                />
                <MiniStat label="Install payback" value={pr.payback != null ? `${pr.payback.toFixed(1)} mo` : "n/a"} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="price-switch">Include investment in client report</Label>
                <Switch id="price-switch" checked={priceInReport} onCheckedChange={setPriceInReport} />
              </div>
            </div>
          </div>
          <StepNav step={step} go={go} />
        </TabsContent>

        {/* Step 5: Client report */}
        <TabsContent value="4">
          <div id="audit-report" className="mx-auto max-w-[880px]">
            <div className="rounded-t-xl p-8 text-white" style={{ background: "#2C21A2" }}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold tracking-wide">ANAMECHI MARKETING</span>
                <span>{fields.date ? new Date(fields.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""}</span>
              </div>
              <p className="mt-6 text-sm font-bold tracking-widest" style={{ color: "#7FE3E1" }}>AI BUSINESS AUDIT</p>
              <p className="text-[40px] font-bold leading-tight">{fields.businessName || "This business"}</p>
              <p className="text-sm text-white/80">
                {[fields.industry, fields.teamSize && `${fields.teamSize}-person team`, fields.contact && `Interviewed: ${fields.contact}`].filter(Boolean).join(" · ")}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-px bg-border">
              <ReportTile value={`${derived.hoursTotal}`} label="hours reclaimed per month" />
              <ReportTile value={`${derived.selected.length}`} label="systems on the roadmap" />
              <ReportTile value="90" label="days to full installation" />
            </div>

            <div className="space-y-6 rounded-b-xl border border-t-0 border-border bg-white p-8">
              <ReportSection title="Summary">
                <p className="leading-relaxed">
                  {reportSummary(fields.businessName, workflows.length, derived.selected, derived.hoursTotal)}
                </p>
              </ReportSection>

              <ReportSection title="What the business wants to improve">
                <p className="whitespace-pre-wrap leading-relaxed">{fields.goals || "—"}</p>
              </ReportSection>

              <ReportSection title="Prioritized opportunities">
                <ol className="space-y-2">
                  {[...derived.selected].sort((a, b) => b.score - a.score).map((d, i) => (
                    <li key={d.w.id} className="flex items-start justify-between gap-3 border-b border-border pb-2">
                      <span>
                        <span className="font-semibold text-foreground">{i + 1}. {d.w.name}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{d.tier} &middot; {PHASE_LABELS[d.phase]}</span>
                      </span>
                      <span className="whitespace-nowrap font-semibold text-primary">{d.reclaimed} h/mo</span>
                    </li>
                  ))}
                  {derived.selected.length === 0 && <li className="text-muted-foreground">No opportunities selected yet.</li>}
                </ol>
              </ReportSection>

              <ReportSection title="30/60/90 installation plan">
                <div className="grid gap-3 md:grid-cols-3">
                  {([0, 1, 2] as const).map((phase) => {
                    const items = derived.selected.filter((d) => d.phase === phase).sort((a, b) => b.score - a.score);
                    return (
                      <div key={phase}>
                        <p className="font-semibold" style={{ color: PHASE_COLORS[phase] }}>{PHASE_LABELS[phase]}</p>
                        <ul className="mt-1 space-y-1 text-sm">
                          {items.map((d) => <li key={d.w.id}>{d.w.name}</li>)}
                          {items.length === 0 && <li className="text-muted-foreground">—</li>}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </ReportSection>

              {priceInReport && (
                <ReportSection title="Investment">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <MiniStat label="Installation" value={money(pr.install)} />
                    <MiniStat label="Monthly retainer" value={money(pr.retainer)} />
                    <MiniStat label="Time value / month" value={money(pr.monthlyValue)} />
                    <MiniStat label="Payback" value={pr.payback != null ? `${pr.payback.toFixed(1)} mo` : "n/a"} />
                  </div>
                </ReportSection>
              )}

              <ReportSection title="Constraints we will build around">
                <p className="whitespace-pre-wrap leading-relaxed">{fields.constraints || "—"}</p>
              </ReportSection>

              <div className="rounded-xl p-6 text-white" style={{ background: "#00B3B0" }}>
                <p className="text-lg font-bold">We install the system. Then we run it.</p>
                <a
                  href="https://anamechimarketing.com/contact"
                  className="mt-3 inline-block rounded-lg bg-white px-4 py-2 font-semibold text-primary no-print"
                >
                  Apply for a fit call
                </a>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                &copy; 2026 WD Digital Enterprises, LLC &middot; ANAMECHI Marketing&trade; &middot; All Rights Reserved
              </p>
            </div>
          </div>
          <div className="no-print">
            <StepNav step={step} go={go} last />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function StepNav({ step, go, last }: { step: number; go: (n: number) => void; last?: boolean }) {
  return (
    <div className="flex justify-between no-print">
      <Button variant="outline" disabled={step === 0} onClick={() => go(step - 1)}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      {!last && (
        <Button onClick={() => go(step + 1)}>
          Continue <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function ScaleButtons({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`h-8 w-8 rounded-full border text-sm font-semibold ${
              value === n ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function SliderRow({
  label, value, min, max, step, onChange, prefix = "", suffix = "",
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; prefix?: string; suffix?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm font-semibold text-foreground">{prefix}{value}{suffix}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max(2, Math.round((value / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{money(value)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold" style={color ? { color } : undefined}>{value}</p>
    </div>
  );
}

function ReportTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white p-5 text-center">
      <p className="text-3xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-primary">{title}</h3>
      <div className="text-foreground">{children}</div>
    </section>
  );
}
