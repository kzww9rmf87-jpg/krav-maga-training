/**
 * Combat Athlete System — `runEngine` Integration Tests
 *
 * Exercises `runEngine` exclusively through its public API. Assertions
 * favor observable outcomes (discriminant, modules, exercise IDs,
 * conflicts, resolutions, trace stages, invariants) over exact reason
 * text, full-trace snapshots or hard-coded scores. Branch narrowing uses
 * plain `if (result.outcome !== "...") throw ...` guards so TypeScript
 * understands the branch naturally — no casts anywhere in this file.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { EXERCISE_KNOWLEDGE_BASE, runEngine } from "../index";
import { EXERCISE_KNOWLEDGE_BASE as EXERCISE_KNOWLEDGE_BASE_DIRECT } from "../exerciseKnowledgeBase";

import {
  NEXT_COMBAT_SESSION_AT,
  makeAthleteProfile,
  makeEnvironment,
  makeExercise,
  makeMedicalState,
  makeRequest,
  makeValidInput,
} from "./fixtures";

describe("runEngine", () => {
  test("1. an invalid input stops immediately after validation", () => {
    const input = makeValidInput({
      medicalState: makeMedicalState({ trainingClearanceStatus: "not_cleared" }),
    });

    const result = runEngine(input, []);

    if (result.outcome !== "invalid_input") {
      throw new Error(`Expected outcome "invalid_input" but received "${result.outcome}".`);
    }

    expect(result.validation.valid).toBe(false);
    expect(result.decisionTrace.entries.length).toBe(1);
    expect(result.decisionTrace.entries[0].stage).toBe("input_validation");
    expect(result.decisionTrace.detectedConflicts.length).toBe(0);
    expect(result.decisionTrace.conflictResolutions.length).toBe(0);
    expect(result.decisionTrace.rejectedExercises.length).toBe(0);
  });

  test("2. a specific_skill objective without required modules blocks before any module is selected", () => {
    const input = makeValidInput({
      request: makeRequest({ primaryObjective: { adaptationDomain: "specific_skill" } }),
    });

    const result = runEngine(input, []);

    if (result.outcome !== "blocked") {
      throw new Error(`Expected outcome "blocked" but received "${result.outcome}".`);
    }

    expect(result.selectedModules.length).toBe(0);
    expect(result.sessionResult.reason).toBe("No primary Capability Module was selected for the session.");
    expect(result.sessionResult.blockedModules.length).toBe(0);
    expect(result.decisionTrace.detectedConflicts.length).toBe(0);
    expect(result.decisionTrace.conflictResolutions.length).toBe(0);

    const stages = result.decisionTrace.entries.map((entry) => entry.stage);
    expect(stages).toEqual(["input_validation", "eligibility_filtering", "session_assembly"]);
  });

  test("3. a primary module with no matching exercise in the pool blocks session generation", () => {
    const input = makeValidInput(); // primary objective "maximum_strength" -> module "strength"
    const exercises = [
      makeExercise({ id: "exercise-other-module", module: "conditioning", primaryAdaptation: "conditioning" }),
    ];

    const result = runEngine(input, exercises);

    if (result.outcome !== "blocked") {
      throw new Error(`Expected outcome "blocked" but received "${result.outcome}".`);
    }

    expect(result.selectedModules.some((selectedModule) => selectedModule.module === "strength")).toBe(true);
    expect(result.sessionResult.reason).toBe(
      "No selected exercise is available for one or more primary Capability Modules.",
    );
    expect(result.sessionResult.blockedModules).toEqual(["strength"]);
    expect(result.decisionTrace.detectedConflicts.length).toBe(0);
    expect(result.decisionTrace.conflictResolutions.length).toBe(0);
  });

  test("4. a valid single-module request produces a draft with the expected exercise, duration and confidence", () => {
    const input = makeValidInput();
    const exercise = makeExercise();

    const result = runEngine(input, [exercise]);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }

    expect(result.sessionDraft.modules.length).toBe(1);

    const [generatedModule] = result.sessionDraft.modules;
    const selectedCandidates = generatedModule.exerciseSelection.candidates.filter(
      (candidate) => candidate.selected,
    );
    expect(selectedCandidates.length).toBe(1);
    expect(selectedCandidates[0].scoredExercise.exercise.id).toBe(exercise.id);

    expect(result.conflicts.length).toBe(0);
    expect(result.conflictResolutions.length).toBe(0);

    expect(result.sessionDraft.estimatedDurationMinutes).toBe(
      (exercise.setupTimeMinutes ?? 0) + (exercise.defaultExerciseDurationMinutes ?? 0),
    );
    expect(result.sessionDraft.confidence).toBe(selectedCandidates[0].scoredExercise.confidence);

    const stages = result.decisionTrace.entries.map((entry) => entry.stage);
    expect(stages).toEqual([
      "input_validation",
      "module_selection",
      "eligibility_filtering",
      "exercise_scoring",
      "session_assembly",
    ]);
  });

  test("5. an exercise whose total duration exceeds the requested duration produces a duration_session conflict", () => {
    const input = makeValidInput({ request: makeRequest({ durationMinutes: 10 }) });
    const exercise = makeExercise({ setupTimeMinutes: 30, defaultExerciseDurationMinutes: 30 });

    const result = runEngine(input, [exercise]);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }

    const durationConflict = result.conflicts.find((conflict) => conflict.id === "duration_session");
    if (durationConflict === undefined) {
      throw new Error("Expected a duration_session conflict.");
    }
    expect(durationConflict.type).toBe("duration");
    expect(durationConflict.resolutionRequired).toBe(true);
    expect(result.conflictResolutions.length).toBe(0);

    const conflictEntry = result.decisionTrace.entries.find(
      (entry) => entry.stage === "conflict_detection" && entry.id === "trace_request-1_conflict_duration_session",
    );
    expect(conflictEntry).toBeDefined();
  });

  test("6. a secondary module with no admissible candidate stays present, empty and flagged — never removed", () => {
    const input = makeValidInput({
      request: makeRequest({ secondaryObjectives: [{ adaptationDomain: "power" }] }),
    });
    const exercise = makeExercise(); // module "strength" only — nothing satisfies "power"

    const result = runEngine(input, [exercise]);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }

    const powerModule = result.sessionDraft.modules.find(
      (generatedModule) => generatedModule.selectedModule.module === "power",
    );
    if (powerModule === undefined) {
      throw new Error("Expected the power module to remain present in the draft.");
    }
    expect(powerModule.exerciseSelection.candidates.length).toBe(0);

    const missingConflict = result.conflicts.find((conflict) => conflict.id === "missing_exercise_power");
    if (missingConflict === undefined) {
      throw new Error("Expected a missing_exercise_power conflict.");
    }
    expect(result.decisionTrace.warnings).toContain(missingConflict.description);
    expect(result.conflictResolutions.length).toBe(0);
  });

  test("7. a combat-recovery conflict with no compatible backup remains unresolved after the single pass", () => {
    const input = makeValidInput({ request: makeRequest({ nextCombatSessionAt: NEXT_COMBAT_SESSION_AT }) });
    const exercise = makeExercise({
      fatigueProfile: {
        types: [],
        neural: 2,
        muscular: 2,
        metabolic: 2,
        connectiveTissue: 2,
        technical: 2,
        recoveryHours: 24, // exceeds the 12-hour window before NEXT_COMBAT_SESSION_AT
      },
    });

    const result = runEngine(input, [exercise]);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }

    const recoveryConflict = result.conflicts.find((conflict) => conflict.id === `combat_recovery_${exercise.id}`);
    expect(recoveryConflict).toBeDefined();
    expect(result.conflictResolutions.length).toBe(0);

    const [generatedModule] = result.sessionDraft.modules;
    const selectedCandidates = generatedModule.exerciseSelection.candidates.filter(
      (candidate) => candidate.selected,
    );
    expect(selectedCandidates.length).toBe(1);
    expect(selectedCandidates[0].scoredExercise.exercise.id).toBe(exercise.id);
  });

  test("8. a resolvable combat-recovery conflict triggers exactly one successful substitution", () => {
    const exerciseA = makeExercise({
      id: "exercise-a",
      fatigueProfile: {
        types: [],
        neural: 2,
        muscular: 2,
        metabolic: 2,
        connectiveTissue: 2,
        technical: 2,
        recoveryHours: 24,
      },
    });
    const exerciseB = makeExercise({
      id: "exercise-b",
      setupTimeMinutes: 3,
      defaultExerciseDurationMinutes: 9,
      fatigueProfile: {
        types: [],
        neural: 2,
        muscular: 2,
        metabolic: 2,
        connectiveTissue: 2,
        technical: 2,
        recoveryHours: 6,
      },
    });

    const input = makeValidInput({
      athleteProfile: makeAthleteProfile({ preferences: { preferredExerciseIds: [exerciseA.id] } }),
      request: makeRequest({ nextCombatSessionAt: NEXT_COMBAT_SESSION_AT }),
    });

    const result = runEngine(input, [exerciseA, exerciseB]);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }

    // Confirm the actual produced scores rather than re-deriving the formula by hand.
    const scoredA = result.scoredExercises.find((scored) => scored.exercise.id === exerciseA.id);
    const scoredB = result.scoredExercises.find((scored) => scored.exercise.id === exerciseB.id);
    if (scoredA === undefined || scoredB === undefined) {
      throw new Error("Expected both candidate exercises to be present in scoredExercises.");
    }
    expect(scoredA.finalScore).toBeGreaterThan(scoredB.finalScore);
    expect(scoredB.finalScore).toBeGreaterThanOrEqual(60);

    const [generatedModule] = result.sessionDraft.modules;
    const candidateA = generatedModule.exerciseSelection.candidates.find(
      (candidate) => candidate.scoredExercise.exercise.id === exerciseA.id,
    );
    const candidateB = generatedModule.exerciseSelection.candidates.find(
      (candidate) => candidate.scoredExercise.exercise.id === exerciseB.id,
    );
    if (candidateA === undefined || candidateB === undefined) {
      throw new Error("Expected both candidates to remain present in the final selection.");
    }

    expect(candidateA.selected).toBe(false);
    expect(candidateB.selected).toBe(true);
    expect(candidateA.selectionReasons).toContain(`Substituted out in favor of exercise "${exerciseB.id}".`);
    expect(candidateB.selectionReasons).toContain(`Selected as a substitute for exercise "${exerciseA.id}".`);

    expect(result.conflictResolutions.length).toBe(1);
    const [resolution] = result.conflictResolutions;
    expect(resolution.action).toBe("substitute_exercise");
    expect(resolution.removedExerciseIds).toEqual([exerciseA.id]);
    expect(resolution.addedExerciseIds).toEqual([exerciseB.id]);

    const remainingRecoveryConflict = result.conflicts.find(
      (conflict) => conflict.id === `combat_recovery_${exerciseA.id}`,
    );
    expect(remainingRecoveryConflict).toBeUndefined();

    expect(result.sessionDraft.estimatedDurationMinutes).toBe(
      (exerciseB.setupTimeMinutes ?? 0) + (exerciseB.defaultExerciseDurationMinutes ?? 0),
    );
    expect(result.sessionDraft.confidence).toBe(scoredB.confidence);

    const resolutionEntry = result.decisionTrace.entries.find((entry) => entry.stage === "conflict_resolution");
    expect(resolutionEntry).toBeDefined();
  });

  test("9. a successful substitution can introduce a new, non-blocking cumulative fatigue conflict", () => {
    const exerciseA = makeExercise({
      id: "exercise-a",
      fatigueProfile: {
        types: [],
        neural: 2,
        muscular: 2,
        metabolic: 2,
        connectiveTissue: 2,
        technical: 2,
        recoveryHours: 24,
      },
    });
    const exerciseB = makeExercise({
      id: "exercise-b",
      setupTimeMinutes: 3,
      defaultExerciseDurationMinutes: 9,
      fatigueProfile: {
        types: ["grip"],
        neural: 2,
        muscular: 2,
        metabolic: 2,
        connectiveTissue: 2,
        technical: 2,
        recoveryHours: 6,
      },
    });
    const exerciseC = makeExercise({
      id: "exercise-c",
      module: "robustness",
      primaryAdaptation: "robustness",
      fatigueProfile: {
        types: ["grip"],
        neural: 2,
        muscular: 2,
        metabolic: 2,
        connectiveTissue: 2,
        technical: 2,
      },
    });

    const input = makeValidInput({
      athleteProfile: makeAthleteProfile({ preferences: { preferredExerciseIds: [exerciseA.id] } }),
      request: makeRequest({
        secondaryObjectives: [{ adaptationDomain: "robustness" }],
        nextCombatSessionAt: NEXT_COMBAT_SESSION_AT,
      }),
    });

    const result = runEngine(input, [exerciseA, exerciseB, exerciseC]);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }

    expect(result.conflictResolutions.length).toBe(1);
    expect(result.conflictResolutions[0].action).toBe("substitute_exercise");

    const gripConflict = result.conflicts.find((conflict) => conflict.id === "cumulative_grip_fatigue");
    if (gripConflict === undefined) {
      throw new Error("Expected a new cumulative_grip_fatigue conflict after substitution.");
    }
    expect(gripConflict.resolutionRequired).toBe(false);
    expect(gripConflict.affectedExerciseIds).toEqual(expect.arrayContaining([exerciseB.id, exerciseC.id]));
  });

  test("10. running the engine twice with the same inputs is deterministic and never mutates them", () => {
    const exerciseA = makeExercise({
      id: "exercise-a",
      fatigueProfile: {
        types: [],
        neural: 2,
        muscular: 2,
        metabolic: 2,
        connectiveTissue: 2,
        technical: 2,
        recoveryHours: 24,
      },
    });
    const exerciseB = makeExercise({
      id: "exercise-b",
      setupTimeMinutes: 3,
      defaultExerciseDurationMinutes: 9,
      fatigueProfile: {
        types: [],
        neural: 2,
        muscular: 2,
        metabolic: 2,
        connectiveTissue: 2,
        technical: 2,
        recoveryHours: 6,
      },
    });

    const input = makeValidInput({
      athleteProfile: makeAthleteProfile({ preferences: { preferredExerciseIds: [exerciseA.id] } }),
      request: makeRequest({ nextCombatSessionAt: NEXT_COMBAT_SESSION_AT }),
    });
    const exercises = [exerciseA, exerciseB];

    const inputBefore = JSON.stringify(input);
    const exercisesBefore = JSON.stringify(exercises);

    const resultA = runEngine(input, exercises);
    const resultB = runEngine(input, exercises);

    expect(resultA).toEqual(resultB);
    expect(JSON.stringify(input)).toBe(inputBefore);
    expect(JSON.stringify(exercises)).toBe(exercisesBefore);
  });
});

describe("runEngine — default exercise catalog wiring", () => {
  test("1. runEngine(input) uses EXERCISE_KNOWLEDGE_BASE by default", () => {
    const input = makeValidInput({
      request: makeRequest({ primaryObjective: { adaptationDomain: "power" } }),
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });

    const result = runEngine(input);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }

    const catalogIds = new Set(EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id));
    const [generatedModule] = result.sessionDraft.modules;
    const selectedCandidates = generatedModule.exerciseSelection.candidates.filter((candidate) => candidate.selected);
    expect(selectedCandidates.length).toBe(1);
    expect(catalogIds.has(selectedCandidates[0].scoredExercise.exercise.id)).toBe(true);
  });

  test("2. runEngine(input, customExercises) uses only the injected catalog, never the default", () => {
    const input = makeValidInput({
      request: makeRequest({ primaryObjective: { adaptationDomain: "power" } }),
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });
    const customExercise = makeExercise({
      id: "custom_power_exercise",
      module: "power",
      primaryAdaptation: "power",
      requiredEquipment: [],
    });

    const result = runEngine(input, [customExercise]);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }

    const [generatedModule] = result.sessionDraft.modules;
    const selectedCandidates = generatedModule.exerciseSelection.candidates.filter((candidate) => candidate.selected);
    expect(selectedCandidates.length).toBe(1);
    expect(selectedCandidates[0].scoredExercise.exercise.id).toBe("custom_power_exercise");
  });

  test("3. an explicit empty array is never silently replaced by the default catalog", () => {
    const input = makeValidInput({
      request: makeRequest({ primaryObjective: { adaptationDomain: "power" } }),
    });

    const result = runEngine(input, []);

    if (result.outcome !== "blocked") {
      throw new Error(`Expected outcome "blocked" but received "${result.outcome}".`);
    }

    expect(result.sessionResult.blockedModules).toEqual(["power"]);
  });

  test("4. the default catalog contains all 7 integrated ballistic exercises plus box_jump", () => {
    const ids = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id);

    expect(ids).toEqual([
      "med_ball_chest_pass",
      "med_ball_slam",
      "med_ball_overhead_throw",
      "med_ball_rotational_throw",
      "med_ball_scoop_toss",
      "med_ball_shot_put_throw",
      "med_ball_reverse_throw",
      "box_jump",
    ]);
  });

  test("5. legacy two-argument calls behave exactly as before this wiring", () => {
    const input = makeValidInput();
    const exercise = makeExercise();

    const result = runEngine(input, [exercise]);

    if (result.outcome !== "draft") {
      throw new Error(`Expected outcome "draft" but received "${result.outcome}".`);
    }

    const [generatedModule] = result.sessionDraft.modules;
    const selectedCandidates = generatedModule.exerciseSelection.candidates.filter((candidate) => candidate.selected);
    expect(selectedCandidates.length).toBe(1);
    expect(selectedCandidates[0].scoredExercise.exercise.id).toBe(exercise.id);
  });

  test("6. never mutates any object in the default catalog during a run", () => {
    const catalogSnapshot = structuredClone(EXERCISE_KNOWLEDGE_BASE);
    const input = makeValidInput({
      request: makeRequest({ primaryObjective: { adaptationDomain: "power" } }),
      environment: makeEnvironment({
        availableEquipment: [{ type: "medicine_ball" }],
        throwingAllowed: true,
        availableSpace: "limited",
        usableWall: true,
      }),
    });

    runEngine(input);

    expect(EXERCISE_KNOWLEDGE_BASE).toEqual(catalogSnapshot);
  });

  test("7. EXERCISE_KNOWLEDGE_BASE is correctly re-exported from the public index API", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toEqual(EXERCISE_KNOWLEDGE_BASE_DIRECT);
    expect(EXERCISE_KNOWLEDGE_BASE).toBe(EXERCISE_KNOWLEDGE_BASE_DIRECT);
  });

  test("8. each call without an explicit catalog receives a fresh array copy, not a shared reference", () => {
    // Not observable as a runtime behavioral difference through runEngine's
    // public API: no pipeline stage ever mutates `exercises` (by
    // architectural invariant — see test 6 above and index.ts's own
    // docstring), so a shared reference and a fresh copy behave identically
    // today. This is a source-level regression guard for the specific
    // implementation choice, which protects against a future change (e.g.
    // introducing a mutating stage) silently starting to corrupt
    // `EXERCISE_KNOWLEDGE_BASE` across calls.
    const indexSourcePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "index.ts");
    const indexSource = readFileSync(indexSourcePath, "utf-8");

    expect(indexSource).toContain("exercises: ExerciseDefinition[] = [...EXERCISE_KNOWLEDGE_BASE]");
  });
});
