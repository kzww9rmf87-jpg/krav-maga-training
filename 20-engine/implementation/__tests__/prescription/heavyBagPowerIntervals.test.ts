/**
 * Combat Athlete System — Registry Lot 11: heavy_bag_power_intervals
 *
 * First entry on the `heavy_bag` equipment capability, and the first
 * consumer of Table Group 14's INT-POWER profile — a table group that had
 * to be written before this entry could exist, because all three Table
 * Group 8 interval profiles are arithmetically EMPTY against this fiche
 * (see powerIntervalProfile.test.ts).
 *
 * What this file guards beyond presence:
 *
 * - the profile choice, asserted arithmetically rather than by preference:
 *   no other interval profile intersects this fiche on both axes, and the
 *   one it might have been forced onto (INT-SHORT) cannot prescribe at all;
 * - the "rounds" resolution. This fiche says "3-8 rounds" but is titled
 *   "Power INTERVALS" and calls the same quantity a "Work Interval" in its
 *   own Physiological Profile. It is read as the interval count, and the
 *   `rounds` volume field is never used — the method forbids it;
 * - the two-source volume decision: the Loading Profile governs, the wider
 *   Physiological Profile does not;
 * - the intensity choice. The profile documents TWO rules and this entry
 *   claims exactly one, by narrowing, for a documented reason;
 * - the equipment gap: gloves and hand wraps are Required by the fiche and
 *   are NOT representable in the prescription vocabulary — flagged, still
 *   gated by the knowledge base, and restated as a critical instruction.
 */

import { describe, expect, test } from "vitest";

import { EXERCISE_KNOWLEDGE_BASE, HEAVY_BAG_POWER_INTERVALS } from "../../exerciseKnowledgeBase";
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
import { makeAthleteProfile, makeEnvironment, makeExercise, makeReadiness, makeRequest, makeValidInput } from "../fixtures";

const EXERCISE_ID = "heavy_bag_power_intervals";
const PROFILE_ID = "power_intervals_v0_1";
const SOURCE_CHAPTER = "50-exercises/27_HEAVY_BAG_POWER_INTERVALS";

const VALID_CONTEXT: PrescriptionExecutionContext = {
  rangeContext: "normal",
  athleteReferences: [],
  availableEquipmentCapabilities: ["heavy_bag"],
};

/**
 * The knowledge base gates this exercise on `heavy_bag` AND the flagged
 * `other` placeholder standing for "Gloves"/"Hand Wraps". Both are supplied.
 */
const validBagEnvironment = () =>
  makeEnvironment({ availableEquipment: [{ type: "heavy_bag" }, { type: "other" }] });

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

// -----------------------------------------------------------------------------
// 1-6. Counts, presence, additivity
// -----------------------------------------------------------------------------

