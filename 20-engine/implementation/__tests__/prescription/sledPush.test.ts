/**
 * Combat Athlete System — Registry Lot 21: sled_push
 *
 * The only consumer of Table Group 19's Loaded Locomotion Power profile, the
 * first registry entry to prescribe a DISTANCE AND A DURATION at once, and
 * the first power-module entry on an interval structure.
 *
 * What this file guards beyond presence:
 *
 * - that the three volume dimensions coexist and that NOTHING converts
 *   between metres and seconds. That conversion would fabricate a prescribed
 *   velocity the chapter never states, and it is the failure this file exists
 *   to make impossible;
 * - that load stays undosed. "Light to Very Heavy" is qualitative, the model
 *   has no categorical resistance rule a profile can carry, and none of the
 *   chapter's four progression axes becomes a prescribed number;
 * - that "Suitable Surface" — a Required item with no equipment identifier —
 *   is carried in the setup instruction rather than by bending a neighbouring
 *   atom;
 * - that the Phase 6 doctrine comes out of this lot unchanged.
 */

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import { EXERCISE_KNOWLEDGE_BASE, SLED_PUSH } from "../../exerciseKnowledgeBase";
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

const EXERCISE_ID = "sled_push";
const METHOD_ID = "work_rest_intervals";
const PROFILE_ID = "loaded_locomotion_power_intervals_v0_1";
const REST_RULE_ID = "POWER_LOADED_LOCOMOTION_REST_V0_1";
const CHAPTER = "50-exercises/17_SLED_PUSH";

/**
 * The resolved values in every range context, written out rather than
 * computed, so a resolver-side change would fail here loudly instead of
 * silently agreeing with itself.
 */
const EXPECTED = {
  reduced: { intervals: 4, seconds: 5, metres: 10, rest: 120 },
  normal: { intervals: 8, seconds: 22, metres: 25, rest: 180 },
  high: { intervals: 12, seconds: 40, metres: 40, rest: 240 },
} as const;

const entry = () => EXERCISE_PRESCRIPTION_REGISTRY[EXERCISE_ID as PilotExerciseId];

const context = (
  rangeContext: PrescriptionExecutionContext["rangeContext"] = "normal",
): PrescriptionExecutionContext => ({
  rangeContext,
  athleteReferences: [],
  availableEquipmentCapabilities: ["sled"],
});

function prescribe(rangeContext: PrescriptionExecutionContext["rangeContext"] = "normal") {
  const sourceResult = getExercisePrescriptionSource(EXERCISE_ID, context(rangeContext));
  if (!sourceResult.ok) {
    throw new Error(`Expected a prescription source, got: ${sourceResult.message}`);
  }
  const result = prescribeExercise({
    exerciseId: EXERCISE_ID,
    moduleId: sourceResult.moduleId,
    ...sourceResult.source,
  });
  if (!result.ok) {
    throw new Error(`Expected sled_push to prescribe, failed at ${result.failureStage}: ${result.message}`);
  }
  return result;
}

/** The resolved seconds of a `between_intervals` rest, narrowed from `RestTarget`. */
function betweenIntervalsSeconds(rangeContext: PrescriptionExecutionContext["rangeContext"]) {
  const rest = prescribe(rangeContext).prescription.rest;
  expect(rest).not.toBeNull();
  const target = rest!.betweenIntervals;
  expect(target).not.toBeNull();
  if (target!.type !== "fixed") {
    throw new Error(`Expected a fixed between-intervals rest, got "${target!.type}".`);
  }
  return target!.duration;
}

const readChapter = () => readFileSync(new URL(`../../../../${CHAPTER}`, import.meta.url), "utf-8");

// -----------------------------------------------------------------------------
// 1-5. Counts, presence, additivity
// -----------------------------------------------------------------------------

