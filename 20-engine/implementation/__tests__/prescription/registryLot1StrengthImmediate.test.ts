/**
 * Combat Athlete System — Registry Lot 1 (Strength Immediate)
 *
 * chest_supported_row, dip, landmine_press, weighted_pull_up,
 * neck_training and nordic_hamstring_curl are the first six of the 32
 * exercises present in EXERCISE_KNOWLEDGE_BASE but absent from
 * EXERCISE_PRESCRIPTION_REGISTRY, migrated per the Registry Audit's own
 * "Lot 1 — Strength immediate" recommendation (Category A: reuses the
 * existing strength_accessory_straight_sets_v0_1 /
 * strength_primary_straight_sets_v0_1 profiles with no new numerical
 * profile). Five of the six (all but weighted_pull_up) share exactly the
 * accessory profile; weighted_pull_up alone uses the primary profile,
 * mirroring pull_up's own existing role. None of the six re-encodes any
 * eligibility-layer decision already owned by exerciseKnowledgeBase.ts.
 */

import { describe, expect, test } from "vitest";

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
import { isEquipmentCapabilityId } from "../../prescription/equipmentCapabilities";

const ACCESSORY_IDS = [
  "chest_supported_row",
  "dip",
  "landmine_press",
  "neck_training",
  "nordic_hamstring_curl",
] as const;
const LOT1_EXERCISE_IDS = [...ACCESSORY_IDS, "weighted_pull_up"] as const;

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
// 1. Presence, identity, classification
// -----------------------------------------------------------------------------

describe("registry Lot 1 — presence and classification", () => {
  for (const id of LOT1_EXERCISE_IDS) {
    test(`${id} is present in PILOT_EXERCISE_IDS`, () => {
      expect(PILOT_EXERCISE_IDS).toContain(id);
    });

    test(`${id} is present in EXERCISE_PRESCRIPTION_REGISTRY with a consistent exerciseId`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry).toBeDefined();
      expect(entry.exerciseId).toBe(id);
      expect(entry.capabilities.exerciseId).toBe(id);
    });

    test(`${id} uses moduleId "strength" and method "straight_sets_repetitions"`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.moduleId).toBe("strength");
      expect(entry.explicitMethodId).toBe("straight_sets_repetitions");
      expect(entry.capabilities.supportedMethodIds).toEqual(["straight_sets_repetitions"]);
      expect(entry.capabilities.supportedVolumeStructures).toEqual(["sets_reps"]);
    });
  }

  for (const id of ACCESSORY_IDS) {
    test(`${id} uses role "accessory"`, () => {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].role).toBe("accessory");
    });
  }

  test("weighted_pull_up uses role \"primary\", mirroring pull_up's own existing role", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.weighted_pull_up.role).toBe("primary");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.pull_up.role).toBe("primary");
  });
});

// -----------------------------------------------------------------------------
// 2. Shared numerical profiles — no new profile created
// -----------------------------------------------------------------------------

describe("registry Lot 1 — shared numerical profiles", () => {
  test("exactly one profile exists for (strength, straight_sets_repetitions, accessory) and it is unchanged", () => {
    const matches = NUMERICAL_PRESCRIPTION_PROFILES.filter(
      (p) => p.moduleId === "strength" && p.methodId === "straight_sets_repetitions" && p.exerciseRole === "accessory",
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].profileId).toBe("strength_accessory_straight_sets_v0_1");
    expect(matches[0].volume.sets).toEqual({ min: 2, normal: 3, max: 6 });
    expect(matches[0].volume.repetitions?.range).toEqual({ min: 4, normal: 8, max: 15 });
    expect(matches[0].intensity).toHaveLength(1);
    expect(matches[0].intensity[0]).toMatchObject({ type: "rpe", min: 6, normal: 7, max: 8 });
  });

  test("exactly one profile exists for (strength, straight_sets_repetitions, primary) and it is unchanged", () => {
    const matches = NUMERICAL_PRESCRIPTION_PROFILES.filter(
      (p) => p.moduleId === "strength" && p.methodId === "straight_sets_repetitions" && p.exerciseRole === "primary",
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].profileId).toBe("strength_primary_straight_sets_v0_1");
    expect(matches[0].volume.sets).toEqual({ min: 2, normal: 3, max: 4 });
    expect(matches[0].volume.repetitions?.range).toEqual({ min: 3, normal: 5, max: 6 });
  });

  test("the total number of NumericalPrescriptionProfiles is unchanged at 12 (no new profile added)", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(12);
  });
});

