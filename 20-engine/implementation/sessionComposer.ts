/**
 * Combat Athlete System — Session Composition
 * Version 0.1
 *
 * Turns each module's ranked candidate bench into the set of exercises that
 * module actually contributes to the session.
 *
 * Until now every module contributed exactly one exercise (`index === 0` in
 * `exerciseFinalSelector.ts`), which made a "strength session" a single
 * exercise. This file replaces that with the composition doctrine the
 * engine documents — and the most important thing that doctrine says is
 * what NOT to do.
 *
 * DOCUMENTED, and implemented here:
 *
 * - `18_SESSION_GENERATION_PIPELINE.md`, "Minimum Effective Session
 *   Principle": the engine generates "the smallest coherent session capable
 *   of delivering the required adaptation", and exercises "must not be added
 *   only because: time remains; variety is desirable; fatigue appears too
 *   low; the session looks visually incomplete". Nothing in this file grows
 *   a session to fill a time budget. A session that comes in under the
 *   requested duration is a correct result, not a gap to pad.
 * - `01_MODULE_ENGINE.md`, Principle 1: modules serving the primary
 *   objective receive priority in time and fatigue budget, and "secondary
 *   work must not compromise the primary work". This orders both the
 *   composition and, in `reduceToTimeBudget`, the removals.
 * - `01_MODULE_ENGINE.md`, Principle 5 and
 *   `14_EXERCISE_SELECTION_RULES.md` Rule 32: prefer "a small number of
 *   high-value exercises executed with quality"; "redundant exercises
 *   should be removed", where two exercises are redundant when they create
 *   "nearly identical adaptations, movement patterns, muscular demands,
 *   fatigue profiles, and joint stresses".
 * - "A shorter valid session is superior to a longer incoherent session" —
 *   which is why exceeding the budget is resolved by REMOVING work, never
 *   by shortening a dose the prescription layer already decided.
 *
 * ENGINEERING DECISION, owned here because no document gives a number:
 * `EXERCISES_PER_MODULE_ROLE`. The doctrine says "minimum effective" and
 * "smallest coherent" without ever stating how many exercises that is. The
 * table below is one decision, in one place, so it can be argued with
 * directly rather than inferred from behavior.
 *
 * This file never scores, never re-ranks, never prescribes and never reads
 * a clock. It only chooses, from an already-ranked bench, which candidates
 * the session keeps.
 *
 * WHAT AN EMPTIED MODULE MEANS. A module the reduction empties still raises
 * `detectMissingExerciseConflicts`'s `missing_exercise_<module>` conflict,
 * and that is correct rather than noise: in V0.1 a non-primary module is
 * ALWAYS something the caller asked for. `moduleSelector.ts` produces
 * `role: "support"` in exactly one place — the `request.requiredModules`
 * loop — and `role: "secondary"` only from a declared secondary objective.
 * There is no automatically-selected optional support module to protect
 * from a spurious conflict; a session that drops one is failing to deliver
 * something explicitly requested, and says so.
 *
 * The conflict's CAUSE is restated in `runEngine` for exactly this case, so
 * a module given up for time is never reported as a module that had no
 * candidate. The removal also appears as its own `"duration_validation"`
 * trace entry, and the conflict reaches `DecisionTrace.warnings` like any
 * other minor conflict. Should an auto-selected optional module ever be
 * introduced, THAT is the point at which the conflict rule needs revisiting
 * — no canonical document mandates it today (`conflictResolver.ts` records
 * it as a V0.1 implementation convention).
 */

import type {
  AdaptationDomain,
  CapabilityModule,
  ExerciseDefinition,
  ExerciseSelectionResult,
  Identifier,
  SelectedExerciseCandidate,
  SelectedModule,
} from "./types";
import type { ExerciseRole } from "./prescription/types";
import { isDriverRoleFor } from "./adaptationDrivers";

// -----------------------------------------------------------------------------
// The engineering decision
// -----------------------------------------------------------------------------

/**
 * How many exercises a module may contribute, by the role it holds in this
 * session.
 *
 * A CAP, never a target: a module with two admissible candidates contributes
 * two, and a module with one contributes one. Nothing here pads a module up
 * to its cap, because the Minimum Effective Session Principle forbids
 * exactly that.
 *
 * The primary module gets the largest allowance because it carries the
 * session's objective and, by Principle 1, its time and fatigue budget. A
 * support module gets one: it exists to complement, and a second support
 * exercise is the clearest case of "added because variety is desirable".
 */
export const EXERCISES_PER_MODULE_ROLE: Readonly<Record<SelectedModule["role"], number>> = {
  primary: 3,
  secondary: 2,
  support: 1,
};

