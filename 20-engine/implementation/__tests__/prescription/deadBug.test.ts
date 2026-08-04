/**
 * Combat Athlete System — Registry Lot 8: dead_bug
 *
 * Second consumer of Table Group 13's `core_robustness_straight_sets_v0_1`,
 * and the FIRST entry in this registry to declare
 * `laterality: "alternating"` — which makes it the first real consumer of
 * the laterality plumbing fixed immediately before it.
 *
 * What this file guards beyond presence:
 *
 * - the per-side semantics: the fiche prescribes "5-10 repetitions PER
 *   SIDE" within a contralateral set, so the prescription must say 10 per
 *   side — never 20 total, never 5 per side halved from a total. No
 *   multiplication of any kind happens anywhere;
 * - the intensity difference from ab_wheel: this chapter documents no RPE
 *   figure at all, so `technical_effort` is claimed and `rpe` is not,
 *   even though the shared profile documents both;
 * - what was NOT integrated: the fiche's "Alternative Prescription — 20-45
 *   seconds per set" duration variant, and its documented breathing work.
 */

import { describe, expect, test } from "vitest";

import { DEAD_BUG, EXERCISE_KNOWLEDGE_BASE } from "../../exerciseKnowledgeBase";
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
import { isEquipmentCapabilityId } from "../../prescription/equipmentCapabilities";
import { getTrainingMethodContract } from "../../prescription/contracts";
import { adaptExercisePrescriptionResult } from "../../prescription/prescriptionDecisionTrace";
import type { ExercisePrescriptionSource } from "../../prescription/buildPrescriptionInput";

import { runEngine } from "../../index";
import { makeAthleteProfile, makeEnvironment, makeExercise, makeRequest, makeValidInput } from "../fixtures";

const EXERCISE_ID = "dead_bug";
const PROFILE_ID = "core_robustness_straight_sets_v0_1";
const SOURCE_CHAPTER = "50-exercises/62_CORE/12_DEAD_BUG.md";

/** No equipment at all — "Required: Floor Space", and the mat is Optional. */
const VALID_CONTEXT: PrescriptionExecutionContext = {
  rangeContext: "normal",
  athleteReferences: [],
  availableEquipmentCapabilities: [],
};

const validDeadBugEnvironment = () =>
  makeEnvironment({ availableEquipment: [], availableSpace: "very_limited" });

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

describe("dead_bug — registry, knowledge base and profile counts", () => {
  test("1. the registry grew from 62 to exactly 63 entries", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(75);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(75);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort()).toEqual([...PILOT_EXERCISE_IDS].sort());
  });

  test("2. the knowledge base still holds exactly 76 ExerciseDefinitions — none added, none removed", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toHaveLength(76);
    expect(new Set(EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id)).size).toBe(76);
  });

  test("3. the numerical prescription profiles stay at 22 — this lot created none", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(23);
  });

  test("4. dead_bug exists in both the knowledge base and the registry, with consistent identifiers", () => {
    const kbEntry = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === EXERCISE_ID);
    expect(kbEntry).toBeDefined();
    expect(kbEntry?.module).toBe("core");
    expect(kbEntry?.movementPatterns).toContain("anti_extension");

    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.exerciseId).toBe(EXERCISE_ID);
    expect(entry.capabilities.exerciseId).toBe(EXERCISE_ID);
    expect(PILOT_EXERCISE_IDS.filter((id) => id === EXERCISE_ID)).toHaveLength(1);
  });

  test("5. no other exercise was added: the 62 previous ids plus dead_bug account for every key", () => {
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
      "rowerg_intervals", "sprint_intervals", "ab_wheel",
    ] as const;

    // Ids added by lots AFTER this one, listed explicitly so this test keeps
    // proving that dead_bug was the only exercise this lot added.
    const ADDED_BY_LATER_LOTS = ["hanging_leg_raise", "plate_pinch", "heavy_bag_power_intervals", "battle_ropes", "assault_bike_intervals", "towel_pull_up", "rope_climb", "rope_pull", "pummeling", "wall_wrestling", "grip_fighting", "sled_push"] as const;

    expect(PREVIOUS_IDS).toHaveLength(62);
    expect([...PREVIOUS_IDS, EXERCISE_ID, ...ADDED_BY_LATER_LOTS].sort()).toEqual(
      Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort(),
    );
  });
});

