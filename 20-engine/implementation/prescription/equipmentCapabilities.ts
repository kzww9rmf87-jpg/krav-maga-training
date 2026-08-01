/**
 * Combat Athlete System — Equipment Capability Vocabulary
 * Version 0.1
 *
 * A single, closed vocabulary for `ExercisePrescriptionCapabilities.requiredEquipmentCapabilities`
 * and `PrescriptionExecutionContext.availableEquipmentCapabilities`, so a new
 * registry entry can never invent its own ad hoc equipment string.
 *
 * Aligned, wherever the underlying concept is identical, with the engine's
 * own `EquipmentType` union already defined in `types.ts` (`barbell`,
 * `bench`, `rack`, `plates`, `pull_up_bar`, `cable_machine`,
 * `resistance_band`, `dumbbell`, `kettlebell`, `open_space` — same
 * spelling, same meaning). Two kinds of identifier exist beyond that
 * overlap:
 *
 * - implements `EquipmentType` does not cover (`trap_bar`);
 * - equivalence groups, used when a chapter documents several
 *   interchangeable implements joined by "or" (e.g. Farmer Carry:
 *   "Dumbbells, Kettlebells, Farmer Handles, Trap Bar or Similar
 *   Implements"). `ExercisePrescriptionCapabilities.requiredEquipmentCapabilities`
 *   is an AND-only list — there is no OR primitive anywhere in the
 *   prescription layer's types. Splitting such a requirement into four
 *   separately-required ids would silently turn "any one of these" into
 *   "all four, simultaneously", which is false to the source document.
 *   A single equivalence-group id (`loaded_carry_implement`,
 *   `cable_or_band_resistance`) is therefore the accurate representation,
 *   not a shortcut;
 * - environmental/spatial capabilities that are not physical items at all
 *   (`safe_landing_surface`), grounded in a chapter's own "Equipment
 *   Requirements" surface-safety criteria rather than invented.
 *
 * This file contains no prescription logic and no dependency on the iOS
 * application — only a closed identifier list, groupings and pure
 * validators.
 */

import type { Identifier } from "../types";

// -----------------------------------------------------------------------------
// Canonical identifiers
// -----------------------------------------------------------------------------

