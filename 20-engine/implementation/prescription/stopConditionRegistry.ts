/**
 * Combat Athlete System — Stop-Condition Registry
 * Version 0.1
 *
 * Reusable `StopConditionDefinition` factories, one per `StopConditionCategory`
 * actually needed by the pilot exercise registry (`exercisePrescriptionRegistry.ts`)
 * or required by a Training Method contract being prepared for registry use
 * (`pace_loss` and `acute_symptom` for `work_rest_intervals`).
 *
 * Every factory fixes the mechanical shape (scope, trigger type, action,
 * priority, recoverability) that is identical across every exercise using
 * that category — only the `conditionId`, the human-readable trigger
 * description and the `sourceRuleIds` vary per call site. The description
 * text passed in by each registry entry must be grounded in a real
 * document (an exercise chapter, `31_TRAINING_METHOD_CATALOGUE.md`,
 * `32_MODULE_PRESCRIPTION_PROFILES.md` or `33_EXERCISE_PRESCRIPTION_CAPABILITIES.md`).
 * `28_STOP_CONDITIONS.md` is now the specification for the eight
 * categories implemented below (scope, trigger type, action, priority,
 * recoverability) — it documents this file's shape, but is not itself a
 * source for exercise-specific description text.
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
  evaluationTiming: StopConditionDefinition["trigger"]["evaluationTiming"] = "during_set",
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
      evaluationTiming,
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

/** Reduction or restriction of the movement's own documented range of motion during the set. */
export function rangeOfMotionLossCondition(spec: StopConditionSpec): StopConditionDefinition {
  return buildDefinition(spec, "range_of_motion_loss", "set", "range_of_motion_loss", "end_set", "high", "recoverable_same_exercise");
}

/**
 * Measurable or visible decline in pace or power output across the interval.
 * The interval-family analogue of `velocityLossCondition`: required by the
 * `work_rest_intervals` method contract ("pace or power loss where
 * applicable", 31_TRAINING_METHOD_CATALOGUE.md, Method 6) and sitting in the
 * "method-specific quality threshold" priority tier of
 * 25_PRESCRIPTION_RULES.md — hence the same `medium` /
 * `recoverable_same_exercise` shape at interval scope.
 */
export function paceLossCondition(spec: StopConditionSpec): StopConditionDefinition {
  return buildDefinition(spec, "pace_loss", "interval", "pace_decline", "end_interval", "medium", "recoverable_same_exercise", "during_interval");
}

/**
 * Acute symptom reported at any point (dizziness, nausea, chest discomfort…)
 * — never continued through. 25_PRESCRIPTION_RULES.md places "pain or acute
 * symptom" together in the tier just below emergency medical, so this factory
 * mirrors `painCondition` exactly: exercise scope, `stop_exercise`,
 * `critical`, `not_recoverable`.
 */
export function acuteSymptomCondition(spec: StopConditionSpec): StopConditionDefinition {
  return buildDefinition(spec, "acute_symptom", "exercise", "acute_symptom_report", "stop_exercise", "critical", "not_recoverable");
}
