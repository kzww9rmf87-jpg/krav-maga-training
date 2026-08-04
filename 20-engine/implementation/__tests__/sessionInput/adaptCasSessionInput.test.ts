/**
 * Combat Athlete System — Public Session Input Adapter Tests
 *
 * The adapter's whole job is to lose nothing and add nothing. The first
 * suite therefore drives a MAXIMAL input — every optional field populated —
 * through the projection and pins the result field by field. A field added
 * to `EngineInput` without being added to the contract shows up here as a
 * missing value rather than as a silently ignored caller input.
 */

import { describe, expect, test } from "vitest";

import { adaptCasSessionInput } from "../../sessionInput/adaptCasSessionInput";
import type { CasSessionInputV1 } from "../../sessionInput/types";
import type { EngineInput } from "../../types";

/** Every field the contract declares, populated with a distinguishable value. */
const MAXIMAL_INPUT: CasSessionInputV1 = {
  contractVersion: "cas-session-input.v1",
  athleteProfile: {
    identity: {
      athleteId: "athlete-1",
      displayName: "Test Athlete",
      age: 30,
      sex: "female",
      heightCm: 172,
      bodyMassKg: 68,
    },
    experience: {
      generalTrainingLevel: "advanced",
      strengthTrainingYears: 6,
      combatTrainingYears: 9,
      primaryCombatSport: "krav_maga",
      secondaryCombatSports: ["judo", "boxing"],
      technicalLevelByPattern: { squat: 4, hinge: 3 },
    },
    goals: [
      {
        id: "goal-1",
        name: "Maximal strength",
        adaptationDomain: "maximum_strength",
        physicalQualities: ["absolute_strength"],
        priority: "primary",
        targetDate: "2026-06-01",
        notes: "peak before grading",
      },
    ],
    preferences: {
      preferredExerciseIds: ["back_squat"],
      dislikedExerciseIds: ["burpee"],
      excludedExerciseIds: ["overhead_press"],
      preferredEquipment: ["barbell"],
      coachingNotes: ["prefers morning sessions"],
    },
    performanceReferences: [
      {
        referenceType: "one_rep_max",
        value: 100,
        unit: "kg",
        sourceId: "bench-1rm",
        measuredAt: "2025-12-01T00:00:00.000Z",
        validUntil: "2026-12-01T00:00:00.000Z",
        confidence: "validated",
      },
    ],
  },
  medicalState: {
    trainingClearanceStatus: "cleared",
    painReports: [
      {
        region: "shoulder",
        side: "left",
        intensity: 3,
        status: "intermittent",
        aggravatedBy: ["vertical_push"],
        notes: "only under load",
      },
    ],
    restrictions: [
      {
        id: "restriction-1",
        type: "injury",
        region: "knee",
        side: "right",
        description: "meniscus",
        prohibitedExerciseIds: ["depth_jump"],
        prohibitedPatterns: ["jump"],
        prohibitedModules: ["power"],
        maximumPainAllowed: 2,
        isHardConstraint: true,
        expiresAt: "2026-09-01T00:00:00.000Z",
      },
    ],
    neurologicalSymptoms: false,
    dizziness: false,
    chestPain: false,
    acuteIllness: false,
    notes: ["cleared by physio"],
  },
  readiness: {
    readinessScore: 72,
    energy: 4,
    motivation: 5,
    sleepQuality: 3,
    sleepHours: 7.5,
    stress: 2,
    soreness: 2,
    coordination: 4,
    perceivedRecovery: 4,
    restingHeartRateBpm: 52,
    baselineRestingHeartRateBpm: 50,
    bodyMassKg: 68,
    notes: ["felt good"],
  },
  trainingHistory: {
    recentSessions: [
      {
        sessionId: "session-1",
        completedAt: "2026-01-13T18:00:00.000Z",
        sessionType: "cas",
        combatSessionType: "sparring",
        intensity: "high",
        durationMinutes: 60,
        modules: ["strength"],
        exercises: [
          {
            exerciseId: "back_squat",
            setsCompleted: 4,
            repetitionsCompleted: 5,
            durationSeconds: 300,
            distanceMeters: 0,
            loadKg: 90,
            perceivedExertion: 8,
            painDuringExercise: 0,
            technicalQuality: 4,
          },
        ],
        lowerBodyLoad: 4,
        upperBodyLoad: 2,
        gripLoad: 2,
        impactLoad: 1,
        metabolicLoad: 3,
        notes: ["good session"],
      },
    ],
    lastSevenDaysTrainingMinutes: 240,
    lastSevenDaysCombatMinutes: 120,
    lastSevenDaysHighIntensitySessions: 2,
  },
  environment: {
    locationType: "gym",
    availableEquipment: [
      { type: "barbell", quantity: 2, maximumLoadKg: 200, details: "olympic" },
      { type: "plates" },
    ],
    availableSpace: "large",
    ceilingHeightMeters: 3.2,
    throwingAllowed: true,
    jumpingAllowed: true,
    sprintingAllowed: false,
    floorSafe: true,
    usableWall: true,
    partnerAvailable: true,
    temperatureCelsius: 19,
    environmentNotes: ["chalk allowed"],
  },
  request: {
    requestId: "request-1",
    requestedAt: "2026-01-15T08:00:00.000Z",
    durationMinutes: 45,
    primaryObjective: {
      adaptationDomain: "maximum_strength",
      physicalQualities: ["absolute_strength"],
      requestedModules: ["core"],
      description: "heavy lower body",
    },
    secondaryObjectives: [{ adaptationDomain: "conditioning" }],
    excludedModules: ["recovery"],
    requiredModules: ["grip"],
    sessionIntensityPreference: "high",
    competitionDate: "2026-05-01",
    nextCombatSessionAt: "2026-01-16T18:00:00.000Z",
    notes: ["short on time"],
  },
};

