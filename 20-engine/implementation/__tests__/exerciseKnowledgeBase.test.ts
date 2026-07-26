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
  AB_WHEEL,
  BOX_JUMP,
  BROAD_JUMP,
  COUNTERMOVEMENT_JUMP,
  DEAD_BUG,
  DEPTH_JUMP,
  DRAGON_FLAG,
  EXERCISE_KNOWLEDGE_BASE,
  FARMER_CARRY,
  FRONT_RACK_CARRY,
  HANG_HIGH_PULL,
  HANG_POWER_CLEAN,
  HANGING_LEG_RAISE,
  HOLLOW_BODY_HOLD,
  JUMP_SHRUG,
  KNEE_JUMP,
  LATERAL_BOUND,
  MED_BALL_CHEST_PASS,
  MED_BALL_OVERHEAD_THROW,
  MED_BALL_REVERSE_THROW,
  MED_BALL_ROTATIONAL_THROW,
  MED_BALL_SCOOP_TOSS,
  MED_BALL_SHOT_PUT_THROW,
  MED_BALL_SLAM,
  OVERHEAD_CARRY,
  PALLOF_PRESS,
  PINCH_CARRY,
  PLATE_PINCH,
  PUSH_PRESS,
  ROPE_CLIMB,
  ROPE_PULL,
  SANDBAG_CARRY,
  SINGLE_LEG_HOP,
  SPLIT_SQUAT_JUMP,
  SUITCASE_CARRY,
  TOWEL_PULL_UP,
  ZERCHER_CARRY,
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

describe("PUSH_PRESS — Exercise Requirements Model pilot integration", () => {
  test("1. the entry exists in the catalog", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(PUSH_PRESS);
  });

  test("2. has a unique identifier within the catalog", () => {
    expect(PUSH_PRESS.id).toBe("push_press");
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent", () => {
    expect(PUSH_PRESS.requiredEquipment).toEqual([]);
    expect(PUSH_PRESS.optionalEquipment).toBeUndefined();
    expect(validateRequirementsCoexistenceInvariant(PUSH_PRESS)).toBeNull();
    expect(validateExerciseRequirementsStructure(PUSH_PRESS.requirements!)).toEqual([]);
  });

  test("4. eligible with a barbell, plates, a rack, a safe floor and sufficient space", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }, { type: "rack" }],
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(PUSH_PRESS, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("5. ineligible without a barbell", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plates" }, { type: "rack" }],
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(PUSH_PRESS, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("6. ineligible without plates", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "rack" }],
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(PUSH_PRESS, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("7. ineligible without a rack", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(PUSH_PRESS, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("8. ineligible when the floor is not safe", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }, { type: "rack" }],
        floorSafe: false,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(PUSH_PRESS, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("9. ineligible when available space is below the documented minimum (moderate)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }, { type: "rack" }],
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(PUSH_PRESS, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
  });

  test("10. no dependency on jumping, throwing, a wall or a partner", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }, { type: "rack" }],
        floorSafe: true,
        availableSpace: "moderate",
        jumpingAllowed: false,
        throwingAllowed: false,
        usableWall: false,
        partnerAvailable: false,
      }),
    });

    const result = checkExerciseEligibility(PUSH_PRESS, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("11. biomechanical fields match the canonical documentation", () => {
    expect(PUSH_PRESS.physicalQualities).toEqual([
      "explosive_strength",
      "rate_of_force_development",
      "trunk_strength",
      "stability",
      "coordination",
    ]);
    expect(PUSH_PRESS.movementPatterns).toEqual(["squat", "vertical_push", "isometric"]);
    expect(PUSH_PRESS.forceVectors).toEqual(["vertical"]);
    expect(PUSH_PRESS.unilateral).toBe(false);
    expect(PUSH_PRESS.bodyRegionsLoaded).toEqual(["thigh", "hip", "shoulder", "upper_arm"]);
    expect(PUSH_PRESS.complexity).toBe("moderate");
    expect(PUSH_PRESS.minimumTechnicalLevel).toBe(3);
  });

  test("12. adding this entry never changes the previously integrated exercises", () => {
    const splitSquatJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(SPLIT_SQUAT_JUMP, splitSquatJumpInput).eligible).toBe(true);

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

  test("13. the default catalog used by runEngine(input) now also contains push_press", () => {
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(ids).toContain("push_press");
  });

  test("14. never mutates the exercise or the input it is given during evaluation", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }, { type: "rack" }],
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    const exerciseSnapshot = structuredClone(PUSH_PRESS);
    const inputSnapshot = structuredClone(input);

    checkExerciseEligibility(PUSH_PRESS, input);

    expect(PUSH_PRESS).toEqual(exerciseSnapshot);
    expect(input).toEqual(inputSnapshot);
  });
});

describe("HANG_HIGH_PULL — Exercise Requirements Model pilot integration", () => {
  test("1. the entry exists in the catalog", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(HANG_HIGH_PULL);
  });

  test("2. has a unique identifier within the catalog", () => {
    expect(HANG_HIGH_PULL.id).toBe("hang_high_pull");
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent", () => {
    expect(HANG_HIGH_PULL.requiredEquipment).toEqual([]);
    expect(HANG_HIGH_PULL.optionalEquipment).toBeUndefined();
    expect(validateRequirementsCoexistenceInvariant(HANG_HIGH_PULL)).toBeNull();
    expect(validateExerciseRequirementsStructure(HANG_HIGH_PULL.requirements!)).toEqual([]);
  });

  test("4. eligible with a barbell, plates and sufficient space", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(HANG_HIGH_PULL, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("5. ineligible without a barbell", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plates" }],
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(HANG_HIGH_PULL, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("6. ineligible without plates", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }],
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(HANG_HIGH_PULL, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("7. ineligible when available space is below the documented minimum (limited)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        availableSpace: "very_limited",
      }),
    });

    const result = checkExerciseEligibility(HANG_HIGH_PULL, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
  });

  test("8. no dependency on a rack, a safe floor, jumping, throwing, a wall or a partner — none are documented for this exercise", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        availableSpace: "limited",
        floorSafe: false,
        jumpingAllowed: false,
        throwingAllowed: false,
        usableWall: false,
        partnerAvailable: false,
      }),
    });

    const result = checkExerciseEligibility(HANG_HIGH_PULL, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("9. biomechanical fields — including the vertical PULL pattern, distinct from PUSH_PRESS's vertical push — match the canonical documentation", () => {
    expect(HANG_HIGH_PULL.physicalQualities).toEqual([
      "explosive_strength",
      "rate_of_force_development",
      "trunk_strength",
      "grip_strength",
      "coordination",
    ]);
    expect(HANG_HIGH_PULL.movementPatterns).toEqual(["hinge", "vertical_pull"]);
    expect(HANG_HIGH_PULL.forceVectors).toEqual(["vertical"]);
    expect(HANG_HIGH_PULL.unilateral).toBe(false);
    expect(HANG_HIGH_PULL.bodyRegionsLoaded).toEqual(["hip", "thigh", "shoulder"]);
    expect(HANG_HIGH_PULL.complexity).toBe("high");
    expect(HANG_HIGH_PULL.minimumTechnicalLevel).toBe(4);
  });

  test("10. adding this entry never changes the previously integrated exercises", () => {
    const pushPressInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }, { type: "rack" }],
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(PUSH_PRESS, pushPressInput).eligible).toBe(true);

    const splitSquatJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(SPLIT_SQUAT_JUMP, splitSquatJumpInput).eligible).toBe(true);

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

  test("11. the default catalog used by runEngine(input) now also contains hang_high_pull", () => {
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(ids).toContain("hang_high_pull");
  });

  test("12. never mutates the exercise or the input it is given during evaluation", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        availableSpace: "limited",
      }),
    });
    const exerciseSnapshot = structuredClone(HANG_HIGH_PULL);
    const inputSnapshot = structuredClone(input);

    checkExerciseEligibility(HANG_HIGH_PULL, input);

    expect(HANG_HIGH_PULL).toEqual(exerciseSnapshot);
    expect(input).toEqual(inputSnapshot);
  });
});

