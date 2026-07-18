/**
 * Combat Athlete System — Exercise Scoring
 * Version 0.1
 *
 * Computes a deterministic suitability score for exercises that have
 * already been proven eligible by `exerciseSelector.ts`. This module never
 * decides eligibility itself — "Éligibilité d'abord, scoring ensuite" is
 * enforced structurally: `scoreExercise` requires the caller's own
 * `ExerciseEligibilityResult` and throws rather than silently scoring an
 * exercise that is not explicitly eligible.
 *
 * V0.1 philosophy — read before changing any constant below:
 * `16_SCORING_MODEL.md` describes a rich, multi-family, per-module weighted
 * model. `ExerciseScoreBreakdown` (`types.ts`) compresses that model into
 * twelve fields. Every numeric constant in this file that is not a literal
 * transcription of a documented scale is a V0.1 POLICY CONSTANT: a
 * deliberate, minimal engineering decision made to produce a working V0.1,
 * not a scientific fact and not a verbatim quote from the documentation.
 * These constants are expected to be revisited as the engine matures — they
 * are grouped and named below precisely so they can be challenged
 * individually rather than hunted for inline.
 *
 * Explicitly deferred to later versions (not implemented here):
 * - `physicalQualities` matching (no documented mapping to adaptations);
 * - secondary combat sports in transfer value;
 * - morphology;
 * - maximum available equipment load;
 * - subjective adherence;
 * - a real, structured progression model (entry level, strategy, exit
 *   criteria) — only a coarse load/repetition trend signal is used;
 * - measured velocity or force;
 * - `redundancyPenalty` (requires a partially assembled session — the
 *   sibling exercises already selected — which this function does not
 *   receive);
 * - `interferencePenalty` (requires the same session context, plus
 *   documented numeric thresholds for combat/competition proximity that do
 *   not currently exist);
 * - final exercise selection, prescriptions, substitutions, session
 *   assembly and Decision Trace generation.
 */

import type {
  AthleteLevel,
  AthleteRestriction,
  BodyRegion,
  CompletedExerciseSummary,
  ConfidenceLevel,
  EngineInput,
  EvidenceLevel,
  ExerciseComplexity,
  ExerciseDefinition,
  ExerciseEligibilityResult,
  ExerciseScoreBreakdown,
  Identifier,
  Rating5,
  ScoredExercise,
  SelectedModule,
  TrainingHistory,
} from "./types";

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Scores a single, already-eligible exercise against `input` and the
 * `selectedModule` it is being considered for. `eligibility` must be the
 * result already produced by `exerciseSelector.ts` for this exact exercise
 * — this function never recomputes eligibility and refuses to score an
 * exercise that is not explicitly eligible.
 */
export function scoreExercise(
  exercise: ExerciseDefinition,
  eligibility: ExerciseEligibilityResult,
  input: EngineInput,
  selectedModule: SelectedModule,
): ScoredExercise {
  if (eligibility.exerciseId !== exercise.id) {
    throw new Error(
      `scoreExercise: eligibility.exerciseId ("${eligibility.exerciseId}") does not match exercise.id ("${exercise.id}").`,
    );
  }
  if (eligibility.eligible !== true) {
    throw new Error(`scoreExercise: exercise "${exercise.id}" is not eligible and must not be scored.`);
  }

  const reasons: string[] = [];

  const objectiveRelevance = computeObjectiveRelevance(exercise, selectedModule, reasons);
  const athleteCompatibility = computeAthleteCompatibility(exercise, input);
  const transferValue = computeTransferValue(exercise, input, reasons);
  const equipmentCompatibility = computeEquipmentCompatibility(exercise, input);
  const progressionValue = computeProgressionValue(exercise, input);
  const safety = computeSafety(exercise, input);

  const preferenceBonus = computePreferenceBonus(exercise, input, reasons);
  const fatigueCostPenalty = computeFatigueCostPenalty(exercise, input);
  const technicalRiskPenalty = computeTechnicalRiskPenalty(exercise, input);
  const redundancyPenalty = 0;
  const interferencePenalty = 0;

  if (fatigueCostPenalty > 0) {
    reasons.push(
      `Fatigue cost penalty applied: -${fatigueCostPenalty} (readiness-to-demand ratio below the favorable threshold).`,
    );
  }
  if (technicalRiskPenalty > 0) {
    reasons.push(
      `Technical risk penalty applied: -${technicalRiskPenalty} (complexity, technical fatigue and/or borderline technical level).`,
    );
  }

  const rawScore = computeRawScore({
    objectiveRelevance,
    athleteCompatibility,
    transferValue,
    equipmentCompatibility,
    progressionValue,
    safety,
  });

  const finalScore = clamp(
    rawScore + preferenceBonus - fatigueCostPenalty - technicalRiskPenalty - redundancyPenalty - interferencePenalty,
    SCORE_MIN,
    SCORE_MAX,
  );

  const { factor: confidenceFactor, level: confidence } = CONFIDENCE_BY_EVIDENCE_LEVEL[exercise.evidenceLevel];

  const breakdown: ExerciseScoreBreakdown = {
    objectiveRelevance,
    athleteCompatibility,
    transferValue,
    equipmentCompatibility,
    progressionValue,
    preferenceBonus,
    safety,
    fatigueCostPenalty,
    technicalRiskPenalty,
    redundancyPenalty,
    interferencePenalty,
    confidenceFactor,
  };

  return {
    exercise,
    eligible: true,
    rawScore,
    finalScore,
    confidence,
    breakdown,
    reasons,
  };
}

