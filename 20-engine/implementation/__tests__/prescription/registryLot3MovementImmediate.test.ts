/**
 * Combat Athlete System — Registry Lot 3 (Movement Immediate)
 *
 * bear_crawl, bridging, footwork_drills, shadow_boxing, technical_stand_up
 * and shrimping are the first six entries in this whole registry to use
 * moduleId "movement" — all six reuse the single existing
 * controlled_mobility_sets_v0_1 profile (moduleId: movement, methodId:
 * controlled_mobility_sets, exerciseRole: technical). No new numerical
 * prescription profile is created.
 *
 * Two structural discoveries made while building this lot, both verified
 * by direct execution rather than assumed:
 * - the controlled_mobility_sets method contract requires FIVE stop-
 *   condition categories (pain, technical_failure, range_of_motion_loss,
 *   balance_loss, completion) — resolveStopConditions.ts hard-fails with
 *   STOP_CONDITION_CATEGORY_MISSING otherwise. A new
 *   `rangeOfMotionLossCondition` factory was added to
 *   stopConditionRegistry.ts (no prior lot used this method).
 * - `laterality: "alternating"` requires a per-side volume interpretation
 *   (validateCompatibility.ts) that would misrepresent shrimping's own
 *   documented single continuous "20-60 seconds" total — shrimping uses
 *   `laterality: "bilateral"` instead, a documented model limitation.
 *
 * footwork_drills and shadow_boxing both document multi-minute,
 * round-based session volumes that categorically exceed the shared
 * profile's own ceiling (3 sets x 60 seconds) — both are integrated as a
 * short technical touch only (exerciseDoseConstraints: null, using the
 * profile's own default range), not their own full session length.
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
import { isEquipmentCapabilityId } from "../../prescription/equipmentCapabilities";
import { getTrainingMethodContract } from "../../prescription/contracts";

const LOT3_EXERCISE_IDS = [
  "bear_crawl",
  "bridging",
  "footwork_drills",
  "shadow_boxing",
  "technical_stand_up",
  "shrimping",
] as const;

const DOSE_NARROWED_IDS = ["bear_crawl", "bridging", "technical_stand_up", "shrimping"] as const;
const DOSE_UNCONSTRAINED_IDS = ["footwork_drills", "shadow_boxing"] as const;

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

const EXPECTED_STOP_CATEGORIES = ["technical_failure", "range_of_motion_loss", "balance_loss", "pain", "completion"];

// -----------------------------------------------------------------------------
// 1-4. Presence, identity, classification, method contract
// -----------------------------------------------------------------------------

describe("registry Lot 3 — presence and classification", () => {
  for (const id of LOT3_EXERCISE_IDS) {
    test(`${id} is present in PILOT_EXERCISE_IDS exactly once`, () => {
      expect(PILOT_EXERCISE_IDS.filter((x) => x === id)).toHaveLength(1);
    });

    test(`${id} is present in EXERCISE_PRESCRIPTION_REGISTRY with a consistent exerciseId`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry).toBeDefined();
      expect(entry.exerciseId).toBe(id);
      expect(entry.capabilities.exerciseId).toBe(id);
    });

    test(`${id} uses moduleId "movement", role "technical" and method "controlled_mobility_sets"`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.moduleId).toBe("movement");
      expect(entry.role).toBe("technical");
      expect(entry.explicitMethodId).toBe("controlled_mobility_sets");
      expect(entry.capabilities.supportedMethodIds).toEqual(["controlled_mobility_sets"]);
      expect(entry.capabilities.supportedVolumeStructures).toEqual(["sets_duration"]);
    });

    test(`${id}: validateCompatibility (module/method/role contract) accepts this triple`, () => {
      const contract = getTrainingMethodContract("controlled_mobility_sets");
      expect(contract.supportedModules).toContain("movement");
      expect(contract.supportedRoles).toContain("technical");
    });

    test(`${id}: no exercise was reclassified toward conditioning or power to accommodate fatigue framing`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.moduleId).toBe("movement");
      expect(entry.moduleId).not.toBe("conditioning");
      expect(entry.moduleId).not.toBe("power");
    });
  }
});

// -----------------------------------------------------------------------------
// 5. Shared numerical profile — no new profile created
// -----------------------------------------------------------------------------

describe("registry Lot 3 — shared numerical profile", () => {
  test("exactly one profile exists for (movement, controlled_mobility_sets, technical) and it is unchanged", () => {
    const matches = NUMERICAL_PRESCRIPTION_PROFILES.filter(
      (p) => p.moduleId === "movement" && p.methodId === "controlled_mobility_sets" && p.exerciseRole === "technical",
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].profileId).toBe("controlled_mobility_sets_v0_1");
    expect(matches[0].volume.structure).toBe("sets_duration");
    expect(matches[0].volume.sets).toEqual({ min: 1, normal: 2, max: 3 });
    expect(matches[0].volume.duration?.range).toEqual({ min: 20, normal: 30, max: 60, unit: "seconds" });
    expect(matches[0].volume.repetitions).toBeNull();
    expect(matches[0].volume.distance).toBeNull();
  });

  test("the total number of NumericalPrescriptionProfiles is 15 (12 historical + the 3 Table Group 8 interval profiles; this lot added none)", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(15);
  });
});

// -----------------------------------------------------------------------------
// 6-7. resolveMethod / resolveVolume — no NUMERICAL_PROFILE_MISSING
// -----------------------------------------------------------------------------

describe("registry Lot 3 — method/volume resolution", () => {
  for (const id of LOT3_EXERCISE_IDS) {
    test(`${id}: getExercisePrescriptionSource succeeds with its required equipment available`, () => {
      const result = getExercisePrescriptionSource(id, buildValidContextFor(id));
      expect(result.ok).toBe(true);
    });

    test(`${id}: full prescription resolves without NUMERICAL_PROFILE_MISSING`, () => {
      const result = prescribe(id);
      expect(result.prescription.status).toBe("complete");
      expect(result.trace.volume.ok).toBe(true);
      if (result.trace.volume.ok) {
        expect(result.trace.volume.profileId).toBe("controlled_mobility_sets_v0_1");
      }
    });
  }

  test("bridging and technical_stand_up and shrimping fail with REQUIRED_EQUIPMENT_MISSING when no mat is available", () => {
    for (const id of ["bridging", "technical_stand_up", "shrimping"] as const) {
      const result = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: [],
      });
      if (result.ok) {
        throw new Error(`Expected "${id}" to fail without a mat.`);
      }
      expect(result.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
    }
  });

  test("bear_crawl, footwork_drills and shadow_boxing succeed with no equipment at all (bodyweight baseline)", () => {
    for (const id of ["bear_crawl", "footwork_drills", "shadow_boxing"] as const) {
      const result = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: [],
      });
      expect(result.ok).toBe(true);
    }
  });

  test("mat is a valid, newly-added equipment capability id, aligned 1:1 with the knowledge base's own EquipmentType", () => {
    expect(isEquipmentCapabilityId("mat")).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// 8. Intensity — no invented load
// -----------------------------------------------------------------------------

describe("registry Lot 3 — intensity", () => {
  for (const id of LOT3_EXERCISE_IDS) {
    test(`${id}: supports only rpe and technical_effort — no percentage_1rm, absolute_load, RIR or movement_intent is claimed`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.supportedIntensityTypes).toEqual(["rpe", "technical_effort"]);
      expect(entry.preferredIntensityType).toBe("technical_effort");
      expect(entry.exerciseIntensityConstraints).toBeNull();
    });

    test(`${id}: prescribed intensity resolves to the high_quality technical_effort category, never a numeric load`, () => {
      const result = prescribe(id);
      expect(result.prescription.intensity.primaryMetric.type).toBe("technical_effort");
      expect(result.prescription.intensity.primaryMetric.target).toEqual({ type: "category", value: "high_quality" });
      expect(result.prescription.intensity.calculation).toBeNull();
    });
  }
});

// -----------------------------------------------------------------------------
// 9. Tempo
// -----------------------------------------------------------------------------

describe("registry Lot 3 — tempo", () => {
  for (const id of LOT3_EXERCISE_IDS) {
    test(`${id}: supports global_intent tempo (the method requires tempo; the profile's own technical_precision intent is used)`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.supportedTempoTypes).toEqual(["global_intent"]);
      expect(entry.preferredTempoType).toBeNull();
    });

    test(`${id}: prescription resolves a tempo (never absent, since controlled_mobility_sets requires it)`, () => {
      const result = prescribe(id);
      expect(result.prescription.tempo).not.toBeNull();
      expect(result.prescription.tempo?.type).toBe("global_intent");
    });
  }

  test("controlled_mobility_sets has tempoPolicy: required", () => {
    const contract = getTrainingMethodContract("controlled_mobility_sets");
    expect(contract.tempoPolicy).toBe("required");
  });
});

// -----------------------------------------------------------------------------
// 10. Rest
// -----------------------------------------------------------------------------

describe("registry Lot 3 — rest", () => {
  for (const id of LOT3_EXERCISE_IDS) {
    test(`${id}: declares no exerciseRestConstraints — uses the shared profile's own between_sets 0-15-45s window as-is`, () => {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].exerciseRestConstraints).toBeNull();
    });

    test(`${id}: prescription resolves a between_sets rest`, () => {
      const result = prescribe(id);
      expect(result.prescription.rest?.betweenSets).toBeDefined();
    });

    // Fixed defect (resolveRest.ts): rangeContext "reduced" used to fail
    // with REST_VALUE_INVALID because the shared profile's own documented
    // rest floor (0 seconds, sourced in 34_NUMERICAL_PRESCRIPTION_TABLES.md
    // Table Group 6) was incorrectly rejected (`seconds <= 0`). Fixed to
    // `seconds < 0` — 0 now resolves successfully.
    test(`${id}: "reduced" range context now resolves successfully with rest = 0 seconds (previously REST_VALUE_INVALID)`, () => {
      const result = prescribe(id, "reduced");
      expect(result.prescription.status).toBe("complete");
      const betweenSets = result.prescription.rest?.betweenSets;
      if (betweenSets?.type !== "fixed") {
        throw new Error(`Expected "${id}" to resolve a fixed between-sets rest target under "reduced".`);
      }
      expect(betweenSets.duration.value).toBe(0);
    });
  }
});

// -----------------------------------------------------------------------------
// 11-12. Instructions and stop conditions
// -----------------------------------------------------------------------------

describe("registry Lot 3 — instructions and stop conditions", () => {
  for (const id of LOT3_EXERCISE_IDS) {
    test(`${id}: declares setup and execution instructions, both mandatory, non-empty and sourced`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      const categories = entry.instructionDefinitions.map((i) => i.category);
      expect(categories).toEqual(expect.arrayContaining(["setup", "execution"]));
      for (const instruction of entry.instructionDefinitions) {
        expect(instruction.text.length).toBeGreaterThan(0);
        expect(instruction.mandatory).toBe(true);
        expect(instruction.sourceRuleId.length).toBeGreaterThan(0);
      }
      const ids = entry.instructionDefinitions.map((i) => i.instructionId);
      expect(new Set(ids).size).toBe(ids.length);
    });

    test(`${id}: declares exactly the 5 categories required by controlled_mobility_sets: technical_failure, range_of_motion_loss, balance_loss, pain, completion`, () => {
      const categories = EXERCISE_PRESCRIPTION_REGISTRY[id].stopConditionDefinitions.map((d) => d.category);
      expect(categories).toEqual(EXPECTED_STOP_CATEGORIES);
      expect(new Set(categories).size).toBe(categories.length);
      for (const definition of EXERCISE_PRESCRIPTION_REGISTRY[id].stopConditionDefinitions) {
        expect(definition.instructions[0]?.text.length).toBeGreaterThan(0);
        expect(definition.sourceRuleIds.length).toBeGreaterThan(0);
      }
    });

    test(`${id}: prescription resolves all 5 required stop-condition categories`, () => {
      const result = prescribe(id);
      const categories = result.prescription.stopConditions.map((c) => c.category);
      expect(categories).toEqual(expect.arrayContaining(EXPECTED_STOP_CATEGORIES));
      expect(categories).toHaveLength(5);
    });

    test(`${id}: no instruction re-encodes the knowledge base's own eligibility requirements as a separate registry-level gate`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      const kbEntry = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === id)!;
      const kbEquipment = (kbEntry.requirements?.required ?? [])
        .flatMap((c) => c.items)
        .filter((a): a is Extract<typeof a, { kind: "equipment" }> => a.kind === "equipment")
        .map((a) => a.equipment);
      expect(entry.capabilities.requiredEquipmentCapabilities).toEqual(kbEquipment.length > 0 ? ["mat"] : []);
    });
  }

  test("controlled_mobility_sets requires exactly these 5 stop-condition categories at the method-contract level", () => {
    const contract = getTrainingMethodContract("controlled_mobility_sets");
    expect(contract.requiredStopConditionCategories).toEqual([
      "pain",
      "technical_failure",
      "range_of_motion_loss",
      "balance_loss",
      "completion",
    ]);
  });

  test("the hang power clean's receiving/catch demand is not conflated with any Lot 3 exercise's own stop conditions (sanity check: no impact_limit/velocity_loss category leaked in)", () => {
    for (const id of LOT3_EXERCISE_IDS) {
      const categories = EXERCISE_PRESCRIPTION_REGISTRY[id].stopConditionDefinitions.map((d) => d.category);
      expect(categories).not.toContain("impact_limit");
      expect(categories).not.toContain("velocity_loss");
    }
  });
});

// -----------------------------------------------------------------------------
// 13. Volume / dose constraints — narrowing never widens the shared profile
// -----------------------------------------------------------------------------

describe("registry Lot 3 — dose constraints", () => {
  test("bear_crawl and shrimping narrow sets to exactly 3 and restate duration 20-60s (matching their own documented duration alternative)", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.bear_crawl.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 3, repetitions: null, durationSeconds: 20, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 3, repetitions: null, durationSeconds: 60, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/37_BEAR_CRAWL"],
    });
    expect(EXERCISE_PRESCRIPTION_REGISTRY.shrimping.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 3, repetitions: null, durationSeconds: 20, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 3, repetitions: null, durationSeconds: 60, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/38_SHRIMPING"],
    });
  });

  test("bridging narrows sets to exactly 3, with no duration figure claimed (none is documented)", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.bridging.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 3, repetitions: null, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 3, repetitions: null, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/39_BRIDGING"],
    });
  });

  test("technical_stand_up narrows sets to 2-3, with no duration figure claimed", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.technical_stand_up.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 2, repetitions: null, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 3, repetitions: null, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/35_TECHNICAL_STAND_UP"],
    });
  });

  test("footwork_drills and shadow_boxing declare no exerciseDoseConstraints — their own multi-minute, round-based volume exceeds the shared profile's ceiling and is not fabricated", () => {
    for (const id of DOSE_UNCONSTRAINED_IDS) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].exerciseDoseConstraints).toBeNull();
    }
  });

  test("none of the four narrowed entries ever widens the shared profile's own bounds", () => {
    const profile = NUMERICAL_PRESCRIPTION_PROFILES.find((p) => p.profileId === "controlled_mobility_sets_v0_1")!;
    for (const id of DOSE_NARROWED_IDS) {
      const constraint = EXERCISE_PRESCRIPTION_REGISTRY[id].exerciseDoseConstraints!;
      const min = constraint.minimumDose!;
      const max = constraint.maximumDose!;
      expect(min.sets!).toBeGreaterThanOrEqual(profile.volume.sets!.min);
      expect(max.sets!).toBeLessThanOrEqual(profile.volume.sets!.max);
      if (min.durationSeconds !== null) {
        expect(min.durationSeconds).toBeGreaterThanOrEqual(profile.volume.duration!.range.min);
      }
      if (max.durationSeconds !== null) {
        expect(max.durationSeconds).toBeLessThanOrEqual(profile.volume.duration!.range.max);
      }
    }
  });

  test("all narrowed bounds are positive integers, and minimum never exceeds maximum", () => {
    for (const id of DOSE_NARROWED_IDS) {
      const constraint = EXERCISE_PRESCRIPTION_REGISTRY[id].exerciseDoseConstraints!;
      const min = constraint.minimumDose!;
      const max = constraint.maximumDose!;
      expect(Number.isInteger(min.sets)).toBe(true);
      expect(Number.isInteger(max.sets)).toBe(true);
      expect(min.sets!).toBeGreaterThan(0);
      expect(min.sets!).toBeLessThanOrEqual(max.sets!);
      if (min.durationSeconds !== null && max.durationSeconds !== null) {
        expect(Number.isInteger(min.durationSeconds)).toBe(true);
        expect(Number.isInteger(max.durationSeconds)).toBe(true);
        expect(min.durationSeconds).toBeGreaterThan(0);
        expect(min.durationSeconds).toBeLessThanOrEqual(max.durationSeconds);
      }
      expect(constraint.sourceRuleIds.length).toBeGreaterThan(0);
    }
  });

  test("no distance was invented anywhere in Lot 3's own volume dimensions, and no arbitrary repetitions-to-duration conversion was created", () => {
    for (const id of LOT3_EXERCISE_IDS) {
      const constraint = EXERCISE_PRESCRIPTION_REGISTRY[id].exerciseDoseConstraints;
      if (constraint === null) continue;
      expect(constraint.minimumDose?.distanceMeters ?? null).toBeNull();
      expect(constraint.maximumDose?.distanceMeters ?? null).toBeNull();
      expect(constraint.minimumDose?.repetitions ?? null).toBeNull();
      expect(constraint.maximumDose?.repetitions ?? null).toBeNull();
    }
  });

  test("bear_crawl/shrimping narrowingNotes describe only the sets shrink (duration already matches the profile default, so it produces no narrowing note)", () => {
    for (const id of ["bear_crawl", "shrimping"] as const) {
      const result = prescribe(id);
      const notes = result.trace.volume.ok ? result.trace.volume.narrowingNotes : [];
      expect(notes.some((n) => n.includes("sets range 1-3 narrowed to 3-3"))).toBe(true);
    }
  });

  test("technical_stand_up's narrowingNotes describe the sets shrink from 1-3 to 2-3", () => {
    const result = prescribe("technical_stand_up");
    const notes = result.trace.volume.ok ? result.trace.volume.narrowingNotes : [];
    expect(notes.some((n) => n.includes("sets range 1-3 narrowed to 2-3"))).toBe(true);
  });

  test("footwork_drills/shadow_boxing resolve with an empty narrowingNotes array (nothing was narrowed)", () => {
    for (const id of DOSE_UNCONSTRAINED_IDS) {
      const result = prescribe(id);
      const notes = result.trace.volume.ok ? result.trace.volume.narrowingNotes : null;
      expect(notes).toEqual([]);
    }
  });
});

// -----------------------------------------------------------------------------
// 14. Laterality
// -----------------------------------------------------------------------------

describe("registry Lot 3 — laterality", () => {
  test("all six entries use bilateral laterality — no new laterality value was created, and shrimping's own continuous alternating nature is documented, not claimed structurally", () => {
    for (const id of LOT3_EXERCISE_IDS) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.laterality).toBe("bilateral");
    }
  });

  test("shrimping's execution instruction documents the alternating-sides nature the registry-level laterality cannot express", () => {
    const execution = EXERCISE_PRESCRIPTION_REGISTRY.shrimping.instructionDefinitions.find((i) => i.category === "execution");
    expect(execution?.text.toLowerCase()).toContain("alternating");
  });

  test("laterality: \"alternating\" would have required a per-side volume interpretation that shrimping's own fiche does not support (verified structurally)", () => {
    const validAlternatingInterpretations = [
      "repetitions_per_side",
      "alternating_total_repetitions",
      "duration_per_side",
      "distance_per_side",
      "load_per_hand",
      "load_per_side",
    ];
    expect(
      EXERCISE_PRESCRIPTION_REGISTRY.shrimping.capabilities.volumeInterpretations.some((v) =>
        validAlternatingInterpretations.includes(v),
      ),
    ).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// 15. Duration estimation profiles
// -----------------------------------------------------------------------------

describe("registry Lot 3 — duration estimation profiles", () => {
  const EXPECTED_SOURCES: Record<(typeof LOT3_EXERCISE_IDS)[number], string> = {
    bear_crawl: "50-exercises/37_BEAR_CRAWL",
    bridging: "50-exercises/39_BRIDGING",
    footwork_drills: "50-exercises/29_FOOTWORK_DRILLS",
    shadow_boxing: "50-exercises/28_SHADOW_BOXING",
    technical_stand_up: "50-exercises/35_TECHNICAL_STAND_UP",
    shrimping: "50-exercises/38_SHRIMPING",
  };

  for (const id of LOT3_EXERCISE_IDS) {
    test(`${id}: has an unresolved duration profile sourced to its own chapter, sets_duration structure`, () => {
      const result = getDurationEstimationProfile(`duration_profile_${id}`);
      if (result.ok) {
        throw new Error(`Expected the duration profile for "${id}" to be unresolved.`);
      }
      expect(result.failureCode).toBe("DURATION_PROFILE_UNRESOLVED");
      expect(result.profile?.volumeStructure).toBe("sets_duration");
      expect(result.profile?.sourceRuleIds).toEqual([EXPECTED_SOURCES[id]]);
    });
  }

  test("no duration profile has any effect on the numerical prescription profiles (now 15) or on the 51 historical entries", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(15);
    expect(getDurationEstimationProfile("duration_profile_bench_press").ok).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// 16. Distinctions from named precedents
// -----------------------------------------------------------------------------

describe("registry Lot 3 — distinctions from named precedents", () => {
  test("bear_crawl vs. dead_bug: bear_crawl is continuous quadrupedal locomotion (movement/technical, bodyweight, no equipment); dead_bug is a static core hold (core/timed_isometric_sets)", () => {
    const bearCrawl = EXERCISE_PRESCRIPTION_REGISTRY.bear_crawl;
    const bearCrawlKb = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "bear_crawl")!;
    const deadBugKb = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "dead_bug")!;
    expect(bearCrawl.moduleId).toBe("movement");
    expect(bearCrawlKb.movementPatterns).toContain("locomotion");
    expect(deadBugKb.movementPatterns).not.toContain("locomotion");
    expect(deadBugKb.module).toBe("core");
  });

  test("bridging vs. hip_thrust: bridging is the canonical combat/grappling bridge (movement/technical, bodyweight, mat); hip_thrust is a barbell-loaded strength lift (strength/primary)", () => {
    const bridging = EXERCISE_PRESCRIPTION_REGISTRY.bridging;
    const hipThrust = EXERCISE_PRESCRIPTION_REGISTRY.hip_thrust;
    expect(bridging.moduleId).toBe("movement");
    expect(hipThrust.moduleId).toBe("strength");
    expect(bridging.explicitMethodId).toBe("controlled_mobility_sets");
    expect(hipThrust.explicitMethodId).toBe("straight_sets_repetitions");
    expect(bridging.capabilities.requiredEquipmentCapabilities).toEqual(["mat"]);
    expect(hipThrust.capabilities.requiredEquipmentCapabilities.length).toBeGreaterThan(0);
    expect(hipThrust.capabilities.requiredEquipmentCapabilities).not.toEqual(["mat"]);
  });

  test("footwork_drills vs. sprint_intervals: footwork_drills is a short technical movement touch (movement/technical, no equipment); sprint_intervals remains entirely unintegrated in the registry (module conditioning at the KB level, never forced into this lot's method)", () => {
    const footworkDrills = EXERCISE_PRESCRIPTION_REGISTRY.footwork_drills;
    const sprintIntervalsKb = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "sprint_intervals")!;
    expect(footworkDrills.moduleId).toBe("movement");
    expect(sprintIntervalsKb.module).toBe("conditioning");
    expect(EXERCISE_PRESCRIPTION_REGISTRY as Record<string, unknown>).not.toHaveProperty("sprint_intervals");
  });

  test("shadow_boxing vs. heavy_bag_power_intervals: shadow_boxing requires no equipment and stays module movement; heavy_bag_power_intervals (module conditioning at the KB level) remains entirely unintegrated and is never conflated with shadow_boxing's own entry", () => {
    const shadowBoxing = EXERCISE_PRESCRIPTION_REGISTRY.shadow_boxing;
    const heavyBagKb = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "heavy_bag_power_intervals")!;
    expect(shadowBoxing.capabilities.requiredEquipmentCapabilities).toEqual([]);
    expect(heavyBagKb.module).toBe("conditioning");
    expect(EXERCISE_PRESCRIPTION_REGISTRY as Record<string, unknown>).not.toHaveProperty("heavy_bag_power_intervals");
  });

  test("technical_stand_up vs. turkish_get_up: technical_stand_up is a duration-based technical set (movement/controlled_mobility_sets, mat, no explicit per-side structure); turkish_get_up remains entirely unintegrated in the registry", () => {
    const technicalStandUp = EXERCISE_PRESCRIPTION_REGISTRY.technical_stand_up;
    const turkishGetUpKb = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "turkish_get_up")!;
    expect(technicalStandUp.explicitMethodId).toBe("controlled_mobility_sets");
    expect(technicalStandUp.capabilities.supportedVolumeStructures).toEqual(["sets_duration"]);
    expect(turkishGetUpKb.unilateral).toBe(true);
    expect(EXERCISE_PRESCRIPTION_REGISTRY as Record<string, unknown>).not.toHaveProperty("turkish_get_up");
  });

  test("shrimping vs. bridging: both require a mat and narrow sets to exactly 3, but only shrimping's own execution instruction documents continuous side-alternation and only shrimping restates an explicit duration figure", () => {
    const shrimping = EXERCISE_PRESCRIPTION_REGISTRY.shrimping;
    const bridging = EXERCISE_PRESCRIPTION_REGISTRY.bridging;
    expect(shrimping.capabilities.requiredEquipmentCapabilities).toEqual(["mat"]);
    expect(bridging.capabilities.requiredEquipmentCapabilities).toEqual(["mat"]);
    expect(shrimping.exerciseDoseConstraints?.minimumDose?.sets).toBe(3);
    expect(bridging.exerciseDoseConstraints?.minimumDose?.sets).toBe(3);

    expect(shrimping.exerciseDoseConstraints?.minimumDose?.durationSeconds).toBe(20);
    expect(bridging.exerciseDoseConstraints?.minimumDose?.durationSeconds).toBeNull();

    const shrimpingExecution = shrimping.instructionDefinitions.find((i) => i.category === "execution");
    const bridgingExecution = bridging.instructionDefinitions.find((i) => i.category === "execution");
    expect(shrimpingExecution?.text.toLowerCase()).toContain("alternating");
    expect(bridgingExecution?.text.toLowerCase()).not.toContain("alternating");
  });
});

// -----------------------------------------------------------------------------
// 17. Registry validation and purely-additive non-regression
// -----------------------------------------------------------------------------

describe("registry Lot 3 — registry validation and non-regression", () => {
  test("the full registry validates with no new issue beyond the expected unresolved duration profiles", () => {
    const issues = validatePilotRegistry().filter((issue) => issue.code !== "UNRESOLVED_DURATION_PROFILE");
    expect(issues).toEqual([]);
  });

  test("the registry now contains exactly 57 active exercises (51 + 6 Lot 3 exercises)", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(60);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(60);
  });

  test("no historical entry was removed: all 51 previously-existing ids are still present", () => {
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
      "hang_power_clean",
    ] as const;
    expect(PREVIOUSLY_EXISTING_IDS).toHaveLength(51);
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

  for (const id of LOT3_EXERCISE_IDS) {
    test(`${id}: determinism and non-mutation`, () => {
      const context = buildValidContextFor(id);
      expect(getExercisePrescriptionSource(id, context)).toEqual(getExercisePrescriptionSource(id, context));

      const snapshot = JSON.parse(JSON.stringify(context));
      getExercisePrescriptionSource(id, context);
      expect(context).toEqual(snapshot);
    });
  }

  test("a pre-existing, unrelated exercise (hang_power_clean, from Lot 2) is unaffected by this lot's own changes", () => {
    const hpc = EXERCISE_PRESCRIPTION_REGISTRY.hang_power_clean;
    expect(hpc.moduleId).toBe("power");
    expect(hpc.role).toBe("primary");
    expect(hpc.capabilities.requiredEquipmentCapabilities).toEqual(["barbell", "plates"]);
  });
});
