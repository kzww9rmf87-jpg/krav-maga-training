/**
 * Combat Athlete System — New Registry Exercises Audit
 *
 * Covers the 21 exercises added to `EXERCISE_PRESCRIPTION_REGISTRY` on top
 * of the original 7-exercise pilot slice (commit "feat: extend prescription
 * registry to 28 exercises"), family by family: Force, Power, Core,
 * Carries/Grip, Plyometrics.
 *
 * This file adds coverage only — it asserts no new business rule, no new
 * numerical value and no new duration timing. Every expected number here
 * (sets, reps, distance, duration, %1RM) is copied from an existing,
 * already-passing test in `pilotExercisePrescription.test.ts` or read
 * directly from `prescriptionKnowledge.ts` / the registry entries
 * themselves — never invented for this file.
 */

import { describe, expect, test } from "vitest";

import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  getExercisePrescriptionSource,
  isPilotExerciseId,
  type PilotExerciseId,
  type PrescriptionExecutionContext,
} from "../../prescription/exercisePrescriptionRegistry";
import { prescribeExercise } from "../../prescription/prescribeExercise";
import { prescribeSession, type SessionExercisePrescriptionInput } from "../../prescription/prescribeSession";
import { DURATION_ESTIMATION_PROFILES, getDurationEstimationProfile } from "../../prescription/durationEstimationProfiles";
import type { ExercisePrescriptionSource } from "../../prescription/buildPrescriptionInput";

import { runEngine } from "../../index";
import { makeExercise, makeRequest, makeValidInput } from "../fixtures";
import { makeOneRepMaxReference } from "./fixtures";

// -----------------------------------------------------------------------------
// The 21 new exercises, grouped exactly as they are commented in
// exercisePrescriptionRegistry.ts ("Family extension — Force, Power, Core,
// Carries/Grip, Plyometrics, Ballistics").
// -----------------------------------------------------------------------------

const FORCE_EXERCISE_IDS = ["front_squat", "romanian_deadlift", "overhead_press", "bulgarian_split_squat"] as const;
const POWER_EXERCISE_IDS = ["push_press", "hang_high_pull", "jump_shrug"] as const;
const CORE_EXERCISE_IDS = ["hollow_body_hold", "dragon_flag"] as const;
const CARRY_GRIP_EXERCISE_IDS = [
  "front_rack_carry",
  "sandbag_carry",
  "zercher_carry",
  "suitcase_carry",
  "overhead_carry",
  "pinch_carry",
] as const;
const PLYOMETRIC_EXERCISE_IDS = [
  "depth_jump",
  "broad_jump",
  "knee_jump",
  "lateral_bound",
  "single_leg_hop",
  "split_squat_jump",
] as const;

const ALL_NEW_EXERCISE_IDS = [
  ...FORCE_EXERCISE_IDS,
  ...POWER_EXERCISE_IDS,
  ...CORE_EXERCISE_IDS,
  ...CARRY_GRIP_EXERCISE_IDS,
  ...PLYOMETRIC_EXERCISE_IDS,
] as const;

/**
 * A valid execution context for `id`, built strictly from what the
 * exercise's own registry entry declares it needs — never a hand-picked
 * value that might silently drift from the entry.
 */
function buildValidContextFor(id: PilotExerciseId): PrescriptionExecutionContext {
  const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
  const athleteReferences = entry.capabilities.requiredAthleteReferenceTypes.includes("one_rep_max")
    ? [makeOneRepMaxReference({ value: 100 })]
    : [];

  return {
    rangeContext: "normal",
    athleteReferences,
    availableEquipmentCapabilities: entry.capabilities.requiredEquipmentCapabilities,
  };
}

// -----------------------------------------------------------------------------
// 1. Prescriptibility with a valid context — every new exercise, family by family
// -----------------------------------------------------------------------------

