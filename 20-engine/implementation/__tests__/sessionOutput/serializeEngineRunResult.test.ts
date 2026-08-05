/**
 * Combat Athlete System — Public Session Output Serializer Tests
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { runEngine } from "../../index";
import { serializeEngineRunResult } from "../../sessionOutput/serializeEngineRunResult";
import type { ExercisePrescriptionSource } from "../../prescription/buildPrescriptionInput";
import type { PrescribeExerciseInput } from "../../prescription/prescribeExercise";
import { getExercisePrescriptionSource } from "../../prescription/exercisePrescriptionRegistry";
import type { EngineRunResult, ExerciseDefinition } from "../../types";

import { makeExercise, makeValidInput } from "../fixtures";
import { makeCapabilities, makeOneRepMaxReference, makePrescribeExerciseInput } from "../prescription/fixtures";
import { buildScenario, FIXTURE_GENERATED_AT } from "../../scripts/generateCasSessionOutputFixture";

const FIXED_GENERATED_AT = "2026-01-15T09:00:00.000Z";

function toSource(input: PrescribeExerciseInput): ExercisePrescriptionSource {
  const { exerciseId: _exerciseId, moduleId: _moduleId, ...source } = input;
  return source;
}

// Banned *keys* — never scanned as substrings of legitimate string values
// (e.g. `decisionTrace.entries[].inputReferences` legitimately contains the
// string "readiness" as a reference to `EngineInput.readiness`; an id can
// legitimately contain the substring "summary". Only an actual JSON
// *property name* matching one of these is a violation.
const BANNED_PRESENTATION_KEYS = ["label", "adaptations", "summary", "appliedConstraints", "combatSchedule"];
const BANNED_INTERNAL_KEYS = [
  "rawScore",
  "finalScore",
  "breakdown",
  "fatigueProfile",
  "contraindications",
  "eligibilityResults",
  "scoredExercises",
  "exerciseResults",
];

function collectAllKeys(value: unknown, into: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectAllKeys(item, into);
    }
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      into.add(key);
      collectAllKeys(nested, into);
    }
  }
}

function assertNoBannedContent(output: unknown): void {
  const keys = new Set<string>();
  collectAllKeys(output, keys);

  for (const bannedKey of [...BANNED_PRESENTATION_KEYS, ...BANNED_INTERNAL_KEYS]) {
    expect(keys.has(bannedKey)).toBe(false);
  }
  // `readiness` as an *object key* (the invented `{ level, label }` shape)
  // is banned; `readiness` as a plain string *value* inside
  // `inputReferences` (a legitimate reference to `EngineInput.readiness`)
  // is not — so this is checked as a key, not a substring of the JSON text.
  expect(keys.has("readiness")).toBe(false);
}

describe("serializeEngineRunResult — outcome: invalid_input", () => {
  test("carries only validation, decisionTrace and an empty exerciseReferences", () => {
    const input = makeValidInput({
      medicalState: { trainingClearanceStatus: "not_cleared", painReports: [], restrictions: [] },
    });

    const result = runEngine(input, []);
    if (result.outcome !== "invalid_input") {
      throw new Error(`Expected outcome "invalid_input" but received "${result.outcome}".`);
    }

    const output = serializeEngineRunResult(result, [], FIXED_GENERATED_AT);

    expect(output.contractVersion).toBe("cas-session-output.v1");
    expect(output.engineVersion).toBe("0.1");
    expect(output.generatedAt).toBe(FIXED_GENERATED_AT);
    expect(output.outcome).toBe("invalid_input");
    expect(output.validation.valid).toBe(false);
    expect(output.exerciseReferences).toEqual({});
    expect("selectedModules" in output).toBe(false);
    expect("sessionDraft" in output).toBe(false);
    expect("blockedReason" in output).toBe(false);
    expect("prescription" in output).toBe(false);
    assertNoBannedContent(output);
  });
});

describe("serializeEngineRunResult — outcome: blocked", () => {
  test("carries selectedModules and a typed blockedReason, never blockedSession", () => {
    const input = makeValidInput();
    const exercise = makeExercise({ id: "exercise-other-module", module: "conditioning", primaryAdaptation: "conditioning" });

    const result = runEngine(input, [exercise]);
    if (result.outcome !== "blocked") {
      throw new Error(`Expected outcome "blocked" but received "${result.outcome}".`);
    }

    const output = serializeEngineRunResult(result, [exercise], FIXED_GENERATED_AT);
    if (output.outcome !== "blocked") {
      throw new Error("Expected serialized outcome \"blocked\".");
    }

    expect(output.blockedReason.reasonCode).toBe("NO_PRIMARY_MODULE_EXERCISE_AVAILABLE");
    expect(output.blockedReason.message).toBe(result.sessionResult.reason);
    expect(output.blockedReason.blockedModules).toEqual(result.sessionResult.blockedModules);
    expect(output.selectedModules.length).toBeGreaterThan(0);
    expect("sessionDraft" in output).toBe(false);
    expect("prescription" in output).toBe(false);
    assertNoBannedContent(output);
  });
});

describe("serializeEngineRunResult — outcome: draft", () => {
  test("draft with an unregistered exercise: sessionDraft present, prescription reports the gap", () => {
    const input = makeValidInput();
    const exercise = makeExercise();

    const result = runEngine(input, [exercise]);
    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }

    const output = serializeEngineRunResult(result, [exercise], FIXED_GENERATED_AT);
    if (output.outcome !== "draft") {
      throw new Error("Expected serialized outcome \"draft\".");
    }

    expect(output.sessionDraft.sessionId).toBe(result.sessionDraft.sessionId);
    expect(output.sessionDraft.title).toBe(result.sessionDraft.title);
    expect(output.sessionDraft.primaryObjective.adaptationDomain).toBe(result.sessionDraft.primaryObjective.adaptationDomain);
    expect(output.sessionDraft.confidence).toBe(result.sessionDraft.confidence);
    // Prescription now always runs; a synthetic exercise has no registry
    // entry, so the public output carries a structured gap instead of
    // omitting the key.
    expect(output.prescription?.status).toBe("unavailable");
    expect(output.prescription?.unprescribedSelectedExercises?.map((gap) => gap.exerciseId)).toEqual([exercise.id]);
    // No unselected candidate, no full ExerciseDefinition, ever embedded in the public draft.
    for (const module of output.sessionDraft.modules) {
      for (const selectedExercise of module.exercises) {
        expect(Object.keys(selectedExercise)).toEqual(["exerciseId", "selectionReasons"]);
      }
    }
    assertNoBannedContent(output);
  });

  test("+ prescribed: a real pilot registry exercise prescribes end to end", () => {
    const input = makeValidInput();
    const exercise = makeExercise({ id: "bench_press" });

    const sourceResult = getExercisePrescriptionSource("bench_press", {
      rangeContext: "normal",
      athleteReferences: [makeOneRepMaxReference({ value: 100 })],
      availableEquipmentCapabilities: ["barbell", "bench", "rack", "plates"],
    });
    if (!sourceResult.ok) {
      throw new Error(`Fixture setup failed: ${sourceResult.message}`);
    }
    const prescriptionSources = new Map([["bench_press", sourceResult.source]]);

    const result = runEngine(input, [exercise], prescriptionSources);
    if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft.");
    }

    const output = serializeEngineRunResult(result, [exercise], FIXED_GENERATED_AT);
    if (output.outcome !== "draft" || output.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed serialized draft.");
    }

    const [prescribedExercise] = output.prescription.session.exercises;
    expect(prescribedExercise?.prescription.exerciseId).toBe("bench_press");
    expect(prescribedExercise?.prescription.methodId).toBe("straight_sets_repetitions");

    // Prescription structures survive a JSON round-trip unchanged (point 4/5 of the architecture).
    const roundTripped = JSON.parse(JSON.stringify(output));
    expect(roundTripped.prescription).toStrictEqual(JSON.parse(JSON.stringify(output.prescription)));
    expect(output.exerciseReferences["bench_press"]).toEqual({ displayName: exercise.name });
    assertNoBannedContent(output);
  });

  test("+ unavailable: missingSourceData is preserved, never invented", () => {
    const input = makeValidInput();
    const exercise = makeExercise();

    const result = runEngine(input, [exercise], new Map());
    if (result.outcome !== "draft" || result.prescription?.status !== "unavailable") {
      throw new Error("Expected an unavailable prescription.");
    }

    const output = serializeEngineRunResult(result, [exercise], FIXED_GENERATED_AT);
    if (output.outcome !== "draft" || output.prescription?.status !== "unavailable") {
      throw new Error("Expected an unavailable serialized prescription.");
    }

    expect(output.prescription.missingSourceData).toHaveLength(1);
    expect(output.prescription.missingSourceData[0]?.exerciseId).toBe(exercise.id);
    expect(output.exerciseReferences[exercise.id]).toEqual({ displayName: exercise.name });
    assertNoBannedContent(output);
  });

  test("+ failed: failedExerciseIds is derived, exerciseResults is never exposed", () => {
    const input = makeValidInput();
    const exercise = makeExercise();

    const incompatibleSource = toSource(
      makePrescribeExerciseInput({
        exerciseId: exercise.id,
        moduleId: "strength",
        capabilities: makeCapabilities({ exerciseId: exercise.id, supportedMethodIds: ["timed_isometric_sets"] }),
      }),
    );
    const result = runEngine(input, [exercise], new Map([[exercise.id, incompatibleSource]]));
    if (result.outcome !== "draft" || result.prescription?.status !== "failed") {
      throw new Error("Expected a failed prescription.");
    }

    const output = serializeEngineRunResult(result, [exercise], FIXED_GENERATED_AT);
    if (output.outcome !== "draft" || output.prescription?.status !== "failed") {
      throw new Error("Expected a failed serialized prescription.");
    }

    expect(output.prescription.failure.issues.length).toBeGreaterThan(0);
    expect(output.prescription.failure.failedExerciseIds).toContain(exercise.id);
    assertNoBannedContent(output);
  });

  test("exerciseReferences excludes a scored-but-unselected candidate", () => {
    const input = makeValidInput();
    const primary = makeExercise({ id: "primary-exercise" });
    const backup = makeExercise({ id: "backup-exercise" });
    const pool: ExerciseDefinition[] = [primary, backup];

    const result = runEngine(input, pool);
    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }
    // Both candidates were scored for the same module — proves the pool has an alternative CAS considered.
    expect(result.scoredExercises.length).toBe(2);

    const output = serializeEngineRunResult(result, pool, FIXED_GENERATED_AT);
    if (output.outcome !== "draft") {
      throw new Error("Expected serialized outcome \"draft\".");
    }

    const referencedIds = Object.keys(output.exerciseReferences);
    const selectedIds = output.sessionDraft.modules.flatMap((module) => module.exercises.map((exercise) => exercise.exerciseId));

    expect(referencedIds).toEqual([...selectedIds].sort());
    expect(referencedIds.length).toBe(1);
    expect(["primary-exercise", "backup-exercise"]).toContain(referencedIds[0]);
  });
});

describe("serializeEngineRunResult — per-exercise estimated duration", () => {
  /** The fixture scenario, which prescribes end to end and therefore always carries an estimate. */
  function prescribedRun() {
    const { input, exercises } = buildScenario();
    const result = runEngine(input, exercises);
    if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
      throw new Error("Expected the scenario to produce a prescribed draft.");
    }
    return { result, exercises };
  }

  function prescribedOutput(result: EngineRunResult, exercises: readonly ExerciseDefinition[]) {
    const output = serializeEngineRunResult(result, [...exercises], FIXED_GENERATED_AT);
    if (output.outcome !== "draft" || output.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed serialized draft.");
    }
    return output.prescription.session.exercises;
  }

  test("publishes the estimate the engine computed — never a recomputation", () => {
    const { result, exercises } = prescribedRun();
    const estimates = result.durationEstimate?.exerciseEstimates;
    if (estimates === undefined) {
      throw new Error("Expected runEngine to attach a duration estimate to a prescribed draft.");
    }

    const serialized = prescribedOutput(result, exercises);
    expect(serialized.length).toBe(estimates.length);

    serialized.forEach((prescribedExercise, index) => {
      const estimate = estimates[index];
      if (estimate === undefined || !estimate.ok) {
        throw new Error("Expected every exercise in this scenario to be estimable.");
      }
      // Same exercise, and the very same number — no second arithmetic.
      expect(estimate.exerciseId).toBe(prescribedExercise.prescription.exerciseId);
      expect(prescribedExercise.estimatedDurationSeconds).toBe(estimate.totalSeconds);
      expect(Number.isInteger(prescribedExercise.estimatedDurationSeconds)).toBe(true);
      expect(prescribedExercise.estimatedDurationSeconds).toBeGreaterThan(0);
    });
  });

  test("publishes the same seconds the decision trace already states", () => {
    const { result, exercises } = prescribedRun();
    const serialized = prescribedOutput(result, exercises);

    const durationEntry = result.decisionTrace.entries.find((entry) =>
      entry.id.endsWith("_duration_estimation"),
    );
    if (durationEntry === undefined) {
      throw new Error("Expected a duration estimation trace entry.");
    }

    // The explanation a consumer can read and the number it can display are
    // the same estimate, so they can never contradict each other.
    for (const prescribedExercise of serialized) {
      expect(durationEntry.reasons).toContainEqual(
        expect.stringContaining(
          `${prescribedExercise.prescription.exerciseId}: ${prescribedExercise.estimatedDurationSeconds}s`,
        ),
      );
    }
  });

  test("an exercise the estimator could not measure carries no key at all", () => {
    const { result, exercises } = prescribedRun();
    const estimate = result.durationEstimate;
    if (estimate === undefined) {
      throw new Error("Expected a duration estimate.");
    }

    const unestimable: EngineRunResult = {
      ...result,
      durationEstimate: {
        ...estimate,
        totalMinutes: null,
        totalSeconds: null,
        exerciseEstimates: estimate.exerciseEstimates.map((exerciseEstimate) => ({
          ok: false as const,
          exerciseId: exerciseEstimate.exerciseId,
          failureCode: "UNSUPPORTED_VOLUME_STRUCTURE" as const,
          message: "test: not estimable",
        })),
      },
    };

    for (const prescribedExercise of prescribedOutput(unestimable, exercises)) {
      // Absent, not zero and not null: CAS states no duration rather than a wrong one.
      expect("estimatedDurationSeconds" in prescribedExercise).toBe(false);
    }
  });

  test("an estimate describing a different exercise is never published beside these doses", () => {
    const { result, exercises } = prescribedRun();
    const estimate = result.durationEstimate;
    if (estimate === undefined) {
      throw new Error("Expected a duration estimate.");
    }

    const misaligned: EngineRunResult = {
      ...result,
      durationEstimate: {
        ...estimate,
        exerciseEstimates: estimate.exerciseEstimates.map((exerciseEstimate) => ({
          ...exerciseEstimate,
          exerciseId: "some-other-exercise",
        })),
      },
    };

    for (const prescribedExercise of prescribedOutput(misaligned, exercises)) {
      expect("estimatedDurationSeconds" in prescribedExercise).toBe(false);
    }
  });

  test("a result carrying no estimate serializes exactly as it did before the field existed", () => {
    const { result, exercises } = prescribedRun();
    const { durationEstimate: _durationEstimate, ...withoutEstimate } = result;

    const serialized = prescribedOutput(withoutEstimate, exercises);
    expect(serialized.length).toBeGreaterThan(0);
    for (const prescribedExercise of serialized) {
      expect("estimatedDurationSeconds" in prescribedExercise).toBe(false);
    }
    expect(JSON.stringify(serialized)).not.toContain("estimatedDurationSeconds");
  });
});

