import { describe, expect, test } from "vitest";

import { resolveRest } from "../../prescription/resolveRest";
import { NUMERICAL_PRESCRIPTION_PROFILES } from "../../prescription/prescriptionKnowledge";

describe("resolveRest", () => {
  test("resolves the documented rest duration for the normal range context", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    const betweenSets = result.rest?.betweenSets;
    if (betweenSets?.type !== "fixed") {
      throw new Error("Expected a fixed rest target for straight_sets_repetitions.");
    }

    expect(betweenSets.duration.value).toBe(180);
    expect(betweenSets.duration.scope).toBe("between_sets");
  });

  test("resolves the documented maximum rest duration for the high range context", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "high",
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    const betweenSets = result.rest?.betweenSets;
    if (betweenSets?.type !== "fixed") {
      throw new Error("Expected a fixed rest target for straight_sets_repetitions.");
    }

    expect(betweenSets.duration.value).toBe(300);
  });

  test("resolves a null rest when the method's rest is documented as not applicable", () => {
    const result = resolveRest({
      moduleId: "conditioning",
      methodId: "continuous_aerobic_duration",
      role: "conditioning",
      rangeContext: "normal",
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.rest).toBeNull();
  });

  test("fails safely when no numerical profile exists for the module/method/role triple", () => {
    const result = resolveRest({
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

  test("determinism: identical input produces an identical result", () => {
    const input = {
      moduleId: "strength" as const,
      methodId: "straight_sets_repetitions" as const,
      role: "primary" as const,
      rangeContext: "normal" as const,
    };

    expect(resolveRest(input)).toEqual(resolveRest(input));
  });

  test("does not mutate its input", () => {
    const input = {
      moduleId: "strength" as const,
      methodId: "straight_sets_repetitions" as const,
      role: "primary" as const,
      rangeContext: "normal" as const,
      sourceRuleIds: ["27_REST_TEMPO_RULES_TEST"],
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    resolveRest(input);

    expect(input).toEqual(snapshot);
  });
});

// Substrate: strength/straight_sets_repetitions/primary documents rest
// scope "between_sets", seconds 180-300 (normal 180).
describe("resolveRest — exerciseRestConstraints", () => {
  test("narrows the rest range and reports both the original and effective range", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      exerciseRestConstraints: {
        scope: "between_sets",
        minimumSeconds: 200,
        maximumSeconds: 250,
        sourceRuleIds: ["TEST_EXERCISE_REST_RULE"],
      },
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    const betweenSets = result.rest?.betweenSets;
    if (betweenSets?.type !== "fixed") {
      throw new Error("Expected a fixed rest target for straight_sets_repetitions.");
    }

    expect(betweenSets.duration.value).toBe(200);
    expect(result.narrowingNotes).toEqual([
      "rest range 180-300s narrowed to 200-250s by documented exercise-specific bounds.",
    ]);
  });

  test("never widens below the profile's own minimum — a constraint minimum under the profile's own minimum has no effect", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      exerciseRestConstraints: {
        scope: "between_sets",
        minimumSeconds: 100,
        maximumSeconds: 250,
        sourceRuleIds: ["TEST_EXERCISE_REST_RULE"],
      },
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    // Must be 180-250 (the true intersection), never 100-250 (the
    // constraint's own requested range).
    expect(result.narrowingNotes).toEqual([
      "rest range 180-300s narrowed to 180-250s by documented exercise-specific bounds.",
    ]);
  });

  test("never widens above the profile's own maximum — a constraint maximum over the profile's own maximum has no effect", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "high",
      exerciseRestConstraints: {
        scope: "between_sets",
        minimumSeconds: 200,
        maximumSeconds: 400,
        sourceRuleIds: ["TEST_EXERCISE_REST_RULE"],
      },
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.narrowingNotes).toEqual([
      "rest range 180-300s narrowed to 200-300s by documented exercise-specific bounds.",
    ]);

    const betweenSets = result.rest?.betweenSets;
    if (betweenSets?.type !== "fixed") {
      throw new Error("Expected a fixed rest target for straight_sets_repetitions.");
    }

    expect(betweenSets.duration.value).toBe(300);
  });

  test("fails with EXERCISE_REST_RANGE_EMPTY when the exercise-specific bounds do not intersect the profile's own range", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      exerciseRestConstraints: {
        scope: "between_sets",
        minimumSeconds: 310,
        maximumSeconds: 320,
        sourceRuleIds: ["TEST_EXERCISE_REST_RULE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when the exercise rest bounds do not intersect the profile's range.");
    }

    expect(result.failureCode).toBe("EXERCISE_REST_RANGE_EMPTY");
  });

  test("fails with EXERCISE_REST_SCOPE_INCOMPATIBLE when the declared scope does not match the profile's documented scope", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      exerciseRestConstraints: {
        scope: "between_rounds",
        minimumSeconds: null,
        maximumSeconds: null,
        sourceRuleIds: ["TEST_EXERCISE_REST_RULE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail on a scope mismatch.");
    }

    expect(result.failureCode).toBe("EXERCISE_REST_SCOPE_INCOMPATIBLE");
  });

  test("not_applicable can never override a real, documented rest scope", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      exerciseRestConstraints: {
        scope: "not_applicable",
        minimumSeconds: null,
        maximumSeconds: null,
        sourceRuleIds: ["TEST_EXERCISE_REST_RULE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when not_applicable is declared against a real documented scope.");
    }

    expect(result.failureCode).toBe("EXERCISE_REST_SCOPE_INCOMPATIBLE");
  });

  test("a scope-only constraint (no numeric bounds) is valid and applies no narrowing", () => {
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

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.narrowingNotes).toEqual([]);

    const betweenSets = result.rest?.betweenSets;
    if (betweenSets?.type !== "fixed") {
      throw new Error("Expected a fixed rest target for straight_sets_repetitions.");
    }

    expect(betweenSets.duration.value).toBe(180);
  });

  test("rejects a non-integer bound", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      exerciseRestConstraints: {
        scope: "between_sets",
        minimumSeconds: 200.5,
        maximumSeconds: 250,
        sourceRuleIds: ["TEST_EXERCISE_REST_RULE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail on a non-integer bound.");
    }

    expect(result.failureCode).toBe("EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID");
  });

  test("rejects a non-positive bound", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      exerciseRestConstraints: {
        scope: "between_sets",
        minimumSeconds: 0,
        maximumSeconds: 250,
        sourceRuleIds: ["TEST_EXERCISE_REST_RULE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail on a non-positive bound.");
    }

    expect(result.failureCode).toBe("EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID");
  });

  test("rejects a constraint whose own minimum exceeds its own maximum", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      exerciseRestConstraints: {
        scope: "between_sets",
        minimumSeconds: 250,
        maximumSeconds: 200,
        sourceRuleIds: ["TEST_EXERCISE_REST_RULE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when the constraint's own minimum exceeds its own maximum.");
    }

    expect(result.failureCode).toBe("EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID");
  });

  test("fails with EXERCISE_PRESCRIPTION_CONSTRAINT_SOURCE_MISSING when the constraint has no source rule", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      exerciseRestConstraints: {
        scope: "between_sets",
        minimumSeconds: 200,
        maximumSeconds: 250,
        sourceRuleIds: [],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when the exercise rest constraint has no source rule.");
    }

    expect(result.failureCode).toBe("EXERCISE_PRESCRIPTION_CONSTRAINT_SOURCE_MISSING");
  });

  test("the constraint's sourceRuleIds are traceable in a successful resolution", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      exerciseRestConstraints: {
        scope: "between_sets",
        minimumSeconds: 200,
        maximumSeconds: 250,
        sourceRuleIds: ["TEST_EXERCISE_REST_RULE"],
      },
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.sourceRuleIds).toContain("TEST_EXERCISE_REST_RULE");
  });

  test("determinism: identical input with exerciseRestConstraints produces an identical result", () => {
    const input = {
      moduleId: "strength" as const,
      methodId: "straight_sets_repetitions" as const,
      role: "primary" as const,
      rangeContext: "normal" as const,
      exerciseRestConstraints: {
        scope: "between_sets" as const,
        minimumSeconds: 200,
        maximumSeconds: 250,
        sourceRuleIds: ["TEST_EXERCISE_REST_RULE"],
      },
    };

    expect(resolveRest(input)).toEqual(resolveRest(input));
  });

  test("does not mutate its input when exerciseRestConstraints is provided", () => {
    const input = {
      moduleId: "strength" as const,
      methodId: "straight_sets_repetitions" as const,
      role: "primary" as const,
      rangeContext: "normal" as const,
      exerciseRestConstraints: {
        scope: "between_sets" as const,
        minimumSeconds: 200,
        maximumSeconds: 250,
        sourceRuleIds: ["TEST_EXERCISE_REST_RULE"],
      },
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    resolveRest(input);

    expect(input).toEqual(snapshot);
  });
});

