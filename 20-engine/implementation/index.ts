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
  DecisionTraceEntry,
  ExerciseSelectionResult,
  Identifier,
  InitialSessionDraft,
  ScoredExercise,
  SelectedModule,
  ValidationIssue,
} from "./types";

import { filterEligibleExercises } from "./exerciseSelector";
import { selectCapabilityModules } from "./moduleSelector";
import { scoreEligibleExercises } from "./scoringEngine";
import { selectExercisesForModules } from "./exerciseFinalSelector";
import { buildRemovalOrder, composeSession, withoutExercises, type SessionComposition } from "./sessionComposer";
import { generateInitialSession } from "./sessionGenerator";
import { detectSessionConflicts } from "./conflictResolver";
import { applySubstitution, findSubstituteCandidate } from "./substitutionEngine";
import { validateEngineInput } from "./validation";
import { buildDecisionTrace, buildInvalidInputDecisionTrace } from "./decisionTrace";
import type { ExercisePrescriptionSource } from "./prescription/buildPrescriptionInput";
import { buildEngineSessionPrescriptionSources } from "./prescription/buildEngineSessionPrescriptionSources";
import { deriveAthleteReferences } from "./prescription/deriveAthleteReferences";
import { prescribeEngineSession, type EngineSessionPrescriptionResult } from "./prescription/prescribeEngineSession";
import { estimateSessionDuration, type SessionDurationEstimate } from "./prescription/estimatePrescriptionDuration";
import type { PrescriptionTraceContext } from "./prescription/prescriptionDecisionTrace";
import { EXERCISE_KNOWLEDGE_BASE } from "./exerciseKnowledgeBase";
import { adaptCasSessionInput } from "./sessionInput/adaptCasSessionInput";
import type { CasSessionInputV1 } from "./sessionInput/types";
import {
  findCasSessionInputStructuralIssues,
  readRequestIdForDiagnostics,
  readRequestedAtForDiagnostics,
} from "./sessionInput/validateCasSessionInputStructure";
import { serializeEngineRunResult } from "./sessionOutput/serializeEngineRunResult";
import type { CasSessionOutputV1 } from "./sessionOutput/types";

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
 * The public boundary, in one function.
 *
 *   CasSessionInputV1 → adapt → EngineInput → runEngine → CasSessionOutputV1
 *
 * This is the call a platform makes. It never sees `EngineInput`, a
 * prescription source map, an equipment capability, a range context or a
 * registry identifier — it sends public athlete facts, environment facts,
 * intent, constraints and preferences, and receives a selected, prescribed,
 * explained session under a versioned contract.
 *
 * `generatedAt` is a parameter rather than a clock read, exactly as
 * `serializeEngineRunResult` requires: the engine is deterministic, and the
 * only honest source for "when was this produced" is the caller that owns
 * the clock. Given the same input and the same `generatedAt`, this function
 * always returns byte-identical JSON.
 *
 * Every outcome is a value, never a rejected promise or a thrown error:
 * invalid input comes back as `outcome: "invalid_input"` with typed issues,
 * an unsatisfiable request as `outcome: "blocked"` with a reason. The
 * deterministic `Error`s documented on `runEngine` remain genuine
 * programming errors and are deliberately not caught here — converting a
 * contract violation into a soft result would hide a bug rather than
 * report it.
 */
export function generateCasSession(input: CasSessionInputV1, generatedAt: string): CasSessionOutputV1 {
  // A payload that is not shaped like the contract cannot be projected at
  // all, and the projection would fail with a raw `TypeError` rather than a
  // result the caller can read. Structurally malformed input therefore comes
  // back as `outcome: "invalid_input"`, exactly like a semantically invalid
  // one — this function never throws on data a client sent.
  const structuralIssues = findCasSessionInputStructuralIssues(input);
  if (structuralIssues.length > 0) {
    return buildStructurallyInvalidOutput(input, structuralIssues, generatedAt);
  }

  const engineInput = adaptCasSessionInput(input);
  const exercises = [...EXERCISE_KNOWLEDGE_BASE];
  const result = runEngine(engineInput, exercises);

  return serializeEngineRunResult(result, exercises, generatedAt);
}

