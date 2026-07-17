/**
 * Combat Athlete System — Stop-Condition Registry
 * Version 0.1
 *
 * Reusable `StopConditionDefinition` factories, one per `StopConditionCategory`
 * actually needed by the pilot exercise registry (`exercisePrescriptionRegistry.ts`).
 *
 * Every factory fixes the mechanical shape (scope, trigger type, action,
 * priority, recoverability) that is identical across every exercise using
 * that category — only the `conditionId`, the human-readable trigger
 * description and the `sourceRuleIds` vary per call site. The description
 * text passed in by each registry entry must be grounded in a real
 * document (an exercise chapter, `31_TRAINING_METHOD_CATALOGUE.md`,
 * `32_MODULE_PRESCRIPTION_PROFILES.md` or `33_EXERCISE_PRESCRIPTION_CAPABILITIES.md`)
 * — never `28_STOP_CONDITIONS.md`, which is a confirmed erroneous byte-for-byte
 * duplicate of `27_REST_TEMPO_RULES.md` and is not a reliable source.
 */

import type { Identifier } from "../types";
import type { StopConditionDefinition } from "./resolveStopConditions";

interface StopConditionSpec {
  conditionId: Identifier;
  description: string;
  sourceRuleIds: readonly Identifier[];
}

function buildDefinition(
  spec: StopConditionSpec,
  category: StopConditionDefinition["category"],
  scope: StopConditionDefinition["scope"],
  triggerType: string,
  action: StopConditionDefinition["action"],
  priority: StopConditionDefinition["priority"],
  recoverability: StopConditionDefinition["recoverability"],
): StopConditionDefinition {
  return {
    conditionId: spec.conditionId,
    category,
    scope,
    trigger: {
      type: triggerType,
      metric: null,
      operator: "detected",
      expectedValue: null,
      unit: null,
      evaluationTiming: "during_set",
    },
    threshold: null,
    action,
    priority,
    recoverability,
    instructions: [
      {
        instructionId: `${spec.conditionId}_instruction`,
        audience: "athlete",
        text: spec.description,
        sourceRuleId: spec.sourceRuleIds[0] ?? spec.conditionId,
      },
    ],
    sourceRuleIds: spec.sourceRuleIds,
  };
}

/** Repeated technical breakdown of the movement pattern. */
export function technicalFailureCondition(spec: StopConditionSpec): StopConditionDefinition {
  return buildDefinition(spec, "technical_failure", "set", "technical_breakdown", "end_set", "high", "recoverable_same_exercise");
}

/** Pain reported at any point — never continued through. */
export function painCondition(spec: StopConditionSpec): StopConditionDefinition {
  return buildDefinition(spec, "pain", "exercise", "pain_report", "stop_exercise", "critical", "not_recoverable");
}

/** The prescribed work (sets/reps/duration/distance) was completed as planned. */
export function completionCondition(spec: StopConditionSpec): StopConditionDefinition {
  return buildDefinition(spec, "completion", "exercise", "planned_work_completed", "stop_exercise", "low", "not_recoverable");
}

/** Loss of balance, stance or footing during the set. */
export function balanceLossCondition(spec: StopConditionSpec): StopConditionDefinition {
  return buildDefinition(spec, "balance_loss", "set", "balance_loss", "end_set", "high", "recoverable_same_exercise");
}

/** Loss of secure control of the implement/equipment (grip, dropped load, rack failure). */
export function equipmentFailureCondition(spec: StopConditionSpec): StopConditionDefinition {
  return buildDefinition(spec, "equipment_failure", "set", "equipment_control_loss", "end_set", "high", "recoverable_after_adjustment");
}

/** Measurable or visible decline in movement velocity across the set. */
export function velocityLossCondition(spec: StopConditionSpec): StopConditionDefinition {
  return buildDefinition(spec, "velocity_loss", "set", "velocity_decline", "end_set", "medium", "recoverable_same_exercise");
}

/** Cumulative fatigue degrading output (not a single-repetition technical break). */
export function fatigueLimitCondition(spec: StopConditionSpec): StopConditionDefinition {
  return buildDefinition(spec, "fatigue_limit", "exercise", "fatigue_accumulation", "stop_exercise", "medium", "recoverable_next_session_only");
}

/** Landing/impact quality degradation (surface contact, joint loading). */
export function impactLimitCondition(spec: StopConditionSpec): StopConditionDefinition {
  return buildDefinition(spec, "impact_limit", "set", "impact_quality_loss", "end_set", "high", "recoverable_same_exercise");
}
