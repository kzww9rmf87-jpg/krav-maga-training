/**
 * Combat Athlete System — Athlete Capability
 * Version 0.1
 *
 * What an athlete can currently DO, expressed as evidence rather than as a
 * label.
 *
 * THE PRODUCT BLOCKER THIS EXISTS FOR. CAS now produces a useful bodyweight
 * hypertrophy session, and prescribes the same push-up set to an athlete who
 * can perform six repetitions and to one who can perform twenty. The second
 * athlete is nowhere near the prescribed proximity to failure, and no amount of
 * selection or sequencing work can fix that: the engine has never been told what
 * the athlete can do.
 *
 * WHAT THIS FILE IS NOT. It is not a fitness level. `beginner`/`intermediate`/
 * `advanced` would hide the evidence behind a word, and CAS would then be
 * reasoning about the word. Every state here is derived from a MEASUREMENT, for
 * ONE exercise, against THAT exercise's own documented prescription range.
 *
 * THE DIVISION OF LABOUR, which this lot fixes in writing:
 *
 *     CAS interprets capability.
 *     VITA collects capability evidence.
 *
 * VITA decides how to ask an athlete how many push-ups they can do. It never
 * decides what the answer means.
 */

import type { Identifier } from "./types";
import type {
  IntensityRangeRule,
  NumericalPrescriptionProfile,
} from "./prescription/prescriptionKnowledge";

// -----------------------------------------------------------------------------
// Observation types
// -----------------------------------------------------------------------------

/**
 * The kinds of performance evidence CAS can currently interpret.
 *
 * DELIBERATELY TWO. The capability question this lot answers — "has this
 * variation become too easy?" — is only answerable where the prescription is a
 * REPETITION range, because the comparison is between repetitions the athlete
 * can perform and repetitions the profile asks for.
 *
 * `timed_hold` was considered and left out. The same rule would apply to a
 * `sets_duration` exercise (`hollow_body_hold`, `pallof_press`, `dead_bug`),
 * and the mechanism would be identical — but no chapter in this repository
 * documents what a "too easy" isometric hold is, and the numerical profiles
 * express holds as a duration range without a proximity-to-failure companion
 * like RIR. Adding the type without the rule would be a field CAS cannot
 * interpret.
 *
 * The nine `IntensityReferenceType` values remain untouched and remain the
 * canonical way to express a LOAD (a tested one-rep max, a training max, a
 * baseline velocity). A repetition capacity is not a load and must never reach
 * `resolveIntensity`, which is exactly why this vocabulary is separate rather
 * than a tenth member of that one.
 */
export type CapabilityObservationType =
  /**
   * The most repetitions the athlete can perform of this exercise at the
   * documented technical standard. Bodyweight movements: push-ups, pull-ups,
   * split squats, single-leg hip thrusts.
   */
  | "max_repetitions"
  /**
   * Repetitions completed at a stated external load. Implement movements:
   * dumbbell bench press, dumbbell Romanian deadlift, goblet squat.
   */
  | "repetitions_at_load";

/**
 * Where the evidence came from.
 *
 * Kept as a STRUCTURAL fact, not a numerical confidence score: no document in
 * this repository states how much more a measured test is worth than a
 * self-report, and inventing a weighting would be inventing doctrine. The
 * provenance travels with the observation so a later rule can use it.
 */
export type CapabilityObservationProvenance =
  /** A deliberate test, performed to measure this. */
  | "measured_test"
  /** Recorded during a CAS session the athlete actually completed. */
  | "completed_session"
  /** The athlete's own statement, not observed. */
  | "self_reported";

/** Which side a unilateral observation refers to. */
export type CapabilityObservationSide = "left" | "right" | "both";

/**
 * One piece of evidence about one exercise.
 *
 * BINDING IS BY EXACT CANONICAL EXERCISE, and nothing weaker. A push-up
 * observation is evidence about push-ups. It is not evidence about bench
 * pressing, not a "horizontal push score", and not a general upper-body rating.
 * A pull-up maximum is not a vertical-pull score that a row could borrow.
 *
 * No implicit transfer exists anywhere in this file. Transfer between exercises
 * is a training claim, it would need a source, and none of the chapters in this
 * repository makes one.
 */