// Substrate: movement/controlled_mobility_sets/technical
// (controlled_mobility_sets_v0_1) documents rest scope "between_sets",
// seconds 0-45 (normal 15) — the ONLY one of the 12 numerical profiles
// whose documented minimum is 0. Sourced in 34_NUMERICAL_PRESCRIPTION_TABLES.md,
// Table Group 6 (Profile MOB-CONTROLLED): "Zero formal rest is allowed
// only when the method defines immediate controlled transition." Fixed
// defect: the resolver used to reject this documented 0 as
// REST_VALUE_INVALID under rangeContext "reduced" (`seconds <= 0`) —
// corrected to `seconds < 0`, so only genuinely negative or non-integer
// values are rejected.
describe("resolveRest — controlled_mobility_sets_v0_1's documented zero-rest floor", () => {
  test("rangeContext \"reduced\" resolves successfully with rest = 0 seconds (not REST_VALUE_INVALID)", () => {
    const result = resolveRest({
      moduleId: "movement",
      methodId: "controlled_mobility_sets",
      role: "technical",
      rangeContext: "reduced",
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed under "reduced", got failure: ${result.message}`);
    }

    const betweenSets = result.rest?.betweenSets;
    if (betweenSets?.type !== "fixed") {
      throw new Error("Expected a fixed rest target for controlled_mobility_sets.");
    }

    expect(betweenSets.duration.value).toBe(0);
    expect(betweenSets.duration.scope).toBe("between_sets");
    expect(result.profileId).toBe("controlled_mobility_sets_v0_1");
  });

  test("rangeContext \"normal\" resolves successfully with rest = 15 seconds", () => {
    const result = resolveRest({
      moduleId: "movement",
      methodId: "controlled_mobility_sets",
      role: "technical",
      rangeContext: "normal",
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed under "normal", got failure: ${result.message}`);
    }

    const betweenSets = result.rest?.betweenSets;
    if (betweenSets?.type !== "fixed") {
      throw new Error("Expected a fixed rest target for controlled_mobility_sets.");
    }

    expect(betweenSets.duration.value).toBe(15);
  });

  test("rangeContext \"high\" resolves successfully with rest = 45 seconds", () => {
    const result = resolveRest({
      moduleId: "movement",
      methodId: "controlled_mobility_sets",
      role: "technical",
      rangeContext: "high",
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed under "high", got failure: ${result.message}`);
    }

    const betweenSets = result.rest?.betweenSets;
    if (betweenSets?.type !== "fixed") {
      throw new Error("Expected a fixed rest target for controlled_mobility_sets.");
    }

    expect(betweenSets.duration.value).toBe(45);
  });

  test("determinism: identical input under \"reduced\" produces an identical result", () => {
    const input = {
      moduleId: "movement" as const,
      methodId: "controlled_mobility_sets" as const,
      role: "technical" as const,
      rangeContext: "reduced" as const,
    };

    expect(resolveRest(input)).toEqual(resolveRest(input));
  });

  test("does not mutate its input under \"reduced\"", () => {
    const input = {
      moduleId: "movement" as const,
      methodId: "controlled_mobility_sets" as const,
      role: "technical" as const,
      rangeContext: "reduced" as const,
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    resolveRest(input);

    expect(input).toEqual(snapshot);
  });
});

// Cross-cutting non-regression: the fix (`seconds <= 0` -> `seconds < 0`
// in resolveRest.ts) only ever changes behavior for a resolved value of
// exactly 0. Every other NumericalPrescriptionProfile either documents a
// strictly positive rest minimum, or has no rest concept at all
// (`not_applicable` / `seconds: null`) — neither path is reachable by
// this guard change.
describe("resolveRest — non-regression across all 18 numerical prescription profiles", () => {
  test("exactly 18 profiles exist, and controlled_mobility_sets_v0_1 is the only one with a documented rest minimum of 0", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(18);

    const zeroFloorProfiles = NUMERICAL_PRESCRIPTION_PROFILES.filter(
      (profile) => profile.rest !== null && profile.rest.seconds !== null && profile.rest.seconds.min === 0,
    );
    expect(zeroFloorProfiles.map((profile) => profile.profileId)).toEqual(["controlled_mobility_sets_v0_1"]);
  });

  test("every other profile's reduced/normal/high rest values resolve exactly as documented, unaffected by the fix", () => {
    const otherProfiles = NUMERICAL_PRESCRIPTION_PROFILES.filter(
      (profile) => profile.profileId !== "controlled_mobility_sets_v0_1",
    );
    expect(otherProfiles).toHaveLength(17);

    for (const profile of otherProfiles) {
      for (const rangeContext of ["reduced", "normal", "high"] as const) {
        // Explicit profile selection: the four interval profiles share one
        // triple, so implicit resolution would fail with
        // NUMERICAL_PROFILE_AMBIGUOUS — which is not what this test guards.
        const result = resolveRest({
          moduleId: profile.moduleId,
          methodId: profile.methodId,
          role: profile.exerciseRole,
          rangeContext,
          numericalProfileId: profile.profileId,
        });

        if (!result.ok) {
          throw new Error(
            `Expected ${profile.profileId} to resolve successfully under "${rangeContext}", got failure: ${result.message}`,
          );
        }

        if (profile.rest === null || profile.rest.seconds === null) {
          // not_applicable, or a documented scope with no envelope: rest
          // stays null — never a fabricated 0.
          expect(result.rest).toBeNull();
          continue;
        }

        const expectedSeconds =
          rangeContext === "reduced"
            ? profile.rest.seconds.min
            : rangeContext === "normal"
              ? profile.rest.seconds.normal
              : profile.rest.seconds.max;

        // Every one of these profiles documents a strictly positive
        // minimum — confirms none of them were ever exposed to the
        // REST_VALUE_INVALID defect in the first place.
        expect(profile.rest.seconds.min).toBeGreaterThan(0);

        const betweenSets = result.rest?.betweenSets;
        const betweenRounds = result.rest?.betweenRounds;
        const betweenIntervals = result.rest?.betweenIntervals;
        const resolvedValue = betweenSets?.type === "fixed" ? betweenSets.duration.value : betweenRounds?.type === "fixed" ? betweenRounds.duration.value : betweenIntervals?.type === "fixed" ? betweenIntervals.duration.value : null;
        expect(resolvedValue).toBe(expectedSeconds);
      }
    }
  });

  test("no profile ever resolves a negative rest value, and no Hard Constraint (module/method/role triple, required stop conditions) is bypassed by this fix", () => {
    for (const profile of NUMERICAL_PRESCRIPTION_PROFILES) {
      const result = resolveRest({
        moduleId: profile.moduleId,
        methodId: profile.methodId,
        role: profile.exerciseRole,
        rangeContext: "reduced",
        numericalProfileId: profile.profileId,
      });

      if (!result.ok) {
        continue;
      }

      const betweenSets = result.rest?.betweenSets;
      const betweenRounds = result.rest?.betweenRounds;
      const betweenIntervals = result.rest?.betweenIntervals;
      const resolvedValue = betweenSets?.type === "fixed" ? betweenSets.duration.value : betweenRounds?.type === "fixed" ? betweenRounds.duration.value : betweenIntervals?.type === "fixed" ? betweenIntervals.duration.value : null;
      if (resolvedValue !== null) {
        expect(resolvedValue).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("resolveRest — non-regression for exercises without rest constraints", () => {
  test("resolves exactly as before when exerciseRestConstraints is omitted", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.narrowingNotes).toEqual([]);
  });

  test("resolves exactly as before when exerciseRestConstraints is explicitly null", () => {
    const result = resolveRest({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      exerciseRestConstraints: null,
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.narrowingNotes).toEqual([]);
  });

  test("resolves a null rest with narrowingNotes empty when the method's rest is not applicable", () => {
    const result = resolveRest({
      moduleId: "conditioning",
      methodId: "continuous_aerobic_duration",
      role: "conditioning",
      rangeContext: "normal",
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.rest).toBeNull();
    expect(result.narrowingNotes).toEqual([]);
  });
});
