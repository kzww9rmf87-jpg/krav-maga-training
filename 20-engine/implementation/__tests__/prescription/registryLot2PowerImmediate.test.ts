/**
 * Combat Athlete System — Registry Lot 2 (Power Immediate)
 *
 * hang_power_clean is the first of the 2 exercises targeted by this lot,
 * migrated per the Registry Audit's own "Lot 2 — Power immediate"
 * recommendation (Category A: reuses the existing
 * power_primary_repetition_sets_v0_1 profile with no new numerical
 * profile, exactly as push_press/hang_high_pull/jump_shrug already do).
 *
 * sled_push is deliberately NOT integrated in this lot. Its own fiche
 * documents a flat, undecomposed "4-12 pushes, 10-40 meters" total
 * volume with no separate sets/repetitions numbers. The shared
 * power_repetition_sets profile enforces sets >= 3 AND repetitions >= 2
 * simultaneously; mapping "pushes" onto either dimension alone forces an
 * unsourced decomposition or an artificially inflated minimum volume,
 * and the method's own volume structure has no distance dimension at
 * all (`distance: null`), while `distance_carry_sets` (the method that
 * does support distance) is explicitly forbidden for the "power" module
 * in `contracts.ts`. The target registry count for this lot is therefore
 * 51 (50 + 1), not 52 — this file tests the honest blocker directly
 * rather than forcing an integration.
 */

import { describe, expect, test } from "vitest";

import { EXERCISE_KNOWLEDGE_BASE } from "../../exerciseKnowledgeBase";
import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  getExercisePrescriptionSource,
  PILOT_EXERCISE_IDS,
  type PilotExerciseId,
  type PrescriptionExecutionContext,
} from "../../prescription/exercisePrescriptionRegistry";
import { prescribeExercise } from "../../prescription/prescribeExercise";
import { NUMERICAL_PRESCRIPTION_PROFILES } from "../../prescription/prescriptionKnowledge";
import { getDurationEstimationProfile } from "../../prescription/durationEstimationProfiles";
import { validatePilotRegistry } from "../../prescription/registryValidators";
import { getTrainingMethodContract } from "../../prescription/contracts";

const LOT2_EXERCISE_IDS = ["hang_power_clean"] as const;

function buildValidContextFor(id: PilotExerciseId): PrescriptionExecutionContext {
  const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
  return {
    rangeContext: "normal",
    athleteReferences: [],
    availableEquipmentCapabilities: entry.capabilities.requiredEquipmentCapabilities,
  };
}

function prescribe(
  id: PilotExerciseId,
  rangeContext: PrescriptionExecutionContext["rangeContext"] = "normal",
) {
  const context: PrescriptionExecutionContext = { ...buildValidContextFor(id), rangeContext };
  const sourceResult = getExercisePrescriptionSource(id, context);
  if (!sourceResult.ok) {
    throw new Error(`Expected "${id}" to build a prescription source, got: ${sourceResult.message}`);
  }
  const result = prescribeExercise({ exerciseId: id, moduleId: sourceResult.moduleId, ...sourceResult.source });
  if (!result.ok) {
    throw new Error(`Expected "${id}" prescription to succeed at ${result.failureStage}: ${result.message}`);
  }
  return result;
}

// -----------------------------------------------------------------------------
// 1-4. Presence, identity, classification, method contract
// -----------------------------------------------------------------------------

describe("registry Lot 2 — presence and classification", () => {
  for (const id of LOT2_EXERCISE_IDS) {
    test(`${id} is present in PILOT_EXERCISE_IDS exactly once`, () => {
      expect(PILOT_EXERCISE_IDS.filter((x) => x === id)).toHaveLength(1);
    });

    test(`${id} is present in EXERCISE_PRESCRIPTION_REGISTRY with a consistent exerciseId`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry).toBeDefined();
      expect(entry.exerciseId).toBe(id);
      expect(entry.capabilities.exerciseId).toBe(id);
    });

    test(`${id} uses moduleId "power", role "primary" and method "power_repetition_sets"`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.moduleId).toBe("power");
      expect(entry.role).toBe("primary");
      expect(entry.explicitMethodId).toBe("power_repetition_sets");
      expect(entry.capabilities.supportedMethodIds).toEqual(["power_repetition_sets"]);
      expect(entry.capabilities.supportedVolumeStructures).toEqual(["sets_reps"]);
    });

    test(`${id}: validateCompatibility (module/method/role contract) accepts this triple`, () => {
      const contract = getTrainingMethodContract("power_repetition_sets");
      expect(contract.supportedModules).toContain("power");
      expect(contract.supportedRoles).toContain("primary");
    });
  }
});

