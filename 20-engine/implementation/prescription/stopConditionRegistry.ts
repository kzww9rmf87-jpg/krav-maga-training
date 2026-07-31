/**
 * Combat Athlete System — Stop-Condition Registry
 * Version 0.1
 *
 * Reusable `StopConditionDefinition` factories for every
 * `StopConditionCategory` actually needed by the pilot exercise registry
 * (`exercisePrescriptionRegistry.ts`) or required by a Training Method
 * contract being prepared for registry use (`pace_loss` and `acute_symptom`
 * for `work_rest_intervals`).
 *
 * Usually one factory per category. `pace_loss` is the exception: its shape
 * depends on the method's volume structure, so it is named for the structure
 * it serves (`intervalPaceLossCondition`) and a continuous-aerobic
 * counterpart stays unwritten until one is documented.
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
 * Measurable or visible decline in pace or power output across one work
 * interval. The interval-family analogue of `velocityLossCondition`:
 * required by the `work_rest_intervals` method contract ("pace or power loss
 * where applicable", 31_TRAINING_METHOD_CATALOGUE.md, Method 6) and sitting
 * in the "method-specific quality threshold" priority tier of
 * 25_PRESCRIPTION_RULES.md — hence the same `medium` /
 * `recoverable_same_exercise` shape, scoped to the interval.
 *
 * Named for the structure, not just the category, because `pace_loss` is the
 * one required category whose shape genuinely cannot be shared across
 * methods: `continuous_aerobic_duration` also requires it, but its
 * `continuous_duration` structure forbids `work_intervals` entirely, so
 * `scope: "interval"` / `action: "end_interval"` would describe a boundary
 * that does not exist in a continuous prescription. Nothing downstream would
 * catch that — `resolveStopConditions` and `validatePrescription` check
 * category coverage and copy `scope` through verbatim, never verifying it
 * against the method's structure. A continuous-aerobic counterpart therefore
 * needs its own factory, and no such factory is written here: its scope,
 * action and recoverability are documented nowhere yet, and inventing them
 * is exactly what 28_STOP_CONDITIONS.md forbids for an inactive category.
 */
export function intervalPaceLossCondition(spec: StopConditionSpec): StopConditionDefinition {
  return buildDefinition(spec, "pace_loss", "interval", "pace_decline", "end_interval", "medium", "recoverable_same_exercise", "during_interval");
}

/**
 * Acute symptom reported at any point (dizziness, nausea, chest discomfort…)
 * — never continued through. 25_PRESCRIPTION_RULES.md places "pain or acute
 * symptom" together in the tier just below emergency medical, so this factory
 * takes `painCondition`'s tier exactly: exercise scope, `stop_exercise`,
 * `critical`, `not_recoverable`.
 *
 * Unlike `pace_loss`, this shape is structure-independent and needs no
 * per-method variant: all four methods requiring `acute_symptom`
 * (`combat_rounds`, `work_rest_intervals`, `continuous_aerobic_duration`,
 * `recovery_duration_work`) are served by stopping the whole exercise. That
 * is also why the timing is `continuous` rather than the file's `during_set`
 * default — an acute symptom is monitored throughout, and every one of those
 * four methods lists `sets` in `forbiddenVolumeFields`, so `during_set` would
 * name a boundary none of their prescriptions has. `painCondition` keeps
 * `during_set`: 59 registry entries resolve through it today, and changing
 * their prescriptions is not this factory's business.
 */
export function acuteSymptomCondition(spec: StopConditionSpec): StopConditionDefinition {
  return buildDefinition(spec, "acute_symptom", "exercise", "acute_symptom_report", "stop_exercise", "critical", "not_recoverable", "continuous");
}
