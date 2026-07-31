/**
 * Combat Athlete System — resolveRest, final resolved-value guard.
 *
 * No real `NumericalPrescriptionProfile` in `prescriptionKnowledge.ts`
 * documents a negative or non-integer rest-seconds bound (confirmed by
 * direct inspection of all 12 profiles), so the resolver's own final
 * guard (`!Number.isInteger(seconds) || seconds < 0` in `resolveRest.ts`)
 * cannot be exercised against negative/non-integer values through real
 * production data alone. This file mocks `resolveNumericalProfile`
 * with two deliberately malformed local profiles — never added to the
 * real `NUMERICAL_PRESCRIPTION_PROFILES` array — purely to reach this
 * defensive guard directly. Isolated in its own file so `vi.mock` never
 * affects `resolveRest.test.ts` or any other suite — Vitest gives every
 * test file its own module registry by default (the same isolation
 * precedent already established by
 * `resolveRestExerciseConstraintOnUndocumentedProfile.test.ts`).
 *
 * This is a distinct concern from the fixed defect itself: the fix
 * confirms 0 is now ACCEPTED (see resolveRest.test.ts's own
 * "controlled_mobility_sets_v0_1's documented zero-rest floor" block).
 * This file confirms negative and non-integer values remain REJECTED —
 * the guard narrowed from "reject <= 0" to "reject < 0", it was not
 * removed.
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
          profile: NEGATIVE_REST_PROFILE,
          resolutionSource: "module_method_role_unique" as const,
        };
      }
      if (query.methodId === "straight_sets_repetitions" && query.exerciseRole === "secondary") {
        return {
          ok: true as const,
          profile: NON_INTEGER_REST_PROFILE,
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

// Deliberately negative minimum — never a real, documented value anywhere
// in prescriptionKnowledge.ts. Exercises the guard's own negative branch.
const NEGATIVE_REST_PROFILE = {
  profileId: "test_mocked_profile_with_negative_rest_v0_1",
  version: "0.1" as const,
  moduleId: "strength" as const,
  methodId: "straight_sets_repetitions" as const,
  exerciseRole: "primary" as const,
  volume: sharedVolume,
  intensity: sharedIntensity,
  rest: {
    scope: "between_sets" as const,
    seconds: { min: -5, normal: 10, max: 20 },
    sourceRuleIds: ["TEST_MOCK_SOURCE"],
  },
  tempo: null,
  minimumDose: { sets: 2, repetitions: 3, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
  maximumDose: { sets: 4, repetitions: 6, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
  requiresExerciseSpecificLoadRule: false,
  requiresSportSpecificSubtype: false,
  sourceRuleIds: ["TEST_MOCK_SOURCE"],
};

// Deliberately non-integer minimum/normal/max — never a real, documented
// value anywhere in prescriptionKnowledge.ts. Exercises the guard's own
// non-integer branch.
const NON_INTEGER_REST_PROFILE = {
  profileId: "test_mocked_profile_with_non_integer_rest_v0_1",
  version: "0.1" as const,
  moduleId: "strength" as const,
  methodId: "straight_sets_repetitions" as const,
  exerciseRole: "secondary" as const,
  volume: sharedVolume,
  intensity: sharedIntensity,
  rest: {
    scope: "between_sets" as const,
    seconds: { min: 10.5, normal: 15.5, max: 20.5 },
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

describe("resolveRest — final value guard rejects a negative resolved rest duration (mocked)", () => {
  test("rangeContext \"reduced\" (selects min = -5) fails with REST_VALUE_INVALID", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "reduced",
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail on a negative resolved rest duration.");
    }

    expect(result.failureCode).toBe("REST_VALUE_INVALID");
    expect(result.message).toContain("-5");
  });

  test("rangeContext \"normal\" and \"high\" (positive values) still succeed on the same negative-floor profile", () => {
    const normal = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
    });
    if (!normal.ok) {
      throw new Error(`Expected "normal" to succeed, got: ${normal.message}`);
    }
    const betweenSets = normal.rest?.betweenSets;
    if (betweenSets?.type !== "fixed") {
      throw new Error("Expected a fixed rest target.");
    }
    expect(betweenSets.duration.value).toBe(10);

    const high = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "high",
    });
    if (!high.ok) {
      throw new Error(`Expected "high" to succeed, got: ${high.message}`);
    }
  });
});

describe("resolveRest — final value guard rejects a non-integer resolved rest duration (mocked)", () => {
  test("rangeContext \"reduced\" (selects min = 10.5) fails with REST_VALUE_INVALID", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "secondary",
      rangeContext: "reduced",
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail on a non-integer resolved rest duration.");
    }

    expect(result.failureCode).toBe("REST_VALUE_INVALID");
    expect(result.message).toContain("10.5");
  });

  test("rangeContext \"normal\" (selects normal = 15.5, still non-integer) also fails with REST_VALUE_INVALID", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "secondary",
      rangeContext: "normal",
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail on a non-integer resolved rest duration.");
    }

    expect(result.failureCode).toBe("REST_VALUE_INVALID");
  });
});
