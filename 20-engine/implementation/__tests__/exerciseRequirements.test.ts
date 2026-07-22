/**
 * Combat Athlete System — Exercise Requirements Model Tests
 *
 * Covers every pure function exported by `exerciseRequirements.ts`:
 * structural validation, the requirements/legacy-equipment coexistence
 * invariant, and the four evaluation functions
 * (`isAvailableSpaceSufficient`, `evaluateRequirementAtom`,
 * `evaluateRequirementClause`, `evaluateExerciseRequirements`). No
 * `exerciseSelector.ts` wiring exists yet — that is a later step.
 */

import { describe, expect, test } from "vitest";

import {
  evaluateExerciseRequirements,
  evaluateRequirementAtom,
  evaluateRequirementClause,
  isAvailableSpaceSufficient,
  validateExerciseRequirementsStructure,
  validateRequirementClauseIsNotEmpty,
  validateRequirementsCoexistenceInvariant,
} from "../exerciseRequirements";
import type {
  AvailableSpaceLevel,
  ExerciseRequirementAtom,
  ExerciseRequirementClause,
  ExerciseRequirements,
} from "../types";

import { makeEnvironment, makeExercise } from "./fixtures";

const nonEmptyAllOf: ExerciseRequirementClause = {
  kind: "all_of",
  items: [{ kind: "equipment", equipment: "barbell" }],
};

const nonEmptyAnyOf: ExerciseRequirementClause = {
  kind: "any_of",
  items: [
    { kind: "equipment", equipment: "dumbbell" },
    { kind: "equipment", equipment: "kettlebell" },
  ],
};

const emptyAllOf: ExerciseRequirementClause = { kind: "all_of", items: [] };
const emptyAnyOf: ExerciseRequirementClause = { kind: "any_of", items: [] };

describe("validateRequirementClauseIsNotEmpty", () => {
  test("1. returns null for a non-empty all_of clause", () => {
    expect(validateRequirementClauseIsNotEmpty(nonEmptyAllOf)).toBeNull();
  });

  test("2. returns null for a non-empty any_of clause", () => {
    expect(validateRequirementClauseIsNotEmpty(nonEmptyAnyOf)).toBeNull();
  });

  test("3. returns an issue for an empty all_of clause", () => {
    const issue = validateRequirementClauseIsNotEmpty(emptyAllOf);

    expect(issue).not.toBeNull();
    expect(issue?.clause).toBe(emptyAllOf);
    expect(issue?.reason).toContain("all_of");
    expect(issue?.reason).toContain("zero items");
  });

  test("4. returns an issue for an empty any_of clause", () => {
    const issue = validateRequirementClauseIsNotEmpty(emptyAnyOf);

    expect(issue).not.toBeNull();
    expect(issue?.clause).toBe(emptyAnyOf);
    expect(issue?.reason).toContain("any_of");
    expect(issue?.reason).toContain("zero items");
  });
});

describe("validateExerciseRequirementsStructure", () => {
  test("1. validates required clauses before optional clauses, in order", () => {
    const requirements: ExerciseRequirements = {
      required: [emptyAnyOf],
      optional: [emptyAllOf],
    };

    const issues = validateExerciseRequirementsStructure(requirements);

    expect(issues.length).toBe(2);
    expect(issues[0].clause).toBe(emptyAnyOf);
    expect(issues[1].clause).toBe(emptyAllOf);
  });

  test("2. produces a deterministic, repeatable order across calls", () => {
    const requirements: ExerciseRequirements = {
      required: [nonEmptyAllOf, emptyAnyOf, emptyAllOf],
      optional: [emptyAnyOf],
    };

    const first = validateExerciseRequirementsStructure(requirements);
    const second = validateExerciseRequirementsStructure(requirements);

    expect(first.map((issue) => issue.clause)).toEqual(second.map((issue) => issue.clause));
    expect(first.map((issue) => issue.clause)).toEqual([emptyAnyOf, emptyAllOf, emptyAnyOf]);
  });

  test("3. returns only the empty clauses, never the well-formed ones", () => {
    const requirements: ExerciseRequirements = {
      required: [nonEmptyAllOf, emptyAnyOf],
      optional: [nonEmptyAnyOf],
    };

    const issues = validateExerciseRequirementsStructure(requirements);

    expect(issues.length).toBe(1);
    expect(issues[0].clause).toBe(emptyAnyOf);
  });

  test("4. accepts requirements with no optional field at all", () => {
    const requirements: ExerciseRequirements = { required: [nonEmptyAllOf, nonEmptyAnyOf] };

    const issues = validateExerciseRequirementsStructure(requirements);

    expect(issues).toEqual([]);
  });
});

