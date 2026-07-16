/**
 * Combat Athlete System — Prescription Decision Trace Adapter
 * Version 0.1
 *
 * Pure translation layer from the prescription layer's own resolver traces
 * (`ExercisePrescriptionTrace` / `ExercisePrescriptionFailureTrace`,
 * `PrescribeExerciseResult`, `PrescribeSessionResult`) into
 * `DecisionTraceEntry[]` — the unit the engine's Decision Trace
 * (`types.ts`, `decisionTrace.ts`) is built from.
 *
 * Every entry produced here uses the `"prescription_generation"`
 * `DecisionStage` (see `types.ts`). Multiple entries share that one stage,
 * exactly like `buildModuleSelectionEntries` in `decisionTrace.ts` already
 * emits one entry per selected module under `"module_selection"` — this
 * adapter follows the same, already-established convention rather than
 * inventing a new one.
 *
 * This file:
 * - never recomputes a prescription decision, only reformats one already
 *   made by `prescribeExercise` / `prescribeSession`;
 * - never invents a value absent from the source result (no fabricated
 *   `confidence`, no fabricated identifiers, no fabricated timestamp — the
 *   caller supplies `idPrefix` and `timestamp`, exactly like
 *   `buildDecisionTrace` derives them from `input.request`);
 * - never mutates its inputs;
 * - is not called from `decisionTrace.ts` or `runEngine` — that wiring is
 *   deliberately left for a later task.
 *
 * Entries stay deliberately minimal: identifiers, a short decision
 * sentence, a handful of textual reasons, `sourceRuleIds`, and affected
 * exercise/module identifiers. The full resolved prescription (every
 * volume/intensity/rest/tempo field, every instruction and stop-condition
 * object) is never copied into the trace — it already lives in
 * `PrescribeExerciseResult.prescription` / `.trace`, which this adapter
 * leaves completely untouched.
 */

import type { CapabilityModule, DecisionTraceEntry, Identifier } from "../types";
import type {
  ExercisePrescriptionFailureTrace,
  ExercisePrescriptionTrace,
  PrescribeExerciseResult,
} from "./prescribeExercise";
import type { PrescribeSessionResult } from "./prescribeSession";
import type { PrescriptionVolume } from "./types";

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------

/**
 * Everything the adapter needs but must never invent itself: a stable id
 * prefix (e.g. an engine request id) and a timestamp supplied by the
 * caller — never the system clock, matching `buildDecisionTrace`'s own
 * `input.request.requestId` / `input.request.requestedAt` convention.
 */
export interface PrescriptionTraceContext {
  idPrefix: Identifier;
  timestamp: string;
}

const PRESCRIPTION_GENERATION_STAGE = "prescription_generation" as const;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const summarizeVolume = (volume: PrescriptionVolume): string => {
  const parts: string[] = [`structure=${volume.structure}`];
  if (volume.sets !== null) parts.push(`sets=${volume.sets}`);
  if (volume.reps !== null) parts.push(`reps=${volume.reps.type === "fixed" ? volume.reps.value : `${volume.reps.min}-${volume.reps.max}`}`);
  if (volume.duration !== null) parts.push(`duration=${volume.duration.value}${volume.duration.unit}`);
  if (volume.distance !== null) parts.push(`distance=${volume.distance.value}${volume.distance.unit}`);
  if (volume.rounds !== null) parts.push(`rounds=${volume.rounds}`);
  if (volume.workIntervals !== null) parts.push(`workIntervals=${volume.workIntervals}`);
  return parts.join(", ");
};

// -----------------------------------------------------------------------------
// Per-stage entries (from one exercise's resolver trace)
// -----------------------------------------------------------------------------

