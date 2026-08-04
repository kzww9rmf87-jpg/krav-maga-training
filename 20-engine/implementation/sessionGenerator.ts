/**
 * Combat Athlete System — Initial Session Draft Generation
 * Version 0.1
 *
 * Fourth stage of the exercise pipeline implemented so far:
 *
 *   Eligibility (`exerciseSelector.ts`)
 *   → Scoring (`scoringEngine.ts`)
 *   → Final selection (`exerciseFinalSelector.ts`)
 *   → Initial session draft (this file)
 *
 * This module assembles the selected Capability Modules and their retained
 * exercises into a structural draft. It never recomputes eligibility or
 * scoring, never picks an exercise that wasn't already marked `selected`
 * by `exerciseFinalSelector.ts`, and never invents a physiological
 * prescription.
 *
 * It deliberately does NOT produce `GeneratedSession`, `GeneratedModule`,
 * `SelectedExercise`, `ExercisePrescription`, `SessionLoadEstimate` or a
 * `DecisionTrace` — none of those can be filled honestly at this stage
 * (see `InitialSessionDraft` in `types.ts` for the intermediate contract
 * this file actually produces).
 *
 * Explicitly deferred to later modules (not implemented here):
 * - prescription (sets, repetitions, load, RPE, rest, tempo);
 * - stop conditions and coaching cues;
 * - whole-session load estimation (`SessionLoadEstimate`);
 * - a maximum-duration check against `input.request.durationMinutes`, and
 *   any content reduction in response to it;
 * - cumulative fatigue, conflict detection and resolution;
 * - redundancy and interference between exercises;
 * - substitution and backtracking;
 * - final session validation and `status`;
 * - Decision Trace generation.
 *
 * These rules belong primarily to `conflictResolver.ts`, `substitutionEngine.ts`,
 * `sessionGenerator.ts`'s own later versions, and `decisionTrace.ts` — all
 * still empty stubs at the time of writing.
 */

import type {
  AdaptationDomain,
  CapabilityModule,
  ConfidenceLevel,
  EngineInput,
  ExerciseSelectionResult,
  InitialGeneratedModule,
  InitialSessionDraft,
  InitialSessionGenerationResult,
  SelectedExerciseCandidate,
  SelectedModule,
  SessionObjective,
} from "./types";

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Assembles `selectedModules` and their corresponding `exerciseSelections`
 * into an `InitialSessionDraft`, or reports a blocking condition.
 *
 * A module with no matching entry in `exerciseSelections` is treated as an
 * empty (never as an erroneous) selection. Two pipeline-call errors are
 * detected and thrown as deterministic `Error`s instead: more than one
 * `ExerciseSelectionResult` for the same module, a `role` mismatch between
 * a `SelectedModule` and its matching `ExerciseSelectionResult`, and more
 * than one candidate marked `selected: true` within a single module.
 *
 * The session is blocked (`outcome: "blocked"`) when no `"primary"` module
 * was selected at all, or when at least one `"primary"` module has no
 * selected exercise. A `"secondary"`/`"support"` module without a selected
 * exercise never blocks generation — it is kept in `draft.modules` with an
 * empty `exerciseSelection.candidates`.
 *
 * Fully deterministic: `sessionId`/`generatedAt` come from `input.request`,
 * never from `Math.random()`, `crypto.randomUUID()` or the system clock.
 */