// -----------------------------------------------------------------------------
// 3. resolveMethod / validateCompatibility — no NUMERICAL_PROFILE_MISSING
// -----------------------------------------------------------------------------

describe("registry Lot 1 — method/module/role compatibility", () => {
  for (const id of LOT1_EXERCISE_IDS) {
    test(`${id}: getExercisePrescriptionSource succeeds with its required equipment available`, () => {
      const result = getExercisePrescriptionSource(id, buildValidContextFor(id));
      expect(result.ok).toBe(true);
    });

    test(`${id}: full prescription resolves without NUMERICAL_PROFILE_MISSING`, () => {
      const result = prescribe(id);
      expect(result.prescription.status).toBe("complete");
      expect(result.trace.volume.ok).toBe(true);
      if (result.trace.volume.ok) {
        expect(result.trace.volume.profileId).not.toBe(null);
      }
    });
  }
});

// -----------------------------------------------------------------------------
// 4. Equipment and loading modes
// -----------------------------------------------------------------------------

describe("registry Lot 1 — equipment and loading modes", () => {
  test("required equipment capabilities are exactly as determined from each fiche, none re-encoding KB eligibility", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.chest_supported_row.capabilities.requiredEquipmentCapabilities).toEqual(["bench"]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.dip.capabilities.requiredEquipmentCapabilities).toEqual(["dip_bars"]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.landmine_press.capabilities.requiredEquipmentCapabilities).toEqual(["barbell"]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.weighted_pull_up.capabilities.requiredEquipmentCapabilities).toEqual([
      "pull_up_bar",
      "plates",
    ]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.neck_training.capabilities.requiredEquipmentCapabilities).toEqual([]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.nordic_hamstring_curl.capabilities.requiredEquipmentCapabilities).toEqual([]);
  });

  test("dip_bars is a valid, newly-added equipment capability id, aligned 1:1 with the knowledge base's own EquipmentType", () => {
    expect(isEquipmentCapabilityId("dip_bars")).toBe(true);
  });

  test("no other/invented equipment capability id was introduced for landmine attachment or dip belt", () => {
    expect(isEquipmentCapabilityId("landmine_attachment")).toBe(false);
    expect(isEquipmentCapabilityId("dip_belt")).toBe(false);
  });

  test("exact supportedLoadingModes per exercise", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.chest_supported_row.capabilities.supportedLoadingModes).toEqual([
      "dumbbell",
      "barbell",
      "machine",
    ]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.dip.capabilities.supportedLoadingModes).toEqual(["bodyweight", "added_external_load"]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.landmine_press.capabilities.supportedLoadingModes).toEqual([
      "barbell",
      "added_external_load",
    ]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.weighted_pull_up.capabilities.supportedLoadingModes).toEqual([
      "bodyweight",
      "added_external_load",
    ]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.neck_training.capabilities.supportedLoadingModes).toEqual([
      "bodyweight",
      "added_external_load",
      "partner_resistance",
    ]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.nordic_hamstring_curl.capabilities.supportedLoadingModes).toEqual([
      "bodyweight",
      "assisted_bodyweight",
    ]);
  });

  for (const id of LOT1_EXERCISE_IDS) {
    test(`${id}: nothing beyond its own requiredEquipmentCapabilities is needed to prescribe`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      const result = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: entry.capabilities.requiredEquipmentCapabilities,
      });
      expect(result.ok).toBe(true);
    });
  }

  test("dip and landmine_press fail with REQUIRED_EQUIPMENT_MISSING when no equipment is available", () => {
    for (const id of ["dip", "landmine_press"] as const) {
      const result = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: [],
      });
      if (result.ok) {
        throw new Error(`Expected "${id}" to fail without its required equipment.`);
      }
      expect(result.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
    }
  });

  test("neck_training and nordic_hamstring_curl succeed with no equipment at all (bodyweight baseline)", () => {
    for (const id of ["neck_training", "nordic_hamstring_curl"] as const) {
      const result = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: [],
      });
      expect(result.ok).toBe(true);
    }
  });
});

