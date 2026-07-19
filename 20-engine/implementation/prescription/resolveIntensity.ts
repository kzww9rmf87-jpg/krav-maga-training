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
// Exercise-specific intensity constraints
// -----------------------------------------------------------------------------

/**
 * Documented, exercise-specific narrowing of a single intensity rule's range
 * within the shared numerical profile. Only applies to `IntensityRangeRule`
 * entries — categorical rules (`IntensityCategoryRule`) have no numeric
 * range and can only be included or excluded via `allowedIntensityTypes`.
 * `minimum`/`maximum` may only narrow the shared rule's own range, never
 * widen it: `effectiveMin = max(ruleMin, min)`, `effectiveMax = min(ruleMax, max)`.
 * `normal`, when not `null`, is an exercise-specific override of the shared
 * rule's own normal value: it never participates in computing
 * `effectiveMin`/`effectiveMax`, must itself fall inside the resulting
 * effective range, and is used as-is instead of the usual
 * profile-normal-clamped-into-range behavior. `null` preserves that
 * existing clamp exactly as before this field existed.
 */
export interface ExerciseIntensityRangeConstraint {
  type: IntensityType;
  minimum: number | null;
  maximum: number | null;
  normal: number | null;
}

/**
 * Documented, exercise-specific narrowing of the shared numerical profile's
 * intensity rules. Not an exercise capability — `supportedIntensityTypes`
 * already expresses what the exercise capability profile supports; this
 * expresses what the documented exercise-specific prescription bounds are.
 * `allowedIntensityTypes: null` means no exercise-specific type restriction
 * (every profile-documented type remains a candidate). An empty array is a
 * legitimate, deliberate restriction to zero types, not an omission.
 */
export interface ExerciseIntensityConstraints {
  allowedIntensityTypes: readonly IntensityType[] | null;
  rangeConstraints: readonly ExerciseIntensityRangeConstraint[];
  sourceRuleIds: readonly Identifier[];
}

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
  | "INTENSITY_EXERCISE_SPECIFIC_RULE_REQUIRED"
  | "EXERCISE_INTENSITY_RANGE_EMPTY"
  | "EXERCISE_INTENSITY_TYPE_UNSUPPORTED"
  | "EXERCISE_INTENSITY_NORMAL_OUT_OF_RANGE"
  | "EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID"
  | "EXERCISE_PRESCRIPTION_CONSTRAINT_SOURCE_MISSING";

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
  /**
   * One human-readable sentence when the selected rule's range was narrowed
   * by `exerciseIntensityConstraints`, showing both the shared profile's
   * original range and the resulting effective (intersected) range. Empty
   * when no exercise constraint was supplied or the selected rule was not
   * narrowed. Consumed by `prescriptionDecisionTrace.ts` as additional
   * `reasons`.
   */
  narrowingNotes: readonly string[];
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

  /**
   * Documented, exercise-specific narrowing of the shared profile's
   * intensity rules (see `ExerciseIntensityConstraints`). `null` when the
   * exercise has no documented bounds narrower than the shared profile —
   * resolution then behaves exactly as it did before this field existed.
   */
  exerciseIntensityConstraints?: ExerciseIntensityConstraints | null;

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

const isRangeRule = (
  rule: NumericalIntensityRule,
): rule is Extract<NumericalIntensityRule, { min: number }> => "min" in rule;

/**
 * Structural validation of `ExerciseIntensityConstraints`, independent of
 * any particular resolution attempt: `allowedIntensityTypes` must contain
 * no duplicate and no type absent from the profile; each `rangeConstraints`
 * entry must target a type the profile actually documents, must target a
 * range rule (never a categorical rule), must express at least one bound,
 * and a declared minimum may never exceed its own maximum.
 */