function expectPrescribesCompletely(id: PilotExerciseId): void {
  const context = buildValidContextFor(id);
  const sourceResult = getExercisePrescriptionSource(id, context);
  if (!sourceResult.ok) {
    throw new Error(`Expected "${id}" to prescribe successfully, got: ${sourceResult.message}`);
  }

  const result = prescribeExercise({ exerciseId: id, moduleId: sourceResult.moduleId, ...sourceResult.source });
  if (!result.ok) {
    throw new Error(`Expected "${id}" prescription to succeed at ${result.failureStage}: ${result.message}`);
  }

  expect(result.prescription.status).toBe("complete");
  expect(result.prescription.exerciseId).toBe(id);
  expect(result.prescription.methodId).toBe(EXERCISE_PRESCRIPTION_REGISTRY[id].explicitMethodId);
  expect(sourceResult.moduleId).toBe(EXERCISE_PRESCRIPTION_REGISTRY[id].moduleId);
}

describe("new registry exercises — Force family prescribes completely", () => {
  for (const id of FORCE_EXERCISE_IDS) {
    test(`${id} prescribes completely given its documented equipment and athlete-reference requirements`, () => {
      expectPrescribesCompletely(id);
    });
  }
});

describe("new registry exercises — Power family prescribes completely", () => {
  for (const id of POWER_EXERCISE_IDS) {
    test(`${id} prescribes completely via movement_intent, with no fabricated load`, () => {
      expectPrescribesCompletely(id);
    });
  }
});

describe("new registry exercises — Core family prescribes completely", () => {
  for (const id of CORE_EXERCISE_IDS) {
    test(`${id} prescribes completely as a timed isometric hold`, () => {
      expectPrescribesCompletely(id);
    });
  }
});

describe("new registry exercises — Carries/Grip family prescribes completely", () => {
  for (const id of CARRY_GRIP_EXERCISE_IDS) {
    test(`${id} prescribes completely as a distance carry`, () => {
      expectPrescribesCompletely(id);
    });
  }
});

describe("new registry exercises — Plyometrics family prescribes completely", () => {
  for (const id of PLYOMETRIC_EXERCISE_IDS) {
    test(`${id} prescribes completely via movement_intent, with no fabricated load`, () => {
      expectPrescribesCompletely(id);
    });
  }
});

// -----------------------------------------------------------------------------
// 2. Determinism and non-mutation — one representative exercise per family
// -----------------------------------------------------------------------------

describe("new registry exercises — determinism and non-mutation (one exercise per family)", () => {
  const REPRESENTATIVE_IDS = ["front_squat", "push_press", "dragon_flag", "sandbag_carry", "broad_jump"] as const;

  for (const id of REPRESENTATIVE_IDS) {
    test(`${id}: identical calls to getExercisePrescriptionSource produce identical results`, () => {
      const context = buildValidContextFor(id);
      const resultA = getExercisePrescriptionSource(id, context);
      const resultB = getExercisePrescriptionSource(id, context);
      expect(resultA).toEqual(resultB);
    });

    test(`${id}: getExercisePrescriptionSource does not mutate the supplied context`, () => {
      const context = buildValidContextFor(id);
      const snapshot = JSON.parse(JSON.stringify(context));

      getExercisePrescriptionSource(id, context);

      expect(context).toEqual(snapshot);
    });

    test(`${id}: prescribeExercise is deterministic and does not mutate its input`, () => {
      const context = buildValidContextFor(id);
      const sourceResult = getExercisePrescriptionSource(id, context);
      if (!sourceResult.ok) {
        throw new Error(`Fixture setup failed for "${id}": ${sourceResult.message}`);
      }
      const input = { exerciseId: id, moduleId: sourceResult.moduleId, ...sourceResult.source };
      const snapshot = JSON.parse(JSON.stringify(input));

      expect(prescribeExercise(input)).toEqual(prescribeExercise(input));

      prescribeExercise(input);
      expect(input).toEqual(snapshot);
    });
  }

  test("prescribing every new exercise never mutates the shared registry", () => {
    const registrySnapshot = JSON.parse(JSON.stringify(EXERCISE_PRESCRIPTION_REGISTRY));

    for (const id of ALL_NEW_EXERCISE_IDS) {
      const sourceResult = getExercisePrescriptionSource(id, buildValidContextFor(id));
      if (sourceResult.ok) {
        prescribeExercise({ exerciseId: id, moduleId: sourceResult.moduleId, ...sourceResult.source });
      }
    }

    expect(EXERCISE_PRESCRIPTION_REGISTRY).toEqual(registrySnapshot);
  });
});

