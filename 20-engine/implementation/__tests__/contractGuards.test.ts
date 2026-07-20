/**
 * Combat Athlete System — Contract Guard Tests
 *
 * A small number of tests targeting deterministic pipeline-contract
 * guards that `runEngine`'s public API cannot provoke (the module
 * selector already deduplicates, and the final selector already
 * guarantees at most one selected candidate per module). Both guards
 * below live in `buildDecisionTrace`, so it is called directly with
 * hand-built inputs — never via `runEngine`.
 *
 * Deliberately not tested here (both explicitly deferred per the
 * approved audit): a `combat_schedule` conflict with more than one
 * affected exercise id (the guard is a private helper inside `index.ts`,
 * not exported, and exporting it solely to test it was rejected), and a
 * session reconstruction that unexpectedly becomes blocked after a valid
 * substitution (structurally impossible via any current public API).
 */

import { describe, expect, test } from "vitest";

import { buildDecisionTrace } from "../decisionTrace";
import { checkExerciseEligibility } from "../exerciseSelector";
import { scoreExercise } from "../scoringEngine";
import type { ExerciseSelectionResult, SelectedModule, ValidationResult } from "../types";

import { makeExercise, makeValidInput } from "./fixtures";

const EMPTY_VALIDATION: ValidationResult = { valid: true, issues: [] };

describe("contract guards", () => {
  test("buildDecisionTrace throws on duplicate module selections", () => {
    const input = makeValidInput();
    const duplicatedModules: SelectedModule[] = [
      { module: "strength", role: "primary", primaryAdaptation: "maximum_strength", reason: "Primary." },
      { module: "strength", role: "secondary", primaryAdaptation: "maximum_strength", reason: "Duplicate." },
    ];

    expect(() =>
      buildDecisionTrace(
        input,
        EMPTY_VALIDATION,
        duplicatedModules,
        [],
        [],
        [],
        { outcome: "blocked", reasonCode: "NO_PRIMARY_MODULE_SELECTED", reason: "n/a", blockedModules: [] },
        [],
      ),
    ).toThrowError('Decision trace cannot contain duplicate module selection "strength".');
  });

  test("buildDecisionTrace throws when a module reports more than one selected candidate", () => {
    const input = makeValidInput();
    const exercise = makeExercise();
    const eligibility = checkExerciseEligibility(exercise, input);
    const selectedModule: SelectedModule = {
      module: "strength",
      role: "primary",
      primaryAdaptation: "maximum_strength",
      reason: "Primary.",
    };
    const scored = scoreExercise(exercise, eligibility, input, selectedModule);

    const exerciseSelection: ExerciseSelectionResult = {
      module: "strength",
      role: "primary",
      candidates: [
        { scoredExercise: scored, selected: true, selectionReasons: ["First."] },
        { scoredExercise: scored, selected: true, selectionReasons: ["Second."] },
      ],
    };

    expect(() =>
      buildDecisionTrace(
        input,
        EMPTY_VALIDATION,
        [selectedModule],
        [eligibility],
        [scored],
        [exerciseSelection],
        { outcome: "blocked", reasonCode: "NO_PRIMARY_MODULE_SELECTED", reason: "n/a", blockedModules: [] },
        [],
      ),
    ).toThrowError('Decision trace cannot summarize module "strength": multiple exercises are selected.');
  });
});
