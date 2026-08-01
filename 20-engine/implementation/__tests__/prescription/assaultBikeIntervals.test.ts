/**
 * Combat Athlete System — Registry Lot 13: assault_bike_intervals
 *
 * Third consumer of Table Group 14's INT-POWER profile, and the FIRST that
 * was not one of the two records the table group was written from. That is
 * the point of a generic profile: this fiche satisfies the table's own
 * documented scope sentence independently, so the doctrine is applied, not
 * widened.
 *
 * This exercise was honestly blocked by an earlier audit, and this file
 * proves the block is dissolved rather than bypassed:
 *
 * - the historical cause was that INT-SHORT was the only overlapping
 *   profile and documents no encodable intensity. INT-SHORT is untouched
 *   and still non-executable; a fourth, executable profile simply appeared
 *   on the same triple;
 * - the intensity that unblocks it is a literal word of this fiche's own
 *   Movement Context, not an invented watt, heart rate or RPE. Every
 *   measured quantity this chapter names stays a Performance Indicator;
 * - the equipment gap was pure vocabulary asymmetry: the knowledge base
 *   already gated on `cardio_machine`, which the prescription layer could
 *   not express. The ExerciseDefinition is NOT modified.
 */

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import { ASSAULT_BIKE_INTERVALS, EXERCISE_KNOWLEDGE_BASE } from "../../exerciseKnowledgeBase";
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

const EXERCISE_ID = "assault_bike_intervals";
const PROFILE_ID = "power_intervals_v0_1";
const SOURCE_CHAPTER = "50-exercises/48_ASSAULT_BIKE_INTERVALS";

/** "# Equipment Requirements — Required: Assault Bike, or Echo Bike." */
const VALID_CONTEXT: PrescriptionExecutionContext = {
  rangeContext: "normal",
  athleteReferences: [],
  availableEquipmentCapabilities: ["cardio_machine"],
};

const validBikeEnvironment = () =>
  makeEnvironment({ availableEquipment: [{ type: "cardio_machine" }] });

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

describe("assault_bike_intervals — registry, knowledge base, profile and equipment counts", () => {
  test("1. the registry grew from 67 to exactly 68 entries", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(68);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(68);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort()).toEqual([...PILOT_EXERCISE_IDS].sort());
  });

  test("2. the knowledge base still holds exactly 76 ExerciseDefinitions — none added, none removed", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toHaveLength(76);
    expect(new Set(EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id)).size).toBe(76);
  });

  test("3. the numerical profiles stay at 18 — this lot created none", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(18);
    expect(NUMERICAL_PRESCRIPTION_PROFILES.filter((p) => p.profileId === PROFILE_ID)).toHaveLength(1);
  });

  test("4. the equipment vocabulary went from 28 to 29 — cardio_machine, the only identifier this lot added", () => {
    expect(EQUIPMENT_CAPABILITY_IDS).toHaveLength(29);
    expect(isEquipmentCapabilityId("cardio_machine")).toBe(true);
    // No air-bike-specific id was invented: the knowledge base's own atom is
    // the generic one, and "Assault Bike, or Echo Bike" names two brands of
    // one apparatus.
    expect(isEquipmentCapabilityId("air_bike")).toBe(false);
    expect(isEquipmentCapabilityId("assault_bike")).toBe(false);
    expect(isEquipmentCapabilityId("echo_bike")).toBe(false);
  });

  test("5. assault_bike_intervals exists in both layers, with consistent identifiers", () => {
    const kbEntry = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === EXERCISE_ID);
    expect(kbEntry).toBeDefined();
    expect(kbEntry?.module).toBe("conditioning");
    expect(kbEntry?.primaryAdaptation).toBe("conditioning");
    expect(kbEntry?.unilateral).toBe(false);

    expect(entry().exerciseId).toBe(EXERCISE_ID);
    expect(entry().capabilities.exerciseId).toBe(EXERCISE_ID);
    expect(PILOT_EXERCISE_IDS.filter((id) => id === EXERCISE_ID)).toHaveLength(1);
  });

  test("6. no other exercise was added: the still-blocked exercises stay out", () => {
    for (const id of ["sled_push", "turkish_get_up", "towel_pull_up", "rope_climb", "rope_pull", "pummeling", "wall_wrestling", "grip_fighting"]) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY as Record<string, unknown>).not.toHaveProperty(id);
    }
    // Every conditioning modality in the library is now integrated.
    for (const id of ["rowerg_intervals", "sprint_intervals", "heavy_bag_power_intervals", "battle_ropes", EXERCISE_ID]) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY).toHaveProperty(id);
    }
  });
});

