/**
 * Combat Athlete System — Registry Lot 9: hanging_leg_raise
 *
 * Third consumer of Table Group 13's `core_robustness_straight_sets_v0_1`,
 * and the first suspended one. No new numerical profile, no new equipment
 * identifier and no knowledge-base change: `pull_up_bar` and
 * `safe_landing_surface` already existed and were already this exercise's
 * own documented gates.
 *
 * What this file guards beyond presence:
 *
 * - the programming-application choice. This chapter documents NO
 *   sets/repetitions/rest in its own Loading Profile and gives five
 *   "Programming Applications" instead. The one encoded is the one the
 *   chapter's own CAS Selection Logic names ("the target adaptation
 *   includes advanced core strength" → "Core Strength Development"), not a
 *   blend of the five and not the widest;
 * - the grip stop condition. The chapter requires stopping on grip-security
 *   loss; that is carried by the EXISTING `equipmentFailureCondition`
 *   factory, which already documents grip in its own contract — no factory
 *   was invented;
 * - what was NOT converted: knee flexion, leg length, range of motion,
 *   pause duration and the six-stage progression ladder are all lever and
 *   variation choices, never numbers.
 */

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import { EXERCISE_KNOWLEDGE_BASE, HANGING_LEG_RAISE } from "../../exerciseKnowledgeBase";
import { checkExerciseEligibility } from "../../exerciseSelector";
import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  getExercisePrescriptionSource,
  PILOT_EXERCISE_IDS,
  type PilotExerciseId,
  type PrescriptionExecutionContext,
} from "../../prescription/exercisePrescriptionRegistry";
import { prescribeExercise } from "../../prescription/prescribeExercise";
import { prescribeSession, type SessionExercisePrescriptionInput } from "../../prescription/prescribeSession";
import {
  NUMERICAL_PRESCRIPTION_PROFILES,
  getNumericalPrescriptionProfileById,
  resolveNumericalProfile,
} from "../../prescription/prescriptionKnowledge";
import { getDurationEstimationProfile } from "../../prescription/durationEstimationProfiles";
import { validatePilotRegistry } from "../../prescription/registryValidators";
import {
  EQUIPMENT_CAPABILITY_IDS,
  findUnknownEquipmentCapabilities,
  isEquipmentCapabilityId,
} from "../../prescription/equipmentCapabilities";
import { getTrainingMethodContract } from "../../prescription/contracts";
import { adaptExercisePrescriptionResult } from "../../prescription/prescriptionDecisionTrace";
import type { ExercisePrescriptionSource } from "../../prescription/buildPrescriptionInput";

import { runEngine } from "../../index";
import { makeAthleteProfile, makeEnvironment, makeExercise, makeRequest, makeValidInput } from "../fixtures";

const EXERCISE_ID = "hanging_leg_raise";
const PROFILE_ID = "core_robustness_straight_sets_v0_1";
const SOURCE_CHAPTER = "50-exercises/62_CORE/14_HANGING_LEG_RAISE.md";

const VALID_CONTEXT: PrescriptionExecutionContext = {
  rangeContext: "normal",
  athleteReferences: [],
  availableEquipmentCapabilities: ["pull_up_bar", "safe_landing_surface"],
};

const validEnvironment = () =>
  makeEnvironment({
    availableEquipment: [{ type: "pull_up_bar" }],
    floorSafe: true,
    availableSpace: "very_limited",
  });

function prescribe(rangeContext: PrescriptionExecutionContext["rangeContext"] = "normal") {
  const sourceResult = getExercisePrescriptionSource(EXERCISE_ID, { ...VALID_CONTEXT, rangeContext });
  if (!sourceResult.ok) {
    throw new Error(`Expected a prescription source for "${EXERCISE_ID}", got: ${sourceResult.message}`);
  }
  const result = prescribeExercise({
    exerciseId: EXERCISE_ID,
    moduleId: sourceResult.moduleId,
    ...sourceResult.source,
  });
  if (!result.ok) {
    throw new Error(`Expected "${EXERCISE_ID}" to prescribe, failed at ${result.failureStage}: ${result.message}`);
  }
  return result;
}

// -----------------------------------------------------------------------------
// 1-6. Counts, presence, additivity
// -----------------------------------------------------------------------------