describe("serializeEngineRunResult — determinism and isolation", () => {
  test("identical inputs and a fixed generatedAt produce byte-identical JSON", () => {
    const input = makeValidInput();
    const exercise = makeExercise();
    const result = runEngine(input, [exercise]);
    if (result.outcome !== "draft") {
      throw new Error("Expected outcome \"draft\".");
    }

    const first = serializeEngineRunResult(result, [exercise], FIXED_GENERATED_AT);
    const second = serializeEngineRunResult(result, [exercise], FIXED_GENERATED_AT);

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  test("never leaks internal-only fields (contraindications, fatigue profile, score breakdown)", () => {
    const input = makeValidInput();
    const exercise = makeExercise({
      contraindications: [{ description: "MARKER_CONTRAINDICATION_TEXT", absolute: true }],
    });

    const result = runEngine(input, [exercise]);
    if (result.outcome !== "draft") {
      throw new Error("Expected outcome \"draft\".");
    }
    // Confirm the marker genuinely exists on the internal result before proving it is stripped.
    expect(JSON.stringify(result)).toContain("MARKER_CONTRAINDICATION_TEXT");

    const output = serializeEngineRunResult(result, [exercise], FIXED_GENERATED_AT);
    assertNoBannedContent(output);
    expect(JSON.stringify(output)).not.toContain("MARKER_CONTRAINDICATION_TEXT");
  });
});

describe("serializeEngineRunResult — versioned fixture consistency", () => {
  test("cas-session-output-v1.sample.json matches a fresh in-memory regeneration exactly (never writes to disk)", () => {
    const { input, exercises } = buildScenario();
    const result = runEngine(input, exercises);
    if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
      throw new Error("Expected the fixture scenario to produce a prescribed draft.");
    }

    const regenerated = serializeEngineRunResult(result, exercises, FIXTURE_GENERATED_AT);

    const fixturePath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "sessionOutput",
      "fixtures",
      "cas-session-output-v1.sample.json",
    );
    const committedFixture = JSON.parse(readFileSync(fixturePath, "utf-8"));
    // Compared in JSON terms, not raw-object terms: an optional field the
    // serializer leaves as an own property with value `undefined` (e.g. an
    // absent `confidence` on a trace entry) is indistinguishable from an
    // absent key once written as JSON — which is the actual public contract.
    const regeneratedAsJson = JSON.parse(JSON.stringify(regenerated));

    expect(regeneratedAsJson).toStrictEqual(committedFixture);
  });
});
