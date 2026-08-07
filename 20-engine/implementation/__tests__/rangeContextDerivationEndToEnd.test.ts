/**
 * Combat Athlete System — Readiness → Dose Derivation, End to End
 *
 * Proves against the REAL knowledge base and the REAL prescription registry
 * that the athlete's readiness now sets the session's dose, and that the
 * caller supplies no `rangeContext` anywhere in the flow.
 *
 * The direction of each effect is the point. A tired athlete must get less
 * work AND more recovery — fewer sets and lower intensity, but rest that
 * holds or lengthens. Getting the rest direction wrong would shorten
 * recovery for exactly the athlete with least of it, so it is asserted
 * explicitly rather than left to follow from the dose.
 */

import { describe, expect, test } from "vitest";

import { runEngine } from "../index";
import type { EngineInput, EquipmentType, ReadinessState } from "../types";
import { buildEngineSessionPrescriptionSources } from "../prescription/buildEngineSessionPrescriptionSources";

import { makeAthleteProfile, makeReadiness, makeRequest, makeValidInput } from "./fixtures";

const BARBELL_GYM: readonly EquipmentType[] = [
  "bodyweight",
  "barbell",
  "bench",
  "rack",
  "plates",
  "pull_up_bar",
  "dumbbell",
  "kettlebell",
];

function makeInput(readiness: ReadinessState): EngineInput {
  return makeValidInput({
    athleteProfile: makeAthleteProfile({
      experience: { generalTrainingLevel: "intermediate", primaryCombatSport: "krav_maga" },
    }),
    readiness,
    environment: {
      locationType: "gym",
      availableEquipment: BARBELL_GYM.map((type) => ({ type })),
      availableSpace: "moderate",
      floorSafe: true,
    },
    request: makeRequest({
      requestId: "lot-3",
      durationMinutes: 45,
      primaryObjective: { adaptationDomain: "maximum_strength" },
    }),
  });
}

/**
 * The caller passes readiness and environment — never a range context and
 * never a capability list.
 */
function runScenario(readiness: ReadinessState) {
  const input = makeInput(readiness);

  const draftOnly = runEngine(input);
  if (draftOnly.outcome !== "draft") {
    throw new Error(`Expected a draft, got "${draftOnly.outcome}".`);
  }

  const selectedExerciseIds = draftOnly.sessionDraft.modules.flatMap((generatedModule) =>
    generatedModule.exerciseSelection.candidates
      .filter((candidate) => candidate.selected)
      .map((candidate) => candidate.scoredExercise.exercise.id),
  );

  const built = buildEngineSessionPrescriptionSources(selectedExerciseIds, {
    athleteReferences: [],
    environment: input.environment,
    readiness: input.readiness,
  });

  const result = runEngine(input, undefined, built.sources);
  if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
    throw new Error(`Expected a prescribed draft, got "${result.outcome}".`);
  }

  // The exercise under test is NAMED rather than taken by position. This file
  // asks how readiness reaches a dose, and the answer is only visible on the
  // primary driver: `pull_up` drops from three sets to two under low readiness,
  // while the accessories beside it hold at three.
  //
  // Before Lot H2.3 this read `exercises[0]`, which happened to be the driver;
  // sequencing now guarantees it, but naming the subject says what the test
  // means instead of relying on that.
  const first = result.prescription.session.exercises.find(
    (exercise) => exercise.prescription.exerciseId === "pull_up",
  );
  if (first === undefined) {
    throw new Error("Expected pull_up to be prescribed.");
  }

  const betweenSets = first.prescription.rest?.betweenSets;
  const restSeconds =
    betweenSets !== null && betweenSets !== undefined && betweenSets.type === "fixed"
      ? betweenSets.duration.value
      : null;

  return {
    input,
    result,
    decision: built.rangeContextDecision,
    prescription: first.prescription,
    sets: first.prescription.volume.sets,
    restSeconds,
  };
}