/**
 * The `invalid_input` result for a payload that could not even be projected.
 *
 * Shaped exactly like the one `serializeEngineRunResult` produces for a
 * semantically invalid input — same outcome, same validation shape, same
 * trace stage, empty `exerciseReferences` — so a consumer handles both
 * through one code path.
 */
function buildStructurallyInvalidOutput(
  input: unknown,
  issues: readonly ValidationIssue[],
  generatedAt: string,
): CasSessionOutputV1 {
  const requestId = readRequestIdForDiagnostics(input);
  const timestamp = readRequestedAtForDiagnostics(input, generatedAt);

  return {
    contractVersion: "cas-session-output.v1",
    engineVersion: "0.1",
    generatedAt,
    outcome: "invalid_input",
    validation: {
      valid: false,
      issues: issues.map((issue) => ({
        code: issue.code,
        path: issue.path,
        message: issue.message,
        severity: issue.severity,
      })),
    },
    decisionTrace: {
      traceId: `trace_${requestId}`,
      entries: [
        {
          id: `trace_${requestId}_input_validation`,
          timestamp,
          stage: "input_validation",
          decision: "Input validation completed: the payload does not match the cas-session-input.v1 structure.",
          reasons: issues.map((issue) => issue.message),
        },
      ],
      rejectedExercises: [],
      detectedConflicts: [],
      conflictResolutions: [],
      warnings: [],
    },
    exerciseReferences: {},
  };
}

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

  const rankedSelections = selectExercisesForModules(scoredExercisesByModule, selectedModules, input);

  // Composition turns each module's ranked bench into the exercises the
  // session actually holds. It never pads to fill the requested time —
  // see `sessionComposer.ts` for the Minimum Effective Session Principle
  // this implements.
  const composition = composeSession(rankedSelections, selectedModules);
  const exerciseSelections = [...composition.selections];

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
  // Duration is estimated from the PRESCRIPTION, so it can only be known
  // here — after the doses are resolved. `generateInitialSession` runs
  // before prescription exists and therefore cannot produce it; the draft it
  // returns is completed with the estimate below rather than guessing
  // earlier from knowledge-base metadata that no exercise carries.
  let workingComposition: SessionComposition = { selections: exerciseSelections, decisions: composition.decisions };
  let workingSessionResult = finalSessionResult;
  let workingPrescription = sessionPrescriptionResult;
  const removedForTimeBudget: { exerciseId: Identifier; module: CapabilityModule }[] = [];

  // Reduce to the requested time budget.
  //
  // `18_SESSION_GENERATION_PIPELINE.md` prefers "a shorter valid session"
  // over "a longer incoherent" one, so an over-budget session gives up whole
  // exercises rather than having its doses quietly trimmed — volume,
  // intensity and rest were decided by the prescription layer and are not
  // this stage's to shorten. `buildRemovalOrder` surrenders support work
  // before secondary and secondary before primary (Principle 1), and never
  // offers the primary module's last exercise, so the loop cannot empty the
  // session. It also never ADDS when time remains: the Minimum Effective
  // Session Principle forbids it.
  //
  // Bounded by the number of removable exercises, so it always terminates.
  const removalOrder = buildRemovalOrder(workingComposition);
  for (const removal of removalOrder) {
    const estimate = estimateFor(workingPrescription);
    if (estimate === null || estimate.totalMinutes === null) {
      break;
    }
    if (estimate.totalMinutes <= input.request.durationMinutes) {
      break;
    }
    if (isLastPrimaryExercise(workingComposition, removal.exerciseId)) {
      break;
    }

    const reduced = withoutExercises(workingComposition, new Set([removal.exerciseId]));
    const reducedSession = generateInitialSession(input, selectedModules, [...reduced.selections]);
    if (reducedSession.outcome === "blocked") {
      break;
    }

    workingComposition = reduced;
    workingSessionResult = reducedSession;
    workingPrescription = prescribeEngineSession(
      reducedSession.draft,
      resolvedPrescriptionSources,
      prescriptionTraceContext,
    );
    removedForTimeBudget.push({ exerciseId: removal.exerciseId, module: removal.module });
  }

  const durationEstimate = estimateFor(workingPrescription);

  const sessionDraft: InitialSessionDraft =
    durationEstimate === null || durationEstimate.totalMinutes === null
      ? workingSessionResult.draft
      : { ...workingSessionResult.draft, estimatedDurationMinutes: durationEstimate.totalMinutes };

  // Conflicts are re-detected against the draft that now carries a duration.
  // This is what finally makes `duration_session` reachable: before the
  // estimate existed, `estimatedDurationMinutes` was always undefined and
  // `detectDurationConflict` returned early every time.
  const detectedConflicts =
    sessionDraft === finalSessionResult.draft ? conflicts : detectSessionConflicts(sessionDraft, input);

  // `detectSessionConflicts` sees only the final draft, so a module emptied
  // by the time-budget policy looks to it exactly like a module that never
  // had a candidate. Both are genuinely unsatisfied — the module was
  // explicitly requested and the session does not represent it, which is
  // what the conflict is for — but the CAUSE differs, and reporting "no
  // exercise is selected" for work that was chosen, prescribed and then
  // deliberately given up would hide the removal. The description is
  // restated here, where the removal is known; no code, severity or
  // resolution flag changes.
  const finalConflicts = describeTimeBudgetRemovals(detectedConflicts, removedForTimeBudget, input);

  const timeBudgetTraceEntries = buildTimeBudgetTraceEntries(input, removedForTimeBudget);

  // Conflicts detected after the reduction must reach `warnings` too:
  // `buildDecisionTrace` computed its warnings from the pre-reduction
  // conflicts, so without this the public `conflicts` and `warnings` arrays
  // would disagree about the same session.
  const postReductionWarnings = finalConflicts
    .filter(
      (conflict) =>
        conflict.severity === "minor" && !conflicts.some((earlier) => earlier.id === conflict.id),
    )
    .map((conflict) => conflict.description);

  const durationTraceEntries = buildDurationTraceEntries(input, durationEstimate);

  // The three lists are extended, never rebuilt: `buildDecisionTrace` runs
  // before prescription and cannot know about an omitted exercise, a
  // duration or a duration conflict. Each later stage contributes its own
  // entries and warnings, and owns their wording.
  const decisionTraceWithPrescription = {
    ...decisionTrace,
    entries: [
      ...decisionTrace.entries,
      ...workingPrescription.traceEntries,
      ...timeBudgetTraceEntries,
      ...durationTraceEntries,
      ...buildDurationConflictTraceEntries(input, conflicts, finalConflicts),
    ],
    warnings: [...decisionTrace.warnings, ...workingPrescription.warnings, ...postReductionWarnings],
  };

  return {
    outcome: "draft",
    validation,
    selectedModules,
    eligibilityResults,
    scoredExercises,
    sessionDraft,
    conflicts: finalConflicts,
    conflictResolutions: substitutionPass.conflictResolutions,
    decisionTrace: decisionTraceWithPrescription,
    prescription: workingPrescription.outcome,
  };
}

