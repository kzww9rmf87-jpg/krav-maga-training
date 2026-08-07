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
import {
  buildRemovalOrder,
  composeSession,
  EXERCISES_PER_MODULE_ROLE,
  isRedundantWith,
  withoutExercises,
  type SessionComposition,
} from "./sessionComposer";
import { driverRolesFor } from "./adaptationDrivers";
import {
  assessCapability,
  observationFor,
  validateObservation,
  type CapabilityAssessment,
  type CapabilityObservation,
  type RejectedCapabilityObservation,
} from "./athleteCapability";
import {
  NUMERICAL_PRESCRIPTION_PROFILES,
  type NumericalPrescriptionProfile,
} from "./prescription/prescriptionKnowledge";
import {
  adjacentSharedRegions,
  FRESHNESS_TIERS,
  sequenceSession,
  type SequenceCandidate,
  type SequencedCandidate,
} from "./sessionSequencer";
import {
  evaluateSessionAdequacy,
  isDrivingRole,
  type AdequacyPrescribedExercise,
  type SessionAdequacyEvaluation,
} from "./sessionAdequacy";
import { generateInitialSession } from "./sessionGenerator";
import { detectSessionConflicts } from "./conflictResolver";
import { applySubstitution, findSubstituteCandidate } from "./substitutionEngine";
import { validateEngineInput } from "./validation";
import { buildDecisionTrace, buildInvalidInputDecisionTrace } from "./decisionTrace";
import type { ExercisePrescriptionSource } from "./prescription/buildPrescriptionInput";
import type { ExerciseRole } from "./prescription/types";
import { buildEngineSessionPrescriptionSources } from "./prescription/buildEngineSessionPrescriptionSources";
import { deriveAthleteReferences } from "./prescription/deriveAthleteReferences";
import { prescribeEngineSession, type EngineSessionPrescriptionResult } from "./prescription/prescribeEngineSession";
import { estimateSessionDuration, type SessionDurationEstimate } from "./prescription/estimatePrescriptionDuration";
import type { PrescriptionTraceContext } from "./prescription/prescriptionDecisionTrace";
import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  isPilotExerciseId,
} from "./prescription/exercisePrescriptionRegistry";
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
  // The objective the primary module serves decides which roles may drive it.
  // Composition receives a role LOOKUP, never the registry itself, so the
  // selection layer stays free of prescription coupling.
  const primaryModuleSelection = selectedModules.find((selectedModule) => selectedModule.role === "primary");
  // Feasibility is resolved for every candidate the primary module could keep,
  // using the SAME source builder the prescription layer uses — never a
  // reimplementation of it. When the caller supplied its own source map, that
  // map is the authority.
  const primaryCandidateIds =
    primaryModuleSelection === undefined
      ? []
      : (rankedSelections.find((selection) => selection.module === primaryModuleSelection.module)?.candidates ?? []).map(
          (candidate) => candidate.scoredExercise.exercise.id,
        );
  const feasibleDriverIds =
    prescriptionSources === undefined
      ? new Set(
          buildEngineSessionPrescriptionSources(primaryCandidateIds, {
            environment: input.environment,
            readiness: input.readiness,
            athleteReferences: deriveAthleteReferences(input).references,
          }).sources.keys(),
        )
      : new Set(prescriptionSources.keys());

  const compositionPolicy =
    primaryModuleSelection === undefined
      ? undefined
      : {
          primaryAdaptation: primaryModuleSelection.primaryAdaptation,
          roleOf: registryRoleOf,
          isPrescribable: (exerciseId: Identifier) => feasibleDriverIds.has(exerciseId),
        };

  const composition = composeSession(rankedSelections, selectedModules, compositionPolicy);
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

  // Adequacy repair runs AFTER the time-budget reduction and BEFORE the final
  // estimate: it is the last stage that may still change what the session
  // holds, and its own addition must be reflected in the duration that is
  // published. It only ever acts on a session whose primary module drives
  // nothing — never to fill remaining time.
  const repair = attemptAdequacyRepair(
    input,
    selectedModules,
    workingComposition,
    workingSessionResult,
    workingPrescription,
    resolvedPrescriptionSources,
    (repairedDraft) =>
      prescriptionSources ?? resolveEnginePrescriptionSources(input, repairedDraft),
    prescriptionTraceContext,
  );
  if (repair.addedExerciseIds.length > 0) {
    workingComposition = repair.composition;
    workingSessionResult = repair.sessionResult;
    workingPrescription = repair.prescription;
  }

  // Sequencing runs last among the stages that may touch the session, and
  // changes only position. It must follow the adequacy repair — repair can still
  // add a driver, and a driver that arrives after sequencing would be sequenced
  // nowhere.
  const sequencing = sequencePrescribedSession(input, workingPrescription, selectedModules, exercises);
  workingPrescription = sequencing.prescription;

  // Capability is assessed against the session CAS actually settled on, so the
  // exercises judged are the ones the athlete would perform.
  const capability = assessSessionCapability(input, workingPrescription, exercises);

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

  // The last question in the pipeline, and the only stage that can ask it:
  // eligibility, prescription feasibility and duration are all known here,
  // and nowhere earlier. See `sessionAdequacy.ts` for why a session can pass
  // every previous stage and still not be the session that was requested.
  const prescriptionWasAvailable = workingPrescription.outcome.status === "prescribed";
  const primaryModuleForAdequacy =
    selectedModules.find((selectedModule) => selectedModule.role === "primary")?.module ?? null;
  const adequacy = evaluateSessionAdequacy({
    requestedDurationMinutes: input.request.durationMinutes,
    estimatedDurationMinutes: durationEstimate?.totalMinutes ?? null,
    primaryModule: primaryModuleForAdequacy,
    primaryAdaptation: primaryModuleSelection?.primaryAdaptation ?? input.request.primaryObjective.adaptationDomain,
    prescriptionAvailable: prescriptionWasAvailable,
    prescribedExercises: adequacyExercisesOf(workingPrescription),
    unprescribedPrimaryExerciseIds:
      workingPrescription.outcome.status === "prescribed" || workingPrescription.outcome.status === "unavailable"
        ? (workingPrescription.outcome.unprescribedSelectedExercises ?? [])
            .filter((gap) => gap.moduleId === primaryModuleForAdequacy)
            .map((gap) => gap.exerciseId)
        : [],
    repairAttempted: repair.attempted,
    repairAddedExerciseIds: repair.addedExerciseIds,
  });

  // Conflicts and warnings are raised only for a session that WAS prescribed.
  //
  // When prescription came back `unavailable`, the prescription layer has
  // already said so in `missingSourceData`, in `unprescribedSelectedExercises`,
  // in its own warnings and in its own trace entries. Restating it as an
  // adequacy conflict would duplicate an existing signal rather than add one.
  // `sessionAdequacy.status` still reports `inadequate` for such a session —
  // the truth is published, once, in the field built to carry it.
  const adequacyConflicts = prescriptionWasAvailable ? buildAdequacyConflicts(adequacy) : [];
  const adequacyWarnings = prescriptionWasAvailable
    ? adequacy.findings.map((finding) => finding.description)
    : [];
  const adequacyTraceEntries = buildAdequacyTraceEntries(input, adequacy);

  // The three lists are extended, never rebuilt: `buildDecisionTrace` runs
  // before prescription and cannot know about an omitted exercise, a
  // duration or a duration conflict. Each later stage contributes its own
  // entries and warnings, and owns their wording.
  const decisionTraceWithPrescription = {
    ...decisionTrace,
    entries: [
      ...decisionTrace.entries,
      // Placed with the other `session_assembly` entries rather than appended:
      // securing a driver IS a composition decision, and the trace reads in
      // pipeline order.
      ...buildDriverSelectionTraceEntries(input, primaryModuleSelection, workingComposition, registryRoleOf),
      ...buildSequencingTraceEntries(input, sequencing.sequence),
      ...buildCapabilityTraceEntries(input, capability.assessments, capability.rejected),
      ...workingPrescription.traceEntries,
      ...timeBudgetTraceEntries,
      ...durationTraceEntries,
      ...buildDurationConflictTraceEntries(input, conflicts, finalConflicts),
      ...adequacyTraceEntries,
    ],
    warnings: [
      ...decisionTrace.warnings,
      ...workingPrescription.warnings,
      ...postReductionWarnings,
      // Every adequacy finding reaches `warnings`, whatever its severity: a
      // session that does not train what was asked must not be readable as
      // complete by a consumer that only looks at warnings.
      ...adequacyWarnings,
    ],
  };

  return {
    outcome: "draft",
    validation,
    selectedModules,
    eligibilityResults,
    scoredExercises,
    sessionDraft,
    conflicts: [...finalConflicts, ...adequacyConflicts],
    conflictResolutions: substitutionPass.conflictResolutions,
    sessionAdequacy: adequacy,
    decisionTrace: decisionTraceWithPrescription,
    prescription: workingPrescription.outcome,
    // The estimate is attached, never recomputed downstream. It is the same
    // object the draft's `estimatedDurationMinutes`, the duration trace
    // entry and the time-budget reduction above were all decided from, so a
    // consumer reading a per-exercise second and the session's minutes is
    // reading one arithmetic, not two that happen to agree today.
    //
    // The key is omitted rather than set to `undefined` when no estimate
    // exists, matching how `prescription` treats an absent value.
    ...(durationEstimate === null ? {} : { durationEstimate }),
  };
}