// -----------------------------------------------------------------------------
// Redundancy (Rule 32)
// -----------------------------------------------------------------------------

/**
 * Whether `candidate` is redundant with an exercise already kept.
 *
 * Rule 32 names five dimensions — adaptations, movement patterns, muscular
 * demands, fatigue profiles, joint stresses — and calls two exercises
 * redundant when they are "nearly identical" across them. The engine's
 * `ExerciseDefinition` carries three of the five directly, so those three
 * are what this checks, all of them required to agree:
 *
 * - `primaryAdaptation` identical (adaptations);
 * - at least one shared `movementPattern` (movement patterns);
 * - at least one shared `bodyRegionsLoaded` (muscular demand and the joint
 *   stress that follows from loading the same region).
 *
 * The fatigue profile is deliberately NOT added as a fourth test.
 * `01_MODULE_ENGINE.md` states that the four fatigue dimensions "must not be
 * merged automatically into one universal fatigue value", and no document
 * defines how close two profiles must be to count as identical. Requiring
 * agreement on three real dimensions is a conservative reading: it removes
 * true duplicates (two horizontal presses loading the chest for maximum
 * strength) while keeping genuinely different work in the same module (a
 * squat and a hinge both serving maximum strength).
 */
export function isRedundantWith(candidate: ExerciseDefinition, kept: ExerciseDefinition): boolean {
  if (candidate.primaryAdaptation !== kept.primaryAdaptation) {
    return false;
  }

  const sharesPattern = candidate.movementPatterns.some((pattern) => kept.movementPatterns.includes(pattern));
  if (!sharesPattern) {
    return false;
  }

  return candidate.bodyRegionsLoaded.some((region) => kept.bodyRegionsLoaded.includes(region));
}

// -----------------------------------------------------------------------------
// Composition
// -----------------------------------------------------------------------------

export interface ModuleCompositionDecision {
  module: CapabilityModule;
  role: SelectedModule["role"];
  keptExerciseIds: readonly Identifier[];
  /** Candidates passed over, each with the reason — never silently dropped. */
  rejected: readonly { exerciseId: Identifier; reason: string }[];
  /**
   * The exercise secured first as this session's adaptation driver, or `null`
   * when the module reserved none (no policy, not the primary module, or no
   * prescribable driver on the bench).
   */
  reservedDriverExerciseId?: Identifier | null;
}

export interface SessionComposition {
  selections: readonly ExerciseSelectionResult[];
  decisions: readonly ModuleCompositionDecision[];
}

/**
 * What composition needs to know to apply the driver-first rule.
 *
 * Passed in rather than imported so this file keeps knowing nothing about the
 * prescription registry: it receives a role lookup, not a registry.
 *
 * Omitting the policy composes by score alone — the pre-Lot-H2.1 behaviour,
 * kept for callers that have no objective to serve (and for the tests that
 * exercise composition in isolation).
 */
export interface CompositionPolicy {
  /** The adaptation the PRIMARY module serves. */
  primaryAdaptation: AdaptationDomain;
  /** The registry role of a candidate, or `null` when it has none. */
  roleOf: (exerciseId: Identifier) => ExerciseRole | null;
  /**
   * Whether a candidate can actually be prescribed with the athlete data
   * available.
   *
   * A mechanically eligible exercise is not enough. Reserving a driver that
   * cannot be dosed — a percentage-of-1RM lift for an athlete with no recorded
   * 1RM — would turn a usable session into an unprescribable one, which is a
   * worse answer than the accessory session it replaced.
   *
   * Feasibility is knowable HERE: a prescription source depends only on the
   * exercise, the environment, the readiness and the athlete's references, all
   * of which exist before composition runs. So the driver is chosen among
   * candidates that survive feasibility, rather than reserved blind and
   * repaired afterwards.
   *
   * This never duplicates prescription logic: it asks the prescription layer.
   */
  isPrescribable: (exerciseId: Identifier) => boolean;
}

