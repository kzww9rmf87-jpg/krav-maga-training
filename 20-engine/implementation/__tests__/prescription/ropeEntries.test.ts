/**
 * Combat Athlete System — Registry Lot 15: rope_climb and rope_pull
 *
 * First consumers of Table Groups 16 and 17. Two exercises, two units, two
 * profiles — never one shared envelope, because an ascent and a
 * hand-over-hand pull are as different from each other as either is from a
 * repetition.
 *
 * What this file guards beyond presence:
 *
 * - the unit CHOICE for each. Both chapters document more than one unit for
 *   the same movement, and only one may be represented: rope_climb offers
 *   climbs or hand pulls, rope_pull offers pulls, distance and duration.
 *   The chosen one is the best-quantified, and the others are recorded as
 *   unrepresented rather than folded in;
 * - the arithmetic proof that one envelope was impossible: 1-5 ascents and
 *   6-20 pulls do not intersect;
 * - the equipment disjunction: a climbing rope and a battle rope are
 *   separate identifiers and neither satisfies the other;
 * - rope_pull's documented resistance source, which the knowledge base does
 *   not encode, carried at critical priority in the setup instruction.
 */

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import { EXERCISE_KNOWLEDGE_BASE, ROPE_CLIMB, ROPE_PULL } from "../../exerciseKnowledgeBase";
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
import { getTrainingMethodContract } from "../../prescription/contracts";
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

const CLIMB = {
  id: "rope_climb",
  profile: "grip_climb_strength_v0_1",
  chapter: "50-exercises/65_GRIP/13_ROPE_CLIMB.md",
  unit: "climbs",
  expected: {
    reduced: { sets: 3, count: 1, rest: 120 },
    normal: { sets: 4, count: 3, rest: 210 },
    high: { sets: 5, count: 5, rest: 300 },
  },
} as const;

const PULL = {
  id: "rope_pull",
  profile: "grip_hand_pull_work_v0_1",
  chapter: "50-exercises/65_GRIP/14_ROPE_PULL.md",
  unit: "hand_pulls",
  expected: {
    reduced: { sets: 3, count: 6, rest: 90 },
    normal: { sets: 4, count: 13, rest: 165 },
    high: { sets: 5, count: 20, rest: 240 },
  },
} as const;

const BOTH = [CLIMB, PULL] as const;

const context = (rangeContext: PrescriptionExecutionContext["rangeContext"] = "normal") => ({
  rangeContext,
  athleteReferences: [],
  availableEquipmentCapabilities: ["rope"],
});

function prescribe(id: string, rangeContext: PrescriptionExecutionContext["rangeContext"] = "normal") {
  const sourceResult = getExercisePrescriptionSource(id, context(rangeContext));
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

const entry = (id: string) => EXERCISE_PRESCRIPTION_REGISTRY[id as PilotExerciseId];
const readChapter = (relative: string) =>
  readFileSync(new URL(`../../../../${relative}`, import.meta.url), "utf-8");

// -----------------------------------------------------------------------------
// 1-5. Counts, presence, additivity
// -----------------------------------------------------------------------------

describe("rope entries — registry, knowledge base, profile and equipment counts", () => {
  test("1. the registry grew from 69 to exactly 71 entries", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(71);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(71);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY).sort()).toEqual([...PILOT_EXERCISE_IDS].sort());
  });

  test("2. the knowledge base still holds exactly 76 ExerciseDefinitions", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toHaveLength(76);
    expect(new Set(EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id)).size).toBe(76);
  });

  test("3. the numerical profiles stay at 21 — this lot created none", () => {
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(21);
    for (const { profile } of BOTH) {
      expect(NUMERICAL_PRESCRIPTION_PROFILES.filter((p) => p.profileId === profile)).toHaveLength(1);
    }
  });

  test("4. the equipment vocabulary went from 30 to 31 — `rope`, the only identifier this lot added", () => {
    expect(EQUIPMENT_CAPABILITY_IDS).toHaveLength(31);
    expect(isEquipmentCapabilityId("rope")).toBe(true);
    // No anchor or load id was invented for either chapter.
    for (const invented of ["climbing_rope", "anchored_load", "rope_anchor", "pulling_sled"]) {
      expect(isEquipmentCapabilityId(invented), invented).toBe(false);
    }
  });

  test("5. both exist in both layers, and the Grip module now spans five units", () => {
    for (const { id } of BOTH) {
      expect(EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === id)?.module).toBe("grip");
      expect(entry(id).exerciseId).toBe(id);
      expect(entry(id).capabilities.exerciseId).toBe(id);
      expect(PILOT_EXERCISE_IDS.filter((pilotId) => pilotId === id)).toHaveLength(1);
    }

    const gripUnits = new Set(
      Object.values(EXERCISE_PRESCRIPTION_REGISTRY)
        .filter((registryEntry) => registryEntry.moduleId === "grip")
        .flatMap((registryEntry) => registryEntry.capabilities.volumeInterpretations),
    );
    expect(gripUnits).toContain("total_distance");
    expect(gripUnits).toContain("total_duration");
    expect(gripUnits).toContain("total_repetitions");
    expect(gripUnits).toContain("climbs");
    expect(gripUnits).toContain("hand_pulls");
  });
});

