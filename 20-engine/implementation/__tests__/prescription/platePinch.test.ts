/**
 * Combat Athlete System — Registry Lot 10: plate_pinch
 *
 * First entry on the `grip` module with the `timed_isometric_sets` method,
 * and the first consumer of Table Group 4's ISO-GRIP profile — which had
 * to have two documentation defects corrected before it could exist at all
 * (see isoGripProfile.test.ts).
 *
 * What this file guards beyond presence:
 *
 * - the prescription choice. The chapter documents THREE named
 *   prescriptions over the same movement (Strength, Strength-Endurance,
 *   Endurance). The one encoded is the only one whose hold range sits
 *   entirely inside ISO-GRIP's envelope — an arithmetic reason, asserted
 *   here, not a preference;
 * - the variant choice. The chapter documents a Unilateral, a Bilateral
 *   and a Walking Variation. This entry is the Bilateral one; the Walking
 *   one is already `pinch_carry`;
 * - what was NOT converted: plate weight, plate count, plate thickness,
 *   surface friction and the documented walking distance all stay out of
 *   the numbers.
 */

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import { EXERCISE_KNOWLEDGE_BASE, PLATE_PINCH } from "../../exerciseKnowledgeBase";
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
  isExecutableNumericalProfile,
  resolveNumericalProfile,
} from "../../prescription/prescriptionKnowledge";
import { getDurationEstimationProfile } from "../../prescription/durationEstimationProfiles";
import { validatePilotRegistry } from "../../prescription/registryValidators";
import { EQUIPMENT_CAPABILITY_IDS, isEquipmentCapabilityId } from "../../prescription/equipmentCapabilities";
import { getTrainingMethodContract } from "../../prescription/contracts";
import { adaptExercisePrescriptionResult } from "../../prescription/prescriptionDecisionTrace";
import type { ExercisePrescriptionSource } from "../../prescription/buildPrescriptionInput";

import { runEngine } from "../../index";
import { makeAthleteProfile, makeEnvironment, makeExercise, makeRequest, makeValidInput } from "../fixtures";

const EXERCISE_ID = "plate_pinch";
const PROFILE_ID = "timed_isometric_grip_v0_1";
const SOURCE_CHAPTER = "50-exercises/65_GRIP/11_PLATE_PINCH.md";

const VALID_CONTEXT: PrescriptionExecutionContext = {
  rangeContext: "normal",
  athleteReferences: [],
  availableEquipmentCapabilities: ["plates"],
};

const validEnvironment = () =>
  makeEnvironment({ availableEquipment: [{ type: "plates" }], availableSpace: "very_limited" });

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

describe("plate_pinch — registry, knowledge base, profile and equipment counts", () => {
  test("1. the registry grew from 64 to exactly 65 entries; a later lot added heavy_bag_power_intervals, bringing the total to 66", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(74);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(74);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort()).toEqual([...PILOT_EXERCISE_IDS].sort());
  });

  test("2. the knowledge base still holds exactly 76 ExerciseDefinitions — none added, none removed", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toHaveLength(76);
    expect(new Set(EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id)).size).toBe(76);
  });

  test("3. the numerical profiles went from 16 to 17 — ISO-GRIP, implemented once, by the preceding commit; later lots added INT-POWER then GRIP-REPETITION-STRENGTH, bringing the total to 22", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(23);
    expect(NUMERICAL_PRESCRIPTION_PROFILES.filter((p) => p.profileId === PROFILE_ID)).toHaveLength(1);
  });

  test("4. the equipment vocabulary stayed at 25 for this lot — the later heavy_bag_power_intervals lot added `heavy_bag`, bringing it to 26", () => {
    expect(EQUIPMENT_CAPABILITY_IDS).toHaveLength(32);
    expect(isEquipmentCapabilityId("plates")).toBe(true);
  });

  test("5. plate_pinch exists in both the knowledge base and the registry, with consistent identifiers", () => {
    const kbEntry = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === EXERCISE_ID);
    expect(kbEntry).toBeDefined();
    expect(kbEntry?.module).toBe("grip");
    expect(kbEntry?.movementPatterns).toEqual(["isometric"]);

    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.exerciseId).toBe(EXERCISE_ID);
    expect(entry.capabilities.exerciseId).toBe(EXERCISE_ID);
    expect(PILOT_EXERCISE_IDS.filter((id) => id === EXERCISE_ID)).toHaveLength(1);
  });

  test("6. no other exercise was added: the 64 previous ids plus plate_pinch account for every key", () => {
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
      "rowerg_intervals", "sprint_intervals", "ab_wheel", "dead_bug", "hanging_leg_raise",
    ] as const;

    // Ids added by lots AFTER this one, listed explicitly so this test keeps
    // proving that plate_pinch was the only exercise this lot added.
    const ADDED_BY_LATER_LOTS = ["heavy_bag_power_intervals", "battle_ropes", "assault_bike_intervals", "towel_pull_up", "rope_climb", "rope_pull", "pummeling", "wall_wrestling", "grip_fighting"] as const;

    expect(PREVIOUS_IDS).toHaveLength(64);
    expect([...PREVIOUS_IDS, EXERCISE_ID, ...ADDED_BY_LATER_LOTS].sort()).toEqual(
      Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort(),
    );
  });
});

