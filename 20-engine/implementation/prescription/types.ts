/**
 * Combat Athlete System — Prescription Types
 * Version 0.1
 *
 * Canonical structured contracts for the deterministic prescription layer.
 * This file contains no prescription logic and does not modify the existing
 * pre-prescription pipeline contracts.
 */

import type {
  CapabilityModule,
  ConfidenceLevel,
  Identifier,
  SessionIntensity,
} from "../types";

// -----------------------------------------------------------------------------
// Shared prescription primitives
// -----------------------------------------------------------------------------

export type ExerciseRole =
  | "primary"
  | "secondary"
  | "accessory"
  | "technical"
  | "primer"
  | "contrast"
  | "conditioning"
  | "robustness"
  | "recovery"
  | "corrective";

export type PrescriptionStatus =
  | "complete"
  | "adjusted"
  | "incomplete"
  | "invalid"
  | "failed";

export type VolumeStructure =
  | "sets_reps"
  | "sets_duration"
  | "sets_distance"
  | "rounds_duration"
  | "intervals"
  | "continuous_duration"
  | "continuous_distance";

export type DurationUnit = "seconds" | "minutes";
export type DistanceUnit = "meters";

export type DurationScope =
  | "per_rep"
  | "per_set"
  | "per_round"
  | "per_interval"
  | "between_repetitions"
  | "between_clusters"
  | "between_sets"
  | "between_rounds"
  | "between_intervals"
  | "between_exercises"
  | "after_block"
  | "total";

export type DistanceScope =
  | "per_rep"
  | "per_set"
  | "per_interval"
  | "per_side"
  | "total";

export interface DurationTarget {
  value: number;
  unit: DurationUnit;
  scope: DurationScope;
}

export interface DurationRange {
  min: DurationTarget;
  max: DurationTarget;
}

export interface DistanceTarget {
  value: number;
  unit: DistanceUnit;
  scope: DistanceScope;
}

export type RepetitionTarget =
  | {
      type: "fixed";
      value: number;
      min: null;
      max: null;
      unit: "repetitions";
    }
  | {
      type: "range";
      value: null;
      min: number;
      max: number;
      unit: "repetitions";
      selectionRuleId: Identifier;
    };

export type ExerciseLaterality =
  | "bilateral"
  | "unilateral"
  | "alternating"
  | "asymmetrical"
  | "not_applicable";

export type VolumeInterpretation =
  | "total_repetitions"
  | "repetitions_per_side"
  | "alternating_total_repetitions"
  | "duration_per_side"
  | "total_duration"
  | "distance_per_side"
  | "total_distance"
  | "load_per_hand"
  | "load_per_side"
  | "combined_external_load"
  | "system_load"
  | "round_total"
  | "interval_total";

export interface PrescriptionLaterality {
  laterality: ExerciseLaterality;
  interpretation: VolumeInterpretation;
  startingSide: "left" | "right" | null;
  sideSwitchRuleId: Identifier | null;
}

// -----------------------------------------------------------------------------
// Volume
// -----------------------------------------------------------------------------

export interface PrescriptionVolume {
  structure: VolumeStructure;
  sets: number | null;
  reps: RepetitionTarget | null;
  duration: DurationTarget | null;
  distance: DistanceTarget | null;
  rounds: number | null;
  workIntervals: number | null;
  laterality: PrescriptionLaterality | null;
}

// -----------------------------------------------------------------------------
// Intensity
// -----------------------------------------------------------------------------

export type IntensityType =
  | "absolute_load"
  | "percentage_1rm"
  | "percentage_training_max"
  | "percentage_body_mass"
  | "rpe"
  | "rir"
  | "velocity"
  | "heart_rate"
  | "pace"
  | "technical_effort"
  | "movement_intent"
  | "impact_intent"
  | "assistance_level"
  | "resistance_category"
  | "session_intensity";

export type IntensityUnit =
  | "kilograms"
  | "percentage"
  | "rpe_scale_1_10"
  | "repetitions"
  | "meters_per_second"
  | "beats_per_minute"
  | "seconds_per_meter"
  | "minutes_per_kilometer"
  | "category"
  | "body_mass_multiple"
  | "session_intensity";

export type IntensityScope =
  | "per_repetition"
  | "per_set"
  | "per_round"
  | "per_interval"
  | "per_exercise"
  | "total_block";

export type IntensityCategory =
  | "rehearsal"
  | "easy_technical"
  | "moderate_technical"
  | "high_quality"
  | "competition_specific"
  | "controlled"
  | "smooth"
  | "deliberate"
  | "explosive"
  | "maximal_acceleration"
  | "maximal_safe_speed"
  | "technical_precision"
  | "no_impact"
  | "light_contact"
  | "technical_contact"
  | "moderate_power"
  | "high_power"
  | "maximal_safe_power";