/**
 * Trace entries for the role-aware selection decision.
 *
 * Answers, without prose parsing: what did this objective require, which roles
 * could drive it, which candidate was secured and why, and which candidates
 * were deferred behind it.
 */
function buildDriverSelectionTraceEntries(
  input: EngineInput,
  primaryModule: SelectedModule | undefined,
  composition: SessionComposition,
  roleOf: (exerciseId: Identifier) => ExerciseRole | null,
): DecisionTraceEntry[] {
  if (primaryModule === undefined) {
    return [];
  }

  const decision = composition.decisions.find((entry) => entry.module === primaryModule.module);
  if (decision === undefined) {
    return [];
  }

  const adaptation = primaryModule.primaryAdaptation;
  const reserved = decision.reservedDriverExerciseId ?? null;
  const timestamp = input.request.requestedAt;

  const deferred = decision.keptExerciseIds
    .filter((exerciseId) => exerciseId !== reserved)
    .map((exerciseId) => `"${exerciseId}" (${roleOf(exerciseId) ?? "no registry role"})`);

  return [
    {
      id: `trace_${input.request.requestId}_driver_requirement`,
      timestamp,
      stage: "session_assembly",
      decision:
        reserved === null
          ? `No adaptation driver could be secured for the "${primaryModule.module}" module.`
          : `Exercise "${reserved}" secured as the adaptation driver for the "${primaryModule.module}" module.`,
      reasons: [
        `Driving "${adaptation}" requires one of: ${driverRolesFor(adaptation)
          .map((role) => `"${role}"`)
          .join(", ")}.`,
        reserved === null
          ? "No candidate on this module's ranked bench held a driving role AND could be prescribed with the athlete data available; nothing was substituted in its place."
          : `Role "${roleOf(reserved) ?? "unknown"}" drives "${adaptation}", and the exercise is prescribable with the athlete data available.`,
        deferred.length === 0
          ? "No further exercise was composed into this module."
          : `Composed behind the driver, in score order: ${deferred.join(", ")}.`,
      ],
      inputReferences: ["request.primaryObjective"],
      affectedModules: [primaryModule.module],
      ...(reserved === null ? {} : { affectedExerciseIds: [reserved] }),
    },
  ];
}