// -----------------------------------------------------------------------------
// 5. Shared numerical profile — no new profile created
// -----------------------------------------------------------------------------

describe("registry Lot 2 — shared numerical profile", () => {
  test("exactly one profile exists for (power, power_repetition_sets, primary) and it is unchanged", () => {
    const matches = NUMERICAL_PRESCRIPTION_PROFILES.filter(
      (p) => p.moduleId === "power" && p.methodId === "power_repetition_sets" && p.exerciseRole === "primary",
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].profileId).toBe("power_primary_repetition_sets_v0_1");
    expect(matches[0].volume.sets).toEqual({ min: 3, normal: 4, max: 5 });
    expect(matches[0].volume.repetitions?.range).toEqual({ min: 2, normal: 3, max: 5 });
    expect(matches[0].volume.distance).toBeNull();
    expect(matches[0].requiresExerciseSpecificLoadRule).toBe(true);
  });

  test("the total number of NumericalPrescriptionProfiles is unchanged at 12 (no new prescription profile added)", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(12);
  });

  test("the shared profile's own percentage_1rm rule can never resolve, for hang_power_clean or any other power/primary exercise — requiresExerciseSpecificLoadRule rejects every load-based type", () => {
    const profile = NUMERICAL_PRESCRIPTION_PROFILES.find((p) => p.profileId === "power_primary_repetition_sets_v0_1")!;
    expect(profile.intensity.some((rule) => rule.type === "percentage_1rm")).toBe(true);
    expect(profile.intensity.some((rule) => rule.type === "movement_intent")).toBe(true);
    // Every existing power/primary entry (push_press, hang_high_pull, jump_shrug, the
    // ballistic throws, box_jump, etc.) already resolves this the same way.
    for (const otherId of ["push_press", "hang_high_pull", "jump_shrug", "box_jump"] as const) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[otherId].supportedIntensityTypes).toEqual(["movement_intent"]);
    }
    expect(EXERCISE_PRESCRIPTION_REGISTRY.hang_power_clean.supportedIntensityTypes).toEqual(["movement_intent"]);
  });
});

// -----------------------------------------------------------------------------
// 6-7. resolveMethod / resolveVolume — no NUMERICAL_PROFILE_MISSING
// -----------------------------------------------------------------------------

describe("registry Lot 2 — method/volume resolution", () => {
  for (const id of LOT2_EXERCISE_IDS) {
    test(`${id}: getExercisePrescriptionSource succeeds with its required equipment available`, () => {
      const result = getExercisePrescriptionSource(id, buildValidContextFor(id));
      expect(result.ok).toBe(true);
    });

    test(`${id}: full prescription resolves without NUMERICAL_PROFILE_MISSING`, () => {
      const result = prescribe(id);
      expect(result.prescription.status).toBe("complete");
      expect(result.trace.volume.ok).toBe(true);
      if (result.trace.volume.ok) {
        expect(result.trace.volume.profileId).toBe("power_primary_repetition_sets_v0_1");
      }
    });

    test(`${id}: fails with REQUIRED_EQUIPMENT_MISSING when no equipment is available`, () => {
      const result = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: [],
      });
      if (result.ok) {
        throw new Error(`Expected "${id}" to fail without its required equipment.`);
      }
      expect(result.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
    });
  }

  test("hang_power_clean requires exactly barbell + plates — no duplication of the knowledge base's own requirements", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.hang_power_clean.capabilities.requiredEquipmentCapabilities).toEqual([
      "barbell",
      "plates",
    ]);
    // hang_high_pull (an existing power/primary sibling) requires the exact same pair.
    expect(EXERCISE_PRESCRIPTION_REGISTRY.hang_high_pull.capabilities.requiredEquipmentCapabilities).toEqual([
      "barbell",
      "plates",
    ]);
  });
});

// -----------------------------------------------------------------------------
// 8. Intensity — honest resolution
// -----------------------------------------------------------------------------

