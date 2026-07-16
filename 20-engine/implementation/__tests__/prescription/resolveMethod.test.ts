import { describe, expect, test } from "vitest";

import { resolveMethod } from "../../prescription/resolveMethod";
import { validateMethodModuleRoleContract } from "../../prescription/contracts";

describe("resolveMethod", () => {
  test("deterministically resolves the single highest-priority method for a documented module/role", () => {
    const result = resolveMethod({ moduleId: "strength", role: "primary" });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.methodId).toBe("straight_sets_repetitions");
    expect(result.resolutionSource).toBe("module_role_priority");
  });

  test("resolves a different module/role to its own documented priority method", () => {
    const result = resolveMethod({ moduleId: "power", role: "primary" });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.methodId).toBe("power_repetition_sets");
  });

  test("accepts an explicit upstream method already authorized for the module and role", () => {
    const result = resolveMethod({
      moduleId: "grip",
      role: "conditioning",
      explicitMethodId: "work_rest_intervals",
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.methodId).toBe("work_rest_intervals");
    expect(result.resolutionSource).toBe("explicit_upstream_method");
  });

  test("rejects an unknown method identifier without inventing one", () => {
    const result = resolveMethod({
      moduleId: "strength",
      role: "primary",
      explicitMethodId: "totally_invented_method",
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail for an unknown method identifier.");
    }

    expect(result.failureCode).toBe("METHOD_ID_INVALID");
  });

  test("refuses a method/module couple that the contract does not authorize", () => {
    // power_repetition_sets is explicitly forbidden for the strength module.
    const result = resolveMethod({
      moduleId: "strength",
      role: "primary",
      explicitMethodId: "power_repetition_sets",
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail for a module-incompatible method.");
    }

    expect(result.failureCode).toBe("METHOD_MODULE_INCOMPATIBLE");
  });

  test("refuses a role incompatible with the module for an otherwise real method", () => {
    // "strength" never authorizes the "conditioning" role for any method.
    const result = resolveMethod({ moduleId: "strength", role: "conditioning" });

    if (result.ok) {
      throw new Error("Expected resolution to fail for a module/role couple with no candidate.");
    }

    expect(result.failureCode).toBe("METHOD_NO_AUTHORIZED_CANDIDATE");
  });

  test("refuses an explicit method whose role is not supported by that method", () => {
    // straight_sets_repetitions never supports the "conditioning" role.
    const result = resolveMethod({
      moduleId: "grip",
      role: "conditioning",
      explicitMethodId: "straight_sets_repetitions",
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail for a method/role incompatibility.");
    }

    expect(result.failureCode).toBe("METHOD_MODULE_INCOMPATIBLE");
  });

  test("an empty allowed-method restriction fails explicitly rather than falling back", () => {
    const result = resolveMethod({
      moduleId: "strength",
      role: "primary",
      allowedMethodIds: [],
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail when the allowed-method set is empty.");
    }

    expect(result.failureCode).toBe("METHOD_ALLOWED_SET_EMPTY");
  });

  test("validateMethodModuleRoleContract agrees with resolveMethod on an incompatible couple", () => {
    const contractCheck = validateMethodModuleRoleContract("strength", "power_repetition_sets", "primary");
    expect(contractCheck.valid).toBe(false);
  });

  test("validateMethodModuleRoleContract confirms a compatible couple", () => {
    const contractCheck = validateMethodModuleRoleContract("strength", "straight_sets_repetitions", "primary");
    expect(contractCheck.valid).toBe(true);
  });

  test("determinism: identical input produces an identical result", () => {
    const input = { moduleId: "strength" as const, role: "primary" as const };
    const resultA = resolveMethod(input);
    const resultB = resolveMethod(input);

    expect(resultA).toEqual(resultB);
  });
});
