import { describe, expect, test } from "vitest";

import { runEngine } from "../index";
import {
  DRIVER_ROLES_BY_ADAPTATION,
  driverRolesFor,
  isDriverRoleFor,
} from "../adaptationDrivers";
import { composeSession, EXERCISES_PER_MODULE_ROLE } from "../sessionComposer";
import { EXERCISE_PRESCRIPTION_REGISTRY, isPilotExerciseId } from "../prescription/exercisePrescriptionRegistry";
import { makeAthleteProfile, makeEnvironment, makeReadiness, makeRequest, makeValidInput } from "./fixtures";
import type { AdaptationDomain, EquipmentType, ExerciseSelectionResult, ReadinessState } from "../types";
import type { ExerciseRole } from "../prescription/types";

/**
 * Primary-driver selection — Lot H2.1.
 *
 * WHAT LOT H2 MEASURED AND LEFT OPEN. For a full-gym maximum-strength request,
 * scoring ranked four accessory exercises above every compound lift —
 * `chest_supported_row` 88.05, `neck_training` 88.05, `chin_up` 87.57,
 * `hip_thrust` 87.57, against `bench_press` 84.71 and `back_squat` 63.14. All
 * twelve candidates scored `objectiveRelevance: 100`, because that component
 * reads the knowledge base's `primaryAdaptation`, which says `maximum_strength`
 * for an accessory too. What separated them was safety, fatigue and technical
 * risk — and for a maximum-strength objective, high neural fatigue is what the
 * work IS. The module's quota was then consumed by accessories before any
 * driver was reached.
 *
 * The correction is structural, not a scoring thumb on the scale: SECURE A
 * DRIVER, THEN RANK BY SCORE.
 */

const GYM: readonly EquipmentType[] = [
  "barbell",
  "bench",
  "rack",
  "plates",
  "dumbbell",
  "kettlebell",
  "pull_up_bar",
  "bodyweight",
];

function run(options: {
  equipment: readonly EquipmentType[];
  durationMinutes?: number;
  adaptation?: AdaptationDomain;
  withOneRepMax?: boolean;
  readiness?: ReadinessState;
}) {
  const result = runEngine(
    makeValidInput({
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "intermediate", primaryCombatSport: "krav_maga" },
        performanceReferences: options.withOneRepMax
          ? [
              {
                referenceType: "one_rep_max",
                value: 100,
                unit: "kg",
                sourceId: "1rm",
                measuredAt: null,
                validUntil: null,
                confidence: "validated",
              },
            ]
          : [],
      }),
      readiness: options.readiness ?? makeReadiness(),
      environment: makeEnvironment({
        availableEquipment: options.equipment.map((type) => ({ type })),
      }),
      request: makeRequest({
        durationMinutes: options.durationMinutes ?? 45,
        primaryObjective: { adaptationDomain: options.adaptation ?? "maximum_strength" },
      }),
    }),
  );
  if (result.outcome !== "draft") {
    throw new Error(`Expected a draft, received "${result.outcome}".`);
  }
  return result;
}

function keptPrimaryIds(result: ReturnType<typeof run>): string[] {
  const primaryModule = result.sessionDraft.modules.find(
    (generatedModule) => generatedModule.selectedModule.role === "primary",
  );
  return (primaryModule?.exerciseSelection.candidates ?? [])
    .filter((candidate) => candidate.selected)
    .map((candidate) => candidate.scoredExercise.exercise.id);
}

function roleOf(exerciseId: string): ExerciseRole | null {
  return isPilotExerciseId(exerciseId) ? EXERCISE_PRESCRIPTION_REGISTRY[exerciseId].role : null;
}

