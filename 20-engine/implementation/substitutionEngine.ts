/**
 * Combat Athlete System — Exercise Substitution
 * Version 0.1
 *
 * Sixth stage of the exercise pipeline implemented so far:
 *
 *   Eligibility → Scoring → Final selection → Initial session draft
 *   → Conflict detection → Substitution (this file)
 *
 * This module never rescoring a backup, never recomputes its eligibility,
 * and never picks an exercise absent from `exerciseSelection.candidates`.
 * Every candidate reachable from `ExerciseSelectionResult` has already
 * been declared eligible, scored, ranked and filtered to a final score of
 * at least 60 — this file only searches and swaps within that existing,
 * already-ordered bench. It never changes Capability Module, never
 * changes the session objective, never reorders `candidates`, and never
 * mutates any object it receives.
 *
 * V0.1 automates exactly ONE substitution trigger: a `"combat_schedule"`
 * conflict produced by `conflictResolver.ts` (`combat_recovery_<exerciseId>`)
 * whose `affectedExerciseIds` names the exercise being replaced. Every
 * other conflict type — duration, missing-exercise, or cumulative
 * grip/impact/systemic fatigue — is explicitly out of scope and produces
 * an `"unavailable"` result with a deterministic reason, never an
 * automatic decision.
 *
 * Explicitly deferred to later modules (not implemented here):
 * - substitution triggered by duration overshoot;
 * - substitution triggered by cumulative grip/impact/systemic fatigue;
 * - filling an empty (`missing_exercise_<module>`) module — its bench is
 *   structurally empty by construction (see `exerciseFinalSelector.ts`),
 *   so there is nothing to search;
 * - new pain, new equipment unavailability, environment changes or new
 *   medical restrictions appearing after generation (all would require an
 *   updated `EngineInput` this function does not receive);
 * - in-session execution failure (technical failure, broken equipment,
 *   unavailable space);
 * - cross-module substitution;
 * - detailed biomechanical comparison (movement patterns, force vectors,
 *   contraction type, velocity intent, range of motion);
 * - use of `exercise.substitutionExerciseIds`;
 * - rescoring, re-eligibility, or recursive detection of new conflicts on
 *   the chosen backup;
 * - reconstruction of `InitialSessionDraft`;
 * - `ConflictResolution` generation — left to a future orchestrator, which
 *   already has every id needed (`conflict.id`, the replaced id, the
 *   replacement id) to build one from the existing type;
 * - Decision Trace generation.
 */

import type {
  DetectedConflict,
  EngineInput,
  ExerciseSelectionResult,
  Identifier,
  SelectedExerciseCandidate,
  SubstitutionSearchResult,
} from "./types";

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Searches `exerciseSelection.candidates` for a backup capable of replacing
 * `exerciseIdToReplace`, given the `conflict` that motivated the search.
 *
 * Only `conflict.type === "combat_schedule"` is automated in V0.1; any
 * other conflict type, or a `"combat_schedule"` conflict that does not
 * name `exerciseIdToReplace`, returns `"unavailable"` with an explanatory
 * reason rather than throwing — these are unsupported requests, not
 * pipeline-contract violations. A missing `input.request.nextCombatSessionAt`
 * is treated the same way.
 *
 * Among the remaining, non-selected candidates, in their existing order
 * (never re-sorted, never re-scored), the first one is returned whose
 * exercise shares the original's `primaryAdaptation` and whose
 * `fatigueProfile.recoveryHours` — which must be defined — fits within the
 * hours remaining before `nextCombatSessionAt`. A candidate with an
 * undefined `recoveryHours` is treated as insufficient information, never
 * as an implicit pass.
 */
export function findSubstituteCandidate(
  exerciseSelection: ExerciseSelectionResult,
  exerciseIdToReplace: Identifier,
  conflict: DetectedConflict,
  input: EngineInput,
): SubstitutionSearchResult {
  const originalCandidate = assertReplaceableSelection(exerciseSelection, exerciseIdToReplace);
  assertAllCandidatesBelongToModule(exerciseSelection);

  if (conflict.type !== "combat_schedule") {
    return {
      outcome: "unavailable",
      reason: `Automatic substitution is not supported for conflict type "${conflict.type}" in engine version 0.1.`,
    };
  }

  if (conflict.affectedExerciseIds?.includes(exerciseIdToReplace) !== true) {
    return {
      outcome: "unavailable",
      reason: `Conflict "${conflict.id}" does not affect exercise "${exerciseIdToReplace}".`,
    };
  }

  const { nextCombatSessionAt, requestedAt } = input.request;
  if (nextCombatSessionAt === undefined) {
    return {
      outcome: "unavailable",
      reason: "Cannot evaluate a combat-recovery substitution because the next combat session date is not available.",
    };
  }

  const availableHours = (new Date(nextCombatSessionAt).getTime() - new Date(requestedAt).getTime()) / MILLISECONDS_PER_HOUR;
  const primaryAdaptation = originalCandidate.scoredExercise.exercise.primaryAdaptation;

  const backup = exerciseSelection.candidates.find((candidate) =>
    isCombatRecoveryCompatibleBackup(candidate, primaryAdaptation, availableHours),
  );

  if (backup === undefined) {
    return {
      outcome: "unavailable",
      reason: `No eligible backup preserves the primary adaptation and fits the available recovery window for exercise "${exerciseIdToReplace}".`,
    };
  }

  return { outcome: "found", candidate: backup };
}

