/**
 * Combat Athlete System — countermovement_jump Integration
 *
 * The first exercise of the Force/Tirage batch — chosen because it required
 * no new business rule, no new numerical profile, no new equipment
 * vocabulary, no reclassification and no documentary conflict resolution
 * (see the read-only audit). It reuses power_primary_repetition_sets_v0_1
 * unchanged: no exerciseDoseConstraints, no exerciseIntensityConstraints,
 * no exerciseRestConstraints.
 */

import { describe, expect, test } from "vitest";

import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  getExercisePrescriptionSource,
  PILOT_EXERCISE_IDS,
  type PrescriptionExecutionContext,
} from "../../prescription/exercisePrescriptionRegistry";
import { prescribeExercise } from "../../prescription/prescribeExercise";
import { getDurationEstimationProfile } from "../../prescription/durationEstimationProfiles";
import { validatePilotRegistry } from "../../prescription/registryValidators";

const VALID_CONTEXT: PrescriptionExecutionContext = {
  rangeContext: "normal",
  athleteReferences: [],
  availableEquipmentCapabilities: [],
};

function prescribe() {
  const sourceResult = getExercisePrescriptionSource("countermovement_jump", VALID_CONTEXT);
  if (!sourceResult.ok) {
    throw new Error(`Expected countermovement_jump to build a prescription source, got: ${sourceResult.message}`);
  }
  const result = prescribeExercise({
    exerciseId: "countermovement_jump",
    moduleId: sourceResult.moduleId,
    ...sourceResult.source,
  });
  if (!result.ok) {
    throw new Error(`Expected countermovement_jump prescription to succeed at ${result.failureStage}: ${result.message}`);
  }
  return result;
}

describe("countermovement_jump — presence and classification", () => {
  test("is present in PILOT_EXERCISE_IDS and the registry", () => {
    expect(PILOT_EXERCISE_IDS).toContain("countermovement_jump");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.countermovement_jump).toBeDefined();
  });

  test("uses moduleId \"power\", role \"primary\" and method \"power_repetition_sets\"", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY.countermovement_jump;
    expect(entry.moduleId).toBe("power");
    expect(entry.role).toBe("primary");
    expect(entry.explicitMethodId).toBe("power_repetition_sets");
  });
});

describe("countermovement_jump — no equipment requirement", () => {
  test("requiredEquipmentCapabilities is empty", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.countermovement_jump.capabilities.requiredEquipmentCapabilities).toEqual([]);
  });

  test("prescribes successfully with no equipment available at all", () => {
    const result = getExercisePrescriptionSource("countermovement_jump", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: [],
    });
    expect(result.ok).toBe(true);
  });
});

describe("countermovement_jump — end-to-end prescription", () => {
  test("prescribes completely", () => {
    const result = prescribe();
    expect(result.prescription.status).toBe("complete");
    expect(result.prescription.exerciseId).toBe("countermovement_jump");
    expect(result.prescription.moduleId).toBe("power");
    expect(result.prescription.role).toBe("primary");
    expect(result.prescription.methodId).toBe("power_repetition_sets");
  });

  test("resolves the exact normal prescription: 4 sets x 3 repetitions", () => {
    const result = prescribe();
    expect(result.prescription.volume.sets).toBe(4);
    expect(result.prescription.volume.reps).toEqual({
      type: "fixed",
      value: 3,
      min: null,
      max: null,
      unit: "repetitions",
    });
  });

  test("resolves movement_intent: maximal_acceleration as the intensity", () => {
    const result = prescribe();
    expect(result.prescription.intensity.primaryMetric.type).toBe("movement_intent");
    expect(result.prescription.intensity.primaryMetric.target).toEqual({
      type: "category",
      value: "maximal_acceleration",
    });
  });

  test("resolves the shared profile's rest exactly (no exercise-specific narrowing)", () => {
    const result = prescribe();
    const betweenSets = result.prescription.rest?.betweenSets;
    if (betweenSets?.type !== "fixed") {
      throw new Error("Expected a fixed rest target for countermovement_jump.");
    }
    expect(betweenSets.duration.value).toBe(180);
    expect(betweenSets.duration.scope).toBe("between_sets");
  });

  test("resolves a global-intent tempo matching the shared profile", () => {
    const result = prescribe();
    if (result.prescription.tempo === null) {
      throw new Error("Expected countermovement_jump to resolve a tempo.");
    }
    expect(result.prescription.tempo.type).toBe("global_intent");
  });

  test("resolves via the single shared power_primary_repetition_sets_v0_1 profile", () => {
    const result = prescribe();
    expect(result.trace.volume.ok && result.trace.volume.profileId).toBe("power_primary_repetition_sets_v0_1");
  });
});

