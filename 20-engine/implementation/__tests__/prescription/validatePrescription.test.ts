import { describe, expect, test } from "vitest";

import { validatePrescription } from "../../prescription/validatePrescription";
import { resolveVolume } from "../../prescription/resolveVolume";
import { resolveIntensity } from "../../prescription/resolveIntensity";
import { resolveRest } from "../../prescription/resolveRest";
import { resolveTempo } from "../../prescription/resolveTempo";
import { resolveInstructions } from "../../prescription/resolveInstructions";
import { resolveStopConditions } from "../../prescription/resolveStopConditions";
import {
  makeInstructionDefinitions,
  makeOneRepMaxReference,
  makeStopConditionDefinitions,
  REQUIRED_INSTRUCTION_IDS,
  REQUIRED_STOP_CONDITION_IDS,
} from "./fixtures";

/**
 * Builds a real, fully-resolved strength/straight_sets_repetitions/primary
 * prescription by running the actual upstream resolvers, so this file never
 * hand-invents a "valid-looking" volume/intensity/rest/tempo object.
 */
function resolveCompleteStrengthPrimaryPrescription() {
  const moduleId = "strength" as const;
  const methodId = "straight_sets_repetitions" as const;
  const role = "primary" as const;
  const rangeContext = "normal" as const;

  const volume = resolveVolume({ moduleId, methodId, role, rangeContext });
  const intensity = resolveIntensity({
    moduleId,
    methodId,
    role,
    rangeContext,
    supportedIntensityTypes: ["percentage_1rm", "rpe", "rir"],
    athleteReferences: [makeOneRepMaxReference()],
  });
  const rest = resolveRest({ moduleId, methodId, role, rangeContext });
  const tempo = resolveTempo({
    moduleId,
    methodId,
    role,
    rangeContext,
    supportedTempoTypes: ["phase_intent"],
  });
  const instructions = resolveInstructions({
    requiredInstructionIds: [...REQUIRED_INSTRUCTION_IDS],
    definitions: makeInstructionDefinitions(),
  });
  const stopConditions = resolveStopConditions({
    methodId,
    requiredExerciseStopConditionIds: [...REQUIRED_STOP_CONDITION_IDS],
    definitions: makeStopConditionDefinitions(),
  });

  if (!volume.ok || !intensity.ok || !rest.ok || !tempo.ok || !instructions.ok || !stopConditions.ok) {
    throw new Error("Fixture setup failed: one of the upstream resolvers did not succeed.");
  }

  return {
    moduleId,
    methodId,
    role,
    volume: volume.volume,
    intensity: intensity.intensity,
    rest: rest.rest,
    tempo: tempo.tempo,
    instructions: instructions.instructions,
    stopConditions: stopConditions.stopConditions,
    sourceRuleIds: ["25_PRESCRIPTION_RULES_TEST"],
  };
}

describe("validatePrescription", () => {
  test("validates a fully resolved, documented-compatible prescription with no issues", () => {
    const input = resolveCompleteStrengthPrimaryPrescription();
    const result = validatePrescription(input);

    if (!result.valid) {
      throw new Error(`Expected validation to succeed, got issues: ${JSON.stringify(result.issues)}`);
    }

    expect(result.issues).toEqual([]);
  });

  test("fails safely when volume is missing", () => {
    const input = { ...resolveCompleteStrengthPrimaryPrescription(), volume: null };
    const result = validatePrescription(input);

    if (result.valid) {
      throw new Error("Expected validation to fail when volume is missing.");
    }

    expect(result.issues.some((issue) => issue.code === "VOLUME_MISSING")).toBe(true);
  });

  test("fails safely when instructions are missing", () => {
    const input = { ...resolveCompleteStrengthPrimaryPrescription(), instructions: [] };
    const result = validatePrescription(input);

    if (result.valid) {
      throw new Error("Expected validation to fail when instructions are missing.");
    }

    expect(result.issues.some((issue) => issue.code === "INSTRUCTIONS_MISSING")).toBe(true);
  });

  test("fails safely when stop conditions are missing", () => {
    const input = { ...resolveCompleteStrengthPrimaryPrescription(), stopConditions: [] };
    const result = validatePrescription(input);

    if (result.valid) {
      throw new Error("Expected validation to fail when stop conditions are missing.");
    }

    expect(result.issues.some((issue) => issue.code === "STOP_CONDITIONS_MISSING")).toBe(true);
    expect(result.issues.some((issue) => issue.code === "REQUIRED_STOP_CATEGORY_MISSING")).toBe(true);
  });

  test("fails safely when a method-required stop-condition category is absent", () => {
    const base = resolveCompleteStrengthPrimaryPrescription();
    const input = {
      ...base,
      stopConditions: base.stopConditions.filter((condition) => condition.category !== "pain"),
    };
    const result = validatePrescription(input);

    if (result.valid) {
      throw new Error("Expected validation to fail when the 'pain' stop-condition category is absent.");
    }

    expect(result.issues.some((issue) => issue.code === "REQUIRED_STOP_CATEGORY_MISSING")).toBe(true);
  });

  test("fails safely on a method/module/role triple the contract does not authorize", () => {
    const base = resolveCompleteStrengthPrimaryPrescription();
    const input = { ...base, role: "conditioning" as const };
    const result = validatePrescription(input);

    if (result.valid) {
      throw new Error("Expected validation to fail for an unauthorized method/module/role triple.");
    }

    expect(result.issues.some((issue) => issue.code === "METHOD_MODULE_ROLE_INCOMPATIBLE")).toBe(true);
  });

  test("detects duplicate instruction identifiers", () => {
    const base = resolveCompleteStrengthPrimaryPrescription();
    const input = {
      ...base,
      instructions: [...base.instructions, base.instructions[0]],
    };
    const result = validatePrescription(input);

    if (result.valid) {
      throw new Error("Expected validation to fail for duplicate instruction identifiers.");
    }

    expect(result.issues.some((issue) => issue.code === "DUPLICATE_INSTRUCTION_ID")).toBe(true);
  });

  test("determinism: identical input produces an identical result", () => {
    const input = resolveCompleteStrengthPrimaryPrescription();

    expect(validatePrescription(input)).toEqual(validatePrescription(input));
  });

  test("does not mutate its input", () => {
    const input = resolveCompleteStrengthPrimaryPrescription();
    const snapshot = JSON.parse(JSON.stringify(input));

    validatePrescription(input);

    expect(input).toEqual(snapshot);
  });
});
