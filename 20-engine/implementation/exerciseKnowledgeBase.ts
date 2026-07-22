/**
 * Combat Athlete System — Exercise Knowledge Base
 * Version 0.1
 *
 * The first production `ExerciseDefinition` entries wired into the CAS
 * Engine. No such catalog existed before this file — `checkExerciseEligibility`
 * (see `exerciseSelector.ts`) previously only ever ran against synthetic
 * `ExerciseDefinition` objects built by test fixtures. This file is the
 * pilot integration point for the Exercise Requirements Model
 * (`requirements` — see `exerciseRequirements.ts`/`types.ts`): every entry
 * below uses `requirements` as its sole source of truth for equipment,
 * environment and human-assistance gating, per the coexistence invariant
 * (`requiredEquipment: []`, `optionalEquipment` absent).
 *
 * Not yet wired into `index.ts`/`runEngine` — that integration is a
 * separate, later step. This file is consumed today only by its own tests.
 */

import type { ExerciseDefinition } from "./types";

// -----------------------------------------------------------------------------
// Medicine-Ball Chest Pass
// Source: 50-exercises/67_BALLISTICS/10_MED_BALL_CHEST_PASS.md
// -----------------------------------------------------------------------------

/**
 * KNOWN LIMITATION — `MED_BALL_CHEST_PASS_PARTNER_VARIANT_UNPRESCRIBABLE`
 *
 * The canonical documentation (see source above, "Exercise Identity" —
 * "Equipment: Medicine Ball, Wall or Partner") supports two independent
 * setups: throwing against a wall, or throwing to/from a partner. This is
 * a CAS Engine decision, not a VITA one — the Exercise Requirements Model
 * below is deliberately built to match that full documented reality
 * (`usable_wall` OR `partner`), not the narrower scope already integrated
 * one layer downstream: `prescription/exercisePrescriptionRegistry.ts`
 * currently integrates `med_ball_chest_pass` as "WALL VARIANT ONLY" —
 * `medicine_ball` AND `wall` required together, with no partner-based path
 * (see `__tests__/prescription/ballisticExercises.test.ts`,
 * "med_ball_chest_pass requires both medicine_ball and wall — neither
 * alone suffices").
 *
 * Consequence: an athlete/environment combination that satisfies this
 * exercise's `requirements` solely through the `partner` branch (medicine
 * ball + throwing allowed + sufficient space + partner available, but no
 * usable wall) will pass `checkExerciseEligibility` here, then fail at
 * `getExercisePrescriptionSource`/`prescribeExercise` for lack of the
 * `wall` equipment capability the registry still requires today.
 *
 * This is a deliberate, explicit, documented gap — not a silent one:
 * eligibility must reflect the exercise's full documented reality, and the
 * CAS Engine must never let the prescription layer's current integration
 * scope quietly narrow what the selection layer considers possible.
 * Closing this gap (e.g. adding a partner-only prescription variant, or
 * surfacing an explicit "eligible, unprescribable" outcome in the engine
 * run result / Decision Trace) is out of scope for this wiring step and
 * does not change the prescription contract here.
 */
export const MED_BALL_CHEST_PASS_PARTNER_VARIANT_UNPRESCRIBABLE =
  "med_ball_chest_pass: eligible via the `partner` branch of its Exercise " +
  "Requirements Model, but exercisePrescriptionRegistry.ts (V0.1) only " +
  "integrates the wall variant (`medicine_ball` + `wall`) — a partner-only " +
  "eligibility result cannot currently be prescribed.";

export const MED_BALL_CHEST_PASS: ExerciseDefinition = {
  id: "med_ball_chest_pass",
  name: "Medicine-Ball Chest Pass",
  module: "power",
  primaryAdaptation: "power",
  physicalQualities: ["explosive_strength", "rate_of_force_development"],
  movementPatterns: ["throw", "horizontal_push"],
  forceVectors: ["horizontal"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "medicine_ball" },
          { kind: "environment", capability: "throwing_allowed" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "limited" },
        ],
      },
      {
        kind: "any_of",
        items: [
          { kind: "environment", capability: "usable_wall" },
          { kind: "human_assistance", assistance: "partner" },
        ],
      },
    ],
  },
  minimumTechnicalLevel: 1,
  complexity: "low",
  unilateral: false,
  bodyRegionsLoaded: ["chest", "shoulder", "upper_arm"],
  contraindications: [
    {
      description: "Acute upper-limb injury (shoulder, elbow, wrist or hand).",
      prohibitedPatterns: ["throw"],
      absolute: true,
    },
    {
      region: "chest",
      description: "Acute rib or chest injury.",
      prohibitedPatterns: ["throw"],
      absolute: true,
    },
    {
      description: "Neurological weakness affecting the athlete's ability to release the ball safely.",
      prohibitedPatterns: ["throw"],
      absolute: true,
    },
  ],
  fatigueProfile: {
    types: ["neural", "muscular", "connective_tissue", "systemic"],
    neural: 3,
    muscular: 2,
    metabolic: 1,
    connectiveTissue: 2,
    technical: 2,
  },
  evidenceLevel: "unknown",
  combatSportRelevance: {
    boxing: 4,
    kickboxing: 4,
    muay_thai: 4,
    mma: 4,
    wrestling: 3,
    judo: 3,
    brazilian_jiu_jitsu: 3,
    krav_maga: 4,
  },
  substitutionExerciseIds: ["med_ball_shot_put_throw", "med_ball_rotational_throw", "push_press"],
};

// -----------------------------------------------------------------------------
// Catalog
// -----------------------------------------------------------------------------

export const EXERCISE_KNOWLEDGE_BASE: readonly ExerciseDefinition[] = [MED_BALL_CHEST_PASS];
