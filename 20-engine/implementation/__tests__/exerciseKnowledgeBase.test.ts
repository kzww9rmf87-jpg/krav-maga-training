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
import {
  BOX_JUMP,
  BROAD_JUMP,
  COUNTERMOVEMENT_JUMP,
  DEPTH_JUMP,
  EXERCISE_KNOWLEDGE_BASE,
  KNEE_JUMP,
  LATERAL_BOUND,
  MED_BALL_CHEST_PASS,
  MED_BALL_OVERHEAD_THROW,
  MED_BALL_REVERSE_THROW,
  MED_BALL_ROTATIONAL_THROW,
  MED_BALL_SCOOP_TOSS,
  MED_BALL_SHOT_PUT_THROW,
  MED_BALL_SLAM,
  SINGLE_LEG_HOP,
  SPLIT_SQUAT_JUMP,
} from "../exerciseKnowledgeBase";

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

describe("MED_BALL_OVERHEAD_THROW — Exercise Requirements Model pilot integration", () => {
  test("1. the entry exists in the catalog", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(MED_BALL_OVERHEAD_THROW);
  });

  test("2. has a unique identifier within the catalog", () => {
    expect(MED_BALL_OVERHEAD_THROW.id).toBe("med_ball_overhead_throw");
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent", () => {
    expect(MED_BALL_OVERHEAD_THROW.requiredEquipment).toEqual([]);
    expect(MED_BALL_OVERHEAD_THROW.optionalEquipment).toBeUndefined();
    expect(validateRequirementsCoexistenceInvariant(MED_BALL_OVERHEAD_THROW)).toBeNull();
    expect(validateExerciseRequirementsStructure(MED_BALL_OVERHEAD_THROW.requirements!)).toEqual([]);
  });

  test("4a. eligible with medicine_ball and open_space (no wall)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
        usableWall: false,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_OVERHEAD_THROW, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("4b. eligible with medicine_ball and a usable wall (no open_space)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "moderate",
        usableWall: true,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_OVERHEAD_THROW, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("5. ineligible without the required equipment (medicine_ball)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "open_space" }], // no medicine_ball
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_OVERHEAD_THROW, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("6. ineligible when throwing is not allowed", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: false,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_OVERHEAD_THROW, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("7. ineligible when available space is below the documented minimum (moderate)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_OVERHEAD_THROW, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
  });

  test("8. ineligible without open_space or a usable wall", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "moderate",
        usableWall: false,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_OVERHEAD_THROW, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("9. no unintended dependency on floor safety or a partner", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
        floorSafe: false, // never mentioned by this exercise's documentation
        partnerAvailable: false, // never mentioned by this exercise's documentation either
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_OVERHEAD_THROW, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("10. adding this entry never changes MED_BALL_CHEST_PASS's or MED_BALL_SLAM's behavior", () => {
    const chestPassInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_CHEST_PASS, chestPassInput).eligible).toBe(true);

    const slamInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "slam_ball" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SLAM, slamInput).eligible).toBe(true);
  });
});

describe("MED_BALL_ROTATIONAL_THROW — Exercise Requirements Model pilot integration", () => {
  test("1. the entry exists in the catalog", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(MED_BALL_ROTATIONAL_THROW);
  });

  test("2. has a unique identifier within the catalog", () => {
    expect(MED_BALL_ROTATIONAL_THROW.id).toBe("med_ball_rotational_throw");
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent", () => {
    expect(MED_BALL_ROTATIONAL_THROW.requiredEquipment).toEqual([]);
    expect(MED_BALL_ROTATIONAL_THROW.optionalEquipment).toBeUndefined();
    expect(validateRequirementsCoexistenceInvariant(MED_BALL_ROTATIONAL_THROW)).toBeNull();
    expect(validateExerciseRequirementsStructure(MED_BALL_ROTATIONAL_THROW.requirements!)).toEqual([]);
  });

  test("4a. eligible with medicine_ball and a usable wall", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_ROTATIONAL_THROW, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("4b. eligible with medicine_ball and a partner, with no usable wall", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: false,
        partnerAvailable: true,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_ROTATIONAL_THROW, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("5. ineligible without the required equipment (medicine_ball)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "bodyweight" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_ROTATIONAL_THROW, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("6. ineligible when throwing is not allowed", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: false,
        availableSpace: "limited",
        usableWall: true,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_ROTATIONAL_THROW, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("7. ineligible when available space is below the documented minimum (limited)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "very_limited",
        usableWall: true,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_ROTATIONAL_THROW, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
  });

  test("8. ineligible without a wall or a partner", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: false,
        partnerAvailable: false,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_ROTATIONAL_THROW, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.length).toBe(2);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
    expect(result.rejectionReasons.some((r) => r.code === "OTHER")).toBe(true);
  });

  test("9. no unintended dependency on floor safety", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
        floorSafe: false, // never mentioned by this exercise's documentation
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_ROTATIONAL_THROW, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("10. adding this entry never changes the three previously integrated exercises", () => {
    const chestPassInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_CHEST_PASS, chestPassInput).eligible).toBe(true);

    const slamInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "slam_ball" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SLAM, slamInput).eligible).toBe(true);

    const overheadThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_OVERHEAD_THROW, overheadThrowInput).eligible).toBe(true);
  });
});