// -----------------------------------------------------------------------------
// 7-10. Equipment — exact matching, both layers
// -----------------------------------------------------------------------------

describe("assault_bike_intervals — equipment and eligibility", () => {
  test("7. cardio_machine is recognised, and it is the atom the knowledge base ALREADY gated on", () => {
    expect(entry().capabilities.requiredEquipmentCapabilities).toEqual(["cardio_machine"]);

    // The ExerciseDefinition was not modified: its own atom is unchanged.
    const kbEquipment = ASSAULT_BIKE_INTERVALS.requirements!.required
      .flatMap((clause) => clause.items)
      .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
      .map((atom) => atom.equipment);
    expect(kbEquipment).toEqual(["cardio_machine"]);

    expect(getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT).ok).toBe(true);
    expect(
      checkExerciseEligibility(
        makeExercise({ ...ASSAULT_BIKE_INTERVALS }),
        makeValidInput({ environment: validBikeEnvironment() }),
      ).eligible,
    ).toBe(true);
  });

  test("8. missing equipment is rejected in both layers", () => {
    const source = getExercisePrescriptionSource(EXERCISE_ID, {
      ...VALID_CONTEXT,
      availableEquipmentCapabilities: [],
    });
    expect(source.ok).toBe(false);
    if (!source.ok) {
      expect(source.message).toContain("cardio_machine");
    }

    const eligibility = checkExerciseEligibility(
      makeExercise({ ...ASSAULT_BIKE_INTERVALS }),
      makeValidInput({ environment: makeEnvironment({ availableEquipment: [] }) }),
    );
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("9. a rowing ergometer alone is rejected — the two identifiers are disjoint, in both directions", () => {
    const source = getExercisePrescriptionSource(EXERCISE_ID, {
      ...VALID_CONTEXT,
      availableEquipmentCapabilities: ["rowing_ergometer"],
    });
    expect(source.ok).toBe(false);

    // And the reverse: rowerg_intervals is not satisfied by a cardio machine.
    const rowerg = getExercisePrescriptionSource("rowerg_intervals", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["cardio_machine"],
    });
    expect(rowerg.ok).toBe(false);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.rowerg_intervals.capabilities.requiredEquipmentCapabilities).toEqual([
      "rowing_ergometer",
    ]);
  });

  test("10. every adjacent implement is rejected — no equivalence was created", () => {
    for (const available of [
      ["battle_rope"],
      ["heavy_bag"],
      ["rope_anchor_point"],
      ["plyometric_box", "mat"],
      ["dumbbell", "kettlebell"],
      ["rowing_ergometer", "battle_rope", "heavy_bag"],
    ]) {
      const source = getExercisePrescriptionSource(EXERCISE_ID, {
        ...VALID_CONTEXT,
        availableEquipmentCapabilities: available,
      });
      expect(source.ok, available.join("+")).toBe(false);
    }

    // No environment gate is invented: this fiche documents none.
    const bareEnvironment = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "cardio_machine" }],
        availableSpace: "very_limited",
        floorSafe: false,
        sprintingAllowed: false,
        jumpingAllowed: false,
        usableWall: false,
        partnerAvailable: false,
      }),
    });
    expect(checkExerciseEligibility(makeExercise({ ...ASSAULT_BIKE_INTERVALS }), bareEnvironment).eligible).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// 11-12. Profile selection
// -----------------------------------------------------------------------------

