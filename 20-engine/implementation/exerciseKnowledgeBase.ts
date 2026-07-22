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
// Medicine-Ball Slam
// Source: 50-exercises/67_BALLISTICS/14_MED_BALL_SLAM.md
// -----------------------------------------------------------------------------

/**
 * No wall or partner requirement: the canonical documentation never
 * mentions either for this exercise — its "Equipment" line names only
 * "Slam Ball or Non-Rebounding Medicine Ball, Suitable Floor Surface".
 * `slam_ball` (not `medicine_ball`) is used because the documentation
 * explicitly requires a non-rebounding implement throughout ("Safety
 * Rules" — "Use a slam ball or appropriate non-rebounding medicine ball";
 * "Absolute Contraindications" — "an unsuitable floor and ball setup"); a
 * plain `medicine_ball` equipment entry does not guarantee that property.
 * This also matches the equipment vocabulary
 * `prescription/exercisePrescriptionRegistry.ts` already uses for this
 * same exercise (`requiredEquipmentCapabilities: ["slam_ball",
 * "safe_landing_surface"]`) — consistent naming across both layers for
 * the same physical constraint, even though this file never reads or
 * depends on that registry.
 */
export const MED_BALL_SLAM: ExerciseDefinition = {
  id: "med_ball_slam",
  name: "Medicine-Ball Slam",
  module: "power",
  primaryAdaptation: "power",
  physicalQualities: ["explosive_strength", "rate_of_force_development", "trunk_strength"],
  movementPatterns: ["throw"],
  forceVectors: ["downward"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "slam_ball" },
          { kind: "environment", capability: "throwing_allowed" },
          { kind: "environment", capability: "safe_landing_surface" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "limited" },
        ],
      },
    ],
  },
  minimumTechnicalLevel: 1,
  complexity: "low",
  unilateral: false,
  bodyRegionsLoaded: ["abdomen", "shoulder", "upper_arm"],
  contraindications: [
    {
      description: "Acute upper-limb injury (shoulder, elbow, wrist or hand).",
      prohibitedPatterns: ["throw"],
      absolute: true,
    },
    {
      description: "Acute spinal injury (cervical, thoracic or lumbar).",
      prohibitedPatterns: ["throw"],
      absolute: true,
    },
    {
      region: "abdomen",
      description: "Acute abdominal or rib injury.",
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
    metabolic: 2,
    connectiveTissue: 2,
    technical: 2,
  },
  evidenceLevel: "unknown",
  combatSportRelevance: {
    boxing: 3,
    kickboxing: 4,
    muay_thai: 4,
    mma: 4,
    wrestling: 4,
    judo: 3,
    brazilian_jiu_jitsu: 3,
    krav_maga: 4,
  },
  substitutionExerciseIds: ["med_ball_overhead_throw", "med_ball_rotational_throw", "med_ball_scoop_toss"],
};

// -----------------------------------------------------------------------------
// Medicine-Ball Overhead Throw
// Source: 50-exercises/67_BALLISTICS/11_MED_BALL_OVERHEAD_THROW.md
// -----------------------------------------------------------------------------

/**
 * KNOWN LIMITATION — `MED_BALL_OVERHEAD_THROW_WALL_VARIANT_UNPRESCRIBABLE`
 *
 * The canonical documentation ("Exercise Identity" — "Equipment: Medicine
 * Ball, Open Space or Wall") supports two independent setups: throwing into
 * open space, or throwing against a wall. As with `med_ball_chest_pass`
 * (see `MED_BALL_CHEST_PASS_PARTNER_VARIANT_UNPRESCRIBABLE` above), this is
 * a CAS Engine eligibility decision, not a VITA one — `requirements` below
 * matches that full documented reality (`open_space` OR `usable_wall`), not
 * the narrower scope already integrated one layer downstream:
 * `prescription/exercisePrescriptionRegistry.ts` currently integrates
 * `med_ball_overhead_throw` as the open-space variant only
 * (`requiredEquipmentCapabilities: ["medicine_ball", "open_space"]` — see
 * `__tests__/prescription/ballisticExercises.test.ts`,
 * "med_ball_overhead_throw — open-space variant"). No wall-based
 * prescription path exists.
 *
 * Consequence: an athlete/environment combination that satisfies this
 * exercise's `requirements` solely through the `usable_wall` branch
 * (medicine ball + throwing allowed + sufficient space + a usable wall, but
 * no `open_space` equipment declared) will pass `checkExerciseEligibility`
 * here, then fail at `getExercisePrescriptionSource`/`prescribeExercise`
 * for lack of the `open_space` equipment capability the registry still
 * requires today. Same deliberate, documented gap as the chest-pass
 * partner branch — not a bug, and not something this file's `requirements`
 * should narrow to hide. Closing it is out of scope for this wiring step.
 */
