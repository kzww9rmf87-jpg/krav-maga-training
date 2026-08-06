import { describe, expect, test } from "vitest";

import { runEngine } from "../index";
import {
  evaluateSessionAdequacy,
  isDrivingRole,
  NON_DRIVING_EXERCISE_ROLES,
  SESSION_ADEQUACY_THRESHOLDS,
  type SessionAdequacyInput,
} from "../sessionAdequacy";
import { EXERCISE_PRESCRIPTION_REGISTRY, isPilotExerciseId } from "../prescription/exercisePrescriptionRegistry";
import { makeAthleteProfile, makeEnvironment, makeRequest, makeValidInput } from "./fixtures";
import type { AdaptationDomain, EquipmentType } from "../types";

/**
 * Session adequacy — the manual-test regression.
 *
 * THE SCENARIO THAT OPENED LOT H2. A real request through VITA — maximum
 * strength, 30 minutes, bodyweight only, no recorded 1RM — came back as a
 * contract-valid draft holding one exercise: Neck Training, 8 minutes, no
 * conflict, no warning. Every stage had done its job correctly, and nothing
 * was in a position to notice that a neck isometric is not a maximum-strength
 * session.
 *
 * These tests pin the four questions the pipeline now separates: eligibility,
 * prescription feasibility, adaptation coverage and composition adequacy.
 */

function scenario(equipment: readonly EquipmentType[], durationMinutes: number) {
  return makeValidInput({
    // No performance reference: the missing-1RM condition of the manual test.
    athleteProfile: makeAthleteProfile({ performanceReferences: [] }),
    environment: makeEnvironment({
      availableEquipment: equipment.map((type) => ({ type })),
    }),
    request: makeRequest({ durationMinutes }),
  });
}

function draftOf(equipment: readonly EquipmentType[], durationMinutes: number) {
  const result = runEngine(scenario(equipment, durationMinutes));
  if (result.outcome !== "draft") {
    throw new Error(`Expected a draft, received "${result.outcome}".`);
  }
  return result;
}

/** A minimal evaluation input, for the rules that are easier to pin directly. */
function evaluationInput(overrides: Partial<SessionAdequacyInput> = {}): SessionAdequacyInput {
  return {
    requestedDurationMinutes: 45,
    estimatedDurationMinutes: 40,
    primaryModule: "strength",
    prescriptionAvailable: true,
    prescribedExercises: [{ exerciseId: "bench_press", moduleId: "strength", role: "primary" }],
    unprescribedPrimaryExerciseIds: [],
    repairAttempted: false,
    repairAddedExerciseIds: [],
    ...overrides,
  };
}