export function generateInitialSession(
  input: EngineInput,
  selectedModules: SelectedModule[],
  exerciseSelections: ExerciseSelectionResult[],
): InitialSessionGenerationResult {
  const resolutions = resolveModules(selectedModules, exerciseSelections);

  const primaryResolutions = resolutions.filter((resolution) => resolution.selectedModule.role === "primary");

  if (primaryResolutions.length === 0) {
    return {
      outcome: "blocked",
      reasonCode: "NO_PRIMARY_MODULE_SELECTED",
      reason: "No primary Capability Module was selected for the session.",
      blockedModules: [],
    };
  }

  const blockedModules = collectBlockedPrimaryModules(primaryResolutions);
  if (blockedModules.length > 0) {
    return {
      outcome: "blocked",
      reasonCode: "NO_PRIMARY_MODULE_EXERCISE_AVAILABLE",
      reason: "No selected exercise is available for one or more primary Capability Modules.",
      blockedModules,
    };
  }

  const modules: InitialGeneratedModule[] = resolutions.map((resolution, index) => ({
    order: index + 1,
    selectedModule: resolution.selectedModule,
    exerciseSelection: resolution.exerciseSelection,
    estimatedDurationMinutes: computeModuleEstimatedDuration(resolution.selectedCandidates),
  }));

  const draft: InitialSessionDraft = {
    sessionId: input.request.requestId,
    generatedAt: input.request.requestedAt,
    engineVersion: "0.1",
    title: buildTitle(input.request.primaryObjective),
    primaryObjective: input.request.primaryObjective,
    secondaryObjectives: input.request.secondaryObjectives ?? [],
    modules,
    estimatedDurationMinutes: computeSessionEstimatedDuration(modules),
    confidence: aggregateConfidence(resolutions),
  };

  return { outcome: "draft", draft };
}

// -----------------------------------------------------------------------------
// Module resolution and consistency guards
// -----------------------------------------------------------------------------

interface ModuleResolution {
  selectedModule: SelectedModule;
  exerciseSelection: ExerciseSelectionResult;
  selectedCandidates: SelectedExerciseCandidate[];
}

function resolveModules(
  selectedModules: readonly SelectedModule[],
  exerciseSelections: readonly ExerciseSelectionResult[],
): ModuleResolution[] {
  const selectionsByModule = indexExerciseSelectionsByModule(exerciseSelections);

  return selectedModules.map((selectedModule) => {
    const exerciseSelection = resolveModuleExerciseSelection(selectedModule, selectionsByModule);
    return {
      selectedModule,
      exerciseSelection,
      selectedCandidates: findSelectedCandidates(exerciseSelection),
    };
  });
}

/** Throws on a duplicate `ExerciseSelectionResult` for the same module — a pipeline-call error. */
function indexExerciseSelectionsByModule(
  exerciseSelections: readonly ExerciseSelectionResult[],
): ReadonlyMap<CapabilityModule, ExerciseSelectionResult> {
  const selectionsByModule = new Map<CapabilityModule, ExerciseSelectionResult>();

  for (const exerciseSelection of exerciseSelections) {
    if (selectionsByModule.has(exerciseSelection.module)) {
      throw new Error(`Duplicate exercise selection result for module "${exerciseSelection.module}".`);
    }
    selectionsByModule.set(exerciseSelection.module, exerciseSelection);
  }

  return selectionsByModule;
}

/**
 * A missing entry is a normal empty selection, not an error. When an entry
 * exists, it is looked up by `selectedModule.module` against a map keyed by
 * `exerciseSelection.module`, so the two module identifiers are already
 * guaranteed equal by construction — only `role` still needs checking.
 */
function resolveModuleExerciseSelection(
  selectedModule: SelectedModule,
  selectionsByModule: ReadonlyMap<CapabilityModule, ExerciseSelectionResult>,
): ExerciseSelectionResult {
  const exerciseSelection = selectionsByModule.get(selectedModule.module);

  if (exerciseSelection === undefined) {
    return { module: selectedModule.module, role: selectedModule.role, candidates: [] };
  }

  if (exerciseSelection.role !== selectedModule.role) {
    throw new Error(
      `Exercise selection role mismatch for module "${selectedModule.module}": expected "${selectedModule.role}", received "${exerciseSelection.role}".`,
    );
  }

  return exerciseSelection;
}

/**
 * Every candidate the composer kept for this module, in bench order.
 *
 * A module may now contribute several exercises (`sessionComposer.ts`), so
 * more than one `selected: true` is a normal composition rather than the
 * pipeline-call error it used to be. Zero remains normal too, for a
 * secondary or support module whose bench was empty.
 */
function findSelectedCandidates(exerciseSelection: ExerciseSelectionResult): SelectedExerciseCandidate[] {
  return exerciseSelection.candidates.filter((candidate) => candidate.selected);
}

// -----------------------------------------------------------------------------
// Blocking conditions
// -----------------------------------------------------------------------------

