/**
 * Combat Athlete System — Engine Orchestrator
 * Version 0.1
 *
 * Synchronous, deterministic orchestrator for the pipeline implemented so
 * far:
 *
 *   validation → module selection → eligibility → scoring (per module)
 *   → final selection → initial session draft → conflict detection
 *   → combat-schedule substitution (single pass) → reconstruction
 *   → prescription (of the final, post-substitution session) → Decision Trace
 *
 * `runEngine` never re-implements a rule already owned by another file —
 * it only sequences already-approved, already-pure functions and carries
 * their outputs forward. It never recomputes eligibility or scoring after
 * a substitution, never loops (see `attemptCombatScheduleSubstitutions`
 * for the termination argument: a successfully substituted exercise is,
 * by construction, mathematically guaranteed not to re-trigger the same
 * `combat_schedule` conflict, since `findSubstituteCandidate` and
 * `detectSessionConflicts` compare the same `recoveryHours`/`availableHours`
 * quantities with complementary inequalities), and never mutates `input`
 * or `exercises`.
 *
 * Prescription runs once, only against the final session draft (after any
 * substitution and reconstruction), via `prescribeEngineSession` — and it
 * runs on every draft. `runEngine(input)` alone returns a selected,
 * prescribed, explained session: the engine resolves its own prescription
 * sources from `input` (see `resolveEnginePrescriptionSources`), deriving
 * equipment capabilities from the declared environment, the range context
 * from reported readiness, and athlete references from the athlete's
 * recorded measurements. No caller is asked to supply registry data,
 * choose a dose, or call the engine twice to discover which exercises were
 * selected.
 *
 * The optional third parameter, `prescriptionSources`, is now an OVERRIDE
 * rather than an opt-in switch: passing it replaces the derived map
 * entirely, which is what registry-level tests and failure fixtures need.
 * Omitting it no longer means "do not prescribe". Nothing is ever
 * fabricated either way — an exercise with no resolvable source produces a
 * structured gap on `unprescribedSelectedExercises`, with its reason, its
 * Decision Trace entry and its warning, and `sessionDraft` still shows the
 * exercise the engine selected.
 *
 * This file deliberately does NOT produce: `EngineOutput`,
 * `GeneratedSession`, `GeneratedModule`, `SelectedExercise`,
 * `SessionLoadEstimate`, an autonomous final validation stage, a final
 * `valid | modified | rejected` status, automatic resolution of duration
 * or cumulative-fatigue conflicts, filling of empty secondary/support
 * modules, substitution triggered by newly reported pain or a new
 * constraint, cross-module substitution, backtracking to module
 * selection, a product-facing API, persistence, or analytics. All of
 * these remain out of scope for `runEngine` until the pipeline stages
 * that would honestly produce their inputs exist.
 */

import type {
  CapabilityModule,
  ConflictResolution,
  DetectedConflict,
  EngineInput,
  EngineRunResult,
  ExerciseDefinition,
  ExerciseEligibilityResult,
  ExerciseSelectionResult,
  Identifier,
  InitialSessionDraft,
  ScoredExercise,
  SelectedModule,
} from "./types";

import { filterEligibleExercises } from "./exerciseSelector";
import { selectCapabilityModules } from "./moduleSelector";
import { scoreEligibleExercises } from "./scoringEngine";
import { selectExercisesForModules } from "./exerciseFinalSelector";
import { generateInitialSession } from "./sessionGenerator";
import { detectSessionConflicts } from "./conflictResolver";
import { applySubstitution, findSubstituteCandidate } from "./substitutionEngine";
import { validateEngineInput } from "./validation";
import { buildDecisionTrace, buildInvalidInputDecisionTrace } from "./decisionTrace";
import type { ExercisePrescriptionSource } from "./prescription/buildPrescriptionInput";
import { buildEngineSessionPrescriptionSources } from "./prescription/buildEngineSessionPrescriptionSources";
import { deriveAthleteReferences } from "./prescription/deriveAthleteReferences";
import { prescribeEngineSession } from "./prescription/prescribeEngineSession";
import type { PrescriptionTraceContext } from "./prescription/prescriptionDecisionTrace";
import { EXERCISE_KNOWLEDGE_BASE } from "./exerciseKnowledgeBase";

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * The CAS Engine's production exercise catalog, re-exported here because
 * `index.ts` is the engine's sole public entry point. `runEngine` already
 * defaults to it when its `exercises` parameter is omitted (see below) —
 * this export exists for callers that need the catalog itself directly
 * (e.g. to build a `prescriptionSources` map keyed by its ids, or to
 * inspect/derive a filtered array before passing it explicitly).
 */
