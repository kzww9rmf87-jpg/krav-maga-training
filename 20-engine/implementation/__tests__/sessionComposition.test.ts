/**
 * Combat Athlete System — Session Composition Tests
 *
 * The doctrine this lot implements is mostly a set of PROHIBITIONS, so most
 * of what follows asserts what the engine refuses to do:
 *
 * - it never pads a session to fill the requested time
 *   (`18_SESSION_GENERATION_PIPELINE.md`, Minimum Effective Session
 *   Principle);
 * - it never keeps two redundant exercises in a module
 *   (`14_EXERCISE_SELECTION_RULES.md`, Rule 32);
 * - it never surrenders primary work before support work, and never empties
 *   the primary module (`01_MODULE_ENGINE.md`, Principle 1);
 * - it never shortens a dose to fit the clock.
 */

import { describe, expect, test } from "vitest";

import { EXERCISE_KNOWLEDGE_BASE, runEngine } from "../index";
import { EXERCISES_PER_MODULE_ROLE, isRedundantWith } from "../sessionComposer";
import type { EngineInput, EquipmentType, ExerciseDefinition } from "../types";

import { makeAthleteProfile, makeReadiness, makeRequest, makeValidInput } from "./fixtures";

const FULL_GYM: readonly EquipmentType[] = [
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

function makeInput(durationMinutes: number, requiredModules?: EngineInput["request"]["requiredModules"]): EngineInput {
  return makeValidInput({
    athleteProfile: makeAthleteProfile({
      experience: { generalTrainingLevel: "intermediate", primaryCombatSport: "krav_maga" },
      performanceReferences: [
        {
          referenceType: "one_rep_max",
          value: 100,
          unit: "kg",
          sourceId: "1rm",
          measuredAt: null,
          validUntil: null,
          confidence: "validated",
        },
      ],
    }),
    readiness: makeReadiness(),
    environment: {
      locationType: "gym",
      availableEquipment: FULL_GYM.map((type) => ({ type })),
      availableSpace: "large",
      floorSafe: true,
    },
    request: makeRequest({
      requestId: "composition",
      durationMinutes,
      primaryObjective: { adaptationDomain: "maximum_strength" },
      requiredModules,
    }),
  });
}

function composedExerciseIds(input: EngineInput): readonly string[] {
  const result = runEngine(input);
  if (result.outcome !== "draft") {
    throw new Error(`Expected a draft, got "${result.outcome}".`);
  }
  return result.sessionDraft.modules.flatMap((generatedModule) =>
    generatedModule.exerciseSelection.candidates
      .filter((candidate) => candidate.selected)
      .map((candidate) => candidate.scoredExercise.exercise.id),
  );
}

describe("session composition — a session is more than one exercise", () => {
  test("the primary module contributes several exercises, and support modules one each", () => {
    const result = runEngine(makeInput(45, ["grip", "core"]));
    if (result.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }

    const byModule = new Map(
      result.sessionDraft.modules.map((generatedModule) => [
        generatedModule.selectedModule.module,
        generatedModule.exerciseSelection.candidates.filter((candidate) => candidate.selected).length,
      ]),
    );

    expect(byModule.get("strength")).toBe(EXERCISES_PER_MODULE_ROLE.primary);
    expect(byModule.get("grip")).toBe(EXERCISES_PER_MODULE_ROLE.support);
    expect(byModule.get("core")).toBe(EXERCISES_PER_MODULE_ROLE.support);
  });

  test("every composed exercise is prescribed, not just the first of each module", () => {
    const result = runEngine(makeInput(45, ["grip", "core"]));
    if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft.");
    }

    const prescribedIds = result.prescription.session.exercises.map(
      (prescribedExercise) => prescribedExercise.prescription.exerciseId,
    );
    // Compared as a SET. Since Lot H2.3 the prescribed array is the EXECUTION
    // order, which is a training decision; selection order is not. Every
    // selected exercise is still prescribed — that is what this asserts.
    expect([...prescribedIds].sort()).toEqual([...composedExerciseIds(makeInput(45, ["grip", "core"]))].sort());
    expect(prescribedIds.length).toBeGreaterThan(3);
  });

  test("each prescribed exercise takes a distinct session order", () => {
    const result = runEngine(makeInput(45, ["grip", "core"]));
    if (result.outcome !== "draft" || result.prescription?.status !== "prescribed") {
      throw new Error("Expected a prescribed draft.");
    }

    const orders = result.prescription.session.exercises.map((prescribedExercise) => prescribedExercise.order);
    expect(new Set(orders).size).toBe(orders.length);
  });
});

