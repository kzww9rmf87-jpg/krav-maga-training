/**
 * Combat Athlete System — Generic interval foundation: the three
 * Table Group 8 `NumericalPrescriptionProfile`s (INT-SHORT, INT-LONG,
 * INT-REPEATED-SPRINT) from 34_NUMERICAL_PRESCRIPTION_TABLES.md.
 *
 * These are the first profiles to share one (moduleId, methodId,
 * exerciseRole) triple — (conditioning, work_rest_intervals, conditioning) —
 * so this suite also proves the Lot 0 explicit-selection machinery on real
 * documented data: implicit resolution refuses the triple, explicit
 * `numericalProfileId` selection resolves each profile through all four
 * numerical resolvers, and the registry validators demand an explicit id
 * from any entry sitting on the triple. No exercise uses these profiles yet.
 */

import { describe, expect, test } from "vitest";

import {
  NUMERICAL_PRESCRIPTION_PROFILES,
  findDuplicateProfileTriples,
  getNumericalPrescriptionProfileById,
  hasExecutableNumericalProfile,
  isExecutableNumericalProfile,
  resolveNumericalProfile,
} from "../../prescription/prescriptionKnowledge";
import { resolveVolume } from "../../prescription/resolveVolume";
import { resolveIntensity } from "../../prescription/resolveIntensity";
import { resolveRest } from "../../prescription/resolveRest";
import { resolveTempo } from "../../prescription/resolveTempo";
import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  type ExercisePrescriptionRegistryEntry,
} from "../../prescription/exercisePrescriptionRegistry";
import { validateRegistryEntry } from "../../prescription/registryValidators";

const INTERVAL_TRIPLE = {
  moduleId: "conditioning",
  methodId: "work_rest_intervals",
  exerciseRole: "conditioning",
} as const;

const INTERVAL_PROFILE_IDS = [
  "conditioning_short_intervals_v0_1",
  "conditioning_long_intervals_v0_1",
  "repeated_sprint_intervals_v0_1",
  // Table Group 14. A fourth profile joined the triple; every loop below now
  // covers it, so the triple's ambiguity guarantees are asserted over the
  // complete candidate set rather than a frozen subset of it.
  "power_intervals_v0_1",
] as const;

const resolverInput = (profileId: string) =>
  ({
    moduleId: INTERVAL_TRIPLE.moduleId,
    methodId: INTERVAL_TRIPLE.methodId,
    role: INTERVAL_TRIPLE.exerciseRole,
    rangeContext: "normal",
    numericalProfileId: profileId,
  }) as const;

// -----------------------------------------------------------------------------
// Documented profile values — 34_NUMERICAL_PRESCRIPTION_TABLES.md, Table Group 8
// -----------------------------------------------------------------------------