describe("session adequacy — the reproduced manual-test failure", () => {
  // 1. Exact reproduction of the 30-minute / 8-minute / accessory-only case.
  test("1. maximum strength, 30 minutes, bodyweight only: reported instead of passed off as a session", () => {
    const result = draftOf(["bodyweight"], 30);

    // The pipeline still produces what it produced before — this lot changed
    // what CAS SAYS about it, not what it selects.
    expect(result.prescription?.status).toBe("prescribed");
    expect(result.sessionDraft.estimatedDurationMinutes).toBe(8);

    const adequacy = result.sessionAdequacy;
    expect(adequacy.status).toBe("inadequate");
    expect(adequacy.primaryAdaptationCovered).toBe(false);
    expect(adequacy.drivingExerciseIds).toEqual([]);
    expect(adequacy.findings.map((finding) => finding.reasonCode)).toEqual([
      "PRIMARY_ADAPTATION_NOT_DRIVEN",
      "DURATION_GROSSLY_UNDERFILLED",
      "BELOW_MINIMUM_PRODUCTIVE_DURATION",
    ]);
  });

  // 2. The accessory-only session fails primary adaptation coverage.
  test("2. the surviving exercise is Neck Training, and its role is why coverage fails", () => {
    const result = draftOf(["bodyweight"], 30);
    if (result.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed session.");
    }

    const prescribed = result.prescription.session.exercises.map((exercise) => exercise.prescription);
    expect(prescribed.map((prescription) => prescription.exerciseId)).toEqual(["neck_training"]);
    // The engine already knew this before Lot H2 — it simply never asked.
    expect(prescribed[0].role).toBe("accessory");
    expect(isDrivingRole("accessory")).toBe(false);
  });

  // 14. + 15. An inadequate draft is never reported as complete, and its
  // reasons are structured rather than prose a consumer has to parse.
  test("14. + 15. the inadequate session raises a major conflict, warnings and structured reasons", () => {
    const result = draftOf(["bodyweight"], 30);

    const coverage = result.conflicts.find(
      (conflict) => conflict.id === "adequacy_primary_adaptation_coverage",
    );
    expect(coverage?.severity).toBe("major");
    expect(coverage?.resolutionRequired).toBe(true);

    // Every finding also reaches `warnings`: a consumer reading only warnings
    // must not be able to read this session as complete.
    for (const finding of result.sessionAdequacy.findings) {
      expect(result.decisionTrace.warnings).toContain(finding.description);
    }
    for (const finding of result.sessionAdequacy.findings) {
      expect(finding.ruleId).toMatch(/^adequacy_/);
      expect(finding.sourceRuleIds.length).toBeGreaterThan(0);
    }
  });

  // 17. Decision Trace carries the adequacy verdict and every rule id.
  test("17. the Decision Trace explains the verdict, the repair attempt and the rule ids", () => {
    const result = draftOf(["bodyweight"], 30);

    const adequacyEntries = result.decisionTrace.entries.filter((entry) => entry.stage === "final_validation");
    expect(adequacyEntries.length).toBeGreaterThan(0);

    const verdict = adequacyEntries.find((entry) => entry.id.endsWith("_session_adequacy"));
    expect(verdict?.decision).toBe("Session adequacy: inadequate.");
    expect(verdict?.reasons.join(" ")).toContain("is NOT driven");
    // The repair attempt is stated, including that nothing was added in place
    // of what could not be found.
    expect(verdict?.reasons.join(" ")).toContain("no unrelated work was added");

    for (const finding of result.sessionAdequacy.findings) {
      expect(adequacyEntries.some((entry) => entry.id.endsWith(finding.ruleId))).toBe(true);
    }
  });

  // 18. Determinism.
  test("18. repeated identical requests produce identical domain decisions", () => {
    const first = draftOf(["bodyweight"], 30);
    const second = draftOf(["bodyweight"], 30);
    expect(JSON.stringify(second.sessionAdequacy)).toBe(JSON.stringify(first.sessionAdequacy));
  });
});