/**
 * Scores every exercise in `exercises` that has a matching, explicitly
 * eligible entry in `eligibilityResults` (typically the output of
 * `filterEligibleExercises`). Exercises without a matching result, or whose
 * result is not eligible, are silently skipped — never scored. Neither
 * input array is mutated. The returned array is sorted deterministically;
 * see `compareScoredExercises`.
 */
export function scoreEligibleExercises(
  exercises: ExerciseDefinition[],
  eligibilityResults: ExerciseEligibilityResult[],
  input: EngineInput,
  selectedModule: SelectedModule,
): ScoredExercise[] {
  const eligibilityByExerciseId = new Map<Identifier, ExerciseEligibilityResult>(
    eligibilityResults.map((result) => [result.exerciseId, result]),
  );

  const scored: ScoredExercise[] = [];
  for (const exercise of exercises) {
    const eligibility = eligibilityByExerciseId.get(exercise.id);
    if (eligibility === undefined || eligibility.eligible !== true) {
      continue;
    }
    scored.push(scoreExercise(exercise, eligibility, input, selectedModule));
  }

  scored.sort(compareScoredExercises);
  return scored;
}

// -----------------------------------------------------------------------------
// V0.1 policy constants
// -----------------------------------------------------------------------------

const SCORE_MIN = 0;
const SCORE_MAX = 100;

/** Weights applied to the six `Score100` criteria when computing `rawScore`. */
const CRITERION_WEIGHTS = {
  objectiveRelevance: 5,
  athleteCompatibility: 4,
  transferValue: 3,
  equipmentCompatibility: 2,
  progressionValue: 2,
  safety: 5,
} as const;

const ATHLETE_LEVEL_RANK: Record<AthleteLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  elite: 4,
};

const EXERCISE_COMPLEXITY_RANK: Record<ExerciseComplexity, number> = {
  very_low: 1,
  low: 2,
  moderate: 3,
  high: 4,
  very_high: 5,
};

const OBJECTIVE_RELEVANCE = {
  MODULE_AND_ADAPTATION_MATCH: 100,
  MODULE_MATCH_ONLY: 90,
  ADAPTATION_MATCH_ONLY: 85,
  SECONDARY_ADAPTATION_MATCH: 70,
  NO_MATCH: 40,
} as const;

const ATHLETE_COMPATIBILITY = {
  NEUTRAL: 70,
  LEVEL_MEETS_COMPLEXITY: 15,
  LEVEL_GAP_ONE: -10,
  LEVEL_GAP_TWO_OR_MORE: -25,
  HIGH_TECHNICAL_QUALITY_HISTORY: 5,
  LOW_TECHNICAL_QUALITY_HISTORY: -10,
  HIGH_PAIN_HISTORY: -15,
} as const;

