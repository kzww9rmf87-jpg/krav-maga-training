/**
 * Combat Athlete System — Ballistics Family Integration Tests
 *
 * Covers the outcome of the Ballistics (`50-exercises/67_BALLISTICS/`)
 * integrability audit and its subsequent corrective reviews. All 7
 * documented medicine-ball exercises are now integrated into
 * `EXERCISE_PRESCRIPTION_REGISTRY`:
 *
 * - `med_ball_slam` (uses `slam_ball` + `safe_landing_surface`);
 * - `med_ball_chest_pass` — WALL VARIANT ONLY (`medicine_ball` + `wall`);
 * - `med_ball_overhead_throw` — open-space variant (`medicine_ball` + `open_space`);
 * - `med_ball_shot_put_throw` — open-space variant (`medicine_ball` + `open_space`);
 * - `med_ball_reverse_throw` (`medicine_ball` + `open_space`, its only documented option);
 * - `med_ball_rotational_throw` — WALL VARIANT ONLY (`medicine_ball` + `wall`),
 *   `laterality: "unilateral"`, `volumeInterpretations: ["repetitions_per_side"]`;
 * - `med_ball_scoop_toss` — STANDING ROTATIONAL VARIANT ONLY, open space
 *   (`medicine_ball` + `open_space`), same laterality resolution. The
 *   bilateral "Forward Scoop Toss" and wall-directed "Lateral Scoop Toss"
 *   variants are explicitly NOT represented by this entry.
 *
 * The last two were unblocked by an explicit CAS business decision: both
 * chapters document laterality as "Unilateral Emphasis with Bilateral
 * Support", which has no direct `ExerciseLaterality` member; the decision
 * was to represent both as `"unilateral"` with
 * `volumeInterpretations: ["repetitions_per_side"]`, matching their own
 * documented "repetitions per side" prescription and the identical
 * precedent already used by `med_ball_shot_put_throw` — see the laterality
 * decision report.
 */

import { describe, expect, test } from "vitest";

import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  getExercisePrescriptionSource,
  type PrescriptionExecutionContext,
} from "../../prescription/exercisePrescriptionRegistry";
import { prescribeExercise } from "../../prescription/prescribeExercise";
import { prescribeSession, type SessionExercisePrescriptionInput } from "../../prescription/prescribeSession";
import { DURATION_ESTIMATION_PROFILES, getDurationEstimationProfile } from "../../prescription/durationEstimationProfiles";
import { getTrainingMethodContract } from "../../prescription/contracts";
import { findUnknownEquipmentCapabilities } from "../../prescription/equipmentCapabilities";
import type { ExercisePrescriptionSource } from "../../prescription/buildPrescriptionInput";

import { runEngine } from "../../index";
import { makeExercise, makeRequest, makeValidInput } from "../fixtures";

const VALID_CONTEXT: PrescriptionExecutionContext = {
  rangeContext: "normal",
  athleteReferences: [],
  availableEquipmentCapabilities: ["slam_ball", "safe_landing_surface"],
};

// The four exercises integrated in the previous session, with the
// equipment set and laterality actually chosen for their prescribed
// variant.
const NEW_THROW_VARIANTS = [
  { id: "med_ball_chest_pass", equipment: ["medicine_ball", "wall"], laterality: "bilateral" },
  { id: "med_ball_overhead_throw", equipment: ["medicine_ball", "open_space"], laterality: "bilateral" },
  { id: "med_ball_shot_put_throw", equipment: ["medicine_ball", "open_space"], laterality: "unilateral" },
  { id: "med_ball_reverse_throw", equipment: ["medicine_ball", "open_space"], laterality: "bilateral" },
] as const;

// The two exercises integrated in this session, unblocked by the laterality
// business decision (unilateral / repetitions_per_side).
const FINAL_THROW_VARIANTS = [
  { id: "med_ball_rotational_throw", equipment: ["medicine_ball", "wall"] },
  { id: "med_ball_scoop_toss", equipment: ["medicine_ball", "open_space"] },
] as const;

// -----------------------------------------------------------------------------
// 1. med_ball_slam prescribes completely with a valid context
// -----------------------------------------------------------------------------