describe("sled_push — registry, knowledge base, profile and equipment counts", () => {
  test("1. the registry grew from 74 to exactly 75 entries", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(75);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(75);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort()).toEqual([...PILOT_EXERCISE_IDS].sort());
  });

  test("2. the knowledge base stays at 76 ExerciseDefinitions — none was added or edited", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toHaveLength(76);
    expect(EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === EXERCISE_ID)).toBe(SLED_PUSH);
    expect(SLED_PUSH.module).toBe("power");
    expect(SLED_PUSH.primaryAdaptation).toBe("power");
  });

  test("3. the numerical profiles stay at 23 — the doctrine lot created the profile, this lot created none", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(23);
    expect(NUMERICAL_PRESCRIPTION_PROFILES.filter((p) => p.profileId === PROFILE_ID)).toHaveLength(1);
  });

  test("4. the equipment vocabulary went from 32 to 33 — `sled`, the only identifier this lot added", () => {
    expect(EQUIPMENT_CAPABILITY_IDS).toHaveLength(33);
    expect(isEquipmentCapabilityId("sled")).toBe(true);

    // ONE atom, not two: the chapter names "Weighted Sled" as a single
    // Required item and has no separate load or plate heading, and the
    // knowledge base made exactly that call.
    expect(readChapter()).toContain("Weighted Sled");
    expect(entry().capabilities.requiredEquipmentCapabilities).toEqual(["sled"]);
    expect(entry().capabilities.requiredEquipmentCapabilities).not.toContain("plates");

    // No new identifier was invented for the harness, the straps or the
    // surface — the first two are Optional, the third has no atom at all.
    for (const invented of ["harness", "resistance_straps", "prowler", "suitable_surface", "sled_track"]) {
      expect(isEquipmentCapabilityId(invented), invented).toBe(false);
    }
  });

  test("5. sled_push exists in both layers, exactly once, and turkish_get_up remains unintegrated", () => {
    expect(PILOT_EXERCISE_IDS as readonly string[]).toContain(EXERCISE_ID);
    expect(EXERCISE_PRESCRIPTION_REGISTRY).toHaveProperty(EXERCISE_ID);
    expect(entry().exerciseId).toBe(EXERCISE_ID);
    expect(entry().capabilities.exerciseId).toBe(EXERCISE_ID);
    expect(PILOT_EXERCISE_IDS.filter((id) => id === EXERCISE_ID)).toHaveLength(1);

    // The last blocked exercise, and this lot did not touch it.
    expect(EXERCISE_PRESCRIPTION_REGISTRY as Record<string, unknown>).not.toHaveProperty("turkish_get_up");
    expect(EXERCISE_KNOWLEDGE_BASE.some((exercise) => exercise.id === "turkish_get_up")).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// 6-9. Equipment gating and profile selection
// -----------------------------------------------------------------------------

describe("sled_push — equipment gating and profile selection", () => {
  test("6. the declared equipment is recognised and prescribes", () => {
    const source = getExercisePrescriptionSource(EXERCISE_ID, context());
    expect(source.ok).toBe(true);

    // And it is a real identifier of the closed vocabulary.
    for (const id of entry().capabilities.requiredEquipmentCapabilities) {
      expect(isEquipmentCapabilityId(id), id).toBe(true);
    }
  });

  test("7. an environment with no equipment is rejected", () => {
    const source = getExercisePrescriptionSource(EXERCISE_ID, {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: [],
    });
    expect(source.ok).toBe(false);
    expect(source.ok === false && source.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
  });

  test("8. the wrong equipment is rejected — matching is exact, in both directions", () => {
    for (const wrong of ["loaded_carry_implement", "cardio_machine", "battle_rope", "rope", "plates"]) {
      const source = getExercisePrescriptionSource(EXERCISE_ID, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: [wrong],
      });
      expect(source.ok, wrong).toBe(false);
    }

    // And `sled` satisfies nothing else: no other entry requires it.
    const sledUsers = PILOT_EXERCISE_IDS.filter((id) =>
      EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.requiredEquipmentCapabilities.includes("sled"),
    );
    expect(sledUsers).toEqual([EXERCISE_ID]);
  });

  test("9. the entry names Table Group 19's profile and resolves to it, on a unique triple", () => {
    expect(entry().numericalProfileId).toBe(PROFILE_ID);
    expect(entry().explicitMethodId).toBe(METHOD_ID);
    expect(entry().moduleId).toBe("power");
    expect(entry().role).toBe("secondary");
    expect(entry().capabilities.supportedMethodIds).toEqual([METHOD_ID]);
    expect(entry().capabilities.supportedVolumeStructures).toEqual(["intervals"]);

    const resolution = resolveNumericalProfile({
      moduleId: entry().moduleId,
      methodId: entry().explicitMethodId,
      exerciseRole: entry().role,
      explicitProfileId: entry().numericalProfileId ?? null,
    });
    expect(resolution.ok).toBe(true);
    expect(resolution.ok && resolution.profile.profileId).toBe(PROFILE_ID);

    // The triple is unique, so the explicit id is an auditability convention
    // rather than a necessity — implicit resolution reaches the same profile.
    const implicit = resolveNumericalProfile({
      moduleId: "power",
      methodId: METHOD_ID,
      exerciseRole: "secondary",
      explicitProfileId: null,
    });
    expect(implicit.ok && implicit.profile.profileId).toBe(PROFILE_ID);
  });
});

// -----------------------------------------------------------------------------
// 10-16. The three dimensions, in every range context
// -----------------------------------------------------------------------------

describe("sled_push — resolved volume in every range context", () => {
  for (const rangeContext of ["reduced", "normal", "high"] as const) {
    test(`${rangeContext} resolves all three dimensions to the documented values`, () => {
      const expected = EXPECTED[rangeContext];
      const { volume } = prescribe(rangeContext).prescription;

      expect(volume.structure).toBe("intervals");
      expect(volume.workIntervals).toBe(expected.intervals);
      expect(volume.duration).toEqual({
        value: expected.seconds,
        unit: "seconds",
        scope: "per_interval",
      });
      expect(volume.distance).toEqual({
        value: expected.metres,
        unit: "meters",
        scope: "per_interval",
      });

      // The structure forbids the other three fields, and none appears.
      expect(volume.sets).toBeNull();
      expect(volume.reps).toBeNull();
      expect(volume.rounds).toBeNull();

      expect(betweenIntervalsSeconds(rangeContext).value).toBe(expected.rest);
    });
  }

  test("13. work intervals carry the chapter's own 4-12 pushes", () => {
    expect(readChapter()).toContain("4–12 pushes");
    expect(entry().exerciseDoseConstraints?.minimumDose?.workIntervals).toBe(4);
    expect(entry().exerciseDoseConstraints?.maximumDose?.workIntervals).toBe(12);

    // "pushes" are separate efforts, not repetitions of a movement — and the
    // method forbids `repetitions` outright, so the reading is enforced.
    expect(getTrainingMethodContract(METHOD_ID).forbiddenVolumeFields).toContain("repetitions");
    expect(prescribe("reduced").prescription.volume.workIntervals).toBe(4);
    expect(prescribe("high").prescription.volume.workIntervals).toBe(12);
  });

  test("14. duration is per_interval and carries the chapter's own 5-40 seconds", () => {
    expect(readChapter()).toContain("5–40 seconds");
    expect(entry().exerciseDoseConstraints?.minimumDose?.durationSeconds).toBe(5);
    expect(entry().exerciseDoseConstraints?.maximumDose?.durationSeconds).toBe(40);
    expect(prescribe("normal").prescription.volume.duration?.scope).toBe("per_interval");
  });

  test("15. distance is per_interval and carries the chapter's own 10-40 metres", () => {
    expect(readChapter()).toContain("10–40 meters");
    expect(entry().exerciseDoseConstraints?.minimumDose?.distanceMeters).toBe(10);
    expect(entry().exerciseDoseConstraints?.maximumDose?.distanceMeters).toBe(40);
    expect(prescribe("normal").prescription.volume.distance?.scope).toBe("per_interval");

    // This is the only registry entry carrying a distance AND a duration.
    const withBoth = PILOT_EXERCISE_IDS.filter((id) => {
      const prescription = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities:
          EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.requiredEquipmentCapabilities,
      });
      if (!prescription.ok) return false;
      const resolved = prescribeExercise({
        exerciseId: id,
        moduleId: prescription.moduleId,
        ...prescription.source,
      });
      return (
        resolved.ok &&
        resolved.prescription.volume.distance !== null &&
        resolved.prescription.volume.duration !== null
      );
    });
    expect(withBoth).toEqual([EXERCISE_ID]);
  });

  test("16. NO CONVERSION between metres and seconds happens anywhere", () => {
    // If either dimension were derived from the other, the implied velocity
    // would be constant across range contexts. It is not: all three differ.
    const ratios = (["reduced", "normal", "high"] as const).map((rangeContext) => {
      const { volume } = prescribe(rangeContext).prescription;
      return volume.distance!.value / volume.duration!.value;
    });
    expect(new Set(ratios).size).toBe(3);

    // Their units stay distinct through resolution.
    const { volume } = prescribe("normal").prescription;
    expect(volume.duration?.unit).toBe("seconds");
    expect(volume.distance?.unit).toBe("meters");

    // And the two come from DIFFERENT sections of the chapter, so neither
    // could have been computed from the other in the first place.
    const chapter = readChapter();
    const loadingProfile = chapter.slice(chapter.indexOf("# Loading Profile"));
    const physiological = chapter.slice(
      chapter.indexOf("# Physiological Profile"),
      chapter.indexOf("# Neurological Profile"),
    );
    expect(loadingProfile).toContain("10–40 meters");
    expect(physiological).toContain("5–40 seconds");
    expect(physiological).not.toContain("meters");
  });
});

