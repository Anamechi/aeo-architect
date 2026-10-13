import { describe, it, expect } from "vitest";
import {
  scoreWorkflow,
  tierOf,
  reclaimed,
  blankWorkflow,
  exampleWorkflows,
  computeDerived,
  computePricing,
  EXAMPLE_FIELDS,
} from "./audit";

describe("scoring", () => {
  it("impact-first scores a high-impact low-effort workflow near the top", () => {
    // impact 5, effort 2 -> ease 4 -> (10 + 4 - 3)/12 = 0.9166 -> 92
    expect(scoreWorkflow({ impact: 5, effort: 2 }, "Impact-first")).toBe(92);
  });

  it("balanced model uses the even weighting", () => {
    // impact 5, effort 2 -> ease 4 -> (5 + 4 - 2)/8 = 0.875 -> 88
    expect(scoreWorkflow({ impact: 5, effort: 2 }, "Balanced")).toBe(88);
  });

  it("tiers a high score as a quick win in phase 0", () => {
    const t = tierOf(92, { effort: 2 });
    expect(t.tier).toBe("Quick win");
    expect(t.auto).toBe(0);
  });

  it("promotes a low-effort mid score to a quick win", () => {
    const t = tierOf(58, { effort: 2 });
    expect(t.tier).toBe("Quick win");
  });

  it("tiers a mid score as strategic in phase 1", () => {
    const t = tierOf(50, { effort: 4 });
    expect(t.tier).toBe("Strategic");
    expect(t.auto).toBe(1);
  });

  it("tiers a low score as later in phase 2", () => {
    const t = tierOf(30, { effort: 4 });
    expect(t.tier).toBe("Later");
    expect(t.auto).toBe(2);
  });

  it("reclaims hours by the automatable percentage, rounded", () => {
    expect(reclaimed({ hours: 18, pct: 75 })).toBe(14);
    expect(reclaimed({ hours: 12, pct: 50 })).toBe(6);
  });
});

describe("worked example: Northline Advisory", () => {
  const workflows = exampleWorkflows();
  const derived = computeDerived(workflows, EXAMPLE_FIELDS, "Impact-first");

  it("reclaims 44 hours per month across 5 selected workflows", () => {
    expect(derived.selected.length).toBe(5);
    expect(derived.hoursTotal).toBe(44);
  });

  it("reports zero readiness gaps for the completed example", () => {
    expect(derived.readiness).toBe(0);
  });

  it("prices the install at $10,250 and the retainer at $1,500", () => {
    const pricing = computePricing(derived.selected, derived.hoursTotal, {
      clientRate: 95,
      ourRate: 150,
      hrsPerEffort: 4,
      valueShare: 20,
      maintPct: 10,
      minRetainer: 1500,
      hoursOverride: null,
    });
    expect(pricing.install).toBe(10250);
    expect(pricing.retainer).toBe(1500);
    expect(pricing.payback).not.toBeNull();
    expect(pricing.payback!).toBeCloseTo(3.8, 1);
  });
});

describe("blankWorkflow", () => {
  it("assigns unique ids and sensible defaults", () => {
    const a = blankWorkflow();
    const b = blankWorkflow();
    expect(a.id).not.toBe(b.id);
    expect(a.impact).toBe(3);
    expect(a.selected).toBe(true);
    expect(a.phase).toBeNull();
  });
});
