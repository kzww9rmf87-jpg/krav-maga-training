/**
 * Combat Athlete System — Public Session Output Serializer
 * Version 1 ("cas-session-output.v1")
 *
 * Projects an `EngineRunResult` (plus the exercise pool `runEngine` was
 * called with, and an injected `generatedAt`) into `CasSessionOutputV1`.
 *
 * This is a pure projection:
 * - it takes no business decision — every value already exists on
 *   `result`, it is only renamed/reshaped into a public DTO;
 * - it recomputes no score, modifies no prescription, invents no
 *   presentation text;
 * - it never calls `new Date()`/`Date.now()` — `generatedAt` is always the
 *   caller's value, exactly as received;
 * - given the same `result`/`exercises`/`generatedAt`, it always produces
 *   byte-identical JSON (see `exerciseReferences.ts` for the sorted-key
 *   guarantee that makes this true regardless of `Set`/`Map` iteration
 *   order).
 *
 * Open-vs-closed field audit (point 8 of the approved architecture):
 * `CasIntensityTargetV1`'s `category` variant, `CasStopConditionTriggerV1.type`
 * and `.metric`, `CasIntensityReferenceV1.unit`, and
 * `CasIntensityCalculationInputV1.name`/`.unit` all stay typed `string`
 * (or a union including `string`) because their internal counterparts in
 * `prescription/types.ts` are themselves declared open — narrowing them
 * here would invent structure the engine's own contract does not
 * guarantee. Every other field reuses the internal closed vocabulary
 * directly (`CapabilityModule`, `AdaptationDomain`, `TrainingMethodId`,
 * `DecisionStage`, `ConflictType`, etc.) per the validated architecture.
 *
 * `CasSessionDraftV1` never embeds an unselected candidate, a full
 * `ExerciseDefinition`, a fatigue profile, a contraindication or a score
 * breakdown — only the exercise actually selected per module, its id and
 * its selection reasons. `CasPrescriptionFailureV1` never embeds the
 * internal per-exercise resolver trace (`exerciseResults`) — only the
 * aggregate `issues` list plus the ids that failed (`failedExerciseIds`),
 * derived by filtering `exerciseResults` for `ok: false`, never by new
 * judgment.
 *
 * `estimatedDurationSeconds` obeys the same rule as everything else here:
 * it is READ from `result.durationEstimate`, the estimate `runEngine`
 * already produced, and this file never calls the estimator. A duration
 * computed here would be a second answer to a question the engine has
 * already answered — and one that could disagree with the session total the
 * time-budget reduction acted on.
 */

import type {
  ConflictResolution,
  DecisionTrace,
  DecisionTraceEntry,
  DetectedConflict,
  EngineRunResult,
  ExerciseDefinition,
  ExerciseRejectionReason,
  Identifier,
  InitialGeneratedModule,
  InitialSessionDraft,
  SelectedModule,
  ValidationIssue,
  ValidationResult,
} from "../types";
import type { EngineSessionPrescriptionOutcome } from "../prescription/prescribeEngineSession";
import type { PrescribeExerciseResult, ExercisePrescription } from "../prescription/prescribeExercise";
import type { PrescribeSessionFailure, PrescribedSessionExercise, SessionPrescription } from "../prescription/prescribeSession";
import type { PrescriptionSourceGap } from "../prescription/buildPrescriptionInput";
import type { PrescriptionDurationEstimate } from "../prescription/estimatePrescriptionDuration";
import type {
  DistanceTarget,
  DurationTarget,
  IntensityAdjustment,
  IntensityCalculation,
  IntensityCalculationInput,
  IntensityMetric,
  IntensityReference,
  IntensityTarget,
  MovementIntent,
  PrescriptionIntensity,
  PrescriptionLaterality,
  PrescriptionRest,
  PrescriptionTempo,
  PrescriptionVolume,
  RepetitionTarget,
  RestAdjustment,
  RestTarget,
  StopCondition,
  StopConditionInstruction,
  StopConditionThreshold,
  StopConditionTrigger,
  TempoAdjustment,
  TempoPhase,
  PrescriptionInstruction,
} from "../prescription/types";

