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
];
