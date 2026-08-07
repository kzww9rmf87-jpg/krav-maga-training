/**
 * Combat Athlete System — Session Sequencing
 * Version 0.1
 *
 * In what order the selected exercises are performed.
 *
 * WHY THIS FILE EXISTS. Until this lot the order was an accident of iteration:
 * `buildPrescriptionInput.ts` assigns `order: exercises.length + 1` while walking
 * modules and, inside each module, the candidates in SCORING RANK. Execution
 * order was therefore selection score order, and nothing had ever decided it.
 *
 * Measured on the real catalogue, a full-gym maximum-strength session came back:
 *
 *   1. chest_supported_row   accessory
 *   2. neck_training         accessory
 *   3. bench_press           PRIMARY, neural fatigue 4
 *
 * The athlete performed neck work and rows before the heavy press. Lot H2.1
 * guarantees a driver is SELECTED; nothing protected its POSITION.
 *
 * WHAT THIS FILE DECIDES, AND WHAT IT DOES NOT. It reorders. It never changes
 * which exercises are in the session, never changes a dose, and never adds
 * anything — a warm-up least of all (see "Out of scope" below). Given the same
 * session it returns the same order, always.
 */

import type { AdaptationDomain, BodyRegion, ExerciseDefinition, Identifier } from "./types";
import type { ExerciseRole } from "./prescription/types";
import { isDriverRoleFor } from "./adaptationDrivers";

// -----------------------------------------------------------------------------
// Sequence classes
// -----------------------------------------------------------------------------

/**
 * The ordered bands a session is built from. Lower comes first.
 *
 * THE CLASS IS OBJECTIVE-AWARE, WHICH IS THE WHOLE POINT. Membership is decided
 * by `isDriverRoleFor(requestedAdaptation, role)` — the same relation H2.1 uses
 * to secure a driver — never by the role's name. So:
 *
 * - in a maximum-strength session, a `robustness` exercise is support work;
 * - in a ROBUSTNESS session, that same exercise is the objective driver and
 *   leads;
 * - in a conditioning session, conditioning work leads rather than being
 *   deferred.
 *
 * A role name alone never decides position.
 */
export const SEQUENCE_CLASSES = [
  /** Drives the requested adaptation. Performed while the athlete is freshest. */
  "objective_driver",
  /** In the primary module, but not driving — secondary and accessory work. */
  "primary_module_support",
  /** Work belonging to a secondary module. */
  "secondary_module_work",
  /** Work belonging to an explicitly requested support module. */
  "support_module_work",
  /**
   * Conditioning when conditioning is NOT the objective.
   *
   * Deferred because metabolic work degrades the force and power qualities the
   * session was built for. When conditioning IS the objective it is a driver and
   * never reaches this class.
   */
  "deferred_conditioning",
  /**
   * Recovery and mobility work when neither is the objective. Closes the session
   * rather than opening it.
   */
  "closing_recovery",
] as const;

export type SequenceClass = (typeof SEQUENCE_CLASSES)[number];

const CLASS_ORDER: Readonly<Record<SequenceClass, number>> = Object.fromEntries(
  SEQUENCE_CLASSES.map((name, index) => [name, index]),
) as Record<SequenceClass, number>;

// -----------------------------------------------------------------------------
// Freshness
// -----------------------------------------------------------------------------

/**
 * How much an exercise's QUALITY degrades when it is performed tired.
 *
 * This is not "how hard is it" — it is "how much is lost by doing it late". A
 * jump performed fatigued is a different exercise; a set of accessory rows
 * performed fatigued is the same exercise, slightly heavier.
 *
 * Derived entirely from metadata that already exists. Nothing was added to the
 * knowledge base for sequencing, and nothing is inferred from a display name.
 */
export const FRESHNESS_TIERS = {
  /**
   * Ballistic work — a jump, a throw, a sprint. Velocity IS the training
   * stimulus, and velocity is the first thing fatigue takes.
   */
  ballistic: 3,
  /**
   * Technically demanding work: `complexity` of `high`/`very_high`, or a
   * documented technical fatigue cost of 4+. Coordination degrades before force
   * does, and a degraded rehearsal teaches the degraded pattern.
   */
  technical: 2,
  /**
   * Neurally expensive work: a documented neural fatigue cost of 4+. Heavy
   * strength lives here — the load an athlete can express drops with central
   * fatigue long before the muscle is exhausted.
   */
  neural: 1,
  /** Everything else. Its stimulus survives being performed late. */
  none: 0,
} as const;

/** Patterns whose stimulus IS velocity. */
const BALLISTIC_PATTERNS = ["jump", "throw", "sprint"] as const;

const HIGH_TECHNICAL_COMPLEXITY = ["high", "very_high"] as const;

/** At or above this rating, a documented fatigue cost counts as high. */
export const HIGH_FATIGUE_RATING = 4;

export function freshnessDemandOf(exercise: ExerciseDefinition): number {
  if (exercise.movementPatterns.some((pattern) => (BALLISTIC_PATTERNS as readonly string[]).includes(pattern))) {
    return FRESHNESS_TIERS.ballistic;
  }
  if (
    (HIGH_TECHNICAL_COMPLEXITY as readonly string[]).includes(exercise.complexity) ||
    exercise.fatigueProfile.technical >= HIGH_FATIGUE_RATING
  ) {
    return FRESHNESS_TIERS.technical;
  }
  if (exercise.fatigueProfile.neural >= HIGH_FATIGUE_RATING) {
    return FRESHNESS_TIERS.neural;
  }
  return FRESHNESS_TIERS.none;
}

