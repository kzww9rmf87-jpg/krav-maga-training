/**
 * Combat Athlete System — resolveRest, exerciseRestConstraints validation
 * against profiles with no (or no-envelope) rest documentation.
 *
 * No real profile in `prescriptionKnowledge.ts` currently documents
 * `rest: null`, and none documents a real (non-`not_applicable`) scope with
 * `seconds: null` — both are structurally legal shapes of
 * `NumericalRestRule | null` that the validation logic must still reject an
 * `exerciseRestConstraints` declaration against. Isolated in its own file
 * so `vi.mock` never affects `resolveRest.test.ts` or any other suite —
 * Vitest gives every test file its own module registry by default. Neither
 * mocked profile is ever added to `NUMERICAL_PRESCRIPTION_PROFILES`.
 */

import { describe, expect, test, vi } from "vitest";

vi.mock("../../prescription/prescriptionKnowledge", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../prescription/prescriptionKnowledge")>();
  return {
    ...actual,
    resolveNumericalProfile: (query: {
      moduleId: string;
      methodId: string;
      exerciseRole: string;
      explicitProfileId?: string | null;
    }) => {
      if (query.methodId === "straight_sets_repetitions" && query.exerciseRole === "primary") {
        return {
          ok: true as const,
          profile: REST_NULL_PROFILE,
          resolutionSource: "module_method_role_unique" as const,
        };
      }
      if (query.methodId === "straight_sets_repetitions" && query.exerciseRole === "secondary") {
        return {
          ok: true as const,
          profile: REST_NO_ENVELOPE_PROFILE,
          resolutionSource: "module_method_role_unique" as const,
        };
      }
      return actual.resolveNumericalProfile(query as never);
    },
  };
});

const sharedVolume = {
  structure: "sets_reps" as const,
  sets: { min: 2, normal: 3, max: 4 },
  repetitions: { type: "fixed_range" as const, range: { min: 3, normal: 5, max: 6 } },
  duration: null,
  distance: null,
  rounds: null,
  workIntervals: null,
};

const sharedIntensity = [
  {
    type: "rpe" as const,
    min: 7,
    normal: 8,
    max: 9,
    unit: "rpe_scale_1_10" as const,
    referenceType: null,
    sourceRuleIds: ["TEST_MOCK_SOURCE"],
  },
];

// Deliberately `rest: null` — the exact condition under test.
const REST_NULL_PROFILE = {
  profileId: "test_mocked_profile_with_null_rest_v0_1",
  version: "0.1" as const,
  moduleId: "strength" as const,
  methodId: "straight_sets_repetitions" as const,
  exerciseRole: "primary" as const,
  volume: sharedVolume,
  intensity: sharedIntensity,
  rest: null,
  tempo: null,
  minimumDose: { sets: 2, repetitions: 3, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
  maximumDose: { sets: 4, repetitions: 6, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
  requiresExerciseSpecificLoadRule: false,
  requiresSportSpecificSubtype: false,
  sourceRuleIds: ["TEST_MOCK_SOURCE"],
};

// A real, documented scope ("between_sets") with `seconds: null` — the
// profile requires rest but has never documented a duration for it.
const REST_NO_ENVELOPE_PROFILE = {
  profileId: "test_mocked_profile_with_no_rest_envelope_v0_1",
  version: "0.1" as const,
  moduleId: "strength" as const,
  methodId: "straight_sets_repetitions" as const,
  exerciseRole: "secondary" as const,
  volume: sharedVolume,
  intensity: sharedIntensity,
  rest: {
    scope: "between_sets" as const,
    seconds: null,
    sourceRuleIds: ["TEST_MOCK_SOURCE"],
  },
  tempo: null,
  minimumDose: { sets: 2, repetitions: 3, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
  maximumDose: { sets: 4, repetitions: 6, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
  requiresExerciseSpecificLoadRule: false,
  requiresSportSpecificSubtype: false,
  sourceRuleIds: ["TEST_MOCK_SOURCE"],
};

const { resolveRest } = await import("../../prescription/resolveRest");

describe("resolveRest — exerciseRestConstraints against a profile with no rest rule (mocked)", () => {
  test("fails with EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID when a constraint is declared but the profile documents no rest rule at all", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      exerciseRestConstraints: {
        scope: "between_sets",
        minimumSeconds: null,
        maximumSeconds: null,
        sourceRuleIds: ["TEST_EXERCISE_REST_RULE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when the profile documents no rest rule at all.");
    }

    expect(result.failureCode).toBe("EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID");
  });
});

describe("resolveRest — exerciseRestConstraints against a profile with a scope but no seconds envelope (mocked)", () => {
  test("fails with EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID when a numeric bound is declared but the profile's own seconds envelope is null", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "secondary",
      rangeContext: "normal",
      exerciseRestConstraints: {
        scope: "between_sets",
        minimumSeconds: 60,
        maximumSeconds: 120,
        sourceRuleIds: ["TEST_EXERCISE_REST_RULE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when a numeric bound targets a profile with no seconds envelope.");
    }

    expect(result.failureCode).toBe("EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID");
  });

  test("a scope-only constraint (no numeric bounds) is still valid against a profile with no seconds envelope, and still fails downstream on REST_REQUIRED_BUT_UNDOCUMENTED", () => {
    // The constraint itself does not fabricate an envelope, so validation
    // passes; the resolver then fails for the same reason it always did —
    // the profile itself never documented a duration.
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "secondary",
      rangeContext: "normal",
      exerciseRestConstraints: {
        scope: "between_sets",
        minimumSeconds: null,
        maximumSeconds: null,
        sourceRuleIds: ["TEST_EXERCISE_REST_RULE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail — the profile documents no rest duration.");
    }

    expect(result.failureCode).toBe("REST_REQUIRED_BUT_UNDOCUMENTED");
  });
});