export type IntensityTarget =
  | { type: "fixed"; value: number }
  | { type: "range"; min: number; max: number; selectionRuleId: Identifier }
  | { type: "maximum"; value: number }
  | { type: "minimum"; value: number }
  | { type: "category"; value: IntensityCategory | SessionIntensity | string }
  | { type: "conditional"; conditionId: Identifier };

export type IntensityReferenceType =
  | "one_rep_max"
  | "training_max"
  | "body_mass"
  | "max_heart_rate"
  | "heart_rate_reserve"
  | "max_aerobic_speed"
  | "baseline_velocity"
  | "baseline_pace"
  | "equipment_setting";

export interface IntensityReference {
  referenceType: IntensityReferenceType;
  value: number | string;
  unit: string;
  sourceId: Identifier;
  measuredAt: string | null;
  validUntil: string | null;
  confidence: "validated" | "estimated" | "provisional";
}

export interface IntensityMetric {
  type: IntensityType;
  target: IntensityTarget;
  unit: IntensityUnit;
  scope: IntensityScope;
  reference: IntensityReference | null;
}

export interface IntensityCalculationInput {
  name: string;
  value: number | string;
  unit: string;
  sourceId: Identifier;
}

export interface IntensityCalculation {
  calculationId: Identifier;
  formulaId: Identifier;
  inputs: IntensityCalculationInput[];
  rawResult: number | null;
  roundedResult: number | null;
  outputUnit: IntensityUnit;
  sourceRuleIds: Identifier[];
}

export interface IntensityAdjustment {
  adjustmentId: Identifier;
  reason: PrescriptionAdjustmentReason;
  previousMetric: IntensityMetric | null;
  adjustedMetric: IntensityMetric | null;
  sourceRuleId: Identifier;
}

export interface PrescriptionIntensity {
  primaryMetric: IntensityMetric;
  secondaryMetrics: IntensityMetric[];
  calculation: IntensityCalculation | null;
  adjustments: IntensityAdjustment[];
  sourceRuleIds: Identifier[];
  status: PrescriptionStatus;
}

// -----------------------------------------------------------------------------
// Rest
// -----------------------------------------------------------------------------

export type RestType =
  | "fixed"
  | "range"
  | "conditional"
  | "fixed_with_condition"
  | "range_with_condition";

export type RestTarget =
  | { type: "fixed"; duration: DurationTarget }
  | {
      type: "range";
      min: DurationTarget;
      max: DurationTarget;
      selectionRuleId: Identifier;
    }
  | {
      type: "conditional";
      conditionId: Identifier;
      minimum: DurationTarget | null;
      maximum: DurationTarget | null;
    }
  | {
      type: "fixed_with_condition";
      duration: DurationTarget;
      conditionId: Identifier;
    }
  | {
      type: "range_with_condition";
      min: DurationTarget;
      max: DurationTarget;
      conditionId: Identifier;
      selectionRuleId: Identifier;
    };

export type RestScope =
  | "between_repetitions"
  | "between_clusters"
  | "between_sets"
  | "between_rounds"
  | "between_intervals"
  | "between_exercises"
  | "after_block";

export interface RestAdjustment {
  adjustmentId: Identifier;
  reason: PrescriptionAdjustmentReason;
  field: RestScope;
  previousValue: RestTarget | null;
  adjustedValue: RestTarget | null;
  sourceRuleId: Identifier;
}

export interface PrescriptionRest {
  type: RestType;
  betweenReps: RestTarget | null;
  betweenClusters: RestTarget | null;
  betweenSets: RestTarget | null;
  betweenRounds: RestTarget | null;
  betweenIntervals: RestTarget | null;
  betweenExercises: RestTarget | null;
  afterBlock: RestTarget | null;
  adjustments: RestAdjustment[];
  sourceRuleIds: Identifier[];
  status: PrescriptionStatus;
}

// -----------------------------------------------------------------------------
// Tempo
// -----------------------------------------------------------------------------

export type TempoType =
  | "phase_timed"
  | "phase_intent"
  | "isometric_hold"
  | "global_intent"
  | "mixed";

export type MovementIntent =
  | "controlled"
  | "smooth"
  | "deliberate"
  | "explosive"
  | "maximal_acceleration"
  | "maximal_safe_speed"
  | "technical_precision";

export type TempoPhase =
  | { type: "timed"; seconds: number }
  | { type: "intent"; intent: MovementIntent }
  | { type: "hold"; seconds: number }
  | { type: "none" };

export type TempoField =
  | "eccentric"
  | "bottom"
  | "concentric"
  | "top"
  | "hold"
  | "global_intent";

