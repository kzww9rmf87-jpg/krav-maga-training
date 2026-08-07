import { describe, expect, test } from "vitest";

import { runEngine } from "../index";
import { isDriverRoleFor } from "../adaptationDrivers";
import { EXERCISE_KNOWLEDGE_BASE } from "../exerciseKnowledgeBase";
import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  isPilotExerciseId,
  PILOT_EXERCISE_IDS,
} from "../prescription/exercisePrescriptionRegistry";
import { DURATION_ESTIMATION_PROFILES } from "../prescription/durationEstimationProfiles";
import { makeAthleteProfile, makeEnvironment, makeReadiness, makeRequest, makeValidInput } from "./fixtures";
import type { AdaptationDomain, EquipmentType, ReadinessState } from "../types";

/**
 * The hypertrophy family — Lot H2.2B.
 *
 * H2.2 measured `functional_hypertrophy` as empty at every equipment level.
 * H2.2A wrote seven source chapters. This file is the runtime record: the
 * chapters are integrated, they behave as the chapters describe, and nothing
 * they added weakened what H2 and H2.1 established.
 */

/** The seven exercises H2.2A marked READY, and no others. */
const FAMILY = [
  "push_up",
  "split_squat",
  "single_leg_hip_thrust",
  "goblet_squat",
  "dumbbell_bench_press",
  "one_arm_dumbbell_row",
  "dumbbell_romanian_deadlift",
] as const;

/** Candidates H2.2A considered and deliberately did NOT mark ready. */
const REJECTED_BY_H22A = [
  "decline_push_up",
  "diamond_push_up",
  "pike_push_up",
  "nordic_curl_progression",
  "inverted_row",
] as const;

function generate(options: {
  equipment: readonly EquipmentType[];
  durationMinutes: number;
  adaptation: AdaptationDomain;
  readiness?: ReadinessState;
  withOneRepMax?: boolean;
}) {
  return runEngine(
    makeValidInput({
      athleteProfile: makeAthleteProfile({
        performanceReferences: options.withOneRepMax
          ? [
              {
                referenceType: "one_rep_max",
                value: 100,
                unit: "kg",
                sourceId: "1rm",
                measuredAt: null,
                validUntil: null,
                confidence: "validated",
              },
            ]
          : [],
      }),
      readiness: options.readiness ?? makeReadiness(),
      environment: makeEnvironment({
        availableEquipment: options.equipment.map((type) => ({ type })),
      }),
      request: makeRequest({
        durationMinutes: options.durationMinutes,
        primaryObjective: { adaptationDomain: options.adaptation },
      }),
    }),
  );
}

function draft(options: Parameters<typeof generate>[0]) {
  const result = generate(options);
  if (result.outcome !== "draft") {
    throw new Error(`Expected a draft, received "${result.outcome}".`);
  }
  return result;
}

function prescribedIds(result: ReturnType<typeof draft>): string[] {
  if (result.prescription?.status !== "prescribed") {
    throw new Error(`Expected a prescribed session, got "${result.prescription?.status}".`);
  }
  return result.prescription.session.exercises.map((exercise) => exercise.prescription.exerciseId);
}

