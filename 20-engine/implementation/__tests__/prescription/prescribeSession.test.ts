import { describe, expect, test } from "vitest";

import { prescribeSession, type SessionExercisePrescriptionInput } from "../../prescription/prescribeSession";
import {
  makeCapabilities,
  makeInstructionDefinitions,
  makePrescribeExerciseInput,
  makeStopConditionDefinitions,
  REQUIRED_INSTRUCTION_IDS,
  REQUIRED_STOP_CONDITION_IDS,
} from "./fixtures";

/**
 * A second, documented-compatible exercise (core / timed_isometric_sets /
 * robustness) distinct from the strength/straight_sets_repetitions primary
 * fixture, used to exercise session-level multi-exercise behaviour.
 */
function makeCoreIsometricExerciseInput(
  overrides: Partial<SessionExercisePrescriptionInput> = {},
): SessionExercisePrescriptionInput {
  return {
    exerciseId: "exercise-2",
    moduleId: "core",
    role: "robustness",
    rangeContext: "normal",
    capabilities: makeCapabilities({
      exerciseId: "exercise-2",
      supportedMethodIds: ["timed_isometric_sets"],
      supportedVolumeStructures: ["sets_duration"],
      supportedIntensityTypes: ["rpe"],
      preferredIntensityTypes: ["rpe"],
      supportedTempoTypes: ["isometric_hold"],
      capabilityTags: ["timed_effort", "tempo_control", "technical_quality_observation"],
      requiredInstructionIds: [...REQUIRED_INSTRUCTION_IDS],
      requiredStopConditionIds: [...REQUIRED_STOP_CONDITION_IDS],
    }),
    supportedIntensityTypes: ["rpe"],
    supportedTempoTypes: ["isometric_hold"],
    instructionDefinitions: makeInstructionDefinitions(),
    stopConditionDefinitions: makeStopConditionDefinitions(),
    order: 2,
    required: true,
    blockId: "block-accessory",
    ...overrides,
  };
}

function makeStrengthExerciseInput(
  overrides: Partial<SessionExercisePrescriptionInput> = {},
): SessionExercisePrescriptionInput {
  return {
    ...makePrescribeExerciseInput(),
    order: 1,
    required: true,
    blockId: "block-main",
    ...overrides,
  };
}

describe("prescribeSession", () => {
  test("prescribes a complete session, preserving exercise order", () => {
    const result = prescribeSession({
      sessionId: "session-1",
      sessionName: "Test Session",
      modules: ["strength", "core"],
      exercises: [makeStrengthExerciseInput(), makeCoreIsometricExerciseInput()],
    });

    if (!result.ok) {
      throw new Error(`Expected session prescription to succeed, got issues: ${JSON.stringify(result.issues)}`);
    }

    expect(result.session.exercises.map((exercise) => exercise.order)).toEqual([1, 2]);
    expect(result.omittedOptionalExerciseIds).toEqual([]);
  });

  test("refuses a session whose required exercise fails", () => {
    const failingRequired = makeCoreIsometricExerciseInput({
      required: true,
      supportedTempoTypes: [],
    });

    const result = prescribeSession({
      sessionId: "session-2",
      sessionName: "Test Session",
      modules: ["strength", "core"],
      exercises: [makeStrengthExerciseInput(), failingRequired],
    });

    if (result.ok) {
      throw new Error("Expected session prescription to fail when a required exercise fails.");
    }

    expect(result.issues.some((issue) => issue.code === "SESSION_REQUIRED_EXERCISE_FAILED")).toBe(true);
    expect(result.issues.some((issue) => issue.exerciseId === "exercise-2")).toBe(true);
  });

  test("silently omits an optional exercise that fails, keeping the session valid", () => {
    const failingOptional = makeCoreIsometricExerciseInput({
      required: false,
      supportedTempoTypes: [],
    });

    const result = prescribeSession({
      sessionId: "session-3",
      sessionName: "Test Session",
      modules: ["strength", "core"],
      exercises: [makeStrengthExerciseInput(), failingOptional],
    });

    if (!result.ok) {
      throw new Error(`Expected session prescription to succeed, got issues: ${JSON.stringify(result.issues)}`);
    }

    expect(result.omittedOptionalExerciseIds).toEqual(["exercise-2"]);
    expect(result.session.exercises.map((exercise) => exercise.order)).toEqual([1]);
  });

  test("fails safely on an empty exercise list", () => {
    const result = prescribeSession({
      sessionId: "session-4",
      sessionName: "Test Session",
      modules: ["strength"],
      exercises: [],
    });

    if (result.ok) {
      throw new Error("Expected session prescription to fail for an empty exercise list.");
    }

    expect(result.issues.some((issue) => issue.code === "SESSION_EXERCISES_EMPTY")).toBe(true);
  });

  test("fails safely on duplicate exercise order values", () => {
    const result = prescribeSession({
      sessionId: "session-5",
      sessionName: "Test Session",
      modules: ["strength", "core"],
      exercises: [makeStrengthExerciseInput(), makeCoreIsometricExerciseInput({ order: 1 })],
    });

    if (result.ok) {
      throw new Error("Expected session prescription to fail for duplicate exercise order values.");
    }

    expect(result.issues.some((issue) => issue.code === "SESSION_EXERCISE_ORDER_DUPLICATE")).toBe(true);
  });

  test("fails safely when an exercise uses a module the session never declared", () => {
    const result = prescribeSession({
      sessionId: "session-6",
      sessionName: "Test Session",
      modules: ["strength"],
      exercises: [makeStrengthExerciseInput(), makeCoreIsometricExerciseInput()],
    });

    if (result.ok) {
      throw new Error("Expected session prescription to fail for an undeclared module.");
    }

    expect(result.issues.some((issue) => issue.code === "SESSION_EXERCISE_MODULE_UNDECLARED")).toBe(true);
  });

  test("determinism: identical input produces an identical result", () => {
    const input = {
      sessionId: "session-7",
      sessionName: "Test Session",
      modules: ["strength", "core"] as const,
      exercises: [makeStrengthExerciseInput(), makeCoreIsometricExerciseInput()],
    };

    expect(prescribeSession(input)).toEqual(prescribeSession(input));
  });

  test("does not mutate its input", () => {
    const input = {
      sessionId: "session-8",
      sessionName: "Test Session",
      modules: ["strength", "core"] as const,
      exercises: [makeStrengthExerciseInput(), makeCoreIsometricExerciseInput()],
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    prescribeSession(input);

    expect(input).toEqual(snapshot);
  });
});
