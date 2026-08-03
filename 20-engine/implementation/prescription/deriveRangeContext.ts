/**
 * Combat Athlete System — Readiness → Range Context Derivation
 * Version 0.1
 *
 * `RangeContext` decides which value is taken out of every numerical range
 * the prescription resolves — `reduced` takes the minimum, `normal` the
 * normal, `high` the maximum (`selectRangeValue`, `prescriptionKnowledge.ts`).
 * It therefore sets the dose of sets, repetitions, duration, distance,
 * intensity and rest for the whole session.
 *
 * Before this file the caller supplied that value. Choosing whether an
 * athlete trains at the bottom or the middle of every documented range is a
 * training decision — arguably the most consequential one the prescription
 * layer makes — and it belongs to CAS, never to the platform calling it.
 * This file derives it from the athlete's validated `ReadinessState`.
 *
 * WHAT IS DOCUMENTED AND WHAT IS AN ENGINEERING DECISION. The project rule
 * is that the two must never be blurred, so they are separated explicitly:
 *
 * - DOCUMENTED (`35_PRESCRIPTION_ADJUSTMENT_RULES.md`, "Readiness Model"
 *   and "Readiness Adjustment Table"): the five-value readiness vocabulary;
 *   that normal readiness uses the normal profile value and applies no
 *   adjustment; that reduced readiness "may select the lower valid boundary
 *   of a numerical range"; that low readiness uses the "minimum valid
 *   dose"; that high readiness "does not automatically authorize
 *   progression" and that "without all progression conditions, no increase
 *   is permitted"; that blocked readiness is a session-outcome state the
 *   prescription layer must not override.
 * - DOCUMENTED (`16_SCORING_MODEL.md` via `scoringEngine.ts`): which
 *   `ReadinessState` fields aggregate into a readiness figure, and that
 *   soreness and stress are inverted before averaging.
 * - ENGINEERING DECISION, made here and owned here: the numeric boundaries
 *   between the levels. No document gives them. They are stated as whole
 *   points on the native 1–5 rating scale precisely so they can be
 *   challenged as one decision rather than hunted for inline, and they are
 *   not presented as a physiological fact.
 *
 * This file never reads equipment, never reads the request, never selects
 * or substitutes an exercise, and never blocks a session.
 */

import type { Identifier, Rating5, ReadinessState } from "../types";
import type { RangeContext } from "./prescriptionKnowledge";

// -----------------------------------------------------------------------------
// Vocabulary
// -----------------------------------------------------------------------------

/**
 * The readiness vocabulary of `35_PRESCRIPTION_ADJUSTMENT_RULES.md`, minus
 * `blocked`.
 *
 * `blocked` is deliberately absent rather than declared and never produced.
 * That chapter defines it as a SESSION outcome — "no normal training
 * prescription may be generated ... otherwise the session outcome must be
 * blocked" — and states in the same section that "the prescription layer
 * must not override the existing engine blocked state". Blocking is
 * `sessionGenerator.ts`'s decision, taken on module and exercise
 * availability; the engine has no readiness-based blocking rule in V0.1 and
 * this file does not invent one. Returning `blocked` here would either be
 * inert or would let the dosing layer refuse a session the engine accepted.
 */
export type ReadinessLevel = "high" | "normal" | "reduced" | "low";

const SOURCE_ADJUSTMENT_RULES: Identifier = "35_PRESCRIPTION_ADJUSTMENT_RULES_V0_1";
const SOURCE_SCORING_MODEL: Identifier = "16_SCORING_MODEL_V0_1";

// -----------------------------------------------------------------------------
// Aggregation
// -----------------------------------------------------------------------------

/**
 * `soreness` and `stress` are reported so that a HIGHER rating is a WORSE
 * state, unlike every other field here. `6 - rating` flips them onto the
 * same "higher is better" direction before averaging.
 *
 * The constant and the formula mirror `scoringEngine.ts`'s
 * `INVERTED_RATING_BASE`/`invertRating` exactly. They are restated rather
 * than imported so that this derivation carries no dependency on the
 * scoring layer — `readinessAggregateMatchesScoringEngine` in the tests
 * pins the two to the same value so they cannot silently drift apart.
 */
