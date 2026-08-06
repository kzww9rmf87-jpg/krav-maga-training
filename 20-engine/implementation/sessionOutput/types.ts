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
 * - SHAPES are re-declared under `Cas*V1` names, which freezes them.
 *   Each of the following is a BREAKING change that requires `cas-session-output.v2`:
 *     - removing a field;
 *     - retyping a field;
 *     - making an existing optional field required;
 *     - adding a REQUIRED field.
 *   Adding a NEW OPTIONAL field is the one additive shape change and stays
 *   within v1.
 *   Adding a required field is breaking even though a JSON reader would
 *   never notice, because `Cas*V1` is an exported TypeScript type: any
 *   consumer that constructs, fixtures, mocks or exhaustively types one of
 *   these objects stops compiling. Such consumers exist — this repository's
 *   own tests build `CasPrescriptionOutcomeV1` literals — so "consumers
 *   only ever read the contract" is an assumption the public type does not
 *   guarantee and must not be relied on. Compile-time compatibility is part
 *   of the contract, not an implementation detail of it.
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
 * - 2026-08-03 — `CasPrescriptionOutcomeV1` gains an OPTIONAL
 *   `unprescribedSelectedExercises?` on all three statuses. Before this, an
 *   exercise selected for a `"secondary"`/`"support"` module that found no
 *   prescription source was dropped from the prescription while the status
 *   stayed `"prescribed"`, with no warning and no trace entry — the only
 *   way to notice was to diff `sessionDraft` against
 *   `prescription.session.exercises`, which is a computation CAS must not
 *   delegate.
 *   Additive under the clause above: the field is optional, so every
 *   existing v1 object and every existing consumer still type-checks
 *   unchanged. Every output serialized after this date always populates it
 *   (`[]` when nothing was omitted); only v1 objects predating this change
 *   can lack it, and consumers read it as `?? []`.
 *   `missingSourceData` retains exactly its previous meaning — the
 *   *required* gaps that caused the `"unavailable"` status — and no status
 *   or existing field changed semantics, type or optionality.
 *
 *   `CasPrescriptionGapV1` gains an OPTIONAL `reasonCode?` on the same
 *   terms, and for the same reason: `CasPrescriptionGapV1` already existed
 *   in v1 (it is what `missingSourceData` carries), so adding a required
 *   field to it would break exactly the consumers the clause above
 *   protects — this repository's own tests construct such literals. Every
 *   gap CAS serializes after this date carries `reasonCode`; only gaps in
 *   v1 objects predating this change can lack it.
 * - 2026-08-04 — `CasPrescribedExerciseV1` gains an OPTIONAL
 *   `estimatedDurationSeconds?`. The engine has estimated every prescribed
 *   exercise since duration estimation existed — it is how the session
 *   total is built and how the time-budget reduction decides what to give
 *   up — but only the SESSION total was published. A consumer that wanted
 *   to show "≈4 min" beside an exercise had no choice but to derive it from
 *   sets, repetitions and rest, which is a training computation, and one it
 *   would get wrong: setup time and the per-repetition constants live in
 *   the engine's duration model, not in the published prescription.
 *   Publishing the number CAS already computed removes the incentive to
 *   reimplement it badly.
 *   Additive under the clause above: the field is optional, so every
 *   existing v1 object and every existing consumer still type-checks
 *   unchanged, and no existing field changed type, meaning or optionality.
 *   Unlike `unprescribedSelectedExercises`, this field is NOT always
 *   emitted — an exercise CAS could not estimate carries no value at all,
 *   which is the same discipline the estimator itself applies internally
 *   (a structured failure, never a partial number).
 *   `CasSessionDraftV1.estimatedDurationMinutes` is unchanged and remains
 *   the only published SESSION duration; the per-exercise seconds do not
 *   sum to it, because the session additionally carries a transition
 *   between consecutive exercises.
 * - 2026-08-06 — the `"draft"` outcome gains an OPTIONAL `sessionAdequacy?`.
 *   A real request (maximum strength, 30 minutes, bodyweight only) returned a
 *   contract-valid draft holding one accessory exercise and 8 minutes of work,
 *   with no conflict and no warning. Every stage had done its job; no stage
 *   was in a position to ask whether the finished session was still the
 *   session that had been requested. `sessionAdequacy` is that answer:
 *   `adequate` / `partial` / `inadequate`, with the rule ids, reason codes and
 *   duration figures behind it.
 *   Additive under the clause above: the field is optional, so every existing
 *   v1 object and every existing consumer still type-checks unchanged, and no
 *   existing field changed type, meaning or optionality. Every `"draft"`
 *   output serialized after this date carries it; only v1 objects predating
 *   this change can lack it.
 *   A CONSUMER MUST NOT READ `outcome: "draft"` AS "USABLE SESSION" — it never
 *   meant that, and this field is what makes the difference legible without
 *   recomputing it. `conflicts` and `decisionTrace.warnings` carry the same
 *   findings for a prescribed session; a session whose prescription is
 *   `unavailable` reports `inadequate` here while its cause stays where it
 *   already was, in `prescription.missingSourceData`.
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
import type {
  SessionAdequacyReasonCode,
  SessionAdequacyRuleId,
  SessionAdequacyStatus,
} from "../sessionAdequacy";
import type { TrainingMethodId } from "../prescription/contracts";
import type { SessionPrescriptionFailureCode } from "../prescription/prescribeSession";
import type { UnprescribedExerciseReasonCode } from "../prescription/buildPrescriptionInput";
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
  /**
   * How long CAS estimates this exercise takes, in whole seconds: its setup,
   * its prescribed work, and the rest BETWEEN its efforts.
   *
   * It is an estimate, not a prescription. The doses in `prescription` are
   * what CAS decided the athlete should do; this number is what performing
   * them is expected to cost. Nothing in the session depends on the athlete
   * matching it.
   *
   * Three things a consumer must not do with it:
   * - do not treat it as a target or a countdown. It carries no per-set
   *   timing, and an exercise finished faster or slower is not a deviation;
   * - do not sum these numbers and call the result the session duration.
   *   The session total additionally carries a transition between
   *   consecutive exercises and is published, already computed, as
   *   `CasSessionDraftV1.estimatedDurationMinutes`;
   * - do not compute a missing value. Absence is stated below.
   *
   * Optional for two distinct reasons, and a consumer cannot tell them
   * apart from the field alone — nor does it need to, because the response
   * to both is the same: show no duration for that exercise.
   * 1. Backward type compatibility: this shape predates the field, so
   *    requiring it would break any consumer that builds a
   *    `CasPrescribedExerciseV1` literal (see the contract evolution policy
   *    at the top of this file).
   * 2. CAS genuinely could not estimate this exercise — its volume
   *    structure has no duration model, or the resolved volume lacks a
   *    value the estimate needs. CAS omits the field rather than publishing
   *    a guess; the `"duration_validation"` decision trace entry names the
   *    exercise and the reason.
   */
  estimatedDurationSeconds?: number;
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
  /** `true` for a `"primary"`-module exercise, `false` for `"secondary"`/`"support"`. */
  required: boolean;
  /**
   * Optional for backward type compatibility only — this shape predates the
   * field (it is what `missingSourceData` has always carried), so requiring
   * it would break any consumer that builds a `CasPrescriptionGapV1`
   * literal. CAS always emits it; an absent value means the gap comes from
   * a v1 payload written before 2026-08-03, not that the reason is unknown.
   */
  reasonCode?: UnprescribedExerciseReasonCode;
  /** Human-readable restatement of `reasonCode` — never a second, different reason. */
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

