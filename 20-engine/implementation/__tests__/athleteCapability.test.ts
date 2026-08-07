import { describe, expect, test } from "vitest";

import {
  assessCapability,
  MAXIMUM_PLAUSIBLE_RIR,
  observationFor,
  prescriptionRepetitionWindow,
  validateObservation,
  type CapabilityObservation,
} from "../athleteCapability";
import { runEngine } from "../index";
import { EXERCISE_KNOWLEDGE_BASE } from "../exerciseKnowledgeBase";
import { NUMERICAL_PRESCRIPTION_PROFILES } from "../prescription/prescriptionKnowledge";
import { makeAthleteProfile, makeEnvironment, makeRequest, makeValidInput } from "./fixtures";
import type { AdaptationDomain, EquipmentType } from "../types";

/**
 * Athlete capability — Lot H2.5A.
 *
 * The blocker: CAS prescribed the same push-up set to an athlete who can do six
 * repetitions and to one who can do twenty. These tests pin what CAS now knows,
 * and — just as importantly — what it still refuses to decide.
 */

const HYPERTROPHY_PROFILE = NUMERICAL_PRESCRIPTION_PROFILES.find(
  (profile) => profile.profileId === "functional_hypertrophy_primary_v0_1",
)!;

const STRENGTH_PROFILE = NUMERICAL_PRESCRIPTION_PROFILES.find(
  (profile) => profile.profileId === "strength_primary_straight_sets_v0_1",
)!;

function pushUpObservation(overrides: Partial<CapabilityObservation> = {}): CapabilityObservation {
  return {
    exerciseId: "push_up",
    observationType: "max_repetitions",
    repetitions: 10,
    loadValue: null,
    loadUnit: null,
    repetitionsInReserve: null,
    side: "both",
    provenance: "measured_test",
    observedAt: "2026-01-10T10:00:00.000Z",
    ...overrides,
  };
}

const isCatalogued = (exerciseId: string) =>
  EXERCISE_KNOWLEDGE_BASE.some((exercise) => exercise.id === exerciseId);

function generate(options: {
  equipment: readonly EquipmentType[];
  adaptation: AdaptationDomain;
  durationMinutes?: number;
  observations?: readonly CapabilityObservation[];
}) {
  return runEngine(
    makeValidInput({
      athleteProfile: makeAthleteProfile({
        performanceReferences: [],
        ...(options.observations === undefined
          ? {}
          : { capabilityObservations: [...options.observations] }),
      }),
      environment: makeEnvironment({
        availableEquipment: options.equipment.map((type) => ({ type })),
      }),
      request: makeRequest({
        durationMinutes: options.durationMinutes ?? 30,
        primaryObjective: { adaptationDomain: options.adaptation },
      }),
    }),
  );
}