const INVERTED_RATING_BASE = 6;

const invertRating = (rating: Rating5): number => INVERTED_RATING_BASE - rating;

/**
 * The five `ReadinessState` fields the engine already treats as readiness,
 * in the order `scoringEngine.ts` averages them.
 *
 * `motivation` and `coordination` are excluded, exactly as the scoring
 * engine excludes them: neither is a recovery signal, and a motivated but
 * unrecovered athlete must not be dosed upward for enthusiasm.
 * `readinessScore`, `sleepHours`, `restingHeartRateBpm` and the other
 * optional fields are also excluded — `19_ENGINE_INPUT_SCHEMA.md` requires
 * a supplied `readinessScore` and the categorical level to "remain
 * consistent" but documents no mapping between them, and reading it here
 * would create a second, possibly disagreeing source of truth for the same
 * athlete. That is a real limitation, recorded rather than papered over.
 */
export interface ReadinessFieldContribution {
  field: "energy" | "perceivedRecovery" | "sleepQuality" | "soreness" | "stress";
  reportedRating: Rating5;
  /** The value actually averaged — inverted for `soreness` and `stress`. */
  contributedValue: number;
  inverted: boolean;
}

function collectContributions(readiness: ReadinessState): ReadinessFieldContribution[] {
  return [
    { field: "energy", reportedRating: readiness.energy, contributedValue: readiness.energy, inverted: false },
    {
      field: "perceivedRecovery",
      reportedRating: readiness.perceivedRecovery,
      contributedValue: readiness.perceivedRecovery,
      inverted: false,
    },
    {
      field: "sleepQuality",
      reportedRating: readiness.sleepQuality,
      contributedValue: readiness.sleepQuality,
      inverted: false,
    },
    {
      field: "soreness",
      reportedRating: readiness.soreness,
      contributedValue: invertRating(readiness.soreness),
      inverted: true,
    },
    {
      field: "stress",
      reportedRating: readiness.stress,
      contributedValue: invertRating(readiness.stress),
      inverted: true,
    },
  ];
}

// -----------------------------------------------------------------------------
// Level boundaries — the engineering decision of this file
// -----------------------------------------------------------------------------

/**
 * Boundaries on the aggregate, which lives on the native 1–5 `Rating5`
 * scale (1 = worst, 5 = best, 3 = the neutral midpoint the engine's own
 * fixtures use for an unremarkable day).
 *
 * NO DOCUMENT GIVES THESE NUMBERS. They are an engineering decision, taken
 * here so that V0.1 can dose at all, and deliberately expressed as whole
 * rating points: each band is exactly one point wide, the neutral all-3s
 * athlete lands exactly on `normal`, and an athlete one full point below
 * neutral on average lands on `reduced`. Nothing about them is claimed to
 * be physiological.
 *
 * They are also deliberately CONSERVATIVE in one direction only: because
 * `high` cannot increase any dose in V0.1 (see `RANGE_CONTEXT_BY_LEVEL`),
 * getting the upper boundary wrong changes nothing an athlete experiences,
 * while getting the lower boundaries wrong changes real load. The bands
 * that matter are therefore the two lower ones.
 */
const LEVEL_BOUNDARIES: ReadonlyArray<{ minimumAggregate: number; level: ReadinessLevel }> = [
  { minimumAggregate: 4, level: "high" },
  { minimumAggregate: 3, level: "normal" },
  { minimumAggregate: 2, level: "reduced" },
  { minimumAggregate: Number.NEGATIVE_INFINITY, level: "low" },
];