describe("validateRequirementsCoexistenceInvariant", () => {
  test("1. returns null when requirements is absent", () => {
    const exercise = makeExercise({ requiredEquipment: ["barbell"] });

    expect(validateRequirementsCoexistenceInvariant(exercise)).toBeNull();
  });

  test("2. returns null when requirements is present with requiredEquipment: [] and no optionalEquipment", () => {
    const exercise = makeExercise({
      requiredEquipment: [],
      optionalEquipment: undefined,
      requirements: { required: [nonEmptyAllOf] },
    });

    expect(validateRequirementsCoexistenceInvariant(exercise)).toBeNull();
  });

  test("3. rejects a non-empty requiredEquipment", () => {
    const exercise = makeExercise({
      requiredEquipment: ["barbell"],
      requirements: { required: [nonEmptyAllOf] },
    });

    const violation = validateRequirementsCoexistenceInvariant(exercise);

    expect(violation).not.toBeNull();
    expect(violation?.exerciseId).toBe(exercise.id);
    expect(violation?.reason).toContain("requiredEquipment");
    expect(violation?.reason).not.toContain("optionalEquipment");
  });

  test("4. rejects a non-empty optionalEquipment", () => {
    const exercise = makeExercise({
      requiredEquipment: [],
      optionalEquipment: ["resistance_band"],
      requirements: { required: [nonEmptyAllOf] },
    });

    const violation = validateRequirementsCoexistenceInvariant(exercise);

    expect(violation).not.toBeNull();
    expect(violation?.exerciseId).toBe(exercise.id);
    expect(violation?.reason).toContain("optionalEquipment");
    expect(violation?.reason).not.toContain("requiredEquipment must be empty");
  });

  test("5. combines both violations when both fields are non-empty", () => {
    const exercise = makeExercise({
      requiredEquipment: ["barbell"],
      optionalEquipment: ["resistance_band"],
      requirements: { required: [nonEmptyAllOf] },
    });

    const violation = validateRequirementsCoexistenceInvariant(exercise);

    expect(violation).not.toBeNull();
    expect(violation?.reason).toContain("requiredEquipment");
    expect(violation?.reason).toContain("optionalEquipment");
  });

  test("6. never mutates the exercise object it is given", () => {
    const exercise = makeExercise({
      requiredEquipment: ["barbell"],
      optionalEquipment: ["resistance_band"],
      requirements: { required: [nonEmptyAllOf] },
    });
    const snapshot = structuredClone(exercise);

    validateRequirementsCoexistenceInvariant(exercise);

    expect(exercise).toEqual(snapshot);
  });
});
const SPACE_ORDER: readonly AvailableSpaceLevel[] = ["very_limited", "limited", "moderate", "large", "open"];

