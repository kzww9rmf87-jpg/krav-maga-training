/**
 * Combat Athlete System — Method Resolver
 * Version 0.1
 *
 * Deterministically resolves one documented Training Method from:
 * - Capability Module;
 * - Exercise Role;
 * - optional explicit upstream method;
 * - optional allowed-method restriction.
 *
 * This resolver does not inspect exercise capabilities yet.
 * Exercise-method compatibility is handled by validateCompatibility.ts.
 */

import type { CapabilityModule, Identifier } from "../types";
import {
  getAuthorizedMethodsForModule,
  getTrainingMethodContract,
  isRoleAuthorizedForMethod,
  isRoleAuthorizedForModuleMethod,
  isTrainingMethodId,
  type ModuleMethodAuthorization,
  type TrainingMethodContract,
  type TrainingMethodId,
} from "./contracts";
import type { ExerciseRole } from "./types";

// -----------------------------------------------------------------------------
// Result types
// -----------------------------------------------------------------------------

export type MethodResolutionFailureCode =
  | "METHOD_ID_INVALID"
  | "METHOD_MODULE_INCOMPATIBLE"
  | "METHOD_ROLE_INCOMPATIBLE"
  | "METHOD_ALLOWED_SET_EMPTY"
  | "METHOD_NO_AUTHORIZED_CANDIDATE"
  | "METHOD_MULTIPLE_UNRESOLVED_CANDIDATES";

export interface MethodResolutionCandidate {
  methodId: TrainingMethodId;
  priority: number;
  sourceRuleIds: readonly Identifier[];
}

export interface MethodResolutionSuccess {
  ok: true;
  moduleId: CapabilityModule;
  role: ExerciseRole;
  methodId: TrainingMethodId;
  method: TrainingMethodContract;
  resolutionSource:
    | "explicit_upstream_method"
    | "module_role_priority";
  candidates: readonly MethodResolutionCandidate[];
  rejectedMethodIds: readonly TrainingMethodId[];
  sourceRuleIds: readonly Identifier[];
}

export interface MethodResolutionFailure {
  ok: false;
  moduleId: CapabilityModule;
  role: ExerciseRole;
  failureCode: MethodResolutionFailureCode;
  message: string;
  requestedMethodId: string | null;
  candidates: readonly MethodResolutionCandidate[];
  rejectedMethodIds: readonly TrainingMethodId[];
  sourceRuleIds: readonly Identifier[];
}

export type MethodResolutionResult =
  | MethodResolutionSuccess
  | MethodResolutionFailure;

// -----------------------------------------------------------------------------
// Input
// -----------------------------------------------------------------------------

export interface ResolveMethodInput {
  moduleId: CapabilityModule;
  role: ExerciseRole;

  /**
   * Optional explicit method selected by a validated upstream rule.
   * Unknown values fail explicitly.
   */
  explicitMethodId?: string | null;

  /**
   * Optional restriction imposed by upstream logic or an exercise capability
   * profile. When provided, only these methods may remain candidates.
   */
  allowedMethodIds?: readonly TrainingMethodId[];

  /**
   * Optional source rules that explain the explicit upstream choice or
   * restriction.
   */
  sourceRuleIds?: readonly Identifier[];
}

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const toCandidate = (
  authorization: ModuleMethodAuthorization,
): MethodResolutionCandidate => ({
  methodId: authorization.methodId,
  priority: authorization.priority,
  sourceRuleIds: authorization.sourceRuleIds,
});

const buildFailure = (
  input: ResolveMethodInput,
  failureCode: MethodResolutionFailureCode,
  message: string,
  candidates: readonly MethodResolutionCandidate[],
  rejectedMethodIds: readonly TrainingMethodId[],
): MethodResolutionFailure => ({
  ok: false,
  moduleId: input.moduleId,
  role: input.role,
  failureCode,
  message,
  requestedMethodId: input.explicitMethodId ?? null,
  candidates,
  rejectedMethodIds,
  sourceRuleIds: unique(input.sourceRuleIds ?? []),
});

// -----------------------------------------------------------------------------
// Resolver
// -----------------------------------------------------------------------------

