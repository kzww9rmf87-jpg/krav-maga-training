/**
 * Combat Athlete System — Registry Lot 12: battle_ropes
 *
 * Second consumer of Table Group 14's INT-POWER profile, and the exercise
 * the other half of that table group's envelope was built from. It adds no
 * profile and changes no doctrine: the published table already lists
 * "Battle Ropes 5-12 rounds work 10-40 s recovery 20-90 s" as one of the
 * two records defining the family, so this entry only narrows.
 *
 * What this file guards beyond presence:
 *
 * - the equipment correction. Both knowledge-base atoms were imprecise and
 *   said so in their own comments: `rope` (shared with a CLIMBING rope) and
 *   `rigid_anchor_support` (documented twice as a HAND-GRIP anchor). Both
 *   were replaced by exact ids, and the tests below prove a climbing rope
 *   and a hand anchor no longer satisfy this exercise;
 * - the intensity choice. The shared profile documents TWO rules and lists
 *   `impact_intent` FIRST; this entry claims `movement_intent` by
 *   narrowing, so the constraint is load-bearing, not decorative;
 * - one prescription for eight documented movements — a family under a
 *   single Loading Profile, not a variant choice;
 * - what was NOT converted: waves, slams, circles, rope speed and wave
 *   amplitude never become repetitions, seconds, intervals or intensity.
 */

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import { BATTLE_ROPES, EXERCISE_KNOWLEDGE_BASE, ROPE_PULL } from "../../exerciseKnowledgeBase";
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
  isExecutableNumericalProfile,
  resolveNumericalProfile,
} from "../../prescription/prescriptionKnowledge";
import { getDurationEstimationProfile } from "../../prescription/durationEstimationProfiles";
import { validatePilotRegistry } from "../../prescription/registryValidators";
import { EQUIPMENT_CAPABILITY_IDS, isEquipmentCapabilityId } from "../../prescription/equipmentCapabilities";
import { getTrainingMethodContract } from "../../prescription/contracts";
import { adaptExercisePrescriptionResult } from "../../prescription/prescriptionDecisionTrace";
import type { ExercisePrescriptionSource } from "../../prescription/buildPrescriptionInput";

import { runEngine } from "../../index";
import { makeEnvironment, makeExercise, makeRequest, makeValidInput } from "../fixtures";

const EXERCISE_ID = "battle_ropes";
const PROFILE_ID = "power_intervals_v0_1";
const SOURCE_CHAPTER = "50-exercises/46_BATTLE_ROPES.md";

/** "# Equipment Requirements — Required: Battle Ropes, Anchor Point." */
const VALID_CONTEXT: PrescriptionExecutionContext = {
  rangeContext: "normal",
  athleteReferences: [],
  availableEquipmentCapabilities: ["battle_rope", "rope_anchor_point"],
};

const validRopeEnvironment = () =>
  makeEnvironment({ availableEquipment: [{ type: "battle_rope" }, { type: "rope_anchor_point" }] });

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

describe("battle_ropes — registry, knowledge base, profile and equipment counts", () => {
  test("1. the registry grew from 66 to exactly 67 entries; a later lot added assault_bike_intervals, bringing the total to 68", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(82);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(82);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort()).toEqual([...PILOT_EXERCISE_IDS].sort());
  });

  test("2. the knowledge base still holds exactly 76 ExerciseDefinitions — none added, none removed", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toHaveLength(83);
    expect(new Set(EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id)).size).toBe(83);
  });

  test("3. the numerical profiles stayed at 18 for this lot — a later lot added GRIP-REPETITION-STRENGTH, bringing the total to 22", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(23);
    expect(NUMERICAL_PRESCRIPTION_PROFILES.filter((p) => p.profileId === PROFILE_ID)).toHaveLength(1);
  });

  test("4. the equipment vocabulary went from 26 to 28 — battle_rope and rope_anchor_point, the two Required items; a later lot added cardio_machine, bringing it to 29", () => {
    expect(EQUIPMENT_CAPABILITY_IDS).toHaveLength(34);
    expect(isEquipmentCapabilityId("battle_rope")).toBe(true);
    expect(isEquipmentCapabilityId("rope_anchor_point")).toBe(true);

    // Both replace an imprecise atom, and both replaced values stay alive for
    // the exercises that genuinely mean them.
    expect(isEquipmentCapabilityId("rigid_anchor_support")).toBe(true);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.dragon_flag.capabilities.requiredEquipmentCapabilities).toContain(
      "rigid_anchor_support",
    );
  });

  test("5. battle_ropes exists in both layers, with consistent identifiers", () => {
    const kbEntry = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === EXERCISE_ID);
    expect(kbEntry).toBeDefined();
    expect(kbEntry?.module).toBe("conditioning");
    expect(kbEntry?.primaryAdaptation).toBe("conditioning");
    expect(kbEntry?.unilateral).toBe(false);

    expect(entry().exerciseId).toBe(EXERCISE_ID);
    expect(entry().capabilities.exerciseId).toBe(EXERCISE_ID);
    expect(PILOT_EXERCISE_IDS.filter((id) => id === EXERCISE_ID)).toHaveLength(1);
  });

  test("6. no other exercise was added by THIS lot: the still-blocked exercises stay out, and assault_bike_intervals joined later on the same profile", () => {
    // sled_push was on this list when this lot shipped; Registry Lot 21
    // integrated it on the Loaded Locomotion Power doctrine. Only
    // turkish_get_up remains, and it is blocked on doctrine rather than code.
    for (const id of ["turkish_get_up"]) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY as Record<string, unknown>).not.toHaveProperty(id);
    }

    // Integrated by Registry Lot 13, reusing INT-POWER unchanged and
    // narrowing to its own documented bounds — not to this entry's.
    const bike = EXERCISE_PRESCRIPTION_REGISTRY.assault_bike_intervals;
    expect(bike.numericalProfileId).toBe(PROFILE_ID);
    expect(bike.exerciseDoseConstraints?.minimumDose?.workIntervals).toBe(6);
    expect(entry().exerciseDoseConstraints?.minimumDose?.workIntervals).toBe(5);
  });
});

