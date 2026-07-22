/**
 * Combat Athlete System — Exercise Eligibility Filtering
 * Version 0.1
 *
 * Determines whether each candidate exercise is compatible or incompatible
 * with a validated `EngineInput`. This module performs hard filtering only.
 *
 * Explicitly out of scope for this file (deferred to later modules):
 * - scoring or ranking of exercises (`scoringEngine.ts`);
 * - `dislikedExerciseIds` (a soft preference signal, never a hard exclusion);
 * - readiness as a firm exclusion criterion (no documented threshold exists
 *   in the current `ReadinessState`/`ExerciseDefinition` shapes);
 * - recovery conflicts derived from `TrainingHistory` (no documented time
 *   window or per-exercise fatigue-dimension mapping exists);
 * - combat-load conflicts (no combat-practice data exists in `EngineInput`
 *   Version 0.1);
 * - duration conflicts (a session-assembly concern, not a single-exercise
 *   eligibility concern);
 * - redundancy between exercises, substitutions, best-exercise selection or
 *   full session assembly;
 * - Decision Trace generation;
 * - implicit anatomical, medical or biomechanical matching beyond what
 *   `BodyRegion` and `MovementPattern` values in `types.ts` already encode;
 * - space constraints for exercises without `requirements` (no legacy
 *   required-space field exists on `ExerciseDefinition` to compare against
 *   `TrainingEnvironment.availableSpace`); exercises using the Exercise
 *   Requirements Model (`requirements` defined) get `sufficient_space`
 *   enforcement via `checkNewExerciseRequirementsModel` below.
 *
 * Every rejection reason produced here is a hard constraint
 * (`hardConstraint: true`) — this module never produces a soft
 * deprioritization signal.
 */

import type {
  AthleteRestriction,
  EngineInput,
  ExerciseDefinition,
  ExerciseEligibilityResult,
  ExerciseRejectionReason,
  ExerciseRejectionReasonCode,
  ExerciseRequirementAtom,
  ExerciseRequirements,
  MovementPattern,
  PainReport,
} from "./types";
import {
  evaluateExerciseRequirements,
  validateExerciseRequirementsStructure,
  validateRequirementsCoexistenceInvariant,
} from "./exerciseRequirements";

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Evaluates a single exercise against the athlete, medical, equipment and
 * environment data carried by `input`, and returns every hard rejection
 * reason that applies. `eligible` is `true` only when no reason was found.
 *
 * Checks run in a fixed order (module exclusion, athlete exclusion, medical
 * restrictions, absolute contraindications, active pain, equipment,
 * environment, technical level) and never stop at the first match — every
 * applicable reason is collected, since the future Decision Trace needs the
 * complete picture, not just the first blocking rule.
 */
export function checkExerciseEligibility(
  exercise: ExerciseDefinition,
  input: EngineInput,
): ExerciseEligibilityResult {
  const reasons: ExerciseRejectionReason[] = [];

  checkModuleExcludedByRequest(exercise, input, reasons);
  checkExerciseExcludedByAthlete(exercise, input, reasons);
  checkHardRestrictionProhibitsExercise(exercise, input, reasons);
  checkHardRestrictionProhibitsMovement(exercise, input, reasons);
  checkHardRestrictionProhibitsModule(exercise, input, reasons);
  checkAbsoluteContraindicationMatchesContext(exercise, input, reasons);
  checkActivePainInLoadedRegion(exercise, input, reasons);
  checkActivePainAggravatedByMovement(exercise, input, reasons);
  checkEquipmentAndEnvironmentRequirements(exercise, input, reasons);
  checkTechnicalLevel(exercise, input, reasons);

  return {
    exerciseId: exercise.id,
    eligible: reasons.length === 0,
    rejectionReasons: reasons,
  };
}

/**
 * Evaluates every candidate exercise against `input` and returns one
 * `ExerciseEligibilityResult` per exercise, in the exact order of
 * `exercises`. Ineligible exercises are not filtered out of the returned
 * array — every result (eligible or not) is kept, so the rejection reasons
 * remain available to whatever consumes this list next (scoring, or a
 * future Decision Trace).
 */