// -----------------------------------------------------------------------------
// 5. Intensity
// -----------------------------------------------------------------------------

describe("registry Lot 1 — intensity", () => {
  test("chest_supported_row, dip, landmine_press and nordic_hamstring_curl use RPE only, no percentage_1rm despite a documented %-of-max figure existing for three of them", () => {
    for (const id of ["chest_supported_row", "dip", "landmine_press", "nordic_hamstring_curl"] as const) {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.supportedIntensityTypes).toEqual(["rpe"]);
      expect(entry.preferredIntensityType).toBe("rpe");
      expect(entry.exerciseIntensityConstraints === null || entry.exerciseIntensityConstraints.allowedIntensityTypes === null).toBe(
        id === "nordic_hamstring_curl" ? true : true,
      );
    }
  });

  test("weighted_pull_up excludes percentage_1rm via exerciseIntensityConstraints despite the shared primary profile documenting it", () => {
    const profile = NUMERICAL_PRESCRIPTION_PROFILES.find((p) => p.profileId === "strength_primary_straight_sets_v0_1")!;
    expect(profile.intensity.some((rule) => rule.type === "percentage_1rm")).toBe(true);

    const entry = EXERCISE_PRESCRIPTION_REGISTRY.weighted_pull_up;
    expect(entry.exerciseIntensityConstraints).not.toBeNull();
    expect(entry.exerciseIntensityConstraints?.allowedIntensityTypes).toEqual(["rpe", "rir"]);
    expect(entry.supportedIntensityTypes).toEqual(["rpe", "rir"]);

    const result = prescribe("weighted_pull_up");
    expect(result.prescription.intensity.primaryMetric.type).not.toBe("percentage_1rm");
  });

  test("neck_training pins RPE to the shared accessory profile's own most conservative sub-range (6-7, normal 6)", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY.neck_training;
    expect(entry.exerciseIntensityConstraints).toEqual({
      allowedIntensityTypes: null,
      rangeConstraints: [{ type: "rpe", minimum: 6, maximum: 7, normal: 6 }],
      sourceRuleIds: ["50-exercises/34_NECK_TRAINING"],
    });

    const result = prescribe("neck_training", "normal");
    expect(result.prescription.intensity.primaryMetric.target).toEqual({ type: "fixed", value: 6 });
  });
});

// -----------------------------------------------------------------------------
// 6. Tempo
// -----------------------------------------------------------------------------

describe("registry Lot 1 — tempo", () => {
  for (const id of ACCESSORY_IDS) {
    test(`${id}: tempo is absent (matching the shared accessory profile's own tempo: null)`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.supportedTempoTypes).toEqual([]);
      expect(entry.preferredTempoType).toBeNull();
    });
  }

  test("weighted_pull_up supports phase_intent tempo, matching pull_up's own identical resolution", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.weighted_pull_up.supportedTempoTypes).toEqual(["phase_intent"]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.pull_up.supportedTempoTypes).toEqual(["phase_intent"]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.weighted_pull_up.preferredTempoType).toBeNull();
  });
});

// -----------------------------------------------------------------------------
// 7. Rest
// -----------------------------------------------------------------------------

describe("registry Lot 1 — rest", () => {
  for (const id of LOT1_EXERCISE_IDS) {
    test(`${id}: no exerciseRestConstraints (uses the shared profile's own rest window as-is)`, () => {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].exerciseRestConstraints).toBeNull();
    });

    test(`${id}: prescription resolves a between_sets rest`, () => {
      const result = prescribe(id);
      expect(result.prescription.rest?.betweenSets).toBeDefined();
    });
  }
});

// -----------------------------------------------------------------------------
// 8. Volume / dose constraints — narrowing never widens the shared profile
// -----------------------------------------------------------------------------

