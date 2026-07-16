import { describe, expect, test } from "vitest";

import { prescribeExercise } from "../../prescription/prescribeExercise";
import { makeCapabilities, makePrescribeExerciseInput } from "./fixtures";

describe("prescribeExercise", () => {
  test("prescribes a fully documented-compatible exercise end to end", () => {
    const result = prescribeExercise(makePrescribeExerciseInput());

    if (!result.ok) {
      throw new Error(`Expected prescription to succeed, got failure at ${result.failureStage}: ${result.message}`);
    }

    expect(result.prescription.methodId).toBe("straight_sets_repetitions");
    expect(result.prescription.status).toBe("complete");
    expect(result.prescription.volume.sets).toBe(3);
    expect(result.prescription.instructions.length).toBeGreaterThan(0);
    expect(result.prescription.stopConditions.length).toBeGreaterThan(0);
  });

  test("fails at the method stage for an unknown explicit method identifier", () => {
    const result = prescribeExercise(
      makePrescribeExerciseInput({ explicitMethodId: "totally_invented_method" }),
    );

    if (result.ok) {
      throw new Error("Expected prescription to fail at the method stage.");
    }

    expect(result.failureStage).toBe("method");
  });

  test("fails at the compatibility stage when the exercise does not declare support for the resolved method", () => {
    const result = prescribeExercise(
      makePrescribeExerciseInput({
        capabilities: makeCapabilities({ supportedMethodIds: ["timed_isometric_sets"] }),
      }),
    );

    if (result.ok) {
      throw new Error("Expected prescription to fail at the compatibility stage.");
    }

    expect(result.failureStage).toBe("compatibility");
  });

  test("fails at the intensity stage when no athlete reference is available for the only supported intensity type", () => {
    const result = prescribeExercise(
      makePrescribeExerciseInput({
        supportedIntensityTypes: ["percentage_1rm"],
        athleteReferences: [],
      }),
    );

    if (result.ok) {
      throw new Error("Expected prescription to fail at the intensity stage.");
    }

    expect(result.failureStage).toBe("intensity");
  });

  test("fails at the tempo stage when the exercise does not support the documented tempo type", () => {
    const result = prescribeExercise(
      makePrescribeExerciseInput({ supportedTempoTypes: ["isometric_hold"] }),
    );

    if (result.ok) {
      throw new Error("Expected prescription to fail at the tempo stage.");
    }

    expect(result.failureStage).toBe("tempo");
  });

  test("fails at the instructions stage when a required instruction has no matching definition", () => {
    const result = prescribeExercise(
      makePrescribeExerciseInput({
        capabilities: makeCapabilities({ requiredInstructionIds: ["instr-nonexistent"] }),
      }),
    );

    if (result.ok) {
      throw new Error("Expected prescription to fail at the instructions stage.");
    }

    expect(result.failureStage).toBe("instructions");
  });

  test("fails at the stop_conditions stage when a required stop condition has no matching definition", () => {
    const result = prescribeExercise(
      makePrescribeExerciseInput({
        capabilities: makeCapabilities({ requiredStopConditionIds: ["stop-nonexistent"] }),
      }),
    );

    if (result.ok) {
      throw new Error("Expected prescription to fail at the stop_conditions stage.");
    }

    expect(result.failureStage).toBe("stop_conditions");
  });

  test("fails at the final validation stage when every stage resolves but no instruction was ever required", () => {
    const result = prescribeExercise(
      makePrescribeExerciseInput({
        capabilities: makeCapabilities({ requiredInstructionIds: [] }),
      }),
    );

    if (result.ok) {
      throw new Error("Expected prescription to fail at the validation stage.");
    }

    expect(result.failureStage).toBe("validation");
    expect(result.trace.validation?.valid).toBe(false);
  });

  test("determinism: identical input produces an identical result", () => {
    const input = makePrescribeExerciseInput();

    expect(prescribeExercise(input)).toEqual(prescribeExercise(input));
  });

  test("does not mutate its input", () => {
    const input = makePrescribeExerciseInput();
    const snapshot = JSON.parse(JSON.stringify(input));

    prescribeExercise(input);

    expect(input).toEqual(snapshot);
  });
});