describe("hanging_leg_raise — registry, knowledge base, profile and equipment counts", () => {
  test("1. the registry grew from 63 to exactly 64 entries", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(82);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(82);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort()).toEqual([...PILOT_EXERCISE_IDS].sort());
  });

  test("2. the knowledge base still holds exactly 76 ExerciseDefinitions — none added, none removed", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toHaveLength(83);
    expect(new Set(EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id)).size).toBe(83);
  });

  test("3. the numerical prescription profiles stay at 22 — this lot created none", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(23);
  });

  test("4. the equipment vocabulary stayed at 25 for this lot — the later heavy_bag_power_intervals lot added `heavy_bag`, bringing it to 26", () => {
    expect(EQUIPMENT_CAPABILITY_IDS).toHaveLength(34);
    // Both ids this entry needs already existed.
    expect(isEquipmentCapabilityId("pull_up_bar")).toBe(true);
    expect(isEquipmentCapabilityId("safe_landing_surface")).toBe(true);
  });

  test("5. hanging_leg_raise exists in both the knowledge base and the registry, with consistent identifiers", () => {
    const kbEntry = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === EXERCISE_ID);
    expect(kbEntry).toBeDefined();
    expect(kbEntry?.module).toBe("core");
    // The chapter's own "# Primary Adaptation: Robustness" — which is also
    // why the registry role below is `robustness`.
    expect(kbEntry?.primaryAdaptation).toBe("robustness");

    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.exerciseId).toBe(EXERCISE_ID);
    expect(entry.capabilities.exerciseId).toBe(EXERCISE_ID);
    expect(PILOT_EXERCISE_IDS.filter((id) => id === EXERCISE_ID)).toHaveLength(1);
  });

  test("6. no other exercise was added: the 63 previous ids plus hanging_leg_raise account for every key", () => {
    const PREVIOUS_IDS = [
      "bench_press", "back_squat", "trap_bar_deadlift", "pull_up", "farmer_carry", "pallof_press", "box_jump",
      "front_squat", "romanian_deadlift", "overhead_press", "bulgarian_split_squat",
      "push_press", "hang_high_pull", "jump_shrug",
      "hollow_body_hold", "dragon_flag",
      "front_rack_carry", "sandbag_carry", "zercher_carry", "suitcase_carry", "overhead_carry", "pinch_carry",
      "depth_jump", "broad_jump", "knee_jump", "lateral_bound", "single_leg_hop", "split_squat_jump",
      "med_ball_slam", "med_ball_chest_pass", "med_ball_overhead_throw", "med_ball_shot_put_throw",
      "med_ball_reverse_throw", "med_ball_rotational_throw", "med_ball_scoop_toss",
      "tibialis_raise", "rotator_cuff_training", "wrist_strengthening", "soleus_raise",
      "countermovement_jump", "copenhagen_plank",
      "hip_thrust", "chin_up", "barbell_row",
      "chest_supported_row", "dip", "landmine_press", "weighted_pull_up", "neck_training", "nordic_hamstring_curl",
      "hang_power_clean",
      "bear_crawl", "bridging", "footwork_drills", "shadow_boxing", "technical_stand_up", "shrimping",
      "sprawl", "shot_entries",
      "rowerg_intervals", "sprint_intervals", "ab_wheel", "dead_bug",
    ] as const;

    // Ids added by lots AFTER this one, listed explicitly so this test keeps
    // proving that hanging_leg_raise was the only exercise this lot added.
    const ADDED_BY_LATER_LOTS = ["plate_pinch", "heavy_bag_power_intervals", "battle_ropes", "assault_bike_intervals", "towel_pull_up", "rope_climb", "rope_pull", "pummeling", "wall_wrestling", "grip_fighting", "sled_push", "push_up", "split_squat", "single_leg_hip_thrust", "goblet_squat", "dumbbell_bench_press", "one_arm_dumbbell_row", "dumbbell_romanian_deadlift"] as const;

    expect(PREVIOUS_IDS).toHaveLength(63);
    expect([...PREVIOUS_IDS, EXERCISE_ID, ...ADDED_BY_LATER_LOTS].sort()).toEqual(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort());

    // pallof_press and dragon_flag complete 62_CORE's repetition-prescribed
    // family, but both are in the registry only as TIMED holds — their
    // documented repetition variants remain unrepresented.
    for (const id of ["pallof_press", "dragon_flag"] as const) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].explicitMethodId).toBe("timed_isometric_sets");
    }
  });
});

// -----------------------------------------------------------------------------
// 7-9. Equipment and eligibility
// -----------------------------------------------------------------------------