describe("session composition — Rule 32, redundancy", () => {
  test("two exercises sharing adaptation, pattern and loaded region are redundant", () => {
    const find = (id: string): ExerciseDefinition => {
      const definition = EXERCISE_KNOWLEDGE_BASE.find((entry) => entry.id === id);
      if (definition === undefined) {
        throw new Error(`${id} is expected in the knowledge base.`);
      }
      return definition;
    };

    // Same exercise compared with itself is the clearest redundancy.
    expect(isRedundantWith(find("bench_press"), find("bench_press"))).toBe(true);
  });

  test("a different adaptation is never redundant, whatever else it shares", () => {
    const strength = EXERCISE_KNOWLEDGE_BASE.find((entry) => entry.primaryAdaptation === "maximum_strength");
    const conditioning = EXERCISE_KNOWLEDGE_BASE.find((entry) => entry.primaryAdaptation === "conditioning");
    if (strength === undefined || conditioning === undefined) {
      throw new Error("Expected both adaptations in the knowledge base.");
    }
    expect(isRedundantWith(strength, conditioning)).toBe(false);
  });

  test("no composed module holds two exercises redundant with each other", () => {
    const result = runEngine(makeInput(45, ["grip", "core"]));
    if (result.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }

    for (const generatedModule of result.sessionDraft.modules) {
      const kept = generatedModule.exerciseSelection.candidates
        .filter((candidate) => candidate.selected)
        .map((candidate) => candidate.scoredExercise.exercise);

      for (let i = 0; i < kept.length; i += 1) {
        for (let j = i + 1; j < kept.length; j += 1) {
          expect(isRedundantWith(kept[j], kept[i]), `${kept[j].id} vs ${kept[i].id}`).toBe(false);
        }
      }
    }
  });
});

