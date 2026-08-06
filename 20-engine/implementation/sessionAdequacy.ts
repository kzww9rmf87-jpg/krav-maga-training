/**
 * Combat Athlete System — Session Adequacy
 * Version 0.1
 *
 * Asks the one question the pipeline never asked: once the session has been
 * selected, composed, prescribed and timed, IS IT ACTUALLY THE SESSION THAT
 * WAS REQUESTED?
 *
 * WHY THIS FILE EXISTS. A real request — maximum strength, 30 minutes,
 * bodyweight only — returned a contract-valid draft containing one exercise:
 * Neck Training, 8 minutes, no conflict, no warning. Every stage had done its
 * job correctly. Neck Training is genuinely eligible, genuinely prescribable,
 * and its knowledge-base `primaryAdaptation` genuinely reads
 * `maximum_strength`. Nothing in the pipeline was in a position to notice that
 * a neck isometric is not a maximum-strength session.
 *
 * FOUR DIFFERENT QUESTIONS, previously collapsed into two:
 *
 * - ELIGIBILITY — can this athlete perform this exercise under the current
 *   constraints? (`exerciseSelector.ts`)
 * - PRESCRIPTION FEASIBILITY — can CAS safely and deterministically prescribe
 *   it? (`prescription/`)
 * - ADAPTATION COVERAGE — does the resulting session still meaningfully train
 *   the requested adaptation? (here)
 * - COMPOSITION ADEQUACY — is the whole session coherent and useful? (here)
 *
 * An exercise can pass the first two and the session still fail the last two.
 * That is exactly what happened.
 *
 * WHAT THIS FILE IS NOT ALLOWED TO CONCLUDE. `18_SESSION_GENERATION_PIPELINE.md`
 * ("Minimum Effective Session Principle") forbids adding exercises because
 * "time remains", and states that "a shorter valid session is superior to a
 * longer incoherent session". So SHORTNESS IS NOT THE OFFENCE. A 20-minute
 * session that genuinely delivers maximum strength is a correct result and is
 * classified `adequate` here.
 *
 * The offence is that the requested adaptation is not DRIVEN by anything in
 * the session. Unused time is evidence, reported alongside — never the verdict
 * on its own.
 *
 * This file computes. It never selects, never prescribes, never repairs and
 * never reads a clock: `index.ts` owns the repair attempt and passes its
 * result in.
 */

import type { AdaptationDomain, CapabilityModule, Identifier } from "./types";
import { driverRolesFor, isDriverRoleFor } from "./adaptationDrivers";
import type { ExerciseRole } from "./prescription/types";

// -----------------------------------------------------------------------------
// Roles that cannot, alone, deliver a session
// -----------------------------------------------------------------------------

/**
 * Whether a role drives THIS session's adaptation.
 *
 * Lot H2 asked this question with one fixed list of support roles, which was
 * objective-blind and therefore wrong in both directions: it correctly refused
 * an accessory-only maximum-strength session, but it would equally have
 * refused a ROBUSTNESS session built from the robustness module's accessory
 * work — `tibialis_raise`, `soleus_raise`, `wrist_strengthening` are all
 * `accessory` in the registry, and that is exactly what a robustness session
 * is made of.
 *
 * `adaptationDrivers.ts` holds the relation, stated once and shared with the
 * composer, so selection and adequacy can never disagree about what a driver
 * is.
 */
export function isDrivingRole(adaptation: AdaptationDomain, role: ExerciseRole | null): boolean {
  return isDriverRoleFor(adaptation, role);
}

// -----------------------------------------------------------------------------
// Duration thresholds
// -----------------------------------------------------------------------------

/**
 * Duration thresholds.
 *
 * ENGINEERING DECISIONS, owned here because no document states a number. They
 * are relative AND absolute together, and both must be breached before a
 * session is called underfilled — a single ratio is fragile at both ends of
 * the range (10 of 20 minutes and 30 of 60 minutes are the same ratio and not
 * the same problem).
 *
 * The doctrine above means these thresholds can only ever REPORT. They never
 * cause an exercise to be added.
 */
