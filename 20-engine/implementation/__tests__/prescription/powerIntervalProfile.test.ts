/**
 * Combat Athlete System — Table Group 14 / Profile INT-POWER
 *
 * `power_intervals_v0_1` completes the work-rest interval family. Table
 * Group 8 already covered three interval structures; none of them covers a
 * fourth the exercise library documents: a small number of short,
 * maximal-intent efforts against a resistance the athlete drives,
 * separated by incomplete recovery.
 *
 * The gap is arithmetic, not editorial. This file proves that first — no
 * EXECUTABLE existing profile fits the documented power-interval family, and
 * the family member this lot integrates is empty against all three on both
 * axes — then guards the new doctrine and the profile that mirrors it,
 * independently of any exercise.
 */

import { describe, expect, test } from "vitest";

import {
  NUMERICAL_PRESCRIPTION_PROFILES,
  getNumericalPrescriptionProfileById,
  hasExecutableNumericalProfile,
  isExecutableNumericalProfile,
  resolveNumericalProfile,
} from "../../prescription/prescriptionKnowledge";
import { resolveVolume, type ExerciseDoseConstraints } from "../../prescription/resolveVolume";
import {
  resolveIntensity,
  type ExerciseIntensityConstraints,
} from "../../prescription/resolveIntensity";
import { resolveRest } from "../../prescription/resolveRest";
import { resolveTempo } from "../../prescription/resolveTempo";
import {
  getModulePrescriptionContract,
  getTrainingMethodContract,
  validateMethodModuleRoleContract,
} from "../../prescription/contracts";

const PROFILE_ID = "power_intervals_v0_1";
const TRIPLE = {
  moduleId: "conditioning",
  methodId: "work_rest_intervals",
  exerciseRole: "conditioning",
} as const;

const profile = () => getNumericalPrescriptionProfileById(PROFILE_ID)!;

const resolverInput = (rangeContext: "reduced" | "normal" | "high") => ({
  moduleId: TRIPLE.moduleId,
  methodId: TRIPLE.methodId,
  role: TRIPLE.exerciseRole,
  rangeContext,
  numericalProfileId: PROFILE_ID,
});

/** The documented power-interval family, from the exercise library. */
const DOCUMENTED_FAMILY = {
  heavy_bag_power_intervals: { intervals: [3, 8], work: [10, 30], rest: [30, 90] },
  battle_ropes: { intervals: [5, 12], work: [10, 40], rest: [20, 90] },
} as const;

const intersects = (a: readonly [number, number], b: readonly [number, number]) =>
  Math.max(a[0], b[0]) <= Math.min(a[1], b[1]);

// -----------------------------------------------------------------------------
// Why a fourth profile — the three existing ones are arithmetically empty
// -----------------------------------------------------------------------------

describe("INT-POWER — why Table Group 8 could not absorb this family", () => {
  test("1. INT-SHORT's interval count does not intersect the family's, and INT-SHORT is not executable at all", () => {
    const short = getNumericalPrescriptionProfileById("conditioning_short_intervals_v0_1")!;
    const documented = short.volume.workIntervals!;

    expect([documented.min, documented.max]).toEqual([10, 20]);
    expect(
      intersects([documented.min, documented.max], DOCUMENTED_FAMILY.heavy_bag_power_intervals.intervals),
    ).toBe(false);

    // Independent of the arithmetic: INT-SHORT documents no intensity rule,
    // so it could never have produced a prescription for anything.
    expect(isExecutableNumericalProfile(short)).toBe(false);
    expect(short.intensity).toHaveLength(0);
  });

  test("2. INT-LONG's 60-180s efforts exceed every documented power interval", () => {
    const long = getNumericalPrescriptionProfileById("conditioning_long_intervals_v0_1")!;
    const documented = long.volume.duration!.range;

    expect([documented.min, documented.max]).toEqual([60, 180]);
    for (const member of Object.values(DOCUMENTED_FAMILY)) {
      expect(intersects([documented.min, documented.max], member.work)).toBe(false);
    }
  });

  test("3. INT-REPEATED-SPRINT's 3-8s efforts fall below every documented power interval", () => {
    const sprint = getNumericalPrescriptionProfileById("repeated_sprint_intervals_v0_1")!;
    const documented = sprint.volume.duration!.range;

    expect([documented.min, documented.max]).toEqual([3, 8]);
    for (const member of Object.values(DOCUMENTED_FAMILY)) {
      expect(intersects([documented.min, documented.max], member.work)).toBe(false);
    }
  });

  test("4. no EXECUTABLE existing profile fits either family member — the one that dimensionally overlaps is INT-SHORT, which cannot prescribe", () => {
    const existing = [
      "conditioning_short_intervals_v0_1",
      "conditioning_long_intervals_v0_1",
      "repeated_sprint_intervals_v0_1",
    ] as const;

    const dimensionallyCompatible = (member: { intervals: readonly [number, number] | readonly number[]; work: readonly number[] }) =>
      existing.filter((profileId) => {
        const candidate = getNumericalPrescriptionProfileById(profileId)!;
        const work = candidate.volume.duration!.range;
        const intervals = candidate.volume.workIntervals!;
        return (
          intersects([work.min, work.max], [member.work[0]!, member.work[1]!]) &&
          intersects([intervals.min, intervals.max], [member.intervals[0]!, member.intervals[1]!])
        );
      });

    // The member this lot integrates: empty against all three, on both axes.
    expect(dimensionallyCompatible(DOCUMENTED_FAMILY.heavy_bag_power_intervals)).toEqual([]);

    // The other member overlaps exactly one profile — and that profile
    // documents no intensity, so it could not have prescribed for it either.
    const ropesCandidates = dimensionallyCompatible(DOCUMENTED_FAMILY.battle_ropes);
    expect(ropesCandidates).toEqual(["conditioning_short_intervals_v0_1"]);
    for (const profileId of ropesCandidates) {
      expect(
        isExecutableNumericalProfile(getNumericalPrescriptionProfileById(profileId)!),
      ).toBe(false);
    }
  });
});

