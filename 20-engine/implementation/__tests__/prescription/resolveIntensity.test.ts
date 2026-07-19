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

// Substrate: strength/straight_sets_repetitions/primary documents three
// intensity rules — percentage_1rm (80-90, requires a one-rep-max
// reference), rpe (7.5-9), rir (1-3) — giving genuine multi-rule coverage.
describe("resolveIntensity — exerciseIntensityConstraints", () => {
  test("narrows the selected rule's range and reports both the original and effective range", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["rpe"],
      exerciseIntensityConstraints: {
        allowedIntensityTypes: null,
        rangeConstraints: [{ type: "rpe", minimum: 8, maximum: 8 }],
        sourceRuleIds: ["TEST_EXERCISE_INTENSITY_RULE"],
      },
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.selectedRuleType).toBe("rpe");
    expect(result.intensity.primaryMetric.target).toEqual({ type: "fixed", value: 8 });
    expect(result.narrowingNotes).toEqual([
      "rpe range 7.5-9 narrowed to 8-8 by documented exercise-specific bounds.",
    ]);
  });

  test("never widens below the profile's own minimum — a constraint minimum under the profile's own minimum has no effect", () => {
    // rir is documented 1-3. A constraint of [0, 2] must resolve to the
    // intersection 1-2, never to 0-2 — echoing the constraint's own
    // requested range instead of the true intersection was the exact
    // mistake caught during design review.
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "reduced",
      supportedIntensityTypes: ["rir"],
      exerciseIntensityConstraints: {
        allowedIntensityTypes: null,
        rangeConstraints: [{ type: "rir", minimum: 0, maximum: 2 }],
        sourceRuleIds: ["TEST_EXERCISE_INTENSITY_RULE"],
      },
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.narrowingNotes).toEqual([
      "rir range 1-3 narrowed to 1-2 by documented exercise-specific bounds.",
    ]);
    expect(result.intensity.primaryMetric.target).toEqual({ type: "fixed", value: 1 });
  });

  test("never widens above the profile's own maximum — a constraint maximum over the profile's own maximum has no effect", () => {
    // rir is documented 1-3. A constraint of [2, 5] must resolve to the
    // intersection 2-3, never to 2-5.
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "high",
      supportedIntensityTypes: ["rir"],
      exerciseIntensityConstraints: {
        allowedIntensityTypes: null,
        rangeConstraints: [{ type: "rir", minimum: 2, maximum: 5 }],
        sourceRuleIds: ["TEST_EXERCISE_INTENSITY_RULE"],
      },
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.narrowingNotes).toEqual([
      "rir range 1-3 narrowed to 2-3 by documented exercise-specific bounds.",
    ]);
    expect(result.intensity.primaryMetric.target).toEqual({ type: "fixed", value: 3 });
  });

  test("fails immediately with EXERCISE_INTENSITY_RANGE_EMPTY when an explicit constraint intersects to nothing, even though another documented rule remains valid", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
      athleteReferences: [makeOneRepMaxReference({ value: 100 })],
      exerciseIntensityConstraints: {
        allowedIntensityTypes: null,
        rangeConstraints: [{ type: "rpe", minimum: 9.5, maximum: 9.5 }],
        sourceRuleIds: ["TEST_EXERCISE_INTENSITY_RULE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when an explicit constraint intersects to an empty range.");
    }

    expect(result.failureCode).toBe("EXERCISE_INTENSITY_RANGE_EMPTY");
  });

  test("drops an excluded type without failing when another documented type remains — two-phase resolution", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
      athleteReferences: [makeOneRepMaxReference({ value: 100 })],
      exerciseIntensityConstraints: {
        allowedIntensityTypes: ["rpe", "rir"],
        rangeConstraints: [],
        sourceRuleIds: ["TEST_EXERCISE_INTENSITY_RULE"],
      },
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.selectedRuleType).not.toBe("percentage_1rm");
    expect(result.rejectedRuleTypes).toContain("percentage_1rm");
  });

  test("fails with EXERCISE_INTENSITY_TYPE_UNSUPPORTED when allowedIntensityTypes is a deliberate empty array", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
      exerciseIntensityConstraints: {
        allowedIntensityTypes: [],
        rangeConstraints: [],
        sourceRuleIds: ["TEST_EXERCISE_INTENSITY_RULE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when allowedIntensityTypes excludes every documented type.");
    }

    expect(result.failureCode).toBe("EXERCISE_INTENSITY_TYPE_UNSUPPORTED");
  });

  test("rejects a duplicate entry in allowedIntensityTypes instead of silently normalizing it", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["rpe"],
      exerciseIntensityConstraints: {
        allowedIntensityTypes: ["rpe", "rpe"],
        rangeConstraints: [],
        sourceRuleIds: ["TEST_EXERCISE_INTENSITY_RULE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail on a duplicate allowedIntensityTypes entry.");
    }

    expect(result.failureCode).toBe("EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID");
  });

  test("rejects an allowedIntensityTypes entry the profile does not document", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["rpe"],
      exerciseIntensityConstraints: {
        allowedIntensityTypes: ["rpe", "absolute_load"],
        rangeConstraints: [],
        sourceRuleIds: ["TEST_EXERCISE_INTENSITY_RULE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when allowedIntensityTypes names an undocumented type.");
    }

    expect(result.failureCode).toBe("EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID");
  });

  test("rejects more than one range constraint declared for the same type", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["rpe"],
      exerciseIntensityConstraints: {
        allowedIntensityTypes: null,
        rangeConstraints: [
          { type: "rpe", minimum: 8, maximum: null },
          { type: "rpe", minimum: null, maximum: 8.5 },
        ],
        sourceRuleIds: ["TEST_EXERCISE_INTENSITY_RULE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail on a duplicate range constraint for the same type.");
    }

    expect(result.failureCode).toBe("EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID");
  });

  test("rejects a range constraint targeting a type the profile does not document", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["rpe"],
      exerciseIntensityConstraints: {
        allowedIntensityTypes: null,
        rangeConstraints: [{ type: "absolute_load", minimum: 10, maximum: 20 }],
        sourceRuleIds: ["TEST_EXERCISE_INTENSITY_RULE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when the range constraint targets an undocumented type.");
    }

    expect(result.failureCode).toBe("EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID");
  });

  test("rejects a range constraint targeting a categorical rule — categorical rules cannot be range-narrowed", () => {
    const result = resolveIntensity({
      moduleId: "power",
      methodId: "power_repetition_sets",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["movement_intent", "percentage_1rm"],
      athleteReferences: [makeOneRepMaxReference({ value: 100 })],
      exerciseIntensityConstraints: {
        allowedIntensityTypes: null,
        rangeConstraints: [{ type: "movement_intent", minimum: 1, maximum: 2 }],
        sourceRuleIds: ["TEST_EXERCISE_INTENSITY_RULE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when a range constraint targets a categorical rule.");
    }

    expect(result.failureCode).toBe("EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID");
  });

  test("allows excluding a categorical type via allowedIntensityTypes — inclusion/exclusion only, never range narrowing", () => {
    // recovery/recovery_duration_work/recovery documents two rules: rpe
    // (range) and technical_effort (categorical). Excluding the
    // categorical type via allowedIntensityTypes must simply drop it — no
    // range narrowing mechanism applies to it.
    const result = resolveIntensity({
      moduleId: "recovery",
      methodId: "recovery_duration_work",
      role: "recovery",
      rangeContext: "normal",
      supportedIntensityTypes: ["rpe", "technical_effort"],
      exerciseIntensityConstraints: {
        allowedIntensityTypes: ["rpe"],
        rangeConstraints: [],
        sourceRuleIds: ["TEST_EXERCISE_INTENSITY_RULE"],
      },
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.selectedRuleType).toBe("rpe");
    expect(result.rejectedRuleTypes).toContain("technical_effort");
  });

  test("rejects a range constraint that declares neither a minimum nor a maximum", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["rpe"],
      exerciseIntensityConstraints: {
        allowedIntensityTypes: null,
        rangeConstraints: [{ type: "rpe", minimum: null, maximum: null }],
        sourceRuleIds: ["TEST_EXERCISE_INTENSITY_RULE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail on a no-op range constraint.");
    }

    expect(result.failureCode).toBe("EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID");
  });

  test("rejects a range constraint whose minimum exceeds its own maximum", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["rpe"],
      exerciseIntensityConstraints: {
        allowedIntensityTypes: null,
        rangeConstraints: [{ type: "rpe", minimum: 8.5, maximum: 8 }],
        sourceRuleIds: ["TEST_EXERCISE_INTENSITY_RULE"],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when the constraint's own minimum exceeds its own maximum.");
    }

    expect(result.failureCode).toBe("EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID");
  });

  test("fails with EXERCISE_PRESCRIPTION_CONSTRAINT_SOURCE_MISSING when the constraint has no source rule", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["rpe"],
      exerciseIntensityConstraints: {
        allowedIntensityTypes: null,
        rangeConstraints: [{ type: "rpe", minimum: 8, maximum: 8.5 }],
        sourceRuleIds: [],
      },
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when the exercise intensity constraint has no source rule.");
    }

    expect(result.failureCode).toBe("EXERCISE_PRESCRIPTION_CONSTRAINT_SOURCE_MISSING");
  });

  test("narrowingNotes only reflects the selected rule, not every structurally narrowed rule", () => {
    // percentage_1rm is narrowed, but the exercise capability profile only
    // supports rpe — the selected rule (rpe) was never itself narrowed, so
    // narrowingNotes must stay empty even though a narrowing was computed
    // for a rule that was never selected.
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["rpe"],
      exerciseIntensityConstraints: {
        allowedIntensityTypes: null,
        rangeConstraints: [{ type: "percentage_1rm", minimum: 82, maximum: 88 }],
        sourceRuleIds: ["TEST_EXERCISE_INTENSITY_RULE"],
      },
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.selectedRuleType).toBe("rpe");
    expect(result.narrowingNotes).toEqual([]);
  });

  test("the constraint's sourceRuleIds are traceable in a successful resolution", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["rpe"],
      exerciseIntensityConstraints: {
        allowedIntensityTypes: null,
        rangeConstraints: [{ type: "rpe", minimum: 8, maximum: 8.5 }],
        sourceRuleIds: ["TEST_EXERCISE_INTENSITY_RULE"],
      },
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.sourceRuleIds).toContain("TEST_EXERCISE_INTENSITY_RULE");
  });

  test("determinism: identical input with exerciseIntensityConstraints produces an identical result", () => {
    const input = {
      moduleId: "strength" as const,
      methodId: "straight_sets_repetitions" as const,
      role: "primary" as const,
      rangeContext: "normal" as const,
      supportedIntensityTypes: ["rpe"] as const,
      exerciseIntensityConstraints: {
        allowedIntensityTypes: null,
        rangeConstraints: [{ type: "rpe" as const, minimum: 8, maximum: 8.5 }],
        sourceRuleIds: ["TEST_EXERCISE_INTENSITY_RULE"],
      },
    };

    expect(resolveIntensity(input)).toEqual(resolveIntensity(input));
  });

  test("does not mutate its input when exerciseIntensityConstraints is provided", () => {
    const input = {
      moduleId: "strength" as const,
      methodId: "straight_sets_repetitions" as const,
      role: "primary" as const,
      rangeContext: "normal" as const,
      supportedIntensityTypes: ["rpe"] as const,
      exerciseIntensityConstraints: {
        allowedIntensityTypes: null,
        rangeConstraints: [{ type: "rpe" as const, minimum: 8, maximum: 8.5 }],
        sourceRuleIds: ["TEST_EXERCISE_INTENSITY_RULE"],
      },
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    resolveIntensity(input);

    expect(input).toEqual(snapshot);
  });
});

describe("resolveIntensity — non-regression for exercises without intensity constraints", () => {
  test("resolves exactly as before when exerciseIntensityConstraints is omitted", () => {
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
    expect(result.narrowingNotes).toEqual([]);
  });

  test("resolves exactly as before when exerciseIntensityConstraints is explicitly null", () => {
    const result = resolveIntensity({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      rangeContext: "normal",
      supportedIntensityTypes: ["rpe"],
      exerciseIntensityConstraints: null,
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.narrowingNotes).toEqual([]);
  });
});
