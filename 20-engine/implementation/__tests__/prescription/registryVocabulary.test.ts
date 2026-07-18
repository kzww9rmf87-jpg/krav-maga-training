import { describe, expect, test } from "vitest";

import {
  EQUIPMENT_CAPABILITY_GROUPS,
  EQUIPMENT_CAPABILITY_IDS,
  findUnknownEquipmentCapabilities,
  getEquipmentCapabilityGroups,
  isEquipmentCapabilityId,
} from "../../prescription/equipmentCapabilities";
import { ATHLETE_REFERENCE_CATALOG, isKnownAthleteReferenceType } from "../../prescription/athleteReferenceCatalog";
import {
  DURATION_ESTIMATION_PROFILES,
  getDurationEstimationProfile,
} from "../../prescription/durationEstimationProfiles";
import { isValidSourceRuleId } from "../../prescription/sourceRuleIdentifiers";
import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  getExercisePrescriptionSource,
  type PrescriptionExecutionContext,
} from "../../prescription/exercisePrescriptionRegistry";
import { validatePilotRegistry, validateRegistryEntry } from "../../prescription/registryValidators";

describe("registryVocabulary — equipment capabilities", () => {
  test("1. the canonical equipment list has no duplicate identifiers", () => {
    expect(new Set(EQUIPMENT_CAPABILITY_IDS).size).toBe(EQUIPMENT_CAPABILITY_IDS.length);
  });

  test("2. an unknown equipment identifier is rejected", () => {
    expect(isEquipmentCapabilityId("made_up_equipment")).toBe(false);
    expect(findUnknownEquipmentCapabilities(["barbell", "made_up_equipment"])).toEqual(["made_up_equipment"]);
  });

  test("3. equipment groupings are deterministic", () => {
    expect(getEquipmentCapabilityGroups("plates")).toEqual(getEquipmentCapabilityGroups("plates"));
    expect(getEquipmentCapabilityGroups("plates")).toContain("barbell_strength");
    expect(getEquipmentCapabilityGroups("loaded_carry_implement")).toContain("carry_implements");

    // Every id referenced by a group is itself canonical.
    for (const group of Object.values(EQUIPMENT_CAPABILITY_GROUPS)) {
      for (const capabilityId of group) {
        expect(isEquipmentCapabilityId(capabilityId)).toBe(true);
      }
    }
  });

  test("4. every pilot exercise's required equipment is drawn from the canonical vocabulary", () => {
    for (const entry of Object.values(EXERCISE_PRESCRIPTION_REGISTRY)) {
      expect(findUnknownEquipmentCapabilities(entry.capabilities.requiredEquipmentCapabilities)).toEqual([]);
    }
  });

  test("11. no ad hoc equipment identifier remains in the pilot registry", () => {
    const issues = validatePilotRegistry().filter((issue) => issue.code === "UNKNOWN_EQUIPMENT_CAPABILITY");
    expect(issues).toEqual([]);
  });

  // -----------------------------------------------------------------------------
  // medicine_ball / wall — added for the Ballistics family re-audit.
  // -----------------------------------------------------------------------------

  test("medicine_ball is recognized as a valid canonical equipment capability", () => {
    expect(isEquipmentCapabilityId("medicine_ball")).toBe(true);
    expect(EQUIPMENT_CAPABILITY_IDS).toContain("medicine_ball");
    expect(findUnknownEquipmentCapabilities(["medicine_ball"])).toEqual([]);
  });

  test("wall is recognized as a valid canonical equipment capability", () => {
    expect(isEquipmentCapabilityId("wall")).toBe(true);
    expect(EQUIPMENT_CAPABILITY_IDS).toContain("wall");
    expect(findUnknownEquipmentCapabilities(["wall"])).toEqual([]);
  });

  test("slam_ball and medicine_ball are distinct identifiers with no automatic conversion or substitution", () => {
    // 1. The two identifiers are different.
    expect("slam_ball").not.toBe("medicine_ball");
    expect(EQUIPMENT_CAPABILITY_IDS.filter((id) => id === "slam_ball" || id === "medicine_ball")).toEqual([
      "slam_ball",
      "medicine_ball",
    ]);

    // 2. No automatic conversion: each id is validated and reported independently —
    // supplying one never causes the other to be treated as present.
    expect(findUnknownEquipmentCapabilities(["medicine_ball"])).toEqual([]);
    expect(findUnknownEquipmentCapabilities(["slam_ball"])).toEqual([]);
    expect(
      EXERCISE_PRESCRIPTION_REGISTRY.med_ball_slam.capabilities.requiredEquipmentCapabilities.includes(
        "medicine_ball",
      ),
    ).toBe(false);
    expect(
      EXERCISE_PRESCRIPTION_REGISTRY.med_ball_slam.capabilities.requiredEquipmentCapabilities.includes("slam_ball"),
    ).toBe(true);

    // 3. No substitution mechanism exists: `EQUIPMENT_CAPABILITY_GROUPS` co-membership
    // (checked separately above, in "equipment groupings are deterministic") is purely
    // informational and is never consulted by equipment validation — proven functionally
    // here by showing that supplying medicine_ball (but not slam_ball) as available
    // equipment still fails med_ball_slam's requirement, exactly like supplying nothing.
    const context: PrescriptionExecutionContext = {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["medicine_ball", "safe_landing_surface"], // medicine_ball, not slam_ball
    };
    const result = getExercisePrescriptionSource("med_ball_slam", context);
    if (result.ok) {
      throw new Error("Expected medicine_ball to NOT satisfy med_ball_slam's slam_ball requirement.");
    }
    expect(result.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
    expect(result.message).toContain("slam_ball");
  });

  test("every previously-existing equipment identifier is still present and valid after the addition", () => {
    const PREVIOUSLY_EXISTING_IDS = [
      "barbell",
      "bench",
      "rack",
      "plates",
      "pull_up_bar",
      "cable_machine",
      "resistance_band",
      "dumbbell",
      "kettlebell",
      "open_space",
      "trap_bar",
      "plyometric_box",
      "loaded_carry_implement",
      "cable_or_band_resistance",
      "safe_landing_surface",
      "rigid_anchor_support",
      "pinch_grip_implement",
      "knee_protection_pad",
      "slam_ball",
    ] as const;

    for (const id of PREVIOUSLY_EXISTING_IDS) {
      expect(isEquipmentCapabilityId(id)).toBe(true);
    }
    expect(EQUIPMENT_CAPABILITY_IDS.length).toBe(PREVIOUSLY_EXISTING_IDS.length + 2);
  });

  test("an unknown equipment identifier is still rejected after the addition", () => {
    expect(isEquipmentCapabilityId("made_up_ballistics_equipment")).toBe(false);
    expect(findUnknownEquipmentCapabilities(["medicine_ball", "wall", "made_up_ballistics_equipment"])).toEqual([
      "made_up_ballistics_equipment",
    ]);
  });

  test("adding medicine_ball/wall as vocabulary changed no prescription that predates them", () => {
    // Scoped to the 30 entries that existed when medicine_ball/wall were added
    // as pure vocabulary (the 29 pre-Ballistics entries + med_ball_slam,
    // which uses slam_ball, not medicine_ball/wall). The six throw-variant
    // entries that deliberately use medicine_ball/wall were integrated across
    // two later, separate steps (see ballisticExercises.test.ts) and are
    // excluded from this non-regression check by design, not by oversight.
    const PRE_MEDICINE_BALL_INTEGRATION_IDS = [
      "med_ball_chest_pass",
      "med_ball_overhead_throw",
      "med_ball_shot_put_throw",
      "med_ball_reverse_throw",
      "med_ball_rotational_throw",
      "med_ball_scoop_toss",
    ];
    for (const [id, entry] of Object.entries(EXERCISE_PRESCRIPTION_REGISTRY)) {
      if (PRE_MEDICINE_BALL_INTEGRATION_IDS.includes(id)) {
        continue;
      }
      expect(entry.capabilities.requiredEquipmentCapabilities.includes("medicine_ball")).toBe(false);
      expect(entry.capabilities.requiredEquipmentCapabilities.includes("wall")).toBe(false);
    }
    // med_ball_slam's own requirement is unchanged by this addition.
    expect(EXERCISE_PRESCRIPTION_REGISTRY.med_ball_slam.capabilities.requiredEquipmentCapabilities).toEqual([
      "slam_ball",
      "safe_landing_surface",
    ]);
  });

  test("prescription execution contexts and capability lists correctly accept medicine_ball and wall", () => {
    const context: PrescriptionExecutionContext = {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["medicine_ball", "wall"],
    };
    expect(findUnknownEquipmentCapabilities(context.availableEquipmentCapabilities)).toEqual([]);

    const hypotheticalRequirement: readonly string[] = ["medicine_ball", "wall"];
    expect(findUnknownEquipmentCapabilities(hypotheticalRequirement)).toEqual([]);
    for (const id of hypotheticalRequirement) {
      expect(context.availableEquipmentCapabilities.includes(id)).toBe(true);
    }
  });
});

describe("registryVocabulary — athlete references", () => {
  test("5. the athlete reference catalog covers exactly the documented IntensityReferenceType values", () => {
    // one_rep_max, training_max, body_mass, max_heart_rate,
    // heart_rate_reserve, max_aerobic_speed, baseline_velocity,
    // baseline_pace, equipment_setting.
    expect(ATHLETE_REFERENCE_CATALOG).toHaveLength(9);
    expect(ATHLETE_REFERENCE_CATALOG.filter((entry) => entry.usedByPilotRegistry)).toEqual([
      expect.objectContaining({ referenceType: "one_rep_max" }),
    ]);
  });

  test("6. an unknown athlete reference type is rejected", () => {
    expect(isKnownAthleteReferenceType("made_up_reference")).toBe(false);
    expect(isKnownAthleteReferenceType("one_rep_max")).toBe(true);
  });
});

describe("registryVocabulary — duration estimation profiles", () => {
  test("7. a known duration profile is found in the registry", () => {
    const profile = DURATION_ESTIMATION_PROFILES.duration_profile_bench_press;
    expect(profile).toBeDefined();
    expect(profile.exerciseId).toBe("bench_press");
    expect(profile.volumeStructure).toBe("sets_reps");
  });

  test("8. an unresolved duration profile is refused as usable", () => {
    const result = getDurationEstimationProfile("duration_profile_bench_press");

    if (result.ok) {
      throw new Error("Expected the bench press duration profile to be refused as unresolved.");
    }

    expect(result.failureCode).toBe("DURATION_PROFILE_UNRESOLVED");
    expect(result.profile?.status).toBe("unresolved");
  });

  test("9. no duration profile contains an invented timing value", () => {
    for (const profile of Object.values(DURATION_ESTIMATION_PROFILES)) {
      expect(profile.averageRepetitionSeconds).toBeNull();
      expect(profile.averageSetupSeconds).toBeNull();
      expect(profile.transitionSeconds).toBeNull();
      expect(profile.restSeconds).toBeNull();
      expect(profile.perSetSeconds).toBeNull();
      expect(profile.perRoundSeconds).toBeNull();
      expect(profile.perIntervalSeconds).toBeNull();
      expect(profile.technicalMarginSeconds).toBeNull();
    }
  });

  test("12. no pilot registry entry references an orphaned duration profile", () => {
    const issues = validatePilotRegistry().filter((issue) => issue.code === "UNKNOWN_DURATION_PROFILE");
    expect(issues).toEqual([]);
  });
});

describe("registryVocabulary — source rule identifiers", () => {
  test("every pilot entry's sourceRuleIds match a known convention", () => {
    for (const entry of Object.values(EXERCISE_PRESCRIPTION_REGISTRY)) {
      for (const sourceRuleId of entry.sourceRuleIds) {
        expect(isValidSourceRuleId(sourceRuleId)).toBe(true);
      }
    }
  });

  test("13. sourceRuleIds are never empty across the pilot registry", () => {
    const issues = validatePilotRegistry().filter((issue) => issue.code === "EMPTY_SOURCE_RULE_ID");
    expect(issues).toEqual([]);
  });
});

describe("registryVocabulary — full registry validation", () => {
  test("10. every pilot registry entry passes validation, aside from the expected unresolved duration profile", () => {
    const issues = validatePilotRegistry().filter((issue) => issue.code !== "UNRESOLVED_DURATION_PROFILE");
    expect(issues).toEqual([]);

    // Every entry still legitimately reports the expected, non-fatal gap.
    const unresolvedIssues = validatePilotRegistry().filter((issue) => issue.code === "UNRESOLVED_DURATION_PROFILE");
    expect(unresolvedIssues).toHaveLength(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).length);
  });

  test("validateRegistryEntry detects an impossible method/structure/equipment combination", () => {
    const benchPress = EXERCISE_PRESCRIPTION_REGISTRY.bench_press;
    const brokenEntry = {
      ...benchPress,
      capabilities: { ...benchPress.capabilities, supportedVolumeStructures: ["sets_duration" as const] },
    };

    const issues = validateRegistryEntry(brokenEntry);
    expect(issues.some((issue) => issue.code === "IMPOSSIBLE_METHOD_STRUCTURE_EQUIPMENT_COMBINATION")).toBe(true);
  });

  test("validateRegistryEntry detects an incoherent capability tag", () => {
    const benchPress = EXERCISE_PRESCRIPTION_REGISTRY.bench_press;
    const brokenEntry = {
      ...benchPress,
      capabilities: { ...benchPress.capabilities, capabilityTags: [] as const },
    };

    const issues = validateRegistryEntry(brokenEntry);
    expect(issues.some((issue) => issue.code === "INCOHERENT_CAPABILITY_TAG")).toBe(true);
  });

  test("14. determinism: validatePilotRegistry produces identical results across calls", () => {
    expect(validatePilotRegistry()).toEqual(validatePilotRegistry());
  });

  test("15. validators do not mutate the registry", () => {
    const snapshot = JSON.parse(JSON.stringify(EXERCISE_PRESCRIPTION_REGISTRY));

    validatePilotRegistry();

    expect(EXERCISE_PRESCRIPTION_REGISTRY).toEqual(snapshot);
  });
});
