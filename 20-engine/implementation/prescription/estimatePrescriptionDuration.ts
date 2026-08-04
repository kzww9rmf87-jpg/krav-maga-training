/**
 * Combat Athlete System — Prescription Duration Estimation
 * Version 0.1
 *
 * Estimates how long a RESOLVED prescription takes.
 *
 * It reads the prescription, never the Knowledge Base: by the time this
 * runs, sets, repetitions, durations, distances, rounds, intervals, rest
 * and laterality are all decided numbers, and an estimate built on anything
 * else would be describing a different session from the one prescribed.
 *
 * The estimator is GENERIC. It branches on `volume.structure` and reads
 * `METHOD_DURATION_CONSTANTS` by `methodId` — never on an exercise id.
 * Adding a 76th exercise cannot require a change here; adding a new
 * training method requires exactly one row in the model table.
 *
 * Every estimate is broken down and labelled by provenance, so a reader can
 * always tell which seconds were computed from the prescription and which
 * rest on the engineering constants (see `durationEstimationModel.ts`).
 */

import type { Identifier } from "../types";
import type { ExercisePrescription } from "./prescribeExercise";
import type { DurationTarget, PrescriptionLaterality, PrescriptionVolume, RestTarget } from "./types";
import {
  SOURCE_DURATION_MODEL,
  TRANSITION_SECONDS_BETWEEN_EXERCISES,
  getMethodDurationConstants,
} from "./durationEstimationModel";

// -----------------------------------------------------------------------------
// Result
// -----------------------------------------------------------------------------

export type DurationComponentKind = "work" | "rest" | "setup";

/** How a component's seconds were obtained — the honesty of the estimate lives here. */
export type DurationComponentProvenance =
  /** Arithmetic on values the prescription itself resolved. Nothing invented. */
  | "prescribed"
  /** Rests on a constant from the duration model — an engineering decision. */
  | "engineering_model";

export interface DurationComponent {
  kind: DurationComponentKind;
  seconds: number;
  provenance: DurationComponentProvenance;
  /** One sentence stating exactly how these seconds were obtained. */
  explanation: string;
}

export type DurationEstimationFailureCode =
  | "UNSUPPORTED_VOLUME_STRUCTURE"
  | "INCOMPLETE_VOLUME_DATA";

export type PrescriptionDurationEstimate =
  | {
      ok: true;
      exerciseId: Identifier;
      totalSeconds: number;
      workSeconds: number;
      restSeconds: number;
      setupSeconds: number;
      components: readonly DurationComponent[];
      sourceRuleIds: readonly Identifier[];
    }
  | {
      ok: false;
      exerciseId: Identifier;
      failureCode: DurationEstimationFailureCode;
      message: string;
    };

// -----------------------------------------------------------------------------
// Helpers — all pure
// -----------------------------------------------------------------------------

/** Seconds carried by a `DurationTarget`, whatever unit it was expressed in. */
function durationTargetSeconds(target: DurationTarget): number {
  return target.unit === "minutes" ? target.value * 60 : target.value;
}

/**
 * The seconds a rest target represents.
 *
 * A range rests for its own resolved lower bound: the estimate must not
 * assume the athlete lingers, and a session that runs slightly long is a
 * worse failure than one that runs slightly short. `conditional` rests have
 * no unconditional duration and contribute nothing rather than a guess.
 */
function restTargetSeconds(target: RestTarget | null): number {
  if (target === null) {
    return 0;
  }
  switch (target.type) {
    case "fixed":
    case "fixed_with_condition":
      return durationTargetSeconds(target.duration);
    case "range":
    case "range_with_condition":
      return durationTargetSeconds(target.min);
    case "conditional":
      return target.minimum === null ? 0 : durationTargetSeconds(target.minimum);
  }
}

/**
 * `2` when the prescribed count is per side and both sides must be worked,
 * `1` otherwise.
 *
 * Read from the prescription's own `interpretation`, never inferred from the
 * exercise being unilateral: `repetitions_per_side` says the number must be
 * done twice, while `total_repetitions` on a unilateral exercise says it is
 * already the total across both.
 */
function sideMultiplier(laterality: PrescriptionLaterality | null): number {
  if (laterality === null) {
    return 1;
  }
  switch (laterality.interpretation) {
    case "repetitions_per_side":
    case "duration_per_side":
    case "distance_per_side":
      return 2;
    default:
      return 1;
  }
}

/** A repetition count, taking the lower bound of a prescribed range. */
function repetitionCount(volume: PrescriptionVolume): number | null {
  if (volume.reps === null) {
    return null;
  }
  return volume.reps.type === "fixed" ? volume.reps.value : volume.reps.min;
}

const round = (seconds: number): number => Math.round(seconds);

// -----------------------------------------------------------------------------
// Work time, per volume structure
// -----------------------------------------------------------------------------