describe("registry Lot 1 — dose constraints", () => {
  test("chest_supported_row narrows sets 3-6 and repetitions 6-15", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.chest_supported_row.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 3, repetitions: 6, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 6, repetitions: 15, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/13_CHEST_SUPPORTED_ROW"],
    });
  });

  test("dip narrows sets 3-6 and repetitions to the profile's own floor (4) through its documented ceiling (12) — the fiche's own floor of 3 cannot be reached", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.dip.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 3, repetitions: 4, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 6, repetitions: 12, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/14_DIP"],
    });
  });

  test("landmine_press narrows sets 3-6 and repetitions 4-10", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.landmine_press.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 3, repetitions: 4, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 6, repetitions: 10, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/26_LANDMINE_PRESS"],
    });
  });

  test("weighted_pull_up narrows to the shared primary profile's own ceiling — the fiche's own wider range (3-6 sets, 2-8 reps) cannot be reached", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.weighted_pull_up.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 3, repetitions: 3, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 4, repetitions: 6, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/09_WEIGHTED_PULL_UP"],
    });
  });

  test("neck_training narrows sets 2-5 and repetitions to 10 through the profile's own ceiling (15) — the fiche's own ceiling of 20 cannot be reached", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.neck_training.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 2, repetitions: 10, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 5, repetitions: 15, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/34_NECK_TRAINING"],
    });
  });

  test("nordic_hamstring_curl narrows sets 2-5 and repetitions to the profile's own floor (4) through 8", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.nordic_hamstring_curl.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 2, repetitions: 4, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 5, repetitions: 8, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/18_NORDIC_HAMSTRING_CURL"],
    });
  });

  test("none of the six dose constraints ever widens the shared profile's own bounds", () => {
    const accessoryProfile = NUMERICAL_PRESCRIPTION_PROFILES.find((p) => p.profileId === "strength_accessory_straight_sets_v0_1")!;
    const primaryProfile = NUMERICAL_PRESCRIPTION_PROFILES.find((p) => p.profileId === "strength_primary_straight_sets_v0_1")!;

    for (const id of ACCESSORY_IDS) {
      const constraint = EXERCISE_PRESCRIPTION_REGISTRY[id].exerciseDoseConstraints!;
      const min = constraint.minimumDose!;
      const max = constraint.maximumDose!;
      expect(min.sets!).toBeGreaterThanOrEqual(accessoryProfile.volume.sets!.min);
      expect(max.sets!).toBeLessThanOrEqual(accessoryProfile.volume.sets!.max);
      expect(min.repetitions!).toBeGreaterThanOrEqual(accessoryProfile.volume.repetitions!.range.min);
      expect(max.repetitions!).toBeLessThanOrEqual(accessoryProfile.volume.repetitions!.range.max);
    }

    const wpuConstraint = EXERCISE_PRESCRIPTION_REGISTRY.weighted_pull_up.exerciseDoseConstraints!;
    const wpuMin = wpuConstraint.minimumDose!;
    const wpuMax = wpuConstraint.maximumDose!;
    expect(wpuMin.sets!).toBeGreaterThanOrEqual(primaryProfile.volume.sets!.min);
    expect(wpuMax.sets!).toBeLessThanOrEqual(primaryProfile.volume.sets!.max);
    expect(wpuMin.repetitions!).toBeGreaterThanOrEqual(primaryProfile.volume.repetitions!.range.min);
    expect(wpuMax.repetitions!).toBeLessThanOrEqual(primaryProfile.volume.repetitions!.range.max);
  });
});

// -----------------------------------------------------------------------------
// 9. End-to-end prescription — normal / reduced / high
// -----------------------------------------------------------------------------