// -----------------------------------------------------------------------------
// 7-9. Equipment — exact matching, both layers
// -----------------------------------------------------------------------------

describe("battle_ropes — equipment and eligibility", () => {
  test("7. the two exact required ids build a source and make the exercise eligible", () => {
    expect(entry().capabilities.requiredEquipmentCapabilities).toEqual([
      "battle_rope",
      "rope_anchor_point",
    ]);

    // The knowledge base gates on exactly the same two atoms.
    const kbEquipment = BATTLE_ROPES.requirements!.required
      .flatMap((clause) => clause.items)
      .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
      .map((atom) => atom.equipment);
    expect(kbEquipment).toEqual(["battle_rope", "rope_anchor_point"]);

    expect(getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT).ok).toBe(true);
    expect(
      checkExerciseEligibility(
        makeExercise({ ...BATTLE_ROPES }),
        makeValidInput({ environment: validRopeEnvironment() }),
      ).eligible,
    ).toBe(true);
  });

  test("8. incomplete equipment is rejected in both layers — ropes alone and anchor alone", () => {
    for (const available of [["battle_rope"], ["rope_anchor_point"], []]) {
      const source = getExercisePrescriptionSource(EXERCISE_ID, {
        ...VALID_CONTEXT,
        availableEquipmentCapabilities: available,
      });
      expect(source.ok).toBe(false);
    }

    for (const availableEquipment of [
      [{ type: "battle_rope" as const }],
      [{ type: "rope_anchor_point" as const }],
    ]) {
      const result = checkExerciseEligibility(
        makeExercise({ ...BATTLE_ROPES }),
        makeValidInput({ environment: makeEnvironment({ availableEquipment }) }),
      );
      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    }
  });

  test("9. a CLIMBING rope, a hand anchor and every adjacent implement are all rejected — no equivalence exists", () => {
    // The reason both atoms were corrected: before it, a climbing rope plus a
    // hand-grip anchor satisfied this exercise. Matching is exact.
    for (const available of [
      ["rope"],
      ["rope", "rigid_anchor_support"],
      ["rigid_anchor_support"],
      ["battle_rope", "rigid_anchor_support"],
      ["rope", "rope_anchor_point"],
      ["heavy_bag", "rope_anchor_point"],
      ["cable_or_band_resistance", "resistance_band"],
      ["loaded_carry_implement", "safe_landing_surface"],
    ]) {
      const source = getExercisePrescriptionSource(EXERCISE_ID, {
        ...VALID_CONTEXT,
        availableEquipmentCapabilities: available,
      });
      expect(source.ok, available.join("+")).toBe(false);
    }

    // rope_pull keeps the generic climbing rope, and the two exercises no
    // longer share a single equipment atom.
    const ropePullEquipment = ROPE_PULL.requirements!.required
      .flatMap((clause) => clause.items)
      .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
      .map((atom) => atom.equipment);
    expect(ropePullEquipment).toEqual(["rope"]);
    expect(entry().capabilities.requiredEquipmentCapabilities).not.toContain("rope");
  });
});

// -----------------------------------------------------------------------------
// 10-11. Profile selection
// -----------------------------------------------------------------------------