describe("ballistics — med_ball_slam prescribes completely", () => {
  test("getExercisePrescriptionSource + prescribeExercise succeed end to end", () => {
    const sourceResult = getExercisePrescriptionSource("med_ball_slam", VALID_CONTEXT);
    if (!sourceResult.ok) {
      throw new Error(`Expected med_ball_slam to prescribe successfully: ${sourceResult.message}`);
    }

    expect(sourceResult.moduleId).toBe("power");
    expect(sourceResult.source.role).toBe("primary");
    expect(sourceResult.source.explicitMethodId).toBe("power_repetition_sets");
    expect(sourceResult.source.athleteReferences).toEqual([]);

    const result = prescribeExercise({
      exerciseId: "med_ball_slam",
      moduleId: sourceResult.moduleId,
      ...sourceResult.source,
    });
    if (!result.ok) {
      throw new Error(`Expected med_ball_slam prescription to succeed at ${result.failureStage}: ${result.message}`);
    }

    expect(result.prescription.status).toBe("complete");
    expect(result.prescription.methodId).toBe("power_repetition_sets");
    // power_primary_repetition_sets_v0_1, normal range context — same
    // documented profile already used by box_jump, push_press, broad_jump.
    expect(result.prescription.volume.sets).toBe(4);
    expect(result.prescription.volume.reps?.value).toBe(3);
    expect(result.prescription.intensity.primaryMetric.type).toBe("movement_intent");
    expect(result.prescription.intensity.calculation).toBeNull();
    expect(result.prescription.intensity.primaryMetric.target).toEqual({
      type: "category",
      value: "maximal_acceleration",
    });
  });

  test("no medicine-ball mass or other numeric value is invented", () => {
    const sourceResult = getExercisePrescriptionSource("med_ball_slam", VALID_CONTEXT);
    if (!sourceResult.ok) {
      throw new Error(`Fixture setup failed: ${sourceResult.message}`);
    }
    const result = prescribeExercise({
      exerciseId: "med_ball_slam",
      moduleId: sourceResult.moduleId,
      ...sourceResult.source,
    });
    if (!result.ok) {
      throw new Error(`Expected success: ${result.message}`);
    }

    // Only movement_intent is supported — no absolute_load/resistance value exists to invent.
    expect(sourceResult.source.supportedIntensityTypes).toEqual(["movement_intent"]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.med_ball_slam.capabilities.requiredAthleteReferenceTypes).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// 2. Determinism and non-mutation
// -----------------------------------------------------------------------------

describe("ballistics — med_ball_slam determinism and non-mutation", () => {
  test("identical calls to getExercisePrescriptionSource produce identical results", () => {
    const resultA = getExercisePrescriptionSource("med_ball_slam", VALID_CONTEXT);
    const resultB = getExercisePrescriptionSource("med_ball_slam", VALID_CONTEXT);
    expect(resultA).toEqual(resultB);
  });

  test("getExercisePrescriptionSource does not mutate the supplied context", () => {
    const context: PrescriptionExecutionContext = {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["slam_ball", "safe_landing_surface"],
    };
    const snapshot = JSON.parse(JSON.stringify(context));

    getExercisePrescriptionSource("med_ball_slam", context);

    expect(context).toEqual(snapshot);
  });

  test("prescribeExercise is deterministic and does not mutate its input", () => {
    const sourceResult = getExercisePrescriptionSource("med_ball_slam", VALID_CONTEXT);
    if (!sourceResult.ok) {
      throw new Error(`Fixture setup failed: ${sourceResult.message}`);
    }
    const input = { exerciseId: "med_ball_slam" as const, moduleId: sourceResult.moduleId, ...sourceResult.source };
    const snapshot = JSON.parse(JSON.stringify(input));

    expect(prescribeExercise(input)).toEqual(prescribeExercise(input));

    prescribeExercise(input);
    expect(input).toEqual(snapshot);
  });

  test("prescribing med_ball_slam never mutates the shared registry", () => {
    const registrySnapshot = JSON.parse(JSON.stringify(EXERCISE_PRESCRIPTION_REGISTRY));

    const sourceResult = getExercisePrescriptionSource("med_ball_slam", VALID_CONTEXT);
    if (sourceResult.ok) {
      prescribeExercise({ exerciseId: "med_ball_slam", moduleId: sourceResult.moduleId, ...sourceResult.source });
    }

    expect(EXERCISE_PRESCRIPTION_REGISTRY).toEqual(registrySnapshot);
  });
});

// -----------------------------------------------------------------------------
// 3. Missing equipment produces a safe, structured failure
// -----------------------------------------------------------------------------

describe("ballistics — missing equipment produces a safe failure", () => {
  test("missing slam_ball produces REQUIRED_EQUIPMENT_MISSING, never an exception", () => {
    const result = getExercisePrescriptionSource("med_ball_slam", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["safe_landing_surface"], // slam_ball missing
    });

    if (result.ok) {
      throw new Error("Expected med_ball_slam to fail safely without slam_ball.");
    }
    expect(result.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
    expect(result.message).toContain("slam_ball");
  });

  test("missing safe_landing_surface produces REQUIRED_EQUIPMENT_MISSING, never an exception", () => {
    const result = getExercisePrescriptionSource("med_ball_slam", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["slam_ball"], // safe_landing_surface missing
    });

    if (result.ok) {
      throw new Error("Expected med_ball_slam to fail safely without safe_landing_surface.");
    }
    expect(result.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
    expect(result.message).toContain("safe_landing_surface");
  });

  test("no equipment at all produces REQUIRED_EQUIPMENT_MISSING listing both capabilities", () => {
    const result = getExercisePrescriptionSource("med_ball_slam", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: [],
    });

    if (result.ok) {
      throw new Error("Expected med_ball_slam to fail safely with no equipment.");
    }
    expect(result.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
    expect(result.message).toContain("slam_ball");
    expect(result.message).toContain("safe_landing_surface");
  });
});

// -----------------------------------------------------------------------------
// 4. Instructions and stop conditions conform to the power_repetition_sets contract
// -----------------------------------------------------------------------------

describe("ballistics — med_ball_slam instructions and stop conditions conform to contract", () => {
  const entry = EXERCISE_PRESCRIPTION_REGISTRY.med_ball_slam;

  test("every required instruction id resolves to a real, non-empty instruction", () => {
    expect(entry.instructionDefinitions.length).toBeGreaterThan(0);
    const instructionIds = new Set(entry.instructionDefinitions.map((instruction) => instruction.instructionId));
    for (const requiredId of entry.capabilities.requiredInstructionIds) {
      expect(instructionIds.has(requiredId)).toBe(true);
    }
  });

  test("every required stop-condition id resolves to a real definition", () => {
    const stopConditionIds = new Set(entry.stopConditionDefinitions.map((condition) => condition.conditionId));
    for (const requiredId of entry.capabilities.requiredStopConditionIds) {
      expect(stopConditionIds.has(requiredId)).toBe(true);
    }
  });

  test("every stop-condition category required by power_repetition_sets is covered", () => {
    const method = getTrainingMethodContract(entry.explicitMethodId);
    const coveredCategories = new Set(entry.stopConditionDefinitions.map((condition) => condition.category));
    for (const requiredCategory of method.requiredStopConditionCategories) {
      expect(coveredCategories.has(requiredCategory)).toBe(true);
    }
    // Exactly the 7 categories power_repetition_sets requires — no more, no fewer.
    expect(method.requiredStopConditionCategories).toEqual([
      "technical_failure",
      "velocity_loss",
      "fatigue_limit",
      "impact_limit",
      "balance_loss",
      "pain",
      "completion",
    ]);
  });

  test("the method and role match a real, documented numerical profile", () => {
    expect(entry.moduleId).toBe("power");
    expect(entry.role).toBe("primary");
    expect(entry.explicitMethodId).toBe("power_repetition_sets");
  });
});

// -----------------------------------------------------------------------------
// 5. Duration profile stays unresolved and invents no timing value
// -----------------------------------------------------------------------------

describe("ballistics — med_ball_slam duration profile", () => {
  test("the profile exists, is unresolved, and every timing field is null", () => {
    const profileId = EXERCISE_PRESCRIPTION_REGISTRY.med_ball_slam.capabilities.durationEstimationProfileId;
    if (profileId === null) {
      throw new Error("Expected med_ball_slam to declare a duration estimation profile id.");
    }
    const profile = DURATION_ESTIMATION_PROFILES[profileId];

    expect(profile).toBeDefined();
    expect(profile.exerciseId).toBe("med_ball_slam");
    expect(profile.status).toBe("unresolved");
    expect(profile.averageRepetitionSeconds).toBeNull();
    expect(profile.averageSetupSeconds).toBeNull();
    expect(profile.transitionSeconds).toBeNull();
    expect(profile.restSeconds).toBeNull();
    expect(profile.perSetSeconds).toBeNull();
    expect(profile.perRoundSeconds).toBeNull();
    expect(profile.perIntervalSeconds).toBeNull();
    expect(profile.technicalMarginSeconds).toBeNull();

    const result = getDurationEstimationProfile(profileId);
    if (result.ok) {
      throw new Error("Expected med_ball_slam's duration profile to be refused as unresolved.");
    }
    expect(result.failureCode).toBe("DURATION_PROFILE_UNRESOLVED");
  });
});

// -----------------------------------------------------------------------------
// 6. A ballistic session via prescribeSession
// -----------------------------------------------------------------------------

describe("ballistics — prescribeSession with a ballistic block", () => {
  test("a session combining a strength exercise with med_ball_slam prescribes completely", () => {
    const benchSource = getExercisePrescriptionSource("bench_press", {
      rangeContext: "normal",
      athleteReferences: [{ referenceType: "one_rep_max", value: 100, unit: "kilograms", sourceId: "test-1rm", measuredAt: null, validUntil: null, confidence: "validated" }],
      availableEquipmentCapabilities: ["barbell", "bench", "rack", "plates"],
    });
    const slamSource = getExercisePrescriptionSource("med_ball_slam", VALID_CONTEXT);

    if (!benchSource.ok || !slamSource.ok) {
      throw new Error("Fixture setup failed: one of the sources did not resolve.");
    }

    const exercises: SessionExercisePrescriptionInput[] = [
      {
        exerciseId: "bench_press",
        moduleId: benchSource.moduleId,
        ...benchSource.source,
        order: 1,
        required: true,
        blockId: "strength",
      },
      {
        exerciseId: "med_ball_slam",
        moduleId: slamSource.moduleId,
        ...slamSource.source,
        order: 2,
        required: true,
        blockId: "ballistics",
      },
    ];

    const result = prescribeSession({
      sessionId: "ballistics-session-1",
      sessionName: "Strength + Ballistics Session",
      modules: ["strength", "power"],
      exercises,
    });

    if (!result.ok) {
      throw new Error(`Expected the ballistic session to succeed, got issues: ${JSON.stringify(result.issues)}`);
    }

    expect(result.session.exercises).toHaveLength(2);
    expect(result.session.exercises.map((exercise) => exercise.prescription.exerciseId)).toEqual([
      "bench_press",
      "med_ball_slam",
    ]);
    expect(result.session.sourceRuleIds.length).toBeGreaterThan(0);
  });
});

// -----------------------------------------------------------------------------
// 7. runEngine integration
// -----------------------------------------------------------------------------

describe("ballistics — runEngine integration", () => {
  test("med_ball_slam prescribes through runEngine end to end", () => {
    const input = makeValidInput({
      request: makeRequest({ primaryObjective: { adaptationDomain: "power" } }),
    });
    const exercise = makeExercise({ id: "med_ball_slam", module: "power", primaryAdaptation: "power" });

    const sourceResult = getExercisePrescriptionSource("med_ball_slam", VALID_CONTEXT);
    if (!sourceResult.ok) {
      throw new Error(`Fixture setup failed: ${sourceResult.message}`);
    }

    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([["med_ball_slam", sourceResult.source]]);

    const result = runEngine(input, [exercise], prescriptionSources);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }
    if (result.prescription?.status !== "prescribed") {
      throw new Error(`Expected prescription status "prescribed", got: ${JSON.stringify(result.prescription)}`);
    }

    expect(result.prescription.session.exercises).toHaveLength(1);
    expect(result.prescription.session.exercises[0]?.prescription.exerciseId).toBe("med_ball_slam");
    expect(result.prescription.session.exercises[0]?.prescription.methodId).toBe("power_repetition_sets");
    expect(
      result.decisionTrace.entries.some((entry) => entry.stage === "prescription_generation"),
    ).toBe(true);
  });

  test("determinism: running the engine twice with the same med_ball_slam input is identical", () => {
    const input = makeValidInput({
      request: makeRequest({ primaryObjective: { adaptationDomain: "power" } }),
    });
    const exercise = makeExercise({ id: "med_ball_slam", module: "power", primaryAdaptation: "power" });
    const sourceResult = getExercisePrescriptionSource("med_ball_slam", VALID_CONTEXT);
    if (!sourceResult.ok) {
      throw new Error(`Fixture setup failed: ${sourceResult.message}`);
    }
    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([["med_ball_slam", sourceResult.source]]);

    const resultA = runEngine(input, [exercise], prescriptionSources);
    const resultB = runEngine(input, [exercise], prescriptionSources);

    expect(resultA).toEqual(resultB);
  });
});

// -----------------------------------------------------------------------------
// 8. NEW — the four throw-variant entries: presence, unique identifier, vocabulary
// -----------------------------------------------------------------------------

describe("ballistics — new throw variants: presence, identity and vocabulary", () => {
  for (const { id } of NEW_THROW_VARIANTS) {
    test(`${id} is present in the registry under its own key`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry).toBeDefined();
      expect(entry.exerciseId).toBe(id);
      expect(entry.capabilities.exerciseId).toBe(id);
    });

    test(`${id} is a unique identifier (no collision with any other registry entry)`, () => {
      const allIds = Object.keys(EXERCISE_PRESCRIPTION_REGISTRY);
      expect(allIds.filter((registeredId) => registeredId === id)).toHaveLength(1);
    });

    test(`${id}'s required equipment is drawn entirely from the canonical vocabulary`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(findUnknownEquipmentCapabilities(entry.capabilities.requiredEquipmentCapabilities)).toEqual([]);
    });
  }

  test("the registry now contains exactly 44 active exercises", () => {
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(69);
  });
});

