/**
 * Combat Athlete System — pace_loss and acute_symptom stop-condition
 * factories (generic interval foundation).
 *
 * These are the two `work_rest_intervals`-required categories that had no
 * active factory in `stopConditionRegistry.ts`. Per 28_STOP_CONDITIONS.md,
 * a new category becomes active only with a factory whose exact shape is
 * grounded in a real source, plus dedicated tests:
 *
 * - `pace_loss` — "pace or power loss where applicable"
 *   (31_TRAINING_METHOD_CATALOGUE.md, Method 6), the interval-family
 *   analogue of `velocity_loss` in the "method-specific quality threshold"
 *   tier of 25_PRESCRIPTION_RULES.md. Named `intervalPaceLossCondition`
 *   because the shape is structure-bound: `continuous_aerobic_duration`
 *   requires the same category but has no intervals to end;
 * - `acute_symptom` — "Pain or acute symptom" share one priority tier in
 *   25_PRESCRIPTION_RULES.md, so the factory takes `painCondition`'s tier,
 *   with a structure-independent `continuous` evaluation timing.
 */

import { describe, expect, test } from "vitest";

import {
  acuteSymptomCondition,
  balanceLossCondition,
  completionCondition,
  equipmentFailureCondition,
  fatigueLimitCondition,
  impactLimitCondition,
  intervalPaceLossCondition,
  painCondition,
  rangeOfMotionLossCondition,
  technicalFailureCondition,
  velocityLossCondition,
} from "../../prescription/stopConditionRegistry";
import { resolveStopConditions } from "../../prescription/resolveStopConditions";
import { getTrainingMethodContract } from "../../prescription/contracts";

const spec = (conditionId: string, description: string) => ({
  conditionId,
  description,
  sourceRuleIds: ["31_TRAINING_METHOD_CATALOGUE_V0_1"],
});

// -----------------------------------------------------------------------------
// Factory shapes
// -----------------------------------------------------------------------------

describe("intervalPaceLossCondition", () => {
  const definition = intervalPaceLossCondition(
    spec("test-stop-pace-loss", "Stop the interval when target pace or power can no longer be held."),
  );

  test("fixes the documented mechanical shape: interval scope, end_interval, medium, recoverable_same_exercise", () => {
    expect(definition.category).toBe("pace_loss");
    expect(definition.scope).toBe("interval");
    expect(definition.action).toBe("end_interval");
    expect(definition.priority).toBe("medium");
    expect(definition.recoverability).toBe("recoverable_same_exercise");
  });

  test("triggers on detected pace decline during the interval, with no invented threshold", () => {
    expect(definition.trigger).toEqual({
      type: "pace_decline",
      metric: null,
      operator: "detected",
      expectedValue: null,
      unit: null,
      evaluationTiming: "during_interval",
    });
    expect(definition.threshold).toBeNull();
  });

  test("mirrors velocity_loss's tier — same priority and recoverability, interval-scoped instead of set-scoped", () => {
    const velocity = velocityLossCondition(spec("test-stop-velocity", "velocity"));

    expect(definition.priority).toBe(velocity.priority);
    expect(definition.recoverability).toBe(velocity.recoverability);
    expect(velocity.scope).toBe("set");
    expect(definition.scope).toBe("interval");
  });

  test("carries the call site's identifier, athlete instruction and source rules unchanged", () => {
    expect(definition.conditionId).toBe("test-stop-pace-loss");
    expect(definition.instructions).toHaveLength(1);
    expect(definition.instructions[0]).toMatchObject({
      instructionId: "test-stop-pace-loss_instruction",
      audience: "athlete",
      sourceRuleId: "31_TRAINING_METHOD_CATALOGUE_V0_1",
    });
    expect(definition.sourceRuleIds).toEqual(["31_TRAINING_METHOD_CATALOGUE_V0_1"]);
  });
});