interface WorkResult {
  seconds: number;
  provenance: DurationComponentProvenance;
  explanation: string;
}

function estimateWorkSeconds(prescription: ExercisePrescription): WorkResult | DurationEstimationFailureCode {
  const { volume, methodId } = prescription;
  const constants = getMethodDurationConstants(methodId);
  const sides = sideMultiplier(volume.laterality);
  const sideNote = sides === 2 ? " ×2 (prescribed per side)" : "";

  switch (volume.structure) {
    case "sets_reps": {
      const reps = repetitionCount(volume);
      if (volume.sets === null || reps === null || constants.repetitionSeconds === null) {
        return "INCOMPLETE_VOLUME_DATA";
      }
      const seconds = volume.sets * reps * sides * constants.repetitionSeconds;
      return {
        seconds,
        provenance: "engineering_model",
        explanation: `${volume.sets} set(s) × ${reps} repetition(s)${sideNote} × ${constants.repetitionSeconds}s per repetition (duration model, method "${methodId}").`,
      };
    }

    case "sets_duration": {
      if (volume.sets === null || volume.duration === null) {
        return "INCOMPLETE_VOLUME_DATA";
      }
      const perSet = durationTargetSeconds(volume.duration);
      return {
        seconds: volume.sets * perSet * sides,
        provenance: "prescribed",
        explanation: `${volume.sets} set(s) × ${perSet}s prescribed per set${sideNote}.`,
      };
    }

    case "sets_distance": {
      if (volume.sets === null || volume.distance === null || constants.metreSeconds === null) {
        return "INCOMPLETE_VOLUME_DATA";
      }
      const seconds = volume.sets * volume.distance.value * sides * constants.metreSeconds;
      return {
        seconds,
        provenance: "engineering_model",
        explanation: `${volume.sets} set(s) × ${volume.distance.value}m${sideNote} × ${constants.metreSeconds}s per metre (duration model, method "${methodId}").`,
      };
    }

    case "rounds_duration": {
      if (volume.rounds === null || volume.duration === null) {
        return "INCOMPLETE_VOLUME_DATA";
      }
      const perRound = durationTargetSeconds(volume.duration);
      return {
        seconds: volume.rounds * perRound,
        provenance: "prescribed",
        explanation: `${volume.rounds} round(s) × ${perRound}s prescribed per round.`,
      };
    }

    case "intervals": {
      if (volume.workIntervals === null || volume.duration === null) {
        return "INCOMPLETE_VOLUME_DATA";
      }
      const perInterval = durationTargetSeconds(volume.duration);
      return {
        seconds: volume.workIntervals * perInterval,
        provenance: "prescribed",
        explanation: `${volume.workIntervals} interval(s) × ${perInterval}s prescribed per interval.`,
      };
    }

    case "continuous_duration":
    case "continuous_distance":
      // No registry entry uses either structure today. Returning a failure
      // rather than a guess keeps the estimator honest the day one does.
      return "UNSUPPORTED_VOLUME_STRUCTURE";
  }
}

// -----------------------------------------------------------------------------
// Rest time
// -----------------------------------------------------------------------------

/**
 * Rest happens BETWEEN efforts, so `n` efforts carry `n - 1` rests. The rest
 * after the final effort belongs to the gap before the next exercise, which
 * the session-level transition already accounts for.
 */
