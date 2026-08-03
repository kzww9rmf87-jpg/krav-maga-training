/**
 * Combat Athlete System — Partner Grappling Rounds foundation
 *
 * A METHOD, a MODULE RULE, a TABLE GROUP, a NUMERICAL PROFILE and five
 * round-scoped stop-condition factories. No registry entry: pummeling,
 * wall_wrestling and grip_fighting are integrated in a later lot, and this
 * file asserts that they were not integrated here.
 *
 * The central decision under test is that `combat_rounds` was NOT widened.
 * Its contract requires the `impact_equipment` capability and the
 * `impact_limit` and `equipment_failure` stop-condition categories, and
 * Table Group 9 binds it to a sport-specific subtype. A bare-handed clinch
 * drill satisfies none of those, so weakening that contract to save one
 * identifier would have traded a precise contract for a permissive one.
 * Every assertion about `combat_rounds` below is a non-regression assertion:
 * it must come out of this lot byte-for-byte unchanged.
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
  MODULE_PRESCRIPTION_CONTRACTS,
  TRAINING_METHOD_CONTRACTS,
  TRAINING_METHOD_IDS,
  getModulePrescriptionContract,
  getTrainingMethodContract,
  isTrainingMethodId,
  validateMethodModuleRoleContract,
} from "../../prescription/contracts";
import { resolveVolume } from "../../prescription/resolveVolume";
import { resolveIntensity } from "../../prescription/resolveIntensity";
import { resolveRest } from "../../prescription/resolveRest";
import { resolveTempo } from "../../prescription/resolveTempo";
import { resolveStopConditions } from "../../prescription/resolveStopConditions";
import {
  acuteSymptomCondition,
  completionCondition,
  manualTerminationCondition,
  painCondition,
  partnerResistanceLimitCondition,
  roundBalanceLossCondition,
  roundCoordinationLossCondition,
  roundTechnicalFailureCondition,
} from "../../prescription/stopConditionRegistry";
import { validateCompatibility } from "../../prescription/validateCompatibility";
import type { ExercisePrescriptionCapabilities } from "../../prescription/validateCompatibility";
import { validatePilotRegistry } from "../../prescription/registryValidators";
import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  PILOT_EXERCISE_IDS,
} from "../../prescription/exercisePrescriptionRegistry";
import { EQUIPMENT_CAPABILITY_IDS } from "../../prescription/equipmentCapabilities";
import { EXERCISE_KNOWLEDGE_BASE } from "../../exerciseKnowledgeBase";

const METHOD_ID = "partner_grappling_rounds" as const;
const PROFILE_ID = "partner_grappling_rounds_technical_v0_1";
const FUTURE_DRILLS = ["pummeling", "wall_wrestling", "grip_fighting"] as const;

const method = () => getTrainingMethodContract(METHOD_ID);
const profile = () => getNumericalPrescriptionProfileById(PROFILE_ID)!;

const resolverInput = (rangeContext: "reduced" | "normal" | "high") => ({
  moduleId: "movement" as const,
  methodId: METHOD_ID,
  role: "technical" as const,
  rangeContext,
  numericalProfileId: PROFILE_ID,
});

/** The resolved seconds of a `between_rounds` rest, narrowed from `RestTarget`. */
const betweenRoundsSeconds = (result: ReturnType<typeof resolveRest>): number | null => {
  if (!result.ok || result.rest === null) return null;
  const target = result.rest.betweenRounds;
  if (target === null || target.type !== "fixed") return null;
  return target.duration.value;
};

const readDoc = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf-8");
/** Documented prose is hard-wrapped, so sentences cross line breaks. */
const flatten = (text: string) => text.replace(/\s+/g, " ");

const MODULE_PROFILES = "../../../32_MODULE_PRESCRIPTION_PROFILES.md";
const TABLES = "../../../34_NUMERICAL_PRESCRIPTION_TABLES.md";
const METHOD_CATALOGUE = "../../../31_TRAINING_METHOD_CATALOGUE.md";
const STOP_CONDITIONS = "../../../28_STOP_CONDITIONS.md";

/**
 * The slice from `heading` up to the next heading at the SAME level or
 * higher, so a `# ` section keeps its own `## ` subsections and a `## `
 * section keeps its own `### ` ones.
 */