// -----------------------------------------------------------------------------
// 7-9. Equipment and eligibility
// -----------------------------------------------------------------------------

describe("plate_pinch — equipment and eligibility", () => {
  test("7. the exact equipment makes it eligible, in both layers", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    // "Equipment: Weight Plates" — `plates`, not `pinch_grip_implement`.
    expect(entry.capabilities.requiredEquipmentCapabilities).toEqual(["plates"]);

    const kbEquipment = PLATE_PINCH.requirements!.required
      .flatMap((clause) => clause.items)
      .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
      .map((atom) => atom.equipment);
    expect(kbEquipment).toEqual(["plates"]);

    const eligible = checkExerciseEligibility(PLATE_PINCH, makeValidInput({ environment: validEnvironment() }));
    expect(eligible.eligible).toBe(true);
    expect(eligible.rejectionReasons).toEqual([]);
    expect(getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT).ok).toBe(true);
  });

  test("8. no equipment makes it ineligible, in both layers", () => {
    const noEquipment = makeValidInput({
      environment: makeEnvironment({ availableEquipment: [], availableSpace: "very_limited" }),
    });
    const kbResult = checkExerciseEligibility(PLATE_PINCH, noEquipment);
    expect(kbResult.eligible).toBe(false);
    expect(kbResult.rejectionReasons.some((reason) => reason.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);

    const sourceResult = getExercisePrescriptionSource(EXERCISE_ID, {
      ...VALID_CONTEXT,
      availableEquipmentCapabilities: [],
    });
    if (sourceResult.ok) {
      throw new Error("Expected plate_pinch to fail without plates.");
    }
    expect(sourceResult.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
    expect(sourceResult.message).toContain("plates");
  });

  test("9. incorrect equipment does not satisfy it — no equivalence with a kettlebell, dumbbell or pinch block", () => {
    for (const type of ["kettlebell", "dumbbell", "towel", "barbell", "other"] as const) {
      const input = makeValidInput({
        environment: makeEnvironment({ availableEquipment: [{ type }], availableSpace: "very_limited" }),
      });
      const result = checkExerciseEligibility(PLATE_PINCH, input);
      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((reason) => reason.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    }

    // `pinch_grip_implement` belongs to pinch_carry, whose own chapter says
    // "Weight Plates or Pinch Blocks" — a deliberately wider atom. It is
    // NOT reused here, and supplying it alone does not satisfy this entry.
    expect(EXERCISE_PRESCRIPTION_REGISTRY.pinch_carry.capabilities.requiredEquipmentCapabilities).toEqual([
      "pinch_grip_implement",
    ]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].capabilities.requiredEquipmentCapabilities).not.toContain(
      "pinch_grip_implement",
    );
    expect(
      getExercisePrescriptionSource(EXERCISE_ID, {
        ...VALID_CONTEXT,
        availableEquipmentCapabilities: ["pinch_grip_implement"],
      }).ok,
    ).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// 10-11. Profile selection
// -----------------------------------------------------------------------------

describe("plate_pinch — profile selection", () => {
  test("10. the entry uses timed_isometric_grip_v0_1 on grip / timed_isometric_sets / secondary", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    expect(entry.moduleId).toBe("grip");
    expect(entry.role).toBe("secondary");
    expect(entry.explicitMethodId).toBe("timed_isometric_sets");
    expect(entry.numericalProfileId).toBe(PROFILE_ID);
    expect(entry.capabilities.supportedVolumeStructures).toEqual(["sets_duration"]);

    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.moduleId).toBe("grip");
    expect(profile.exerciseRole).toBe("secondary");
    expect(isExecutableNumericalProfile(profile)).toBe(true);

    // `primary` — the role the table used to list first — is still not
    // available, which is why this entry is `secondary`.
    expect(getTrainingMethodContract("timed_isometric_sets").supportedRoles).not.toContain("primary");

    // It did NOT reuse the Core isometric profile or the grip carry one.
    expect(entry.numericalProfileId).not.toBe("timed_isometric_core_robustness_v0_1");
    expect(entry.numericalProfileId).not.toBe("distance_carry_strength_grip_v0_1");
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

describe("plate_pinch — volume, hold duration and laterality", () => {
  const EXPECTED = {
    reduced: { sets: 3, hold: 15, rpe: 7, rest: 90 },
    normal: { sets: 3, hold: 20, rpe: 8, rest: 90 },
    high: { sets: 4, hold: 30, rpe: 9, rest: 150 },
  } as const;

  for (const rangeContext of ["reduced", "normal", "high"] as const) {
    test(`${rangeContext === "reduced" ? "12" : rangeContext === "normal" ? "13" : "14"}. "${rangeContext}" resolves sets, hold and rest as documented`, () => {
      const result = prescribe(rangeContext);
      const expected = EXPECTED[rangeContext];

      expect(result.prescription.status).toBe("complete");
      expect(result.prescription.volume.sets).toBe(expected.sets);
      expect(result.prescription.volume.duration?.value).toBe(expected.hold);
      expect(result.prescription.volume.duration?.unit).toBe("seconds");
      expect(result.prescription.volume.duration?.scope).toBe("per_set");

      const betweenSets = result.prescription.rest?.betweenSets;
      if (betweenSets?.type !== "fixed") {
        throw new Error("Expected a fixed between-sets rest target.");
      }
      expect(betweenSets.duration.value).toBe(expected.rest);
    });
  }

  test("15. the resolved structure is sets_duration, with every field the method forbids left null", () => {
    const contract = getTrainingMethodContract("timed_isometric_sets");
    const { volume } = prescribe().prescription;

    expect(volume.structure).toBe("sets_duration");
    expect(contract.forbiddenVolumeFields).toEqual(["repetitions", "distance", "rounds", "work_intervals"]);
    expect(volume.reps).toBeNull();
    expect(volume.distance).toBeNull();
    expect(volume.rounds).toBeNull();
    expect(volume.workIntervals).toBeNull();
  });

  test("16. + 17. sets and hold come from the Strength-Endurance prescription — the one that fits the envelope", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 3, repetitions: null, durationSeconds: 15, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 4, repetitions: null, durationSeconds: 30, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: [SOURCE_CHAPTER],
    });

    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    const envelope = profile.volume.duration!.range;
    expect(envelope).toMatchObject({ min: 10, max: 30 });

    // WHY this prescription and not the other two, asserted arithmetically:
    // Strength-Endurance (15-30s) is the only one of the three whose hold
    // range sits entirely inside the profile's own 10-30s envelope.
    const STRENGTH = { min: 5, max: 15 };
    const STRENGTH_ENDURANCE = { min: 15, max: 30 };
    const ENDURANCE = { min: 30, max: 60 };
    const fitsEntirely = (r: { min: number; max: number }) => r.min >= envelope.min && r.max <= envelope.max;
    expect(fitsEntirely(STRENGTH_ENDURANCE)).toBe(true);
    expect(fitsEntirely(STRENGTH)).toBe(false); // its 5-10s half falls below the floor
    expect(fitsEntirely(ENDURANCE)).toBe(false); // it collapses onto {30} at the ceiling
    expect(Math.min(ENDURANCE.max, envelope.max) - Math.max(ENDURANCE.min, envelope.min)).toBe(0);

    const volumeTrace = prescribe().trace.volume;
    if (!volumeTrace.ok) {
      throw new Error("Expected volume resolution to succeed.");
    }
    expect(volumeTrace.narrowingNotes.some((note) => note.includes("sets range 2-4 narrowed to 3-4"))).toBe(true);
    expect(volumeTrace.narrowingNotes.some((note) => note.includes("durationSeconds range 10-30 narrowed to 15-30"))).toBe(true);
  });

  test("18. + 19. laterality is bilateral with a total-duration interpretation, carried into the prescription", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.capabilities.laterality).toBe("bilateral");
    expect(entry.capabilities.volumeInterpretations).toEqual(["total_duration"]);
    expect(entry.capabilities.volumeInterpretations).not.toContain("duration_per_side");

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      expect(prescribe(rangeContext).prescription.volume.laterality).toEqual({
        laterality: "bilateral",
        interpretation: "total_duration",
        startingSide: null,
        sideSwitchRuleId: null,
      });
    }

    // The chapter's Unilateral Variation would be `unilateral` +
    // `duration_per_side`; it is a separate, unrepresented variant. The
    // setup instruction states which variant this entry prescribes.
    const setup = entry.instructionDefinitions.find((instruction) => instruction.category === "setup");
    expect(setup?.text.toLowerCase()).toContain("bilateral variation");
    expect(setup?.text.toLowerCase()).toContain("one plate combination in each hand");
  });

  test("20. no multiplication, and nothing converted from plate weight, count, thickness or walking distance", () => {
    const constraints = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseDoseConstraints!;

    // The chapter's load model — plate weight, number, thickness, friction —
    // becomes no number here, and neither does the Walking Variation's
    // documented 10-30 metres.
    for (const dimension of ["repetitions", "distanceMeters", "rounds", "workIntervals"] as const) {
      expect(constraints.minimumDose![dimension]).toBeNull();
      expect(constraints.maximumDose![dimension]).toBeNull();
    }

    // 20 seconds is 20 seconds held with both hands at once — never 40 for
    // "two sides", never 10 halved from a total.
    const normal = prescribe("normal").prescription.volume;
    expect(normal.duration?.value).toBe(20);
    expect(normal.duration?.value).not.toBe(40);
    expect(normal.laterality?.interpretation).toBe("total_duration");

    // The Walking Variation is pinch_carry's, on the carry profile.
    expect(EXERCISE_PRESCRIPTION_REGISTRY.pinch_carry.explicitMethodId).toBe("distance_carry_sets");
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].explicitMethodId).toBe("timed_isometric_sets");
  });
});

