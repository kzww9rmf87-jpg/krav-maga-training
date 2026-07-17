/**
 * Combat Athlete System — Pilot Registry Validators
 * Version 0.1
 *
 * Pure, read-only checks over `EXERCISE_PRESCRIPTION_REGISTRY`. These
 * validators do not run automatically inside `getExercisePrescriptionSource`
 * — they exist so a test (or a future CI check) can assert the whole
 * registry stays internally consistent as it grows, without re-deriving
 * every check by hand for each new entry.
 *
 * `UNRESOLVED_DURATION_PROFILE` is expected to fire for every pilot
 * exercise today (see `durationEstimationProfiles.ts`) — it is a
 * reporting signal, not evidence the registry is broken.
 */

import type { Identifier } from "../types";
import { getTrainingMethodContract } from "./contracts";
import { findUnknownEquipmentCapabilities } from "./equipmentCapabilities";
import { isKnownAthleteReferenceType } from "./athleteReferenceCatalog";
import { getDurationEstimationProfile } from "./durationEstimationProfiles";
import { findNonConformingSourceRuleIds } from "./sourceRuleIdentifiers";
import { EXERCISE_PRESCRIPTION_REGISTRY, type ExercisePrescriptionRegistryEntry } from "./exercisePrescriptionRegistry";

export type RegistryIssueCode =
  | "UNKNOWN_EQUIPMENT_CAPABILITY"
  | "UNKNOWN_ATHLETE_REFERENCE"
  | "UNKNOWN_DURATION_PROFILE"
  | "UNRESOLVED_DURATION_PROFILE"
  | "DUPLICATE_IDENTIFIER"
  | "EMPTY_SOURCE_RULE_ID"
  | "INCOHERENT_CAPABILITY_TAG"
  | "IMPOSSIBLE_METHOD_STRUCTURE_EQUIPMENT_COMBINATION";

export interface RegistryIssue {
  code: RegistryIssueCode;
  exerciseId: Identifier;
  message: string;
}

/** Every check confined to a single entry — no cross-entry duplicate check here (see `validatePilotRegistry`). */
export function validateRegistryEntry(entry: ExercisePrescriptionRegistryEntry): RegistryIssue[] {
  const issues: RegistryIssue[] = [];
  const exerciseId = entry.exerciseId;

  for (const capability of findUnknownEquipmentCapabilities(entry.capabilities.requiredEquipmentCapabilities)) {
    issues.push({
      code: "UNKNOWN_EQUIPMENT_CAPABILITY",
      exerciseId,
      message: `Equipment capability "${capability}" is not part of the canonical vocabulary.`,
    });
  }

  for (const referenceType of entry.capabilities.requiredAthleteReferenceTypes) {
    if (!isKnownAthleteReferenceType(referenceType)) {
      issues.push({
        code: "UNKNOWN_ATHLETE_REFERENCE",
        exerciseId,
        message: `Athlete reference type "${referenceType}" is not a known IntensityReferenceType.`,
      });
    }
  }

  const durationProfileId = entry.capabilities.durationEstimationProfileId;
  if (durationProfileId === null) {
    issues.push({
      code: "UNKNOWN_DURATION_PROFILE",
      exerciseId,
      message: "durationEstimationProfileId is null.",
    });
  } else {
    const durationResult = getDurationEstimationProfile(durationProfileId);
    if (!durationResult.ok) {
      issues.push({
        code: durationResult.failureCode === "DURATION_PROFILE_NOT_FOUND" ? "UNKNOWN_DURATION_PROFILE" : "UNRESOLVED_DURATION_PROFILE",
        exerciseId,
        message:
          durationResult.failureCode === "DURATION_PROFILE_NOT_FOUND"
            ? `Duration profile "${durationProfileId}" does not exist in DURATION_ESTIMATION_PROFILES.`
            : `Duration profile "${durationProfileId}" is not resolved and must not be treated as usable timing data.`,
      });
    }
  }

  if (entry.sourceRuleIds.length === 0) {
    issues.push({ code: "EMPTY_SOURCE_RULE_ID", exerciseId, message: "sourceRuleIds is empty." });
  }
  for (const nonConforming of findNonConformingSourceRuleIds(entry.sourceRuleIds)) {
    issues.push({
      code: "EMPTY_SOURCE_RULE_ID",
      exerciseId,
      message: `Source rule id "${nonConforming}" is empty or does not match a known convention.`,
    });
  }

  const method = getTrainingMethodContract(entry.explicitMethodId);
  const actualTags = new Set(entry.capabilities.capabilityTags);
  for (const requiredTag of method.requiredExerciseCapabilities) {
    if (!actualTags.has(requiredTag)) {
      issues.push({
        code: "INCOHERENT_CAPABILITY_TAG",
        exerciseId,
        message: `Method "${entry.explicitMethodId}" requires capability tag "${requiredTag}", but the entry does not declare it.`,
      });
    }
  }

  if (!entry.capabilities.supportedMethodIds.includes(entry.explicitMethodId)) {
    issues.push({
      code: "IMPOSSIBLE_METHOD_STRUCTURE_EQUIPMENT_COMBINATION",
      exerciseId,
      message: `explicitMethodId "${entry.explicitMethodId}" is not declared in supportedMethodIds.`,
    });
  }
  if (!entry.capabilities.supportedVolumeStructures.includes(method.volumeStructure)) {
    issues.push({
      code: "IMPOSSIBLE_METHOD_STRUCTURE_EQUIPMENT_COMBINATION",
      exerciseId,
      message: `Method "${entry.explicitMethodId}" requires volume structure "${method.volumeStructure}", which is not in supportedVolumeStructures.`,
    });
  }
  if (entry.capabilities.requiredEquipmentCapabilities.length === 0 && entry.capabilities.supportedLoadingModes.every((mode) => mode !== "bodyweight")) {
    issues.push({
      code: "IMPOSSIBLE_METHOD_STRUCTURE_EQUIPMENT_COMBINATION",
      exerciseId,
      message: "No required equipment capability is declared, but no loading mode is \"bodyweight\" either.",
    });
  }

  return issues;
}

/** `validateRegistryEntry` for every pilot exercise, plus a registry-wide duplicate-identifier check. */
export function validatePilotRegistry(): readonly RegistryIssue[] {
  const issues: RegistryIssue[] = [];
  const seenInstructionIds = new Map<Identifier, Identifier>();
  const seenStopConditionIds = new Map<Identifier, Identifier>();

  for (const entry of Object.values(EXERCISE_PRESCRIPTION_REGISTRY)) {
    issues.push(...validateRegistryEntry(entry));

    for (const instruction of entry.instructionDefinitions) {
      const owner = seenInstructionIds.get(instruction.instructionId);
      if (owner !== undefined) {
        issues.push({
          code: "DUPLICATE_IDENTIFIER",
          exerciseId: entry.exerciseId,
          message: `Instruction id "${instruction.instructionId}" is already used by exercise "${owner}".`,
        });
      } else {
        seenInstructionIds.set(instruction.instructionId, entry.exerciseId);
      }
    }

    for (const stopCondition of entry.stopConditionDefinitions) {
      const owner = seenStopConditionIds.get(stopCondition.conditionId);
      if (owner !== undefined) {
        issues.push({
          code: "DUPLICATE_IDENTIFIER",
          exerciseId: entry.exerciseId,
          message: `Stop-condition id "${stopCondition.conditionId}" is already used by exercise "${owner}".`,
        });
      } else {
        seenStopConditionIds.set(stopCondition.conditionId, entry.exerciseId);
      }
    }
  }

  return issues;
}