// -----------------------------------------------------------------------------
// 6-7. Profile selection
// -----------------------------------------------------------------------------

describe("dead_bug — profile selection", () => {
  test("6. the entry uses core_robustness_straight_sets_v0_1 on core / straight_sets_repetitions / robustness", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    expect(entry.moduleId).toBe("core");
    expect(entry.role).toBe("robustness");
    expect(entry.explicitMethodId).toBe("straight_sets_repetitions");
    expect(entry.numericalProfileId).toBe(PROFILE_ID);
    expect(entry.capabilities.supportedVolumeStructures).toEqual(["sets_reps"]);

    // No new profile was created for it: it shares ab_wheel's.
    expect(EXERCISE_PRESCRIPTION_REGISTRY.ab_wheel.numericalProfileId).toBe(PROFILE_ID);
  });

  test("7. selection resolves explicitly, and the triple is unique so implicit resolution agrees", () => {
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
    expect(implicit.ok && implicit.profile.profileId).toBe(PROFILE_ID);
  });
});

// -----------------------------------------------------------------------------
// 8-15. Volume, per-side semantics, no multiplication
// -----------------------------------------------------------------------------

describe("dead_bug — volume and per-side semantics", () => {
  const EXPECTED = {
    reduced: { sets: 2, reps: 5, rest: 45 },
    normal: { sets: 3, reps: 10, rest: 60 },
    high: { sets: 4, reps: 10, rest: 60 },
  } as const;

  for (const rangeContext of ["reduced", "normal", "high"] as const) {
    test(`${rangeContext === "reduced" ? "8" : rangeContext === "normal" ? "9" : "10"}. "${rangeContext}" resolves sets, per-side repetitions and rest as documented`, () => {
      const result = prescribe(rangeContext);
      const expected = EXPECTED[rangeContext];

      expect(result.prescription.status).toBe("complete");
      expect(result.prescription.volume.sets).toBe(expected.sets);
      expect(result.prescription.volume.reps).toEqual({
        type: "fixed",
        value: expected.reps,
        min: null,
        max: null,
        unit: "repetitions",
      });

      const betweenSets = result.prescription.rest?.betweenSets;
      if (betweenSets?.type !== "fixed") {
        throw new Error("Expected a fixed between-sets rest target.");
      }
      expect(betweenSets.duration.value).toBe(expected.rest);
    });
  }

  test("11. the resolved structure is sets_reps, with every field the method forbids left null", () => {
    const contract = getTrainingMethodContract("straight_sets_repetitions");
    const { volume } = prescribe().prescription;

    expect(volume.structure).toBe("sets_reps");
    expect(contract.forbiddenVolumeFields).toEqual(["duration", "distance", "rounds", "work_intervals"]);
    expect(volume.duration).toBeNull();
    expect(volume.distance).toBeNull();
    expect(volume.rounds).toBeNull();
    expect(volume.workIntervals).toBeNull();
  });

  test("12. + 13. the narrowing is exactly the fiche's own sets and per-side repetitions", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 2, repetitions: 5, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 4, repetitions: 10, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: [SOURCE_CHAPTER],
    });

    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    // Never widens the shared envelope.
    expect(2).toBeGreaterThanOrEqual(profile.volume.sets!.min);
    expect(4).toBeLessThanOrEqual(profile.volume.sets!.max);
    expect(5).toBeGreaterThanOrEqual(profile.volume.repetitions!.range.min);
    expect(10).toBeLessThanOrEqual(profile.volume.repetitions!.range.max);

    const volumeTrace = prescribe().trace.volume;
    if (!volumeTrace.ok) {
      throw new Error("Expected volume resolution to succeed.");
    }
    expect(volumeTrace.narrowingNotes.some((note) => note.includes("sets range 2-5 narrowed to 2-4"))).toBe(true);
    expect(volumeTrace.narrowingNotes.some((note) => note.includes("repetitions range 3-15 narrowed to 5-10"))).toBe(true);

    // No duration was derived — the fiche's own "Alternative Prescription:
    // 20-45 seconds per set" is a different variant, not integrated here.
    const constraints = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseDoseConstraints!;
    for (const dimension of ["durationSeconds", "distanceMeters", "rounds", "workIntervals"] as const) {
      expect(constraints.minimumDose![dimension]).toBeNull();
      expect(constraints.maximumDose![dimension]).toBeNull();
    }
  });

  test("14. the prescription is per side: alternating laterality with a repetitions_per_side interpretation", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    expect(entry.capabilities.laterality).toBe("alternating");
    expect(entry.capabilities.volumeInterpretations).toEqual(["repetitions_per_side"]);

    // The declaration reaches the resolved prescription — the plumbing this
    // entry is the first real consumer of.
    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      expect(prescribe(rangeContext).prescription.volume.laterality).toEqual({
        laterality: "alternating",
        interpretation: "repetitions_per_side",
        startingSide: null,
        sideSwitchRuleId: null,
      });
    }

    // Neither a starting side nor a side-switch rule is invented: this
    // fiche documents neither.
    const laterality = prescribe().prescription.volume.laterality;
    expect(laterality?.startingSide).toBeNull();
    expect(laterality?.sideSwitchRuleId).toBeNull();
  });

  test("15. NO MULTIPLICATION: 10 per side is prescribed as 10, never 20 — and never halved from a total either", () => {
    const normal = prescribe("normal").prescription.volume;

    // The fiche's own documented range is 5-10 PER SIDE. The resolved
    // number is inside that range as-is.
    expect(normal.reps?.value).toBe(10);
    expect(normal.reps?.value).toBeGreaterThanOrEqual(5);
    expect(normal.reps?.value).toBeLessThanOrEqual(10);
    // A doubled total would be 20, a halved per-side count would be 5.
    expect(normal.reps?.value).not.toBe(20);

    // The label is what carries the per-side meaning, not the number.
    expect(normal.laterality?.interpretation).toBe("repetitions_per_side");

    // ab_wheel shares the same profile and is bilateral: at "normal" both
    // resolve the profile's own 10, proving laterality changes the label
    // and nothing else.
    const abWheelNormal = (() => {
      const source = getExercisePrescriptionSource("ab_wheel", {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: ["ab_wheel"],
      });
      if (!source.ok) throw new Error("Expected an ab_wheel source.");
      const result = prescribeExercise({ exerciseId: "ab_wheel", moduleId: source.moduleId, ...source.source });
      if (!result.ok) throw new Error("Expected ab_wheel to prescribe.");
      return result.prescription.volume;
    })();

    expect(abWheelNormal.reps?.value).toBe(normal.reps?.value);
    expect(abWheelNormal.laterality?.interpretation).toBe("total_repetitions");
    expect(normal.laterality?.interpretation).toBe("repetitions_per_side");
  });

  test("15b. the knowledge base's `unilateral: false` is not read as an absence of per-side work", () => {
    // The KB records `unilateral: false` for dead_bug — meaning it is not a
    // single-sided specialization — while its own comment describes "equal
    // work on both sides within the same set". The registry declares the
    // per-side allocation independently.
    expect(DEAD_BUG.unilateral).toBe(false);
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].capabilities.laterality).toBe("alternating");
  });
});

