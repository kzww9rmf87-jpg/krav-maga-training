/**
 * Combat Athlete System — Registry Lot 20: pummeling, wall_wrestling, grip_fighting
 *
 * The three entries the Partner Grappling Rounds foundation was built for,
 * and the first entries in the registry whose required resistance is a
 * PERSON rather than an implement.
 *
 * What this file guards beyond presence:
 *
 * - that the partner is mandatory on every layer that can express it — the
 *   method contract, the entry's capability tags and the knowledge base's own
 *   eligibility gate — and is NOT expressed as an equipment identifier,
 *   because a human being does not belong in the implement vocabulary;
 * - that each entry narrows Table Group 18's union envelope back to its own
 *   chapter's Loading Profile, and that the generic resolvers compute the
 *   intersection rather than any entry restating it;
 * - that nothing was required generically that only one chapter or one
 *   variation documents: no impact equipment anywhere, no gi (grip fighting
 *   documents gi AND no-gi forms as equals), no wall except for the one
 *   chapter that names it Required;
 * - that partner resistance stays UNDOSED — carried by a stop condition,
 *   never by an intensity value;
 * - that the foundation itself comes out of this lot unchanged.
 */

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import {
  EXERCISE_KNOWLEDGE_BASE,
  GRIP_FIGHTING,
  PUMMELING,
  WALL_WRESTLING,
} from "../../exerciseKnowledgeBase";
import { checkExerciseEligibility } from "../../exerciseSelector";
import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  getExercisePrescriptionSource,
  PILOT_EXERCISE_IDS,
  type PilotExerciseId,
  type PrescriptionExecutionContext,
} from "../../prescription/exercisePrescriptionRegistry";
import { prescribeExercise } from "../../prescription/prescribeExercise";
import { prescribeSession, type SessionExercisePrescriptionInput } from "../../prescription/prescribeSession";
import {
  NUMERICAL_PRESCRIPTION_PROFILES,
  getNumericalPrescriptionProfileById,
  resolveNumericalProfile,
} from "../../prescription/prescriptionKnowledge";
import { getDurationEstimationProfile } from "../../prescription/durationEstimationProfiles";
import { validatePilotRegistry } from "../../prescription/registryValidators";
import { EQUIPMENT_CAPABILITY_IDS, isEquipmentCapabilityId } from "../../prescription/equipmentCapabilities";
import { getTrainingMethodContract, TRAINING_METHOD_IDS } from "../../prescription/contracts";
import { adaptExercisePrescriptionResult } from "../../prescription/prescriptionDecisionTrace";
import type { ExercisePrescriptionSource } from "../../prescription/buildPrescriptionInput";

import { runEngine } from "../../index";
import {
  makeAthleteProfile,
  makeEnvironment,
  makeExercise,
  makeReadiness,
  makeRequest,
  makeValidInput,
} from "../fixtures";

const METHOD_ID = "partner_grappling_rounds";
const PROFILE_ID = "partner_grappling_rounds_technical_v0_1";

/**
 * Each drill with the bounds its own chapter documents and the values those
 * bounds produce once intersected with Table Group 18's envelope (3-10
 * rounds, 30-300 s, rest 60/120/180 s).
 *
 * Written out rather than computed, so that a resolver-side change to the
 * intersection would fail here loudly instead of silently agreeing with
 * itself.
 */
const PUMMELING_DRILL = {
  id: "pummeling",
  chapter: "50-exercises/31_PUMMELING",
  definition: PUMMELING,
  documented: { rounds: [3, 8], seconds: [120, 300] },
  requiredEquipment: [] as readonly string[],
  expected: {
    reduced: { rounds: 3, seconds: 120, rest: 60 },
    normal: { rounds: 6, seconds: 165, rest: 120 },
    high: { rounds: 8, seconds: 300, rest: 180 },
  },
} as const;

const WALL_WRESTLING_DRILL = {
  id: "wall_wrestling",
  chapter: "50-exercises/32_WALL_WRESTLING",
  definition: WALL_WRESTLING,
  documented: { rounds: [3, 8], seconds: [120, 300] },
  requiredEquipment: ["usable_wall"] as readonly string[],
  expected: {
    reduced: { rounds: 3, seconds: 120, rest: 60 },
    normal: { rounds: 6, seconds: 165, rest: 120 },
    high: { rounds: 8, seconds: 300, rest: 180 },
  },
} as const;

const GRIP_FIGHTING_DRILL = {
  id: "grip_fighting",
  chapter: "50-exercises/33_GRIP_FIGHTING",
  definition: GRIP_FIGHTING,
  documented: { rounds: [3, 10], seconds: [30, 180] },
  requiredEquipment: [] as readonly string[],
  expected: {
    reduced: { rounds: 3, seconds: 30, rest: 60 },
    normal: { rounds: 6, seconds: 165, rest: 120 },
    high: { rounds: 10, seconds: 180, rest: 180 },
  },
} as const;

const DRILLS = [PUMMELING_DRILL, WALL_WRESTLING_DRILL, GRIP_FIGHTING_DRILL] as const;
const DRILL_IDS = DRILLS.map((drill) => drill.id);

const entry = (id: string) => EXERCISE_PRESCRIPTION_REGISTRY[id as PilotExerciseId];