export { EXERCISE_KNOWLEDGE_BASE } from "./exerciseKnowledgeBase";

/**
 * Runs the full V0.1 pipeline against `input` and the candidate exercise
 * pool `exercises`, returning the most complete honest result this
 * version can produce. `exercises` defaults to `EXERCISE_KNOWLEDGE_BASE`
 * (a fresh copy of the engine's own production catalog) when omitted —
 * this default is a CAS Engine decision, not VITA's: VITA never
 * constructs or owns the exercise catalog. Passing an explicit array
 * (test fixtures, a filtered subset, any advanced caller) still fully
 * overrides the default, exactly as every historical two- and
 * three-argument call already does — omitting `exercises` was not a
 * valid call shape before this parameter had a default, so no existing
 * call site changes behavior. Stops immediately after validation when
 * `input` is invalid (`outcome: "invalid_input"`), and immediately after
 * session generation when no primary module has a selected exercise
 * (`outcome: "blocked"`). Otherwise attempts, in a single non-looping
 * pass, to resolve every detected `"combat_schedule"` conflict via an
 * already-ranked backup from the same module, then returns
 * `outcome: "draft"` with the (possibly substitution-updated) session
 * draft, the final conflict list and the `ConflictResolution[]` actually
 * applied. Deterministic `Error`s thrown by any called stage (contract
 * violations — duplicate modules, inconsistent selections, an impossible
 * stage output) are never caught here; they propagate as genuine
 * programming errors, never silently converted into a soft result.
 */
export function runEngine(
  input: EngineInput,
  exercises: ExerciseDefinition[] = [...EXERCISE_KNOWLEDGE_BASE],
  prescriptionSources?: ReadonlyMap<Identifier, ExercisePrescriptionSource>,
): EngineRunResult {
  const validation = validateEngineInput(input);
  if (!validation.valid) {
    return {
      outcome: "invalid_input",
      validation,
      decisionTrace: buildInvalidInputDecisionTrace(input, validation),
    };
  }

  const eligibilityResults = filterEligibleExercises(exercises, input);
  const { selectedModules } = selectCapabilityModules(input);

  const { scoredExercisesByModule, scoredExercises } = scoreExercisesByModule(
    exercises,
    eligibilityResults,
    input,
    selectedModules,
  );

  const exerciseSelections = selectExercisesForModules(scoredExercisesByModule, selectedModules, input);

  const sessionResult = generateInitialSession(input, selectedModules, exerciseSelections);

  if (sessionResult.outcome === "blocked") {
    const decisionTrace = buildDecisionTrace(
      input,
      validation,
      selectedModules,
      eligibilityResults,
      scoredExercises,
      exerciseSelections,
      sessionResult,
      [],
      [],
    );

    return {
      outcome: "blocked",
      validation,
      selectedModules,
      eligibilityResults,
      scoredExercises,
      sessionResult,
      decisionTrace,
    };
  }

  const initialConflicts = detectSessionConflicts(sessionResult.draft, input);
  const substitutionPass = attemptCombatScheduleSubstitutions(exerciseSelections, initialConflicts, input);

  let finalSessionResult = sessionResult;
  let conflicts = initialConflicts;

  if (substitutionPass.substitutionApplied) {
    const reconstructed = generateInitialSession(input, selectedModules, substitutionPass.exerciseSelections);
    if (reconstructed.outcome === "blocked") {
      throw new Error("Session reconstruction unexpectedly became blocked after a valid within-module substitution.");
    }
    finalSessionResult = reconstructed;
    conflicts = detectSessionConflicts(reconstructed.draft, input);
  }

  const decisionTrace = buildDecisionTrace(
    input,
    validation,
    selectedModules,
    eligibilityResults,
    scoredExercises,
    substitutionPass.exerciseSelections,
    finalSessionResult,
    conflicts,
    substitutionPass.conflictResolutions,
  );

  // Prescription runs against the final draft — after substitution and
  // reconstruction, never before (see the module docstring above) — and it
  // now runs on EVERY draft. When `prescriptionSources` is omitted, the
  // engine resolves its own sources from `input`, so a plain
  // `runEngine(input)` returns a selected, prescribed, explained session.
  //
  // The explicit third argument survives as an override for callers that
  // genuinely need to control source data (registry-level tests, a fixture
  // exercising a specific failure). It is no longer the switch that decides
  // whether prescription happens at all: deciding that was never a caller's
  // call to make.
  const resolvedPrescriptionSources =
    prescriptionSources ?? resolveEnginePrescriptionSources(input, finalSessionResult.draft);

  const prescriptionTraceContext: PrescriptionTraceContext = {
    idPrefix: `trace_${input.request.requestId}`,
    timestamp: input.request.requestedAt,
  };
  const sessionPrescriptionResult = prescribeEngineSession(
    finalSessionResult.draft,
    resolvedPrescriptionSources,
    prescriptionTraceContext,
  );
  // Both lists are extended, never rebuilt: `buildDecisionTrace` runs before
  // prescription and cannot know about an omitted exercise, so the
  // prescription stage contributes its own entries and its own warnings.
  // The wording of each is owned by `prescribeEngineSession`, not here.
  const decisionTraceWithPrescription = {
    ...decisionTrace,
    entries: [...decisionTrace.entries, ...sessionPrescriptionResult.traceEntries],
    warnings: [...decisionTrace.warnings, ...sessionPrescriptionResult.warnings],
  };

  return {
    outcome: "draft",
    validation,
    selectedModules,
    eligibilityResults,
    scoredExercises,
    sessionDraft: finalSessionResult.draft,
    conflicts,
    conflictResolutions: substitutionPass.conflictResolutions,
    decisionTrace: decisionTraceWithPrescription,
    prescription: sessionPrescriptionResult.outcome,
  };
}

