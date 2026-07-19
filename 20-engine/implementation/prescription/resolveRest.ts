/**
 * Combat Athlete System — Rest Resolver
 * Version 0.1
 *
 * Deterministically resolves recovery duration from the documented numerical
 * prescription profile and Training Method contract.
 *
 * No default rest duration is invented.
 */

import type { CapabilityModule, Identifier } from "../types";
import {
  getTrainingMethodContract,
  type TrainingMethodId,
} from "./contracts";
import {
  getNumericalPrescriptionProfile,
  selectRangeValue,
  type IntegerRange,
  type NumericalPrescriptionProfile,
  type NumericalRestRule,
  type RangeContext,
} from "./prescriptionKnowledge";
import type {
  ExerciseRole,
  PrescriptionRest,
  RestScope,
  RestTarget,
} from "./types";

// -----------------------------------------------------------------------------
// Exercise-specific rest constraints
// -----------------------------------------------------------------------------

/**
 * Documented, exercise-specific narrowing of the shared numerical profile's
 * rest rule. `scope` must strictly equal the profile's own `rest.scope` —
 * an exercise constraint can never turn a documented rest requirement into
 * `"not_applicable"`, nor assume a scope the profile does not document.
 * `minimumSeconds`/`maximumSeconds` may only narrow the profile's own
 * `seconds` range, never widen it, and can never fabricate a duration when
 * the profile's `seconds` is `null`.
 */
export interface ExerciseRestConstraints {
  scope: RestScope | "not_applicable";
  minimumSeconds: number | null;
  maximumSeconds: number | null;
  sourceRuleIds: readonly Identifier[];
}

// -----------------------------------------------------------------------------
// Results
// -----------------------------------------------------------------------------

export type RestResolutionFailureCode =
  | "NUMERICAL_PROFILE_MISSING"
  | "REST_REQUIRED_BUT_UNDOCUMENTED"
  | "REST_FORBIDDEN_BUT_DOCUMENTED"
  | "REST_SCOPE_INVALID"
  | "REST_VALUE_INVALID"
  | "REST_RULE_SOURCE_MISSING"
  | "EXERCISE_REST_RANGE_EMPTY"
  | "EXERCISE_REST_SCOPE_INCOMPATIBLE"
  | "EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID"
  | "EXERCISE_PRESCRIPTION_CONSTRAINT_SOURCE_MISSING";

export interface RestResolutionSuccess {
  ok: true;
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;
  profileId: Identifier;
  rangeContext: RangeContext;
  rest: PrescriptionRest | null;
  /**
   * One human-readable sentence when the resolved rest range was narrowed
   * by `exerciseRestConstraints`, showing both the shared profile's
   * original range and the resulting effective (intersected) range. Empty
   * when no exercise constraint was supplied or no numeric narrowing
   * applied. Consumed by `prescriptionDecisionTrace.ts` as additional
   * `reasons`.
   */
  narrowingNotes: readonly string[];
  sourceRuleIds: readonly Identifier[];
}

export interface RestResolutionFailure {
  ok: false;
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;
  profileId: Identifier | null;
  rangeContext: RangeContext;
  failureCode: RestResolutionFailureCode;
  message: string;
  sourceRuleIds: readonly Identifier[];
}

export type RestResolutionResult =
  | RestResolutionSuccess
  | RestResolutionFailure;

// -----------------------------------------------------------------------------
// Input
// -----------------------------------------------------------------------------

export interface ResolveRestInput {
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;
  rangeContext: RangeContext;

  /**
   * Documented, exercise-specific narrowing of the shared profile's rest
   * rule (see `ExerciseRestConstraints`). `null` when the exercise has no
   * documented bounds narrower than the shared profile — resolution then
   * behaves exactly as it did before this field existed.
   */
  exerciseRestConstraints?: ExerciseRestConstraints | null;

  sourceRuleIds?: readonly Identifier[];
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const buildFailure = (
  input: ResolveRestInput,
  profile: NumericalPrescriptionProfile | null,
  failureCode: RestResolutionFailureCode,
  message: string,
): RestResolutionFailure => ({
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
    ...(profile?.rest?.sourceRuleIds ?? []),
  ]),
});

/**
 * Structural validation of `ExerciseRestConstraints` against the profile's
 * own (possibly absent) rest rule: a constraint declared against a `null`
 * profile rest rule is invalid; `scope` must strictly equal the profile's
 * documented scope — `"not_applicable"` can never override a real,
 * documented scope, nor can a real scope be assumed when the profile
 * itself has none; a numeric bound cannot be declared when the profile's
 * `seconds` is `null`, since that would fabricate an envelope the profile
 * never documented; declared bounds must be strictly positive integers,
 * and a minimum may never exceed its own maximum.
 */