describe("hypertrophy family — source-to-runtime mapping", () => {
  // 1. + 3. + 41.
  test("1. every H2.2A READY chapter is represented exactly once at runtime", () => {
    for (const exerciseId of FAMILY) {
      const catalogued = EXERCISE_KNOWLEDGE_BASE.filter((exercise) => exercise.id === exerciseId);
      expect(catalogued).toHaveLength(1);
      expect(isPilotExerciseId(exerciseId)).toBe(true);
    }
    expect(new Set(PILOT_EXERCISE_IDS).size).toBe(PILOT_EXERCISE_IDS.length);
  });

  // 2. + 41. The rejected candidates stay rejected.
  test("2. no candidate H2.2A declined is exposed as a canonical exercise", () => {
    const catalogued = new Set(EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id));
    for (const exerciseId of REJECTED_BY_H22A) {
      expect(catalogued.has(exerciseId)).toBe(false);
      expect(isPilotExerciseId(exerciseId)).toBe(false);
    }
  });

  // 4. The family does not duplicate an existing movement entity.
  test("4. the family adds no duplicate of an existing canonical exercise", () => {
    // `split_squat` is the grounded stance; `bulgarian_split_squat` elevates the
    // rear foot and is named as its progression. `goblet_squat`,
    // `dumbbell_bench_press` and `dumbbell_romanian_deadlift` differ from their
    // barbell namesakes in equipment AND adaptation — and an `ExerciseDefinition`
    // carries one module and one adaptation, so they cannot be the same entity.
    for (const [hypertrophyId, strengthId] of [
      ["split_squat", "bulgarian_split_squat"],
      ["goblet_squat", "back_squat"],
      ["dumbbell_bench_press", "bench_press"],
      ["dumbbell_romanian_deadlift", "romanian_deadlift"],
      ["one_arm_dumbbell_row", "chest_supported_row"],
    ] as const) {
      const hypertrophy = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === hypertrophyId);
      const strength = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === strengthId);
      expect(hypertrophy?.primaryAdaptation).toBe("functional_hypertrophy");
      expect(strength?.primaryAdaptation).toBe("maximum_strength");
    }
  });

  // 40. Every source rule resolves to a chapter that exists.
  test("40. every sourceRuleId names a real H2.2A chapter", () => {
    for (const exerciseId of FAMILY) {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[exerciseId];
      const chapters = entry.sourceRuleIds.filter((id) => id.startsWith("50-exercises/"));
      expect(chapters.length).toBeGreaterThan(0);
      for (const chapter of chapters) {
        expect(chapter.startsWith("50-exercises/68_HYPERTROPHY/")).toBe(true);
      }
    }
  });
});

describe("hypertrophy family — classification", () => {
  // 5. The module is no longer empty.
  test("5. functional_hypertrophy has drivers", () => {
    const drivers = FAMILY.filter((exerciseId) =>
      isDriverRoleFor("functional_hypertrophy", EXERCISE_PRESCRIPTION_REGISTRY[exerciseId].role),
    );
    expect(drivers).toHaveLength(FAMILY.length);
  });

  // 9. + 11. + 12. + 13. + 14. + 15. + 16. Each exercise's classification.
  test.each(FAMILY)("%s is a functional_hypertrophy primary driver", (exerciseId) => {
    const catalogued = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === exerciseId);
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[exerciseId];

    expect(catalogued?.module).toBe("functional_hypertrophy");
    expect(catalogued?.primaryAdaptation).toBe("functional_hypertrophy");
    expect(entry.moduleId).toBe("functional_hypertrophy");
    expect(entry.role).toBe("primary");
    expect(isDriverRoleFor("functional_hypertrophy", entry.role)).toBe(true);
  });

  // 10. + 30. The family must not become a maximum-strength answer.
  test("10. + 30. no hypertrophy exercise drives maximum strength", () => {
    for (const exerciseId of FAMILY) {
      const catalogued = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === exerciseId);
      // Coverage is decided by the exercise's OWN adaptation, so a hypertrophy
      // exercise can never establish maximum-strength coverage however it is
      // roled.
      expect(catalogued?.primaryAdaptation).not.toBe("maximum_strength");
    }
  });
});

describe("hypertrophy family — prescription", () => {
  // 20. + 21. + 22. RPE/RIR, and no athlete reference anywhere.
  test.each(FAMILY)("%s prescribes from RPE/RIR and requires no athlete reference", (exerciseId) => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[exerciseId];
    expect([...entry.supportedIntensityTypes].sort()).toEqual(["rir", "rpe"]);
    expect(entry.supportedIntensityTypes).not.toContain("percentage_1rm");
    expect(entry.capabilities.requiredAthleteReferenceTypes).toEqual([]);
  });

  // 21. + 22. End to end: an athlete who has never tested a maximum.
  test("21. + 22. a session is prescribed for an athlete with no recorded reference", () => {
    const result = draft({ equipment: ["bodyweight"], durationMinutes: 30, adaptation: "functional_hypertrophy" });
    const serialized = JSON.stringify(result.prescription);
    expect(serialized).not.toContain("one_rep_max");
    expect(serialized).not.toContain("percentage_1rm");
    expect(prescribedIds(result).length).toBeGreaterThan(0);
  });

  // 23. Dose constraints only narrow, and only where a chapter documents one.
  test("23. the three 8-12 chapters narrow the dose; the rest match the profile", () => {
    for (const exerciseId of ["single_leg_hip_thrust", "one_arm_dumbbell_row", "dumbbell_romanian_deadlift"] as const) {
      const constraints = EXERCISE_PRESCRIPTION_REGISTRY[exerciseId].exerciseDoseConstraints;
      expect(constraints?.minimumDose?.repetitions).toBe(8);
      // Only the minimum is narrowed: an exercise never widens the profile.
      expect(constraints?.maximumDose).toBeNull();
    }
    for (const exerciseId of ["push_up", "split_squat", "goblet_squat", "dumbbell_bench_press"] as const) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[exerciseId].exerciseDoseConstraints).toBeNull();
    }
  });

  // 24. + 25. Duration, including per-side handling.
  test("24. + 25. every exercise is covered by the duration model, unilateral ones per side", () => {
    for (const exerciseId of FAMILY) {
      const profile = DURATION_ESTIMATION_PROFILES[`duration_profile_${exerciseId}`];
      expect(profile?.status).toBe("resolved");
      expect(profile?.volumeStructure).toBe("sets_reps");
    }
    for (const exerciseId of ["split_squat", "single_leg_hip_thrust", "one_arm_dumbbell_row"] as const) {
      const capabilities = EXERCISE_PRESCRIPTION_REGISTRY[exerciseId].capabilities;
      expect(capabilities.laterality).toBe("unilateral");
      expect(capabilities.volumeInterpretations).toEqual(["repetitions_per_side"]);
    }
  });
});

