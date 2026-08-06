/**
 * Combat Athlete System — Equipment Capability Derivation, End to End
 *
 * Proves, against the REAL knowledge base and the REAL prescription
 * registry, that CAS now derives its own prescription equipment
 * capabilities from the athlete's `TrainingEnvironment` — and that the
 * caller supplies no capability list anywhere in the flow.
 *
 * The first test reproduces the exact scenario the V0.1 audit used to
 * demonstrate the defect (strength objective, grip + core + conditioning
 * support modules, fully-equipped gym). Before this lot it selected four
 * exercises and prescribed two, because `pallof_press` needs
 * `cable_or_band_resistance` and `assault_bike_intervals` needs
 * `cardio_machine`, and nothing translated the athlete's declared cable
 * machine and air bike into those ids.
 */

import { describe, expect, test } from "vitest";

import { runEngine } from "../index";
import type { EngineInput, EquipmentType } from "../types";
import { buildEngineSessionPrescriptionSources } from "../prescription/buildEngineSessionPrescriptionSources";
import { EQUIPMENT_CAPABILITY_IDS } from "../prescription/equipmentCapabilities";

import { makeAthleteProfile, makeRequest, makeValidInput } from "./fixtures";

const FULLY_EQUIPPED_GYM: readonly EquipmentType[] = [
  "bodyweight",
  "barbell",
  "dumbbell",
  "kettlebell",
  "medicine_ball",
  "sandbag",
  "cable_machine",
  "resistance_band",
  "pull_up_bar",
  "dip_bars",
  "bench",
  "rack",
  "plates",
  "sled",
  "rope",
  "towel",
  "box",
  "mat",
  "heavy_bag",
  "cardio_machine",
  "rowing_ergometer",
  "open_space",
  "wall",
  "trap_bar",
  "plyometric_box",
  "ab_wheel",
  "pinch_grip_implement",
  "slam_ball",
  "rigid_anchor_support",
  "knee_protection_pad",
  "farmer_handle",
  "battle_rope",
  "rope_anchor_point",
];

function makeAuditScenarioInput(): EngineInput {
  return makeValidInput({
    athleteProfile: makeAthleteProfile({
      experience: { generalTrainingLevel: "intermediate", primaryCombatSport: "krav_maga" },
    }),
    environment: {
      locationType: "gym",
      availableEquipment: FULLY_EQUIPPED_GYM.map((type) => ({ type })),
      availableSpace: "large",
      usableWall: true,
      throwingAllowed: true,
      jumpingAllowed: true,
      sprintingAllowed: true,
      floorSafe: true,
      partnerAvailable: true,
    },
    request: makeRequest({
      requestId: "lot-2",
      durationMinutes: 45,
      primaryObjective: { adaptationDomain: "maximum_strength" },
      requiredModules: ["grip", "core", "conditioning"],
    }),
  });
}

/** Selected ids → sources (capabilities derived by CAS) → final run. */
function runScenario(input: EngineInput) {
  const draftOnly = runEngine(input);
  if (draftOnly.outcome !== "draft") {
    throw new Error(`Expected a draft, got "${draftOnly.outcome}".`);
  }

  const selectedExerciseIds = draftOnly.sessionDraft.modules.flatMap((generatedModule) =>
    generatedModule.exerciseSelection.candidates
      .filter((candidate) => candidate.selected)
      .map((candidate) => candidate.scoredExercise.exercise.id),
  );

  const built = buildEngineSessionPrescriptionSources(selectedExerciseIds, {
    athleteReferences: [],
    environment: input.environment,
    readiness: input.readiness,
  });

  const result = runEngine(input, undefined, built.sources);
  if (result.outcome !== "draft") {
    throw new Error(`Expected a draft, got "${result.outcome}".`);
  }

  return { selectedExerciseIds, result, ...built };
}

/** Warnings minus the session-adequacy findings — see `sessionAdequacy.ts`. */
function omissionWarnings(result: {
  decisionTrace: { warnings: readonly string[] };
  sessionAdequacy?: { findings: readonly { description: string }[] };
}): string[] {
  const adequacy = new Set((result.sessionAdequacy?.findings ?? []).map((finding) => finding.description));
  return result.decisionTrace.warnings.filter((warning) => !adequacy.has(warning));
}

describe("equipment capability derivation — the audit scenario is fixed", () => {
  test("every selected exercise is now prescribed, with no capability list supplied by the caller", () => {
    const { selectedExerciseIds, result, failures } = runScenario(makeAuditScenarioInput());

    // The strength module contributes three exercises since Lot 7 composed
    // sessions from the ranked bench instead of taking only the top pick.
    expect(selectedExerciseIds).toEqual([
      "chest_supported_row",
      "neck_training",
      "chin_up",
      "plate_pinch",
      "pallof_press",
      "assault_bike_intervals",
    ]);

    if (result.prescription?.status !== "prescribed") {
      throw new Error(`Expected status "prescribed", got "${result.prescription?.status}".`);
    }

    // The two exercises the audit saw silently dropped are now dosed.
    const prescribedIds = result.prescription.session.exercises.map(
      (prescribedExercise) => prescribedExercise.prescription.exerciseId,
    );
    expect(prescribedIds).toEqual(selectedExerciseIds);
    expect(prescribedIds).toContain("pallof_press");
    expect(prescribedIds).toContain("assault_bike_intervals");

    // Nothing omitted, so Lot 1's disclosure surfaces are correctly silent.
    // Session adequacy is a separate question and is asserted separately: this
    // scenario's strength module happens to hold only accessory work.
    expect(result.prescription.unprescribedSelectedExercises).toEqual([]);
    expect(omissionWarnings(result)).toEqual([]);
    expect(failures).toEqual([]);
  });

  test("a fully-equipped gym derives the whole vocabulary, in canonical order", () => {
    const { derivedEquipmentCapabilities } = runScenario(makeAuditScenarioInput());

    expect(derivedEquipmentCapabilities).toEqual([...EQUIPMENT_CAPABILITY_IDS]);
  });

  test("the derivation is deterministic across two runs and never mutates the environment", () => {
    const input = makeAuditScenarioInput();
    const before = JSON.stringify(input.environment);

    const first = runScenario(input);
    const second = runScenario(input);

    expect(first.derivedEquipmentCapabilities).toEqual(second.derivedEquipmentCapabilities);
    expect(JSON.stringify(first.result.prescription)).toBe(JSON.stringify(second.result.prescription));
    expect(JSON.stringify(input.environment)).toBe(before);
  });
});