const validateExerciseRestConstraints = (
  constraints: ExerciseRestConstraints,
  restRule: NumericalRestRule | null,
):
  | { valid: true }
  | {
      valid: false;
      code: "EXERCISE_PRESCRIPTION_CONSTRAINT_SOURCE_MISSING" | "EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID" | "EXERCISE_REST_SCOPE_INCOMPATIBLE";
      message: string;
    } => {
  if (constraints.sourceRuleIds.length === 0) {
    return {
      valid: false,
      code: "EXERCISE_PRESCRIPTION_CONSTRAINT_SOURCE_MISSING",
      message: "Exercise rest constraints have no source rule.",
    };
  }

  if (restRule === null) {
    return {
      valid: false,
      code: "EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID",
      message: "Exercise rest constraint declared, but the shared profile documents no rest rule at all.",
    };
  }

  if (constraints.scope !== restRule.scope) {
    return {
      valid: false,
      code: "EXERCISE_REST_SCOPE_INCOMPATIBLE",
      message: `Exercise rest constraint declares scope "${constraints.scope}", which does not match the shared profile's documented scope "${restRule.scope}".`,
    };
  }

  if (
    restRule.seconds === null &&
    (constraints.minimumSeconds !== null || constraints.maximumSeconds !== null)
  ) {
    return {
      valid: false,
      code: "EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID",
      message: "Exercise rest constraint declares a numeric bound, but the shared profile documents no rest duration to narrow.",
    };
  }

  for (const bound of [constraints.minimumSeconds, constraints.maximumSeconds]) {
    if (bound !== null && (!Number.isInteger(bound) || bound <= 0)) {
      return {
        valid: false,
        code: "EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID",
        message: `Exercise rest constraint bound (${bound}) must be a strictly positive integer.`,
      };
    }
  }

  if (
    constraints.minimumSeconds !== null &&
    constraints.maximumSeconds !== null &&
    constraints.minimumSeconds > constraints.maximumSeconds
  ) {
    return {
      valid: false,
      code: "EXERCISE_PRESCRIPTION_CONSTRAINT_INVALID",
      message: `Exercise rest constraint has a minimum (${constraints.minimumSeconds}) greater than its maximum (${constraints.maximumSeconds}).`,
    };
  }

  return { valid: true };
};

const restNarrowingNote = (
  profileSeconds: IntegerRange,
  effectiveMin: number,
  effectiveMax: number,
): string =>
  `rest range ${profileSeconds.min}-${profileSeconds.max}s narrowed to ${effectiveMin}-${effectiveMax}s by documented exercise-specific bounds.`;

const toRestScope = (
  scope: "between_sets" | "between_rounds" | "between_intervals",
): RestScope => scope;

const fixedRestTarget = (
  seconds: number,
  scope: RestScope,
): RestTarget => ({
  type: "fixed",
  duration: {
    value: seconds,
    unit: "seconds",
    scope,
  },
});

const buildPrescriptionRest = (
  scope: RestScope,
  target: RestTarget,
  sourceRuleIds: readonly Identifier[],
): PrescriptionRest => ({
  type: "fixed",
  betweenReps: null,
  betweenClusters: null,
  betweenSets: scope === "between_sets" ? target : null,
  betweenRounds: scope === "between_rounds" ? target : null,
  betweenIntervals: scope === "between_intervals" ? target : null,
  betweenExercises: null,
  afterBlock: null,
  adjustments: [],
  sourceRuleIds: [...sourceRuleIds],
  status: "complete",
});

// -----------------------------------------------------------------------------
// Resolver
// -----------------------------------------------------------------------------