function buildStageEntries(
  trace: ExercisePrescriptionTrace | ExercisePrescriptionFailureTrace,
  exerciseId: Identifier,
  moduleId: CapabilityModule,
  context: PrescriptionTraceContext,
): DecisionTraceEntry[] {
  const entries: DecisionTraceEntry[] = [];
  const entryBase = {
    timestamp: context.timestamp,
    stage: PRESCRIPTION_GENERATION_STAGE,
    affectedExerciseIds: [exerciseId],
    affectedModules: [moduleId],
  };
  const idFor = (stageName: string): Identifier =>
    `${context.idPrefix}_prescription_generation_${exerciseId}_${stageName}`;

  if (trace.method !== undefined) {
    const { method } = trace;
    entries.push({
      ...entryBase,
      id: idFor("method"),
      decision: method.ok
        ? `Method "${method.methodId}" selected via ${method.resolutionSource}.`
        : `Method resolution failed for exercise "${exerciseId}".`,
      reasons: method.ok
        ? [`${method.candidates.length} candidate(s) considered; ${method.rejectedMethodIds.length} rejected.`]
        : [method.message],
      sourceRuleIds: method.sourceRuleIds,
    });
  }

  if (trace.compatibility !== undefined) {
    const { compatibility } = trace;
    entries.push({
      ...entryBase,
      id: idFor("compatibility"),
      decision: compatibility.compatible
        ? `Exercise "${exerciseId}" is compatible with method "${compatibility.methodId}".`
        : `Exercise "${exerciseId}" is incompatible with method "${compatibility.methodId}".`,
      reasons: compatibility.compatible
        ? ["No compatibility issue detected."]
        : compatibility.issues.map((issue) => issue.message),
      sourceRuleIds: compatibility.sourceRuleIds,
    });
  }

  if (trace.volume !== undefined) {
    const { volume } = trace;
    entries.push({
      ...entryBase,
      id: idFor("volume"),
      decision: volume.ok ? `Volume resolved for exercise "${exerciseId}".` : `Volume resolution failed for exercise "${exerciseId}".`,
      reasons: volume.ok ? [summarizeVolume(volume.volume)] : [volume.message],
      sourceRuleIds: volume.sourceRuleIds,
    });
  }

  if (trace.intensity !== undefined) {
    const { intensity } = trace;
    entries.push({
      ...entryBase,
      id: idFor("intensity"),
      decision: intensity.ok
        ? `Intensity resolved via "${intensity.selectedRuleType}" for exercise "${exerciseId}".`
        : `Intensity resolution failed for exercise "${exerciseId}".`,
      reasons: intensity.ok
        ? intensity.rejectedRuleTypes.length > 0
          ? [`Rejected rule types: ${intensity.rejectedRuleTypes.join(", ")}.`]
          : ["No intensity rule rejected."]
        : [intensity.message],
      sourceRuleIds: intensity.sourceRuleIds,
    });
  }

  if (trace.rest !== undefined) {
    const { rest } = trace;
    entries.push({
      ...entryBase,
      id: idFor("rest"),
      decision: rest.ok
        ? rest.rest === null
          ? `No rest required for exercise "${exerciseId}".`
          : `Rest resolved for exercise "${exerciseId}".`
        : `Rest resolution failed for exercise "${exerciseId}".`,
      reasons: rest.ok ? [`Rest type: ${rest.rest === null ? "none" : rest.rest.type}.`] : [rest.message],
      sourceRuleIds: rest.sourceRuleIds,
    });
  }

  if (trace.tempo !== undefined) {
    const { tempo } = trace;
    entries.push({
      ...entryBase,
      id: idFor("tempo"),
      decision: tempo.ok
        ? tempo.tempo === null
          ? `No tempo required for exercise "${exerciseId}".`
          : `Tempo resolved for exercise "${exerciseId}".`
        : `Tempo resolution failed for exercise "${exerciseId}".`,
      reasons: tempo.ok ? [`Tempo type: ${tempo.tempo === null ? "none" : tempo.tempo.type}.`] : [tempo.message],
      sourceRuleIds: tempo.sourceRuleIds,
    });
  }

  if (trace.instructions !== undefined) {
    const { instructions } = trace;
    entries.push({
      ...entryBase,
      id: idFor("instructions"),
      decision: instructions.ok
        ? `${instructions.resolvedInstructionIds.length} instruction(s) resolved for exercise "${exerciseId}".`
        : `Instruction resolution failed for exercise "${exerciseId}".`,
      reasons: instructions.ok
        ? [`${instructions.omittedOptionalInstructionIds.length} optional instruction(s) omitted.`]
        : [instructions.message],
      sourceRuleIds: instructions.sourceRuleIds,
    });
  }

  if (trace.stopConditions !== undefined) {
    const { stopConditions } = trace;
    entries.push({
      ...entryBase,
      id: idFor("stop_conditions"),
      decision: stopConditions.ok
        ? `${stopConditions.resolvedStopConditionIds.length} stop condition(s) resolved for exercise "${exerciseId}".`
        : `Stop-condition resolution failed for exercise "${exerciseId}".`,
      reasons: stopConditions.ok
        ? [`${stopConditions.omittedOptionalStopConditionIds.length} optional stop condition(s) omitted.`]
        : [stopConditions.message],
      sourceRuleIds: stopConditions.sourceRuleIds,
    });
  }

  if (trace.validation !== undefined) {
    const { validation } = trace;
    entries.push({
      ...entryBase,
      id: idFor("validation"),
      decision: validation.valid
        ? `Final validation passed for exercise "${exerciseId}".`
        : `Final validation failed for exercise "${exerciseId}".`,
      reasons: validation.valid ? ["No validation issue detected."] : validation.issues.map((issue) => issue.message),
      sourceRuleIds: validation.sourceRuleIds,
    });
  }

  return entries;
}