describe("HANG_POWER_CLEAN — Exercise Requirements Model pilot integration", () => {
  test("1. the entry exists in the catalog", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(HANG_POWER_CLEAN);
  });

  test("2. has a unique identifier within the catalog", () => {
    expect(HANG_POWER_CLEAN.id).toBe("hang_power_clean");
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent", () => {
    expect(HANG_POWER_CLEAN.requiredEquipment).toEqual([]);
    expect(HANG_POWER_CLEAN.optionalEquipment).toBeUndefined();
    expect(validateRequirementsCoexistenceInvariant(HANG_POWER_CLEAN)).toBeNull();
    expect(validateExerciseRequirementsStructure(HANG_POWER_CLEAN.requirements!)).toEqual([]);
  });

  test("4. eligible with a barbell, plates and sufficient space", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(HANG_POWER_CLEAN, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("5. ineligible without a barbell", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plates" }],
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(HANG_POWER_CLEAN, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("6. ineligible without plates", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }],
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(HANG_POWER_CLEAN, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("7. ineligible when available space is below the documented minimum (limited)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        availableSpace: "very_limited",
      }),
    });

    const result = checkExerciseEligibility(HANG_POWER_CLEAN, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
  });

  test("8. no dependency on a rack, a safe floor, jumping, throwing, a wall or a partner — none are documented for this exercise", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        availableSpace: "limited",
        floorSafe: false,
        jumpingAllowed: false,
        throwingAllowed: false,
        usableWall: false,
        partnerAvailable: false,
      }),
    });

    const result = checkExerciseEligibility(HANG_POWER_CLEAN, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("9. is correctly distinguished from HANG_HIGH_PULL: same requirements shape, but the catch/receiving phase changes its biomechanical fields", () => {
    // Same equipment/environment requirements shape (both begin from the hang, neither needs a rack or a documented surface)
    expect(HANG_POWER_CLEAN.requirements).toEqual(HANG_HIGH_PULL.requirements);

    // The catch is a squat-received position, not a continued pull
    expect(HANG_POWER_CLEAN.movementPatterns).toContain("squat");
    expect(HANG_POWER_CLEAN.movementPatterns).not.toContain("vertical_pull");
    expect(HANG_HIGH_PULL.movementPatterns).toContain("vertical_pull");
    expect(HANG_HIGH_PULL.movementPatterns).not.toContain("squat");

    // Only the catch-bearing exercise earns receiving-related qualities
    expect(HANG_POWER_CLEAN.physicalQualities).toContain("reactive_strength");
    expect(HANG_POWER_CLEAN.physicalQualities).toContain("deceleration");
    expect(HANG_POWER_CLEAN.physicalQualities).toContain("stability");
    expect(HANG_HIGH_PULL.physicalQualities).not.toContain("reactive_strength");
    expect(HANG_HIGH_PULL.physicalQualities).not.toContain("deceleration");
    expect(HANG_HIGH_PULL.physicalQualities).not.toContain("stability");

    // The documented receiving skill makes this the more complex exercise
    expect(HANG_POWER_CLEAN.complexity).toBe("very_high");
    expect(HANG_HIGH_PULL.complexity).toBe("high");
    expect(HANG_POWER_CLEAN.minimumTechnicalLevel).toBeGreaterThan(HANG_HIGH_PULL.minimumTechnicalLevel);
  });

  test("10. biomechanical fields match the canonical documentation", () => {
    expect(HANG_POWER_CLEAN.physicalQualities).toEqual([
      "explosive_strength",
      "rate_of_force_development",
      "reactive_strength",
      "deceleration",
      "stability",
      "trunk_strength",
      "grip_strength",
      "coordination",
    ]);
    expect(HANG_POWER_CLEAN.movementPatterns).toEqual(["hinge", "squat"]);
    expect(HANG_POWER_CLEAN.forceVectors).toEqual(["vertical"]);
    expect(HANG_POWER_CLEAN.unilateral).toBe(false);
    expect(HANG_POWER_CLEAN.bodyRegionsLoaded).toEqual(["hip", "thigh", "shoulder"]);
    expect(HANG_POWER_CLEAN.complexity).toBe("very_high");
    expect(HANG_POWER_CLEAN.minimumTechnicalLevel).toBe(5);
  });

  test("11. adding this entry never changes the previously integrated exercises", () => {
    const hangHighPullInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(HANG_HIGH_PULL, hangHighPullInput).eligible).toBe(true);

    const pushPressInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }, { type: "rack" }],
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(PUSH_PRESS, pushPressInput).eligible).toBe(true);

    const splitSquatJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(SPLIT_SQUAT_JUMP, splitSquatJumpInput).eligible).toBe(true);

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

  test("12. the default catalog used by runEngine(input) now also contains hang_power_clean", () => {
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(ids).toContain("hang_power_clean");
  });

  test("13. never mutates the exercise or the input it is given during evaluation", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        availableSpace: "limited",
      }),
    });
    const exerciseSnapshot = structuredClone(HANG_POWER_CLEAN);
    const inputSnapshot = structuredClone(input);

    checkExerciseEligibility(HANG_POWER_CLEAN, input);

    expect(HANG_POWER_CLEAN).toEqual(exerciseSnapshot);
    expect(input).toEqual(inputSnapshot);
  });
});

describe("JUMP_SHRUG — Exercise Requirements Model pilot integration", () => {
  test("1. the entry exists in the catalog", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(JUMP_SHRUG);
  });

  test("2. has a unique identifier within the catalog", () => {
    expect(JUMP_SHRUG.id).toBe("jump_shrug");
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent", () => {
    expect(JUMP_SHRUG.requiredEquipment).toEqual([]);
    expect(JUMP_SHRUG.optionalEquipment).toBeUndefined();
    expect(validateRequirementsCoexistenceInvariant(JUMP_SHRUG)).toBeNull();
    expect(validateExerciseRequirementsStructure(JUMP_SHRUG.requirements!)).toEqual([]);
  });

  test("4. eligible with a barbell, plates, jumping allowed, a safe landing surface and sufficient space", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(JUMP_SHRUG, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("5. ineligible without a barbell", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "plates" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(JUMP_SHRUG, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("6. ineligible without plates", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(JUMP_SHRUG, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
  });

  test("7. ineligible when jumping is not allowed", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        jumpingAllowed: false,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(JUMP_SHRUG, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("8. ineligible when the landing surface is not safe", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        jumpingAllowed: true,
        floorSafe: false,
        availableSpace: "moderate",
      }),
    });

    const result = checkExerciseEligibility(JUMP_SHRUG, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
  });

  test("9. ineligible when available space is below the documented minimum (moderate)", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });

    const result = checkExerciseEligibility(JUMP_SHRUG, input);

    expect(result.eligible).toBe(false);
    expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
  });

  test("10. no dependency on a rack, throwing, a wall or a partner — none are documented for this exercise", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
        throwingAllowed: false,
        usableWall: false,
        partnerAvailable: false,
      }),
    });

    const result = checkExerciseEligibility(JUMP_SHRUG, input);

    expect(result.eligible).toBe(true);
    expect(result.rejectionReasons).toEqual([]);
  });

  test("11. is correctly distinguished from HANG_HIGH_PULL and HANG_POWER_CLEAN: only the genuinely jumping exercise requires jumping_allowed and a safe landing surface", () => {
    // Only JUMP_SHRUG has a real flight phase, so only it requires jumping_allowed / safe_landing_surface
    expect(JUMP_SHRUG.movementPatterns).toContain("jump");
    expect(HANG_HIGH_PULL.movementPatterns).not.toContain("jump");
    expect(HANG_POWER_CLEAN.movementPatterns).not.toContain("jump");

    const jumpingBlockedInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        jumpingAllowed: false,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(JUMP_SHRUG, jumpingBlockedInput).eligible).toBe(false);
    expect(checkExerciseEligibility(HANG_HIGH_PULL, jumpingBlockedInput).eligible).toBe(true);
    expect(checkExerciseEligibility(HANG_POWER_CLEAN, jumpingBlockedInput).eligible).toBe(true);

    // JUMP_SHRUG continues the pull (like HANG_HIGH_PULL) but never receives a catch (unlike HANG_POWER_CLEAN)
    expect(JUMP_SHRUG.movementPatterns).toContain("vertical_pull");
    expect(HANG_POWER_CLEAN.movementPatterns).not.toContain("vertical_pull");
    expect(JUMP_SHRUG.movementPatterns).not.toContain("squat");
    expect(HANG_POWER_CLEAN.movementPatterns).toContain("squat");

    // Documented complexity ordering: Jump Shrug < Hang High Pull < Hang Power Clean
    expect(JUMP_SHRUG.minimumTechnicalLevel).toBeLessThan(HANG_HIGH_PULL.minimumTechnicalLevel);
    expect(HANG_HIGH_PULL.minimumTechnicalLevel).toBeLessThan(HANG_POWER_CLEAN.minimumTechnicalLevel);
  });

  test("12. biomechanical fields match the canonical documentation", () => {
    expect(JUMP_SHRUG.physicalQualities).toEqual([
      "explosive_strength",
      "rate_of_force_development",
      "stability",
      "trunk_strength",
      "grip_strength",
      "coordination",
    ]);
    expect(JUMP_SHRUG.movementPatterns).toEqual(["hinge", "vertical_pull", "jump"]);
    expect(JUMP_SHRUG.forceVectors).toEqual(["vertical"]);
    expect(JUMP_SHRUG.unilateral).toBe(false);
    expect(JUMP_SHRUG.bodyRegionsLoaded).toEqual(["hip", "thigh", "lower_leg", "shoulder"]);
    expect(JUMP_SHRUG.complexity).toBe("moderate");
    expect(JUMP_SHRUG.minimumTechnicalLevel).toBe(3);
  });

  test("13. adding this entry never changes the previously integrated exercises", () => {
    const hangPowerCleanInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(HANG_POWER_CLEAN, hangPowerCleanInput).eligible).toBe(true);

    const hangHighPullInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(HANG_HIGH_PULL, hangHighPullInput).eligible).toBe(true);

    const pushPressInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }, { type: "rack" }],
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(PUSH_PRESS, pushPressInput).eligible).toBe(true);

    const splitSquatJumpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(SPLIT_SQUAT_JUMP, splitSquatJumpInput).eligible).toBe(true);

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

  test("14. the default catalog used by runEngine(input) now also contains jump_shrug", () => {
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(ids).toContain("jump_shrug");
  });

  test("15. never mutates the exercise or the input it is given during evaluation", () => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    const exerciseSnapshot = structuredClone(JUMP_SHRUG);
    const inputSnapshot = structuredClone(input);

    checkExerciseEligibility(JUMP_SHRUG, input);

    expect(JUMP_SHRUG).toEqual(exerciseSnapshot);
    expect(input).toEqual(inputSnapshot);
  });
});

/**
 * `65_GRIP` chapter — Exercise Requirements Model batch integration
 * (`towel_pull_up`, `plate_pinch`, `pinch_carry`, `rope_climb`,
 * `rope_pull`).
 *
 * Structured as a `test.each` table over the five exercises for the
 * cross-cutting checks every entry in this catalog must satisfy
 * (catalog presence, unique id, coexistence invariant, no mutation),
 * followed by one describe block per exercise for its own
 * eligibility-specific scenarios (valid configuration, missing equipment,
 * insufficient environment, absence of undocumented dependencies,
 * biomechanical field conformance) — this avoids restating the same five
 * assertions five times over while still giving each exercise's own
 * requirements model direct, individual coverage. Dedicated distinction
 * tests close the block: `plate_pinch` vs. `pinch_carry`, and
 * `rope_climb` vs. `rope_pull`.
 */