/** Average `technicalQuality`/`painDuringExercise` thresholds triggering the adjustments above. */
const ATHLETE_COMPATIBILITY_HISTORY_THRESHOLDS = {
  HIGH_TECHNICAL_QUALITY_MIN: 4,
  LOW_TECHNICAL_QUALITY_MAX: 2,
  HIGH_PAIN_MIN: 5,
} as const;

const TRANSFER_VALUE_NEUTRAL = 60;

const RATING5_TO_SCORE100: Record<Rating5, number> = {
  1: 20,
  2: 40,
  3: 60,
  4: 80,
  5: 100,
};

const EQUIPMENT_COMPATIBILITY = {
  BASE: 80,
  ALL_OPTIONAL_AVAILABLE: 10,
  SOME_OPTIONAL_AVAILABLE: 5,
  FAST_SETUP_THRESHOLD_MINUTES: 2,
  FAST_SETUP_BONUS: 5,
  SLOW_SETUP_THRESHOLD_MINUTES: 8,
  SLOW_SETUP_PENALTY: -10,
} as const;

const PROGRESSION_VALUE = {
  NEUTRAL: 60,
  LOAD_INCREASE: 20,
  REPETITION_INCREASE: 10,
  SUBSTITUTION_PATH_EXISTS: 5,
} as const;

const PREFERENCE_BONUS = {
  PREFERRED_EXERCISE: 3,
  DISLIKED_EXERCISE: -3,
  PREFERRED_EQUIPMENT: 1,
  MIN_TOTAL: -5,
  MAX_TOTAL: 5,
} as const;

const SAFETY = {
  BASE: 90,
  CONTRAINDICATION_PENALTY: -10,
  CONTRAINDICATION_PENALTY_MAX_TOTAL: -20,
} as const;

const SAFETY_COMPLEXITY_ADJUSTMENT: Record<ExerciseComplexity, number> = {
  very_low: 5,
  low: 0,
  moderate: -5,
  high: -15,
  very_high: -25,
};

const SAFETY_CONNECTIVE_TISSUE_ADJUSTMENT: Record<Rating5, number> = {
  1: 0,
  2: -2,
  3: -5,
  4: -10,
  5: -15,
};

/** `inverted = INVERTED_RATING_BASE - rating`, used to flip soreness/stress into a readiness-positive direction. */
const INVERTED_RATING_BASE = 6;

const FATIGUE_COST_PENALTY_MIN = 0;
const FATIGUE_COST_PENALTY_MAX = 15;

/** Readiness-to-Demand Ratio bands (`16_SCORING_MODEL.md`), ordered from most to least favorable. */
const FATIGUE_COST_PENALTY_BANDS: ReadonlyArray<{ minRatio: number; penalty: number }> = [
  { minRatio: 1.2, penalty: 0 },
  { minRatio: 1.0, penalty: 2 },
  { minRatio: 0.85, penalty: 5 },
  { minRatio: 0.7, penalty: 9 },
  { minRatio: -Infinity, penalty: 15 },
];

const TECHNICAL_RISK_PENALTY_MIN = 0;
const TECHNICAL_RISK_PENALTY_MAX = 15;

const TECHNICAL_RISK_BASE_BY_COMPLEXITY: Record<ExerciseComplexity, number> = {
  very_low: 0,
  low: 1,
  moderate: 3,
  high: 6,
  very_high: 10,
};

const TECHNICAL_RISK_FATIGUE_ADJUSTMENT: Record<Rating5, number> = {
  1: 0,
  2: 0,
  3: 2,
  4: 4,
  5: 6,
};

/** Added once per movement pattern whose documented athlete level equals (not exceeds) the exercise's minimum. */
const TECHNICAL_RISK_LEVEL_AT_MINIMUM_PENALTY = 3;

/**
 * V0.1 convention mapping the 4-value `EvidenceLevel` (`types.ts`) onto the
 * 5-value `ConfidenceLevel` scale. `"very_low"` is deliberately never
 * produced in this version — see `21_DECISION_TRACE.md`/`16_SCORING_MODEL.md`
 * for the richer, undocumented-here confidence model this will eventually
 * need to account for (athlete-history completeness, data recency, etc.).
 */