// -----------------------------------------------------------------------------
// 6-9. The unit choice, and what was NOT represented
// -----------------------------------------------------------------------------

describe("rope entries — units chosen, units refused", () => {
  test("6. each entry declares exactly one unit, and they are different", () => {
    expect(entry(CLIMB.id).capabilities.volumeInterpretations).toEqual(["climbs"]);
    expect(entry(PULL.id).capabilities.volumeInterpretations).toEqual(["hand_pulls"]);
    expect(entry(CLIMB.id).numericalProfileId).toBe(CLIMB.profile);
    expect(entry(PULL.id).numericalProfileId).toBe(PULL.profile);
  });

  test("7. rope_climb chose ASCENTS over hand pulls, because only ascents are quantified by a named prescription", () => {
    const chapter = readChapter(CLIMB.chapter);
    // The chapter offers both units in the same sentence.
    expect(chapter).toContain("- 1 to 5 climbs,");
    expect(chapter).toContain("- or 2 to 8 controlled hand pulls per set.");
    // But only the ascent count is quantified by a named prescription.
    expect(chapter).toContain("- 1 to 3 short climbs,");
    expect(chapter).toContain("- repeated hand transitions,");

    expect(entry(CLIMB.id).capabilities.volumeInterpretations).not.toContain("hand_pulls");
  });

  test("8. rope_pull chose HAND PULLS, and its distance and interval prescriptions are unrepresented", () => {
    const chapter = readChapter(PULL.chapter);
    expect(chapter).toContain("- 6 to 20 hand-over-hand pulls per set.");
    expect(chapter).toContain("- 5 to 15 metres for strength emphasis,");
    expect(chapter).toContain("- 20 to 40 second intervals,");

    // Neither the distance nor the duration reached the numbers.
    const constraints = entry(PULL.id).exerciseDoseConstraints!;
    expect(constraints.minimumDose!.distanceMeters).toBeNull();
    expect(constraints.maximumDose!.distanceMeters).toBeNull();
    expect(constraints.minimumDose!.durationSeconds).toBeNull();
    expect(constraints.maximumDose!.durationSeconds).toBeNull();
    expect(constraints.minimumDose!.workIntervals).toBeNull();

    // The method forbids those fields outright, which makes the refusal
    // structural rather than a preference.
    const forbidden = getTrainingMethodContract("straight_sets_repetitions").forbiddenVolumeFields;
    for (const field of ["duration", "distance", "work_intervals"]) {
      expect(forbidden, field).toContain(field);
    }
  });

  test("9. ONE envelope could never have served both — the two counts do not intersect", () => {
    const climb = getNumericalPrescriptionProfileById(CLIMB.profile)!.volume.repetitions!.range;
    const pull = getNumericalPrescriptionProfileById(PULL.profile)!.volume.repetitions!.range;

    expect([climb.min, climb.max]).toEqual([1, 5]);
    expect([pull.min, pull.max]).toEqual([6, 20]);
    expect(Math.max(climb.min, pull.min)).toBeGreaterThan(Math.min(climb.max, pull.max));
  });
});

// -----------------------------------------------------------------------------
// 10-13. Equipment and eligibility
// -----------------------------------------------------------------------------

