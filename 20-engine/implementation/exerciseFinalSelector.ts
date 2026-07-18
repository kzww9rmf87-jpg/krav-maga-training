/**
 * Combat Athlete System — Exercise Final Selection (Initial Candidate Selection)
 * Version 0.1
 *
 * The third and last stage of the exercise pipeline implemented so far:
 *
 *   Eligibility (`exerciseSelector.ts`)
 *   → Scoring (`scoringEngine.ts`)
 *   → Final selection (this file)
 *
 * This module never recomputes eligibility or scoring. It only decides,
 * among already-scored candidates for one Capability Module, which single
 * candidate is the Minimum Effective Assembly V0.1 pick, while preserving
 * every other admissible candidate as a ranked bench for later stages.
 *
 * `input: EngineInput` is part of the public signature but intentionally
 * unused in V0.1 — it is reserved for rules this version explicitly defers
 * (duration budget, cumulative fatigue), so the signature does not need to
 * change again when those rules are implemented.
 *
 * Explicitly deferred to later modules (not implemented here):
 * - a variable number of exercises depending on available duration;
 * - a variable number of exercises depending on module role;
 * - movement-pattern diversity;
 * - biomechanical redundancy between candidates;
 * - cumulative (multi-exercise) fatigue budgets;
 * - interference between exercises;
 * - joint-stress conflicts;
 * - intra-module exercise ordering;
 * - essential vs. optional exercise functions within a module;
 * - plyometrics / ballistics / carries categorisation;
 * - automatic substitution;
 * - backtracking to module selection;
 * - prescription (sets, reps, load, rest);
 * - session assembly;
 * - Decision Trace generation.
 *
 * These rules belong primarily to `conflictResolver.ts`, `substitutionEngine.ts`
 * and `sessionGenerator.ts` — all still empty stubs at the time of writing.
 */

import type {
  CapabilityModule,
  EngineInput,
  ExerciseSelectionResult,
  ScoredExercise,
  SelectedExerciseCandidate,
  SelectedModule,
} from "./types";

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Selects the Minimum Effective Assembly V0.1 candidate for one Capability
 * Module out of its already-scored, already-ranked candidates.
 *
 * `scoredExercises` must already be sorted (as produced by
 * `scoreEligibleExercises`) — this function never re-sorts or re-applies
 * tie-break rules. Every candidate whose `exercise.module` does not match
 * `selectedModule.module` causes a deterministic `Error`, including
 * candidates that would otherwise be below the selection threshold.
 *
 * Candidates with `finalScore < 60` are dropped entirely. Among the
 * remaining, already-ordered candidates, only the first is marked
 * `selected: true`; every other admissible candidate is kept, marked
 * `selected: false`, as a ranked bench for substitution, conflict
 * resolution, backtracking or session generation. When no candidate
 * reaches the threshold, `candidates` is an empty array — this function
 * never throws, removes the module or attempts a substitution for that
 * case; interpreting an empty result (especially for a `"primary"` module)
 * is left entirely to the future orchestrator.
 */
export function selectExercisesForModule(
  scoredExercises: ScoredExercise[],
  selectedModule: SelectedModule,
  // `input` is intentionally unused in V0.1 — reserved for deferred duration/fatigue rules, see file header.
  input: EngineInput,
): ExerciseSelectionResult {
  assertCandidatesBelongToModule(scoredExercises, selectedModule);

  const admissibleCandidates = scoredExercises.filter(
    (scoredExercise) => scoredExercise.finalScore >= CONDITIONAL_CANDIDATE_THRESHOLD,
  );

  const candidates: SelectedExerciseCandidate[] = admissibleCandidates.map((scoredExercise, index) => {
    const selected = index === 0;
    return {
      scoredExercise,
      selected,
      selectionReasons: selected
        ? buildSelectedReasons(scoredExercise, selectedModule.module)
        : buildBackupReasons(scoredExercise),
    };
  });

  return {
    module: selectedModule.module,
    role: selectedModule.role,
    candidates,
  };
}

