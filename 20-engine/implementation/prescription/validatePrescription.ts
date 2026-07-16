/**
 * Combat Athlete System — Prescription Validator
 * Version 0.1
 *
 * Performs final structural and contractual validation of one resolved
 * exercise prescription.
 *
 * This validator:
 * - reports every detected issue;
 * - never repairs data silently;
 * - checks method/module/role compatibility;
 * - checks required prescription components;
 * - checks traceability and completion status.
 */

import type { CapabilityModule, Identifier } from "../types";
import {
  getTrainingMethodContract,
  validateMethodModuleRoleContract,
  type TrainingMethodId,
} from "./contracts";
import type {
  ExerciseRole,
  PrescriptionInstruction,
  PrescriptionIntensity,
  PrescriptionRest,
  PrescriptionTempo,
  PrescriptionVolume,
  StopCondition,
} from "./types";

// -----------------------------------------------------------------------------
// Validation result
// -----------------------------------------------------------------------------

export type PrescriptionValidationIssueCode =
  | "METHOD_MODULE_ROLE_INCOMPATIBLE"
  | "VOLUME_MISSING"
  | "VOLUME_STATUS_INCOMPLETE"
  | "INTENSITY_MISSING"
  | "INTENSITY_STATUS_INCOMPLETE"
  | "REST_REQUIRED_MISSING"
  | "REST_FORBIDDEN_PRESENT"
  | "REST_STATUS_INCOMPLETE"
  | "TEMPO_REQUIRED_MISSING"
  | "TEMPO_FORBIDDEN_PRESENT"
  | "TEMPO_STATUS_INCOMPLETE"
  | "INSTRUCTIONS_MISSING"
  | "STOP_CONDITIONS_MISSING"
  | "REQUIRED_STOP_CATEGORY_MISSING"
  | "SOURCE_RULES_MISSING"
  | "DUPLICATE_INSTRUCTION_ID"
  | "DUPLICATE_STOP_CONDITION_ID";

export interface PrescriptionValidationIssue {
  code: PrescriptionValidationIssueCode;
  message: string;
  recoverable: boolean;
  sourceRuleIds: readonly Identifier[];
}

export interface ValidatePrescriptionInput {
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;

  volume: PrescriptionVolume | null;
  intensity: PrescriptionIntensity | null;
  rest: PrescriptionRest | null;
  tempo: PrescriptionTempo | null;

  instructions: readonly PrescriptionInstruction[];
  stopConditions: readonly StopCondition[];

  sourceRuleIds: readonly Identifier[];
}

export interface PrescriptionValidationSuccess {
  valid: true;
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;
  issues: readonly [];
  sourceRuleIds: readonly Identifier[];
}

export interface PrescriptionValidationFailure {
  valid: false;
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;
  issues: readonly PrescriptionValidationIssue[];
  sourceRuleIds: readonly Identifier[];
}

export type PrescriptionValidationResult =
  | PrescriptionValidationSuccess
  | PrescriptionValidationFailure;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const findDuplicates = (
  values: readonly Identifier[],
): Identifier[] => {
  const seen = new Set<Identifier>();
  const duplicates = new Set<Identifier>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    } else {
      seen.add(value);
    }
  }

  return [...duplicates];
};

// -----------------------------------------------------------------------------
// Validator
// -----------------------------------------------------------------------------

