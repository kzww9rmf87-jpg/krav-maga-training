/**
 * Combat Athlete System — Instruction Resolver
 * Version 0.1
 *
 * Deterministically assembles the instruction portion of an exercise
 * prescription from explicit documented instruction identifiers.
 *
 * This resolver:
 * - preserves source traceability;
 * - never invents generic coaching cues;
 * - fails safely when required instructions are missing;
 * - removes duplicate identifiers without changing their first-seen order.
 */

import type { Identifier } from "../types";
import type {
  InstructionCategory,
  InstructionPriority,
  PrescriptionInstruction,
} from "./types";

// -----------------------------------------------------------------------------
// Results
// -----------------------------------------------------------------------------

export type InstructionResolutionFailureCode =
  | "REQUIRED_INSTRUCTION_MISSING"
  | "INSTRUCTION_IDENTIFIER_INVALID"
  | "INSTRUCTION_TEXT_MISSING"
  | "INSTRUCTION_RULE_SOURCE_MISSING";

export interface InstructionDefinition {
  instructionId: Identifier;
  text: string;
  category: InstructionCategory;
  priority: InstructionPriority;
  mandatory: boolean;
  sourceRuleId: Identifier;
}

export interface ResolveInstructionsInput {
  requiredInstructionIds: readonly Identifier[];
  optionalInstructionIds?: readonly Identifier[];

  /**
   * Definitions available for the exact exercise and selected method.
   * The resolver does not search external knowledge.
   */
  definitions: readonly InstructionDefinition[];

  sourceRuleIds?: readonly Identifier[];
}

export interface InstructionResolutionSuccess {
  ok: true;
  instructions: readonly PrescriptionInstruction[];
  resolvedInstructionIds: readonly Identifier[];
  omittedOptionalInstructionIds: readonly Identifier[];
  sourceRuleIds: readonly Identifier[];
}

export interface InstructionResolutionFailure {
  ok: false;
  failureCode: InstructionResolutionFailureCode;
  message: string;
  missingInstructionIds: readonly Identifier[];
  invalidInstructionIds: readonly Identifier[];
  sourceRuleIds: readonly Identifier[];
}

export type InstructionResolutionResult =
  | InstructionResolutionSuccess
  | InstructionResolutionFailure;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const isValidIdentifier = (value: unknown): value is Identifier =>
  typeof value === "string" && value.trim().length > 0;

const priorityRank: Readonly<Record<InstructionPriority, number>> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const buildFailure = (
  input: ResolveInstructionsInput,
  failureCode: InstructionResolutionFailureCode,
  message: string,
  missingInstructionIds: readonly Identifier[] = [],
  invalidInstructionIds: readonly Identifier[] = [],
): InstructionResolutionFailure => ({
  ok: false,
  failureCode,
  message,
  missingInstructionIds,
  invalidInstructionIds,
  sourceRuleIds: unique([
    ...(input.sourceRuleIds ?? []),
    ...input.definitions.map((definition) => definition.sourceRuleId),
  ]),
});

const toPrescriptionInstruction = (
  definition: InstructionDefinition,
): PrescriptionInstruction => ({
  instructionId: definition.instructionId,
  text: definition.text,
  category: definition.category,
  priority: definition.priority,
  sourceRuleId: definition.sourceRuleId,
});

// -----------------------------------------------------------------------------
// Resolver
// -----------------------------------------------------------------------------

export const resolveInstructions = (
  input: ResolveInstructionsInput,
): InstructionResolutionResult => {
  const requestedRequiredIds = unique(input.requiredInstructionIds);
  const requestedOptionalIds = unique(input.optionalInstructionIds ?? []);
  const allRequestedIds = unique([
    ...requestedRequiredIds,
    ...requestedOptionalIds,
  ]);

  const invalidRequestedIds = allRequestedIds.filter(
    (instructionId) => !isValidIdentifier(instructionId),
  );

  if (invalidRequestedIds.length > 0) {
    return buildFailure(
      input,
      "INSTRUCTION_IDENTIFIER_INVALID",
      "One or more requested instruction identifiers are empty or invalid.",
      [],
      invalidRequestedIds,
    );
  }

  const invalidDefinitionIds = input.definitions
    .map((definition) => definition.instructionId)
    .filter((instructionId) => !isValidIdentifier(instructionId));

  if (invalidDefinitionIds.length > 0) {
    return buildFailure(
      input,
      "INSTRUCTION_IDENTIFIER_INVALID",
      "One or more instruction definitions contain an invalid identifier.",
      [],
      invalidDefinitionIds,
    );
  }

  const definitionsWithoutSource = input.definitions.filter(
    (definition) => !isValidIdentifier(definition.sourceRuleId),
  );

  if (definitionsWithoutSource.length > 0) {
    return buildFailure(
      input,
      "INSTRUCTION_RULE_SOURCE_MISSING",
      `Instructions without a valid source rule: ${definitionsWithoutSource
        .map((definition) => definition.instructionId)
        .join(", ")}.`,
    );
  }

  const definitionsById = new Map<Identifier, InstructionDefinition>();

  for (const definition of input.definitions) {
    if (!definitionsById.has(definition.instructionId)) {
      definitionsById.set(definition.instructionId, definition);
    }
  }

  const missingRequiredInstructionIds = requestedRequiredIds.filter(
    (instructionId) => !definitionsById.has(instructionId),
  );

  if (missingRequiredInstructionIds.length > 0) {
    return buildFailure(
      input,
      "REQUIRED_INSTRUCTION_MISSING",
      `Missing required instructions: ${missingRequiredInstructionIds.join(", ")}.`,
      missingRequiredInstructionIds,
    );
  }

  const selectedDefinitions = allRequestedIds
    .map((instructionId) => definitionsById.get(instructionId) ?? null)
    .filter(
      (definition): definition is InstructionDefinition =>
        definition !== null,
    );

  const emptyTextDefinitions = selectedDefinitions.filter(
    (definition) => definition.text.trim().length === 0,
  );

  if (emptyTextDefinitions.length > 0) {
    return buildFailure(
      input,
      "INSTRUCTION_TEXT_MISSING",
      `Instructions with missing text: ${emptyTextDefinitions
        .map((definition) => definition.instructionId)
        .join(", ")}.`,
    );
  }

  const orderedDefinitions = [...selectedDefinitions].sort((left, right) => {
    const priorityDifference =
      priorityRank[left.priority] - priorityRank[right.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return (
      allRequestedIds.indexOf(left.instructionId) -
      allRequestedIds.indexOf(right.instructionId)
    );
  });

  const instructions = orderedDefinitions.map(toPrescriptionInstruction);
  const resolvedInstructionIds = instructions.map(
    (instruction) => instruction.instructionId,
  );
  const omittedOptionalInstructionIds = requestedOptionalIds.filter(
    (instructionId) => !resolvedInstructionIds.includes(instructionId),
  );

  const sourceRuleIds = unique([
    ...(input.sourceRuleIds ?? []),
    ...orderedDefinitions.map((definition) => definition.sourceRuleId),
  ]);

  return {
    ok: true,
    instructions,
    resolvedInstructionIds,
    omittedOptionalInstructionIds,
    sourceRuleIds,
  };
};