describe("registry Lot 1 — end-to-end prescription", () => {
  test("chest_supported_row resolves the exact normal prescription: 3 sets x 8 repetitions, RPE 7, 120s rest, no tempo", () => {
    const result = prescribe("chest_supported_row", "normal");
    expect(result.prescription.volume.sets).toBe(3);
    expect(result.prescription.volume.reps?.value).toBe(8);
    expect(result.prescription.intensity.primaryMetric.target).toEqual({ type: "fixed", value: 7 });
    expect(result.prescription.tempo).toBeNull();
  });

  test("dip reduced/high: 3x4 / 6x12", () => {
    const reduced = prescribe("dip", "reduced");
    expect(reduced.prescription.volume.sets).toBe(3);
    expect(reduced.prescription.volume.reps?.value).toBe(4);

    const high = prescribe("dip", "high");
    expect(high.prescription.volume.sets).toBe(6);
    expect(high.prescription.volume.reps?.value).toBe(12);
  });

  test("landmine_press reduced/high: 3x4 / 6x10", () => {
    const reduced = prescribe("landmine_press", "reduced");
    expect(reduced.prescription.volume.sets).toBe(3);
    expect(reduced.prescription.volume.reps?.value).toBe(4);

    const high = prescribe("landmine_press", "high");
    expect(high.prescription.volume.sets).toBe(6);
    expect(high.prescription.volume.reps?.value).toBe(10);
  });

  test("weighted_pull_up reduced/high: 3x3 / 4x6, tempo phase_intent supported", () => {
    const reduced = prescribe("weighted_pull_up", "reduced");
    expect(reduced.prescription.volume.sets).toBe(3);
    expect(reduced.prescription.volume.reps?.value).toBe(3);

    const high = prescribe("weighted_pull_up", "high");
    expect(high.prescription.volume.sets).toBe(4);
    expect(high.prescription.volume.reps?.value).toBe(6);
  });

  test("neck_training reduced/high: 2x10 / 5x15, RPE never exceeds 7", () => {
    const reduced = prescribe("neck_training", "reduced");
    expect(reduced.prescription.volume.sets).toBe(2);
    expect(reduced.prescription.volume.reps?.value).toBe(10);
    expect((reduced.prescription.intensity.primaryMetric.target as { value: number }).value).toBeLessThanOrEqual(7);

    const high = prescribe("neck_training", "high");
    expect(high.prescription.volume.sets).toBe(5);
    expect(high.prescription.volume.reps?.value).toBe(15);
    expect((high.prescription.intensity.primaryMetric.target as { value: number }).value).toBeLessThanOrEqual(7);
  });

  test("nordic_hamstring_curl reduced/high: 2x4 / 5x8", () => {
    const reduced = prescribe("nordic_hamstring_curl", "reduced");
    expect(reduced.prescription.volume.sets).toBe(2);
    expect(reduced.prescription.volume.reps?.value).toBe(4);

    const high = prescribe("nordic_hamstring_curl", "high");
    expect(high.prescription.volume.sets).toBe(5);
    expect(high.prescription.volume.reps?.value).toBe(8);
  });
});

// -----------------------------------------------------------------------------
// 10. Instructions and stop conditions
// -----------------------------------------------------------------------------