describe("hanging_leg_raise — equipment and eligibility", () => {
  test("7. the exact equipment makes it eligible, in both layers", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.capabilities.requiredEquipmentCapabilities).toEqual(["pull_up_bar", "safe_landing_surface"]);
    expect(findUnknownEquipmentCapabilities(entry.capabilities.requiredEquipmentCapabilities)).toEqual([]);

    // The knowledge base gates on the same apparatus plus the chapter's own
    // "Stable non-slip landing area" and its minimal space requirement.
    const atoms = HANGING_LEG_RAISE.requirements!.required.flatMap((clause) => clause.items);
    const equipment = atoms
      .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
      .map((atom) => atom.equipment);
    expect(equipment).toEqual(["pull_up_bar"]);

    const eligible = checkExerciseEligibility(HANGING_LEG_RAISE, makeValidInput({ environment: validEnvironment() }));
    expect(eligible.eligible).toBe(true);
    expect(eligible.rejectionReasons).toEqual([]);

    expect(getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT).ok).toBe(true);
  });

  test("8. no equipment at all makes it ineligible, in both layers", () => {
    const noEquipment = makeValidInput({
      environment: makeEnvironment({ availableEquipment: [], floorSafe: true, availableSpace: "very_limited" }),
    });
    const kbResult = checkExerciseEligibility(HANGING_LEG_RAISE, noEquipment);
    expect(kbResult.eligible).toBe(false);
    expect(kbResult.rejectionReasons.some((reason) => reason.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);

    for (const available of [[], ["pull_up_bar"], ["safe_landing_surface"]]) {
      const sourceResult = getExercisePrescriptionSource(EXERCISE_ID, {
        ...VALID_CONTEXT,
        availableEquipmentCapabilities: available,
      });
      expect(sourceResult.ok).toBe(false);
      if (sourceResult.ok) continue;
      expect(sourceResult.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
    }
  });

  test("9. incorrect equipment does not satisfy it — no equivalence with rings, a captain's chair or another anchor", () => {
    for (const type of ["dip_bars", "rigid_anchor_support", "rope", "bench", "other"] as const) {
      const input = makeValidInput({
        environment: makeEnvironment({ availableEquipment: [{ type }], floorSafe: true, availableSpace: "very_limited" }),
      });
      const result = checkExerciseEligibility(HANGING_LEG_RAISE, input);
      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((reason) => reason.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    }

    // `rigid_anchor_support` is Dragon Flag's own hand anchor, a different
    // apparatus — it is deliberately not reused here.
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].capabilities.requiredEquipmentCapabilities).not.toContain(
      "rigid_anchor_support",
    );
    expect(EXERCISE_PRESCRIPTION_REGISTRY.dragon_flag.capabilities.requiredEquipmentCapabilities).toContain(
      "rigid_anchor_support",
    );

    // None of the chapter's Optional items is promoted to required, and no
    // identifier was invented for any of them.
    for (const optional of ["gymnastics_rings", "captains_chair", "ab_straps", "ankle_weights", "chalk"]) {
      expect(isEquipmentCapabilityId(optional)).toBe(false);
    }

    // The landing-surface gate is real: an unsafe floor disqualifies it.
    const unsafeFloor = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "pull_up_bar" }],
        floorSafe: false,
        availableSpace: "very_limited",
      }),
    });
    expect(checkExerciseEligibility(HANGING_LEG_RAISE, unsafeFloor).eligible).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// 10-11. Profile selection
// -----------------------------------------------------------------------------

describe("hanging_leg_raise — profile selection", () => {
  test("10. the entry uses core_robustness_straight_sets_v0_1 on core / straight_sets_repetitions / robustness", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    expect(entry.moduleId).toBe("core");
    expect(entry.role).toBe("robustness");
    expect(entry.explicitMethodId).toBe("straight_sets_repetitions");
    expect(entry.numericalProfileId).toBe(PROFILE_ID);
    expect(entry.capabilities.supportedVolumeStructures).toEqual(["sets_reps"]);

    // Shared with the two other Core repetition entries: no third profile
    // was created for a third exercise.
    expect(EXERCISE_PRESCRIPTION_REGISTRY.ab_wheel.numericalProfileId).toBe(PROFILE_ID);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.dead_bug.numericalProfileId).toBe(PROFILE_ID);
    expect(
      NUMERICAL_PRESCRIPTION_PROFILES.filter(
        (profile) => profile.moduleId === "core" && profile.methodId === "straight_sets_repetitions",
      ),
    ).toHaveLength(1);
  });

  test("11. selection resolves explicitly, and the triple is unique so implicit resolution agrees", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    const explicit = resolveNumericalProfile({
      moduleId: entry.moduleId,
      methodId: entry.explicitMethodId,
      exerciseRole: entry.role,
      explicitProfileId: entry.numericalProfileId ?? null,
    });
    if (!explicit.ok) {
      throw new Error(`Expected explicit selection to succeed: ${explicit.message}`);
    }
    expect(explicit.profile.profileId).toBe(PROFILE_ID);
    expect(explicit.resolutionSource).toBe("explicit_profile_id");

    const implicit = resolveNumericalProfile({
      moduleId: entry.moduleId,
      methodId: entry.explicitMethodId,
      exerciseRole: entry.role,
    });
    expect(implicit.ok && implicit.profile.profileId).toBe(PROFILE_ID);
  });
});

// -----------------------------------------------------------------------------
// 12-20. Volume, laterality, no multiplication
// -----------------------------------------------------------------------------