// -----------------------------------------------------------------------------
// Prescription context (derived, never supplied)
// -----------------------------------------------------------------------------

/**
 * Builds the prescription source map for `draft` entirely from `input`.
 *
 * Every element of the execution context is derived by CAS from athlete
 * facts the engine already received — nothing is asked of the caller:
 *
 *   equipment capabilities  ← `input.environment`      (Lot 2)
 *   range context           ← `input.readiness`        (Lot 3)
 *   athlete references      ← `input.athleteProfile.performanceReferences`
 *   load rounding           ← not applied; see below
 *
 * `loadRounding` is deliberately left undefined. It is a real prescription
 * policy (an increment, a rounding mode and the rule id that justifies
 * them), and no document in this repository specifies one for V0.1 —
 * `resolveIntensity` already treats its absence as "do not round" and adds
 * no rule id. Inventing a plate increment here would be a fabricated
 * numerical decision underneath every computed load, so the honest V0.1
 * position is that CAS applies no rounding rule and says so. The field
 * stays on the low-level `PrescriptionExecutionContext` for the day a
 * rounding policy is documented.
 *
 * A resolution failure (exercise absent from the registry, missing
 * equipment capability, missing athlete reference) is never thrown and
 * never fabricated around: the exercise simply gets no source, which
 * `prescribeEngineSession` reports as a gap and
 * `unprescribedSelectedExercises` exposes with its reason.
 */
function resolveEnginePrescriptionSources(
  input: EngineInput,
  draft: InitialSessionDraft,
): ReadonlyMap<Identifier, ExercisePrescriptionSource> {
  const selectedExerciseIds = draft.modules.flatMap((generatedModule) =>
    generatedModule.exerciseSelection.candidates
      .filter((candidate) => candidate.selected)
      .map((candidate) => candidate.scoredExercise.exercise.id),
  );

  const { sources } = buildEngineSessionPrescriptionSources(selectedExerciseIds, {
    environment: input.environment,
    readiness: input.readiness,
    athleteReferences: deriveAthleteReferences(input).references,
  });

  return sources;
}

// -----------------------------------------------------------------------------
// Scoring by module
// -----------------------------------------------------------------------------

interface ModuleScoringResult {
  scoredExercisesByModule: Map<CapabilityModule, ScoredExercise[]>;
  scoredExercises: ScoredExercise[];
}

/**
 * Scores every selected module's own exercises only. `scoreEligibleExercises`
 * does not filter by `exercise.module` itself, and `selectExercisesForModule`
 * throws if it ever receives a `ScoredExercise` whose `exercise.module`
 * does not match — so every module must be scored against a pre-filtered
 * subset of `exercises`, never the full pool. Each exercise is therefore
 * scored exactly once, in the single call for its own module.
 */
function scoreExercisesByModule(
  exercises: ExerciseDefinition[],
  eligibilityResults: ExerciseEligibilityResult[],
  input: EngineInput,
  selectedModules: SelectedModule[],
): ModuleScoringResult {
  const scoredExercisesByModule = new Map<CapabilityModule, ScoredExercise[]>();
  const scoredExercises: ScoredExercise[] = [];

  for (const selectedModule of selectedModules) {
    const moduleExercises = getExercisesForModule(exercises, selectedModule.module);
    const moduleScoredExercises = scoreEligibleExercises(moduleExercises, eligibilityResults, input, selectedModule);
    scoredExercisesByModule.set(selectedModule.module, moduleScoredExercises);
    scoredExercises.push(...moduleScoredExercises);
  }

  return { scoredExercisesByModule, scoredExercises };
}