/**
 * Level → `RangeContext`, entirely from `35_PRESCRIPTION_ADJUSTMENT_RULES.md`.
 *
 * `high → "normal"` is the one mapping that looks surprising and is the most
 * strictly documented: "High readiness does not automatically authorize
 * progression", the high boundary is allowed "only when a documented
 * progression rule is active", and "without all progression conditions, no
 * increase is permitted". The conditions that chapter lists — an active
 * documented progression rule, valid recent training history, sufficient
 * session duration, no medical or recovery cap — do not exist in V0.1: there
 * is no progression model, and session duration is unresolved. So no
 * increase is permitted, and `"high"` is never produced by this engine
 * today. The level is still computed and reported, because it is what the
 * athlete's readiness actually is and because the day a progression rule
 * exists, only this table changes.
 *
 * `low → "reduced"` is a floor, not an equivalence. The chapter asks for the
 * "minimum valid dose" at low readiness, and `RangeContext` has no value
 * below `reduced` — the minimum of every range IS what `reduced` selects, so
 * the dose is right. What is NOT implemented is the rest of that chapter's
 * low-readiness hierarchy (remove optional exercises, reduce accessory then
 * secondary then primary work, use a lower-fatigue method, substitute,
 * remove a module, fail safely). Those are selection and session-assembly
 * decisions, not range selection, and none is attempted here.
 */
const RANGE_CONTEXT_BY_LEVEL: Readonly<Record<ReadinessLevel, RangeContext>> = {
  high: "normal",
  normal: "normal",
  reduced: "reduced",
  low: "reduced",
};

/**
 * Level → the range context REST must use, which is not the same value.
 *
 * A single `RangeContext` cannot express the Readiness Adjustment Table,
 * because rest moves in the opposite direction to everything else in it:
 *
 *   Reduced Context   sets: lower · repetitions/duration: normal or lower
 *                     intensity: lower · REST: normal or UPPER boundary
 *   Low Context       sets: minimum · repetitions/duration: minimum
 *                     intensity: minimum · REST: UPPER valid boundary
 *
 * `selectRangeValue` applies one context uniformly, so deriving `"reduced"`
 * and letting it reach the rest resolver would take the MINIMUM of every
 * rest range — shortening recovery for exactly the athlete who has least of
 * it. Across the 23 numerical profiles, 21 have a rest range whose minimum
 * is below its normal value, so this is systematic rather than incidental
 * (`grip_repetition_strength_v0_1`, for one, would fall from 165s to 90s).
 *
 * This table is therefore the second half of the same documented rule, not
 * a new decision: reduced readiness holds rest at normal, low readiness
 * takes the upper boundary. `high` is `"normal"` for the same reason the
 * dose context is — no progression rule is active — and holding rest at its
 * normal value is what "preserve the normal base prescription" asks for.
 */
const REST_RANGE_CONTEXT_BY_LEVEL: Readonly<Record<ReadinessLevel, RangeContext>> = {
  high: "normal",
  normal: "normal",
  reduced: "normal",
  low: "high",
};

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

export interface RangeContextDecision {
  /** The athlete's readiness level, before any V0.1 restriction is applied. */
  level: ReadinessLevel;
  /** The value the prescription layer uses for volume and intensity. */
  rangeContext: RangeContext;
  /**
   * The value the prescription layer uses for REST, which is not always
   * `rangeContext` — see `REST_RANGE_CONTEXT_BY_LEVEL`. Reduced readiness
   * holds rest at normal and low readiness lengthens it, per the
   * Readiness Adjustment Table.
   */
  restRangeContext: RangeContext;
  /** Mean of the five contributions, on the 1–5 scale. Rounded to two decimals for stable reporting. */
  aggregate: number;
  contributions: readonly ReadinessFieldContribution[];
  /** Human-readable, deterministic explanation — ready for a Decision Trace entry. */
  reasons: readonly string[];
  sourceRuleIds: readonly Identifier[];
}

/**
 * Derives the session's `RangeContext` from `readiness`.
 *
 * Pure and deterministic: the same `ReadinessState` always produces the same
 * decision, including the same `reasons` in the same order. `readiness` is
 * never mutated, and no clock, randomness or ambient state is read.
 */