describe("MED_BALL_SCOOP_TOSS — Exercise Requirements Model pilot integration", () => {
  test("1. the entry exists in the catalog", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(MED_BALL_SCOOP_TOSS);
  });

  test("2. has a unique identifier within the catalog", () => {
    expect(MED_BALL_SCOOP_TOSS.id).toBe("med_ball_scoop_toss");
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent", () => {
    expect(MED_BALL_SCOOP_TOSS.requiredEquipment).toEqual([]);
    expect(MED_BALL_SCOOP_TOSS.optionalEquipment).toBeUndefined();
    expect(validateRequirementsCoexistenceInvariant(MED_BALL_SCOOP_TOSS)).toBeNull();
    expect(validateExerciseRequirementsStructure(MED_BALL_SCOOP_TOSS.requirements!)).toEqual([]);
  });

  test("4a. eligible with medicine_ball and open_space (no wall)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
        usableWall: false,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SCOOP_TOSS, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("4b. eligible with medicine_ball and a usable wall (no open_space)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "moderate",
        usableWall: true,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SCOOP_TOSS, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("5. ineligible without the required equipment (medicine_ball)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "open_space" }], // no medicine_ball
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SCOOP_TOSS, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("6. ineligible when throwing is not allowed", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: false,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SCOOP_TOSS, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("7. ineligible when available space is below the documented minimum (moderate)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SCOOP_TOSS, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
  });

  test("8. ineligible without open_space or a usable wall", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "moderate",
        usableWall: false,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SCOOP_TOSS, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("9. no unintended dependency on floor safety or a partner", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
        floorSafe: false, // never mentioned by this exercise's documentation
        partnerAvailable: false, // never mentioned by this exercise's documentation either
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SCOOP_TOSS, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("10. adding this entry never changes the four previously integrated exercises", () => {
    const chestPassInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_CHEST_PASS, chestPassInput).eligible).toBe(true);

    const slamInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "slam_ball" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SLAM, slamInput).eligible).toBe(true);

    const overheadThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_OVERHEAD_THROW, overheadThrowInput).eligible).toBe(true);

    const rotationalThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_ROTATIONAL_THROW, rotationalThrowInput).eligible).toBe(true);
  });
});

describe("MED_BALL_SHOT_PUT_THROW — Exercise Requirements Model pilot integration", () => {
  test("1. the entry exists in the catalog", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(MED_BALL_SHOT_PUT_THROW);
  });

  test("2. has a unique identifier within the catalog", () => {
    expect(MED_BALL_SHOT_PUT_THROW.id).toBe("med_ball_shot_put_throw");
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent", () => {
    expect(MED_BALL_SHOT_PUT_THROW.requiredEquipment).toEqual([]);
    expect(MED_BALL_SHOT_PUT_THROW.optionalEquipment).toBeUndefined();
    expect(validateRequirementsCoexistenceInvariant(MED_BALL_SHOT_PUT_THROW)).toBeNull();
    expect(validateExerciseRequirementsStructure(MED_BALL_SHOT_PUT_THROW.requirements!)).toEqual([]);
  });

  test("4a. eligible with medicine_ball and open_space (no wall)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: false,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SHOT_PUT_THROW, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("4b. eligible with medicine_ball and a usable wall (no open_space)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SHOT_PUT_THROW, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("5. ineligible without the required equipment (medicine_ball)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "open_space" }], // no medicine_ball
        throwingAllowed: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SHOT_PUT_THROW, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("6. ineligible when throwing is not allowed", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: false,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SHOT_PUT_THROW, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("7. ineligible when available space is below the documented minimum (limited)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "very_limited",
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SHOT_PUT_THROW, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
  });

  test("8. ineligible without open_space or a usable wall", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: false,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SHOT_PUT_THROW, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("9. no unintended dependency on floor safety or a partner", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "limited",
        floorSafe: false, // never mentioned by this exercise's documentation
        partnerAvailable: false, // "train both sides" is not a human-assistance requirement
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_SHOT_PUT_THROW, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("10. adding this entry never changes the five previously integrated exercises", () => {
    const chestPassInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_CHEST_PASS, chestPassInput).eligible).toBe(true);

    const slamInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "slam_ball" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SLAM, slamInput).eligible).toBe(true);

    const overheadThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_OVERHEAD_THROW, overheadThrowInput).eligible).toBe(true);

    const rotationalThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_ROTATIONAL_THROW, rotationalThrowInput).eligible).toBe(true);

    const scoopTossInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SCOOP_TOSS, scoopTossInput).eligible).toBe(true);
  });

  test("11. laterality and movement-pattern fields match the documentation", () => {
    // "Unilateral or Bilateral: Unilateral" (plain, unlike the compound
    // "Unilateral Emphasis with Bilateral Support" phrasing used by
    // med_ball_rotational_throw/med_ball_scoop_toss).
    expect(MED_BALL_SHOT_PUT_THROW.unilateral).toBe(true);
    // Primary Pattern: "Unilateral Horizontal Ballistic Projection" — a
    // throw, with no rotational classification (unlike rotational throw
    // and scoop toss, whose own identity blocks name "Rotational").
    expect(MED_BALL_SHOT_PUT_THROW.movementPatterns).toEqual(["throw"]);
    // Force Vector: "Primary vector: horizontal and forward."
    expect(MED_BALL_SHOT_PUT_THROW.forceVectors).toEqual(["horizontal", "forward"]);
  });
});

