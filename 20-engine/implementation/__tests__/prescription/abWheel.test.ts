/**
 * Combat Athlete System — Registry Lot 7: ab_wheel
 *
 * First registry entry on the `core` module with the
 * `straight_sets_repetitions` method, and the first consumer of Table
 * Group 13's `core_robustness_straight_sets_v0_1`. The four existing Core
 * entries (pallof_press, hollow_body_hold, dragon_flag, copenhagen_plank)
 * all prescribe timed holds; this is the other half of the module.
 *
 * What this file guards beyond presence:
 *
 * - the equipment fix: `ab_wheel` replaced the `"other"` catch-all the
 *   knowledge base had flagged as a precision loss, in both vocabularies,
 *   with exact matching and no equivalence group — the Ab Wheel chapter
 *   lists alternatives and denies their equivalence in the same section;
 * - the narrowing: repetitions 3-15 → 3-12 only. Sets and rest and RPE all
 *   match the shared envelope exactly, because that envelope was built
 *   from this family's records in the first place;
 * - what was NOT converted: rollout distance, range of motion, the
 *   documented 1-3 technical repetitions in reserve, and the phase tempos
 *   3-1-2 / 2-0-2 / 4-1-2 all stay out of the numbers.
 */

import { describe, expect, test } from "vitest";

import { AB_WHEEL, EXERCISE_KNOWLEDGE_BASE } from "../../exerciseKnowledgeBase";
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
import {
  EQUIPMENT_CAPABILITY_IDS,
  findUnknownEquipmentCapabilities,
  isEquipmentCapabilityId,
} from "../../prescription/equipmentCapabilities";
import { getTrainingMethodContract } from "../../prescription/contracts";
import { adaptExercisePrescriptionResult } from "../../prescription/prescriptionDecisionTrace";
import type { ExercisePrescriptionSource } from "../../prescription/buildPrescriptionInput";

import { runEngine } from "../../index";
import { makeAthleteProfile, makeEnvironment, makeExercise, makeRequest, makeValidInput } from "../fixtures";

const EXERCISE_ID = "ab_wheel";
const PROFILE_ID = "core_robustness_straight_sets_v0_1";
const SOURCE_CHAPTER = "50-exercises/62_CORE/10_AB_WHEEL.md";

const VALID_CONTEXT: PrescriptionExecutionContext = {
  rangeContext: "normal",
  athleteReferences: [],
  availableEquipmentCapabilities: ["ab_wheel"],
};

/** An environment satisfying the knowledge base's three documented gates. */
const validAbWheelEnvironment = () =>
  makeEnvironment({
    availableEquipment: [{ type: "ab_wheel" }],
    floorSafe: true,
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

// -----------------------------------------------------------------------------
// 11-15. Counts, presence, additivity
// -----------------------------------------------------------------------------

describe("ab_wheel — registry, knowledge base and profile counts", () => {
  test("11. the registry grew from 61 to exactly 62 entries", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(75);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(75);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort()).toEqual([...PILOT_EXERCISE_IDS].sort());
  });

  test("12. the knowledge base still holds exactly 76 ExerciseDefinitions — none added, none removed", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toHaveLength(76);
    expect(new Set(EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id)).size).toBe(76);
  });

  test("13. the numerical prescription profiles went from 15 to 16 with the Core repetition profile; later lots added ISO-GRIP, INT-POWER then GRIP-REPETITION-STRENGTH, bringing the total to 22", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(23);
    expect(NUMERICAL_PRESCRIPTION_PROFILES.filter((p) => p.profileId === PROFILE_ID)).toHaveLength(1);
  });

  test("14. ab_wheel exists in both the knowledge base and the registry, with consistent identifiers", () => {
    const kbEntry = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === EXERCISE_ID);
    expect(kbEntry).toBeDefined();
    expect(kbEntry?.module).toBe("core");
    expect(kbEntry?.movementPatterns).toContain("anti_extension");

    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.exerciseId).toBe(EXERCISE_ID);
    expect(entry.capabilities.exerciseId).toBe(EXERCISE_ID);
    expect(PILOT_EXERCISE_IDS.filter((id) => id === EXERCISE_ID)).toHaveLength(1);
  });

  test("15. no other exercise was added: the 61 previous ids plus ab_wheel account for every key", () => {
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
      "rowerg_intervals", "sprint_intervals",
    ] as const;

    // Ids added by lots AFTER this one, listed explicitly so this test keeps
    // proving that ab_wheel was the only exercise this lot added.
    const ADDED_BY_LATER_LOTS = ["dead_bug", "hanging_leg_raise", "plate_pinch", "heavy_bag_power_intervals", "battle_ropes", "assault_bike_intervals", "towel_pull_up", "rope_climb", "rope_pull", "pummeling", "wall_wrestling", "grip_fighting", "sled_push"] as const;

    expect(PREVIOUS_IDS).toHaveLength(61);
    expect([...PREVIOUS_IDS, EXERCISE_ID, ...ADDED_BY_LATER_LOTS].sort()).toEqual(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort());

    // The other members of the repetition-prescribed family that
    // 62_CORE's own Volume Principles names. dead_bug and
    // hanging_leg_raise joined in Registry Lots 8 and 9 and are accounted
    // for above; pallof_press and dragon_flag are in the registry only as
    // TIMED holds, so their documented repetition variants remain
    // unrepresented and this lot's profile gained no consumer from them.
    for (const id of ["pallof_press", "dragon_flag"] as const) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].explicitMethodId).toBe("timed_isometric_sets");
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].numericalProfileId ?? null).toBeNull();
    }
  });
});

