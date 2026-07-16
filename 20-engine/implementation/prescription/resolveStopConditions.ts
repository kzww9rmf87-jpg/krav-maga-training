/**
 * Combat Athlete System — Stop Condition Resolver
 * Version 0.1
 *
 * Deterministically assembles exercise stop conditions from:
 * - Training Method requirements;
 * - exact exercise capability requirements;
 * - explicit documented stop-condition definitions.
 *
 * No generic safety condition is invented.
 */

import type { Identifier } from "../types";
import {
  getTrainingMethodContract,
  type TrainingMethodId,
} from "./contracts";
import type {
  StopCondition,
  StopConditionAction,
  StopConditionCategory,
  StopConditionInstruction,
  StopConditionPriority,
  StopConditionRecoverability,
  StopConditionScope,
  StopConditionThreshold,
  StopConditionTrigger,
} from "./types";

// -----------------------------------------------------------------------------
// Results
// -----------------------------------------------------------------------------

export type StopConditionResolutionFailureCode =
  | "REQUIRED_STOP_CONDITION_MISSING"
  | "STOP_CONDITION_IDENTIFIER_INVALID"
  | "STOP_CONDITION_CATEGORY_MISSING"
  | "STOP_CONDITION_RULE_SOURCE_MISSING";

export interface StopConditionDefinition {
  conditionId: Identifier;
  category: StopConditionCategory;
  scope: StopConditionScope;
  trigger: StopConditionTrigger;
  threshold: StopConditionThreshold | null;
  action: StopConditionAction;
  priority: StopConditionPriority;
  recoverability: StopConditionRecoverability;
  instructions: readonly StopConditionInstruction[];
  sourceRuleIds: readonly Identifier[];
}

export interface ResolveStopConditionsInput {
  methodId: TrainingMethodId;
  requiredExerciseStopConditionIds: readonly Identifier[];
  optionalStopConditionIds?: readonly Identifier[];
  definitions: readonly StopConditionDefinition[];
  sourceRuleIds?: readonly Identifier[];
}

export interface StopConditionResolutionSuccess {
  ok: true;
  stopConditions: readonly StopCondition[];
  resolvedStopConditionIds: readonly Identifier[];
  omittedOptionalStopConditionIds: readonly Identifier[];
  sourceRuleIds: readonly Identifier[];
}

export interface StopConditionResolutionFailure {
  ok: false;
  failureCode: StopConditionResolutionFailureCode;
  message: string;
  missingStopConditionIds: readonly Identifier[];
  missingCategories: readonly StopConditionCategory[];
  invalidStopConditionIds: readonly Identifier[];
  sourceRuleIds: readonly Identifier[];
}

export type StopConditionResolutionResult =
  | StopConditionResolutionSuccess
  | StopConditionResolutionFailure;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const isValidIdentifier = (value: unknown): value is Identifier =>
  typeof value === "string" && value.trim().length > 0;

const priorityRank: Readonly<Record<StopConditionPriority, number>> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const buildFailure = (
  input: ResolveStopConditionsInput,
  failureCode: StopConditionResolutionFailureCode,
  message: string,
  missingStopConditionIds: readonly Identifier[] = [],
  missingCategories: readonly StopConditionCategory[] = [],
  invalidStopConditionIds: readonly Identifier[] = [],
): StopConditionResolutionFailure => ({
  ok: false,
  failureCode,
  message,
  missingStopConditionIds,
  missingCategories,
  invalidStopConditionIds,
  sourceRuleIds: unique([
    ...(input.sourceRuleIds ?? []),
    ...input.definitions.flatMap((definition) => definition.sourceRuleIds),
    ...getTrainingMethodContract(input.methodId).sourceRuleIds,
  ]),
});

const toStopCondition = (
  definition: StopConditionDefinition,
): StopCondition => ({
  conditionId: definition.conditionId,
  category: definition.category,
  scope: definition.scope,
  trigger: definition.trigger,
  threshold: definition.threshold,
  action: definition.action,
  priority: definition.priority,
  recoverability: definition.recoverability,
  instructions: [...definition.instructions],
  sourceRuleIds: [...definition.sourceRuleIds],
});

// -----------------------------------------------------------------------------
// Resolver
// -----------------------------------------------------------------------------