// -----------------------------------------------------------------------------
// Athlete capability
// -----------------------------------------------------------------------------

/**
 * Assesses every prescribed exercise against what the athlete can actually do.
 *
 * ADVISORY IN THIS LOT. The assessment reaches the Decision Trace and changes
 * nothing else: no exercise is swapped, no dose is altered, no progression is
 * chosen. Deciding that push-ups have become too easy and deciding what to do
 * about it are different decisions, and the second needs a progression graph
 * this repository does not yet represent. Lot H2.5B owns that.
 *
 * An athlete who supplied no observations gets `insufficient_evidence` for every
 * exercise and a session identical to the one they got before this lot existed.
 */
function assessSessionCapability(
  input: EngineInput,
  prescription: EngineSessionPrescriptionResult,
  exercises: readonly ExerciseDefinition[],
): { assessments: CapabilityAssessment[]; rejected: RejectedCapabilityObservation[] } {
  const observations = input.athleteProfile.capabilityObservations ?? [];
  const catalogued = new Set(exercises.map((exercise) => exercise.id));

  // Structurally unusable observations are REPORTED and then set aside. They
  // are never repaired, and never silently dropped.
  const rejected: RejectedCapabilityObservation[] = [];
  const usable: CapabilityObservation[] = [];
  for (const observation of observations) {
    const rejection = validateObservation(observation, (exerciseId) => catalogued.has(exerciseId));
    if (rejection === null) {
      usable.push(observation);
    } else {
      rejected.push(rejection);
    }
  }

  if (prescription.outcome.status !== "prescribed") {
    return { assessments: [], rejected };
  }

  const assessments = prescription.outcome.session.exercises.map((prescribedExercise) => {
    const exerciseId = prescribedExercise.prescription.exerciseId;
    return assessCapability({
      exerciseId,
      // Exact binding only. An observation about another exercise is not
      // evidence about this one, however similar the two movements look.
      observation: observationFor(exerciseId, usable),
      profile: numericalProfileForExercise(exerciseId),
    });
  });

  return { assessments, rejected };
}