describe("65_GRIP chapter — Exercise Requirements Model batch integration", () => {
  const GRIP_EXERCISES = [
    { exercise: TOWEL_PULL_UP, id: "towel_pull_up" },
    { exercise: PLATE_PINCH, id: "plate_pinch" },
    { exercise: PINCH_CARRY, id: "pinch_carry" },
    { exercise: ROPE_CLIMB, id: "rope_climb" },
    { exercise: ROPE_PULL, id: "rope_pull" },
  ] as const;

  test.each(GRIP_EXERCISES)("$id — 1. exists in the catalog with the expected id", ({ exercise, id }) => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(exercise);
    expect(exercise.id).toBe(id);
  });

  test("2. all five ids are unique within the catalog", () => {
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const { id } of GRIP_EXERCISES) {
      expect(ids.filter((existingId) => existingId === id)).toHaveLength(1);
    }
  });

  test.each(GRIP_EXERCISES)(
    "$id — 3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent",
    ({ exercise }) => {
      expect(exercise.requiredEquipment).toEqual([]);
      expect(exercise.optionalEquipment).toBeUndefined();
      expect(validateRequirementsCoexistenceInvariant(exercise)).toBeNull();
      expect(validateExerciseRequirementsStructure(exercise.requirements!)).toEqual([]);
    },
  );

  test("4. the default catalog used by runEngine(input) now also contains all five 65_GRIP ids", () => {
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    for (const { id } of GRIP_EXERCISES) {
      expect(ids).toContain(id);
    }
  });

  test.each(GRIP_EXERCISES)("$id — 5. never mutates the exercise or the input it is given during evaluation", ({ exercise }) => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [
          { type: "pull_up_bar" },
          { type: "towel" },
          { type: "plates" },
          { type: "pinch_grip_implement" },
          { type: "rope" },
        ],
        floorSafe: true,
        availableSpace: "large",
      }),
    });
    const exerciseSnapshot = structuredClone(exercise);
    const inputSnapshot = structuredClone(input);

    checkExerciseEligibility(exercise, input);

    expect(exercise).toEqual(exerciseSnapshot);
    expect(input).toEqual(inputSnapshot);
  });

  describe("TOWEL_PULL_UP", () => {
    test("6. eligible with a pull-up bar, a towel and minimal space", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "pull_up_bar" }, { type: "towel" }],
          availableSpace: "very_limited",
        }),
      });

      const result = checkExerciseEligibility(TOWEL_PULL_UP, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("7. ineligible without a pull-up bar", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "towel" }],
          availableSpace: "very_limited",
        }),
      });

      const result = checkExerciseEligibility(TOWEL_PULL_UP, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    });

    test("8. ineligible without a towel", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "pull_up_bar" }],
          availableSpace: "very_limited",
        }),
      });

      const result = checkExerciseEligibility(TOWEL_PULL_UP, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    });

    test("9. no dependency on floor safety, throwing, a wall or a partner — none are documented for this exercise", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "pull_up_bar" }, { type: "towel" }],
          availableSpace: "very_limited",
          floorSafe: false,
          throwingAllowed: false,
          usableWall: false,
          partnerAvailable: false,
        }),
      });

      const result = checkExerciseEligibility(TOWEL_PULL_UP, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("10. biomechanical fields match the canonical documentation", () => {
      expect(TOWEL_PULL_UP.physicalQualities).toEqual(["grip_strength", "relative_strength", "stability"]);
      expect(TOWEL_PULL_UP.movementPatterns).toEqual(["vertical_pull", "isometric"]);
      expect(TOWEL_PULL_UP.forceVectors).toEqual(["vertical"]);
      expect(TOWEL_PULL_UP.unilateral).toBe(false);
      expect(TOWEL_PULL_UP.bodyRegionsLoaded).toEqual(["shoulder", "upper_arm", "forearm", "hand"]);
      expect(TOWEL_PULL_UP.complexity).toBe("moderate");
      expect(TOWEL_PULL_UP.minimumTechnicalLevel).toBe(3);
    });
  });

  describe("PLATE_PINCH", () => {
    test("11. eligible with weight plates and minimal space", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "plates" }],
          availableSpace: "very_limited",
        }),
      });

      const result = checkExerciseEligibility(PLATE_PINCH, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("12. ineligible without weight plates", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "bodyweight" }],
          availableSpace: "very_limited",
        }),
      });

      const result = checkExerciseEligibility(PLATE_PINCH, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    });

    test("13. no dependency on floor safety, jumping, throwing, a wall or a partner — none are documented for this exercise", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "plates" }],
          availableSpace: "very_limited",
          floorSafe: false,
          jumpingAllowed: false,
          throwingAllowed: false,
          usableWall: false,
          partnerAvailable: false,
        }),
      });

      const result = checkExerciseEligibility(PLATE_PINCH, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("14. biomechanical fields match the canonical documentation", () => {
      expect(PLATE_PINCH.physicalQualities).toEqual(["grip_strength", "stability", "tissue_capacity"]);
      expect(PLATE_PINCH.movementPatterns).toEqual(["isometric"]);
      expect(PLATE_PINCH.forceVectors).toEqual(["not_applicable"]);
      expect(PLATE_PINCH.unilateral).toBe(false);
      expect(PLATE_PINCH.bodyRegionsLoaded).toEqual(["hand", "forearm"]);
      expect(PLATE_PINCH.complexity).toBe("low");
      expect(PLATE_PINCH.minimumTechnicalLevel).toBe(1);
    });
  });

  describe("PINCH_CARRY", () => {
    test("15. eligible with a pinch-grip implement and large space", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "pinch_grip_implement" }],
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(PINCH_CARRY, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("16. ineligible without a pinch-grip implement", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "bodyweight" }],
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(PINCH_CARRY, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    });

    test("17. ineligible when available space is below the documented minimum (large)", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "pinch_grip_implement" }],
          availableSpace: "moderate",
        }),
      });

      const result = checkExerciseEligibility(PINCH_CARRY, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
    });

    test("18. no dependency on floor safety, throwing, a wall or a partner — none are documented for this exercise", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "pinch_grip_implement" }],
          availableSpace: "large",
          floorSafe: false,
          throwingAllowed: false,
          usableWall: false,
          partnerAvailable: false,
        }),
      });

      const result = checkExerciseEligibility(PINCH_CARRY, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("19. biomechanical fields match the canonical documentation", () => {
      expect(PINCH_CARRY.physicalQualities).toEqual(["grip_strength", "stability", "trunk_strength"]);
      expect(PINCH_CARRY.movementPatterns).toEqual(["carry", "isometric"]);
      expect(PINCH_CARRY.forceVectors).toEqual(["horizontal"]);
      expect(PINCH_CARRY.unilateral).toBe(false);
      expect(PINCH_CARRY.bodyRegionsLoaded).toEqual(["hand", "forearm"]);
      expect(PINCH_CARRY.complexity).toBe("moderate");
      expect(PINCH_CARRY.minimumTechnicalLevel).toBe(2);
    });
  });

  describe("ROPE_CLIMB", () => {
    test("20. eligible with a rope, a safe landing surface and large space", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "rope" }],
          floorSafe: true,
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(ROPE_CLIMB, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("21. ineligible without a rope", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "bodyweight" }],
          floorSafe: true,
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(ROPE_CLIMB, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    });

    test("22. ineligible when the landing surface is not safe", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "rope" }],
          floorSafe: false,
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(ROPE_CLIMB, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
    });

    test("23. ineligible when available space is below the documented minimum (large)", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "rope" }],
          floorSafe: true,
          availableSpace: "moderate",
        }),
      });

      const result = checkExerciseEligibility(ROPE_CLIMB, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
    });

    test("24. no dependency on jumping, throwing, a wall or a partner — none are documented for this exercise", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "rope" }],
          floorSafe: true,
          availableSpace: "large",
          jumpingAllowed: false,
          throwingAllowed: false,
          usableWall: false,
          partnerAvailable: false,
        }),
      });

      const result = checkExerciseEligibility(ROPE_CLIMB, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("25. biomechanical fields match the canonical documentation", () => {
      expect(ROPE_CLIMB.physicalQualities).toEqual([
        "grip_strength",
        "relative_strength",
        "coordination",
        "stability",
        "trunk_strength",
      ]);
      expect(ROPE_CLIMB.movementPatterns).toEqual(["vertical_pull", "isometric", "locomotion"]);
      expect(ROPE_CLIMB.forceVectors).toEqual(["vertical"]);
      expect(ROPE_CLIMB.unilateral).toBe(false);
      expect(ROPE_CLIMB.bodyRegionsLoaded).toEqual(["shoulder", "upper_arm", "forearm", "hand"]);
      expect(ROPE_CLIMB.complexity).toBe("high");
      expect(ROPE_CLIMB.minimumTechnicalLevel).toBe(4);
    });
  });

  describe("ROPE_PULL", () => {
    test("26. eligible with a rope and large space", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "rope" }],
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(ROPE_PULL, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("27. ineligible without a rope", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "bodyweight" }],
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(ROPE_PULL, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    });

    test("28. ineligible when available space is below the documented minimum (large)", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "rope" }],
          availableSpace: "moderate",
        }),
      });

      const result = checkExerciseEligibility(ROPE_PULL, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
    });

    test("29. no dependency on floor safety, jumping, throwing, a wall or a partner — unlike ROPE_CLIMB, no safe landing surface is documented", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "rope" }],
          availableSpace: "large",
          floorSafe: false,
          jumpingAllowed: false,
          throwingAllowed: false,
          usableWall: false,
          partnerAvailable: false,
        }),
      });

      const result = checkExerciseEligibility(ROPE_PULL, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("30. biomechanical fields match the canonical documentation", () => {
      expect(ROPE_PULL.physicalQualities).toEqual(["grip_strength", "stability", "trunk_strength", "general_work_capacity"]);
      expect(ROPE_PULL.movementPatterns).toEqual(["horizontal_pull", "vertical_pull"]);
      expect(ROPE_PULL.forceVectors).toEqual(["horizontal", "vertical"]);
      expect(ROPE_PULL.unilateral).toBe(false);
      expect(ROPE_PULL.bodyRegionsLoaded).toEqual(["shoulder", "upper_arm", "forearm", "hand"]);
      expect(ROPE_PULL.complexity).toBe("moderate");
      expect(ROPE_PULL.minimumTechnicalLevel).toBe(3);
    });
  });

  describe("business distinctions", () => {
    test("31. PLATE_PINCH vs. PINCH_CARRY: distinct equipment (plates vs. pinch_grip_implement), distinct space footprint, and a static hold vs. a loaded carry", () => {
      // Equipment: "Weight Plates" only (PLATE_PINCH) vs. "Weight Plates or Pinch Blocks" (PINCH_CARRY)
      expect(PLATE_PINCH.requirements!.required[0].items).toContainEqual({ kind: "equipment", equipment: "plates" });
      expect(PINCH_CARRY.requirements!.required[0].items).toContainEqual({
        kind: "equipment",
        equipment: "pinch_grip_implement",
      });
      expect(PLATE_PINCH.requirements!.required[0].items).not.toContainEqual({
        kind: "equipment",
        equipment: "pinch_grip_implement",
      });
      expect(PINCH_CARRY.requirements!.required[0].items).not.toContainEqual({ kind: "equipment", equipment: "plates" });

      // A pinch implement alone is not documented to satisfy PLATE_PINCH's specific "Weight Plates" requirement
      const pinchImplementOnlyInput = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "pinch_grip_implement" }],
          availableSpace: "large",
        }),
      });
      expect(checkExerciseEligibility(PLATE_PINCH, pinchImplementOnlyInput).eligible).toBe(false);

      // PINCH_CARRY documents a 10-40 metre carry distance and needs "large" space; PLATE_PINCH is a stationary hold needing only "very_limited" space
      const plateInLimitedSpaceInput = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "plates" }],
          availableSpace: "very_limited",
        }),
      });
      expect(checkExerciseEligibility(PLATE_PINCH, plateInLimitedSpaceInput).eligible).toBe(true);

      const pinchCarryInLimitedSpaceInput = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "pinch_grip_implement" }],
          availableSpace: "very_limited",
        }),
      });
      expect(checkExerciseEligibility(PINCH_CARRY, pinchCarryInLimitedSpaceInput).eligible).toBe(false);

      // Static hold (isometric only) vs. loaded carry (carry + isometric)
      expect(PLATE_PINCH.movementPatterns).toEqual(["isometric"]);
      expect(PINCH_CARRY.movementPatterns).toContain("carry");
      expect(PLATE_PINCH.forceVectors).toEqual(["not_applicable"]);
      expect(PINCH_CARRY.forceVectors).not.toEqual(["not_applicable"]);
    });

    test("32. ROPE_CLIMB vs. ROPE_PULL: ROPE_CLIMB alone requires a safe landing surface, and their movement patterns are not copied from one another", () => {
      const ropeOnlyInput = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "rope" }],
          floorSafe: false,
          availableSpace: "large",
        }),
      });

      // ROPE_CLIMB has a genuine descent/fall risk from height and requires safe_landing_surface;
      // ROPE_PULL keeps floor contact throughout and does not.
      expect(checkExerciseEligibility(ROPE_CLIMB, ropeOnlyInput).eligible).toBe(false);
      expect(
        checkExerciseEligibility(ROPE_CLIMB, ropeOnlyInput).rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT"),
      ).toBe(true);
      expect(checkExerciseEligibility(ROPE_PULL, ropeOnlyInput).eligible).toBe(true);

      // ROPE_CLIMB is a vertical pull with an isometric grip and a locomotion component (climbing);
      // ROPE_PULL is a horizontal-or-vertical pull with repeated (non-isometric) grip — not a copy of ROPE_CLIMB's own patterns.
      expect(ROPE_CLIMB.movementPatterns).toEqual(["vertical_pull", "isometric", "locomotion"]);
      expect(ROPE_PULL.movementPatterns).toEqual(["horizontal_pull", "vertical_pull"]);
      expect(ROPE_PULL.movementPatterns).not.toContain("isometric");
      expect(ROPE_PULL.movementPatterns).not.toContain("locomotion");
      expect(ROPE_CLIMB.movementPatterns).not.toContain("horizontal_pull");

      // Documented complexity ordering: Rope Pull (Moderate) < Rope Climb (High)
      expect(ROPE_PULL.minimumTechnicalLevel).toBeLessThan(ROPE_CLIMB.minimumTechnicalLevel);
      expect(ROPE_PULL.complexity).toBe("moderate");
      expect(ROPE_CLIMB.complexity).toBe("high");
    });
  });

  test("33. adding this chapter never changes the previously integrated exercises", () => {
    const jumpShrugInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(JUMP_SHRUG, jumpShrugInput).eligible).toBe(true);

    const hangPowerCleanInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(HANG_POWER_CLEAN, hangPowerCleanInput).eligible).toBe(true);

    const pushPressInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }, { type: "rack" }],
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(PUSH_PRESS, pushPressInput).eligible).toBe(true);

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
  });
});

