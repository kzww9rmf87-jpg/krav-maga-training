/**
 * Combat Athlete System — Exercise Knowledge Base Pilot Integration Tests
 *
 * Exercises the first production `ExerciseDefinition` (`MED_BALL_CHEST_PASS`,
 * see `exerciseKnowledgeBase.ts`) through the real `checkExerciseEligibility`
 * pipeline (`exerciseSelector.ts`), confirming the Exercise Requirements
 * Model wiring behaves correctly end to end for a real, documented exercise
 * — not just synthetic fixtures. Also documents, via test 3, that the
 * `partner` branch is genuinely usable at the eligibility layer even though
 * `exercisePrescriptionRegistry.ts` cannot yet prescribe it (see
 * `MED_BALL_CHEST_PASS_PARTNER_VARIANT_UNPRESCRIBABLE`).
 */

import { describe, expect, test } from "vitest";

import { checkExerciseEligibility } from "../exerciseSelector";
import {
  validateExerciseRequirementsStructure,
  validateRequirementsCoexistenceInvariant,
} from "../exerciseRequirements";
import { EXERCISE_KNOWLEDGE_BASE, MED_BALL_CHEST_PASS, MED_BALL_SLAM } from "../exerciseKnowledgeBase";

import { makeEnvironment, makeExercise, makeValidInput } from "./fixtures";

describe("MED_BALL_CHEST_PASS — Exercise Requirements Model pilot integration", () => {
  test("1. eligible with medicine_ball and a usable wall", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_CHEST_PASS, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("2. eligible with medicine_ball and a partner, with no usable wall", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: false,
        partnerAvailable: true,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_CHEST_PASS, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("3. ineligible without a wall or a partner", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: false,
        partnerAvailable: false,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_CHEST_PASS, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.length).toBe(2);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
    expect(result.rejectionReasons.some((r) => r.code === "OTHER")).toBe(true);
  });

  test("4. ineligible without medicine_ball", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "bodyweight" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_CHEST_PASS, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("5. ineligible when throwingAllowed is false", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: false,
        availableSpace: "limited",
        usableWall: true,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_CHEST_PASS, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("6. ineligible when available space is below the documented minimum (limited)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "very_limited",
        usableWall: true,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_CHEST_PASS, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
  });

  test("7. no duplicate legacy rejection for throwingAllowed: false despite movementPatterns including throw", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: false, // legacy checkThrowingAllowed would also fire on movementPatterns ["throw", ...]
        availableSpace: "limited",
        usableWall: true,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_CHEST_PASS, input);

    expect(result.eligible).toBe(false);
    const throwingReasons = result.rejectionReasons.filter((r) => r.message.includes("throwing_allowed"));
    expect(throwingReasons.length).toBe(1);
  });

  test("8. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent", () => {
    expect(MED_BALL_CHEST_PASS.requiredEquipment).toEqual([]);
    expect(MED_BALL_CHEST_PASS.optionalEquipment).toBeUndefined();
    expect(validateRequirementsCoexistenceInvariant(MED_BALL_CHEST_PASS)).toBeNull();
    expect(validateExerciseRequirementsStructure(MED_BALL_CHEST_PASS.requirements!)).toEqual([]);
  });

  test("9. adding this knowledge-base entry never changes eligibility for other, unrelated exercises", () => {
    const legacyExercise = makeExercise({ requiredEquipment: ["barbell"] });
    const input = makeValidInput({
      environment: makeEnvironment({ availableEquipment: [{ type: "barbell" }] }),
    });

    expect(checkExerciseEligibility(legacyExercise, input).eligible).toBe(true);
    // No medicine_ball, wall or partner declared in this environment — the
    // new knowledge-base entry is correctly ineligible, and does not
    // interfere with the unrelated legacy exercise above.
    expect(checkExerciseEligibility(MED_BALL_CHEST_PASS, input).eligible).toBe(false);
  });
});

describe("MED_BALL_SLAM — Exercise Requirements Model pilot integration", () => {
  test("1. the entry exists in the catalog", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(MED_BALL_SLAM);
  });

  test("2. has a unique identifier within the catalog", () => {
    expect(MED_BALL_SLAM.id).toBe("med_ball_slam");
    expect(MED_BALL_SLAM.id).not.toBe(MED_BALL_CHEST_PASS.id);
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent", () => {
    expect(MED_BALL_SLAM.requiredEquipment).toEqual([]);
    expect(MED_BALL_SLAM.optionalEquipment).toBeUndefined();
    expect(validateRequirementsCoexistenceInvariant(MED_BALL_SLAM)).toBeNull();
    expect(validateExerciseRequirementsStructure(MED_BALL_SLAM.requirements!)).toEqual([]);
  });

  test("4. eligible in a complete environment", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "slam_ball" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SLAM, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("5. ineligible without the required equipment (slam_ball)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }], // not slam_ball
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SLAM, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("6. ineligible when the floor is not safe (safe_landing_surface)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "slam_ball" }],
        throwingAllowed: true,
        floorSafe: false,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SLAM, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("7. ineligible when available space is below the documented minimum (limited)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "slam_ball" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "very_limited",
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SLAM, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
  });

  test("8. ineligible when throwing is not allowed", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "slam_ball" }],
        throwingAllowed: false,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SLAM, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("9. no unintended dependency on a wall or a partner", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "slam_ball" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
        usableWall: false,
        partnerAvailable: false,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SLAM, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("10. adding this entry never changes MED_BALL_CHEST_PASS's behavior", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_CHEST_PASS, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });
});