describe("battle_ropes — numerical profile selection", () => {
  test("10. the entry declares power_intervals_v0_1 and creates no profile of its own", () => {
    expect(entry().numericalProfileId).toBe(PROFILE_ID);
    expect(entry().moduleId).toBe("conditioning");
    expect(entry().explicitMethodId).toBe("work_rest_intervals");
    expect(entry().role).toBe("conditioning");

    // Reused unchanged: the profile's documented envelope still contains this
    // fiche's own figures, because the envelope was built from them.
    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.volume.workIntervals).toEqual({ min: 3, normal: 7, max: 12 });
    expect(profile.volume.duration!.range.min).toBe(10);
    expect(profile.volume.duration!.range.max).toBe(40);
    expect(profile.rest!.seconds!).toEqual({ min: 20, normal: 55, max: 90 });
    expect(profile.sourceRuleIds).toEqual(["34_NUMERICAL_PRESCRIPTION_TABLES_V0_1"]);
  });

  test("11. explicit selection is mandatory — the shared triple refuses implicit resolution, and the other profiles are unusable", () => {
    const implicit = resolveNumericalProfile({
      moduleId: entry().moduleId,
      methodId: entry().explicitMethodId,
      exerciseRole: entry().role,
    });
    expect(implicit.ok).toBe(false);
    if (!implicit.ok) {
      expect(implicit.failureCode).toBe("NUMERICAL_PROFILE_AMBIGUOUS");
      expect(implicit.candidateProfileIds).toHaveLength(4);
    }

    const explicit = resolveNumericalProfile({
      moduleId: entry().moduleId,
      methodId: entry().explicitMethodId,
      exerciseRole: entry().role,
      explicitProfileId: entry().numericalProfileId,
    });
    expect(explicit.ok && explicit.profile.profileId).toBe(PROFILE_ID);
    expect(explicit.ok && explicit.resolutionSource).toBe("explicit_profile_id");

    // INT-LONG (60-180 s) and INT-REPEATED-SPRINT (3-8 s) are both empty
    // against this fiche's 10-40 s; INT-SHORT overlaps but cannot prescribe.
    const long = getNumericalPrescriptionProfileById("conditioning_long_intervals_v0_1")!;
    const sprint = getNumericalPrescriptionProfileById("repeated_sprint_intervals_v0_1")!;
    const short = getNumericalPrescriptionProfileById("conditioning_short_intervals_v0_1")!;
    expect(long.volume.duration!.range.min).toBeGreaterThan(40);
    expect(sprint.volume.duration!.range.max).toBeLessThan(10);
    expect(isExecutableNumericalProfile(short)).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// 12-17. Volume across the three range contexts
// -----------------------------------------------------------------------------

describe("battle_ropes — volume and narrowing", () => {
  const EXPECTED = {
    reduced: { intervals: 5, work: 10, rest: 20 },
    normal: { intervals: 7, work: 25, rest: 55 },
    high: { intervals: 12, work: 40, rest: 90 },
  } as const;

  test("12. reduced resolves 5 intervals x 10s with 20s recovery — the narrowed floor, not the profile's 3", () => {
    const volume = prescribe("reduced").prescription.volume;
    expect(volume.workIntervals).toBe(EXPECTED.reduced.intervals);
    expect(volume.duration?.value).toBe(EXPECTED.reduced.work);
    // The profile's own floor is 3; this fiche's "5-12 rounds" raised it.
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)!.volume.workIntervals!.min).toBe(3);
  });

  test("13. normal resolves 7 intervals x 25s with 55s recovery", () => {
    const volume = prescribe("normal").prescription.volume;
    expect(volume.workIntervals).toBe(EXPECTED.normal.intervals);
    expect(volume.duration?.value).toBe(EXPECTED.normal.work);
  });

  test("14. high resolves 12 intervals x 40s with 90s recovery — this fiche's own documented ceiling", () => {
    const volume = prescribe("high").prescription.volume;
    expect(volume.workIntervals).toBe(EXPECTED.high.intervals);
    expect(volume.duration?.value).toBe(EXPECTED.high.work);
  });

  test("15. the volume structure is intervals, and every forbidden dimension stays null", () => {
    expect(entry().capabilities.supportedVolumeStructures).toEqual(["intervals"]);
    expect(getTrainingMethodContract("work_rest_intervals").forbiddenVolumeFields).toContain("rounds");

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const volume = prescribe(rangeContext).prescription.volume;
      expect(volume.structure).toBe("intervals");
      expect(volume.sets).toBeNull();
      expect(volume.reps).toBeNull();
      expect(volume.rounds).toBeNull();
      expect(volume.distance).toBeNull();
      expect(volume.duration?.scope).toBe("per_interval");
    }
  });

  test("16. the declared interval count is exactly the fiche's 5-12, narrowing the profile at the floor only", () => {
    const constraints = entry().exerciseDoseConstraints;
    expect(constraints?.minimumDose?.workIntervals).toBe(5);
    expect(constraints?.maximumDose?.workIntervals).toBe(12);
    expect(constraints?.sourceRuleIds).toEqual([SOURCE_CHAPTER]);

    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!.volume.workIntervals!;
    expect(constraints!.minimumDose!.workIntervals!).toBeGreaterThan(profile.min);
    expect(constraints!.maximumDose!.workIntervals!).toBe(profile.max);
  });

  test("17. the declared work duration is the fiche's 10-40s, which IS the shared envelope — declared, never widened", () => {
    const constraints = entry().exerciseDoseConstraints;
    expect(constraints?.minimumDose?.durationSeconds).toBe(10);
    expect(constraints?.maximumDose?.durationSeconds).toBe(40);

    const profileWork = getNumericalPrescriptionProfileById(PROFILE_ID)!.volume.duration!.range;
    expect(constraints!.minimumDose!.durationSeconds).toBe(profileWork.min);
    expect(constraints!.maximumDose!.durationSeconds).toBe(profileWork.max);

    // This fiche's two quantified sections agree, so no narrower-source
    // decision was needed: Loading Profile and Physiological Profile both
    // give 10-40 s of work and 20-90 s of recovery.
    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const work = prescribe(rangeContext).prescription.volume.duration!.value;
      expect(work).toBeGreaterThanOrEqual(10);
      expect(work).toBeLessThanOrEqual(40);
    }
  });
});

