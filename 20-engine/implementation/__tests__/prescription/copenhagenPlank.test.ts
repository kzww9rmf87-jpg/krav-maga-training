/**
 * Combat Athlete System — copenhagen_plank Integration
 *
 * Core/Robustness unilateral isometric hold, reusing
 * timed_isometric_core_robustness_v0_1 narrowed on a single dimension
 * (durationSeconds minimum 15s — the shared profile's own minimum, 10s,
 * sits below what the fiche ever documents).
 *
 * The laterality tests below document the engine's actual, verified
 * behavior — not an invented semantic. `duration_per_side` lives only in
 * `capabilities.volumeInterpretations` (read once by
 * `validateCompatibility`'s laterality gate); the resolved
 * `PrescriptionVolume.duration.scope` is always `"per_set"` (there is no
 * "per_side" scope value in the type system), and `volume.laterality`
 * stays `null` unless a caller explicitly supplies a `PrescriptionLaterality`
 * object — exactly the same behavior already exercised by `single_leg_hop`.
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
  availableEquipmentCapabilities: ["bench"],
};

function prescribe(rangeContext: PrescriptionExecutionContext["rangeContext"] = "normal") {
  const context: PrescriptionExecutionContext = { ...VALID_CONTEXT, rangeContext };
  const sourceResult = getExercisePrescriptionSource("copenhagen_plank", context);
  if (!sourceResult.ok) {
    throw new Error(`Expected copenhagen_plank to build a prescription source, got: ${sourceResult.message}`);
  }
  const result = prescribeExercise({
    exerciseId: "copenhagen_plank",
    moduleId: sourceResult.moduleId,
    ...sourceResult.source,
  });
  if (!result.ok) {
    throw new Error(`Expected copenhagen_plank prescription to succeed at ${result.failureStage}: ${result.message}`);
  }
  return result;
}

describe("copenhagen_plank — presence and classification", () => {
  test("is present in PILOT_EXERCISE_IDS and the registry", () => {
    expect(PILOT_EXERCISE_IDS).toContain("copenhagen_plank");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.copenhagen_plank).toBeDefined();
  });

  test("uses moduleId \"core\", role \"robustness\" and method \"timed_isometric_sets\"", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY.copenhagen_plank;
    expect(entry.moduleId).toBe("core");
    expect(entry.role).toBe("robustness");
    expect(entry.explicitMethodId).toBe("timed_isometric_sets");

    const result = prescribe();
    expect(result.prescription.moduleId).toBe("core");
    expect(result.prescription.role).toBe("robustness");
    expect(result.prescription.methodId).toBe("timed_isometric_sets");
  });
});

describe("copenhagen_plank — equipment", () => {
  test("requires exactly [\"bench\"]", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.copenhagen_plank.capabilities.requiredEquipmentCapabilities).toEqual([
      "bench",
    ]);
  });

  test("fails with REQUIRED_EQUIPMENT_MISSING without bench", () => {
    const result = getExercisePrescriptionSource("copenhagen_plank", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: [],
    });
    if (result.ok) {
      throw new Error("Expected copenhagen_plank to fail without bench.");
    }
    expect(result.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
  });

  test("succeeds with bench available", () => {
    const result = getExercisePrescriptionSource("copenhagen_plank", VALID_CONTEXT);
    expect(result.ok).toBe(true);
  });
});

describe("copenhagen_plank — end-to-end prescription", () => {
  test("prescribes completely", () => {
    const result = prescribe();
    expect(result.prescription.status).toBe("complete");
    expect(result.prescription.exerciseId).toBe("copenhagen_plank");
  });

  test("resolves via the shared timed_isometric_core_robustness_v0_1 profile", () => {
    const result = prescribe();
    expect(result.trace.volume.ok && result.trace.volume.profileId).toBe("timed_isometric_core_robustness_v0_1");
  });

  test("normal context: 3 sets, 20-second holds (shared profile's own normal, unaffected by narrowing)", () => {
    const result = prescribe("normal");
    expect(result.prescription.volume.sets).toBe(3);
    expect(result.prescription.volume.duration).toEqual({ value: 20, unit: "seconds", scope: "per_set" });
  });

  test("reduced context: minimum hold narrowed to 15 seconds (not the shared profile's own 10-second minimum)", () => {
    const result = prescribe("reduced");
    expect(result.prescription.volume.sets).toBe(2);
    expect(result.prescription.volume.duration).toEqual({ value: 15, unit: "seconds", scope: "per_set" });
  });

  test("high context: 4 sets, 40-second holds (the shared profile's own maximum — never widened toward the fiche's 45s)", () => {
    const result = prescribe("high");
    expect(result.prescription.volume.sets).toBe(4);
    expect(result.prescription.volume.duration).toEqual({ value: 40, unit: "seconds", scope: "per_set" });
  });

  test("resolves technical_effort: high_quality by default (preferredIntensityType, matching pallof_press/hollow_body_hold)", () => {
    const result = prescribe();
    expect(result.prescription.intensity.primaryMetric.type).toBe("technical_effort");
    expect(result.prescription.intensity.primaryMetric.target).toEqual({ type: "category", value: "high_quality" });
  });

  test("can resolve RPE within the shared profile's documented range when technical_effort is not supported", () => {
    const sourceResult = getExercisePrescriptionSource("copenhagen_plank", VALID_CONTEXT);
    if (!sourceResult.ok) {
      throw new Error(`Expected copenhagen_plank to build a prescription source, got: ${sourceResult.message}`);
    }
    const result = prescribeExercise({
      exerciseId: "copenhagen_plank",
      moduleId: sourceResult.moduleId,
      ...sourceResult.source,
      supportedIntensityTypes: ["rpe"],
    });
    if (!result.ok) {
      throw new Error(`Expected copenhagen_plank to resolve via rpe, got failure at ${result.failureStage}: ${result.message}`);
    }
    expect(result.prescription.intensity.primaryMetric.type).toBe("rpe");
    expect(result.prescription.intensity.primaryMetric.target).toEqual({ type: "fixed", value: 7 });
  });

  test("resolves rest and tempo exactly from the shared profile (no exercise-specific narrowing)", () => {
    const result = prescribe();
    const betweenSets = result.prescription.rest?.betweenSets;
    if (betweenSets?.type !== "fixed") {
      throw new Error("Expected a fixed rest target for copenhagen_plank.");
    }
    expect(betweenSets.duration.value).toBe(60);
    expect(betweenSets.duration.scope).toBe("between_sets");

    if (result.prescription.tempo === null) {
      throw new Error("Expected copenhagen_plank to resolve a tempo.");
    }
    expect(result.prescription.tempo.type).toBe("isometric_hold");

    expect(EXERCISE_PRESCRIPTION_REGISTRY.copenhagen_plank.exerciseIntensityConstraints).toBeNull();
    expect(EXERCISE_PRESCRIPTION_REGISTRY.copenhagen_plank.exerciseRestConstraints).toBeNull();
  });
});

describe("copenhagen_plank — dose narrowing (durationSeconds only)", () => {
  test("declares exactly a minimum-duration narrowing, nothing else", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.copenhagen_plank.exerciseDoseConstraints).toEqual({
      minimumDose: {
        sets: null,
        repetitions: null,
        durationSeconds: 15,
        distanceMeters: null,
        rounds: null,
        workIntervals: null,
      },
      maximumDose: null,
      sourceRuleIds: ["50-exercises/19_COPENHAGEN_PLANK"],
    });
  });
});

describe("copenhagen_plank — laterality: documenting the engine's real behavior, not an invented semantic", () => {
  test("declares laterality \"unilateral\" and volumeInterpretations [\"duration_per_side\"]", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY.copenhagen_plank;
    expect(entry.capabilities.laterality).toBe("unilateral");
    expect(entry.capabilities.volumeInterpretations).toEqual(["duration_per_side"]);
  });

  test("the resolved duration's scope is \"per_set\", exactly as for a bilateral exercise — no \"per_side\" scope exists", () => {
    const result = prescribe();
    expect(result.prescription.volume.duration?.scope).toBe("per_set");
  });

  test("volume.laterality stays null when the caller supplies no explicit laterality — matching single_leg_hop's own precedent", () => {
    const result = prescribe();
    expect(result.prescription.volume.laterality).toBeNull();
  });

  test("no automatic doubling of sets or duration occurs for the unilateral declaration", () => {
    // 3 sets x 20s in normal context — identical in kind to a bilateral
    // exercise on the same profile (see hollow_body_hold), never 6 sets or
    // 40s. The "per side" meaning lives only in the declared capability,
    // never as a resolver-side multiplication.
    const result = prescribe("normal");
    expect(result.prescription.volume.sets).toBe(3);
    expect(result.prescription.volume.duration?.value).toBe(20);
  });
});

describe("copenhagen_plank — stop conditions", () => {
  test("declares exactly technical_failure, pain and completion", () => {
    const categories = EXERCISE_PRESCRIPTION_REGISTRY.copenhagen_plank.stopConditionDefinitions.map(
      (definition) => definition.category,
    );
    expect(categories).toEqual(["technical_failure", "pain", "completion"]);
  });

  test("technical_failure's description covers body-line loss, pelvic drop, loss of supporting-leg control and inability to hold the position", () => {
    const technicalFailure = EXERCISE_PRESCRIPTION_REGISTRY.copenhagen_plank.stopConditionDefinitions.find(
      (definition) => definition.category === "technical_failure",
    );
    const text = technicalFailure?.instructions[0]?.text.toLowerCase() ?? "";
    expect(text).toContain("body line");
    expect(text).toContain("hips drop");
    expect(text).toContain("supporting leg");
    expect(text).toContain("no longer be maintained");
  });

  test("the prescription resolves all three required stop-condition categories", () => {
    const result = prescribe();
    const categories = result.prescription.stopConditions.map((condition) => condition.category);
    expect(categories).toEqual(
      expect.arrayContaining(["technical_failure", "pain", "completion"]),
    );
    expect(categories).toHaveLength(3);
  });
});

describe("copenhagen_plank — duration estimation profile", () => {
  test("has an unresolved profile sourced to its own chapter, sets_duration structure", () => {
    const result = getDurationEstimationProfile("duration_profile_copenhagen_plank");
    if (result.ok) {
      throw new Error("Expected the duration profile to be unresolved.");
    }
    expect(result.failureCode).toBe("DURATION_PROFILE_UNRESOLVED");
    expect(result.profile?.volumeStructure).toBe("sets_duration");
    expect(result.profile?.sourceRuleIds).toEqual(["50-exercises/19_COPENHAGEN_PLANK"]);
  });
});

describe("copenhagen_plank — distinct from pallof_press and hollow_body_hold", () => {
  test("is a distinct entry, not sharing instruction/stop-condition identifiers", () => {
    const plank = EXERCISE_PRESCRIPTION_REGISTRY.copenhagen_plank;
    const pallof = EXERCISE_PRESCRIPTION_REGISTRY.pallof_press;
    const hollow = EXERCISE_PRESCRIPTION_REGISTRY.hollow_body_hold;

    expect(plank.sourceRuleIds).not.toEqual(pallof.sourceRuleIds);
    expect(plank.sourceRuleIds).not.toEqual(hollow.sourceRuleIds);

    const plankIds = new Set(plank.instructionDefinitions.map((i) => i.instructionId));
    const pallofIds = new Set(pallof.instructionDefinitions.map((i) => i.instructionId));
    const hollowIds = new Set(hollow.instructionDefinitions.map((i) => i.instructionId));
    for (const id of plankIds) {
      expect(pallofIds.has(id)).toBe(false);
      expect(hollowIds.has(id)).toBe(false);
    }
  });

  test("differs on laterality and equipment from both siblings (pallof_press and hollow_body_hold are both bilateral)", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.copenhagen_plank.capabilities.laterality).toBe("unilateral");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.pallof_press.capabilities.laterality).toBe("bilateral");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.hollow_body_hold.capabilities.laterality).toBe("bilateral");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.copenhagen_plank.capabilities.requiredEquipmentCapabilities).toEqual([
      "bench",
    ]);
  });
});

describe("copenhagen_plank — registry validation and non-regression", () => {
  test("the full registry validates with no new issue beyond the expected unresolved duration profiles", () => {
    const issues = validatePilotRegistry().filter((issue) => issue.code !== "UNRESOLVED_DURATION_PROFILE");
    expect(issues).toEqual([]);
  });

  test("the registry now contains exactly 44 active exercises", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(61);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(61);
  });

  test("determinism: identical input produces an identical result", () => {
    expect(getExercisePrescriptionSource("copenhagen_plank", VALID_CONTEXT)).toEqual(
      getExercisePrescriptionSource("copenhagen_plank", VALID_CONTEXT),
    );
  });

  test("does not mutate the execution context", () => {
    const context = { ...VALID_CONTEXT };
    const snapshot = JSON.parse(JSON.stringify(context));
    getExercisePrescriptionSource("copenhagen_plank", context);
    expect(context).toEqual(snapshot);
  });
});