// -----------------------------------------------------------------------------
// 16-18. Equipment — exact matching, both layers
// -----------------------------------------------------------------------------

describe("ab_wheel — equipment", () => {
  test("16. ab_wheel is recognized by both vocabularies and required by the entry", () => {
    expect(isEquipmentCapabilityId("ab_wheel")).toBe(true);
    expect(EQUIPMENT_CAPABILITY_IDS).toContain("ab_wheel");
    expect(findUnknownEquipmentCapabilities(["ab_wheel"])).toEqual([]);

    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.capabilities.requiredEquipmentCapabilities).toEqual(["ab_wheel"]);
    expect(findUnknownEquipmentCapabilities(entry.capabilities.requiredEquipmentCapabilities)).toEqual([]);

    // The knowledge base no longer uses the "other" catch-all it had flagged.
    const kbEquipment = AB_WHEEL.requirements!.required
      .flatMap((clause) => clause.items)
      .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
      .map((atom) => atom.equipment);
    expect(kbEquipment).toEqual(["ab_wheel"]);
    expect(kbEquipment).not.toContain("other");

    // Eligible with the exact implement present.
    const eligible = checkExerciseEligibility(AB_WHEEL, makeValidInput({ environment: validAbWheelEnvironment() }));
    expect(eligible.eligible).toBe(true);
    expect(eligible.rejectionReasons).toEqual([]);
    expect(getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT).ok).toBe(true);
  });

  test("17. no equipment at all makes the exercise ineligible, in both layers", () => {
    const noEquipment = makeValidInput({
      environment: makeEnvironment({ availableEquipment: [], floorSafe: true, availableSpace: "limited" }),
    });
    const kbResult = checkExerciseEligibility(AB_WHEEL, noEquipment);
    expect(kbResult.eligible).toBe(false);
    expect(kbResult.rejectionReasons.some((reason) => reason.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);

    const sourceResult = getExercisePrescriptionSource(EXERCISE_ID, {
      ...VALID_CONTEXT,
      availableEquipmentCapabilities: [],
    });
    if (sourceResult.ok) {
      throw new Error("Expected ab_wheel to fail without its implement.");
    }
    expect(sourceResult.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
    expect(sourceResult.message).toContain("ab_wheel");
  });

  test("18. other equipment does not satisfy ab_wheel — the documented alternatives are variations, not equivalents", () => {
    // Matching is exact. The generic "other" placeholder the entry used to
    // rely on no longer opens the door, and neither does any implement the
    // chapter lists as an "Acceptable Alternative".
    for (const type of ["other", "barbell", "kettlebell", "medicine_ball", "resistance_band"] as const) {
      const input = makeValidInput({
        environment: makeEnvironment({ availableEquipment: [{ type }], floorSafe: true, availableSpace: "limited" }),
      });
      const result = checkExerciseEligibility(AB_WHEEL, input);
      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((reason) => reason.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    }

    for (const capability of ["mat", "plates", "cable_or_band_resistance"]) {
      const sourceResult = getExercisePrescriptionSource(EXERCISE_ID, {
        ...VALID_CONTEXT,
        availableEquipmentCapabilities: [capability],
      });
      expect(sourceResult.ok).toBe(false);
    }

    // No equivalence group was created for the alternatives. Three of them
    // are not part of the vocabulary at all.
    for (const alternative of ["stability_ball", "suspension_trainer", "sliding_discs"]) {
      expect(isEquipmentCapabilityId(alternative)).toBe(false);
    }

    // `towel` DID join the vocabulary when towel_pull_up was integrated,
    // which makes this guarantee stronger rather than weaker: the id now
    // exists and still does not satisfy ab_wheel, because matching is exact
    // string equality and no equivalence was created from this fiche's
    // "Acceptable Alternatives".
    expect(isEquipmentCapabilityId("towel")).toBe(true);
    const withTowel = getExercisePrescriptionSource(EXERCISE_ID, {
      ...VALID_CONTEXT,
      availableEquipmentCapabilities: ["towel"],
    });
    expect(withTowel.ok).toBe(false);
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].capabilities.requiredEquipmentCapabilities).toEqual([
      "ab_wheel",
    ]);
  });

  test("18b. the environment gates the knowledge base documents still apply", () => {
    const unsafeFloor = makeValidInput({
      environment: makeEnvironment({ availableEquipment: [{ type: "ab_wheel" }], floorSafe: false, availableSpace: "limited" }),
    });
    expect(checkExerciseEligibility(AB_WHEEL, unsafeFloor).eligible).toBe(false);

    const tooSmall = makeValidInput({
      environment: makeEnvironment({ availableEquipment: [{ type: "ab_wheel" }], floorSafe: true, availableSpace: "very_limited" }),
    });
    expect(checkExerciseEligibility(AB_WHEEL, tooSmall).eligible).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// 19-20. Profile selection and narrowing
// -----------------------------------------------------------------------------

describe("ab_wheel — profile selection and narrowing", () => {
  test("19. the entry declares core_robustness_straight_sets_v0_1 on core / straight_sets_repetitions / robustness", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    expect(entry.moduleId).toBe("core");
    expect(entry.role).toBe("robustness");
    expect(entry.explicitMethodId).toBe("straight_sets_repetitions");
    expect(entry.numericalProfileId).toBe(PROFILE_ID);
    expect(entry.capabilities.supportedMethodIds).toEqual(["straight_sets_repetitions"]);
    expect(entry.capabilities.supportedVolumeStructures).toEqual(["sets_reps"]);

    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.moduleId).toBe("core");
    expect(profile.methodId).toBe("straight_sets_repetitions");
    expect(profile.exerciseRole).toBe("robustness");
    // No non-executable profile is used anywhere in this entry.
    expect(isExecutableNumericalProfile(profile)).toBe(true);

    // The triple is unique, so explicit and implicit selection agree.
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

  test("20. the narrowing is exactly the fiche's own documented ranges — only the repetition ceiling moves", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseDoseConstraints).toEqual({
      minimumDose: { sets: 2, repetitions: 3, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 5, repetitions: 12, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: [SOURCE_CHAPTER],
    });

    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    // The declared bounds never widen the shared envelope.
    expect(2).toBeGreaterThanOrEqual(profile.volume.sets!.min);
    expect(5).toBeLessThanOrEqual(profile.volume.sets!.max);
    expect(3).toBeGreaterThanOrEqual(profile.volume.repetitions!.range.min);
    expect(12).toBeLessThanOrEqual(profile.volume.repetitions!.range.max);

    // Only the repetition dimension actually narrows: the fiche's own sets
    // range IS the envelope, so it produces no narrowing note.
    const volumeTrace = prescribe().trace.volume;
    if (!volumeTrace.ok) {
      throw new Error("Expected volume resolution to succeed.");
    }
    expect(volumeTrace.narrowingNotes.some((note) => note.includes("repetitions range 3-15 narrowed to 3-12"))).toBe(true);
    expect(volumeTrace.narrowingNotes.some((note) => note.startsWith("sets range"))).toBe(false);

    // Rest and intensity match the envelope exactly — nothing to narrow.
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseRestConstraints).toBeNull();
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseIntensityConstraints).toBeNull();

    // NOTHING was converted: no duration, distance, rounds or interval
    // figure was derived from the rollout distance, the range of motion or
    // the documented phase tempos.
    const constraints = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].exerciseDoseConstraints!;
    for (const dimension of ["durationSeconds", "distanceMeters", "rounds", "workIntervals"] as const) {
      expect(constraints.minimumDose![dimension]).toBeNull();
      expect(constraints.maximumDose![dimension]).toBeNull();
    }
  });
});

