/**
 * Combat Athlete System — Session Conflict Detection
 * Version 0.1
 *
 * Fifth stage of the exercise pipeline implemented so far:
 *
 *   Eligibility → Scoring → Final selection → Initial session draft
 *   → Conflict detection (this file)
 *
 * This is a DETECTION-ONLY module. It reads an already-generated
 * `InitialSessionDraft` and reports `DetectedConflict[]`. It never
 * modifies the draft, never resolves a conflict, never selects a backup
 * candidate, never substitutes an exercise, and never removes an exercise
 * or a module. `resolveSessionConflicts` does not exist yet.
 *
 * `17_CONFLICT_RULES.md` is the complete specification for conflict
 * detection, classification and resolution, including the full severity
 * scale, probability model, Conflict Score formula, Interaction Cost and
 * resolution methods (Rules 67-80). This file implements only a
 * deterministic V0.1 subset of that specification — the four categories
 * below. The severity/probability values used here are V0.1
 * IMPLEMENTATION CONVENTIONS: consistent with the general spirit of the
 * document's severity tiers (Rule 67) and probability model (Rule 68), but
 * not yet an exhaustive implementation of Rules 67-80 — no numeric
 * Conflict Score, Interaction Cost or resolution logic is computed here.
 * They are expected to be revisited as more of the specification is
 * implemented.
 *
 * Operational protection hierarchy retained for V0.1 (documentation only —
 * no automatic logic is derived from it in this file; it exists to guide
 * the future `resolveSessionConflicts`):
 *
 *   Hard Constraints
 *   → Safety
 *   → Recovery
 *   → Primary Adaptation
 *   → Secondary and Support Adaptations
 *   → Performance and Preferences
 *
 * Only four conflict categories are implemented in this V0.1, each
 * detectable without inventing a numeric threshold:
 * 1. known duration overshoot (`draft.estimatedDurationMinutes` vs
 *    `input.request.durationMinutes`, plain arithmetic comparison);
 * 2. a `"secondary"`/`"support"` module with no selected exercise (a
 *    structural fact, `ConflictType` already has `"missing_data"` for it);
 * 3. categorical fatigue accumulation on the `grip`/`impact`/`systemic`
 *    tags of `ExerciseFatigueProfile.types` — a presence/absence signal,
 *    never a numeric intensity;
 * 4. an exercise's `recoveryHours` not fitting before
 *    `input.request.nextCombatSessionAt` — the threshold is the
 *    exercise's own documented `recoveryHours`, never an invented constant.
 *
 * Explicitly deferred (not implemented here):
 * - real conflict resolution and `ConflictResolution` recommendations;
 * - backup selection, substitution, draft modification of any kind;
 * - biomechanical redundancy and movement-pattern overlap;
 * - body-region or joint overload (no per-region intensity data exists);
 * - numeric cumulative fatigue on neural/muscular/metabolic/connective
 *   tissue/technical dimensions (no documented aggregation formula —
 *   average, sum and maximum are all equally unconfirmed);
 * - an adaptation-pair interference matrix (e.g. power vs. conditioning —
 *   no such matrix is documented anywhere);
 * - competition-proximity conflicts (`competitionDate` is intentionally
 *   not read here);
 * - residual non-absolute contraindications;
 * - conflicts derived from `trainingHistory`;
 * - duration reduction of any kind;
 * - backtracking, final validation, Decision Trace generation.
 */

import type {
  CapabilityModule,
  DetectedConflict,
  EngineInput,
  ExerciseDefinition,
  FatigueType,
  InitialGeneratedModule,
  InitialSessionDraft,
  SelectedExerciseCandidate,
} from "./types";

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Detects, in a fixed and deterministic order, every conflict this V0.1
 * knows how to recognize in `draft` given `input`: duration overshoot,
 * unsatisfied secondary/support modules, categorical `grip`/`impact`/
 * `systemic` fatigue accumulation, and insufficient recovery before the
 * next combat session. Neither `draft` nor `input` is mutated. Before any
 * detection runs, `assertDraftInvariants` verifies conditions that should
 * be structurally guaranteed by `generateInitialSession` — a violation
 * indicates a pipeline-call error and throws a deterministic `Error`
 * rather than being reported as a `DetectedConflict`.
 */
