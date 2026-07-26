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
// Medicine-Ball Rotational Throw
// Source: 50-exercises/67_BALLISTICS/12_MED_BALL_ROTATIONAL_THROW.md
// -----------------------------------------------------------------------------

/**
 * KNOWN LIMITATION — `MED_BALL_ROTATIONAL_THROW_PARTNER_VARIANT_UNPRESCRIBABLE`
 *
 * Same gap as `med_ball_chest_pass` (see
 * `MED_BALL_CHEST_PASS_PARTNER_VARIANT_UNPRESCRIBABLE` above): the canonical
 * documentation ("Exercise Identity" — "Equipment: Medicine Ball, Wall or
 * Partner") supports throwing against a wall or to/from a partner.
 * `prescription/exercisePrescriptionRegistry.ts` currently integrates
 * `med_ball_rotational_throw` as "WALL VARIANT ONLY"
 * (`requiredEquipmentCapabilities: ["medicine_ball", "wall"]`, no
 * partner-based path). An eligibility result obtained solely through the
 * `partner` branch of `requirements` below will therefore pass
 * `checkExerciseEligibility` but cannot currently be prescribed. Deliberate,
 * documented gap — not a bug, and out of scope to close in this step.
 */
export const MED_BALL_ROTATIONAL_THROW_PARTNER_VARIANT_UNPRESCRIBABLE =
  "med_ball_rotational_throw: eligible via the `partner` branch of its " +
  "Exercise Requirements Model, but exercisePrescriptionRegistry.ts (V0.1) " +
  "only integrates the wall variant (`medicine_ball` + `wall`) — a " +
  "partner-only eligibility result cannot currently be prescribed.";

export const MED_BALL_ROTATIONAL_THROW: ExerciseDefinition = {
  id: "med_ball_rotational_throw",
  name: "Medicine-Ball Rotational Throw",
  module: "power",
  primaryAdaptation: "power",
  physicalQualities: ["rate_of_force_development", "trunk_strength", "coordination"],
  // The rotational/lateral character of this exercise lives entirely in
  // biomechanical classification fields (movementPatterns, forceVectors,
  // unilateral), never in `requirements` — no ad hoc "rotation" capability
  // is introduced in the Exercise Requirements Model for this.
  movementPatterns: ["rotation", "throw"],
  forceVectors: ["rotational", "horizontal"],
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
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // "Unilateral Emphasis with Bilateral Support" in the source doc — no
  // direct three-way match against this engine's plain boolean `unilateral`
  // field. Resolved the same way exercisePrescriptionRegistry.ts already
  // resolved the identical documented phrase for this exact exercise
  // (`laterality: "unilateral"`): represented as `unilateral: true`.
  unilateral: true,
  bodyRegionsLoaded: ["hip", "abdomen", "chest", "shoulder"],
  contraindications: [
    {
      description: "Acute spinal injury (cervical, thoracic or lumbar).",
      prohibitedPatterns: ["rotation", "throw"],
      absolute: true,
    },
    {
      region: "ribcage",
      description: "Acute rib injury.",
      prohibitedPatterns: ["rotation", "throw"],
      absolute: true,
    },
    {
      region: "hip",
      description: "Acute hip injury.",
      prohibitedPatterns: ["rotation", "throw"],
      absolute: true,
    },
    {
      description: "Acute upper-limb injury (shoulder, elbow, wrist or hand).",
      prohibitedPatterns: ["rotation", "throw"],
      absolute: true,
    },
    {
      description: "Inability to rotate safely through the hips and trunk.",
      prohibitedPatterns: ["rotation", "throw"],
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
    boxing: 5,
    kickboxing: 5,
    muay_thai: 5,
    mma: 5,
    wrestling: 4,
    judo: 5,
    brazilian_jiu_jitsu: 4,
    krav_maga: 5,
  },
  substitutionExerciseIds: ["med_ball_scoop_toss", "med_ball_shot_put_throw", "med_ball_chest_pass", "pallof_press"],
};

// -----------------------------------------------------------------------------
// Medicine-Ball Scoop Toss
// Source: 50-exercises/67_BALLISTICS/13_MED_BALL_SCOOP_TOSS.md
// -----------------------------------------------------------------------------

/**
 * KNOWN LIMITATION — `MED_BALL_SCOOP_TOSS_WALL_VARIANT_UNPRESCRIBABLE`
 *
 * Same shape of gap as `med_ball_overhead_throw` (see
 * `MED_BALL_OVERHEAD_THROW_WALL_VARIANT_UNPRESCRIBABLE` above), not
 * `med_ball_chest_pass`'s: the canonical documentation ("Exercise Identity"
 * — "Equipment: Medicine Ball, Wall or Open Space") supports throwing
 * against a wall or into open space — no partner variant is documented at
 * all for this exercise. `prescription/exercisePrescriptionRegistry.ts`
 * currently integrates `med_ball_scoop_toss` as the open-space variant only
 * (`requiredEquipmentCapabilities: ["medicine_ball", "open_space"]`, per
 * `__tests__/prescription/ballisticExercises.test.ts` — "STANDING
 * ROTATIONAL VARIANT ONLY, open space"). No wall-based prescription path
 * exists. An eligibility result obtained solely through the `usable_wall`
 * branch of `requirements` below will therefore pass
 * `checkExerciseEligibility` but cannot currently be prescribed. Deliberate,
 * documented gap — not a bug, and out of scope to close in this step.
 */
export const MED_BALL_SCOOP_TOSS_WALL_VARIANT_UNPRESCRIBABLE =
  "med_ball_scoop_toss: eligible via the `usable_wall` branch of its " +
  "Exercise Requirements Model, but exercisePrescriptionRegistry.ts (V0.1) " +
  "only integrates the open-space variant (`medicine_ball` + `open_space`) " +
  "— a wall-only eligibility result cannot currently be prescribed.";

export const MED_BALL_SCOOP_TOSS: ExerciseDefinition = {
  id: "med_ball_scoop_toss",
  name: "Medicine-Ball Scoop Toss",
  module: "power",
  primaryAdaptation: "power",
  physicalQualities: ["rate_of_force_development"],
  // The "scoop" character, throw direction, hip extension and movement
  // plane live entirely in biomechanical classification fields
  // (movementPatterns, forceVectors) — no ad hoc "scoop" capability is
  // introduced in the Exercise Requirements Model for this.
  movementPatterns: ["throw", "rotation"],
  // Doc's own Primary Pattern: "Diagonal or Rotational Ballistic
  // Projection" — quoted directly, not the vaguer variation-dependent
  // options ("upward", "upward and forward") listed only under "Force
  // Vector" for alternate, non-default variations.
  forceVectors: ["diagonal", "rotational"],
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
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // "Unilateral Emphasis with Bilateral Support" in the source doc —
  // resolved the same way as med_ball_rotational_throw's identical
  // documented phrase, matching exercisePrescriptionRegistry.ts's own
  // `laterality: "unilateral"` resolution for this exact exercise.
  unilateral: true,
  bodyRegionsLoaded: ["hip", "thigh", "abdomen", "shoulder"],
  contraindications: [
    {
      description: "Acute spinal injury (cervical, thoracic or lumbar).",
      prohibitedPatterns: ["rotation", "throw"],
      absolute: true,
    },
    {
      region: "hip",
      description: "Acute hip injury.",
      prohibitedPatterns: ["rotation", "throw"],
      absolute: true,
    },
    {
      region: "knee",
      description: "Acute knee injury.",
      prohibitedPatterns: ["rotation", "throw"],
      absolute: true,
    },
    {
      description: "Acute upper-limb injury (shoulder, elbow, wrist or hand).",
      prohibitedPatterns: ["rotation", "throw"],
      absolute: true,
    },
    {
      description: "Inability to rotate or extend safely through the hips and trunk.",
      prohibitedPatterns: ["rotation", "throw"],
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
    boxing: 4,
    kickboxing: 5,
    muay_thai: 5,
    mma: 5,
    wrestling: 5,
    judo: 5,
    brazilian_jiu_jitsu: 4,
    krav_maga: 5,
  },
  substitutionExerciseIds: [
    "med_ball_rotational_throw",
    "med_ball_overhead_throw",
    "med_ball_shot_put_throw",
    "jump_shrug",
  ],
};

// -----------------------------------------------------------------------------
// Medicine-Ball Shot-Put Throw
// Source: 50-exercises/67_BALLISTICS/15_MED_BALL_SHOT_PUT_THROW.md
// -----------------------------------------------------------------------------

/**
 * KNOWN LIMITATION — `MED_BALL_SHOT_PUT_THROW_WALL_VARIANT_UNPRESCRIBABLE`
 *
 * Same shape of gap as `med_ball_overhead_throw`/`med_ball_scoop_toss`: the
 * canonical documentation ("Exercise Identity" — "Equipment: Medicine Ball,
 * Wall or Open Space") supports throwing against a wall or into open
 * space — no partner variant is documented at all for this exercise (the
 * repeated "train both sides" / "both sides can be trained safely"
 * language throughout the doc is a bilateral-training recommendation for a
 * unilateral movement, not a human-assistance requirement — it is
 * deliberately not represented as a `human_assistance` atom).
 * `prescription/exercisePrescriptionRegistry.ts` currently integrates
 * `med_ball_shot_put_throw` as the open-space variant only
 * (`requiredEquipmentCapabilities: ["medicine_ball", "open_space"]`). No
 * wall-based prescription path exists. An eligibility result obtained
 * solely through the `usable_wall` branch of `requirements` below will
 * therefore pass `checkExerciseEligibility` but cannot currently be
 * prescribed. Deliberate, documented gap — not a bug, and out of scope to
 * close in this step.
 */
export const MED_BALL_SHOT_PUT_THROW_WALL_VARIANT_UNPRESCRIBABLE =
  "med_ball_shot_put_throw: eligible via the `usable_wall` branch of its " +
  "Exercise Requirements Model, but exercisePrescriptionRegistry.ts (V0.1) " +
  "only integrates the open-space variant (`medicine_ball` + `open_space`) " +
  "— a wall-only eligibility result cannot currently be prescribed.";

export const MED_BALL_SHOT_PUT_THROW: ExerciseDefinition = {
  id: "med_ball_shot_put_throw",
  name: "Medicine-Ball Shot-Put Throw",
  module: "power",
  primaryAdaptation: "power",
  physicalQualities: ["explosive_strength", "rate_of_force_development"],
  // Primary Pattern is plainly "Unilateral Horizontal Ballistic
  // Projection" — no "rotational" wording in this exercise's own identity
  // block (unlike med_ball_rotational_throw/med_ball_scoop_toss). The doc's
  // "Rotational and Translational Contribution" section frames rotation as
  // an optional, variation-dependent emphasis, not this exercise's own
  // default classification, so "rotation" is deliberately not added here.
  // No ad hoc "shot put" capability is introduced anywhere.
  movementPatterns: ["throw"],
  // Doc's own Force Vector: "Primary vector: horizontal and forward." —
  // quoted directly.
  forceVectors: ["horizontal", "forward"],
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
          { kind: "equipment", equipment: "open_space" },
          { kind: "environment", capability: "usable_wall" },
        ],
      },
    ],
  },
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // "Unilateral or Bilateral: Unilateral" in the source doc — plain,
  // unambiguous (unlike med_ball_rotational_throw/med_ball_scoop_toss's
  // compound "Unilateral Emphasis with Bilateral Support" phrasing).
  // Matches exercisePrescriptionRegistry.ts's own `laterality: "unilateral"`
  // for this exact exercise.
  unilateral: true,
  bodyRegionsLoaded: ["chest", "shoulder", "upper_arm", "abdomen", "hip", "thigh"],
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
      region: "ribcage",
      description: "Acute rib injury.",
      prohibitedPatterns: ["throw"],
      absolute: true,
    },
    {
      description: "Inability to stand safely in a staggered stance.",
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
    boxing: 5,
    kickboxing: 5,
    muay_thai: 5,
    mma: 5,
    wrestling: 4,
    judo: 3,
    brazilian_jiu_jitsu: 3,
    krav_maga: 5,
  },
  substitutionExerciseIds: ["med_ball_chest_pass", "med_ball_rotational_throw", "med_ball_scoop_toss"],
};

// -----------------------------------------------------------------------------
// Medicine-Ball Reverse Throw
// Source: 50-exercises/67_BALLISTICS/16_MED_BALL_REVERSE_THROW.md
// -----------------------------------------------------------------------------

/**
 * Unlike every other ballistic exercise integrated so far, this exercise's
 * canonical documentation names exactly one setup — "Exercise Identity" —
 * "Equipment: Medicine Ball, Open Space" — with no wall or partner
 * alternative documented anywhere in the chapter. No `any_of` clause is
 * therefore needed, and no `MED_BALL_REVERSE_THROW_..._UNPRESCRIBABLE`
 * known-limitation constant is required: `exercisePrescriptionRegistry.ts`
 * already integrates the exact same equipment pair
 * (`requiredEquipmentCapabilities: ["medicine_ball", "open_space"]`), so
 * there is no wall/partner branch our eligibility layer permits that the
 * prescription layer cannot serve. The backward throw direction itself is
 * represented entirely through existing biomechanical fields
 * (`forceVectors: ["upward", "backward"]`) — no ad hoc "reverse" or
 * "backward-projection" capability is introduced in the Exercise
 * Requirements Model.
 */
export const MED_BALL_REVERSE_THROW: ExerciseDefinition = {
  id: "med_ball_reverse_throw",
  name: "Medicine-Ball Reverse Throw",
  module: "power",
  primaryAdaptation: "power",
  physicalQualities: ["explosive_strength", "rate_of_force_development"],
  // Primary Pattern: "Backward Whole-Body Ballistic Projection" — a throw;
  // the backward direction itself lives in forceVectors below, not here.
  movementPatterns: ["throw"],
  // Force Vector: "Primary vector: upward and backward." — quoted directly.
  forceVectors: ["upward", "backward"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "medicine_ball" },
          { kind: "equipment", equipment: "open_space" },
          { kind: "environment", capability: "throwing_allowed" },
          // Safety Rules: "Use a suitable landing surface." — explicit,
          // same treatment as med_ball_slam's floor requirement.
          { kind: "environment", capability: "safe_landing_surface" },
          // 90_COMPARISON.md, "Space Requirement Comparison" — "Highest
          // Space Requirement: Reverse Throw. Reverse Throw requires a
          // fully clear area behind the athlete." The rear-clearance
          // requirement is translated using the existing sufficient_space
          // capability at its highest documented tier, not a new one.
          { kind: "environment", capability: "sufficient_space", minimumSpace: "open" },
        ],
      },
    ],
  },
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // "Unilateral or Bilateral: Bilateral" — plain, unambiguous. Matches
  // exercisePrescriptionRegistry.ts's own `laterality: "bilateral"` for
  // this exact exercise.
  unilateral: false,
  bodyRegionsLoaded: ["hip", "thigh", "lower_leg", "shoulder", "upper_arm"],
  contraindications: [
    {
      description: "Acute spinal injury (cervical, thoracic or lumbar).",
      prohibitedPatterns: ["throw"],
      absolute: true,
    },
    {
      description: "Acute lower-limb injury (hip, knee, ankle or foot).",
      prohibitedPatterns: ["throw"],
      absolute: true,
    },
    {
      description: "Acute upper-limb injury (shoulder, elbow, wrist or hand).",
      prohibitedPatterns: ["throw"],
      absolute: true,
    },
    {
      description: "Inability to project the ball backward safely.",
      prohibitedPatterns: ["throw"],
      absolute: true,
    },
    {
      description: "Severe balance impairment.",
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
    wrestling: 5,
    judo: 5,
    brazilian_jiu_jitsu: 4,
    krav_maga: 4,
  },
  substitutionExerciseIds: ["med_ball_overhead_throw", "med_ball_scoop_toss", "jump_shrug", "broad_jump"],
};

// -----------------------------------------------------------------------------
// Box Jump
// Source: 50-exercises/63_PLYOMETRICS/10_BOX_JUMP.md
// -----------------------------------------------------------------------------

/**
 * First Plyometrics-category entry and first entry of this knowledge base
 * with no throwing/wall/partner requirement at all — this is a jump, not a
 * throw. Its box height, progression, regression and technical-failure
 * criteria (both extensively documented in the source chapter) are
 * deliberately NOT represented in `requirements`: box height is a
 * prescription/coaching concern (belongs with load/volume selection, not
 * eligibility), and progression/regression/stop-condition logic already has
 * its own dedicated layers (`prescription/exercisePrescriptionRegistry.ts`'s
 * `boxJumpEntry` — stop conditions, instructions) which this file never
 * duplicates. `requirements` here answers exactly one question: is a stable
 * plyometric box, a safe landing surface, permission to jump and enough
 * space available — nothing about how high, how many, or how to progress.
 *
 * `plyometric_box` (not the generic `box` equipment type) is used because
 * "Equipment Requirements" names a specific implement — "Stable plyometric
 * box" / "Stable low platform specifically designed to support landing" —
 * not an approximate general-purpose box. `exercisePrescriptionRegistry.ts`
 * already integrates this exact exercise with
 * `requiredEquipmentCapabilities: ["plyometric_box", "safe_landing_surface"]`,
 * confirming both the equipment vocabulary and the landing-surface capability
 * chosen below independently from the source documentation.
 */
export const BOX_JUMP: ExerciseDefinition = {
  id: "box_jump",
  name: "Box Jump",
  module: "power",
  primaryAdaptation: "power",
  // "Rate of Force Development ★★★★★" and "Explosive Strength" are both
  // explicit, separately-labeled fields in the source doc. "Landing
  // Mechanics" (Secondary Classifications) maps to "stability" — the
  // closest direct PhysicalQuality match for landing control.
  physicalQualities: ["explosive_strength", "rate_of_force_development", "stability"],
  // Movement Pattern — Primary: "Bilateral Vertical Jump".
  movementPatterns: ["jump"],
  // Biomechanical Profile — "Primary Force Vector: Vertical." The
  // documented "Secondary Force Vector" is explicitly variable ("Slight
  // Anterior-Posterior Component Depending on Box Distance") — too
  // conditional to commit to a specific enum value without overreaching.
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "plyometric_box" },
          { kind: "environment", capability: "jumping_allowed" },
          // "Equipment Requirements": the box surface itself must be
          // "Non-slip, Structurally stable, ... Free from sharp edges or
          // obstacles" — a landing-surface concern, not a distinct
          // "general floor safety" concern the doc never separates out.
          // `floor_safe` is deliberately NOT added alongside this.
          { kind: "environment", capability: "safe_landing_surface" },
          // "Space Requirements: Low to Moderate" — clear floor space in
          // front of the box, ceiling clearance, lateral clearance and an
          // unobstructed step-down area around a single station. No
          // exercise-comparison table exists yet for Plyometrics (unlike
          // Ballistics' 90_COMPARISON.md), so this is an interpretive but
          // conservative reading of "Low to Moderate": closer to the
          // compact, single-station Ballistics entries already using
          // "limited" (Chest Pass, Slam, Rotational Throw, Shot-Put
          // Throw) than to the larger "moderate"/"open" tiers reserved for
          // exercises with a genuine multi-metre throwing arc.
          { kind: "environment", capability: "sufficient_space", minimumSpace: "limited" },
        ],
      },
    ],
  },
  // Skill Requirement: "Moderate". Technical Complexity — Overall
  // Complexity: "Moderate".
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // Movement Pattern / Movement Context repeatedly state "Bilateral".
  // Matches exercisePrescriptionRegistry.ts's own `laterality: "bilateral"`.
  unilateral: false,
  bodyRegionsLoaded: ["hip", "thigh", "lower_leg"],
  // "Contraindications and Restrictions — Avoid or modify when the athlete
  // presents: ...". This doc has no distinctly-labeled "Absolute
  // Contraindications" heading (unlike the Ballistics chapters); the "Avoid
  // or modify" list is treated as the absolute tier here, since it reads as
  // stronger than the separate, deliberately-excluded "Use caution with:"
  // list (matching how Ballistics' own "Relative Contraindications"
  // sections were never encoded). "Insufficient clearance of the box edge"
  // and "Unstable or inappropriate equipment" are excluded — both are
  // environment/equipment concerns already covered by `requirements`
  // above, not athlete-state contraindications. "Medical restrictions on
  // jumping or impact" is excluded as non-actionable here — restriction
  // matching is already handled generically by
  // `AthleteRestriction`/`checkHardRestrictionProhibitsMovement` in
  // `exerciseSelector.ts`, independently of this list.
  contraindications: [
    {
      description: "Acute ankle, knee, hip or foot injury.",
      prohibitedPatterns: ["jump"],
      absolute: true,
    },
    {
      description: "Active Achilles or patellar tendon pain.",
      prohibitedPatterns: ["jump"],
      absolute: true,
    },
    {
      description: "Recent lower-limb surgery.",
      prohibitedPatterns: ["jump"],
      absolute: true,
    },
    {
      description: "Poor bilateral landing control.",
      prohibitedPatterns: ["jump"],
      absolute: true,
    },
    {
      description: "Significant fear or hesitation around the box.",
      prohibitedPatterns: ["jump"],
      absolute: true,
    },
    {
      description: "Severe fatigue or impaired coordination.",
      prohibitedPatterns: ["jump"],
      absolute: true,
    },
  ],
  fatigueProfile: {
    // This doc's own Fatigue Profile uses different dimension names than
    // the Ballistics chapters (Local Muscular / Central Neuromuscular /
    // Tendon and Joint Exposure / Metabolic), mapped onto the same fixed
    // ExerciseFatigueProfile shape. "impact" is included given the
    // extensive documented landing-impact stress (Joint Stress Profile,
    // Safety Profile) — the first knowledge-base entry to warrant it.
    types: ["neural", "muscular", "connective_tissue", "impact"],
    neural: 3, // "Central Neuromuscular Fatigue: Moderate"
    muscular: 2, // "Local Muscular Fatigue: Low to Moderate"
    metabolic: 1, // "Metabolic Fatigue: Low when programmed correctly"
    connectiveTissue: 3, // "Tendon and Joint Exposure: Moderate"
    technical: 3, // Technical Complexity: "Moderate"
  },
  // The source doc has a real "# Evidence Classification" section
  // ("Moderate to High for jump training...", "High for the importance of
  // low-fatigue, maximal-intent execution..."), unlike every Ballistics
  // chapter integrated so far. It is still left "unknown" here: there is no
  // documented crosswalk between this narrative evidence language and the
  // engine's level_1/level_2/level_3 taxonomy, and guessing one would be
  // exactly the kind of invented fact this project's scientific-integrity
  // principle forbids. This is a known representational gap, not an
  // absence of evidence discussion in the source.
  evidenceLevel: "unknown",
  // combatSportRelevance intentionally omitted: "Combat Transfer" states
  // explicitly — "The transfer is general rather than sport-specific." —
  // and no per-sport breakdown exists anywhere in this chapter (unlike
  // every integrated Ballistics exercise's "Sport-Specific Relevance"
  // section). Inventing individual sport ratings here would directly
  // contradict the documentation's own stated position.
  substitutionExerciseIds: ["countermovement_jump", "broad_jump", "knee_jump", "single_leg_hop", "med_ball_scoop_toss"],
};

