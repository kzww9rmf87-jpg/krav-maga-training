/**
 * Combat Athlete System — Robustness Batch Integration
 *
 * Covers the four Robustness exercises added on top of the 35-exercise
 * pilot registry: tibialis_raise, rotator_cuff_training,
 * wrist_strengthening (repetitions variant only), soleus_raise.
 *
 * All four share exactly one NumericalPrescriptionProfile
 * (robustness_accessory_straight_sets_v0_1 — moduleId "robustness",
 * methodId "straight_sets_repetitions", exerciseRole "accessory") and
 * narrow it per exercise via exerciseDoseConstraints/
 * exerciseIntensityConstraints — this file asserts no new business rule
 * and no new numerical value: every expected number here is copied
 * directly from prescriptionKnowledge.ts / exercisePrescriptionRegistry.ts.
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

const ROBUSTNESS_EXERCISE_IDS = [
  "tibialis_raise",
  "rotator_cuff_training",
  "wrist_strengthening",
  "soleus_raise",
] as const;

const LOW_LOAD_CONTROL_IDS = ["rotator_cuff_training", "wrist_strengthening"] as const;
const LOCAL_CAPACITY_IDS = ["tibialis_raise", "soleus_raise"] as const;

function buildValidContextFor(id: PilotExerciseId): PrescriptionExecutionContext {
  const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
  return {
    rangeContext: "normal",
    athleteReferences: [],
    availableEquipmentCapabilities: entry.capabilities.requiredEquipmentCapabilities,
  };
}

function prescribe(id: PilotExerciseId, context: PrescriptionExecutionContext = buildValidContextFor(id)) {
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
// 1. Presence and prescriptibility
// -----------------------------------------------------------------------------

describe("robustness batch — presence and prescriptibility", () => {
  test("all four exercises are present in PILOT_EXERCISE_IDS and the registry", () => {
    for (const id of ROBUSTNESS_EXERCISE_IDS) {
      expect(PILOT_EXERCISE_IDS).toContain(id);
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id]).toBeDefined();
    }
  });

  for (const id of ROBUSTNESS_EXERCISE_IDS) {
    test(`${id} prescribes completely given its documented equipment requirements`, () => {
      const result = prescribe(id);
      expect(result.prescription.status).toBe("complete");
      expect(result.prescription.exerciseId).toBe(id);
    });
  }
});

// -----------------------------------------------------------------------------
// 2. Module, role, method
// -----------------------------------------------------------------------------

describe("robustness batch — module, role and method", () => {
  for (const id of ROBUSTNESS_EXERCISE_IDS) {
    test(`${id} uses moduleId "robustness", role "accessory" and method "straight_sets_repetitions"`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.moduleId).toBe("robustness");
      expect(entry.role).toBe("accessory");
      expect(entry.explicitMethodId).toBe("straight_sets_repetitions");

      const result = prescribe(id);
      expect(result.prescription.moduleId).toBe("robustness");
      expect(result.prescription.role).toBe("accessory");
      expect(result.prescription.methodId).toBe("straight_sets_repetitions");
    });
  }

  test("none of the four Robustness exercises uses role: \"robustness\" — all four keep role: \"accessory\"", () => {
    // pallof_press (moduleId "core") legitimately uses role: "robustness"
    // elsewhere in the registry — pre-existing and unrelated to this batch.
    // What matters here is that none of these four new exercises was given
    // role: "robustness" merely to route to a different numerical profile.
    for (const id of ROBUSTNESS_EXERCISE_IDS) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].role).not.toBe("robustness");
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].role).toBe("accessory");
    }
  });
});

// -----------------------------------------------------------------------------
// 3. Single shared profile for the triplet
// -----------------------------------------------------------------------------

describe("robustness batch — single shared profile", () => {
  test("exactly one NumericalPrescriptionProfile exists for (robustness, straight_sets_repetitions, accessory)", () => {
    const matches = NUMERICAL_PRESCRIPTION_PROFILES.filter(
      (profile) =>
        profile.moduleId === "robustness" &&
        profile.methodId === "straight_sets_repetitions" &&
        profile.exerciseRole === "accessory",
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].profileId).toBe("robustness_accessory_straight_sets_v0_1");
  });

  test("all four exercises resolve to the same profileId", () => {
    for (const id of ROBUSTNESS_EXERCISE_IDS) {
      const result = prescribe(id);
      expect(result.trace.volume.ok && result.trace.volume.profileId).toBe(
        "robustness_accessory_straight_sets_v0_1",
      );
    }
  });
});

// -----------------------------------------------------------------------------
// 4. Volume — 3 sets x 20 repetitions in normal context, exact dose bounds
// -----------------------------------------------------------------------------

describe("robustness batch — volume", () => {
  for (const id of ROBUSTNESS_EXERCISE_IDS) {
    test(`${id} resolves 3 sets x 20 repetitions in the "normal" range context`, () => {
      const result = prescribe(id);
      expect(result.prescription.volume.sets).toBe(3);
      expect(result.prescription.volume.reps).toEqual({ type: "fixed", value: 20, min: null, max: null, unit: "repetitions" });
    });
  }

  test("exact per-exercise repetition dose constraints", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.tibialis_raise.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: null, repetitions: 12, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: null,
      sourceRuleIds: ["50-exercises/41_TIBIALIS_RAISE"],
    });
    expect(EXERCISE_PRESCRIPTION_REGISTRY.rotator_cuff_training.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: null, repetitions: 12, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: null, repetitions: 25, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/42_ROTATOR_CUFF_TRAINING"],
    });
    expect(EXERCISE_PRESCRIPTION_REGISTRY.wrist_strengthening.exerciseDoseConstraints).toBeNull();
    expect(EXERCISE_PRESCRIPTION_REGISTRY.soleus_raise.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: null, repetitions: 15, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: null,
      sourceRuleIds: ["50-exercises/44_SOLEUS_RAISE"],
    });
  });
});

// -----------------------------------------------------------------------------
// 5. Intensity — per-category RPE normal, technical_effort availability
// -----------------------------------------------------------------------------

describe("robustness batch — intensity", () => {
  for (const id of LOW_LOAD_CONTROL_IDS) {
    test(`${id} resolves RPE normal 4 (Low-load control category)`, () => {
      const result = prescribe(id);
      expect(result.prescription.intensity.primaryMetric.type).toBe("rpe");
      expect(result.prescription.intensity.primaryMetric.target).toEqual({ type: "fixed", value: 4 });
    });
  }

  for (const id of LOCAL_CAPACITY_IDS) {
    test(`${id} resolves RPE normal 6 (Local robustness/capacity category)`, () => {
      const result = prescribe(id);
      expect(result.prescription.intensity.primaryMetric.type).toBe("rpe");
      expect(result.prescription.intensity.primaryMetric.target).toEqual({ type: "fixed", value: 6 });
    });
  }

  for (const id of ROBUSTNESS_EXERCISE_IDS) {
    test(`${id} can resolve technical_effort: high_quality when it is the only supported intensity type`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      const context = buildValidContextFor(id);
      const sourceResult = getExercisePrescriptionSource(id, context);
      if (!sourceResult.ok) {
        throw new Error(`Expected "${id}" to build a prescription source, got: ${sourceResult.message}`);
      }
      const result = prescribeExercise({
        exerciseId: id,
        moduleId: sourceResult.moduleId,
        ...sourceResult.source,
        supportedIntensityTypes: ["technical_effort"],
      });
      if (!result.ok) {
        throw new Error(`Expected "${id}" to resolve via technical_effort, got failure at ${result.failureStage}: ${result.message}`);
      }
      expect(result.prescription.intensity.primaryMetric.type).toBe("technical_effort");
      expect(result.prescription.intensity.primaryMetric.target).toEqual({ type: "category", value: "high_quality" });
      expect(entry.supportedIntensityTypes).toContain("technical_effort");
    });
  }

  test("exact per-exercise RPE range constraints", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.tibialis_raise.exerciseIntensityConstraints).toEqual({
      allowedIntensityTypes: null,
      rangeConstraints: [{ type: "rpe", minimum: 5, maximum: 8, normal: 6 }],
      sourceRuleIds: ["50-exercises/41_TIBIALIS_RAISE"],
    });
    expect(EXERCISE_PRESCRIPTION_REGISTRY.rotator_cuff_training.exerciseIntensityConstraints).toEqual({
      allowedIntensityTypes: null,
      rangeConstraints: [{ type: "rpe", minimum: 3, maximum: 6, normal: 4 }],
      sourceRuleIds: ["50-exercises/42_ROTATOR_CUFF_TRAINING"],
    });
    expect(EXERCISE_PRESCRIPTION_REGISTRY.wrist_strengthening.exerciseIntensityConstraints).toEqual({
      allowedIntensityTypes: null,
      rangeConstraints: [{ type: "rpe", minimum: 3, maximum: 6, normal: 4 }],
      sourceRuleIds: ["50-exercises/43_WRIST_STRENGTHENING"],
    });
    expect(EXERCISE_PRESCRIPTION_REGISTRY.soleus_raise.exerciseIntensityConstraints).toEqual({
      allowedIntensityTypes: null,
      rangeConstraints: [{ type: "rpe", minimum: 5, maximum: 8, normal: 6 }],
      sourceRuleIds: ["50-exercises/44_SOLEUS_RAISE"],
    });
  });
});

// -----------------------------------------------------------------------------
// 6. Rest — 60s normal, identical for all four, never narrowed
// -----------------------------------------------------------------------------

describe("robustness batch — rest", () => {
  for (const id of ROBUSTNESS_EXERCISE_IDS) {
    test(`${id} resolves 60 seconds of rest between sets`, () => {
      const result = prescribe(id);
      const betweenSets = result.prescription.rest?.betweenSets;
      if (betweenSets?.type !== "fixed") {
        throw new Error(`Expected a fixed rest target for "${id}".`);
      }
      expect(betweenSets.duration.value).toBe(60);
      expect(betweenSets.duration.scope).toBe("between_sets");
    });

    test(`${id} declares no exercise-specific rest constraint`, () => {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].exerciseRestConstraints).toBeNull();
    });
  }
});

// -----------------------------------------------------------------------------
// 7. Tempo — controlled, shared across all four
// -----------------------------------------------------------------------------

describe("robustness batch — tempo", () => {
  for (const id of ROBUSTNESS_EXERCISE_IDS) {
    test(`${id} resolves a controlled global-intent tempo`, () => {
      const result = prescribe(id);
      if (result.prescription.tempo === null) {
        throw new Error(`Expected "${id}" to resolve a tempo.`);
      }
      expect(result.prescription.tempo.type).toBe("global_intent");
      expect(result.prescription.tempo.globalIntent).toBe("controlled");
    });

    test(`${id} declares supportedTempoTypes: ["global_intent"] and preferredTempoType: "global_intent"`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.supportedTempoTypes).toEqual(["global_intent"]);
      expect(entry.preferredTempoType).toBe("global_intent");
      expect(entry.capabilities.supportedTempoTypes).toEqual(["global_intent"]);
    });
  }
});

// -----------------------------------------------------------------------------
// 8. Equipment — exact required equipment, gating behavior
// -----------------------------------------------------------------------------

describe("robustness batch — equipment", () => {
  test("exact required equipment per exercise", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.tibialis_raise.capabilities.requiredEquipmentCapabilities).toEqual([]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.rotator_cuff_training.capabilities.requiredEquipmentCapabilities).toEqual([
      "cable_or_band_resistance",
    ]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.wrist_strengthening.capabilities.requiredEquipmentCapabilities).toEqual([]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.soleus_raise.capabilities.requiredEquipmentCapabilities).toEqual([]);
  });

  test("exact supportedLoadingModes per exercise", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.tibialis_raise.capabilities.supportedLoadingModes).toEqual([
      "bodyweight",
      "added_external_load",
    ]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.rotator_cuff_training.capabilities.supportedLoadingModes).toEqual([
      "cable",
      "resistance_band",
    ]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.wrist_strengthening.capabilities.supportedLoadingModes).toEqual([
      "bodyweight",
      "added_external_load",
    ]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.soleus_raise.capabilities.supportedLoadingModes).toEqual([
      "bodyweight",
      "added_external_load",
    ]);
  });

  test("rotator_cuff_training fails with REQUIRED_EQUIPMENT_MISSING when cable_or_band_resistance is unavailable", () => {
    const context: PrescriptionExecutionContext = {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: [],
    };
    const result = getExercisePrescriptionSource("rotator_cuff_training", context);
    if (result.ok) {
      throw new Error("Expected rotator_cuff_training to fail without cable_or_band_resistance.");
    }
    expect(result.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
  });

  test("rotator_cuff_training succeeds when cable_or_band_resistance is available", () => {
    const context: PrescriptionExecutionContext = {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["cable_or_band_resistance"],
    };
    const result = getExercisePrescriptionSource("rotator_cuff_training", context);
    expect(result.ok).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// 9. wrist_strengthening — repetitions variant only, isometric excluded
// -----------------------------------------------------------------------------

describe("robustness batch — wrist_strengthening represents the repetitions variant only", () => {
  test("does not declare support for timed_isometric_sets", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.wrist_strengthening.capabilities.supportedMethodIds).not.toContain(
      "timed_isometric_sets",
    );
    expect(EXERCISE_PRESCRIPTION_REGISTRY.wrist_strengthening.explicitMethodId).toBe("straight_sets_repetitions");
  });

  test("does not declare support for the sets_duration volume structure", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.wrist_strengthening.capabilities.supportedVolumeStructures).not.toContain(
      "sets_duration",
    );
    expect(EXERCISE_PRESCRIPTION_REGISTRY.wrist_strengthening.capabilities.supportedVolumeStructures).toEqual([
      "sets_reps",
    ]);
  });
});

// -----------------------------------------------------------------------------
// 10. Stop conditions — technical_failure, pain, completion only
// -----------------------------------------------------------------------------

describe("robustness batch — stop conditions", () => {
  for (const id of ROBUSTNESS_EXERCISE_IDS) {
    test(`${id} declares exactly technical_failure, pain and completion`, () => {
      const categories = EXERCISE_PRESCRIPTION_REGISTRY[id].stopConditionDefinitions.map(
        (definition) => definition.category,
      );
      expect(categories).toEqual(["technical_failure", "pain", "completion"]);
    });

    test(`${id}'s prescription resolves stop conditions for all three required categories`, () => {
      const result = prescribe(id);
      const categories = result.prescription.stopConditions.map((condition) => condition.category);
      expect(categories).toContain("technical_failure");
      expect(categories).toContain("pain");
      expect(categories).toContain("completion");
    });
  }
});

// -----------------------------------------------------------------------------
// 11. Non-regression
// -----------------------------------------------------------------------------

describe("robustness batch — non-regression", () => {
  test("the registry now contains exactly 39 active exercises", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(39);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(39);
  });

  test("determinism: identical input produces an identical result for every Robustness exercise", () => {
    for (const id of ROBUSTNESS_EXERCISE_IDS) {
      const context = buildValidContextFor(id);
      expect(getExercisePrescriptionSource(id, context)).toEqual(getExercisePrescriptionSource(id, context));
    }
  });

  test("does not mutate the execution context", () => {
    for (const id of ROBUSTNESS_EXERCISE_IDS) {
      const context = buildValidContextFor(id);
      const snapshot = JSON.parse(JSON.stringify(context));
      getExercisePrescriptionSource(id, context);
      expect(context).toEqual(snapshot);
    }
  });
});