import { buildExerciseReferences, collectReferencedExerciseIds } from "./exerciseReferences";
import type {
  CasBlockedReasonV1,
  CasConflictResolutionV1,
  CasConflictV1,
  CasDecisionTraceEntryV1,
  CasDecisionTraceV1,
  CasDistanceTargetV1,
  CasDurationTargetV1,
  CasExerciseRejectionReasonV1,
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
  CasRepetitionTargetV1,
  CasRestAdjustmentV1,
  CasRestTargetV1,
  CasRestV1,
  CasSelectedExerciseV1,
  CasSelectedModuleV1,
  CasSessionDraftV1,
  CasSessionModuleV1,
  CasSessionObjectiveV1,
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
  CasInstructionV1,
  CasExercisePrescriptionV1,
  CasSessionOutputV1,
} from "./types";

// -----------------------------------------------------------------------------
// Validation / selected modules
// -----------------------------------------------------------------------------

function mapValidationIssue(issue: ValidationIssue): CasValidationIssueV1 {
  return { code: issue.code, path: issue.path, message: issue.message, severity: issue.severity };
}

function mapValidationResult(validation: ValidationResult): CasValidationResultV1 {
  return { valid: validation.valid, issues: validation.issues.map(mapValidationIssue) };
}

function mapSelectedModule(selectedModule: SelectedModule): CasSelectedModuleV1 {
  return {
    module: selectedModule.module,
    role: selectedModule.role,
    primaryAdaptation: selectedModule.primaryAdaptation,
    reason: selectedModule.reason,
  };
}

// -----------------------------------------------------------------------------
// Session draft
// -----------------------------------------------------------------------------

function mapSessionObjective(objective: InitialSessionDraft["primaryObjective"]): CasSessionObjectiveV1 {
  return {
    adaptationDomain: objective.adaptationDomain,
    physicalQualities: objective.physicalQualities,
    requestedModules: objective.requestedModules,
    description: objective.description,
  };
}

function mapGeneratedModule(generatedModule: InitialGeneratedModule): CasSessionModuleV1 {
  const selectedExercises: CasSelectedExerciseV1[] = generatedModule.exerciseSelection.candidates
    .filter((candidate) => candidate.selected)
    .map((candidate) => ({
      exerciseId: candidate.scoredExercise.exercise.id,
      selectionReasons: candidate.selectionReasons,
    }));

  return {
    order: generatedModule.order,
    selectedModule: mapSelectedModule(generatedModule.selectedModule),
    estimatedDurationMinutes: generatedModule.estimatedDurationMinutes,
    exercises: selectedExercises,
  };
}

function mapSessionDraft(draft: InitialSessionDraft): CasSessionDraftV1 {
  return {
    sessionId: draft.sessionId,
    title: draft.title,
    primaryObjective: mapSessionObjective(draft.primaryObjective),
    secondaryObjectives: draft.secondaryObjectives.map(mapSessionObjective),
    estimatedDurationMinutes: draft.estimatedDurationMinutes,
    confidence: draft.confidence,
    modules: draft.modules.map(mapGeneratedModule),
  };
}

// -----------------------------------------------------------------------------
// Conflicts
// -----------------------------------------------------------------------------

function mapConflict(conflict: DetectedConflict): CasConflictV1 {
  return {
    conflictId: conflict.id,
    type: conflict.type,
    severity: conflict.severity,
    probability: conflict.probability,
    description: conflict.description,
    affectedExerciseIds: conflict.affectedExerciseIds,
    affectedModules: conflict.affectedModules,
    resolutionRequired: conflict.resolutionRequired,
  };
}

function mapConflictResolution(resolution: ConflictResolution): CasConflictResolutionV1 {
  return {
    conflictId: resolution.conflictId,
    action: resolution.action,
    description: resolution.description,
    removedExerciseIds: resolution.removedExerciseIds,
    addedExerciseIds: resolution.addedExerciseIds,
  };
}

// -----------------------------------------------------------------------------
// Prescription — volume / répétitions / durée / distance / latéralité
// -----------------------------------------------------------------------------

function mapRepetitionTarget(target: RepetitionTarget): CasRepetitionTargetV1 {
  return target;
}

function mapDurationTarget(target: DurationTarget): CasDurationTargetV1 {
  return { value: target.value, unit: target.unit, scope: target.scope };
}

function mapDistanceTarget(target: DistanceTarget): CasDistanceTargetV1 {
  return { value: target.value, unit: target.unit, scope: target.scope };
}

function mapLaterality(laterality: PrescriptionLaterality): CasLateralityV1 {
  return {
    laterality: laterality.laterality,
    interpretation: laterality.interpretation,
    startingSide: laterality.startingSide,
    sideSwitchRuleId: laterality.sideSwitchRuleId,
  };
}

