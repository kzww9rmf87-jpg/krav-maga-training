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
 * EQUIPMENT AND DOSE ARE DERIVED, NEVER SUPPLIED. This helper takes the
 * athlete's `TrainingEnvironment` and `ReadinessState` — the same public
 * objects `runEngine` already receives — and derives both
 * `availableEquipmentCapabilities` (via `deriveEquipmentCapabilities`) and
 * `rangeContext` (via `deriveRangeContext`) itself. It deliberately accepts
 * neither a pre-computed capability list nor a pre-chosen range context:
 * translating declared equipment into prescription capabilities, and
 * deciding whether an athlete trains at the bottom or the middle of every
 * documented range, are both training-domain decisions and both belong to
 * CAS rather than to whatever platform calls it.
 *
 * `athleteReferences` and `loadRounding` are still caller-supplied.
 * Internalizing those is a separate, later concern and nothing here
 * anticipates it.
 */

import type { Identifier, ReadinessState, TrainingEnvironment } from "../types";
import type { ExercisePrescriptionSource } from "./buildPrescriptionInput";
import { deriveEquipmentCapabilities } from "./deriveEquipmentCapabilities";
import { deriveRangeContext, type RangeContextDecision } from "./deriveRangeContext";
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
  "availableEquipmentCapabilities" | "rangeContext"
> & {
  /** The athlete's declared environment — CAS derives the capabilities from it. */
  environment: TrainingEnvironment;
  /** The athlete's validated readiness — CAS derives the range context from it. */
  readiness: ReadinessState;
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
  /**
   * The full readiness → range-context decision CAS took, with its
   * aggregate, per-field contributions, reasons and source rules. Returned
   * for explainability: a caller can show WHY the session was dosed the way
   * it was without re-deriving anything, and must never compute it itself.
   */
  rangeContextDecision: RangeContextDecision;
}

export function buildEngineSessionPrescriptionSources(
  exerciseIds: readonly Identifier[],
  context: EngineSessionPrescriptionContext,
): BuildEngineSessionPrescriptionSourcesResult {
  const { environment, readiness, ...rest } = context;
  const derivedEquipmentCapabilities = deriveEquipmentCapabilities(environment);
  const rangeContextDecision = deriveRangeContext(readiness);

  // Both derived once for the whole session, not per exercise: neither the
  // environment nor the athlete's readiness changes between two exercises of
  // the same session, and deriving per exercise would invite a future
  // per-exercise divergence.
  const resolutionContext: PrescriptionExecutionContext = {
    ...rest,
    availableEquipmentCapabilities: derivedEquipmentCapabilities,
    rangeContext: rangeContextDecision.rangeContext,
    restRangeContext: rangeContextDecision.restRangeContext,
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

  return { sources, failures, derivedEquipmentCapabilities, rangeContextDecision };
}