describe("registry Lot 2 — intensity", () => {
  test("hang_power_clean uses movement_intent only — no percentage_1rm, RPE or RIR is claimed despite the fiche naming a %1RM reference range", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY.hang_power_clean;
    expect(entry.supportedIntensityTypes).toEqual(["movement_intent"]);
    expect(entry.preferredIntensityType).toBe("movement_intent");
    expect(entry.exerciseIntensityConstraints).toBeNull();
  });

  test("hang_power_clean's prescribed intensity resolves to the maximal_acceleration category, never a numeric load", () => {
    const result = prescribe("hang_power_clean");
    expect(result.prescription.intensity.primaryMetric.type).toBe("movement_intent");
    expect(result.prescription.intensity.primaryMetric.target).toEqual({
      type: "category",
      value: "maximal_acceleration",
    });
    expect(result.prescription.intensity.calculation).toBeNull();
  });
});

// -----------------------------------------------------------------------------
// 9. Tempo — explosive intent
// -----------------------------------------------------------------------------

describe("registry Lot 2 — tempo", () => {
  test("hang_power_clean supports global_intent tempo, matching hang_high_pull/jump_shrug/push_press", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY.hang_power_clean;
    expect(entry.supportedTempoTypes).toEqual(["global_intent"]);
    expect(entry.preferredTempoType).toBeNull();
    expect(EXERCISE_PRESCRIPTION_REGISTRY.hang_high_pull.supportedTempoTypes).toEqual(["global_intent"]);
  });

  test("hang_power_clean's prescription resolves an explosive/maximal_acceleration tempo target", () => {
    const result = prescribe("hang_power_clean");
    expect(result.prescription.tempo).not.toBeNull();
  });
});

// -----------------------------------------------------------------------------
// 10. Rest — full recovery between sets, no artificial narrowing
// -----------------------------------------------------------------------------

describe("registry Lot 2 — rest", () => {
  test("hang_power_clean declares no exerciseRestConstraints — uses the shared profile's own between_sets 120-180-300s window as-is", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.hang_power_clean.exerciseRestConstraints).toBeNull();
  });

  test("hang_power_clean's prescription resolves a between_sets rest", () => {
    const result = prescribe("hang_power_clean");
    expect(result.prescription.rest?.betweenSets).toBeDefined();
  });
});

// -----------------------------------------------------------------------------
// 11-12. Instructions and stop conditions
// -----------------------------------------------------------------------------

describe("registry Lot 2 — instructions and stop conditions", () => {
  test("hang_power_clean declares setup and execution instructions, both mandatory and non-empty", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY.hang_power_clean;
    const categories = entry.instructionDefinitions.map((i) => i.category);
    expect(categories).toEqual(expect.arrayContaining(["setup", "execution"]));
    for (const instruction of entry.instructionDefinitions) {
      expect(instruction.text.length).toBeGreaterThan(0);
      expect(instruction.mandatory).toBe(true);
      expect(instruction.sourceRuleId.length).toBeGreaterThan(0);
    }
  });

  test("hang_power_clean declares exactly 7 stop-condition categories: technical_failure, velocity_loss, fatigue_limit, impact_limit, balance_loss, pain, completion — matching hang_high_pull/jump_shrug/push_press's own density", () => {
    const categories = EXERCISE_PRESCRIPTION_REGISTRY.hang_power_clean.stopConditionDefinitions.map((d) => d.category);
    expect(categories).toEqual([
      "technical_failure",
      "velocity_loss",
      "fatigue_limit",
      "impact_limit",
      "balance_loss",
      "pain",
      "completion",
    ]);
    expect(new Set(categories).size).toBe(categories.length);
  });

  test("hang_power_clean's technical_failure covers turnover timing, extension completeness and catch position — distinct from a simple pull", () => {
    const condition = EXERCISE_PRESCRIPTION_REGISTRY.hang_power_clean.stopConditionDefinitions.find(
      (d) => d.category === "technical_failure",
    );
    const text = condition?.instructions[0]?.text.toLowerCase() ?? "";
    expect(text).toContain("turnover");
    expect(text).toContain("extension is incomplete");
    expect(text).toContain("catch position");
  });

  test("hang_power_clean's impact_limit and balance_loss cover the catch phase specifically — categories hang_high_pull's own text does not use for a catch", () => {
    const impact = EXERCISE_PRESCRIPTION_REGISTRY.hang_power_clean.stopConditionDefinitions.find((d) => d.category === "impact_limit");
    const balance = EXERCISE_PRESCRIPTION_REGISTRY.hang_power_clean.stopConditionDefinitions.find((d) => d.category === "balance_loss");
    expect(impact?.instructions[0]?.text.toLowerCase()).toContain("catch");
    expect(balance?.instructions[0]?.text.toLowerCase()).toContain("catch");
  });

  test("hang_power_clean's prescription resolves all 7 required stop-condition categories", () => {
    const result = prescribe("hang_power_clean");
    const categories = result.prescription.stopConditions.map((c) => c.category);
    expect(categories).toEqual(
      expect.arrayContaining([
        "technical_failure",
        "velocity_loss",
        "fatigue_limit",
        "impact_limit",
        "balance_loss",
        "pain",
        "completion",
      ]),
    );
    expect(categories).toHaveLength(7);
  });

  test("no instruction re-encodes the knowledge base's own barbell + plates eligibility requirement as a separate registry-level gate", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.hang_power_clean.capabilities.requiredEquipmentCapabilities).toEqual([
      "barbell",
      "plates",
    ]);
  });
});

