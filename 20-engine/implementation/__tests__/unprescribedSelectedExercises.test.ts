/**
 * Combat Athlete System — Selected-but-Unprescribed Exercise Visibility
 *
 * Covers the defect found by the V0.1 end-to-end audit: an exercise
 * selected for a `"secondary"`/`"support"` module that found no prescription
 * source data was dropped from the prescription while the status stayed
 * `"prescribed"`, with no warning and no Decision Trace entry. The only way
 * to notice was to diff `sessionDraft` against
 * `prescription.session.exercises` — a computation CAS must never delegate
 * to its consumer.
 *
 * The principal test below reproduces that exact scenario against the REAL
 * `EXERCISE_KNOWLEDGE_BASE` and the REAL prescription registry, not a
 * synthetic pool: it is the first end-to-end test in the suite to do so for
 * a multi-module session. Its concrete exercise ids are deliberate — if a
 * knowledge-base or registry change alters which exercises this athlete is
 * given, this test failing is the correct signal, not an inconvenience.
 *
 * Nothing here asserts that the omission itself is desirable. The rule that
 * a non-required gap leaves the status at `"prescribed"` is unchanged and
 * out of this lot's scope; only its visibility changed.
 */

import { describe, expect, test } from "vitest";

import { EXERCISE_KNOWLEDGE_BASE, runEngine } from "../index";
import type { EngineInput, ExerciseDefinition, Identifier } from "../types";
import type { ExercisePrescriptionSource } from "../prescription/buildPrescriptionInput";
import type { PrescribeExerciseInput } from "../prescription/prescribeExercise";
import { buildEngineSessionPrescriptionSources } from "../prescription/buildEngineSessionPrescriptionSources";
import { serializeEngineRunResult } from "../sessionOutput/serializeEngineRunResult";
import { collectReferencedExerciseIds } from "../sessionOutput/exerciseReferences";
import type { CasDecisionTraceV1, CasPrescriptionOutcomeV1 } from "../sessionOutput/types";

import { makeAthleteProfile, makeExercise, makeRequest, makeValidInput, REQUESTED_AT } from "./fixtures";
import { makeCapabilities, makePrescribeExerciseInput } from "./prescription/fixtures";

const FIXED_GENERATED_AT = "2026-01-15T09:00:00.000Z";

/** `ExercisePrescriptionSource` is `PrescribeExerciseInput` minus the identifiers `runEngine` already knows. */
function toSource(input: PrescribeExerciseInput): ExercisePrescriptionSource {
  const { exerciseId: _exerciseId, moduleId: _moduleId, ...source } = input;
  return source;
}

// -----------------------------------------------------------------------------
// Real-knowledge-base scenario (the audit reproduction)
// -----------------------------------------------------------------------------

/**
 * Every `EquipmentType` a fully-equipped gym declares. Built from the
 * knowledge base's own vocabulary rather than a hand-written list, so a new
 * `EquipmentType` never silently narrows this scenario's environment.
 */
const FULLY_EQUIPPED_GYM = [
  "bodyweight",
  "barbell",
  "dumbbell",
  "kettlebell",
  "medicine_ball",
  "sandbag",
  "cable_machine",
  "resistance_band",
  "pull_up_bar",
  "dip_bars",
  "bench",
  "rack",
  "plates",
  "sled",
  "rope",
  "towel",
  "box",
  "mat",
  "heavy_bag",
  "cardio_machine",
  "rowing_ergometer",
  "open_space",
  "wall",
  "trap_bar",
  "plyometric_box",
  "ab_wheel",
  "pinch_grip_implement",
  "slam_ball",
  "rigid_anchor_support",
  "knee_protection_pad",
  "farmer_handle",
  "battle_rope",
  "rope_anchor_point",
] as const;

/**
 * A barbell-gym capability set that deliberately omits
 * `cable_or_band_resistance` and `cardio_machine`. This is not a contrived
 * restriction: `PrescriptionExecutionContext.availableEquipmentCapabilities`
 * uses a different vocabulary from `TrainingEnvironment.availableEquipment`
 * (`EquipmentCapabilityId` vs `EquipmentType`, with no mapping between them
 * in V0.1), so an athlete whose environment declares a cable machine can
 * still end up without the capability that `pallof_press` requires. That
 * mismatch is exactly what produced the audit's silent drop.
 */