// -----------------------------------------------------------------------------
// 17-22. Intensity, rest, tempo, loading, laterality, interpretation
// -----------------------------------------------------------------------------

describe("sled_push — intensity, rest, tempo and volume semantics", () => {
  test("17. intensity is movement_intent: explosive, and load is never dosed", () => {
    expect(entry().supportedIntensityTypes).toEqual(["movement_intent"]);
    expect(entry().preferredIntensityType).toBe("movement_intent");
    expect(entry().capabilities.supportedIntensityTypes).toEqual(["movement_intent"]);

    const { intensity } = prescribe().prescription;
    expect(intensity.primaryMetric.type).toBe("movement_intent");
    expect(intensity.primaryMetric.target).toEqual({ type: "category", value: "explosive" });
    expect(intensity.secondaryMetrics).toEqual([]);
    expect(intensity.status).toBe("complete");

    // The profile carries one rule, so there is nothing to narrow.
    expect(entry().exerciseIntensityConstraints).toBeNull();

    // "Light to Very Heavy" is documented and deliberately unencoded: no
    // load, no percentage, no resistance category reaches the prescription.
    expect(readChapter()).toContain("Light to Very Heavy");
    const serialized = JSON.stringify(intensity);
    for (const forbidden of [
      "absolute_load",
      "percentage_1rm",
      "percentage_body_mass",
      "resistance_category",
      "rpe",
      "velocity",
    ]) {
      expect(serialized, forbidden).not.toContain(forbidden);
    }
  });

  test("17b. none of the chapter's four progression axes becomes a prescribed number", () => {
    // "# Loading Profile — Progression: Load, Distance, Speed, Rest."
    // Distance IS prescribed, but from the Typical Volume line, not from the
    // progression list; Load, Speed and Rest are not prescribed at all.
    const prescription = prescribe().prescription;
    expect(JSON.stringify(prescription.intensity)).not.toContain("load");
    // Speed is never stated: no velocity target and no metres-per-second.
    expect(JSON.stringify(prescription.volume)).not.toContain("velocity");
    // Rest is prescribed by the module doctrine, never by this chapter.
    expect(entry().exerciseRestConstraints).toBeNull();
  });

  test("18. rest is between_intervals, unnarrowed, and traceable to the doctrine rule id", () => {
    // The chapter names Rest only as a progression axis, so there is nothing
    // to narrow and the profile's band applies whole.
    expect(entry().exerciseRestConstraints).toBeNull();

    const rest = prescribe().prescription.rest!;
    expect(rest.betweenIntervals).not.toBeNull();
    expect(rest.betweenSets).toBeNull();
    expect(rest.betweenRounds).toBeNull();
    expect(rest.status).toBe("complete");
    expect(betweenIntervalsSeconds("normal").scope).toBe("between_intervals");

    // The one value no chapter documents stays individually traceable.
    expect(rest.sourceRuleIds).toContain(REST_RULE_ID);
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)!.rest!.seconds).toEqual({
      min: 120,
      normal: 180,
      max: 240,
    });
  });

  test("19. tempo is null — the method forbids it and the entry declares none", () => {
    expect(getTrainingMethodContract(METHOD_ID).tempoPolicy).toBe("forbidden");
    expect(entry().supportedTempoTypes).toEqual([]);
    expect(entry().preferredTempoType).toBeNull();
    expect(entry().capabilities.supportedTempoTypes).toEqual([]);
    expect(prescribe().prescription.tempo).toBeNull();
  });

  test("20. the loading mode is `sled` — no neighbouring mode was bent to fit", () => {
    expect(entry().capabilities.supportedLoadingModes).toEqual(["sled"]);

    for (const wrong of ["locomotion_only", "bodyweight", "machine", "rope", "ergometer"]) {
      expect(entry().capabilities.supportedLoadingModes as readonly string[]).not.toContain(wrong);
    }

    // sprint_intervals is the direct contrast: same method, unloaded.
    expect(
      EXERCISE_PRESCRIPTION_REGISTRY.sprint_intervals.capabilities.supportedLoadingModes,
    ).toEqual(["locomotion_only"]);
  });

  test("21. laterality is not_applicable — not inferred from the biomechanics", () => {
    expect(entry().capabilities.laterality).toBe("not_applicable");

    // The method permits the field, so the value is a decision rather than a
    // structural consequence — unlike the partner grappling drills, whose
    // method forbids it outright.
    expect(getTrainingMethodContract(METHOD_ID).forbiddenVolumeFields).not.toContain("laterality");
    expect(getTrainingMethodContract(METHOD_ID).optionalVolumeFields).toContain("laterality");

    const laterality = prescribe().prescription.volume.laterality;
    expect(laterality?.laterality).toBe("not_applicable");
    expect(laterality?.startingSide).toBeNull();
    expect(laterality?.interpretation).not.toContain("per_side");
  });

  test("22. the volume interpretation is interval_total", () => {
    expect(entry().capabilities.volumeInterpretations).toEqual(["interval_total"]);
    expect(prescribe().prescription.volume.laterality?.interpretation).toBe("interval_total");
  });
});

