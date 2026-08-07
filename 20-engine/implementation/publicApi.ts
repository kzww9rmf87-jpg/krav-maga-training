/**
 * Combat Athlete System — Public API
 * Version 0.1
 *
 * THE ONLY MODULE AN EXTERNAL CONSUMER IMPORTS.
 *
 * VITA, a bridge process, an HTTP handler or any future client depends on
 * this file and nothing else in the repository. Everything reachable from
 * here is part of the product contract and moves under the versioning rules
 * the two contract files document; everything else is an implementation
 * detail that may change in any lot without notice.
 *
 * WHAT THIS SURFACE DELIBERATELY DOES NOT EXPORT, and why each absence
 * matters more than the exports do:
 *
 * - `runEngine` — its signature takes `EngineInput`, an internal type. A
 *   consumer calling it would be compiling against engine internals and
 *   would also have to know that prescription runs on every draft, that the
 *   third argument is an override, and which exercise catalog to pass.
 *   `generateCasSession` answers all of that itself.
 * - `EngineInput` and every type reachable only from it.
 * - `EXERCISE_KNOWLEDGE_BASE` — a consumer that reads the catalog ends up
 *   maintaining a second copy of it. The output already carries a
 *   `displayName` for every exercise it mentions (`exerciseReferences`), so
 *   nothing needs the catalog to render a session.
 * - the prescription registries, numerical profiles and their validators.
 * - `EquipmentCapabilityId` and `RangeContext` — both are things CAS
 *   DERIVES. A consumer holding them would be holding a training decision
 *   (which implements are interchangeable; whether an athlete trains at the
 *   bottom or the middle of a range) that belongs to the engine.
 * - scoring, conflict-resolution, substitution and composition internals.
 *
 * `publicApiSurface.test.ts` enforces every one of those exclusions, at
 * runtime and against this file's own source, so the boundary cannot erode
 * by accident.
 *
 * WHAT IS EXPORTED, and in what form:
 *
 * - `generateCasSession` — the single entry point. Public JSON in, public
 *   JSON out, one call, deterministic under a caller-supplied `generatedAt`,
 *   and it never throws on data a client sent.
 * - the two contract envelopes and every `Cas*V1` shape inside them.
 * - the closed vocabularies those shapes are typed with. These are
 *   re-exported as TYPES ONLY: they are string-literal unions with no
 *   runtime representation, so they add nothing to the module's runtime
 *   surface while letting a consumer type every field without reaching
 *   inward. They follow the contracts' own rule — a member may be ADDED
 *   within v1, so a client must tolerate an unknown one rather than
 *   exhaustively switching on them.
 * - the version constants, so a consumer can negotiate rather than hard-code
 *   a string literal.
 *
 * This file contains no logic. It re-exports, and it documents the boundary.
 */

// -----------------------------------------------------------------------------
// The entry point
// -----------------------------------------------------------------------------

export { generateCasSession } from "./index";

// -----------------------------------------------------------------------------
// Version constants
// -----------------------------------------------------------------------------

/**
 * The input contract this build accepts. A caller sets
 * `CasSessionInputV1.contractVersion` to exactly this value.
 */
export const CAS_SESSION_INPUT_CONTRACT_VERSION = "cas-session-input.v1" as const;

/**
 * The output contract this build produces. Every result carries it as
 * `contractVersion`, so a consumer can branch on the value it actually
 * received rather than on the value it was compiled against.
 */
export const CAS_SESSION_OUTPUT_CONTRACT_VERSION = "cas-session-output.v1" as const;

/**
 * The engine version, carried on every output as `engineVersion`.
 *
 * Deliberately separate from the contract versions: the engine may change
 * how it selects, doses or composes a session — and will — without the
 * shape a consumer sends or reads changing at all. A client that pins
 * behavior to this value is pinning to the wrong thing.
 */
export const CAS_ENGINE_VERSION = "0.1" as const;

// -----------------------------------------------------------------------------
// Public input contract
// -----------------------------------------------------------------------------