const context = (
  id: string,
  rangeContext: PrescriptionExecutionContext["rangeContext"] = "normal",
): PrescriptionExecutionContext => ({
  rangeContext,
  athleteReferences: [],
  availableEquipmentCapabilities: entry(id).capabilities.requiredEquipmentCapabilities,
});

function prescribe(id: string, rangeContext: PrescriptionExecutionContext["rangeContext"] = "normal") {
  const sourceResult = getExercisePrescriptionSource(id, context(id, rangeContext));
  if (!sourceResult.ok) {
    throw new Error(`Expected a prescription source for "${id}", got: ${sourceResult.message}`);
  }
  const result = prescribeExercise({
    exerciseId: id,
    moduleId: sourceResult.moduleId,
    ...sourceResult.source,
  });
  if (!result.ok) {
    throw new Error(`Expected "${id}" to prescribe, failed at ${result.failureStage}: ${result.message}`);
  }
  return result;
}

const readChapter = (relative: string) =>
  readFileSync(new URL(`../../../../${relative}`, import.meta.url), "utf-8");

/**
 * The resolved between-rounds rest, as a fixed target. Table Group 18 gives a
 * single value per range context, so anything other than `type: "fixed"` here
 * is itself the failure.
 */
function betweenRoundsRest(id: string, rangeContext: PrescriptionExecutionContext["rangeContext"] = "normal") {
  const { rest } = prescribe(id, rangeContext).prescription;
  expect(rest, id).not.toBeNull();
  const target = rest!.betweenRounds;
  expect(target, id).not.toBeNull();
  if (target!.type !== "fixed") {
    throw new Error(`Expected a fixed between-rounds rest for "${id}", got "${target!.type}".`);
  }
  return { rest: rest!, target: target!.duration };
}

// -----------------------------------------------------------------------------
// 1-6. Counts, presence, additivity
// -----------------------------------------------------------------------------

describe("partner grappling drills — registry, knowledge base, profile and equipment counts", () => {
  test("1. the registry grew from 71 to exactly 74 entries", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(75);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(75);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort()).toEqual([...PILOT_EXERCISE_IDS].sort());
  });

  test("2. the knowledge base stays at 76 ExerciseDefinitions — no definition was added or edited", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toHaveLength(76);
    for (const drill of DRILLS) {
      const definition = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === drill.id);
      expect(definition, drill.id).toBe(drill.definition);
      expect(definition!.module).toBe("movement");
    }
  });

  test("3. the numerical profiles stay at 22 — this lot created none", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(23);
    expect(getNumericalPrescriptionProfileById(PROFILE_ID)).toBeDefined();
    expect(TRAINING_METHOD_IDS).toHaveLength(10);
  });

  test("4. the equipment vocabulary went from 31 to 32 — `usable_wall`, the only identifier this lot added", () => {
    expect(EQUIPMENT_CAPABILITY_IDS).toHaveLength(33);
    expect(isEquipmentCapabilityId("usable_wall")).toBe(true);

    // It mirrors the knowledge base's own EnvironmentCapability name, the
    // same convention `safe_landing_surface` already follows, and it is
    // deliberately NOT the pre-existing `wall` id — which stays exactly
    // where it was, on the two medicine-ball entries that throw at it.
    expect(isEquipmentCapabilityId("wall")).toBe(true);
    const wallUsers = PILOT_EXERCISE_IDS.filter((id) =>
      entry(id).capabilities.requiredEquipmentCapabilities.includes("wall"),
    );
    expect(wallUsers).toEqual(["med_ball_chest_pass", "med_ball_rotational_throw"]);
    expect(wallUsers).not.toContain("wall_wrestling");
  });

  test("5. the three drills exist in both the knowledge base and the registry", () => {
    for (const drill of DRILLS) {
      expect(PILOT_EXERCISE_IDS as readonly string[]).toContain(drill.id);
      expect(EXERCISE_PRESCRIPTION_REGISTRY).toHaveProperty(drill.id);
      expect(EXERCISE_KNOWLEDGE_BASE.some((exercise) => exercise.id === drill.id)).toBe(true);
      expect(entry(drill.id).capabilities.exerciseId).toBe(drill.id);
      expect(PILOT_EXERCISE_IDS.filter((id) => id === drill.id)).toHaveLength(1);
    }
  });

  test("6. no other exercise was added: the 71 previous ids plus these three account for every key", () => {
    // sled_push was added by a later lot (Registry Lot 21) and is covered by
    // its own file, so it is excluded here exactly as this lot's own three are.
    const ADDED_BY_LATER_LOTS: readonly string[] = ["sled_push"];
    const previousIds = PILOT_EXERCISE_IDS.filter(
      (id) => !(DRILL_IDS as readonly string[]).includes(id) && !ADDED_BY_LATER_LOTS.includes(id),
    );
    expect(previousIds).toHaveLength(71);
    expect([...previousIds, ...DRILL_IDS, ...ADDED_BY_LATER_LOTS].sort()).toEqual(
      Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort(),
    );

    // The one exercise still blocked on doctrine stays out.
    for (const id of ["turkish_get_up"]) {
      expect(EXERCISE_PRESCRIPTION_REGISTRY as Record<string, unknown>).not.toHaveProperty(id);
    }
  });
});

// -----------------------------------------------------------------------------
// 7-8. Method and profile, per entry
// -----------------------------------------------------------------------------

