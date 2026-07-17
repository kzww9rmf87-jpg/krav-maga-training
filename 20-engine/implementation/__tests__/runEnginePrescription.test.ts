/**
 * Combat Athlete System — `runEngine` Prescription Integration Tests
 *
 * Exercises the prescription integration added to `runEngine`'s optional
 * third argument. `runEngine.test.ts` (untouched) continues to cover the
 * historical two-argument pipeline; this file covers only the new
 * behavior layered on top of it.
 */

import { describe, expect, test } from "vitest";

import { runEngine } from "../index";
import type { ExercisePrescriptionSource } from "../prescription/buildPrescriptionInput";
import type { PrescribeExerciseInput } from "../prescription/prescribeExercise";
import { getExercisePrescriptionSource } from "../prescription/exercisePrescriptionRegistry";

import { NEXT_COMBAT_SESSION_AT, makeAthleteProfile, makeExercise, makeRequest, makeValidInput } from "./fixtures";
import { makeCapabilities, makeOneRepMaxReference, makePrescribeExerciseInput } from "./prescription/fixtures";

/** `ExercisePrescriptionSource` is `PrescribeExerciseInput` minus the identifiers `runEngine` already knows. */
function toSource(input: PrescribeExerciseInput): ExercisePrescriptionSource {
  const { exerciseId: _exerciseId, moduleId: _moduleId, ...source } = input;
  return source;
}

