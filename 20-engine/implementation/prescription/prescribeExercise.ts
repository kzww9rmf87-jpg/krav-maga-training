/**
 * Combat Athlete System — Exercise Prescriber
 * Version 0.1
 *
 * Orchestrates the deterministic prescription pipeline for one selected
 * exercise.
 *
 * Resolution order:
 * 1. Training Method
 * 2. Method / exercise compatibility
 * 3. Volume
 * 4. Intensity
 * 5. Rest
 * 6. Tempo
 * 7. Instructions
 * 8. Stop Conditions
 * 9. Final prescription validation
 *
 * This file contains no hidden fallback and performs no substitution.
 */

import type { CapabilityModule, Identifier } from "../types";
import type {
  TrainingMethodId,
} from "./contracts";
import {
  resolveMethod,
  type MethodResolutionResult,
} from "./resolveMethod";
import {
  validateCompatibility,
  type CompatibilityValidationResult,
  type ExercisePrescriptionCapabilities,
} from "./validateCompatibility";
import {
  resolveVolume,
  type VolumeResolutionResult,
} from "./resolveVolume";
import {
  resolveIntensity,
  type IntensityResolutionResult,
} from "./resolveIntensity";
import {
  resolveRest,
  type RestResolutionResult,
} from "./resolveRest";
import {
  resolveTempo,
  type TempoResolutionResult,
} from "./resolveTempo";
import {
  resolveInstructions,
  type InstructionDefinition,
  type InstructionResolutionResult,
} from "./resolveInstructions";
import {
  resolveStopConditions,
  type StopConditionDefinition,
  type StopConditionResolutionResult,
} from "./resolveStopConditions";
import {
  validatePrescription,
  type PrescriptionValidationResult,
} from "./validatePrescription";
import type {
  ExerciseRole,
  IntensityReference,
  IntensityType,
  PrescriptionInstruction,
  PrescriptionIntensity,
  PrescriptionLaterality,
  PrescriptionRest,
  PrescriptionTempo,
  PrescriptionVolume,
  StopCondition,
  TempoType,
} from "./types";
import type { RangeContext } from "./prescriptionKnowledge";

// -----------------------------------------------------------------------------
// Input
// -----------------------------------------------------------------------------

export interface PrescribeExerciseInput {
  exerciseId: Identifier;
  moduleId: CapabilityModule;
  role: ExerciseRole;
  rangeContext: RangeContext;

  capabilities: ExercisePrescriptionCapabilities;

  explicitMethodId?: string | null;
  allowedMethodIds?: readonly TrainingMethodId[];

  laterality?: PrescriptionLaterality | null;
  lateralityRequired?: boolean;

  supportedIntensityTypes: readonly IntensityType[];
  athleteReferences?: readonly IntensityReference[];
  preferredIntensityType?: IntensityType | null;

  supportedTempoTypes: readonly TempoType[];
  preferredTempoType?: TempoType | null;

  availableEquipmentCapabilities?: readonly Identifier[];
  availableAthleteReferenceTypes?: readonly IntensityReference["referenceType"][];

  instructionDefinitions: readonly InstructionDefinition[];
  optionalInstructionIds?: readonly Identifier[];

  stopConditionDefinitions: readonly StopConditionDefinition[];
  optionalStopConditionIds?: readonly Identifier[];

  loadRounding?: {
    incrementKg: number;
    mode: "nearest" | "down" | "up";
    ruleId: Identifier;
  } | null;

  sourceRuleIds?: readonly Identifier[];
}

// -----------------------------------------------------------------------------
// Output
// -----------------------------------------------------------------------------

export type ExercisePrescriptionFailureStage =
  | "method"
  | "compatibility"
  | "volume"
  | "intensity"
  | "rest"
  | "tempo"
  | "instructions"
  | "stop_conditions"
  | "validation";

export interface ExercisePrescription {
  exerciseId: Identifier;
  moduleId: CapabilityModule;
  role: ExerciseRole;
  methodId: TrainingMethodId;
  volume: PrescriptionVolume;
  intensity: PrescriptionIntensity;
  rest: PrescriptionRest | null;
  tempo: PrescriptionTempo | null;
  instructions: readonly PrescriptionInstruction[];
  stopConditions: readonly StopCondition[];
  sourceRuleIds: readonly Identifier[];
  status: "complete";
}

