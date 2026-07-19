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
  scope: "per_set" | "per_side" | "total";
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

export const hasExecutableNumericalProfile = (
  moduleId: CapabilityModule,
  methodId: TrainingMethodId,
  exerciseRole: ExerciseRole,
): boolean =>
  getNumericalPrescriptionProfile(moduleId, methodId, exerciseRole) !== null;
