/**
 * Combat Athlete System — Public Session Output Contract
 * Version 1 ("cas-session-output.v1")
 *
 * These are DTOs, not re-exports. Every object/record shape produced by
 * the engine (`InitialSessionDraft`, `DetectedConflict`, `ConflictResolution`,
 * `EngineSessionPrescriptionOutcome`, `DecisionTrace`, `ExercisePrescription`
 * and everything nested inside them) is deliberately re-declared here under
 * a `Cas*V1` name instead of imported directly — so an internal engine
 * refactor can never silently change this public contract's shape, and so
 * this file alone defines what CAS promises to the outside world.
 *
 * Closed vocabularies (string-literal unions with no object shape — they
 * carry no internal computation to protect) are the one exception: they
 * are imported and reused as-is, per the validated architecture decision.
 * Every field still genuinely open (`string`) in its internal counterpart
 * stays `string` here too — see the field-by-field audit in
 * `serializeEngineRunResult.ts`'s module comment.
 *
 * This file contains no decision logic. It defines the wire contract only.
 *
 * CONTRACT EVOLUTION POLICY, made explicit here rather than left implicit.
 * The split above already encodes it, and this note only states it:
 *
 * - SHAPES are re-declared under `Cas*V1` names, which freezes them. Adding,
 *   removing or retyping a field of any `Cas*V1` interface is a BREAKING
 *   change and requires `cas-session-output.v2`.
 * - CLOSED VOCABULARIES are imported, not re-declared, precisely so that
 *   they track the engine. Adding a member to one is an ADDITIVE change and
 *   stays within v1. Removing or renaming a member is breaking and requires
 *   v2.
 *
 * The consequence for consumers is stated plainly: a `Cas*V1` object always
 * has the fields this file declares, but a vocabulary-typed field may carry
 * a member that did not exist when the consumer was written. Consumers must
 * therefore tolerate unknown vocabulary members rather than exhaustively
 * switching on them. This is the price of importing rather than freezing,
 * and it was the deliberate trade: a vocabulary carries no computation to
 * protect, so pinning it would only force a version bump every time the
 * exercise library documents a new unit, category or method.
 *
 * Additions are never silent: each one names its version, its date and its
 * reason below.
 *
 * v1 additive history:
 * - 2026-08-01 — `VolumeInterpretation` gains `climbs` and `hand_pulls`, so
 *   a rope ascent and a hand-over-hand pull can be counted as themselves
 *   instead of being flattened into `total_repetitions`.
 * - 2026-08-03 — `TrainingMethodId` gains `partner_grappling_rounds`, so
 *   resisted partner grappling has a method of its own instead of being
 *   forced through `combat_rounds`, whose contract requires impact
 *   equipment, an impact-limit rule and a sport-specific subtype. Additive:
 *   `CasExercisePrescriptionV1.methodId` may now carry this member, and no
 *   `Cas*V1` shape changed.
 */

import type {
  AdaptationDomain,
  CapabilityModule,
  ConfidenceLevel,
  ConflictType,
  DecisionStage,
  ExerciseRejectionReasonCode,
  Identifier,
  PhysicalQuality,
  SessionBlockedReasonCode,
  SessionIntensity,
  SeverityLevel,
  ValidationErrorCode,
} from "../types";
import type { TrainingMethodId } from "../prescription/contracts";
import type { SessionPrescriptionFailureCode } from "../prescription/prescribeSession";
import type {
  DistanceScope,
  DistanceUnit,
  DurationScope,
  DurationUnit,
  ExerciseLaterality,
  ExerciseRole,
  InstructionCategory,
  InstructionPriority,
  IntensityCategory,
  IntensityReferenceType,
  IntensityScope,
  IntensityType,
  IntensityUnit,
  MovementIntent,
  PrescriptionAdjustmentReason,
  PrescriptionStatus,
  RestScope,
  RestType,
  StopConditionAction,
  StopConditionCategory,
  StopConditionPriority,
  StopConditionRecoverability,
  StopConditionScope,
  StopEvaluationTiming,
  StopTriggerOperator,
  TempoField,
  TempoType,
  VolumeInterpretation,
  VolumeStructure,
} from "../prescription/types";

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