describe("partner grappling drills — method and profile selection", () => {
  test("7. each entry names Table Group 18's profile explicitly, and resolves to it", () => {
    for (const drill of DRILLS) {
      const registryEntry = entry(drill.id);
      expect(registryEntry.numericalProfileId).toBe(PROFILE_ID);

      const resolution = resolveNumericalProfile({
        moduleId: registryEntry.moduleId,
        methodId: registryEntry.explicitMethodId,
        exerciseRole: registryEntry.role,
        explicitProfileId: registryEntry.numericalProfileId ?? null,
      });
      expect(resolution.ok, drill.id).toBe(true);
      if (!resolution.ok) continue;
      expect(resolution.profile.profileId).toBe(PROFILE_ID);
    }
  });

  test("8. each entry sits on the partner grappling method, in the movement module, at the technical role", () => {
    for (const drill of DRILLS) {
      const registryEntry = entry(drill.id);
      expect(registryEntry.explicitMethodId).toBe(METHOD_ID);
      expect(registryEntry.capabilities.supportedMethodIds).toEqual([METHOD_ID]);
      expect(registryEntry.moduleId).toBe("movement");
      expect(registryEntry.role).toBe("technical");
      expect(registryEntry.capabilities.supportedVolumeStructures).toEqual(["rounds_duration"]);
    }

    // The triple is unique, so implicit resolution would already work — the
    // explicit id is an auditability convention, not a necessity here.
    const onTriple = NUMERICAL_PRESCRIPTION_PROFILES.filter(
      (profile) =>
        profile.moduleId === "movement" &&
        profile.methodId === METHOD_ID &&
        profile.exerciseRole === "technical",
    );
    expect(onTriple).toHaveLength(1);
  });
});

// -----------------------------------------------------------------------------
// 9-15. The partner, and what is NOT required
// -----------------------------------------------------------------------------

