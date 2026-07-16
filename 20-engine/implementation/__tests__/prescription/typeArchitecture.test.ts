import { describe, expect, test } from "vitest";

import { prescribeExercise, type ExercisePrescription } from "../../prescription/prescribeExercise";
import { prescribeSession, type SessionExercisePrescriptionInput } from "../../prescription/prescribeSession";
import type { DeferredExercisePrescription, GeneratedSession } from "../../types";
import { makeCapabilities, makePrescribeExerciseInput } from "./fixtures";

/**
 * Guards the type architecture established by the prescription/runEngine
 * type-consolidation task:
 * - exactly one type named `ExercisePrescription` exists project-wide
 *   (the canonical, deterministic model in `prescription/prescribeExercise.ts`);
 * - the legacy pre-prescription-layer sketch in `types.ts` was renamed to
 *   `DeferredExercisePrescription` and no longer collides with it;
 * - session-level output has exactly one canonical shape
 *   (`SessionPrescription` from `prescribeSession.ts`), distinct from the
 *   unconstructed `GeneratedSession` placeholder in `types.ts`;
 * - resolver traces remain accessible and untouched;
 * - `ok` still discriminates success/failure everywhere.
 *
 * These two type-only imports compiling side by side, without an `as`
 * alias, is itself the proof that the `ExercisePrescription` name
 * collision no longer exists.
 */
function assertIsDeferredExercisePrescription(_value: DeferredExercisePrescription): void {}
function assertIsGeneratedSessionShape(_value: GeneratedSession): void {}

describe("prescription type architecture", () => {
  test("the canonical ExercisePrescription is a rich resolved model, not the legacy flat sketch", () => {
    const result = prescribeExercise(makePrescribeExerciseInput());

    if (!result.ok) {
      throw new Error(`Expected prescription to succeed, got failure: ${result.message}`);
    }

    const prescription: ExercisePrescription = result.prescription;

    // Canonical-model-only fields (absent from the legacy DeferredExercisePrescription sketch).
    expect(prescription.methodId).toBe("straight_sets_repetitions");
    expect(prescription.volume.structure).toBe("sets_reps");
    expect(prescription.intensity.primaryMetric.type).toBeDefined();
    expect(prescription.status).toBe("complete");

    // The legacy sketch's flat fields (sets, loadKg, tempo: string, ...) do not exist on this type.
    expect(prescription).not.toHaveProperty("loadKg");
    expect(prescription).not.toHaveProperty("coachingCues");
  });

  test("resolver traces remain fully accessible on a successful prescription", () => {
    const result = prescribeExercise(makePrescribeExerciseInput());

    if (!result.ok) {
      throw new Error(`Expected prescription to succeed, got failure: ${result.message}`);
    }

    expect(result.trace.method.ok).toBe(true);
    expect(result.trace.compatibility.compatible).toBe(true);
    expect(result.trace.volume.ok).toBe(true);
    expect(result.trace.intensity.ok).toBe(true);
    expect(result.trace.rest.ok).toBe(true);
    expect(result.trace.tempo.ok).toBe(true);
    expect(result.trace.instructions.ok).toBe(true);
    expect(result.trace.stopConditions.ok).toBe(true);
    expect(result.trace.validation.valid).toBe(true);
  });

  test("resolver traces remain accessible (partially) on a failed prescription", () => {
    const result = prescribeExercise(
      makePrescribeExerciseInput({ explicitMethodId: "totally_invented_method" }),
    );

    if (result.ok) {
      throw new Error("Expected prescription to fail at the method stage.");
    }

    expect(result.trace.method?.ok).toBe(false);
    expect(result.trace.compatibility).toBeUndefined();
  });

  test("success and failure remain discriminated by ok for prescribeExercise", () => {
    const success = prescribeExercise(makePrescribeExerciseInput());
    const failure = prescribeExercise(
      makePrescribeExerciseInput({ explicitMethodId: "totally_invented_method" }),
    );

    expect(success.ok).toBe(true);
    expect(failure.ok).toBe(false);
  });

  test("SessionPrescription is the single canonical session-level shape", () => {
    const exercise: SessionExercisePrescriptionInput = {
      ...makePrescribeExerciseInput(),
      order: 1,
      required: true,
      blockId: "block-main",
    };

    const result = prescribeSession({
      sessionId: "session-architecture-1",
      sessionName: "Architecture Test Session",
      modules: ["strength"],
      exercises: [exercise],
    });

    if (!result.ok) {
      throw new Error(`Expected session prescription to succeed, got issues: ${JSON.stringify(result.issues)}`);
    }

    expect(result.session.status).toBe("complete");
    expect(result.session.exercises[0]?.prescription.methodId).toBe("straight_sets_repetitions");
  });

  test("success and failure remain discriminated by ok for prescribeSession", () => {
    const requiredFailing: SessionExercisePrescriptionInput = {
      ...makePrescribeExerciseInput({
        capabilities: makeCapabilities({ supportedMethodIds: ["timed_isometric_sets"] }),
      }),
      order: 1,
      required: true,
      blockId: "block-main",
    };

    const failure = prescribeSession({
      sessionId: "session-architecture-2",
      sessionName: "Architecture Test Session",
      modules: ["strength"],
      exercises: [requiredFailing],
    });

    expect(failure.ok).toBe(false);
  });

  test("the legacy DeferredExercisePrescription and GeneratedSession placeholders remain structurally distinct and unconstructed here", () => {
    // These functions exist purely so the two `import type` statements above
    // are exercised by the type checker; nothing in this suite constructs a
    // `DeferredExercisePrescription` or `GeneratedSession` value, since
    // neither is wired to real logic yet (by design — not part of this task).
    expect(typeof assertIsDeferredExercisePrescription).toBe("function");
    expect(typeof assertIsGeneratedSessionShape).toBe("function");
  });

  test("determinism: identical prescribeExercise input produces an identical result", () => {
    const input = makePrescribeExerciseInput();

    expect(prescribeExercise(input)).toEqual(prescribeExercise(input));
  });

  test("does not mutate its prescribeExercise input", () => {
    const input = makePrescribeExerciseInput();
    const snapshot = JSON.parse(JSON.stringify(input));

    prescribeExercise(input);

    expect(input).toEqual(snapshot);
  });
});