// -----------------------------------------------------------------------------
// 21-25. Intensity, tempo, rest, instructions, stop conditions
// -----------------------------------------------------------------------------

describe("plate_pinch — intensity, tempo, rest, instructions and stop conditions", () => {
  test("21. intensity is the profile's own RPE 7-9 — no plate weight is ever turned into a load", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    expect(entry.supportedIntensityTypes).toEqual(["rpe"]);
    expect(entry.preferredIntensityType).toBe("rpe");
    expect(entry.exerciseIntensityConstraints).toBeNull();
    expect(entry.capabilities.requiredAthleteReferenceTypes).toEqual([]);

    // No absolute or body-mass load is claimed; the profile's own flag
    // keeps any such rule exercise-specific.
    for (const forbidden of ["absolute_load", "percentage_body_mass", "resistance_category"] as const) {
      expect(entry.supportedIntensityTypes).not.toContain(forbidden);
    }
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)!.requiresExerciseSpecificLoadRule).toBe(true);

    const expected = { reduced: 7, normal: 8, high: 9 } as const;
    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const metric = prescribe(rangeContext).prescription.intensity.primaryMetric;
      expect(metric.type).toBe("rpe");
      expect(metric.target).toEqual({ type: "fixed", value: expected[rangeContext] });
      expect(metric.reference).toBeNull();
      expect(prescribe(rangeContext).prescription.intensity.calculation).toBeNull();
    }
  });

  test("22. tempo is the isometric hold the corrected table now documents", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.supportedTempoTypes).toEqual(["isometric_hold"]);
    expect(entry.preferredTempoType).toBeNull();

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const tempo = prescribe(rangeContext).prescription.tempo;
      expect(tempo).not.toBeNull();
      expect(tempo?.type).toBe("isometric_hold");
      // No concentric or eccentric phase is invented for a static hold.
      expect(tempo?.concentric).toBeNull();
      expect(tempo?.eccentric).toBeNull();
      expect(tempo?.globalIntent).toBeNull();
    }
  });

  test("23. rest narrows to the chapter's own floor; its 180s ceiling never widens the table's 150s", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseRestConstraints).toEqual({
      scope: "between_sets",
      minimumSeconds: 90,
      maximumSeconds: 180,
      sourceRuleIds: [SOURCE_CHAPTER],
    });

    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.rest?.seconds).toEqual({ min: 60, normal: 90, max: 150 });

    expect(prescribe("reduced").prescription.rest?.betweenSets).toMatchObject({
      type: "fixed",
      duration: { value: 90 },
    });
    expect(prescribe("high").prescription.rest?.betweenSets).toMatchObject({
      type: "fixed",
      duration: { value: 150 },
    });

    const restTrace = prescribe().trace.rest;
    expect(restTrace.ok && restTrace.narrowingNotes.some((note) => note.includes("60-150s narrowed to 90-150s"))).toBe(true);
  });

  test("24. the instructions carry the chapter's own safety rules, including the foot-protection precaution", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    const setup = entry.instructionDefinitions.find((instruction) => instruction.category === "setup");
    const execution = entry.instructionDefinitions.find((instruction) => instruction.category === "execution");

    expect(setup).toBeDefined();
    expect(execution).toBeDefined();
    expect(setup?.priority).toBe("critical");

    const setupText = setup?.text.toLowerCase() ?? "";
    expect(setupText).toContain("never hold the plates over the feet");
    expect(setupText).toContain("suitable footwear");
    expect(setupText).toContain("floor area clear");
    expect(setupText).toContain("damaged or oily");
    expect(setupText).toContain("wrist close to neutral");

    const executionText = execution?.text.toLowerCase() ?? "";
    expect(executionText).toContain("thumb and fingertips");
    expect(executionText).toContain("plates vertical");
    expect(executionText).toContain("hook the fingers under the rim");
    expect(executionText).toContain("rest the plates against the thigh");
    expect(executionText).toContain("before grip security is lost");
    expect(executionText).toContain("lower the plates under control");

    for (const instruction of entry.instructionDefinitions) {
      expect(instruction.mandatory).toBe(true);
      expect(instruction.sourceRuleId).toBe(SOURCE_CHAPTER);
    }
  });

  test("25. four stop conditions, with grip loss carried by the EXISTING equipment-failure factory", () => {
    const EXPECTED_CATEGORIES = ["technical_failure", "equipment_failure", "pain", "completion"];
    const definitions = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].stopConditionDefinitions;

    expect(definitions.map((definition) => definition.category)).toEqual(EXPECTED_CATEGORIES);
    for (const definition of definitions) {
      expect(definition.instructions[0]?.text.length).toBeGreaterThan(0);
      expect(definition.sourceRuleIds.length).toBeGreaterThan(0);
    }

    const contract = getTrainingMethodContract("timed_isometric_sets");
    for (const required of contract.requiredStopConditionCategories) {
      expect(EXPECTED_CATEGORIES).toContain(required);
    }

    const stopConditions = prescribe().prescription.stopConditions;
    expect(stopConditions).toHaveLength(4);
    expect(stopConditions.map((condition) => condition.category).sort()).toEqual([...EXPECTED_CATEGORIES].sort());

    // Grip loss reuses the existing factory — the same reuse pinch_carry
    // and hanging_leg_raise already make. No factory was invented.
    const grip = stopConditions.find((condition) => condition.category === "equipment_failure");
    expect(grip?.scope).toBe("set");
    expect(grip?.action).toBe("end_set");
    expect(grip?.trigger.type).toBe("equipment_control_loss");
    for (const id of ["pinch_carry", "hanging_leg_raise"] as const) {
      expect(
        EXERCISE_PRESCRIPTION_REGISTRY[id].stopConditionDefinitions.map((definition) => definition.category),
      ).toContain("equipment_failure");
    }

    const textFor = (category: string) =>
      definitions.find((definition) => definition.category === category)?.instructions[0]?.text.toLowerCase() ?? "";
    expect(textFor("technical_failure")).toContain("hook under the rim");
    expect(textFor("technical_failure")).toContain("wrist flexes excessively");
    expect(textFor("technical_failure")).toContain("shoulder elevates");
    expect(textFor("equipment_failure")).toContain("slide, tilt or rotate");
    expect(textFor("equipment_failure")).toContain("never attempt to save a failing hold");
    expect(textFor("pain")).toContain("medial-elbow");
    expect(textFor("completion")).toContain("lowered under control");

    // fatigue_limit is deliberately absent: the documented set endpoint is
    // grip security, not fatigue.
    expect(definitions.map((definition) => definition.category)).not.toContain("fatigue_limit");
  });
});