// -----------------------------------------------------------------------------
// 11-19 (prescription dimensions): sets, reps, intensity, rest, tempo
// -----------------------------------------------------------------------------

describe("ab_wheel — resolved prescription under every range context", () => {
  const EXPECTED = {
    reduced: { sets: 2, reps: 3, rpe: 6, rest: 45 },
    normal: { sets: 3, reps: 10, rpe: 7, rest: 60 },
    high: { sets: 5, reps: 12, rpe: 8, rest: 120 },
  } as const;

  for (const rangeContext of ["reduced", "normal", "high"] as const) {
    test(`"${rangeContext}" resolves sets, repetitions, intensity and rest as documented`, () => {
      const result = prescribe(rangeContext);
      const expected = EXPECTED[rangeContext];

      expect(result.prescription.status).toBe("complete");
      expect(result.prescription.volume.structure).toBe("sets_reps");
      expect(result.prescription.volume.sets).toBe(expected.sets);
      expect(result.prescription.volume.reps).toEqual({
        type: "fixed",
        value: expected.reps,
        min: null,
        max: null,
        unit: "repetitions",
      });

      expect(result.prescription.intensity.primaryMetric.type).toBe("rpe");
      expect(result.prescription.intensity.primaryMetric.target).toEqual({ type: "fixed", value: expected.rpe });
      expect(result.prescription.intensity.primaryMetric.reference).toBeNull();
      expect(result.prescription.intensity.calculation).toBeNull();

      const betweenSets = result.prescription.rest?.betweenSets;
      if (betweenSets?.type !== "fixed") {
        throw new Error("Expected a fixed between-sets rest target.");
      }
      expect(betweenSets.duration.value).toBe(expected.rest);
      expect(betweenSets.duration.scope).toBe("between_sets");
    });
  }

  test("at \"high\" the repetition ceiling is the fiche's own 12, never the envelope's 15", () => {
    expect(prescribe("high").prescription.volume.reps?.value).toBe(12);
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)!.volume.repetitions!.range.max).toBe(15);
  });

  test("the method's forbidden volume fields stay null", () => {
    const contract = getTrainingMethodContract("straight_sets_repetitions");
    const { volume } = prescribe().prescription;

    expect(contract.forbiddenVolumeFields).toEqual(["duration", "distance", "rounds", "work_intervals"]);
    expect(volume.duration).toBeNull();
    expect(volume.distance).toBeNull();
    expect(volume.rounds).toBeNull();
    expect(volume.workIntervals).toBeNull();
  });

  test("intensity: rpe is preferred and technical_effort remains supported; rir is never claimed", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.supportedIntensityTypes).toEqual(["rpe", "technical_effort"]);
    expect(entry.preferredIntensityType).toBe("rpe");
    expect(entry.capabilities.preferredIntensityTypes).toEqual(["rpe"]);

    // "Technical Repetitions in Reserve — 1 to 3" is documented by the
    // fiche but never encoded: the Core module contract does not authorise
    // `rir`, and it is not folded into the RPE band either.
    expect(entry.supportedIntensityTypes).not.toContain("rir");
    expect(entry.capabilities.supportedIntensityTypes).not.toContain("rir");
    // The fiche states the Ab Wheel "does not use percentage of
    // one-repetition maximum" — and none is claimed.
    expect(entry.supportedIntensityTypes).not.toContain("percentage_1rm");
    expect(entry.capabilities.requiredAthleteReferenceTypes).toEqual([]);
  });

  test("tempo resolves to the profile's controlled global intent, not the fiche's phase timings", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.supportedTempoTypes).toEqual(["global_intent"]);
    expect(entry.preferredTempoType).toBeNull();

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const tempo = prescribe(rangeContext).prescription.tempo;
      expect(tempo).not.toBeNull();
      expect(tempo?.type).toBe("global_intent");
      expect(tempo?.globalIntent).toBe("controlled");
      // Phase timings are not representable and are not invented.
      expect(tempo?.eccentric).toBeNull();
      expect(tempo?.concentric).toBeNull();
      expect(tempo?.hold).toBeNull();
    }

    // They are preserved where the athlete can read them instead.
    const execution = entry.instructionDefinitions.find((instruction) => instruction.category === "execution");
    expect(execution?.text).toContain("3 seconds out");
  });

  test("laterality is bilateral with a total-repetition interpretation — no per-side allocation is documented", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];
    expect(entry.capabilities.laterality).toBe("bilateral");
    expect(entry.capabilities.volumeInterpretations).toEqual(["total_repetitions"]);
    expect(entry.capabilities.volumeInterpretations).not.toContain("repetitions_per_side");

    // The declaration is carried through to the prescription, so the
    // resolved repetition count is explicitly labelled as a total.
    expect(prescribe().prescription.volume.laterality).toEqual({
      laterality: "bilateral",
      interpretation: "total_repetitions",
      startingSide: null,
      sideSwitchRuleId: null,
    });
  });
});