// -----------------------------------------------------------------------------
// Depth Jump
// Source: 50-exercises/63_PLYOMETRICS/11_DEPTH_JUMP.md
// -----------------------------------------------------------------------------

/**
 * Second Plyometrics-category entry. Like `BOX_JUMP`, this is a jump with
 * no throwing/wall/partner requirement — `requirements` answers only
 * whether an elevated platform, permission to jump, a safe landing surface
 * and enough space are available; drop height, ground-contact time,
 * rebound quality and the extensive Technical Failure Criteria in the
 * source chapter are prescription/coaching concerns
 * (`prescription/exercisePrescriptionRegistry.ts`'s `depthJumpEntry` —
 * stop conditions, instructions), never represented as capabilities here.
 *
 * Depth Jump is not treated as `box_jump` with a different name: its own
 * documentation is read independently (Primary Adaptation "Reactive
 * Strength" vs. Box Jump's plain "Power"; "Overall Technical Complexity:
 * High" vs. Box Jump's "Moderate"; a documented Skill Requirement of
 * "High" with explicit prerequisites including "Competent box jump" —
 * i.e. Box Jump sits *below* Depth Jump in the plyometric progression,
 * not beside it).
 *
 * `plyometric_box` (not a generic `box`) is used for the same reason as
 * `BOX_JUMP`: "Equipment Requirements" names a "Stable Elevated Platform"
 * that "must not wobble, slide or have sharp exposed edges" — the
 * Progression Model's own Stage 1 names "Low Box Jumps" and the Skill
 * Requirement's own prerequisites name "Competent box jump", both
 * confirming the elevated platform in question is the same stable
 * plyometric box already integrated for `box_jump`, not an ad hoc
 * "elevated platform" capability. `exercisePrescriptionRegistry.ts`
 * already integrates this exact exercise with
 * `requiredEquipmentCapabilities: ["plyometric_box", "safe_landing_surface"]`,
 * confirming both the equipment vocabulary and the landing-surface
 * capability chosen below independently from the source documentation.
 *
 * `floor_safe` is deliberately NOT added alongside `safe_landing_surface`:
 * the source names one "Appropriate Landing Surface" requirement, never
 * separating a general floor-safety concern from the landing surface
 * itself (matching `BOX_JUMP`'s identical treatment, and the fact that
 * both capabilities read the same `TrainingEnvironment.floorSafe` field —
 * see `exerciseRequirements.ts`).
 *
 * "Space Requirements" documents "Vertical Space: Moderate to High" and
 * requires the athlete to "complete the rebound without contacting walls,
 * equipment or other athletes" — a materially higher bar than `box_jump`'s
 * own "Low to Moderate" horizontal-only space section, so
 * `minimumSpace: "moderate"` is used here rather than `box_jump`'s
 * "limited".
 */
export const DEPTH_JUMP: ExerciseDefinition = {
  id: "depth_jump",
  name: "Depth Jump",
  module: "power",
  primaryAdaptation: "power",
  // Primary Adaptation: "Reactive Strength" — exact PhysicalQuality match.
  // Biomechanical Profile: "Rate of Force Development ★★★★★" — exact
  // match. "Deceleration Capacity" (Capability Mapping — Secondary) and
  // "High-Force Deceleration Tolerance" (Secondary Adaptations) both name
  // deceleration explicitly. "Landing Control"/"Landing Stability"
  // (Capability Mapping — Secondary / Secondary Adaptations) map to
  // "stability", matching BOX_JUMP's own "Landing Mechanics" → "stability"
  // treatment. No "Explosive Strength" label exists anywhere in this
  // chapter (unlike BOX_JUMP's own doc) — not added here.
  physicalQualities: ["reactive_strength", "rate_of_force_development", "deceleration", "stability"],
  // Movement Pattern — Primary: "Bilateral Drop Landing to Immediate
  // Vertical Jump". No enum value exists for the landing/drop component
  // itself (as with BOX_JUMP's own "Bilateral Vertical Jump" — "jump" is
  // the only applicable MovementPattern).
  movementPatterns: ["jump"],
  // Biomechanical Profile — "Primary Force Vector: Vertical." The
  // documented "Secondary Force Vector: Minimal Anterior-Posterior
  // Component When Performed Correctly" is explicitly conditional — too
  // conditional to commit to a specific enum value, matching how
  // BOX_JUMP's own conditional secondary vector was excluded.
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "plyometric_box" },
          { kind: "environment", capability: "jumping_allowed" },
          { kind: "environment", capability: "safe_landing_surface" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "moderate" },
        ],
      },
    ],
  },
  // Skill Requirement: "High". Technical Complexity — Overall Technical
  // Complexity: "High". One tier above BOX_JUMP's own clean "Moderate" →
  // 3 mapping, following the same ordinal scale.
  minimumTechnicalLevel: 4,
  complexity: "high",
  // Movement Context / Movement Pattern repeatedly state "Bilateral".
  // Matches exercisePrescriptionRegistry.ts's own `laterality: "bilateral"`.
  unilateral: false,
  // Muscular Profile Primary Contributors (Gluteus Maximus, Quadriceps,
  // Gastrocnemius, Soleus, Hamstrings) match BOX_JUMP's own primary
  // contributors near-identically — same body-region set, following the
  // same precedent of excluding secondary/stabilizer trunk and
  // upper-body contributors (Spinal Erectors, Abdominal Wall, Anterior
  // Deltoids, Latissimus Dorsi, Trapezius, Arm-Swing Musculature) that
  // BOX_JUMP's own doc names too (as "Erector Spinae", "Rectus
  // Abdominis", "Obliques", "Latissimus Dorsi and Shoulder Flexors During
  // Arm Swing") without adding a body region for them.
  bodyRegionsLoaded: ["hip", "thigh", "lower_leg"],
  // "Contraindications and Restrictions — Avoid or restrict the exercise
  // in the presence of: ...", quoted one line per source paragraph
  // (unlike BOX_JUMP's own doc, which combines several joints/tendons
  // onto a single line, this chapter separates each explicitly — so no
  // combining is applied here). "Platform moves or becomes unstable" (a
  // Technical Failure Criterion, not listed under this heading) and
  // "Medical restriction against jumping or impact" are excluded — the
  // former is an equipment/environment concern already covered by
  // `requirements`, the latter is non-actionable here, handled generically
  // by `AthleteRestriction`/`checkHardRestrictionProhibitsMovement` in
  // `exerciseSelector.ts`, matching BOX_JUMP's identical exclusion of its
  // own "Medical restrictions on jumping or impact" line. The separate
  // "Use additional caution with:" list is excluded entirely, matching
  // BOX_JUMP's identical exclusion of its own "Use caution with:" list.
  contraindications: [
    { description: "Acute ankle pain.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Acute knee pain.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Acute hip pain.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Achilles tendinopathy with reactive symptoms.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Patellar tendinopathy with reactive symptoms.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Recent lower-limb surgery.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Recent ankle sprain.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Poor balance.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Uncontrolled knee valgus.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Inability to land quietly and symmetrically.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Severe lower-body soreness.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Insufficient relative strength.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Major fatigue.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Fear of impact or stepping from the platform.", prohibitedPatterns: ["jump"], absolute: true },
  ],
  fatigueProfile: {
    // This chapter's own "# Fatigue Profile" section uses different
    // dimension names again than either BOX_JUMP's or the Ballistics
    // chapters' (Local Fatigue / Neuromuscular Fatigue / Tendon Fatigue /
    // Joint Stress Accumulation / Metabolic Fatigue / Technique
    // Degradation Under Fatigue), mapped onto the same fixed
    // ExerciseFatigueProfile shape.
    types: ["neural", "muscular", "connective_tissue", "technical", "impact", "systemic"],
    neural: 4, // "Neuromuscular Fatigue: High"
    muscular: 2, // "Local Fatigue: Low to Moderate" — same documented phrase and rating BOX_JUMP used for its own "Local Muscular Fatigue: Low to Moderate"
    metabolic: 1, // "Metabolic Fatigue: Low when correctly programmed" — same documented phrase and rating BOX_JUMP used
    connectiveTissue: 4, // "Tendon Fatigue: Moderate to High" and "Joint Stress Accumulation: High"
    // Unlike BOX_JUMP (which sourced its own `technical` rating from the
    // separate "Technical Complexity" section instead of its Fatigue
    // Profile's own "Technical Degradation Risk: High once fatigue
    // accumulates"), this chapter's Fatigue Profile section is used
    // directly here: "Technique Degradation Under Fatigue: Very High" —
    // the single highest-rated dimension in the whole profile, which is
    // also why "technical" is included in `types` here (BOX_JUMP left it
    // out of its own `types` despite carrying a `technical` field value).
    technical: 5,
  },
  // Same reasoning as BOX_JUMP: this chapter has a real "# Evidence
  // Classification" section ("Evidence Level: Moderate to High" plus
  // documented "Evidence Supports"/"Evidence Limitations"), but there is
  // still no documented crosswalk between that narrative language and the
  // engine's level_1/level_2/level_3 taxonomy. Left "unknown" rather than
  // guessed, exactly as BOX_JUMP was.
  evidenceLevel: "unknown",
  // combatSportRelevance intentionally omitted: "Combat Transfer" states
  // explicitly — "The transfer is general rather than technically
  // specific." — and, like BOX_JUMP's own canonical chapter, no per-sport
  // breakdown exists anywhere here (only an aggregate "Combat-Sport
  // Transfer ★★★☆☆" line under "Relative Transfer Score"). The superseded
  // top-level `50-exercises/24_DEPTH_JUMP` document does carry a
  // per-sport "Transfer to Combat Sports" table, but it is not this
  // exercise's canonical documentation (see BOX_JUMP's own identical
  // situation with the superseded `50-exercises/23_BOX_JUMP`) and is not
  // used here.
  substitutionExerciseIds: ["box_jump", "countermovement_jump", "med_ball_scoop_toss"],
};

// -----------------------------------------------------------------------------
// Countermovement Jump
// Source: 50-exercises/21_COUNTERMOVEMENT_JUMP
// -----------------------------------------------------------------------------

/**
 * Third Plyometrics-family entry, but unlike `BOX_JUMP`/`DEPTH_JUMP` this
 * exercise has no `63_PLYOMETRICS/` chapter — its only canonical
 * documentation is this shorter top-level fiche, and it reads very
 * differently from its two siblings on nearly every axis that matters for
 * `requirements`:
 *
 * - "Equipment Requirements — Required: None." No box, no implement.
 *   `plyometric_box` is therefore never added here — this is a floor
 *   exercise, not a box exercise, and treating it as "`box_jump` without
 *   the box" would be exactly the un-earned equivalence this integration
 *   step is required to avoid.
 * - No landing-surface language anywhere in the fiche (checked: zero
 *   occurrences of "surface", "floor", "space", "clearance" or "room" in
 *   the entire document) — contrast `BOX_JUMP`/`DEPTH_JUMP`, both of which
 *   have an explicit "Appropriate/Non-slip Landing Surface" requirement.
 *   `safe_landing_surface`/`floor_safe` are therefore deliberately NOT
 *   added. This matches `exercisePrescriptionRegistry.ts`'s own
 *   independent conclusion for this exact exercise
 *   (`requiredEquipmentCapabilities: []`, with an explicit comment
 *   contrasting it against `broad_jump`'s documented "Stable non-slip
 *   training surface").
 * - No "Space Requirements" section at all (unlike `BOX_JUMP`/`DEPTH_JUMP`'s
 *   own chapters) — consistent with "Movement Context: ... Standing..."
 *   describing an in-place vertical jump with no horizontal travel, box
 *   clearance or rebound-room concern to document. `sufficient_space` is
 *   therefore deliberately NOT added: inventing a specific minimum tier
 *   with no textual support would violate this project's scientific-
 *   integrity principle exactly as much as inventing a physiological fact.
 * - `requirements` is reduced, honestly, to the one real environmental gate
 *   this fiche actually documents: permission to jump.
 *
 * `movement_intent: maximal_acceleration` is not a field on
 * `ExerciseDefinition` at all — it is an `ExercisePrescriptionCapabilities`
 * concept, already fixed independently by
 * `exercisePrescriptionRegistry.ts`'s `countermovementJumpEntry`
 * (`preferredIntensityTypes: ["movement_intent"]`, matching this fiche's
 * own "Velocity Profile — Maximum Velocity, Maximum Intent... Movement
 * velocity is the objective."). Nothing to add or contradict here; that
 * decision is untouched by this file.
 */
export const COUNTERMOVEMENT_JUMP: ExerciseDefinition = {
  id: "countermovement_jump",
  name: "Countermovement Jump",
  module: "power",
  primaryAdaptation: "power",
  // Capability Mapping — Primary: "Explosive Power" (→ explosive_strength,
  // no separate "explosive_power" quality exists), "Rate of Force
  // Development" (exact match, also confirmed by Biomechanical Profile's
  // own "Rate of Force Development ★★★★★"), "Reactive Strength" (exact
  // match). Secondary: "Movement Coordination" (→ coordination),
  // "Acceleration" (exact match). "Force Production" and "Mechanical
  // Efficiency" have no distinct enum counterpart beyond qualities already
  // listed, so are not force-fitted into a new value. Unlike
  // `BOX_JUMP`/`DEPTH_JUMP`, this fiche's Capability Mapping never
  // mentions landing control/mechanics at all — "stability" is
  // deliberately NOT added here.
  physicalQualities: ["explosive_strength", "rate_of_force_development", "reactive_strength", "coordination", "acceleration"],
  // Movement Pattern — Primary: "Jump". As with `BOX_JUMP`/`DEPTH_JUMP`, no
  // enum value exists for the Secondary patterns (Triple Extension, Brace,
  // Landing, Force Absorption) — "jump" is the only applicable value.
  movementPatterns: ["jump"],
  // Biomechanical Profile — "Primary Force Vector: Vertical." No secondary
  // vector is documented at all here (unlike `BOX_JUMP`/`DEPTH_JUMP`'s own
  // conditional secondary vectors), so there is nothing further to
  // consider or exclude.
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [{ kind: "environment", capability: "jumping_allowed" }],
      },
    ],
  },
  // "Motor Complexity: Low" is the one field in this fiche that uses
  // `ExerciseComplexity`'s own vocabulary directly (unlike "Skill
  // Requirement: Beginner", a different Beginner/Intermediate/Advanced/
  // Elite scale requiring translation) — used here directly, matching the
  // established "low" → 1 mapping (`MED_BALL_CHEST_PASS`/`MED_BALL_SLAM`).
  // Reinforced by "Skill Requirement: Beginner", "Learning Curve: Very
  // Short" and "Suitable for virtually all athletes" — all converging on
  // the simplest end of the scale, not the "Moderate"/"High" ratings that
  // set `BOX_JUMP`/`DEPTH_JUMP` to 3/4.
  minimumTechnicalLevel: 1,
  complexity: "low",
  // Movement Context: "Bilateral" (explicit). Matches
  // exercisePrescriptionRegistry.ts's own `laterality: "bilateral"`.
  // "Single-Leg" is listed only under Variations, not the base exercise.
  unilateral: false,
  // Muscular Profile Primary Contributors (Quadriceps, Gluteus Maximus,
  // Calves) plus Secondary (Hamstrings, Hip Flexors) converge on the same
  // hip/thigh/lower_leg set as `BOX_JUMP`/`DEPTH_JUMP` — a genuine
  // independent match (same primary lower-body jump musculature), not a
  // copy. Stabilizers (Core, Hip Stabilizers, Foot Intrinsic Muscles) are
  // excluded, matching the same precedent of leaving out
  // secondary/stabilizer contributors used for both siblings.
  bodyRegionsLoaded: ["hip", "thigh", "lower_leg"],
  // "# Contraindications" here is a short, plain four-item list with no
  // "Avoid or modify"/"Avoid or restrict" framing and no separate "Use
  // caution with:" list to exclude (unlike `BOX_JUMP`/`DEPTH_JUMP`'s own,
  // much longer chapters) — quoted directly, one item per line.
  contraindications: [
    { description: "Acute knee injury.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Acute Achilles injury.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Acute ankle injury.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Pain during jumping.", prohibitedPatterns: ["jump"], absolute: true },
  ],
  fatigueProfile: {
    // This fiche's own "# Fatigue Profile" names exactly two dimensions —
    // "Neuromuscular Fatigue: Low" and "Mechanical Fatigue: Low" — plus
    // "Metabolic Fatigue: Minimal" and "Overall Fatigue Cost: Very Low",
    // capped off by its own explicit "Excellent stimulus-to-fatigue
    // ratio." No tendon/joint fatigue field exists here at all (unlike
    // `BOX_JUMP`'s "Tendon and Joint Exposure" / `DEPTH_JUMP`'s "Tendon
    // Fatigue"/"Joint Stress Accumulation"), and Safety Profile's own
    // "Overall Risk: Very Low" names no tendon/joint risk either — so
    // `connectiveTissue` is rated low, not elevated by analogy to the
    // other plyometric entries. No technical-degradation-under-fatigue
    // field exists either; "Motor Complexity: Low"/"Learning Curve: Very
    // Short" are the closest available signal. `types` therefore only
    // tags the two dimensions this fiche actually names — no "impact" or
    // "systemic" tag (contrast `BOX_JUMP`/`DEPTH_JUMP`, both documented
    // with real landing-impact and systemic-load language this fiche
    // simply does not have), and no "technical"/"connective_tissue" tag
    // (mandatory field values still required below, but not flagged as a
    // qualitatively notable fatigue category for this exercise).
    types: ["neural", "muscular"],
    neural: 2, // "Neuromuscular Fatigue: Low"
    muscular: 2, // "Mechanical Fatigue: Low"
    metabolic: 1, // "Metabolic Fatigue: Minimal"
    connectiveTissue: 2, // no explicit tendon/joint fatigue field; "Overall Risk: Very Low" and the absence of any documented tendon/joint risk support a low, not elevated, rating
    technical: 2, // no explicit technical-fatigue field; nearest signal is "Motor Complexity: Low" / "Learning Curve: Very Short"
  },
  // Same reasoning as `BOX_JUMP`/`DEPTH_JUMP`: a real "# Scientific
  // Evidence" section exists ("Evidence Level ★★★★★" — "one of the most
  // extensively validated assessments of lower-body power and
  // neuromuscular readiness"), but there is still no documented crosswalk
  // between narrative/star-rating evidence language and the engine's
  // level_1/level_2/level_3 taxonomy. Left "unknown" rather than guessed.
  evidenceLevel: "unknown",
  // Unlike `BOX_JUMP`/`DEPTH_JUMP` (whose canonical `63_PLYOMETRICS`
  // chapters carry no per-sport breakdown at all), this fiche IS its own
  // sole canonical documentation and DOES carry a full "# Transfer to
  // Combat Sports" table — so, unlike its two siblings, combatSportRelevance
  // is populated here, directly from that table. Savate and Sambo are both
  // rated in the source table but have no corresponding `CombatSport` enum
  // member (see `types.ts` — only boxing, kickboxing, muay_thai, mma,
  // wrestling, judo, brazilian_jiu_jitsu, krav_maga, other) and are
  // therefore omitted rather than force-fit into "other".
  combatSportRelevance: {
    boxing: 5,
    kickboxing: 5,
    muay_thai: 5,
    wrestling: 5,
    judo: 5,
    brazilian_jiu_jitsu: 4,
    mma: 5,
    krav_maga: 5,
  },
  // substitutionExerciseIds intentionally omitted: this fiche's own
  // Regressions ("Submaximal Jump", "Squat Jump", "Low-Amplitude Jump")
  // and Progressions ("Loaded Countermovement Jump", "Reactive Jump",
  // "Repeated CMJ", "Contrast Training") name no exercise that currently
  // has its own chapter/catalog id in this repository — inventing ids for
  // them would repeat exactly the mistake this integration step is
  // required to avoid (see `DEPTH_JUMP`'s identical exclusion of
  // undocumented `pogo_jump`/`snap_down`/etc.). `BOX_JUMP`'s own entry
  // already names `countermovement_jump` as one of its substitutes, but
  // that relationship is not necessarily symmetric and is not repeated
  // here without this fiche's own text supporting it.
};