export const validatePrescription = (
  input: ValidatePrescriptionInput,
): PrescriptionValidationResult => {
  const issues: PrescriptionValidationIssue[] = [];
  const method = getTrainingMethodContract(input.methodId);
  const compatibility = validateMethodModuleRoleContract(
    input.moduleId,
    input.methodId,
    input.role,
  );

  if (!compatibility.valid) {
    issues.push({
      code: "METHOD_MODULE_ROLE_INCOMPATIBLE",
      message: `Method ${input.methodId} is incompatible with module ${input.moduleId} and role ${input.role}.`,
      recoverable: true,
      sourceRuleIds: method.sourceRuleIds,
    });
  }

  if (input.volume === null) {
    issues.push({
      code: "VOLUME_MISSING",
      message: "Resolved prescription has no volume.",
      recoverable: false,
      sourceRuleIds: method.sourceRuleIds,
    });
  }

  if (input.intensity === null) {
    issues.push({
      code: "INTENSITY_MISSING",
      message: "Resolved prescription has no intensity.",
      recoverable: true,
      sourceRuleIds: method.sourceRuleIds,
    });
  } else if (input.intensity.status !== "complete") {
    issues.push({
      code: "INTENSITY_STATUS_INCOMPLETE",
      message: `Intensity status is ${input.intensity.status}.`,
      recoverable: true,
      sourceRuleIds: input.intensity.sourceRuleIds,
    });
  }

  if (method.restPolicy === "required" && input.rest === null) {
    issues.push({
      code: "REST_REQUIRED_MISSING",
      message: `Method ${input.methodId} requires rest.`,
      recoverable: false,
      sourceRuleIds: method.sourceRuleIds,
    });
  }

  if (method.restPolicy === "forbidden" && input.rest !== null) {
    issues.push({
      code: "REST_FORBIDDEN_PRESENT",
      message: `Method ${input.methodId} forbids rest.`,
      recoverable: true,
      sourceRuleIds: method.sourceRuleIds,
    });
  }

  if (input.rest !== null && input.rest.status !== "complete") {
    issues.push({
      code: "REST_STATUS_INCOMPLETE",
      message: `Rest status is ${input.rest.status}.`,
      recoverable: true,
      sourceRuleIds: input.rest.sourceRuleIds,
    });
  }

  if (method.tempoPolicy === "required" && input.tempo === null) {
    issues.push({
      code: "TEMPO_REQUIRED_MISSING",
      message: `Method ${input.methodId} requires tempo.`,
      recoverable: false,
      sourceRuleIds: method.sourceRuleIds,
    });
  }

  if (method.tempoPolicy === "forbidden" && input.tempo !== null) {
    issues.push({
      code: "TEMPO_FORBIDDEN_PRESENT",
      message: `Method ${input.methodId} forbids tempo.`,
      recoverable: true,
      sourceRuleIds: method.sourceRuleIds,
    });
  }

  if (input.tempo !== null && input.tempo.status !== "complete") {
    issues.push({
      code: "TEMPO_STATUS_INCOMPLETE",
      message: `Tempo status is ${input.tempo.status}.`,
      recoverable: true,
      sourceRuleIds: input.tempo.sourceRuleIds,
    });
  }

  if (input.instructions.length === 0) {
    issues.push({
      code: "INSTRUCTIONS_MISSING",
      message: "Resolved prescription contains no instructions.",
      recoverable: true,
      sourceRuleIds: method.sourceRuleIds,
    });
  }

  if (input.stopConditions.length === 0) {
    issues.push({
      code: "STOP_CONDITIONS_MISSING",
      message: "Resolved prescription contains no stop conditions.",
      recoverable: false,
      sourceRuleIds: method.sourceRuleIds,
    });
  }

  const stopConditionCategories = unique(
    input.stopConditions.map((condition) => condition.category),
  );

  const missingStopCategories =
    method.requiredStopConditionCategories.filter(
      (category) => !stopConditionCategories.includes(category),
    );

  if (missingStopCategories.length > 0) {
    issues.push({
      code: "REQUIRED_STOP_CATEGORY_MISSING",
      message: `Missing required stop-condition categories: ${missingStopCategories.join(", ")}.`,
      recoverable: false,
      sourceRuleIds: method.sourceRuleIds,
    });
  }

  const duplicateInstructionIds = findDuplicates(
    input.instructions.map((instruction) => instruction.instructionId),
  );

  if (duplicateInstructionIds.length > 0) {
    issues.push({
      code: "DUPLICATE_INSTRUCTION_ID",
      message: `Duplicate instruction identifiers: ${duplicateInstructionIds.join(", ")}.`,
      recoverable: true,
      sourceRuleIds: input.instructions.map(
        (instruction) => instruction.sourceRuleId,
      ),
    });
  }

  const duplicateStopConditionIds = findDuplicates(
    input.stopConditions.map((condition) => condition.conditionId),
  );

  if (duplicateStopConditionIds.length > 0) {
    issues.push({
      code: "DUPLICATE_STOP_CONDITION_ID",
      message: `Duplicate stop-condition identifiers: ${duplicateStopConditionIds.join(", ")}.`,
      recoverable: true,
      sourceRuleIds: input.stopConditions.flatMap(
        (condition) => condition.sourceRuleIds,
      ),
    });
  }

  const collectedSourceRuleIds = unique([
    ...input.sourceRuleIds,
    ...method.sourceRuleIds,
    ...(input.intensity?.sourceRuleIds ?? []),
    ...(input.rest?.sourceRuleIds ?? []),
    ...(input.tempo?.sourceRuleIds ?? []),
    ...input.instructions.map((instruction) => instruction.sourceRuleId),
    ...input.stopConditions.flatMap(
      (condition) => condition.sourceRuleIds,
    ),
  ]);

  if (collectedSourceRuleIds.length === 0) {
    issues.push({
      code: "SOURCE_RULES_MISSING",
      message: "Resolved prescription contains no source-rule traceability.",
      recoverable: false,
      sourceRuleIds: [],
    });
  }

  if (issues.length > 0) {
    return {
      valid: false,
      moduleId: input.moduleId,
      methodId: input.methodId,
      role: input.role,
      issues,
      sourceRuleIds: collectedSourceRuleIds,
    };
  }

  return {
    valid: true,
    moduleId: input.moduleId,
    methodId: input.methodId,
    role: input.role,
    issues: [],
    sourceRuleIds: collectedSourceRuleIds,
  };
};
