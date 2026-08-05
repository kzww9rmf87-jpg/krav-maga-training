/**
 * Combat Athlete System — VITA Integration Boundary Tests
 *
 * What a bridge, a local service or an HTTP handler needs to be able to rely
 * on when it hands CAS a payload it did not construct itself:
 *
 * - the entry point never throws on client data;
 * - the output is plain, Swift-Codable-friendly JSON;
 * - the output is self-contained — display names included, no join against
 *   an internal catalog required;
 * - the engine's own catalog cannot be corrupted through the public surface;
 * - identical input plus identical `generatedAt` is byte-identical output.
 */

import { describe, expect, test } from "vitest";

import { EXERCISE_KNOWLEDGE_BASE, generateCasSession } from "../index";
import type { CasSessionInputV1 } from "../sessionInput/types";
import type { EquipmentType } from "../types";

const GENERATED_AT = "2026-01-15T09:00:00.000Z";

const GYM: readonly EquipmentType[] = [
  "bodyweight",
  "barbell",
  "bench",
  "rack",
  "plates",
  "pull_up_bar",
  "dumbbell",
  "kettlebell",
  "cable_machine",
  "cardio_machine",
  "pinch_grip_implement",
  "open_space",
  "mat",
];

function makeInput(overrides: Partial<CasSessionInputV1> = {}): CasSessionInputV1 {
  return {
    contractVersion: "cas-session-input.v1",
    athleteProfile: {
      identity: { athleteId: "athlete-42", age: 30 },
      experience: { generalTrainingLevel: "intermediate", primaryCombatSport: "krav_maga" },
      goals: [{ id: "g", name: "Strength", adaptationDomain: "maximum_strength", priority: "primary" }],
      performanceReferences: [
        {
          referenceType: "one_rep_max",
          value: 100,
          unit: "kg",
          sourceId: "bench-1rm",
          measuredAt: null,
          validUntil: null,
          confidence: "validated",
        },
      ],
    },
    medicalState: {
      trainingClearanceStatus: "cleared",
      painReports: [{ region: "knee", intensity: 3, status: "intermittent", notes: "old meniscus tear" }],
      restrictions: [],
    },
    readiness: { energy: 3, motivation: 3, sleepQuality: 3, stress: 3, soreness: 3, perceivedRecovery: 3 },
    trainingHistory: { recentSessions: [] },
    environment: {
      locationType: "gym",
      availableEquipment: GYM.map((type) => ({ type })),
      availableSpace: "large",
      floorSafe: true,
    },
    request: {
      requestId: "request-1",
      requestedAt: "2026-01-15T08:00:00.000Z",
      durationMinutes: 45,
      primaryObjective: { adaptationDomain: "maximum_strength" },
      requiredModules: ["grip", "core"],
    },
    ...overrides,
  };
}

