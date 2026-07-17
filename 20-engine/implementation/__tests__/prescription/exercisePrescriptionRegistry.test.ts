import { describe, expect, test } from "vitest";

import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  PILOT_EXERCISE_IDS,
  getExercisePrescriptionSource,
  type PrescriptionExecutionContext,
} from "../../prescription/exercisePrescriptionRegistry";
import {
  getTrainingMethodContract,
  isMethodAuthorizedForModule,
  isRoleAuthorizedForModuleMethod,
  validateMethodModuleRoleContract,
} from "../../prescription/contracts";
import { getNumericalPrescriptionProfile } from "../../prescription/prescriptionKnowledge";
import { makeOneRepMaxReference } from "./fixtures";

const NO_ATHLETE_REFERENCE_CONTEXT = (equipment: readonly string[]): PrescriptionExecutionContext => ({
  rangeContext: "normal",
  athleteReferences: [],
  availableEquipmentCapabilities: equipment,
});

const ONE_REP_MAX_CONTEXT = (equipment: readonly string[]): PrescriptionExecutionContext => ({
  rangeContext: "normal",
  athleteReferences: [makeOneRepMaxReference({ value: 100 })],
  availableEquipmentCapabilities: equipment,
});

describe("exercisePrescriptionRegistry — registry integrity", () => {
  test("1. deterministic: identical calls produce identical results", () => {
    const context = ONE_REP_MAX_CONTEXT(["barbell", "bench", "rack", "weight_plates"]);

    const resultA = getExercisePrescriptionSource("bench_press", context);
    const resultB = getExercisePrescriptionSource("bench_press", context);

    expect(resultA).toEqual(resultB);
  });

  test("2. pilot exercise identifiers are unique and self-consistent", () => {
    const uniqueIds = new Set(PILOT_EXERCISE_IDS);
    expect(uniqueIds.size).toBe(PILOT_EXERCISE_IDS.length);

    for (const [key, entry] of Object.entries(EXERCISE_PRESCRIPTION_REGISTRY)) {
      expect(entry.exerciseId).toBe(key);
      expect(entry.capabilities.exerciseId).toBe(key);
    }
  });

  test("3. no registry entry is incomplete: every required instruction/stop-condition id resolves to a real definition", () => {
    for (const entry of Object.values(EXERCISE_PRESCRIPTION_REGISTRY)) {
      const instructionIds = new Set(entry.instructionDefinitions.map((instruction) => instruction.instructionId));
      for (const requiredId of entry.capabilities.requiredInstructionIds) {
        expect(instructionIds.has(requiredId)).toBe(true);
      }

      const stopConditionIds = new Set(entry.stopConditionDefinitions.map((condition) => condition.conditionId));
      for (const requiredId of entry.capabilities.requiredStopConditionIds) {
        expect(stopConditionIds.has(requiredId)).toBe(true);
      }

      // Every stop-condition category the resolved method requires is covered.
      const method = getTrainingMethodContract(entry.explicitMethodId);
      const coveredCategories = new Set(entry.stopConditionDefinitions.map((condition) => condition.category));
      for (const requiredCategory of method.requiredStopConditionCategories) {
        expect(coveredCategories.has(requiredCategory)).toBe(true);
      }

      expect(entry.instructionDefinitions.length).toBeGreaterThan(0);
      expect(entry.sourceRuleIds.length).toBeGreaterThan(0);
    }
  });

  test("12. every registry entry uses a method actually authorized for its module and role", () => {
    for (const entry of Object.values(EXERCISE_PRESCRIPTION_REGISTRY)) {
      expect(isMethodAuthorizedForModule(entry.moduleId, entry.explicitMethodId)).toBe(true);
      expect(isRoleAuthorizedForModuleMethod(entry.moduleId, entry.explicitMethodId, entry.role)).toBe(true);
    }
  });

  test("13. every registry entry is compatible with its module/method/role contract", () => {
    for (const entry of Object.values(EXERCISE_PRESCRIPTION_REGISTRY)) {
      const contractCheck = validateMethodModuleRoleContract(entry.moduleId, entry.explicitMethodId, entry.role);
      expect(contractCheck.valid).toBe(true);
    }
  });

  test("14. every registry entry has a matching documented numerical profile", () => {
    for (const entry of Object.values(EXERCISE_PRESCRIPTION_REGISTRY)) {
      const profile = getNumericalPrescriptionProfile(entry.moduleId, entry.explicitMethodId, entry.role);
      expect(profile).not.toBeNull();
    }
  });

  test("11. no exercise claims an absolute-load intensity type unless it is barbell-loaded and documented as such", () => {
    const loadTypes = ["absolute_load", "percentage_1rm", "percentage_training_max", "percentage_body_mass"];

    // Bodyweight/implement exercises never claim a load-based intensity type.
    for (const id of ["pull_up", "farmer_carry", "pallof_press", "box_jump"] as const) {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      const claimedLoadTypes = entry.supportedIntensityTypes.filter((type) => loadTypes.includes(type));
      expect(claimedLoadTypes).toEqual([]);
    }

    // Barbell exercises document percentage_1rm and require the matching athlete reference.
    for (const id of ["bench_press", "back_squat", "trap_bar_deadlift"] as const) {
      const entry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      expect(entry.supportedIntensityTypes).toContain("percentage_1rm");
      expect(entry.capabilities.requiredAthleteReferenceTypes).toContain("one_rep_max");
    }
  });
});