export interface CapabilityObservation {
  exerciseId: Identifier;
  observationType: CapabilityObservationType;
  /** Repetitions performed. Required by both current observation types. */
  repetitions: number;
  /** External load, for `repetitions_at_load`. `null` for bodyweight work. */
  loadValue: number | null;
  /** Unit of `loadValue`. Required whenever a load is given. */
  loadUnit: string | null;
  /** Repetitions in reserve at the end of the set, when actually observed. */
  repetitionsInReserve: number | null;
  side: CapabilityObservationSide;
  provenance: CapabilityObservationProvenance;
  /** ISO-8601 instant. `null` when the platform did not record one. */
  observedAt: string | null;
}

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

export type CapabilityObservationRejectionCode =
  | "NON_POSITIVE_REPETITIONS"
  | "NON_INTEGER_REPETITIONS"
  | "LOAD_REQUIRED_FOR_TYPE"
  | "LOAD_UNIT_MISSING"
  | "LOAD_FORBIDDEN_FOR_TYPE"
  | "NEGATIVE_LOAD"
  | "RIR_OUT_OF_BOUNDS"
  | "UNKNOWN_EXERCISE";

export interface RejectedCapabilityObservation {
  exerciseId: Identifier;
  code: CapabilityObservationRejectionCode;
  reason: string;
}

/** RIR is a count of repetitions held back, so it cannot be negative. */
export const MAXIMUM_PLAUSIBLE_RIR = 10;

/**
 * Whether an observation is structurally usable.
 *
 * A rejected observation is REPORTED, never silently dropped and never
 * repaired: an implausible measurement is a fact about the platform's data, and
 * quietly discarding it would hide that.
 */