describe("acuteSymptomCondition", () => {
  const definition = acuteSymptomCondition(
    spec("test-stop-acute-symptom", "Stop immediately on dizziness, nausea or any acute symptom."),
  );

  test("fixes the documented mechanical shape: exercise scope, stop_exercise, critical, not_recoverable", () => {
    expect(definition.category).toBe("acute_symptom");
    expect(definition.scope).toBe("exercise");
    expect(definition.action).toBe("stop_exercise");
    expect(definition.priority).toBe("critical");
    expect(definition.recoverability).toBe("not_recoverable");
  });

  test("takes painCondition's priority tier — same scope, action, priority and recoverability", () => {
    const pain = painCondition(spec("test-stop-pain-mirror", "pain"));

    expect(definition.scope).toBe(pain.scope);
    expect(definition.action).toBe(pain.action);
    expect(definition.priority).toBe(pain.priority);
    expect(definition.recoverability).toBe(pain.recoverability);
    expect(definition.trigger.type).toBe("acute_symptom_report");
    expect(pain.trigger.type).toBe("pain_report");
  });

  test("is evaluated continuously, not during_set — every method requiring it forbids sets", () => {
    expect(definition.trigger.evaluationTiming).toBe("continuous");

    for (const methodId of [
      "combat_rounds",
      "work_rest_intervals",
      "continuous_aerobic_duration",
      "recovery_duration_work",
    ] as const) {
      const contract = getTrainingMethodContract(methodId);
      expect(contract.requiredStopConditionCategories).toContain("acute_symptom");
      expect(contract.forbiddenVolumeFields).toContain("sets");
    }

    // painCondition deliberately keeps `during_set`: 59 registry entries
    // resolve through it, and this factory does not touch their output.
    expect(painCondition(spec("t-pain-timing", "d")).trigger.evaluationTiming).toBe("during_set");
  });

  test("one structure-independent shape serves every method requiring the category — unlike pace_loss", () => {
    // acute_symptom stops the whole exercise, which is meaningful under
    // rounds_duration, intervals and continuous_duration alike; pace_loss
    // ends an interval, which only exists under `intervals`.
    expect(definition.scope).toBe("exercise");
    expect(intervalPaceLossCondition(spec("t-pace-scope", "d")).scope).toBe("interval");
  });

  test("triggers on detection with no invented threshold", () => {
    expect(definition.trigger.operator).toBe("detected");
    expect(definition.threshold).toBeNull();
  });
});

describe("existing factories — non-regression", () => {
  test("the eight historical factories keep their exact shape, including during_set evaluation timing", () => {
    const expectations = [
      { definition: technicalFailureCondition(spec("t-tf", "d")), category: "technical_failure", scope: "set", action: "end_set", priority: "high" },
      { definition: painCondition(spec("t-pain", "d")), category: "pain", scope: "exercise", action: "stop_exercise", priority: "critical" },
      { definition: completionCondition(spec("t-comp", "d")), category: "completion", scope: "exercise", action: "stop_exercise", priority: "low" },
      { definition: balanceLossCondition(spec("t-bal", "d")), category: "balance_loss", scope: "set", action: "end_set", priority: "high" },
      { definition: equipmentFailureCondition(spec("t-eq", "d")), category: "equipment_failure", scope: "set", action: "end_set", priority: "high" },
      { definition: velocityLossCondition(spec("t-vel", "d")), category: "velocity_loss", scope: "set", action: "end_set", priority: "medium" },
      { definition: fatigueLimitCondition(spec("t-fat", "d")), category: "fatigue_limit", scope: "exercise", action: "stop_exercise", priority: "medium" },
      { definition: impactLimitCondition(spec("t-imp", "d")), category: "impact_limit", scope: "set", action: "end_set", priority: "high" },
      { definition: rangeOfMotionLossCondition(spec("t-rom", "d")), category: "range_of_motion_loss", scope: "set", action: "end_set", priority: "high" },
    ] as const;

    for (const { definition, category, scope, action, priority } of expectations) {
      expect(definition.category).toBe(category);
      expect(definition.scope).toBe(scope);
      expect(definition.action).toBe(action);
      expect(definition.priority).toBe(priority);
      expect(definition.trigger.evaluationTiming).toBe("during_set");
    }
  });
});

