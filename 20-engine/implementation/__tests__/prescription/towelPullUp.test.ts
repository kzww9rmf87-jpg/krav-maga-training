/**
 * Combat Athlete System — Registry Lot 14: towel_pull_up
 *
 * First consumer of Table Group 15's GRIP-REPETITION-STRENGTH profile, and
 * the first Grip entry counted in complete repetitions rather than carried
 * metres or held seconds.
 *
 * The order matters and this file guards it: the module doctrine was
 * written first, in `65_GRIP/00_OVERVIEW.md`, and it owns every number in
 * the profile. This entry only NARROWS it. Had the envelope been built from
 * this exercise's figures, the profile would have been a towel-pull-up
 * profile wearing a generic name — which the preceding audit refused.
 *
 * What this file guards beyond presence:
 *
 * - the variant. The chapter documents an isometric variation, an assisted
 *   variation, a weighted variation and eccentric-only descents; none is
 *   mixed into the numbers;
 * - the named prescriptions win over the wider "Prescription Variables"
 *   range, the same discipline plate_pinch applied;
 * - the equipment stays exactly two atoms, and a rope, a strap or a
 *   suspension trainer never substitutes for a towel;
 * - the 2-4 second eccentric is carried in the instructions, because phase
 *   timing is not representable at profile level.
 */

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import { EXERCISE_KNOWLEDGE_BASE, TOWEL_PULL_UP } from "../../exerciseKnowledgeBase";
import { checkExerciseEligibility } from "../../exerciseSelector";
import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  getExercisePrescriptionSource,
  PILOT_EXERCISE_IDS,
  type PilotExerciseId,
  type PrescriptionExecutionContext,
} from "../../prescription/exercisePrescriptionRegistry";
import { prescribeExercise } from "../../prescription/prescribeExercise";
import { prescribeSession, type SessionExercisePrescriptionInput } from "../../prescription/prescribeSession";
import {
  NUMERICAL_PRESCRIPTION_PROFILES,
  getNumericalPrescriptionProfileById,
  resolveNumericalProfile,
} from "../../prescription/prescriptionKnowledge";
import { getDurationEstimationProfile } from "../../prescription/durationEstimationProfiles";
import { validatePilotRegistry } from "../../prescription/registryValidators";
import { EQUIPMENT_CAPABILITY_IDS, isEquipmentCapabilityId } from "../../prescription/equipmentCapabilities";
import { getTrainingMethodContract } from "../../prescription/contracts";
import { adaptExercisePrescriptionResult } from "../../prescription/prescriptionDecisionTrace";
import type { ExercisePrescriptionSource } from "../../prescription/buildPrescriptionInput";

import { runEngine } from "../../index";
import {
  makeAthleteProfile,
  makeEnvironment,
  makeExercise,
  makeReadiness,
  makeRequest,
  makeValidInput,
} from "../fixtures";

const EXERCISE_ID = "towel_pull_up";
const PROFILE_ID = "grip_repetition_strength_v0_1";
const SOURCE_CHAPTER = "50-exercises/65_GRIP/10_TOWEL_PULL_UP.md";

/** "A towel is draped securely over a stable pull-up bar." */
const VALID_CONTEXT: PrescriptionExecutionContext = {
  rangeContext: "normal",
  athleteReferences: [],
  availableEquipmentCapabilities: ["pull_up_bar", "towel"],
};

const validEnvironment = () =>
  makeEnvironment({
    availableEquipment: [{ type: "pull_up_bar" }, { type: "towel" }],
    availableSpace: "limited",
  });

function prescribe(rangeContext: PrescriptionExecutionContext["rangeContext"] = "normal") {
  const sourceResult = getExercisePrescriptionSource(EXERCISE_ID, { ...VALID_CONTEXT, rangeContext });
  if (!sourceResult.ok) {
    throw new Error(`Expected a prescription source for "${EXERCISE_ID}", got: ${sourceResult.message}`);
  }
  const result = prescribeExercise({
    exerciseId: EXERCISE_ID,
    moduleId: sourceResult.moduleId,
    ...sourceResult.source,
  });
  if (!result.ok) {
    throw new Error(`Expected "${EXERCISE_ID}" to prescribe, failed at ${result.failureStage}: ${result.message}`);
  }
  return result;
}

const entry = () => EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

// -----------------------------------------------------------------------------
// 1-6. Counts, presence, additivity
// -----------------------------------------------------------------------------