describe("rope entries — equipment and eligibility", () => {
  test("10. `rope` builds a source for both, and mirrors the knowledge base exactly", () => {
    for (const { id } of BOTH) {
      expect(entry(id).capabilities.requiredEquipmentCapabilities).toEqual(["rope"]);
      const kbEquipment = (id === CLIMB.id ? ROPE_CLIMB : ROPE_PULL).requirements!.required
        .flatMap((clause) => clause.items)
        .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
        .map((atom) => atom.equipment);
      expect(kbEquipment, id).toEqual(["rope"]);
      expect(getExercisePrescriptionSource(id, context()).ok, id).toBe(true);
    }
  });

  test("11. a battle rope never substitutes for a climbing rope, in either direction", () => {
    for (const { id } of BOTH) {
      const wrong = getExercisePrescriptionSource(id, {
        ...context(),
        availableEquipmentCapabilities: ["battle_rope", "rope_anchor_point"],
      });
      expect(wrong.ok, id).toBe(false);
    }
    // And battle_ropes is not satisfied by a climbing rope.
    const battle = getExercisePrescriptionSource("battle_ropes", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["rope"],
    });
    expect(battle.ok).toBe(false);
    expect(EXERCISE_PRESCRIPTION_REGISTRY.battle_ropes.capabilities.requiredEquipmentCapabilities).toEqual([
      "battle_rope",
      "rope_anchor_point",
    ]);
  });

  test("12. missing or wrong equipment is rejected in both layers", () => {
    for (const { id } of BOTH) {
      for (const available of [[], ["towel"], ["pull_up_bar"], ["sled"], ["heavy_bag", "mat"]]) {
        const source = getExercisePrescriptionSource(id, {
          ...context(),
          availableEquipmentCapabilities: available,
        });
        expect(source.ok, `${id}/${available.join("+") || "(rien)"}`).toBe(false);
      }
    }
  });

  test("13. the knowledge base's environment gates still apply and are NOT mirrored here", () => {
    // rope_climb documents a safe landing surface and a large space.
    const climbOk = checkExerciseEligibility(
      makeExercise({ ...ROPE_CLIMB }),
      makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "rope" }],
          floorSafe: true,
          availableSpace: "large",
        }),
      }),
    );
    expect(climbOk.eligible).toBe(true);

    const climbNoLanding = checkExerciseEligibility(
      makeExercise({ ...ROPE_CLIMB }),
      makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "rope" }],
          floorSafe: false,
          availableSpace: "large",
        }),
      }),
    );
    expect(climbNoLanding.eligible).toBe(false);

    // No environment capability was invented in the prescription layer.
    for (const { id } of BOTH) {
      expect(entry(id).capabilities.requiredEquipmentCapabilities).toEqual(["rope"]);
      expect(entry(id).capabilities.requiredEquipmentCapabilities).not.toContain("safe_landing_surface");
      expect(entry(id).capabilities.requiredEquipmentCapabilities).not.toContain("open_space");
    }
  });
});

// -----------------------------------------------------------------------------
// 14-19. Resolution
// -----------------------------------------------------------------------------