describe("MED_BALL_REVERSE_THROW — Exercise Requirements Model pilot integration", () => {
  test("1. the entry exists in the catalog", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(MED_BALL_REVERSE_THROW);
  });

  test("2. has a unique identifier within the catalog", () => {
    expect(MED_BALL_REVERSE_THROW.id).toBe("med_ball_reverse_throw");
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent", () => {
    expect(MED_BALL_REVERSE_THROW.requiredEquipment).toEqual([]);
    expect(MED_BALL_REVERSE_THROW.optionalEquipment).toBeUndefined();
    expect(validateRequirementsCoexistenceInvariant(MED_BALL_REVERSE_THROW)).toBeNull();
    expect(validateExerciseRequirementsStructure(MED_BALL_REVERSE_THROW.requirements!)).toEqual([]);
  });

  test("4. eligible in the single documented configuration (medicine_ball + open_space)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "open",
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_REVERSE_THROW, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("5. ineligible without the required equipment (medicine_ball or open_space)", () => {
    const withoutBall = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "open_space" }], // no medicine_ball
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "open",
      }),
    });
    expect(
      checkExerciseEligibility(MED_BALL_REVERSE_THROW, withoutBall).rejectionReasons.some(
        (r) => r.code === "EQUIPMENT_UNAVAILABLE",
      ),
    ).toBe(true);

    const withoutOpenSpace = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }], // no open_space
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "open",
      }),
    });
    expect(
      checkExerciseEligibility(MED_BALL_REVERSE_THROW, withoutOpenSpace).rejectionReasons.some(
        (r) => r.code === "EQUIPMENT_UNAVAILABLE",
      ),
    ).toBe(true);
  });

  test("6. ineligible when throwing is not allowed", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: false,
        floorSafe: true,
        availableSpace: "open",
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_REVERSE_THROW, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("7. ineligible when available space is below the documented minimum (open)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "large", // one tier below "open"
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_REVERSE_THROW, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
  });

  test("8. no unintended dependency on a wall or a partner", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "open",
        usableWall: false,
        partnerAvailable: false,
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_REVERSE_THROW, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("9. no ad hoc capability tied to the backward/reverse direction — floor safety is the only environment gate beyond throwing_allowed and sufficient_space", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        floorSafe: false, // documented "suitable landing surface" requirement
        availableSpace: "open",
      }),
    });

    const result = checkExerciseEligibility(MED_BALL_REVERSE_THROW, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.length).toBe(1);
    expect(result.rejectionReasons[0].code).toBe("UNSAFE_ENVIRONMENT");
  });

  test("10. adding this entry never changes the six previously integrated exercises", () => {
    const chestPassInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_CHEST_PASS, chestPassInput).eligible).toBe(true);

    const slamInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "slam_ball" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SLAM, slamInput).eligible).toBe(true);

    const overheadThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_OVERHEAD_THROW, overheadThrowInput).eligible).toBe(true);

    const rotationalThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_ROTATIONAL_THROW, rotationalThrowInput).eligible).toBe(true);

    const scoopTossInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SCOOP_TOSS, scoopTossInput).eligible).toBe(true);

    const shotPutThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SHOT_PUT_THROW, shotPutThrowInput).eligible).toBe(true);
  });

  test("11. biomechanical fields match the documentation", () => {
    // "Unilateral or Bilateral: Bilateral"
    expect(MED_BALL_REVERSE_THROW.unilateral).toBe(false);
    // Primary Pattern: "Backward Whole-Body Ballistic Projection" — a
    // throw; the backward direction lives in forceVectors, not here.
    expect(MED_BALL_REVERSE_THROW.movementPatterns).toEqual(["throw"]);
    // Force Vector: "Primary vector: upward and backward."
    expect(MED_BALL_REVERSE_THROW.forceVectors).toEqual(["upward", "backward"]);
    // Complexity: "Moderate"
    expect(MED_BALL_REVERSE_THROW.complexity).toBe("moderate");
    expect(MED_BALL_REVERSE_THROW.minimumTechnicalLevel).toBe(3);
  });

  test("12. never mutates the exercise or the input it is given during evaluation", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "open",
      }),
    });
    const exerciseSnapshot = structuredClone(MED_BALL_REVERSE_THROW);
    const inputSnapshot = structuredClone(input);

    checkExerciseEligibility(MED_BALL_REVERSE_THROW, input);

    expect(MED_BALL_REVERSE_THROW).toEqual(exerciseSnapshot);
    expect(input).toEqual(inputSnapshot);
  });
});

describe("BOX_JUMP — Exercise Requirements Model pilot integration", () => {
  test("1. the entry exists in the catalog", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(BOX_JUMP);
  });

  test("2. has a unique identifier within the catalog", () => {
    expect(BOX_JUMP.id).toBe("box_jump");
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent", () => {
    expect(BOX_JUMP.requiredEquipment).toEqual([]);
    expect(BOX_JUMP.optionalEquipment).toBeUndefined();
    expect(validateRequirementsCoexistenceInvariant(BOX_JUMP)).toBeNull();
    expect(validateExerciseRequirementsStructure(BOX_JUMP.requirements!)).toEqual([]);
  });

  test("4. eligible with a plyometric box, jumping allowed, a safe landing surface and sufficient space", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(BOX_JUMP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("5. ineligible without a plyometric_box", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "box" }], // generic box, not plyometric_box
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(BOX_JUMP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("6. ineligible when jumping is not allowed", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: false,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(BOX_JUMP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("7. ineligible when the landing surface is not safe", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: false,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(BOX_JUMP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("8. ineligible when available space is below the documented minimum (limited)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "very_limited",
      }),
    });

    const result = checkExerciseEligibility(BOX_JUMP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
  });

  test("9. no dependency on throwingAllowed, a wall or a partner", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
        throwingAllowed: false,
        usableWall: false,
        partnerAvailable: false,
      }),
    });

    const result = checkExerciseEligibility(BOX_JUMP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("10. adding this entry never changes the seven previously integrated ballistic exercises", () => {
    const chestPassInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_CHEST_PASS, chestPassInput).eligible).toBe(true);

    const slamInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "slam_ball" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SLAM, slamInput).eligible).toBe(true);

    const overheadThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_OVERHEAD_THROW, overheadThrowInput).eligible).toBe(true);

    const rotationalThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_ROTATIONAL_THROW, rotationalThrowInput).eligible).toBe(true);

    const scoopTossInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SCOOP_TOSS, scoopTossInput).eligible).toBe(true);

    const shotPutThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SHOT_PUT_THROW, shotPutThrowInput).eligible).toBe(true);

    const reverseThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "open",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_REVERSE_THROW, reverseThrowInput).eligible).toBe(true);
  });

  test("11. the default catalog used by runEngine(input) now also contains box_jump", () => {
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(ids).toContain("box_jump");
  });

  test("12. never mutates the exercise or the input it is given during evaluation", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    const exerciseSnapshot = structuredClone(BOX_JUMP);
    const inputSnapshot = structuredClone(input);

    checkExerciseEligibility(BOX_JUMP, input);

    expect(BOX_JUMP).toEqual(exerciseSnapshot);
    expect(input).toEqual(inputSnapshot);
  });
});