export function detectSessionConflicts(draft: InitialSessionDraft, input: EngineInput): DetectedConflict[] {
  assertDraftInvariants(draft);

  return [
    ...detectDurationConflict(draft, input),
    ...detectMissingExerciseConflicts(draft),
    ...detectCumulativeFatigueConflicts(draft),
    ...detectCombatRecoveryConflicts(draft, input),
  ];
}

// -----------------------------------------------------------------------------
// Defensive invariants (pipeline-call errors, never a DetectedConflict)
// -----------------------------------------------------------------------------

/**
 * `generateInitialSession` is expected to guarantee: no module appears
 * twice, no module has more than one selected candidate, and every
 * `"primary"` module has exactly one. This function re-verifies those
 * invariants defensively and throws on violation — it never repairs or
 * silently tolerates an inconsistent draft.
 */
function assertDraftInvariants(draft: InitialSessionDraft): void {
  const seenModules = new Set<CapabilityModule>();

  for (const generatedModule of draft.modules) {
    const module = generatedModule.selectedModule.module;

    if (seenModules.has(module)) {
      throw new Error(`Initial session draft contains duplicate module "${module}".`);
    }
    seenModules.add(module);

    const selectedCandidateCount = generatedModule.exerciseSelection.candidates.filter(
      (candidate) => candidate.selected,
    ).length;

    // Several selected candidates is a normal composition since
    // `sessionComposer.ts` — only an EMPTY primary module is still an error.
    if (generatedModule.selectedModule.role === "primary" && selectedCandidateCount === 0) {
      throw new Error(`Initial session draft contains an unsatisfied primary module "${module}".`);
    }
  }
}

// -----------------------------------------------------------------------------
// V0.1 severity / probability policy conventions
// -----------------------------------------------------------------------------

const DURATION_CONFLICT_POLICY = {
  severity: "moderate",
  probability: "high",
  resolutionRequired: true,
} as const;

const MISSING_EXERCISE_CONFLICT_POLICY = {
  severity: "minor",
  probability: "high",
  resolutionRequired: true,
} as const;

const CUMULATIVE_FATIGUE_CONFLICT_POLICY = {
  severity: "minor",
  probability: "moderate",
  resolutionRequired: false,
} as const;

const COMBAT_RECOVERY_CONFLICT_POLICY = {
  severity: "major",
  probability: "high",
  resolutionRequired: true,
} as const;

/** Fixed detection order for the categorical fatigue-accumulation check — see section 7 of the spec. */
const CUMULATIVE_FATIGUE_TYPES: readonly FatigueType[] = ["grip", "impact", "systemic"];

const MILLISECONDS_PER_HOUR = 1000 * 60 * 60;

// -----------------------------------------------------------------------------
// 1. Duration conflict
// -----------------------------------------------------------------------------

function detectDurationConflict(draft: InitialSessionDraft, input: EngineInput): DetectedConflict[] {
  if (draft.estimatedDurationMinutes === undefined) {
    return [];
  }
  if (draft.estimatedDurationMinutes <= input.request.durationMinutes) {
    return [];
  }

  const affectedModules = uniqueInOrder(
    draft.modules
      .filter((generatedModule) => getSelectedCandidate(generatedModule) !== undefined)
      .map((generatedModule) => generatedModule.selectedModule.module),
  );

  return [
    {
      id: "duration_session",
      type: "duration",
      severity: DURATION_CONFLICT_POLICY.severity,
      probability: DURATION_CONFLICT_POLICY.probability,
      description: `Estimated session duration of ${formatNumber(draft.estimatedDurationMinutes)} minutes exceeds the available duration of ${formatNumber(input.request.durationMinutes)} minutes.`,
      affectedModules,
      resolutionRequired: DURATION_CONFLICT_POLICY.resolutionRequired,
    },
  ];
}

// -----------------------------------------------------------------------------
// 2. Unsatisfied secondary / support modules
// -----------------------------------------------------------------------------

function detectMissingExerciseConflicts(draft: InitialSessionDraft): DetectedConflict[] {
  const conflicts: DetectedConflict[] = [];

  for (const generatedModule of draft.modules) {
    const { selectedModule } = generatedModule;

    if (selectedModule.role === "primary") {
      continue;
    }
    if (getSelectedCandidate(generatedModule) !== undefined) {
      continue;
    }

    conflicts.push({
      id: `missing_exercise_${selectedModule.module}`,
      type: "missing_data",
      severity: MISSING_EXERCISE_CONFLICT_POLICY.severity,
      probability: MISSING_EXERCISE_CONFLICT_POLICY.probability,
      description: `No exercise is selected for the "${selectedModule.module}" module with role "${selectedModule.role}".`,
      affectedModules: [selectedModule.module],
      resolutionRequired: MISSING_EXERCISE_CONFLICT_POLICY.resolutionRequired,
    });
  }

  return conflicts;
}

