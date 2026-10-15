import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calculator, Copy, Check, Sparkles, Mic, Upload, RotateCcw, FileDown, Pencil,
} from "lucide-react";
import {
  SERVICES, EXPERIENCE_LEVELS, DEFAULT_EXPERIENCE, getService, getFactor,
  computeTiers, valueCheck, pricingTips, pricingScript, proposalText, money,
  type PricedPackage,
} from "@/lib/pricing";

const KEY = "anamechi-pricing-calc-v1";

interface SavedState {
  serviceKey: string;
  experience: string;
  hoursSaved: string;
  valuePerHour: string;
  deliveryHours: string;
  overrides: PricedPackage[] | null;
  recommendedIndex: number;
  about: {
    name: string; business: string; email: string; phone: string;
    logo: string; color1: string; color2: string; bio: string;
  };
  client: { name: string; business: string; email: string; phone: string; notes: string };
  engagement: { paymentTerms: string; startTimeline: string; deliveryTimeline: string };
}

const BLANK: SavedState = {
  serviceKey: "audit",
  experience: DEFAULT_EXPERIENCE,
  hoursSaved: "",
  valuePerHour: "",
  deliveryHours: "",
  overrides: null,
  recommendedIndex: 1,
  about: { name: "", business: "ANAMECHI Marketing", email: "", phone: "", logo: "", color1: "#2C21A2", color2: "#00B3B0", bio: "" },
  client: { name: "", business: "", email: "", phone: "", notes: "" },
  engagement: { paymentTerms: "50% upfront, 50% on delivery", startTimeline: "Within 2 weeks of signing", deliveryTimeline: "" },
};