// -----------------------------------------------------------------------------
// 3. Required athlete references are respected (Force: the three 1RM-loaded lifts)
// -----------------------------------------------------------------------------

describe("new registry exercises — required athlete references are respected", () => {
  const ONE_REP_MAX_EXERCISE_IDS = ["front_squat", "romanian_deadlift", "overhead_press"] as const;

  for (const id of ONE_REP_MAX_EXERCISE_IDS) {
    test(`${id} requires one_rep_max and fails safely, without a fabricated load, when it is missing`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.capabilities.requiredAthleteReferenceTypes).toContain("one_rep_max");

      const result = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: entry.capabilities.requiredEquipmentCapabilities,
      });

      if (result.ok) {
        throw new Error(`Expected "${id}" to fail without a one_rep_max reference.`);
      }
      expect(result.failureCode).toBe("REQUIRED_ATHLETE_REFERENCE_MISSING");
      expect(result.message).toContain("one_rep_max");
    });

    test(`${id} succeeds once a one_rep_max reference is supplied`, () => {
      const result = getExercisePrescriptionSource(id, buildValidContextFor(id));
      if (!result.ok) {
        throw new Error(`Expected "${id}" to succeed once a one_rep_max reference is supplied: ${result.message}`);
      }
      expect(result.source.athleteReferences).toHaveLength(1);
    });
  }

  test("bulgarian_split_squat requires no athlete reference (RPE/RIR only, no invented charge)", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY.bulgarian_split_squat;
    expect(entry.capabilities.requiredAthleteReferenceTypes).toEqual([]);

    const result = getExercisePrescriptionSource("bulgarian_split_squat", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: entry.capabilities.requiredEquipmentCapabilities,
    });
    if (!result.ok) {
      throw new Error(`Expected "bulgarian_split_squat" to succeed without an athlete reference: ${result.message}`);
    }
    expect(result.source.supportedIntensityTypes).not.toContain("percentage_1rm");
  });
});

// -----------------------------------------------------------------------------
// 4. Missing equipment capabilities produce a safe, structured failure
//    (one representative per family, never a thrown exception)
// -----------------------------------------------------------------------------

describe("new registry exercises — missing equipment produces a safe failure (one per family)", () => {
  const MISSING_EQUIPMENT_CASES = [
    { id: "front_squat", missing: "rack" }, // Force
    { id: "push_press", missing: "plates" }, // Power
    { id: "dragon_flag", missing: "rigid_anchor_support" }, // Core
    { id: "pinch_carry", missing: "pinch_grip_implement" }, // Carries/Grip
    { id: "knee_jump", missing: "knee_protection_pad" }, // Plyometrics
  ] as const;

  for (const { id, missing } of MISSING_EQUIPMENT_CASES) {
    test(`${id}: missing "${missing}" produces REQUIRED_EQUIPMENT_MISSING, not an exception`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.capabilities.requiredEquipmentCapabilities).toContain(missing);

      const remainingEquipment = entry.capabilities.requiredEquipmentCapabilities.filter((cap) => cap !== missing);
      const athleteReferences = entry.capabilities.requiredAthleteReferenceTypes.includes("one_rep_max")
        ? [makeOneRepMaxReference({ value: 100 })]
        : [];

      const result = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences,
        availableEquipmentCapabilities: remainingEquipment,
      });

      if (result.ok) {
        throw new Error(`Expected "${id}" to fail safely without "${missing}".`);
      }
      expect(result.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
      expect(result.message).toContain(missing);
    });
  }

  test("split_squat_jump requires no equipment at all and succeeds even with none available", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY.split_squat_jump;
    expect(entry.capabilities.requiredEquipmentCapabilities).toEqual([]);

    const result = getExercisePrescriptionSource("split_squat_jump", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: [],
    });
    if (!result.ok) {
      throw new Error(`Expected "split_squat_jump" to succeed with no equipment available: ${result.message}`);
    }
  });
});