describe("DEPTH_JUMP — Exercise Requirements Model pilot integration", () => {
  test("1. the entry exists in the catalog", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(DEPTH_JUMP);
  });

  test("2. has a unique identifier within the catalog", () => {
    expect(DEPTH_JUMP.id).toBe("depth_jump");
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent", () => {
    expect(DEPTH_JUMP.requiredEquipment).toEqual([]);
    expect(DEPTH_JUMP.optionalEquipment).toBeUndefined();
    expect(validateRequirementsCoexistenceInvariant(DEPTH_JUMP)).toBeNull();
    expect(validateExerciseRequirementsStructure(DEPTH_JUMP.requirements!)).toEqual([]);
  });

  test("4. eligible with a plyometric box, jumping allowed, a safe landing surface and sufficient space", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(DEPTH_JUMP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("5. ineligible without a plyometric_box", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "box" }], // generic box, not plyometric_box
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(DEPTH_JUMP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("6. ineligible when jumping is not allowed", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: false,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(DEPTH_JUMP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("7. ineligible when the landing surface is not safe", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: false,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(DEPTH_JUMP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("8. ineligible when available space is below the documented minimum (moderate)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(DEPTH_JUMP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
  });

  test("9. no dependency on throwingAllowed, a wall or a partner", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
        throwingAllowed: false,
        usableWall: false,
        partnerAvailable: false,
      }),
    });

    const result = checkExerciseEligibility(DEPTH_JUMP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("10. adding this entry never changes box_jump or the previously integrated ballistic exercises", () => {
    const boxJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(BOX_JUMP, boxJumpInput).eligible).toBe(true);

    const chestPassInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_CHEST_PASS, chestPassInput).eligible).toBe(true);

    const slamInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "slam_ball" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SLAM, slamInput).eligible).toBe(true);

    const overheadThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_OVERHEAD_THROW, overheadThrowInput).eligible).toBe(true);

    const rotationalThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_ROTATIONAL_THROW, rotationalThrowInput).eligible).toBe(true);

    const scoopTossInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SCOOP_TOSS, scoopTossInput).eligible).toBe(true);

    const shotPutThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SHOT_PUT_THROW, shotPutThrowInput).eligible).toBe(true);

    const reverseThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "open",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_REVERSE_THROW, reverseThrowInput).eligible).toBe(true);
  });

  test("11. the default catalog used by runEngine(input) now also contains depth_jump", () => {
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(ids).toContain("depth_jump");
  });

  test("12. never mutates the exercise or the input it is given during evaluation", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    const exerciseSnapshot = structuredClone(DEPTH_JUMP);
    const inputSnapshot = structuredClone(input);

    checkExerciseEligibility(DEPTH_JUMP, input);

    expect(DEPTH_JUMP).toEqual(exerciseSnapshot);
    expect(input).toEqual(inputSnapshot);
  });

  test("13. biomechanical fields match the canonical documentation", () => {
    expect(DEPTH_JUMP.physicalQualities).toEqual([
      "reactive_strength",
      "rate_of_force_development",
      "deceleration",
      "stability",
    ]);
    expect(DEPTH_JUMP.movementPatterns).toEqual(["jump"]);
    expect(DEPTH_JUMP.forceVectors).toEqual(["vertical"]);
    expect(DEPTH_JUMP.unilateral).toBe(false);
    expect(DEPTH_JUMP.bodyRegionsLoaded).toEqual(["hip", "thigh", "lower_leg"]);
    expect(DEPTH_JUMP.complexity).toBe("high");
    expect(DEPTH_JUMP.minimumTechnicalLevel).toBe(4);
  });
});

describe("COUNTERMOVEMENT_JUMP — Exercise Requirements Model pilot integration", () => {
  test("1. the entry exists in the catalog", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(COUNTERMOVEMENT_JUMP);
  });

  test("2. has a unique identifier within the catalog", () => {
    expect(COUNTERMOVEMENT_JUMP.id).toBe("countermovement_jump");
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent", () => {
    expect(COUNTERMOVEMENT_JUMP.requiredEquipment).toEqual([]);
    expect(COUNTERMOVEMENT_JUMP.optionalEquipment).toBeUndefined();
    expect(validateRequirementsCoexistenceInvariant(COUNTERMOVEMENT_JUMP)).toBeNull();
    expect(validateExerciseRequirementsStructure(COUNTERMOVEMENT_JUMP.requirements!)).toEqual([]);
  });

  test("4. eligible whenever jumping is allowed, with no equipment, surface or space declared", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: false,
        availableSpace: "very_limited",
      }),
    });

    const result = checkExerciseEligibility(COUNTERMOVEMENT_JUMP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("5. ineligible when jumping is not allowed", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: false,
        floorSafe: false,
        availableSpace: "very_limited",
      }),
    });

    const result = checkExerciseEligibility(COUNTERMOVEMENT_JUMP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("6. no dependency on a safe landing surface — unlike BOX_JUMP and DEPTH_JUMP, this fiche documents none", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: false,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(COUNTERMOVEMENT_JUMP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("7. no dependency on available space — this fiche documents no Space Requirements section at all", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "very_limited",
      }),
    });

    const result = checkExerciseEligibility(COUNTERMOVEMENT_JUMP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("8. no dependency on a plyometric box or any other equipment", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(COUNTERMOVEMENT_JUMP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("9. no dependency on throwingAllowed, a wall or a partner", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
        throwingAllowed: false,
        usableWall: false,
        partnerAvailable: false,
      }),
    });

    const result = checkExerciseEligibility(COUNTERMOVEMENT_JUMP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("10. adding this entry never changes box_jump, depth_jump or the previously integrated ballistic exercises", () => {
    const boxJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(BOX_JUMP, boxJumpInput).eligible).toBe(true);

    const depthJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(DEPTH_JUMP, depthJumpInput).eligible).toBe(true);

    const chestPassInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_CHEST_PASS, chestPassInput).eligible).toBe(true);

    const slamInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "slam_ball" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SLAM, slamInput).eligible).toBe(true);

    const overheadThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_OVERHEAD_THROW, overheadThrowInput).eligible).toBe(true);

    const rotationalThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_ROTATIONAL_THROW, rotationalThrowInput).eligible).toBe(true);

    const scoopTossInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SCOOP_TOSS, scoopTossInput).eligible).toBe(true);

    const shotPutThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SHOT_PUT_THROW, shotPutThrowInput).eligible).toBe(true);

    const reverseThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "open",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_REVERSE_THROW, reverseThrowInput).eligible).toBe(true);
  });

  test("11. the default catalog used by runEngine(input) now also contains countermovement_jump", () => {
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(ids).toContain("countermovement_jump");
  });

  test("12. never mutates the exercise or the input it is given during evaluation", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    const exerciseSnapshot = structuredClone(COUNTERMOVEMENT_JUMP);
    const inputSnapshot = structuredClone(input);

    checkExerciseEligibility(COUNTERMOVEMENT_JUMP, input);

    expect(COUNTERMOVEMENT_JUMP).toEqual(exerciseSnapshot);
    expect(input).toEqual(inputSnapshot);
  });

  test("13. biomechanical fields match the canonical documentation (movement_intent is a prescription-layer concept, not tested here)", () => {
    expect(COUNTERMOVEMENT_JUMP.physicalQualities).toEqual([
      "explosive_strength",
      "rate_of_force_development",
      "reactive_strength",
      "coordination",
      "acceleration",
    ]);
    expect(COUNTERMOVEMENT_JUMP.movementPatterns).toEqual(["jump"]);
    expect(COUNTERMOVEMENT_JUMP.forceVectors).toEqual(["vertical"]);
    expect(COUNTERMOVEMENT_JUMP.unilateral).toBe(false);
    expect(COUNTERMOVEMENT_JUMP.bodyRegionsLoaded).toEqual(["hip", "thigh", "lower_leg"]);
    expect(COUNTERMOVEMENT_JUMP.complexity).toBe("low");
    expect(COUNTERMOVEMENT_JUMP.minimumTechnicalLevel).toBe(1);
  });
});