function mapVolume(volume: PrescriptionVolume): CasVolumeV1 {
  return {
    structure: volume.structure,
    sets: volume.sets,
    repetitions: volume.reps === null ? null : mapRepetitionTarget(volume.reps),
    duration: volume.duration === null ? null : mapDurationTarget(volume.duration),
    distance: volume.distance === null ? null : mapDistanceTarget(volume.distance),
    rounds: volume.rounds,
    workIntervals: volume.workIntervals,
    laterality: volume.laterality === null ? null : mapLaterality(volume.laterality),
  };
}

// -----------------------------------------------------------------------------
// Prescription — intensité
// -----------------------------------------------------------------------------

function mapIntensityTarget(target: IntensityTarget): CasIntensityTargetV1 {
  return target;
}

function mapIntensityReference(reference: IntensityReference): CasIntensityReferenceV1 {
  return {
    referenceType: reference.referenceType,
    value: reference.value,
    unit: reference.unit,
    sourceId: reference.sourceId,
    measuredAt: reference.measuredAt,
    validUntil: reference.validUntil,
    confidence: reference.confidence,
  };
}

function mapIntensityMetric(metric: IntensityMetric): CasIntensityMetricV1 {
  return {
    type: metric.type,
    target: mapIntensityTarget(metric.target),
    unit: metric.unit,
    scope: metric.scope,
    reference: metric.reference === null ? null : mapIntensityReference(metric.reference),
  };
}

function mapIntensityCalculationInput(input: IntensityCalculationInput): CasIntensityCalculationInputV1 {
  return { name: input.name, value: input.value, unit: input.unit, sourceId: input.sourceId };
}

function mapIntensityCalculation(calculation: IntensityCalculation): CasIntensityCalculationV1 {
  return {
    calculationId: calculation.calculationId,
    formulaId: calculation.formulaId,
    inputs: calculation.inputs.map(mapIntensityCalculationInput),
    rawResult: calculation.rawResult,
    roundedResult: calculation.roundedResult,
    outputUnit: calculation.outputUnit,
    sourceRuleIds: calculation.sourceRuleIds,
  };
}

function mapIntensityAdjustment(adjustment: IntensityAdjustment): CasIntensityAdjustmentV1 {
  return {
    adjustmentId: adjustment.adjustmentId,
    reason: adjustment.reason,
    previousMetric: adjustment.previousMetric === null ? null : mapIntensityMetric(adjustment.previousMetric),
    adjustedMetric: adjustment.adjustedMetric === null ? null : mapIntensityMetric(adjustment.adjustedMetric),
    sourceRuleId: adjustment.sourceRuleId,
  };
}

function mapIntensity(intensity: PrescriptionIntensity): CasIntensityV1 {
  return {
    primaryMetric: mapIntensityMetric(intensity.primaryMetric),
    secondaryMetrics: intensity.secondaryMetrics.map(mapIntensityMetric),
    calculation: intensity.calculation === null ? null : mapIntensityCalculation(intensity.calculation),
    adjustments: intensity.adjustments.map(mapIntensityAdjustment),
    sourceRuleIds: intensity.sourceRuleIds,
    status: intensity.status,
  };
}

// -----------------------------------------------------------------------------
// Prescription — repos
// -----------------------------------------------------------------------------

function mapRestTarget(target: RestTarget): CasRestTargetV1 {
  switch (target.type) {
    case "fixed":
      return { type: "fixed", duration: mapDurationTarget(target.duration) };
    case "range":
      return {
        type: "range",
        min: mapDurationTarget(target.min),
        max: mapDurationTarget(target.max),
        selectionRuleId: target.selectionRuleId,
      };
    case "conditional":
      return {
        type: "conditional",
        conditionId: target.conditionId,
        minimum: target.minimum === null ? null : mapDurationTarget(target.minimum),
        maximum: target.maximum === null ? null : mapDurationTarget(target.maximum),
      };
    case "fixed_with_condition":
      return {
        type: "fixed_with_condition",
        duration: mapDurationTarget(target.duration),
        conditionId: target.conditionId,
      };
    case "range_with_condition":
      return {
        type: "range_with_condition",
        min: mapDurationTarget(target.min),
        max: mapDurationTarget(target.max),
        conditionId: target.conditionId,
        selectionRuleId: target.selectionRuleId,
      };
  }
}