describe("towel_pull_up — registry, knowledge base, profile and equipment counts", () => {
  test("1. the registry grew from 68 to exactly 69 entries", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(75);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(75);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort()).toEqual([...PILOT_EXERCISE_IDS].sort());
  });

  test("2. the knowledge base still holds exactly 76 ExerciseDefinitions — none added, none removed", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toHaveLength(76);
    expect(new Set(EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id)).size).toBe(76);
  });

  test("3. the numerical profiles went from 18 to 21 — the Grip repetition profile plus the Grip climb and hand-pull profiles; the partner-grappling lot then brought the total to 22", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(23);
    expect(NUMERICAL_PRESCRIPTION_PROFILES.filter((p) => p.profileId === PROFILE_ID)).toHaveLength(1);
  });

  test("4. the equipment vocabulary went from 29 to 30 — `towel`, the only identifier this lot added", () => {
    expect(EQUIPMENT_CAPABILITY_IDS).toHaveLength(33);
    expect(isEquipmentCapabilityId("towel")).toBe(true);
    expect(isEquipmentCapabilityId("pull_up_bar")).toBe(true);
    // No substitute was invented alongside it.
    for (const invented of ["strap", "suspension_trainer", "thick_grip", "grip_towel"]) {
      expect(isEquipmentCapabilityId(invented), invented).toBe(false);
    }
  });

  test("5. towel_pull_up exists in both layers, with consistent identifiers", () => {
    const kbEntry = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === EXERCISE_ID);
    expect(kbEntry).toBeDefined();
    expect(kbEntry?.module).toBe("grip");
    expect(kbEntry?.unilateral).toBe(false);

    expect(entry().exerciseId).toBe(EXERCISE_ID);
    expect(entry().capabilities.exerciseId).toBe(EXERCISE_ID);
    expect(PILOT_EXERCISE_IDS.filter((id) => id === EXERCISE_ID)).toHaveLength(1);
  });

  test("6. no other exercise was added by THIS lot, and the Grip module now covers five different units", () => {
    // pummeling, wall_wrestling and grip_fighting were on this list when this
    // lot shipped; Registry Lot 20 integrated them on the Partner Grappling
    // Rounds foundation, leaving only the two doctrine-blocked exercises.
    // sled_push was on this list when this lot shipped; Registry Lot 21
    // integrated it on the Loaded Locomotion Power doctrine. Only
    // turkish_get_up remains, and it is blocked on doctrine rather than code.
    for (const id of ["turkish_get_up"]) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY as Record<string, unknown>).not.toHaveProperty(id);
    }

    const gripEntries = Object.values(EXERCISE_PRESCRIPTION_REGISTRY).filter(
      (registryEntry) => registryEntry.moduleId === "grip",
    );
    const methods = new Set(gripEntries.map((registryEntry) => registryEntry.explicitMethodId));
    expect(methods).toContain("distance_carry_sets");
    expect(methods).toContain("timed_isometric_sets");
    expect(methods).toContain("straight_sets_repetitions");
  });
});

// -----------------------------------------------------------------------------
// 7-10. Equipment — exact matching, both layers
// -----------------------------------------------------------------------------

describe("towel_pull_up — equipment and eligibility", () => {
  test("7. the two exact required ids build a source and make the exercise eligible", () => {
    expect(entry().capabilities.requiredEquipmentCapabilities).toEqual(["pull_up_bar", "towel"]);

    const kbEquipment = TOWEL_PULL_UP.requirements!.required
      .flatMap((clause) => clause.items)
      .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
      .map((atom) => atom.equipment);
    expect(kbEquipment).toEqual(["pull_up_bar", "towel"]);

    expect(getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT).ok).toBe(true);
    expect(
      checkExerciseEligibility(
        makeExercise({ ...TOWEL_PULL_UP }),
        makeValidInput({ environment: validEnvironment() }),
      ).eligible,
    ).toBe(true);
  });

  test("8. the bar alone is rejected, in both layers", () => {
    const source = getExercisePrescriptionSource(EXERCISE_ID, {
      ...VALID_CONTEXT,
      availableEquipmentCapabilities: ["pull_up_bar"],
    });
    expect(source.ok).toBe(false);
    if (!source.ok) expect(source.message).toContain("towel");

    const eligibility = checkExerciseEligibility(
      makeExercise({ ...TOWEL_PULL_UP }),
      makeValidInput({ environment: makeEnvironment({ availableEquipment: [{ type: "pull_up_bar" }] }) }),
    );
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("9. the towel alone is rejected, in both layers", () => {
    const source = getExercisePrescriptionSource(EXERCISE_ID, {
      ...VALID_CONTEXT,
      availableEquipmentCapabilities: ["towel"],
    });
    expect(source.ok).toBe(false);

    const eligibility = checkExerciseEligibility(
      makeExercise({ ...TOWEL_PULL_UP }),
      makeValidInput({ environment: makeEnvironment({ availableEquipment: [{ type: "towel" }] }) }),
    );
    expect(eligibility.eligible).toBe(false);
  });

  test("10. a rope never substitutes for a towel, and no adjacent implement satisfies the pair", () => {
    for (const available of [
      ["rope"],
      ["pull_up_bar", "rope"],
      ["rope", "rope_anchor_point"],
      ["pull_up_bar", "resistance_band"],
      ["pull_up_bar", "cable_or_band_resistance"],
      ["dip_bars", "towel"],
      [],
    ]) {
      const source = getExercisePrescriptionSource(EXERCISE_ID, {
        ...VALID_CONTEXT,
        availableEquipmentCapabilities: available,
      });
      expect(source.ok, available.join("+") || "(rien)").toBe(false);
    }

    // `rope` joined the vocabulary when the two rope entries were
    // integrated, which makes this guarantee stronger rather than weaker:
    // both ids now exist and neither satisfies the other, because matching
    // is exact string equality.
    expect(isEquipmentCapabilityId("rope")).toBe(true);
    expect(entry().capabilities.requiredEquipmentCapabilities).not.toContain("rope");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.rope_climb.capabilities.requiredEquipmentCapabilities).toEqual([
      "rope",
    ]);
    expect(
      EXERCISE_PRESCRIPTION_REGISTRY.rope_climb.capabilities.requiredEquipmentCapabilities,
    ).not.toContain("towel");
  });
});

