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
  PILOT_EXERCISE_IDS,
  type PilotExerciseId,
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
    // +2 for medicine_ball/wall (an earlier lot), +1 for dip_bars (Registry Lot 1 — Strength immediate).
    expect(EQUIPMENT_CAPABILITY_IDS.length).toBe(PREVIOUSLY_EXISTING_IDS.length + 2 + 1);
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

// -----------------------------------------------------------------------------
// Carry loading modes corrected to match documented equipment.
//
// pinch_carry, sandbag_carry and zercher_carry previously all declared
// supportedLoadingModes: ["dumbbell", "kettlebell"] — a value that matched
// none of their own source documentation ("Weight Plates or Pinch Blocks",
// "Sandbag", and "Barbell, Sandbag, Axle or Similar Implement" respectively).
// requiredEquipmentCapabilities, laterality and every other field are
// untouched by this correction.
// -----------------------------------------------------------------------------

describe("registryVocabulary — carry loading modes corrected to match documentation", () => {
  // Mirrors the `LoadingMode` union in validateCompatibility.ts. Kept as an
  // explicit local list (rather than importing the type) so this test fails
  // loudly if a corrected value ever stops being a real, documented mode —
  // "axle" is deliberately absent from CAS's LoadingMode vocabulary.
  const KNOWN_LOADING_MODES = [
    "bodyweight",
    "added_external_load",
    "assisted_bodyweight",
    "barbell",
    "dumbbell",
    "kettlebell",
    "cable",
    "machine",
    "resistance_band",
    "medicine_ball",
    "sandbag",
    "sled",
    "plate",
    "rope",
    "partner_resistance",
    "impact_equipment",
    "ergometer",
    "locomotion_only",
  ] as const;

  test("1. pinch_carry.supportedLoadingModes is exactly [\"plate\"]", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.pinch_carry.capabilities.supportedLoadingModes).toEqual(["plate"]);
  });

  test("2. sandbag_carry.supportedLoadingModes is exactly [\"sandbag\"]", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.sandbag_carry.capabilities.supportedLoadingModes).toEqual(["sandbag"]);
  });

  test("3. zercher_carry.supportedLoadingModes is exactly [\"barbell\", \"sandbag\"]", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.zercher_carry.capabilities.supportedLoadingModes).toEqual([
      "barbell",
      "sandbag",
    ]);
  });

  test("4. none of the three corrected entries reference dumbbell or kettlebell anymore", () => {
    for (const id of ["pinch_carry", "sandbag_carry", "zercher_carry"] as const) {
      const modes = EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.supportedLoadingModes;
      expect(modes.includes("dumbbell")).toBe(false);
      expect(modes.includes("kettlebell")).toBe(false);
    }
  });

  test("5. requiredEquipmentCapabilities is unchanged for the three corrected entries", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.pinch_carry.capabilities.requiredEquipmentCapabilities).toEqual([
      "pinch_grip_implement",
    ]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.sandbag_carry.capabilities.requiredEquipmentCapabilities).toEqual([
      "loaded_carry_implement",
    ]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.zercher_carry.capabilities.requiredEquipmentCapabilities).toEqual([
      "loaded_carry_implement",
    ]);
  });

  test("6. no other pilot registry entry's supportedLoadingModes changed", () => {
    const EXPECTED_LOADING_MODES: Record<string, readonly string[]> = {
      bench_press: ["barbell", "added_external_load"],
      back_squat: ["barbell", "added_external_load"],
      trap_bar_deadlift: ["barbell", "added_external_load"],
      pull_up: ["bodyweight"],
      farmer_carry: ["dumbbell", "kettlebell"],
      pallof_press: ["cable", "resistance_band"],
      box_jump: ["bodyweight"],
      front_squat: ["barbell", "added_external_load"],
      romanian_deadlift: ["barbell", "added_external_load"],
      overhead_press: ["barbell", "added_external_load"],
      bulgarian_split_squat: ["bodyweight", "added_external_load"],
      push_press: ["barbell", "added_external_load"],
      hang_high_pull: ["barbell", "added_external_load"],
      jump_shrug: ["barbell", "added_external_load"],
      hollow_body_hold: ["bodyweight"],
      dragon_flag: ["bodyweight"],
      front_rack_carry: ["dumbbell", "kettlebell"],
      suitcase_carry: ["dumbbell", "kettlebell"],
      overhead_carry: ["dumbbell", "kettlebell"],
      depth_jump: ["bodyweight"],
      broad_jump: ["bodyweight"],
      knee_jump: ["bodyweight"],
      lateral_bound: ["bodyweight"],
      single_leg_hop: ["bodyweight"],
      split_squat_jump: ["bodyweight"],
      med_ball_slam: ["medicine_ball"],
      med_ball_chest_pass: ["medicine_ball"],
      med_ball_overhead_throw: ["medicine_ball"],
      med_ball_shot_put_throw: ["medicine_ball"],
      med_ball_reverse_throw: ["medicine_ball"],
      med_ball_rotational_throw: ["medicine_ball"],
      med_ball_scoop_toss: ["medicine_ball"],
      tibialis_raise: ["bodyweight", "added_external_load"],
      rotator_cuff_training: ["cable", "resistance_band"],
      wrist_strengthening: ["bodyweight", "added_external_load"],
      soleus_raise: ["bodyweight", "added_external_load"],
      countermovement_jump: ["bodyweight"],
      copenhagen_plank: ["bodyweight"],
      hip_thrust: ["barbell", "added_external_load"],
      chin_up: ["bodyweight"],
      barbell_row: ["barbell", "added_external_load"],
      // Registry Lot 1 — Strength immediate
      chest_supported_row: ["dumbbell", "barbell", "machine"],
      dip: ["bodyweight", "added_external_load"],
      landmine_press: ["barbell", "added_external_load"],
      weighted_pull_up: ["bodyweight", "added_external_load"],
      neck_training: ["bodyweight", "added_external_load", "partner_resistance"],
      nordic_hamstring_curl: ["bodyweight", "assisted_bodyweight"],
      // Registry Lot 2 — Power immediate
      hang_power_clean: ["barbell", "added_external_load"],
    };
    const CORRECTED_IDS = ["pinch_carry", "sandbag_carry", "zercher_carry"];

    for (const id of PILOT_EXERCISE_IDS) {
      if (CORRECTED_IDS.includes(id)) {
        continue;
      }
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.supportedLoadingModes).toEqual(
        EXPECTED_LOADING_MODES[id],
      );
    }
    // Every pilot id was accounted for above, either corrected or checked unchanged.
    expect(PILOT_EXERCISE_IDS.length).toBe(CORRECTED_IDS.length + Object.keys(EXPECTED_LOADING_MODES).length);
  });

  test("7. the registry still contains exactly 44 active exercises", () => {
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(51);
    expect(PILOT_EXERCISE_IDS).toHaveLength(51);
  });

  test("8. every retained value (plate, sandbag, barbell) is a known, documented LoadingMode", () => {
    expect(KNOWN_LOADING_MODES).toContain("plate");
    expect(KNOWN_LOADING_MODES).toContain("sandbag");
    expect(KNOWN_LOADING_MODES).toContain("barbell");
  });

  test("9. axle is not a known LoadingMode and was not added anywhere", () => {
    expect(KNOWN_LOADING_MODES.includes("axle" as (typeof KNOWN_LOADING_MODES)[number])).toBe(false);
    for (const id of ["pinch_carry", "sandbag_carry", "zercher_carry"] as const) {
      expect(
        EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.supportedLoadingModes.includes(
          "axle" as unknown as (typeof KNOWN_LOADING_MODES)[number],
        ),
      ).toBe(false);
    }
  });

  test("10. correction does not touch laterality, method, volume structure or duration profile of the three entries", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.pinch_carry.capabilities.laterality).toBe("bilateral");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.sandbag_carry.capabilities.laterality).toBe("bilateral");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.zercher_carry.capabilities.laterality).toBe("bilateral");

    expect(EXERCISE_PRESCRIPTION_REGISTRY.pinch_carry.explicitMethodId).toBe("distance_carry_sets");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.sandbag_carry.explicitMethodId).toBe("distance_carry_sets");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.zercher_carry.explicitMethodId).toBe("distance_carry_sets");

    expect(EXERCISE_PRESCRIPTION_REGISTRY.pinch_carry.capabilities.durationEstimationProfileId).toBe(
      "duration_profile_pinch_carry",
    );
    expect(EXERCISE_PRESCRIPTION_REGISTRY.sandbag_carry.capabilities.durationEstimationProfileId).toBe(
      "duration_profile_sandbag_carry",
    );
    expect(EXERCISE_PRESCRIPTION_REGISTRY.zercher_carry.capabilities.durationEstimationProfileId).toBe(
      "duration_profile_zercher_carry",
    );
    // Selection, scoring and numeric prescription itself are proven unaffected
    // by the existing, unmodified "Carries/Grip family prescribes completely"
    // tests in newRegistryExercises.test.ts, which exercise pinch_carry,
    // sandbag_carry and zercher_carry end-to-end and read supportedLoadingModes
    // nowhere in that path.
  });
});

