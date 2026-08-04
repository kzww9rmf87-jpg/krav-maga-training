/**
 * Combat Athlete System — Decision Trace Reconstruction
 * Version 0.1
 *
 * Seventh stage of the exercise pipeline implemented so far:
 *
 *   Eligibility → Scoring → Final selection → Initial session draft
 *   → Conflict detection → Substitution → Decision Trace (this file)
 *
 * `buildDecisionTrace` never takes a new decision. It reconstructs a
 * `DecisionTrace` purely from results already computed by every earlier
 * stage — it never recomputes eligibility, scoring, module selection or
 * conflicts, never mutates any parameter, and never fabricates a
 * `ConflictResolution`. This is a RECONSTRUCTION, not an event journal:
 * none of the already-implemented pipeline files were modified to emit
 * events, and none needed to be — every one of them already returns
 * deterministic, reason-carrying data.
 *
 * Only the `DecisionStage` values with a real, already-implemented
 * producer get an entry: `input_validation`, `module_selection`,
 * `eligibility_filtering`, `exercise_scoring` (also covers final
 * selection — no dedicated `DecisionStage` exists for it),
 * `session_assembly`, `conflict_detection`, `conflict_resolution`.
 *
 * Explicitly deferred (not traced here, because no stage produces the
 * underlying data yet):
 * - separate athlete-state evaluation, constraint extraction, objective
 *   interpretation and adaptation prioritization (`input.request` is used
 *   as-is, with no distinct interpretation step in V0.1);
 * - raw exercise-candidate retrieval;
 * - near-miss candidates scored below the 60-point selection threshold;
 * - substitution searches that returned `"unavailable"` (no signal
 *   persists them beyond the pure-function call itself);
 * - substitution before/after comparison in the absence of an explicit
 *   `ConflictResolution` (never inferred from candidate text or
 *   selection-reason strings);
 * - backtracking;
 * - autonomous duration validation, fatigue validation or final
 *   validation (none exist as independent stages yet — duration is only
 *   ever a `DetectedConflict`);
 * - the full User-Level / Coach-Level / Technical-Level trace model and
 *   cryptographic provenance/integrity records described in
 *   `21_DECISION_TRACE.md` (that document's canonical `DecisionTrace`
 *   shape does not match the one actually implemented in `types.ts`).
 */

import type {
  CapabilityModule,
  ConflictResolution,
  DecisionTrace,
  DecisionTraceEntry,
  DetectedConflict,
  EngineInput,
  ExerciseEligibilityResult,
  ExerciseSelectionResult,
  InitialSessionGenerationResult,
  ScoredExercise,
  SelectedModule,
  ValidationResult,
} from "./types";

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Reconstructs a `DecisionTrace` from the results already produced by
 * every earlier pipeline stage. Entries are assembled in a fixed,
 * deterministic order (validation, one per selected module, an aggregate
 * eligibility entry, one per exercise selection, session assembly, one
 * per detected conflict, one per supplied conflict resolution). Every
 * `id` is derived from `input.request.requestId` and a stable key (module,
 * exercise or conflict identifier) — never a counter, UUID or random
 * value. Every `timestamp` is `input.request.requestedAt` — never the
 * system clock. `conflictResolutions` defaults to an empty array when
 * omitted; nothing is fabricated when no resolution was supplied.
 */
export function buildDecisionTrace(
  input: EngineInput,
  validation: ValidationResult,
  selectedModules: SelectedModule[],
  eligibilityResults: ExerciseEligibilityResult[],
  scoredExercises: ScoredExercise[],
  exerciseSelections: ExerciseSelectionResult[],
  sessionResult: InitialSessionGenerationResult,
  conflicts: DetectedConflict[],
  conflictResolutions?: ConflictResolution[],
): DecisionTrace {
  const resolutions = conflictResolutions ?? [];

  assertNoDuplicateModuleSelections(selectedModules);
  assertBlockedSessionHasNoConflictData(sessionResult, conflicts, resolutions);

  const entries: DecisionTraceEntry[] = [
    buildValidationEntry(input, validation),
    ...buildModuleSelectionEntries(input, selectedModules),
    buildEligibilityEntry(input, eligibilityResults),
    ...buildScoringEntries(input, exerciseSelections, scoredExercises),
    buildSessionAssemblyEntry(input, sessionResult),
    ...buildConflictEntries(input, conflicts),
    ...buildResolutionEntries(input, resolutions),
  ];

  return {
    traceId: `trace_${input.request.requestId}`,
    engineVersion: "0.1",
    entries,
    rejectedExercises: buildRejectedExercises(eligibilityResults),
    detectedConflicts: conflicts,
    conflictResolutions: resolutions,
    warnings: buildWarnings(validation, conflicts),
  };
}