/**
 * `66_CARRIES` chapter — Exercise Requirements Model batch integration
 * (`farmer_carry`, `front_rack_carry`, `sandbag_carry`, `zercher_carry`).
 *
 * Same `test.each`-driven structure as the `65_GRIP` chapter's own batch
 * block: cross-cutting checks parameterized over all four exercises, then
 * one describe block per exercise for its own eligibility-specific
 * scenarios, then dedicated business-distinction tests. `FARMER_CARRY` and
 * `FRONT_RACK_CARRY` use `any_of` equipment clauses (multiple genuinely
 * equivalent implements) — the eligible-configuration tests below exercise
 * more than one alternative to confirm the `any_of` semantics genuinely
 * work end to end, not just with a single hard-coded implement.
 */
describe("66_CARRIES chapter — Exercise Requirements Model batch integration", () => {
  const CARRIES_EXERCISES = [
    { exercise: FARMER_CARRY, id: "farmer_carry" },
    { exercise: FRONT_RACK_CARRY, id: "front_rack_carry" },
    { exercise: SANDBAG_CARRY, id: "sandbag_carry" },
    { exercise: ZERCHER_CARRY, id: "zercher_carry" },
  ] as const;

  test.each(CARRIES_EXERCISES)("$id — 1. exists in the catalog with the expected id", ({ exercise, id }) => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(exercise);
    expect(exercise.id).toBe(id);
  });

  test("2. all four ids are unique within the catalog, and farmer_carry appears only once", () => {
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const { id } of CARRIES_EXERCISES) {
      expect(ids.filter((existingId) => existingId === id)).toHaveLength(1);
    }
    expect(ids.filter((existingId) => existingId === "farmer_carry")).toEqual(["farmer_carry"]);
  });

  test.each(CARRIES_EXERCISES)(
    "$id — 3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent",
    ({ exercise }) => {
      expect(exercise.requiredEquipment).toEqual([]);
      expect(exercise.optionalEquipment).toBeUndefined();
      expect(validateRequirementsCoexistenceInvariant(exercise)).toBeNull();
      expect(validateExerciseRequirementsStructure(exercise.requirements!)).toEqual([]);
    },
  );

  test("4. the default catalog used by runEngine(input) now also contains all four 66_CARRIES ids", () => {
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    for (const { id } of CARRIES_EXERCISES) {
      expect(ids).toContain(id);
    }
  });

  test.each(CARRIES_EXERCISES)("$id — 5. never mutates the exercise or the input it is given during evaluation", ({ exercise }) => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [
          { type: "dumbbell" },
          { type: "kettlebell" },
          { type: "farmer_handle" },
          { type: "trap_bar" },
          { type: "barbell" },
          { type: "sandbag" },
        ],
        availableSpace: "large",
      }),
    });
    const exerciseSnapshot = structuredClone(exercise);
    const inputSnapshot = structuredClone(input);

    checkExerciseEligibility(exercise, input);

    expect(exercise).toEqual(exerciseSnapshot);
    expect(input).toEqual(inputSnapshot);
  });

  describe("FARMER_CARRY", () => {
    test("6. eligible with a dumbbell alone (one of four any_of alternatives) and large space", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "dumbbell" }],
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(FARMER_CARRY, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("7. eligible with farmer handles alone (a different any_of alternative) and large space", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "farmer_handle" }],
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(FARMER_CARRY, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("8. ineligible without any documented implement (dumbbell, kettlebell, farmer handle or trap bar)", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "bodyweight" }],
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(FARMER_CARRY, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    });

    test("9. ineligible when available space is below the documented minimum (large)", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "dumbbell" }],
          availableSpace: "moderate",
        }),
      });

      const result = checkExerciseEligibility(FARMER_CARRY, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
    });

    test("10. no dependency on floor safety, jumping, throwing, a wall or a partner — none are documented for this exercise", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "dumbbell" }],
          availableSpace: "large",
          floorSafe: false,
          jumpingAllowed: false,
          throwingAllowed: false,
          usableWall: false,
          partnerAvailable: false,
        }),
      });

      const result = checkExerciseEligibility(FARMER_CARRY, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("11. biomechanical fields match the canonical documentation", () => {
      expect(FARMER_CARRY.physicalQualities).toEqual([
        "grip_strength",
        "trunk_strength",
        "stability",
        "coordination",
        "general_work_capacity",
        "tissue_capacity",
      ]);
      expect(FARMER_CARRY.movementPatterns).toEqual(["carry", "isometric"]);
      expect(FARMER_CARRY.forceVectors).toEqual(["horizontal"]);
      expect(FARMER_CARRY.unilateral).toBe(false);
      expect(FARMER_CARRY.bodyRegionsLoaded).toEqual(["hand", "forearm", "shoulder", "abdomen", "hip", "thigh"]);
      expect(FARMER_CARRY.complexity).toBe("low");
      expect(FARMER_CARRY.minimumTechnicalLevel).toBe(1);
    });
  });

  describe("FRONT_RACK_CARRY", () => {
    test("12. eligible with a barbell alone (one of four any_of alternatives) and large space", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "barbell" }],
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(FRONT_RACK_CARRY, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("13. ineligible without any documented implement (kettlebell, dumbbell, barbell or sandbag)", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "bodyweight" }],
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(FRONT_RACK_CARRY, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    });

    test("14. ineligible when available space is below the documented minimum (large)", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "kettlebell" }],
          availableSpace: "moderate",
        }),
      });

      const result = checkExerciseEligibility(FRONT_RACK_CARRY, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
    });

    test("15. no dependency on floor safety, jumping, throwing, a wall, a partner or a squat rack — none are documented for this exercise", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "kettlebell" }],
          availableSpace: "large",
          floorSafe: false,
          jumpingAllowed: false,
          throwingAllowed: false,
          usableWall: false,
          partnerAvailable: false,
        }),
      });

      const result = checkExerciseEligibility(FRONT_RACK_CARRY, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("16. never requires the rack EquipmentType — the front-rack position is anatomical, not equipment", () => {
      const requiredEquipmentTypes = FRONT_RACK_CARRY.requirements!.required
        .flatMap((clause) => clause.items)
        .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
        .map((atom) => atom.equipment);

      expect(requiredEquipmentTypes).not.toContain("rack");
      expect(requiredEquipmentTypes).toEqual(["kettlebell", "dumbbell", "barbell", "sandbag"]);
    });

    test("17. biomechanical fields match the canonical documentation", () => {
      expect(FRONT_RACK_CARRY.physicalQualities).toEqual(["trunk_strength", "stability", "coordination", "muscular_endurance"]);
      expect(FRONT_RACK_CARRY.movementPatterns).toEqual(["carry", "isometric"]);
      expect(FRONT_RACK_CARRY.forceVectors).toEqual(["horizontal"]);
      expect(FRONT_RACK_CARRY.unilateral).toBe(false);
      expect(FRONT_RACK_CARRY.bodyRegionsLoaded).toEqual(["shoulder", "abdomen", "hip", "thigh"]);
      expect(FRONT_RACK_CARRY.complexity).toBe("moderate");
      expect(FRONT_RACK_CARRY.minimumTechnicalLevel).toBe(3);
    });
  });

  describe("SANDBAG_CARRY", () => {
    test("18. eligible with a sandbag and large space", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "sandbag" }],
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(SANDBAG_CARRY, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("19. ineligible without a sandbag", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "dumbbell" }],
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(SANDBAG_CARRY, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    });

    test("20. ineligible when available space is below the documented minimum (large)", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "sandbag" }],
          availableSpace: "moderate",
        }),
      });

      const result = checkExerciseEligibility(SANDBAG_CARRY, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
    });

    test("21. no dependency on floor safety, jumping, throwing, a wall or a partner — none are documented for this exercise", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "sandbag" }],
          availableSpace: "large",
          floorSafe: false,
          jumpingAllowed: false,
          throwingAllowed: false,
          usableWall: false,
          partnerAvailable: false,
        }),
      });

      const result = checkExerciseEligibility(SANDBAG_CARRY, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("22. no capability is created for carry position (bear hug, front, shouldered, front rack are all the same requirements)", () => {
      const requiredEquipmentTypes = SANDBAG_CARRY.requirements!.required
        .flatMap((clause) => clause.items)
        .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
        .map((atom) => atom.equipment);
      expect(requiredEquipmentTypes).toEqual(["sandbag"]);
    });

    test("23. biomechanical fields match the canonical documentation", () => {
      expect(SANDBAG_CARRY.physicalQualities).toEqual([
        "grip_strength",
        "trunk_strength",
        "stability",
        "coordination",
        "muscular_endurance",
      ]);
      expect(SANDBAG_CARRY.movementPatterns).toEqual(["carry", "isometric"]);
      expect(SANDBAG_CARRY.forceVectors).toEqual(["horizontal"]);
      expect(SANDBAG_CARRY.unilateral).toBe(false);
      expect(SANDBAG_CARRY.bodyRegionsLoaded).toEqual(["shoulder", "upper_arm", "abdomen", "hip", "thigh"]);
      expect(SANDBAG_CARRY.complexity).toBe("moderate");
      expect(SANDBAG_CARRY.minimumTechnicalLevel).toBe(3);
    });
  });

  describe("ZERCHER_CARRY", () => {
    test("24. eligible with a barbell (one of two any_of alternatives) and large space", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "barbell" }],
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(ZERCHER_CARRY, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("25. eligible with a sandbag (the other any_of alternative) and large space", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "sandbag" }],
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(ZERCHER_CARRY, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("26. ineligible without a barbell or a sandbag", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "dumbbell" }],
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(ZERCHER_CARRY, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    });

    test("27. ineligible when available space is below the documented minimum (large)", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "barbell" }],
          availableSpace: "moderate",
        }),
      });

      const result = checkExerciseEligibility(ZERCHER_CARRY, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
    });

    test("28. no dependency on floor safety, jumping, throwing, a wall or a partner — none are documented for this exercise", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "barbell" }],
          availableSpace: "large",
          floorSafe: false,
          jumpingAllowed: false,
          throwingAllowed: false,
          usableWall: false,
          partnerAvailable: false,
        }),
      });

      const result = checkExerciseEligibility(ZERCHER_CARRY, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("29. does not require the axle equipment type — no such EquipmentType exists, and it is documented as a limitation, not approximated as barbell", () => {
      const requiredEquipmentTypes = ZERCHER_CARRY.requirements!.required
        .flatMap((clause) => clause.items)
        .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
        .map((atom) => atom.equipment);
      expect(requiredEquipmentTypes).toEqual(["barbell", "sandbag"]);
    });

    test("30. biomechanical fields match the canonical documentation", () => {
      expect(ZERCHER_CARRY.physicalQualities).toEqual(["trunk_strength", "stability", "coordination", "muscular_endurance"]);
      expect(ZERCHER_CARRY.movementPatterns).toEqual(["carry", "isometric"]);
      expect(ZERCHER_CARRY.forceVectors).toEqual(["horizontal"]);
      expect(ZERCHER_CARRY.unilateral).toBe(false);
      expect(ZERCHER_CARRY.bodyRegionsLoaded).toEqual(["shoulder", "upper_arm", "elbow", "abdomen", "hip", "thigh"]);
      expect(ZERCHER_CARRY.complexity).toBe("moderate");
      expect(ZERCHER_CARRY.minimumTechnicalLevel).toBe(3);
    });
  });

  describe("business distinctions", () => {
    test("31. FARMER_CARRY vs. FRONT_RACK_CARRY: distinct equipment alternatives, and only FARMER_CARRY documents grip as a primary quality", () => {
      const farmerEquipment = FARMER_CARRY.requirements!.required
        .flatMap((clause) => clause.items)
        .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
        .map((atom) => atom.equipment);
      const frontRackEquipment = FRONT_RACK_CARRY.requirements!.required
        .flatMap((clause) => clause.items)
        .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
        .map((atom) => atom.equipment);

      // Farmer Carry's own implements (farmer_handle, trap_bar) are not documented front-rack implements, and vice versa (barbell)
      expect(farmerEquipment).toContain("farmer_handle");
      expect(farmerEquipment).toContain("trap_bar");
      expect(frontRackEquipment).not.toContain("farmer_handle");
      expect(frontRackEquipment).not.toContain("trap_bar");
      expect(frontRackEquipment).toContain("barbell");
      expect(farmerEquipment).not.toContain("barbell");

      // FARMER_CARRY documents genuine grip demand ("Support Grip", "Grip Endurance"); FRONT_RACK_CARRY
      // repeatedly and explicitly states grip should not be the limiting factor.
      expect(FARMER_CARRY.physicalQualities).toContain("grip_strength");
      expect(FRONT_RACK_CARRY.physicalQualities).not.toContain("grip_strength");
      expect(FARMER_CARRY.bodyRegionsLoaded).toContain("hand");
      expect(FRONT_RACK_CARRY.bodyRegionsLoaded).not.toContain("hand");

      // Documented complexity ordering: Farmer Carry (Low) < Front Rack Carry (Moderate)
      expect(FARMER_CARRY.complexity).toBe("low");
      expect(FRONT_RACK_CARRY.complexity).toBe("moderate");
      expect(FARMER_CARRY.minimumTechnicalLevel).toBeLessThan(FRONT_RACK_CARRY.minimumTechnicalLevel);
    });

    test("32. SANDBAG_CARRY vs. ZERCHER_CARRY: distinct equipment (sandbag-only vs. barbell-or-sandbag any_of), and only ZERCHER_CARRY loads the elbow region", () => {
      const sandbagEquipment = SANDBAG_CARRY.requirements!.required
        .flatMap((clause) => clause.items)
        .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
        .map((atom) => atom.equipment);
      const zercherEquipment = ZERCHER_CARRY.requirements!.required
        .flatMap((clause) => clause.items)
        .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
        .map((atom) => atom.equipment);

      // SANDBAG_CARRY has a single mandatory equipment atom (sandbag only); ZERCHER_CARRY documents a real barbell alternative
      expect(sandbagEquipment).toEqual(["sandbag"]);
      expect(zercherEquipment).toEqual(["barbell", "sandbag"]);
      const barbellOnlyInput = makeValidInput({
        environment: makeEnvironment({ availableEquipment: [{ type: "barbell" }], availableSpace: "large" }),
      });
      expect(checkExerciseEligibility(SANDBAG_CARRY, barbellOnlyInput).eligible).toBe(false);
      expect(checkExerciseEligibility(ZERCHER_CARRY, barbellOnlyInput).eligible).toBe(true);

      // Only ZERCHER_CARRY's own fiche grounds the elbow-crease load-bearing joint as a dedicated, primary
      // structural concern (dedicated "Elbow and Arm Demand" section, elbow/biceps absolute contraindications);
      // SANDBAG_CARRY's grip/arm demand is instead reflected through grip_strength and the upper_arm region.
      expect(ZERCHER_CARRY.bodyRegionsLoaded).toContain("elbow");
      expect(SANDBAG_CARRY.bodyRegionsLoaded).not.toContain("elbow");
      expect(SANDBAG_CARRY.physicalQualities).toContain("grip_strength");
      expect(ZERCHER_CARRY.physicalQualities).not.toContain("grip_strength");
    });
  });

  test("33. adding this chapter never changes the previously integrated exercises", () => {
    const towelPullUpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "pull_up_bar" }, { type: "towel" }],
        availableSpace: "very_limited",
      }),
    });
    expect(checkExerciseEligibility(TOWEL_PULL_UP, towelPullUpInput).eligible).toBe(true);

    const pinchCarryInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "pinch_grip_implement" }],
        availableSpace: "large",
      }),
    });
    expect(checkExerciseEligibility(PINCH_CARRY, pinchCarryInput).eligible).toBe(true);

    const ropeClimbInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "rope" }],
        floorSafe: true,
        availableSpace: "large",
      }),
    });
    expect(checkExerciseEligibility(ROPE_CLIMB, ropeClimbInput).eligible).toBe(true);

    const jumpShrugInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        jumpingAllowed: true,
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(JUMP_SHRUG, jumpShrugInput).eligible).toBe(true);

    const hangPowerCleanInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }],
        availableSpace: "limited",
      }),
    });
    expect(checkExerciseEligibility(HANG_POWER_CLEAN, hangPowerCleanInput).eligible).toBe(true);

    const pushPressInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "barbell" }, { type: "plates" }, { type: "rack" }],
        floorSafe: true,
        availableSpace: "moderate",
      }),
    });
    expect(checkExerciseEligibility(PUSH_PRESS, pushPressInput).eligible).toBe(true);

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
  });
});