describe("equipment capability derivation — a restricted environment restricts the prescription", () => {
  /**
   * The same request in a barbell-only gym. The derivation must not invent
   * the missing capabilities: `pallof_press` needs a cable or a band, and
   * neither is declared, so it is not even eligible and never reaches the
   * prescription layer.
   */
  test("an exercise whose equipment is genuinely absent is filtered by eligibility, not by prescription", () => {
    const input = makeValidInput({
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "intermediate", primaryCombatSport: "krav_maga" },
      }),
      environment: {
        locationType: "gym",
        availableEquipment: (["bodyweight", "barbell", "bench", "rack", "plates"] as EquipmentType[]).map((type) => ({
          type,
        })),
        availableSpace: "moderate",
        floorSafe: true,
      },
      request: makeRequest({
        requestId: "lot-2-restricted",
        durationMinutes: 45,
        primaryObjective: { adaptationDomain: "maximum_strength" },
        requiredModules: ["core"],
      }),
    });

    const { selectedExerciseIds, derivedEquipmentCapabilities, result } = runScenario(input);

    expect(derivedEquipmentCapabilities).not.toContain("cable_or_band_resistance");
    expect(selectedExerciseIds).not.toContain("pallof_press");

    // The refusal happens at eligibility, with an equipment reason — not as
    // a late, unexplained prescription gap.
    const pallofEligibility = result.eligibilityResults.find((entry) => entry.exerciseId === "pallof_press");
    expect(pallofEligibility?.eligible).toBe(false);
    expect(pallofEligibility?.rejectionReasons.map((reason) => reason.code)).toContain("EQUIPMENT_UNAVAILABLE");
  });

  test("adding only a resistance band unlocks the cable-or-band capability", () => {
    const withoutBand = makeValidInput({
      environment: {
        locationType: "home",
        availableEquipment: [{ type: "bodyweight" }],
        availableSpace: "moderate",
        floorSafe: true,
      },
      request: makeRequest({ requestId: "no-band" }),
    });
    const withBand: EngineInput = {
      ...withoutBand,
      environment: {
        ...withoutBand.environment,
        availableEquipment: [{ type: "bodyweight" }, { type: "resistance_band" }],
      },
    };

    const before = buildEngineSessionPrescriptionSources([], {
      athleteReferences: [],
      environment: withoutBand.environment,
      readiness: withoutBand.readiness,
    });
    const after = buildEngineSessionPrescriptionSources([], {
      athleteReferences: [],
      environment: withBand.environment,
      readiness: withBand.readiness,
    });

    expect(before.derivedEquipmentCapabilities).not.toContain("cable_or_band_resistance");
    expect(after.derivedEquipmentCapabilities).toContain("cable_or_band_resistance");
    expect(after.derivedEquipmentCapabilities).toContain("resistance_band");
  });
});

describe("equipment capability derivation — residual knowledge-base / registry asymmetries", () => {
  /**
   * Three exercises require a prescription capability their own
   * `ExerciseRequirements` do not gate on, so they can pass eligibility and
   * still find no prescription source. These are NOT derivation failures —
   * the two layers genuinely disagree about what the exercise needs, and no
   * environment translation can reconcile them:
   *
   *   hollow_body_hold          KB: space >= very_limited
   *                             registry: open_space (a declared implement)
   *   med_ball_chest_pass       KB: medicine_ball AND (usable_wall OR partner)
   *   med_ball_rotational_throw registry: medicine_ball AND wall (throw target)
   *
   * Closing them means editing the knowledge base or the registry — a
   * content decision outside this lot. Until then Lot 1's disclosure keeps
   * them visible, which is what this test pins.
   */
  test("hollow_body_hold is eligible without open_space but cannot be prescribed — and says so", () => {
    const input = makeValidInput({
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "intermediate", primaryCombatSport: "krav_maga" },
      }),
      environment: {
        locationType: "gym",
        availableEquipment: (
          ["bodyweight", "barbell", "bench", "rack", "plates", "pull_up_bar", "dumbbell", "kettlebell"] as EquipmentType[]
        ).map((type) => ({ type })),
        availableSpace: "moderate",
        floorSafe: true,
      },
      request: makeRequest({
        requestId: "asymmetry",
        durationMinutes: 45,
        primaryObjective: { adaptationDomain: "maximum_strength" },
        requiredModules: ["core"],
      }),
    });

    const { selectedExerciseIds, result, derivedEquipmentCapabilities } = runScenario(input);

    expect(selectedExerciseIds).toContain("hollow_body_hold");
    expect(derivedEquipmentCapabilities).not.toContain("open_space");

    if (result.prescription?.status !== "prescribed") {
      throw new Error(`Expected status "prescribed", got "${result.prescription?.status}".`);
    }
    expect(result.prescription.unprescribedSelectedExercises.map((gap) => gap.exerciseId)).toEqual([
      "hollow_body_hold",
    ]);
    expect(omissionWarnings(result)).toHaveLength(1);
  });
});