/**
 * Reconstructs a `DecisionTrace` for the one case `buildDecisionTrace`
 * cannot honestly represent: input validation failed, so nothing else in
 * the pipeline ever ran — `validation.ts` itself documents that
 * validation must happen before objective interpretation, module
 * selection, exercise eligibility, exercise scoring and session assembly.
 * The only entry is `input_validation`; no module selection, eligibility,
 * scoring, session assembly, conflict or resolution entry is fabricated,
 * and no `InitialSessionGenerationResult` is invented to satisfy a
 * signature that does not apply here.
 */
export function buildInvalidInputDecisionTrace(input: EngineInput, validation: ValidationResult): DecisionTrace {
  return {
    traceId: `trace_${input.request.requestId}`,
    engineVersion: "0.1",
    entries: [buildValidationEntry(input, validation)],
    rejectedExercises: [],
    detectedConflicts: [],
    conflictResolutions: [],
    warnings: buildWarnings(validation, []),
  };
}

// -----------------------------------------------------------------------------
// Defensive invariants (pipeline-call errors, never silently tolerated)
// -----------------------------------------------------------------------------

function assertNoDuplicateModuleSelections(selectedModules: readonly SelectedModule[]): void {
  const seenModules = new Set<CapabilityModule>();
  for (const selectedModule of selectedModules) {
    if (seenModules.has(selectedModule.module)) {
      throw new Error(`Decision trace cannot contain duplicate module selection "${selectedModule.module}".`);
    }
    seenModules.add(selectedModule.module);
  }
}

function assertBlockedSessionHasNoConflictData(
  sessionResult: InitialSessionGenerationResult,
  conflicts: readonly DetectedConflict[],
  resolutions: readonly ConflictResolution[],
): void {
  if (sessionResult.outcome !== "blocked") {
    return;
  }
  if (conflicts.length > 0) {
    throw new Error(
      "Decision trace cannot include detected conflicts when session generation was blocked before a draft was produced.",
    );
  }
  if (resolutions.length > 0) {
    throw new Error(
      "Decision trace cannot include conflict resolutions when session generation was blocked before a draft was produced.",
    );
  }
}

// -----------------------------------------------------------------------------
// 1. Input validation
// -----------------------------------------------------------------------------

const VALIDATION_INPUT_REFERENCES: readonly string[] = [
  "athleteProfile",
  "medicalState",
  "readiness",
  "trainingHistory",
  "environment",
  "request",
];

function buildValidationEntry(input: EngineInput, validation: ValidationResult): DecisionTraceEntry {
  const reasons =
    validation.issues.length > 0
      ? validation.issues.map((issue) => issue.message)
      : ["No validation issues were detected."];

  return {
    id: `trace_${input.request.requestId}_input_validation`,
    timestamp: input.request.requestedAt,
    stage: "input_validation",
    decision: `Input validation completed: ${validation.valid ? "valid" : "invalid"}.`,
    reasons,
    inputReferences: [...VALIDATION_INPUT_REFERENCES],
  };
}

// -----------------------------------------------------------------------------
// 2. Module selection
// -----------------------------------------------------------------------------

const MODULE_SELECTION_INPUT_REFERENCES: readonly string[] = [
  "request.primaryObjective",
  "request.secondaryObjectives",
  "request.requiredModules",
  "request.excludedModules",
];

function buildModuleSelectionEntries(
  input: EngineInput,
  selectedModules: readonly SelectedModule[],
): DecisionTraceEntry[] {
  return selectedModules.map((selectedModule) => ({
    id: `trace_${input.request.requestId}_module_selection_${selectedModule.module}`,
    timestamp: input.request.requestedAt,
    stage: "module_selection",
    decision: `Module "${selectedModule.module}" selected with role "${selectedModule.role}".`,
    reasons: [selectedModule.reason],
    inputReferences: [...MODULE_SELECTION_INPUT_REFERENCES],
    affectedModules: [selectedModule.module],
  }));
}

// -----------------------------------------------------------------------------
// 3. Eligibility filtering (aggregate entry + rejectedExercises)
// -----------------------------------------------------------------------------