describe("isAvailableSpaceSufficient", () => {
  test("1. each level satisfies its own minimum", () => {
    for (const level of SPACE_ORDER) {
      expect(isAvailableSpaceSufficient(level, level)).toBe(true);
    }
  });

  test("2. a higher level satisfies a lower minimum", () => {
    expect(isAvailableSpaceSufficient("open", "very_limited")).toBe(true);
    expect(isAvailableSpaceSufficient("large", "moderate")).toBe(true);
    expect(isAvailableSpaceSufficient("moderate", "limited")).toBe(true);
  });

  test("3. a lower level fails a higher minimum", () => {
    expect(isAvailableSpaceSufficient("very_limited", "open")).toBe(false);
    expect(isAvailableSpaceSufficient("limited", "moderate")).toBe(false);
    expect(isAvailableSpaceSufficient("moderate", "large")).toBe(false);
  });

  test("4. exact hierarchy across all 25 available/minimum combinations", () => {
    for (let availableIndex = 0; availableIndex < SPACE_ORDER.length; availableIndex += 1) {
      for (let minimumIndex = 0; minimumIndex < SPACE_ORDER.length; minimumIndex += 1) {
        const available = SPACE_ORDER[availableIndex];
        const minimum = SPACE_ORDER[minimumIndex];
        expect(isAvailableSpaceSufficient(available, minimum)).toBe(availableIndex >= minimumIndex);
      }
    }
  });
});

describe("evaluateRequirementAtom", () => {
  test("1. equipment atom is satisfied when the equipment type is available", () => {
    const atom: ExerciseRequirementAtom = { kind: "equipment", equipment: "barbell" };
    const environment = makeEnvironment({ availableEquipment: [{ type: "barbell" }] });

    const result = evaluateRequirementAtom(atom, environment);

    expect(result.satisfied).toBe(true);
    expect(result.atom).toBe(atom);
  });

  test("2. equipment atom is not satisfied when the equipment type is absent", () => {
    const atom: ExerciseRequirementAtom = { kind: "equipment", equipment: "barbell" };
    const environment = makeEnvironment({ availableEquipment: [{ type: "bodyweight" }] });

    expect(evaluateRequirementAtom(atom, environment).satisfied).toBe(false);
  });

  test("3. usable_wall reads TrainingEnvironment.usableWall", () => {
    const atom: ExerciseRequirementAtom = { kind: "environment", capability: "usable_wall" };

    expect(evaluateRequirementAtom(atom, makeEnvironment({ usableWall: true })).satisfied).toBe(true);
    expect(evaluateRequirementAtom(atom, makeEnvironment({ usableWall: false })).satisfied).toBe(false);
    expect(evaluateRequirementAtom(atom, makeEnvironment({})).satisfied).toBe(false);
  });

  test("4. throwing_allowed reads TrainingEnvironment.throwingAllowed", () => {
    const atom: ExerciseRequirementAtom = { kind: "environment", capability: "throwing_allowed" };

    expect(evaluateRequirementAtom(atom, makeEnvironment({ throwingAllowed: true })).satisfied).toBe(true);
    expect(evaluateRequirementAtom(atom, makeEnvironment({ throwingAllowed: false })).satisfied).toBe(false);
  });

  test("5. jumping_allowed reads TrainingEnvironment.jumpingAllowed", () => {
    const atom: ExerciseRequirementAtom = { kind: "environment", capability: "jumping_allowed" };

    expect(evaluateRequirementAtom(atom, makeEnvironment({ jumpingAllowed: true })).satisfied).toBe(true);
    expect(evaluateRequirementAtom(atom, makeEnvironment({ jumpingAllowed: false })).satisfied).toBe(false);
  });

  test("6. sprinting_allowed reads TrainingEnvironment.sprintingAllowed", () => {
    const atom: ExerciseRequirementAtom = { kind: "environment", capability: "sprinting_allowed" };

    expect(evaluateRequirementAtom(atom, makeEnvironment({ sprintingAllowed: true })).satisfied).toBe(true);
    expect(evaluateRequirementAtom(atom, makeEnvironment({ sprintingAllowed: false })).satisfied).toBe(false);
  });

  test("7. floor_safe reads TrainingEnvironment.floorSafe", () => {
    const atom: ExerciseRequirementAtom = { kind: "environment", capability: "floor_safe" };

    expect(evaluateRequirementAtom(atom, makeEnvironment({ floorSafe: true })).satisfied).toBe(true);
    expect(evaluateRequirementAtom(atom, makeEnvironment({ floorSafe: false })).satisfied).toBe(false);
  });

  test("8. safe_landing_surface reads the same floorSafe field as floor_safe", () => {
    const atom: ExerciseRequirementAtom = { kind: "environment", capability: "safe_landing_surface" };

    expect(evaluateRequirementAtom(atom, makeEnvironment({ floorSafe: true })).satisfied).toBe(true);
    expect(evaluateRequirementAtom(atom, makeEnvironment({ floorSafe: false })).satisfied).toBe(false);
  });

  test("9. sufficient_space is satisfied when available space meets the minimum", () => {
    const atom: ExerciseRequirementAtom = {
      kind: "environment",
      capability: "sufficient_space",
      minimumSpace: "moderate",
    };
    const environment = makeEnvironment({ availableSpace: "large" });

    expect(evaluateRequirementAtom(atom, environment).satisfied).toBe(true);
  });

  test("10. sufficient_space is not satisfied when available space is below the minimum", () => {
    const atom: ExerciseRequirementAtom = {
      kind: "environment",
      capability: "sufficient_space",
      minimumSpace: "large",
    };
    const environment = makeEnvironment({ availableSpace: "limited" });

    expect(evaluateRequirementAtom(atom, environment).satisfied).toBe(false);
  });

  test("11. partner reads TrainingEnvironment.partnerAvailable", () => {
    const atom: ExerciseRequirementAtom = { kind: "human_assistance", assistance: "partner" };

    expect(evaluateRequirementAtom(atom, makeEnvironment({ partnerAvailable: true })).satisfied).toBe(true);
    expect(evaluateRequirementAtom(atom, makeEnvironment({ partnerAvailable: false })).satisfied).toBe(false);
    expect(evaluateRequirementAtom(atom, makeEnvironment({})).satisfied).toBe(false);
  });

  test("12. reasons are deterministic across repeated calls with the same input", () => {
    const atom: ExerciseRequirementAtom = { kind: "equipment", equipment: "kettlebell" };
    const environment = makeEnvironment({ availableEquipment: [{ type: "bodyweight" }] });

    const first = evaluateRequirementAtom(atom, environment);
    const second = evaluateRequirementAtom(atom, environment);

    expect(first).toEqual(second);
  });

  test("13. never mutates the atom or the environment it is given", () => {
    const atom: ExerciseRequirementAtom = { kind: "equipment", equipment: "barbell" };
    const environment = makeEnvironment({ availableEquipment: [{ type: "barbell" }], usableWall: true });
    const atomSnapshot = structuredClone(atom);
    const environmentSnapshot = structuredClone(environment);

    evaluateRequirementAtom(atom, environment);

    expect(atom).toEqual(atomSnapshot);
    expect(environment).toEqual(environmentSnapshot);
  });
});