export default function PricingCalculator() {
  const { toast } = useToast();
  const [s, setS] = useState<SavedState>(BLANK);
  const [editPackages, setEditPackages] = useState(false);
  const [copied, setCopied] = useState("");
  const [busy, setBusy] = useState("");
  const [proposalOpen, setProposalOpen] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  // Load and persist, matching the source tool's localStorage behavior.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch { /* first run */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota */ }
  }, [s]);

  const service = getService(s.serviceKey)!;
  const computed = useMemo(() => computeTiers(s.serviceKey, getFactor(s.experience)), [s.serviceKey, s.experience]);
  const packages = s.overrides ?? computed;
  const vc = useMemo(
    () => valueCheck(packages, Number(s.hoursSaved) || 0, Number(s.valuePerHour) || 0, Number(s.deliveryHours) || 0),
    [packages, s.hoursSaved, s.valuePerHour, s.deliveryHours],
  );
  const tips = useMemo(() => pricingTips(vc), [vc]);
  const script = useMemo(() => pricingScript(service.label, packages), [service.label, packages]);

  const set = (patch: Partial<SavedState>) => setS((p) => ({ ...p, ...patch }));
  const setAbout = (patch: Partial<SavedState["about"]>) => setS((p) => ({ ...p, about: { ...p.about, ...patch } }));
  const setClient = (patch: Partial<SavedState["client"]>) => setS((p) => ({ ...p, client: { ...p.client, ...patch } }));
  const setEng = (patch: Partial<SavedState["engagement"]>) => setS((p) => ({ ...p, engagement: { ...p.engagement, ...patch } }));

  // Changing service or experience discards manual package overrides.
  const chooseService = (key: string) => set({ serviceKey: key, overrides: null, recommendedIndex: 1 });
  const chooseExperience = (id: string) => set({ experience: id, overrides: null });

  function setPackage(i: number, patch: Partial<PricedPackage>) {
    const base = (s.overrides ?? computed).map((p) => ({ ...p }));
    base[i] = { ...base[i], ...patch };
    set({ overrides: base });
  }

  async function copyText(text: string, which: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  }

  async function cleanUp(kind: "bio" | "notes") {
    const text = kind === "bio" ? s.about.bio : s.client.notes;
    if (!text.trim()) {
      toast({ title: "Nothing to clean up yet" });
      return;
    }
    setBusy(kind);
    try {
      const { data, error } = await supabase.functions.invoke("proposal-assist", {
        body: { text, kind: kind === "bio" ? "bio" : "notes" },
      });
      if (error) throw error;
      if (!data || data.error) throw new Error(data?.error || "Could not clean that up.");
      if (kind === "bio") setAbout({ bio: data.text });
      else setClient({ notes: data.text });
      toast({ title: "Cleaned up" });
    } catch (e) {
      toast({ title: "Clean up failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setBusy("");
    }
  }

  function dictate(onText: (chunk: string) => void) {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      toast({ title: "Dictation is not supported in this browser", description: "Try Chrome." });
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const chunk = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
      onText(chunk);
    };
    rec.onerror = () => toast({ title: "Dictation stopped" });
    rec.start();
    toast({ title: "Listening..." });
  }

  function onLogo(file: File) {
    if (file.size > 1_500_000) {
      toast({ title: "Logo is too large", description: "Use an image under 1.5 MB.", variant: "destructive" });
      return;
    }
    const rd = new FileReader();
    rd.onload = () => setAbout({ logo: String(rd.result) });
    rd.readAsDataURL(file);
  }

  function resetAll() {
    setS(BLANK);
    setProposalOpen(false);
    toast({ title: "Reset everything" });
  }

  const rec = packages[s.recommendedIndex];
  const proposalPlain = proposalText({
    consultantName: s.about.name,
    consultantBusiness: s.about.business,
    consultantEmail: s.about.email,
    consultantPhone: s.about.phone,
    bio: s.about.bio,
    clientName: s.client.name,
    clientBusiness: s.client.business,
    date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    serviceLabel: service.label,
    packages,
    recommendedIndex: s.recommendedIndex,
    paymentTerms: s.engagement.paymentTerms,
    startTimeline: s.engagement.startTimeline,
    deliveryTimeline: s.engagement.deliveryTimeline,
  });

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #proposal-print, #proposal-print * { visibility: visible !important; }
          #proposal-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 no-print">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-primary">
            AI Consultant Pricing Calculator
          </p>
          <h1 className="text-3xl font-bold text-foreground">Price the engagement</h1>
          <p className="text-muted-foreground">
            Set the engagement, see three recommended packages and the value check, then build a proposal.
          </p>
        </div>
        <Button variant="outline" onClick={resetAll}>
          <RotateCcw className="mr-1 h-4 w-4" /> Reset everything
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* STEP 1 */}
        <Card className="no-print">
          <CardHeader>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Step 1</p>
            <CardTitle>Tell us about the engagement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label>1. Which service are you offering?</Label>
              <Select value={s.serviceKey} onValueChange={chooseService}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICES.map((sv) => <SelectItem key={sv.key} value={sv.key}>{sv.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>2. Your experience level</Label>
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_LEVELS.map((e) => (
                  <Button
                    key={e.id}
                    size="sm"
                    variant={s.experience === e.id ? "default" : "outline"}
                    className={s.experience === e.id ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                    onClick={() => chooseExperience(e.id)}
                  >
                    {e.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>3. Value to the client</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input type="number" placeholder="10" value={s.hoursSaved} onChange={(e) => set({ hoursSaved: e.target.value })} />
                  <p className="mt-1 text-xs text-muted-foreground">Hours AI saves / week</p>
                </div>
                <div>
                  <Input type="number" placeholder="75" value={s.valuePerHour} onChange={(e) => set({ valuePerHour: e.target.value })} />
                  <p className="mt-1 text-xs text-muted-foreground">Value of an hour ($)</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>4. Your hours to deliver the work</Label>
              <Input type="number" placeholder="8" value={s.deliveryHours} onChange={(e) => set({ deliveryHours: e.target.value })} />
              <p className="text-xs text-muted-foreground">
                Used to calculate what you earn per hour on the middle package.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* STEP 2 */}
        <Card className="no-print">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Step 2</p>
                <CardTitle>Your recommended packages</CardTitle>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditPackages((v) => !v)}>
                <Pencil className="mr-1 h-4 w-4" /> {editPackages ? "Done" : "Edit packages"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {service.label} &middot; {money(packages[1]?.price || 0)} {service.unit} base
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {packages.map((p, i) => (
              <div key={i} className={`rounded-xl border p-4 ${i === s.recommendedIndex ? "border-primary" : "border-border"}`}>
                <div className="flex items-center justify-between gap-2">
                  {editPackages ? (
                    <Input value={p.name} onChange={(e) => setPackage(i, { name: e.target.value })} className="max-w-[60%] font-semibold" />
                  ) : (
                    <span className="font-semibold text-foreground">{p.name}</span>
                  )}
                  {i === s.recommendedIndex && <Badge className="bg-primary text-primary-foreground">Most people pick this</Badge>}
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  {editPackages ? (
                    <Input type="number" value={p.price} onChange={(e) => setPackage(i, { price: Number(e.target.value) || 0 })} className="max-w-[140px] text-lg font-bold" />
                  ) : (
                    <span className="text-2xl font-bold text-foreground">{money(p.price)}</span>
                  )}
                  <span className="text-sm text-muted-foreground">/ {p.unit}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {p.bullets.map((b, bi) => (
                    <li key={bi} className="text-sm text-muted-foreground">&bull; {b}</li>
                  ))}
                </ul>
                {i !== s.recommendedIndex && (
                  <Button size="sm" variant="ghost" className="mt-2" onClick={() => set({ recommendedIndex: i })}>
                    Mark recommended
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* VALUE CHECK */}
      <Card className="no-print">
        <CardHeader><CardTitle className="text-base">Value check</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <ValueTile value={vc.yearlySavings ? money(vc.yearlySavings) : "$0"} label="Client's yearly time savings" sub="hours/week x $/hour x 52" />
          <ValueTile value={vc.weeksToPayback ? `${Math.round(vc.weeksToPayback)} wks` : "—"} label="Weeks to pay for itself" sub="middle package / weekly savings" />
          <ValueTile value={vc.consultantHourly ? `${money(vc.consultantHourly)}/hr` : "—"} label="You earn per hour" sub="middle package / your hours" />
          <ValueTile value={money(vc.valueVsPrice)} label="Value vs. price" sub="yearly savings - middle price" accent={vc.valueVsPrice >= 0} />
        </CardContent>
      </Card>

      {/* TIPS + SCRIPT */}
      <div className="grid gap-6 lg:grid-cols-2 no-print">
        <Card>
          <CardHeader><CardTitle className="text-base">Pricing tip</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {tips.map((t, i) => <p key={i} className="text-sm text-foreground">{t}</p>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Pricing script</CardTitle>
            <Button size="sm" variant="outline" onClick={() => copyText(script, "script")}>
              {copied === "script" ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
              {copied === "script" ? "Copied" : "Copy"}
            </Button>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{script}</p>
          </CardContent>
        </Card>
      </div>

      {/* STEP 3: PROPOSAL */}
      <Card className="no-print">
        <CardHeader>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Step 3</p>
          <CardTitle>Build a proposal</CardTitle>
          <p className="text-sm text-muted-foreground">
            Fill in the details, clean up your notes, and generate a polished proposal.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">About you</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Your name" value={s.about.name} onChange={(v) => setAbout({ name: v })} />
              <Field label="Your business" value={s.about.business} onChange={(v) => setAbout({ business: v })} />
              <Field label="Email" value={s.about.email} onChange={(v) => setAbout({ email: v })} />
              <Field label="Phone" value={s.about.phone} onChange={(v) => setAbout({ phone: v })} />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <Label className="mb-1 block">Logo</Label>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])} />
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => logoRef.current?.click()}>
                    <Upload className="mr-1 h-4 w-4" /> Upload
                  </Button>
                  {s.about.logo && <img src={s.about.logo} alt="Logo" className="h-8 w-auto rounded" />}
                </div>
              </div>
              <ColorField label="Brand color 1" value={s.about.color1} onChange={(v) => setAbout({ color1: v })} />
              <ColorField label="Brand color 2" value={s.about.color2} onChange={(v) => setAbout({ color2: v })} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Short bio</Label>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" disabled={busy === "bio"} onClick={() => cleanUp("bio")}>
                    <Sparkles className="mr-1 h-4 w-4" /> {busy === "bio" ? "Cleaning..." : "Clean up with AI"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => dictate((c) => setAbout({ bio: (s.about.bio ? s.about.bio + " " : "") + c }))}>
                    <Mic className="mr-1 h-4 w-4" /> Dictate
                  </Button>
                </div>
              </div>
              <Textarea rows={3} value={s.about.bio} onChange={(e) => setAbout({ bio: e.target.value })} />
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">About the client</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Client name" value={s.client.name} onChange={(v) => setClient({ name: v })} />
              <Field label="Client business" value={s.client.business} onChange={(v) => setClient({ business: v })} />
              <Field label="Client email" value={s.client.email} onChange={(v) => setClient({ email: v })} />
              <Field label="Client phone" value={s.client.phone} onChange={(v) => setClient({ phone: v })} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Call notes</Label>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" disabled={busy === "notes"} onClick={() => cleanUp("notes")}>
                    <Sparkles className="mr-1 h-4 w-4" /> {busy === "notes" ? "Cleaning..." : "Clean up my notes with AI"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => dictate((c) => setClient({ notes: (s.client.notes ? s.client.notes + " " : "") + c }))}>
                    <Mic className="mr-1 h-4 w-4" /> Dictate
                  </Button>
                </div>
              </div>
              <Textarea rows={3} value={s.client.notes} onChange={(e) => setClient({ notes: e.target.value })} />
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Engagement details</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Recommended package</Label>
                <Select value={String(s.recommendedIndex)} onValueChange={(v) => set({ recommendedIndex: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {packages.map((p, i) => <SelectItem key={i} value={String(i)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Payment terms" value={s.engagement.paymentTerms} onChange={(v) => setEng({ paymentTerms: v })} />
              <Field label="Start timeline" value={s.engagement.startTimeline} onChange={(v) => setEng({ startTimeline: v })} />
              <Field label="Delivery timeline" value={s.engagement.deliveryTimeline} onChange={(v) => setEng({ deliveryTimeline: v })} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setProposalOpen(true)}>
                Generate proposal
              </Button>
              {proposalOpen && (
                <>
                  <Button variant="outline" onClick={() => copyText(proposalPlain, "proposal")}>
                    {copied === "proposal" ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                    {copied === "proposal" ? "Copied" : "Copy proposal"}
                  </Button>
                  <Button variant="outline" onClick={() => setTimeout(() => window.print(), 200)}>
                    <FileDown className="mr-1 h-4 w-4" /> Download PDF
                  </Button>
                </>
              )}
            </div>
          </section>
        </CardContent>
      </Card>

      {/* PROPOSAL PREVIEW (printable) */}
      {proposalOpen && (
        <div id="proposal-print" className="mx-auto max-w-[840px]">
          <div className="rounded-t-xl p-8 text-white" style={{ background: s.about.color1 }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                {s.about.logo && <img src={s.about.logo} alt="Logo" className="mb-3 h-10 w-auto" />}
                <p className="text-xl font-bold">{s.about.business || "Your business"}</p>
                <p className="text-sm text-white/80">{[s.about.name, s.about.email, s.about.phone].filter(Boolean).join(" · ")}</p>
              </div>
              <p className="text-sm" style={{ color: s.about.color2 }}>
                {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
          <div className="space-y-5 rounded-b-xl border border-t-0 border-border bg-white p-8">
            <div>
              <p className="text-sm text-muted-foreground">Prepared for</p>
              <p className="text-lg font-bold text-foreground">
                {s.client.name || "Client"}{s.client.business ? `, ${s.client.business}` : ""}
              </p>
            </div>
            {s.about.bio.trim() && <p className="leading-relaxed text-foreground">{s.about.bio}</p>}
            {s.client.notes.trim() && (
              <section>
                <h3 className="mb-1 text-sm font-bold uppercase tracking-wide" style={{ color: s.about.color1 }}>Summary of your needs</h3>
                <p className="whitespace-pre-wrap leading-relaxed text-foreground">{s.client.notes}</p>
              </section>
            )}
            <section>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide" style={{ color: s.about.color1 }}>Recommended approach</h3>
              {rec && (
                <div className="rounded-lg border p-4" style={{ borderColor: s.about.color2 }}>
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-foreground">{rec.name}</span>
                    <span className="font-bold text-foreground">{money(rec.price)} <span className="text-xs font-normal text-muted-foreground">/ {rec.unit}</span></span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {rec.bullets.map((b, i) => <li key={i} className="text-sm text-muted-foreground">&bull; {b}</li>)}
                  </ul>
                </div>
              )}
            </section>
            <section>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide" style={{ color: s.about.color1 }}>Investment</h3>
              <table className="w-full text-sm">
                <tbody>
                  {packages.map((p, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="py-2 font-medium text-foreground">{p.name}{i === s.recommendedIndex ? " (recommended)" : ""}</td>
                      <td className="py-2 text-right text-foreground">{money(p.price)} / {p.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-sm text-muted-foreground">
                Payment terms: {s.engagement.paymentTerms || "—"}<br />
                Start: {s.engagement.startTimeline || "—"}<br />
                Delivery: {s.engagement.deliveryTimeline || "—"}
              </p>
            </section>
            <p className="pt-2 text-sm text-foreground">Signed,<br />{s.about.name}<br />{s.about.business}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ValueTile({ value, label, sub, accent }: { value: string; label: string; sub: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className={`text-2xl font-bold ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-14 cursor-pointer rounded border border-border bg-transparent" />
    </div>
  );
}
