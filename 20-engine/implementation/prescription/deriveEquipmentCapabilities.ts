/**
 * Combat Athlete System — Training Environment → Equipment Capability Derivation
 * Version 0.1
 *
 * The canonical bridge between the engine's two equipment vocabularies:
 *
 *   `EquipmentType`          (`types.ts`) — what the athlete declares, what
 *                            the Knowledge Base gates eligibility on;
 *   `EquipmentCapabilityId`  (`equipmentCapabilities.ts`) — what the
 *                            prescription registry gates source resolution
 *                            on.
 *
 * Before this file no such bridge existed, and the caller had to hand-write
 * a capability list. That is a training-domain translation — knowing that a
 * cable machine satisfies `cable_or_band_resistance`, that a climbing rope
 * does NOT satisfy `battle_rope`, that a padded wall for wrestling is not
 * the same authorization as a wall rated to receive a thrown medicine ball
 * — and it belongs to CAS, never to the platform calling it. The end-to-end
 * audit recorded the consequence: `pallof_press` is eligible whenever a
 * cable machine or a band exists, but its prescription requires
 * `cable_or_band_resistance`, so a hand-written list that omitted that id
 * produced a selected-but-unprescribed exercise
 * (`PRESCRIPTION_SOURCE_NOT_PROVIDED`, see Lot 1).
 *
 * Every mapping below is grounded in a source already in the repository —
 * the capability's own entry in `equipmentCapabilities.ts`, or the
 * `ExerciseRequirements` the Knowledge Base already declares for the exact
 * exercises that require that capability. Nothing here is inferred from a
 * name resembling another name.
 *
 * WHAT THIS FILE DOES NOT DO. It never decides whether an exercise is
 * appropriate, never selects, never doses, never reads readiness, never
 * looks at `availableSpace`, and never invents an equipment hierarchy. It
 * answers exactly one question: given what the athlete declared, which
 * prescription capabilities are present?
 */

import type { EquipmentType, TrainingEnvironment } from "../types";
import { EQUIPMENT_CAPABILITY_IDS, type EquipmentCapabilityId } from "./equipmentCapabilities";

// -----------------------------------------------------------------------------
// 1. Direct one-to-one mappings
// -----------------------------------------------------------------------------

/**
 * Capabilities whose `EquipmentType` counterpart is the SAME physical thing
 * under the SAME name. `equipmentCapabilities.ts` documents each of these as
 * "aligned 1:1 with `EquipmentType`", and matching in
 * `getExercisePrescriptionSource` is exact string equality, so the mapping
 * is an identity rather than a judgment.
 *
 * Written as an explicit list rather than derived from the name collision,
 * so that a future capability that merely happens to share a spelling with
 * an `EquipmentType` cannot become a silent mapping. Adding a member here is
 * a deliberate act.
 *
 * The pairs the vocabulary keeps DELIBERATELY DISJOINT are preserved by the
 * identity, and each is a real safety distinction documented at its own
 * entry in `equipmentCapabilities.ts`:
 * - `rope` (climbing) vs `battle_rope` — anchored overhead and climbed vs
 *   anchored at floor level and driven in waves;
 * - `cardio_machine` (air bike) vs `rowing_ergometer` — one precise
 *   apparatus each, no hierarchy between them;
 * - `medicine_ball` (rebounding) vs `slam_ball` (non-rebounding) — the
 *   non-rebounding property is safety-relevant;
 * - `rigid_anchor_support` (gripped by the hand) vs `rope_anchor_point`
 *   (never gripped);
 * - `wall` (rated to receive a thrown implement) vs `usable_wall` (rated
 *   for an opponent to be controlled against) — see section 3.
 */
const CAPABILITY_BY_EQUIPMENT_TYPE = {
  // -- Deliberately unmapped (see UNMAPPED rationale below) ------------------
  bodyweight: null,
  box: null,
  sandbag: null,
  farmer_handle: null,
  other: null,
  // -- One-to-one ------------------------------------------------------------
  barbell: "barbell",
  bench: "bench",
  rack: "rack",
  plates: "plates",
  pull_up_bar: "pull_up_bar",
  cable_machine: "cable_machine",
  resistance_band: "resistance_band",
  dumbbell: "dumbbell",
  kettlebell: "kettlebell",
  open_space: "open_space",
  trap_bar: "trap_bar",
  plyometric_box: "plyometric_box",
  rigid_anchor_support: "rigid_anchor_support",
  pinch_grip_implement: "pinch_grip_implement",
  knee_protection_pad: "knee_protection_pad",
  slam_ball: "slam_ball",
  medicine_ball: "medicine_ball",
  wall: "wall",
  dip_bars: "dip_bars",
  mat: "mat",
  rowing_ergometer: "rowing_ergometer",
  ab_wheel: "ab_wheel",
  battle_rope: "battle_rope",
  rope_anchor_point: "rope_anchor_point",
  heavy_bag: "heavy_bag",
  cardio_machine: "cardio_machine",
  towel: "towel",
  rope: "rope",
  sled: "sled",
} as const satisfies Record<EquipmentType, EquipmentCapabilityId | null>;