const BARBELL_GYM_CAPABILITIES: readonly Identifier[] = [
  "barbell",
  "bench",
  "rack",
  "plates",
  "dumbbell",
  "kettlebell",
  "pull_up_bar",
  "mat",
  "open_space",
];

function makeRealKnowledgeBaseInput(): EngineInput {
  return makeValidInput({
    // A combat athlete, not the bare fixture default. `primaryCombatSport`
    // feeds `transferValue` scoring, and without it the `core` module ranks
    // the bodyweight-only `hollow_body_hold` first — which prescribes fine
    // and hides the very gap this scenario exists to reproduce.
    athleteProfile: makeAthleteProfile({
      experience: { generalTrainingLevel: "intermediate", primaryCombatSport: "krav_maga" },
    }),
    environment: {
      locationType: "gym",
      availableEquipment: FULLY_EQUIPPED_GYM.map((type) => ({ type })),
      availableSpace: "large",
      usableWall: true,
      throwingAllowed: true,
      jumpingAllowed: true,
      sprintingAllowed: true,
      floorSafe: true,
      partnerAvailable: true,
    },
    request: makeRequest({
      requestId: "audit-lot-1",
      durationMinutes: 45,
      primaryObjective: { adaptationDomain: "maximum_strength" },
      requiredModules: ["grip", "core", "conditioning"],
    }),
  });
}

/**
 * Runs the real scenario the way a caller must today: one pass to learn
 * which exercises were selected, then a source lookup, then the real run.
 * (Collapsing this into a single call is Lot 2/4 work, not this lot's.)
 */
function runRealKnowledgeBaseScenario() {
  const input = makeRealKnowledgeBaseInput();

  const draftOnly = runEngine(input);
  if (draftOnly.outcome !== "draft") {
    throw new Error(`Expected a draft from the real knowledge base, got "${draftOnly.outcome}".`);
  }

  const selectedExerciseIds = draftOnly.sessionDraft.modules.flatMap((generatedModule) =>
    generatedModule.exerciseSelection.candidates
      .filter((candidate) => candidate.selected)
      .map((candidate) => candidate.scoredExercise.exercise.id),
  );

  const { sources } = buildEngineSessionPrescriptionSources(selectedExerciseIds, {
    rangeContext: "normal",
    athleteReferences: [],
    availableEquipmentCapabilities: BARBELL_GYM_CAPABILITIES,
  });

  const result = runEngine(input, undefined, sources);
  if (result.outcome !== "draft") {
    throw new Error(`Expected a draft, got "${result.outcome}".`);
  }

  return { input, sources, selectedExerciseIds, result };
}

