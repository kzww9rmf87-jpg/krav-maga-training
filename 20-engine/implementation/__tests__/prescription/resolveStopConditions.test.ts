import { describe, expect, test } from "vitest";

import { resolveStopConditions } from "../../prescription/resolveStopConditions";
import { makeStopConditionDefinitions, REQUIRED_STOP_CONDITION_IDS } from "./fixtures";

describe("resolveStopConditions", () => {
  test("resolves every required stop condition ordered by priority (critical first)", () => {
    const result = resolveStopConditions({
      methodId: "straight_sets_repetitions",
      requiredExerciseStopConditionIds: [...REQUIRED_STOP_CONDITION_IDS],
      definitions: makeStopConditionDefinitions(),
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.stopConditions.map((condition) => condition.conditionId)).toEqual([
      "stop-pain",
      "stop-technical-failure",
      "stop-completion",
    ]);
  });

  test("fails safely when a category the method requires is missing from the selected stop conditions", () => {
    const definitions = makeStopConditionDefinitions().filter(
      (definition) => definition.conditionId !== "stop-pain",
    );

    const result = resolveStopConditions({
      methodId: "straight_sets_repetitions",
      requiredExerciseStopConditionIds: ["stop-technical-failure", "stop-completion"],
      definitions,
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when the method-required 'pain' category is absent.");
    }

    expect(result.failureCode).toBe("STOP_CONDITION_CATEGORY_MISSING");
    expect(result.missingCategories).toContain("pain");
  });

  test("fails safely when a required exercise stop condition has no matching definition", () => {
    const result = resolveStopConditions({
      methodId: "straight_sets_repetitions",
      requiredExerciseStopConditionIds: ["stop-pain", "stop-unknown"],
      definitions: makeStopConditionDefinitions(),
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail for a missing required stop condition.");
    }

    expect(result.failureCode).toBe("REQUIRED_STOP_CONDITION_MISSING");
    expect(result.missingStopConditionIds).toEqual(["stop-unknown"]);
  });

  test("silently omits an optional stop condition that has no matching definition", () => {
    const result = resolveStopConditions({
      methodId: "straight_sets_repetitions",
      requiredExerciseStopConditionIds: [...REQUIRED_STOP_CONDITION_IDS],
      optionalStopConditionIds: ["stop-unknown-optional"],
      definitions: makeStopConditionDefinitions(),
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.omittedOptionalStopConditionIds).toEqual(["stop-unknown-optional"]);
  });

  test("determinism: identical input produces an identical result", () => {
    const input = {
      methodId: "straight_sets_repetitions" as const,
      requiredExerciseStopConditionIds: [...REQUIRED_STOP_CONDITION_IDS],
      definitions: makeStopConditionDefinitions(),
    };

    expect(resolveStopConditions(input)).toEqual(resolveStopConditions(input));
  });

  test("does not mutate its input", () => {
    const input = {
      methodId: "straight_sets_repetitions" as const,
      requiredExerciseStopConditionIds: [...REQUIRED_STOP_CONDITION_IDS],
      definitions: makeStopConditionDefinitions(),
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    resolveStopConditions(input);

    expect(input).toEqual(snapshot);
  });
});