function estimateRestSeconds(prescription: ExercisePrescription): WorkResult {
  const { volume, rest } = prescription;

  if (rest === null) {
    return { seconds: 0, provenance: "prescribed", explanation: "No rest is prescribed for this exercise." };
  }

  const gapsFor = (count: number | null): number => (count === null || count <= 1 ? 0 : count - 1);

  const candidates: Array<{ label: string; gaps: number; seconds: number }> = [
    { label: "set", gaps: gapsFor(volume.sets), seconds: restTargetSeconds(rest.betweenSets) },
    { label: "round", gaps: gapsFor(volume.rounds), seconds: restTargetSeconds(rest.betweenRounds) },
    { label: "interval", gaps: gapsFor(volume.workIntervals), seconds: restTargetSeconds(rest.betweenIntervals) },
  ];

  const contributing = candidates.filter((candidate) => candidate.gaps > 0 && candidate.seconds > 0);
  const seconds = contributing.reduce((total, candidate) => total + candidate.gaps * candidate.seconds, 0);

  if (contributing.length === 0) {
    return { seconds: 0, provenance: "prescribed", explanation: "No between-effort rest applies to this volume." };
  }

  return {
    seconds,
    provenance: "prescribed",
    explanation: contributing
      .map((candidate) => `${candidate.gaps} × ${candidate.seconds}s prescribed between ${candidate.label}s`)
      .join("; ") + ".",
  };
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Estimates one prescribed exercise.
 *
 * Pure and deterministic: the same prescription always produces the same
 * estimate, including the same component order and wording. Nothing is
 * mutated and no clock is read.
 *
 * Returns a structured failure rather than a number when the volume is
 * incomplete or its structure is not modelled — an estimate that quietly
 * omitted the work time would be worse than no estimate at all.
 */
export function estimatePrescriptionDuration(prescription: ExercisePrescription): PrescriptionDurationEstimate {
  const work = estimateWorkSeconds(prescription);

  if (typeof work === "string") {
    return {
      ok: false,
      exerciseId: prescription.exerciseId,
      failureCode: work,
      message:
        work === "UNSUPPORTED_VOLUME_STRUCTURE"
          ? `Volume structure "${prescription.volume.structure}" has no duration model, so no estimate is produced for exercise "${prescription.exerciseId}".`
          : `Prescription for exercise "${prescription.exerciseId}" does not carry the values its "${prescription.volume.structure}" structure needs for a duration estimate.`,
    };
  }

  const rest = estimateRestSeconds(prescription);
  const constants = getMethodDurationConstants(prescription.methodId);

  const components: DurationComponent[] = [
    { kind: "setup", seconds: round(constants.setupSeconds), provenance: "engineering_model", explanation: `${constants.setupSeconds}s to prepare the exercise (duration model, method "${prescription.methodId}").` },
    { kind: "work", seconds: round(work.seconds), provenance: work.provenance, explanation: work.explanation },
    { kind: "rest", seconds: round(rest.seconds), provenance: rest.provenance, explanation: rest.explanation },
  ];

  const workSeconds = round(work.seconds);
  const restSeconds = round(rest.seconds);
  const setupSeconds = round(constants.setupSeconds);

  // Every estimate carries the model id: even one whose work and rest are
  // fully prescribed still adds a setup time that this model decided.
  const sourceRuleIds: Identifier[] = [SOURCE_DURATION_MODEL];

  return {
    ok: true,
    exerciseId: prescription.exerciseId,
    totalSeconds: workSeconds + restSeconds + setupSeconds,
    workSeconds,
    restSeconds,
    setupSeconds,
    components,
    sourceRuleIds,
  };
}

// -----------------------------------------------------------------------------
// Session level
// -----------------------------------------------------------------------------

export interface SessionDurationEstimate {
  /** `null` when any prescribed exercise could not be estimated — never a partial total. */
  totalMinutes: number | null;
  totalSeconds: number | null;
  exerciseEstimates: readonly PrescriptionDurationEstimate[];
  transitionSeconds: number;
  sourceRuleIds: readonly Identifier[];
  /** One line per exercise plus the transition line — ready for a Decision Trace entry. */
  reasons: readonly string[];
}

/**
 * Sums a session's prescribed exercises, plus one transition per gap between
 * consecutive exercises.
 *
 * A single unestimable exercise makes the whole total `null` rather than
 * silently understating the session: reporting "30 minutes" for a session
 * whose third exercise was not counted would be worse than reporting that
 * the duration is unknown.
 *
 * Rounds to whole minutes at the very end, once, so the rounding error is
 * bounded by 30 seconds for the session rather than accumulating per
 * exercise.
 */
export function estimateSessionDuration(
  prescriptions: readonly ExercisePrescription[],
): SessionDurationEstimate {
  const exerciseEstimates = prescriptions.map(estimatePrescriptionDuration);
  const transitionSeconds =
    prescriptions.length > 1 ? (prescriptions.length - 1) * TRANSITION_SECONDS_BETWEEN_EXERCISES : 0;

  const reasons: string[] = exerciseEstimates.map((estimate) =>
    estimate.ok
      ? `${estimate.exerciseId}: ${estimate.totalSeconds}s (setup ${estimate.setupSeconds}s + work ${estimate.workSeconds}s + rest ${estimate.restSeconds}s).`
      : `${estimate.exerciseId}: not estimable (${estimate.failureCode}).`,
  );

  if (transitionSeconds > 0) {
    reasons.push(
      `${prescriptions.length - 1} transition(s) between exercises × ${TRANSITION_SECONDS_BETWEEN_EXERCISES}s (duration model).`,
    );
  }

  const failed = exerciseEstimates.filter((estimate) => !estimate.ok);
  if (failed.length > 0) {
    reasons.push(`Session duration is unknown because ${failed.length} exercise(s) could not be estimated.`);
    return {
      totalMinutes: null,
      totalSeconds: null,
      exerciseEstimates,
      transitionSeconds,
      sourceRuleIds: [SOURCE_DURATION_MODEL],
      reasons,
    };
  }

  const totalSeconds =
    exerciseEstimates.reduce((total, estimate) => total + (estimate.ok ? estimate.totalSeconds : 0), 0) +
    transitionSeconds;

  return {
    totalMinutes: Math.round(totalSeconds / 60),
    totalSeconds,
    exerciseEstimates,
    transitionSeconds,
    sourceRuleIds: [SOURCE_DURATION_MODEL],
    reasons,
  };
}