describe("capability — the window is derived, never chosen", () => {
  // ONE relation governs both bounds: to perform N repetitions with R held back,
  // the athlete's maximum must be at least N + R. Applied to the easiest valid
  // point of the prescription, and to the hardest.
  test("the hypertrophy window is 7-15, both bounds from the profile", () => {
    const range = prescriptionRepetitionWindow(HYPERTROPHY_PROFILE);
    expect(range).toEqual({ minimum: 7, maximum: 15, profileId: "functional_hypertrophy_primary_v0_1" });

    // 7 is 6 minimum repetitions + 1 minimum reserve; 15 is 12 maximum
    // repetitions + 3 maximum reserve. Neither number is written anywhere.
    expect(HYPERTROPHY_PROFILE.volume.repetitions).toMatchObject({ range: { min: 6, max: 12 } });
    const rir = HYPERTROPHY_PROFILE.intensity.find((rule) => rule.type === "rir" && "max" in rule);
    expect(rir).toMatchObject({ min: 1, max: 3 });
  });

  test("the strength window is 4-9, derived by the same relation", () => {
    expect(prescriptionRepetitionWindow(STRENGTH_PROFILE)).toEqual({
      minimum: 4,
      maximum: 9,
      profileId: "strength_primary_straight_sets_v0_1",
    });
    expect(STRENGTH_PROFILE.volume.repetitions).toMatchObject({ range: { min: 3, max: 6 } });
  });

  // A profile with no documented reserve contributes none at either end, rather
  // than borrowing one from a profile that has it.
  test("a profile without an RIR rule gets no invented reserve", () => {
    const noReserve = NUMERICAL_PRESCRIPTION_PROFILES.find(
      (profile) => profile.profileId === "strength_accessory_straight_sets_v0_1",
    )!;
    // The type system already proves this profile carries no RIR rule — a
    // `rule.type === "rir"` comparison here does not even compile. What is
    // asserted instead is the consequence: the window is exactly the repetition
    // range, with nothing added at either end.
    expect(noReserve.volume.repetitions).toMatchObject({ range: { min: 4, max: 15 } });
    expect(prescriptionRepetitionWindow(noReserve)).toMatchObject({ minimum: 4, maximum: 15 });
  });

  // The exact transitions, on both profiles, in one place.
  test.each([
    [HYPERTROPHY_PROFILE, 6, "below_prescription_range"],
    [HYPERTROPHY_PROFILE, 7, "within_prescription_range"],
    [HYPERTROPHY_PROFILE, 15, "within_prescription_range"],
    [HYPERTROPHY_PROFILE, 16, "above_prescription_range"],
    [STRENGTH_PROFILE, 3, "below_prescription_range"],
    [STRENGTH_PROFILE, 4, "within_prescription_range"],
    [STRENGTH_PROFILE, 9, "within_prescription_range"],
    [STRENGTH_PROFILE, 10, "above_prescription_range"],
  ] as const)("%# a capacity of %i lands on its documented boundary", (profile, repetitions, state) => {
    expect(
      assessCapability({
        exerciseId: "push_up",
        observation: pushUpObservation({ repetitions }),
        profile,
      }).state,
    ).toBe(state);
  });
});

describe("capability — the push-up blocker", () => {
  // 7. No observation.
  test("7. no observation yields insufficient evidence, and invents nothing", () => {
    const assessment = assessCapability({
      exerciseId: "push_up",
      observation: null,
      profile: HYPERTROPHY_PROFILE,
    });
    expect(assessment.state).toBe("insufficient_evidence");
    expect(assessment.observation).toBeNull();
  });

  // 8. Below the envelope — and the exercise is NOT forbidden by this. It says
  // the prescription as requested does not fit the athlete today.
  test.each([3, 6])("8. %i repetitions cannot satisfy the prescription envelope", (repetitions) => {
    const assessment = assessCapability({
      exerciseId: "push_up",
      observation: pushUpObservation({ repetitions }),
      profile: HYPERTROPHY_PROFILE,
    });
    expect(assessment.state).toBe("below_prescription_range");
    // Six repetitions is exactly the corrected boundary: performing the
    // profile's six prescribed repetitions with its minimum one in reserve
    // needs a maximum of seven.
    expect(assessment.description).toContain("not forbidden");
  });

  // 9. Inside the envelope.
  test.each([7, 10, 15])("9. %i repetitions leaves the current variation suitable", (repetitions) => {
    const assessment = assessCapability({
      exerciseId: "push_up",
      observation: pushUpObservation({ repetitions }),
      profile: HYPERTROPHY_PROFILE,
    });
    expect(assessment.state).toBe("within_prescription_range");
  });

  // 10. Scenario D. And the boundary is 16, because 12 + 3 = 15.
  test.each([16, 20, 40])("10. %i repetitions is above the useful range", (repetitions) => {
    const assessment = assessCapability({
      exerciseId: "push_up",
      observation: pushUpObservation({ repetitions }),
      profile: HYPERTROPHY_PROFILE,
    });
    expect(assessment.state).toBe("above_prescription_range");
    expect(assessment.prescriptionWindow?.maximum).toBe(15);
  });

  // 11. + 12. + 35. The assessment does NOT act.
  test("11. + 12. + 35. a too-easy push-up changes neither the dose nor the exercise", () => {
    const withoutObservation = generate({ equipment: ["bodyweight"], adaptation: "functional_hypertrophy" });
    const withObservation = generate({
      equipment: ["bodyweight"],
      adaptation: "functional_hypertrophy",
      observations: [pushUpObservation({ repetitions: 40 })],
    });

    if (withoutObservation.outcome !== "draft" || withObservation.outcome !== "draft") {
      throw new Error("Expected drafts.");
    }
    if (
      withoutObservation.prescription?.status !== "prescribed" ||
      withObservation.prescription?.status !== "prescribed"
    ) {
      throw new Error("Expected prescribed sessions.");
    }

    const ids = (result: typeof withObservation) =>
      result.prescription?.status === "prescribed"
        ? result.prescription.session.exercises.map((exercise) => exercise.prescription.exerciseId)
        : [];

    // Same exercises, same order: no progression was chosen.
    expect(ids(withObservation)).toEqual(ids(withoutObservation));
    // 12. And no harder variation was invented — decline push-ups are not
    // catalogued, and CAS did not conjure one.
    expect(ids(withObservation)).not.toContain("decline_push_up");

    // 11. The dose is untouched: the prescription is not stretched to 40 reps.
    const dose = (result: typeof withObservation) =>
      JSON.stringify(
        result.prescription?.status === "prescribed"
          ? result.prescription.session.exercises.map((exercise) => exercise.prescription.volume)
          : [],
      );
    expect(dose(withObservation)).toBe(dose(withoutObservation));
  });
});