// -----------------------------------------------------------------------------
// Broad Jump
// Source: 50-exercises/63_PLYOMETRICS/12_BROAD_JUMP.md
// -----------------------------------------------------------------------------

/**
 * Fourth Plyometrics-family entry. Like `BOX_JUMP`/`DEPTH_JUMP` (and unlike
 * `COUNTERMOVEMENT_JUMP`), this exercise has its own dedicated
 * `63_PLYOMETRICS/` chapter, used here as the canonical source rather than
 * the superseded top-level `50-exercises/22_BROAD_JUMP` fiche (which does
 * carry a per-sport "Transfer to Combat Sports" table this canonical
 * chapter does not — see the `combatSportRelevance` omission below, same
 * situation as `BOX_JUMP`/`DEPTH_JUMP`'s own superseded top-level fiches).
 *
 * Deliberately NOT copied from `COUNTERMOVEMENT_JUMP` despite both being
 * bodyweight bilateral jumps — the two fiches diverge on several axes that
 * matter directly for this file:
 *
 * - Equipment Requirements — Required: "Stable non-slip training surface."
 *   Unlike `COUNTERMOVEMENT_JUMP` (whose fiche names no surface
 *   requirement at all), `safe_landing_surface` IS required here, matching
 *   `exercisePrescriptionRegistry.ts`'s own independent
 *   `requiredEquipmentCapabilities: ["safe_landing_surface"]` for this
 *   exact exercise. `floor_safe` is still not added alongside it: the
 *   fiche's own "Environmental Requirement: Dry, level and non-slip
 *   surface" (Space Requirements) restates the same physical surface
 *   property, not a separate concern, and both capabilities read the same
 *   `TrainingEnvironment.floorSafe` field regardless (see
 *   `exerciseRequirements.ts`).
 * - "Space Requirements — Horizontal Space: Moderate", with "Recommended
 *   Clear Area: Jump distance plus at least 1–2 meters of unobstructed
 *   landing and recovery space" — an explicit, unambiguous tier (unlike
 *   `BOX_JUMP`'s own interpretive "Low to Moderate" reading), and a real
 *   requirement `COUNTERMOVEMENT_JUMP` simply does not have (that fiche
 *   documents no space section at all, being an in-place vertical jump).
 *   `minimumSpace: "moderate"` is used directly from this literal wording.
 *   Horizontal displacement itself is represented purely through
 *   `forceVectors` below — no ad hoc "forward_jump"/"horizontal_travel"
 *   capability is introduced anywhere in the Exercise Requirements Model.
 * - Biomechanical Profile — "Secondary Force Vector: Vertical Component
 *   Required for Flight Time." Unlike `BOX_JUMP`/`DEPTH_JUMP`'s own
 *   conditional, minor secondary vectors (explicitly excluded there — e.g.
 *   "Slight...Depending on Box Distance", "Minimal...When Performed
 *   Correctly"), this fiche states the vertical component as a definite,
 *   required part of the movement, not a conditional side-effect — so it
 *   IS included here, unlike its siblings.
 * - "Relative Transfer Score — Reactive Strength ★★☆☆☆" (low) and "Maximum
 *   Strength ★★☆☆☆" (low). Unlike `BOX_JUMP`/`DEPTH_JUMP`/
 *   `COUNTERMOVEMENT_JUMP` (all of which name Reactive Strength as a real
 *   Primary/Secondary quality), this fiche's own transfer scoring rates it
 *   low — `reactive_strength` is therefore deliberately NOT included in
 *   `physicalQualities` here.
 * - "Skill Requirement — Overall Skill Requirement: Moderate" and
 *   "Technical Complexity — Overall Complexity: Moderate" (both explicit,
 *   matching `BOX_JUMP`'s identical dual-confirmation pattern) — a
 *   materially higher skill floor than `COUNTERMOVEMENT_JUMP`'s own
 *   "Beginner"/"Low".
 */
export const BROAD_JUMP: ExerciseDefinition = {
  id: "broad_jump",
  name: "Broad Jump",
  module: "power",
  primaryAdaptation: "power",
  // Secondary Classifications: "Explosive Strength" (exact label, as with
  // `BOX_JUMP`'s own doc). Secondary Adaptations / Biomechanical Profile:
  // "Rate of Force Development ★★★★★" (exact match). Capability Mapping —
  // Secondary: "Landing Control" (→ stability, matching `BOX_JUMP`/
  // `DEPTH_JUMP`'s own "Landing Mechanics"/"Landing Control" → stability
  // treatment), "Deceleration Capacity" / Secondary Adaptations "Eccentric
  // Braking Control" (→ deceleration), "Posterior-Chain Coordination"/
  // "Whole-Body Coordination" / "Intermuscular Coordination" (→
  // coordination), "Trunk Stiffness" (→ trunk_strength, exact match).
  // "Horizontal Force Production"/"Horizontal Impulse" are represented via
  // `forceVectors` below instead, not force-fitted into a quality.
  // "General Athleticism" has no distinct counterpart and is skipped, as
  // with `BOX_JUMP`. `reactive_strength` deliberately excluded — see the
  // block comment above this export.
  physicalQualities: [
    "explosive_strength",
    "rate_of_force_development",
    "stability",
    "deceleration",
    "coordination",
    "trunk_strength",
  ],
  // Movement Pattern — Primary: "Bilateral Horizontal Jump". As with every
  // other jump entry so far, no enum value exists for the Secondary
  // patterns (Countermovement, Triple Extension, Arm-Assisted Projection,
  // Bilateral Landing, Eccentric Deceleration, Forward Displacement) —
  // "jump" is the only applicable value. The forward-displacement
  // character of this exercise lives in `forceVectors`, per the
  // requirement that horizontal displacement be represented through
  // existing biomechanical fields rather than a new movement pattern.
  movementPatterns: ["jump"],
  // Biomechanical Profile — "Primary Force Vector: Horizontal." "Secondary
  // Force Vector: Vertical Component Required for Flight Time" — a
  // definite requirement, not a conditional side-effect (see the block
  // comment above), so included here unlike `BOX_JUMP`/`DEPTH_JUMP`/
  // `COUNTERMOVEMENT_JUMP`'s own single-vector treatment.
  forceVectors: ["horizontal", "vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "environment", capability: "jumping_allowed" },
          { kind: "environment", capability: "safe_landing_surface" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "moderate" },
        ],
      },
    ],
  },
  // Skill Requirement: "Moderate". Technical Complexity — Overall
  // Complexity: "Moderate". Same dual explicit "Moderate" pairing as
  // `BOX_JUMP`, mapped identically: minimumTechnicalLevel 3.
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // Movement Context / Movement Pattern repeatedly state "Bilateral".
  // Matches exercisePrescriptionRegistry.ts's own `laterality: "bilateral"`.
  unilateral: false,
  // Muscular Profile Primary Contributors (Gluteus Maximus, Quadriceps,
  // Hamstrings, Gastrocnemius, Soleus) converge on the same hip/thigh/
  // lower_leg set as every other jump entry so far — the same primary
  // lower-body jump musculature, not a copy. Secondary/stabilizing
  // contributors (Erector Spinae, Abdominal Wall, Latissimus Dorsi,
  // Shoulder Flexors, Foot Intrinsics, Obliques, Multifidus) are excluded,
  // matching the same precedent used throughout this file.
  bodyRegionsLoaded: ["hip", "thigh", "lower_leg"],
  // "# Contraindications and Restrictions — Avoid or restrict when the
  // athlete presents: ...", quoted one line per source paragraph.
  // "Medical restriction against jumping or impact loading" is excluded —
  // non-actionable here, handled generically by `AthleteRestriction`/
  // `checkHardRestrictionProhibitsMovement` in `exerciseSelector.ts`,
  // matching every other jump entry's identical exclusion. The closing
  // prose note ("Temporary restrictions may also apply during periods of
  // high lower-body fatigue...") is informational context, not its own
  // enumerated contraindication, and is excluded too.
  contraindications: [
    { description: "Acute ankle, knee, hip or lower-back pain.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Recent lower-limb surgery.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Unresolved Achilles tendon symptoms.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Acute patellar tendon irritation.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Inability to land bilaterally under control.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Marked dynamic knee valgus.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Significant balance impairment.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Insufficient lower-body strength for safe deceleration.", prohibitedPatterns: ["jump"], absolute: true },
  ],
  fatigueProfile: {
    // This fiche's own "# Fatigue Profile" section is qualitative only
    // ("Primary Fatigue Type: Neural and mechanical", "Fatigue
    // Sensitivity: High") rather than a clean per-dimension Low/Moderate/
    // High breakdown, so the more granular "# Physiological Cost" section
    // is used for the five numeric fields instead (same choice `DEPTH_JUMP`
    // made when both sections existed there).
    // `technical` has no dedicated fatigue-specific field in either
    // section; sourced from "# Technical Complexity — Overall Complexity:
    // Moderate" instead, the same substitution `BOX_JUMP` used for its own
    // identical "Moderate" complexity rating.
    // `types` reflects what this fiche actually documents at length:
    // explicit "Systemic Demand: Moderate due to neural and mechanical
    // intensity" (Physiological Profile); real tendon/joint signal (Tendon
    // Cost, Joint Stress Profile — Hip/Ankle "Moderate to High"); real
    // landing-impact risk (Safety Profile — "Ankle sprain during unstable
    // landing", "Backward fall after landing"); and an unusually long,
    // explicit "Common Signs of Fatigue" list dominated by technique
    // breakdown (slower countermovement reversal, incomplete triple
    // extension, increased knee valgus...), which is why "technical" is
    // tagged here even though `BOX_JUMP` left it untagged.
    types: ["neural", "muscular", "connective_tissue", "technical", "impact", "systemic"],
    neural: 4, // "Neural Cost: High"
    muscular: 3, // "Muscular Cost: Moderate"
    metabolic: 2, // "Metabolic Cost: Low"
    connectiveTissue: 3, // "Tendon Cost: Moderate", corroborated by "Mechanical Cost: Moderate to High" and the Joint Stress Profile
    technical: 3, // "Technical Complexity — Overall Complexity: Moderate"
  },
  // Same reasoning as every other jump entry: a real "# Evidence
  // Classification" section exists ("Evidence Level: Moderate to High"
  // plus documented "Evidence Supports"/"Limitations"), but there is still
  // no documented crosswalk between that narrative language and the
  // engine's level_1/level_2/level_3 taxonomy. Left "unknown".
  evidenceLevel: "unknown",
  // combatSportRelevance intentionally omitted: like `BOX_JUMP`/
  // `DEPTH_JUMP`'s own canonical chapters, this one carries no per-sport
  // breakdown at all — only an aggregate "Combat Transfer Rating ★★★★☆"
  // and "Relative Transfer Score — Combat-Specific Transfer ★★★★☆". The
  // superseded top-level `50-exercises/22_BROAD_JUMP` document does carry
  // a per-sport "Transfer to Combat Sports" table, but it is not this
  // exercise's canonical documentation and is not used here (same
  // situation as `BOX_JUMP`'s/`DEPTH_JUMP`'s own superseded fiches).
  // Regressions ("Snap-Down to Athletic Landing", "Squat Jump With
  // Controlled Landing", "Submaximal Broad Jump", ...) and most
  // Substitution Logic targets ("Pogo Jump", "Sled Sprint Start",
  // "Bounds") name no exercise that currently has its own chapter/catalog
  // id in this repository and are therefore not referenced below (same
  // discipline `DEPTH_JUMP`/`COUNTERMOVEMENT_JUMP` applied to their own
  // undocumented regression names). The five substitutes below ARE each
  // named explicitly in this fiche's own "Substitution Logic"/"Equivalent
  // Options" sections AND already have their own chapter in this
  // repository: "Countermovement Jump"/"Vertical power", "Box Jump"
  // ("Vertical power"), "Depth Jump" ("Reactive strength... when
  // appropriate"), "Single-Leg Hop" ("Unilateral horizontal power" —
  // `50-exercises/63_PLYOMETRICS/15_SINGLE_LEG_HOP.md`), "Medicine-Ball
  // Scoop Toss" ("Horizontal power with lower impact").
  substitutionExerciseIds: ["countermovement_jump", "box_jump", "depth_jump", "single_leg_hop", "med_ball_scoop_toss"],
};

// -----------------------------------------------------------------------------
// Knee Jump
// Source: 50-exercises/63_PLYOMETRICS/13_KNEE_JUMP.md
// -----------------------------------------------------------------------------

/**
 * Fifth Plyometrics-family entry, and the first with no superseded
 * top-level fiche at all — this `63_PLYOMETRICS` chapter is the only
 * documentation that exists for this exercise.
 *
 * Deliberately NOT copied from the other jump entries despite the shared
 * "bilateral bodyweight jump" family resemblance — several of its own
 * documented properties diverge substantially:
 *
 * - "Equipment Requirements — Required: Dense Knee Pad or Folded Exercise
 *   Mat, Stable Non-Slip Floor." Unlike every other jump entry so far,
 *   this fiche requires a genuine physical implement beyond the floor
 *   itself: `knee_protection_pad` is a MANDATORY equipment requirement
 *   here, not a comfort recommendation — the "Recommended"/"Optional"
 *   tiers of this same section list only "Open Landing Area", "Low Soft
 *   Target or Raised Mat for Regression" and "Video Recording Device",
 *   never the knee pad itself. This matches
 *   `exercisePrescriptionRegistry.ts`'s own independent
 *   `requiredEquipmentCapabilities: ["knee_protection_pad",
 *   "safe_landing_surface"]` for this exact exercise — confirming both
 *   that the pad is required (not merely recommended) and the equipment
 *   vocabulary (`knee_protection_pad`, already defined in `EquipmentType`)
 *   independently from this source documentation.
 * - "Space Requirements — Minimum Clear Area: Approximately 2 metres by 2
 *   metres", with the landing zone required to stay clear of "racks,
 *   benches, walls or loose equipment" — a modest, single-station
 *   footprint, closer in character to `BOX_JUMP`'s own "limited" tier than
 *   to `BROAD_JUMP`'s open, multi-metre horizontal corridor, hence
 *   `minimumSpace: "limited"` here.
 * - Neurological Profile: "Reactive Demand: Low." Secondary
 *   Classifications never name "Explosive Strength" or "Reactive
 *   Strength" anywhere in this chapter (checked directly — zero
 *   occurrences of either phrase), unlike `BOX_JUMP`/`DEPTH_JUMP`/
 *   `BROAD_JUMP`, all of which earned `explosive_strength` from an
 *   explicit label. `rate_of_force_development` is used instead,
 *   grounded in this fiche's own explicit "Rate of Force Development
 *   ★★★★☆" rating (Biomechanical Profile) and "Rate of Force Development"
 *   (Secondary Adaptations) — `explosive_strength`/`reactive_strength`
 *   are deliberately NOT added.
 * - Movement Pattern — Secondary: "Hip Hinge." Unlike every prior jump
 *   entry (whose own Secondary patterns — Triple Extension, Landing,
 *   Force Absorption, Countermovement — have no `MovementPattern` enum
 *   counterpart and were excluded), "Hip Hinge" maps directly onto the
 *   real, existing `"hinge"` value — so it IS included here alongside
 *   `"jump"`. This is the existing-biomechanical-field representation of
 *   the documented hip-loading phase preceding explosive hip extension —
 *   no ad hoc "kneeling_start"/"hip_extension" capability is introduced
 *   anywhere in this file.
 * - Biomechanical Profile — "Primary Force Vector: Vertical With a Small
 *   Forward Component," stated as one unconditional description (unlike
 *   `BOX_JUMP`/`DEPTH_JUMP`'s own excluded, explicitly conditional
 *   secondary vectors — "Depending on Box Distance", "When Performed
 *   Correctly") — so both components are represented here, the same
 *   treatment already used for `MED_BALL_SHOT_PUT_THROW`'s/
 *   `MED_BALL_REVERSE_THROW`'s own single-sentence compound vectors.
 * - "Physiological Profile — Systemic Metabolic Demand: Low When
 *   Programmed Correctly" — an explicit LOW rating, unlike `DEPTH_JUMP`'s/
 *   `BROAD_JUMP`'s own explicit Moderate-to-High systemic demand, so
 *   "systemic" is NOT tagged in `fatigueProfile.types` here.
 * - "Fatigue Profile — Technical Fatigue Sensitivity: High" is a direct,
 *   dedicated technical-fatigue field — the clearest, most explicit
 *   source of any entry so far for the `technical` rating (contrast
 *   `BOX_JUMP`/`BROAD_JUMP`, both of which had to borrow their own
 *   `technical` rating from the separate "Technical Complexity" section
 *   for lack of a dedicated fatigue-specific field).
 */