describe("exercisePrescriptionRegistry — getExercisePrescriptionSource", () => {
  test("4. returns a complete source for a strength exercise given a valid one-rep-max reference", () => {
    const context = ONE_REP_MAX_CONTEXT(["barbell", "bench", "rack", "weight_plates"]);
    const result = getExercisePrescriptionSource("bench_press", context);

    if (!result.ok) {
      throw new Error(`Expected success, got failure: ${result.message}`);
    }

    expect(result.moduleId).toBe("strength");
    expect(result.source.role).toBe("primary");
    expect(result.source.explicitMethodId).toBe("straight_sets_repetitions");
    expect(result.source.athleteReferences).toHaveLength(1);
  });

  test("5. returns a complete source for the power exercise (Box Jump) with no athlete reference required", () => {
    const context = NO_ATHLETE_REFERENCE_CONTEXT(["plyometric_box"]);
    const result = getExercisePrescriptionSource("box_jump", context);

    if (!result.ok) {
      throw new Error(`Expected success, got failure: ${result.message}`);
    }

    expect(result.moduleId).toBe("power");
    expect(result.source.explicitMethodId).toBe("power_repetition_sets");
    expect(result.source.supportedIntensityTypes).toEqual(["movement_intent"]);
  });

  test("6. returns a complete source for Farmer Carry", () => {
    const context = NO_ATHLETE_REFERENCE_CONTEXT(["farmer_carry_implements"]);
    const result = getExercisePrescriptionSource("farmer_carry", context);

    if (!result.ok) {
      throw new Error(`Expected success, got failure: ${result.message}`);
    }

    expect(result.moduleId).toBe("grip");
    expect(result.source.explicitMethodId).toBe("distance_carry_sets");
  });

  test("7. returns a complete source for Pallof Press", () => {
    const context = NO_ATHLETE_REFERENCE_CONTEXT(["cable_machine_or_resistance_band"]);
    const result = getExercisePrescriptionSource("pallof_press", context);

    if (!result.ok) {
      throw new Error(`Expected success, got failure: ${result.message}`);
    }

    expect(result.moduleId).toBe("core");
    expect(result.source.role).toBe("robustness");
    expect(result.source.explicitMethodId).toBe("timed_isometric_sets");
  });

  test("8. an unknown exercise id produces a structured failure", () => {
    const context = NO_ATHLETE_REFERENCE_CONTEXT([]);
    const result = getExercisePrescriptionSource("unknown_exercise", context);

    if (result.ok) {
      throw new Error("Expected a structured failure for an unknown exercise id.");
    }

    expect(result.failureCode).toBe("EXERCISE_NOT_IN_REGISTRY");
  });

  test("9. a missing required athlete reference produces a structured failure, never a fabricated load", () => {
    const context = NO_ATHLETE_REFERENCE_CONTEXT(["barbell", "bench", "rack", "weight_plates"]);
    const result = getExercisePrescriptionSource("bench_press", context);

    if (result.ok) {
      throw new Error("Expected a structured failure when the one-rep-max reference is missing.");
    }

    expect(result.failureCode).toBe("REQUIRED_ATHLETE_REFERENCE_MISSING");
    expect(result.message).toContain("one_rep_max");
  });

  test("10. missing required equipment produces a structured failure", () => {
    const context = ONE_REP_MAX_CONTEXT(["barbell"]); // missing bench, rack, weight_plates
    const result = getExercisePrescriptionSource("bench_press", context);

    if (result.ok) {
      throw new Error("Expected a structured failure when required equipment is missing.");
    }

    expect(result.failureCode).toBe("REQUIRED_EQUIPMENT_MISSING");
  });

  test("20. does not mutate the supplied context", () => {
    const context = ONE_REP_MAX_CONTEXT(["barbell", "bench", "rack", "weight_plates"]);
    const snapshot = JSON.parse(JSON.stringify(context));

    getExercisePrescriptionSource("bench_press", context);

    expect(context).toEqual(snapshot);
  });
});