// -----------------------------------------------------------------------------
// 13. Volume / dose constraints — narrowing never widens the shared profile
// -----------------------------------------------------------------------------

describe("registry Lot 2 — dose constraints", () => {
  test("hang_power_clean narrows repetitions to the profile's own floor (2) through 3 — every one of its four documented programming applications caps at 2-3 repetitions", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.hang_power_clean.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 3, repetitions: 2, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 5, repetitions: 3, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/64_POWER/12_HANG_POWER_CLEAN.md"],
    });
  });

  test("the constraint never widens the shared profile's own bounds", () => {
    const profile = NUMERICAL_PRESCRIPTION_PROFILES.find((p) => p.profileId === "power_primary_repetition_sets_v0_1")!;
    const constraint = EXERCISE_PRESCRIPTION_REGISTRY.hang_power_clean.exerciseDoseConstraints!;
    expect(constraint.minimumDose!.sets!).toBeGreaterThanOrEqual(profile.volume.sets!.min);
    expect(constraint.maximumDose!.sets!).toBeLessThanOrEqual(profile.volume.sets!.max);
    expect(constraint.minimumDose!.repetitions!).toBeGreaterThanOrEqual(profile.volume.repetitions!.range.min);
    expect(constraint.maximumDose!.repetitions!).toBeLessThanOrEqual(profile.volume.repetitions!.range.max);
  });

  test("all narrowed bounds are positive integers, and minimum never exceeds maximum", () => {
    const constraint = EXERCISE_PRESCRIPTION_REGISTRY.hang_power_clean.exerciseDoseConstraints!;
    const min = constraint.minimumDose!;
    const max = constraint.maximumDose!;
    expect(Number.isInteger(min.sets)).toBe(true);
    expect(Number.isInteger(min.repetitions)).toBe(true);
    expect(Number.isInteger(max.sets)).toBe(true);
    expect(Number.isInteger(max.repetitions)).toBe(true);
    expect(min.sets!).toBeGreaterThan(0);
    expect(min.repetitions!).toBeGreaterThan(0);
    expect(min.sets!).toBeLessThanOrEqual(max.sets!);
    expect(min.repetitions!).toBeLessThanOrEqual(max.repetitions!);
  });

  test("the narrowingNotes produced at resolution time describe the actual repetitions rectangle shrink, and never claim a sets narrowing that did not occur", () => {
    const result = prescribe("hang_power_clean");
    const notes = result.trace.volume.ok ? result.trace.volume.narrowingNotes : [];
    expect(notes.some((n) => n.includes("repetitions range 2-5 narrowed to 2-3"))).toBe(true);
    expect(notes.some((n) => n.startsWith("sets range"))).toBe(false);
  });

  test("hang_power_clean reduced/normal/high: sets 3/4/5, repetitions always 2 or 3", () => {
    const reduced = prescribe("hang_power_clean", "reduced");
    expect(reduced.prescription.volume.sets).toBe(3);
    expect(reduced.prescription.volume.reps?.value).toBe(2);

    const normal = prescribe("hang_power_clean", "normal");
    expect(normal.prescription.volume.sets).toBe(4);
    expect(normal.prescription.volume.reps?.value).toBe(3);

    const high = prescribe("hang_power_clean", "high");
    expect(high.prescription.volume.sets).toBe(5);
    expect(high.prescription.volume.reps?.value).toBe(3);
  });
});

// -----------------------------------------------------------------------------
// 14. Duration estimation profile
// -----------------------------------------------------------------------------