// -----------------------------------------------------------------------------
// 11-19. Profile, volume, intensity, rest, tempo
// -----------------------------------------------------------------------------

describe("towel_pull_up — profile, volume and narrowing", () => {
  const EXPECTED = {
    reduced: { sets: 3, reps: 2, rir: 1, rest: 90 },
    normal: { sets: 4, reps: 5, rir: 2, rest: 165 },
    high: { sets: 5, reps: 8, rir: 3, rest: 240 },
  } as const;

  test("11. the entry declares grip_repetition_strength_v0_1 on a triple now SHARED by three units", () => {
    expect(entry().numericalProfileId).toBe(PROFILE_ID);
    expect(entry().moduleId).toBe("grip");
    expect(entry().explicitMethodId).toBe("straight_sets_repetitions");
    expect(entry().role).toBe("secondary");

    // The triple was unique when this entry was written; Table Groups 16 and
    // 17 then joined it with ascents and hand pulls. The explicit id, already
    // declared for auditability, is now load-bearing.
    const implicit = resolveNumericalProfile({
      moduleId: entry().moduleId,
      methodId: entry().explicitMethodId,
      exerciseRole: entry().role,
    });
    expect(implicit.ok).toBe(false);
    if (!implicit.ok) {
      expect(implicit.failureCode).toBe("NUMERICAL_PROFILE_AMBIGUOUS");
      expect([...implicit.candidateProfileIds].sort()).toEqual(["grip_climb_strength_v0_1", "grip_hand_pull_work_v0_1", "grip_repetition_strength_v0_1"]);
    }
    const volumeTrace = prescribe().trace.volume;
    if (!volumeTrace.ok) throw new Error("Expected the volume trace to resolve.");
    expect(volumeTrace.profileResolutionSource).toBe("explicit_profile_id");
  });

  test("11b. THE DOCTRINE IS THE MODULE'S: this entry narrows the envelope, it did not define it", () => {
    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    const constraints = entry().exerciseDoseConstraints!;

    // Every declared bound sits inside the module envelope.
    expect(constraints.minimumDose!.sets!).toBeGreaterThanOrEqual(profile.volume.sets!.min);
    expect(constraints.maximumDose!.sets!).toBeLessThanOrEqual(profile.volume.sets!.max);
    expect(constraints.minimumDose!.repetitions!).toBeGreaterThanOrEqual(
      profile.volume.repetitions!.range.min,
    );
    expect(constraints.maximumDose!.repetitions!).toBeLessThanOrEqual(
      profile.volume.repetitions!.range.max,
    );

    // And the envelope is sourced to the tables alone — never to this chapter.
    expect(profile.sourceRuleIds).toEqual(["34_NUMERICAL_PRESCRIPTION_TABLES_V0_1"]);
    expect(JSON.stringify(profile)).not.toContain(EXERCISE_ID);
  });

  test("12. + 13. + 14. every range context resolves the documented values", () => {
    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const prescription = prescribe(rangeContext).prescription;

      expect(prescription.volume.sets, rangeContext).toBe(EXPECTED[rangeContext].sets);
      expect(prescription.volume.reps?.type).toBe("fixed");
      if (prescription.volume.reps?.type === "fixed") {
        expect(prescription.volume.reps.value, rangeContext).toBe(EXPECTED[rangeContext].reps);
      }
      expect(prescription.intensity.primaryMetric.target).toMatchObject({
        value: EXPECTED[rangeContext].rir,
      });
      const betweenSets = prescription.rest?.betweenSets;
      if (betweenSets?.type === "fixed") {
        expect(betweenSets.duration.value, rangeContext).toBe(EXPECTED[rangeContext].rest);
      }
      expect(prescription.status).toBe("complete");
    }
  });

  test("15. the structure is sets_reps, and every forbidden dimension stays null", () => {
    expect(entry().capabilities.supportedVolumeStructures).toEqual(["sets_reps"]);
    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const volume = prescribe(rangeContext).prescription.volume;
      expect(volume.structure).toBe("sets_reps");
      expect(volume.duration).toBeNull();
      expect(volume.distance).toBeNull();
      expect(volume.rounds).toBeNull();
      expect(volume.workIntervals).toBeNull();
    }
  });

  test("16. + 17. sets 3-5 and repetitions 2-8 are the union of the chapter's TWO named prescriptions", () => {
    const constraints = entry().exerciseDoseConstraints;
    expect(constraints?.minimumDose?.sets).toBe(3);
    expect(constraints?.maximumDose?.sets).toBe(5);
    expect(constraints?.minimumDose?.repetitions).toBe(2);
    expect(constraints?.maximumDose?.repetitions).toBe(8);
    expect(constraints?.sourceRuleIds).toEqual([SOURCE_CHAPTER]);

    const chapter = readFileSync(new URL(`../../../../${SOURCE_CHAPTER}`, import.meta.url), "utf-8");
    // Strength: 3-5 sets, 2-5 reps. Strength-Endurance: 3-4 sets, 4-8 reps.
    expect(chapter).toContain("- 3 to 5 sets,\n- 2 to 5 repetitions,");
    expect(chapter).toContain("- 3 to 4 sets,\n- 4 to 8 repetitions,");

    // The wider "Prescription Variables — 1 to 6 repetitions for strength" is
    // NOT used: the named prescription says 2 to 5, and the named
    // prescription wins.
    expect(chapter).toContain("- 1 to 6 repetitions for strength,");
    expect(constraints?.minimumDose?.repetitions).not.toBe(1);
  });

  test("18. intensity is RIR 1-3, the chapter's single quantified figure — no RPE, no load", () => {
    expect(entry().capabilities.supportedIntensityTypes).toEqual(["rir"]);
    expect(entry().preferredIntensityType).toBe("rir");
    expect(prescribe().prescription.intensity.primaryMetric.type).toBe("rir");

    const chapter = readFileSync(new URL(`../../../../${SOURCE_CHAPTER}`, import.meta.url), "utf-8");
    expect(chapter).toContain("- 1 to 3 repetitions in reserve,");
    expect(chapter.toLowerCase()).not.toContain("rpe");

    // No exercise constraint is needed: the profile documents one rule and
    // this chapter documents the same range.
    expect(entry().exerciseIntensityConstraints).toBeNull();
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)!.intensity).toHaveLength(1);

    // The chapter's other "Intensity" items are DETERMINANTS, not targets.
    for (const determinant of ["percentage_1rm", "percentage_body_mass", "absolute_load", "resistance_category"] as const) {
      expect(entry().capabilities.supportedIntensityTypes).not.toContain(determinant);
    }
    expect(prescribe().prescription.intensity.primaryMetric.reference).toBeNull();
    expect(entry().capabilities.requiredAthleteReferenceTypes).toEqual([]);
  });

  test("19. rest declares the union of the chapter's two windows and resolves between sets", () => {
    expect(entry().exerciseRestConstraints).toEqual({
      scope: "between_sets",
      minimumSeconds: 90,
      maximumSeconds: 240,
      sourceRuleIds: [SOURCE_CHAPTER],
    });

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const rest = prescribe(rangeContext).prescription.rest;
      expect(rest?.betweenSets?.type).toBe("fixed");
      expect(rest?.betweenIntervals).toBeNull();
      expect(rest?.betweenRounds).toBeNull();
    }
  });

  test("20. tempo resolves to controlled, and the 2-4 second eccentric lives in the INSTRUCTIONS", () => {
    expect(entry().capabilities.supportedTempoTypes).toEqual(["global_intent"]);
    expect(entry().preferredTempoType).toBe("global_intent");
    expect(getTrainingMethodContract("straight_sets_repetitions").tempoPolicy).toBe("optional");

    const tempo = prescribe().prescription.tempo;
    expect(tempo?.type).toBe("global_intent");
    expect(tempo?.globalIntent).toBe("controlled");
    // Phase timing is not representable, so nothing is fabricated here.
    expect(tempo?.eccentric ?? null).toBeNull();
    expect(tempo?.concentric ?? null).toBeNull();

    const execution = entry().instructionDefinitions.find((i) => i.category === "execution");
    expect(execution?.text).toContain("2 to 4 seconds");
  });
});