// -----------------------------------------------------------------------------
// Public API — single exercise
// -----------------------------------------------------------------------------

/**
 * One `DecisionTraceEntry` per resolver stage present in `result.trace`
 * (in pipeline order), followed by one summary entry: "exercise fully
 * prescribed" on success, or "prescription failed at stage X" on failure.
 * A failed result's `trace` is a `Partial<ExercisePrescriptionTrace>` —
 * only the stages actually reached produce an entry; stages never reached
 * are not fabricated.
 */
export function adaptExercisePrescriptionResult(
  result: PrescribeExerciseResult,
  context: PrescriptionTraceContext,
): DecisionTraceEntry[] {
  const exerciseId = result.ok ? result.prescription.exerciseId : result.exerciseId;
  const moduleId = result.ok ? result.prescription.moduleId : result.moduleId;

  const stageEntries = buildStageEntries(result.trace, exerciseId, moduleId, context);

  const summaryEntry: DecisionTraceEntry = result.ok
    ? {
        id: `${context.idPrefix}_prescription_generation_${exerciseId}_summary`,
        timestamp: context.timestamp,
        stage: PRESCRIPTION_GENERATION_STAGE,
        decision: `Exercise "${exerciseId}" fully prescribed with method "${result.prescription.methodId}".`,
        reasons: [
          `${result.prescription.instructions.length} instruction(s), ${result.prescription.stopConditions.length} stop condition(s).`,
        ],
        affectedExerciseIds: [exerciseId],
        affectedModules: [moduleId],
        sourceRuleIds: result.prescription.sourceRuleIds,
      }
    : {
        id: `${context.idPrefix}_prescription_generation_${exerciseId}_summary`,
        timestamp: context.timestamp,
        stage: PRESCRIPTION_GENERATION_STAGE,
        decision: `Exercise "${exerciseId}" prescription failed at stage "${result.failureStage}".`,
        reasons: [result.message],
        affectedExerciseIds: [exerciseId],
        affectedModules: [moduleId],
        sourceRuleIds: unique(stageEntries.flatMap((entry) => entry.sourceRuleIds ?? [])),
      };

  return [...stageEntries, summaryEntry];
}

// -----------------------------------------------------------------------------
// Public API — session
// -----------------------------------------------------------------------------

/**
 * Every exercise's entries (via `adaptExercisePrescriptionResult`), in
 * session order, followed by one session-level summary entry: "session
 * fully prescribed" on success, or "session prescription failed" —
 * summarizing `issues` by code and message, never the full issue objects —
 * on failure.
 */
export function adaptSessionPrescriptionResult(
  result: PrescribeSessionResult,
  context: PrescriptionTraceContext,
): DecisionTraceEntry[] {
  const exerciseEntries = result.exerciseResults.flatMap((exerciseResult) =>
    adaptExercisePrescriptionResult(exerciseResult, context),
  );

  const sessionId = result.ok ? result.session.sessionId : result.sessionId;

  const summaryEntry: DecisionTraceEntry = result.ok
    ? {
        id: `${context.idPrefix}_prescription_generation_session_${sessionId}_summary`,
        timestamp: context.timestamp,
        stage: PRESCRIPTION_GENERATION_STAGE,
        decision: `Session "${sessionId}" fully prescribed.`,
        reasons: [
          `${result.session.exercises.length} exercise(s) prescribed.`,
          `${result.omittedOptionalExerciseIds.length} optional exercise(s) omitted.`,
        ],
        affectedModules: [...result.session.modules],
        sourceRuleIds: result.session.sourceRuleIds,
      }
    : {
        id: `${context.idPrefix}_prescription_generation_session_${sessionId}_summary`,
        timestamp: context.timestamp,
        stage: PRESCRIPTION_GENERATION_STAGE,
        decision: `Session "${sessionId}" prescription failed.`,
        reasons: result.issues.map((issue) => `${issue.code}: ${issue.message}`),
        affectedExerciseIds: unique(
          result.issues
            .map((issue) => issue.exerciseId)
            .filter((exerciseId): exerciseId is Identifier => exerciseId !== null),
        ),
        sourceRuleIds: result.sourceRuleIds,
      };

  return [...exerciseEntries, summaryEntry];
}