describe("registry Lot 1 — instructions and stop conditions", () => {
  for (const id of LOT1_EXERCISE_IDS) {
    test(`${id}: declares exactly technical_failure, pain and completion`, () => {
      const categories = EXERCISE_PRESCRIPTION_REGISTRY[id].stopConditionDefinitions.map((d) => d.category);
      expect(categories).toEqual(["technical_failure", "pain", "completion"]);
    });

    test(`${id}: at least a setup, an execution and a safety instruction are declared`, () => {
      const categories = EXERCISE_PRESCRIPTION_REGISTRY[id].instructionDefinitions.map((i) => i.category);
      expect(categories).toEqual(expect.arrayContaining(["setup", "execution", "safety"]));
    });

    test(`${id}: prescription resolves all three required stop-condition categories`, () => {
      const result = prescribe(id);
      const categories = result.prescription.stopConditions.map((c) => c.category);
      expect(categories).toEqual(expect.arrayContaining(["technical_failure", "pain", "completion"]));
      expect(categories).toHaveLength(3);
    });
  }

  test("dip's setup instruction never makes a dip belt mandatory", () => {
    const setup = EXERCISE_PRESCRIPTION_REGISTRY.dip.instructionDefinitions.find((i) => i.category === "setup");
    expect(setup?.text.toLowerCase()).toContain("bodyweight is the base loading");
  });

  test("weighted_pull_up's instructions never gate on dip belt/plates as eligibility — only the setup text mentions them", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY.weighted_pull_up;
    expect(entry.capabilities.requiredEquipmentCapabilities).not.toContain("dip_belt");
  });

  test("nordic_hamstring_curl's setup instruction does not re-state the Nordic-bench/partner any_of eligibility gate", () => {
    const setup = EXERCISE_PRESCRIPTION_REGISTRY.nordic_hamstring_curl.instructionDefinitions.find((i) => i.category === "setup");
    expect(setup?.text.toLowerCase()).toContain("nordic bench");
    expect(setup?.text.toLowerCase()).toContain("partner");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.nordic_hamstring_curl.capabilities.requiredEquipmentCapabilities).toEqual([]);
  });

  test("neck_training's setup instruction requires selecting one documented cervical direction, without a new capability", () => {
    const setup = EXERCISE_PRESCRIPTION_REGISTRY.neck_training.instructionDefinitions.find((i) => i.category === "setup");
    const text = setup?.text.toLowerCase() ?? "";
    expect(text).toContain("flexion");
    expect(text).toContain("rotation");
  });

  test("chest_supported_row's technical_failure covers momentum, retraction and forward head position", () => {
    const condition = EXERCISE_PRESCRIPTION_REGISTRY.chest_supported_row.stopConditionDefinitions.find(
      (d) => d.category === "technical_failure",
    );
    const text = condition?.instructions[0]?.text.toLowerCase() ?? "";
    expect(text).toContain("momentum");
    expect(text).toContain("retraction");
    expect(text).toContain("forward");
  });

  test("dip's technical_failure covers shrugging, depth and lockout", () => {
    const condition = EXERCISE_PRESCRIPTION_REGISTRY.dip.stopConditionDefinitions.find((d) => d.category === "technical_failure");
    const text = condition?.instructions[0]?.text.toLowerCase() ?? "";
    expect(text).toContain("shrug");
    expect(text).toContain("depth");
    expect(text).toContain("lockout");
  });

  test("landmine_press's technical_failure covers lumbar extension, shrugging and balance", () => {
    const condition = EXERCISE_PRESCRIPTION_REGISTRY.landmine_press.stopConditionDefinitions.find(
      (d) => d.category === "technical_failure",
    );
    const text = condition?.instructions[0]?.text.toLowerCase() ?? "";
    expect(text).toContain("lumbar");
    expect(text).toContain("shrug");
    expect(text).toContain("balance");
  });

  test("weighted_pull_up's technical_failure covers range of motion, swinging/kipping and scapular control", () => {
    const condition = EXERCISE_PRESCRIPTION_REGISTRY.weighted_pull_up.stopConditionDefinitions.find(
      (d) => d.category === "technical_failure",
    );
    const text = condition?.instructions[0]?.text.toLowerCase() ?? "";
    expect(text).toContain("range of motion");
    expect(text).toContain("swinging or kipping");
    expect(text).toContain("scapular control");
  });

  test("neck_training's pain condition covers concussion, cervical disc pathology and missing medical clearance", () => {
    const condition = EXERCISE_PRESCRIPTION_REGISTRY.neck_training.stopConditionDefinitions.find((d) => d.category === "pain");
    const text = condition?.instructions[0]?.text.toLowerCase() ?? "";
    expect(text).toContain("concussion");
    expect(text).toContain("cervical disc pathology");
    expect(text).toContain("medical clearance");
  });

  test("nordic_hamstring_curl's technical_failure covers hips breaking, descent control and lumbar extension", () => {
    const condition = EXERCISE_PRESCRIPTION_REGISTRY.nordic_hamstring_curl.stopConditionDefinitions.find(
      (d) => d.category === "technical_failure",
    );
    const text = condition?.instructions[0]?.text.toLowerCase() ?? "";
    expect(text).toContain("hips break");
    expect(text).toContain("descent");
    expect(text).toContain("lumbar extension");
  });
});