/**
 * Composes every module's bench into its kept exercises.
 *
 * Candidates are taken in the order `scoringEngine` already ranked them —
 * this file never re-sorts and never re-scores. For each module, in order:
 *
 *   keep the highest-ranked candidate not redundant with one already kept,
 *   until the module's role cap is reached or the bench is exhausted.
 *
 * THE DRIVER-FIRST RULE (Lot H2.1). Before that loop runs, the PRIMARY module
 * reserves its first slot for the highest-ranked candidate able to DRIVE the
 * requested adaptation.
 *
 * Why a structural rule rather than a scoring change: measured on the real
 * catalogue, a full-gym maximum-strength request ranked four accessory
 * exercises above every compound lift — `chest_supported_row` 88.05,
 * `neck_training` 88.05, `chin_up` 87.57, `hip_thrust` 87.57, against
 * `bench_press` 84.71 and `back_squat` 63.14. Every one of them scored
 * `objectiveRelevance: 100`, because that component reads the knowledge base's
 * `primaryAdaptation`, which says `maximum_strength` for accessories too. What
 * separated them was safety, fatigue and technical risk — and for a
 * maximum-strength objective, high neural fatigue is what the work IS, not a
 * defect to penalise. The quota was then consumed by accessories before any
 * driver was reached.
 *
 * Correcting that by inflating a role multiplier would bend a scoring model
 * that is meaningful elsewhere until it produced the right order here. The
 * doctrine's own shape is structural — a module carries an objective — so the
 * requirement is structural: SECURE A DRIVER, THEN RANK BY SCORE. Score still
 * decides which driver, and still decides everything after it.
 *
 * The reservation decides WHICH exercises the module keeps, not the order they
 * are performed in. `ModuleCompositionDecision.keptExerciseIds` lists the driver
 * first because it was secured first, but the emitted session keeps the ranked
 * order of `candidates`, exactly as before. Ordering a session — heavy compound
 * before accessory, on a fresh athlete — is a real question with its own rules
 * (`exercise_order` is already a conflict type) and is deliberately not decided
 * here.
 *
 * When the bench holds no driver at all, nothing is reserved and composition is
 * exactly what it was. That case is real — a bodyweight-only maximum-strength
 * request has no eligible driver in the V0.1 catalogue — and it is for
 * `sessionAdequacy.ts` to report, not for this file to paper over.
 *
 * Neither `selections` nor any candidate is mutated: each module yields a
 * new `ExerciseSelectionResult` whose candidates carry updated `selected`
 * flags and one appended reason.
 */
export function composeSession(
  selections: readonly ExerciseSelectionResult[],
  selectedModules: readonly SelectedModule[],
  policy?: CompositionPolicy,
): SessionComposition {
  const roleByModule = new Map(selectedModules.map((selected) => [selected.module, selected.role] as const));
  const decisions: ModuleCompositionDecision[] = [];

  const composed = selections.map((selection) => {
    const role = roleByModule.get(selection.module) ?? selection.role;
    const cap = EXERCISES_PER_MODULE_ROLE[role];

    const kept: SelectedExerciseCandidate[] = [];
    const rejected: { exerciseId: Identifier; reason: string }[] = [];

    // Driver-first: the primary module reserves its first slot for the
    // highest-ranked candidate that can carry the objective. `find` walks the
    // bench in rank order, so "highest-ranked driver" is exactly what it
    // returns — the reservation chooses the SLOT, never the ordering.
    const reservedDriver =
      policy !== undefined && role === "primary"
        ? selection.candidates.find((candidate) => {
            const exerciseId = candidate.scoredExercise.exercise.id;
            return (
              isDriverRoleFor(policy.primaryAdaptation, policy.roleOf(exerciseId)) &&
              policy.isPrescribable(exerciseId)
            );
          })
        : undefined;

    if (reservedDriver !== undefined) {
      kept.push(reservedDriver);
    }

    for (const candidate of selection.candidates) {
      const exercise = candidate.scoredExercise.exercise;

      if (candidate === reservedDriver) {
        continue;
      }

      if (kept.length >= cap) {
        rejected.push({
          exerciseId: exercise.id,
          reason: `Module "${selection.module}" already holds its ${cap} exercise(s) for a "${role}" role; the Minimum Effective Session Principle forbids adding more.`,
        });
        continue;
      }

      const redundantWith = kept.find((keptCandidate) =>
        isRedundantWith(exercise, keptCandidate.scoredExercise.exercise),
      );
      if (redundantWith !== undefined) {
        rejected.push({
          exerciseId: exercise.id,
          reason: `Redundant with "${redundantWith.scoredExercise.exercise.id}": same primary adaptation, a shared movement pattern and a shared loaded body region (Rule 32).`,
        });
        continue;
      }

      kept.push(candidate);
    }

    const keptIds = new Set(kept.map((candidate) => candidate.scoredExercise.exercise.id));

    decisions.push({
      module: selection.module,
      role,
      keptExerciseIds: kept.map((candidate) => candidate.scoredExercise.exercise.id),
      rejected,
      reservedDriverExerciseId: reservedDriver?.scoredExercise.exercise.id ?? null,
    });

    return {
      module: selection.module,
      role: selection.role,
      candidates: selection.candidates.map((candidate) => {
        const exerciseId = candidate.scoredExercise.exercise.id;
        const isKept = keptIds.has(exerciseId);
        if (isKept === candidate.selected) {
          return candidate;
        }
        return {
          ...candidate,
          selected: isKept,
          selectionReasons: [
            ...candidate.selectionReasons,
            isKept
              ? candidate === reservedDriver
                ? `Secured first as this session's adaptation driver: role "${policy?.roleOf(exerciseId) ?? "unknown"}" can drive "${policy?.primaryAdaptation}".`
                : `Composed into the session as one of ${kept.length} exercise(s) for the "${role}" module.`
              : `Not composed into the session: the "${role}" module keeps ${kept.length} exercise(s).`,
          ],
        };
      }),
    };
  });

  return { selections: composed, decisions };
}

