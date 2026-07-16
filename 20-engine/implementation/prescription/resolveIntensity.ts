/**
 * Combat Athlete System — Intensity Resolver
 * Version 0.1
 *
 * Deterministically resolves one primary intensity metric from a documented
 * numerical prescription profile.
 *
 * Resolution order follows the profile's documented intensity-rule order.
 * A rule requiring an athlete reference is eligible only when that exact
 * validated reference is available.
 *
 * This resolver never estimates a missing athlete reference.
 */

import type { CapabilityModule, Identifier } from "../types";
import type { TrainingMethodId } from "./contracts";
import {
  getNumericalPrescriptionProfile,
  selectRangeValue,
  type NumericalIntensityRule,
  type NumericalPrescriptionProfile,
  type RangeContext,
} from "./prescriptionKnowledge";
import type {
  ExerciseRole,
  IntensityCalculation,
  IntensityMetric,
  IntensityReference,
  IntensityReferenceType,
  IntensityType,
  IntensityUnit,
  PrescriptionIntensity,
} from "./types";

// -----------------------------------------------------------------------------
// Result types
// -----------------------------------------------------------------------------

export type IntensityResolutionFailureCode =
  | "NUMERICAL_PROFILE_MISSING"
  | "INTENSITY_NOT_DOCUMENTED"
  | "INTENSITY_TYPE_UNSUPPORTED"
  | "INTENSITY_REFERENCE_MISSING"
  | "INTENSITY_REFERENCE_INVALID"
  | "INTENSITY_TARGET_INVALID"
  | "INTENSITY_RULE_SOURCE_MISSING"
  | "INTENSITY_EXERCISE_SPECIFIC_RULE_REQUIRED";

export interface IntensityResolutionSuccess {
  ok: true;
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;
  profileId: Identifier;
  rangeContext: RangeContext;
  intensity: PrescriptionIntensity;
  selectedRuleType: IntensityType;
  rejectedRuleTypes: readonly IntensityType[];
  sourceRuleIds: readonly Identifier[];
}

export interface IntensityResolutionFailure {
  ok: false;
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;
  profileId: Identifier | null;
  rangeContext: RangeContext;
  failureCode: IntensityResolutionFailureCode;
  message: string;
  rejectedRuleTypes: readonly IntensityType[];
  sourceRuleIds: readonly Identifier[];
}

export type IntensityResolutionResult =
  | IntensityResolutionSuccess
  | IntensityResolutionFailure;

// -----------------------------------------------------------------------------
// Input
// -----------------------------------------------------------------------------

export interface ResolveIntensityInput {
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;
  rangeContext: RangeContext;

  /**
   * Intensity types supported by the exact exercise capability profile.
   */
  supportedIntensityTypes: readonly IntensityType[];

  /**
   * Validated athlete references only.
   */
  athleteReferences?: readonly IntensityReference[];

  /**
   * Optional explicit intensity preference selected upstream.
   * The preferred type must still exist in the numerical profile.
   */
  preferredIntensityType?: IntensityType | null;

  /**
   * Optional exact load-rounding configuration.
   * No default equipment increment is invented.
   */
  loadRounding?: {
    incrementKg: number;
    mode: "nearest" | "down" | "up";
    ruleId: Identifier;
  } | null;