describe("Table Group 8 — documented profile values", () => {
  test("exactly the four interval profiles exist, all on the interval triple, version 0.1", () => {
    for (const profileId of INTERVAL_PROFILE_IDS) {
      const profile = getNumericalPrescriptionProfileById(profileId);

      expect(profile).not.toBeNull();
      if (profile === null) continue;
      expect(profile.version).toBe("0.1");
      expect(profile.moduleId).toBe(INTERVAL_TRIPLE.moduleId);
      expect(profile.methodId).toBe(INTERVAL_TRIPLE.methodId);
      expect(profile.exerciseRole).toBe(INTERVAL_TRIPLE.exerciseRole);
      expect(profile.sourceRuleIds).toContain("34_NUMERICAL_PRESCRIPTION_TABLES_V0_1");
    }

    const onTriple = NUMERICAL_PRESCRIPTION_PROFILES.filter(
      (profile) =>
        profile.moduleId === INTERVAL_TRIPLE.moduleId &&
        profile.methodId === INTERVAL_TRIPLE.methodId &&
        profile.exerciseRole === INTERVAL_TRIPLE.exerciseRole,
    );
    expect(onTriple.map((profile) => profile.profileId).sort()).toEqual(
      [...INTERVAL_PROFILE_IDS].sort(),
    );
  });

  test("INT-SHORT: 10-20 intervals (normal 12), work 15-60s (normal 30) per interval, rest 15-60s (normal 30) between intervals", () => {
    const profile = getNumericalPrescriptionProfileById("conditioning_short_intervals_v0_1");
    if (profile === null) throw new Error("INT-SHORT profile missing.");

    expect(profile.volume.structure).toBe("intervals");
    expect(profile.volume.workIntervals).toEqual({ min: 10, normal: 12, max: 20 });
    expect(profile.volume.duration).toEqual({
      type: "fixed_range",
      range: { min: 15, normal: 30, max: 60, unit: "seconds" },
      scope: "per_interval",
    });
    expect(profile.volume.sets).toBeNull();
    expect(profile.volume.repetitions).toBeNull();
    expect(profile.volume.distance).toBeNull();
    expect(profile.volume.rounds).toBeNull();

    expect(profile.rest?.scope).toBe("between_intervals");
    expect(profile.rest?.seconds).toEqual({ min: 15, normal: 30, max: 60 });
    expect(profile.tempo).toBeNull();

    // "10 intervals × 15 seconds" / "20 intervals × 60 seconds".
    expect(profile.minimumDose.workIntervals).toBe(10);
    expect(profile.minimumDose.durationSeconds).toBe(15);
    expect(profile.maximumDose.workIntervals).toBe(20);
    expect(profile.maximumDose.durationSeconds).toBe(60);

    // No encodable intensity is documented (no numeric RPE range, and no
    // pace/power/heart-rate units exist in the schema) — the table's own
    // "must not prescribe this method numerically" rule.
    expect(profile.intensity).toEqual([]);
  });

  test("INT-LONG: 4-10 intervals (normal 6), work 60-180s (normal 120), passive rest 30-120s, fallback RPE 7-9", () => {
    const profile = getNumericalPrescriptionProfileById("conditioning_long_intervals_v0_1");
    if (profile === null) throw new Error("INT-LONG profile missing.");

    expect(profile.volume.structure).toBe("intervals");
    expect(profile.volume.workIntervals).toEqual({ min: 4, normal: 6, max: 10 });
    expect(profile.volume.duration).toEqual({
      type: "fixed_range",
      range: { min: 60, normal: 120, max: 180, unit: "seconds" },
      scope: "per_interval",
    });

    // Documented passive range 30-120s; normal 75 by the tables' own
    // "Integer Resolution" midpoint convention (no normal is documented).
    expect(profile.rest?.scope).toBe("between_intervals");
    expect(profile.rest?.seconds).toEqual({ min: 30, normal: 75, max: 120 });
    expect(profile.tempo).toBeNull();

    expect(profile.intensity).toHaveLength(1);
    expect(profile.intensity[0]).toMatchObject({
      type: "rpe",
      min: 7,
      normal: 8,
      max: 9,
      unit: "rpe_scale_1_10",
      referenceType: null,
    });

    expect(profile.minimumDose.workIntervals).toBe(4);
    expect(profile.minimumDose.durationSeconds).toBe(60);
    expect(profile.maximumDose.workIntervals).toBe(10);
    expect(profile.maximumDose.durationSeconds).toBe(180);
  });

  test("INT-REPEATED-SPRINT: 10-20 intervals, work 3-8s, rest 20-60s, maximal movement intent", () => {
    const profile = getNumericalPrescriptionProfileById("repeated_sprint_intervals_v0_1");
    if (profile === null) throw new Error("INT-REPEATED-SPRINT profile missing.");

    expect(profile.volume.structure).toBe("intervals");
    // Normals by the "Integer Resolution" convention: 10-20 → 15,
    // 3-8 → 5 (lower integer of an even-width range), 20-60 → 40.
    expect(profile.volume.workIntervals).toEqual({ min: 10, normal: 15, max: 20 });
    expect(profile.volume.duration).toEqual({
      type: "fixed_range",
      range: { min: 3, normal: 5, max: 8, unit: "seconds" },
      scope: "per_interval",
    });
    expect(profile.rest?.scope).toBe("between_intervals");
    expect(profile.rest?.seconds).toEqual({ min: 20, normal: 40, max: 60 });
    expect(profile.tempo).toBeNull();

    // "all-out": the finite movement_intent vocabulary's maximal speed value,
    // per 26_INTENSITY_MODEL.md — never a measured or supramaximal number.
    expect(profile.intensity).toHaveLength(1);
    expect(profile.intensity[0]).toMatchObject({
      type: "movement_intent",
      value: "maximal_safe_speed",
    });
  });

  test("no interval profile requires an exercise-specific load rule or a sport-specific subtype", () => {
    for (const profileId of INTERVAL_PROFILE_IDS) {
      const profile = getNumericalPrescriptionProfileById(profileId);
      expect(profile?.requiresExerciseSpecificLoadRule).toBe(false);
      expect(profile?.requiresSportSpecificSubtype).toBe(false);
    }
  });

  test("INT-SHORT's documented 1:1 to 2:1 work-to-rest ratio holds at every range context", () => {
    const profile = getNumericalPrescriptionProfileById("conditioning_short_intervals_v0_1");
    if (profile?.volume.duration == null || profile.rest?.seconds == null) {
      throw new Error("INT-SHORT work or rest envelope missing.");
    }

    for (const key of ["min", "normal", "max"] as const) {
      const ratio = profile.volume.duration.range[key] / profile.rest.seconds[key];
      expect(ratio).toBeGreaterThanOrEqual(1);
      expect(ratio).toBeLessThanOrEqual(2);
    }
  });
});