describe("primary-driver selection — the Lot H2 regression", () => {
  // 1. The exact bodyweight-only regression, UNCHANGED.
  test("1. bodyweight-only maximum strength is still inadequate — no driver exists to secure", () => {
    const result = run({ equipment: ["bodyweight"], durationMinutes: 30 });

    // This is not a selection failure and Lot H2.1 does not pretend otherwise:
    // every compound lift is rejected at ELIGIBILITY for want of equipment, and
    // the strength module's ranked bench holds exactly one candidate.
    const strengthBench = result.sessionDraft.modules[0].exerciseSelection.candidates;
    expect(strengthBench.map((candidate) => candidate.scoredExercise.exercise.id)).toEqual(["neck_training"]);

    expect(result.sessionAdequacy.status).toBe("inadequate");
    expect(result.sessionAdequacy.primaryAdaptationCovered).toBe(false);
    expect(result.sessionDraft.estimatedDurationMinutes).toBe(8);
  });

  // 9. No valid driver produces an inadequate outcome, explainably.
  test("9. the absence of a driver is stated in the trace, not silently absorbed", () => {
    const result = run({ equipment: ["bodyweight"], durationMinutes: 30 });

    const entry = result.decisionTrace.entries.find((traceEntry) =>
      traceEntry.id.endsWith("_driver_requirement"),
    );
    expect(entry?.decision).toContain("No adaptation driver could be secured");
    expect(entry?.reasons.join(" ")).toContain('requires one of: "primary", "secondary"');
    expect(entry?.reasons.join(" ")).toContain("nothing was substituted in its place");
  });
});

describe("primary-driver selection — structural requirement before score", () => {
  // 2. + 4. + 5. + 16. An accessory cannot take the slot a driver needs.
  test("2. + 4. + 5. + 16. the driver is secured even when four accessories outrank it", () => {
    const result = run({ equipment: GYM, withOneRepMax: true });
    const kept = keptPrimaryIds(result);

    expect(kept.length).toBeLessThanOrEqual(EXERCISES_PER_MODULE_ROLE.primary);
    const drivers = kept.filter((exerciseId) => isDriverRoleFor("maximum_strength", roleOf(exerciseId)));
    expect(drivers.length).toBeGreaterThan(0);
    expect(result.sessionAdequacy.primaryAdaptationCovered).toBe(true);
  });

  // 6. Score still orders within the driver bucket.
  test("6. among drivers, the highest-ranked one is the one secured", () => {
    const result = run({ equipment: GYM, withOneRepMax: true });
    const bench = result.sessionDraft.modules[0].exerciseSelection.candidates;

    const firstDriverOnBench = bench.find((candidate) =>
      isDriverRoleFor("maximum_strength", roleOf(candidate.scoredExercise.exercise.id)),
    );
    const securedDriver = result.sessionAdequacy.drivingExerciseIds[0];
    expect(securedDriver).toBe(firstDriverOnBench?.scoredExercise.exercise.id);
  });

  // 22. The score breakdown is untouched by this lot.
  test("22. scoring is unchanged — the correction is structural, not a thumb on the scale", () => {
    const result = run({ equipment: GYM, withOneRepMax: true });
    const bench = result.sessionDraft.modules[0].exerciseSelection.candidates;

    // Accessories still outscore the driver. That is the point: the session is
    // correct because of WHERE the driver is placed, not because its number was
    // inflated to win.
    const scoreOf = (exerciseId: string) =>
      bench.find((candidate) => candidate.scoredExercise.exercise.id === exerciseId)?.scoredExercise.finalScore;
    const driver = result.sessionAdequacy.drivingExerciseIds[0];
    const topAccessory = bench.find(
      (candidate) => !isDriverRoleFor("maximum_strength", roleOf(candidate.scoredExercise.exercise.id)),
    );
    expect(scoreOf(driver)).toBeLessThan(scoreOf(topAccessory!.scoredExercise.exercise.id)!);

    // And every breakdown component is still populated.
    for (const candidate of bench) {
      const breakdown = candidate.scoredExercise.breakdown;
      expect(breakdown.objectiveRelevance).toBeGreaterThan(0);
      expect(breakdown.equipmentCompatibility).toBeGreaterThan(0);
      expect(typeof breakdown.fatigueCostPenalty).toBe("number");
    }
  });

  // 3. Robustness work does not establish maximum-strength coverage.
  test("3. + 15. robustness and technical roles do not drive maximum strength", () => {
    expect(isDriverRoleFor("maximum_strength", "robustness")).toBe(false);
    expect(isDriverRoleFor("maximum_strength", "technical")).toBe(false);
    expect(isDriverRoleFor("maximum_strength", "accessory")).toBe(false);
    expect(isDriverRoleFor("maximum_strength", "conditioning")).toBe(false);
  });
});