export function deriveRangeContext(readiness: ReadinessState): RangeContextDecision {
  const contributions = collectContributions(readiness);
  const aggregate =
    Math.round(
      (contributions.reduce((total, contribution) => total + contribution.contributedValue, 0) /
        contributions.length) *
        100,
    ) / 100;

  const level =
    LEVEL_BOUNDARIES.find((boundary) => aggregate >= boundary.minimumAggregate)?.level ??
    LEVEL_BOUNDARIES[LEVEL_BOUNDARIES.length - 1].level;

  const rangeContext = RANGE_CONTEXT_BY_LEVEL[level];
  const restRangeContext = REST_RANGE_CONTEXT_BY_LEVEL[level];

  return {
    level,
    rangeContext,
    restRangeContext,
    aggregate,
    contributions,
    reasons: buildReasons(level, rangeContext, restRangeContext, aggregate, contributions),
    sourceRuleIds: [SOURCE_ADJUSTMENT_RULES, SOURCE_SCORING_MODEL],
  };
}

function buildReasons(
  level: ReadinessLevel,
  rangeContext: RangeContext,
  restRangeContext: RangeContext,
  aggregate: number,
  contributions: readonly ReadinessFieldContribution[],
): string[] {
  const detail = contributions
    .map(
      (contribution) =>
        `${contribution.field}=${contribution.reportedRating}${contribution.inverted ? ` (inverted to ${contribution.contributedValue})` : ""}`,
    )
    .join(", ");

  const reasons = [
    `Readiness aggregate ${aggregate.toFixed(2)}/5 from ${detail}.`,
    `Readiness level "${level}" (${describeBand(level)}).`,
    `Range context "${rangeContext}": ${describeRangeContext(level)}`,
    `Rest range context "${restRangeContext}": ${describeRestRangeContext(level)}`,
  ];

  return reasons;
}

function describeBand(level: ReadinessLevel): string {
  switch (level) {
    case "high":
      return "aggregate at or above 4";
    case "normal":
      return "aggregate at or above 3";
    case "reduced":
      return "aggregate at or above 2";
    case "low":
      return "aggregate below 2";
  }
}

function describeRangeContext(level: ReadinessLevel): string {
  if (level === "high") {
    return "high readiness does not authorize progression on its own, and no documented progression rule is active in engine version 0.1, so the normal profile value is preserved.";
  }
  if (level === "normal") {
    return "the normal profile value is used and no readiness adjustment is applied.";
  }
  if (level === "reduced") {
    return "the lower boundary of each numerical range is selected.";
  }
  return "the lower boundary of each numerical range is selected, which is the minimum dose this engine version can express; the wider low-readiness protections (removing optional work, substituting, reducing the session) are not implemented in engine version 0.1.";
}

// -----------------------------------------------------------------------------
// Introspection (documentation and tests, never a decision input)
// -----------------------------------------------------------------------------

function describeRestRangeContext(level: ReadinessLevel): string {
  switch (level) {
    case "high":
    case "normal":
      return "rest keeps its normal profile value.";
    case "reduced":
      return "rest is held at its normal value rather than shortened — the Readiness Adjustment Table gives reduced readiness \"normal or upper\" rest, never the lower boundary.";
    case "low":
      return "rest takes the upper boundary of its range, as the Readiness Adjustment Table requires at low readiness.";
  }
}

/** The level boundaries, exported so a test can pin them rather than restate them. */
export const READINESS_LEVEL_BOUNDARIES = LEVEL_BOUNDARIES;

/** The documented level → `RangeContext` mapping for volume and intensity. */
export const RANGE_CONTEXT_BY_READINESS_LEVEL = RANGE_CONTEXT_BY_LEVEL;

/** The documented level → `RangeContext` mapping for rest. */
export const REST_RANGE_CONTEXT_BY_READINESS_LEVEL = REST_RANGE_CONTEXT_BY_LEVEL;