/** The numerical profile an exercise resolves, when it names one explicitly. */
function numericalProfileForExercise(exerciseId: Identifier): NumericalPrescriptionProfile | null {
  if (!isPilotExerciseId(exerciseId)) {
    return null;
  }
  const profileId = EXERCISE_PRESCRIPTION_REGISTRY[exerciseId].numericalProfileId;
  if (profileId === undefined || profileId === null) {
    return null;
  }
  return NUMERICAL_PRESCRIPTION_PROFILES.find((profile) => profile.profileId === profileId) ?? null;
}

/** Trace entries for the capability assessment. */
function buildCapabilityTraceEntries(
  input: EngineInput,
  assessments: readonly CapabilityAssessment[],
  rejected: readonly RejectedCapabilityObservation[],
): DecisionTraceEntry[] {
  if (assessments.length === 0 && rejected.length === 0) {
    return [];
  }

  const timestamp = input.request.requestedAt;
  const entries: DecisionTraceEntry[] = assessments.map((assessment) => ({
    id: `trace_${input.request.requestId}_capability_${assessment.exerciseId}`,
    timestamp,
    stage: "athlete_state_evaluation",
    decision: `Capability for "${assessment.exerciseId}": ${assessment.state}.`,
    reasons: [
      assessment.description,
      assessment.observation === null
        ? "No observation was supplied for this exercise."
        : `Observation: ${assessment.observation.repetitions} repetition(s), type "${assessment.observation.observationType}", provenance "${assessment.observation.provenance}", observed at ${assessment.observation.observedAt ?? "an unrecorded time"}.`,
      assessment.prescriptionWindow !== null
        ? `Compared with ${assessment.prescriptionWindow.minimum}-${assessment.prescriptionWindow.maximum} repetitions, derived from ${assessment.prescriptionWindow.profileId}.`
        : assessment.observation === null
          ? "Nothing was compared: the comparison needs an observation."
          : "This exercise is not prescribed as a repetition range, so a repetition count cannot be compared with it.",
      // The boundary this lot refuses to cross, stated on every assessment.
      "Assessment only: no progression was chosen and no dose was changed.",
    ],
    inputReferences: ["athleteProfile.capabilityObservations"],
    affectedExerciseIds: [assessment.exerciseId],
    sourceRuleIds: [...assessment.sourceRuleIds],
  }));

  for (const rejection of rejected) {
    entries.push({
      id: `trace_${input.request.requestId}_capability_rejected_${rejection.exerciseId}`,
      timestamp,
      stage: "athlete_state_evaluation",
      decision: `Capability observation for "${rejection.exerciseId}" was not usable (${rejection.code}).`,
      reasons: [rejection.reason, "The observation was reported rather than repaired or discarded."],
      inputReferences: ["athleteProfile.capabilityObservations"],
    });
  }

  return entries;
}

// -----------------------------------------------------------------------------
// Session sequencing
// -----------------------------------------------------------------------------

/**
 * Reorders the prescribed exercises, and renumbers `order` to match.
 *
 * Sequencing changes NOTHING but position: the same exercises, the same doses,
 * the same count. `estimateSessionDuration` counts exercises and transitions
 * rather than reading their order, so the published duration is unaffected —
 * which is why this runs before the estimate rather than after, and why the
 * estimate is not recomputed differently because of it.
 */
