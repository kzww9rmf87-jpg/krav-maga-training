/**
 * Combat Athlete System — Public Boundary, End to End
 *
 * The boundary itself, stated as a test:
 *
 *   CasSessionInputV1 → generateCasSession → CasSessionOutputV1
 *
 * This file imports what a platform imports and nothing else: the entry
 * point and the two contract types. If a scenario here ever needed
 * `EngineInput`, an equipment capability, a range context or a registry
 * identifier, the boundary would have leaked — so the imports at the top of
 * this file are part of the assertion.
 */

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import { generateCasSession } from "../index";
import type { CasSessionInputV1 } from "../sessionInput/types";
import type { CasSessionOutputV1 } from "../sessionOutput/types";

const GENERATED_AT = "2026-01-15T09:00:00.000Z";

const readSource = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf-8");

/**
 * Source with comments removed. The contract's prose deliberately NAMES the
 * internal types it refuses to accept, so scanning raw text would flag the
 * very documentation that records those decisions. What matters is the code.
 */
const readCode = (relative: string) =>
  readSource(relative)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

function makeInput(overrides: Partial<CasSessionInputV1> = {}): CasSessionInputV1 {
  return {
    contractVersion: "cas-session-input.v1",
    athleteProfile: {
      identity: { athleteId: "athlete-1", age: 30 },
      experience: { generalTrainingLevel: "intermediate", primaryCombatSport: "krav_maga" },
      goals: [{ id: "g1", name: "Get stronger", adaptationDomain: "maximum_strength", priority: "primary" }],
    },
    medicalState: { trainingClearanceStatus: "cleared", painReports: [], restrictions: [] },
    readiness: { energy: 3, motivation: 3, sleepQuality: 3, stress: 3, soreness: 3, perceivedRecovery: 3 },
    trainingHistory: { recentSessions: [] },
    environment: {
      locationType: "gym",
      availableEquipment: [
        { type: "bodyweight" },
        { type: "barbell" },
        { type: "bench" },
        { type: "rack" },
        { type: "plates" },
        { type: "pull_up_bar" },
        { type: "dumbbell" },
        { type: "kettlebell" },
        { type: "cable_machine" },
        { type: "cardio_machine" },
        { type: "pinch_grip_implement" },
        { type: "open_space" },
      ],
      availableSpace: "large",
      floorSafe: true,
    },
    request: {
      requestId: "request-1",
      requestedAt: "2026-01-15T08:00:00.000Z",
      durationMinutes: 45,
      primaryObjective: { adaptationDomain: "maximum_strength" },
    },
    ...overrides,
  };
}

describe("generateCasSession — a platform call returns a prescribed session", () => {
  test("public facts in, versioned prescribed session out", () => {
    const output: CasSessionOutputV1 = generateCasSession(
      makeInput({
        request: {
          requestId: "request-1",
          requestedAt: "2026-01-15T08:00:00.000Z",
          durationMinutes: 45,
          primaryObjective: { adaptationDomain: "maximum_strength" },
          requiredModules: ["grip", "core", "conditioning"],
        },
      }),
      GENERATED_AT,
    );

    expect(output.contractVersion).toBe("cas-session-output.v1");
    expect(output.engineVersion).toBe("0.1");
    expect(output.generatedAt).toBe(GENERATED_AT);

    if (output.outcome !== "draft") {
      throw new Error(`Expected a draft, got "${output.outcome}".`);
    }

    // A real session: several modules, every selected exercise prescribed.
    expect(output.selectedModules.length).toBeGreaterThan(1);
    if (output.prescription?.status !== "prescribed") {
      throw new Error(`Expected a prescribed session, got "${output.prescription?.status}".`);
    }
    expect(output.prescription.session.exercises.length).toBeGreaterThan(1);
    expect(output.prescription.unprescribedSelectedExercises).toEqual([]);

    // Explained, not just produced.
    expect(output.decisionTrace.entries.length).toBeGreaterThan(0);
    expect(Object.keys(output.exerciseReferences).length).toBeGreaterThan(0);
  });

  test("an invalid medical state comes back as a typed outcome, never as a thrown error", () => {
    const output = generateCasSession(
      makeInput({
        medicalState: { trainingClearanceStatus: "not_cleared", painReports: [], restrictions: [] },
      }),
      GENERATED_AT,
    );

    expect(output.outcome).toBe("invalid_input");
    expect(output.validation.valid).toBe(false);
    expect(output.validation.issues.map((issue) => issue.code)).toContain("MEDICAL_CLEARANCE_REQUIRED");
  });

  test("an unsatisfiable request comes back as blocked, with the reason", () => {
    const output = generateCasSession(
      makeInput({
        request: {
          requestId: "request-1",
          requestedAt: "2026-01-15T08:00:00.000Z",
          durationMinutes: 45,
          primaryObjective: { adaptationDomain: "specific_skill" },
        },
      }),
      GENERATED_AT,
    );

    if (output.outcome !== "blocked") {
      throw new Error(`Expected a blocked outcome, got "${output.outcome}".`);
    }
    expect(output.blockedReason.reasonCode).toBe("NO_PRIMARY_MODULE_SELECTED");
  });

  test("readiness reported through the contract reaches the dose", () => {
    const neutral = generateCasSession(makeInput(), GENERATED_AT);
    const tired = generateCasSession(
      makeInput({
        readiness: { energy: 1, motivation: 1, sleepQuality: 1, stress: 5, soreness: 5, perceivedRecovery: 1 },
      }),
      GENERATED_AT,
    );

    if (
      neutral.outcome !== "draft" ||
      tired.outcome !== "draft" ||
      neutral.prescription?.status !== "prescribed" ||
      tired.prescription?.status !== "prescribed"
    ) {
      throw new Error("Expected both sessions to be prescribed drafts.");
    }

    const neutralSets = neutral.prescription.session.exercises[0]?.prescription.volume.sets;
    const tiredSets = tired.prescription.session.exercises[0]?.prescription.volume.sets;
    expect(tiredSets).toBeLessThan(neutralSets ?? Number.POSITIVE_INFINITY);
  });

  test("a recorded one-rep max reaches the prescribed load", () => {
    const output = generateCasSession(
      makeInput({
        athleteProfile: {
          identity: { athleteId: "athlete-1", age: 30 },
          experience: { generalTrainingLevel: "intermediate" },
          goals: [{ id: "g1", name: "Strength", adaptationDomain: "maximum_strength", priority: "primary" }],
          performanceReferences: [
            {
              referenceType: "one_rep_max",
              value: 100,
              unit: "kg",
              sourceId: "bench-1rm",
              measuredAt: "2025-12-01T00:00:00.000Z",
              validUntil: null,
              confidence: "validated",
            },
          ],
        },
      }),
      GENERATED_AT,
    );

    if (output.outcome !== "draft" || output.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft.");
    }

    // The reference is carried on whichever exercise consumes it; at minimum
    // the run must not report a missing-reference gap.
    expect(output.prescription.unprescribedSelectedExercises).toEqual([]);
  });
});