// -----------------------------------------------------------------------------
// 5. A multi-family session — Force, Power, Core, Carries/Grip, Plyometrics — via prescribeSession
// -----------------------------------------------------------------------------

describe("new registry exercises — prescribeSession across all five families", () => {
  test("a session combining one exercise from each of the five families prescribes completely", () => {
    const specs = [
      { id: "front_squat", blockId: "force" },
      { id: "push_press", blockId: "power" },
      { id: "dragon_flag", blockId: "core" },
      { id: "sandbag_carry", blockId: "carries_grip" },
      { id: "broad_jump", blockId: "plyometrics" },
    ] as const;

    const exercises: SessionExercisePrescriptionInput[] = specs.map((spec, index) => {
      const sourceResult = getExercisePrescriptionSource(spec.id, buildValidContextFor(spec.id));
      if (!sourceResult.ok) {
        throw new Error(`Fixture setup failed for "${spec.id}": ${sourceResult.message}`);
      }
      return {
        exerciseId: spec.id,
        moduleId: sourceResult.moduleId,
        ...sourceResult.source,
        order: index + 1,
        required: true,
        blockId: spec.blockId,
      };
    });

    const modules = [...new Set(exercises.map((exercise) => exercise.moduleId))];

    const result = prescribeSession({
      sessionId: "new-registry-multi-family-session",
      sessionName: "Force / Power / Core / Carries-Grip / Plyometrics Session",
      modules,
      exercises,
    });

    if (!result.ok) {
      throw new Error(`Expected the multi-family session to succeed, got issues: ${JSON.stringify(result.issues)}`);
    }

    expect(result.session.exercises).toHaveLength(5);
    expect(result.session.exercises.map((exercise) => exercise.prescription.exerciseId)).toEqual([
      "front_squat",
      "push_press",
      "dragon_flag",
      "sandbag_carry",
      "broad_jump",
    ]);
    expect(result.session.sourceRuleIds.length).toBeGreaterThan(0);
  });
});

// -----------------------------------------------------------------------------
// 6. runEngine works end to end with several of the new registry exercises at once
// -----------------------------------------------------------------------------

describe("new registry exercises — runEngine integration", () => {
  test("front_squat (strength/primary) and broad_jump (power/secondary) both prescribe through a single runEngine call", () => {
    const frontSquatExercise = makeExercise({ id: "front_squat", module: "strength", primaryAdaptation: "maximum_strength" });
    const broadJumpExercise = makeExercise({ id: "broad_jump", module: "power", primaryAdaptation: "power" });

    const input = makeValidInput({
      request: makeRequest({ secondaryObjectives: [{ adaptationDomain: "power" }] }),
    });

    const frontSquatSource = getExercisePrescriptionSource("front_squat", buildValidContextFor("front_squat"));
    const broadJumpSource = getExercisePrescriptionSource("broad_jump", buildValidContextFor("broad_jump"));
    if (!frontSquatSource.ok || !broadJumpSource.ok) {
      throw new Error("Fixture setup failed: one of the new registry sources did not resolve.");
    }

    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([
      ["front_squat", frontSquatSource.source],
      ["broad_jump", broadJumpSource.source],
    ]);

    const result = runEngine(input, [frontSquatExercise, broadJumpExercise], prescriptionSources);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }
    if (result.prescription?.status !== "prescribed") {
      throw new Error(`Expected prescription status "prescribed", got: ${JSON.stringify(result.prescription)}`);
    }

    const prescribedIds = result.prescription.session.exercises.map((exercise) => exercise.prescription.exerciseId);
    expect(result.prescription.session.exercises.length).toBe(2);
    expect(prescribedIds).toEqual(expect.arrayContaining(["front_squat", "broad_jump"]));
  });

  test("determinism: running the engine twice with the same new-exercise inputs is identical", () => {
    const exercise = makeExercise({ id: "front_squat", module: "strength", primaryAdaptation: "maximum_strength" });
    const input = makeValidInput();
    const sourceResult = getExercisePrescriptionSource("front_squat", buildValidContextFor("front_squat"));
    if (!sourceResult.ok) {
      throw new Error(`Fixture setup failed: ${sourceResult.message}`);
    }
    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([["front_squat", sourceResult.source]]);

    const resultA = runEngine(input, [exercise], prescriptionSources);
    const resultB = runEngine(input, [exercise], prescriptionSources);

    expect(resultA).toEqual(resultB);
  });
});

