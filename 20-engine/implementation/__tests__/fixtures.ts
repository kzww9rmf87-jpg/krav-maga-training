/**
 * Combat Athlete System — Test Fixtures
 *
 * Explicit, minimal, readable factories for `EngineInput` and
 * `ExerciseDefinition`. No `DeepPartial`, no `any`, no random data, no
 * `new Date()` — every date used across the test suite derives from the
 * fixed `REQUESTED_AT`/`NEXT_COMBAT_SESSION_AT` constants below.
 *
 * Overrides are shallow (`Partial<T>`). For nested objects, compose the
 * relevant sub-factory explicitly in the test rather than relying on a
 * deep-merge utility — this keeps every scenario's intent visible at the
 * call site instead of hidden behind merge semantics.
 */

import type {
  AthleteProfile,
  EngineInput,
  ExerciseDefinition,
  MedicalState,
  ReadinessState,
  TrainingEnvironment,
  TrainingHistory,
  TrainingRequest,
} from "../types";

/** Fixed request timestamp reused by every fixture — never `new Date()`. */
export const REQUESTED_AT = "2026-01-15T08:00:00.000Z";

/** Exactly 12 hours after `REQUESTED_AT` — the fixed combat-session reference used by recovery-conflict scenarios. */
export const NEXT_COMBAT_SESSION_AT = "2026-01-15T20:00:00.000Z";

export function makeAthleteProfile(overrides: Partial<AthleteProfile> = {}): AthleteProfile {
  return {
    identity: {
      athleteId: "athlete-1",
      age: 30,
    },
    experience: {
      generalTrainingLevel: "intermediate",
    },
    goals: [
      {
        id: "goal-1",
        name: "General Strength",
        adaptationDomain: "maximum_strength",
        priority: "primary",
      },
    ],
    ...overrides,
  };
}

export function makeMedicalState(overrides: Partial<MedicalState> = {}): MedicalState {
  return {
    trainingClearanceStatus: "cleared",
    painReports: [],
    restrictions: [],
    ...overrides,
  };
}

export function makeReadiness(overrides: Partial<ReadinessState> = {}): ReadinessState {
  return {
    energy: 3,
    motivation: 3,
    sleepQuality: 3,
    stress: 3,
    soreness: 3,
    perceivedRecovery: 3,
    ...overrides,
  };
}

export function makeTrainingHistory(overrides: Partial<TrainingHistory> = {}): TrainingHistory {
  return {
    recentSessions: [],
    ...overrides,
  };
}

export function makeEnvironment(overrides: Partial<TrainingEnvironment> = {}): TrainingEnvironment {
  return {
    locationType: "gym",
    availableEquipment: [{ type: "bodyweight" }],
    availableSpace: "moderate",
    ...overrides,
  };
}

export function makeRequest(overrides: Partial<TrainingRequest> = {}): TrainingRequest {
  return {
    requestId: "request-1",
    requestedAt: REQUESTED_AT,
    durationMinutes: 45,
    primaryObjective: { adaptationDomain: "maximum_strength" },
    ...overrides,
  };
}

/**
 * A structurally complete, validation-clean `EngineInput`. Its default
 * primary objective (`maximum_strength`) resolves to a real Capability
 * Module (`"strength"`) via `moduleSelector.ts` — most scenarios only need
 * to override `request` (via `makeRequest`) or `athleteProfile` (via
 * `makeAthleteProfile`) explicitly.
 */
export function makeValidInput(overrides: Partial<EngineInput> = {}): EngineInput {
  return {
    schemaVersion: "0.1",
    athleteProfile: makeAthleteProfile(),
    medicalState: makeMedicalState(),
    readiness: makeReadiness(),
    trainingHistory: makeTrainingHistory(),
    environment: makeEnvironment(),
    request: makeRequest(),
    ...overrides,
  };
}

/**
 * A structurally complete, generally admissible `ExerciseDefinition`.
 * Matches `makeValidInput`'s default primary module (`"strength"`) and
 * adaptation (`"maximum_strength"`) so the two compose without further
 * overrides in the common case. Carries both duration fields so
 * `estimatedDurationMinutes` is calculable by default.
 */
export function makeExercise(overrides: Partial<ExerciseDefinition> = {}): ExerciseDefinition {
  return {
    id: "exercise-1",
    name: "Test Exercise",
    module: "strength",
    primaryAdaptation: "maximum_strength",
    physicalQualities: ["absolute_strength"],
    movementPatterns: ["squat"],
    requiredEquipment: [],
    minimumTechnicalLevel: 1,
    complexity: "low",
    unilateral: false,
    bodyRegionsLoaded: ["thigh"],
    contraindications: [],
    fatigueProfile: {
      types: [],
      neural: 2,
      muscular: 2,
      metabolic: 2,
      connectiveTissue: 2,
      technical: 2,
    },
    evidenceLevel: "level_1",
    setupTimeMinutes: 2,
    ...overrides,
  };
}
