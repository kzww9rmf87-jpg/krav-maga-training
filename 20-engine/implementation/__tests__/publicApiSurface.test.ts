/**
 * Combat Athlete System — Public API Surface Tests
 *
 * The boundary is only real if it is enforced. These tests fail when an
 * internal symbol reaches the public surface — by a careless `export *`, by
 * a re-export added for convenience, or by a type that drags an internal one
 * along with it.
 *
 * Three independent checks, because each catches something the others miss:
 *
 * - RUNTIME: what does `import * as publicApi` actually contain? Catches a
 *   value export, which is the only kind that can carry behavior or mutable
 *   state.
 * - SOURCE: what does `publicApi.ts` name? Catches a TYPE export, which
 *   vanishes at runtime and would otherwise be invisible here.
 * - REACHABILITY: does the compiler accept a consumer written against the
 *   public surface alone? Catches a contract field whose type is not
 *   exported, which would force a consumer to reach inward.
 */

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import * as publicApi from "../publicApi";
import {
  CAS_ENGINE_VERSION,
  CAS_SESSION_INPUT_CONTRACT_VERSION,
  CAS_SESSION_OUTPUT_CONTRACT_VERSION,
  generateCasSession,
} from "../publicApi";
import type {
  CasSessionInputV1,
  CasSessionOutputV1,
  EquipmentType,
  Rating5,
} from "../publicApi";

const readSource = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf-8");

/**
 * Symbols that must never be reachable from the public API. Each is
 * something a consumer holding it would be able to misuse: an internal
 * input shape, the engine's own catalog, a registry, or a decision CAS
 * makes for itself.
 */
const FORBIDDEN_SYMBOLS: readonly string[] = [
  "runEngine",
  "EngineInput",
  "EXERCISE_KNOWLEDGE_BASE",
  "ExerciseDefinition",
  "EXERCISE_PRESCRIPTION_REGISTRY",
  "NUMERICAL_PRESCRIPTION_PROFILES",
  "EQUIPMENT_CAPABILITY_IDS",
  "EquipmentCapabilityId",
  "RangeContext",
  "ReadinessLevel",
  "validateEngineInput",
  "validatePilotRegistry",
  "ScoredExercise",
  "ExerciseSelectionResult",
  "SessionComposition",
  "ExercisePrescriptionSource",
  "PrescriptionExecutionContext",
  "DURATION_ESTIMATION_PROFILES",
  "estimateSessionDuration",
  "deriveEquipmentCapabilities",
  "deriveRangeContext",
  "deriveAthleteReferences",
  "adaptCasSessionInput",
  "serializeEngineRunResult",
];

describe("public API — runtime surface", () => {
  test("exports exactly one function and the three version constants", () => {
    expect(Object.keys(publicApi).sort()).toEqual([
      "CAS_ENGINE_VERSION",
      "CAS_SESSION_INPUT_CONTRACT_VERSION",
      "CAS_SESSION_OUTPUT_CONTRACT_VERSION",
      "generateCasSession",
    ]);
  });

  test("the only exported value that is callable is the entry point", () => {
    const callables = Object.entries(publicApi).filter(([, value]) => typeof value === "function");
    expect(callables.map(([name]) => name)).toEqual(["generateCasSession"]);
  });

  test("no forbidden symbol is reachable at runtime", () => {
    for (const symbol of FORBIDDEN_SYMBOLS) {
      expect(Object.keys(publicApi), symbol).not.toContain(symbol);
    }
  });

  test("nothing mutable is exposed — the constants are primitives", () => {
    for (const [name, value] of Object.entries(publicApi)) {
      if (typeof value === "function") {
        continue;
      }
      expect(typeof value, name).toBe("string");
    }
  });
});

describe("public API — source surface", () => {
  const source = readSource("../publicApi.ts");

  /** Export statements only, with the file's prose stripped. */
  const exportedNames = (() => {
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const names = new Set<string>();
    for (const match of code.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
      for (const raw of match[1].split(",")) {
        const name = raw.trim().split(/\s+as\s+/)[0].trim();
        if (name.length > 0) {
          names.add(name);
        }
      }
    }
    for (const match of code.matchAll(/export\s+const\s+(\w+)/g)) {
      names.add(match[1]);
    }
    return names;
  })();

  test("no forbidden symbol is named, including as a type-only export", () => {
    for (const symbol of FORBIDDEN_SYMBOLS) {
      expect([...exportedNames], symbol).not.toContain(symbol);
    }
  });

  test("it never re-exports a whole internal module", () => {
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    // `export *` would silently adopt whatever that module adds later.
    expect(code).not.toMatch(/export\s+\*/);
  });

  test("every public contract shape is exported", () => {
    const shapesOf = (relative: string): string[] =>
      [...readSource(relative).matchAll(/^export (?:interface|type) (Cas\w+V1|ExerciseReferenceV1)\b/gm)].map(
        (match) => match[1],
      );

    for (const shape of [
      ...shapesOf("../sessionInput/types.ts"),
      ...shapesOf("../sessionOutput/types.ts"),
    ]) {
      expect([...exportedNames], shape).toContain(shape);
    }
  });
});