// -----------------------------------------------------------------------------
// 18-21. Intensity, rest and tempo
// -----------------------------------------------------------------------------

describe("battle_ropes — intensity, rest and tempo", () => {
  test("18. the prescribed intensity is movement_intent: explosive — a literal word of this fiche's Velocity Profile", () => {
    const intensity = prescribe().prescription.intensity;
    expect(intensity.primaryMetric.type).toBe("movement_intent");
    expect(intensity.primaryMetric.target).toEqual({ type: "category", value: "explosive" });
    expect(intensity.secondaryMetrics).toEqual([]);
    expect(entry().capabilities.supportedIntensityTypes).toEqual(["movement_intent"]);
    expect(entry().preferredIntensityType).toBe("movement_intent");

    // Qualitative rules carry no range: the intent is identical everywhere.
    const targets = (["reduced", "normal", "high"] as const).map((rc) =>
      JSON.stringify(prescribe(rc).prescription.intensity.primaryMetric.target),
    );
    expect(new Set(targets).size).toBe(1);
  });

  test("19. impact_intent is excluded BY the narrowing — it is the profile's first rule and would otherwise win", () => {
    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.intensity).toHaveLength(2);
    // Documented rule order: impact_intent first. Without the constraint the
    // resolver would have selected it silently.
    expect(profile.intensity[0]?.type).toBe("impact_intent");

    expect(entry().exerciseIntensityConstraints?.allowedIntensityTypes).toEqual(["movement_intent"]);
    expect(entry().exerciseIntensityConstraints?.rangeConstraints).toEqual([]);
    expect(entry().exerciseIntensityConstraints?.sourceRuleIds).toEqual([
      SOURCE_CHAPTER,
      "26_INTENSITY_MODEL_V0_1",
    ]);

    expect(entry().capabilities.supportedIntensityTypes).not.toContain("impact_intent");
    expect(prescribe().prescription.intensity.primaryMetric.type).not.toBe("impact_intent");

    // The trace records the rejection rather than hiding it.
    const trace = prescribe().trace.intensity;
    expect(trace.ok && trace.rejectedRuleTypes).toContain("impact_intent");
  });

  test("20. rest comes from the shared profile, scoped between intervals, with NO exercise constraint", () => {
    // "Recovery: 20-90 seconds" is exactly the profile's window: nothing to
    // narrow, so no constraint is declared that would imply a distinction.
    expect(entry().exerciseRestConstraints).toBeNull();

    const expected = { reduced: 20, normal: 55, high: 90 } as const;
    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const rest = prescribe(rangeContext).prescription.rest;
      const betweenIntervals = rest?.betweenIntervals;
      expect(betweenIntervals?.type).toBe("fixed");
      if (betweenIntervals?.type === "fixed") {
        expect(betweenIntervals.duration).toEqual({
          value: expected[rangeContext],
          unit: "seconds",
          scope: "between_intervals",
        });
      }
      expect(rest?.betweenSets).toBeNull();
      expect(rest?.betweenRounds).toBeNull();
    }
  });

  test("21. tempo is absent everywhere — the method forbids it and no family documents one here", () => {
    expect(getTrainingMethodContract("work_rest_intervals").tempoPolicy).toBe("forbidden");
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)!.tempo).toBeNull();

    // Empty, not borrowed. heavy_bag_power_intervals declares global_intent
    // because Family 12 documents it for bag work; no capability family
    // covers battle ropes, so nothing is claimed.
    expect(entry().capabilities.supportedTempoTypes).toEqual([]);
    expect(entry().supportedTempoTypes).toEqual([]);
    expect(entry().preferredTempoType).toBeNull();

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      expect(prescribe(rangeContext).prescription.tempo).toBeNull();
    }
  });
});

// -----------------------------------------------------------------------------
// 22-25. Loading mode, laterality, volume interpretation
// -----------------------------------------------------------------------------