describe("selected-but-unprescribed exercises — real knowledge base end to end", () => {
  test("the audit scenario: two support exercises are omitted, and every omission is explicit", () => {
    const { selectedExerciseIds, result } = runRealKnowledgeBaseScenario();

    // 1. Several exercises are present in the session draft.
    expect(selectedExerciseIds).toEqual([
      "chest_supported_row",
      "plate_pinch",
      "pallof_press",
      "assault_bike_intervals",
    ]);

    if (result.prescription?.status !== "prescribed") {
      throw new Error(`Expected status "prescribed", got "${result.prescription?.status}".`);
    }

    // 2. + 3. The primary exercise is prescribed; support exercises are not.
    const prescribedIds = result.prescription.session.exercises.map(
      (prescribedExercise) => prescribedExercise.prescription.exerciseId,
    );
    expect(prescribedIds).toEqual(["chest_supported_row", "plate_pinch"]);

    // 4. The status deliberately stays "prescribed" — unchanged by this lot.
    expect(result.prescription.status).toBe("prescribed");

    // 5. + 7. + 8. The omitted exercises are named, with role and exact code.
    expect(result.prescription.unprescribedSelectedExercises).toEqual([
      {
        exerciseId: "pallof_press",
        moduleId: "core",
        required: false,
        reasonCode: "PRESCRIPTION_SOURCE_NOT_PROVIDED",
        reason:
          'No prescription source data (role, capabilities, instructions, stop conditions, athlete references, load profile) is available for exercise "pallof_press".',
      },
      {
        exerciseId: "assault_bike_intervals",
        moduleId: "conditioning",
        required: false,
        reasonCode: "PRESCRIPTION_SOURCE_NOT_PROVIDED",
        reason:
          'No prescription source data (role, capabilities, instructions, stop conditions, athlete references, load profile) is available for exercise "assault_bike_intervals".',
      },
    ]);

    // 14. Exactly the exercises missing from the prescription are reported —
    // no more, no fewer. This is the assertion that would have caught the
    // original defect.
    const omittedIds = result.prescription.unprescribedSelectedExercises.map((gap) => gap.exerciseId);
    expect([...prescribedIds, ...omittedIds].sort()).toEqual([...selectedExerciseIds].sort());

    // 9. Each omission has its own Decision Trace entry.
    for (const exerciseId of omittedIds) {
      const omissionEntry = result.decisionTrace.entries.find(
        (entry) => entry.id === `trace_audit-lot-1_prescription_generation_${exerciseId}_omitted`,
      );
      if (omissionEntry === undefined) {
        throw new Error(`Expected an omission trace entry for "${exerciseId}".`);
      }
      expect(omissionEntry.stage).toBe("prescription_generation");
      expect(omissionEntry.decision).toBe(
        `Exercise "${exerciseId}" was selected but omitted from the prescription.`,
      );
      expect(omissionEntry.reasons).toContain("reasonCode: PRESCRIPTION_SOURCE_NOT_PROVIDED.");
      expect(omissionEntry.reasons).toContain("required: false.");
      expect(omissionEntry.affectedExerciseIds).toEqual([exerciseId]);
    }

    // 10. Warnings are consistent with the decision — one per omission.
    expect(result.decisionTrace.warnings).toEqual([
      'Exercise "pallof_press" (module "core") was selected for this session but could not be prescribed (PRESCRIPTION_SOURCE_NOT_PROVIDED).',
      'Exercise "assault_bike_intervals" (module "conditioning") was selected for this session but could not be prescribed (PRESCRIPTION_SOURCE_NOT_PROVIDED).',
    ]);
  });

  test("6. + 11. the public output carries the omission, so no consumer has to diff anything", () => {
    const { result } = runRealKnowledgeBaseScenario();

    const output = serializeEngineRunResult(result, [...EXERCISE_KNOWLEDGE_BASE], FIXED_GENERATED_AT);
    if (output.outcome !== "draft" || output.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed serialized draft.");
    }

    expect(output.contractVersion).toBe("cas-session-output.v1");

    // The field is optional on the public type (backward compatibility), so
    // its presence on a freshly serialized output is a runtime guarantee
    // the compiler no longer checks — it is asserted here instead.
    const omissions = output.prescription.unprescribedSelectedExercises;
    if (omissions === undefined) {
      throw new Error("A freshly serialized output must always carry unprescribedSelectedExercises.");
    }
    expect(omissions.map((gap) => gap.exerciseId)).toEqual(["pallof_press", "assault_bike_intervals"]);

    // The omitted exercises are still visible in the session draft — this
    // lot removes nothing from the athlete's session.
    const draftIds = output.sessionDraft.modules.flatMap((sessionModule) =>
      sessionModule.exercises.map((exercise) => exercise.exerciseId),
    );
    expect(draftIds).toContain("pallof_press");
    expect(draftIds).toContain("assault_bike_intervals");

    // Every omitted exercise resolves to a display name, so a consumer can
    // render it without reaching into any engine-internal catalog.
    for (const gap of omissions) {
      expect(output.exerciseReferences[gap.exerciseId]).toBeDefined();
    }

    expect(output.decisionTrace.warnings).toHaveLength(2);
  });

  test("12. + 13. the scenario is deterministic and never mutates the knowledge base", () => {
    const knowledgeBaseBefore = JSON.stringify(EXERCISE_KNOWLEDGE_BASE);

    const first = runRealKnowledgeBaseScenario().result;
    const second = runRealKnowledgeBaseScenario().result;

    const serializedFirst = JSON.stringify(
      serializeEngineRunResult(first, [...EXERCISE_KNOWLEDGE_BASE], FIXED_GENERATED_AT),
    );
    const serializedSecond = JSON.stringify(
      serializeEngineRunResult(second, [...EXERCISE_KNOWLEDGE_BASE], FIXED_GENERATED_AT),
    );

    expect(serializedFirst).toBe(serializedSecond);
    expect(JSON.stringify(EXERCISE_KNOWLEDGE_BASE)).toBe(knowledgeBaseBefore);
  });
});

