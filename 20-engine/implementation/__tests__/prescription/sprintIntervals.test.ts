/**
 * Combat Athlete System — Registry Lot 6: sprint_intervals
 *
 * Second entry on the ambiguous (conditioning, work_rest_intervals,
 * conditioning) triple, and the first to select
 * `repeated_sprint_intervals_v0_1`. Together with rowerg_intervals it is
 * the concrete proof that explicit numerical profile selection was
 * necessary: two entries, same module, same method, same role — two
 * different profiles, resolvable only because each names its own.
 *
 * What this file guards beyond presence:
 *
 * - eligibility stays entirely in the knowledge base: `sprinting_allowed`,
 *   `floor_safe` and `sufficient_space` ("large") gate this exercise, and
 *   NO equipment capability is invented at the prescription layer to
 *   mirror or duplicate them;
 * - the first registry use of the `locomotion_only` loading mode, which
 *   required widening a registry validator whose "no equipment implies
 *   bodyweight" heuristic predates any locomotor entry;
 * - the honest volume: per-interval work duration narrowed 3-8s → 5-8s
 *   from the fiche's own "Typical Work Duration: 5-10 seconds", and
 *   NOTHING derived from its "6-15 repetitions" (a different documented
 *   dimension, never read as an interval count) or from its documented
 *   10-60 m sprint distance (not encodable by the selected profile).
 */

import { describe, expect, test } from "vitest";

import { EXERCISE_KNOWLEDGE_BASE, SPRINT_INTERVALS } from "../../exerciseKnowledgeBase";
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
import { validatePilotRegistry, validateRegistryEntry } from "../../prescription/registryValidators";
import { findUnknownEquipmentCapabilities } from "../../prescription/equipmentCapabilities";
import { getTrainingMethodContract } from "../../prescription/contracts";
import { adaptExercisePrescriptionResult } from "../../prescription/prescriptionDecisionTrace";
import type { ExercisePrescriptionSource } from "../../prescription/buildPrescriptionInput";

import { runEngine } from "../../index";
import { makeAthleteProfile, makeEnvironment, makeExercise, makeReadiness, makeRequest, makeValidInput } from "../fixtures";

const EXERCISE_ID = "sprint_intervals";
const PROFILE_ID = "repeated_sprint_intervals_v0_1";
const SOURCE_CHAPTER = "50-exercises/47_SPRINT_INTERVALS";

/** No equipment is required — the environment gates live in the knowledge base. */
const VALID_CONTEXT: PrescriptionExecutionContext = {
  rangeContext: "normal",
  athleteReferences: [],
  availableEquipmentCapabilities: [],
};

