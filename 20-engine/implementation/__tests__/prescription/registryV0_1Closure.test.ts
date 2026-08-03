/**
 * Combat Athlete System — Prescription Registry V0.1 Closure
 *
 * The executable form of `20-engine/36_REGISTRY_V0_1_CLOSURE.md`.
 *
 * The registry closes at 75 entries against a 76-exercise knowledge base.
 * `turkish_get_up` is the single exercise on the other side of that
 * boundary, and it is there by decision rather than by omission: its fiche
 * documents no inter-set rest while its only compatible method requires
 * one, its session role is undecidable, and no generic movement doctrine
 * exists to carry it.
 *
 * This file guards the closure itself — the counters, the identity of the
 * excluded exercise, the fact that it stays fully live at the knowledge-base
 * and selection layers, and the fact that no resolver has been special-cased
 * to work around any of it.
 *
 * It asserts no dose, no rest band and no role for `turkish_get_up`, because
 * none is documented. Adding one here would be inventing the very values
 * this closure exists to refuse.
 */

import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import { EXERCISE_KNOWLEDGE_BASE, TURKISH_GET_UP } from "../../exerciseKnowledgeBase";
import {
  EXERCISE_PRESCRIPTION_REGISTRY,
  PILOT_EXERCISE_IDS,
} from "../../prescription/exercisePrescriptionRegistry";
import { NUMERICAL_PRESCRIPTION_PROFILES } from "../../prescription/prescriptionKnowledge";
import { EQUIPMENT_CAPABILITY_IDS } from "../../prescription/equipmentCapabilities";

const EXCLUDED_EXERCISE_ID = "turkish_get_up";

const closureDocument = (): string =>
  readFileSync(new URL("../../../36_REGISTRY_V0_1_CLOSURE.md", import.meta.url), "utf-8");

const knowledgeBaseSource = (): string =>
  readFileSync(new URL("../../exerciseKnowledgeBase.ts", import.meta.url), "utf-8");

// -----------------------------------------------------------------------------
// 1-3. The closing state
// -----------------------------------------------------------------------------

describe("prescription registry V0.1 — closing state", () => {
  test("1. the four closing counters are 75 / 76 / 23 / 33", () => {
    expect(PILOT_EXERCISE_IDS).toHaveLength(75);
    expect(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)).toHaveLength(75);
    expect(EXERCISE_KNOWLEDGE_BASE).toHaveLength(76);
    expect(NUMERICAL_PRESCRIPTION_PROFILES).toHaveLength(23);
    expect(EQUIPMENT_CAPABILITY_IDS).toHaveLength(33);
  });

  test("2. turkish_get_up is the ONE exercise in the catalogue with no registry entry", () => {
    const registered = new Set(Object.keys(EXERCISE_PRESCRIPTION_REGISTRY));
    const unprescribable = EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id).filter(
      (id) => !registered.has(id),
    );

    expect(unprescribable).toEqual([EXCLUDED_EXERCISE_ID]);
    expect(EXERCISE_PRESCRIPTION_REGISTRY as Record<string, unknown>).not.toHaveProperty(
      EXCLUDED_EXERCISE_ID,
    );
    expect([...PILOT_EXERCISE_IDS]).not.toContain(EXCLUDED_EXERCISE_ID);
  });

  test("3. every registry entry still corresponds to a real ExerciseDefinition — the gap runs one way only", () => {
    const known = new Set(EXERCISE_KNOWLEDGE_BASE.map((exercise) => exercise.id));

    for (const id of Object.keys(EXERCISE_PRESCRIPTION_REGISTRY)) {
      expect(known.has(id), id).toBe(true);
    }
  });
});

// -----------------------------------------------------------------------------
// 4-5. The excluded exercise stays live everywhere else
// -----------------------------------------------------------------------------

describe("turkish_get_up — present in the knowledge base, absent from the registry", () => {
  test("4. the ExerciseDefinition is complete: module, laterality, equipment and contraindications all encoded", () => {
    expect(EXERCISE_KNOWLEDGE_BASE).toContain(TURKISH_GET_UP);
    expect(TURKISH_GET_UP.id).toBe(EXCLUDED_EXERCISE_ID);
    expect(TURKISH_GET_UP.module).toBe("movement");

    // Documented twice in the fiche ("# Movement Context: ... Unilateral"
    // and "1-5 repetitions per side"), never deduced from the biomechanics.
    expect(TURKISH_GET_UP.unilateral).toBe(true);

    // "Required: Kettlebell, or Dumbbell" — a literal "or".
    expect(TURKISH_GET_UP.requirements?.required).toEqual([
      {
        kind: "any_of",
        items: [
          { kind: "equipment", equipment: "kettlebell" },
          { kind: "equipment", equipment: "dumbbell" },
        ],
      },
    ]);

    // The safety layer reads these, and it does not need a registry entry.
    expect(TURKISH_GET_UP.contraindications).toHaveLength(4);
    expect(TURKISH_GET_UP.contraindications.every((c) => c.absolute)).toBe(true);
  });

  test("5. it is the only movement exercise that is unilateral and the only one requiring an external implement — so no second member of a family exists", () => {
    const movement = EXERCISE_KNOWLEDGE_BASE.filter((exercise) => exercise.module === "movement");
    expect(movement).toHaveLength(12);

    expect(movement.filter((exercise) => exercise.unilateral).map((e) => e.id)).toEqual([
      EXCLUDED_EXERCISE_ID,
    ]);

    const requiresImplement = movement.filter((exercise) =>
      (exercise.requirements?.required ?? []).some((clause) =>
        clause.items.some((item) => item.kind === "equipment" && item.equipment !== "mat"),
      ),
    );
    expect(requiresImplement.map((e) => e.id)).toEqual([EXCLUDED_EXERCISE_ID]);
  });
});