describe("heavy_bag_power_intervals — registry, knowledge base, profile and equipment counts", () => {
  test("1. the registry grew from 65 to exactly 66 entries", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(67);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(67);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort()).toEqual([...PILOT_EXERCISE_IDS].sort());
  });

  test("2. the knowledge base still holds exactly 76 ExerciseDefinitions — none added, none removed", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toHaveLength(76);
    expect(new Set(EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id)).size).toBe(76);
  });

  test("3. the numerical profiles went from 17 to 18 — INT-POWER, implemented once, by the preceding commit", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(18);
    expect(NUMERICAL_PRESCRIPTION_PROFILES.filter((p) => p.profileId === PROFILE_ID)).toHaveLength(1);
  });

  test("4. the equipment vocabulary went from 25 to 26 — `heavy_bag`, the only identifier this lot added", () => {
    expect(EQUIPMENT_CAPABILITY_IDS).toHaveLength(28);
    expect(isEquipmentCapabilityId("heavy_bag")).toBe(true);
    // Aligned 1:1 with a pre-existing knowledge-base `EquipmentType` member —
    // nothing was added to that union for this entry.
    const kbEquipment = HEAVY_BAG_POWER_INTERVALS.requirements!.required
      .flatMap((clause) => clause.items)
      .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
      .map((atom) => atom.equipment);
    expect(kbEquipment).toContain("heavy_bag");
  });

  test("5. heavy_bag_power_intervals exists in both layers, with consistent identifiers", () => {
    const kbEntry = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === EXERCISE_ID);
    expect(kbEntry).toBeDefined();
    expect(kbEntry?.module).toBe("conditioning");
    expect(kbEntry?.primaryAdaptation).toBe("conditioning");
    expect(kbEntry?.unilateral).toBe(false);

    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.exerciseId).toBe(EXERCISE_ID);
    expect(entry.capabilities.exerciseId).toBe(EXERCISE_ID);
    expect(PILOT_EXERCISE_IDS.filter((id) => id === EXERCISE_ID)).toHaveLength(1);
  });

  test("6. the other conditioning modalities named alongside this one stay out of the registry; battle_ropes joined later on the SAME profile, narrowed differently", () => {
    for (const id of ["assault_bike_intervals", "sled_push", "turkish_get_up", "towel_pull_up"]) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY as Record<string, unknown>).not.toHaveProperty(id);
    }

    // battle_ropes is the OTHER documented member of Table Group 14's family.
    // The table group was built from both, so the envelope still covers its
    // documented bounds — and when it was integrated it reused this profile
    // unchanged, narrowing to its own figures rather than moving the doctrine.
    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.volume.workIntervals!.max).toBeGreaterThanOrEqual(12);
    expect(profile.volume.duration!.range.max).toBeGreaterThanOrEqual(40);

    const ropes = EXERCISE_PRESCRIPTION_REGISTRY.battle_ropes;
    expect(ropes.numericalProfileId).toBe(PROFILE_ID);
    expect(ropes.exerciseDoseConstraints?.minimumDose?.workIntervals).toBe(5);
    expect(ropes.exerciseDoseConstraints?.maximumDose?.workIntervals).toBe(12);
    // Same profile, different documented narrowing on every shared axis.
    const bag = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(bag.exerciseDoseConstraints?.maximumDose?.workIntervals).toBe(8);
    expect(bag.exerciseDoseConstraints?.maximumDose?.durationSeconds).toBe(30);
    expect(ropes.exerciseDoseConstraints?.maximumDose?.durationSeconds).toBe(40);
  });
});

// -----------------------------------------------------------------------------
// 7-11. The profile choice, proved arithmetically
// -----------------------------------------------------------------------------

describe("heavy_bag_power_intervals — why INT-POWER and no other interval profile", () => {
  const DOCUMENTED = { intervals: [3, 8], work: [10, 30], rest: [30, 90] } as const;

  test("7. the entry declares INT-POWER explicitly — the triple is shared by four profiles and never resolves implicitly", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.numericalProfileId).toBe(PROFILE_ID);
    expect(entry.moduleId).toBe("conditioning");
    expect(entry.explicitMethodId).toBe("work_rest_intervals");
    expect(entry.role).toBe("conditioning");

    const implicit = resolveNumericalProfile({
      moduleId: entry.moduleId,
      methodId: entry.explicitMethodId,
      exerciseRole: entry.role,
    });
    expect(implicit.ok).toBe(false);
    if (!implicit.ok) {
      expect(implicit.failureCode).toBe("NUMERICAL_PROFILE_AMBIGUOUS");
      expect(implicit.candidateProfileIds).toHaveLength(4);
      expect(implicit.candidateProfileIds).toContain(PROFILE_ID);
    }

    const explicit = resolveNumericalProfile({
      moduleId: entry.moduleId,
      methodId: entry.explicitMethodId,
      exerciseRole: entry.role,
      explicitProfileId: entry.numericalProfileId,
    });
    expect(explicit.ok && explicit.profile.profileId).toBe(PROFILE_ID);
    expect(explicit.ok && explicit.resolutionSource).toBe("explicit_profile_id");
  });

  test("8. INT-SHORT could not have served this entry: its interval count is disjoint AND it cannot prescribe at all", () => {
    const short = getNumericalPrescriptionProfileById("conditioning_short_intervals_v0_1")!;
    const intervals = short.volume.workIntervals!;

    // [10, 20] against this fiche's [3, 8] — no overlap whatsoever.
    expect(Math.max(intervals.min, DOCUMENTED.intervals[0])).toBeGreaterThan(
      Math.min(intervals.max, DOCUMENTED.intervals[1]),
    );
    expect(isExecutableNumericalProfile(short)).toBe(false);
    expect(short.intensity).toHaveLength(0);
  });

  test("9. INT-LONG and INT-REPEATED-SPRINT are both empty against this fiche's work duration, in opposite directions", () => {
    const long = getNumericalPrescriptionProfileById("conditioning_long_intervals_v0_1")!.volume.duration!.range;
    const sprint = getNumericalPrescriptionProfileById("repeated_sprint_intervals_v0_1")!.volume.duration!.range;

    // INT-LONG sits entirely above 30s; INT-REPEATED-SPRINT entirely below 10s.
    expect(long.min).toBeGreaterThan(DOCUMENTED.work[1]);
    expect(sprint.max).toBeLessThan(DOCUMENTED.work[0]);
  });

  test("10. INT-POWER's envelope CONTAINS every documented bound — so the entry only ever narrows", () => {
    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;

    expect(profile.volume.workIntervals!.min).toBeLessThanOrEqual(DOCUMENTED.intervals[0]);
    expect(profile.volume.workIntervals!.max).toBeGreaterThanOrEqual(DOCUMENTED.intervals[1]);
    expect(profile.volume.duration!.range.min).toBeLessThanOrEqual(DOCUMENTED.work[0]);
    expect(profile.volume.duration!.range.max).toBeGreaterThanOrEqual(DOCUMENTED.work[1]);
    expect(profile.rest!.seconds!.min).toBeLessThanOrEqual(DOCUMENTED.rest[0]);
    expect(profile.rest!.seconds!.max).toBeGreaterThanOrEqual(DOCUMENTED.rest[1]);
  });

  test("11. Table Group 9's combat-rounds profile was NOT used, despite this fiche's word `rounds`", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.explicitMethodId).not.toBe("combat_rounds");

    // The combat-rounds profile refuses to prescribe without a sport-specific
    // subtype, which this fiche never supplies.
    const combatRounds = NUMERICAL_PRESCRIPTION_PROFILES.find(
      (profile) => profile.methodId === "combat_rounds",
    );
    expect(combatRounds?.requiresSportSpecificSubtype).toBe(true);

    // And the `rounds` volume field is forbidden outright by this entry's method.
    expect(getTrainingMethodContract("work_rest_intervals").forbiddenVolumeFields).toContain("rounds");
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)!.volume.rounds).toBeNull();
  });
});