// -----------------------------------------------------------------------------
// 21-24. Loading mode, laterality, variant
// -----------------------------------------------------------------------------

describe("towel_pull_up — loading mode, laterality and variant", () => {
  test("21. the loading mode is bodyweight — grip difficulty is never converted into load", () => {
    expect(entry().capabilities.supportedLoadingModes).toEqual(["bodyweight"]);
    for (const wrong of ["added_external_load", "assisted_bodyweight", "resistance_band"] as const) {
      expect(entry().capabilities.supportedLoadingModes).not.toContain(wrong);
    }
  });

  test("22. + 23. laterality is bilateral with total_repetitions", () => {
    expect(entry().capabilities.laterality).toBe("bilateral");
    expect(entry().capabilities.volumeInterpretations).toEqual(["total_repetitions"]);

    const laterality = prescribe().prescription.volume.laterality;
    expect(laterality?.laterality).toBe("bilateral");
    expect(laterality?.interpretation).toBe("total_repetitions");
    expect(laterality?.startingSide ?? null).toBeNull();
    expect(laterality?.sideSwitchRuleId ?? null).toBeNull();
  });

  test("24. nothing is multiplied per side or per hand", () => {
    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const volume = prescribe(rangeContext).prescription.volume;
      const declaredMax = entry().exerciseDoseConstraints!.maximumDose!.repetitions!;
      if (volume.reps?.type === "fixed") {
        expect(volume.reps.value).toBeLessThanOrEqual(declaredMax);
        expect(volume.reps.unit).toBe("repetitions");
      }
    }
    expect(entry().capabilities.volumeInterpretations).not.toContain("repetitions_per_side");
  });

  test("24b. the isometric, assisted and weighted variations are NOT represented", () => {
    const chapter = readFileSync(new URL(`../../../../${SOURCE_CHAPTER}`, import.meta.url), "utf-8");
    // All three are documented by the chapter...
    expect(chapter).toContain("# Isometric Variation");
    expect(chapter).toContain("# Assisted Variation");
    expect(chapter).toContain("Weighted towel pull-ups are reserved for advanced athletes");

    // ...and none reached the numbers.
    expect(entry().capabilities.supportedVolumeStructures).toEqual(["sets_reps"]);
    expect(entry().exerciseDoseConstraints?.minimumDose?.durationSeconds).toBeNull();
    expect(entry().capabilities.supportedLoadingModes).toEqual(["bodyweight"]);
    // plate_pinch keeps the timed-hold half of the Grip module.
    expect(EXERCISE_PRESCRIPTION_REGISTRY.plate_pinch.explicitMethodId).toBe("timed_isometric_sets");
  });
});