/**
 * The full per-stage resolver trace for one exercise, in pipeline order.
 * Every field is exactly the result object its own resolver already
 * returns — nothing here is summarized, recomputed or reshaped.
 *
 * Named explicitly (rather than left as an inline object type) so a future
 * task can reference it when connecting the prescription layer to
 * `decisionTrace.ts` / `21_DECISION_TRACE.md`, without duplicating or
 * restating its shape. That connection is not made here: `decisionTrace.ts`
 * is not modified, and this trace is not wired into `runEngine`.
 */
export interface ExercisePrescriptionTrace {
  method: MethodResolutionResult;
  compatibility: CompatibilityValidationResult;
  volume: VolumeResolutionResult;
  intensity: IntensityResolutionResult;
  rest: RestResolutionResult;
  tempo: TempoResolutionResult;
  instructions: InstructionResolutionResult;
  stopConditions: StopConditionResolutionResult;
  validation: PrescriptionValidationResult;
}

/** Only the stages actually reached before failure are present. */
export type ExercisePrescriptionFailureTrace = Partial<ExercisePrescriptionTrace>;

export interface PrescribeExerciseSuccess {
  ok: true;
  prescription: ExercisePrescription;
  trace: ExercisePrescriptionTrace;
}

export interface PrescribeExerciseFailure {
  ok: false;
  exerciseId: Identifier;
  moduleId: CapabilityModule;
  role: ExerciseRole;
  failureStage: ExercisePrescriptionFailureStage;
  message: string;
  trace: ExercisePrescriptionFailureTrace;
}

export type PrescribeExerciseResult =
  | PrescribeExerciseSuccess
  | PrescribeExerciseFailure;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

const fail = (
  input: PrescribeExerciseInput,
  failureStage: ExercisePrescriptionFailureStage,
  message: string,
  trace: PrescribeExerciseFailure["trace"],
): PrescribeExerciseFailure => ({
  ok: false,
  exerciseId: input.exerciseId,
  moduleId: input.moduleId,
  role: input.role,
  failureStage,
  message,
  trace,
});

// -----------------------------------------------------------------------------
// Orchestrator
// -----------------------------------------------------------------------------

