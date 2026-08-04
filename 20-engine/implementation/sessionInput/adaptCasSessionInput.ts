/**
 * Combat Athlete System — Public Session Input Adapter
 * Version 1 ("cas-session-input.v1")
 *
 * Projects a `CasSessionInputV1` into the engine's own `EngineInput`.
 *
 * The exact mirror of `serializeEngineRunResult`, and held to the same rule:
 * this is a PURE PROJECTION.
 *
 * - it takes no training decision — every value already exists on the public
 *   input, and is only renamed or re-shaped;
 * - it derives nothing the engine derives later (no equipment capability, no
 *   range context, no athlete-reference filtering — those belong to
 *   `deriveEquipmentCapabilities`, `deriveRangeContext` and
 *   `deriveAthleteReferences`, downstream of here);
 * - it never validates. `validateEngineInput` is the single validation
 *   authority and already covers every field below, so a malformed public
 *   input becomes a malformed `EngineInput` and comes back as
 *   `outcome: "invalid_input"` with typed issues. Duplicating those checks
 *   here would create a second, drifting rulebook and a second, differently
 *   shaped failure;
 * - it never reads the clock, never mutates its argument, and never fills a
 *   missing optional with a default. An absent optional stays absent, so the
 *   engine sees exactly what the caller sent.
 *
 * `readonly` arrays are copied into mutable ones because `EngineInput` is
 * declared with mutable arrays. The copies are shallow and defensive: the
 * caller's object graph is never aliased into engine state it could later
 * mutate from outside.
 */

import type {
  AthleteGoal,
  AthletePreference,
  AthleteProfile,
  AthleteRestriction,
  AvailableEquipment,
  CompletedSession,
  EngineInput,
  MedicalState,
  PainReport,
  ReadinessState,
  SessionObjective,
  TrainingEnvironment,
  TrainingHistory,
  TrainingRequest,
} from "../types";
import type { IntensityReference } from "../prescription/types";

import type {
  CasAthleteProfileV1,
  CasAvailableEquipmentV1,
  CasAthleteGoalV1,
  CasAthletePreferenceV1,
  CasAthleteRestrictionV1,
  CasCompletedSessionV1,
  CasMedicalStateV1,
  CasPainReportV1,
  CasPerformanceReferenceV1,
  CasReadinessStateV1,
  CasSessionInputV1,
  CasSessionObjectiveV1,
  CasTrainingEnvironmentV1,
  CasTrainingHistoryV1,
  CasTrainingRequestV1,
} from "./types";

/** `undefined` in, `undefined` out — an absent optional is never materialised as `[]`. */
const copyOptionalArray = <T>(values: readonly T[] | undefined): T[] | undefined =>
  values === undefined ? undefined : [...values];

// -----------------------------------------------------------------------------
// Athlete
// -----------------------------------------------------------------------------

function adaptGoal(goal: CasAthleteGoalV1): AthleteGoal {
  return {
    id: goal.id,
    name: goal.name,
    adaptationDomain: goal.adaptationDomain,
    physicalQualities: copyOptionalArray(goal.physicalQualities),
    priority: goal.priority,
    targetDate: goal.targetDate,
    notes: goal.notes,
  };
}

function adaptPreferences(preferences: CasAthletePreferenceV1): AthletePreference {
  return {
    preferredExerciseIds: copyOptionalArray(preferences.preferredExerciseIds),
    dislikedExerciseIds: copyOptionalArray(preferences.dislikedExerciseIds),
    excludedExerciseIds: copyOptionalArray(preferences.excludedExerciseIds),
    preferredEquipment: copyOptionalArray(preferences.preferredEquipment),
    coachingNotes: copyOptionalArray(preferences.coachingNotes),
  };
}

/**
 * The public and internal reference shapes are field-for-field identical
 * today. They are still copied explicitly rather than passed through: the
 * public one is frozen by the contract while the internal one may evolve
 * with the prescription layer, and an alias would silently couple them.
 */
