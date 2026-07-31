/**
 * Combat Athlete System — Prescription Compatibility Validator
 * Version 0.1
 *
 * Validates compatibility between:
 * - Capability Module;
 * - Training Method;
 * - Exercise Role;
 * - explicit exercise prescription capabilities;
 * - available equipment capabilities;
 * - available athlete reference types.
 *
 * This file contains no substitution and no numerical prescription logic.
 */

import type { CapabilityModule, Identifier } from "../types";
import {
  getTrainingMethodContract,
  validateMethodModuleRoleContract,
  type PrescriptionCapabilityRequirement,
  type TrainingMethodId,
} from "./contracts";
import type {
  ExerciseLaterality,
  ExerciseRole,
  IntensityReferenceType,
  IntensityType,
  TempoType,
  VolumeInterpretation,
  VolumeStructure,
} from "./types";

// -----------------------------------------------------------------------------
// Exercise capability contract
// -----------------------------------------------------------------------------

export type ExerciseCapabilityStatus =
  | "documented"
  | "implemented"
  | "experimental"
  | "deprecated"
  | "unsupported";

export type LoadingMode =
  | "bodyweight"
  | "added_external_load"
  | "assisted_bodyweight"
  | "barbell"
  | "dumbbell"
  | "kettlebell"
  | "cable"
  | "machine"
  | "resistance_band"
  | "medicine_ball"
  | "sandbag"
  | "sled"
  | "plate"
  | "rope"
  | "partner_resistance"
  | "impact_equipment"
  | "ergometer"
  | "locomotion_only";

export interface ExercisePrescriptionCapabilities {
  exerciseId: Identifier;
  version: "0.1";
  status: ExerciseCapabilityStatus;

  supportedMethodIds: readonly TrainingMethodId[];
  supportedVolumeStructures: readonly VolumeStructure[];

  supportedIntensityTypes: readonly IntensityType[];
  preferredIntensityTypes: readonly IntensityType[];

  supportedLoadingModes: readonly LoadingMode[];
  supportedTempoTypes: readonly TempoType[];

  laterality: ExerciseLaterality;
  volumeInterpretations: readonly VolumeInterpretation[];

  capabilityTags: readonly PrescriptionCapabilityRequirement[];

  requiredEquipmentCapabilities: readonly Identifier[];
  requiredAthleteReferenceTypes: readonly IntensityReferenceType[];

  requiredInstructionIds: readonly Identifier[];
  requiredStopConditionIds: readonly Identifier[];

  durationEstimationProfileId: Identifier | null;
  substitutionCapabilityTags: readonly string[];

  sourceRuleIds: readonly Identifier[];
}

// -----------------------------------------------------------------------------
// Validation input and result
// -----------------------------------------------------------------------------

export type CompatibilityFailureCode =
  | "METHOD_MODULE_INCOMPATIBLE"
  | "METHOD_ROLE_INCOMPATIBLE"
  | "MODULE_ROLE_INCOMPATIBLE"
  | "EXERCISE_CAPABILITIES_UNSUPPORTED"
  | "EXERCISE_METHOD_UNSUPPORTED"
  | "EXERCISE_VOLUME_STRUCTURE_UNSUPPORTED"
  | "EXERCISE_REQUIRED_CAPABILITY_MISSING"
  | "EXERCISE_INTENSITY_TYPE_UNSUPPORTED"
  | "EXERCISE_TEMPO_UNSUPPORTED"
  | "EXERCISE_LATERALITY_UNRESOLVED"
  | "EXERCISE_VOLUME_INTERPRETATION_UNRESOLVED"
  | "EXERCISE_EQUIPMENT_CAPABILITY_MISSING"
  | "EXERCISE_ATHLETE_REFERENCE_MISSING"
  | "EXERCISE_DURATION_PROFILE_MISSING"
  | "EXERCISE_RULE_SOURCE_MISSING";

export interface CompatibilityIssue {
  code: CompatibilityFailureCode;
  message: string;
  recoverable: boolean;
  sourceRuleIds: readonly Identifier[];
}

export interface ValidateCompatibilityInput {
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;
  capabilities: ExercisePrescriptionCapabilities;

  selectedIntensityType?: IntensityType | null;
  selectedTempoType?: TempoType | null;

  availableEquipmentCapabilities?: readonly Identifier[];
  availableAthleteReferenceTypes?: readonly IntensityReferenceType[];
}

export interface CompatibilityValidationSuccess {
  compatible: true;
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;
  exerciseId: Identifier;
  issues: readonly [];
  sourceRuleIds: readonly Identifier[];
}

export interface CompatibilityValidationFailure {
  compatible: false;
  moduleId: CapabilityModule;
  methodId: TrainingMethodId;
  role: ExerciseRole;
  exerciseId: Identifier;
  issues: readonly CompatibilityIssue[];
  sourceRuleIds: readonly Identifier[];
}