export function validateObservation(
  observation: CapabilityObservation,
  isKnownExercise: (exerciseId: Identifier) => boolean,
): RejectedCapabilityObservation | null {
  const reject = (code: CapabilityObservationRejectionCode, reason: string): RejectedCapabilityObservation => ({
    exerciseId: observation.exerciseId,
    code,
    reason,
  });

  if (!isKnownExercise(observation.exerciseId)) {
    return reject(
      "UNKNOWN_EXERCISE",
      `No catalogued exercise is named "${observation.exerciseId}", so this observation binds to nothing.`,
    );
  }
  if (!Number.isInteger(observation.repetitions)) {
    return reject("NON_INTEGER_REPETITIONS", "A repetition count must be a whole number.");
  }
  if (observation.repetitions <= 0) {
    return reject("NON_POSITIVE_REPETITIONS", "A repetition count must be greater than zero.");
  }

  if (observation.observationType === "repetitions_at_load") {
    if (observation.loadValue === null) {
      return reject("LOAD_REQUIRED_FOR_TYPE", 'A "repetitions_at_load" observation must state the load used.');
    }
    if (observation.loadValue < 0) {
      return reject("NEGATIVE_LOAD", "A load cannot be negative.");
    }
    if (observation.loadUnit === null || observation.loadUnit.length === 0) {
      return reject("LOAD_UNIT_MISSING", "A load without a unit cannot be interpreted.");
    }
  } else if (observation.loadValue !== null) {
    return reject(
      "LOAD_FORBIDDEN_FOR_TYPE",
      'A "max_repetitions" observation describes bodyweight capacity and carries no external load.',
    );
  }

  if (observation.repetitionsInReserve !== null) {
    if (observation.repetitionsInReserve < 0 || observation.repetitionsInReserve > MAXIMUM_PLAUSIBLE_RIR) {
      return reject(
        "RIR_OUT_OF_BOUNDS",
        `Repetitions in reserve must lie between 0 and ${MAXIMUM_PLAUSIBLE_RIR}.`,
      );
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// Capability state
// -----------------------------------------------------------------------------

/**
 * What CAS can say about one exercise for one athlete.
 *
 * Always about ONE EXERCISE. There is deliberately no athlete-level state: an
 * athlete who can perform twenty push-ups may manage two pull-ups, and a single
 * label would be false about at least one of them.
 */
export type CapabilityState =
  /** No usable observation for this exercise. */
  | "insufficient_evidence"
  /**
   * The demonstrated capacity cannot satisfy the prescription envelope.
   *
   * NOT "this exercise is forbidden". It means the athlete cannot currently
   * perform even the easiest valid point of the prescription — the minimum
   * repetitions with the minimum repetitions in reserve — so the envelope as
   * requested does not fit them today.
   */
  | "below_prescription_range"
  /** The prescription is reachable at the prescribed effort. */
  | "within_prescription_range"
  /** The prescription can no longer reach the prescribed proximity to failure. */
  | "above_prescription_range"
  /** The observation exists but cannot be compared with this prescription. */
  | "incompatible_observation";

export type CapabilityRuleId =
  | "capability_insufficient_evidence"
  | "capability_within_prescription_range"
  | "capability_below_prescription_range"
  | "capability_above_prescription_range"
  | "capability_incompatible_observation";

export interface CapabilityAssessment {
  exerciseId: Identifier;
  state: CapabilityState;
  ruleId: CapabilityRuleId;
  /** The observation the state was derived from, when there was one. */
  observation: CapabilityObservation | null;
  /** The window the observation was compared against. `null` without a profile. */
  prescriptionWindow: PrescriptionRepetitionWindow | null;
  sourceRuleIds: readonly Identifier[];
  description: string;
}

/**
 * The demonstrated repetition capacity a profile's prescription envelope needs.
 *
 * ONE RELATION GOVERNS BOTH BOUNDS. To perform N repetitions with R held back,
 * an athlete's maximum must be at least N + R. Applied to the two ends of the
 * envelope:
 *
 * - `minimum` = minimum prescribed repetitions + MINIMUM repetitions in
 *   reserve. This is the easiest valid point of the prescription. An athlete
 *   below it cannot satisfy even that, so the envelope as requested does not fit
 *   them.
 *
 * - `maximum` = maximum prescribed repetitions + MAXIMUM repetitions in
 *   reserve. This is the hardest valid point. An athlete above it cannot reach
 *   the prescribed proximity to failure ANYWHERE in the range, so every
 *   prescribed set would be easier than prescribed.
 *
 * Lot H2.5A derived the lower bound from the repetition minimum alone, which was
 * asymmetric: it compared a capacity against a repetition count while the upper
 * bound compared a capacity against a capacity. Six push-ups was called
 * "within", when six repetitions at RIR 1 needs a maximum of seven.
 *
 * | Profile | Repetitions | RIR | Window |
 * | --- | --- | --- | --- |
 * | `functional_hypertrophy_primary_v0_1` | 6-12 | 1-3 | 7-15 |
 * | `strength_primary_straight_sets_v0_1` | 3-6 | 1-3 | 4-9 |
 *
 * NO NUMBER IS CHOSEN HERE. A profile with no RIR rule contributes no reserve at
 * either end and its window is simply its repetition range — nothing is invented
 * to fill the gap.
 */
export interface PrescriptionRepetitionWindow {
  minimum: number;
  maximum: number;
  profileId: Identifier;
}

const CAPABILITY_SOURCE: Identifier = "34_NUMERICAL_PRESCRIPTION_TABLES_V0_1";
const INTENSITY_SOURCE: Identifier = "26_INTENSITY_MODEL_V0_1";

/**
 * The useful repetition window of a profile, or `null` when the profile does not
 * prescribe repetitions at all.
 */
export function prescriptionRepetitionWindow(profile: NumericalPrescriptionProfile): PrescriptionRepetitionWindow | null {
  const repetitions = profile.volume.repetitions;
  if (repetitions === null || repetitions.type !== "fixed_range") {
    return null;
  }

  // `NumericalIntensityRule` is a union, and only its RANGE variant carries
  // bounds — a categorical rule (`movement_intent`, `technical_effort`) has no
  // maximum to read. Narrowing rather than casting keeps the compiler's guard.
  // `NumericalIntensityRule` is a union, and only its RANGE variant carries
  // bounds — a categorical rule (`movement_intent`, `technical_effort`) has no
  // maximum to read. Both variants share `type`, so the discriminant is the
  // PRESENCE of `max` rather than the type name.
  const rirRule = profile.intensity.find(
    (rule): rule is IntensityRangeRule => rule.type === "rir" && "max" in rule,
  );
  // A profile with no documented reserve contributes none at either end.
  const minimumReserve = rirRule?.min ?? 0;
  const maximumReserve = rirRule?.max ?? 0;

  return {
    minimum: repetitions.range.min + minimumReserve,
    maximum: repetitions.range.max + maximumReserve,
    profileId: profile.profileId,
  };
}

// -----------------------------------------------------------------------------
// Assessment
// -----------------------------------------------------------------------------

export interface CapabilityAssessmentInput {
  exerciseId: Identifier;
  /** The observation bound to THIS exercise, if the athlete has one. */
  observation: CapabilityObservation | null;
  /** The profile this exercise resolves, when it has one. */
  profile: NumericalPrescriptionProfile | null;
}

/**
 * Assesses one exercise for one athlete.
 *
 * ASSESSMENT ONLY. This function says whether the current variation is
 * reachable, too hard or too easy. It does NOT choose a progression, does not
 * name a harder variation, and does not change a dose. That separation is the
 * point of the lot: deciding that push-ups have become too easy and deciding
 * what to do about it are different decisions, and the second needs a
 * progression graph this repository does not yet represent.
 *
 * Deterministic and pure: no clock, no randomness, same input same answer.
 */
export function assessCapability(input: CapabilityAssessmentInput): CapabilityAssessment {
  const { exerciseId, observation, profile } = input;

  if (observation === null) {
    return {
      exerciseId,
      state: "insufficient_evidence",
      ruleId: "capability_insufficient_evidence",
      observation: null,
      prescriptionWindow: null,
      sourceRuleIds: [CAPABILITY_SOURCE],
      description: `No usable capability observation is recorded for "${exerciseId}", so its difficulty for this athlete is unknown.`,
    };
  }

  const range = profile === null ? null : prescriptionRepetitionWindow(profile);
  if (range === null) {
    return {
      exerciseId,
      state: "incompatible_observation",
      ruleId: "capability_incompatible_observation",
      observation,
      prescriptionWindow: null,
      sourceRuleIds: [CAPABILITY_SOURCE],
      description: `"${exerciseId}" is not prescribed as a repetition range, so a repetition observation cannot be compared with it.`,
    };
  }

  if (observation.repetitions < range.minimum) {
    return {
      exerciseId,
      state: "below_prescription_range",
      ruleId: "capability_below_prescription_range",
      observation,
      prescriptionWindow: range,
      sourceRuleIds: [CAPABILITY_SOURCE, INTENSITY_SOURCE],
      description: `The athlete performs ${observation.repetitions} repetition(s) of "${exerciseId}", below the ${range.minimum} needed for the easiest valid point of its prescription (${range.profileId} prescribes its minimum repetitions with at least its minimum repetitions in reserve). The exercise is not forbidden; this prescription envelope does not fit the athlete today.`,
    };
  }

  if (observation.repetitions > range.maximum) {
    return {
      exerciseId,
      state: "above_prescription_range",
      ruleId: "capability_above_prescription_range",
      observation,
      prescriptionWindow: range,
      sourceRuleIds: [CAPABILITY_SOURCE, INTENSITY_SOURCE],
      description: `The athlete performs ${observation.repetitions} repetition(s) of "${exerciseId}", beyond the ${range.maximum} its prescription can still challenge (${range.profileId} prescribes up to its maximum repetitions plus its maximum repetitions in reserve). Every prescribed set would be easier than prescribed.`,
    };
  }

  return {
    exerciseId,
    state: "within_prescription_range",
    ruleId: "capability_within_prescription_range",
    observation,
    prescriptionWindow: range,
    sourceRuleIds: [CAPABILITY_SOURCE, INTENSITY_SOURCE],
    description: `The athlete performs ${observation.repetitions} repetition(s) of "${exerciseId}", inside the ${range.minimum}-${range.maximum} window its prescription can challenge.`,
  };
}

// -----------------------------------------------------------------------------
// Binding
// -----------------------------------------------------------------------------

/**
 * The observation bound to `exerciseId`, or `null`.
 *
 * EXACT MATCH ONLY, and this is the whole binding rule. When several
 * observations name the same exercise the LAST one wins, because the input list
 * is the platform's own order and the most recently supplied statement is the
 * one it means. No date comparison is used for this: `observedAt` is optional,
 * and ordering by an absent field would be arbitrary.
 */
export function observationFor(
  exerciseId: Identifier,
  observations: readonly CapabilityObservation[],
): CapabilityObservation | null {
  let found: CapabilityObservation | null = null;
  for (const observation of observations) {
    if (observation.exerciseId === exerciseId) {
      found = observation;
    }
  }
  return found;
}

// -----------------------------------------------------------------------------
// Staleness — deliberately unresolved
// -----------------------------------------------------------------------------

/**
 * There is NO age-based staleness rule here, and that is a decision rather than
 * an omission.
 *
 * `deriveAthleteReferences.ts` already carries the one staleness rule this
 * repository documents: a reference whose `validUntil` is before the request
 * date is expired and unused. It is an EXPLICIT expiry the platform records, not
 * an age the engine guesses.
 *
 * No document defines how long a repetition maximum stays true. A push-up
 * maximum from three months ago may be exactly right or badly out of date, and
 * "30 days" would be a number this file invented — precisely what a knowledge
 * base cannot recover from.
 *
 * So `observedAt` is carried, preserved and published in the trace, and no rule
 * acts on it. When a source documents a decay, the rule belongs here.
 */
export const OBSERVATION_STALENESS_IS_UNRESOLVED = true;