export interface CasValidationIssueV1 {
  code: ValidationErrorCode;
  path: string;
  message: string;
  severity: "warning" | "error" | "critical";
}

export interface CasValidationResultV1 {
  valid: boolean;
  issues: readonly CasValidationIssueV1[];
}

// -----------------------------------------------------------------------------
// Selected Capability Modules
// -----------------------------------------------------------------------------

export interface CasSelectedModuleV1 {
  module: CapabilityModule;
  role: "primary" | "secondary" | "support";
  primaryAdaptation: AdaptationDomain;
  reason: string;
}

// -----------------------------------------------------------------------------
// Session draft — CAS's own final decisions, affichables sans reconstruction
// -----------------------------------------------------------------------------

export interface CasSessionObjectiveV1 {
  adaptationDomain: AdaptationDomain;
  physicalQualities?: readonly PhysicalQuality[];
  requestedModules?: readonly CapabilityModule[];
  description?: string;
}

export interface CasSelectedExerciseV1 {
  exerciseId: Identifier;
  selectionReasons: readonly string[];
}

export interface CasSessionModuleV1 {
  order: number;
  selectedModule: CasSelectedModuleV1;
  estimatedDurationMinutes?: number;
  /** 0 or 1 today (`"secondary"`/`"support"` modules may select nothing) — modeled as an array, not a fixed cardinality. */
  exercises: readonly CasSelectedExerciseV1[];
}

export interface CasSessionDraftV1 {
  sessionId: Identifier;
  title: string;
  primaryObjective: CasSessionObjectiveV1;
  secondaryObjectives: readonly CasSessionObjectiveV1[];
  estimatedDurationMinutes?: number;
  confidence: ConfidenceLevel;
  modules: readonly CasSessionModuleV1[];
}

// -----------------------------------------------------------------------------
// Blocked outcome
// -----------------------------------------------------------------------------

export interface CasBlockedReasonV1 {
  reasonCode: SessionBlockedReasonCode;
  message: string;
  blockedModules: readonly CapabilityModule[];
}

// -----------------------------------------------------------------------------
// Conflicts
// -----------------------------------------------------------------------------

export interface CasConflictV1 {
  conflictId: Identifier;
  type: ConflictType;
  severity: SeverityLevel;
  probability: "low" | "moderate" | "high";
  description: string;
  affectedExerciseIds?: readonly Identifier[];
  affectedModules?: readonly CapabilityModule[];
  resolutionRequired: boolean;
}

export interface CasConflictResolutionV1 {
  conflictId: Identifier;
  action:
    | "none"
    | "monitor"
    | "reorder"
    | "reduce_volume"
    | "reduce_intensity"
    | "substitute_exercise"
    | "remove_exercise"
    | "remove_module"
    | "change_objective"
    | "reject_session";
  description: string;
  removedExerciseIds?: readonly Identifier[];
  addedExerciseIds?: readonly Identifier[];
}

// -----------------------------------------------------------------------------
// Prescription — volume / répétitions / durée / distance / latéralité
// -----------------------------------------------------------------------------

export type CasRepetitionTargetV1 =
  | { type: "fixed"; value: number; min: null; max: null; unit: "repetitions" }
  | { type: "range"; value: null; min: number; max: number; unit: "repetitions"; selectionRuleId: Identifier };

export interface CasDurationTargetV1 {
  value: number;
  unit: DurationUnit;
  scope: DurationScope;
}

export interface CasDistanceTargetV1 {
  value: number;
  unit: DistanceUnit;
  scope: DistanceScope;
}

export interface CasLateralityV1 {
  laterality: ExerciseLaterality;
  interpretation: VolumeInterpretation;
  startingSide: "left" | "right" | null;
  sideSwitchRuleId: Identifier | null;
}

export interface CasVolumeV1 {
  structure: VolumeStructure;
  sets: number | null;
  repetitions: CasRepetitionTargetV1 | null;
  duration: CasDurationTargetV1 | null;
  distance: CasDistanceTargetV1 | null;
  rounds: number | null;
  workIntervals: number | null;
  laterality: CasLateralityV1 | null;
}