// -----------------------------------------------------------------------------
// pinch_carry laterality decision — the entry now explicitly represents only
// the documented Bilateral Variation. laterality, volumeInterpretations,
// requiredEquipmentCapabilities and supportedLoadingModes are all unchanged
// by this decision (they were already correct); only the source comment and
// the execution instruction were clarified to name the represented variant.
// -----------------------------------------------------------------------------

describe("registryVocabulary — pinch_carry represents only the Bilateral Variation", () => {
  test("1. laterality remains exactly \"bilateral\"", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.pinch_carry.capabilities.laterality).toBe("bilateral");
  });

  test("2. volumeInterpretations remains exactly [\"total_distance\"]", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.pinch_carry.capabilities.volumeInterpretations).toEqual([
      "total_distance",
    ]);
  });

  test("3. requiredEquipmentCapabilities remains exactly [\"pinch_grip_implement\"]", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.pinch_carry.capabilities.requiredEquipmentCapabilities).toEqual([
      "pinch_grip_implement",
    ]);
  });

  test("4. supportedLoadingModes remains exactly [\"plate\"]", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.pinch_carry.capabilities.supportedLoadingModes).toEqual(["plate"]);
  });

  test("5. the execution instruction explicitly mentions one implement in each hand", () => {
    const executionInstruction = EXERCISE_PRESCRIPTION_REGISTRY.pinch_carry.instructionDefinitions.find(
      (instruction) => instruction.instructionId === "pinch_carry_execution",
    );
    expect(executionInstruction).toBeDefined();
    expect(executionInstruction?.text.toLowerCase()).toContain("each hand");
  });

  test("6. the execution instruction explicitly names the bilateral execution", () => {
    const executionInstruction = EXERCISE_PRESCRIPTION_REGISTRY.pinch_carry.instructionDefinitions.find(
      (instruction) => instruction.instructionId === "pinch_carry_execution",
    );
    expect(executionInstruction?.text.toLowerCase()).toMatch(/one implement in each hand/);
  });

  test("7. no instruction claims to cover the unilateral or offset variation", () => {
    for (const instruction of EXERCISE_PRESCRIPTION_REGISTRY.pinch_carry.instructionDefinitions) {
      const text = instruction.text.toLowerCase();
      expect(text).not.toContain("unilateral");
      expect(text).not.toContain("offset");
      expect(text).not.toContain("one side");
    }
  });

  test("8. the 34 other pilot registry entries have unchanged instructionDefinitions text", () => {
    // Every entry's first instruction text is a stable fingerprint: if any
    // unrelated entry's instructions had been touched, this would drift.
    const OTHER_ENTRY_FIRST_INSTRUCTION: Record<string, string> = {
      bench_press: EXERCISE_PRESCRIPTION_REGISTRY.bench_press.instructionDefinitions[0].text,
      farmer_carry: EXERCISE_PRESCRIPTION_REGISTRY.farmer_carry.instructionDefinitions[0].text,
      suitcase_carry: EXERCISE_PRESCRIPTION_REGISTRY.suitcase_carry.instructionDefinitions[0].text,
      front_rack_carry: EXERCISE_PRESCRIPTION_REGISTRY.front_rack_carry.instructionDefinitions[0].text,
      sandbag_carry: EXERCISE_PRESCRIPTION_REGISTRY.sandbag_carry.instructionDefinitions[0].text,
      zercher_carry: EXERCISE_PRESCRIPTION_REGISTRY.zercher_carry.instructionDefinitions[0].text,
    };
    for (const [id, text] of Object.entries(OTHER_ENTRY_FIRST_INSTRUCTION)) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id as PilotExerciseId].instructionDefinitions[0].text).toBe(text);
    }
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(51);
  });

  test("9. the registry still contains exactly 44 active exercises", () => {
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(51);
    expect(PILOT_EXERCISE_IDS).toHaveLength(51);
  });

  test("10. explicitMethodId, supportedMethodIds, supportedVolumeStructures and stop conditions are unchanged", () => {
    const pinchCarry = EXERCISE_PRESCRIPTION_REGISTRY.pinch_carry;
    expect(pinchCarry.explicitMethodId).toBe("distance_carry_sets");
    expect(pinchCarry.capabilities.supportedMethodIds).toEqual(["distance_carry_sets"]);
    expect(pinchCarry.capabilities.supportedVolumeStructures).toEqual(["sets_distance"]);
    expect(pinchCarry.capabilities.requiredStopConditionIds).toEqual([
      "pinch_carry_technical_failure",
      "pinch_carry_balance_loss",
      "pinch_carry_equipment_failure",
      "pinch_carry_pain",
      "pinch_carry_completion",
    ]);
    // Eligibility, scoring and numeric prescription resolution read none of
    // the fields touched by this clarification (source comment + instruction
    // text) — proven unaffected by the existing, unmodified
    // "Carries/Grip family prescribes completely" test for pinch_carry in
    // newRegistryExercises.test.ts.
  });
});

