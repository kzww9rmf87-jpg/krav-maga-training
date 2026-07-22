/**
 * Combat Athlete System — Exercise Eligibility Filtering Tests
 *
 * Section "A — Historical equipment behavior" characterizes
 * `checkRequiredEquipmentAvailable`'s current behavior exactly as it exists
 * today, before any `ExerciseRequirements`/`requirements` work begins. These
 * tests must pass unmodified, against unmodified production code, and must
 * keep passing once the exclusive dispatch (`requirements` vs.
 * `requiredEquipment`/`optionalEquipment`) is introduced, since every
 * exercise here has no `requirements` field and must therefore keep taking
 * the historical code path byte-for-byte.
 */

import { describe, expect, test } from "vitest";

import { checkExerciseEligibility } from "../exerciseSelector";

import { makeEnvironment, makeExercise, makeValidInput } from "./fixtures";

describe("checkExerciseEligibility — historical requiredEquipment/optionalEquipment behavior", () => {
  test("1. accepts an exercise when every required equipment type is present", () => {
    const exercise = makeExercise({ requiredEquipment: ["barbell", "rack"] });
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "rack" }, { type: "plates" }],
      }),
    });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("2. rejects an exercise when a single required equipment type is missing", () => {
    const exercise = makeExercise({ requiredEquipment: ["barbell", "rack"] });
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }], // "rack" missing
      }),
    });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(false);
  });

  test("3. treats requiredEquipment as a logical AND — every missing item produces its own reason", () => {
    const exercise = makeExercise({ requiredEquipment: ["barbell", "rack", "plates"] });
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }], // "rack" and "plates" both missing
      }),
    });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(false);
    const equipmentReasons = result.rejectionReasons.filter((r) => r.code === "EQUIPMENT_UNAVAILABLE");
    expect(equipmentReasons.length).toBe(2);
    expect(equipmentReasons.some((r) => r.message.includes('"rack"'))).toBe(true);
    expect(equipmentReasons.some((r) => r.message.includes('"plates"'))).toBe(true);
  });

  test("4. a missing required equipment item produces an EQUIPMENT_UNAVAILABLE, hard-constraint reason", () => {
    const exercise = makeExercise({ requiredEquipment: ["pull_up_bar"] });
    const input = makeValidInput({
      environment: makeEnvironment({ availableEquipment: [{ type: "bodyweight" }] }),
    });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.length).toBe(1);
    expect(result.rejectionReasons[0].code).toBe("EQUIPMENT_UNAVAILABLE");
    expect(result.rejectionReasons[0].hardConstraint).toBe(true);
  });

  test("5. optionalEquipment is never consulted for eligibility — its absence never causes rejection", () => {
    const exercise = makeExercise({
      requiredEquipment: ["bodyweight"],
      optionalEquipment: ["resistance_band", "kettlebell"],
    });
    const input = makeValidInput({
      environment: makeEnvironment({ availableEquipment: [{ type: "bodyweight" }] }), // neither optional item declared
    });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });
});

describe("checkExerciseEligibility — historical throw/jump/sprint/floor behavior", () => {
  test("1. rejects a throwing exercise when throwingAllowed is explicitly false", () => {
    const exercise = makeExercise({ movementPatterns: ["throw"] });
    const input = makeValidInput({
      environment: makeEnvironment({ throwingAllowed: false }),
    });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("2. accepts a throwing exercise when throwingAllowed is undefined (permissive default)", () => {
    // floorSafe: true isolates this test from checkFloorSafety, since "throw"
    // is also a floor-sensitive pattern and floorSafe defaults to unsafe.
    const exercise = makeExercise({ movementPatterns: ["throw"] });
    const input = makeValidInput({ environment: makeEnvironment({ floorSafe: true }) });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("3. accepts a throwing exercise when throwingAllowed is true", () => {
    const exercise = makeExercise({ movementPatterns: ["throw"] });
    const input = makeValidInput({
      environment: makeEnvironment({ throwingAllowed: true, floorSafe: true }),
    });

    expect(checkExerciseEligibility(exercise, input).eligible).toBe(true);
  });

  test("4. rejects a jumping exercise when jumpingAllowed is explicitly false", () => {
    const exercise = makeExercise({ movementPatterns: ["jump"] });
    const input = makeValidInput({ environment: makeEnvironment({ jumpingAllowed: false }) });

    expect(checkExerciseEligibility(exercise, input).eligible).toBe(false);
  });

  test("5. rejects a sprinting exercise when sprintingAllowed is explicitly false", () => {
    const exercise = makeExercise({ movementPatterns: ["sprint"] });
    const input = makeValidInput({ environment: makeEnvironment({ sprintingAllowed: false }) });

    expect(checkExerciseEligibility(exercise, input).eligible).toBe(false);
  });

  test("6. rejects a floor-sensitive exercise when floorSafe is explicitly false", () => {
    const exercise = makeExercise({ movementPatterns: ["jump"] });
    const input = makeValidInput({ environment: makeEnvironment({ floorSafe: false }) });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.message.includes("the floor is declared unsafe"))).toBe(true);
  });

  test("7. rejects a floor-sensitive exercise when floorSafe is undefined (unsafe-by-default)", () => {
    const exercise = makeExercise({ movementPatterns: ["jump"] });
    const input = makeValidInput({ environment: makeEnvironment({}) });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.message.includes("floor safety is not declared"))).toBe(true);
  });

  test("8. accepts a floor-sensitive exercise when floorSafe is true", () => {
    const exercise = makeExercise({ movementPatterns: ["jump"] });
    const input = makeValidInput({ environment: makeEnvironment({ floorSafe: true }) });

    expect(checkExerciseEligibility(exercise, input).eligible).toBe(true);
  });

  test("9. a non-floor-sensitive exercise is unaffected by an undeclared floorSafe", () => {
    const exercise = makeExercise({ movementPatterns: ["squat"] });
    const input = makeValidInput({ environment: makeEnvironment({}) });

    expect(checkExerciseEligibility(exercise, input).eligible).toBe(true);
  });
});

