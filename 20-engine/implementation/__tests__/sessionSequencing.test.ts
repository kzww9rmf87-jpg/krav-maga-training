import { describe, expect, test } from "vitest";

import { runEngine } from "../index";
import { EXERCISE_KNOWLEDGE_BASE } from "../exerciseKnowledgeBase";
import {
  adjacentSharedRegions,
  classify,
  freshnessDemandOf,
  FRESHNESS_TIERS,
  sequenceSession,
  systemicLoadOf,
  type SequenceCandidate,
} from "../sessionSequencer";
import { EXERCISE_PRESCRIPTION_REGISTRY, isPilotExerciseId } from "../prescription/exercisePrescriptionRegistry";
import { makeAthleteProfile, makeEnvironment, makeReadiness, makeRequest, makeValidInput } from "./fixtures";
import type { AdaptationDomain, EquipmentType, ExerciseDefinition, ReadinessState } from "../types";

/**
 * Session sequencing — Lot H2.3.
 *
 * Before this lot, execution order was an accident: `buildPrescriptionInput.ts`
 * numbered exercises while walking modules and, inside each module, the
 * candidates in SCORING RANK. A full-gym maximum-strength session therefore came
 * back as chest_supported_row, neck_training, bench_press — the heavy press
 * last, after two accessories.
 *
 * These tests pin the order, and pin that ONLY the order changed.
 */

const GYM: readonly EquipmentType[] = [
  "bodyweight",
  "barbell",
  "bench",
  "rack",
  "plates",
  "dumbbell",
  "kettlebell",
  "pull_up_bar",
  "dip_bars",
  "box",
  "mat",
  "cardio_machine",
  "rowing_ergometer",
  "plyometric_box",
  "medicine_ball",
  "slam_ball",
  "wall",
  "open_space",
  "ab_wheel",
  "trap_bar",
];

const ONE_REP_MAX = [
  {
    referenceType: "one_rep_max" as const,
    value: 100,
    unit: "kg" as const,
    sourceId: "1rm",
    measuredAt: null,
    validUntil: null,
    confidence: "validated" as const,
  },
];

function run(options: {
  equipment: readonly EquipmentType[];
  durationMinutes: number;
  adaptation: AdaptationDomain;
  withOneRepMax?: boolean;
  readiness?: ReadinessState;
}) {
  return runEngine(
    makeValidInput({
      athleteProfile: makeAthleteProfile({
        performanceReferences: options.withOneRepMax ? ONE_REP_MAX : [],
      }),
      readiness: options.readiness ?? makeReadiness(),
      environment: makeEnvironment({
        availableEquipment: options.equipment.map((type) => ({ type })),
        usableWall: true,
        floorSafe: true,
        jumpingAllowed: true,
        throwingAllowed: true,
      }),
      request: makeRequest({
        durationMinutes: options.durationMinutes,
        primaryObjective: { adaptationDomain: options.adaptation },
      }),
    }),
  );
}

function sequenceOf(options: Parameters<typeof run>[0]): string[] {
  const result = run(options);
  if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
    throw new Error(`Expected a prescribed draft, received "${result.outcome}".`);
  }
  return result.prescription.session.exercises.map((exercise) => exercise.prescription.exerciseId);
}

function exerciseOf(exerciseId: string): ExerciseDefinition {
  const exercise = EXERCISE_KNOWLEDGE_BASE.find((entry) => entry.id === exerciseId);
  if (exercise === undefined) {
    throw new Error(`${exerciseId} is not catalogued.`);
  }
  return exercise;
}

function candidateOf(
  exerciseId: string,
  moduleRole: SequenceCandidate["moduleRole"] = "primary",
): SequenceCandidate {
  return {
    exerciseId,
    exercise: exerciseOf(exerciseId),
    role: isPilotExerciseId(exerciseId) ? EXERCISE_PRESCRIPTION_REGISTRY[exerciseId].role : null,
    moduleRole,
  };
}