/**
 * Applies `selectExercisesForModule` to every entry of `selectedModules`, in
 * order, pulling each module's candidates from `scoredExercisesByModule`. A
 * module with no entry in the map is treated as having zero candidates,
 * never as an error. Neither `scoredExercisesByModule` nor `selectedModules`
 * (nor any array reachable from them) is mutated. The returned array has
 * exactly one `ExerciseSelectionResult` per entry of `selectedModules`, in
 * the same order.
 */
export function selectExercisesForModules(
  scoredExercisesByModule: ReadonlyMap<CapabilityModule, ScoredExercise[]>,
  selectedModules: SelectedModule[],
  input: EngineInput,
): ExerciseSelectionResult[] {
  return selectedModules.map((selectedModule) => {
    const scoredExercises = scoredExercisesByModule.get(selectedModule.module) ?? [];
    return selectExercisesForModule(scoredExercises, selectedModule, input);
  });
}

// -----------------------------------------------------------------------------
// Documented selection thresholds (`16_SCORING_MODEL.md`, "Selection Thresholds")
// -----------------------------------------------------------------------------

const AUTOMATIC_SELECTION_THRESHOLD = 80;
const VALID_CANDIDATE_THRESHOLD = 70;
const CONDITIONAL_CANDIDATE_THRESHOLD = 60;

// -----------------------------------------------------------------------------
// Consistency guard
// -----------------------------------------------------------------------------

/**
 * A candidate whose `exercise.module` does not match `selectedModule.module`
 * indicates a pipeline call error (candidates from the wrong module), never
 * a data condition to represent silently. Checked against every received
 * candidate, including those below the selection threshold.
 */
function assertCandidatesBelongToModule(
  scoredExercises: readonly ScoredExercise[],
  selectedModule: SelectedModule,
): void {
  for (const scoredExercise of scoredExercises) {
    if (scoredExercise.exercise.module !== selectedModule.module) {
      throw new Error(
        `Cannot select exercise "${scoredExercise.exercise.id}" for module "${selectedModule.module}": exercise belongs to module "${scoredExercise.exercise.module}".`,
      );
    }
  }
}

// -----------------------------------------------------------------------------
// Selection reasons
// -----------------------------------------------------------------------------

function buildSelectedReasons(scoredExercise: ScoredExercise, module: CapabilityModule): string[] {
  return [describeSelectedBand(scoredExercise.finalScore), `Highest-ranked admissible candidate for the ${module} module.`];
}

function buildBackupReasons(scoredExercise: ScoredExercise): string[] {
  return [describeBackupBand(scoredExercise.finalScore)];
}

function describeSelectedBand(finalScore: number): string {
  const formattedScore = formatScore(finalScore);
  if (finalScore >= AUTOMATIC_SELECTION_THRESHOLD) {
    return `Automatically selected with a final score of ${formattedScore} (threshold: 80).`;
  }
  if (finalScore >= VALID_CANDIDATE_THRESHOLD) {
    return `Selected as a valid candidate with a final score of ${formattedScore} (threshold: 70).`;
  }
  return `Conditionally selected with a final score of ${formattedScore} (threshold: 60).`;
}

function describeBackupBand(finalScore: number): string {
  const formattedScore = formatScore(finalScore);
  if (finalScore >= AUTOMATIC_SELECTION_THRESHOLD) {
    return `Retained as an automatic-selection backup with a final score of ${formattedScore}.`;
  }
  if (finalScore >= VALID_CANDIDATE_THRESHOLD) {
    return `Retained as a valid backup candidate with a final score of ${formattedScore}.`;
  }
  return `Retained as a conditional backup candidate with a final score of ${formattedScore}.`;
}

/** Two-decimal display formatting only — never mutates the underlying score value. */
function formatScore(finalScore: number): string {
  return finalScore.toFixed(2);
}