  sourceRuleIds?: readonly Identifier[];
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const isFinitePositive = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

const isValidReference = (
  reference: IntensityReference,
  requiredType: IntensityReferenceType,
): boolean =>
  reference.referenceType === requiredType &&
  (typeof reference.value === "string" ||
    (typeof reference.value === "number" &&
      Number.isFinite(reference.value) &&
      reference.value > 0)) &&
  reference.sourceId.length > 0;

const findReference = (
  references: readonly IntensityReference[],
  referenceType: IntensityReferenceType,
): IntensityReference | null =>
  references.find((reference) =>
    isValidReference(reference, referenceType),
  ) ?? null;

const roundLoad = (
  rawLoadKg: number,
  rounding: NonNullable<ResolveIntensityInput["loadRounding"]>,
): number => {
  const scaled = rawLoadKg / rounding.incrementKg;

  switch (rounding.mode) {
    case "nearest":
      return Math.round(scaled) * rounding.incrementKg;
    case "down":
      return Math.floor(scaled) * rounding.incrementKg;
    case "up":
      return Math.ceil(scaled) * rounding.incrementKg;
  }
};

const mapIntensityUnit = (
  rule: NumericalIntensityRule,
): IntensityUnit => {
  if (!("unit" in rule)) {
    return "category";
  }

  switch (rule.unit) {
    case "percentage":
      return "percentage";
    case "rpe_scale_1_10":
      return "rpe_scale_1_10";
    case "repetitions":
      return "repetitions";
    case "kilograms":
      return "kilograms";
    case "category":
      return "category";
  }
};

const resolveRuleValue = (
  rule: NumericalIntensityRule,
  context: RangeContext,
): number | string => {
  if ("value" in rule) {
    return rule.value;
  }

  return selectRangeValue(
    {
      min: rule.min,
      normal: rule.normal,
      max: rule.max,
    },
    context,
  );
};

const buildMetric = (
  rule: NumericalIntensityRule,
  value: number | string,
  reference: IntensityReference | null,
): IntensityMetric => ({
  type: rule.type,
  target:
    typeof value === "number"
      ? {
          type: "fixed",
          value,
        }
      : {
          type: "category",
          value,
        },
  unit: mapIntensityUnit(rule),
  scope: "per_exercise",
  reference,
});

const buildCalculation = (
  rule: NumericalIntensityRule,
  value: number | string,
  reference: IntensityReference | null,
  rounding: ResolveIntensityInput["loadRounding"],
): IntensityCalculation | null => {
  if (
    typeof value !== "number" ||
    reference === null ||
    typeof reference.value !== "number" ||
    !("unit" in rule) ||
    rule.unit !== "percentage"
  ) {
    return null;
  }

  if (
    !("referenceType" in rule) ||
    (rule.referenceType !== "one_rep_max" &&
      rule.referenceType !== "training_max" &&
      rule.referenceType !== "body_mass")
  ) {
    return null;
  }

  const rawResult = reference.value * (value / 100);

  if (!Number.isFinite(rawResult) || rawResult <= 0) {
    return null;
  }

  if (rounding === undefined || rounding === null) {
    return {
      calculationId: `INTENSITY_CALCULATION_${rule.type}`,
      formulaId: "REFERENCE_MULTIPLIED_BY_PERCENTAGE_V0_1",
      inputs: [
        {
          name: "reference",
          value: reference.value,
          unit: reference.unit,
          sourceId: reference.sourceId,
        },
        {
          name: "percentage",
          value,
          unit: "percentage",
          sourceId: rule.sourceRuleIds[0] ?? "UNRESOLVED_RULE_SOURCE",
        },
      ],
      rawResult,
      roundedResult: null,
      outputUnit: "kilograms",
      sourceRuleIds: [...rule.sourceRuleIds],
    };
  }

  const roundedResult = roundLoad(rawResult, rounding);

  return {
    calculationId: `INTENSITY_CALCULATION_${rule.type}`,
    formulaId: "REFERENCE_MULTIPLIED_BY_PERCENTAGE_V0_1",
    inputs: [
      {
        name: "reference",
        value: reference.value,
        unit: reference.unit,
        sourceId: reference.sourceId,
      },
      {
        name: "percentage",
        value,
        unit: "percentage",
        sourceId: rule.sourceRuleIds[0] ?? "UNRESOLVED_RULE_SOURCE",
      },
      {
        name: "load_increment",
        value: rounding.incrementKg,
        unit: "kilograms",
        sourceId: rounding.ruleId,
      },
    ],
    rawResult,
    roundedResult,
    outputUnit: "kilograms",
    sourceRuleIds: unique([
      ...rule.sourceRuleIds,
      rounding.ruleId,
    ]),
  };
};

const buildFailure = (
  input: ResolveIntensityInput,
  profile: NumericalPrescriptionProfile | null,
  failureCode: IntensityResolutionFailureCode,
  message: string,
  rejectedRuleTypes: readonly IntensityType[],
): IntensityResolutionFailure => ({
  ok: false,
  moduleId: input.moduleId,
  methodId: input.methodId,
  role: input.role,
  profileId: profile?.profileId ?? null,
  rangeContext: input.rangeContext,
  failureCode,
  message,
  rejectedRuleTypes,
  sourceRuleIds: unique([
    ...(input.sourceRuleIds ?? []),
    ...(profile?.sourceRuleIds ?? []),
  ]),
});

// -----------------------------------------------------------------------------
// Resolver
// -----------------------------------------------------------------------------

export const resolveIntensity = (
  input: ResolveIntensityInput,
): IntensityResolutionResult => {
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
      [],
    );
  }

  if (profile.intensity.length === 0) {
    return buildFailure(
      input,
      profile,
      "INTENSITY_NOT_DOCUMENTED",
      `Numerical profile ${profile.profileId} contains no documented intensity rule.`,
      [],
    );
  }

  const athleteReferences = input.athleteReferences ?? [];
  const rejectedRuleTypes: IntensityType[] = [];

  const orderedRules = [...profile.intensity].sort((left, right) => {
    if (input.preferredIntensityType === null ||
        input.preferredIntensityType === undefined) {
      return 0;
    }

    if (left.type === input.preferredIntensityType) {
      return -1;
    }

    if (right.type === input.preferredIntensityType) {
      return 1;
    }

    return 0;
  });

  let missingReferenceEncountered = false;
  let invalidTargetEncountered = false;

  for (const rule of orderedRules) {
    if (!input.supportedIntensityTypes.includes(rule.type)) {
      rejectedRuleTypes.push(rule.type);
      continue;
    }

    if (rule.sourceRuleIds.length === 0) {
      return buildFailure(
        input,
        profile,
        "INTENSITY_RULE_SOURCE_MISSING",
        `Intensity rule ${rule.type} in profile ${profile.profileId} has no source rule.`,
        rejectedRuleTypes,
      );
    }

    const reference =
      "referenceType" in rule && rule.referenceType !== null
        ? findReference(
            athleteReferences,
            rule.referenceType as IntensityReferenceType,
          )
        : null;

    if (
      "referenceType" in rule &&
      rule.referenceType !== null &&
      reference === null
    ) {
      missingReferenceEncountered = true;
      rejectedRuleTypes.push(rule.type);
      continue;
    }

    const value = resolveRuleValue(rule, input.rangeContext);

    if (
      (typeof value === "number" && !isFinitePositive(value)) ||
      (typeof value === "string" && value.trim().length === 0)
    ) {
      invalidTargetEncountered = true;
      rejectedRuleTypes.push(rule.type);
      continue;
    }

    if (
      profile.requiresExerciseSpecificLoadRule &&
      ["absolute_load", "percentage_1rm", "percentage_training_max",
        "percentage_body_mass", "resistance_category"].includes(rule.type)
    ) {
      rejectedRuleTypes.push(rule.type);
      continue;
    }

    const primaryMetric = buildMetric(rule, value, reference);
    const calculation = buildCalculation(
      rule,
      value,
      reference,
      input.loadRounding,
    );

    const sourceRuleIds = unique([
      ...(input.sourceRuleIds ?? []),
      ...profile.sourceRuleIds,
      ...rule.sourceRuleIds,
      ...(reference === null ? [] : [reference.sourceId]),
      ...(input.loadRounding === undefined || input.loadRounding === null
        ? []
        : [input.loadRounding.ruleId]),
    ]);

    return {
      ok: true,
      moduleId: input.moduleId,
      methodId: input.methodId,
      role: input.role,
      profileId: profile.profileId,
      rangeContext: input.rangeContext,
      intensity: {
        primaryMetric,
        secondaryMetrics: [],
        calculation,
        adjustments: [],
        sourceRuleIds: [...sourceRuleIds],
        status: "complete",
      },
      selectedRuleType: rule.type,
      rejectedRuleTypes: unique(rejectedRuleTypes),
      sourceRuleIds,
    };
  }

  if (profile.requiresExerciseSpecificLoadRule) {
    return buildFailure(
      input,
      profile,
      "INTENSITY_EXERCISE_SPECIFIC_RULE_REQUIRED",
      `Profile ${profile.profileId} requires an exercise-specific loading rule that is not available.`,
      unique(rejectedRuleTypes),
    );
  }

  if (missingReferenceEncountered) {
    return buildFailure(
      input,
      profile,
      "INTENSITY_REFERENCE_MISSING",
      `No compatible documented intensity rule could be resolved because required athlete references are missing.`,
      unique(rejectedRuleTypes),
    );
  }

  if (invalidTargetEncountered) {
    return buildFailure(
      input,
      profile,
      "INTENSITY_TARGET_INVALID",
      `All compatible intensity targets in profile ${profile.profileId} are invalid.`,
      unique(rejectedRuleTypes),
    );
  }

  return buildFailure(
    input,
    profile,
    "INTENSITY_TYPE_UNSUPPORTED",
    `Exercise supports none of the documented intensity types in profile ${profile.profileId}.`,
    unique(rejectedRuleTypes),
  );
};
