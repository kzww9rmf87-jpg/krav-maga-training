/**
 * Combat Athlete System — resolveIntensity, INTENSITY_NOT_DOCUMENTED
 *
 * Isolated in its own file so `vi.mock("../../prescription/prescriptionKnowledge", ...)`
 * never affects `resolveIntensity.test.ts` or any other suite — Vitest gives
 * every test file its own module registry by default, and this file never
 * touches `NUMERICAL_PRESCRIPTION_PROFILES` itself: `resolveNumericalProfile`
 * is the only export replaced, and only within this file.
 *
 * The mocked profile below is built here, once, purely to exercise the
 * `profile.intensity.length === 0` branch that already exists in
 * `resolveIntensity.ts`. It is never added to `NUMERICAL_PRESCRIPTION_PROFILES`,
 * never touches the Registry, and defines no RPE or intensity value —
 * `intensity: []` is the exact condition under test, not a value.
 */

import { describe, expect, test, vi } from "vitest";

vi.mock("../../prescription/prescriptionKnowledge", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../prescription/prescriptionKnowledge")>();
  return {
    ...actual,
    resolveNumericalProfile: () => ({
      ok: true as const,
      profile: UNDOCUMENTED_INTENSITY_PROFILE,
      resolutionSource: "module_method_role_unique" as const,
    }),
  };
});

const UNDOCUMENTED_INTENSITY_PROFILE = {
  profileId: "test_mocked_profile_with_no_intensity_v0_1",
  version: "0.1" as const,
  moduleId: "strength" as const,
  methodId: "straight_sets_repetitions" as const,
  exerciseRole: "primary" as const,
  volume: {
    structure: "sets_reps" as const,
    sets: { min: 2, normal: 3, max: 4 },
    repetitions: { type: "fixed_range" as const, range: { min: 3, normal: 5, max: 6 } },
    duration: null,
    distance: null,
    rounds: null,
    workIntervals: null,
  },
  // Deliberately empty — the exact condition under test. No RPE, no
  // percentage, no intensity value of any kind is defined anywhere here.
  intensity: [],
  rest: {
    scope: "between_sets" as const,
    seconds: { min: 180, normal: 180, max: 300 },
    sourceRuleIds: ["TEST_MOCK_SOURCE"],
  },
  tempo: null,
  minimumDose: { sets: 2, repetitions: 3, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
  maximumDose: { sets: 4, repetitions: 6, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
  requiresExerciseSpecificLoadRule: false,
  requiresSportSpecificSubtype: false,
  sourceRuleIds: ["TEST_MOCK_SOURCE"],
};

// Imported after the mock declaration (Vitest hoists `vi.mock` above all
// imports automatically) so `resolveIntensity`'s own internal import of
// `getNumericalPrescriptionProfile` resolves to the mocked implementation.
const { resolveIntensity } = await import("../../prescription/resolveIntensity");

describe("resolveIntensity — INTENSITY_NOT_DOCUMENTED (mocked profile)", () => {
  test("fails with INTENSITY_NOT_DOCUMENTED when the resolved profile has no intensity rule", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["rpe", "rir", "percentage_1rm"],
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected resolution to fail when the profile documents no intensity rule.");
    }

    expect(result.failureCode).toBe("INTENSITY_NOT_DOCUMENTED");
  });

  test("the failure result carries no intensity field and reports the empty profile's own id", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["rpe"],
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when the profile documents no intensity rule.");
    }

    // The failure branch of IntensityResolutionResult has no `intensity`
    // property at all — nothing is produced, not even a null placeholder.
    expect("intensity" in result).toBe(false);
    expect(result.profileId).toBe("test_mocked_profile_with_no_intensity_v0_1");
    expect(result.rejectedRuleTypes).toEqual([]);
  });

  test("the failure message explicitly names the missing documented intensity rule", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["rpe"],
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when the profile documents no intensity rule.");
    }

    expect(result.message).toContain("test_mocked_profile_with_no_intensity_v0_1");
    expect(result.message.toLowerCase()).toContain("no documented intensity rule");
  });

  test("sourceRuleIds trace back to the (mocked) profile's own source, no invented citation", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["rpe"],
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when the profile documents no intensity rule.");
    }

    expect(result.sourceRuleIds).toContain("TEST_MOCK_SOURCE");
  });

  test("no implicit default intensity type or value is ever produced", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["rpe", "rir", "percentage_1rm", "absolute_load"],
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail regardless of how many intensity types the exercise supports.");
    }

    expect(result.failureCode).toBe("INTENSITY_NOT_DOCUMENTED");
  });

  test("determinism: identical input produces an identical result", () => {
    const input = {
      moduleId: "strength" as const,
      methodId: "straight_sets_repetitions" as const,
      role: "primary" as const,
      rangeContext: "normal" as const,
      supportedIntensityTypes: ["rpe"] as const,
    };

    expect(resolveIntensity(input)).toEqual(resolveIntensity(input));
  });

  test("does not mutate its input", () => {
    const input = {
      moduleId: "strength" as const,
      methodId: "straight_sets_repetitions" as const,
      role: "primary" as const,
      rangeContext: "normal" as const,
      supportedIntensityTypes: ["rpe"] as const,
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    resolveIntensity(input);

    expect(input).toEqual(snapshot);
  });

  test("does not mutate the mocked profile", () => {
    const snapshot = JSON.parse(JSON.stringify(UNDOCUMENTED_INTENSITY_PROFILE));

    resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["rpe"],
    });

    expect(UNDOCUMENTED_INTENSITY_PROFILE).toEqual(snapshot);
  });
});
