import { describe, expect, test } from "vitest";

import { resolveVolume } from "../../prescription/resolveVolume";

describe("resolveVolume", () => {
  test("resolves the documented minimum sets/reps for the reduced range context", () => {
    const result = resolveVolume({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "reduced",
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.volume.sets).toBe(2);
    expect(result.volume.reps?.value).toBe(3);
  });

  test("resolves the documented normal sets/reps for the normal range context", () => {
    const result = resolveVolume({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.volume.sets).toBe(3);
    expect(result.volume.reps?.value).toBe(5);
  });

  test("resolves the documented maximum sets/reps for the high range context", () => {
    const result = resolveVolume({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "high",
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.volume.sets).toBe(4);
    expect(result.volume.reps?.value).toBe(6);
  });

  test("resolves a duration-based structure for a different module/method/role", () => {
    const result = resolveVolume({
      moduleId: "core",
      methodId: "timed_isometric_sets",
      role: "robustness",
      rangeContext: "normal",
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.volume.structure).toBe("sets_duration");
    expect(result.volume.sets).toBe(3);
    expect(result.volume.duration?.value).toBe(20);
  });

  test("fails safely when no numerical profile exists for the module/method/role triple", () => {
    const result = resolveVolume({
      moduleId: "strength",
      methodId: "work_rest_intervals",
      role: "primary",
      rangeContext: "normal",
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail for an undocumented module/method/role triple.");
    }

    expect(result.failureCode).toBe("NUMERICAL_PROFILE_MISSING");
  });

  test("fails safely when laterality is required but not supplied", () => {
    const result = resolveVolume({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      lateralityRequired: true,
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when required laterality is missing.");
    }

    expect(result.failureCode).toBe("VOLUME_LATERALITY_REQUIRED");
  });

  test("succeeds when laterality is required and explicitly supplied", () => {
    const laterality = {
      laterality: "unilateral" as const,
      interpretation: "repetitions_per_side" as const,
      startingSide: null,
      sideSwitchRuleId: null,
    };

    const result = resolveVolume({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      lateralityRequired: true,
      laterality,
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.volume.laterality).toEqual(laterality);
  });

  test("determinism: identical input produces an identical result", () => {
    const input = {
      moduleId: "strength" as const,
      methodId: "straight_sets_repetitions" as const,
      role: "primary" as const,
      rangeContext: "normal" as const,
    };

    expect(resolveVolume(input)).toEqual(resolveVolume(input));
  });

  test("does not mutate its input", () => {
    const input = {
      moduleId: "strength" as const,
      methodId: "straight_sets_repetitions" as const,
      role: "primary" as const,
      rangeContext: "normal" as const,
      sourceRuleIds: ["25_PRESCRIPTION_RULES_TEST"],
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    resolveVolume(input);

    expect(input).toEqual(snapshot);
  });
});
