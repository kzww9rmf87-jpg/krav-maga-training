/**
 * Combat Athlete System — Table Group 15 / Profile GRIP-REPETITION-STRENGTH
 *
 * `grip_repetition_strength_v0_1` completes the Grip module. Table Group 5
 * covers grip work prescribed as a carried distance, Table Group 4 covers
 * it as a timed hold, and this one covers it as complete repetitions of a
 * whole movement whose ceiling is set by the hands.
 *
 * This profile is NOT the discovery of a pre-existing family, and this file
 * does not pretend otherwise. An earlier audit established that no such
 * family could be demonstrated across towel_pull_up, rope_climb and
 * rope_pull: their units genuinely differ (complete repetitions / ascents /
 * hand-over-hand pulls), their union produced an envelope whose normal was
 * unreachable by three of four documented ranges, and their intersection was
 * empty. This lot therefore did what the block called for — it created the
 * missing MODULE doctrine — and the profile implements that doctrine.
 *
 * What this file guards:
 *
 * - the doctrine exists, in the module chapter and in the numerical table,
 *   and is scoped to complete repetitions;
 * - the excluded units are excluded IN WRITING, because the Grip chapter's
 *   own Volume Metrics section requires it;
 * - every profile value is the module rule's, reachable at every range
 *   context, and no existing profile moved.
 */

import { readFileSync } from "node:fs";

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
import { EXERCISE_PRESCRIPTION_REGISTRY } from "../../prescription/exercisePrescriptionRegistry";

const PROFILE_ID = "grip_repetition_strength_v0_1";
const TRIPLE = {
  moduleId: "grip",
  methodId: "straight_sets_repetitions",
  exerciseRole: "secondary",
} as const;

const profile = () => getNumericalPrescriptionProfileById(PROFILE_ID)!;

const resolverInput = (rangeContext: "reduced" | "normal" | "high") => ({
  moduleId: TRIPLE.moduleId,
  methodId: TRIPLE.methodId,
  role: TRIPLE.exerciseRole,
  rangeContext,
  numericalProfileId: PROFILE_ID,
});

const readDoc = (relative: string) =>
  readFileSync(new URL(relative, import.meta.url), "utf-8");

const GRIP_OVERVIEW = "../../../../50-exercises/65_GRIP/00_OVERVIEW.md";
const TABLES = "../../../34_NUMERICAL_PRESCRIPTION_TABLES.md";

// -----------------------------------------------------------------------------
// 1-6. The canonical doctrine
// -----------------------------------------------------------------------------