function adaptPerformanceReference(reference: CasPerformanceReferenceV1): IntensityReference {
  return {
    referenceType: reference.referenceType,
    value: reference.value,
    unit: reference.unit,
    sourceId: reference.sourceId,
    measuredAt: reference.measuredAt,
    validUntil: reference.validUntil,
    confidence: reference.confidence,
  };
}

function adaptAthleteProfile(profile: CasAthleteProfileV1): AthleteProfile {
  return {
    identity: {
      athleteId: profile.identity.athleteId,
      displayName: profile.identity.displayName,
      age: profile.identity.age,
      sex: profile.identity.sex,
      heightCm: profile.identity.heightCm,
      bodyMassKg: profile.identity.bodyMassKg,
    },
    experience: {
      generalTrainingLevel: profile.experience.generalTrainingLevel,
      strengthTrainingYears: profile.experience.strengthTrainingYears,
      combatTrainingYears: profile.experience.combatTrainingYears,
      primaryCombatSport: profile.experience.primaryCombatSport,
      secondaryCombatSports: copyOptionalArray(profile.experience.secondaryCombatSports),
      technicalLevelByPattern:
        profile.experience.technicalLevelByPattern === undefined
          ? undefined
          : { ...profile.experience.technicalLevelByPattern },
    },
    goals: profile.goals.map(adaptGoal),
    preferences: profile.preferences === undefined ? undefined : adaptPreferences(profile.preferences),
    performanceReferences:
      profile.performanceReferences === undefined
        ? undefined
        : profile.performanceReferences.map(adaptPerformanceReference),
  };
}

// -----------------------------------------------------------------------------
// Medical
// -----------------------------------------------------------------------------

function adaptPainReport(report: CasPainReportV1): PainReport {
  return {
    region: report.region,
    side: report.side,
    intensity: report.intensity,
    status: report.status,
    aggravatedBy: copyOptionalArray(report.aggravatedBy),
    notes: report.notes,
  };
}

function adaptRestriction(restriction: CasAthleteRestrictionV1): AthleteRestriction {
  return {
    id: restriction.id,
    type: restriction.type,
    region: restriction.region,
    side: restriction.side,
    description: restriction.description,
    prohibitedExerciseIds: copyOptionalArray(restriction.prohibitedExerciseIds),
    prohibitedPatterns: copyOptionalArray(restriction.prohibitedPatterns),
    prohibitedModules: copyOptionalArray(restriction.prohibitedModules),
    maximumPainAllowed: restriction.maximumPainAllowed,
    isHardConstraint: restriction.isHardConstraint,
    expiresAt: restriction.expiresAt,
  };
}

function adaptMedicalState(medicalState: CasMedicalStateV1): MedicalState {
  return {
    trainingClearanceStatus: medicalState.trainingClearanceStatus,
    painReports: medicalState.painReports.map(adaptPainReport),
    restrictions: medicalState.restrictions.map(adaptRestriction),
    neurologicalSymptoms: medicalState.neurologicalSymptoms,
    dizziness: medicalState.dizziness,
    chestPain: medicalState.chestPain,
    acuteIllness: medicalState.acuteIllness,
    notes: copyOptionalArray(medicalState.notes),
  };
}

// -----------------------------------------------------------------------------
// Readiness, history, environment
// -----------------------------------------------------------------------------

function adaptReadiness(readiness: CasReadinessStateV1): ReadinessState {
  return {
    readinessScore: readiness.readinessScore,
    energy: readiness.energy,
    motivation: readiness.motivation,
    sleepQuality: readiness.sleepQuality,
    sleepHours: readiness.sleepHours,
    stress: readiness.stress,
    soreness: readiness.soreness,
    coordination: readiness.coordination,
    perceivedRecovery: readiness.perceivedRecovery,
    restingHeartRateBpm: readiness.restingHeartRateBpm,
    baselineRestingHeartRateBpm: readiness.baselineRestingHeartRateBpm,
    bodyMassKg: readiness.bodyMassKg,
    notes: copyOptionalArray(readiness.notes),
  };
}