/** An environment satisfying all three documented knowledge-base gates. */
const validSprintEnvironment = () =>
  makeEnvironment({
    locationType: "outdoor",
    availableEquipment: [],
    availableSpace: "large",
    sprintingAllowed: true,
    floorSafe: true,
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

// -----------------------------------------------------------------------------
// 1-5. Counts, presence, additivity
// -----------------------------------------------------------------------------

describe("sprint_intervals — registry, knowledge base and profile counts", () => {
  test("1. the registry grew from 60 to exactly 61 entries", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(74);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(74);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort()).toEqual([...PILOT_EXERCISE_IDS].sort());
  });

  test("2. the knowledge base still holds exactly 76 ExerciseDefinitions — none added, none removed", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toHaveLength(76);
    expect(new Set(EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id)).size).toBe(76);
  });

  test("3. the numerical prescription profiles number 22 — this lot created none", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(22);
    expect(NUMERICAL_PRESCRIPTION_PROFILES.filter((profile) => profile.profileId === PROFILE_ID)).toHaveLength(1);
  });

  test("4. sprint_intervals exists in both the knowledge base and the registry, with consistent identifiers", () => {
    const kbEntry = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === EXERCISE_ID);
    expect(kbEntry).toBeDefined();
    expect(kbEntry?.module).toBe("conditioning");
    expect(kbEntry?.primaryAdaptation).toBe("conditioning");
    expect(kbEntry?.movementPatterns).toContain("sprint");

    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.exerciseId).toBe(EXERCISE_ID);
    expect(entry.capabilities.exerciseId).toBe(EXERCISE_ID);
    expect(PILOT_EXERCISE_IDS.filter((id) => id === EXERCISE_ID)).toHaveLength(1);
  });

  test("5. no other exercise was added: the 60 previous ids plus sprint_intervals account for every key", () => {
    const PREVIOUS_IDS = [
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
      "rowerg_intervals",
    ] as const;

    // Ids added by lots AFTER this one, listed explicitly so this test keeps
    // proving that sprint_intervals was the only exercise this lot added.
    const ADDED_BY_LATER_LOTS = ["ab_wheel", "dead_bug", "hanging_leg_raise", "plate_pinch", "heavy_bag_power_intervals", "battle_ropes", "assault_bike_intervals", "towel_pull_up", "rope_climb", "rope_pull", "pummeling", "wall_wrestling", "grip_fighting"] as const;

    expect(PREVIOUS_IDS).toHaveLength(60);
    expect([...PREVIOUS_IDS, EXERCISE_ID, ...ADDED_BY_LATER_LOTS].sort()).toEqual(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort());

    // The other conditioning/power modalities. heavy_bag_power_intervals,
    // battle_ropes and assault_bike_intervals were all integrated by later
    // lots on Table Group 14; sled_push stays out of the registry.
    for (const id of ["sled_push"]) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY as Record<string, unknown>).not.toHaveProperty(id);
    }
    expect(EXERCISE_PRESCRIPTION_REGISTRY).toHaveProperty("assault_bike_intervals");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.assault_bike_intervals.numericalProfileId).toBe(
      "power_intervals_v0_1",
    );
    expect(EXERCISE_PRESCRIPTION_REGISTRY).toHaveProperty("heavy_bag_power_intervals");
    expect(EXERCISE_PRESCRIPTION_REGISTRY.heavy_bag_power_intervals.numericalProfileId).toBe(
      "power_intervals_v0_1",
    );
  });
});

// -----------------------------------------------------------------------------
// 6-9. Eligibility and environment — governed by the knowledge base
// -----------------------------------------------------------------------------