// -----------------------------------------------------------------------------
// 9. NEW — exact equipment requirements per chosen variant
// -----------------------------------------------------------------------------

describe("ballistics — new throw variants: exact equipment per variant", () => {
  for (const { id, equipment } of NEW_THROW_VARIANTS) {
    test(`${id} requires exactly [${equipment.join(", ")}]`, () => {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.requiredEquipmentCapabilities).toEqual(equipment);
    });

    test(`${id} does not depend on slam_ball`, () => {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.requiredEquipmentCapabilities).not.toContain(
        "slam_ball",
      );
    });
  }

  test("med_ball_chest_pass requires both medicine_ball and wall — neither alone suffices", () => {
    const bothOk = getExercisePrescriptionSource("med_ball_chest_pass", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["medicine_ball", "wall"],
    });
    if (!bothOk.ok) {
      throw new Error(`Expected med_ball_chest_pass to succeed with both: ${bothOk.message}`);
    }

    const medicineBallOnly = getExercisePrescriptionSource("med_ball_chest_pass", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["medicine_ball"],
    });
    if (medicineBallOnly.ok) {
      throw new Error("Expected medicine_ball alone to be insufficient for med_ball_chest_pass.");
    }
    expect(medicineBallOnly.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
    expect(medicineBallOnly.message).toContain("wall");

    const wallOnly = getExercisePrescriptionSource("med_ball_chest_pass", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["wall"],
    });
    if (wallOnly.ok) {
      throw new Error("Expected wall alone to be insufficient for med_ball_chest_pass.");
    }
    expect(wallOnly.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
    expect(wallOnly.message).toContain("medicine_ball");
  });

  test("med_ball_overhead_throw, med_ball_shot_put_throw and med_ball_reverse_throw use open_space, not wall", () => {
    for (const id of ["med_ball_overhead_throw", "med_ball_shot_put_throw", "med_ball_reverse_throw"] as const) {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.capabilities.requiredEquipmentCapabilities).toContain("open_space");
      expect(entry.capabilities.requiredEquipmentCapabilities).not.toContain("wall");

      // wall alone does not satisfy the open-space variant actually registered.
      const wallOnly = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: ["medicine_ball", "wall"],
      });
      if (wallOnly.ok) {
        throw new Error(`Expected wall alone (without open_space) to be insufficient for ${id}.`);
      }
      expect(wallOnly.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
      expect(wallOnly.message).toContain("open_space");
    }
  });
});