export type CompatibilityValidationResult =
  | CompatibilityValidationSuccess
  | CompatibilityValidationFailure;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const includesAll = <T>(
  availableValues: readonly T[],
  requiredValues: readonly T[],
): boolean =>
  requiredValues.every((requiredValue) =>
    availableValues.includes(requiredValue),
  );

const missingValues = <T>(
  availableValues: readonly T[],
  requiredValues: readonly T[],
): T[] =>
  requiredValues.filter(
    (requiredValue) => !availableValues.includes(requiredValue),
  );

/**
 * Whether this exercise's declared laterality forces a per-side resolution.
 *
 * Exported so the registry's own source builder and this validator share
 * ONE definition: an entry that must resolve a side here is exactly an
 * entry whose prescription must carry that side downstream
 * (`PrescribeExerciseInput.lateralityRequired`). Two copies of this rule
 * would be free to drift apart, and the drift would be silent — an entry
 * could pass compatibility while its resolved volume carried no side.
 */
export const requiresLateralityResolution = (
  capabilities: ExercisePrescriptionCapabilities,
): boolean =>
  capabilities.laterality === "unilateral" ||
  capabilities.laterality === "alternating" ||
  capabilities.laterality === "asymmetrical";

const hasResolvedVolumeInterpretation = (
  capabilities: ExercisePrescriptionCapabilities,
): boolean => {
  if (!requiresLateralityResolution(capabilities)) {
    return capabilities.volumeInterpretations.length > 0;
  }

  return capabilities.volumeInterpretations.some((interpretation) =>
    [
      "repetitions_per_side",
      "alternating_total_repetitions",
      "duration_per_side",
      "distance_per_side",
      "load_per_hand",
      "load_per_side",
    ].includes(interpretation),
  );
};

// -----------------------------------------------------------------------------
// Validator
// -----------------------------------------------------------------------------

