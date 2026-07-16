import { describe, expect, test } from "vitest";

import {
  getAuthorizedMethodsForModule,
  isMethodAuthorizedForModule,
  isRoleAuthorizedForModuleMethod,
  isTrainingMethodId,
  validateMethodModuleRoleContract,
} from "../../prescription/contracts";

describe("contracts", () => {
  test("isTrainingMethodId accepts every documented training method identifier", () => {
    expect(isTrainingMethodId("straight_sets_repetitions")).toBe(true);
    expect(isTrainingMethodId("power_repetition_sets")).toBe(true);
    expect(isTrainingMethodId("not_a_real_method")).toBe(false);
  });

  test("returns the module's authorized methods sorted deterministically by priority", () => {
    const authorized = getAuthorizedMethodsForModule("strength");

    expect(authorized.map((entry) => entry.methodId)).toEqual([
      "straight_sets_repetitions",
      "distance_carry_sets",
      "timed_isometric_sets",
    ]);
  });

  test("refuses a method never authorized for the module", () => {
    expect(isMethodAuthorizedForModule("strength", "power_repetition_sets")).toBe(false);
  });

  test("refuses a role never authorized for a module/method couple", () => {
    expect(isRoleAuthorizedForModuleMethod("strength", "straight_sets_repetitions", "conditioning")).toBe(false);
  });

  // 32_MODULE_PRESCRIPTION_PROFILES.md, Module 8 — Core, "Allowed Methods" and
  // "Preferred Method Order" both explicitly document controlled_mobility_sets
  // as the module's 4th-priority method (mirroring the already-implemented
  // robustness module, which authorizes the identical method/role/priority
  // triple). The core module's contract in contracts.ts is currently missing
  // this authorization.
  test("core module authorizes controlled_mobility_sets as its documented 4th-priority method", () => {
    expect(isMethodAuthorizedForModule("core", "controlled_mobility_sets")).toBe(true);

    const contractCheck = validateMethodModuleRoleContract("core", "controlled_mobility_sets", "corrective");
    expect(contractCheck.valid).toBe(true);

    const authorized = getAuthorizedMethodsForModule("core", "corrective");
    expect(authorized.map((entry) => entry.methodId)).toContain("controlled_mobility_sets");
  });
});
