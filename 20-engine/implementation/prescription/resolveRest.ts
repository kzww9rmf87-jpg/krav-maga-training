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
  type NumericalPrescriptionProfile,
  type RangeContext,
} from "./prescriptionKnowledge";
import type {
  ExerciseRole,
  PrescriptionRest,
  RestScope,
  RestTarget,
} from "./types";

// -----------------------------------------------------------------------------
// Results
// -----------------------------------------------------------------------------

export type RestResolutionFailureCode =
  | "NUMERICAL_PROFILE_MISSING"
  | "REST_REQUIRED_BUT_UNDOCUMENTED"
  | "REST_FORBIDDEN_BUT_DOCUMENTED"
  | "REST_SCOPE_INVALID"
  | "REST_VALUE_INVALID"
  | "REST_RULE_SOURCE_MISSING";

export interface RestResolutionSuccess {
  ok: true;
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;
  profileId: Identifier;
  rangeContext: RangeContext;
  rest: PrescriptionRest | null;
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

  const seconds = selectRangeValue(
    restRule.seconds,
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
    sourceRuleIds,
  };
};