export const MED_BALL_OVERHEAD_THROW_WALL_VARIANT_UNPRESCRIBABLE =
  "med_ball_overhead_throw: eligible via the `usable_wall` branch of its " +
  "Exercise Requirements Model, but exercisePrescriptionRegistry.ts (V0.1) " +
  "only integrates the open-space variant (`medicine_ball` + `open_space`) " +
  "— a wall-only eligibility result cannot currently be prescribed.";

export const MED_BALL_OVERHEAD_THROW: ExerciseDefinition = {
  id: "med_ball_overhead_throw",
  name: "Medicine-Ball Overhead Throw",
  module: "power",
  primaryAdaptation: "power",
  physicalQualities: ["explosive_strength", "rate_of_force_development"],
  movementPatterns: ["throw", "vertical_push"],
  // Documented force vector varies by variation (vertical, forward,
  // backward) with no single fixed default named for the base entry —
  // "mixed" is the only non-invented, honest representation.
  forceVectors: ["mixed"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "medicine_ball" },
          { kind: "environment", capability: "throwing_allowed" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "moderate" },
        ],
      },
      {
        kind: "any_of",
        items: [
          { kind: "equipment", equipment: "open_space" },
          { kind: "environment", capability: "usable_wall" },
        ],
      },
    ],
  },
  // "Complexity: Low to Moderate" in the source doc — rounded up to
  // "moderate" (minimumTechnicalLevel: 2), rather than down to "low"/1 as
  // used for med_ball_chest_pass and med_ball_slam: this exercise's own
  // documentation flags sequencing quality and safe release angle as
  // meaningfully more demanding than the plain-"Low" ballistic exercises —
  // a conservative, safety-oriented rounding, not an invented constraint.
  minimumTechnicalLevel: 2,
  complexity: "moderate",
  unilateral: false,
  bodyRegionsLoaded: ["hip", "thigh", "lower_leg", "shoulder", "upper_arm"],
  contraindications: [
    {
      description: "Acute upper-limb injury (shoulder, elbow, wrist or hand).",
      prohibitedPatterns: ["throw"],
      absolute: true,
    },
    {
      description: "Acute spinal injury (cervical, thoracic or lumbar).",
      prohibitedPatterns: ["throw"],
      absolute: true,
    },
    {
      description: "Uncontrolled neurological weakness affecting the athlete's ability to throw safely.",
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
    technical: 3,
  },
  evidenceLevel: "unknown",
  combatSportRelevance: {
    boxing: 3,
    kickboxing: 4,
    muay_thai: 4,
    mma: 4,
    wrestling: 4,
    judo: 4,
    brazilian_jiu_jitsu: 3,
    krav_maga: 4,
  },
  substitutionExerciseIds: [
    "med_ball_reverse_throw",
    "med_ball_slam",
    "push_press",
    "med_ball_scoop_toss",
    "jump_shrug",
  ],
};

// -----------------------------------------------------------------------------
// Catalog
// -----------------------------------------------------------------------------

export const EXERCISE_KNOWLEDGE_BASE: readonly ExerciseDefinition[] = [
  MED_BALL_CHEST_PASS,
  MED_BALL_SLAM,
  MED_BALL_OVERHEAD_THROW,
];