describe("adaptCasSessionInput — nothing is lost", () => {
  const adapted = adaptCasSessionInput(MAXIMAL_INPUT);

  test("the engine's own schema version is set by CAS, never carried by the caller", () => {
    expect(adapted.schemaVersion).toBe("0.1");
    expect("contractVersion" in adapted).toBe(false);
  });

  test("athlete identity, experience, goals and preferences survive in full", () => {
    expect(adapted.athleteProfile.identity).toEqual(MAXIMAL_INPUT.athleteProfile.identity);
    expect(adapted.athleteProfile.experience.generalTrainingLevel).toBe("advanced");
    expect(adapted.athleteProfile.experience.secondaryCombatSports).toEqual(["judo", "boxing"]);
    expect(adapted.athleteProfile.experience.technicalLevelByPattern).toEqual({ squat: 4, hinge: 3 });
    expect(adapted.athleteProfile.goals).toEqual(MAXIMAL_INPUT.athleteProfile.goals);
    expect(adapted.athleteProfile.preferences).toEqual(MAXIMAL_INPUT.athleteProfile.preferences);
  });

  test("performance references survive field for field", () => {
    expect(adapted.athleteProfile.performanceReferences).toEqual(MAXIMAL_INPUT.athleteProfile.performanceReferences);
  });

  test("medical state, pain reports and restrictions survive in full", () => {
    expect(adapted.medicalState).toEqual(MAXIMAL_INPUT.medicalState);
  });

  test("readiness survives in full, including every optional signal", () => {
    expect(adapted.readiness).toEqual(MAXIMAL_INPUT.readiness);
  });

  test("training history survives in full, including per-exercise summaries", () => {
    expect(adapted.trainingHistory).toEqual(MAXIMAL_INPUT.trainingHistory);
  });

  test("environment survives in full, including the safety flags", () => {
    expect(adapted.environment).toEqual(MAXIMAL_INPUT.environment);
  });

  test("the request survives in full, including objectives and module constraints", () => {
    expect(adapted.request).toEqual(MAXIMAL_INPUT.request);
  });

  test("the adapted input has exactly the EngineInput top-level keys", () => {
    expect(Object.keys(adapted).sort()).toEqual([
      "athleteProfile",
      "environment",
      "medicalState",
      "readiness",
      "request",
      "schemaVersion",
      "trainingHistory",
    ]);
  });
});

