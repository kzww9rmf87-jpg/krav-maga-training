/**
 * Combat Athlete System — Engine Session Prescription Sources Helper
 * Version 0.1
 *
 * Turns a list of exercise identifiers (typically the exercises selected
 * in the engine's final session draft) plus a single shared execution
 * context into the `ReadonlyMap<Identifier, ExercisePrescriptionSource>`
 * `runEngine`'s third parameter expects.
 *
 * This file does not read `InitialSessionDraft` itself — the caller
 * extracts exercise ids from it — so it stays decoupled from the session
 * traversal logic already owned by `buildPrescriptionInput.ts`.
 *
 * EQUIPMENT IS DERIVED, NEVER SUPPLIED. This helper takes the athlete's
 * `TrainingEnvironment` — the same public object `runEngine` already
 * receives — and derives `availableEquipmentCapabilities` itself via
 * `deriveEquipmentCapabilities`. It deliberately does NOT accept a
 * pre-computed capability list: translating declared equipment into
 * prescription capabilities is a training-domain decision (which implements
 * are interchangeable, which surfaces are rated for what), and it belongs
 * to CAS rather than to whatever platform calls it.
 *
 * `rangeContext`, `athleteReferences` and `loadRounding` are still caller-
 * supplied. Internalizing those is a separate, later concern and nothing
 * here anticipates it.
 */

import type { Identifier, TrainingEnvironment } from "../types";
import type { ExercisePrescriptionSource } from "./buildPrescriptionInput";
import { deriveEquipmentCapabilities } from "./deriveEquipmentCapabilities";
import {
  getExercisePrescriptionSource,
  type ExercisePrescriptionSourceFailure,
  type PrescriptionExecutionContext,
} from "./exercisePrescriptionRegistry";

/**
 * `PrescriptionExecutionContext` with the derived field replaced by its
 * source. Declared as an `Omit` of the low-level context rather than
 * re-listing its fields, so `rangeContext`, `athleteReferences` and
 * `loadRounding` stay automatically in sync with it.
 */
export type EngineSessionPrescriptionContext = Omit<
  PrescriptionExecutionContext,
  "availableEquipmentCapabilities"
> & {
  /** The athlete's declared environment — CAS derives the capabilities from it. */
  environment: TrainingEnvironment;
};

export interface BuildEngineSessionPrescriptionSourcesResult {
  sources: ReadonlyMap<Identifier, ExercisePrescriptionSource>;
  /** One entry per exercise id that could not be resolved — never silently dropped. */
  failures: readonly ExercisePrescriptionSourceFailure[];
  /**
   * The capabilities CAS derived from `context.environment`, in canonical
   * vocabulary order. Returned for traceability — so a failure mentioning a
   * missing capability can be read against what was actually derived —
   * never as something the caller is expected to compute or supply back.
   */
  derivedEquipmentCapabilities: readonly Identifier[];
}

export function buildEngineSessionPrescriptionSources(
  exerciseIds: readonly Identifier[],
  context: EngineSessionPrescriptionContext,
): BuildEngineSessionPrescriptionSourcesResult {
  const { environment, ...rest } = context;
  const derivedEquipmentCapabilities = deriveEquipmentCapabilities(environment);

  // Derived once for the whole session, not per exercise: the environment
  // does not change between two exercises of the same session, and deriving
  // per exercise would invite a future per-exercise divergence.
  const resolutionContext: PrescriptionExecutionContext = {
    ...rest,
    availableEquipmentCapabilities: derivedEquipmentCapabilities,
  };

  const sources = new Map<Identifier, ExercisePrescriptionSource>();
  const failures: ExercisePrescriptionSourceFailure[] = [];

  for (const exerciseId of exerciseIds) {
    const result = getExercisePrescriptionSource(exerciseId, resolutionContext);

    if (result.ok) {
      sources.set(exerciseId, result.source);
    } else {
      failures.push(result);
    }
  }

  return { sources, failures, derivedEquipmentCapabilities };
}