const docSection = (path: string, heading: string) => {
  const text = readDoc(path);
  const start = text.indexOf(heading);
  expect(start, `${heading} not found in ${path}`).toBeGreaterThanOrEqual(0);
  const rest = text.slice(start + heading.length);
  const level = heading.match(/^#+/)![0].length;
  const terminator = new RegExp(`\\n#{1,${level}} `);
  const nextHeading = rest.search(terminator);
  return rest.slice(0, nextHeading === -1 ? undefined : nextHeading);
};

/**
 * A synthetic capability profile for a would-be partner drill. Deliberately
 * NOT a registry entry and not one of the three real exercise ids — this
 * foundation must be provable without integrating anything.
 */
const partnerDrillCapabilities = (
  overrides: Partial<ExercisePrescriptionCapabilities> = {},
): ExercisePrescriptionCapabilities => ({
  exerciseId: "synthetic-partner-drill",
  version: "0.1",
  status: "documented",
  supportedMethodIds: [METHOD_ID],
  supportedVolumeStructures: ["rounds_duration"],
  supportedIntensityTypes: ["technical_effort"],
  preferredIntensityTypes: ["technical_effort"],
  supportedLoadingModes: ["partner_resistance"],
  supportedTempoTypes: [],
  laterality: "not_applicable",
  volumeInterpretations: ["round_total"],
  capabilityTags: [
    "round_structure",
    "technical_quality_observation",
    "partner_resistance",
  ],
  requiredEquipmentCapabilities: [],
  requiredAthleteReferenceTypes: [],
  requiredInstructionIds: [],
  requiredStopConditionIds: [],
  durationEstimationProfileId: "synthetic-duration-profile",
  substitutionCapabilityTags: [],
  sourceRuleIds: ["32_MODULE_PRESCRIPTION_PROFILES_V0_1"],
  ...overrides,
});

const stopConditionDefinitions = () => [
  roundTechnicalFailureCondition({
    conditionId: "pg_technical_failure",
    description: "End the round when technique repeatedly breaks down.",
    sourceRuleIds: ["32_MODULE_PRESCRIPTION_PROFILES_V0_1"],
  }),
  roundCoordinationLossCondition({
    conditionId: "pg_coordination_loss",
    description: "End the round when control of the exchange is lost.",
    sourceRuleIds: ["32_MODULE_PRESCRIPTION_PROFILES_V0_1"],
  }),
  roundBalanceLossCondition({
    conditionId: "pg_balance_loss",
    description: "End the round on loss of stance or footing.",
    sourceRuleIds: ["32_MODULE_PRESCRIPTION_PROFILES_V0_1"],
  }),
  partnerResistanceLimitCondition({
    conditionId: "pg_intensity_limit",
    description: "End the round when partner resistance exceeds the agreed level.",
    sourceRuleIds: ["32_MODULE_PRESCRIPTION_PROFILES_V0_1"],
  }),
  painCondition({
    conditionId: "pg_pain",
    description: "Stop on any pain.",
    sourceRuleIds: ["32_MODULE_PRESCRIPTION_PROFILES_V0_1"],
  }),
  acuteSymptomCondition({
    conditionId: "pg_acute_symptom",
    description: "Stop on dizziness or any acute symptom.",
    sourceRuleIds: ["32_MODULE_PRESCRIPTION_PROFILES_V0_1"],
  }),
  manualTerminationCondition({
    conditionId: "pg_manual_termination",
    description: "End the round whenever either athlete asks to stop.",
    sourceRuleIds: ["32_MODULE_PRESCRIPTION_PROFILES_V0_1"],
  }),
  completionCondition({
    conditionId: "pg_completion",
    description: "Stop when the prescribed rounds are complete.",
    sourceRuleIds: ["32_MODULE_PRESCRIPTION_PROFILES_V0_1"],
  }),
];

// -----------------------------------------------------------------------------
// 1-3. Doctrine, method, and the combat_rounds decision
// -----------------------------------------------------------------------------

describe("Partner Grappling Rounds — doctrine and method decision", () => {
  test("1. the module doctrine exists and defines every field the foundation needs", () => {
    const section = docSection(MODULE_PROFILES, "## Partner Grappling Rounds");

    for (const field of [
      "### Objective",
      "### Partner Is Mandatory",
      "### Admissible Exercises",
      "### Excluded Exercises",
      "### Structure",
      "### Controlled Resistance",
      "### Intensity",
      "### Rest Between Rounds",
      "### Tempo",
      "### Permitted Contact",
      "### Safety",
      "### Stop Conditions",
      "### Limits of Use",
    ]) {
      expect(section, field).toContain(field);
    }

    // Generic and reusable, not written around one exercise: the doctrine
    // must not name a single exercise id anywhere.
    for (const drill of FUTURE_DRILLS) {
      expect(section.toLowerCase(), drill).not.toContain(drill.replace("_", " "));
      expect(section, drill).not.toContain(drill);
    }
    expect(flatten(section)).toContain("This section is a module rule, not an exercise description");
  });

  test("2. the method is `partner_grappling_rounds`, documented in the catalogue and in the vocabulary", () => {
    expect(isTrainingMethodId(METHOD_ID)).toBe(true);
    expect(TRAINING_METHOD_IDS).toContain(METHOD_ID);
    expect(TRAINING_METHOD_IDS).toHaveLength(10);
    expect(method().methodId).toBe(METHOD_ID);
    expect(method().name).toBe("Partner Grappling Rounds");
    expect(method().version).toBe("0.1");
    expect(method().status).toBe("documented");

    // Same structural family as combat rounds — the family names the shape,
    // and the closed family vocabulary is NOT extended.
    expect(method().family).toBe("combat_rounds");

    expect(readDoc(METHOD_CATALOGUE)).toContain("# Method 10 — Partner Grappling Rounds");
  });

  test("3. combat_rounds was NOT used, NOT widened, and each blocker is real", () => {
    const combat = getTrainingMethodContract("combat_rounds");

    // Blocker 1 — impact equipment.
    expect(combat.requiredExerciseCapabilities).toContain("impact_equipment");
    expect(method().requiredExerciseCapabilities).not.toContain("impact_equipment");

    // Blocker 2 — impact and equipment stop conditions.
    expect(combat.requiredStopConditionCategories).toContain("impact_limit");
    expect(combat.requiredStopConditionCategories).toContain("equipment_failure");
    expect(method().requiredStopConditionCategories).not.toContain("impact_limit");
    expect(method().requiredStopConditionCategories).not.toContain("equipment_failure");

    // Blocker 3 — modules. combat_rounds still excludes movement, and the
    // movement module still forbids it. Both lines had to stay put.
    expect(combat.supportedModules).toEqual(["power", "conditioning"]);
    expect(getModulePrescriptionContract("movement").forbiddenMethods).toContain("combat_rounds");

    // Blocker 4 — sport-specific subtype.
    expect(getNumericalPrescriptionProfileById("combat_technical_rounds_v0_1")!.requiresSportSpecificSubtype).toBe(true);
    expect(profile().requiresSportSpecificSubtype).toBe(false);

    // The catalogue states the decision rather than leaving it implicit.
    expect(readDoc(METHOD_CATALOGUE)).toContain("## Why This Is Not Combat Rounds");
    expect(flatten(docSection(TABLES, "# Table Group 18 — Partner Grappling Rounds"))).toContain(
      "Table Group 9 is bound to a sport-specific subtype",
    );
  });
});

// -----------------------------------------------------------------------------
// 4-11. Module, role, structure, partner, and what is NOT required
// -----------------------------------------------------------------------------

describe("Partner Grappling Rounds — module, role, structure and partner", () => {
  test("4. the movement module supports the method, and no other module does", () => {
    expect(method().supportedModules).toEqual(["movement"]);

    const authorizing = Object.values(MODULE_PRESCRIPTION_CONTRACTS)
      .filter((moduleContract) =>
        moduleContract.allowedMethods.some((rule) => rule.methodId === METHOD_ID),
      )
      .map((moduleContract) => moduleContract.moduleId);

    expect(authorizing).toEqual(["movement"]);

    // Last in preference order: never selected ahead of mobility or
    // repetition work.
    const authorization = getModulePrescriptionContract("movement").allowedMethods.find(
      (rule) => rule.methodId === METHOD_ID,
    )!;
    const priorities = getModulePrescriptionContract("movement").allowedMethods.map((r) => r.priority);
    expect(authorization.priority).toBe(Math.max(...priorities));
    expect(authorization.conditions).toEqual(["Requires a resisting training partner."]);
  });

  test("5. the role is technical, and the module/method/role triple validates", () => {
    expect(profile().exerciseRole).toBe("technical");
    expect(method().supportedRoles).toEqual(["technical", "secondary", "accessory"]);

    // Excluded on purpose: resisted work is not a warm-up, a correction or
    // recovery.
    for (const role of ["primer", "corrective", "recovery"] as const) {
      expect(method().supportedRoles).not.toContain(role);
      expect(validateMethodModuleRoleContract("movement", METHOD_ID, role).valid).toBe(false);
    }

    for (const role of ["technical", "secondary", "accessory"] as const) {
      expect(validateMethodModuleRoleContract("movement", METHOD_ID, role).valid).toBe(true);
    }

    // And no other module can reach it.
    expect(validateMethodModuleRoleContract("power", METHOD_ID, "technical").valid).toBe(false);
    expect(validateMethodModuleRoleContract("conditioning", METHOD_ID, "technical").valid).toBe(false);
  });

  test("6. the volume structure is rounds_duration, with sets, reps, distance, intervals and laterality forbidden", () => {
    expect(method().volumeStructure).toBe("rounds_duration");
    expect(profile().volume.structure).toBe("rounds_duration");
    expect(method().requiredVolumeFields).toEqual(["rounds", "duration"]);
    expect(method().optionalVolumeFields).toEqual([]);
    expect(method().forbiddenVolumeFields).toEqual([
      "sets",
      "repetitions",
      "distance",
      "work_intervals",
      "laterality",
    ]);

    // Stricter than combat_rounds, which allows laterality: a clinch
    // exchange is not allocated per side.
    expect(getTrainingMethodContract("combat_rounds").optionalVolumeFields).toContain("laterality");

    expect(profile().volume.sets).toBeNull();
    expect(profile().volume.repetitions).toBeNull();
    expect(profile().volume.distance).toBeNull();
    expect(profile().volume.workIntervals).toBeNull();
  });

  test("7. the partner is mandatory at method level — a drill without the tag is refused", () => {
    expect(method().requiredExerciseCapabilities).toContain("partner_resistance");

    const withPartner = validateCompatibility({
      moduleId: "movement",
      methodId: METHOD_ID,
      role: "technical",
      capabilities: partnerDrillCapabilities(),
    });
    expect(withPartner.compatible).toBe(true);

    const withoutPartner = validateCompatibility({
      moduleId: "movement",
      methodId: METHOD_ID,
      role: "technical",
      capabilities: partnerDrillCapabilities({
        capabilityTags: ["round_structure", "technical_quality_observation"],
      }),
    });
    expect(withoutPartner.compatible).toBe(false);
    expect(withoutPartner.issues.map((issue) => issue.code)).toContain(
      "EXERCISE_REQUIRED_CAPABILITY_MISSING",
    );
    expect(withoutPartner.issues.some((issue) => issue.message.includes("partner_resistance"))).toBe(true);
  });

  test("8. impact equipment is not required, and is not even reachable through this method", () => {
    expect(method().requiredExerciseCapabilities).not.toContain("impact_equipment");
    expect(method().requiredExerciseCapabilities).toEqual([
      "round_structure",
      "technical_quality_observation",
      "partner_resistance",
    ]);

    // A drill declaring no impact equipment prescribes normally.
    expect(
      validateCompatibility({
        moduleId: "movement",
        methodId: METHOD_ID,
        role: "technical",
        capabilities: partnerDrillCapabilities(),
      }).compatible,
    ).toBe(true);

    // No impact intent in the intensity vocabulary either — nothing is struck.
    expect(method().allowedIntensityTypes).not.toContain("impact_intent");
    expect(profile().intensity.some((rule) => rule.type === "impact_intent")).toBe(false);
  });

  test("9. impact_limit is not required, and equipment_failure is not either", () => {
    expect(method().requiredStopConditionCategories).not.toContain("impact_limit");
    expect(method().requiredStopConditionCategories).not.toContain("equipment_failure");

    // The eight required categories, exactly.
    expect(method().requiredStopConditionCategories).toEqual([
      "technical_failure",
      "coordination_loss",
      "balance_loss",
      "intensity_limit",
      "pain",
      "acute_symptom",
      "manual_termination",
      "completion",
    ]);
  });

  test("10. no wall is required generically", () => {
    // Nothing in the method, the profile or the doctrine mentions a wall or
    // a cage: that is one member's own constraint, carried by its own
    // ExerciseDefinition, never by this foundation.
    expect(method().requiredExerciseCapabilities.join(" ")).not.toMatch(/wall|cage/i);
    const doctrine = docSection(MODULE_PROFILES, "## Partner Grappling Rounds");
    expect(doctrine).not.toMatch(/\bwall\b|\bcage\b/i);
    expect(JSON.stringify(profile())).not.toMatch(/wall|cage/i);

    // A drill declaring no equipment at all is compatible.
    expect(
      validateCompatibility({
        moduleId: "movement",
        methodId: METHOD_ID,
        role: "technical",
        capabilities: partnerDrillCapabilities({ requiredEquipmentCapabilities: [] }),
        availableEquipmentCapabilities: [],
      }).compatible,
    ).toBe(true);
  });

  test("11. no gi and no clothing requirement generically", () => {
    expect(method().requiredExerciseCapabilities.join(" ")).not.toMatch(/gi\b|kimono|clothing/i);
    const doctrine = docSection(MODULE_PROFILES, "## Partner Grappling Rounds");
    expect(doctrine).not.toMatch(/\bgi\b|kimono/i);
    expect(JSON.stringify(profile())).not.toMatch(/\bgi\b|kimono|clothing/i);

    // `gi` never entered the equipment vocabulary either.
    expect(EQUIPMENT_CAPABILITY_IDS as readonly string[]).not.toContain("gi");
  });
});

// -----------------------------------------------------------------------------
// 12-23. The numerical profile
// -----------------------------------------------------------------------------

describe("Partner Grappling Rounds — numerical profile", () => {
  test("12. the profile exists exactly once, on a unique triple", () => {
    expect(profile()).toBeDefined();
    expect(profile().profileId).toBe(PROFILE_ID);
    expect(profile().version).toBe("0.1");
    expect(profile().moduleId).toBe("movement");
    expect(profile().methodId).toBe(METHOD_ID);
    expect(
      NUMERICAL_PRESCRIPTION_PROFILES.filter((p) => p.profileId === PROFILE_ID),
    ).toHaveLength(1);

    // Unique triple: implicit resolution succeeds and no duplicate is created.
    const implicit = resolveNumericalProfile({
      moduleId: "movement",
      methodId: METHOD_ID,
      exerciseRole: "technical",
      explicitProfileId: null,
    });
    expect(implicit.ok).toBe(true);
    expect(implicit.ok && implicit.profile.profileId).toBe(PROFILE_ID);
    expect(
      findDuplicateProfileTriples().some(
        (duplicate) => duplicate.methodId === METHOD_ID,
      ),
    ).toBe(false);
  });

  test("13. the profile is executable", () => {
    expect(isExecutableNumericalProfile(profile())).toBe(true);
    expect(profile().intensity.length).toBeGreaterThan(0);
    expect(profile().requiresExerciseSpecificLoadRule).toBe(false);
    expect(profile().requiresSportSpecificSubtype).toBe(false);
  });

  test("14. reduced resolves to the documented floor", () => {
    const volume = resolveVolume(resolverInput("reduced"));
    expect(volume.ok).toBe(true);
    expect(volume.ok && volume.volume.rounds).toBe(3);
    expect(volume.ok && volume.volume.duration?.value).toBe(30);

    expect(betweenRoundsSeconds(resolveRest(resolverInput("reduced")))).toBe(60);
  });

  test("15. normal resolves to values every documented member of the family contains", () => {
    const volume = resolveVolume(resolverInput("normal"));
    expect(volume.ok).toBe(true);
    expect(volume.ok && volume.volume.rounds).toBe(6);
    expect(volume.ok && volume.volume.duration?.value).toBe(165);

    // The validity test Table Group 14 set for itself: the normal must fall
    // inside EVERY member's own documented range, so no chapter is
    // prescribed a normal it never documents.
    const documented = [
      { rounds: [3, 8], seconds: [120, 300] },
      { rounds: [3, 8], seconds: [120, 300] },
      { rounds: [3, 10], seconds: [30, 180] },
    ];
    for (const member of documented) {
      expect(6).toBeGreaterThanOrEqual(member.rounds[0]);
      expect(6).toBeLessThanOrEqual(member.rounds[1]);
      expect(165).toBeGreaterThanOrEqual(member.seconds[0]);
      expect(165).toBeLessThanOrEqual(member.seconds[1]);
    }

    expect(betweenRoundsSeconds(resolveRest(resolverInput("normal")))).toBe(120);
  });

  test("16. high resolves to the documented ceiling", () => {
    const volume = resolveVolume(resolverInput("high"));
    expect(volume.ok).toBe(true);
    expect(volume.ok && volume.volume.rounds).toBe(10);
    expect(volume.ok && volume.volume.duration?.value).toBe(300);

    expect(betweenRoundsSeconds(resolveRest(resolverInput("high")))).toBe(180);
  });

  test("17. rounds are the UNION of the three documented ranges, and the intersection is non-empty", () => {
    expect(profile().volume.rounds).toEqual({ min: 3, normal: 6, max: 10 });

    // union of 3–8, 3–8 and 3–10
    expect(profile().volume.rounds!.min).toBe(Math.min(3, 3, 3));
    expect(profile().volume.rounds!.max).toBe(Math.max(8, 8, 10));

    // Integer Resolution: midpoint of 3–10 is 6.5, rounded down.
    expect(profile().volume.rounds!.normal).toBe(Math.floor((3 + 10) / 2));

    // A single profile is legitimate only because all three overlap.
    expect(Math.max(3, 3, 3)).toBeLessThanOrEqual(Math.min(8, 8, 10));
  });

  test("18. round duration is per_round, in seconds, spanning the three documented windows", () => {
    expect(profile().volume.duration).toEqual({
      type: "fixed_range",
      range: { min: 30, normal: 165, max: 300, unit: "seconds" },
      scope: "per_round",
    });

    // union of 120–300, 120–300 and 30–180, midpoint 165
    expect(profile().volume.duration!.range.min).toBe(Math.min(120, 120, 30));
    expect(profile().volume.duration!.range.max).toBe(Math.max(300, 300, 180));
    expect(profile().volume.duration!.range.normal).toBe((30 + 300) / 2);

    // Non-empty intersection: 120–180 seconds.
    expect(Math.max(120, 120, 30)).toBeLessThanOrEqual(Math.min(300, 300, 180));
  });

  test("19. intensity is technical_effort only — no RPE, no RIR, no dosed partner resistance", () => {
    expect(profile().intensity).toHaveLength(1);
    expect(profile().intensity[0]).toMatchObject({
      type: "technical_effort",
      value: "high_quality",
    });

    for (const forbidden of ["rpe", "rir", "resistance_category", "impact_intent", "movement_intent"]) {
      expect(profile().intensity.some((rule) => rule.type === forbidden)).toBe(false);
    }

    const intensity = resolveIntensity({
      ...resolverInput("normal"),
      supportedIntensityTypes: ["technical_effort"],
    });
    expect(intensity.ok).toBe(true);
    expect(intensity.ok && intensity.selectedRuleType).toBe("technical_effort");
    expect(intensity.ok && intensity.intensity.primaryMetric.target).toEqual({
      type: "category",
      value: "high_quality",
    });

    // Partner resistance is a stop condition, never a number. The doctrine
    // says so, and no invented scale entered the vocabulary.
    expect(flatten(docSection(MODULE_PROFILES, "## Partner Grappling Rounds"))).toContain(
      "Resistance is the defining variable of this method and CAS does not dose it",
    );
    expect(JSON.stringify(profile())).not.toContain("controlled_resistance");
    expect(JSON.stringify(profile())).not.toContain("progressive_partner_resistance");
  });

  test("20. rest is required, scoped between rounds, and sourced to the new doctrine — never to a chapter", () => {
    expect(method().restPolicy).toBe("required");
    expect(profile().rest).not.toBeNull();
    expect(profile().rest!.scope).toBe("between_rounds");
    expect(profile().rest!.seconds).toEqual({ min: 60, normal: 120, max: 180 });

    // Its own rule id, so the one value no chapter documents is traceable
    // to the engineering decision that created it.
    expect(profile().rest!.sourceRuleIds).toContain("MOVEMENT_PARTNER_GRAPPLING_REST_V0_1");
    expect(profile().sourceRuleIds).toContain("MOVEMENT_PARTNER_GRAPPLING_REST_V0_1");

    // Not attributed to any exercise chapter.
    for (const drill of FUTURE_DRILLS) {
      expect(profile().rest!.sourceRuleIds.join(" ")).not.toContain(drill);
    }

    // Not Table Group 9's striking band.
    const striking = getNumericalPrescriptionProfileById("combat_technical_rounds_v0_1")!.rest!.seconds!;
    expect(striking).toEqual({ min: 60, normal: 60, max: 120 });
    expect(profile().rest!.seconds).not.toEqual(striking);

    // And the doctrine states plainly that this is an engineering decision.
    expect(flatten(docSection(MODULE_PROFILES, "## Partner Grappling Rounds"))).toContain(
      "This band is an engineering decision made here, and it is stated as one",
    );
  });

  test("21. tempo is forbidden by the method and absent from the profile", () => {
    expect(method().tempoPolicy).toBe("forbidden");
    expect(method().allowedTempoTypes).toEqual([]);
    expect(profile().tempo).toBeNull();

    const tempo = resolveTempo({ ...resolverInput("normal"), supportedTempoTypes: [] });
    expect(tempo.ok).toBe(true);
    expect(tempo.ok && tempo.tempo).toBeNull();
  });

  test("22. minimumDose is the floor of both dimensions and nothing else", () => {
    expect(profile().minimumDose).toEqual({
      sets: null,
      repetitions: null,
      durationSeconds: 30,
      distanceMeters: null,
      rounds: 3,
      workIntervals: null,
    });
    expect(method().minimumDoseRuleId).toBe("MIN_DOSE_PARTNER_GRAPPLING_ROUNDS_V0_1");
  });

  test("23. maximumDose is the ceiling of both dimensions and nothing else", () => {
    expect(profile().maximumDose).toEqual({
      sets: null,
      repetitions: null,
      durationSeconds: 300,
      distanceMeters: null,
      rounds: 10,
      workIntervals: null,
    });
    expect(method().maximumDoseRuleId).toBe("MAX_DOSE_PARTNER_GRAPPLING_ROUNDS_V0_1");
  });

  test("24. every sourceRuleId on the method and the profile is real", () => {
    expect(method().sourceRuleIds).toEqual([
      "31_TRAINING_METHOD_CATALOGUE_V0_1",
      "32_MODULE_PRESCRIPTION_PROFILES_V0_1",
      "34_NUMERICAL_PRESCRIPTION_TABLES_V0_1",
    ]);
    expect(profile().sourceRuleIds).toEqual([
      "34_NUMERICAL_PRESCRIPTION_TABLES_V0_1",
      "MOVEMENT_PARTNER_GRAPPLING_REST_V0_1",
    ]);

    // Every documentary id points at a file that exists and that carries the
    // section it is cited for.
    expect(readDoc(METHOD_CATALOGUE)).toContain("# Method 10 — Partner Grappling Rounds");
    expect(readDoc(MODULE_PROFILES)).toContain("## Partner Grappling Rounds");
    expect(readDoc(TABLES)).toContain("# Table Group 18 — Partner Grappling Rounds");
    expect(readDoc(MODULE_PROFILES)).toContain("MOVEMENT_PARTNER_GRAPPLING_REST_V0_1");

    for (const rule of profile().intensity) {
      expect(rule.sourceRuleIds.length).toBeGreaterThan(0);
    }
  });
});

// -----------------------------------------------------------------------------
// 25-28. Stop conditions, validation, determinism, immutability
// -----------------------------------------------------------------------------

describe("Partner Grappling Rounds — stop conditions and resolver behaviour", () => {
  test("25. the eight required categories resolve, all round- or exercise-scoped, none set-scoped", () => {
    const resolution = resolveStopConditions({
      methodId: METHOD_ID,
      requiredExerciseStopConditionIds: stopConditionDefinitions().map((d) => d.conditionId),
      definitions: stopConditionDefinitions(),
    });

    expect(resolution.ok).toBe(true);
    if (!resolution.ok) return;

    expect(resolution.stopConditions).toHaveLength(8);
    expect(new Set(resolution.stopConditions.map((c) => c.category))).toEqual(
      new Set(method().requiredStopConditionCategories),
    );

    // `rounds_duration` forbids sets, so no condition may name a set
    // boundary. This is the defect `intervalPaceLossCondition` documents,
    // applied to rounds.
    for (const condition of resolution.stopConditions) {
      expect(["round", "exercise"], condition.conditionId).toContain(condition.scope);
      expect(condition.action).not.toBe("end_set");
    }

    // The three newly activated categories carry their documented shapes.
    const byCategory = new Map(resolution.stopConditions.map((c) => [c.category, c]));
    expect(byCategory.get("coordination_loss")).toMatchObject({
      scope: "round",
      action: "end_round",
      priority: "high",
      recoverability: "recoverable_same_exercise",
    });
    expect(byCategory.get("intensity_limit")).toMatchObject({
      scope: "round",
      action: "end_round",
      priority: "medium",
      recoverability: "recoverable_after_adjustment",
    });
    expect(byCategory.get("manual_termination")).toMatchObject({
      scope: "round",
      action: "end_round",
      priority: "high",
      recoverability: "recoverable_after_adjustment",
    });
    expect(byCategory.get("manual_termination")!.trigger.evaluationTiming).toBe("continuous");

    // And 28_STOP_CONDITIONS.md moved them out of the inert list.
    const future = docSection(STOP_CONDITIONS, "# Future Stop Condition Extensions");
    for (const activated of ["coordination_loss", "intensity_limit", "manual_termination"]) {
      expect(future, activated).not.toContain(activated);
    }
    expect(readDoc(STOP_CONDITIONS)).toContain("# Round-Scoped Factories and the Partner Grappling Method");
  });

  test("26. a missing required category fails resolution deterministically", () => {
    const withoutManualTermination = stopConditionDefinitions().filter(
      (definition) => definition.category !== "manual_termination",
    );

    const resolution = resolveStopConditions({
      methodId: METHOD_ID,
      requiredExerciseStopConditionIds: withoutManualTermination.map((d) => d.conditionId),
      definitions: withoutManualTermination,
    });

    expect(resolution.ok).toBe(false);
    expect(resolution.ok === false && resolution.failureCode).toBe("STOP_CONDITION_CATEGORY_MISSING");
    expect(resolution.ok === false && resolution.missingCategories).toContain("manual_termination");
  });

  test("27. resolution is deterministic across every range context", () => {
    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      expect(resolveVolume(resolverInput(rangeContext))).toEqual(resolveVolume(resolverInput(rangeContext)));
      expect(resolveRest(resolverInput(rangeContext))).toEqual(resolveRest(resolverInput(rangeContext)));
      expect(
        resolveIntensity({ ...resolverInput(rangeContext), supportedIntensityTypes: ["technical_effort"] }),
      ).toEqual(
        resolveIntensity({ ...resolverInput(rangeContext), supportedIntensityTypes: ["technical_effort"] }),
      );
      expect(resolveTempo({ ...resolverInput(rangeContext), supportedTempoTypes: [] })).toEqual(
        resolveTempo({ ...resolverInput(rangeContext), supportedTempoTypes: [] }),
      );
    }
  });

  test("28. resolving never mutates the profile or the method contract", () => {
    const profileSnapshot = JSON.stringify(profile());
    const methodSnapshot = JSON.stringify(method());
    const moduleSnapshot = JSON.stringify(getModulePrescriptionContract("movement"));

    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      resolveVolume(resolverInput(rangeContext));
      resolveRest(resolverInput(rangeContext));
      resolveIntensity({ ...resolverInput(rangeContext), supportedIntensityTypes: ["technical_effort"] });
      resolveTempo({ ...resolverInput(rangeContext), supportedTempoTypes: [] });
    }
    resolveStopConditions({
      methodId: METHOD_ID,
      requiredExerciseStopConditionIds: stopConditionDefinitions().map((d) => d.conditionId),
      definitions: stopConditionDefinitions(),
    });

    expect(JSON.stringify(profile())).toBe(profileSnapshot);
    expect(JSON.stringify(method())).toBe(methodSnapshot);
    expect(JSON.stringify(getModulePrescriptionContract("movement"))).toBe(moduleSnapshot);
  });
});

