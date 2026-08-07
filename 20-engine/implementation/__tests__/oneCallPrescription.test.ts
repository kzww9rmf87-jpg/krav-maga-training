/**
 * Combat Athlete System — One-Call Prescription, End to End
 *
 * The boundary this lot exists to establish, stated as a test: the platform
 * supplies athlete facts and a session request, and CAS returns a selected,
 * prescribed, explained session — in ONE call, against the real knowledge
 * base and the real prescription registry.
 *
 * Every scenario below calls `runEngine(input)` with no second or third
 * argument. Nothing here builds a source map, names a registry capability,
 * chooses a range context, assembles a reference list or picks a rounding
 * policy, because none of those is a caller's decision any more.
 */

import { describe, expect, test } from "vitest";

import { EXERCISE_KNOWLEDGE_BASE, runEngine } from "../index";
import type { EngineInput, EquipmentType, ExerciseDefinition, ReadinessState } from "../types";
import type { IntensityReference } from "../prescription/types";

import { makeAthleteProfile, makeReadiness, makeRequest, makeValidInput } from "./fixtures";

const FULL_GYM: readonly EquipmentType[] = [
  "bodyweight",
  "barbell",
  "bench",
  "rack",
  "plates",
  "pull_up_bar",
  "dumbbell",
  "kettlebell",
  "cable_machine",
  "resistance_band",
  "cardio_machine",
  "mat",
  "open_space",
  "pinch_grip_implement",
];

function makeOneRepMax(overrides: Partial<IntensityReference> = {}): IntensityReference {
  return {
    referenceType: "one_rep_max",
    value: 100,
    unit: "kg",
    sourceId: "bench-press-1rm",
    measuredAt: "2025-12-01T00:00:00.000Z",
    validUntil: null,
    confidence: "validated",
    ...overrides,
  };
}

/**
 * The real `bench_press` definition, taken from the production catalog so
 * this file never invents an `ExerciseDefinition`. Restricting the pool to
 * it is what forces the percentage-1RM path in the reference tests below.
 */
const BENCH_PRESS: ExerciseDefinition = (() => {
  const definition = EXERCISE_KNOWLEDGE_BASE.find((entry) => entry.id === "bench_press");
  if (definition === undefined) {
    throw new Error("bench_press is expected to exist in the knowledge base.");
  }
  return definition;
})();

/** Athlete facts and a session request — nothing else. */
function makeAthleteInput(
  options: {
    readiness?: ReadinessState;
    references?: readonly IntensityReference[];
    requiredModules?: EngineInput["request"]["requiredModules"];
  } = {},
): EngineInput {
  return makeValidInput({
    athleteProfile: makeAthleteProfile({
      experience: { generalTrainingLevel: "intermediate", primaryCombatSport: "krav_maga" },
      performanceReferences: options.references,
    }),
    readiness: options.readiness ?? makeReadiness(),
    environment: {
      locationType: "gym",
      availableEquipment: FULL_GYM.map((type) => ({ type })),
      availableSpace: "large",
      floorSafe: true,
    },
    request: makeRequest({
      requestId: "one-call",
      durationMinutes: 45,
      primaryObjective: { adaptationDomain: "maximum_strength" },
      requiredModules: options.requiredModules,
    }),
  });
}

describe("runEngine(input) — one call returns a prescribed session", () => {
  test("a multi-module session is fully prescribed without any caller-supplied context", () => {
    const result = runEngine(makeAthleteInput({ requiredModules: ["grip", "core", "conditioning"] }));

    if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
      throw new Error(`Expected a prescribed draft from outcome "${result.outcome}".`);
    }

    const prescribedIds = result.prescription.session.exercises.map(
      (prescribedExercise) => prescribedExercise.prescription.exerciseId,
    );
    const selectedIds = result.sessionDraft.modules.flatMap((generatedModule) =>
      generatedModule.exerciseSelection.candidates
        .filter((candidate) => candidate.selected)
        .map((candidate) => candidate.scoredExercise.exercise.id),
    );

    expect(selectedIds.length).toBeGreaterThan(1);
    // Compared as a SET. Since Lot H2.3 the prescribed array is the EXECUTION
    // order, which is a training decision; selection order is not. Every
    // selected exercise is still prescribed — that is what this asserts.
    expect([...prescribedIds].sort()).toEqual([...selectedIds].sort());
    expect(result.prescription.unprescribedSelectedExercises).toEqual([]);

    // Every prescription is complete, not a shell.
    for (const prescribedExercise of result.prescription.session.exercises) {
      const { prescription } = prescribedExercise;
      expect(prescription.status).toBe("complete");
      expect(prescription.methodId).toBeTruthy();
      expect(prescription.intensity.primaryMetric).toBeDefined();
      expect(prescription.stopConditions.length).toBeGreaterThan(0);
      expect(prescription.sourceRuleIds.length).toBeGreaterThan(0);
    }
  });

  test("readiness reaches the dose through the same single call", () => {
    const neutral = runEngine(makeAthleteInput());
    const tired = runEngine(
      makeAthleteInput({
        readiness: makeReadiness({ energy: 1, sleepQuality: 1, perceivedRecovery: 1, soreness: 5, stress: 5 }),
      }),
    );

    if (neutral.outcome !== "draft" || neutral.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft for the neutral athlete.");
    }
    if (tired.outcome !== "draft" || tired.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft for the tired athlete.");
    }

    const neutralSets = neutral.prescription.session.exercises[0]?.prescription.volume.sets;
    const tiredSets = tired.prescription.session.exercises[0]?.prescription.volume.sets;

    expect(tiredSets).toBeLessThan(neutralSets ?? Number.POSITIVE_INFINITY);
  });

  test("equipment reaches eligibility and prescription through the same single call", () => {
    const homeAthlete = makeValidInput({
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "intermediate", primaryCombatSport: "krav_maga" },
      }),
      environment: {
        locationType: "home",
        availableEquipment: [{ type: "bodyweight" }, { type: "pull_up_bar" }],
        availableSpace: "limited",
        floorSafe: true,
      },
      request: makeRequest({ requestId: "home", primaryObjective: { adaptationDomain: "maximum_strength" } }),
    });

    const result = runEngine(homeAthlete);
    if (result.outcome !== "draft") {
      throw new Error(`Expected a draft, got "${result.outcome}".`);
    }

    // Whatever was selected had its equipment satisfied at eligibility, so
    // the prescription layer must not now claim the equipment is missing.
    expect(result.prescription).toBeDefined();
    for (const gap of result.prescription?.unprescribedSelectedExercises ?? []) {
      expect(gap.reasonCode).toBe("PRESCRIPTION_SOURCE_NOT_PROVIDED");
    }
  });
});