// -----------------------------------------------------------------------------
// 12-16. Volume, rest and the two-source decision
// -----------------------------------------------------------------------------

describe("heavy_bag_power_intervals — volume and rest", () => {
  test("12. the declared dose constraints are exactly the Loading Profile's figures", () => {
    const constraints = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseDoseConstraints;

    expect(constraints?.minimumDose).toEqual({
      sets: null, repetitions: null, durationSeconds: 10, distanceMeters: null, rounds: null, workIntervals: 3,
    });
    expect(constraints?.maximumDose).toEqual({
      sets: null, repetitions: null, durationSeconds: 30, distanceMeters: null, rounds: null, workIntervals: 8,
    });
    expect(constraints?.sourceRuleIds).toEqual([SOURCE_CHAPTER]);
  });

  test("13. the wider Physiological Profile figures are NOT used — the narrower prescription section governs", () => {
    const constraints = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseDoseConstraints;
    const rest = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseRestConstraints;

    // "# Physiological Profile — Typical Work Interval: 5-30 seconds.
    // Typical Recovery: 30-120 seconds." Neither bound leaked in.
    expect(constraints?.minimumDose?.durationSeconds).not.toBe(5);
    expect(rest?.maximumSeconds).not.toBe(120);
    expect(constraints?.minimumDose?.durationSeconds).toBe(10);
    expect(rest?.maximumSeconds).toBe(90);
  });

  test("14. rest narrows the profile's floor from 20 to 30 and keeps the shared ceiling", () => {
    const rest = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseRestConstraints;
    const profileRest = getNumericalPrescriptionProfileById(PROFILE_ID)!.rest!.seconds!;

    expect(rest).toEqual({
      scope: "between_intervals",
      minimumSeconds: 30,
      maximumSeconds: 90,
      sourceRuleIds: [SOURCE_CHAPTER],
    });
    expect(rest!.minimumSeconds!).toBeGreaterThan(profileRest.min);
    expect(rest!.maximumSeconds).toBe(profileRest.max);
  });

  test("15. every range context resolves inside the documented bounds, on the interval structure alone", () => {
    const expected = {
      reduced: { intervals: 3, work: 10, rest: 30 },
      normal: { intervals: 7, work: 25, rest: 55 },
      high: { intervals: 8, work: 30, rest: 90 },
    } as const;

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const prescription = prescribe(rangeContext).prescription;

      expect(prescription.volume.structure).toBe("intervals");
      expect(prescription.volume.workIntervals).toBe(expected[rangeContext].intervals);
      expect(prescription.volume.duration?.value).toBe(expected[rangeContext].work);
      expect(prescription.volume.duration?.scope).toBe("per_interval");

      // Forbidden dimensions are never fabricated.
      expect(prescription.volume.sets).toBeNull();
      expect(prescription.volume.reps).toBeNull();
      expect(prescription.volume.rounds).toBeNull();
      expect(prescription.volume.distance).toBeNull();

      const betweenIntervals = prescription.rest?.betweenIntervals;
      expect(betweenIntervals?.type).toBe("fixed");
      if (betweenIntervals?.type === "fixed") {
        expect(betweenIntervals.duration).toEqual({
          value: expected[rangeContext].rest,
          unit: "seconds",
          scope: "between_intervals",
        });
      }
      expect(prescription.rest?.betweenSets).toBeNull();
      expect(prescription.rest?.betweenRounds).toBeNull();
    }
  });

  test("16. the resolved values never leave the fiche's own documented ranges", () => {
    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const prescription = prescribe(rangeContext).prescription;
      const intervals = prescription.volume.workIntervals!;
      const work = prescription.volume.duration!.value;
      const betweenIntervals = prescription.rest!.betweenIntervals!;

      expect(intervals).toBeGreaterThanOrEqual(3);
      expect(intervals).toBeLessThanOrEqual(8);
      expect(work).toBeGreaterThanOrEqual(10);
      expect(work).toBeLessThanOrEqual(30);
      if (betweenIntervals.type === "fixed") {
        expect(betweenIntervals.duration.value).toBeGreaterThanOrEqual(30);
        expect(betweenIntervals.duration.value).toBeLessThanOrEqual(90);
      }
    }
  });
});

