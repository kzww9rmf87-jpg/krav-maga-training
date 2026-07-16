/**
 * Combat Athlete System — Engine Session Prescriber
 * Version 0.1
 *
 * Orchestrates prescribing every exercise in the engine's final,
 * post-substitution, post-reconstruction session draft (`InitialSessionDraft`).
 * Called by `runEngine` only after that draft is stable — never before
 * substitutions and reconstruction have already run (see `index.ts`).
 *
 * Exactly three outcomes:
 * - `"prescribed"`: every required exercise was successfully prescribed.
 * - `"unavailable"`: one or more required exercises has no prescription
 *   source data. Nothing is invented — `prescribeSession` is never even
 *   attempted with fabricated input.
 * - `"failed"`: source data existed for every required exercise, but
 *   `prescribeSession` genuinely could not produce a valid, complete
 *   prescription (incompatibility, missing required stop-condition
 *   category, etc.) — a safe failure. A partial prescription is never
 *   presented as `"prescribed"`.
 *
 * This file never falls back to a silent default and never mutates its
 * inputs.
 */

import type { CapabilityModule, DecisionTraceEntry, Identifier, InitialSessionDraft } from "../types";
import {
  buildDraftPrescriptionInputs,
  type ExercisePrescriptionSource,
  type PrescriptionSourceGap,
} from "./buildPrescriptionInput";
import {
  prescribeSession,
  type PrescribeSessionFailure,
  type SessionPrescription,
} from "./prescribeSession";
import {
  adaptSessionPrescriptionResult,
  type PrescriptionTraceContext,
} from "./prescriptionDecisionTrace";

// -----------------------------------------------------------------------------
// Output
// -----------------------------------------------------------------------------

export type EngineSessionPrescriptionOutcome =
  | { status: "prescribed"; session: SessionPrescription }
  | { status: "unavailable"; missingSourceData: readonly PrescriptionSourceGap[] }
  | { status: "failed"; failure: PrescribeSessionFailure };

export interface EngineSessionPrescriptionResult {
  outcome: EngineSessionPrescriptionOutcome;
  /** Ready to be appended to the engine's `DecisionTrace.entries`. */
  traceEntries: readonly DecisionTraceEntry[];
}

// -----------------------------------------------------------------------------
// Orchestrator
// -----------------------------------------------------------------------------

export function prescribeEngineSession(
  draft: InitialSessionDraft,
  prescriptionSources: ReadonlyMap<Identifier, ExercisePrescriptionSource>,
  traceContext: PrescriptionTraceContext,
): EngineSessionPrescriptionResult {
  const { exercises, gaps } = buildDraftPrescriptionInputs(draft, prescriptionSources);
  const missingRequiredGaps = gaps.filter((gap) => gap.required);

  if (missingRequiredGaps.length > 0) {
    return {
      outcome: { status: "unavailable", missingSourceData: missingRequiredGaps },
      traceEntries: buildUnavailableTraceEntries(draft.sessionId, missingRequiredGaps, traceContext),
    };
  }

  if (exercises.length === 0) {
    // Unreachable given `sessionGenerator.ts`'s own invariant (a "draft"
    // outcome always has at least one selected, primary-module exercise,
    // and every primary-module gap above is already required) — a
    // pipeline-contract violation, not a normal degraded case.
    throw new Error(
      `prescribeEngineSession: no prescribable exercise was found for session "${draft.sessionId}" although no required exercise reported a source-data gap — pipeline inconsistency.`,
    );
  }

  const modules: CapabilityModule[] = [...new Set(exercises.map((exercise) => exercise.moduleId))];

  const result = prescribeSession({
    sessionId: draft.sessionId,
    sessionName: draft.title,
    modules,
    exercises,
  });

  const traceEntries = adaptSessionPrescriptionResult(result, traceContext);

  if (!result.ok) {
    return { outcome: { status: "failed", failure: result }, traceEntries };
  }

  return { outcome: { status: "prescribed", session: result.session }, traceEntries };
}

// -----------------------------------------------------------------------------
// Trace for the "unavailable" outcome (no `PrescribeSessionResult` exists yet
// to hand to `adaptSessionPrescriptionResult` in this case).
// -----------------------------------------------------------------------------

function buildUnavailableTraceEntries(
  sessionId: Identifier,
  gaps: readonly PrescriptionSourceGap[],
  context: PrescriptionTraceContext,
): DecisionTraceEntry[] {
  return [
    {
      id: `${context.idPrefix}_prescription_generation_session_${sessionId}_unavailable`,
      timestamp: context.timestamp,
      stage: "prescription_generation",
      decision: `Session "${sessionId}" prescription is unavailable: missing source data for ${gaps.length} exercise(s).`,
      reasons: gaps.map((gap) => `Exercise "${gap.exerciseId}" (module "${gap.moduleId}"): ${gap.reason}`),
      affectedExerciseIds: gaps.map((gap) => gap.exerciseId),
      affectedModules: [...new Set(gaps.map((gap) => gap.moduleId))],
    },
  ];
}