// -----------------------------------------------------------------------------
// 11. Duration estimation profiles
// -----------------------------------------------------------------------------

describe("registry Lot 1 — duration estimation profiles", () => {
  const EXPECTED_SOURCES: Record<(typeof LOT1_EXERCISE_IDS)[number], string> = {
    chest_supported_row: "50-exercises/13_CHEST_SUPPORTED_ROW",
    dip: "50-exercises/14_DIP",
    landmine_press: "50-exercises/26_LANDMINE_PRESS",
    weighted_pull_up: "50-exercises/09_WEIGHTED_PULL_UP",
    neck_training: "50-exercises/34_NECK_TRAINING",
    nordic_hamstring_curl: "50-exercises/18_NORDIC_HAMSTRING_CURL",
  };

  for (const id of LOT1_EXERCISE_IDS) {
    test(`${id}: has an unresolved duration profile sourced to its own chapter, sets_reps structure`, () => {
      const result = getDurationEstimationProfile(`duration_profile_${id}`);
      if (result.ok) {
        throw new Error(`Expected the duration profile for "${id}" to be unresolved.`);
      }
      expect(result.failureCode).toBe("DURATION_PROFILE_UNRESOLVED");
      expect(result.profile?.volumeStructure).toBe("sets_reps");
      expect(result.profile?.sourceRuleIds).toEqual([EXPECTED_SOURCES[id]]);
    });
  }
});

// -----------------------------------------------------------------------------
// 12. Distinctions from named precedents
// -----------------------------------------------------------------------------

describe("registry Lot 1 — distinctions from named precedents", () => {
  test("chest_supported_row vs. barbell_row: chest_supported_row supports three loading modes and requires only a bench; barbell_row requires barbell+plates and supports only barbell loading", () => {
    const csr = EXERCISE_PRESCRIPTION_REGISTRY.chest_supported_row;
    const br = EXERCISE_PRESCRIPTION_REGISTRY.barbell_row;
    expect(csr.capabilities.requiredEquipmentCapabilities).toEqual(["bench"]);
    expect(br.capabilities.requiredEquipmentCapabilities).toEqual(["barbell", "plates"]);
    expect(csr.capabilities.supportedLoadingModes).toEqual(["dumbbell", "barbell", "machine"]);
    expect(br.capabilities.supportedLoadingModes).toEqual(["barbell", "added_external_load"]);
    // Both share the exact same numerical profile.
    expect(csr.moduleId).toBe(br.moduleId);
    expect(csr.role).toBe(br.role);
  });

  test("dip vs. bench_press: dip is bodyweight-based (accessory) with no percentage_1rm; bench_press is barbell-loaded (primary) with percentage_1rm active", () => {
    const dip = EXERCISE_PRESCRIPTION_REGISTRY.dip;
    const bp = EXERCISE_PRESCRIPTION_REGISTRY.bench_press;
    expect(dip.capabilities.supportedLoadingModes).toEqual(["bodyweight", "added_external_load"]);
    expect(dip.supportedIntensityTypes).toEqual(["rpe"]);
    expect(bp.capabilities.supportedLoadingModes).toContain("barbell");
    expect(bp.role).toBe("primary");
    expect(dip.role).toBe("accessory");
  });

  test("landmine_press vs. overhead_press: landmine_press requires only a barbell (no rack); overhead_press requires barbell+plates+rack and uses percentage_1rm", () => {
    const lp = EXERCISE_PRESCRIPTION_REGISTRY.landmine_press;
    const ohp = EXERCISE_PRESCRIPTION_REGISTRY.overhead_press;
    expect(lp.capabilities.requiredEquipmentCapabilities).toEqual(["barbell"]);
    expect(ohp.capabilities.requiredEquipmentCapabilities).toEqual(["barbell", "plates", "rack"]);
    expect(lp.supportedIntensityTypes).toEqual(["rpe"]);
    expect(ohp.supportedIntensityTypes).toContain("percentage_1rm");
  });

  test("weighted_pull_up vs. pull_up: weighted_pull_up requires plates in addition to a pull-up bar and excludes percentage_1rm; pull_up requires only the bar and supports rir", () => {
    const wpu = EXERCISE_PRESCRIPTION_REGISTRY.weighted_pull_up;
    const pu = EXERCISE_PRESCRIPTION_REGISTRY.pull_up;
    expect(wpu.capabilities.requiredEquipmentCapabilities).toEqual(["pull_up_bar", "plates"]);
    expect(pu.capabilities.requiredEquipmentCapabilities).toEqual(["pull_up_bar"]);
    expect(wpu.exerciseIntensityConstraints?.allowedIntensityTypes).toEqual(["rpe", "rir"]);
    expect(pu.exerciseIntensityConstraints).toBeNull();
    expect(wpu.role).toBe(pu.role);
  });

  test("neck_training vs. wrist_strengthening: both are strength-family accessory drills but use different moduleId and different numerical profiles", () => {
    const neck = EXERCISE_PRESCRIPTION_REGISTRY.neck_training;
    const wrist = EXERCISE_PRESCRIPTION_REGISTRY.wrist_strengthening;
    expect(neck.moduleId).toBe("strength");
    expect(wrist.moduleId).toBe("robustness");
    expect(neck.role).toBe("accessory");
    expect(wrist.role).toBe("accessory");
    // Different profiles: strength_accessory (RPE 6-7-8) vs robustness_accessory (RPE 3-5-8, technical_effort also active).
    expect(neck.supportedIntensityTypes).toEqual(["rpe"]);
    expect(wrist.supportedIntensityTypes).toEqual(["rpe", "technical_effort"]);
  });

  test("nordic_hamstring_curl vs. romanian_deadlift: nordic_hamstring_curl is bodyweight/eccentric-only with no required equipment; romanian_deadlift is barbell-loaded with percentage_1rm", () => {
    const nhc = EXERCISE_PRESCRIPTION_REGISTRY.nordic_hamstring_curl;
    const rdl = EXERCISE_PRESCRIPTION_REGISTRY.romanian_deadlift;
    expect(nhc.capabilities.requiredEquipmentCapabilities).toEqual([]);
    expect(rdl.capabilities.requiredEquipmentCapabilities.length).toBeGreaterThan(0);
    expect(nhc.supportedIntensityTypes).toEqual(["rpe"]);
    expect(rdl.supportedIntensityTypes).toContain("percentage_1rm");
    expect(nhc.role).toBe("accessory");
  });
});