const CONFIDENCE_BY_EVIDENCE_LEVEL: Record<EvidenceLevel, { factor: number; level: ConfidenceLevel }> = {
  level_1: { factor: 1.0, level: "very_high" },
  level_2: { factor: 0.8, level: "high" },
  level_3: { factor: 0.6, level: "moderate" },
  unknown: { factor: 0.4, level: "low" },
};

// -----------------------------------------------------------------------------
// Raw score
// -----------------------------------------------------------------------------

interface WeightedCriteria {
  objectiveRelevance: number;
  athleteCompatibility: number;
  transferValue: number;
  equipmentCompatibility: number;
  progressionValue: number;
  safety: number;
}

function computeRawScore(criteria: WeightedCriteria): number {
  const weightedSum =
    criteria.objectiveRelevance * CRITERION_WEIGHTS.objectiveRelevance +
    criteria.athleteCompatibility * CRITERION_WEIGHTS.athleteCompatibility +
    criteria.transferValue * CRITERION_WEIGHTS.transferValue +
    criteria.equipmentCompatibility * CRITERION_WEIGHTS.equipmentCompatibility +
    criteria.progressionValue * CRITERION_WEIGHTS.progressionValue +
    criteria.safety * CRITERION_WEIGHTS.safety;

  const totalWeight =
    CRITERION_WEIGHTS.objectiveRelevance +
    CRITERION_WEIGHTS.athleteCompatibility +
    CRITERION_WEIGHTS.transferValue +
    CRITERION_WEIGHTS.equipmentCompatibility +
    CRITERION_WEIGHTS.progressionValue +
    CRITERION_WEIGHTS.safety;

  return clamp(weightedSum / totalWeight, SCORE_MIN, SCORE_MAX);
}

// -----------------------------------------------------------------------------
// Objective relevance
// -----------------------------------------------------------------------------

function computeObjectiveRelevance(
  exercise: ExerciseDefinition,
  selectedModule: SelectedModule,
  reasons: string[],
): number {
  const moduleMatches = exercise.module === selectedModule.module;
  const adaptationMatches = exercise.primaryAdaptation === selectedModule.primaryAdaptation;
  const secondaryAdaptationMatches =
    exercise.secondaryAdaptations?.includes(selectedModule.primaryAdaptation) === true;

  let value: number;
  let explanation: string;

  if (moduleMatches && adaptationMatches) {
    value = OBJECTIVE_RELEVANCE.MODULE_AND_ADAPTATION_MATCH;
    explanation = `Exercise module and primary adaptation both match the selected module "${selectedModule.module}".`;
  } else if (moduleMatches) {
    value = OBJECTIVE_RELEVANCE.MODULE_MATCH_ONLY;
    explanation = `Exercise module matches "${selectedModule.module}", but its primary adaptation differs.`;
  } else if (adaptationMatches) {
    value = OBJECTIVE_RELEVANCE.ADAPTATION_MATCH_ONLY;
    explanation = `Exercise primary adaptation matches "${selectedModule.primaryAdaptation}", but its module differs from "${selectedModule.module}".`;
  } else if (secondaryAdaptationMatches) {
    value = OBJECTIVE_RELEVANCE.SECONDARY_ADAPTATION_MATCH;
    explanation = `Exercise secondary adaptations include "${selectedModule.primaryAdaptation}".`;
  } else {
    value = OBJECTIVE_RELEVANCE.NO_MATCH;
    explanation = `Exercise has no direct module or adaptation match with the selected module "${selectedModule.module}".`;
  }

  reasons.push(explanation);
  return value;
}

// -----------------------------------------------------------------------------
// Athlete compatibility
// -----------------------------------------------------------------------------