describe("registry Lot 2 — duration estimation profile", () => {
  test("hang_power_clean has an unresolved duration profile sourced to its own chapter, sets_reps structure", () => {
    const result = getDurationEstimationProfile("duration_profile_hang_power_clean");
    if (result.ok) {
      throw new Error("Expected the duration profile for hang_power_clean to be unresolved.");
    }
    expect(result.failureCode).toBe("DURATION_PROFILE_UNRESOLVED");
    expect(result.profile?.volumeStructure).toBe("sets_reps");
    expect(result.profile?.sourceRuleIds).toEqual(["50-exercises/64_POWER/12_HANG_POWER_CLEAN.md"]);
  });

  test("no duration profile exists for sled_push — it was not integrated this lot", () => {
    const result = getDurationEstimationProfile("duration_profile_sled_push");
    if (result.ok) {
      throw new Error("Expected no duration profile to exist for sled_push.");
    }
    expect(result.failureCode).toBe("DURATION_PROFILE_NOT_FOUND");
  });
});

// -----------------------------------------------------------------------------
// 15. Distinctions from named precedents
// -----------------------------------------------------------------------------

describe("registry Lot 2 — distinctions from named precedents", () => {
  test("hang_power_clean vs. hang_high_pull: identical equipment/profile/module/role, but only hang_power_clean declares impact_limit/balance_loss catch-phase stop conditions and a repetitions ceiling of 3 (vs. no dose constraint at all for hang_high_pull)", () => {
    const hpc = EXERCISE_PRESCRIPTION_REGISTRY.hang_power_clean;
    const hhp = EXERCISE_PRESCRIPTION_REGISTRY.hang_high_pull;

    expect(hpc.moduleId).toBe(hhp.moduleId);
    expect(hpc.role).toBe(hhp.role);
    expect(hpc.explicitMethodId).toBe(hhp.explicitMethodId);
    expect(hpc.capabilities.requiredEquipmentCapabilities).toEqual(hhp.capabilities.requiredEquipmentCapabilities);

    const hpcCategories = hpc.stopConditionDefinitions.map((d) => d.category);
    const hhpCategories = hhp.stopConditionDefinitions.map((d) => d.category);
    expect(hpcCategories).toContain("impact_limit");
    expect(hpcCategories).toContain("balance_loss");
    expect(hhpCategories).toContain("impact_limit"); // hhp has its own bar-collision hazard too
    expect(hhpCategories).toContain("balance_loss");

    // The decisive difference is the documented catch phase itself, not the stop-condition
    // category vocabulary (both use the full 7-category set) — verified via text content instead.
    const hpcImpactText = hpc.stopConditionDefinitions.find((d) => d.category === "impact_limit")?.instructions[0]?.text ?? "";
    const hhpImpactText = hhp.stopConditionDefinitions.find((d) => d.category === "impact_limit")?.instructions[0]?.text ?? "";
    expect(hpcImpactText.toLowerCase()).toContain("catch");
    expect(hhpImpactText.toLowerCase()).not.toContain("catch");

    expect(hpc.exerciseDoseConstraints).not.toBeNull();
    expect(hhp.exerciseDoseConstraints).toBeNull();
  });

  test("hang_power_clean vs. jump_shrug: both power/primary siblings, but only hang_power_clean's technical_failure text names a turnover and a catch position — jump_shrug has neither", () => {
    const hpc = EXERCISE_PRESCRIPTION_REGISTRY.hang_power_clean;
    const js = EXERCISE_PRESCRIPTION_REGISTRY.jump_shrug;

    expect(hpc.moduleId).toBe(js.moduleId);
    expect(hpc.role).toBe(js.role);

    const hpcText = hpc.stopConditionDefinitions.find((d) => d.category === "technical_failure")?.instructions[0]?.text.toLowerCase() ?? "";
    const jsText = js.stopConditionDefinitions.find((d) => d.category === "technical_failure")?.instructions[0]?.text.toLowerCase() ?? "";
    expect(hpcText).toContain("turnover");
    expect(hpcText).toContain("catch position");
    expect(jsText).not.toContain("turnover");
    expect(jsText).not.toContain("catch position");

    // jump_shrug is explicitly named as an earlier progression stage (extension only, no
    // catch) in hang_power_clean's own Progression Model — confirmed at the KB level too.
    const hpcKb = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "hang_power_clean")!;
    const jsKb = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "jump_shrug")!;
    expect(hpcKb.module).toBe(jsKb.module);
  });

  test("sled_push vs. sprint_intervals: sled_push stays classified as power (loaded, discrete-effort), sprint_intervals is conditioning (interval, unloaded) — confirmed at the knowledge-base level since sled_push has no registry entry this lot", () => {
    const sledPush = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "sled_push")!;
    const sprintIntervals = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "sprint_intervals")!;
    expect(sledPush.module).toBe("power");
    expect(sprintIntervals.module).toBe("conditioning");
    expect(sledPush.requiredEquipment).toEqual([]);
    // sled_push was NOT reclassified as conditioning/work_rest_intervals to force an
    // integration — it remains genuinely blocked instead (see block comment in the registry).
    expect(EXERCISE_PRESCRIPTION_REGISTRY as Record<string, unknown>).not.toHaveProperty("sled_push");
  });

  test("sled_push vs. farmer_carry: sled_push is horizontal push power (no distance-based method authorized for its own \"power\" module); farmer_carry is grip-module loaded locomotion using distance_carry_sets, a method explicitly forbidden for the power module", () => {
    const sledPush = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "sled_push")!;
    const farmerCarry = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "farmer_carry")!;
    expect(sledPush.module).toBe("power");
    expect(farmerCarry.module).toBe("grip");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.farmer_carry.explicitMethodId).toBe("distance_carry_sets");

    const powerContract = getTrainingMethodContract("power_repetition_sets");
    expect(powerContract.supportedModules).toContain("power");

    const distanceCarryContract = getTrainingMethodContract("distance_carry_sets");
    expect(distanceCarryContract.supportedModules).not.toContain("power");
  });

  test("loaded technical power vs. loaded locomotion: hang_power_clean (a discrete, catch-terminated repetition) is structurally distinct from a distance-covering carry — neither is silently substituted for the other", () => {
    const hpc = EXERCISE_PRESCRIPTION_REGISTRY.hang_power_clean;
    const farmerCarry = EXERCISE_PRESCRIPTION_REGISTRY.farmer_carry;
    expect(hpc.explicitMethodId).toBe("power_repetition_sets");
    expect(farmerCarry.explicitMethodId).toBe("distance_carry_sets");
    expect(hpc.capabilities.supportedVolumeStructures).toEqual(["sets_reps"]);
    expect(farmerCarry.capabilities.supportedVolumeStructures).toEqual(["sets_distance"]);
  });
});

