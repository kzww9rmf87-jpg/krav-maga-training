/**
 * Combat Athlete System — Exercise Requirements Model
 * Version 0.1
 *
 * Validation and evaluation for `ExerciseRequirements`/`ExerciseRequirementClause`
 * (see `types.ts`) against a `TrainingEnvironment`. Wired into
 * `exerciseSelector.ts`'s `checkNewExerciseRequirementsModel` for exercises
 * that define `requirements`. Every function here is pure and
 * side-effect-free.
 */

import type {
  AvailableSpaceLevel,
  EnvironmentCapability,
  ExerciseDefinition,
  ExerciseRequirementAtom,
  ExerciseRequirementClause,
  ExerciseRequirements,
  Identifier,
  TrainingEnvironment,
} from "./types";

// -----------------------------------------------------------------------------
// Structural validation — no empty clauses
// -----------------------------------------------------------------------------

/**
 * An `all_of` clause with zero items would vacuously satisfy via
 * `Array.prototype.every`; an `any_of` clause with zero items would
 * vacuously fail via `Array.prototype.some`. Both are silent, implicit
 * behaviors this model exists to avoid — every clause must name at least
 * one atom.
 */
export interface RequirementClauseStructuralIssue {
  clause: ExerciseRequirementClause;
  reason: string;
}

export function validateRequirementClauseIsNotEmpty(
  clause: ExerciseRequirementClause,
): RequirementClauseStructuralIssue | null {
  if (clause.items.length > 0) {
    return null;
  }
  return {
    clause,
    reason: `"${clause.kind}" clause has zero items — every clause must contain at least one atom.`,
  };
}

/**
 * Validates every clause in `requirements.required`, then every clause in
 * `requirements.optional ?? []`, each list walked in its own declaration
 * order. Deterministic: the same `requirements` value always produces the
 * same issue list, in the same order. Only non-null issues are returned.
 */
export function validateExerciseRequirementsStructure(
  requirements: ExerciseRequirements,
): readonly RequirementClauseStructuralIssue[] {
  const issues: RequirementClauseStructuralIssue[] = [];

  for (const clause of requirements.required) {
    const issue = validateRequirementClauseIsNotEmpty(clause);
    if (issue !== null) {
      issues.push(issue);
    }
  }

  for (const clause of requirements.optional ?? []) {
    const issue = validateRequirementClauseIsNotEmpty(clause);
    if (issue !== null) {
      issues.push(issue);
    }
  }

  return issues;
}

// -----------------------------------------------------------------------------
// Coexistence invariant — requirements vs. requiredEquipment/optionalEquipment
// -----------------------------------------------------------------------------

/**
 * When `exercise.requirements` is defined, it is the sole source of truth
 * for that exercise's equipment/environment/human-assistance gating — the
 * engine must never also read `requiredEquipment`/`optionalEquipment` for
 * the same exercise. This function detects the one case that would make
 * that rule ambiguous: an exercise declaring `requirements` while also
 * carrying real (non-empty) legacy equipment data. It never resolves the
 * conflict and never mutates `exercise` — it only reports it, explicitly,
 * for the caller to reject.
 */
export interface RequirementsCoexistenceViolation {
  exerciseId: Identifier;
  reason: string;
}

export function validateRequirementsCoexistenceInvariant(
  exercise: ExerciseDefinition,
): RequirementsCoexistenceViolation | null {
  if (exercise.requirements === undefined) {
    return null;
  }

  const reasons: string[] = [];

  if (exercise.requiredEquipment.length > 0) {
    reasons.push(
      `requiredEquipment must be empty when "requirements" is defined, but has ${exercise.requiredEquipment.length} item(s).`,
    );
  }

  if (exercise.optionalEquipment !== undefined && exercise.optionalEquipment.length > 0) {
    reasons.push(
      `optionalEquipment must be absent or empty when "requirements" is defined, but has ${exercise.optionalEquipment.length} item(s).`,
    );
  }

  if (reasons.length === 0) {
    return null;
  }

  return { exerciseId: exercise.id, reason: reasons.join(" ") };
}

// -----------------------------------------------------------------------------
// Space hierarchy
// -----------------------------------------------------------------------------

const AVAILABLE_SPACE_ORDER: readonly AvailableSpaceLevel[] = [
  "very_limited",
  "limited",
  "moderate",
  "large",
  "open",
];

export function isAvailableSpaceSufficient(
  available: AvailableSpaceLevel,
  minimum: AvailableSpaceLevel,
): boolean {
  return AVAILABLE_SPACE_ORDER.indexOf(available) >= AVAILABLE_SPACE_ORDER.indexOf(minimum);
}

// -----------------------------------------------------------------------------
// Atom evaluation
// -----------------------------------------------------------------------------

export interface AtomEvaluationResult {
  atom: ExerciseRequirementAtom;
  satisfied: boolean;
  reason: string;
}

/**
 * `floor_safe` and `safe_landing_surface` deliberately read the same
 * `TrainingEnvironment.floorSafe` field — no separate data exists for
 * "safe landing surface" today. Every branch returns explicitly; no
 * `default` case is needed since `Exclude<EnvironmentCapability,
 * "sufficient_space">` is exhaustively covered.
 */
function evaluateEnvironmentCapability(
  capability: Exclude<EnvironmentCapability, "sufficient_space">,
  environment: TrainingEnvironment,
): boolean {
  switch (capability) {
    case "usable_wall":
      return environment.usableWall === true;
    case "throwing_allowed":
      return environment.throwingAllowed === true;
    case "jumping_allowed":
      return environment.jumpingAllowed === true;
    case "sprinting_allowed":
      return environment.sprintingAllowed === true;
    case "floor_safe":
    case "safe_landing_surface":
      return environment.floorSafe === true;
  }
}

