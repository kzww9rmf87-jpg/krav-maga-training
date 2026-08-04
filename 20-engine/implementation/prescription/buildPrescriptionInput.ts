/**
 * Combat Athlete System — Engine → Prescription Input Adapter
 * Version 0.1
 *
 * Converts one engine-generated session draft (`InitialSessionDraft` — the
 * stable, post-substitution, post-reconstruction session; see `index.ts`'s
 * `runEngine`) into `SessionExercisePrescriptionInput` entries for
 * `prescribeSession`.
 *
 * `ExerciseDefinition` (the engine's exercise knowledge base entry) and
 * `EngineInput` carry none of the fields a prescription requires: no
 * `ExerciseRole`, no `ExercisePrescriptionCapabilities`, no instruction or
 * stop-condition definitions, no athlete references, no load-rounding
 * profile. This adapter never invents them. Every one of those fields
 * must come from `prescriptionSources` — a per-exercise-id lookup supplied
 * by the caller (real data once the engine input schema carries it, a
 * documented contract, or a clearly-identified test fixture today). A
 * missing entry produces a structured gap, never a fabricated default.
 */

import type { CapabilityModule, Identifier, InitialSessionDraft } from "../types";
import type { PrescribeExerciseInput } from "./prescribeExercise";
import type { SessionExercisePrescriptionInput } from "./prescribeSession";

/**
 * Everything `PrescribeExerciseInput` needs beyond the exercise/module
 * identifiers the engine already knows from the session draft itself.
 */
export type ExercisePrescriptionSource = Omit<PrescribeExerciseInput, "exerciseId" | "moduleId">;

/**
 * Why a selected exercise received no prescription.
 *
 * Deliberately NOT reusing `ExercisePrescriptionSourceFailureCode`
 * (`EXERCISE_NOT_IN_REGISTRY`, `REQUIRED_ATHLETE_REFERENCE_MISSING`,
 * `REQUIRED_EQUIPMENT_MISSING`): those describe why a *registry lookup*
 * failed, and that lookup happens in `getExercisePrescriptionSource`, one
 * layer above `runEngine`. All this function ever observes is that
 * `prescriptionSources` carries no entry for an exercise id — it cannot
 * distinguish "absent from the registry" from "present in the registry but
 * unresolvable in this context" from "the caller simply did not ask for
 * it". Reporting one of those three codes here would be a guess, and the
 * middle case is real: `pallof_press` is in the registry and still resolves
 * to no source when no cable/band capability is declared.
 *
 * This union has one member today. It exists as a union so that, once the
 * engine resolves prescription sources itself, the more precise codes can
 * be added additively without changing this field's type name or meaning.
 */
export type UnprescribedExerciseReasonCode = "PRESCRIPTION_SOURCE_NOT_PROVIDED";

export interface PrescriptionSourceGap {
  exerciseId: Identifier;
  moduleId: CapabilityModule;
  /** Mirrors the module's own `"primary"` role — never a new inference (see below). */
  required: boolean;
  reasonCode: UnprescribedExerciseReasonCode;
  /** Human-readable restatement of `reasonCode` — never a second, different reason. */
  reason: string;
}

export interface DraftPrescriptionInputs {
  /** One entry per selected exercise whose prescription source data was found. */
  exercises: readonly SessionExercisePrescriptionInput[];
  /** One entry per selected exercise whose prescription source data was missing. */
  gaps: readonly PrescriptionSourceGap[];
}

/**
 * Walks every module in `draft.modules` that has a selected exercise
 * (skipping empty secondary/support modules — there is nothing to
 * prescribe there, not a missing-data case) and looks up its prescription
 * source data by exercise id.
 *
 * `order`/`blockId` come directly from the module's own already-assigned
 * `order`/`module`. `required` is `true` exactly for `"primary"`-role
 * modules — this restates, rather than invents, an invariant
 * `sessionGenerator.ts` already enforces: a `"primary"` module without a
 * selected exercise blocks the draft before it can exist, so every
 * `"primary"`-module exercise reaching this function is already
 * effectively required for the session to be genuinely complete.
 */
export function buildDraftPrescriptionInputs(
  draft: InitialSessionDraft,
  prescriptionSources: ReadonlyMap<Identifier, ExercisePrescriptionSource>,
): DraftPrescriptionInputs {
  const exercises: SessionExercisePrescriptionInput[] = [];
  const gaps: PrescriptionSourceGap[] = [];

  for (const generatedModule of draft.modules) {
    const selectedCandidates = generatedModule.exerciseSelection.candidates.filter(
      (candidate) => candidate.selected,
    );

    // A module may contribute several exercises. `order` is unique across the
    // session, so each one takes the next position rather than sharing its
    // module's index — `prescribeSession` rejects duplicate orders.
    for (const selectedCandidate of selectedCandidates) {
      const exerciseId = selectedCandidate.scoredExercise.exercise.id;
      const moduleId = generatedModule.selectedModule.module;
      const required = generatedModule.selectedModule.role === "primary";
      const source = prescriptionSources.get(exerciseId);

      if (source === undefined) {
        gaps.push({
          exerciseId,
          moduleId,
          required,
          reasonCode: "PRESCRIPTION_SOURCE_NOT_PROVIDED",
          reason: `No prescription source data (role, capabilities, instructions, stop conditions, athlete references, load profile) is available for exercise "${exerciseId}".`,
        });
        continue;
      }

      exercises.push({
        ...source,
        exerciseId,
        moduleId,
        order: exercises.length + 1,
        required,
        blockId: moduleId,
      });
    }
  }

  return { exercises, gaps };
}