/** Primary modules without a selected exercise, in `selectedModules` order, without duplicates. */
function collectBlockedPrimaryModules(primaryResolutions: readonly ModuleResolution[]): CapabilityModule[] {
  const blockedModules: CapabilityModule[] = [];
  const seenModules = new Set<CapabilityModule>();

  for (const resolution of primaryResolutions) {
    if (resolution.selectedCandidates.length > 0) {
      continue;
    }
    if (seenModules.has(resolution.selectedModule.module)) {
      continue;
    }
    seenModules.add(resolution.selectedModule.module);
    blockedModules.push(resolution.selectedModule.module);
  }

  return blockedModules;
}

// -----------------------------------------------------------------------------
// Duration estimation
// -----------------------------------------------------------------------------

/**
 * Always `undefined` at assembly time, on purpose.
 *
 * Duration is estimated from the resolved PRESCRIPTION — sets, prescribed
 * hold/round/interval durations, prescribed rest — and prescription runs
 * after this stage. Nothing in `ExerciseDefinition` can honestly answer
 * "how long does this take" before the dose exists, and the two
 * knowledge-base fields that once tried (`setupTimeMinutes`,
 * `defaultExerciseDurationMinutes`) were a second, competing duration model
 * that no production exercise ever populated.
 *
 * `runEngine` completes the draft with the real estimate once
 * `estimateSessionDuration` has run. The parameter is kept so the module
 * shape and its call site do not change.
 */
function computeModuleEstimatedDuration(_candidates: readonly SelectedExerciseCandidate[]): number | undefined {
  return undefined;
}

/**
 * Sum of every module's `estimatedDurationMinutes` that has a selected
 * exercise. Empty secondary/support modules are skipped — they contribute
 * no active exercise and must not force the total to `undefined`. Any
 * contributing module with an unknown duration makes the whole total
 * `undefined` rather than silently understating it.
 */
function computeSessionEstimatedDuration(modules: readonly InitialGeneratedModule[]): number | undefined {
  let total = 0;

  for (const generatedModule of modules) {
    const hasSelectedExercise = generatedModule.exerciseSelection.candidates.some((candidate) => candidate.selected);
    if (!hasSelectedExercise) {
      continue;
    }
    if (generatedModule.estimatedDurationMinutes === undefined) {
      return undefined;
    }
    total += generatedModule.estimatedDurationMinutes;
  }

  return total;
}

// -----------------------------------------------------------------------------
// Confidence aggregation
// -----------------------------------------------------------------------------

/** From weakest to strongest — the session's confidence is the weakest value found among selected exercises. */
const CONFIDENCE_ORDER: readonly ConfidenceLevel[] = ["very_low", "low", "moderate", "high", "very_high"];

/**
 * The weakest `ConfidenceLevel` among every module's selected exercise.
 * Backup (non-selected) candidates never influence this value. A non-blocked
 * session is guaranteed to have at least one selected exercise (its primary
 * modules), so the defensive `Error` below should never trigger in practice.
 */
function aggregateConfidence(resolutions: readonly ModuleResolution[]): ConfidenceLevel {
  let weakestConfidence: ConfidenceLevel | undefined;
  let weakestRank = Number.POSITIVE_INFINITY;

  for (const resolution of resolutions) {
    for (const candidate of resolution.selectedCandidates) {
      const confidence = candidate.scoredExercise.confidence;
      const rank = CONFIDENCE_ORDER.indexOf(confidence);
      if (rank < weakestRank) {
        weakestRank = rank;
        weakestConfidence = confidence;
      }
    }
  }

  if (weakestConfidence === undefined) {
    throw new Error(
      "generateInitialSession: no selected exercise was found although the session was not blocked — pipeline inconsistency.",
    );
  }

  return weakestConfidence;
}

// -----------------------------------------------------------------------------
// Deterministic title
// -----------------------------------------------------------------------------

function buildTitle(primaryObjective: SessionObjective): string {
  return `${humanizeAdaptationDomain(primaryObjective.adaptationDomain)} Session`;
}

/** `lower_snake_case` → `Title Case`, e.g. `functional_hypertrophy` → `Functional Hypertrophy`. */
function humanizeAdaptationDomain(adaptationDomain: AdaptationDomain): string {
  return adaptationDomain
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