export function filterEligibleExercises(
  exercises: ExerciseDefinition[],
  input: EngineInput,
): ExerciseEligibilityResult[] {
  return exercises.map((exercise) => checkExerciseEligibility(exercise, input));
}

// -----------------------------------------------------------------------------
// Check 1 — Module excluded by the training request
// -----------------------------------------------------------------------------

function checkModuleExcludedByRequest(
  exercise: ExerciseDefinition,
  input: EngineInput,
  reasons: ExerciseRejectionReason[],
): void {
  const excludedModules = input.request.excludedModules;
  if (excludedModules !== undefined && excludedModules.includes(exercise.module)) {
    addReason(
      reasons,
      "MODULE_EXCLUDED",
      `Module "${exercise.module}" is excluded by the training request.`,
    );
  }
}

// -----------------------------------------------------------------------------
// Check 2 — Exercise explicitly excluded by the athlete
// -----------------------------------------------------------------------------

function checkExerciseExcludedByAthlete(
  exercise: ExerciseDefinition,
  input: EngineInput,
  reasons: ExerciseRejectionReason[],
): void {
  const excludedExerciseIds = input.athleteProfile.preferences?.excludedExerciseIds;
  if (excludedExerciseIds !== undefined && excludedExerciseIds.includes(exercise.id)) {
    addReason(
      reasons,
      "EXERCISE_EXCLUDED",
      `Exercise "${exercise.id}" is explicitly excluded by the athlete.`,
    );
  }
}

// -----------------------------------------------------------------------------
// Checks 3–5 — Hard, currently active medical restrictions
// -----------------------------------------------------------------------------

/**
 * A restriction applies to hard filtering only when it is marked as a hard
 * constraint and is not expired relative to the request date. A restriction
 * without `expiresAt` is treated as active indefinitely.
 */
function isRestrictionCurrentlyActive(restriction: AthleteRestriction, requestedAt: string): boolean {
  if (!restriction.isHardConstraint) {
    return false;
  }
  if (restriction.expiresAt === undefined) {
    return true;
  }
  return new Date(restriction.expiresAt).getTime() >= new Date(requestedAt).getTime();
}

function activeHardRestrictions(input: EngineInput): AthleteRestriction[] {
  return input.medicalState.restrictions.filter((restriction) =>
    isRestrictionCurrentlyActive(restriction, input.request.requestedAt),
  );
}

function checkHardRestrictionProhibitsExercise(
  exercise: ExerciseDefinition,
  input: EngineInput,
  reasons: ExerciseRejectionReason[],
): void {
  for (const restriction of activeHardRestrictions(input)) {
    if (restriction.prohibitedExerciseIds?.includes(exercise.id) === true) {
      addReason(
        reasons,
        "MEDICAL_CONTRAINDICATION",
        `Exercise "${exercise.id}" is directly prohibited by restriction "${restriction.id}".`,
      );
    }
  }
}

function checkHardRestrictionProhibitsMovement(
  exercise: ExerciseDefinition,
  input: EngineInput,
  reasons: ExerciseRejectionReason[],
): void {
  for (const restriction of activeHardRestrictions(input)) {
    if (hasOverlap(exercise.movementPatterns, restriction.prohibitedPatterns)) {
      addReason(
        reasons,
        "MEDICAL_CONTRAINDICATION",
        `A movement pattern of exercise "${exercise.id}" is prohibited by restriction "${restriction.id}".`,
      );
    }
  }
}

function checkHardRestrictionProhibitsModule(
  exercise: ExerciseDefinition,
  input: EngineInput,
  reasons: ExerciseRejectionReason[],
): void {
  for (const restriction of activeHardRestrictions(input)) {
    if (restriction.prohibitedModules?.includes(exercise.module) === true) {
      addReason(
        reasons,
        "MEDICAL_CONTRAINDICATION",
        `Module "${exercise.module}" is prohibited by restriction "${restriction.id}".`,
      );
    }
  }
}

// -----------------------------------------------------------------------------
// Check 6 — Absolute contraindication matching the athlete's actual context
// -----------------------------------------------------------------------------

/**
 * `absolute: true` does not exclude an exercise for every athlete — it
 * becomes a hard exclusion only when it actually matches the athlete's
 * current medical or pain context: the contraindication's own region or
 * prohibited patterns must correspond to an active pain report, an active
 * hard restriction, or a movement reported to aggravate active pain.
 * `absolute: false` contraindications are never evaluated here.
 */