// -----------------------------------------------------------------------------
// 3. Categorical fatigue accumulation (grip / impact / systemic)
// -----------------------------------------------------------------------------

interface SelectedExerciseEntry {
  module: CapabilityModule;
  exercise: ExerciseDefinition;
}

function collectSelectedExercises(draft: InitialSessionDraft): SelectedExerciseEntry[] {
  const entries: SelectedExerciseEntry[] = [];

  for (const generatedModule of draft.modules) {
    for (const candidate of getSelectedCandidates(generatedModule)) {
      entries.push({
        module: generatedModule.selectedModule.module,
        exercise: candidate.scoredExercise.exercise,
      });
    }
  }

  return entries;
}

function detectCumulativeFatigueConflicts(draft: InitialSessionDraft): DetectedConflict[] {
  const selectedExercises = collectSelectedExercises(draft);
  const conflicts: DetectedConflict[] = [];

  for (const fatigueType of CUMULATIVE_FATIGUE_TYPES) {
    const matchingEntries = selectedExercises.filter((entry) =>
      entry.exercise.fatigueProfile.types.includes(fatigueType),
    );

    if (matchingEntries.length < 2) {
      continue;
    }

    conflicts.push({
      id: `cumulative_${fatigueType}_fatigue`,
      type: "volume",
      severity: CUMULATIVE_FATIGUE_CONFLICT_POLICY.severity,
      probability: CUMULATIVE_FATIGUE_CONFLICT_POLICY.probability,
      description: `${matchingEntries.length} selected exercises contribute to cumulative "${fatigueType}" fatigue.`,
      affectedExerciseIds: uniqueInOrder(matchingEntries.map((entry) => entry.exercise.id)),
      affectedModules: uniqueInOrder(matchingEntries.map((entry) => entry.module)),
      resolutionRequired: CUMULATIVE_FATIGUE_CONFLICT_POLICY.resolutionRequired,
    });
  }

  return conflicts;
}

// -----------------------------------------------------------------------------
// 4. Combat recovery conflict
// -----------------------------------------------------------------------------

function detectCombatRecoveryConflicts(draft: InitialSessionDraft, input: EngineInput): DetectedConflict[] {
  const { nextCombatSessionAt, requestedAt } = input.request;
  if (nextCombatSessionAt === undefined) {
    return [];
  }

  const availableHours = (new Date(nextCombatSessionAt).getTime() - new Date(requestedAt).getTime()) / MILLISECONDS_PER_HOUR;

  const conflicts: DetectedConflict[] = [];

  for (const generatedModule of draft.modules) {
    for (const candidate of getSelectedCandidates(generatedModule)) {
    const { exercise } = candidate.scoredExercise;
    const { recoveryHours } = exercise.fatigueProfile;
    if (recoveryHours === undefined) {
      continue;
    }
    if (availableHours >= recoveryHours) {
      continue;
    }

    conflicts.push({
      id: `combat_recovery_${exercise.id}`,
      type: "combat_schedule",
      severity: COMBAT_RECOVERY_CONFLICT_POLICY.severity,
      probability: COMBAT_RECOVERY_CONFLICT_POLICY.probability,
      description: `Exercise "${exercise.id}" requires approximately ${formatNumber(recoveryHours)} recovery hours, but only ${formatNumber(availableHours)} hours remain before the next combat session.`,
      affectedExerciseIds: [exercise.id],
      affectedModules: [generatedModule.selectedModule.module],
      resolutionRequired: COMBAT_RECOVERY_CONFLICT_POLICY.resolutionRequired,
    });
    }
  }

  return conflicts;
}

// -----------------------------------------------------------------------------
// Shared helpers
// -----------------------------------------------------------------------------

function getSelectedCandidate(generatedModule: InitialGeneratedModule): SelectedExerciseCandidate | undefined {
  return generatedModule.exerciseSelection.candidates.find((candidate) => candidate.selected);
}

/** Every exercise the module contributes, in bench order. */
function getSelectedCandidates(generatedModule: InitialGeneratedModule): SelectedExerciseCandidate[] {
  return generatedModule.exerciseSelection.candidates.filter((candidate) => candidate.selected);
}

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