/**
 * THE THREE LISTS, AND WHAT EACH ONE MEANS.
 *
 * A consumer reads all three; it never derives one from the others.
 *
 * - `CasSessionDraftV1.modules[].exercises` — what CAS DECIDED the athlete
 *   should train. This is the training decision, and it is complete: an
 *   exercise is never removed from it because a downstream stage could not
 *   dose it.
 * - `CasPrescribedSessionV1.exercises` — what CAS actually DOSED (sets,
 *   repetitions, intensity, rest, tempo, instructions, stop conditions).
 * - `unprescribedSelectedExercises` — the difference between the two, named
 *   and explained by CAS itself.
 *
 * The engine is what computes that difference. A consumer must NOT diff the
 * draft against the prescription, must NOT infer why an exercise is
 * missing, and must NOT decide for itself whether the result counts as
 * partial — those are training decisions, and they stay in CAS. What a
 * consumer SHOULD do is surface the gap: show the exercise, show that it
 * carries no prescription, and show the reason CAS gave. Silently hiding an
 * omitted exercise and silently presenting the session as fully dosed are
 * both misrepresentations of what the engine returned.
 *
 * WHY `unprescribedSelectedExercises` IS OPTIONAL, AND WHAT THAT DOES NOT
 * MEAN.
 *
 * It is declared `?` purely for backward TYPE compatibility. Every other
 * collection in this contract (`warnings`, `rejectedExercises`,
 * `conflicts`, `omittedOptionalExerciseIds`) is a required,
 * possibly-empty array, and this one would match that convention were it
 * not arriving after v1 was already published. Making it required would
 * not break a JSON reader, but it WOULD break, at compile time, any
 * TypeScript consumer that constructs, fixtures, mocks or exhaustively
 * types a `CasPrescriptionOutcomeV1` — and such consumers demonstrably
 * exist, including inside this repository. That is a real break, so the
 * field is optional and v1 stays v1.
 *
 * The optionality is a statement about OLD objects, never about new ones:
 *
 * - Any output produced by `serializeEngineRunResult` after 2026-08-03
 *   ALWAYS carries this field — `[]` when nothing was omitted, populated
 *   otherwise. There is no code path that emits a fresh output without it.
 * - A v1 object that lacks it is necessarily older than this change: a
 *   persisted payload, a stored fixture, or a hand-built literal written
 *   before the field existed.
 *
 * Consumers must therefore read it as `unprescribedSelectedExercises ?? []`.
 * An absent field means "this payload predates the field", NOT "nothing was
 * omitted" — for such a payload the omission list was never recorded and
 * cannot be recovered. A consumer must not reconstruct it by diffing the
 * session draft against the prescription: that computation is a training
 * decision and it stays in CAS (see above).
 *
 * On `"unavailable"`, this is a superset of `missingSourceData`: that field
 * keeps its original meaning (the *required* gaps that caused the status),
 * while this one is the complete omission record including non-required
 * gaps. Reading either alone is correct for its own question.
 *
 * Each omission is also carried twice more, for consumers that read those
 * surfaces instead: one `"prescription_generation"` entry in
 * `CasDecisionTraceV1.entries` (id suffix `_omitted`), and one string in
 * `CasDecisionTraceV1.warnings`. This list stays the source of truth — the
 * other two restate it and never add to it.
 */