// -----------------------------------------------------------------------------
// 17-20. Intensity — one of two documented rules, chosen by narrowing
// -----------------------------------------------------------------------------

describe("heavy_bag_power_intervals — intensity", () => {
  test("17. the entry narrows the profile's two rules to impact_intent, explicitly", () => {
    const constraints = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseIntensityConstraints;

    expect(constraints?.allowedIntensityTypes).toEqual(["impact_intent"]);
    expect(constraints?.rangeConstraints).toEqual([]);
    expect(constraints?.sourceRuleIds).toEqual([SOURCE_CHAPTER, "26_INTENSITY_MODEL_V0_1"]);

    // The profile genuinely offers two — this is a choice, not the only option.
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)!.intensity).toHaveLength(2);
  });

  test("18. the prescribed intensity is maximal_safe_power, and movement_intent never appears", () => {
    const prescription = prescribe().prescription;

    expect(prescription.intensity.primaryMetric.type).toBe("impact_intent");
    expect(prescription.intensity.primaryMetric.target).toEqual({
      type: "category",
      value: "maximal_safe_power",
    });
    expect(prescription.intensity.secondaryMetrics).toEqual([]);
    expect(prescription.intensity.sourceRuleIds).toContain("26_INTENSITY_MODEL_V0_1");
  });

  test("19. the qualitative intent is identical at every range context — only volume and rest move", () => {
    const targets = (["reduced", "normal", "high"] as const).map(
      (rangeContext) => prescribe(rangeContext).prescription.intensity.primaryMetric.target,
    );
    expect(new Set(targets.map((target) => JSON.stringify(target))).size).toBe(1);
  });

  test("20. no measured metric was invented from this fiche's Performance Indicators", () => {
    const prescription = prescribe().prescription;
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    // "Average Power", "Peak Power", "Heart Rate", "Power Drop-Off" and the
    // optional velocity sensor are all INDICATORS. This fiche's own
    // "Velocity-Based Training Compatible: No" forbids reading them as
    // prescribed targets, and none is claimed.
    for (const type of ["heart_rate", "pace", "velocity", "rpe", "absolute_load"] as const) {
      expect(entry.capabilities.supportedIntensityTypes).not.toContain(type);
    }
    expect(prescription.intensity.primaryMetric.reference).toBeNull();
    expect(prescription.intensity.calculation).toBeNull();
    expect(entry.capabilities.requiredAthleteReferenceTypes).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// 21-25. Capabilities, tempo, laterality, equipment
// -----------------------------------------------------------------------------

describe("heavy_bag_power_intervals — capabilities", () => {
  test("21. the declared capability tags are exactly the three the method requires", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    const required = getTrainingMethodContract("work_rest_intervals").requiredExerciseCapabilities;

    expect([...entry.capabilities.capabilityTags].sort()).toEqual([...required].sort());
  });

  test("22. tempo is declared but resolves to null — the method forbids it", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    // Family 12 documents global_intent for this family, so the capability
    // is honest; the method contract is what makes the resolution null.
    expect(entry.capabilities.supportedTempoTypes).toEqual(["global_intent"]);
    expect(entry.preferredTempoType).toBeNull();
    expect(getTrainingMethodContract("work_rest_intervals").tempoPolicy).toBe("forbidden");
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)!.tempo).toBeNull();
    expect(prescribe().prescription.tempo).toBeNull();
  });

  test("23. laterality is bilateral with interval_total — no per-side allocation is invented", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    expect(entry.capabilities.laterality).toBe("bilateral");
    expect(entry.capabilities.volumeInterpretations).toEqual(["interval_total"]);
    expect(HEAVY_BAG_POWER_INTERVALS.unilateral).toBe(false);

    const laterality = prescribe().prescription.volume.laterality;
    expect(laterality?.laterality).toBe("bilateral");
    expect(laterality?.interpretation).toBe("interval_total");
    expect(laterality?.startingSide ?? null).toBeNull();
    expect(laterality?.sideSwitchRuleId ?? null).toBeNull();
  });

  test("24. the loading mode is impact_equipment — Family 12's own value, and the only entry using it", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.capabilities.supportedLoadingModes).toEqual(["impact_equipment"]);

    const others = PILOT_EXERCISE_IDS.filter((id) => id !== EXERCISE_ID).filter((id) =>
      EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.supportedLoadingModes.includes("impact_equipment"),
    );
    expect(others).toEqual([]);
  });

  test("25. DOCUMENTED GAP: gloves and hand wraps are Required by the fiche but cannot be declared here — and eligibility still enforces them", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    // Only the representable item is declared.
    expect(entry.capabilities.requiredEquipmentCapabilities).toEqual(["heavy_bag"]);

    // The knowledge base still gates on the flagged `other` placeholder that
    // stands for "Gloves"/"Hand Wraps" — so the requirement is enforced, just
    // one layer up. Removing `other` from the environment makes the exercise
    // ineligible, which is the proof that this is a REPRESENTATION gap and
    // not a dropped safety requirement.
    const exercise = makeExercise({ ...HEAVY_BAG_POWER_INTERVALS });
    const withProtection = makeValidInput({ environment: validBagEnvironment() });
    const withoutProtection = makeValidInput({
      environment: makeEnvironment({ availableEquipment: [{ type: "heavy_bag" }] }),
    });

    expect(checkExerciseEligibility(exercise, withProtection).eligible).toBe(true);
    expect(checkExerciseEligibility(exercise, withoutProtection).eligible).toBe(false);

    // And it is restated where the athlete will read it, at critical priority.
    const setup = entry.instructionDefinitions.find((instruction) => instruction.category === "setup");
    expect(setup?.priority).toBe("critical");
    expect(setup?.text.toLowerCase()).toContain("hand wraps");
    expect(setup?.text.toLowerCase()).toContain("gloves");
  });

  test("26. neither `other` nor a hand-protection id was invented in the prescription vocabulary", () => {
    expect(isEquipmentCapabilityId("other")).toBe(false);
    expect(isEquipmentCapabilityId("gloves")).toBe(false);
    expect(isEquipmentCapabilityId("hand_wraps")).toBe(false);
    expect(isEquipmentCapabilityId("hand_protection")).toBe(false);
    // "Timer" is a programming tool, not equipment — excluded in both layers.
    expect(isEquipmentCapabilityId("timer")).toBe(false);
  });

  test("27. the exact equipment builds a source; a missing heavy bag refuses it", () => {
    expect(getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT).ok).toBe(true);

    const missing = getExercisePrescriptionSource(EXERCISE_ID, {
      ...VALID_CONTEXT,
      availableEquipmentCapabilities: [],
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.message).toContain("heavy_bag");
    }

    // A different bag-adjacent id does not substitute for it.
    const wrong = getExercisePrescriptionSource(EXERCISE_ID, {
      ...VALID_CONTEXT,
      availableEquipmentCapabilities: ["slam_ball", "wall"],
    });
    expect(wrong.ok).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// 28-31. Stop conditions and instructions
// -----------------------------------------------------------------------------

describe("heavy_bag_power_intervals — stop conditions and instructions", () => {
  test("28. exactly the six categories the method requires, each sourced", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    const required = getTrainingMethodContract("work_rest_intervals").requiredStopConditionCategories;

    const categories = entry.stopConditionDefinitions.map((condition) => condition.category);
    expect([...categories].sort()).toEqual([...required].sort());
    expect(entry.capabilities.requiredStopConditionIds).toHaveLength(6);

    for (const condition of entry.stopConditionDefinitions) {
      expect(condition.sourceRuleIds.length).toBeGreaterThan(0);
      expect(condition.instructions[0]?.text.length).toBeGreaterThan(0);
    }
  });

  test("29. the resolved prescription carries all six, and every declared id exists", () => {
    const prescription = prescribe().prescription;
    expect(prescription.stopConditions).toHaveLength(6);

    const definedIds = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].stopConditionDefinitions.map(
      (condition) => condition.conditionId,
    );
    for (const id of EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].capabilities.requiredStopConditionIds) {
      expect(definedIds).toContain(id);
    }
  });

  test("30. this fiche's own risks are carried in the descriptions, not invented as extra categories", () => {
    const byId = Object.fromEntries(
      EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].stopConditionDefinitions.map((condition) => [
        condition.conditionId,
        (condition.instructions[0]?.text ?? "").toLowerCase(),
      ]),
    );

    expect(byId["heavy_bag_power_intervals_technical_failure"]).toContain("arm punching");
    expect(byId["heavy_bag_power_intervals_technical_failure"]).toContain("guard");
    expect(byId["heavy_bag_power_intervals_pace_loss"]).toContain("power");
    expect(byId["heavy_bag_power_intervals_pain"]).toContain("wrist");
    expect(byId["heavy_bag_power_intervals_acute_symptom"]).toContain("concussion");

    // No factory exists for Family 12's own "impact-limit threshold" and
    // "equipment failure" categories in this entry — a knowingly documented
    // gap, asserted so it cannot be silently closed by accident.
    const categories = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].stopConditionDefinitions.map(
      (condition) => condition.category,
    );
    expect(categories).not.toContain("impact_limit");
    expect(categories).not.toContain("equipment_failure");
  });

  test("31. both instructions are required, sourced to this chapter, and quote its own coaching cues", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.instructionDefinitions).toHaveLength(2);

    for (const instruction of entry.instructionDefinitions) {
      expect(instruction.mandatory).toBe(true);
      expect(instruction.sourceRuleId).toBe(SOURCE_CHAPTER);
    }

    const execution = entry.instructionDefinitions.find((i) => i.category === "execution");
    expect(execution?.text).toContain("Generate force from the floor");
    expect(execution?.text).toContain("maximal intent");
    expect(execution?.text.toLowerCase()).toContain("do not sacrifice technique");
  });
});