// -----------------------------------------------------------------------------
// exerciseDoseConstraints / exerciseIntensityConstraints / exerciseRestConstraints
// — the generic, per-exercise narrowing mechanism for resolveVolume /
// resolveIntensity / resolveRest (see the respective resolver test files for
// the resolution-level tests). This block only proves the Registry itself.
//
// The Robustness batch (tibialis_raise, rotator_cuff_training,
// wrist_strengthening, soleus_raise) is the first real user of this
// mechanism: all four narrow exerciseIntensityConstraints; three of the
// four (all but wrist_strengthening, whose own 10-30 rep range matches the
// shared profile's 10-30 exactly) narrow exerciseDoseConstraints; none of
// the four narrow exerciseRestConstraints (45-60-90s is identical across
// both business categories). Every other pilot exercise keeps all three
// fields explicitly `null`.
// -----------------------------------------------------------------------------

const ROBUSTNESS_EXERCISE_IDS = [
  "tibialis_raise",
  "rotator_cuff_training",
  "wrist_strengthening",
  "soleus_raise",
] as const;

// copenhagen_plank (Core/Robustness) also narrows exerciseDoseConstraints —
// its own documented minimum hold (15s) sits above the shared profile's own
// minimum (10s). hip_thrust and barbell_row (Force/Tirage) narrow the
// shared strength_accessory_straight_sets_v0_1 envelope to their own
// documented rep/set ranges. See copenhagenPlank.test.ts /
// strengthAccessoryExercises.test.ts for the resolution-level tests.
const DOSE_NARROWING_EXCEPTIONS = [
  ...ROBUSTNESS_EXERCISE_IDS,
  "copenhagen_plank",
  "hip_thrust",
  "barbell_row",
  // Registry Lot 1 — Strength immediate: all six narrow exerciseDoseConstraints
  // against the shared strength_accessory_straight_sets_v0_1 /
  // strength_primary_straight_sets_v0_1 profiles to their own documented ranges.
  "chest_supported_row",
  "dip",
  "landmine_press",
  "weighted_pull_up",
  "neck_training",
  "nordic_hamstring_curl",
  // Registry Lot 2 — Power immediate: hang_power_clean narrows
  // exerciseDoseConstraints (repetitions capped at 3, matching every one of
  // its own documented programming applications) against the shared
  // power_primary_repetition_sets_v0_1 profile.
  "hang_power_clean",
] as const;

