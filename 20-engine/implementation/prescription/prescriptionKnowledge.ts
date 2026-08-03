/**
 * Combat Athlete System — Prescription Knowledge
 * Version 0.1
 *
 * Finite numerical prescription profiles documented in
 * 34_NUMERICAL_PRESCRIPTION_TABLES.md.
 *
 * This file contains data and deterministic lookup helpers only.
 * It does not prescribe an exercise by itself.
 */

import type { CapabilityModule, Identifier } from "../types";
import type {
  ExerciseRole,
  IntensityType,
  MovementIntent,
  VolumeStructure,
} from "./types";
import type { TrainingMethodId } from "./contracts";

export interface IntegerRange {
  min: number;
  normal: number;
  max: number;
}

export interface NumericRange {
  min: number;
  normal: number;
  max: number;
}

export interface DurationRangeSeconds extends NumericRange {
  unit: "seconds";
}

export interface DistanceRangeMeters extends NumericRange {
  unit: "meters";
}

export interface RepetitionRule {
  type: "fixed_range";
  range: IntegerRange;
}

export interface DurationRule {
  type: "fixed_range";
  range: DurationRangeSeconds;
  scope: "per_set" | "per_round" | "per_interval" | "total";
}

export interface DistanceRule {
  type: "fixed_range";
  range: DistanceRangeMeters;
  scope: "per_set" | "per_side" | "per_interval" | "total";
}

export interface NumericalVolumeProfile {
  structure: VolumeStructure;
  sets: IntegerRange | null;
  repetitions: RepetitionRule | null;
  duration: DurationRule | null;
  distance: DistanceRule | null;
  rounds: IntegerRange | null;
  workIntervals: IntegerRange | null;
}

export interface IntensityRangeRule {
  type: IntensityType;
  min: number;
  normal: number;
  max: number;
  unit:
    | "percentage"
    | "rpe_scale_1_10"
    | "repetitions"
    | "kilograms"
    | "category";
  referenceType:
    | "one_rep_max"
    | "training_max"
    | "body_mass"
    | null;
  sourceRuleIds: readonly Identifier[];
}

export interface IntensityCategoryRule {
  type: "movement_intent" | "technical_effort" | "impact_intent";
  value: string;
  sourceRuleIds: readonly Identifier[];
}

export type NumericalIntensityRule =
  | IntensityRangeRule
  | IntensityCategoryRule;

export interface NumericalRestRule {
  scope:
    | "between_sets"
    | "between_rounds"
    | "between_intervals"
    | "not_applicable";
  seconds: IntegerRange | null;
  sourceRuleIds: readonly Identifier[];
}

export interface NumericalTempoRule {
  type: "global_intent" | "phase_intent" | "isometric_hold" | "none";
  globalIntent: MovementIntent | null;
  sourceRuleIds: readonly Identifier[];
}

export interface DoseBoundary {
  sets: number | null;
  repetitions: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  rounds: number | null;
  workIntervals: number | null;
}

export interface NumericalPrescriptionProfile {
  profileId: Identifier;
  version: "0.1";
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  exerciseRole: ExerciseRole;
  volume: NumericalVolumeProfile;
  intensity: readonly NumericalIntensityRule[];
  rest: NumericalRestRule | null;
  tempo: NumericalTempoRule | null;
  minimumDose: DoseBoundary;
  maximumDose: DoseBoundary;
  requiresExerciseSpecificLoadRule: boolean;
  requiresSportSpecificSubtype: boolean;
  sourceRuleIds: readonly Identifier[];
}

export type RangeContext = "reduced" | "normal" | "high";

const SOURCE_NUMERICAL_TABLES = "34_NUMERICAL_PRESCRIPTION_TABLES_V0_1";
const SOURCE_INTENSITY_MODEL = "26_INTENSITY_MODEL_V0_1";
const SOURCE_REST_TEMPO = "27_REST_TEMPO_RULES_V0_1";

/**
 * The Movement-module rest doctrine for resisted partner rounds, written in
 * 32_MODULE_PRESCRIPTION_PROFILES.md ("Module 2 — Movement → Partner
 * Grappling Rounds → Rest Between Rounds") for this lot.
 *
 * It exists as its own identifier, separate from `SOURCE_REST_TEMPO`, so
 * that the one number in Table Group 18 that NO exercise chapter documents
 * is individually traceable to the engineering decision that created it —
 * and can never be mistaken for a value read off pummeling, wall_wrestling
 * or grip_fighting.
 */
const SOURCE_PARTNER_GRAPPLING_REST = "MOVEMENT_PARTNER_GRAPPLING_REST_V0_1";

/**
 * The Power-module rest doctrine for repeated loaded locomotor efforts,
 * written in 32_MODULE_PRESCRIPTION_PROFILES.md ("Module 3 — Power → Loaded
 * Locomotion Power → Rest Between Efforts") and in
 * 50-exercises/64_POWER/00_OVERVIEW.md for this lot.
 *
 * Its own identifier for the same reason as the partner-grappling band above:
 * no exercise chapter in this category documents inter-effort rest, so the
 * one number Table Group 19 cannot read off a chapter stays individually
 * traceable to the decision that created it, and can never be mistaken for a
 * value read off the sled push chapter.
 *
 * Unlike the partner-grappling band, this one is not invented from first
 * principles: it ADOPTS the Power overview's own Peak Power Development rest
 * figure (2-4 minutes), the only rest range that document states, and applies
 * it to repeated locomotor efforts. That adoption is itself the engineering
 * decision, and it is recorded rather than performed silently.
 */
const SOURCE_LOADED_LOCOMOTION_REST = "POWER_LOADED_LOCOMOTION_REST_V0_1";

const integerRange = (min: number, normal: number, max: number): IntegerRange => ({
  min,
  normal,
  max,
});

const durationRange = (
  min: number,
  normal: number,
  max: number,
): DurationRangeSeconds => ({ min, normal, max, unit: "seconds" });

const distanceRange = (
  min: number,
  normal: number,
  max: number,
): DistanceRangeMeters => ({ min, normal, max, unit: "meters" });

const emptyDose = (): DoseBoundary => ({
  sets: null,
  repetitions: null,
  durationSeconds: null,
  distanceMeters: null,
  rounds: null,
  workIntervals: null,
});

