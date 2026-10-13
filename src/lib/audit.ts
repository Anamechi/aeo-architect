// AI Business Audit: pure calculation and data helpers.
// Kept free of React and Supabase so the scoring, tiers, phases and pricing
// can be unit tested in isolation. See audit.test.ts for the worked example.

export type ScoringModel = "Impact-first" | "Balanced";

export interface Workflow {
  id: number;
  name: string;
  owner: string;
  freq: string;
  hours: number;
  impact: number; // 1-5
  effort: number; // 1-5
  pct: 25 | 50 | 75;
  selected: boolean;
  phase: 0 | 1 | 2 | null; // null means use the automatic phase
}

export interface AuditFields {
  businessName: string;
  industry: string;
  contact: string;
  date: string;
  teamSize: string;
  consultant: string;
  goals: string;
  tools: string;
  constraints: string;
}

export interface Pricing {
  clientRate: number;
  ourRate: number;
  hrsPerEffort: number;
  valueShare: number; // percent
  maintPct: number; // percent, fixed default 10
  minRetainer: number;
  hoursOverride: number | null;
}

export type Tier = "Quick win" | "Strategic" | "Later";

export interface TierStyle {
  tier: Tier;
  tierBg: string;
  tierColor: string;
  auto: 0 | 1 | 2;
}

export interface DerivedWorkflow {
  w: Workflow;
  score: number;
  tier: Tier;
  tierBg: string;
  tierColor: string;
  phase: 0 | 1 | 2;
  reclaimed: number;
}

export interface PricingResult {
  hrs: number;
  monthlyValue: number;
  annualValue: number;
  buildHours: number;
  costPlus: number;
  valueBased: number;
  install: number;
  maintCost: number;
  retainer: number;
  yearOneCost: number;
  payback: number | null;
}

export const BLANK_FIELDS: AuditFields = {
  businessName: "",
  industry: "",
  contact: "",
  date: "",
  teamSize: "",
  consultant: "ANAMECHI Marketing",
  goals: "",
  tools: "",
  constraints: "",
};

export const DEFAULT_PRICING: Pricing = {
  clientRate: 95,
  ourRate: 150,
  hrsPerEffort: 4,
  valueShare: 20,
  maintPct: 10,
  minRetainer: 1500,
  hoursOverride: null,
};

export const PHASE_LABELS: Record<0 | 1 | 2, string> = {
  0: "First 30 days",
  1: "Days 31–60",
  2: "Days 61–90",
};

export const PHASE_SUBTITLES: Record<0 | 1 | 2, string> = {
  0: "Quick wins: install and prove",
  1: "Connect the pipeline",
  2: "Scale, monitor, maintain",
};

export const PHASE_COLORS: Record<0 | 1 | 2, string> = {
  0: "#00B3B0",
  1: "#2C21A2",
  2: "#5BA858",
};

// Discovery field definitions: key, label, type, placeholder.
export const FIELD_DEFS: Array<[keyof AuditFields, string, string, string]> = [
  ["businessName", "Business name", "text", "e.g. Northline Advisory"],
  ["industry", "Industry", "text", "e.g. Professional services"],
  ["contact", "Interview contact & role", "text", "Name, title"],
  ["date", "Assessment date", "date", ""],
  ["teamSize", "Team size", "number", "People"],
  ["consultant", "Prepared by", "text", "ANAMECHI Marketing"],
];

// Textarea definitions: key, label, helper.
export const NOTE_DEFS: Array<[keyof AuditFields, string, string]> = [
  ["goals", "What does the business want to improve?", "Outcomes in their words. Be specific."],
  ["tools", "Current tools & working process", "Stack, who touches what, where things break."],
  ["constraints", "Constraints, permissions & approvals", "Data rules, sign-offs, budget limits."],
];

export const DISCOVERY_QUESTIONS: string[] = [
  "What task keeps coming back?",
  "Who does it, and how often?",
  "Can you show an actual example?",
  "How long does review and rework take?",
  'What would "running without you" look like?',
];

let uid = 1;

export function blankWorkflow(partial: Partial<Workflow> = {}): Workflow {
  return {
    id: uid++,
    name: "",
    owner: "",
    freq: "",
    hours: 0,
    impact: 3,
    effort: 3,
    pct: 50,
    selected: true,
    phase: null,
    ...partial,
  };
}

// Worked example: Northline Advisory. Exercised by the unit tests.
export const EXAMPLE_FIELDS: AuditFields = {
  businessName: "Northline Advisory",
  industry: "HR & people-ops consulting",
  contact: "Maya Okafor, Managing Partner",
  date: "2026-10-08",
  teamSize: "9",
  consultant: "ANAMECHI Marketing",
  goals:
    "Stop losing two to three days a week to proposals and client reporting. Respond to new leads the same day. Publish consistently without Maya writing every post.",
  tools:
    "HubSpot (free CRM), Google Workspace, Zoom, Canva, QuickBooks. Proposals are copied from an old Word doc and edited by hand. Monthly reporting is assembled in Sheets.",
  constraints:
    "Client data stays inside Google Workspace. Maya approves every proposal and anything published under her name. No new tools over $150/mo without partner sign-off.",
};