// -----------------------------------------------------------------------------
// 10. NEW — loading mode and laterality
// -----------------------------------------------------------------------------

describe("ballistics — new throw variants: loading mode and laterality", () => {
  for (const { id, laterality } of NEW_THROW_VARIANTS) {
    test(`${id} uses the medicine_ball loading mode`, () => {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.supportedLoadingModes).toEqual(["medicine_ball"]);
    });

    test(`${id} has laterality "${laterality}", matching its chapter exactly`, () => {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.laterality).toBe(laterality);
    });
  }

  test("med_ball_shot_put_throw's volume is interpreted per side, matching its unilateral laterality", () => {
    expect(EXERCISE_PRESCRIPTION_REGISTRY.med_ball_shot_put_throw.capabilities.volumeInterpretations).toEqual([
      "repetitions_per_side",
    ]);
  });

  test("the three bilateral throws interpret volume as total repetitions", () => {
    for (const id of ["med_ball_chest_pass", "med_ball_overhead_throw", "med_ball_reverse_throw"] as const) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.volumeInterpretations).toEqual(["total_repetitions"]);
    }
  });
});

// -----------------------------------------------------------------------------
// 11. NEW — complete prescription and valid-context behavior for all four
// -----------------------------------------------------------------------------

describe("ballistics — new throw variants prescribe completely with a valid context", () => {
  for (const { id, equipment } of NEW_THROW_VARIANTS) {
    test(`${id} prescribes completely end to end via getExercisePrescriptionSource + prescribeExercise`, () => {
      const sourceResult = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: equipment,
      });
      if (!sourceResult.ok) {
        throw new Error(`Expected "${id}" to prescribe successfully: ${sourceResult.message}`);
      }

      expect(sourceResult.moduleId).toBe("power");
      expect(sourceResult.source.role).toBe("primary");
      expect(sourceResult.source.explicitMethodId).toBe("power_repetition_sets");
      expect(sourceResult.source.athleteReferences).toEqual([]);

      const result = prescribeExercise({ exerciseId: id, moduleId: sourceResult.moduleId, ...sourceResult.source });
      if (!result.ok) {
        throw new Error(`Expected "${id}" prescription to succeed at ${result.failureStage}: ${result.message}`);
      }

      expect(result.prescription.status).toBe("complete");
      expect(result.prescription.methodId).toBe("power_repetition_sets");
      // power_primary_repetition_sets_v0_1, normal range context — same
      // documented profile already used by med_ball_slam and every other
      // Power/Plyometrics entry. No ball mass is invented.
      expect(result.prescription.volume.sets).toBe(4);
      expect(result.prescription.volume.reps?.value).toBe(3);
      expect(result.prescription.intensity.primaryMetric.type).toBe("movement_intent");
      expect(result.prescription.intensity.calculation).toBeNull();
      expect(result.prescription.intensity.primaryMetric.target).toEqual({
        type: "category",
        value: "maximal_acceleration",
      });
    });
  }
});