function checkAbsoluteContraindicationMatchesContext(
  exercise: ExerciseDefinition,
  input: EngineInput,
  reasons: ExerciseRejectionReason[],
): void {
  const activePain = activePainReports(input.medicalState.painReports);
  const hardRestrictions = activeHardRestrictions(input);

  for (const contraindication of exercise.contraindications) {
    if (!contraindication.absolute) {
      continue;
    }

    const region = contraindication.region;

    const matchesActivePainRegion =
      region !== undefined && activePain.some((report) => report.region === region);

    const matchesRestrictionRegion =
      region !== undefined && hardRestrictions.some((restriction) => restriction.region === region);

    const matchesRestrictionPattern = hardRestrictions.some((restriction) =>
      hasOverlap(contraindication.prohibitedPatterns, restriction.prohibitedPatterns),
    );

    const matchesAggravatingMovement = activePain.some((report) =>
      hasOverlap(contraindication.prohibitedPatterns, report.aggravatedBy),
    );

    if (
      matchesActivePainRegion ||
      matchesRestrictionRegion ||
      matchesRestrictionPattern ||
      matchesAggravatingMovement
    ) {
      addReason(
        reasons,
        "MEDICAL_CONTRAINDICATION",
        `Exercise "${exercise.id}" matches an absolute contraindication: ${contraindication.description}`,
      );
    }
  }
}

// -----------------------------------------------------------------------------
// Checks 7–8 — Active pain
// -----------------------------------------------------------------------------

function activePainReports(painReports: readonly PainReport[]): PainReport[] {
  return painReports.filter((report) => report.status !== "resolved");
}

function checkActivePainInLoadedRegion(
  exercise: ExerciseDefinition,
  input: EngineInput,
  reasons: ExerciseRejectionReason[],
): void {
  for (const report of activePainReports(input.medicalState.painReports)) {
    if (exercise.bodyRegionsLoaded.includes(report.region)) {
      addReason(
        reasons,
        "ACTIVE_PAIN",
        `Exercise "${exercise.id}" loads body region "${report.region}", which has active pain.`,
      );
    }
  }
}

function checkActivePainAggravatedByMovement(
  exercise: ExerciseDefinition,
  input: EngineInput,
  reasons: ExerciseRejectionReason[],
): void {
  for (const report of activePainReports(input.medicalState.painReports)) {
    if (hasOverlap(exercise.movementPatterns, report.aggravatedBy)) {
      addReason(
        reasons,
        "ACTIVE_PAIN",
        `A movement pattern of exercise "${exercise.id}" is reported to aggravate active pain in region "${report.region}".`,
      );
    }
  }
}

// -----------------------------------------------------------------------------
// Checks 9–13 — Equipment, environment and human-assistance requirements
// -----------------------------------------------------------------------------

/**
 * Exclusive dispatch between the Exercise Requirements Model and the legacy
 * equipment/environment checks. An exercise with `requirements` defined is
 * gated solely by `checkNewExerciseRequirementsModel` — `requiredEquipment`,
 * `optionalEquipment` and the legacy throw/jump/sprint/floor checks never
 * run for it. An exercise without `requirements` keeps the historical
 * behavior below byte-for-byte.
 */
function checkEquipmentAndEnvironmentRequirements(
  exercise: ExerciseDefinition,
  input: EngineInput,
  reasons: ExerciseRejectionReason[],
): void {
  const requirements = exercise.requirements;
  if (requirements !== undefined) {
    checkNewExerciseRequirementsModel(exercise, requirements, input, reasons);
    return;
  }

  checkRequiredEquipmentAvailable(exercise, input, reasons);
  checkThrowingAllowed(exercise, input, reasons);
  checkJumpingAllowed(exercise, input, reasons);
  checkSprintingAllowed(exercise, input, reasons);
  checkFloorSafety(exercise, input, reasons);
}

/**
 * Maps an unsatisfied atom's `kind` (and, for `"environment"` atoms, its
 * `capability`) onto the closest existing `ExerciseRejectionReasonCode`.
 * `"human_assistance"` has no dedicated code today, so it falls back to
 * `"OTHER"` — adding a dedicated code is a `types.ts` change, out of scope
 * for this wiring step.
 */
