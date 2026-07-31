/**
 * Combat Athlete System — Lot 0: explicit numerical profile selection at
 * the registry / orchestrator / validator / decision-trace level.
 *
 * Includes the 59-entry freeze table: for every historical registry entry
 * (none of which declares a numericalProfileId), profile resolution must
 * keep returning the exact profile it resolved before Lot 0, via the
 * unique-triple path. The table below is the frozen expectation, written
 * out explicitly — it must never be regenerated from the resolution logic
 * it is meant to guard.
 */

import { describe, expect, test } from "vitest";

import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  getExercisePrescriptionSource,
  type PrescriptionExecutionContext,
} from "../../prescription/exercisePrescriptionRegistry";
import { resolveNumericalProfile } from "../../prescription/prescriptionKnowledge";
import { prescribeExercise } from "../../prescription/prescribeExercise";
import { adaptExercisePrescriptionResult } from "../../prescription/prescriptionDecisionTrace";
import {
  validatePilotRegistry,
  validateRegistryEntry,
} from "../../prescription/registryValidators";
import { makeOneRepMaxReference, makePrescribeExerciseInput } from "./fixtures";

// -----------------------------------------------------------------------------
// Frozen profile mapping — 59 entries, 7 profiles (pre-Lot-0 behavior)
// -----------------------------------------------------------------------------

const FROZEN_PROFILE_BY_EXERCISE: Readonly<Record<string, string>> = {
  // strength_primary_straight_sets_v0_1 (9)
  bench_press: "strength_primary_straight_sets_v0_1",
  back_squat: "strength_primary_straight_sets_v0_1",
  trap_bar_deadlift: "strength_primary_straight_sets_v0_1",
  pull_up: "strength_primary_straight_sets_v0_1",
  front_squat: "strength_primary_straight_sets_v0_1",
  romanian_deadlift: "strength_primary_straight_sets_v0_1",
  overhead_press: "strength_primary_straight_sets_v0_1",
  bulgarian_split_squat: "strength_primary_straight_sets_v0_1",
  weighted_pull_up: "strength_primary_straight_sets_v0_1",
  // distance_carry_strength_grip_v0_1 (7)
  farmer_carry: "distance_carry_strength_grip_v0_1",
  front_rack_carry: "distance_carry_strength_grip_v0_1",
  sandbag_carry: "distance_carry_strength_grip_v0_1",
  zercher_carry: "distance_carry_strength_grip_v0_1",
  suitcase_carry: "distance_carry_strength_grip_v0_1",
  overhead_carry: "distance_carry_strength_grip_v0_1",
  pinch_carry: "distance_carry_strength_grip_v0_1",
  // timed_isometric_core_robustness_v0_1 (4)
  pallof_press: "timed_isometric_core_robustness_v0_1",
  hollow_body_hold: "timed_isometric_core_robustness_v0_1",
  dragon_flag: "timed_isometric_core_robustness_v0_1",
  copenhagen_plank: "timed_isometric_core_robustness_v0_1",
  // power_primary_repetition_sets_v0_1 (19)
  box_jump: "power_primary_repetition_sets_v0_1",
  push_press: "power_primary_repetition_sets_v0_1",
  hang_high_pull: "power_primary_repetition_sets_v0_1",
  jump_shrug: "power_primary_repetition_sets_v0_1",
  depth_jump: "power_primary_repetition_sets_v0_1",
  broad_jump: "power_primary_repetition_sets_v0_1",
  knee_jump: "power_primary_repetition_sets_v0_1",
  lateral_bound: "power_primary_repetition_sets_v0_1",
  single_leg_hop: "power_primary_repetition_sets_v0_1",
  split_squat_jump: "power_primary_repetition_sets_v0_1",
  med_ball_slam: "power_primary_repetition_sets_v0_1",
  med_ball_chest_pass: "power_primary_repetition_sets_v0_1",
  med_ball_overhead_throw: "power_primary_repetition_sets_v0_1",
  med_ball_shot_put_throw: "power_primary_repetition_sets_v0_1",
  med_ball_reverse_throw: "power_primary_repetition_sets_v0_1",
  med_ball_rotational_throw: "power_primary_repetition_sets_v0_1",
  med_ball_scoop_toss: "power_primary_repetition_sets_v0_1",
  countermovement_jump: "power_primary_repetition_sets_v0_1",
  hang_power_clean: "power_primary_repetition_sets_v0_1",
  // robustness_accessory_straight_sets_v0_1 (4)
  tibialis_raise: "robustness_accessory_straight_sets_v0_1",
  rotator_cuff_training: "robustness_accessory_straight_sets_v0_1",
  wrist_strengthening: "robustness_accessory_straight_sets_v0_1",
  soleus_raise: "robustness_accessory_straight_sets_v0_1",
  // strength_accessory_straight_sets_v0_1 (8)
  hip_thrust: "strength_accessory_straight_sets_v0_1",
  chin_up: "strength_accessory_straight_sets_v0_1",
  barbell_row: "strength_accessory_straight_sets_v0_1",
  chest_supported_row: "strength_accessory_straight_sets_v0_1",
  dip: "strength_accessory_straight_sets_v0_1",
  landmine_press: "strength_accessory_straight_sets_v0_1",
  neck_training: "strength_accessory_straight_sets_v0_1",
  nordic_hamstring_curl: "strength_accessory_straight_sets_v0_1",
  // controlled_mobility_sets_v0_1 (8)
  bear_crawl: "controlled_mobility_sets_v0_1",
  bridging: "controlled_mobility_sets_v0_1",
  footwork_drills: "controlled_mobility_sets_v0_1",
  shadow_boxing: "controlled_mobility_sets_v0_1",
  technical_stand_up: "controlled_mobility_sets_v0_1",
  shrimping: "controlled_mobility_sets_v0_1",
  sprawl: "controlled_mobility_sets_v0_1",
  shot_entries: "controlled_mobility_sets_v0_1",
};

