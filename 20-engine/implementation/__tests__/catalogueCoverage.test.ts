import { describe, expect, test } from "vitest";

import { isDriverRoleFor } from "../adaptationDrivers";
import { EXERCISE_KNOWLEDGE_BASE } from "../exerciseKnowledgeBase";
import { runEngine } from "../index";
import { filterEligibleExercises } from "../exerciseSelector";
import { EXERCISE_PRESCRIPTION_REGISTRY, isPilotExerciseId } from "../prescription/exercisePrescriptionRegistry";
import { makeAthleteProfile, makeEnvironment, makeRequest, makeValidInput } from "./fixtures";
import type { AdaptationDomain, EquipmentType } from "../types";

/**
 * Catalogue coverage — the measurement Lot H2.2 leaves behind.
 *
 * WHY THIS FILE EXISTS. H2 made inadequate sessions visible and H2.1 made
 * selection secure a driver. What remained was neither an engine defect nor a
 * selection defect: for most equipment profiles the CATALOGUE holds no exercise
 * able to drive the requested adaptation, so the honest answer is `inadequate`
 * and no amount of engine work changes it.
 *
 * This file measures that, per equipment profile and per adaptation, so the gap
 * is a number rather than an impression. It is deliberately written as an
 * ASSERTION of the current state: adding an exercise to the knowledge base
 * should make one of these numbers move, and the diff should say which.
 *
 * A zero here is not a bug in the engine. It is a statement about what the
 * repository has documented so far — see `02_EXERCISE_KNOWLEDGE_BASE.md`.
 */

/** Equipment an athlete plausibly has, from nothing to a full facility. */
const PROFILES = {
  bodyweight: ["bodyweight"],
  bodyweight_bar: ["bodyweight", "pull_up_bar"],
  bands: ["bodyweight", "resistance_band"],
  dumbbells: ["bodyweight", "dumbbell"],
  kettlebell: ["bodyweight", "kettlebell"],
  medicine_ball: ["bodyweight", "medicine_ball", "slam_ball", "wall"],
  full_gym: [
    "bodyweight",
    "barbell",
    "bench",
    "rack",
    "plates",
    "dumbbell",
    "kettlebell",
    "pull_up_bar",
    "dip_bars",
    "cable_machine",
    "box",
    "mat",
    "cardio_machine",
    "rowing_ergometer",
    "plyometric_box",
    "trap_bar",
    "sled",
    "rope",
    "sandbag",
    "ab_wheel",
    "towel",
    "farmer_handle",
    "pinch_grip_implement",
    "rigid_anchor_support",
    "heavy_bag",
    "medicine_ball",
    "slam_ball",
    "wall",
    "open_space",
  ],
} as const satisfies Record<string, readonly EquipmentType[]>;

type ProfileName = keyof typeof PROFILES;

/**
 * Exercises that are eligible under `equipment`, present in the prescription
 * registry, and able to DRIVE `adaptation` — the only count that decides
 * whether a request of that kind can produce an adequate session.
 */
function driversFor(profile: ProfileName, adaptation: AdaptationDomain): string[] {
  const input = makeValidInput({
    athleteProfile: makeAthleteProfile({ performanceReferences: [] }),
    environment: makeEnvironment({
      availableEquipment: PROFILES[profile].map((type) => ({ type })),
      usableWall: true,
      floorSafe: true,
      jumpingAllowed: true,
      throwingAllowed: true,
    }),
    request: makeRequest({ durationMinutes: 45, primaryObjective: { adaptationDomain: adaptation } }),
  });

  return filterEligibleExercises([...EXERCISE_KNOWLEDGE_BASE], input)
    .filter((result) => result.eligible)
    .map((result) => result.exerciseId)
    .filter((exerciseId) => {
      if (!isPilotExerciseId(exerciseId)) {
        return false;
      }
      const exercise = EXERCISE_KNOWLEDGE_BASE.find((entry) => entry.id === exerciseId);
      return (
        exercise?.primaryAdaptation === adaptation &&
        isDriverRoleFor(adaptation, EXERCISE_PRESCRIPTION_REGISTRY[exerciseId].role)
      );
    });
}

/**
 * The measured matrix, as of Lot H2.2.
 *
 * Each number is the count of PRESCRIBABLE DRIVERS. Zero means a request for
 * that adaptation under that equipment cannot produce an adequate session, and
 * `sessionAdequacy` will say so.
 */