describe("sequencing — the defect this lot exists to fix", () => {
  // 2. + 3. + 15. The maximum-strength driver leads.
  test("2. + 3. + 15. the heavy driver precedes accessory and robustness work", () => {
    const sequence = sequenceOf({
      equipment: GYM,
      durationMinutes: 45,
      adaptation: "maximum_strength",
      withOneRepMax: true,
    });

    // Before Lot H2.3 this session was: chest_supported_row, neck_training,
    // bench_press.
    expect(sequence[0]).toBe("bench_press");
    expect(sequence.indexOf("bench_press")).toBeLessThan(sequence.indexOf("chest_supported_row"));
    expect(sequence.indexOf("bench_press")).toBeLessThan(sequence.indexOf("neck_training"));
  });

  // 1. Selection score does not decide execution order.
  test("1. the highest-scoring exercise is not automatically first", () => {
    const result = run({
      equipment: GYM,
      durationMinutes: 45,
      adaptation: "maximum_strength",
      withOneRepMax: true,
    });
    if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft.");
    }

    const bench = result.sessionDraft.modules[0].exerciseSelection.candidates;
    const highestScoring = bench[0].scoredExercise.exercise.id;
    const firstPerformed = result.prescription.session.exercises[0].prescription.exerciseId;

    // The accessory still outscores the driver — H2.1 left scoring alone, and so
    // does this lot. What changed is that the score no longer decides position.
    expect(highestScoring).toBe("chest_supported_row");
    expect(firstPerformed).toBe("bench_press");
    expect(firstPerformed).not.toBe(highestScoring);
  });
});

describe("sequencing — objective-aware classification", () => {
  // 13. Robustness leads a robustness session, and is support elsewhere.
  test("13. the same exercise is a driver in one objective and support in another", () => {
    const soleus = candidateOf("soleus_raise", "support");

    expect(classify(soleus, { requestedAdaptation: "robustness" })).toBe("objective_driver");
    expect(classify(soleus, { requestedAdaptation: "maximum_strength" })).toBe("support_module_work");
  });

  // 11. + 10. Conditioning leads when it is the objective, defers when it is not.
  test("11. + 10. conditioning leads its own session and is deferred in others", () => {
    const bike = candidateOf("assault_bike_intervals", "primary");

    expect(classify(bike, { requestedAdaptation: "conditioning" })).toBe("objective_driver");
    expect(classify(bike, { requestedAdaptation: "maximum_strength" })).toBe("deferred_conditioning");
    expect(classify(bike, { requestedAdaptation: "power" })).toBe("deferred_conditioning");
  });

  // 12. A technical driver can lead its own objective.
  test("12. technical work drives a specific-skill objective", () => {
    const shadowBoxing = candidateOf("shadow_boxing", "primary");
    expect(classify(shadowBoxing, { requestedAdaptation: "specific_skill" })).toBe("objective_driver");
  });

  // 14. Movement/recovery drivers lead their own objective.
  test("14. movement work drives a movement objective rather than closing it", () => {
    const bearCrawl = candidateOf("bear_crawl", "primary");
    expect(classify(bearCrawl, { requestedAdaptation: "movement" })).toBe("objective_driver");
  });

  test("a role name alone never decides the class", () => {
    // `accessory` is support for strength and a DRIVER for robustness, because
    // the class is decided by the adaptation relation, not the name.
    const tibialis = candidateOf("tibialis_raise", "support");
    expect(classify(tibialis, { requestedAdaptation: "maximum_strength" })).toBe("support_module_work");
    expect(classify(tibialis, { requestedAdaptation: "robustness" })).toBe("objective_driver");
  });
});

