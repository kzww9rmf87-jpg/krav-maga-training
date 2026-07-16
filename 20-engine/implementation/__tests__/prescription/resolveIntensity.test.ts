import { describe, expect, test } from "vitest";

import { resolveIntensity } from "../../prescription/resolveIntensity";
import { makeOneRepMaxReference } from "./fixtures";

describe("resolveIntensity", () => {
  test("resolves the documented normal %1RM against a validated one-rep-max reference", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
      athleteReferences: [makeOneRepMaxReference({ value: 100 })],
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.selectedRuleType).toBe("percentage_1rm");
    expect(result.intensity.primaryMetric.target).toEqual({ type: "fixed", value: 85 });
    expect(result.intensity.calculation?.rawResult).toBe(85);
    expect(result.intensity.calculation?.roundedResult).toBeNull();
  });

  test("rounds the calculated load to the nearest documented equipment increment", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
      athleteReferences: [makeOneRepMaxReference({ value: 97 })],
      loadRounding: { incrementKg: 2.5, mode: "nearest", ruleId: "27_REST_TEMPO_RULES_TEST" },
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.intensity.calculation?.rawResult).toBeCloseTo(82.45, 5);
    expect(result.intensity.calculation?.roundedResult).toBe(82.5);
  });

  test("falls through to the next documented rule when the exercise does not support the first one", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["rpe"],
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.selectedRuleType).toBe("rpe");
    expect(result.intensity.primaryMetric.target).toEqual({ type: "fixed", value: 8 });
    expect(result.rejectedRuleTypes).toContain("percentage_1rm");
  });

  test("fails safely when the only supported rule requires a missing athlete reference", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["percentage_1rm"],
      athleteReferences: [],
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when the required athlete reference is missing.");
    }

    expect(result.failureCode).toBe("INTENSITY_REFERENCE_MISSING");
  });

  test("fails safely when the exercise supports none of the documented intensity types", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["absolute_load"],
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when no documented intensity type is supported.");
    }

    expect(result.failureCode).toBe("INTENSITY_TYPE_UNSUPPORTED");
  });

  test("fails safely when no numerical profile exists for the module/method/role triple", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "work_rest_intervals",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["percentage_1rm"],
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail for an undocumented module/method/role triple.");
    }

    expect(result.failureCode).toBe("NUMERICAL_PROFILE_MISSING");
  });

  test("resolves via a non-load intensity type when the profile requires an exercise-specific load rule", () => {
    const result = resolveIntensity({
      moduleId: "power",
      methodId: "power_repetition_sets",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["movement_intent", "percentage_1rm"],
      athleteReferences: [makeOneRepMaxReference({ value: 100 })],
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.selectedRuleType).toBe("movement_intent");
    expect(result.intensity.primaryMetric.target).toEqual({ type: "category", value: "maximal_acceleration" });
  });

  test("fails safely when the exercise-specific load rule is required but only a load-based type is supported", () => {
    const result = resolveIntensity({
      moduleId: "power",
      methodId: "power_repetition_sets",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["percentage_1rm"],
      athleteReferences: [makeOneRepMaxReference({ value: 100 })],
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when only a load-based intensity type is supported.");
    }

    expect(result.failureCode).toBe("INTENSITY_EXERCISE_SPECIFIC_RULE_REQUIRED");
  });

  test("determinism: identical input produces an identical result", () => {
    const input = {
      moduleId: "strength" as const,
      methodId: "straight_sets_repetitions" as const,
      role: "primary" as const,
      rangeContext: "normal" as const,
      supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"] as const,
      athleteReferences: [makeOneRepMaxReference({ value: 100 })],
    };

    expect(resolveIntensity(input)).toEqual(resolveIntensity(input));
  });

  test("does not mutate its input", () => {
    const input = {
      moduleId: "strength" as const,
      methodId: "straight_sets_repetitions" as const,
      role: "primary" as const,
      rangeContext: "normal" as const,
      supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"] as const,
      athleteReferences: [makeOneRepMaxReference({ value: 100 })],
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    resolveIntensity(input);

    expect(input).toEqual(snapshot);
  });
});