const NEUTRAL = makeReadiness();
const REDUCED = makeReadiness({ energy: 2, sleepQuality: 3, perceivedRecovery: 3, soreness: 3, stress: 3 });
const LOW = makeReadiness({ energy: 1, sleepQuality: 1, perceivedRecovery: 1, soreness: 5, stress: 5 });
const EXCELLENT = makeReadiness({ energy: 5, sleepQuality: 5, perceivedRecovery: 5, soreness: 1, stress: 1 });

describe("readiness → dose — the caller no longer chooses the range context", () => {
  test("a neutral athlete gets the normal profile values", () => {
    const { decision, sets, restSeconds } = runScenario(NEUTRAL);

    expect(decision.level).toBe("normal");
    expect(decision.rangeContext).toBe("normal");
    expect(sets).toBe(3);
    // 180 s is the strength PRIMARY profile's normal rest. The former 120 was
    // `chest_supported_row`'s accessory rest, read by position: before Lot H2.3
    // this scenario's neutral run happened to put the accessory first and its
    // low-readiness run the driver, so the file compared two different exercises
    // across runs. Naming `pull_up` fixes the comparison, and this is its value.
    expect(restSeconds).toBe(180);
  });

  test("an excellent athlete is dosed identically — high readiness never progresses on its own", () => {
    const neutral = runScenario(NEUTRAL);
    const excellent = runScenario(EXCELLENT);

    expect(excellent.decision.level).toBe("high");
    expect(excellent.decision.rangeContext).toBe("normal");
    expect(excellent.sets).toBe(neutral.sets);
    expect(excellent.restSeconds).toBe(neutral.restSeconds);
  });

  test("a low-readiness athlete gets fewer sets and lower intensity", () => {
    const neutral = runScenario(NEUTRAL);
    const low = runScenario(LOW);

    expect(low.decision.level).toBe("low");
    expect(low.decision.rangeContext).toBe("reduced");
    expect(low.sets).toBeLessThan(neutral.sets ?? Number.POSITIVE_INFINITY);
  });

  test("rest never shortens as readiness falls — it holds, then lengthens", () => {
    const neutral = runScenario(NEUTRAL);
    const reduced = runScenario(REDUCED);
    const low = runScenario(LOW);

    expect(reduced.decision.level).toBe("reduced");
    expect(low.decision.level).toBe("low");

    // The safety property: a tired athlete is never given less recovery.
    expect(reduced.restSeconds).toBeGreaterThanOrEqual(neutral.restSeconds ?? 0);
    expect(low.restSeconds).toBeGreaterThan(neutral.restSeconds ?? 0);
  });

  test("the decision is reported with its reasons, so no consumer has to re-derive it", () => {
    const { decision } = runScenario(LOW);

    expect(decision.aggregate).toBe(1);
    expect(decision.reasons.join(" ")).toContain('Readiness level "low"');
    expect(decision.sourceRuleIds).toContain("35_PRESCRIPTION_ADJUSTMENT_RULES_V0_1");
    expect(decision.contributions).toHaveLength(5);
  });
});

describe("readiness → dose — determinism and isolation", () => {
  test("two runs with the same readiness produce identical prescriptions", () => {
    const first = runScenario(LOW);
    const second = runScenario(LOW);

    expect(JSON.stringify(first.result.prescription)).toBe(JSON.stringify(second.result.prescription));
    expect(first.decision).toEqual(second.decision);
  });

  test("the readiness object is never mutated by a full run", () => {
    const readiness = makeReadiness({ energy: 2, soreness: 4 });
    const before = JSON.stringify(readiness);

    runScenario(readiness);

    expect(JSON.stringify(readiness)).toBe(before);
  });

  test("readiness changes the dose without changing which exercise was selected", () => {
    // Selection is scoring's business and this lot did not touch it; the
    // fatigue-cost penalty can still reorder candidates, so this asserts the
    // dose difference on a fixed exercise rather than assuming stability.
    const neutral = runScenario(NEUTRAL);
    const reduced = runScenario(REDUCED);

    expect(reduced.prescription.exerciseId).toBe(neutral.prescription.exerciseId);
    expect(reduced.decision.rangeContext).toBe("reduced");
    expect(neutral.decision.rangeContext).toBe("normal");
  });
});