/**
 * Total documented cost, used to put the largest work first among exercises that
 * are otherwise equal.
 *
 * A proxy for "bigger movement", and deliberately a documented one: the
 * alternative is guessing which exercises are "compound" from their names, which
 * is exactly what this repository forbids.
 */
export function systemicLoadOf(exercise: ExerciseDefinition): number {
  const { neural, muscular, metabolic } = exercise.fatigueProfile;
  return neural + muscular + metabolic;
}

// -----------------------------------------------------------------------------
// Classification
// -----------------------------------------------------------------------------

export interface SequenceCandidate {
  exerciseId: Identifier;
  exercise: ExerciseDefinition;
  /** The registry role, or `null` when the exercise has no registry entry. */
  role: ExerciseRole | null;
  /** The role the exercise's MODULE holds in this session. */
  moduleRole: "primary" | "secondary" | "support";
}

export interface SequenceContext {
  requestedAdaptation: AdaptationDomain;
}

export function classify(candidate: SequenceCandidate, context: SequenceContext): SequenceClass {
  const drivesObjective =
    candidate.exercise.primaryAdaptation === context.requestedAdaptation &&
    isDriverRoleFor(context.requestedAdaptation, candidate.role);

  if (drivesObjective) {
    return "objective_driver";
  }

  // Conditioning and recovery are deferred only when they are NOT what was
  // asked for — checked against the exercise's own adaptation, never its name.
  if (candidate.exercise.primaryAdaptation === "conditioning") {
    return "deferred_conditioning";
  }
  if (candidate.exercise.primaryAdaptation === "recovery") {
    return "closing_recovery";
  }

  if (candidate.moduleRole === "primary") {
    return "primary_module_support";
  }
  return candidate.moduleRole === "secondary" ? "secondary_module_work" : "support_module_work";
}

// -----------------------------------------------------------------------------
// The comparator
// -----------------------------------------------------------------------------

export interface SequencedCandidate extends SequenceCandidate {
  sequenceClass: SequenceClass;
  freshnessDemand: number;
  systemicLoad: number;
}

/**
 * Orders a session.
 *
 * The comparator is total and deterministic — every tie is broken, and the last
 * tie-break is the canonical exercise id. Nothing here reads a clock, a random
 * source, or the order the exercises arrived in: `sequenceSession` is a pure
 * function of the set, and shuffling its input changes nothing.
 *
 *   1. sequence class      what kind of work this is, for THIS objective
 *   2. freshness demand    what degrades most when performed tired
 *   3. systemic load       the larger movement first among equals
 *   4. canonical id        a stable, meaningless, always-available tie-break
 */
export function sequenceSession(
  candidates: readonly SequenceCandidate[],
  context: SequenceContext,
): SequencedCandidate[] {
  return candidates
    .map((candidate) => ({
      ...candidate,
      sequenceClass: classify(candidate, context),
      freshnessDemand: freshnessDemandOf(candidate.exercise),
      systemicLoad: systemicLoadOf(candidate.exercise),
    }))
    .sort((left, right) => {
      const byClass = CLASS_ORDER[left.sequenceClass] - CLASS_ORDER[right.sequenceClass];
      if (byClass !== 0) {
        return byClass;
      }
      const byFreshness = right.freshnessDemand - left.freshnessDemand;
      if (byFreshness !== 0) {
        return byFreshness;
      }
      const byLoad = right.systemicLoad - left.systemicLoad;
      if (byLoad !== 0) {
        return byLoad;
      }
      return left.exerciseId < right.exerciseId ? -1 : left.exerciseId > right.exerciseId ? 1 : 0;
    });
}

// -----------------------------------------------------------------------------
// Reporting
// -----------------------------------------------------------------------------

/**
 * Consecutive pairs that load a common body region.
 *
 * REPORTED, NOT REORDERED, and the distinction is deliberate. Separating them
 * would mean overriding the freshness ordering above, and no document in this
 * repository states which of the two should win. Choosing silently would be
 * inventing doctrine; a full adjacency optimizer would be worse. So the
 * observation reaches the Decision Trace and the ordering rule stays honest.
 */
export function adjacentSharedRegions(
  sequence: readonly SequencedCandidate[],
): { first: Identifier; second: Identifier; regions: BodyRegion[] }[] {
  const findings: { first: Identifier; second: Identifier; regions: BodyRegion[] }[] = [];
  for (let index = 1; index < sequence.length; index += 1) {
    const previous = sequence[index - 1];
    const current = sequence[index];
    const shared = current.exercise.bodyRegionsLoaded.filter((region) =>
      previous.exercise.bodyRegionsLoaded.includes(region),
    );
    if (shared.length > 0) {
      findings.push({ first: previous.exerciseId, second: current.exerciseId, regions: shared });
    }
  }
  return findings;
}

// -----------------------------------------------------------------------------
// Out of scope
// -----------------------------------------------------------------------------

/**
 * WARM-UP IS NOT SEQUENCED HERE, because it does not exist.
 *
 * No exercise in the catalogue is a warm-up, no module produces one, and no
 * prescription profile describes preparation work. Sequencing applies to the
 * prescribed work the engine actually selected, and this file will not invent a
 * preparation phase to put in front of it.
 */
export const WARM_UP_IS_OUT_OF_SCOPE = true;