describe("partner grappling drills — the partner is mandatory, and is not equipment", () => {
  test("9. the partner is required on all three layers that can express it", () => {
    // Layer 1 — the method contract, so every future exercise inherits it.
    expect(getTrainingMethodContract(METHOD_ID).requiredExerciseCapabilities).toContain("partner_resistance");

    for (const drill of DRILLS) {
      // Layer 2 — the entry's own capability tags, which validateCompatibility
      // checks against the method.
      expect(entry(drill.id).capabilities.capabilityTags).toContain("partner_resistance");

      // Layer 3 — the knowledge base, which governs eligibility.
      const atoms = (drill.definition.requirements?.required ?? []).flatMap((clause) => clause.items);
      expect(atoms.some((atom) => atom.kind === "human_assistance" && atom.assistance === "partner")).toBe(true);
    }
  });

  test("10. an athlete with no partner is rejected at the eligibility gate, for all three", () => {
    const withPartner = makeValidInput({
      environment: makeEnvironment({ partnerAvailable: true, usableWall: true, floorSafe: true }),
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "advanced", primaryCombatSport: "krav_maga" },
      }),
    });
    const withoutPartner = makeValidInput({
      environment: makeEnvironment({ partnerAvailable: false, usableWall: true, floorSafe: true }),
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "advanced", primaryCombatSport: "krav_maga" },
      }),
    });

    for (const drill of DRILLS) {
      expect(checkExerciseEligibility(drill.definition, withPartner).eligible, drill.id).toBe(true);
      expect(checkExerciseEligibility(drill.definition, withoutPartner).eligible, drill.id).toBe(false);
    }
  });

  test("11. no impact equipment is required anywhere in this family", () => {
    for (const drill of DRILLS) {
      const registryEntry = entry(drill.id);
      expect(registryEntry.capabilities.capabilityTags).not.toContain("impact_equipment");
      for (const id of registryEntry.capabilities.requiredEquipmentCapabilities) {
        expect(id).not.toBe("heavy_bag");
        expect(id).not.toBe("medicine_ball");
        expect(id).not.toBe("slam_ball");
      }
    }

    // The method itself replaced `impact_equipment` with `partner_resistance`
    // rather than requiring both.
    expect(getTrainingMethodContract(METHOD_ID).requiredExerciseCapabilities).not.toContain("impact_equipment");
  });

  test("12. no gi is required generically — grip fighting documents gi AND no-gi as equals", () => {
    const chapter = readChapter(GRIP_FIGHTING_DRILL.chapter);
    expect(chapter).toContain("Gi Grip Fighting");
    expect(chapter).toContain("No-Gi Hand Fighting");

    for (const drill of DRILLS) {
      for (const id of entry(drill.id).capabilities.requiredEquipmentCapabilities) {
        expect(id).not.toContain("gi");
        expect(id).not.toContain("clothing");
      }
    }
    // No garment identifier exists in the vocabulary at all — none was
    // invented for this lot.
    for (const id of EQUIPMENT_CAPABILITY_IDS) {
      expect(id).not.toContain("clothing");
    }
  });

  test("13. pummeling requires no wall — 'Wall Pummeling' is one of its Variations, not its requirement", () => {
    expect(entry("pummeling").capabilities.requiredEquipmentCapabilities).toEqual([]);
    const chapter = readChapter(PUMMELING_DRILL.chapter);
    expect(chapter).toContain("Wall Pummeling");
    expect(chapter).toContain("Required\n\nTraining Partner");

    const atoms = (PUMMELING.requirements?.required ?? []).flatMap((clause) => clause.items);
    expect(atoms.some((atom) => atom.kind === "environment")).toBe(false);
  });

  test("14. wall_wrestling requires the wall — the one chapter that names it Required", () => {
    expect(entry("wall_wrestling").capabilities.requiredEquipmentCapabilities).toEqual(["usable_wall"]);
    expect(readChapter(WALL_WRESTLING_DRILL.chapter)).toContain("Wall or MMA Cage");

    // The registry mirrors the knowledge base's own atom, name for name.
    const atoms = (WALL_WRESTLING.requirements?.required ?? []).flatMap((clause) => clause.items);
    expect(atoms.some((atom) => atom.kind === "environment" && atom.capability === "usable_wall")).toBe(true);

    // And the prescription genuinely gates on it.
    const withoutWall = getExercisePrescriptionSource("wall_wrestling", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: [],
    });
    expect(withoutWall.ok).toBe(false);
  });

  test("15. grip_fighting requires no wall — 'Wall Grip Fighting' is one of its Variations", () => {
    expect(entry("grip_fighting").capabilities.requiredEquipmentCapabilities).toEqual([]);
    expect(readChapter(GRIP_FIGHTING_DRILL.chapter)).toContain("Wall Grip Fighting");

    const atoms = (GRIP_FIGHTING.requirements?.required ?? []).flatMap((clause) => clause.items);
    expect(atoms.some((atom) => atom.kind === "environment")).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// 16-26. The numbers, in all three range contexts
// -----------------------------------------------------------------------------

describe("partner grappling drills — resolved volume and rest in every range context", () => {
  for (const drill of DRILLS) {
    for (const rangeContext of ["reduced", "normal", "high"] as const) {
      test(`${drill.id} — ${rangeContext}`, () => {
        const expected = drill.expected[rangeContext];
        const { volume } = prescribe(drill.id, rangeContext).prescription;

        expect(volume.structure).toBe("rounds_duration");
        expect(volume.rounds).toBe(expected.rounds);
        expect(volume.duration).toEqual({
          value: expected.seconds,
          unit: "seconds",
          scope: "per_round",
        });
        expect(betweenRoundsRest(drill.id, rangeContext).target.value).toBe(expected.rest);

        // The structure forbids every other volume field, and none appears.
        expect(volume.sets).toBeNull();
        expect(volume.reps).toBeNull();
        expect(volume.distance).toBeNull();
        expect(volume.workIntervals).toBeNull();
      });
    }
  }

  test("25. rounds narrow to each chapter's own documented count", () => {
    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.volume.rounds).toEqual({ min: 3, normal: 6, max: 10 });

    for (const drill of DRILLS) {
      const [min, max] = drill.documented.rounds;
      expect(entry(drill.id).exerciseDoseConstraints?.minimumDose?.rounds).toBe(min);
      expect(entry(drill.id).exerciseDoseConstraints?.maximumDose?.rounds).toBe(max);

      // The RESOLVED values are the intersection, computed generically.
      expect(prescribe(drill.id, "reduced").prescription.volume.rounds).toBe(min);
      expect(prescribe(drill.id, "high").prescription.volume.rounds).toBe(max);
    }

    // The two clinch drills genuinely lose the profile's 9th and 10th round;
    // grip fighting keeps them, because its own chapter documents 10.
    expect(prescribe("pummeling", "high").prescription.volume.rounds).toBe(8);
    expect(prescribe("grip_fighting", "high").prescription.volume.rounds).toBe(10);
  });

  test("26. round duration narrows to each chapter's own documented seconds", () => {
    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.volume.duration!.range).toEqual({ min: 30, normal: 165, max: 300, unit: "seconds" });

    for (const drill of DRILLS) {
      const [min, max] = drill.documented.seconds;
      expect(entry(drill.id).exerciseDoseConstraints?.minimumDose?.durationSeconds).toBe(min);
      expect(entry(drill.id).exerciseDoseConstraints?.maximumDose?.durationSeconds).toBe(max);

      expect(prescribe(drill.id, "reduced").prescription.volume.duration?.value).toBe(min);
      expect(prescribe(drill.id, "high").prescription.volume.duration?.value).toBe(max);
    }

    // Narrowing moves in both directions across the family: the clinch drills
    // lose the short rounds, grip fighting loses the long ones.
    expect(prescribe("pummeling", "reduced").prescription.volume.duration?.value).toBe(120);
    expect(prescribe("grip_fighting", "high").prescription.volume.duration?.value).toBe(180);
  });
});

// -----------------------------------------------------------------------------
// 27-35. Intensity, rest, tempo, loading, laterality, interpretation
// -----------------------------------------------------------------------------