export type {
  CasAthleteExperienceV1,
  CasAthleteGoalV1,
  CasAthleteIdentityV1,
  CasAthletePreferenceV1,
  CasAthleteProfileV1,
  CasAthleteRestrictionV1,
  CasAvailableEquipmentV1,
  CasCompletedExerciseSummaryV1,
  CasCompletedSessionV1,
  CasMedicalStateV1,
  CasPainReportV1,
  CasAthleteCapabilityObservationV1,
  CasPerformanceReferenceV1,
  CasReadinessStateV1,
  CasSessionInputV1,
  CasSessionObjectiveV1,
  CasTrainingEnvironmentV1,
  CasTrainingHistoryV1,
  CasTrainingRequestV1,
} from "./sessionInput/types";

// -----------------------------------------------------------------------------
// Public output contract
// -----------------------------------------------------------------------------

export type {
  CasBlockedReasonV1,
  CasConflictResolutionV1,
  CasConflictV1,
  CasDecisionTraceEntryV1,
  CasDecisionTraceV1,
  CasDistanceTargetV1,
  CasDurationTargetV1,
  CasExercisePrescriptionV1,
  CasExerciseReferencesV1,
  CasExerciseRejectionReasonV1,
  CasInstructionV1,
  CasIntensityAdjustmentV1,
  CasIntensityCalculationInputV1,
  CasIntensityCalculationV1,
  CasIntensityMetricV1,
  CasIntensityReferenceV1,
  CasIntensityTargetV1,
  CasIntensityV1,
  CasLateralityV1,
  CasPrescribedExerciseV1,
  CasPrescribedSessionV1,
  CasPrescriptionFailureV1,
  CasPrescriptionGapV1,
  CasPrescriptionIssueV1,
  CasPrescriptionOutcomeV1,
  CasSessionAdequacyFindingV1,
  CasSessionAdequacyStatusV1,
  CasSessionAdequacyV1,
  CasRepetitionTargetV1,
  CasRestAdjustmentV1,
  CasRestTargetV1,
  CasRestV1,
  CasSelectedExerciseV1,
  CasSelectedModuleV1,
  CasSessionDraftV1,
  CasSessionModuleV1,
  CasSessionOutputV1,
  CasStopConditionInstructionV1,
  CasStopConditionThresholdV1,
  CasStopConditionTriggerV1,
  CasStopConditionV1,
  CasTempoAdjustmentV1,
  CasTempoPhaseV1,
  CasTempoV1,
  CasValidationIssueV1,
  CasValidationResultV1,
  CasVolumeV1,
  ExerciseReferenceV1,
} from "./sessionOutput/types";

// -----------------------------------------------------------------------------
// Closed vocabularies — type-only, zero runtime surface
// -----------------------------------------------------------------------------

/**
 * Vocabularies the INPUT contract is typed with. A consumer needs every one
 * of these to construct a request without importing an internal module.
 */
export type {
  AdaptationDomain,
  AthleteLevel,
  BodyRegion,
  CapabilityModule,
  CombatSessionType,
  CombatSport,
  EquipmentType,
  Identifier,
  Laterality,
  MovementPattern,
  PhysicalQuality,
  Rating5,
  RestrictionType,
  Sex,
  SessionIntensity,
  TechnicalLevel,
} from "./types";

/**
 * Vocabularies the OUTPUT contract is typed with, beyond those above.
 *
 * `ValidationErrorCode`, `SessionBlockedReasonCode`,
 * `SessionPrescriptionFailureCode`, `ExerciseRejectionReasonCode` and
 * `UnprescribedExerciseReasonCode` are the five failure vocabularies: a
 * consumer branches on those to tell an invalid request from a blocked one,
 * a failed prescription from an omitted exercise.
 */
export type {
  ConfidenceLevel,
  ConflictType,
  DecisionStage,
  ExerciseRejectionReasonCode,
  SessionBlockedReasonCode,
  SeverityLevel,
  ValidationErrorCode,
} from "./types";

export type { TrainingMethodId } from "./prescription/contracts";
export type { SessionPrescriptionFailureCode } from "./prescription/prescribeSession";
export type { UnprescribedExerciseReasonCode } from "./prescription/buildPrescriptionInput";

/** Prescription vocabularies: how a dose describes itself on the wire. */
export type {
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
} from "./prescription/types";