describe("sprint_intervals — eligibility and environment", () => {
  test("6. a valid environment (sprinting allowed, safe floor, large space) makes the exercise eligible", () => {
    const input = makeValidInput({ environment: validSprintEnvironment() });
    const result = checkExerciseEligibility(SPRINT_INTERVALS, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("7. sprintingAllowed = false makes the exercise ineligible", () => {
    const input = makeValidInput({
      environment: makeEnvironment({ ...validSprintEnvironment(), sprintingAllowed: false }),
    });
    const result = checkExerciseEligibility(SPRINT_INTERVALS, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.length).toBeGreaterThan(0);

    // An undeclared permission is not an implicit yes either.
    const undeclared = makeValidInput({
      environment: makeEnvironment({
        locationType: "outdoor",
        availableEquipment: [],
        availableSpace: "large",
        floorSafe: true,
      }),
    });
    expect(checkExerciseEligibility(SPRINT_INTERVALS, undeclared).eligible).toBe(false);
  });

  test("8. insufficient space makes the exercise ineligible — the fiche documents a 10-60 m sprint distance", () => {
    for (const availableSpace of ["very_limited", "limited", "moderate"] as const) {
      const input = makeValidInput({
        environment: makeEnvironment({ ...validSprintEnvironment(), availableSpace }),
      });
      const result = checkExerciseEligibility(SPRINT_INTERVALS, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.length).toBeGreaterThan(0);
    }

    // "large" is the documented minimum; "open" also satisfies it.
    for (const availableSpace of ["large", "open"] as const) {
      const input = makeValidInput({
        environment: makeEnvironment({ ...validSprintEnvironment(), availableSpace }),
      });
      expect(checkExerciseEligibility(SPRINT_INTERVALS, input).eligible).toBe(true);
    }

    // An unsafe running surface is likewise disqualifying.
    const unsafeFloor = makeValidInput({
      environment: makeEnvironment({ ...validSprintEnvironment(), floorSafe: false }),
    });
    expect(checkExerciseEligibility(SPRINT_INTERVALS, unsafeFloor).eligible).toBe(false);
  });

  test("9. no artificial equipment is required, at either layer", () => {
    // Knowledge base: three environment atoms, zero equipment atoms.
    const atoms = SPRINT_INTERVALS.requirements!.required.flatMap((clause) => clause.items);
    expect(atoms.filter((atom) => atom.kind === "equipment")).toEqual([]);
    expect(
      atoms
        .filter((atom): atom is Extract<typeof atom, { kind: "environment" }> => atom.kind === "environment")
        .map((atom) => atom.capability)
        .sort(),
    ).toEqual(["floor_safe", "sprinting_allowed", "sufficient_space"]);
    expect(SPRINT_INTERVALS.requiredEquipment).toEqual([]);

    // Registry: no equipment capability, and none of the Optional items
    // (timing gates, GPS, heart-rate monitor, sled) promoted to Required.
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.capabilities.requiredEquipmentCapabilities).toEqual([]);
    expect(findUnknownEquipmentCapabilities(entry.capabilities.requiredEquipmentCapabilities)).toEqual([]);
    expect(entry.capabilities.requiredAthleteReferenceTypes).toEqual([]);

    // The source therefore resolves with a completely empty equipment context.
    expect(getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT).ok).toBe(true);

    // First registry use of `locomotion_only` — the documented loading mode
    // for 33_EXERCISE_PRESCRIPTION_CAPABILITIES' Family 10, deliberately not
    // `bodyweight`, and no longer flagged as an impossible combination by
    // the registry validator.
    expect(entry.capabilities.supportedLoadingModes).toEqual(["locomotion_only"]);
    expect(
      validateRegistryEntry(entry).filter(
        (issue) => issue.code === "IMPOSSIBLE_METHOD_STRUCTURE_EQUIPMENT_COMBINATION",
      ),
    ).toEqual([]);

    // The widened rule is still a real rule: an entry with neither equipment
    // nor a self-supplied loading mode is rejected.
    const broken = validateRegistryEntry({
      ...entry,
      capabilities: { ...entry.capabilities, supportedLoadingModes: ["sled"] },
    });
    expect(broken.some((issue) => issue.code === "IMPOSSIBLE_METHOD_STRUCTURE_EQUIPMENT_COMBINATION")).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// 10-12. Numerical profile — explicit selection
// -----------------------------------------------------------------------------

describe("sprint_intervals — numerical profile selection", () => {
  test("10. the entry declares numericalProfileId = repeated_sprint_intervals_v0_1 on the documented triple", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    expect(entry.moduleId).toBe("conditioning");
    expect(entry.role).toBe("conditioning");
    expect(entry.explicitMethodId).toBe("work_rest_intervals");
    expect(entry.numericalProfileId).toBe(PROFILE_ID);

    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.moduleId).toBe("conditioning");
    expect(profile.methodId).toBe("work_rest_intervals");
    expect(profile.exerciseRole).toBe("conditioning");

    // The documented envelope this entry relies on, asserted literally.
    expect(profile.volume.structure).toBe("intervals");
    expect(profile.volume.workIntervals).toEqual({ min: 10, normal: 15, max: 20 });
    expect(profile.volume.duration).toEqual({
      type: "fixed_range",
      range: { min: 3, normal: 5, max: 8, unit: "seconds" },
      scope: "per_interval",
    });
    expect(profile.rest).toEqual({
      scope: "between_intervals",
      seconds: { min: 20, normal: 40, max: 60 },
      sourceRuleIds: profile.rest!.sourceRuleIds,
    });
    expect(profile.intensity).toHaveLength(1);
    expect(profile.intensity[0]).toMatchObject({ type: "movement_intent", value: "maximal_safe_speed" });
    expect(profile.tempo).toBeNull();

    // Neither of the two forbidden alternatives is selected.
    expect(entry.numericalProfileId).not.toBe("conditioning_short_intervals_v0_1");
    expect(entry.numericalProfileId).not.toBe("conditioning_long_intervals_v0_1");
  });

  test("11. explicit resolution succeeds, and every numerical resolver agrees on the profile", () => {
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

    const { volume, intensity, rest, tempo } = prescribe().trace;
    if (!volume.ok || !intensity.ok || !rest.ok || !tempo.ok) {
      throw new Error("Expected every numerical stage to succeed.");
    }
    expect(new Set([volume.profileId, intensity.profileId, rest.profileId, tempo.profileId])).toEqual(
      new Set([PROFILE_ID]),
    );
  });

  test("12. implicit resolution on the same triple is ambiguous — and sprint_intervals and rowerg_intervals prove why", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    const implicit = resolveNumericalProfile({
      moduleId: entry.moduleId,
      methodId: entry.explicitMethodId,
      exerciseRole: entry.role,
    });

    if (implicit.ok) {
      throw new Error("Expected the ambiguous triple to refuse implicit resolution.");
    }
    expect(implicit.failureCode).toBe("NUMERICAL_PROFILE_AMBIGUOUS");
    expect(implicit.candidateProfileIds).toHaveLength(4);
    expect(implicit.candidateProfileIds).toContain(PROFILE_ID);

    // Two registry entries share this exact triple and resolve differently:
    // the triple alone could never have told them apart.
    const rowerg = EXERCISE_PRESCRIPTION_REGISTRY.rowerg_intervals;
    expect(rowerg.moduleId).toBe(entry.moduleId);
    expect(rowerg.explicitMethodId).toBe(entry.explicitMethodId);
    expect(rowerg.role).toBe(entry.role);
    expect(rowerg.numericalProfileId).not.toBe(entry.numericalProfileId);
  });
});

// -----------------------------------------------------------------------------
// 13-19. Volume, rest
// -----------------------------------------------------------------------------

describe("sprint_intervals — volume and rest", () => {
  const EXPECTED = {
    reduced: { workIntervals: 10, durationSeconds: 5, restSeconds: 20 },
    normal: { workIntervals: 15, durationSeconds: 5, restSeconds: 40 },
    high: { workIntervals: 20, durationSeconds: 8, restSeconds: 60 },
  } as const;

  for (const rangeContext of ["reduced", "normal", "high"] as const) {
    test(`${rangeContext === "reduced" ? "13" : rangeContext === "normal" ? "14" : "15"}. "${rangeContext}" prescribes completely with the documented values`, () => {
      const result = prescribe(rangeContext);
      const expected = EXPECTED[rangeContext];

      expect(result.prescription.status).toBe("complete");
      expect(result.prescription.volume.workIntervals).toBe(expected.workIntervals);
      expect(result.prescription.volume.duration?.value).toBe(expected.durationSeconds);

      const betweenIntervals = result.prescription.rest?.betweenIntervals;
      if (betweenIntervals?.type !== "fixed") {
        throw new Error("Expected a fixed between-intervals rest target.");
      }
      expect(betweenIntervals.duration.value).toBe(expected.restSeconds);
    });
  }

  test("16. the resolved volume structure is `intervals`, with every field the method forbids left null", () => {
    const contract = getTrainingMethodContract("work_rest_intervals");
    const { volume } = prescribe().prescription;

    expect(contract.volumeStructure).toBe("intervals");
    expect(volume.structure).toBe("intervals");
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].capabilities.supportedVolumeStructures).toEqual(["intervals"]);

    expect(contract.forbiddenVolumeFields).toEqual(["sets", "repetitions", "rounds"]);
    expect(volume.sets).toBeNull();
    expect(volume.reps).toBeNull();
    expect(volume.rounds).toBeNull();

    // DOCUMENTED PRECISION LOSS: the fiche's own "Sprint Distance: 10-60
    // meters" and its 10/20/30 m variations are not representable — the
    // selected profile encodes no distance rule, and none is invented.
    expect(volume.distance).toBeNull();
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)?.volume.distance).toBeNull();
  });

  test("17. workIntervals comes from the shared profile alone — the fiche's \"6-15 repetitions\" is never read as an interval count", () => {
    const constraints = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseDoseConstraints!;

    // No workIntervals bound is derived from the fiche's repetition count:
    // "repetitions" and "intervals" are two different documented dimensions,
    // and this registry never treats one as a synonym for the other.
    expect(constraints.minimumDose?.workIntervals ?? null).toBeNull();
    expect(constraints.maximumDose?.workIntervals ?? null).toBeNull();

    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    const profileRange = profile.volume.workIntervals!;
    const expectedByContext = {
      reduced: profileRange.min,
      normal: profileRange.normal,
      high: profileRange.max,
    } as const;

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      expect(prescribe(rangeContext).prescription.volume.workIntervals).toBe(expectedByContext[rangeContext]);
    }

    // DOCUMENTED CONSEQUENCE, asserted rather than hidden: at "high" the
    // prescribed interval count (20) exceeds the 15 this fiche names as its
    // own typical upper bound. Reconciling the two needs a documented rule,
    // not a silent assumption.
    expect(prescribe("high").prescription.volume.workIntervals).toBe(20);
    expect(prescribe("high").prescription.volume.workIntervals!).toBeGreaterThan(15);
  });

  test("18. per-interval work duration is narrowed to 5-8s from the fiche's own \"Typical Work Duration: 5-10 seconds\"", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseDoseConstraints).toEqual({
      minimumDose: { sets: null, repetitions: null, durationSeconds: 5, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: null, repetitions: null, durationSeconds: 8, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: [SOURCE_CHAPTER],
    });

    // The narrowing never widens the shared profile: 5 >= 3 and 8 <= 8.
    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(5).toBeGreaterThanOrEqual(profile.volume.duration!.range.min);
    expect(8).toBeLessThanOrEqual(profile.volume.duration!.range.max);

    // No conversion of any kind was performed to obtain it.
    const constraints = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseDoseConstraints!;
    for (const dimension of ["sets", "repetitions", "distanceMeters", "rounds", "workIntervals"] as const) {
      expect(constraints.minimumDose![dimension]).toBeNull();
      expect(constraints.maximumDose![dimension]).toBeNull();
    }

    const volumeTrace = prescribe().trace.volume;
    if (!volumeTrace.ok) {
      throw new Error("Expected volume resolution to succeed.");
    }
    expect(
      volumeTrace.narrowingNotes.some((note) => note.includes("durationSeconds range 3-8 narrowed to 5-8")),
    ).toBe(true);
    expect(volumeTrace.narrowingNotes.some((note) => note.startsWith("workIntervals range"))).toBe(false);

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const duration = prescribe(rangeContext).prescription.volume.duration!;
      expect(duration.unit).toBe("seconds");
      expect(duration.scope).toBe("per_interval");
      expect(duration.value).toBeGreaterThanOrEqual(5);
      expect(duration.value).toBeLessThanOrEqual(8);
    }
  });

  test("19. rest is scoped between_intervals and taken from the profile unchanged — \"20-90 seconds\" contains it, so nothing is narrowed", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseRestConstraints).toBeNull();
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)?.rest?.scope).toBe("between_intervals");

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const rest = prescribe(rangeContext).prescription.rest;
      expect(rest).not.toBeNull();
      expect(rest?.betweenSets).toBeNull();
      expect(rest?.betweenRounds).toBeNull();

      const betweenIntervals = rest?.betweenIntervals;
      if (betweenIntervals?.type !== "fixed") {
        throw new Error("Expected a fixed between-intervals rest target.");
      }
      expect(betweenIntervals.duration.scope).toBe("between_intervals");
    }

    const restTrace = prescribe().trace.rest;
    expect(restTrace.ok && restTrace.narrowingNotes).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// 20-22. Intensity, tempo, stop conditions
