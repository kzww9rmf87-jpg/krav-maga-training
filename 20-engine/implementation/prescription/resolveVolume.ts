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
  getNumericalPrescriptionProfile,
  selectRangeValue,
  type NumericalPrescriptionProfile,
  type RangeContext,
} from "./prescriptionKnowledge";
import type {
  ExerciseRole,
  PrescriptionLaterality,
  PrescriptionVolume,
  RepetitionTarget,
} from "./types";

// -----------------------------------------------------------------------------
// Result types
// -----------------------------------------------------------------------------

export type VolumeResolutionFailureCode =
  | "NUMERICAL_PROFILE_MISSING"
  | "VOLUME_STRUCTURE_MISMATCH"
  | "VOLUME_REQUIRED_FIELD_MISSING"
  | "VOLUME_FORBIDDEN_FIELD_PRESENT"
  | "VOLUME_VALUE_INVALID"
  | "VOLUME_LATERALITY_REQUIRED"
  | "VOLUME_BELOW_MINIMUM_DOSE"
  | "VOLUME_ABOVE_MAXIMUM_DOSE"
  | "VOLUME_RULE_SOURCE_MISSING";

export interface VolumeResolutionSuccess {
  ok: true;
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;
  profileId: Identifier;
  rangeContext: RangeContext;
  volume: PrescriptionVolume;
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
  const profile = getNumericalPrescriptionProfile(
    input.moduleId,
    input.methodId,
    input.role,
  );

  if (profile === null) {
    return buildFailure(
      input,
      null,
      "NUMERICAL_PROFILE_MISSING",
      `No numerical prescription profile exists for module ${input.moduleId}, method ${input.methodId} and role ${input.role}.`,
    );
  }

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

  const sets =
    volumeRule.sets === null
      ? null
      : selectRangeValue(volumeRule.sets, input.rangeContext);

  const repetitionValue =
    volumeRule.repetitions === null
      ? null
      : selectRangeValue(
          volumeRule.repetitions.range,
          input.rangeContext,
        );

  const durationValue =
    volumeRule.duration === null
      ? null
      : selectRangeValue(volumeRule.duration.range, input.rangeContext);

  const distanceValue =
    volumeRule.distance === null
      ? null
      : selectRangeValue(volumeRule.distance.range, input.rangeContext);

  const rounds =
    volumeRule.rounds === null
      ? null
      : selectRangeValue(volumeRule.rounds, input.rangeContext);

  const workIntervals =
    volumeRule.workIntervals === null
      ? null
      : selectRangeValue(volumeRule.workIntervals, input.rangeContext);

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
    rangeContext: input.rangeContext,
    volume,
    sourceRuleIds: unique([
      ...(input.sourceRuleIds ?? []),
      ...profile.sourceRuleIds,
    ]),
  };
};