export const EQUIPMENT_CAPABILITY_IDS = [
  // Aligned 1:1 with `EquipmentType` in types.ts
  "barbell",
  "bench",
  "rack",
  "plates",
  "pull_up_bar",
  "cable_machine",
  "resistance_band",
  "dumbbell",
  "kettlebell",
  "open_space",
  // Implements not covered by `EquipmentType`
  "trap_bar",
  "plyometric_box",
  // Equivalence groups — "any one of several interchangeable implements"
  "loaded_carry_implement",
  "cable_or_band_resistance",
  // Environmental / spatial capabilities (not a physical item)
  "safe_landing_surface",
  // Added during the family-by-family registry extension (Force / Power /
  // Core / Carries / Grip / Plyometrics / Ballistics) — each grounded in a
  // real "Equipment Requirements" section, none duplicating an existing id.
  "rigid_anchor_support", // Dragon Flag: "Secure overhead or behind-head hand anchor"
  "pinch_grip_implement", // Pinch Carry: "Weight Plates or Pinch Blocks" — distinct grip geometry from loaded_carry_implement
  "knee_protection_pad", // Knee Jump: "Dense Knee Pad or Folded Exercise Mat"
  "slam_ball", // Med Ball Slam: "Slam Ball or Non-Rebounding Medicine Ball" — non-rebounding is safety-relevant, distinct from a regular medicine ball
  "medicine_ball", // Standard (rebounding-capable) medicine ball used for passes and throws — aligned with `EquipmentType`/`LoadingMode`'s existing "medicine_ball" value, but never mirrored here until now. Deliberately distinct from `slam_ball`: no automatic substitution between the two.
  "wall", // A resistant vertical surface authorized to receive a thrown implement — aligned with `EquipmentType`'s existing "wall" value. Never implied by `open_space`; must be declared explicitly.
  // Added for the Strength-immediate registry lot (chest_supported_row,
  // dip, landmine_press, weighted_pull_up, neck_training,
  // nordic_hamstring_curl).
  "dip_bars", // Dip: "Required: Parallel Bars" — aligned 1:1 with the knowledge base's own distinct `EquipmentType` member of the same name (`dip_bars`), unlike a generic pull-up bar.
  // Added for the Movement-immediate registry lot (bridging,
  // technical_stand_up, shrimping — all three document "Required: Mat").
  "mat", // Aligned 1:1 with the knowledge base's own distinct `EquipmentType` member of the same name, already used by these same three ExerciseDefinitions' own Requirements Model.
  // Added for the first conditioning/interval registry entry
  // (rowerg_intervals).
  //
  // Aligned 1:1 with the knowledge base's own `rowing_ergometer`
  // `EquipmentType` member, added in the same change: RowErg Intervals'
  // "# Equipment Requirements — Required: Concept2 RowErg, or Equivalent
  // Rowing Ergometer" names one precise apparatus, and this list is matched
  // exactly (`missingValues` in `validateCompatibility.ts`, exact string
  // equality in `getExercisePrescriptionSource`).
  //
  // This is NOT an equivalence group like `loaded_carry_implement`: "or
  // Equivalent Rowing Ergometer" names other brands of the SAME apparatus,
  // not a choice between different implements. The generic
  // `cardio_machine` concept is deliberately not mirrored here — no
  // registry entry needs it, and adding it would invite exactly the
  // hierarchy ("a rowing ergometer is a cardio machine") this vocabulary
  // has no primitive for and does not want.
  "rowing_ergometer",
  // Added for the first Core repetition registry entry (ab_wheel).
  //
  // Aligned 1:1 with the knowledge base's own `ab_wheel` `EquipmentType`
  // member, added in the same change to replace a flagged `"other"`
  // catch-all. Matched exactly, like every id in this list.
  //
  // NOT an equivalence group: the Ab Wheel chapter lists "Acceptable
  // Alternatives" (barbell with rotating plates, stability ball,
  // suspension trainer, sliding discs, towels) but denies their
  // equivalence in the same breath — "An alternative must therefore be
  // treated as a separate variation rather than an identical
  // implementation". Building a `loaded_carry_implement`-style group from
  // them would contradict the source document.
  "ab_wheel",
  // Added for the first battle-rope entry (battle_ropes). TWO ids, because
  // "# Equipment Requirements — Required: Battle Ropes, Anchor Point" names
  // two separate required items, exactly as the knowledge base already
  // encoded them as two atoms.
  //
  // Both are aligned 1:1 with `EquipmentType` members added in the same
  // change, and both REPLACE an imprecise value the knowledge base was
  // already using:
  //
  // - `battle_rope` replaces the generic `rope`, which BATTLE_ROPES' own
  //   block comment already flagged as a MODEL LIMITATION. `rope` remains
  //   in the vocabulary for ROPE_CLIMB and ROPE_PULL, which genuinely mean
  //   a climbing rope; matching is exact, so a climbing rope no longer
  //   satisfies a battle-rope requirement and vice versa. NOT an
  //   equivalence group — one implement, one id;
  // - `rope_anchor_point` replaces `rigid_anchor_support`, whose scope this
  //   catalog documents twice as a HAND-GRIP anchor (Dragon Flag's "Secure
  //   overhead or behind-head hand anchor"). A battle-rope anchor is a
  //   fixed structural point the ROPES attach to and the athlete never
  //   grips. `rigid_anchor_support` stays untouched for dragon_flag and
  //   towel_pull_up, which do mean a hand anchor.
  //
  // Neither is a substitute for the other, and no equivalence is created
  // with rope, towel, suspension trainer, heavy_bag, sled or
  // resistance_band.
  "battle_rope",
  "rope_anchor_point",
  // Added for the first combat bag entry (heavy_bag_power_intervals).
  //
  // Aligned 1:1 with the knowledge base's own pre-existing `heavy_bag`
  // `EquipmentType` member — nothing was added to that union for this id.
  // 33_EXERCISE_PRESCRIPTION_CAPABILITIES' own "Exercise Family 12 —
  // Combat Bag and Pad Work" names "heavy bag" first in its Required
  // Equipment Capabilities, and 27_HEAVY_BAG_POWER_INTERVALS names it
  // first under "Required".
  //
  // NOT an equivalence group: a heavy bag is one apparatus. Family 12 also
  // names pads, mitts and kick shields, but those are DIFFERENT implements
  // serving different exercises, not interchangeable with a heavy bag, and
  // no entry needs them yet — none is added speculatively.
  //
  // Family 12's "secure bag mounting" is deliberately NOT mirrored as a
  // separate id: no fiche documents it as its own Required item, and the
  // mounting requirement is carried where it is actionable, in the setup
  // instruction.
  "heavy_bag",
  // Added for the air-bike interval entry (assault_bike_intervals).
  //
  // Aligned 1:1 with the knowledge base's own pre-existing `cardio_machine`
  // `EquipmentType` member — nothing was added to that union, and the
  // ExerciseDefinition was not touched: `cardio_machine` is already the atom
  // it gates on. The only gap this closes is the vocabulary asymmetry, the
  // prescription layer having no way to express an atom the knowledge base
  // already used.
  //
  // NOT an equivalence group in the `loaded_carry_implement` sense, and NOT
  // a substitute for `rowing_ergometer`. Matching is exact, so a rowing
  // ergometer does not satisfy it and it does not satisfy a rowing
  // ergometer — the two are deliberately disjoint since `rowerg_intervals`
  // was narrowed to its own precise id. `assault_bike_intervals` is today
  // the only user of `cardio_machine` in either vocabulary; its own fiche
  // documents "Assault Bike, or Echo Bike", two brands of the SAME
  // air-resistance apparatus, which is why one generic id is honest here
  // rather than two.
  "cardio_machine",
  // Added for the first Grip repetition entry (towel_pull_up).
  //
  // Aligned 1:1 with the knowledge base's own pre-existing `towel`
  // `EquipmentType` member — nothing was added to that union and no
  // ExerciseDefinition was touched: `towel` is already one of the two atoms
  // this exercise gates on. The gap was the vocabulary asymmetry alone.
  //
  // NOT an equivalence group and NOT a substitute for anything: a towel is
  // not a rope, a strap, a suspension trainer or a thick-grip attachment.
  // Matching is exact, so `rope` does not satisfy it and it does not
  // satisfy `rope` — which is what keeps towel_pull_up and the rope
  // exercises apart at the prescription layer.
  "towel",
] as const;