function computeAthleteCompatibility(exercise: ExerciseDefinition, input: EngineInput): number {
  let value = ATHLETE_COMPATIBILITY.NEUTRAL;

  const athleteLevelRank = ATHLETE_LEVEL_RANK[input.athleteProfile.experience.generalTrainingLevel];
  const complexityRank = EXERCISE_COMPLEXITY_RANK[exercise.complexity];
  const levelGap = complexityRank - athleteLevelRank;

  if (levelGap <= 0) {
    value += ATHLETE_COMPATIBILITY.LEVEL_MEETS_COMPLEXITY;
  } else if (levelGap === 1) {
    value += ATHLETE_COMPATIBILITY.LEVEL_GAP_ONE;
  } else {
    value += ATHLETE_COMPATIBILITY.LEVEL_GAP_TWO_OR_MORE;
  }

  const history = collectExerciseHistory(exercise.id, input.trainingHistory);

  const technicalQualityValues = history.map((entry) => entry.technicalQuality).filter(isDefinedNumber);
  if (technicalQualityValues.length > 0) {
    const average = mean(technicalQualityValues);
    if (average >= ATHLETE_COMPATIBILITY_HISTORY_THRESHOLDS.HIGH_TECHNICAL_QUALITY_MIN) {
      value += ATHLETE_COMPATIBILITY.HIGH_TECHNICAL_QUALITY_HISTORY;
    } else if (average <= ATHLETE_COMPATIBILITY_HISTORY_THRESHOLDS.LOW_TECHNICAL_QUALITY_MAX) {
      value += ATHLETE_COMPATIBILITY.LOW_TECHNICAL_QUALITY_HISTORY;
    }
  }

  const painValues = history.map((entry) => entry.painDuringExercise).filter(isDefinedNumber);
  if (painValues.length > 0) {
    const average = mean(painValues);
    if (average >= ATHLETE_COMPATIBILITY_HISTORY_THRESHOLDS.HIGH_PAIN_MIN) {
      value += ATHLETE_COMPATIBILITY.HIGH_PAIN_HISTORY;
    }
  }

  return clamp(value, SCORE_MIN, SCORE_MAX);
}

// -----------------------------------------------------------------------------
// Transfer value
// -----------------------------------------------------------------------------

function computeTransferValue(exercise: ExerciseDefinition, input: EngineInput, reasons: string[]): number {
  const primaryCombatSport = input.athleteProfile.experience.primaryCombatSport;
  if (primaryCombatSport === undefined) {
    return TRANSFER_VALUE_NEUTRAL;
  }

  const rating = exercise.combatSportRelevance?.[primaryCombatSport];
  if (rating === undefined) {
    return TRANSFER_VALUE_NEUTRAL;
  }

  const value = RATING5_TO_SCORE100[rating];
  reasons.push(`Combat transfer to "${primaryCombatSport}" rated ${rating}/5 (${value}/100).`);
  return value;
}

// -----------------------------------------------------------------------------
// Equipment compatibility
// -----------------------------------------------------------------------------

function computeEquipmentCompatibility(exercise: ExerciseDefinition, input: EngineInput): number {
  let value = EQUIPMENT_COMPATIBILITY.BASE;

  const optionalEquipment = exercise.optionalEquipment ?? [];
  if (optionalEquipment.length > 0) {
    const availableTypes = new Set(input.environment.availableEquipment.map((item) => item.type));
    const availableCount = optionalEquipment.filter((type) => availableTypes.has(type)).length;

    if (availableCount === optionalEquipment.length) {
      value += EQUIPMENT_COMPATIBILITY.ALL_OPTIONAL_AVAILABLE;
    } else if (availableCount > 0) {
      value += EQUIPMENT_COMPATIBILITY.SOME_OPTIONAL_AVAILABLE;
    }
  }

  const setupTimeMinutes = exercise.setupTimeMinutes;
  if (setupTimeMinutes !== undefined) {
    if (setupTimeMinutes <= EQUIPMENT_COMPATIBILITY.FAST_SETUP_THRESHOLD_MINUTES) {
      value += EQUIPMENT_COMPATIBILITY.FAST_SETUP_BONUS;
    } else if (setupTimeMinutes >= EQUIPMENT_COMPATIBILITY.SLOW_SETUP_THRESHOLD_MINUTES) {
      value += EQUIPMENT_COMPATIBILITY.SLOW_SETUP_PENALTY;
    }
  }

  return clamp(value, SCORE_MIN, SCORE_MAX);
}

// -----------------------------------------------------------------------------
// Progression value
// -----------------------------------------------------------------------------