describe("partner grappling drills — intensity, rest, tempo and volume semantics", () => {
  test("27. intensity is technical_effort: high_quality, and nothing else", () => {
    for (const drill of DRILLS) {
      const registryEntry = entry(drill.id);
      expect(registryEntry.supportedIntensityTypes).toEqual(["technical_effort"]);
      expect(registryEntry.preferredIntensityType).toBe("technical_effort");
      expect(registryEntry.capabilities.supportedIntensityTypes).toEqual(["technical_effort"]);
      expect(registryEntry.capabilities.preferredIntensityTypes).toEqual(["technical_effort"]);

      const { intensity } = prescribe(drill.id).prescription;
      expect(intensity.primaryMetric.type).toBe("technical_effort");
      expect(intensity.primaryMetric.target).toEqual({ type: "category", value: "high_quality" });
      expect(intensity.secondaryMetrics).toEqual([]);

      // Nothing narrows, because the profile carries exactly one rule.
      expect(registryEntry.exerciseIntensityConstraints).toBeNull();
    }
  });

  test("28. no RPE and no RIR is declared, and neither appears in any of the three chapters", () => {
    for (const drill of DRILLS) {
      expect(entry(drill.id).supportedIntensityTypes).not.toContain("rpe");
      expect(entry(drill.id).supportedIntensityTypes).not.toContain("rir");
      expect(prescribe(drill.id).prescription.intensity.primaryMetric.type).not.toBe("rpe");

      const chapter = readChapter(drill.chapter);
      expect(chapter).not.toContain("RPE");
      expect(chapter).not.toContain("repetitions in reserve");
    }
  });

  test("29. movement_intent is not declared, although the method allows it", () => {
    // The method permits it; the profile and every entry decline it, because
    // two chapters say "Explosive" and the third prioritizes quality over
    // speed. A generic reading cannot satisfy all three.
    expect(getTrainingMethodContract(METHOD_ID).allowedIntensityTypes).toContain("movement_intent");

    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.intensity.map((rule) => rule.type)).toEqual(["technical_effort"]);

    for (const drill of DRILLS) {
      expect(entry(drill.id).supportedIntensityTypes).not.toContain("movement_intent");
      expect(prescribe(drill.id).prescription.intensity.primaryMetric.type).not.toBe("movement_intent");
    }

    expect(readChapter(WALL_WRESTLING_DRILL.chapter)).toContain("Explosive");
    expect(readChapter(PUMMELING_DRILL.chapter)).toContain("Movement quality is prioritized over speed.");
  });

  test("30. rest is scoped between_rounds, unnarrowed, and sourced to doctrine rather than to a chapter", () => {
    for (const drill of DRILLS) {
      // No chapter documents inter-round rest, so there is nothing to narrow.
      expect(entry(drill.id).exerciseRestConstraints).toBeNull();

      const { rest, target } = betweenRoundsRest(drill.id);
      expect(target.scope).toBe("between_rounds");
      expect(rest.betweenSets).toBeNull();
      expect(rest.betweenIntervals).toBeNull();

      // The one value no chapter supports is individually traceable.
      expect(rest.sourceRuleIds).toContain("MOVEMENT_PARTNER_GRAPPLING_REST_V0_1");
    }

    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.rest!.seconds).toEqual({ min: 60, normal: 120, max: 180 });
  });

  test("31. tempo is null — the method forbids it and no entry declares one", () => {
    expect(getTrainingMethodContract(METHOD_ID).tempoPolicy).toBe("forbidden");
    for (const drill of DRILLS) {
      expect(entry(drill.id).supportedTempoTypes).toEqual([]);
      expect(entry(drill.id).preferredTempoType).toBeNull();
      expect(entry(drill.id).capabilities.supportedTempoTypes).toEqual([]);
      expect(prescribe(drill.id).prescription.tempo).toBeNull();
    }
  });

  test("32. the loading mode is partner_resistance — never bodyweight, never an implement", () => {
    for (const drill of DRILLS) {
      expect(entry(drill.id).capabilities.supportedLoadingModes).toEqual(["partner_resistance"]);
    }

    // And no generic "partner" identifier was smuggled into the equipment
    // vocabulary to satisfy the no-equipment validator rule.
    for (const id of EQUIPMENT_CAPABILITY_IDS) {
      expect(id).not.toContain("partner");
    }
    expect(isEquipmentCapabilityId("partner")).toBe(false);
  });

  test("33. laterality is not_applicable, and the method forbids the field reaching the volume", () => {
    expect(getTrainingMethodContract(METHOD_ID).forbiddenVolumeFields).toContain("laterality");

    for (const drill of DRILLS) {
      expect(entry(drill.id).capabilities.laterality).toBe("not_applicable");
      // The method outranks the declaration: the resolved volume carries null
      // rather than a value the prescription is not allowed to hold.
      expect(prescribe(drill.id).prescription.volume.laterality).toBeNull();
    }
  });

  test("34. the volume interpretation is round_total for all three", () => {
    for (const drill of DRILLS) {
      expect(entry(drill.id).capabilities.volumeInterpretations).toEqual(["round_total"]);
    }
  });

  test("35. nothing is multiplied: the resolved rounds are the prescribed rounds", () => {
    for (const drill of DRILLS) {
      for (const rangeContext of ["reduced", "normal", "high"] as const) {
        const expected = drill.expected[rangeContext];
        const { volume } = prescribe(drill.id, rangeContext).prescription;
        // A round count is a total. It is never doubled for two athletes,
        // never multiplied by a side, and never folded into the duration.
        expect(volume.rounds).toBe(expected.rounds);
        expect(volume.duration?.value).toBe(expected.seconds);
        expect(volume.duration?.scope).toBe("per_round");
      }
    }
  });
});

// -----------------------------------------------------------------------------
// 36-38. Stop conditions
// -----------------------------------------------------------------------------