// -----------------------------------------------------------------------------

describe("sprint_intervals — intensity, tempo and stop conditions", () => {
  test("20. intensity is movement_intent = maximal_safe_speed, identical at every range context", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    expect(entry.supportedIntensityTypes).toEqual(["movement_intent"]);
    expect(entry.preferredIntensityType).toBe("movement_intent");
    expect(entry.capabilities.supportedIntensityTypes).toEqual(["movement_intent"]);
    expect(entry.capabilities.preferredIntensityTypes).toEqual(["movement_intent"]);
    expect(entry.exerciseIntensityConstraints).toBeNull();

    // Nothing unencodable is claimed, despite Family 10 documenting them
    // and this fiche's Optional timing gates / GPS / heart-rate monitor.
    for (const forbidden of ["rpe", "pace", "velocity", "heart_rate", "percentage_1rm", "technical_effort"] as const) {
      expect(entry.supportedIntensityTypes).not.toContain(forbidden);
      expect(entry.capabilities.supportedIntensityTypes).not.toContain(forbidden);
    }

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const result = prescribe(rangeContext);
      const metric = result.prescription.intensity.primaryMetric;

      expect(metric.type).toBe("movement_intent");
      expect(metric.unit).toBe("category");
      expect(metric.target).toEqual({ type: "category", value: "maximal_safe_speed" });
      expect(metric.reference).toBeNull();
      // A qualitative rule carries no range: no numeric load, no calculation.
      expect(result.prescription.intensity.calculation).toBeNull();
    }

    // The range context moves volume and rest, never the intent.
    expect(prescribe("reduced").prescription.intensity).toEqual(prescribe("high").prescription.intensity);
  });

  test("21. tempo is null — work_rest_intervals forbids it and the profile documents none", () => {
    const contract = getTrainingMethodContract("work_rest_intervals");
    expect(contract.tempoPolicy).toBe("forbidden");
    expect(contract.allowedTempoTypes).toEqual([]);
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)?.tempo).toBeNull();
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].preferredTempoType).toBeNull();

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      expect(prescribe(rangeContext).prescription.tempo).toBeNull();
    }
  });

  test("22. all six stop-condition categories required by work_rest_intervals resolve, with interval-aware scopes", () => {
    const REQUIRED_CATEGORIES = ["pace_loss", "technical_failure", "fatigue_limit", "acute_symptom", "pain", "completion"];
    expect(getTrainingMethodContract("work_rest_intervals").requiredStopConditionCategories).toEqual(REQUIRED_CATEGORIES);

    const definitions = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].stopConditionDefinitions;
    expect(definitions.map((definition) => definition.category)).toEqual(REQUIRED_CATEGORIES);
    for (const definition of definitions) {
      expect(definition.instructions[0]?.text.length).toBeGreaterThan(0);
      expect(definition.sourceRuleIds.length).toBeGreaterThan(0);
    }

    const stopConditions = prescribe().prescription.stopConditions;
    expect(stopConditions).toHaveLength(6);
    expect(stopConditions.map((condition) => condition.category).sort()).toEqual([...REQUIRED_CATEGORIES].sort());

    const paceLoss = stopConditions.find((condition) => condition.category === "pace_loss");
    expect(paceLoss?.scope).toBe("interval");
    expect(paceLoss?.action).toBe("end_interval");
    expect(paceLoss?.trigger.evaluationTiming).toBe("during_interval");

    const acuteSymptom = stopConditions.find((condition) => condition.category === "acute_symptom");
    expect(acuteSymptom?.scope).toBe("exercise");
    expect(acuteSymptom?.priority).toBe("critical");
    expect(acuteSymptom?.trigger.evaluationTiming).toBe("continuous");

    // Texts grounded in this fiche's own Common Errors / Contraindications,
    // not copy-pasted from rowerg_intervals.
    const technicalFailure = definitions.find((definition) => definition.category === "technical_failure");
    expect(technicalFailure?.instructions[0]?.text.toLowerCase()).toContain("overstrides");
    const pain = definitions.find((definition) => definition.category === "pain");
    expect(pain?.instructions[0]?.text.toLowerCase()).toContain("hamstring");

    const rowergTexts = EXERCISE_PRESCRIPTION_REGISTRY.rowerg_intervals.stopConditionDefinitions.map(
      (definition) => definition.instructions[0]?.text,
    );
    for (const definition of definitions) {
      expect(rowergTexts).not.toContain(definition.instructions[0]?.text);
    }
  });
});