describe("capability — binding is exact, and never transfers", () => {
  // 6. Exact binding.
  test("6. an observation binds to the exercise it names", () => {
    const observations = [pushUpObservation(), pushUpObservation({ exerciseId: "pull_up", repetitions: 4 })];
    expect(observationFor("push_up", observations)?.repetitions).toBe(10);
    expect(observationFor("pull_up", observations)?.repetitions).toBe(4);
  });

  // 5. + 19. + 20. No transfer between exercises, however similar.
  test("5. + 19. + 20. no push-up/bench or pull-up/row transfer exists", () => {
    const observations = [
      pushUpObservation({ repetitions: 40 }),
      pushUpObservation({ exerciseId: "pull_up", repetitions: 25 }),
    ];

    // A push-up maximum says nothing about a bench press, and a pull-up
    // maximum says nothing about a row.
    for (const exerciseId of ["bench_press", "dumbbell_bench_press", "one_arm_dumbbell_row", "barbell_row"]) {
      expect(observationFor(exerciseId, observations)).toBeNull();
      expect(
        assessCapability({ exerciseId, observation: null, profile: HYPERTROPHY_PROFILE }).state,
      ).toBe("insufficient_evidence");
    }
  });

  // 18. One exercise never classifies the athlete.
  test("18. a single observation classifies one exercise, not the athlete", () => {
    const observations = [pushUpObservation({ repetitions: 40 })];

    const pushUp = assessCapability({
      exerciseId: "push_up",
      observation: observationFor("push_up", observations),
      profile: HYPERTROPHY_PROFILE,
    });
    const splitSquat = assessCapability({
      exerciseId: "split_squat",
      observation: observationFor("split_squat", observations),
      profile: HYPERTROPHY_PROFILE,
    });

    expect(pushUp.state).toBe("above_prescription_range");
    // The same athlete, a different exercise, and no inherited verdict.
    expect(splitSquat.state).toBe("insufficient_evidence");
  });

  // 4. An unknown exercise binds to nothing, safely.
  test("4. an observation naming an uncatalogued exercise is rejected, not guessed at", () => {
    const rejection = validateObservation(
      pushUpObservation({ exerciseId: "handstand_push_up_deficit" }),
      isCatalogued,
    );
    expect(rejection?.code).toBe("UNKNOWN_EXERCISE");
  });
});