describe("session adequacy — duration rules", () => {
  // 6. Gross underfill is detected.
  test("6. 8 of 30 minutes breaches both the ratio and the absolute tolerance", () => {
    const adequacy = evaluateSessionAdequacy(
      evaluationInput({ requestedDurationMinutes: 30, estimatedDurationMinutes: 8 }),
    );
    expect(adequacy.durationCoverageRatio).toBe(0.27);
    expect(adequacy.findings.map((finding) => finding.reasonCode)).toContain("DURATION_GROSSLY_UNDERFILLED");
    // Coverage holds, so the session is usable — never rejected for shortness.
    expect(adequacy.status).toBe("partial");
  });

  // 7. Small variance is accepted.
  test("7. 40 of 45 minutes is a normal, complete session", () => {
    const adequacy = evaluateSessionAdequacy(evaluationInput());
    expect(adequacy.status).toBe("adequate");
    expect(adequacy.findings).toEqual([]);
  });

  test("a ratio breach alone is not enough — the absolute tolerance must fail too", () => {
    // 12 of 25: ratio 0.48 is below the threshold, but only 13 minutes are
    // unused, which is inside the absolute tolerance.
    const adequacy = evaluateSessionAdequacy(
      evaluationInput({ requestedDurationMinutes: 25, estimatedDurationMinutes: 12 }),
    );
    expect(adequacy.durationCoverageRatio).toBeLessThan(
      SESSION_ADEQUACY_THRESHOLDS.minimumDurationCoverageRatio,
    );
    expect(adequacy.status).toBe("adequate");
  });

  // 5. A short request passes with one exercise.
  test("5. a short request is exempt from the ratio rule", () => {
    const adequacy = evaluateSessionAdequacy(
      evaluationInput({
        requestedDurationMinutes: SESSION_ADEQUACY_THRESHOLDS.shortRequestExemptionMinutes,
        estimatedDurationMinutes: 8,
      }),
    );
    expect(adequacy.status).toBe("adequate");
    expect(adequacy.findings).toEqual([]);
  });

  // 8. A readiness-reduced session keeps its adaptation and is never rejected.
  test("8. a deliberately reduced session that still drives the adaptation is partial, never inadequate", () => {
    const adequacy = evaluateSessionAdequacy(
      evaluationInput({ requestedDurationMinutes: 60, estimatedDurationMinutes: 20 }),
    );
    expect(adequacy.primaryAdaptationCovered).toBe(true);
    expect(adequacy.status).toBe("partial");
  });

  test("an unestimated session raises no duration finding rather than a guessed one", () => {
    const adequacy = evaluateSessionAdequacy(evaluationInput({ estimatedDurationMinutes: null }));
    expect(adequacy.durationCoverageRatio).toBeNull();
    expect(adequacy.findings).toEqual([]);
  });
});

describe("session adequacy — coverage rules", () => {
  // 4. A valid mono-exercise primary session passes.
  test("4. one exercise is adequate when it is the true adaptation driver", () => {
    const adequacy = evaluateSessionAdequacy(evaluationInput());
    expect(adequacy.prescribedExerciseCount).toBe(1);
    expect(adequacy.status).toBe("adequate");
  });

  // 3. Driver plus legitimate assistance passes.
  test("3. a driver plus accessory work passes: the accessory is not the problem", () => {
    const adequacy = evaluateSessionAdequacy(
      evaluationInput({
        prescribedExercises: [
          { exerciseId: "bench_press", moduleId: "strength", role: "primary" },
          { exerciseId: "neck_training", moduleId: "strength", role: "accessory" },
        ],
      }),
    );
    expect(adequacy.primaryAdaptationCovered).toBe(true);
    expect(adequacy.drivingExerciseIds).toEqual(["bench_press"]);
    expect(adequacy.status).toBe("adequate");
  });

  test("support work in a NON-primary module never affects coverage", () => {
    const adequacy = evaluateSessionAdequacy(
      evaluationInput({
        prescribedExercises: [
          { exerciseId: "bench_press", moduleId: "strength", role: "primary" },
          { exerciseId: "pallof_press", moduleId: "core", role: "robustness" },
        ],
      }),
    );
    expect(adequacy.status).toBe("adequate");
  });

  test("conditioning and technical roles drive their own sessions", () => {
    // The non-driving list is deliberately narrow: a conditioning session is
    // driven by conditioning work, a skill session by technical work.
    expect(isDrivingRole("conditioning")).toBe(true);
    expect(isDrivingRole("technical")).toBe(true);
    expect(isDrivingRole("recovery")).toBe(true);
    expect(NON_DRIVING_EXERCISE_ROLES).toEqual(["accessory", "robustness"]);
  });

  // 16. An impossible objective fails safely and explainably.
  test("16. a session that could not be prescribed at all is inadequate, with its cause named", () => {
    const adequacy = evaluateSessionAdequacy(
      evaluationInput({
        prescriptionAvailable: false,
        prescribedExercises: [],
        unprescribedPrimaryExerciseIds: ["bench_press"],
      }),
    );
    expect(adequacy.status).toBe("inadequate");
    expect(adequacy.findings.map((finding) => finding.reasonCode)).toEqual([
      "PRIMARY_ADAPTATION_NOT_DRIVEN",
      "PRIMARY_CANDIDATES_UNPRESCRIBABLE",
    ]);
  });
});