/** Every exercise whose own `module` matches `module`, in `exercises`' original order. */
function getExercisesForModule(exercises: ExerciseDefinition[], module: CapabilityModule): ExerciseDefinition[] {
  return exercises.filter((exercise) => exercise.module === module);
}

// -----------------------------------------------------------------------------
// Single-pass combat-schedule substitution
// -----------------------------------------------------------------------------

interface SubstitutionPassResult {
  exerciseSelections: ExerciseSelectionResult[];
  conflictResolutions: ConflictResolution[];
  substitutionApplied: boolean;
}

/**
 * Attempts, in the order `conflicts` was received, to resolve every
 * `"combat_schedule"` conflict using an already-ranked backup from the
 * same module's `ExerciseSelectionResult`. Every other conflict type is
 * skipped. At most one substitution is attempted per module per pass — a
 * module already substituted in this pass is skipped for any further
 * conflict referencing it. Never rescoring, never re-checking eligibility,
 * never touching a module not already carrying a `"combat_schedule"`
 * conflict. `exerciseSelections` is never mutated: each accepted
 * substitution produces a new array via `applySubstitution` and a
 * positional replacement.
 */
function attemptCombatScheduleSubstitutions(
  exerciseSelections: ExerciseSelectionResult[],
  conflicts: readonly DetectedConflict[],
  input: EngineInput,
): SubstitutionPassResult {
  let currentSelections = exerciseSelections;
  const conflictResolutions: ConflictResolution[] = [];
  const substitutedModules = new Set<CapabilityModule>();
  let substitutionApplied = false;

  for (const conflict of conflicts) {
    if (conflict.type !== "combat_schedule") {
      continue;
    }

    if (conflict.affectedExerciseIds?.length !== 1) {
      throw new Error(`Combat schedule conflict "${conflict.id}" must affect exactly one exercise.`);
    }
    const [exerciseIdToReplace] = conflict.affectedExerciseIds;

    const selectionIndex = findSelectionIndexForSelectedExercise(currentSelections, exerciseIdToReplace, conflict.id);
    const exerciseSelection = currentSelections[selectionIndex];

    if (substitutedModules.has(exerciseSelection.module)) {
      continue;
    }

    const searchResult = findSubstituteCandidate(exerciseSelection, exerciseIdToReplace, conflict, input);
    if (searchResult.outcome === "unavailable") {
      continue;
    }

    const replacementExerciseId = searchResult.candidate.scoredExercise.exercise.id;
    const updatedSelection = applySubstitution(exerciseSelection, exerciseIdToReplace, replacementExerciseId);

    currentSelections = currentSelections.map((selection, index) =>
      index === selectionIndex ? updatedSelection : selection,
    );

    conflictResolutions.push({
      conflictId: conflict.id,
      action: "substitute_exercise",
      description: `Exercise "${exerciseIdToReplace}" was replaced by "${replacementExerciseId}" to fit the recovery window before the next combat session.`,
      removedExerciseIds: [exerciseIdToReplace],
      addedExerciseIds: [replacementExerciseId],
    });

    substitutedModules.add(exerciseSelection.module);
    substitutionApplied = true;
  }

  return { exerciseSelections: currentSelections, conflictResolutions, substitutionApplied };
}

/**
 * The single `ExerciseSelectionResult` whose currently `selected: true`
 * candidate is `exerciseId` — never searched among backups. Throws when
 * none or more than one module claims this exercise as selected, since
 * both situations are pipeline-contract violations, not normal outcomes.
 */
function findSelectionIndexForSelectedExercise(
  exerciseSelections: readonly ExerciseSelectionResult[],
  exerciseId: Identifier,
  conflictId: Identifier,
): number {
  const matchingIndexes: number[] = [];

  exerciseSelections.forEach((exerciseSelection, index) => {
    const isSelectedHere = exerciseSelection.candidates.some(
      (candidate) => candidate.selected && candidate.scoredExercise.exercise.id === exerciseId,
    );
    if (isSelectedHere) {
      matchingIndexes.push(index);
    }
  });

  if (matchingIndexes.length === 0) {
    throw new Error(`Cannot resolve conflict "${conflictId}": selected exercise "${exerciseId}" was not found.`);
  }
  if (matchingIndexes.length > 1) {
    throw new Error(
      `Cannot resolve conflict "${conflictId}": selected exercise "${exerciseId}" appears in multiple modules.`,
    );
  }

  return matchingIndexes[0];
}