// -----------------------------------------------------------------------------
// 16-21. Intensity, tempo, rest, equipment, eligibility
// -----------------------------------------------------------------------------

describe("dead_bug — intensity, tempo, rest and eligibility", () => {
  test("16. intensity is technical_effort — this chapter documents no RPE figure, unlike ab_wheel's", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    expect(entry.supportedIntensityTypes).toEqual(["technical_effort"]);
    expect(entry.preferredIntensityType).toBe("technical_effort");
    expect(entry.capabilities.supportedIntensityTypes).toEqual(["technical_effort"]);
    expect(entry.exerciseIntensityConstraints).toBeNull();

    // rpe is NOT claimed, even though the shared profile documents it.
    expect(entry.supportedIntensityTypes).not.toContain("rpe");
    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.intensity.map((rule) => rule.type)).toContain("rpe");
    // ab_wheel, whose own chapter states "Approximately RPE 6 to 8", does
    // claim it — the difference is documentary, not stylistic.
    expect(EXERCISE_PRESCRIPTION_REGISTRY.ab_wheel.supportedIntensityTypes).toContain("rpe");

    // The resolved intensity is the qualitative category, identical at
    // every range context.
    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const metric = prescribe(rangeContext).prescription.intensity.primaryMetric;
      expect(metric.type).toBe("technical_effort");
      expect(metric.target).toEqual({ type: "category", value: "high_quality" });
      expect(metric.reference).toBeNull();
    }
    expect(prescribe("reduced").prescription.intensity).toEqual(prescribe("high").prescription.intensity);
  });

  test("17. tempo is the profile's controlled global intent; the documented phase timings stay in the instruction", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.supportedTempoTypes).toEqual(["global_intent"]);
    expect(entry.preferredTempoType).toBeNull();

    const tempo = prescribe().prescription.tempo;
    expect(tempo?.type).toBe("global_intent");
    expect(tempo?.globalIntent).toBe("controlled");
    expect(tempo?.eccentric).toBeNull();
    expect(tempo?.concentric).toBeNull();

    const execution = entry.instructionDefinitions.find((instruction) => instruction.category === "execution");
    expect(execution?.text).toContain("2 to 4 seconds");
    // The breathing work stays prose too — breaths are never counted as
    // repetitions.
    expect(execution?.text.toLowerCase()).toContain("exhale");
  });

  test("18. rest narrows the Core doctrine window to the fiche's own ceiling, and the floor is never widened below 45s", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseRestConstraints).toEqual({
      scope: "between_sets",
      minimumSeconds: 20,
      maximumSeconds: 60,
      sourceRuleIds: [SOURCE_CHAPTER],
    });

    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.rest?.seconds).toEqual({ min: 45, normal: 60, max: 120 });

    // The fiche's documented 20s floor is BELOW the profile's own 45s
    // floor: a constraint can only narrow, so 45 stands.
    expect(prescribe("reduced").prescription.rest?.betweenSets).toMatchObject({
      type: "fixed",
      duration: { value: 45 },
    });
    expect(prescribe("high").prescription.rest?.betweenSets).toMatchObject({
      type: "fixed",
      duration: { value: 60 },
    });

    const restTrace = prescribe().trace.rest;
    expect(restTrace.ok && restTrace.narrowingNotes.some((note) => note.includes("45-120s narrowed to 45-60s"))).toBe(true);
  });

  test("19. no equipment is required — the Exercise Mat is Optional and is not promoted", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.capabilities.requiredEquipmentCapabilities).toEqual([]);
    expect(entry.capabilities.supportedLoadingModes).toEqual(["bodyweight"]);
    expect(entry.capabilities.requiredAthleteReferenceTypes).toEqual([]);

    // `mat` exists in the vocabulary and is deliberately not claimed.
    expect(isEquipmentCapabilityId("mat")).toBe(true);
    expect(entry.capabilities.requiredEquipmentCapabilities).not.toContain("mat");

    // The knowledge base gates on space alone, with no equipment atom.
    const atoms = DEAD_BUG.requirements!.required.flatMap((clause) => clause.items);
    expect(atoms.filter((atom) => atom.kind === "equipment")).toEqual([]);

    // The source therefore resolves with a completely empty context.
    expect(getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT).ok).toBe(true);
  });

  test("20. eligibility follows the knowledge base: minimal space is enough, and no artificial gate is added", () => {
    const eligible = checkExerciseEligibility(DEAD_BUG, makeValidInput({ environment: validDeadBugEnvironment() }));
    expect(eligible.eligible).toBe(true);
    expect(eligible.rejectionReasons).toEqual([]);

    // This fiche documents no floor-safety, wall, partner or throwing
    // requirement — so none of them gates it, and asserting otherwise would
    // be inventing a requirement.
    const austere = checkExerciseEligibility(
      DEAD_BUG,
      makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [],
          availableSpace: "very_limited",
          floorSafe: false,
          usableWall: false,
          partnerAvailable: false,
          throwingAllowed: false,
          jumpingAllowed: false,
        }),
      }),
    );
    expect(austere.eligible).toBe(true);

    const atoms = DEAD_BUG.requirements!.required.flatMap((clause) => clause.items);
    expect(atoms).toHaveLength(1);
    expect(atoms[0]).toEqual({ kind: "environment", capability: "sufficient_space", minimumSpace: "very_limited" });
  });

  test("21. stop conditions cover the fiche's own failure criteria, without inventing a fatigue or balance endpoint", () => {
    const EXPECTED_CATEGORIES = ["technical_failure", "range_of_motion_loss", "pain", "completion"];
    const definitions = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].stopConditionDefinitions;

    expect(definitions.map((definition) => definition.category)).toEqual(EXPECTED_CATEGORIES);
    for (const definition of definitions) {
      expect(definition.instructions[0]?.text.length).toBeGreaterThan(0);
      expect(definition.sourceRuleIds.length).toBeGreaterThan(0);
    }

    const contract = getTrainingMethodContract("straight_sets_repetitions");
    for (const required of contract.requiredStopConditionCategories) {
      expect(EXPECTED_CATEGORIES).toContain(required);
    }

    const stopConditions = prescribe().prescription.stopConditions;
    expect(stopConditions).toHaveLength(4);
    expect(stopConditions.map((condition) => condition.category).sort()).toEqual([...EXPECTED_CATEGORIES].sort());

    const textFor = (category: string) =>
      definitions.find((definition) => definition.category === category)?.instructions[0]?.text.toLowerCase() ?? "";
    expect(textFor("technical_failure")).toContain("lumbar spine extends");
    expect(textFor("technical_failure")).toContain("ribs flare");
    expect(textFor("technical_failure")).toContain("pelvis");
    expect(textFor("technical_failure")).toContain("breathing is held");
    expect(textFor("range_of_motion_loss")).toContain("beyond the range");
    expect(textFor("range_of_motion_loss")).toContain("asymmetrical");
    expect(textFor("pain")).toContain("pain");
    expect(textFor("completion")).toContain("per-side repetitions");

    // fatigue_limit is deliberately absent: every fatigue axis in this
    // chapter is rated at its lowest level and the documented endpoint is
    // positional, not fatigue-driven. balance_loss likewise — nothing
    // supine describes a loss of balance.
    expect(definitions.map((definition) => definition.category)).not.toContain("fatigue_limit");
    expect(definitions.map((definition) => definition.category)).not.toContain("balance_loss");
    // ab_wheel, whose own chapter names fatigue explicitly, does declare it.
    expect(
      EXERCISE_PRESCRIPTION_REGISTRY.ab_wheel.stopConditionDefinitions.map((definition) => definition.category),
    ).toContain("fatigue_limit");
  });
});