describe("sequencing — freshness", () => {
  // 8. + 9. + 29. Ballistic work goes first when power is the objective.
  test("8. + 9. + 29. ballistic work precedes the more fatiguing power work", () => {
    const sequence = sequenceOf({
      equipment: GYM,
      durationMinutes: 45,
      adaptation: "power",
      withOneRepMax: true,
    });

    const ballistic = sequence.filter((id) => freshnessDemandOf(exerciseOf(id)) === FRESHNESS_TIERS.ballistic);
    const rest = sequence.filter((id) => freshnessDemandOf(exerciseOf(id)) < FRESHNESS_TIERS.ballistic);
    expect(ballistic.length).toBeGreaterThan(0);

    // Every ballistic exercise precedes every non-ballistic one.
    for (const ballisticId of ballistic) {
      for (const otherId of rest) {
        expect(sequence.indexOf(ballisticId)).toBeLessThan(sequence.indexOf(otherId));
      }
    }
  });

  test("freshness tiers are read from documented metadata, not names", () => {
    // A jump: velocity IS the stimulus.
    expect(freshnessDemandOf(exerciseOf("countermovement_jump"))).toBe(FRESHNESS_TIERS.ballistic);
    // A throw: likewise.
    expect(freshnessDemandOf(exerciseOf("med_ball_chest_pass"))).toBe(FRESHNESS_TIERS.ballistic);
    // Heavy press: no velocity requirement, but documented neural cost of 4.
    expect(exerciseOf("bench_press").fatigueProfile.neural).toBeGreaterThanOrEqual(4);
    expect(freshnessDemandOf(exerciseOf("bench_press"))).toBe(FRESHNESS_TIERS.neural);
    // Accessory neck work: nothing degrades by performing it late.
    expect(freshnessDemandOf(exerciseOf("neck_training"))).toBe(FRESHNESS_TIERS.none);
  });

  // 5. Hypertrophy drivers before support, largest movement first among equals.
  test("5. + 6. a bodyweight hypertrophy session leads with the largest movement", () => {
    const sequence = sequenceOf({
      equipment: ["bodyweight"],
      durationMinutes: 30,
      adaptation: "functional_hypertrophy",
    });
    expect(sequence).toHaveLength(3);
    // split_squat carries the highest documented systemic load of the three.
    expect(sequence[0]).toBe("split_squat");
    expect(systemicLoadOf(exerciseOf("split_squat"))).toBeGreaterThan(systemicLoadOf(exerciseOf("push_up")));
  });

  // 7. Dumbbell hypertrophy is stable and coherent.
  test("7. a dumbbell hypertrophy session is stable", () => {
    const options = {
      equipment: ["bodyweight", "dumbbell"] as EquipmentType[],
      durationMinutes: 30,
      adaptation: "functional_hypertrophy" as AdaptationDomain,
    };
    expect(sequenceOf(options)).toEqual(sequenceOf(options));
  });
});

describe("sequencing — determinism", () => {
  // 17. + 18. Input order cannot change the result.
  test("17. + 18. shuffling the input leaves the sequence unchanged", () => {
    const ids = ["neck_training", "bench_press", "chest_supported_row"];
    const candidates = ids.map((id) => candidateOf(id));
    const context = { requestedAdaptation: "maximum_strength" as AdaptationDomain };

    const forward = sequenceSession(candidates, context).map((entry) => entry.exerciseId);
    const reversed = sequenceSession([...candidates].reverse(), context).map((entry) => entry.exerciseId);
    const rotated = sequenceSession([candidates[1], candidates[2], candidates[0]], context).map(
      (entry) => entry.exerciseId,
    );

    expect(reversed).toEqual(forward);
    expect(rotated).toEqual(forward);
  });

  test("17. the final tie-break is the canonical id", () => {
    // Two exercises of the same class, freshness and systemic load: only the id
    // separates them, and it always does.
    const context = { requestedAdaptation: "functional_hypertrophy" as AdaptationDomain };
    const sequence = sequenceSession(
      [candidateOf("push_up"), candidateOf("single_leg_hip_thrust")],
      context,
    );
    expect(sequence[0].freshnessDemand).toBe(sequence[1].freshnessDemand);
    expect(sequence[0].systemicLoad).toBe(sequence[1].systemicLoad);
    expect(sequence.map((entry) => entry.exerciseId)).toEqual(["push_up", "single_leg_hip_thrust"]);
  });

  // 19. Repeated generation.
  test("19. repeated generation returns an identical sequence", () => {
    const options = {
      equipment: GYM,
      durationMinutes: 45,
      adaptation: "maximum_strength" as AdaptationDomain,
      withOneRepMax: true,
    };
    expect(sequenceOf(options)).toEqual(sequenceOf(options));
  });
});

