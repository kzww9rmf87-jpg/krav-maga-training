/**
 * Combat Athlete System — Duration Estimation Tests
 *
 * Two properties matter most here and are asserted directly:
 *
 * - COVERAGE: every one of the 75 registry entries produces an estimate, on
 *   a real prescription, with no exercise-specific branch anywhere in the
 *   estimator;
 * - HONESTY: an estimate whose work time is fully determined by the
 *   prescription says so (`provenance: "prescribed"`), and one that leans on
 *   the engineering constants says that instead. A reader can always tell
 *   which seconds were computed and which were decided.
 */

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import { EQUIPMENT_CAPABILITY_IDS } from "../../prescription/equipmentCapabilities";
import {
  METHOD_DURATION_CONSTANTS,
  SOURCE_DURATION_MODEL,
  TRANSITION_SECONDS_BETWEEN_EXERCISES,
} from "../../prescription/durationEstimationModel";
import {
  estimatePrescriptionDuration,
  estimateSessionDuration,
} from "../../prescription/estimatePrescriptionDuration";
import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  getExercisePrescriptionSource,
} from "../../prescription/exercisePrescriptionRegistry";
import { prescribeExercise, type ExercisePrescription } from "../../prescription/prescribeExercise";
import { validatePilotRegistry } from "../../prescription/registryValidators";
import { DURATION_ESTIMATION_PROFILES } from "../../prescription/durationEstimationProfiles";

const REGISTRY_IDS = Object.keys(EXERCISE_PRESCRIPTION_REGISTRY);

const CONTEXT = {
  rangeContext: "normal",
  athleteReferences: [
    {
      referenceType: "one_rep_max",
      value: 100,
      unit: "kg",
      sourceId: "test-1rm",
      measuredAt: null,
      validUntil: null,
      confidence: "validated",
    },
  ],
  availableEquipmentCapabilities: [...EQUIPMENT_CAPABILITY_IDS],
} as const;

/** The real prescription for a registry exercise, under a fully-equipped context. */
function prescribe(exerciseId: string): ExercisePrescription {
  const source = getExercisePrescriptionSource(exerciseId, CONTEXT as never);
  if (!source.ok) {
    throw new Error(`Could not resolve a source for "${exerciseId}": ${source.message}`);
  }
  const result = prescribeExercise({ exerciseId, moduleId: source.moduleId, ...source.source });
  if (!result.ok) {
    throw new Error(`Could not prescribe "${exerciseId}": ${result.message}`);
  }
  return result.prescription;
}

describe("duration estimation — coverage of the whole registry", () => {
  test("every registry entry has a resolved duration profile", () => {
    expect(REGISTRY_IDS).toHaveLength(75);

    for (const exerciseId of REGISTRY_IDS) {
      const profile = DURATION_ESTIMATION_PROFILES[`duration_profile_${exerciseId}`];
      expect(profile, exerciseId).toBeDefined();
      expect(profile.status, exerciseId).toBe("resolved");
      expect(profile.sourceRuleIds, exerciseId).toContain(SOURCE_DURATION_MODEL);
    }
  });

  test("the registry validator reports no issue at all", () => {
    expect(validatePilotRegistry()).toEqual([]);
  });

  test("every registry entry produces an estimate from its real prescription", () => {
    for (const exerciseId of REGISTRY_IDS) {
      const estimate = estimatePrescriptionDuration(prescribe(exerciseId));

      if (!estimate.ok) {
        throw new Error(`No duration estimate for "${exerciseId}": ${estimate.failureCode}`);
      }
      expect(estimate.totalSeconds, exerciseId).toBeGreaterThan(0);
      expect(estimate.totalSeconds, exerciseId).toBe(
        estimate.workSeconds + estimate.restSeconds + estimate.setupSeconds,
      );
      expect(estimate.workSeconds, exerciseId).toBeGreaterThan(0);
    }
  });

  test("no estimate is absurd — every exercise lands between 1 and 60 minutes", () => {
    for (const exerciseId of REGISTRY_IDS) {
      const estimate = estimatePrescriptionDuration(prescribe(exerciseId));
      if (!estimate.ok) {
        throw new Error(`No estimate for "${exerciseId}".`);
      }
      expect(estimate.totalSeconds / 60, exerciseId).toBeGreaterThan(1);
      expect(estimate.totalSeconds / 60, exerciseId).toBeLessThan(60);
    }
  });
});

describe("duration estimation — computed versus decided", () => {
  test("structures whose work time the prescription resolves are marked as prescribed", () => {
    // A hold, a round and an interval each carry their own duration.
    for (const exerciseId of ["pallof_press", "pummeling", "rowerg_intervals"]) {
      const estimate = estimatePrescriptionDuration(prescribe(exerciseId));
      if (!estimate.ok) {
        throw new Error(`No estimate for "${exerciseId}".`);
      }
      const work = estimate.components.find((component) => component.kind === "work");
      expect(work?.provenance, exerciseId).toBe("prescribed");
      expect(work?.explanation, exerciseId).toContain("prescribed");
    }
  });

  test("repetition and distance work is marked as resting on the engineering model", () => {
    for (const exerciseId of ["bench_press", "farmer_carry"]) {
      const estimate = estimatePrescriptionDuration(prescribe(exerciseId));
      if (!estimate.ok) {
        throw new Error(`No estimate for "${exerciseId}".`);
      }
      const work = estimate.components.find((component) => component.kind === "work");
      expect(work?.provenance, exerciseId).toBe("engineering_model");
      expect(work?.explanation, exerciseId).toContain("duration model");
    }
  });

  test("rest is always computed from the prescription, never decided", () => {
    for (const exerciseId of REGISTRY_IDS) {
      const estimate = estimatePrescriptionDuration(prescribe(exerciseId));
      if (!estimate.ok) {
        throw new Error(`No estimate for "${exerciseId}".`);
      }
      const rest = estimate.components.find((component) => component.kind === "rest");
      expect(rest?.provenance, exerciseId).toBe("prescribed");
    }
  });

  test("setup always rests on the engineering model, and every estimate names it", () => {
    for (const exerciseId of ["bench_press", "pallof_press", "rowerg_intervals"]) {
      const estimate = estimatePrescriptionDuration(prescribe(exerciseId));
      if (!estimate.ok) {
        throw new Error(`No estimate for "${exerciseId}".`);
      }
      const setup = estimate.components.find((component) => component.kind === "setup");
      expect(setup?.provenance).toBe("engineering_model");
      expect(estimate.sourceRuleIds).toContain(SOURCE_DURATION_MODEL);
    }
  });
});