describe("public API — version constants match what the engine emits", () => {
  test("the constants are not stale literals", () => {
    const serializer = readSource("../sessionOutput/serializeEngineRunResult.ts");
    expect(serializer).toContain(`contractVersion: "${CAS_SESSION_OUTPUT_CONTRACT_VERSION}"`);
    expect(serializer).toContain(`engineVersion: "${CAS_ENGINE_VERSION}"`);
  });

  test("a real output carries exactly these versions", () => {
    const output = generateCasSession(makeMinimalInput(), "2026-01-15T09:00:00.000Z");

    expect(output.contractVersion).toBe(CAS_SESSION_OUTPUT_CONTRACT_VERSION);
    expect(output.engineVersion).toBe(CAS_ENGINE_VERSION);
  });

  test("the input constant is the value the contract requires", () => {
    const input: CasSessionInputV1 = makeMinimalInput();
    expect(input.contractVersion).toBe(CAS_SESSION_INPUT_CONTRACT_VERSION);
  });
});

describe("public API — a consumer needs nothing else", () => {
  /**
   * Written using only imports from `../publicApi`. If a contract field
   * required a type this surface does not export, this would not compile.
   */
  test("a session can be built, sent and read through the public surface alone", () => {
    const equipment: readonly EquipmentType[] = ["bodyweight", "barbell", "bench", "rack", "plates"];
    const energy: Rating5 = 3;

    const input: CasSessionInputV1 = {
      contractVersion: CAS_SESSION_INPUT_CONTRACT_VERSION,
      athleteProfile: {
        identity: { athleteId: "athlete-1", age: 30 },
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
      medicalState: { trainingClearanceStatus: "cleared", painReports: [], restrictions: [] },
      readiness: {
        energy,
        motivation: 3,
        sleepQuality: 3,
        stress: 3,
        soreness: 3,
        perceivedRecovery: 3,
      },
      trainingHistory: { recentSessions: [] },
      environment: {
        locationType: "gym",
        availableEquipment: equipment.map((type) => ({ type })),
        availableSpace: "large",
        floorSafe: true,
      },
      request: {
        requestId: "request-1",
        requestedAt: "2026-01-15T08:00:00.000Z",
        durationMinutes: 45,
        primaryObjective: { adaptationDomain: "maximum_strength" },
      },
    };

    const output: CasSessionOutputV1 = generateCasSession(input, "2026-01-15T09:00:00.000Z");

    if (output.outcome !== "draft") {
      throw new Error(`Expected a draft, got "${output.outcome}".`);
    }

    // Reading a session for display uses only public types.
    for (const sessionModule of output.sessionDraft.modules) {
      for (const exercise of sessionModule.exercises) {
        expect(output.exerciseReferences[exercise.exerciseId]?.displayName).toBeTruthy();
      }
    }
  });

  test("an invalid request is readable through the public surface too", () => {
    const output = generateCasSession({} as never, "2026-01-15T09:00:00.000Z");

    if (output.outcome !== "invalid_input") {
      throw new Error("Expected invalid_input.");
    }
    expect(output.validation.issues.length).toBeGreaterThan(0);
  });
});

function makeMinimalInput(): CasSessionInputV1 {
  return {
    contractVersion: CAS_SESSION_INPUT_CONTRACT_VERSION,
    athleteProfile: {
      identity: { athleteId: "athlete-1", age: 30 },
      experience: { generalTrainingLevel: "intermediate" },
      goals: [{ id: "g", name: "Strength", adaptationDomain: "maximum_strength", priority: "primary" }],
    },
    medicalState: { trainingClearanceStatus: "cleared", painReports: [], restrictions: [] },
    readiness: { energy: 3, motivation: 3, sleepQuality: 3, stress: 3, soreness: 3, perceivedRecovery: 3 },
    trainingHistory: { recentSessions: [] },
    environment: {
      locationType: "gym",
      availableEquipment: [{ type: "bodyweight" }, { type: "barbell" }, { type: "bench" }, { type: "rack" }, { type: "plates" }],
      availableSpace: "moderate",
      floorSafe: true,
    },
    request: {
      requestId: "request-1",
      requestedAt: "2026-01-15T08:00:00.000Z",
      durationMinutes: 45,
      primaryObjective: { adaptationDomain: "maximum_strength" },
    },
  };
}
