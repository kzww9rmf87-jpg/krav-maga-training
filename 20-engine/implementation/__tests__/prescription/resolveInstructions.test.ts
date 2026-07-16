import { describe, expect, test } from "vitest";

import { resolveInstructions } from "../../prescription/resolveInstructions";
import { makeInstructionDefinitions, REQUIRED_INSTRUCTION_IDS } from "./fixtures";

describe("resolveInstructions", () => {
  test("resolves every required instruction ordered by priority (critical first)", () => {
    const result = resolveInstructions({
      requiredInstructionIds: [...REQUIRED_INSTRUCTION_IDS],
      definitions: makeInstructionDefinitions(),
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.instructions.map((instruction) => instruction.instructionId)).toEqual([
      "instr-safety",
      "instr-setup",
      "instr-execution",
    ]);
  });

  test("includes an optional instruction that is present in the definitions", () => {
    const result = resolveInstructions({
      requiredInstructionIds: ["instr-safety", "instr-setup"],
      optionalInstructionIds: ["instr-execution"],
      definitions: makeInstructionDefinitions(),
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.resolvedInstructionIds).toContain("instr-execution");
    expect(result.omittedOptionalInstructionIds).toEqual([]);
  });

  test("silently omits an optional instruction that has no matching definition", () => {
    const result = resolveInstructions({
      requiredInstructionIds: ["instr-safety", "instr-setup"],
      optionalInstructionIds: ["instr-unknown-optional"],
      definitions: makeInstructionDefinitions(),
    });

    if (!result.ok) {
      throw new Error(`Expected resolution to succeed, got failure: ${result.message}`);
    }

    expect(result.resolvedInstructionIds).not.toContain("instr-unknown-optional");
    expect(result.omittedOptionalInstructionIds).toEqual(["instr-unknown-optional"]);
  });

  test("fails safely when a required instruction has no matching definition", () => {
    const result = resolveInstructions({
      requiredInstructionIds: ["instr-safety", "instr-missing"],
      definitions: makeInstructionDefinitions(),
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail for a missing required instruction.");
    }

    expect(result.failureCode).toBe("REQUIRED_INSTRUCTION_MISSING");
    expect(result.missingInstructionIds).toEqual(["instr-missing"]);
  });

  test("fails safely when a definition has empty instruction text", () => {
    const definitions = makeInstructionDefinitions().map((definition) =>
      definition.instructionId === "instr-setup" ? { ...definition, text: "   " } : definition,
    );

    const result = resolveInstructions({
      requiredInstructionIds: ["instr-setup"],
      definitions,
    });

    if (result.ok) {
      throw new Error("Expected resolution to fail for an instruction with empty text.");
    }

    expect(result.failureCode).toBe("INSTRUCTION_TEXT_MISSING");
  });

  test("determinism: identical input produces an identical result", () => {
    const input = {
      requiredInstructionIds: [...REQUIRED_INSTRUCTION_IDS],
      definitions: makeInstructionDefinitions(),
    };

    expect(resolveInstructions(input)).toEqual(resolveInstructions(input));
  });

  test("does not mutate its input", () => {
    const input = {
      requiredInstructionIds: [...REQUIRED_INSTRUCTION_IDS],
      definitions: makeInstructionDefinitions(),
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    resolveInstructions(input);

    expect(input).toEqual(snapshot);
  });
});
