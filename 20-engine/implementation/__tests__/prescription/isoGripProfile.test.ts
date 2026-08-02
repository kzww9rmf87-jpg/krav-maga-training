/**
 * Combat Athlete System — Table Group 4 / Profile ISO-GRIP
 *
 * `timed_isometric_grip_v0_1` completes the Grip module: Table Group 5
 * covers grip work prescribed as a loaded carry
 * (`distance_carry_strength_grip_v0_1`), this one covers grip work
 * prescribed as a timed hold.
 *
 * It was documented in the canonical table since V0.1 and never
 * implemented, because the table as written could not produce a
 * prescription. Two defects were corrected in the table itself first:
 *
 * 1. its role list opened with `primary`, which `timed_isometric_sets`
 *    does not support — any entry declaring it failed
 *    METHOD_ROLE_INCOMPATIBLE before a single number was read;
 * 2. it documented no tempo, while the method declares
 *    `tempoPolicy: required` — resolveTempo would have failed with
 *    TEMPO_REQUIRED_BUT_UNDOCUMENTED on every input.
 *
 * This file guards the corrected doctrine and the profile that mirrors it,
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
import { resolveIntensity } from "../../prescription/resolveIntensity";
import { resolveRest } from "../../prescription/resolveRest";
import { resolveTempo } from "../../prescription/resolveTempo";
import {
  getModulePrescriptionContract,
  getTrainingMethodContract,
  validateMethodModuleRoleContract,
} from "../../prescription/contracts";

const PROFILE_ID = "timed_isometric_grip_v0_1";
const TRIPLE = { moduleId: "grip", methodId: "timed_isometric_sets", exerciseRole: "secondary" } as const;

const profile = () => getNumericalPrescriptionProfileById(PROFILE_ID)!;

const resolverInput = (rangeContext: "reduced" | "normal" | "high") => ({
  moduleId: TRIPLE.moduleId,
  methodId: TRIPLE.methodId,
  role: TRIPLE.exerciseRole,
  rangeContext,
});

// -----------------------------------------------------------------------------
// The corrected doctrine
// -----------------------------------------------------------------------------

describe("ISO-GRIP — the two corrected table defects", () => {
  test("DEFECT 1 FIXED: the encoded role is one the method actually supports; `primary` never was", () => {
    const method = getTrainingMethodContract("timed_isometric_sets");

    // The method has never supported `primary` — that is why the table's
    // old role list could not be honoured.
    expect(method.supportedRoles).not.toContain("primary");
    expect(validateMethodModuleRoleContract("grip", "timed_isometric_sets", "primary").valid).toBe(false);

    // The corrected list is secondary / accessory / robustness; all three
    // are valid, and the profile encodes the first.
    for (const role of ["secondary", "accessory", "robustness"] as const) {
      expect(validateMethodModuleRoleContract("grip", "timed_isometric_sets", role).valid).toBe(true);
    }
    expect(profile().exerciseRole).toBe("secondary");

    // `corrective` and `recovery` are permitted by the method but are NOT
    // claimed by this table: an RPE 7-9 band is not corrective work.
    expect(method.supportedRoles).toContain("corrective");
    expect(method.supportedRoles).toContain("recovery");
    expect(profile().exerciseRole).not.toBe("corrective");
    expect(profile().exerciseRole).not.toBe("recovery");
  });

  test("DEFECT 2 FIXED: the profile documents the tempo its own method requires", () => {
    const method = getTrainingMethodContract("timed_isometric_sets");

    expect(method.tempoPolicy).toBe("required");
    expect(method.allowedTempoTypes).toContain("isometric_hold");

    expect(profile().tempo).toMatchObject({ type: "isometric_hold", globalIntent: null });

    // The same shape the sibling profile in this table group already uses —
    // it carries no number, so nothing was invented to fill the gap.
    const isoCore = getNumericalPrescriptionProfileById("timed_isometric_core_robustness_v0_1")!;
    expect(isoCore.tempo?.type).toBe("isometric_hold");
    expect(profile().tempo?.globalIntent).toBeNull();

    // And it actually resolves now, which is the whole point.
    const tempo = resolveTempo({ ...resolverInput("normal"), supportedTempoTypes: ["isometric_hold"] });
    if (!tempo.ok || tempo.tempo === null) {
      throw new Error("Expected the tempo to resolve.");
    }
    expect(tempo.tempo.type).toBe("isometric_hold");
  });
});

// -----------------------------------------------------------------------------
// The profile mirrors the table
// -----------------------------------------------------------------------------

describe("ISO-GRIP — the profile mirrors the canonical table", () => {
  test("it exists exactly once, on the documented triple, sourced to the table", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES.filter((p) => p.profileId === PROFILE_ID)).toHaveLength(1);

    const p = profile();
    expect(p.moduleId).toBe("grip");
    expect(p.methodId).toBe("timed_isometric_sets");
    expect(p.version).toBe("0.1");
    expect(p.sourceRuleIds).toEqual(["34_NUMERICAL_PRESCRIPTION_TABLES_V0_1"]);
  });

  test("every value matches the table, field for field", () => {
    const p = profile();

    // Volume: sets 2-4 normal 3, duration 10-30s normal 20, per set.
    expect(p.volume.structure).toBe("sets_duration");
    expect(p.volume.sets).toEqual({ min: 2, normal: 3, max: 4 });
    expect(p.volume.duration).toEqual({
      type: "fixed_range",
      range: { min: 10, normal: 20, max: 30, unit: "seconds" },
      scope: "per_set",
    });
    // A sets_duration profile carries no repetitions, distance or intervals.
    expect(p.volume.repetitions).toBeNull();
    expect(p.volume.distance).toBeNull();
    expect(p.volume.rounds).toBeNull();
    expect(p.volume.workIntervals).toBeNull();

    // Intensity: RPE 7-9 normal 8.
    expect(p.intensity).toHaveLength(1);
    expect(p.intensity[0]).toMatchObject({
      type: "rpe",
      min: 7,
      normal: 8,
      max: 9,
      unit: "rpe_scale_1_10",
      referenceType: null,
    });

    // Rest: 60-150s normal 90, between sets.
    expect(p.rest?.scope).toBe("between_sets");
    expect(p.rest?.seconds).toEqual({ min: 60, normal: 90, max: 150 });

    // Dose boundaries: 2x10s and 4x30s.
    expect(p.minimumDose.sets).toBe(2);
    expect(p.minimumDose.durationSeconds).toBe(10);
    expect(p.maximumDose.sets).toBe(4);
    expect(p.maximumDose.durationSeconds).toBe(30);

    // "or an exercise-specific external-load rule" — the same mapping the
    // sibling grip table already uses.
    expect(p.requiresExerciseSpecificLoadRule).toBe(true);
    expect(getNumericalPrescriptionProfileById("distance_carry_strength_grip_v0_1")!.requiresExerciseSpecificLoadRule).toBe(true);
    expect(p.requiresSportSpecificSubtype).toBe(false);
  });

  test("it is executable, and its triple is unique so it resolves implicitly", () => {
    expect(isExecutableNumericalProfile(profile())).toBe(true);
    expect(hasExecutableNumericalProfile("grip", "timed_isometric_sets", "secondary")).toBe(true);

    const resolution = resolveNumericalProfile(TRIPLE);
    if (!resolution.ok) {
      throw new Error(`Expected the grip isometric triple to resolve: ${resolution.message}`);
    }
    expect(resolution.profile.profileId).toBe(PROFILE_ID);
    expect(resolution.resolutionSource).toBe("module_method_role_unique");

    // The other two roles the corrected table lists have no profile of
    // their own — this table encodes its first-listed role only, the same
    // convention repeated_sprint_intervals_v0_1 uses.
    for (const exerciseRole of ["accessory", "robustness"] as const) {
      const other = resolveNumericalProfile({ ...TRIPLE, exerciseRole });
      expect(other.ok).toBe(false);
      if (other.ok) continue;
      expect(other.failureCode).toBe("NUMERICAL_PROFILE_MISSING");
    }
  });

  test("the Grip module's five profiles cover five DIFFERENT units — carried distance, held seconds, complete repetitions, ascents, hand pulls", () => {
    const gripProfiles = NUMERICAL_PRESCRIPTION_PROFILES.filter((p) => p.moduleId === "grip");
    expect(gripProfiles.map((p) => p.profileId).sort()).toEqual([
      "distance_carry_strength_grip_v0_1",
      "grip_climb_strength_v0_1",
      "grip_hand_pull_work_v0_1",
      "grip_repetition_strength_v0_1",
      "timed_isometric_grip_v0_1",
    ]);

    const carry = getNumericalPrescriptionProfileById("distance_carry_strength_grip_v0_1")!;
    expect(carry.methodId).toBe("distance_carry_sets");
    expect(carry.volume.structure).toBe("sets_distance");
    expect(profile().volume.distance).toBeNull();
    expect(carry.volume.duration).toBeNull();

    // The Grip chapter's own Volume Metrics section forbids combining
    // incompatible volume measures; the three profiles keep them apart, each
    // owning exactly one and leaving the other two null.
    const repetition = getNumericalPrescriptionProfileById("grip_repetition_strength_v0_1")!;
    expect(repetition.methodId).toBe("straight_sets_repetitions");
    expect(repetition.volume.structure).toBe("sets_reps");
    expect(repetition.volume.distance).toBeNull();
    expect(repetition.volume.duration).toBeNull();
    expect(profile().volume.repetitions).toBeNull();
    expect(carry.volume.repetitions).toBeNull();

    // Three of the five share `sets_reps` as a STRUCTURE while counting three
    // different things; the unit is carried by the consuming entry's
    // `volumeInterpretation`, never by the structure.
    expect(new Set(gripProfiles.map((p) => p.volume.structure)).size).toBe(3);
    const setsReps = gripProfiles.filter((p) => p.volume.structure === "sets_reps");
    expect(setsReps.map((p) => p.profileId).sort()).toEqual(["grip_climb_strength_v0_1", "grip_hand_pull_work_v0_1", "grip_repetition_strength_v0_1"]);
    // And their repetition envelopes are genuinely different, because the
    // units are.
    expect(new Set(setsReps.map((p) => JSON.stringify(p.volume.repetitions))).size).toBe(3);
  });
});

// -----------------------------------------------------------------------------
// Resolution
// -----------------------------------------------------------------------------

describe("ISO-GRIP — resolution under every range context", () => {
  const EXPECTED = {
    reduced: { sets: 2, duration: 10, rpe: 7, rest: 60 },
    normal: { sets: 3, duration: 20, rpe: 8, rest: 90 },
    high: { sets: 4, duration: 30, rpe: 9, rest: 150 },
  } as const;

  for (const rangeContext of ["reduced", "normal", "high"] as const) {
    test(`"${rangeContext}" resolves volume, intensity, rest and tempo as documented`, () => {
      const expected = EXPECTED[rangeContext];

      const volume = resolveVolume(resolverInput(rangeContext));
      if (!volume.ok) {
        throw new Error(`Expected volume to resolve: ${volume.message}`);
      }
      expect(volume.profileId).toBe(PROFILE_ID);
      expect(volume.volume.structure).toBe("sets_duration");
      expect(volume.volume.sets).toBe(expected.sets);
      expect(volume.volume.duration?.value).toBe(expected.duration);
      expect(volume.volume.duration?.scope).toBe("per_set");
      expect(volume.volume.reps).toBeNull();
      expect(volume.narrowingNotes).toEqual([]);

      const intensity = resolveIntensity({
        ...resolverInput(rangeContext),
        supportedIntensityTypes: ["rpe"],
        preferredIntensityType: "rpe",
      });
      if (!intensity.ok) {
        throw new Error(`Expected intensity to resolve: ${intensity.message}`);
      }
      expect(intensity.selectedRuleType).toBe("rpe");
      expect(intensity.intensity.primaryMetric.target).toEqual({ type: "fixed", value: expected.rpe });
      expect(intensity.intensity.primaryMetric.reference).toBeNull();

      const rest = resolveRest(resolverInput(rangeContext));
      if (!rest.ok || rest.rest === null) {
        throw new Error("Expected rest to resolve.");
      }
      const betweenSets = rest.rest.betweenSets;
      if (betweenSets?.type !== "fixed") {
        throw new Error("Expected a fixed between-sets rest target.");
      }
      expect(betweenSets.duration.value).toBe(expected.rest);

      const tempo = resolveTempo({ ...resolverInput(rangeContext), supportedTempoTypes: ["isometric_hold"] });
      if (!tempo.ok || tempo.tempo === null) {
        throw new Error("Expected tempo to resolve.");
      }
      expect(tempo.tempo.type).toBe("isometric_hold");
    });
  }

  test("no absolute or body-mass load is ever produced — the external-load rule stays exercise-specific", () => {
    const intensity = resolveIntensity({
      ...resolverInput("normal"),
      supportedIntensityTypes: ["rpe", "absolute_load", "percentage_body_mass", "resistance_category"],
      preferredIntensityType: "absolute_load",
    });
    if (!intensity.ok) {
      throw new Error(`Expected intensity to resolve: ${intensity.message}`);
    }
    // Even when the caller prefers a load metric, the profile documents
    // none, so RPE is what resolves. No plate weight is fabricated.
    expect(intensity.selectedRuleType).toBe("rpe");
    expect(intensity.intensity.calculation).toBeNull();
  });
});

// -----------------------------------------------------------------------------
// Reusability and contract conformance
// -----------------------------------------------------------------------------

describe("ISO-GRIP — generic envelope, reusable by any grip isometric hold", () => {
  test("it satisfies the timed_isometric_sets method contract", () => {
    const contract = getTrainingMethodContract("timed_isometric_sets");
    const p = profile();

    expect(contract.supportedModules).toContain("grip");
    expect(contract.volumeStructure).toBe(p.volume.structure);
    expect(contract.requiredVolumeFields).toEqual(["sets", "duration"]);
    expect(p.volume.sets).not.toBeNull();
    expect(p.volume.duration).not.toBeNull();
    for (const forbidden of contract.forbiddenVolumeFields) {
      if (forbidden === "repetitions") expect(p.volume.repetitions).toBeNull();
      if (forbidden === "distance") expect(p.volume.distance).toBeNull();
      if (forbidden === "rounds") expect(p.volume.rounds).toBeNull();
      if (forbidden === "work_intervals") expect(p.volume.workIntervals).toBeNull();
    }
    expect(contract.restPolicy).toBe("required");
    expect(p.rest?.seconds).not.toBeNull();
    for (const rule of p.intensity) {
      expect(contract.allowedIntensityTypes).toContain(rule.type);
    }
  });

  test("it satisfies the Grip module contract", () => {
    const module = getModulePrescriptionContract("grip");
    const p = profile();

    expect(module.allowedRoles).toContain("secondary");
    expect(module.allowedMethods.some((rule) => rule.methodId === "timed_isometric_sets")).toBe(true);
    for (const rule of p.intensity) {
      expect(module.allowedIntensityTypes).toContain(rule.type);
    }
  });

  test("two synthetic grip consumers narrow the same envelope differently", () => {
    const narrowTo = (setMin: number, setMax: number, durMin: number, durMax: number): ExerciseDoseConstraints => ({
      minimumDose: { sets: setMin, repetitions: null, durationSeconds: durMin, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: setMax, repetitions: null, durationSeconds: durMax, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/65_GRIP/00_OVERVIEW.md"],
    });

    const shortHold = resolveVolume({ ...resolverInput("high"), exerciseDoseConstraints: narrowTo(2, 3, 10, 15) });
    const longHold = resolveVolume({ ...resolverInput("high"), exerciseDoseConstraints: narrowTo(3, 4, 20, 30) });

    if (!shortHold.ok || !longHold.ok) {
      throw new Error("Expected both synthetic grip consumers to resolve.");
    }
    expect(shortHold.volume.sets).toBe(3);
    expect(shortHold.volume.duration?.value).toBe(15);
    expect(longHold.volume.sets).toBe(4);
    expect(longHold.volume.duration?.value).toBe(30);

    expect(shortHold.narrowingNotes.some((note) => note.includes("durationSeconds range 10-30 narrowed to 10-15"))).toBe(true);
    expect(longHold.narrowingNotes.some((note) => note.includes("durationSeconds range 10-30 narrowed to 20-30"))).toBe(true);
  });

  test("a narrowing that tries to widen the envelope is clamped, never honoured", () => {
    const widening: ExerciseDoseConstraints = {
      minimumDose: { sets: 1, repetitions: null, durationSeconds: 5, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 9, repetitions: null, durationSeconds: 90, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["50-exercises/65_GRIP/00_OVERVIEW.md"],
    };
    const clamped = resolveVolume({ ...resolverInput("high"), exerciseDoseConstraints: widening });
    if (!clamped.ok) {
      throw new Error("Expected the resolution to succeed with clamped bounds.");
    }
    expect(clamped.volume.sets).toBe(4);
    expect(clamped.volume.duration?.value).toBe(30);
    expect(clamped.narrowingNotes).toEqual([]);
  });

  test("determinism: identical input produces identical results across all four resolvers", () => {
    const input = resolverInput("normal");
    expect(resolveVolume(input)).toEqual(resolveVolume(input));
    expect(resolveRest(input)).toEqual(resolveRest(input));
    expect(resolveIntensity({ ...input, supportedIntensityTypes: ["rpe"] })).toEqual(
      resolveIntensity({ ...input, supportedIntensityTypes: ["rpe"] }),
    );
    expect(resolveTempo({ ...input, supportedTempoTypes: ["isometric_hold"] })).toEqual(
      resolveTempo({ ...input, supportedTempoTypes: ["isometric_hold"] }),
    );
  });
});
