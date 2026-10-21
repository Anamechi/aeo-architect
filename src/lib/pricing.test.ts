import { describe, it, expect } from "vitest";
import {
  roundNice, computeTiers, valueCheck, pricingTips, pricingScript, getFactor, SERVICES,
} from "./pricing";

describe("roundNice bands", () => {
  it("rounds by size band", () => {
    expect(roundNice(5230)).toBe(5200);
    expect(roundNice(1234)).toBe(1250);
    expect(roundNice(300)).toBe(300);
    expect(roundNice(47)).toBe(45);
  });
});

describe("tier pricing", () => {
  it("prices the audit at the 1-5 clients default (factor 0.5) as 750 / 1500 / 3750", () => {
    const tiers = computeTiers("audit", getFactor("few"));
    expect(tiers.map((t) => t.price)).toEqual([750, 1500, 3750]);
    expect(tiers[0].unit).toBe("one-time");
  });

  it("scales the audit down for just starting (factor 0.25)", () => {
    const tiers = computeTiers("audit", getFactor("starting"));
    // r = 500 + 2000*0.25 = 1000 -> 500 / 1000 / 2500
    expect(tiers.map((t) => t.price)).toEqual([500, 1000, 2500]);
  });

  it("uses the coaching multipliers", () => {
    const tiers = computeTiers("coaching", getFactor("few"));
    // r = 600 -> 600 (session), 2160->2150 (package), 4080->4100 (package)
    expect(tiers.map((t) => t.price)).toEqual([600, 2150, 4100]);
    expect(tiers[0].unit).toBe("per session");
    expect(tiers[1].unit).toBe("package");
  });

  it("covers all seven services with three packages each", () => {
    expect(SERVICES).toHaveLength(8);
    SERVICES.forEach((s) => {
      const tiers = computeTiers(s.key, 0.5);
      expect(tiers).toHaveLength(3);
      expect(tiers[2].price).toBeGreaterThanOrEqual(tiers[1].price);
    });
  });
});

describe("value check", () => {
  const tiers = computeTiers("audit", getFactor("few")); // middle 1500
  const v = valueCheck(tiers, 10, 75, 8);

  it("computes savings, payback and effective rate", () => {
    expect(v.middlePrice).toBe(1500);
    expect(v.weeklySavings).toBe(750);
    expect(v.yearlySavings).toBe(39000);
    expect(v.weeksToPayback).toBe(2);
    expect(v.consultantHourly).toBe(187.5);
    expect(v.valueVsPrice).toBe(37500);
  });

  it("emits ROI and payback tips when the numbers are strong", () => {
    const tips = pricingTips(v);
    expect(tips.join(" ")).toContain("pays for itself");
    expect(tips.join(" ")).toContain("ROI");
  });

  it("shows the default tip when nothing is entered", () => {
    const tips = pricingTips(valueCheck(tiers, 0, 0, 0));
    expect(tips).toHaveLength(1);
    expect(tips[0]).toContain("Add the client");
  });
});

describe("brand voice of generated copy", () => {
  it("the pricing script has no em dashes and no contractions", () => {
    const tiers = computeTiers("audit", getFactor("few"));
    const script = pricingScript("AI Readiness Audit", tiers);
    expect(script).not.toMatch(/—/);
    expect(script).not.toMatch(/\b\w+'(s|t|re|ve|ll|d|m)\b/i);
  });
});

describe("storehouse pricing", () => {
  it("prices $3,400 / $6,800 / $17,000 at the 6+ clients level", () => {
    const t = computeTiers("storehouse", getFactor("many"));
    expect(t.map((x) => x.price)).toEqual([3400, 6800, 17000]);
  });
});