const ELIGIBILITY_INPUT_REFERENCES: readonly string[] = [
  "medicalState",
  "athleteProfile.preferences",
  "environment",
  "request.excludedModules",
];

function buildEligibilityEntry(
  input: EngineInput,
  eligibilityResults: readonly ExerciseEligibilityResult[],
): DecisionTraceEntry {
  const rejected = eligibilityResults.filter((result) => !result.eligible);
  const totalCount = eligibilityResults.length;
  const eligibleCount = totalCount - rejected.length;

  return {
    id: `trace_${input.request.requestId}_eligibility_filtering`,
    timestamp: input.request.requestedAt,
    stage: "eligibility_filtering",
    decision: `${eligibleCount} of ${totalCount} candidate exercises were eligible; ${rejected.length} were rejected.`,
    reasons: [
      rejected.length === 0
        ? "All evaluated exercises passed hard eligibility constraints."
        : "Rejected exercises violated one or more hard eligibility constraints.",
    ],
    inputReferences: [...ELIGIBILITY_INPUT_REFERENCES],
    affectedExerciseIds: rejected.map((result) => result.exerciseId),
  };
}

function buildRejectedExercises(
  eligibilityResults: readonly ExerciseEligibilityResult[],
): DecisionTrace["rejectedExercises"] {
  return eligibilityResults
    .filter((result) => !result.eligible)
    .map((result) => ({
      exerciseId: result.exerciseId,
      reasons: result.rejectionReasons,
    }));
}

// -----------------------------------------------------------------------------
// 4. Exercise scoring (also covers final selection)
// -----------------------------------------------------------------------------

const SCORING_INPUT_REFERENCES: readonly string[] = [
  "athleteProfile.experience",
  "athleteProfile.preferences",
  "trainingHistory.recentSessions",
  "environment.availableEquipment",
  "readiness",
  "request.primaryObjective",
];

function buildScoringEntries(
  input: EngineInput,
  exerciseSelections: readonly ExerciseSelectionResult[],
  scoredExercises: readonly ScoredExercise[],
): DecisionTraceEntry[] {
  const scoredExerciseIds = new Set(scoredExercises.map((scored) => scored.exercise.id));

  return exerciseSelections.map((exerciseSelection) => {
    // A module may contribute several exercises since `sessionComposer.ts`;
    // the entry summarizes all of them rather than refusing to describe the
    // module.
    const selectedCandidates = exerciseSelection.candidates.filter((candidate) => candidate.selected);

    const baseEntry = {
      id: `trace_${input.request.requestId}_scoring_${exerciseSelection.module}`,
      timestamp: input.request.requestedAt,
      stage: "exercise_scoring" as const,
      inputReferences: [...SCORING_INPUT_REFERENCES],
      affectedModules: [exerciseSelection.module],
    };

    const [selectedCandidate] = selectedCandidates;
    if (selectedCandidate === undefined) {
      const reasons =
        exerciseSelection.candidates.length === 0
          ? ["No candidate reached the minimum conditional selection threshold."]
          : ["Candidate exercises were available, but none was marked as selected."];

      return {
        ...baseEntry,
        decision: `No exercise was selected for module "${exerciseSelection.module}".`,
        reasons,
      };
    }

    const selectedIds = selectedCandidates.map((candidate) => candidate.scoredExercise.exercise.id);
    for (const exerciseId of selectedIds) {
      if (!scoredExerciseIds.has(exerciseId)) {
        throw new Error(`Selected exercise "${exerciseId}" is missing from the scored exercise results.`);
      }
    }

    const backupCount = exerciseSelection.candidates.length - selectedCandidates.length;

    return {
      ...baseEntry,
      decision:
        selectedCandidates.length === 1
          ? `Exercise "${selectedIds[0]}" selected for module "${exerciseSelection.module}" with final score ${formatNumber(selectedCandidate.scoredExercise.finalScore)}.`
          : `${selectedCandidates.length} exercises selected for module "${exerciseSelection.module}": ${selectedIds.join(", ")}.`,
      reasons: [
        ...selectedCandidates.flatMap((candidate) => [
          `${candidate.scoredExercise.exercise.id} (final score ${formatNumber(candidate.scoredExercise.finalScore)}).`,
          ...candidate.selectionReasons,
        ]),
        `${backupCount} backup candidate(s) were retained for this module.`,
      ],
      confidence: selectedCandidate.scoredExercise.confidence,
      affectedExerciseIds: selectedIds,
    };
  });
}