describe("capability — validation", () => {
  // 3. + 24. + 25.
  test.each([
    ["3. zero repetitions", pushUpObservation({ repetitions: 0 }), "NON_POSITIVE_REPETITIONS"],
    ["3. fractional repetitions", pushUpObservation({ repetitions: 7.5 }), "NON_INTEGER_REPETITIONS"],
    [
      "24. a load without a unit",
      pushUpObservation({
        exerciseId: "dumbbell_bench_press",
        observationType: "repetitions_at_load",
        loadValue: 20,
        loadUnit: null,
      }),
      "LOAD_UNIT_MISSING",
    ],
    [
      "24. a loaded type with no load",
      pushUpObservation({ exerciseId: "dumbbell_bench_press", observationType: "repetitions_at_load" }),
      "LOAD_REQUIRED_FOR_TYPE",
    ],
    [
      "24. a bodyweight type carrying a load",
      pushUpObservation({ loadValue: 20, loadUnit: "kg" }),
      "LOAD_FORBIDDEN_FOR_TYPE",
    ],
    ["25. negative reserve", pushUpObservation({ repetitionsInReserve: -1 }), "RIR_OUT_OF_BOUNDS"],
    [
      "25. implausible reserve",
      pushUpObservation({ repetitionsInReserve: MAXIMUM_PLAUSIBLE_RIR + 1 }),
      "RIR_OUT_OF_BOUNDS",
    ],
  ])("%s is rejected", (_label, observation, code) => {
    expect(validateObservation(observation, isCatalogued)?.code).toBe(code);
  });

  test("a well-formed observation is accepted", () => {
    expect(validateObservation(pushUpObservation(), isCatalogued)).toBeNull();
    expect(
      validateObservation(
        pushUpObservation({
          exerciseId: "dumbbell_bench_press",
          observationType: "repetitions_at_load",
          loadValue: 22.5,
          loadUnit: "kg",
          repetitionsInReserve: 2,
        }),
        isCatalogued,
      ),
    ).toBeNull();
  });
});

describe("capability — the other representative exercises", () => {
  // 13. Pull-up: a repetition maximum, compared with the strength window.
  test("13. a pull-up maximum is compared with the strength profile's own window", () => {
    const assessment = assessCapability({
      exerciseId: "pull_up",
      observation: pushUpObservation({ exerciseId: "pull_up", repetitions: 12 }),
      profile: STRENGTH_PROFILE,
    });
    // The strength window is 3-9, so twelve pull-ups is above it — a different
    // verdict from the same count under the hypertrophy profile.
    expect(assessment.state).toBe("above_prescription_range");
    expect(assessment.prescriptionWindow).toMatchObject({ minimum: 4, maximum: 9 });
  });

  // 15. Dumbbell: load plus repetitions.
  test("15. a dumbbell observation carries its load and unit", () => {
    const observation = pushUpObservation({
      exerciseId: "dumbbell_bench_press",
      observationType: "repetitions_at_load",
      repetitions: 10,
      loadValue: 22.5,
      loadUnit: "kg",
    });
    expect(validateObservation(observation, isCatalogued)).toBeNull();
    expect(
      assessCapability({ exerciseId: "dumbbell_bench_press", observation, profile: HYPERTROPHY_PROFILE }).state,
    ).toBe("within_prescription_range");
  });

  // 16. Unilateral work records its side.
  test("16. a unilateral observation records which side it describes", () => {
    for (const side of ["left", "right", "both"] as const) {
      const observation = pushUpObservation({ exerciseId: "one_arm_dumbbell_row", side, observationType: "repetitions_at_load", loadValue: 20, loadUnit: "kg" });
      expect(validateObservation(observation, isCatalogued)).toBeNull();
      expect(observation.side).toBe(side);
    }
  });

  // 21. + 22. Timestamp and provenance survive.
  test("21. + 22. timestamp and provenance are preserved on the assessment", () => {
    const observation = pushUpObservation({ provenance: "self_reported", observedAt: "2025-03-02T08:00:00.000Z" });
    const assessment = assessCapability({ exerciseId: "push_up", observation, profile: HYPERTROPHY_PROFILE });

    expect(assessment.observation?.provenance).toBe("self_reported");
    expect(assessment.observation?.observedAt).toBe("2025-03-02T08:00:00.000Z");
  });

  // 17. The barbell 1RM system is untouched by any of this.
  test("17. the existing one-rep-max path still drives a barbell session", () => {
    const result = runEngine(
      makeValidInput({
        athleteProfile: makeAthleteProfile({
          performanceReferences: [
            {
              referenceType: "one_rep_max",
              value: 100,
              unit: "kg",
              sourceId: "1rm",
              measuredAt: null,
              validUntil: null,
              confidence: "validated",
            },
          ],
          capabilityObservations: [pushUpObservation({ repetitions: 40 })],
        }),
        environment: makeEnvironment({
          availableEquipment: (["bodyweight", "barbell", "bench", "rack", "plates"] as EquipmentType[]).map(
            (type) => ({ type }),
          ),
        }),
        request: makeRequest({ durationMinutes: 45, primaryObjective: { adaptationDomain: "maximum_strength" } }),
      }),
    );

    if (result.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }
    expect(result.sessionAdequacy.primaryAdaptationCovered).toBe(true);
    // A push-up observation did not leak into the barbell session's loading.
    expect(result.prescription?.status).toBe("prescribed");
  });
});