describe("duration estimation — the arithmetic", () => {
  test("bench_press: 3 sets × 5 reps × 4s, plus 2 × 180s rest, plus 90s setup", () => {
    const estimate = estimatePrescriptionDuration(prescribe("bench_press"));
    if (!estimate.ok) {
      throw new Error("Expected an estimate for bench_press.");
    }

    expect(estimate.workSeconds).toBe(3 * 5 * METHOD_DURATION_CONSTANTS.straight_sets_repetitions.repetitionSeconds!);
    // Rest applies BETWEEN sets: 3 sets carry 2 rests, never 3.
    expect(estimate.restSeconds).toBe(2 * 180);
    expect(estimate.setupSeconds).toBe(METHOD_DURATION_CONSTANTS.straight_sets_repetitions.setupSeconds);
  });

  test("a per-side prescription doubles the work, and a total one does not", () => {
    const perSide = prescribe("bulgarian_split_squat");
    expect(perSide.volume.laterality?.interpretation).toBe("repetitions_per_side");

    const estimate = estimatePrescriptionDuration(perSide);
    if (!estimate.ok) {
      throw new Error("Expected an estimate.");
    }
    const reps = perSide.volume.reps?.type === "fixed" ? perSide.volume.reps.value : perSide.volume.reps?.min ?? 0;
    const perRep = METHOD_DURATION_CONSTANTS[perSide.methodId].repetitionSeconds ?? 0;
    expect(estimate.workSeconds).toBe((perSide.volume.sets ?? 0) * reps * 2 * perRep);
    expect(estimate.components.find((component) => component.kind === "work")?.explanation).toContain("per side");
  });

  test("interval rest applies between intervals, so n intervals carry n-1 rests", () => {
    const prescription = prescribe("rowerg_intervals");
    const estimate = estimatePrescriptionDuration(prescription);
    if (!estimate.ok) {
      throw new Error("Expected an estimate.");
    }

    const intervals = prescription.volume.workIntervals ?? 0;
    const perInterval = prescription.volume.duration?.value ?? 0;
    expect(estimate.workSeconds).toBe(intervals * perInterval);
    expect(estimate.restSeconds).toBe((intervals - 1) * 75);
  });
});

describe("duration estimation — session level", () => {
  test("a session sums its exercises plus one transition per gap", () => {
    const prescriptions = [prescribe("bench_press"), prescribe("pallof_press")];
    const session = estimateSessionDuration(prescriptions);

    const individual = prescriptions.map((prescription) => {
      const estimate = estimatePrescriptionDuration(prescription);
      if (!estimate.ok) {
        throw new Error("Expected an estimate.");
      }
      return estimate.totalSeconds;
    });

    expect(session.transitionSeconds).toBe(TRANSITION_SECONDS_BETWEEN_EXERCISES);
    expect(session.totalSeconds).toBe(individual[0] + individual[1] + TRANSITION_SECONDS_BETWEEN_EXERCISES);
    expect(session.totalMinutes).toBe(Math.round((session.totalSeconds ?? 0) / 60));
  });

  test("a single-exercise session carries no transition", () => {
    expect(estimateSessionDuration([prescribe("bench_press")]).transitionSeconds).toBe(0);
  });

  test("an empty session is zero, not unknown", () => {
    const session = estimateSessionDuration([]);
    expect(session.totalSeconds).toBe(0);
    expect(session.totalMinutes).toBe(0);
  });

  test("the session reasons name every exercise and the transitions", () => {
    const session = estimateSessionDuration([prescribe("bench_press"), prescribe("pallof_press")]);

    expect(session.reasons.join(" ")).toContain("bench_press");
    expect(session.reasons.join(" ")).toContain("pallof_press");
    expect(session.reasons.join(" ")).toContain("transition");
  });
});

describe("duration estimation — determinism and generality", () => {
  test("two estimates of the same prescription are deeply equal", () => {
    const prescription = prescribe("bench_press");
    expect(estimatePrescriptionDuration(prescription)).toEqual(estimatePrescriptionDuration(prescription));
  });

  test("the prescription is never mutated", () => {
    const prescription = prescribe("bench_press");
    const before = JSON.stringify(prescription);
    estimatePrescriptionDuration(prescription);
    expect(JSON.stringify(prescription)).toBe(before);
  });

  test("the estimator branches on no exercise id", () => {
    const source = readEstimatorSource();
    for (const exerciseId of REGISTRY_IDS) {
      expect(source, exerciseId).not.toContain(`"${exerciseId}"`);
    }
  });

  test("the model table covers every training method", () => {
    for (const constants of Object.values(METHOD_DURATION_CONSTANTS)) {
      expect(typeof constants.setupSeconds).toBe("number");
      expect(constants.setupSeconds).toBeGreaterThan(0);
    }
  });
});

function readEstimatorSource(): string {
  return readFileSync(new URL("../../prescription/estimatePrescriptionDuration.ts", import.meta.url), "utf-8");
}