export const NUMERICAL_PRESCRIPTION_PROFILES = [
  {
    profileId: "strength_primary_straight_sets_v0_1",
    version: "0.1",
    moduleId: "strength",
    methodId: "straight_sets_repetitions",
    exerciseRole: "primary",
    volume: {
      structure: "sets_reps",
      sets: integerRange(2, 3, 4),
      repetitions: { type: "fixed_range", range: integerRange(3, 5, 6) },
      duration: null,
      distance: null,
      rounds: null,
      workIntervals: null,
    },
    intensity: [
      {
        type: "percentage_1rm",
        min: 80,
        normal: 85,
        max: 90,
        unit: "percentage",
        referenceType: "one_rep_max",
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
      {
        type: "rpe",
        min: 7.5,
        normal: 8,
        max: 9,
        unit: "rpe_scale_1_10",
        referenceType: null,
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
      {
        type: "rir",
        min: 1,
        normal: 2,
        max: 3,
        unit: "repetitions",
        referenceType: null,
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_sets",
      seconds: integerRange(180, 180, 300),
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: {
      type: "phase_intent",
      globalIntent: "maximal_safe_speed",
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    minimumDose: {
      ...emptyDose(),
      sets: 2,
      repetitions: 3,
    },
    maximumDose: {
      ...emptyDose(),
      sets: 4,
      repetitions: 6,
    },
    requiresExerciseSpecificLoadRule: false,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    profileId: "strength_secondary_straight_sets_v0_1",
    version: "0.1",
    moduleId: "strength",
    methodId: "straight_sets_repetitions",
    exerciseRole: "secondary",
    volume: {
      structure: "sets_reps",
      sets: integerRange(2, 3, 3),
      repetitions: { type: "fixed_range", range: integerRange(4, 6, 8) },
      duration: null,
      distance: null,
      rounds: null,
      workIntervals: null,
    },
    intensity: [
      {
        type: "percentage_1rm",
        min: 70,
        normal: 77,
        max: 85,
        unit: "percentage",
        referenceType: "one_rep_max",
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
      {
        type: "rpe",
        min: 7,
        normal: 8,
        max: 8.5,
        unit: "rpe_scale_1_10",
        referenceType: null,
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_sets",
      seconds: integerRange(120, 150, 240),
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: null,
    minimumDose: { ...emptyDose(), sets: 2, repetitions: 4 },
    maximumDose: { ...emptyDose(), sets: 3, repetitions: 8 },
    requiresExerciseSpecificLoadRule: false,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    profileId: "functional_hypertrophy_primary_v0_1",
    version: "0.1",
    moduleId: "functional_hypertrophy",
    methodId: "straight_sets_repetitions",
    exerciseRole: "primary",
    volume: {
      structure: "sets_reps",
      sets: integerRange(3, 3, 4),
      repetitions: { type: "fixed_range", range: integerRange(6, 8, 12) },
      duration: null,
      distance: null,
      rounds: null,
      workIntervals: null,
    },
    intensity: [
      {
        type: "rpe",
        min: 7,
        normal: 8,
        max: 9,
        unit: "rpe_scale_1_10",
        referenceType: null,
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
      {
        type: "rir",
        min: 1,
        normal: 2,
        max: 3,
        unit: "repetitions",
        referenceType: null,
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_sets",
      seconds: integerRange(90, 120, 180),
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: {
      type: "phase_intent",
      globalIntent: "controlled",
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    minimumDose: { ...emptyDose(), sets: 3, repetitions: 6 },
    maximumDose: { ...emptyDose(), sets: 4, repetitions: 12 },
    requiresExerciseSpecificLoadRule: false,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    profileId: "power_primary_repetition_sets_v0_1",
    version: "0.1",
    moduleId: "power",
    methodId: "power_repetition_sets",
    exerciseRole: "primary",
    volume: {
      structure: "sets_reps",
      sets: integerRange(3, 4, 5),
      repetitions: { type: "fixed_range", range: integerRange(2, 3, 5) },
      duration: null,
      distance: null,
      rounds: null,
      workIntervals: null,
    },
    intensity: [
      {
        type: "movement_intent",
        value: "maximal_acceleration",
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
      {
        type: "percentage_1rm",
        min: 30,
        normal: 50,
        max: 70,
        unit: "percentage",
        referenceType: "one_rep_max",
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_sets",
      seconds: integerRange(120, 180, 300),
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: {
      type: "global_intent",
      globalIntent: "maximal_acceleration",
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    minimumDose: { ...emptyDose(), sets: 3, repetitions: 2 },
    maximumDose: { ...emptyDose(), sets: 5, repetitions: 5 },
    requiresExerciseSpecificLoadRule: true,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    profileId: "timed_isometric_core_robustness_v0_1",
    version: "0.1",
    moduleId: "core",
    methodId: "timed_isometric_sets",
    exerciseRole: "robustness",
    volume: {
      structure: "sets_duration",
      sets: integerRange(2, 3, 4),
      repetitions: null,
      duration: {
        type: "fixed_range",
        range: durationRange(10, 20, 40),
        scope: "per_set",
      },
      distance: null,
      rounds: null,
      workIntervals: null,
    },
    intensity: [
      {
        type: "rpe",
        min: 6,
        normal: 7,
        max: 8,
        unit: "rpe_scale_1_10",
        referenceType: null,
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
      {
        type: "technical_effort",
        value: "high_quality",
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_sets",
      seconds: integerRange(45, 60, 120),
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: {
      type: "isometric_hold",
      globalIntent: null,
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    minimumDose: { ...emptyDose(), sets: 2, durationSeconds: 10 },
    maximumDose: { ...emptyDose(), sets: 4, durationSeconds: 40 },
    requiresExerciseSpecificLoadRule: false,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    // Profile ISO-GRIP (Table Group 4 — Timed Isometrics). The Grip
    // module's isometric half: Table Group 5 covers grip work prescribed as
    // a loaded carry (`distance_carry_strength_grip_v0_1`), this one covers
    // grip work prescribed as a timed hold.
    //
    // Documented in the canonical table since V0.1 but never implemented,
    // because the table as written could not produce a prescription. Two
    // defects were found and corrected in the table itself before this
    // profile was written:
    //   - its role list opened with `primary`, which
    //     `timed_isometric_sets` does not support — every entry declaring it
    //     failed `METHOD_ROLE_INCOMPATIBLE` before any number was read;
    //   - it documented no tempo at all, while the method declares
    //     `tempoPolicy: required` — `resolveTempo` would have failed with
    //     `TEMPO_REQUIRED_BUT_UNDOCUMENTED` on every input, the same class
    //     of non-executability `conditioning_short_intervals_v0_1` still has
    //     on intensity.
    //
    // The table's corrected role list is "secondary, accessory, or
    // robustness"; this profile encodes the first-listed, the same
    // convention `repeated_sprint_intervals_v0_1` uses for its own
    // multi-role table entry. An accessory or robustness variant would be a
    // separate profile.
    //
    // `requiresExerciseSpecificLoadRule` mirrors the table's "or an
    // exercise-specific external-load rule", exactly as
    // `distance_carry_strength_grip_v0_1` mirrors the same clause: RPE
    // resolves normally, and no absolute or body-mass load is ever invented
    // from a plate weight the table does not give.
    profileId: "timed_isometric_grip_v0_1",
    version: "0.1",
    moduleId: "grip",
    methodId: "timed_isometric_sets",
    exerciseRole: "secondary",
    volume: {
      structure: "sets_duration",
      sets: integerRange(2, 3, 4),
      repetitions: null,
      duration: {
        type: "fixed_range",
        range: durationRange(10, 20, 30),
        scope: "per_set",
      },
      distance: null,
      rounds: null,
      workIntervals: null,
    },
    intensity: [
      {
        type: "rpe",
        min: 7,
        normal: 8,
        max: 9,
        unit: "rpe_scale_1_10",
        referenceType: null,
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_sets",
      seconds: integerRange(60, 90, 150),
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: {
      type: "isometric_hold",
      globalIntent: null,
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    minimumDose: { ...emptyDose(), sets: 2, durationSeconds: 10 },
    maximumDose: { ...emptyDose(), sets: 4, durationSeconds: 30 },
    requiresExerciseSpecificLoadRule: true,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    profileId: "distance_carry_strength_grip_v0_1",
    version: "0.1",
    moduleId: "grip",
    methodId: "distance_carry_sets",
    exerciseRole: "primary",
    volume: {
      structure: "sets_distance",
      sets: integerRange(2, 3, 4),
      repetitions: null,
      duration: null,
      distance: {
        type: "fixed_range",
        range: distanceRange(15, 25, 40),
        scope: "per_set",
      },
      rounds: null,
      workIntervals: null,
    },
    intensity: [
      {
        type: "rpe",
        min: 7,
        normal: 8,
        max: 9,
        unit: "rpe_scale_1_10",
        referenceType: null,
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_sets",
      seconds: integerRange(60, 120, 180),
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: null,
    minimumDose: { ...emptyDose(), sets: 2, distanceMeters: 15 },
    maximumDose: { ...emptyDose(), sets: 4, distanceMeters: 40 },
    requiresExerciseSpecificLoadRule: true,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    profileId: "controlled_mobility_sets_v0_1",
    version: "0.1",
    moduleId: "movement",
    methodId: "controlled_mobility_sets",
    exerciseRole: "technical",
    volume: {
      structure: "sets_duration",
      sets: integerRange(1, 2, 3),
      repetitions: null,
      duration: {
        type: "fixed_range",
        range: durationRange(20, 30, 60),
        scope: "per_set",
      },
      distance: null,
      rounds: null,
      workIntervals: null,
    },
    intensity: [
      {
        type: "rpe",
        min: 2,
        normal: 3,
        max: 5,
        unit: "rpe_scale_1_10",
        referenceType: null,
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
      {
        type: "technical_effort",
        value: "high_quality",
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_sets",
      seconds: integerRange(0, 15, 45),
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: {
      type: "global_intent",
      globalIntent: "technical_precision",
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    minimumDose: { ...emptyDose(), sets: 1, durationSeconds: 20 },
    maximumDose: { ...emptyDose(), sets: 3, durationSeconds: 60 },
    requiresExerciseSpecificLoadRule: false,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    profileId: "continuous_aerobic_conditioning_v0_1",
    version: "0.1",
    moduleId: "conditioning",
    methodId: "continuous_aerobic_duration",
    exerciseRole: "conditioning",
    volume: {
      structure: "continuous_duration",
      sets: null,
      repetitions: null,
      duration: {
        type: "fixed_range",
        range: durationRange(1200, 1800, 2700),
        scope: "total",
      },
      distance: null,
      rounds: null,
      workIntervals: null,
    },
    intensity: [
      {
        type: "rpe",
        min: 3,
        normal: 4,
        max: 6,
        unit: "rpe_scale_1_10",
        referenceType: null,
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "not_applicable",
      seconds: null,
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: null,
    minimumDose: { ...emptyDose(), durationSeconds: 1200 },
    maximumDose: { ...emptyDose(), durationSeconds: 2700 },
    requiresExerciseSpecificLoadRule: false,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    profileId: "recovery_duration_work_v0_1",
    version: "0.1",
    moduleId: "recovery",
    methodId: "recovery_duration_work",
    exerciseRole: "recovery",
    volume: {
      structure: "continuous_duration",
      sets: null,
      repetitions: null,
      duration: {
        type: "fixed_range",
        range: durationRange(600, 900, 1800),
        scope: "total",
      },
      distance: null,
      rounds: null,
      workIntervals: null,
    },
    intensity: [
      {
        type: "rpe",
        min: 1,
        normal: 2,
        max: 4,
        unit: "rpe_scale_1_10",
        referenceType: null,
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
      {
        type: "technical_effort",
        value: "easy_technical",
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "not_applicable",
      seconds: null,
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: null,
    minimumDose: { ...emptyDose(), durationSeconds: 600 },
    maximumDose: { ...emptyDose(), durationSeconds: 1800 },
    requiresExerciseSpecificLoadRule: false,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    profileId: "combat_technical_rounds_v0_1",
    version: "0.1",
    moduleId: "conditioning",
    methodId: "combat_rounds",
    exerciseRole: "technical",
    volume: {
      structure: "rounds_duration",
      sets: null,
      repetitions: null,
      duration: {
        type: "fixed_range",
        range: durationRange(60, 120, 180),
        scope: "per_round",
      },
      distance: null,
      rounds: integerRange(2, 3, 5),
      workIntervals: null,
    },
    intensity: [
      {
        type: "rpe",
        min: 4,
        normal: 5,
        max: 7,
        unit: "rpe_scale_1_10",
        referenceType: null,
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
      {
        type: "technical_effort",
        value: "high_quality",
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_rounds",
      seconds: integerRange(60, 60, 120),
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: null,
    minimumDose: { ...emptyDose(), rounds: 2, durationSeconds: 60 },
    maximumDose: { ...emptyDose(), rounds: 5, durationSeconds: 180 },
    requiresExerciseSpecificLoadRule: false,
    requiresSportSpecificSubtype: true,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    profileId: "robustness_accessory_straight_sets_v0_1",
    version: "0.1",
    moduleId: "robustness",
    methodId: "straight_sets_repetitions",
    exerciseRole: "accessory",
    volume: {
      structure: "sets_reps",
      sets: integerRange(2, 3, 5),
      repetitions: { type: "fixed_range", range: integerRange(10, 20, 30) },
      duration: null,
      distance: null,
      rounds: null,
      workIntervals: null,
    },
    intensity: [
      {
        type: "rpe",
        min: 3,
        normal: 5,
        max: 8,
        unit: "rpe_scale_1_10",
        referenceType: null,
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
      {
        type: "technical_effort",
        value: "high_quality",
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_sets",
      seconds: integerRange(45, 60, 90),
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: {
      type: "global_intent",
      globalIntent: "controlled",
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    minimumDose: { ...emptyDose(), sets: 2, repetitions: 10 },
    maximumDose: { ...emptyDose(), sets: 5, repetitions: 30 },
    requiresExerciseSpecificLoadRule: false,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    profileId: "strength_accessory_straight_sets_v0_1",
    version: "0.1",
    moduleId: "strength",
    methodId: "straight_sets_repetitions",
    exerciseRole: "accessory",
    volume: {
      structure: "sets_reps",
      sets: integerRange(2, 3, 6),
      repetitions: { type: "fixed_range", range: integerRange(4, 8, 15) },
      duration: null,
      distance: null,
      rounds: null,
      workIntervals: null,
    },
    intensity: [
      {
        type: "rpe",
        min: 6,
        normal: 7,
        max: 8,
        unit: "rpe_scale_1_10",
        referenceType: null,
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_sets",
      seconds: integerRange(90, 120, 180),
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: null,
    minimumDose: { ...emptyDose(), sets: 2, repetitions: 4 },
    maximumDose: { ...emptyDose(), sets: 6, repetitions: 15 },
    requiresExerciseSpecificLoadRule: false,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    // Profile CORE-REPETITION-ROBUSTNESS (Table Group 13 — Core Repetition
    // Work). The Core module's other half: Table Group 4 covers Core work
    // prescribed as a timed hold (`timed_isometric_core_robustness_v0_1`),
    // this one covers Core work prescribed in repetitions.
    //
    // Scope is the repetition-prescribed family named by
    // 50-exercises/62_CORE/00_OVERVIEW.md's own "Volume Principles" (Ab
    // Wheel, Pallof Press, Dead Bug, Hanging Leg Raise, Dragon Flag) — not
    // any single exercise. Each member narrows this envelope to its own
    // documented bounds via `exerciseDoseConstraints` /
    // `exerciseIntensityConstraints`; the envelope is never widened.
    //
    // The table's role list is "robustness, secondary, accessory, or
    // corrective", mirroring ISO-CORE-ROBUSTNESS. This profile encodes the
    // first-listed role, the same convention `repeated_sprint_intervals_v0_1`
    // already uses for its own "conditioning or power" table entry — a
    // secondary/accessory/corrective variant would be a separate profile.
    //
    // Every value is taken from the table, which sources each dimension
    // separately: sets floor/normal and the whole rest and RPE envelope come
    // unchanged from Table Group 4's established Core doctrine; the set
    // ceiling and the repetition floor/ceiling come from this family's own
    // exercise records; the repetition normal is the one stated in
    // 62_CORE/00_OVERVIEW.md's own worked prescription example. None of them
    // is an average between exercises.
    //
    // Phase-timed tempos documented by individual records (Ab Wheel's
    // `3-1-2` / `2-0-2` / `4-1-2`) are NOT representable here —
    // `NumericalTempoRule.type` admits only global_intent / phase_intent /
    // isometric_hold / none. Documented precision loss, recorded in the
    // table; those timings stay in the exercise's own instructions.
    profileId: "core_robustness_straight_sets_v0_1",
    version: "0.1",
    moduleId: "core",
    methodId: "straight_sets_repetitions",
    exerciseRole: "robustness",
    volume: {
      structure: "sets_reps",
      sets: integerRange(2, 3, 5),
      repetitions: { type: "fixed_range", range: integerRange(3, 10, 15) },
      duration: null,
      distance: null,
      rounds: null,
      workIntervals: null,
    },
    intensity: [
      {
        type: "rpe",
        min: 6,
        normal: 7,
        max: 8,
        unit: "rpe_scale_1_10",
        referenceType: null,
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
      {
        type: "technical_effort",
        value: "high_quality",
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_sets",
      seconds: integerRange(45, 60, 120),
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: {
      type: "global_intent",
      globalIntent: "controlled",
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    minimumDose: { ...emptyDose(), sets: 2, repetitions: 3 },
    // "The maximum boundaries must not be combined automatically" — these are
    // validation ceilings per dimension, not a 5x15 prescription target.
    maximumDose: { ...emptyDose(), sets: 5, repetitions: 15 },
    requiresExerciseSpecificLoadRule: false,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  // ---------------------------------------------------------------------------
  // Table Group 8 — General Work-Rest Intervals.
  //
  // The three profiles below share the triple
  // (conditioning, work_rest_intervals, conditioning) — the first genuinely
  // ambiguous triple in this file. Any registry entry on that triple must
  // declare an explicit `numericalProfileId`
  // (`AMBIGUOUS_TRIPLE_REQUIRES_EXPLICIT_PROFILE` in `registryValidators.ts`);
  // implicit unique-triple resolution deliberately fails with
  // `NUMERICAL_PROFILE_AMBIGUOUS` and never picks by array order.
  //
  // The documented work-to-rest ratios (INT-SHORT 1:1 to 2:1,
  // INT-REPEATED-SPRINT greater than 1:8) have no field in this schema —
  // they are documentation-level guidance on combining the documented work
  // and rest ranges, not separately encoded rules.
  // ---------------------------------------------------------------------------
  {
    // Profile INT-SHORT — DELIBERATELY NOT EXECUTABLE (see
    // `isExecutableNumericalProfile`). Its volume and rest envelopes are
    // fully documented and encoded; its intensity cannot be, so the profile
    // is knowledge the engine holds but cannot yet prescribe.
    //
    // The table requires "one of: a percentage of a validated maximal
    // aerobic or sport-specific reference; pace; power; heart rate; or
    // documented RPE" — and gives no number for any of them. The first four
    // are unencodable in this schema: `IntensityRangeRule.unit` admits only
    // percentage/RPE/repetitions/kilograms/category (never
    // beats_per_minute, minutes_per_kilometer, seconds_per_meter or
    // meters_per_second), and its `referenceType` only one_rep_max /
    // training_max / body_mass (never max_aerobic_speed, max_heart_rate,
    // heart_rate_reserve or baseline_pace) — both unions being deliberately
    // narrower than the canonical vocabularies in `types.ts`. The fifth,
    // RPE, is named without a range; the contrast with INT-LONG, which does
    // document a numeric "General fallback RPE 7-9", shows the omission is
    // the table's intent and not a gap to be filled here.
    //
    // `movement_intent` is not one of the five documented options and is
    // therefore not a legitimate substitute, however available it is in the
    // method contract.
    //
    // So the table's own rule — "Without a valid intensity profile, the
    // engine must not prescribe this method numerically" — is enforced by an
    // empty intensity list: `resolveIntensity` fails with
    // `INTENSITY_NOT_DOCUMENTED` on every input rather than inventing a
    // value, and `registryValidators.ts` refuses any entry pointing here
    // (`NON_EXECUTABLE_NUMERICAL_PROFILE`) before runtime is ever reached.
    //
    // Making it executable requires widening `IntensityRangeRule` to the
    // aerobic reference types and pace/power/heart-rate units already
    // present in `types.ts`, plus mapping them in `resolveIntensity`'s
    // `mapIntensityUnit` — a numerical-model change, not a profile edit.
    profileId: "conditioning_short_intervals_v0_1",
    version: "0.1",
    moduleId: "conditioning",
    methodId: "work_rest_intervals",
    exerciseRole: "conditioning",
    volume: {
      structure: "intervals",
      sets: null,
      repetitions: null,
      duration: {
        type: "fixed_range",
        range: durationRange(15, 30, 60),
        scope: "per_interval",
      },
      distance: null,
      rounds: null,
      workIntervals: integerRange(10, 12, 20),
    },
    intensity: [],
    rest: {
      scope: "between_intervals",
      seconds: integerRange(15, 30, 60),
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: null,
    minimumDose: { ...emptyDose(), workIntervals: 10, durationSeconds: 15 },
    // "The maximum boundaries must not be combined automatically" — these
    // are validation ceilings per dimension, not a 20×60 prescription target.
    maximumDose: { ...emptyDose(), workIntervals: 20, durationSeconds: 60 },
    requiresExerciseSpecificLoadRule: false,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    // Profile INT-LONG. Rest encodes the documented passive range 30-120s;
    // the documented active-rest range (120-240s) would need a separate,
    // explicitly selected profile and is not implemented here. Rest normal 75
    // and the dose boundaries follow the tables' own "Integer Resolution" /
    // range-boundary conventions — the table documents no separate normal or
    // dose values for them. The RPE 7-9 rule is the table's own general
    // fallback, permitted "only when an explicit RPE-controlled profile is
    // selected": this profile can only ever be used through an explicit
    // `numericalProfileId` (its triple is ambiguous), which is exactly that
    // explicit selection.
    profileId: "conditioning_long_intervals_v0_1",
    version: "0.1",
    moduleId: "conditioning",
    methodId: "work_rest_intervals",
    exerciseRole: "conditioning",
    volume: {
      structure: "intervals",
      sets: null,
      repetitions: null,
      duration: {
        type: "fixed_range",
        range: durationRange(60, 120, 180),
        scope: "per_interval",
      },
      distance: null,
      rounds: null,
      workIntervals: integerRange(4, 6, 10),
    },
    intensity: [
      {
        type: "rpe",
        min: 7,
        normal: 8,
        max: 9,
        unit: "rpe_scale_1_10",
        referenceType: null,
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_intervals",
      seconds: integerRange(30, 75, 120),
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: null,
    minimumDose: { ...emptyDose(), workIntervals: 4, durationSeconds: 60 },
    maximumDose: { ...emptyDose(), workIntervals: 10, durationSeconds: 180 },
    requiresExerciseSpecificLoadRule: false,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    // Profile INT-REPEATED-SPRINT. The table lists "conditioning or power" /
    // "conditioning or secondary"; this profile encodes the first-listed
    // (conditioning, conditioning) pair — a power/secondary variant would be
    // a separate profile. Normals follow the tables' "Integer Resolution"
    // convention (10-20 → 15; 3-8 → 5, lower integer of an even-width range;
    // 20-60 → 40). Documented intensity is "all-out or validated supramaximal
    // reference": supramaximal references are not encodable in this schema,
    // and 26_INTENSITY_MODEL represents intended maximal execution speed as
    // the qualitative `movement_intent` category `maximal_safe_speed` — the
    // finite vocabulary's maximal speed value — never as a measured velocity.
    // The documented availability restrictions (sprint compatibility, safety
    // conditions, recovery protection, protected combat sessions) are
    // eligibility rules for the knowledge base and planning layers, not
    // numerical-profile fields.
    profileId: "repeated_sprint_intervals_v0_1",
    version: "0.1",
    moduleId: "conditioning",
    methodId: "work_rest_intervals",
    exerciseRole: "conditioning",
    volume: {
      structure: "intervals",
      sets: null,
      repetitions: null,
      duration: {
        type: "fixed_range",
        range: durationRange(3, 5, 8),
        scope: "per_interval",
      },
      distance: null,
      rounds: null,
      workIntervals: integerRange(10, 15, 20),
    },
    intensity: [
      {
        type: "movement_intent",
        value: "maximal_safe_speed",
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_intervals",
      seconds: integerRange(20, 40, 60),
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: null,
    minimumDose: { ...emptyDose(), workIntervals: 10, durationSeconds: 3 },
    maximumDose: { ...emptyDose(), workIntervals: 20, durationSeconds: 8 },
    requiresExerciseSpecificLoadRule: false,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    // Profile INT-POWER, Table Group 14. Fourth profile on the shared
    // (conditioning, work_rest_intervals, conditioning) triple: any entry
    // using it MUST declare an explicit `numericalProfileId`, and implicit
    // resolution refuses the triple rather than picking by array order.
    //
    // This is not a duplicate of Table Group 8. Each of the three existing
    // interval profiles is arithmetically empty against the documented
    // power-interval family: INT-SHORT prescribes 10-20 intervals (vs 3-12)
    // and is itself non-executable; INT-LONG prescribes 60-180 s efforts;
    // INT-REPEATED-SPRINT prescribes 3-8 s efforts; INT-SPRINT prescribes
    // 120-240 s of rest. The gap is structural, not editorial.
    //
    // The envelope is the union of the family's two documented members
    // (Heavy Bag Power Intervals 3-8 x 10-30 s / 30-90 s; Battle Ropes
    // 5-12 x 10-40 s / 20-90 s), narrowed per exercise by the registry and
    // never widened — the same construction Table Groups 11 and 13 use.
    // Normals follow the tables' "Integer Resolution" convention (3-12 → 7,
    // lower integer of an even-width range, exactly as INT-REPEATED-SPRINT's
    // own 3-8 → 5; 10-40 → 25; 20-90 → 55).
    //
    // Two intensity rules, both qualitative, because neither documented
    // record states an RPE anywhere. `impact_intent: maximal_safe_power`
    // serves struck resistances — 26_INTENSITY_MODEL sanctions it directly
    // ("bag work may support technical effort or impact intent") and
    // `maximal_safe_power` is the impact vocabulary's maximal value, mapped
    // from a record's "Maximum Power" exactly as INT-REPEATED-SPRINT maps
    // "all-out" to `maximal_safe_speed`. `movement_intent: explosive` serves
    // non-impact power intervals and is a literal word in the Battle Ropes
    // Velocity Profile. An exercise claims whichever ONE its own record
    // documents, by narrowing; nothing here forces both.
    //
    // Tempo is null because `work_rest_intervals` declares
    // `tempoPolicy: forbidden`, like the three Table Group 8 profiles.
    profileId: "power_intervals_v0_1",
    version: "0.1",
    moduleId: "conditioning",
    methodId: "work_rest_intervals",
    exerciseRole: "conditioning",
    volume: {
      structure: "intervals",
      sets: null,
      repetitions: null,
      duration: {
        type: "fixed_range",
        range: durationRange(10, 25, 40),
        scope: "per_interval",
      },
      distance: null,
      rounds: null,
      workIntervals: integerRange(3, 7, 12),
    },
    intensity: [
      {
        type: "impact_intent",
        value: "maximal_safe_power",
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
      {
        type: "movement_intent",
        value: "explosive",
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_intervals",
      seconds: integerRange(20, 55, 90),
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: null,
    minimumDose: { ...emptyDose(), workIntervals: 3, durationSeconds: 10 },
    maximumDose: { ...emptyDose(), workIntervals: 12, durationSeconds: 40 },
    requiresExerciseSpecificLoadRule: false,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    // Profile GRIP-REPETITION-STRENGTH, Table Group 15. Triple
    // (grip, straight_sets_repetitions, secondary) is UNIQUE, so implicit
    // resolution already selects it; consumers declare the id anyway, for
    // the same auditability reason ab_wheel and plate_pinch do.
    //
    // This profile does NOT claim a family discovered across several
    // records. It implements a module rule that 65_GRIP/00_OVERVIEW.md now
    // states directly, under "General Prescription Ranges → Grip Repetition
    // Strength". Every value below is that section's — sets 3-5,
    // repetitions 2-8, 1-3 RIR, 90-240 s rest, controlled tempo — not any
    // single exercise's. The doctrine is owned by the module; an exercise
    // narrows it.
    //
    // The module needed the rule because its other five prescription ranges
    // count short maximal efforts, seconds of holding, or controlled
    // repetitions at low-to-moderate loading for tissue exposure. None
    // describes a near-maximal whole movement whose repetition ceiling is
    // set by the hands rather than by the prime movers.
    //
    // The role is `secondary` because that chapter's own "Placement Within
    // the Session" states grip work "is usually placed after primary
    // technical and strength work" — not because `secondary` happened to
    // satisfy a validator.
    //
    // UNIT SCOPE, enforced by the table and repeated here: this profile
    // covers COMPLETE repetitions of a whole movement only. Rope ascents,
    // hand-over-hand pulls, distance, timed holds and timed intervals are
    // all excluded, because the chapter's own Volume Metrics section
    // forbids combining incompatible volume measures. That exclusion is not
    // a preference: `RepetitionTarget.unit` is fixed to `repetitions` and
    // the three repetition `VolumeInterpretation` values express LATERALITY,
    // not unit, so no future entry can smuggle another unit in.
    //
    // Normals follow the tables' Integer Resolution convention (3-5 → 4;
    // 2-8 → 5; 90-240 → 165). The RIR range is encoded in the same
    // min/normal/max form `strength_primary_straight_sets_v0_1` and
    // `functional_hypertrophy_primary_v0_1` already use, so range-context
    // selection behaves identically to those two — a range-position
    // convention, deliberately not re-interpreted here.
    //
    // Tempo is `global_intent: controlled`, the literal wording of the
    // module rule. Phase timing is NOT representable by `NumericalTempoRule`
    // (global_intent / phase_intent / isometric_hold / none only), so a
    // record's documented eccentric duration stays in its own instructions
    // — the documented precision loss Table Group 13 already records.
    profileId: "grip_repetition_strength_v0_1",
    version: "0.1",
    moduleId: "grip",
    methodId: "straight_sets_repetitions",
    exerciseRole: "secondary",
    volume: {
      structure: "sets_reps",
      sets: integerRange(3, 4, 5),
      repetitions: { type: "fixed_range", range: integerRange(2, 5, 8) },
      duration: null,
      distance: null,
      rounds: null,
      workIntervals: null,
    },
    intensity: [
      {
        type: "rir",
        min: 1,
        normal: 2,
        max: 3,
        unit: "repetitions",
        referenceType: null,
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_sets",
      seconds: integerRange(90, 165, 240),
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: {
      type: "global_intent",
      globalIntent: "controlled",
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    minimumDose: { ...emptyDose(), sets: 3, repetitions: 2 },
    maximumDose: { ...emptyDose(), sets: 5, repetitions: 8 },
    requiresExerciseSpecificLoadRule: false,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    // Profile GRIP-CLIMB-STRENGTH, Table Group 16. Second profile on the
    // (grip, straight_sets_repetitions, secondary) triple, which is
    // therefore no longer unique: every entry on it must declare an
    // explicit `numericalProfileId`.
    //
    // Created, not discovered, and 65_GRIP/00_OVERVIEW.md states the rule
    // under "General Prescription Ranges → Grip Climb Strength". The module
    // owns every number here; an exercise narrows them.
    //
    // A COMPLETE ASCENT IS NOT A REPETITION. The count travels in the
    // `repetitions` field only because that is the single integer-count
    // field the `sets_reps` structure has; the consuming entry declares
    // `volumeInterpretation: climbs`, the vocabulary member added for
    // exactly this purpose, so nothing downstream reads it as a repetition.
    // Climbed height is a described variable of the exercise and is never
    // converted into a count.
    //
    // Intensity is `technical_effort: high_quality`, not RIR: an ascent
    // cannot be left partly in reserve, because a climb abandoned mid-rope
    // is a descent under compromised grip, which the module rule's own
    // safety clause forbids.
    profileId: "grip_climb_strength_v0_1",
    version: "0.1",
    moduleId: "grip",
    methodId: "straight_sets_repetitions",
    exerciseRole: "secondary",
    volume: {
      structure: "sets_reps",
      sets: integerRange(3, 4, 5),
      repetitions: { type: "fixed_range", range: integerRange(1, 3, 5) },
      duration: null,
      distance: null,
      rounds: null,
      workIntervals: null,
    },
    intensity: [
      {
        type: "technical_effort",
        value: "high_quality",
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_sets",
      seconds: integerRange(120, 210, 300),
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: {
      type: "global_intent",
      globalIntent: "controlled",
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    minimumDose: { ...emptyDose(), sets: 3, repetitions: 1 },
    maximumDose: { ...emptyDose(), sets: 5, repetitions: 5 },
    requiresExerciseSpecificLoadRule: false,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    // Profile GRIP-HAND-PULL-WORK, Table Group 17. Third profile on the same
    // shared triple; the explicit-id rule applies identically.
    //
    // Created, not discovered, and stated in 65_GRIP/00_OVERVIEW.md under
    // "General Prescription Ranges → Grip Hand-Pull Work".
    //
    // A HAND-OVER-HAND PULL IS ONE HAND'S ACTION, not one execution of a
    // whole movement. It shares the `repetitions` field for the same
    // structural reason as Table Group 16 and is disambiguated by
    // `volumeInterpretation: hand_pulls`. A record's distance-based and
    // interval-based prescriptions stay outside this family entirely — no
    // metre becomes a pull and no second becomes a pull.
    //
    // Intensity is `technical_effort: high_quality`. External resistance is
    // a documented determinant (sled weight, rope angle, friction, rope
    // diameter, pulling position) but the records qualify it in words, never
    // in figures, and the chapter states that grip intensity is not
    // represented accurately by external load alone. No qualitative
    // resistance level is converted into a number.
    profileId: "grip_hand_pull_work_v0_1",
    version: "0.1",
    moduleId: "grip",
    methodId: "straight_sets_repetitions",
    exerciseRole: "secondary",
    volume: {
      structure: "sets_reps",
      sets: integerRange(3, 4, 5),
      repetitions: { type: "fixed_range", range: integerRange(6, 13, 20) },
      duration: null,
      distance: null,
      rounds: null,
      workIntervals: null,
    },
    intensity: [
      {
        type: "technical_effort",
        value: "high_quality",
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_sets",
      seconds: integerRange(90, 165, 240),
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    tempo: {
      type: "global_intent",
      globalIntent: "controlled",
      sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_REST_TEMPO],
    },
    minimumDose: { ...emptyDose(), sets: 3, repetitions: 6 },
    maximumDose: { ...emptyDose(), sets: 5, repetitions: 20 },
    requiresExerciseSpecificLoadRule: false,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES],
  },
  {
    // -------------------------------------------------------------------------
    // Table Group 18 — Partner Grappling Rounds
    //
    // The generic envelope for resisted standing grappling organized in
    // rounds. It serves a real, documented family — three chapters that
    // share a Primary Classification ("Combat-Specific Technique"), a
    // Secondary Classification ("Partner Drill"), a Movement Context
    // ("Standing / Partner / Continuous / Combat Specific") and a Loading
    // Profile expressed as rounds × minutes. This is the Table Group 14
    // situation, not the turkish_get_up or sled_push situation: the family
    // was found, not invented around one exercise.
    //
    // TRIPLE. `movement / partner_grappling_rounds / technical` is unique —
    // this is the only profile on the new method — so implicit resolution
    // succeeds. Consumers should still declare the id explicitly, by the
    // auditability convention Table Group 15 established.
    //
    // VOLUME = the UNION of the three chapters' Loading Profiles, exactly as
    // Table Group 14 took the union of its two members:
    //
    //   pummeling       3–8  rounds   120–300 s   ("3–8 rounds, 2–5 minutes")
    //   wall_wrestling  3–8  rounds   120–300 s   ("3–8 rounds, 2–5 minutes")
    //   grip_fighting   3–10 rounds    30–180 s   ("3–10 rounds, 30 seconds–3 minutes")
    //   ------------------------------------------------------------------
    //   union           3–10 rounds    30–300 s
    //
    // and the union passes the validity test Table Group 14 set for itself:
    // BOTH normals fall inside ALL THREE members' own ranges, so no chapter
    // is prescribed a normal it never documents.
    //
    //   rounds   3–10  → 6.5 → 6 by Integer Resolution (round down)
    //                    6 ∈ 3–8 ✓   6 ∈ 3–8 ✓   6 ∈ 3–10 ✓
    //   duration 30–300 → 165
    //                    165 ∈ 120–300 ✓   165 ∈ 120–300 ✓   165 ∈ 30–180 ✓
    //
    // The intersection (3–8 rounds, 120–180 s) is non-empty too, so one
    // profile genuinely serves all three; a second profile would only split
    // a family the documents keep together. Each entry narrows to its own
    // chapter's bounds in Phase 5 and the generic resolvers compute the
    // intersections, exactly as assault_bike_intervals does.
    //
    // INTENSITY = `technical_effort: high_quality`, and nothing else. No
    // RPE and no RIR appear in any of the three chapters (counted directly:
    // zero occurrences). What all three DO state is the technical standard —
    // each names "Technical quality remains high" as a Success Criterion,
    // each lists "Technical" in its Velocity Profile, and pummeling adds
    // "Movement quality is prioritized over speed."
    //
    // PARTNER RESISTANCE IS NOT DOSED HERE, and that is a decision, not an
    // omission. All three chapters list resistance under "Progression"
    // ("Resistance", "Partner Skill"), which is a progression AXIS, not a
    // prescribed value — the same reading that kept Power Output and
    // Calories out of assault_bike_intervals. No chapter defines resistance
    // levels, and the three do not even name the axis identically. The
    // engine carries excessive resistance as a STOP CONDITION
    // (`intensity_limit`) instead of a dosed number: that is what the
    // documents support.
    //
    // `movement_intent` is deliberately unused although the method allows
    // it: wall_wrestling and grip_fighting say "Explosive", pummeling says
    // quality over speed. A generic profile cannot claim a velocity two of
    // its three members document and the third contradicts.
    //
    // REST IS A NEW ENGINEERING DECISION, SOURCED TO DOCTRINE, NEVER TO A
    // CHAPTER. None of the three chapters documents inter-round rest
    // (checked directly: their only time values are round duration and
    // 24–48 h inter-session recovery). The band below comes from
    // 32_MODULE_PRESCRIPTION_PROFILES.md's "Partner Grappling Rounds"
    // section, written for this lot, and its `sourceRuleIds` say so — it is
    // NOT attributed to pummeling, wall_wrestling or grip_fighting, and it
    // is NOT Table Group 9's striking band (60/60/120), which is a
    // different band with a different normal and which that table forbids
    // reusing across sports anyway.
    //
    // TEMPO is null: the method forbids it, and a resisted exchange has no
    // tempo the athlete sets.
    // -------------------------------------------------------------------------
    profileId: "partner_grappling_rounds_technical_v0_1",
    version: "0.1",
    moduleId: "movement",
    methodId: "partner_grappling_rounds",
    exerciseRole: "technical",
    volume: {
      structure: "rounds_duration",
      sets: null,
      repetitions: null,
      duration: {
        type: "fixed_range",
        range: durationRange(30, 165, 300),
        scope: "per_round",
      },
      distance: null,
      rounds: integerRange(3, 6, 10),
      workIntervals: null,
    },
    intensity: [
      {
        type: "technical_effort",
        value: "high_quality",
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_rounds",
      seconds: integerRange(60, 120, 180),
      sourceRuleIds: [
        SOURCE_NUMERICAL_TABLES,
        SOURCE_REST_TEMPO,
        SOURCE_PARTNER_GRAPPLING_REST,
      ],
    },
    tempo: null,
    minimumDose: { ...emptyDose(), rounds: 3, durationSeconds: 30 },
    maximumDose: { ...emptyDose(), rounds: 10, durationSeconds: 300 },
    requiresExerciseSpecificLoadRule: false,
    // The decisive difference from `combat_technical_rounds_v0_1`. That
    // profile is sport-bound by its own table; this family is explicitly
    // cross-discipline — each of the three chapters rates five stars for
    // Wrestling, BJJ, Judo, Sambo and MMA simultaneously — so no sport
    // subtype is required, and none is faked.
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_PARTNER_GRAPPLING_REST],
  },
  {
    // -------------------------------------------------------------------------
    // Table Group 19 — Loaded Locomotion Power
    //
    // The generic envelope for repeated explosive displacement of an external
    // resistance across the ground.
    //
    // TRIPLE. `power / work_rest_intervals / secondary` is unique — no other
    // profile sits on `power / work_rest_intervals` at any role — so implicit
    // resolution succeeds. Consumers declare the id anyway, by the
    // auditability convention Table Group 15 established.
    //
    // The role is the only honest option the contracts leave, and the reason
    // is documentary rather than mechanical. `work_rest_intervals` does not
    // support `primary`; the power module authorizes it at `conditioning`,
    // `secondary` and `technical` only. `conditioning` would contradict
    // 64_POWER/00_OVERVIEW.md's own "Power Versus Conditioning" section, which
    // states that exercises from this category appear in conditioning only
    // when the engine explicitly changes the adaptation target. `technical` is
    // reserved by that same document for low-load Technical Acquisition.
    //
    // THE FAMILY WAS CREATED, NOT FOUND — the Table Group 15 situation, not
    // the Table Group 14 situation, and it is declared as such. The Power
    // overview named four Loaded Power Categories (Upper-Body Propulsive,
    // Pulling, Receiving, Ballistic Derivatives), every one written from
    // barbell derivatives performed on the spot and every one measuring work
    // in repetitions. None can express an effort whose work is a distance
    // covered under load. The category was written to close that gap; this
    // profile implements it. It is not written around one exercise: the
    // category is defined by mechanics, and its four admissibility criteria
    // are stated in the module rule.
    //
    // VOLUME. Three dimensions, all required by this rule, all read from the
    // source chapter and NONE derived from another:
    //
    //   work intervals  4-12    "# Loading Profile — Typical Volume: 4-12 pushes"
    //   distance       10-40 m  same line: "10-40 meters"
    //   duration        5-40 s  "# Physiological Profile — Typical Duration"
    //
    // The duration comes from a different section than the other two, which is
    // the established precedent: sprint_intervals already takes its prescribed
    // duration from its own Physiological Profile.
    //
    // DISTANCE AND DURATION ARE BOTH VOLUME, and this is the decisive property
    // of this table. Neither is an indicator of the other, and the engine must
    // never convert between them: a fabricated metres-per-second would invent
    // a prescribed velocity the documentation does not state, and would
    // destroy the very distinction that makes loss of speed a usable
    // termination signal. `intervals` permits exactly this shape —
    // `requiredVolumeFields` are work_intervals and duration, and distance is
    // an OPTIONAL field of the same structure, so all three coexist without
    // any structural strain.
    //
    // Normals by the Integer Resolution convention: 4-12 -> 8, 5-40 -> 22,
    // 10-40 -> 25.
    //
    // INTENSITY = `movement_intent: explosive`, one rule and only one.
    // "# Velocity Profile — Typical Training: Explosive. Accelerative." —
    // `explosive` is the literal word, the same resolution battle_ropes and
    // assault_bike_intervals already use. `maximal_acceleration` is NOT used:
    // "Accelerative" is an adjective describing the effort, not a claim of
    // maximal acceleration, and the stronger value would overstate the source.
    //
    // LOAD IS NOT DOSED, and the reason is structural rather than editorial.
    // The chapters describe loading qualitatively ("Light to Very Heavy") and
    // `IntensityCategoryRule` accepts only movement_intent, technical_effort
    // and impact_intent — so `resistance_category` cannot be carried by a
    // profile rule at all, whatever the module allows. Absolute load,
    // percentage_1rm and percentage_body_mass would each require a figure no
    // chapter gives. Load therefore stays a documented progression axis, the
    // same reading that kept Power Output and Calories out of
    // assault_bike_intervals.
    //
    // REST IS AN ENGINEERING DECISION, sourced to its own rule id and never to
    // a chapter — see SOURCE_LOADED_LOCOMOTION_REST above. It adopts the Power
    // overview's own Peak Power Development band (2-4 minutes), the only rest
    // figure that document states, rather than inventing one or borrowing a
    // Strength, Loaded Carry or conditioning band.
    //
    // TEMPO is null: the method forbids it, and a continuous locomotor effort
    // has no concentric-eccentric phases to time. Explosive intent is carried
    // by the intensity rule, which is where it belongs.
    // -------------------------------------------------------------------------
    profileId: "loaded_locomotion_power_intervals_v0_1",
    version: "0.1",
    moduleId: "power",
    methodId: "work_rest_intervals",
    exerciseRole: "secondary",
    volume: {
      structure: "intervals",
      sets: null,
      repetitions: null,
      duration: {
        type: "fixed_range",
        range: durationRange(5, 22, 40),
        scope: "per_interval",
      },
      distance: {
        type: "fixed_range",
        range: distanceRange(10, 25, 40),
        scope: "per_interval",
      },
      rounds: null,
      workIntervals: integerRange(4, 8, 12),
    },
    intensity: [
      {
        type: "movement_intent",
        value: "explosive",
        sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_INTENSITY_MODEL],
      },
    ],
    rest: {
      scope: "between_intervals",
      seconds: integerRange(120, 180, 240),
      sourceRuleIds: [
        SOURCE_NUMERICAL_TABLES,
        SOURCE_REST_TEMPO,
        SOURCE_LOADED_LOCOMOTION_REST,
      ],
    },
    tempo: null,
    minimumDose: { ...emptyDose(), workIntervals: 4, durationSeconds: 5, distanceMeters: 10 },
    maximumDose: { ...emptyDose(), workIntervals: 12, durationSeconds: 40, distanceMeters: 40 },
    // Load is a progression axis in this category, never a prescribed number,
    // so no exercise-specific load rule is demanded of consumers.
    requiresExerciseSpecificLoadRule: false,
    requiresSportSpecificSubtype: false,
    sourceRuleIds: [SOURCE_NUMERICAL_TABLES, SOURCE_LOADED_LOCOMOTION_REST],
  },
] as const satisfies readonly NumericalPrescriptionProfile[];

export const selectRangeValue = (
  range: NumericRange,
  context: RangeContext,
): number => {
  switch (context) {
    case "reduced":
      return range.min;
    case "normal":
      return range.normal;
    case "high":
      return range.max;
  }
};

/**
 * Legacy unique-triple helper: returns the FIRST profile matching the
 * triple, in array order. Safe only for triples that are unique in
 * `NUMERICAL_PRESCRIPTION_PROFILES` — which is no longer all of them:
 * (conditioning, work_rest_intervals, conditioning) is shared by the three
 * Table Group 8 interval profiles. Resolvers never call this — they use
 * `resolveNumericalProfile`, which refuses an ambiguous triple instead of
 * silently picking the first match.
 */
export const getNumericalPrescriptionProfile = (
  moduleId: CapabilityModule,
  methodId: TrainingMethodId,
  exerciseRole: ExerciseRole,
): NumericalPrescriptionProfile | null =>
  NUMERICAL_PRESCRIPTION_PROFILES.find(
    (profile) =>
      profile.moduleId === moduleId &&
      profile.methodId === methodId &&
      profile.exerciseRole === exerciseRole,
  ) ?? null;

export const getNumericalPrescriptionProfileById = (
  profileId: Identifier,
): NumericalPrescriptionProfile | null =>
  NUMERICAL_PRESCRIPTION_PROFILES.find(
    (profile) => profile.profileId === profileId,
  ) ?? null;

export const getNumericalProfilesForModule = (
  moduleId: CapabilityModule,
): readonly NumericalPrescriptionProfile[] =>
  NUMERICAL_PRESCRIPTION_PROFILES.filter(
    (profile) => profile.moduleId === moduleId,
  );

// -----------------------------------------------------------------------------
// Explicit numerical profile resolution
// -----------------------------------------------------------------------------

/**
 * Identifier of one `NumericalPrescriptionProfile`. An alias rather than a
 * literal union: the profile set grows lot by lot, and runtime membership
 * is what actually guarantees validity — see
 * `isNumericalPrescriptionProfileId` (same convention as
 * `isTrainingMethodId` / `isEquipmentCapabilityId`).
 */
export type NumericalPrescriptionProfileId = Identifier;

export const isNumericalPrescriptionProfileId = (
  value: unknown,
): value is NumericalPrescriptionProfileId =>
  typeof value === "string" &&
  NUMERICAL_PRESCRIPTION_PROFILES.some(
    (profile) => profile.profileId === value,
  );

export type NumericalProfileResolutionSource =
  | "explicit_profile_id"
  | "module_method_role_unique";

export type NumericalProfileResolutionFailureCode =
  | "NUMERICAL_PROFILE_MISSING"
  | "NUMERICAL_PROFILE_AMBIGUOUS"
  | "NUMERICAL_PROFILE_ID_UNKNOWN"
  | "NUMERICAL_PROFILE_TRIPLE_MISMATCH";

export interface NumericalProfileQuery {
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  exerciseRole: ExerciseRole;
  /**
   * Explicit profile selection supplied by the registry entry. `null` or
   * absent preserves the historical unique-triple lookup exactly.
   */
  explicitProfileId?: Identifier | null;
}

export type NumericalProfileResolution =
  | {
      ok: true;
      profile: NumericalPrescriptionProfile;
      resolutionSource: NumericalProfileResolutionSource;
    }
  | {
      ok: false;
      failureCode: NumericalProfileResolutionFailureCode;
      message: string;
      candidateProfileIds: readonly Identifier[];
    };

/**
 * Pure, data-injected core of numerical profile resolution.
 *
 * - Explicit id supplied: the id must exist and its own
 *   (moduleId, methodId, exerciseRole) triple must equal the query's —
 *   no fallback, no substitution.
 * - No explicit id: the triple's candidates decide — zero fails with
 *   `NUMERICAL_PROFILE_MISSING`, exactly one succeeds (historical
 *   behavior), and two or more fail with `NUMERICAL_PROFILE_AMBIGUOUS`.
 *   Array order never breaks a tie.
 */
export const resolveNumericalProfileFrom = (
  profiles: readonly NumericalPrescriptionProfile[],
  query: NumericalProfileQuery,
): NumericalProfileResolution => {
  const candidates = profiles.filter(
    (profile) =>
      profile.moduleId === query.moduleId &&
      profile.methodId === query.methodId &&
      profile.exerciseRole === query.exerciseRole,
  );
  const candidateProfileIds = candidates.map((profile) => profile.profileId);

  const explicitProfileId = query.explicitProfileId ?? null;

  if (explicitProfileId !== null) {
    const explicitProfile =
      profiles.find((profile) => profile.profileId === explicitProfileId) ??
      null;

    if (explicitProfile === null) {
      return {
        ok: false,
        failureCode: "NUMERICAL_PROFILE_ID_UNKNOWN",
        message: `No numerical prescription profile exists with id ${explicitProfileId}.`,
        candidateProfileIds,
      };
    }

    if (
      explicitProfile.moduleId !== query.moduleId ||
      explicitProfile.methodId !== query.methodId ||
      explicitProfile.exerciseRole !== query.exerciseRole
    ) {
      return {
        ok: false,
        failureCode: "NUMERICAL_PROFILE_TRIPLE_MISMATCH",
        message:
          `Profile ${explicitProfileId} is defined for ` +
          `${explicitProfile.moduleId}/${explicitProfile.methodId}/${explicitProfile.exerciseRole}, ` +
          `not for the requested ${query.moduleId}/${query.methodId}/${query.exerciseRole}.`,
        candidateProfileIds,
      };
    }

    return {
      ok: true,
      profile: explicitProfile,
      resolutionSource: "explicit_profile_id",
    };
  }

  if (candidates.length === 0) {
    return {
      ok: false,
      failureCode: "NUMERICAL_PROFILE_MISSING",
      message: `No numerical prescription profile exists for module ${query.moduleId}, method ${query.methodId} and role ${query.exerciseRole}.`,
      candidateProfileIds,
    };
  }

  const uniqueCandidate = candidates.length === 1 ? candidates[0] : undefined;

  if (uniqueCandidate === undefined) {
    return {
      ok: false,
      failureCode: "NUMERICAL_PROFILE_AMBIGUOUS",
      message:
        `${candidates.length} numerical prescription profiles share module ${query.moduleId}, ` +
        `method ${query.methodId} and role ${query.exerciseRole} — an explicit numericalProfileId is required.`,
      candidateProfileIds,
    };
  }

  return {
    ok: true,
    profile: uniqueCandidate,
    resolutionSource: "module_method_role_unique",
  };
};

/** `resolveNumericalProfileFrom` bound to the documented profile set. */
export const resolveNumericalProfile = (
  query: NumericalProfileQuery,
): NumericalProfileResolution =>
  resolveNumericalProfileFrom(NUMERICAL_PRESCRIPTION_PROFILES, query);

export interface DuplicateProfileTriple {
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  exerciseRole: ExerciseRole;
  profileIds: readonly Identifier[];
}

/**
 * Every (moduleId, methodId, exerciseRole) triple shared by two or more
 * profiles. Since the Table Group 8 interval profiles landed, this contains
 * exactly (conditioning, work_rest_intervals, conditioning) — every registry
 * entry on a triple listed here must declare an explicit
 * `numericalProfileId` (enforced by `registryValidators.ts`).
 */
export const findDuplicateProfileTriples = (
  profiles: readonly NumericalPrescriptionProfile[] = NUMERICAL_PRESCRIPTION_PROFILES,
): readonly DuplicateProfileTriple[] => {
  const byTriple = new Map<string, NumericalPrescriptionProfile[]>();

  for (const profile of profiles) {
    const key = `${profile.moduleId}|${profile.methodId}|${profile.exerciseRole}`;
    const group = byTriple.get(key);

    if (group === undefined) {
      byTriple.set(key, [profile]);
    } else {
      group.push(profile);
    }
  }

  return [...byTriple.values()]
    .filter((group) => group.length > 1)
    .map((group) => {
      const [first] = group;

      if (first === undefined) {
        throw new Error("Unreachable: duplicate group cannot be empty.");
      }

      return {
        moduleId: first.moduleId,
        methodId: first.methodId,
        exerciseRole: first.exerciseRole,
        profileIds: group.map((profile) => profile.profileId),
      };
    });
};

/**
 * Whether a profile can, in principle, produce a complete prescription.
 *
 * Being present in `NUMERICAL_PRESCRIPTION_PROFILES` is not the same thing:
 * a profile whose documented table defines volume and rest but no encodable
 * intensity is structurally real and correctly sourced, yet can never be
 * prescribed — `resolveIntensity` returns `INTENSITY_NOT_DOCUMENTED` for it
 * on every input, whatever the exercise supports, before any capability or
 * reference check runs. `conditioning_short_intervals_v0_1` is exactly that
 * case today (see its own comment above).
 *
 * Derived from the profile's own data rather than declared as a flag, so it
 * can never drift out of step with the profile it describes: adding a
 * documented intensity rule makes the profile executable in the same edit.
 */
export const isExecutableNumericalProfile = (
  profile: NumericalPrescriptionProfile,
): boolean => profile.intensity.length > 0;

/**
 * Whether the triple resolves to exactly one profile *and* that profile is
 * executable. An ambiguous triple answers `false`: several profiles share
 * it, so no single profile is selected without an explicit
 * `numericalProfileId` (see `resolveNumericalProfile`) — the caller does not
 * "have" a profile for the triple alone.
 */
export const hasExecutableNumericalProfile = (
  moduleId: CapabilityModule,
  methodId: TrainingMethodId,
  exerciseRole: ExerciseRole,
): boolean => {
  const resolution = resolveNumericalProfile({
    moduleId,
    methodId,
    exerciseRole,
  });

  return resolution.ok && isExecutableNumericalProfile(resolution.profile);
};