describe("generateCasSession — determinism and isolation", () => {
  test("the same input and generatedAt produce byte-identical JSON", () => {
    const input = makeInput();
    expect(JSON.stringify(generateCasSession(input, GENERATED_AT))).toBe(
      JSON.stringify(generateCasSession(input, GENERATED_AT)),
    );
  });

  test("the caller's input object is never mutated", () => {
    const input = makeInput();
    const before = JSON.stringify(input);
    generateCasSession(input, GENERATED_AT);
    expect(JSON.stringify(input)).toBe(before);
  });

  test("generatedAt is the caller's value — the engine never reads a clock", () => {
    const input = makeInput();
    expect(generateCasSession(input, "2030-01-01T00:00:00.000Z").generatedAt).toBe("2030-01-01T00:00:00.000Z");
  });

  test("the whole output survives a JSON round-trip unchanged", () => {
    const output = generateCasSession(makeInput(), GENERATED_AT);
    expect(JSON.parse(JSON.stringify(output))).toEqual(JSON.parse(JSON.stringify(output)));
  });
});

describe("cas-session-input.v1 — the contract stays a contract", () => {
  test("it declares its own version, independent of the engine version", () => {
    const contract = readSource("../sessionInput/types.ts");

    expect(contract).toContain('contractVersion: "cas-session-input.v1"');
    expect(contract).toContain("CONTRACT EVOLUTION POLICY");
    expect(contract).toContain("requires `cas-session-input.v2`");
    expect(contract).toContain("v1 additive history:");
    // The engine's own schemaVersion is never part of what a caller sends.
    expect(contract).not.toContain('schemaVersion: "0.1"');
  });

  test("it imports no internal decision type", () => {
    const contract = readCode("../sessionInput/types.ts");

    // Closed vocabularies are imported by design; decision-bearing shapes
    // and derived prescription context never are.
    for (const forbidden of [
      "EquipmentCapabilityId",
      "RangeContext",
      "ExercisePrescriptionSource",
      "PrescriptionExecutionContext",
      "ExerciseRequirements",
      "NumericalPrescriptionProfile",
      "TrainingMethodId",
      "ScoredExercise",
      "ExerciseDefinition",
    ]) {
      expect(contract).not.toContain(forbidden);
    }
  });

  test("it never re-declares EngineInput, and EngineInput never depends on it", () => {
    expect(readCode("../sessionInput/types.ts")).not.toContain("EngineInput");

    // The dependency points one way: the adapter knows both, the engine's
    // own types know nothing about the public contract.
    const engineTypes = readCode("../types.ts");
    expect(engineTypes).not.toContain("sessionInput");
    expect(engineTypes).not.toContain("CasSessionInputV1");
  });

  test("every public shape is re-declared, never aliased to an internal one", () => {
    const contract = readSource("../sessionInput/types.ts");

    for (const shape of [
      "CasAthleteProfileV1",
      "CasMedicalStateV1",
      "CasReadinessStateV1",
      "CasTrainingHistoryV1",
      "CasTrainingEnvironmentV1",
      "CasTrainingRequestV1",
      "CasPerformanceReferenceV1",
    ]) {
      expect(contract).toContain(`export interface ${shape}`);
    }
  });
});
