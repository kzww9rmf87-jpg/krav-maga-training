import { describe, expect, test } from "vitest";

import { resolveTempo } from "../../prescription/resolveTempo";

describe("resolveTempo", () => {
  test("resolves the documented phase-intent tempo for strength primary work", () => {
    const result = resolveTempo({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedTempoTypes: ["phase_intent"],
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.tempo?.type).toBe("phase_intent");
    expect(result.tempo?.globalIntent).toBe("maximal_safe_speed");
  });

  test("resolves the documented isometric-hold tempo without requiring a global intent value", () => {
    const result = resolveTempo({
      moduleId: "core",
      methodId: "timed_isometric_sets",
      role: "robustness",
      rangeContext: "normal",
      supportedTempoTypes: ["isometric_hold"],
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.tempo?.type).toBe("isometric_hold");
    expect(result.tempo?.globalIntent).toBeNull();
  });

  test("resolves a null tempo when the method documents no tempo policy", () => {
    const result = resolveTempo({
      moduleId: "conditioning",
      methodId: "continuous_aerobic_duration",
      role: "conditioning",
      rangeContext: "normal",
      supportedTempoTypes: [],
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.tempo).toBeNull();
  });

  test("fails safely when the exercise does not support the documented tempo type", () => {
    const result = resolveTempo({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedTempoTypes: ["isometric_hold"],
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when the exercise does not support the documented tempo type.");
    }

    expect(result.failureCode).toBe("TEMPO_TYPE_UNSUPPORTED_BY_EXERCISE");
  });

  test("fails safely when no numerical profile exists for the module/method/role triple", () => {
    const result = resolveTempo({
      moduleId: "strength",
      methodId: "work_rest_intervals",
      role: "primary",
      rangeContext: "normal",
      supportedTempoTypes: [],
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail for an undocumented module/method/role triple.");
    }

    expect(result.failureCode).toBe("NUMERICAL_PROFILE_MISSING");
  });

  // Regression: the "distance_carry_sets" method contract (contracts.ts) declares
  // tempoPolicy "forbidden" with an empty allowedTempoTypes list, but the only
  // documented numerical profile for grip/distance_carry_sets/primary
  // (distance_carry_strength_grip_v0_1 in prescriptionKnowledge.ts) currently
  // carries a non-null tempo rule. This contradiction must not exist: a method
  // that forbids tempo must never have a numerical profile documenting one.
  test("grip distance-carry work never documents a tempo, matching the method's forbidden tempo policy", () => {
    const result = resolveTempo({
      moduleId: "grip",
      methodId: "distance_carry_sets",
      role: "primary",
      rangeContext: "normal",
      supportedTempoTypes: [],
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed with a null tempo, got failure: ${result.message}`);
    }

    expect(result.tempo).toBeNull();
  });

  test("determinism: identical input produces an identical result", () => {
    const input = {
      moduleId: "strength" as const,
      methodId: "straight_sets_repetitions" as const,
      role: "primary" as const,
      rangeContext: "normal" as const,
      supportedTempoTypes: ["phase_intent"] as const,
    };

    expect(resolveTempo(input)).toEqual(resolveTempo(input));
  });

  test("does not mutate its input", () => {
    const input = {
      moduleId: "strength" as const,
      methodId: "straight_sets_repetitions" as const,
      role: "primary" as const,
      rangeContext: "normal" as const,
      supportedTempoTypes: ["phase_intent"] as const,
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    resolveTempo(input);

    expect(input).toEqual(snapshot);
  });
});