// -----------------------------------------------------------------------------
// 16. Registry validation and purely-additive non-regression
// -----------------------------------------------------------------------------

describe("registry Lot 2 — registry validation and non-regression", () => {
  test("the full registry validates with no new issue beyond the expected unresolved duration profiles", () => {
    const issues = validatePilotRegistry().filter((issue) => issue.code !== "UNRESOLVED_DURATION_PROFILE");
    expect(issues).toEqual([]);
  });

  test("the registry now contains exactly 51 active exercises (50 + hang_power_clean; sled_push honestly blocked)", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(51);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(51);
  });

  test("no historical entry was removed: all 50 previously-existing ids are still present", () => {
    const PREVIOUSLY_EXISTING_IDS = [
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
    ] as const;
    expect(PREVIOUSLY_EXISTING_IDS).toHaveLength(50);
    for (const id of PREVIOUSLY_EXISTING_IDS) {
      expect(PILOT_EXERCISE_IDS).toContain(id);
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id as PilotExerciseId]).toBeDefined();
    }
  });

  test("every key of EXERCISE_PRESCRIPTION_REGISTRY has a corresponding id in PILOT_EXERCISE_IDS and vice versa", () => {
    const registryKeys = Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort();
    const pilotIds = [...PILOT_EXERCISE_IDS].sort();
    expect(registryKeys).toEqual(pilotIds);
  });

  test("determinism and non-mutation for hang_power_clean", () => {
    const context = buildValidContextFor("hang_power_clean");
    expect(getExercisePrescriptionSource("hang_power_clean", context)).toEqual(
      getExercisePrescriptionSource("hang_power_clean", context),
    );

    const snapshot = JSON.parse(JSON.stringify(context));
    getExercisePrescriptionSource("hang_power_clean", context);
    expect(context).toEqual(snapshot);
  });

  test("a pre-existing, unrelated exercise (bench_press) is unaffected by this lot's own changes", () => {
    const bp = EXERCISE_PRESCRIPTION_REGISTRY.bench_press;
    expect(bp.moduleId).toBe("strength");
    expect(bp.role).toBe("primary");
    expect(bp.capabilities.requiredEquipmentCapabilities).toEqual(["barbell", "bench", "rack", "plates"]);
  });
});