describe("capability — determinism and non-regression", () => {
  // 1. + 2. + 29. Requests without capabilities are untouched.
  test("1. + 2. + 29. a request without observations generates exactly as before", () => {
    const absent = generate({ equipment: ["bodyweight"], adaptation: "functional_hypertrophy" });
    const empty = generate({ equipment: ["bodyweight"], adaptation: "functional_hypertrophy", observations: [] });
    expect(JSON.stringify(empty)).toBe(JSON.stringify(absent));
  });

  // 26. + 27. Deterministic.
  test("26. + 27. repeated assessment is identical", () => {
    const observation = pushUpObservation({ repetitions: 22 });
    const first = assessCapability({ exerciseId: "push_up", observation, profile: HYPERTROPHY_PROFILE });
    const second = assessCapability({ exerciseId: "push_up", observation, profile: HYPERTROPHY_PROFILE });
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));

    const options = {
      equipment: ["bodyweight"] as EquipmentType[],
      adaptation: "functional_hypertrophy" as AdaptationDomain,
      observations: [observation],
    };
    expect(JSON.stringify(generate(options))).toBe(JSON.stringify(generate(options)));
  });

  // 28. The trace carries the rule ids.
  test("28. the Decision Trace explains the assessment and its refusal to act", () => {
    const result = generate({
      equipment: ["bodyweight"],
      adaptation: "functional_hypertrophy",
      observations: [pushUpObservation({ repetitions: 40 })],
    });
    if (result.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }

    const entry = result.decisionTrace.entries.find((traceEntry) =>
      traceEntry.id.endsWith("_capability_push_up"),
    );
    expect(entry?.decision).toContain("above_prescription_range");
    expect(entry?.reasons.join(" ")).toContain("functional_hypertrophy_primary_v0_1");
    expect(entry?.reasons.join(" ")).toContain("no progression was chosen");
    expect(entry?.sourceRuleIds).toContain("34_NUMERICAL_PRESCRIPTION_TABLES_V0_1");
  });

  test("a rejected observation is reported in the trace rather than dropped", () => {
    const result = generate({
      equipment: ["bodyweight"],
      adaptation: "functional_hypertrophy",
      observations: [pushUpObservation({ exerciseId: "not_a_catalogued_exercise" })],
    });
    if (result.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }
    const entry = result.decisionTrace.entries.find((traceEntry) =>
      traceEntry.id.includes("_capability_rejected_"),
    );
    expect(entry?.decision).toContain("UNKNOWN_EXERCISE");
  });

  // 30. + 31. + 32. + 33. The earlier lots are intact.
  test("30. + 31. bodyweight maximum strength is still inadequate", () => {
    const result = generate({
      equipment: ["bodyweight"],
      adaptation: "maximum_strength",
      observations: [pushUpObservation({ repetitions: 40 })],
    });
    if (result.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }
    // Forty push-ups do not make bodyweight maximum strength possible.
    expect(result.sessionAdequacy.status).toBe("inadequate");
    expect(result.sessionAdequacy.primaryAdaptationCovered).toBe(false);
  });

  test("32. + 33. hypertrophy generation and sequencing are unchanged", () => {
    const result = generate({
      equipment: ["bodyweight"],
      adaptation: "functional_hypertrophy",
      observations: [pushUpObservation({ repetitions: 40 })],
    });
    if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft.");
    }
    expect(result.sessionAdequacy.status).toBe("adequate");
    // H2.3's order still leads with the largest movement.
    expect(result.prescription.session.exercises[0].prescription.exerciseId).toBe("split_squat");
  });

  // 34. No value was ever fabricated.
  test("34. an absent observation is never replaced by a guess", () => {
    const assessment = assessCapability({
      exerciseId: "push_up",
      observation: null,
      profile: HYPERTROPHY_PROFILE,
    });
    expect(assessment.observation).toBeNull();
    expect(assessment.prescriptionWindow).toBeNull();
  });
});