describe("session composition — the time budget", () => {
  test("a generous budget is never padded: the session stays under it", () => {
    const result = runEngine(makeInput(120, ["grip", "core"]));
    if (result.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }

    const generous = composedExerciseIds(makeInput(120, ["grip", "core"]));
    const normal = composedExerciseIds(makeInput(45, ["grip", "core"]));

    // Doubling the available time adds nothing — the Minimum Effective
    // Session Principle forbids growing a session because time remains.
    expect(generous).toEqual(normal);
    expect(result.sessionDraft.estimatedDurationMinutes).toBeLessThan(120);
  });

  test("an over-budget session gives up support work before primary work", () => {
    const roomy = runEngine(makeInput(45, ["grip", "core"]));
    const tight = runEngine(makeInput(25, ["grip", "core"]));
    if (roomy.outcome !== "draft" || tight.outcome !== "draft") {
      throw new Error("Expected drafts.");
    }

    const keptIn = (result: typeof tight, module: string): number =>
      result.sessionDraft.modules
        .filter((generatedModule) => generatedModule.selectedModule.module === module)
        .flatMap((generatedModule) => generatedModule.exerciseSelection.candidates.filter((c) => c.selected)).length;

    // Support modules are surrendered; the primary module is untouched.
    expect(keptIn(tight, "grip")).toBeLessThan(keptIn(roomy, "grip") + 1);
    expect(keptIn(tight, "grip") + keptIn(tight, "core")).toBe(0);
    expect(keptIn(tight, "strength")).toBe(keptIn(roomy, "strength"));
  });

  test("the reduced session actually fits, and says which exercises it gave up", () => {
    const result = runEngine(makeInput(25, ["grip", "core"]));
    if (result.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }

    expect(result.sessionDraft.estimatedDurationMinutes).toBeLessThanOrEqual(25);

    const removalEntries = result.decisionTrace.entries.filter((entry) =>
      entry.id.includes("time_budget_removed"),
    );
    expect(removalEntries.length).toBeGreaterThan(0);
    for (const entry of removalEntries) {
      expect(entry.stage).toBe("duration_validation");
      expect(entry.reasons.join(" ")).toContain("never shortened");
    }
  });

  test("the primary module is never emptied, even under an impossible budget", () => {
    const result = runEngine(makeInput(10, ["grip", "core"]));
    if (result.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }

    const strengthKept = result.sessionDraft.modules
      .filter((generatedModule) => generatedModule.selectedModule.role === "primary")
      .flatMap((generatedModule) => generatedModule.exerciseSelection.candidates.filter((c) => c.selected));

    expect(strengthKept.length).toBeGreaterThan(0);
  });

  test("doses are never trimmed to fit — only whole exercises are given up", () => {
    const roomy = runEngine(makeInput(45, ["grip", "core"]));
    const tight = runEngine(makeInput(25, ["grip", "core"]));
    if (
      roomy.outcome !== "draft" ||
      tight.outcome !== "draft" ||
      roomy.prescription?.status !== "prescribed" ||
      tight.prescription?.status !== "prescribed"
    ) {
      throw new Error("Expected prescribed drafts.");
    }

    const doseOf = (result: typeof tight, exerciseId: string) =>
      result.prescription?.status === "prescribed"
        ? result.prescription.session.exercises.find((e) => e.prescription.exerciseId === exerciseId)?.prescription
        : undefined;

    const roomyRow = doseOf(roomy, "chest_supported_row");
    const tightRow = doseOf(tight, "chest_supported_row");

    expect(tightRow).toBeDefined();
    expect(tightRow?.volume.sets).toBe(roomyRow?.volume.sets);
    expect(JSON.stringify(tightRow?.rest)).toBe(JSON.stringify(roomyRow?.rest));
  });
});