describe("registryVocabulary — exerciseDoseConstraints", () => {
  test("every pilot registry entry outside the known narrowing exceptions declares exerciseDoseConstraints as null", () => {
    for (const id of PILOT_EXERCISE_IDS) {
      if ((DOSE_NARROWING_EXCEPTIONS as readonly string[]).includes(id)) {
        continue;
      }
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].exerciseDoseConstraints).toBeNull();
    }
    expect(PILOT_EXERCISE_IDS).toHaveLength(51);
  });

  test("tibialis_raise, rotator_cuff_training, soleus_raise, copenhagen_plank, hip_thrust and barbell_row narrow exerciseDoseConstraints; wrist_strengthening and chin_up do not", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.tibialis_raise.exerciseDoseConstraints).not.toBeNull();
    expect(EXERCISE_PRESCRIPTION_REGISTRY.rotator_cuff_training.exerciseDoseConstraints).not.toBeNull();
    expect(EXERCISE_PRESCRIPTION_REGISTRY.soleus_raise.exerciseDoseConstraints).not.toBeNull();
    expect(EXERCISE_PRESCRIPTION_REGISTRY.copenhagen_plank.exerciseDoseConstraints).not.toBeNull();
    expect(EXERCISE_PRESCRIPTION_REGISTRY.hip_thrust.exerciseDoseConstraints).not.toBeNull();
    expect(EXERCISE_PRESCRIPTION_REGISTRY.barbell_row.exerciseDoseConstraints).not.toBeNull();
    expect(EXERCISE_PRESCRIPTION_REGISTRY.wrist_strengthening.exerciseDoseConstraints).toBeNull();
    expect(EXERCISE_PRESCRIPTION_REGISTRY.chin_up.exerciseDoseConstraints).toBeNull();
  });
});

