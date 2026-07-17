/**
 * Combat Athlete System — Ballistics Family Integration Tests
 *
 * Covers the outcome of the Ballistics (`50-exercises/67_BALLISTICS/`)
 * integrability audit: of the 7 documented medicine-ball exercises, only
 * `med_ball_slam` was integrated into `EXERCISE_PRESCRIPTION_REGISTRY`.
 *
 * The other six chapters (Chest Pass, Overhead Throw, Rotational Throw,
 * Scoop Toss, Shot-Put Throw, Reverse Throw) all require a standard,
 * rebounding-capable medicine ball as their primary implement, and no
 * canonical equipment capability id represents that in
 * `equipmentCapabilities.ts` today — only `"slam_ball"` exists there,
 * documented specifically as a *non-rebounding* implement for the Slam.
 * Integrating those six would have required inventing new equipment
 * vocabulary, which this task's integration step explicitly forbids. This
 * file asserts both halves of that outcome: `med_ball_slam` prescribes
 * completely end to end, and the other six remain honestly unavailable.
 */

import { describe, expect, test } from "vitest";

import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  getExercisePrescriptionSource,
  isPilotExerciseId,
  type PrescriptionExecutionContext,
} from "../../prescription/exercisePrescriptionRegistry";
import { prescribeExercise } from "../../prescription/prescribeExercise";
import { prescribeSession, type SessionExercisePrescriptionInput } from "../../prescription/prescribeSession";
import { DURATION_ESTIMATION_PROFILES, getDurationEstimationProfile } from "../../prescription/durationEstimationProfiles";
import { getTrainingMethodContract } from "../../prescription/contracts";
import type { ExercisePrescriptionSource } from "../../prescription/buildPrescriptionInput";

import { runEngine } from "../../index";
import { makeExercise, makeRequest, makeValidInput } from "../fixtures";

const VALID_CONTEXT: PrescriptionExecutionContext = {
  rangeContext: "normal",
  athleteReferences: [],
  availableEquipmentCapabilities: ["slam_ball", "safe_landing_surface"],
};

// The six Ballistics chapters that were audited and explicitly not
// integrated — see the integrability report for the equipment-vocabulary
// reason common to all six.
const NON_INTEGRATED_BALLISTIC_IDS = [
  "med_ball_chest_pass",
  "med_ball_overhead_throw",
  "med_ball_rotational_throw",
  "med_ball_scoop_toss",
  "med_ball_shot_put_throw",
  "med_ball_reverse_throw",
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
// 8. The six non-integrated Ballistics exercises stay unavailable
// -----------------------------------------------------------------------------

describe("ballistics — the six non-integrated exercises stay unavailable", () => {
  for (const id of NON_INTEGRATED_BALLISTIC_IDS) {
    test(`${id} is not a registered pilot exercise id`, () => {
      expect(isPilotExerciseId(id)).toBe(false);
    });

    test(`${id}: getExercisePrescriptionSource reports EXERCISE_NOT_IN_REGISTRY without throwing`, () => {
      const result = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: [],
      });

      if (result.ok) {
        throw new Error(`Expected "${id}" to be reported as not in the registry.`);
      }
      expect(result.failureCode).toBe("EXERCISE_NOT_IN_REGISTRY");
    });

    test(`${id}: runEngine keeps its prescription unavailable, never fabricated`, () => {
      const input = makeValidInput();
      const exercise = makeExercise({ id });

      const result = runEngine(input, [exercise], new Map());

      if (result.outcome !== "draft") {
        throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
      }
      if (result.prescription?.status !== "unavailable") {
        throw new Error(`Expected prescription status "unavailable", got: ${JSON.stringify(result.prescription)}`);
      }
      expect(result.prescription.missingSourceData.some((gap) => gap.exerciseId === id)).toBe(true);
    });
  }
});
