/**
 * Combat Athlete System — Strength Accessory (Extended Repetitions) Batch
 *
 * hip_thrust, chin_up and barbell_row share exactly one
 * NumericalPrescriptionProfile (strength_accessory_straight_sets_v0_1 —
 * moduleId "strength", methodId "straight_sets_repetitions", exerciseRole
 * "accessory"), RPE-only. Neither rir nor percentage_1rm is active for any
 * of the three: hip_thrust and barbell_row document 60-90% 1RM in their
 * own chapters, but this range is deliberately not represented, because
 * resolveVolume and resolveIntensity resolve volume and intensity
 * independently — a wide repetition range combined with a wide
 * percentage_1rm range could produce an incoherent pair (see
 * 34_NUMERICAL_PRESCRIPTION_TABLES.md, Table Group 12).
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

const STRENGTH_ACCESSORY_EXERCISE_IDS = ["hip_thrust", "chin_up", "barbell_row"] as const;

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
// 1. Shared profile
// -----------------------------------------------------------------------------

describe("strength accessory batch — shared profile", () => {
  test("exactly one NumericalPrescriptionProfile exists for (strength, straight_sets_repetitions, accessory)", () => {
    const matches = NUMERICAL_PRESCRIPTION_PROFILES.filter(
      (profile) =>
        profile.moduleId === "strength" &&
        profile.methodId === "straight_sets_repetitions" &&
        profile.exerciseRole === "accessory",
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].profileId).toBe("strength_accessory_straight_sets_v0_1");
  });

  test("the profile's intensity array contains exactly one rule: rpe 6-7-8 — no rir, no percentage_1rm", () => {
    const profile = NUMERICAL_PRESCRIPTION_PROFILES.find(
      (p) => p.profileId === "strength_accessory_straight_sets_v0_1",
    );
    if (profile === undefined) {
      throw new Error("Expected strength_accessory_straight_sets_v0_1 to exist.");
    }
    expect(profile.intensity).toHaveLength(1);
    expect(profile.intensity[0]).toMatchObject({ type: "rpe", min: 6, normal: 7, max: 8 });
    expect(profile.intensity.some((rule) => (rule.type as string) === "rir")).toBe(false);
    expect(profile.intensity.some((rule) => (rule.type as string) === "percentage_1rm")).toBe(false);
  });

  test("rest is exactly between_sets 90-120-180, tempo is null", () => {
    const profile = NUMERICAL_PRESCRIPTION_PROFILES.find(
      (p) => p.profileId === "strength_accessory_straight_sets_v0_1",
    );
    if (profile === undefined) {
      throw new Error("Expected strength_accessory_straight_sets_v0_1 to exist.");
    }
    expect(profile.rest).toEqual({
      scope: "between_sets",
      seconds: { min: 90, normal: 120, max: 180 },
      sourceRuleIds: profile.rest?.sourceRuleIds,
    });
    expect(profile.tempo).toBeNull();
  });

  test("volume envelope is exactly sets 2-3-6, repetitions 4-8-15", () => {
    const profile = NUMERICAL_PRESCRIPTION_PROFILES.find(
      (p) => p.profileId === "strength_accessory_straight_sets_v0_1",
    );
    if (profile === undefined) {
      throw new Error("Expected strength_accessory_straight_sets_v0_1 to exist.");
    }
    expect(profile.volume.sets).toEqual({ min: 2, normal: 3, max: 6 });
    expect(profile.volume.repetitions?.range).toEqual({ min: 4, normal: 8, max: 15 });
  });
});

// -----------------------------------------------------------------------------
// 2. Presence, classification, intensity vocabulary
// -----------------------------------------------------------------------------

describe("strength accessory batch — presence and classification", () => {
  for (const id of STRENGTH_ACCESSORY_EXERCISE_IDS) {
    test(`${id} is present in PILOT_EXERCISE_IDS and the registry`, () => {
      expect(PILOT_EXERCISE_IDS).toContain(id);
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id]).toBeDefined();
    });

    test(`${id} uses moduleId "strength", role "accessory" and method "straight_sets_repetitions"`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.moduleId).toBe("strength");
      expect(entry.role).toBe("accessory");
      expect(entry.explicitMethodId).toBe("straight_sets_repetitions");
    });

    test(`${id} declares supportedIntensityTypes exactly ["rpe"] — no rir, no percentage_1rm`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.supportedIntensityTypes).toEqual(["rpe"]);
      expect(entry.preferredIntensityType).toBe("rpe");
      expect(entry.capabilities.supportedIntensityTypes).toEqual(["rpe"]);
      expect(entry.capabilities.preferredIntensityTypes).toEqual(["rpe"]);
    });

    test(`${id} declares tempo absent (supportedTempoTypes empty, preferredTempoType null)`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.supportedTempoTypes).toEqual([]);
      expect(entry.preferredTempoType).toBeNull();
    });
  }
});

// -----------------------------------------------------------------------------
// 3. End-to-end prescription — normal, reduced, high
// -----------------------------------------------------------------------------

describe("strength accessory batch — end-to-end prescription", () => {
  for (const id of STRENGTH_ACCESSORY_EXERCISE_IDS) {
    test(`${id} prescribes completely and resolves via the shared profile`, () => {
      const result = prescribe(id);
      expect(result.prescription.status).toBe("complete");
      expect(result.trace.volume.ok && result.trace.volume.profileId).toBe(
        "strength_accessory_straight_sets_v0_1",
      );
    });

    test(`${id} resolves the exact normal prescription: 3 sets x 8 repetitions, RPE 7, 120s rest, no tempo`, () => {
      const result = prescribe(id, "normal");
      expect(result.prescription.volume.sets).toBe(3);
      expect(result.prescription.volume.reps).toEqual({
        type: "fixed",
        value: 8,
        min: null,
        max: null,
        unit: "repetitions",
      });
      expect(result.prescription.intensity.primaryMetric.type).toBe("rpe");
      expect(result.prescription.intensity.primaryMetric.target).toEqual({ type: "fixed", value: 7 });

      const betweenSets = result.prescription.rest?.betweenSets;
      if (betweenSets?.type !== "fixed") {
        throw new Error(`Expected a fixed rest target for "${id}".`);
      }
      expect(betweenSets.duration.value).toBe(120);
      expect(result.prescription.tempo).toBeNull();
    });
  }

  test("hip_thrust reduced/high: 3x4 / 6x10, RPE 6/8, rest 90/180", () => {
    const reduced = prescribe("hip_thrust", "reduced");
    expect(reduced.prescription.volume.sets).toBe(3);
    expect(reduced.prescription.volume.reps?.value).toBe(4);
    expect(reduced.prescription.intensity.primaryMetric.target).toEqual({ type: "fixed", value: 6 });
    expect((reduced.prescription.rest?.betweenSets as { type: "fixed"; duration: { value: number } }).duration.value).toBe(90);

    const high = prescribe("hip_thrust", "high");
    expect(high.prescription.volume.sets).toBe(6);
    expect(high.prescription.volume.reps?.value).toBe(10);
    expect(high.prescription.intensity.primaryMetric.target).toEqual({ type: "fixed", value: 8 });
    expect((high.prescription.rest?.betweenSets as { type: "fixed"; duration: { value: number } }).duration.value).toBe(180);
  });

  test("chin_up reduced/high: 2x4 / 6x15 (matches the shared envelope exactly, no narrowing)", () => {
    const reduced = prescribe("chin_up", "reduced");
    expect(reduced.prescription.volume.sets).toBe(2);
    expect(reduced.prescription.volume.reps?.value).toBe(4);

    const high = prescribe("chin_up", "high");
    expect(high.prescription.volume.sets).toBe(6);
    expect(high.prescription.volume.reps?.value).toBe(15);
  });

  test("barbell_row reduced/high: 3x5 / 6x12", () => {
    const reduced = prescribe("barbell_row", "reduced");
    expect(reduced.prescription.volume.sets).toBe(3);
    expect(reduced.prescription.volume.reps?.value).toBe(5);

    const high = prescribe("barbell_row", "high");
    expect(high.prescription.volume.sets).toBe(6);
    expect(high.prescription.volume.reps?.value).toBe(12);
  });
});

// -----------------------------------------------------------------------------
// 4. Dose constraints
// -----------------------------------------------------------------------------

describe("strength accessory batch — dose constraints", () => {
  test("hip_thrust narrows sets 3-6 and repetitions 4-10", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.hip_thrust.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 3, repetitions: 4, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 6, repetitions: 10, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/05_HIP_THRUST"],
    });
  });

  test("chin_up declares no dose constraint (its own range matches the shared envelope exactly)", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.chin_up.exerciseDoseConstraints).toBeNull();
  });

  test("barbell_row narrows sets 3-6 and repetitions 5-12", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.barbell_row.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 3, repetitions: 5, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 6, repetitions: 12, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/12_BARBELL_ROW"],
    });
  });

  test("none of the three declares exerciseIntensityConstraints or exerciseRestConstraints", () => {
    for (const id of STRENGTH_ACCESSORY_EXERCISE_IDS) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].exerciseIntensityConstraints).toBeNull();
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].exerciseRestConstraints).toBeNull();
    }
  });
});

// -----------------------------------------------------------------------------
// 5. Equipment and loading modes
// -----------------------------------------------------------------------------

describe("strength accessory batch — equipment and loading modes", () => {
  test("exact required equipment per exercise", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.hip_thrust.capabilities.requiredEquipmentCapabilities).toEqual([
      "barbell",
      "bench",
      "plates",
    ]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.chin_up.capabilities.requiredEquipmentCapabilities).toEqual([
      "pull_up_bar",
    ]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.barbell_row.capabilities.requiredEquipmentCapabilities).toEqual([
      "barbell",
      "plates",
    ]);
  });

  test("exact supportedLoadingModes per exercise", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.hip_thrust.capabilities.supportedLoadingModes).toEqual([
      "barbell",
      "added_external_load",
    ]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.chin_up.capabilities.supportedLoadingModes).toEqual(["bodyweight"]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.barbell_row.capabilities.supportedLoadingModes).toEqual([
      "barbell",
      "added_external_load",
    ]);
  });

  for (const id of STRENGTH_ACCESSORY_EXERCISE_IDS) {
    test(`${id} fails with REQUIRED_EQUIPMENT_MISSING when no equipment is available`, () => {
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

    test(`${id} succeeds when its required equipment is available`, () => {
      const result = getExercisePrescriptionSource(id, buildValidContextFor(id));
      expect(result.ok).toBe(true);
    });
  }
});

// -----------------------------------------------------------------------------
// 6. Stop conditions
// -----------------------------------------------------------------------------

describe("strength accessory batch — stop conditions", () => {
  for (const id of STRENGTH_ACCESSORY_EXERCISE_IDS) {
    test(`${id} declares exactly technical_failure, pain and completion`, () => {
      const categories = EXERCISE_PRESCRIPTION_REGISTRY[id].stopConditionDefinitions.map(
        (definition) => definition.category,
      );
      expect(categories).toEqual(["technical_failure", "pain", "completion"]);
    });
  }

  test("hip_thrust's technical_failure covers lumbar hyperextension, incomplete hip extension and bar control", () => {
    const condition = EXERCISE_PRESCRIPTION_REGISTRY.hip_thrust.stopConditionDefinitions.find(
      (d) => d.category === "technical_failure",
    );
    const text = condition?.instructions[0]?.text.toLowerCase() ?? "";
    expect(text).toContain("lumbar hyperextension");
    expect(text).toContain("hip extension is incomplete");
    expect(text).toContain("bar");
  });

  test("chin_up's technical_failure covers range of motion, swinging/kipping and scapular control", () => {
    const condition = EXERCISE_PRESCRIPTION_REGISTRY.chin_up.stopConditionDefinitions.find(
      (d) => d.category === "technical_failure",
    );
    const text = condition?.instructions[0]?.text.toLowerCase() ?? "";
    expect(text).toContain("range of motion");
    expect(text).toContain("swinging or kipping");
    expect(text).toContain("scapular control");
  });

  test("barbell_row's technical_failure covers lumbar flexion, momentum and scapular retraction/trunk position", () => {
    const condition = EXERCISE_PRESCRIPTION_REGISTRY.barbell_row.stopConditionDefinitions.find(
      (d) => d.category === "technical_failure",
    );
    const text = condition?.instructions[0]?.text.toLowerCase() ?? "";
    expect(text).toContain("lumbar flexion");
    expect(text).toContain("momentum");
    expect(text).toContain("scapular retraction");
  });

  for (const id of STRENGTH_ACCESSORY_EXERCISE_IDS) {
    test(`${id}'s prescription resolves all three required stop-condition categories`, () => {
      const result = prescribe(id);
      const categories = result.prescription.stopConditions.map((condition) => condition.category);
      expect(categories).toEqual(
        expect.arrayContaining(["technical_failure", "pain", "completion"]),
      );
      expect(categories).toHaveLength(3);
    });
  }
});

// -----------------------------------------------------------------------------
// 7. Duration estimation profiles
// -----------------------------------------------------------------------------

describe("strength accessory batch — duration estimation profiles", () => {
  const EXPECTED_SOURCES: Record<(typeof STRENGTH_ACCESSORY_EXERCISE_IDS)[number], string> = {
    hip_thrust: "50-exercises/05_HIP_THRUST",
    chin_up: "50-exercises/11_CHIN_UP",
    barbell_row: "50-exercises/12_BARBELL_ROW",
  };

  for (const id of STRENGTH_ACCESSORY_EXERCISE_IDS) {
    test(`${id} has an unresolved profile sourced to its own chapter, sets_reps structure`, () => {
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
// 8. Registry validation and non-regression
// -----------------------------------------------------------------------------

describe("strength accessory batch — registry validation and non-regression", () => {
  test("the full registry validates with no new issue beyond the expected unresolved duration profiles", () => {
    const issues = validatePilotRegistry().filter((issue) => issue.code !== "UNRESOLVED_DURATION_PROFILE");
    expect(issues).toEqual([]);
  });

  test("the registry now contains exactly 44 active exercises", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(71);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(71);
  });

  for (const id of STRENGTH_ACCESSORY_EXERCISE_IDS) {
    test(`${id}: determinism and non-mutation`, () => {
      const context = buildValidContextFor(id);
      expect(getExercisePrescriptionSource(id, context)).toEqual(getExercisePrescriptionSource(id, context));

      const snapshot = JSON.parse(JSON.stringify(context));
      getExercisePrescriptionSource(id, context);
      expect(context).toEqual(snapshot);
    });
  }
});