export const KNEE_JUMP: ExerciseDefinition = {
  id: "knee_jump",
  name: "Knee Jump",
  module: "power",
  primaryAdaptation: "power",
  // Biomechanical Profile: "Rate of Force Development ★★★★☆" and
  // Secondary Adaptations: "Rate of Force Development" (exact match).
  // Capability Mapping — Secondary: "Landing Control" (→ stability,
  // matching every other jump entry's identical treatment), "Trunk
  // Organization" / Secondary Adaptations "Trunk Stiffness" (→
  // trunk_strength, exact match), "Whole-Body Coordination" / Secondary
  // Adaptations "Intermuscular Coordination" (→ coordination).
  // "Explosive Hip Extension"/"Concentric Force Production"/"Concentric
  // Strength Expression" have no distinct enum counterpart beyond
  // rate_of_force_development, already listed — not force-fitted into
  // explosive_strength given the block comment above this export.
  // "Rapid Foot Placement"/"Athletic Transition"/"General Robustness" have
  // no clean match and are skipped, matching the precedent of skipping
  // similarly vague items throughout this file.
  physicalQualities: ["rate_of_force_development", "stability", "trunk_strength", "coordination"],
  // Movement Pattern — Primary: "Bilateral Kneeling Jump to Athletic
  // Stance" (→ jump). Secondary: "Hip Hinge" (→ hinge, see the block
  // comment above this export for why this — uniquely among this file's
  // jump entries — has genuine enum support). The remaining Secondary
  // patterns (Explosive Hip Extension, Arm-Assisted Projection, Rapid
  // Foot Recovery, Bilateral Landing, Eccentric Deceleration) still have
  // no enum counterpart and are not represented here.
  movementPatterns: ["jump", "hinge"],
  // Biomechanical Profile — "Primary Force Vector: Vertical With a Small
  // Forward Component" — a single, unconditional description (see the
  // block comment above this export), both components represented.
  forceVectors: ["vertical", "forward"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "knee_protection_pad" },
          { kind: "environment", capability: "jumping_allowed" },
          { kind: "environment", capability: "safe_landing_surface" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "limited" },
        ],
      },
    ],
  },
  // Skill Requirement: "Intermediate to Advanced". Technical Complexity —
  // Complexity Rating: ★★★★☆ (4 of 5) — a materially higher floor than
  // `BOX_JUMP`/`BROAD_JUMP`'s own plain "Moderate" rating, and matching
  // `DEPTH_JUMP`'s own "High" mapping (minimumTechnicalLevel 4). "The Knee
  // Jump requires more coordination than a standard Squat Jump and should
  // not be treated as a beginner exercise" and "intermediate or advanced
  // athletes" (Decision Summary) both corroborate this.
  minimumTechnicalLevel: 4,
  complexity: "high",
  // Movement Context: "Bilateral" (explicit). Matches
  // exercisePrescriptionRegistry.ts's own `laterality: "bilateral"`.
  unilateral: false,
  // Muscular Profile Primary Muscles (Gluteus Maximus, Hamstrings, Hip
  // Extensors) are hip/thigh-region; Secondary Muscles here include
  // Quadriceps and "Calves During Landing" — demoted from Primary
  // (unlike every other jump entry, this fiche explicitly notes reduced
  // ankle/quad contribution during propulsion: "the quadriceps contribute
  // less to the initial projection... but become important during foot
  // recovery and landing stabilization") but still genuinely, explicitly
  // documented contributors, not stabilizer-tier throwaway mentions —
  // converging on the same hip/thigh/lower_leg set as every sibling entry.
  // Erector Spinae, Rectus Abdominis, Obliques, Adductors, Gluteus Medius,
  // Deep Trunk Stabilizers and Shoulder Flexors are excluded, matching the
  // same precedent used throughout this file.
  bodyRegionsLoaded: ["hip", "thigh", "lower_leg"],
  // "# Contraindications and Restrictions — Do Not Select When: ...",
  // quoted one item per source line. "The Landing Surface Is Slippery or
  // Obstructed" is excluded — an environment concern already covered by
  // `requirements` (`safe_landing_surface`), not an athlete-state
  // contraindication. The separate "Use Caution When" list is excluded
  // entirely, matching every other jump entry's identical exclusion of
  // its own relative-tier caution list.
  contraindications: [
    { description: "Acute knee pain.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Kneeling is painful or medically restricted.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Recent knee surgery or significant knee trauma.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Inability to land a basic bilateral jump safely.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Acute hip or lumbar pain.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Recurrent knee valgus.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Inability to reposition the feet reliably.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Significant fatigue.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Significant fear of the movement.", prohibitedPatterns: ["jump"], absolute: true },
  ],
  fatigueProfile: {
    // Both the "# Fatigue Profile" and "# Physiological Cost" sections
    // agree closely here (Neurological/Neural: Moderate in both; Local/
    // Muscular: Low to Moderate in both; Metabolic: Low in both), so
    // either grounds the same values.
    // `types` excludes "systemic" — see the block comment above this
    // export ("Systemic Metabolic Demand: Low When Programmed
    // Correctly"). "impact" is included: Safety Profile Primary Risks
    // name "Hard or Asymmetrical Landing", "Knee Valgus During Landing"
    // and "Direct Knee Discomfort From the Starting Surface" — genuine
    // impact exposure at both the start and landing of the movement.
    types: ["neural", "muscular", "connective_tissue", "technical", "impact"],
    neural: 3, // "Neurological Cost: Moderate" / "Neurological Fatigue: Moderate"
    muscular: 2, // "Muscular Cost: Low to Moderate" / "Local Fatigue: Low to Moderate"
    metabolic: 2, // "Metabolic Cost: Low" / "Metabolic Fatigue: Low" — same plain-"Low" mapping used for BROAD_JUMP's own "Metabolic Cost: Low"
    connectiveTissue: 3, // "Joint Cost: Moderate", corroborated by the Joint Stress Profile (Knee Stress: Moderate; Ankle Stress: Low to Moderate)
    technical: 4, // "Technical Fatigue Sensitivity: High" — see the block comment above this export
  },
  // Same reasoning as every other jump entry: a real "# Evidence
  // Classification" section exists, here even more explicitly mixed
  // ("Moderate for the general principles... Limited for unique
  // superiority of the Knee Jump over other plyometric exercises"), but
  // there is still no documented crosswalk between this narrative
  // language and the engine's level_1/level_2/level_3 taxonomy. Left
  // "unknown".
  evidenceLevel: "unknown",
  // combatSportRelevance intentionally omitted: no per-sport breakdown
  // exists anywhere in this chapter (nor in any superseded fiche — none
  // exists for this exercise) — only the aggregate "Combat Transfer"
  // narrative and "Relative Transfer Score — Combat-Specific Transfer
  // ★★★☆☆". Same omission already used for `BOX_JUMP`/`DEPTH_JUMP`/
  // `BROAD_JUMP`.
  // Most of this fiche's own Regression Options ("Tall-Kneeling Hip
  // Extension Throw...", "Half-Kneeling Explosive Stand-Up", "Snap-Down
  // to Athletic Stance", "Squat Jump", "Seated Box Jump") name no exercise
  // with its own chapter/catalog id in this repository and are therefore
  // not referenced below (same discipline applied throughout this file).
  // The four substitutes below ARE each named explicitly in this fiche's
  // own "Equivalent Options"/"Substitution Logic" sections AND already
  // have their own chapter here: "Box Jump" ("Knee Discomfort in Tall
  // Kneeling"), "Countermovement Jump" ("Poor Landing Control"/"Need for
  // More Complete Triple Extension"), "Broad Jump" ("Need for More
  // Complete Triple Extension"), "Medicine-Ball Scoop Throw" ("Knee
  // Discomfort in Tall Kneeling").
  substitutionExerciseIds: ["box_jump", "countermovement_jump", "broad_jump", "med_ball_scoop_toss"],
};

// -----------------------------------------------------------------------------
// Lateral Bound
// Source: 50-exercises/63_PLYOMETRICS/14_LATERAL_BOUND.md
// -----------------------------------------------------------------------------

/**
 * Sixth Plyometrics-family entry, and the first genuinely unilateral one —
 * every prior jump entry (`BOX_JUMP`, `DEPTH_JUMP`, `COUNTERMOVEMENT_JUMP`,
 * `BROAD_JUMP`, `KNEE_JUMP`) is bilateral. No superseded top-level fiche
 * exists for this exercise (same situation as `KNEE_JUMP`) — this
 * `63_PLYOMETRICS` chapter is the sole canonical documentation.
 *
 * Deliberately NOT copied from `BROAD_JUMP` or `COUNTERMOVEMENT_JUMP`
 * despite sharing the "bodyweight plyometric jump" family resemblance —
 * several properties diverge substantially:
 *
 * - "Equipment Requirements — Required: Stable Non-Slip Floor" only — no
 *   implement of any kind (unlike `KNEE_JUMP`'s mandatory
 *   `knee_protection_pad`). Matches `exercisePrescriptionRegistry.ts`'s
 *   own independent `requiredEquipmentCapabilities: ["safe_landing_surface"]`
 *   for this exact exercise.
 * - Movement Context: "Unilateral" / "Contralateral" (explicit) — the
 *   athlete pushes off one leg and lands on the other. `unilateral: true`
 *   here, matching `exercisePrescriptionRegistry.ts`'s own independent
 *   `laterality: "unilateral"` / `volumeInterpretations:
 *   ["repetitions_per_side"]`. Left/right alternation is represented
 *   purely through this single boolean field — no `human_assistance`
 *   atom, no side-tracking requirement, no ad hoc capability is
 *   introduced anywhere in the Exercise Requirements Model for it.
 * - "Space Requirements — Minimum Clear Area: Approximately 3 metres wide
 *   by 2 metres deep," wider than `KNEE_JUMP`'s own compact "2 metres by 2
 *   metres" (Setup Time explicitly calls for verifying "sufficient lateral
 *   clearance on both sides") and matching `BROAD_JUMP`'s own "moderate"
 *   tier in magnitude, even though this fiche never uses the literal word
 *   "Moderate" for space the way `BROAD_JUMP`'s does — `minimumSpace:
 *   "moderate"` is used here on that comparative-magnitude basis.
 * - Biomechanical Profile — "Primary Force Vector: Lateral." "Secondary
 *   Force Vector: Slight Vertical Component" carries no conditional
 *   qualifier at all (unlike `BOX_JUMP`'s excluded "...Depending on Box
 *   Distance" or `DEPTH_JUMP`'s excluded "...When Performed Correctly"),
 *   and the Execution Standard corroborates a genuine, necessary vertical
 *   component ("Travel toward the opposite side with sufficient height to
 *   reposition the limbs") — so both components are represented here,
 *   the same treatment `KNEE_JUMP`'s own unconditional compound vector
 *   received. Lateral displacement itself lives entirely in this field
 *   (`"lateral"`, an existing `ForceVector` value) — no ad hoc
 *   "sideways"/"lateral_travel" capability is introduced anywhere.
 * - Secondary Classifications never name "Explosive Strength" or
 *   "Reactive Strength" anywhere in this chapter (checked directly — zero
 *   occurrences), matching `KNEE_JUMP`'s identical situation — neither
 *   quality is added here. Instead, this fiche is the first to explicitly
 *   and repeatedly separate "Dynamic Balance" from "Frontal-Plane
 *   Stability"/"Single-Leg Landing Control" as distinct, separately named
 *   Capability Mapping/Secondary Adaptation items, and to carry its own
 *   dedicated "Deceleration Exercise" Secondary Classification and
 *   "Change-of-Direction Capacity"/"Change-of-Direction Preparation" —
 *   grounding `balance` and `agility` as genuinely distinct qualities for
 *   the first time in this family, alongside `deceleration`.
 * - "Physiological Profile — Systemic Metabolic Demand: Low When
 *   Programmed Correctly" (explicit low rating, matching `KNEE_JUMP`'s
 *   identical situation) — "systemic" is not tagged in
 *   `fatigueProfile.types`.
 */
export const LATERAL_BOUND: ExerciseDefinition = {
  id: "lateral_bound",
  name: "Lateral Bound",
  module: "power",
  primaryAdaptation: "power",
  // Biomechanical Profile: "Rate of Force Development ★★★★☆" and
  // Secondary Adaptations: "Lateral Rate of Force Development" (→
  // rate_of_force_development). Secondary Classification: "Deceleration
  // Exercise" (its own standalone label) plus Secondary Adaptations
  // "Single-Leg Deceleration" and Movement Pattern Secondary "Single-Leg
  // Deceleration" (→ deceleration). Capability Mapping — Primary:
  // "Single-Leg Landing Control", Secondary: "Frontal-Plane Stability" (→
  // stability, matching every other jump entry's identical "Landing
  // Control" treatment). Secondary Adaptations / Capability Mapping
  // Secondary: "Dynamic Balance" (→ balance, distinct from stability —
  // see the block comment above this export). Secondary Adaptations:
  // "Change-of-Direction Capacity", Capability Mapping Secondary:
  // "Change-of-Direction Preparation" (→ agility). Secondary Adaptations:
  // "Intermuscular Coordination" (→ coordination). "Pelvic Control" has
  // no distinct counterpart beyond stability and is not force-fitted into
  // trunk_strength: unlike `BROAD_JUMP`/`KNEE_JUMP`, this fiche never
  // names "Trunk Stiffness"/"Trunk Organization" as its own Capability
  // Mapping or Secondary Adaptation item — trunk_strength is therefore
  // deliberately NOT added here. "Lower-Limb Robustness"/"Combat Footwork
  // Support"/"General Physical Preparation" have no clean match and are
  // skipped, matching the precedent used throughout this file.
  physicalQualities: ["rate_of_force_development", "deceleration", "stability", "balance", "agility", "coordination"],
  // Movement Pattern — Primary: "Unilateral Lateral Jump to Contralateral
  // Single-Leg Landing" (→ jump). Secondary: "Single-Leg Hip Hinge" (→
  // hinge, same enum-backed representation `KNEE_JUMP` already
  // established for its own "Hip Hinge"). The remaining Secondary
  // patterns (Lateral Push-Off, Airborne Transfer, Single-Leg
  // Deceleration, Frontal-Plane Stabilization) still have no
  // `MovementPattern` counterpart and are represented instead through
  // `forceVectors`/`physicalQualities`/`unilateral` below, not invented
  // here.
  movementPatterns: ["jump", "hinge"],
  // Biomechanical Profile — "Primary Force Vector: Lateral." "Secondary
  // Force Vector: Slight Vertical Component" — unconditional (see the
  // block comment above this export), both components represented.
  forceVectors: ["lateral", "vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "environment", capability: "jumping_allowed" },
          { kind: "environment", capability: "safe_landing_surface" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "moderate" },
        ],
      },
    ],
  },
  // Technical Complexity — Overall Complexity: "Moderate" (explicit,
  // direct match), the same clean single-word rating `BOX_JUMP`/
  // `BROAD_JUMP` both received → minimumTechnicalLevel 3. Skill
  // Requirement: "Intermediate" (a different Beginner/Intermediate/
  // Advanced/Elite scale, not used directly here) corroborates a
  // above-entry-level but not advanced floor. Coordination/Balance/
  // Landing-Precision Demand are each separately rated "High", but the
  // fiche's own headline "Overall Complexity" remains "Moderate" — the
  // same sub-rating-vs-headline resolution `BOX_JUMP` already used.
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // Movement Context: "Unilateral" / "Contralateral" (explicit). Matches
  // exercisePrescriptionRegistry.ts's own `laterality: "unilateral"` and
  // `volumeInterpretations: ["repetitions_per_side"]`.
  unilateral: true,
  // Muscular Profile Primary Muscles (Gluteus Maximus, Gluteus Medius,
  // Quadriceps, Hamstrings, Calves) converge on the same hip/thigh/
  // lower_leg set as every other jump entry — the same primary
  // lower-body jump musculature, not a copy. Secondary/Supporting
  // contributors (Adductors, Hip External Rotators, Peroneals, Tibialis
  // Posterior, Obliques, Erector Spinae, Deep Trunk Stabilizers, Intrinsic
  // Foot Muscles, Latissimus Dorsi) are excluded, matching the same
  // precedent used throughout this file.
  bodyRegionsLoaded: ["hip", "thigh", "lower_leg"],
  // "# Contraindications and Restrictions — Do Not Select When: ...",
  // quoted one item per source line. "The Surface Is Slippery or
  // Obstructed" is excluded — an environment concern already covered by
  // `requirements` (`safe_landing_surface`), not an athlete-state
  // contraindication. The separate "Use Caution When" list (History of
  // Ankle Sprain, Reduced Hip Abductor Strength, Poor Foot Intrinsic
  // Control, High Body Mass, Recent Heavy Lower-Body Training, Marked
  // Asymmetry Between Sides) is excluded entirely, matching every other
  // jump entry's identical exclusion of its own relative-tier caution
  // list.
  contraindications: [
    { description: "Acute ankle, knee or hip pain.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Recent lower-limb surgery or significant trauma.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Inability to maintain single-leg balance.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Recurrent knee valgus.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Significant ankle instability.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Inability to land a basic bilateral jump safely.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Significant fatigue.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Pain during lateral loading.", prohibitedPatterns: ["jump"], absolute: true },
  ],
  fatigueProfile: {
    // Both the "# Fatigue Profile" and "# Physiological Cost" sections
    // agree closely (Neurological/Neural: Moderate in both; Muscular/
    // Local: Moderate in both — a plain, unqualified "Moderate" rather
    // than `KNEE_JUMP`'s own "Low to Moderate", hence a genuinely higher
    // muscular rating here; Metabolic: Low in both). `types` excludes
    // "systemic" — see the block comment above this export. "impact" is
    // included: "Joint Impact Cost: Moderate" names impact directly, and
    // Safety Profile Primary Risks list "Knee Valgus During Landing",
    // "Ankle Inversion or Loss of Foot Control", "Slipping on Take-Off or
    // Landing".
    types: ["neural", "muscular", "connective_tissue", "technical", "impact"],
    neural: 3, // "Neurological Cost: Moderate" / "Neurological Fatigue: Moderate"
    muscular: 3, // "Muscular Cost: Moderate" / "Local Fatigue: Moderate" — plain "Moderate", not "Low to Moderate"
    metabolic: 2, // "Metabolic Cost: Low" / "Metabolic Fatigue: Low" — same plain-"Low" mapping used for BROAD_JUMP's/KNEE_JUMP's own "Low" ratings
    connectiveTissue: 3, // "Tendon Cost: Moderate" and "Joint Impact Cost: Moderate"
    technical: 4, // "Technical Fatigue Sensitivity: High" — same direct field KNEE_JUMP used
  },
  // Same reasoning as every other jump entry: a real "# Evidence
  // Classification" section exists ("Exercise Category Evidence: Strong
  // for unilateral plyometric training... Direct Combat-Specific
  // Evidence: Limited"), but there is still no documented crosswalk
  // between this narrative language and the engine's level_1/level_2/
  // level_3 taxonomy. Left "unknown".
  evidenceLevel: "unknown",
  // combatSportRelevance intentionally omitted: no per-sport breakdown
  // exists anywhere in this chapter (nor in any superseded fiche — none
  // exists for this exercise) — only the aggregate "Combat Transfer"
  // narrative and "Relative Transfer Score — Combat Footwork Transfer
  // ★★★★☆". Same omission already used for `BOX_JUMP`/`DEPTH_JUMP`/
  // `BROAD_JUMP`/`KNEE_JUMP`.
  // substitutionExerciseIds intentionally omitted: this fiche's own
  // Regression Options ("Lateral Weight Shift", "Lateral Step and Stick",
  // "Skater Step Without Flight", ...) and Equivalent Options ("Single-Leg
  // Lateral Hop", "Skater Jump", "Lateral Hop Over Line", "Lateral Box
  // Step-Up Drive", "Lateral Sled Push", "Lateral Medicine-Ball Throw")
  // name no exercise that currently has its own chapter/catalog id in
  // this repository — same discipline `COUNTERMOVEMENT_JUMP` applied to
  // its own undocumented regression names. "Single-Leg Lateral Hop" is
  // not assumed equivalent to the separately catalogued `single_leg_hop`
  // id without this fiche's own text confirming it — inventing that
  // equivalence would be exactly the kind of unearned copying this
  // integration step must avoid. The "Compatibility — Highly Compatible
  // With" list (Box Jump, Broad Jump, Medicine-Ball Rotational Throw, ...)
  // is a session-pairing recommendation, a different semantic category
  // from a substitute/equivalent exercise, and is not used as a
  // substitution source here.
};

// -----------------------------------------------------------------------------
// Single Leg Hop
// Source: 50-exercises/63_PLYOMETRICS/15_SINGLE_LEG_HOP.md
// -----------------------------------------------------------------------------