describe("assault_bike_intervals — numerical profile selection", () => {
  test("11. the entry declares power_intervals_v0_1 and creates no profile of its own", () => {
    expect(entry().numericalProfileId).toBe(PROFILE_ID);
    expect(entry().moduleId).toBe("conditioning");
    expect(entry().explicitMethodId).toBe("work_rest_intervals");
    expect(entry().role).toBe("conditioning");
  });

  test("12. explicit selection is mandatory — the shared triple refuses implicit resolution", () => {
    const implicit = resolveNumericalProfile({
      moduleId: entry().moduleId,
      methodId: entry().explicitMethodId,
      exerciseRole: entry().role,
    });
    expect(implicit.ok).toBe(false);
    if (!implicit.ok) {
      expect(implicit.failureCode).toBe("NUMERICAL_PROFILE_AMBIGUOUS");
      expect(implicit.candidateProfileIds).toHaveLength(4);
      expect(implicit.candidateProfileIds).toContain(PROFILE_ID);
    }

    const explicit = resolveNumericalProfile({
      moduleId: entry().moduleId,
      methodId: entry().explicitMethodId,
      exerciseRole: entry().role,
      explicitProfileId: entry().numericalProfileId,
    });
    expect(explicit.ok && explicit.profile.profileId).toBe(PROFILE_ID);
    expect(explicit.ok && explicit.resolutionSource).toBe("explicit_profile_id");
  });

  test("12b. THE HISTORICAL BLOCK IS DISSOLVED, NOT BYPASSED: INT-SHORT is untouched and still cannot prescribe", () => {
    // The original audit's cause: INT-SHORT was the only interval profile
    // whose ranges overlapped this fiche, and it documents no intensity.
    const short = getNumericalPrescriptionProfileById("conditioning_short_intervals_v0_1")!;
    expect(short.intensity).toHaveLength(0);
    expect(isExecutableNumericalProfile(short)).toBe(false);

    // Its ranges DO still overlap this fiche (10-20 intervals vs 6-15,
    // 15-60 s vs 10-60 s) — the overlap was never the problem, executability
    // was. Nothing about INT-SHORT changed; a fourth profile appeared.
    expect([short.volume.workIntervals!.min, short.volume.workIntervals!.max]).toEqual([10, 20]);
    expect(entry().numericalProfileId).not.toBe("conditioning_short_intervals_v0_1");
    expect(isExecutableNumericalProfile(getNumericalPrescriptionProfileById(PROFILE_ID)!)).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// 13-19. Volume, narrowing, rest
// -----------------------------------------------------------------------------

describe("assault_bike_intervals — volume, narrowing and rest", () => {
  const EXPECTED = {
    reduced: { intervals: 6, work: 10, rest: 20 },
    normal: { intervals: 7, work: 25, rest: 55 },
    high: { intervals: 12, work: 40, rest: 90 },
  } as const;

  test("13. reduced resolves 6 intervals x 10s with 20s recovery — the narrowed floor, not the profile's 3", () => {
    const prescription = prescribe("reduced").prescription;
    expect(prescription.volume.workIntervals).toBe(EXPECTED.reduced.intervals);
    expect(prescription.volume.duration?.value).toBe(EXPECTED.reduced.work);
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)!.volume.workIntervals!.min).toBe(3);
  });

  test("14. normal resolves 7 intervals x 25s with 55s recovery", () => {
    const prescription = prescribe("normal").prescription;
    expect(prescription.volume.workIntervals).toBe(EXPECTED.normal.intervals);
    expect(prescription.volume.duration?.value).toBe(EXPECTED.normal.work);
  });

  test("15. high resolves 12 intervals x 40s with 90s recovery — the shared ceiling, below this fiche's own 15 x 60s", () => {
    const prescription = prescribe("high").prescription;
    expect(prescription.volume.workIntervals).toBe(EXPECTED.high.intervals);
    expect(prescription.volume.duration?.value).toBe(EXPECTED.high.work);
    // DOCUMENTED PRECISION LOSS, in the safe direction: 13-15 intervals and
    // 41-60 s of work are documented but unreachable, because a constraint
    // narrows and never widens a shared envelope.
    expect(entry().exerciseDoseConstraints?.maximumDose?.workIntervals).toBe(15);
    expect(prescription.volume.workIntervals!).toBeLessThan(15);
  });

  test("16. the volume structure is intervals, and every forbidden dimension stays null", () => {
    expect(entry().capabilities.supportedVolumeStructures).toEqual(["intervals"]);
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

  test("17. the entry declares the fiche's own 6-15 intervals; the RESOLVER computes the 6-12 intersection", () => {
    const constraints = entry().exerciseDoseConstraints;
    expect(constraints?.minimumDose?.workIntervals).toBe(6);
    expect(constraints?.maximumDose?.workIntervals).toBe(15);
    expect(constraints?.sourceRuleIds).toEqual([SOURCE_CHAPTER]);

    // Nothing was pre-computed in the entry: the narrowing note proves the
    // generic resolver did the intersection.
    const volumeTrace = prescribe().trace.volume;
    expect(volumeTrace.ok && volumeTrace.narrowingNotes.join(" ")).toContain(
      "workIntervals range 3-12 narrowed to 6-12",
    );
  });

  test("18. the entry declares the fiche's own 10-60s of work; resolution stays inside 10-40s", () => {
    const constraints = entry().exerciseDoseConstraints;
    expect(constraints?.minimumDose?.durationSeconds).toBe(10);
    expect(constraints?.maximumDose?.durationSeconds).toBe(60);

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const work = prescribe(rangeContext).prescription.volume.duration!.value;
      expect(work).toBeGreaterThanOrEqual(10);
      expect(work).toBeLessThanOrEqual(40);
    }
  });

  test("19. rest is declared as the fiche's own 20-180s and resolves inside the profile's 20-90s window", () => {
    expect(entry().exerciseRestConstraints).toEqual({
      scope: "between_intervals",
      minimumSeconds: 20,
      maximumSeconds: 180,
      sourceRuleIds: [SOURCE_CHAPTER],
    });

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
});

// -----------------------------------------------------------------------------
// 20-23. Intensity and tempo
// -----------------------------------------------------------------------------

describe("assault_bike_intervals — intensity and tempo", () => {
  test("20. the prescribed intensity is movement_intent: explosive — a literal word of this fiche's Movement Context", () => {
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

  test("21. impact_intent is excluded BY the narrowing — it is the profile's first rule and would otherwise win", () => {
    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.intensity).toHaveLength(2);
    expect(profile.intensity[0]?.type).toBe("impact_intent");

    expect(entry().exerciseIntensityConstraints?.allowedIntensityTypes).toEqual(["movement_intent"]);
    expect(entry().exerciseIntensityConstraints?.rangeConstraints).toEqual([]);
    expect(entry().exerciseIntensityConstraints?.sourceRuleIds).toEqual([
      SOURCE_CHAPTER,
      "26_INTENSITY_MODEL_V0_1",
    ]);

    expect(entry().capabilities.supportedIntensityTypes).not.toContain("impact_intent");
    const trace = prescribe().trace.intensity;
    expect(trace.ok && trace.rejectedRuleTypes).toContain("impact_intent");
  });

  test("22. no RPE, and no measured target of any kind — this is exactly what the historical block was about", () => {
    // The chapter names Peak Power, Average Power, Calories, Distance, Heart
    // Rate Recovery, Power Drop-Off and Work Consistency as Performance
    // INDICATORS, and Power Output / Calories per Interval as PROGRESSION
    // AXES. None carries a normative figure, so none becomes a target.
    for (const type of [
      "rpe",
      "heart_rate",
      "pace",
      "velocity",
      "absolute_load",
      "percentage_1rm",
      "percentage_body_mass",
      "resistance_category",
      "technical_effort",
    ] as const) {
      expect(entry().capabilities.supportedIntensityTypes).not.toContain(type);
    }
    const prescription = prescribe().prescription;
    expect(prescription.intensity.primaryMetric.reference).toBeNull();
    expect(prescription.intensity.calculation).toBeNull();
    expect(entry().capabilities.requiredAthleteReferenceTypes).toEqual([]);
  });

  test("23. tempo is absent everywhere — the method forbids it and this fiche documents none", () => {
    expect(getTrainingMethodContract("work_rest_intervals").tempoPolicy).toBe("forbidden");
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)!.tempo).toBeNull();
    expect(entry().capabilities.supportedTempoTypes).toEqual([]);
    expect(entry().supportedTempoTypes).toEqual([]);
    expect(entry().preferredTempoType).toBeNull();

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      expect(prescribe(rangeContext).prescription.tempo).toBeNull();
    }
  });
});

// -----------------------------------------------------------------------------
// 24-27. Loading mode, laterality, volume interpretation
// -----------------------------------------------------------------------------

describe("assault_bike_intervals — loading mode and laterality", () => {
  test("24. the loading modes are ergometer + machine, identical to rowerg_intervals and to Family 11", () => {
    expect(entry().capabilities.supportedLoadingModes).toEqual(["ergometer", "machine"]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.rowerg_intervals.capabilities.supportedLoadingModes).toEqual([
      "ergometer",
      "machine",
    ]);
    for (const wrong of ["bodyweight", "locomotion_only", "rope", "plate", "impact_equipment"] as const) {
      expect(entry().capabilities.supportedLoadingModes).not.toContain(wrong);
    }
  });

  test("25. laterality is not_applicable — a whole-body cyclic machine effort with no per-side allocation", () => {
    expect(entry().capabilities.laterality).toBe("not_applicable");
    expect(ASSAULT_BIKE_INTERVALS.unilateral).toBe(false);

    const laterality = prescribe().prescription.volume.laterality;
    expect(laterality?.laterality).toBe("not_applicable");
    expect(laterality?.startingSide ?? null).toBeNull();
    expect(laterality?.sideSwitchRuleId ?? null).toBeNull();
  });

  test("26. the volume interpretation is interval_total", () => {
    expect(entry().capabilities.volumeInterpretations).toEqual(["interval_total"]);
    expect(prescribe().prescription.volume.laterality?.interpretation).toBe("interval_total");
  });

  test("27. no count is multiplied for two arms or two legs — every value is exactly the intersected range", () => {
    // The intersection of the fiche's 6-15 with the profile's 3-12 is
    // [6, 12], normal 7. The resolved values are exactly its bounds and its
    // normal — nothing is scaled by the machine's two limbs or two handles.
    const expected = { reduced: 6, normal: 7, high: 12 } as const;
    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const volume = prescribe(rangeContext).prescription.volume;
      expect(volume.workIntervals, rangeContext).toBe(expected[rangeContext]);
      expect(volume.reps).toBeNull();
    }

    // The profile's own normal is carried through untouched, which is what a
    // doubling would have destroyed.
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)!.volume.workIntervals!.normal).toBe(
      expected.normal,
    );
    expect(entry().capabilities.volumeInterpretations).toEqual(["interval_total"]);
    expect(entry().capabilities.volumeInterpretations).not.toContain("repetitions_per_side");
  });
});