/**
 * The table above is TOTAL over `EquipmentType` — `satisfies
 * Record<EquipmentType, …>` makes a missing key a compile error, so a member
 * added to that union cannot reach production until someone decides, in
 * writing, whether it grants a capability. `null` is that decision recorded,
 * never an oversight:
 *
 * - `bodyweight` — no registry entry requires a bodyweight capability; the
 *   vocabulary has no such id and none is invented here.
 * - `box` — a generic box is NOT `plyometric_box`. Both exist as separate
 *   `EquipmentType` members and the Knowledge Base gates `box_jump` and
 *   `depth_jump` on `plyometric_box` specifically. Mapping one to the other
 *   would invent an equivalence no chapter grants, and would put an athlete
 *   jumping onto an unrated surface.
 * - `sandbag`, `farmer_handle` — real implements with no 1:1 capability of
 *   their own. They are not dropped: both contribute to
 *   `loaded_carry_implement` in section 2.
 * - `other` — a catch-all carrying no identifiable implement. Mapping it to
 *   anything would let an unspecified object satisfy a named requirement.
 */
const UNMAPPED_EQUIPMENT_TYPES = Object.entries(CAPABILITY_BY_EQUIPMENT_TYPE)
  .filter(([, capability]) => capability === null)
  .map(([equipmentType]) => equipmentType as EquipmentType);

// -----------------------------------------------------------------------------
// 2. Equivalence groups (OR semantics)
// -----------------------------------------------------------------------------

/**
 * `requiredEquipmentCapabilities` is an AND-only list — the prescription
 * layer has no OR primitive (see `equipmentCapabilities.ts`). An equivalence
 * group is how a chapter's "A or B or C" is represented as one id, and it is
 * satisfied by ANY ONE of its members.
 *
 * `cable_or_band_resistance` — exact and unambiguous. Both exercises that
 * require it declare, in the Knowledge Base, the identical clause
 * `any_of[cable_machine | resistance_band]`: `pallof_press` and
 * `rotator_cuff_training`. The group is that clause, restated.
 *
 * `loaded_carry_implement` — the union of every implement the six carries
 * that require it accept, read directly from their own Knowledge Base
 * `any_of` clauses:
 *
 *   farmer_carry      dumbbell | kettlebell | farmer_handle | trap_bar
 *   front_rack_carry  kettlebell | dumbbell | barbell | sandbag
 *   sandbag_carry     sandbag
 *   zercher_carry     barbell | sandbag
 *   suitcase_carry    dumbbell | kettlebell | farmer_handle | sandbag
 *   overhead_carry    dumbbell | kettlebell
 *
 * Those six sets are NOT identical, so this one id is deliberately COARSER
 * than any single exercise's real requirement. That is safe, and only
 * because of an ordering invariant the pipeline already guarantees:
 * eligibility runs before prescription-source resolution, and eligibility
 * evaluates each exercise's own precise clause against the same environment
 * (`exerciseSelector.ts` → `evaluateExerciseRequirements`). An exercise
 * therefore cannot reach this capability check unless its exact implement is
 * already present. A sandbag-only athlete derives `loaded_carry_implement`,
 * but `overhead_carry` was already ruled ineligible upstream and can never
 * be selected, so the coarser id never authorizes a carry the athlete cannot
 * load.
 *
 * The honest statement of what this group means is therefore: "at least one
 * documented carry implement is present", never "this specific carry is
 * possible". If prescription-source resolution ever becomes the FIRST
 * equipment gate for some exercise, this group must be split per exercise
 * rather than reused.
 */
const EQUIVALENCE_GROUP_MEMBERS = {
  cable_or_band_resistance: ["cable_machine", "resistance_band"],
  loaded_carry_implement: ["dumbbell", "kettlebell", "farmer_handle", "trap_bar", "barbell", "sandbag"],
} as const satisfies Partial<Record<EquipmentCapabilityId, readonly EquipmentType[]>>;

// -----------------------------------------------------------------------------
// 3. Environment-derived capabilities (not physical implements)
// -----------------------------------------------------------------------------

