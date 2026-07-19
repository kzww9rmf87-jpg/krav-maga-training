import { describe, expect, test } from "vitest";

import { resolveRest } from "../../prescription/resolveRest";

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