// -----------------------------------------------------------------------------
// Time-budget reduction helpers
// -----------------------------------------------------------------------------

/** The session duration implied by a prescription outcome, or `null` when it was not prescribed. */
function estimateFor(result: EngineSessionPrescriptionResult): SessionDurationEstimate | null {
  return result.outcome.status === "prescribed"
    ? estimateSessionDuration(
        result.outcome.session.exercises.map((prescribedExercise) => prescribedExercise.prescription),
      )
    : null;
}

/**
 * Whether removing `exerciseId` would leave a `"primary"` module empty.
 *
 * The primary module carries the session's objective, and
 * `generateInitialSession` blocks a draft whose primary module holds
 * nothing. Refusing the removal here means an over-budget session is
 * reported as an unresolved `duration_session` conflict rather than
 * destroyed to fit the clock.
 */
function isLastPrimaryExercise(composition: SessionComposition, exerciseId: Identifier): boolean {
  return composition.decisions.some(
    (decision) =>
      decision.role === "primary" &&
      decision.keptExerciseIds.length === 1 &&
      decision.keptExerciseIds[0] === exerciseId,
  );
}

/**
 * Restates the description of every `missing_exercise_*` conflict whose
 * module was emptied by the time-budget reduction.
 *
 * Only `description` changes. The conflict's id, type, severity and
 * `resolutionRequired` are untouched: an explicitly requested module the
 * session cannot represent is still an unsatisfied module, whatever emptied
 * it.
 */