describe("rope entries — resolution", () => {
  test("14. the shared Grip triple refuses implicit resolution; each explicit id returns its own profile", () => {
    for (const { id, profile } of BOTH) {
      const implicit = resolveNumericalProfile({
        moduleId: entry(id).moduleId,
        methodId: entry(id).explicitMethodId,
        exerciseRole: entry(id).role,
      });
      expect(implicit.ok, id).toBe(false);
      if (!implicit.ok) {
        expect(implicit.failureCode).toBe("NUMERICAL_PROFILE_AMBIGUOUS");
        expect(implicit.candidateProfileIds).toHaveLength(3);
      }

      const explicit = resolveNumericalProfile({
        moduleId: entry(id).moduleId,
        methodId: entry(id).explicitMethodId,
        exerciseRole: entry(id).role,
        explicitProfileId: entry(id).numericalProfileId,
      });
      expect(explicit.ok && explicit.profile.profileId, id).toBe(profile);
    }
  });

  test("15. + 16. + 17. every range context resolves each chapter's own values", () => {
    for (const { id, expected } of BOTH) {
      for (const rangeContext of ["reduced", "normal", "high"] as const) {
        const prescription = prescribe(id, rangeContext).prescription;

        expect(prescription.volume.structure).toBe("sets_reps");
        expect(prescription.volume.sets, `${id}/${rangeContext}`).toBe(expected[rangeContext].sets);
        if (prescription.volume.reps?.type === "fixed") {
          expect(prescription.volume.reps.value, `${id}/${rangeContext}`).toBe(
            expected[rangeContext].count,
          );
        }
        if (prescription.rest?.betweenSets?.type === "fixed") {
          expect(prescription.rest.betweenSets.duration.value).toBe(expected[rangeContext].rest);
        }
        expect(prescription.status).toBe("complete");

        // Forbidden dimensions stay null in every context.
        expect(prescription.volume.duration).toBeNull();
        expect(prescription.volume.distance).toBeNull();
        expect(prescription.volume.rounds).toBeNull();
        expect(prescription.volume.workIntervals).toBeNull();
      }
    }
  });

  test("18. intensity is technical_effort for both — no RPE, no RIR, no resistance number", () => {
    for (const { id } of BOTH) {
      expect(entry(id).capabilities.supportedIntensityTypes).toEqual(["technical_effort"]);
      expect(entry(id).exerciseIntensityConstraints, id).toBeNull();
      const intensity = prescribe(id).prescription.intensity;
      expect(intensity.primaryMetric.type).toBe("technical_effort");
      expect(intensity.primaryMetric.target).toMatchObject({ value: "high_quality" });
      expect(intensity.primaryMetric.reference).toBeNull();
      expect(entry(id).capabilities.requiredAthleteReferenceTypes).toEqual([]);
    }

    // rope_pull's "heavy" and "moderate" resistance stayed words.
    const chapter = readChapter(PULL.chapter);
    expect(chapter).toContain("heavy external resistance");
    expect(chapter).toContain("moderate external resistance");
    expect(entry(PULL.id).capabilities.supportedIntensityTypes).not.toContain("resistance_category");
  });

  test("19. tempo is controlled, laterality bilateral, and nothing is counted per hand", () => {
    for (const { id, unit } of BOTH) {
      expect(entry(id).capabilities.laterality).toBe("bilateral");
      const prescription = prescribe(id).prescription;
      expect(prescription.tempo?.globalIntent).toBe("controlled");
      expect(prescription.volume.laterality?.laterality).toBe("bilateral");
      expect(prescription.volume.laterality?.interpretation).toBe(unit);
      expect(prescription.volume.laterality?.startingSide ?? null).toBeNull();
      expect(entry(id).capabilities.volumeInterpretations).not.toContain("repetitions_per_side");
    }

    // Both chapters say "Alternating Bilateral" — an intra-movement
    // alternation, never a per-side prescription.
    for (const { chapter } of BOTH) {
      expect(readChapter(chapter)).toContain("Unilateral or Bilateral: Alternating Bilateral");
    }
  });
});

// -----------------------------------------------------------------------------
// 20-23. Instructions and stop conditions
// -----------------------------------------------------------------------------

describe("rope entries — instructions and stop conditions", () => {
  test("20. both carry a critical setup and a high-priority execution, sourced to their own chapter", () => {
    for (const { id, chapter } of BOTH) {
      const instructions = entry(id).instructionDefinitions;
      expect(instructions, id).toHaveLength(2);
      for (const instruction of instructions) {
        expect(instruction.mandatory).toBe(true);
        expect(instruction.sourceRuleId).toBe(chapter);
      }
      expect(instructions.find((i) => i.category === "setup")?.priority).toBe("critical");
    }
  });

  test("21. rope_climb's instructions quote its own safety rules and never convert height into a count", () => {
    const setup = entry(CLIMB.id).instructionDefinitions.find((i) => i.category === "setup");
    const execution = entry(CLIMB.id).instructionDefinitions.find((i) => i.category === "execution");

    expect(setup?.text.toLowerCase()).toContain("professionally anchored rope");
    expect(setup?.text.toLowerCase()).toContain("inspect it before every session");
    expect(setup?.text.toLowerCase()).toContain("landing area clear");
    expect(execution?.text.toLowerCase()).toContain("re-establish full grip");
    expect(execution?.text.toLowerCase()).toContain("never slide down the rope");
    // The documented height lives here, not in the numbers.
    expect(execution?.text).toContain("2 to 4 metres");
    expect(entry(CLIMB.id).exerciseDoseConstraints?.minimumDose?.distanceMeters).toBeNull();
  });

  test("22. rope_pull's setup carries the resistance source the knowledge base cannot encode", () => {
    const setup = entry(PULL.id).instructionDefinitions.find((i) => i.category === "setup");
    expect(setup?.priority).toBe("critical");
    expect(setup?.text.toLowerCase()).toContain("sled or an anchored load");
    expect(setup?.text.toLowerCase()).toContain("attachment must be verified");
    expect(setup?.text.toLowerCase()).toContain("not representable");
    expect(setup?.text.toLowerCase()).toContain("never wrap the rope");

    // No equivalence group was minted for it, and `sled` was not diverted.
    expect(entry(PULL.id).capabilities.requiredEquipmentCapabilities).toEqual(["rope"]);
    expect(entry(PULL.id).capabilities.requiredEquipmentCapabilities).not.toContain("sled");
  });

  test("23. six stop conditions each, all sourced, with balance_loss knowingly absent", () => {
    for (const { id } of BOTH) {
      const categories = entry(id).stopConditionDefinitions.map((c) => c.category);
      expect([...categories].sort(), id).toEqual([
        "completion",
        "equipment_failure",
        "fatigue_limit",
        "pain",
        "range_of_motion_loss",
        "technical_failure",
      ]);
      for (const required of getTrainingMethodContract("straight_sets_repetitions")
        .requiredStopConditionCategories) {
        expect(categories, `${id}/${required}`).toContain(required);
      }
      for (const condition of entry(id).stopConditionDefinitions) {
        expect(condition.sourceRuleIds.length).toBeGreaterThan(0);
        expect(condition.instructions[0]?.text.length).toBeGreaterThan(0);
      }
      expect(categories).not.toContain("balance_loss");
      expect(prescribe(id).prescription.stopConditions).toHaveLength(6);
    }

    const climbById = Object.fromEntries(
      entry(CLIMB.id).stopConditionDefinitions.map((c) => [c.conditionId, (c.instructions[0]?.text ?? "").toLowerCase()]),
    );
    expect(climbById["rope_climb_equipment_failure"]).toContain("never slide down the rope");
    expect(climbById["rope_climb_range_of_motion_loss"]).toContain("safe descent capacity");

    const pullById = Object.fromEntries(
      entry(PULL.id).stopConditionDefinitions.map((c) => [c.conditionId, (c.instructions[0]?.text ?? "").toLowerCase()]),
    );
    expect(pullById["rope_pull_equipment_failure"]).toContain("wrap the rope");
    expect(pullById["rope_pull_equipment_failure"]).toContain("recoil");
  });
});