describe("session adequacy — repair", () => {
  // 11. + 13. Repair never invents work and never invents a reference.
  test("11. when no prescribable driver exists, repair adds nothing at all", () => {
    const result = draftOf(["bodyweight"], 30);
    expect(result.sessionAdequacy.repairAttempted).toBe(true);
    expect(result.sessionAdequacy.repairAddedExerciseIds).toEqual([]);
    // The session is left exactly as composed: one exercise, unchanged.
    expect(result.sessionAdequacy.prescribedExerciseCount).toBe(1);
  });

  // 12. + 13. A missing 1RM stays a safe prescription failure.
  test("12. + 13. a missing 1RM remains a prescription failure — no load is fabricated", () => {
    // Full barbell gym, no recorded 1RM: bench press is selected and cannot be
    // dosed. CAS declines rather than guessing a load.
    const result = draftOf(["barbell", "bench", "rack", "plates"], 30);
    if (result.prescription?.status !== "unavailable") {
      throw new Error(`Expected an unavailable prescription, got "${result.prescription?.status}".`);
    }
    expect(result.prescription.missingSourceData.map((gap) => gap.exerciseId)).toContain("bench_press");
    expect(result.sessionAdequacy.status).toBe("inadequate");
    expect(result.sessionAdequacy.repairAddedExerciseIds).toEqual([]);
  });

  test("repair only ever considers driving roles from the primary module's own ranked bench", () => {
    // Every registry role this lot treats as non-driving is genuinely support
    // work — asserted against the registry itself so a reclassification there
    // cannot silently change what counts as a session.
    for (const exerciseId of ["neck_training", "chin_up", "chest_supported_row"]) {
      if (!isPilotExerciseId(exerciseId)) {
        throw new Error(`${exerciseId} is expected to be in the pilot registry.`);
      }
      expect(isDrivingRole(EXERCISE_PRESCRIPTION_REGISTRY[exerciseId].role)).toBe(false);
    }
    for (const exerciseId of ["bench_press", "back_squat", "trap_bar_deadlift"]) {
      if (!isPilotExerciseId(exerciseId)) {
        throw new Error(`${exerciseId} is expected to be in the pilot registry.`);
      }
      expect(isDrivingRole(EXERCISE_PRESCRIPTION_REGISTRY[exerciseId].role)).toBe(true);
    }
  });

  test("no repair is attempted when the session already drives its adaptation", () => {
    const adequacy = evaluateSessionAdequacy(evaluationInput());
    expect(adequacy.repairAttempted).toBe(false);
  });

  // 9. + 10. The guards that decide WHEN repair may act.
  //
  // Both are reachable with the real catalog, and both currently STOP repair —
  // which is why no scenario in this suite shows an exercise being added:
  //
  // - a full gym ranks three accessories into the strength module, so the
  //   module sits at `EXERCISES_PER_MODULE_ROLE.primary` and repair declines to
  //   reshape it (a ranking outcome is not this stage's to correct);
  // - a pull-up bar makes `pull_up` (a driving role) available, but it is
  //   redundant with the `chin_up` the session already holds, so Rule 32 stops
  //   it.
  //
  // The addition path is implemented and guarded; it is simply unreachable with
  // the V0.1 catalog. That is a finding about the catalog and the scoring model,
  // not a reason to loosen a guard.
  test("9. a full primary module is reported rather than reshaped", () => {
    // A recorded 1RM, so the session prescribes and repair can actually run.
    const result = runEngine(
      makeValidInput({
        athleteProfile: makeAthleteProfile({
          experience: { generalTrainingLevel: "intermediate", primaryCombatSport: "krav_maga" },
          performanceReferences: [
            {
              referenceType: "one_rep_max",
              value: 100,
              unit: "kg",
              sourceId: "1rm",
              measuredAt: null,
              validUntil: null,
              confidence: "validated",
            },
          ],
        }),
        environment: {
          locationType: "gym",
          availableEquipment: (
            ["barbell", "bench", "rack", "plates", "dumbbell", "kettlebell", "pull_up_bar"] as EquipmentType[]
          ).map((type) => ({ type })),
          availableSpace: "large",
          floorSafe: true,
        },
        request: makeRequest({ durationMinutes: 45 }),
      }),
    );
    if (result.outcome !== "draft") {
      throw new Error(`Expected a draft, received "${result.outcome}".`);
    }
    expect(result.sessionAdequacy.repairAttempted).toBe(true);
    expect(result.sessionAdequacy.repairAddedExerciseIds).toEqual([]);
    // Nothing was given up either: the composition is left exactly as composed.
    expect(result.sessionAdequacy.prescribedExerciseCount).toBeGreaterThanOrEqual(3);
  });

  test("10. a driving candidate redundant with kept work is not promoted", () => {
    // `pull_up` drives; `chin_up` is already held and is the same movement.
    const result = draftOf(["bodyweight", "pull_up_bar"], 45);
    if (result.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed session.");
    }
    const prescribedIds = result.prescription.session.exercises.map(
      (exercise) => exercise.prescription.exerciseId,
    );
    expect(prescribedIds).toContain("chin_up");
    expect(prescribedIds).not.toContain("pull_up");
    expect(result.sessionAdequacy.repairAddedExerciseIds).toEqual([]);
    expect(result.sessionAdequacy.status).toBe("inadequate");
  });
});

