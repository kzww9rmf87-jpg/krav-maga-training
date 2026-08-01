/**
 * Combat Athlete System — Registry Lot 5: rowerg_intervals
 *
 * The first registry entry on the `conditioning` module, the
 * `work_rest_intervals` method and the `intervals` volume structure — and
 * therefore the first to need EXPLICIT numerical profile selection, since
 * its (conditioning, work_rest_intervals, conditioning) triple is shared by
 * all three Table Group 8 profiles and never resolves implicitly.
 *
 * What this file guards, beyond "the entry exists":
 *
 * - the equipment narrowing: `rowing_ergometer` was added to both the
 *   knowledge base's `EquipmentType` and the prescription layer's canonical
 *   capability vocabulary, and matching is EXACT — a generic
 *   `cardio_machine` (still used by assault_bike_intervals) and an air bike
 *   both fail to satisfy it, in both layers;
 * - the profile selection: `conditioning_long_intervals_v0_1`, never one of
 *   the other two interval profiles, and never by array order;
 * - the honest volume: the fiche's own "5-12 intervals" intersected with
 *   the profile's own [4, 10]; no duration/repetition/distance conversion
 *   anywhere, and the documented distance variations (250/500/1000 m
 *   repeats) deliberately NOT represented — the selected profile encodes no
 *   distance rule, and none is invented.
 */

import { describe, expect, test } from "vitest";

import { EXERCISE_KNOWLEDGE_BASE, ROWERG_INTERVALS, ASSAULT_BIKE_INTERVALS } from "../../exerciseKnowledgeBase";
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
import {
  EQUIPMENT_CAPABILITY_IDS,
  findUnknownEquipmentCapabilities,
  isEquipmentCapabilityId,
} from "../../prescription/equipmentCapabilities";
import { getTrainingMethodContract } from "../../prescription/contracts";
import { adaptExercisePrescriptionResult } from "../../prescription/prescriptionDecisionTrace";
import type { ExercisePrescriptionSource } from "../../prescription/buildPrescriptionInput";

import { runEngine } from "../../index";
import { makeEnvironment, makeExercise, makeRequest, makeValidInput } from "../fixtures";

const EXERCISE_ID = "rowerg_intervals";
const PROFILE_ID = "conditioning_long_intervals_v0_1";
const SOURCE_CHAPTER = "50-exercises/49_ROWERG_INTERVALS";

const VALID_CONTEXT: PrescriptionExecutionContext = {
  rangeContext: "normal",
  athleteReferences: [],
  availableEquipmentCapabilities: ["rowing_ergometer"],
};

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
// 1-5. Counts, presence and additivity
// -----------------------------------------------------------------------------

describe("rowerg_intervals — registry, knowledge base and profile counts", () => {
  test("1. rowerg_intervals took the registry from 59 to 60 entries; later lots only ever add to that", () => {
    // 59 historical + rowerg_intervals (this lot) + sprint_intervals
    // (Registry Lot 6). The two lists below are what this test actually
    // guards; the total is derived from them, never the other way round.
    expect(PILOT_EXERCISE_IDS).toHaveLength(65);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(65);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort()).toEqual([...PILOT_EXERCISE_IDS].sort());
    expect(PILOT_EXERCISE_IDS).toContain(EXERCISE_ID);
  });

  test("2. the knowledge base still holds exactly 76 ExerciseDefinitions — none added, none removed", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toHaveLength(76);
    expect(new Set(EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id)).size).toBe(76);
  });

  test("3. the numerical prescription profiles number 17 — this lot created none", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(17);
  });

  test("4. rowerg_intervals exists in both the knowledge base and the registry, with consistent identifiers", () => {
    const kbEntry = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === EXERCISE_ID);
    expect(kbEntry).toBeDefined();
    expect(kbEntry?.module).toBe("conditioning");
    expect(kbEntry?.primaryAdaptation).toBe("conditioning");

    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.exerciseId).toBe(EXERCISE_ID);
    expect(entry.capabilities.exerciseId).toBe(EXERCISE_ID);
    expect(PILOT_EXERCISE_IDS.filter((id) => id === EXERCISE_ID)).toHaveLength(1);
  });

  test("5. this lot added rowerg_intervals and nothing else: the 59 historical ids plus the later lots' ids account for every key", () => {
    const HISTORICAL_IDS = [
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
      "sprawl", "shot_entries",
    ] as const;

    // Ids added by lots AFTER this one, listed explicitly so that this
    // test keeps proving what it was written to prove — that rowerg_intervals
    // was the only exercise this lot introduced — instead of silently
    // absorbing any future addition.
    const ADDED_BY_LATER_LOTS = ["sprint_intervals", "ab_wheel", "dead_bug", "hanging_leg_raise", "plate_pinch"] as const;

    expect(HISTORICAL_IDS).toHaveLength(59);
    expect([...HISTORICAL_IDS, EXERCISE_ID, ...ADDED_BY_LATER_LOTS].sort()).toEqual(
      Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort(),
    );

    // The other conditioning modalities named alongside this one in the
    // knowledge base are still OUT of the registry.
    for (const id of ["assault_bike_intervals", "battle_ropes", "heavy_bag_power_intervals", "sled_push"]) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY as Record<string, unknown>).not.toHaveProperty(id);
    }
  });
});