describe("hanging_leg_raise — volume, laterality and interpretation", () => {
  const EXPECTED = {
    reduced: { sets: 3, reps: 5, rest: 60 },
    normal: { sets: 3, reps: 10, rest: 60 },
    high: { sets: 5, reps: 12, rest: 120 },
  } as const;

  for (const rangeContext of ["reduced", "normal", "high"] as const) {
    test(`${rangeContext === "reduced" ? "12" : rangeContext === "normal" ? "13" : "14"}. "${rangeContext}" resolves sets, repetitions and rest as documented`, () => {
      const result = prescribe(rangeContext);
      const expected = EXPECTED[rangeContext];

      expect(result.prescription.status).toBe("complete");
      expect(result.prescription.volume.sets).toBe(expected.sets);
      expect(result.prescription.volume.reps).toEqual({
        type: "fixed",
        value: expected.reps,
        min: null,
        max: null,
        unit: "repetitions",
      });

      const betweenSets = result.prescription.rest?.betweenSets;
      if (betweenSets?.type !== "fixed") {
        throw new Error("Expected a fixed between-sets rest target.");
      }
      expect(betweenSets.duration.value).toBe(expected.rest);
    });
  }

  test("15. the resolved structure is sets_reps, with every field the method forbids left null", () => {
    const contract = getTrainingMethodContract("straight_sets_repetitions");
    const { volume } = prescribe().prescription;

    expect(volume.structure).toBe("sets_reps");
    expect(contract.forbiddenVolumeFields).toEqual(["duration", "distance", "rounds", "work_intervals"]);
    expect(volume.duration).toBeNull();
    expect(volume.distance).toBeNull();
    expect(volume.rounds).toBeNull();
    expect(volume.workIntervals).toBeNull();
  });

  test("16. + 17. sets and repetitions come from the chapter's own \"Core Strength Development\" application", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 3, repetitions: 5, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 5, repetitions: 12, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: [SOURCE_CHAPTER],
    });

    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    // Never widens the shared envelope.
    expect(3).toBeGreaterThanOrEqual(profile.volume.sets!.min);
    expect(5).toBeLessThanOrEqual(profile.volume.sets!.max);
    expect(5).toBeGreaterThanOrEqual(profile.volume.repetitions!.range.min);
    expect(12).toBeLessThanOrEqual(profile.volume.repetitions!.range.max);

    const volumeTrace = prescribe().trace.volume;
    if (!volumeTrace.ok) {
      throw new Error("Expected volume resolution to succeed.");
    }
    expect(volumeTrace.narrowingNotes.some((note) => note.includes("sets range 2-5 narrowed to 3-5"))).toBe(true);
    expect(volumeTrace.narrowingNotes.some((note) => note.includes("repetitions range 3-15 narrowed to 5-12"))).toBe(true);

    // The four other documented programming applications are NOT blended
    // in: none of their distinctive bounds appears. Trunk Endurance would
    // reach 15 repetitions and a floor of 2 sets; Technical Practice would
    // reach 6 sets and a floor of 3 repetitions.
    const constraints = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseDoseConstraints!;
    expect(constraints.maximumDose!.repetitions).not.toBe(15);
    expect(constraints.minimumDose!.sets).not.toBe(2);
    expect(constraints.maximumDose!.sets).not.toBe(6);
    expect(constraints.minimumDose!.repetitions).not.toBe(3);
  });

  test("18. + 19. laterality is bilateral with a total-repetition interpretation, carried through to the prescription", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.capabilities.laterality).toBe("bilateral");
    expect(entry.capabilities.volumeInterpretations).toEqual(["total_repetitions"]);
    expect(entry.capabilities.volumeInterpretations).not.toContain("repetitions_per_side");

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      expect(prescribe(rangeContext).prescription.volume.laterality).toEqual({
        laterality: "bilateral",
        interpretation: "total_repetitions",
        startingSide: null,
        sideSwitchRuleId: null,
      });
    }

    // Read from the execution standard (both legs move together, no
    // per-side language anywhere), not inferred from `unilateral: false`.
    expect(HANGING_LEG_RAISE.unilateral).toBe(false);
  });

  test("20. no multiplication, and nothing converted from the lever, range or progression ladder", () => {
    const constraints = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseDoseConstraints!;

    // Knee flexion, leg length, range of motion, pause duration and the
    // six-stage progression are lever and variation choices — none became
    // a duration, distance, round or interval figure.
    for (const dimension of ["durationSeconds", "distanceMeters", "rounds", "workIntervals"] as const) {
      expect(constraints.minimumDose![dimension]).toBeNull();
      expect(constraints.maximumDose![dimension]).toBeNull();
    }

    // A bilateral total is prescribed as-is: 10 stays 10, never doubled for
    // two legs. dead_bug, per-side on the same profile, resolves the same
    // number under a different label.
    const normal = prescribe("normal").prescription.volume;
    expect(normal.reps?.value).toBe(10);
    expect(normal.reps?.value).not.toBe(20);
    expect(normal.laterality?.interpretation).toBe("total_repetitions");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.dead_bug.capabilities.volumeInterpretations).toEqual([
      "repetitions_per_side",
    ]);

    // No external load is claimed, matching "CAS does not increase external
    // load until the athlete can eliminate swing".
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].capabilities.supportedLoadingModes).toEqual(["bodyweight"]);
  });
});

