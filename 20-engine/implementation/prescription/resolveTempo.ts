/**
 * Combat Athlete System — Tempo Resolver
 * Version 0.1
 *
 * Deterministically resolves exercise tempo from:
 * - the Training Method contract;
 * - the documented numerical prescription profile;
 * - the exact tempo capabilities declared for the exercise.
 *
 * No default tempo is invented.
 */

import type { CapabilityModule, Identifier } from "../types";
import {
  getTrainingMethodContract,
  type TrainingMethodId,
} from "./contracts";
import {
  resolveNumericalProfile,
  type NumericalPrescriptionProfile,
  type NumericalProfileResolutionSource,
  type RangeContext,
} from "./prescriptionKnowledge";
import type {
  ExerciseRole,
  PrescriptionTempo,
  TempoType,
} from "./types";

// -----------------------------------------------------------------------------
// Results
// -----------------------------------------------------------------------------

export type TempoResolutionFailureCode =
  | "NUMERICAL_PROFILE_MISSING"
  | "NUMERICAL_PROFILE_AMBIGUOUS"
  | "NUMERICAL_PROFILE_ID_UNKNOWN"
  | "NUMERICAL_PROFILE_TRIPLE_MISMATCH"
  | "TEMPO_REQUIRED_BUT_UNDOCUMENTED"
  | "TEMPO_FORBIDDEN_BUT_DOCUMENTED"
  | "TEMPO_TYPE_UNSUPPORTED_BY_METHOD"
  | "TEMPO_TYPE_UNSUPPORTED_BY_EXERCISE"
  | "TEMPO_VALUE_INVALID"
  | "TEMPO_RULE_SOURCE_MISSING";

export interface TempoResolutionSuccess {
  ok: true;
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;
  profileId: Identifier;
  /** How the numerical profile was selected — explicit id or unique triple. */
  profileResolutionSource: NumericalProfileResolutionSource;
  rangeContext: RangeContext;
  tempo: PrescriptionTempo | null;
  sourceRuleIds: readonly Identifier[];
}

export interface TempoResolutionFailure {
  ok: false;
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;
  profileId: Identifier | null;
  rangeContext: RangeContext;
  failureCode: TempoResolutionFailureCode;
  message: string;
  sourceRuleIds: readonly Identifier[];
}

export type TempoResolutionResult =
  | TempoResolutionSuccess
  | TempoResolutionFailure;

// -----------------------------------------------------------------------------
// Input
// -----------------------------------------------------------------------------

export interface ResolveTempoInput {
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;
  rangeContext: RangeContext;

  /**
   * Tempo types supported by the exact exercise capability profile.
   */
  supportedTempoTypes: readonly TempoType[];

  /**
   * Optional explicit tempo selected by a validated upstream rule.
   */
  preferredTempoType?: TempoType | null;

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

const buildFailure = (
  input: ResolveTempoInput,
  profile: NumericalPrescriptionProfile | null,
  failureCode: TempoResolutionFailureCode,
  message: string,
): TempoResolutionFailure => ({
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
    ...(profile?.tempo?.sourceRuleIds ?? []),
  ]),
});

// -----------------------------------------------------------------------------
// Resolver
// -----------------------------------------------------------------------------

export const resolveTempo = (
  input: ResolveTempoInput,
): TempoResolutionResult => {
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

  const method = getTrainingMethodContract(input.methodId);
  const tempoRule = profile.tempo;

  if (tempoRule === null || tempoRule.type === "none") {
    if (method.tempoPolicy === "required") {
      return buildFailure(
        input,
        profile,
        "TEMPO_REQUIRED_BUT_UNDOCUMENTED",
        `Method ${input.methodId} requires tempo, but profile ${profile.profileId} contains no usable tempo rule.`,
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
      tempo: null,
      sourceRuleIds: unique([
        ...(input.sourceRuleIds ?? []),
        ...profile.sourceRuleIds,
        ...method.sourceRuleIds,
        ...(tempoRule?.sourceRuleIds ?? []),
      ]),
    };
  }

  if (method.tempoPolicy === "forbidden") {
    return buildFailure(
      input,
      profile,
      "TEMPO_FORBIDDEN_BUT_DOCUMENTED",
      `Method ${input.methodId} forbids tempo, but profile ${profile.profileId} contains a tempo rule.`,
    );
  }

  const documentedTempoType: TempoType = tempoRule.type;
  const tempoType = input.preferredTempoType ?? documentedTempoType;

  if (!method.allowedTempoTypes.includes(tempoType)) {
    return buildFailure(
      input,
      profile,
      "TEMPO_TYPE_UNSUPPORTED_BY_METHOD",
      `Tempo type ${tempoType} is not authorized by method ${input.methodId}.`,
    );
  }

  if (!input.supportedTempoTypes.includes(tempoType)) {
    return buildFailure(
      input,
      profile,
      "TEMPO_TYPE_UNSUPPORTED_BY_EXERCISE",
      `Exercise does not support tempo type ${tempoType}.`,
    );
  }

  if (tempoRule.sourceRuleIds.length === 0) {
    return buildFailure(
      input,
      profile,
      "TEMPO_RULE_SOURCE_MISSING",
      `Tempo rule in profile ${profile.profileId} has no source rule.`,
    );
  }

  if (
    (tempoType === "global_intent" || tempoType === "phase_intent") &&
    tempoRule.globalIntent === null
  ) {
    return buildFailure(
      input,
      profile,
      "TEMPO_VALUE_INVALID",
      `Tempo rule in profile ${profile.profileId} requires a documented movement intent.`,
    );
  }

  const sourceRuleIds = unique([
    ...(input.sourceRuleIds ?? []),
    ...profile.sourceRuleIds,
    ...method.sourceRuleIds,
    ...tempoRule.sourceRuleIds,
  ]);

  const tempo: PrescriptionTempo = {
    type: tempoType,
    eccentric: null,
    bottom: null,
    concentric: null,
    top: null,
    hold: null,
    globalIntent: tempoRule.globalIntent,
    adjustments: [],
    sourceRuleIds: [...sourceRuleIds],
    status: "complete",
  };

  return {
    ok: true,
    moduleId: input.moduleId,
    methodId: input.methodId,
    role: input.role,
    profileId: profile.profileId,
    profileResolutionSource,
    rangeContext: input.rangeContext,
    tempo,
    sourceRuleIds,
  };
};
