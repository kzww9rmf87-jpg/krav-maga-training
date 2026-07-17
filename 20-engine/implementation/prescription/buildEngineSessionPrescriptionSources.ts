/**
 * Combat Athlete System — Engine Session Prescription Sources Helper
 * Version 0.1
 *
 * Turns a list of exercise identifiers (typically the exercises selected
 * in the engine's final session draft) plus a single shared
 * `PrescriptionExecutionContext` (athlete references, available
 * equipment) into the `ReadonlyMap<Identifier, ExercisePrescriptionSource>`
 * `runEngine`'s third parameter expects.
 *
 * This file does not read `InitialSessionDraft` itself — the caller
 * extracts exercise ids from it — so it stays decoupled from the session
 * traversal logic already owned by `buildPrescriptionInput.ts`.
 *
 * Not called from `runEngine` or wired into the iOS application by this
 * task — it exists so a test (or a future integration) can build a
 * `prescriptionSources` map for several exercises in one call instead of
 * repeating `getExercisePrescriptionSource` per exercise.
 */

import type { Identifier } from "../types";
import type { ExercisePrescriptionSource } from "./buildPrescriptionInput";
import {
  getExercisePrescriptionSource,
  type ExercisePrescriptionSourceFailure,
  type PrescriptionExecutionContext,
} from "./exercisePrescriptionRegistry";

export interface BuildEngineSessionPrescriptionSourcesResult {
  sources: ReadonlyMap<Identifier, ExercisePrescriptionSource>;
  /** One entry per exercise id that could not be resolved — never silently dropped. */
  failures: readonly ExercisePrescriptionSourceFailure[];
}

export function buildEngineSessionPrescriptionSources(
  exerciseIds: readonly Identifier[],
  context: PrescriptionExecutionContext,
): BuildEngineSessionPrescriptionSourcesResult {
  const sources = new Map<Identifier, ExercisePrescriptionSource>();
  const failures: ExercisePrescriptionSourceFailure[] = [];

  for (const exerciseId of exerciseIds) {
    const result = getExercisePrescriptionSource(exerciseId, context);

    if (result.ok) {
      sources.set(exerciseId, result.source);
    } else {
      failures.push(result);
    }
  }

  return { sources, failures };
}