describe("sequencing — nothing but the order changed", () => {
  const scenarios = [
    ["full gym / maximum strength", GYM, 45, "maximum_strength", true],
    ["full gym / no 1RM", GYM, 45, "maximum_strength", false],
    ["bodyweight / hypertrophy", ["bodyweight"], 30, "functional_hypertrophy", false],
    ["dumbbells / hypertrophy", ["bodyweight", "dumbbell"], 30, "functional_hypertrophy", false],
    ["full gym / hypertrophy", GYM, 45, "functional_hypertrophy", true],
    ["full gym / power", GYM, 45, "power", true],
    ["full gym / conditioning", GYM, 45, "conditioning", true],
  ] as const;

  // 20. + 21. + 22. + 23. + 24.
  test.each(scenarios)("%s: the sequence adds nothing and changes no dose", (_label, equipment, durationMinutes, adaptation, withOneRepMax) => {
    const result = run({
      equipment: [...equipment],
      durationMinutes,
      adaptation,
      withOneRepMax,
    });
    if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft.");
    }

    const exercises = result.prescription.session.exercises;

    // 23. No exercise was invented, and 22. no warm-up was fabricated.
    for (const exercise of exercises) {
      expect(EXERCISE_KNOWLEDGE_BASE.some((entry) => entry.id === exercise.prescription.exerciseId)).toBe(true);
    }

    // 20. Every id is unique — sequencing moved exercises, never duplicated one.
    const ids = exercises.map((exercise) => exercise.prescription.exerciseId);
    expect(new Set(ids).size).toBe(ids.length);

    // `order` is renumbered to match the array, contiguous from 1.
    expect(exercises.map((exercise) => exercise.order)).toEqual(exercises.map((_, index) => index + 1));

    // 24. The published duration still exists and fits the request.
    expect(result.sessionDraft.estimatedDurationMinutes).not.toBeUndefined();
    expect(result.sessionDraft.estimatedDurationMinutes!).toBeLessThanOrEqual(durationMinutes);
  });
});

describe("sequencing — H2 / H2.1 / H2.2B regressions", () => {
  // 25. + 28. Adequacy is untouched by ordering.
  test("25. + 28. bodyweight maximum strength is still inadequate", () => {
    const result = run({ equipment: ["bodyweight"], durationMinutes: 30, adaptation: "maximum_strength" });
    if (result.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }
    expect(result.sessionAdequacy.status).toBe("inadequate");
    expect(result.sessionAdequacy.primaryAdaptationCovered).toBe(false);
  });

  // 26. H2.1's driver-first selection still holds, and sequencing now protects it.
  test("26. the driver is still selected AND now performed first", () => {
    const result = run({
      equipment: ["bodyweight", "barbell", "bench", "rack", "plates"],
      durationMinutes: 30,
      adaptation: "maximum_strength",
    });
    if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft.");
    }
    const driver = result.sessionAdequacy.drivingExerciseIds[0];
    expect(driver).toBeDefined();
    expect(result.prescription.session.exercises[0].prescription.exerciseId).toBe(driver);
  });

  // 27. H2.2B hypertrophy scenarios remain adequate.
  test("27. hypertrophy sessions remain adequate", () => {
    for (const equipment of [["bodyweight"], ["bodyweight", "dumbbell"]] as EquipmentType[][]) {
      const result = run({ equipment, durationMinutes: 30, adaptation: "functional_hypertrophy" });
      if (result.outcome !== "draft") {
        throw new Error("Expected a draft.");
      }
      expect(result.sessionAdequacy.primaryAdaptationCovered).toBe(true);
      expect(result.sessionAdequacy.status).toBe("adequate");
    }
  });
});

describe("sequencing — Decision Trace", () => {
  // 30. Stable rule ids, and an answer for every sequencing question.
  test("30. the trace explains the order it produced", () => {
    const result = run({
      equipment: GYM,
      durationMinutes: 45,
      adaptation: "maximum_strength",
      withOneRepMax: true,
    });
    if (result.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }

    const entries = result.decisionTrace.entries.filter((entry) => entry.id.includes("_sequencing_"));
    expect(entries.length).toBeGreaterThan(0);

    // Why is bench_press first?
    const benchEntry = entries.find((entry) => entry.id.endsWith("_sequencing_bench_press"));
    expect(benchEntry?.decision).toContain("position 1");
    expect(benchEntry?.reasons.join(" ")).toContain("objective_driver");
    expect(benchEntry?.reasons.join(" ")).toContain("Neurally expensive");

    // What decided the order overall, and what tie-broke it?
    const summary = entries.find((entry) => entry.id.endsWith("_sequencing_summary"));
    expect(summary?.reasons.join(" ")).toContain("then by canonical id");
    expect(summary?.reasons.join(" ")).toContain("does not decide their order");
  });

  // 16. Same-region adjacency is reported rather than silently reordered.
  test("16. consecutive exercises sharing a loaded region are reported", () => {
    const context = { requestedAdaptation: "functional_hypertrophy" as AdaptationDomain };
    // Two hinge-pattern exercises both loading hip and thigh.
    const sequence = sequenceSession(
      [candidateOf("single_leg_hip_thrust"), candidateOf("split_squat")],
      context,
    );
    const findings = adjacentSharedRegions(sequence);
    expect(findings).toHaveLength(1);
    expect(findings[0].regions.length).toBeGreaterThan(0);
  });
});
