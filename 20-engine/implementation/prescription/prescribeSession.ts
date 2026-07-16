/**
 * Combat Athlete System — Session Prescriber
 * Version 0.1
 *
 * Applies the exercise prescription pipeline to an ordered session draft.
 *
 * This orchestrator:
 * - preserves exercise order;
 * - never skips a failed essential exercise silently;
 * - returns a complete session only when every required exercise succeeds;
 * - retains the full per-exercise trace.
 */

import type { CapabilityModule, Identifier } from "../types";
import {
  prescribeExercise,
  type ExercisePrescription,
  type PrescribeExerciseInput,
  type PrescribeExerciseResult,
} from "./prescribeExercise";

// -----------------------------------------------------------------------------
// Input
// -----------------------------------------------------------------------------

export interface SessionExercisePrescriptionInput
  extends PrescribeExerciseInput {
  order: number;
  required: boolean;
  blockId: Identifier;
}

export interface PrescribeSessionInput {
  sessionId: Identifier;
  sessionName: string;
  modules: readonly CapabilityModule[];
  exercises: readonly SessionExercisePrescriptionInput[];
  sourceRuleIds?: readonly Identifier[];
}

// -----------------------------------------------------------------------------
// Output
// -----------------------------------------------------------------------------

export type SessionPrescriptionFailureCode =
  | "SESSION_ID_INVALID"
  | "SESSION_NAME_INVALID"
  | "SESSION_MODULES_EMPTY"
  | "SESSION_EXERCISES_EMPTY"
  | "SESSION_EXERCISE_ORDER_INVALID"
  | "SESSION_EXERCISE_ORDER_DUPLICATE"
  | "SESSION_EXERCISE_MODULE_UNDECLARED"
  | "SESSION_REQUIRED_EXERCISE_FAILED"
  | "SESSION_NO_SUCCESSFUL_EXERCISE"
  | "SESSION_SOURCE_RULES_MISSING";

export interface PrescribedSessionExercise {
  order: number;
  blockId: Identifier;
  required: boolean;
  prescription: ExercisePrescription;
}

export interface SessionPrescription {
  sessionId: Identifier;
  sessionName: string;
  modules: readonly CapabilityModule[];
  exercises: readonly PrescribedSessionExercise[];
  sourceRuleIds: readonly Identifier[];
  status: "complete";
}

export interface PrescribeSessionSuccess {
  ok: true;
  session: SessionPrescription;
  /**
   * One `PrescribeExerciseResult` per exercise, in session order — each
   * already carries its own `ExercisePrescriptionTrace` /
   * `ExercisePrescriptionFailureTrace` (see `prescribeExercise.ts`). This
   * array is the session-level trace aggregate a future `decisionTrace.ts`
   * connector would iterate; it is not consumed further here.
   */
  exerciseResults: readonly PrescribeExerciseResult[];
  omittedOptionalExerciseIds: readonly Identifier[];
}

export interface SessionPrescriptionIssue {
  code: SessionPrescriptionFailureCode;
  message: string;
  exerciseId: Identifier | null;
  recoverable: boolean;
}

export interface PrescribeSessionFailure {
  ok: false;
  sessionId: Identifier;
  issues: readonly SessionPrescriptionIssue[];
  exerciseResults: readonly PrescribeExerciseResult[];
  omittedOptionalExerciseIds: readonly Identifier[];
  sourceRuleIds: readonly Identifier[];
}

export type PrescribeSessionResult =
  | PrescribeSessionSuccess
  | PrescribeSessionFailure;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const isValidIdentifier = (value: unknown): value is Identifier =>
  typeof value === "string" && value.trim().length > 0;

const findDuplicates = (values: readonly number[]): number[] => {
  const seen = new Set<number>();
  const duplicates = new Set<number>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    } else {
      seen.add(value);
    }
  }

  return [...duplicates];
};

// -----------------------------------------------------------------------------
// Orchestrator
// -----------------------------------------------------------------------------