function computeProgressionValue(exercise: ExerciseDefinition, input: EngineInput): number {
  let value = PROGRESSION_VALUE.NEUTRAL;

  const history = collectExerciseHistory(exercise.id, input.trainingHistory);

  const loadValues = history.map((entry) => entry.loadKg).filter(isDefinedNumber);
  if (loadValues.length >= 2 && loadValues[loadValues.length - 1] > loadValues[0]) {
    value += PROGRESSION_VALUE.LOAD_INCREASE;
  }

  const repetitionValues = history.map((entry) => entry.repetitionsCompleted).filter(isDefinedNumber);
  if (repetitionValues.length >= 2 && repetitionValues[repetitionValues.length - 1] > repetitionValues[0]) {
    value += PROGRESSION_VALUE.REPETITION_INCREASE;
  }

  if (exercise.substitutionExerciseIds !== undefined && exercise.substitutionExerciseIds.length > 0) {
    value += PROGRESSION_VALUE.SUBSTITUTION_PATH_EXISTS;
  }

  return clamp(value, SCORE_MIN, SCORE_MAX);
}

// -----------------------------------------------------------------------------
// Preference bonus
// -----------------------------------------------------------------------------

function computePreferenceBonus(exercise: ExerciseDefinition, input: EngineInput, reasons: string[]): number {
  const preferences = input.athleteProfile.preferences;
  if (preferences === undefined) {
    return 0;
  }

  let value = 0;

  if (preferences.preferredExerciseIds?.includes(exercise.id) === true) {
    value += PREFERENCE_BONUS.PREFERRED_EXERCISE;
    reasons.push(`Exercise "${exercise.id}" is on the athlete's preferred list.`);
  }

  if (preferences.dislikedExerciseIds?.includes(exercise.id) === true) {
    value += PREFERENCE_BONUS.DISLIKED_EXERCISE;
    reasons.push(`Exercise "${exercise.id}" is on the athlete's disliked list.`);
  }

  const preferredEquipment = preferences.preferredEquipment;
  if (preferredEquipment !== undefined && preferredEquipment.length > 0) {
    const exerciseEquipment = [...exercise.requiredEquipment, ...(exercise.optionalEquipment ?? [])];
    const hasPreferredEquipment = exerciseEquipment.some((type) => preferredEquipment.includes(type));
    if (hasPreferredEquipment) {
      value += PREFERENCE_BONUS.PREFERRED_EQUIPMENT;
      reasons.push(`Exercise uses at least one piece of equipment preferred by the athlete.`);
    }
  }

  return clamp(value, PREFERENCE_BONUS.MIN_TOTAL, PREFERENCE_BONUS.MAX_TOTAL);
}

// -----------------------------------------------------------------------------
// Safety
// -----------------------------------------------------------------------------

function computeSafety(exercise: ExerciseDefinition, input: EngineInput): number {
  let value = SAFETY.BASE;

  value += SAFETY_COMPLEXITY_ADJUSTMENT[exercise.complexity];
  value += SAFETY_CONNECTIVE_TISSUE_ADJUSTMENT[exercise.fatigueProfile.connectiveTissue];

  const activePainRegions = new Set<BodyRegion>(
    input.medicalState.painReports
      .filter((report) => report.status !== "resolved")
      .map((report) => report.region),
  );

  const activeRestrictionRegions = new Set<BodyRegion>(
    input.medicalState.restrictions
      .filter((restriction) => isRestrictionActive(restriction, input.request.requestedAt))
      .map((restriction) => restriction.region)
      .filter(isDefinedRegion),
  );

  let contraindicationPenalty = 0;
  for (const contraindication of exercise.contraindications) {
    if (contraindication.absolute) {
      continue;
    }
    const region = contraindication.region;
    if (region === undefined) {
      continue;
    }
    if (activePainRegions.has(region) || activeRestrictionRegions.has(region)) {
      contraindicationPenalty += SAFETY.CONTRAINDICATION_PENALTY;
    }
  }
  contraindicationPenalty = Math.max(contraindicationPenalty, SAFETY.CONTRAINDICATION_PENALTY_MAX_TOTAL);
  value += contraindicationPenalty;

  return clamp(value, SCORE_MIN, SCORE_MAX);
}

/** A restriction is active for this soft safety differentiation when it has not expired relative to the request date. */
function isRestrictionActive(restriction: AthleteRestriction, requestedAt: string): boolean {
  if (restriction.expiresAt === undefined) {
    return true;
  }
  return new Date(restriction.expiresAt).getTime() >= new Date(requestedAt).getTime();
}