// -----------------------------------------------------------------------------
// Gap-shape coverage (synthetic pools — one condition each)
// -----------------------------------------------------------------------------

/** A `"strength"` primary exercise plus `count` `"conditioning"` support exercises. */
function makeSupportScenario(count: number): {
  input: EngineInput;
  exercises: ExerciseDefinition[];
  primary: ExerciseDefinition;
  supports: ExerciseDefinition[];
} {
  const primary = makeExercise({ id: "primary-exercise" });
  const supports = Array.from({ length: count }, (_unused, index) =>
    makeExercise({
      id: `support-exercise-${index + 1}`,
      module: "conditioning",
      primaryAdaptation: "conditioning",
      // Distinct complexity keeps the ranking deterministic without relying
      // on the id tie-break.
      complexity: index === 0 ? "very_low" : "low",
    }),
  );

  const input = makeValidInput({
    request: makeRequest({ requiredModules: ["conditioning"] }),
  });

  return { input, exercises: [primary, ...supports], primary, supports };
}

describe("selected-but-unprescribed exercises — gap shapes", () => {
  test("zero gaps: the field is present and empty, never absent", () => {
    const input = makeValidInput();
    const exercise = makeExercise();
    const sources = new Map<Identifier, ExercisePrescriptionSource>([
      [exercise.id, toSource(makePrescribeExerciseInput({ exerciseId: exercise.id, moduleId: "strength" }))],
    ]);

    const result = runEngine(input, [exercise], sources);
    if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft.");
    }

    expect(result.prescription.unprescribedSelectedExercises).toEqual([]);
    expect("unprescribedSelectedExercises" in result.prescription).toBe(true);

    // No omission means no omission warning and no omission trace entry.
    expect(result.decisionTrace.warnings).toEqual([]);
    expect(result.decisionTrace.entries.filter((entry) => entry.id.endsWith("_omitted"))).toEqual([]);
  });

  test("one non-required gap: reported, status stays prescribed", () => {
    const { input, exercises, primary } = makeSupportScenario(1);
    const sources = new Map<Identifier, ExercisePrescriptionSource>([
      [primary.id, toSource(makePrescribeExerciseInput({ exerciseId: primary.id, moduleId: "strength" }))],
    ]);

    const result = runEngine(input, exercises, sources);
    if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
      throw new Error(`Expected a prescribed draft from outcome "${result.outcome}".`);
    }

    expect(result.prescription.unprescribedSelectedExercises).toHaveLength(1);
    const [gap] = result.prescription.unprescribedSelectedExercises;
    expect(gap?.exerciseId).toBe("support-exercise-1");
    expect(gap?.moduleId).toBe("conditioning");
    expect(gap?.required).toBe(false);
    expect(gap?.reasonCode).toBe("PRESCRIPTION_SOURCE_NOT_PROVIDED");
    expect(result.decisionTrace.warnings).toHaveLength(1);
  });

  test("several non-required gaps: all reported, in session-draft order, without duplicates", () => {
    const { input, exercises, primary } = makeSupportScenario(2);
    const sources = new Map<Identifier, ExercisePrescriptionSource>([
      [primary.id, toSource(makePrescribeExerciseInput({ exerciseId: primary.id, moduleId: "strength" }))],
    ]);

    const result = runEngine(input, exercises, sources);
    if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft.");
    }

    // Only one exercise is selected per module, so a single conditioning
    // support gap is expected even with two candidates in the pool.
    const gapIds = result.prescription.unprescribedSelectedExercises.map((gap) => gap.exerciseId);
    expect(gapIds).toEqual(["support-exercise-1"]);
    expect(new Set(gapIds).size).toBe(gapIds.length);
  });

  test("a required gap: status is unavailable, and the gap appears in both fields", () => {
    const input = makeValidInput();
    const exercise = makeExercise();

    const result = runEngine(input, [exercise], new Map());
    if (result.outcome !== "draft" || result.prescription?.status !== "unavailable") {
      throw new Error("Expected an unavailable prescription.");
    }

    expect(result.prescription.missingSourceData).toHaveLength(1);
    expect(result.prescription.missingSourceData[0]?.required).toBe(true);

    // `missingSourceData` explains the status; the new field is the
    // complete omission record. For a purely required gap they agree.
    expect(result.prescription.unprescribedSelectedExercises).toEqual(result.prescription.missingSourceData);
    expect(result.decisionTrace.warnings).toHaveLength(1);
  });

  test("mixed required + non-required gaps: nothing disappears", () => {
    const { input, exercises } = makeSupportScenario(1);

    // No source for either exercise: the primary gap drives the status, the
    // support gap would previously have vanished entirely.
    const result = runEngine(input, exercises, new Map());
    if (result.outcome !== "draft" || result.prescription?.status !== "unavailable") {
      throw new Error("Expected an unavailable prescription.");
    }

    expect(result.prescription.missingSourceData.map((gap) => gap.exerciseId)).toEqual(["primary-exercise"]);
    expect(result.prescription.unprescribedSelectedExercises.map((gap) => gap.exerciseId)).toEqual([
      "primary-exercise",
      "support-exercise-1",
    ]);
    expect(result.prescription.unprescribedSelectedExercises.map((gap) => gap.required)).toEqual([true, false]);

    // Both omissions are traced and warned about — the required one included.
    expect(result.decisionTrace.entries.filter((entry) => entry.id.endsWith("_omitted"))).toHaveLength(2);
    expect(result.decisionTrace.warnings).toHaveLength(2);
  });

  test("a failed prescription still reports its non-required gaps", () => {
    const { input, exercises, primary } = makeSupportScenario(1);

    // Capabilities that do not support the method the module/role resolves
    // to — the primary exercise has source data but cannot be prescribed.
    const incompatibleSource = toSource(
      makePrescribeExerciseInput({
        exerciseId: primary.id,
        moduleId: "strength",
        capabilities: makeCapabilities({ exerciseId: primary.id, supportedMethodIds: ["timed_isometric_sets"] }),
      }),
    );

    const result = runEngine(input, exercises, new Map([[primary.id, incompatibleSource]]));
    if (result.outcome !== "draft" || result.prescription?.status !== "failed") {
      throw new Error(`Expected a failed prescription from outcome "${result.outcome}".`);
    }

    expect(result.prescription.unprescribedSelectedExercises.map((gap) => gap.exerciseId)).toEqual([
      "support-exercise-1",
    ]);
  });

  test("EXERCISE_NOT_IN_REGISTRY is never claimed for an exercise the caller simply did not supply", () => {
    // `pallof_press` IS in the prescription registry — it resolves to no
    // source only because this context declares no cable/band capability.
    // Reporting `EXERCISE_NOT_IN_REGISTRY` here would be a fabrication, so
    // the engine reports what it actually observed instead.
    const { result } = runRealKnowledgeBaseScenario();
    if (result.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft.");
    }

    for (const gap of result.prescription.unprescribedSelectedExercises) {
      expect(gap.reasonCode).toBe("PRESCRIPTION_SOURCE_NOT_PROVIDED");
    }
  });
});