describe("checkExerciseEligibility — Exercise Requirements Model dispatch", () => {
  test("1. an exercise with requirements is eligible when its atoms are satisfied, ignoring requiredEquipment", () => {
    const exercise = makeExercise({
      requiredEquipment: [],
      optionalEquipment: undefined,
      requirements: {
        required: [{ kind: "all_of", items: [{ kind: "equipment", equipment: "barbell" }] }],
      },
    });
    const input = makeValidInput({
      environment: makeEnvironment({ availableEquipment: [{ type: "barbell" }] }),
    });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("2. an exercise with requirements is never gated by a legacy check it does not declare as an atom", () => {
    const exercise = makeExercise({
      movementPatterns: ["throw"], // would trigger the legacy checkThrowingAllowed
      requiredEquipment: [],
      requirements: {
        required: [{ kind: "all_of", items: [{ kind: "equipment", equipment: "barbell" }] }],
      },
    });
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }],
        throwingAllowed: false, // legacy would reject; new model never declares this atom
      }),
    });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("3. eligible with no reasons when every required clause is satisfied", () => {
    const exercise = makeExercise({
      requiredEquipment: [],
      requirements: {
        required: [
          { kind: "all_of", items: [{ kind: "equipment", equipment: "barbell" }] },
          { kind: "all_of", items: [{ kind: "environment", capability: "usable_wall" }] },
          { kind: "all_of", items: [{ kind: "human_assistance", assistance: "partner" }] },
        ],
      },
    });
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }],
        usableWall: true,
        partnerAvailable: true,
      }),
    });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("4. an unsatisfied all_of clause rejects with one EQUIPMENT_UNAVAILABLE reason for the missing atom", () => {
    const exercise = makeExercise({
      requiredEquipment: [],
      requirements: {
        required: [{ kind: "all_of", items: [{ kind: "equipment", equipment: "barbell" }] }],
      },
    });
    const input = makeValidInput({
      environment: makeEnvironment({ availableEquipment: [{ type: "bodyweight" }] }),
    });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.length).toBe(1);
    expect(result.rejectionReasons[0].code).toBe("EQUIPMENT_UNAVAILABLE");
    expect(result.rejectionReasons[0].hardConstraint).toBe(true);
  });

  test("5. an unsatisfied any_of clause rejects with one reason per unsatisfied atom", () => {
    const exercise = makeExercise({
      requiredEquipment: [],
      requirements: {
        required: [
          {
            kind: "any_of",
            items: [
              { kind: "equipment", equipment: "dumbbell" },
              { kind: "equipment", equipment: "kettlebell" },
            ],
          },
        ],
      },
    });
    const input = makeValidInput({
      environment: makeEnvironment({ availableEquipment: [{ type: "bodyweight" }] }),
    });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.length).toBe(2);
    expect(result.rejectionReasons.every((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    expect(result.rejectionReasons.some((r) => r.message.includes('"dumbbell"'))).toBe(true);
    expect(result.rejectionReasons.some((r) => r.message.includes('"kettlebell"'))).toBe(true);
  });

  test("6. a sufficient_space atom failing rejects with INSUFFICIENT_SPACE", () => {
    const exercise = makeExercise({
      requiredEquipment: [],
      requirements: {
        required: [
          {
            kind: "all_of",
            items: [{ kind: "environment", capability: "sufficient_space", minimumSpace: "large" }],
          },
        ],
      },
    });
    const input = makeValidInput({
      environment: makeEnvironment({ availableSpace: "limited" }),
    });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.length).toBe(1);
    expect(result.rejectionReasons[0].code).toBe("INSUFFICIENT_SPACE");
  });

  test("7. a non-space environment atom failing rejects with UNSAFE_ENVIRONMENT", () => {
    const exercise = makeExercise({
      requiredEquipment: [],
      requirements: {
        required: [{ kind: "all_of", items: [{ kind: "environment", capability: "usable_wall" }] }],
      },
    });
    const input = makeValidInput({ environment: makeEnvironment({ usableWall: false }) });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.length).toBe(1);
    expect(result.rejectionReasons[0].code).toBe("UNSAFE_ENVIRONMENT");
  });

  test("8. a human_assistance atom failing rejects with OTHER", () => {
    const exercise = makeExercise({
      requiredEquipment: [],
      requirements: {
        required: [{ kind: "all_of", items: [{ kind: "human_assistance", assistance: "partner" }] }],
      },
    });
    const input = makeValidInput({ environment: makeEnvironment({ partnerAvailable: false }) });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.length).toBe(1);
    expect(result.rejectionReasons[0].code).toBe("OTHER");
  });

  test("9. an unsatisfied optional clause never affects eligibility and never produces a reason", () => {
    const exercise = makeExercise({
      requiredEquipment: [],
      requirements: {
        required: [{ kind: "all_of", items: [{ kind: "equipment", equipment: "barbell" }] }],
        optional: [{ kind: "all_of", items: [{ kind: "equipment", equipment: "resistance_band" }] }],
      },
    });
    const input = makeValidInput({
      environment: makeEnvironment({ availableEquipment: [{ type: "barbell" }] }),
    });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("10. a structurally invalid requirements (empty clause) rejects via OTHER, without throwing", () => {
    const exercise = makeExercise({
      requiredEquipment: [],
      requirements: {
        required: [{ kind: "all_of", items: [] }],
      },
    });
    const input = makeValidInput({
      environment: makeEnvironment({ availableEquipment: [{ type: "barbell" }] }),
    });

    let result: ReturnType<typeof checkExerciseEligibility> | undefined;
    expect(() => {
      result = checkExerciseEligibility(exercise, input);
    }).not.toThrow();

    expect(result?.eligible).toBe(false);
    expect(result?.rejectionReasons.length).toBe(1);
    expect(result?.rejectionReasons[0].code).toBe("OTHER");
    expect(result?.rejectionReasons[0].message).toContain("zero items");
  });

  test("11. a violated coexistence invariant rejects via OTHER and never evaluates the requirements", () => {
    const exercise = makeExercise({
      requiredEquipment: ["barbell"], // violates coexistence
      requirements: {
        required: [{ kind: "all_of", items: [{ kind: "equipment", equipment: "barbell" }] }],
      },
    });
    const input = makeValidInput({
      environment: makeEnvironment({ availableEquipment: [{ type: "barbell" }] }), // would satisfy requirements if evaluated
    });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.length).toBe(1);
    expect(result.rejectionReasons[0].code).toBe("OTHER");
    expect(result.rejectionReasons[0].message).toContain("requiredEquipment");
  });

  test("12. no double environmental rejection when requirements and legacy would both flag the same field", () => {
    const exercise = makeExercise({
      movementPatterns: ["jump"], // legacy checkFloorSafety would also fire on floorSafe: false
      requiredEquipment: [],
      requirements: {
        required: [{ kind: "all_of", items: [{ kind: "environment", capability: "floor_safe" }] }],
      },
    });
    const input = makeValidInput({ environment: makeEnvironment({ floorSafe: false }) });

    const result = checkExerciseEligibility(exercise, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.length).toBe(1);
    expect(result.rejectionReasons[0].code).toBe("UNSAFE_ENVIRONMENT");
  });

  test("13. reasons are deterministic across repeated calls with the same input", () => {
    const exercise = makeExercise({
      requiredEquipment: [],
      requirements: {
        required: [
          { kind: "all_of", items: [{ kind: "equipment", equipment: "barbell" }] },
          { kind: "all_of", items: [{ kind: "equipment", equipment: "rack" }] },
        ],
      },
    });
    const input = makeValidInput({
      environment: makeEnvironment({ availableEquipment: [{ type: "bodyweight" }] }),
    });

    const first = checkExerciseEligibility(exercise, input);
    const second = checkExerciseEligibility(exercise, input);

    expect(first.rejectionReasons).toEqual(second.rejectionReasons);
  });
});