// -----------------------------------------------------------------------------
// Prescription — intensité
// -----------------------------------------------------------------------------

export type CasIntensityTargetV1 =
  | { type: "fixed"; value: number }
  | { type: "range"; min: number; max: number; selectionRuleId: Identifier }
  | { type: "maximum"; value: number }
  | { type: "minimum"; value: number }
  // `IntensityCategory | SessionIntensity | string` is genuinely open in the
  // internal `IntensityTarget` (see prescription/types.ts) — preserved as-is.
  | { type: "category"; value: IntensityCategory | SessionIntensity | string }
  | { type: "conditional"; conditionId: Identifier };

export interface CasIntensityReferenceV1 {
  referenceType: IntensityReferenceType;
  value: number | string;
  // Genuinely open in the internal `IntensityReference` (not `IntensityUnit`) — preserved as `string`.
  unit: string;
  sourceId: Identifier;
  measuredAt: string | null;
  validUntil: string | null;
  confidence: "validated" | "estimated" | "provisional";
}

export interface CasIntensityMetricV1 {
  type: IntensityType;
  target: CasIntensityTargetV1;
  unit: IntensityUnit;
  scope: IntensityScope;
  reference: CasIntensityReferenceV1 | null;
}

export interface CasIntensityCalculationInputV1 {
  // Genuinely open in the internal `IntensityCalculationInput` — preserved as `string`.
  name: string;
  value: number | string;
  unit: string;
  sourceId: Identifier;
}

export interface CasIntensityCalculationV1 {
  calculationId: Identifier;
  formulaId: Identifier;
  inputs: readonly CasIntensityCalculationInputV1[];
  rawResult: number | null;
  roundedResult: number | null;
  outputUnit: IntensityUnit;
  sourceRuleIds: readonly Identifier[];
}

export interface CasIntensityAdjustmentV1 {
  adjustmentId: Identifier;
  reason: PrescriptionAdjustmentReason;
  previousMetric: CasIntensityMetricV1 | null;
  adjustedMetric: CasIntensityMetricV1 | null;
  sourceRuleId: Identifier;
}

export interface CasIntensityV1 {
  primaryMetric: CasIntensityMetricV1;
  secondaryMetrics: readonly CasIntensityMetricV1[];
  calculation: CasIntensityCalculationV1 | null;
  adjustments: readonly CasIntensityAdjustmentV1[];
  sourceRuleIds: readonly Identifier[];
  status: PrescriptionStatus;
}

// -----------------------------------------------------------------------------
// Prescription — repos
// -----------------------------------------------------------------------------

export type CasRestTargetV1 =
  | { type: "fixed"; duration: CasDurationTargetV1 }
  | { type: "range"; min: CasDurationTargetV1; max: CasDurationTargetV1; selectionRuleId: Identifier }
  | {
      type: "conditional";
      conditionId: Identifier;
      minimum: CasDurationTargetV1 | null;
      maximum: CasDurationTargetV1 | null;
    }
  | { type: "fixed_with_condition"; duration: CasDurationTargetV1; conditionId: Identifier }
  | {
      type: "range_with_condition";
      min: CasDurationTargetV1;
      max: CasDurationTargetV1;
      conditionId: Identifier;
      selectionRuleId: Identifier;
    };

export interface CasRestAdjustmentV1 {
  adjustmentId: Identifier;
  reason: PrescriptionAdjustmentReason;
  field: RestScope;
  previousValue: CasRestTargetV1 | null;
  adjustedValue: CasRestTargetV1 | null;
  sourceRuleId: Identifier;
}

export interface CasRestV1 {
  type: RestType;
  betweenReps: CasRestTargetV1 | null;
  betweenClusters: CasRestTargetV1 | null;
  betweenSets: CasRestTargetV1 | null;
  betweenRounds: CasRestTargetV1 | null;
  betweenIntervals: CasRestTargetV1 | null;
  betweenExercises: CasRestTargetV1 | null;
  afterBlock: CasRestTargetV1 | null;
  adjustments: readonly CasRestAdjustmentV1[];
  sourceRuleIds: readonly Identifier[];
  status: PrescriptionStatus;
}