// -----------------------------------------------------------------------------
// 5. Session assembly
// -----------------------------------------------------------------------------

const SESSION_ASSEMBLY_INPUT_REFERENCES: readonly string[] = [
  "request.requestId",
  "request.requestedAt",
  "request.primaryObjective",
  "request.secondaryObjectives",
];

function buildSessionAssemblyEntry(
  input: EngineInput,
  sessionResult: InitialSessionGenerationResult,
): DecisionTraceEntry {
  const id = `trace_${input.request.requestId}_session_assembly`;
  const timestamp = input.request.requestedAt;

  if (sessionResult.outcome === "blocked") {
    return {
      id,
      timestamp,
      stage: "session_assembly",
      decision: "Session generation blocked.",
      reasons: [sessionResult.reason],
      inputReferences: [...SESSION_ASSEMBLY_INPUT_REFERENCES],
      affectedModules: sessionResult.blockedModules,
    };
  }

  const { draft } = sessionResult;
  const durationReason =
    draft.estimatedDurationMinutes === undefined
      ? "Estimated duration is unknown because one or more selected exercises lack complete duration metadata."
      : `Estimated duration: ${formatNumber(draft.estimatedDurationMinutes)} minute(s).`;

  return {
    id,
    timestamp,
    stage: "session_assembly",
    decision: "Initial session draft generated.",
    reasons: [`Session title: "${draft.title}".`, `The draft contains ${draft.modules.length} module(s).`, durationReason],
    inputReferences: [...SESSION_ASSEMBLY_INPUT_REFERENCES],
    confidence: draft.confidence,
    affectedModules: draft.modules.map((generatedModule) => generatedModule.selectedModule.module),
  };
}

// -----------------------------------------------------------------------------
// 6. Conflict detection
// -----------------------------------------------------------------------------

const CONFLICT_INPUT_REFERENCES: readonly string[] = [
  "request.durationMinutes",
  "request.nextCombatSessionAt",
  "request.requestedAt",
];

function buildConflictEntries(input: EngineInput, conflicts: readonly DetectedConflict[]): DecisionTraceEntry[] {
  return conflicts.map((conflict) => ({
    id: `trace_${input.request.requestId}_conflict_${conflict.id}`,
    timestamp: input.request.requestedAt,
    stage: "conflict_detection",
    decision: conflict.description,
    reasons: [
      `Conflict type: ${conflict.type}.`,
      `Severity: ${conflict.severity}.`,
      `Probability: ${conflict.probability}.`,
      `Resolution required: ${conflict.resolutionRequired ? "yes" : "no"}.`,
    ],
    inputReferences: [...CONFLICT_INPUT_REFERENCES],
    affectedExerciseIds: conflict.affectedExerciseIds,
    affectedModules: conflict.affectedModules,
  }));
}

// -----------------------------------------------------------------------------
// 7. Conflict resolution
// -----------------------------------------------------------------------------

function buildResolutionEntries(input: EngineInput, resolutions: readonly ConflictResolution[]): DecisionTraceEntry[] {
  return resolutions.map((resolution) => ({
    id: `trace_${input.request.requestId}_resolution_${resolution.conflictId}`,
    timestamp: input.request.requestedAt,
    stage: "conflict_resolution",
    decision: resolution.description,
    reasons: [`Resolution action: ${resolution.action}.`],
    affectedExerciseIds: uniqueInOrder([...(resolution.removedExerciseIds ?? []), ...(resolution.addedExerciseIds ?? [])]),
  }));
}

// -----------------------------------------------------------------------------
// Warnings
// -----------------------------------------------------------------------------

function buildWarnings(validation: ValidationResult, conflicts: readonly DetectedConflict[]): string[] {
  return uniqueInOrder([
    ...validation.issues.filter((issue) => issue.severity === "warning").map((issue) => issue.message),
    ...conflicts.filter((conflict) => conflict.severity === "minor").map((conflict) => conflict.description),
  ]);
}

// -----------------------------------------------------------------------------
// Shared helpers
// -----------------------------------------------------------------------------

/** Preserves first-occurrence order while removing duplicates. */
function uniqueInOrder<T>(values: readonly T[]): T[] {
  const seen = new Set<T>();
  const result: T[] = [];
  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    result.push(value);
  }
  return result;
}

/** Rounds to at most two decimals and drops trailing zeros — a deterministic display format only. */
function formatNumber(value: number): string {
  return Number(value.toFixed(2)).toString();
}