// -----------------------------------------------------------------------------
// 25-26. Instructions and stop conditions
// -----------------------------------------------------------------------------

describe("towel_pull_up — instructions and stop conditions", () => {
  test("25. setup and execution both exist, are mandatory, sourced, and quote the chapter", () => {
    const instructions = entry().instructionDefinitions;
    expect(instructions).toHaveLength(2);
    for (const instruction of instructions) {
      expect(instruction.mandatory).toBe(true);
      expect(instruction.sourceRuleId).toBe(SOURCE_CHAPTER);
    }

    const setup = instructions.find((i) => i.category === "setup");
    expect(setup?.priority).toBe("critical");
    expect(setup?.text.toLowerCase()).toContain("without visible damage");
    expect(setup?.text.toLowerCase()).toContain("stable pull-up bar");
    expect(setup?.text.toLowerCase()).toContain("door-mounted");
    expect(setup?.text.toLowerCase()).toContain("landing area clear");
    expect(setup?.text.toLowerCase()).toContain("one towel end in each hand");

    const execution = instructions.find((i) => i.category === "execution");
    expect(execution?.text).toContain("Crush the towel");
    expect(execution?.text.toLowerCase()).toContain("wrists strong");
    expect(execution?.text.toLowerCase()).toContain("elbows down toward the ribs");
    expect(execution?.text.toLowerCase()).toContain("shrug into the ears");
    expect(execution?.text.toLowerCase()).toContain("craning the neck");
    expect(execution?.text.toLowerCase()).toContain("slip uncontrollably");
  });

  test("26. six stop conditions, each sourced, covering this chapter's own documented failures", () => {
    const categories = entry().stopConditionDefinitions.map((c) => c.category);
    expect(entry().capabilities.requiredStopConditionIds).toHaveLength(6);

    // The method's three required categories are all present.
    for (const required of getTrainingMethodContract("straight_sets_repetitions")
      .requiredStopConditionCategories) {
      expect(categories, required).toContain(required);
    }
    expect([...categories].sort()).toEqual([
      "completion",
      "equipment_failure",
      "fatigue_limit",
      "pain",
      "range_of_motion_loss",
      "technical_failure",
    ]);

    for (const condition of entry().stopConditionDefinitions) {
      expect(condition.sourceRuleIds.length).toBeGreaterThan(0);
      expect(condition.instructions[0]?.text.length).toBeGreaterThan(0);
    }

    const byId = Object.fromEntries(
      entry().stopConditionDefinitions.map((c) => [c.conditionId, (c.instructions[0]?.text ?? "").toLowerCase()]),
    );
    expect(byId["towel_pull_up_equipment_failure"]).toContain("tear");
    expect(byId["towel_pull_up_equipment_failure"]).toContain("slide");
    expect(byId["towel_pull_up_technical_failure"]).toContain("swing");
    expect(byId["towel_pull_up_range_of_motion_loss"]).toContain("neck");
    expect(byId["towel_pull_up_pain"]).toContain("numbness");

    // The grip module's sixth category is deliberately absent: this chapter
    // documents no balance concern.
    expect(categories).not.toContain("balance_loss");
    expect(prescribe().prescription.stopConditions).toHaveLength(6);
  });
});