export const SESSION_ADEQUACY_THRESHOLDS = {
  /**
   * Below this share of the requested time, the session is reported as
   * underfilled — provided the absolute test below also fails.
   *
   * Half is the point past which "the engine judged less work sufficient"
   * stops being a plausible reading of the gap.
   */
  minimumDurationCoverageRatio: 0.5,

  /**
   * Unused minutes tolerated regardless of ratio.
   *
   * A quarter of an hour is the smallest gap that could hold another
   * meaningful piece of work; below it, the gap cannot be acted on even in
   * principle, so reporting it would be noise.
   */
  maximumUnusedMinutes: 15,

  /**
   * Requests at or below this length are exempt from the ratio rule.
   *
   * A short request is usually a deliberately narrow one, where a single
   * well-chosen exercise is the whole point. The absolute rule still applies,
   * which is what keeps a 3-minute answer to a 20-minute request visible.
   */
  shortRequestExemptionMinutes: 20,

  /**
   * A session shorter than this is below the minimum productive duration for
   * any request longer than `shortRequestExemptionMinutes`.
   *
   * Ten minutes is roughly one working exercise with its rests. Less than
   * that, and what came back is a fragment of a session rather than a small
   * session.
   */
  minimumProductiveMinutes: 10,
} as const;

// -----------------------------------------------------------------------------
// Domain types
// -----------------------------------------------------------------------------

/**
 * The three things CAS can honestly say about a finished session.
 *
 * - `adequate` — complete: the requested adaptation is driven and the session
 *   uses the requested time reasonably.
 * - `partial` — usable, with a named gap: the adaptation IS driven, but
 *   something about the composition falls short of what was asked.
 * - `inadequate` — CAS cannot claim to have fulfilled the primary objective.
 */
export type SessionAdequacyStatus = "adequate" | "partial" | "inadequate";

export type SessionAdequacyRuleId =
  | "adequacy_primary_adaptation_coverage"
  | "adequacy_duration_coverage"
  | "adequacy_minimum_productive_duration"
  | "adequacy_primary_candidates_unprescribable";

export type SessionAdequacyReasonCode =
  /** Every exercise in the primary module holds a non-driving role. */
  | "PRIMARY_ADAPTATION_NOT_DRIVEN"
  /** The primary module's driving candidates existed but could not be prescribed. */
  | "PRIMARY_CANDIDATES_UNPRESCRIBABLE"
  /** Estimated duration is far below the requested duration, relatively and absolutely. */
  | "DURATION_GROSSLY_UNDERFILLED"
  /** The session is shorter than any productive session for a request this long. */
  | "BELOW_MINIMUM_PRODUCTIVE_DURATION";

export interface SessionAdequacyFinding {
  ruleId: SessionAdequacyRuleId;
  reasonCode: SessionAdequacyReasonCode;
  /** The engine documents this rule is derived from. */
  sourceRuleIds: readonly Identifier[];
  description: string;
}

/** One prescribed exercise, reduced to what adequacy needs to judge it. */
export interface AdequacyPrescribedExercise {
  exerciseId: Identifier;
  moduleId: CapabilityModule;
  role: ExerciseRole;
}