// -----------------------------------------------------------------------------
// 28-29. Instructions and stop conditions
// -----------------------------------------------------------------------------

describe("assault_bike_intervals — instructions and stop conditions", () => {
  test("28. setup and execution both exist, are mandatory, sourced, and quote this fiche's own cues and errors", () => {
    const instructions = entry().instructionDefinitions;
    expect(instructions).toHaveLength(2);
    expect(entry().capabilities.requiredInstructionIds).toEqual([
      "assault_bike_intervals_setup",
      "assault_bike_intervals_execution",
    ]);

    for (const instruction of instructions) {
      expect(instruction.mandatory).toBe(true);
      expect(instruction.sourceRuleId).toBe(SOURCE_CHAPTER);
    }

    const setup = instructions.find((i) => i.category === "setup");
    expect(setup?.text.toLowerCase()).toContain("echo bike");
    expect(setup?.text.toLowerCase()).toContain("warm up");
    expect(setup?.text.toLowerCase()).toContain("optional");
    // Nothing invented: this chapter documents no seat, foot, hand or space
    // setup, so none is described.
    for (const invented of ["seat", "clear zone", "foot position", "resistance level"]) {
      expect(setup?.text.toLowerCase()).not.toContain(invented);
    }

    const execution = instructions.find((i) => i.category === "execution");
    expect(execution?.text).toContain("Push and pull aggressively");
    expect(execution?.text).toContain("driving through the legs");
    expect(execution?.text).toContain("maintain posture");
    expect(execution?.text.toLowerCase()).toContain("finish every interval with intent");
    expect(execution?.text.toLowerCase()).toContain("start too fast");
    expect(execution?.text.toLowerCase()).toContain("arms alone");
    expect(execution?.text.toLowerCase()).toContain("control breathing");
  });

  test("29. exactly the six categories the method requires, each sourced, with the undocumented ones knowingly absent", () => {
    const required = getTrainingMethodContract("work_rest_intervals").requiredStopConditionCategories;
    const categories = entry().stopConditionDefinitions.map((condition) => condition.category);

    expect([...categories].sort()).toEqual([...required].sort());
    expect(entry().capabilities.requiredStopConditionIds).toHaveLength(6);

    for (const condition of entry().stopConditionDefinitions) {
      expect(condition.sourceRuleIds.length).toBeGreaterThan(0);
      expect(condition.instructions[0]?.text.length).toBeGreaterThan(0);
    }

    const byId = Object.fromEntries(
      entry().stopConditionDefinitions.map((c) => [c.conditionId, (c.instructions[0]?.text ?? "").toLowerCase()]),
    );
    expect(byId["assault_bike_intervals_pace_loss"]).toContain("cadence");
    expect(byId["assault_bike_intervals_pace_loss"]).toContain("pacing");
    expect(byId["assault_bike_intervals_technical_failure"]).toContain("arms alone");
    expect(byId["assault_bike_intervals_fatigue_limit"]).toContain("grip fatigue");
    expect(byId["assault_bike_intervals_acute_symptom"]).toContain("cardiovascular");
    expect(byId["assault_bike_intervals_pain"]).toContain("knee");

    // No percentage threshold was invented for the qualitative pace loss.
    for (const text of Object.values(byId)) {
      expect(text).not.toMatch(/\d+\s*%/);
    }

    // Family 11 names "equipment failure"; no contract requires it and its
    // factory is set-scoped, so it stays absent — the same documented gap
    // already recorded for rowerg_intervals.
    expect(categories).not.toContain("equipment_failure");

    expect(prescribe().prescription.stopConditions).toHaveLength(6);
  });
});

