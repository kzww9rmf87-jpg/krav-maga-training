/**
 * Combat Athlete System — Athlete Reference Catalog
 * Version 0.1
 *
 * `IntensityReferenceType` (`types.ts`) is already the closed, typed
 * vocabulary for athlete references — this file does not add a tenth
 * value to it. It documents the nine that already exist, notes which
 * resolver or numerical-profile mechanism actually consumes each one, and
 * flags which are used anywhere in the pilot exercise registry today.
 * `usedByPilotRegistry: false` is not a placeholder for a future
 * invented reference — it means exactly what it says: no pilot exercise
 * currently requires it.
 */

import type { IntensityReferenceType } from "./types";

export interface AthleteReferenceCatalogEntry {
  referenceType: IntensityReferenceType;
  /** Where this reference type is actually consumed in the implemented pipeline. */
  consumedBy: string;
  usedByPilotRegistry: boolean;
}

export const ATHLETE_REFERENCE_CATALOG: readonly AthleteReferenceCatalogEntry[] = [
  {
    referenceType: "one_rep_max",
    consumedBy:
      "resolveIntensity.ts: percentage_1rm rules (buildCalculation, outputUnit \"kilograms\"); required by bench_press, back_squat and trap_bar_deadlift.",
    usedByPilotRegistry: true,
  },
  {
    referenceType: "training_max",
    consumedBy: "resolveIntensity.ts: percentage_training_max rules (buildCalculation).",
    usedByPilotRegistry: false,
  },
  {
    referenceType: "body_mass",
    consumedBy: "resolveIntensity.ts: percentage_body_mass rules (buildCalculation).",
    usedByPilotRegistry: false,
  },
  {
    referenceType: "max_heart_rate",
    consumedBy: "IntensityType \"heart_rate\" — no resolver in the pilot registry currently uses this intensity type.",
    usedByPilotRegistry: false,
  },
  {
    referenceType: "heart_rate_reserve",
    consumedBy: "IntensityType \"heart_rate\" — no resolver in the pilot registry currently uses this intensity type.",
    usedByPilotRegistry: false,
  },
  {
    referenceType: "max_aerobic_speed",
    consumedBy: "IntensityType \"pace\" — no resolver in the pilot registry currently uses this intensity type.",
    usedByPilotRegistry: false,
  },
  {
    referenceType: "baseline_velocity",
    consumedBy: "IntensityType \"velocity\" — no resolver in the pilot registry currently uses this intensity type.",
    usedByPilotRegistry: false,
  },
  {
    referenceType: "baseline_pace",
    consumedBy: "IntensityType \"pace\" — no resolver in the pilot registry currently uses this intensity type.",
    usedByPilotRegistry: false,
  },
  {
    referenceType: "equipment_setting",
    consumedBy: "IntensityType \"assistance_level\" (e.g. assisted pull-up machine setting) — not used by the pilot registry's plain Pull-Up entry, which uses RPE/RIR instead.",
    usedByPilotRegistry: false,
  },
];

const ATHLETE_REFERENCE_TYPE_SET: ReadonlySet<string> = new Set(
  ATHLETE_REFERENCE_CATALOG.map((entry) => entry.referenceType),
);

export const isKnownAthleteReferenceType = (value: unknown): value is IntensityReferenceType =>
  typeof value === "string" && ATHLETE_REFERENCE_TYPE_SET.has(value);

export const getAthleteReferenceCatalogEntry = (
  referenceType: IntensityReferenceType,
): AthleteReferenceCatalogEntry => {
  const entry = ATHLETE_REFERENCE_CATALOG.find((candidate) => candidate.referenceType === referenceType);
  if (entry === undefined) {
    throw new Error(`Athlete reference catalog is missing an entry for "${referenceType}" — this is a contract bug.`);
  }
  return entry;
};