describe("partner grappling drills — stop conditions", () => {
  test("36. each entry declares exactly the eight categories the method requires", () => {
    const required = getTrainingMethodContract(METHOD_ID).requiredStopConditionCategories;
    expect(required).toHaveLength(8);

    for (const drill of DRILLS) {
      const conditions = entry(drill.id).stopConditionDefinitions;
      expect(conditions, drill.id).toHaveLength(8);

      const categories = conditions.map((condition) => condition.category).sort();
      expect(categories).toEqual([...required].sort());

      // Every declared id is listed on the capabilities, and vice versa.
      expect(conditions.map((condition) => condition.conditionId).sort()).toEqual(
        [...entry(drill.id).capabilities.requiredStopConditionIds].sort(),
      );

      // All of them survive resolution.
      expect(prescribe(drill.id).prescription.stopConditions).toHaveLength(8);
    }
  });

  test("37. impact_limit is declared nowhere — there is no impact to limit", () => {
    for (const drill of DRILLS) {
      const categories = entry(drill.id).stopConditionDefinitions.map((condition) => condition.category);
      expect(categories).not.toContain("impact_limit");
    }
    expect(getTrainingMethodContract(METHOD_ID).requiredStopConditionCategories).not.toContain("impact_limit");
  });

  test("38. equipment_failure and range_of_motion_loss are declared nowhere — no chapter documents either", () => {
    for (const drill of DRILLS) {
      const categories = entry(drill.id).stopConditionDefinitions.map((condition) => condition.category);
      expect(categories).not.toContain("equipment_failure");
      // The movement module lists range_of_motion_loss, but module-level
      // categories are not enforced and none of the three chapters documents
      // a range-of-motion concern — the same discipline towel_pull_up applied
      // to balance_loss.
      expect(categories).not.toContain("range_of_motion_loss");
    }
  });

  test("the round-scoped family is used, so no condition names a boundary the structure lacks", () => {
    for (const drill of DRILLS) {
      for (const condition of entry(drill.id).stopConditionDefinitions) {
        // `rounds_duration` forbids sets: nothing may be set-scoped.
        expect(condition.scope, `${drill.id}/${condition.conditionId}`).not.toBe("set");
        expect(condition.action, `${drill.id}/${condition.conditionId}`).not.toBe("end_set");
        expect(["round", "exercise"]).toContain(condition.scope);
      }
    }
  });

  test("partner resistance is carried as a stop condition, never as a dosed value", () => {
    for (const drill of DRILLS) {
      const condition = entry(drill.id).stopConditionDefinitions.find(
        (candidate) => candidate.category === "intensity_limit",
      );
      expect(condition, drill.id).toBeDefined();
      expect(condition!.scope).toBe("round");

      // And the resolved intensity carries no resistance number of any kind.
      const { intensity } = prescribe(drill.id).prescription;
      expect(JSON.stringify(intensity)).not.toContain("resistance_category");
      expect(JSON.stringify(intensity)).not.toContain("controlled_resistance");
    }
  });
});

// -----------------------------------------------------------------------------
// 39-44. End to end
// -----------------------------------------------------------------------------

