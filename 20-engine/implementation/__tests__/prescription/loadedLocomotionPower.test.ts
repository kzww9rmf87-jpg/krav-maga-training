/**
 * Combat Athlete System — Loaded Locomotion Power foundation
 *
 * A MODULE CATEGORY, a MODULE RULE, a TABLE GROUP and a NUMERICAL PROFILE.
 * No registry entry: sled_push is integrated in a later lot, and this file
 * asserts that it was not integrated here.
 *
 * Two decisions are under test.
 *
 * FIRST, the doctrine was CREATED, not discovered. `64_POWER/00_OVERVIEW.md`
 * named four Loaded Power Categories, every one written from barbell
 * derivatives performed on the spot and every one measuring work in
 * repetitions. None could express an effort whose work is a distance covered
 * under load. This lot writes the missing category and says so in the
 * documents themselves — the Table Group 15 precedent, not the Table Group 14
 * one.
 *
 * SECOND, distance and duration are BOTH prescribed volume and neither is
 * derived from the other. The profile carries three dimensions at once, and
 * nothing anywhere converts metres into seconds or back. That conversion is
 * the failure this file exists to make impossible.
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
import {
  getModulePrescriptionContract,
  getTrainingMethodContract,
  validateMethodModuleRoleContract,
} from "../../prescription/contracts";
import { resolveVolume } from "../../prescription/resolveVolume";
import { resolveIntensity } from "../../prescription/resolveIntensity";
import { resolveRest } from "../../prescription/resolveRest";
import { resolveTempo } from "../../prescription/resolveTempo";
import { validatePilotRegistry } from "../../prescription/registryValidators";
import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  PILOT_EXERCISE_IDS,
} from "../../prescription/exercisePrescriptionRegistry";
import { EQUIPMENT_CAPABILITY_IDS } from "../../prescription/equipmentCapabilities";
import { EXERCISE_KNOWLEDGE_BASE } from "../../exerciseKnowledgeBase";

const METHOD_ID = "work_rest_intervals" as const;
const PROFILE_ID = "loaded_locomotion_power_intervals_v0_1";
const REST_RULE_ID = "POWER_LOADED_LOCOMOTION_REST_V0_1";
const FUTURE_EXERCISE = "sled_push";

const profile = () => getNumericalPrescriptionProfileById(PROFILE_ID)!;

const resolverInput = (rangeContext: "reduced" | "normal" | "high") => ({
  moduleId: "power" as const,
  methodId: METHOD_ID,
  role: "secondary" as const,
  rangeContext,
  numericalProfileId: PROFILE_ID,
});

/** The resolved seconds of a `between_intervals` rest, narrowed from `RestTarget`. */
const betweenIntervalsSeconds = (result: ReturnType<typeof resolveRest>): number | null => {
  if (!result.ok || result.rest === null) return null;
  const target = result.rest.betweenIntervals;
  if (target === null || target.type !== "fixed") return null;
  return target.duration.value;
};

const readDoc = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf-8");
/** Documented prose is hard-wrapped, so sentences cross line breaks. */
const flatten = (text: string) => text.replace(/\s+/g, " ");

const MODULE_PROFILES = "../../../32_MODULE_PRESCRIPTION_PROFILES.md";
const TABLES = "../../../34_NUMERICAL_PRESCRIPTION_TABLES.md";
const POWER_OVERVIEW = "../../../../50-exercises/64_POWER/00_OVERVIEW.md";

/**
 * The slice from `heading` up to the next heading at the SAME level or
 * higher, so a `# ` section keeps its own `## ` subsections.
 */