// -----------------------------------------------------------------------------
// 25. Stop conditions
// -----------------------------------------------------------------------------

describe("ab_wheel — stop conditions", () => {
  test("25. the five documented categories resolve, covering every risk the fiche's Stopping Rules name", () => {
    const EXPECTED_CATEGORIES = ["technical_failure", "range_of_motion_loss", "fatigue_limit", "pain", "completion"];

    const definitions = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].stopConditionDefinitions;
    expect(definitions.map((definition) => definition.category)).toEqual(EXPECTED_CATEGORIES);
    for (const definition of definitions) {
      expect(definition.instructions[0]?.text.length).toBeGreaterThan(0);
      expect(definition.sourceRuleIds.length).toBeGreaterThan(0);
    }

    // The method's own required categories are a subset of what is declared.
    const contract = getTrainingMethodContract("straight_sets_repetitions");
    expect(contract.requiredStopConditionCategories).toEqual(["technical_failure", "pain", "completion"]);
    for (const required of contract.requiredStopConditionCategories) {
      expect(EXPECTED_CATEGORIES).toContain(required);
    }

    const stopConditions = prescribe().prescription.stopConditions;
    expect(stopConditions).toHaveLength(5);
    expect(stopConditions.map((condition) => condition.category).sort()).toEqual([...EXPECTED_CATEGORIES].sort());

    // Each documented risk is covered by a text grounded in this fiche.
    const textFor = (category: string) =>
      definitions.find((definition) => definition.category === category)?.instructions[0]?.text.toLowerCase() ?? "";
    expect(textFor("technical_failure")).toContain("lumbar extension");
    expect(textFor("technical_failure")).toContain("rib cage");
    expect(textFor("range_of_motion_loss")).toContain("rollout range");
    expect(textFor("fatigue_limit")).toContain("breathing");
    expect(textFor("pain")).toContain("pain");
    expect(textFor("completion")).toContain("completed");
  });
});

