import { describe, expect, test } from "vitest";

import { prescribeExercise } from "../../prescription/prescribeExercise";
import { prescribeSession, type SessionExercisePrescriptionInput } from "../../prescription/prescribeSession";
import { getExercisePrescriptionSource, type PrescriptionExecutionContext } from "../../prescription/exercisePrescriptionRegistry";
import { makeOneRepMaxReference } from "./fixtures";

const NO_REFERENCE_CONTEXT = (equipment: readonly string[]): PrescriptionExecutionContext => ({
  rangeContext: "normal",
  athleteReferences: [],
  availableEquipmentCapabilities: equipment,
});

const ONE_REP_MAX_CONTEXT = (equipment: readonly string[]): PrescriptionExecutionContext => ({
  rangeContext: "normal",
  athleteReferences: [makeOneRepMaxReference({ value: 100 })],
  availableEquipmentCapabilities: equipment,
});

describe("pilot exercise prescription — prescribeExercise", () => {
  test("15. Bench Press (strength) prescribes completely end to end via prescribeExercise", () => {
    const sourceResult = getExercisePrescriptionSource(
      "bench_press",
      ONE_REP_MAX_CONTEXT(["barbell", "bench", "rack", "plates"]),
    );
    if (!sourceResult.ok) {
      throw new Error(`Fixture setup failed: ${sourceResult.message}`);
    }

    const result = prescribeExercise({ exerciseId: "bench_press", moduleId: sourceResult.moduleId, ...sourceResult.source });

    if (!result.ok) {
      throw new Error(`Expected prescription to succeed, got failure at ${result.failureStage}: ${result.message}`);
    }

    expect(result.prescription.methodId).toBe("straight_sets_repetitions");
    expect(result.prescription.status).toBe("complete");
    // strength_primary_straight_sets_v0_1, normal range context, per
    // 34_NUMERICAL_PRESCRIPTION_TABLES.md.
    expect(result.prescription.volume.sets).toBe(3);
    expect(result.prescription.volume.reps?.value).toBe(5);
    expect(result.prescription.intensity.primaryMetric.type).toBe("percentage_1rm");
    expect(result.prescription.intensity.calculation?.rawResult).toBe(85);
  });

  test("Box Jump (power) prescribes completely end to end via movement_intent, no fabricated load", () => {
    const sourceResult = getExercisePrescriptionSource("box_jump", NO_REFERENCE_CONTEXT(["plyometric_box", "safe_landing_surface"]));
    if (!sourceResult.ok) {
      throw new Error(`Fixture setup failed: ${sourceResult.message}`);
    }

    const result = prescribeExercise({ exerciseId: "box_jump", moduleId: sourceResult.moduleId, ...sourceResult.source });

    if (!result.ok) {
      throw new Error(`Expected prescription to succeed, got failure at ${result.failureStage}: ${result.message}`);
    }

    expect(result.prescription.methodId).toBe("power_repetition_sets");
    expect(result.prescription.intensity.primaryMetric.type).toBe("movement_intent");
    expect(result.prescription.intensity.calculation).toBeNull();
    expect(result.prescription.intensity.primaryMetric.target).toEqual({
      type: "category",
      value: "maximal_acceleration",
    });
  });

  test("Farmer Carry (grip/carry) prescribes completely end to end", () => {
    const sourceResult = getExercisePrescriptionSource("farmer_carry", NO_REFERENCE_CONTEXT(["loaded_carry_implement"]));
    if (!sourceResult.ok) {
      throw new Error(`Fixture setup failed: ${sourceResult.message}`);
    }

    const result = prescribeExercise({ exerciseId: "farmer_carry", moduleId: sourceResult.moduleId, ...sourceResult.source });

    if (!result.ok) {
      throw new Error(`Expected prescription to succeed, got failure at ${result.failureStage}: ${result.message}`);
    }

    expect(result.prescription.methodId).toBe("distance_carry_sets");
    expect(result.prescription.tempo).toBeNull();
    expect(result.prescription.volume.distance?.value).toBe(25);
  });

  test("Pallof Press (core) prescribes completely end to end", () => {
    const sourceResult = getExercisePrescriptionSource(
      "pallof_press",
      NO_REFERENCE_CONTEXT(["cable_or_band_resistance"]),
    );
    if (!sourceResult.ok) {
      throw new Error(`Fixture setup failed: ${sourceResult.message}`);
    }

    const result = prescribeExercise({ exerciseId: "pallof_press", moduleId: sourceResult.moduleId, ...sourceResult.source });

    if (!result.ok) {
      throw new Error(`Expected prescription to succeed, got failure at ${result.failureStage}: ${result.message}`);
    }

    expect(result.prescription.methodId).toBe("timed_isometric_sets");
    expect(result.prescription.volume.duration?.value).toBe(20);
  });

  test("19. determinism: identical pilot exercise input produces identical prescriptions", () => {
    const sourceResult = getExercisePrescriptionSource(
      "bench_press",
      ONE_REP_MAX_CONTEXT(["barbell", "bench", "rack", "plates"]),
    );
    if (!sourceResult.ok) {
      throw new Error(`Fixture setup failed: ${sourceResult.message}`);
    }
    const input = { exerciseId: "bench_press", moduleId: sourceResult.moduleId, ...sourceResult.source };

    expect(prescribeExercise(input)).toEqual(prescribeExercise(input));
  });

  test("20. prescribeExercise does not mutate the source built from the registry", () => {
    const sourceResult = getExercisePrescriptionSource(
      "bench_press",
      ONE_REP_MAX_CONTEXT(["barbell", "bench", "rack", "plates"]),
    );
    if (!sourceResult.ok) {
      throw new Error(`Fixture setup failed: ${sourceResult.message}`);
    }
    const input = { exerciseId: "bench_press", moduleId: sourceResult.moduleId, ...sourceResult.source };
    const snapshot = JSON.parse(JSON.stringify(input));

    prescribeExercise(input);

    expect(input).toEqual(snapshot);
  });
});

