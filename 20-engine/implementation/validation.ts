/**
 * Combat Athlete System — Input Validation
 * Version 0.1
 *
 * Validates the canonical EngineInput before any training decision is made.
 *
 * Validation must happen before:
 * - objective interpretation,
 * - module selection,
 * - exercise eligibility,
 * - exercise scoring,
 * - session assembly.
 */

import {
  EngineInput,
  PainReport,
  Rating5,
  ValidationIssue,
  ValidationResult,
} from "./types";

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

export function validateEngineInput(input: EngineInput): ValidationResult {
  const issues: ValidationIssue[] = [];

  validateSchemaVersion(input, issues);
  validateAthleteProfile(input, issues);
  validateMedicalState(input, issues);
  validateReadiness(input, issues);
  validateTrainingHistory(input, issues);
  validateEnvironment(input, issues);
  validateTrainingRequest(input, issues);
  validateCrossFieldConsistency(input, issues);

  return {
    valid: !issues.some(
      (issue) =>
        issue.severity === "error" || issue.severity === "critical",
    ),
    issues,
  };
}

export function hasCriticalValidationIssue(
  result: ValidationResult,
): boolean {
  return result.issues.some((issue) => issue.severity === "critical");
}

export function hasValidationErrors(result: ValidationResult): boolean {
  return result.issues.some(
    (issue) =>
      issue.severity === "error" || issue.severity === "critical",
  );
}

// -----------------------------------------------------------------------------
// Schema
// -----------------------------------------------------------------------------

function validateSchemaVersion(
  input: EngineInput,
  issues: ValidationIssue[],
): void {
  if (input.schemaVersion !== "0.1") {
    addIssue(issues, {
      code: "UNSUPPORTED_SCHEMA_VERSION",
      path: "schemaVersion",
      message: `Unsupported schema version: ${String(
        input.schemaVersion,
      )}. Expected version 0.1.`,
      severity: "error",
    });
  }
}

// -----------------------------------------------------------------------------
// Athlete profile
// -----------------------------------------------------------------------------