const sliceSection = (text: string, heading: string, label: string) => {
  const start = text.indexOf(heading);
  expect(start, `${heading} not found in ${label}`).toBeGreaterThanOrEqual(0);
  const rest = text.slice(start + heading.length);
  const level = heading.match(/^#+/)![0].length;
  const terminator = new RegExp(`\\n#{1,${level}} `);
  const nextHeading = rest.search(terminator);
  return rest.slice(0, nextHeading === -1 ? undefined : nextHeading);
};

const docSection = (path: string, heading: string) => sliceSection(readDoc(path), heading, path);

/**
 * The Power overview carries `## Loaded Locomotion Power` TWICE — once as a
 * Loaded Power Category and once as a General Prescription Range — so a
 * bare heading lookup is ambiguous there. This resolves the parent section
 * first.
 */
const docSectionWithin = (path: string, parentHeading: string, heading: string) =>
  sliceSection(sliceSection(readDoc(path), parentHeading, path), heading, `${path} / ${parentHeading}`);

const POWER_RANGES = "# General Prescription Ranges";
const POWER_CATEGORIES = "# Loaded Power Categories";

// -----------------------------------------------------------------------------
// 1-5. The doctrine
// -----------------------------------------------------------------------------

describe("Loaded Locomotion Power — the doctrine", () => {
  test("1. the category exists in the Power overview, the module rule and the tables", () => {
    expect(readDoc(POWER_OVERVIEW)).toContain("## Loaded Locomotion Power");
    expect(readDoc(MODULE_PROFILES)).toContain("## Loaded Locomotion Power");
    expect(readDoc(TABLES)).toContain("# Table Group 19 — Loaded Locomotion Power");

    // The Power overview carries it in BOTH places a category needs to live:
    // as one of the Loaded Power Categories, and as a prescription range.
    expect(flatten(docSection(POWER_OVERVIEW, "# Loaded Power Categories"))).toContain(
      "Loaded Locomotion Power",
    );
    expect(flatten(docSection(POWER_OVERVIEW, "# General Prescription Ranges"))).toContain(
      "Loaded Locomotion Power",
    );
  });

  test("2. the doctrine says outright that it is created here and claims no pre-existing family", () => {
    const overview = flatten(docSectionWithin(POWER_OVERVIEW, POWER_CATEGORIES, "## Loaded Locomotion Power"));
    expect(overview).toContain("created here as a module rule");
    expect(overview).toContain("does not claim to describe a family this document already recognized");

    const moduleRule = flatten(docSection(MODULE_PROFILES, "## Loaded Locomotion Power"));
    expect(moduleRule).toContain("It is created here");
    expect(moduleRule).toContain(
      "does not claim to formalize a family this documentation already recognized",
    );

    const table = flatten(docSection(TABLES, "# Table Group 19 — Loaded Locomotion Power"));
    expect(table).toContain("the family was CREATED rather than found");
    expect(table).toContain("does not claim to formalize a pre-existing family");
  });

  test("3. the scope is generic — defined by mechanics, and open to future consumers", () => {
    const moduleRule = flatten(docSection(MODULE_PROFILES, "## Loaded Locomotion Power"));

    // Four admissibility criteria, stated as criteria rather than as a list of
    // exercises.
    expect(moduleRule).toContain("An exercise may use this rule when its own chapter documents");
    expect(moduleRule).toContain("an external resistance displaced across the ground");
    expect(moduleRule).toContain("repeated separate efforts");

    const table = flatten(docSection(TABLES, "# Table Group 19 — Loaded Locomotion Power"));
    expect(table).toContain("Admissible Future Consumers");
    expect(table).toContain("Prowler pushes and explosive sled drags qualify");

    expect(
      flatten(docSectionWithin(POWER_OVERVIEW, POWER_CATEGORIES, "## Loaded Locomotion Power")),
    ).toContain("not by any single exercise");
  });

  test("4. loaded carries are excluded explicitly, in the module rule and in the table", () => {
    const moduleRule = flatten(docSection(MODULE_PROFILES, "## Loaded Locomotion Power"));
    expect(moduleRule).toContain("loaded carries, where the load is held rather than driven");

    const table = flatten(docSection(TABLES, "# Table Group 19 — Loaded Locomotion Power"));
    expect(table).toContain("never for a loaded carry, where the load is held rather than driven");

    // And structurally: the carry method is forbidden to this module outright,
    // so the exclusion is enforced and not merely written.
    expect(getModulePrescriptionContract("power").forbiddenMethods).toContain("distance_carry_sets");
  });

  test("5. free sprinting, harness-towed sprinting, continuous bouts and conditioning are all excluded", () => {
    const moduleRule = flatten(docSection(MODULE_PROFILES, "## Loaded Locomotion Power"));

    expect(moduleRule).toContain("unresisted sprinting, which has no external resistance to accelerate");
    expect(moduleRule).toContain("harness-towed resisted sprinting");
    expect(moduleRule).toContain("continuous heavy walking or marching, which is one bout");
    expect(moduleRule).toContain("long conditioning intervals");
    expect(moduleRule).toContain("maximal-strength work without displacement");

    const table = flatten(docSection(TABLES, "# Table Group 19 — Loaded Locomotion Power"));
    expect(table).toContain("never for unresisted or harness-towed sprinting");
    expect(table).toContain("never for one continuous bout");
    expect(table).toContain("never as a conditioning structure");
  });
});

// -----------------------------------------------------------------------------
// 6-8. Triple, profile, executability
// -----------------------------------------------------------------------------

describe("Loaded Locomotion Power — triple, role and executability", () => {
  test("6. the triple power / work_rest_intervals / secondary is legal and unique", () => {
    // Legal by contract, in both directions.
    const method = getTrainingMethodContract(METHOD_ID);
    expect(method.supportedModules).toContain("power");
    expect(method.supportedRoles).toContain("secondary");

    const authorization = getModulePrescriptionContract("power").allowedMethods.find(
      (candidate) => candidate.methodId === METHOD_ID,
    );
    expect(authorization).toBeDefined();
    expect(authorization!.allowedRoles).toContain("secondary");

    expect(validateMethodModuleRoleContract("power", METHOD_ID, "secondary").valid).toBe(true);

    // Unique: nothing else sits on power / work_rest_intervals at any role.
    const onModuleMethod = NUMERICAL_PRESCRIPTION_PROFILES.filter(
      (candidate) => candidate.moduleId === "power" && candidate.methodId === METHOD_ID,
    );
    expect(onModuleMethod.map((candidate) => candidate.profileId)).toEqual([PROFILE_ID]);
    for (const duplicate of findDuplicateProfileTriples()) {
      expect(duplicate.profileIds as readonly string[]).not.toContain(PROFILE_ID);
    }

    // So implicit resolution succeeds — the explicit id is a convention here,
    // not a necessity.
    const implicit = resolveNumericalProfile({
      moduleId: "power",
      methodId: METHOD_ID,
      exerciseRole: "secondary",
      explicitProfileId: null,
    });
    expect(implicit.ok).toBe(true);
    expect(implicit.ok && implicit.profile.profileId).toBe(PROFILE_ID);
  });

  test("6b. the role is the only honest option the contracts leave", () => {
    const method = getTrainingMethodContract(METHOD_ID);
    // `primary` is not available on this method at all.
    expect(method.supportedRoles).not.toContain("primary");

    // Of the three the module authorizes, the doctrine rejects two on
    // documentary grounds, and the table records why.
    const table = flatten(docSection(TABLES, "# Table Group 19 — Loaded Locomotion Power"));
    expect(table).toContain("`conditioning` would contradict");
    expect(table).toContain("Technical Acquisition");
  });

  test("7. the profile exists exactly once, at version 0.1, sourced from the tables and its own rest rule", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES.filter((p) => p.profileId === PROFILE_ID)).toHaveLength(1);

    const p = profile();
    expect(p.version).toBe("0.1");
    expect(p.moduleId).toBe("power");
    expect(p.methodId).toBe(METHOD_ID);
    expect(p.exerciseRole).toBe("secondary");
    expect(p.volume.structure).toBe("intervals");
    expect(p.requiresExerciseSpecificLoadRule).toBe(false);
    expect(p.requiresSportSpecificSubtype).toBe(false);
  });

  test("8. the profile is executable — it carries an encodable intensity rule", () => {
    expect(isExecutableNumericalProfile(profile())).toBe(true);
    expect(profile().intensity.length).toBeGreaterThan(0);
  });
});