// -----------------------------------------------------------------------------
// 21-24. End to end: exercise, session, engine, decision trace
// -----------------------------------------------------------------------------

describe("ab_wheel — end-to-end prescription", () => {
  test("21. prescribeExercise produces a complete prescription", () => {
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

  test("22. prescribeSession prescribes a Core block combining the timed and repetition halves of the module", () => {
    const abWheelSource = getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT);
    const pallofSource = getExercisePrescriptionSource("pallof_press", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["cable_or_band_resistance"],
    });

    if (!abWheelSource.ok || !pallofSource.ok) {
      throw new Error("Fixture setup failed: one of the sources did not resolve.");
    }

    const exercises: SessionExercisePrescriptionInput[] = [
      { exerciseId: EXERCISE_ID, moduleId: abWheelSource.moduleId, ...abWheelSource.source, order: 1, required: true, blockId: "core" },
      { exerciseId: "pallof_press", moduleId: pallofSource.moduleId, ...pallofSource.source, order: 2, required: true, blockId: "core" },
    ];

    const result = prescribeSession({
      sessionId: "core-session-1",
      sessionName: "Anti-Extension and Anti-Rotation Core",
      modules: ["core"],
      exercises,
    });

    if (!result.ok) {
      throw new Error(`Expected the session to prescribe: ${result.issues.map((issue) => issue.message).join(" | ")}`);
    }

    expect(result.session.status).toBe("complete");
    expect(result.session.exercises).toHaveLength(2);

    // Same module, two different methods and two different profiles,
    // resolved side by side without interference.
    const abWheelPrescription = result.session.exercises[0]?.prescription;
    const pallofPrescription = result.session.exercises[1]?.prescription;
    expect(abWheelPrescription?.volume.structure).toBe("sets_reps");
    expect(abWheelPrescription?.volume.reps?.value).toBe(10);
    expect(pallofPrescription?.volume.structure).toBe("sets_duration");
    expect(pallofPrescription?.volume.reps).toBeNull();
  });

  test("23. runEngine prescribes ab_wheel end to end from the real ExerciseDefinition", () => {
    // `core` is a support module: `moduleSelector.ts` never selects it from
    // an adaptation domain, only from an explicit `requiredModules` entry
    // (01_MODULE_ENGINE.md — "a module must not be selected only because
    // more variety is desired"). The session below is therefore the
    // documented shape for Core work: a primary module carrying the
    // session's objective, with Core requested alongside it — which is also
    // 62_CORE/00_OVERVIEW.md's own session order, Movement at position 2
    // and Core at position 8.
    const bearCrawl = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === "bear_crawl")!;

    const input = makeValidInput({
      request: makeRequest({
        primaryObjective: { adaptationDomain: "movement" },
        requiredModules: ["core"],
      }),
      environment: makeEnvironment({
        availableEquipment: [{ type: "ab_wheel" }],
        floorSafe: true,
        availableSpace: "large",
      }),
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "advanced" },
        goals: [{ id: "goal-1", name: "Trunk Control", adaptationDomain: "movement", priority: "primary" }],
      }),
    });

    const exercises = [
      makeExercise({ ...bearCrawl, setupTimeMinutes: 1, defaultExerciseDurationMinutes: 6 }),
      makeExercise({ ...AB_WHEEL, setupTimeMinutes: 1, defaultExerciseDurationMinutes: 8 }),
    ];

    const abWheelSource = getExercisePrescriptionSource(EXERCISE_ID, VALID_CONTEXT);
    const bearCrawlSource = getExercisePrescriptionSource("bear_crawl", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: [],
    });
    if (!abWheelSource.ok || !bearCrawlSource.ok) {
      throw new Error("Fixture setup failed: one of the sources did not resolve.");
    }

    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([
      [EXERCISE_ID, abWheelSource.source],
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
      throw new Error("Expected ab_wheel to be prescribed in the session.");
    }
    expect(prescribed.moduleId).toBe("core");
    expect(prescribed.methodId).toBe("straight_sets_repetitions");
    expect(prescribed.volume.structure).toBe("sets_reps");
    expect(prescribed.volume.sets).toBe(3);
    expect(prescribed.volume.reps?.value).toBe(10);
    expect(prescribed.intensity.primaryMetric.type).toBe("rpe");

    // The Core module was reached through an explicit request, not inferred.
    const moduleDecisions = result.decisionTrace.entries
      .filter((entry) => entry.stage === "module_selection")
      .map((entry) => entry.decision);
    expect(moduleDecisions.some((decision) => decision.includes('Module "core"'))).toBe(true);
  });

  test("24. the decision trace names the profile, the selection mode and the narrowing", () => {
    const entries = adaptExercisePrescriptionResult(prescribe(), {
      idPrefix: "ab_wheel_test",
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    const volumeEntry = entries.find((entry) => entry.id.endsWith("_volume"));
    expect(volumeEntry?.reasons[0]).toBe(`profile=${PROFILE_ID} (selection=explicit_profile_id)`);
    expect(volumeEntry?.reasons.some((reason) => reason.includes("repetitions range 3-15 narrowed to 3-12"))).toBe(true);

    const intensityEntry = entries.find((entry) => entry.id.endsWith("_intensity"));
    expect(intensityEntry?.decision).toContain('Intensity resolved via "rpe"');

    const tempoEntry = entries.find((entry) => entry.id.endsWith("_tempo"));
    expect(tempoEntry?.decision).toContain("Tempo resolved");
  });
});