describe("hypertrophy family — equipment", () => {
  // 6. + 17. Bodyweight needs nothing.
  test("6. + 17. the three bodyweight exercises are eligible with no equipment", () => {
    const ids = prescribedIds(
      draft({ equipment: ["bodyweight"], durationMinutes: 30, adaptation: "functional_hypertrophy" }),
    );
    expect(ids.length).toBeGreaterThan(0);
    for (const exerciseId of ids) {
      expect(["push_up", "split_squat", "single_leg_hip_thrust"]).toContain(exerciseId);
    }
  });

  // 7. + 17. Dumbbells.
  test("7. dumbbell exercises become available with dumbbells", () => {
    const ids = prescribedIds(
      draft({ equipment: ["bodyweight", "dumbbell"], durationMinutes: 45, adaptation: "functional_hypertrophy" }),
    );
    expect(ids).toContain("one_arm_dumbbell_row");
  });

  // 18. Equipment exclusion — the bench press needs a bench.
  test("18. dumbbell_bench_press is excluded without a bench and included with one", () => {
    const withoutBench = draft({
      equipment: ["bodyweight", "dumbbell"],
      durationMinutes: 45,
      adaptation: "functional_hypertrophy",
    });
    expect(prescribedIds(withoutBench)).not.toContain("dumbbell_bench_press");

    const eligibleWithBench = draft({
      equipment: ["bodyweight", "dumbbell", "bench"],
      durationMinutes: 45,
      adaptation: "functional_hypertrophy",
    }).eligibilityResults.filter((entry) => entry.eligible).map((entry) => entry.exerciseId);
    expect(eligibleWithBench).toContain("dumbbell_bench_press");
  });

  // 8. Full gym keeps the family available.
  test("8. a full gym can still train hypertrophy", () => {
    const result = draft({
      equipment: ["bodyweight", "barbell", "bench", "rack", "plates", "dumbbell", "kettlebell", "pull_up_bar"],
      durationMinutes: 45,
      adaptation: "functional_hypertrophy",
      withOneRepMax: true,
    });
    expect(result.sessionAdequacy.primaryAdaptationCovered).toBe(true);
  });

  // 19. Contraindication exclusion.
  test("19. a contraindicated movement pattern removes the exercise", () => {
    const result = runEngine(
      makeValidInput({
        athleteProfile: makeAthleteProfile({ performanceReferences: [] }),
        medicalState: {
          trainingClearanceStatus: "cleared",
          painReports: [],
          restrictions: [
            {
              id: "r1",
              type: "injury",
              region: "knee",
              description: "Acute knee injury.",
              prohibitedPatterns: ["squat"],
              isHardConstraint: true,
            },
          ],
        },
        environment: makeEnvironment({ availableEquipment: [{ type: "bodyweight" }] }),
        request: makeRequest({
          durationMinutes: 30,
          primaryObjective: { adaptationDomain: "functional_hypertrophy" },
        }),
      }),
    );
    if (result.outcome === "draft" && result.prescription?.status === "prescribed") {
      // The knee-contraindicated squat pattern must not survive.
      expect(prescribedIds(result)).not.toContain("split_squat");
    }
  });
});