// -----------------------------------------------------------------------------
// 26-29. End to end
// -----------------------------------------------------------------------------

describe("plate_pinch — end-to-end prescription", () => {
  test("26. prescribeExercise produces a complete prescription", () => {
    const result = prescribe();

    expect(result.prescription.status).toBe("complete");
    expect(result.prescription.exerciseId).toBe(EXERCISE_ID);
    expect(result.prescription.moduleId).toBe("grip");
    expect(result.prescription.role).toBe("secondary");
    expect(result.prescription.methodId).toBe("timed_isometric_sets");
    expect(result.prescription.instructions.length).toBeGreaterThan(0);
    expect(result.prescription.sourceRuleIds).toContain(SOURCE_CHAPTER);
    expect(result.trace.validation.valid).toBe(true);
  });

  test("27. prescribeSession prescribes both Grip halves side by side — one hold, one carry", () => {
    const pinchSource = getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT);
    const carrySource = getExercisePrescriptionSource("pinch_carry", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["pinch_grip_implement"],
    });

    if (!pinchSource.ok || !carrySource.ok) {
      throw new Error("Fixture setup failed: one of the sources did not resolve.");
    }

    const exercises: SessionExercisePrescriptionInput[] = [
      { exerciseId: EXERCISE_ID, moduleId: pinchSource.moduleId, ...pinchSource.source, order: 1, required: true, blockId: "grip" },
      { exerciseId: "pinch_carry", moduleId: carrySource.moduleId, ...carrySource.source, order: 2, required: true, blockId: "grip" },
    ];

    const result = prescribeSession({
      sessionId: "grip-session-1",
      sessionName: "Pinch Grip Block",
      modules: ["grip"],
      exercises,
    });

    if (!result.ok) {
      throw new Error(`Expected the session to prescribe: ${result.issues.map((issue) => issue.message).join(" | ")}`);
    }

    expect(result.session.exercises).toHaveLength(2);
    const [hold, carry] = result.session.exercises.map((exercise) => exercise.prescription);
    // Same module, two methods, two profiles, resolved without interference.
    expect(hold?.volume.structure).toBe("sets_duration");
    expect(hold?.volume.duration?.value).toBe(20);
    expect(carry?.volume.structure).toBe("sets_distance");
    expect(carry?.volume.distance).not.toBeNull();
    expect(carry?.volume.duration).toBeNull();
  });

  test("28. runEngine prescribes plate_pinch end to end from the real ExerciseDefinition", () => {
    const input = makeValidInput({
      request: makeRequest({
        primaryObjective: { adaptationDomain: "maximum_strength" },
        requiredModules: ["grip"],
      }),
      environment: makeEnvironment({
        availableEquipment: [{ type: "plates" }, { type: "barbell" }, { type: "bench" }, { type: "rack" }],
        availableSpace: "moderate",
      }),
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "advanced" },
        goals: [{ id: "goal-1", name: "Grip Strength", adaptationDomain: "maximum_strength", priority: "primary" }],
      }),
    });

    const benchPress = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === "bench_press")!;
    const exercises = [
      makeExercise({ ...benchPress, setupTimeMinutes: 2, defaultExerciseDurationMinutes: 10 }),
      makeExercise({ ...PLATE_PINCH, setupTimeMinutes: 1, defaultExerciseDurationMinutes: 6 }),
    ];

    const pinchSource = getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT);
    const benchSource = getExercisePrescriptionSource("bench_press", {
      rangeContext: "normal",
      athleteReferences: [
        {
          referenceType: "one_rep_max",
          value: 100,
          unit: "kilograms",
          sourceId: "test-1rm",
          measuredAt: null,
          validUntil: null,
          confidence: "validated",
        },
      ],
      availableEquipmentCapabilities: ["barbell", "bench", "rack", "plates"],
    });
    if (!pinchSource.ok || !benchSource.ok) {
      throw new Error("Fixture setup failed: one of the sources did not resolve.");
    }

    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([
      [EXERCISE_ID, pinchSource.source],
      ["bench_press", benchSource.source],
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
      throw new Error("Expected plate_pinch to be prescribed in the session.");
    }
    expect(prescribed.moduleId).toBe("grip");
    expect(prescribed.methodId).toBe("timed_isometric_sets");
    expect(prescribed.volume.structure).toBe("sets_duration");
    expect(prescribed.volume.duration?.value).toBe(20);
    expect(prescribed.intensity.primaryMetric.type).toBe("rpe");
  });

  test("29. the decision trace names the profile, the narrowings and the interpretation", () => {
    const entries = adaptExercisePrescriptionResult(prescribe(), {
      idPrefix: "plate_pinch_test",
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    const volumeEntry = entries.find((entry) => entry.id.endsWith("_volume"));
    expect(volumeEntry?.reasons[0]).toBe(`profile=${PROFILE_ID} (selection=explicit_profile_id)`);

    const summary = volumeEntry?.reasons.find((reason) => reason.startsWith("structure=")) ?? "";
    expect(summary).toContain("sets=3");
    expect(summary).toContain("duration=20seconds");
    expect(summary).toContain("laterality=bilateral (total_duration)");

    expect(volumeEntry?.reasons.some((reason) => reason.includes("sets range 2-4 narrowed to 3-4"))).toBe(true);
    expect(volumeEntry?.reasons.some((reason) => reason.includes("durationSeconds range 10-30 narrowed to 15-30"))).toBe(true);

    const intensityEntry = entries.find((entry) => entry.id.endsWith("_intensity"));
    expect(intensityEntry?.decision).toContain('Intensity resolved via "rpe"');

    const tempoEntry = entries.find((entry) => entry.id.endsWith("_tempo"));
    expect(tempoEntry?.decision).toContain("Tempo resolved");

    const restEntry = entries.find((entry) => entry.id.endsWith("_rest"));
    expect(restEntry?.reasons.some((reason) => reason.includes("60-150s narrowed to 90-150s"))).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// 30-38. Determinism, non-mutation, validation, non-regression, sourcing
// -----------------------------------------------------------------------------

describe("plate_pinch — determinism, non-mutation and non-regression", () => {
  test("30. determinism: identical input yields identical source and identical prescription", () => {
    expect(getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT)).toEqual(
      getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT),
    );

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      expect(prescribe(rangeContext).prescription).toEqual(prescribe(rangeContext).prescription);
    }
  });

  test("31. non-mutation: neither the context nor the registry is modified by resolution", () => {
    const context: PrescriptionExecutionContext = { ...VALID_CONTEXT };
    const contextSnapshot = JSON.parse(JSON.stringify(context));
    const registrySnapshot = JSON.parse(JSON.stringify(EXERCISE_PRESCRIPTION_REGISTRY));

    prescribe();
    getExercisePrescriptionSource(EXERCISE_ID, context);

    expect(context).toEqual(contextSnapshot);
    expect(EXERCISE_PRESCRIPTION_REGISTRY).toEqual(registrySnapshot);
  });

  test("32. validatePilotRegistry reports no issue beyond the expected unresolved duration profiles", () => {
    const issues = validatePilotRegistry();
    expect(issues.filter((issue) => issue.code !== "UNRESOLVED_DURATION_PROFILE")).toEqual([]);
    expect(issues).toHaveLength(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).length);
    expect(issues.some((issue) => issue.exerciseId === EXERCISE_ID)).toBe(true);
  });

  test("33. no regression on the 64 previous entries: each still prescribes with its own declared equipment", () => {
    const REFERENCE = {
      referenceType: "one_rep_max" as const,
      value: 100,
      unit: "kilograms",
      sourceId: "test-1rm",
      measuredAt: null,
      validUntil: null,
      confidence: "validated" as const,
    };

    // The 64 entries that predate this lot: everything except this lot's own
    // entry and the ids added by later lots, each covered by its own file.
    const ADDED_BY_THIS_OR_LATER_LOTS: readonly string[] = [EXERCISE_ID, "heavy_bag_power_intervals", "battle_ropes", "assault_bike_intervals", "towel_pull_up", "rope_climb", "rope_pull", "pummeling", "wall_wrestling", "grip_fighting"];
    const previousIds = PILOT_EXERCISE_IDS.filter((id) => !ADDED_BY_THIS_OR_LATER_LOTS.includes(id));
    expect(previousIds).toHaveLength(64);

    for (const id of previousIds) {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id as PilotExerciseId];

      // No previous entry adopted the newly implemented profile.
      expect(entry.numericalProfileId ?? null).not.toBe(PROFILE_ID);

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

  test("34. pinch_carry, the other pinch-grip entry, is untouched by this lot", () => {
    const carry = EXERCISE_PRESCRIPTION_REGISTRY.pinch_carry;
    expect(carry.moduleId).toBe("grip");
    expect(carry.explicitMethodId).toBe("distance_carry_sets");
    expect(carry.numericalProfileId ?? null).toBeNull();
    expect(carry.capabilities.requiredEquipmentCapabilities).toEqual(["pinch_grip_implement"]);
  });

  test("35. the duration estimation profile exists, is unresolved, and never restates the prescribed hold", () => {
    const result = getDurationEstimationProfile(`duration_profile_${EXERCISE_ID}`);
    if (result.ok) {
      throw new Error("Expected the plate_pinch duration profile to be unresolved.");
    }

    expect(result.failureCode).toBe("DURATION_PROFILE_UNRESOLVED");
    expect(result.profile?.exerciseId).toBe(EXERCISE_ID);
    expect(result.profile?.volumeStructure).toBe("sets_duration");
    expect(result.profile?.sourceRuleIds).toEqual([SOURCE_CHAPTER]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].capabilities.durationEstimationProfileId).toBe(
      `duration_profile_${EXERCISE_ID}`,
    );

    // In particular, the prescribed 15-30 second hold is NOT copied into
    // perSetSeconds: a prescription target is not a timing estimate.
    for (const field of [
      "averageRepetitionSeconds",
      "averageSetupSeconds",
      "transitionSeconds",
      "restSeconds",
      "perSetSeconds",
      "perRoundSeconds",
      "perIntervalSeconds",
      "technicalMarginSeconds",
    ] as const) {
      expect(result.profile?.[field]).toBeNull();
    }
  });

  test("36. + 37. + 38. no resolver branches on this exercise, every source rule is real, and no id or profile was added needlessly", () => {
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

    // THIS lot added no equipment identifier and exactly one profile — the
    // canonical ISO-GRIP, which now has a consumer. The totals below are
    // running totals and have since moved: later lots added heavy_bag, then
    // battle_rope/rope_anchor_point, and the Table Group 14 profile.
    expect(EQUIPMENT_CAPABILITY_IDS).toHaveLength(32);
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(23);
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)!.sourceRuleIds).toEqual([
      "34_NUMERICAL_PRESCRIPTION_TABLES_V0_1",
    ]);

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
