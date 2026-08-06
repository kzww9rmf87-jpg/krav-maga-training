/**
 * Combat Athlete System — Adaptation Drivers
 * Version 0.1
 *
 * Which exercise ROLES can carry which ADAPTATION.
 *
 * WHY THIS EXISTS. Lot H2 established that a session can be contract-valid and
 * still not be the session that was requested, and classified an exercise as
 * "driving" or not using one fixed list of support roles. That list was
 * objective-blind, and objective-blindness is wrong in both directions:
 *
 * - a maximum-strength session built entirely of accessory work is not a
 *   maximum-strength session;
 * - a ROBUSTNESS session built entirely of accessory work is exactly what a
 *   robustness session is (`tibialis_raise`, `soleus_raise`,
 *   `wrist_strengthening` are all `accessory` in the registry), and calling it
 *   inadequate would be a false alarm.
 *
 * So "driver" is a relation between a role and an adaptation, not a property of
 * a role. This file is that relation, stated once.
 *
 * NO SECOND ROLE SYSTEM. `ExerciseRole` already exists, is already resolved for
 * every prescribed exercise, and is already the value the finished prescription
 * carries. Nothing here re-classifies an exercise, adds a field, or touches
 * display metadata. This is a mapping over the vocabulary that exists.
 */

import type { AdaptationDomain } from "./types";
import type { ExerciseRole } from "./prescription/types";

/**
 * The roles able to DRIVE each adaptation.
 *
 * `primary` and `secondary` drive everything by definition: they are the roles
 * that name a movement's own contribution rather than its supporting one.
 * Beyond those, each adaptation admits the roles that genuinely carry it:
 *
 * - `conditioning` — a conditioning session is driven by conditioning work
 *   (`rowerg_intervals`, `sprint_intervals`, `assault_bike_intervals`).
 * - `specific_skill` — a skill session is driven by technical work
 *   (`shadow_boxing`, `footwork_drills`, `sprawl`).
 * - `movement` and `recovery` — driven by technical, corrective and recovery
 *   work; these adaptations are about quality of movement, not about load.
 * - `robustness` — driven by robustness AND accessory work. This is the
 *   asymmetry that matters: the registry's robustness-module exercises carry
 *   the `accessory` role, so excluding it would make every robustness session
 *   report as inadequate.
 *
 * `maximum_strength`, `power` and `functional_hypertrophy` admit ONLY `primary`
 * and `secondary`. That is the whole point of the Neck Training regression: no
 * amount of accessory work establishes maximum-strength coverage.
 */
export const DRIVER_ROLES_BY_ADAPTATION: Readonly<Record<AdaptationDomain, readonly ExerciseRole[]>> = {
  maximum_strength: ["primary", "secondary"],
  power: ["primary", "secondary"],
  functional_hypertrophy: ["primary", "secondary"],
  conditioning: ["primary", "secondary", "conditioning"],
  specific_skill: ["primary", "secondary", "technical"],
  movement: ["primary", "secondary", "technical", "corrective", "recovery"],
  recovery: ["primary", "secondary", "recovery", "corrective", "technical"],
  robustness: ["primary", "secondary", "robustness", "accessory", "corrective"],
};

/**
 * Whether `role` can drive `adaptation`.
 *
 * An exercise with no registry role cannot be shown to drive anything, and is
 * treated as a non-driver: absence of evidence is not evidence of capability,
 * and inventing coverage is exactly the failure this area exists to prevent.
 */
export function isDriverRoleFor(adaptation: AdaptationDomain, role: ExerciseRole | null): boolean {
  if (role === null) {
    return false;
  }
  return DRIVER_ROLES_BY_ADAPTATION[adaptation].includes(role);
}

/**
 * The roles that drive `adaptation`, for reporting.
 *
 * Returned as a fresh array so a trace entry can hold it without aliasing the
 * table above.
 */
export function driverRolesFor(adaptation: AdaptationDomain): ExerciseRole[] {
  return [...DRIVER_ROLES_BY_ADAPTATION[adaptation]];
}
