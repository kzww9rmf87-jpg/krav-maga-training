/**
 * Combat Athlete System — Prescription Test Fixtures
 *
 * Explicit, minimal, readable factories for the prescription layer's test
 * suite. No `any`, no random data, every default is grounded in a real
 * documented numerical profile (`strength_primary_straight_sets_v0_1`)
 * verified against `34_NUMERICAL_PRESCRIPTION_TABLES.md`.
 */

import type { InstructionDefinition } from "../../prescription/resolveInstructions";
import type { StopConditionDefinition } from "../../prescription/resolveStopConditions";
import type {
  ExerciseCapabilityStatus,
  ExercisePrescriptionCapabilities,
} from "../../prescription/validateCompatibility";
import type { PrescribeExerciseInput } from "../../prescription/prescribeExercise";
import type { IntensityReference } from "../../prescription/types";

// -----------------------------------------------------------------------------
// Athlete references
// -----------------------------------------------------------------------------

export function makeOneRepMaxReference(
  overrides: Partial<IntensityReference> = {},
): IntensityReference {
  return {
    referenceType: "one_rep_max",
    value: 100,
    unit: "kilograms",
    sourceId: "athlete-ref-1rm",
    measuredAt: null,
    validUntil: null,
    confidence: "validated",
    ...overrides,
  };
}

// -----------------------------------------------------------------------------
// Instruction and stop-condition definitions
// -----------------------------------------------------------------------------

export const REQUIRED_INSTRUCTION_IDS = ["instr-setup", "instr-safety", "instr-execution"] as const;

export function makeInstructionDefinitions(): InstructionDefinition[] {
  return [
    {
      instructionId: "instr-setup",
      text: "Set the safety pins at bar-catching height before beginning.",
      category: "setup",
      priority: "high",
      mandatory: true,
      sourceRuleId: "25_PRESCRIPTION_RULES_TEST",
    },
    {
      instructionId: "instr-safety",
      text: "Stop immediately if sharp or radiating pain occurs.",
      category: "safety",
      priority: "critical",
      mandatory: true,
      sourceRuleId: "25_PRESCRIPTION_RULES_TEST",
    },
    {
      instructionId: "instr-execution",
      text: "Brace before each repetition and maintain a neutral spine.",
      category: "execution",
      priority: "medium",
      mandatory: false,
      sourceRuleId: "25_PRESCRIPTION_RULES_TEST",
    },
  ];
}

/** Covers the 3 stop-condition categories required by `straight_sets_repetitions`: technical_failure, pain, completion. */
export const REQUIRED_STOP_CONDITION_IDS = ["stop-technical-failure", "stop-pain", "stop-completion"] as const;

export function makeStopConditionDefinitions(): StopConditionDefinition[] {
  return [
    {
      conditionId: "stop-technical-failure",
      category: "technical_failure",
      scope: "set",
      trigger: {
        type: "technical_breakdown",
        metric: null,
        operator: "detected",
        expectedValue: null,
        unit: null,
        evaluationTiming: "during_set",
      },
      threshold: null,
      action: "end_set",
      priority: "high",
      recoverability: "recoverable_same_exercise",
      instructions: [],
      sourceRuleIds: ["28_STOP_CONDITIONS_TEST"],
    },
    {
      conditionId: "stop-pain",
      category: "pain",
      scope: "exercise",
      trigger: {
        type: "pain_report",
        metric: null,
        operator: "detected",
        expectedValue: null,
        unit: null,
        evaluationTiming: "continuous",
      },
      threshold: null,
      action: "stop_exercise",
      priority: "critical",
      recoverability: "not_recoverable",
      instructions: [],
      sourceRuleIds: ["28_STOP_CONDITIONS_TEST"],
    },
    {
      conditionId: "stop-completion",
      category: "completion",
      scope: "exercise",
      trigger: {
        type: "planned_work_completed",
        metric: null,
        operator: "detected",
        expectedValue: null,
        unit: null,
        evaluationTiming: "after_set",
      },
      threshold: null,
      action: "stop_exercise",
      priority: "low",
      recoverability: "not_recoverable",
      instructions: [],
      sourceRuleIds: ["28_STOP_CONDITIONS_TEST"],
    },
  ];
}

// -----------------------------------------------------------------------------
// Exercise prescription capabilities
// -----------------------------------------------------------------------------

/**
 * Fully compatible with `strength_primary_straight_sets_v0_1`
 * (module "strength", method "straight_sets_repetitions", role "primary").
 */
export function makeCapabilities(
  overrides: Partial<ExercisePrescriptionCapabilities> = {},
): ExercisePrescriptionCapabilities {
  return {
    exerciseId: "exercise-1",
    version: "0.1",
    status: "documented",
    supportedMethodIds: ["straight_sets_repetitions"],
    supportedVolumeStructures: ["sets_reps"],
    supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
    preferredIntensityTypes: ["percentage_1rm"],
    supportedLoadingModes: ["barbell"],
    supportedTempoTypes: ["phase_intent", "global_intent"],
    laterality: "bilateral",
    volumeInterpretations: ["total_repetitions"],
    capabilityTags: ["countable_repetitions", "technical_quality_observation"],
    requiredEquipmentCapabilities: [],
    requiredAthleteReferenceTypes: [],
    requiredInstructionIds: [...REQUIRED_INSTRUCTION_IDS],
    requiredStopConditionIds: [...REQUIRED_STOP_CONDITION_IDS],
    durationEstimationProfileId: "duration-profile-1",
    substitutionCapabilityTags: [],
    sourceRuleIds: ["33_EXERCISE_PRESCRIPTION_CAPABILITIES_TEST"],
    ...overrides,
  };
}

export const UNSUPPORTED_CAPABILITY_STATUS: ExerciseCapabilityStatus = "unsupported";

// -----------------------------------------------------------------------------
// prescribeExercise input
// -----------------------------------------------------------------------------

/** A complete, documented-compatible happy-path input for `prescribeExercise`. */
export function makePrescribeExerciseInput(
  overrides: Partial<PrescribeExerciseInput> = {},
): PrescribeExerciseInput {
  return {
    exerciseId: "exercise-1",
    moduleId: "strength",
    role: "primary",
    rangeContext: "normal",
    capabilities: makeCapabilities(),
    supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
    athleteReferences: [makeOneRepMaxReference()],
    supportedTempoTypes: ["phase_intent", "global_intent"],
    instructionDefinitions: makeInstructionDefinitions(),
    stopConditionDefinitions: makeStopConditionDefinitions(),
    ...overrides,
  };
}