export type EquipmentCapabilityId = (typeof EQUIPMENT_CAPABILITY_IDS)[number];

// -----------------------------------------------------------------------------
// Groups
// -----------------------------------------------------------------------------

export const EQUIPMENT_CAPABILITY_GROUPS = {
  barbell_strength: ["barbell", "bench", "rack", "plates", "trap_bar"],
  bodyweight_apparatus: ["pull_up_bar", "rigid_anchor_support"],
  carry_implements: ["loaded_carry_implement", "dumbbell", "kettlebell", "pinch_grip_implement"],
  resistance_apparatus: ["cable_machine", "resistance_band", "cable_or_band_resistance"],
  plyometric_environment: ["plyometric_box", "safe_landing_surface", "open_space", "knee_protection_pad"],
  // Grouped by physical/environmental category only — group membership is
  // informational (`getEquipmentCapabilityGroups`) and never used to imply
  // equivalence or substitution between members. `slam_ball` and
  // `medicine_ball` are both physical implements but remain two separate,
  // individually-required ids within this group.
  ballistic_implements: ["slam_ball", "medicine_ball"],
  // `wall` is an environmental/spatial capability (a receiving surface),
  // not a physical implement — kept in its own group rather than folded
  // into `ballistic_implements`, matching the file's own distinction
  // between implements and environmental capabilities (see file header).
  throwing_environment: ["wall"],
} as const satisfies Record<string, readonly EquipmentCapabilityId[]>;

export type EquipmentCapabilityGroup = keyof typeof EQUIPMENT_CAPABILITY_GROUPS;

// -----------------------------------------------------------------------------
// Pure helpers
// -----------------------------------------------------------------------------

const EQUIPMENT_CAPABILITY_ID_SET: ReadonlySet<string> = new Set(EQUIPMENT_CAPABILITY_IDS);

export const isEquipmentCapabilityId = (value: unknown): value is EquipmentCapabilityId =>
  typeof value === "string" && EQUIPMENT_CAPABILITY_ID_SET.has(value);

/** The group(s) a capability id belongs to — usually one, but a group's membership is not exclusive. */
export const getEquipmentCapabilityGroups = (
  capabilityId: EquipmentCapabilityId,
): readonly EquipmentCapabilityGroup[] =>
  (Object.keys(EQUIPMENT_CAPABILITY_GROUPS) as EquipmentCapabilityGroup[]).filter((group) =>
    (EQUIPMENT_CAPABILITY_GROUPS[group] as readonly EquipmentCapabilityId[]).includes(capabilityId),
  );

/** Every requested id that is not part of the canonical vocabulary — empty when the list is fully valid. */
export const findUnknownEquipmentCapabilities = (values: readonly Identifier[]): readonly Identifier[] =>
  values.filter((value) => !isEquipmentCapabilityId(value));