/**
 * Two capabilities are environmental facts rather than items the athlete
 * owns, and neither can come from `availableEquipment`.
 *
 * `safe_landing_surface` ← `environment.floorSafe === true`. This mirrors,
 * rather than invents, the decision the Knowledge Base already made:
 * `exerciseRequirements.ts` evaluates the `floor_safe` and
 * `safe_landing_surface` atoms from the same `floorSafe` field, stating in
 * writing that "no separate data exists for 'safe landing surface' today".
 * Reading a different field here would make the two layers disagree about
 * the same athlete.
 *
 * `usable_wall` ← `environment.usableWall === true`. The capability's own
 * entry documents it as aligned 1:1 with the Knowledge Base's `usable_wall`
 * `EnvironmentCapability`, which reads exactly this field.
 *
 * Both are strict `=== true`: an undefined safety-relevant flag is never
 * read as permission, matching `checkFloorSafety`'s existing rule that
 * "an unknown safety-critical environment value is never assumed safe".
 *
 * `wall` is NOT derived here — it is a declared implement
 * (`availableEquipment`), handled in section 1. The distinction is
 * load-bearing and documented at both entries: a surface authorized to
 * receive a thrown medicine ball is not thereby authorized for two athletes
 * to drive into each other against it, and vice versa. Deriving one from
 * the other would grant an authorization no chapter gives.
 *
 * `availableSpace` is deliberately NOT read. It is a graded scale
 * (`very_limited` … `open`) that the Knowledge Base already enforces through
 * its own `sufficient_space` atom during eligibility. The `open_space`
 * capability is a declared `EquipmentType`, not a space level; deriving it
 * from `availableSpace === "open"` would conflate two different questions
 * and let a large empty field satisfy a requirement the athlete never
 * declared.
 */
function deriveEnvironmentCapabilities(environment: TrainingEnvironment): EquipmentCapabilityId[] {
  const derived: EquipmentCapabilityId[] = [];

  if (environment.floorSafe === true) {
    derived.push("safe_landing_surface");
  }
  if (environment.usableWall === true) {
    derived.push("usable_wall");
  }

  return derived;
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Every `EquipmentCapabilityId` the prescription layer may consider
 * available for `environment`.
 *
 * Deterministic and pure: the result is deduplicated and returned in
 * `EQUIPMENT_CAPABILITY_IDS` order, so it never depends on the order in
 * which the athlete happened to declare equipment, and two calls with
 * equivalent environments always produce an identically-ordered array.
 * `environment` is never mutated.
 *
 * An unknown or unmapped `EquipmentType` contributes nothing and is never an
 * error — declaring a piece of equipment the prescription layer has no
 * vocabulary for is a normal state, not a malformed input.
 */
export function deriveEquipmentCapabilities(
  environment: TrainingEnvironment,
): readonly EquipmentCapabilityId[] {
  const declaredTypes = new Set<EquipmentType>(environment.availableEquipment.map((item) => item.type));
  const derived = new Set<EquipmentCapabilityId>();

  for (const equipmentType of declaredTypes) {
    // `?? null` rather than a non-null assertion: an `EquipmentType` value
    // arriving from unvalidated JSON may not be in the table at runtime even
    // though the union says it must be.
    const capability = CAPABILITY_BY_EQUIPMENT_TYPE[equipmentType] ?? null;
    if (capability !== null) {
      derived.add(capability);
    }
  }

  for (const [groupId, members] of Object.entries(EQUIVALENCE_GROUP_MEMBERS) as [
    EquipmentCapabilityId,
    readonly EquipmentType[],
  ][]) {
    if (members.some((member) => declaredTypes.has(member))) {
      derived.add(groupId);
    }
  }

  for (const capability of deriveEnvironmentCapabilities(environment)) {
    derived.add(capability);
  }

  return EQUIPMENT_CAPABILITY_IDS.filter((capability) => derived.has(capability));
}

// -----------------------------------------------------------------------------
// Introspection (documentation and tests, never a decision input)
// -----------------------------------------------------------------------------

/**
 * The `EquipmentType` members that deliberately grant no capability.
 * Exhaustiveness over `EquipmentType` is enforced by the `satisfies` clause
 * on the table itself, not by this list — it is exported so a test can
 * assert the SET of unmapped members stays exactly the five documented
 * above, making any future `null` decision visible in a diff.
 */
export const EQUIPMENT_TYPES_WITHOUT_CAPABILITY: readonly EquipmentType[] = UNMAPPED_EQUIPMENT_TYPES;

/** The `EquipmentType` → `EquipmentCapabilityId` table, `null` where no capability is granted. */
export const EQUIPMENT_TYPE_CAPABILITY_TABLE: Readonly<Record<EquipmentType, EquipmentCapabilityId | null>> =
  CAPABILITY_BY_EQUIPMENT_TYPE;

/** The `EquipmentType` members that map 1:1 to a capability, in table order. */
export const DIRECTLY_MAPPED_EQUIPMENT_TYPES: readonly EquipmentType[] = Object.entries(
  CAPABILITY_BY_EQUIPMENT_TYPE,
)
  .filter(([, capability]) => capability !== null)
  .map(([equipmentType]) => equipmentType as EquipmentType);

/** The equivalence groups and the `EquipmentType` members that satisfy each. */
export const EQUIPMENT_CAPABILITY_EQUIVALENCE_GROUPS = EQUIVALENCE_GROUP_MEMBERS;

/**
 * Capabilities that come from `TrainingEnvironment` flags rather than from
 * declared equipment — exported for the exhaustiveness test in section 3.
 */
export const ENVIRONMENT_DERIVED_CAPABILITIES: readonly EquipmentCapabilityId[] = [
  "safe_landing_surface",
  "usable_wall",
];