// -----------------------------------------------------------------------------
// Prescription — tempo
// -----------------------------------------------------------------------------

export type CasTempoPhaseV1 =
  | { type: "timed"; seconds: number }
  | { type: "intent"; intent: MovementIntent }
  | { type: "hold"; seconds: number }
  | { type: "none" };

export interface CasTempoAdjustmentV1 {
  adjustmentId: Identifier;
  reason: PrescriptionAdjustmentReason;
  field: TempoField;
  previousValue: CasTempoPhaseV1 | MovementIntent | null;
  adjustedValue: CasTempoPhaseV1 | MovementIntent | null;
  sourceRuleId: Identifier;
}

export interface CasTempoV1 {
  type: TempoType;
  eccentric: CasTempoPhaseV1 | null;
  bottom: CasTempoPhaseV1 | null;
  concentric: CasTempoPhaseV1 | null;
  top: CasTempoPhaseV1 | null;
  hold: CasTempoPhaseV1 | null;
  globalIntent: MovementIntent | null;
  adjustments: readonly CasTempoAdjustmentV1[];
  sourceRuleIds: readonly Identifier[];
  status: PrescriptionStatus;
}

// -----------------------------------------------------------------------------
// Prescription — instructions / stopConditions
// -----------------------------------------------------------------------------

export interface CasInstructionV1 {
  instructionId: Identifier;
  category: InstructionCategory;
  text: string;
  sourceRuleId: Identifier;
  priority: InstructionPriority;
}

export interface CasStopConditionTriggerV1 {
  // Genuinely open in the internal `StopConditionTrigger` — preserved as `string`.
  type: string;
  metric: string | null;
  operator: StopTriggerOperator;
  expectedValue: number | string | boolean | null;
  unit: string | null;
  evaluationTiming: StopEvaluationTiming;
}

export type CasStopConditionThresholdV1 =
  | { type: "numeric"; value: number; unit: string }
  | { type: "range"; min: number; max: number; unit: string }
  | { type: "category"; value: string }
  | { type: "boolean"; value: boolean }
  | { type: "event"; eventId: Identifier };

export interface CasStopConditionInstructionV1 {
  instructionId: Identifier;
  audience: "athlete" | "coach" | "system";
  text: string;
  sourceRuleId: Identifier;
}

export interface CasStopConditionV1 {
  conditionId: Identifier;
  category: StopConditionCategory;
  scope: StopConditionScope;
  trigger: CasStopConditionTriggerV1;
  threshold: CasStopConditionThresholdV1 | null;
  action: StopConditionAction;
  priority: StopConditionPriority;
  recoverability: StopConditionRecoverability;
  instructions: readonly CasStopConditionInstructionV1[];
  sourceRuleIds: readonly Identifier[];
}

// -----------------------------------------------------------------------------
// Prescription — exercice et séance prescrite
// -----------------------------------------------------------------------------

export interface CasExercisePrescriptionV1 {
  exerciseId: Identifier;
  moduleId: CapabilityModule;
  role: ExerciseRole;
  methodId: TrainingMethodId;
  volume: CasVolumeV1;
  intensity: CasIntensityV1;
  rest: CasRestV1 | null;
  tempo: CasTempoV1 | null;
  instructions: readonly CasInstructionV1[];
  stopConditions: readonly CasStopConditionV1[];
  sourceRuleIds: readonly Identifier[];
  status: "complete";
}

export interface CasPrescribedExerciseV1 {
  order: number;
  blockId: Identifier;
  required: boolean;
  prescription: CasExercisePrescriptionV1;
}

export interface CasPrescribedSessionV1 {
  sessionId: Identifier;
  sessionName: string;
  modules: readonly CapabilityModule[];
  exercises: readonly CasPrescribedExerciseV1[];
  sourceRuleIds: readonly Identifier[];
  status: "complete";
}

