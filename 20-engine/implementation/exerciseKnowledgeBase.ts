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
];