describe("runEngine prescription integration", () => {
  test("1. a historical two-argument call keeps its behavior byte-for-byte identical", () => {
    const input = makeValidInput();
    const exercise = makeExercise();

    const result = runEngine(input, [exercise]);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }

    expect(result.prescription).toBeUndefined();
    expect(result.decisionTrace.entries.map((entry) => entry.stage)).toEqual([
      "input_validation",
      "module_selection",
      "eligibility_filtering",
      "exercise_scoring",
      "session_assembly",
    ]);
  });

  test("2. a complete session with valid prescription source data produces a prescription", () => {
    const input = makeValidInput();
    const exercise = makeExercise(); // id "exercise-1", module "strength"

    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([
      [exercise.id, toSource(makePrescribeExerciseInput({ exerciseId: exercise.id, moduleId: "strength" }))],
    ]);

    const result = runEngine(input, [exercise], prescriptionSources);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }
    if (result.prescription?.status !== "prescribed") {
      throw new Error(`Expected prescription status "prescribed", got: ${JSON.stringify(result.prescription)}`);
    }

    expect(result.prescription.session.exercises.length).toBe(1);
    expect(result.prescription.session.exercises[0]?.prescription.exerciseId).toBe(exercise.id);
  });

  test("3. + 4. prescription runs after substitution, against the reconstructed final session", () => {
    const exerciseA = makeExercise({
      id: "exercise-a",
      fatigueProfile: {
        types: [],
        neural: 2,
        muscular: 2,
        metabolic: 2,
        connectiveTissue: 2,
        technical: 2,
        recoveryHours: 24,
      },
    });
    const exerciseB = makeExercise({
      id: "exercise-b",
      setupTimeMinutes: 3,
      defaultExerciseDurationMinutes: 9,
      fatigueProfile: {
        types: [],
        neural: 2,
        muscular: 2,
        metabolic: 2,
        connectiveTissue: 2,
        technical: 2,
        recoveryHours: 6,
      },
    });

    const input = makeValidInput({
      athleteProfile: makeAthleteProfile({ preferences: { preferredExerciseIds: [exerciseA.id] } }),
      request: makeRequest({ nextCombatSessionAt: NEXT_COMBAT_SESSION_AT }),
    });

    // Prescription source data is supplied only for exerciseB — the
    // substitute — never for exerciseA, proving the adapter used the
    // post-substitution selection, not the original one.
    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([
      [exerciseB.id, toSource(makePrescribeExerciseInput({ exerciseId: exerciseB.id, moduleId: "strength" }))],
    ]);

    const result = runEngine(input, [exerciseA, exerciseB], prescriptionSources);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }

    // Confirm the substitution actually happened (same as runEngine.test.ts #8).
    expect(result.conflictResolutions.length).toBe(1);
    expect(result.conflictResolutions[0]?.addedExerciseIds).toEqual([exerciseB.id]);

    if (result.prescription?.status !== "prescribed") {
      throw new Error(`Expected prescription status "prescribed", got: ${JSON.stringify(result.prescription)}`);
    }

    expect(result.prescription.session.exercises.length).toBe(1);
    expect(result.prescription.session.exercises[0]?.prescription.exerciseId).toBe(exerciseB.id);
  });

  test("6. the output exposes a structured failure when exercise prescription capabilities are absent", () => {
    const input = makeValidInput();
    const exercise = makeExercise();

    const result = runEngine(input, [exercise], new Map());

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }
    if (result.prescription?.status !== "unavailable") {
      throw new Error(`Expected prescription status "unavailable", got: ${JSON.stringify(result.prescription)}`);
    }

    expect(result.prescription.missingSourceData).toHaveLength(1);
    expect(result.prescription.missingSourceData[0]?.exerciseId).toBe(exercise.id);
    expect(result.prescription.missingSourceData[0]?.required).toBe(true);

    // The pre-prescription draft remains fully available and unaffected.
    expect(result.sessionDraft.modules.length).toBe(1);
  });

  test("7. no numeric value is invented — the resolved volume matches the documented numerical profile exactly", () => {
    const input = makeValidInput();
    const exercise = makeExercise();

    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([
      [exercise.id, toSource(makePrescribeExerciseInput({ exerciseId: exercise.id, moduleId: "strength" }))],
    ]);

    const result = runEngine(input, [exercise], prescriptionSources);

    if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft.");
    }

    const [prescribedExercise] = result.prescription.session.exercises;
    // strength_primary_straight_sets_v0_1, normal range context: sets=3, reps=5
    // (34_NUMERICAL_PRESCRIPTION_TABLES.md) — never derived from engine input.
    expect(prescribedExercise?.prescription.volume.sets).toBe(3);
    expect(prescribedExercise?.prescription.volume.reps?.value).toBe(5);
  });

  test("8. a partial prescription is never marked prescribed", () => {
    const input = makeValidInput();
    const exercise = makeExercise();

    // Capabilities that do not support the method the module/role resolves to.
    const incompatibleSource = toSource(
      makePrescribeExerciseInput({
        exerciseId: exercise.id,
        moduleId: "strength",
        capabilities: makeCapabilities({ exerciseId: exercise.id, supportedMethodIds: ["timed_isometric_sets"] }),
      }),
    );
    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([[exercise.id, incompatibleSource]]);

    const result = runEngine(input, [exercise], prescriptionSources);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }

    expect(result.prescription?.status).not.toBe("prescribed");
    if (result.prescription?.status !== "failed") {
      throw new Error(`Expected prescription status "failed", got: ${JSON.stringify(result.prescription)}`);
    }
    expect(result.prescription.failure.issues.length).toBeGreaterThan(0);
  });

  test("9. prescription_generation events are added to the Decision Trace", () => {
    const input = makeValidInput();
    const exercise = makeExercise();

    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([
      [exercise.id, toSource(makePrescribeExerciseInput({ exerciseId: exercise.id, moduleId: "strength" }))],
    ]);

    const result = runEngine(input, [exercise], prescriptionSources);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }

    const prescriptionEntries = result.decisionTrace.entries.filter(
      (entry) => entry.stage === "prescription_generation",
    );
    expect(prescriptionEntries.length).toBeGreaterThan(0);
  });

  test("10. sourceRuleIds are preserved through the engine integration", () => {
    const input = makeValidInput();
    const exercise = makeExercise();

    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([
      [exercise.id, toSource(makePrescribeExerciseInput({ exerciseId: exercise.id, moduleId: "strength" }))],
    ]);

    const result = runEngine(input, [exercise], prescriptionSources);

    if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft.");
    }

    expect(result.prescription.session.sourceRuleIds.length).toBeGreaterThan(0);
  });

  test("11. an unavailable prescription is traceable to its exact cause", () => {
    const input = makeValidInput();
    const exercise = makeExercise();

    const result = runEngine(input, [exercise], new Map());

    if (result.outcome !== "draft" || result.prescription?.status !== "unavailable") {
      throw new Error("Expected an unavailable prescription.");
    }

    const unavailableEntry = result.decisionTrace.entries.find(
      (entry) => entry.stage === "prescription_generation" && entry.decision.includes("unavailable"),
    );
    if (unavailableEntry === undefined) {
      throw new Error("Expected a prescription_generation trace entry explaining the unavailability.");
    }
    expect(unavailableEntry.reasons.some((reason) => reason.includes(exercise.id))).toBe(true);
    expect(unavailableEntry.affectedExerciseIds).toEqual([exercise.id]);
  });

  test("12. determinism: identical inputs produce identical prescribed results", () => {
    const input = makeValidInput();
    const exercise = makeExercise();
    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([
      [exercise.id, toSource(makePrescribeExerciseInput({ exerciseId: exercise.id, moduleId: "strength" }))],
    ]);

    const resultA = runEngine(input, [exercise], prescriptionSources);
    const resultB = runEngine(input, [exercise], prescriptionSources);

    expect(resultA).toEqual(resultB);
  });

  test("13. does not mutate its inputs", () => {
    const input = makeValidInput();
    const exercise = makeExercise();
    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([
      [exercise.id, toSource(makePrescribeExerciseInput({ exerciseId: exercise.id, moduleId: "strength" }))],
    ]);

    const inputBefore = JSON.stringify(input);
    const exerciseBefore = JSON.stringify(exercise);
    const sourcesBefore = JSON.stringify([...prescriptionSources]);

    runEngine(input, [exercise], prescriptionSources);

    expect(JSON.stringify(input)).toBe(inputBefore);
    expect(JSON.stringify(exercise)).toBe(exerciseBefore);
    expect(JSON.stringify([...prescriptionSources])).toBe(sourcesBefore);
  });

  test("15. historical invalid/blocked outcomes never gain a prescription field", () => {
    const invalidInput = makeValidInput({
      medicalState: { trainingClearanceStatus: "not_cleared", painReports: [], restrictions: [] },
    });
    const invalidResult = runEngine(invalidInput, []);
    expect(invalidResult.outcome).toBe("invalid_input");
    expect("prescription" in invalidResult).toBe(false);

    const blockedInput = makeValidInput();
    const blockedResult = runEngine(blockedInput, [
      makeExercise({ id: "exercise-other-module", module: "conditioning", primaryAdaptation: "conditioning" }),
    ]);
    expect(blockedResult.outcome).toBe("blocked");
    expect("prescription" in blockedResult).toBe(false);
  });

  test("17. + 18. a pilot exercise from the real prescription registry prescribes end to end through runEngine, with prescription_generation traced", () => {
    const input = makeValidInput();
    // Matches the registry's "bench_press" entry (module "strength", role
    // "primary") — the engine's own module selection resolves the same
    // module from the default "maximum_strength" primary objective.
    const exercise = makeExercise({ id: "bench_press" });

    const sourceResult = getExercisePrescriptionSource("bench_press", {
      rangeContext: "normal",
      athleteReferences: [makeOneRepMaxReference({ value: 100 })],
      availableEquipmentCapabilities: ["barbell", "bench", "rack", "plates"],
    });
    if (!sourceResult.ok) {
      throw new Error(`Fixture setup failed: ${sourceResult.message}`);
    }

    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([["bench_press", sourceResult.source]]);

    const result = runEngine(input, [exercise], prescriptionSources);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }
    if (result.prescription?.status !== "prescribed") {
      throw new Error(`Expected prescription status "prescribed", got: ${JSON.stringify(result.prescription)}`);
    }

    expect(result.prescription.session.exercises[0]?.prescription.methodId).toBe("straight_sets_repetitions");
    expect(
      result.decisionTrace.entries.some((entry) => entry.stage === "prescription_generation"),
    ).toBe(true);
  });
});