describe("pilot exercise prescription — prescribeSession", () => {
  test("16. a session combining Bench Press, Farmer Carry and Pallof Press prescribes completely", () => {
    const benchSource = getExercisePrescriptionSource(
      "bench_press",
      ONE_REP_MAX_CONTEXT(["barbell", "bench", "rack", "plates"]),
    );
    const carrySource = getExercisePrescriptionSource("farmer_carry", NO_REFERENCE_CONTEXT(["loaded_carry_implement"]));
    const pallofSource = getExercisePrescriptionSource(
      "pallof_press",
      NO_REFERENCE_CONTEXT(["cable_or_band_resistance"]),
    );

    if (!benchSource.ok || !carrySource.ok || !pallofSource.ok) {
      throw new Error("Fixture setup failed: one of the pilot exercise sources did not resolve.");
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
        exerciseId: "farmer_carry",
        moduleId: carrySource.moduleId,
        ...carrySource.source,
        order: 2,
        required: true,
        blockId: "grip",
      },
      {
        exerciseId: "pallof_press",
        moduleId: pallofSource.moduleId,
        ...pallofSource.source,
        order: 3,
        required: false,
        blockId: "core",
      },
    ];

    const result = prescribeSession({
      sessionId: "pilot-session-1",
      sessionName: "Pilot Vertical Slice Session",
      modules: ["strength", "grip", "core"],
      exercises,
    });

    if (!result.ok) {
      throw new Error(`Expected session prescription to succeed, got issues: ${JSON.stringify(result.issues)}`);
    }

    expect(result.session.exercises).toHaveLength(3);
    expect(result.session.exercises.map((exercise) => exercise.prescription.exerciseId)).toEqual([
      "bench_press",
      "farmer_carry",
      "pallof_press",
    ]);
    expect(result.session.sourceRuleIds.length).toBeGreaterThan(0);
  });
});