const EXPECTED_DRIVER_COUNTS: Record<ProfileName, Partial<Record<AdaptationDomain, number>>> = {
  bodyweight: {
    maximum_strength: 0,
    functional_hypertrophy: 0,
    power: 5,
    conditioning: 0,
    robustness: 4,
    specific_skill: 2,
  },
  bodyweight_bar: {
    maximum_strength: 1,
    functional_hypertrophy: 0,
    power: 5,
    conditioning: 0,
    robustness: 5,
    specific_skill: 2,
  },
  bands: {
    maximum_strength: 0,
    functional_hypertrophy: 0,
    power: 5,
    conditioning: 0,
    robustness: 5,
    specific_skill: 2,
  },
  dumbbells: {
    maximum_strength: 0,
    functional_hypertrophy: 0,
    power: 5,
    conditioning: 0,
    robustness: 4,
    specific_skill: 2,
  },
  kettlebell: {
    maximum_strength: 0,
    functional_hypertrophy: 0,
    power: 5,
    conditioning: 0,
    robustness: 4,
    specific_skill: 2,
  },
  medicine_ball: {
    maximum_strength: 0,
    functional_hypertrophy: 0,
    power: 11,
    conditioning: 0,
    robustness: 4,
    specific_skill: 2,
  },
  full_gym: {
    maximum_strength: 10,
    functional_hypertrophy: 0,
    power: 17,
    conditioning: 2,
    robustness: 7,
    specific_skill: 7,
  },
};

describe("catalogue coverage — prescribable drivers per equipment profile", () => {
  for (const profile of Object.keys(EXPECTED_DRIVER_COUNTS) as ProfileName[]) {
    for (const [adaptation, expected] of Object.entries(EXPECTED_DRIVER_COUNTS[profile]) as [
      AdaptationDomain,
      number,
    ][]) {
      test(`${profile} / ${adaptation}: ${expected} prescribable driver(s)`, () => {
        expect(driversFor(profile, adaptation).length).toBe(expected);
      });
    }
  }
});

describe("catalogue coverage — the gaps this measurement exists to name", () => {
  // The single largest gap, and the one that needs no engine work to close:
  // the prescription layer already carries `functional_hypertrophy_primary_v0_1`
  // (3-4 sets, 6-12 reps, RPE 7-9 or RIR 1-3, `requiresExerciseSpecificLoadRule:
  // false`), so a hypertrophy exercise would be prescribable WITHOUT any athlete
  // loading reference. The knowledge base simply contains no exercise in that
  // module.
  test("the functional_hypertrophy module is empty catalogue-wide", () => {
    const hypertrophyExercises = EXERCISE_KNOWLEDGE_BASE.filter(
      (exercise) => exercise.module === "functional_hypertrophy",
    );
    expect(hypertrophyExercises).toEqual([]);

    // Not even a fully equipped gym can serve a hypertrophy request.
    expect(driversFor("full_gym", "functional_hypertrophy")).toEqual([]);
  });

  // Every profile an athlete can assemble at home is unable to drive the two
  // adaptations that motivate most physical preparation.
  test("no home equipment profile can drive strength or hypertrophy, except a pull-up bar", () => {
    for (const profile of ["bodyweight", "bands", "dumbbells", "kettlebell"] as ProfileName[]) {
      expect(driversFor(profile, "maximum_strength")).toEqual([]);
      expect(driversFor(profile, "functional_hypertrophy")).toEqual([]);
    }

    // The lone exception, and it is instructive: `pull_up` is a `strength`
    // /`primary` registry entry whose own `supportedIntensityTypes` are
    // `["rpe", "rir"]`, so it takes the RPE branch of
    // `strength_primary_straight_sets_v0_1` instead of the percentage-of-1RM
    // branch. Bodyweight maximum strength IS supported doctrine — for movements
    // hard enough that 3-6 repetitions sit at RPE 7.5-9.
    expect(driversFor("bodyweight_bar", "maximum_strength")).toEqual(["pull_up"]);
  });

  test("conditioning needs a machine: no home profile can drive it", () => {
    for (const profile of ["bodyweight", "bands", "dumbbells", "kettlebell"] as ProfileName[]) {
      expect(driversFor(profile, "conditioning")).toEqual([]);
    }
    expect(driversFor("full_gym", "conditioning")).toEqual(["assault_bike_intervals", "rowerg_intervals"]);
  });
});