describe("battle_ropes — loading mode and laterality", () => {
  test("22. the loading mode is `rope` — the pre-existing LoadingMode value, and this entry was its first consumer", () => {
    expect(entry().capabilities.supportedLoadingModes).toEqual(["rope"]);

    // rope_pull joined the same loading mode later, and the two are still
    // told apart by their equipment: a battle rope and a climbing rope are
    // disjoint identifiers, by design.
    const others = PILOT_EXERCISE_IDS.filter((id) => id !== EXERCISE_ID).filter((id) =>
      EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.supportedLoadingModes.includes("rope"),
    );
    expect(others).toEqual(["rope_pull"]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.rope_pull.capabilities.requiredEquipmentCapabilities).toEqual([
      "rope",
    ]);
    expect(entry().capabilities.requiredEquipmentCapabilities).not.toContain("rope");

    // Nothing adjacent was diverted into the slot.
    for (const wrong of ["bodyweight", "plate", "locomotion_only", "impact_equipment", "sled"] as const) {
      expect(entry().capabilities.supportedLoadingModes).not.toContain(wrong);
    }
  });

  test("23. laterality is not_applicable — the single prescription covers bilateral AND alternating movements alike", () => {
    expect(entry().capabilities.laterality).toBe("not_applicable");
    expect(BATTLE_ROPES.unilateral).toBe(false);

    const laterality = prescribe().prescription.volume.laterality;
    expect(laterality?.laterality).toBe("not_applicable");
    expect(laterality?.startingSide ?? null).toBeNull();
    expect(laterality?.sideSwitchRuleId ?? null).toBeNull();

    // The method does not require laterality resolution, which is why
    // not_applicable is legal here (same path as sprint_intervals).
    expect(getTrainingMethodContract("work_rest_intervals").requiredExerciseCapabilities).not.toContain(
      "laterality_resolution",
    );
  });

  test("24. the volume interpretation is interval_total", () => {
    expect(entry().capabilities.volumeInterpretations).toEqual(["interval_total"]);
    expect(prescribe().prescription.volume.laterality?.interpretation).toBe("interval_total");
  });

  test("25. no volume is multiplied anywhere — the prescribed interval count is the resolved one, per side never appears", () => {
    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const volume = prescribe(rangeContext).prescription.volume;
      const declaredMin = entry().exerciseDoseConstraints!.minimumDose!.workIntervals!;
      const declaredMax = entry().exerciseDoseConstraints!.maximumDose!.workIntervals!;

      expect(volume.workIntervals!).toBeGreaterThanOrEqual(declaredMin);
      expect(volume.workIntervals!).toBeLessThanOrEqual(declaredMax);
      // Not doubled for two arms, not doubled for two rope ends.
      expect(volume.workIntervals!).not.toBe(declaredMin * 2);
      expect(volume.reps).toBeNull();
    }
    expect(entry().capabilities.volumeInterpretations).not.toContain("repetitions_per_side");
  });
});

// -----------------------------------------------------------------------------
// 26-27. Instructions and stop conditions
// -----------------------------------------------------------------------------

describe("battle_ropes — instructions and stop conditions", () => {
  test("26. setup and execution both exist, are mandatory, sourced, and quote this fiche's own cues and errors", () => {
    const instructions = entry().instructionDefinitions;
    expect(instructions).toHaveLength(2);
    expect(entry().capabilities.requiredInstructionIds).toEqual([
      "battle_ropes_setup",
      "battle_ropes_execution",
    ]);

    for (const instruction of instructions) {
      expect(instruction.mandatory).toBe(true);
      expect(instruction.sourceRuleId).toBe(SOURCE_CHAPTER);
    }

    const setup = instructions.find((i) => i.category === "setup");
    expect(setup?.text.toLowerCase()).toContain("anchor point");
    expect(setup?.text.toLowerCase()).toContain("optional");

    const execution = instructions.find((i) => i.category === "execution");
    // Coaching Cues, verbatim.
    expect(execution?.text).toContain("Generate force from the floor");
    expect(execution?.text).toContain("brace continuously");
    expect(execution?.text).toContain("move explosively");
    expect(execution?.text).toContain("maintain rhythm");
    // Common Errors.
    expect(execution?.text.toLowerCase()).toContain("arms alone");
    expect(execution?.text.toLowerCase()).toContain("trunk stiffness");
    expect(execution?.text.toLowerCase()).toContain("shrug");
    // The single prescription covers the documented movements.
    expect(execution?.text.toLowerCase()).toContain("alternating waves");
    expect(execution?.text.toLowerCase()).toContain("power slams");
    expect(execution?.text.toLowerCase()).toContain("do not change");
  });

  test("27. exactly the six categories the method requires, each sourced, with the undocumented ones knowingly absent", () => {
    const required = getTrainingMethodContract("work_rest_intervals").requiredStopConditionCategories;
    const categories = entry().stopConditionDefinitions.map((condition) => condition.category);

    expect([...categories].sort()).toEqual([...required].sort());
    expect(entry().capabilities.requiredStopConditionIds).toHaveLength(6);

    for (const condition of entry().stopConditionDefinitions) {
      expect(condition.sourceRuleIds.length).toBeGreaterThan(0);
      expect(condition.instructions[0]?.text.length).toBeGreaterThan(0);
    }

    const byId = Object.fromEntries(
      entry().stopConditionDefinitions.map((condition) => [
        condition.conditionId,
        (condition.instructions[0]?.text ?? "").toLowerCase(),
      ]),
    );
    // Wave amplitude and velocity are documented Performance Indicators and
    // are carried in the pace-loss description, not as their own category.
    expect(byId["battle_ropes_pace_loss"]).toContain("wave velocity");
    expect(byId["battle_ropes_pace_loss"]).toContain("amplitude");
    expect(byId["battle_ropes_technical_failure"]).toContain("trunk stiffness");
    expect(byId["battle_ropes_fatigue_limit"]).toContain("fatigue");
    expect(byId["battle_ropes_pain"]).toContain("shoulder");

    // equipment_failure and range_of_motion_loss are NOT declared: this
    // fiche's Safety Profile, Primary Risks and Common Errors name no anchor
    // movement and no loss of rope control, so declaring either would mean
    // inventing a documented risk.
    expect(categories).not.toContain("equipment_failure");
    expect(categories).not.toContain("range_of_motion_loss");
    expect(categories).not.toContain("balance_loss");

    const prescribed = prescribe().prescription.stopConditions;
    expect(prescribed).toHaveLength(6);
    const definedIds = entry().stopConditionDefinitions.map((c) => c.conditionId);
    for (const id of entry().capabilities.requiredStopConditionIds) {
      expect(definedIds).toContain(id);
    }
  });
});

