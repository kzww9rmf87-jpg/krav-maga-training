import { describe, expect, test } from "vitest";

import { validateCompatibility } from "../../prescription/validateCompatibility";
import { makeCapabilities } from "./fixtures";

describe("validateCompatibility", () => {
  test("a fully documented-compatible exercise passes with no issues", () => {
    const result = validateCompatibility({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      capabilities: makeCapabilities(),
    });

    expect(result.compatible).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("refuses an exercise whose capability status is unsupported", () => {
    const result = validateCompatibility({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      capabilities: makeCapabilities({ status: "unsupported" }),
    });

    if (result.compatible) {
      throw new Error("Expected incompatibility for an unsupported exercise capability status.");
    }

    expect(result.issues.some((issue) => issue.code === "EXERCISE_CAPABILITIES_UNSUPPORTED")).toBe(true);
  });

  test("refuses an exercise that does not declare support for the resolved method", () => {
    const result = validateCompatibility({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      capabilities: makeCapabilities({ supportedMethodIds: ["timed_isometric_sets"] }),
    });

    if (result.compatible) {
      throw new Error("Expected incompatibility for an unsupported method.");
    }

    expect(result.issues.some((issue) => issue.code === "EXERCISE_METHOD_UNSUPPORTED")).toBe(true);
  });

  test("refuses an exercise missing a capability tag required by the method", () => {
    const result = validateCompatibility({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      capabilities: makeCapabilities({ capabilityTags: ["technical_quality_observation"] }),
    });

    if (result.compatible) {
      throw new Error("Expected incompatibility for a missing required capability.");
    }

    const issue = result.issues.find((candidate) => candidate.code === "EXERCISE_REQUIRED_CAPABILITY_MISSING");
    expect(issue).toBeDefined();
    expect(issue?.message).toContain("countable_repetitions");
  });

  test("refuses when required equipment capabilities are not available", () => {
    const result = validateCompatibility({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      capabilities: makeCapabilities({ requiredEquipmentCapabilities: ["squat_rack"] }),
      availableEquipmentCapabilities: [],
    });

    if (result.compatible) {
      throw new Error("Expected incompatibility for missing equipment capabilities.");
    }

    expect(result.issues.some((issue) => issue.code === "EXERCISE_EQUIPMENT_CAPABILITY_MISSING")).toBe(true);
  });

  test("refuses when a required athlete reference type is not available", () => {
    const result = validateCompatibility({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      capabilities: makeCapabilities({ requiredAthleteReferenceTypes: ["one_rep_max"] }),
      availableAthleteReferenceTypes: [],
    });

    if (result.compatible) {
      throw new Error("Expected incompatibility for a missing athlete reference type.");
    }

    expect(result.issues.some((issue) => issue.code === "EXERCISE_ATHLETE_REFERENCE_MISSING")).toBe(true);
  });

  test("refuses an exercise with no duration-estimation profile", () => {
    const result = validateCompatibility({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      capabilities: makeCapabilities({ durationEstimationProfileId: null }),
    });

    if (result.compatible) {
      throw new Error("Expected incompatibility when no duration-estimation profile exists.");
    }

    expect(result.issues.some((issue) => issue.code === "EXERCISE_DURATION_PROFILE_MISSING")).toBe(true);
  });

  test("refuses a method/module/role triple the contract does not authorize", () => {
    const result = validateCompatibility({
      moduleId: "strength",
      methodId: "power_repetition_sets",
      role: "primary",
      capabilities: makeCapabilities({ supportedMethodIds: ["power_repetition_sets"] }),
    });

    if (result.compatible) {
      throw new Error("Expected incompatibility for an unauthorized method/module/role triple.");
    }

    expect(result.issues.some((issue) => issue.code === "METHOD_MODULE_INCOMPATIBLE")).toBe(true);
  });

  test("collects every applicable issue in a single call rather than stopping at the first", () => {
    const result = validateCompatibility({
      moduleId: "strength",
      methodId: "straight_sets_repetitions",
      role: "primary",
      capabilities: makeCapabilities({
        status: "unsupported",
        supportedMethodIds: [],
        durationEstimationProfileId: null,
      }),
    });

    if (result.compatible) {
      throw new Error("Expected multiple simultaneous incompatibilities.");
    }

    const codes = result.issues.map((issue) => issue.code);
    expect(codes).toContain("EXERCISE_CAPABILITIES_UNSUPPORTED");
    expect(codes).toContain("EXERCISE_METHOD_UNSUPPORTED");
    expect(codes).toContain("EXERCISE_DURATION_PROFILE_MISSING");
  });

  test("determinism: identical input produces an identical result", () => {
    const input = {
      moduleId: "strength" as const,
      methodId: "straight_sets_repetitions" as const,
      role: "primary" as const,
      capabilities: makeCapabilities(),
    };

    expect(validateCompatibility(input)).toEqual(validateCompatibility(input));
  });
});