describe("countermovement_jump — no exercise-specific constraints", () => {
  test("declares no dose, intensity or rest constraints", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY.countermovement_jump;
    expect(entry.exerciseDoseConstraints).toBeNull();
    expect(entry.exerciseIntensityConstraints).toBeNull();
    expect(entry.exerciseRestConstraints).toBeNull();
  });
});

describe("countermovement_jump — stop conditions", () => {
  test("declares exactly the seven categories required by the power_repetition_sets method", () => {
    const categories = EXERCISE_PRESCRIPTION_REGISTRY.countermovement_jump.stopConditionDefinitions.map(
      (definition) => definition.category,
    );
    expect(categories).toEqual([
      "technical_failure",
      "velocity_loss",
      "fatigue_limit",
      "impact_limit",
      "balance_loss",
      "pain",
      "completion",
    ]);
  });

  test("the prescription resolves all seven required stop-condition categories", () => {
    const result = prescribe();
    const categories = result.prescription.stopConditions.map((condition) => condition.category);
    for (const required of [
      "technical_failure",
      "velocity_loss",
      "fatigue_limit",
      "impact_limit",
      "balance_loss",
      "pain",
      "completion",
    ]) {
      expect(categories).toContain(required);
    }
  });
});

describe("countermovement_jump — duration estimation profile", () => {
  test("has a resolved profile sourced to its own chapter", () => {
    const result = getDurationEstimationProfile("duration_profile_countermovement_jump");
    if (!result.ok) {
      throw new Error("Expected the duration profile to be unresolved.");
    }
    expect(result.profile?.sourceRuleIds).toContain("50-exercises/21_COUNTERMOVEMENT_JUMP");
  });
});

describe("countermovement_jump — distinct from other jumps", () => {
  test("is a distinct entry from box_jump, broad_jump and depth_jump", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.countermovement_jump).not.toBe(EXERCISE_PRESCRIPTION_REGISTRY.box_jump);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.countermovement_jump.sourceRuleIds).not.toEqual(
      EXERCISE_PRESCRIPTION_REGISTRY.box_jump.sourceRuleIds,
    );
    expect(EXERCISE_PRESCRIPTION_REGISTRY.countermovement_jump.sourceRuleIds).not.toEqual(
      EXERCISE_PRESCRIPTION_REGISTRY.broad_jump.sourceRuleIds,
    );
    expect(EXERCISE_PRESCRIPTION_REGISTRY.countermovement_jump.sourceRuleIds).not.toEqual(
      EXERCISE_PRESCRIPTION_REGISTRY.depth_jump.sourceRuleIds,
    );
  });

  test("does not require plyometric_box or safe_landing_surface, unlike box_jump/broad_jump", () => {
    const requiredEquipment = EXERCISE_PRESCRIPTION_REGISTRY.countermovement_jump.capabilities.requiredEquipmentCapabilities;
    expect(requiredEquipment).not.toContain("plyometric_box");
    expect(requiredEquipment).not.toContain("safe_landing_surface");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.box_jump.capabilities.requiredEquipmentCapabilities).toContain(
      "plyometric_box",
    );
    expect(EXERCISE_PRESCRIPTION_REGISTRY.broad_jump.capabilities.requiredEquipmentCapabilities).toContain(
      "safe_landing_surface",
    );
  });
});

describe("countermovement_jump — registry validation and non-regression", () => {
  test("the full registry validates with no new issue beyond the expected unresolved duration profiles", () => {
    const issues = validatePilotRegistry();
    expect(issues).toEqual([]);
  });

  test("determinism: identical input produces an identical result", () => {
    expect(getExercisePrescriptionSource("countermovement_jump", VALID_CONTEXT)).toEqual(
      getExercisePrescriptionSource("countermovement_jump", VALID_CONTEXT),
    );
  });

  test("does not mutate the execution context", () => {
    const context = { ...VALID_CONTEXT };
    const snapshot = JSON.parse(JSON.stringify(context));
    getExercisePrescriptionSource("countermovement_jump", context);
    expect(context).toEqual(snapshot);
  });
});