describe("session adequacy — regression protection across objectives", () => {
  // 19. + 20. Representative existing scenarios keep their verdict.
  const objectives: readonly (readonly [AdaptationDomain, readonly EquipmentType[]])[] = [
    ["maximum_strength", ["barbell", "bench", "rack", "plates", "dumbbell", "pull_up_bar"]],
    ["functional_hypertrophy", ["barbell", "bench", "rack", "plates", "dumbbell"]],
    ["power", ["barbell", "plates", "bodyweight"]],
    ["conditioning", ["cardio_machine", "rowing_ergometer", "bodyweight"]],
    ["robustness", ["bodyweight"]],
    ["movement", ["bodyweight"]],
    ["recovery", ["bodyweight"]],
    ["specific_skill", ["bodyweight"]],
  ];

  test("19. no representative objective is rejected by the adequacy model on shortness alone", () => {
    for (const [adaptationDomain, equipment] of objectives) {
      const input = makeValidInput({
        athleteProfile: makeAthleteProfile({ performanceReferences: [] }),
        environment: makeEnvironment({
          availableEquipment: equipment.map((type) => ({ type })),
        }),
        request: makeRequest({
          durationMinutes: 45,
          primaryObjective: { adaptationDomain },
        }),
      });

      const result = runEngine(input);
      if (result.outcome !== "draft") {
        // `blocked` and `invalid_input` are pre-existing safe outcomes and are
        // not this model's business.
        continue;
      }

      // A session is never `inadequate` for being short: every inadequate
      // verdict must name a coverage failure.
      if (result.sessionAdequacy.status === "inadequate") {
        expect(result.sessionAdequacy.primaryAdaptationCovered).toBe(false);
      }
      // And a covered session is never worse than `partial`.
      if (result.sessionAdequacy.primaryAdaptationCovered) {
        expect(result.sessionAdequacy.status).not.toBe("inadequate");
      }
    }
  });

  test("20. the adequacy field is present on every draft, so no consumer has to derive it", () => {
    const result = draftOf(["bodyweight"], 30);
    expect(result.sessionAdequacy).toBeDefined();
    expect(["adequate", "partial", "inadequate"]).toContain(result.sessionAdequacy.status);
  });
});