function rejectionCodeForAtom(atom: ExerciseRequirementAtom): ExerciseRejectionReasonCode {
  switch (atom.kind) {
    case "equipment":
      return "EQUIPMENT_UNAVAILABLE";
    case "environment":
      return atom.capability === "sufficient_space" ? "INSUFFICIENT_SPACE" : "UNSAFE_ENVIRONMENT";
    case "human_assistance":
      return "OTHER";
  }
}

/**
 * Runs the Exercise Requirements Model for a single exercise: structural
 * validation, then the requirements/legacy-equipment coexistence invariant,
 * then evaluation of `required` clauses against `input.environment`. Stops
 * at the first failing validation stage so a malformed `ExerciseRequirements`
 * is never passed to `evaluateExerciseRequirements`, which throws on
 * structural issues. `optional` clauses are evaluated internally by
 * `evaluateExerciseRequirements` but their results are never consulted here
 * — an unsatisfied optional clause must never make the exercise ineligible.
 */
function checkNewExerciseRequirementsModel(
  exercise: ExerciseDefinition,
  requirements: ExerciseRequirements,
  input: EngineInput,
  reasons: ExerciseRejectionReason[],
): void {
  const coexistenceViolation = validateRequirementsCoexistenceInvariant(exercise);
  if (coexistenceViolation !== null) {
    addReason(reasons, "OTHER", coexistenceViolation.reason);
    return;
  }

  const structuralIssues = validateExerciseRequirementsStructure(requirements);
  if (structuralIssues.length > 0) {
    for (const issue of structuralIssues) {
      addReason(reasons, "OTHER", issue.reason);
    }
    return;
  }

  const result = evaluateExerciseRequirements(requirements, input.environment);
  if (result.eligible) {
    return;
  }

  for (const clauseResult of result.requiredClauseResults) {
    if (clauseResult.satisfied) {
      continue;
    }
    for (const atomResult of clauseResult.atomResults) {
      if (atomResult.satisfied) {
        continue;
      }
      addReason(reasons, rejectionCodeForAtom(atomResult.atom), atomResult.reason);
    }
  }
}

// -----------------------------------------------------------------------------
// Check 9 — Required equipment availability
// -----------------------------------------------------------------------------

/**
 * An equipment type is available only when it appears explicitly in
 * `environment.availableEquipment`. Absence is never assumed to mean
 * availability — `"bodyweight"`, `"open_space"`, `"wall"` and `"mat"` must
 * be declared like any other type. `optionalEquipment` is never checked
 * here: its absence must never cause a rejection.
 */
function checkRequiredEquipmentAvailable(
  exercise: ExerciseDefinition,
  input: EngineInput,
  reasons: ExerciseRejectionReason[],
): void {
  const availableTypes = new Set(input.environment.availableEquipment.map((item) => item.type));
  for (const requiredType of exercise.requiredEquipment) {
    if (!availableTypes.has(requiredType)) {
      addReason(
        reasons,
        "EQUIPMENT_UNAVAILABLE",
        `Required equipment "${requiredType}" is not declared as available.`,
      );
    }
  }
}

// -----------------------------------------------------------------------------
// Checks 10–12 — Throwing, jumping, sprinting prohibitions
// -----------------------------------------------------------------------------

function checkThrowingAllowed(
  exercise: ExerciseDefinition,
  input: EngineInput,
  reasons: ExerciseRejectionReason[],
): void {
  if (input.environment.throwingAllowed === false && exercise.movementPatterns.includes("throw")) {
    addReason(
      reasons,
      "UNSAFE_ENVIRONMENT",
      `Exercise "${exercise.id}" requires throwing, which is not allowed in the current environment.`,
    );
  }
}

function checkJumpingAllowed(
  exercise: ExerciseDefinition,
  input: EngineInput,
  reasons: ExerciseRejectionReason[],
): void {
  if (input.environment.jumpingAllowed === false && exercise.movementPatterns.includes("jump")) {
    addReason(
      reasons,
      "UNSAFE_ENVIRONMENT",
      `Exercise "${exercise.id}" requires jumping, which is not allowed in the current environment.`,
    );
  }
}