export const resolveRest = (
  input: ResolveRestInput,
): RestResolutionResult => {
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

  const method = getTrainingMethodContract(input.methodId);
  const restRule = profile.rest;
  const exerciseRestConstraints = input.exerciseRestConstraints ?? null;

  if (exerciseRestConstraints !== null) {
    const constraintValidation = validateExerciseRestConstraints(
      exerciseRestConstraints,
      restRule,
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

  if (restRule === null) {
    if (method.restPolicy === "required") {
      return buildFailure(
        input,
        profile,
        "REST_REQUIRED_BUT_UNDOCUMENTED",
        `Method ${input.methodId} requires rest, but profile ${profile.profileId} contains no rest rule.`,
      );
    }

    return {
      ok: true,
      moduleId: input.moduleId,
      methodId: input.methodId,
      role: input.role,
      profileId: profile.profileId,
      rangeContext: input.rangeContext,
      rest: null,
      narrowingNotes: [],
      sourceRuleIds: unique([
        ...(input.sourceRuleIds ?? []),
        ...profile.sourceRuleIds,
        ...method.sourceRuleIds,
      ]),
    };
  }

  if (
    method.restPolicy === "forbidden" &&
    restRule.scope !== "not_applicable"
  ) {
    return buildFailure(
      input,
      profile,
      "REST_FORBIDDEN_BUT_DOCUMENTED",
      `Method ${input.methodId} forbids rest, but profile ${profile.profileId} documents ${restRule.scope}.`,
    );
  }

  if (restRule.scope === "not_applicable") {
    if (restRule.seconds !== null) {
      return buildFailure(
        input,
        profile,
        "REST_SCOPE_INVALID",
        `Profile ${profile.profileId} marks rest as not applicable but still provides a duration.`,
      );
    }

    return {
      ok: true,
      moduleId: input.moduleId,
      methodId: input.methodId,
      role: input.role,
      profileId: profile.profileId,
      rangeContext: input.rangeContext,
      rest: null,
      narrowingNotes: [],
      sourceRuleIds: unique([
        ...(input.sourceRuleIds ?? []),
        ...profile.sourceRuleIds,
        ...method.sourceRuleIds,
        ...restRule.sourceRuleIds,
      ]),
    };
  }

  if (restRule.seconds === null) {
    return buildFailure(
      input,
      profile,
      "REST_REQUIRED_BUT_UNDOCUMENTED",
      `Profile ${profile.profileId} defines rest scope ${restRule.scope} without a duration.`,
    );
  }

  if (restRule.sourceRuleIds.length === 0) {
    return buildFailure(
      input,
      profile,
      "REST_RULE_SOURCE_MISSING",
      `Rest rule in profile ${profile.profileId} has no source rule.`,
    );
  }

  let effectiveSeconds = restRule.seconds;
  const narrowingNotes: string[] = [];

  if (
    exerciseRestConstraints !== null &&
    (exerciseRestConstraints.minimumSeconds !== null ||
      exerciseRestConstraints.maximumSeconds !== null)
  ) {
    const effectiveMin =
      exerciseRestConstraints.minimumSeconds !== null
        ? Math.max(restRule.seconds.min, exerciseRestConstraints.minimumSeconds)
        : restRule.seconds.min;
    const effectiveMax =
      exerciseRestConstraints.maximumSeconds !== null
        ? Math.min(restRule.seconds.max, exerciseRestConstraints.maximumSeconds)
        : restRule.seconds.max;

    if (effectiveMin > effectiveMax) {
      return buildFailure(
        input,
        profile,
        "EXERCISE_REST_RANGE_EMPTY",
        `Exercise-specific rest constraint narrowed profile ${profile.profileId}'s rest range ${restRule.seconds.min}-${restRule.seconds.max}s to an empty range.`,
      );
    }

    const effectiveNormal = Math.min(
      Math.max(restRule.seconds.normal, effectiveMin),
      effectiveMax,
    );

    effectiveSeconds = { min: effectiveMin, normal: effectiveNormal, max: effectiveMax };
    narrowingNotes.push(
      restNarrowingNote(restRule.seconds, effectiveMin, effectiveMax),
    );
  }

  const seconds = selectRangeValue(
    effectiveSeconds,
    input.rangeContext,
  );

  if (!Number.isInteger(seconds) || seconds <= 0) {
    return buildFailure(
      input,
      profile,
      "REST_VALUE_INVALID",
      `Profile ${profile.profileId} resolved an invalid rest duration: ${seconds}.`,
    );
  }

  const scope = toRestScope(restRule.scope);
  const sourceRuleIds = unique([
    ...(input.sourceRuleIds ?? []),
    ...profile.sourceRuleIds,
    ...method.sourceRuleIds,
    ...restRule.sourceRuleIds,
    ...(exerciseRestConstraints === null ? [] : exerciseRestConstraints.sourceRuleIds),
  ]);

  return {
    ok: true,
    moduleId: input.moduleId,
    methodId: input.methodId,
    role: input.role,
    profileId: profile.profileId,
    rangeContext: input.rangeContext,
    rest: buildPrescriptionRest(
      scope,
      fixedRestTarget(seconds, scope),
      sourceRuleIds,
    ),
    narrowingNotes,
    sourceRuleIds,
  };
};