describe("BROAD_JUMP — Exercise Requirements Model pilot integration", () => {
  test("1. the entry exists in the catalog", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(BROAD_JUMP);
  });

  test("2. has a unique identifier within the catalog", () => {
    expect(BROAD_JUMP.id).toBe("broad_jump");
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent", () => {
    expect(BROAD_JUMP.requiredEquipment).toEqual([]);
    expect(BROAD_JUMP.optionalEquipment).toBeUndefined();
    expect(validateRequirementsCoexistenceInvariant(BROAD_JUMP)).toBeNull();
    expect(validateExerciseRequirementsStructure(BROAD_JUMP.requirements!)).toEqual([]);
  });

  test("4. eligible with jumping allowed, a safe landing surface and sufficient space", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(BROAD_JUMP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("5. ineligible when jumping is not allowed", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: false,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(BROAD_JUMP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("6. ineligible when the landing surface is not safe", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: false,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(BROAD_JUMP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("7. ineligible when available space is below the documented minimum (moderate)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(BROAD_JUMP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
  });

  test("8. no dependency on a plyometric box or any other equipment", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(BROAD_JUMP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("9. no dependency on throwingAllowed, a wall or a partner", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
        throwingAllowed: false,
        usableWall: false,
        partnerAvailable: false,
      }),
    });

    const result = checkExerciseEligibility(BROAD_JUMP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("10. adding this entry never changes countermovement_jump or the previously integrated exercises", () => {
    const cmjInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: false,
        availableSpace: "very_limited",
      }),
    });
    expect(checkExerciseEligibility(COUNTERMOVEMENT_JUMP, cmjInput).eligible).toBe(true);

    const boxJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(BOX_JUMP, boxJumpInput).eligible).toBe(true);

    const depthJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(DEPTH_JUMP, depthJumpInput).eligible).toBe(true);

    const chestPassInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_CHEST_PASS, chestPassInput).eligible).toBe(true);

    const slamInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "slam_ball" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SLAM, slamInput).eligible).toBe(true);

    const overheadThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_OVERHEAD_THROW, overheadThrowInput).eligible).toBe(true);

    const rotationalThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_ROTATIONAL_THROW, rotationalThrowInput).eligible).toBe(true);

    const scoopTossInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SCOOP_TOSS, scoopTossInput).eligible).toBe(true);

    const shotPutThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SHOT_PUT_THROW, shotPutThrowInput).eligible).toBe(true);

    const reverseThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "open",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_REVERSE_THROW, reverseThrowInput).eligible).toBe(true);
  });

  test("11. the default catalog used by runEngine(input) now also contains broad_jump", () => {
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(ids).toContain("broad_jump");
  });

  test("12. never mutates the exercise or the input it is given during evaluation", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    const exerciseSnapshot = structuredClone(BROAD_JUMP);
    const inputSnapshot = structuredClone(input);

    checkExerciseEligibility(BROAD_JUMP, input);

    expect(BROAD_JUMP).toEqual(exerciseSnapshot);
    expect(input).toEqual(inputSnapshot);
  });

  test("13. biomechanical fields match the canonical documentation", () => {
    expect(BROAD_JUMP.physicalQualities).toEqual([
      "explosive_strength",
      "rate_of_force_development",
      "stability",
      "deceleration",
      "coordination",
      "trunk_strength",
    ]);
    expect(BROAD_JUMP.movementPatterns).toEqual(["jump"]);
    expect(BROAD_JUMP.forceVectors).toEqual(["horizontal", "vertical"]);
    expect(BROAD_JUMP.unilateral).toBe(false);
    expect(BROAD_JUMP.bodyRegionsLoaded).toEqual(["hip", "thigh", "lower_leg"]);
    expect(BROAD_JUMP.complexity).toBe("moderate");
    expect(BROAD_JUMP.minimumTechnicalLevel).toBe(3);
  });
});

