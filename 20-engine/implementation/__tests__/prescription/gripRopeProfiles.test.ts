/**
 * Combat Athlete System — Table Groups 16 and 17
 *
 * `grip_climb_strength_v0_1` and `grip_hand_pull_work_v0_1` complete the
 * Grip module's unit coverage. It can now prescribe a carried distance
 * (Table Group 5), a timed hold (Table Group 4), a complete repetition
 * (Table Group 15), a complete ascent (16) and a hand-over-hand pull (17).
 *
 * TWO doctrines, deliberately, because there are two units. The Grip
 * chapter's Volume Metrics rule forbids combining incompatible volume
 * measures, and an ascent and a hand pull are as different from each other
 * as either is from a repetition. A single envelope spanning both would
 * have had a normal reachable by neither.
 *
 * Like Table Group 15, both are CREATED module rules, not discovered
 * families, and both documents say so.
 */

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import {
  NUMERICAL_PRESCRIPTION_PROFILES,
  findDuplicateProfileTriples,
  getNumericalPrescriptionProfileById,
  isExecutableNumericalProfile,
  resolveNumericalProfile,
} from "../../prescription/prescriptionKnowledge";
import { resolveVolume } from "../../prescription/resolveVolume";
import { resolveIntensity } from "../../prescription/resolveIntensity";
import { resolveRest } from "../../prescription/resolveRest";
import { resolveTempo } from "../../prescription/resolveTempo";
import {
  getModulePrescriptionContract,
  getTrainingMethodContract,
  validateMethodModuleRoleContract,
} from "../../prescription/contracts";
import { EXERCISE_PRESCRIPTION_REGISTRY } from "../../prescription/exercisePrescriptionRegistry";

const CLIMB_ID = "grip_climb_strength_v0_1";
const PULL_ID = "grip_hand_pull_work_v0_1";
const TRIPLE = {
  moduleId: "grip",
  methodId: "straight_sets_repetitions",
  exerciseRole: "secondary",
} as const;

const GRIP_TRIPLE_IDS = [
  "grip_climb_strength_v0_1",
  "grip_hand_pull_work_v0_1",
  "grip_repetition_strength_v0_1",
] as const;

const profile = (id: string) => getNumericalPrescriptionProfileById(id)!;

const resolverInput = (id: string, rangeContext: "reduced" | "normal" | "high") => ({
  moduleId: TRIPLE.moduleId,
  methodId: TRIPLE.methodId,
  role: TRIPLE.exerciseRole,
  rangeContext,
  numericalProfileId: id,
});

const readDoc = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf-8");

/** Documented prose is hard-wrapped, so sentences cross line breaks. */
const flatten = (text: string) => text.replace(/\s+/g, " ");
const GRIP_OVERVIEW = "../../../../50-exercises/65_GRIP/00_OVERVIEW.md";
const TABLES = "../../../34_NUMERICAL_PRESCRIPTION_TABLES.md";