// -----------------------------------------------------------------------------
// 23-24. Instructions and stop conditions
// -----------------------------------------------------------------------------

describe("sled_push — instructions and stop conditions", () => {
  test("23. setup, execution and safety instructions exist, and the surface requirement is carried at critical priority", () => {
    const instructions = entry().instructionDefinitions;
    expect(instructions.map((instruction) => instruction.category)).toEqual([
      "setup",
      "execution",
      "safety",
    ]);
    for (const instruction of instructions) {
      expect(instruction.mandatory, instruction.instructionId).toBe(true);
      expect(instruction.sourceRuleId, instruction.instructionId).toBe(CHAPTER);
    }
    expect(instructions.map((instruction) => instruction.instructionId)).toEqual([
      ...entry().capabilities.requiredInstructionIds,
    ]);

    // "Suitable Surface" is a Required item of this chapter with no equipment
    // identifier anywhere in the vocabulary. It is carried in the setup
    // instruction at critical priority instead of by bending a neighbouring
    // atom — a documented limitation, recorded rather than resolved.
    expect(readChapter()).toContain("Suitable Surface");
    const setup = instructions.find((instruction) => instruction.category === "setup")!;
    expect(setup.priority).toBe("critical");
    expect(setup.text).toContain("suitable surface");
    expect(isEquipmentCapabilityId("suitable_surface")).toBe(false);

    // The chapter's own cues reach the execution instruction.
    const execution = instructions.find((instruction) => instruction.category === "execution")!;
    for (const cue of ["Brace first", "lean from the ankles", "Drive through the ground"]) {
      expect(execution.text.toLowerCase()).toContain(cue.toLowerCase());
    }
  });

  test("24. seven stop conditions: the method's six required categories plus the documented traction risk", () => {
    const conditions = entry().stopConditionDefinitions;
    expect(conditions).toHaveLength(7);

    const categories = conditions.map((condition) => condition.category);
    for (const required of getTrainingMethodContract(METHOD_ID).requiredStopConditionCategories) {
      expect(categories, required).toContain(required);
    }

    // balance_loss is declared because the chapter documents the concern —
    // "Loss of Foot Traction" — unlike towel_pull_up and the rope entries,
    // which omitted it for exactly the opposite reason.
    expect(categories).toContain("balance_loss");
    expect(readChapter()).toContain("Loss of Foot Traction");

    // equipment_failure is NOT declared: this chapter documents no equipment
    // failure mode among its Primary Risks.
    expect(categories).not.toContain("equipment_failure");
    expect(categories).not.toContain("impact_limit");
    expect(categories).not.toContain("range_of_motion_loss");

    // pace_loss is the governing quality threshold, and it is the
    // interval-scoped factory rather than a set-scoped one.
    const paceLoss = conditions.find((condition) => condition.category === "pace_loss")!;
    expect(paceLoss.scope).toBe("interval");
    expect(paceLoss.action).toBe("end_interval");

    expect(conditions.map((condition) => condition.conditionId).sort()).toEqual(
      [...entry().capabilities.requiredStopConditionIds].sort(),
    );
    expect(prescribe().prescription.stopConditions).toHaveLength(7);
  });
});

