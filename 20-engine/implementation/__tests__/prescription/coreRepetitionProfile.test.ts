/**
 * Combat Athlete System — Table Group 13: Core Repetition Work
 *
 * `core_robustness_straight_sets_v0_1` closes a documented gap: Table Group 4
 * covered Core work prescribed as a timed hold, and nothing covered Core work
 * prescribed in repetitions. Until this profile existed, every
 * (core, straight_sets_repetitions, *) triple resolved to
 * NUMERICAL_PROFILE_MISSING for all five roles the Core module allows.
 *
 * This file guards the profile as a FAMILY envelope, independently of any
 * exercise:
 *
 * - it mirrors the canonical table exactly, value for value;
 * - it is executable (a documented, encodable intensity) — the property
 *   `conditioning_short_intervals_v0_1` still lacks;
 * - it resolves under reduced / normal / high through all four numerical
 *   resolvers;
 * - it is reusable: a second, synthetic Core fixture narrows it differently
 *   from the first real consumer, proving the envelope is not shaped around
 *   one exercise.
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
import { resolveIntensity, type ExerciseIntensityConstraints } from "../../prescription/resolveIntensity";
import { resolveRest } from "../../prescription/resolveRest";
import { resolveTempo } from "../../prescription/resolveTempo";
import { getTrainingMethodContract, getModulePrescriptionContract } from "../../prescription/contracts";

const PROFILE_ID = "core_robustness_straight_sets_v0_1";
const TRIPLE = { moduleId: "core", methodId: "straight_sets_repetitions", exerciseRole: "robustness" } as const;

const profile = () => getNumericalPrescriptionProfileById(PROFILE_ID)!;

const resolverInput = (rangeContext: "reduced" | "normal" | "high") => ({
  moduleId: TRIPLE.moduleId,
  methodId: TRIPLE.methodId,
  role: TRIPLE.exerciseRole,
  rangeContext,
});

// -----------------------------------------------------------------------------
// 1-3. The table, the profile, its executability
// -----------------------------------------------------------------------------

describe("Table Group 13 — the canonical table is implemented", () => {
  test("1. the profile exists exactly once, on the documented triple", () => {
    const matches = NUMERICAL_PRESCRIPTION_PROFILES.filter((p) => p.profileId === PROFILE_ID);
    expect(matches).toHaveLength(1);

    const p = profile();
    expect(p.moduleId).toBe("core");
    expect(p.methodId).toBe("straight_sets_repetitions");
    expect(p.exerciseRole).toBe("robustness");
    expect(p.version).toBe("0.1");
    expect(p.sourceRuleIds).toEqual(["34_NUMERICAL_PRESCRIPTION_TABLES_V0_1"]);
  });

  test("2. the profile mirrors the canonical table value for value", () => {
    const p = profile();

    // Volume: sets 2-5 normal 3, repetitions 3-15 normal 10.
    expect(p.volume.structure).toBe("sets_reps");
    expect(p.volume.sets).toEqual({ min: 2, normal: 3, max: 5 });
    expect(p.volume.repetitions).toEqual({
      type: "fixed_range",
      range: { min: 3, normal: 10, max: 15 },
    });
    // A sets_reps profile carries no duration, distance, rounds or intervals.
    expect(p.volume.duration).toBeNull();
    expect(p.volume.distance).toBeNull();
    expect(p.volume.rounds).toBeNull();
    expect(p.volume.workIntervals).toBeNull();

    // Intensity: RPE 6-8 normal 7, or technical_effort high_quality.
    expect(p.intensity).toHaveLength(2);
    expect(p.intensity[0]).toMatchObject({ type: "rpe", min: 6, normal: 7, max: 8, unit: "rpe_scale_1_10", referenceType: null });
    expect(p.intensity[1]).toMatchObject({ type: "technical_effort", value: "high_quality" });

    // Rest: 45-120 s normal 60, between sets.
    expect(p.rest?.scope).toBe("between_sets");
    expect(p.rest?.seconds).toEqual({ min: 45, normal: 60, max: 120 });

    // Tempo: global_intent / controlled.
    expect(p.tempo).toMatchObject({ type: "global_intent", globalIntent: "controlled" });

    // Dose boundaries.
    expect(p.minimumDose.sets).toBe(2);
    expect(p.minimumDose.repetitions).toBe(3);
    expect(p.maximumDose.sets).toBe(5);
    expect(p.maximumDose.repetitions).toBe(15);
    expect(p.requiresExerciseSpecificLoadRule).toBe(false);
    expect(p.requiresSportSpecificSubtype).toBe(false);
  });

  test("3. the profile is executable, unlike conditioning_short_intervals_v0_1", () => {
    expect(isExecutableNumericalProfile(profile())).toBe(true);
    expect(hasExecutableNumericalProfile("core", "straight_sets_repetitions", "robustness")).toBe(true);

    // The contrast that makes "executable" a real distinction.
    const shortIntervals = getNumericalPrescriptionProfileById("conditioning_short_intervals_v0_1")!;
    expect(isExecutableNumericalProfile(shortIntervals)).toBe(false);
  });

  test("3b. the triple is unique, so it resolves without an explicit id — and the gap it closed is real", () => {
    const resolution = resolveNumericalProfile(TRIPLE);
    if (!resolution.ok) {
      throw new Error(`Expected the Core repetition triple to resolve: ${resolution.message}`);
    }
    expect(resolution.profile.profileId).toBe(PROFILE_ID);
    expect(resolution.resolutionSource).toBe("module_method_role_unique");

    // The four other roles the Core module allows still have no repetition
    // profile — this table deliberately encodes its own first-listed role
    // only, exactly as repeated_sprint_intervals_v0_1 does for its table.
    for (const exerciseRole of ["primary", "secondary", "accessory", "corrective"] as const) {
      const other = resolveNumericalProfile({ ...TRIPLE, exerciseRole });
      expect(other.ok).toBe(false);
      if (other.ok) continue;
      expect(other.failureCode).toBe("NUMERICAL_PROFILE_MISSING");
    }
  });
});

// -----------------------------------------------------------------------------
// 4-10. Resolution under reduced / normal / high
// -----------------------------------------------------------------------------

describe("Table Group 13 — resolution under every range context", () => {
  const EXPECTED = {
    reduced: { sets: 2, reps: 3, rpe: 6, rest: 45 },
    normal: { sets: 3, reps: 10, rpe: 7, rest: 60 },
    high: { sets: 5, reps: 15, rpe: 8, rest: 120 },
  } as const;

  for (const rangeContext of ["reduced", "normal", "high"] as const) {
    test(`4. "${rangeContext}" resolves volume, intensity, rest and tempo as documented`, () => {
      const expected = EXPECTED[rangeContext];

      // 5-7. Volume: structure, sets, repetitions.
      const volume = resolveVolume(resolverInput(rangeContext));
      if (!volume.ok) {
        throw new Error(`Expected volume to resolve: ${volume.message}`);
      }
      expect(volume.profileId).toBe(PROFILE_ID);
      expect(volume.volume.structure).toBe("sets_reps");
      expect(volume.volume.sets).toBe(expected.sets);
      expect(volume.volume.reps).toEqual({ type: "fixed", value: expected.reps, min: null, max: null, unit: "repetitions" });
      expect(volume.narrowingNotes).toEqual([]);

      // 8. Intensity — RPE resolves numerically across the three contexts.
      const intensity = resolveIntensity({
        ...resolverInput(rangeContext),
        supportedIntensityTypes: ["rpe", "technical_effort"],
        preferredIntensityType: "rpe",
      });
      if (!intensity.ok) {
        throw new Error(`Expected intensity to resolve: ${intensity.message}`);
      }
      expect(intensity.selectedRuleType).toBe("rpe");
      expect(intensity.intensity.primaryMetric.target).toEqual({ type: "fixed", value: expected.rpe });
      expect(intensity.intensity.primaryMetric.unit).toBe("rpe_scale_1_10");
      expect(intensity.intensity.primaryMetric.reference).toBeNull();

      // 9. Rest — between sets.
      const rest = resolveRest(resolverInput(rangeContext));
      if (!rest.ok || rest.rest === null) {
        throw new Error("Expected rest to resolve.");
      }
      const betweenSets = rest.rest.betweenSets;
      if (betweenSets?.type !== "fixed") {
        throw new Error("Expected a fixed between-sets rest target.");
      }
      expect(betweenSets.duration.value).toBe(expected.rest);
      expect(betweenSets.duration.scope).toBe("between_sets");

      // 10. Tempo — global intent, controlled, identical at every context.
      const tempo = resolveTempo({ ...resolverInput(rangeContext), supportedTempoTypes: ["global_intent"] });
      if (!tempo.ok || tempo.tempo === null) {
        throw new Error("Expected tempo to resolve.");
      }
      expect(tempo.tempo.type).toBe("global_intent");
      expect(tempo.tempo.globalIntent).toBe("controlled");
    });
  }

  test("8b. the alternative technical_effort metric resolves for an exercise that prefers it", () => {
    const intensity = resolveIntensity({
      ...resolverInput("normal"),
      supportedIntensityTypes: ["technical_effort"],
      preferredIntensityType: "technical_effort",
    });
    if (!intensity.ok) {
      throw new Error(`Expected technical_effort to resolve: ${intensity.message}`);
    }
    expect(intensity.selectedRuleType).toBe("technical_effort");
    expect(intensity.intensity.primaryMetric.target).toEqual({ type: "category", value: "high_quality" });
  });
});

// -----------------------------------------------------------------------------
// Contract conformance
// -----------------------------------------------------------------------------

describe("Table Group 13 — contract conformance", () => {
  test("the profile satisfies the straight_sets_repetitions method contract", () => {
    const contract = getTrainingMethodContract("straight_sets_repetitions");
    const p = profile();

    expect(contract.supportedModules).toContain("core");
    expect(contract.supportedRoles).toContain("robustness");
    expect(contract.volumeStructure).toBe(p.volume.structure);
    // Required fields present, forbidden fields absent.
    expect(contract.requiredVolumeFields).toEqual(["sets", "repetitions"]);
    expect(p.volume.sets).not.toBeNull();
    expect(p.volume.repetitions).not.toBeNull();
    for (const forbidden of contract.forbiddenVolumeFields) {
      if (forbidden === "duration") expect(p.volume.duration).toBeNull();
      if (forbidden === "distance") expect(p.volume.distance).toBeNull();
      if (forbidden === "rounds") expect(p.volume.rounds).toBeNull();
      if (forbidden === "work_intervals") expect(p.volume.workIntervals).toBeNull();
    }
    // Rest is required by the method and documented by the profile.
    expect(contract.restPolicy).toBe("required");
    expect(p.rest?.seconds).not.toBeNull();
    // Tempo is optional and global_intent is allowed.
    expect(contract.tempoPolicy).toBe("optional");
    expect(contract.allowedTempoTypes).toContain("global_intent");
    // Both intensity metrics are allowed by the method.
    for (const rule of p.intensity) {
      expect(contract.allowedIntensityTypes).toContain(rule.type);
    }
  });

  test("the profile satisfies the Core module contract, and claims no metric the module forbids", () => {
    const module = getModulePrescriptionContract("core");
    const p = profile();

    expect(module.allowedRoles).toContain("robustness");
    expect(module.allowedMethods.some((rule) => rule.methodId === "straight_sets_repetitions")).toBe(true);
    for (const rule of p.intensity) {
      expect(module.allowedIntensityTypes).toContain(rule.type);
    }
    // The Core module never authorises a percentage of a one-repetition
    // maximum, and this profile documents none.
    expect(module.allowedIntensityTypes).not.toContain("percentage_1rm");
    expect(p.intensity.map((rule) => rule.type)).not.toContain("percentage_1rm");
  });

  test("the Core module's two profiles are complementary, not overlapping: one timed, one in repetitions", () => {
    const coreProfiles = NUMERICAL_PRESCRIPTION_PROFILES.filter((p) => p.moduleId === "core");
    expect(coreProfiles.map((p) => p.profileId).sort()).toEqual([
      "core_robustness_straight_sets_v0_1",
      "timed_isometric_core_robustness_v0_1",
    ]);

    const timed = getNumericalPrescriptionProfileById("timed_isometric_core_robustness_v0_1")!;
    expect(timed.methodId).toBe("timed_isometric_sets");
    expect(timed.volume.structure).toBe("sets_duration");
    expect(timed.volume.repetitions).toBeNull();
    expect(profile().volume.duration).toBeNull();

    // The Core doctrine shared between them, inherited unchanged from
    // Table Group 4: the same RPE band and the same rest envelope.
    expect(timed.rest?.seconds).toEqual(profile().rest?.seconds);
    const timedRpe = timed.intensity.find((rule) => rule.type === "rpe")!;
    const repRpe = profile().intensity.find((rule) => rule.type === "rpe")!;
    expect([timedRpe, repRpe].every((rule) => "min" in rule && rule.min === 6 && rule.max === 8)).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// 31. Reusability — the envelope is a family rule, not one exercise's range
// -----------------------------------------------------------------------------

describe("Table Group 13 — the envelope is reusable by the whole Core repetition family", () => {
  /**
   * Two synthetic Core consumers narrowing the SAME envelope to two
   * different documented shapes. Neither is a registry entry: the point is
   * to prove the profile is not built around one exercise's range.
   *
   * The bounds mirror what `62_CORE/00_OVERVIEW.md`'s own "Volume
   * Principles" names as repetition-prescribed family members, without
   * asserting anything about exercises that are not yet integrated.
   */
  const narrowTo = (repMin: number, repMax: number, setMin: number, setMax: number): ExerciseDoseConstraints => ({
    minimumDose: { sets: setMin, repetitions: repMin, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    maximumDose: { sets: setMax, repetitions: repMax, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
    sourceRuleIds: ["50-exercises/62_CORE/00_OVERVIEW.md"],
  });

  test("a low-repetition consumer and a high-repetition consumer both resolve from the same envelope", () => {
    const lowRep = resolveVolume({ ...resolverInput("high"), exerciseDoseConstraints: narrowTo(3, 6, 3, 5) });
    const highRep = resolveVolume({ ...resolverInput("high"), exerciseDoseConstraints: narrowTo(6, 15, 2, 4) });

    if (!lowRep.ok || !highRep.ok) {
      throw new Error("Expected both synthetic Core consumers to resolve.");
    }

    expect(lowRep.volume.reps).toEqual({ type: "fixed", value: 6, min: null, max: null, unit: "repetitions" });
    expect(lowRep.volume.sets).toBe(5);
    expect(highRep.volume.reps).toEqual({ type: "fixed", value: 15, min: null, max: null, unit: "repetitions" });
    expect(highRep.volume.sets).toBe(4);

    // Each narrowing is reported, and neither widened the shared envelope.
    expect(lowRep.narrowingNotes.some((note) => note.includes("repetitions range 3-15 narrowed to 3-6"))).toBe(true);
    expect(highRep.narrowingNotes.some((note) => note.includes("repetitions range 3-15 narrowed to 6-15"))).toBe(true);
  });

  test("a narrowing that tries to widen the envelope is clamped, never honoured", () => {
    // Asking for 1-30 repetitions cannot escape the documented 3-15.
    const widened = resolveVolume({ ...resolverInput("high"), exerciseDoseConstraints: narrowTo(1, 30, 1, 9) });
    if (!widened.ok) {
      throw new Error("Expected the resolution to succeed with clamped bounds.");
    }
    expect(widened.volume.reps).toEqual({ type: "fixed", value: 15, min: null, max: null, unit: "repetitions" });
    expect(widened.volume.sets).toBe(5);
    expect(widened.narrowingNotes).toEqual([]);
  });

  test("an intensity narrowing inside the documented RPE band resolves; the band itself is never widened", () => {
    const constraints: ExerciseIntensityConstraints = {
      allowedIntensityTypes: ["rpe"],
      rangeConstraints: [{ type: "rpe", minimum: 7, maximum: 8, normal: null }],
      sourceRuleIds: ["50-exercises/62_CORE/00_OVERVIEW.md"],
    };
    const narrowed = resolveIntensity({
      ...resolverInput("reduced"),
      supportedIntensityTypes: ["rpe"],
      preferredIntensityType: "rpe",
      exerciseIntensityConstraints: constraints,
    });
    if (!narrowed.ok) {
      throw new Error(`Expected the narrowed intensity to resolve: ${narrowed.message}`);
    }
    // "reduced" now selects 7, the narrowed floor, not the profile's own 6.
    expect(narrowed.intensity.primaryMetric.target).toEqual({ type: "fixed", value: 7 });

    const widening: ExerciseIntensityConstraints = {
      allowedIntensityTypes: ["rpe"],
      rangeConstraints: [{ type: "rpe", minimum: 2, maximum: 10, normal: null }],
      sourceRuleIds: ["50-exercises/62_CORE/00_OVERVIEW.md"],
    };
    const clamped = resolveIntensity({
      ...resolverInput("reduced"),
      supportedIntensityTypes: ["rpe"],
      preferredIntensityType: "rpe",
      exerciseIntensityConstraints: widening,
    });
    if (!clamped.ok) {
      throw new Error("Expected the clamped intensity to resolve.");
    }
    expect(clamped.intensity.primaryMetric.target).toEqual({ type: "fixed", value: 6 });
  });

  test("determinism: identical input produces identical results across all four resolvers", () => {
    const input = resolverInput("normal");
    expect(resolveVolume(input)).toEqual(resolveVolume(input));
    expect(resolveRest(input)).toEqual(resolveRest(input));
    expect(
      resolveIntensity({ ...input, supportedIntensityTypes: ["rpe"] }),
    ).toEqual(resolveIntensity({ ...input, supportedIntensityTypes: ["rpe"] }));
    expect(
      resolveTempo({ ...input, supportedTempoTypes: ["global_intent"] }),
    ).toEqual(resolveTempo({ ...input, supportedTempoTypes: ["global_intent"] }));
  });
});