// -----------------------------------------------------------------------------
// Structural presence is not executability
// -----------------------------------------------------------------------------

describe("executability of the interval profiles", () => {
  test("INT-SHORT is the only documented profile that is present but not executable", () => {
    const nonExecutable = NUMERICAL_PRESCRIPTION_PROFILES.filter(
      (profile) => !isExecutableNumericalProfile(profile),
    );

    expect(nonExecutable.map((profile) => profile.profileId)).toEqual([
      "conditioning_short_intervals_v0_1",
    ]);
  });

  test("INT-SHORT stays in the documented profile table — its volume and rest envelopes are real, sourced data", () => {
    const profile = getNumericalPrescriptionProfileById("conditioning_short_intervals_v0_1");

    expect(profile).not.toBeNull();
    expect(profile?.volume.workIntervals).not.toBeNull();
    expect(profile?.rest?.seconds).not.toBeNull();
    // Only the intensity dimension is missing, and deliberately so.
    expect(profile?.intensity).toEqual([]);
  });

  test("hasExecutableNumericalProfile answers false for the interval triple — ambiguous, and its first match is not executable", () => {
    expect(
      hasExecutableNumericalProfile(
        INTERVAL_TRIPLE.moduleId,
        INTERVAL_TRIPLE.methodId,
        INTERVAL_TRIPLE.exerciseRole,
      ),
    ).toBe(false);
  });

  test("hasExecutableNumericalProfile still answers true for a unique, executable triple", () => {
    expect(hasExecutableNumericalProfile("strength", "straight_sets_repetitions", "primary")).toBe(true);
    expect(hasExecutableNumericalProfile("grip", "distance_carry_sets", "primary")).toBe(true);
  });

  test("hasExecutableNumericalProfile answers false for a triple no profile documents", () => {
    expect(hasExecutableNumericalProfile("recovery", "straight_sets_repetitions", "primary")).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// Ambiguous-triple behavior — the Lot 0 machinery on real documented data
// -----------------------------------------------------------------------------

describe("interval triple ambiguity", () => {
  test("findDuplicateProfileTriples reports the interval triple with its four profile ids, alongside the Grip triple", () => {
    const duplicates = findDuplicateProfileTriples();

    expect(duplicates).toHaveLength(2);

    const intervalDuplicate = duplicates.find(
      (duplicate) => duplicate.methodId === INTERVAL_TRIPLE.methodId,
    );
    expect(intervalDuplicate).toMatchObject(INTERVAL_TRIPLE);
    expect([...(intervalDuplicate?.profileIds ?? [])].sort()).toEqual(
      [...INTERVAL_PROFILE_IDS].sort(),
    );

    // The Grip triple is the second, and the two never overlap.
    const gripDuplicate = duplicates.find(
      (duplicate) => duplicate.methodId === "straight_sets_repetitions",
    );
    expect(gripDuplicate).toMatchObject({
      moduleId: "grip",
      methodId: "straight_sets_repetitions",
      exerciseRole: "secondary",
    });
    expect([...(gripDuplicate?.profileIds ?? [])].sort()).toEqual(["grip_climb_strength_v0_1", "grip_hand_pull_work_v0_1", "grip_repetition_strength_v0_1"]);
  });

  test("implicit resolution on the triple fails with NUMERICAL_PROFILE_AMBIGUOUS and lists all four candidates", () => {
    const result = resolveNumericalProfile({ ...INTERVAL_TRIPLE });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureCode).toBe("NUMERICAL_PROFILE_AMBIGUOUS");
    expect([...result.candidateProfileIds].sort()).toEqual(
      [...INTERVAL_PROFILE_IDS].sort(),
    );
  });

  test("each interval profile resolves explicitly to itself, tagged explicit_profile_id", () => {
    for (const profileId of INTERVAL_PROFILE_IDS) {
      const result = resolveNumericalProfile({
        ...INTERVAL_TRIPLE,
        explicitProfileId: profileId,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.profile.profileId).toBe(profileId);
      expect(result.resolutionSource).toBe("explicit_profile_id");
    }
  });

  test("every documented triple outside the two ambiguous ones is still unique and unaffected", () => {
    // A second ambiguous triple appeared when the Grip module gained three
    // profiles counting three different units. It is excluded here for the
    // same reason the interval one is: this test guards UNIQUE triples.
    const GRIP_TRIPLE_IDS: readonly string[] = ["grip_climb_strength_v0_1", "grip_hand_pull_work_v0_1", "grip_repetition_strength_v0_1"];

    for (const profile of NUMERICAL_PRESCRIPTION_PROFILES) {
      if (INTERVAL_PROFILE_IDS.includes(profile.profileId as (typeof INTERVAL_PROFILE_IDS)[number])) {
        continue;
      }
      if (GRIP_TRIPLE_IDS.includes(profile.profileId)) {
        continue;
      }

      const result = resolveNumericalProfile({
        moduleId: profile.moduleId,
        methodId: profile.methodId,
        exerciseRole: profile.exerciseRole,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.profile.profileId).toBe(profile.profileId);
    }
  });
});

// -----------------------------------------------------------------------------
// The four numerical resolvers, via explicit selection
// -----------------------------------------------------------------------------

describe("resolveVolume — interval profiles", () => {
  test("every interval profile fails implicit volume resolution with NUMERICAL_PROFILE_AMBIGUOUS", () => {
    const result = resolveVolume({
      moduleId: INTERVAL_TRIPLE.moduleId,
      methodId: INTERVAL_TRIPLE.methodId,
      role: INTERVAL_TRIPLE.exerciseRole,
      rangeContext: "normal",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureCode).toBe("NUMERICAL_PROFILE_AMBIGUOUS");
  });

  test("INT-SHORT resolves 12 intervals of 30s per interval under \"normal\"", () => {
    const result = resolveVolume(resolverInput("conditioning_short_intervals_v0_1"));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profileResolutionSource).toBe("explicit_profile_id");
    expect(result.volume.structure).toBe("intervals");
    expect(result.volume.workIntervals).toBe(12);
    expect(result.volume.duration).toEqual({ value: 30, unit: "seconds", scope: "per_interval" });
    expect(result.volume.sets).toBeNull();
    expect(result.volume.reps).toBeNull();
    expect(result.volume.rounds).toBeNull();
    expect(result.volume.distance).toBeNull();
  });

  test("INT-LONG resolves 6 intervals of 120s; INT-REPEATED-SPRINT resolves 15 intervals of 5s", () => {
    const long = resolveVolume(resolverInput("conditioning_long_intervals_v0_1"));
    const sprint = resolveVolume(resolverInput("repeated_sprint_intervals_v0_1"));

    expect(long.ok && long.volume.workIntervals).toBe(6);
    expect(long.ok && long.volume.duration?.value).toBe(120);
    expect(sprint.ok && sprint.volume.workIntervals).toBe(15);
    expect(sprint.ok && sprint.volume.duration?.value).toBe(5);
  });

  test("reduced and high contexts stay on the documented boundaries and inside the dose envelope", () => {
    for (const profileId of INTERVAL_PROFILE_IDS) {
      const profile = getNumericalPrescriptionProfileById(profileId);
      if (profile?.volume.workIntervals == null || profile.volume.duration == null) {
        throw new Error(`Profile ${profileId} lost its interval envelope.`);
      }

      for (const rangeContext of ["reduced", "high"] as const) {
        const result = resolveVolume({
          ...resolverInput(profileId),
          rangeContext,
        });

        expect(result.ok).toBe(true);
        if (!result.ok) continue;
        const boundary = rangeContext === "reduced" ? "min" : "max";
        expect(result.volume.workIntervals).toBe(profile.volume.workIntervals[boundary]);
        expect(result.volume.duration?.value).toBe(profile.volume.duration.range[boundary]);
      }
    }
  });
});

describe("resolveIntensity — interval profiles", () => {
  test("INT-SHORT fails deterministically with INTENSITY_NOT_DOCUMENTED — the engine must not prescribe it numerically", () => {
    const result = resolveIntensity({
      ...resolverInput("conditioning_short_intervals_v0_1"),
      supportedIntensityTypes: ["rpe", "heart_rate", "pace", "movement_intent"],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureCode).toBe("INTENSITY_NOT_DOCUMENTED");
    expect(result.profileId).toBe("conditioning_short_intervals_v0_1");
  });

  test("INT-SHORT's failure is total — no supported type or range context can ever make it resolve", () => {
    const everyIntensityType = [
      "absolute_load", "percentage_1rm", "percentage_training_max",
      "percentage_body_mass", "rpe", "rir", "velocity", "heart_rate", "pace",
      "technical_effort", "movement_intent", "impact_intent",
      "assistance_level", "resistance_category", "session_intensity",
    ] as const;

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const result = resolveIntensity({
        ...resolverInput("conditioning_short_intervals_v0_1"),
        rangeContext,
        supportedIntensityTypes: everyIntensityType,
      });

      expect(result.ok).toBe(false);
      if (result.ok) continue;
      expect(result.failureCode).toBe("INTENSITY_NOT_DOCUMENTED");
    }
  });

  test("INT-LONG resolves the documented fallback RPE (7 reduced, 8 normal, 9 high)", () => {
    for (const [rangeContext, expected] of [
      ["reduced", 7],
      ["normal", 8],
      ["high", 9],
    ] as const) {
      const result = resolveIntensity({
        ...resolverInput("conditioning_long_intervals_v0_1"),
        rangeContext,
        supportedIntensityTypes: ["rpe"],
      });

      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.selectedRuleType).toBe("rpe");
      expect(result.intensity.primaryMetric.target).toEqual({ type: "fixed", value: expected });
      expect(result.intensity.primaryMetric.unit).toBe("rpe_scale_1_10");
    }
  });

  test("INT-REPEATED-SPRINT resolves the categorical maximal movement intent", () => {
    const result = resolveIntensity({
      ...resolverInput("repeated_sprint_intervals_v0_1"),
      supportedIntensityTypes: ["movement_intent"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.selectedRuleType).toBe("movement_intent");
    expect(result.intensity.primaryMetric.target).toEqual({
      type: "category",
      value: "maximal_safe_speed",
    });
    expect(result.intensity.primaryMetric.unit).toBe("category");
  });

  test("INT-REPEATED-SPRINT fails safely for an exercise that does not support movement intent", () => {
    const result = resolveIntensity({
      ...resolverInput("repeated_sprint_intervals_v0_1"),
      supportedIntensityTypes: ["rpe"],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failureCode).toBe("INTENSITY_TYPE_UNSUPPORTED");
    expect(result.rejectedRuleTypes).toContain("movement_intent");
  });
});

describe("resolveRest — interval profiles", () => {
  test("each profile resolves its documented between-intervals rest at every context", () => {
    const expectedByProfile = {
      conditioning_short_intervals_v0_1: { reduced: 15, normal: 30, high: 60 },
      conditioning_long_intervals_v0_1: { reduced: 30, normal: 75, high: 120 },
      repeated_sprint_intervals_v0_1: { reduced: 20, normal: 40, high: 60 },
      power_intervals_v0_1: { reduced: 20, normal: 55, high: 90 },
    } as const;

    for (const profileId of INTERVAL_PROFILE_IDS) {
      for (const rangeContext of ["reduced", "normal", "high"] as const) {
        const result = resolveRest({
          ...resolverInput(profileId),
          rangeContext,
        });

        expect(result.ok).toBe(true);
        if (!result.ok) continue;
        const target = result.rest?.betweenIntervals;
        expect(target?.type).toBe("fixed");
        if (target?.type !== "fixed") continue;
        expect(target.duration).toEqual({
          value: expectedByProfile[profileId][rangeContext],
          unit: "seconds",
          scope: "between_intervals",
        });
        expect(result.rest?.betweenSets).toBeNull();
        expect(result.rest?.betweenRounds).toBeNull();
      }
    }
  });
});

describe("resolveTempo — interval profiles", () => {
  test("tempo resolves to null for every interval profile — the method forbids tempo and none is documented", () => {
    for (const profileId of INTERVAL_PROFILE_IDS) {
      const result = resolveTempo({
        ...resolverInput(profileId),
        supportedTempoTypes: [],
      });

      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.tempo).toBeNull();
      expect(result.profileId).toBe(profileId);
    }
  });
});

// -----------------------------------------------------------------------------
// Registry validators — the ambiguous triple demands an explicit profile id
// -----------------------------------------------------------------------------

describe("registry validators — entries on the interval triple", () => {
  const syntheticIntervalEntry = (
    numericalProfileId: string | null,
  ): ExercisePrescriptionRegistryEntry => ({
    ...EXERCISE_PRESCRIPTION_REGISTRY.bench_press,
    moduleId: INTERVAL_TRIPLE.moduleId,
    explicitMethodId: INTERVAL_TRIPLE.methodId,
    role: INTERVAL_TRIPLE.exerciseRole,
    numericalProfileId,
  });

  const profileIssueCodes = [
    "UNKNOWN_NUMERICAL_PROFILE",
    "NUMERICAL_PROFILE_TRIPLE_MISMATCH",
    "AMBIGUOUS_TRIPLE_REQUIRES_EXPLICIT_PROFILE",
    "NON_EXECUTABLE_NUMERICAL_PROFILE",
  ];

  test("an entry on the triple without a numericalProfileId is rejected with AMBIGUOUS_TRIPLE_REQUIRES_EXPLICIT_PROFILE", () => {
    const issues = validateRegistryEntry(syntheticIntervalEntry(null));
    const ambiguous = issues.filter(
      (issue) => issue.code === "AMBIGUOUS_TRIPLE_REQUIRES_EXPLICIT_PROFILE",
    );

    expect(ambiguous).toHaveLength(1);
    for (const profileId of INTERVAL_PROFILE_IDS) {
      expect(ambiguous[0]?.message).toContain(profileId);
    }
  });

  test("declaring any executable interval profile satisfies the validator", () => {
    for (const profileId of [
      "conditioning_long_intervals_v0_1",
      "repeated_sprint_intervals_v0_1",
      "power_intervals_v0_1",
    ] as const) {
      const issues = validateRegistryEntry(syntheticIntervalEntry(profileId));

      expect(
        issues.filter((issue) => profileIssueCodes.includes(issue.code)),
      ).toEqual([]);
    }
  });

  test("declaring INT-SHORT is rejected at validation time with NON_EXECUTABLE_NUMERICAL_PROFILE, before any prescription is attempted", () => {
    const issues = validateRegistryEntry(
      syntheticIntervalEntry("conditioning_short_intervals_v0_1"),
    );
    const nonExecutable = issues.filter(
      (issue) => issue.code === "NON_EXECUTABLE_NUMERICAL_PROFILE",
    );

    expect(nonExecutable).toHaveLength(1);
    expect(nonExecutable[0]?.message).toContain("conditioning_short_intervals_v0_1");
    expect(nonExecutable[0]?.message).toContain("INTENSITY_NOT_DOCUMENTED");
    // The selection itself is valid — it is executability, not resolution,
    // that fails here.
    expect(
      issues.some((issue) =>
        ["UNKNOWN_NUMERICAL_PROFILE", "NUMERICAL_PROFILE_TRIPLE_MISMATCH"].includes(issue.code),
      ),
    ).toBe(false);
  });

  test("declaring a profile from another triple is rejected with NUMERICAL_PROFILE_TRIPLE_MISMATCH", () => {
    const issues = validateRegistryEntry(
      syntheticIntervalEntry("strength_primary_straight_sets_v0_1"),
    );

    expect(
      issues.some((issue) => issue.code === "NUMERICAL_PROFILE_TRIPLE_MISMATCH"),
    ).toBe(true);
  });

  test("only the interval entries sit on the interval triple, each naming its own explicit profile — the 59 historical entries are untouched", () => {
    const entries = Object.values(EXERCISE_PRESCRIPTION_REGISTRY);

    expect(entries).toHaveLength(74);

    const onIntervalTriple = entries.filter(
      (entry) =>
        entry.moduleId === INTERVAL_TRIPLE.moduleId &&
        entry.explicitMethodId === INTERVAL_TRIPLE.methodId &&
        entry.role === INTERVAL_TRIPLE.exerciseRole,
    );

    // The whole point of the triple being ambiguous: an entry sitting on it
    // is only legal because it names its own profile — entries on the same
    // triple may resolve to different profiles, or deliberately to the same
    // one, and only the explicit id makes either case auditable.
    const profileByExerciseId = Object.fromEntries(
      onIntervalTriple.map((entry) => [entry.exerciseId, entry.numericalProfileId ?? null]),
    );
    expect(profileByExerciseId).toEqual({
      rowerg_intervals: "conditioning_long_intervals_v0_1",
      sprint_intervals: "repeated_sprint_intervals_v0_1",
      heavy_bag_power_intervals: "power_intervals_v0_1",
      battle_ropes: "power_intervals_v0_1",
      assault_bike_intervals: "power_intervals_v0_1",
    });

    // Three of the four executable profiles are in use, none of them the
    // non-executable one, and every entry declares its id explicitly.
    const selected = Object.values(profileByExerciseId);
    expect(new Set(selected).size).toBe(3);
    expect(selected).not.toContain("conditioning_short_intervals_v0_1");
    for (const entry of onIntervalTriple) {
      expect(entry.numericalProfileId).not.toBeNull();
    }

    // The two entries sharing INT-POWER are told apart by their own
    // documented narrowing, never by the profile.
    const sharing = onIntervalTriple.filter((entry) => entry.numericalProfileId === "power_intervals_v0_1");
    expect(sharing).toHaveLength(3);
    // Three entries, three DIFFERENT documented narrowings — the profile
    // never tells them apart, their own chapters do.
    expect(
      new Set(sharing.map((entry) => entry.exerciseDoseConstraints?.maximumDose?.workIntervals)).size,
    ).toBe(3);

    // Every other entry is still off the triple entirely.
    const intervalEntryIds = Object.keys(profileByExerciseId);
    for (const entry of entries) {
      if (intervalEntryIds.includes(entry.exerciseId)) {
        continue;
      }
      expect(
        entry.moduleId === INTERVAL_TRIPLE.moduleId &&
          entry.explicitMethodId === INTERVAL_TRIPLE.methodId &&
          entry.role === INTERVAL_TRIPLE.exerciseRole,
      ).toBe(false);
    }
  });
});

// -----------------------------------------------------------------------------
// Determinism and non-mutation
// -----------------------------------------------------------------------------

describe("interval profiles — determinism", () => {
  test("identical explicit-selection input produces identical results across all four resolvers", () => {
    const volumeInput = resolverInput("conditioning_long_intervals_v0_1");
    const intensityInput = {
      ...resolverInput("conditioning_long_intervals_v0_1"),
      supportedIntensityTypes: ["rpe"] as const,
    };
    const tempoInput = {
      ...resolverInput("conditioning_long_intervals_v0_1"),
      supportedTempoTypes: [] as const,
    };

    expect(resolveVolume(volumeInput)).toEqual(resolveVolume(volumeInput));
    expect(resolveIntensity(intensityInput)).toEqual(resolveIntensity(intensityInput));
    expect(resolveRest(volumeInput)).toEqual(resolveRest(volumeInput));
    expect(resolveTempo(tempoInput)).toEqual(resolveTempo(tempoInput));
  });

  test("all four resolvers agree on the explicitly selected profile", () => {
    const volume = resolveVolume(resolverInput("repeated_sprint_intervals_v0_1"));
    const intensity = resolveIntensity({
      ...resolverInput("repeated_sprint_intervals_v0_1"),
      supportedIntensityTypes: ["movement_intent"],
    });
    const rest = resolveRest(resolverInput("repeated_sprint_intervals_v0_1"));
    const tempo = resolveTempo({
      ...resolverInput("repeated_sprint_intervals_v0_1"),
      supportedTempoTypes: [],
    });

    if (!volume.ok || !intensity.ok || !rest.ok || !tempo.ok) {
      throw new Error("Expected every resolver to succeed under explicit selection.");
    }

    expect(
      new Set([volume.profileId, intensity.profileId, rest.profileId, tempo.profileId]),
    ).toEqual(new Set(["repeated_sprint_intervals_v0_1"]));
  });
});