// -----------------------------------------------------------------------------
// 6-9. Equipment — exact matching, both layers
// -----------------------------------------------------------------------------

describe("rowerg_intervals — equipment", () => {
  test("6. rowing_ergometer is recognized by the canonical prescription vocabulary", () => {
    expect(isEquipmentCapabilityId("rowing_ergometer")).toBe(true);
    expect(EQUIPMENT_CAPABILITY_IDS).toContain("rowing_ergometer");
    expect(findUnknownEquipmentCapabilities(["rowing_ergometer"])).toEqual([]);

    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.capabilities.requiredEquipmentCapabilities).toEqual(["rowing_ergometer"]);
    expect(findUnknownEquipmentCapabilities(entry.capabilities.requiredEquipmentCapabilities)).toEqual([]);
  });

  test("7. cardio_machine alone no longer satisfies rowerg_intervals, in either layer — and remains untouched for assault_bike_intervals", () => {
    // Knowledge-base layer.
    const cardioMachineOnly = makeValidInput({
      environment: makeEnvironment({ availableEquipment: [{ type: "cardio_machine" }] }),
    });
    const kbResult = checkExerciseEligibility(ROWERG_INTERVALS, cardioMachineOnly);
    expect(kbResult.eligible).toBe(false);
    expect(kbResult.rejectionReasons.some((reason) => reason.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);

    // Prescription layer: "cardio_machine" is not even part of this
    // vocabulary, so it can never stand in for the precise identifier.
    expect(isEquipmentCapabilityId("cardio_machine")).toBe(false);
    const sourceResult = getExercisePrescriptionSource(EXERCISE_ID, {
      ...VALID_CONTEXT,
      availableEquipmentCapabilities: ["cardio_machine"],
    });
    if (sourceResult.ok) {
      throw new Error("Expected a generic cardio machine NOT to satisfy rowerg_intervals.");
    }
    expect(sourceResult.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
    expect(sourceResult.message).toContain("rowing_ergometer");

    // assault_bike_intervals keeps the generic atom: no hierarchy, alias or
    // substitution was introduced between the two identifiers.
    const assaultBikeEquipment = ASSAULT_BIKE_INTERVALS.requirements!.required
      .flatMap((clause) => clause.items)
      .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
      .map((atom) => atom.equipment);
    expect(assaultBikeEquipment).toEqual(["cardio_machine"]);
    const assaultBikeEligibility = checkExerciseEligibility(ASSAULT_BIKE_INTERVALS, cardioMachineOnly);
    expect(assaultBikeEligibility.eligible).toBe(true);
  });

  test("8. an air bike does not make rowerg_intervals eligible", () => {
    // "air_bike" is not part of either vocabulary, and matching is exact
    // string equality — an air bike is not a rowing ergometer, whatever
    // identifier is supplied for it.
    expect(isEquipmentCapabilityId("air_bike")).toBe(false);

    const sourceResult = getExercisePrescriptionSource(EXERCISE_ID, {
      ...VALID_CONTEXT,
      availableEquipmentCapabilities: ["air_bike"],
    });
    if (sourceResult.ok) {
      throw new Error("Expected an air bike NOT to satisfy rowerg_intervals.");
    }
    expect(sourceResult.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
    expect(sourceResult.message).toContain("rowing_ergometer");

    // Nor does any other machine-adjacent capability that happens to exist.
    const emptyEnvironment = getExercisePrescriptionSource(EXERCISE_ID, {
      ...VALID_CONTEXT,
      availableEquipmentCapabilities: [],
    });
    expect(emptyEnvironment.ok).toBe(false);
  });

  test("9. a rowing ergometer satisfies rowerg_intervals, in both layers", () => {
    const rowingErgometer = makeValidInput({
      environment: makeEnvironment({ availableEquipment: [{ type: "rowing_ergometer" }] }),
    });
    const kbResult = checkExerciseEligibility(ROWERG_INTERVALS, rowingErgometer);
    expect(kbResult.eligible).toBe(true);
    expect(kbResult.rejectionReasons).toEqual([]);

    const rowergEquipment = ROWERG_INTERVALS.requirements!.required
      .flatMap((clause) => clause.items)
      .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
      .map((atom) => atom.equipment);
    expect(rowergEquipment).toEqual(["rowing_ergometer"]);

    expect(getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT).ok).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// 10-11. Numerical profile — explicit selection
// -----------------------------------------------------------------------------

describe("rowerg_intervals — numerical profile selection", () => {
  test("10. the entry declares numericalProfileId = conditioning_long_intervals_v0_1, on the documented triple", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    expect(entry.moduleId).toBe("conditioning");
    expect(entry.role).toBe("conditioning");
    expect(entry.explicitMethodId).toBe("work_rest_intervals");
    expect(entry.numericalProfileId).toBe(PROFILE_ID);

    const profile = getNumericalPrescriptionProfileById(PROFILE_ID);
    expect(profile?.moduleId).toBe("conditioning");
    expect(profile?.methodId).toBe("work_rest_intervals");
    expect(profile?.exerciseRole).toBe("conditioning");

    // None of the three forbidden alternatives is selected.
    for (const forbidden of [
      "conditioning_short_intervals_v0_1",
      "repeated_sprint_intervals_v0_1",
      "combat_technical_rounds_v0_1",
      "continuous_aerobic_conditioning_v0_1",
    ]) {
      expect(entry.numericalProfileId).not.toBe(forbidden);
    }
  });

  test("11. explicit selection succeeds where implicit resolution deliberately fails", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    const explicit = resolveNumericalProfile({
      moduleId: entry.moduleId,
      methodId: entry.explicitMethodId,
      exerciseRole: entry.role,
      explicitProfileId: entry.numericalProfileId ?? null,
    });
    if (!explicit.ok) {
      throw new Error(`Expected explicit selection to succeed: ${explicit.message}`);
    }
    expect(explicit.profile.profileId).toBe(PROFILE_ID);
    expect(explicit.resolutionSource).toBe("explicit_profile_id");

    const implicit = resolveNumericalProfile({
      moduleId: entry.moduleId,
      methodId: entry.explicitMethodId,
      exerciseRole: entry.role,
    });
    if (implicit.ok) {
      throw new Error("Expected the ambiguous triple to refuse implicit resolution.");
    }
    expect(implicit.failureCode).toBe("NUMERICAL_PROFILE_AMBIGUOUS");
    expect(implicit.candidateProfileIds).toHaveLength(3);

    // Every one of the four numerical resolvers agrees on the same profile.
    const { volume, intensity, rest, tempo } = prescribe().trace;
    if (!volume.ok || !intensity.ok || !rest.ok || !tempo.ok) {
      throw new Error("Expected every numerical stage to succeed.");
    }
    expect(new Set([volume.profileId, intensity.profileId, rest.profileId, tempo.profileId])).toEqual(
      new Set([PROFILE_ID]),
    );
    expect(volume.profileResolutionSource).toBe("explicit_profile_id");
  });
});

// -----------------------------------------------------------------------------
// 12-15. Volume
// -----------------------------------------------------------------------------

describe("rowerg_intervals — volume", () => {
  test("12. reduced / normal / high all prescribe completely, with the documented per-context values", () => {
    const expected = {
      reduced: { workIntervals: 5, durationSeconds: 60 },
      normal: { workIntervals: 6, durationSeconds: 120 },
      high: { workIntervals: 10, durationSeconds: 180 },
    } as const;

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const result = prescribe(rangeContext);
      expect(result.prescription.status).toBe("complete");
      expect(result.prescription.volume.workIntervals).toBe(expected[rangeContext].workIntervals);
      expect(result.prescription.volume.duration?.value).toBe(expected[rangeContext].durationSeconds);
    }
  });

  test("13. the resolved volume structure is `intervals`, with every field the method forbids left null", () => {
    const result = prescribe();
    const { volume } = result.prescription;
    const contract = getTrainingMethodContract("work_rest_intervals");

    expect(contract.volumeStructure).toBe("intervals");
    expect(volume.structure).toBe("intervals");
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].capabilities.supportedVolumeStructures).toEqual(["intervals"]);

    expect(contract.forbiddenVolumeFields).toEqual(["sets", "repetitions", "rounds"]);
    expect(volume.sets).toBeNull();
    expect(volume.reps).toBeNull();
    expect(volume.rounds).toBeNull();

    // No distance is prescribed: the selected profile encodes no distance
    // rule, and the fiche's own "250 m / 500 m / 1000 m Repeats" variations
    // are deliberately NOT converted into any other dimension.
    expect(volume.distance).toBeNull();
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)?.volume.distance).toBeNull();
  });

  test("14. workIntervals is narrowed to 5-10: the fiche's own \"5-12 intervals\" intersected with the profile's own [4, 10]", () => {
    const constraints = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseDoseConstraints;

    expect(constraints).toEqual({
      minimumDose: { sets: null, repetitions: null, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: 5 },
      maximumDose: { sets: null, repetitions: null, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: 10 },
      sourceRuleIds: [SOURCE_CHAPTER],
    });

    // The narrowing never widens the shared profile.
    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.volume.workIntervals).toEqual({ min: 4, normal: 6, max: 10 });
    expect(constraints!.minimumDose!.workIntervals!).toBeGreaterThanOrEqual(profile.volume.workIntervals!.min);
    expect(constraints!.maximumDose!.workIntervals!).toBeLessThanOrEqual(profile.volume.workIntervals!.max);

    // No conversion of any kind: no repetition, distance, rounds or sets
    // figure was derived from the fiche's metres or minutes.
    for (const dimension of ["sets", "repetitions", "durationSeconds", "distanceMeters", "rounds"] as const) {
      expect(constraints!.minimumDose![dimension]).toBeNull();
      expect(constraints!.maximumDose![dimension]).toBeNull();
    }

    const volumeTrace = prescribe().trace.volume;
    if (!volumeTrace.ok) {
      throw new Error("Expected volume resolution to succeed.");
    }
    expect(volumeTrace.narrowingNotes.some((note) => note.includes("workIntervals range 4-10 narrowed to 5-10"))).toBe(true);
    expect(volumeTrace.narrowingNotes.some((note) => note.startsWith("durationSeconds range"))).toBe(false);
  });

  test("15. per-interval duration comes from the profile unchanged (60/120/180s, scope per_interval) — the fiche's wider 15s-5min envelope never widens it", () => {
    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.volume.duration).toEqual({
      type: "fixed_range",
      range: { min: 60, normal: 120, max: 180, unit: "seconds" },
      scope: "per_interval",
    });

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const duration = prescribe(rangeContext).prescription.volume.duration;
      expect(duration?.unit).toBe("seconds");
      expect(duration?.scope).toBe("per_interval");
      // Never below the profile floor, never above its ceiling — the
      // fiche's own 15s lower bound is INT-SHORT territory, not this one's.
      expect(duration!.value).toBeGreaterThanOrEqual(60);
      expect(duration!.value).toBeLessThanOrEqual(180);
    }
  });
});

