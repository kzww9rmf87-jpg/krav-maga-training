/**
 * Combat Athlete System — Duration Estimation Model
 * Version 0.1
 *
 * The engineering constants a duration estimate needs and no source
 * document provides, gathered in ONE table so they can be challenged as a
 * single decision rather than hunted for across 75 registry entries.
 *
 * WHAT IS COMPUTED VERSUS WHAT IS DECIDED HERE. This distinction is the
 * whole point of the file, and the audit that preceded it measured both
 * sides against the real registry:
 *
 * COMPUTED FROM THE PRESCRIPTION — no constant below is involved, and no
 * estimate is invented:
 * - work time for `sets_duration` (13 entries), `rounds_duration` (3) and
 *   `intervals` (6): the prescription already resolves a duration per set,
 *   per round or per interval, and a count. 22 of the 75 entries therefore
 *   have their working time fully determined by data the engine already
 *   produced;
 * - rest time for ALL 75 entries: `betweenSets`, `betweenRounds` and
 *   `betweenIntervals` are resolved numbers from the numerical profile;
 * - the multiplier for per-side work: `PrescriptionLaterality.interpretation`
 *   states whether a count is a total or per side.
 *
 * DECIDED HERE — an ENGINEERING DECISION, not a physiological fact, and not
 * presented as one:
 * - `repetitionSeconds`: how long one repetition takes. Every documented
 *   tempo in the registry resolves to an INTENT (`phase_intent`,
 *   `global_intent`, `isometric_hold`) and not to seconds — measured across
 *   all 75 entries, zero resolve to timed phases — so a per-repetition time
 *   cannot be derived from the prescription and must be decided;
 * - `metreSeconds`: how long one metre of a loaded carry takes;
 * - `setupSeconds`: getting the implement ready before the first set.
 *
 * These are declared per TRAINING METHOD rather than per exercise, because
 * the method is what determines the movement's timing character: a
 * `straight_sets_repetitions` rep is a controlled strength repetition, a
 * `power_repetition_sets` rep includes the reset an explosive effort needs.
 * Keying by exercise id would create 75 independently-invented numbers and
 * an estimator full of exercise branches; keying by method creates one
 * table of seven.
 *
 * Nothing here claims documentary support. `SOURCE_DURATION_MODEL` is the
 * identifier that marks an estimate as resting on this engineering decision,
 * so any consumer can tell a computed component from a decided one.
 */

import type { Identifier } from "../types";
import type { TrainingMethodId } from "./contracts";

/**
 * The identifier every estimate carries when one of the constants below
 * contributed to it. Deliberately NOT shaped like an engine-document source
 * id (`\d\d_NAME_V0_1`): no engine document backs these numbers, and giving
 * them a document-shaped id would imply one does.
 */
export const SOURCE_DURATION_MODEL: Identifier = "CAS_DURATION_ESTIMATION_MODEL_V0_1";

export interface MethodDurationConstants {
  /** Seconds for one repetition, for methods whose volume is counted in repetitions. */
  repetitionSeconds: number | null;
  /** Seconds per metre, for methods whose volume is counted in distance. */
  metreSeconds: number | null;
  /** Seconds to prepare the implement before the first working set. */
  setupSeconds: number;
}

/**
 * Per-method constants.
 *
 * `null` means the method never needs that constant because the prescription
 * already resolves the corresponding work time — it is an assertion that no
 * invention is required, not a missing value.
 *
 * The numbers are round on purpose. They are a first honest approximation
 * chosen so a reviewer can argue with them directly; none is presented as
 * measured, and refining them needs data this repository does not yet have.
 */
export const METHOD_DURATION_CONSTANTS: Readonly<Record<TrainingMethodId, MethodDurationConstants>> = {
  // Controlled strength repetitions: lower under control, raise, reset.
  straight_sets_repetitions: { repetitionSeconds: 4, metreSeconds: null, setupSeconds: 90 },
  // Explosive repetitions with a deliberate reset between efforts, so a
  // repetition occupies longer than a controlled one despite being faster.
  power_repetition_sets: { repetitionSeconds: 6, metreSeconds: null, setupSeconds: 90 },
  // Work time comes from the prescribed hold duration.
  timed_isometric_sets: { repetitionSeconds: null, metreSeconds: null, setupSeconds: 30 },
  // Work time comes from the prescribed set duration.
  controlled_mobility_sets: { repetitionSeconds: null, metreSeconds: null, setupSeconds: 30 },
  // Loaded carries: a metre of loaded walking, including turnarounds.
  distance_carry_sets: { repetitionSeconds: null, metreSeconds: 1.5, setupSeconds: 90 },
  // Work time comes from the prescribed interval duration.
  work_rest_intervals: { repetitionSeconds: null, metreSeconds: null, setupSeconds: 60 },
  // Work time comes from the prescribed round duration.
  combat_rounds: { repetitionSeconds: null, metreSeconds: null, setupSeconds: 60 },
  // Work time comes from the prescribed round duration; the setup includes
  // pairing with a partner and agreeing the constraint.
  partner_grappling_rounds: { repetitionSeconds: null, metreSeconds: null, setupSeconds: 90 },
  // No registry entry uses either method today, and both resolve to a
  // `continuous_*` volume structure the estimator deliberately refuses to
  // model (see `estimateWorkSeconds`). They are present so this table stays
  // total over `TrainingMethodId` — a new method cannot compile until its
  // constants are decided — and their `setupSeconds` is the only value that
  // would ever be read, never a fabricated work time.
  continuous_aerobic_duration: { repetitionSeconds: null, metreSeconds: null, setupSeconds: 60 },
  recovery_duration_work: { repetitionSeconds: null, metreSeconds: null, setupSeconds: 30 },
};

/**
 * Seconds between two exercises of the same session — putting one implement
 * away and reaching the next.
 *
 * Session-level rather than per-method: it is a property of moving between
 * two exercises, not of either one. Applied once per gap, never after the
 * last exercise.
 */
export const TRANSITION_SECONDS_BETWEEN_EXERCISES = 60;

export function getMethodDurationConstants(methodId: TrainingMethodId): MethodDurationConstants {
  const constants = METHOD_DURATION_CONSTANTS[methodId];
  if (constants === undefined) {
    throw new Error(`Duration model is missing constants for training method "${methodId}" — this is a contract bug.`);
  }
  return constants;
}