export const resolveMethod = (
  input: ResolveMethodInput,
): MethodResolutionResult => {
  const authorizedForModuleRole = getAuthorizedMethodsForModule(
    input.moduleId,
    input.role,
  );

  const authorizedMethodIds = new Set(
    authorizedForModuleRole.map((candidate) => candidate.methodId),
  );

  const allowedMethodIds =
    input.allowedMethodIds === undefined
      ? null
      : new Set(input.allowedMethodIds);

  const candidates = authorizedForModuleRole.filter((candidate) => {
    if (allowedMethodIds === null) {
      return true;
    }

    return allowedMethodIds.has(candidate.methodId);
  });

  const rejectedMethodIds = authorizedForModuleRole
    .map((candidate) => candidate.methodId)
    .filter((methodId) => !candidates.some((candidate) => candidate.methodId === methodId));

  const candidateTrace = candidates.map(toCandidate);

  // ---------------------------------------------------------------------------
  // Explicit upstream method
  // ---------------------------------------------------------------------------

  if (input.explicitMethodId !== undefined && input.explicitMethodId !== null) {
    if (!isTrainingMethodId(input.explicitMethodId)) {
      return buildFailure(
        input,
        "METHOD_ID_INVALID",
        `Unknown Training Method identifier: ${input.explicitMethodId}.`,
        candidateTrace,
        rejectedMethodIds,
      );
    }

    const explicitMethodId = input.explicitMethodId;

    if (!authorizedMethodIds.has(explicitMethodId)) {
      return buildFailure(
        input,
        "METHOD_MODULE_INCOMPATIBLE",
        `Method ${explicitMethodId} is not authorized for module ${input.moduleId} and role ${input.role}.`,
        candidateTrace,
        rejectedMethodIds,
      );
    }

    if (!isRoleAuthorizedForMethod(explicitMethodId, input.role)) {
      return buildFailure(
        input,
        "METHOD_ROLE_INCOMPATIBLE",
        `Role ${input.role} is not supported by method ${explicitMethodId}.`,
        candidateTrace,
        rejectedMethodIds,
      );
    }

    if (
      !isRoleAuthorizedForModuleMethod(
        input.moduleId,
        explicitMethodId,
        input.role,
      )
    ) {
      return buildFailure(
        input,
        "METHOD_ROLE_INCOMPATIBLE",
        `Role ${input.role} is not authorized for method ${explicitMethodId} inside module ${input.moduleId}.`,
        candidateTrace,
        rejectedMethodIds,
      );
    }

    if (allowedMethodIds !== null && !allowedMethodIds.has(explicitMethodId)) {
      return buildFailure(
        input,
        "METHOD_ALLOWED_SET_EMPTY",
        `Explicit method ${explicitMethodId} is excluded by the current allowed-method restriction.`,
        candidateTrace,
        rejectedMethodIds,
      );
    }

    const method = getTrainingMethodContract(explicitMethodId);

    return {
      ok: true,
      moduleId: input.moduleId,
      role: input.role,
      methodId: explicitMethodId,
      method,
      resolutionSource: "explicit_upstream_method",
      candidates: candidateTrace,
      rejectedMethodIds,
      sourceRuleIds: unique([
        ...(input.sourceRuleIds ?? []),
        ...method.sourceRuleIds,
      ]),
    };
  }

  // ---------------------------------------------------------------------------
  // Deterministic module-role priority
  // ---------------------------------------------------------------------------

  if (input.allowedMethodIds !== undefined && input.allowedMethodIds.length === 0) {
    return buildFailure(
      input,
      "METHOD_ALLOWED_SET_EMPTY",
      "The allowed-method restriction contains no methods.",
      candidateTrace,
      rejectedMethodIds,
    );
  }

  if (candidates.length === 0) {
    return buildFailure(
      input,
      "METHOD_NO_AUTHORIZED_CANDIDATE",
      `No authorized Training Method remains for module ${input.moduleId} and role ${input.role}.`,
      candidateTrace,
      rejectedMethodIds,
    );
  }

  const firstPriority = candidates[0]?.priority;
  const firstPriorityCandidates = candidates.filter(
    (candidate) => candidate.priority === firstPriority,
  );

  if (firstPriorityCandidates.length !== 1) {
    return buildFailure(
      input,
      "METHOD_MULTIPLE_UNRESOLVED_CANDIDATES",
      `Multiple Training Methods share the highest priority for module ${input.moduleId} and role ${input.role}.`,
      candidateTrace,
      rejectedMethodIds,
    );
  }

  const selectedAuthorization = firstPriorityCandidates[0];

  if (selectedAuthorization === undefined) {
    return buildFailure(
      input,
      "METHOD_NO_AUTHORIZED_CANDIDATE",
      `No Training Method could be selected for module ${input.moduleId} and role ${input.role}.`,
      candidateTrace,
      rejectedMethodIds,
    );
  }

  const method = getTrainingMethodContract(selectedAuthorization.methodId);

  return {
    ok: true,
    moduleId: input.moduleId,
    role: input.role,
    methodId: selectedAuthorization.methodId,
    method,
    resolutionSource: "module_role_priority",
    candidates: candidateTrace,
    rejectedMethodIds,
    sourceRuleIds: unique([
      ...(input.sourceRuleIds ?? []),
      ...selectedAuthorization.sourceRuleIds,
      ...method.sourceRuleIds,
    ]),
  };
};