export type CasPrescriptionOutcomeV1 =
  | {
      status: "prescribed";
      session: CasPrescribedSessionV1;
      unprescribedSelectedExercises?: readonly CasPrescriptionGapV1[];
    }
  | {
      status: "unavailable";
      missingSourceData: readonly CasPrescriptionGapV1[];
      unprescribedSelectedExercises?: readonly CasPrescriptionGapV1[];
    }
  | {
      status: "failed";
      failure: CasPrescriptionFailureV1;
      unprescribedSelectedExercises?: readonly CasPrescriptionGapV1[];
    };

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

/**
 * Whether the finished session is the session that was requested.
 *
 * - `adequate` — the requested adaptation is driven and the session uses the
 *   requested time reasonably.
 * - `partial` — the adaptation IS driven, but a named gap remains (typically
 *   a large amount of unused time).
 * - `inadequate` — CAS cannot claim to have fulfilled the primary objective.
 *
 * A short session is NOT inadequate by itself: the engine deliberately
 * produces the smallest session that delivers the adaptation, and never adds
 * work because time remains.
 */
export type CasSessionAdequacyStatusV1 = SessionAdequacyStatus;

export interface CasSessionAdequacyFindingV1 {
  ruleId: SessionAdequacyRuleId;
  reasonCode: SessionAdequacyReasonCode;
  sourceRuleIds: readonly Identifier[];
  description: string;
}

export interface CasSessionAdequacyV1 {
  status: CasSessionAdequacyStatusV1;
  primaryAdaptationCovered: boolean;
  requestedDurationMinutes: number;
  /** `null` when the session could not be estimated. */
  estimatedDurationMinutes: number | null;
  /** Estimated ÷ requested, two decimals. `null` without an estimate. */
  durationCoverageRatio: number | null;
  prescribedExerciseCount: number;
  /** Prescribed exercises in the primary module that drive the requested adaptation. */
  drivingExerciseIds: readonly Identifier[];
  /** Whether CAS tried to repair an uncovered session, and what it added. */
  repairAttempted: boolean;
  repairAddedExerciseIds: readonly Identifier[];
  findings: readonly CasSessionAdequacyFindingV1[];
}

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
      /** See the v1 additive history entry of 2026-08-06. */
      sessionAdequacy?: CasSessionAdequacyV1;
      decisionTrace: CasDecisionTraceV1;
      exerciseReferences: CasExerciseReferencesV1;
    };