describe("catalogue coverage — every catalogued exercise is prescribable", () => {
  // 30. An exercise the engine can select but not dose is a trap: it reaches
  // composition, fails prescription, and either omits itself or takes the whole
  // session down with it.
  test("exactly one catalogued exercise cannot be prescribed, and the reason is documented", () => {
    const missing = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id).filter(
      (exerciseId) => !isPilotExerciseId(exerciseId),
    );

    // `turkish_get_up` is catalogued, sourced (`50-exercises/40_TURKISH_GET_UP`)
    // and eligible for the dumbbell and kettlebell profiles — the two profiles
    // with the fewest drivers. It has no registry entry because it CANNOT be
    // dosed from the documented tables:
    //
    // - its chapter's Loading Profile documents 2-5 sets of 1-5 REPETITIONS per
    //   side;
    // - the only `movement`-module profile that takes repetitions is
    //   `partner_grappling_rounds_technical_v0_1`, which counts partner rounds;
    // - `controlled_mobility_sets_v0_1`, the other `movement` profile, is
    //   `sets_duration` (20-60 s holds) and would contradict the chapter.
    //
    // Prescribing it as a timed hold would misrepresent a documented movement;
    // adding a repetition-based movement profile would mean inventing dose
    // numbers `34_NUMERICAL_PRESCRIPTION_TABLES.md` does not carry. Both are
    // refused, so the exercise stays selectable-but-undosable and this test
    // records why. See `02_EXERCISE_KNOWLEDGE_BASE.md`.
    expect(missing).toEqual(["turkish_get_up"]);
  });

  test("every registry entry names an exercise the knowledge base defines", () => {
    const catalogued = new Set(EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id));
    for (const exerciseId of Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)) {
      expect(catalogued.has(exerciseId)).toBe(true);
    }
  });
});

describe("catalogue coverage — what the matrix means for a real request", () => {
  /** A full generation for one equipment profile and objective. */
  function generate(profile: ProfileName, adaptation: AdaptationDomain, durationMinutes: number) {
    return runEngine(
      makeValidInput({
        athleteProfile: makeAthleteProfile({
          // A recorded 1RM, so nothing here fails for want of a reference: what
          // is being measured is the CATALOGUE, not the athlete's data.
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
        environment: makeEnvironment({
          availableEquipment: PROFILES[profile].map((type) => ({ type })),
          usableWall: true,
          floorSafe: true,
          jumpingAllowed: true,
          throwingAllowed: true,
        }),
        request: makeRequest({ durationMinutes, primaryObjective: { adaptationDomain: adaptation } }),
      }),
    );
  }

  // 22. + 23. + 24. + 25. Each scenario's outcome is exactly what the matrix
  // predicts. None is falsely presented as a usable session.
  test("A. bodyweight / hypertrophy: blocked — the module holds no exercise at all", () => {
    expect(generate("bodyweight", "functional_hypertrophy", 30).outcome).toBe("blocked");
  });

  test("C. dumbbells / hypertrophy: blocked for the same reason", () => {
    expect(generate("dumbbells", "functional_hypertrophy", 45).outcome).toBe("blocked");
  });

  test("E. bands / maximum strength: inadequate, accessory-only — the Lot H2 shape", () => {
    const result = generate("bands", "maximum_strength", 30);
    if (result.outcome !== "draft") {
      throw new Error(`Expected a draft, received "${result.outcome}".`);
    }
    expect(result.sessionAdequacy.status).toBe("inadequate");
    expect(result.sessionAdequacy.primaryAdaptationCovered).toBe(false);
  });

  test("B. bodyweight + pull-up bar / maximum strength: adequate, driver secured", () => {
    const result = generate("bodyweight_bar", "maximum_strength", 30);
    if (result.outcome !== "draft") {
      throw new Error(`Expected a draft, received "${result.outcome}".`);
    }
    // Lot H2.1's driver-first rule, on a bodyweight movement dosed by RPE.
    expect(result.sessionAdequacy.drivingExerciseIds).toEqual(["pull_up"]);
    expect(result.sessionAdequacy.status).toBe("adequate");
  });

  test("F. medicine ball / power: adequate", () => {
    const result = generate("medicine_ball", "power", 30);
    if (result.outcome !== "draft") {
      throw new Error(`Expected a draft, received "${result.outcome}".`);
    }
    expect(result.sessionAdequacy.primaryAdaptationCovered).toBe(true);
    expect(result.sessionAdequacy.status).toBe("adequate");
  });

  test("G. full gym / maximum strength: adequate, driver secured before accessories", () => {
    const result = generate("full_gym", "maximum_strength", 45);
    if (result.outcome !== "draft") {
      throw new Error(`Expected a draft, received "${result.outcome}".`);
    }
    expect(result.sessionAdequacy.primaryAdaptationCovered).toBe(true);
    expect(result.sessionAdequacy.status).toBe("adequate");
  });

  // 26. Determinism across the whole catalogue-driven path.
  test("26. repeated generation is identical", () => {
    const first = generate("full_gym", "maximum_strength", 45);
    const second = generate("full_gym", "maximum_strength", 45);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });
});