function adaptCompletedSession(session: CasCompletedSessionV1): CompletedSession {
  return {
    sessionId: session.sessionId,
    completedAt: session.completedAt,
    sessionType: session.sessionType,
    combatSessionType: session.combatSessionType,
    intensity: session.intensity,
    durationMinutes: session.durationMinutes,
    modules: copyOptionalArray(session.modules),
    exercises:
      session.exercises === undefined ? undefined : session.exercises.map((exercise) => ({ ...exercise })),
    lowerBodyLoad: session.lowerBodyLoad,
    upperBodyLoad: session.upperBodyLoad,
    gripLoad: session.gripLoad,
    impactLoad: session.impactLoad,
    metabolicLoad: session.metabolicLoad,
    notes: copyOptionalArray(session.notes),
  };
}

function adaptTrainingHistory(history: CasTrainingHistoryV1): TrainingHistory {
  return {
    recentSessions: history.recentSessions.map(adaptCompletedSession),
    lastSevenDaysTrainingMinutes: history.lastSevenDaysTrainingMinutes,
    lastSevenDaysCombatMinutes: history.lastSevenDaysCombatMinutes,
    lastSevenDaysHighIntensitySessions: history.lastSevenDaysHighIntensitySessions,
  };
}

function adaptEquipment(equipment: CasAvailableEquipmentV1): AvailableEquipment {
  return {
    type: equipment.type,
    quantity: equipment.quantity,
    maximumLoadKg: equipment.maximumLoadKg,
    details: equipment.details,
  };
}

function adaptEnvironment(environment: CasTrainingEnvironmentV1): TrainingEnvironment {
  return {
    locationType: environment.locationType,
    availableEquipment: environment.availableEquipment.map(adaptEquipment),
    availableSpace: environment.availableSpace,
    ceilingHeightMeters: environment.ceilingHeightMeters,
    throwingAllowed: environment.throwingAllowed,
    jumpingAllowed: environment.jumpingAllowed,
    sprintingAllowed: environment.sprintingAllowed,
    floorSafe: environment.floorSafe,
    usableWall: environment.usableWall,
    partnerAvailable: environment.partnerAvailable,
    temperatureCelsius: environment.temperatureCelsius,
    environmentNotes: copyOptionalArray(environment.environmentNotes),
  };
}

// -----------------------------------------------------------------------------
// Request
// -----------------------------------------------------------------------------

function adaptObjective(objective: CasSessionObjectiveV1): SessionObjective {
  return {
    adaptationDomain: objective.adaptationDomain,
    physicalQualities: copyOptionalArray(objective.physicalQualities),
    requestedModules: copyOptionalArray(objective.requestedModules),
    description: objective.description,
  };
}

function adaptRequest(request: CasTrainingRequestV1): TrainingRequest {
  return {
    requestId: request.requestId,
    requestedAt: request.requestedAt,
    durationMinutes: request.durationMinutes,
    primaryObjective: adaptObjective(request.primaryObjective),
    secondaryObjectives:
      request.secondaryObjectives === undefined ? undefined : request.secondaryObjectives.map(adaptObjective),
    excludedModules: copyOptionalArray(request.excludedModules),
    requiredModules: copyOptionalArray(request.requiredModules),
    sessionIntensityPreference: request.sessionIntensityPreference,
    competitionDate: request.competitionDate,
    nextCombatSessionAt: request.nextCombatSessionAt,
    notes: copyOptionalArray(request.notes),
  };
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * `CasSessionInputV1` → `EngineInput`.
 *
 * `schemaVersion: "0.1"` is set here rather than carried on the public
 * input: it is the ENGINE's input-schema version, and a caller has no
 * business tracking it. The public contract has its own `contractVersion`,
 * and the two move independently by design.
 */
export function adaptCasSessionInput(input: CasSessionInputV1): EngineInput {
  return {
    schemaVersion: "0.1",
    athleteProfile: adaptAthleteProfile(input.athleteProfile),
    medicalState: adaptMedicalState(input.medicalState),
    readiness: adaptReadiness(input.readiness),
    trainingHistory: adaptTrainingHistory(input.trainingHistory),
    environment: adaptEnvironment(input.environment),
    request: adaptRequest(input.request),
  };
}