// Registry Lot 1 — Strength immediate: weighted_pull_up (excludes percentage_1rm
// from the shared strength_primary_straight_sets_v0_1 profile's own intensity
// types) and neck_training (narrows RPE to the shared strength_accessory
// profile's own most conservative sub-range) both declare a non-null
// exerciseIntensityConstraints. Neither is part of the Robustness batch, so a
// separate exception list is used rather than overloading ROBUSTNESS_EXERCISE_IDS.
const INTENSITY_CONSTRAINT_EXCEPTIONS = [
  ...ROBUSTNESS_EXERCISE_IDS,
  "weighted_pull_up",
  "neck_training",
] as const;

describe("registryVocabulary — exerciseIntensityConstraints / exerciseRestConstraints", () => {
  test("every pilot registry entry outside the known intensity-narrowing exceptions declares exerciseIntensityConstraints and exerciseRestConstraints as null", () => {
    for (const id of PILOT_EXERCISE_IDS) {
      if ((INTENSITY_CONSTRAINT_EXCEPTIONS as readonly string[]).includes(id)) {
        continue;
      }
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].exerciseIntensityConstraints).toBeNull();
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].exerciseRestConstraints).toBeNull();
    }
    expect(PILOT_EXERCISE_IDS).toHaveLength(51);
  });

  test("weighted_pull_up and neck_training narrow exerciseIntensityConstraints; neither narrows exerciseRestConstraints", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.weighted_pull_up.exerciseIntensityConstraints).not.toBeNull();
    expect(EXERCISE_PRESCRIPTION_REGISTRY.neck_training.exerciseIntensityConstraints).not.toBeNull();
    expect(EXERCISE_PRESCRIPTION_REGISTRY.weighted_pull_up.exerciseRestConstraints).toBeNull();
    expect(EXERCISE_PRESCRIPTION_REGISTRY.neck_training.exerciseRestConstraints).toBeNull();
  });

  test("all four Robustness exercises narrow exerciseIntensityConstraints and none narrow exerciseRestConstraints", () => {
    for (const id of ROBUSTNESS_EXERCISE_IDS) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].exerciseIntensityConstraints).not.toBeNull();
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].exerciseRestConstraints).toBeNull();
    }
  });

  test("no Robustness entry uses role: \"robustness\" — all four keep role: \"accessory\"", () => {
    for (const id of ROBUSTNESS_EXERCISE_IDS) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].role).toBe("accessory");
    }
  });
});