/**
 * Seventh Plyometrics-family entry, and the second genuinely unilateral one
 * after `LATERAL_BOUND` — but landing on the SAME leg ("Ipsilateral"),
 * not the opposite one ("Contralateral", `LATERAL_BOUND`'s own Movement
 * Context). No superseded top-level fiche exists for this exercise (same
 * situation as `KNEE_JUMP`/`LATERAL_BOUND`) — this `63_PLYOMETRICS`
 * chapter is the sole canonical documentation.
 *
 * Deliberately NOT copied from `LATERAL_BOUND`, `BROAD_JUMP` or
 * `COUNTERMOVEMENT_JUMP` despite the shared "unilateral/bilateral
 * bodyweight jump" family resemblance — several properties diverge:
 *
 * - "Equipment Requirements — Required: Flat Non-Slip Surface" only, and
 *   explicitly: "No specialized equipment is required for the standard
 *   exercise." Matches `exercisePrescriptionRegistry.ts`'s own independent
 *   `requiredEquipmentCapabilities: ["safe_landing_surface"]` for this
 *   exact exercise.
 * - "Space Requirements — Minimum Space: Approximately 2 to 3 metres for
 *   single hops" (the standard, base exercise this entry represents) vs.
 *   "Recommended Space: Approximately 5 to 10 metres for repeated hops" (a
 *   documented progression — Progression Model Stage 4 — not the default
 *   exercise). The smaller, base-exercise minimum is used:
 *   `minimumSpace: "limited"`, matching `KNEE_JUMP`'s own comparable
 *   ~2-metre footprint rather than `LATERAL_BOUND`'s/`BROAD_JUMP`'s wider
 *   "moderate" requirement.
 * - Movement Pattern — Secondary never names "Hip Hinge" here (unlike
 *   `KNEE_JUMP`/`LATERAL_BOUND`'s own explicit "Hip Hinge" pattern) —
 *   instead it lists discrete joint actions (Single-Leg Hip Extension,
 *   Knee Extension, Ankle Plantar Flexion) with no `MovementPattern` enum
 *   counterpart beyond `"jump"` itself, so `"hinge"` is deliberately NOT
 *   added here.
 * - Biomechanical Profile — "Primary Force Vector: Horizontal", "Secondary
 *   Force Vector: Vertical" — both stated as plain, unconditional
 *   headings with no diminishing or conditional qualifier at all (not
 *   even `BROAD_JUMP`'s own "Required for Flight Time" framing), the
 *   cleanest unconditional compound vector of any entry so far — both
 *   components are represented.
 * - Capability Mapping Secondary names "Elastic Reactivity" and Secondary
 *   Adaptations name "Elastic Energy Utilization", and the Neurological
 *   Profile rates "Reactive Demand: Moderate for single hops, High for
 *   repeated hops" — genuinely different from `KNEE_JUMP`'s own explicit
 *   "Reactive Demand: Low" (which excluded `reactive_strength` outright).
 *   This convergent, un-diminished reactive/elastic language is why
 *   `reactive_strength` IS included here, evaluated independently on this
 *   fiche's own terms rather than following `KNEE_JUMP`/`LATERAL_BOUND`'s
 *   exclusion by default.
 * - "# Contraindications and Restrictions" is the first chapter in this
 *   family to use the literal headings "Absolute Contraindications" /
 *   "Relative Contraindications" — removing any interpretive ambiguity
 *   about which items belong in `contraindications` below (only the
 *   Absolute tier) versus the excluded relative/cautionary tier. Notably,
 *   several items that read as "absolute" in other chapters' looser
 *   framing (e.g. "Significant knee pain", "Hip pain", "Poor single-leg
 *   balance", "Severe fatigue") are explicitly classified as Relative
 *   here — so this entry's `contraindications` list is genuinely shorter
 *   than its siblings', not abridged for convenience.
 */
export const SINGLE_LEG_HOP: ExerciseDefinition = {
  id: "single_leg_hop",
  name: "Single Leg Hop",
  module: "power",
  primaryAdaptation: "power",
  // Biomechanical Profile: "Rate of Force Development ★★★★☆" and
  // Secondary Adaptations: "Unilateral Rate of Force Development" (→
  // rate_of_force_development). Capability Mapping — Secondary: "Elastic
  // Reactivity"; Secondary Adaptations: "Elastic Energy Utilization";
  // Neurological Profile: "Reactive Demand: Moderate...High for repeated
  // hops" (→ reactive_strength — see the block comment above this export
  // for why this fiche earns it independently of KNEE_JUMP/LATERAL_BOUND).
  // Capability Mapping Secondary: "Deceleration Capacity"; Secondary
  // Adaptations: "Single-Leg Deceleration"; Secondary Classification:
  // "Landing and Deceleration Exercise" (→ deceleration). Capability
  // Mapping Primary: "Single-Leg Landing Control"; Secondary
  // Classification: "Unilateral Stability Exercise" (→ stability).
  // Capability Mapping Secondary / Secondary Adaptations: "Dynamic
  // Balance" (→ balance). Capability Mapping Secondary / Secondary
  // Classification: "Change-of-Direction Preparation" (→ agility).
  // Secondary Adaptations: "Intermuscular Coordination" (→ coordination).
  // "Ankle Stiffness" has no distinct PhysicalQuality counterpart and is
  // not force-fitted into an existing one. "Hip Stability"/"Pelvic
  // Control" are already captured by stability; "Trunk Stiffness"/"Trunk
  // Organization" are never named here (unlike BROAD_JUMP/KNEE_JUMP), so
  // trunk_strength is not added, matching LATERAL_BOUND's identical
  // reasoning. "Left-to-Right Symmetry"/"Lower-Limb Robustness"/"Combat
  // Footwork Support" have no clean match and are skipped.
  physicalQualities: [
    "rate_of_force_development",
    "reactive_strength",
    "deceleration",
    "stability",
    "balance",
    "agility",
    "coordination",
  ],
  // Movement Pattern — Primary: "Single-Leg Horizontal Hop to Ipsilateral
  // Single-Leg Landing" (→ jump). Secondary patterns here are discrete
  // joint actions (Single-Leg Hip Extension, Knee Extension, Ankle
  // Plantar Flexion, Airborne Projection, Single-Leg Force Acceptance,
  // Unilateral Stabilization) with no MovementPattern enum counterpart —
  // notably, unlike KNEE_JUMP/LATERAL_BOUND, "Hip Hinge" is never named
  // here (see the block comment above this export), so "hinge" is not
  // added.
  movementPatterns: ["jump"],
  // Biomechanical Profile — "Primary Force Vector: Horizontal." "Secondary
  // Force Vector: Vertical" — plain and unconditional (see the block
  // comment above this export), both components represented.
  forceVectors: ["horizontal", "vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "environment", capability: "jumping_allowed" },
          { kind: "environment", capability: "safe_landing_surface" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "limited" },
        ],
      },
    ],
  },
  // Skill Requirement: "Overall Skill Requirement: Moderate". Technical
  // Complexity — Overall Complexity: "Moderate". Same dual explicit
  // "Moderate" pairing as BOX_JUMP/BROAD_JUMP/LATERAL_BOUND, mapped
  // identically: minimumTechnicalLevel 3.
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // Movement Context: "Unilateral" / "Ipsilateral" (explicit — landing on
  // the SAME leg, unlike LATERAL_BOUND's own "Contralateral" landing on
  // the opposite leg). Matches exercisePrescriptionRegistry.ts's own
  // `laterality: "unilateral"` and `volumeInterpretations:
  // ["repetitions_per_side"]`. Side alternation itself is represented
  // purely through this boolean field — no human_assistance atom, no
  // side-tracking requirement, no ad hoc capability introduced anywhere.
  unilateral: true,
  // Muscular Profile Primary Contributors (Gluteus Maximus, Quadriceps,
  // Hamstrings, Gastrocnemius, Soleus) converge on the same hip/thigh/
  // lower_leg set as every other jump entry in this file — the same
  // primary lower-body jump musculature, not a copy. Secondary/
  // Stabilizing contributors (Gluteus Medius, Adductors, Hip Flexors,
  // Tibialis Anterior, Peroneal Muscles, Intrinsic Foot Muscles, Spinal
  // Erectors, Abdominal Wall, Arm Swing Musculature, Deep Trunk
  // Musculature) are excluded, matching the precedent used throughout
  // this file.
  bodyRegionsLoaded: ["hip", "thigh", "lower_leg"],
  // "# Contraindications and Restrictions — Absolute Contraindications:
  // ...", quoted one item per source line, excluding "Unstable or unsafe
  // training surface" — an environment concern already covered by
  // `requirements` (`safe_landing_surface`), not an athlete-state
  // contraindication. The separate "Relative Contraindications" list
  // (Recent ankle sprain, Achilles tendinopathy, Patellar tendinopathy,
  // Significant knee pain, Hip pain, Marked lower-limb asymmetry, Poor
  // single-leg balance, Severe fatigue, Insufficient bilateral landing
  // competence) is excluded entirely — this fiche's own explicit
  // "Relative" label removes any ambiguity that these belong in the
  // caution tier already excluded throughout this file, not the absolute
  // tier. "Post-Rehabilitation Restriction" is excluded as non-actionable
  // here, handled generically elsewhere.
  contraindications: [
    { description: "Acute lower-limb injury.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Pain during single-leg loading.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Inability to land safely on one leg.", prohibitedPatterns: ["jump"], absolute: true },
  ],
  fatigueProfile: {
    // "# Physiological Cost" is the cleaner, more granular numeric source
    // here (same choice made for BROAD_JUMP/KNEE_JUMP/LATERAL_BOUND).
    // `technical` is sourced directly from "# Fatigue Profile —
    // Technical Sensitivity to Fatigue: High", the same direct field
    // KNEE_JUMP/LATERAL_BOUND both used. `types` excludes "systemic" —
    // unlike KNEE_JUMP/LATERAL_BOUND (whose own fiches explicitly rate
    // systemic demand LOW), this fiche simply never names a systemic
    // demand field at all in either direction, so there is no textual
    // basis to tag it either way. "impact" is included: "Joint Impact
    // Cost: Moderate" names impact directly, and Safety Profile Primary
    // Risks list "Excessive impact from overreaching" and "Achilles or
    // calf overload".
    types: ["neural", "muscular", "connective_tissue", "technical", "impact"],
    neural: 3, // "Neurological Cost: Moderate"
    muscular: 3, // "Muscular Cost: Moderate" — plain "Moderate", matching LATERAL_BOUND's identical mapping
    metabolic: 2, // "Metabolic Cost: Low" — same plain-"Low" mapping used throughout this file
    connectiveTissue: 4, // "Tendon Cost: Moderate to High", corroborated by the Joint Profile's "Peak Joint Stress: Moderate to High at the ankle, knee and hip during landing" — same "Moderate to High" mapping DEPTH_JUMP used
    technical: 4, // "Technical Sensitivity to Fatigue: High" — see the block comment above this export
  },
  // Same reasoning as every other jump entry: a real "# Evidence
  // Classification" section exists ("Exercise Category Evidence: Strong
  // for unilateral plyometric training... Direct Combat-Specific
  // Evidence: Limited"), but there is still no documented crosswalk
  // between this narrative language and the engine's level_1/level_2/
  // level_3 taxonomy. Left "unknown".
  evidenceLevel: "unknown",
  // combatSportRelevance intentionally omitted: no per-sport breakdown
  // exists anywhere in this chapter (nor in any superseded fiche — none
  // exists for this exercise) — only the aggregate "Combat Transfer"
  // narrative and "Relative Transfer Score — Combat Footwork Transfer
  // ★★★★☆". Same omission already used for `BOX_JUMP`/`DEPTH_JUMP`/
  // `BROAD_JUMP`/`KNEE_JUMP`/`LATERAL_BOUND`.
  // Most of this fiche's own Regression/Equivalent Options ("Single-Leg
  // Broad Jump", "Single-Leg Box Jump", "Skater Jump", "Single-Leg Pogo",
  // "Hop-and-Stick Drill") name no exercise with its own chapter/catalog
  // id in this repository and are therefore not referenced below (same
  // discipline applied throughout this file). The two substitutes below
  // ARE each named explicitly, including in their own dedicated
  // "Substitution Logic" subsection, AND already have their own chapter
  // here: "Lateral Bound" ("Substitute With a Lateral Bound When the
  // primary objective is frontal-plane propulsion and contralateral
  // landing"), "Bilateral Broad Jump"/"Bilateral Jump" ("Substitute With
  // a Bilateral Jump When the objective is general horizontal power and
  // unilateral control is not essential").
  substitutionExerciseIds: ["lateral_bound", "broad_jump"],
};

// -----------------------------------------------------------------------------
// Split Squat Jump
// Source: 50-exercises/63_PLYOMETRICS/16_SPLIT_SQUAT_JUMP.md
// -----------------------------------------------------------------------------

/**
 * Eighth and final Plyometrics-family entry for this integration pass. No
 * superseded top-level fiche exists for this exercise (same situation as
 * `KNEE_JUMP`/`LATERAL_BOUND`/`SINGLE_LEG_HOP`) — this `63_PLYOMETRICS`
 * chapter is the sole canonical documentation.
 *
 * Deliberately NOT copied from `SINGLE_LEG_HOP` or `LATERAL_BOUND` despite
 * the shared "unilateral-flavored bodyweight jump" family resemblance —
 * the central business question here, exactly as flagged before any
 * writing began, is whether this exercise is strictly unilateral or
 * bilateral with a staggered/alternating position, and the documented
 * answer is the latter:
 *
 * - Movement Context: "Alternating Unilateral" / "Staggered Stance" — a
 *   deliberately different, compound phrase from `SINGLE_LEG_HOP`'s/
 *   `LATERAL_BOUND`'s own clean "Unilateral" Movement Context. Every
 *   single repetition already involves BOTH legs (one front/propulsive,
 *   one rear/assisting, exchanging every rep) — there is no "choose a
 *   side, then repeat" prescription unit the way `SINGLE_LEG_HOP`'s/
 *   `LATERAL_BOUND`'s own "repetitions per side" volume works. This
 *   matches `exercisePrescriptionRegistry.ts`'s own independent
 *   `laterality: "bilateral"` and `volumeInterpretations:
 *   ["total_repetitions"]` (NOT `"repetitions_per_side"`, unlike
 *   `SINGLE_LEG_HOP`/`LATERAL_BOUND`) for this exact exercise —
 *   `unilateral: false` here. Leg alternation itself is represented
 *   purely through `movementPatterns`/`physicalQualities`/the exercise
 *   description, not through `unilateral`, and is never treated as
 *   `human_assistance` or any other requirement atom — there is nothing
 *   for another person to do in this exercise.
 * - "Equipment Requirements — Required Equipment: None" (bodyweight) rules
 *   out physical implements only (no box, pad, mat, dumbbells) — it says
 *   nothing about the landing surface itself, which is a distinct
 *   `kind: "environment"` atom in the Exercise Requirements Model, not a
 *   `kind: "equipment"` one. That question is answered separately by
 *   "Space Requirements — Surface Requirements: Flat, Stable, Non-slip,
 *   Moderately forgiving" (an unconditional list, unlike the genuinely
 *   optional items elsewhere in this same fiche), paired with an explicit
 *   "Avoid" list (concrete without shock-absorbing flooring, unstable
 *   mats, slippery surfaces, crowded areas) and reinforced by "Setup
 *   Time — The exercise can be performed immediately once sufficient
 *   safe landing space is available." `safe_landing_surface` IS therefore
 *   added here, matching `BOX_JUMP`/`DEPTH_JUMP`/`BROAD_JUMP`/`KNEE_JUMP`/
 *   `LATERAL_BOUND`/`SINGLE_LEG_HOP`'s identical requirement — only its
 *   documented location differs (grouped with space rather than
 *   equipment), not its substance. `exercisePrescriptionRegistry.ts`'s
 *   own `requiredEquipmentCapabilities: []` is not treated as decisive
 *   for this Exercise Requirements Model question: that field belongs to
 *   a different layer and does not necessarily mirror this model's own
 *   environmental capabilities.
 * - "Space Requirements — Recommended Area: Approximately 2 metres by 2
 *   metres" — the same footprint as `KNEE_JUMP`'s own "2 metres by 2
 *   metres", so `minimumSpace: "limited"` is used identically.
 * - Biomechanical Profile — "Secondary Force Vector: Horizontal
 *   Stabilization." Unlike `BROAD_JUMP`'s/`SINGLE_LEG_HOP`'s own genuine
 *   secondary force-PRODUCTION components, "Stabilization" describes
 *   resisting/controlling unwanted horizontal drift and pelvic rotation
 *   (see "Key Biomechanical Requirement — the feet must exchange without
 *   crossing, the pelvis must remain level") rather than a propulsive
 *   horizontal force component — so `"horizontal"` is deliberately NOT
 *   added to `forceVectors` here.
 * - Secondary Classifications never name "Change-of-Direction
 *   Preparation" anywhere in this chapter (unlike `LATERAL_BOUND`'s/
 *   `SINGLE_LEG_HOP`'s own explicit naming of it) — `agility` is
 *   therefore deliberately NOT added, unlike its two unilateral siblings.
 * - "# Contraindications and Restrictions" uses the same explicit
 *   "Absolute Contraindications" / "Relative Contraindications" headings
 *   `SINGLE_LEG_HOP` already established, removing interpretive ambiguity
 *   about which items belong in `contraindications` below.
 * - "Physiological Profile — Systemic Demand: Moderate" is explicitly
 *   present here (unlike `KNEE_JUMP`'s/`LATERAL_BOUND`'s own explicit LOW
 *   rating, and unlike `SINGLE_LEG_HOP`'s complete silence on the
 *   question) — "systemic" IS tagged in `fatigueProfile.types` here, a
 *   genuine divergence from every other unilateral-family entry.
 * - "# Evidence Classification — CAS Evidence Level: B" is a letter-grade
 *   scale, distinct from every other chapter's narrative/star-rating
 *   evidence language — but there is still no documented crosswalk from
 *   this grade to the engine's level_1/level_2/level_3 taxonomy, so
 *   `evidenceLevel` is still left "unknown", for the same reason as every
 *   other entry in this file.
 */