function sequencePrescribedSession(
  input: EngineInput,
  prescription: EngineSessionPrescriptionResult,
  selectedModules: readonly SelectedModule[],
  exercises: readonly ExerciseDefinition[],
): { prescription: EngineSessionPrescriptionResult; sequence: SequencedCandidate[] } {
  if (prescription.outcome.status !== "prescribed") {
    return { prescription, sequence: [] };
  }

  const catalogue = new Map(exercises.map((exercise) => [exercise.id, exercise] as const));
  const moduleRoleByModule = new Map(
    selectedModules.map((selectedModule) => [selectedModule.module, selectedModule.role] as const),
  );

  const prescribed = prescription.outcome.session.exercises;
  const candidates: SequenceCandidate[] = [];
  for (const prescribedExercise of prescribed) {
    const exercise = catalogue.get(prescribedExercise.prescription.exerciseId);
    if (exercise === undefined) {
      // An exercise the caller's catalogue does not describe cannot be
      // classified. Rather than guess a position, sequencing declines entirely
      // and the session keeps the order it already had.
      return { prescription, sequence: [] };
    }
    candidates.push({
      exerciseId: exercise.id,
      exercise,
      role: registryRoleOf(exercise.id),
      moduleRole: moduleRoleByModule.get(prescribedExercise.prescription.moduleId) ?? "support",
    });
  }

  const sequence = sequenceSession(candidates, {
    requestedAdaptation: input.request.primaryObjective.adaptationDomain,
  });

  const byExerciseId = new Map(
    prescribed.map((prescribedExercise) => [prescribedExercise.prescription.exerciseId, prescribedExercise] as const),
  );
  const reordered = sequence.map((candidate, index) => {
    const original = byExerciseId.get(candidate.exerciseId);
    if (original === undefined) {
      throw new Error(`Sequencing lost exercise "${candidate.exerciseId}" from the prescribed session.`);
    }
    return { ...original, order: index + 1 };
  });

  return {
    prescription: {
      ...prescription,
      outcome: {
        ...prescription.outcome,
        session: { ...prescription.outcome.session, exercises: reordered },
      },
    },
    sequence,
  };
}

/** One `session_assembly` entry per sequenced exercise, plus the shared rules. */
function buildSequencingTraceEntries(
  input: EngineInput,
  sequence: readonly SequencedCandidate[],
): DecisionTraceEntry[] {
  if (sequence.length === 0) {
    return [];
  }

  const timestamp = input.request.requestedAt;
  const adaptation = input.request.primaryObjective.adaptationDomain;
  const entries: DecisionTraceEntry[] = sequence.map((candidate, index) => ({
    id: `trace_${input.request.requestId}_sequencing_${candidate.exerciseId}`,
    timestamp,
    stage: "session_assembly",
    decision: `Exercise "${candidate.exerciseId}" sequenced at position ${index + 1} of ${sequence.length}.`,
    reasons: [
      `Sequence class "${candidate.sequenceClass}" for a "${adaptation}" objective.`,
      candidate.freshnessDemand === FRESHNESS_TIERS.ballistic
        ? "Ballistic work: velocity is the stimulus, and velocity is the first thing fatigue takes."
        : candidate.freshnessDemand === FRESHNESS_TIERS.technical
          ? "Technically demanding: coordination degrades before force does."
          : candidate.freshnessDemand === FRESHNESS_TIERS.neural
            ? "Neurally expensive: expressible load falls with central fatigue."
            : "No documented freshness requirement; the stimulus survives being performed late.",
      `Freshness demand ${candidate.freshnessDemand}, documented systemic load ${candidate.systemicLoad}.`,
    ],
    inputReferences: ["request.primaryObjective"],
    affectedExerciseIds: [candidate.exerciseId],
  }));

  const sharedRegions = adjacentSharedRegions(sequence);
  entries.push({
    id: `trace_${input.request.requestId}_sequencing_summary`,
    timestamp,
    stage: "session_assembly",
    decision: `Session sequenced: ${sequence.map((candidate) => `"${candidate.exerciseId}"`).join(" then ")}.`,
    reasons: [
      "Ordered by sequence class, then by freshness demand, then by documented systemic load, then by canonical id.",
      "Selection score decides WHICH exercises are in the session; it does not decide their order.",
      sharedRegions.length === 0
        ? "No two consecutive exercises load a common body region."
        : `Consecutive exercises sharing a loaded region: ${sharedRegions
            .map((finding) => `"${finding.first}" then "${finding.second}" (${finding.regions.join(", ")})`)
            .join("; ")}. Reported rather than reordered: separating them would override the freshness ordering, and no document states which should win.`,
    ],
    inputReferences: ["request.primaryObjective"],
  });

  return entries;
}

