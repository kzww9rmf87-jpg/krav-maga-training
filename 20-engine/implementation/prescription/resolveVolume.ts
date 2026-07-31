/**
 * Combat Athlete System — Volume Resolver
 * Version 0.1
 *
 * Deterministically resolves the volume portion of an exercise prescription
 * from one documented numerical profile.
 *
 * This resolver:
 * - never invents a numerical value;
 * - never falls back to a familiar set/rep scheme;
 * - returns a structured safe failure when no profile exists;
 * - selects only min, normal or max values documented in the profile.
 */

import type { CapabilityModule, Identifier } from "../types";
import type { TrainingMethodId } from "./contracts";
import {
  resolveNumericalProfile,
  selectRangeValue,
  type DoseBoundary,
  type IntegerRange,
  type NumericRange,
  type NumericalPrescriptionProfile,
  type NumericalProfileResolutionSource,
  type NumericalVolumeProfile,
  type RangeContext,
} from "./prescriptionKnowledge";
import type {
  ExerciseRole,
  PrescriptionLaterality,
  PrescriptionVolume,
  RepetitionTarget,
} from "./types";

// -----------------------------------------------------------------------------
// Exercise-specific dose constraints
// -----------------------------------------------------------------------------

/**
 * Documented, exercise-specific narrowing of the shared numerical profile's
 * volume range. This is not an exercise capability (`ExercisePrescriptionCapabilities`
 * describes what the exercise supports) — it is a numerical prescription
 * constraint, scoped to `resolveVolume` alone. `minimumDose`/`maximumDose`
 * may only narrow the shared profile's range, per dimension, never widen it:
 * `effectiveMin = max(profileMin, exerciseMin)`, `effectiveMax = min(profileMax, exerciseMax)`.
 * A dimension left `null` on both `minimumDose` and `maximumDose` is fully
 * governed by the shared profile, unchanged.
 */
export interface ExerciseDoseConstraints {
  minimumDose: DoseBoundary | null;
  maximumDose: DoseBoundary | null;
  sourceRuleIds: readonly Identifier[];
}

// -----------------------------------------------------------------------------
// Result types
// -----------------------------------------------------------------------------

export type VolumeResolutionFailureCode =
  | "NUMERICAL_PROFILE_MISSING"
  | "NUMERICAL_PROFILE_AMBIGUOUS"
  | "NUMERICAL_PROFILE_ID_UNKNOWN"
  | "NUMERICAL_PROFILE_TRIPLE_MISMATCH"
  | "VOLUME_STRUCTURE_MISMATCH"
  | "VOLUME_REQUIRED_FIELD_MISSING"
  | "VOLUME_FORBIDDEN_FIELD_PRESENT"
  | "VOLUME_VALUE_INVALID"
  | "VOLUME_LATERALITY_REQUIRED"
  | "VOLUME_BELOW_MINIMUM_DOSE"
  | "VOLUME_ABOVE_MAXIMUM_DOSE"
  | "VOLUME_RULE_SOURCE_MISSING"
  | "EXERCISE_DOSE_CONSTRAINT_INVALID"
  | "EXERCISE_DOSE_CONSTRAINT_SOURCE_MISSING"
  | "EXERCISE_DOSE_RANGE_EMPTY";

export interface VolumeResolutionSuccess {
  ok: true;
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;
  profileId: Identifier;
  /** How the numerical profile was selected — explicit id or unique triple. */
  profileResolutionSource: NumericalProfileResolutionSource;
  rangeContext: RangeContext;
  volume: PrescriptionVolume;
  /**
   * One human-readable sentence per dimension actually narrowed by
   * `exerciseDoseConstraints`, e.g. "repetitions range 10-30 narrowed to
   * 15-30 by documented exercise-specific bounds." Empty when no exercise
   * constraint was supplied or none of them narrowed the shared profile.
   * Consumed by `prescriptionDecisionTrace.ts` as additional `reasons`.
   */
  narrowingNotes: readonly string[];
  sourceRuleIds: readonly Identifier[];
}

export interface VolumeResolutionFailure {
  ok: false;
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;
  profileId: Identifier | null;
  rangeContext: RangeContext;
  failureCode: VolumeResolutionFailureCode;
  message: string;
  sourceRuleIds: readonly Identifier[];
}

export type VolumeResolutionResult =
  | VolumeResolutionSuccess
  | VolumeResolutionFailure;

// -----------------------------------------------------------------------------
// Input
// -----------------------------------------------------------------------------

export interface ResolveVolumeInput {
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;
  rangeContext: RangeContext;