export const SPLIT_SQUAT_JUMP: ExerciseDefinition = {
  id: "split_squat_jump",
  name: "Split Squat Jump",
  module: "power",
  primaryAdaptation: "power",
  // Biomechanical Profile: "Rate of Force Development ★★★★☆" and
  // Secondary Adaptations: "Unilateral Rate of Force Development" (→
  // rate_of_force_development). Capability Mapping Secondary: "Elastic
  // Reactivity"; Secondary Adaptations: "Elastic Energy Utilization";
  // Neurological Profile: "Reactive Control Demand: Moderate to High" (→
  // reactive_strength — genuinely present here, unlike KNEE_JUMP's own
  // explicit "Reactive Demand: Low"). Capability Mapping Secondary:
  // "Deceleration Capacity"; Secondary Adaptations: "Single-Leg
  // Deceleration"; Secondary Classification: "Landing and Deceleration
  // Exercise" (→ deceleration). Capability Mapping Primary: "Alternating
  // Landing Control"; Secondary: "Hip and Pelvic Stability" (→
  // stability). Capability Mapping Secondary / Secondary Adaptations:
  // "Dynamic Balance" (→ balance). Capability Mapping Secondary /
  // Secondary Adaptations: "Interlimb Coordination" (→ coordination). No
  // "Change-of-Direction" language exists anywhere in this chapter (see
  // the block comment above this export) — agility is NOT added, unlike
  // LATERAL_BOUND/SINGLE_LEG_HOP. No "Trunk Stiffness"/"Trunk
  // Organization" Capability Mapping item exists either — trunk_strength
  // is NOT added, matching LATERAL_BOUND's/SINGLE_LEG_HOP's identical
  // reasoning. "Ankle Stiffness"/"Left-to-Right Symmetry"/"Lower-Limb
  // Robustness"/"Combat Footwork Support"/"Entry and Level-Change
  // Support" have no clean PhysicalQuality match and are skipped.
  physicalQualities: ["rate_of_force_development", "reactive_strength", "deceleration", "stability", "balance", "coordination"],
  // Movement Pattern — Primary: "Alternating Split-Stance Jump" (→ jump).
  // Secondary patterns here are discrete joint actions (Unilateral Hip
  // Extension, Knee Extension, Ankle Plantar Flexion, Airborne Limb
  // Exchange, Staggered-Stance Force Acceptance, Alternating Unilateral
  // Stabilization) with no further MovementPattern enum counterpart — no
  // "Hip Hinge" is named here (unlike KNEE_JUMP/LATERAL_BOUND), matching
  // SINGLE_LEG_HOP's identical absence, so "hinge" is not added. The
  // exercise's own name notwithstanding, this fiche's dedicated "Movement
  // Pattern" section never names "squat" as its own pattern component
  // either — only Execution Standard prose describes the split-squat
  // loading position, which this file consistently does not use as a
  // movementPatterns source (matching SINGLE_LEG_HOP's identical
  // treatment of its own Execution Standard countermovement prose).
  movementPatterns: ["jump"],
  // Biomechanical Profile — "Primary Force Vector: Vertical." "Secondary
  // Force Vector: Horizontal Stabilization" — a control/resistance
  // concept, not a propulsive component (see the block comment above this
  // export), so only the primary vector is represented.
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "environment", capability: "jumping_allowed" },
          { kind: "environment", capability: "safe_landing_surface" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "limited" },
        ],
      },
    ],
  },
  // Skill Requirement: "Overall Skill Level: Intermediate". Technical
  // Complexity — Complexity Rating: ★★★★☆ (4 of 5), corroborated by "more
  // complex than a bilateral squat jump and generally less complex than
  // high-intensity unilateral bounding or advanced depth-jump variations"
  // — the same rating and mapping KNEE_JUMP received.
  minimumTechnicalLevel: 4,
  complexity: "high",
  // Movement Context: "Alternating Unilateral" / "Staggered Stance" (see
  // the block comment above this export for the full reasoning).
  // Matches exercisePrescriptionRegistry.ts's own `laterality: "bilateral"`
  // and `volumeInterpretations: ["total_repetitions"]`.
  unilateral: false,
  // Muscular Profile Primary Muscles (Gluteus Maximus, Quadriceps,
  // Soleus, Gastrocnemius), reinforced by Secondary Muscles' own
  // Hamstrings, converge on the same hip/thigh/lower_leg set as every
  // other jump entry in this file — the same primary lower-body jump
  // musculature, not a copy. Secondary/Stabilizing contributors (Gluteus
  // Medius, Adductor Magnus, Hip Flexors, Tibialis Anterior, Foot
  // Intrinsics, Trunk Stabilizers, Obliques, Erector Spinae, Deep Hip
  // Rotators, Abdominal Wall, Scapular Stabilizers) are excluded,
  // matching the precedent used throughout this file.
  bodyRegionsLoaded: ["hip", "thigh", "lower_leg"],
  // "# Contraindications and Restrictions — Absolute Contraindications:
  // ...", quoted one item per source line, excluding "Medical restriction
  // against jumping or impact" — non-actionable here, handled generically
  // by `AthleteRestriction`/`checkHardRestrictionProhibitsMovement` in
  // `exerciseSelector.ts`, matching every other jump entry's identical
  // exclusion of the same recurring phrase. The separate "Relative
  // Contraindications" list (Recent ankle sprain, Patellar or quadriceps
  // tendon irritation, Achilles tendon symptoms, Anterior knee pain, Hip
  // pain under unilateral loading, Severe delayed-onset muscle soreness,
  // Poor pelvic control, Significant left-to-right asymmetry, High acute
  // lower-body fatigue) is excluded entirely, matching SINGLE_LEG_HOP's
  // identical treatment of its own explicitly-labeled relative tier.
  // "Return-to-Sport Restriction" is excluded as non-actionable here.
  contraindications: [
    { description: "Acute lower-limb injury.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Inability to land without pain.", prohibitedPatterns: ["jump"], absolute: true },
    { description: "Uncontrolled balance impairment.", prohibitedPatterns: ["jump"], absolute: true },
  ],
  fatigueProfile: {
    // "# Physiological Cost" is the cleaner, more granular numeric source
    // here (same choice made throughout this file). `technical` has no
    // dedicated fatigue-specific field this time (unlike KNEE_JUMP/
    // LATERAL_BOUND/SINGLE_LEG_HOP's own "Technical (Sensitivity to)
    // Fatigue: High"); sourced instead from "# Technical Complexity —
    // Complexity Rating ★★★★☆", the same substitution BOX_JUMP used for
    // its own missing dedicated field. `types` includes "systemic" —
    // "Physiological Profile — Systemic Demand: Moderate" is explicit
    // here (see the block comment above this export for why this
    // diverges from every other unilateral-family entry).
    types: ["neural", "muscular", "connective_tissue", "technical", "impact", "systemic"],
    neural: 4, // "Neurological Cost: Moderate to High"
    muscular: 3, // "Muscular Cost: Moderate"
    metabolic: 2, // "Metabolic Cost: Low during power programming" — the primary, listed programming application (power_repetition_sets); "Moderate to High during continuous sets" describes a documented but secondary variation
    connectiveTissue: 4, // "Tendon Cost: Moderate to High", corroborated by the Joint Profile's "Joint Stress Level: Moderate to High"
    technical: 4, // "Technical Complexity — Complexity Rating ★★★★☆" — see the block comment above this export
  },
  // Same reasoning as every other jump entry: a real "# Evidence
  // Classification" section exists, here uniquely expressed as a letter
  // grade ("CAS Evidence Level: B"), but there is still no documented
  // crosswalk between that grade and the engine's level_1/level_2/
  // level_3 taxonomy. Left "unknown".
  evidenceLevel: "unknown",
  // combatSportRelevance intentionally omitted: no per-sport breakdown
  // exists anywhere in this chapter (nor in any superseded fiche — none
  // exists for this exercise) — only the aggregate "Combat Transfer —
  // Combat Relevance: High" narrative and "Relative Transfer Score —
  // Overall Combat Transfer ★★★★☆". Same omission already used for every
  // other jump entry in this file.
  // Most of this fiche's own Regression/Equivalent/Substitution Logic
  // options ("Explosive split squat without take-off", "Reverse lunge to
  // knee drive", "Step-up with knee drive", "Squat jump", "Explosive
  // stance switch") name no exercise with its own chapter/catalog id in
  // this repository and are therefore not referenced below (same
  // discipline applied throughout this file). The two substitutes below
  // ARE each named explicitly in this fiche's own dedicated "Substitute
  // With a Bilateral Exercise When" subsection AND already have their own
  // chapter here: "Countermovement jump", "Box jump".
  substitutionExerciseIds: ["countermovement_jump", "box_jump"],
};

// -----------------------------------------------------------------------------
// Push Press
// Source: 50-exercises/64_POWER/10_PUSH_PRESS.md
// -----------------------------------------------------------------------------

/**
 * First entry from the `64_POWER` chapter — a loaded barbell exercise, the
 * first genuinely different exercise family in this knowledge base (every
 * prior entry is either a bodyweight plyometric jump or a medicine-ball
 * throw). A superseded root-level `50-exercises/15_PUSH_PRESS` document
 * also exists (it does carry a per-sport "Transfer to Combat Sports"
 * table this canonical chapter does not — same situation as the
 * plyometric family's own superseded fiches) — `exercisePrescriptionRegistry.ts`
 * already designates the `64_POWER` version as authoritative ("richer
 * schema than the root-level 15_PUSH_PRESS file"), and that choice is
 * followed here too.
 *
 * `requiredEquipmentCapabilities: ["barbell", "plates", "rack"]` in
 * `exercisePrescriptionRegistry.ts` matches this file's own equipment
 * atoms exactly — but that field is a different, prescription-layer
 * concept and is not treated as decisive for the Exercise Requirements
 * Model's own environmental atoms below (the lesson already learned from
 * `SPLIT_SQUAT_JUMP`'s `safe_landing_surface` correction): "Equipment
 * Requirements" and "Space Requirements" were read as two independent
 * sections in their own right.
 *
 * - "Equipment Requirements — Primary Equipment: Barbell, Weight plates,
 *   Rack, Collars." `barbell`/`plates`/`rack` all have direct
 *   `EquipmentType` counterparts and are added as required equipment
 *   atoms. `collars` has no corresponding `EquipmentType` value — not
 *   invented here, matching `exercisePrescriptionRegistry.ts`'s own
 *   identical omission. "Alternative Implements — Dumbbells, Kettlebells,
 *   Landmine apparatus" are explicitly NOT automatically equivalent
 *   ("CAS treats implement variations as related but not automatically
 *   equivalent because they alter stability, bar path, loading and
 *   mobility demands") — they are separate, distinct exercises
 *   ("Dumbbell Push Press", "Kettlebell Push Press") listed under this
 *   fiche's own "Equivalent Options", not alternative equipment for this
 *   exact exercise, and are therefore not added as an `any_of` equipment
 *   branch here.
 * - "Space Requirements — Moderate floor space, Adequate overhead
 *   clearance, Clear frontal and lateral safety area, Stable non-slip
 *   surface." The literal word "Moderate" grounds `minimumSpace:
 *   "moderate"` directly. The "Stable non-slip surface" requirement is a
 *   genuine environmental atom — but `floor_safe`, not
 *   `safe_landing_surface`, is used here: this is a standing barbell
 *   press with no landing or jumping phase at all (the doc never uses
 *   the word "jump" for this exercise's own execution), so the
 *   "landing surface" framing would be semantically dishonest even though
 *   both capabilities read the identical `TrainingEnvironment.floorSafe`
 *   field. `jumping_allowed` is correspondingly NOT added — the first
 *   entry in this file's power-adjacent exercises with no jump/landing
 *   phase whatsoever.
 */
export const PUSH_PRESS: ExerciseDefinition = {
  id: "push_press",
  name: "Push Press",
  module: "power",
  primaryAdaptation: "power",
  // Secondary Classifications: "Explosive Strength" (exact label,
  // appearing three times across this chapter — Secondary
  // Classifications, Secondary Adaptations and Capability Mapping's own
  // Primary Capability Modules). Secondary Adaptations: "Rate of Force
  // Development" (exact match), "Intermuscular Coordination" / Secondary
  // Classifications "Whole-Body Coordination" (→ coordination), "Trunk
  // Stiffness" (→ trunk_strength, matching BROAD_JUMP's/KNEE_JUMP's own
  // identical mapping), "Overhead Stability" (→ stability). No "Reactive"
  // language exists anywhere in this chapter (checked directly) —
  // reactive_strength is not added, consistent with this being a
  // grinding-capable loaded lift rather than a bodyweight elastic
  // exercise. "Upper-Body Propulsive Power"/"Vertical Force Transfer"/
  // "Lower-to-Upper Force Transfer"/"Leg-Drive Coordination"/"Athletic
  // Timing"/"Ballistic Pressing"/"Strength-Speed" have no distinct
  // PhysicalQuality counterpart beyond what is already listed and are not
  // force-fitted into a new value. "Shoulder-Girdle Strength" is a
  // region-specific note captured instead by `bodyRegionsLoaded` below,
  // not a whole-body quality.
  physicalQualities: ["explosive_strength", "rate_of_force_development", "trunk_strength", "stability", "coordination"],
  // "# Movement Pattern" lists a flat set (not Primary/Secondary this
  // time): "Dip and Drive" (→ squat — a genuine, if shallow, knee-and-hip
  // bend named as its own distinct pattern component, per the Execution
  // Standard's own "Bend the knees and hips slightly"), "Vertical Press"
  // (→ vertical_push, exact conceptual match), "Overhead Stabilization"
  // (→ isometric, matching the Contraction Profile's own "Isometric
  // stabilization overhead"). "Triple-Extension-Assisted Propulsion" has
  // no MovementPattern counterpart (no true flight/jump phase occurs —
  // the doc never treats this as a jump) and is not represented here.
  movementPatterns: ["squat", "vertical_push", "isometric"],
  // No dedicated "Force Vector" heading exists in this chapter (unlike
  // the plyometric family), but the Biomechanical Profile and Execution
  // Standard are saturated with unambiguous vertical-direction language
  // throughout ("a vertical dip", "Move the bar vertically", "Press the
  // bar vertically rather than around the face", "stacked over the
  // shoulders, trunk and base of support") and explicitly treat forward
  // bar drift as a Technical Failure Criterion ("the bar travels
  // substantially forward") — a directly documented, repeatedly
  // reinforced vertical force vector, not an inferred one.
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "barbell" },
          { kind: "equipment", equipment: "plates" },
          { kind: "equipment", equipment: "rack" },
          { kind: "environment", capability: "floor_safe" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "moderate" },
        ],
      },
    ],
  },
  // Skill Requirement: "Intermediate". Technical Complexity — Overall
  // Complexity: "Moderate" (explicit, direct match) — the same clean
  // single-word rating BOX_JUMP/BROAD_JUMP/LATERAL_BOUND/SINGLE_LEG_HOP
  // all received, mapped identically: minimumTechnicalLevel 3.
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // Movement Context: "Bilateral" (explicit). Matches
  // exercisePrescriptionRegistry.ts's own `laterality: "bilateral"`.
  unilateral: false,
  // Muscular Profile Primary Contributors (Quadriceps, Gluteus maximus,
  // Deltoids, Triceps brachii) — the first entry in this file whose
  // primary contributors span both lower body and upper body, reflecting
  // the genuine whole-body lower-to-upper force transfer this exercise is
  // built around. Secondary/Stabilizing contributors (Calves, Upper
  // pectoralis major, Trapezius, Serratus anterior, Spinal erectors,
  // Abdominal wall, Forearm and hand musculature, Rotator cuff, Scapular
  // stabilizers, Deep trunk musculature, Hip stabilizers, Foot and ankle
  // stabilizers) are excluded, matching the precedent used throughout
  // this file.
  bodyRegionsLoaded: ["thigh", "hip", "shoulder", "upper_arm"],
  // "# Contraindications and Restrictions — Potential Contraindications:
  // ...", quoted one item per source line. None of these seven items are
  // equipment/environment concerns already covered by `requirements`, so
  // none are excluded on that basis (unlike the jump family's own
  // recurring "unsafe surface"/"medical restriction" exclusions — no such
  // items appear in this list). The separate "Restrictions Requiring
  // Modification" list (Limited shoulder flexion, Limited thoracic
  // extension, Poor front-rack mobility, History of shoulder instability,
  // Poor trunk anti-extension control, Knee pain during rapid dip and
  // drive, Low technical experience) is excluded entirely, matching the
  // same absolute-tier-only discipline used throughout this file.
  contraindications: [
    { description: "Acute shoulder pain.", prohibitedPatterns: ["squat", "vertical_push", "isometric"], absolute: true },
    { description: "Acute elbow or wrist injury.", prohibitedPatterns: ["squat", "vertical_push", "isometric"], absolute: true },
    {
      description: "Inability to reach a controlled overhead position.",
      prohibitedPatterns: ["squat", "vertical_push", "isometric"],
      absolute: true,
    },
    {
      description: "Unresolved cervical pain aggravated by overhead loading.",
      prohibitedPatterns: ["squat", "vertical_push", "isometric"],
      absolute: true,
    },
    {
      description: "Acute lumbar pain aggravated by extension or axial loading.",
      prohibitedPatterns: ["squat", "vertical_push", "isometric"],
      absolute: true,
    },
    {
      description: "Inability to support the bar safely in the front rack.",
      prohibitedPatterns: ["squat", "vertical_push", "isometric"],
      absolute: true,
    },
    { description: "Severe balance impairment.", prohibitedPatterns: ["squat", "vertical_push", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Physiological Cost" is the cleaner, more granular numeric
    // source (same choice made throughout this file). `technical` is
    // sourced directly from "# Fatigue Profile — Technical Fatigue
    // Sensitivity: High", the same direct field KNEE_JUMP/LATERAL_BOUND/
    // SINGLE_LEG_HOP all used. `types` excludes "impact" — this is a
    // standing barbell press with no landing/ground-impact phase at all,
    // genuinely not applicable, unlike every bodyweight jump entry in
    // this file. `types` also excludes "systemic": "Systemic Fatigue:
    // Low to moderate when volume is controlled" is explicitly anchored
    // toward the low end and qualified by this exercise's own default,
    // intended low-repetition/full-recovery programming (Loading
    // Profile), matching the same "explicit low rating → exclude"
    // treatment used for KNEE_JUMP/LATERAL_BOUND.
    types: ["neural", "muscular", "connective_tissue", "technical"],
    neural: 3, // "Neurological Cost: Moderate"
    muscular: 3, // "Muscular Cost: Moderate"
    metabolic: 2, // "Metabolic Cost: Low when programmed for power" — the exercise's own default, intended programming context (power_repetition_sets)
    connectiveTissue: 3, // "Joint and Connective-Tissue Cost: Moderate at the shoulders, wrists and elbows"
    technical: 4, // "Technical Fatigue Sensitivity: High" — see the block comment above this export
  },
  // Same reasoning as every other entry: a real "# Evidence
  // Classification" section exists ("Moderate to High for loaded
  // ballistic and weightlifting-derivative training...", "Moderate for
  // the Push Press as a specific tool...", "High for the importance of
  // maximal intent..."), but there is still no documented crosswalk
  // between this narrative language and the engine's level_1/level_2/
  // level_3 taxonomy. Left "unknown".
  evidenceLevel: "unknown",
  // combatSportRelevance intentionally omitted: no per-sport breakdown
  // exists anywhere in this canonical chapter — only the aggregate
  // "Combat Transfer" narrative and "Relative Transfer Score — Combat
  // Force-Transfer Relevance ★★★★☆". The superseded root-level
  // `50-exercises/15_PUSH_PRESS` document does carry a per-sport
  // "Transfer to Combat Sports" table, but it is not this exercise's
  // canonical documentation and is not used here (same situation as the
  // plyometric family's own superseded fiches).
  // Most of this fiche's own Regression/Equivalent Options ("Dumbbell
  // Push Press", "Kettlebell Push Press", "Landmine Push Press", "Push
  // Jerk", "Strict Press with Technical Emphasis", "Dip-and-Drive Drill
  // Without Press") name no exercise with its own chapter/catalog id in
  // this repository and are therefore not referenced below (same
  // discipline applied throughout this file). The two substitutes below
  // ARE each named explicitly in this fiche's own dedicated
  // "Substitution Logic — Preferred Substitutions by Limitation"
  // subsection AND already have their own chapter here: "Medicine-Ball
  // Chest Pass" ("Overhead restriction"), "Medicine-Ball Overhead Throw"
  // ("Low technical competency" / "Need for release-based ballistic
  // action").
  substitutionExerciseIds: ["med_ball_chest_pass", "med_ball_overhead_throw"],
};

// -----------------------------------------------------------------------------
// Hang High Pull
// Source: 50-exercises/64_POWER/11_HANG_HIGH_PULL.md
// -----------------------------------------------------------------------------

/**
 * Second entry from the `64_POWER` chapter. No superseded root-level
 * fiche exists for this exercise (unlike `PUSH_PRESS`'s own
 * `50-exercises/15_PUSH_PRESS`) — this `64_POWER` chapter is the sole
 * canonical documentation.
 *
 * Deliberately NOT copied from `PUSH_PRESS` despite the shared "loaded
 * barbell power exercise" family resemblance — this is a PULL from a
 * hang position, not a PRESS from a front rack, and several documented
 * properties diverge accordingly:
 *
 * - "It differs from the Hang Power Clean because the bar is not received
 *   on the shoulders." The exercise begins and ends in the hang — there
 *   is no rack, no catch, no overhead phase. "Equipment Requirements —
 *   Primary Equipment: Barbell, Weight plates, Secure collars." No
 *   "Rack" is named anywhere in this chapter (checked directly), unlike
 *   `PUSH_PRESS`'s own explicit rack requirement — matching
 *   `exercisePrescriptionRegistry.ts`'s own independent
 *   `requiredEquipmentCapabilities: ["barbell", "plates"]` (no `"rack"`,
 *   unlike `PUSH_PRESS`'s `["barbell", "plates", "rack"]`). `collars` has
 *   no corresponding `EquipmentType` value, matching the same omission
 *   already used for `PUSH_PRESS`.
 * - No surface-safety language exists anywhere in this chapter at all
 *   (checked directly — zero occurrences of "surface", "non-slip",
 *   "stable floor", "flat" or "slippery"), unlike `PUSH_PRESS`'s own
 *   explicit "Stable non-slip surface" requirement. `floor_safe` is
 *   therefore deliberately NOT added here — a genuine divergence, not an
 *   oversight (this is the lesson already learned from `SPLIT_SQUAT_JUMP`
 *   applied in the other direction: absence of equipment does not by
 *   itself exclude an environmental atom, but a genuine, checked absence
 *   of the environmental language itself does).
 * - "Space Requirements — Minimum Space: Enough room to stand and move
 *   the bar vertically without obstruction" — vaguer and narrower than
 *   `PUSH_PRESS`'s own literal "Moderate floor space" plus "Adequate
 *   overhead clearance" plus "Clear frontal and lateral safety area"
 *   (this exercise never travels overhead), so `minimumSpace: "limited"`
 *   is used here rather than `PUSH_PRESS`'s `"moderate"`.
 * - "the athlete jumps forward or backward excessively" is listed as its
 *   own Technical Failure Criterion — jumping is a documented FAILURE
 *   mode here, not a required capability, reinforcing (even more
 *   explicitly than `PUSH_PRESS`) that `jumping_allowed` has no place in
 *   `requirements`.
 */
export const HANG_HIGH_PULL: ExerciseDefinition = {
  id: "hang_high_pull",
  name: "Hang High Pull",
  module: "power",
  primaryAdaptation: "power",
  // Secondary Classifications: "Explosive Strength" (exact label,
  // appearing three times — Secondary Classifications, Secondary
  // Adaptations and Capability Mapping's own Primary Capability
  // Modules, the same pattern PUSH_PRESS's own chapter used). Secondary
  // Adaptations: "Rate of Force Development" (exact match),
  // "Intermuscular Coordination" / Secondary Classifications "Whole-Body
  // Coordination" / Capability Mapping Secondary "Movement Coordination"
  // (→ coordination), "Trunk Stiffness" / Capability Mapping Secondary
  // "Trunk Stability" (→ trunk_strength — both phrasings of the same
  // trunk-bracing concept here, unlike PUSH_PRESS's own genuinely
  // distinct "Trunk Stiffness" vs. "Overhead Stability" pair, so no
  // separate "stability" quality is added — this exercise has no
  // overhead or landing phase to ground one). "Grip Strength" appears
  // explicitly twice (Secondary Adaptations, Capability Mapping Tertiary)
  // — the first entry in this catalog to earn grip_strength, a genuine
  // divergence from PUSH_PRESS, which never mentions grip as its own
  // capability. "Posterior-Chain Recruitment"/"Posterior-Chain Strength"
  // and "Scapular Elevation Strength" are region-specific notes captured
  // instead by `bodyRegionsLoaded` below, not whole-body qualities.
  // "Hip Extension Power"/"Lower-Body Propulsive Power"/"Vertical Force
  // Expression"/"Athletic Timing"/"Strength-Speed"/"Weightlifting
  // Derivative" have no distinct counterpart beyond what is already
  // listed. No "Reactive" language exists anywhere in this chapter
  // (checked directly) — reactive_strength is not added.
  physicalQualities: ["explosive_strength", "rate_of_force_development", "trunk_strength", "grip_strength", "coordination"],
  // "# Movement Pattern" (a flat list, matching PUSH_PRESS's own chapter
  // format): "Hip Hinge" (→ hinge, the same enum-backed representation
  // KNEE_JUMP/LATERAL_BOUND already established for their own "Hip
  // Hinge"), "Vertical Pull" (→ vertical_pull — a PULL, not
  // PUSH_PRESS's own vertical_push; this is the central business
  // distinction the integration step was required to verify). "Explosive
  // Triple Extension" and "Loaded Acceleration" have no MovementPattern
  // counterpart and are not represented here.
  movementPatterns: ["hinge", "vertical_pull"],
  // No dedicated "Force Vector" heading exists in this chapter (matching
  // PUSH_PRESS's own prose-only Biomechanical Profile format), but the
  // prose is unambiguous and repeatedly reinforced throughout: "The bar
  // should travel vertically and remain close to the body", "a close and
  // predominantly vertical bar path", "Guide the bar vertically rather
  // than curling it toward the chest", "Move the bar vertically"
  // (coaching cue) — and "the bar drifts substantially away from the
  // body" is its own Technical Failure Criterion, confirming vertical is
  // the sole intended direction.
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "barbell" },
          { kind: "equipment", equipment: "plates" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "limited" },
        ],
      },
    ],
  },
  // Skill Requirement: "Overall Skill Requirement: Moderate to high".
  // Technical Complexity — Complexity Rating: "Moderate to high"
  // (corroborating). Both sections explicitly caution against
  // underestimating this exercise ("It should not be classified as a
  // low-skill exercise merely because no catch is performed"; "the
  // exercise remains more technical than a conventional strength
  // movement or basic jump") — a materially higher floor than
  // PUSH_PRESS's own clean single-word "Moderate" rating, hence mapped
  // one tier up: minimumTechnicalLevel 4, complexity "high".
  minimumTechnicalLevel: 4,
  complexity: "high",
  // Movement Context: "Bilateral" (explicit). Matches
  // exercisePrescriptionRegistry.ts's own `laterality: "bilateral"`.
  unilateral: false,
  // Muscular Profile Primary Contributors (Gluteus maximus, Quadriceps,
  // Hamstrings, Trapezius) → hip, thigh, shoulder. Unlike PUSH_PRESS,
  // Biceps brachii and Triceps brachii are only Secondary Contributors
  // here, not Primary — no upper_arm region is added, a genuine
  // divergence reflecting that the arms continue the bar path only after
  // the lower body has already produced the acceleration ("Only after
  // the lower body has produced maximal acceleration do the elbows rise
  // outward and upward"). Secondary/Stabilizing contributors (Calves,
  // Spinal erectors, Latissimus dorsi, Rear deltoids, Biceps brachii,
  // Forearm and hand musculature, Abdominal wall, Deep trunk musculature,
  // Scapular stabilizers, Hip stabilizers, Foot and ankle stabilizers,
  // Rotator cuff) are excluded, matching the precedent used throughout
  // this file.
  bodyRegionsLoaded: ["hip", "thigh", "shoulder"],
  // "# Contraindications and Restrictions — Potential Contraindications:
  // ...", quoted one item per source line. "Uncontrolled hypertension or
  // medical restriction against high-intensity lifting" is trimmed to
  // its specific, actionable half ("Uncontrolled hypertension") — the
  // generic "medical restriction against X" clause is excluded
  // throughout this file, handled generically elsewhere by
  // `AthleteRestriction`/`checkHardRestrictionProhibitsMovement` in
  // `exerciseSelector.ts`. The separate "Potential Restrictions" tier
  // (Limited ankle mobility, Poor posterior-chain tolerance, Low barbell
  // experience, Insufficient trunk control, High concurrent lower-body
  // fatigue, Recent heavy deadlift or sprint exposure, Shoulder
  // discomfort during high elbow positions) is excluded entirely,
  // matching PUSH_PRESS's own identical two-tier treatment.
  contraindications: [
    { description: "Acute low-back pain.", prohibitedPatterns: ["hinge", "vertical_pull"], absolute: true },
    { description: "Acute hamstring injury.", prohibitedPatterns: ["hinge", "vertical_pull"], absolute: true },
    { description: "Acute hip or knee injury.", prohibitedPatterns: ["hinge", "vertical_pull"], absolute: true },
    { description: "Acute shoulder or elbow pain.", prohibitedPatterns: ["hinge", "vertical_pull"], absolute: true },
    { description: "Severe grip limitation.", prohibitedPatterns: ["hinge", "vertical_pull"], absolute: true },
    { description: "Inability to maintain a stable hinge position.", prohibitedPatterns: ["hinge", "vertical_pull"], absolute: true },
    { description: "Uncontrolled hypertension.", prohibitedPatterns: ["hinge", "vertical_pull"], absolute: true },
  ],
  fatigueProfile: {
    // "# Physiological Cost" is the cleaner, more granular numeric
    // source (same choice made throughout this file), corroborated by
    // "# Fatigue Profile"'s own dimension names.
    // `metabolic` is sourced from "Metabolic Cost: Low when correctly
    // programmed" — near-verbatim to BOX_JUMP's/DEPTH_JUMP's own
    // "Low when programmed correctly" (rating 1), not PUSH_PRESS's
    // slightly different "Low when programmed for power" (rating 2), so
    // the closer BOX_JUMP/DEPTH_JUMP match is used here.
    // `types` includes "impact": Technical Failure Criteria and Safety
    // Profile both name "the bar collides heavily with the thighs or
    // pelvis" as a real, specific collision risk. `types` includes
    // "systemic": "Systemic Fatigue: Moderate when volume and load are
    // controlled" is a plain, unqualified "Moderate" rating (not an
    // explicit low one), matching the same inclusion reasoning
    // SPLIT_SQUAT_JUMP's own explicit "Systemic Demand: Moderate"
    // received.
    types: ["neural", "muscular", "connective_tissue", "technical", "impact", "systemic"],
    neural: 4, // "Neurological Cost: Moderate to high", corroborated by "Neurological Fatigue: Moderate to high per high-quality repetition"
    muscular: 3, // "Muscular Cost: Moderate", corroborated by "Local Muscular Fatigue: Moderate in the posterior chain, upper back and grip"
    metabolic: 1, // "Metabolic Cost: Low when correctly programmed" — see comment above
    connectiveTissue: 3, // "Joint Cost: Moderate"
    technical: 4, // "Technical Fatigue Sensitivity: High" — the same direct field KNEE_JUMP/LATERAL_BOUND/SINGLE_LEG_HOP/PUSH_PRESS all used
  },
  // Same reasoning as every other entry: a real "# Evidence
  // Classification" section exists ("Evidence Level: Moderate"), but
  // there is still no documented crosswalk between this narrative rating
  // and the engine's level_1/level_2/level_3 taxonomy — a single clean
  // word is not itself a crosswalk. Left "unknown".
  evidenceLevel: "unknown",
  // combatSportRelevance intentionally omitted: no per-sport breakdown
  // exists anywhere in this chapter (nor in any superseded fiche — none
  // exists for this exercise) — only the aggregate "Combat Transfer"
  // narrative and "Relative Transfer Score — Combat-Sport Physical
  // Transfer: Moderate to high". Same omission already used for every
  // other entry in this file.
  // Most of this fiche's own Regression/Equivalent/Substitution Logic
  // options ("Trap-Bar Jump", "Loaded Jump Squat", "Kettlebell Swing",
  // "Clean Pull from Hang", "Hang Jump Shrug") name no exercise with its
  // own chapter/catalog id in this repository and are therefore not
  // referenced below. "Hang Jump Shrug" is not assumed equivalent to the
  // separately-titled `50-exercises/64_POWER/13_JUMP_SHRUG.md` ("Jump
  // Shrug", no "Hang" prefix) without this fiche's own text confirming
  // it — the same discipline already applied to LATERAL_BOUND's own
  // "Single-Leg Lateral Hop" vs. `single_leg_hop` question. The three
  // substitutes below ARE each named explicitly in this fiche's own
  // dedicated "Substitution Logic — Preferred substitutions by
  // objective" subsection AND already have their own chapter here:
  // "Medicine Ball Scoop Toss" ("For hip-dominant power"), "Broad Jump"
  // / "Box Jump" ("For unloaded explosive power").
  substitutionExerciseIds: ["med_ball_scoop_toss", "broad_jump", "box_jump"],
};