describe("runEngine(input) — athlete references are consumed, never invented", () => {
  test("without a recorded one-rep max, a percentage-1RM exercise is disclosed, not guessed", () => {
    const input = makeValidInput({
      environment: {
        locationType: "gym",
        availableEquipment: [{ type: "barbell" }, { type: "bench" }, { type: "rack" }, { type: "plates" }],
        availableSpace: "moderate",
      },
    });

    const result = runEngine(input, [BENCH_PRESS]);

    if (result.outcome !== "draft") {
      throw new Error(`Expected a draft, got "${result.outcome}".`);
    }

    expect(result.prescription?.status).toBe("unavailable");
    expect(result.prescription?.unprescribedSelectedExercises.map((gap) => gap.exerciseId)).toEqual(["bench_press"]);
    expect(result.decisionTrace.warnings).toHaveLength(1);
  });

  test("with a recorded one-rep max, the load is computed from it", () => {
    const input = makeValidInput({
      athleteProfile: makeAthleteProfile({ performanceReferences: [makeOneRepMax()] }),
      environment: {
        locationType: "gym",
        availableEquipment: [{ type: "barbell" }, { type: "bench" }, { type: "rack" }, { type: "plates" }],
        availableSpace: "moderate",
      },
    });

    const result = runEngine(input, [BENCH_PRESS]);
    if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
      throw new Error(`Expected a prescribed draft from outcome "${result.outcome}".`);
    }

    const metric = result.prescription.session.exercises[0]?.prescription.intensity.primaryMetric;
    expect(metric?.type).toBe("percentage_1rm");
    expect(metric?.reference?.value).toBe(100);
    expect(metric?.reference?.referenceType).toBe("one_rep_max");
  });

  test("an expired one-rep max is refused rather than used", () => {
    const input = makeValidInput({
      athleteProfile: makeAthleteProfile({
        performanceReferences: [makeOneRepMax({ validUntil: "2025-06-01T00:00:00.000Z" })],
      }),
      environment: {
        locationType: "gym",
        availableEquipment: [{ type: "barbell" }, { type: "bench" }, { type: "rack" }, { type: "plates" }],
        availableSpace: "moderate",
      },
    });

    const result = runEngine(input, [BENCH_PRESS]);
    if (result.outcome !== "draft") {
      throw new Error(`Expected a draft, got "${result.outcome}".`);
    }

    expect(result.prescription?.status).toBe("unavailable");
  });
});

describe("runEngine(input) — determinism, isolation and the explicit override", () => {
  test("two identical calls produce identical results", () => {
    const input = makeAthleteInput({ references: [makeOneRepMax()] });
    expect(JSON.stringify(runEngine(input))).toBe(JSON.stringify(runEngine(input)));
  });

  test("the input is never mutated by a full prescribed run", () => {
    const input = makeAthleteInput({ references: [makeOneRepMax()] });
    const before = JSON.stringify(input);

    runEngine(input);

    expect(JSON.stringify(input)).toBe(before);
  });

  test("an explicit prescriptionSources map still overrides the derived one", () => {
    const input = makeAthleteInput();

    const derived = runEngine(input);
    const overridden = runEngine(input, undefined, new Map());

    if (derived.outcome !== "draft" || overridden.outcome !== "draft") {
      throw new Error("Expected drafts.");
    }

    // The derived run prescribes; the empty override cannot, and says so.
    expect(derived.prescription?.status).toBe("prescribed");
    expect(overridden.prescription?.status).toBe("unavailable");
  });
});

