import { describe, expect, test } from "vitest";

import {
  adaptExercisePrescriptionResult,
  adaptSessionPrescriptionResult,
  type PrescriptionTraceContext,
} from "../../prescription/prescriptionDecisionTrace";
import { prescribeExercise } from "../../prescription/prescribeExercise";
import { prescribeSession, type SessionExercisePrescriptionInput } from "../../prescription/prescribeSession";
import type { DecisionStage } from "../../types";
import { makeCapabilities, makePrescribeExerciseInput } from "./fixtures";

const CONTEXT: PrescriptionTraceContext = {
  idPrefix: "trace_test-request-1",
  timestamp: "2026-07-16T00:00:00.000Z",
};

// Compile-time proof that "prescription_generation" is a real DecisionStage value.
const PRESCRIPTION_GENERATION_STAGE: DecisionStage = "prescription_generation";

describe("prescriptionDecisionTrace", () => {
  test("every produced entry uses the prescription_generation stage", () => {
    const result = prescribeExercise(makePrescribeExerciseInput());
    const entries = adaptExercisePrescriptionResult(result, CONTEXT);

    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.stage).toBe(PRESCRIPTION_GENERATION_STAGE);
    }
  });

  test("adapts a successful exercise prescription into one entry per stage plus a summary", () => {
    const result = prescribeExercise(makePrescribeExerciseInput());
    const entries = adaptExercisePrescriptionResult(result, CONTEXT);

    // 9 resolver stages + 1 summary entry.
    expect(entries).toHaveLength(10);

    const summary = entries[entries.length - 1];
    expect(summary?.decision).toContain("fully prescribed");
    expect(summary?.decision).toContain("exercise-1");
    expect(summary?.affectedExerciseIds).toEqual(["exercise-1"]);
    expect(summary?.affectedModules).toEqual(["strength"]);
  });

  test("adapts a method-resolution failure into a method entry plus a failure summary", () => {
    const result = prescribeExercise(
      makePrescribeExerciseInput({ explicitMethodId: "totally_invented_method" }),
    );
    const entries = adaptExercisePrescriptionResult(result, CONTEXT);

    expect(entries).toHaveLength(2);
    expect(entries[0]?.decision).toContain("Method resolution failed");
    expect(entries[1]?.decision).toContain('failed at stage "method"');
  });

  test("adapts a compatibility failure into method + compatibility entries plus a failure summary", () => {
    const result = prescribeExercise(
      makePrescribeExerciseInput({
        capabilities: makeCapabilities({ supportedMethodIds: ["timed_isometric_sets"] }),
      }),
    );
    const entries = adaptExercisePrescriptionResult(result, CONTEXT);

    expect(entries).toHaveLength(3);
    expect(entries.map((entry) => entry.id)).toEqual([
      "trace_test-request-1_prescription_generation_exercise-1_method",
      "trace_test-request-1_prescription_generation_exercise-1_compatibility",
      "trace_test-request-1_prescription_generation_exercise-1_summary",
    ]);
    expect(entries[2]?.decision).toContain('failed at stage "compatibility"');
  });

  test("adapts an intensity failure into method + compatibility + volume + intensity entries plus a failure summary", () => {
    const result = prescribeExercise(
      makePrescribeExerciseInput({
        supportedIntensityTypes: ["percentage_1rm"],
        athleteReferences: [],
      }),
    );
    const entries = adaptExercisePrescriptionResult(result, CONTEXT);

    expect(entries).toHaveLength(5);
    expect(entries.map((entry) => entry.id)).toEqual([
      "trace_test-request-1_prescription_generation_exercise-1_method",
      "trace_test-request-1_prescription_generation_exercise-1_compatibility",
      "trace_test-request-1_prescription_generation_exercise-1_volume",
      "trace_test-request-1_prescription_generation_exercise-1_intensity",
      "trace_test-request-1_prescription_generation_exercise-1_summary",
    ]);
    expect(entries[4]?.decision).toContain('failed at stage "intensity"');
  });

  test("adapts a successful session into per-exercise entries plus a session summary", () => {
    const exercise: SessionExercisePrescriptionInput = {
      ...makePrescribeExerciseInput(),
      order: 1,
      required: true,
      blockId: "block-main",
    };

    const sessionResult = prescribeSession({
      sessionId: "session-trace-1",
      sessionName: "Trace Test Session",
      modules: ["strength"],
      exercises: [exercise],
    });

    if (!sessionResult.ok) {
      throw new Error(`Expected session prescription to succeed, got issues: ${JSON.stringify(sessionResult.issues)}`);
    }

    const entries = adaptSessionPrescriptionResult(sessionResult, CONTEXT);

    // 10 entries for the one exercise + 1 session-level summary.
    expect(entries).toHaveLength(11);

    const sessionSummary = entries[entries.length - 1];
    expect(sessionSummary?.decision).toBe('Session "session-trace-1" fully prescribed.');
    expect(sessionSummary?.affectedModules).toEqual(["strength"]);
  });

  test("adapts a failed session into a session-level failure summary", () => {
    const sessionResult = prescribeSession({
      sessionId: "session-trace-2",
      sessionName: "Trace Test Session",
      modules: ["strength"],
      exercises: [],
    });

    if (sessionResult.ok) {
      throw new Error("Expected session prescription to fail for an empty exercise list.");
    }

    const entries = adaptSessionPrescriptionResult(sessionResult, CONTEXT);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.decision).toBe('Session "session-trace-2" prescription failed.');
    expect(entries[0]?.reasons.some((reason) => reason.startsWith("SESSION_EXERCISES_EMPTY"))).toBe(true);
  });

  test("preserves sourceRuleIds from the underlying resolver results", () => {
    const result = prescribeExercise(makePrescribeExerciseInput());
    const entries = adaptExercisePrescriptionResult(result, CONTEXT);

    if (!result.ok) {
      throw new Error("Expected prescription to succeed.");
    }

    const methodEntry = entries.find((entry) => entry.id.endsWith("_method"));
    expect(methodEntry?.sourceRuleIds).toEqual(result.trace.method.sourceRuleIds);

    const summaryEntry = entries[entries.length - 1];
    expect(summaryEntry?.sourceRuleIds).toEqual(result.prescription.sourceRuleIds);
    expect(summaryEntry?.sourceRuleIds?.length).toBeGreaterThan(0);
  });

  test("does not duplicate the full resolved prescription content into the trace entries", () => {
    const result = prescribeExercise(makePrescribeExerciseInput());
    const entries = adaptExercisePrescriptionResult(result, CONTEXT);

    for (const entry of entries) {
      // Entries stay flat and minimal: no nested prescription/volume/intensity objects.
      expect(entry).not.toHaveProperty("prescription");
      expect(entry).not.toHaveProperty("volume");
      expect(entry).not.toHaveProperty("intensity");
      for (const reason of entry.reasons) {
        expect(typeof reason).toBe("string");
      }
    }

    const serializedEntries = JSON.stringify(entries);
    // The full resolved instruction/stop-condition text should never leak into the trace.
    expect(serializedEntries).not.toContain("Set the safety pins");
  });

  test("determinism: identical input produces an identical adapted trace", () => {
    const result = prescribeExercise(makePrescribeExerciseInput());

    expect(adaptExercisePrescriptionResult(result, CONTEXT)).toEqual(
      adaptExercisePrescriptionResult(result, CONTEXT),
    );
  });

  test("does not mutate the prescription result or the context", () => {
    const result = prescribeExercise(makePrescribeExerciseInput());
    const resultSnapshot = JSON.parse(JSON.stringify(result));
    const contextSnapshot = JSON.parse(JSON.stringify(CONTEXT));

    adaptExercisePrescriptionResult(result, CONTEXT);

    expect(result).toEqual(resultSnapshot);
    expect(CONTEXT).toEqual(contextSnapshot);
  });
});