describe("Grip Repetition Strength — the canonical module doctrine", () => {
  test("1. the module chapter carries a Grip Repetition Strength section, inside General Prescription Ranges", () => {
    const overview = readDoc(GRIP_OVERVIEW);

    expect(overview).toContain("# General Prescription Ranges");
    expect(overview).toContain("## Grip Repetition Strength");

    // It sits inside that section, before Volume Metrics.
    const rangesAt = overview.indexOf("# General Prescription Ranges");
    const doctrineAt = overview.indexOf("## Grip Repetition Strength");
    const metricsAt = overview.indexOf("# Volume Metrics");
    expect(rangesAt).toBeGreaterThan(-1);
    expect(doctrineAt).toBeGreaterThan(rangesAt);
    expect(metricsAt).toBeGreaterThan(doctrineAt);

    // Every field the profile needs is stated there.
    const section = overview.slice(doctrineAt, metricsAt);
    for (const heading of [
      "### Purpose",
      "### Admissible Exercises",
      "### Excluded Exercises",
      "### Sets",
      "### Repetitions",
      "### Intensity",
      "### Rest",
      "### Tempo",
      "### Progression",
      "### Limits of Use",
    ]) {
      expect(section, heading).toContain(heading);
    }
  });

  test("2. the doctrine is scoped to COMPLETE repetitions and defines a category, not an exercise", () => {
    const overview = readDoc(GRIP_OVERVIEW);
    const section = overview.slice(
      overview.indexOf("## Grip Repetition Strength"),
      overview.indexOf("# Volume Metrics"),
    );

    expect(section).toContain("complete repetition");
    expect(section).toContain("grip difficulty is the\ndominant constraint");

    // towel_pull_up may be named as the first example, but the category is
    // defined by the unit and the limiting factor.
    expect(section).toContain("Towel Pull-Up is the first documented example");
    expect(section).toContain("The category is defined by\nthe unit and the limiting factor, not by that exercise");
  });

  test("3. rope ascents and hand-over-hand pulls are excluded IN WRITING", () => {
    const overview = readDoc(GRIP_OVERVIEW);
    const section = overview.slice(
      overview.indexOf("## Grip Repetition Strength"),
      overview.indexOf("# Volume Metrics"),
    );

    expect(section).toContain("### Excluded Exercises");
    expect(section).toContain("rope ascents");
    expect(section).toContain("hand-over-hand pulls");
    // And the reason each is excluded is stated, not merely asserted.
    expect(section).toContain("a climb is a bout composed of many hand transitions");
    expect(section).toContain("a repetition of one hand's action, not of the\n  whole movement");
  });

  test("4. distance, timed holds and timed intervals are excluded too", () => {
    const overview = readDoc(GRIP_OVERVIEW);
    const section = overview.slice(
      overview.indexOf("## Grip Repetition Strength"),
      overview.indexOf("# Volume Metrics"),
    );

    expect(section).toContain("distance travelled");
    expect(section).toContain("timed holds and isometric variations");
    expect(section).toContain("timed work intervals");
    expect(section).toContain("gripper closes and finger contacts");

    // The exclusion is required by the chapter's own pre-existing rule.
    expect(readDoc(GRIP_OVERVIEW)).toContain(
      "CAS must avoid combining incompatible volume measures without context",
    );
  });

  test("5. the numerical table carries Table Group 15, and sources it to the MODULE, not to an exercise", () => {
    const tables = readDoc(TABLES);

    expect(tables).toContain("# Table Group 15 — Grip Repetition Strength");
    expect(tables).toContain("## Profile GRIP-REPETITION-STRENGTH");
    expect(tables).toContain(`profileId: ${PROFILE_ID}`);

    const group = tables.slice(
      tables.indexOf("# Table Group 15 — Grip Repetition Strength"),
      tables.indexOf("# Exercise-Specific Numerical Requirement"),
    );
    // It states plainly that it is not a discovered family.
    expect(group).toContain("does NOT claim a pre-existing family");
    expect(group).toContain("65_GRIP/00_OVERVIEW.md");
    expect(group).toContain("doctrine is owned by the module; an exercise narrows it.");
    expect(group).toContain("`towel_pull_up` is the first consumer. It is an example of the category,\nnever its definition.");
  });

  test("6. the table names the included unit and every excluded one", () => {
    const tables = readDoc(TABLES);
    const group = tables.slice(
      tables.indexOf("# Table Group 15 — Grip Repetition Strength"),
      tables.indexOf("# Exercise-Specific Numerical Requirement"),
    );

    expect(group).toContain("## Units Included");
    expect(group).toContain("complete repetitions of the whole movement (total_repetitions)");
    expect(group).toContain("## Units Excluded");
    for (const excluded of [
      "rope ascents",
      "hand-over-hand pulls",
      "distance",
      "timed holds and isometric variations",
      "timed work intervals",
      "gripper closes and finger contacts",
    ]) {
      expect(group, excluded).toContain(excluded);
    }

    // And it records WHY no future entry can smuggle another unit in.
    expect(group).toContain("express LATERALITY, not unit");
  });
});

// -----------------------------------------------------------------------------
// 7-10. Triple, role, presence, executability
// -----------------------------------------------------------------------------