// -----------------------------------------------------------------------------
// 32-36. Validation, trace, session and end to end
// -----------------------------------------------------------------------------

describe("heavy_bag_power_intervals — validation, trace and end to end", () => {
  test("32. the registry validator reports nothing but the known unresolved duration profile", () => {
    const issues = validatePilotRegistry();
    expect(issues.filter((issue) => issue.code !== "UNRESOLVED_DURATION_PROFILE")).toEqual([]);
    expect(issues.some((issue) => issue.exerciseId === EXERCISE_ID)).toBe(true);
  });

  test("33. the duration estimation profile is unresolved by convention and refuses to be used", () => {
    const result = getDurationEstimationProfile("duration_profile_heavy_bag_power_intervals");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failureCode).toBe("DURATION_PROFILE_UNRESOLVED");
      expect(result.profile?.sourceRuleIds).toContain(SOURCE_CHAPTER);
    }
  });

  test("34. the decision trace names the profile, the explicit selection and both narrowings", () => {
    const entries = adaptExercisePrescriptionResult(prescribe(), {
      idPrefix: "heavy_bag_test",
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    const volumeEntry = entries.find((entry) => entry.id.endsWith("_volume"));
    expect(volumeEntry?.reasons[0]).toBe(`profile=${PROFILE_ID} (selection=explicit_profile_id)`);
    expect(volumeEntry?.reasons.join(" ")).toContain("laterality=bilateral (interval_total)");

    const volumeTrace = prescribe().trace.volume;
    expect(volumeTrace.ok && volumeTrace.profileResolutionSource).toBe("explicit_profile_id");

    const intensityEntry = entries.find((entry) => entry.id.endsWith("_intensity"));
    expect(intensityEntry?.decision).toContain('Intensity resolved via "impact_intent"');
    // The narrowing is visible: movement_intent was documented and rejected.
    expect(intensityEntry?.reasons.join(" ")).toContain("movement_intent");

    // Rest is traced by its resolved shape rather than by profile id, but the
    // narrowed window is what actually reaches the athlete.
    const restEntry = entries.find((entry) => entry.id.endsWith("_rest"));
    expect(restEntry?.decision).toContain(EXERCISE_ID);
    expect(restEntry?.reasons.join(" ")).toContain("fixed");
    const betweenIntervals = prescribe().prescription.rest?.betweenIntervals;
    expect(betweenIntervals?.type === "fixed" && betweenIntervals.duration.value).toBe(55);
  });

  test("35. it prescribes in a session beside the other two interval entries — three profiles, one triple, no interference", () => {
    const ids = ["heavy_bag_power_intervals", "rowerg_intervals", "sprint_intervals"] as const;
    const exercises: SessionExercisePrescriptionInput[] = ids.map((id) => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      const sourceResult = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: entry.capabilities.requiredEquipmentCapabilities,
      });
      if (!sourceResult.ok) {
        throw new Error(`Fixture setup failed for ${id}: ${sourceResult.message}`);
      }
      return {
        exerciseId: id,
        moduleId: sourceResult.moduleId,
        ...sourceResult.source,
        order: ids.indexOf(id) + 1,
        required: true,
        blockId: "conditioning",
      };
    });

    const result = prescribeSession({
      sessionId: "interval-session",
      sessionName: "Three Interval Profiles, One Triple",
      modules: ["conditioning"],
      exercises,
    });
    if (!result.ok) {
      throw new Error(`Expected the session to prescribe: ${result.issues.map((i) => i.message).join(" | ")}`);
    }

    expect(result.session.status).toBe("complete");
    expect(result.session.exercises).toHaveLength(3);

    const [bag, rowerg, sprint] = result.session.exercises.map((e) => e.prescription);
    expect(bag?.volume.workIntervals).toBe(7);
    expect(bag?.intensity.primaryMetric.type).toBe("impact_intent");
    expect(rowerg?.volume.workIntervals).toBe(6);
    expect(rowerg?.intensity.primaryMetric.type).toBe("rpe");
    expect(sprint?.volume.workIntervals).toBe(15);
    expect(sprint?.intensity.primaryMetric.type).toBe("movement_intent");
  });

  test("36. runEngine prescribes heavy_bag_power_intervals end to end from the real ExerciseDefinition", () => {
    // This fiche documents 5/5/5 fatigue costs and a level-3 technical floor,
    // which the V0.1 scoring model prices directly. A recovered, experienced
    // striker pursuing a conditioning objective is the honest input.
    const input = makeValidInput({
      request: makeRequest({ primaryObjective: { adaptationDomain: "conditioning" } }),
      environment: validBagEnvironment(),
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "elite", primaryCombatSport: "krav_maga" },
        goals: [
          { id: "goal-1", name: "Combat Power", adaptationDomain: "conditioning", priority: "primary" },
        ],
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
    const exercise = makeExercise({
      ...HEAVY_BAG_POWER_INTERVALS,
      setupTimeMinutes: 5,
      defaultExerciseDurationMinutes: 20,
    });

    const sourceResult = getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT);
    if (!sourceResult.ok) {
      throw new Error(`Fixture setup failed: ${sourceResult.message}`);
    }

    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([[EXERCISE_ID, sourceResult.source]]);
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
    expect(prescribed?.intensity.primaryMetric.target).toEqual({
      type: "category",
      value: "maximal_safe_power",
    });
  });
});