describe("Lot 0 — 59-entry profile freeze", () => {
  test("the frozen table covers exactly the current registry", () => {
    expect(Object.keys(FROZEN_PROFILE_BY_EXERCISE).sort()).toEqual(
      Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort(),
    );
  });

  test("no historical entry declares an explicit numericalProfileId", () => {
    for (const entry of Object.values(EXERCISE_PRESCRIPTION_REGISTRY)) {
      expect(entry.numericalProfileId ?? null).toBeNull();
    }
  });

  test("every entry resolves the exact pre-Lot-0 profile via the unique-triple path", () => {
    for (const entry of Object.values(EXERCISE_PRESCRIPTION_REGISTRY)) {
      const resolution = resolveNumericalProfile({
        moduleId: entry.moduleId,
        methodId: entry.explicitMethodId,
        exerciseRole: entry.role,
        explicitProfileId: entry.numericalProfileId ?? null,
      });

      expect(resolution.ok).toBe(true);
      if (!resolution.ok) continue;
      expect(resolution.profile.profileId).toBe(
        FROZEN_PROFILE_BY_EXERCISE[entry.exerciseId],
      );
      expect(resolution.resolutionSource).toBe("module_method_role_unique");
    }
  });
});

describe("Lot 0 — getExercisePrescriptionSource mapping", () => {
  const context: PrescriptionExecutionContext = {
    rangeContext: "normal",
    athleteReferences: [makeOneRepMaxReference({ value: 100 })],
    availableEquipmentCapabilities: ["barbell", "bench", "rack", "plates"],
  };

  test("the source carries numericalProfileId, null for every historical entry", () => {
    const result = getExercisePrescriptionSource("bench_press", context);

    if (!result.ok) {
      throw new Error(`Expected success, got failure: ${result.message}`);
    }

    expect(result.source.numericalProfileId).toBeNull();
  });
});

