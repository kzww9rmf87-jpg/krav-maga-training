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
] as const;

export type EquipmentCapabilityId = (typeof EQUIPMENT_CAPABILITY_IDS)[number];

// -----------------------------------------------------------------------------
// Groups
// -----------------------------------------------------------------------------

export const EQUIPMENT_CAPABILITY_GROUPS = {
  barbell_strength: ["barbell", "bench", "rack", "plates", "trap_bar"],
  bodyweight_apparatus: ["pull_up_bar"],
  carry_implements: ["loaded_carry_implement", "dumbbell", "kettlebell"],
  resistance_apparatus: ["cable_machine", "resistance_band", "cable_or_band_resistance"],
  plyometric_environment: ["plyometric_box", "safe_landing_surface", "open_space"],
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