// -----------------------------------------------------------------------------
// The documented doctrine — 34_NUMERICAL_PRESCRIPTION_TABLES.md, Table Group 14
// -----------------------------------------------------------------------------

describe("INT-POWER — documented values", () => {
  test("5. the profile exists exactly once, at version 0.1, on the interval triple, sourced from the tables", () => {
    const matches = NUMERICAL_PRESCRIPTION_PROFILES.filter((p) => p.profileId === PROFILE_ID);

    expect(matches).toHaveLength(1);
    expect(profile().version).toBe("0.1");
    expect(profile().moduleId).toBe(TRIPLE.moduleId);
    expect(profile().methodId).toBe(TRIPLE.methodId);
    expect(profile().exerciseRole).toBe(TRIPLE.exerciseRole);
    expect(profile().sourceRuleIds).toEqual(["34_NUMERICAL_PRESCRIPTION_TABLES_V0_1"]);
  });

  test("6. volume: 3-12 intervals (normal 7), 10-40s (normal 25) per interval, no sets/reps/distance/rounds", () => {
    expect(profile().volume.structure).toBe("intervals");
    expect(profile().volume.workIntervals).toEqual({ min: 3, normal: 7, max: 12 });
    expect(profile().volume.duration).toEqual({
      type: "fixed_range",
      range: { min: 10, normal: 25, max: 40, unit: "seconds" },
      scope: "per_interval",
    });
    expect(profile().volume.sets).toBeNull();
    expect(profile().volume.repetitions).toBeNull();
    expect(profile().volume.distance).toBeNull();
    expect(profile().volume.rounds).toBeNull();
  });

  test("7. the envelope is exactly the union of the documented family — never wider, never an average", () => {
    const members = Object.values(DOCUMENTED_FAMILY);
    const unionOf = (pick: (m: (typeof members)[number]) => readonly [number, number]) => [
      Math.min(...members.map((m) => pick(m)[0])),
      Math.max(...members.map((m) => pick(m)[1])),
    ];

    expect(unionOf((m) => m.intervals)).toEqual([
      profile().volume.workIntervals!.min,
      profile().volume.workIntervals!.max,
    ]);
    expect(unionOf((m) => m.work)).toEqual([
      profile().volume.duration!.range.min,
      profile().volume.duration!.range.max,
    ]);
    expect(unionOf((m) => m.rest)).toEqual([
      profile().rest!.seconds!.min,
      profile().rest!.seconds!.max,
    ]);
  });

  test("8. normals follow the tables' Integer Resolution convention — the same rule INT-REPEATED-SPRINT already obeys", () => {
    // Even-width range → lower integer of the two central candidates.
    const lowerCentralInteger = (min: number, max: number) => Math.floor((min + max) / 2);

    expect(profile().volume.workIntervals!.normal).toBe(lowerCentralInteger(3, 12));
    expect(profile().volume.duration!.range.normal).toBe(lowerCentralInteger(10, 40));
    expect(profile().rest!.seconds!.normal).toBe(lowerCentralInteger(20, 90));

    // The precedent: INT-REPEATED-SPRINT's own 3-8 resolves to 5 the same way.
    const sprint = getNumericalPrescriptionProfileById("repeated_sprint_intervals_v0_1")!;
    expect(sprint.volume.duration!.range.normal).toBe(lowerCentralInteger(3, 8));
  });

  test("9. rest: 20-90s (normal 55) between intervals, sourced from the tables and the rest/tempo chapter", () => {
    expect(profile().rest).toEqual({
      scope: "between_intervals",
      seconds: { min: 20, normal: 55, max: 90 },
      sourceRuleIds: ["34_NUMERICAL_PRESCRIPTION_TABLES_V0_1", "27_REST_TEMPO_RULES_V0_1"],
    });
  });

  test("10. tempo is null because the method forbids it — exactly like the three Table Group 8 profiles", () => {
    expect(profile().tempo).toBeNull();
    expect(getTrainingMethodContract(TRIPLE.methodId)!.tempoPolicy).toBe("forbidden");

    for (const profileId of [
      "conditioning_short_intervals_v0_1",
      "conditioning_long_intervals_v0_1",
      "repeated_sprint_intervals_v0_1",
    ] as const) {
      expect(getNumericalPrescriptionProfileById(profileId)!.tempo).toBeNull();
    }
  });

  test("11. dose envelope: 3x10s minimum, 12x40s maximum, on the volume boundaries and nothing else", () => {
    expect(profile().minimumDose).toMatchObject({ workIntervals: 3, durationSeconds: 10 });
    expect(profile().maximumDose).toMatchObject({ workIntervals: 12, durationSeconds: 40 });

    for (const field of ["sets", "repetitions", "distanceMeters", "rounds"] as const) {
      expect(profile().minimumDose[field]).toBeNull();
      expect(profile().maximumDose[field]).toBeNull();
    }
  });

  test("12. no exercise-specific load rule and no sport-specific subtype are required", () => {
    expect(profile().requiresExerciseSpecificLoadRule).toBe(false);
    expect(profile().requiresSportSpecificSubtype).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// Intensity — two qualitative rules, both from the documented vocabularies
// -----------------------------------------------------------------------------

describe("INT-POWER — intensity", () => {
  test("13. exactly two rules: impact_intent maximal_safe_power, then movement_intent explosive", () => {
    expect(profile().intensity).toHaveLength(2);
    expect(profile().intensity[0]).toEqual({
      type: "impact_intent",
      value: "maximal_safe_power",
      sourceRuleIds: ["34_NUMERICAL_PRESCRIPTION_TABLES_V0_1", "26_INTENSITY_MODEL_V0_1"],
    });
    expect(profile().intensity[1]).toEqual({
      type: "movement_intent",
      value: "explosive",
      sourceRuleIds: ["34_NUMERICAL_PRESCRIPTION_TABLES_V0_1", "26_INTENSITY_MODEL_V0_1"],
    });
  });

  test("14. no RPE, heart rate, pace, velocity or load rule was invented — neither documented record states one", () => {
    for (const rule of profile().intensity) {
      expect(["impact_intent", "movement_intent"]).toContain(rule.type);
    }
    const types = profile().intensity.map((rule) => rule.type);
    for (const absent of [
      "rpe",
      "heart_rate",
      "pace",
      "velocity",
      "absolute_load",
      "percentage_1rm",
      "percentage_body_mass",
      "resistance_category",
      "technical_effort",
    ]) {
      expect(types).not.toContain(absent);
    }
  });

  test("15. both intensity types are allowed by the method AND the module contract", () => {
    const method = getTrainingMethodContract(TRIPLE.methodId)!;
    const module = getModulePrescriptionContract(TRIPLE.moduleId)!;

    for (const type of ["impact_intent", "movement_intent"] as const) {
      expect(method.allowedIntensityTypes).toContain(type);
      expect(module.allowedIntensityTypes).toContain(type);
    }
    // Nothing is force-required, so an exercise may claim either one alone.
    expect(method.requiredIntensityTypes).toEqual([]);
  });

  test("16. an exercise claims ONE rule by narrowing; the profile never imposes both", () => {
    const impactOnly: ExerciseIntensityConstraints = {
      allowedIntensityTypes: ["impact_intent"],
      rangeConstraints: [],
      sourceRuleIds: ["TEST"],
    };
    const movementOnly: ExerciseIntensityConstraints = {
      allowedIntensityTypes: ["movement_intent"],
      rangeConstraints: [],
      sourceRuleIds: ["TEST"],
    };

    const impact = resolveIntensity({
      ...resolverInput("normal"),
      supportedIntensityTypes: ["impact_intent", "movement_intent"],
      exerciseIntensityConstraints: impactOnly,
    });
    const movement = resolveIntensity({
      ...resolverInput("normal"),
      supportedIntensityTypes: ["impact_intent", "movement_intent"],
      exerciseIntensityConstraints: movementOnly,
    });

    expect(impact.ok).toBe(true);
    expect(movement.ok).toBe(true);
    if (!impact.ok || !movement.ok) return;
    expect(impact.selectedRuleType).toBe("impact_intent");
    expect(impact.intensity.primaryMetric).toMatchObject({
      type: "impact_intent",
      target: { type: "category", value: "maximal_safe_power" },
    });
    expect(movement.selectedRuleType).toBe("movement_intent");
    expect(movement.intensity.primaryMetric).toMatchObject({
      type: "movement_intent",
      target: { type: "category", value: "explosive" },
    });
  });

  test("17. with no narrowing, documented rule order decides — impact_intent first, deterministically", () => {
    for (const run of [1, 2, 3]) {
      const result = resolveIntensity({
        ...resolverInput("normal"),
        supportedIntensityTypes: ["impact_intent", "movement_intent"],
      });
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.selectedRuleType).toBe("impact_intent");
      expect(result.intensity.primaryMetric).toMatchObject({
        type: "impact_intent",
        target: { type: "category", value: "maximal_safe_power" },
      });
      expect(run).toBeGreaterThan(0);
    }
  });
});

// -----------------------------------------------------------------------------
// Executability and resolution
// -----------------------------------------------------------------------------

describe("INT-POWER — executability and resolution", () => {
  test("18. the profile is executable, unlike INT-SHORT which shares its triple", () => {
    expect(isExecutableNumericalProfile(profile())).toBe(true);
    expect(
      isExecutableNumericalProfile(
        getNumericalPrescriptionProfileById("conditioning_short_intervals_v0_1")!,
      ),
    ).toBe(false);

    // The triple-level helper resolves implicitly, so it stays false for the
    // whole shared triple — executability here is only reachable through an
    // explicit profile id, which is exactly the registry's obligation.
    expect(
      hasExecutableNumericalProfile(TRIPLE.moduleId, TRIPLE.methodId, TRIPLE.exerciseRole),
    ).toBe(false);
  });

  test("19. the triple/module/method/role combination passes the contract validator", () => {
    const result = validateMethodModuleRoleContract(
      TRIPLE.moduleId,
      TRIPLE.methodId,
      TRIPLE.exerciseRole,
    );
    expect(result.valid).toBe(true);
  });

  test("20. implicit resolution refuses the triple; explicit selection returns this profile", () => {
    const implicit = resolveNumericalProfile({ ...TRIPLE });
    expect(implicit.ok).toBe(false);
    if (!implicit.ok) {
      expect(implicit.failureCode).toBe("NUMERICAL_PROFILE_AMBIGUOUS");
      expect(implicit.candidateProfileIds).toContain(PROFILE_ID);
      expect(implicit.candidateProfileIds).toHaveLength(4);
    }

    const explicit = resolveNumericalProfile({ ...TRIPLE, explicitProfileId: PROFILE_ID });
    expect(explicit.ok).toBe(true);
    if (explicit.ok) {
      expect(explicit.profile.profileId).toBe(PROFILE_ID);
      expect(explicit.resolutionSource).toBe("explicit_profile_id");
    }
  });

  test("21. every resolver produces the documented values at every range context", () => {
    const expected = {
      reduced: { intervals: 3, work: 10, rest: 20 },
      normal: { intervals: 7, work: 25, rest: 55 },
      high: { intervals: 12, work: 40, rest: 90 },
    } as const;

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const volume = resolveVolume(resolverInput(rangeContext));
      const rest = resolveRest(resolverInput(rangeContext));
      const tempo = resolveTempo({ ...resolverInput(rangeContext), supportedTempoTypes: [] });

      expect(volume.ok).toBe(true);
      expect(rest.ok).toBe(true);
      expect(tempo.ok).toBe(true);
      if (!volume.ok || !rest.ok || !tempo.ok) continue;

      expect(volume.volume.workIntervals).toBe(expected[rangeContext].intervals);
      expect(volume.volume.duration?.value).toBe(expected[rangeContext].work);
      expect(volume.volume.duration?.scope).toBe("per_interval");

      const betweenIntervals = rest.rest?.betweenIntervals;
      expect(betweenIntervals?.type).toBe("fixed");
      if (betweenIntervals?.type === "fixed") {
        expect(betweenIntervals.duration).toEqual({
          value: expected[rangeContext].rest,
          unit: "seconds",
          scope: "between_intervals",
        });
      }
      expect(rest.rest?.betweenSets).toBeNull();
      expect(rest.rest?.betweenRounds).toBeNull();

      expect(tempo.tempo).toBeNull();
    }
  });

  test("22. exercise-specific dose constraints narrow the envelope and can never widen it", () => {
    const boundary = (workIntervals: number, durationSeconds: number) => ({
      sets: null,
      repetitions: null,
      durationSeconds,
      distanceMeters: null,
      rounds: null,
      workIntervals,
    });

    const narrower: ExerciseDoseConstraints = {
      minimumDose: boundary(3, 10),
      maximumDose: boundary(8, 30),
      sourceRuleIds: ["TEST"],
    };
    const wider: ExerciseDoseConstraints = {
      minimumDose: boundary(1, 1),
      maximumDose: boundary(30, 300),
      sourceRuleIds: ["TEST"],
    };

    const narrowed = resolveVolume({
      ...resolverInput("high"),
      exerciseDoseConstraints: narrower,
    });
    const widened = resolveVolume({
      ...resolverInput("high"),
      exerciseDoseConstraints: wider,
    });

    expect(narrowed.ok).toBe(true);
    expect(widened.ok).toBe(true);
    if (!narrowed.ok || !widened.ok) return;

    expect(narrowed.volume.workIntervals).toBe(8);
    expect(narrowed.volume.duration?.value).toBe(30);

    // The wider constraint is clamped back to the profile's own envelope.
    expect(widened.volume.workIntervals).toBe(12);
    expect(widened.volume.duration?.value).toBe(40);
  });
});

// -----------------------------------------------------------------------------
// Non-regression on the three profiles that already shared the triple
// -----------------------------------------------------------------------------

describe("INT-POWER — the three Table Group 8 profiles are untouched", () => {
  test("23. INT-SHORT, INT-LONG and INT-REPEATED-SPRINT keep every documented value", () => {
    const frozen = {
      conditioning_short_intervals_v0_1: {
        intervals: [10, 12, 20],
        work: [15, 30, 60],
        rest: [15, 30, 60],
        intensityCount: 0,
      },
      conditioning_long_intervals_v0_1: {
        intervals: [4, 6, 10],
        work: [60, 120, 180],
        rest: [30, 75, 120],
        intensityCount: 1,
      },
      repeated_sprint_intervals_v0_1: {
        intervals: [10, 15, 20],
        work: [3, 5, 8],
        rest: [20, 40, 60],
        intensityCount: 1,
      },
    } as const;

    for (const [profileId, expected] of Object.entries(frozen)) {
      const candidate = getNumericalPrescriptionProfileById(profileId)!;
      const intervals = candidate.volume.workIntervals!;
      const work = candidate.volume.duration!.range;
      const rest = candidate.rest!.seconds!;

      expect([intervals.min, intervals.normal, intervals.max]).toEqual(expected.intervals);
      expect([work.min, work.normal, work.max]).toEqual(expected.work);
      expect([rest.min, rest.normal, rest.max]).toEqual(expected.rest);
      expect(candidate.intensity).toHaveLength(expected.intensityCount);
    }
  });

  test("24. the interval triple is a duplicated triple and keeps exactly its four profiles", () => {
    const counts = new Map<string, string[]>();
    for (const candidate of NUMERICAL_PRESCRIPTION_PROFILES) {
      const key = `${candidate.moduleId}|${candidate.methodId}|${candidate.exerciseRole}`;
      counts.set(key, [...(counts.get(key) ?? []), candidate.profileId]);
    }

    const duplicated = [...counts.entries()].filter(([, ids]) => ids.length > 1);
    // Two triples are shared now: this one, and the Grip repetition triple
    // whose three profiles count three different units.
    expect(duplicated).toHaveLength(2);

    const interval = duplicated.find(([key]) => key === "conditioning|work_rest_intervals|conditioning");
    expect(interval).toBeDefined();
    expect(interval?.[1]).toHaveLength(4);

    const grip = duplicated.find(([key]) => key === "grip|straight_sets_repetitions|secondary");
    expect(grip?.[1].slice().sort()).toEqual(["grip_climb_strength_v0_1", "grip_hand_pull_work_v0_1", "grip_repetition_strength_v0_1"]);
    // The two never overlap.
    expect(interval?.[1].filter((id) => grip?.[1].includes(id))).toEqual([]);
  });
});
