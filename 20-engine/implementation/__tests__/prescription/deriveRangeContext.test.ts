/**
 * Combat Athlete System — Readiness → Range Context Derivation Tests
 *
 * The dose of every numerical range in a session now comes from this
 * derivation, so most of what matters here is the boundary behavior and the
 * two rules that are counter-intuitive on purpose:
 *
 * - high readiness never increases anything in V0.1, because
 *   `35_PRESCRIPTION_ADJUSTMENT_RULES.md` allows the high boundary "only
 *   when a documented progression rule is active" and none exists;
 * - rest moves OPPOSITE to volume and intensity, because the same chapter's
 *   Readiness Adjustment Table gives reduced readiness "normal or upper"
 *   rest and low readiness the "upper valid boundary".
 */

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import {
  RANGE_CONTEXT_BY_READINESS_LEVEL,
  READINESS_LEVEL_BOUNDARIES,
  REST_RANGE_CONTEXT_BY_READINESS_LEVEL,
  deriveRangeContext,
  type ReadinessLevel,
} from "../../prescription/deriveRangeContext";
import { isValidSourceRuleId } from "../../prescription/sourceRuleIdentifiers";
import type { Rating5, ReadinessState } from "../../types";

const readSource = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf-8");

/** All-3s is the engine's own neutral day (see `makeReadiness` in `../fixtures`). */
function makeReadiness(overrides: Partial<ReadinessState> = {}): ReadinessState {
  return {
    energy: 3,
    motivation: 3,
    sleepQuality: 3,
    stress: 3,
    soreness: 3,
    perceivedRecovery: 3,
    ...overrides,
  };
}

/** Sets the five aggregated fields so the aggregate is exactly `rating`. */
function makeUniformReadiness(rating: Rating5): ReadinessState {
  return makeReadiness({
    energy: rating,
    sleepQuality: rating,
    perceivedRecovery: rating,
    soreness: (6 - rating) as Rating5,
    stress: (6 - rating) as Rating5,
  });
}

const ALL_LEVELS: readonly ReadinessLevel[] = ["high", "normal", "reduced", "low"];

describe("deriveRangeContext — aggregation", () => {
  test("averages exactly the five documented fields, with soreness and stress inverted", () => {
    const decision = deriveRangeContext(
      makeReadiness({ energy: 5, sleepQuality: 4, perceivedRecovery: 3, soreness: 2, stress: 1 }),
    );

    expect(decision.contributions.map((contribution) => contribution.field)).toEqual([
      "energy",
      "perceivedRecovery",
      "sleepQuality",
      "soreness",
      "stress",
    ]);
    // soreness 2 -> 4, stress 1 -> 5; mean(5, 3, 4, 4, 5) = 4.2
    expect(decision.aggregate).toBe(4.2);
    expect(decision.contributions.filter((contribution) => contribution.inverted).map((c) => c.field)).toEqual([
      "soreness",
      "stress",
    ]);
  });

  test("motivation, coordination and readinessScore never affect the result", () => {
    const base = deriveRangeContext(makeReadiness());

    for (const noise of [
      makeReadiness({ motivation: 5 }),
      makeReadiness({ motivation: 1 }),
      makeReadiness({ coordination: 5 }),
      makeReadiness({ readinessScore: 100 }),
      makeReadiness({ readinessScore: 0 }),
      makeReadiness({ sleepHours: 12 }),
    ]) {
      const decision = deriveRangeContext(noise);
      expect(decision.aggregate).toBe(base.aggregate);
      expect(decision.level).toBe(base.level);
      expect(decision.rangeContext).toBe(base.rangeContext);
      expect(decision.restRangeContext).toBe(base.restRangeContext);
    }
  });

  test("the aggregation stays identical to the scoring engine's readiness average", () => {
    // Numeric parity: the same five fields, the same inversion, the same mean.
    const readiness = makeReadiness({ energy: 4, sleepQuality: 2, perceivedRecovery: 5, soreness: 1, stress: 4 });
    const scoringEngineAverage =
      [readiness.energy, readiness.perceivedRecovery, readiness.sleepQuality, 6 - readiness.soreness, 6 - readiness.stress].reduce(
        (total, value) => total + value,
        0,
      ) / 5;

    expect(deriveRangeContext(readiness).aggregate).toBeCloseTo(scoringEngineAverage, 5);

    // Structural parity: if `scoringEngine.ts` ever changes which fields it
    // averages or its inversion base, this fails rather than letting the two
    // layers silently disagree about the same athlete.
    const scoringEngine = readSource("../../scoringEngine.ts");
    expect(scoringEngine).toContain("const INVERTED_RATING_BASE = 6;");
    for (const field of ["readiness.energy", "readiness.perceivedRecovery", "readiness.sleepQuality"]) {
      expect(scoringEngine).toContain(field);
    }
    expect(scoringEngine).toContain("invertRating(readiness.soreness)");
    expect(scoringEngine).toContain("invertRating(readiness.stress)");
  });
});