function checkSprintingAllowed(
  exercise: ExerciseDefinition,
  input: EngineInput,
  reasons: ExerciseRejectionReason[],
): void {
  if (input.environment.sprintingAllowed === false && exercise.movementPatterns.includes("sprint")) {
    addReason(
      reasons,
      "UNSAFE_ENVIRONMENT",
      `Exercise "${exercise.id}" requires sprinting, which is not allowed in the current environment.`,
    );
  }
}

// -----------------------------------------------------------------------------
// Check 13 — Floor safety
// -----------------------------------------------------------------------------

const FLOOR_SENSITIVE_PATTERNS: readonly MovementPattern[] = ["jump", "sprint", "throw"];

/**
 * `floorSafe === false` and `floorSafe === undefined` are treated the same
 * way: an unknown safety-critical environment value is never assumed safe.
 * Only exercises with a floor-sensitive movement pattern (jump, sprint,
 * throw) are rejected — every other exercise is unaffected by this check.
 * Floor sensitivity is determined exclusively from `movementPatterns`; it
 * is not derived from `exercise.module`, since no canonical Capability
 * Module exists specifically for plyometric or ballistic work — that
 * distinction belongs to exercise-level classification, not the module
 * catalog (see `01_MODULE_ENGINE.md`).
 */
function checkFloorSafety(
  exercise: ExerciseDefinition,
  input: EngineInput,
  reasons: ExerciseRejectionReason[],
): void {
  const floorSafe = input.environment.floorSafe;
  if (floorSafe === true) {
    return;
  }

  const isFloorSensitive = exercise.movementPatterns.some((pattern) =>
    FLOOR_SENSITIVE_PATTERNS.includes(pattern),
  );

  if (isFloorSensitive) {
    const reasonDetail = floorSafe === false ? "the floor is declared unsafe" : "floor safety is not declared";
    addReason(
      reasons,
      "UNSAFE_ENVIRONMENT",
      `Exercise "${exercise.id}" requires a safe floor, but ${reasonDetail}.`,
    );
  }
}

// -----------------------------------------------------------------------------
// Check 14 — Technical level
// -----------------------------------------------------------------------------

/**
 * Rejects only when the athlete's documented technical level for one of the
 * exercise's own movement patterns is explicitly below
 * `exercise.minimumTechnicalLevel`. An undocumented level for a pattern is
 * permissive in this version — it never causes a rejection, since no
 * documented threshold exists yet for treating missing data as "high risk."
 */
function checkTechnicalLevel(
  exercise: ExerciseDefinition,
  input: EngineInput,
  reasons: ExerciseRejectionReason[],
): void {
  const levelsByPattern = input.athleteProfile.experience.technicalLevelByPattern;
  if (levelsByPattern === undefined) {
    return;
  }

  for (const pattern of exercise.movementPatterns) {
    const athleteLevel = levelsByPattern[pattern];
    if (athleteLevel !== undefined && athleteLevel < exercise.minimumTechnicalLevel) {
      addReason(
        reasons,
        "TECHNICAL_LEVEL_TOO_LOW",
        `Athlete's documented technical level for pattern "${pattern}" (${athleteLevel}) is below the exercise's minimum (${exercise.minimumTechnicalLevel}).`,
      );
    }
  }
}

// -----------------------------------------------------------------------------
// Shared helpers
// -----------------------------------------------------------------------------

/**
 * Appends a rejection reason unless an identical one (same code and
 * message) is already present — keeps `rejectionReasons` free of exact
 * duplicates without discarding distinct reasons that share a code.
 */
function addReason(
  reasons: ExerciseRejectionReason[],
  code: ExerciseRejectionReasonCode,
  message: string,
): void {
  const isDuplicate = reasons.some((reason) => reason.code === code && reason.message === message);
  if (!isDuplicate) {
    reasons.push({ code, message, hardConstraint: true });
  }
}

/** `true` when at least one element of `a` is also present in `b`. */
function hasOverlap<T>(a: readonly T[] | undefined, b: readonly T[] | undefined): boolean {
  if (a === undefined || b === undefined || a.length === 0 || b.length === 0) {
    return false;
  }
  const bSet = new Set(b);
  return a.some((item) => bSet.has(item));
}