export const validateCompatibility = (
  input: ValidateCompatibilityInput,
): CompatibilityValidationResult => {
  const issues: CompatibilityIssue[] = [];
  const methodContract = getTrainingMethodContract(input.methodId);
  const methodModuleRole = validateMethodModuleRoleContract(
    input.moduleId,
    input.methodId,
    input.role,
  );

  if (!methodModuleRole.valid) {
    issues.push({
      code: methodModuleRole.reason,
      message: `Method ${input.methodId} is not valid for module ${input.moduleId} and role ${input.role}.`,
      recoverable: true,
      sourceRuleIds: methodContract.sourceRuleIds,
    });
  }

  if (
    input.capabilities.status === "unsupported" ||
    input.capabilities.status === "deprecated"
  ) {
    issues.push({
      code: "EXERCISE_CAPABILITIES_UNSUPPORTED",
      message: `Exercise ${input.capabilities.exerciseId} has capability status ${input.capabilities.status}.`,
      recoverable: true,
      sourceRuleIds: input.capabilities.sourceRuleIds,
    });
  }

  if (!input.capabilities.supportedMethodIds.includes(input.methodId)) {
    issues.push({
      code: "EXERCISE_METHOD_UNSUPPORTED",
      message: `Exercise ${input.capabilities.exerciseId} does not support method ${input.methodId}.`,
      recoverable: true,
      sourceRuleIds: input.capabilities.sourceRuleIds,
    });
  }

  if (
    !input.capabilities.supportedVolumeStructures.includes(
      methodContract.volumeStructure,
    )
  ) {
    issues.push({
      code: "EXERCISE_VOLUME_STRUCTURE_UNSUPPORTED",
      message: `Exercise ${input.capabilities.exerciseId} does not support volume structure ${methodContract.volumeStructure}.`,
      recoverable: true,
      sourceRuleIds: [
        ...input.capabilities.sourceRuleIds,
        ...methodContract.sourceRuleIds,
      ],
    });
  }

  const missingCapabilityTags = missingValues(
    input.capabilities.capabilityTags,
    methodContract.requiredExerciseCapabilities,
  );

  if (missingCapabilityTags.length > 0) {
    issues.push({
      code: "EXERCISE_REQUIRED_CAPABILITY_MISSING",
      message: `Exercise ${input.capabilities.exerciseId} is missing required capabilities: ${missingCapabilityTags.join(", ")}.`,
      recoverable: true,
      sourceRuleIds: [
        ...input.capabilities.sourceRuleIds,
        ...methodContract.sourceRuleIds,
      ],
    });
  }

  if (
    input.selectedIntensityType !== undefined &&
    input.selectedIntensityType !== null &&
    !input.capabilities.supportedIntensityTypes.includes(
      input.selectedIntensityType,
    )
  ) {
    issues.push({
      code: "EXERCISE_INTENSITY_TYPE_UNSUPPORTED",
      message: `Exercise ${input.capabilities.exerciseId} does not support intensity type ${input.selectedIntensityType}.`,
      recoverable: true,
      sourceRuleIds: input.capabilities.sourceRuleIds,
    });
  }

  if (
    input.selectedTempoType !== undefined &&
    input.selectedTempoType !== null &&
    !input.capabilities.supportedTempoTypes.includes(input.selectedTempoType)
  ) {
    issues.push({
      code: "EXERCISE_TEMPO_UNSUPPORTED",
      message: `Exercise ${input.capabilities.exerciseId} does not support tempo type ${input.selectedTempoType}.`,
      recoverable: true,
      sourceRuleIds: input.capabilities.sourceRuleIds,
    });
  }

  if (
    methodContract.tempoPolicy === "required" &&
    input.capabilities.supportedTempoTypes.length === 0
  ) {
    issues.push({
      code: "EXERCISE_TEMPO_UNSUPPORTED",
      message: `Method ${input.methodId} requires tempo, but exercise ${input.capabilities.exerciseId} supports no tempo type.`,
      recoverable: true,
      sourceRuleIds: [
        ...input.capabilities.sourceRuleIds,
        ...methodContract.sourceRuleIds,
      ],
    });
  }

  if (
    methodContract.requiredExerciseCapabilities.includes(
      "laterality_resolution",
    ) &&
    input.capabilities.laterality === "not_applicable"
  ) {
    issues.push({
      code: "EXERCISE_LATERALITY_UNRESOLVED",
      message: `Method ${input.methodId} requires laterality resolution for exercise ${input.capabilities.exerciseId}.`,
      recoverable: false,
      sourceRuleIds: [
        ...input.capabilities.sourceRuleIds,
        ...methodContract.sourceRuleIds,
      ],
    });
  }

  if (!hasResolvedVolumeInterpretation(input.capabilities)) {
    issues.push({
      code: "EXERCISE_VOLUME_INTERPRETATION_UNRESOLVED",
      message: `Exercise ${input.capabilities.exerciseId} has no compatible volume interpretation for its laterality.`,
      recoverable: false,
      sourceRuleIds: input.capabilities.sourceRuleIds,
    });
  }

  const availableEquipment = input.availableEquipmentCapabilities ?? [];
  const missingEquipment = missingValues(
    availableEquipment,
    input.capabilities.requiredEquipmentCapabilities,
  );

  if (missingEquipment.length > 0) {
    issues.push({
      code: "EXERCISE_EQUIPMENT_CAPABILITY_MISSING",
      message: `Missing equipment capabilities for exercise ${input.capabilities.exerciseId}: ${missingEquipment.join(", ")}.`,
      recoverable: true,
      sourceRuleIds: input.capabilities.sourceRuleIds,
    });
  }

  const availableReferences = input.availableAthleteReferenceTypes ?? [];
  const missingReferences = missingValues(
    availableReferences,
    input.capabilities.requiredAthleteReferenceTypes,
  );

  if (missingReferences.length > 0) {
    issues.push({
      code: "EXERCISE_ATHLETE_REFERENCE_MISSING",
      message: `Missing athlete references for exercise ${input.capabilities.exerciseId}: ${missingReferences.join(", ")}.`,
      recoverable: true,
      sourceRuleIds: input.capabilities.sourceRuleIds,
    });
  }

  if (input.capabilities.durationEstimationProfileId === null) {
    issues.push({
      code: "EXERCISE_DURATION_PROFILE_MISSING",
      message: `Exercise ${input.capabilities.exerciseId} has no duration-estimation profile.`,
      recoverable: false,
      sourceRuleIds: input.capabilities.sourceRuleIds,
    });
  }

  if (input.capabilities.sourceRuleIds.length === 0) {
    issues.push({
      code: "EXERCISE_RULE_SOURCE_MISSING",
      message: `Exercise ${input.capabilities.exerciseId} has no capability source rule.`,
      recoverable: false,
      sourceRuleIds: [],
    });
  }

  const sourceRuleIds = unique([
    ...input.capabilities.sourceRuleIds,
    ...methodContract.sourceRuleIds,
    ...(methodModuleRole.valid
      ? [
          ...methodModuleRole.module.sourceRuleIds,
          ...methodModuleRole.authorization.sourceRuleIds,
        ]
      : []),
  ]);

  if (issues.length > 0) {
    return {
      compatible: false,
      moduleId: input.moduleId,
      methodId: input.methodId,
      role: input.role,
      exerciseId: input.capabilities.exerciseId,
      issues,
      sourceRuleIds,
    };
  }

  return {
    compatible: true,
    moduleId: input.moduleId,
    methodId: input.methodId,
    role: input.role,
    exerciseId: input.capabilities.exerciseId,
    issues: [],
    sourceRuleIds,
  };
};

export const isExerciseCompatibleWithMethod = (
  input: ValidateCompatibilityInput,
): boolean => validateCompatibility(input).compatible;

export const hasAllRequiredExerciseCapabilities = (
  capabilities: ExercisePrescriptionCapabilities,
  methodId: TrainingMethodId,
): boolean =>
  includesAll(
    capabilities.capabilityTags,
    getTrainingMethodContract(methodId).requiredExerciseCapabilities,
  );