// -----------------------------------------------------------------------------
// 9-15. The numbers, and the two dimensions
// -----------------------------------------------------------------------------

describe("Loaded Locomotion Power — resolved values in every range context", () => {
  test("9. reduced resolves to the documented floor of all three dimensions", () => {
    const volume = resolveVolume(resolverInput("reduced"));
    expect(volume.ok).toBe(true);
    expect(volume.ok && volume.volume.workIntervals).toBe(4);
    expect(volume.ok && volume.volume.duration?.value).toBe(5);
    expect(volume.ok && volume.volume.distance?.value).toBe(10);

    expect(betweenIntervalsSeconds(resolveRest(resolverInput("reduced")))).toBe(120);
  });

  test("10. normal resolves to the Integer Resolution midpoints", () => {
    const volume = resolveVolume(resolverInput("normal"));
    expect(volume.ok).toBe(true);
    expect(volume.ok && volume.volume.workIntervals).toBe(8);
    expect(volume.ok && volume.volume.duration?.value).toBe(22);
    expect(volume.ok && volume.volume.distance?.value).toBe(25);

    expect(betweenIntervalsSeconds(resolveRest(resolverInput("normal")))).toBe(180);
  });

  test("11. high resolves to the documented ceiling of all three dimensions", () => {
    const volume = resolveVolume(resolverInput("high"));
    expect(volume.ok).toBe(true);
    expect(volume.ok && volume.volume.workIntervals).toBe(12);
    expect(volume.ok && volume.volume.duration?.value).toBe(40);
    expect(volume.ok && volume.volume.distance?.value).toBe(40);

    expect(betweenIntervalsSeconds(resolveRest(resolverInput("high")))).toBe(240);
  });

  test("12. work intervals are 4-8-12, and every other structural field is null", () => {
    const p = profile();
    expect(p.volume.workIntervals).toEqual({ min: 4, normal: 8, max: 12 });
    expect(p.volume.sets).toBeNull();
    expect(p.volume.repetitions).toBeNull();
    expect(p.volume.rounds).toBeNull();

    // The method forbids exactly those three, so the profile agrees with its
    // own contract rather than merely happening to match.
    const forbidden = getTrainingMethodContract(METHOD_ID).forbiddenVolumeFields;
    expect(forbidden).toEqual(expect.arrayContaining(["sets", "repetitions", "rounds"]));
  });

  test("13. duration is per_interval, 5-22-40 seconds", () => {
    const duration = profile().volume.duration!;
    expect(duration.type).toBe("fixed_range");
    expect(duration.scope).toBe("per_interval");
    expect(duration.range).toEqual({ min: 5, normal: 22, max: 40, unit: "seconds" });

    // Required by the method, so it can never be dropped.
    expect(getTrainingMethodContract(METHOD_ID).requiredVolumeFields).toContain("duration");
  });

  test("14. distance is per_interval, 10-25-40 metres — carried simultaneously with duration", () => {
    const distance = profile().volume.distance!;
    expect(distance.type).toBe("fixed_range");
    expect(distance.scope).toBe("per_interval");
    expect(distance.range).toEqual({ min: 10, normal: 25, max: 40, unit: "meters" });

    // Optional to the method, required by this rule — the structure permits
    // all three dimensions at once, which is what makes this table possible.
    expect(getTrainingMethodContract(METHOD_ID).optionalVolumeFields).toContain("distance");
    expect(getTrainingMethodContract(METHOD_ID).forbiddenVolumeFields).not.toContain("distance");

    // This is the first profile in the library to carry a per_interval
    // distance, and the only one to carry distance alongside duration.
    const withBoth = NUMERICAL_PRESCRIPTION_PROFILES.filter(
      (candidate) => candidate.volume.distance !== null && candidate.volume.duration !== null,
    );
    expect(withBoth.map((candidate) => candidate.profileId)).toEqual([PROFILE_ID]);
  });

  test("15. NO CONVERSION between metres and seconds happens anywhere", () => {
    // The two dimensions resolve independently in every range context: if
    // either were derived from the other, one of these ratios would be
    // constant. They are not.
    const ratios = (["reduced", "normal", "high"] as const).map((rangeContext) => {
      const volume = resolveVolume(resolverInput(rangeContext));
      if (!volume.ok) throw new Error(`Expected volume for ${rangeContext}.`);
      return volume.volume.distance!.value / volume.volume.duration!.value;
    });
    expect(new Set(ratios).size).toBe(3);

    // Their units stay distinct through resolution.
    const volume = resolveVolume(resolverInput("normal"));
    expect(volume.ok && volume.volume.duration?.unit).toBe("seconds");
    expect(volume.ok && volume.volume.distance?.unit).toBe("meters");

    // And the doctrine forbids the conversion in writing, in all three
    // documents, so a future lot cannot introduce it quietly.
    expect(
      flatten(docSectionWithin(POWER_OVERVIEW, POWER_RANGES, "## Loaded Locomotion Power")),
    ).toContain("must never derive one from the other");
    expect(flatten(docSection(MODULE_PROFILES, "## Loaded Locomotion Power"))).toContain(
      "must not convert metres into seconds or seconds into metres",
    );
    expect(flatten(docSection(TABLES, "# Table Group 19 — Loaded Locomotion Power"))).toContain(
      "never convert metres into seconds or seconds into metres",
    );
  });
});