const validateExerciseIntensityConstraints = (
  constraints: ExerciseIntensityConstraints,
  profile: NumericalPrescriptionProfile,
):
  | { valid: true }
  | {
      valid: false;
      code: "EXERCISE_PRESCRIPTION_CONSTRAINT_SOURCE_MISSING" | "EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID";
      message: string;
    } => {
  if (constraints.sourceRuleIds.length === 0) {
    return {
      valid: false,
      code: "EXERCISE_PRESCRIPTION_CONSTRAINT_SOURCE_MISSING",
      message: "Exercise intensity constraints have no source rule.",
    };
  }

  if (constraints.allowedIntensityTypes !== null) {
    const seenTypes = new Set<IntensityType>();

    for (const type of constraints.allowedIntensityTypes) {
      if (seenTypes.has(type)) {
        return {
          valid: false,
          code: "EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID",
          message: `Exercise intensity constraint declares "${type}" more than once in allowedIntensityTypes.`,
        };
      }
      seenTypes.add(type);

      if (!profile.intensity.some((rule) => rule.type === type)) {
        return {
          valid: false,
          code: "EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID",
          message: `Exercise intensity constraint allows "${type}", which profile ${profile.profileId} does not document.`,
        };
      }
    }
  }

  const seenRangeTypes = new Set<IntensityType>();

  for (const rangeConstraint of constraints.rangeConstraints) {
    if (seenRangeTypes.has(rangeConstraint.type)) {
      return {
        valid: false,
        code: "EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID",
        message: `Exercise intensity constraint declares more than one range constraint for "${rangeConstraint.type}".`,
      };
    }
    seenRangeTypes.add(rangeConstraint.type);

    const targetRule = profile.intensity.find(
      (rule) => rule.type === rangeConstraint.type,
    );

    if (targetRule === undefined) {
      return {
        valid: false,
        code: "EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID",
        message: `Exercise intensity range constraint targets "${rangeConstraint.type}", which profile ${profile.profileId} does not document.`,
      };
    }

    if (!isRangeRule(targetRule)) {
      return {
        valid: false,
        code: "EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID",
        message: `Exercise intensity range constraint targets "${rangeConstraint.type}", which is a categorical rule and cannot be range-constrained.`,
      };
    }

    if (rangeConstraint.minimum === null && rangeConstraint.maximum === null) {
      return {
        valid: false,
        code: "EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID",
        message: `Exercise intensity range constraint for "${rangeConstraint.type}" declares neither a minimum nor a maximum.`,
      };
    }

    if (
      (rangeConstraint.minimum !== null && !Number.isFinite(rangeConstraint.minimum)) ||
      (rangeConstraint.maximum !== null && !Number.isFinite(rangeConstraint.maximum))
    ) {
      return {
        valid: false,
        code: "EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID",
        message: `Exercise intensity range constraint for "${rangeConstraint.type}" must use finite bounds.`,
      };
    }

    if (rangeConstraint.normal !== null && !Number.isFinite(rangeConstraint.normal)) {
      return {
        valid: false,
        code: "EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID",
        message: `Exercise intensity range constraint for "${rangeConstraint.type}" must use a finite normal value.`,
      };
    }

    if (
      rangeConstraint.minimum !== null &&
      rangeConstraint.maximum !== null &&
      rangeConstraint.minimum > rangeConstraint.maximum
    ) {
      return {
        valid: false,
        code: "EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID",
        message: `Exercise intensity range constraint for "${rangeConstraint.type}" has a minimum (${rangeConstraint.minimum}) greater than its maximum (${rangeConstraint.maximum}).`,
      };
    }
  }

  return { valid: true };
};

const intensityNarrowingNote = (
  rule: Extract<NumericalIntensityRule, { min: number }>,
  effectiveMin: number,
  effectiveMax: number,
): string =>
  `${rule.type} range ${rule.min}-${rule.max} narrowed to ${effectiveMin}-${effectiveMax} by documented exercise-specific bounds.`;

const intensityNormalNote = (
  rule: Extract<NumericalIntensityRule, { min: number }>,
  effectiveMin: number,
  effectiveMax: number,
  normal: number,
): string =>
  `Shared ${rule.type} normal ${rule.normal} was adjusted to ${normal} within the exercise-specific effective range ${effectiveMin}-${effectiveMax}.`;

interface EffectiveIntensityRule {
  rule: NumericalIntensityRule;
  narrowingNotes: readonly string[];
}

/**
 * Phase 1 of exercise-specific intensity resolution: builds the effective
 * candidate rule set before any capability/reference/preference selection
 * runs. A type excluded via `allowedIntensityTypes` is simply dropped, not
 * a failure. A `rangeConstraints` entry that intersects to an empty range
 * fails immediately — an explicit constraint inconsistent with the rule it
 * targets must surface, never be silently ignored. An explicit `normal`
 * that falls outside the resulting effective range fails immediately for
 * the same reason, distinguished from an empty-range failure so the caller
 * can report the precise cause.
 */