export interface SessionAdequacyInput {
  requestedDurationMinutes: number;
  /** `null` when the session could not be estimated. */
  estimatedDurationMinutes: number | null;
  /** `null` when no primary module was selected. */
  primaryModule: CapabilityModule | null;
  /** The adaptation the primary module serves — decides which roles drive it. */
  primaryAdaptation: AdaptationDomain;
  /**
   * Whether the session as a whole was prescribed.
   *
   * `false` when prescription came back `unavailable` — a required exercise
   * could not be dosed safely, most often for want of an athlete reference.
   * Such a session holds no prescribed work at all, and must never be
   * classified `adequate` on the grounds that it contains no support-only
   * exercise either.
   */
  prescriptionAvailable: boolean;
  prescribedExercises: readonly AdequacyPrescribedExercise[];
  /**
   * Primary-module exercises that were selected and then failed prescription.
   * Distinguishes "nothing suitable existed" from "something suitable existed
   * and CAS could not safely dose it" — a different conversation with the
   * athlete, and the reason `PRIMARY_CANDIDATES_UNPRESCRIBABLE` is separate.
   */
  unprescribedPrimaryExerciseIds: readonly Identifier[];
  repairAttempted: boolean;
  repairAddedExerciseIds: readonly Identifier[];
}

export interface SessionAdequacyEvaluation {
  status: SessionAdequacyStatus;
  primaryAdaptationCovered: boolean;
  requestedDurationMinutes: number;
  estimatedDurationMinutes: number | null;
  /** Estimated ÷ requested, rounded to two decimals. `null` without an estimate. */
  durationCoverageRatio: number | null;
  prescribedExerciseCount: number;
  /** Prescribed exercises in the primary module holding a driving role. */
  drivingExerciseIds: readonly Identifier[];
  repairAttempted: boolean;
  repairAddedExerciseIds: readonly Identifier[];
  findings: readonly SessionAdequacyFinding[];
}

const PIPELINE_SOURCE: Identifier = "18_SESSION_GENERATION_PIPELINE_V0_1";
const MODULE_ENGINE_SOURCE: Identifier = "01_MODULE_ENGINE_V0_1";

// -----------------------------------------------------------------------------
// Evaluation
// -----------------------------------------------------------------------------

/**
 * Classifies a finished session.
 *
 * Deterministic and total: same input, same findings, in the fixed order the
 * rules are written below.
 */