// -----------------------------------------------------------------------------
// Time budget
// -----------------------------------------------------------------------------

/**
 * The order in which exercises are given up when the session exceeds the
 * requested duration.
 *
 * Principle 1 makes this ordering rather than leaving it to chance: support
 * work is surrendered before secondary, secondary before primary, and within
 * a module the lowest-ranked exercise goes first. The primary module's first
 * exercise is the last thing standing, because "secondary work must not
 * compromise the primary work".
 *
 * The session is never rescued by shortening a dose: volume, intensity and
 * rest were decided by the prescription layer from the numerical profiles
 * and the athlete's readiness, and quietly trimming them here would
 * contradict both that layer and the doctrine's preference for a shorter
 * VALID session over a longer degraded one.
 */
const REMOVAL_ROLE_ORDER: readonly SelectedModule["role"][] = ["support", "secondary", "primary"];

export interface RemovalCandidate {
  module: CapabilityModule;
  role: SelectedModule["role"];
  exerciseId: Identifier;
  /** Position within the module's kept exercises — higher is given up first. */
  rankWithinModule: number;
}

/**
 * Every composed exercise, ordered by how readily it is given up.
 *
 * Returned rather than acted on, so the caller — which is the only place
 * that knows the estimated duration — decides how many to drop. The list is
 * total: an engine that had to drop everything would still have an explicit
 * order to do it in, and the primary module's best exercise would be last.
 */
export function buildRemovalOrder(composition: SessionComposition): readonly RemovalCandidate[] {
  const candidates: RemovalCandidate[] = [];

  for (const decision of composition.decisions) {
    decision.keptExerciseIds.forEach((exerciseId, index) => {
      candidates.push({
        module: decision.module,
        role: decision.role,
        exerciseId,
        rankWithinModule: index,
      });
    });
  }

  return [...candidates].sort((a, b) => {
    const roleDifference = REMOVAL_ROLE_ORDER.indexOf(a.role) - REMOVAL_ROLE_ORDER.indexOf(b.role);
    if (roleDifference !== 0) {
      return roleDifference;
    }
    // Within the same role, give up the lowest-ranked exercise first.
    const rankDifference = b.rankWithinModule - a.rankWithinModule;
    if (rankDifference !== 0) {
      return rankDifference;
    }
    return a.exerciseId.localeCompare(b.exerciseId);
  });
}

/**
 * A new composition with `exerciseIds` no longer selected.
 *
 * A module is never emptied below one exercise by this function when it is
 * the primary module — the caller enforces that by never asking for the
 * last primary exercise, which `buildRemovalOrder` places last.
 */
export function withoutExercises(
  composition: SessionComposition,
  exerciseIds: ReadonlySet<Identifier>,
): SessionComposition {
  if (exerciseIds.size === 0) {
    return composition;
  }

  const selections = composition.selections.map((selection) => ({
    module: selection.module,
    role: selection.role,
    candidates: selection.candidates.map((candidate) => {
      const exerciseId = candidate.scoredExercise.exercise.id;
      if (!candidate.selected || !exerciseIds.has(exerciseId)) {
        return candidate;
      }
      return {
        ...candidate,
        selected: false,
        selectionReasons: [
          ...candidate.selectionReasons,
          "Removed from the session so the estimated duration fits the requested time budget.",
        ],
      };
    }),
  }));

  const decisions = composition.decisions.map((decision) => ({
    ...decision,
    keptExerciseIds: decision.keptExerciseIds.filter((exerciseId) => !exerciseIds.has(exerciseId)),
    rejected: [
      ...decision.rejected,
      ...decision.keptExerciseIds
        .filter((exerciseId) => exerciseIds.has(exerciseId))
        .map((exerciseId) => ({
          exerciseId,
          reason: "Removed to fit the requested time budget.",
        })),
    ],
  }));

  return { selections, decisions };
}