function mapRestAdjustment(adjustment: RestAdjustment): CasRestAdjustmentV1 {
  return {
    adjustmentId: adjustment.adjustmentId,
    reason: adjustment.reason,
    field: adjustment.field,
    previousValue: adjustment.previousValue === null ? null : mapRestTarget(adjustment.previousValue),
    adjustedValue: adjustment.adjustedValue === null ? null : mapRestTarget(adjustment.adjustedValue),
    sourceRuleId: adjustment.sourceRuleId,
  };
}

function mapRest(rest: PrescriptionRest): CasRestV1 {
  return {
    type: rest.type,
    betweenReps: rest.betweenReps === null ? null : mapRestTarget(rest.betweenReps),
    betweenClusters: rest.betweenClusters === null ? null : mapRestTarget(rest.betweenClusters),
    betweenSets: rest.betweenSets === null ? null : mapRestTarget(rest.betweenSets),
    betweenRounds: rest.betweenRounds === null ? null : mapRestTarget(rest.betweenRounds),
    betweenIntervals: rest.betweenIntervals === null ? null : mapRestTarget(rest.betweenIntervals),
    betweenExercises: rest.betweenExercises === null ? null : mapRestTarget(rest.betweenExercises),
    afterBlock: rest.afterBlock === null ? null : mapRestTarget(rest.afterBlock),
    adjustments: rest.adjustments.map(mapRestAdjustment),
    sourceRuleIds: rest.sourceRuleIds,
    status: rest.status,
  };
}

// -----------------------------------------------------------------------------
// Prescription — tempo
// -----------------------------------------------------------------------------

function mapTempoPhase(phase: TempoPhase): CasTempoPhaseV1 {
  return phase;
}

function mapTempoPhaseOrIntent(
  value: TempoPhase | MovementIntent | null,
): CasTempoPhaseV1 | MovementIntent | null {
  if (value === null || typeof value === "string") {
    return value;
  }
  return mapTempoPhase(value);
}

function mapTempoAdjustment(adjustment: TempoAdjustment): CasTempoAdjustmentV1 {
  return {
    adjustmentId: adjustment.adjustmentId,
    reason: adjustment.reason,
    field: adjustment.field,
    previousValue: mapTempoPhaseOrIntent(adjustment.previousValue),
    adjustedValue: mapTempoPhaseOrIntent(adjustment.adjustedValue),
    sourceRuleId: adjustment.sourceRuleId,
  };
}

function mapTempo(tempo: PrescriptionTempo): CasTempoV1 {
  return {
    type: tempo.type,
    eccentric: tempo.eccentric === null ? null : mapTempoPhase(tempo.eccentric),
    bottom: tempo.bottom === null ? null : mapTempoPhase(tempo.bottom),
    concentric: tempo.concentric === null ? null : mapTempoPhase(tempo.concentric),
    top: tempo.top === null ? null : mapTempoPhase(tempo.top),
    hold: tempo.hold === null ? null : mapTempoPhase(tempo.hold),
    globalIntent: tempo.globalIntent,
    adjustments: tempo.adjustments.map(mapTempoAdjustment),
    sourceRuleIds: tempo.sourceRuleIds,
    status: tempo.status,
  };
}

// -----------------------------------------------------------------------------
// Prescription — instructions / stopConditions
// -----------------------------------------------------------------------------

function mapInstruction(instruction: PrescriptionInstruction): CasInstructionV1 {
  return {
    instructionId: instruction.instructionId,
    category: instruction.category,
    text: instruction.text,
    sourceRuleId: instruction.sourceRuleId,
    priority: instruction.priority,
  };
}

function mapStopConditionTrigger(trigger: StopConditionTrigger): CasStopConditionTriggerV1 {
  return {
    type: trigger.type,
    metric: trigger.metric,
    operator: trigger.operator,
    expectedValue: trigger.expectedValue,
    unit: trigger.unit,
    evaluationTiming: trigger.evaluationTiming,
  };
}

function mapStopConditionThreshold(threshold: StopConditionThreshold): CasStopConditionThresholdV1 {
  return threshold;
}

function mapStopConditionInstruction(instruction: StopConditionInstruction): CasStopConditionInstructionV1 {
  return {
    instructionId: instruction.instructionId,
    audience: instruction.audience,
    text: instruction.text,
    sourceRuleId: instruction.sourceRuleId,
  };
}