export function evaluateSessionAdequacy(input: SessionAdequacyInput): SessionAdequacyEvaluation {
  const {
    requestedDurationMinutes,
    estimatedDurationMinutes,
    primaryModule,
    primaryAdaptation,
    prescriptionAvailable,
    prescribedExercises,
    unprescribedPrimaryExerciseIds,
    repairAttempted,
    repairAddedExerciseIds,
  } = input;

  const primaryExercises =
    primaryModule === null
      ? []
      : prescribedExercises.filter((exercise) => exercise.moduleId === primaryModule);
  const drivingExercises = primaryExercises.filter((exercise) =>
    isDrivingRole(primaryAdaptation, exercise.role),
  );
  const findings: SessionAdequacyFinding[] = [];

  // Rule 1 — primary adaptation coverage.
  //
  // Only evaluated when the primary module actually holds prescribed work.
  // An empty primary module is already a blocking condition upstream
  // (`NO_PRIMARY_MODULE_EXERCISE_AVAILABLE`) and is not restated here.
  //
  // A session that was never prescribed cannot cover anything. Saying
  // otherwise because it holds no support-only exercise either would be the
  // same silence this file exists to end.
  const primaryAdaptationCovered = prescriptionAvailable
    ? primaryExercises.length === 0 || drivingExercises.length > 0
    : false;

  if (!primaryAdaptationCovered && primaryModule !== null) {
    if (!prescriptionAvailable) {
      findings.push({
        ruleId: "adequacy_primary_adaptation_coverage",
        reasonCode: "PRIMARY_ADAPTATION_NOT_DRIVEN",
        sourceRuleIds: [MODULE_ENGINE_SOURCE, PIPELINE_SOURCE],
        description: `No exercise could be prescribed for this session, so the "${primaryModule}" module carries no work and the requested adaptation is not trained.`,
      });
    } else {
      findings.push({
        ruleId: "adequacy_primary_adaptation_coverage",
        reasonCode: "PRIMARY_ADAPTATION_NOT_DRIVEN",
        sourceRuleIds: [MODULE_ENGINE_SOURCE, PIPELINE_SOURCE],
        description: `The "${primaryModule}" module carries this session's objective, but every exercise prescribed for it is support work (${primaryExercises
          .map((exercise) => `"${exercise.exerciseId}" (${exercise.role})`)
          .join(", ")}). Driving "${primaryAdaptation}" requires one of: ${driverRolesFor(primaryAdaptation)
        .map((driverRole) => `"${driverRole}"`)
        .join(", ")}.`,
      });
    }

    if (unprescribedPrimaryExerciseIds.length > 0) {
      findings.push({
        ruleId: "adequacy_primary_candidates_unprescribable",
        reasonCode: "PRIMARY_CANDIDATES_UNPRESCRIBABLE",
        sourceRuleIds: [PIPELINE_SOURCE],
        description: `${unprescribedPrimaryExerciseIds
          .map((exerciseId) => `"${exerciseId}"`)
          .join(", ")} could have driven the requested adaptation but could not be prescribed safely. No loading reference was invented in their place.`,
      });
    }
  }

  // Rule 2 — duration coverage. Relative AND absolute, both required.
  const durationCoverageRatio =
    estimatedDurationMinutes === null || requestedDurationMinutes <= 0
      ? null
      : Math.round((estimatedDurationMinutes / requestedDurationMinutes) * 100) / 100;

  if (estimatedDurationMinutes !== null && durationCoverageRatio !== null) {
    const unusedMinutes = requestedDurationMinutes - estimatedDurationMinutes;
    const requestIsShort = requestedDurationMinutes <= SESSION_ADEQUACY_THRESHOLDS.shortRequestExemptionMinutes;

    if (
      !requestIsShort &&
      durationCoverageRatio < SESSION_ADEQUACY_THRESHOLDS.minimumDurationCoverageRatio &&
      unusedMinutes > SESSION_ADEQUACY_THRESHOLDS.maximumUnusedMinutes
    ) {
      findings.push({
        ruleId: "adequacy_duration_coverage",
        reasonCode: "DURATION_GROSSLY_UNDERFILLED",
        sourceRuleIds: [PIPELINE_SOURCE],
        description: `The session is estimated at ${estimatedDurationMinutes} minute(s) against ${requestedDurationMinutes} requested (${Math.round(
          durationCoverageRatio * 100,
        )}% of the requested time, ${unusedMinutes} minute(s) unused).`,
      });
    }

    // Rule 3 — minimum productive duration, for anything but a short request.
    if (
      !requestIsShort &&
      estimatedDurationMinutes < SESSION_ADEQUACY_THRESHOLDS.minimumProductiveMinutes
    ) {
      findings.push({
        ruleId: "adequacy_minimum_productive_duration",
        reasonCode: "BELOW_MINIMUM_PRODUCTIVE_DURATION",
        sourceRuleIds: [PIPELINE_SOURCE],
        description: `The session is estimated at ${estimatedDurationMinutes} minute(s), below the ${SESSION_ADEQUACY_THRESHOLDS.minimumProductiveMinutes}-minute minimum productive duration for a ${requestedDurationMinutes}-minute request.`,
      });
    }
  }

  // Classification.
  //
  // Coverage decides between "usable" and "not what was asked for"; duration
  // can only downgrade a covered session to `partial`. This is the Minimum
  // Effective Session Principle expressed as a status: a short session that
  // trains the right thing is never rejected for being short.
  const status: SessionAdequacyStatus = !primaryAdaptationCovered
    ? "inadequate"
    : findings.length > 0
      ? "partial"
      : "adequate";

  return {
    status,
    primaryAdaptationCovered,
    requestedDurationMinutes,
    estimatedDurationMinutes,
    durationCoverageRatio,
    prescribedExerciseCount: prescribedExercises.length,
    drivingExerciseIds: drivingExercises.map((exercise) => exercise.exerciseId),
    repairAttempted,
    repairAddedExerciseIds,
    findings,
  };
}