// -----------------------------------------------------------------------------
// 16-19. Rest, intensity, tempo, stop conditions
// -----------------------------------------------------------------------------

describe("rowerg_intervals — rest, intensity, tempo and stop conditions", () => {
  test("16. rest is scoped between_intervals and taken from the profile unchanged (30/75/120s)", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseRestConstraints).toBeNull();
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)?.rest?.scope).toBe("between_intervals");

    const expected = { reduced: 30, normal: 75, high: 120 } as const;

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const rest = prescribe(rangeContext).prescription.rest;
      expect(rest).not.toBeNull();
      expect(rest?.betweenSets).toBeNull();
      expect(rest?.betweenRounds).toBeNull();

      const betweenIntervals = rest?.betweenIntervals;
      if (betweenIntervals?.type !== "fixed") {
        throw new Error("Expected a fixed between-intervals rest target.");
      }
      expect(betweenIntervals.duration.value).toBe(expected[rangeContext]);
      expect(betweenIntervals.duration.scope).toBe("between_intervals");
    }
  });

  test("17. intensity resolves to the profile's own RPE 7/8/9 — no pace, power, heart rate or aerobic reference is claimed", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    expect(entry.supportedIntensityTypes).toEqual(["rpe"]);
    expect(entry.preferredIntensityType).toBe("rpe");
    expect(entry.capabilities.supportedIntensityTypes).toEqual(["rpe"]);
    expect(entry.exerciseIntensityConstraints).toBeNull();
    // No athlete reference is required: an RPE rule carries no referenceType.
    expect(entry.capabilities.requiredAthleteReferenceTypes).toEqual([]);

    for (const forbidden of ["pace", "heart_rate", "velocity", "resistance_category", "percentage_1rm"] as const) {
      expect(entry.supportedIntensityTypes).not.toContain(forbidden);
      expect(entry.capabilities.supportedIntensityTypes).not.toContain(forbidden);
    }

    const expected = { reduced: 7, normal: 8, high: 9 } as const;

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const metric = prescribe(rangeContext).prescription.intensity.primaryMetric;
      expect(metric.type).toBe("rpe");
      expect(metric.unit).toBe("rpe_scale_1_10");
      expect(metric.reference).toBeNull();
      expect(metric.target).toEqual({ type: "fixed", value: expected[rangeContext] });
    }
  });

  test("18. tempo is null — work_rest_intervals forbids it and the profile documents none", () => {
    const contract = getTrainingMethodContract("work_rest_intervals");
    expect(contract.tempoPolicy).toBe("forbidden");
    expect(contract.allowedTempoTypes).toEqual([]);
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)?.tempo).toBeNull();

    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].preferredTempoType).toBeNull();

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      expect(prescribe(rangeContext).prescription.tempo).toBeNull();
    }
  });

  test("19. all six stop-condition categories required by work_rest_intervals resolve, with the documented scopes", () => {
    const contract = getTrainingMethodContract("work_rest_intervals");
    const REQUIRED_CATEGORIES = ["pace_loss", "technical_failure", "fatigue_limit", "acute_symptom", "pain", "completion"];
    expect(contract.requiredStopConditionCategories).toEqual(REQUIRED_CATEGORIES);

    const definitions = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].stopConditionDefinitions;
    expect(definitions.map((definition) => definition.category)).toEqual(REQUIRED_CATEGORIES);
    for (const definition of definitions) {
      expect(definition.instructions[0]?.text.length).toBeGreaterThan(0);
      expect(definition.sourceRuleIds.length).toBeGreaterThan(0);
    }

    const stopConditions = prescribe().prescription.stopConditions;
    expect(stopConditions).toHaveLength(6);
    expect(stopConditions.map((condition) => condition.category).sort()).toEqual([...REQUIRED_CATEGORIES].sort());

    // The two factories written for this method carry the interval-aware
    // shapes their own documentation specifies.
    const paceLoss = stopConditions.find((condition) => condition.category === "pace_loss");
    expect(paceLoss?.scope).toBe("interval");
    expect(paceLoss?.action).toBe("end_interval");
    expect(paceLoss?.trigger.evaluationTiming).toBe("during_interval");

    const acuteSymptom = stopConditions.find((condition) => condition.category === "acute_symptom");
    expect(acuteSymptom?.scope).toBe("exercise");
    expect(acuteSymptom?.action).toBe("stop_exercise");
    expect(acuteSymptom?.priority).toBe("critical");
    expect(acuteSymptom?.trigger.evaluationTiming).toBe("continuous");

    // Stop-condition texts are grounded in this fiche, not copy-pasted.
    const technicalFailure = definitions.find((definition) => definition.category === "technical_failure");
    expect(technicalFailure?.instructions[0]?.text.toLowerCase()).toContain("stroke rate");
    expect(paceLoss?.instructions[0]?.text.toLowerCase()).toContain("split time");
  });
});