export interface CasPrescriptionGapV1 {
  exerciseId: Identifier;
  moduleId: CapabilityModule;
  required: boolean;
  reason: string;
}

export interface CasPrescriptionIssueV1 {
  code: SessionPrescriptionFailureCode;
  message: string;
  exerciseId: Identifier | null;
  recoverable: boolean;
}

export interface CasPrescriptionFailureV1 {
  sessionId: Identifier;
  issues: readonly CasPrescriptionIssueV1[];
  /** Ids whose per-exercise resolver attempt did not succeed — derived from the internal `exerciseResults`, which itself is never exposed (see mapping notes in `serializeEngineRunResult.ts`). */
  failedExerciseIds: readonly Identifier[];
  omittedOptionalExerciseIds: readonly Identifier[];
  sourceRuleIds: readonly Identifier[];
}

export type CasPrescriptionOutcomeV1 =
  | { status: "prescribed"; session: CasPrescribedSessionV1 }
  | { status: "unavailable"; missingSourceData: readonly CasPrescriptionGapV1[] }
  | { status: "failed"; failure: CasPrescriptionFailureV1 };

// -----------------------------------------------------------------------------
// Decision Trace
// -----------------------------------------------------------------------------

export interface CasExerciseRejectionReasonV1 {
  code: ExerciseRejectionReasonCode;
  message: string;
  hardConstraint: boolean;
}

export interface CasDecisionTraceEntryV1 {
  id: Identifier;
  timestamp: string;
  stage: DecisionStage;
  decision: string;
  reasons: readonly string[];
  inputReferences?: readonly string[];
  affectedExerciseIds?: readonly Identifier[];
  affectedModules?: readonly CapabilityModule[];
  confidence?: ConfidenceLevel;
  sourceRuleIds?: readonly Identifier[];
}

export interface CasDecisionTraceV1 {
  traceId: Identifier;
  // `engineVersion` deliberately absent — already carried once by the envelope (`CasSessionOutputV1.engineVersion`).
  entries: readonly CasDecisionTraceEntryV1[];
  rejectedExercises: readonly {
    exerciseId: Identifier;
    reasons: readonly CasExerciseRejectionReasonV1[];
  }[];
  detectedConflicts: readonly CasConflictV1[];
  conflictResolutions: readonly CasConflictResolutionV1[];
  warnings: readonly string[];
}

// -----------------------------------------------------------------------------
// Références d'exercices
// -----------------------------------------------------------------------------

export interface ExerciseReferenceV1 {
  displayName: string;
}

export type CasExerciseReferencesV1 = Readonly<Record<Identifier, ExerciseReferenceV1>>;

// -----------------------------------------------------------------------------
// Enveloppe publique
// -----------------------------------------------------------------------------

export type CasSessionOutputV1 =
  | {
      contractVersion: "cas-session-output.v1";
      engineVersion: "0.1";
      generatedAt: string;
      outcome: "invalid_input";
      validation: CasValidationResultV1;
      decisionTrace: CasDecisionTraceV1;
      exerciseReferences: CasExerciseReferencesV1;
    }
  | {
      contractVersion: "cas-session-output.v1";
      engineVersion: "0.1";
      generatedAt: string;
      outcome: "blocked";
      validation: CasValidationResultV1;
      selectedModules: readonly CasSelectedModuleV1[];
      blockedReason: CasBlockedReasonV1;
      decisionTrace: CasDecisionTraceV1;
      exerciseReferences: CasExerciseReferencesV1;
    }
  | {
      contractVersion: "cas-session-output.v1";
      engineVersion: "0.1";
      generatedAt: string;
      outcome: "draft";
      validation: CasValidationResultV1;
      selectedModules: readonly CasSelectedModuleV1[];
      sessionDraft: CasSessionDraftV1;
      conflicts: readonly CasConflictV1[];
      conflictResolutions: readonly CasConflictResolutionV1[];
      prescription?: CasPrescriptionOutcomeV1;
      decisionTrace: CasDecisionTraceV1;
      exerciseReferences: CasExerciseReferencesV1;
    };