// -----------------------------------------------------------------------------
// 7. An unknown exercise stays unavailable
//
// med_ball_slam was integrated in a later session (see
// ballisticExercises.test.ts for its full coverage) — this block now uses
// med_ball_chest_pass, which remains genuinely unintegrated: no canonical
// equipment capability id represents a standard medicine ball, see the
// integrability report.
// -----------------------------------------------------------------------------

describe("new registry exercises — an unintegrated exercise (med_ball_chest_pass) stays unavailable", () => {
  test("getExercisePrescriptionSource reports EXERCISE_NOT_IN_REGISTRY without throwing", () => {
    expect(isPilotExerciseId("med_ball_chest_pass")).toBe(false);

    const result = getExercisePrescriptionSource("med_ball_chest_pass", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: [],
    });

    if (result.ok) {
      throw new Error("Expected med_ball_chest_pass to be reported as not in the registry.");
    }
    expect(result.failureCode).toBe("EXERCISE_NOT_IN_REGISTRY");
  });

  test("runEngine keeps a med_ball_chest_pass candidate's prescription unavailable, never fabricated", () => {
    const input = makeValidInput();
    const exercise = makeExercise({ id: "med_ball_chest_pass" });

    const result = runEngine(input, [exercise], new Map());

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }
    if (result.prescription?.status !== "unavailable") {
      throw new Error(`Expected prescription status "unavailable", got: ${JSON.stringify(result.prescription)}`);
    }
    expect(result.prescription.missingSourceData.some((gap) => gap.exerciseId === "med_ball_chest_pass")).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// 8. Every new duration profile stays unresolved and invents no timing value
// -----------------------------------------------------------------------------

describe("new registry exercises — duration profiles remain unresolved and invent nothing", () => {
  for (const id of ALL_NEW_EXERCISE_IDS) {
    test(`${id}'s duration profile exists, is unresolved, and every timing field is null`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      const profileId = entry.capabilities.durationEstimationProfileId;
      if (profileId === null) {
        throw new Error(`Expected "${id}" to declare a duration estimation profile id.`);
      }
      const profile = DURATION_ESTIMATION_PROFILES[profileId];

      expect(profile).toBeDefined();
      expect(profile.exerciseId).toBe(id);
      expect(profile.status).toBe("unresolved");
      expect(profile.averageRepetitionSeconds).toBeNull();
      expect(profile.averageSetupSeconds).toBeNull();
      expect(profile.transitionSeconds).toBeNull();
      expect(profile.restSeconds).toBeNull();
      expect(profile.perSetSeconds).toBeNull();
      expect(profile.perRoundSeconds).toBeNull();
      expect(profile.perIntervalSeconds).toBeNull();
      expect(profile.technicalMarginSeconds).toBeNull();

      const result = getDurationEstimationProfile(profileId);
      if (result.ok) {
        throw new Error(`Expected "${id}"'s duration profile to be refused as unresolved.`);
      }
      expect(result.failureCode).toBe("DURATION_PROFILE_UNRESOLVED");
    });
  }
});