// -----------------------------------------------------------------------------
// 20-23. End-to-end: exercise, session, engine, decision trace
// -----------------------------------------------------------------------------

describe("rowerg_intervals — end-to-end prescription", () => {
  test("20. prescribeExercise produces a complete prescription", () => {
    const result = prescribe();

    expect(result.prescription.status).toBe("complete");
    expect(result.prescription.exerciseId).toBe(EXERCISE_ID);
    expect(result.prescription.moduleId).toBe("conditioning");
    expect(result.prescription.role).toBe("conditioning");
    expect(result.prescription.methodId).toBe("work_rest_intervals");
    expect(result.prescription.instructions.length).toBeGreaterThan(0);
    expect(result.prescription.sourceRuleIds).toContain(SOURCE_CHAPTER);
    expect(result.trace.validation.valid).toBe(true);
  });

  test("21. prescribeSession prescribes a conditioning block alongside a strength exercise", () => {
    const benchSource = getExercisePrescriptionSource("bench_press", {
      rangeContext: "normal",
      athleteReferences: [
        {
          referenceType: "one_rep_max",
          value: 100,
          unit: "kilograms",
          sourceId: "test-1rm",
          measuredAt: null,
          validUntil: null,
          confidence: "validated",
        },
      ],
      availableEquipmentCapabilities: ["barbell", "bench", "rack", "plates"],
    });
    const rowergSource = getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT);

    if (!benchSource.ok || !rowergSource.ok) {
      throw new Error("Fixture setup failed: one of the sources did not resolve.");
    }

    const exercises: SessionExercisePrescriptionInput[] = [
      { exerciseId: "bench_press", moduleId: benchSource.moduleId, ...benchSource.source, order: 1, required: true, blockId: "strength" },
      { exerciseId: EXERCISE_ID, moduleId: rowergSource.moduleId, ...rowergSource.source, order: 2, required: true, blockId: "conditioning" },
    ];

    const result = prescribeSession({
      sessionId: "rowerg-session-1",
      sessionName: "Strength + Conditioning Session",
      modules: ["strength", "conditioning"],
      exercises,
    });

    if (!result.ok) {
      throw new Error(`Expected the session to prescribe: ${result.issues.map((issue) => issue.message).join(" | ")}`);
    }

    expect(result.session.status).toBe("complete");
    expect(result.session.exercises).toHaveLength(2);
    const rowergPrescription = result.session.exercises[1]?.prescription;
    expect(rowergPrescription?.exerciseId).toBe(EXERCISE_ID);
    expect(rowergPrescription?.volume.structure).toBe("intervals");
    expect(rowergPrescription?.volume.workIntervals).toBe(6);
  });

  test("22. runEngine prescribes rowerg_intervals end to end from the real ExerciseDefinition", () => {
    const input = makeValidInput({
      request: makeRequest({ primaryObjective: { adaptationDomain: "conditioning" } }),
      environment: makeEnvironment({ availableEquipment: [{ type: "rowing_ergometer" }] }),
    });
    // The real knowledge-base definition, only given the duration fields
    // `runEngine`'s session assembly needs (the knowledge base documents no
    // timing data for any exercise — see durationEstimationProfiles.ts).
    const exercise = makeExercise({
      ...ROWERG_INTERVALS,
      setupTimeMinutes: 2,
      defaultExerciseDurationMinutes: 15,
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
  });

  test("23. the decision trace names the explicitly selected profile", () => {
    const entries = adaptExercisePrescriptionResult(prescribe(), {
      idPrefix: "rowerg_test",
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    const volumeEntry = entries.find((entry) => entry.id.endsWith("_volume"));
    expect(volumeEntry?.reasons[0]).toBe(`profile=${PROFILE_ID} (selection=explicit_profile_id)`);
    expect(volumeEntry?.reasons.some((reason) => reason.includes("workIntervals range 4-10 narrowed to 5-10"))).toBe(true);

    const intensityEntry = entries.find((entry) => entry.id.endsWith("_intensity"));
    expect(intensityEntry?.decision).toContain('Intensity resolved via "rpe"');

    const tempoEntry = entries.find((entry) => entry.id.endsWith("_tempo"));
    expect(tempoEntry?.decision).toContain("No tempo required");
  });
});

// -----------------------------------------------------------------------------
// 24-27. Determinism, non-mutation, non-regression, registry validation
// -----------------------------------------------------------------------------

describe("rowerg_intervals — determinism, non-mutation and non-regression", () => {
  test("24. determinism: identical input yields identical source and identical prescription", () => {
    expect(getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT)).toEqual(
      getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT),
    );

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      expect(prescribe(rangeContext).prescription).toEqual(prescribe(rangeContext).prescription);
    }
  });

  test("25. non-mutation: neither the context nor the registry is modified by resolution", () => {
    const context: PrescriptionExecutionContext = { ...VALID_CONTEXT };
    const contextSnapshot = JSON.parse(JSON.stringify(context));
    const registrySnapshot = JSON.parse(JSON.stringify(EXERCISE_PRESCRIPTION_REGISTRY));

    prescribe();
    getExercisePrescriptionSource(EXERCISE_ID, context);

    expect(context).toEqual(contextSnapshot);
    expect(EXERCISE_PRESCRIPTION_REGISTRY).toEqual(registrySnapshot);
  });

  test("26. no regression on the 59 historical entries: each still prescribes with its own declared equipment", () => {
    const REFERENCE = {
      referenceType: "one_rep_max" as const,
      value: 100,
      unit: "kilograms",
      sourceId: "test-1rm",
      measuredAt: null,
      validUntil: null,
      confidence: "validated" as const,
    };

    // The 59 entries that predate this lot: everything except this lot's own
    // entry and the ids added by later lots (each of which has its own
    // non-regression coverage in its own test file).
    const ADDED_BY_THIS_OR_LATER_LOTS: readonly string[] = [EXERCISE_ID, "sprint_intervals", "ab_wheel", "dead_bug", "hanging_leg_raise", "plate_pinch"];
    const historicalIds = PILOT_EXERCISE_IDS.filter((id) => !ADDED_BY_THIS_OR_LATER_LOTS.includes(id));
    expect(historicalIds).toHaveLength(59);

    for (const id of historicalIds) {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id as PilotExerciseId];
      // Untouched by this lot: no historical entry gained an explicit
      // profile id, and none references the new equipment identifier.
      expect(entry.numericalProfileId ?? null).toBeNull();
      expect(entry.capabilities.requiredEquipmentCapabilities).not.toContain("rowing_ergometer");

      const sourceResult = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [REFERENCE],
        availableEquipmentCapabilities: entry.capabilities.requiredEquipmentCapabilities,
      });
      if (!sourceResult.ok) {
        throw new Error(`Historical entry "${id}" no longer builds a source: ${sourceResult.message}`);
      }

      const result = prescribeExercise({ exerciseId: id, moduleId: sourceResult.moduleId, ...sourceResult.source });
      if (!result.ok) {
        throw new Error(`Historical entry "${id}" no longer prescribes (${result.failureStage}): ${result.message}`);
      }
      expect(result.prescription.status).toBe("complete");
    }
  });

  test("27. the full registry validates with no blocking issue beyond the expected unresolved duration profiles", () => {
    const issues = validatePilotRegistry();
    expect(issues.filter((issue) => issue.code !== "UNRESOLVED_DURATION_PROFILE")).toEqual([]);

    // Every entry, including the new one, reports exactly that one
    // non-fatal gap — no more, no fewer.
    expect(issues).toHaveLength(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).length);
    expect(issues.some((issue) => issue.exerciseId === EXERCISE_ID)).toBe(true);

    const durationProfile = getDurationEstimationProfile(`duration_profile_${EXERCISE_ID}`);
    if (durationProfile.ok) {
      throw new Error("Expected the rowerg_intervals duration profile to be unresolved.");
    }
    expect(durationProfile.failureCode).toBe("DURATION_PROFILE_UNRESOLVED");
    expect(durationProfile.profile?.volumeStructure).toBe("intervals");
    expect(durationProfile.profile?.sourceRuleIds).toEqual([SOURCE_CHAPTER]);
    // No timing value was invented to fill the gap.
    expect(durationProfile.profile?.perIntervalSeconds).toBeNull();
    expect(durationProfile.profile?.restSeconds).toBeNull();
  });
});