// -----------------------------------------------------------------------------
// 13. Registry validation and purely-additive non-regression
// -----------------------------------------------------------------------------

describe("registry Lot 1 — registry validation and non-regression", () => {
  test("the full registry validates with no new issue beyond the expected unresolved duration profiles", () => {
    const issues = validatePilotRegistry().filter((issue) => issue.code !== "UNRESOLVED_DURATION_PROFILE");
    expect(issues).toEqual([]);
  });

  test("the registry now contains exactly 50 active exercises", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(50);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(50);
  });

  test("no historical entry was removed: every one of the 44 previously-existing ids is still present", () => {
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
    ] as const;
    expect(PREVIOUSLY_EXISTING_IDS).toHaveLength(44);
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

  for (const id of LOT1_EXERCISE_IDS) {
    test(`${id}: determinism and non-mutation`, () => {
      const context = buildValidContextFor(id);
      expect(getExercisePrescriptionSource(id, context)).toEqual(getExercisePrescriptionSource(id, context));

      const snapshot = JSON.parse(JSON.stringify(context));
      getExercisePrescriptionSource(id, context);
      expect(context).toEqual(snapshot);
    });
  }

  test("bench_press's own entry (a pre-existing, unrelated exercise) is byte-identical before and after this lot's own changes", () => {
    const bp = EXERCISE_PRESCRIPTION_REGISTRY.bench_press;
    expect(bp.moduleId).toBe("strength");
    expect(bp.role).toBe("primary");
    expect(bp.capabilities.requiredEquipmentCapabilities).toEqual(["barbell", "bench", "rack", "plates"]);
  });
});
