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
import {
  NUMERICAL_PRESCRIPTION_PROFILES,
  getNumericalPrescriptionProfileById,
  isExecutableNumericalProfile,
  resolveNumericalProfile,
} from "./prescriptionKnowledge";
import { findUnknownEquipmentCapabilities } from "./equipmentCapabilities";
import { isKnownAthleteReferenceType } from "./athleteReferenceCatalog";
import { getDurationEstimationProfile } from "./durationEstimationProfiles";
import { findNonConformingSourceRuleIds } from "./sourceRuleIdentifiers";
import type { LoadingMode } from "./validateCompatibility";
import { EXERCISE_PRESCRIPTION_REGISTRY, type ExercisePrescriptionRegistryEntry } from "./exercisePrescriptionRegistry";

export type RegistryIssueCode =
  | "UNKNOWN_EQUIPMENT_CAPABILITY"
  | "UNKNOWN_ATHLETE_REFERENCE"
  | "UNKNOWN_DURATION_PROFILE"
  | "UNRESOLVED_DURATION_PROFILE"
  | "DUPLICATE_IDENTIFIER"
  | "EMPTY_SOURCE_RULE_ID"
  | "INCOHERENT_CAPABILITY_TAG"
  | "IMPOSSIBLE_METHOD_STRUCTURE_EQUIPMENT_COMBINATION"
  | "UNKNOWN_NUMERICAL_PROFILE"
  | "NUMERICAL_PROFILE_TRIPLE_MISMATCH"
  | "AMBIGUOUS_TRIPLE_REQUIRES_EXPLICIT_PROFILE"
  | "NON_EXECUTABLE_NUMERICAL_PROFILE";

export interface RegistryIssue {
  code: RegistryIssueCode;
  exerciseId: Identifier;
  message: string;
}

/**
 * Loading modes the athlete supplies entirely from their own body, needing
 * no implement, machine or external resistance. An entry declaring one of
 * these is legitimately allowed to require no equipment capability at all.
 *
 * This list exists because "requires no equipment" and "is a bodyweight
 * exercise" are not the same statement. The check below originally admitted
 * `bodyweight` alone, which held while every registry entry was either
 * implement-based or bodyweight — but `locomotion_only`, the loading mode
 * 33_EXERCISE_PRESCRIPTION_CAPABILITIES.md documents for its own "Exercise
 * Family 10 — Sprints and Locomotion", is equally self-supplied and would
 * otherwise be reported as an impossible combination. Widening the exemption
 * to a named set keeps the rule's real intent (an entry must not silently
 * omit the equipment it needs) without forcing a sprint entry to claim a
 * `bodyweight` loading mode its own family documentation never gives it.
 *
 * Deliberately NOT included: `assisted_bodyweight` (needs a band, machine or
 * partner) and every implement mode. Membership here is a claim that the
 * mode requires nothing external — not merely that it is unloaded.
 */
const SELF_SUPPLIED_LOADING_MODES: readonly LoadingMode[] = ["bodyweight", "locomotion_only"];

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

  const declaredProfileId = entry.numericalProfileId ?? null;
  const tripleCandidates = NUMERICAL_PRESCRIPTION_PROFILES.filter(
    (profile) =>
      profile.moduleId === entry.moduleId &&
      profile.methodId === entry.explicitMethodId &&
      profile.exerciseRole === entry.role,
  );

  if (declaredProfileId !== null) {
    const declaredProfile = getNumericalPrescriptionProfileById(declaredProfileId);

    if (declaredProfile === null) {
      issues.push({
        code: "UNKNOWN_NUMERICAL_PROFILE",
        exerciseId,
        message: `numericalProfileId "${declaredProfileId}" does not exist in NUMERICAL_PRESCRIPTION_PROFILES.`,
      });
    } else if (
      declaredProfile.moduleId !== entry.moduleId ||
      declaredProfile.methodId !== entry.explicitMethodId ||
      declaredProfile.exerciseRole !== entry.role
    ) {
      issues.push({
        code: "NUMERICAL_PROFILE_TRIPLE_MISMATCH",
        exerciseId,
        message:
          `numericalProfileId "${declaredProfileId}" is defined for ` +
          `${declaredProfile.moduleId}/${declaredProfile.methodId}/${declaredProfile.exerciseRole}, ` +
          `not this entry's ${entry.moduleId}/${entry.explicitMethodId}/${entry.role}.`,
      });
    }
  } else if (tripleCandidates.length > 1) {
    issues.push({
      code: "AMBIGUOUS_TRIPLE_REQUIRES_EXPLICIT_PROFILE",
      exerciseId,
      message:
        `${tripleCandidates.length} numerical profiles share this entry's triple ` +
        `${entry.moduleId}/${entry.explicitMethodId}/${entry.role} ` +
        `(${tripleCandidates.map((profile) => profile.profileId).join(", ")}) — an explicit numericalProfileId is required.`,
    });
  }

  // Presence is not executability: a profile may be fully documented and
  // correctly selected yet still be unable to produce a prescription (no
  // encodable intensity — see `isExecutableNumericalProfile`). Catching it
  // here means the entry is rejected when it is declared, rather than
  // failing at the `"intensity"` stage every time it is prescribed. Only
  // reported when resolution actually succeeded — the codes above already
  // cover unknown, mismatched and ambiguous selections.
  const profileResolution = resolveNumericalProfile({
    moduleId: entry.moduleId,
    methodId: entry.explicitMethodId,
    exerciseRole: entry.role,
    explicitProfileId: declaredProfileId,
  });

  if (profileResolution.ok && !isExecutableNumericalProfile(profileResolution.profile)) {
    issues.push({
      code: "NON_EXECUTABLE_NUMERICAL_PROFILE",
      exerciseId,
      message:
        `Numerical profile "${profileResolution.profile.profileId}" documents no encodable intensity rule, ` +
        `so it can never produce a prescription — resolveIntensity fails with INTENSITY_NOT_DOCUMENTED for every input.`,
    });
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
  if (
    entry.capabilities.requiredEquipmentCapabilities.length === 0 &&
    !entry.capabilities.supportedLoadingModes.some((mode) => SELF_SUPPLIED_LOADING_MODES.includes(mode))
  ) {
    issues.push({
      code: "IMPOSSIBLE_METHOD_STRUCTURE_EQUIPMENT_COMBINATION",
      exerciseId,
      message: `No required equipment capability is declared, and no loading mode is self-supplied (one of: ${SELF_SUPPLIED_LOADING_MODES.join(", ")}).`,
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