// -----------------------------------------------------------------------------
// 21-24. Intensity, tempo, rest, stop conditions
// -----------------------------------------------------------------------------

describe("hanging_leg_raise — intensity, tempo, rest and stop conditions", () => {
  test("21. intensity is technical_effort — this chapter documents no RPE figure anywhere", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    expect(entry.supportedIntensityTypes).toEqual(["technical_effort"]);
    expect(entry.preferredIntensityType).toBe("technical_effort");
    expect(entry.capabilities.supportedIntensityTypes).toEqual(["technical_effort"]);
    expect(entry.exerciseIntensityConstraints).toBeNull();
    expect(entry.supportedIntensityTypes).not.toContain("rpe");
    expect(entry.capabilities.requiredAthleteReferenceTypes).toEqual([]);

    // The shared profile does document RPE — it is simply not claimed here,
    // exactly as for dead_bug and unlike ab_wheel.
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)!.intensity.map((rule) => rule.type)).toContain("rpe");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.ab_wheel.supportedIntensityTypes).toContain("rpe");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.dead_bug.supportedIntensityTypes).not.toContain("rpe");

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const metric = prescribe(rangeContext).prescription.intensity.primaryMetric;
      expect(metric.type).toBe("technical_effort");
      expect(metric.target).toEqual({ type: "category", value: "high_quality" });
      expect(metric.reference).toBeNull();
    }
  });

  test("22. tempo is the profile's controlled global intent; the documented phase durations stay in the instruction", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.supportedTempoTypes).toEqual(["global_intent"]);
    expect(entry.preferredTempoType).toBeNull();

    const tempo = prescribe().prescription.tempo;
    expect(tempo?.type).toBe("global_intent");
    expect(tempo?.globalIntent).toBe("controlled");
    expect(tempo?.eccentric).toBeNull();
    expect(tempo?.concentric).toBeNull();

    // "Ballistic Execution: Not recommended for the standard CAS variation"
    // is honoured by the controlled intent and stated in the instruction.
    const execution = entry.instructionDefinitions.find((instruction) => instruction.category === "execution");
    expect(execution?.text.toLowerCase()).toContain("ballistic execution is not part of this variation");
    expect(execution?.text.toLowerCase()).toContain("without swinging");
  });

  test("23. rest narrows to the chapter's own floor, and its 150s ceiling never widens the Core doctrine's 120s", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseRestConstraints).toEqual({
      scope: "between_sets",
      minimumSeconds: 60,
      maximumSeconds: 150,
      sourceRuleIds: [SOURCE_CHAPTER],
    });

    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.rest?.seconds).toEqual({ min: 45, normal: 60, max: 120 });

    // Documented 60-150s intersected with 45-120s gives 60-120s: the floor
    // rises to 60, the ceiling stays at 120 — the mirror image of dead_bug,
    // whose documented floor sat below the doctrine's.
    expect(prescribe("reduced").prescription.rest?.betweenSets).toMatchObject({
      type: "fixed",
      duration: { value: 60 },
    });
    expect(prescribe("high").prescription.rest?.betweenSets).toMatchObject({
      type: "fixed",
      duration: { value: 120 },
    });

    const restTrace = prescribe().trace.rest;
    expect(restTrace.ok && restTrace.narrowingNotes.some((note) => note.includes("45-120s narrowed to 60-120s"))).toBe(
      true,
    );
  });

  test("24. six stop conditions, including grip failure through the EXISTING factory — none was invented", () => {
    const EXPECTED_CATEGORIES = [
      "technical_failure",
      "range_of_motion_loss",
      "equipment_failure",
      "fatigue_limit",
      "pain",
      "completion",
    ];
    const definitions = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].stopConditionDefinitions;

    expect(definitions.map((definition) => definition.category)).toEqual(EXPECTED_CATEGORIES);
    for (const definition of definitions) {
      expect(definition.instructions[0]?.text.length).toBeGreaterThan(0);
      expect(definition.sourceRuleIds.length).toBeGreaterThan(0);
    }

    const contract = getTrainingMethodContract("straight_sets_repetitions");
    for (const required of contract.requiredStopConditionCategories) {
      expect(EXPECTED_CATEGORIES).toContain(required);
    }

    const stopConditions = prescribe().prescription.stopConditions;
    expect(stopConditions).toHaveLength(6);
    expect(stopConditions.map((condition) => condition.category).sort()).toEqual([...EXPECTED_CATEGORIES].sort());

    // The grip condition reuses `equipmentFailureCondition`, whose own
    // contract already names grip and whose set scope is a real boundary
    // for this method. pinch_carry uses the same factory for the same
    // grip-loss meaning.
    const gripCondition = stopConditions.find((condition) => condition.category === "equipment_failure");
    expect(gripCondition?.scope).toBe("set");
    expect(gripCondition?.action).toBe("end_set");
    expect(gripCondition?.trigger.type).toBe("equipment_control_loss");
    expect(
      EXERCISE_PRESCRIPTION_REGISTRY.pinch_carry.stopConditionDefinitions.map((definition) => definition.category),
    ).toContain("equipment_failure");

    const textFor = (category: string) =>
      definitions.find((definition) => definition.category === category)?.instructions[0]?.text.toLowerCase() ?? "";
    expect(textFor("technical_failure")).toContain("swinging");
    expect(textFor("technical_failure")).toContain("pelvis no longer rotates posteriorly");
    expect(textFor("technical_failure")).toContain("eccentric phase cannot be controlled");
    expect(textFor("range_of_motion_loss")).toContain("horizontal");
    expect(textFor("equipment_failure")).toContain("grip security");
    expect(textFor("fatigue_limit")).toContain("increasing swing");
    expect(textFor("pain")).toContain("shoulder, elbow, wrist, lumbar spine or hip");
    expect(textFor("completion")).toContain("no swing");

    // fatigue_limit IS declared here (Fatigue Sensitivity: High) where
    // dead_bug rated every fatigue axis at its lowest and omitted it.
    expect(
      EXERCISE_PRESCRIPTION_REGISTRY.dead_bug.stopConditionDefinitions.map((definition) => definition.category),
    ).not.toContain("fatigue_limit");
    // balance_loss stays absent: nothing in a hang describes losing balance.
    expect(definitions.map((definition) => definition.category)).not.toContain("balance_loss");
  });
});