export interface TempoAdjustment {
  adjustmentId: Identifier;
  reason: PrescriptionAdjustmentReason;
  field: TempoField;
  previousValue: TempoPhase | MovementIntent | null;
  adjustedValue: TempoPhase | MovementIntent | null;
  sourceRuleId: Identifier;
}

export interface PrescriptionTempo {
  type: TempoType;
  eccentric: TempoPhase | null;
  bottom: TempoPhase | null;
  concentric: TempoPhase | null;
  top: TempoPhase | null;
  hold: TempoPhase | null;
  globalIntent: MovementIntent | null;
  adjustments: TempoAdjustment[];
  sourceRuleIds: Identifier[];
  status: PrescriptionStatus;
}

// -----------------------------------------------------------------------------
// Instructions
// -----------------------------------------------------------------------------

export type InstructionCategory =
  | "setup"
  | "execution"
  | "breathing"
  | "technical_intent"
  | "safety"
  | "transition"
  | "equipment"
  | "laterality";

export type InstructionPriority = "critical" | "high" | "medium" | "low";

export interface PrescriptionInstruction {
  instructionId: Identifier;
  category: InstructionCategory;
  text: string;
  sourceRuleId: Identifier;
  priority: InstructionPriority;
}

// -----------------------------------------------------------------------------
// Stop conditions
// -----------------------------------------------------------------------------

export type StopConditionCategory =
  | "medical"
  | "pain"
  | "acute_symptom"
  | "technical_failure"
  | "intensity_limit"
  | "velocity_loss"
  | "pace_loss"
  | "range_of_motion_loss"
  | "balance_loss"
  | "coordination_loss"
  | "fatigue_limit"
  | "impact_limit"
  | "equipment_failure"
  | "environmental_hazard"
  | "completion"
  | "time_limit"
  | "manual_termination";

export type StopConditionScope =
  | "repetition"
  | "set"
  | "cluster"
  | "round"
  | "interval"
  | "exercise"
  | "block"
  | "session";

export type StopConditionAction =
  | "end_repetition"
  | "end_set"
  | "end_cluster"
  | "end_round"
  | "end_interval"
  | "reduce_load"
  | "reduce_repetitions"
  | "reduce_sets"
  | "reduce_duration"
  | "reduce_distance"
  | "increase_rest"
  | "change_tempo"
  | "change_intensity_metric"
  | "modify_range_of_motion"
  | "substitute_exercise"
  | "remove_exercise"
  | "stop_exercise"
  | "stop_block"
  | "stop_session"
  | "seek_medical_review";

export type StopConditionPriority = "critical" | "high" | "medium" | "low";

export type StopConditionRecoverability =
  | "not_recoverable"
  | "recoverable_same_exercise"
  | "recoverable_after_adjustment"
  | "recoverable_with_substitution"
  | "recoverable_next_session_only";

export type StopEvaluationTiming =
  | "before_session"
  | "before_exercise"
  | "before_set"
  | "during_repetition"
  | "after_repetition"
  | "during_set"
  | "after_set"
  | "during_round"
  | "after_round"
  | "during_interval"
  | "after_interval"
  | "after_exercise"
  | "continuous";

export type StopTriggerOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal"
  | "outside_range"
  | "present"
  | "absent"
  | "detected";

export interface StopConditionTrigger {
  type: string;
  metric: string | null;
  operator: StopTriggerOperator;
  expectedValue: number | string | boolean | null;
  unit: string | null;
  evaluationTiming: StopEvaluationTiming;
}

export type StopConditionThreshold =
  | { type: "numeric"; value: number; unit: string }
  | { type: "range"; min: number; max: number; unit: string }
  | { type: "category"; value: string }
  | { type: "boolean"; value: boolean }
  | { type: "event"; eventId: Identifier };

export interface StopConditionInstruction {
  instructionId: Identifier;
  audience: "athlete" | "coach" | "system";
  text: string;
  sourceRuleId: Identifier;
}

export interface StopCondition {
  conditionId: Identifier;
  category: StopConditionCategory;
  scope: StopConditionScope;
  trigger: StopConditionTrigger;
  threshold: StopConditionThreshold | null;
  action: StopConditionAction;
  priority: StopConditionPriority;
  recoverability: StopConditionRecoverability;
  instructions: StopConditionInstruction[];
  sourceRuleIds: Identifier[];
}

// -----------------------------------------------------------------------------
// Contextual adjustments
// -----------------------------------------------------------------------------

export type PrescriptionAdjustmentReason =
  | "readiness"
  | "medical_constraint"
  | "safety_constraint"
  | "combat_schedule"
  | "recovery_protection"
  | "session_duration"
  | "equipment"
  | "training_history"
  | "progression"
  | "regression";