describe("deriveRangeContext — level boundaries", () => {
  test.each([
    [5, "high"],
    [4, "high"],
    [3, "normal"],
    [2, "reduced"],
    [1, "low"],
  ] as const)("a uniform readiness of %s is level %s", (rating, expectedLevel) => {
    expect(deriveRangeContext(makeUniformReadiness(rating)).level).toBe(expectedLevel);
  });

  test("each boundary is inclusive at its own value and exclusive just below", () => {
    // 4.0 -> high, 3.8 -> normal
    expect(deriveRangeContext(makeUniformReadiness(4)).level).toBe("high");
    expect(deriveRangeContext(makeReadiness({ energy: 4, sleepQuality: 4, perceivedRecovery: 3, soreness: 2, stress: 2 })).aggregate).toBe(3.8);
    expect(deriveRangeContext(makeReadiness({ energy: 4, sleepQuality: 4, perceivedRecovery: 3, soreness: 2, stress: 2 })).level).toBe("normal");

    // 3.0 -> normal, 2.8 -> reduced
    expect(deriveRangeContext(makeUniformReadiness(3)).level).toBe("normal");
    expect(deriveRangeContext(makeReadiness({ energy: 2, sleepQuality: 3, perceivedRecovery: 3, soreness: 3, stress: 3 })).aggregate).toBe(2.8);
    expect(deriveRangeContext(makeReadiness({ energy: 2, sleepQuality: 3, perceivedRecovery: 3, soreness: 3, stress: 3 })).level).toBe("reduced");

    // 2.0 -> reduced, 1.8 -> low
    expect(deriveRangeContext(makeUniformReadiness(2)).level).toBe("reduced");
    expect(deriveRangeContext(makeReadiness({ energy: 1, sleepQuality: 2, perceivedRecovery: 2, soreness: 4, stress: 5 })).aggregate).toBe(1.6);
    expect(deriveRangeContext(makeReadiness({ energy: 1, sleepQuality: 2, perceivedRecovery: 2, soreness: 4, stress: 5 })).level).toBe("low");
  });

  test("the boundaries are ordered and end with an unconditional fallback", () => {
    const minimums = READINESS_LEVEL_BOUNDARIES.map((boundary) => boundary.minimumAggregate);
    expect(minimums).toEqual([...minimums].sort((a, b) => b - a));
    expect(minimums[minimums.length - 1]).toBe(Number.NEGATIVE_INFINITY);
  });
});