describe("primary-driver selection — prescription feasibility", () => {
  // 7. + 8. The driver secured is one CAS can actually dose.
  test("7. + 8. a driver needing an absent 1RM is passed over, never dosed on a guess", () => {
    // Barbell gym, no recorded 1RM. `bench_press` is eligible, highest-ranked
    // among drivers, and unprescribable — so the next ranked prescribable driver
    // takes the slot instead of the session failing outright.
    const result = run({ equipment: ["barbell", "bench", "rack", "plates"], durationMinutes: 30 });

    expect(result.prescription?.status).toBe("prescribed");
    expect(result.sessionAdequacy.primaryAdaptationCovered).toBe(true);
    expect(result.sessionAdequacy.drivingExerciseIds).not.toContain("bench_press");

    // Nothing invented a load, a training max or a percentage.
    expect(JSON.stringify(result.prescription)).not.toContain("one_rep_max");
  });

  test("the same request WITH a 1RM secures the highest-ranked driver instead", () => {
    const withReference = run({
      equipment: ["barbell", "bench", "rack", "plates"],
      durationMinutes: 30,
      withOneRepMax: true,
    });
    expect(withReference.sessionAdequacy.drivingExerciseIds).toContain("bench_press");
  });

  // 19. Feasibility narrows the choice; it never widens the pool.
  test("19. feasibility never introduces an exercise that was not already eligible and ranked", () => {
    const result = run({ equipment: ["barbell", "bench", "rack", "plates"], durationMinutes: 30 });
    const bench = new Set(
      result.sessionDraft.modules[0].exerciseSelection.candidates.map(
        (candidate) => candidate.scoredExercise.exercise.id,
      ),
    );
    for (const exerciseId of keptPrimaryIds(result)) {
      expect(bench.has(exerciseId)).toBe(true);
    }
  });
});

describe("primary-driver selection — objective-aware driver roles", () => {
  // 13. + 14. Specialist objectives have their own drivers.
  test("13. + 14. conditioning drives conditioning, technical drives a skill objective", () => {
    expect(isDriverRoleFor("conditioning", "conditioning")).toBe(true);
    expect(isDriverRoleFor("specific_skill", "technical")).toBe(true);
    expect(isDriverRoleFor("robustness", "accessory")).toBe(true);
    expect(isDriverRoleFor("recovery", "recovery")).toBe(true);
  });

  test("every adaptation admits at least the two universal driving roles", () => {
    for (const [adaptation, roles] of Object.entries(DRIVER_ROLES_BY_ADAPTATION)) {
      expect(roles).toContain("primary");
      expect(roles).toContain("secondary");
      expect(driverRolesFor(adaptation as AdaptationDomain)).toEqual([...roles]);
    }
  });

  test("an exercise with no registry role is never assumed to drive anything", () => {
    expect(isDriverRoleFor("maximum_strength", null)).toBe(false);
    expect(isDriverRoleFor("robustness", null)).toBe(false);
  });
});

