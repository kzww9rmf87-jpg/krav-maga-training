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

// -----------------------------------------------------------------------------
// exerciseDoseConstraints — generic per-exercise narrowing of the shared
// numerical profile, exercised here against the existing
// (strength, straight_sets_repetitions, primary) profile
// (sets: 2-3-4, repetitions: 3-5-6). No Robustness exercise or profile is
// introduced by these tests — this proves the mechanism, not any specific
// exercise's data.
// -----------------------------------------------------------------------------

describe("resolveVolume — exerciseDoseConstraints", () => {
  const baseInput = {
    moduleId: "strength" as const,
    methodId: "straight_sets_repetitions" as const,
    role: "primary" as const,
  };

  test("null exerciseDoseConstraints behaves exactly as if the field were absent", () => {
    const withNull = resolveVolume({ ...baseInput, rangeContext: "high", exerciseDoseConstraints: null });
    const withoutField = resolveVolume({ ...baseInput, rangeContext: "high" });

    expect(withNull).toEqual(withoutField);
  });

  test("narrows the resolved repetitions when an exercise-specific maximum is tighter than the shared profile", () => {
    const result = resolveVolume({
      ...baseInput,
      rangeContext: "high",
      exerciseDoseConstraints: {
        minimumDose: null,
        maximumDose: { sets: null, repetitions: 5, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
        sourceRuleIds: ["50-exercises/TEST_EXERCISE"],
      },
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    // Shared profile's own "high" value is 6 (integerRange(3, 5, 6)); the
    // exercise-specific maximum of 5 must win, never the wider shared value.
    expect(result.volume.reps?.value).toBe(5);
  });

  test("an exercise-specific bound never widens the shared profile", () => {
    const result = resolveVolume({
      ...baseInput,
      rangeContext: "high",
      exerciseDoseConstraints: {
        minimumDose: null,
        maximumDose: { sets: null, repetitions: 100, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
        sourceRuleIds: ["50-exercises/TEST_EXERCISE"],
      },
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    // The shared profile's own maximum (6) still governs — a documented
    // exercise-specific bound of 100 must never raise the ceiling.
    expect(result.volume.reps?.value).toBe(6);
  });

  test("fails deterministically with EXERCISE_DOSE_RANGE_EMPTY when the exercise minimum exceeds the shared profile's maximum", () => {
    const result = resolveVolume({
      ...baseInput,
      rangeContext: "normal",
      exerciseDoseConstraints: {
        minimumDose: { sets: null, repetitions: 10, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
        maximumDose: null,
        sourceRuleIds: ["50-exercises/TEST_EXERCISE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when the exercise-specific range does not intersect the shared profile.");
    }

    expect(result.failureCode).toBe("EXERCISE_DOSE_RANGE_EMPTY");
  });

  test("rejects a constraint declared for a dimension the shared profile's volume structure does not use", () => {
    const result = resolveVolume({
      ...baseInput,
      rangeContext: "normal",
      exerciseDoseConstraints: {
        minimumDose: { sets: null, repetitions: null, durationSeconds: 10, distanceMeters: null, rounds: null, workIntervals: null },
        maximumDose: null,
        sourceRuleIds: ["50-exercises/TEST_EXERCISE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail for a constraint on an unused dimension (sets_reps has no duration).");
    }

    expect(result.failureCode).toBe("EXERCISE_DOSE_CONSTRAINT_INVALID");
  });

  test("rejects a non-integer bound on a discrete dimension", () => {
    const result = resolveVolume({
      ...baseInput,
      rangeContext: "normal",
      exerciseDoseConstraints: {
        minimumDose: { sets: null, repetitions: 3.5, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
        maximumDose: null,
        sourceRuleIds: ["50-exercises/TEST_EXERCISE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail for a non-integer bound on a discrete dimension.");
    }

    expect(result.failureCode).toBe("EXERCISE_DOSE_CONSTRAINT_INVALID");
  });

  test("rejects a zero or negative bound", () => {
    const result = resolveVolume({
      ...baseInput,
      rangeContext: "normal",
      exerciseDoseConstraints: {
        minimumDose: { sets: null, repetitions: 0, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
        maximumDose: null,
        sourceRuleIds: ["50-exercises/TEST_EXERCISE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail for a zero bound.");
    }

    expect(result.failureCode).toBe("EXERCISE_DOSE_CONSTRAINT_INVALID");
  });

  test("rejects a constraint whose own minimum exceeds its own maximum", () => {
    const result = resolveVolume({
      ...baseInput,
      rangeContext: "normal",
      exerciseDoseConstraints: {
        minimumDose: { sets: null, repetitions: 6, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
        maximumDose: { sets: null, repetitions: 3, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
        sourceRuleIds: ["50-exercises/TEST_EXERCISE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when the constraint's own minimum exceeds its own maximum.");
    }

    expect(result.failureCode).toBe("EXERCISE_DOSE_CONSTRAINT_INVALID");
  });

  test("rejects an exercise dose constraint with no source rule", () => {
    const result = resolveVolume({
      ...baseInput,
      rangeContext: "normal",
      exerciseDoseConstraints: {
        minimumDose: { sets: null, repetitions: 4, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
        maximumDose: null,
        sourceRuleIds: [],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when exerciseDoseConstraints has no source rule.");
    }

    expect(result.failureCode).toBe("EXERCISE_DOSE_CONSTRAINT_SOURCE_MISSING");
  });

  test("records a human-readable narrowing note and includes the constraint's source rule", () => {
    const result = resolveVolume({
      ...baseInput,
      rangeContext: "high",
      exerciseDoseConstraints: {
        minimumDose: null,
        maximumDose: { sets: null, repetitions: 5, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
        sourceRuleIds: ["50-exercises/TEST_EXERCISE"],
      },
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.narrowingNotes.length).toBe(1);
    expect(result.narrowingNotes[0]).toContain("repetitions");
    expect(result.narrowingNotes[0]).toContain("3-6");
    expect(result.narrowingNotes[0]).toContain("3-5");
    expect(result.sourceRuleIds).toContain("50-exercises/TEST_EXERCISE");
  });

  test("reports no narrowing note when no dimension was actually narrowed", () => {
    const result = resolveVolume({ ...baseInput, rangeContext: "normal" });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.narrowingNotes).toEqual([]);
  });

  test("determinism: identical exerciseDoseConstraints input produces an identical result", () => {
    const input = {
      ...baseInput,
      rangeContext: "high" as const,
      exerciseDoseConstraints: {
        minimumDose: null,
        maximumDose: { sets: null, repetitions: 5, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
        sourceRuleIds: ["50-exercises/TEST_EXERCISE"],
      },
    };

    expect(resolveVolume(input)).toEqual(resolveVolume(input));
  });

  test("does not mutate exerciseDoseConstraints", () => {
    const input = {
      ...baseInput,
      rangeContext: "high" as const,
      exerciseDoseConstraints: {
        minimumDose: null,
        maximumDose: { sets: null, repetitions: 5, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
        sourceRuleIds: ["50-exercises/TEST_EXERCISE"],
      },
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    resolveVolume(input);

    expect(input).toEqual(snapshot);
  });
});

// -----------------------------------------------------------------------------
// Non-regression — the 35 active pilot exercises never declare
// exerciseDoseConstraints; resolveVolume must behave identically whether the
// field is entirely absent (as before this mechanism existed) or explicitly
// null (as every current Registry entry now declares it).
// -----------------------------------------------------------------------------

describe("resolveVolume — non-regression for exercises without dose constraints", () => {
  test("a duration-based profile resolves identically with and without an explicit null constraint", () => {
    const withoutField = resolveVolume({
      moduleId: "core",
      methodId: "timed_isometric_sets",
      role: "robustness",
      rangeContext: "high",
    });
    const withNull = resolveVolume({
      moduleId: "core",
      methodId: "timed_isometric_sets",
      role: "robustness",
      rangeContext: "high",
      exerciseDoseConstraints: null,
    });

    expect(withoutField).toEqual(withNull);
  });
});