export function evaluateRequirementAtom(
  atom: ExerciseRequirementAtom,
  environment: TrainingEnvironment,
): AtomEvaluationResult {
  switch (atom.kind) {
    case "equipment": {
      const satisfied = environment.availableEquipment.some((item) => item.type === atom.equipment);
      return {
        atom,
        satisfied,
        reason: satisfied
          ? `Equipment "${atom.equipment}" is available.`
          : `Required equipment "${atom.equipment}" is not declared as available.`,
      };
    }
    case "environment": {
      if (atom.capability === "sufficient_space") {
        const satisfied = isAvailableSpaceSufficient(environment.availableSpace, atom.minimumSpace);
        return {
          atom,
          satisfied,
          reason: satisfied
            ? `Available space "${environment.availableSpace}" meets the minimum "${atom.minimumSpace}".`
            : `Available space "${environment.availableSpace}" is below the minimum "${atom.minimumSpace}".`,
        };
      }
      const satisfied = evaluateEnvironmentCapability(atom.capability, environment);
      return {
        atom,
        satisfied,
        reason: satisfied
          ? `Environment capability "${atom.capability}" is available.`
          : `Required environment capability "${atom.capability}" is not declared as available.`,
      };
    }
    case "human_assistance": {
      const satisfied = environment.partnerAvailable === true;
      return {
        atom,
        satisfied,
        reason: satisfied
          ? `Human assistance "${atom.assistance}" is available.`
          : `Required human assistance "${atom.assistance}" is not declared as available.`,
      };
    }
  }
}

// -----------------------------------------------------------------------------
// Clause evaluation
// -----------------------------------------------------------------------------

export interface ClauseEvaluationResult {
  clause: ExerciseRequirementClause;
  satisfied: boolean;
  atomResults: readonly AtomEvaluationResult[];
  missingAtoms: readonly ExerciseRequirementAtom[];
}

/**
 * Throws when given an empty clause — reuses `validateRequirementClauseIsNotEmpty`
 * so there is a single source of truth for what counts as malformed, and so
 * `.every([])`/`.some([])` can never silently produce a `satisfied` value.
 * Every item is evaluated, even for `any_of`, so `atomResults` always shows
 * every alternative that was checked, not just the first match.
 */
export function evaluateRequirementClause(
  clause: ExerciseRequirementClause,
  environment: TrainingEnvironment,
): ClauseEvaluationResult {
  const structuralIssue = validateRequirementClauseIsNotEmpty(clause);
  if (structuralIssue !== null) {
    throw new Error(structuralIssue.reason);
  }

  const atomResults = clause.items.map((atom) => evaluateRequirementAtom(atom, environment));
  const satisfied =
    clause.kind === "all_of"
      ? atomResults.every((result) => result.satisfied)
      : atomResults.some((result) => result.satisfied);

  return {
    clause,
    satisfied,
    atomResults,
    missingAtoms: atomResults.filter((result) => !result.satisfied).map((result) => result.atom),
  };
}

// -----------------------------------------------------------------------------
// Full requirements evaluation
// -----------------------------------------------------------------------------

export interface ExerciseRequirementsEvaluationResult {
  eligible: boolean;
  requiredClauseResults: readonly ClauseEvaluationResult[];
  optionalClauseResults: readonly ClauseEvaluationResult[];
  missingAtoms: readonly ExerciseRequirementAtom[];
  message: string;
}

/** Only reasons from unsatisfied atoms of unsatisfied `required` clauses — never satisfied-atom reasons. */
function buildRequirementsMessage(requiredClauseResults: readonly ClauseEvaluationResult[]): string {
  const unsatisfied = requiredClauseResults.filter((result) => !result.satisfied);
  if (unsatisfied.length === 0) {
    return "All required clauses are satisfied.";
  }
  return unsatisfied
    .flatMap((result) => result.atomResults.filter((atomResult) => !atomResult.satisfied))
    .map((atomResult) => atomResult.reason)
    .join(" ");
}

/**
 * Throws when any `required`/`optional` clause is empty — reuses
 * `validateExerciseRequirementsStructure` to report every structural issue
 * at once rather than failing on only the first one encountered mid-loop.
 * `optionalClauseResults` is always computed and returned, but never
 * consulted for `eligible` and never contributes to `missingAtoms`.
 */
export function evaluateExerciseRequirements(
  requirements: ExerciseRequirements,
  environment: TrainingEnvironment,
): ExerciseRequirementsEvaluationResult {
  const structuralIssues = validateExerciseRequirementsStructure(requirements);
  if (structuralIssues.length > 0) {
    throw new Error(structuralIssues.map((issue) => issue.reason).join(" "));
  }

  const requiredClauseResults = requirements.required.map((clause) => evaluateRequirementClause(clause, environment));
  const optionalClauseResults = (requirements.optional ?? []).map((clause) =>
    evaluateRequirementClause(clause, environment),
  );

  const eligible = requiredClauseResults.every((result) => result.satisfied);
  const missingAtoms = requiredClauseResults
    .filter((result) => !result.satisfied)
    .flatMap((result) => result.missingAtoms);

  return {
    eligible,
    requiredClauseResults,
    optionalClauseResults,
    missingAtoms,
    message: buildRequirementsMessage(requiredClauseResults),
  };
}