export const EXAMPLE_WORKFLOWS: Array<Partial<Workflow>> = [
  { name: "Proposal drafting after discovery calls", owner: "Maya", freq: "6× / month", hours: 18, impact: 5, effort: 2, pct: 75, selected: true },
  { name: "New-client intake & welcome sequence", owner: "Ops lead", freq: "3× / month", hours: 10, impact: 4, effort: 2, pct: 75, selected: true },
  { name: "Meeting notes → CRM follow-up", owner: "Consultants", freq: "Daily", hours: 12, impact: 3, effort: 1, pct: 75, selected: true },
  { name: "LinkedIn posts from client conversations", owner: "Maya", freq: "Weekly", hours: 12, impact: 4, effort: 3, pct: 50, selected: true },
  { name: "Monthly client reporting", owner: "Ops lead", freq: "Monthly", hours: 14, impact: 4, effort: 4, pct: 50, selected: true, phase: 2 },
  { name: "Invoice reminders", owner: "Ops lead", freq: "Weekly", hours: 3, impact: 2, effort: 1, pct: 75, selected: false },
];

export function exampleWorkflows(): Workflow[] {
  return EXAMPLE_WORKFLOWS.map((w) => blankWorkflow(w));
}

export function money(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

// Score 0-100. ease = 6 - effort.
export function scoreWorkflow(w: Pick<Workflow, "impact" | "effort">, model: ScoringModel = "Impact-first"): number {
  const ease = 6 - w.effort;
  if (model === "Balanced") return Math.round(((w.impact + ease - 2) / 8) * 100);
  return Math.round(((w.impact * 2 + ease - 3) / 12) * 100);
}

export function tierOf(score: number, w: Pick<Workflow, "effort">): TierStyle {
  if (score >= 70 || (w.effort <= 2 && score >= 55)) {
    return { tier: "Quick win", tierBg: "#DDF5F4", tierColor: "#00706E", auto: 0 };
  }
  if (score >= 45) {
    return { tier: "Strategic", tierBg: "#E4E2FA", tierColor: "#2C21A2", auto: 1 };
  }
  return { tier: "Later", tierBg: "#EEF0F5", tierColor: "#4A4F6A", auto: 2 };
}

export function reclaimed(w: Pick<Workflow, "hours" | "pct">): number {
  return Math.round((w.hours * w.pct) / 100);
}

export function deriveWorkflow(w: Workflow, model: ScoringModel = "Impact-first"): DerivedWorkflow {
  const score = scoreWorkflow(w, model);
  const t = tierOf(score, w);
  return {
    w,
    score,
    tier: t.tier,
    tierBg: t.tierBg,
    tierColor: t.tierColor,
    phase: (w.phase ?? t.auto) as 0 | 1 | 2,
    reclaimed: reclaimed(w),
  };
}

export interface DerivedSummary {
  scored: DerivedWorkflow[];
  selected: DerivedWorkflow[];
  hoursTotal: number;
  missingFields: Array<keyof AuditFields>;
  readiness: number; // count still to confirm
}

export function computeDerived(
  workflows: Workflow[],
  fields: AuditFields,
  model: ScoringModel = "Impact-first",
): DerivedSummary {
  const scored = workflows.map((w) => deriveWorkflow(w, model));
  const selected = scored.filter((x) => x.w.selected);
  const hoursTotal = selected.reduce((a, x) => a + x.reclaimed, 0);
  const missingFields = (Object.keys(BLANK_FIELDS) as Array<keyof AuditFields>).filter(
    (k) => !String(fields[k]).trim(),
  );
  const readiness = missingFields.length + (selected.length ? 0 : 1);
  return { scored, selected, hoursTotal, missingFields, readiness };
}

export function computePricing(selected: DerivedWorkflow[], hoursTotal: number, p: Pricing): PricingResult {
  const hrs = p.hoursOverride ?? hoursTotal;
  const monthlyValue = hrs * p.clientRate;
  const annualValue = monthlyValue * 12;
  const buildHours = selected.reduce((a, x) => a + (x.w.effort * p.hrsPerEffort + 4), 0);
  const costPlus = buildHours * p.ourRate;
  const valueBased = (annualValue * p.valueShare) / 100;
  const install = Math.ceil(Math.max(costPlus, valueBased) / 250) * 250;
  const maintCost = buildHours * (p.maintPct / 100) * p.ourRate;
  const retainer = Math.ceil(Math.max(p.minRetainer, maintCost) / 50) * 50;
  const yearOneCost = install + retainer * 12;
  const payback = monthlyValue - retainer > 0 ? install / (monthlyValue - retainer) : null;
  return { hrs, monthlyValue, annualValue, buildHours, costPlus, valueBased, install, maintCost, retainer, yearOneCost, payback };
}

export function reportSummary(
  businessName: string,
  totalWorkflows: number,
  selected: DerivedWorkflow[],
  hoursTotal: number,
): string {
  const biz = businessName.trim() || "this business";
  if (!selected.length) return "Select workflows on the scorecard to build the summary.";
  const ranked = [...selected].sort((a, b) => b.score - a.score);
  const top = ranked[0];
  const topLine = top
    ? ` The highest-priority install is "${top.w.name}," scheduled for ${PHASE_LABELS[top.phase].toLowerCase()}.`
    : "";
  return `We assessed ${totalWorkflows} recurring workflows at ${biz}. ${selected.length} are selected for installation, giving back an estimated ${hoursTotal} hours per month once the system is running.${topLine}`;
}