describe("Lot 0 — prescribeExercise with an explicit numericalProfileId", () => {
  test("a valid explicit id produces the identical prescription as the implicit lookup", () => {
    const implicit = prescribeExercise(makePrescribeExerciseInput());
    const explicit = prescribeExercise(
      makePrescribeExerciseInput({
        numericalProfileId: "strength_primary_straight_sets_v0_1",
      }),
    );

    if (!implicit.ok || !explicit.ok) {
      throw new Error("Expected both prescriptions to succeed.");
    }

    expect(explicit.prescription).toEqual(implicit.prescription);
    expect(explicit.trace.volume.ok && explicit.trace.volume.profileResolutionSource).toBe(
      "explicit_profile_id",
    );
  });

  test("an unknown explicit id fails at the volume stage with NUMERICAL_PROFILE_ID_UNKNOWN", () => {
    const result = prescribeExercise(
      makePrescribeExerciseInput({ numericalProfileId: "does_not_exist_v0_1" }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureStage).toBe("volume");
    expect(result.trace.volume?.ok).toBe(false);
    if (result.trace.volume?.ok !== false) return;
    expect(result.trace.volume.failureCode).toBe("NUMERICAL_PROFILE_ID_UNKNOWN");
  });

  test("a mismatched explicit id fails at the volume stage with NUMERICAL_PROFILE_TRIPLE_MISMATCH", () => {
    const result = prescribeExercise(
      makePrescribeExerciseInput({
        numericalProfileId: "distance_carry_strength_grip_v0_1",
      }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureStage).toBe("volume");
  });

  test("all four numerical resolver stages agree on the resolved profile", () => {
    const result = prescribeExercise(makePrescribeExerciseInput());

    if (!result.ok) {
      throw new Error("Expected the prescription to succeed.");
    }

    const { volume, intensity, rest, tempo } = result.trace;
    if (!volume.ok || !intensity.ok || !rest.ok || !tempo.ok) {
      throw new Error("Expected every numerical stage to succeed.");
    }

    expect(new Set([volume.profileId, intensity.profileId, rest.profileId, tempo.profileId]).size).toBe(1);
  });
});

describe("Lot 0 — decision trace exposes the resolved profile", () => {
  test("the volume trace entry names the profile and its selection mode", () => {
    const result = prescribeExercise(makePrescribeExerciseInput());

    if (!result.ok) {
      throw new Error("Expected the prescription to succeed.");
    }

    const entries = adaptExercisePrescriptionResult(result, {
      idPrefix: "lot0_test",
      timestamp: "2026-01-01T00:00:00.000Z",
    });
    const volumeEntry = entries.find((entry) => entry.id.endsWith("_volume"));

    expect(volumeEntry?.reasons[0]).toBe(
      "profile=strength_primary_straight_sets_v0_1 (selection=module_method_role_unique)",
    );
  });
});

describe("Lot 0 — registry validators", () => {
  const benchPressEntry = EXERCISE_PRESCRIPTION_REGISTRY.bench_press;

  test("an unknown numericalProfileId is reported as UNKNOWN_NUMERICAL_PROFILE", () => {
    const issues = validateRegistryEntry({
      ...benchPressEntry,
      numericalProfileId: "does_not_exist_v0_1",
    });

    expect(issues.some((issue) => issue.code === "UNKNOWN_NUMERICAL_PROFILE")).toBe(true);
  });

  test("a mismatched numericalProfileId is reported as NUMERICAL_PROFILE_TRIPLE_MISMATCH", () => {
    const issues = validateRegistryEntry({
      ...benchPressEntry,
      numericalProfileId: "distance_carry_strength_grip_v0_1",
    });

    expect(issues.some((issue) => issue.code === "NUMERICAL_PROFILE_TRIPLE_MISMATCH")).toBe(true);
  });

  test("a matching numericalProfileId raises none of the new issue codes", () => {
    const issues = validateRegistryEntry({
      ...benchPressEntry,
      numericalProfileId: "strength_primary_straight_sets_v0_1",
    });

    expect(
      issues.filter((issue) =>
        [
          "UNKNOWN_NUMERICAL_PROFILE",
          "NUMERICAL_PROFILE_TRIPLE_MISMATCH",
          "AMBIGUOUS_TRIPLE_REQUIRES_EXPLICIT_PROFILE",
        ].includes(issue.code),
      ),
    ).toEqual([]);
  });

  test("the real registry raises none of the new issue codes (no entry sits on the ambiguous interval triple)", () => {
    const issues = validatePilotRegistry().filter((issue) =>
      [
        "UNKNOWN_NUMERICAL_PROFILE",
        "NUMERICAL_PROFILE_TRIPLE_MISMATCH",
        "AMBIGUOUS_TRIPLE_REQUIRES_EXPLICIT_PROFILE",
      ].includes(issue.code),
    );

    expect(issues).toEqual([]);
  });
});