function mapStopCondition(stopCondition: StopCondition): CasStopConditionV1 {
  return {
    conditionId: stopCondition.conditionId,
    category: stopCondition.category,
    scope: stopCondition.scope,
    trigger: mapStopConditionTrigger(stopCondition.trigger),
    threshold: stopCondition.threshold === null ? null : mapStopConditionThreshold(stopCondition.threshold),
    action: stopCondition.action,
    priority: stopCondition.priority,
    recoverability: stopCondition.recoverability,
    instructions: stopCondition.instructions.map(mapStopConditionInstruction),
    sourceRuleIds: stopCondition.sourceRuleIds,
  };
}

// -----------------------------------------------------------------------------
// Prescription — exercice et séance prescrite
// -----------------------------------------------------------------------------

function mapExercisePrescription(prescription: ExercisePrescription): CasExercisePrescriptionV1 {
  return {
    exerciseId: prescription.exerciseId,
    moduleId: prescription.moduleId,
    role: prescription.role,
    methodId: prescription.methodId,
    volume: mapVolume(prescription.volume),
    intensity: mapIntensity(prescription.intensity),
    rest: prescription.rest === null ? null : mapRest(prescription.rest),
    tempo: prescription.tempo === null ? null : mapTempo(prescription.tempo),
    instructions: prescription.instructions.map(mapInstruction),
    stopConditions: prescription.stopConditions.map(mapStopCondition),
    sourceRuleIds: prescription.sourceRuleIds,
    status: prescription.status,
  };
}

/**
 * The seconds to publish for one prescribed exercise, or `undefined` when
 * there are none to publish.
 *
 * This function does no arithmetic: it reads `totalSeconds` off the estimate
 * `runEngine` already produced. Recomputing here would create a second
 * duration for the same exercise, able to disagree with the session total
 * the engine reduced the session against — the very thing having one
 * canonical estimate prevents.
 *
 * Three cases yield `undefined`, and all three mean the same thing to a
 * consumer (no duration for this exercise):
 * - the result carries no estimate at all (a hand-built `EngineRunResult`,
 *   or a run whose prescription never reached `"prescribed"`);
 * - the estimator failed on this exercise (`ok: false`) — an unmodelled
 *   volume structure or incomplete resolved volume;
 * - the estimate does not describe this exercise. Alignment is positional
 *   and guaranteed by construction, so this last case cannot arise from a
 *   real `runEngine` result; the id is still checked, because publishing
 *   one exercise's duration beside another's doses would be a lie the type
 *   system cannot catch, and silence is the honest failure.
 */
function readEstimatedDurationSeconds(
  prescribedExercise: PrescribedSessionExercise,
  estimate: PrescriptionDurationEstimate | undefined,
): number | undefined {
  if (estimate === undefined || !estimate.ok) {
    return undefined;
  }
  if (estimate.exerciseId !== prescribedExercise.prescription.exerciseId) {
    return undefined;
  }
  return estimate.totalSeconds;
}

function mapPrescribedExercise(
  prescribedExercise: PrescribedSessionExercise,
  estimate: PrescriptionDurationEstimate | undefined,
): CasPrescribedExerciseV1 {
  const estimatedDurationSeconds = readEstimatedDurationSeconds(prescribedExercise, estimate);

  return {
    order: prescribedExercise.order,
    blockId: prescribedExercise.blockId,
    required: prescribedExercise.required,
    // Omitted, never set to `undefined`: an unestimable exercise carries no
    // key at all, exactly as an unprescribed run carries no `prescription`
    // key. `undefined` would survive in the TypeScript object and vanish in
    // the JSON, so the two representations would disagree.
    ...(estimatedDurationSeconds === undefined ? {} : { estimatedDurationSeconds }),
    prescription: mapExercisePrescription(prescribedExercise.prescription),
  };
}

/**
 * `exerciseEstimates` is positionally aligned with `session.exercises` —
 * both are produced from the same prescribed session, in the same order (see
 * `estimateFor` in `index.ts`). It is empty for any caller that has no
 * estimate, and every exercise then serializes exactly as it did before this
 * field existed.
 */
function mapPrescribedSession(
  session: SessionPrescription,
  exerciseEstimates: readonly PrescriptionDurationEstimate[],
): CasPrescribedSessionV1 {
  return {
    sessionId: session.sessionId,
    sessionName: session.sessionName,
    modules: session.modules,
    exercises: session.exercises.map((prescribedExercise, index) =>
      mapPrescribedExercise(prescribedExercise, exerciseEstimates[index]),
    ),
    sourceRuleIds: session.sourceRuleIds,
    status: session.status,
  };
}