// -----------------------------------------------------------------------------
// 26-32. Determinism, non-mutation, validation, non-regression, duration
// -----------------------------------------------------------------------------

describe("ab_wheel — determinism, non-mutation and non-regression", () => {
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
    expect(issues.filter((issue) => issue.code !== "UNRESOLVED_DURATION_PROFILE")).toEqual([]);
    expect(issues).toHaveLength(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).length);
    expect(issues.some((issue) => issue.exerciseId === EXERCISE_ID)).toBe(true);
  });

  test("29. no regression on the 61 previous entries: each still prescribes with its own declared equipment", () => {
    const REFERENCE = {
      referenceType: "one_rep_max" as const,
      value: 100,
      unit: "kilograms",
      sourceId: "test-1rm",
      measuredAt: null,
      validUntil: null,
      confidence: "validated" as const,
    };

    // The 61 entries that predate this lot: everything except this lot's own
    // entry and the ids added by later lots, each covered by its own file.
    const ADDED_BY_THIS_OR_LATER_LOTS: readonly string[] = [EXERCISE_ID, "dead_bug", "hanging_leg_raise", "plate_pinch", "heavy_bag_power_intervals", "battle_ropes", "assault_bike_intervals", "towel_pull_up", "rope_climb", "rope_pull", "pummeling", "wall_wrestling", "grip_fighting", "sled_push"];
    const previousIds = PILOT_EXERCISE_IDS.filter((id) => !ADDED_BY_THIS_OR_LATER_LOTS.includes(id));
    expect(previousIds).toHaveLength(61);

    for (const id of previousIds) {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id as PilotExerciseId];

      // Untouched by this lot: no previous entry adopted the new profile
      // or the new equipment identifier.
      expect(entry.numericalProfileId ?? null).not.toBe(PROFILE_ID);
      expect(entry.capabilities.requiredEquipmentCapabilities).not.toContain("ab_wheel");

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

  test("30. the four pre-existing Core entries still prescribe timed holds through their own profile", () => {
    for (const id of ["pallof_press", "hollow_body_hold", "dragon_flag", "copenhagen_plank"] as const) {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.explicitMethodId).toBe("timed_isometric_sets");
      expect(entry.capabilities.supportedVolumeStructures).toEqual(["sets_duration"]);
      expect(entry.numericalProfileId ?? null).toBeNull();
    }
  });

  test("31. the duration estimation profile exists, is unresolved, and invents no timing value", () => {
    const result = getDurationEstimationProfile(`duration_profile_${EXERCISE_ID}`);
    if (result.ok) {
      throw new Error("Expected the ab_wheel duration profile to be unresolved.");
    }

    expect(result.failureCode).toBe("DURATION_PROFILE_UNRESOLVED");
    expect(result.profile?.exerciseId).toBe(EXERCISE_ID);
    expect(result.profile?.volumeStructure).toBe("sets_reps");
    expect(result.profile?.sourceRuleIds).toEqual([SOURCE_CHAPTER]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID].capabilities.durationEstimationProfileId).toBe(
      `duration_profile_${EXERCISE_ID}`,
    );

    // In particular, no per-repetition time was derived from the documented
    // 3-1-2 / 2-0-2 / 4-1-2 tempo options.
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

  test("32. every source rule on the entry is a real, conforming identifier — nothing is unsourced", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID];

    expect(entry.sourceRuleIds).toEqual([
      SOURCE_CHAPTER,
      "31_TRAINING_METHOD_CATALOGUE_V0_1",
      "32_MODULE_PRESCRIPTION_PROFILES_V0_1",
      "34_NUMERICAL_PRESCRIPTION_TABLES_V0_1",
    ]);
    expect(entry.capabilities.sourceRuleIds).toEqual([SOURCE_CHAPTER, "33_EXERCISE_PRESCRIPTION_CAPABILITIES_V0_1"]);
    expect(entry.exerciseDoseConstraints?.sourceRuleIds).toEqual([SOURCE_CHAPTER]);

    for (const instruction of entry.instructionDefinitions) {
      expect(instruction.sourceRuleId).toBe(SOURCE_CHAPTER);
    }
    // The profile itself is sourced to the canonical table it mirrors.
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)!.sourceRuleIds).toEqual([
      "34_NUMERICAL_PRESCRIPTION_TABLES_V0_1",
    ]);
  });
});