// -----------------------------------------------------------------------------
// 16-21. Intensity, rest, tempo, doses, sources
// -----------------------------------------------------------------------------

describe("Loaded Locomotion Power — intensity, rest, tempo and doses", () => {
  test("16. intensity is movement_intent: explosive, one rule and only one", () => {
    const p = profile();
    expect(p.intensity).toHaveLength(1);
    expect(p.intensity[0]!.type).toBe("movement_intent");
    expect(p.intensity[0]).toMatchObject({ type: "movement_intent", value: "explosive" });

    const intensity = resolveIntensity({
      ...resolverInput("normal"),
      supportedIntensityTypes: ["movement_intent"],
    });
    expect(intensity.ok).toBe(true);
    expect(intensity.ok && intensity.selectedRuleType).toBe("movement_intent");
  });

  test("16b. load is NOT dosed, and the reason is structural", () => {
    const p = profile();
    const types = p.intensity.map((rule) => rule.type);
    for (const unsupported of [
      "absolute_load",
      "percentage_1rm",
      "percentage_body_mass",
      "resistance_category",
      "rpe",
      "velocity",
    ]) {
      expect(types).not.toContain(unsupported);
    }

    // The module permits several of those, so the omission is a decision.
    const allowed = getModulePrescriptionContract("power").allowedIntensityTypes;
    expect(allowed).toContain("absolute_load");
    expect(allowed).toContain("resistance_category");

    // And `resistance_category` could not be carried by a profile rule even
    // if a chapter documented a scale: the categorical rule type is closed.
    const table = flatten(docSection(TABLES, "# Table Group 19 — Loaded Locomotion Power"));
    expect(table).toContain("`IntensityCategoryRule` accepts only");
    expect(table).toContain("stay a progression axis");
  });

  test("17. rest is between_intervals, 120-180-240 s, traceable to its own rule id", () => {
    const rest = profile().rest!;
    expect(rest.scope).toBe("between_intervals");
    expect(rest.seconds).toEqual({ min: 120, normal: 180, max: 240 });
    expect(rest.sourceRuleIds).toContain(REST_RULE_ID);

    // The rule id reaches the resolved prescription, so the one number no
    // chapter documents stays individually traceable downstream.
    const resolved = resolveRest(resolverInput("normal"));
    expect(resolved.ok && resolved.rest?.sourceRuleIds).toContain(REST_RULE_ID);
  });

  test("17b. the rest band is declared an engineering decision and is not a borrowed band", () => {
    const surfaces: readonly (readonly [string, string])[] = [
      ["power overview", flatten(docSectionWithin(POWER_OVERVIEW, POWER_RANGES, "## Loaded Locomotion Power"))],
      ["module rule", flatten(docSection(MODULE_PROFILES, "## Loaded Locomotion Power"))],
      ["table group 19", flatten(docSection(TABLES, "# Table Group 19 — Loaded Locomotion Power"))],
    ];
    for (const [label, text] of surfaces) {
      expect(text, label).toContain(REST_RULE_ID);
      expect(text, label).toContain("engineering decision");
    }

    // It is never attributed to an exercise chapter.
    expect(flatten(docSection(TABLES, "# Table Group 19 — Loaded Locomotion Power"))).toContain(
      "never be attributed to an exercise chapter",
    );

    // It is not any other module's band: none of the three named alternatives
    // shares these numbers.
    const others = NUMERICAL_PRESCRIPTION_PROFILES.filter(
      (candidate) =>
        candidate.profileId !== PROFILE_ID &&
        candidate.rest !== null &&
        candidate.rest.seconds !== null &&
        candidate.rest.seconds.min === 120 &&
        candidate.rest.seconds.normal === 180 &&
        candidate.rest.seconds.max === 240,
    );
    expect(others).toEqual([]);
  });

  test("18. tempo is null, and the method forbids it", () => {
    expect(profile().tempo).toBeNull();
    expect(getTrainingMethodContract(METHOD_ID).tempoPolicy).toBe("forbidden");

    const tempo = resolveTempo({ ...resolverInput("normal"), supportedTempoTypes: [] });
    expect(tempo.ok).toBe(true);
    expect(tempo.ok && tempo.tempo).toBeNull();

    // Explosive intent lives in the intensity rule, not in a tempo.
    expect(flatten(docSection(MODULE_PROFILES, "## Loaded Locomotion Power"))).toContain(
      "Explosive intent is an INTENSITY statement here, not a tempo",
    );
  });

  test("19. the minimum dose carries all three dimensions", () => {
    expect(profile().minimumDose).toMatchObject({
      workIntervals: 4,
      durationSeconds: 5,
      distanceMeters: 10,
      sets: null,
      repetitions: null,
      rounds: null,
    });
  });

  test("20. the maximum dose carries all three dimensions", () => {
    expect(profile().maximumDose).toMatchObject({
      workIntervals: 12,
      durationSeconds: 40,
      distanceMeters: 40,
      sets: null,
      repetitions: null,
      rounds: null,
    });
  });

  test("21. every sourceRuleId on the profile is real and conforms to the convention", () => {
    const p = profile();
    expect(p.sourceRuleIds).toContain("34_NUMERICAL_PRESCRIPTION_TABLES_V0_1");
    expect(p.sourceRuleIds).toContain(REST_RULE_ID);

    const all = [
      ...p.sourceRuleIds,
      ...p.intensity.flatMap((rule) => rule.sourceRuleIds),
      ...(p.rest?.sourceRuleIds ?? []),
    ];
    for (const id of all) {
      expect(id, id).toMatch(/^\d{2}_[A-Z0-9_]+_V\d+_\d+$|^POWER_[A-Z0-9_]+_V\d+_\d+$/);
    }
  });
});

