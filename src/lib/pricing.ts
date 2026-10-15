// AI Consultant Pricing Calculator: pure data and math.
// Service data, experience factors, tier multipliers and the value check are a
// faithful copy of the source tool. User-facing wording follows the brand voice
// (no dashes used as punctuation, no contractions). Kept React-free for testing.

export interface Package {
  name: string;
  bullets: string[];
}

export interface Service {
  key: string;
  label: string;
  low: number;
  high: number;
  unit: string;
  isCoaching: boolean;
  packages: [Package, Package, Package];
}

export interface PricedPackage extends Package {
  price: number;
  unit: string;
}

export interface ExperienceLevel {
  id: string;
  label: string;
  factor: number;
}

export const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  { id: "starting", label: "Just starting", factor: 0.25 },
  { id: "few", label: "1–5 clients", factor: 0.5 },
  { id: "many", label: "6+ clients", factor: 0.8 },
];

export const DEFAULT_EXPERIENCE = "few";

export const SERVICES: Service[] = [
  {
    key: "audit",
    label: "AI Readiness Audit",
    low: 500,
    high: 2500,
    unit: "one-time",
    isCoaching: false,
    packages: [
      { name: "Quick Look Audit", bullets: ["1-hour review of current operations", "Top 3 AI opportunities identified", "Written summary with quick wins"] },
      { name: "Standard Audit", bullets: ["Half-day assessment of your workflows", "10+ AI opportunities ranked by impact", "30-day action plan you can act on", "1 stakeholder interview"] },
      { name: "Deep Dive Audit", bullets: ["Full-day on-site assessment", "End-to-end workflow mapping", "Data & risk review", "Prioritized 90-day roadmap", "Executive readout presentation"] },
    ],
  },
  {
    key: "workshop",
    label: "Beginner AI Workshop",
    low: 1500,
    high: 6000,
    unit: "per workshop",
    isCoaching: false,
    packages: [
      { name: "Express Workshop", bullets: ["2-hour live session", "Core AI tools walkthrough", "Hands-on starter exercise", "Cheatsheet of prompts"] },
      { name: "Half-Day Workshop", bullets: ["4-hour interactive session", "5 tools with live demos", "2 guided exercises", "Q&A and next-steps guide"] },
      { name: "Full-Day Workshop", bullets: ["Full-day immersive training", "10+ tools and workflows", "Team exercises with feedback", "Custom use-case building", "30-day follow-up support"] },
    ],
  },
  {
    key: "corporate",
    label: "Corporate Team Training",
    low: 3000,
    high: 12000,
    unit: "per program",
    isCoaching: false,
    packages: [
      { name: "Team Starter Program", bullets: ["1 team, up to 10 people", "2 group training sessions", "Shared AI playbook", "Email support for 2 weeks"] },
      { name: "Team Transformation", bullets: ["Up to 25 people across teams", "4 tailored training sessions", "Department-specific playbooks", "Progress check-ins", "30 days of support"] },
      { name: "Company-Wide Program", bullets: ["Unlimited participants", "8+ sessions across departments", "Train-the-trainer certification", "Adoption tracking dashboard", "90 days of priority support"] },
    ],
  },
  {
    key: "executive",
    label: "Executive AI Training",
    low: 1500,
    high: 5000,
    unit: "per package",
    isCoaching: false,
    packages: [
      { name: "Executive Briefing", bullets: ["1-hour strategic briefing", "AI landscape for your industry", "3 strategic recommendations", "Decision framework"] },
      { name: "Executive Intensive", bullets: ["Half-day private session", "Strategy & risk deep dive", "Custom AI roadmap", "Board-ready summary", "1 follow-up coaching call"] },
      { name: "Executive Partnership", bullets: ["Full-day strategy session", "Ongoing advisory (3 months)", "Monthly strategy reviews", "Priority access to research", "Team alignment workshop"] },
    ],
  },
  {
    key: "setup",
    label: "Done-for-You AI Setup",
    low: 2000,
    high: 8000,
    unit: "one-time",
    isCoaching: false,
    packages: [
      { name: "Starter Setup", bullets: ["1 AI tool configured", "Basic workflow automation", "Team training (1 hour)", "2 weeks of support"] },
      { name: "Standard Setup", bullets: ["Up to 3 AI tools configured", "2 automated workflows", "Integration with your tools", "Team training (2 hours)", "30 days of support"] },
      { name: "Complete AI System", bullets: ["Unlimited tools configured", "5+ custom workflows", "Full systems integration", "Documentation & training", "90 days of priority support"] },
    ],
  },
  {
    key: "advisor",
    label: "Monthly AI Advisor",
    low: 750,
    high: 4000,
    unit: "per month",
    isCoaching: false,
    packages: [
      { name: "On-Call Advisor", bullets: ["2 hours of advisory per month", "Email access for questions", "Monthly AI trend update", "Quarterly strategy review"] },
      { name: "Embedded Advisor", bullets: ["6 hours of advisory per month", "Priority email & call access", "Bi-weekly strategy sessions", "Custom AI recommendations", "Monthly trend briefing"] },
      { name: "Strategic AI Partner", bullets: ["12+ hours of advisory per month", "On-demand availability", "Weekly strategy sessions", "Implementation guidance", "Team training included", "Executive reporting"] },
    ],
  },
  {
    key: "coaching",
    label: "1:1 AI Coaching",
    low: 400,
    high: 800,
    unit: "per hour",
    isCoaching: true,
    packages: [
      { name: "Single Session", bullets: ["1-hour focused coaching", "Personalized AI guidance", "Action items to take away"] },
      { name: "4-Session Package", bullets: ["4 one-hour sessions", "Progress tracking between sessions", "Custom learning path", "Email support between sessions"] },
      { name: "8-Session Package", bullets: ["8 one-hour sessions", "Full coaching curriculum", "Weekly progress reviews", "Priority email support", "Final roadmap & certification"] },
    ],
  },
];