function mapPrescriptionGap(gap: PrescriptionSourceGap): CasPrescriptionGapV1 {
  return {
    exerciseId: gap.exerciseId,
    moduleId: gap.moduleId,
    required: gap.required,
    reasonCode: gap.reasonCode,
    reason: gap.reason,
  };
}

/** Ids whose per-exercise resolver attempt did not succeed — filtered from the internal per-exercise trace, never exposed itself. */
function collectFailedExerciseIds(exerciseResults: readonly PrescribeExerciseResult[]): Identifier[] {
  return exerciseResults.filter((exerciseResult) => !exerciseResult.ok).map((exerciseResult) => exerciseResult.exerciseId);
}

function mapPrescriptionFailure(failure: PrescribeSessionFailure): CasPrescriptionFailureV1 {
  return {
    sessionId: failure.sessionId,
    issues: failure.issues.map(
      (issue): CasPrescriptionIssueV1 => ({
        code: issue.code,
        message: issue.message,
        exerciseId: issue.exerciseId,
        recoverable: issue.recoverable,
      }),
    ),
    failedExerciseIds: collectFailedExerciseIds(failure.exerciseResults),
    omittedOptionalExerciseIds: failure.omittedOptionalExerciseIds,
    sourceRuleIds: failure.sourceRuleIds,
  };
}

/**
 * `unprescribedSelectedExercises` is projected on every status, in the
 * engine's own order (`draft.modules` order, never re-sorted here), so a
 * consumer never has to diff `sessionDraft` against
 * `prescription.session.exercises` to find an omitted exercise.
 *
 * The field is declared optional on `CasPrescriptionOutcomeV1` for backward
 * TYPE compatibility with v1 objects that predate it — the type therefore
 * no longer forces this function to set it. Emitting it unconditionally
 * (`[]` included) is a guarantee this serializer makes on purpose, not one
 * the compiler checks, so it is covered by tests rather than by the type.
 * The same holds for `reasonCode` in `mapPrescriptionGap` above.
 */
function mapPrescriptionOutcome(
  outcome: EngineSessionPrescriptionOutcome,
  exerciseEstimates: readonly PrescriptionDurationEstimate[],
): CasPrescriptionOutcomeV1 {
  const unprescribedSelectedExercises = outcome.unprescribedSelectedExercises.map(mapPrescriptionGap);

  switch (outcome.status) {
    case "prescribed":
      return {
        status: "prescribed",
        session: mapPrescribedSession(outcome.session, exerciseEstimates),
        unprescribedSelectedExercises,
      };
    case "unavailable":
      return {
        status: "unavailable",
        missingSourceData: outcome.missingSourceData.map(mapPrescriptionGap),
        unprescribedSelectedExercises,
      };
    case "failed":
      return {
        status: "failed",
        failure: mapPrescriptionFailure(outcome.failure),
        unprescribedSelectedExercises,
      };
  }
}

// -----------------------------------------------------------------------------
// Decision Trace
// -----------------------------------------------------------------------------

function mapExerciseRejectionReason(reason: ExerciseRejectionReason): CasExerciseRejectionReasonV1 {
  return { code: reason.code, message: reason.message, hardConstraint: reason.hardConstraint };
}

function mapDecisionTraceEntry(entry: DecisionTraceEntry): CasDecisionTraceEntryV1 {
  return {
    id: entry.id,
    timestamp: entry.timestamp,
    stage: entry.stage,
    decision: entry.decision,
    reasons: entry.reasons,
    inputReferences: entry.inputReferences,
    affectedExerciseIds: entry.affectedExerciseIds,
    affectedModules: entry.affectedModules,
    confidence: entry.confidence,
    sourceRuleIds: entry.sourceRuleIds,
  };
}

function mapDecisionTrace(trace: DecisionTrace): CasDecisionTraceV1 {
  return {
    traceId: trace.traceId,
    entries: trace.entries.map(mapDecisionTraceEntry),
    rejectedExercises: trace.rejectedExercises.map((rejected) => ({
      exerciseId: rejected.exerciseId,
      reasons: rejected.reasons.map(mapExerciseRejectionReason),
    })),
    detectedConflicts: trace.detectedConflicts.map(mapConflict),
    conflictResolutions: trace.conflictResolutions.map(mapConflictResolution),
    warnings: trace.warnings,
  };
}