describe("deriveRangeContext — the documented mappings", () => {
  test("high readiness never increases the dose in engine version 0.1", () => {
    const decision = deriveRangeContext(makeUniformReadiness(5));

    expect(decision.level).toBe("high");
    expect(decision.rangeContext).toBe("normal");
    expect(decision.reasons.join(" ")).toContain("does not authorize progression");
  });

  test('no readiness whatsoever produces the "high" range context', () => {
    for (const rating of [1, 2, 3, 4, 5] as const) {
      expect(deriveRangeContext(makeUniformReadiness(rating)).rangeContext).not.toBe("high");
    }
    expect(Object.values(RANGE_CONTEXT_BY_READINESS_LEVEL)).not.toContain("high");
  });

  test("reduced and low readiness both take the lower boundary for volume and intensity", () => {
    expect(deriveRangeContext(makeUniformReadiness(2)).rangeContext).toBe("reduced");
    expect(deriveRangeContext(makeUniformReadiness(1)).rangeContext).toBe("reduced");
  });

  test("rest is never shortened by falling readiness — it holds, then lengthens", () => {
    expect(deriveRangeContext(makeUniformReadiness(5)).restRangeContext).toBe("normal");
    expect(deriveRangeContext(makeUniformReadiness(3)).restRangeContext).toBe("normal");
    // Reduced: "normal or upper boundary", never the lower one.
    expect(deriveRangeContext(makeUniformReadiness(2)).restRangeContext).toBe("normal");
    // Low: "upper valid boundary".
    expect(deriveRangeContext(makeUniformReadiness(1)).restRangeContext).toBe("high");

    // The property that matters, stated directly: rest context is never
    // "reduced" for any readiness at all.
    for (const rating of [1, 2, 3, 4, 5] as const) {
      expect(deriveRangeContext(makeUniformReadiness(rating)).restRangeContext).not.toBe("reduced");
    }
  });

  test("both mapping tables cover every level exactly", () => {
    expect(Object.keys(RANGE_CONTEXT_BY_READINESS_LEVEL).sort()).toEqual([...ALL_LEVELS].sort());
    expect(Object.keys(REST_RANGE_CONTEXT_BY_READINESS_LEVEL).sort()).toEqual([...ALL_LEVELS].sort());
  });

  test("blocked is not part of the produced vocabulary", () => {
    for (const rating of [1, 2, 3, 4, 5] as const) {
      expect(ALL_LEVELS).toContain(deriveRangeContext(makeUniformReadiness(rating)).level);
    }
    expect(ALL_LEVELS).not.toContain("blocked" as ReadinessLevel);
  });
});

describe("deriveRangeContext — explainability, determinism and purity", () => {
  test("every decision carries reasons naming the aggregate, the level and both contexts", () => {
    const decision = deriveRangeContext(makeUniformReadiness(1));

    expect(decision.reasons[0]).toContain("Readiness aggregate 1.00/5");
    expect(decision.reasons[0]).toContain("soreness=5 (inverted to 1)");
    expect(decision.reasons[1]).toContain('Readiness level "low"');
    expect(decision.reasons[2]).toContain('Range context "reduced"');
    expect(decision.reasons[3]).toContain('Rest range context "high"');
  });

  test("source rule ids are present and conform to the engine-document convention", () => {
    const decision = deriveRangeContext(makeReadiness());

    expect(decision.sourceRuleIds).toContain("35_PRESCRIPTION_ADJUSTMENT_RULES_V0_1");
    expect(decision.sourceRuleIds.length).toBeGreaterThan(0);
    for (const sourceRuleId of decision.sourceRuleIds) {
      expect(isValidSourceRuleId(sourceRuleId)).toBe(true);
    }
  });

  test("two calls with the same readiness are deeply equal", () => {
    const readiness = makeReadiness({ energy: 2, soreness: 4 });
    expect(deriveRangeContext(readiness)).toEqual(deriveRangeContext(readiness));
  });

  test("the readiness object is never mutated", () => {
    const readiness = makeReadiness({ energy: 2, soreness: 4 });
    const before = JSON.stringify(readiness);
    deriveRangeContext(readiness);
    expect(JSON.stringify(readiness)).toBe(before);
  });

  test("the aggregate is rounded to two decimals for stable reporting", () => {
    // mean(1, 3, 3, 3, 3) = 2.6 exactly; mean(1, 2, 3, 3, 3) = 2.4
    expect(deriveRangeContext(makeReadiness({ energy: 1 })).aggregate).toBe(2.6);
    expect(Number.isFinite(deriveRangeContext(makeReadiness({ energy: 1, perceivedRecovery: 2 })).aggregate)).toBe(true);
  });
});