describe("adaptCasSessionInput — nothing is added", () => {
  /** The smallest input the contract permits. */
  const MINIMAL_INPUT: CasSessionInputV1 = {
    contractVersion: "cas-session-input.v1",
    athleteProfile: {
      identity: { athleteId: "a", age: 30 },
      experience: { generalTrainingLevel: "beginner" },
      goals: [],
    },
    medicalState: { trainingClearanceStatus: "cleared", painReports: [], restrictions: [] },
    readiness: { energy: 3, motivation: 3, sleepQuality: 3, stress: 3, soreness: 3, perceivedRecovery: 3 },
    trainingHistory: { recentSessions: [] },
    environment: { locationType: "home", availableEquipment: [], availableSpace: "limited" },
    request: {
      requestId: "r",
      requestedAt: "2026-01-15T08:00:00.000Z",
      durationMinutes: 45,
      primaryObjective: { adaptationDomain: "maximum_strength" },
    },
  };

  test("an absent optional stays absent — never defaulted to [] or a value", () => {
    const adapted = adaptCasSessionInput(MINIMAL_INPUT);

    expect(adapted.athleteProfile.preferences).toBeUndefined();
    expect(adapted.athleteProfile.performanceReferences).toBeUndefined();
    expect(adapted.athleteProfile.experience.secondaryCombatSports).toBeUndefined();
    expect(adapted.athleteProfile.experience.technicalLevelByPattern).toBeUndefined();
    expect(adapted.environment.floorSafe).toBeUndefined();
    expect(adapted.environment.partnerAvailable).toBeUndefined();
    expect(adapted.request.requiredModules).toBeUndefined();
    expect(adapted.request.secondaryObjectives).toBeUndefined();
    expect(adapted.readiness.readinessScore).toBeUndefined();
  });

  test("no derived value is present — capabilities, range context and sources come later", () => {
    const adapted = adaptCasSessionInput(MINIMAL_INPUT) as unknown as Record<string, unknown>;

    for (const derived of [
      "availableEquipmentCapabilities",
      "rangeContext",
      "restRangeContext",
      "prescriptionSources",
      "loadRounding",
      "athleteReferences",
    ]) {
      expect(derived in adapted).toBe(false);
    }
    expect(JSON.stringify(adapted)).not.toContain("cable_or_band_resistance");
  });
});

describe("adaptCasSessionInput — purity and wire-safety", () => {
  test("the public input is never mutated", () => {
    const before = JSON.stringify(MAXIMAL_INPUT);
    adaptCasSessionInput(MAXIMAL_INPUT);
    expect(JSON.stringify(MAXIMAL_INPUT)).toBe(before);
  });

  test("the adapted arrays are copies, so later engine work cannot reach the caller's objects", () => {
    const adapted = adaptCasSessionInput(MAXIMAL_INPUT);

    expect(adapted.athleteProfile.goals).not.toBe(MAXIMAL_INPUT.athleteProfile.goals);
    expect(adapted.medicalState.painReports).not.toBe(MAXIMAL_INPUT.medicalState.painReports);
    expect(adapted.environment.availableEquipment).not.toBe(MAXIMAL_INPUT.environment.availableEquipment);
    expect(adapted.trainingHistory.recentSessions).not.toBe(MAXIMAL_INPUT.trainingHistory.recentSessions);
  });

  test("a JSON round-trip of the contract adapts identically — the shape is wire-safe", () => {
    const overTheWire = JSON.parse(JSON.stringify(MAXIMAL_INPUT)) as CasSessionInputV1;

    expect(adaptCasSessionInput(overTheWire)).toEqual(adaptCasSessionInput(MAXIMAL_INPUT));
  });

  test("two adaptations of the same input are deeply equal", () => {
    expect(adaptCasSessionInput(MAXIMAL_INPUT)).toEqual(adaptCasSessionInput(MAXIMAL_INPUT));
  });

  test("the result is assignable to EngineInput without a cast", () => {
    const engineInput: EngineInput = adaptCasSessionInput(MAXIMAL_INPUT);
    expect(engineInput.request.requestId).toBe("request-1");
  });
});