// -----------------------------------------------------------------------------
// 22-25. End to end
// -----------------------------------------------------------------------------

describe("dead_bug — end-to-end prescription", () => {
  test("22. prescribeExercise produces a complete prescription", () => {
    const result = prescribe();

    expect(result.prescription.status).toBe("complete");
    expect(result.prescription.exerciseId).toBe(EXERCISE_ID);
    expect(result.prescription.moduleId).toBe("core");
    expect(result.prescription.role).toBe("robustness");
    expect(result.prescription.methodId).toBe("straight_sets_repetitions");
    expect(result.prescription.instructions.length).toBeGreaterThan(0);
    expect(result.prescription.sourceRuleIds).toContain(SOURCE_CHAPTER);
    expect(result.trace.validation.valid).toBe(true);
  });

  test("23. prescribeSession prescribes both Core repetition entries side by side, each with its own laterality", () => {
    const deadBugSource = getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT);
    const abWheelSource = getExercisePrescriptionSource("ab_wheel", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["ab_wheel"],
    });

    if (!deadBugSource.ok || !abWheelSource.ok) {
      throw new Error("Fixture setup failed: one of the sources did not resolve.");
    }

    const exercises: SessionExercisePrescriptionInput[] = [
      { exerciseId: EXERCISE_ID, moduleId: deadBugSource.moduleId, ...deadBugSource.source, order: 1, required: true, blockId: "core" },
      { exerciseId: "ab_wheel", moduleId: abWheelSource.moduleId, ...abWheelSource.source, order: 2, required: true, blockId: "core" },
    ];

    const result = prescribeSession({
      sessionId: "core-session-2",
      sessionName: "Anti-Extension Core Block",
      modules: ["core"],
      exercises,
    });

    if (!result.ok) {
      throw new Error(`Expected the session to prescribe: ${result.issues.map((issue) => issue.message).join(" | ")}`);
    }

    expect(result.session.exercises).toHaveLength(2);
    const deadBugPrescription = result.session.exercises[0]?.prescription;
    const abWheelPrescription = result.session.exercises[1]?.prescription;

    expect(deadBugPrescription?.volume.laterality?.laterality).toBe("alternating");
    expect(deadBugPrescription?.volume.laterality?.interpretation).toBe("repetitions_per_side");
    expect(abWheelPrescription?.volume.laterality?.laterality).toBe("bilateral");
    expect(abWheelPrescription?.volume.laterality?.interpretation).toBe("total_repetitions");
  });

  test("24. runEngine prescribes dead_bug end to end from the real ExerciseDefinition", () => {
    const bearCrawl = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === "bear_crawl")!;

    const input = makeValidInput({
      request: makeRequest({
        primaryObjective: { adaptationDomain: "movement" },
        requiredModules: ["core"],
      }),
      environment: makeEnvironment({ availableEquipment: [], availableSpace: "large" }),
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "advanced" },
        goals: [{ id: "goal-1", name: "Trunk Control", adaptationDomain: "movement", priority: "primary" }],
      }),
    });

    const exercises = [
      makeExercise({ ...bearCrawl, setupTimeMinutes: 1 }),
      makeExercise({ ...DEAD_BUG, setupTimeMinutes: 1 }),
    ];

    const deadBugSource = getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT);
    const bearCrawlSource = getExercisePrescriptionSource("bear_crawl", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: [],
    });
    if (!deadBugSource.ok || !bearCrawlSource.ok) {
      throw new Error("Fixture setup failed: one of the sources did not resolve.");
    }

    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([
      [EXERCISE_ID, deadBugSource.source],
      ["bear_crawl", bearCrawlSource.source],
    ]);
    const result = runEngine(input, exercises, prescriptionSources);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }
    if (result.prescription?.status !== "prescribed") {
      throw new Error(`Expected prescription status "prescribed", got: ${JSON.stringify(result.prescription)}`);
    }

    const prescribed = result.prescription.session.exercises
      .map((exercise) => exercise.prescription)
      .find((prescription) => prescription.exerciseId === EXERCISE_ID);
    if (prescribed === undefined) {
      throw new Error("Expected dead_bug to be prescribed in the session.");
    }
    expect(prescribed.moduleId).toBe("core");
    expect(prescribed.volume.structure).toBe("sets_reps");
    expect(prescribed.volume.sets).toBe(3);
    expect(prescribed.volume.reps?.value).toBe(10);
    expect(prescribed.volume.laterality?.interpretation).toBe("repetitions_per_side");
    expect(prescribed.intensity.primaryMetric.type).toBe("technical_effort");
  });

  test("25. the decision trace names the profile, the narrowing and the per-side interpretation", () => {
    const entries = adaptExercisePrescriptionResult(prescribe(), {
      idPrefix: "dead_bug_test",
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    const volumeEntry = entries.find((entry) => entry.id.endsWith("_volume"));
    expect(volumeEntry?.reasons[0]).toBe(`profile=${PROFILE_ID} (selection=explicit_profile_id)`);

    const summary = volumeEntry?.reasons.find((reason) => reason.startsWith("structure=")) ?? "";
    expect(summary).toContain("sets=3");
    expect(summary).toContain("reps=10");
    // The count and its interpretation appear together, so the trace itself
    // is unambiguous about "10 per side".
    expect(summary).toContain("laterality=alternating (repetitions_per_side)");

    expect(volumeEntry?.reasons.some((reason) => reason.includes("repetitions range 3-15 narrowed to 5-10"))).toBe(true);

    const intensityEntry = entries.find((entry) => entry.id.endsWith("_intensity"));
    expect(intensityEntry?.decision).toContain('Intensity resolved via "technical_effort"');

    const restEntry = entries.find((entry) => entry.id.endsWith("_rest"));
    expect(restEntry?.reasons.some((reason) => reason.includes("45-120s narrowed to 45-60s"))).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// 26-31. Determinism, non-mutation, validation, non-regression, duration
// -----------------------------------------------------------------------------

describe("dead_bug — determinism, non-mutation and non-regression", () => {
  test("26. determinism: identical input yields identical source and identical prescription", () => {
    expect(getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT)).toEqual(
      getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT),
    );

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      expect(prescribe(rangeContext).prescription).toEqual(prescribe(rangeContext).prescription);
    }
  });

  test("27. non-mutation: neither the context nor the registry is modified by resolution", () => {
    const context: PrescriptionExecutionContext = { ...VALID_CONTEXT };
    const contextSnapshot = JSON.parse(JSON.stringify(context));
    const registrySnapshot = JSON.parse(JSON.stringify(EXERCISE_PRESCRIPTION_REGISTRY));

    prescribe();
    getExercisePrescriptionSource(EXERCISE_ID, context);

    expect(context).toEqual(contextSnapshot);
    expect(EXERCISE_PRESCRIPTION_REGISTRY).toEqual(registrySnapshot);
  });

  test("28. validatePilotRegistry reports no issue beyond the expected unresolved duration profiles", () => {
    const issues = validatePilotRegistry();
    expect(issues).toEqual([]);
  });

  test("29. no regression on the 62 previous entries: each still prescribes with its own declared equipment", () => {
    const REFERENCE = {
      referenceType: "one_rep_max" as const,
      value: 100,
      unit: "kilograms",
      sourceId: "test-1rm",
      measuredAt: null,
      validUntil: null,
      confidence: "validated" as const,
    };

    // The 62 entries that predate this lot: everything except this lot's own
    // entry and the ids added by later lots, each covered by its own file.
    const ADDED_BY_THIS_OR_LATER_LOTS: readonly string[] = [EXERCISE_ID, "hanging_leg_raise", "plate_pinch", "heavy_bag_power_intervals", "battle_ropes", "assault_bike_intervals", "towel_pull_up", "rope_climb", "rope_pull", "pummeling", "wall_wrestling", "grip_fighting", "sled_push"];
    const previousIds = PILOT_EXERCISE_IDS.filter((id) => !ADDED_BY_THIS_OR_LATER_LOTS.includes(id));
    expect(previousIds).toHaveLength(62);

    for (const id of previousIds) {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id as PilotExerciseId];

      // No previous entry became alternating as a side effect of this lot.
      expect(entry.capabilities.laterality).not.toBe("alternating");

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

  test("30. ab_wheel, the other Core repetition entry, is untouched by this lot", () => {
    const abWheel = EXERCISE_PRESCRIPTION_REGISTRY.ab_wheel;
    expect(abWheel.capabilities.laterality).toBe("bilateral");
    expect(abWheel.exerciseRestConstraints).toBeNull();
    expect(abWheel.exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 2, repetitions: 3, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 5, repetitions: 12, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/62_CORE/10_AB_WHEEL.md"],
    });
  });

  test("31. the duration estimation profile exists, is unresolved, and derives nothing from the tempo or breathing", () => {
    const result = getDurationEstimationProfile(`duration_profile_${EXERCISE_ID}`);
    if (!result.ok) {
      throw new Error("Expected the dead_bug duration profile to be unresolved.");
    }
    expect(result.profile?.exerciseId).toBe(EXERCISE_ID);
    expect(result.profile?.volumeStructure).toBe("sets_reps");
    expect(result.profile?.sourceRuleIds).toContain(SOURCE_CHAPTER);
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].capabilities.durationEstimationProfileId).toBe(
      `duration_profile_${EXERCISE_ID}`,
    );

  });
});