// -----------------------------------------------------------------------------
// End-to-end: resolveStopConditions for work_rest_intervals
// -----------------------------------------------------------------------------

const intervalDefinitions = () => [
  intervalPaceLossCondition(spec("wr-stop-pace-loss", "Stop the interval when the target pace cannot be held.")),
  technicalFailureCondition(spec("wr-stop-technical", "Stop the interval on repeated technical breakdown.")),
  fatigueLimitCondition(spec("wr-stop-fatigue", "Stop the exercise when fatigue degrades output across intervals.")),
  acuteSymptomCondition(spec("wr-stop-acute", "Stop immediately on any acute symptom.")),
  painCondition(spec("wr-stop-pain", "Stop immediately on any pain.")),
  completionCondition(spec("wr-stop-completion", "The planned intervals were completed.")),
];

describe("resolveStopConditions — work_rest_intervals", () => {
  test("the method contract requires exactly the six documented categories", () => {
    expect(
      [...getTrainingMethodContract("work_rest_intervals").requiredStopConditionCategories].sort(),
    ).toEqual(
      ["acute_symptom", "completion", "fatigue_limit", "pace_loss", "pain", "technical_failure"].sort(),
    );
  });

  test("the six factories together satisfy every category the method requires, critical conditions first", () => {
    const result = resolveStopConditions({
      methodId: "work_rest_intervals",
      requiredExerciseStopConditionIds: intervalDefinitions().map((definition) => definition.conditionId),
      definitions: intervalDefinitions(),
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    // Both critical conditions lead, ties broken by request order
    // (acute_symptom was requested before pain here).
    expect(result.resolvedStopConditionIds).toEqual([
      "wr-stop-acute",
      "wr-stop-pain",
      "wr-stop-technical",
      "wr-stop-pace-loss",
      "wr-stop-fatigue",
      "wr-stop-completion",
    ]);
  });

  test("dropping the pace_loss definition fails deterministically with STOP_CONDITION_CATEGORY_MISSING", () => {
    const definitions = intervalDefinitions().filter(
      (definition) => definition.category !== "pace_loss",
    );

    const result = resolveStopConditions({
      methodId: "work_rest_intervals",
      requiredExerciseStopConditionIds: definitions.map((definition) => definition.conditionId),
      definitions,
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail without a pace_loss definition.");
    }

    expect(result.failureCode).toBe("STOP_CONDITION_CATEGORY_MISSING");
    expect(result.missingCategories).toEqual(["pace_loss"]);
  });

  test("dropping the acute_symptom definition fails deterministically with STOP_CONDITION_CATEGORY_MISSING", () => {
    const definitions = intervalDefinitions().filter(
      (definition) => definition.category !== "acute_symptom",
    );

    const result = resolveStopConditions({
      methodId: "work_rest_intervals",
      requiredExerciseStopConditionIds: definitions.map((definition) => definition.conditionId),
      definitions,
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail without an acute_symptom definition.");
    }

    expect(result.failureCode).toBe("STOP_CONDITION_CATEGORY_MISSING");
    expect(result.missingCategories).toEqual(["acute_symptom"]);
  });

  test("determinism: identical input produces an identical result", () => {
    const input = {
      methodId: "work_rest_intervals" as const,
      requiredExerciseStopConditionIds: intervalDefinitions().map((definition) => definition.conditionId),
      definitions: intervalDefinitions(),
    };

    expect(resolveStopConditions(input)).toEqual(resolveStopConditions(input));
  });

  test("factories are pure: two identical calls return structurally identical definitions", () => {
    const first = intervalPaceLossCondition(spec("wr-stop-pace-loss", "Stop the interval when the target pace cannot be held."));
    const second = intervalPaceLossCondition(spec("wr-stop-pace-loss", "Stop the interval when the target pace cannot be held."));

    expect(first).toEqual(second);
    expect(acuteSymptomCondition(spec("a", "b"))).toEqual(acuteSymptomCondition(spec("a", "b")));
  });
});