describe("evaluateRequirementClause", () => {
  test("1. all_of is satisfied when every atom is satisfied", () => {
    const clause: ExerciseRequirementClause = {
      kind: "all_of",
      items: [
        { kind: "equipment", equipment: "barbell" },
        { kind: "equipment", equipment: "rack" },
      ],
    };
    const environment = makeEnvironment({ availableEquipment: [{ type: "barbell" }, { type: "rack" }] });

    const result = evaluateRequirementClause(clause, environment);

    expect(result.satisfied).toBe(true);
    expect(result.missingAtoms).toEqual([]);
  });

  test("2. all_of is not satisfied when only some atoms are satisfied", () => {
    const clause: ExerciseRequirementClause = {
      kind: "all_of",
      items: [
        { kind: "equipment", equipment: "barbell" },
        { kind: "equipment", equipment: "rack" },
      ],
    };
    const environment = makeEnvironment({ availableEquipment: [{ type: "barbell" }] });

    const result = evaluateRequirementClause(clause, environment);

    expect(result.satisfied).toBe(false);
    expect(result.missingAtoms).toEqual([clause.items[1]]);
  });

  test("3. any_of is satisfied when at least one atom is satisfied", () => {
    const clause: ExerciseRequirementClause = {
      kind: "any_of",
      items: [
        { kind: "environment", capability: "usable_wall" },
        { kind: "human_assistance", assistance: "partner" },
      ],
    };
    const environment = makeEnvironment({ usableWall: false, partnerAvailable: true });

    expect(evaluateRequirementClause(clause, environment).satisfied).toBe(true);
  });

  test("4. any_of is not satisfied when no atom is satisfied", () => {
    const clause: ExerciseRequirementClause = {
      kind: "any_of",
      items: [
        { kind: "environment", capability: "usable_wall" },
        { kind: "human_assistance", assistance: "partner" },
      ],
    };
    const environment = makeEnvironment({ usableWall: false, partnerAvailable: false });

    const result = evaluateRequirementClause(clause, environment);

    expect(result.satisfied).toBe(false);
    expect(result.missingAtoms).toEqual(clause.items);
  });

  test("5. an empty clause throws the exact expected error", () => {
    const emptyClause: ExerciseRequirementClause = { kind: "any_of", items: [] };
    const environment = makeEnvironment();

    expect(() => evaluateRequirementClause(emptyClause, environment)).toThrowError(
      '"any_of" clause has zero items — every clause must contain at least one atom.',
    );
  });

  test("6. atomResults preserve declaration order", () => {
    const clause: ExerciseRequirementClause = {
      kind: "any_of",
      items: [
        { kind: "equipment", equipment: "kettlebell" },
        { kind: "equipment", equipment: "barbell" },
        { kind: "equipment", equipment: "dumbbell" },
      ],
    };
    const environment = makeEnvironment({ availableEquipment: [{ type: "barbell" }] });

    const result = evaluateRequirementClause(clause, environment);

    expect(result.atomResults.map((atomResult) => atomResult.atom)).toEqual(clause.items);
  });

  test("7. missingAtoms is exact and deterministic across repeated calls", () => {
    const clause: ExerciseRequirementClause = {
      kind: "all_of",
      items: [
        { kind: "equipment", equipment: "barbell" },
        { kind: "equipment", equipment: "rack" },
        { kind: "equipment", equipment: "plates" },
      ],
    };
    const environment = makeEnvironment({ availableEquipment: [{ type: "barbell" }] });

    const first = evaluateRequirementClause(clause, environment);
    const second = evaluateRequirementClause(clause, environment);

    expect(first.missingAtoms).toEqual([clause.items[1], clause.items[2]]);
    expect(first.missingAtoms).toEqual(second.missingAtoms);
  });
});