// -----------------------------------------------------------------------------
// Fatigue cost penalty
// -----------------------------------------------------------------------------

function computeFatigueCostPenalty(exercise: ExerciseDefinition, input: EngineInput): number {
  const demandAverage = mean([
    exercise.fatigueProfile.neural,
    exercise.fatigueProfile.muscular,
    exercise.fatigueProfile.metabolic,
    exercise.fatigueProfile.connectiveTissue,
  ]);

  const readiness = input.readiness;
  const readinessAverage = mean([
    readiness.energy,
    readiness.perceivedRecovery,
    readiness.sleepQuality,
    invertRating(readiness.soreness),
    invertRating(readiness.stress),
  ]);

  const ratio = readinessAverage / demandAverage;

  const band =
    FATIGUE_COST_PENALTY_BANDS.find((candidate) => ratio >= candidate.minRatio) ??
    FATIGUE_COST_PENALTY_BANDS[FATIGUE_COST_PENALTY_BANDS.length - 1];

  return clamp(band.penalty, FATIGUE_COST_PENALTY_MIN, FATIGUE_COST_PENALTY_MAX);
}

function invertRating(rating: Rating5): number {
  return INVERTED_RATING_BASE - rating;
}

// -----------------------------------------------------------------------------
// Technical risk penalty
// -----------------------------------------------------------------------------

function computeTechnicalRiskPenalty(exercise: ExerciseDefinition, input: EngineInput): number {
  let value = TECHNICAL_RISK_BASE_BY_COMPLEXITY[exercise.complexity];
  value += TECHNICAL_RISK_FATIGUE_ADJUSTMENT[exercise.fatigueProfile.technical];

  const levelsByPattern = input.athleteProfile.experience.technicalLevelByPattern;
  if (levelsByPattern !== undefined) {
    for (const pattern of exercise.movementPatterns) {
      const athleteLevel = levelsByPattern[pattern];
      if (athleteLevel !== undefined && athleteLevel === exercise.minimumTechnicalLevel) {
        value += TECHNICAL_RISK_LEVEL_AT_MINIMUM_PENALTY;
      }
    }
  }

  return clamp(value, TECHNICAL_RISK_PENALTY_MIN, TECHNICAL_RISK_PENALTY_MAX);
}

// -----------------------------------------------------------------------------
// Deterministic ranking
// -----------------------------------------------------------------------------

function compareScoredExercises(a: ScoredExercise, b: ScoredExercise): number {
  return (
    b.finalScore - a.finalScore ||
    b.breakdown.safety - a.breakdown.safety ||
    b.breakdown.objectiveRelevance - a.breakdown.objectiveRelevance ||
    a.breakdown.technicalRiskPenalty - b.breakdown.technicalRiskPenalty ||
    b.breakdown.athleteCompatibility - a.breakdown.athleteCompatibility ||
    a.breakdown.fatigueCostPenalty - b.breakdown.fatigueCostPenalty ||
    a.exercise.id.localeCompare(b.exercise.id)
  );
}

// -----------------------------------------------------------------------------
// Shared helpers
// -----------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isDefinedNumber<T extends number>(value: T | undefined): value is T {
  return value !== undefined;
}

function isDefinedRegion(region: BodyRegion | undefined): region is BodyRegion {
  return region !== undefined;
}

/**
 * Every `CompletedExerciseSummary` across `trainingHistory.recentSessions`
 * whose `exerciseId` matches `exerciseId`, ordered chronologically by the
 * owning session's `completedAt` (ascending) so first/last comparisons in
 * `computeProgressionValue` are meaningful.
 */
function collectExerciseHistory(exerciseId: Identifier, trainingHistory: TrainingHistory): CompletedExerciseSummary[] {
  const entries: Array<{ completedAt: string; summary: CompletedExerciseSummary }> = [];
  for (const session of trainingHistory.recentSessions) {
    for (const summary of session.exercises ?? []) {
      if (summary.exerciseId === exerciseId) {
        entries.push({ completedAt: session.completedAt, summary });
      }
    }
  }
  entries.sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  return entries.map((entry) => entry.summary);
}