/**
 * Applies an already-decided substitution: the candidate for
 * `exerciseIdToReplace` is marked `selected: false`, the candidate for
 * `replacementExerciseId` is marked `selected: true`, both gain one
 * appended, deterministic reason, and every other candidate is returned
 * unchanged (same object reference). Neither `exerciseSelection` nor any
 * of its arrays or candidate objects is mutated — a new
 * `ExerciseSelectionResult` is returned, with `module`, `role` and
 * candidate order preserved exactly. This function does not re-evaluate
 * recovery compatibility or any other search criterion — that decision is
 * assumed to already have been made by `findSubstituteCandidate`.
 */
export function applySubstitution(
  exerciseSelection: ExerciseSelectionResult,
  exerciseIdToReplace: Identifier,
  replacementExerciseId: Identifier,
): ExerciseSelectionResult {
  const originalCandidate = assertReplaceableSelection(exerciseSelection, exerciseIdToReplace);
  assertAllCandidatesBelongToModule(exerciseSelection);

  const replacementCandidate = findCandidateById(exerciseSelection, replacementExerciseId);
  if (replacementCandidate === undefined) {
    throw new Error(
      `Cannot apply substitution: replacement exercise "${replacementExerciseId}" is not present in the candidate selection.`,
    );
  }
  if (replacementCandidate.selected) {
    throw new Error(
      `Cannot apply substitution: replacement exercise "${replacementExerciseId}" is already selected.`,
    );
  }
  if (
    replacementCandidate.scoredExercise.exercise.primaryAdaptation !==
    originalCandidate.scoredExercise.exercise.primaryAdaptation
  ) {
    throw new Error(
      `Cannot apply substitution from "${exerciseIdToReplace}" to "${replacementExerciseId}": primary adaptations do not match.`,
    );
  }

  const candidates = exerciseSelection.candidates.map((candidate) => {
    const exerciseId = candidate.scoredExercise.exercise.id;

    if (exerciseId === exerciseIdToReplace) {
      return {
        ...candidate,
        selected: false,
        selectionReasons: [
          ...candidate.selectionReasons,
          `Substituted out in favor of exercise "${replacementExerciseId}".`,
        ],
      };
    }

    if (exerciseId === replacementExerciseId) {
      return {
        ...candidate,
        selected: true,
        selectionReasons: [
          ...candidate.selectionReasons,
          `Selected as a substitute for exercise "${exerciseIdToReplace}".`,
        ],
      };
    }

    return candidate;
  });

  return {
    module: exerciseSelection.module,
    role: exerciseSelection.role,
    candidates,
  };
}

// -----------------------------------------------------------------------------
// Defensive invariants (pipeline-call errors, never a search "unavailable" result)
// -----------------------------------------------------------------------------

/**
 * Verifies `exerciseIdToReplace` is present in `exerciseSelection.candidates`,
 * is currently the (single) selected candidate, and that no other candidate
 * is also marked `selected: true`. Used identically by both exported
 * functions — these are pipeline-contract guarantees, not normal absence
 * of a substitute.
 */
function assertReplaceableSelection(
  exerciseSelection: ExerciseSelectionResult,
  exerciseIdToReplace: Identifier,
): SelectedExerciseCandidate {
  const originalCandidate = findCandidateById(exerciseSelection, exerciseIdToReplace);

  if (originalCandidate === undefined) {
    throw new Error(
      `Cannot substitute exercise "${exerciseIdToReplace}": exercise is not present in the candidate selection.`,
    );
  }

  if (!originalCandidate.selected) {
    throw new Error(`Cannot substitute exercise "${exerciseIdToReplace}": exercise is not currently selected.`);
  }

  // A module may hold several selected exercises since `sessionComposer.ts`.
  // Substitution still targets exactly one of them — the id it was given —
  // so the others are simply left alone.

  return originalCandidate;
}

/** Cross-module substitution is forbidden in V0.1 — every candidate must already belong to `exerciseSelection.module`. */
function assertAllCandidatesBelongToModule(exerciseSelection: ExerciseSelectionResult): void {
  for (const candidate of exerciseSelection.candidates) {
    const exercise = candidate.scoredExercise.exercise;
    if (exercise.module !== exerciseSelection.module) {
      throw new Error(`Candidate exercise "${exercise.id}" does not belong to module "${exerciseSelection.module}".`);
    }
  }
}

// -----------------------------------------------------------------------------
// Combat-recovery compatibility
// -----------------------------------------------------------------------------

const MILLISECONDS_PER_HOUR = 1000 * 60 * 60;

/**
 * A backup is combat-recovery-compatible when it is not the currently
 * selected candidate, shares the original exercise's `primaryAdaptation`,
 * declares a `fatigueProfile.recoveryHours`, and that value fits within
 * `availableHours`. An undefined `recoveryHours` is insufficient
 * information, never an implicit pass.
 */
function isCombatRecoveryCompatibleBackup(
  candidate: SelectedExerciseCandidate,
  primaryAdaptation: SelectedExerciseCandidate["scoredExercise"]["exercise"]["primaryAdaptation"],
  availableHours: number,
): boolean {
  // Never propose an exercise the session already holds.
  if (candidate.selected) {
    return false;
  }
  if (candidate.scoredExercise.exercise.primaryAdaptation !== primaryAdaptation) {
    return false;
  }

  const { recoveryHours } = candidate.scoredExercise.exercise.fatigueProfile;
  if (recoveryHours === undefined) {
    return false;
  }

  return recoveryHours <= availableHours;
}

// -----------------------------------------------------------------------------
// Shared helpers
// -----------------------------------------------------------------------------

function findCandidateById(
  exerciseSelection: ExerciseSelectionResult,
  exerciseId: Identifier,
): SelectedExerciseCandidate | undefined {
  return exerciseSelection.candidates.find((candidate) => candidate.scoredExercise.exercise.id === exerciseId);
}