// -----------------------------------------------------------------------------
// Adequacy repair
// -----------------------------------------------------------------------------

/**
 * The registry role of an exercise, or `null` when it is not in the pilot
 * registry.
 *
 * Read from the SAME source the prescription layer resolves its role from,
 * so a repair candidate is judged by exactly the classification the finished
 * session will carry. Nothing here infers a role from a display name or an
 * adaptation label — that inference is precisely what let a neck isometric
 * stand in for a maximum-strength session.
 */
function registryRoleOf(exerciseId: Identifier): ExerciseRole | null {
  return isPilotExerciseId(exerciseId) ? EXERCISE_PRESCRIPTION_REGISTRY[exerciseId].role : null;
}

/** Every prescribed exercise reduced to what the adequacy rules need. */
function adequacyExercisesOf(prescription: EngineSessionPrescriptionResult): AdequacyPrescribedExercise[] {
  if (prescription.outcome.status !== "prescribed") {
    return [];
  }
  return prescription.outcome.session.exercises.map((prescribedExercise) => ({
    exerciseId: prescribedExercise.prescription.exerciseId,
    moduleId: prescribedExercise.prescription.moduleId,
    role: prescribedExercise.prescription.role,
  }));
}

/**
 * Selects `exerciseId`, dropping `replacedExerciseId` when one is given.
 *
 * A module may not grow past `EXERCISES_PER_MODULE_ROLE`: that cap is the
 * composer's own engineering decision, and repair is not entitled to overrule
 * it. When the module is already full, repair SWAPS — the lowest-ranked
 * support exercise makes room for the driver — rather than sprawling.
 */
function withExercise(
  composition: SessionComposition,
  exerciseId: Identifier,
  replacedExerciseId: Identifier | null,
): SessionComposition {
  return {
    decisions: composition.decisions,
    selections: composition.selections.map((selection) => ({
      module: selection.module,
      role: selection.role,
      candidates: selection.candidates.map((candidate) => {
        const candidateId = candidate.scoredExercise.exercise.id;
        if (!candidate.selected && candidateId === exerciseId) {
          return {
            ...candidate,
            selected: true,
            selectionReasons: [
              ...candidate.selectionReasons,
              "Added by adequacy repair: the highest-ranked prescribable candidate able to drive the requested adaptation.",
            ],
          };
        }
        if (candidate.selected && replacedExerciseId !== null && candidateId === replacedExerciseId) {
          return {
            ...candidate,
            selected: false,
            selectionReasons: [
              ...candidate.selectionReasons,
              "Given up by adequacy repair: the module was full and held no exercise driving the requested adaptation.",
            ],
          };
        }
        return candidate;
      }),
    })),
  };
}

/** The `"draft"` half of `generateInitialSession`'s union — repair never returns a blocked session. */
type DraftSessionResult = Extract<ReturnType<typeof generateInitialSession>, { outcome: "draft" }>;

interface AdequacyRepairOutcome {
  attempted: boolean;
  addedExerciseIds: Identifier[];
  composition: SessionComposition;
  sessionResult: DraftSessionResult;
  prescription: EngineSessionPrescriptionResult;
}

/**
 * Attempts, ONCE and deterministically, to give a session that trains nothing
 * of what was asked an exercise that does.
 *
 * WHAT THIS IS ALLOWED TO DO: promote the highest-ranked candidate the
 * primary module ALREADY produced — already eligible, already scored, already
 * ranked — that holds a driving role and can be prescribed. Nothing else. The
 * candidate pool is not widened, no exercise is invented, no dose is altered,
 * and no missing athlete reference is worked around: a candidate that cannot
 * be prescribed is skipped, never forced.
 *
 * WHAT THIS MUST NEVER DO: add work because time remains. The Minimum
 * Effective Session Principle forbids it, and this function is not an
 * exception to it — repair runs ONLY when the primary module holds no driving
 * exercise at all, never to fill a duration gap. A session that trains the
 * right thing in 12 of 30 minutes is left exactly as it is.
 *
 * Returns the original inputs untouched when no repair is needed or none
 * succeeds.
 */