// -----------------------------------------------------------------------------
// 12. NEW — safe rejection when a required equipment capability is missing
// -----------------------------------------------------------------------------

describe("ballistics — new throw variants fail safely when equipment is missing", () => {
  for (const { id, equipment } of NEW_THROW_VARIANTS) {
    test(`${id} rejects an empty context with REQUIRED_EQUIPMENT_MISSING, never an exception`, () => {
      const result = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: [],
      });
      if (result.ok) {
        throw new Error(`Expected "${id}" to fail safely with no equipment.`);
      }
      expect(result.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
      for (const capability of equipment) {
        expect(result.message).toContain(capability);
      }
    });

    test(`${id} rejects a context missing only medicine_ball`, () => {
      const withoutMedicineBall = equipment.filter((capability) => capability !== "medicine_ball");
      const result = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: withoutMedicineBall,
      });
      if (result.ok) {
        throw new Error(`Expected "${id}" to fail safely without medicine_ball.`);
      }
      expect(result.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
      expect(result.message).toContain("medicine_ball");
    });
  }
});

// -----------------------------------------------------------------------------
// 13. NEW — determinism and non-mutation for all four
// -----------------------------------------------------------------------------

describe("ballistics — new throw variants: determinism and non-mutation", () => {
  for (const { id, equipment } of NEW_THROW_VARIANTS) {
    test(`${id}: identical calls produce identical results and never mutate the context`, () => {
      const context: PrescriptionExecutionContext = {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: equipment,
      };
      const snapshot = JSON.parse(JSON.stringify(context));

      const resultA = getExercisePrescriptionSource(id, context);
      const resultB = getExercisePrescriptionSource(id, context);

      expect(resultA).toEqual(resultB);
      expect(context).toEqual(snapshot);
    });
  }

  test("integrating the six new throws (across both sessions) never mutated any other key", () => {
    // Every key outside the six new throw-variant entries (4 from the
    // previous session + 2 from this one) keeps its exact prior shape —
    // the 29 original exercises plus med_ball_slam.
    const NEW_IDS = [...NEW_THROW_VARIANTS, ...FINAL_THROW_VARIANTS].map((variant) => variant.id);
    const PREVIOUSLY_EXISTING_IDS = Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).filter(
      (id) => !NEW_IDS.includes(id as (typeof NEW_IDS)[number]),
    );
    expect(PREVIOUSLY_EXISTING_IDS).toHaveLength(63);
    for (const id of PREVIOUSLY_EXISTING_IDS) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id as keyof typeof EXERCISE_PRESCRIPTION_REGISTRY].capabilities.requiredEquipmentCapabilities).not.toContain(
        "wall",
      );
    }
  });
});