function validateAthleteProfile(
  input: EngineInput,
  issues: ValidationIssue[],
): void {
  const profile = input.athleteProfile;

  if (!profile) {
    addIssue(issues, {
      code: "MISSING_REQUIRED_FIELD",
      path: "athleteProfile",
      message: "Athlete profile is required.",
      severity: "critical",
    });

    return;
  }

  const identity = profile.identity;

  if (!identity) {
    addIssue(issues, {
      code: "MISSING_REQUIRED_FIELD",
      path: "athleteProfile.identity",
      message: "Athlete identity is required.",
      severity: "critical",
    });

    return;
  }

  if (!isNonEmptyString(identity.athleteId)) {
    addIssue(issues, {
      code: "MISSING_REQUIRED_FIELD",
      path: "athleteProfile.identity.athleteId",
      message: "Athlete ID must be a non-empty string.",
      severity: "error",
    });
  }

  if (!isFiniteNumber(identity.age) || identity.age < 12 || identity.age > 100) {
    addIssue(issues, {
      code: "INVALID_VALUE",
      path: "athleteProfile.identity.age",
      message: "Athlete age must be between 12 and 100 years.",
      severity: "error",
    });
  }

  if (
    identity.heightCm !== undefined &&
    (!isFiniteNumber(identity.heightCm) ||
      identity.heightCm < 100 ||
      identity.heightCm > 250)
  ) {
    addIssue(issues, {
      code: "INVALID_VALUE",
      path: "athleteProfile.identity.heightCm",
      message: "Height must be between 100 and 250 centimetres.",
      severity: "warning",
    });
  }

  if (
    identity.bodyMassKg !== undefined &&
    (!isFiniteNumber(identity.bodyMassKg) ||
      identity.bodyMassKg < 25 ||
      identity.bodyMassKg > 350)
  ) {
    addIssue(issues, {
      code: "INVALID_VALUE",
      path: "athleteProfile.identity.bodyMassKg",
      message: "Body mass must be between 25 and 350 kilograms.",
      severity: "warning",
    });
  }

  if (!profile.experience) {
    addIssue(issues, {
      code: "MISSING_REQUIRED_FIELD",
      path: "athleteProfile.experience",
      message: "Athlete experience is required.",
      severity: "error",
    });
  }

  if (!Array.isArray(profile.goals) || profile.goals.length === 0) {
    addIssue(issues, {
      code: "NO_PRIMARY_GOAL",
      path: "athleteProfile.goals",
      message: "At least one athlete goal is required.",
      severity: "error",
    });

    return;
  }

  const primaryGoals = profile.goals.filter(
    (goal) => goal.priority === "primary",
  );

  if (primaryGoals.length === 0) {
    addIssue(issues, {
      code: "NO_PRIMARY_GOAL",
      path: "athleteProfile.goals",
      message: "At least one primary athlete goal is required.",
      severity: "error",
    });
  }

  for (const [index, goal] of profile.goals.entries()) {
    if (!isNonEmptyString(goal.id)) {
      addIssue(issues, {
        code: "MISSING_REQUIRED_FIELD",
        path: `athleteProfile.goals[${index}].id`,
        message: "Goal ID must be a non-empty string.",
        severity: "error",
      });
    }

    if (!isNonEmptyString(goal.name)) {
      addIssue(issues, {
        code: "MISSING_REQUIRED_FIELD",
        path: `athleteProfile.goals[${index}].name`,
        message: "Goal name must be a non-empty string.",
        severity: "error",
      });
    }

    if (goal.targetDate !== undefined && !isValidDateString(goal.targetDate)) {
      addIssue(issues, {
        code: "INVALID_VALUE",
        path: `athleteProfile.goals[${index}].targetDate`,
        message: "Goal target date must be a valid date string.",
        severity: "warning",
      });
    }
  }

  const duplicateGoalIds = findDuplicateStrings(
    profile.goals.map((goal) => goal.id),
  );

  for (const duplicateId of duplicateGoalIds) {
    addIssue(issues, {
      code: "CONTRADICTORY_INPUT",
      path: "athleteProfile.goals",
      message: `Duplicate athlete goal ID detected: ${duplicateId}.`,
      severity: "error",
    });
  }

  const preferences = profile.preferences;

  if (preferences) {
    const preferred = new Set(preferences.preferredExerciseIds ?? []);
    const excluded = new Set(preferences.excludedExerciseIds ?? []);

    for (const exerciseId of preferred) {
      if (excluded.has(exerciseId)) {
        addIssue(issues, {
          code: "CONTRADICTORY_INPUT",
          path: "athleteProfile.preferences",
          message: `Exercise ${exerciseId} is both preferred and excluded. Exclusion will take priority.`,
          severity: "warning",
        });
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Medical state
// -----------------------------------------------------------------------------

function validateMedicalState(
  input: EngineInput,
  issues: ValidationIssue[],
): void {
  const medical = input.medicalState;

  if (!medical) {
    addIssue(issues, {
      code: "MISSING_REQUIRED_FIELD",
      path: "medicalState",
      message: "Medical state is required.",
      severity: "critical",
    });

    return;
  }

  if (medical.trainingClearanceStatus === "not_cleared") {
    addIssue(issues, {
      code: "MEDICAL_CLEARANCE_REQUIRED",
      path: "medicalState.trainingClearanceStatus",
      message:
        "A known medical restriction currently prevents training. Session generation must stop.",
      severity: "critical",
    });
  }

  if (
    medical.trainingClearanceStatus !== "cleared" &&
    medical.trainingClearanceStatus !== "not_cleared" &&
    medical.trainingClearanceStatus !== "unknown"
  ) {
    addIssue(issues, {
      code: "INVALID_VALUE",
      path: "medicalState.trainingClearanceStatus",
      message:
        'Training clearance status must be "cleared", "not_cleared" or "unknown".',
      severity: "error",
    });
  }

  if (medical.chestPain === true) {
    addCriticalHealthSignal(
      issues,
      "medicalState.chestPain",
      "Chest pain was reported. Session generation must stop.",
    );
  }

  if (medical.neurologicalSymptoms === true) {
    addCriticalHealthSignal(
      issues,
      "medicalState.neurologicalSymptoms",
      "Neurological symptoms were reported. Session generation must stop.",
    );
  }

  if (medical.dizziness === true) {
    addCriticalHealthSignal(
      issues,
      "medicalState.dizziness",
      "Dizziness was reported. Session generation must stop.",
    );
  }

  if (medical.acuteIllness === true) {
    addCriticalHealthSignal(
      issues,
      "medicalState.acuteIllness",
      "Acute illness was reported. Session generation must stop.",
    );
  }

  if (!Array.isArray(medical.painReports)) {
    addIssue(issues, {
      code: "MISSING_REQUIRED_FIELD",
      path: "medicalState.painReports",
      message: "Pain reports must be provided as an array.",
      severity: "error",
    });
  } else {
    medical.painReports.forEach((painReport, index) => {
      validatePainReport(painReport, index, issues);
    });
  }

  if (!Array.isArray(medical.restrictions)) {
    addIssue(issues, {
      code: "MISSING_REQUIRED_FIELD",
      path: "medicalState.restrictions",
      message: "Restrictions must be provided as an array.",
      severity: "error",
    });
  } else {
    for (const [index, restriction] of medical.restrictions.entries()) {
      if (!isNonEmptyString(restriction.id)) {
        addIssue(issues, {
          code: "MISSING_REQUIRED_FIELD",
          path: `medicalState.restrictions[${index}].id`,
          message: "Restriction ID must be a non-empty string.",
          severity: "error",
        });
      }

      if (!isNonEmptyString(restriction.description)) {
        addIssue(issues, {
          code: "MISSING_REQUIRED_FIELD",
          path: `medicalState.restrictions[${index}].description`,
          message: "Restriction description must be provided.",
          severity: "error",
        });
      }

      if (
        restriction.maximumPainAllowed !== undefined &&
        !isPainScore(restriction.maximumPainAllowed)
      ) {
        addIssue(issues, {
          code: "INVALID_PAIN_SCORE",
          path: `medicalState.restrictions[${index}].maximumPainAllowed`,
          message: "Maximum allowed pain must be between 0 and 10.",
          severity: "error",
        });
      }

      if (
        restriction.expiresAt !== undefined &&
        !isValidDateString(restriction.expiresAt)
      ) {
        addIssue(issues, {
          code: "INVALID_VALUE",
          path: `medicalState.restrictions[${index}].expiresAt`,
          message: "Restriction expiry date must be a valid date string.",
          severity: "warning",
        });
      }
    }

    const duplicateRestrictionIds = findDuplicateStrings(
      medical.restrictions.map((restriction) => restriction.id),
    );

    for (const duplicateId of duplicateRestrictionIds) {
      addIssue(issues, {
        code: "CONTRADICTORY_INPUT",
        path: "medicalState.restrictions",
        message: `Duplicate restriction ID detected: ${duplicateId}.`,
        severity: "error",
      });
    }
  }
}

function validatePainReport(
  painReport: PainReport,
  index: number,
  issues: ValidationIssue[],
): void {
  if (!isPainScore(painReport.intensity)) {
    addIssue(issues, {
      code: "INVALID_PAIN_SCORE",
      path: `medicalState.painReports[${index}].intensity`,
      message: "Pain intensity must be between 0 and 10.",
      severity: "error",
    });
  }

  if (
    painReport.status !== "resolved" &&
    isFiniteNumber(painReport.intensity) &&
    painReport.intensity >= 8
  ) {
    addIssue(issues, {
      code: "CRITICAL_HEALTH_SIGNAL",
      path: `medicalState.painReports[${index}].intensity`,
      message:
        "Severe active pain was reported. Session generation must stop pending reassessment.",
      severity: "critical",
    });
  }

  if (
    painReport.status !== "resolved" &&
    isFiniteNumber(painReport.intensity) &&
    painReport.intensity >= 5 &&
    painReport.intensity < 8
  ) {
    addIssue(issues, {
      code: "INVALID_VALUE",
      path: `medicalState.painReports[${index}]`,
      message:
        "Moderate active pain requires conservative exercise filtering and load reduction.",
      severity: "warning",
    });
  }
}

// -----------------------------------------------------------------------------
// Readiness
// -----------------------------------------------------------------------------

function validateReadiness(
  input: EngineInput,
  issues: ValidationIssue[],
): void {
  const readiness = input.readiness;

  if (!readiness) {
    addIssue(issues, {
      code: "MISSING_REQUIRED_FIELD",
      path: "readiness",
      message: "Readiness state is required.",
      severity: "critical",
    });

    return;
  }

  const ratingFields: Array<{
    path: string;
    value: Rating5 | undefined;
  }> = [
    { path: "readiness.energy", value: readiness.energy },
    { path: "readiness.motivation", value: readiness.motivation },
    { path: "readiness.sleepQuality", value: readiness.sleepQuality },
    { path: "readiness.stress", value: readiness.stress },
    { path: "readiness.soreness", value: readiness.soreness },
    {
      path: "readiness.perceivedRecovery",
      value: readiness.perceivedRecovery,
    },
    { path: "readiness.coordination", value: readiness.coordination },
  ];

  for (const field of ratingFields) {
    if (field.value !== undefined && !isRating5(field.value)) {
      addIssue(issues, {
        code: "INVALID_VALUE",
        path: field.path,
        message: "Readiness ratings must be integers between 1 and 5.",
        severity: "error",
      });
    }
  }

  if (
    readiness.readinessScore !== undefined &&
    (!isFiniteNumber(readiness.readinessScore) ||
      readiness.readinessScore < 0 ||
      readiness.readinessScore > 100)
  ) {
    addIssue(issues, {
      code: "INVALID_READINESS_SCORE",
      path: "readiness.readinessScore",
      message: "Readiness score must be between 0 and 100.",
      severity: "error",
    });
  }

  if (
    readiness.sleepHours !== undefined &&
    (!isFiniteNumber(readiness.sleepHours) ||
      readiness.sleepHours < 0 ||
      readiness.sleepHours > 24)
  ) {
    addIssue(issues, {
      code: "INVALID_VALUE",
      path: "readiness.sleepHours",
      message: "Sleep duration must be between 0 and 24 hours.",
      severity: "error",
    });
  }

  if (
    readiness.restingHeartRateBpm !== undefined &&
    (!isFiniteNumber(readiness.restingHeartRateBpm) ||
      readiness.restingHeartRateBpm < 25 ||
      readiness.restingHeartRateBpm > 220)
  ) {
    addIssue(issues, {
      code: "INVALID_VALUE",
      path: "readiness.restingHeartRateBpm",
      message: "Resting heart rate value is outside the accepted range.",
      severity: "warning",
    });
  }

  if (
    readiness.baselineRestingHeartRateBpm !== undefined &&
    (!isFiniteNumber(readiness.baselineRestingHeartRateBpm) ||
      readiness.baselineRestingHeartRateBpm < 25 ||
      readiness.baselineRestingHeartRateBpm > 220)
  ) {
    addIssue(issues, {
      code: "INVALID_VALUE",
      path: "readiness.baselineRestingHeartRateBpm",
      message:
        "Baseline resting heart rate value is outside the accepted range.",
      severity: "warning",
    });
  }

  if (
    readiness.restingHeartRateBpm !== undefined &&
    readiness.baselineRestingHeartRateBpm !== undefined &&
    readiness.restingHeartRateBpm >=
      readiness.baselineRestingHeartRateBpm + 15
  ) {
    addIssue(issues, {
      code: "INVALID_VALUE",
      path: "readiness.restingHeartRateBpm",
      message:
        "Resting heart rate is substantially above baseline. High-intensity training should be reconsidered.",
      severity: "warning",
    });
  }

  if (
    readiness.sleepHours !== undefined &&
    readiness.sleepHours < 4
  ) {
    addIssue(issues, {
      code: "INVALID_VALUE",
      path: "readiness.sleepHours",
      message:
        "Very short sleep duration was reported. Maximum-intensity training should not be prescribed.",
      severity: "warning",
    });
  }

  if (
    readiness.energy <= 1 &&
    readiness.perceivedRecovery <= 1 &&
    readiness.sleepQuality <= 1
  ) {
    addIssue(issues, {
      code: "INVALID_VALUE",
      path: "readiness",
      message:
        "Multiple readiness indicators are critically low. Recovery or very low-load training should be considered.",
      severity: "warning",
    });
  }
}

// -----------------------------------------------------------------------------
// Training history
// -----------------------------------------------------------------------------

function validateTrainingHistory(
  input: EngineInput,
  issues: ValidationIssue[],
): void {
  const history = input.trainingHistory;

  if (!history) {
    addIssue(issues, {
      code: "MISSING_REQUIRED_FIELD",
      path: "trainingHistory",
      message: "Training history is required.",
      severity: "error",
    });

    return;
  }

  if (!Array.isArray(history.recentSessions)) {
    addIssue(issues, {
      code: "MISSING_REQUIRED_FIELD",
      path: "trainingHistory.recentSessions",
      message: "Recent sessions must be provided as an array.",
      severity: "error",
    });

    return;
  }

  for (const [index, session] of history.recentSessions.entries()) {
    if (!isNonEmptyString(session.sessionId)) {
      addIssue(issues, {
        code: "MISSING_REQUIRED_FIELD",
        path: `trainingHistory.recentSessions[${index}].sessionId`,
        message: "Completed session ID must be a non-empty string.",
        severity: "error",
      });
    }

    if (!isValidDateString(session.completedAt)) {
      addIssue(issues, {
        code: "INVALID_VALUE",
        path: `trainingHistory.recentSessions[${index}].completedAt`,
        message: "Completed session date must be valid.",
        severity: "error",
      });
    }

    if (
      !isFiniteNumber(session.durationMinutes) ||
      session.durationMinutes <= 0 ||
      session.durationMinutes > 600
    ) {
      addIssue(issues, {
        code: "INVALID_DURATION",
        path: `trainingHistory.recentSessions[${index}].durationMinutes`,
        message:
          "Completed session duration must be greater than 0 and no more than 600 minutes.",
        severity: "error",
      });
    }
  }

  const duplicateSessionIds = findDuplicateStrings(
    history.recentSessions.map((session) => session.sessionId),
  );

  for (const duplicateId of duplicateSessionIds) {
    addIssue(issues, {
      code: "CONTRADICTORY_INPUT",
      path: "trainingHistory.recentSessions",
      message: `Duplicate completed session ID detected: ${duplicateId}.`,
      severity: "error",
    });
  }
}

// -----------------------------------------------------------------------------
// Environment
// -----------------------------------------------------------------------------

function validateEnvironment(
  input: EngineInput,
  issues: ValidationIssue[],
): void {
  const environment = input.environment;

  if (!environment) {
    addIssue(issues, {
      code: "MISSING_REQUIRED_FIELD",
      path: "environment",
      message: "Training environment is required.",
      severity: "critical",
    });

    return;
  }

  if (!Array.isArray(environment.availableEquipment)) {
    addIssue(issues, {
      code: "MISSING_REQUIRED_FIELD",
      path: "environment.availableEquipment",
      message: "Available equipment must be provided as an array.",
      severity: "error",
    });

    return;
  }

  if (environment.availableEquipment.length === 0) {
    addIssue(issues, {
      code: "NO_AVAILABLE_EQUIPMENT",
      path: "environment.availableEquipment",
      message:
        "No equipment was declared. The engine will be limited to equipment-free options when available.",
      severity: "warning",
    });
  }

  for (const [index, equipment] of environment.availableEquipment.entries()) {
    if (
      equipment.quantity !== undefined &&
      (!Number.isInteger(equipment.quantity) || equipment.quantity < 1)
    ) {
      addIssue(issues, {
        code: "INVALID_VALUE",
        path: `environment.availableEquipment[${index}].quantity`,
        message: "Equipment quantity must be a positive integer.",
        severity: "error",
      });
    }

    if (
      equipment.maximumLoadKg !== undefined &&
      (!isFiniteNumber(equipment.maximumLoadKg) ||
        equipment.maximumLoadKg <= 0)
    ) {
      addIssue(issues, {
        code: "INVALID_VALUE",
        path: `environment.availableEquipment[${index}].maximumLoadKg`,
        message: "Maximum equipment load must be greater than zero.",
        severity: "error",
      });
    }
  }

  if (
    environment.ceilingHeightMeters !== undefined &&
    (!isFiniteNumber(environment.ceilingHeightMeters) ||
      environment.ceilingHeightMeters <= 0 ||
      environment.ceilingHeightMeters > 20)
  ) {
    addIssue(issues, {
      code: "INVALID_VALUE",
      path: "environment.ceilingHeightMeters",
      message: "Ceiling height value is invalid.",
      severity: "warning",
    });
  }

  if (environment.floorSafe === false) {
    addIssue(issues, {
      code: "INVALID_VALUE",
      path: "environment.floorSafe",
      message:
        "The floor is marked unsafe. Jumping, sprinting and ballistic exercises must be excluded.",
      severity: "warning",
    });
  }
}

// -----------------------------------------------------------------------------
// Training request
// -----------------------------------------------------------------------------

function validateTrainingRequest(
  input: EngineInput,
  issues: ValidationIssue[],
): void {
  const request = input.request;

  if (!request) {
    addIssue(issues, {
      code: "MISSING_REQUIRED_FIELD",
      path: "request",
      message: "Training request is required.",
      severity: "critical",
    });

    return;
  }

  if (!isNonEmptyString(request.requestId)) {
    addIssue(issues, {
      code: "MISSING_REQUIRED_FIELD",
      path: "request.requestId",
      message: "Request ID must be a non-empty string.",
      severity: "error",
    });
  }

  if (!isValidDateString(request.requestedAt)) {
    addIssue(issues, {
      code: "INVALID_VALUE",
      path: "request.requestedAt",
      message: "Request date must be valid.",
      severity: "error",
    });
  }

  if (
    !isFiniteNumber(request.durationMinutes) ||
    request.durationMinutes < 10 ||
    request.durationMinutes > 240
  ) {
    addIssue(issues, {
      code: "INVALID_DURATION",
      path: "request.durationMinutes",
      message:
        "Requested session duration must be between 10 and 240 minutes.",
      severity: "error",
    });
  }

  if (!request.primaryObjective) {
    addIssue(issues, {
      code: "MISSING_REQUIRED_FIELD",
      path: "request.primaryObjective",
      message: "A primary session objective is required.",
      severity: "error",
    });
  }

  if (
    request.competitionDate !== undefined &&
    !isValidDateString(request.competitionDate)
  ) {
    addIssue(issues, {
      code: "INVALID_VALUE",
      path: "request.competitionDate",
      message: "Competition date must be valid.",
      severity: "error",
    });
  }

  if (
    request.nextCombatSessionAt !== undefined &&
    !isValidDateString(request.nextCombatSessionAt)
  ) {
    addIssue(issues, {
      code: "INVALID_VALUE",
      path: "request.nextCombatSessionAt",
      message: "Next combat session date must be valid.",
      severity: "error",
    });
  }

  const requiredModules = new Set(request.requiredModules ?? []);
  const excludedModules = new Set(request.excludedModules ?? []);

  for (const module of requiredModules) {
    if (excludedModules.has(module)) {
      addIssue(issues, {
        code: "CONTRADICTORY_INPUT",
        path: "request.requiredModules",
        message: `Module ${module} is both required and excluded.`,
        severity: "error",
      });
    }
  }

  if (
    request.primaryObjective.requestedModules &&
    request.excludedModules
  ) {
    for (const module of request.primaryObjective.requestedModules) {
      if (excludedModules.has(module)) {
        addIssue(issues, {
          code: "CONTRADICTORY_INPUT",
          path: "request.primaryObjective.requestedModules",
          message: `Primary objective requests module ${module}, but the module is excluded.`,
          severity: "error",
        });
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Cross-field consistency
// -----------------------------------------------------------------------------

function validateCrossFieldConsistency(
  input: EngineInput,
  issues: ValidationIssue[],
): void {
  const requestDate = parseDate(input.request?.requestedAt);

  if (!requestDate) {
    return;
  }

  if (input.request.competitionDate) {
    const competitionDate = parseDate(input.request.competitionDate);

    if (competitionDate && competitionDate.getTime() < requestDate.getTime()) {
      addIssue(issues, {
        code: "CONTRADICTORY_INPUT",
        path: "request.competitionDate",
        message: "Competition date occurs before the training request date.",
        severity: "error",
      });
    }
  }

  if (input.request.nextCombatSessionAt) {
    const nextCombatSessionDate = parseDate(
      input.request.nextCombatSessionAt,
    );

    if (
      nextCombatSessionDate &&
      nextCombatSessionDate.getTime() < requestDate.getTime()
    ) {
      addIssue(issues, {
        code: "CONTRADICTORY_INPUT",
        path: "request.nextCombatSessionAt",
        message:
          "The next combat session occurs before the training request date.",
        severity: "error",
      });
    }
  }

  for (const [index, session] of (
    input.trainingHistory?.recentSessions ?? []
  ).entries()) {
    const completedAt = parseDate(session.completedAt);

    if (completedAt && completedAt.getTime() > requestDate.getTime()) {
      addIssue(issues, {
        code: "CONTRADICTORY_INPUT",
        path: `trainingHistory.recentSessions[${index}].completedAt`,
        message:
          "A completed training session cannot occur after the current request date.",
        severity: "error",
      });
    }
  }

  const profileMass = input.athleteProfile?.identity.bodyMassKg;
  const readinessMass = input.readiness?.bodyMassKg;

  if (
    profileMass !== undefined &&
    readinessMass !== undefined &&
    Math.abs(profileMass - readinessMass) > 15
  ) {
    addIssue(issues, {
      code: "CONTRADICTORY_INPUT",
      path: "readiness.bodyMassKg",
      message:
        "Readiness body mass differs substantially from the athlete profile value.",
      severity: "warning",
    });
  }
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function addCriticalHealthSignal(
  issues: ValidationIssue[],
  path: string,
  message: string,
): void {
  addIssue(issues, {
    code: "CRITICAL_HEALTH_SIGNAL",
    path,
    message,
    severity: "critical",
  });
}

function addIssue(
  issues: ValidationIssue[],
  issue: ValidationIssue,
): void {
  const duplicate = issues.some(
    (existingIssue) =>
      existingIssue.code === issue.code &&
      existingIssue.path === issue.path &&
      existingIssue.message === issue.message,
  );

  if (!duplicate) {
    issues.push(issue);
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRating5(value: unknown): value is Rating5 {
  return (
    Number.isInteger(value) &&
    typeof value === "number" &&
    value >= 1 &&
    value <= 5
  );
}

function isPainScore(value: unknown): value is number {
  return (
    isFiniteNumber(value) &&
    value >= 0 &&
    value <= 10
  );
}

function isValidDateString(value: unknown): value is string {
  return isNonEmptyString(value) && parseDate(value) !== null;
}

function parseDate(value: unknown): Date | null {
  if (!isNonEmptyString(value)) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function findDuplicateStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (!isNonEmptyString(value)) {
      continue;
    }

    if (seen.has(value)) {
      duplicates.add(value);
    } else {
      seen.add(value);
    }
  }

  return [...duplicates];
}