function attemptAdequacyRepair(
  input: EngineInput,
  selectedModules: readonly SelectedModule[],
  composition: SessionComposition,
  sessionResult: DraftSessionResult,
  prescription: EngineSessionPrescriptionResult,
  prescriptionSources: ReadonlyMap<Identifier, ExercisePrescriptionSource>,
  /**
   * Sources for a repaired draft.
   *
   * The map above was resolved from the exercises that were ALREADY selected,
   * so a promoted candidate is necessarily absent from it and would fail
   * prescription for want of a source rather than for want of an athlete
   * reference — repair would then never succeed, and would silently look as
   * though no driver existed. When the caller supplied its own source map,
   * this resolver returns it unchanged: deciding what a caller-controlled run
   * may prescribe is not this function's call.
   */
  resolveSourcesFor: (draft: InitialSessionDraft) => ReadonlyMap<Identifier, ExercisePrescriptionSource>,
  traceContext: PrescriptionTraceContext,
): AdequacyRepairOutcome {
  const unrepaired: AdequacyRepairOutcome = {
    attempted: false,
    addedExerciseIds: [],
    composition,
    sessionResult,
    prescription,
  };

  const primaryModule = selectedModules.find((selectedModule) => selectedModule.role === "primary");
  if (primaryModule === undefined || prescription.outcome.status !== "prescribed") {
    return unrepaired;
  }

  const prescribed = adequacyExercisesOf(prescription);
  const primaryPrescribed = prescribed.filter((exercise) => exercise.moduleId === primaryModule.module);
  // Nothing to repair: either the module is empty (already blocked upstream)
  // or something in it already drives the adaptation.
  if (primaryPrescribed.length === 0 || primaryPrescribed.some((exercise) => isDrivingRole(primaryModule.primaryAdaptation, exercise.role))) {
    return unrepaired;
  }

  const primarySelection = composition.selections.find((selection) => selection.module === primaryModule.module);
  if (primarySelection === undefined) {
    return unrepaired;
  }

  const keptExercises = primarySelection.candidates
    .filter((candidate) => candidate.selected)
    .map((candidate) => candidate.scoredExercise.exercise);

  // A module may not grow past `EXERCISES_PER_MODULE_ROLE`. That cap is the
  // composer's engineering decision and repair is not entitled to overrule it.
  //
  // WHY REPAIR STOPS HERE RATHER THAN SWAPPING. Dropping a composed exercise to
  // make room was tried and rejected: it silently reshaped sessions across the
  // engine, discarding work the composer had deliberately ranked and kept. A
  // module that is FULL of support work is a ranking outcome, and correcting a
  // ranking is not this stage's business. CAS reports the inadequacy instead —
  // which is what this lot is for.
  if (keptExercises.length >= EXERCISES_PER_MODULE_ROLE[primaryModule.role]) {
    return { ...unrepaired, attempted: true };
  }

  // Rank order is the selector's, not this function's: the first candidate
  // that can carry the adaptation and can be prescribed wins, and the search
  // stops there.
  for (const candidate of primarySelection.candidates) {
    if (candidate.selected) {
      continue;
    }
    const exerciseId = candidate.scoredExercise.exercise.id;
    const role = registryRoleOf(exerciseId);
    if (!isDrivingRole(primaryModule.primaryAdaptation, role)) {
      continue;
    }
    // Repair obeys the composer's own redundancy rule (Rule 32): promoting a
    // near-duplicate of work the session already holds would be adding an
    // exercise for its own sake, which is what this whole area forbids.
    if (keptExercises.some((kept) => isRedundantWith(candidate.scoredExercise.exercise, kept))) {
      continue;
    }

    const repairedComposition = withExercise(composition, exerciseId, null);
    const repairedSession = generateInitialSession(input, [...selectedModules], [...repairedComposition.selections]);
    if (repairedSession.outcome === "blocked") {
      continue;
    }

    const repairedPrescription = prescribeEngineSession(
      repairedSession.draft,
      resolveSourcesFor(repairedSession.draft),
      traceContext,
    );
    if (repairedPrescription.outcome.status !== "prescribed") {
      // The candidate could not be dosed safely — most often a missing
      // athlete reference. Skipped, never fabricated around.
      continue;
    }
    const nowDriving = adequacyExercisesOf(repairedPrescription).some(
      (exercise) =>
        exercise.moduleId === primaryModule.module &&
        isDrivingRole(primaryModule.primaryAdaptation, exercise.role),
    );
    if (!nowDriving) {
      continue;
    }

    // The repaired session must still fit the time the athlete has. The
    // time-budget reduction has already run at this point, so a repair that
    // overshoots would undo a decision taken one stage earlier — and "a
    // shorter valid session is superior to a longer incoherent session"
    // applies to repaired sessions exactly as it applies to composed ones.
    const repairedEstimate = estimateFor(repairedPrescription);
    if (
      repairedEstimate !== null &&
      repairedEstimate.totalMinutes !== null &&
      repairedEstimate.totalMinutes > input.request.durationMinutes
    ) {
      continue;
    }

    return {
      attempted: true,
      addedExerciseIds: [exerciseId],
      composition: repairedComposition,
      sessionResult: repairedSession,
      prescription: repairedPrescription,
    };
  }

  return { ...unrepaired, attempted: true };
}