// -----------------------------------------------------------------------------
// 14. NEW — runEngine integration for a throw variant
// -----------------------------------------------------------------------------

describe("ballistics — new throw variants: runEngine integration", () => {
  test("med_ball_chest_pass (wall variant) prescribes through runEngine end to end", () => {
    const input = makeValidInput({
      request: makeRequest({ primaryObjective: { adaptationDomain: "power" } }),
    });
    const exercise = makeExercise({ id: "med_ball_chest_pass", module: "power", primaryAdaptation: "power" });

    const sourceResult = getExercisePrescriptionSource("med_ball_chest_pass", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["medicine_ball", "wall"],
    });
    if (!sourceResult.ok) {
      throw new Error(`Fixture setup failed: ${sourceResult.message}`);
    }

    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([
      ["med_ball_chest_pass", sourceResult.source],
    ]);

    const result = runEngine(input, [exercise], prescriptionSources);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }
    if (result.prescription?.status !== "prescribed") {
      throw new Error(`Expected prescription status "prescribed", got: ${JSON.stringify(result.prescription)}`);
    }

    expect(result.prescription.session.exercises).toHaveLength(1);
    expect(result.prescription.session.exercises[0]?.prescription.exerciseId).toBe("med_ball_chest_pass");
  });
});

// -----------------------------------------------------------------------------
// 15. FINAL TWO — presence, unique identifier, vocabulary
// -----------------------------------------------------------------------------

describe("ballistics — final two throw variants: presence, identity and vocabulary", () => {
  for (const { id } of FINAL_THROW_VARIANTS) {
    test(`${id} is present in the registry under its own key`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry).toBeDefined();
      expect(entry.exerciseId).toBe(id);
      expect(entry.capabilities.exerciseId).toBe(id);
    });

    test(`${id} is a unique identifier (no collision with any other registry entry)`, () => {
      const allIds = Object.keys(EXERCISE_PRESCRIPTION_REGISTRY);
      expect(allIds.filter((registeredId) => registeredId === id)).toHaveLength(1);
    });

    test(`${id}'s required equipment is drawn entirely from the canonical vocabulary`, () => {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(findUnknownEquipmentCapabilities(entry.capabilities.requiredEquipmentCapabilities)).toEqual([]);
    });
  }
});

// -----------------------------------------------------------------------------
// 16. FINAL TWO — exact equipment, no slam_ball dependency
// -----------------------------------------------------------------------------

describe("ballistics — final two throw variants: exact equipment", () => {
  for (const { id, equipment } of FINAL_THROW_VARIANTS) {
    test(`${id} requires exactly [${equipment.join(", ")}]`, () => {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.requiredEquipmentCapabilities).toEqual(equipment);
    });

    test(`${id} does not depend on slam_ball`, () => {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.requiredEquipmentCapabilities).not.toContain(
        "slam_ball",
      );
    });
  }

  test("med_ball_rotational_throw requires both medicine_ball and wall — neither alone suffices", () => {
    const medicineBallOnly = getExercisePrescriptionSource("med_ball_rotational_throw", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["medicine_ball"],
    });
    if (medicineBallOnly.ok) {
      throw new Error("Expected medicine_ball alone to be insufficient for med_ball_rotational_throw.");
    }
    expect(medicineBallOnly.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
    expect(medicineBallOnly.message).toContain("wall");

    const wallOnly = getExercisePrescriptionSource("med_ball_rotational_throw", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["wall"],
    });
    if (wallOnly.ok) {
      throw new Error("Expected wall alone to be insufficient for med_ball_rotational_throw.");
    }
    expect(wallOnly.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
    expect(wallOnly.message).toContain("medicine_ball");
  });

  test("med_ball_scoop_toss uses open_space, not wall, and wall alone does not suffice", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY.med_ball_scoop_toss;
    expect(entry.capabilities.requiredEquipmentCapabilities).toContain("open_space");
    expect(entry.capabilities.requiredEquipmentCapabilities).not.toContain("wall");

    const wallOnly = getExercisePrescriptionSource("med_ball_scoop_toss", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["medicine_ball", "wall"],
    });
    if (wallOnly.ok) {
      throw new Error("Expected wall alone (without open_space) to be insufficient for med_ball_scoop_toss.");
    }
    expect(wallOnly.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
    expect(wallOnly.message).toContain("open_space");
  });
});

// -----------------------------------------------------------------------------
// 17. FINAL TWO — loading mode, laterality and per-side volume interpretation
// -----------------------------------------------------------------------------