describe("session composition — outcome and conflict semantics for emptied modules", () => {
  test("a reduced session stays a prescribed draft — never blocked, never unavailable", () => {
    for (const minutes of [25, 15]) {
      const result = runEngine(makeInput(minutes, ["grip", "core"]));
      expect(result.outcome, `${minutes} min`).toBe("draft");
      if (result.outcome !== "draft") {
        throw new Error("Expected a draft.");
      }
      expect(result.prescription?.status, `${minutes} min`).toBe("prescribed");
    }
  });

  test("the emptied modules were EXPLICITLY REQUIRED, not automatically selected", () => {
    const result = runEngine(makeInput(25, ["grip", "core"]));
    if (result.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }

    // `moduleSelector.ts` produces role "support" in exactly one place: the
    // `request.requiredModules` loop. V0.1 has no auto-selected optional
    // support module, so an unsatisfied one is always something the caller
    // asked for — which is why a structured conflict is correct here.
    for (const module of ["grip", "core"] as const) {
      const selected = result.selectedModules.find((entry) => entry.module === module);
      expect(selected?.role).toBe("support");
      expect(selected?.reason).toBe("Explicitly required by the training request.");
    }
  });

  test("each emptied required module produces exactly one missing_data conflict", () => {
    const result = runEngine(makeInput(25, ["grip", "core"]));
    if (result.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }

    // Session adequacy also reports as `missing_data`, so this scenario is
    // filtered to the emptied-module conflicts it is actually about. The
    // adequacy conflict it now also raises is asserted in its own test below.
    const missing = result.conflicts.filter(
      (conflict) => conflict.type === "missing_data" && conflict.id.startsWith("missing_exercise_"),
    );
    expect(missing.map((conflict) => conflict.id).sort()).toEqual([
      "missing_exercise_core",
      "missing_exercise_grip",
    ]);
    for (const conflict of missing) {
      expect(conflict.severity).toBe("minor");
    }
  });

  test("the conflict states the real cause — the removal is never hidden behind 'no exercise selected'", () => {
    const result = runEngine(makeInput(25, ["grip", "core"]));
    if (result.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }

    const gripConflict = result.conflicts.find((conflict) => conflict.id === "missing_exercise_grip");
    expect(gripConflict?.description).toContain("was selected and prescribed, then given up");
    expect(gripConflict?.description).toContain("plate_pinch");
    // The pre-Lot-7 wording would have claimed nothing was ever selected.
    expect(gripConflict?.description).not.toContain("No exercise is selected");
  });

  test("conflicts and warnings agree — a conflict raised after the reduction reaches both", () => {
    const result = runEngine(makeInput(25, ["grip", "core"]));
    if (result.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }

    const minorDescriptions = result.conflicts
      .filter((conflict) => conflict.severity === "minor")
      .map((conflict) => conflict.description);

    expect(minorDescriptions.length).toBeGreaterThan(0);
    for (const description of minorDescriptions) {
      expect(result.decisionTrace.warnings).toContain(description);
    }
  });

  test("a module that keeps its exercise raises no emptied-module conflict at all", () => {
    const result = runEngine(makeInput(45, ["grip", "core"]));
    if (result.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }

    expect(
      result.conflicts.filter(
        (conflict) => conflict.type === "missing_data" && conflict.id.startsWith("missing_exercise_"),
      ),
    ).toEqual([]);
  });

  // This scenario's strength module used to be composed entirely of accessory
  // work (`chest_supported_row`, `neck_training`, `chin_up`) because score alone
  // decided the quota. Lot H2 detected that and reported it; Lot H2.1 secures a
  // prescribable driver first, so the module now holds one.
  test("the primary module secures an adaptation driver before accessories take the remaining slots", () => {
    const result = runEngine(makeInput(45, ["grip", "core"]));
    if (result.outcome !== "draft") {
      throw new Error("Expected a draft.");
    }

    expect(result.sessionAdequacy.primaryAdaptationCovered).toBe(true);
    expect(result.sessionAdequacy.drivingExerciseIds.length).toBeGreaterThan(0);
    expect(result.sessionAdequacy.status).not.toBe("inadequate");

    // No adequacy coverage conflict remains: the composition itself is correct,
    // rather than being correct only after a post-hoc repair.
    expect(
      result.conflicts.find((conflict) => conflict.id === "adequacy_primary_adaptation_coverage"),
    ).toBeUndefined();

    // The driver was SECURED first — it took the reserved slot rather than
    // whatever the score ranked highest. The order the session is PERFORMED in
    // is a separate question and is unchanged by this lot: the emitted module
    // still lists its exercises in ranked order.
    const primaryModule = result.sessionDraft.modules.find(
      (generatedModule) => generatedModule.selectedModule.role === "primary",
    );
    const keptIds = (primaryModule?.exerciseSelection.candidates ?? [])
      .filter((candidate) => candidate.selected)
      .map((candidate) => candidate.scoredExercise.exercise.id);
    expect(keptIds).toContain(result.sessionAdequacy.drivingExerciseIds[0]);

    // The accessory that used to occupy the slot on score alone is the one
    // deferred, and the reason says so.
    const driverCandidate = primaryModule?.exerciseSelection.candidates.find(
      (candidate) => candidate.scoredExercise.exercise.id === result.sessionAdequacy.drivingExerciseIds[0],
    );
    expect(driverCandidate?.selectionReasons.join(" ")).toContain("Secured first as this session's adaptation driver");
  });
});

describe("session composition — determinism", () => {
  test("two identical runs compose identically", () => {
    const input = makeInput(25, ["grip", "core"]);
    expect(JSON.stringify(runEngine(input))).toBe(JSON.stringify(runEngine(input)));
  });

  test("the input is never mutated by composition or reduction", () => {
    const input = makeInput(25, ["grip", "core"]);
    const before = JSON.stringify(input);
    runEngine(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