// -----------------------------------------------------------------------------
// 37-40. Determinism, non-mutation and non-regression
// -----------------------------------------------------------------------------

describe("heavy_bag_power_intervals — determinism and non-regression", () => {
  test("37. prescribing is deterministic and never mutates the registry entry", () => {
    const before = JSON.stringify(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID]);
    const runs = [prescribe(), prescribe(), prescribe()].map((r) => JSON.stringify(r.prescription));

    expect(new Set(runs).size).toBe(1);
    expect(JSON.stringify(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID])).toBe(before);
  });

  test("38. no regression on the 65 previous entries: each still prescribes with its own declared equipment", () => {
    const REFERENCE = {
      referenceType: "one_rep_max" as const,
      value: 100,
      unit: "kilograms",
      sourceId: "test-1rm",
      measuredAt: null,
      validUntil: null,
      confidence: "validated" as const,
    };

    // The 65 entries that predate this lot: everything except this lot's own
    // entry and the ids added by later lots, each covered by its own file.
    const ADDED_BY_THIS_OR_LATER_LOTS: readonly string[] = [EXERCISE_ID, "battle_ropes"];
    const previousIds = PILOT_EXERCISE_IDS.filter((id) => !ADDED_BY_THIS_OR_LATER_LOTS.includes(id));
    expect(previousIds).toHaveLength(65);

    for (const id of previousIds) {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id as PilotExerciseId];

      // No previous entry adopted the newly implemented profile or the new
      // equipment identifier.
      expect(entry.numericalProfileId ?? null).not.toBe(PROFILE_ID);
      expect(entry.capabilities.requiredEquipmentCapabilities).not.toContain("heavy_bag");

      const sourceResult = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [REFERENCE],
        availableEquipmentCapabilities: entry.capabilities.requiredEquipmentCapabilities,
      });
      if (!sourceResult.ok) {
        throw new Error(`Previous entry "${id}" no longer builds a source: ${sourceResult.message}`);
      }

      const result = prescribeExercise({ exerciseId: id, moduleId: sourceResult.moduleId, ...sourceResult.source });
      if (!result.ok) {
        throw new Error(`Previous entry "${id}" no longer prescribes (${result.failureStage}): ${result.message}`);
      }
      expect(result.prescription.status).toBe("complete");
    }
  });

  test("39. the two other interval entries resolve exactly as before — the fourth profile changed neither", () => {
    const frozen = {
      rowerg_intervals: { profileId: "conditioning_long_intervals_v0_1", intervals: 6, duration: 120, rest: 75 },
      sprint_intervals: { profileId: "repeated_sprint_intervals_v0_1", intervals: 15, duration: 5, rest: 40 },
    } as const;

    for (const [id, expected] of Object.entries(frozen)) {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id as PilotExerciseId];
      expect(entry.numericalProfileId).toBe(expected.profileId);

      const sourceResult = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: entry.capabilities.requiredEquipmentCapabilities,
      });
      if (!sourceResult.ok) throw new Error(`Setup failed for ${id}: ${sourceResult.message}`);

      const result = prescribeExercise({ exerciseId: id, moduleId: sourceResult.moduleId, ...sourceResult.source });
      if (!result.ok) throw new Error(`${id} no longer prescribes: ${result.message}`);

      expect(result.prescription.volume.workIntervals).toBe(expected.intervals);
      expect(result.prescription.volume.duration?.value).toBe(expected.duration);
      const betweenIntervals = result.prescription.rest?.betweenIntervals;
      if (betweenIntervals?.type === "fixed") {
        expect(betweenIntervals.duration.value).toBe(expected.rest);
      }
    }
  });

  test("40. no resolver branches on this exercise id, and every source rule the entry cites is real", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    expect(entry.sourceRuleIds).toEqual([
      SOURCE_CHAPTER,
      "31_TRAINING_METHOD_CATALOGUE_V0_1",
      "32_MODULE_PRESCRIPTION_PROFILES_V0_1",
      "34_NUMERICAL_PRESCRIPTION_TABLES_V0_1",
    ]);
    expect(entry.capabilities.sourceRuleIds).toEqual([
      SOURCE_CHAPTER,
      "33_EXERCISE_PRESCRIPTION_CAPABILITIES_V0_1",
    ]);

    // Exactly one profile and one equipment id were added by this whole lot.
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(18);
    expect(EQUIPMENT_CAPABILITY_IDS).toHaveLength(28);
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)!.sourceRuleIds).toEqual([
      "34_NUMERICAL_PRESCRIPTION_TABLES_V0_1",
    ]);
  });
});