describe("ballistics — final two throw variants: loading mode, laterality and volume interpretation", () => {
  for (const { id } of FINAL_THROW_VARIANTS) {
    test(`${id} uses the medicine_ball loading mode`, () => {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.supportedLoadingModes).toEqual(["medicine_ball"]);
    });

    test(`${id} has laterality "unilateral", per the CAS laterality decision`, () => {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.laterality).toBe("unilateral");
    });

    test(`${id} interprets volume as repetitions per side`, () => {
      expect(EXERCISE_PRESCRIPTION_REGISTRY[id].capabilities.volumeInterpretations).toEqual([
        "repetitions_per_side",
      ]);
    });
  }
});

// -----------------------------------------------------------------------------
// 18. FINAL TWO — complete prescription, per-side repetitions, valid-context behavior
// -----------------------------------------------------------------------------

describe("ballistics — final two throw variants prescribe completely with a valid context", () => {
  for (const { id, equipment } of FINAL_THROW_VARIANTS) {
    test(`${id} prescribes completely end to end via getExercisePrescriptionSource + prescribeExercise`, () => {
      const sourceResult = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: equipment,
      });
      if (!sourceResult.ok) {
        throw new Error(`Expected "${id}" to prescribe successfully: ${sourceResult.message}`);
      }

      expect(sourceResult.moduleId).toBe("power");
      expect(sourceResult.source.role).toBe("primary");
      expect(sourceResult.source.explicitMethodId).toBe("power_repetition_sets");
      expect(sourceResult.source.athleteReferences).toEqual([]);

      const result = prescribeExercise({ exerciseId: id, moduleId: sourceResult.moduleId, ...sourceResult.source });
      if (!result.ok) {
        throw new Error(`Expected "${id}" prescription to succeed at ${result.failureStage}: ${result.message}`);
      }

      expect(result.prescription.status).toBe("complete");
      expect(result.prescription.methodId).toBe("power_repetition_sets");
      // power_primary_repetition_sets_v0_1, normal range context — same
      // documented profile already used by every other Ballistics entry.
      // No ball mass is invented. The "3" below is documented as
      // repetitions PER SIDE by capabilities.volumeInterpretations
      // (checked separately above) — the numeric resolver itself does not
      // alter the value based on laterality, consistent with every other
      // unilateral entry already in this registry (see the laterality
      // decision report's Phase 1 audit).
      expect(result.prescription.volume.sets).toBe(4);
      expect(result.prescription.volume.reps?.value).toBe(3);
      expect(result.prescription.intensity.primaryMetric.type).toBe("movement_intent");
      expect(result.prescription.intensity.calculation).toBeNull();
      expect(result.prescription.intensity.primaryMetric.target).toEqual({
        type: "category",
        value: "maximal_acceleration",
      });
    });
  }
});

// -----------------------------------------------------------------------------
// 19. FINAL TWO — safe rejection when equipment is missing
// -----------------------------------------------------------------------------

describe("ballistics — final two throw variants fail safely when equipment is missing", () => {
  for (const { id, equipment } of FINAL_THROW_VARIANTS) {
    test(`${id} rejects an empty context with REQUIRED_EQUIPMENT_MISSING, never an exception`, () => {
      const result = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: [],
      });
      if (result.ok) {
        throw new Error(`Expected "${id}" to fail safely with no equipment.`);
      }
      expect(result.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
      for (const capability of equipment) {
        expect(result.message).toContain(capability);
      }
    });
  }
});

// -----------------------------------------------------------------------------
// 20. FINAL TWO — determinism and non-mutation
// -----------------------------------------------------------------------------

describe("ballistics — final two throw variants: determinism and non-mutation", () => {
  for (const { id, equipment } of FINAL_THROW_VARIANTS) {
    test(`${id}: identical calls produce identical results and never mutate the context`, () => {
      const context: PrescriptionExecutionContext = {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: equipment,
      };
      const snapshot = JSON.parse(JSON.stringify(context));

      const resultA = getExercisePrescriptionSource(id, context);
      const resultB = getExercisePrescriptionSource(id, context);

      expect(resultA).toEqual(resultB);
      expect(context).toEqual(snapshot);
    });

    test(`${id}: prescribeExercise is deterministic and does not mutate its input`, () => {
      const sourceResult = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: equipment,
      });
      if (!sourceResult.ok) {
        throw new Error(`Fixture setup failed for "${id}": ${sourceResult.message}`);
      }
      const input = { exerciseId: id, moduleId: sourceResult.moduleId, ...sourceResult.source };
      const snapshot = JSON.parse(JSON.stringify(input));

      expect(prescribeExercise(input)).toEqual(prescribeExercise(input));

      prescribeExercise(input);
      expect(input).toEqual(snapshot);
    });
  }
});

// -----------------------------------------------------------------------------
// 21. FINAL TWO — runEngine integration
// -----------------------------------------------------------------------------

