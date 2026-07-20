/**
 * Combat Athlete System — Public Session Output: Exercise References Tests
 */

import { describe, expect, test } from "vitest";

import { buildExerciseReferences, collectReferencedExerciseIds } from "../../sessionOutput/exerciseReferences";
import type {
  CasConflictResolutionV1,
  CasConflictV1,
  CasDecisionTraceV1,
  CasPrescriptionOutcomeV1,
  CasSessionDraftV1,
} from "../../sessionOutput/types";

import { makeExercise } from "../fixtures";

const EMPTY_TRACE: CasDecisionTraceV1 = {
  traceId: "trace-1",
  entries: [],
  rejectedExercises: [],
  detectedConflicts: [],
  conflictResolutions: [],
  warnings: [],
};

describe("collectReferencedExerciseIds", () => {
  test("returns an empty array when nothing references any exercise", () => {
    expect(collectReferencedExerciseIds({ decisionTrace: EMPTY_TRACE })).toEqual([]);
  });

  test("collects ids from rejectedExercises and trace entries, deduplicated and sorted", () => {
    const trace: CasDecisionTraceV1 = {
      ...EMPTY_TRACE,
      rejectedExercises: [{ exerciseId: "z-exercise", reasons: [] }],
      entries: [
        {
          id: "entry-1",
          timestamp: "2026-01-15T08:00:00.000Z",
          stage: "eligibility_filtering",
          decision: "d",
          reasons: [],
          affectedExerciseIds: ["a-exercise", "z-exercise"],
        },
      ],
    };

    expect(collectReferencedExerciseIds({ decisionTrace: trace })).toEqual(["a-exercise", "z-exercise"]);
  });

  test("collects ids from public conflicts and conflict resolutions", () => {
    const conflicts: CasConflictV1[] = [
      {
        conflictId: "conflict-1",
        type: "recovery",
        severity: "minor",
        probability: "low",
        description: "d",
        affectedExerciseIds: ["exercise-a"],
        resolutionRequired: false,
      },
    ];
    const conflictResolutions: CasConflictResolutionV1[] = [
      {
        conflictId: "conflict-1",
        action: "substitute_exercise",
        description: "d",
        removedExerciseIds: ["exercise-a"],
        addedExerciseIds: ["exercise-b"],
      },
    ];

    expect(collectReferencedExerciseIds({ decisionTrace: EMPTY_TRACE, conflicts, conflictResolutions })).toEqual([
      "exercise-a",
      "exercise-b",
    ]);
  });

  test("collects ids from the selected exercises of a session draft only", () => {
    const sessionDraft: CasSessionDraftV1 = {
      sessionId: "session-1",
      title: "t",
      primaryObjective: { adaptationDomain: "maximum_strength" },
      secondaryObjectives: [],
      confidence: "high",
      modules: [
        {
          order: 1,
          selectedModule: { module: "strength", role: "primary", primaryAdaptation: "maximum_strength", reason: "r" },
          exercises: [{ exerciseId: "selected-exercise", selectionReasons: ["r"] }],
        },
      ],
    };

    expect(collectReferencedExerciseIds({ decisionTrace: EMPTY_TRACE, sessionDraft })).toEqual(["selected-exercise"]);
  });

  test("collects ids from every prescription outcome status", () => {
    const prescribed: CasPrescriptionOutcomeV1 = {
      status: "prescribed",
      session: {
        sessionId: "session-1",
        sessionName: "n",
        modules: ["strength"],
        exercises: [
          {
            order: 1,
            blockId: "strength",
            required: true,
            prescription: {
              exerciseId: "prescribed-exercise",
              moduleId: "strength",
              role: "primary",
              methodId: "straight_sets_repetitions",
              volume: {
                structure: "sets_reps",
                sets: 3,
                repetitions: { type: "fixed", value: 5, min: null, max: null, unit: "repetitions" },
                duration: null,
                distance: null,
                rounds: null,
                workIntervals: null,
                laterality: null,
              },
              intensity: {
                primaryMetric: { type: "rpe", target: { type: "fixed", value: 7 }, unit: "rpe_scale_1_10", scope: "per_exercise", reference: null },
                secondaryMetrics: [],
                calculation: null,
                adjustments: [],
                sourceRuleIds: [],
                status: "complete",
              },
              rest: null,
              tempo: null,
              instructions: [],
              stopConditions: [],
              sourceRuleIds: [],
              status: "complete",
            },
          },
        ],
        sourceRuleIds: [],
        status: "complete",
      },
    };
    expect(collectReferencedExerciseIds({ decisionTrace: EMPTY_TRACE, prescription: prescribed })).toEqual([
      "prescribed-exercise",
    ]);

    const unavailable: CasPrescriptionOutcomeV1 = {
      status: "unavailable",
      missingSourceData: [{ exerciseId: "gap-exercise", moduleId: "strength", required: true, reason: "r" }],
    };
    expect(collectReferencedExerciseIds({ decisionTrace: EMPTY_TRACE, prescription: unavailable })).toEqual([
      "gap-exercise",
    ]);

    const failed: CasPrescriptionOutcomeV1 = {
      status: "failed",
      failure: {
        sessionId: "session-1",
        issues: [{ code: "SESSION_REQUIRED_EXERCISE_FAILED", message: "m", exerciseId: "issue-exercise", recoverable: false }],
        failedExerciseIds: ["failed-exercise"],
        omittedOptionalExerciseIds: [],
        sourceRuleIds: [],
      },
    };
    expect(collectReferencedExerciseIds({ decisionTrace: EMPTY_TRACE, prescription: failed })).toEqual([
      "failed-exercise",
      "issue-exercise",
    ]);
  });
});

describe("buildExerciseReferences", () => {
  test("resolves a displayName for every referenced id, and only those", () => {
    const referenced = makeExercise({ id: "referenced-exercise", name: "Referenced Exercise" });
    const notReferenced = makeExercise({ id: "not-referenced-exercise", name: "Not Referenced" });

    const references = buildExerciseReferences(["referenced-exercise"], [referenced, notReferenced]);

    expect(references).toEqual({ "referenced-exercise": { displayName: "Referenced Exercise" } });
    expect(Object.keys(references)).not.toContain("not-referenced-exercise");
  });

  test("throws when a referenced id is absent from the exercise pool", () => {
    expect(() => buildExerciseReferences(["missing-exercise"], [])).toThrowError(/missing-exercise/);
  });
});