/**
 * `62_CORE` chapter — Exercise Requirements Model batch integration
 * (`ab_wheel`, `pallof_press`, `dead_bug`, `hollow_body_hold`,
 * `hanging_leg_raise`, `dragon_flag`, `suitcase_carry`, `overhead_carry`).
 *
 * `farmer_carry` is the ninth exercise named in this chapter's own
 * `00_OVERVIEW.md` inventory but is NOT part of this batch: it is already
 * integrated with `50-exercises/66_CARRIES/10_FARMER_CARRY.md` as its sole
 * canonical source (see `FARMER_CARRY`'s own locked-decision comment in
 * `exerciseKnowledgeBase.ts`) — asserted explicitly by test 2 below.
 *
 * Same `test.each`-driven structure as the `65_GRIP`/`66_CARRIES` chapters'
 * own batch blocks: cross-cutting checks parameterized over all eight
 * exercises, then one describe block per exercise for its own
 * eligibility-specific scenarios, then dedicated business-distinction
 * tests.
 */
describe("62_CORE chapter — Exercise Requirements Model batch integration", () => {
  const CORE_EXERCISES = [
    { exercise: AB_WHEEL, id: "ab_wheel" },
    { exercise: PALLOF_PRESS, id: "pallof_press" },
    { exercise: DEAD_BUG, id: "dead_bug" },
    { exercise: HOLLOW_BODY_HOLD, id: "hollow_body_hold" },
    { exercise: HANGING_LEG_RAISE, id: "hanging_leg_raise" },
    { exercise: DRAGON_FLAG, id: "dragon_flag" },
    { exercise: SUITCASE_CARRY, id: "suitcase_carry" },
    { exercise: OVERHEAD_CARRY, id: "overhead_carry" },
  ] as const;

  test.each(CORE_EXERCISES)("$id — 1. exists in the catalog with the expected id", ({ exercise, id }) => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(exercise);
    expect(exercise.id).toBe(id);
  });

  test("2. all eight ids are unique within the catalog, and farmer_carry (already integrated, not part of this batch) still appears only once", () => {
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const { id } of CORE_EXERCISES) {
      expect(ids.filter((existingId) => existingId === id)).toHaveLength(1);
    }
    expect(ids.filter((existingId) => existingId === "farmer_carry")).toEqual(["farmer_carry"]);
  });

  test.each(CORE_EXERCISES)(
    "$id — 3. respects the coexistence invariant: requiredEquipment is empty, optionalEquipment is absent",
    ({ exercise }) => {
      expect(exercise.requiredEquipment).toEqual([]);
      expect(exercise.optionalEquipment).toBeUndefined();
      expect(validateRequirementsCoexistenceInvariant(exercise)).toBeNull();
      expect(validateExerciseRequirementsStructure(exercise.requirements!)).toEqual([]);
    },
  );

  test("4. the default catalog used by runEngine(input) now also contains all eight 62_CORE ids", () => {
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);
    for (const { id } of CORE_EXERCISES) {
      expect(ids).toContain(id);
    }
  });

  test.each(CORE_EXERCISES)("$id — 5. never mutates the exercise or the input it is given during evaluation", ({ exercise }) => {
    const input = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [
          { type: "other" },
          { type: "cable_machine" },
          { type: "resistance_band" },
          { type: "pull_up_bar" },
          { type: "bench" },
          { type: "rigid_anchor_support" },
          { type: "dumbbell" },
          { type: "kettlebell" },
          { type: "farmer_handle" },
          { type: "sandbag" },
        ],
        floorSafe: true,
        availableSpace: "large",
      }),
    });
    const exerciseSnapshot = structuredClone(exercise);
    const inputSnapshot = structuredClone(input);

    checkExerciseEligibility(exercise, input);

    expect(exercise).toEqual(exerciseSnapshot);
    expect(input).toEqual(inputSnapshot);
  });

  describe("AB_WHEEL", () => {
    test("6. eligible with the 'other' equipment placeholder, a safe floor and limited space", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "other" }],
          floorSafe: true,
          availableSpace: "limited",
        }),
      });

      const result = checkExerciseEligibility(AB_WHEEL, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("7. ineligible without any declared equipment", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [],
          floorSafe: true,
          availableSpace: "limited",
        }),
      });

      const result = checkExerciseEligibility(AB_WHEEL, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    });

    test("8. ineligible when the floor is not declared safe", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "other" }],
          floorSafe: false,
          availableSpace: "limited",
        }),
      });

      const result = checkExerciseEligibility(AB_WHEEL, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
    });

    test("9. ineligible when available space is below the documented minimum (limited)", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "other" }],
          floorSafe: true,
          availableSpace: "very_limited",
        }),
      });

      const result = checkExerciseEligibility(AB_WHEEL, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
    });

    test("10. no dependency on jumping, throwing, a wall or a partner — none are documented for this exercise", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "other" }],
          floorSafe: true,
          availableSpace: "limited",
          jumpingAllowed: false,
          throwingAllowed: false,
          usableWall: false,
          partnerAvailable: false,
        }),
      });

      const result = checkExerciseEligibility(AB_WHEEL, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("11. biomechanical fields match the canonical documentation", () => {
      expect(AB_WHEEL.physicalQualities).toEqual(["trunk_strength", "stability", "coordination"]);
      expect(AB_WHEEL.movementPatterns).toEqual(["anti_extension", "isometric"]);
      expect(AB_WHEEL.forceVectors).toEqual(["forward", "downward"]);
      expect(AB_WHEEL.unilateral).toBe(false);
      expect(AB_WHEEL.bodyRegionsLoaded).toEqual(["abdomen", "shoulder"]);
      expect(AB_WHEEL.complexity).toBe("moderate");
      expect(AB_WHEEL.minimumTechnicalLevel).toBe(3);
    });
  });

  describe("PALLOF_PRESS", () => {
    test("12. eligible with a cable machine alone (one of two any_of alternatives) and limited space", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "cable_machine" }],
          availableSpace: "limited",
        }),
      });

      const result = checkExerciseEligibility(PALLOF_PRESS, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("13. eligible with a resistance band alone (the other any_of alternative) and limited space", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "resistance_band" }],
          availableSpace: "limited",
        }),
      });

      const result = checkExerciseEligibility(PALLOF_PRESS, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("14. ineligible without a cable machine or resistance band", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "bodyweight" }],
          availableSpace: "limited",
        }),
      });

      const result = checkExerciseEligibility(PALLOF_PRESS, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    });

    test("15. ineligible when available space is below the documented minimum (limited)", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "cable_machine" }],
          availableSpace: "very_limited",
        }),
      });

      const result = checkExerciseEligibility(PALLOF_PRESS, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
    });

    test("16. no dependency on floor safety, jumping, throwing, a wall or a partner — none are documented for this exercise", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "cable_machine" }],
          availableSpace: "limited",
          floorSafe: false,
          jumpingAllowed: false,
          throwingAllowed: false,
          usableWall: false,
          partnerAvailable: false,
        }),
      });

      const result = checkExerciseEligibility(PALLOF_PRESS, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("17. biomechanical fields match the canonical documentation", () => {
      expect(PALLOF_PRESS.physicalQualities).toEqual(["trunk_strength", "stability", "coordination"]);
      expect(PALLOF_PRESS.movementPatterns).toEqual(["anti_rotation", "horizontal_push", "isometric"]);
      expect(PALLOF_PRESS.forceVectors).toEqual(["lateral"]);
      expect(PALLOF_PRESS.unilateral).toBe(false);
      expect(PALLOF_PRESS.bodyRegionsLoaded).toEqual(["abdomen", "hip"]);
      expect(PALLOF_PRESS.complexity).toBe("low");
      expect(PALLOF_PRESS.minimumTechnicalLevel).toBe(2);
    });
  });

  describe("DEAD_BUG", () => {
    test("18. eligible with very_limited space and no declared equipment", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [],
          availableSpace: "very_limited",
        }),
      });

      const result = checkExerciseEligibility(DEAD_BUG, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("19. requires no equipment atom at all — the documented 'Floor Space' requirement is represented purely through sufficient_space", () => {
      const requiredEquipmentTypes = DEAD_BUG.requirements!.required
        .flatMap((clause) => clause.items)
        .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
        .map((atom) => atom.equipment);
      expect(requiredEquipmentTypes).toEqual([]);
    });

    test("20. the documented space minimum is already the lowest AvailableSpaceLevel tier (very_limited) — no insufficient-space scenario can be constructed, unlike every other exercise in this batch", () => {
      const spaceClause = DEAD_BUG.requirements!.required
        .flatMap((clause) => clause.items)
        .find((atom) => atom.kind === "environment" && atom.capability === "sufficient_space");
      expect(spaceClause).toEqual({ kind: "environment", capability: "sufficient_space", minimumSpace: "very_limited" });
    });

    test("21. no dependency on floor safety, jumping, throwing, a wall or a partner — none are documented for this exercise", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [],
          availableSpace: "very_limited",
          floorSafe: false,
          jumpingAllowed: false,
          throwingAllowed: false,
          usableWall: false,
          partnerAvailable: false,
        }),
      });

      const result = checkExerciseEligibility(DEAD_BUG, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("22. biomechanical fields match the canonical documentation", () => {
      expect(DEAD_BUG.physicalQualities).toEqual(["trunk_strength", "coordination", "stability"]);
      expect(DEAD_BUG.movementPatterns).toEqual(["anti_extension", "isometric", "mixed"]);
      expect(DEAD_BUG.forceVectors).toEqual(["mixed"]);
      expect(DEAD_BUG.unilateral).toBe(false);
      expect(DEAD_BUG.bodyRegionsLoaded).toEqual(["abdomen"]);
      expect(DEAD_BUG.complexity).toBe("low");
      expect(DEAD_BUG.minimumTechnicalLevel).toBe(2);
      expect(DEAD_BUG.contraindications).toEqual([]);
    });
  });

  describe("HOLLOW_BODY_HOLD", () => {
    test("23. eligible with very_limited space and no declared equipment", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [],
          availableSpace: "very_limited",
        }),
      });

      const result = checkExerciseEligibility(HOLLOW_BODY_HOLD, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("24. requires no equipment atom at all, identically to DEAD_BUG", () => {
      const requiredEquipmentTypes = HOLLOW_BODY_HOLD.requirements!.required
        .flatMap((clause) => clause.items)
        .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
        .map((atom) => atom.equipment);
      expect(requiredEquipmentTypes).toEqual([]);
    });

    test("25. the documented space minimum is already the lowest AvailableSpaceLevel tier (very_limited), identically to DEAD_BUG", () => {
      const spaceClause = HOLLOW_BODY_HOLD.requirements!.required
        .flatMap((clause) => clause.items)
        .find((atom) => atom.kind === "environment" && atom.capability === "sufficient_space");
      expect(spaceClause).toEqual({ kind: "environment", capability: "sufficient_space", minimumSpace: "very_limited" });
    });

    test("26. no dependency on floor safety, jumping, throwing, a wall or a partner — none are documented for this exercise", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [],
          availableSpace: "very_limited",
          floorSafe: false,
          jumpingAllowed: false,
          throwingAllowed: false,
          usableWall: false,
          partnerAvailable: false,
        }),
      });

      const result = checkExerciseEligibility(HOLLOW_BODY_HOLD, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("27. biomechanical fields match the canonical documentation", () => {
      expect(HOLLOW_BODY_HOLD.physicalQualities).toEqual(["trunk_strength", "muscular_endurance", "stability"]);
      expect(HOLLOW_BODY_HOLD.movementPatterns).toEqual(["anti_extension", "isometric"]);
      expect(HOLLOW_BODY_HOLD.forceVectors).toEqual(["not_applicable"]);
      expect(HOLLOW_BODY_HOLD.unilateral).toBe(false);
      expect(HOLLOW_BODY_HOLD.bodyRegionsLoaded).toEqual(["abdomen"]);
      expect(HOLLOW_BODY_HOLD.complexity).toBe("low");
      expect(HOLLOW_BODY_HOLD.minimumTechnicalLevel).toBe(2);
      expect(HOLLOW_BODY_HOLD.contraindications).toEqual([]);
    });
  });

  describe("HANGING_LEG_RAISE", () => {
    test("28. eligible with a pull-up bar, a safe landing surface and very_limited space", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "pull_up_bar" }],
          floorSafe: true,
          availableSpace: "very_limited",
        }),
      });

      const result = checkExerciseEligibility(HANGING_LEG_RAISE, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("29. ineligible without a pull-up bar", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [],
          floorSafe: true,
          availableSpace: "very_limited",
        }),
      });

      const result = checkExerciseEligibility(HANGING_LEG_RAISE, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    });

    test("30. ineligible without a declared safe landing surface (grip-failure fall risk)", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "pull_up_bar" }],
          floorSafe: false,
          availableSpace: "very_limited",
        }),
      });

      const result = checkExerciseEligibility(HANGING_LEG_RAISE, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
    });

    test("31. the documented space minimum is already the lowest AvailableSpaceLevel tier (very_limited) — matching a single stationary hanging station, not an extended footprint", () => {
      const spaceClause = HANGING_LEG_RAISE.requirements!.required
        .flatMap((clause) => clause.items)
        .find((atom) => atom.kind === "environment" && atom.capability === "sufficient_space");
      expect(spaceClause).toEqual({ kind: "environment", capability: "sufficient_space", minimumSpace: "very_limited" });
    });

    test("32. no dependency on jumping, throwing, a wall or a partner — none are documented for this exercise", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "pull_up_bar" }],
          floorSafe: true,
          availableSpace: "very_limited",
          jumpingAllowed: false,
          throwingAllowed: false,
          usableWall: false,
          partnerAvailable: false,
        }),
      });

      const result = checkExerciseEligibility(HANGING_LEG_RAISE, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("33. biomechanical fields match the canonical documentation", () => {
      expect(HANGING_LEG_RAISE.physicalQualities).toEqual(["trunk_strength", "grip_strength", "stability", "coordination"]);
      expect(HANGING_LEG_RAISE.movementPatterns).toEqual(["mixed", "isometric"]);
      expect(HANGING_LEG_RAISE.forceVectors).toEqual(["upward"]);
      expect(HANGING_LEG_RAISE.unilateral).toBe(false);
      expect(HANGING_LEG_RAISE.bodyRegionsLoaded).toEqual(["abdomen", "hip", "thigh"]);
      expect(HANGING_LEG_RAISE.complexity).toBe("high");
      expect(HANGING_LEG_RAISE.minimumTechnicalLevel).toBe(4);
    });
  });

  describe("DRAGON_FLAG", () => {
    test("34. eligible with a bench, a rigid anchor support and moderate space", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "bench" }, { type: "rigid_anchor_support" }],
          availableSpace: "moderate",
        }),
      });

      const result = checkExerciseEligibility(DRAGON_FLAG, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("35. ineligible without a bench, even with a rigid anchor support present", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "rigid_anchor_support" }],
          availableSpace: "moderate",
        }),
      });

      const result = checkExerciseEligibility(DRAGON_FLAG, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    });

    test("36. ineligible without a rigid anchor support, even with a bench present", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "bench" }],
          availableSpace: "moderate",
        }),
      });

      const result = checkExerciseEligibility(DRAGON_FLAG, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    });

    test("37. ineligible when available space is below the documented minimum (moderate)", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "bench" }, { type: "rigid_anchor_support" }],
          availableSpace: "limited",
        }),
      });

      const result = checkExerciseEligibility(DRAGON_FLAG, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
    });

    test("38. no dependency on floor safety, jumping, throwing, a wall or a partner — none are documented for this exercise", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "bench" }, { type: "rigid_anchor_support" }],
          availableSpace: "moderate",
          floorSafe: false,
          jumpingAllowed: false,
          throwingAllowed: false,
          usableWall: false,
          partnerAvailable: false,
        }),
      });

      const result = checkExerciseEligibility(DRAGON_FLAG, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("39. biomechanical fields match the canonical documentation", () => {
      expect(DRAGON_FLAG.physicalQualities).toEqual(["trunk_strength", "stability"]);
      expect(DRAGON_FLAG.movementPatterns).toEqual(["anti_extension", "isometric"]);
      expect(DRAGON_FLAG.forceVectors).toEqual(["downward"]);
      expect(DRAGON_FLAG.unilateral).toBe(false);
      expect(DRAGON_FLAG.bodyRegionsLoaded).toEqual(["abdomen"]);
      expect(DRAGON_FLAG.complexity).toBe("very_high");
      expect(DRAGON_FLAG.minimumTechnicalLevel).toBe(5);
    });
  });

  describe("SUITCASE_CARRY", () => {
    test("40. eligible with a dumbbell alone (one of four any_of alternatives), a safe floor and large space", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "dumbbell" }],
          floorSafe: true,
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(SUITCASE_CARRY, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("41. eligible with a sandbag alone (a different any_of alternative)", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "sandbag" }],
          floorSafe: true,
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(SUITCASE_CARRY, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("42. ineligible without any documented implement (dumbbell, kettlebell, farmer handle or sandbag)", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "bodyweight" }],
          floorSafe: true,
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(SUITCASE_CARRY, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    });

    test("43. ineligible when the floor is not declared safe", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "dumbbell" }],
          floorSafe: false,
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(SUITCASE_CARRY, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "UNSAFE_ENVIRONMENT")).toBe(true);
    });

    test("44. ineligible when available space is below the documented minimum (large)", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "dumbbell" }],
          floorSafe: true,
          availableSpace: "moderate",
        }),
      });

      const result = checkExerciseEligibility(SUITCASE_CARRY, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
    });

    test("45. no dependency on jumping, throwing, a wall or a partner — none are documented for this exercise", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "dumbbell" }],
          floorSafe: true,
          availableSpace: "large",
          jumpingAllowed: false,
          throwingAllowed: false,
          usableWall: false,
          partnerAvailable: false,
        }),
      });

      const result = checkExerciseEligibility(SUITCASE_CARRY, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("46. biomechanical fields match the canonical documentation", () => {
      expect(SUITCASE_CARRY.physicalQualities).toEqual([
        "trunk_strength",
        "general_work_capacity",
        "grip_strength",
        "stability",
        "coordination",
      ]);
      expect(SUITCASE_CARRY.movementPatterns).toEqual(["carry", "anti_lateral_flexion", "anti_rotation", "isometric"]);
      expect(SUITCASE_CARRY.forceVectors).toEqual(["vertical", "lateral", "rotational"]);
      expect(SUITCASE_CARRY.unilateral).toBe(true);
      expect(SUITCASE_CARRY.bodyRegionsLoaded).toEqual(["abdomen", "forearm", "hand", "shoulder"]);
      expect(SUITCASE_CARRY.complexity).toBe("moderate");
      expect(SUITCASE_CARRY.minimumTechnicalLevel).toBe(3);
      expect(SUITCASE_CARRY.combatSportRelevance).toBeUndefined();
    });
  });

  describe("OVERHEAD_CARRY", () => {
    test("47. eligible with a dumbbell alone (one of two any_of alternatives) and large space", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "dumbbell" }],
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(OVERHEAD_CARRY, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("48. eligible with a kettlebell alone (the other any_of alternative)", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "kettlebell" }],
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(OVERHEAD_CARRY, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("49. ineligible without a dumbbell or kettlebell — a barbell alone is not documented as a Minimum-tier alternative", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "barbell" }],
          availableSpace: "large",
        }),
      });

      const result = checkExerciseEligibility(OVERHEAD_CARRY, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "EQUIPMENT_UNAVAILABLE")).toBe(true);
    });

    test("50. ineligible when available space is below the documented minimum (large)", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "dumbbell" }],
          availableSpace: "moderate",
        }),
      });

      const result = checkExerciseEligibility(OVERHEAD_CARRY, input);

      expect(result.eligible).toBe(false);
      expect(result.rejectionReasons.some((r) => r.code === "INSUFFICIENT_SPACE")).toBe(true);
    });

    test("51. no dependency on floor safety, jumping, throwing, a wall or a partner — none are documented for this exercise", () => {
      const input = makeValidInput({
        environment: makeEnvironment({
          availableEquipment: [{ type: "dumbbell" }],
          availableSpace: "large",
          floorSafe: false,
          jumpingAllowed: false,
          throwingAllowed: false,
          usableWall: false,
          partnerAvailable: false,
        }),
      });

      const result = checkExerciseEligibility(OVERHEAD_CARRY, input);

      expect(result.eligible).toBe(true);
      expect(result.rejectionReasons).toEqual([]);
    });

    test("52. biomechanical fields match the canonical documentation", () => {
      expect(OVERHEAD_CARRY.physicalQualities).toEqual(["stability", "trunk_strength", "grip_strength", "coordination"]);
      expect(OVERHEAD_CARRY.movementPatterns).toEqual(["carry", "anti_extension", "isometric"]);
      expect(OVERHEAD_CARRY.forceVectors).toEqual(["vertical", "rotational"]);
      expect(OVERHEAD_CARRY.unilateral).toBe(false);
      expect(OVERHEAD_CARRY.bodyRegionsLoaded).toEqual(["shoulder", "abdomen"]);
      expect(OVERHEAD_CARRY.complexity).toBe("high");
      expect(OVERHEAD_CARRY.minimumTechnicalLevel).toBe(4);
      expect(OVERHEAD_CARRY.combatSportRelevance).toBeUndefined();
    });
  });

  describe("business distinctions", () => {
    test("53. DEAD_BUG vs. HOLLOW_BODY_HOLD: identical requirements, but distinct adaptation, endurance quality, movement dynamism and force vector", () => {
      // Both fiches document an identical "Required: Floor Space / Optional: [comfort equipment] /
      // Space Requirements: Minimal" structure — the engine cannot and should not differentiate
      // eligibility between them.
      expect(DEAD_BUG.requirements).toEqual(HOLLOW_BODY_HOLD.requirements);

      // DEAD_BUG is framed as motor control (Primary Adaptation: Movement); HOLLOW_BODY_HOLD is
      // framed as static-endurance robustness (Primary Adaptation: Robustness), the direct source
      // of the two exercises' key business distinction.
      expect(DEAD_BUG.primaryAdaptation).toBe("movement");
      expect(HOLLOW_BODY_HOLD.primaryAdaptation).toBe("robustness");
      expect(HOLLOW_BODY_HOLD.physicalQualities).toContain("muscular_endurance");
      expect(DEAD_BUG.physicalQualities).not.toContain("muscular_endurance");

      // DEAD_BUG is a dynamic, reciprocal contralateral-limb movement (mixed movement pattern and
      // force vector); HOLLOW_BODY_HOLD is a purely static hold with no directional force production.
      expect(DEAD_BUG.movementPatterns).toContain("mixed");
      expect(HOLLOW_BODY_HOLD.movementPatterns).not.toContain("mixed");
      expect(DEAD_BUG.forceVectors).toEqual(["mixed"]);
      expect(HOLLOW_BODY_HOLD.forceVectors).toEqual(["not_applicable"]);
    });

    test("54. PALLOF_PRESS vs. the other anti-extension exercises: the only entry in this batch with anti_rotation, not anti_extension, as its primary movement pattern", () => {
      expect(PALLOF_PRESS.movementPatterns).toContain("anti_rotation");
      expect(PALLOF_PRESS.movementPatterns).not.toContain("anti_extension");

      for (const antiExtensionExercise of [AB_WHEEL, DEAD_BUG, HOLLOW_BODY_HOLD, DRAGON_FLAG, OVERHEAD_CARRY]) {
        expect(antiExtensionExercise.movementPatterns).toContain("anti_extension");
        expect(antiExtensionExercise.movementPatterns).not.toContain("anti_rotation");
      }

      // PALLOF_PRESS is gated by a cable machine or resistance band; none of the anti-extension
      // exercises in this batch document either as a requirement.
      const pallofEquipment = PALLOF_PRESS.requirements!.required
        .flatMap((clause) => clause.items)
        .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
        .map((atom) => atom.equipment);
      expect(pallofEquipment).toEqual(["cable_machine", "resistance_band"]);
    });

    test("55. SUITCASE_CARRY vs. FARMER_CARRY vs. OVERHEAD_CARRY: distinct laterality, distinct movement patterns, and distinct equipment sets", () => {
      // Laterality: only SUITCASE_CARRY is unilateral.
      expect(SUITCASE_CARRY.unilateral).toBe(true);
      expect(FARMER_CARRY.unilateral).toBe(false);
      expect(OVERHEAD_CARRY.unilateral).toBe(false);

      // Movement patterns: only SUITCASE_CARRY documents anti-lateral-flexion/anti-rotation;
      // only OVERHEAD_CARRY documents anti-extension as part of its carry pattern.
      expect(SUITCASE_CARRY.movementPatterns).toEqual(expect.arrayContaining(["anti_lateral_flexion", "anti_rotation"]));
      expect(FARMER_CARRY.movementPatterns).not.toEqual(expect.arrayContaining(["anti_lateral_flexion", "anti_rotation"]));
      expect(OVERHEAD_CARRY.movementPatterns).toContain("anti_extension");
      expect(FARMER_CARRY.movementPatterns).not.toContain("anti_extension");
      expect(SUITCASE_CARRY.movementPatterns).not.toContain("anti_extension");

      // Equipment: OVERHEAD_CARRY's Minimum tier is strictly dumbbell-or-kettlebell only (no
      // farmer_handle/trap_bar/sandbag alternative, unlike FARMER_CARRY/SUITCASE_CARRY).
      const overheadEquipment = OVERHEAD_CARRY.requirements!.required
        .flatMap((clause) => clause.items)
        .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
        .map((atom) => atom.equipment);
      expect(overheadEquipment).toEqual(["dumbbell", "kettlebell"]);

      const suitcaseEquipment = SUITCASE_CARRY.requirements!.required
        .flatMap((clause) => clause.items)
        .filter((atom): atom is Extract<typeof atom, { kind: "equipment" }> => atom.kind === "equipment")
        .map((atom) => atom.equipment);
      expect(suitcaseEquipment).toContain("farmer_handle");
      expect(overheadEquipment).not.toContain("farmer_handle");

      // Only SUITCASE_CARRY documents an explicit floor_safe requirement in this trio.
      const hasFloorSafe = (exercise: typeof SUITCASE_CARRY) =>
        exercise.requirements!.required
          .flatMap((clause) => clause.items)
          .some((atom) => atom.kind === "environment" && atom.capability === "floor_safe");
      expect(hasFloorSafe(SUITCASE_CARRY)).toBe(true);
      expect(hasFloorSafe(OVERHEAD_CARRY)).toBe(false);
    });
  });

  test("56. adding this chapter never changes the previously integrated exercises, including FARMER_CARRY", () => {
    const farmerCarryInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "dumbbell" }],
        availableSpace: "large",
      }),
    });
    expect(checkExerciseEligibility(FARMER_CARRY, farmerCarryInput).eligible).toBe(true);

    const towelPullUpInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "pull_up_bar" }, { type: "towel" }],
        availableSpace: "very_limited",
      }),
    });
    expect(checkExerciseEligibility(TOWEL_PULL_UP, towelPullUpInput).eligible).toBe(true);

    const ropeClimbInput = makeValidInput({
      environment: makeEnvironment({
        availableEquipment: [{ type: "rope" }],
        floorSafe: true,
        availableSpace: "large",
      }),
    });
    expect(checkExerciseEligibility(ROPE_CLIMB, ropeClimbInput).eligible).toBe(true);
  });
});