// -----------------------------------------------------------------------------
// 25-28. End to end
// -----------------------------------------------------------------------------

describe("hanging_leg_raise — end-to-end prescription", () => {
  test("25. prescribeExercise produces a complete prescription", () => {
    const result = prescribe();

    expect(result.prescription.status).toBe("complete");
    expect(result.prescription.exerciseId).toBe(EXERCISE_ID);
    expect(result.prescription.moduleId).toBe("core");
    expect(result.prescription.role).toBe("robustness");
    expect(result.prescription.methodId).toBe("straight_sets_repetitions");
    expect(result.prescription.instructions.length).toBeGreaterThan(0);
    expect(result.prescription.sourceRuleIds).toContain(SOURCE_CHAPTER);
    expect(result.trace.validation.valid).toBe(true);
  });

  test("26. prescribeSession prescribes all three Core repetition entries side by side", () => {
    const sources = {
      hanging_leg_raise: getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT),
      ab_wheel: getExercisePrescriptionSource("ab_wheel", {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: ["ab_wheel"],
      }),
      dead_bug: getExercisePrescriptionSource("dead_bug", {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: [],
      }),
    };

    if (!sources.hanging_leg_raise.ok || !sources.ab_wheel.ok || !sources.dead_bug.ok) {
      throw new Error("Fixture setup failed: one of the sources did not resolve.");
    }

    const exercises: SessionExercisePrescriptionInput[] = [
      { exerciseId: EXERCISE_ID, moduleId: sources.hanging_leg_raise.moduleId, ...sources.hanging_leg_raise.source, order: 1, required: true, blockId: "core" },
      { exerciseId: "ab_wheel", moduleId: sources.ab_wheel.moduleId, ...sources.ab_wheel.source, order: 2, required: true, blockId: "core" },
      { exerciseId: "dead_bug", moduleId: sources.dead_bug.moduleId, ...sources.dead_bug.source, order: 3, required: true, blockId: "core" },
    ];

    const result = prescribeSession({
      sessionId: "core-session-3",
      sessionName: "Core Repetition Block",
      modules: ["core"],
      exercises,
    });

    if (!result.ok) {
      throw new Error(`Expected the session to prescribe: ${result.issues.map((issue) => issue.message).join(" | ")}`);
    }

    expect(result.session.exercises).toHaveLength(3);
    // One shared profile, three different documented narrowings.
    const [hlr, abw, db] = result.session.exercises.map((exercise) => exercise.prescription);
    expect(hlr?.volume.reps?.value).toBe(10);
    expect(abw?.volume.reps?.value).toBe(10);
    expect(db?.volume.reps?.value).toBe(10);
    expect(hlr?.rest?.betweenSets).toMatchObject({ duration: { value: 60 } });
    expect(hlr?.volume.laterality?.interpretation).toBe("total_repetitions");
    expect(db?.volume.laterality?.interpretation).toBe("repetitions_per_side");
  });

  test("27. runEngine prescribes hanging_leg_raise end to end from the real ExerciseDefinition", () => {
    const bearCrawl = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === "bear_crawl")!;

    const input = makeValidInput({
      request: makeRequest({
        primaryObjective: { adaptationDomain: "movement" },
        requiredModules: ["core"],
      }),
      environment: makeEnvironment({
        availableEquipment: [{ type: "pull_up_bar" }],
        floorSafe: true,
        availableSpace: "large",
      }),
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "advanced" },
        goals: [{ id: "goal-1", name: "Trunk Control", adaptationDomain: "movement", priority: "primary" }],
      }),
    });

    const exercises = [
      makeExercise({ ...bearCrawl, setupTimeMinutes: 1 }),
      makeExercise({ ...HANGING_LEG_RAISE, setupTimeMinutes: 1 }),
    ];

    const hangingSource = getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT);
    const bearCrawlSource = getExercisePrescriptionSource("bear_crawl", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: [],
    });
    if (!hangingSource.ok || !bearCrawlSource.ok) {
      throw new Error("Fixture setup failed: one of the sources did not resolve.");
    }

    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([
      [EXERCISE_ID, hangingSource.source],
      ["bear_crawl", bearCrawlSource.source],
    ]);
    const result = runEngine(input, exercises, prescriptionSources);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }
    if (result.prescription?.status !== "prescribed") {
      throw new Error(`Expected prescription status "prescribed", got: ${JSON.stringify(result.prescription)}`);
    }

    const prescribed = result.prescription.session.exercises
      .map((exercise) => exercise.prescription)
      .find((prescription) => prescription.exerciseId === EXERCISE_ID);
    if (prescribed === undefined) {
      throw new Error("Expected hanging_leg_raise to be prescribed in the session.");
    }
    expect(prescribed.moduleId).toBe("core");
    expect(prescribed.volume.structure).toBe("sets_reps");
    expect(prescribed.volume.sets).toBe(3);
    expect(prescribed.volume.reps?.value).toBe(10);
    expect(prescribed.intensity.primaryMetric.type).toBe("technical_effort");
  });

  test("28. the decision trace names the profile, the narrowings and the interpretation", () => {
    const entries = adaptExercisePrescriptionResult(prescribe(), {
      idPrefix: "hlr_test",
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    const volumeEntry = entries.find((entry) => entry.id.endsWith("_volume"));
    expect(volumeEntry?.reasons[0]).toBe(`profile=${PROFILE_ID} (selection=explicit_profile_id)`);

    const summary = volumeEntry?.reasons.find((reason) => reason.startsWith("structure=")) ?? "";
    expect(summary).toContain("sets=3");
    expect(summary).toContain("reps=10");
    expect(summary).toContain("laterality=bilateral (total_repetitions)");

    expect(volumeEntry?.reasons.some((reason) => reason.includes("sets range 2-5 narrowed to 3-5"))).toBe(true);
    expect(volumeEntry?.reasons.some((reason) => reason.includes("repetitions range 3-15 narrowed to 5-12"))).toBe(true);

    const intensityEntry = entries.find((entry) => entry.id.endsWith("_intensity"));
    expect(intensityEntry?.decision).toContain('Intensity resolved via "technical_effort"');

    const restEntry = entries.find((entry) => entry.id.endsWith("_rest"));
    expect(restEntry?.reasons.some((reason) => reason.includes("45-120s narrowed to 60-120s"))).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// 29-36. Determinism, non-mutation, validation, non-regression, sourcing
// -----------------------------------------------------------------------------

describe("hanging_leg_raise — determinism, non-mutation and non-regression", () => {
  test("29. determinism: identical input yields identical source and identical prescription", () => {
    expect(getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT)).toEqual(
      getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT),
    );

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      expect(prescribe(rangeContext).prescription).toEqual(prescribe(rangeContext).prescription);
    }
  });

  test("30. non-mutation: neither the context nor the registry is modified by resolution", () => {
    const context: PrescriptionExecutionContext = { ...VALID_CONTEXT };
    const contextSnapshot = JSON.parse(JSON.stringify(context));
    const registrySnapshot = JSON.parse(JSON.stringify(EXERCISE_PRESCRIPTION_REGISTRY));

    prescribe();
    getExercisePrescriptionSource(EXERCISE_ID, context);

    expect(context).toEqual(contextSnapshot);
    expect(EXERCISE_PRESCRIPTION_REGISTRY).toEqual(registrySnapshot);
  });

  test("31. validatePilotRegistry reports no issue beyond the expected unresolved duration profiles", () => {
    const issues = validatePilotRegistry();
    expect(issues).toEqual([]);
  });

  test("32. no regression on the 63 previous entries: each still prescribes with its own declared equipment", () => {
    const REFERENCE = {
      referenceType: "one_rep_max" as const,
      value: 100,
      unit: "kilograms",
      sourceId: "test-1rm",
      measuredAt: null,
      validUntil: null,
      confidence: "validated" as const,
    };

    // The 63 entries that predate this lot: everything except this lot's own
    // entry and the ids added by later lots, each covered by its own file.
    const ADDED_BY_THIS_OR_LATER_LOTS: readonly string[] = [EXERCISE_ID, "plate_pinch", "heavy_bag_power_intervals", "battle_ropes", "assault_bike_intervals", "towel_pull_up", "rope_climb", "rope_pull", "pummeling", "wall_wrestling", "grip_fighting", "sled_push", "push_up", "split_squat", "single_leg_hip_thrust", "goblet_squat", "dumbbell_bench_press", "one_arm_dumbbell_row", "dumbbell_romanian_deadlift"];
    const previousIds = PILOT_EXERCISE_IDS.filter((id) => !ADDED_BY_THIS_OR_LATER_LOTS.includes(id));
    expect(previousIds).toHaveLength(63);

    for (const id of previousIds) {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id as PilotExerciseId];

      const sourceResult = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [REFERENCE],
        availableEquipmentCapabilities: entry.capabilities.requiredEquipmentCapabilities,
      });
      if (!sourceResult.ok) {
        throw new Error(`Previous entry "${id}" no longer builds a source: ${sourceResult.message}`);
      }

      const result = prescribeExercise({ exerciseId: id, moduleId: sourceResult.moduleId, ...sourceResult.source });
      if (!result.ok) {
        throw new Error(`Previous entry "${id}" no longer prescribes (${result.failureStage}): ${result.message}`);
      }
      expect(result.prescription.status).toBe("complete");
    }
  });

  test("33. the two other Core repetition entries are untouched by this lot", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.ab_wheel.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 2, repetitions: 3, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 5, repetitions: 12, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/62_CORE/10_AB_WHEEL.md"],
    });
    expect(EXERCISE_PRESCRIPTION_REGISTRY.ab_wheel.exerciseRestConstraints).toBeNull();
    expect(EXERCISE_PRESCRIPTION_REGISTRY.dead_bug.exerciseRestConstraints).toEqual({
      scope: "between_sets",
      minimumSeconds: 20,
      maximumSeconds: 60,
      sourceRuleIds: ["50-exercises/62_CORE/12_DEAD_BUG.md"],
    });
    expect(EXERCISE_PRESCRIPTION_REGISTRY.dead_bug.capabilities.laterality).toBe("alternating");
  });

  test("34. the duration estimation profile exists, is unresolved, and derives nothing from the documented tempo", () => {
    const result = getDurationEstimationProfile(`duration_profile_${EXERCISE_ID}`);
    if (!result.ok) {
      throw new Error("Expected the hanging_leg_raise duration profile to be unresolved.");
    }
    expect(result.profile?.exerciseId).toBe(EXERCISE_ID);
    expect(result.profile?.volumeStructure).toBe("sets_reps");
    expect(result.profile?.sourceRuleIds).toContain(SOURCE_CHAPTER);
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].capabilities.durationEstimationProfileId).toBe(
      `duration_profile_${EXERCISE_ID}`,
    );

    // In particular, the documented 10-30s setup and the 1-2s/2-4s phase
    // durations are NOT turned into timing data.
  });

  test("35. + 36. no resolver branches on this exercise, and every source rule is real and conforming", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    expect(entry.sourceRuleIds).toEqual([
      SOURCE_CHAPTER,
      "31_TRAINING_METHOD_CATALOGUE_V0_1",
      "32_MODULE_PRESCRIPTION_PROFILES_V0_1",
      "34_NUMERICAL_PRESCRIPTION_TABLES_V0_1",
    ]);
    expect(entry.capabilities.sourceRuleIds).toEqual([SOURCE_CHAPTER, "33_EXERCISE_PRESCRIPTION_CAPABILITIES_V0_1"]);
    expect(entry.exerciseDoseConstraints?.sourceRuleIds).toEqual([SOURCE_CHAPTER]);
    expect(entry.exerciseRestConstraints?.sourceRuleIds).toEqual([SOURCE_CHAPTER]);
    for (const instruction of entry.instructionDefinitions) {
      expect(instruction.sourceRuleId).toBe(SOURCE_CHAPTER);
    }

    // No numerical resolver mentions this exercise id anywhere.
    for (const resolver of [
      "resolveVolume.ts",
      "resolveIntensity.ts",
      "resolveRest.ts",
      "resolveTempo.ts",
      "resolveStopConditions.ts",
      "prescribeExercise.ts",
      "prescribeSession.ts",
    ]) {
      const source = readFileSync(new URL(`../../prescription/${resolver}`, import.meta.url), "utf-8");
      expect(source).not.toContain(EXERCISE_ID);
    }
  });
});