// -----------------------------------------------------------------------------
// 25-30. End to end
// -----------------------------------------------------------------------------

describe("sled_push — exercise, session, engine, trace", () => {
  test("25. the exercise prescribes completely", () => {
    const result = prescribe();
    expect(result.ok).toBe(true);
    expect(result.prescription.exerciseId).toBe(EXERCISE_ID);
    expect(result.prescription.moduleId).toBe("power");
    expect(result.prescription.methodId).toBe(METHOD_ID);
    expect(result.prescription.instructions.length).toBeGreaterThanOrEqual(3);
    expect(result.prescription.stopConditions).toHaveLength(7);
  });

  test("26. it prescribes inside a session", () => {
    const source = getExercisePrescriptionSource(EXERCISE_ID, context());
    if (!source.ok) throw new Error("Expected a source.");

    const exercises: SessionExercisePrescriptionInput[] = [
      {
        exerciseId: EXERCISE_ID,
        moduleId: source.moduleId,
        ...source.source,
        order: 1,
        required: true,
        blockId: "power",
      },
    ];

    const result = prescribeSession({
      sessionId: "sled-session",
      sessionName: "Loaded Locomotion Power",
      modules: ["power"],
      exercises,
    });
    if (!result.ok) {
      throw new Error(`Expected the session to prescribe: ${result.issues.map((i) => i.message).join(" | ")}`);
    }
    expect(result.session.exercises).toHaveLength(1);
    const prescribed = result.session.exercises[0]!.prescription;
    expect(prescribed.volume.workIntervals).toBe(EXPECTED.normal.intervals);
    expect(prescribed.volume.distance?.value).toBe(EXPECTED.normal.metres);
    expect(prescribed.volume.duration?.value).toBe(EXPECTED.normal.seconds);
  });

  test("27. runEngine prescribes sled_push end to end", () => {
    const input = makeValidInput({
      request: makeRequest({
        primaryObjective: { adaptationDomain: "power" },
      }),
      environment: makeEnvironment({
        availableEquipment: [{ type: "sled" }],
        floorSafe: true,
        availableSpace: "large",
      }),
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "advanced", primaryCombatSport: "krav_maga" },
        goals: [{ id: "goal-1", name: "Acceleration", adaptationDomain: "power", priority: "primary" }],
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

    const source = getExercisePrescriptionSource(EXERCISE_ID, context());
    if (!source.ok) throw new Error("Fixture setup failed.");

    const result = runEngine(
      input,
      [makeExercise({ ...SLED_PUSH, setupTimeMinutes: 3 })],
      new Map<string, ExercisePrescriptionSource>([[EXERCISE_ID, source.source]]),
    );

    if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
      throw new Error(`Expected a prescribed draft, got ${result.outcome}.`);
    }
    const prescribed = result.prescription.session.exercises.find(
      (exercise) => exercise.prescription.exerciseId === EXERCISE_ID,
    )?.prescription;
    expect(prescribed).toBeDefined();
    expect(prescribed?.volume.structure).toBe("intervals");
    expect(prescribed?.volume.workIntervals).toBe(EXPECTED.normal.intervals);
    expect(prescribed?.volume.distance?.value).toBe(EXPECTED.normal.metres);
  });

  test("27b. the knowledge base gates on the sled, the surface and the space", () => {
    const usable = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "sled" }],
        floorSafe: true,
        availableSpace: "large",
      }),
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "advanced", primaryCombatSport: "krav_maga" },
      }),
    });
    expect(checkExerciseEligibility(SLED_PUSH, usable).eligible).toBe(true);

    // No sled — the eligibility gate refuses before any prescription runs.
    const noSled = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        floorSafe: true,
        availableSpace: "large",
      }),
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "advanced", primaryCombatSport: "krav_maga" },
      }),
    });
    expect(checkExerciseEligibility(SLED_PUSH, noSled).eligible).toBe(false);

    // No suitable surface — the requirement the prescription layer cannot
    // express is nonetheless enforced, one layer down.
    const unsafeFloor = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "sled" }],
        floorSafe: false,
        availableSpace: "large",
      }),
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "advanced", primaryCombatSport: "krav_maga" },
      }),
    });
    expect(checkExerciseEligibility(SLED_PUSH, unsafeFloor).eligible).toBe(false);

    // Not enough space for a 10-40 m lane.
    const cramped = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "sled" }],
        floorSafe: true,
        availableSpace: "limited",
      }),
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "advanced", primaryCombatSport: "krav_maga" },
      }),
    });
    expect(checkExerciseEligibility(SLED_PUSH, cramped).eligible).toBe(false);
  });

  test("28. the Decision Trace names the profile and carries all three dimensions", () => {
    const entries = adaptExercisePrescriptionResult(prescribe("high"), {
      idPrefix: "sled_push_test",
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    const volumeEntry = entries.find((traceEntry) => traceEntry.id.endsWith("_volume"));
    expect(volumeEntry?.reasons[0]).toBe(`profile=${PROFILE_ID} (selection=explicit_profile_id)`);

    const volumeText = volumeEntry!.reasons.join(" ");
    expect(volumeText).toContain("workIntervals");
    expect(volumeText).toContain("duration");
    expect(volumeText).toContain("distance");

    const restEntry = entries.find((traceEntry) => traceEntry.id.endsWith("_rest"));
    expect(restEntry).toBeDefined();
  });

  test("29. prescription is deterministic — same input, byte-identical output", () => {
    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const runs = [0, 1, 2].map(() => JSON.stringify(prescribe(rangeContext).prescription));
      expect(new Set(runs).size, rangeContext).toBe(1);
    }
  });

  test("30. prescribing mutates neither the entry, the profile nor the execution context", () => {
    const entryBefore = JSON.stringify(entry());
    const profileBefore = JSON.stringify(getNumericalPrescriptionProfileById(PROFILE_ID));
    const executionContext = context();
    const contextBefore = JSON.stringify(executionContext);

    const source = getExercisePrescriptionSource(EXERCISE_ID, executionContext);
    if (!source.ok) throw new Error("Expected a source.");
    prescribeExercise({ exerciseId: EXERCISE_ID, moduleId: source.moduleId, ...source.source });

    expect(JSON.stringify(entry())).toBe(entryBefore);
    expect(JSON.stringify(getNumericalPrescriptionProfileById(PROFILE_ID))).toBe(profileBefore);
    expect(JSON.stringify(executionContext)).toBe(contextBefore);
  });
});