// -----------------------------------------------------------------------------
// 30-33. Exercise, session, engine and trace
// -----------------------------------------------------------------------------

describe("assault_bike_intervals — prescription, session, engine and trace", () => {
  test("30. the exercise prescribes completely at every range context", () => {
    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const prescription = prescribe(rangeContext).prescription;
      expect(prescription.status).toBe("complete");
      expect(prescription.exerciseId).toBe(EXERCISE_ID);
      expect(prescription.methodId).toBe("work_rest_intervals");
    }
  });

  test("31. all five conditioning modalities prescribe side by side in one session", () => {
    const ids = [
      "assault_bike_intervals",
      "battle_ropes",
      "heavy_bag_power_intervals",
      "rowerg_intervals",
      "sprint_intervals",
    ] as const;
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
      sessionId: "conditioning-session",
      sessionName: "Every Conditioning Modality",
      modules: ["conditioning"],
      exercises,
    });
    if (!result.ok) {
      throw new Error(`Expected the session to prescribe: ${result.issues.map((i) => i.message).join(" | ")}`);
    }

    expect(result.session.status).toBe("complete");
    expect(result.session.exercises).toHaveLength(5);

    const [bike, ropes, bag, rowerg, sprint] = result.session.exercises.map((e) => e.prescription);
    // Three entries share INT-POWER and resolve to three different interval
    // counts — their own narrowing separates them, never the profile.
    expect(bike?.volume.workIntervals).toBe(7);
    expect(ropes?.volume.workIntervals).toBe(7);
    expect(bag?.volume.workIntervals).toBe(7);
    expect(bike?.intensity.primaryMetric.type).toBe("movement_intent");
    expect(bag?.intensity.primaryMetric.type).toBe("impact_intent");
    expect(rowerg?.intensity.primaryMetric.type).toBe("rpe");
    expect(sprint?.volume.workIntervals).toBe(15);
  });

  test("32. runEngine prescribes assault_bike_intervals end to end for a DEFAULT athlete", () => {
    // "# Neurological Profile — Motor Complexity: 2/5. Skill Requirement:
    // Beginner. Learning Curve: Very Short", "# Safety Profile — Overall
    // Risk: Very Low", "Suitable For: Beginners, Intermediate, Advanced,
    // Elite". The default fixture athlete is the honest input, unlike
    // sprint_intervals and heavy_bag_power_intervals.
    const input = makeValidInput({
      request: makeRequest({ primaryObjective: { adaptationDomain: "conditioning" } }),
      environment: validBikeEnvironment(),
    });
    const exercise = makeExercise({
      ...ASSAULT_BIKE_INTERVALS,
      setupTimeMinutes: 5,
      defaultExerciseDurationMinutes: 20,
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

  test("33. the decision trace names the profile, reports explicit selection and shows the narrowing", () => {
    const entries = adaptExercisePrescriptionResult(prescribe(), {
      idPrefix: "assault_bike_test",
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    const volumeEntry = entries.find((e) => e.id.endsWith("_volume"));
    expect(volumeEntry?.reasons[0]).toBe(`profile=${PROFILE_ID} (selection=explicit_profile_id)`);
    expect(volumeEntry?.reasons.join(" ")).toContain("narrowed to 6-12");
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
// 34-43. Determinism, validation, non-regression, doctrine integrity
// -----------------------------------------------------------------------------

describe("assault_bike_intervals — determinism, validation and doctrine integrity", () => {
  test("34. prescribing is deterministic across repeated calls", () => {
    const runs = [prescribe(), prescribe(), prescribe()].map((r) => JSON.stringify(r.prescription));
    expect(new Set(runs).size).toBe(1);
  });

  test("35. prescribing never mutates the registry entry or the shared profile", () => {
    const entryBefore = JSON.stringify(entry());
    const profileBefore = JSON.stringify(getNumericalPrescriptionProfileById(PROFILE_ID));

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      prescribe(rangeContext);
    }

    expect(JSON.stringify(entry())).toBe(entryBefore);
    expect(JSON.stringify(getNumericalPrescriptionProfileById(PROFILE_ID))).toBe(profileBefore);
  });

  test("36. validatePilotRegistry reports nothing but the known unresolved duration profiles", () => {
    const issues = validatePilotRegistry();
    expect(issues.filter((issue) => issue.code !== "UNRESOLVED_DURATION_PROFILE")).toEqual([]);
    expect(issues.some((issue) => issue.exerciseId === EXERCISE_ID)).toBe(true);
  });

  test("37. no regression on the 67 previous entries: each still prescribes with its own declared equipment", () => {
    const REFERENCE = {
      referenceType: "one_rep_max" as const,
      value: 100,
      unit: "kilograms",
      sourceId: "test-1rm",
      measuredAt: null,
      validUntil: null,
      confidence: "validated" as const,
    };

    const previousIds = PILOT_EXERCISE_IDS.filter((id) => id !== EXERCISE_ID);
    expect(previousIds).toHaveLength(67);

    for (const id of previousIds) {
      const registryEntry = EXERCISE_PRESCRIPTION_REGISTRY[id as PilotExerciseId];

      // No previous entry adopted the newly added equipment identifier.
      expect(registryEntry.capabilities.requiredEquipmentCapabilities).not.toContain("cardio_machine");

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

  test("37b. the two other INT-POWER consumers resolve exactly as before", () => {
    const frozen = {
      heavy_bag_power_intervals: { intervals: 8, duration: 30, intensity: "impact_intent" },
      battle_ropes: { intervals: 12, duration: 40, intensity: "movement_intent" },
    } as const;

    for (const [id, expected] of Object.entries(frozen)) {
      const registryEntry = EXERCISE_PRESCRIPTION_REGISTRY[id as PilotExerciseId];
      expect(registryEntry.numericalProfileId).toBe(PROFILE_ID);

      const sourceResult = getExercisePrescriptionSource(id, {
        rangeContext: "high",
        athleteReferences: [],
        availableEquipmentCapabilities: registryEntry.capabilities.requiredEquipmentCapabilities,
      });
      if (!sourceResult.ok) throw new Error(sourceResult.message);
      const result = prescribeExercise({
        exerciseId: id,
        moduleId: sourceResult.moduleId,
        ...sourceResult.source,
      });
      if (!result.ok) throw new Error(result.message);

      expect(result.prescription.volume.workIntervals).toBe(expected.intervals);
      expect(result.prescription.volume.duration?.value).toBe(expected.duration);
      expect(result.prescription.intensity.primaryMetric.type).toBe(expected.intensity);
    }
  });

  test("38. the duration estimation profile is unresolved by convention and refuses to be used", () => {
    expect(entry().capabilities.durationEstimationProfileId).toBe("duration_profile_assault_bike_intervals");

    const result = getDurationEstimationProfile("duration_profile_assault_bike_intervals");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failureCode).toBe("DURATION_PROFILE_UNRESOLVED");
      expect(result.profile?.sourceRuleIds).toContain(SOURCE_CHAPTER);
    }
  });

  test("39. no resolver branches on this exercise id or on its equipment identifier", () => {
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
      expect(source, resolver).not.toContain("cardio_machine");
    }
  });

  test("40. every source rule the entry cites is real", () => {
    expect(entry().sourceRuleIds).toEqual([
      SOURCE_CHAPTER,
      "31_TRAINING_METHOD_CATALOGUE_V0_1",
      "32_MODULE_PRESCRIPTION_PROFILES_V0_1",
      "34_NUMERICAL_PRESCRIPTION_TABLES_V0_1",
    ]);
    expect(entry().capabilities.sourceRuleIds).toEqual([
      SOURCE_CHAPTER,
      "33_EXERCISE_PRESCRIPTION_CAPABILITIES_V0_1",
    ]);
    expect(entry().exerciseDoseConstraints?.sourceRuleIds).toEqual([SOURCE_CHAPTER]);
    expect(entry().exerciseRestConstraints?.sourceRuleIds).toEqual([SOURCE_CHAPTER]);
    expect(entry().capabilities.capabilityTags).toEqual([
      ...getTrainingMethodContract("work_rest_intervals").requiredExerciseCapabilities,
    ]);
  });

  test("41. this lot created no numerical profile", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(18);
    expect(NUMERICAL_PRESCRIPTION_PROFILES.filter((p) => p.profileId === PROFILE_ID)).toHaveLength(1);
  });

  test("42. the Power Intervals doctrine is byte-for-byte unchanged", () => {
    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.volume.workIntervals).toEqual({ min: 3, normal: 7, max: 12 });
    expect(profile.volume.duration!.range).toEqual({ min: 10, normal: 25, max: 40, unit: "seconds" });
    expect(profile.rest!.seconds!).toEqual({ min: 20, normal: 55, max: 90 });
    expect(profile.intensity.map((rule) => rule.type)).toEqual(["impact_intent", "movement_intent"]);
    expect(profile.tempo).toBeNull();
    expect(profile.minimumDose).toMatchObject({ workIntervals: 3, durationSeconds: 10 });
    expect(profile.maximumDose).toMatchObject({ workIntervals: 12, durationSeconds: 40 });
    expect(profile.sourceRuleIds).toEqual(["34_NUMERICAL_PRESCRIPTION_TABLES_V0_1"]);
    expect(profile.requiresExerciseSpecificLoadRule).toBe(false);
    expect(profile.requiresSportSpecificSubtype).toBe(false);

    // And this fiche satisfies that table's own documented scope sentence
    // independently — Combat-Specific Conditioning, ATP-PC + anaerobic
    // glycolysis, a Velocity Profile containing "Maximum Intent" — which is
    // why it could join without the doctrine moving.
    const table = readFileSync(
      new URL("../../../34_NUMERICAL_PRESCRIPTION_TABLES.md", import.meta.url),
      "utf-8",
    );
    expect(table).toContain("# Table Group 14 — Power Intervals");
    expect(table).toContain('a Velocity Profile containing "Maximum Intent"');
  });

  test("43. no monitoring indicator became a prescription anywhere in the entry", () => {
    const serialised = JSON.stringify(entry()).toLowerCase();

    // The optional instrumentation is never a required capability or target.
    expect(entry().capabilities.requiredEquipmentCapabilities).not.toContain("heart_rate_monitor");
    expect(entry().capabilities.requiredEquipmentCapabilities).not.toContain("power_meter");
    expect(entry().capabilities.requiredAthleteReferenceTypes).toEqual([]);

    // No watt, calorie or bpm figure was encoded as a numeric rule.
    for (const field of ["sets", "repetitions", "distanceMeters", "rounds"] as const) {
      expect(entry().exerciseDoseConstraints!.minimumDose![field]).toBeNull();
      expect(entry().exerciseDoseConstraints!.maximumDose![field]).toBeNull();
    }
    expect(entry().exerciseIntensityConstraints!.rangeConstraints).toEqual([]);

    // The words may appear in prose, but only as indicators — never as a
    // numeric target, which the assertions above already exclude.
    expect(serialised).not.toContain("watt");
    expect(serialised).not.toContain("calorie");
  });
});