/**
 * The conflicts an adequacy evaluation raises.
 *
 * An uncovered primary objective is `major` and requires resolution: the
 * session does not train what was asked. A duration finding on a session that
 * DOES train the right thing is `minor` — it reaches `warnings` and is
 * reported, but it does not claim the session is wrong.
 */
function buildAdequacyConflicts(evaluation: SessionAdequacyEvaluation): DetectedConflict[] {
  return evaluation.findings.map((finding) => {
    const isCoverageFinding =
      finding.reasonCode === "PRIMARY_ADAPTATION_NOT_DRIVEN" ||
      finding.reasonCode === "PRIMARY_CANDIDATES_UNPRESCRIBABLE";
    return {
      id: finding.ruleId,
      type: isCoverageFinding ? ("missing_data" as const) : ("duration" as const),
      severity: isCoverageFinding ? ("major" as const) : ("minor" as const),
      probability: "high" as const,
      description: finding.description,
      resolutionRequired: isCoverageFinding,
    };
  });
}

/** One `final_validation` trace entry per adequacy rule, plus the verdict. */
function buildAdequacyTraceEntries(
  input: EngineInput,
  evaluation: SessionAdequacyEvaluation,
): DecisionTraceEntry[] {
  const timestamp = input.request.requestedAt;
  const entries: DecisionTraceEntry[] = evaluation.findings.map((finding) => ({
    id: `trace_${input.request.requestId}_${finding.ruleId}`,
    timestamp,
    stage: "final_validation",
    decision: `Session adequacy rule "${finding.ruleId}" failed (${finding.reasonCode}).`,
    reasons: [finding.description, ...finding.sourceRuleIds.map((sourceRuleId) => `Source: ${sourceRuleId}.`)],
    inputReferences: ["request.durationMinutes", "request.primaryObjective"],
  }));

  const repairReason = !evaluation.repairAttempted
    ? "No repair was required: the primary module already holds an exercise that drives the requested adaptation."
    : evaluation.repairAddedExerciseIds.length > 0
      ? `Repair added ${evaluation.repairAddedExerciseIds.map((id) => `"${id}"`).join(", ")}: the highest-ranked prescribable candidate able to drive the requested adaptation.`
      : "Repair was attempted and found no prescribable candidate able to drive the requested adaptation; no unrelated work was added in its place.";

  entries.push({
    id: `trace_${input.request.requestId}_session_adequacy`,
    timestamp,
    stage: "final_validation",
    decision: `Session adequacy: ${evaluation.status}.`,
    reasons: [
      `Primary adaptation ${evaluation.primaryAdaptationCovered ? "is" : "is NOT"} driven by the prescribed session.`,
      evaluation.estimatedDurationMinutes === null
        ? "The session duration could not be estimated."
        : `Estimated ${evaluation.estimatedDurationMinutes} minute(s) against ${evaluation.requestedDurationMinutes} requested.`,
      repairReason,
    ],
    inputReferences: ["request.durationMinutes", "request.primaryObjective"],
  });

  return entries;
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