const gripSection = (heading: string) => {
  const overview = readDoc(GRIP_OVERVIEW);
  const start = overview.indexOf(heading);
  const rest = overview.slice(start + heading.length);
  const nextHeading = rest.search(/\n## |\n# /);
  return rest.slice(0, nextHeading === -1 ? undefined : nextHeading);
};

// -----------------------------------------------------------------------------
// 1-5. Two doctrines, because there are two units
// -----------------------------------------------------------------------------

describe("Grip rope doctrines — two module rules, two units", () => {
  test("1. both sections exist in the module chapter, with every field the profiles need", () => {
    for (const heading of ["## Grip Climb Strength", "## Grip Hand-Pull Work"]) {
      const section = gripSection(heading);
      for (const field of [
        "### Purpose",
        "### Admissible Exercises",
        "### Excluded Exercises",
        "### Sets",
        "### Intensity",
        "### Rest",
        "### Tempo",
        "### Progression",
        "### Limits of Use",
      ]) {
        expect(section, `${heading} ${field}`).toContain(field);
      }
    }

    expect(gripSection("## Grip Climb Strength")).toContain("### Climbs");
    expect(gripSection("## Grip Hand-Pull Work")).toContain("### Hand Pulls");
  });

  test("2. each doctrine states why it is NOT the other, and neither is a repetition", () => {
    const climb = gripSection("## Grip Climb Strength");
    const pull = gripSection("## Grip Hand-Pull Work");

    expect(flatten(climb)).toContain("An ascent is not a repetition");
    expect(flatten(climb)).toContain("bout composed of many hand transitions");
    expect(climb).toContain("work counted in hand-over-hand pulls — Grip Hand-Pull Work covers that");

    expect(flatten(pull)).toContain(
      "A hand-over-hand pull is one hand's action, not one execution of a whole movement",
    );
    expect(pull).toContain("complete ascents — Grip Climb Strength covers those");

    // Both defer to the chapter's own pre-existing rule.
    expect(readDoc(GRIP_OVERVIEW)).toContain(
      "CAS must avoid combining incompatible volume measures without context",
    );
  });

  test("3. climbed height and travelled distance are excluded as volume dimensions", () => {
    expect(flatten(gripSection("## Grip Climb Strength"))).toContain(
      "Climbed HEIGHT is a documented variable of the exercise, never a volume dimension",
    );
    expect(gripSection("## Grip Hand-Pull Work")).toContain(
      "the same exercise prescribed by distance travelled",
    );
    expect(gripSection("## Grip Hand-Pull Work")).toContain(
      "the same exercise prescribed as timed work intervals",
    );
  });

  test("4. both Table Groups exist and source themselves to the MODULE, not to an exercise", () => {
    const tables = readDoc(TABLES);
    expect(tables).toContain("# Table Group 16 — Grip Climb Strength");
    expect(tables).toContain("# Table Group 17 — Grip Hand-Pull Work");
    expect(tables).toContain(`profileId: ${CLIMB_ID}`);
    expect(tables).toContain(`profileId: ${PULL_ID}`);

    const group16 = tables.slice(
      tables.indexOf("# Table Group 16 — Grip Climb Strength"),
      tables.indexOf("# Table Group 17 — Grip Hand-Pull Work"),
    );
    expect(group16).toContain("Created, not discovered");
    expect(group16).toContain("65_GRIP/00_OVERVIEW.md");
    expect(flatten(group16)).toContain("Every number below is that section's.");

    const group17 = tables.slice(
      tables.indexOf("# Table Group 17 — Grip Hand-Pull Work"),
      tables.indexOf("# Exercise-Specific Numerical Requirement"),
    );
    expect(group17).toContain("Created, not discovered");
  });

  test("5. both tables record that the count travels in `repetitions` WITHOUT being a repetition", () => {
    const tables = readDoc(TABLES);
    const group16 = tables.slice(
      tables.indexOf("# Table Group 16 — Grip Climb Strength"),
      tables.indexOf("# Table Group 17 — Grip Hand-Pull Work"),
    );
    expect(flatten(group16)).toContain("It is NOT a repetition");
    expect(group16).toContain("`volumeInterpretation: climbs`");

    const group17 = tables.slice(
      tables.indexOf("# Table Group 17 — Grip Hand-Pull Work"),
      tables.indexOf("# Exercise-Specific Numerical Requirement"),
    );
    expect(group17).toContain("volumeInterpretation: hand_pulls");
  });
});

// -----------------------------------------------------------------------------
// 6-9. Triple, role, presence, executability
// -----------------------------------------------------------------------------

describe("Grip rope profiles — triple, role and executability", () => {
  test("6. both sit on grip / straight_sets_repetitions / secondary and pass the contract validator", () => {
    for (const id of [CLIMB_ID, PULL_ID]) {
      expect(profile(id).moduleId).toBe(TRIPLE.moduleId);
      expect(profile(id).methodId).toBe(TRIPLE.methodId);
      expect(profile(id).exerciseRole).toBe(TRIPLE.exerciseRole);
    }

    const result = validateMethodModuleRoleContract(
      TRIPLE.moduleId,
      TRIPLE.methodId,
      TRIPLE.exerciseRole,
    );
    expect(result.valid).toBe(true);

    // The role comes from the module chapter's Placement doctrine.
    expect(readDoc(GRIP_OVERVIEW)).toContain("after primary technical and strength work");
  });

  test("7. the triple is now SHARED by exactly three profiles, one per unit", () => {
    const onTriple = NUMERICAL_PRESCRIPTION_PROFILES.filter(
      (p) =>
        p.moduleId === TRIPLE.moduleId &&
        p.methodId === TRIPLE.methodId &&
        p.exerciseRole === TRIPLE.exerciseRole,
    );
    expect(onTriple.map((p) => p.profileId).sort()).toEqual([...GRIP_TRIPLE_IDS]);

    // Implicit resolution refuses it; explicit selection returns each.
    const implicit = resolveNumericalProfile({ ...TRIPLE });
    expect(implicit.ok).toBe(false);
    if (!implicit.ok) {
      expect(implicit.failureCode).toBe("NUMERICAL_PROFILE_AMBIGUOUS");
      expect([...implicit.candidateProfileIds].sort()).toEqual([...GRIP_TRIPLE_IDS]);
    }
    for (const id of GRIP_TRIPLE_IDS) {
      const explicit = resolveNumericalProfile({ ...TRIPLE, explicitProfileId: id });
      expect(explicit.ok && explicit.profile.profileId).toBe(id);
      expect(explicit.ok && explicit.resolutionSource).toBe("explicit_profile_id");
    }
  });

  test("8. the Grip triple is a second duplicated triple, disjoint from the interval one", () => {
    const duplicates = findDuplicateProfileTriples();
    expect(duplicates).toHaveLength(2);

    const grip = duplicates.find((d) => d.moduleId === "grip");
    const interval = duplicates.find((d) => d.moduleId === "conditioning");
    expect(grip).toBeDefined();
    expect(interval).toBeDefined();
    expect([...(grip?.profileIds ?? [])].sort()).toEqual([...GRIP_TRIPLE_IDS]);
    expect((grip?.profileIds ?? []).filter((id) => (interval?.profileIds ?? []).includes(id))).toEqual([]);
  });

  test("9. both profiles are executable and neither references an ExerciseId", () => {
    for (const id of [CLIMB_ID, PULL_ID]) {
      expect(isExecutableNumericalProfile(profile(id)), id).toBe(true);
      const serialised = JSON.stringify(profile(id));
      for (const exerciseId of ["rope_climb", "rope_pull", "towel_pull_up", "plate_pinch"]) {
        expect(serialised, `${id}/${exerciseId}`).not.toContain(exerciseId);
      }
      expect(profile(id).sourceRuleIds).toEqual(["34_NUMERICAL_PRESCRIPTION_TABLES_V0_1"]);
      expect(profile(id).version).toBe("0.1");
    }
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(21);
  });
});

// -----------------------------------------------------------------------------
// 10-17. Documented values and resolution
// -----------------------------------------------------------------------------

describe("Grip rope profiles — documented values", () => {
  const EXPECTED: Record<string, Record<"reduced" | "normal" | "high", { sets: number; count: number; rest: number }>> = {
    [CLIMB_ID]: {
      reduced: { sets: 3, count: 1, rest: 120 },
      normal: { sets: 4, count: 3, rest: 210 },
      high: { sets: 5, count: 5, rest: 300 },
    },
    [PULL_ID]: {
      reduced: { sets: 3, count: 6, rest: 90 },
      normal: { sets: 4, count: 13, rest: 165 },
      high: { sets: 5, count: 20, rest: 240 },
    },
  };

  test("10. + 11. + 12. every range context resolves each module rule's own values", () => {
    for (const id of [CLIMB_ID, PULL_ID]) {
      for (const rangeContext of ["reduced", "normal", "high"] as const) {
        const volume = resolveVolume(resolverInput(id, rangeContext));
        const intensity = resolveIntensity({
          ...resolverInput(id, rangeContext),
          supportedIntensityTypes: ["technical_effort"],
        });
        const rest = resolveRest(resolverInput(id, rangeContext));
        const tempo = resolveTempo({
          ...resolverInput(id, rangeContext),
          supportedTempoTypes: ["global_intent"],
        });

        expect(volume.ok, `${id}/${rangeContext}`).toBe(true);
        expect(intensity.ok, `${id}/${rangeContext}`).toBe(true);
        expect(rest.ok, `${id}/${rangeContext}`).toBe(true);
        expect(tempo.ok, `${id}/${rangeContext}`).toBe(true);
        if (!volume.ok || !intensity.ok || !rest.ok || !tempo.ok) continue;

        const expected = EXPECTED[id][rangeContext];
        expect(volume.volume.structure).toBe("sets_reps");
        expect(volume.volume.sets).toBe(expected.sets);
        if (volume.volume.reps?.type === "fixed") {
          expect(volume.volume.reps.value).toBe(expected.count);
        }
        expect(intensity.intensity.primaryMetric.type).toBe("technical_effort");
        expect(intensity.intensity.primaryMetric.target).toMatchObject({ value: "high_quality" });
        if (rest.rest?.betweenSets?.type === "fixed") {
          expect(rest.rest.betweenSets.duration.value).toBe(expected.rest);
        }
        expect(tempo.tempo?.globalIntent).toBe("controlled");
      }
    }
  });

  test("13. the climb envelope is 3-5 sets x 1-5 ascents, and never overlaps the pull envelope", () => {
    expect(profile(CLIMB_ID).volume.sets).toEqual({ min: 3, normal: 4, max: 5 });
    expect(profile(CLIMB_ID).volume.repetitions).toEqual({
      type: "fixed_range",
      range: { min: 1, normal: 3, max: 5 },
    });
    expect(gripSection("## Grip Climb Strength")).toContain("- 1 to 5 complete ascents per set.");

    // 1-5 ascents and 6-20 hand pulls do not intersect at all — the
    // arithmetic proof that one envelope could never have served both.
    const climb = profile(CLIMB_ID).volume.repetitions!.range;
    const pull = profile(PULL_ID).volume.repetitions!.range;
    expect(Math.max(climb.min, pull.min)).toBeGreaterThan(Math.min(climb.max, pull.max));
  });

  test("14. the hand-pull envelope is 3-5 sets x 6-20 pulls", () => {
    expect(profile(PULL_ID).volume.sets).toEqual({ min: 3, normal: 4, max: 5 });
    expect(profile(PULL_ID).volume.repetitions).toEqual({
      type: "fixed_range",
      range: { min: 6, normal: 13, max: 20 },
    });
    expect(gripSection("## Grip Hand-Pull Work")).toContain(
      "- 6 to 20 hand-over-hand pulls per set.",
    );
  });

  test("15. both normals follow the documented Integer Resolution convention", () => {
    const lower = (min: number, max: number) => Math.floor((min + max) / 2);
    expect(profile(CLIMB_ID).volume.sets!.normal).toBe(lower(3, 5));
    expect(profile(CLIMB_ID).volume.repetitions!.range.normal).toBe(lower(1, 5));
    expect(profile(CLIMB_ID).rest!.seconds!.normal).toBe(lower(120, 300));
    expect(profile(PULL_ID).volume.repetitions!.range.normal).toBe(lower(6, 20));
    expect(profile(PULL_ID).rest!.seconds!.normal).toBe(lower(90, 240));
  });

  test("16. intensity is technical_effort — never RPE, never RIR, never a resistance number", () => {
    for (const id of [CLIMB_ID, PULL_ID]) {
      expect(profile(id).intensity).toHaveLength(1);
      expect(profile(id).intensity[0]).toEqual({
        type: "technical_effort",
        value: "high_quality",
        sourceRuleIds: ["34_NUMERICAL_PRESCRIPTION_TABLES_V0_1", "26_INTENSITY_MODEL_V0_1"],
      });
      const types = profile(id).intensity.map((rule) => rule.type);
      for (const absent of ["rpe", "rir", "absolute_load", "percentage_body_mass", "resistance_category"]) {
        expect(types, `${id}/${absent}`).not.toContain(absent);
      }
      expect(getModulePrescriptionContract("grip").allowedIntensityTypes).toContain("technical_effort");
      expect(getTrainingMethodContract(TRIPLE.methodId).allowedIntensityTypes).toContain("technical_effort");
    }

    // Each doctrine states WHY there is no reserve figure.
    expect(flatten(gripSection("## Grip Climb Strength"))).toContain(
      "cannot be left partly in reserve",
    );
    expect(flatten(gripSection("## Grip Hand-Pull Work"))).toContain(
      "the records qualify it in words rather than figures",
    );
  });

  test("17. rest and dose envelopes match the module rules", () => {
    expect(profile(CLIMB_ID).rest).toEqual({
      scope: "between_sets",
      seconds: { min: 120, normal: 210, max: 300 },
      sourceRuleIds: ["34_NUMERICAL_PRESCRIPTION_TABLES_V0_1", "27_REST_TEMPO_RULES_V0_1"],
    });
    expect(profile(PULL_ID).rest).toEqual({
      scope: "between_sets",
      seconds: { min: 90, normal: 165, max: 240 },
      sourceRuleIds: ["34_NUMERICAL_PRESCRIPTION_TABLES_V0_1", "27_REST_TEMPO_RULES_V0_1"],
    });
    expect(gripSection("## Grip Climb Strength")).toContain("- 2 to 5 minutes.");
    expect(gripSection("## Grip Hand-Pull Work")).toContain("- 90 seconds to 4 minutes.");

    expect(profile(CLIMB_ID).minimumDose).toMatchObject({ sets: 3, repetitions: 1 });
    expect(profile(CLIMB_ID).maximumDose).toMatchObject({ sets: 5, repetitions: 5 });
    expect(profile(PULL_ID).minimumDose).toMatchObject({ sets: 3, repetitions: 6 });
    expect(profile(PULL_ID).maximumDose).toMatchObject({ sets: 5, repetitions: 20 });

    for (const id of [CLIMB_ID, PULL_ID]) {
      for (const field of ["durationSeconds", "distanceMeters", "rounds", "workIntervals"] as const) {
        expect(profile(id).minimumDose[field]).toBeNull();
        expect(profile(id).maximumDose[field]).toBeNull();
      }
      expect(profile(id).requiresExerciseSpecificLoadRule).toBe(false);
      expect(profile(id).requiresSportSpecificSubtype).toBe(false);
    }
  });
});

// -----------------------------------------------------------------------------
// 18-20. Non-regression
// -----------------------------------------------------------------------------

describe("Grip rope profiles — non-regression", () => {
  test("18. the 19 pre-existing profiles are unchanged, and GRIP-REPETITION-STRENGTH in particular", () => {
    const repetition = getNumericalPrescriptionProfileById("grip_repetition_strength_v0_1")!;
    expect(repetition.volume.sets).toEqual({ min: 3, normal: 4, max: 5 });
    expect(repetition.volume.repetitions).toEqual({
      type: "fixed_range",
      range: { min: 2, normal: 5, max: 8 },
    });
    expect(repetition.intensity.map((r) => r.type)).toEqual(["rir"]);
    expect(repetition.rest!.seconds!).toEqual({ min: 90, normal: 165, max: 240 });

    const power = getNumericalPrescriptionProfileById("power_intervals_v0_1")!;
    expect(power.volume.workIntervals).toEqual({ min: 3, normal: 7, max: 12 });
  });

  test("19. exactly one entry consumes each profile, and each declares its own unit", () => {
    const byProfile: Record<string, string> = {
      [CLIMB_ID]: "rope_climb",
      [PULL_ID]: "rope_pull",
    };
    for (const id of [CLIMB_ID, PULL_ID]) {
      const consumers = Object.values(EXERCISE_PRESCRIPTION_REGISTRY).filter(
        (entry) => entry.numericalProfileId === id,
      );
      expect(consumers.map((entry) => entry.exerciseId), id).toEqual([byProfile[id]]);
    }
    expect(EXERCISE_PRESCRIPTION_REGISTRY.rope_climb.capabilities.volumeInterpretations).toEqual([
      "climbs",
    ]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.rope_pull.capabilities.volumeInterpretations).toEqual([
      "hand_pulls",
    ]);
    // towel_pull_up keeps its own profile and still resolves explicitly.
    expect(EXERCISE_PRESCRIPTION_REGISTRY.towel_pull_up.numericalProfileId).toBe(
      "grip_repetition_strength_v0_1",
    );
  });

  test("20. resolution is deterministic and never mutates either profile", () => {
    const before = [CLIMB_ID, PULL_ID].map((id) => JSON.stringify(profile(id)));
    const runs = [1, 2, 3].map(() =>
      JSON.stringify(
        [CLIMB_ID, PULL_ID].flatMap((id) =>
          (["reduced", "normal", "high"] as const).map((rc) => resolveVolume(resolverInput(id, rc))),
        ),
      ),
    );

    expect(new Set(runs).size).toBe(1);
    expect([CLIMB_ID, PULL_ID].map((id) => JSON.stringify(profile(id)))).toEqual(before);
  });
});