describe("KNEE_JUMP — Exercise Requirements Model pilot integration", () => {
  test("1. the entry exists in the catalog", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(KNEE_JUMP);
  });

  test("2. has a unique identifier within the catalog", () => {
    expect(KNEE_JUMP.id).toBe("knee_jump");
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent", () => {
    expect(KNEE_JUMP.requiredEquipment).toEqual([]);
    expect(KNEE_JUMP.optionalEquipment).toBeUndefined();
    expect(validateRequirementsCoexistenceInvariant(KNEE_JUMP)).toBeNull();
    expect(validateExerciseRequirementsStructure(KNEE_JUMP.requirements!)).toEqual([]);
  });

  test("4. eligible with a knee protection pad, jumping allowed, a safe landing surface and sufficient space", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "knee_protection_pad" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(KNEE_JUMP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("5. ineligible when jumping is not allowed", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "knee_protection_pad" }],
        jumpingAllowed: false,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(KNEE_JUMP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("6. ineligible when the landing surface is not safe", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "knee_protection_pad" }],
        jumpingAllowed: true,
        floorSafe: false,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(KNEE_JUMP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("7. ineligible when available space is below the documented minimum (limited)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "knee_protection_pad" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "very_limited",
      }),
    });

    const result = checkExerciseEligibility(KNEE_JUMP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
  });

  test("8. ineligible without a knee_protection_pad — it is a documented mandatory equipment requirement, not a comfort recommendation", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(KNEE_JUMP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("9. no dependency on a plyometric box, throwing, a wall or a partner", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "knee_protection_pad" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
        throwingAllowed: false,
        usableWall: false,
        partnerAvailable: false,
      }),
    });

    const result = checkExerciseEligibility(KNEE_JUMP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("10. adding this entry never changes the previously integrated exercises", () => {
    const broadJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(BROAD_JUMP, broadJumpInput).eligible).toBe(true);

    const cmjInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: false,
        availableSpace: "very_limited",
      }),
    });
    expect(checkExerciseEligibility(COUNTERMOVEMENT_JUMP, cmjInput).eligible).toBe(true);

    const boxJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(BOX_JUMP, boxJumpInput).eligible).toBe(true);

    const depthJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(DEPTH_JUMP, depthJumpInput).eligible).toBe(true);

    const chestPassInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_CHEST_PASS, chestPassInput).eligible).toBe(true);

    const slamInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "slam_ball" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SLAM, slamInput).eligible).toBe(true);

    const overheadThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_OVERHEAD_THROW, overheadThrowInput).eligible).toBe(true);

    const rotationalThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_ROTATIONAL_THROW, rotationalThrowInput).eligible).toBe(true);

    const scoopTossInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SCOOP_TOSS, scoopTossInput).eligible).toBe(true);

    const shotPutThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SHOT_PUT_THROW, shotPutThrowInput).eligible).toBe(true);

    const reverseThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "open",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_REVERSE_THROW, reverseThrowInput).eligible).toBe(true);
  });

  test("11. the default catalog used by runEngine(input) now also contains knee_jump", () => {
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(ids).toContain("knee_jump");
  });

  test("12. never mutates the exercise or the input it is given during evaluation", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "knee_protection_pad" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    const exerciseSnapshot = structuredClone(KNEE_JUMP);
    const inputSnapshot = structuredClone(input);

    checkExerciseEligibility(KNEE_JUMP, input);

    expect(KNEE_JUMP).toEqual(exerciseSnapshot);
    expect(input).toEqual(inputSnapshot);
  });

  test("13. biomechanical fields match the canonical documentation", () => {
    expect(KNEE_JUMP.physicalQualities).toEqual(["rate_of_force_development", "stability", "trunk_strength", "coordination"]);
    expect(KNEE_JUMP.movementPatterns).toEqual(["jump", "hinge"]);
    expect(KNEE_JUMP.forceVectors).toEqual(["vertical", "forward"]);
    expect(KNEE_JUMP.unilateral).toBe(false);
    expect(KNEE_JUMP.bodyRegionsLoaded).toEqual(["hip", "thigh", "lower_leg"]);
    expect(KNEE_JUMP.complexity).toBe("high");
    expect(KNEE_JUMP.minimumTechnicalLevel).toBe(4);
  });
});