describe("partner grappling drills — exercise, session, engine, trace", () => {
  test("39. each drill prescribes completely on its own", () => {
    for (const drill of DRILLS) {
      const result = prescribe(drill.id);
      expect(result.ok).toBe(true);
      expect(result.prescription.exerciseId).toBe(drill.id);
      expect(result.prescription.methodId).toBe(METHOD_ID);
      expect(result.prescription.intensity.status).toBe("complete");
      expect(result.prescription.rest?.status).toBe("complete");
      expect(result.prescription.instructions.length).toBeGreaterThanOrEqual(3);
    }
  });

  test("40. the three prescribe together in one movement session", () => {
    const exercises: SessionExercisePrescriptionInput[] = DRILLS.map((drill, index) => {
      const sourceResult = getExercisePrescriptionSource(drill.id, context(drill.id));
      if (!sourceResult.ok) {
        throw new Error(`Expected a source for "${drill.id}": ${sourceResult.message}`);
      }
      return {
        exerciseId: drill.id,
        moduleId: sourceResult.moduleId,
        ...sourceResult.source,
        order: index + 1,
        required: true,
        blockId: "grappling",
      };
    });

    const result = prescribeSession({
      sessionId: "grappling-session",
      sessionName: "Partner Grappling Rounds",
      modules: ["movement"],
      exercises,
    });
    if (!result.ok) {
      throw new Error(`Expected the session to prescribe: ${result.issues.map((issue) => issue.message).join(" | ")}`);
    }
    expect(result.session.exercises).toHaveLength(3);
    for (const exercise of result.session.exercises) {
      expect(exercise.prescription.volume.structure).toBe("rounds_duration");
      expect(exercise.prescription.methodId).toBe(METHOD_ID);
    }
  });

  /**
   * `movement` is never selected as a PRIMARY module from an adaptation
   * domain, exactly like `grip` and `core`: requiring it alone yields
   * NO_PRIMARY_MODULE_SELECTED. Every engine fixture below therefore carries a
   * primary strength exercise alongside, the same shape the grip lots use.
   */
  const engineInput = (definition: { id: string }) => ({
    input: makeValidInput({
      request: makeRequest({
        primaryObjective: { adaptationDomain: "maximum_strength" },
        requiredModules: ["movement"],
      }),
      environment: makeEnvironment({
        availableEquipment: [{ type: "bodyweight" }, { type: "pull_up_bar" }],
        partnerAvailable: true,
        usableWall: true,
        floorSafe: true,
        availableSpace: "large",
      }),
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "elite", primaryCombatSport: "krav_maga" },
        goals: [
          { id: "goal-1", name: "Clinch Control", adaptationDomain: "maximum_strength", priority: "primary" },
        ],
      }),
      readiness: makeReadiness({
        energy: 5,
        motivation: 5,
        sleepQuality: 5,
        stress: 5,
        soreness: 5,
        perceivedRecovery: 5,
      }),
    }),
    id: definition.id,
  });

  function runWith(definition: Parameters<typeof makeExercise>[0] & { id: string }) {
    const pullUp = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === "pull_up")!;
    const source = getExercisePrescriptionSource(definition.id, context(definition.id));
    const pullUpSource = getExercisePrescriptionSource("pull_up", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["pull_up_bar"],
    });
    if (!source.ok || !pullUpSource.ok) throw new Error("Fixture setup failed.");

    return runEngine(
      engineInput(definition).input,
      [
        makeExercise({ ...pullUp, setupTimeMinutes: 1 }),
        makeExercise({ ...definition, setupTimeMinutes: 2 }),
      ],
      new Map<string, ExercisePrescriptionSource>([
        [definition.id, source.source],
        ["pull_up", pullUpSource.source],
      ]),
    );
  }

  test("41. runEngine prescribes pummeling and grip_fighting end to end", () => {
    for (const definition of [PUMMELING, GRIP_FIGHTING]) {
      const result = runWith(definition);
      if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
        throw new Error(`Expected a prescribed draft for ${definition.id}, got ${result.outcome}.`);
      }
      const prescribed = result.prescription.session.exercises.find(
        (exercise) => exercise.prescription.exerciseId === definition.id,
      )?.prescription;
      expect(prescribed, definition.id).toBeDefined();
      expect(prescribed?.volume.structure).toBe("rounds_duration");
      expect(prescribed?.volume.rounds).toBe(6);
      expect(prescribed?.methodId).toBe(METHOD_ID);
    }
  });

  test("41b. wall_wrestling is eligible and prescribable, but the V0.1 scoring threshold declines to select it", () => {
    // NOT a registry defect, and recorded rather than worked around: this is
    // the sprint_intervals phenomenon. The chapter rates Overall Fatigue Cost
    // High, Overall Risk Moderate and both neuromuscular and metabolic fatigue
    // 5/5, and the V0.1 conditional threshold refuses it even for a fully
    // recovered elite athlete. Direct prescription is unaffected — test 39
    // proves it — so what is asserted here is the SHAPE of the refusal, so a
    // silent change to a different cause would fail.
    const result = runWith(WALL_WRESTLING);
    if (result.outcome !== "draft") {
      throw new Error(`Expected a draft, got ${result.outcome}.`);
    }

    const eligibility = result.eligibilityResults.find(
      (candidate) => candidate.exerciseId === "wall_wrestling",
    );
    expect(eligibility?.eligible).toBe(true);
    expect(eligibility?.rejectionReasons).toEqual([]);

    const movementScoring = result.decisionTrace.entries.find(
      (traceEntry) => traceEntry.id.endsWith("_scoring_movement"),
    );
    expect(movementScoring?.reasons.join(" ")).toContain(
      "No candidate reached the minimum conditional selection threshold.",
    );

    // It still prescribes perfectly when asked directly.
    expect(prescribe("wall_wrestling").prescription.volume.rounds).toBe(6);
  });

  test("42. the Decision Trace names the shared profile and shows the narrowing for each drill", () => {
    for (const drill of DRILLS) {
      const entries = adaptExercisePrescriptionResult(prescribe(drill.id, "high"), {
        idPrefix: `${drill.id}_test`,
        timestamp: "2026-01-01T00:00:00.000Z",
      });

      const volumeEntry = entries.find((traceEntry) => traceEntry.id.endsWith("_volume"));
      expect(volumeEntry?.reasons[0], drill.id).toBe(
        `profile=${PROFILE_ID} (selection=explicit_profile_id)`,
      );

      // The narrowing is visible in the trace, not merely applied. Every
      // drill narrows at least one dimension away from the union envelope.
      const text = entries.map((traceEntry) => traceEntry.reasons.join(" ")).join(" ");
      expect(text, drill.id).toContain("narrowed");

      // The profile carries exactly one intensity rule, so the trace records
      // that nothing was rejected — there was no second candidate to weigh.
      // This is the visible consequence of Table Group 18 declining
      // `movement_intent`: a single-rule profile has nothing to arbitrate.
      const intensityEntry = entries.find((traceEntry) => traceEntry.id.endsWith("_intensity"));
      expect(intensityEntry?.reasons.join(" "), drill.id).toContain("No intensity rule rejected.");
    }
  });

  test("43. prescription is deterministic — same input, byte-identical output", () => {
    for (const drill of DRILLS) {
      for (const rangeContext of ["reduced", "normal", "high"] as const) {
        const first = JSON.stringify(prescribe(drill.id, rangeContext).prescription);
        const second = JSON.stringify(prescribe(drill.id, rangeContext).prescription);
        expect(second).toEqual(first);
      }
    }
  });

  test("44. prescribing mutates neither the registry entry nor the execution context", () => {
    for (const drill of DRILLS) {
      const before = JSON.stringify(entry(drill.id));
      const executionContext = context(drill.id);
      const contextBefore = JSON.stringify(executionContext);

      const sourceResult = getExercisePrescriptionSource(drill.id, executionContext);
      if (!sourceResult.ok) throw new Error("Expected a source.");
      prescribeExercise({ exerciseId: drill.id, moduleId: sourceResult.moduleId, ...sourceResult.source });

      expect(JSON.stringify(entry(drill.id))).toEqual(before);
      expect(JSON.stringify(executionContext)).toEqual(contextBefore);
    }
  });
});