describe("evaluateExerciseRequirements", () => {
  test("1. eligible is true when every required clause is satisfied", () => {
    const requirements: ExerciseRequirements = {
      required: [
        { kind: "all_of", items: [{ kind: "equipment", equipment: "barbell" }] },
        { kind: "any_of", items: [{ kind: "human_assistance", assistance: "partner" }] },
      ],
    };
    const environment = makeEnvironment({
      availableEquipment: [{ type: "barbell" }],
      partnerAvailable: true,
    });

    const result = evaluateExerciseRequirements(requirements, environment);

    expect(result.eligible).toBe(true);
    expect(result.missingAtoms).toEqual([]);
  });

  test("2. eligible is false when a single required clause fails", () => {
    const requirements: ExerciseRequirements = {
      required: [
        { kind: "all_of", items: [{ kind: "equipment", equipment: "barbell" }] },
        { kind: "any_of", items: [{ kind: "human_assistance", assistance: "partner" }] },
      ],
    };
    const environment = makeEnvironment({
      availableEquipment: [{ type: "barbell" }],
      partnerAvailable: false,
    });

    expect(evaluateExerciseRequirements(requirements, environment).eligible).toBe(false);
  });

  test("3. every failing required clause contributes its missing atoms", () => {
    const requirements: ExerciseRequirements = {
      required: [
        { kind: "all_of", items: [{ kind: "equipment", equipment: "barbell" }] },
        { kind: "any_of", items: [{ kind: "human_assistance", assistance: "partner" }] },
      ],
    };
    const environment = makeEnvironment({
      availableEquipment: [{ type: "bodyweight" }],
      partnerAvailable: false,
    });

    const result = evaluateExerciseRequirements(requirements, environment);

    expect(result.eligible).toBe(false);
    expect(result.missingAtoms).toEqual([
      requirements.required[0].items[0],
      requirements.required[1].items[0],
    ]);
  });

  test("4. optional clauses are evaluated and returned", () => {
    const requirements: ExerciseRequirements = {
      required: [{ kind: "all_of", items: [{ kind: "equipment", equipment: "barbell" }] }],
      optional: [{ kind: "all_of", items: [{ kind: "equipment", equipment: "resistance_band" }] }],
    };
    const environment = makeEnvironment({ availableEquipment: [{ type: "barbell" }] });

    const result = evaluateExerciseRequirements(requirements, environment);

    expect(result.optionalClauseResults.length).toBe(1);
    expect(result.optionalClauseResults[0].satisfied).toBe(false);
  });

  test("5. an unsatisfied optional clause never changes eligible", () => {
    const requirements: ExerciseRequirements = {
      required: [{ kind: "all_of", items: [{ kind: "equipment", equipment: "barbell" }] }],
      optional: [{ kind: "all_of", items: [{ kind: "equipment", equipment: "resistance_band" }] }],
    };
    const environment = makeEnvironment({ availableEquipment: [{ type: "barbell" }] });

    expect(evaluateExerciseRequirements(requirements, environment).eligible).toBe(true);
  });

  test("6. optional missingAtoms are never added to the blocking missingAtoms", () => {
    const requirements: ExerciseRequirements = {
      required: [{ kind: "all_of", items: [{ kind: "equipment", equipment: "barbell" }] }],
      optional: [{ kind: "all_of", items: [{ kind: "equipment", equipment: "resistance_band" }] }],
    };
    const environment = makeEnvironment({ availableEquipment: [{ type: "barbell" }] });

    expect(evaluateExerciseRequirements(requirements, environment).missingAtoms).toEqual([]);
  });

  test("7. produces a deterministic order of results and reasons across repeated calls", () => {
    const requirements: ExerciseRequirements = {
      required: [
        { kind: "all_of", items: [{ kind: "equipment", equipment: "barbell" }] },
        { kind: "all_of", items: [{ kind: "equipment", equipment: "rack" }] },
      ],
    };
    const environment = makeEnvironment({ availableEquipment: [{ type: "bodyweight" }] });

    const first = evaluateExerciseRequirements(requirements, environment);
    const second = evaluateExerciseRequirements(requirements, environment);

    expect(first.missingAtoms).toEqual(second.missingAtoms);
    expect(first.message).toBe(second.message);
    expect(first.requiredClauseResults.map((result) => result.clause)).toEqual(
      second.requiredClauseResults.map((result) => result.clause),
    );
  });

  test("8. never mutates requirements or environment", () => {
    const requirements: ExerciseRequirements = {
      required: [{ kind: "all_of", items: [{ kind: "equipment", equipment: "barbell" }] }],
      optional: [{ kind: "any_of", items: [{ kind: "human_assistance", assistance: "partner" }] }],
    };
    const environment = makeEnvironment({
      availableEquipment: [{ type: "barbell" }],
      partnerAvailable: false,
    });
    const requirementsSnapshot = structuredClone(requirements);
    const environmentSnapshot = structuredClone(environment);

    evaluateExerciseRequirements(requirements, environment);

    expect(requirements).toEqual(requirementsSnapshot);
    expect(environment).toEqual(environmentSnapshot);
  });
});
