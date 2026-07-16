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