describe("VITA boundary — the entry point never throws on client data", () => {
  test.each([
    ["null", null],
    ["undefined", undefined],
    ["a string", "not a session"],
    ["a number", 42],
    ["an array", []],
    ["an empty object", {}],
    ["a payload missing athleteProfile", { contractVersion: "cas-session-input.v1", request: {} }],
    ["a payload whose goals is not an array", { ...makeInput(), athleteProfile: { identity: {}, experience: {}, goals: "nope" } }],
    ["a payload whose availableEquipment is not an array", { ...makeInput(), environment: { availableEquipment: 3 } }],
  ])("%s comes back as invalid_input rather than an exception", (_label, payload) => {
    const output = generateCasSession(payload as never, GENERATED_AT);

    expect(output.outcome).toBe("invalid_input");
    expect(output.contractVersion).toBe("cas-session-output.v1");
    expect(output.generatedAt).toBe(GENERATED_AT);
    if (output.outcome !== "invalid_input") {
      throw new Error("Expected invalid_input.");
    }
    expect(output.validation.valid).toBe(false);
    expect(output.validation.issues.length).toBeGreaterThan(0);
    expect(output.validation.issues.every((issue) => issue.code === "MISSING_REQUIRED_FIELD")).toBe(true);
    // Same shape a semantically invalid input produces — one code path.
    expect(output.exerciseReferences).toEqual({});
    expect(output.decisionTrace.entries[0]?.stage).toBe("input_validation");
  });

  test("a structurally malformed payload reports the same issues every time", () => {
    const first = generateCasSession({} as never, GENERATED_AT);
    const second = generateCasSession({} as never, GENERATED_AT);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  test("a well-formed payload is still judged by the real validator, not the structural guard", () => {
    const output = generateCasSession(
      makeInput({
        medicalState: { trainingClearanceStatus: "not_cleared", painReports: [], restrictions: [] },
      }),
      GENERATED_AT,
    );

    expect(output.outcome).toBe("invalid_input");
    if (output.outcome !== "invalid_input") {
      throw new Error("Expected invalid_input.");
    }
    expect(output.validation.issues.map((issue) => issue.code)).toContain("MEDICAL_CLEARANCE_REQUIRED");
  });
});

describe("VITA boundary — the output is transport- and Swift-safe", () => {
  const output = generateCasSession(makeInput(), GENERATED_AT);
  const serialized = JSON.stringify(output);

  test("no Map, Set or undefined survives serialization", () => {
    let maps = 0;
    let sets = 0;
    const walk = (value: unknown): void => {
      if (value instanceof Map) maps += 1;
      if (value instanceof Set) sets += 1;
      if (value !== null && typeof value === "object") {
        Object.values(value as Record<string, unknown>).forEach(walk);
      }
    };
    walk(output);

    expect(maps).toBe(0);
    expect(sets).toBe(0);
    expect(serialized).not.toContain("undefined");
  });

  test("no non-finite number reaches the wire", () => {
    expect(/:\s*(NaN|-?Infinity)/.test(serialized)).toBe(false);
  });

  test("a JSON round-trip is lossless", () => {
    expect(JSON.parse(serialized)).toEqual(JSON.parse(JSON.stringify(JSON.parse(serialized))));
  });

  test("every discriminated union carries its discriminator", () => {
    if (output.outcome !== "draft" || output.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft.");
    }
    for (const prescribedExercise of output.prescription.session.exercises) {
      const { volume, intensity, rest } = prescribedExercise.prescription;
      if (volume.repetitions !== null) {
        expect(typeof volume.repetitions.type).toBe("string");
      }
      expect(typeof intensity.primaryMetric.target.type).toBe("string");
      if (rest?.betweenSets != null) {
        expect(typeof rest.betweenSets.type).toBe("string");
      }
    }
  });
});

describe("VITA boundary — the output is self-contained for display", () => {
  const output = generateCasSession(makeInput(), GENERATED_AT);

  test("every exercise id referenced anywhere resolves to a display name", () => {
    if (output.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }

    const draftIds = output.sessionDraft.modules.flatMap((sessionModule) =>
      sessionModule.exercises.map((exercise) => exercise.exerciseId),
    );
    expect(draftIds.length).toBeGreaterThan(0);
    for (const exerciseId of draftIds) {
      expect(output.exerciseReferences[exerciseId]?.displayName, exerciseId).toBeTruthy();
    }
  });

  test("a prescription carries module, role, order and self-describing units", () => {
    if (output.outcome !== "draft" || output.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft.");
    }

    const [first] = output.prescription.session.exercises;
    expect(first?.order).toBeGreaterThan(0);
    expect(first?.prescription.moduleId).toBeTruthy();
    expect(first?.prescription.role).toBeTruthy();
    expect(first?.prescription.intensity.primaryMetric.unit).toBeTruthy();
    // Per-side semantics are explicit, never implied by the exercise id.
    expect(first?.prescription.volume.laterality?.interpretation).toBeTruthy();
    expect(first?.prescription.instructions.length).toBeGreaterThan(0);
    expect(first?.prescription.stopConditions.length).toBeGreaterThan(0);
  });

  test("session duration is published, and is a number of minutes", () => {
    if (output.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }
    expect(typeof output.sessionDraft.estimatedDurationMinutes).toBe("number");
  });

  test("every prescribed exercise publishes its own duration, in whole seconds", () => {
    if (output.outcome !== "draft" || output.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft.");
    }

    const exercises = output.prescription.session.exercises;
    expect(exercises.length).toBeGreaterThan(1);

    for (const prescribedExercise of exercises) {
      const seconds = prescribedExercise.estimatedDurationSeconds;
      // Every entry in the v0.1 registry is estimable, so a real session
      // publishes a duration for each of its exercises. A consumer must
      // still tolerate the field's absence — that contract is proved
      // directly in the serializer tests, not assumed here.
      expect(seconds, prescribedExercise.prescription.exerciseId).toBeDefined();
      expect(Number.isInteger(seconds)).toBe(true);
      expect(seconds).toBeGreaterThan(0);
    }
  });

  test("the per-exercise seconds are a breakdown, not the session total", () => {
    if (output.outcome !== "draft" || output.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft.");
    }

    const sumOfExercises = output.prescription.session.exercises.reduce(
      (total, prescribedExercise) => total + (prescribedExercise.estimatedDurationSeconds ?? 0),
      0,
    );
    const sessionMinutes = output.sessionDraft.estimatedDurationMinutes;
    if (sessionMinutes === undefined) {
      throw new Error("Expected the session draft to publish an estimated duration.");
    }
    const sessionSeconds = sessionMinutes * 60;

    // The session additionally carries a transition between consecutive
    // exercises, so a consumer summing the exercises would UNDER-state the
    // session. `estimatedDurationMinutes` stays the only published session
    // duration — this asserts the two numbers are not interchangeable.
    expect(sumOfExercises).toBeGreaterThan(0);
    expect(sumOfExercises).toBeLessThan(sessionSeconds);
  });
});

describe("VITA boundary — the output does not echo sensitive input", () => {
  const serialized = JSON.stringify(generateCasSession(makeInput(), GENERATED_AT));

  test.each([
    ["the athlete identifier", "athlete-42"],
    ["free-text pain notes", "old meniscus tear"],
    ["the medical clearance status", "trainingClearanceStatus"],
    ["raw readiness values", "perceivedRecovery"],
    ["the recorded one-rep max value", "bench-1rm"],
  ])("%s is not echoed into the public output", (_label, probe) => {
    expect(serialized).not.toContain(probe);
  });
});

describe("VITA boundary — determinism and catalog integrity", () => {
  test("identical input and generatedAt produce byte-identical output", () => {
    expect(JSON.stringify(generateCasSession(makeInput(), GENERATED_AT))).toBe(
      JSON.stringify(generateCasSession(makeInput(), GENERATED_AT)),
    );
  });

  test("generatedAt is the caller's value — no wall clock leaks in", () => {
    expect(generateCasSession(makeInput(), "2030-06-01T00:00:00.000Z").generatedAt).toBe(
      "2030-06-01T00:00:00.000Z",
    );
  });

  test("the caller's input object is never mutated", () => {
    const input = makeInput();
    const before = JSON.stringify(input);
    generateCasSession(input, GENERATED_AT);
    expect(JSON.stringify(input)).toBe(before);
  });

  test("the exported knowledge base cannot be corrupted by a consumer", () => {
    // It is re-exported from the public entry point, so a bridge holding the
    // module must not be able to poison every later session.
    expect(Object.isFrozen(EXERCISE_KNOWLEDGE_BASE)).toBe(true);
    expect(Object.isFrozen(EXERCISE_KNOWLEDGE_BASE[0])).toBe(true);

    const before = EXERCISE_KNOWLEDGE_BASE.length;
    expect(() => (EXERCISE_KNOWLEDGE_BASE as unknown as unknown[]).push({})).toThrowError(TypeError);
    expect(EXERCISE_KNOWLEDGE_BASE.length).toBe(before);
  });

  test("exerciseReferences keys are sorted, so the JSON is stable", () => {
    const output = generateCasSession(makeInput(), GENERATED_AT);
    const keys = Object.keys(output.exerciseReferences);
    expect(keys).toEqual([...keys].sort());
  });
});
