/**
 * Combat Athlete System — Registry Lot 4 (Combat Movement Immediate)
 *
 * sprawl and shot_entries both reuse the single existing
 * controlled_mobility_sets_v0_1 profile (moduleId: movement, methodId:
 * controlled_mobility_sets, exerciseRole: technical), the same profile
 * already used by all six Registry Lot 3 entries. No new numerical
 * prescription profile is created, and no new equipment capability
 * identifier is added — "mat" already exists (added in Registry Lot 3).
 *
 * Two distinct, honest volume resolutions this lot:
 * - sprawl's own fiche documents "3-8 rounds, 5-20 repetitions or 10-30
 *   second intervals." "rounds" is never treated as a "sets" synonym
 *   (the same discipline already applied to footwork_drills/
 *   shadow_boxing in Lot 3) and "repetitions" cannot be represented by a
 *   sets_duration method at all. Only the fiche's own already-in-seconds
 *   duration alternative is used, narrowing JUST the duration dimension
 *   to 20-30s (intersected with the profile's own 20-60s ceiling); sets
 *   is left fully unconstrained.
 * - shot_entries's own fiche documents "3-8 sets, 3-10 repetitions" with
 *   no set-level duration figure at all (only a 2-5-second PER-REPETITION
 *   duration, never converted into a set duration — the same discipline
 *   already applied to bridging/technical_stand_up in Lot 3). Only the
 *   sets dimension is narrowed (pinned to 3); duration is left fully
 *   unconstrained.
 *
 * A cross-cutting defect was found and fixed (in `resolveRest.ts`, not in
 * this lot's own scope): every controlled_mobility_sets entry — all 6
 * from Lot 3 and both from this lot — used to fail prescription under
 * `rangeContext: "reduced"` with "resolved an invalid rest duration: 0",
 * because the shared profile's own rest range (`integerRange(0, 15, 45)`)
 * selects its literal, documented floor of 0 seconds at that range
 * context (34_NUMERICAL_PRESCRIPTION_TABLES.md, Table Group 6: "Zero
 * formal rest is allowed only when the method defines immediate
 * controlled transition") — a value `resolveRest.ts` incorrectly rejected
 * (`seconds <= 0`). Fixed to `seconds < 0`, so 0 now resolves
 * successfully while negative/non-integer values remain rejected. This
 * test file exercises "reduced", "normal" and "high" for sprawl/
 * shot_entries accordingly.
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

const LOT4_EXERCISE_IDS = ["sprawl", "shot_entries"] as const;

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

describe("registry Lot 4 — presence and classification", () => {
  for (const id of LOT4_EXERCISE_IDS) {
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

    test(`${id}: not reclassified toward conditioning, power or strength despite explosive/high-RFD language in its own fiche`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.moduleId).toBe("movement");
      expect(entry.moduleId).not.toBe("conditioning");
      expect(entry.moduleId).not.toBe("power");
      expect(entry.moduleId).not.toBe("strength");
    });

    test(`${id}: does not overwrite any historical entry (no exerciseId collision)`, () => {
      const kbEntry = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === id)!;
      expect(kbEntry).toBeDefined();
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].exerciseId).toBe(kbEntry.id);
    });
  }
});

// -----------------------------------------------------------------------------
// 5. Shared numerical profile — no new profile created
// -----------------------------------------------------------------------------

describe("registry Lot 4 — shared numerical profile", () => {
  test("exactly one profile exists for (movement, controlled_mobility_sets, technical) and it is unchanged", () => {
    const matches = NUMERICAL_PRESCRIPTION_PROFILES.filter(
      (p) => p.moduleId === "movement" && p.methodId === "controlled_mobility_sets" && p.exerciseRole === "technical",
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].profileId).toBe("controlled_mobility_sets_v0_1");
    expect(matches[0].volume.sets).toEqual({ min: 1, normal: 2, max: 3 });
    expect(matches[0].volume.duration?.range).toEqual({ min: 20, normal: 30, max: 60, unit: "seconds" });
    expect(matches[0].volume.repetitions).toBeNull();
    expect(matches[0].volume.distance).toBeNull();
  });

  test("the total number of NumericalPrescriptionProfiles is 19 (12 historical + the 3 Table Group 8 interval profiles + the Table Group 13 Core repetition profile + the Table Group 4 ISO-GRIP profile + the Table Group 14 power-interval profile + the Table Group 15 Grip repetition profile; this lot added none)", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(19);
  });
});

// -----------------------------------------------------------------------------
// 6-8. resolveMethod / resolveVolume — no NUMERICAL_PROFILE_MISSING
// -----------------------------------------------------------------------------

describe("registry Lot 4 — method/volume resolution", () => {
  for (const id of LOT4_EXERCISE_IDS) {
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

    test(`${id}: fails with REQUIRED_EQUIPMENT_MISSING when no mat is available`, () => {
      const result = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: [],
      });
      if (result.ok) {
        throw new Error(`Expected "${id}" to fail without a mat.`);
      }
      expect(result.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
    });
  }

  test("mat is the only equipment capability required, and it already existed before this lot (added in Registry Lot 3) — no new identifier is introduced", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.sprawl.capabilities.requiredEquipmentCapabilities).toEqual(["mat"]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.shot_entries.capabilities.requiredEquipmentCapabilities).toEqual(["mat"]);
    expect(isEquipmentCapabilityId("mat")).toBe(true);
  });

  test("neither entry requires a partner: no human_assistance capability tag or equipment id is declared, matching the knowledge base's own Optional-only partner requirement", () => {
    for (const id of LOT4_EXERCISE_IDS) {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.capabilities.requiredAthleteReferenceTypes).toEqual([]);
      expect(entry.capabilities.substitutionCapabilityTags).toEqual([]);
    }
  });
});

// -----------------------------------------------------------------------------
// 9. Intensity — honest resolution
// -----------------------------------------------------------------------------

describe("registry Lot 4 — intensity", () => {
  for (const id of LOT4_EXERCISE_IDS) {
    test(`${id}: supports only rpe and technical_effort — no percentage_1rm, absolute_load, RIR or movement_intent is claimed despite the fiche's own explosive/maximal-velocity language`, () => {
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

  test("movement_intent is never used by either entry, even though controlled_mobility_sets's own method contract allows it — the shared numerical profile itself declares no movement_intent rule", () => {
    const profile = NUMERICAL_PRESCRIPTION_PROFILES.find((p) => p.profileId === "controlled_mobility_sets_v0_1")!;
    const ruleTypes = profile.intensity.map((rule) => rule.type);
    expect(ruleTypes).toEqual(["rpe", "technical_effort"]);
    const contract = getTrainingMethodContract("controlled_mobility_sets");
    expect(contract.allowedIntensityTypes).toContain("movement_intent");
  });
});

// -----------------------------------------------------------------------------
// 10. Tempo
// -----------------------------------------------------------------------------

describe("registry Lot 4 — tempo", () => {
  for (const id of LOT4_EXERCISE_IDS) {
    test(`${id}: supports global_intent tempo only`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.supportedTempoTypes).toEqual(["global_intent"]);
      expect(entry.preferredTempoType).toBeNull();
    });

    test(`${id}: prescription resolves a global_intent tempo (never absent, since controlled_mobility_sets requires it)`, () => {
      const result = prescribe(id);
      expect(result.prescription.tempo).not.toBeNull();
      expect(result.prescription.tempo?.type).toBe("global_intent");
    });
  }
});

// -----------------------------------------------------------------------------
// 11. Rest
// -----------------------------------------------------------------------------

describe("registry Lot 4 — rest", () => {
  for (const id of LOT4_EXERCISE_IDS) {
    test(`${id}: declares no exerciseRestConstraints — uses the shared profile's own between_sets 0-15-45s window as-is`, () => {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].exerciseRestConstraints).toBeNull();
    });

    test(`${id}: prescription resolves a between_sets rest under "normal" range context`, () => {
      const result = prescribe(id, "normal");
      expect(result.prescription.rest?.betweenSets).toBeDefined();
    });
  }

  test("fixed defect: all eight movement/controlled_mobility_sets/technical entries now succeed under rangeContext \"reduced\", resolving the shared profile's own documented rest floor of 0 seconds (previously REST_VALUE_INVALID) — dedicated transversal test covering the full affected set", () => {
    const ALL_CONTROLLED_MOBILITY_SETS_EXERCISE_IDS = [
      "bear_crawl",
      "bridging",
      "footwork_drills",
      "shadow_boxing",
      "technical_stand_up",
      "shrimping",
      "sprawl",
      "shot_entries",
    ] as const;
    expect(ALL_CONTROLLED_MOBILITY_SETS_EXERCISE_IDS).toHaveLength(8);

    for (const id of ALL_CONTROLLED_MOBILITY_SETS_EXERCISE_IDS) {
      const context: PrescriptionExecutionContext = { ...buildValidContextFor(id), rangeContext: "reduced" };
      const sourceResult = getExercisePrescriptionSource(id, context);
      if (!sourceResult.ok) {
        throw new Error(`Expected "${id}" to build a prescription source under "reduced".`);
      }
      const result = prescribeExercise({ exerciseId: id, moduleId: sourceResult.moduleId, ...sourceResult.source });
      if (!result.ok) {
        throw new Error(`Expected "${id}" to succeed under "reduced", got failure at ${result.failureStage}: ${result.message}`);
      }
      expect(result.prescription.status).toBe("complete");
      const betweenSets = result.prescription.rest?.betweenSets;
      if (betweenSets?.type !== "fixed") {
        throw new Error(`Expected "${id}" to resolve a fixed between-sets rest target.`);
      }
      expect(betweenSets.duration.value).toBe(0);
    }
  });

  for (const id of LOT4_EXERCISE_IDS) {
    test(`${id}: "reduced" range context resolves rest = 0s without disturbing any other prescription field`, () => {
      const reduced = prescribe(id, "reduced");
      const normal = prescribe(id, "normal");

      expect(reduced.prescription.status).toBe("complete");
      const reducedRest = reduced.prescription.rest?.betweenSets;
      if (reducedRest?.type !== "fixed") {
        throw new Error(`Expected "${id}" to resolve a fixed between-sets rest target under "reduced".`);
      }
      expect(reducedRest.duration.value).toBe(0);

      // Only rest changes between reduced and normal; volume, intensity
      // and tempo resolve identically for both (this profile's own sets/
      // duration/intensity/tempo selection is not itself rest-dependent).
      expect(reduced.prescription.intensity).toEqual(normal.prescription.intensity);
      expect(reduced.prescription.tempo).toEqual(normal.prescription.tempo);
    });
  }
});

// -----------------------------------------------------------------------------
// 12-13. Instructions and stop conditions
// -----------------------------------------------------------------------------

describe("registry Lot 4 — instructions and stop conditions", () => {
  for (const id of LOT4_EXERCISE_IDS) {
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

    test(`${id}: no instruction re-encodes the knowledge base's own eligibility requirements (mat) as a separate registry-level gate, and no space/surface requirement is duplicated`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      const kbEntry = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === id)!;
      const kbEquipment = (kbEntry.requirements?.required ?? [])
        .flatMap((c) => c.items)
        .filter((a): a is Extract<typeof a, { kind: "equipment" }> => a.kind === "equipment")
        .map((a) => a.equipment);
      expect(entry.capabilities.requiredEquipmentCapabilities).toEqual(kbEquipment);
      const kbSpace = (kbEntry.requirements?.required ?? [])
        .flatMap((c) => c.items)
        .filter((a) => a.kind === "environment");
      expect(kbSpace).toEqual([]);
    });
  }

  test("sprawl's technical_failure and range_of_motion_loss texts are grounded in its own fiche (landing on the knees, slow hip projection, hip projection distance) — not copy-pasted from another exercise", () => {
    const technicalFailure = EXERCISE_PRESCRIPTION_REGISTRY.sprawl.stopConditionDefinitions.find((d) => d.category === "technical_failure");
    const rangeOfMotionLoss = EXERCISE_PRESCRIPTION_REGISTRY.sprawl.stopConditionDefinitions.find((d) => d.category === "range_of_motion_loss");
    expect(technicalFailure?.instructions[0]?.text.toLowerCase()).toContain("knees");
    expect(rangeOfMotionLoss?.instructions[0]?.text.toLowerCase()).toContain("hip projection");
  });

  test("shot_entries's technical_failure and range_of_motion_loss texts are grounded in its own fiche (bending at the waist, penetration distance) — not copy-pasted from another exercise", () => {
    const technicalFailure = EXERCISE_PRESCRIPTION_REGISTRY.shot_entries.stopConditionDefinitions.find((d) => d.category === "technical_failure");
    const rangeOfMotionLoss = EXERCISE_PRESCRIPTION_REGISTRY.shot_entries.stopConditionDefinitions.find((d) => d.category === "range_of_motion_loss");
    expect(technicalFailure?.instructions[0]?.text.toLowerCase()).toContain("waist");
    expect(rangeOfMotionLoss?.instructions[0]?.text.toLowerCase()).toContain("penetration");
  });

  test("no new stop-condition factory was required this lot: rangeOfMotionLossCondition (added in Lot 3) already covers the only category neither Lot 1 nor Lot 2 needed", () => {
    for (const id of LOT4_EXERCISE_IDS) {
      const categories = EXERCISE_PRESCRIPTION_REGISTRY[id].stopConditionDefinitions.map((d) => d.category);
      expect(categories).toContain("range_of_motion_loss");
    }
  });
});

// -----------------------------------------------------------------------------
// 14. Volume / dose constraints — narrowing never widens the shared profile
// -----------------------------------------------------------------------------

describe("registry Lot 4 — dose constraints", () => {
  test("sprawl narrows duration only, to 20-30s (from its own \"10-30 second intervals\" alternative); sets is left fully unconstrained", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.sprawl.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: null, repetitions: null, durationSeconds: 20, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: null, repetitions: null, durationSeconds: 30, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/30_SPRAWL"],
    });
  });

  test("shot_entries narrows sets only, pinned to 3 (from its own \"3-8 sets\"); duration is left fully unconstrained (no set-level duration is documented, only a per-repetition 2-5s figure)", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.shot_entries.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 3, repetitions: null, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 3, repetitions: null, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/36_SHOT_ENTRIES"],
    });
  });

  test("neither constraint ever widens the shared profile's own bounds", () => {
    const profile = NUMERICAL_PRESCRIPTION_PROFILES.find((p) => p.profileId === "controlled_mobility_sets_v0_1")!;
    for (const id of LOT4_EXERCISE_IDS) {
      const constraint = EXERCISE_PRESCRIPTION_REGISTRY[id].exerciseDoseConstraints!;
      const min = constraint.minimumDose!;
      const max = constraint.maximumDose!;
      if (min.sets !== null) expect(min.sets).toBeGreaterThanOrEqual(profile.volume.sets!.min);
      if (max.sets !== null) expect(max.sets).toBeLessThanOrEqual(profile.volume.sets!.max);
      if (min.durationSeconds !== null) expect(min.durationSeconds).toBeGreaterThanOrEqual(profile.volume.duration!.range.min);
      if (max.durationSeconds !== null) expect(max.durationSeconds).toBeLessThanOrEqual(profile.volume.duration!.range.max);
      expect(constraint.sourceRuleIds.length).toBeGreaterThan(0);
    }
  });

  test("no distance was invented, no repetitions figure was invented, and no rounds->sets or reps->seconds conversion occurred for either exercise", () => {
    for (const id of LOT4_EXERCISE_IDS) {
      const constraint = EXERCISE_PRESCRIPTION_REGISTRY[id].exerciseDoseConstraints!;
      expect(constraint.minimumDose?.distanceMeters ?? null).toBeNull();
      expect(constraint.maximumDose?.distanceMeters ?? null).toBeNull();
      expect(constraint.minimumDose?.repetitions ?? null).toBeNull();
      expect(constraint.maximumDose?.repetitions ?? null).toBeNull();
      expect(constraint.minimumDose?.rounds ?? null).toBeNull();
      expect(constraint.maximumDose?.rounds ?? null).toBeNull();
    }
  });

  test("sprawl's narrowingNotes describe only the duration ceiling shrink (60 -> 30); shot_entries's narrowingNotes describe only the sets shrink (1-3 -> 3-3)", () => {
    const sprawlResult = prescribe("sprawl");
    const sprawlNotes = sprawlResult.trace.volume.ok ? sprawlResult.trace.volume.narrowingNotes : [];
    expect(sprawlNotes.some((n) => n.includes("durationSeconds range 20-60 narrowed to 20-30"))).toBe(true);
    expect(sprawlNotes.some((n) => n.startsWith("sets range"))).toBe(false);

    const shotEntriesResult = prescribe("shot_entries");
    const shotEntriesNotes = shotEntriesResult.trace.volume.ok ? shotEntriesResult.trace.volume.narrowingNotes : [];
    expect(shotEntriesNotes.some((n) => n.includes("sets range 1-3 narrowed to 3-3"))).toBe(true);
    expect(shotEntriesNotes.some((n) => n.startsWith("durationSeconds range"))).toBe(false);
  });

  test("sprawl at high range context still caps duration at 30s (never reaching the shared profile's own 60s ceiling); shot_entries's sets stay pinned to 3 at every range context", () => {
    const sprawlHigh = prescribe("sprawl", "high");
    expect(sprawlHigh.prescription.volume.duration?.value).toBe(30);

    for (const rc of ["normal", "high"] as const) {
      const result = prescribe("shot_entries", rc);
      expect(result.prescription.volume.sets).toBe(3);
    }
  });
});

// -----------------------------------------------------------------------------
// 15. Laterality
// -----------------------------------------------------------------------------

describe("registry Lot 4 — laterality", () => {
  test("both entries use bilateral laterality — no new laterality value was created; neither fiche documents alternating or per-side language for its own default/base form", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.sprawl.capabilities.laterality).toBe("bilateral");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.shot_entries.capabilities.laterality).toBe("bilateral");
  });

  test("this matches the knowledge base's own unilateral: false resolution for both exercises", () => {
    const sprawlKb = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "sprawl")!;
    const shotEntriesKb = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "shot_entries")!;
    expect(sprawlKb.unilateral).toBe(false);
    expect(shotEntriesKb.unilateral).toBe(false);
  });

  test("shrimping's own alternating-laterality compromise (Lot 3) was not mechanically reapplied here without checking: neither sprawl nor shot_entries documents any \"alternating\"/\"continuous side\" language, unlike shrimping's own fiche", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.shrimping.capabilities.laterality).toBe("bilateral");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.sprawl.capabilities.laterality).toBe("bilateral");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.shot_entries.capabilities.laterality).toBe("bilateral");
    // shot_entries names "Single Leg Entry" only as a documented Variation,
    // never as its own default bilateral form.
    const shotEntriesExecution = EXERCISE_PRESCRIPTION_REGISTRY.shot_entries.instructionDefinitions.find((i) => i.category === "execution");
    expect(shotEntriesExecution?.text.toLowerCase()).not.toContain("alternat");
  });
});

// -----------------------------------------------------------------------------
// 16. Duration estimation profiles
// -----------------------------------------------------------------------------

describe("registry Lot 4 — duration estimation profiles", () => {
  const EXPECTED_SOURCES: Record<(typeof LOT4_EXERCISE_IDS)[number], string> = {
    sprawl: "50-exercises/30_SPRAWL",
    shot_entries: "50-exercises/36_SHOT_ENTRIES",
  };

  for (const id of LOT4_EXERCISE_IDS) {
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

  test("no more than 2 new duration profiles were added this lot, and no duration profile has any effect on the numerical prescription profiles (now 19) or the 57 historical entries", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(19);
    expect(getDurationEstimationProfile("duration_profile_bench_press").ok).toBe(false);
    expect(getDurationEstimationProfile("duration_profile_bear_crawl").ok).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// 17. Distinctions from named precedents
// -----------------------------------------------------------------------------

describe("registry Lot 4 — distinctions from named precedents", () => {
  test("burpee does not exist anywhere in the knowledge base (confirmed by direct search) — sprawl is therefore not compared against it, and is definitely not substituted for it", () => {
    expect(EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "burpee")).toBeUndefined();
    expect(EXERCISE_PRESCRIPTION_REGISTRY as Record<string, unknown>).not.toHaveProperty("burpee");
  });

  test("sprawl vs. bear_crawl: both movement/technical/controlled_mobility_sets/bilateral/bodyweight, but sprawl narrows duration only (a reactive, ATP-PC defensive action) while bear_crawl narrows both sets and duration (a continuous locomotion action) — distinct dose-constraint shapes, not merely distinct names", () => {
    const sprawl = EXERCISE_PRESCRIPTION_REGISTRY.sprawl;
    const bearCrawl = EXERCISE_PRESCRIPTION_REGISTRY.bear_crawl;
    expect(sprawl.moduleId).toBe(bearCrawl.moduleId);
    expect(sprawl.explicitMethodId).toBe(bearCrawl.explicitMethodId);
    expect(sprawl.exerciseDoseConstraints?.minimumDose?.sets).toBeNull();
    expect(bearCrawl.exerciseDoseConstraints?.minimumDose?.sets).toBe(3);
    expect(sprawl.exerciseDoseConstraints?.maximumDose?.durationSeconds).toBe(30);
    expect(bearCrawl.exerciseDoseConstraints?.maximumDose?.durationSeconds).toBe(60);
    const sprawlKb = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "sprawl")!;
    const bearCrawlKb = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "bear_crawl")!;
    expect(sprawlKb.movementPatterns).not.toContain("locomotion");
    expect(bearCrawlKb.movementPatterns).toContain("locomotion");
  });

  test("sprawl vs. sprint_intervals: sprawl stays classified as movement/technical (a defensive ground-transition drill on a mat); sprint_intervals stays conditioning-module and was integrated only later, on its own terms — never absorbed into this lot", () => {
    const sprawlKb = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "sprawl")!;
    const sprintIntervalsKb = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "sprint_intervals")!;
    expect(sprawlKb.module).toBe("movement");
    expect(sprintIntervalsKb.module).toBe("conditioning");

    // Integrated in Registry Lot 6, under conditioning/work_rest_intervals
    // with no equipment at all — nothing about this lot's mat-based,
    // controlled_mobility_sets treatment was reused for it.
    const sprintIntervals = EXERCISE_PRESCRIPTION_REGISTRY.sprint_intervals;
    const sprawl = EXERCISE_PRESCRIPTION_REGISTRY.sprawl;
    expect(sprintIntervals.moduleId).toBe("conditioning");
    expect(sprintIntervals.explicitMethodId).toBe("work_rest_intervals");
    expect(sprintIntervals.capabilities.requiredEquipmentCapabilities).toEqual([]);
    expect(sprawl.capabilities.requiredEquipmentCapabilities).toEqual(["mat"]);
    expect(sprawl.explicitMethodId).toBe("controlled_mobility_sets");
  });

  test("shot_entries vs. technical_stand_up: both movement/technical/controlled_mobility_sets/mat-required/bilateral, but shot_entries is a standing-to-standing offensive penetration entry (sets pinned to 3) while technical_stand_up is a ground-to-standing defensive recovery movement (sets 2-3) — distinct instruction content and distinct narrowed ranges, not merely distinct names", () => {
    const shotEntries = EXERCISE_PRESCRIPTION_REGISTRY.shot_entries;
    const technicalStandUp = EXERCISE_PRESCRIPTION_REGISTRY.technical_stand_up;
    expect(shotEntries.moduleId).toBe(technicalStandUp.moduleId);
    expect(shotEntries.explicitMethodId).toBe(technicalStandUp.explicitMethodId);
    expect(shotEntries.capabilities.requiredEquipmentCapabilities).toEqual(technicalStandUp.capabilities.requiredEquipmentCapabilities);
    expect(shotEntries.exerciseDoseConstraints?.minimumDose?.sets).toBe(3);
    expect(technicalStandUp.exerciseDoseConstraints?.minimumDose?.sets).toBe(2);

    const shotEntriesExecution = shotEntries.instructionDefinitions.find((i) => i.category === "execution");
    const technicalStandUpExecution = technicalStandUp.instructionDefinitions.find((i) => i.category === "execution");
    expect(shotEntriesExecution?.text.toLowerCase()).toContain("penetrate");
    expect(technicalStandUpExecution?.text.toLowerCase()).not.toContain("penetrate");
    expect(technicalStandUpExecution?.text.toLowerCase()).toContain("protect the head");
    expect(shotEntriesExecution?.text.toLowerCase()).not.toContain("protect the head");
  });

  test("shot_entries vs. pummeling: pummeling requires a mandatory partner (human_assistance) and is entirely unintegrated in the registry; shot_entries requires only a mat and no partner, confirmed at the knowledge-base level and by direct search of the registry", () => {
    const shotEntriesKb = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "shot_entries")!;
    const pummelingKb = EXERCISE_KNOWLEDGE_BASE.find((e) => e.id === "pummeling")!;
    expect(shotEntriesKb.module).toBe(pummelingKb.module);

    const pummelingRequirements = (pummelingKb.requirements?.required ?? []).flatMap((c) => c.items);
    expect(pummelingRequirements.some((a) => a.kind === "human_assistance")).toBe(true);

    const shotEntriesRequirements = (shotEntriesKb.requirements?.required ?? []).flatMap((c) => c.items);
    expect(shotEntriesRequirements.some((a) => a.kind === "human_assistance")).toBe(false);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.shot_entries.capabilities.requiredEquipmentCapabilities).toEqual(["mat"]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY as Record<string, unknown>).not.toHaveProperty("pummeling");
  });

  test("shot_entries vs. weighted strength exercises (e.g. back_squat): entirely different module, method, loading mode and intensity vocabulary — no load-based prescription is introduced for shot_entries", () => {
    const shotEntries = EXERCISE_PRESCRIPTION_REGISTRY.shot_entries;
    const backSquat = EXERCISE_PRESCRIPTION_REGISTRY.back_squat;
    expect(shotEntries.moduleId).toBe("movement");
    expect(backSquat.moduleId).toBe("strength");
    expect(shotEntries.explicitMethodId).toBe("controlled_mobility_sets");
    expect(backSquat.explicitMethodId).toBe("straight_sets_repetitions");
    expect(shotEntries.capabilities.supportedLoadingModes).toEqual(["bodyweight"]);
    expect(backSquat.capabilities.supportedLoadingModes).toEqual(["barbell", "added_external_load"]);
    expect(shotEntries.supportedIntensityTypes).toEqual(["rpe", "technical_effort"]);
    expect(backSquat.supportedIntensityTypes).toContain("percentage_1rm");
    expect(shotEntries.supportedIntensityTypes).not.toContain("percentage_1rm");
  });
});

// -----------------------------------------------------------------------------
// 18. Registry validation and purely-additive non-regression
// -----------------------------------------------------------------------------

describe("registry Lot 4 — registry validation and non-regression", () => {
  test("the full registry validates with no new issue beyond the expected unresolved duration profiles", () => {
    const issues = validatePilotRegistry().filter((issue) => issue.code !== "UNRESOLVED_DURATION_PROFILE");
    expect(issues).toEqual([]);
  });

  test("the registry now contains exactly 59 active exercises (57 + sprawl + shot_entries)", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(69);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(69);
  });

  test("no historical entry was removed: all 57 previously-existing ids are still present", () => {
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
      "bear_crawl", "bridging", "footwork_drills", "shadow_boxing", "technical_stand_up", "shrimping",
    ] as const;
    expect(PREVIOUSLY_EXISTING_IDS).toHaveLength(57);
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

  for (const id of LOT4_EXERCISE_IDS) {
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

  test("a pre-existing, unrelated exercise from Lot 3 (shrimping) is unaffected by this lot's own changes", () => {
    const shrimping = EXERCISE_PRESCRIPTION_REGISTRY.shrimping;
    expect(shrimping.moduleId).toBe("movement");
    expect(shrimping.capabilities.laterality).toBe("bilateral");
    expect(shrimping.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 3, repetitions: null, durationSeconds: 20, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 3, repetitions: null, durationSeconds: 60, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/38_SHRIMPING"],
    });
  });
});