  /**
   * Must already be resolved for unilateral, alternating or asymmetrical work.
   * The volume resolver does not infer laterality from an exercise name.
   */
  laterality?: PrescriptionLaterality | null;

  /**
   * Set true when the exact exercise capability profile requires laterality.
   */
  lateralityRequired?: boolean;

  /**
   * Documented, exercise-specific narrowing of the shared profile's volume
   * range (see `ExerciseDoseConstraints`). `null` when the exercise has no
   * documented bounds narrower than the shared profile — resolution then
   * behaves exactly as it did before this field existed.
   */
  exerciseDoseConstraints?: ExerciseDoseConstraints | null;

  /**
   * Explicit numerical profile selection supplied by the registry entry.
   * Required whenever several profiles share this input's
   * module/method/role triple; `null` or absent preserves the historical
   * unique-triple lookup exactly.
   */
  numericalProfileId?: Identifier | null;

  sourceRuleIds?: readonly Identifier[];
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const isPositiveInteger = (value: number | null): boolean =>
  value === null || (Number.isInteger(value) && value > 0);

const isPositiveFinite = (value: number | null): boolean =>
  value === null || (Number.isFinite(value) && value > 0);

const fixedRepetitions = (value: number): RepetitionTarget => ({
  type: "fixed",
  value,
  min: null,
  max: null,
  unit: "repetitions",
});

const buildFailure = (
  input: ResolveVolumeInput,
  profile: NumericalPrescriptionProfile | null,
  failureCode: VolumeResolutionFailureCode,
  message: string,
): VolumeResolutionFailure => ({
  ok: false,
  moduleId: input.moduleId,
  methodId: input.methodId,
  role: input.role,
  profileId: profile?.profileId ?? null,
  rangeContext: input.rangeContext,
  failureCode,
  message,
  sourceRuleIds: unique([
    ...(input.sourceRuleIds ?? []),
    ...(profile?.sourceRuleIds ?? []),
  ]),
});

type DoseDimension = keyof DoseBoundary;

const DOSE_DIMENSIONS: readonly DoseDimension[] = [
  "sets",
  "repetitions",
  "durationSeconds",
  "distanceMeters",
  "rounds",
  "workIntervals",
];

const DISCRETE_DOSE_DIMENSIONS: readonly DoseDimension[] = [
  "sets",
  "repetitions",
  "rounds",
  "workIntervals",
];

/** The profile's own selection range for `dimension`, or `null` when this volume structure does not use it. */
const profileRangeForDimension = (
  volumeRule: NumericalVolumeProfile,
  dimension: DoseDimension,
): IntegerRange | NumericRange | null => {
  switch (dimension) {
    case "sets":
      return volumeRule.sets;
    case "repetitions":
      return volumeRule.repetitions?.range ?? null;
    case "durationSeconds":
      return volumeRule.duration?.range ?? null;
    case "distanceMeters":
      return volumeRule.distance?.range ?? null;
    case "rounds":
      return volumeRule.rounds;
    case "workIntervals":
      return volumeRule.workIntervals;
  }
};

/**
 * Structural validation of `ExerciseDoseConstraints`, independent of any
 * particular resolution attempt: every declared dimension must target a
 * dimension the shared profile's volume structure actually uses, every
 * bound must be strictly positive, discrete dimensions must be integers,
 * and a per-dimension minimum may never exceed its own maximum.
 */
const validateExerciseDoseConstraints = (
  constraints: ExerciseDoseConstraints,
  volumeRule: NumericalVolumeProfile,
):
  | { valid: true }
  | {
      valid: false;
      code: "EXERCISE_DOSE_CONSTRAINT_SOURCE_MISSING" | "EXERCISE_DOSE_CONSTRAINT_INVALID";
      message: string;
    } => {
  if (constraints.sourceRuleIds.length === 0) {
    return {
      valid: false,
      code: "EXERCISE_DOSE_CONSTRAINT_SOURCE_MISSING",
      message: "Exercise dose constraints have no source rule.",
    };
  }

  for (const dimension of DOSE_DIMENSIONS) {
    const exerciseMin = constraints.minimumDose?.[dimension] ?? null;
    const exerciseMax = constraints.maximumDose?.[dimension] ?? null;

    if (exerciseMin === null && exerciseMax === null) {
      continue;
    }

    if (profileRangeForDimension(volumeRule, dimension) === null) {
      return {
        valid: false,
        code: "EXERCISE_DOSE_CONSTRAINT_INVALID",
        message: `Exercise dose constraint declares "${dimension}", which the shared profile's volume structure does not use.`,
      };
    }

    if (
      DISCRETE_DOSE_DIMENSIONS.includes(dimension) &&
      ((exerciseMin !== null && !Number.isInteger(exerciseMin)) ||
        (exerciseMax !== null && !Number.isInteger(exerciseMax)))
    ) {
      return {
        valid: false,
        code: "EXERCISE_DOSE_CONSTRAINT_INVALID",
        message: `Exercise dose constraint for "${dimension}" must be an integer.`,
      };
    }

    if (
      (exerciseMin !== null && exerciseMin <= 0) ||
      (exerciseMax !== null && exerciseMax <= 0)
    ) {
      return {
        valid: false,
        code: "EXERCISE_DOSE_CONSTRAINT_INVALID",
        message: `Exercise dose constraint for "${dimension}" must be strictly positive.`,
      };
    }

    if (
      exerciseMin !== null &&
      exerciseMax !== null &&
      exerciseMin > exerciseMax
    ) {
      return {
        valid: false,
        code: "EXERCISE_DOSE_CONSTRAINT_INVALID",
        message: `Exercise dose constraint for "${dimension}" has a minimum (${exerciseMin}) greater than its maximum (${exerciseMax}).`,
      };
    }
  }

  return { valid: true };
};

/**
 * Narrows `profileRange` by the exercise-specific bounds declared for
 * `dimension`, if any: `effectiveMin = max(profileMin, exerciseMin)`,
 * `effectiveMax = min(profileMax, exerciseMax)`. Never widens the shared
 * profile. Returns `ok: false` when the intersection is empty — the caller
 * must fail deterministically, never silently correct a bound.
 */
const applyExerciseDoseConstraint = <T extends IntegerRange | NumericRange>(
  profileRange: T,
  dimension: DoseDimension,
  constraints: ExerciseDoseConstraints | null | undefined,
): { ok: true; range: T; narrowed: boolean } | { ok: false } => {
  const exerciseMin = constraints?.minimumDose?.[dimension] ?? null;
  const exerciseMax = constraints?.maximumDose?.[dimension] ?? null;

  if (exerciseMin === null && exerciseMax === null) {
    return { ok: true, range: profileRange, narrowed: false };
  }

  const effectiveMin =
    exerciseMin === null
      ? profileRange.min
      : Math.max(profileRange.min, exerciseMin);
  const effectiveMax =
    exerciseMax === null
      ? profileRange.max
      : Math.min(profileRange.max, exerciseMax);

  if (effectiveMin > effectiveMax) {
    return { ok: false };
  }

  const effectiveNormal = Math.min(
    Math.max(profileRange.normal, effectiveMin),
    effectiveMax,
  );

  return {
    ok: true,
    range: { ...profileRange, min: effectiveMin, normal: effectiveNormal, max: effectiveMax },
    narrowed:
      effectiveMin !== profileRange.min || effectiveMax !== profileRange.max,
  };
};

const narrowingNote = (
  dimension: DoseDimension,
  profileRange: IntegerRange | NumericRange,
  effectiveRange: IntegerRange | NumericRange,
): string =>
  `${dimension} range ${profileRange.min}-${profileRange.max} narrowed to ${effectiveRange.min}-${effectiveRange.max} by documented exercise-specific bounds.`;

const validateDoseBoundary = (
  volume: PrescriptionVolume,
  profile: NumericalPrescriptionProfile,
):
  | { valid: true }
  | {
      valid: false;
      code: "VOLUME_BELOW_MINIMUM_DOSE" | "VOLUME_ABOVE_MAXIMUM_DOSE";
      message: string;
    } => {
  const repetitions =
    volume.reps?.type === "fixed" ? volume.reps.value : null;
  const durationSeconds =
    volume.duration === null
      ? null
      : volume.duration.unit === "minutes"
        ? volume.duration.value * 60
        : volume.duration.value;
  const distanceMeters = volume.distance?.value ?? null;

  const comparisons: Array<{
    name: string;
    value: number | null;
    min: number | null;
    max: number | null;
  }> = [
    {
      name: "sets",
      value: volume.sets,
      min: profile.minimumDose.sets,
      max: profile.maximumDose.sets,
    },
    {
      name: "repetitions",
      value: repetitions,
      min: profile.minimumDose.repetitions,
      max: profile.maximumDose.repetitions,
    },
    {
      name: "durationSeconds",
      value: durationSeconds,
      min: profile.minimumDose.durationSeconds,
      max: profile.maximumDose.durationSeconds,
    },
    {
      name: "distanceMeters",
      value: distanceMeters,
      min: profile.minimumDose.distanceMeters,
      max: profile.maximumDose.distanceMeters,
    },
    {
      name: "rounds",
      value: volume.rounds,
      min: profile.minimumDose.rounds,
      max: profile.maximumDose.rounds,
    },
    {
      name: "workIntervals",
      value: volume.workIntervals,
      min: profile.minimumDose.workIntervals,
      max: profile.maximumDose.workIntervals,
    },
  ];

  for (const comparison of comparisons) {
    if (
      comparison.value !== null &&
      comparison.min !== null &&
      comparison.value < comparison.min
    ) {
      return {
        valid: false,
        code: "VOLUME_BELOW_MINIMUM_DOSE",
        message: `${comparison.name} value ${comparison.value} is below minimum dose ${comparison.min}.`,
      };
    }

    if (
      comparison.value !== null &&
      comparison.max !== null &&
      comparison.value > comparison.max
    ) {
      return {
        valid: false,
        code: "VOLUME_ABOVE_MAXIMUM_DOSE",
        message: `${comparison.name} value ${comparison.value} exceeds maximum dose ${comparison.max}.`,
      };
    }
  }

  return { valid: true };
};

// -----------------------------------------------------------------------------
// Resolver
// -----------------------------------------------------------------------------

export const resolveVolume = (
  input: ResolveVolumeInput,
): VolumeResolutionResult => {
  const profileResolution = resolveNumericalProfile({
    moduleId: input.moduleId,
    methodId: input.methodId,
    exerciseRole: input.role,
    explicitProfileId: input.numericalProfileId ?? null,
  });

  if (!profileResolution.ok) {
    return buildFailure(
      input,
      null,
      profileResolution.failureCode,
      profileResolution.message,
    );
  }

  const { profile, resolutionSource: profileResolutionSource } = profileResolution;

  if (profile.sourceRuleIds.length === 0) {
    return buildFailure(
      input,
      profile,
      "VOLUME_RULE_SOURCE_MISSING",
      `Numerical profile ${profile.profileId} has no source rule.`,
    );
  }

  if (input.lateralityRequired === true && input.laterality == null) {
    return buildFailure(
      input,
      profile,
      "VOLUME_LATERALITY_REQUIRED",
      `Profile ${profile.profileId} requires explicit laterality for this exercise.`,
    );
  }

  const volumeRule = profile.volume;
  const doseConstraints = input.exerciseDoseConstraints ?? null;

  if (doseConstraints !== null) {
    const constraintValidation = validateExerciseDoseConstraints(
      doseConstraints,
      volumeRule,
    );

    if (!constraintValidation.valid) {
      return buildFailure(
        input,
        profile,
        constraintValidation.code,
        constraintValidation.message,
      );
    }
  }

  const narrowingNotes: string[] = [];

  const resolveDimension = (
    dimension: DoseDimension,
    profileRange: IntegerRange | NumericRange | null,
  ):
    | { ok: true; value: number | null }
    | { ok: false } => {
    if (profileRange === null) {
      return { ok: true, value: null };
    }

    const narrowed = applyExerciseDoseConstraint(
      profileRange,
      dimension,
      doseConstraints,
    );

    if (!narrowed.ok) {
      return { ok: false };
    }

    if (narrowed.narrowed) {
      narrowingNotes.push(
        narrowingNote(dimension, profileRange, narrowed.range),
      );
    }

    return {
      ok: true,
      value: selectRangeValue(narrowed.range, input.rangeContext),
    };
  };

  const setsResult = resolveDimension("sets", volumeRule.sets);
  const repetitionsResult = resolveDimension(
    "repetitions",
    volumeRule.repetitions?.range ?? null,
  );
  const durationResult = resolveDimension(
    "durationSeconds",
    volumeRule.duration?.range ?? null,
  );
  const distanceResult = resolveDimension(
    "distanceMeters",
    volumeRule.distance?.range ?? null,
  );
  const roundsResult = resolveDimension("rounds", volumeRule.rounds);
  const workIntervalsResult = resolveDimension(
    "workIntervals",
    volumeRule.workIntervals,
  );

  if (
    !setsResult.ok ||
    !repetitionsResult.ok ||
    !durationResult.ok ||
    !distanceResult.ok ||
    !roundsResult.ok ||
    !workIntervalsResult.ok
  ) {
    return buildFailure(
      input,
      profile,
      "EXERCISE_DOSE_RANGE_EMPTY",
      `Exercise-specific dose bounds do not intersect the shared profile ${profile.profileId} for at least one dimension.`,
    );
  }

  const sets = setsResult.value;
  const repetitionValue = repetitionsResult.value;
  const durationValue = durationResult.value;
  const distanceValue = distanceResult.value;
  const rounds = roundsResult.value;
  const workIntervals = workIntervalsResult.value;

  const volume: PrescriptionVolume = {
    structure: volumeRule.structure,
    sets,
    reps:
      repetitionValue === null
        ? null
        : fixedRepetitions(repetitionValue),
    duration:
      volumeRule.duration === null || durationValue === null
        ? null
        : {
            value: durationValue,
            unit: volumeRule.duration.range.unit,
            scope: volumeRule.duration.scope,
          },
    distance:
      volumeRule.distance === null || distanceValue === null
        ? null
        : {
            value: distanceValue,
            unit: volumeRule.distance.range.unit,
            scope: volumeRule.distance.scope,
          },
    rounds,
    workIntervals,
    laterality: input.laterality ?? null,
  };

  if (
    !isPositiveInteger(volume.sets) ||
    !isPositiveInteger(repetitionValue) ||
    !isPositiveInteger(volume.rounds) ||
    !isPositiveInteger(volume.workIntervals) ||
    !isPositiveFinite(durationValue) ||
    !isPositiveFinite(distanceValue)
  ) {
    return buildFailure(
      input,
      profile,
      "VOLUME_VALUE_INVALID",
      `Profile ${profile.profileId} resolved a non-positive, non-finite or non-integer work value.`,
    );
  }

  const requiredByStructure: Record<
    PrescriptionVolume["structure"],
    readonly (keyof PrescriptionVolume)[]
  > = {
    sets_reps: ["sets", "reps"],
    sets_duration: ["sets", "duration"],
    sets_distance: ["sets", "distance"],
    rounds_duration: ["rounds", "duration"],
    intervals: ["workIntervals", "duration"],
    continuous_duration: ["duration"],
    continuous_distance: ["distance"],
  };

  const forbiddenByStructure: Record<
    PrescriptionVolume["structure"],
    readonly (keyof PrescriptionVolume)[]
  > = {
    sets_reps: ["duration", "distance", "rounds", "workIntervals"],
    sets_duration: ["reps", "distance", "rounds", "workIntervals"],
    sets_distance: ["reps", "duration", "rounds", "workIntervals"],
    rounds_duration: ["sets", "reps", "distance", "workIntervals"],
    intervals: ["sets", "reps", "rounds"],
    continuous_duration: ["sets", "reps", "distance", "rounds", "workIntervals"],
    continuous_distance: ["sets", "reps", "duration", "rounds", "workIntervals"],
  };

  const missingRequiredFields = requiredByStructure[volume.structure].filter(
    (field) => volume[field] === null,
  );

  if (missingRequiredFields.length > 0) {
    return buildFailure(
      input,
      profile,
      "VOLUME_REQUIRED_FIELD_MISSING",
      `Profile ${profile.profileId} is missing required fields for ${volume.structure}: ${missingRequiredFields.join(", ")}.`,
    );
  }

  const forbiddenFieldsPresent = forbiddenByStructure[volume.structure].filter(
    (field) => volume[field] !== null,
  );

  if (forbiddenFieldsPresent.length > 0) {
    return buildFailure(
      input,
      profile,
      "VOLUME_FORBIDDEN_FIELD_PRESENT",
      `Profile ${profile.profileId} populated forbidden fields for ${volume.structure}: ${forbiddenFieldsPresent.join(", ")}.`,
    );
  }

  if (volume.structure !== volumeRule.structure) {
    return buildFailure(
      input,
      profile,
      "VOLUME_STRUCTURE_MISMATCH",
      `Resolved volume structure does not match numerical profile ${profile.profileId}.`,
    );
  }

  const doseValidation = validateDoseBoundary(volume, profile);

  if (!doseValidation.valid) {
    return buildFailure(
      input,
      profile,
      doseValidation.code,
      doseValidation.message,
    );
  }

  return {
    ok: true,
    moduleId: input.moduleId,
    methodId: input.methodId,
    role: input.role,
    profileId: profile.profileId,
    profileResolutionSource,
    rangeContext: input.rangeContext,
    volume,
    narrowingNotes,
    sourceRuleIds: unique([
      ...(input.sourceRuleIds ?? []),
      ...profile.sourceRuleIds,
      ...(doseConstraints?.sourceRuleIds ?? []),
    ]),
  };
};