describe("primary-driver selection — quotas, redundancy and determinism", () => {
  // 16. + 17. The cap and Rule 32 still hold.
  test("16. + 17. the module cap is never exceeded and redundancy still applies", () => {
    const result = run({ equipment: GYM, withOneRepMax: true });
    const kept = keptPrimaryIds(result);
    expect(kept.length).toBeLessThanOrEqual(EXERCISES_PER_MODULE_ROLE.primary);
    expect(new Set(kept).size).toBe(kept.length);
  });

  // 18. Equipment constraints are untouched.
  test("18. equipment constraints still decide eligibility before anything else", () => {
    const result = run({ equipment: ["bodyweight"], durationMinutes: 30 });
    for (const exerciseId of keptPrimaryIds(result)) {
      expect(exerciseId).toBe("neck_training");
    }
  });

  // 21. Determinism.
  test("21. repeated identical requests produce identical selections", () => {
    const first = run({ equipment: GYM, withOneRepMax: true });
    const second = run({ equipment: GYM, withOneRepMax: true });
    expect(keptPrimaryIds(second)).toEqual(keptPrimaryIds(first));
    expect(JSON.stringify(second.sessionAdequacy)).toBe(JSON.stringify(first.sessionAdequacy));
  });

  // 20. Composition without a policy is exactly what it was.
  test("20. composing without a policy is unchanged — no driver rule, no filler", () => {
    const result = run({ equipment: GYM, withOneRepMax: true });
    const selections: ExerciseSelectionResult[] = result.sessionDraft.modules.map(
      (generatedModule) => generatedModule.exerciseSelection,
    );
    const withoutPolicy = composeSession(selections, result.selectedModules);
    for (const decision of withoutPolicy.decisions) {
      expect(decision.keptExerciseIds.length).toBeLessThanOrEqual(EXERCISES_PER_MODULE_ROLE[decision.role]);
      expect(decision.reservedDriverExerciseId ?? null).toBeNull();
    }
  });
});

describe("primary-driver selection — representative objectives", () => {
  // 10. + 11. + 12. + 24. + 25.
  const scenarios: readonly (readonly [string, AdaptationDomain, readonly EquipmentType[], number])[] = [
    ["strength", "maximum_strength", GYM, 45],
    ["hypertrophy", "functional_hypertrophy", GYM, 45],
    ["power", "power", ["barbell", "plates", "bodyweight"], 45],
    ["conditioning", "conditioning", ["cardio_machine", "rowing_ergometer", "bodyweight"], 45],
    ["combat support", "specific_skill", ["bodyweight"], 45],
    ["mobility / recovery", "recovery", ["bodyweight"], 45],
    ["equipment-limited", "maximum_strength", ["bodyweight"], 45],
    ["short duration", "maximum_strength", GYM, 15],
    ["long duration", "maximum_strength", GYM, 90],
  ];

  test.each(scenarios)(
    "%s: a covered session is never inadequate, and an inadequate one always names a coverage failure",
    (_label, adaptation, equipment, durationMinutes) => {
      const raw = runEngine(
        makeValidInput({
          athleteProfile: makeAthleteProfile({
            experience: { generalTrainingLevel: "intermediate", primaryCombatSport: "krav_maga" },
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
          }),
          environment: makeEnvironment({ availableEquipment: equipment.map((type) => ({ type })) }),
          request: makeRequest({ durationMinutes, primaryObjective: { adaptationDomain: adaptation } }),
        }),
      );

      // `blocked` is a pre-existing SAFE outcome — the catalogue offers no
      // eligible exercise for this objective under this equipment — and Lot H2.1
      // neither causes it nor papers over it.
      if (raw.outcome !== "draft") {
        expect(raw.outcome).toBe("blocked");
        return;
      }
      const result = raw;

      if (result.sessionAdequacy.primaryAdaptationCovered) {
        expect(result.sessionAdequacy.status).not.toBe("inadequate");
      } else {
        expect(result.sessionAdequacy.status).toBe("inadequate");
        expect(result.sessionAdequacy.findings.map((finding) => finding.reasonCode)).toContain(
          "PRIMARY_ADAPTATION_NOT_DRIVEN",
        );
      }

      // 20. Nothing unrelated is ever added: every kept exercise belongs to a
      // module the engine selected.
      const selectedModules = new Set(result.selectedModules.map((module) => module.module));
      for (const generatedModule of result.sessionDraft.modules) {
        expect(selectedModules.has(generatedModule.selectedModule.module)).toBe(true);
      }
    },
  );

  // 12. A readiness-limited session keeps its driver.
  test("a readiness-limited session still secures its driver", () => {
    const result = run({
      equipment: GYM,
      withOneRepMax: true,
      readiness: makeReadiness({ energy: 1, sleepQuality: 1, perceivedRecovery: 1, soreness: 5, stress: 5 }),
    });
    expect(result.sessionAdequacy.primaryAdaptationCovered).toBe(true);
  });
});