describe("LATERAL_BOUND — Exercise Requirements Model pilot integration", () => {
  test("1. the entry exists in the catalog", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(LATERAL_BOUND);
  });

  test("2. has a unique identifier within the catalog", () => {
    expect(LATERAL_BOUND.id).toBe("lateral_bound");
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent", () => {
    expect(LATERAL_BOUND.requiredEquipment).toEqual([]);
    expect(LATERAL_BOUND.optionalEquipment).toBeUndefined();
    expect(validateRequirementsCoexistenceInvariant(LATERAL_BOUND)).toBeNull();
    expect(validateExerciseRequirementsStructure(LATERAL_BOUND.requirements!)).toEqual([]);
  });

  test("4. eligible with jumping allowed, a safe landing surface and sufficient space", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(LATERAL_BOUND, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("5. ineligible when jumping is not allowed", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: false,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(LATERAL_BOUND, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("6. ineligible when the landing surface is not safe", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: false,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(LATERAL_BOUND, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("7. ineligible when available space is below the documented minimum (moderate)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(LATERAL_BOUND, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
  });

  test("8. no dependency on a plyometric box or any other equipment", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(LATERAL_BOUND, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("9. no dependency on throwingAllowed, a wall or a partner", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
        throwingAllowed: false,
        usableWall: false,
        partnerAvailable: false,
      }),
    });

    const result = checkExerciseEligibility(LATERAL_BOUND, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("10. adding this entry never changes the previously integrated exercises", () => {
    const kneeJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "knee_protection_pad" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(KNEE_JUMP, kneeJumpInput).eligible).toBe(true);

    const broadJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(BROAD_JUMP, broadJumpInput).eligible).toBe(true);

    const cmjInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: false,
        availableSpace: "very_limited",
      }),
    });
    expect(checkExerciseEligibility(COUNTERMOVEMENT_JUMP, cmjInput).eligible).toBe(true);

    const boxJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(BOX_JUMP, boxJumpInput).eligible).toBe(true);

    const depthJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(DEPTH_JUMP, depthJumpInput).eligible).toBe(true);

    const chestPassInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_CHEST_PASS, chestPassInput).eligible).toBe(true);

    const slamInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "slam_ball" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SLAM, slamInput).eligible).toBe(true);

    const overheadThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_OVERHEAD_THROW, overheadThrowInput).eligible).toBe(true);

    const rotationalThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_ROTATIONAL_THROW, rotationalThrowInput).eligible).toBe(true);

    const scoopTossInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SCOOP_TOSS, scoopTossInput).eligible).toBe(true);

    const shotPutThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SHOT_PUT_THROW, shotPutThrowInput).eligible).toBe(true);

    const reverseThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "open",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_REVERSE_THROW, reverseThrowInput).eligible).toBe(true);
  });

  test("11. the default catalog used by runEngine(input) now also contains lateral_bound", () => {
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(ids).toContain("lateral_bound");
  });

  test("12. never mutates the exercise or the input it is given during evaluation", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    const exerciseSnapshot = structuredClone(LATERAL_BOUND);
    const inputSnapshot = structuredClone(input);

    checkExerciseEligibility(LATERAL_BOUND, input);

    expect(LATERAL_BOUND).toEqual(exerciseSnapshot);
    expect(input).toEqual(inputSnapshot);
  });

  test("13. biomechanical fields — including the lateral force vector and unilaterality — match the canonical documentation", () => {
    expect(LATERAL_BOUND.physicalQualities).toEqual([
      "rate_of_force_development",
      "deceleration",
      "stability",
      "balance",
      "agility",
      "coordination",
    ]);
    expect(LATERAL_BOUND.movementPatterns).toEqual(["jump", "hinge"]);
    expect(LATERAL_BOUND.forceVectors).toEqual(["lateral", "vertical"]);
    expect(LATERAL_BOUND.unilateral).toBe(true);
    expect(LATERAL_BOUND.bodyRegionsLoaded).toEqual(["hip", "thigh", "lower_leg"]);
    expect(LATERAL_BOUND.complexity).toBe("moderate");
    expect(LATERAL_BOUND.minimumTechnicalLevel).toBe(3);
  });
});

describe("SINGLE_LEG_HOP — Exercise Requirements Model pilot integration", () => {
  test("1. the entry exists in the catalog", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(SINGLE_LEG_HOP);
  });

  test("2. has a unique identifier within the catalog", () => {
    expect(SINGLE_LEG_HOP.id).toBe("single_leg_hop");
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent", () => {
    expect(SINGLE_LEG_HOP.requiredEquipment).toEqual([]);
    expect(SINGLE_LEG_HOP.optionalEquipment).toBeUndefined();
    expect(validateRequirementsCoexistenceInvariant(SINGLE_LEG_HOP)).toBeNull();
    expect(validateExerciseRequirementsStructure(SINGLE_LEG_HOP.requirements!)).toEqual([]);
  });

  test("4. eligible with jumping allowed, a safe landing surface and sufficient space", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(SINGLE_LEG_HOP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("5. ineligible when jumping is not allowed", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: false,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(SINGLE_LEG_HOP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("6. ineligible when the landing surface is not safe", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: false,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(SINGLE_LEG_HOP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("7. ineligible when available space is below the documented minimum (limited)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "very_limited",
      }),
    });

    const result = checkExerciseEligibility(SINGLE_LEG_HOP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
  });

  test("8. no dependency on a plyometric box or any other equipment", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(SINGLE_LEG_HOP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("9. no dependency on throwingAllowed, a wall or a partner", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
        throwingAllowed: false,
        usableWall: false,
        partnerAvailable: false,
      }),
    });

    const result = checkExerciseEligibility(SINGLE_LEG_HOP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("10. unilaterality and biomechanical fields match the canonical documentation", () => {
    expect(SINGLE_LEG_HOP.unilateral).toBe(true);
    expect(SINGLE_LEG_HOP.physicalQualities).toEqual([
      "rate_of_force_development",
      "reactive_strength",
      "deceleration",
      "stability",
      "balance",
      "agility",
      "coordination",
    ]);
    expect(SINGLE_LEG_HOP.movementPatterns).toEqual(["jump"]);
    expect(SINGLE_LEG_HOP.forceVectors).toEqual(["horizontal", "vertical"]);
    expect(SINGLE_LEG_HOP.bodyRegionsLoaded).toEqual(["hip", "thigh", "lower_leg"]);
    expect(SINGLE_LEG_HOP.complexity).toBe("moderate");
    expect(SINGLE_LEG_HOP.minimumTechnicalLevel).toBe(3);
  });

  test("11. adding this entry never changes the previously integrated exercises", () => {
    const lateralBoundInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(LATERAL_BOUND, lateralBoundInput).eligible).toBe(true);

    const kneeJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "knee_protection_pad" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(KNEE_JUMP, kneeJumpInput).eligible).toBe(true);

    const broadJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(BROAD_JUMP, broadJumpInput).eligible).toBe(true);

    const cmjInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: false,
        availableSpace: "very_limited",
      }),
    });
    expect(checkExerciseEligibility(COUNTERMOVEMENT_JUMP, cmjInput).eligible).toBe(true);

    const boxJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(BOX_JUMP, boxJumpInput).eligible).toBe(true);

    const depthJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(DEPTH_JUMP, depthJumpInput).eligible).toBe(true);

    const chestPassInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_CHEST_PASS, chestPassInput).eligible).toBe(true);

    const slamInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "slam_ball" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SLAM, slamInput).eligible).toBe(true);

    const overheadThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_OVERHEAD_THROW, overheadThrowInput).eligible).toBe(true);

    const rotationalThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_ROTATIONAL_THROW, rotationalThrowInput).eligible).toBe(true);

    const scoopTossInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SCOOP_TOSS, scoopTossInput).eligible).toBe(true);

    const shotPutThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SHOT_PUT_THROW, shotPutThrowInput).eligible).toBe(true);

    const reverseThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "open",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_REVERSE_THROW, reverseThrowInput).eligible).toBe(true);
  });

  test("12. the default catalog used by runEngine(input) now also contains single_leg_hop", () => {
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(ids).toContain("single_leg_hop");
  });

  test("13. never mutates the exercise or the input it is given during evaluation", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    const exerciseSnapshot = structuredClone(SINGLE_LEG_HOP);
    const inputSnapshot = structuredClone(input);

    checkExerciseEligibility(SINGLE_LEG_HOP, input);

    expect(SINGLE_LEG_HOP).toEqual(exerciseSnapshot);
    expect(input).toEqual(inputSnapshot);
  });
});