export const resolveStopConditions = (
  input: ResolveStopConditionsInput,
): StopConditionResolutionResult => {
  const method = getTrainingMethodContract(input.methodId);

  const requiredIds = unique(input.requiredExerciseStopConditionIds);
  const optionalIds = unique(input.optionalStopConditionIds ?? []);
  const allRequestedIds = unique([...requiredIds, ...optionalIds]);

  const invalidRequestedIds = allRequestedIds.filter(
    (conditionId) => !isValidIdentifier(conditionId),
  );

  if (invalidRequestedIds.length > 0) {
    return buildFailure(
      input,
      "STOP_CONDITION_IDENTIFIER_INVALID",
      "One or more requested stop-condition identifiers are invalid.",
      [],
      [],
      invalidRequestedIds,
    );
  }

  const invalidDefinitionIds = input.definitions
    .map((definition) => definition.conditionId)
    .filter((conditionId) => !isValidIdentifier(conditionId));

  if (invalidDefinitionIds.length > 0) {
    return buildFailure(
      input,
      "STOP_CONDITION_IDENTIFIER_INVALID",
      "One or more stop-condition definitions contain an invalid identifier.",
      [],
      [],
      invalidDefinitionIds,
    );
  }

  const definitionsWithoutSource = input.definitions.filter(
    (definition) =>
      definition.sourceRuleIds.length === 0 ||
      definition.sourceRuleIds.some(
        (sourceRuleId) => !isValidIdentifier(sourceRuleId),
      ),
  );

  if (definitionsWithoutSource.length > 0) {
    return buildFailure(
      input,
      "STOP_CONDITION_RULE_SOURCE_MISSING",
      `Stop conditions without valid source rules: ${definitionsWithoutSource
        .map((definition) => definition.conditionId)
        .join(", ")}.`,
    );
  }

  const definitionsById = new Map<Identifier, StopConditionDefinition>();

  for (const definition of input.definitions) {
    if (!definitionsById.has(definition.conditionId)) {
      definitionsById.set(definition.conditionId, definition);
    }
  }

  const missingRequiredIds = requiredIds.filter(
    (conditionId) => !definitionsById.has(conditionId),
  );

  if (missingRequiredIds.length > 0) {
    return buildFailure(
      input,
      "REQUIRED_STOP_CONDITION_MISSING",
      `Missing required exercise stop conditions: ${missingRequiredIds.join(", ")}.`,
      missingRequiredIds,
    );
  }

  const selectedDefinitions = allRequestedIds
    .map((conditionId) => definitionsById.get(conditionId) ?? null)
    .filter(
      (definition): definition is StopConditionDefinition =>
        definition !== null,
    );

  const selectedCategories = unique(
    selectedDefinitions.map((definition) => definition.category),
  );

  const missingMethodCategories =
    method.requiredStopConditionCategories.filter(
      (category) => !selectedCategories.includes(category),
    );

  if (missingMethodCategories.length > 0) {
    return buildFailure(
      input,
      "STOP_CONDITION_CATEGORY_MISSING",
      `Method ${input.methodId} requires missing stop-condition categories: ${missingMethodCategories.join(", ")}.`,
      [],
      missingMethodCategories,
    );
  }

  const orderedDefinitions = [...selectedDefinitions].sort((left, right) => {
    const priorityDifference =
      priorityRank[left.priority] - priorityRank[right.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return (
      allRequestedIds.indexOf(left.conditionId) -
      allRequestedIds.indexOf(right.conditionId)
    );
  });

  const stopConditions = orderedDefinitions.map(toStopCondition);
  const resolvedStopConditionIds = stopConditions.map(
    (condition) => condition.conditionId,
  );
  const omittedOptionalStopConditionIds = optionalIds.filter(
    (conditionId) => !resolvedStopConditionIds.includes(conditionId),
  );

  const sourceRuleIds = unique([
    ...(input.sourceRuleIds ?? []),
    ...method.sourceRuleIds,
    ...orderedDefinitions.flatMap(
      (definition) => definition.sourceRuleIds,
    ),
  ]);

  return {
    ok: true,
    stopConditions,
    resolvedStopConditionIds,
    omittedOptionalStopConditionIds,
    sourceRuleIds,
  };
};