// -----------------------------------------------------------------------------
// Unchanged behavior
// -----------------------------------------------------------------------------

describe("selected-but-unprescribed exercises — unchanged behavior", () => {
  test("runEngine without prescriptionSources gains no prescription field and no omission warning", () => {
    const input = makeValidInput();
    const exercise = makeExercise();

    const result = runEngine(input, [exercise]);
    if (result.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }

    expect("prescription" in result).toBe(false);
    expect(result.decisionTrace.warnings).toEqual([]);
    expect(result.decisionTrace.entries.filter((entry) => entry.id.endsWith("_omitted"))).toEqual([]);
  });

  test("invalid_input and blocked outcomes are untouched", () => {
    const invalidResult = runEngine(
      makeValidInput({
        medicalState: { trainingClearanceStatus: "not_cleared", painReports: [], restrictions: [] },
      }),
      [],
    );
    expect(invalidResult.outcome).toBe("invalid_input");
    expect("prescription" in invalidResult).toBe(false);

    const blockedResult = runEngine(makeValidInput(), [
      makeExercise({ id: "other-module", module: "conditioning", primaryAdaptation: "conditioning" }),
    ]);
    expect(blockedResult.outcome).toBe("blocked");
    expect("prescription" in blockedResult).toBe(false);
  });

  test("the omission record never exposes prescription-source internals", () => {
    const { result } = runRealKnowledgeBaseScenario();
    if (result.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft.");
    }

    const output = serializeEngineRunResult(result, [...EXERCISE_KNOWLEDGE_BASE], FIXED_GENERATED_AT);
    if (output.outcome !== "draft" || output.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed serialized draft.");
    }

    const omissions = output.prescription.unprescribedSelectedExercises ?? [];
    expect(omissions.length).toBeGreaterThan(0);
    for (const gap of omissions) {
      expect(Object.keys(gap).sort()).toEqual(["exerciseId", "moduleId", "reason", "reasonCode", "required"]);
    }

    // Structural markers only — words like "capabilities" and "athlete
    // references" legitimately appear inside `reason`'s prose, so scanning
    // for them would flag the message rather than a leak. The exact
    // `Object.keys` assertion above is the real containment check; these
    // are identifiers that could only appear if an internal object had been
    // spliced in.
    const serialized = JSON.stringify(omissions);
    for (const bannedKey of [
      "supportedMethodIds",
      "instructionDefinitions",
      "stopConditionDefinitions",
      "numericalProfileId",
      "loadRounding",
      "stack",
    ]) {
      expect(serialized).not.toContain(bannedKey);
    }
  });

  test("the serializer always emits the optional fields, even when nothing was omitted", () => {
    const input = makeValidInput();
    const exercise = makeExercise();
    const sources = new Map<Identifier, ExercisePrescriptionSource>([
      [exercise.id, toSource(makePrescribeExerciseInput({ exerciseId: exercise.id, moduleId: "strength" }))],
    ]);

    const result = runEngine(input, [exercise], sources);
    if (result.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }

    const output = serializeEngineRunResult(result, [exercise], FIXED_GENERATED_AT);
    if (output.outcome !== "draft" || output.prescription === undefined) {
      throw new Error("Expected a serialized draft carrying a prescription.");
    }

    // The type says optional; the serializer's contract says always. Asserted
    // on the JSON, so an accidentally-dropped key cannot pass by being
    // `undefined` on the object.
    const asJson = JSON.parse(JSON.stringify(output.prescription)) as Record<string, unknown>;
    expect(Object.keys(asJson)).toContain("unprescribedSelectedExercises");
    expect(asJson["unprescribedSelectedExercises"]).toEqual([]);
  });

  test("the serializer emits reasonCode on every gap it produces", () => {
    const { result } = runRealKnowledgeBaseScenario();
    const output = serializeEngineRunResult(result, [...EXERCISE_KNOWLEDGE_BASE], FIXED_GENERATED_AT);
    if (output.outcome !== "draft" || output.prescription === undefined) {
      throw new Error("Expected a serialized draft carrying a prescription.");
    }

    const gaps = JSON.parse(JSON.stringify(output.prescription.unprescribedSelectedExercises ?? [])) as Record<
      string,
      unknown
    >[];
    expect(gaps.length).toBeGreaterThan(0);
    for (const gap of gaps) {
      expect(Object.keys(gap)).toContain("reasonCode");
      expect(gap["reasonCode"]).toBe("PRESCRIPTION_SOURCE_NOT_PROVIDED");
    }
  });

  test("the request timestamp still drives every omission entry — no wall clock", () => {
    const { result } = runRealKnowledgeBaseScenario();

    const omissionEntries = result.decisionTrace.entries.filter((entry) => entry.id.endsWith("_omitted"));
    expect(omissionEntries.length).toBeGreaterThan(0);
    for (const entry of omissionEntries) {
      expect(entry.timestamp).toBe(REQUESTED_AT);
    }
  });
});