describe("SPLIT_SQUAT_JUMP — Exercise Requirements Model pilot integration", () => {
  test("1. the entry exists in the catalog", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(SPLIT_SQUAT_JUMP);
  });

  test("2. has a unique identifier within the catalog", () => {
    expect(SPLIT_SQUAT_JUMP.id).toBe("split_squat_jump");
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent", () => {
    expect(SPLIT_SQUAT_JUMP.requiredEquipment).toEqual([]);
    expect(SPLIT_SQUAT_JUMP.optionalEquipment).toBeUndefined();
    expect(validateRequirementsCoexistenceInvariant(SPLIT_SQUAT_JUMP)).toBeNull();
    expect(validateExerciseRequirementsStructure(SPLIT_SQUAT_JUMP.requirements!)).toEqual([]);
  });

  test("4. eligible with jumping allowed, a safe landing surface and sufficient space", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(SPLIT_SQUAT_JUMP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("5. ineligible when jumping is not allowed", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: false,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(SPLIT_SQUAT_JUMP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("6. ineligible when the landing surface is not safe — 'Required Equipment: None' rules out physical implements only, not the Space Requirements' own Surface Requirements (Flat, Stable, Non-slip) and Setup Time's 'sufficient safe landing space' precondition", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: false,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(SPLIT_SQUAT_JUMP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("7. ineligible when available space is below the documented minimum (limited)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "very_limited",
      }),
    });

    const result = checkExerciseEligibility(SPLIT_SQUAT_JUMP, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
  });

  test("8. no dependency on a plyometric box or any other equipment", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(SPLIT_SQUAT_JUMP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("9. no dependency on throwingAllowed, a wall or a partner", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
        throwingAllowed: false,
        usableWall: false,
        partnerAvailable: false,
      }),
    });

    const result = checkExerciseEligibility(SPLIT_SQUAT_JUMP, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("10. biomechanical fields — including bilateral laterality with an alternating staggered stance — match the canonical documentation", () => {
    expect(SPLIT_SQUAT_JUMP.unilateral).toBe(false);
    expect(SPLIT_SQUAT_JUMP.physicalQualities).toEqual([
      "rate_of_force_development",
      "reactive_strength",
      "deceleration",
      "stability",
      "balance",
      "coordination",
    ]);
    expect(SPLIT_SQUAT_JUMP.movementPatterns).toEqual(["jump"]);
    expect(SPLIT_SQUAT_JUMP.forceVectors).toEqual(["vertical"]);
    expect(SPLIT_SQUAT_JUMP.bodyRegionsLoaded).toEqual(["hip", "thigh", "lower_leg"]);
    expect(SPLIT_SQUAT_JUMP.complexity).toBe("high");
    expect(SPLIT_SQUAT_JUMP.minimumTechnicalLevel).toBe(4);
  });

  test("11. adding this entry never changes the previously integrated exercises", () => {
    const singleLegHopInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(SINGLE_LEG_HOP, singleLegHopInput).eligible).toBe(true);

    const lateralBoundInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(LATERAL_BOUND, lateralBoundInput).eligible).toBe(true);

    const kneeJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "knee_protection_pad" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(KNEE_JUMP, kneeJumpInput).eligible).toBe(true);

    const broadJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(BROAD_JUMP, broadJumpInput).eligible).toBe(true);

    const cmjInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: false,
        availableSpace: "very_limited",
      }),
    });
    expect(checkExerciseEligibility(COUNTERMOVEMENT_JUMP, cmjInput).eligible).toBe(true);

    const boxJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(BOX_JUMP, boxJumpInput).eligible).toBe(true);

    const depthJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plyometric_box" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(DEPTH_JUMP, depthJumpInput).eligible).toBe(true);

    const chestPassInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_CHEST_PASS, chestPassInput).eligible).toBe(true);

    const slamInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "slam_ball" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SLAM, slamInput).eligible).toBe(true);

    const overheadThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_OVERHEAD_THROW, overheadThrowInput).eligible).toBe(true);

    const rotationalThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_ROTATIONAL_THROW, rotationalThrowInput).eligible).toBe(true);

    const scoopTossInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SCOOP_TOSS, scoopTossInput).eligible).toBe(true);

    const shotPutThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_SHOT_PUT_THROW, shotPutThrowInput).eligible).toBe(true);

    const reverseThrowInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }, { type: "open_space" }],
        throwingAllowed: true,
        floorSafe: true,
        availableSpace: "open",
      }),
    });
    expect(checkExerciseEligibility(MED_BALL_REVERSE_THROW, reverseThrowInput).eligible).toBe(true);
  });

  test("12. the default catalog used by runEngine(input) now also contains split_squat_jump", () => {
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(ids).toContain("split_squat_jump");
  });

  test("13. never mutates the exercise or the input it is given during evaluation", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    const exerciseSnapshot = structuredClone(SPLIT_SQUAT_JUMP);
    const inputSnapshot = structuredClone(input);

    checkExerciseEligibility(SPLIT_SQUAT_JUMP, input);

    expect(SPLIT_SQUAT_JUMP).toEqual(exerciseSnapshot);
    expect(input).toEqual(inputSnapshot);
  });
});