export const prescribeSession = (
  input: PrescribeSessionInput,
): PrescribeSessionResult => {
  const issues: SessionPrescriptionIssue[] = [];

  if (!isValidIdentifier(input.sessionId)) {
    issues.push({
      code: "SESSION_ID_INVALID",
      message: "Session identifier is empty or invalid.",
      exerciseId: null,
      recoverable: false,
    });
  }

  if (input.sessionName.trim().length === 0) {
    issues.push({
      code: "SESSION_NAME_INVALID",
      message: "Session name is empty.",
      exerciseId: null,
      recoverable: false,
    });
  }

  if (input.modules.length === 0) {
    issues.push({
      code: "SESSION_MODULES_EMPTY",
      message: "Session contains no declared Capability Module.",
      exerciseId: null,
      recoverable: false,
    });
  }

  if (input.exercises.length === 0) {
    issues.push({
      code: "SESSION_EXERCISES_EMPTY",
      message: "Session contains no exercise to prescribe.",
      exerciseId: null,
      recoverable: false,
    });
  }

  const invalidOrderExercises = input.exercises.filter(
    (exercise) =>
      !Number.isInteger(exercise.order) || exercise.order < 1,
  );

  for (const exercise of invalidOrderExercises) {
    issues.push({
      code: "SESSION_EXERCISE_ORDER_INVALID",
      message: `Exercise ${exercise.exerciseId} has invalid order ${exercise.order}.`,
      exerciseId: exercise.exerciseId,
      recoverable: false,
    });
  }

  const duplicateOrders = findDuplicates(
    input.exercises.map((exercise) => exercise.order),
  );

  for (const order of duplicateOrders) {
    issues.push({
      code: "SESSION_EXERCISE_ORDER_DUPLICATE",
      message: `Exercise order ${order} is duplicated.`,
      exerciseId: null,
      recoverable: false,
    });
  }

  const undeclaredModuleExercises = input.exercises.filter(
    (exercise) => !input.modules.includes(exercise.moduleId),
  );

  for (const exercise of undeclaredModuleExercises) {
    issues.push({
      code: "SESSION_EXERCISE_MODULE_UNDECLARED",
      message: `Exercise ${exercise.exerciseId} uses undeclared module ${exercise.moduleId}.`,
      exerciseId: exercise.exerciseId,
      recoverable: false,
    });
  }

  if (issues.length > 0) {
    return {
      ok: false,
      sessionId: input.sessionId,
      issues,
      exerciseResults: [],
      omittedOptionalExerciseIds: [],
      sourceRuleIds: unique(input.sourceRuleIds ?? []),
    };
  }

  const orderedExercises = [...input.exercises].sort(
    (left, right) => left.order - right.order,
  );

  const exerciseResults = orderedExercises.map((exercise) =>
    prescribeExercise(exercise),
  );

  const prescribedExercises: PrescribedSessionExercise[] = [];
  const omittedOptionalExerciseIds: Identifier[] = [];

  for (let index = 0; index < orderedExercises.length; index += 1) {
    const exerciseInput = orderedExercises[index];
    const result = exerciseResults[index];

    if (exerciseInput === undefined || result === undefined) {
      continue;
    }

    if (!result.ok) {
      if (exerciseInput.required) {
        issues.push({
          code: "SESSION_REQUIRED_EXERCISE_FAILED",
          message: `Required exercise ${exerciseInput.exerciseId} failed during ${result.failureStage}: ${result.message}`,
          exerciseId: exerciseInput.exerciseId,
          recoverable: false,
        });
      } else {
        omittedOptionalExerciseIds.push(exerciseInput.exerciseId);
      }

      continue;
    }

    prescribedExercises.push({
      order: exerciseInput.order,
      blockId: exerciseInput.blockId,
      required: exerciseInput.required,
      prescription: result.prescription,
    });
  }

  if (prescribedExercises.length === 0) {
    issues.push({
      code: "SESSION_NO_SUCCESSFUL_EXERCISE",
      message: "No exercise could be prescribed successfully.",
      exerciseId: null,
      recoverable: false,
    });
  }

  const sourceRuleIds = unique([
    ...(input.sourceRuleIds ?? []),
    ...prescribedExercises.flatMap(
      (exercise) => exercise.prescription.sourceRuleIds,
    ),
  ]);

  if (sourceRuleIds.length === 0) {
    issues.push({
      code: "SESSION_SOURCE_RULES_MISSING",
      message: "Session prescription contains no source-rule traceability.",
      exerciseId: null,
      recoverable: false,
    });
  }

  if (issues.length > 0) {
    return {
      ok: false,
      sessionId: input.sessionId,
      issues,
      exerciseResults,
      omittedOptionalExerciseIds,
      sourceRuleIds,
    };
  }

  return {
    ok: true,
    session: {
      sessionId: input.sessionId,
      sessionName: input.sessionName,
      modules: unique(input.modules),
      exercises: prescribedExercises,
      sourceRuleIds,
      status: "complete",
    },
    exerciseResults,
    omittedOptionalExerciseIds,
  };
};