// -----------------------------------------------------------------------------
// 45-50. Registry health, non-regression, genericity, foundation integrity
// -----------------------------------------------------------------------------

describe("partner grappling drills — registry health and non-regression", () => {
  test("45. the whole registry still validates", () => {
    const issues = validatePilotRegistry();
    expect(issues).toEqual([]);
  });

  test("46. no regression on the 71 previous entries: each still prescribes with its own declared equipment", () => {
    const previousIds = PILOT_EXERCISE_IDS.filter(
      (id) => !(DRILL_IDS as readonly string[]).includes(id) && id !== "sled_push",
    );
    expect(previousIds).toHaveLength(71);

    for (const id of previousIds) {
      const registryEntry = entry(id);
      // No previous entry adopted the new method, profile or equipment id.
      expect(registryEntry.explicitMethodId).not.toBe(METHOD_ID);
      expect(registryEntry.numericalProfileId ?? null).not.toBe(PROFILE_ID);
      expect(registryEntry.capabilities.requiredEquipmentCapabilities).not.toContain("usable_wall");
      expect(registryEntry.capabilities.capabilityTags).not.toContain("partner_resistance");

      const sourceResult = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [
          {
            referenceType: "one_rep_max" as const,
            value: 100,
            unit: "kilograms",
            sourceId: "test-1rm",
            measuredAt: null,
            validUntil: null,
            confidence: "validated" as const,
          },
        ],
        availableEquipmentCapabilities: registryEntry.capabilities.requiredEquipmentCapabilities,
      });
      expect(sourceResult.ok, id).toBe(true);
    }
  });

  test("47. all three duration estimation profiles exist and are honestly unresolved", () => {
    for (const drill of DRILLS) {
      const profileId = `duration_profile_${drill.id}`;
      expect(entry(drill.id).capabilities.durationEstimationProfileId).toBe(profileId);

      const result = getDurationEstimationProfile(profileId);
      if (!result.ok) {
        throw new Error(`Expected "${profileId}" to be unresolved.`);
      }
      expect(result.profile?.status).toBe("resolved");
      expect(result.profile?.volumeStructure).toBe("rounds_duration");
      // Never back-filled from the prescribed round duration.
      expect(result.profile?.sourceRuleIds).toContain(drill.chapter);
    }
  });

  test("48-49. no resolver was modified, and none branches on this method, profile or any of the three ids", () => {
    const resolvers = [
      "resolveVolume.ts",
      "resolveIntensity.ts",
      "resolveRest.ts",
      "resolveTempo.ts",
      "resolveMethod.ts",
      "resolveStopConditions.ts",
      "resolveInstructions.ts",
      "prescribeExercise.ts",
      "prescribeSession.ts",
      "validatePrescription.ts",
    ];

    for (const file of resolvers) {
      const text = readFileSync(new URL(`../../prescription/${file}`, import.meta.url), "utf-8");
      expect(text, file).not.toContain(METHOD_ID);
      expect(text, file).not.toContain(PROFILE_ID);
      for (const drill of DRILLS) {
        expect(text, `${file} / ${drill.id}`).not.toContain(drill.id);
      }
    }
  });

  test("50. the Partner Grappling Rounds foundation is unchanged by this lot", () => {
    const method = getTrainingMethodContract(METHOD_ID);
    expect(method.family).toBe("combat_rounds");
    expect(method.supportedModules).toEqual(["movement"]);
    expect(method.supportedRoles).toEqual(["technical", "secondary", "accessory"]);
    expect(method.volumeStructure).toBe("rounds_duration");
    expect(method.restPolicy).toBe("required");
    expect(method.tempoPolicy).toBe("forbidden");
    expect(method.requiredExerciseCapabilities).toEqual([
      "round_structure",
      "technical_quality_observation",
      "partner_resistance",
    ]);

    const profile = getNumericalPrescriptionProfileById(PROFILE_ID)!;
    expect(profile.volume.rounds).toEqual({ min: 3, normal: 6, max: 10 });
    expect(profile.volume.duration!.range).toEqual({ min: 30, normal: 165, max: 300, unit: "seconds" });
    expect(profile.rest!.seconds).toEqual({ min: 60, normal: 120, max: 180 });
    expect(profile.tempo).toBeNull();
    expect(profile.requiresSportSpecificSubtype).toBe(false);

    // combat_rounds was not widened to accommodate this lot either.
    const striking = getTrainingMethodContract("combat_rounds");
    expect(striking.supportedModules).toEqual(["power", "conditioning"]);
    expect(striking.requiredExerciseCapabilities).toContain("impact_equipment");
  });
});