export function getService(key: string): Service | undefined {
  return SERVICES.find((s) => s.key === key);
}

export function getFactor(experienceId: string): number {
  return EXPERIENCE_LEVELS.find((e) => e.id === experienceId)?.factor ?? 0.5;
}

export function money(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

// Round to a tidy number by size band.
export function roundNice(e: number): number {
  if (e >= 5000) return Math.round(e / 100) * 100;
  if (e >= 1000) return Math.round(e / 50) * 50;
  if (e >= 250) return Math.round(e / 25) * 25;
  return Math.round(e / 5) * 5;
}

// Three priced packages for a service at a given experience factor.
export function computeTiers(serviceKey: string, factor: number): PricedPackage[] {
  const n = getService(serviceKey);
  if (!n) return [];
  const r = n.low + (n.high - n.low) * factor;
  if (n.isCoaching) {
    return [
      { ...n.packages[0], price: roundNice(r), unit: "per session" },
      { ...n.packages[1], price: roundNice(r * 4 * 0.9), unit: "package" },
      { ...n.packages[2], price: roundNice(r * 8 * 0.85), unit: "package" },
    ];
  }
  return [
    { ...n.packages[0], price: roundNice(r * 0.5), unit: n.unit },
    { ...n.packages[1], price: roundNice(r * 1), unit: n.unit },
    { ...n.packages[2], price: roundNice(r * 2.5), unit: n.unit },
  ];
}

export interface ValueCheck {
  middlePrice: number;
  weeklySavings: number;
  yearlySavings: number;
  weeksToPayback: number;
  consultantHourly: number;
  valueVsPrice: number;
}

export function valueCheck(
  packages: PricedPackage[],
  hoursSavedPerWeek: number,
  valuePerHour: number,
  deliveryHours: number,
): ValueCheck {
  const middlePrice = packages[1]?.price || 0;
  const weeklySavings = (hoursSavedPerWeek || 0) * (valuePerHour || 0);
  const yearlySavings = weeklySavings * 52;
  return {
    middlePrice,
    weeklySavings,
    yearlySavings,
    weeksToPayback: weeklySavings > 0 ? middlePrice / weeklySavings : 0,
    consultantHourly: deliveryHours > 0 ? middlePrice / deliveryHours : 0,
    valueVsPrice: yearlySavings - middlePrice,
  };
}

// Pricing tips. Same triggers as the source; wording in the brand voice.
export function pricingTips(v: ValueCheck): string[] {
  const tips: string[] = [];
  if (v.consultantHourly > 0 && v.consultantHourly < 75) {
    tips.push(
      `Your effective rate is ${money(v.consultantHourly)}/hr. That is below the suggested $75/hr floor. Consider raising your price or reducing your delivery hours.`,
    );
  }
  if (v.weeklySavings > 0 && v.weeksToPayback > 0 && v.weeksToPayback < 12) {
    tips.push(
      `The middle package pays for itself in about ${Math.round(v.weeksToPayback)} weeks. A strong selling point to lead with.`,
    );
  }
  if (v.valueVsPrice > 0) {
    tips.push(
      `The client saves ${money(v.yearlySavings)}/year against your ${money(v.middlePrice)} fee. Frame the proposal around ROI, not cost.`,
    );
  }
  if (tips.length === 0) {
    tips.push(
      "Add the client's weekly time savings and your delivery hours to see a full value check and tailored pricing tips.",
    );
  }
  return tips;
}

// Word-for-word script to present the three prices on a call. Brand voice.
export function pricingScript(serviceLabel: string, pkgs: PricedPackage[]): string {
  if (pkgs.length < 3) return "";
  const lower = (b: string[]) => b.slice(0, 3).map((x) => x.charAt(0).toLowerCase() + x.slice(1)).join(", ");
  const [a, b, c] = pkgs;
  return (
    "Here is how I would recommend we work together.\n\n" +
    `For ${serviceLabel}, I have put together three options so you can choose what fits best.\n\n` +
    `Option one is "${a.name}" at ${money(a.price)} ${a.unit}. This is the lightweight version. It covers ${lower(a.bullets)}. It is perfect if you want to test the waters without a big commitment.\n\n` +
    `Option two is "${b.name}" at ${money(b.price)} ${b.unit}. This is the one most of my clients go with. It covers ${lower(b.bullets)}. It gives you the full value without overbuilding.\n\n` +
    `Option three is "${c.name}" at ${money(c.price)} ${c.unit}. This is for teams who want the complete, done-for-you experience. It covers ${lower(c.bullets)}.\n\n` +
    "So which of these feels like the right fit for where you are right now?"
  );
}

export interface ProposalInput {
  consultantName: string;
  consultantBusiness: string;
  consultantEmail: string;
  consultantPhone: string;
  bio: string;
  clientName: string;
  clientBusiness: string;
  date: string;
  serviceLabel: string;
  packages: PricedPackage[];
  recommendedIndex: number;
  paymentTerms: string;
  startTimeline: string;
  deliveryTimeline: string;
}

// Plain-text proposal, matching the source export shape (brand voice).
export function proposalText(p: ProposalInput): string {
  let out = `${p.consultantName}. ${p.consultantBusiness}\n\n`;
  out += `Prepared for: ${p.clientName}${p.clientBusiness ? ", " + p.clientBusiness : ""}\nDate: ${p.date}\n\n`;
  if (p.bio.trim()) out += `${p.bio.trim()}\n\n`;
  const rec = p.packages[p.recommendedIndex];
  if (rec) {
    out += `Recommended: ${rec.name} at ${money(rec.price)} ${rec.unit}\n`;
    rec.bullets.forEach((bl) => (out += `  • ${bl}\n`));
    out += `\n`;
  }
  out += `Investment\n`;
  p.packages.forEach((t) => {
    out += `  ${t.name}. ${money(t.price)} / ${t.unit}\n`;
  });
  out += `\nPayment terms: ${p.paymentTerms}\nStart: ${p.startTimeline}\nDelivery: ${p.deliveryTimeline}\n\n`;
  out += `Signed,\n${p.consultantName}\n${p.consultantBusiness}`;
  return out;
}