// -----------------------------------------------------------------------------
// 24-30. Session, engine, trace, non-regression
// -----------------------------------------------------------------------------

describe("rope entries — session, engine and non-regression", () => {
  test("24. all five Grip entries prescribe side by side, each on its own unit", () => {
    const ids = ["rope_climb", "rope_pull", "towel_pull_up", "plate_pinch", "pinch_carry"] as const;
    const exercises: SessionExercisePrescriptionInput[] = ids.map((id, index) => {
      const registryEntry = EXERCISE_PRESCRIPTION_REGISTRY[id];
      const sourceResult = getExercisePrescriptionSource(id, {
        rangeContext: "normal",
        athleteReferences: [],
        availableEquipmentCapabilities: registryEntry.capabilities.requiredEquipmentCapabilities,
      });
      if (!sourceResult.ok) throw new Error(`Fixture setup failed for ${id}: ${sourceResult.message}`);
      return {
        exerciseId: id,
        moduleId: sourceResult.moduleId,
        ...sourceResult.source,
        order: index + 1,
        required: true,
        blockId: "grip",
      };
    });

    const result = prescribeSession({
      sessionId: "grip-session",
      sessionName: "Five Grip Units",
      modules: ["grip"],
      exercises,
    });
    if (!result.ok) {
      throw new Error(`Expected the session to prescribe: ${result.issues.map((i) => i.message).join(" | ")}`);
    }
    expect(result.session.exercises).toHaveLength(5);

    const interpretations = result.session.exercises.map(
      (exercise) => exercise.prescription.volume.laterality?.interpretation,
    );
    expect(new Set(interpretations).size).toBe(5);
  });

  test("25. runEngine prescribes rope_pull end to end — grip is a support module", () => {
    const pullUp = EXERCISE_KNOWLEDGE_BASE.find((exercise) => exercise.id === "pull_up")!;

    const input = makeValidInput({
      request: makeRequest({
        primaryObjective: { adaptationDomain: "maximum_strength" },
        requiredModules: ["grip"],
      }),
      environment: makeEnvironment({
        availableEquipment: [{ type: "rope" }, { type: "pull_up_bar" }],
        floorSafe: true,
        availableSpace: "large",
      }),
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "elite", primaryCombatSport: "krav_maga" },
        goals: [{ id: "goal-1", name: "Grip Strength", adaptationDomain: "maximum_strength", priority: "primary" }],
      }),
      readiness: makeReadiness({
        energy: 5,
        motivation: 5,
        sleepQuality: 5,
        stress: 5,
        soreness: 5,
        perceivedRecovery: 5,
      }),
    });

    const climbSource = getExercisePrescriptionSource(PULL.id, context());
    const pullUpSource = getExercisePrescriptionSource("pull_up", {
      rangeContext: "normal",
      athleteReferences: [],
      availableEquipmentCapabilities: ["pull_up_bar"],
    });
    if (!climbSource.ok || !pullUpSource.ok) throw new Error("Fixture setup failed.");

    const result = runEngine(
      input,
      [
        makeExercise({ ...pullUp, setupTimeMinutes: 1, defaultExerciseDurationMinutes: 8 }),
        makeExercise({ ...ROPE_PULL, setupTimeMinutes: 3, defaultExerciseDurationMinutes: 12 }),
      ],
      new Map<string, ExercisePrescriptionSource>([
        [PULL.id, climbSource.source],
        ["pull_up", pullUpSource.source],
      ]),
    );

    if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
      throw new Error(`Expected a prescribed draft, got ${result.outcome}.`);
    }
    const prescribed = result.prescription.session.exercises.find(
      (exercise) => exercise.prescription.exerciseId === PULL.id,
    )?.prescription;
    expect(prescribed).toBeDefined();
    expect(prescribed?.volume.laterality?.interpretation).toBe("hand_pulls");
  });

  test("26. the decision trace names each profile and each unit", () => {
    for (const { id, profile, unit } of BOTH) {
      const entries = adaptExercisePrescriptionResult(prescribe(id), {
        idPrefix: `${id}_test`,
        timestamp: "2026-01-01T00:00:00.000Z",
      });
      const volumeEntry = entries.find((e) => e.id.endsWith("_volume"));
      expect(volumeEntry?.reasons[0], id).toBe(`profile=${profile} (selection=explicit_profile_id)`);
      expect(volumeEntry?.reasons.join(" "), id).toContain(`laterality=bilateral (${unit})`);
    }
  });

  test("27. + 28. prescribing is deterministic and never mutates an entry or a profile", () => {
    for (const { id, profile } of BOTH) {
      const entryBefore = JSON.stringify(entry(id));
      const profileBefore = JSON.stringify(getNumericalPrescriptionProfileById(profile));
      const runs = [prescribe(id), prescribe(id), prescribe(id)].map((r) => JSON.stringify(r.prescription));

      expect(new Set(runs).size, id).toBe(1);
      expect(JSON.stringify(entry(id))).toBe(entryBefore);
      expect(JSON.stringify(getNumericalPrescriptionProfileById(profile))).toBe(profileBefore);
    }
  });

  test("29. validatePilotRegistry is clean, and both duration profiles are unresolved", () => {
    const issues = validatePilotRegistry();
    expect(issues.filter((issue) => issue.code !== "UNRESOLVED_DURATION_PROFILE")).toEqual([]);

    for (const { id, chapter } of BOTH) {
      const result = getDurationEstimationProfile(`duration_profile_${id}`);
      expect(result.ok, id).toBe(false);
      if (!result.ok) {
        expect(result.failureCode).toBe("DURATION_PROFILE_UNRESOLVED");
        expect(result.profile?.sourceRuleIds).toContain(chapter);
      }
    }
  });

  test("30. no regression on the 69 previous entries, and no resolver branches on either exercise", () => {
    const previousIds = PILOT_EXERCISE_IDS.filter(
      (id) => id !== CLIMB.id && id !== PULL.id,
    );
    expect(previousIds).toHaveLength(69);

    for (const id of previousIds) {
      const registryEntry = EXERCISE_PRESCRIPTION_REGISTRY[id as PilotExerciseId];
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
      if (!sourceResult.ok) {
        throw new Error(`Previous entry "${id}" no longer builds a source: ${sourceResult.message}`);
      }
      const result = prescribeExercise({
        exerciseId: id,
        moduleId: sourceResult.moduleId,
        ...sourceResult.source,
      });
      if (!result.ok) {
        throw new Error(`Previous entry "${id}" no longer prescribes: ${result.message}`);
      }
    }

    for (const resolver of [
      "resolveVolume.ts",
      "resolveIntensity.ts",
      "resolveRest.ts",
      "resolveTempo.ts",
      "resolveStopConditions.ts",
      "prescribeExercise.ts",
      "prescribeSession.ts",
      "validateCompatibility.ts",
      "registryValidators.ts",
    ]) {
      const source = readFileSync(new URL(`../../prescription/${resolver}`, import.meta.url), "utf-8");
      for (const { id, profile } of BOTH) {
        expect(source, `${resolver}/${id}`).not.toContain(id);
        expect(source, `${resolver}/${profile}`).not.toContain(profile);
      }
    }
  });
});