export type PrescriptionAdjustmentTarget =
  | "sets"
  | "repetitions"
  | "duration"
  | "distance"
  | "rounds"
  | "work_intervals"
  | "intensity"
  | "rest"
  | "tempo"
  | "instructions"
  | "stop_conditions"
  | "method"
  | "exercise"
  | "module";

export type AdjustmentPriority = "critical" | "high" | "medium" | "low";

export interface PrescriptionAdjustment {
  adjustmentId: Identifier;
  prescriptionId: Identifier;
  category: PrescriptionAdjustmentReason;
  reasonCode: string;
  triggerSourceId: Identifier;
  targetField: PrescriptionAdjustmentTarget;
  previousValue: unknown;
  adjustedValue: unknown;
  priority: AdjustmentPriority;
  reversible: boolean;
  sourceRuleIds: Identifier[];
  validationStatus: "passed" | "failed";
}

// -----------------------------------------------------------------------------
// Complete prescription and failure
// -----------------------------------------------------------------------------

export interface CanonicalExercisePrescription {
  prescriptionId: Identifier;
  exerciseId: Identifier;
  moduleId: CapabilityModule;
  methodId: Identifier;
  exerciseRole: ExerciseRole;

  volume: PrescriptionVolume;
  intensity: PrescriptionIntensity | null;
  rest: PrescriptionRest | null;
  tempo: PrescriptionTempo | null;

  instructions: PrescriptionInstruction[];
  stopConditions: StopCondition[];

  adjustments: PrescriptionAdjustment[];
  sourceRuleIds: Identifier[];

  estimatedDurationMinutes: number;
  confidence: ConfidenceLevel;
  status: Exclude<PrescriptionStatus, "failed">;
}

export type PrescriptionFailureCode =
  | "PRESCRIPTION_METHOD_MISSING"
  | "PRESCRIPTION_METHOD_INCOMPATIBLE"
  | "PRESCRIPTION_ROLE_MISSING"
  | "PRESCRIPTION_CAPABILITIES_MISSING"
  | "PRESCRIPTION_VOLUME_STRUCTURE_UNSUPPORTED"
  | "PRESCRIPTION_REQUIRED_FIELD_MISSING"
  | "PRESCRIPTION_FORBIDDEN_FIELD_PRESENT"
  | "PRESCRIPTION_ATHLETE_DATA_MISSING"
  | "PRESCRIPTION_INTENSITY_UNRESOLVED"
  | "PRESCRIPTION_REST_UNRESOLVED"
  | "PRESCRIPTION_TEMPO_UNRESOLVED"
  | "PRESCRIPTION_LATERALITY_UNRESOLVED"
  | "PRESCRIPTION_STOP_CONDITION_MISSING"
  | "PRESCRIPTION_RULE_SOURCE_MISSING"
  | "PRESCRIPTION_DURATION_EXCEEDED"
  | "PRESCRIPTION_BELOW_MINIMUM_DOSE"
  | "PRESCRIPTION_HARD_CONSTRAINT_VIOLATION"
  | "PRESCRIPTION_RULE_CONFLICT"
  | "PRESCRIPTION_ADJUSTMENT_LIMIT_REACHED";

export interface PrescriptionFailure {
  prescriptionId: Identifier;
  exerciseId: Identifier;
  moduleId: CapabilityModule;
  methodId: Identifier | null;
  status: "failed";
  reasonCode: PrescriptionFailureCode;
  message: string;
  sourceRuleIds: Identifier[];
  recoverable: boolean;
}

export type ExercisePrescriptionResult =
  | {
      outcome: "prescribed";
      prescription: CanonicalExercisePrescription;
    }
  | {
      outcome: "failed";
      failure: PrescriptionFailure;
    };

// -----------------------------------------------------------------------------
// Session-level prescription output
// -----------------------------------------------------------------------------

export interface PrescribedExercise {
  exerciseId: Identifier;
  exerciseName: string;
  moduleId: CapabilityModule;
  order: number;
  selectionReasons: string[];
  substitutionsConsidered: Identifier[];
  prescription: CanonicalExercisePrescription;
}

export interface PrescribedModule {
  moduleId: CapabilityModule;
  order: number;
  exercises: PrescribedExercise[];
  estimatedDurationMinutes: number;
  minimumDoseSatisfied: boolean;
}

export interface PrescribedSession {
  sessionId: Identifier;
  generatedAt: string;
  engineVersion: "0.1";
  prescriptionVersion: "0.1";
  modules: PrescribedModule[];
  estimatedDurationMinutes: number;
  failures: PrescriptionFailure[];
  confidence: ConfidenceLevel;
  status: "valid" | "modified" | "rejected";
}