describe("hypertrophy family — session generation", () => {
  // 31. + 32. + 33. + 34. + 35.
  const scenarios = [
    ["31. bodyweight / 20 min", ["bodyweight"], 20],
    ["32. bodyweight / 30 min", ["bodyweight"], 30],
    ["33. dumbbells / 30 min", ["bodyweight", "dumbbell"], 30],
    ["34. dumbbells + bench / 45 min", ["bodyweight", "dumbbell", "bench"], 45],
    ["35. full gym / 45 min", ["bodyweight", "barbell", "bench", "rack", "plates", "dumbbell", "pull_up_bar"], 45],
  ] as const;

  test.each(scenarios)("%s produces a coherent session", (_label, equipment, durationMinutes) => {
    const result = draft({
      equipment: [...equipment],
      durationMinutes,
      adaptation: "functional_hypertrophy",
      withOneRepMax: true,
    });

    // 38. Adequacy is satisfied by real drivers, never by accessories.
    expect(result.sessionAdequacy.primaryAdaptationCovered).toBe(true);
    expect(result.sessionAdequacy.drivingExerciseIds.length).toBeGreaterThan(0);

    // The estimate must fit the request — nothing is added to fill time.
    const estimated = result.sessionAdequacy.estimatedDurationMinutes;
    expect(estimated).not.toBeNull();
    expect(estimated!).toBeLessThanOrEqual(durationMinutes);

    // Every prescribed exercise belongs to the hypertrophy family: no filler.
    for (const exerciseId of prescribedIds(result)) {
      expect(FAMILY).toContain(exerciseId as (typeof FAMILY)[number]);
    }
  });

  // 39. Determinism.
  test("39. repeated generation is byte-identical", () => {
    const options = {
      equipment: ["bodyweight", "dumbbell"] as EquipmentType[],
      durationMinutes: 30,
      adaptation: "functional_hypertrophy" as AdaptationDomain,
    };
    expect(JSON.stringify(draft(options))).toBe(JSON.stringify(draft(options)));
  });

  // A readiness-reduced athlete still gets a coherent session.
  test("a readiness-reduced athlete still gets a driven session", () => {
    const result = draft({
      equipment: ["bodyweight"],
      durationMinutes: 30,
      adaptation: "functional_hypertrophy",
      readiness: makeReadiness({ energy: 1, sleepQuality: 1, perceivedRecovery: 1, soreness: 5, stress: 5 }),
    });
    expect(result.sessionAdequacy.primaryAdaptationCovered).toBe(true);
  });
});

describe("hypertrophy family — H2 and H2.1 regressions", () => {
  // 36. The Lot H2 regression is untouched: hypertrophy is not a strength answer.
  test("36. bodyweight maximum strength is still inadequate", () => {
    const result = draft({ equipment: ["bodyweight"], durationMinutes: 30, adaptation: "maximum_strength" });
    expect(result.sessionAdequacy.status).toBe("inadequate");
    expect(result.sessionAdequacy.primaryAdaptationCovered).toBe(false);
    // And no hypertrophy exercise was drafted in to rescue it.
    expect(result.sessionAdequacy.drivingExerciseIds).toEqual([]);
  });

  // 37. H2.1's feasibility-aware driver-first selection still holds.
  test("37. full-gym maximum strength without a 1RM still secures a prescribable driver", () => {
    const result = draft({
      equipment: ["bodyweight", "barbell", "bench", "rack", "plates"],
      durationMinutes: 30,
      adaptation: "maximum_strength",
    });
    expect(result.sessionAdequacy.primaryAdaptationCovered).toBe(true);
    // The driver is a strength exercise, never one of this lot's additions.
    for (const exerciseId of result.sessionAdequacy.drivingExerciseIds) {
      expect(FAMILY).not.toContain(exerciseId as (typeof FAMILY)[number]);
    }
  });

  test("full-gym maximum strength with a 1RM is unchanged", () => {
    const result = draft({
      equipment: ["bodyweight", "barbell", "bench", "rack", "plates", "dumbbell", "pull_up_bar"],
      durationMinutes: 45,
      adaptation: "maximum_strength",
      withOneRepMax: true,
    });
    expect(result.sessionAdequacy.primaryAdaptationCovered).toBe(true);
    expect(result.sessionAdequacy.status).not.toBe("inadequate");
  });
});