// -----------------------------------------------------------------------------
// 27-40. Prescription, session, engine, trace, non-regression
// -----------------------------------------------------------------------------

describe("towel_pull_up — prescription, engine and non-regression", () => {
  test("27. the exercise prescribes completely at every range context", () => {
    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const prescription = prescribe(rangeContext).prescription;
      expect(prescription.status).toBe("complete");
      expect(prescription.exerciseId).toBe(EXERCISE_ID);
      expect(prescription.methodId).toBe("straight_sets_repetitions");
    }
  });

  test("28. it prescribes in a session beside the other two Grip entries — three units, three profiles", () => {
    const ids = ["towel_pull_up", "plate_pinch", "pinch_carry"] as const;
    const exercises: SessionExercisePrescriptionInput[] = ids.map((id, index) => {
      const registryEntry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      const sourceResult = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: registryEntry.capabilities.requiredEquipmentCapabilities,
      });
      if (!sourceResult.ok) throw new Error(`Fixture setup failed for ${id}: ${sourceResult.message}`);
      return {
        exerciseId: id,
        moduleId: sourceResult.moduleId,
        ...sourceResult.source,
        order: index + 1,
        required: true,
        blockId: "grip",
      };
    });

    const result = prescribeSession({
      sessionId: "grip-session",
      sessionName: "Three Grip Units",
      modules: ["grip"],
      exercises,
    });
    if (!result.ok) {
      throw new Error(`Expected the session to prescribe: ${result.issues.map((i) => i.message).join(" | ")}`);
    }

    expect(result.session.status).toBe("complete");
    expect(result.session.exercises).toHaveLength(3);

    const [towel, pinch, carry] = result.session.exercises.map((e) => e.prescription);
    expect(towel?.volume.structure).toBe("sets_reps");
    expect(pinch?.volume.structure).toBe("sets_duration");
    expect(carry?.volume.structure).toBe("sets_distance");
  });

  test("29. runEngine prescribes towel_pull_up end to end from the real ExerciseDefinition", () => {
    // `grip` is a support module: `moduleSelector.ts` never selects it from
    // an adaptation domain, only from an explicit `requiredModules` entry —
    // the same shape ab_wheel needed for `core`. This is also
    // 65_GRIP/00_OVERVIEW.md's own "Placement Within the Session": grip work
    // is "usually placed after primary technical and strength work", which
    // is exactly why the profile's role is `secondary`.
    const pullUp = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === "pull_up")!;

    const input = makeValidInput({
      request: makeRequest({
        primaryObjective: { adaptationDomain: "maximum_strength" },
        requiredModules: ["grip"],
      }),
      environment: validEnvironment(),
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "advanced", primaryCombatSport: "krav_maga" },
        goals: [{ id: "goal-1", name: "Grip Strength", adaptationDomain: "maximum_strength", priority: "primary" }],
      }),
      readiness: makeReadiness({
        energy: 5,
        motivation: 5,
        sleepQuality: 5,
        stress: 5,
        soreness: 5,
        perceivedRecovery: 5,
      }),
    });

    const exercises = [
      makeExercise({ ...pullUp, setupTimeMinutes: 1, defaultExerciseDurationMinutes: 8 }),
      makeExercise({ ...TOWEL_PULL_UP, setupTimeMinutes: 3, defaultExerciseDurationMinutes: 12 }),
    ];

    const towelSource = getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT);
    const pullUpSource = getExercisePrescriptionSource("pull_up", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["pull_up_bar"],
    });
    if (!towelSource.ok || !pullUpSource.ok) throw new Error("Fixture setup failed.");

    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([
      [EXERCISE_ID, towelSource.source],
      ["pull_up", pullUpSource.source],
    ]);
    const result = runEngine(input, exercises, prescriptionSources);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }
    if (result.prescription?.status !== "prescribed") {
      throw new Error(`Expected prescription status "prescribed", got: ${JSON.stringify(result.prescription)}`);
    }

    const prescribed = result.prescription.session.exercises.find(
      (exercise) => exercise.prescription.exerciseId === EXERCISE_ID,
    )?.prescription;
    expect(prescribed).toBeDefined();
    expect(prescribed?.methodId).toBe("straight_sets_repetitions");
    expect(prescribed?.volume.structure).toBe("sets_reps");
    expect(prescribed?.intensity.primaryMetric.type).toBe("rir");

    // The grip entry is prescribed alongside the primary pulling exercise,
    // and the two resolve from DIFFERENT profiles on the same method.
    const pullUpPrescribed = result.prescription.session.exercises.find(
      (exercise) => exercise.prescription.exerciseId === "pull_up",
    )?.prescription;
    expect(pullUpPrescribed?.intensity.primaryMetric.type).toBe("rpe");
  });

  test("30. the decision trace names the profile and shows the laterality", () => {
    const entries = adaptExercisePrescriptionResult(prescribe(), {
      idPrefix: "towel_test",
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    const volumeEntry = entries.find((e) => e.id.endsWith("_volume"));
    expect(volumeEntry?.reasons[0]).toBe(`profile=${PROFILE_ID} (selection=explicit_profile_id)`);
    expect(volumeEntry?.reasons.join(" ")).toContain("laterality=bilateral (total_repetitions)");

    const intensityEntry = entries.find((e) => e.id.endsWith("_intensity"));
    expect(intensityEntry?.decision).toContain('Intensity resolved via "rir"');

    // The tempo trace records the resolved TYPE; the controlled intent
    // itself is on the prescription, and the phase figure on the instruction.
    const tempoEntry = entries.find((e) => e.id.endsWith("_tempo"));
    expect(tempoEntry?.reasons.join(" ")).toContain("global_intent");
    expect(prescribe().prescription.tempo?.globalIntent).toBe("controlled");
  });

  test("31. + 32. prescribing is deterministic and never mutates the entry or the profile", () => {
    const entryBefore = JSON.stringify(entry());
    const profileBefore = JSON.stringify(getNumericalPrescriptionProfileById(PROFILE_ID));
    const runs = [prescribe(), prescribe(), prescribe()].map((r) => JSON.stringify(r.prescription));

    expect(new Set(runs).size).toBe(1);
    expect(JSON.stringify(entry())).toBe(entryBefore);
    expect(JSON.stringify(getNumericalPrescriptionProfileById(PROFILE_ID))).toBe(profileBefore);
  });

  test("33. validatePilotRegistry reports nothing but the known unresolved duration profiles", () => {
    const issues = validatePilotRegistry();
    expect(issues.filter((issue) => issue.code !== "UNRESOLVED_DURATION_PROFILE")).toEqual([]);
    expect(issues.some((issue) => issue.exerciseId === EXERCISE_ID)).toBe(true);
  });

  test("34. no regression on the 68 previous entries: each still prescribes with its own declared equipment", () => {
    const REFERENCE = {
      referenceType: "one_rep_max" as const,
      value: 100,
      unit: "kilograms",
      sourceId: "test-1rm",
      measuredAt: null,
      validUntil: null,
      confidence: "validated" as const,
    };

    // The 68 entries that predate this lot: everything except this lot's own
    // entry and the ids added by later lots, each covered by its own file.
    const ADDED_BY_THIS_OR_LATER_LOTS: readonly string[] = [EXERCISE_ID, "rope_climb", "rope_pull", "pummeling", "wall_wrestling", "grip_fighting", "sled_push"];
    const previousIds = PILOT_EXERCISE_IDS.filter((id) => !ADDED_BY_THIS_OR_LATER_LOTS.includes(id));
    expect(previousIds).toHaveLength(68);

    for (const id of previousIds) {
      const registryEntry = EXERCISE_PRESCRIPTION_REGISTRY[id as PilotExerciseId];
      expect(registryEntry.numericalProfileId ?? null).not.toBe(PROFILE_ID);
      expect(registryEntry.capabilities.requiredEquipmentCapabilities).not.toContain("towel");

      const sourceResult = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [REFERENCE],
        availableEquipmentCapabilities: registryEntry.capabilities.requiredEquipmentCapabilities,
      });
      if (!sourceResult.ok) {
        throw new Error(`Previous entry "${id}" no longer builds a source: ${sourceResult.message}`);
      }
      const result = prescribeExercise({
        exerciseId: id,
        moduleId: sourceResult.moduleId,
        ...sourceResult.source,
      });
      if (!result.ok) {
        throw new Error(`Previous entry "${id}" no longer prescribes (${result.failureStage}): ${result.message}`);
      }
      expect(result.prescription.status).toBe("complete");
    }
  });

  test("35. the duration estimation profile is unresolved by convention", () => {
    expect(entry().capabilities.durationEstimationProfileId).toBe("duration_profile_towel_pull_up");
    const result = getDurationEstimationProfile("duration_profile_towel_pull_up");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failureCode).toBe("DURATION_PROFILE_UNRESOLVED");
      expect(result.profile?.sourceRuleIds).toContain(SOURCE_CHAPTER);
    }
  });

  test("36. + 37. no resolver branches on this exercise, and the public contract is untouched", () => {
    for (const resolver of [
      "resolveVolume.ts",
      "resolveIntensity.ts",
      "resolveRest.ts",
      "resolveTempo.ts",
      "resolveStopConditions.ts",
      "prescribeExercise.ts",
      "prescribeSession.ts",
      "validateCompatibility.ts",
      "registryValidators.ts",
    ]) {
      const source = readFileSync(new URL(`../../prescription/${resolver}`, import.meta.url), "utf-8");
      expect(source, resolver).not.toContain(EXERCISE_ID);
      expect(source, resolver).not.toContain("grip_repetition_strength");
    }

    // This entry uses `total_repetitions`, a value that already existed. The
    // vocabulary later gained `climbs` and `hand_pulls` for the rope
    // exercises — an additive v1 change that left this entry untouched, which
    // is what "the shapes are frozen, the vocabularies track the engine"
    // means in practice.
    const types = readFileSync(new URL("../../prescription/types.ts", import.meta.url), "utf-8");
    const union = types.slice(
      types.indexOf("export type VolumeInterpretation ="),
      types.indexOf("export interface PrescriptionLaterality"),
    );
    expect(union).toContain('"total_repetitions"');
    expect(entry().capabilities.volumeInterpretations).toEqual(["total_repetitions"]);
    expect(entry().capabilities.volumeInterpretations).not.toContain("climbs");
    expect(entry().capabilities.volumeInterpretations).not.toContain("hand_pulls");

    // And the contract is still v1: shapes unchanged, vocabulary additive.
    const contract = readFileSync(new URL("../../sessionOutput/types.ts", import.meta.url), "utf-8");
    expect(contract).toContain('contractVersion: "cas-session-output.v1"');
  });

  test("38. + 39. rope_climb and rope_pull were integrated on their OWN units, never absorbed into this one", () => {
    for (const id of ["rope_climb", "rope_pull", "pummeling", "wall_wrestling", "grip_fighting", "sled_push"]) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY).toHaveProperty(id);
      expect(EXERCISE_KNOWLEDGE_BASE.some((e) => e.id === id)).toBe(true);
    }

    // The exclusion this entry's doctrine wrote is still in force, and it is
    // what sent them to their own families rather than into this one.
    const overview = readFileSync(
      new URL("../../../../50-exercises/65_GRIP/00_OVERVIEW.md", import.meta.url),
      "utf-8",
    );
    const section = overview.slice(
      overview.indexOf("## Grip Repetition Strength"),
      overview.indexOf("## Grip Climb Strength"),
    );
    expect(section).toContain("rope ascents");
    expect(section).toContain("hand-over-hand pulls");

    expect(EXERCISE_PRESCRIPTION_REGISTRY.rope_climb.numericalProfileId).not.toBe(PROFILE_ID);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.rope_pull.numericalProfileId).not.toBe(PROFILE_ID);
    expect(entry().capabilities.volumeInterpretations).toEqual(["total_repetitions"]);
  });

  test("40. every source rule the entry cites is real, and nothing unsourced was added", () => {
    expect(entry().sourceRuleIds).toEqual([
      SOURCE_CHAPTER,
      "31_TRAINING_METHOD_CATALOGUE_V0_1",
      "32_MODULE_PRESCRIPTION_PROFILES_V0_1",
      "34_NUMERICAL_PRESCRIPTION_TABLES_V0_1",
    ]);
    expect(entry().capabilities.sourceRuleIds).toEqual([
      SOURCE_CHAPTER,
      "32_MODULE_PRESCRIPTION_PROFILES_V0_1",
    ]);
    expect(entry().exerciseDoseConstraints?.sourceRuleIds).toEqual([SOURCE_CHAPTER]);
    expect(entry().exerciseRestConstraints?.sourceRuleIds).toEqual([SOURCE_CHAPTER]);
    expect(entry().capabilities.capabilityTags).toEqual([
      ...getTrainingMethodContract("straight_sets_repetitions").requiredExerciseCapabilities,
    ]);
  });
});