// -----------------------------------------------------------------------------
// 29-35. Genericity and non-regression
// -----------------------------------------------------------------------------

describe("Partner Grappling Rounds — genericity and non-regression", () => {
  test("29. no ExerciseId appears in the profile, the method or the doctrine", () => {
    const surfaces = {
      profile: JSON.stringify(profile()),
      method: JSON.stringify(method()),
      moduleContract: JSON.stringify(getModulePrescriptionContract("movement")),
      doctrine: docSection(MODULE_PROFILES, "## Partner Grappling Rounds"),
      methodCatalogue: docSection(METHOD_CATALOGUE, "# Method 10 — Partner Grappling Rounds"),
    };

    for (const [surface, text] of Object.entries(surfaces)) {
      for (const exerciseId of PILOT_EXERCISE_IDS) {
        expect(text, `${surface} / ${exerciseId}`).not.toContain(exerciseId);
      }
      for (const drill of FUTURE_DRILLS) {
        expect(text, `${surface} / ${drill}`).not.toContain(drill);
      }
    }
  });

  test("30. the method and profile are consumed by exactly the three drills they were built for — and by nothing else", () => {
    // This assertion was "no registry entry was added — the registry stays at
    // 71" while the foundation shipped alone. Registry Lot 20 consumed the
    // foundation, which is what it was for; what still has to hold is that
    // NOTHING ELSE moved onto the new method or the new profile.
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(74);
    expect(PILOT_EXERCISE_IDS).toHaveLength(74);

    for (const drill of FUTURE_DRILLS) {
      expect(PILOT_EXERCISE_IDS as readonly string[]).toContain(drill);
      expect(EXERCISE_PRESCRIPTION_REGISTRY).toHaveProperty(drill);
    }

    const onMethod = Object.values(EXERCISE_PRESCRIPTION_REGISTRY).filter(
      (entry) => entry.explicitMethodId === METHOD_ID,
    );
    const onProfile = Object.values(EXERCISE_PRESCRIPTION_REGISTRY).filter(
      (entry) => entry.numericalProfileId === PROFILE_ID,
    );
    expect(onMethod.map((entry) => entry.exerciseId)).toEqual([...FUTURE_DRILLS]);
    expect(onProfile.map((entry) => entry.exerciseId)).toEqual([...FUTURE_DRILLS]);

    // No pre-existing entry declared support for the new method.
    for (const entry of Object.values(EXERCISE_PRESCRIPTION_REGISTRY)) {
      if ((FUTURE_DRILLS as readonly string[]).includes(entry.exerciseId)) continue;
      expect(entry.capabilities.supportedMethodIds as readonly string[]).not.toContain(METHOD_ID);
      expect(entry.numericalProfileId).not.toBe(PROFILE_ID);
    }
  });

  test("31. the knowledge base stays at 76 ExerciseDefinitions, and the three drills keep their partner requirement", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toHaveLength(76);

    for (const drill of FUTURE_DRILLS) {
      const definition = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === drill);
      expect(definition, drill).toBeDefined();
      expect(definition!.module).toBe("movement");
      // The KB already gates on a partner; this lot did not touch it.
      expect(JSON.stringify(definition!.requirements)).toContain("human_assistance");
      expect(JSON.stringify(definition!.requirements)).toContain("partner");
    }
  });

  test("32. the foundation added no equipment identifier — the one later addition is wall_wrestling's, not the method's", () => {
    expect(EQUIPMENT_CAPABILITY_IDS).toHaveLength(32);
    // The method requires a PERSON, and a person is not an implement: no
    // generic "partner" identifier exists in the equipment vocabulary, and
    // the foundation added none. Registry Lot 20 added exactly one id,
    // `usable_wall`, and it belongs to one exercise's environment rather
    // than to this method — pummeling and grip_fighting require no equipment
    // at all.
    for (const id of EQUIPMENT_CAPABILITY_IDS) {
      expect(id).not.toContain("partner");
    }
  });

  test("33. no resolver branches on this method, this profile or a partner drill", () => {
    const resolvers = [
      "resolveVolume.ts",
      "resolveIntensity.ts",
      "resolveRest.ts",
      "resolveTempo.ts",
      "resolveMethod.ts",
      "resolveStopConditions.ts",
      "resolveInstructions.ts",
      "prescribeExercise.ts",
      "validatePrescription.ts",
      "validateCompatibility.ts",
    ];

    for (const resolver of resolvers) {
      const source = readDoc(`../../prescription/${resolver}`);
      expect(source, `${resolver} / ${METHOD_ID}`).not.toContain(METHOD_ID);
      expect(source, `${resolver} / ${PROFILE_ID}`).not.toContain(PROFILE_ID);
      for (const drill of FUTURE_DRILLS) {
        expect(source, `${resolver} / ${drill}`).not.toContain(drill);
      }
    }
  });

  test("34. combat_rounds and its profile are unchanged, and every other method contract is intact", () => {
    expect(TRAINING_METHOD_CONTRACTS.combat_rounds).toEqual({
      methodId: "combat_rounds",
      name: "Combat Rounds",
      family: "combat_rounds",
      version: "0.1",
      status: "documented",
      supportedModules: ["power", "conditioning"],
      supportedRoles: ["technical", "conditioning", "primary", "secondary"],
      volumeStructure: "rounds_duration",
      requiredVolumeFields: ["rounds", "duration"],
      optionalVolumeFields: ["laterality"],
      forbiddenVolumeFields: ["sets", "repetitions", "distance", "work_intervals"],
      allowedIntensityTypes: [
        "technical_effort",
        "impact_intent",
        "rpe",
        "heart_rate",
        "movement_intent",
        "pace",
      ],
      requiredIntensityTypes: [],
      restPolicy: "required",
      tempoPolicy: "forbidden",
      allowedTempoTypes: [],
      stopConditionPolicy: "required",
      requiredStopConditionCategories: [
        "technical_failure",
        "coordination_loss",
        "balance_loss",
        "impact_limit",
        "equipment_failure",
        "pain",
        "acute_symptom",
        "completion",
      ],
      requiredExerciseCapabilities: [
        "round_structure",
        "technical_quality_observation",
        "impact_equipment",
      ],
      minimumDoseRuleId: "MIN_DOSE_COMBAT_ROUNDS_V0_1",
      maximumDoseRuleId: "MAX_DOSE_COMBAT_ROUNDS_V0_1",
      sourceRuleIds: [
        "31_TRAINING_METHOD_CATALOGUE_V0_1",
        "34_NUMERICAL_PRESCRIPTION_TABLES_V0_1",
      ],
    });

    // combat_technical_rounds_v0_1 keeps its own numbers.
    const striking = getNumericalPrescriptionProfileById("combat_technical_rounds_v0_1")!;
    expect(striking.volume.rounds).toEqual({ min: 2, normal: 3, max: 5 });
    expect(striking.volume.duration!.range).toEqual({ min: 60, normal: 120, max: 180, unit: "seconds" });

    // Exactly one method and one profile were added.
    expect(TRAINING_METHOD_IDS).toHaveLength(10);
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(23);
  });

  test("35. the whole registry still validates, and every previously resolvable triple still resolves", () => {
    expect(
      validatePilotRegistry().filter((issue) => issue.code !== "UNRESOLVED_DURATION_PROFILE"),
    ).toEqual([]);

    for (const otherProfile of NUMERICAL_PRESCRIPTION_PROFILES) {
      const resolution = resolveNumericalProfile({
        moduleId: otherProfile.moduleId,
        methodId: otherProfile.methodId,
        exerciseRole: otherProfile.exerciseRole,
        explicitProfileId: otherProfile.profileId,
      });
      expect(resolution.ok, otherProfile.profileId).toBe(true);
    }

    // The new profile introduced no ambiguity anywhere.
    expect(findDuplicateProfileTriples().map((duplicate) => duplicate.methodId)).not.toContain(METHOD_ID);
  });
});