// -----------------------------------------------------------------------------
// 31-35. Registry health, non-regression, genericity
// -----------------------------------------------------------------------------

describe("sled_push — registry health and non-regression", () => {
  test("31. the whole registry still validates", () => {
    expect(
      validatePilotRegistry(),
    ).toEqual([]);
  });

  test("32. no regression on the 74 previous entries: each still prescribes with its own declared equipment", () => {
    const previousIds = PILOT_EXERCISE_IDS.filter((id) => id !== EXERCISE_ID);
    expect(previousIds).toHaveLength(74);

    for (const id of previousIds) {
      const registryEntry = EXERCISE_PRESCRIPTION_REGISTRY[id];

      // No previous entry adopted this lot's profile, method-module pairing
      // or equipment identifier.
      expect(registryEntry.numericalProfileId ?? null).not.toBe(PROFILE_ID);
      expect(registryEntry.capabilities.requiredEquipmentCapabilities).not.toContain("sled");
      expect(registryEntry.capabilities.supportedLoadingModes as readonly string[]).not.toContain("sled");

      const sourceResult = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [
          {
            referenceType: "one_rep_max" as const,
            value: 100,
            unit: "kilograms",
            sourceId: "test-1rm",
            measuredAt: null,
            validUntil: null,
            confidence: "validated" as const,
          },
        ],
        availableEquipmentCapabilities: registryEntry.capabilities.requiredEquipmentCapabilities,
      });
      expect(sourceResult.ok, id).toBe(true);
    }
  });

  test("33. the duration profile exists and is honestly unresolved", () => {
    expect(entry().capabilities.durationEstimationProfileId).toBe("duration_profile_sled_push");

    const result = getDurationEstimationProfile("duration_profile_sled_push");
    if (!result.ok) {
      throw new Error("Expected duration_profile_sled_push to be unresolved.");
    }
    expect(result.profile?.status).toBe("resolved");
    expect(result.profile?.volumeStructure).toBe("intervals");
    expect(result.profile?.sourceRuleIds).toContain(CHAPTER);

    // The prescribed 5-40 s is a work duration, never copied into a timing
    // estimate — that would restate a prescription as an estimate.
  });

  test("34-35. no resolver was modified, and none branches on this exercise, method-module pairing or profile", () => {
    const resolvers = [
      "resolveVolume.ts",
      "resolveIntensity.ts",
      "resolveRest.ts",
      "resolveTempo.ts",
      "resolveMethod.ts",
      "resolveStopConditions.ts",
      "resolveInstructions.ts",
      "prescribeExercise.ts",
      "prescribeSession.ts",
      "validatePrescription.ts",
    ];

    for (const file of resolvers) {
      const text = readFileSync(new URL(`../../prescription/${file}`, import.meta.url), "utf-8");
      expect(text, file).not.toContain(EXERCISE_ID);
      expect(text, file).not.toContain(PROFILE_ID);
      expect(text, file).not.toContain(REST_RULE_ID);
    }
  });

  test("36. the Phase 6 doctrine is unchanged by this lot", () => {
    const p = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(p.moduleId).toBe("power");
    expect(p.methodId).toBe(METHOD_ID);
    expect(p.exerciseRole).toBe("secondary");
    expect(p.volume.workIntervals).toEqual({ min: 4, normal: 8, max: 12 });
    expect(p.volume.duration!.range).toEqual({ min: 5, normal: 22, max: 40, unit: "seconds" });
    expect(p.volume.distance!.range).toEqual({ min: 10, normal: 25, max: 40, unit: "meters" });
    expect(p.rest!.seconds).toEqual({ min: 120, normal: 180, max: 240 });
    expect(p.tempo).toBeNull();
    expect(p.intensity).toHaveLength(1);
    expect(p.requiresExerciseSpecificLoadRule).toBe(false);
    expect(p.requiresSportSpecificSubtype).toBe(false);

    // And the method contract it sits on was not widened for this entry.
    const method = getTrainingMethodContract(METHOD_ID);
    expect(method.supportedModules).toEqual(["power", "grip", "conditioning"]);
    expect(method.volumeStructure).toBe("intervals");
    expect(method.requiredVolumeFields).toEqual(["work_intervals", "duration"]);
    expect(method.optionalVolumeFields).toContain("distance");
  });
});