// -----------------------------------------------------------------------------
// 6-8. The closure is documented, and nothing was special-cased around it
// -----------------------------------------------------------------------------

describe("the closure is recorded in writing, not only in the counters", () => {
  test("6. the closure document states the counters, the excluded exercise and the three blockers", () => {
    const doc = closureDocument();

    expect(doc).toContain("ExercisePrescriptionRegistryEntry : 75");
    expect(doc).toContain("ExerciseDefinition                : 76");
    expect(doc).toContain(EXCLUDED_EXERCISE_ID);

    expect(doc).toContain("Blocker 1 — No Inter-Set Rest Is Documented");
    expect(doc).toContain("Blocker 2 — The Session Role Is Undecidable");
    expect(doc).toContain("Blocker 3 — No Doctrine Can Honestly Carry It");

    // The three layers the closure separates.
    expect(doc).toContain("## Knowledge Base");
    expect(doc).toContain("## Selection");
    expect(doc).toContain("## Numerical Prescription");

    // The blockage is a business matter, and the document says so.
    expect(doc).toContain("Why the Blockage Is A Business Matter, Not A Technical One");
    expect(doc).toContain("Conditions For A Future Integration");
  });

  test("7. the ExerciseDefinition's own comment block records the same three blockers and the decision", () => {
    const source = knowledgeBaseSource();
    const block = source.slice(
      source.indexOf("V0.1 REGISTRY CLOSURE"),
      source.indexOf("export const TURKISH_GET_UP"),
    );

    expect(block).toContain("straight_sets_repetitions");
    expect(block).toContain("2-5 sets, 1-5 repetitions");
    expect(block).toContain("repetitions_per_side");
    expect(block).toContain("technical_effort: high_quality");
    expect(block).toContain("any_of[kettlebell, dumbbell]");

    expect(block).toContain("BLOCKER 1 — NO INTER-SET REST IS DOCUMENTED");
    expect(block).toContain("BLOCKER 2 — THE SESSION ROLE IS UNDECIDABLE");
    expect(block).toContain("BLOCKER 3 — NO GENERIC MOVEMENT DOCTRINE EXISTS TO CARRY IT");
    expect(block).toContain("DECISION:");
    expect(block).toContain("36_REGISTRY_V0_1_CLOSURE.md");
  });

  test("8. no resolver, validator or registry file branches on the excluded exercise", () => {
    for (const file of [
      "resolveVolume.ts",
      "resolveIntensity.ts",
      "resolveRest.ts",
      "resolveTempo.ts",
      "resolveStopConditions.ts",
      "resolveMethod.ts",
      "resolveInstructions.ts",
      "prescribeExercise.ts",
      "prescribeSession.ts",
      "validateCompatibility.ts",
      "validatePrescription.ts",
      "registryValidators.ts",
      "exercisePrescriptionRegistry.ts",
    ]) {
      const source = readFileSync(new URL(`../../prescription/${file}`, import.meta.url), "utf-8");
      expect(source, file).not.toContain(EXCLUDED_EXERCISE_ID);
    }

    // `prescriptionKnowledge.ts` names it exactly once, and only in Table
    // Group 18's own comment, where it is cited as the counter-example to a
    // family that was found rather than invented. A citation in prose is not
    // a branch — but it is the one place the id may appear, so the shape of
    // the mention is pinned rather than merely allowed.
    const knowledge = readFileSync(
      new URL("../../prescription/prescriptionKnowledge.ts", import.meta.url),
      "utf-8",
    );
    const mentions = knowledge
      .split("\n")
      .filter((line) => line.includes(EXCLUDED_EXERCISE_ID));

    expect(mentions).toHaveLength(1);
    expect(mentions[0]!.trim().startsWith("//")).toBe(true);

    // And no profile was created on the triple this exercise would have
    // needed. The two movement profiles are named positively rather than by
    // filtering for `straight_sets_repetitions`: the type system already
    // narrows a movement profile's methodId to these two, so that comparison
    // does not even compile — a stronger guarantee than a runtime check, and
    // one this assertion is written to preserve rather than bypass.
    const movementProfiles = NUMERICAL_PRESCRIPTION_PROFILES.filter(
      (profile) => profile.moduleId === "movement",
    );
    expect(movementProfiles.map((profile) => profile.methodId).sort()).toEqual([
      "controlled_mobility_sets",
      "partner_grappling_rounds",
    ]);
  });
});