const buildEffectiveIntensityRules = (
  profile: NumericalPrescriptionProfile,
  constraints: ExerciseIntensityConstraints | null,
):
  | { ok: true; rules: EffectiveIntensityRule[]; excludedTypes: IntensityType[] }
  | { ok: false; ruleType: IntensityType; reason: "range_empty" | "normal_out_of_range" } => {
  const excludedTypes: IntensityType[] = [];
  const rules: EffectiveIntensityRule[] = [];

  for (const rule of profile.intensity) {
    if (
      constraints !== null &&
      constraints.allowedIntensityTypes !== null &&
      !constraints.allowedIntensityTypes.includes(rule.type)
    ) {
      excludedTypes.push(rule.type);
      continue;
    }

    const rangeConstraint =
      constraints?.rangeConstraints.find((c) => c.type === rule.type) ?? null;

    if (rangeConstraint === null || !isRangeRule(rule)) {
      rules.push({ rule, narrowingNotes: [] });
      continue;
    }

    const effectiveMin =
      rangeConstraint.minimum !== null
        ? Math.max(rule.min, rangeConstraint.minimum)
        : rule.min;
    const effectiveMax =
      rangeConstraint.maximum !== null
        ? Math.min(rule.max, rangeConstraint.maximum)
        : rule.max;

    if (effectiveMin > effectiveMax) {
      return { ok: false, ruleType: rule.type, reason: "range_empty" };
    }

    const narrowingNotes: string[] = [
      intensityNarrowingNote(rule, effectiveMin, effectiveMax),
    ];

    let effectiveNormal: number;

    if (rangeConstraint.normal !== null) {
      if (rangeConstraint.normal < effectiveMin || rangeConstraint.normal > effectiveMax) {
        return { ok: false, ruleType: rule.type, reason: "normal_out_of_range" };
      }

      effectiveNormal = rangeConstraint.normal;

      if (effectiveNormal !== rule.normal) {
        narrowingNotes.push(
          intensityNormalNote(rule, effectiveMin, effectiveMax, effectiveNormal),
        );
      }
    } else {
      effectiveNormal = Math.min(Math.max(rule.normal, effectiveMin), effectiveMax);
    }

    rules.push({
      rule: { ...rule, min: effectiveMin, normal: effectiveNormal, max: effectiveMax },
      narrowingNotes,
    });
  }

  return { ok: true, rules, excludedTypes };
};

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

  const exerciseIntensityConstraints = input.exerciseIntensityConstraints ?? null;

  if (exerciseIntensityConstraints !== null) {
    const constraintValidation = validateExerciseIntensityConstraints(
      exerciseIntensityConstraints,
      profile,
    );

    if (!constraintValidation.valid) {
      return buildFailure(
        input,
        profile,
        constraintValidation.code,
        constraintValidation.message,
        [],
      );
    }
  }

  const effectiveRulesResult = buildEffectiveIntensityRules(
    profile,
    exerciseIntensityConstraints,
  );

  if (!effectiveRulesResult.ok) {
    if (effectiveRulesResult.reason === "normal_out_of_range") {
      return buildFailure(
        input,
        profile,
        "EXERCISE_INTENSITY_NORMAL_OUT_OF_RANGE",
        `Exercise-specific normal for rule "${effectiveRulesResult.ruleType}" in profile ${profile.profileId} falls outside the effective range.`,
        [],
      );
    }

    return buildFailure(
      input,
      profile,
      "EXERCISE_INTENSITY_RANGE_EMPTY",
      `Exercise-specific intensity constraint narrowed rule "${effectiveRulesResult.ruleType}" in profile ${profile.profileId} to an empty range.`,
      [],
    );
  }

  const { rules: effectiveIntensityRules, excludedTypes } = effectiveRulesResult;

  if (effectiveIntensityRules.length === 0) {
    return buildFailure(
      input,
      profile,
      "EXERCISE_INTENSITY_TYPE_UNSUPPORTED",
      `Exercise-specific intensity constraints exclude every documented intensity type in profile ${profile.profileId}.`,
      unique(excludedTypes),
    );
  }

  const narrowingNotesByType = new Map<IntensityType, readonly string[]>();
  for (const effectiveRule of effectiveIntensityRules) {
    if (effectiveRule.narrowingNotes.length > 0) {
      narrowingNotesByType.set(effectiveRule.rule.type, effectiveRule.narrowingNotes);
    }
  }

  const athleteReferences = input.athleteReferences ?? [];
  const rejectedRuleTypes: IntensityType[] = [...excludedTypes];

  const orderedRules = effectiveIntensityRules.map((r) => r.rule).sort((left, right) => {
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
      ...(exerciseIntensityConstraints === null
        ? []
        : exerciseIntensityConstraints.sourceRuleIds),
    ]);

    const narrowingNotes = narrowingNotesByType.get(rule.type) ?? [];

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
      narrowingNotes,
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