describe("GRIP-REPETITION-STRENGTH — triple, role and executability", () => {
  test("7. the triple is grip / straight_sets_repetitions / secondary and passes the contract validator", () => {
    expect(profile().moduleId).toBe(TRIPLE.moduleId);
    expect(profile().methodId).toBe(TRIPLE.methodId);
    expect(profile().exerciseRole).toBe(TRIPLE.exerciseRole);

    const result = validateMethodModuleRoleContract(
      TRIPLE.moduleId,
      TRIPLE.methodId,
      TRIPLE.exerciseRole,
    );
    expect(result.valid).toBe(true);

    // The method is genuinely allowed for this module at this role.
    const module = getModulePrescriptionContract(TRIPLE.moduleId);
    const authorization = module.allowedMethods.find((a) => a.methodId === TRIPLE.methodId);
    expect(authorization).toBeDefined();
    expect(authorization?.allowedRoles).toContain(TRIPLE.exerciseRole);
  });

  test("8. the role is `secondary` because the module chapter's Placement section says so", () => {
    const overview = readDoc(GRIP_OVERVIEW);
    expect(overview).toContain("after primary technical and strength work");

    const tables = readDoc(TABLES);
    const group = tables.slice(
      tables.indexOf("# Table Group 15 — Grip Repetition Strength"),
      tables.indexOf("# Exercise-Specific Numerical Requirement"),
    );
    expect(group).toContain("Placement\nWithin the Session");
    expect(group).toContain("A primary-role variant would be a\nseparate profile.");
  });

  test("9. the profile exists exactly once, at version 0.1, sourced from the tables", () => {
    const matches = NUMERICAL_PRESCRIPTION_PROFILES.filter((p) => p.profileId === PROFILE_ID);
    expect(matches).toHaveLength(1);
    expect(profile().version).toBe("0.1");
    expect(profile().sourceRuleIds).toEqual(["34_NUMERICAL_PRESCRIPTION_TABLES_V0_1"]);
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(23);
  });

  test("10. the profile is executable; its triple was unique when written and is now SHARED with the two rope-unit profiles", () => {
    expect(isExecutableNumericalProfile(profile())).toBe(true);
    expect(profile().intensity.length).toBeGreaterThan(0);

    // Table Groups 16 and 17 joined the same triple with their own units, so
    // implicit resolution now refuses it — which is the correct outcome, and
    // exactly why every consumer declares its id explicitly.
    const implicit = resolveNumericalProfile({ ...TRIPLE });
    expect(implicit.ok).toBe(false);
    if (!implicit.ok) {
      expect(implicit.failureCode).toBe("NUMERICAL_PROFILE_AMBIGUOUS");
      expect([...implicit.candidateProfileIds].sort()).toEqual(["grip_climb_strength_v0_1", "grip_hand_pull_work_v0_1", "grip_repetition_strength_v0_1"]);
    }
    expect(
      hasExecutableNumericalProfile(TRIPLE.moduleId, TRIPLE.methodId, TRIPLE.exerciseRole),
    ).toBe(false);

    const explicit = resolveNumericalProfile({ ...TRIPLE, explicitProfileId: PROFILE_ID });
    expect(explicit.ok && explicit.profile.profileId).toBe(PROFILE_ID);
    expect(explicit.ok && explicit.resolutionSource).toBe("explicit_profile_id");
  });
});

// -----------------------------------------------------------------------------
// 11-21. Documented values and resolution
// -----------------------------------------------------------------------------