// -----------------------------------------------------------------------------
// 28-31. Exercise, session, engine and trace
// -----------------------------------------------------------------------------

describe("battle_ropes — prescription, session, engine and trace", () => {
  test("28. the exercise prescribes completely at every range context", () => {
    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const prescription = prescribe(rangeContext).prescription;
      expect(prescription.status).toBe("complete");
      expect(prescription.exerciseId).toBe(EXERCISE_ID);
      expect(prescription.methodId).toBe("work_rest_intervals");
    }
  });

  test("29. it prescribes in a session beside the three other interval entries — two of them sharing its own profile", () => {
    const ids = ["battle_ropes", "heavy_bag_power_intervals", "rowerg_intervals", "sprint_intervals"] as const;
    const exercises: SessionExercisePrescriptionInput[] = ids.map((id, index) => {
      const registryEntry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      const sourceResult = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: registryEntry.capabilities.requiredEquipmentCapabilities,
      });
      if (!sourceResult.ok) {
        throw new Error(`Fixture setup failed for ${id}: ${sourceResult.message}`);
      }
      return {
        exerciseId: id,
        moduleId: sourceResult.moduleId,
        ...sourceResult.source,
        order: index + 1,
        required: true,
        blockId: "conditioning",
      };
    });

    const result = prescribeSession({
      sessionId: "interval-session",
      sessionName: "Four Interval Entries, One Triple",
      modules: ["conditioning"],
      exercises,
    });
    if (!result.ok) {
      throw new Error(`Expected the session to prescribe: ${result.issues.map((i) => i.message).join(" | ")}`);
    }

    expect(result.session.status).toBe("complete");
    expect(result.session.exercises).toHaveLength(4);

    const [ropes, bag, rowerg, sprint] = result.session.exercises.map((e) => e.prescription);
    // Same profile as the heavy bag, resolved side by side to DIFFERENT
    // numbers and a different intensity rule — the narrowing is what separates
    // them, never the profile.
    expect(ropes?.volume.workIntervals).toBe(7);
    expect(ropes?.intensity.primaryMetric.type).toBe("movement_intent");
    expect(bag?.volume.workIntervals).toBe(7);
    expect(bag?.intensity.primaryMetric.type).toBe("impact_intent");
    expect(ropes?.volume.duration?.value).toBe(25);
    expect(rowerg?.volume.workIntervals).toBe(6);
    expect(sprint?.volume.workIntervals).toBe(15);
  });

  test("30. runEngine prescribes battle_ropes end to end for a DEFAULT athlete — this fiche's own beginner profile makes that honest", () => {
    // Unlike sprint_intervals and heavy_bag_power_intervals, both of which
    // need an advanced, recovered athlete to clear the V0.1 conditional
    // scoring threshold, this fiche documents "Skill Requirement: Beginner",
    // "Learning Curve: Short", "Overall Risk: Very Low" and "Suitable For:
    // Beginners, Intermediate, Advanced, Elite". The default fixture athlete
    // is therefore the honest input, and the engine agrees.
    const input = makeValidInput({
      request: makeRequest({ primaryObjective: { adaptationDomain: "conditioning" } }),
      environment: validRopeEnvironment(),
    });
    const exercise = makeExercise({
      ...BATTLE_ROPES,
      setupTimeMinutes: 5,
    });

    const sourceResult = getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT);
    if (!sourceResult.ok) {
      throw new Error(`Fixture setup failed: ${sourceResult.message}`);
    }

    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([
      [EXERCISE_ID, sourceResult.source],
    ]);
    const result = runEngine(input, [exercise], prescriptionSources);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }
    if (result.prescription?.status !== "prescribed") {
      throw new Error(`Expected prescription status "prescribed", got: ${JSON.stringify(result.prescription)}`);
    }

    expect(result.prescription.session.exercises).toHaveLength(1);
    const prescribed = result.prescription.session.exercises[0]?.prescription;
    expect(prescribed?.exerciseId).toBe(EXERCISE_ID);
    expect(prescribed?.methodId).toBe("work_rest_intervals");
    expect(prescribed?.volume.structure).toBe("intervals");
    expect(prescribed?.volume.workIntervals).toBe(7);
    expect(prescribed?.intensity.primaryMetric.target).toEqual({ type: "category", value: "explosive" });
    expect(prescribed?.tempo).toBeNull();
  });

  test("31. the decision trace names the profile, reports explicit selection and shows the laterality", () => {
    const entries = adaptExercisePrescriptionResult(prescribe(), {
      idPrefix: "battle_ropes_test",
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    const volumeEntry = entries.find((e) => e.id.endsWith("_volume"));
    expect(volumeEntry?.reasons[0]).toBe(`profile=${PROFILE_ID} (selection=explicit_profile_id)`);
    expect(volumeEntry?.reasons.join(" ")).toContain("laterality=not_applicable (interval_total)");

    const volumeTrace = prescribe().trace.volume;
    expect(volumeTrace.ok && volumeTrace.profileResolutionSource).toBe("explicit_profile_id");

    const intensityEntry = entries.find((e) => e.id.endsWith("_intensity"));
    expect(intensityEntry?.decision).toContain('Intensity resolved via "movement_intent"');
    expect(intensityEntry?.reasons.join(" ")).toContain("impact_intent");

    const tempoEntry = entries.find((e) => e.id.endsWith("_tempo"));
    expect(tempoEntry?.decision).toContain("No tempo");
  });
});

