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
 *
 * `"prescribed"` means every REQUIRED exercise was prescribed — not every
 * selected one. A `"secondary"`/`"support"` module's exercise can be
 * selected, find no source data, and be left out while the status stays
 * `"prescribed"`; that is the existing, deliberate rule (`required` mirrors
 * the module's `"primary"` role, see `buildPrescriptionInput.ts`) and this
 * file does not change it. What it no longer does is leave that omission
 * invisible: every gap, required or not, is reported on
 * `unprescribedSelectedExercises`, given its own Decision Trace entry, and
 * given a warning. No consumer needs to diff the session draft against the
 * prescription to discover it.
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

/**
 * Every selected exercise that did not receive a prescription, whatever the
 * status — the complete answer to "which exercises are in `sessionDraft`
 * but not in `prescription.session.exercises`?", so no consumer ever has to
 * compute that difference itself.
 *
 * Present on all three statuses on purpose. A `"prescribed"` session can
 * still omit a `"secondary"`/`"support"` exercise (only a `"primary"` gap
 * blocks the status), and both `"unavailable"` and `"failed"` can carry
 * non-required gaps alongside whatever caused their status. Before this
 * field existed, every one of those omissions was silent.
 *
 * On `"unavailable"`, this list is a superset of `missingSourceData`:
 * `missingSourceData` stays exactly what it always was — the *required*
 * gaps that caused the status — while this list also carries the
 * non-required ones. The overlap is deliberate: one field explains the
 * status, the other is the complete omission record, and neither requires
 * reading the other to be understood.
 */
type WithUnprescribed<T> = T & {
  unprescribedSelectedExercises: readonly PrescriptionSourceGap[];
};

export type EngineSessionPrescriptionOutcome =
  | WithUnprescribed<{ status: "prescribed"; session: SessionPrescription }>
  | WithUnprescribed<{ status: "unavailable"; missingSourceData: readonly PrescriptionSourceGap[] }>
  | WithUnprescribed<{ status: "failed"; failure: PrescribeSessionFailure }>;

export interface EngineSessionPrescriptionResult {
  outcome: EngineSessionPrescriptionOutcome;
  /** Ready to be appended to the engine's `DecisionTrace.entries`. */
  traceEntries: readonly DecisionTraceEntry[];
  /**
   * Ready to be appended to the engine's `DecisionTrace.warnings` — one per
   * omitted exercise, in `unprescribedSelectedExercises` order. Built here
   * rather than in `runEngine` so the wording stays owned by the layer that
   * took the decision.
   */
  warnings: readonly string[];
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

  // Every gap — required or not — is recorded once, here, for every status
  // below. `gaps` already follows `draft.modules` order, so the list, the
  // trace entries and the warnings are all deterministically ordered.
  const omissionTraceEntries = buildOmissionTraceEntries(gaps, traceContext);
  const warnings = buildOmissionWarnings(gaps);

  if (missingRequiredGaps.length > 0) {
    return {
      outcome: {
        status: "unavailable",
        missingSourceData: missingRequiredGaps,
        unprescribedSelectedExercises: gaps,
      },
      traceEntries: [
        ...omissionTraceEntries,
        ...buildUnavailableTraceEntries(draft.sessionId, missingRequiredGaps, traceContext),
      ],
      warnings,
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

  const traceEntries = [...omissionTraceEntries, ...adaptSessionPrescriptionResult(result, traceContext)];

  if (!result.ok) {
    return {
      outcome: { status: "failed", failure: result, unprescribedSelectedExercises: gaps },
      traceEntries,
      warnings,
    };
  }

  return {
    outcome: { status: "prescribed", session: result.session, unprescribedSelectedExercises: gaps },
    traceEntries,
    warnings,
  };
}

// -----------------------------------------------------------------------------
// Per-exercise omission record (every status)
// -----------------------------------------------------------------------------

/**
 * One `"prescription_generation"` entry per selected-but-unprescribed
 * exercise, emitted for every status. Follows the same one-entry-per-subject
 * convention `adaptExercisePrescriptionResult` already uses for prescribed
 * exercises, so a reader walking the stage sees every selected exercise
 * accounted for — prescribed or omitted — never only the prescribed ones.
 *
 * `DecisionTraceEntry` has no structured slot for `required` or
 * `reasonCode`, so both are stated explicitly in `reasons` rather than
 * encoded into the entry id or left out. No branch is taken on any exercise
 * id: the same sentence is built for every gap.
 */
function buildOmissionTraceEntries(
  gaps: readonly PrescriptionSourceGap[],
  context: PrescriptionTraceContext,
): DecisionTraceEntry[] {
  return gaps.map((gap) => ({
    id: `${context.idPrefix}_prescription_generation_${gap.exerciseId}_omitted`,
    timestamp: context.timestamp,
    stage: "prescription_generation" as const,
    decision: `Exercise "${gap.exerciseId}" was selected but omitted from the prescription.`,
    reasons: [
      `reasonCode: ${gap.reasonCode}.`,
      `required: ${gap.required}.`,
      gap.reason,
      gap.required
        ? "The session prescription cannot be considered complete without this exercise."
        : "This exercise belongs to a non-primary module, so the session prescription is still reported as prescribed.",
    ],
    affectedExerciseIds: [gap.exerciseId],
    affectedModules: [gap.moduleId],
  }));
}

/**
 * One warning per omitted exercise, so a product surface reading only
 * `DecisionTrace.warnings` still learns that the displayed session and the
 * prescribed session differ. The structured
 * `unprescribedSelectedExercises` list stays the source of truth — these
 * strings restate it, never add to it.
 */
function buildOmissionWarnings(gaps: readonly PrescriptionSourceGap[]): string[] {
  return gaps.map(
    (gap) =>
      `Exercise "${gap.exerciseId}" (module "${gap.moduleId}") was selected for this session but could not be prescribed (${gap.reasonCode}).`,
  );
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