// -----------------------------------------------------------------------------
// Hang Power Clean
// Source: 50-exercises/64_POWER/12_HANG_POWER_CLEAN.md
// -----------------------------------------------------------------------------

/**
 * Third entry from the `64_POWER` chapter. No prescription-registry entry
 * exists for this exercise yet (`exercisePrescriptionRegistry.ts` has not
 * integrated `hang_power_clean` — confirmed by direct search), so unlike
 * every other entry in this file there is no independent equipment/
 * laterality corroboration available from that layer; the canonical
 * documentation is the sole source here. A superseded root-level
 * `50-exercises/25_HANG_POWER_CLEAN` document also exists (it does carry
 * a per-sport "Transfer to Combat Sports" table this canonical chapter
 * does not — the same situation as every other superseded fiche in this
 * file), and the same project-wide convention (the numbered `64_POWER`
 * chapter version is authoritative) is followed here too.
 *
 * Deliberately NOT copied from `HANG_HIGH_PULL` despite beginning from the
 * identical hang position — the defining difference is the CATCH: "The
 * Hang Power Clean differs from the Hang High Pull because the bar is
 * received on the shoulders in a front-rack position rather than
 * continued upward with the elbows." `"front rack"` here is an
 * anatomical/postural term (where the bar rests across the front of the
 * shoulders during the catch) — it is NOT the physical equipment item
 * `rack` (a stand used to hold a barbell at a starting height), and the
 * two must not be confused. Several documented properties diverge from
 * `HANG_HIGH_PULL` accordingly:
 *
 * - "Equipment Requirements — Primary Equipment: Barbell, Weight plates,
 *   Secure collars." No physical `rack` equipment is named anywhere in
 *   this chapter (checked directly) — the exercise begins and ends in the
 *   hang, exactly like `HANG_HIGH_PULL`, and the front-rack catch is a
 *   body position, not a piece of equipment to load or unload from. No
 *   `rack` equipment atom is added, matching `HANG_HIGH_PULL`'s own
 *   identical equipment set exactly (`barbell` + `plates`, no `rack`,
 *   `collars` omitted for lacking an `EquipmentType` value).
 * - No surface-safety language exists anywhere in this chapter either
 *   (checked directly — zero occurrences of "surface", "non-slip",
 *   "stable floor", "flat" or "slippery"), matching `HANG_HIGH_PULL`'s
 *   own identical, checked absence — `floor_safe` is not added.
 * - "Space Requirements — Minimum Space: Enough room to stand, extend and
 *   receive the bar in the front rack without obstruction" mirrors
 *   `HANG_HIGH_PULL`'s own "Enough room to stand and move the bar
 *   vertically without obstruction" almost verbatim, with the added catch
 *   clause describing a postural change within the same standing station
 *   rather than a materially larger footprint — `minimumSpace: "limited"`
 *   is kept the same as `HANG_HIGH_PULL`, absent any genuine
 *   distinguishing magnitude signal (neither fiche uses a quantifier word
 *   like "Moderate" the way `PUSH_PRESS`'s own Space Requirements does).
 * - `reactive_strength`, `deceleration` and `stability` are all added
 *   here — none were added for `HANG_HIGH_PULL`, which has no catch phase
 *   to ground them: "High reactive and deceleration demand during the
 *   catch", "Deceleration and Receiving Skill" (Capability Mapping's own
 *   Primary Capability Module), "Positional Stability Under Load" /
 *   "Front-Rack Stability" (Secondary Adaptations).
 * - `movementPatterns` uses `"squat"` for the catch (the doc's own
 *   Biomechanical Profile and Execution Standard repeatedly name a
 *   literal "quarter-squat" receiving position), not `"vertical_pull"` —
 *   this fiche's own dedicated "# Movement Pattern" section names "Rapid
 *   Turnover" and "Receiving and Deceleration" instead of "Vertical
 *   Pull" for the upper-body action (unlike `HANG_HIGH_PULL`'s own
 *   Movement Pattern section, which does name "Vertical Pull"), so
 *   `vertical_pull` is deliberately NOT carried over here.
 * - Skill Requirement and Technical Complexity are both a clean, explicit
 *   "High" — but the same chapter repeatedly and explicitly states this
 *   exercise EXCEEDS `HANG_HIGH_PULL`'s own complexity ("more technically
 *   demanding than either the Hang High Pull or the Jump Shrug", "the
 *   highest technical-readiness threshold in the Power category", "the
 *   highest-complexity exercise in the Power category, exceeding the
 *   Hang High Pull, Push Press and Jump Shrug"). A plain word-for-word
 *   "High" → `minimumTechnicalLevel: 4` mapping (identical to
 *   `HANG_HIGH_PULL`'s own rating) would erase this fiche's own explicit,
 *   repeated, structured claim that the two are NOT equivalent in
 *   difficulty — so `complexity: "very_high"` / `minimumTechnicalLevel: 5`
 *   is used instead, the first use of this file's top complexity tier,
 *   directly earned by this specific comparative documentation rather
 *   than assumed.
 * - No ad hoc "catch"/"turnover"/"receiving" capability is introduced
 *   anywhere in this file — turnover speed, bar height, catch depth and
 *   receiving mechanics remain entirely in this comment, the biomechanical
 *   fields above and the (untouched) prescription layer, never in
 *   `requirements`.
 */