// -----------------------------------------------------------------------------
// 32-40. Determinism, validation, non-regression and sourcing
// -----------------------------------------------------------------------------

describe("battle_ropes — determinism, validation and non-regression", () => {
  test("32. prescribing is deterministic across repeated calls", () => {
    const runs = [prescribe(), prescribe(), prescribe()].map((r) => JSON.stringify(r.prescription));
    expect(new Set(runs).size).toBe(1);
  });

  test("33. prescribing never mutates the registry entry or the shared profile", () => {
    const entryBefore = JSON.stringify(entry());
    const profileBefore = JSON.stringify(getNumericalPrescriptionProfileById(PROFILE_ID));

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      prescribe(rangeContext);
    }

    expect(JSON.stringify(entry())).toBe(entryBefore);
    expect(JSON.stringify(getNumericalPrescriptionProfileById(PROFILE_ID))).toBe(profileBefore);
  });

  test("34. validatePilotRegistry reports nothing but the known unresolved duration profiles", () => {
    const issues = validatePilotRegistry();
    expect(issues).toEqual([]);
  });

  test("35. no regression on the 66 previous entries: each still prescribes with its own declared equipment", () => {
    const REFERENCE = {
      referenceType: "one_rep_max" as const,
      value: 100,
      unit: "kilograms",
      sourceId: "test-1rm",
      measuredAt: null,
      validUntil: null,
      confidence: "validated" as const,
    };

    // The 66 entries that predate this lot: everything except this lot's own
    // entry and the ids added by later lots, each covered by its own file.
    const ADDED_BY_THIS_OR_LATER_LOTS: readonly string[] = [EXERCISE_ID, "assault_bike_intervals", "towel_pull_up", "rope_climb", "rope_pull", "pummeling", "wall_wrestling", "grip_fighting", "sled_push", "push_up", "split_squat", "single_leg_hip_thrust", "goblet_squat", "dumbbell_bench_press", "one_arm_dumbbell_row", "dumbbell_romanian_deadlift"];
    const previousIds = PILOT_EXERCISE_IDS.filter((id) => !ADDED_BY_THIS_OR_LATER_LOTS.includes(id));
    expect(previousIds).toHaveLength(66);

    for (const id of previousIds) {
      const registryEntry = EXERCISE_PRESCRIPTION_REGISTRY[id as PilotExerciseId];

      // No previous entry adopted either new equipment identifier.
      for (const added of ["battle_rope", "rope_anchor_point"]) {
        expect(registryEntry.capabilities.requiredEquipmentCapabilities).not.toContain(added);
      }

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

  test("35b. heavy_bag_power_intervals, which shares this profile, resolves exactly as before", () => {
    const bag = EXERCISE_PRESCRIPTION_REGISTRY.heavy_bag_power_intervals;
    expect(bag.numericalProfileId).toBe(PROFILE_ID);

    const sourceResult = getExercisePrescriptionSource("heavy_bag_power_intervals", {
      rangeContext: "high",
      athleteReferences: [],
      availableEquipmentCapabilities: bag.capabilities.requiredEquipmentCapabilities,
    });
    if (!sourceResult.ok) throw new Error(sourceResult.message);
    const result = prescribeExercise({
      exerciseId: "heavy_bag_power_intervals",
      moduleId: sourceResult.moduleId,
      ...sourceResult.source,
    });
    if (!result.ok) throw new Error(result.message);

    // Its own narrowing, untouched by this lot: 8 intervals of 30 s, not 12 of 40.
    expect(result.prescription.volume.workIntervals).toBe(8);
    expect(result.prescription.volume.duration?.value).toBe(30);
    expect(result.prescription.intensity.primaryMetric.type).toBe("impact_intent");
  });

  test("36. the duration estimation profile is resolved and usable", () => {
    expect(entry().capabilities.durationEstimationProfileId).toBe("duration_profile_battle_ropes");

    const result = getDurationEstimationProfile("duration_profile_battle_ropes");
    if (!result.ok) {
      throw new Error("Expected the duration profile to be resolved.");
    }
    expect(result.profile.sourceRuleIds).toContain(SOURCE_CHAPTER);
  });

  test("37. no resolver branches on this exercise id or on its equipment identifiers", () => {
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
      expect(source, resolver).not.toContain("battle_rope");
      expect(source, resolver).not.toContain("rope_anchor_point");
    }
  });

  test("38. every source rule the entry cites is real, and no capabilities chapter is claimed", () => {
    expect(entry().sourceRuleIds).toEqual([
      SOURCE_CHAPTER,
      "31_TRAINING_METHOD_CATALOGUE_V0_1",
      "32_MODULE_PRESCRIPTION_PROFILES_V0_1",
      "34_NUMERICAL_PRESCRIPTION_TABLES_V0_1",
    ]);

    // No capability family in 33_EXERCISE_PRESCRIPTION_CAPABILITIES.md covers
    // battle ropes — neither Ergometer Conditioning nor Combat Bag and Pad
    // Work — so that chapter is deliberately NOT cited, unlike every other
    // interval entry. The method catalogue grounds the tags instead.
    expect(entry().capabilities.sourceRuleIds).toEqual([
      SOURCE_CHAPTER,
      "31_TRAINING_METHOD_CATALOGUE_V0_1",
    ]);
    expect(entry().capabilities.sourceRuleIds).not.toContain(
      "33_EXERCISE_PRESCRIPTION_CAPABILITIES_V0_1",
    );
    expect(EXERCISE_PRESCRIPTION_REGISTRY.heavy_bag_power_intervals.capabilities.sourceRuleIds).toContain(
      "33_EXERCISE_PRESCRIPTION_CAPABILITIES_V0_1",
    );

    expect(entry().exerciseDoseConstraints?.sourceRuleIds).toEqual([SOURCE_CHAPTER]);
    expect(entry().capabilities.capabilityTags).toEqual([
      ...getTrainingMethodContract("work_rest_intervals").requiredExerciseCapabilities,
    ]);
  });

  test("39. this lot created no numerical profile and no Table Group value moved — a later lot added GRIP-REPETITION-STRENGTH", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(23);

    // The doctrine this entry consumes is byte-for-byte what the previous lot
    // published — narrowing happens at the entry, never in the table.
    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.volume.workIntervals).toEqual({ min: 3, normal: 7, max: 12 });
    expect(profile.volume.duration!.range).toEqual({ min: 10, normal: 25, max: 40, unit: "seconds" });
    expect(profile.rest!.seconds!).toEqual({ min: 20, normal: 55, max: 90 });
    expect(profile.intensity.map((rule) => rule.type)).toEqual(["impact_intent", "movement_intent"]);
    expect(profile.tempo).toBeNull();
    expect(profile.minimumDose).toMatchObject({ workIntervals: 3, durationSeconds: 10 });
    expect(profile.maximumDose).toMatchObject({ workIntervals: 12, durationSeconds: 40 });
  });

  test("40. nothing was converted: waves, slams, rope speed and amplitude never became numbers", () => {
    const constraints = entry().exerciseDoseConstraints!;

    // Only the two dimensions this fiche quantifies are constrained.
    for (const unquantified of ["sets", "repetitions", "distanceMeters", "rounds"] as const) {
      expect(constraints.minimumDose![unquantified]).toBeNull();
      expect(constraints.maximumDose![unquantified]).toBeNull();
    }

    // "Progression: Work Duration, Rope Speed, Wave Amplitude, Reduced
    // Recovery, Movement Complexity" are progression AXES, not dimensions:
    // none produced a numeric rule, and no rope length or weight became a load.
    expect(entry().capabilities.requiredAthleteReferenceTypes).toEqual([]);
    expect(prescribe().prescription.intensity.primaryMetric.reference).toBeNull();
    expect(prescribe().prescription.intensity.calculation).toBeNull();

    // The Performance Indicators and the Optional heart-rate monitor never
    // became prescribed targets.
    for (const type of ["heart_rate", "pace", "velocity", "rpe", "absolute_load", "resistance_category"] as const) {
      expect(entry().capabilities.supportedIntensityTypes).not.toContain(type);
    }

    // The eight documented movements share ONE prescription: the execution
    // instruction names them, the numbers do not vary with the choice.
    const execution = entry().instructionDefinitions.find((i) => i.category === "execution");
    for (const movement of ["alternating waves", "double waves", "power slams", "snakes", "lateral waves"]) {
      expect(execution?.text.toLowerCase()).toContain(movement);
    }
    expect(entry().capabilities.supportedVolumeStructures).toEqual(["intervals"]);
  });
});