function describeTimeBudgetRemovals(
  detectedConflicts: readonly DetectedConflict[],
  removed: readonly { exerciseId: Identifier; module: CapabilityModule }[],
  input: EngineInput,
): DetectedConflict[] {
  if (removed.length === 0) {
    return [...detectedConflicts];
  }

  const removedByModule = new Map<CapabilityModule, Identifier[]>();
  for (const entry of removed) {
    removedByModule.set(entry.module, [...(removedByModule.get(entry.module) ?? []), entry.exerciseId]);
  }

  return detectedConflicts.map((conflict) => {
    const module = conflict.affectedModules?.[0];
    if (conflict.type !== "missing_data" || module === undefined) {
      return conflict;
    }
    const removedHere = removedByModule.get(module);
    if (removedHere === undefined || removedHere.length === 0) {
      return conflict;
    }

    return {
      ...conflict,
      description: `The "${module}" module is not represented in this session: ${removedHere
        .map((exerciseId) => `"${exerciseId}"`)
        .join(", ")} was selected and prescribed, then given up so the session fits the requested ${input.request.durationMinutes} minute(s).`,
    };
  });
}

/** One `"duration_validation"` entry per exercise given up to fit the budget. */
function buildTimeBudgetTraceEntries(
  input: EngineInput,
  removed: readonly { exerciseId: Identifier; module: CapabilityModule }[],
): DecisionTraceEntry[] {
  return removed.map(({ exerciseId }) => ({
    id: `trace_${input.request.requestId}_time_budget_removed_${exerciseId}`,
    timestamp: input.request.requestedAt,
    stage: "duration_validation" as const,
    decision: `Exercise "${exerciseId}" was removed so the session fits the requested ${input.request.durationMinutes} minute(s).`,
    reasons: [
      "The estimated duration exceeded the requested time budget.",
      "Support work is given up before secondary work, and secondary before primary; a primary module is never emptied.",
      "Doses are never shortened to fit the clock — a shorter valid session is preferred to a longer degraded one.",
    ],
    affectedExerciseIds: [exerciseId],
  }));
}

// -----------------------------------------------------------------------------
// Duration trace
// -----------------------------------------------------------------------------

/**
 * One `"duration_validation"` entry recording how the session's duration was
 * estimated — or that it could not be. Emitted whenever prescription
 * produced a session, so an unknown duration is stated rather than left as a
 * silently missing field.
 */
function buildDurationTraceEntries(
  input: EngineInput,
  estimate: SessionDurationEstimate | null,
): DecisionTraceEntry[] {
  if (estimate === null) {
    return [];
  }

  const decision =
    estimate.totalMinutes === null
      ? "Session duration could not be estimated."
      : `Session duration estimated at ${estimate.totalMinutes} minute(s) against ${input.request.durationMinutes} requested.`;

  return [
    {
      id: `trace_${input.request.requestId}_duration_estimation`,
      timestamp: input.request.requestedAt,
      stage: "duration_validation",
      decision,
      reasons: [...estimate.reasons],
      inputReferences: ["request.durationMinutes"],
      sourceRuleIds: [...estimate.sourceRuleIds],
    },
  ];
}

/** One entry per duration conflict that only became detectable once the estimate existed. */
function buildDurationConflictTraceEntries(
  input: EngineInput,
  before: readonly DetectedConflict[],
  after: readonly DetectedConflict[],
): DecisionTraceEntry[] {
  const known = new Set(before.map((conflict) => conflict.id));

  return after
    .filter((conflict) => !known.has(conflict.id))
    .map((conflict) => ({
      id: `trace_${input.request.requestId}_conflict_${conflict.id}`,
      timestamp: input.request.requestedAt,
      stage: "conflict_detection" as const,
      decision: conflict.description,
      reasons: [
        `Conflict "${conflict.id}" of type "${conflict.type}", severity "${conflict.severity}".`,
        conflict.resolutionRequired ? "Resolution is required." : "Resolution is not required.",
      ],
      affectedModules: conflict.affectedModules === undefined ? undefined : [...conflict.affectedModules],
      affectedExerciseIds:
        conflict.affectedExerciseIds === undefined ? undefined : [...conflict.affectedExerciseIds],
    }));
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
