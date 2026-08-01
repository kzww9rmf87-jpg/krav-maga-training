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

/**
 * Entries integrated after Lot 0, which legitimately DO declare an explicit
 * `numericalProfileId`. The freeze table above must never grow to include
 * them: it guards pre-Lot-0 behavior, and an entry using explicit selection
 * has no pre-Lot-0 behavior to preserve.
 */
const EXPLICIT_PROFILE_BY_EXERCISE: Readonly<Record<string, string>> = {
  // Registry Lot 5 — the first entry on the ambiguous
  // (conditioning, work_rest_intervals, conditioning) triple.
  rowerg_intervals: "conditioning_long_intervals_v0_1",
  // Registry Lot 6 — second entry on the same triple, resolving to a
  // DIFFERENT profile. This pair is the reason explicit selection exists:
  // the triple alone could never have told them apart.
  sprint_intervals: "repeated_sprint_intervals_v0_1",
  // Registry Lot 7 — Core repetition work. Its triple
  // (core, straight_sets_repetitions, robustness) is UNIQUE, so implicit
  // resolution would already select the right profile; the id is declared
  // anyway because this entry is the profile's first consumer and the
  // selection is worth stating rather than inferring. The assertions below
  // therefore still hold: explicit selection resolves it, and the
  // "implicit resolution must be ambiguous" check is scoped to the
  // genuinely ambiguous triple.
  ab_wheel: "core_robustness_straight_sets_v0_1",
  // Registry Lot 8 — second entry on that same unique Core repetition
  // triple, declaring the id for the same auditability reason.
  dead_bug: "core_robustness_straight_sets_v0_1",
  // Registry Lot 9 — third entry on that same unique Core repetition
  // triple, declaring the id for the same auditability reason.
  hanging_leg_raise: "core_robustness_straight_sets_v0_1",
  // Registry Lot 10 — first entry on the Grip isometric triple, which is
  // also unique; the id is declared for the same auditability reason.
  plate_pinch: "timed_isometric_grip_v0_1",
  // Registry Lot 11 — third entry on the ambiguous interval triple, and the
  // first consumer of Table Group 14's own INT-POWER profile. Its triple is
  // now shared by four profiles, so the explicit id is mandatory, not
  // merely auditable.
  heavy_bag_power_intervals: "power_intervals_v0_1",
  // Registry Lot 12 — fourth entry on the ambiguous interval triple and the
  // second consumer of INT-POWER. Two entries now share one profile on that
  // triple, which the explicit id still keeps auditable.
  battle_ropes: "power_intervals_v0_1",
};

/**
 * Entries whose triple is genuinely shared by several profiles. For these,
 * dropping the explicit id must fail with NUMERICAL_PROFILE_AMBIGUOUS —
 * that is the whole reason they declare one.
 */
const AMBIGUOUS_TRIPLE_EXERCISES: readonly string[] = [
  "rowerg_intervals",
  "sprint_intervals",
  "heavy_bag_power_intervals",
  "battle_ropes",
];

const historicalEntries = () =>
  Object.values(EXERCISE_PRESCRIPTION_REGISTRY).filter(
    (entry) => !(entry.exerciseId in EXPLICIT_PROFILE_BY_EXERCISE),
  );

describe("Lot 0 — 59-entry profile freeze", () => {
  test("the frozen table covers exactly the historical registry entries", () => {
    expect(Object.keys(FROZEN_PROFILE_BY_EXERCISE)).toHaveLength(59);
    expect(Object.keys(FROZEN_PROFILE_BY_EXERCISE).sort()).toEqual(
      historicalEntries()
        .map((entry) => entry.exerciseId)
        .sort(),
    );
    // Every registry entry is accounted for by exactly one of the two tables.
    expect(
      Object.keys(FROZEN_PROFILE_BY_EXERCISE).length +
        Object.keys(EXPLICIT_PROFILE_BY_EXERCISE).length,
    ).toBe(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).length);
  });

  test("no historical entry declares an explicit numericalProfileId", () => {
    for (const entry of historicalEntries()) {
      expect(entry.numericalProfileId ?? null).toBeNull();
    }
  });

  test("every historical entry resolves the exact pre-Lot-0 profile via the unique-triple path", () => {
    for (const entry of historicalEntries()) {
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

  test("every post-Lot-0 entry declares its profile and resolves through the explicit path", () => {
    for (const [exerciseId, profileId] of Object.entries(EXPLICIT_PROFILE_BY_EXERCISE)) {
      const entry =
        EXERCISE_PRESCRIPTION_REGISTRY[exerciseId as keyof typeof EXERCISE_PRESCRIPTION_REGISTRY];

      expect(entry.numericalProfileId).toBe(profileId);

      const resolution = resolveNumericalProfile({
        moduleId: entry.moduleId,
        methodId: entry.explicitMethodId,
        exerciseRole: entry.role,
        explicitProfileId: entry.numericalProfileId ?? null,
      });

      expect(resolution.ok).toBe(true);
      if (!resolution.ok) continue;
      expect(resolution.profile.profileId).toBe(profileId);
      expect(resolution.resolutionSource).toBe("explicit_profile_id");

      // For an entry sitting on a genuinely shared triple, dropping the
      // explicit id must refuse to resolve — that is precisely why the
      // entry has to declare one. An entry on a unique triple declares its
      // id for auditability instead, and still resolves without it.
      const implicit = resolveNumericalProfile({
        moduleId: entry.moduleId,
        methodId: entry.explicitMethodId,
        exerciseRole: entry.role,
      });

      if (AMBIGUOUS_TRIPLE_EXERCISES.includes(exerciseId)) {
        expect(implicit.ok).toBe(false);
        if (implicit.ok) continue;
        expect(implicit.failureCode).toBe("NUMERICAL_PROFILE_AMBIGUOUS");
      } else {
        expect(implicit.ok).toBe(true);
        if (!implicit.ok) continue;
        expect(implicit.profile.profileId).toBe(profileId);
      }
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
          "NON_EXECUTABLE_NUMERICAL_PROFILE",
        ].includes(issue.code),
      ),
    ).toEqual([]);
  });

  test("the real registry raises none of the new issue codes (the one entry on the ambiguous interval triple declares its profile explicitly)", () => {
    const issues = validatePilotRegistry().filter((issue) =>
      [
        "UNKNOWN_NUMERICAL_PROFILE",
        "NUMERICAL_PROFILE_TRIPLE_MISMATCH",
        "AMBIGUOUS_TRIPLE_REQUIRES_EXPLICIT_PROFILE",
        "NON_EXECUTABLE_NUMERICAL_PROFILE",
      ].includes(issue.code),
    );

    expect(issues).toEqual([]);
  });
});