// -----------------------------------------------------------------------------
// Backward type compatibility with v1 objects that predate the new fields
// -----------------------------------------------------------------------------

/**
 * Every object below is a valid `cas-session-output.v1` prescription outcome
 * as it could have been written, persisted or fixtured BEFORE 2026-08-03 —
 * no `unprescribedSelectedExercises`, no `reasonCode`. They are typed as
 * `CasPrescriptionOutcomeV1` with no cast: if either field were required,
 * this file would stop compiling, which is exactly the break the optional
 * declarations exist to prevent. These are compile-time assertions first and
 * runtime assertions second.
 */
describe("selected-but-unprescribed exercises — backward v1 compatibility", () => {
  const legacyPrescribed: CasPrescriptionOutcomeV1 = {
    status: "prescribed",
    session: {
      sessionId: "legacy-session",
      sessionName: "Legacy Session",
      modules: ["strength"],
      exercises: [],
      sourceRuleIds: [],
      status: "complete",
    },
  };

  const legacyUnavailable: CasPrescriptionOutcomeV1 = {
    status: "unavailable",
    missingSourceData: [
      // No `reasonCode` — exactly how v1 recorded a gap before this change.
      { exerciseId: "legacy-gap", moduleId: "strength", required: true, reason: "legacy reason" },
    ],
  };

  const legacyFailed: CasPrescriptionOutcomeV1 = {
    status: "failed",
    failure: {
      sessionId: "legacy-session",
      issues: [
        { code: "SESSION_REQUIRED_EXERCISE_FAILED", message: "m", exerciseId: "legacy-failed", recoverable: false },
      ],
      failedExerciseIds: ["legacy-failed"],
      omittedOptionalExerciseIds: [],
      sourceRuleIds: [],
    },
  };

  const EMPTY_LEGACY_TRACE: CasDecisionTraceV1 = {
    traceId: "legacy-trace",
    entries: [],
    rejectedExercises: [],
    detectedConflicts: [],
    conflictResolutions: [],
    warnings: [],
  };

  test("a prescribed object without the field type-checks and reads as empty", () => {
    expect(legacyPrescribed.unprescribedSelectedExercises).toBeUndefined();
    expect(legacyPrescribed.unprescribedSelectedExercises ?? []).toEqual([]);
  });

  test("an unavailable object without the field keeps missingSourceData intact", () => {
    if (legacyUnavailable.status !== "unavailable") {
      throw new Error("Expected an unavailable outcome.");
    }
    expect(legacyUnavailable.unprescribedSelectedExercises).toBeUndefined();
    expect(legacyUnavailable.missingSourceData).toHaveLength(1);
    expect(legacyUnavailable.missingSourceData[0]?.reasonCode).toBeUndefined();
    expect(legacyUnavailable.missingSourceData[0]?.reason).toBe("legacy reason");
  });

  test("a failed object without the field type-checks and reads as empty", () => {
    expect(legacyFailed.unprescribedSelectedExercises).toBeUndefined();
    expect(legacyFailed.unprescribedSelectedExercises ?? []).toEqual([]);
  });

  test("collectReferencedExerciseIds is total over legacy objects — no throw, no undefined id", () => {
    expect(
      collectReferencedExerciseIds({ decisionTrace: EMPTY_LEGACY_TRACE, prescription: legacyPrescribed }),
    ).toEqual([]);

    expect(
      collectReferencedExerciseIds({ decisionTrace: EMPTY_LEGACY_TRACE, prescription: legacyUnavailable }),
    ).toEqual(["legacy-gap"]);

    expect(collectReferencedExerciseIds({ decisionTrace: EMPTY_LEGACY_TRACE, prescription: legacyFailed })).toEqual([
      "legacy-failed",
    ]);
  });

  test("a legacy object mixed with a modern one is handled by the same code path", () => {
    const modern: CasPrescriptionOutcomeV1 = {
      status: "prescribed",
      session: {
        sessionId: "modern-session",
        sessionName: "Modern Session",
        modules: ["core"],
        exercises: [],
        sourceRuleIds: [],
        status: "complete",
      },
      unprescribedSelectedExercises: [
        {
          exerciseId: "modern-gap",
          moduleId: "core",
          required: false,
          reasonCode: "PRESCRIPTION_SOURCE_NOT_PROVIDED",
          reason: "modern reason",
        },
      ],
    };

    expect(collectReferencedExerciseIds({ decisionTrace: EMPTY_LEGACY_TRACE, prescription: modern })).toEqual([
      "modern-gap",
    ]);
    expect(
      collectReferencedExerciseIds({ decisionTrace: EMPTY_LEGACY_TRACE, prescription: legacyPrescribed }),
    ).toEqual([]);
  });
});