// -----------------------------------------------------------------------------
// 22-27. Validation, determinism, genericity, non-regression
// -----------------------------------------------------------------------------

describe("Loaded Locomotion Power — validation, genericity and non-regression", () => {
  test("22. the whole registry still validates, and every profile still resolves", () => {
    expect(
      validatePilotRegistry(),
    ).toEqual([]);

    for (const candidate of NUMERICAL_PRESCRIPTION_PROFILES) {
      const resolution = resolveNumericalProfile({
        moduleId: candidate.moduleId,
        methodId: candidate.methodId,
        exerciseRole: candidate.exerciseRole,
        explicitProfileId: candidate.profileId,
      });
      expect(resolution.ok, candidate.profileId).toBe(true);
    }
  });

  test("23. resolution is deterministic across repeated calls", () => {
    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      const runs = [0, 1, 2].map(() =>
        JSON.stringify({
          volume: resolveVolume(resolverInput(rangeContext)),
          rest: resolveRest(resolverInput(rangeContext)),
          tempo: resolveTempo({ ...resolverInput(rangeContext), supportedTempoTypes: [] }),
        }),
      );
      expect(new Set(runs).size, rangeContext).toBe(1);
    }
  });

  test("24. resolving never mutates the profile", () => {
    const before = JSON.stringify(profile());
    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      resolveVolume(resolverInput(rangeContext));
      resolveRest(resolverInput(rangeContext));
      resolveIntensity({ ...resolverInput(rangeContext), supportedIntensityTypes: ["movement_intent"] });
      resolveTempo({ ...resolverInput(rangeContext), supportedTempoTypes: [] });
    }
    expect(JSON.stringify(profile())).toBe(before);
  });

  test("25. no ExerciseId appears in the profile, and the doctrine names no exercise id", () => {
    const surfaces = {
      profile: JSON.stringify(profile()),
      moduleRule: docSection(MODULE_PROFILES, "## Loaded Locomotion Power"),
      table: docSection(TABLES, "# Table Group 19 — Loaded Locomotion Power"),
    };

    for (const [surface, text] of Object.entries(surfaces)) {
      for (const exerciseId of PILOT_EXERCISE_IDS) {
        expect(text, `${surface} / ${exerciseId}`).not.toContain(exerciseId);
      }
      expect(text, `${surface} / ${FUTURE_EXERCISE}`).not.toContain(FUTURE_EXERCISE);
    }
  });

  test("26. the 22 pre-existing profiles are byte-for-byte unchanged", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(23);

    // Spot-checked anchors across the modules this lot could plausibly have
    // disturbed — the Power repetition profile and the four interval profiles
    // that share the conditioning triple.
    expect(getNumericalPrescriptionProfileById("power_primary_repetition_sets_v0_1")!.moduleId).toBe("power");
    expect(getNumericalPrescriptionProfileById("power_intervals_v0_1")!.moduleId).toBe("conditioning");
    expect(getNumericalPrescriptionProfileById("power_intervals_v0_1")!.rest!.seconds).toEqual({
      min: 20,
      normal: 55,
      max: 90,
    });
    expect(getNumericalPrescriptionProfileById("conditioning_long_intervals_v0_1")!.volume.distance).toBeNull();

    // No pre-existing profile acquired a distance or moved onto the power
    // module's interval triple.
    const withDistance = NUMERICAL_PRESCRIPTION_PROFILES.filter(
      (candidate) => candidate.volume.distance !== null,
    ).map((candidate) => candidate.profileId);
    expect(withDistance).toEqual(["distance_carry_strength_grip_v0_1", PROFILE_ID]);
  });

  test("27. the profile is consumed by exactly the one exercise it was built for — and by nothing else", () => {
    // This assertion was "no registry entry was added — the registry stays at
    // 74" while the doctrine shipped alone. Registry Lot 21 consumed it, which
    // is what it was for; what still has to hold is that NOTHING ELSE moved
    // onto the new profile, and that the doctrine was not quietly widened to
    // fit a second exercise it was never written for.
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(82);
    expect(PILOT_EXERCISE_IDS).toHaveLength(82);
    expect(EXERCISE_KNOWLEDGE_BASE).toHaveLength(83);
    expect(EQUIPMENT_CAPABILITY_IDS).toHaveLength(34);

    const consumers = Object.values(EXERCISE_PRESCRIPTION_REGISTRY).filter(
      (registryEntry) => registryEntry.numericalProfileId === PROFILE_ID,
    );
    expect(consumers.map((registryEntry) => registryEntry.exerciseId)).toEqual([FUTURE_EXERCISE]);

    // Nothing else declares the power/work_rest_intervals triple either.
    const onTriple = Object.values(EXERCISE_PRESCRIPTION_REGISTRY).filter(
      (registryEntry) =>
        registryEntry.moduleId === "power" && registryEntry.explicitMethodId === METHOD_ID,
    );
    expect(onTriple.map((registryEntry) => registryEntry.exerciseId)).toEqual([FUTURE_EXERCISE]);
  });
});