export const HANG_POWER_CLEAN: ExerciseDefinition = {
  id: "hang_power_clean",
  name: "Hang Power Clean",
  module: "power",
  primaryAdaptation: "power",
  // Secondary Classifications: "Explosive Strength" (exact label,
  // appearing three times — the same recurring pattern as PUSH_PRESS's
  // and HANG_HIGH_PULL's own chapters). Secondary Adaptations: "Rate of
  // Force Development" (exact match). Neurological Profile: "High
  // reactive and deceleration demand during the catch"; Velocity
  // Profile: "maximal reactive speed during the turnover" (→
  // reactive_strength — see the block comment above this export for why
  // this diverges from HANG_HIGH_PULL). Secondary Adaptations: "Rapid
  // Deceleration and Force Absorption"; Capability Mapping Primary:
  // "Deceleration and Receiving Skill" (→ deceleration). Secondary
  // Adaptations: "Positional Stability Under Load", "Front-Rack
  // Stability"; Capability Mapping Secondary: "Trunk Stability" (→
  // stability). Secondary Adaptations: "Trunk Stiffness" (→
  // trunk_strength, matching HANG_HIGH_PULL's own identical mapping).
  // "Grip Strength" appears twice (Secondary Adaptations, Capability
  // Mapping Tertiary), matching HANG_HIGH_PULL's own identical inclusion
  // (→ grip_strength). "Whole-Body Coordination" / "Intermuscular
  // Coordination" / "Movement Coordination" (→ coordination). "Front-Rack
  // Mobility" (Capability Mapping Secondary only, never listed as a
  // Secondary Adaptation the way HANG_HIGH_PULL's "Grip Strength" is) is
  // read as a prerequisite note, not a trained outcome quality, and is
  // deliberately NOT added as `mobility` — no such distinction exists for
  // any other Capability-Mapping-only item elsewhere in this file either.
  // "Posterior-Chain Recruitment"/"Posterior-Chain Strength" and
  // "Hip Extension Power"/"Lower-Body Propulsive Power"/"Athletic Timing"/
  // "Strength-Speed"/"Weightlifting Derivative"/"Receiving Power" have no
  // distinct counterpart beyond what is already listed or are
  // region-specific notes captured by `bodyRegionsLoaded` instead.
  physicalQualities: [
    "explosive_strength",
    "rate_of_force_development",
    "reactive_strength",
    "deceleration",
    "stability",
    "trunk_strength",
    "grip_strength",
    "coordination",
  ],
  // "# Movement Pattern" (a flat list): "Hip Hinge" (→ hinge, matching
  // HANG_HIGH_PULL's own identical mapping), "Receiving and Deceleration"
  // (→ squat — the doc's own Biomechanical Profile and Execution Standard
  // both explicitly name a literal "quarter-squat" receiving position:
  // "arriving in a quarter-squat...", "Absorb the impact with a
  // coordinated bend of the hips, knees and ankles into a quarter-
  // squat..."). "Explosive Triple Extension", "Rapid Turnover" and
  // "Loaded Acceleration" have no MovementPattern counterpart. See the
  // block comment above this export for why "vertical_pull" is
  // deliberately NOT carried over from HANG_HIGH_PULL.
  movementPatterns: ["hinge", "squat"],
  // No dedicated "Force Vector" heading exists in this chapter (matching
  // every other 64_POWER entry's prose-only Biomechanical Profile
  // format), but the prose remains unambiguous: "The bar should travel
  // vertically and remain close to the body throughout the extension",
  // reinforced by "the bar drifts substantially away from the body during
  // the pull" as its own Technical Failure Criterion.
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "barbell" },
          { kind: "equipment", equipment: "plates" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "limited" },
        ],
      },
    ],
  },
  // Skill Requirement: "Overall Skill Requirement: High". Technical
  // Complexity — Complexity Rating: "High", but see the block comment
  // above this export for why this maps to the top tier
  // (minimumTechnicalLevel 5, complexity "very_high") rather than the
  // same "high"/4 HANG_HIGH_PULL received for its own "Moderate to high"
  // rating — this fiche's own repeated, explicit comparative claims
  // ("exceeding the Hang High Pull, Push Press and Jump Shrug") require
  // it.
  minimumTechnicalLevel: 5,
  complexity: "very_high",
  // Movement Context: "Bilateral" (explicit).
  unilateral: false,
  // Muscular Profile Primary Contributors (Gluteus maximus, Quadriceps,
  // Hamstrings, Trapezius, Deltoids) → hip, thigh, shoulder — the same
  // region set HANG_HIGH_PULL earned, even though Deltoids is newly
  // Primary here (reflecting the added front-rack catch load) and
  // Trapezius already covers "shoulder" for both entries. Secondary/
  // Stabilizing contributors (Calves, Spinal erectors, Latissimus dorsi,
  // Rear deltoids, Forearm and hand musculature, Triceps brachii,
  // Abdominal wall, Deep trunk musculature, Scapular stabilizers, Hip
  // stabilizers, Foot and ankle stabilizers, Rotator cuff, Wrist flexors
  // and extensors) are excluded, matching the precedent used throughout
  // this file — "wrist" is not added despite the doc's extensive wrist-
  // tolerance discussion, since Wrist flexors and extensors are only a
  // Stabilizing Contributor, never Primary.
  bodyRegionsLoaded: ["hip", "thigh", "shoulder"],
  // "# Contraindications and Restrictions — Potential Contraindications:
  // ...", quoted one item per source line. "Uncontrolled hypertension or
  // medical restriction against high-intensity lifting" is trimmed to
  // its specific, actionable half ("Uncontrolled hypertension"), matching
  // HANG_HIGH_PULL's own identical treatment of the same recurring
  // clause. The separate "Potential Restrictions" tier (Limited
  // front-rack or wrist mobility, Limited ankle mobility, Poor
  // posterior-chain tolerance, Low barbell experience, Insufficient
  // trunk control, High concurrent lower-body fatigue, Recent heavy
  // deadlift or sprint exposure, Shoulder discomfort during the catch
  // position) is excluded entirely, matching the same two-tier discipline
  // used throughout this file.
  contraindications: [
    { description: "Acute low-back pain.", prohibitedPatterns: ["hinge", "squat"], absolute: true },
    { description: "Acute hamstring injury.", prohibitedPatterns: ["hinge", "squat"], absolute: true },
    { description: "Acute hip, knee or ankle injury.", prohibitedPatterns: ["hinge", "squat"], absolute: true },
    { description: "Acute shoulder, elbow or wrist pain.", prohibitedPatterns: ["hinge", "squat"], absolute: true },
    { description: "Inability to achieve a stable front-rack position.", prohibitedPatterns: ["hinge", "squat"], absolute: true },
    { description: "Severe grip limitation.", prohibitedPatterns: ["hinge", "squat"], absolute: true },
    { description: "Inability to maintain a stable hinge position.", prohibitedPatterns: ["hinge", "squat"], absolute: true },
    { description: "Uncontrolled hypertension.", prohibitedPatterns: ["hinge", "squat"], absolute: true },
  ],
  fatigueProfile: {
    // "# Physiological Cost" is the cleaner, more granular numeric
    // source (same choice made throughout this file), corroborated by
    // "# Fatigue Profile"'s own dimension names. `metabolic` uses the
    // "Low to moderate" range rating (2), not HANG_HIGH_PULL's plain
    // "Low" (1) — this fiche's own Metabolic Cost is explicitly a wider
    // range, reflecting the added turnover/catch/stand phases. `technical`
    // is sourced from "Technical Fatigue Sensitivity: Very high" — the
    // strongest fatigue-sensitivity language anywhere in this catalog,
    // mapped to the ceiling rating (5), one full point above every other
    // entry's own "High" → 4 mapping. `types` includes "impact": Technical
    // Failure Criteria and Safety Profile both name "the catch produces a
    // hard, uncontrolled collision with the shoulders" / "Bar collision
    // with the shoulders, chin or chest". `types` includes "systemic":
    // "Systemic Fatigue: Moderate when volume and load are controlled" is
    // the exact same phrase HANG_HIGH_PULL's own fiche uses, with the
    // same inclusion reasoning.
    types: ["neural", "muscular", "connective_tissue", "technical", "impact", "systemic"],
    neural: 4, // "Neurological Cost: High"
    muscular: 4, // "Muscular Cost: Moderate to high" — higher than HANG_HIGH_PULL's own plain "Moderate" (3)
    metabolic: 2, // "Metabolic Cost: Low to moderate when correctly programmed" — see comment above
    connectiveTissue: 4, // "Joint Cost: Moderate to high, particularly at the wrists, shoulders and knees"
    technical: 5, // "Technical Fatigue Sensitivity: Very high" — see comment above
  },
  // Same reasoning as every other entry: a real "# Evidence
  // Classification" section exists ("Evidence Level: Moderate"), but
  // there is still no documented crosswalk between this narrative rating
  // and the engine's level_1/level_2/level_3 taxonomy. Left "unknown".
  evidenceLevel: "unknown",
  // combatSportRelevance intentionally omitted: no per-sport breakdown
  // exists anywhere in this canonical chapter — only the aggregate
  // "Combat Transfer" narrative and "Relative Transfer Score —
  // Combat-Sport Physical Transfer: Moderate to high". The superseded
  // root-level `50-exercises/25_HANG_POWER_CLEAN` document does carry a
  // per-sport "Transfer to Combat Sports" table, but it is not this
  // exercise's canonical documentation and is not used here (same
  // situation as every other superseded fiche in this file).
  // Most of this fiche's own Regression/Equivalent/Substitution Logic
  // options ("Clean Pull from Hang", "Trap-Bar Jump", "Loaded Jump
  // Squat", "Muscle Clean", "Tall-Catch Clean Drill") name no exercise
  // with its own chapter/catalog id in this repository and are therefore
  // not referenced below. The four substitutes below ARE each named
  // explicitly in this fiche's own dedicated "Substitution Logic —
  // Preferred substitutions by objective" subsection AND already have
  // their own chapter here: "Hang High Pull" ("For explosive pulling
  // power without a catch"), "Front Squat" ("For front-rack tolerance
  // development" — `50-exercises/02_FRONT_SQUAT`, not yet integrated into
  // this catalog but a confirmed, real chapter), "Broad Jump"/"Box Jump"
  // ("For unloaded explosive power").
  substitutionExerciseIds: ["hang_high_pull", "front_squat", "broad_jump", "box_jump"],
};

// -----------------------------------------------------------------------------
// Jump Shrug
// Source: 50-exercises/64_POWER/13_JUMP_SHRUG.md
// -----------------------------------------------------------------------------

/**
 * Fourth and final entry from the `64_POWER` chapter. No superseded
 * root-level fiche exists for this exercise (checked directly) — this
 * `64_POWER` chapter is the sole canonical documentation.
 *
 * Deliberately NOT copied from `HANG_HIGH_PULL` or `HANG_POWER_CLEAN`
 * despite beginning from the identical hang position — the central
 * business question here, exactly as flagged before any writing began, is
 * whether the feet genuinely leave the ground or whether "jump" merely
 * describes intent. The documentation answers this unambiguously in the
 * affirmative, and several properties diverge accordingly:
 *
 * - Movement Pattern explicitly names "Loaded Jump" and "Controlled
 *   Landing"; Biomechanical Profile: "the athlete reaches a tall position
 *   and MAY BRIEFLY LEAVE THE GROUND"; Contraction Profile: "Brief flight
 *   or unloading phase when the feet leave the ground"; Execution
 *   Standard: "allow the feet to leave the ground only if it occurs
 *   naturally" (a natural consequence of maximal extension, not a forced
 *   or exaggerated jump, but genuine ground-leaving all the same) —
 *   `jumping_allowed` IS added here, unlike `HANG_HIGH_PULL`/
 *   `HANG_POWER_CLEAN`, neither of which ever leaves the ground.
 * - "Equipment Requirements — Essential: Barbell, Weight plates, Collars,
 *   Suitable lifting surface." Unlike `HANG_HIGH_PULL`'s/
 *   `HANG_POWER_CLEAN`'s own genuine, checked absence of any surface
 *   language, this fiche explicitly names a surface requirement — and
 *   because a genuine flight/landing phase exists here (unlike its two
 *   hang-family siblings), `safe_landing_surface` is the semantically
 *   correct capability, not `floor_safe` (reinforced by "# Space
 *   Requirements — ...Stable, non-slip surface" and the doc's own
 *   Technical Failure Criteria naming "the landing is loud, unstable or
 *   uncontrolled"). `exercisePrescriptionRegistry.ts`'s own
 *   `requiredEquipmentCapabilities: ["barbell", "plates"]` does not
 *   include a landing-surface capability at all — the lesson already
 *   learned from `SPLIT_SQUAT_JUMP` (that field belongs to a different
 *   layer and is not decisive for this model's own environmental atoms)
 *   applies here too. No physical `rack` equipment is named anywhere in
 *   this chapter either, matching `HANG_HIGH_PULL`'s/`HANG_POWER_CLEAN`'s
 *   own identical equipment set (`barbell` + `plates`, `collars` omitted
 *   for lacking an `EquipmentType` value).
 * - "# Space Requirements — Moderate floor space..." — the literal word
 *   "Moderate" grounds `minimumSpace: "moderate"` directly, unlike
 *   `HANG_HIGH_PULL`'s/`HANG_POWER_CLEAN`'s own vaguer "Enough room..."
 *   phrasing (both mapped to `"limited"`).
 * - `movementPatterns` includes both `"vertical_pull"` (this fiche's own
 *   Movement Pattern section names it, unlike `HANG_POWER_CLEAN`'s) and
 *   `"jump"` (neither sibling has it) — `jump_shrug` sits biomechanically
 *   between the two: it continues the pull like `HANG_HIGH_PULL` but adds
 *   genuine flight, without the turnover/catch of `HANG_POWER_CLEAN`
 *   ("differs from the Hang High Pull because the elbows do not drive
 *   high and outside"; "differs from the Hang Power Clean because there
 *   is no turnover or receiving phase"). No ad hoc "shrug"/
 *   "triple_extension"/"bar_path" capability is introduced anywhere in
 *   this file for this or any other entry.
 * - Technical Complexity here is explicitly "Intermediate — Lower than
 *   the Hang High Pull and Hang Power Clean. Higher than a basic
 *   bodyweight jump" — mapped to the literal middle of the five-tier
 *   scale (`complexity: "moderate"`), consistent with both bracketing
 *   claims (below `HANG_HIGH_PULL`'s own "high"/4, above a basic
 *   bodyweight jump).
 */
export const JUMP_SHRUG: ExerciseDefinition = {
  id: "jump_shrug",
  name: "Jump Shrug",
  module: "power",
  primaryAdaptation: "power",
  // Secondary Classifications: "Explosive Strength" (exact label,
  // appearing three times — the same recurring pattern as every other
  // 64_POWER entry). Secondary Adaptations: "Rate of Force Development"
  // (exact match), "Trunk Stiffness" (→ trunk_strength, matching
  // HANG_HIGH_PULL's/HANG_POWER_CLEAN's own identical mapping), "Grip
  // Strength" appearing twice (Secondary Adaptations, Capability Mapping
  // Tertiary, → grip_strength, matching both siblings' identical
  // inclusion). "Whole-Body Coordination" / "Intermuscular Coordination"
  // / "Movement Coordination" (→ coordination). Capability Mapping
  // Tertiary: "Landing Control" (→ stability, matching the same "Landing
  // Control"/"Landing Mechanics" → stability treatment used throughout
  // the plyometric family for every genuinely landing-capable exercise).
  // No "Reactive" language exists anywhere in this chapter (checked
  // directly) — reactive_strength is not added. No "Deceleration" is
  // named as its own Secondary Adaptation or Capability Mapping item
  // (unlike HANG_POWER_CLEAN's own explicit "Rapid Deceleration and
  // Force Absorption"/"Deceleration and Receiving Skill") — deceleration
  // is deliberately NOT added here, a genuine divergence reflecting that
  // this fiche's own classification never elevates it to a named
  // capability the way HANG_POWER_CLEAN's does. "Posterior-Chain
  // Recruitment"/"Hip Extension Power"/"Knee Extension Power"/
  // "Lower-Body Propulsive Power"/"Vertical Force Expression"/"Athletic
  // Timing"/"Strength-Speed"/"Weightlifting Derivative"/"Pulling
  // Derivative" have no distinct counterpart beyond what is already
  // listed or are region-specific notes captured by `bodyRegionsLoaded`.
  physicalQualities: ["explosive_strength", "rate_of_force_development", "stability", "trunk_strength", "grip_strength", "coordination"],
  // "# Movement Pattern" (a flat list): "Hip Hinge" (→ hinge), "Vertical
  // Pull" (→ vertical_pull), "Loaded Jump" (→ jump) — see the block
  // comment above this export for why this three-pattern combination is
  // genuinely distinct from both HANG_HIGH_PULL's own ["hinge",
  // "vertical_pull"] and HANG_POWER_CLEAN's own ["hinge", "squat"].
  // "Explosive Triple Extension" and "Controlled Landing" have no further
  // MovementPattern counterpart beyond "jump" itself.
  movementPatterns: ["hinge", "vertical_pull", "jump"],
  // No dedicated "Force Vector" heading exists in this chapter (matching
  // every other 64_POWER entry's prose-only Biomechanical Profile
  // format), but the prose remains unambiguous: "The bar remains close to
  // the thighs and torso and travels predominantly vertically",
  // reinforced by "the bar moves significantly away from the body" as its
  // own Technical Failure Criterion.
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "barbell" },
          { kind: "equipment", equipment: "plates" },
          { kind: "environment", capability: "jumping_allowed" },
          { kind: "environment", capability: "safe_landing_surface" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "moderate" },
        ],
      },
    ],
  },
  // Skill Requirement: "Intermediate". Technical Complexity: "Intermediate
  // — Lower than the Hang High Pull and Hang Power Clean. Higher than a
  // basic bodyweight jump." Mapped to the literal middle tier — see the
  // block comment above this export.
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // Movement Context: "Bilateral" (explicit).
  unilateral: false,
  // Muscular Profile Primary Contributors (Gluteus maximus, Quadriceps,
  // Hamstrings, Gastrocnemius, Soleus, Trapezius) → hip, thigh, lower_leg,
  // shoulder. Unlike HANG_HIGH_PULL/HANG_POWER_CLEAN (where calves are
  // only Secondary Contributors), Gastrocnemius and Soleus are Primary
  // here — the genuine flight phase requires real ankle plantar-flexion
  // drive that the two non-jumping siblings never complete, so
  // `lower_leg` is added, a real divergence. Secondary contributors
  // (Spinal erectors, Deep trunk musculature, Latissimus dorsi, Forearm
  // flexors, Deltoids, Scapular stabilizers) are excluded, matching the
  // precedent used throughout this file.
  bodyRegionsLoaded: ["hip", "thigh", "lower_leg", "shoulder"],
  // "# Contraindications and Restrictions — Avoid or restrict when the
  // athlete presents:" is a single unified list here (unlike
  // HANG_HIGH_PULL's/HANG_POWER_CLEAN's own two-tier Potential
  // Contraindications / Potential Restrictions structure), quoted one
  // item per source line. "insufficient technical supervision for the
  // athlete's current skill level" is excluded — it describes a coaching/
  // supervision availability fact, not an athlete physical or medical
  // condition, and does not fit this model's athlete-state
  // contraindication concept. "uncontrolled cardiovascular or
  // neurological conditions incompatible with explosive lifting" is
  // trimmed to its specific, actionable core ("Uncontrolled
  // cardiovascular or neurological conditions"), matching the same
  // trimming already applied to HANG_HIGH_PULL's/HANG_POWER_CLEAN's own
  // "medical restriction" clauses. The separate closing sentence "Use
  // caution when cumulative lower-body plyometric volume is already
  // high" is excluded as a relative-tier caution note, and "Medical
  // restrictions override performance objectives" is excluded as
  // non-actionable here, handled generically elsewhere.
  contraindications: [
    { description: "Acute lower-back pain.", prohibitedPatterns: ["hinge", "vertical_pull", "jump"], absolute: true },
    { description: "Acute hip, knee or ankle injury.", prohibitedPatterns: ["hinge", "vertical_pull", "jump"], absolute: true },
    { description: "Inability to land safely.", prohibitedPatterns: ["hinge", "vertical_pull", "jump"], absolute: true },
    { description: "Poor balance under loaded jumping conditions.", prohibitedPatterns: ["hinge", "vertical_pull", "jump"], absolute: true },
    {
      description: "Unresolved Achilles tendon or patellar tendon irritation aggravated by jumping.",
      prohibitedPatterns: ["hinge", "vertical_pull", "jump"],
      absolute: true,
    },
    {
      description: "Inability to maintain a neutral and braced trunk during the hang.",
      prohibitedPatterns: ["hinge", "vertical_pull", "jump"],
      absolute: true,
    },
    {
      description: "Severe grip limitation that compromises bar control.",
      prohibitedPatterns: ["hinge", "vertical_pull", "jump"],
      absolute: true,
    },
    {
      description: "Uncontrolled cardiovascular or neurological conditions.",
      prohibitedPatterns: ["hinge", "vertical_pull", "jump"],
      absolute: true,
    },
  ],
  fatigueProfile: {
    // "# Physiological Cost" is the cleaner, more granular numeric
    // source (same choice made throughout this file). Unlike
    // HANG_HIGH_PULL/HANG_POWER_CLEAN, this fiche's own "# Fatigue
    // Profile" has no dedicated "Technical Fatigue Sensitivity" field at
    // all — `technical` is sourced instead from "# Technical Complexity
    // — Intermediate" (already mapped to `complexity: "moderate"`
    // above), the same fallback BOX_JUMP used for its own missing
    // dedicated field. `types` excludes "technical" for the same reason
    // BOX_JUMP's own types list excludes it despite carrying a computed
    // value — this is a fallback-sourced rating, not a fiche-emphasized
    // fatigue category. `types` includes "impact": Technical Failure
    // Criteria name "the landing is loud, unstable or uncontrolled" and
    // "the bar strikes the thighs aggressively", and Safety Profile names
    // "Bar collision with the thighs or body". `types` includes
    // "systemic": "Systemic Fatigue: Moderate" is a plain, unqualified
    // rating, the same phrase and reasoning HANG_HIGH_PULL's/
    // HANG_POWER_CLEAN's own fiches used.
    types: ["neural", "muscular", "connective_tissue", "impact", "systemic"],
    neural: 4, // "Neurological Cost: Moderate to high"
    muscular: 2, // "Muscular Cost: Low to moderate"
    metabolic: 2, // "Metabolic Cost: Low" — plain "Low", same mapping used for BROAD_JUMP's/KNEE_JUMP's/PUSH_PRESS's own plain "Low" ratings
    connectiveTissue: 3, // "Connective-Tissue Cost: Moderate depending on load, landing quality and total jump volume"
    technical: 3, // "Technical Complexity: Intermediate" — see comment above
  },
  // Same reasoning as every other entry: a real "# Evidence
  // Classification" section exists ("Evidence Level: Moderate"), but
  // there is still no documented crosswalk between this narrative rating
  // and the engine's level_1/level_2/level_3 taxonomy. Left "unknown".
  evidenceLevel: "unknown",
  // combatSportRelevance intentionally omitted: no per-sport breakdown
  // exists anywhere in this chapter — only the aggregate "Combat
  // Transfer" narrative and "Relative Transfer Score — Combat-Specific
  // Transfer: Moderate and indirect". Same omission already used for
  // every other entry in this file.
  // Most of this fiche's own Regression/Equivalent/Substitution Logic
  // options ("Trap-Bar Jump", "Dumbbell Jump Shrug", "Kettlebell Jump
  // Shrug", "clean pull or mid-thigh pull") name no exercise with its own
  // chapter/catalog id in this repository and are therefore not
  // referenced below. The three substitutes below ARE each named
  // explicitly in this fiche's own dedicated "Substitution Logic"/
  // "Regression Options" subsections AND already have their own chapter
  // here: "Hang High Pull" ("a more complete vertical pulling action is
  // desired"), "Hang Power Clean" ("force reception is part of the
  // objective"), "Countermovement Jump" (named explicitly in Regression
  // Options, matching this fiche's own "Substitute it with an unloaded
  // jump when external loading is contraindicated" logic).
  substitutionExerciseIds: ["hang_high_pull", "hang_power_clean", "countermovement_jump"],
};

// -----------------------------------------------------------------------------
// Catalog
// -----------------------------------------------------------------------------

export const EXERCISE_KNOWLEDGE_BASE: readonly ExerciseDefinition[] = [
  MED_BALL_CHEST_PASS,
  MED_BALL_SLAM,
  MED_BALL_OVERHEAD_THROW,
  MED_BALL_ROTATIONAL_THROW,
  MED_BALL_SCOOP_TOSS,
  MED_BALL_SHOT_PUT_THROW,
  MED_BALL_REVERSE_THROW,
  BOX_JUMP,
  DEPTH_JUMP,
  COUNTERMOVEMENT_JUMP,
  BROAD_JUMP,
  KNEE_JUMP,
  LATERAL_BOUND,
  SINGLE_LEG_HOP,
  SPLIT_SQUAT_JUMP,
  PUSH_PRESS,
  HANG_HIGH_PULL,
  HANG_POWER_CLEAN,
  JUMP_SHRUG,
];