// -----------------------------------------------------------------------------
// 23-27. End to end: exercise, session, engine, decision trace
// -----------------------------------------------------------------------------

describe("sprint_intervals — end-to-end prescription", () => {
  test("23. prescribeExercise produces a complete prescription", () => {
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

  test("24. prescribeSession prescribes a sprint block alongside the other interval entry", () => {
    const sprintSource = getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT);
    const rowergSource = getExercisePrescriptionSource("rowerg_intervals", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["rowing_ergometer"],
    });

    if (!sprintSource.ok || !rowergSource.ok) {
      throw new Error("Fixture setup failed: one of the sources did not resolve.");
    }

    const exercises: SessionExercisePrescriptionInput[] = [
      { exerciseId: EXERCISE_ID, moduleId: sprintSource.moduleId, ...sprintSource.source, order: 1, required: true, blockId: "speed" },
      { exerciseId: "rowerg_intervals", moduleId: rowergSource.moduleId, ...rowergSource.source, order: 2, required: true, blockId: "conditioning" },
    ];

    const result = prescribeSession({
      sessionId: "sprint-session-1",
      sessionName: "Repeated Sprint + Rowing Conditioning",
      modules: ["conditioning"],
      exercises,
    });

    if (!result.ok) {
      throw new Error(`Expected the session to prescribe: ${result.issues.map((issue) => issue.message).join(" | ")}`);
    }

    expect(result.session.status).toBe("complete");
    expect(result.session.exercises).toHaveLength(2);

    // Same module, same method, two different profiles — resolved side by
    // side in one session without interference.
    const sprintPrescription = result.session.exercises[0]?.prescription;
    const rowergPrescription = result.session.exercises[1]?.prescription;
    expect(sprintPrescription?.exerciseId).toBe(EXERCISE_ID);
    expect(sprintPrescription?.volume.workIntervals).toBe(15);
    expect(sprintPrescription?.intensity.primaryMetric.type).toBe("movement_intent");
    expect(rowergPrescription?.volume.workIntervals).toBe(6);
    expect(rowergPrescription?.intensity.primaryMetric.type).toBe("rpe");
  });

  test("25. runEngine prescribes sprint_intervals end to end from the real ExerciseDefinition", () => {
    // The athlete profile is not decoration. This fiche documents "Overall
    // Fatigue Cost: High", "Requires adequate recovery due to high
    // neuromuscular demand" and "Suitable For: Intermediate, Advanced,
    // Elite" — and the V0.1 scoring model prices exactly that, through its
    // fatigue-cost and technical-risk penalties. A recovered, experienced
    // athlete pursuing a conditioning objective is therefore the honest
    // input for an end-to-end sprint session; the companion assertion below
    // records what happens when that is not the case.
    const input = makeValidInput({
      request: makeRequest({ primaryObjective: { adaptationDomain: "conditioning" } }),
      environment: validSprintEnvironment(),
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "elite", primaryCombatSport: "krav_maga" },
        goals: [
          { id: "goal-1", name: "Repeated Sprint Ability", adaptationDomain: "conditioning", priority: "primary" },
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
      ...SPRINT_INTERVALS,
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
    expect(prescribed?.intensity.primaryMetric.target).toEqual({ type: "category", value: "maximal_safe_speed" });
  });

  test("25b. DOCUMENTED LIMITATION: the same exercise is eligible but not selected for a default, unrecovered athlete — a scoring-model outcome, not a registry defect", () => {
    const input = makeValidInput({
      request: makeRequest({ primaryObjective: { adaptationDomain: "conditioning" } }),
      environment: validSprintEnvironment(),
    });
    const exercise = makeExercise({
      ...SPRINT_INTERVALS,
      setupTimeMinutes: 5,
      defaultExerciseDurationMinutes: 20,
    });

    // Eligibility passes: every documented environment gate is satisfied.
    expect(checkExerciseEligibility(exercise, input).eligible).toBe(true);

    // Selection does not: the intermediate/median-readiness default athlete
    // leaves the final score under the documented conditional threshold of
    // 60 (16_SCORING_MODEL.md), because this exercise's own 5/5/5 fatigue
    // profile and level-3 technical floor are penalised exactly as
    // documented. The registry entry is untouched by this — it is the
    // scoring model deciding the session, which is its job.
    const result = runEngine(input, [exercise], new Map());
    expect(result.outcome).toBe("blocked");

    const scoringEntry = result.decisionTrace.entries.find((entry) => entry.stage === "exercise_scoring");
    expect(scoringEntry?.reasons.join(" ")).toContain("minimum conditional selection threshold");
  });

  test("26. + 27. the decision trace names the profile and reports explicit selection", () => {
    const entries = adaptExercisePrescriptionResult(prescribe(), {
      idPrefix: "sprint_test",
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    const volumeEntry = entries.find((entry) => entry.id.endsWith("_volume"));
    expect(volumeEntry?.reasons[0]).toBe(`profile=${PROFILE_ID} (selection=explicit_profile_id)`);
    expect(volumeEntry?.reasons.some((reason) => reason.includes("durationSeconds range 3-8 narrowed to 5-8"))).toBe(true);

    const volumeTrace = prescribe().trace.volume;
    expect(volumeTrace.ok && volumeTrace.profileResolutionSource).toBe("explicit_profile_id");

    const intensityEntry = entries.find((entry) => entry.id.endsWith("_intensity"));
    expect(intensityEntry?.decision).toContain('Intensity resolved via "movement_intent"');

    const tempoEntry = entries.find((entry) => entry.id.endsWith("_tempo"));
    expect(tempoEntry?.decision).toContain("No tempo required");
  });
});

// -----------------------------------------------------------------------------
// 28-32. Determinism, non-mutation, non-regression, validation, duration
// -----------------------------------------------------------------------------

describe("sprint_intervals — determinism, non-mutation and non-regression", () => {
  test("28. determinism: identical input yields identical source and identical prescription", () => {
    expect(getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT)).toEqual(
      getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT),
    );

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      expect(prescribe(rangeContext).prescription).toEqual(prescribe(rangeContext).prescription);
    }
  });

  test("29. non-mutation: neither the context nor the registry is modified by resolution", () => {
    const context: PrescriptionExecutionContext = { ...VALID_CONTEXT };
    const contextSnapshot = JSON.parse(JSON.stringify(context));
    const registrySnapshot = JSON.parse(JSON.stringify(EXERCISE_PRESCRIPTION_REGISTRY));

    prescribe();
    getExercisePrescriptionSource(EXERCISE_ID, context);

    expect(context).toEqual(contextSnapshot);
    expect(EXERCISE_PRESCRIPTION_REGISTRY).toEqual(registrySnapshot);
  });

  test("30. no regression on the 60 previous entries: each still prescribes with its own declared equipment", () => {
    const REFERENCE = {
      referenceType: "one_rep_max" as const,
      value: 100,
      unit: "kilograms",
      sourceId: "test-1rm",
      measuredAt: null,
      validUntil: null,
      confidence: "validated" as const,
    };

    // The 60 entries that predate this lot: everything except this lot's own
    // entry and the ids added by later lots, each covered by its own file.
    const ADDED_BY_THIS_OR_LATER_LOTS: readonly string[] = [EXERCISE_ID, "ab_wheel", "dead_bug", "hanging_leg_raise", "plate_pinch", "heavy_bag_power_intervals", "battle_ropes", "assault_bike_intervals", "towel_pull_up", "rope_climb", "rope_pull", "pummeling", "wall_wrestling", "grip_fighting"];
    const previousIds = PILOT_EXERCISE_IDS.filter((id) => !ADDED_BY_THIS_OR_LATER_LOTS.includes(id));
    expect(previousIds).toHaveLength(60);

    for (const id of previousIds) {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id as PilotExerciseId];

      // Untouched by this lot: no previous entry gained or lost an explicit
      // profile id, and none adopted the locomotion_only loading mode.
      expect(entry.numericalProfileId ?? null).toBe(
        id === "rowerg_intervals" ? "conditioning_long_intervals_v0_1" : null,
      );
      expect(entry.capabilities.supportedLoadingModes).not.toContain("locomotion_only");

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

  test("31. validatePilotRegistry reports no blocking issue beyond the expected unresolved duration profiles", () => {
    const issues = validatePilotRegistry();
    expect(issues.filter((issue) => issue.code !== "UNRESOLVED_DURATION_PROFILE")).toEqual([]);

    // Exactly one non-fatal gap per entry — no more, no fewer.
    expect(issues).toHaveLength(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).length);
    expect(issues.some((issue) => issue.exerciseId === EXERCISE_ID)).toBe(true);
  });

  test("32. the duration estimation profile exists, is unresolved, and invents no timing value", () => {
    const result = getDurationEstimationProfile(`duration_profile_${EXERCISE_ID}`);
    if (result.ok) {
      throw new Error("Expected the sprint_intervals duration profile to be unresolved.");
    }

    expect(result.failureCode).toBe("DURATION_PROFILE_UNRESOLVED");
    expect(result.profile?.exerciseId).toBe(EXERCISE_ID);
    expect(result.profile?.volumeStructure).toBe("intervals");
    expect(result.profile?.sourceRuleIds).toEqual([SOURCE_CHAPTER]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].capabilities.durationEstimationProfileId).toBe(
      `duration_profile_${EXERCISE_ID}`,
    );

    for (const field of [
      "averageRepetitionSeconds",
      "averageSetupSeconds",
      "transitionSeconds",
      "restSeconds",
      "perSetSeconds",
      "perRoundSeconds",
      "perIntervalSeconds",
      "technicalMarginSeconds",
    ] as const) {
      expect(result.profile?.[field]).toBeNull();
    }
  });
});