export const prescribeExercise = (
  input: PrescribeExerciseInput,
): PrescribeExerciseResult => {
  const method = resolveMethod({
    moduleId: input.moduleId,
    role: input.role,
    explicitMethodId: input.explicitMethodId,
    allowedMethodIds: input.allowedMethodIds,
    sourceRuleIds: input.sourceRuleIds,
  });

  if (!method.ok) {
    return fail(
      input,
      "method",
      method.message,
      { method },
    );
  }

  const compatibility = validateCompatibility({
    moduleId: input.moduleId,
    methodId: method.methodId,
    role: input.role,
    capabilities: input.capabilities,
    selectedIntensityType: input.preferredIntensityType,
    selectedTempoType: input.preferredTempoType,
    availableEquipmentCapabilities:
      input.availableEquipmentCapabilities,
    availableAthleteReferenceTypes:
      input.availableAthleteReferenceTypes,
  });

  if (!compatibility.compatible) {
    return fail(
      input,
      "compatibility",
      compatibility.issues.map((issue) => issue.message).join(" | "),
      { method, compatibility },
    );
  }

  const volume = resolveVolume({
    moduleId: input.moduleId,
    methodId: method.methodId,
    role: input.role,
    rangeContext: input.rangeContext,
    laterality: input.laterality,
    lateralityRequired: input.lateralityRequired,
    sourceRuleIds: [
      ...(input.sourceRuleIds ?? []),
      ...method.sourceRuleIds,
      ...compatibility.sourceRuleIds,
    ],
  });

  if (!volume.ok) {
    return fail(
      input,
      "volume",
      volume.message,
      { method, compatibility, volume },
    );
  }

  const intensity = resolveIntensity({
    moduleId: input.moduleId,
    methodId: method.methodId,
    role: input.role,
    rangeContext: input.rangeContext,
    supportedIntensityTypes: input.supportedIntensityTypes,
    athleteReferences: input.athleteReferences,
    preferredIntensityType: input.preferredIntensityType,
    loadRounding: input.loadRounding,
    sourceRuleIds: [
      ...(input.sourceRuleIds ?? []),
      ...method.sourceRuleIds,
      ...compatibility.sourceRuleIds,
      ...volume.sourceRuleIds,
    ],
  });

  if (!intensity.ok) {
    return fail(
      input,
      "intensity",
      intensity.message,
      { method, compatibility, volume, intensity },
    );
  }

  const rest = resolveRest({
    moduleId: input.moduleId,
    methodId: method.methodId,
    role: input.role,
    rangeContext: input.rangeContext,
    sourceRuleIds: [
      ...(input.sourceRuleIds ?? []),
      ...method.sourceRuleIds,
      ...volume.sourceRuleIds,
      ...intensity.sourceRuleIds,
    ],
  });

  if (!rest.ok) {
    return fail(
      input,
      "rest",
      rest.message,
      { method, compatibility, volume, intensity, rest },
    );
  }

  const tempo = resolveTempo({
    moduleId: input.moduleId,
    methodId: method.methodId,
    role: input.role,
    rangeContext: input.rangeContext,
    supportedTempoTypes: input.supportedTempoTypes,
    preferredTempoType: input.preferredTempoType,
    sourceRuleIds: [
      ...(input.sourceRuleIds ?? []),
      ...method.sourceRuleIds,
      ...volume.sourceRuleIds,
      ...intensity.sourceRuleIds,
      ...rest.sourceRuleIds,
    ],
  });

  if (!tempo.ok) {
    return fail(
      input,
      "tempo",
      tempo.message,
      { method, compatibility, volume, intensity, rest, tempo },
    );
  }

  const instructions = resolveInstructions({
    requiredInstructionIds:
      input.capabilities.requiredInstructionIds,
    optionalInstructionIds: input.optionalInstructionIds,
    definitions: input.instructionDefinitions,
    sourceRuleIds: [
      ...(input.sourceRuleIds ?? []),
      ...compatibility.sourceRuleIds,
    ],
  });

  if (!instructions.ok) {
    return fail(
      input,
      "instructions",
      instructions.message,
      {
        method,
        compatibility,
        volume,
        intensity,
        rest,
        tempo,
        instructions,
      },
    );
  }

  const stopConditions = resolveStopConditions({
    methodId: method.methodId,
    requiredExerciseStopConditionIds:
      input.capabilities.requiredStopConditionIds,
    optionalStopConditionIds: input.optionalStopConditionIds,
    definitions: input.stopConditionDefinitions,
    sourceRuleIds: [
      ...(input.sourceRuleIds ?? []),
      ...compatibility.sourceRuleIds,
    ],
  });

  if (!stopConditions.ok) {
    return fail(
      input,
      "stop_conditions",
      stopConditions.message,
      {
        method,
        compatibility,
        volume,
        intensity,
        rest,
        tempo,
        instructions,
        stopConditions,
      },
    );
  }

  const sourceRuleIds = unique([
    ...(input.sourceRuleIds ?? []),
    ...method.sourceRuleIds,
    ...compatibility.sourceRuleIds,
    ...volume.sourceRuleIds,
    ...intensity.sourceRuleIds,
    ...rest.sourceRuleIds,
    ...tempo.sourceRuleIds,
    ...instructions.sourceRuleIds,
    ...stopConditions.sourceRuleIds,
  ]);

  const validation = validatePrescription({
    moduleId: input.moduleId,
    methodId: method.methodId,
    role: input.role,
    volume: volume.volume,
    intensity: intensity.intensity,
    rest: rest.rest,
    tempo: tempo.tempo,
    instructions: instructions.instructions,
    stopConditions: stopConditions.stopConditions,
    sourceRuleIds,
  });

  if (!validation.valid) {
    return fail(
      input,
      "validation",
      validation.issues.map((issue) => issue.message).join(" | "),
      {
        method,
        compatibility,
        volume,
        intensity,
        rest,
        tempo,
        instructions,
        stopConditions,
        validation,
      },
    );
  }

  return {
    ok: true,
    prescription: {
      exerciseId: input.exerciseId,
      moduleId: input.moduleId,
      role: input.role,
      methodId: method.methodId,
      volume: volume.volume,
      intensity: intensity.intensity,
      rest: rest.rest,
      tempo: tempo.tempo,
      instructions: instructions.instructions,
      stopConditions: stopConditions.stopConditions,
      sourceRuleIds,
      status: "complete",
    },
    trace: {
      method,
      compatibility,
      volume,
      intensity,
      rest,
      tempo,
      instructions,
      stopConditions,
      validation,
    },
  };
};