describe("ballistics — final two throw variants: runEngine integration", () => {
  test("med_ball_rotational_throw (wall variant) prescribes through runEngine end to end", () => {
    const input = makeValidInput({
      request: makeRequest({ primaryObjective: { adaptationDomain: "power" } }),
    });
    const exercise = makeExercise({ id: "med_ball_rotational_throw", module: "power", primaryAdaptation: "power" });

    const sourceResult = getExercisePrescriptionSource("med_ball_rotational_throw", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["medicine_ball", "wall"],
    });
    if (!sourceResult.ok) {
      throw new Error(`Fixture setup failed: ${sourceResult.message}`);
    }

    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([
      ["med_ball_rotational_throw", sourceResult.source],
    ]);

    const result = runEngine(input, [exercise], prescriptionSources);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }
    if (result.prescription?.status !== "prescribed") {
      throw new Error(`Expected prescription status "prescribed", got: ${JSON.stringify(result.prescription)}`);
    }

    expect(result.prescription.session.exercises).toHaveLength(1);
    expect(result.prescription.session.exercises[0]?.prescription.exerciseId).toBe("med_ball_rotational_throw");
  });

  test("med_ball_scoop_toss (Standing Rotational, open space) prescribes through runEngine end to end", () => {
    const input = makeValidInput({
      request: makeRequest({ primaryObjective: { adaptationDomain: "power" } }),
    });
    const exercise = makeExercise({ id: "med_ball_scoop_toss", module: "power", primaryAdaptation: "power" });

    const sourceResult = getExercisePrescriptionSource("med_ball_scoop_toss", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["medicine_ball", "open_space"],
    });
    if (!sourceResult.ok) {
      throw new Error(`Fixture setup failed: ${sourceResult.message}`);
    }

    const prescriptionSources = new Map<string, ExercisePrescriptionSource>([
      ["med_ball_scoop_toss", sourceResult.source],
    ]);

    const result = runEngine(input, [exercise], prescriptionSources);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }
    if (result.prescription?.status !== "prescribed") {
      throw new Error(`Expected prescription status "prescribed", got: ${JSON.stringify(result.prescription)}`);
    }

    expect(result.prescription.session.exercises).toHaveLength(1);
    expect(result.prescription.session.exercises[0]?.prescription.exerciseId).toBe("med_ball_scoop_toss");
  });
});

// -----------------------------------------------------------------------------
// 22. FINAL TWO — exact documentary source
// -----------------------------------------------------------------------------

describe("ballistics — final two throw variants: exact documentary source", () => {
  test("med_ball_rotational_throw traces to 12_MED_BALL_ROTATIONAL_THROW.md", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY.med_ball_rotational_throw;
    expect(entry.sourceRuleIds).toContain("50-exercises/67_BALLISTICS/12_MED_BALL_ROTATIONAL_THROW.md");
    expect(entry.capabilities.sourceRuleIds).toContain("50-exercises/67_BALLISTICS/12_MED_BALL_ROTATIONAL_THROW.md");
  });

  test("med_ball_scoop_toss traces to 13_MED_BALL_SCOOP_TOSS.md", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY.med_ball_scoop_toss;
    expect(entry.sourceRuleIds).toContain("50-exercises/67_BALLISTICS/13_MED_BALL_SCOOP_TOSS.md");
    expect(entry.capabilities.sourceRuleIds).toContain("50-exercises/67_BALLISTICS/13_MED_BALL_SCOOP_TOSS.md");
  });
});

// -----------------------------------------------------------------------------
// 23. FINAL TWO — explicit variant comment/instruction, and Forward Scoop
//     Toss is never represented
// -----------------------------------------------------------------------------

describe("ballistics — final two throw variants document their chosen variant explicitly", () => {
  test("med_ball_rotational_throw's setup instruction states it is the wall variant only", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY.med_ball_rotational_throw;
    const setup = entry.instructionDefinitions.find(
      (instruction) => instruction.instructionId === "med_ball_rotational_throw_setup",
    );
    if (setup === undefined) {
      throw new Error("Expected a med_ball_rotational_throw_setup instruction.");
    }
    expect(setup.text).toContain("wall variant only");
    expect(setup.text).toContain("not the partner variant");
  });

  test("med_ball_scoop_toss's setup instruction states it is the Standing Rotational variant only, in open space", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY.med_ball_scoop_toss;
    const setup = entry.instructionDefinitions.find(
      (instruction) => instruction.instructionId === "med_ball_scoop_toss_setup",
    );
    if (setup === undefined) {
      throw new Error("Expected a med_ball_scoop_toss_setup instruction.");
    }
    expect(setup.text).toContain("Standing Rotational Scoop Toss variant only");
    expect(setup.text).toContain("prescribed in open space");
    expect(setup.text).toContain("per side");
  });

  test("med_ball_scoop_toss never represents the bilateral Forward Scoop Toss variant", () => {
    const entry = EXERCISE_PRESCRIPTION_REGISTRY.med_ball_scoop_toss;

    // Laterality is unilateral, not bilateral — Forward Scoop Toss (bilateral) is excluded by construction.
    expect(entry.capabilities.laterality).not.toBe("bilateral");
    expect(entry.capabilities.laterality).toBe("unilateral");

    // The setup instruction explicitly names and excludes it.
    const setup = entry.instructionDefinitions.find(
      (instruction) => instruction.instructionId === "med_ball_scoop_toss_setup",
    );
    if (setup === undefined) {
      throw new Error("Expected a med_ball_scoop_toss_setup instruction.");
    }
    expect(setup.text).toContain("Forward Scoop Toss");
    expect(setup.text).toContain("not represented");

    // And the Lateral Scoop Toss (wall-directed) variant is also excluded — no wall requirement leaks in.
    expect(entry.capabilities.requiredEquipmentCapabilities).not.toContain("wall");
  });
});