describe("GRIP-REPETITION-STRENGTH — documented values", () => {
  test("11. + 12. + 13. every range context resolves the module rule's own values", () => {
    const expected = {
      reduced: { sets: 3, reps: 2, rir: 1, rest: 90 },
      normal: { sets: 4, reps: 5, rir: 2, rest: 165 },
      high: { sets: 5, reps: 8, rir: 3, rest: 240 },
    } as const;

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const volume = resolveVolume(resolverInput(rangeContext));
      const intensity = resolveIntensity({
        ...resolverInput(rangeContext),
        supportedIntensityTypes: ["rir"],
      });
      const rest = resolveRest(resolverInput(rangeContext));

      expect(volume.ok, rangeContext).toBe(true);
      expect(intensity.ok, rangeContext).toBe(true);
      expect(rest.ok, rangeContext).toBe(true);
      if (!volume.ok || !intensity.ok || !rest.ok) continue;

      expect(volume.volume.structure).toBe("sets_reps");
      expect(volume.volume.sets).toBe(expected[rangeContext].sets);
      expect(volume.volume.reps?.type).toBe("fixed");
      if (volume.volume.reps?.type === "fixed") {
        expect(volume.volume.reps.value).toBe(expected[rangeContext].reps);
        expect(volume.volume.reps.unit).toBe("repetitions");
      }

      expect(intensity.intensity.primaryMetric.type).toBe("rir");
      expect(intensity.intensity.primaryMetric.target).toMatchObject({
        value: expected[rangeContext].rir,
      });

      const betweenSets = rest.rest?.betweenSets;
      expect(betweenSets?.type).toBe("fixed");
      if (betweenSets?.type === "fixed") {
        expect(betweenSets.duration).toEqual({
          value: expected[rangeContext].rest,
          unit: "seconds",
          scope: "between_sets",
        });
      }
    }
  });

  test("14. sets are 3-5 with normal 4, by the documented Integer Resolution convention", () => {
    expect(profile().volume.sets).toEqual({ min: 3, normal: 4, max: 5 });
    expect(profile().volume.sets!.normal).toBe(Math.floor((3 + 5) / 2));
    expect(readDoc(GRIP_OVERVIEW)).toContain("- 3 to 5 sets.");
  });

  test("15. repetitions are 2-8 with normal 5, and forbidden dimensions stay null", () => {
    expect(profile().volume.repetitions).toEqual({
      type: "fixed_range",
      range: { min: 2, normal: 5, max: 8 },
    });
    expect(profile().volume.repetitions!.range.normal).toBe(Math.floor((2 + 8) / 2));
    expect(readDoc(GRIP_OVERVIEW)).toContain("- 2 to 8 complete repetitions,");

    expect(profile().volume.duration).toBeNull();
    expect(profile().volume.distance).toBeNull();
    expect(profile().volume.rounds).toBeNull();
    expect(profile().volume.workIntervals).toBeNull();
    for (const forbidden of getTrainingMethodContract(TRIPLE.methodId).forbiddenVolumeFields) {
      expect(["duration", "distance", "rounds", "work_intervals"]).toContain(forbidden);
    }
  });

  test("16. intensity is RIR 1-3 — never RPE, never a load percentage", () => {
    expect(profile().intensity).toHaveLength(1);
    expect(profile().intensity[0]).toEqual({
      type: "rir",
      min: 1,
      normal: 2,
      max: 3,
      unit: "repetitions",
      referenceType: null,
      sourceRuleIds: ["34_NUMERICAL_PRESCRIPTION_TABLES_V0_1", "26_INTENSITY_MODEL_V0_1"],
    });
    expect(readDoc(GRIP_OVERVIEW)).toContain("- 1 to 3 repetitions in reserve.");

    // The chapter's own reason: grip intensity is not load.
    expect(readDoc(GRIP_OVERVIEW)).toContain(
      "Grip intensity is not represented accurately by external load alone",
    );

    const types = profile().intensity.map((rule) => rule.type);
    for (const absent of ["rpe", "percentage_1rm", "absolute_load", "percentage_body_mass"]) {
      expect(types).not.toContain(absent);
    }

    // Both the module and the method admit `rir`.
    expect(getModulePrescriptionContract(TRIPLE.moduleId).allowedIntensityTypes).toContain("rir");
    expect(getTrainingMethodContract(TRIPLE.methodId).allowedIntensityTypes).toContain("rir");
  });

  test("16b. the RIR range uses the SAME min/normal/max form the two existing RIR profiles use", () => {
    // Range-context selection is a range-position convention, not a
    // difficulty dial, and this profile does not re-interpret it.
    const siblings = NUMERICAL_PRESCRIPTION_PROFILES.filter((p) =>
      p.intensity.some((rule) => rule.type === "rir"),
    );
    expect(siblings.map((p) => p.profileId).sort()).toEqual([
      "functional_hypertrophy_primary_v0_1",
      "grip_repetition_strength_v0_1",
      "strength_primary_straight_sets_v0_1",
    ]);

    for (const sibling of siblings) {
      const rule = sibling.intensity.find((r) => r.type === "rir")!;
      expect("min" in rule && rule.min).toBe(1);
      expect("normal" in rule && rule.normal).toBe(2);
      expect("max" in rule && rule.max).toBe(3);
    }
  });

  test("17. rest is 90-240s between sets, with normal 165", () => {
    expect(profile().rest).toEqual({
      scope: "between_sets",
      seconds: { min: 90, normal: 165, max: 240 },
      sourceRuleIds: ["34_NUMERICAL_PRESCRIPTION_TABLES_V0_1", "27_REST_TEMPO_RULES_V0_1"],
    });
    expect(profile().rest!.seconds!.normal).toBe(Math.floor((90 + 240) / 2));
    expect(readDoc(GRIP_OVERVIEW)).toContain("- 90 seconds to 4 minutes,");
    expect(getTrainingMethodContract(TRIPLE.methodId).restPolicy).toBe("required");
  });

  test("18. tempo is global_intent: controlled, and phase timing is a DOCUMENTED precision loss", () => {
    expect(profile().tempo).toEqual({
      type: "global_intent",
      globalIntent: "controlled",
      sourceRuleIds: ["34_NUMERICAL_PRESCRIPTION_TABLES_V0_1", "27_REST_TEMPO_RULES_V0_1"],
    });
    expect(readDoc(GRIP_OVERVIEW)).toContain("Controlled throughout, with a controlled descent.");

    const resolved = resolveTempo({
      ...resolverInput("normal"),
      supportedTempoTypes: ["global_intent"],
    });
    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.tempo?.type).toBe("global_intent");
      expect(resolved.tempo?.globalIntent).toBe("controlled");
      // No phase figure is fabricated at profile level.
      expect(resolved.tempo?.eccentric ?? null).toBeNull();
      expect(resolved.tempo?.concentric ?? null).toBeNull();
    }

    // The table records why an eccentric duration cannot live here.
    const tables = readDoc(TABLES);
    const group = tables.slice(
      tables.indexOf("# Table Group 15 — Grip Repetition Strength"),
      tables.indexOf("# Exercise-Specific Numerical Requirement"),
    );
    expect(group).toContain("Phase timing is **not representable**");
  });

  test("19. + 20. the dose envelope is 3x2 minimum and 5x8 maximum, on the volume boundaries only", () => {
    expect(profile().minimumDose).toMatchObject({ sets: 3, repetitions: 2 });
    expect(profile().maximumDose).toMatchObject({ sets: 5, repetitions: 8 });

    for (const field of ["durationSeconds", "distanceMeters", "rounds", "workIntervals"] as const) {
      expect(profile().minimumDose[field]).toBeNull();
      expect(profile().maximumDose[field]).toBeNull();
    }

    expect(profile().minimumDose.sets).toBe(profile().volume.sets!.min);
    expect(profile().maximumDose.sets).toBe(profile().volume.sets!.max);
    expect(profile().minimumDose.repetitions).toBe(profile().volume.repetitions!.range.min);
    expect(profile().maximumDose.repetitions).toBe(profile().volume.repetitions!.range.max);
  });

  test("21. no exercise-specific load rule and no sport-specific subtype are required", () => {
    expect(profile().requiresExerciseSpecificLoadRule).toBe(false);
    expect(profile().requiresSportSpecificSubtype).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// 22-25. Genericity, reusability, non-regression
// -----------------------------------------------------------------------------

describe("GRIP-REPETITION-STRENGTH — genericity and non-regression", () => {
  test("22. the profile references no ExerciseId anywhere", () => {
    const serialised = JSON.stringify(profile());
    for (const exerciseId of [
      "towel_pull_up",
      "rope_climb",
      "rope_pull",
      "plate_pinch",
      "pinch_carry",
    ]) {
      expect(serialised, exerciseId).not.toContain(exerciseId);
    }
    expect(Object.keys(profile())).not.toContain("exerciseId");
  });

  test("23. a SYNTHETIC second consumer resolves identically — the profile is reusable, not exercise-shaped", () => {
    // No registry entry is created. This proves only that a different
    // documented narrowing produces a different, correct prescription from
    // the same profile.
    const synthetic: ExerciseDoseConstraints = {
      minimumDose: { sets: 4, repetitions: 3, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      maximumDose: { sets: 5, repetitions: 6, durationSeconds: null, distanceMeters: null, rounds: null, workIntervals: null },
      sourceRuleIds: ["SYNTHETIC_TEST_ONLY"],
    };

    const reduced = resolveVolume({ ...resolverInput("reduced"), exerciseDoseConstraints: synthetic });
    const high = resolveVolume({ ...resolverInput("high"), exerciseDoseConstraints: synthetic });

    expect(reduced.ok).toBe(true);
    expect(high.ok).toBe(true);
    if (!reduced.ok || !high.ok) return;

    expect(reduced.volume.sets).toBe(4);
    expect(reduced.volume.reps?.type === "fixed" && reduced.volume.reps.value).toBe(3);
    expect(high.volume.sets).toBe(5);
    expect(high.volume.reps?.type === "fixed" && high.volume.reps.value).toBe(6);

    // The envelope itself never moved.
    expect(profile().volume.sets).toEqual({ min: 3, normal: 4, max: 5 });
    expect(profile().volume.repetitions!.range).toEqual({ min: 2, normal: 5, max: 8 });
  });

  test("24. the 18 pre-existing profiles are byte-for-byte unchanged", () => {
    const frozen: Record<string, { structure: string; intensityTypes: string[] }> = {
      strength_primary_straight_sets_v0_1: { structure: "sets_reps", intensityTypes: ["percentage_1rm", "rpe", "rir"] },
      strength_secondary_straight_sets_v0_1: { structure: "sets_reps", intensityTypes: ["percentage_1rm", "rpe"] },
      functional_hypertrophy_primary_v0_1: { structure: "sets_reps", intensityTypes: ["rpe", "rir"] },
      timed_isometric_grip_v0_1: { structure: "sets_duration", intensityTypes: ["rpe"] },
      distance_carry_strength_grip_v0_1: { structure: "sets_distance", intensityTypes: ["rpe"] },
      core_robustness_straight_sets_v0_1: { structure: "sets_reps", intensityTypes: ["rpe", "technical_effort"] },
      power_intervals_v0_1: { structure: "intervals", intensityTypes: ["impact_intent", "movement_intent"] },
      conditioning_short_intervals_v0_1: { structure: "intervals", intensityTypes: [] },
    };

    for (const [profileId, expected] of Object.entries(frozen)) {
      const other = getNumericalPrescriptionProfileById(profileId);
      expect(other, profileId).not.toBeNull();
      if (other === null) continue;
      expect(other.volume.structure, profileId).toBe(expected.structure);
      expect(other.intensity.map((r) => r.type), profileId).toEqual(expected.intensityTypes);
    }

    // Exactly one profile was added, and every triple stays resolvable.
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(23);
    expect(
      NUMERICAL_PRESCRIPTION_PROFILES.filter((p) => p.profileId === PROFILE_ID),
    ).toHaveLength(1);
  });

  test("25. exactly one entry consumes it, and it NARROWS rather than defines the envelope", () => {
    const consumers = Object.values(EXERCISE_PRESCRIPTION_REGISTRY).filter(
      (entry) => entry.numericalProfileId === PROFILE_ID,
    );
    expect(consumers.map((entry) => entry.exerciseId)).toEqual(["towel_pull_up"]);

    // The consumer's declared bounds sit INSIDE the module envelope. The
    // envelope was written from the module rule, not from this exercise.
    const consumer = consumers[0]!;
    expect(consumer.exerciseDoseConstraints?.minimumDose?.sets).toBeGreaterThanOrEqual(
      profile().volume.sets!.min,
    );
    expect(consumer.exerciseDoseConstraints?.maximumDose?.repetitions).toBeLessThanOrEqual(
      profile().volume.repetitions!.range.max,
    );

    // rope_climb and rope_pull were integrated on their OWN profiles, which
    // is the doctrine working as written: a different unit means a different
    // family, never an exception inside this one.
    expect(EXERCISE_PRESCRIPTION_REGISTRY.rope_climb.numericalProfileId).toBe(
      "grip_climb_strength_v0_1",
    );
    expect(EXERCISE_PRESCRIPTION_REGISTRY.rope_pull.numericalProfileId).toBe(
      "grip_hand_pull_work_v0_1",
    );
    expect(EXERCISE_PRESCRIPTION_REGISTRY.rope_climb.capabilities.volumeInterpretations).toEqual([
      "climbs",
    ]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.rope_pull.capabilities.volumeInterpretations).toEqual([
      "hand_pulls",
    ]);
  });

  test("26. resolution is deterministic and never mutates the profile", () => {
    const before = JSON.stringify(profile());
    const runs = [1, 2, 3].map(() =>
      JSON.stringify([
        resolveVolume(resolverInput("normal")),
        resolveIntensity({ ...resolverInput("normal"), supportedIntensityTypes: ["rir"] }),
        resolveRest(resolverInput("normal")),
        resolveTempo({ ...resolverInput("normal"), supportedTempoTypes: ["global_intent"] }),
      ]),
    );

    expect(new Set(runs).size).toBe(1);
    expect(JSON.stringify(profile())).toBe(before);
  });
});
