/**
 * Combat Athlete System — Public Session Output: Exercise References
 * Version 1
 *
 * Collects, deterministically, exactly the exercise ids that appear
 * somewhere in an already-built `CasSessionOutputV1` (sessionDraft's
 * selected exercises, prescription, the public Decision Trace, public
 * conflicts and conflict resolutions) and resolves a display name for
 * each from the engine's own exercise pool. Never a full catalog: an
 * exercise id never referenced anywhere in the output never appears here,
 * even if it exists in `exercises`.
 *
 * Pure: no `Date`, no randomness. Ids are deduplicated then sorted
 * lexicographically before name resolution, so the resulting object's key
 * order — and therefore its JSON serialization — never depends on
 * iteration order internal to a `Set`/`Map`.
 */

import type { ExerciseDefinition, Identifier } from "../types";
import type {
  CasConflictResolutionV1,
  CasConflictV1,
  CasDecisionTraceV1,
  CasExerciseReferencesV1,
  CasPrescriptionOutcomeV1,
  CasSessionDraftV1,
  ExerciseReferenceV1,
} from "./types";

function collectConflictExerciseIds(conflicts: readonly CasConflictV1[], into: Set<Identifier>): void {
  for (const conflict of conflicts) {
    for (const exerciseId of conflict.affectedExerciseIds ?? []) {
      into.add(exerciseId);
    }
  }
}

function collectConflictResolutionExerciseIds(
  resolutions: readonly CasConflictResolutionV1[],
  into: Set<Identifier>,
): void {
  for (const resolution of resolutions) {
    for (const exerciseId of resolution.removedExerciseIds ?? []) {
      into.add(exerciseId);
    }
    for (const exerciseId of resolution.addedExerciseIds ?? []) {
      into.add(exerciseId);
    }
  }
}

function collectDecisionTraceExerciseIds(trace: CasDecisionTraceV1, into: Set<Identifier>): void {
  for (const rejected of trace.rejectedExercises) {
    into.add(rejected.exerciseId);
  }
  for (const entry of trace.entries) {
    for (const exerciseId of entry.affectedExerciseIds ?? []) {
      into.add(exerciseId);
    }
  }
  collectConflictExerciseIds(trace.detectedConflicts, into);
  collectConflictResolutionExerciseIds(trace.conflictResolutions, into);
}

function collectSessionDraftExerciseIds(draft: CasSessionDraftV1, into: Set<Identifier>): void {
  for (const generatedModule of draft.modules) {
    for (const exercise of generatedModule.exercises) {
      into.add(exercise.exerciseId);
    }
  }
}

function collectPrescriptionExerciseIds(
  prescription: CasPrescriptionOutcomeV1 | undefined,
  into: Set<Identifier>,
): void {
  if (prescription === undefined) {
    return;
  }

  if (prescription.status === "prescribed") {
    for (const prescribedExercise of prescription.session.exercises) {
      into.add(prescribedExercise.prescription.exerciseId);
    }
    return;
  }

  if (prescription.status === "unavailable") {
    for (const gap of prescription.missingSourceData) {
      into.add(gap.exerciseId);
    }
    return;
  }

  for (const exerciseId of prescription.failure.failedExerciseIds) {
    into.add(exerciseId);
  }
  for (const issue of prescription.failure.issues) {
    if (issue.exerciseId !== null) {
      into.add(issue.exerciseId);
    }
  }
}

export interface ReferencedExerciseIdsInput {
  decisionTrace: CasDecisionTraceV1;
  conflicts?: readonly CasConflictV1[];
  conflictResolutions?: readonly CasConflictResolutionV1[];
  sessionDraft?: CasSessionDraftV1;
  prescription?: CasPrescriptionOutcomeV1;
}

/** Every exercise id visible anywhere in the public output, deduplicated and sorted lexicographically. */
export function collectReferencedExerciseIds(input: ReferencedExerciseIdsInput): Identifier[] {
  const ids = new Set<Identifier>();

  collectDecisionTraceExerciseIds(input.decisionTrace, ids);
  if (input.conflicts !== undefined) {
    collectConflictExerciseIds(input.conflicts, ids);
  }
  if (input.conflictResolutions !== undefined) {
    collectConflictResolutionExerciseIds(input.conflictResolutions, ids);
  }
  if (input.sessionDraft !== undefined) {
    collectSessionDraftExerciseIds(input.sessionDraft, ids);
  }
  collectPrescriptionExerciseIds(input.prescription, ids);

  return [...ids].sort();
}

/**
 * Resolves a `displayName` for each of `referencedExerciseIds` from the
 * engine's own exercise pool. An id referenced in the output but absent
 * from `exercises` is a pipeline-contract violation — thrown, never
 * silently defaulted (consistent with the rest of the engine's style,
 * e.g. `index.ts`'s `findSelectionIndexForSelectedExercise`).
 */
export function buildExerciseReferences(
  referencedExerciseIds: readonly Identifier[],
  exercises: readonly ExerciseDefinition[],
): CasExerciseReferencesV1 {
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise] as const));
  const references: Record<Identifier, ExerciseReferenceV1> = {};

  for (const exerciseId of referencedExerciseIds) {
    const exercise = exerciseById.get(exerciseId);
    if (exercise === undefined) {
      throw new Error(
        `buildExerciseReferences: exercise "${exerciseId}" is referenced in the public output but absent from the supplied exercise pool.`,
      );
    }
    references[exerciseId] = { displayName: exercise.name };
  }

  return references;
}
