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
  makeReadiness,
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

    // Duration is estimated from the prescription. This synthetic exercise
    // has no registry entry, so there is no dose to time and the engine
    // reports no duration rather than inventing one.
    expect(result.sessionDraft.estimatedDurationMinutes).toBeUndefined();
    expect(result.sessionDraft.confidence).toBe(selectedCandidates[0].scoredExercise.confidence);

    // Prescription now runs on every draft (see `runEngine`'s own
    // `resolveEnginePrescriptionSources`), so the selection stages are a
    // prefix of the trace rather than the whole of it. This synthetic
    // exercise is not in the prescription registry, so the run ends with a
    // structured omission rather than a dose.
    const stages = result.decisionTrace.entries.map((entry) => entry.stage);
    // Selection stages, then the role-aware driver decision that closes
    // composition, then prescription, then the adequacy verdict.
    expect(stages.slice(0, 6)).toEqual([
      "input_validation",
      "module_selection",
      "eligibility_filtering",
      "exercise_scoring",
      "session_assembly",
      // Lot H2.1: securing (or failing to secure) an adaptation driver is a
      // composition decision and is traced as one.
      "session_assembly",
    ]);
    // The trace now ends with `final_validation`: session adequacy is the last
    // question the pipeline asks, and it is asked on every draft.
    expect(
      stages.slice(6).every((stage) => stage === "prescription_generation" || stage === "final_validation"),
    ).toBe(true);
    expect(stages[stages.length - 1]).toBe("final_validation");
  });

  test("5. an exercise whose total duration exceeds the requested duration produces a duration_session conflict", () => {
    // A REAL registry exercise, so the duration comes from a real
    // prescription. Before the duration model existed this conflict was
    // unreachable in production: every estimate was undefined and
    // `detectDurationConflict` returned early.
    const exercise = EXERCISE_KNOWLEDGE_BASE.find((entry) => entry.id === "pummeling");
    if (exercise === undefined) {
      throw new Error("pummeling is expected to exist in the knowledge base.");
    }
    const input = makeValidInput({
      // A combat athlete: without a primary combat sport this exercise's
      // transfer value is neutral and it falls below the selection threshold.
      athleteProfile: makeAthleteProfile({
        experience: { generalTrainingLevel: "intermediate", primaryCombatSport: "krav_maga" },
      }),
      readiness: makeReadiness(),
      environment: {
        locationType: "combat_club",
        availableEquipment: [{ type: "bodyweight" }, { type: "mat" }],
        availableSpace: "large",
        floorSafe: true,
        partnerAvailable: true,
      },
      request: makeRequest({ durationMinutes: 15, primaryObjective: { adaptationDomain: "movement" } }),
    });

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

    expect(result.sessionDraft.estimatedDurationMinutes).toBeUndefined();
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

  test("4. the default catalog contains all 7 integrated ballistic exercises plus box_jump, depth_jump, countermovement_jump, broad_jump, knee_jump, lateral_bound, single_leg_hop, split_squat_jump, push_press, hang_high_pull, hang_power_clean, jump_shrug, the full 65_GRIP chapter (towel_pull_up, plate_pinch, pinch_carry, rope_climb, rope_pull), the full 66_CARRIES chapter (farmer_carry, front_rack_carry, sandbag_carry, zercher_carry), the full 62_CORE chapter batch (ab_wheel, pallof_press, dead_bug, hollow_body_hold, hanging_leg_raise, dragon_flag, suitcase_carry, overhead_carry), the Lot 1 — Force fondamentale bas du corps batch (back_squat, front_squat, trap_bar_deadlift, romanian_deadlift, hip_thrust, bulgarian_split_squat), the Lot 2 — Tirages du haut du corps batch (weighted_pull_up, pull_up, chin_up, barbell_row, chest_supported_row), the Lot 3 — Poussées du haut du corps batch (bench_press, overhead_press, dip, landmine_press), the Lot 4 — Chaine posterieure et robustness batch (nordic_hamstring_curl, copenhagen_plank, tibialis_raise, soleus_raise, rotator_cuff_training, wrist_strengthening, neck_training), the Lot 5 — Ground movement et transitions batch (technical_stand_up, bear_crawl, shrimping, bridging, turkish_get_up), the Lot 6 — Combat striking et deplacements batch (heavy_bag_power_intervals, shadow_boxing, footwork_drills), the Lot 7 — Conditionnement general batch (sled_push, battle_ropes, sprint_intervals, assault_bike_intervals, rowerg_intervals) and the Lot 8 — Combat lutte et grappling debout batch (sprawl, pummeling, wall_wrestling, grip_fighting, shot_entries)", () => {
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
      "depth_jump",
      "countermovement_jump",
      "broad_jump",
      "knee_jump",
      "lateral_bound",
      "single_leg_hop",
      "split_squat_jump",
      "push_press",
      "hang_high_pull",
      "hang_power_clean",
      "jump_shrug",
      "towel_pull_up",
      "plate_pinch",
      "pinch_carry",
      "rope_climb",
      "rope_pull",
      "farmer_carry",
      "front_rack_carry",
      "sandbag_carry",
      "zercher_carry",
      "ab_wheel",
      "pallof_press",
      "dead_bug",
      "hollow_body_hold",
      "hanging_leg_raise",
      "dragon_flag",
      "suitcase_carry",
      "overhead_carry",
      "back_squat",
      "front_squat",
      "trap_bar_deadlift",
      "romanian_deadlift",
      "hip_thrust",
      "bulgarian_split_squat",
      "weighted_pull_up",
      "pull_up",
      "chin_up",
      "barbell_row",
      "chest_supported_row",
      "bench_press",
      "overhead_press",
      "dip",
      "landmine_press",
      "nordic_hamstring_curl",
      "copenhagen_plank",
      "tibialis_raise",
      "soleus_raise",
      "rotator_cuff_training",
      "wrist_strengthening",
      "neck_training",
      "technical_stand_up",
      "bear_crawl",
      "shrimping",
      "bridging",
      "turkish_get_up",
      "heavy_bag_power_intervals",
      "shadow_boxing",
      "footwork_drills",
      "sled_push",
      "battle_ropes",
      "sprint_intervals",
      "assault_bike_intervals",
      "rowerg_intervals",
      "sprawl",
      "pummeling",
      "wall_wrestling",
      "grip_fighting",
      "shot_entries",
      // Functional hypertrophy (Lot H2.2B), appended in catalogue order.
      "push_up",
      "split_squat",
      "single_leg_hip_thrust",
      "goblet_squat",
      "dumbbell_bench_press",
      "one_arm_dumbbell_row",
      "dumbbell_romanian_deadlift",
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
