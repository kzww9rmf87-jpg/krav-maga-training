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
// Towel Pull-Up
// Source: 50-exercises/65_GRIP/10_TOWEL_PULL_UP.md
// -----------------------------------------------------------------------------

/**
 * First entry from the `65_GRIP` chapter, migrated as a single coherent
 * batch alongside `PLATE_PINCH`/`PINCH_CARRY`/`ROPE_CLIMB`/`ROPE_PULL`.
 * This chapter's fiches use a different structural format from every
 * prior chapter ("Exercise Identity" — Name/Category/Primary Pattern/
 * Secondary Pattern/Equipment/Complexity/Unilateral or Bilateral/Closed
 * or Open Chain — rather than a "Movement Pattern"/"Movement Context"
 * pair), but the same sourcing discipline applies throughout.
 * `exercisePrescriptionRegistry.ts` has no entry for this exercise at all
 * (confirmed by direct search) — a known limitation, documented here
 * without modifying that registry.
 *
 * Central business question for this entry, as flagged before writing
 * began: distinguishing the `towel` (a real, separate physical implement)
 * from the suspension point. "Equipment: Pull-Up Bar, Towel" (Exercise
 * Identity) names BOTH explicitly and together — "A towel is draped
 * securely over a stable pull-up bar" (Movement Description). This is a
 * specific, named `pull_up_bar`, not the more generic `rigid_anchor_support`
 * (created for `Dragon Flag`'s own "Secure overhead or behind-head hand
 * anchor" — a materially different, non-bar-specific anchor concept) —
 * using the generic anchor type here would blur a distinction the
 * documentation itself makes precisely. `requirements` therefore requires
 * BOTH `pull_up_bar` AND `towel` together, matching `EquipmentType`'s own
 * existing values for each — no ad hoc "suspension" capability is
 * introduced.
 *
 * No explicit surface-safety language exists anywhere in this fiche
 * (checked directly) — this is a hanging exercise with no floor contact
 * during the pull, so `floor_safe`/`safe_landing_surface` are not added.
 * "Safety Rules — Keep the landing area clear" grounds a minimal
 * `sufficient_space` atom instead (a fall/drop clearance concern, not a
 * surface-quality one): `minimumSpace: "very_limited"`, reflecting a
 * single stationary hanging station, not an extended footprint.
 *
 * Unlike every `64_POWER` entry, this chapter's fiches carry a genuine
 * "# Sport-Specific Relevance" section with real per-sport ratings
 * (Brazilian Jiu-Jitsu, Judo, Wrestling, MMA, Krav Maga, "Boxing and
 * Kickboxing" combined) — `combatSportRelevance` is therefore populated
 * here, unlike every jump/power entry so far. Savate/Sambo/Muay Thai are
 * never mentioned in this chapter (unlike some superseded plyometric
 * fiches) — `muay_thai` has no rating anywhere in this chapter and is
 * genuinely omitted, not silently invented as a middling guess. "Boxing
 * and Kickboxing" is rated as a single combined line throughout this
 * chapter — the same rating is applied to both `boxing` and `kickboxing`,
 * faithfully reflecting the source's own combined framing rather than
 * inventing two independent numbers.
 */
export const TOWEL_PULL_UP: ExerciseDefinition = {
  id: "towel_pull_up",
  name: "Towel Pull-Up",
  // No AdaptationDomain value exists for "grip" specifically — `module`
  // already captures this precisely via the real `"grip"` CapabilityModule
  // (confirmed in `exercisePrescriptionRegistry.ts`'s own `pinchCarryEntry`
  // — `moduleId: "grip"`, the only entry in this chapter with an existing
  // registry entry). `primaryAdaptation: "maximum_strength"` is used as
  // the closest AdaptationDomain match: every fiche in this chapter is
  // ATP-PC/low-metabolic and strength- or tendon-capacity-framed (never
  // "Power" the way every 64_POWER entry's own Primary Adaptation was),
  // and AdaptationDomain has no finer-grained "grip"/"local muscular
  // endurance" value to reach for instead.
  module: "grip",
  primaryAdaptation: "maximum_strength",
  // Secondary Classifications: "Relative Strength" (exact match) +
  // Secondary Adaptations: "Relative Upper-Body Strength" (→
  // relative_strength — the first entry in this catalog to earn this
  // quality). "Support Grip"/"Open-Hand Grip"/"Grip Endurance" all fall
  // under the single grip_strength umbrella (no separate "support_grip"/
  // "open_hand_grip" PhysicalQuality exists). Secondary Adaptations:
  // "Shoulder Stability" (→ stability). No "Coordination" language exists
  // anywhere in this fiche (checked directly) — unlike ROPE_CLIMB's own
  // explicit "Whole-Body Coordination"/"Climbing Coordination" — so
  // coordination is deliberately NOT added, a genuine divergence between
  // these two related pulling exercises. No "Trunk Stiffness"/"Trunk
  // Stability" Secondary Classification/Adaptation exists either (only
  // "Trunk" Joint Actions prose — "anti-extension, anti-swing
  // stabilization" — which this file does not use as a physicalQualities
  // source, matching the precedent throughout) — trunk_strength is not
  // added.
  physicalQualities: ["grip_strength", "relative_strength", "stability"],
  // Exercise Identity: "Primary Pattern: Vertical Pull. Secondary
  // Pattern: Isometric Grip." → vertical_pull, isometric.
  movementPatterns: ["vertical_pull", "isometric"],
  // No dedicated "Force Vector" heading exists in this chapter's format,
  // but the movement is unambiguous: the athlete "pulls the body upward".
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "pull_up_bar" },
          { kind: "equipment", equipment: "towel" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "very_limited" },
        ],
      },
    ],
  },
  // Exercise Identity: "Complexity: Moderate", corroborated by "#
  // Technical Complexity — Moderate. The pulling pattern is familiar to
  // athletes who can already perform pull-ups. However, the towel
  // introduces... greater grip instability...".
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // Exercise Identity: "Unilateral or Bilateral: Bilateral" (explicit,
  // unambiguous — unlike PLATE_PINCH's/PINCH_CARRY's own "Unilateral or
  // Bilateral: Unilateral or Bilateral" framing).
  unilateral: false,
  // Primary Muscles: Latissimus Dorsi, Biceps Brachii, Brachialis,
  // Brachioradialis, Finger Flexors, Forearm Flexors. No "back"/"lats"
  // BodyRegion exists — Latissimus Dorsi is mapped to `shoulder`, the
  // same region used throughout this file for pulling-derived
  // shoulder-girdle contribution (matching HANG_HIGH_PULL's own
  // Trapezius → shoulder treatment). Biceps Brachii/Brachialis/
  // Brachioradialis → upper_arm (elbow flexors). Finger Flexors/Forearm
  // Flexors → forearm and hand — the first entries in this catalog to use
  // these two regions, reflecting the genuinely different (grip-first)
  // demand of this chapter versus every prior lower-body-dominant entry.
  // Secondary Muscles (Lower/Middle Trapezius, Rhomboids, Rear Deltoids,
  // Rotator Cuff, Abdominal Wall, Obliques, Spinal Stabilizers) are
  // excluded, matching the precedent used throughout this file.
  bodyRegionsLoaded: ["shoulder", "upper_arm", "forearm", "hand"],
  // "# Absolute Contraindications", quoted one item per source line.
  // "an unstable pull-up station" is excluded — an equipment/setup
  // concern, not an athlete-state condition, matching the precedent of
  // excluding equipment-instability items throughout this file. The
  // separate "# Relative Contraindications" section is excluded entirely,
  // matching the same absolute-tier-only discipline used throughout this
  // file.
  contraindications: [
    { description: "Acute hand or finger injury.", prohibitedPatterns: ["vertical_pull", "isometric"], absolute: true },
    { description: "Acute wrist injury.", prohibitedPatterns: ["vertical_pull", "isometric"], absolute: true },
    { description: "Acute elbow injury.", prohibitedPatterns: ["vertical_pull", "isometric"], absolute: true },
    { description: "Acute shoulder injury.", prohibitedPatterns: ["vertical_pull", "isometric"], absolute: true },
    { description: "Neurological symptoms in the upper limb.", prohibitedPatterns: ["vertical_pull", "isometric"], absolute: true },
    { description: "Inability to grip the towel securely.", prohibitedPatterns: ["vertical_pull", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // This chapter's own "# Fatigue Profile" format uses four dimensions
    // (Systemic / Local / Neurological / Connective-Tissue) and never
    // rates metabolic fatigue or names an energy system at all (unlike
    // the 64_POWER chapter's own explicit "Primary Energy System: ATP-PC
    // system" framing) — `metabolic` is set to the lowest tier (1)
    // uniformly across this entire chapter as the most conservative,
    // minimal-assumption default, given every exercise here is a brief,
    // local, non-conditioning effort by its fundamental nature, not a
    // fabricated distinct fact per exercise. `technical` has no dedicated
    // field either; sourced from this fiche's own "Complexity: Moderate"
    // (minimumTechnicalLevel 3), the same BOX_JUMP-style fallback used
    // throughout this file, and — matching BOX_JUMP's own precedent — is
    // NOT tagged in `types` for being fallback-sourced rather than
    // fiche-emphasized.
    types: ["neural", "muscular", "connective_tissue", "systemic"],
    neural: 3, // "Neurological Fatigue: Moderate"
    muscular: 4, // "Local Fatigue: High"
    metabolic: 1, // see comment above
    connectiveTissue: 4, // "Connective-Tissue Stress: Moderate to High"
    technical: 3, // fallback from "Complexity: Moderate" — see comment above
  },
  // This chapter's fiches carry no "Evidence Classification"/"Scientific
  // Evidence" section at all (checked directly — unlike every prior
  // chapter, which at minimum had a narrative evidence discussion). Left
  // "unknown", an even more direct application of this file's established
  // discipline than usual.
  evidenceLevel: "unknown",
  // "# Sport-Specific Relevance" — Brazilian Jiu-Jitsu: High (5); Judo:
  // High (5); Wrestling: Moderate (3); MMA: Moderate (3); Krav Maga:
  // Moderate (3); Boxing and Kickboxing: Low to Moderate (2, applied to
  // both). Muay Thai is never mentioned in this chapter and is genuinely
  // omitted, not invented.
  combatSportRelevance: {
    brazilian_jiu_jitsu: 5,
    judo: 5,
    wrestling: 3,
    mma: 3,
    krav_maga: 3,
    boxing: 2,
    kickboxing: 2,
  },
  // "# Substitution Logic" names "Conventional Pull-Up", "Towel Hang",
  // "Lat Pulldown With Towel", "Farmer Carry" and "Plate Pinch". "Towel
  // Hang" and "Lat Pulldown With Towel" name no exercise with its own
  // chapter/catalog id in this repository. "Conventional Pull-Up" →
  // `pull_up` (`50-exercises/10_PULL_UP`, a confirmed real chapter, not
  // yet integrated into this catalog — same "doc-backed but not yet
  // catalogued" precedent BOX_JUMP already established for
  // `countermovement_jump`/`knee_jump`/`single_leg_hop`). "Farmer Carry"
  // → `farmer_carry` (`50-exercises/66_CARRIES/10_FARMER_CARRY.md`,
  // confirmed real chapter, not yet integrated). "Plate Pinch" →
  // `plate_pinch`, integrated in this same batch below.
  substitutionExerciseIds: ["pull_up", "plate_pinch", "farmer_carry"],
};

// -----------------------------------------------------------------------------
// Plate Pinch
// Source: 50-exercises/65_GRIP/11_PLATE_PINCH.md
// -----------------------------------------------------------------------------

/**
 * Second entry from the `65_GRIP` chapter. No prescription-registry entry
 * exists for this exercise (confirmed by direct search).
 *
 * Central business question: whether the canonical equipment should be
 * the plain, existing `plates` `EquipmentType` or the equivalence-group
 * `pinch_grip_implement` value. "Equipment: Weight Plates" (Exercise
 * Identity) — this fiche names ONLY weight plates, with no "or Pinch
 * Blocks" alternative anywhere (unlike `PINCH_CARRY`'s own explicit
 * "Weight Plates or Pinch Blocks"). `pinch_grip_implement` exists
 * specifically as an equivalence-group id for that documented "either
 * implement" ambiguity (see `equipmentCapabilities.ts`'s own comment,
 * literally naming "Pinch Carry" as its origin) — using it here, where no
 * such ambiguity is documented, would silently broaden this exercise's
 * real equipment requirement beyond what this fiche actually says. The
 * plain `plates` type is therefore used, deliberately distinct from
 * `PINCH_CARRY`'s own `pinch_grip_implement` — the two exercises earn
 * genuinely different equipment atoms from genuinely different source
 * text, not a copy-paste of one onto the other.
 *
 * "Primary Pattern: Isometric Grip. Secondary Pattern: Loaded Hold" — a
 * static hold, not a carry (the walking "# Walking Variation" section is
 * a documented progression, not this fiche's own base/default form,
 * matching the "Closed or Open Chain: Open Chain" / "Movement
 * Description" framing of a stationary hold "at the side of the body or
 * in front of the athlete"). `forceVectors` uses `"not_applicable"` — the
 * dedicated enum value for exactly this situation, a pure isometric
 * resistance to gravity with no directional force PRODUCTION the way
 * every prior entry's own genuine movement has — rather than forcing an
 * inaccurate "downward" label onto a static hold.
 */
export const PLATE_PINCH: ExerciseDefinition = {
  id: "plate_pinch",
  name: "Plate Pinch",
  module: "grip",
  primaryAdaptation: "maximum_strength",
  // Secondary Adaptations: "Wrist Stability" (also a Secondary
  // Classification, doubly confirmed → stability). Secondary
  // Classifications: "Tendon Capacity"; Secondary Adaptations: "Tendon
  // Robustness" (→ tissue_capacity, exact match — the first entry in this
  // catalog to earn this quality). "Thumb Strength"/"Finger Strength"/
  // "Grip Endurance"/"Hand Strength" all fall under the single
  // grip_strength umbrella. "Isometric Strength" (Secondary
  // Classification) has no distinct PhysicalQuality counterpart beyond
  // grip_strength itself, already listed, and is not force-fitted into a
  // new value — it describes the CONTRACTION TYPE, already represented by
  // `movementPatterns: ["isometric"]` below, not a separate quality.
  physicalQualities: ["grip_strength", "stability", "tissue_capacity"],
  // Exercise Identity: "Primary Pattern: Isometric Grip. Secondary
  // Pattern: Loaded Hold." → isometric. "Loaded Hold" has no distinct
  // MovementPattern counterpart beyond isometric itself.
  movementPatterns: ["isometric"],
  // See the block comment above this export for why "not_applicable" is
  // used here rather than a directional value.
  forceVectors: ["not_applicable"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "plates" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "very_limited" },
        ],
      },
    ],
  },
  // Exercise Identity: "Complexity: Low", corroborated by "# Technical
  // Complexity — Low. The movement is simple and easy to teach."
  minimumTechnicalLevel: 1,
  complexity: "low",
  // Exercise Identity: "Unilateral or Bilateral: Unilateral or Bilateral"
  // — this fiche documents both as equally legitimate, dedicated
  // sections ("# Unilateral Variation" / "# Bilateral Variation"), with
  // Bilateral framed as offering "efficient bilateral training... easier
  // integration into general strength sessions" — the more standard
  // default. `unilateral: false` is used, matching
  // exercisePrescriptionRegistry.ts's own independent `laterality:
  // "bilateral"` resolution for the identically-phrased `PINCH_CARRY`
  // sibling (this exact fiche has no registry entry of its own, but the
  // sibling's confirmed resolution is the strongest available precedent
  // for the same ambiguous phrasing).
  unilateral: false,
  // Primary Muscles: Thumb Adductors, Thenar Musculature, Finger Flexors,
  // Finger Adductors, Forearm Flexors → hand (thumb/finger/thenar
  // musculature) and forearm. Unlike TOWEL_PULL_UP/ROPE_CLIMB/ROPE_PULL,
  // no shoulder or upper_arm region is added — Deltoids/Rotator Cuff are
  // only Secondary Muscles here, never Primary, a genuine divergence
  // reflecting the absence of any pulling motion in this exercise.
  bodyRegionsLoaded: ["hand", "forearm"],
  // "# Absolute Contraindications", quoted one item per source line.
  // "unsafe plate geometry" is excluded — an equipment/setup concern, not
  // an athlete-state condition. The separate "# Relative
  // Contraindications" section is excluded entirely.
  contraindications: [
    { description: "Acute thumb injury.", prohibitedPatterns: ["isometric"], absolute: true },
    { description: "Acute finger injury.", prohibitedPatterns: ["isometric"], absolute: true },
    { description: "Acute wrist injury.", prohibitedPatterns: ["isometric"], absolute: true },
    { description: "Neurological loss of hand control.", prohibitedPatterns: ["isometric"], absolute: true },
    { description: "Inability to pinch securely.", prohibitedPatterns: ["isometric"], absolute: true },
  ],
  fatigueProfile: {
    // Same chapter-wide `metabolic`/`technical` sourcing approach as
    // TOWEL_PULL_UP (see its own fatigueProfile comment for the full
    // reasoning). `types` excludes "systemic": "Systemic Fatigue: Low" is
    // an explicit LOW rating (matching the same "explicit low → exclude"
    // treatment used for KNEE_JUMP's/LATERAL_BOUND's own explicit low
    // systemic ratings).
    types: ["neural", "muscular", "connective_tissue"],
    neural: 2, // "Neurological Fatigue: Low to Moderate"
    muscular: 4, // "Local Fatigue: High"
    metabolic: 1, // see TOWEL_PULL_UP's own fatigueProfile comment
    connectiveTissue: 3, // "Connective-Tissue Stress: Moderate"
    technical: 1, // fallback from "Complexity: Low" (minimumTechnicalLevel 1)
  },
  // Same reasoning as TOWEL_PULL_UP: no "Evidence Classification"/
  // "Scientific Evidence" section exists anywhere in this chapter. Left
  // "unknown".
  evidenceLevel: "unknown",
  // "# Sport-Specific Relevance" — Brazilian Jiu-Jitsu: Moderate to High
  // (4); Judo: High (5); Wrestling: Moderate (3); MMA: Moderate (3); Krav
  // Maga: Moderate (3); Boxing and Kickboxing: Low to Moderate (2, both).
  combatSportRelevance: {
    brazilian_jiu_jitsu: 4,
    judo: 5,
    wrestling: 3,
    mma: 3,
    krav_maga: 3,
    boxing: 2,
    kickboxing: 2,
  },
  // "# Substitution Logic" names "Towel Hang", "Farmer Carry", "Pinch
  // Block Hold", "Gripper Work" and "Finger Extension Work". Only "Farmer
  // Carry" has a confirmed real chapter in this repository
  // (`50-exercises/66_CARRIES/10_FARMER_CARRY.md`, not yet integrated) —
  // the rest name no exercise with its own chapter/catalog id.
  substitutionExerciseIds: ["farmer_carry"],
};

// -----------------------------------------------------------------------------
// Pinch Carry
// Source: 50-exercises/65_GRIP/12_PINCH_CARRY.md
// -----------------------------------------------------------------------------

/**
 * Third entry from the `65_GRIP` chapter, and the only one of the five
 * with an existing `exercisePrescriptionRegistry.ts` entry
 * (`pinchCarryEntry`), used here to corroborate — not substitute for —
 * an independent reading of the canonical documentation.
 *
 * "Equipment: Weight Plates or Pinch Blocks" — a genuine documented
 * equipment alternative, unlike `PLATE_PINCH`'s own single-implement
 * "Weight Plates" (see that export's own block comment for the full
 * reasoning). `pinch_grip_implement` — the equivalence-group
 * `EquipmentType` created specifically for this "Weight Plates or Pinch
 * Blocks" pairing — is used here, matching
 * `exercisePrescriptionRegistry.ts`'s own independent
 * `requiredEquipmentCapabilities: ["pinch_grip_implement"]` for this
 * exact exercise exactly.
 *
 * "Prescription Variables — Distance: 10 to 20 metres for strength
 * emphasis, 20 to 40 metres for strength endurance" — a genuine,
 * quantified extended-distance requirement, substantially larger than any
 * prior entry's own space grounding in this catalog, hence
 * `minimumSpace: "large"` (the first use of this tier in the whole
 * catalog). No explicit surface-safety language exists anywhere in this
 * fiche (checked directly) — `floor_safe`/`safe_landing_surface` are not
 * added; "Keep the walking area clear" is a space/obstacle concern,
 * already captured by `sufficient_space`, not a surface-quality one.
 */
export const PINCH_CARRY: ExerciseDefinition = {
  id: "pinch_carry",
  name: "Pinch Carry",
  module: "grip",
  primaryAdaptation: "maximum_strength",
  // Secondary Classifications: "Trunk Stability" (exact match, unlike
  // PLATE_PINCH — a genuine divergence reflecting the added postural
  // demand of walking under load); Secondary Adaptations: "Anti-Lateral-
  // Flexion Strength" (→ trunk_strength). "Wrist Stability"/"Shoulder
  // Stability" (both sections → stability). "Pinch-Grip Strength"/
  // "Thumb Opposition Strength"/"Finger Adduction Strength"/"Grip
  // Endurance" fall under the single grip_strength umbrella. "Postural
  // Control" (Secondary Adaptations) is read as reinforcing stability
  // (already listed), not a separate balance quality — this fiche never
  // names "Dynamic Balance" the explicit, distinct way LATERAL_BOUND's
  // own fiche did.
  physicalQualities: ["grip_strength", "stability", "trunk_strength"],
  // Exercise Identity: "Primary Pattern: Loaded Carry. Secondary Pattern:
  // Isometric Grip." → carry, isometric — note the pattern order is
  // reversed relative to PLATE_PINCH's own "Isometric Grip" (primary)/
  // "Loaded Hold" (secondary), reflecting that locomotion, not the grip
  // itself, is this fiche's own defining pattern.
  movementPatterns: ["carry", "isometric"],
  // No dedicated "Force Vector" heading exists in this chapter's format.
  // "Loaded Carry" being the Primary Pattern (not "Isometric Grip", which
  // PLATE_PINCH's own doc leads with instead), the locomotor component is
  // the defining direction: the athlete "walks for the prescribed
  // distance or duration".
  forceVectors: ["horizontal"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "pinch_grip_implement" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "large" },
        ],
      },
    ],
  },
  // Exercise Identity: "Complexity: Low to Moderate", corroborated by "#
  // Technical Complexity — Low to Moderate. The grip task is simple, but
  // locomotion increases technical demand." Rounded up to `complexity:
  // "moderate"` while `minimumTechnicalLevel` is kept at 2 (not 3) to
  // preserve the "Low to Moderate" nuance — the same resolution
  // MED_BALL_OVERHEAD_THROW's own identical "Low to Moderate" complexity
  // phrase already established in this file.
  minimumTechnicalLevel: 2,
  complexity: "moderate",
  // Exercise Identity: "Unilateral or Bilateral: Unilateral or
  // Bilateral" — matches exercisePrescriptionRegistry.ts's own
  // independent `laterality: "bilateral"` for this exact exercise.
  unilateral: false,
  // Primary Muscles: Thumb Adductors, Thenar Musculature, Finger Flexors,
  // Finger Adductors, Forearm Flexors — identical to PLATE_PINCH's own
  // Primary Muscles list. Despite the added locomotion, no lower-body
  // muscle (e.g. Gluteus Medius, listed only as a Secondary Contributor
  // for gait stabilization) is ever promoted to Primary status in this
  // fiche's own Muscular Profile — the grip remains the dominant loaded
  // region, matching PLATE_PINCH's own region set exactly, a genuine
  // convergence rather than a copy.
  bodyRegionsLoaded: ["hand", "forearm"],
  // "# Absolute Contraindications", quoted one item per source line.
  // "an unstable implement setup" is excluded — an equipment/setup
  // concern, not an athlete-state condition.
  contraindications: [
    { description: "Acute thumb injury.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Acute finger injury.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Acute wrist injury.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Neurological loss of grip control.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Inability to walk safely under load.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // Same chapter-wide `metabolic`/`technical` sourcing approach as
    // TOWEL_PULL_UP. `types` excludes "systemic": "Systemic Fatigue: Low
    // to Moderate" straddles the established inclusion/exclusion
    // precedent (a plain "Moderate" → include; an explicit "Low" →
    // exclude) — treated cautiously as leaning toward exclusion here,
    // consistent with not overclaiming a systemic-fatigue category the
    // fiche itself hedges on.
    types: ["neural", "muscular", "connective_tissue"],
    neural: 2, // "Neurological Fatigue: Low to Moderate"
    muscular: 4, // "Local Fatigue: High"
    metabolic: 1, // see TOWEL_PULL_UP's own fatigueProfile comment
    connectiveTissue: 3, // "Connective-Tissue Stress: Moderate"
    technical: 2, // fallback from "Complexity: Low to Moderate" (minimumTechnicalLevel 2)
  },
  evidenceLevel: "unknown",
  // "# Sport-Specific Relevance" — Brazilian Jiu-Jitsu: High (5); Judo:
  // High (5); Wrestling: Moderate (3); MMA: Moderate (3); Krav Maga:
  // Moderate (3); Boxing and Kickboxing: Low to Moderate (2, both).
  combatSportRelevance: {
    brazilian_jiu_jitsu: 5,
    judo: 5,
    wrestling: 3,
    mma: 3,
    krav_maga: 3,
    boxing: 2,
    kickboxing: 2,
  },
  // "# Substitution Logic" names "Static Plate Pinch", "Farmer Carry",
  // "Suitcase Carry", "Pinch Block Hold" and "Towel Carry or Towel Hang".
  // "Static Plate Pinch" → `plate_pinch`, integrated in this same batch.
  // "Farmer Carry" → `farmer_carry` (confirmed real chapter, not yet
  // integrated). "Suitcase Carry" → `suitcase_carry`
  // (`50-exercises/62_CORE/17_SUITCASE_CARRY.md`, confirmed real chapter,
  // not yet integrated). "Pinch Block Hold"/"Towel Carry"/"Towel Hang"
  // name no exercise with its own chapter/catalog id.
  substitutionExerciseIds: ["plate_pinch", "farmer_carry", "suitcase_carry"],
};

// -----------------------------------------------------------------------------
// Rope Climb
// Source: 50-exercises/65_GRIP/13_ROPE_CLIMB.md
// -----------------------------------------------------------------------------

/**
 * Fourth entry from the `65_GRIP` chapter. No prescription-registry entry
 * exists for this exercise (confirmed by direct search).
 *
 * "Equipment: Climbing Rope" — `rope` is a real, existing `EquipmentType`
 * value, used directly; no separate `rigid_anchor_support` atom is added
 * on top of it. The fiche's own repeated "securely anchored rope"/
 * "professionally anchored rope" language describes a SAFETY PROPERTY of
 * the rope setup itself, not a second, distinct physical implement the
 * athlete interacts with independently — requiring both would
 * artificially double-gate what is, physically, a single installed piece
 * of climbing equipment.
 *
 * KNOWN MODEL LIMITATION, flagged explicitly rather than silently
 * approximated: "# Prescription Variables — Height: ... 2 to 4 metres,
 * full-rope climbs..." documents a genuine VERTICAL clearance requirement
 * distinct in kind from every prior entry's own horizontal/overhead
 * space grounding. The Exercise Requirements Model's `sufficient_space`
 * atom is a single one-dimensional scale (`AvailableSpaceLevel`) with no
 * way to distinguish "N metres of vertical ceiling clearance" from "N
 * metres of horizontal floor space" — both collapse into the same
 * generic tier. This is a real representational gap, not a cosmetic one.
 * It does not block this exercise's integration, though: `sufficient_space`
 * can still honestly represent "a large amount of clearance is required"
 * even without geometric precision on which dimension, the same way
 * `PUSH_PRESS`'s own overhead-press clearance was already represented
 * through the identical generic mechanism. `minimumSpace: "large"` is
 * used to reflect the genuinely greater clearance need documented here
 * (multi-metre height plus "adequate clearance around the climbing
 * area" plus a landing/fall-safety margin) — but any future modeling
 * work that adds a distinct vertical-clearance capability should revisit
 * this entry specifically.
 *
 * Confirmed while investigating this gap: `TrainingEnvironment` does
 * carry a `ceilingHeightMeters?: number` field, but it is read only by
 * `validation.ts`'s own input-bounds check (0–20 range) — it is never
 * referenced by `EnvironmentCapability`, `ExerciseRequirementAtom`, or
 * anywhere in `exerciseRequirements.ts`'s eligibility evaluation. No
 * exercise can require a minimum ceiling height today regardless of this
 * field's presence on the environment object; the gap is real, not an
 * oversight in this file alone.
 *
 * "Starting Position — ...a safe landing surface..." and "Safety Rules —
 * Use appropriate floor protection" ground a genuine `safe_landing_surface`
 * requirement — the descent/fall risk from height makes this
 * semantically the correct capability (not `floor_safe`), the same
 * distinction already applied throughout the plyometric family for
 * genuinely landing-capable exercises.
 */
export const ROPE_CLIMB: ExerciseDefinition = {
  id: "rope_climb",
  name: "Rope Climb",
  module: "grip",
  primaryAdaptation: "maximum_strength",
  // Secondary Classifications: "Relative Strength" (exact, matching
  // TOWEL_PULL_UP's own identical grounding); Secondary Adaptations:
  // "Relative Upper-Body Strength" (→ relative_strength). Secondary
  // Classifications: "Whole-Body Coordination"; Secondary Adaptations:
  // "Climbing Coordination" (→ coordination — a genuine divergence from
  // TOWEL_PULL_UP, which names no coordination language at all, reflecting
  // the added hand-transition/foot-lock coordination demand of climbing).
  // Secondary Adaptations: "Shoulder Stability", "Trunk Stability" (→
  // stability, trunk_strength — the Purpose section's own "trunk
  // stiffness" phrase corroborates the latter). "Open-Hand Grip"/"Support
  // Grip"/"Grip Endurance" fall under the single grip_strength umbrella.
  physicalQualities: ["grip_strength", "relative_strength", "coordination", "stability", "trunk_strength"],
  // Exercise Identity: "Primary Pattern: Vertical Pull. Secondary
  // Pattern: Isometric Grip and Locomotion." → vertical_pull, isometric,
  // locomotion (all three named explicitly).
  movementPatterns: ["vertical_pull", "isometric", "locomotion"],
  // No dedicated "Force Vector" heading exists in this chapter's format,
  // but the movement is unambiguous: the athlete "ascends", pulling the
  // body upward against gravity toward "the prescribed height".
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "rope" },
          { kind: "environment", capability: "safe_landing_surface" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "large" },
        ],
      },
    ],
  },
  // Exercise Identity: "Complexity: High", corroborated by "# Technical
  // Complexity — High. ... The technical requirement is substantially
  // higher than a static hang or towel pull-up."
  minimumTechnicalLevel: 4,
  complexity: "high",
  // Exercise Identity: "Unilateral or Bilateral: Alternating Bilateral"
  // — both hands ultimately perform equal work over a full climb
  // (alternating grip-and-pull sequencing), with no "per side"
  // prescription unit the way a true unilateral exercise would have —
  // the same resolution SPLIT_SQUAT_JUMP's own "Alternating Unilateral"
  // phrase already established in this file, applied here to its
  // "Alternating Bilateral" mirror image: `unilateral: false`.
  unilateral: false,
  // Primary Muscles: Latissimus Dorsi, Biceps Brachii, Brachialis,
  // Brachioradialis, Finger Flexors, Forearm Flexors — identical to
  // TOWEL_PULL_UP's own Primary Muscles list, a genuine convergence (both
  // are grip-integrated vertical-pulling exercises) rather than a copy.
  bodyRegionsLoaded: ["shoulder", "upper_arm", "forearm", "hand"],
  // "# Absolute Contraindications", quoted one item per source line.
  // "unstable rope anchoring" and "an unsafe climbing environment" are
  // excluded — equipment/environment concerns already covered by
  // `requirements`, not athlete-state contraindications.
  contraindications: [
    { description: "Acute hand injury.", prohibitedPatterns: ["vertical_pull", "isometric", "locomotion"], absolute: true },
    { description: "Acute wrist injury.", prohibitedPatterns: ["vertical_pull", "isometric", "locomotion"], absolute: true },
    { description: "Acute elbow injury.", prohibitedPatterns: ["vertical_pull", "isometric", "locomotion"], absolute: true },
    { description: "Acute shoulder injury.", prohibitedPatterns: ["vertical_pull", "isometric", "locomotion"], absolute: true },
    {
      description: "Neurological symptoms in the upper limb.",
      prohibitedPatterns: ["vertical_pull", "isometric", "locomotion"],
      absolute: true,
    },
    {
      description: "Inability to grip or descend safely.",
      prohibitedPatterns: ["vertical_pull", "isometric", "locomotion"],
      absolute: true,
    },
  ],
  fatigueProfile: {
    // Same chapter-wide `metabolic`/`technical` sourcing approach as
    // TOWEL_PULL_UP. `types` includes "systemic": "Systemic Fatigue:
    // Moderate to High" is at least as strong a signal as the plain
    // "Moderate" ratings already included elsewhere in this file.
    // `types` includes "impact": "Uncontrolled Descent... impact injury"
    // is a real, explicitly named fall/collision risk (Common Errors) —
    // the only one of this chapter's five exercises to name "impact"
    // directly.
    types: ["neural", "muscular", "connective_tissue", "systemic", "impact"],
    neural: 4, // "Neurological Fatigue: Moderate to High"
    muscular: 5, // "Local Fatigue: Very High" — the highest local-fatigue rating in this chapter, the ceiling Rating5 value
    metabolic: 1, // see TOWEL_PULL_UP's own fatigueProfile comment
    connectiveTissue: 4, // "Connective-Tissue Stress: High"
    technical: 4, // fallback from "Complexity: High" (minimumTechnicalLevel 4)
  },
  evidenceLevel: "unknown",
  // "# Sport-Specific Relevance" — Brazilian Jiu-Jitsu: High (5); Judo:
  // High (5); Wrestling: Moderate to High (4); MMA: Moderate to High (4);
  // Krav Maga: Moderate (3); Boxing and Kickboxing: Low to Moderate (2,
  // both).
  combatSportRelevance: {
    brazilian_jiu_jitsu: 5,
    judo: 5,
    wrestling: 4,
    mma: 4,
    krav_maga: 3,
    boxing: 2,
    kickboxing: 2,
  },
  // "# Substitution Logic" names "Towel Pull-Up", "Towel Hang", "Lat
  // Pulldown With Rope Attachment", "Farmer Carry" and "Plate Pinch".
  // "Towel Pull-Up"/"Plate Pinch" → integrated in this same batch.
  // "Farmer Carry" → `farmer_carry` (confirmed real chapter, not yet
  // integrated). "Towel Hang"/"Lat Pulldown With Rope Attachment" name no
  // exercise with its own chapter/catalog id.
  substitutionExerciseIds: ["towel_pull_up", "plate_pinch", "farmer_carry"],
};

// -----------------------------------------------------------------------------
// Rope Pull
// Source: 50-exercises/65_GRIP/14_ROPE_PULL.md
// -----------------------------------------------------------------------------

/**
 * Fifth and final entry from the `65_GRIP` chapter. No
 * prescription-registry entry exists for this exercise (confirmed by
 * direct search).
 *
 * Deliberately NOT copied from `ROPE_CLIMB`'s own requirements despite
 * sharing the word "rope" — "Equipment: Climbing Rope, Sled or Anchored
 * Load" describes a rope attached to a DRAGGED external resistance (a
 * sled or fixed anchor point providing tension), not a fixed overhead
 * climbing rope. The rope itself is the one constant, repeatedly named
 * element throughout the fiche ("Use a securely anchored rope", "Inspect
 * the rope before use"); "Sled or Anchored Load" is documented as a
 * variable resistance-source detail rather than a strict, single
 * additional required implement, and "Anchored Load" has no clean
 * `EquipmentType` match of its own — `rope` alone is used as the required
 * equipment atom, not `sled` and not an invented "anchored load" type.
 * No `rigid_anchor_support`/overhead-anchor requirement is added either:
 * "This variation requires a safe pulley or anchor setup" is stated only
 * for the documented "# Vertical Rope Pull" VARIATION, not this fiche's
 * own base/default "# Standing Rope Pull" form (described first among the
 * variation sections, with "whole-body force transfer" as its own
 * primary benefit).
 *
 * No explicit surface-safety language exists anywhere in this fiche
 * (checked directly) — unlike ROPE_CLIMB's own explicit "safe landing
 * surface" grounding, this is a floor-contact pulling exercise with no
 * descent/fall risk, so `floor_safe`/`safe_landing_surface` are not
 * added; "Keep the pulling lane clear" is a space/obstacle concern,
 * already captured by `sufficient_space`.
 *
 * "Prescription Variables — Distance: 5 to 15 metres for strength
 * emphasis, 10 to 30 metres for strength endurance" — a genuine,
 * quantified extended-distance requirement comparable in magnitude to
 * PINCH_CARRY's own 10–40 metre grounding, hence the same `"large"` tier.
 */
export const ROPE_PULL: ExerciseDefinition = {
  id: "rope_pull",
  name: "Rope Pull",
  module: "grip",
  primaryAdaptation: "maximum_strength",
  // Secondary Adaptations: "Trunk Stability" (→ trunk_strength), "Shoulder
  // Stability" (→ stability). "Open-Hand Grip"/"Support Grip"/"Grip
  // Endurance"/"Open-Hand Strength"/"Support-Grip Endurance" fall under
  // the single grip_strength umbrella. Secondary Adaptations: "Work
  // Capacity" (exact match → general_work_capacity, the first entry in
  // this catalog to earn this quality — reflecting this fiche's own more
  // conditioning/endurance-oriented "Primary Adaptation: Repeated
  // Grip-Integrated Pulling Capacity" framing, distinct from ROPE_CLIMB's
  // own strength-framed Primary Adaptation). No "Coordination"/"Relative
  // Strength" language exists anywhere in this fiche (checked directly)
  // — both deliberately excluded, a genuine divergence from ROPE_CLIMB
  // ("The movement is easier to learn than a Rope Climb because the
  // athlete remains in contact with the floor").
  physicalQualities: ["grip_strength", "stability", "trunk_strength", "general_work_capacity"],
  // Exercise Identity: "Primary Pattern: Horizontal or Vertical Pull.
  // Secondary Pattern: Repeated Grip and Hand-Over-Hand Pulling." Both
  // pull directions are named together in the Primary Pattern field
  // itself (not a "pick one" ambiguity — "# Standing Rope Pull" and "#
  // Vertical Rope Pull" are both real, documented variations of the same
  // base exercise) → horizontal_pull, vertical_pull. "Repeated Grip" is
  // explicitly NOT "Isometric Grip" the way ROPE_CLIMB's own Secondary
  // Pattern is — continuous hand-over-hand regripping, not a sustained
  // static hold — so `isometric` is deliberately NOT added here, a real
  // divergence from every other grip-hold exercise in this chapter.
  movementPatterns: ["horizontal_pull", "vertical_pull"],
  // No dedicated "Force Vector" heading exists in this chapter's format.
  // Matching the same "Horizontal or Vertical Pull" duality named in the
  // Primary Pattern field, both components are represented.
  forceVectors: ["horizontal", "vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "rope" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "large" },
        ],
      },
    ],
  },
  // Exercise Identity: "Complexity: Moderate", corroborated by "#
  // Technical Complexity — Moderate. The movement is easier to learn than
  // a Rope Climb because the athlete remains in contact with the floor."
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // Exercise Identity: "Unilateral or Bilateral: Alternating Bilateral"
  // — same resolution as ROPE_CLIMB's own identical phrasing:
  // `unilateral: false`.
  unilateral: false,
  // Primary Muscles: Latissimus Dorsi, Biceps Brachii, Brachialis,
  // Brachioradialis, Finger Flexors, Forearm Flexors — identical to
  // TOWEL_PULL_UP's/ROPE_CLIMB's own Primary Muscles list, the same
  // genuine convergence (grip-integrated pulling), not a copy.
  bodyRegionsLoaded: ["shoulder", "upper_arm", "forearm", "hand"],
  // "# Absolute Contraindications", quoted one item per source line.
  // "an unsafe rope or load setup" is excluded — an equipment/setup
  // concern, not an athlete-state condition.
  contraindications: [
    { description: "Acute hand injury.", prohibitedPatterns: ["horizontal_pull", "vertical_pull"], absolute: true },
    { description: "Acute wrist injury.", prohibitedPatterns: ["horizontal_pull", "vertical_pull"], absolute: true },
    { description: "Acute elbow injury.", prohibitedPatterns: ["horizontal_pull", "vertical_pull"], absolute: true },
    { description: "Acute shoulder injury.", prohibitedPatterns: ["horizontal_pull", "vertical_pull"], absolute: true },
    { description: "Neurological loss of grip control.", prohibitedPatterns: ["horizontal_pull", "vertical_pull"], absolute: true },
    { description: "Inability to maintain a stable stance.", prohibitedPatterns: ["horizontal_pull", "vertical_pull"], absolute: true },
  ],
  fatigueProfile: {
    // Same chapter-wide `metabolic`/`technical` sourcing approach as
    // TOWEL_PULL_UP. `types` includes "systemic": "Systemic Fatigue:
    // Moderate" is a plain, unqualified rating, matching the same
    // inclusion reasoning used throughout this file. No "impact" language
    // exists anywhere in this fiche (checked directly) — unlike
    // ROPE_CLIMB's own explicit "impact injury" mention — so "impact" is
    // deliberately NOT tagged here.
    types: ["neural", "muscular", "connective_tissue", "systemic"],
    neural: 3, // "Neurological Fatigue: Moderate"
    muscular: 4, // "Local Fatigue: High"
    metabolic: 1, // see TOWEL_PULL_UP's own fatigueProfile comment
    connectiveTissue: 4, // "Connective-Tissue Stress: Moderate to High"
    technical: 3, // fallback from "Complexity: Moderate" (minimumTechnicalLevel 3)
  },
  evidenceLevel: "unknown",
  // "# Sport-Specific Relevance" — Brazilian Jiu-Jitsu: High (5); Judo:
  // High (5); Wrestling: Moderate to High (4); MMA: Moderate to High (4);
  // Krav Maga: Moderate (3); Boxing and Kickboxing: Low to Moderate (2,
  // both).
  combatSportRelevance: {
    brazilian_jiu_jitsu: 5,
    judo: 5,
    wrestling: 4,
    mma: 4,
    krav_maga: 3,
    boxing: 2,
    kickboxing: 2,
  },
  // "# Substitution Logic" names "Rope Climb", "Towel Pull-Up", "Cable
  // Rope Row", "Farmer Carry" and "Plate Pinch". "Rope Climb"/"Towel
  // Pull-Up"/"Plate Pinch" → integrated in this same batch. "Farmer
  // Carry" → `farmer_carry` (confirmed real chapter, not yet integrated).
  // "Cable Rope Row" names no exercise with its own chapter/catalog id.
  substitutionExerciseIds: ["rope_climb", "towel_pull_up", "plate_pinch", "farmer_carry"],
};

// -----------------------------------------------------------------------------
// Farmer Carry
// Source: 50-exercises/66_CARRIES/10_FARMER_CARRY.md
// -----------------------------------------------------------------------------

/**
 * First entry from the `66_CARRIES` chapter, migrated as a single coherent
 * batch alongside `FRONT_RACK_CARRY`/`SANDBAG_CARRY`/`ZERCHER_CARRY`.
 *
 * LOCKED ARCHITECTURAL DECISION, resolved before any code was written:
 * `farmer_carry` also has a fiche under `50-exercises/62_CORE/16_FARMER_CARRY.md`.
 * That file uses the older, unstructured prose format with no "Exercise
 * Identity" header (no `Equipment:`/`Complexity:`/`Unilateral or Bilateral:`
 * fields at all — confirmed by direct inspection) — the same superseded
 * shape already seen and deliberately overridden for `box_jump`,
 * `depth_jump`, `broad_jump`, `push_press` and `hang_power_clean` earlier in
 * this catalog. `50-exercises/66_CARRIES/10_FARMER_CARRY.md` (this file) is
 * therefore the sole canonical source. Only ONE `farmer_carry` entry exists
 * in `EXERCISE_KNOWLEDGE_BASE` (confirmed: no prior `farmer_carry` id exists
 * anywhere in the catalog, including the `65_GRIP` chapter, before this
 * batch); it is not duplicated under a "core" module. Its trunk-bracing
 * demand is represented through `physicalQualities`/`bodyRegionsLoaded`
 * exactly like any other exercise's trunk contribution — it does not become
 * a second, core-flavoured copy of the same movement.
 *
 * `exercisePrescriptionRegistry.ts` has an entry for this exercise
 * (`farmerCarryEntry`) with `moduleId: "grip"`, `laterality: "bilateral"`,
 * `requiredEquipmentCapabilities: ["loaded_carry_implement"]` and
 * `supportedLoadingModes: ["dumbbell", "kettlebell"]` — used below as
 * corroborating, not overriding, evidence per the project's established
 * precedence: canonical documentation governs `exerciseKnowledgeBase.ts`.
 *
 * Central business question for this entry: "Equipment: Dumbbells,
 * Kettlebells, Farmer Handles, Trap Bar or Similar Implements" documents
 * FOUR genuinely equivalent implements — corroborated by this fiche's own
 * dedicated "# Implement Comparison" section, which gives each of the four
 * its own subsection of advantages/limitations as interchangeable carry
 * implements for the same movement. This is the first genuine, textually
 * confirmed case of true equipment equivalence in this catalog since the
 * `pinch_grip_implement` type was introduced — but unlike that case, all
 * four alternatives already have their OWN dedicated, real `EquipmentType`
 * values (`dumbbell`, `kettlebell`, `farmer_handle`, `trap_bar`), so no new
 * equivalence-group type is invented. `requirements` therefore uses the
 * model's `any_of` clause kind for the first time in this catalog — a
 * correct, already-supported mechanism (see `evaluateRequirementClause`'s
 * `.some(...)` handling for `any_of`), simply never previously needed
 * because no earlier exercise documented more than one true equipment
 * alternative without an existing equivalence type. The registry's own
 * narrower `supportedLoadingModes: ["dumbbell", "kettlebell"]` does NOT
 * contradict this: `LoadingMode` (a distinct, coarser prescription-layer
 * vocabulary — see `validateCompatibility.ts`) has no `"farmer_handle"` or
 * `"trap_bar"` value at all, so the registry's narrower set reflects a
 * vocabulary gap in that different layer, not a business decision to
 * exclude those two implements from this exercise.
 */
export const FARMER_CARRY: ExerciseDefinition = {
  id: "farmer_carry",
  name: "Farmer Carry",
  module: "grip",
  primaryAdaptation: "maximum_strength",
  // Primary Adaptation: "Bilateral Loaded Locomotor Strength" — ends in
  // "Strength" like every entry in the `65_GRIP` chapter's own Primary
  // Adaptation framing; `maximum_strength` remains the closest
  // AdaptationDomain match, not the more tempting `"robustness"` value —
  // "robustness" never appears in this fiche's own "# Primary Adaptation"
  // heading, only in "General Physical Preparation"/"Tendon Robustness"
  // secondary framing and Combat Transfer prose, which this file does not
  // use as a `primaryAdaptation` source.
  //
  // Secondary Classifications/Adaptations mapped: "Support Grip" / "Grip
  // Endurance" / "Support-Grip Strength" → grip_strength. "Trunk
  // Stability" / "Anti-Extension Strength" / "Anti-Flexion Strength" /
  // "Whole-Body Bracing" → trunk_strength. "Postural Control" / "Shoulder
  // Stability" / "Shoulder-Girdle Stability" / "Hip Stability" /
  // "Postural Endurance" → stability. "Gait Integrity" / "Gait
  // Coordination" → coordination. "Work Capacity" → general_work_capacity
  // (exact match). "Tendon Robustness" → tissue_capacity. "Whole-Body
  // Strength" and "General Physical Preparation" are generic, non-specific
  // framing with no distinct PhysicalQuality counterpart and are
  // deliberately not force-mapped.
  physicalQualities: ["grip_strength", "trunk_strength", "stability", "coordination", "general_work_capacity", "tissue_capacity"],
  // Exercise Identity: "Primary Pattern: Bilateral Loaded Locomotion.
  // Secondary Pattern: Isometric Grip and Whole-Body Bracing." → carry,
  // isometric.
  movementPatterns: ["carry", "isometric"],
  // No dedicated "Force Vector" heading exists in this chapter's format.
  // The load is already positioned beside the body before the "Movement
  // Description" begins (pickup is a distinct Starting-Position/Execution
  // setup step, not the exercise's own defining action) — the governing
  // action is horizontal locomotion carrying a resisted load, matching
  // PINCH_CARRY's own identical resolution.
  forceVectors: ["horizontal"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "any_of",
        items: [
          { kind: "equipment", equipment: "dumbbell" },
          { kind: "equipment", equipment: "kettlebell" },
          { kind: "equipment", equipment: "farmer_handle" },
          { kind: "equipment", equipment: "trap_bar" },
        ],
      },
      {
        kind: "all_of",
        items: [{ kind: "environment", capability: "sufficient_space", minimumSpace: "large" }],
      },
    ],
  },
  // Exercise Identity: "Complexity: Low", corroborated by "# Technical
  // Complexity — Low. The Farmer Carry is easy to teach...".
  minimumTechnicalLevel: 1,
  complexity: "low",
  // Exercise Identity: "Unilateral or Bilateral: Bilateral" (explicit,
  // unambiguous), matching the registry's own independent
  // `laterality: "bilateral"`.
  unilateral: false,
  // Primary Muscles: Finger Flexors, Forearm Flexors, Upper Trapezius,
  // Middle Trapezius, Deltoids, Abdominal Wall, Obliques, Spinal
  // Stabilizers, Gluteals, Quadriceps → hand + forearm (finger/forearm
  // flexors), shoulder (trapezius/deltoids), abdomen (abdominal
  // wall/obliques/spinal stabilizers, matching this catalog's existing
  // abdomen-as-trunk-bracing convention), hip (gluteals), thigh
  // (quadriceps). Secondary Muscles are excluded, matching the precedent
  // used throughout this file.
  bodyRegionsLoaded: ["hand", "forearm", "shoulder", "abdomen", "hip", "thigh"],
  // "# Absolute Contraindications", quoted one item per source line.
  // "an unsafe carry environment" is excluded — an equipment/environment
  // setup concern, not an athlete-state condition, matching the
  // ROPE_CLIMB precedent of excluding "an unsafe climbing environment".
  // "inability to walk safely" IS included, matching the established
  // precedent of treating "inability to [safety-critical sub-task]"
  // phrases as athlete-state contraindications (see TOWEL_PULL_UP's
  // "Inability to grip the towel securely", ROPE_CLIMB's "Inability to
  // grip or descend safely").
  contraindications: [
    { description: "Acute neurological weakness.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Acute hand injury.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Acute shoulder injury.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Acute spinal injury.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Inability to walk safely.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // This chapter's own "# Fatigue Profile" format uses the same four
    // dimensions (Systemic/Local/Neurological/Connective-Tissue) as
    // `65_GRIP` and never rates metabolic fatigue directly. Unlike the
    // GRIP chapter's uniform minimal `metabolic: 1` default, this
    // chapter's own governing `00_OVERVIEW.md` explicitly states, as a
    // chapter-wide trait: "Fatigue Cost ... moderate cardiovascular
    // demand" — grounding a uniform `metabolic: 3` baseline across this
    // whole batch instead (adjusted upward per-exercise only where an
    // individual fiche gives stronger, exercise-specific textual
    // grounding — see SANDBAG_CARRY). Not tagged in `types`, matching the
    // same convention used for `technical`: the value is a documented
    // chapter-level inference, not this specific exercise's own
    // dedicated Fatigue Profile heading.
    types: ["neural", "muscular", "connective_tissue", "systemic"],
    neural: 3, // "Neurological Fatigue: Moderate"
    muscular: 4, // "Local Fatigue: High"
    metabolic: 3, // see comment above
    connectiveTissue: 3, // "Connective-Tissue Stress: Moderate"
    technical: 1, // fallback from "Complexity: Low" (minimumTechnicalLevel 1)
  },
  // No "Evidence Classification"/"Scientific Evidence" section exists
  // anywhere in this chapter (checked directly). Left "unknown", matching
  // this file's established discipline.
  evidenceLevel: "unknown",
  // "# Sport-Specific Relevance" — Brazilian Jiu-Jitsu: Moderate (3);
  // Judo: Moderate to High (4); Wrestling: High (5); MMA: High (5); Krav
  // Maga: Moderate to High (4); Boxing and Kickboxing: Moderate (3, both).
  combatSportRelevance: {
    brazilian_jiu_jitsu: 3,
    judo: 4,
    wrestling: 5,
    mma: 5,
    krav_maga: 4,
    boxing: 3,
    kickboxing: 3,
  },
  // "# Substitution Logic" names "Suitcase Carry", "Front Rack Carry",
  // "Bear-Hug Carry", "Static Farmer Hold" and "Trap-Bar Carry". "Suitcase
  // Carry" → `suitcase_carry` (`50-exercises/62_CORE/17_SUITCASE_CARRY.md`,
  // confirmed real chapter, not yet integrated — same doc-backed-but-
  // uncatalogued precedent already used throughout this file). "Front
  // Rack Carry" → integrated in this same batch below. "Bear-Hug Carry",
  // "Static Farmer Hold" and "Trap-Bar Carry" name no exercise with its
  // own chapter/catalog id in this repository.
  substitutionExerciseIds: ["suitcase_carry", "front_rack_carry"],
};

// -----------------------------------------------------------------------------
// Front Rack Carry
// Source: 50-exercises/66_CARRIES/11_FRONT_RACK_CARRY.md
// -----------------------------------------------------------------------------

/**
 * Second entry from the `66_CARRIES` chapter. `exercisePrescriptionRegistry.ts`
 * has an entry (`frontRackCarryEntry`) with `moduleId: "grip"`,
 * `laterality: "bilateral"`, `requiredEquipmentCapabilities:
 * ["loaded_carry_implement"]` and `supportedLoadingModes: ["dumbbell",
 * "kettlebell"]`.
 *
 * Central business question: this exercise's name and every doc heading
 * ("Front Rack Carry", "front-rack position", "front-rack tolerance") name
 * an ANATOMICAL LOAD POSITION — the load resting at the shoulders/upper
 * torso — never the `rack` `EquipmentType` (a barbell squat/support rack).
 * No barbell rack, stand or support of any kind is mentioned anywhere in
 * this fiche's Equipment, Starting Position or Safety Rules — the athlete
 * cleans or lifts the implement directly into position ("Clean or position
 * the implement safely into the front rack"). `requirements` therefore
 * never references the `rack` EquipmentType, consistent with the explicit
 * instruction not to confuse the front-rack position with rack equipment.
 *
 * "Equipment: Kettlebells, Dumbbells, Barbell, Sandbag or Similar
 * Front-Loaded Implements" documents FOUR genuine alternatives, each with
 * its own dedicated subsection under "# Shoulder Demand" (Kettlebells /
 * Dumbbells / Barbell / Sandbag) and its own named variation later in the
 * fiche ("# Double Kettlebell Front Rack Carry", "# Barbell Front Rack
 * Carry", "# Sandbag Front Carry") — all four map onto existing
 * `EquipmentType` values (`kettlebell`, `dumbbell`, `barbell`, `sandbag`),
 * so `any_of` is used again here, matching FARMER_CARRY's own resolution.
 * The registry's narrower `["dumbbell", "kettlebell"]` set is a real,
 * documented discrepancy in this case (unlike FARMER_CARRY's
 * farmer_handle/trap_bar gap): `LoadingMode` DOES have both `"barbell"`
 * and `"sandbag"` values (confirmed — `zercher_carry`'s own registry entry
 * uses both), so this narrower registry set is not explained by a
 * vocabulary gap. It is flagged as a genuine, non-blocking discrepancy
 * between the registry and the canonical documentation rather than
 * silently resolved either way.
 *
 * Wrist/elbow/shoulder/trunk constraints are explicit and heavily
 * documented (see "# Joint Actions": dedicated Shoulder/Elbow/Wrist/Trunk
 * subsections; Absolute Contraindications name acute wrist, elbow,
 * shoulder and spinal injury by name) — reflected in `bodyRegionsLoaded`
 * and `contraindications` below. Distinct from FARMER_CARRY, this fiche
 * repeatedly and explicitly states grip is NOT meant to be the limiting
 * factor ("The exercise is particularly useful when grip should not be
 * the primary limiting factor"; CAS Engine Rules: "grip should not be the
 * main limiting factor" appears twice) — `grip_strength` is therefore
 * deliberately excluded from `physicalQualities`, and Finger
 * Flexors/Forearm Flexors are absent from this fiche's own Primary
 * Muscles list (unlike FARMER_CARRY's), corroborating the exclusion at
 * the muscular level too.
 */
export const FRONT_RACK_CARRY: ExerciseDefinition = {
  id: "front_rack_carry",
  name: "Front Rack Carry",
  module: "grip",
  primaryAdaptation: "maximum_strength",
  // Primary Adaptation: "Front-Loaded Locomotor Strength" — same
  // "...Strength" framing as every other entry in this chapter and the
  // `65_GRIP` chapter; `maximum_strength` used for the same reasoning.
  //
  // Secondary Classifications/Adaptations mapped: "Trunk Stability" /
  // "Anterior Trunk Stability" / "Anti-Flexion Strength" / "Anti-Extension
  // Strength" / "Whole-Body Bracing" → trunk_strength. "Postural Control"
  // / "Shoulder Stability" / "Shoulder-Girdle Stability" / "Hip
  // Stability" / "Postural Endurance" → stability. "Gait Integrity" /
  // "Gait Coordination" → coordination. "Upper-Back Strength" /
  // "Upper-Back Endurance" → muscular_endurance (the first use of this
  // PhysicalQuality in the catalog: a real, existing value, never
  // previously grounded by any earlier fiche's own text). "Front-Rack
  // Tolerance" is a load-position-specific descriptor, not a generic
  // physical capability, and is deliberately not mapped (matching the
  // explicit instruction that load position is not itself a capability).
  // "Breathing Under Load" has no PhysicalQuality counterpart anywhere in
  // this enum and is left unmapped, same as every other breathing-under-
  // compression mention across this chapter. Unlike FARMER_CARRY: no
  // "Work Capacity" or "Tendon Robustness" Secondary Adaptation exists in
  // this fiche (checked directly) — general_work_capacity and
  // tissue_capacity are genuinely, correctly absent here.
  physicalQualities: ["trunk_strength", "stability", "coordination", "muscular_endurance"],
  // Exercise Identity: "Primary Pattern: Front-Loaded Locomotion.
  // Secondary Pattern: Isometric Trunk and Upper-Back Stabilization." →
  // carry, isometric.
  movementPatterns: ["carry", "isometric"],
  // No dedicated "Force Vector" heading exists in this chapter's format.
  // Same resolution as FARMER_CARRY: the load is already secured in the
  // front rack before "Movement Description" begins; the governing action
  // is horizontal locomotion under an anteriorly resisted load.
  forceVectors: ["horizontal"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "any_of",
        items: [
          { kind: "equipment", equipment: "kettlebell" },
          { kind: "equipment", equipment: "dumbbell" },
          { kind: "equipment", equipment: "barbell" },
          { kind: "equipment", equipment: "sandbag" },
        ],
      },
      {
        kind: "all_of",
        items: [{ kind: "environment", capability: "sufficient_space", minimumSpace: "large" }],
      },
    ],
  },
  // Exercise Identity: "Complexity: Moderate", corroborated by "#
  // Technical Complexity — Moderate. The walking pattern is simple, but
  // the rack position requires greater technical control than a low
  // carry."
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // Exercise Identity: "Unilateral or Bilateral: Bilateral or Unilateral"
  // — ambiguous phrasing, resolved to `unilateral: false`, matching the
  // registry's own independent `laterality: "bilateral"` for this exact
  // exercise (same resolution pattern already used for PLATE_PINCH/
  // PINCH_CARRY's identically ambiguous phrasing).
  unilateral: false,
  // Primary Muscles: Upper Trapezius, Middle Trapezius, Rhomboids,
  // Anterior Deltoids, Abdominal Wall, Obliques, Spinal Stabilizers,
  // Gluteals, Quadriceps → shoulder (trapezius/rhomboids/deltoids),
  // abdomen (abdominal wall/obliques/spinal stabilizers), hip (gluteals),
  // thigh (quadriceps). Notably absent: hand/forearm — Finger Flexors and
  // Forearm Flexors are not in this fiche's own Primary Muscles list at
  // all (unlike FARMER_CARRY's), directly corroborating the deliberate
  // exclusion of grip_strength from `physicalQualities` above.
  bodyRegionsLoaded: ["shoulder", "abdomen", "hip", "thigh"],
  // "# Absolute Contraindications", quoted one item per source line. All
  // six items are athlete-state conditions (unlike ROPE_CLIMB's excluded
  // "unsafe climbing environment", nothing here describes an
  // equipment/setup concern) and are all included.
  contraindications: [
    { description: "Acute shoulder injury.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Acute wrist injury.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Acute elbow injury.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Acute spinal injury.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Inability to maintain a safe rack position.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Inability to walk safely under load.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // Same chapter-wide `metabolic`/`technical` sourcing approach as
    // FARMER_CARRY (see its own fatigueProfile comment for the full
    // reasoning).
    types: ["neural", "muscular", "connective_tissue", "systemic"],
    neural: 3, // "Neurological Fatigue: Moderate"
    muscular: 4, // "Local Fatigue: Moderate to High"
    metabolic: 3, // chapter-wide OVERVIEW.md baseline — see FARMER_CARRY's own comment
    connectiveTissue: 3, // "Connective-Tissue Stress: Moderate"
    technical: 3, // fallback from "Complexity: Moderate" (minimumTechnicalLevel 3)
  },
  evidenceLevel: "unknown",
  // "# Sport-Specific Relevance" — Brazilian Jiu-Jitsu: Moderate (3);
  // Judo: High (5); Wrestling: High (5); MMA: High (5); Krav Maga:
  // Moderate to High (4); Boxing and Kickboxing: Moderate (3, both).
  combatSportRelevance: {
    brazilian_jiu_jitsu: 3,
    judo: 5,
    wrestling: 5,
    mma: 5,
    krav_maga: 4,
    boxing: 3,
    kickboxing: 3,
  },
  // "# Substitution Logic" names "Farmer Carry", "Bear-Hug Carry",
  // "Goblet Carry", "Suitcase Carry" and "Static Front-Rack Hold". "Farmer
  // Carry" → integrated in this same batch. "Suitcase Carry" →
  // `suitcase_carry` (confirmed real chapter, not yet integrated).
  // "Bear-Hug Carry", "Goblet Carry" and "Static Front-Rack Hold" name no
  // exercise with its own chapter/catalog id.
  substitutionExerciseIds: ["farmer_carry", "suitcase_carry"],
};

// -----------------------------------------------------------------------------
// Sandbag Carry
// Source: 50-exercises/66_CARRIES/12_SANDBAG_CARRY.md
// -----------------------------------------------------------------------------

/**
 * Third entry from the `66_CARRIES` chapter. `exercisePrescriptionRegistry.ts`
 * has an entry (`sandbagCarryEntry`) with `moduleId: "grip"`,
 * `laterality: "bilateral"`, `requiredEquipmentCapabilities:
 * ["loaded_carry_implement"]` and `supportedLoadingModes: ["sandbag"]` —
 * directly corroborating that `sandbag` is this exercise's sole equipment.
 *
 * "Equipment: Sandbag" — a single, unambiguous implement, unlike
 * FARMER_CARRY/FRONT_RACK_CARRY. Although the doc names several distinct
 * CARRY POSITIONS (bear hug, front carry, shouldered carry, front rack,
 * offset carry — see "# Movement Description" and the dedicated "# Bear-
 * Hug Carry" / "# Front Carry" / "# Shouldered Carry" / "# Front Rack
 * Sandbag Carry" sections), these are documented as VARIATIONS of a single
 * exercise performed with a single implement, not distinct equipment
 * requirements or environmental capabilities — no capability is created
 * for carry position, matching the explicit instruction that load
 * position is not itself a capability.
 */
export const SANDBAG_CARRY: ExerciseDefinition = {
  id: "sandbag_carry",
  name: "Sandbag Carry",
  module: "grip",
  primaryAdaptation: "maximum_strength",
  // Primary Adaptation: "Irregular-Object Loaded Locomotor Strength" —
  // same "...Strength" framing as the rest of this chapter.
  //
  // Secondary Classifications/Adaptations mapped: "Trunk Stability" /
  // "Anterior Trunk Stability" / "Anti-Flexion Strength" / "Anti-Extension
  // Strength" / "Whole-Body Bracing" → trunk_strength. "Postural
  // Endurance" / "Postural Control" / "Shoulder-Girdle Stability" / "Hip
  // Stability" → stability. "Gait Integrity" / "Gait Coordination" →
  // coordination. "Upper-Back Strength" / "Upper-Back Endurance" →
  // muscular_endurance. "Grip and Arm Endurance" → grip_strength — unlike
  // FRONT_RACK_CARRY/ZERCHER_CARRY, this fiche DOES document a real grip/
  // arm endurance demand (the bear-hug and handle-carry positions require
  // active gripping or squeezing — see "# Grip Demand": "CAS must
  // identify whether grip or object control is intended to be the
  // limiting factor"). "Object Control" (Secondary Classification) has no
  // distinct PhysicalQuality counterpart of its own and is treated as
  // already covered by `coordination` (grounded independently via Gait
  // Coordination) rather than double-counted. No "Work Capacity" or
  // "Tendon Robustness" Secondary Adaptation exists in this fiche
  // (checked directly) — general_work_capacity and tissue_capacity are
  // genuinely absent here.
  physicalQualities: ["grip_strength", "trunk_strength", "stability", "coordination", "muscular_endurance"],
  // Exercise Identity: "Primary Pattern: Front-Loaded or Bear-Hug Loaded
  // Locomotion. Secondary Pattern: Object Control and Whole-Body
  // Bracing." → carry, isometric ("Whole-Body Bracing" is the same
  // isometric-stabilization framing used by every other entry in this
  // chapter; "Object Control" has no distinct MovementPattern counterpart
  // of its own and is not force-mapped to a pattern that does not
  // genuinely describe it).
  movementPatterns: ["carry", "isometric"],
  // No dedicated "Force Vector" heading exists in this chapter's format.
  // Same resolution as the rest of this chapter: horizontal locomotion
  // under a resisted, already-secured load.
  forceVectors: ["horizontal"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "sandbag" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "large" },
        ],
      },
    ],
  },
  // Exercise Identity: "Complexity: Moderate", corroborated by "#
  // Technical Complexity — Moderate. The walking pattern is simple, but
  // the sandbag introduces irregular load behavior."
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // Exercise Identity: "Unilateral or Bilateral: Bilateral or
  // Asymmetrical" — an ambiguous, non-strictly-unilateral phrasing (unlike
  // a true per-side unilateral exercise), resolved to `unilateral: false`,
  // matching the registry's own independent `laterality: "bilateral"` for
  // this exact exercise.
  unilateral: false,
  // Primary Muscles: Upper Trapezius, Middle Trapezius, Rhomboids,
  // Latissimus Dorsi, Anterior Deltoids, Biceps Brachii, Abdominal Wall,
  // Obliques, Spinal Stabilizers, Gluteals, Quadriceps → shoulder
  // (trapezius/rhomboids/lat dorsi/deltoids), upper_arm (Biceps Brachii —
  // PRIMARY here, unlike FRONT_RACK_CARRY/ZERCHER_CARRY where it is only
  // Secondary or absent, directly reflecting the bear-hug "wrap and
  // squeeze" cue's active elbow-flexion demand), abdomen, hip, thigh.
  bodyRegionsLoaded: ["shoulder", "upper_arm", "abdomen", "hip", "thigh"],
  // "# Absolute Contraindications", quoted one item per source line.
  // "an unstable or damaged sandbag" is excluded — an equipment/setup
  // concern, matching the precedent of excluding comparable
  // equipment-condition items elsewhere in this file.
  contraindications: [
    { description: "Acute spinal injury.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Acute shoulder injury.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Acute upper-limb injury.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Uncontrolled respiratory symptoms.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Inability to walk safely.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // Same chapter-wide `technical` sourcing approach as FARMER_CARRY.
    // `metabolic` is raised to 4 here specifically — beyond this
    // chapter's uniform `metabolic: 3` OVERVIEW.md baseline — because this
    // fiche alone carries its own dedicated, exercise-specific corroborating
    // text beyond the chapter-wide framing: "# Interaction With Other
    // Training — Conditioning — The exercise can create a strong
    // cardiovascular response." Not tagged in `types`, for the same reason
    // metabolic is never tagged elsewhere in this file: the source is not
    // this exercise's own dedicated "# Fatigue Profile" heading.
    types: ["neural", "muscular", "connective_tissue", "systemic"],
    neural: 3, // "Neurological Fatigue: Moderate"
    muscular: 4, // "Local Fatigue: High"
    metabolic: 4, // see comment above
    connectiveTissue: 3, // "Connective-Tissue Stress: Moderate"
    technical: 3, // fallback from "Complexity: Moderate" (minimumTechnicalLevel 3)
  },
  evidenceLevel: "unknown",
  // "# Sport-Specific Relevance" — Brazilian Jiu-Jitsu: High (5); Judo:
  // High (5); Wrestling: Very High (5 — Rating5's ceiling, same tier as
  // "High" elsewhere); MMA: Very High (5); Krav Maga: High (5); Boxing and
  // Kickboxing: Moderate (3, both).
  combatSportRelevance: {
    brazilian_jiu_jitsu: 5,
    judo: 5,
    wrestling: 5,
    mma: 5,
    krav_maga: 5,
    boxing: 3,
    kickboxing: 3,
  },
  // "# Substitution Logic" names "Front Rack Carry", "Bear-Hug Carry With
  // a Medicine Ball", "Farmer Carry", "Suitcase Carry" and "Static
  // Sandbag Hold". "Front Rack Carry"/"Farmer Carry" → integrated in this
  // same batch. "Suitcase Carry" → `suitcase_carry` (confirmed real
  // chapter, not yet integrated). "Bear-Hug Carry With a Medicine Ball"
  // and "Static Sandbag Hold" name no exercise with its own chapter/
  // catalog id.
  substitutionExerciseIds: ["front_rack_carry", "farmer_carry", "suitcase_carry"],
};

// -----------------------------------------------------------------------------
// Zercher Carry
// Source: 50-exercises/66_CARRIES/13_ZERCHER_CARRY.md
// -----------------------------------------------------------------------------

/**
 * Fourth and final entry from the `66_CARRIES` chapter.
 * `exercisePrescriptionRegistry.ts` has an entry (`zercherCarryEntry`) with
 * `moduleId: "grip"`, `laterality: "bilateral"`,
 * `requiredEquipmentCapabilities: ["loaded_carry_implement"]` and
 * `supportedLoadingModes: ["barbell", "sandbag"]`, with an explicit registry
 * comment: "'axle' has no dedicated LoadingMode value and is intentionally
 * left unrepresented rather than folded into 'barbell'". This is the exact
 * situation described in this batch's instructions: "Equipment: Barbell,
 * Sandbag, Axle or Similar Implement" documents three named implements, but
 * `EquipmentType` has no `"axle"` value (confirmed by direct search) — the
 * same registry precedent is followed here: `axle` is deliberately left
 * unrepresented rather than approximated as `barbell`, and `requirements`
 * uses only `barbell`/`sandbag` via `any_of`.
 *
 * The Zercher position (load cradled in the crooks of the elbows) is an
 * anatomical hold, not an environmental requirement — no capability is
 * created for it, matching the same principle already applied to
 * FRONT_RACK_CARRY's own position.
 *
 * Elbow, trunk and breathing constraints are the dominant theme of this
 * fiche: "# Joint Actions" leads with a dedicated "## Elbow" heading
 * ("sustained flexion, isometric stabilization, load cradling"), "# Elbow
 * and Arm Demand" is its own top-level section, and — uniquely among this
 * chapter's four exercises — the Absolute Contraindications name "acute
 * elbow injury" AND "acute biceps injury" explicitly, with Biceps Brachii
 * and Brachialis both appearing as PRIMARY (not secondary) muscles. This
 * grounds the first use of the `elbow` `BodyRegion` value anywhere in this
 * catalog (see `bodyRegionsLoaded` below) — FRONT_RACK_CARRY's own elbow
 * involvement is comparatively minor (one bullet among several under
 * Joint Actions, no dedicated "Elbow and Arm Demand" section, and no
 * elbow-specific Absolute Contraindication), so `elbow` is deliberately
 * NOT added there, keeping the distinction between the two front-loaded
 * carries honest rather than mechanically copied.
 */
export const ZERCHER_CARRY: ExerciseDefinition = {
  id: "zercher_carry",
  name: "Zercher Carry",
  module: "grip",
  primaryAdaptation: "maximum_strength",
  // Primary Adaptation: "Anterior-Load Locomotor Strength" — same
  // "...Strength" framing as the rest of this chapter.
  //
  // Secondary Classifications/Adaptations mapped: "Anti-Flexion Strength"
  // / "Anti-Extension Strength" / "Trunk Stability" / "Anterior Trunk
  // Stability" / "Whole-Body Bracing" → trunk_strength. "Postural
  // Control" / "Postural Endurance" / "Shoulder-Girdle Stability" / "Hip
  // Stability" → stability. "Gait Integrity" / "Gait Coordination" →
  // coordination. "Upper-Back Strength" / "Upper-Back Endurance" →
  // muscular_endurance. "Elbow-Supported Object Control" is a
  // position-specific descriptor, not a generic capability, and is
  // deliberately not mapped. Like FRONT_RACK_CARRY (and explicitly
  // unlike SANDBAG_CARRY/FARMER_CARRY), this fiche states grip is not
  // meant to be the limiting factor — "Wrist and Hand: ... minimal
  // primary grip demand" under Joint Actions, "grip should not be the
  // primary limiter" in both Purpose and CAS Engine Rules —
  // `grip_strength` is deliberately excluded.
  physicalQualities: ["trunk_strength", "stability", "coordination", "muscular_endurance"],
  // Exercise Identity: "Primary Pattern: Front-Loaded Locomotion.
  // Secondary Pattern: Isometric Trunk and Upper-Back Stabilization." →
  // carry, isometric.
  movementPatterns: ["carry", "isometric"],
  // No dedicated "Force Vector" heading exists in this chapter's format.
  // Same resolution as the rest of this chapter: horizontal locomotion
  // under a resisted, already-secured load.
  forceVectors: ["horizontal"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "any_of",
        items: [
          { kind: "equipment", equipment: "barbell" },
          { kind: "equipment", equipment: "sandbag" },
        ],
      },
      {
        kind: "all_of",
        items: [{ kind: "environment", capability: "sufficient_space", minimumSpace: "large" }],
      },
    ],
  },
  // Exercise Identity: "Complexity: Moderate", corroborated by "#
  // Technical Complexity — Moderate. The walking pattern is simple, but
  // the load position requires...".
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // Exercise Identity: "Unilateral or Bilateral: Bilateral" (explicit,
  // unambiguous), matching the registry's own independent
  // `laterality: "bilateral"`.
  unilateral: false,
  // Primary Muscles: Upper Trapezius, Middle Trapezius, Rhomboids,
  // Latissimus Dorsi, Biceps Brachii, Brachialis, Abdominal Wall,
  // Obliques, Spinal Stabilizers, Gluteals, Quadriceps → shoulder
  // (trapezius/rhomboids/lat dorsi), upper_arm (Biceps Brachii,
  // Brachialis — both PRIMARY, matching the elbow-cradle emphasis), elbow
  // (see the block comment above this export for the full reasoning —
  // the first use of this BodyRegion value in the catalog), abdomen,
  // hip, thigh.
  bodyRegionsLoaded: ["shoulder", "upper_arm", "elbow", "abdomen", "hip", "thigh"],
  // "# Absolute Contraindications", quoted one item per source line. All
  // six items are athlete-state conditions and are all included.
  contraindications: [
    { description: "Acute elbow injury.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Acute biceps injury.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Acute shoulder injury.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Acute spinal injury.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Uncontrolled respiratory symptoms.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
    { description: "Inability to walk safely under load.", prohibitedPatterns: ["carry", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // Same chapter-wide `metabolic`/`technical` sourcing approach as
    // FARMER_CARRY.
    types: ["neural", "muscular", "connective_tissue", "systemic"],
    neural: 3, // "Neurological Fatigue: Moderate"
    muscular: 4, // "Local Fatigue: High"
    metabolic: 3, // chapter-wide OVERVIEW.md baseline — see FARMER_CARRY's own comment
    connectiveTissue: 4, // "Connective-Tissue Stress: Moderate to High"
    technical: 3, // fallback from "Complexity: Moderate" (minimumTechnicalLevel 3)
  },
  evidenceLevel: "unknown",
  // "# Sport-Specific Relevance" — Brazilian Jiu-Jitsu: High (5); Judo:
  // High (5); Wrestling: Very High (5); MMA: Very High (5); Krav Maga:
  // High (5); Boxing and Kickboxing: Moderate (3, both).
  combatSportRelevance: {
    brazilian_jiu_jitsu: 5,
    judo: 5,
    wrestling: 5,
    mma: 5,
    krav_maga: 5,
    boxing: 3,
    kickboxing: 3,
  },
  // "# Substitution Logic" names "Front Rack Carry", "Sandbag Carry",
  // "Bear-Hug Carry", "Farmer Carry" and "Static Zercher Hold". "Front
  // Rack Carry"/"Sandbag Carry"/"Farmer Carry" → integrated in this same
  // batch. "Bear-Hug Carry" and "Static Zercher Hold" name no exercise
  // with its own chapter/catalog id.
  substitutionExerciseIds: ["front_rack_carry", "sandbag_carry", "farmer_carry"],
};

// -----------------------------------------------------------------------------
// Back Squat
// Source: 50-exercises/01_BACK_SQUAT
// -----------------------------------------------------------------------------

/**
 * First entry of the "Lot 1 — Force fondamentale bas du corps" batch, migrated
 * alongside FRONT_SQUAT/TRAP_BAR_DEADLIFT/ROMANIAN_DEADLIFT/HIP_THRUST/
 * BULGARIAN_SPLIT_SQUAT. Source is a flat, standalone file under
 * `50-exercises/` (no chapter folder, no `00_OVERVIEW.md`/`90_COMPARISON.md`
 * wrapper, no file extension) — a genuinely different, older documentary
 * layer than every prior 6X-numbered chapter batch, confirmed to have no
 * newer chapter fiche superseding it (unlike `farmer_carry`/`box_jump`/etc.).
 * `exercisePrescriptionRegistry.ts` has a corroborating `backSquatEntry`
 * (`moduleId: "strength"`, `requiredEquipmentCapabilities: ["barbell", "rack",
 * "plates"]`, `laterality: "bilateral"`) — used only to corroborate, not
 * override, per the project's established precedence.
 *
 * DOCUMENTATION-FORMAT LIMITATION, flagged explicitly: unlike every fiche
 * migrated so far (62_CORE through 67_BALLISTICS), this file has NO "Space
 * Requirement"/"Space Requirements" heading and no surface-safety language
 * anywhere (checked directly — no occurrence of "space", "surface", "floor",
 * or "slip" outside the unrelated coaching cue "Push the floor away").
 * Neither `sufficient_space` nor `floor_safe` is added to `requirements` for
 * this reason — inventing a plausible-sounding minimum would be exactly the
 * silent approximation this project's methodology forbids. This same gap
 * recurs identically across all six entries in this batch and is noted once
 * here as the batch-wide documentation-format limitation.
 *
 * "# Equipment Requirements — Required: Barbell, Rack, Weight Plates." All
 * three required atoms map directly to existing `EquipmentType` values.
 * "Optional — Weightlifting Shoes, Safety Bars, Belt, Knee Sleeves" and
 * "Safety Arms Recommended: Yes" (Safety Profile) are RECOMMENDATIONS, not
 * requirements — "Safety Bars"/"Safety Arms" never appear under "Required",
 * only "Optional" and "Recommended", so no `rigid_anchor_support` or other
 * safety-equipment atom is added; a recommended safety practice is not a
 * documented eligibility gate.
 *
 * "# Biomechanical Profile — Primary Force Vector: Vertical. Secondary Force
 * Vector: Minimal Horizontal." The word "Minimal" explicitly hedges the
 * secondary vector as immaterial — `forceVectors: ["vertical"]` only, not
 * `["vertical", "horizontal"]`. This same "Minimal Horizontal" hedge recurs
 * for FRONT_SQUAT and BULGARIAN_SPLIT_SQUAT below and is resolved identically
 * each time.
 */
export const BACK_SQUAT: ExerciseDefinition = {
  id: "back_squat",
  name: "Back Squat",
  module: "strength",
  // "# Primary Classification: Strength" (explicit).
  primaryAdaptation: "maximum_strength",
  // "# Capability Mapping — Primary: Maximum Strength, Relative Strength" →
  // absolute_strength, relative_strength (exact matches). "Secondary:
  // Explosive Strength" → explosive_strength (exact). "Core Stability" →
  // trunk_strength (matching this catalog's established bracing-under-load
  // convention). "Movement Coordination" → coordination. "Mechanical
  // Robustness" → tissue_capacity (matching PLATE_PINCH's own "Tendon
  // Robustness" → tissue_capacity precedent). "Force Production" is generic,
  // non-specific framing repeated across this whole batch with no distinct
  // PhysicalQuality counterpart, and is deliberately never force-mapped
  // anywhere in this batch — noted once here, applying uniformly below.
  physicalQualities: ["absolute_strength", "relative_strength", "explosive_strength", "trunk_strength", "coordination", "tissue_capacity"],
  // "# Movement Pattern — Primary: Squat." → squat. "Secondary: Brace" →
  // isometric. "Hip Extension"/"Knee Extension"/"Ankle Plantarflexion" are
  // joint-action-level detail already implied by `squat` itself and are not
  // separately force-fitted into a second MovementPattern value.
  movementPatterns: ["squat", "isometric"],
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "barbell" },
          { kind: "equipment", equipment: "rack" },
          { kind: "equipment", equipment: "plates" },
        ],
      },
    ],
  },
  // "# Skill Requirement: Intermediate" — no numeric complexity level is
  // given anywhere in this file's format (unlike AB_WHEEL's own explicit
  // "Complexity Level: 3"); "Intermediate" is mapped to the same
  // minimumTechnicalLevel 3 / "moderate" pairing used throughout this
  // catalog for that exact word.
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // No "Unilateral or Bilateral" field exists in this format; "bilateral
  // lower-body compound exercise" (Purpose) is explicit and unambiguous.
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Quadriceps, Gluteus Maximus,
  // Adductor Magnus" → thigh (quadriceps, adductor magnus), hip (gluteus
  // maximus). Secondary Muscles (Hamstrings, Soleus, Gastrocnemius) and
  // Stabilizers (Erector Spinae, Abdominals, Obliques, Upper Back, Hip
  // Stabilizers) are excluded, matching this catalog's established
  // primary-muscles-only discipline.
  bodyRegionsLoaded: ["thigh", "hip"],
  // "# Contraindications", quoted one item per source line. This file's
  // format has a single flat list (no "Absolute"/"Relative" tiering the way
  // 62_CORE's fiches sometimes split them) — treated as the hard-exclusion
  // tier, matching the registry's own independent treatment of this same
  // list as blocking pain/injury conditions. `region` is populated where a
  // clean, unambiguous BodyRegion match exists.
  contraindications: [
    { description: "Acute knee injury.", region: "knee", prohibitedPatterns: ["squat", "isometric"], absolute: true },
    { description: "Acute hip injury.", region: "hip", prohibitedPatterns: ["squat", "isometric"], absolute: true },
    { description: "Acute lumbar injury.", region: "lumbar_spine", prohibitedPatterns: ["squat", "isometric"], absolute: true },
    { description: "Severe mobility restrictions.", prohibitedPatterns: ["squat", "isometric"], absolute: true },
    { description: "Poor bracing ability.", prohibitedPatterns: ["squat", "isometric"], absolute: true },
    { description: "Pain during squatting.", prohibitedPatterns: ["squat", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Very High. Mechanical
    // Fatigue: Very High. Metabolic Fatigue: Moderate." mapped via a
    // Low=1/Moderate=2/Moderate-to-High=3/High=4/Very-High=5 word scale
    // (this file's format uses qualitative words, not 62_CORE's X/5
    // numbers). "Neuromuscular Fatigue" → neural. "Mechanical Fatigue" →
    // muscular. No distinct "Connective-Tissue Fatigue" heading exists
    // anywhere in this file's format (checked directly, and absent across
    // this entire batch) — `connectiveTissue` is inferred FROM the same
    // "Mechanical Fatigue" rating used for `muscular` (mechanical loading
    // stresses both the contractile and tendon/connective structures, and
    // this is the only available anchor), flagged here as an inference
    // rather than a direct quote, applying identically to every entry in
    // this batch.
    types: ["neural", "muscular", "connective_tissue"],
    neural: 5,
    muscular: 5,
    connectiveTissue: 5, // inferred from "Mechanical Fatigue: Very High" — see comment above
    metabolic: 2,
    technical: 3, // fallback from "Skill Requirement: Intermediate" (minimumTechnicalLevel 3)
  },
  // "# Scientific Evidence — Evidence Level: ★★★★★. The Back Squat is among
  // the most extensively researched resistance exercises and demonstrates
  // strong evidence..." This maps to the CAS Evidence Framework's own
  // definition (20-engine/02_EXERCISE_KNOWLEDGE_BASE.md: "Level 1 —
  // Scientific consensus") — a genuinely different, stronger claim than the
  // "Level 2 — Expert practice"/"Level 3 — Internal CAS experimentation"
  // framing used for every prior evidenceLevel-populated entry in this
  // catalog so far. This is the first use of `"level_1"` anywhere in
  // `EXERCISE_KNOWLEDGE_BASE`, applying identically across this whole batch
  // given every one of its six fiches makes the same "extensively
  // researched"/"strongly supported by current literature" claim.
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star (5 stars = 5,
  // 1 star = 1). Savate and Sambo are named in this table but have no
  // `CombatSport` enum counterpart and are omitted rather than force-mapped,
  // matching the established precedent from every prior batch.
  combatSportRelevance: {
    boxing: 3,
    kickboxing: 3,
    muay_thai: 3,
    wrestling: 5,
    brazilian_jiu_jitsu: 4,
    judo: 5,
    mma: 5,
    krav_maga: 4,
  },
  // "# Progressions" names "Front Squat" → front_squat (integrated in this
  // same batch, real catalog id). No dedicated "Substitution Logic" section
  // exists in this file's format (unlike every 62_CORE-and-later fiche) —
  // Progressions/Regressions/Variations are used as the substitute source
  // instead, a genuine sourcing-convention divergence for this batch, noted
  // once here. No other Progression/Regression/Variation name resolves to a
  // real catalog id.
  substitutionExerciseIds: ["front_squat"],
};

// -----------------------------------------------------------------------------
// Front Squat
// Source: 50-exercises/02_FRONT_SQUAT
// -----------------------------------------------------------------------------

/**
 * Second entry of this batch. `exercisePrescriptionRegistry.ts` has a
 * corroborating `frontSquatEntry` (`requiredEquipmentCapabilities: ["barbell",
 * "rack", "plates"]`, `laterality: "bilateral"`).
 *
 * Same documentation-format limitation as BACK_SQUAT: no "Space Requirement"
 * heading and no surface-safety language anywhere in this fiche (checked
 * directly) — neither `sufficient_space` nor `floor_safe` is added.
 *
 * Central business question for this entry, central to distinguishing it
 * from BACK_SQUAT: "Front Rack" is an anatomical BAR POSITION (the barbell
 * rests across the anterior shoulders, held by the hands), not a distinct
 * physical implement or equipment atom — it is represented entirely through
 * biomechanical classification (`physicalQualities`, `bodyRegionsLoaded`,
 * `contraindications`), never as a `requirements` gate. Required equipment
 * remains identical to BACK_SQUAT (Barbell, Rack, Weight Plates) — the two
 * exercises share the same physical setup and differ only in bar position
 * and its downstream biomechanical consequences.
 *
 * "# Joint Profile — Secondary Joints: Thoracic Spine, Shoulders, Wrists" —
 * a genuine divergence from BACK_SQUAT's own Secondary Joints (Thoracic
 * Spine, Lumbar Spine, no Shoulders/Wrists) — grounds this entry's own
 * wrist/shoulder-specific contraindications below, directly reflecting the
 * anterior-rack position's distinct joint demand.
 */
export const FRONT_SQUAT: ExerciseDefinition = {
  id: "front_squat",
  name: "Front Squat",
  module: "strength",
  primaryAdaptation: "maximum_strength",
  // "# Capability Mapping — Primary: Maximum Strength, Relative Strength" →
  // absolute_strength, relative_strength. "Secondary: Explosive Strength" →
  // explosive_strength. "Core Stability" → trunk_strength. "Postural
  // Control" → stability — present here but NOT in BACK_SQUAT's own
  // Capability Mapping (checked directly), the clearest single-field
  // distinction between the two exercises: the anterior-rack position
  // demands active postural/thoracic control that the back-rack position
  // does not document. "Movement Coordination" → coordination. "Force
  // Production" excluded, matching BACK_SQUAT's own comment. Unlike
  // BACK_SQUAT, no "Mechanical Robustness" capability is named anywhere in
  // this fiche (checked directly) — tissue_capacity is deliberately NOT
  // added, a second genuine divergence from BACK_SQUAT.
  physicalQualities: ["absolute_strength", "relative_strength", "explosive_strength", "trunk_strength", "stability", "coordination"],
  // "# Movement Pattern — Primary: Squat." → squat. "Secondary: Brace" →
  // isometric. "Hip Extension"/"Knee Extension"/"Thoracic Extension" are
  // joint-action-level detail already implied by `squat` and not separately
  // force-fitted.
  movementPatterns: ["squat", "isometric"],
  // "Secondary Force Vector: Minimal Horizontal" — same explicit "Minimal"
  // hedge as BACK_SQUAT, excluded for the same reason.
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "barbell" },
          { kind: "equipment", equipment: "rack" },
          { kind: "equipment", equipment: "plates" },
        ],
      },
    ],
  },
  // "# Skill Requirement: Intermediate. Adequate front rack mobility is
  // required." — same word, same mapping as BACK_SQUAT.
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Quadriceps, Gluteus Maximus,
  // Adductor Magnus" — identical primary-muscle list to BACK_SQUAT → thigh,
  // hip. The two exercises' real distinctions live in `physicalQualities`,
  // `contraindications` and Joint Profile below, not in this field — a
  // faithful reflection of the source documentation, not an oversight.
  bodyRegionsLoaded: ["thigh", "hip"],
  // "# Contraindications", quoted one item per source line — genuinely
  // different from BACK_SQUAT's own list (no knee/hip/lumbar items here;
  // wrist/shoulder/thoracic items instead), directly grounded in this
  // fiche's own distinct Joint Profile (see block comment above).
  contraindications: [
    { description: "Acute wrist injury.", region: "wrist", prohibitedPatterns: ["squat", "isometric"], absolute: true },
    { description: "Acute shoulder injury.", region: "shoulder", prohibitedPatterns: ["squat", "isometric"], absolute: true },
    { description: "Thoracic mobility restrictions.", region: "thoracic_spine", prohibitedPatterns: ["squat", "isometric"], absolute: true },
    { description: "Pain during squatting.", prohibitedPatterns: ["squat", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: High. Mechanical Fatigue:
    // High. Metabolic Fatigue: Moderate." "Slightly lower systemic fatigue
    // than the Back Squat" (explicit prose) corroborates High(4) < Very
    // High(5) here relative to BACK_SQUAT's own ratings. Same
    // muscular-shared connectiveTissue inference as BACK_SQUAT.
    types: ["neural", "muscular", "connective_tissue"],
    neural: 4,
    muscular: 4,
    connectiveTissue: 4, // inferred from "Mechanical Fatigue: High" — see BACK_SQUAT's own comment
    metabolic: 2,
    technical: 3, // fallback from "Skill Requirement: Intermediate"
  },
  // Same "★★★★★"/CAS Evidence Framework "Level 1 — Scientific consensus"
  // resolution as BACK_SQUAT — see that entry's own comment.
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star. Savate is
  // named in this table but has no `CombatSport` enum counterpart and is
  // omitted rather than force-mapped, matching BACK_SQUAT's own identical
  // exclusion.
  combatSportRelevance: {
    boxing: 3,
    kickboxing: 3,
    muay_thai: 3,
    wrestling: 5,
    brazilian_jiu_jitsu: 4,
    judo: 5,
    mma: 5,
    krav_maga: 4,
  },
  // "# Progressions"/"# Regressions"/"# Variations" name no exercise with
  // its own catalog id anywhere in this fiche (checked directly) — "Goblet
  // Squat", "Landmine Squat" and "Bodyweight Squat" have no dedicated
  // chapter/catalog id. Unlike BACK_SQUAT (which names "Front Squat" in its
  // own Progressions), this fiche does not name "Back Squat" anywhere — a
  // genuine, faithfully-preserved asymmetry between the two entries, not a
  // gap to "fix" by inventing a reciprocal reference.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Trap Bar Deadlift
// Source: 50-exercises/03_TRAP_BAR_DEADLIFT
// -----------------------------------------------------------------------------

/**
 * Third entry of this batch. `exercisePrescriptionRegistry.ts` has a
 * corroborating `trapBarDeadliftEntry` (`requiredEquipmentCapabilities:
 * ["trap_bar", "plates"]`, no `"rack"` and no `"barbell"` — matching this
 * entry's own equipment resolution exactly).
 *
 * Same documentation-format limitation as BACK_SQUAT: no space/floor-safety
 * language anywhere in this fiche (checked directly).
 *
 * Central business question, explicitly flagged before writing began: "#
 * Equipment Requirements — Required: Trap Bar, Weight Plates." names ONLY
 * the trap bar, never a standard barbell as an interchangeable alternative
 * — no `any_of` equipment clause is built here. A standard barbell is never
 * mentioned anywhere in this fiche (checked directly), so silently allowing
 * `barbell` as an equivalent would be exactly the kind of unjustified
 * equipment substitution this project's methodology forbids. `trap_bar` (a
 * real, existing `EquipmentType` value) is used as the sole required
 * implement, together with `plates`.
 *
 * "# Movement Pattern — Primary: Hinge. Secondary: Squat, Brace, Hip
 * Extension, Knee Extension, Loaded Carry Pattern." Both "Hinge" AND
 * "Squat" are explicitly named (the Philosophy section states directly:
 * "The Trap Bar Deadlift combines the advantages of a squat and a
 * deadlift"), so both `hinge` and `squat` are included — a genuine hybrid
 * pattern, not an either/or choice. "Loaded Carry Pattern" is also named
 * explicitly and literally as its own distinct secondary pattern (referring
 * to the brief farmer-hold-like position of the loaded handles at the sides
 * before/during the pull) — mapped directly to `carry`, honoring the
 * fiche's own explicit wording rather than omitting it because it reads
 * unusually for a deadlift. "Brace" → isometric.
 */
export const TRAP_BAR_DEADLIFT: ExerciseDefinition = {
  id: "trap_bar_deadlift",
  name: "Trap Bar Deadlift",
  module: "strength",
  primaryAdaptation: "maximum_strength",
  // "# Capability Mapping — Primary: Maximum Strength, Relative Strength,
  // Explosive Strength" → absolute_strength, relative_strength,
  // explosive_strength. "Secondary: Rate of Force Development" →
  // rate_of_force_development (exact match — the first entry in this batch
  // to earn this quality, reflecting this fiche's own explicit "explosive
  // power"/"acceleration" framing). "Acceleration" → acceleration (exact
  // match). "Core Stability" → trunk_strength. "Mechanical Robustness" →
  // tissue_capacity. "Power Production" has no distinct counterpart beyond
  // explosive_strength/rate_of_force_development already listed and is not
  // separately force-fitted.
  physicalQualities: ["absolute_strength", "relative_strength", "explosive_strength", "rate_of_force_development", "acceleration", "trunk_strength", "tissue_capacity"],
  movementPatterns: ["hinge", "squat", "isometric", "carry"],
  // "Secondary Force Vector: Minimal Horizontal" — same explicit "Minimal"
  // hedge as BACK_SQUAT/FRONT_SQUAT, excluded for the same reason.
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "trap_bar" },
          { kind: "equipment", equipment: "plates" },
        ],
      },
    ],
  },
  // "# Skill Requirement: Intermediate. Suitable for most athletes after
  // basic instruction." — same word, same mapping as BACK_SQUAT. Note this
  // fiche's own "Learning Curve: Short" and "Automaticity Potential: Very
  // High" (Neurological Profile) suggest an easier practical learning
  // experience than BACK_SQUAT/FRONT_SQUAT despite sharing the identical
  // "Intermediate" Skill Requirement word — not force-mapped to a lower
  // numeric level without a distinct Skill Requirement word to anchor it.
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Gluteus Maximus, Quadriceps,
  // Hamstrings, Adductor Magnus" → hip (gluteus maximus), thigh
  // (quadriceps, hamstrings, adductor magnus).
  bodyRegionsLoaded: ["hip", "thigh"],
  // "# Contraindications", quoted one item per source line.
  contraindications: [
    { description: "Acute lumbar injury.", region: "lumbar_spine", prohibitedPatterns: ["hinge", "squat", "isometric", "carry"], absolute: true },
    { description: "Acute hip injury.", region: "hip", prohibitedPatterns: ["hinge", "squat", "isometric", "carry"], absolute: true },
    { description: "Pain during pulling.", prohibitedPatterns: ["hinge", "squat", "isometric", "carry"], absolute: true },
    { description: "Insufficient hip mobility.", region: "hip", prohibitedPatterns: ["hinge", "squat", "isometric", "carry"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: High. Mechanical Fatigue:
    // Moderate to High. Metabolic Fatigue: Moderate." "Lower systemic
    // fatigue than conventional deadlifts at equivalent intensity"
    // (explicit prose) corroborates a lower rating than ROMANIAN_DEADLIFT's
    // own below. This fiche's own separate Biomechanical Profile heading
    // ("Mechanical Demand: Very High") is a within-set intensity
    // descriptor, distinct from and NOT conflated with this Fatigue
    // Profile's own "Mechanical Fatigue: Moderate to High" (a post-set
    // recovery-cost descriptor) — the two dimensions answer different
    // questions and are sourced independently throughout this batch.
    types: ["neural"],
    neural: 4,
    muscular: 3,
    connectiveTissue: 3, // inferred from "Mechanical Fatigue: Moderate to High"
    metabolic: 2,
    technical: 3, // fallback from "Skill Requirement: Intermediate"
  },
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star.
  combatSportRelevance: {
    boxing: 4,
    kickboxing: 4,
    muay_thai: 4,
    wrestling: 5,
    brazilian_jiu_jitsu: 4,
    judo: 5,
    mma: 5,
    krav_maga: 5,
  },
  // "# Progressions"/"# Regressions"/"# Variations" name no exercise with
  // its own catalog id anywhere in this fiche (checked directly) —
  // "Kettlebell Deadlift" is not `romanian_deadlift` (a different named
  // exercise, never called "Romanian Deadlift" in this fiche) and has no
  // dedicated chapter/catalog id of its own.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Romanian Deadlift
// Source: 50-exercises/04_ROMANIAN_DEADLIFT
// -----------------------------------------------------------------------------

/**
 * Fourth entry of this batch. `exercisePrescriptionRegistry.ts` has a
 * corroborating `romanianDeadliftEntry` (`requiredEquipmentCapabilities:
 * ["barbell", "plates"]`, no `"rack"` — matching this entry's own equipment
 * resolution exactly).
 *
 * Same documentation-format limitation as BACK_SQUAT: no space/floor-safety
 * language anywhere in this fiche (checked directly).
 *
 * "# Equipment Requirements — Required: Barbell, Weight Plates. Optional:
 * Dumbbells, Kettlebells, Straps, Belt." Dumbbells/Kettlebells are listed
 * only as OPTIONAL accessory items here, and the fiche's own "# Variations"
 * section separately names "Barbell"/"Dumbbell"/"Kettlebell" as distinct
 * named variations (matching AB_WHEEL's/PUSH_PRESS's own established
 * precedent that documented implement variations are separate exercises,
 * not an `any_of` equivalence group for this one) — required equipment
 * stays strictly `barbell` + `plates`, with no rack (never mentioned, not
 * even under Optional).
 */
export const ROMANIAN_DEADLIFT: ExerciseDefinition = {
  id: "romanian_deadlift",
  name: "Romanian Deadlift",
  module: "strength",
  primaryAdaptation: "maximum_strength",
  // "# Capability Mapping — Primary: Maximum Strength, Relative Strength,
  // Posterior Chain Strength" → absolute_strength, relative_strength.
  // "Posterior Chain Strength" is a body-region-specific strength
  // descriptor with no distinct PhysicalQuality counterpart of its own (no
  // "posterior_chain_strength" value exists) and is not force-fitted —
  // already substantively covered by `bodyRegionsLoaded` below. "Secondary:
  // Eccentric Strength" is a contraction-type-specific descriptor, not a
  // separate quality beyond the general strength values already listed,
  // and is not force-mapped either. "Core Stability" → trunk_strength.
  // "Movement Coordination" → coordination. "Injury Resilience" →
  // tissue_capacity (matching the "Mechanical Robustness" → tissue_capacity
  // precedent used throughout this batch — a close conceptual match for a
  // connective/tendon-capacity-flavoured quality). "Force Production"
  // excluded, matching the whole-batch convention.
  physicalQualities: ["absolute_strength", "relative_strength", "trunk_strength", "coordination", "tissue_capacity"],
  // "# Movement Pattern — Primary: Hinge. Secondary: Brace, Hip Extension,
  // Hip Flexion, Posterior Chain Loading." → hinge, isometric (from
  // Brace). "Hip Extension"/"Hip Flexion"/"Posterior Chain Loading" are
  // joint-action-level detail already implied by `hinge` and not separately
  // force-fitted. Unlike TRAP_BAR_DEADLIFT, no "Squat" or "Loaded Carry
  // Pattern" is named anywhere in this fiche (checked directly) — a
  // genuine, textually-grounded distinction between the two deadlift
  // variants: TRAP_BAR_DEADLIFT explicitly combines squat and hinge
  // mechanics with a carry-like load position; ROMANIAN_DEADLIFT is a pure
  // hip-hinge with the bar always in the hands, never positioned like a
  // farmer-carry implement.
  movementPatterns: ["hinge", "isometric"],
  // "# Biomechanical Profile — Primary Force Vector: Vertical." No
  // "Secondary Force Vector" heading exists in this fiche at all (checked
  // directly, unlike BACK_SQUAT/FRONT_SQUAT/TRAP_BAR_DEADLIFT's own
  // "Minimal Horizontal" secondary vector) — `forceVectors: ["vertical"]`
  // with no secondary value to consider.
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "barbell" },
          { kind: "equipment", equipment: "plates" },
        ],
      },
    ],
  },
  // "# Skill Requirement: Intermediate. Requires consistent hinge mechanics
  // before heavy loading." — same word, same mapping as BACK_SQUAT.
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Hamstrings, Gluteus Maximus,
  // Adductor Magnus" → thigh (hamstrings, adductor magnus), hip (gluteus
  // maximus).
  bodyRegionsLoaded: ["hip", "thigh"],
  // "# Contraindications", quoted one item per source line. "Acute
  // Hamstring Injury" is mapped to `thigh` — no dedicated "hamstring"
  // BodyRegion value exists, and `thigh` is the same region already used
  // for hamstring/quadriceps/adductor musculature throughout this batch's
  // own `bodyRegionsLoaded` mapping.
  contraindications: [
    { description: "Acute hamstring injury.", region: "thigh", prohibitedPatterns: ["hinge", "isometric"], absolute: true },
    { description: "Acute lumbar injury.", region: "lumbar_spine", prohibitedPatterns: ["hinge", "isometric"], absolute: true },
    { description: "Hip pain during hinging.", region: "hip", prohibitedPatterns: ["hinge", "isometric"], absolute: true },
    { description: "Poor hinge mechanics.", prohibitedPatterns: ["hinge", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Moderate. Mechanical
    // Fatigue: High. Metabolic Fatigue: Moderate." "High local fatigue in
    // the hamstrings" (explicit prose) corroborates the elevated
    // `muscular`/`connectiveTissue` ratings despite a comparatively low
    // `neural` rating — the clearest fatigue-profile distinction in this
    // batch between a neurally-demanding lift (TRAP_BAR_DEADLIFT, BACK_SQUAT)
    // and a locally/eccentrically-demanding one (this entry).
    types: ["muscular", "connective_tissue"],
    neural: 2,
    muscular: 4,
    connectiveTissue: 4, // inferred from "Mechanical Fatigue: High"
    metabolic: 2,
    technical: 3, // fallback from "Skill Requirement: Intermediate"
  },
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star.
  combatSportRelevance: {
    boxing: 4,
    kickboxing: 4,
    muay_thai: 4,
    wrestling: 5,
    brazilian_jiu_jitsu: 4,
    judo: 5,
    mma: 5,
    krav_maga: 5,
  },
  // "# Progressions"/"# Regressions"/"# Variations" name no exercise with
  // its own catalog id anywhere in this fiche (checked directly).
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Hip Thrust
// Source: 50-exercises/05_HIP_THRUST
// -----------------------------------------------------------------------------

/**
 * Fifth entry of this batch. `exercisePrescriptionRegistry.ts` has a
 * corroborating `hipThrustEntry` (`requiredEquipmentCapabilities: ["barbell",
 * "bench", "plates"]` — matching this entry's own equipment resolution
 * exactly; `role: "accessory"`, not `"primary"` — a registry-layer
 * distinction that does not itself change this entry's own
 * `ExerciseDefinition` fields, which have no `role` concept).
 *
 * Same documentation-format limitation as BACK_SQUAT: no space/floor-safety
 * language anywhere in this fiche (checked directly).
 *
 * "# Equipment Requirements — Required: Barbell, Bench, Weight Plates.
 * Optional: Resistance Bands, Hip Pad, Smith Machine." "Hip Pad" — the
 * central business question flagged before writing began for this
 * specific exercise — is explicitly listed under OPTIONAL, never Required:
 * comfort/protection for the bar-on-hips contact point, not a documented
 * eligibility gate. No `knee_protection_pad`-style dorsal/hip-contact
 * capability is invented for it, matching the same
 * comfort-vs-safety-required distinction already applied to AB_WHEEL's own
 * "kneel on a pad if required for comfort" and DEAD_BUG's/HOLLOW_BODY_HOLD's
 * optional exercise mats. "Smith Machine" is also Optional/a named
 * "Variation", not an equivalent required implement — no `any_of` is built.
 */
export const HIP_THRUST: ExerciseDefinition = {
  id: "hip_thrust",
  name: "Hip Thrust",
  module: "strength",
  primaryAdaptation: "maximum_strength",
  // "# Capability Mapping — Primary: Maximum Strength, Relative Strength,
  // Explosive Hip Power" → absolute_strength, relative_strength,
  // explosive_strength ("Explosive Hip Power" is a region-flavoured naming
  // of the same underlying quality, folded into the generic value the same
  // way FARMER_CARRY's own "Support-Grip Strength" folded into
  // grip_strength). "Secondary: Rate of Force Development" →
  // rate_of_force_development. "Acceleration" → acceleration. "Posterior
  // Chain Strength" excluded, matching ROMANIAN_DEADLIFT's own identical
  // exclusion. "Core Stability" → trunk_strength. "Mechanical Robustness" →
  // tissue_capacity.
  physicalQualities: ["absolute_strength", "relative_strength", "explosive_strength", "rate_of_force_development", "acceleration", "trunk_strength", "tissue_capacity"],
  // "# Movement Pattern — Primary: Hip Hinge, Hip Extension. Secondary:
  // Brace, Posterior Chain Loading." → hinge (from "Hip Hinge"; "Hip
  // Extension" is the hinge's own concentric action and is not a second,
  // distinct MovementPattern value), isometric (from Brace).
  movementPatterns: ["hinge", "isometric"],
  // "# Biomechanical Profile — Primary Force Vector: Horizontal. Secondary
  // Force Vector: Vertical." The ONLY entry in this batch whose PRIMARY
  // force vector is horizontal, not vertical — every squat and deadlift
  // variant above documents a vertical primary vector; this exercise's own
  // "Transfer of Force: Feet → Hips → Barbell" describes horizontal
  // pelvic drive, not a vertical bar path. Unlike the "Minimal Horizontal"
  // hedge used elsewhere in this batch, this fiche's own secondary vector
  // ("Vertical") carries no hedging qualifier, so both vectors are kept.
  forceVectors: ["horizontal", "vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "barbell" },
          { kind: "equipment", equipment: "bench" },
          { kind: "equipment", equipment: "plates" },
        ],
      },
    ],
  },
  // "# Skill Requirement: Beginner. Suitable after basic instruction." — the
  // ONLY entry in this batch whose Skill Requirement word is "Beginner"
  // rather than "Intermediate", corroborated by "# Athlete Suitability —
  // Suitable For: Beginners, Intermediate, Advanced, Elite" listing
  // Beginners without any qualifying caveat (unlike BACK_SQUAT's own
  // "Beginners (after instruction)" or ROMANIAN_DEADLIFT's own "Beginners
  // after hinge pattern acquisition"). Mapped to minimumTechnicalLevel 1 /
  // "low", matching this catalog's established Beginner → 1/"low" pairing.
  minimumTechnicalLevel: 1,
  complexity: "low",
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Gluteus Maximus" — the ONLY
  // single-region primary-muscle profile in this batch (every squat/
  // deadlift variant lists at least Quadriceps/Hamstrings alongside
  // Gluteus Maximus) → hip only. Secondary Muscles (Hamstrings, Adductor
  // Magnus, Quadriceps) are excluded, matching this batch's established
  // primary-muscles-only discipline — this exercise's own Purpose section
  // explicitly frames it as isolating "one of the most important movement
  // functions... powerful hip extension" rather than a multi-joint
  // compound lift, directly corroborating the narrower primary-muscle list.
  bodyRegionsLoaded: ["hip"],
  // "# Contraindications", quoted one item per source line — the shortest
  // contraindication list in this batch (3 items), matching this fiche's
  // own "Overall Risk: Low" Safety Profile rating (the lowest risk rating
  // documented anywhere in this batch).
  contraindications: [
    { description: "Acute hip injury.", region: "hip", prohibitedPatterns: ["hinge", "isometric"], absolute: true },
    { description: "Acute lumbar injury.", region: "lumbar_spine", prohibitedPatterns: ["hinge", "isometric"], absolute: true },
    { description: "Pain during hip extension.", region: "hip", prohibitedPatterns: ["hinge", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Moderate. Mechanical
    // Fatigue: Moderate. Metabolic Fatigue: Moderate. Overall Fatigue Cost:
    // Moderate. Produces a favorable stimulus-to-fatigue ratio." The ONLY
    // entry in this batch with a flat "Moderate" rating across every
    // Fatigue Profile dimension and no dimension reaching the ≥4 "High"
    // threshold used elsewhere in this batch to populate `types` — `types`
    // is therefore genuinely empty here, the most honest representation of
    // this fiche's own explicitly "favorable stimulus-to-fatigue ratio"
    // framing (directly corroborated by "# Recovery Profile — Typical
    // Recovery: 24-48 hours", the shortest recovery window in this batch).
    types: [],
    neural: 2,
    muscular: 2,
    connectiveTissue: 2, // inferred from "Mechanical Fatigue: Moderate"
    metabolic: 2,
    technical: 1, // fallback from "Skill Requirement: Beginner" (minimumTechnicalLevel 1)
  },
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star.
  combatSportRelevance: {
    boxing: 4,
    kickboxing: 5,
    muay_thai: 5,
    wrestling: 5,
    brazilian_jiu_jitsu: 4,
    judo: 5,
    mma: 5,
    krav_maga: 5,
  },
  // "# Progressions"/"# Regressions"/"# Variations" name no exercise with
  // its own catalog id anywhere in this fiche (checked directly) — "Glute
  // Bridge" has no dedicated chapter/catalog id.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Bulgarian Split Squat
// Source: 50-exercises/06_BULGARIAN_SPLIT_SQUAT
// -----------------------------------------------------------------------------

/**
 * Sixth and final entry of this batch. `exercisePrescriptionRegistry.ts`
 * has a corroborating `bulgarianSplitSquatEntry`
 * (`requiredEquipmentCapabilities: ["bench"]` only — matching this entry's
 * own equipment resolution exactly; `laterality: "unilateral"`,
 * `supportedLoadingModes: ["bodyweight", "added_external_load"]`,
 * corroborating that the bodyweight-only variation is genuinely valid).
 *
 * Same documentation-format limitation as BACK_SQUAT: no space/floor-safety
 * language anywhere in this fiche (checked directly).
 *
 * Central business question, explicitly flagged before writing began: "#
 * Equipment Requirements — Required: Bench. Optional: Bodyweight,
 * Dumbbells, Kettlebells, Barbell, Safety Rack, Sandbag." Bench is the ONLY
 * required item; every loading implement is Optional, and "#
 * Regressions" separately names "Bodyweight Bulgarian Split Squat" as its
 * own explicitly valid variation — `requirements` therefore gates on
 * `bench` alone, never on any loading implement, honestly representing
 * that the bodyweight base movement is a fully valid, documented
 * execution of this exercise, not an under-specified edge case.
 */
export const BULGARIAN_SPLIT_SQUAT: ExerciseDefinition = {
  id: "bulgarian_split_squat",
  name: "Bulgarian Split Squat",
  module: "strength",
  primaryAdaptation: "maximum_strength",
  // "# Capability Mapping — Primary: Relative Strength, Unilateral
  // Strength, Dynamic Stability" → relative_strength, stability (from
  // "Dynamic Stability"). "Unilateral Strength" has no distinct
  // PhysicalQuality counterpart of its own — the unilateral nature of the
  // exercise is represented by the dedicated `unilateral: true` field
  // below, not force-mapped into a quality here (it would otherwise be
  // redundant with that boolean). "Secondary: Maximum Strength" →
  // absolute_strength. "Balance" → balance — the exact enum match, and the
  // FIRST use of this PhysicalQuality anywhere in this catalog: no
  // bilateral squat/deadlift/hip-hinge variant in this batch documents
  // "Balance" as a named capability, making this the clearest single-field
  // distinction between this entry and every bilateral exercise in this
  // batch. "Coordination" → coordination. "Mechanical Robustness" →
  // tissue_capacity. "Movement Control" has no distinct counterpart beyond
  // stability/coordination already listed and is not separately
  // force-fitted.
  physicalQualities: ["relative_strength", "absolute_strength", "stability", "balance", "coordination", "tissue_capacity"],
  // "# Movement Pattern — Primary: Split Squat." No dedicated
  // `MovementPattern` value exists for a split/staggered-stance squat —
  // `squat` is used as the closest existing match, with the unilateral,
  // split-stance character represented through `unilateral: true` and the
  // `balance`/`stability` qualities above rather than an invented
  // MovementPattern value. "Secondary: Hip Extension, Knee Extension,
  // Brace, Single-Leg Stability" → isometric (from Brace); "Single-Leg
  // Stability" is already captured via `unilateral`/`stability`/`balance`
  // and is not separately force-fitted into a MovementPattern value.
  movementPatterns: ["squat", "isometric"],
  // "Secondary Force Vector: Minimal Horizontal" — same explicit "Minimal"
  // hedge as BACK_SQUAT/FRONT_SQUAT/TRAP_BAR_DEADLIFT, excluded for the
  // same reason.
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [{ kind: "equipment", equipment: "bench" }],
      },
    ],
  },
  // "# Skill Requirement: Intermediate. Adequate balance and movement
  // control are required before heavy loading." — same word, same mapping
  // as BACK_SQUAT.
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // "unilateral lower-body compound exercise" (Purpose, explicit).
  // `exercisePrescriptionRegistry.ts`'s own independent `laterality:
  // "unilateral"` corroborates this directly.
  unilateral: true,
  // "# Muscular Profile — Primary Muscles: Quadriceps, Gluteus Maximus,
  // Adductor Magnus" → thigh, hip.
  bodyRegionsLoaded: ["thigh", "hip"],
  // "# Contraindications", quoted one item per source line.
  contraindications: [
    { description: "Acute knee injury.", region: "knee", prohibitedPatterns: ["squat", "isometric"], absolute: true },
    { description: "Acute hip injury.", region: "hip", prohibitedPatterns: ["squat", "isometric"], absolute: true },
    { description: "Severe balance deficits.", prohibitedPatterns: ["squat", "isometric"], absolute: true },
    { description: "Pain during single-leg loading.", prohibitedPatterns: ["squat", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Moderate. Mechanical
    // Fatigue: Moderate. Metabolic Fatigue: Moderate to High." "Produces
    // substantial local fatigue with relatively low systemic fatigue"
    // (explicit prose) is descriptive color commentary, not a distinct
    // numeric rating — the literal "Moderate"/"Moderate to High" words in
    // the dedicated Fatigue Profile heading are used as the primary
    // source, consistent with this batch's established
    // quote-before-prose discipline, rather than reading the prose as
    // overriding the explicit "Moderate" rating the way HOLLOW_BODY_HOLD's
    // own "Decision Summary" text was allowed to override its star rating
    // in the 62_CORE batch (no equivalent explicit override framing exists
    // here).
    types: [],
    neural: 2,
    muscular: 2,
    connectiveTissue: 2, // inferred from "Mechanical Fatigue: Moderate"
    metabolic: 3,
    technical: 3, // fallback from "Skill Requirement: Intermediate"
  },
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star — the highest
  // combat-sport relevance profile in this batch (5 stars across every
  // discipline except Brazilian Jiu-Jitsu), directly corroborated by this
  // fiche's own Philosophy section: "Combat rarely occurs with both feet
  // perfectly aligned."
  combatSportRelevance: {
    boxing: 5,
    kickboxing: 5,
    muay_thai: 5,
    wrestling: 5,
    brazilian_jiu_jitsu: 4,
    judo: 5,
    mma: 5,
    krav_maga: 5,
  },
  // "# Progressions"/"# Regressions"/"# Variations" name no exercise with
  // its own catalog id anywhere in this fiche (checked directly) — "Split
  // Squat", "Reverse Lunge" and "Static Lunge" have no dedicated
  // chapter/catalog id of their own.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Weighted Pull-Up
// Source: 50-exercises/09_WEIGHTED_PULL_UP
// -----------------------------------------------------------------------------

/**
 * First entry of the "Lot 2 — Tirages du haut du corps" batch, migrated
 * alongside PULL_UP/CHIN_UP/BARBELL_ROW/CHEST_SUPPORTED_ROW. Source is
 * another flat, standalone file under `50-exercises/` (same older
 * documentary layer as Lot 1's own six entries — no chapter folder). No
 * `exercisePrescriptionRegistry.ts` entry exists for `weighted_pull_up`
 * (confirmed by direct search) — a known limitation, documented here
 * without modifying that registry (the registry's own PULL_UP-adjacent
 * comment at "50-exercises/11_CHIN_UP" explicitly notes "The loaded variant
 * is a distinct, separately documented exercise (weighted_pull_up) — not
 * represented here", confirming this gap was already known, not newly
 * discovered).
 *
 * Same documentation-format limitation as every Lot 1 entry: no "Space
 * Requirement" heading and no surface-safety language anywhere in this
 * fiche (checked directly) — neither `sufficient_space` nor `floor_safe` is
 * added. This same gap recurs identically across all five entries in this
 * batch.
 *
 * KNOWN MODEL LIMITATION, flagged explicitly rather than silently
 * approximated: "# Equipment Requirements — Required: Pull-Up Bar, Dip
 * Belt, Weight Plates." Three separate required items, not two: `pull_up_bar`
 * (existing type, used directly) and `plates` (existing type, used
 * directly — "Weight Plates" is the load itself and maps honestly) are
 * genuine matches, but "Dip Belt" (the attachment device that suspends the
 * plates from the athlete's body) has no dedicated `EquipmentType` value.
 * The generic `dip_bars` value is NOT used as a stand-in — it names a
 * completely different physical object (a parallel-bar station for
 * performing Dips), and using it here would silently misrepresent this
 * fiche's own actual required implement, exactly the kind of approximation
 * this project's methodology forbids. `"other"` is used instead as the
 * flagged placeholder for the dip belt specifically, alongside `plates` as
 * the separately-required load — the same honest-escape-hatch pattern
 * already established for AB_WHEEL. "Optional — Weighted Vest, Chains,
 * Resistance Bands" and "# Variations — ... Weighted Vest" are documented
 * ALTERNATIVE loading mechanisms, but never promoted from Optional/
 * Variation to Required — no `any_of` is built between the dip belt and
 * the weighted vest, matching this catalog's established precedent that
 * documented "optional"/"variation" equipment never silently substitutes
 * for a Required item.
 */
export const WEIGHTED_PULL_UP: ExerciseDefinition = {
  id: "weighted_pull_up",
  name: "Weighted Pull-Up",
  module: "strength",
  // "# Primary Classification: Strength" (explicit).
  primaryAdaptation: "maximum_strength",
  // "# Capability Mapping — Primary: Relative Strength, Maximum Strength,
  // Grip Strength" → relative_strength, absolute_strength, grip_strength
  // (all exact matches). "Secondary: Core Stability" → trunk_strength.
  // "Scapular Stability" → stability. "Movement Coordination" →
  // coordination. "Mechanical Robustness" → tissue_capacity. "Upper-Body
  // Force Production" is generic, non-specific framing with no distinct
  // PhysicalQuality counterpart and is deliberately never force-mapped
  // anywhere in this batch — noted once here, applying uniformly below.
  physicalQualities: ["relative_strength", "absolute_strength", "grip_strength", "trunk_strength", "stability", "coordination", "tissue_capacity"],
  // "# Movement Pattern — Primary: Vertical Pull." → vertical_pull (exact
  // match). "Secondary: Scapular Depression, Shoulder Extension, Elbow
  // Flexion, Brace" → isometric (from Brace); the other three are
  // joint-action-level detail already implied by `vertical_pull` and are
  // not separately force-fitted — the grip type ("supinated"/"pronated"/
  // "neutral") is a technical cue represented nowhere in this model,
  // matching the user's own explicit instruction not to turn grip style
  // into a requirement.
  movementPatterns: ["vertical_pull", "isometric"],
  // "# Biomechanical Profile — Primary Force Vector: Vertical." No
  // "Secondary Force Vector" heading exists in this fiche.
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "pull_up_bar" },
          { kind: "equipment", equipment: "other" }, // flagged placeholder for "Dip Belt" — see block comment above
          { kind: "equipment", equipment: "plates" },
        ],
      },
    ],
  },
  // "# Skill Requirement: Intermediate. The athlete should first
  // demonstrate strict bodyweight pull-ups." — mapped to the same
  // minimumTechnicalLevel 3 / "moderate" pairing used throughout this
  // catalog for that exact word.
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // "Bilateral" (Movement Context, explicit).
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Latissimus Dorsi, Biceps
  // Brachii, Teres Major" → shoulder (latissimus dorsi, teres major —
  // both shoulder-girdle musculature), upper_arm (biceps brachii, an
  // elbow flexor). Secondary Muscles (Posterior Deltoid, Brachialis,
  // Brachioradialis, Lower Trapezius) and Stabilizers are excluded,
  // matching this catalog's established primary-muscles-only discipline.
  bodyRegionsLoaded: ["shoulder", "upper_arm"],
  // "# Contraindications", quoted one item per source line — this file's
  // format has a single flat list, treated as the hard-exclusion tier,
  // matching the convention already established throughout Lot 1.
  contraindications: [
    { description: "Acute shoulder injury.", region: "shoulder", prohibitedPatterns: ["vertical_pull", "isometric"], absolute: true },
    { description: "Acute elbow injury.", region: "elbow", prohibitedPatterns: ["vertical_pull", "isometric"], absolute: true },
    { description: "Acute wrist injury.", region: "wrist", prohibitedPatterns: ["vertical_pull", "isometric"], absolute: true },
    { description: "Pain during vertical pulling.", prohibitedPatterns: ["vertical_pull", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: High. Mechanical
    // Fatigue: Moderate. Metabolic Fatigue: Moderate." mapped via the same
    // Low=1/Moderate=2/Moderate-to-High=3/High=4/Very-High=5 word scale
    // established in Lot 1 (this file's format uses qualitative words, not
    // 62_CORE's X/5 numbers). "Neuromuscular Fatigue" → neural.
    // "Mechanical Fatigue" → muscular, also used as the shared source for
    // `connectiveTissue` (no distinct "Connective-Tissue Fatigue" heading
    // exists in this format, matching the identical Lot 1 limitation) —
    // flagged as an inference, applying identically across this batch.
    // "Produces a very high strength stimulus with relatively low
    // systemic fatigue" (explicit prose) corroborates a moderate, not
    // maximal, overall cost despite the elevated neural rating.
    types: ["neural"],
    neural: 4,
    muscular: 2,
    connectiveTissue: 2, // inferred from "Mechanical Fatigue: Moderate"
    metabolic: 2,
    technical: 3, // fallback from "Skill Requirement: Intermediate" (minimumTechnicalLevel 3)
  },
  // "# Scientific Evidence — Evidence Level: ★★★★★. Weighted Pull-Ups
  // demonstrate strong evidence..." — mapped to the CAS Evidence
  // Framework's "Level 1 — Scientific consensus" (20-engine/
  // 02_EXERCISE_KNOWLEDGE_BASE.md), matching every Lot 1 entry's own
  // identical resolution of this exact star-rating/prose pattern.
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star. Savate is
  // named in this table but has no `CombatSport` enum counterpart and is
  // omitted rather than force-mapped, matching the established precedent.
  combatSportRelevance: {
    boxing: 3,
    kickboxing: 3,
    muay_thai: 3,
    wrestling: 5,
    brazilian_jiu_jitsu: 5,
    judo: 5,
    mma: 5,
    krav_maga: 5,
  },
  // "# Regressions" names "Bodyweight Pull-Up" → pull_up (integrated in
  // this same batch, real catalog id — the plain-bodyweight base movement
  // this exercise adds external load to). "Band-Assisted Pull-Up", "Ring
  // Row" and "Lat Pulldown" name no exercise with its own chapter/catalog
  // id. No dedicated "Substitution Logic" section exists in this file's
  // format — Progressions/Regressions/Variations are used as the
  // substitute source instead, matching the sourcing-convention
  // established in Lot 1.
  substitutionExerciseIds: ["pull_up"],
};

// -----------------------------------------------------------------------------
// Pull-Up
// Source: 50-exercises/10_PULL_UP
// -----------------------------------------------------------------------------

/**
 * Second entry of this batch. `exercisePrescriptionRegistry.ts` has a
 * corroborating `pullUpEntry` (`requiredEquipmentCapabilities:
 * ["pull_up_bar"]` only, `supportedLoadingModes: ["bodyweight"]`,
 * `laterality: "bilateral"` — matching this entry's own equipment
 * resolution and confirming no external load is claimed).
 *
 * Same documentation-format limitation as every entry in this batch: no
 * space/floor-safety language anywhere in this fiche (checked directly).
 *
 * Central business distinction from WEIGHTED_PULL_UP, explicitly flagged
 * before writing began: "# Equipment Requirements — Required: Pull-Up Bar.
 * Optional: Resistance Bands, Gymnastic Rings." No dip belt, no weight
 * plates — the base bodyweight movement genuinely requires only the bar
 * itself, honestly reflected by `requirements` gating on `pull_up_bar`
 * alone.
 */
export const PULL_UP: ExerciseDefinition = {
  id: "pull_up",
  name: "Pull-Up",
  module: "strength",
  primaryAdaptation: "maximum_strength",
  // "# Capability Mapping — Primary: Relative Strength, Grip Strength,
  // Upper-Body Strength" → relative_strength, grip_strength,
  // absolute_strength ("Upper-Body Strength" folded into the closest
  // generic quality, matching this batch's established convention).
  // "Secondary: Core Stability" → trunk_strength. "Movement Coordination"
  // → coordination. "Scapular Stability" → stability. "Mechanical
  // Robustness" → tissue_capacity. The resulting set is identical in
  // content to WEIGHTED_PULL_UP's own (both entries document the same
  // underlying movement, loaded vs. unloaded) — a faithful reflection of
  // the two fiches' near-identical Capability Mapping sections, not a
  // copy-paste error.
  physicalQualities: ["relative_strength", "grip_strength", "absolute_strength", "trunk_strength", "coordination", "stability", "tissue_capacity"],
  // "# Movement Pattern — Primary: Vertical Pull." → vertical_pull.
  // "Secondary: Scapular Depression, Shoulder Extension, Elbow Flexion,
  // Brace" → isometric (from Brace only).
  movementPatterns: ["vertical_pull", "isometric"],
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [{ kind: "equipment", equipment: "pull_up_bar" }],
      },
    ],
  },
  // "# Skill Requirement: Beginner to Intermediate. The Pull-Up is often
  // used as a progression target for novice athletes." A genuine hedge
  // between two named words (Beginner=1, Intermediate=3 elsewhere in this
  // batch) — mapped to the midpoint, minimumTechnicalLevel 2, which this
  // catalog's own established convention (see 62_CORE's MED_BALL_SCOOP_TOSS
  // comment) resolves to `complexity: "moderate"`, not "low" — level 2 is
  // reserved for "low" only when the fiche's own word is a plain, unhedged
  // "Low"/"Beginner", which this one is not.
  minimumTechnicalLevel: 2,
  complexity: "moderate",
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Latissimus Dorsi, Biceps
  // Brachii, Teres Major" — identical primary-muscle list to
  // WEIGHTED_PULL_UP → shoulder, upper_arm.
  bodyRegionsLoaded: ["shoulder", "upper_arm"],
  // "# Contraindications", quoted one item per source line — identical
  // list to WEIGHTED_PULL_UP, a faithful reflection of the two fiches'
  // identical Contraindications sections.
  contraindications: [
    { description: "Acute shoulder injury.", region: "shoulder", prohibitedPatterns: ["vertical_pull", "isometric"], absolute: true },
    { description: "Acute elbow injury.", region: "elbow", prohibitedPatterns: ["vertical_pull", "isometric"], absolute: true },
    { description: "Acute wrist injury.", region: "wrist", prohibitedPatterns: ["vertical_pull", "isometric"], absolute: true },
    { description: "Pain during vertical pulling.", prohibitedPatterns: ["vertical_pull", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Moderate. Mechanical
    // Fatigue: Moderate. Metabolic Fatigue: Moderate." A flat "Moderate"
    // across every dimension — genuinely lower than WEIGHTED_PULL_UP's own
    // "Neuromuscular Fatigue: High", the clearest fatigue-profile
    // distinction between the loaded and unloaded variant in this batch.
    types: [],
    neural: 2,
    muscular: 2,
    connectiveTissue: 2, // inferred from "Mechanical Fatigue: Moderate"
    metabolic: 2,
    technical: 2, // fallback from "Skill Requirement: Beginner to Intermediate" (minimumTechnicalLevel 2)
  },
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star — identical
  // to WEIGHTED_PULL_UP's own table.
  combatSportRelevance: {
    boxing: 3,
    kickboxing: 3,
    muay_thai: 3,
    wrestling: 5,
    brazilian_jiu_jitsu: 5,
    judo: 5,
    mma: 5,
    krav_maga: 5,
  },
  // "# Progressions" names "Weighted Pull-Up" → weighted_pull_up
  // (integrated in this same batch) — the reciprocal reference to
  // WEIGHTED_PULL_UP's own "Bodyweight Pull-Up" substitution, a genuinely
  // symmetric cross-reference between these two entries (unlike some
  // asymmetric cases already documented elsewhere in this catalog).
  // "Band-Assisted Pull-Up", "Ring Row" and "Lat Pulldown" name no
  // exercise with its own chapter/catalog id.
  substitutionExerciseIds: ["weighted_pull_up"],
};

// -----------------------------------------------------------------------------
// Chin-Up
// Source: 50-exercises/11_CHIN_UP
// -----------------------------------------------------------------------------

/**
 * Third entry of this batch. `exercisePrescriptionRegistry.ts` has a
 * corroborating `chinUpEntry` (`requiredEquipmentCapabilities:
 * ["pull_up_bar"]` only, `supportedLoadingModes: ["bodyweight"]` — matching
 * this entry's own resolution exactly; the registry's own comment on this
 * exercise explicitly notes "The loaded variant is a distinct, separately
 * documented exercise (weighted_pull_up) — not represented here",
 * corroborating that no loaded chin-up entry is expected in this batch).
 *
 * Same documentation-format limitation as every entry in this batch: no
 * space/floor-safety language anywhere in this fiche (checked directly).
 *
 * Central business distinction from PULL_UP, explicitly flagged before
 * writing began: "# Muscular Profile — Primary Muscles: Latissimus Dorsi,
 * Biceps Brachii, Brachialis" — Brachialis (a pure elbow flexor) replaces
 * PULL_UP's own "Teres Major" (a shoulder-girdle muscle) in the PRIMARY
 * tier, directly grounding this fiche's own explicit "# Capability Mapping
 * — Secondary: ... Elbow Flexor Strength" entry (absent from PULL_UP's own
 * Capability Mapping). No distinct `PhysicalQuality` value exists for
 * "elbow flexor strength" specifically — it is not force-fitted into
 * `absolute_strength` a second time (already listed) or into any other
 * value. This is a genuine, real capability the fiche documents that this
 * model's PhysicalQuality granularity cannot represent as its own field;
 * the underlying muscle shift is preserved faithfully in the sourcing
 * comment here, even though it does NOT change the resulting
 * `bodyRegionsLoaded` SET (`teres_major`→shoulder and `brachialis`→
 * upper_arm both land in regions PULL_UP already reports, since PULL_UP's
 * own primary list already includes upper_arm via Biceps Brachii) — an
 * honest, flagged granularity limit of the BodyRegion model, not an
 * oversight.
 *
 * "# Skill Requirement: Beginner. Often easier to master than the Pull-Up
 * due to increased contribution from the elbow flexors." — this is the
 * ONLY entry among the three vertical-pull exercises in this batch with a
 * plain, unhedged "Beginner" Skill Requirement (PULL_UP itself is hedged
 * as "Beginner to Intermediate", WEIGHTED_PULL_UP is "Intermediate") —
 * directly, explicitly corroborated by this fiche's own prose, not an
 * inferred ordering.
 */
export const CHIN_UP: ExerciseDefinition = {
  id: "chin_up",
  name: "Chin-Up",
  module: "strength",
  primaryAdaptation: "maximum_strength",
  // "# Capability Mapping — Primary: Relative Strength, Grip Strength,
  // Upper-Body Strength" → relative_strength, grip_strength,
  // absolute_strength. "Secondary: Core Stability" → trunk_strength.
  // "Movement Coordination" → coordination. "Scapular Stability" →
  // stability. "Mechanical Robustness" → tissue_capacity. "Elbow Flexor
  // Strength" excluded — see block comment above for the full reasoning.
  physicalQualities: ["relative_strength", "grip_strength", "absolute_strength", "trunk_strength", "coordination", "stability", "tissue_capacity"],
  // "# Movement Pattern — Primary: Vertical Pull." → vertical_pull.
  // "Secondary: Scapular Depression, Shoulder Extension, Elbow Flexion,
  // Brace" → isometric (from Brace only) — identical resolution to
  // PULL_UP/WEIGHTED_PULL_UP; the supinated grip is a technical execution
  // detail, not a distinct MovementPattern value, matching the user's own
  // explicit instruction not to turn grip type into a requirement.
  movementPatterns: ["vertical_pull", "isometric"],
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [{ kind: "equipment", equipment: "pull_up_bar" }],
      },
    ],
  },
  // "# Skill Requirement: Beginner." — the plain, unhedged word, mapped to
  // minimumTechnicalLevel 1 / "low" — see block comment above for why this
  // is genuinely lower than PULL_UP's own hedged "Beginner to
  // Intermediate" (level 2).
  minimumTechnicalLevel: 1,
  complexity: "low",
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Latissimus Dorsi, Biceps
  // Brachii, Brachialis" → shoulder (latissimus dorsi), upper_arm (biceps
  // brachii, brachialis — both elbow flexors). The resulting region SET
  // is identical to PULL_UP's own (["shoulder", "upper_arm"]) despite the
  // different underlying muscle composition — see block comment above.
  bodyRegionsLoaded: ["shoulder", "upper_arm"],
  // "# Contraindications", quoted one item per source line — identical
  // list to PULL_UP/WEIGHTED_PULL_UP.
  contraindications: [
    { description: "Acute shoulder injury.", region: "shoulder", prohibitedPatterns: ["vertical_pull", "isometric"], absolute: true },
    { description: "Acute elbow injury.", region: "elbow", prohibitedPatterns: ["vertical_pull", "isometric"], absolute: true },
    { description: "Acute wrist injury.", region: "wrist", prohibitedPatterns: ["vertical_pull", "isometric"], absolute: true },
    { description: "Pain during vertical pulling.", prohibitedPatterns: ["vertical_pull", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Moderate. Mechanical
    // Fatigue: Moderate. Metabolic Fatigue: Moderate." — identical ratings
    // to PULL_UP's own Fatigue Profile.
    types: [],
    neural: 2,
    muscular: 2,
    connectiveTissue: 2, // inferred from "Mechanical Fatigue: Moderate"
    metabolic: 2,
    technical: 1, // fallback from "Skill Requirement: Beginner" (minimumTechnicalLevel 1)
  },
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star — identical
  // to PULL_UP's/WEIGHTED_PULL_UP's own table.
  combatSportRelevance: {
    boxing: 3,
    kickboxing: 3,
    muay_thai: 3,
    wrestling: 5,
    brazilian_jiu_jitsu: 5,
    judo: 5,
    mma: 5,
    krav_maga: 5,
  },
  // "# Progressions" names "Weighted Chin-Up" — a distinct exercise name
  // from "Weighted Pull-Up" (this fiche's own name is "Chin-Up", never
  // "Pull-Up"), and no dedicated "weighted_chin_up" fiche/catalog id
  // exists anywhere in this repository — NOT resolved to
  // `weighted_pull_up`, unlike DEAD_BUG's own "Dead Bug With Asymmetric
  // Resistance" resolution in 62_CORE (that case modified the SAME base
  // name; this one names a genuinely different exercise). "# Regressions"
  // (Band-Assisted Chin-Up, Ring Row, Lat Pulldown, Suspension Row) name
  // no exercise with its own catalog id either. Despite this fiche's own
  // Purpose/Philosophy prose repeatedly comparing itself to "the Pull-Up"
  // ("Compared with the Pull-Up...", "more than an easier Pull-Up"), no
  // Progressions/Regressions/Variations entry formally names it as a
  // substitute — prose commentary is not treated as a substitution
  // source, matching this batch's own quote-from-structured-sections-only
  // discipline. `substitutionExerciseIds` is genuinely empty for this
  // entry.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Barbell Row
// Source: 50-exercises/12_BARBELL_ROW
// -----------------------------------------------------------------------------

/**
 * Fourth entry of this batch. `exercisePrescriptionRegistry.ts` has a
 * corroborating `barbellRowEntry` (`requiredEquipmentCapabilities:
 * ["barbell", "plates"]` — no `"rack"` — matching this entry's own
 * equipment resolution exactly; the registry's own comment states
 * explicitly "no rack — lifted from the floor").
 *
 * Same documentation-format limitation as every entry in this batch: no
 * space/floor-safety language anywhere in this fiche (checked directly).
 *
 * "# Equipment Requirements — Required: Barbell, Weight Plates. Optional:
 * Lifting Straps, Blocks, Rack." Rack is explicitly Optional, never
 * Required — the bar is lifted directly from the floor for each
 * repetition (this fiche's own "# Movement Context: Standing" and
 * "Transfer of Force: Ground → Legs → Core → Scapula → Arms → Barbell"
 * both describe a floor-to-hip-hinge setup, never a rack-supported one) —
 * `rack` is deliberately NOT added to `requirements`.
 *
 * Central business question for this entry, explicitly flagged before
 * writing began: hip hinge and trunk stabilization are genuine
 * biomechanical characteristics of this movement — represented entirely
 * through `movementPatterns` (`hinge`, `isometric`) and `physicalQualities`
 * (`trunk_strength`), never as an equipment or environment requirement.
 */
export const BARBELL_ROW: ExerciseDefinition = {
  id: "barbell_row",
  name: "Barbell Row",
  module: "strength",
  primaryAdaptation: "maximum_strength",
  // "# Capability Mapping — Primary: Maximum Strength, Relative Strength,
  // Upper-Body Pulling Strength" → absolute_strength, relative_strength
  // ("Upper-Body Pulling Strength" is a redundant restatement of "Maximum
  // Strength" already mapped to absolute_strength and is not
  // double-counted). "Secondary: Core Stability" → trunk_strength. "Grip
  // Strength" → grip_strength (exact match — a genuine, real grip demand
  // from holding a loaded barbell through the full pulling range).
  // "Postural Endurance" → stability (matching FARMER_CARRY's own
  // identical "Postural Endurance" → stability precedent). "Movement
  // Coordination" → coordination. "Mechanical Robustness" →
  // tissue_capacity.
  physicalQualities: ["absolute_strength", "relative_strength", "trunk_strength", "grip_strength", "stability", "coordination", "tissue_capacity"],
  // "# Movement Pattern — Primary: Horizontal Pull." → horizontal_pull
  // (exact match). "Secondary: Hip Hinge, Brace, Scapular Retraction,
  // Shoulder Extension" → hinge (from "Hip Hinge", explicitly named as its
  // own distinct secondary pattern — the hip-hinge setup and continuous
  // trunk-stabilization demand under a horizontally-pulled load, not
  // force-fitted as an equipment requirement per the user's own explicit
  // instruction), isometric (from Brace).
  movementPatterns: ["horizontal_pull", "hinge", "isometric"],
  // "# Biomechanical Profile — Primary Force Vector: Horizontal. Secondary
  // Force Vector: Vertical Stabilization." Unlike Lot 1's own "Minimal
  // Horizontal" hedge, this secondary vector carries no hedging qualifier
  // — both vectors are kept.
  forceVectors: ["horizontal", "vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "barbell" },
          { kind: "equipment", equipment: "plates" },
        ],
      },
    ],
  },
  // "# Skill Requirement: Intermediate. Requires consistent hip hinge
  // mechanics and trunk stability."
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Latissimus Dorsi, Middle
  // Trapezius, Rhomboids, Posterior Deltoid" — all shoulder-girdle
  // musculature → shoulder only. Secondary Muscles (Biceps Brachii,
  // Brachialis, Teres Major) and Stabilizers are excluded, matching this
  // batch's established primary-muscles-only discipline.
  bodyRegionsLoaded: ["shoulder"],
  // "# Contraindications", quoted one item per source line. "Acute Lumbar
  // Injury" and "Poor Hip Hinge Mechanics" are the direct textual grounding
  // for this exercise's real lumbar-spine demand under the hip-hinge
  // position — CHEST_SUPPORTED_ROW's own Contraindications list documents
  // neither, the clearest single-field business distinction between the
  // two row variants in this batch (see that entry's own comment below).
  contraindications: [
    { description: "Acute lumbar injury.", region: "lumbar_spine", prohibitedPatterns: ["horizontal_pull", "hinge", "isometric"], absolute: true },
    { description: "Acute shoulder injury.", region: "shoulder", prohibitedPatterns: ["horizontal_pull", "hinge", "isometric"], absolute: true },
    { description: "Pain during horizontal pulling.", prohibitedPatterns: ["horizontal_pull", "hinge", "isometric"], absolute: true },
    { description: "Poor hip hinge mechanics.", prohibitedPatterns: ["horizontal_pull", "hinge", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: High. Mechanical
    // Fatigue: Moderate. Metabolic Fatigue: Moderate." Same
    // muscular-shared connectiveTissue inference established throughout
    // this batch.
    types: ["neural"],
    neural: 4,
    muscular: 2,
    connectiveTissue: 2, // inferred from "Mechanical Fatigue: Moderate"
    metabolic: 2,
    technical: 3, // fallback from "Skill Requirement: Intermediate"
  },
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star. Savate is
  // named in this table but has no `CombatSport` enum counterpart and is
  // omitted rather than force-mapped.
  combatSportRelevance: {
    boxing: 4,
    kickboxing: 4,
    muay_thai: 4,
    wrestling: 5,
    brazilian_jiu_jitsu: 5,
    judo: 5,
    mma: 5,
    krav_maga: 5,
  },
  // "# Regressions" and "# Variations" both name "Chest-Supported Row" →
  // chest_supported_row (integrated in this same batch, real catalog id).
  // "Seal Row", "Resistance Band Row" and "Suspension Row" name no
  // exercise with its own chapter/catalog id.
  substitutionExerciseIds: ["chest_supported_row"],
};

// -----------------------------------------------------------------------------
// Chest-Supported Row
// Source: 50-exercises/13_CHEST_SUPPORTED_ROW
// -----------------------------------------------------------------------------

/**
 * Fifth and final entry of this batch. No `exercisePrescriptionRegistry.ts`
 * entry exists for `chest_supported_row` (confirmed by direct search) — a
 * known limitation, documented here without modifying that registry.
 *
 * Same documentation-format limitation as every entry in this batch: no
 * space/floor-safety language anywhere in this fiche (checked directly).
 *
 * Central business question for this entry, explicitly flagged before
 * writing began: "# Equipment Requirements — Required: Incline Bench,
 * Dumbbells or Barbell or Machine." Unlike every other equipment
 * alternative encountered so far in this catalog (always framed as
 * separate "Variations"/"Optional" items rather than literal "or" language
 * inside the Required section itself), this fiche's own Required heading
 * explicitly uses "or" between three named loading implements — the
 * textual permission the user's own task instructions required before
 * building an `any_of` here. "Incline Bench" maps to the existing generic
 * `bench` `EquipmentType` (the same honest-nearest-match resolution used
 * for HIP_THRUST's/BULGARIAN_SPLIT_SQUAT's own plain "Bench" requirement
 * in Lot 1 — no dedicated "incline_bench" value exists or is warranted).
 * "Dumbbells" and "Barbell" map directly to `dumbbell`/`barbell`.
 *
 * KNOWN MODEL LIMITATION, flagged explicitly rather than silently
 * approximated: the third alternative, "Machine", has no honest
 * `EquipmentType` match. "# Optional — Chest-Supported Row Machine, Cable
 * Machine" separately names TWO different specific machine types as
 * sub-examples of this same generic "Machine" alternative — neither
 * "chest-supported row machine" nor a bare "machine" concept has a
 * dedicated type, and using the existing `cable_machine` value alone would
 * incorrectly narrow "Machine" to only its cable-resistance sub-case,
 * excluding the dedicated chest-supported-row-machine sub-case this same
 * fiche also names. `"other"` is used as the flagged placeholder for this
 * third `any_of` alternative — the same honest-escape-hatch pattern
 * already established for AB_WHEEL/WEIGHTED_PULL_UP.
 *
 * "# Movement Pattern — Primary: Horizontal Pull. Secondary: Scapular
 * Retraction, Shoulder Extension, Elbow Flexion." No "Brace" is named
 * anywhere in this fiche's own Movement Pattern (checked directly, unlike
 * BARBELL_ROW's own explicit "Brace" secondary pattern) — the torso is
 * mechanically SUPPORTED by the bench, removing the trunk-bracing/
 * anti-extension demand a free-standing row requires. `isometric` is
 * therefore deliberately NOT added — the clearest single-field
 * distinction from BARBELL_ROW in this entire batch, directly corroborated
 * by this fiche's own "# Biomechanical Profile" (no "Secondary Force
 * Vector" heading at all, unlike BARBELL_ROW's own "Vertical
 * Stabilization"), "# Contraindications" (no lumbar-spine item at all,
 * unlike BARBELL_ROW's own "Acute Lumbar Injury"/"Poor Hip Hinge
 * Mechanics"), and explicit Purpose/Philosophy prose: "one of the safest
 * and most efficient exercises for developing upper-back strength while
 * minimizing spinal loading" / "Not every pulling exercise should
 * challenge trunk stability."
 */
export const CHEST_SUPPORTED_ROW: ExerciseDefinition = {
  id: "chest_supported_row",
  name: "Chest-Supported Row",
  module: "strength",
  primaryAdaptation: "maximum_strength",
  // "# Capability Mapping — Primary: Upper-Body Pulling Strength, Relative
  // Strength" → absolute_strength (folded, matching the whole batch's
  // established convention), relative_strength. "Secondary: Scapular
  // Stability" → stability. "Grip Strength" → grip_strength. "Movement
  // Coordination" → coordination. "Mechanical Robustness" →
  // tissue_capacity. "Postural Strength" has no distinct PhysicalQuality
  // counterpart beyond `stability` already listed via "Scapular
  // Stability" — NOT folded into `trunk_strength`, consistent with this
  // entry's own documented absence of any bracing/anti-extension movement
  // pattern (see block comment above): adding trunk_strength here would
  // contradict that finding.
  physicalQualities: ["absolute_strength", "relative_strength", "stability", "grip_strength", "coordination", "tissue_capacity"],
  // "# Movement Pattern — Primary: Horizontal Pull." → horizontal_pull.
  // "Secondary: Scapular Retraction, Shoulder Extension, Elbow Flexion" are
  // joint-action-level detail already implied by `horizontal_pull` — no
  // `isometric` value is added here; see block comment above for why this
  // is a deliberate, textually-grounded divergence from BARBELL_ROW.
  movementPatterns: ["horizontal_pull"],
  // "# Biomechanical Profile — Primary Force Vector: Horizontal." No
  // "Secondary Force Vector" heading exists in this fiche at all (unlike
  // BARBELL_ROW's own "Vertical Stabilization") — see block comment above.
  forceVectors: ["horizontal"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [{ kind: "equipment", equipment: "bench" }],
      },
      {
        kind: "any_of",
        items: [
          { kind: "equipment", equipment: "dumbbell" },
          { kind: "equipment", equipment: "barbell" },
          { kind: "equipment", equipment: "other" }, // flagged placeholder for "Machine" — see block comment above
        ],
      },
    ],
  },
  // "# Skill Requirement: Beginner. Suitable for athletes of all levels."
  // — the plain, unhedged word, matching CHIN_UP's own identical mapping.
  minimumTechnicalLevel: 1,
  complexity: "low",
  // "Bilateral" (Movement Context, explicit). "# Progressions — ...
  // Single-Arm Variation" and "# Variations — ... Single-Arm" name a
  // documented but non-default variation, not the base/default execution
  // — matching this catalog's established "variations aren't the base
  // form" discipline (the same resolution already applied to
  // FARMER_CARRY's own alternate-implement variations in an earlier
  // batch).
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Latissimus Dorsi, Middle
  // Trapezius, Rhomboids, Posterior Deltoid" — identical primary-muscle
  // list to BARBELL_ROW → shoulder only.
  bodyRegionsLoaded: ["shoulder"],
  // "# Contraindications", quoted one item per source line — the shortest
  // contraindication list in this batch (2 items), and notably contains NO
  // lumbar-spine item at all, unlike BARBELL_ROW's own 4-item list — see
  // block comment above.
  contraindications: [
    { description: "Acute shoulder injury.", region: "shoulder", prohibitedPatterns: ["horizontal_pull"], absolute: true },
    { description: "Pain during horizontal pulling.", prohibitedPatterns: ["horizontal_pull"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Moderate. Mechanical
    // Fatigue: Low. Metabolic Fatigue: Moderate." "One of the best
    // stimulus-to-fatigue ratios among rowing exercises" (explicit prose)
    // directly corroborates the lowest `muscular`/`connectiveTissue`
    // rating in this entire batch (Low=1, vs. BARBELL_ROW's own
    // Moderate=2) — the clearest fatigue-profile distinction between the
    // two row variants.
    types: [],
    neural: 2,
    muscular: 1,
    connectiveTissue: 1, // inferred from "Mechanical Fatigue: Low"
    metabolic: 2,
    technical: 1, // fallback from "Skill Requirement: Beginner"
  },
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star — identical
  // to BARBELL_ROW's own table.
  combatSportRelevance: {
    boxing: 4,
    kickboxing: 4,
    muay_thai: 4,
    wrestling: 5,
    brazilian_jiu_jitsu: 5,
    judo: 5,
    mma: 5,
    krav_maga: 5,
  },
  // "# Progressions"/"# Regressions"/"# Variations" name no exercise with
  // its own catalog id anywhere in this fiche (checked directly) —
  // "Resistance Band Row", "Machine Row" and "Cable Row" have no dedicated
  // chapter/catalog id. Despite BARBELL_ROW's own Regressions/Variations
  // naming "Chest-Supported Row" as its own substitute, this fiche never
  // names "Barbell Row" anywhere in its own Progressions/Regressions/
  // Variations sections (checked directly) — the same faithfully-preserved
  // one-directional asymmetry already documented elsewhere in this
  // catalog (e.g. FRONT_SQUAT/BACK_SQUAT in Lot 1), not a gap to "fix" by
  // inventing a reciprocal reference. `substitutionExerciseIds` is
  // genuinely empty for this entry.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Bench Press
// Source: 50-exercises/07_BENCH_PRESS
// -----------------------------------------------------------------------------

/**
 * First entry of the "Lot 3 — Poussées du haut du corps" batch, migrated
 * alongside OVERHEAD_PRESS/DIP/LANDMINE_PRESS. `exercisePrescriptionRegistry.ts`
 * has a corroborating `benchPressEntry` (`requiredEquipmentCapabilities:
 * ["barbell", "bench", "rack", "plates"]`, `laterality: "bilateral"` —
 * matching this entry's own equipment resolution exactly).
 *
 * Same documentation-format limitation as every entry migrated from this
 * older `50-exercises/` layer so far: no space/floor-safety language
 * anywhere in this fiche (checked directly) — neither `sufficient_space`
 * nor `floor_safe` is added.
 *
 * "# Safety Profile — Spotter Recommended: Yes. Safety Arms Recommended:
 * Yes." and "# Equipment Requirements — Optional: Safety Arms, Spotter,
 * Bands, Chains." Both are explicit RECOMMENDATIONS, never Required — no
 * `human_assistance: "partner"` clause is added for the spotter (the same
 * recommended-vs-required distinction already established for BACK_SQUAT's
 * own "Safety Arms Recommended: Yes" in Lot 1), and no safety-equipment
 * atom is added for safety arms either.
 */
export const BENCH_PRESS: ExerciseDefinition = {
  id: "bench_press",
  name: "Bench Press",
  module: "strength",
  // "# Primary Classification: Strength" (explicit).
  primaryAdaptation: "maximum_strength",
  // "# Capability Mapping — Primary: Maximum Strength, Relative Strength,
  // Upper-Body Force Production" → absolute_strength, relative_strength
  // ("Upper-Body Force Production" is a generic, non-specific restatement
  // already covered by the two strength values just listed and is not
  // double-counted, matching this whole batch's established convention
  // for this exact recurring phrase). "Secondary: Explosive Strength" →
  // explosive_strength. "Core Stability" → trunk_strength. "Structural
  // Robustness" → tissue_capacity (a close synonym of "Mechanical
  // Robustness", mapped identically). "Movement Coordination" →
  // coordination.
  physicalQualities: ["absolute_strength", "relative_strength", "explosive_strength", "trunk_strength", "tissue_capacity", "coordination"],
  // "# Movement Pattern — Primary: Horizontal Push." → horizontal_push
  // (exact match). "Secondary: Brace, Shoulder Horizontal Adduction, Elbow
  // Extension" → isometric (from Brace only); the other two are
  // joint-action-level detail already implied by `horizontal_push`.
  movementPatterns: ["horizontal_push", "isometric"],
  // "# Biomechanical Profile — Primary Force Vector: Horizontal. Secondary
  // Force Vector: Minimal Vertical." The explicit "Minimal" hedge excludes
  // the secondary vector, matching the same resolution already applied to
  // every "Minimal X" secondary vector throughout Lot 1.
  forceVectors: ["horizontal"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "barbell" },
          { kind: "equipment", equipment: "bench" },
          { kind: "equipment", equipment: "rack" },
          { kind: "equipment", equipment: "plates" },
        ],
      },
    ],
  },
  // "# Skill Requirement: Beginner. Suitable after basic technical
  // instruction." Corroborated by "# Neurological Profile — Motor
  // Complexity: Low, Balance Requirement: Very Low".
  minimumTechnicalLevel: 1,
  complexity: "low",
  // "Bilateral" (Movement Context, explicit).
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Pectoralis Major, Anterior
  // Deltoid, Triceps Brachii" → chest (pectoralis major), shoulder
  // (anterior deltoid), upper_arm (triceps brachii, an elbow extensor).
  // Secondary Muscles (Serratus Anterior, Latissimus Dorsi) and
  // Stabilizers are excluded, matching this catalog's established
  // primary-muscles-only discipline.
  bodyRegionsLoaded: ["chest", "shoulder", "upper_arm"],
  // "# Contraindications", quoted one item per source line.
  contraindications: [
    { description: "Acute shoulder injury.", region: "shoulder", prohibitedPatterns: ["horizontal_push", "isometric"], absolute: true },
    { description: "Acute pectoral injury.", region: "chest", prohibitedPatterns: ["horizontal_push", "isometric"], absolute: true },
    { description: "Pain during horizontal pressing.", prohibitedPatterns: ["horizontal_push", "isometric"], absolute: true },
    { description: "Severe shoulder mobility restrictions.", region: "shoulder", prohibitedPatterns: ["horizontal_push", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: High. Mechanical
    // Fatigue: Moderate. Metabolic Fatigue: Moderate." mapped via the
    // Low=1/Moderate=2/Moderate-to-High=3/High=4/Very-High=5 word scale
    // established across every Lot 1/Lot 2 entry from this same older
    // documentary format. "Neuromuscular Fatigue" → neural. "Mechanical
    // Fatigue" → muscular, also used as the shared source for
    // `connectiveTissue` (no distinct "Connective-Tissue Fatigue" heading
    // exists in this format).
    types: ["neural"],
    neural: 4,
    muscular: 2,
    connectiveTissue: 2, // inferred from "Mechanical Fatigue: Moderate"
    metabolic: 2,
    technical: 1, // fallback from "Skill Requirement: Beginner" (minimumTechnicalLevel 1)
  },
  // "# Scientific Evidence — Evidence Level: ★★★★★. The Bench Press is
  // among the most extensively researched resistance exercises..." —
  // mapped to the CAS Evidence Framework's "Level 1 — Scientific
  // consensus" (20-engine/02_EXERCISE_KNOWLEDGE_BASE.md), matching every
  // Lot 1/Lot 2 entry's own identical resolution of this exact
  // star-rating/prose pattern.
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star. Savate is
  // named in this table but has no `CombatSport` enum counterpart and is
  // omitted rather than force-mapped.
  combatSportRelevance: {
    boxing: 4,
    kickboxing: 3,
    muay_thai: 3,
    wrestling: 4,
    brazilian_jiu_jitsu: 3,
    judo: 3,
    mma: 4,
    krav_maga: 4,
  },
  // "# Regressions" names "Push-Up", "Incline Push-Up", "Machine Chest
  // Press" and "Dumbbell Bench Press" — none have a dedicated
  // chapter/catalog id anywhere in this repository (confirmed by direct
  // search). `substitutionExerciseIds` is genuinely empty for this entry.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Overhead Press
// Source: 50-exercises/08_OVERHEAD_PRESS
// -----------------------------------------------------------------------------

/**
 * Second entry of this batch. `exercisePrescriptionRegistry.ts` has a
 * corroborating `overheadPressEntry` (`requiredEquipmentCapabilities:
 * ["barbell", "plates", "rack"]` — matching this entry's own equipment
 * resolution exactly; a genuine confirmation that, unlike BARBELL_ROW in
 * Lot 2, `rack` really is required here — the bar must be unracked from
 * shoulder height before pressing overhead, unlike a row lifted directly
 * from the floor).
 *
 * Same documentation-format limitation as every entry in this batch: no
 * space/floor-safety language anywhere in this fiche (checked directly).
 *
 * Trunk bracing and bar-path quality are genuine biomechanical
 * characteristics of this movement, represented entirely through
 * `movementPatterns` (`isometric`) and `physicalQualities`
 * (`trunk_strength`) — never as an equipment or environment requirement,
 * matching the user's own explicit instruction.
 */
export const OVERHEAD_PRESS: ExerciseDefinition = {
  id: "overhead_press",
  name: "Overhead Press",
  module: "strength",
  primaryAdaptation: "maximum_strength",
  // "# Capability Mapping — Primary: Maximum Strength, Relative Strength,
  // Upper-Body Force Production" → absolute_strength, relative_strength
  // (folded, matching BENCH_PRESS's own identical treatment of this
  // recurring phrase). "Secondary: Core Stability" → trunk_strength.
  // "Whole-Body Coordination" → coordination. "Postural Control" →
  // stability. "Structural Robustness" → tissue_capacity.
  physicalQualities: ["absolute_strength", "relative_strength", "trunk_strength", "coordination", "stability", "tissue_capacity"],
  // "# Movement Pattern — Primary: Vertical Push." → vertical_push.
  // "Secondary: Brace, Shoulder Flexion, Elbow Extension, Whole-Body
  // Stabilization" → isometric (from Brace and Whole-Body Stabilization,
  // both describing the same bracing demand); the other two are
  // joint-action-level detail already implied by `vertical_push`.
  movementPatterns: ["vertical_push", "isometric"],
  // "# Biomechanical Profile — Primary Force Vector: Vertical." No
  // "Secondary Force Vector" heading exists in this fiche.
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
        ],
      },
    ],
  },
  // "# Skill Requirement: Intermediate. Requires adequate shoulder
  // mobility and trunk stability."
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Anterior Deltoid, Medial
  // Deltoid, Triceps Brachii" → shoulder (anterior and medial deltoid),
  // upper_arm (triceps brachii).
  bodyRegionsLoaded: ["shoulder", "upper_arm"],
  // "# Contraindications", quoted one item per source line.
  contraindications: [
    { description: "Acute shoulder injury.", region: "shoulder", prohibitedPatterns: ["vertical_push", "isometric"], absolute: true },
    { description: "Acute cervical injury.", region: "neck", prohibitedPatterns: ["vertical_push", "isometric"], absolute: true },
    { description: "Pain during overhead pressing.", prohibitedPatterns: ["vertical_push", "isometric"], absolute: true },
    { description: "Limited shoulder mobility.", region: "shoulder", prohibitedPatterns: ["vertical_push", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Moderate. Mechanical
    // Fatigue: Moderate. Metabolic Fatigue: Moderate." A flat "Moderate"
    // across every dimension.
    types: [],
    neural: 2,
    muscular: 2,
    connectiveTissue: 2, // inferred from "Mechanical Fatigue: Moderate"
    metabolic: 2,
    technical: 3, // fallback from "Skill Requirement: Intermediate" (minimumTechnicalLevel 3)
  },
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star.
  combatSportRelevance: {
    boxing: 4,
    kickboxing: 4,
    muay_thai: 4,
    wrestling: 4,
    brazilian_jiu_jitsu: 3,
    judo: 4,
    mma: 5,
    krav_maga: 5,
  },
  // "# Regressions" names "Landmine Press" → landmine_press (integrated in
  // this same batch, real catalog id). "Seated Dumbbell Press",
  // "Half-Kneeling Press" and "Resistance Band Press" name no exercise
  // with its own chapter/catalog id.
  substitutionExerciseIds: ["landmine_press"],
};

// -----------------------------------------------------------------------------
// Dip
// Source: 50-exercises/14_DIP
// -----------------------------------------------------------------------------

/**
 * Third entry of this batch. No `exercisePrescriptionRegistry.ts` entry
 * exists for `dip` (confirmed by direct search) — a known limitation,
 * documented here without modifying that registry.
 *
 * Same documentation-format limitation as every entry in this batch: no
 * space/floor-safety language anywhere in this fiche (checked directly).
 *
 * "# Equipment Requirements — Required: Parallel Bars." `dip_bars` is an
 * existing, exact `EquipmentType` value for precisely this apparatus — the
 * FIRST use of this type anywhere in `EXERCISE_KNOWLEDGE_BASE` (confirmed
 * by direct search). "Optional — Dip Belt, Weighted Vest, Gymnastic Rings,
 * Resistance Bands" are all documented as OPTIONAL, never Required —
 * unlike WEIGHTED_PULL_UP's own fiche (Lot 2), which required BOTH a "Dip
 * Belt" AND "Weight Plates" as load-bearing implements, this fiche's own
 * "# Loading Profile — Typical Intensity: Bodyweight or Bodyweight +
 * External Load" explicitly documents the unloaded bodyweight execution
 * as a fully valid, default form — `requirements` therefore gates on
 * `dip_bars` alone, with no `other`/loading-implement atom added.
 */
export const DIP: ExerciseDefinition = {
  id: "dip",
  name: "Dip",
  module: "strength",
  primaryAdaptation: "maximum_strength",
  // "# Capability Mapping — Primary: Relative Strength, Upper-Body
  // Strength" → relative_strength, absolute_strength (folded, matching
  // this batch's established convention). "Secondary: Explosive Strength"
  // → explosive_strength. "Core Stability" → trunk_strength. "Shoulder
  // Stability" → stability. "Movement Coordination" → coordination.
  // "Mechanical Robustness" → tissue_capacity.
  physicalQualities: ["relative_strength", "absolute_strength", "explosive_strength", "trunk_strength", "stability", "coordination", "tissue_capacity"],
  // "# Movement Pattern — Primary: Vertical Push." → vertical_push.
  // "Secondary: Shoulder Extension, Elbow Extension, Brace, Scapular
  // Depression" → isometric (from Brace only); the other three are
  // joint-action-level detail already implied by `vertical_push`.
  movementPatterns: ["vertical_push", "isometric"],
  // "# Biomechanical Profile — Primary Force Vector: Vertical." No
  // "Secondary Force Vector" heading exists in this fiche.
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [{ kind: "equipment", equipment: "dip_bars" }],
      },
    ],
  },
  // "# Skill Requirement: Intermediate. The athlete should demonstrate
  // adequate shoulder mobility and body control before adding external
  // load."
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // "Bilateral" (Movement Context, explicit).
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Pectoralis Major, Triceps
  // Brachii, Anterior Deltoid" → chest (pectoralis major), upper_arm
  // (triceps brachii), shoulder (anterior deltoid).
  bodyRegionsLoaded: ["chest", "upper_arm", "shoulder"],
  // "# Contraindications", quoted one item per source line.
  contraindications: [
    { description: "Acute shoulder injury.", region: "shoulder", prohibitedPatterns: ["vertical_push", "isometric"], absolute: true },
    { description: "Acute elbow injury.", region: "elbow", prohibitedPatterns: ["vertical_push", "isometric"], absolute: true },
    { description: "Pain during dips.", prohibitedPatterns: ["vertical_push", "isometric"], absolute: true },
    { description: "Severe shoulder instability.", region: "shoulder", prohibitedPatterns: ["vertical_push", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Moderate. Mechanical
    // Fatigue: Moderate. Metabolic Fatigue: Moderate." A flat "Moderate"
    // across every dimension.
    types: [],
    neural: 2,
    muscular: 2,
    connectiveTissue: 2, // inferred from "Mechanical Fatigue: Moderate"
    metabolic: 2,
    technical: 3, // fallback from "Skill Requirement: Intermediate"
  },
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star — identical
  // to OVERHEAD_PRESS's own table.
  combatSportRelevance: {
    boxing: 4,
    kickboxing: 4,
    muay_thai: 4,
    wrestling: 4,
    brazilian_jiu_jitsu: 3,
    judo: 4,
    mma: 5,
    krav_maga: 5,
  },
  // "# Regressions" names "Bench Dip", "Band-Assisted Dip", "Machine Dip"
  // and "Push-Up" — none have a dedicated chapter/catalog id anywhere in
  // this repository (confirmed by direct search). `substitutionExerciseIds`
  // is genuinely empty for this entry.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Landmine Press
// Source: 50-exercises/26_LANDMINE_PRESS
// -----------------------------------------------------------------------------

/**
 * Fourth and final entry of this batch. No `exercisePrescriptionRegistry.ts`
 * entry exists for `landmine_press` (confirmed by direct search) — a known
 * limitation, documented here without modifying that registry.
 *
 * Same documentation-format limitation as every entry in this batch: no
 * space/floor-safety language anywhere in this fiche (checked directly).
 *
 * KNOWN MODEL LIMITATION, flagged explicitly rather than silently
 * approximated: "# Equipment Requirements — Required: Barbell, Landmine
 * Attachment." `barbell` is an exact match. "Landmine Attachment" — the
 * pivoting sleeve that anchors one end of the barbell to the floor — has
 * no dedicated `EquipmentType` value. The existing `rigid_anchor_support`
 * value is deliberately NOT reused here: that type was created
 * specifically for `DRAGON_FLAG`'s own "Secure overhead or behind-head
 * HAND anchor" (something the athlete grips directly with the hands — see
 * that entry's own sourcing precedent, itself inherited from
 * `TOWEL_PULL_UP`'s original scoping decision), a materially different
 * physical function from a landmine sleeve that receives and pivots a
 * BARBELL END, never gripped by the hands at all. Reusing it here would
 * blur exactly the distinction that type was originally created to
 * preserve. `"other"` is used instead as the flagged placeholder for the
 * landmine attachment specifically — the same honest-escape-hatch pattern
 * already established for AB_WHEEL/WEIGHTED_PULL_UP/CHEST_SUPPORTED_ROW.
 * "# Optional — Weight Plates, Landmine Handle" are genuinely optional
 * (the bar's own weight through the angled lever is sufficient for a
 * valid execution) — no `plates` atom is added to `requirements`.
 *
 * DOCUMENTATION INCONSISTENCY, resolved explicitly: this fiche states its
 * Skill Requirement TWICE with two different answers — "# Neurological
 * Profile — Skill Requirement: Beginner to Intermediate" vs. the fiche's
 * own dedicated, top-level "# Skill Requirement — Beginner. Accessible to
 * most athletes." heading. Every other exercise in this entire migration
 * project (across every batch so far) has sourced `minimumTechnicalLevel`/
 * `complexity` from the dedicated top-level "# Skill Requirement" heading,
 * never from the "Neurological Profile" sub-listing — the same sourcing
 * discipline is applied here for consistency, resolving to the plain,
 * unhedged "Beginner" (minimumTechnicalLevel 1 / "low"), not the hedged
 * "Beginner to Intermediate" the Neurological Profile sub-field states.
 *
 * Central business question for this entry, explicitly flagged before
 * writing began: "# Movement Pattern — Primary: Angled Push." This fiche
 * never uses the literal words "Horizontal Push" or "Vertical Push"
 * anywhere (checked directly) — it coins its own distinct term, directly
 * corroborated by "# Biomechanical Profile — Primary Force Vector:
 * Diagonal" (the `diagonal` `ForceVector` value exists precisely for this
 * kind of case). No `MovementPattern` value represents a diagonal/angled
 * push specifically — forcing this into `vertical_push` or
 * `horizontal_push` would misrepresent a fiche that deliberately avoids
 * both terms. The dedicated `"mixed"` value is used instead, the same
 * escape hatch already used for DEAD_BUG's own blended/undefined pattern
 * in 62_CORE.
 */
export const LANDMINE_PRESS: ExerciseDefinition = {
  id: "landmine_press",
  name: "Landmine Press",
  module: "strength",
  primaryAdaptation: "maximum_strength",
  // "# Capability Mapping — Primary: Upper-Body Strength, Shoulder
  // Stability, Core Stability" → absolute_strength (folded), stability
  // (from Shoulder Stability), trunk_strength (from Core Stability).
  // "Secondary: Explosive Power" → explosive_strength (the closest
  // existing quality for this exact phrase). "Rotational Control" has no
  // distinct PhysicalQuality counterpart beyond `trunk_strength` already
  // listed and the dedicated `anti_rotation` MovementPattern value below
  // — not double-counted. "Movement Coordination" → coordination.
  // "Mechanical Robustness" → tissue_capacity.
  physicalQualities: ["absolute_strength", "stability", "trunk_strength", "explosive_strength", "coordination", "tissue_capacity"],
  // "# Movement Pattern — Primary: Angled Push" → mixed (see block comment
  // above). "Secondary: Brace, Shoulder Flexion, Scapular Upward Rotation,
  // Anti-Rotation" → isometric (from Brace), anti_rotation (from
  // "Anti-Rotation", an exact enum match — a genuine demand present even
  // in this exercise's own bilateral base execution, since the barbell
  // pivots asymmetrically to one side of the body regardless of a
  // one-handed or two-handed grip).
  movementPatterns: ["mixed", "isometric", "anti_rotation"],
  // "# Biomechanical Profile — Primary Force Vector: Diagonal. Secondary
  // Force Vector: Vertical." Neither vector carries a "Minimal" hedge —
  // both are kept.
  forceVectors: ["diagonal", "vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "barbell" },
          { kind: "equipment", equipment: "other" }, // flagged placeholder for "Landmine Attachment" — see block comment above
        ],
      },
    ],
  },
  // "# Skill Requirement: Beginner. Accessible to most athletes." — see
  // block comment above for why this dedicated heading governs over the
  // fiche's own internally inconsistent "Neurological Profile" sub-field.
  minimumTechnicalLevel: 1,
  complexity: "low",
  // "# Movement Context — Standing, Whole Body, Unilateral or Bilateral" —
  // genuinely hedged in this fiche's own template. Resolved via
  // "# Progressions — Single-Arm Landmine Press" (single-arm execution is
  // named as a PROGRESSION, i.e. the harder variant), the same
  // progression-vs-regression resolution logic already used for
  // PINCH_CARRY's own identical "bilateral execution is listed under
  // Regressions (easier) while unilateral execution is listed under
  // Progressions (harder)" pattern — the two-handed/bilateral execution is
  // therefore the base/default form.
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Anterior Deltoid, Upper
  // Pectoralis, Triceps" → shoulder (anterior deltoid), chest (upper
  // pectoralis), upper_arm (triceps).
  bodyRegionsLoaded: ["shoulder", "chest", "upper_arm"],
  // "# Contraindications", quoted one item per source line — the shortest
  // contraindication list in this batch (3 items), matching this fiche's
  // own "Overall Risk: Very Low" Safety Profile rating, the lowest risk
  // rating documented anywhere in this batch.
  contraindications: [
    { description: "Acute shoulder injury.", region: "shoulder", prohibitedPatterns: ["mixed", "isometric", "anti_rotation"], absolute: true },
    { description: "Acute elbow injury.", region: "elbow", prohibitedPatterns: ["mixed", "isometric", "anti_rotation"], absolute: true },
    { description: "Pain during pressing.", prohibitedPatterns: ["mixed", "isometric", "anti_rotation"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Moderate. Mechanical
    // Fatigue: Low. Metabolic Fatigue: Low. Overall Fatigue Cost: Low.
    // Excellent stimulus-to-fatigue ratio." The lowest overall fatigue
    // rating documented anywhere in this batch, directly corroborated by
    // the explicit prose.
    types: [],
    neural: 2,
    muscular: 1,
    connectiveTissue: 1, // inferred from "Mechanical Fatigue: Low"
    metabolic: 1,
    technical: 1, // fallback from "Skill Requirement: Beginner"
  },
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star. Savate is
  // named in this table but has no `CombatSport` enum counterpart and is
  // omitted rather than force-mapped.
  combatSportRelevance: {
    boxing: 5,
    kickboxing: 5,
    muay_thai: 5,
    wrestling: 4,
    brazilian_jiu_jitsu: 4,
    judo: 4,
    mma: 5,
    krav_maga: 5,
  },
  // "# Regressions" (Half-Kneeling Landmine Press, Tall-Kneeling Landmine
  // Press, Resistance Band Press) name no exercise with its own
  // chapter/catalog id anywhere in this fiche (checked directly). Despite
  // OVERHEAD_PRESS's own Regressions naming "Landmine Press" as its own
  // substitute, this fiche never names "Overhead Press" anywhere in its
  // own Progressions/Regressions/Variations sections (checked directly) —
  // the same faithfully-preserved one-directional asymmetry already
  // documented elsewhere in this catalog (e.g. FRONT_SQUAT/BACK_SQUAT in
  // Lot 1, CHEST_SUPPORTED_ROW/BARBELL_ROW in Lot 2), not a gap to "fix"
  // by inventing a reciprocal reference. `substitutionExerciseIds` is
  // genuinely empty for this entry.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Nordic Hamstring Curl
// Source: 50-exercises/18_NORDIC_HAMSTRING_CURL
// -----------------------------------------------------------------------------

/**
 * First entry of the "Lot 4 — Chaine posterieure et robustness" batch,
 * migrated alongside COPENHAGEN_PLANK/TIBIALIS_RAISE/SOLEUS_RAISE/
 * ROTATOR_CUFF_TRAINING/WRIST_STRENGTHENING/NECK_TRAINING. No
 * `exercisePrescriptionRegistry.ts` entry exists for `nordic_hamstring_curl`
 * (confirmed by direct search) — a known limitation, documented here
 * without modifying that registry.
 *
 * Same documentation-format limitation as every entry migrated from this
 * older `50-exercises/` layer so far: no space/floor-safety language
 * anywhere in this fiche (checked directly).
 *
 * Central business question for this entry, explicitly flagged before
 * writing began: "# Equipment Requirements — Required: Nordic Bench, or
 * Partner Assistance." A genuine, literal "or" between a physical
 * implement and human assistance, stated at the top-level Required
 * heading (not buried in a single variant) — this is the FIRST exercise in
 * this whole catalog whose eligibility gate mixes an `equipment` atom and
 * a `human_assistance` atom inside the SAME `any_of` clause. The type
 * model supports this directly: `ExerciseRequirementAtom` is a plain union
 * of `equipment`/`environment`/`human_assistance` variants, and
 * `ExerciseRequirementClause.items` accepts any mix of them — no schema
 * change was needed to represent this honestly.
 *
 * "Nordic Bench" has no dedicated `EquipmentType` value. Neither generic
 * `bench` nor `rigid_anchor_support` is silently reused: a Nordic bench is
 * a specialized apparatus that anchors the ATHLETE'S ANKLES at floor
 * level, physically and functionally distinct from the flat/adjustable
 * bench used throughout this catalog for BENCH_PRESS/HIP_THRUST/
 * CHEST_SUPPORTED_ROW's own back/foot support, and distinct from
 * `rigid_anchor_support`'s own established hand-grip-anchor scope (see
 * LANDMINE_PRESS's own identical reasoning in Lot 3). `"other"` is used as
 * the flagged placeholder for the Nordic bench specifically, combined with
 * `human_assistance: "partner"` in a single `any_of` clause — an honest,
 * two-path eligibility gate reflecting this fiche's own explicit
 * either/or requirement.
 *
 * "# Variations — Assisted Nordic, Weighted Nordic, Eccentric-Only Nordic,
 * Partner Nordic, Machine Nordic" lists "Partner Nordic" as ONE of several
 * named variations, not the exercise's sole method — confirming that
 * partner assistance is a genuine alternative ANCHORING mechanism for the
 * same base movement (matching the top-level Required "or" framing),
 * not a separate, harder/easier variant requiring its own entry.
 */
export const NORDIC_HAMSTRING_CURL: ExerciseDefinition = {
  id: "nordic_hamstring_curl",
  name: "Nordic Hamstring Curl",
  module: "strength",
  // "# Primary Classification: Strength" (explicit).
  primaryAdaptation: "maximum_strength",
  // "# Capability Mapping — Primary: Eccentric Strength, Posterior Chain
  // Strength, Mechanical Robustness." "Eccentric Strength" has no direct
  // PhysicalQuality counterpart of its own — `deceleration` is used
  // instead, directly grounded in this fiche's own "Explainability"
  // section ("enhancing sprinting, kicking and deceleration performance"),
  // the closest real quality for a controlled-lengthening/braking capacity.
  // "Posterior Chain Strength" has no distinct counterpart and is not
  // force-fitted (already substantively covered by `bodyRegionsLoaded`
  // below, matching ROMANIAN_DEADLIFT's own identical exclusion in Lot 1).
  // "Mechanical Robustness" → tissue_capacity. "Secondary: Relative
  // Strength" → relative_strength. "Injury Resilience" → tissue_capacity
  // (already listed). "Movement Control" → coordination. "Core Stability"
  // → trunk_strength.
  physicalQualities: ["deceleration", "tissue_capacity", "relative_strength", "coordination", "trunk_strength"],
  // MODEL LIMITATION, flagged explicitly: "# Movement Pattern — Primary:
  // Knee Flexion." No `MovementPattern` value represents an isolated knee-
  // flexion action — this taxonomy is built for compound, whole-body
  // patterns (squat, hinge, push/pull families, gait patterns), not
  // single-joint accessory movements. `"mixed"` is used as the closest
  // available generic value for the PRIMARY pattern — not because the
  // movement is literally blended, but because no dedicated slot exists
  // for it, the same honest gap that recurs across several entries in this
  // batch (see TIBIALIS_RAISE/SOLEUS_RAISE/WRIST_STRENGTHENING below).
  // "Secondary: Brace" → isometric, a genuinely grounded addition (this
  // fiche explicitly names Brace as its own secondary pattern, unlike the
  // entries below that have no such heading at all).
  movementPatterns: ["mixed", "isometric"],
  // "# Biomechanical Profile — Primary Force Vector: Vertical" (the
  // athlete's center of mass descends vertically as the torso pivots
  // forward around the knee).
  forceVectors: ["vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "any_of",
        items: [
          { kind: "equipment", equipment: "other" }, // flagged placeholder for "Nordic Bench" — see block comment above
          { kind: "human_assistance", assistance: "partner" },
        ],
      },
    ],
  },
  // "# Skill Requirement: Intermediate. Beginners should use assistance
  // until full eccentric control is achieved."
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // "Bilateral" (Movement Context, explicit).
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Hamstrings" → thigh. Secondary
  // Muscles (Gluteus Maximus, Gastrocnemius) are excluded, matching this
  // catalog's established primary-muscles-only discipline.
  bodyRegionsLoaded: ["thigh"],
  // "# Contraindications", quoted one item per source line.
  contraindications: [
    { description: "Acute hamstring injury.", region: "thigh", prohibitedPatterns: ["mixed", "isometric"], absolute: true },
    { description: "Acute knee injury.", region: "knee", prohibitedPatterns: ["mixed", "isometric"], absolute: true },
    { description: "Pain during knee flexion.", prohibitedPatterns: ["mixed", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: High. Mechanical
    // Fatigue: Very High. Metabolic Fatigue: Low." mapped via the
    // Low=1/Moderate=2/Moderate-to-High=3/High=4/Very-High=5 word scale
    // established across every Lot 1/Lot 2/Lot 3 entry from this same
    // older documentary format. "Produces significant delayed-onset
    // muscle soreness" (explicit prose) corroborates the elevated
    // muscular/connective ratings. `connectiveTissue` shares the same
    // "Mechanical Fatigue" source as `muscular` (no distinct
    // "Connective-Tissue Fatigue" heading exists in this format).
    types: ["neural", "muscular", "connective_tissue"],
    neural: 4,
    muscular: 5,
    connectiveTissue: 5, // inferred from "Mechanical Fatigue: Very High"
    metabolic: 1,
    technical: 3, // fallback from "Skill Requirement: Intermediate" (minimumTechnicalLevel 3)
  },
  // "# Scientific Evidence — Evidence Level: ★★★★★. The Nordic Hamstring
  // Curl is among the most evidence-supported exercises..." — mapped to
  // the CAS Evidence Framework's "Level 1 — Scientific consensus"
  // (20-engine/02_EXERCISE_KNOWLEDGE_BASE.md).
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star. Savate is
  // named in this table but has no `CombatSport` enum counterpart and is
  // omitted rather than force-mapped.
  combatSportRelevance: {
    boxing: 4,
    kickboxing: 5,
    muay_thai: 5,
    wrestling: 4,
    brazilian_jiu_jitsu: 4,
    judo: 4,
    mma: 5,
    krav_maga: 5,
  },
  // "# Regressions" (Band-Assisted Nordic, Partial Range Nordic, Swiss
  // Ball Hamstring Curl, Sliding Leg Curl, Machine Leg Curl) name no
  // exercise with its own chapter/catalog id anywhere in this repository
  // (confirmed by direct search). `substitutionExerciseIds` is genuinely
  // empty for this entry.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Copenhagen Plank
// Source: 50-exercises/19_COPENHAGEN_PLANK
// -----------------------------------------------------------------------------

/**
 * Second entry of this batch. `exercisePrescriptionRegistry.ts` has a
 * corroborating `copenhagenPlankEntry` (`requiredEquipmentCapabilities:
 * ["bench"]`, `laterality: "unilateral"`, `moduleId: "core"` — matching
 * this entry's own equipment/laterality resolution exactly, and grounding
 * the `module` choice below).
 *
 * Same documentation-format limitation as every entry in this batch: no
 * space/floor-safety language anywhere in this fiche (checked directly) —
 * "# Movement Context: ... Ground Based" alone, with no "stable surface"/
 * "non-slip" language, does not ground a `floor_safe` atom.
 *
 * "# Primary Classification: Stability" — a genuine outlier: no other
 * entry migrated so far in Lots 1–4 uses this exact word (every strength
 * lift says "Strength"; every robustness-family entry below says
 * "Robustness"). No `CapabilityModule` value is literally "stability" —
 * `module: "core"` is used instead, directly corroborated by the registry
 * (`moduleId: "core"`) and by this fiche's own "Primary Movement Pattern:
 * Anti-Lateral Flexion" — the identical MovementPattern value already
 * used for SUITCASE_CARRY's own anti-lateral-flexion framing in 62_CORE.
 * `primaryAdaptation: "movement"` is used for the same reason AB_WHEEL/
 * PALLOF_PRESS used it in 62_CORE for their own stability/anti-X framing —
 * no AdaptationDomain value is literally "stability" either.
 *
 * "# Equipment Requirements — Required: Bench." Required, not merely
 * optional — the canonical setup rests the top foot on a bench for
 * support (registry's own setup instruction: "Rest the top foot on a
 * bench..."). "# Variations — ... Partner Assisted" names partner
 * assistance as one of several documented variations, not the base/
 * default requirement — no `human_assistance` clause is added.
 */
export const COPENHAGEN_PLANK: ExerciseDefinition = {
  id: "copenhagen_plank",
  name: "Copenhagen Plank",
  module: "core",
  primaryAdaptation: "movement",
  // "# Capability Mapping — Primary: Dynamic Stability, Core Stability,
  // Adductor Strength." "Dynamic Stability" → stability. "Core Stability"
  // → trunk_strength. "Adductor Strength" has no distinct PhysicalQuality
  // counterpart of its own (a region-specific strength descriptor, already
  // substantively covered by `bodyRegionsLoaded` below) and is not
  // force-fitted. "Secondary: Mechanical Robustness" → tissue_capacity.
  // "Movement Control" → coordination. "Injury Resilience" →
  // tissue_capacity (already listed). "Relative Strength" →
  // relative_strength.
  physicalQualities: ["stability", "trunk_strength", "tissue_capacity", "coordination", "relative_strength"],
  // "# Movement Pattern — Primary: Anti-Lateral Flexion" → anti_lateral_flexion
  // (exact match). "Secondary: Hip Adduction, Brace, Pelvic Stabilization"
  // → isometric (from Brace); the other two are joint-action-level detail
  // already implied by `anti_lateral_flexion` and captured through
  // `bodyRegionsLoaded`/`physicalQualities` instead.
  movementPatterns: ["anti_lateral_flexion", "isometric"],
  // "# Biomechanical Profile — Primary Force Vector: Frontal Plane
  // Stabilization." This fiche explicitly names a primary vector (unlike
  // PLATE_PINCH's own true "no stated vector" case, which resolved to
  // `not_applicable`) — `lateral` is the direct, honest ForceVector match
  // for a frontal-plane stabilization demand.
  forceVectors: ["lateral"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [{ kind: "equipment", equipment: "bench" }],
      },
    ],
  },
  // "# Skill Requirement: Intermediate. Beginners should start with
  // short-lever variations."
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // "# Movement Context — Unilateral" (explicit). `exercisePrescriptionRegistry.ts`'s
  // own independent `laterality: "unilateral"` corroborates this directly.
  unilateral: true,
  // "# Muscular Profile — Primary Muscles: Adductor Longus, Adductor
  // Magnus, Adductor Brevis" — all adductor-group musculature → groin.
  bodyRegionsLoaded: ["groin"],
  // "# Contraindications", quoted one item per source line.
  contraindications: [
    { description: "Acute groin injury.", region: "groin", prohibitedPatterns: ["anti_lateral_flexion", "isometric"], absolute: true },
    { description: "Acute hip injury.", region: "hip", prohibitedPatterns: ["anti_lateral_flexion", "isometric"], absolute: true },
    { description: "Pain during hip adduction.", prohibitedPatterns: ["anti_lateral_flexion", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Moderate. Mechanical
    // Fatigue: Low. Metabolic Fatigue: Low." "Excellent stimulus-to-fatigue
    // ratio" (explicit prose) corroborates the low ratings.
    types: [],
    neural: 2,
    muscular: 1,
    connectiveTissue: 1, // inferred from "Mechanical Fatigue: Low"
    metabolic: 1,
    technical: 3, // fallback from "Skill Requirement: Intermediate"
  },
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star — the
  // highest overall combat-relevance profile documented so far (only
  // Boxing falls below 5 stars).
  combatSportRelevance: {
    boxing: 4,
    kickboxing: 5,
    muay_thai: 5,
    wrestling: 5,
    brazilian_jiu_jitsu: 5,
    judo: 5,
    mma: 5,
    krav_maga: 5,
  },
  // "# Regressions" (Short Lever Copenhagen, Side Plank, Bent-Knee
  // Copenhagen) name no exercise with its own chapter/catalog id anywhere
  // in this repository (confirmed by direct search).
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Tibialis Raise
// Source: 50-exercises/41_TIBIALIS_RAISE
// -----------------------------------------------------------------------------

/**
 * Third entry of this batch. `exercisePrescriptionRegistry.ts` has a
 * corroborating `tibialisRaiseEntry` (`requiredEquipmentCapabilities: []`,
 * `supportedLoadingModes: ["bodyweight", "added_external_load"]`,
 * `moduleId: "robustness"` — matching this entry's own equipment
 * resolution and module exactly).
 *
 * Same documentation-format limitation as every entry in this batch: no
 * space/floor-safety language anywhere in this fiche (checked directly).
 *
 * "# Equipment Requirements — Required: None. Optional: Tibialis Machine,
 * Resistance Band, Dumbbell, Slant Board." No wall, support or apparatus
 * is required — the bodyweight execution is the fully valid default form
 * (registry's own `requiredEquipmentCapabilities: []` corroborates this
 * directly) — `requirements` is omitted entirely rather than gating on any
 * `other` placeholder, since nothing is actually REQUIRED to flag.
 *
 * MODEL LIMITATION, flagged explicitly: "# Movement Pattern — Primary:
 * Ankle Dorsiflexion." No `MovementPattern` value represents an isolated
 * ankle-dorsiflexion action, and no "Brace"-equivalent secondary pattern
 * is named either (unlike NORDIC_HAMSTRING_CURL above) — `"mixed"` is used
 * as the sole value, the same isolated-single-joint-accessory-movement gap
 * already flagged for NORDIC_HAMSTRING_CURL's own primary pattern.
 *
 * "# Scientific Evidence — Evidence Level: ★★★★☆. ... MAY contribute to
 * reducing overuse injuries..." — the FIRST 4-star rating (not 5) and the
 * first hedged "may contribute" claim encountered across Lots 1–4 (every
 * other entry so far claims "strong evidence"/"strongly supported"/
 * "extensively researched"). Mapped to the CAS Evidence Framework's "Level
 * 2 — Expert practice" rather than "Level 1 — Scientific consensus" — a
 * deliberate, textually-grounded divergence from the level_1 pattern used
 * everywhere else in this migration so far, not an oversight.
 */
export const TIBIALIS_RAISE: ExerciseDefinition = {
  id: "tibialis_raise",
  name: "Tibialis Raise",
  module: "robustness",
  // "# Primary Classification: Robustness" (explicit).
  primaryAdaptation: "robustness",
  // "# Capability Mapping — Primary: Anterior Lower-Leg Strength, Ankle
  // Stability, Foot Control." "Anterior Lower-Leg Strength" has no
  // distinct region-specific PhysicalQuality counterpart of its own, but
  // this fiche's own "# Performance Indicators" explicitly names "Muscular
  // Endurance" (matching the high-repetition, 12–30-rep Loading Profile) —
  // mapped to muscular_endurance on that direct textual anchor rather than
  // excluded outright. "Ankle Stability" → stability. "Foot Control" →
  // coordination. "Secondary: Deceleration" → deceleration (exact match).
  // "Shock Absorption" → tissue_capacity (a structural/absorptive-capacity
  // concept). "Movement Efficiency" excluded (generic, no distinct
  // counterpart, matching this whole project's established exclusion of
  // this recurring phrase). "Injury Resilience" → tissue_capacity (already
  // listed).
  physicalQualities: ["muscular_endurance", "stability", "coordination", "deceleration", "tissue_capacity"],
  // See block comment above for why this resolves to `mixed` alone.
  movementPatterns: ["mixed"],
  // "# Biomechanical Profile — Primary Force Vector: Sagittal", grounded
  // directly by the Coaching Cue "Lift through the front of the ankle" —
  // the foot lifts upward against gravity/resistance.
  forceVectors: ["upward"],
  requiredEquipment: [],
  // No `requirements` object — nothing is documented as required (see
  // block comment above).
  // "# Skill Requirement — Suitable For: All athletes", corroborated by
  // "# Neurological Profile — Skill Requirement: Beginner" (this fiche's
  // dedicated heading uses different phrasing than the Beginner/
  // Intermediate word ladder used elsewhere — the Neurological Profile's
  // own internal "Beginner" is used as the effective word here, matching
  // the exact same resolution needed for SOLEUS_RAISE/ROTATOR_CUFF_TRAINING/
  // WRIST_STRENGTHENING below, all of which share this identical dual
  // phrasing).
  minimumTechnicalLevel: 1,
  complexity: "low",
  // No unilateral/bilateral statement exists in "# Movement Context"
  // (Standing, Seated, Bodyweight, Loaded). "# Progressions — Single-Leg
  // Tibialis Raise" names single-leg execution as a harder PROGRESSION,
  // implying the bilateral/both-feet base form is the default, easier
  // execution.
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Tibialis Anterior" → lower_leg.
  bodyRegionsLoaded: ["lower_leg"],
  // "# Contraindications", quoted one item per source line.
  contraindications: [
    { description: "Acute ankle injury.", region: "ankle", prohibitedPatterns: ["mixed"], absolute: true },
    { description: "Acute tibial stress injury.", region: "lower_leg", prohibitedPatterns: ["mixed"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Very Low. Mechanical
    // Fatigue: Very Low. Metabolic Fatigue: Low. Overall Fatigue Cost:
    // ★★★★★ Very Low." This fiche's own vocabulary introduces "Very Low"
    // as a distinct tier BELOW "Low" — read fiche-relatively: "Very Low"
    // maps to this Rating5 scale's floor (1), and "Low" (used once, for
    // Metabolic) sits one tier above it (2) WITHIN this fiche's own
    // internal ladder — the lowest overall fatigue profile documented
    // anywhere in this migration so far.
    types: [],
    neural: 1,
    muscular: 1,
    connectiveTissue: 1, // inferred from "Mechanical Fatigue: Very Low"
    metabolic: 2,
    technical: 1, // fallback from "Skill Requirement: Beginner" (minimumTechnicalLevel 1)
  },
  // See block comment above — "Level 2 — Expert practice", not "Level 1".
  evidenceLevel: "level_2",
  // "# Transfer to Combat Sports" table, quoted star-for-star. Savate is
  // named in this table but has no `CombatSport` enum counterpart and is
  // omitted rather than force-mapped.
  combatSportRelevance: {
    boxing: 5,
    kickboxing: 5,
    muay_thai: 5,
    wrestling: 4,
    brazilian_jiu_jitsu: 3,
    judo: 4,
    mma: 5,
    krav_maga: 5,
  },
  // "# Regressions" (Bodyweight Tibialis Raise, Reduced Range of Motion)
  // name no distinct catalog exercise — "Bodyweight Tibialis Raise" is the
  // unloaded form of this same exercise, not a separate entry.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Soleus Raise
// Source: 50-exercises/44_SOLEUS_RAISE
// -----------------------------------------------------------------------------

/**
 * Fourth entry of this batch. `exercisePrescriptionRegistry.ts` has a
 * corroborating `soleusRaiseEntry` (`requiredEquipmentCapabilities: []`,
 * `moduleId: "robustness"` — matching this entry's own resolution
 * exactly).
 *
 * Same documentation-format limitation as every entry in this batch: no
 * space/floor-safety language anywhere in this fiche (checked directly).
 *
 * "# Equipment Requirements — Required: None." Same fully-valid bodyweight
 * default as TIBIALIS_RAISE — `requirements` is omitted entirely.
 *
 * Central business distinction from TIBIALIS_RAISE, explicitly flagged
 * before writing began: "Coaching Cues — Maintain knee flexion." is a
 * TECHNIQUE cue (the knee stays bent throughout, isolating the soleus from
 * the biarticular gastrocnemius), never turned into an equipment or
 * environment requirement, matching the user's own explicit instruction.
 * The real, textually-grounded distinction between this entry and a
 * gastrocnemius-dominant "calf raise" lives in the Muscular Profile
 * (`Soleus` primary here, vs. `Gastrocnemius` demoted to secondary) and in
 * `physicalQualities` (`reactive_strength` appears here — grounded in this
 * fiche's own "Stretch-Shortening Cycle: Moderate" and "Reactive Soleus
 * Raise" progression — and does NOT appear for TIBIALIS_RAISE, whose own
 * Stretch-Shortening Cycle is "Minimal").
 *
 * Same isolated-single-joint MovementPattern gap as TIBIALIS_RAISE: "#
 * Movement Pattern — Primary: Plantar Flexion" has no `MovementPattern`
 * counterpart, and no "Brace"-equivalent secondary pattern is named either
 * — `"mixed"` is used as the sole value.
 */
export const SOLEUS_RAISE: ExerciseDefinition = {
  id: "soleus_raise",
  name: "Soleus Raise",
  module: "robustness",
  primaryAdaptation: "robustness",
  // "# Capability Mapping — Primary: Lower-Leg Endurance, Achilles
  // Resilience, Ankle Stiffness." "Lower-Leg Endurance" → muscular_endurance
  // (direct match). "Achilles Resilience" → tissue_capacity (tendon/
  // connective-capacity concept). "Ankle Stiffness" → stability (joint-
  // control capacity). "Secondary: Movement Efficiency" excluded
  // (generic). "Reactive Strength" → reactive_strength (exact match — see
  // block comment above for the textual grounding). "Deceleration" →
  // deceleration. "Footwork Economy" excluded (generic, no distinct
  // counterpart).
  physicalQualities: ["muscular_endurance", "tissue_capacity", "stability", "reactive_strength", "deceleration"],
  // See block comment above for why this resolves to `mixed` alone.
  movementPatterns: ["mixed"],
  // "# Biomechanical Profile — Primary Force Vector: Vertical" (plantar
  // flexion drives the heel/body upward against gravity).
  forceVectors: ["vertical"],
  requiredEquipment: [],
  // No `requirements` object — nothing is documented as required.
  // "# Skill Requirement — Suitable For: All athletes", corroborated by
  // "# Neurological Profile — Skill Requirement: Beginner".
  minimumTechnicalLevel: 1,
  complexity: "low",
  // "# Progressions — Single-Leg Soleus Raise" names single-leg execution
  // as a harder progression, implying the bilateral base form is the
  // default.
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Soleus" → lower_leg.
  bodyRegionsLoaded: ["lower_leg"],
  // "# Contraindications", quoted one item per source line. No dedicated
  // "Achilles tendon" BodyRegion value exists — `lower_leg` is used for
  // both tendon- and calf-specific injury descriptions, the same region
  // already used for the Tibialis Anterior muscle above.
  contraindications: [
    { description: "Acute Achilles injury.", region: "lower_leg", prohibitedPatterns: ["mixed"], absolute: true },
    { description: "Acute calf tear.", region: "lower_leg", prohibitedPatterns: ["mixed"], absolute: true },
    { description: "Acute ankle injury.", region: "ankle", prohibitedPatterns: ["mixed"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Very Low. Mechanical
    // Fatigue: Very Low. Metabolic Fatigue: Low." Same fiche-relative
    // Very-Low=1/Low=2 resolution as TIBIALIS_RAISE.
    types: [],
    neural: 1,
    muscular: 1,
    connectiveTissue: 1, // inferred from "Mechanical Fatigue: Very Low"
    metabolic: 2,
    technical: 1, // fallback from "Skill Requirement: Beginner"
  },
  // "# Scientific Evidence — Evidence Level: ★★★★★. Progressive soleus
  // strengthening improves... while contributing to injury prevention." A
  // full 5-star rating with confident (not hedged) language — genuinely
  // distinct from TIBIALIS_RAISE's own 4-star, hedged "may contribute"
  // claim, despite both being closely related lower-leg accessory
  // exercises. Mapped to "Level 1 — Scientific consensus".
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star — identical
  // to TIBIALIS_RAISE's own table.
  combatSportRelevance: {
    boxing: 5,
    kickboxing: 5,
    muay_thai: 5,
    wrestling: 4,
    brazilian_jiu_jitsu: 3,
    judo: 4,
    mma: 5,
    krav_maga: 5,
  },
  // "# Regressions" (Bodyweight Soleus Raise, Partial Range, Band
  // Resistance) name no distinct catalog exercise.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Rotator Cuff Training
// Source: 50-exercises/42_ROTATOR_CUFF_TRAINING
// -----------------------------------------------------------------------------

/**
 * Fifth entry of this batch. `exercisePrescriptionRegistry.ts` has a
 * corroborating `rotatorCuffTrainingEntry` (`requiredEquipmentCapabilities:
 * ["cable_or_band_resistance"]` — the existing equivalence group already
 * used identically by `pallof_press`, `laterality: "bilateral"`,
 * `moduleId: "robustness"` — matching this entry's own resolution
 * exactly).
 *
 * Same documentation-format limitation as every entry in this batch: no
 * space/floor-safety language anywhere in this fiche (checked directly).
 *
 * HONESTY NOTE, explicitly flagged per the user's own instruction: "Rotator
 * Cuff Training CONSISTS OF targeted exercises..." (plural, explicit) and
 * "# Variations — External Rotation, Internal Rotation, Face Pull, Band
 * Pull-Apart, Cuban Rotation, Scaption Raise, Bottom-Up Carry" name SEVEN
 * distinct named movements. This entry represents a general shoulder-
 * stability FAMILY/PROTOCOL, not one single canonical named movement — the
 * same treatment already established by `exercisePrescriptionRegistry.ts`'s
 * own single `rotatorCuffTrainingEntry` (generic setup/execution
 * instructions, no single named sub-movement singled out). This is stated
 * here explicitly rather than silently presenting a family as if it were
 * one specific movement.
 *
 * "# Equipment Requirements — Required: Resistance Band, or Cable." The
 * identical `any_of[cable_machine, resistance_band]` equivalence already
 * established for PALLOF_PRESS in 62_CORE — reused directly, not
 * reinvented, since both fiches document the exact same real equipment
 * equivalence.
 */
export const ROTATOR_CUFF_TRAINING: ExerciseDefinition = {
  id: "rotator_cuff_training",
  name: "Rotator Cuff Training",
  module: "robustness",
  // "# Primary Classification: Robustness" (explicit).
  primaryAdaptation: "robustness",
  // "# Capability Mapping — Primary: Shoulder Stability, Joint Integrity,
  // Dynamic Control." "Shoulder Stability" → stability. "Joint Integrity"
  // → tissue_capacity (a structural/connective-integrity concept, matching
  // "Mechanical Robustness"'s own established mapping). "Dynamic Control"
  // → coordination. "Secondary: Movement Quality" and "Upper-Body
  // Longevity" excluded (generic, no distinct counterpart). "Mechanical
  // Robustness" → tissue_capacity (already listed). "Injury Resilience" →
  // tissue_capacity (already listed).
  physicalQualities: ["stability", "tissue_capacity", "coordination"],
  // "# Movement Pattern — Primary: Shoulder Stabilization. Secondary:
  // External Rotation, Internal Rotation, Scapular Control, Dynamic
  // Stabilization." Unlike the ankle/knee isolation entries above, this
  // family's dominant, explicitly repeated joint action IS rotation at the
  // glenohumeral joint — `rotation` is a direct, honest match, not an
  // escape hatch. "Dynamic Stabilization" explicitly names dynamic (not
  // static) control through a range of motion — no "Brace"/static-hold
  // language is named anywhere in this fiche (checked directly), so
  // `isometric` is deliberately NOT added, matching this whole project's
  // established discipline of only adding it when the Movement Pattern
  // section itself names bracing/static-hold language.
  movementPatterns: ["rotation"],
  // "# Biomechanical Profile — Primary Force Vector: Rotational" (exact
  // match).
  forceVectors: ["rotational"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "any_of",
        items: [
          { kind: "equipment", equipment: "cable_machine" },
          { kind: "equipment", equipment: "resistance_band" },
        ],
      },
    ],
  },
  // "# Skill Requirement — Suitable For: All athletes", corroborated by
  // "# Neurological Profile — Skill Requirement: Beginner".
  minimumTechnicalLevel: 1,
  complexity: "low",
  // No unilateral/bilateral statement exists anywhere in this fiche.
  // `exercisePrescriptionRegistry.ts`'s own independent `laterality:
  // "bilateral"` corroborates this directly.
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Supraspinatus, Infraspinatus,
  // Teres Minor, Subscapularis" — the four rotator-cuff muscles, all
  // shoulder-girdle musculature → shoulder.
  bodyRegionsLoaded: ["shoulder"],
  // "# Contraindications", quoted one item per source line. "Medical
  // Clearance Required" is a procedural/administrative flag rather than an
  // athlete-state condition, but is quoted faithfully like every other
  // literal contraindication-list item throughout this project, matching
  // the established discipline of trusting the source's own categorization
  // rather than second-guessing its clinical nuance.
  contraindications: [
    { description: "Acute shoulder injury.", region: "shoulder", prohibitedPatterns: ["rotation"], absolute: true },
    { description: "Post-surgical restrictions.", region: "shoulder", prohibitedPatterns: ["rotation"], absolute: true },
    { description: "Medical clearance required.", prohibitedPatterns: ["rotation"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Very Low. Mechanical
    // Fatigue: Very Low. Metabolic Fatigue: Low." Same fiche-relative
    // Very-Low=1/Low=2 resolution as TIBIALIS_RAISE/SOLEUS_RAISE.
    types: [],
    neural: 1,
    muscular: 1,
    connectiveTissue: 1, // inferred from "Mechanical Fatigue: Very Low"
    metabolic: 2,
    technical: 1, // fallback from "Skill Requirement: Beginner"
  },
  // "# Scientific Evidence — Evidence Level: ★★★★★. ... strongly supported
  // for reducing shoulder injury risk..." — mapped to "Level 1 —
  // Scientific consensus".
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star — a maximal
  // 5-star rating across every discipline, the highest and most uniform
  // combat-relevance profile documented anywhere in this migration so far.
  combatSportRelevance: {
    boxing: 5,
    kickboxing: 5,
    muay_thai: 5,
    wrestling: 5,
    brazilian_jiu_jitsu: 5,
    judo: 5,
    mma: 5,
    krav_maga: 5,
  },
  // "# Regressions" (Side-Lying External Rotation, Supported Band
  // Rotation, Reduced Range of Motion) name no distinct catalog exercise.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Wrist Strengthening
// Source: 50-exercises/43_WRIST_STRENGTHENING
// -----------------------------------------------------------------------------

/**
 * Sixth entry of this batch. `exercisePrescriptionRegistry.ts` has a
 * corroborating `wristStrengtheningEntry` (`requiredEquipmentCapabilities:
 * []`, `moduleId: "robustness"` — matching this entry's own resolution
 * exactly; the registry's own comment explicitly notes this represents
 * only the repetitions variant, structurally excluding the isometric-hold
 * variant — a distinction this `ExerciseDefinition` does not need to make,
 * since it represents the general capability rather than a specific
 * prescription method).
 *
 * Same documentation-format limitation as every entry in this batch: no
 * space/floor-safety language anywhere in this fiche (checked directly).
 *
 * HONESTY NOTE, explicitly flagged per the user's own instruction: "Wrist
 * Strengthening CONSISTS OF targeted exercises..." (plural, explicit) and
 * "# Movement Pattern — Secondary: Flexion, Extension, Radial Deviation,
 * Ulnar Deviation, Pronation, Supination, Grip" together with "#
 * Variations — Flexion, Extension, Pronation, Supination, Deviation, Rice
 * Bucket, Grip Crush, Pinch Grip, Support Grip" aggregate SEVEN-PLUS
 * distinct named directions/movements into one documented exercise. This
 * entry represents that same general wrist-robustness FAMILY, not a single
 * named direction — matching the registry's own identical single-id
 * treatment, and matching the user's own explicit instruction not to
 * fragment a source that itself stays generic into several separate
 * catalog exercises.
 *
 * "# Equipment Requirements — Required: None." No implement is required
 * for any of the aggregated directions — `requirements` is omitted
 * entirely, the same resolution as TIBIALIS_RAISE/SOLEUS_RAISE above.
 */
export const WRIST_STRENGTHENING: ExerciseDefinition = {
  id: "wrist_strengthening",
  name: "Wrist Strengthening",
  module: "robustness",
  primaryAdaptation: "robustness",
  // "# Capability Mapping — Primary: Wrist Stability, Grip Integrity,
  // Force Transmission." "Wrist Stability" → stability. "Grip Integrity" →
  // grip_strength (the closest real quality for a grip-adjacent capacity).
  // "Force Transmission" excluded (generic, matching this whole project's
  // established exclusion of this recurring phrase). "Secondary: Grip
  // Endurance" → grip_strength (already listed, matching FARMER_CARRY's
  // own identical "Grip Endurance" → grip_strength precedent). "Mechanical
  // Robustness" → tissue_capacity. "Joint Control" → coordination. "Impact
  // Tolerance" → tissue_capacity (already listed).
  physicalQualities: ["stability", "grip_strength", "tissue_capacity", "coordination"],
  // MODEL LIMITATION, flagged explicitly: "# Movement Pattern — Primary:
  // Wrist Stabilization. Secondary: Flexion, Extension, Radial Deviation,
  // Ulnar Deviation, Pronation, Supination, Grip." None of these
  // individually named directions has a `MovementPattern` counterpart —
  // the same isolated-single-joint-accessory-movement gap already flagged
  // for TIBIALIS_RAISE/SOLEUS_RAISE above, here compounded across seven
  // named directions rather than one. `"mixed"` is used as the sole value.
  movementPatterns: ["mixed"],
  // "# Biomechanical Profile — Primary Force Vector: Multi-Directional" —
  // `mixed` is a direct, literal match here (not an escape hatch): the
  // fiche's own wording is functionally synonymous with this ForceVector
  // value.
  forceVectors: ["mixed"],
  requiredEquipment: [],
  // No `requirements` object — nothing is documented as required.
  // "# Skill Requirement — Suitable For: All athletes", corroborated by
  // "# Neurological Profile — Skill Requirement: Beginner".
  minimumTechnicalLevel: 1,
  complexity: "low",
  // No unilateral/bilateral statement exists anywhere in this fiche
  // (though "Train both sides equally" implies both wrists are trained,
  // typically one at a time). `exercisePrescriptionRegistry.ts`'s own
  // independent `laterality: "bilateral"` corroborates `unilateral: false`.
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Forearm Flexors, Forearm
  // Extensors, Pronator Teres, Supinator" — all forearm musculature →
  // forearm. No dedicated "wrist" BodyRegion muscle exists (the wrist
  // joint itself has no prime-mover muscles of its own) — matching this
  // catalog's established primary-muscles-only sourcing discipline for
  // `bodyRegionsLoaded`, not the Joint Profile's own "Radiocarpal Joint"
  // heading.
  bodyRegionsLoaded: ["forearm"],
  // "# Contraindications", quoted one item per source line.
  contraindications: [
    { description: "Acute wrist injury.", region: "wrist", prohibitedPatterns: ["mixed"], absolute: true },
    { description: "Acute hand fracture.", region: "hand", prohibitedPatterns: ["mixed"], absolute: true },
    { description: "Acute forearm tendinopathy.", region: "forearm", prohibitedPatterns: ["mixed"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Very Low. Mechanical
    // Fatigue: Very Low. Metabolic Fatigue: Low." Same fiche-relative
    // Very-Low=1/Low=2 resolution as TIBIALIS_RAISE/SOLEUS_RAISE/
    // ROTATOR_CUFF_TRAINING.
    types: [],
    neural: 1,
    muscular: 1,
    connectiveTissue: 1, // inferred from "Mechanical Fatigue: Very Low"
    metabolic: 2,
    technical: 1, // fallback from "Skill Requirement: Beginner"
  },
  // "# Scientific Evidence — Evidence Level: ★★★★☆. ... improves... and
  // tolerance to repetitive loading..." — the second 4-star, moderately
  // hedged rating in this batch (matching TIBIALIS_RAISE's own identical
  // resolution) — mapped to "Level 2 — Expert practice", not "Level 1".
  evidenceLevel: "level_2",
  // "# Transfer to Combat Sports" table, quoted star-for-star — a maximal
  // 5-star rating across every discipline, matching ROTATOR_CUFF_TRAINING's
  // own identical table.
  combatSportRelevance: {
    boxing: 5,
    kickboxing: 5,
    muay_thai: 5,
    wrestling: 5,
    brazilian_jiu_jitsu: 5,
    judo: 5,
    mma: 5,
    krav_maga: 5,
  },
  // "# Regressions" (Light Dumbbell, Band Resistance, Isometric Holds)
  // name no distinct catalog exercise.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Neck Training
// Source: 50-exercises/34_NECK_TRAINING
// -----------------------------------------------------------------------------

/**
 * Seventh and final entry of this batch. No `exercisePrescriptionRegistry.ts`
 * entry exists for `neck_training` (confirmed by direct search) — a known
 * limitation, documented here without modifying that registry.
 *
 * Same documentation-format limitation as every entry in this batch: no
 * space/floor-safety language anywhere in this fiche (checked directly).
 *
 * Central business question for this entry, explicitly flagged before
 * writing began: "# Equipment Requirements — Required: None. Optional:
 * Neck Harness, Resistance Bands, Partner, Weight Plate, Neck Machine."
 * "Partner" appears ONLY under Optional, never Required — directly
 * answering whether human assistance is genuinely mandatory here: it is
 * NOT. No `human_assistance` clause is added, and — since nothing at all
 * is documented as required (no implement, no space, no assistance) —
 * `requirements` is omitted entirely, exactly like TIBIALIS_RAISE/
 * SOLEUS_RAISE/WRIST_STRENGTHENING above. No `"other"` placeholder is
 * introduced either: `"other"` exists to flag a REQUIRED-but-unrepresentable
 * implement, and nothing here is required in the first place — inventing
 * one would be precisely the undocumented, unjustified use the user's own
 * instructions warned against.
 *
 * "# Primary Classification: Strength" — unlike every other entry in this
 * batch (all of which say "Robustness"), this fiche uses the same word as
 * NORDIC_HAMSTRING_CURL above, hence `primaryAdaptation: "maximum_strength"`
 * rather than `"robustness"`.
 *
 * Partial MovementPattern coverage: "# Movement Pattern — Primary:
 * Cervical Stabilization. Secondary: Flexion, Extension, Lateral Flexion,
 * Rotation, Anti-Rotation." Unlike the ankle/wrist entries above (zero
 * clean matches), "Rotation" and "Anti-Rotation" here map directly and
 * honestly to existing MovementPattern values — "Flexion"/"Extension"/
 * "Lateral Flexion" (sagittal/frontal-plane cervical movement) still have
 * no counterpart and are a flagged, PARTIAL representational gap, left
 * unfilled rather than padded with `"mixed"` alongside the two genuine
 * matches (mixed is reserved for when nothing more specific applies, not
 * as a catch-all appended alongside real matches).
 */
export const NECK_TRAINING: ExerciseDefinition = {
  id: "neck_training",
  name: "Neck Training",
  module: "strength",
  primaryAdaptation: "maximum_strength",
  // "# Capability Mapping — Primary: Neck Strength, Neck Endurance, Head
  // Stability." "Neck Strength" has no distinct region-specific
  // PhysicalQuality counterpart and is not force-fitted (matching the
  // "Posterior Chain Strength"/"Adductor Strength" exclusion precedent
  // already established in this batch — already substantively covered by
  // `bodyRegionsLoaded`). "Neck Endurance" → muscular_endurance (direct
  // match). "Head Stability" → stability. "Secondary: Mechanical
  // Robustness" → tissue_capacity. "Postural Control" → stability (already
  // listed). "Clinch Stability" → stability (already listed, redundant).
  // "Injury Resilience" → tissue_capacity (already listed). "Movement
  // Efficiency" excluded (generic).
  physicalQualities: ["muscular_endurance", "stability", "tissue_capacity"],
  // See block comment above. "Rotation" → rotation (exact match).
  // "Anti-Rotation" → anti_rotation (exact match). "# Movement Context —
  // ... Isometric, Dynamic" explicitly names Isometric as one of this
  // exercise's own named execution modes (not merely a Contraction Profile
  // star rating), directly corroborated by "# Contraction Profile —
  // Isometric ★★★★★" — `isometric` is added on this explicit basis.
  movementPatterns: ["rotation", "anti_rotation", "isometric"],
  // "# Biomechanical Profile — Primary Force Vector: Multi-Directional" →
  // mixed (the same direct, literal match already used for
  // WRIST_STRENGTHENING above).
  forceVectors: ["mixed"],
  requiredEquipment: [],
  // No `requirements` object — nothing is documented as required (see
  // block comment above).
  // "# Skill Requirement — Suitable For: Beginners, Intermediate,
  // Advanced, Elite", corroborated by "# Neurological Profile — Skill
  // Requirement: Beginner" (the same Beginner-accessible framing as every
  // other entry in this batch).
  minimumTechnicalLevel: 1,
  complexity: "low",
  // No unilateral/bilateral statement exists anywhere in this fiche —
  // cervical rotation/lateral flexion can be performed to either side, but
  // no per-side prescription language is documented.
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Sternocleidomastoid, Deep Neck
  // Flexors, Upper Trapezius, Splenius Capitis, Levator Scapulae" — all
  // named primarily for their cervical-stabilization function in this
  // fiche's own framing → neck.
  bodyRegionsLoaded: ["neck"],
  // "# Contraindications", quoted one item per source line. "Acute
  // Cervical Injury" and "Cervical Disc Pathology" both concern the neck,
  // but are tagged with distinct BodyRegion values: `neck` for the general
  // muscular/soft-tissue injury, `cervical_spine` for the explicitly
  // spinal/disc-level pathology. "Acute Concussion" is tagged `head`.
  // "Medical Clearance Required" is procedural and carries no region,
  // matching ROTATOR_CUFF_TRAINING's own identical treatment above.
  contraindications: [
    { description: "Acute cervical injury.", region: "neck", prohibitedPatterns: ["rotation", "anti_rotation", "isometric"], absolute: true },
    { description: "Acute concussion.", region: "head", prohibitedPatterns: ["rotation", "anti_rotation", "isometric"], absolute: true },
    { description: "Cervical disc pathology.", region: "cervical_spine", prohibitedPatterns: ["rotation", "anti_rotation", "isometric"], absolute: true },
    { description: "Medical clearance required.", prohibitedPatterns: ["rotation", "anti_rotation", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Low. Mechanical Fatigue:
    // Low. Metabolic Fatigue: Low." Unlike TIBIALIS_RAISE/SOLEUS_RAISE/
    // ROTATOR_CUFF_TRAINING/WRIST_STRENGTHENING above, this fiche's own
    // per-dimension vocabulary never uses "Very Low" at all (only the
    // AGGREGATE "Overall Fatigue Cost: Very Low" summary line does) — the
    // baseline Low=1 mapping already established throughout Lots 1–3 is
    // used directly here, not the fiche-relative Very-Low=1/Low=2 scale
    // used for this batch's other four robustness entries.
    types: [],
    neural: 1,
    muscular: 1,
    connectiveTissue: 1, // inferred from "Mechanical Fatigue: Low"
    metabolic: 1,
    technical: 1, // fallback from "Skill Requirement: Beginner" (minimumTechnicalLevel 1)
  },
  // "# Scientific Evidence — Evidence Level: ★★★★★. Progressive neck
  // strengthening... has been associated with enhanced head stability and
  // reduced injury risk..." — a full 5-star rating with confident
  // (associative but not weakly hedged) language, mapped to "Level 1 —
  // Scientific consensus".
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star. Savate is
  // named in this table but has no `CombatSport` enum counterpart and is
  // omitted rather than force-mapped.
  combatSportRelevance: {
    boxing: 5,
    kickboxing: 5,
    muay_thai: 5,
    wrestling: 5,
    brazilian_jiu_jitsu: 5,
    judo: 5,
    mma: 5,
    krav_maga: 5,
  },
  // "# Regressions" (Manual Isometrics, Bodyweight Holds, Band-Assisted
  // Neck Work) name no distinct catalog exercise.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Technical Stand-Up
// Source: 50-exercises/35_TECHNICAL_STAND_UP
// -----------------------------------------------------------------------------

/**
 * First entry of the "Lot 5 — Ground movement et transitions" batch,
 * migrated alongside BEAR_CRAWL/SHRIMPING/BRIDGING/TURKISH_GET_UP. No
 * `exercisePrescriptionRegistry.ts` entry exists for any of the five
 * exercises in this batch (confirmed by direct search for each) — a known
 * limitation, documented here without modifying that registry.
 *
 * Central business question for this entry, explicitly flagged before
 * writing began: "# Equipment Requirements — Required: Mat." Unlike
 * TIBIALIS_RAISE/SOLEUS_RAISE/WRIST_STRENGTHENING/NECK_TRAINING in Lot 4
 * (all genuinely equipment-free), this fiche's own Required heading names
 * a real implement — the existing `mat` `EquipmentType` is used directly,
 * not `floor_safe`: `mat` is a physical item the athlete places down,
 * while `floor_safe` is an environment capability describing the floor
 * itself — these answer different questions, and the fiche names the
 * former, not the latter. "Optional: Training Partner, Obstacle,
 * Protective Equipment" — Training Partner is never Required, so no
 * `human_assistance` clause is added.
 *
 * No "Space Requirement" heading or quantified distance/area figure exists
 * anywhere in this fiche (checked directly) — `sufficient_space` is not
 * added, matching this whole documentary format's established gap.
 *
 * MODEL LIMITATION, flagged explicitly: "# Movement Pattern — Primary:
 * Ground-to-Standing Transition." No `MovementPattern` value represents a
 * whole-body ground-to-standing transition — this taxonomy has compound
 * patterns for squat/hinge/push/pull/carry/locomotion/jump/throw/sprint
 * families, but no dedicated slot for this specific combat-transition
 * archetype. `"mixed"` is used for the PRIMARY pattern (the same escape
 * hatch already used repeatedly in Lot 4), alongside `locomotion`
 * (explicitly named as its own secondary pattern) and `isometric` (from
 * the explicitly named "Brace" secondary pattern).
 *
 * DOCUMENTED TENSION, not silently resolved either way: "# Neurological
 * Profile — Motor Complexity ★★★★★, Coordination Requirement ★★★★★,
 * Balance Requirement ★★★★★" are all maxed out, yet the fiche's own
 * dedicated "# Skill Requirement" heading lists "Suitable For: Beginners,
 * Intermediate, Advanced, Elite" and the Neurological Profile's own
 * internal "Skill Requirement: Beginner" sub-field says "Beginner" — the
 * same dedicated-heading-governs-over-internal-ratings discipline already
 * applied throughout this project is used here too (see LANDMINE_PRESS's
 * own precedent in Lot 3), resolving to minimumTechnicalLevel 1 / "low"
 * despite the maxed coordination/balance ratings — a genuine internal
 * tension in the source fiche, surfaced here rather than silently
 * smoothed over in either direction.
 */
export const TECHNICAL_STAND_UP: ExerciseDefinition = {
  id: "technical_stand_up",
  name: "Technical Stand-Up",
  module: "movement",
  // "# Primary Classification: Combat-Specific Movement" — no
  // `AdaptationDomain` value is literally "combat-specific", but
  // `"specific_skill"` is a direct, literal match for this exact framing
  // (the first use of this AdaptationDomain value anywhere in this
  // catalog) — distinct from the generic movement-quality framing used by
  // BEAR_CRAWL/TURKISH_GET_UP below, whose own Primary Classifications
  // never use the words "Combat-Specific".
  primaryAdaptation: "specific_skill",
  // "# Capability Mapping — Primary: Ground Transition Efficiency,
  // Movement Coordination, Balance." "Ground Transition Efficiency" is
  // generic/movement-efficiency-flavored with no distinct counterpart and
  // is excluded, matching this whole project's established exclusion of
  // this recurring phrase-family. "Movement Coordination" → coordination.
  // "Balance" → balance (exact match). "Secondary: Core Stability" →
  // trunk_strength. "Reaction Speed" has no clean PhysicalQuality
  // counterpart — neither `speed` (raw velocity) nor `agility`
  // (change-of-direction capacity) honestly captures a reaction-time
  // concept, and it is deliberately not force-fitted into either.
  // "Mobility" → mobility (exact match). "Movement Efficiency" and "Combat
  // Readiness" excluded (generic).
  physicalQualities: ["coordination", "balance", "trunk_strength", "mobility"],
  // See block comment above for the full reasoning.
  movementPatterns: ["mixed", "locomotion", "isometric"],
  // "# Biomechanical Profile — Primary Force Vector: Multi-Directional" —
  // `mixed` is a direct, literal match (the same resolution already used
  // for WRIST_STRENGTHENING/NECK_TRAINING in Lot 4).
  forceVectors: ["mixed"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [{ kind: "equipment", equipment: "mat" }],
      },
    ],
  },
  // See block comment above for the documented tension this resolves.
  minimumTechnicalLevel: 1,
  complexity: "low",
  // No unilateral/bilateral statement exists anywhere in this fiche —
  // the transition typically posts through one preferred arm/leg but no
  // per-side prescription language is documented.
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Core, Gluteus Maximus,
  // Quadriceps, Shoulders, Triceps" → abdomen (Core), hip (Gluteus
  // Maximus), thigh (Quadriceps), shoulder (Shoulders), upper_arm
  // (Triceps) — the broadest primary-muscle spread in this batch, directly
  // corroborated by this fiche's own "Entire Body" kinetic chain framing.
  bodyRegionsLoaded: ["abdomen", "hip", "thigh", "shoulder", "upper_arm"],
  // "# Contraindications", quoted one item per source line.
  contraindications: [
    { description: "Acute wrist injury.", region: "wrist", prohibitedPatterns: ["mixed", "locomotion", "isometric"], absolute: true },
    { description: "Acute shoulder injury.", region: "shoulder", prohibitedPatterns: ["mixed", "locomotion", "isometric"], absolute: true },
    { description: "Acute knee injury.", region: "knee", prohibitedPatterns: ["mixed", "locomotion", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Low. Mechanical Fatigue:
    // Low. Metabolic Fatigue: Low." Unlike several Lot 4 entries, this
    // fiche's own per-dimension vocabulary never uses "Very Low" at all
    // (only the aggregate "Overall Fatigue Cost: Very Low" summary line
    // does) — the baseline Low=1 mapping established throughout Lots 1–3
    // is used directly, matching NECK_TRAINING's own identical resolution
    // in Lot 4.
    types: [],
    neural: 1,
    muscular: 1,
    connectiveTissue: 1, // inferred from "Mechanical Fatigue: Low"
    metabolic: 1,
    technical: 1, // fallback from "Skill Requirement: Beginner" (minimumTechnicalLevel 1)
  },
  // "# Scientific Evidence — Evidence Level: ★★★★★. Ground transition
  // drills improve movement efficiency, coordination and combat
  // readiness..." — mapped to the CAS Evidence Framework's "Level 1 —
  // Scientific consensus" (20-engine/02_EXERCISE_KNOWLEDGE_BASE.md).
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star. Boxing's
  // own notably low 2-star rating (the lowest documented for this
  // discipline anywhere in this migration so far) directly reflects the
  // absence of ground fighting in boxing. Savate/Sambo are named in this
  // table but have no `CombatSport` enum counterpart and are omitted
  // rather than force-mapped.
  combatSportRelevance: {
    boxing: 2,
    kickboxing: 3,
    muay_thai: 3,
    wrestling: 5,
    brazilian_jiu_jitsu: 5,
    judo: 5,
    mma: 5,
    krav_maga: 5,
  },
  // "# Regressions" (Segmented Stand-Up, Slow Technical Repetition,
  // Supported Technical Stand-Up) name no exercise with its own
  // chapter/catalog id anywhere in this repository (confirmed by direct
  // search). `substitutionExerciseIds` is genuinely empty for this entry.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Bear Crawl
// Source: 50-exercises/37_BEAR_CRAWL
// -----------------------------------------------------------------------------

/**
 * Second entry of this batch. No `exercisePrescriptionRegistry.ts` entry
 * exists for `bear_crawl` (confirmed by direct search) — a known
 * limitation, documented here without modifying that registry.
 *
 * "# Equipment Requirements — Required: None." A fully equipment-free
 * exercise — `requiredEquipment: []` with no equipment atom in
 * `requirements`.
 *
 * Central business question for this entry, explicitly flagged before
 * writing began: unlike every other entry in this batch (and unlike every
 * Lot 1–4 entry from this same documentary format), this fiche's own "#
 * Loading Profile — Typical Volume: 3–8 sets, 10–30 meters" gives a
 * genuine, QUANTIFIED distance figure even though no dedicated "Space
 * Requirement" heading exists — the same kind of concrete numeric anchor
 * already used to ground `minimumSpace: "large"` for ROPE_PULL's own
 * "5 to 15 metres... 10 to 30 metres" distance figures in the 65_GRIP
 * chapter. This is NOT the same as silently inventing a space requirement
 * from vague implication — it is a directly quoted, quantified distance
 * this exercise's own continuous locomotion genuinely requires.
 *
 * "# Movement Pattern — Primary: Quadrupedal Locomotion" → `locomotion`
 * is a direct, honest match (the "quadrupedal" qualifier describes HOW the
 * locomotion happens, not a different pattern). "Coaching Cues — Move
 * opposite hand and foot together" describes a CONTRALATERAL gait pattern,
 * not a unilateral one — the same contralateral-is-not-unilateral
 * resolution already applied to DEAD_BUG in 62_CORE.
 */
export const BEAR_CRAWL: ExerciseDefinition = {
  id: "bear_crawl",
  name: "Bear Crawl",
  module: "movement",
  // "# Primary Classification: Athletic Development" — no direct
  // `AdaptationDomain` match; `"movement"` is used, matching the strong
  // "Movement Quality"/"Neuromotor Training" Secondary Classifications and
  // the identical resolution already used for AB_WHEEL/PALLOF_PRESS/
  // COPENHAGEN_PLANK.
  primaryAdaptation: "movement",
  // "# Capability Mapping — Primary: Movement Coordination, Core
  // Stability, Shoulder Stability" → coordination, trunk_strength,
  // stability. "Secondary: Work Capacity" → general_work_capacity (exact
  // match). "Locomotion Efficiency" excluded (generic). "Mechanical
  // Robustness" → tissue_capacity. "Postural Control" → stability (already
  // listed). "Combat Readiness" excluded (generic).
  physicalQualities: ["coordination", "trunk_strength", "stability", "general_work_capacity", "tissue_capacity"],
  // "# Movement Pattern — Primary: Quadrupedal Locomotion" → locomotion.
  // "Secondary: Cross-Body Coordination, Brace, Shoulder Stabilization,
  // Hip Stabilization, Locomotion" → isometric (from Brace); the
  // coordination/stabilization items are joint-action-level detail already
  // captured via `physicalQualities`.
  movementPatterns: ["locomotion", "isometric"],
  // "# Biomechanical Profile — Primary Force Vector: Horizontal. Secondary
  // Force Vector: Vertical Stabilization." No "Minimal" hedge — both are
  // kept, matching BARBELL_ROW's own identical unhedged secondary vector
  // in Lot 2.
  forceVectors: ["horizontal", "vertical"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [{ kind: "environment", capability: "sufficient_space", minimumSpace: "large" }],
      },
    ],
  },
  // "# Skill Requirement — Suitable For: Beginners, Intermediate,
  // Advanced, Elite", corroborated by "# Neurological Profile — Skill
  // Requirement: Beginner".
  minimumTechnicalLevel: 1,
  complexity: "low",
  // Contralateral gait ("opposite hand and foot together"), not a
  // per-side unilateral prescription — see block comment above.
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Core, Anterior Deltoids,
  // Serratus Anterior, Quadriceps, Gluteus Maximus" → abdomen (Core),
  // shoulder (Anterior Deltoids, Serratus Anterior), thigh (Quadriceps),
  // hip (Gluteus Maximus).
  bodyRegionsLoaded: ["abdomen", "shoulder", "thigh", "hip"],
  // "# Contraindications", quoted one item per source line.
  contraindications: [
    { description: "Acute wrist injury.", region: "wrist", prohibitedPatterns: ["locomotion", "isometric"], absolute: true },
    { description: "Acute shoulder injury.", region: "shoulder", prohibitedPatterns: ["locomotion", "isometric"], absolute: true },
    { description: "Acute knee injury.", region: "knee", prohibitedPatterns: ["locomotion", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Moderate. Mechanical
    // Fatigue: Low. Metabolic Fatigue: Moderate. Overall Fatigue Cost: Low
    // to Moderate." mapped via the Low=1/Moderate=2 word scale established
    // throughout Lots 1–4.
    types: [],
    neural: 2,
    muscular: 1,
    connectiveTissue: 1, // inferred from "Mechanical Fatigue: Low"
    metabolic: 2,
    technical: 1, // fallback from "Skill Requirement: Beginner"
  },
  // "# Scientific Evidence — Evidence Level: ★★★★★. Quadrupedal locomotion
  // effectively develops... integrated movement patterns relevant to
  // athletic performance." — mapped to "Level 1 — Scientific consensus".
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star. Savate is
  // named in this table but has no `CombatSport` enum counterpart and is
  // omitted rather than force-mapped.
  combatSportRelevance: {
    boxing: 4,
    kickboxing: 4,
    muay_thai: 4,
    wrestling: 5,
    brazilian_jiu_jitsu: 5,
    judo: 5,
    mma: 5,
    krav_maga: 5,
  },
  // "# Regressions" (Static Bear Hold, Short Distance Crawl, Quadruped
  // March) name no exercise with its own chapter/catalog id anywhere in
  // this repository (confirmed by direct search).
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Shrimping (Hip Escape)
// Source: 50-exercises/38_SHRIMPING
// -----------------------------------------------------------------------------

/**
 * Third entry of this batch. No `exercisePrescriptionRegistry.ts` entry
 * exists for `shrimping` (confirmed by direct search) — a known
 * limitation, documented here without modifying that registry.
 *
 * Same `mat`-required resolution as TECHNICAL_STAND_UP: "# Equipment
 * Requirements — Required: Mat. Optional: Training Partner, Resistance
 * Band, Obstacle." Training Partner is never Required — no
 * `human_assistance` clause is added, directly answering the user's own
 * instruction not to invent a partner requirement for an exercise that is
 * genuinely solo-executable.
 *
 * No quantified distance/area figure exists anywhere in this fiche
 * (unlike BEAR_CRAWL's own "10–30 meters") — `sufficient_space` is not
 * added.
 *
 * MODEL LIMITATION, flagged explicitly: "# Movement Pattern — Primary:
 * Hip Escape." No `MovementPattern` value represents this specific
 * grappling technique — `"mixed"` is used for the PRIMARY pattern, the
 * same escape hatch already used repeatedly in this batch and in Lot 4.
 * "Secondary: Hip Extension, Hip Flexion, Core Rotation, Brace, Ground
 * Locomotion" partially resolves: `rotation` (from "Core Rotation"),
 * `locomotion` (from "Ground Locomotion", explicit), `isometric` (from
 * "Brace") — "Hip Extension"/"Hip Flexion" have no counterpart and remain
 * unmapped, already substantively captured via `bodyRegionsLoaded`.
 */
export const SHRIMPING: ExerciseDefinition = {
  id: "shrimping",
  name: "Shrimping (Hip Escape)",
  module: "movement",
  // "# Primary Classification: Combat-Specific Movement" — identical
  // wording to TECHNICAL_STAND_UP's own Primary Classification, hence the
  // identical `"specific_skill"` resolution.
  primaryAdaptation: "specific_skill",
  // "# Capability Mapping — Primary: Ground Mobility, Hip Mobility,
  // Movement Coordination." "Ground Mobility" and "Hip Mobility" both
  // point to the same underlying quality and are folded into a single
  // `mobility` entry, not double-counted. "Movement Coordination" →
  // coordination. "Secondary: Core Stability" → trunk_strength.
  // "Positional Recovery" excluded (generic combat-specific concept, no
  // distinct counterpart). "Movement Efficiency"/"Combat Readiness"
  // excluded (generic). "Mechanical Robustness" → tissue_capacity.
  physicalQualities: ["mobility", "coordination", "trunk_strength", "tissue_capacity"],
  // See block comment above for the full reasoning.
  movementPatterns: ["mixed", "rotation", "locomotion", "isometric"],
  // "# Biomechanical Profile — Primary Force Vector: Horizontal. Secondary
  // Force Vector: Rotational." No "Minimal" hedge — both are kept.
  forceVectors: ["horizontal", "rotational"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [{ kind: "equipment", equipment: "mat" }],
      },
    ],
  },
  // "# Skill Requirement — Suitable For: Beginners, Intermediate,
  // Advanced, Elite", corroborated by "# Neurological Profile — Skill
  // Requirement: Beginner".
  minimumTechnicalLevel: 1,
  complexity: "low",
  // No per-side prescription language exists anywhere in this fiche
  // (Loading Profile: "10–20 repetitions or 20–60 seconds", never "per
  // side") — the movement alternates sides across a set but is not
  // documented as a per-side unilateral prescription, the same
  // contralateral-is-not-unilateral resolution already applied to
  // BEAR_CRAWL above and DEAD_BUG in 62_CORE.
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Obliques, Rectus Abdominis,
  // Gluteus Maximus, Hip Flexors, Hamstrings" → abdomen (Obliques, Rectus
  // Abdominis), hip (Gluteus Maximus, Hip Flexors), thigh (Hamstrings).
  bodyRegionsLoaded: ["abdomen", "hip", "thigh"],
  // "# Contraindications", quoted one item per source line.
  contraindications: [
    { description: "Acute shoulder injury.", region: "shoulder", prohibitedPatterns: ["mixed", "rotation", "locomotion", "isometric"], absolute: true },
    { description: "Acute hip injury.", region: "hip", prohibitedPatterns: ["mixed", "rotation", "locomotion", "isometric"], absolute: true },
    { description: "Acute lumbar injury.", region: "lumbar_spine", prohibitedPatterns: ["mixed", "rotation", "locomotion", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Low. Mechanical Fatigue:
    // Low. Metabolic Fatigue: Low." Per-dimension vocabulary never uses
    // "Very Low" (only the aggregate summary does) — baseline Low=1,
    // matching TECHNICAL_STAND_UP's own identical resolution.
    types: [],
    neural: 1,
    muscular: 1,
    connectiveTissue: 1, // inferred from "Mechanical Fatigue: Low"
    metabolic: 1,
    technical: 1, // fallback from "Skill Requirement: Beginner"
  },
  // "# Scientific Evidence — Evidence Level: ★★★★★. Ground locomotion
  // drills improve movement coordination, positional recovery and
  // sport-specific efficiency..." — mapped to "Level 1 — Scientific
  // consensus".
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star. Boxing's
  // own 1-star rating is the lowest documented for any discipline
  // anywhere in this migration so far, directly reflecting the complete
  // absence of ground fighting in boxing. Savate/Sambo are named in this
  // table but have no `CombatSport` enum counterpart and are omitted
  // rather than force-mapped.
  combatSportRelevance: {
    boxing: 1,
    kickboxing: 2,
    muay_thai: 2,
    wrestling: 4,
    brazilian_jiu_jitsu: 5,
    judo: 4,
    mma: 5,
    krav_maga: 5,
  },
  // "# Progressions" names "Shrimp to Technical Stand-Up" — a COMPOUND
  // drill name combining two movements, not a standalone reference to
  // "Technical Stand-Up" as a substitute (the same discipline already
  // applied to CHIN_UP's own "Weighted Chin-Up" in Lot 2, which was not
  // resolved to `weighted_pull_up` for an identical reason). "#
  // Regressions" (Segmented Hip Escape, Slow Technical Shrimp, Assisted
  // Movement) name no exercise with its own chapter/catalog id either.
  // `substitutionExerciseIds` is genuinely empty for this entry.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Bridging
// Source: 50-exercises/39_BRIDGING
// -----------------------------------------------------------------------------

/**
 * Fourth entry of this batch. No `exercisePrescriptionRegistry.ts` entry
 * exists for `bridging` (confirmed by direct search) — a known limitation,
 * documented here without modifying that registry.
 *
 * Central business question for this entry, explicitly flagged before
 * writing began: this fiche's own "# Regressions — Static Bridge,
 * Segmented Bridge, Glute Bridge, Hip Lift" lists the musculation-style
 * "Glute Bridge"/"Hip Lift" as EASIER REGRESSIONS of THIS exercise, never
 * as its own base/default identity — the canonical, default form
 * documented here is the explosive, whole-body GRAPPLING bridge (Primary
 * Classification: "Combat-Specific Movement"; "# Variations — ...
 * Wrestling Bridge, BJJ Bridge, Explosive Bridge"), not a hip-thrust-style
 * strength accessory. This distinction is preserved faithfully rather than
 * blended: `bridging` represents the grappling escape/reversal movement,
 * not a generic glute-bridge strength exercise.
 *
 * Same `mat`-required resolution as TECHNICAL_STAND_UP/SHRIMPING: "#
 * Equipment Requirements — Required: Mat. Optional: Partner, Resistance
 * Band, Swiss Ball." Partner is never Required — no `human_assistance`
 * clause is added. No load of any kind is required — matching the user's
 * own explicit instruction not to invent a charge requirement without a
 * documentary source.
 *
 * MODEL LIMITATION, flagged explicitly: "# Movement Pattern — Primary:
 * Bridge." No `MovementPattern` value represents this specific grappling
 * technique — `"mixed"` is used for the PRIMARY pattern. "Secondary: Hip
 * Extension, Shoulder Support, Neck Stability, Ground Transition,
 * Rotation" partially resolves: `rotation` (exact match, corroborated by
 * "# Variations — ... Bridge with Rotation"); "Hip Extension"/"Shoulder
 * Support"/"Neck Stability"/"Ground Transition" have no counterpart and
 * remain unmapped. No "Brace" language is named anywhere in this fiche's
 * own Movement Pattern section (checked directly, unlike
 * TECHNICAL_STAND_UP/BEAR_CRAWL/SHRIMPING above) — `isometric` is
 * deliberately NOT added despite a fairly high Contraction Profile
 * isometric rating, matching this whole project's established discipline
 * of only adding it when the Movement Pattern section itself names
 * bracing/static-hold language.
 */
export const BRIDGING: ExerciseDefinition = {
  id: "bridging",
  name: "Bridging",
  module: "movement",
  // "# Primary Classification: Combat-Specific Movement" — identical
  // wording to TECHNICAL_STAND_UP/SHRIMPING, hence the identical
  // `"specific_skill"` resolution.
  primaryAdaptation: "specific_skill",
  // "# Capability Mapping — Primary: Hip Power, Ground Mobility,
  // Positional Escape." "Hip Power" → explosive_strength, directly
  // grounded by "# Biomechanical Profile — Rate of Force Development:
  // High", "# Velocity Profile: Explosive" and the "Explosive Bridge"
  // progression — a genuine, textually-strong match, not a stretch.
  // "Ground Mobility" → mobility. "Positional Escape" excluded (generic
  // combat-specific concept, matching the "Positional Recovery" exclusion
  // already established for SHRIMPING above). "Secondary: Core Stability"
  // → trunk_strength. "Neck Stability" → stability. "Movement
  // Coordination" → coordination. "Mechanical Robustness" →
  // tissue_capacity. "Ground Transition Efficiency" excluded (generic).
  physicalQualities: ["explosive_strength", "mobility", "trunk_strength", "stability", "coordination", "tissue_capacity"],
  // See block comment above for the full reasoning.
  movementPatterns: ["mixed", "rotation"],
  // "# Biomechanical Profile — Primary Force Vector: Vertical. Secondary
  // Force Vector: Horizontal." No "Minimal" hedge — both are kept.
  forceVectors: ["vertical", "horizontal"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [{ kind: "equipment", equipment: "mat" }],
      },
    ],
  },
  // "# Skill Requirement — Suitable For: Beginners, Intermediate,
  // Advanced, Elite", corroborated by "# Neurological Profile — Skill
  // Requirement: Beginner".
  minimumTechnicalLevel: 1,
  complexity: "low",
  // "# Variations — ... Single-Leg Bridge" names single-leg execution as
  // a documented but non-default variation — the bilateral base form is
  // the default, matching this catalog's established "variations aren't
  // the base form" discipline.
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Gluteus Maximus, Hamstrings,
  // Erector Spinae, Core" → hip (Gluteus Maximus), thigh (Hamstrings),
  // abdomen (Erector Spinae, Core — matching FARMER_CARRY's own
  // established "Spinal Stabilizers" → abdomen trunk-muscle convention).
  bodyRegionsLoaded: ["hip", "thigh", "abdomen"],
  // "# Contraindications", quoted one item per source line.
  contraindications: [
    { description: "Acute cervical injury.", region: "neck", prohibitedPatterns: ["mixed", "rotation"], absolute: true },
    { description: "Acute lumbar injury.", region: "lumbar_spine", prohibitedPatterns: ["mixed", "rotation"], absolute: true },
    { description: "Acute shoulder injury.", region: "shoulder", prohibitedPatterns: ["mixed", "rotation"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Low. Mechanical Fatigue:
    // Low. Metabolic Fatigue: Low." Per-dimension vocabulary never uses
    // "Very Low" — baseline Low=1, matching TECHNICAL_STAND_UP's/
    // SHRIMPING's own identical resolution.
    types: [],
    neural: 1,
    muscular: 1,
    connectiveTissue: 1, // inferred from "Mechanical Fatigue: Low"
    metabolic: 1,
    technical: 1, // fallback from "Skill Requirement: Beginner"
  },
  // "# Scientific Evidence — Evidence Level: ★★★★★. Ground bridging
  // drills effectively improve hip power, posterior-chain activation,
  // movement coordination and positional escape mechanics..." — mapped to
  // "Level 1 — Scientific consensus".
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star — a
  // strikingly low striking-sport profile (Boxing 1 star, matching
  // SHRIMPING's own identical rating) alongside a maximal grappling
  // profile, the clearest discipline-specificity split documented in this
  // batch.
  combatSportRelevance: {
    boxing: 1,
    kickboxing: 2,
    muay_thai: 2,
    wrestling: 5,
    brazilian_jiu_jitsu: 5,
    judo: 5,
    mma: 5,
    krav_maga: 5,
  },
  // "# Progressions" names "Bridge to Technical Stand-Up" — the same
  // compound-drill-name pattern already excluded for SHRIMPING's own
  // "Shrimp to Technical Stand-Up" above, not a standalone substitute
  // reference. "# Regressions" (Static Bridge, Segmented Bridge, Glute
  // Bridge, Hip Lift) name no exercise with its own chapter/catalog id in
  // this repository — "Glute Bridge"/"Hip Lift" are documented regressions
  // of THIS exercise, not separate catalog entries.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Turkish Get-Up
// Source: 50-exercises/40_TURKISH_GET_UP
// -----------------------------------------------------------------------------

/**
 * Fifth and final entry of this batch. No `exercisePrescriptionRegistry.ts`
 * entry exists for `turkish_get_up` (confirmed by direct search) — a known
 * limitation, documented here without modifying that registry.
 *
 * Central business question for this entry, explicitly flagged before
 * writing began: "# Equipment Requirements — Required: Kettlebell, or
 * Dumbbell. Optional: Sandbag, Barbell." A genuine literal "or" in the
 * Required heading, matching CHEST_SUPPORTED_ROW's own established
 * precedent in Lot 2 — `any_of[kettlebell, dumbbell]`. "# Regressions —
 * Segmented Get-Up, Bodyweight Get-Up, Half Get-Up" lists "Bodyweight
 * Get-Up" as a documented REGRESSION, not the base/default form — unlike
 * BULGARIAN_SPLIT_SQUAT in Lot 1 (where the bodyweight variant WAS the
 * base form), the loaded version is this exercise's own canonical
 * identity, and the requirement genuinely gates on real load.
 *
 * Notably, unlike TECHNICAL_STAND_UP/SHRIMPING/BRIDGING above (all of
 * which explicitly require a Mat), this fiche names NO mat anywhere —
 * not even as Optional (checked directly). This is preserved as a
 * faithful, real textual difference rather than "corrected" for
 * consistency with the other ground-transition entries in this batch.
 *
 * DOCUMENTED, DELIBERATE UPWARD ADJUSTMENT: "# Skill Requirement:
 * Intermediate" is the plain, unhedged word, which this catalog's
 * established convention would normally map to minimumTechnicalLevel 3 /
 * "moderate". This entry deliberately departs from that default mapping:
 * "# Neurological Profile — Motor Complexity ★★★★★, Coordination
 * Requirement ★★★★★, Balance Requirement ★★★★★, ... Learning Curve: Long"
 * — the FIRST "Long" learning curve encountered anywhere in this
 * migration (every other exercise so far tops out at "Moderate") — and
 * "Mechanical Demand ★★★★★"/"Neuromuscular Demand ★★★★★" are both maxed,
 * an unprecedented density of 5-star ratings. "# Athlete Suitability —
 * Suitable For: Intermediate, Advanced, Elite. Beginners after technical
 * instruction" also notably excludes Beginners from the direct list,
 * unlike every other exercise in this batch. Mapped to
 * minimumTechnicalLevel 4 / "high" — a conservative, safety-oriented
 * upward rounding directly grounded in this convergent evidence, the same
 * kind of adjustment already established for MED_BALL_SCOOP_TOSS
 * (rounding "Low to Moderate" up) and DRAGON_FLAG (Level 5 in 62_CORE) —
 * not an invented constraint.
 */
export const TURKISH_GET_UP: ExerciseDefinition = {
  id: "turkish_get_up",
  name: "Turkish Get-Up",
  module: "movement",
  // "# Primary Classification: Integrated Athletic Movement" — a
  // genuinely different framing from TECHNICAL_STAND_UP/SHRIMPING/
  // BRIDGING's own literal "Combat-Specific Movement" wording (this fiche
  // never uses that phrase) — `primaryAdaptation: "movement"` is used
  // instead of `"specific_skill"`, matching BEAR_CRAWL's own resolution
  // for general athletic-development framing.
  primaryAdaptation: "movement",
  // "# Capability Mapping — Primary: Whole-Body Coordination, Shoulder
  // Stability, Core Stability" → coordination, stability, trunk_strength.
  // "Secondary: Mobility" → mobility. "Balance" → balance. "Movement
  // Efficiency" excluded (generic). "Robustness" → tissue_capacity (the
  // closest structural/connective-capacity concept for a bare "Robustness"
  // claim). "Motor Control" → coordination (already listed, redundant).
  physicalQualities: ["coordination", "stability", "trunk_strength", "mobility", "balance", "tissue_capacity"],
  // "# Movement Pattern — Primary: Ground-to-Standing Transition" — the
  // same primary pattern as TECHNICAL_STAND_UP, resolved identically to
  // `mixed` (see that entry's own block comment for the full reasoning).
  // "Secondary: Shoulder Stabilization, Hip Extension, Lunge, Rotation,
  // Brace, Carry" → isometric (from Brace), rotation (exact match), carry
  // (exact match, explicitly named), squat (from "Lunge" — a
  // unilateral, split-stance knee-bend pattern with no dedicated
  // MovementPattern value of its own, resolved to the closest generic
  // match, the same resolution already used for BULGARIAN_SPLIT_SQUAT's
  // own "Split Squat" in Lot 1). "Shoulder Stabilization" is
  // joint-action-level detail already captured via `physicalQualities`.
  movementPatterns: ["mixed", "isometric", "rotation", "carry", "squat"],
  // "# Biomechanical Profile — Primary Force Vector: Multi-Directional" →
  // mixed (the same direct, literal match already used for
  // TECHNICAL_STAND_UP above and WRIST_STRENGTHENING/NECK_TRAINING in Lot
  // 4).
  forceVectors: ["mixed"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "any_of",
        items: [
          { kind: "equipment", equipment: "kettlebell" },
          { kind: "equipment", equipment: "dumbbell" },
        ],
      },
    ],
  },
  // See block comment above for the full reasoning behind this deliberate
  // upward adjustment.
  minimumTechnicalLevel: 4,
  complexity: "high",
  // "# Movement Context — ... Unilateral" (explicit).
  unilateral: true,
  // "# Muscular Profile — Primary Muscles: Core, Gluteus Maximus,
  // Quadriceps, Deltoids, Rotator Cuff, Obliques" → abdomen (Core,
  // Obliques), hip (Gluteus Maximus), thigh (Quadriceps), shoulder
  // (Deltoids, Rotator Cuff).
  bodyRegionsLoaded: ["abdomen", "hip", "thigh", "shoulder"],
  // "# Contraindications", quoted one item per source line.
  contraindications: [
    { description: "Acute shoulder injury.", region: "shoulder", prohibitedPatterns: ["mixed", "isometric", "rotation", "carry", "squat"], absolute: true },
    { description: "Acute wrist injury.", region: "wrist", prohibitedPatterns: ["mixed", "isometric", "rotation", "carry", "squat"], absolute: true },
    { description: "Acute hip injury.", region: "hip", prohibitedPatterns: ["mixed", "isometric", "rotation", "carry", "squat"], absolute: true },
    { description: "Acute lumbar injury.", region: "lumbar_spine", prohibitedPatterns: ["mixed", "isometric", "rotation", "carry", "squat"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Moderate. Mechanical
    // Fatigue: Low. Metabolic Fatigue: Low. Overall Fatigue Cost: Low."
    types: [],
    neural: 2,
    muscular: 1,
    connectiveTissue: 1, // inferred from "Mechanical Fatigue: Low"
    metabolic: 1,
    technical: 4, // fallback from the deliberately adjusted minimumTechnicalLevel 4 (see block comment above)
  },
  // "# Scientific Evidence — Evidence Level: ★★★★☆. ... although direct
  // evidence in elite combat athletes remains more limited than for
  // traditional strength exercises." The FIRST 4-star, explicitly hedged
  // rating outside Lot 4 (matching TIBIALIS_RAISE's/WRIST_STRENGTHENING's
  // own identical resolution) — mapped to "Level 2 — Expert practice", not
  // "Level 1".
  evidenceLevel: "level_2",
  // "# Transfer to Combat Sports" table, quoted star-for-star — a maximal
  // 5-star rating across every discipline, matching
  // ROTATOR_CUFF_TRAINING's/WRIST_STRENGTHENING's own identical uniform
  // profile in Lot 4.
  combatSportRelevance: {
    boxing: 5,
    kickboxing: 5,
    muay_thai: 5,
    wrestling: 5,
    brazilian_jiu_jitsu: 5,
    judo: 5,
    mma: 5,
    krav_maga: 5,
  },
  // "# Regressions" (Segmented Get-Up, Bodyweight Get-Up, Half Get-Up)
  // name no distinct catalog exercise — "Bodyweight Get-Up" is the
  // unloaded regression of this same exercise, not a separate entry (see
  // block comment above).
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Heavy Bag Power Intervals
// Source: 50-exercises/27_HEAVY_BAG_POWER_INTERVALS
// -----------------------------------------------------------------------------

/**
 * First entry of the "Lot 6 — Combat striking et deplacements" batch,
 * migrated alongside SHADOW_BOXING/FOOTWORK_DRILLS. No
 * `exercisePrescriptionRegistry.ts` entry exists for any of the three
 * exercises in this batch (confirmed by direct search for each) — a known
 * limitation, documented here without modifying that registry.
 *
 * HONESTY NOTE, explicitly considered per the user's own instruction: this
 * fiche documents an interval STRUCTURE ("# Loading Profile — Typical
 * Duration: 3–8 rounds. Work: 10–30 seconds. Recovery: 30–90 seconds")
 * layered onto a single, coherent striking movement against a fixed
 * implement (the heavy bag). Unlike a genuine multi-movement family
 * (compare ROTATOR_CUFF_TRAINING/WRIST_STRENGTHENING in Lot 4, which
 * aggregate several NAMED distinct sub-movements), this fiche has ONE
 * governing Exercise Identity, Equipment Requirements, Movement Pattern
 * and Contraindications set — it is prescribed as a single coherent unit
 * (matching the precedent already set by ROPE_CLIMB/ROPE_PULL's own
 * interval-capable grip work in 65_GRIP). It is integrated as ONE
 * `ExerciseDefinition`, not fragmented. The round/work/rest timing
 * structure itself is PRESCRIPTION-layer detail (dosage, not the
 * exercise's own identity) and is deliberately kept entirely out of
 * `requirements`, matching the user's own explicit instruction.
 *
 * KNOWN MODEL LIMITATION, flagged explicitly: this exercise inherently
 * requires striking to be permitted in the training environment, but
 * `EnvironmentCapability` has no `"striking_allowed"` value — only
 * `throwing_allowed`/`jumping_allowed`/`sprinting_allowed` exist for
 * comparable activity-permission gates. No new capability is invented
 * here (the user's own instructions require a demonstrated business
 * blocker before extending the type model, and a single batch's need does
 * not by itself establish one) — the gap is left undisguised rather than
 * papered over with an unrelated existing capability.
 *
 * "# Equipment Requirements — Required: Heavy Bag, Gloves, Hand Wraps,
 * Timer." Four items, all under Required with no hedging language (unlike
 * BACK_SQUAT's own "Safety Arms Recommended: Yes", a genuine
 * recommendation-only phrasing). `heavy_bag` is an existing, exact
 * `EquipmentType` match. "Timer" is a PRESCRIPTION/programming tool for
 * structuring rounds — not physical equipment the athlete interacts with
 * during the movement itself — and is deliberately excluded from
 * `requirements` for the same reason round/rest timing is excluded (see
 * the block comment above). "Gloves" and "Hand Wraps" are genuine,
 * real protective equipment with no dedicated `EquipmentType` value of
 * their own; `"other"` is used as a single flagged placeholder covering
 * both collectively (declaring two separate `other` atoms would be
 * functionally indistinguishable, since eligibility only checks for the
 * PRESENCE of a type, not a counted consumption of it) — the same
 * honest-escape-hatch pattern already established for AB_WHEEL/
 * WEIGHTED_PULL_UP/LANDMINE_PRESS/NORDIC_HAMSTRING_CURL.
 */
export const HEAVY_BAG_POWER_INTERVALS: ExerciseDefinition = {
  id: "heavy_bag_power_intervals",
  name: "Heavy Bag Power Intervals",
  module: "conditioning",
  // "# Primary Classification: Combat-Specific Conditioning" — the literal
  // word "Conditioning" maps directly to the real `"conditioning"`
  // AdaptationDomain value, a genuinely different framing from
  // TECHNICAL_STAND_UP/SHRIMPING/BRIDGING's own "Combat-Specific Movement"
  // (→ `"specific_skill"`) in Lot 5.
  primaryAdaptation: "conditioning",
  // "# Capability Mapping — Primary: Combat Power, Anaerobic Power,
  // Technical Power." "Combat Power" → explosive_strength, directly
  // grounded by "Rate of Force Development: ★★★★★" and "Velocity Profile:
  // Maximum Power". "Anaerobic Power" → anaerobic_capacity (exact match,
  // corroborated by "Metabolic Cost: ★★★★★" and "Primary Energy System:
  // ATP-PC, Anaerobic Glycolysis"). "Technical Power" has no distinct
  // counterpart beyond explosive_strength already listed and is not
  // double-counted. "Secondary: Rate of Force Development" →
  // rate_of_force_development (exact match). "Coordination" →
  // coordination. "Movement Efficiency" excluded (generic, matching this
  // whole project's established exclusion). "Work Capacity" →
  // general_work_capacity (exact match). "Mental Resilience" has no
  // PhysicalQuality counterpart (a psychological/mental-toughness concept,
  // not a physical quality) and is not force-fitted. The round-interval
  // structure ("3–8 rounds", "Progression: Round Duration... Strike
  // Density") directly corroborates `repeat_effort_capacity` — the
  // closest existing quality for a "repeated power" demand, though no
  // literal "repeated_power" value exists in this enum.
  physicalQualities: ["explosive_strength", "anaerobic_capacity", "rate_of_force_development", "repeat_effort_capacity", "coordination", "general_work_capacity"],
  // MODEL LIMITATION, flagged explicitly: "# Movement Pattern — Primary:
  // Striking." No `MovementPattern` value represents a strike — this
  // taxonomy has no punch/kick pattern of its own, and `throw` would
  // misrepresent a strike (which retains the limb on contact, unlike a
  // release). `"mixed"` is used as the closest available generic value
  // for the PRIMARY pattern. "Secondary: Rotation, Footwork, Acceleration,
  // Deceleration, Bracing, Reactive Movement" → rotation (exact match),
  // locomotion (from "Footwork"), isometric (from "Bracing" — the genuine
  // impact-absorption/recoil-resistance demand of striking a real heavy
  // bag). "Acceleration"/"Deceleration" are PhysicalQuality concepts, not
  // MovementPattern values, and are not represented here. "Reactive
  // Movement" has no distinct counterpart and is already captured via
  // `"mixed"`.
  movementPatterns: ["mixed", "rotation", "locomotion", "isometric"],
  // "# Biomechanical Profile — Primary Force Vector: Multi-Directional" →
  // mixed (a direct, literal match).
  forceVectors: ["mixed"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "heavy_bag" },
          { kind: "equipment", equipment: "other" }, // flagged placeholder for "Gloves"/"Hand Wraps" — see block comment above
        ],
      },
    ],
  },
  // "# Skill Requirement: Intermediate. Basic striking mechanics required
  // before maximal power work."
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // No unilateral/bilateral statement exists anywhere in this fiche —
  // striking alternates sides continuously but is not documented as a
  // per-side prescription.
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Entire Kinetic Chain, Lower
  // Body, Core, Shoulders, Arms, Forearms." Unlike fiches that name
  // specific individual muscles (e.g. "Gluteus Maximus", "Quadriceps"),
  // this fiche uses generic whole-body region language throughout,
  // explicitly opening with "Entire Kinetic Chain" — `whole_body` (a real
  // BodyRegion value) is used as the single honest representation, rather
  // than fabricating a specific muscle-by-muscle region breakdown the
  // source itself never provides.
  bodyRegionsLoaded: ["whole_body"],
  // "# Contraindications", quoted one item per source line.
  contraindications: [
    { description: "Acute hand injury.", region: "hand", prohibitedPatterns: ["mixed", "rotation", "locomotion", "isometric"], absolute: true },
    { description: "Acute wrist injury.", region: "wrist", prohibitedPatterns: ["mixed", "rotation", "locomotion", "isometric"], absolute: true },
    { description: "Acute shoulder injury.", region: "shoulder", prohibitedPatterns: ["mixed", "rotation", "locomotion", "isometric"], absolute: true },
    { description: "Acute concussion.", region: "head", prohibitedPatterns: ["mixed", "rotation", "locomotion", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: ★★★★★. Mechanical
    // Fatigue: Moderate. Metabolic Fatigue: ★★★★★." This fiche uses direct
    // 1–5 star ratings (not the Low/Moderate/High word ladder used
    // elsewhere in this documentary format) — read directly as Rating5
    // values. "Mechanical Fatigue: Moderate" (a word, not stars) is mapped
    // via the same baseline Low=1/Moderate=2 scale established throughout
    // Lots 1–5. `connectiveTissue` shares the same "Mechanical Fatigue"
    // source as `muscular` (no distinct "Connective-Tissue Fatigue"
    // heading exists in this format).
    types: ["neural", "metabolic"],
    neural: 5,
    muscular: 2,
    connectiveTissue: 2, // inferred from "Mechanical Fatigue: Moderate"
    metabolic: 5,
    technical: 3, // fallback from "Skill Requirement: Intermediate" (minimumTechnicalLevel 3)
  },
  // "# Scientific Evidence — Evidence Level: ★★★★★. Heavy bag interval
  // training demonstrates strong evidence for improving combat-specific
  // power, anaerobic conditioning, striking efficiency..." — mapped to the
  // CAS Evidence Framework's "Level 1 — Scientific consensus"
  // (20-engine/02_EXERCISE_KNOWLEDGE_BASE.md).
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star. Notably low
  // grappling relevance (Wrestling 2, BJJ 1, Judo 1) — the inverse profile
  // from SHRIMPING/BRIDGING in Lot 5, directly reflecting genuine
  // discipline-specificity rather than a generic "combat" rating. Savate
  // is named in this table but has no `CombatSport` enum counterpart and
  // is omitted rather than force-mapped.
  combatSportRelevance: {
    boxing: 5,
    kickboxing: 5,
    muay_thai: 5,
    wrestling: 2,
    brazilian_jiu_jitsu: 1,
    judo: 1,
    mma: 5,
    krav_maga: 5,
  },
  // "# Regressions" names "Shadow Boxing" (exact name match) →
  // shadow_boxing (integrated in this same batch, real catalog id).
  // "Technical Bag Work", "Light Bag Work" and "Reduced Intensity" name no
  // exercise with its own chapter/catalog id.
  substitutionExerciseIds: ["shadow_boxing"],
};

// -----------------------------------------------------------------------------
// Shadow Boxing
// Source: 50-exercises/28_SHADOW_BOXING
// -----------------------------------------------------------------------------

/**
 * Second entry of this batch. "# Equipment Requirements — Required: None."
 * A fully equipment-free exercise — `requiredEquipment: []` with no
 * `requirements` object at all: no space/floor/human-assistance
 * requirement is documented either (no "Space Requirement" heading, no
 * quantified distance/area figure, and "# Progressions — ... Partner
 * Shadow" names partner practice as a documented but non-default
 * PROGRESSION, never a base-form requirement, directly answering the
 * user's own instruction not to invent a partner requirement).
 *
 * Central business distinction from HEAVY_BAG_POWER_INTERVALS, explicitly
 * flagged before writing began: this fiche's own "# Movement Pattern —
 * Secondary" list (Footwork, Rotation, Guard Recovery, Defensive Movement,
 * Reactive Positioning) never names "Brace"/"Bracing" — unlike
 * HEAVY_BAG_POWER_INTERVALS's own explicit "Bracing" secondary pattern
 * (the real impact-absorption demand of striking an actual heavy bag).
 * `isometric` is therefore deliberately NOT added here — Shadow Boxing has
 * no bag to absorb force from and no real recoil resistance to brace
 * against, a genuine, textually-grounded biomechanical difference between
 * the two exercises, not an oversight.
 *
 * "# Neurological Profile — Skill Requirement: All Levels" and "#
 * Athlete Suitability — Suitable For: All athletes, All ages, All
 * competitive levels" — a distinct phrasing from the Beginner/Intermediate
 * word ladder used throughout this project so far. Read as the lowest
 * entry floor (minimumTechnicalLevel 1 / "low"), corroborated by "Learning
 * Curve: Unlimited" (mastery has no ceiling, but the floor for starting is
 * minimal).
 *
 * "# Contraindications — None. Except acute injury preventing movement."
 * The literal word "None", with only a generic, non-specific caveat too
 * vague to encode as a body-region-tagged `ExerciseContraindication` —
 * `contraindications: []` is used, the same empty-array resolution already
 * established for DEAD_BUG/HOLLOW_BODY_HOLD in 62_CORE (both documented
 * only a "Relative" tier with no "Absolute" heading at all) — here the
 * fiche goes even further and states no specific contraindication
 * whatsoever.
 */
export const SHADOW_BOXING: ExerciseDefinition = {
  id: "shadow_boxing",
  name: "Shadow Boxing",
  module: "movement",
  // "# Primary Classification: Combat-Specific Technique" — a third
  // distinct "Combat-Specific X" framing in this migration (Lot 5's own
  // trio said "Combat-Specific Movement"; HEAVY_BAG_POWER_INTERVALS above
  // says "Combat-Specific Conditioning"). "Technique" maps most literally
  // to `"specific_skill"`, matching the Lot 5 resolution for an even more
  // skill/technique-specific framing.
  primaryAdaptation: "specific_skill",
  // "# Capability Mapping — Primary: Technical Skill, Movement
  // Coordination, Motor Control." "Technical Skill" has no distinct
  // PhysicalQuality counterpart (a skill-level descriptor, not a physical
  // quality) and is not force-fitted. "Movement Coordination"/"Motor
  // Control" both fold into a single `coordination` entry, not
  // double-counted. "Secondary: Reaction Speed" excluded (no clean
  // `speed`/`agility` match, matching TECHNICAL_STAND_UP's own identical
  // exclusion in Lot 5). "Balance" → balance (exact match). "Timing" and
  // "Rhythm" have no PhysicalQuality counterpart and are not force-fitted.
  // "Movement Efficiency"/"Spatial Awareness" excluded (generic/cognitive,
  // no distinct counterpart).
  physicalQualities: ["coordination", "balance"],
  // MODEL LIMITATION, flagged explicitly: "# Movement Pattern — Primary:
  // Striking" resolves to `mixed`, the same resolution already used for
  // HEAVY_BAG_POWER_INTERVALS above. "Secondary: Footwork, Rotation, Guard
  // Recovery, Defensive Movement, Reactive Positioning" → locomotion (from
  // "Footwork"), rotation (exact match); "Guard Recovery"/"Defensive
  // Movement"/"Reactive Positioning" are tactical/defensive concepts with
  // no MovementPattern counterpart and are already captured via `"mixed"`.
  // See block comment above for why `isometric` is deliberately absent.
  movementPatterns: ["mixed", "locomotion", "rotation"],
  // "# Biomechanical Profile — Primary Force Vector: Multi-Directional" →
  // mixed.
  forceVectors: ["mixed"],
  requiredEquipment: [],
  // No `requirements` object — nothing is documented as required (see
  // block comment above).
  // See block comment above for the "All Levels"/"Unlimited Learning
  // Curve" resolution.
  minimumTechnicalLevel: 1,
  complexity: "low",
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Entire Kinetic Chain" — the
  // same generic whole-body framing as HEAVY_BAG_POWER_INTERVALS above →
  // whole_body.
  bodyRegionsLoaded: ["whole_body"],
  // See block comment above for why this array is genuinely empty.
  contraindications: [],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Low. Mechanical Fatigue:
    // Very Low. Metabolic Fatigue: Low." Unlike several exercises in Lots
    // 4–5, this fiche's own vocabulary mixes "Low" (Neuromuscular,
    // Metabolic, Psychological) AND "Very Low" (Mechanical) at the
    // dimension level within the SAME fiche — the fiche-relative
    // Very-Low=1/Low=2 convention established in Lot 4 applies here.
    types: [],
    neural: 2,
    muscular: 1,
    connectiveTissue: 1, // inferred from "Mechanical Fatigue: Very Low"
    metabolic: 2,
    technical: 1, // fallback from minimumTechnicalLevel 1
  },
  // "# Scientific Evidence — Evidence Level: ★★★★★. Motor imagery,
  // deliberate practice and technical repetition are strongly supported
  // for improving motor learning, movement efficiency and skill
  // acquisition." — mapped to "Level 1 — Scientific consensus".
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star — identical
  // to HEAVY_BAG_POWER_INTERVALS's own table (both are striking-specific
  // exercises sharing the same discipline-relevance profile).
  combatSportRelevance: {
    boxing: 5,
    kickboxing: 5,
    muay_thai: 5,
    wrestling: 2,
    brazilian_jiu_jitsu: 1,
    judo: 1,
    mma: 5,
    krav_maga: 5,
  },
  // "# Regressions" (Slow Technical Shadow, Single Technique, Mirror
  // Shadow, "Footwork Only") name no exercise with its own chapter/catalog
  // id — "Footwork Only" is a distinct phrase from "Footwork Drills"
  // (integrated in this same batch), the same strict name-matching
  // discipline already applied to CHIN_UP's own "Weighted Chin-Up" in Lot
  // 2 (a modified name is not silently resolved to a differently-named
  // catalog id). Despite HEAVY_BAG_POWER_INTERVALS's own Regressions
  // naming "Shadow Boxing" as its own substitute, this fiche never names
  // "Heavy Bag"/"Heavy Bag Power Intervals" anywhere in its own
  // Progressions/Regressions/Variations sections (checked directly) — the
  // same faithfully-preserved one-directional asymmetry already
  // documented elsewhere in this catalog.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Footwork Drills
// Source: 50-exercises/29_FOOTWORK_DRILLS
// -----------------------------------------------------------------------------

/**
 * Third and final entry of this batch. "# Equipment Requirements —
 * Required: None. Optional: Cones, Agility Ladder, Markers, Reaction
 * Lights, Mirror." Cones/markers are explicitly Optional, never Required
 * — the fully bodyweight, no-equipment execution is this exercise's own
 * default, valid form, directly answering the user's own instruction not
 * to invent a cone requirement when floor references or no equipment at
 * all constitute a documented valid version. No `requirements` object is
 * added at all — no space/floor-safety language or quantified distance
 * figure exists anywhere in this fiche either (checked directly).
 *
 * Central business distinction from HEAVY_BAG_POWER_INTERVALS/
 * SHADOW_BOXING above, explicitly flagged before writing began: this is
 * the FIRST exercise in this batch whose primary movement pattern maps
 * cleanly, directly to an existing `MovementPattern` value — "# Movement
 * Pattern — Primary: Locomotion" needs no `"mixed"` escape hatch at all,
 * unlike the striking-based primary patterns of the other two entries.
 * This exercise is pure multidirectional displacement, never striking
 * itself — no combat-contact requirement of any kind is documented or
 * invented here, matching the user's own explicit instruction not to
 * invent a combat requirement for a drill that remains fully executable
 * without any strike.
 */
export const FOOTWORK_DRILLS: ExerciseDefinition = {
  id: "footwork_drills",
  name: "Footwork Drills",
  module: "movement",
  // "# Primary Classification: Combat-Specific Technique" — identical
  // wording to SHADOW_BOXING's own Primary Classification, hence the
  // identical `"specific_skill"` resolution.
  primaryAdaptation: "specific_skill",
  // "# Capability Mapping — Primary: Movement Efficiency, Balance, Foot
  // Speed, Coordination." "Movement Efficiency" excluded (generic).
  // "Balance" → balance (exact match). "Foot Speed" → speed (a
  // region-flavoured restatement of the same underlying quality, folded
  // into the closest generic value, matching this whole project's
  // established convention for this kind of phrase). "Coordination" →
  // coordination. "Secondary: Agility" → agility (exact match — the first
  // use of this PhysicalQuality value anywhere in this catalog).
  // "Acceleration" → acceleration (exact match). "Reaction Speed" excluded
  // (matching SHADOW_BOXING's/TECHNICAL_STAND_UP's own identical
  // exclusion). "Spatial Awareness"/"Technical Precision" excluded (no
  // distinct PhysicalQuality counterpart — cognitive/skill-level
  // concepts, not physical qualities).
  physicalQualities: ["balance", "speed", "coordination", "agility", "acceleration"],
  // "# Movement Pattern — Primary: Locomotion" → locomotion (exact,
  // direct match — see block comment above). "Secondary: Acceleration,
  // Deceleration, Lateral Movement, Rotation, Pivoting, Balance" →
  // rotation (from "Rotation"/"Pivoting", both resolving to the same
  // value, not double-counted). "Acceleration"/"Deceleration"/"Balance"
  // are PhysicalQuality concepts already captured above, not
  // MovementPattern values. "Lateral Movement" has no dedicated
  // MovementPattern counterpart of its own (`anti_lateral_flexion` is
  // about RESISTING trunk lateral flexion, a materially different concept
  // from producing lateral gait displacement) and is not force-fitted —
  // already substantively captured by the primary `locomotion` pattern
  // itself, which this fiche's own "# Variations — Forward/Backward,
  // Lateral, Pivoting, Circling..." frames as directional variants of the
  // same underlying locomotion pattern, not distinct patterns of their
  // own.
  movementPatterns: ["locomotion", "rotation"],
  // "# Biomechanical Profile — Primary Force Vector: Multi-Directional" →
  // mixed (a direct, literal match, even though `movementPatterns` above
  // needed no `"mixed"` escape hatch — the two fields answer different
  // questions and are sourced independently).
  forceVectors: ["mixed"],
  requiredEquipment: [],
  // No `requirements` object — nothing is documented as required (see
  // block comment above).
  // "# Skill Requirement — Suitable For: Beginners, Intermediate,
  // Advanced, Elite", corroborated by "# Neurological Profile — Skill
  // Requirement: All Levels" — the same resolution already used for
  // SHADOW_BOXING above.
  minimumTechnicalLevel: 1,
  complexity: "low",
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Calves, Quadriceps, Hamstrings,
  // Gluteals" — unlike HEAVY_BAG_POWER_INTERVALS/SHADOW_BOXING's own
  // generic "Entire Kinetic Chain" framing, this fiche names specific,
  // real muscles → lower_leg (Calves), thigh (Quadriceps, Hamstrings),
  // hip (Gluteals). Secondary Muscles (Hip Flexors, Core, Foot Intrinsic
  // Muscles) are excluded, matching this catalog's established
  // primary-muscles-only discipline.
  bodyRegionsLoaded: ["lower_leg", "thigh", "hip"],
  // "# Contraindications", quoted one item per source line. "Acute
  // Lower-Limb Injury" spans multiple possible joints (hip/knee/ankle)
  // without naming a specific one — left without a `region` tag rather
  // than arbitrarily narrowing it to a single BodyRegion value the fiche
  // itself does not specify. "Severe Balance Deficit" is a
  // neurological/vestibular condition, not a body-region injury, and
  // carries no region either.
  contraindications: [
    { description: "Acute lower-limb injury.", prohibitedPatterns: ["locomotion", "rotation"], absolute: true },
    { description: "Severe balance deficit.", prohibitedPatterns: ["locomotion", "rotation"], absolute: true },
  ],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue: Low. Mechanical Fatigue:
    // Low. Metabolic Fatigue: Low." Per-dimension vocabulary never uses
    // "Very Low" (only the aggregate "Overall Fatigue Cost: ★★★★★ Very
    // Low" summary line does) — the baseline Low=1 mapping established
    // throughout Lots 1–3 and reused for several Lot 5 entries is used
    // directly here.
    types: [],
    neural: 1,
    muscular: 1,
    connectiveTissue: 1, // inferred from "Mechanical Fatigue: Low"
    metabolic: 1,
    technical: 1, // fallback from minimumTechnicalLevel 1
  },
  // "# Scientific Evidence — Evidence Level: ★★★★★. Movement-specific
  // footwork practice is strongly supported for improving agility,
  // coordination, balance and sport-specific movement efficiency..." —
  // mapped to "Level 1 — Scientific consensus".
  evidenceLevel: "level_1",
  // "# Transfer to Combat Sports" table, quoted star-for-star — notably
  // HIGHER grappling relevance than HEAVY_BAG_POWER_INTERVALS/
  // SHADOW_BOXING above (Wrestling 5 vs. 2, BJJ 3 vs. 1, Judo 4 vs. 1),
  // directly reflecting footwork's universal value across both striking
  // and grappling disciplines, unlike the two purely striking-specific
  // exercises above. Savate is named in this table but has no
  // `CombatSport` enum counterpart and is omitted rather than
  // force-mapped.
  combatSportRelevance: {
    boxing: 5,
    kickboxing: 5,
    muay_thai: 5,
    wrestling: 5,
    brazilian_jiu_jitsu: 3,
    judo: 4,
    mma: 5,
    krav_maga: 5,
  },
  // "# Regressions" (Slow Technical Footwork, Linear Movement, Single
  // Pattern Repetition, Mirror Walking) name no exercise with its own
  // chapter/catalog id anywhere in this repository (confirmed by direct
  // search). `substitutionExerciseIds` is genuinely empty for this entry.
  substitutionExerciseIds: [],
};

// -----------------------------------------------------------------------------
// Catalog
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Ab Wheel Rollout
// Source: 50-exercises/62_CORE/10_AB_WHEEL.md
// -----------------------------------------------------------------------------

/**
 * First entry from the `62_CORE` chapter, migrated as a single coherent
 * batch alongside PALLOF_PRESS/DEAD_BUG/HOLLOW_BODY_HOLD/HANGING_LEG_RAISE/
 * DRAGON_FLAG/SUITCASE_CARRY/OVERHEAD_CARRY. No `exercisePrescriptionRegistry.ts`
 * entry exists for `ab_wheel` (confirmed by direct search) — a known
 * limitation, documented here without modifying that registry.
 *
 * `62_CORE/16_FARMER_CARRY.md` also exists in this chapter but is NOT a
 * source for anything in this batch: `farmer_carry` is already integrated
 * with `50-exercises/66_CARRIES/10_FARMER_CARRY.md` as its sole canonical
 * source (see that entry's own locked-decision comment). `62_CORE`'s own
 * Farmer Carry fiche is superseded prose, deliberately not re-read here,
 * matching the precedent already established for that id.
 *
 * KNOWN MODEL LIMITATION, flagged explicitly rather than silently
 * approximated: "Equipment Requirements — Required Equipment: Ab Wheel."
 * `EquipmentType` has no `ab_wheel` member. "Acceptable Alternatives —
 * Barbell with rotating plates, Stability Ball, Suspension Trainer, Sliding
 * Discs, Towels on a suitable surface" are explicitly framed by the fiche
 * itself as NOT equivalent implementations ("An alternative must therefore
 * be treated as a separate variation rather than an identical
 * implementation") — so no `any_of` equivalence group is built from them
 * either, matching `PUSH_PRESS`'s own precedent of not force-fitting
 * documented "alternative implement" language into an equivalence atom
 * when the source itself denies equivalence. The only remaining option
 * without inventing a new `EquipmentType` value is the catch-all `"other"`
 * member — used here, but this is a real, flagged precision loss: the
 * engine cannot distinguish "the athlete owns an Ab Wheel" from "the
 * athlete owns some unrelated, unlisted implement" when evaluating this
 * requirement. This is an honest, visible use of the existing escape
 * hatch, not a silent approximation, and it should be revisited if a
 * dedicated `ab_wheel` `EquipmentType` is ever added.
 *
 * "Standard Setup — 1. Place the Ab Wheel on a stable, non-slip surface."
 * grounds a genuine `floor_safe` atom (not `safe_landing_surface`: no
 * jump or landing phase exists anywhere in this fiche), matching
 * `PUSH_PRESS`'s own identical "stable non-slip surface" → `floor_safe`
 * resolution. "Kneel on a pad if required for comfort" (Standard Setup
 * #2) is explicit COMFORT language, not a safety requirement — no
 * `knee_protection_pad` atom is added, the same safety-required-vs-
 * comfort-optional distinction applied to `DEAD_BUG`/`HOLLOW_BODY_HOLD`
 * below. "Space Requirement: Low" grounds `minimumSpace: "limited"`,
 * matching this file's own established "Low" → `"limited"` mapping.
 *
 * "Force Vector" has no dedicated heading in this chapter's own template,
 * but "Biomechanical Profile — Primary Force Direction: Anterior and
 * downward relative to the athlete" is explicit and literal —
 * `forceVectors: ["forward", "downward"]`.
 */
export const AB_WHEEL: ExerciseDefinition = {
  id: "ab_wheel",
  name: "Ab Wheel Rollout",
  module: "core",
  // Primary Adaptation Domain: "Movement" (explicit). Secondary Adaptation
  // Domains: "Robustness", "Strength" → robustness, maximum_strength (the
  // closest AdaptationDomain match for "Strength"; AdaptationDomain has no
  // plain "strength" value).
  primaryAdaptation: "movement",
  secondaryAdaptations: ["robustness", "maximum_strength"],
  // Capability Mapping — Primary: "Anti-Extension Strength", "Dynamic
  // Trunk Control" → trunk_strength. "Postural Organization" → stability.
  // Secondary: "Shoulder Stability" → stability (already listed).
  // "Latissimus-to-Trunk Coordination" → coordination. "Force
  // Transmission" (named repeatedly throughout every fiche in this
  // chapter as connective narrative, never as its own distinct trainable
  // quality) has no PhysicalQuality counterpart and is deliberately never
  // force-mapped anywhere in this batch — noted once here, applying
  // uniformly to every entry below. "Controlled Eccentric Strength" /
  // "Position Maintenance Under Long Leverage" / "Serratus Anterior
  // Function" / "Whole-Body Bracing" have no distinct counterpart beyond
  // trunk_strength/stability already listed.
  physicalQualities: ["trunk_strength", "stability", "coordination"],
  // Primary Classification — Primary Movement Pattern: "Anti-Extension" →
  // anti_extension. Secondary Movement Patterns: "Brace" → isometric.
  // "Shoulder Flexion" / "Dynamic Plank" / "Force Transmission" have no
  // clean MovementPattern counterpart and are not force-fitted.
  movementPatterns: ["anti_extension", "isometric"],
  forceVectors: ["forward", "downward"],
  requiredEquipment: [],
  requirements: {
    required: [
      { kind: "all_of", items: [{ kind: "equipment", equipment: "other" }] },
      {
        kind: "all_of",
        items: [
          { kind: "environment", capability: "floor_safe" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "limited" },
        ],
      },
    ],
  },
  // Technical Complexity: "Complexity Level: 3 — Intermediate".
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // No explicit "Unilateral or Bilateral" field exists in this chapter's
  // own template (checked directly) — inferred from the symmetric,
  // two-handed rollout described throughout Standard Setup/Execution,
  // with no per-side prescription language anywhere in this fiche.
  unilateral: false,
  // Primary Muscular Contributors only (matching FARMER_CARRY's own
  // established precedent of excluding Secondary Muscular Contributors):
  // Rectus Abdominis, Internal/External Obliques, Transversus Abdominis →
  // abdomen. Latissimus Dorsi, Serratus Anterior → shoulder.
  bodyRegionsLoaded: ["abdomen", "shoulder"],
  // "# Contraindications — Hard Exclusions", quoted one item per source
  // line. Temporary Exclusions/Precautions are not represented, matching
  // this file's own established convention of only representing the
  // hard-exclusion tier as `ExerciseContraindication` entries.
  contraindications: [
    { description: "Acute unexplained low-back pain.", prohibitedPatterns: ["anti_extension", "isometric"], absolute: true },
    { description: "Radiating pain.", prohibitedPatterns: ["anti_extension", "isometric"], absolute: true },
    { description: "Neurological symptoms.", prohibitedPatterns: ["anti_extension", "isometric"], absolute: true },
    { description: "Acute abdominal or inguinal pain.", prohibitedPatterns: ["anti_extension", "isometric"], absolute: true },
    {
      description: "Recent abdominal surgery without appropriate clearance.",
      prohibitedPatterns: ["anti_extension", "isometric"],
      absolute: true,
    },
    {
      description: "Acute shoulder injury preventing supported flexion.",
      prohibitedPatterns: ["anti_extension", "isometric"],
      absolute: true,
    },
    {
      description: "Acute wrist or elbow injury preventing safe loading.",
      prohibitedPatterns: ["anti_extension", "isometric"],
      absolute: true,
    },
    { description: "Dizziness during exertion.", prohibitedPatterns: ["anti_extension", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Cost Profile": Neural Cost 2/5, Muscular Cost 3/5,
    // Connective-Tissue Cost 2/5, Metabolic Cost 1/5. No "Systemic"
    // fatigue language exists anywhere in this fiche (checked directly) —
    // excluded from `types`.
    types: ["neural", "muscular", "connective_tissue"],
    neural: 2,
    muscular: 3,
    metabolic: 1,
    connectiveTissue: 2,
    technical: 3, // fallback from "Complexity Level: 3" (minimumTechnicalLevel 3)
  },
  // "# Scientific Evidence Position — Evidence Classification: Level 2 —
  // Supported Exercise Application".
  evidenceLevel: "level_2",
  // "# Transfer by Discipline": Boxing/Kickboxing/Muay Thai/Wrestling/
  // Brazilian Jiu-Jitsu/MMA/Krav Maga: High (5); Judo: Moderate (3).
  // Savate/Sambo are named in this table but have no `CombatSport` enum
  // counterpart and are omitted rather than force-mapped.
  combatSportRelevance: {
    boxing: 5,
    kickboxing: 5,
    muay_thai: 5,
    wrestling: 5,
    brazilian_jiu_jitsu: 5,
    judo: 3,
    mma: 5,
    krav_maga: 5,
  },
  // "# Substitution Rules — Preferred substitution order": "Barbell
  // Rollout" / "Stability Ball Rollout" / "Suspension Trainer Fallout" /
  // "Body Saw" / "Long-Lever Plank" name no exercise with its own
  // chapter/catalog id. "Hollow Body Hold" → hollow_body_hold, "Dead Bug"
  // → dead_bug (both integrated in this same batch).
  substitutionExerciseIds: ["hollow_body_hold", "dead_bug"],
};

// -----------------------------------------------------------------------------
// Pallof Press
// Source: 50-exercises/62_CORE/11_PALLOF_PRESS.md
// -----------------------------------------------------------------------------

/**
 * Second entry from this batch. `exercisePrescriptionRegistry.ts` has an
 * entry (`pallofPressEntry`) with `moduleId: "core"`, `laterality:
 * "bilateral"`, `requiredEquipmentCapabilities: ["cable_or_band_resistance"]`
 * and `supportedLoadingModes: ["cable", "resistance_band"]` — used as
 * corroborating, not overriding, evidence, per this file's established
 * precedence (canonical documentation governs `exerciseKnowledgeBase.ts`).
 *
 * "Equipment Requirements — Required Equipment: One of the following:
 * Cable Machine, Resistance Band." → `any_of` [cable_machine,
 * resistance_band], both real, existing `EquipmentType` values. No
 * separate `rigid_anchor_support` atom is added on top of either: unlike
 * `DRAGON_FLAG`'s own fiche (which lists a stable support AND a separate
 * "Secure overhead or behind-head hand anchor" as two distinct required
 * items), this fiche's own "Equipment Requirements" section lists only
 * the two resistance-source alternatives above and never names a third,
 * separate anchor requirement — "Anchor security must be verified" (Band
 * Resistance Limitations) is a setup-quality caution about the chosen
 * resistance source itself, not a second required implement. This matches
 * `ROPE_PULL`'s own identical precedent of NOT adding an anchor atom when
 * the fiche's own Equipment Requirements section never lists one
 * separately.
 *
 * No `floor_safe`/`safe_landing_surface` language exists anywhere in this
 * fiche (checked directly — "Space Requirement: Low" is the only
 * environmental line) — a genuine divergence from `AB_WHEEL`'s own
 * explicit "stable, non-slip surface" grounding, faithfully NOT carried
 * over here. `minimumSpace: "limited"` matches this file's own "Low" →
 * `"limited"` convention.
 *
 * "Biomechanical Profile — Primary Force Direction: Lateral relative to
 * the athlete" (the resistance/rotational-torque direction the athlete
 * resists, the defining demand of an anti-rotation exercise) grounds
 * `forceVectors: ["lateral"]` directly.
 *
 * No explicit "Unilateral or Bilateral" field exists in this fiche's own
 * Exercise Identity section (checked directly), but `exercisePrescriptionRegistry.ts`
 * gives `laterality: "bilateral"` explicitly, corroborated by "Standard
 * Execution — 11. Complete the prescribed work on both sides" (both sides
 * are always trained within the same prescription, not a single-sided
 * specialization) — the same "alternating bilateral" reasoning already
 * used for `ROPE_CLIMB`. `unilateral: false`.
 */
export const PALLOF_PRESS: ExerciseDefinition = {
  id: "pallof_press",
  name: "Pallof Press",
  module: "core",
  // Primary Adaptation Domain: "Movement" (explicit). Secondary Adaptation
  // Domains: "Robustness", "Strength" → robustness, maximum_strength.
  primaryAdaptation: "movement",
  secondaryAdaptations: ["robustness", "maximum_strength"],
  // Capability Mapping — Primary: "Anti-Rotation Strength", "Trunk
  // Stability Under Asymmetric Force" → trunk_strength. "Postural
  // Organization" → stability. Secondary: "Stance Control", "Pelvic
  // Stability", "Scapular Control", "Frontal-Plane Stability" → stability
  // (already listed). "Upper- and Lower-Body Coordination" →
  // coordination. "Force Transmission" not mapped, per the convention
  // established at AB_WHEEL above.
  physicalQualities: ["trunk_strength", "stability", "coordination"],
  // Primary Movement Pattern: "Anti-Rotation" → anti_rotation. Secondary:
  // "Horizontal Press" → horizontal_push. "Brace" → isometric. "Postural
  // Control" / "Force Transmission" / "Stance Stability" have no distinct
  // counterpart beyond what is already listed.
  movementPatterns: ["anti_rotation", "horizontal_push", "isometric"],
  forceVectors: ["lateral"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "any_of",
        items: [
          { kind: "equipment", equipment: "cable_machine" },
          { kind: "equipment", equipment: "resistance_band" },
        ],
      },
      { kind: "all_of", items: [{ kind: "environment", capability: "sufficient_space", minimumSpace: "limited" }] },
    ],
  },
  // Technical Complexity: "Complexity Level: 2 — Basic to Intermediate".
  minimumTechnicalLevel: 2,
  complexity: "low",
  unilateral: false,
  // Primary Muscular Contributors only: Internal/External Obliques,
  // Transversus Abdominis, Rectus Abdominis, Multifidus, Spinal
  // Stabilizers → abdomen. Gluteus Medius, Gluteus Maximus → hip.
  bodyRegionsLoaded: ["abdomen", "hip"],
  // "# Contraindications — Hard Exclusions", quoted one item per source
  // line.
  contraindications: [
    {
      description: "Acute unexplained spinal pain.",
      prohibitedPatterns: ["anti_rotation", "horizontal_push", "isometric"],
      absolute: true,
    },
    {
      description: "Acute abdominal or inguinal pain.",
      prohibitedPatterns: ["anti_rotation", "horizontal_push", "isometric"],
      absolute: true,
    },
    { description: "Neurological symptoms.", prohibitedPatterns: ["anti_rotation", "horizontal_push", "isometric"], absolute: true },
    {
      description: "Acute shoulder injury preventing the prescribed press.",
      prohibitedPatterns: ["anti_rotation", "horizontal_push", "isometric"],
      absolute: true,
    },
    {
      description: "Inability to stand or kneel safely.",
      prohibitedPatterns: ["anti_rotation", "horizontal_push", "isometric"],
      absolute: true,
    },
    {
      description: "Dizziness during standing exertion.",
      prohibitedPatterns: ["anti_rotation", "horizontal_push", "isometric"],
      absolute: true,
    },
    {
      description: "Acute pain caused by trunk stabilization.",
      prohibitedPatterns: ["anti_rotation", "horizontal_push", "isometric"],
      absolute: true,
    },
  ],
  fatigueProfile: {
    // "# Cost Profile": Neural Cost 1/5 ("Low"), Muscular Cost 2/5 ("Low
    // to moderate"), Connective-Tissue Cost 1/5 ("Low"), Metabolic Cost
    // 1/5 ("Low"), Technical Cost 2/5 ("Low to moderate"). Following this
    // file's established "plain 'Low' → exclude, 'Low to moderate' →
    // include" convention (see `PLATE_PINCH`'s own systemic-fatigue
    // comment), only `muscular` (the sole "Low to moderate" rating) is
    // included in `types` — this is a genuinely very-low-fatigue
    // exercise, consistent with "Estimated Recovery Cost: Less than 24
    // hours" and the fiche's own "Stimulus-to-Fatigue Profile" framing of
    // "relatively low: neural fatigue, muscular damage, metabolic cost,
    // and recovery demand".
    types: ["muscular"],
    neural: 1,
    muscular: 2,
    metabolic: 1,
    connectiveTissue: 1,
    technical: 2, // fallback from "Complexity Level: 2" (minimumTechnicalLevel 2)
  },
  // "# Scientific Evidence Position — Evidence Classification: Level 2 —
  // Supported Exercise Application".
  evidenceLevel: "level_2",
  // "# Transfer by Discipline": every listed discipline rated "High" —
  // Boxing, Kickboxing, Muay Thai, Wrestling, Brazilian Jiu-Jitsu, Judo,
  // MMA, Krav Maga (Savate/Sambo omitted, no `CombatSport` counterpart).
  combatSportRelevance: {
    boxing: 5,
    kickboxing: 5,
    muay_thai: 5,
    wrestling: 5,
    brazilian_jiu_jitsu: 5,
    judo: 5,
    mma: 5,
    krav_maga: 5,
  },
  // "# Substitution Rules — Preferred substitution order": "Cable or Band
  // Anti-Rotation Hold" / "Alternative Pallof Position" / "Offset Carry" /
  // "Bird Dog Row" / "Side Plank" name no exercise with its own
  // chapter/catalog id. "Suitcase Carry" → suitcase_carry (integrated in
  // this same batch). "Dead Bug With Asymmetric Resistance" (Substitution
  // Rules) / "Dead Bug With Band Resistance" (Equivalent Substitutions)
  // both describe a banded variant of the base exercise, not a separate
  // catalog id — mapped to `dead_bug`, the only real id this fiche's own
  // "Dead Bug" language can resolve to.
  substitutionExerciseIds: ["suitcase_carry", "dead_bug"],
};

// -----------------------------------------------------------------------------
// Dead Bug
// Source: 50-exercises/62_CORE/12_DEAD_BUG.md
// -----------------------------------------------------------------------------

/**
 * Third entry from this batch. No `exercisePrescriptionRegistry.ts` entry
 * exists for `dead_bug` (confirmed by direct search) — a known
 * limitation, documented here without modifying that registry.
 *
 * "# Equipment Requirements — Required: Floor Space. Optional: Exercise
 * Mat, Resistance Band, Light Dumbbell, Light Kettlebell, Stability Ball,
 * Wall." "Floor Space" is not a physical implement — it has no
 * `EquipmentType` counterpart and is represented instead through the
 * `sufficient_space` environment atom below. Every other listed item is
 * explicitly OPTIONAL, not required — `requiredEquipment: []` and no
 * equipment atom is added to `requirements`, honestly reflecting that
 * this base exercise needs no physical implement at all. No "non-slip"/
 * "stable surface"/floor-safety language exists anywhere in this fiche
 * (checked directly) — unlike `AB_WHEEL`'s own explicit grounding,
 * "Exercise Mat" here is named only as an OPTIONAL item alongside
 * Resistance Band/Dumbbell/Kettlebell/Stability Ball, i.e. comfort/
 * loading equipment, not a safety requirement — `floor_safe` is
 * deliberately NOT added. "Space Requirements: Minimal" grounds
 * `minimumSpace: "very_limited"`, matching this file's own established
 * "Minimal"/single-station → `"very_limited"` convention (see
 * `TOWEL_PULL_UP`).
 *
 * `DEAD_BUG` and `HOLLOW_BODY_HOLD` below share this IDENTICAL
 * `requirements` shape (`sufficient_space: "very_limited"` only, no
 * equipment, no floor_safe) — deliberately: both fiches document the
 * identical "Required: Floor Space / Optional: [comfort/loading
 * equipment] / Space Requirements: Minimal" structure. The two exercises
 * are correctly distinguished elsewhere (`primaryAdaptation` — "Movement"
 * here vs. "Robustness" for Hollow Body Hold; `physicalQualities` —
 * `muscular_endurance` present only for Hollow Body Hold, whose own
 * Capability Mapping names "Trunk Strength Endurance" as a distinct
 * Primary Capability, a term this fiche's own Capability Mapping never
 * uses; `movementPatterns` — `mixed` present only here, for the dynamic
 * contralateral limb action Hollow Body Hold's own static hold does not
 * have; and `fatigueProfile`/`contraindications`), never through the
 * environmental/equipment gating, which the source documentation gives no
 * basis to differentiate.
 *
 * "# Contraindications and Restrictions" contains ONLY a "Relative
 * Contraindications" list — no "Absolute Contraindications" section
 * exists anywhere in this fiche (checked directly), unlike every other
 * entry in this batch and every prior entry in this file. This file's own
 * established convention (see `AB_WHEEL`/`PALLOF_PRESS` above and every
 * prior chapter) represents ONLY the hard-exclusion/absolute tier as
 * `ExerciseContraindication` entries — "Relative Contraindications" and
 * "Precautions" tiers are never represented, because `ExerciseContraindication.absolute`
 * is a strict boolean with no partial-caution value to hold them
 * faithfully. Since this fiche documents no hard-exclusion tier at all
 * (consistent with "Safety Profile — Overall Risk: Very Low", the lowest
 * risk rating of any exercise in this batch), `contraindications: []` is
 * used — the first empty contraindications array in this catalog, and a
 * deliberate, faithful reflection of the source's own structure rather
 * than an omission.
 *
 * No dedicated "Force Vector" heading exists, but "Biomechanical Profile
 * — Primary Force Vector: Anterior-to-Posterior Trunk Control" describes
 * a stabilization concept, not a spatial movement direction; "Secondary
 * Force Vector: Longitudinal Limb Leverage" plus the fiche's own
 * "Contralateral" framing (the arm and leg move away from the trunk
 * simultaneously, in different directions, on alternating sides) is best
 * represented by the dedicated `"mixed"` `ForceVector` value rather than
 * a single directional label.
 */
export const DEAD_BUG: ExerciseDefinition = {
  id: "dead_bug",
  name: "Dead Bug",
  module: "core",
  // "# Primary Adaptation: Movement" (explicit). "# Secondary Adaptations:
  // Robustness, Trunk Endurance, Breathing Control, Contralateral
  // Coordination, Force Transmission" — only "Robustness" has a direct
  // AdaptationDomain counterpart; the rest are finer capability-level
  // concepts with no AdaptationDomain match and are not force-mapped.
  primaryAdaptation: "movement",
  secondaryAdaptations: ["robustness"],
  // "# Capability Mapping — Primary: Trunk Control, Anti-Extension
  // Capacity, Lumbopelvic Stability" → trunk_strength. "Secondary:
  // Contralateral Coordination" → coordination. "Breathing Under
  // Tension" / "Pelvic Control" / "Ribcage Control" → trunk_strength
  // (already listed). "Proximal Stability" → stability.
  physicalQualities: ["trunk_strength", "coordination", "stability"],
  // "# Movement Pattern — Primary: Anti-Extension" → anti_extension.
  // "Secondary: Brace" → isometric. "Contralateral Limb Movement" →
  // mixed (arm and leg move in different directions simultaneously, on
  // alternating sides — no single directional MovementPattern value
  // represents this). "Lumbopelvic Control" / "Force Transmission" have
  // no distinct counterpart beyond what is already listed.
  movementPatterns: ["anti_extension", "isometric", "mixed"],
  forceVectors: ["mixed"],
  requiredEquipment: [],
  requirements: {
    required: [{ kind: "all_of", items: [{ kind: "environment", capability: "sufficient_space", minimumSpace: "very_limited" }] }],
  },
  // "# Technical Complexity — Level 2 — Basic Technique".
  minimumTechnicalLevel: 2,
  complexity: "low",
  // No explicit "Unilateral or Bilateral" field exists in this fiche's own
  // template (checked directly). "# Loading Profile — Repetitions: 5–10
  // per side" prescribes equal work on both sides within the same set
  // (not a single-sided specialization), and "# Movement Context —
  // Contralateral" names the alternating-sides structure directly — the
  // same "alternating bilateral" reasoning already used for `ROPE_CLIMB`.
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Transversus Abdominis, Rectus
  // Abdominis, Internal Obliques, External Obliques" → abdomen only.
  bodyRegionsLoaded: ["abdomen"],
  // See the block comment above this export for why this array is empty:
  // this fiche documents only a "Relative Contraindications" tier, never
  // an "Absolute"/hard-exclusion tier.
  contraindications: [],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue ★☆☆☆☆, Mechanical
    // Fatigue Very Low, Metabolic Fatigue ★☆☆☆☆, Psychological Fatigue
    // Very Low, Overall Fatigue Cost Very Low." Every dimension is rated
    // at the lowest available level — `types` is therefore genuinely
    // empty, the most honest representation of a documented "Very Low"
    // cost across every axis. "# Physiological Cost" gives the numeric
    // Rating5 values used below: Neural Cost 1/5, Muscular Cost 2/5,
    // Connective Tissue Cost 1/5, Metabolic Cost 1/5.
    types: [],
    neural: 1,
    muscular: 2,
    metabolic: 1,
    connectiveTissue: 1,
    technical: 2, // fallback from "Complexity Level: 2" (minimumTechnicalLevel 2)
  },
  // "# Evidence Classification — Evidence Level: Level 2 — Expert
  // Practice".
  evidenceLevel: "level_2",
  // "# Relative Transfer Score — Krav Maga ★★★☆☆". This chapter's newer
  // fiche format (`DEAD_BUG` through `OVERHEAD_CARRY`) gives only a
  // single combined "Combat Sports" rating plus one named discipline
  // ("Krav Maga"), never a full per-discipline breakdown the way
  // `AB_WHEEL`/`PALLOF_PRESS`'s own "Transfer by Discipline" table does —
  // only the one directly named discipline is populated, rather than
  // inventing numbers for every other `CombatSport` value from the
  // generic "Combat Sports" figure.
  combatSportRelevance: { krav_maga: 3 },
  // "# Substitution Logic" and "# CAS Selection Logic" name no specific
  // alternative exercise anywhere in this fiche (checked directly) — both
  // sections are framed entirely as conditions, not named substitutes.
  // "# Equivalent Options" (Bird Dog, Bear Plank Hold, Front Plank, Body
  // Saw Regression, Supine Alternating March) and "# Regression Options"
  // name no exercise with its own chapter/catalog id either.
  // `substitutionExerciseIds` is genuinely empty for this entry — the
  // only one of this batch's 8 exercises with no derivable id from its
  // own source text.
};

// -----------------------------------------------------------------------------
// Hollow Body Hold
// Source: 50-exercises/62_CORE/13_HOLLOW_BODY_HOLD.md
// -----------------------------------------------------------------------------

/**
 * Fourth entry from this batch. `exercisePrescriptionRegistry.ts` has an
 * entry (`hollowBodyHoldEntry`) with `moduleId: "core"`, `laterality:
 * "bilateral"` and `requiredEquipmentCapabilities: ["open_space"]` —
 * corroborating, not overriding, this entry's own `requiredEquipment: []`
 * / space-only `requirements`.
 *
 * See `DEAD_BUG`'s own block comment above for the full reasoning behind
 * this entry's identical `requirements` shape and the business
 * distinction between the two exercises.
 *
 * "# Contraindications and Restrictions" again contains ONLY a "Relative
 * Contraindications" list, with no "Absolute Contraindications" section
 * (checked directly) — `contraindications: []`, matching `DEAD_BUG`'s own
 * identical structural situation.
 *
 * "# Contraction Profile — Isometric ★★★★★, Concentric ★☆☆☆☆, Eccentric
 * ★☆☆☆☆, Stretch-Shortening Cycle: None" and "# Velocity Profile —
 * Static, Position-Dominant, No Ballistic Intent" together describe a
 * purely static hold with no directional force PRODUCTION — the same
 * situation already resolved for `PLATE_PINCH` using the dedicated
 * `"not_applicable"` `ForceVector` value, used identically here. This is
 * also the entry's clearest structural distinction from `DEAD_BUG`, whose
 * own Contraction Profile shows genuine (if slow) reciprocal limb
 * movement and therefore earns `"mixed"` instead.
 */
export const HOLLOW_BODY_HOLD: ExerciseDefinition = {
  id: "hollow_body_hold",
  name: "Hollow Body Hold",
  module: "core",
  // "# Primary Adaptation: Robustness" (explicit) — a genuine divergence
  // from DEAD_BUG's own "Movement" Primary Adaptation, reflecting this
  // fiche's own static-endurance framing versus DEAD_BUG's motor-control
  // framing. "# Secondary Adaptations: Anti-Extension Strength,
  // Anterior-Chain Endurance, Whole-Body Tension, Ribcage–Pelvis Control,
  // Force Transmission" — none of these have a direct AdaptationDomain
  // counterpart (unlike DEAD_BUG's own plain "Robustness" secondary
  // line) — `secondaryAdaptations` is omitted.
  primaryAdaptation: "robustness",
  // "# Capability Mapping — Primary: Anti-Extension Capacity, Trunk
  // Strength Endurance, Whole-Body Tension" → trunk_strength,
  // muscular_endurance ("Trunk Strength Endurance" is a distinct named
  // Primary Capability in THIS fiche with no equivalent in DEAD_BUG's own
  // Capability Mapping — the direct textual source of the two exercises'
  // key business distinction). "Secondary: Lumbopelvic Stability,
  // Ribcage Control" → trunk_strength (already listed). "Proximal
  // Stability" → stability.
  physicalQualities: ["trunk_strength", "muscular_endurance", "stability"],
  // "# Movement Pattern — Primary: Anti-Extension" → anti_extension.
  // "Secondary: Brace, Isometric Trunk Flexion, Whole-Body Tension" →
  // isometric. No "mixed"/dynamic-limb-movement pattern is added — see
  // the block comment above for why this is the key structural
  // distinction from DEAD_BUG.
  movementPatterns: ["anti_extension", "isometric"],
  forceVectors: ["not_applicable"],
  requiredEquipment: [],
  requirements: {
    required: [{ kind: "all_of", items: [{ kind: "environment", capability: "sufficient_space", minimumSpace: "very_limited" }] }],
  },
  // "# Technical Complexity — Level 2 — Basic Technique".
  minimumTechnicalLevel: 2,
  complexity: "low",
  // No explicit "Unilateral or Bilateral" field exists; `exercisePrescriptionRegistry.ts`
  // gives `laterality: "bilateral"` directly, matching this fiche's own
  // fully symmetric hold position (both arms/legs positioned
  // symmetrically, no per-side prescription anywhere).
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Rectus Abdominis, Transversus
  // Abdominis, Internal Obliques, External Obliques" → abdomen only.
  bodyRegionsLoaded: ["abdomen"],
  // See DEAD_BUG's own block comment above: this fiche documents only a
  // "Relative Contraindications" tier, never an "Absolute" tier.
  contraindications: [],
  fatigueProfile: {
    // "# Fatigue Profile — Neuromuscular Fatigue ★★☆☆☆, Mechanical
    // Fatigue Low, Metabolic Fatigue ★★☆☆☆, Overall Fatigue Cost Low" —
    // but "# Decision Summary" explicitly overrides a blanket "Low"
    // reading for the muscular dimension specifically: "The Hollow Body
    // Hold can create substantial local trunk fatigue despite a low
    // systemic recovery cost." `muscular` is therefore included in
    // `types` on this direct textual corroboration; `neural`/`metabolic`/
    // `connectiveTissue` are not, having no equivalent contradicting
    // text. "# Physiological Cost" gives the numeric values: Neural Cost
    // 2/5, Muscular Cost 3/5, Connective Tissue Cost 1/5, Metabolic Cost
    // 2/5.
    types: ["muscular"],
    neural: 2,
    muscular: 3,
    metabolic: 2,
    connectiveTissue: 1,
    technical: 2, // fallback from "Complexity Level: 2" (minimumTechnicalLevel 2)
  },
  // "# Evidence Classification — Evidence Level: Level 2 — Expert
  // Practice".
  evidenceLevel: "level_2",
  // "# Relative Transfer Score — Krav Maga ★★★☆☆". See DEAD_BUG's own
  // comment above for why only this one discipline is populated.
  combatSportRelevance: { krav_maga: 3 },
  // "# Equivalent Options" names "Dead Bug" first → dead_bug (integrated
  // in this same batch, real catalog id). "Front Plank" / "Bear Plank
  // Hold" / "Body Saw Regression" / "Reverse Crunch Iso Hold" name no
  // exercise with its own chapter/catalog id. "# Substitution Logic" is
  // condition-only and names no further alternative.
  substitutionExerciseIds: ["dead_bug"],
};

// -----------------------------------------------------------------------------
// Hanging Leg Raise
// Source: 50-exercises/62_CORE/14_HANGING_LEG_RAISE.md
// -----------------------------------------------------------------------------

/**
 * Fifth entry from this batch. No `exercisePrescriptionRegistry.ts` entry
 * exists for `hanging_leg_raise` (confirmed by direct search) — a known
 * limitation, documented here without modifying that registry.
 *
 * "# Equipment Requirements — Required: Stable pull-up bar or equivalent
 * overhead structure." The specific, named `pull_up_bar` `EquipmentType`
 * is used directly, matching `TOWEL_PULL_UP`'s own precedent of preferring
 * the specific named type over the more generic `rigid_anchor_support`
 * (created for a materially different, non-bar-specific overhead anchor —
 * see `DRAGON_FLAG` below) whenever the fiche itself names a bar
 * specifically, which this one does.
 *
 * "# Space Requirements — Vertical clearance sufficient for full
 * suspension. Horizontal clearance sufficient to avoid contact during
 * minor body movement. Stable non-slip landing area. No nearby objects
 * within leg-swing range." No numeric distance is given (unlike the
 * carry family's own metre-based grounding) — this describes a single
 * stationary hanging station, matching `TOWEL_PULL_UP`'s own identical
 * "very_limited" resolution for the same kind of fixed-point suspension
 * exercise. "Stable non-slip landing area" is a DISTINCT, separately
 * listed space-requirement bullet here (unlike `TOWEL_PULL_UP`'s own
 * fiche, which only said "Keep the landing area clear" — a pure
 * clearance concern, not a surface-safety one) — combined with "Primary
 * Safety Concerns... Grip failure" as an explicitly named risk, this
 * grounds a genuine `safe_landing_surface` atom (an unplanned-fall/
 * grip-failure risk from height, the same semantic category already used
 * for `ROPE_CLIMB`), added here where `TOWEL_PULL_UP` had no equivalent
 * textual basis for it.
 *
 * "Biomechanical Profile — Primary Force Vector: Inferior-to-Superior Leg
 * Movement Against Gravity" is explicit and literal — `forceVectors:
 * ["upward"]`.
 */
export const HANGING_LEG_RAISE: ExerciseDefinition = {
  id: "hanging_leg_raise",
  name: "Hanging Leg Raise",
  module: "core",
  // "# Primary Adaptation: Robustness" (explicit). "# Secondary
  // Adaptations: Anterior-Core Strength, Dynamic Anti-Extension Capacity,
  // Posterior Pelvic Control, Hip-Flexion Strength, Grip Endurance,
  // Active Shoulder Stability" — none map cleanly to a distinct
  // AdaptationDomain value; `secondaryAdaptations` is omitted.
  primaryAdaptation: "robustness",
  // "# Capability Mapping — Primary: Dynamic Trunk Strength, Anterior-Core
  // Capacity, Pelvic Control" → trunk_strength. "Secondary: Grip
  // Endurance" → grip_strength. "Shoulder-Girdle Stability" → stability.
  // "Anti-Extension Capacity" → trunk_strength (already listed).
  // "Whole-Body Coordination" → coordination. "Hip-Flexor Strength" has
  // no distinct PhysicalQuality counterpart (no "hip strength" enum
  // value exists) and is not force-fitted.
  physicalQualities: ["trunk_strength", "grip_strength", "stability", "coordination"],
  // "# Movement Pattern — Primary: Trunk Flexion." MovementPattern has no
  // plain "flexion" value — its `anti_flexion` member represents
  // RESISTING flexion, the opposite concept from this exercise's own
  // concentric, actively produced trunk/hip flexion — using it here would
  // be a direct mislabel. Combined with "Secondary: Hip Flexion,
  // Posterior Pelvic Tilt", the honest representation of this
  // multi-joint concentric action (with no single MovementPattern value
  // covering it) is `"mixed"`. "Active Hang" / "Anti-Swing Control" →
  // isometric (shoulder-girdle and grip stabilization throughout).
  movementPatterns: ["mixed", "isometric"],
  forceVectors: ["upward"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "pull_up_bar" },
          { kind: "environment", capability: "safe_landing_surface" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "very_limited" },
        ],
      },
    ],
  },
  // "# Technical Complexity — Level 4 — Advanced Technique."
  minimumTechnicalLevel: 4,
  complexity: "high",
  // No explicit "Unilateral or Bilateral" field exists; both hands hang
  // from the bar and both legs move together throughout (no per-side
  // prescription anywhere in this fiche) — a genuinely bilateral
  // movement.
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Rectus Abdominis, External
  // Obliques, Internal Obliques, Iliopsoas, Rectus Femoris" → abdomen
  // (Rectus Abdominis, External/Internal Obliques), hip (Iliopsoas), thigh
  // (Rectus Femoris). Forearm/grip/shoulder musculature is listed only
  // under Secondary Muscles and is excluded, matching this file's
  // established primary-only convention (even though grip/shoulder
  // demand is real and separately captured through `physicalQualities`
  // and `contraindications` below).
  bodyRegionsLoaded: ["abdomen", "hip", "thigh"],
  // "# Contraindications and Restrictions — Absolute Contraindications",
  // quoted one item per source line. "Unstable or unsafe overhead
  // equipment" is excluded — an equipment/environment concern already
  // captured by `requirements`, matching this file's established
  // exclusion of equivalent "unsafe [setup]" phrases elsewhere (e.g.
  // `ROPE_CLIMB`/`FARMER_CARRY`). "Relative Contraindications" are not
  // represented, matching this file's convention throughout.
  contraindications: [
    { description: "Acute shoulder injury preventing hanging.", prohibitedPatterns: ["mixed", "isometric"], absolute: true },
    {
      description: "Acute elbow, wrist or hand injury preventing safe grip.",
      prohibitedPatterns: ["mixed", "isometric"],
      absolute: true,
    },
    { description: "Severe grip impairment.", prohibitedPatterns: ["mixed", "isometric"], absolute: true },
    { description: "Acute abdominal injury.", prohibitedPatterns: ["mixed", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Physiological Cost" uses a different category template than
    // DEAD_BUG/HOLLOW_BODY_HOLD's own Neural/Muscular/Connective/
    // Metabolic split: "Global Fatigue ★★☆☆☆, Local Trunk Fatigue
    // ★★★★☆, Grip Fatigue ★★★☆☆, Shoulder-Girdle Fatigue ★★★☆☆, Joint
    // Stress ★★☆☆☆, Recovery Cost ★★☆☆☆." Mapped as: "Global Fatigue" →
    // neural (the closest available proxy for overall CNS/systemic
    // demand in this template, applied identically for DRAGON_FLAG
    // below); "Local Trunk Fatigue" → muscular; "Joint Stress" →
    // connectiveTissue. No explicit metabolic line exists in this
    // section — "# Physiological Profile — Metabolic Cost ★★★☆☆" (an
    // earlier section in this same fiche) is used instead.
    // `types` includes ratings explicitly at or above "Moderate": muscular
    // (4, "Local Trunk Fatigue" high), metabolic (3), and the dedicated
    // "grip" fatigue signal is real and explicitly named ("Grip Fatigue
    // ★★★☆☆") but `FatigueType`'s own "grip" member is never used
    // anywhere else in this catalog even for equally grip-dominant
    // entries (FARMER_CARRY, PINCH_CARRY, ROPE_CLIMB) — not introduced
    // here either, to stay consistent with that established (if
    // unwritten) precedent; the grip-fatigue signal is instead captured
    // through `physicalQualities: ["grip_strength", ...]` above. `neural`
    // (2) and `connectiveTissue` (2, "Joint Stress ★★☆☆☆") are excluded
    // from `types`, both below the "Moderate" threshold.
    types: ["muscular", "metabolic"],
    neural: 2,
    muscular: 4,
    metabolic: 3,
    connectiveTissue: 2,
    technical: 4, // fallback from "Complexity Level: 4" (minimumTechnicalLevel 4)
  },
  // "# Evidence Classification — Evidence Level: Level 2 — Expert
  // Practice".
  evidenceLevel: "level_2",
  // "# Relative Transfer Score — Krav Maga ★★★☆☆". See DEAD_BUG's own
  // comment above for why only this one discipline is populated.
  combatSportRelevance: { krav_maga: 3 },
  // "# Substitution Logic — Preferred Substitutions by Limitation" names
  // "Dead Bug" → dead_bug and "Hollow Body Hold" → hollow_body_hold (both
  // integrated in this same batch). "Captain's Chair Knee Raise" /
  // "Reverse Crunch" / "Lying Leg Raise" / "Ab-Strap Knee Raise" /
  // "Hanging Knee Raise" / "Partial-Range Leg Raise" / "Bent-Knee
  // Supported Raise" name no exercise with its own chapter/catalog id.
  substitutionExerciseIds: ["dead_bug", "hollow_body_hold"],
};

// -----------------------------------------------------------------------------
// Dragon Flag
// Source: 50-exercises/62_CORE/15_DRAGON_FLAG.md
// -----------------------------------------------------------------------------

/**
 * Sixth entry from this batch. `exercisePrescriptionRegistry.ts` has an
 * entry (`dragonFlagEntry`) with `moduleId: "core"`, `laterality:
 * "bilateral"` and `requiredEquipmentCapabilities: ["bench",
 * "rigid_anchor_support"]` — a direct, exact corroboration of this
 * entry's own two-atom equipment requirement below, independently
 * confirming the reading of "# Equipment Requirements — Required: Stable
 * bench, fixed post or equivalent rigid support" AND "Secure overhead or
 * behind-head hand anchor" as two SEPARATE required items, not one. The
 * fiche's own Execution Standard ("Grip the bench, post or handles behind
 * the head") shows these can sometimes be satisfied by the same physical
 * object in practice, but the Equipment Requirements section documents
 * them as two distinct required bullets and the registry corroborates
 * treating them as two distinct atoms — `bench` (the existing,
 * real `EquipmentType` value, used directly since "bench" is the first
 * and most concrete of the "bench, fixed post or equivalent" options; no
 * separate "post" `EquipmentType` exists and none is invented) AND
 * `rigid_anchor_support` (the generic anchor type, correctly used here —
 * this is precisely the "materially different, non-bar-specific anchor
 * concept" the type was created for, per `TOWEL_PULL_UP`'s own comment).
 *
 * "# Space Requirements — Horizontal clearance for full body length.
 * Stable non-slip support. Clear area around the feet and hips.
 * Sufficient room to lower without contact with nearby equipment." "Full
 * body length" clearance is a real, single-station-but-body-sized claim,
 * comparable in magnitude to `PUSH_PRESS`'s own "Moderate floor space"
 * grounding — `minimumSpace: "moderate"`. "Stable non-slip support"
 * describes the required BENCH's own stability (already gated by
 * requiring the `bench` equipment atom itself), not a separate open-floor
 * contact concern the way `AB_WHEEL`'s/`SUITCASE_CARRY`'s own "non-slip
 * surface" language does (the athlete's back rests on the bench, not
 * directly on the floor) — `floor_safe` is deliberately NOT added.
 *
 * "Biomechanical Profile — Primary Force Vector: Gravitational Extension
 * Torque Acting on the Whole-Body Lever" names gravity explicitly as the
 * primary force — `forceVectors: ["downward"]`. "Secondary Force Vector:
 * Upper-Body Pull Against the Fixed Anchor" names a direction relative to
 * an anchor whose own position ("overhead or behind-head") is itself
 * variable per this fiche's own language, too ambiguous to resolve to a
 * single spatial value — not added, consistent with this file's
 * established practice of leaning conservative under genuine ambiguity.
 */
export const DRAGON_FLAG: ExerciseDefinition = {
  id: "dragon_flag",
  name: "Dragon Flag",
  module: "core",
  // "# Primary Adaptation: Robustness" (explicit). "# Secondary
  // Adaptations: Anterior-Core Strength, Dynamic Anti-Extension Capacity,
  // Posterior Pelvic Control, Whole-Body Rigidity, Shoulder-Girdle
  // Stability, Long-Lever Eccentric Strength" — none map cleanly to a
  // distinct AdaptationDomain value; `secondaryAdaptations` is omitted.
  primaryAdaptation: "robustness",
  // "# Capability Mapping — Primary: Advanced Anti-Extension Strength,
  // Anterior-Core Capacity, Whole-Body Tension" → trunk_strength.
  // "Secondary: Posterior Pelvic Control, Eccentric Trunk Strength,
  // Body-Line Control" → trunk_strength (already listed).
  // "Shoulder-Girdle Stability" → stability. "Force Transmission" not
  // mapped, per the convention established at AB_WHEEL above.
  physicalQualities: ["trunk_strength", "stability"],
  // "# Movement Pattern — Primary: Dynamic Anti-Extension" →
  // anti_extension. "Secondary: Posterior Pelvic Tilt, Trunk Flexion
  // Isometric, Shoulder Extension Isometric, Whole-Body Bracing" →
  // isometric.
  movementPatterns: ["anti_extension", "isometric"],
  forceVectors: ["downward"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "all_of",
        items: [
          { kind: "equipment", equipment: "bench" },
          { kind: "equipment", equipment: "rigid_anchor_support" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "moderate" },
        ],
      },
    ],
  },
  // "# Technical Complexity — Level 5 — Highly Advanced Technique."
  minimumTechnicalLevel: 5,
  complexity: "very_high",
  // No explicit "Unilateral or Bilateral" field exists; the body moves as
  // a single rigid, symmetric lever throughout (no per-side prescription
  // anywhere in this fiche) — a genuinely bilateral movement.
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Rectus Abdominis, External
  // Obliques, Internal Obliques, Transversus Abdominis" → abdomen only.
  bodyRegionsLoaded: ["abdomen"],
  // "# Contraindications and Restrictions — Absolute Contraindications",
  // quoted one item per source line. "Unstable bench or anchor" is
  // excluded — an equipment/environment concern already captured by
  // `requirements`.
  contraindications: [
    { description: "Acute cervical injury.", prohibitedPatterns: ["anti_extension", "isometric"], absolute: true },
    {
      description: "Acute shoulder injury preventing safe anchoring.",
      prohibitedPatterns: ["anti_extension", "isometric"],
      absolute: true,
    },
    { description: "Acute abdominal injury.", prohibitedPatterns: ["anti_extension", "isometric"], absolute: true },
    {
      description: "Recent abdominal or spinal surgery without clearance.",
      prohibitedPatterns: ["anti_extension", "isometric"],
      absolute: true,
    },
  ],
  fatigueProfile: {
    // "# Physiological Cost — Global Fatigue ★★☆☆☆, Local Trunk Fatigue
    // ★★★★★, Grip Fatigue ★★☆☆☆, Shoulder-Girdle Fatigue ★★★☆☆, Joint
    // Stress ★★★☆☆, Recovery Cost ★★★☆☆." Mapped identically to
    // HANGING_LEG_RAISE above: "Global Fatigue" → neural, "Local Trunk
    // Fatigue" → muscular, "Joint Stress" → connectiveTissue. No
    // explicit metabolic line exists in this section — "# Physiological
    // Profile — Metabolic Cost ★★☆☆☆" (an earlier section) is used
    // instead. `types` includes muscular (5, "Very High" — the highest
    // local-fatigue rating of any entry in this batch) and
    // connectiveTissue (3, "Joint Stress ★★★☆☆", at the "Moderate"
    // threshold). `neural` (2) and `metabolic` (2) are excluded, both
    // below that threshold; `grip` (2/5, and genuinely minor for this
    // exercise — only a light behind-the-head hand anchor, not a
    // sustained loaded grip) is not introduced as a `types` tag, per the
    // same reasoning given at HANGING_LEG_RAISE above.
    types: ["muscular", "connective_tissue"],
    neural: 2,
    muscular: 5,
    metabolic: 2,
    connectiveTissue: 3,
    technical: 5, // fallback from "Complexity Level: 5" (minimumTechnicalLevel 5)
  },
  // "# Evidence Classification — Evidence Level: Level 3 — Established
  // Practice."
  evidenceLevel: "level_3",
  // "# Relative Transfer Score — Krav Maga ★★★☆☆". See DEAD_BUG's own
  // comment above for why only this one discipline is populated.
  combatSportRelevance: { krav_maga: 3 },
  // "# Substitution Logic — Preferred Substitutions by Limitation" names
  // "Dead Bug" → dead_bug, "Hollow Body Hold" → hollow_body_hold and "Ab
  // Wheel Rollout" → ab_wheel (all three integrated in this same batch).
  // "Reverse Crunch" / "Tuck Dragon Flag" / "Band-Assisted Dragon Flag" /
  // "Body Saw" / "Long-Lever Plank" name no exercise with its own
  // chapter/catalog id.
  substitutionExerciseIds: ["dead_bug", "hollow_body_hold", "ab_wheel"],
};

// -----------------------------------------------------------------------------
// Suitcase Carry
// Source: 50-exercises/62_CORE/17_SUITCASE_CARRY.md
// -----------------------------------------------------------------------------

/**
 * Seventh entry from this batch. `farmer_carry` is already integrated
 * with `50-exercises/66_CARRIES/10_FARMER_CARRY.md` as its sole canonical
 * source — reported as already covered, not touched here. `suitcase_carry`
 * itself has never had a catalog entry anywhere before this batch
 * (confirmed by direct search for `id: "suitcase_carry"` across this
 * file, prior to this change) and `66_CARRIES` does not document it
 * either (that chapter only covers Farmer/Front-Rack/Sandbag/Zercher
 * Carry) — `62_CORE/17_SUITCASE_CARRY.md` is therefore this id's own sole
 * canonical source, with no duplicate-source conflict to resolve.
 *
 * `exercisePrescriptionRegistry.ts` has an entry (`suitcaseCarryEntry`)
 * with `moduleId: "grip"`, `laterality: "unilateral"`,
 * `requiredEquipmentCapabilities: ["loaded_carry_implement"]` and
 * `supportedLoadingModes: ["dumbbell", "kettlebell"]` — corroborating,
 * not overriding, evidence, per this file's established precedence.
 * `module: "grip"` (not `"core"`) is used directly, matching
 * `FARMER_CARRY`'s own identical resolution of the same "# Module
 * Classification — Loaded Carry Exercises... may implement the Core
 * module [or] the Carry module" ambiguity documented in this chapter's
 * own `00_OVERVIEW.md`: `CapabilityModule` has no dedicated `"carry"`
 * value, `"grip"` is the closest real value, and the registry corroborates
 * it directly for this id too.
 *
 * "# Equipment Requirements — Preferred Equipment: Heavy Dumbbell or
 * Kettlebell. Acceptable Equipment: Farmer Carry Handle, Loadable
 * Suitcase Implement, Sandbag with Secure Handle, Purpose-Built Carry
 * Device." Only items with a real, existing `EquipmentType` counterpart
 * are used: `dumbbell`, `kettlebell`, `farmer_handle`, `sandbag`.
 * "Loadable Suitcase Implement" and "Purpose-Built Carry Device" have no
 * `EquipmentType` match and are not force-fitted, matching `FARMER_CARRY`'s
 * own established discipline of only including alternatives that already
 * have their own real `EquipmentType` value.
 *
 * "# Space Requirements — Minimum Space: Approximately 8–10 metres...
 * Preferred Space: 15–30 metres... Surface Requirement: Stable, dry and
 * non-slip." The metre-based distance is comparable in magnitude to
 * `ROPE_PULL`'s own "5 to 15 metres... 10 to 30 metres" grounding —
 * `minimumSpace: "large"`. "Surface Requirement: Stable, dry and
 * non-slip" is a genuine open-floor safety property for a WALKING
 * exercise with no jump/landing phase — the same `floor_safe` resolution
 * already used for `PUSH_PRESS`'s own identical "Stable non-slip
 * surface" language.
 *
 * "Biomechanical Profile — Primary Force Vector: Vertical Gravitational
 * Load Through One Hand" → vertical. "Secondary Force Vector: Lateral
 * Bending and Rotational Torque Acting on the Trunk and Pelvis" →
 * lateral, rotational.
 */
export const SUITCASE_CARRY: ExerciseDefinition = {
  id: "suitcase_carry",
  name: "Suitcase Carry",
  module: "grip",
  // "# Primary Adaptation: Robustness" (explicit). "# Secondary
  // Adaptations: Anti-Lateral-Flexion Strength, Anti-Rotation Capacity,
  // Grip Strength, Pelvic Stability, Shoulder-Girdle Stability, Postural
  // Endurance, Loaded Gait Capacity, Asymmetrical Force Transmission" —
  // none map cleanly to a distinct AdaptationDomain value;
  // `secondaryAdaptations` is omitted.
  primaryAdaptation: "robustness",
  // "# Capability Mapping — Primary: Anti-Lateral-Flexion Capacity, Trunk
  // Stiffness" → trunk_strength. "Unilateral Loaded Carry Capacity" →
  // general_work_capacity, matching FARMER_CARRY's own "Work Capacity" →
  // general_work_capacity precedent. "Secondary: Grip Strength" →
  // grip_strength (exact). "Pelvic Control", "Shoulder-Girdle Stability",
  // "Postural Control" → stability. "Gait Integrity" → coordination,
  // matching FARMER_CARRY's own identical "Gait Integrity"/"Gait
  // Coordination" → coordination mapping. "Force Transmission" not
  // mapped, per the convention established at AB_WHEEL above.
  physicalQualities: ["trunk_strength", "general_work_capacity", "grip_strength", "stability", "coordination"],
  // "# Movement Pattern — Primary: Unilateral Loaded Locomotion" → carry
  // (matching FARMER_CARRY's own choice to represent loaded locomotion
  // through `carry` alone, without a separate `locomotion` pattern).
  // "Secondary: Anti-Lateral Flexion, Anti-Rotation" → anti_lateral_flexion,
  // anti_rotation (both exact, direct MovementPattern matches).
  // "Isometric Shoulder Depression, Whole-Body Bracing" → isometric.
  movementPatterns: ["carry", "anti_lateral_flexion", "anti_rotation", "isometric"],
  forceVectors: ["vertical", "lateral", "rotational"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "any_of",
        items: [
          { kind: "equipment", equipment: "dumbbell" },
          { kind: "equipment", equipment: "kettlebell" },
          { kind: "equipment", equipment: "farmer_handle" },
          { kind: "equipment", equipment: "sandbag" },
        ],
      },
      {
        kind: "all_of",
        items: [
          { kind: "environment", capability: "floor_safe" },
          { kind: "environment", capability: "sufficient_space", minimumSpace: "large" },
        ],
      },
    ],
  },
  // "# Technical Complexity" gives no single "Level N — Label" line
  // (unlike every other entry in this batch) — only a breakdown ("Setup
  // Complexity: Low, Execution Complexity: Moderate, Coaching
  // Requirement: Moderate, Error Visibility: High, Self-Correction
  // Potential: Moderate to High"). "Execution Complexity: Moderate" is
  // used as the closest available single proxy, since it most directly
  // describes the difficulty of performing the movement itself (as
  // opposed to setup or coaching load).
  minimumTechnicalLevel: 3,
  complexity: "moderate",
  // "# Movement Pattern — Primary: Unilateral Loaded Locomotion"
  // (explicit), corroborated by `exercisePrescriptionRegistry.ts`'s own
  // `laterality: "unilateral"`.
  unilateral: true,
  // "# Muscular Profile — Primary Muscles: Obliques, Quadratus Lumborum,
  // Transversus Abdominis, Erector Spinae, Finger Flexors, Wrist Flexors,
  // Middle Trapezius, Lower Trapezius, Rhomboids" → abdomen (Obliques,
  // Quadratus Lumborum, Transversus Abdominis, Erector Spinae), forearm
  // (Wrist Flexors), hand (Finger Flexors), shoulder (Middle/Lower
  // Trapezius, Rhomboids).
  bodyRegionsLoaded: ["abdomen", "forearm", "hand", "shoulder"],
  // "# Contraindications and Restrictions — Absolute Contraindications",
  // quoted one item per source line.
  contraindications: [
    {
      description: "Acute hand or finger injury preventing secure grip.",
      prohibitedPatterns: ["carry", "anti_lateral_flexion", "anti_rotation", "isometric"],
      absolute: true,
    },
    {
      description: "Acute foot or ankle injury preventing stable walking.",
      prohibitedPatterns: ["carry", "anti_lateral_flexion", "anti_rotation", "isometric"],
      absolute: true,
    },
    {
      description: "Acute spinal pain aggravated by asymmetrical loading.",
      prohibitedPatterns: ["carry", "anti_lateral_flexion", "anti_rotation", "isometric"],
      absolute: true,
    },
    {
      description: "Inability to safely pick up or lower the implement.",
      prohibitedPatterns: ["carry", "anti_lateral_flexion", "anti_rotation", "isometric"],
      absolute: true,
    },
  ],
  fatigueProfile: {
    // "# Physiological Cost" uses a word-based scale, not stars:
    // "Neuromuscular Cost: Moderate to High, Metabolic Cost: Low to
    // Moderate, Musculoskeletal Cost: Moderate, Grip Cost: Moderate to
    // High on the loaded side, Recovery Cost: Low to Moderate." Mapped
    // using this file's established word → Rating5 scale (Low=1, Low to
    // Moderate=2, Moderate=3, Moderate to High=4, High=5): neural = 4
    // ("Neuromuscular Cost"), muscular = 3 ("Musculoskeletal Cost").
    // No dedicated connective-tissue cost line exists in this section —
    // "# Joint Profile — Joint Stress Profile — Spinal Stress: Moderate
    // and asymmetrical" (the primary trunk-loading joint concern of this
    // whole chapter) is used as the closest proxy: connectiveTissue = 3.
    // `types` includes neural (4), muscular (3) and connectiveTissue (3),
    // all at or above "Moderate"; metabolic (2, "Low to Moderate") is
    // excluded, matching this file's established straddling-hedge
    // convention. The explicitly named "Grip Cost: Moderate to High" is
    // not introduced as a `types: ["grip"]` tag, for the same reasoning
    // given at HANGING_LEG_RAISE above (captured instead through
    // `physicalQualities: ["grip_strength", ...]`).
    types: ["neural", "muscular", "connective_tissue"],
    neural: 4,
    muscular: 3,
    metabolic: 2,
    connectiveTissue: 3,
    technical: 3, // fallback from "Execution Complexity: Moderate" (minimumTechnicalLevel 3)
  },
  // "# Evidence Classification — Evidence Level: Moderate." No numbered
  // "Level N" classification is given anywhere in this fiche (checked
  // directly) — unlike every other entry in this batch, which each state
  // an explicit "Level 2"/"Level 3" line. A bare word rating without a
  // numeral does not correspond to any real `EvidenceLevel` enum value
  // and is not guess-mapped to one; `"unknown"` is used, matching this
  // file's own established practice (see FARMER_CARRY) of using
  // `"unknown"` whenever no explicit Evidence Classification numeral
  // exists.
  evidenceLevel: "unknown",
  // "# Relative Transfer Score — General Combat Transfer ★★★★☆, Trunk
  // Robustness Transfer ★★★★★, Grip Transfer ★★★★☆, Pelvic Stability
  // Transfer ★★★★☆, Shoulder Stability Transfer ★★★☆☆, Sport-Specific
  // Technical Transfer ★★☆☆☆." Unlike DEAD_BUG/HOLLOW_BODY_HOLD/
  // HANGING_LEG_RAISE/DRAGON_FLAG above, this carry-family fiche gives no
  // "Krav Maga" line or any other single-discipline rating at all — every
  // category here is a combined capability-transfer score, not a
  // per-discipline one. `combatSportRelevance` is therefore genuinely
  // omitted rather than invented from an unrelated combined figure — the
  // first entry in this batch with no derivable combat-sport data.
  //
  // "# Substitution Logic — Preferred Substitution Hierarchy" names
  // "Pallof Press" → pallof_press and "Farmer Carry" → farmer_carry (the
  // latter already integrated, not part of this batch). "Lighter Suitcase
  // Carry" / "Suitcase Hold" / "Offset Trap-Bar Carry" / "Side Plank" name
  // no exercise with its own chapter/catalog id.
  substitutionExerciseIds: ["pallof_press", "farmer_carry"],
};

// -----------------------------------------------------------------------------
// Overhead Carry
// Source: 50-exercises/62_CORE/18_OVERHEAD_CARRY.md
// -----------------------------------------------------------------------------

/**
 * Eighth and final entry from this batch. `overhead_carry` has never had
 * a catalog entry anywhere before this batch (confirmed by direct search
 * for `id: "overhead_carry"` prior to this change), and `66_CARRIES` does
 * not document it either — `62_CORE/18_OVERHEAD_CARRY.md` is therefore
 * its own sole canonical source, with no duplicate-source conflict.
 *
 * `exercisePrescriptionRegistry.ts` has an entry (`overheadCarryEntry`)
 * with `moduleId: "grip"`, `laterality: "bilateral"`,
 * `requiredEquipmentCapabilities: ["loaded_carry_implement"]` and
 * `supportedLoadingModes: ["dumbbell", "kettlebell"]` — `module: "grip"`
 * used here for the same reason given at SUITCASE_CARRY above.
 *
 * "# Equipment Requirements — Minimum: One dumbbell or kettlebell.
 * Optional: Two dumbbells, Two kettlebells, Barbell, Trap bar frame with
 * overhead attachment, Sandbag, Specialized carry handles." This fiche
 * uses a genuinely different structure from SUITCASE_CARRY's own
 * "Preferred"/"Acceptable" framing (where every listed item was a valid
 * BASE-level alternative): here, only the two items under "Minimum" are
 * the floor requirement — everything under "Optional" is an enhanced
 * variation BEYOND the minimum, not an equally valid base substitute.
 * `any_of` [dumbbell, kettlebell] therefore represents ONLY the Minimum
 * tier, deliberately excluding barbell/sandbag/trap-bar-frame even though
 * each has a real `EquipmentType` counterpart — including them would
 * misrepresent this fiche's own explicit Minimum/Optional split as
 * SUITCASE_CARRY's flatter Preferred/Acceptable one.
 *
 * "# Space Requirements — Minimum: A clear walking lane of approximately
 * 5 metres. Preferred: 10–30 metres of unobstructed space." Comparable in
 * magnitude to SUITCASE_CARRY's/ROPE_PULL's own metre-based grounding —
 * `minimumSpace: "large"`. No "non-slip"/"stable"/"dry" surface language
 * exists anywhere in this fiche (checked directly) — a genuine divergence
 * from SUITCASE_CARRY's own explicit "Surface Requirement: Stable, dry
 * and non-slip" — `floor_safe` is deliberately NOT added here.
 *
 * KNOWN MODEL LIMITATION, flagged explicitly rather than silently
 * approximated: despite being an OVERHEAD carry, this specific fiche's
 * own "# Space Requirements" section gives no numeric or qualitative
 * ceiling/vertical-clearance language at all (unlike `ROPE_CLIMB`'s own
 * explicit "2 to 4 metres" height grounding) — there is no textual
 * quote here to ground an extra clearance-specific tier bump the way
 * `ROPE_CLIMB` earned one. The BACKGROUND model gap already documented at
 * `ROPE_CLIMB` still applies regardless: `EnvironmentCapability` has no
 * ceiling-height atom at all, and `TrainingEnvironment.ceilingHeightMeters`
 * is never read by `exerciseRequirements.ts`'s eligibility evaluation. An
 * athlete could therefore be found eligible for this exercise in an
 * environment with genuinely insufficient overhead clearance to extend an
 * implement fully overhead, and the model has no atom capable of
 * detecting that — a real, unresolved gap, left undisguised rather than
 * papered over with an inflated `minimumSpace` tier not actually grounded
 * in this fiche's own text.
 *
 * "Biomechanical Profile — Primary Force Vector: Vertical Gravitational
 * Load Through the Overhead Implement" → vertical. "Secondary Force
 * Vector: Extension and Rotational Torque Acting on the Shoulder Girdle
 * and Trunk" → rotational.
 *
 * `unilateral`: "# Equipment Requirements — Minimum: One dumbbell or
 * kettlebell" read alone could suggest a unilaterally loaded base form,
 * but `exercisePrescriptionRegistry.ts`'s own `laterality: "bilateral"`
 * plus this fiche's own "# Progression Options — Progress from Bilateral
 * to Unilateral Loading" (explicitly framing unilateral loading as a
 * later ADVANCEMENT, not the starting form) together corroborate
 * `unilateral: false` — the single-implement "Minimum" is read as an
 * equipment-availability floor, not a laterality statement.
 */
export const OVERHEAD_CARRY: ExerciseDefinition = {
  id: "overhead_carry",
  name: "Overhead Carry",
  module: "grip",
  // "# Primary Adaptation: Robustness" (explicit). "# Secondary
  // Adaptations: Overhead Shoulder Stability, Scapular Control,
  // Anti-Extension Capacity, Trunk Stiffness, Grip Endurance, Postural
  // Endurance, Loaded Gait Capacity, Whole-Body Force Transmission" —
  // none map cleanly to a distinct AdaptationDomain value;
  // `secondaryAdaptations` is omitted.
  primaryAdaptation: "robustness",
  // "# Capability Mapping — Primary: Overhead Stability Capacity,
  // Shoulder-Girdle Robustness, Trunk Stiffness" → stability,
  // trunk_strength. "Secondary: Scapular Control, Postural Control" →
  // stability (already listed). "Grip Strength" → grip_strength (exact).
  // "Gait Integrity" → coordination, matching FARMER_CARRY's/
  // SUITCASE_CARRY's own identical mapping. "Anti-Extension Capacity" →
  // trunk_strength (already listed). "Force Transmission" not mapped,
  // per the convention established at AB_WHEEL above.
  physicalQualities: ["stability", "trunk_strength", "grip_strength", "coordination"],
  // "# Movement Pattern — Primary: Overhead Loaded Locomotion" → carry.
  // "Secondary: Anti-Extension" → anti_extension (exact). "Scapular
  // Upward Rotation, Isometric Shoulder Stabilization, Whole-Body
  // Bracing" → isometric.
  movementPatterns: ["carry", "anti_extension", "isometric"],
  forceVectors: ["vertical", "rotational"],
  requiredEquipment: [],
  requirements: {
    required: [
      {
        kind: "any_of",
        items: [
          { kind: "equipment", equipment: "dumbbell" },
          { kind: "equipment", equipment: "kettlebell" },
        ],
      },
      { kind: "all_of", items: [{ kind: "environment", capability: "sufficient_space", minimumSpace: "large" }] },
    ],
  },
  // "# Technical Complexity — ★★★★☆" (no "Level N" numeral or word label
  // exists in this section, unlike every other entry in this batch — the
  // 4-star rating is used directly as the most specific field available,
  // taking priority over the coarser "# Skill Requirement — Intermediate"
  // label elsewhere in this fiche).
  minimumTechnicalLevel: 4,
  complexity: "high",
  unilateral: false,
  // "# Muscular Profile — Primary Muscles: Serratus Anterior, Rotator
  // Cuff, Deltoids, Trapezius, Obliques, Transverse Abdominis" → shoulder
  // (Serratus Anterior, Rotator Cuff, Deltoids, Trapezius), abdomen
  // (Obliques, Transverse Abdominis).
  bodyRegionsLoaded: ["shoulder", "abdomen"],
  // "# Contraindications and Restrictions — Avoid or restrict when the
  // athlete presents:" — this fiche uses a single flat list with no
  // "Absolute"/"Relative" heading split at all (unlike DEAD_BUG/
  // HOLLOW_BODY_HOLD's own "Relative-only" structure or HANGING_LEG_RAISE/
  // DRAGON_FLAG/SUITCASE_CARRY's own explicit two-tier split). Read as
  // this fiche's own functional equivalent of a hard-exclusion list (the
  // items are not hedged with "relative"/"caution" language), quoted one
  // item per source line, all `absolute: true`. The final, separately
  // hedged sentence — "Use unilateral loading cautiously when
  // asymmetrical spinal symptoms are present" — is excluded, matching
  // this file's convention of never representing caution-only guidance as
  // a hard contraindication.
  contraindications: [
    { description: "Acute shoulder pain.", prohibitedPatterns: ["carry", "anti_extension", "isometric"], absolute: true },
    {
      description: "Recent shoulder dislocation or instability.",
      prohibitedPatterns: ["carry", "anti_extension", "isometric"],
      absolute: true,
    },
    { description: "Painful overhead range of motion.", prohibitedPatterns: ["carry", "anti_extension", "isometric"], absolute: true },
    {
      description: "Significant limitation in shoulder flexion.",
      prohibitedPatterns: ["carry", "anti_extension", "isometric"],
      absolute: true,
    },
    { description: "Uncontrolled scapular winging.", prohibitedPatterns: ["carry", "anti_extension", "isometric"], absolute: true },
    { description: "Acute cervical symptoms.", prohibitedPatterns: ["carry", "anti_extension", "isometric"], absolute: true },
    {
      description: "Upper-limb neurological symptoms.",
      prohibitedPatterns: ["carry", "anti_extension", "isometric"],
      absolute: true,
    },
    {
      description: "Inability to maintain rib-cage and pelvic alignment overhead.",
      prohibitedPatterns: ["carry", "anti_extension", "isometric"],
      absolute: true,
    },
    { description: "Inadequate grip security.", prohibitedPatterns: ["carry", "anti_extension", "isometric"], absolute: true },
  ],
  fatigueProfile: {
    // "# Physiological Cost — Neuromuscular Cost: Moderate to High,
    // Metabolic Cost: Low to Moderate, Orthopaedic Cost: Moderate,
    // Recovery Cost: Low to Moderate." No dedicated, separate muscular
    // ("local") cost line exists anywhere in this fiche (checked
    // directly) — unlike SUITCASE_CARRY's own separate "Musculoskeletal
    // Cost" line, this fiche never splits neural from muscular cost, so
    // `muscular` shares the same "Neuromuscular Cost: Moderate to High"
    // value used for `neural`. "Orthopaedic Cost" → connectiveTissue.
    // `types` includes neural (4), muscular (4, shared value) and
    // connectiveTissue (3, "Moderate"), all at or above "Moderate";
    // metabolic (2, "Low to Moderate") is excluded, matching this file's
    // established straddling-hedge convention.
    types: ["neural", "muscular", "connective_tissue"],
    neural: 4,
    muscular: 4,
    metabolic: 2,
    connectiveTissue: 3,
    technical: 4, // fallback from the 4-star Technical Complexity rating (minimumTechnicalLevel 4)
  },
  // "# Evidence Classification — Exercise Category Evidence: Moderate,
  // Direct Combat-Sport Evidence: Limited, Biomechanical Rationale:
  // Strong, Practical Coaching Support: Strong." No numbered "Level N"
  // classification is given anywhere in this fiche (checked directly) —
  // matching SUITCASE_CARRY's own identical situation, `"unknown"` is
  // used rather than guess-mapping a word rating to a numeral.
  evidenceLevel: "unknown",
  // "# Relative Transfer Score — General Athletic Transfer ★★★★☆,
  // Combat-Sport Transfer ★★★☆☆, Shoulder-Robustness Transfer ★★★★★,
  // Core-Stability Transfer ★★★★☆, Grip Transfer ★★★☆☆." No "Krav Maga"
  // line or any other single-discipline rating exists anywhere in this
  // fiche (checked directly) — matching SUITCASE_CARRY's own identical
  // situation, `combatSportRelevance` is genuinely omitted rather than
  // invented from the combined "Combat-Sport Transfer" figure.
  //
  // "# Substitution Logic — Preferred substitutions include" names
  // "Front-Rack Carry" → front_rack_carry (already integrated, not part
  // of this batch), "Farmer Carry" → farmer_carry (already integrated)
  // and "Suitcase Carry" → suitcase_carry (integrated in this same
  // batch). "Landmine Carry" / "Static Overhead Hold" name no exercise
  // with its own chapter/catalog id.
  substitutionExerciseIds: ["front_rack_carry", "farmer_carry", "suitcase_carry"],
};


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
  TOWEL_PULL_UP,
  PLATE_PINCH,
  PINCH_CARRY,
  ROPE_CLIMB,
  ROPE_PULL,
  FARMER_CARRY,
  FRONT_RACK_CARRY,
  SANDBAG_CARRY,
  ZERCHER_CARRY,
  AB_WHEEL,
  PALLOF_PRESS,
  DEAD_BUG,
  HOLLOW_BODY_HOLD,
  HANGING_LEG_RAISE,
  DRAGON_FLAG,
  SUITCASE_CARRY,
  OVERHEAD_CARRY,
  BACK_SQUAT,
  FRONT_SQUAT,
  TRAP_BAR_DEADLIFT,
  ROMANIAN_DEADLIFT,
  HIP_THRUST,
  BULGARIAN_SPLIT_SQUAT,
  WEIGHTED_PULL_UP,
  PULL_UP,
  CHIN_UP,
  BARBELL_ROW,
  CHEST_SUPPORTED_ROW,
  BENCH_PRESS,
  OVERHEAD_PRESS,
  DIP,
  LANDMINE_PRESS,
  NORDIC_HAMSTRING_CURL,
  COPENHAGEN_PLANK,
  TIBIALIS_RAISE,
  SOLEUS_RAISE,
  ROTATOR_CUFF_TRAINING,
  WRIST_STRENGTHENING,
  NECK_TRAINING,
  TECHNICAL_STAND_UP,
  BEAR_CRAWL,
  SHRIMPING,
  BRIDGING,
  TURKISH_GET_UP,
  HEAVY_BAG_POWER_INTERVALS,
  SHADOW_BOXING,
  FOOTWORK_DRILLS,
];