// -----------------------------------------------------------------------------
// Public entry point
// -----------------------------------------------------------------------------

/**
 * Projects `result` (plus the `exercises` pool `runEngine` was called
 * with) into `CasSessionOutputV1`. `generatedAt` is always the caller's
 * injected value — this function never reads the system clock.
 */
export function serializeEngineRunResult(
  result: EngineRunResult,
  exercises: readonly ExerciseDefinition[],
  generatedAt: string,
): CasSessionOutputV1 {
  if (result.outcome === "invalid_input") {
    const decisionTrace = mapDecisionTrace(result.decisionTrace);
    const exerciseReferences = buildExerciseReferences(
      collectReferencedExerciseIds({ decisionTrace }),
      exercises,
    );

    return {
      contractVersion: "cas-session-output.v1",
      engineVersion: "0.1",
      generatedAt,
      outcome: "invalid_input",
      validation: mapValidationResult(result.validation),
      decisionTrace,
      exerciseReferences,
    };
  }

  if (result.outcome === "blocked") {
    const decisionTrace = mapDecisionTrace(result.decisionTrace);
    const exerciseReferences = buildExerciseReferences(
      collectReferencedExerciseIds({ decisionTrace }),
      exercises,
    );
    const blockedReason: CasBlockedReasonV1 = {
      reasonCode: result.sessionResult.reasonCode,
      message: result.sessionResult.reason,
      blockedModules: result.sessionResult.blockedModules,
    };

    return {
      contractVersion: "cas-session-output.v1",
      engineVersion: "0.1",
      generatedAt,
      outcome: "blocked",
      validation: mapValidationResult(result.validation),
      selectedModules: result.selectedModules.map(mapSelectedModule),
      blockedReason,
      decisionTrace,
      exerciseReferences,
    };
  }

  const decisionTrace = mapDecisionTrace(result.decisionTrace);
  const sessionDraft = mapSessionDraft(result.sessionDraft);
  const conflicts = result.conflicts.map(mapConflict);
  const conflictResolutions = result.conflictResolutions.map(mapConflictResolution);
  const prescription =
    result.prescription === undefined
      ? undefined
      : mapPrescriptionOutcome(result.prescription, result.durationEstimate?.exerciseEstimates ?? []);

  const exerciseReferences = buildExerciseReferences(
    collectReferencedExerciseIds({ decisionTrace, conflicts, conflictResolutions, sessionDraft, prescription }),
    exercises,
  );

  // A historical two-argument `runEngine` call never gains a `prescription`
  // field (see `index.ts`) — this projection preserves that exactly: the
  // key itself is omitted, never set to `undefined`.
  return {
    contractVersion: "cas-session-output.v1",
    engineVersion: "0.1",
    generatedAt,
    outcome: "draft",
    validation: mapValidationResult(result.validation),
    selectedModules: result.selectedModules.map(mapSelectedModule),
    sessionDraft,
    conflicts,
    conflictResolutions,
    ...(prescription === undefined ? {} : { prescription }),
    // Copied field by field rather than spread: the public contract and the
    // engine's evaluation are separate types that happen to agree today, and
    // a future internal field must not leak into the contract by accident.
    sessionAdequacy: {
      status: result.sessionAdequacy.status,
      primaryAdaptationCovered: result.sessionAdequacy.primaryAdaptationCovered,
      requestedDurationMinutes: result.sessionAdequacy.requestedDurationMinutes,
      estimatedDurationMinutes: result.sessionAdequacy.estimatedDurationMinutes,
      durationCoverageRatio: result.sessionAdequacy.durationCoverageRatio,
      prescribedExerciseCount: result.sessionAdequacy.prescribedExerciseCount,
      drivingExerciseIds: [...result.sessionAdequacy.drivingExerciseIds],
      repairAttempted: result.sessionAdequacy.repairAttempted,
      repairAddedExerciseIds: [...result.sessionAdequacy.repairAddedExerciseIds],
      findings: result.sessionAdequacy.findings.map((finding) => ({
        ruleId: finding.ruleId,
        reasonCode: finding.reasonCode,
        sourceRuleIds: [...finding.sourceRuleIds],
        description: finding.description,
      })),
    },
    decisionTrace,
    exerciseReferences,
  };
}
